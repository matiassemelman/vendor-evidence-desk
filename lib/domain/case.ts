import { createHash } from "node:crypto";

export const CASE_ID = "CASE-NDC-001";
export const FIELD_NAMES = [
  "legal_name", "tax_id", "registered_address", "country",
  "primary_contact_email", "payment_currency", "payment_terms_days",
  "bank_account_last4",
] as const;
export const WORKER_CONTRACT = {
  version: "document-analyzer/v1", schema: "fields-v1", reasoning: "low",
} as const;

export type FieldName = (typeof FIELD_NAMES)[number];
export type Document = { id: string; title: string; content: string };
export type Evidence = { documentId: string; excerpt: string };
export type Candidate = { value: string; evidence: Evidence[] };
export type Extraction = {
  fields: { name: FieldName; candidates: Candidate[] }[];
};
export type Packet = {
  caseId: string; synthetic: boolean; documents: Document[]; replay: Extraction;
};
export type Inspection = {
  route: "ready_for_approval" | "needs_review" | "blocked";
  issues: string[]; conflicts: FieldName[]; extraction: Extraction;
};
export type EffectiveModel = {
  requested: string; id: string; contract: typeof WORKER_CONTRACT;
};
export type WorkerResult = {
  documentId: string;
  inputHash: string;
  effectiveModel: EffectiveModel;
  source: "live" | "replay";
  terminal: "completed" | "reused";
  outboundAttempts: 0 | 1;
  extraction: Extraction;
  provider?: {
    responseId: string; requestId?: string; status?: string; latencyMs: number;
    usage?: { input: number; output: number; total: number };
  };
};
export type AnalysisEvent = {
  revisionId: string; sequence: number;
  type: "input_selected" | "workers_dispatched" | "worker_terminal" | "reducer_completed";
  source: "server" | "live" | "replay"; at: string; facts: Record<string, unknown>;
};
export type RunProgress = {
  type: "input_selected" | "workers_dispatched" | "worker_started" | "worker_terminal" | "reducer_started" | "reducer_completed";
  source: "server" | "live" | "replay"; at: string;
  documentId?: string; status?: "running" | "completed" | "reused" | "failed"; detail?: string;
};
export type LifecycleFacts = {
  validity: "current" | "superseded" | "legacy";
  supersededAt?: string;
  approval?: {
    selected: string; reason: string; approvedAt: string;
    receiptId: string; decisionDigest: string;
  };
  export?: { receiptId: string; exportedAt: string; mode: "mock_erp" };
};
export type CaseRevision = {
  revisionId: string; lineageId: string; parentRevisionId: string | null;
  caseId: string; scenario: string; documents: Document[];
  inputHash: string; decisionDigest: string; effectiveModel: EffectiveModel;
  workers: WorkerResult[]; result: Inspection; analysisEvents: AnalysisEvent[];
  lifecycle: LifecycleFacts; createdAt: string;
};
export type ApprovalReceipt = {
  receiptId: string; revisionId: string; lineageId: string; decisionDigest: string;
  selected: string; reason: string; approvedAt: string;
  export: NonNullable<LifecycleFacts["export"]>;
};

export const canonicalJson = (value: unknown): string => {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("Non-canonical number");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (!value || typeof value !== "object") throw new Error("Non-canonical value");
  const entries = Object.keys(value).sort().map((key) =>
    `${JSON.stringify(key)}:${canonicalJson((value as Record<string, unknown>)[key])}`
  );
  return `{${entries.join(",")}}`;
};

export const digest = (value: unknown) =>
  createHash("sha256").update(canonicalJson(value)).digest("hex");

export const workerInputHash = (
  document: Document,
  effectiveModel: EffectiveModel,
) => digest({ document, workerContract: WORKER_CONTRACT, effectiveModel });

export const inputHash = (packet: Packet, effectiveModel: EffectiveModel) =>
  digest({
    caseId: packet.caseId,
    workers: packet.documents.map((document) => ({
      documentId: document.id,
      inputHash: workerInputHash(document, effectiveModel),
    })),
  });
