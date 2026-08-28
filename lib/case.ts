import { createHash } from "node:crypto";

export const CASE_ID = "CASE-NDC-001";
export const FIELD_NAMES = ["legal_name", "tax_id", "registered_address", "country", "primary_contact_email", "payment_currency", "payment_terms_days", "bank_account_last4"] as const;
export const WORKER_CONTRACT = { version: "document-analyzer/v1", schema: "fields-v1", reasoning: "low" } as const;
export type FieldName = typeof FIELD_NAMES[number];
export type Document = { id: string; title: string; content: string };
export type Evidence = { documentId: string; excerpt: string };
export type Candidate = { value: string; evidence: Evidence[] };
export type Extraction = { fields: { name: FieldName; candidates: Candidate[] }[] };
export type Packet = { caseId: string; synthetic: boolean; documents: Document[]; replay: Extraction };
export type Inspection = { route: "ready_for_approval" | "needs_review" | "blocked"; issues: string[]; conflicts: FieldName[]; extraction: Extraction };
export type EffectiveModel = { requested: string; id: string; contract: typeof WORKER_CONTRACT };
export type WorkerResult = { documentId: string; inputHash: string; effectiveModel: EffectiveModel; source: "live" | "replay"; terminal: "completed" | "reused"; outboundAttempts: 0 | 1; extraction: Extraction; provider?: { responseId: string; requestId?: string; status?: string; usage?: { input: number; output: number; total: number }; latencyMs: number } };
export type AnalysisEvent = { revisionId: string; sequence: number; type: "input_selected" | "workers_dispatched" | "worker_terminal" | "reducer_completed"; source: "server" | "live" | "replay"; at: string; facts: Record<string, unknown> };
export type LifecycleFacts = { validity: "current" | "superseded" | "legacy"; supersededAt?: string; approval?: { selected: string; reason: string; approvedAt: string; receiptId: string; decisionDigest: string }; export?: { receiptId: string; exportedAt: string; mode: "mock_erp" } };
export type CaseRevision = { revisionId: string; lineageId: string; parentRevisionId: string | null; caseId: string; scenario: string; documents: Document[]; inputHash: string; decisionDigest: string; effectiveModel: EffectiveModel; workers: WorkerResult[]; result: Inspection; analysisEvents: AnalysisEvent[]; lifecycle: LifecycleFacts; createdAt: string };
export type ApprovalReceipt = { receiptId: string; revisionId: string; lineageId: string; decisionDigest: string; selected: string; reason: string; approvedAt: string; export: NonNullable<LifecycleFacts["export"]> };

const exact = (value: object, keys: string[]) => Object.keys(value).sort().join() === [...keys].sort().join();
const clone = (extraction: Extraction): Extraction => ({ fields: extraction.fields.map((field) => ({ name: field.name, candidates: field.candidates.map((candidate) => ({ value: candidate.value, evidence: candidate.evidence.map((evidence) => ({ ...evidence })) })) })) });
export const canonicalJson = (value: unknown): string => {
  if (value === null || typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number") { if (!Number.isFinite(value)) throw new Error("Non-canonical number"); return JSON.stringify(value); }
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (!value || typeof value !== "object") throw new Error("Non-canonical value");
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson((value as Record<string, unknown>)[key])}`).join(",")}}`;
};
export const digest = (value: unknown) => createHash("sha256").update(canonicalJson(value)).digest("hex");
export const workerInputHash = (document: Document, effectiveModel: EffectiveModel) => digest({ document, workerContract: WORKER_CONTRACT, effectiveModel });
export const inputHash = (packet: Packet, effectiveModel: EffectiveModel) => digest({ caseId: packet.caseId, workers: packet.documents.map((document) => ({ documentId: document.id, inputHash: workerInputHash(document, effectiveModel) })) });

export function readExtraction(value: unknown): Extraction {
  if (!value || typeof value !== "object" || !exact(value, ["fields"]) || !Array.isArray((value as Extraction).fields)) throw new Error("Invalid model output");
  const fields = (value as Extraction).fields;
  if (fields.length !== FIELD_NAMES.length || new Set(fields.map((field) => field.name)).size !== FIELD_NAMES.length) throw new Error("Invalid field roster");
  for (const field of fields) {
    if (!field || !exact(field, ["name", "candidates"]) || !FIELD_NAMES.includes(field.name) || !Array.isArray(field.candidates) || field.candidates.length > 3) throw new Error("Invalid field proposal");
    for (const candidate of field.candidates) {
      const invalid = !candidate || !exact(candidate, ["value", "evidence"]) || typeof candidate.value !== "string" || !Array.isArray(candidate.evidence) || !candidate.evidence.length || candidate.evidence.length > 3;
      if (invalid) throw new Error("Invalid candidate");
      for (const evidence of candidate.evidence) if (!evidence || !exact(evidence, ["documentId", "excerpt"]) || typeof evidence.documentId !== "string" || typeof evidence.excerpt !== "string") throw new Error("Invalid evidence");
    }
  }
  return clone({ fields });
}

export function readWorker(value: unknown, document: Document): Extraction {
  const extraction = readExtraction(value);
  for (const field of extraction.fields) for (const candidate of field.candidates) for (const evidence of candidate.evidence) if (evidence.documentId !== document.id || !document.content.includes(evidence.excerpt)) throw new Error("Invalid local evidence");
  return extraction;
}
const formatOk = (name: FieldName, value: string) => {
  if (name === "primary_contact_email") return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  if (name === "tax_id") return /^\d{2}-\d{7}$/.test(value);
  if (name === "payment_currency") return /^[A-Z]{3}$/.test(value);
  if (name === "payment_terms_days") return /^\d{1,3}$/.test(value);
  if (name === "bank_account_last4") return /^\d{4}$/.test(value);
  return Boolean(value.trim());
};
export function inspect(packet: Packet, raw: unknown): Inspection {
  if (packet.caseId !== CASE_ID || !packet.synthetic || packet.documents.length !== 3 || new Set(packet.documents.map((document) => document.id)).size !== packet.documents.length) throw new Error("Case is not allowlisted");
  const extraction = readExtraction(raw), documents = new Map(packet.documents.map((document) => [document.id, document.content]));
  const issues: string[] = [], conflicts: FieldName[] = [], bank = extraction.fields.find((field) => field.name === "bank_account_last4")!;
  for (const document of packet.documents) { const match = document.content.match(/Remittance account ending: (\d{4})/); if (match && !bank.candidates.some((candidate) => candidate.value === match[1])) bank.candidates.push({ value: match[1], evidence: [{ documentId: document.id, excerpt: match[0] }] }); }
  for (const field of extraction.fields) {
    if (!field.candidates.length) issues.push(`missing:${field.name}`);
    const values = new Set<string>();
    for (const candidate of field.candidates) {
      values.add(field.name === "legal_name" ? candidate.value.toLowerCase().replace(/[,\.\s]/g, "") : candidate.value);
      if (!formatOk(field.name, candidate.value)) issues.push(`format:${field.name}`);
      if (!candidate.evidence.every((evidence) => documents.get(evidence.documentId)?.includes(evidence.excerpt)) || !candidate.evidence.some((evidence) => evidence.excerpt.toLowerCase().includes(candidate.value.toLowerCase()))) issues.push(`ungrounded:${field.name}`);
    }
    if (values.size > 1) conflicts.push(field.name);
  }
  return { route: issues.length ? "blocked" : conflicts.length ? "needs_review" : "ready_for_approval", issues: [...new Set(issues)], conflicts, extraction };
}
export function reduce(packet: Packet, workers: WorkerResult[]): Inspection {
  if (workers.length !== packet.documents.length || new Set(workers.map((worker) => worker.documentId)).size !== packet.documents.length) throw new Error("Incomplete worker packet");
  return inspect(packet, { fields: FIELD_NAMES.map((name) => {
    const merged = new Map<string, Candidate>();
    for (const candidate of workers.flatMap((worker) => worker.extraction.fields.find((field) => field.name === name)!.candidates)) merged.set(canonicalJson({ value: candidate.value, evidence: candidate.evidence }), candidate);
    return { name, candidates: [...merged.values()].slice(0, 3) };
  }) });
}
