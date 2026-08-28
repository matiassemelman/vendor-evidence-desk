import {
  FIELD_NAMES, digest, inputHash,
  type AnalysisEvent, type EffectiveModel, type Inspection, type Packet,
  type RunProgress, type WorkerResult,
} from "../domain/case";
import { reduce } from "../domain/evidence";
import {
  LIVE_EFFECTIVE_MODEL, LIVE_MODEL, REPLAY_MODEL, canReuse, liveWorker,
  replayWorker, reuseWorker,
} from "./worker";

export type TraceCore = {
  source: "live" | "replay";
  attempt: "not_attempted" | "completed";
  latencyMs: number;
  actualOutboundAttempts: number;
  documentIds: string[];
  proposal: { fields: number; candidates: number; evidence: number };
  verifiedFields: number;
  ruleAddedCandidates: number;
  model?: string;
  usage?: { input: number; output: number; total: number };
  reason?: "disabled";
};
export type Run = Inspection & {
  inputHash: string; decisionDigest: string; effectiveModel: EffectiveModel;
  workers: WorkerResult[];
  analysisEvents: Omit<AnalysisEvent, "revisionId">[];
  trace: TraceCore;
};

const proposalTotals = (workers: WorkerResult[]) => {
  const fields = workers.flatMap((worker) => worker.extraction.fields);
  const candidates = fields.flatMap((field) => field.candidates);
  return {
    fields: fields.length,
    candidates: candidates.length,
    evidence: candidates.reduce(
      (total, candidate) => total + candidate.evidence.length,
      0,
    ),
  };
};

const usageTotals = (workers: WorkerResult[]) => workers.reduce(
  (total, worker) => ({
    input: total.input + (worker.provider?.usage?.input || 0),
    output: total.output + (worker.provider?.usage?.output || 0),
    total: total.total + (worker.provider?.usage?.total || 0),
  }),
  { input: 0, output: 0, total: 0 },
);

export async function extract(
  packet: Packet,
  previous: WorkerResult[] = [],
  analyze = liveWorker,
  report?: (event: RunProgress) => void,
): Promise<Run> {
  const started = Date.now();
  const live = Boolean(
    process.env.OPENAI_API_KEY && process.env.LIVE_AI_ENABLED === "1",
  );
  const model = live ? LIVE_EFFECTIVE_MODEL : REPLAY_MODEL;
  const source = live ? "live" as const : "replay" as const;
  const emit = (event: Omit<RunProgress, "at">) => report?.({ ...event, at: new Date().toISOString() });
  if (live && process.env.OPENAI_MODEL !== LIVE_MODEL) {
    throw new Error("OPENAI_MODEL must be the exact release snapshot");
  }

  emit({ type: "input_selected", source });
  emit({ type: "workers_dispatched", source, detail: `${packet.documents.length} document-local workers` });
  const prior = new Map(previous.map((worker) => [worker.documentId, worker]));
  const tasks = packet.documents.map(async (document) => {
    const cached = prior.get(document.id);
    emit({ type: "worker_started", source, documentId: document.id, status: "running" });
    try {
      const worker = canReuse(cached, document, model) ? reuseWorker(cached!) : live ? await analyze(document) : replayWorker(packet, document);
      const totals = proposalTotals([worker]);
      emit({ type: "worker_terminal", source: worker.source, documentId: document.id, status: worker.terminal, detail: `${totals.candidates} candidates · ${totals.evidence} excerpts` });
      return worker;
    } catch (error) { emit({ type: "worker_terminal", source, documentId: document.id, status: "failed", detail: error instanceof Error ? error.message : "Worker failed" }); throw error; }
  });
  const workers = await Promise.all(tasks);
  emit({ type: "reducer_started", source: "server", status: "running" });
  const result = reduce(packet, workers);
  emit({ type: "reducer_completed", source: "server", status: "completed", detail: result.route });
  const outboundAttempts = workers.reduce(
    (total, worker) => total + worker.outboundAttempts,
    0,
  );
  const computedInputHash = inputHash(packet, model);
  const decisionDigest = digest({
    workers: workers.map((worker) => ({
      documentId: worker.documentId,
      extraction: worker.extraction,
    })),
    result,
  });
  const at = new Date().toISOString();
  const analysisEvents: Omit<AnalysisEvent, "revisionId">[] = [
    {
      sequence: 1, type: "input_selected", source: "server", at,
      facts: {
        caseId: packet.caseId,
        documentIds: packet.documents.map((document) => document.id),
        inputHash: computedInputHash,
      },
    },
    {
      sequence: 2, type: "workers_dispatched", source, at,
      facts: {
        workerCount: workers.length,
        actualOutboundAttempts: outboundAttempts,
      },
    },
    ...workers.map((worker, index) => ({
      sequence: index + 3, type: "worker_terminal" as const,
      source: worker.source, at,
      facts: {
        documentId: worker.documentId,
        terminal: worker.terminal,
        outboundAttempts: worker.outboundAttempts,
        reused: worker.terminal === "reused",
      },
    })),
    {
      sequence: workers.length + 3, type: "reducer_completed",
      source: "server", at,
      facts: {
        route: result.route,
        issues: result.issues,
        conflicts: result.conflicts,
        decisionDigest,
      },
    },
  ];
  const issueFields = new Set(
    result.issues.map((issue) => issue.split(":")[1]),
  );

  return {
    ...result,
    inputHash: computedInputHash,
    decisionDigest,
    effectiveModel: model,
    workers,
    analysisEvents,
    trace: {
      source,
      attempt: live ? "completed" : "not_attempted",
      latencyMs: Date.now() - started,
      actualOutboundAttempts: outboundAttempts,
      documentIds: packet.documents.map((document) => document.id),
      proposal: proposalTotals(workers),
      verifiedFields: FIELD_NAMES.length - issueFields.size,
      ruleAddedCandidates: 0,
      ...(live
        ? { model: LIVE_MODEL, usage: usageTotals(workers) }
        : { reason: "disabled" as const }),
    },
  };
}
