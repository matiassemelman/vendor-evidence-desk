import {
  FIELD_NAMES, digest, inputHash,
  type AnalysisEvent, type EffectiveModel, type Inspection, type Packet,
  type WorkerResult,
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
): Promise<Run> {
  const started = Date.now();
  const live = Boolean(
    process.env.OPENAI_API_KEY && process.env.LIVE_AI_ENABLED === "1",
  );
  const model = live ? LIVE_EFFECTIVE_MODEL : REPLAY_MODEL;
  if (live && process.env.OPENAI_MODEL !== LIVE_MODEL) {
    throw new Error("OPENAI_MODEL must be the exact release snapshot");
  }

  const prior = new Map(previous.map((worker) => [worker.documentId, worker]));
  const tasks = packet.documents.map((document) => {
    const cached = prior.get(document.id);
    if (canReuse(cached, document, model)) return reuseWorker(cached!);
    return live ? analyze(document) : replayWorker(packet, document);
  });
  const workers = await Promise.all(tasks);
  const result = reduce(packet, workers);
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
  const source = live ? "live" as const : "replay" as const;
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
