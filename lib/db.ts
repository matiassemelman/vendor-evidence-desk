import { neon } from "@neondatabase/serverless";
import type { ApprovalReceipt, CaseRevision, LifecycleFacts } from "./case";

const local = new Map<string, CaseRevision>();
const sql = () => process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;
const analysis = (revision: CaseRevision) => { const { lifecycle, ...immutable } = revision; void lifecycle; return immutable; };
const row = (value: { analysis: unknown; lifecycle: unknown; current_state: unknown }): CaseRevision => { const revision = ({ ...(typeof value.analysis === "string" ? JSON.parse(value.analysis) : value.analysis) as Omit<CaseRevision, "lifecycle">, lifecycle: (typeof value.lifecycle === "string" ? JSON.parse(value.lifecycle) : value.lifecycle) as LifecycleFacts }); if (revision.lifecycle.validity !== value.current_state) throw new Error("Invalid persisted lifecycle"); return revision; };
const receiptMatches = (receipt: ApprovalReceipt, selected: string, reason: string) => receipt.selected === selected && receipt.reason === reason;
const receiptFrom = (revision: CaseRevision): ApprovalReceipt | undefined => revision.lifecycle.approval && revision.lifecycle.export ? { receiptId: revision.lifecycle.approval.receiptId, revisionId: revision.revisionId, lineageId: revision.lineageId, decisionDigest: revision.decisionDigest, selected: revision.lifecycle.approval.selected, reason: revision.lifecycle.approval.reason, approvedAt: revision.lifecycle.approval.approvedAt, export: revision.lifecycle.export } : undefined;

export async function insertRevision(revision: CaseRevision) {
  const db = sql();
  if (!db) { local.set(revision.revisionId, structuredClone(revision)); return false; }
  await db`insert into case_revisions (revision_id, case_id, lineage_id, parent_revision_id, input_hash, decision_digest, analysis, lifecycle, current_state, source) values (${revision.revisionId}, ${revision.caseId}, ${revision.lineageId}, ${revision.parentRevisionId}, ${revision.inputHash}, ${revision.decisionDigest}, ${JSON.stringify(analysis(revision))}::jsonb, ${JSON.stringify(revision.lifecycle)}::jsonb, 'current', 'analysis')`;
  return true;
}
export async function getRevision(revisionId: string) {
  const db = sql();
  if (!db) return local.get(revisionId) ? structuredClone(local.get(revisionId)!) : undefined;
  const rows = await db`select analysis, lifecycle, current_state from case_revisions where revision_id = ${revisionId}`;
  return rows[0] ? row(rows[0] as { analysis: unknown; lifecycle: unknown; current_state: unknown }) : undefined;
}
export async function createSuccessor(parentRevisionId: string, child: CaseRevision) {
  const db = sql(), parent = await getRevision(parentRevisionId);
  if (!parent || parent.lineageId !== child.lineageId || parent.lifecycle.validity !== "current") return { persisted: Boolean(db), created: false };
  if (!db) {
    const current = local.get(parentRevisionId);
    if (!current || current.lineageId !== child.lineageId || current.lifecycle.validity !== "current") return { persisted: false, created: false };
    current.lifecycle.validity = "superseded"; current.lifecycle.supersededAt = new Date().toISOString(); local.set(parentRevisionId, current); local.set(child.revisionId, structuredClone(child));
    return { persisted: false, created: true };
  }
  const supersededAt = new Date().toISOString();
  const result = await db`with superseded as (
    update case_revisions set current_state = 'superseded', lifecycle = lifecycle || ${JSON.stringify({ validity: "superseded", supersededAt })}::jsonb
    where revision_id = ${parentRevisionId} and lineage_id = ${child.lineageId} and current_state = 'current' returning revision_id
  ), inserted as (
    insert into case_revisions (revision_id, case_id, lineage_id, parent_revision_id, input_hash, decision_digest, analysis, lifecycle, current_state, source)
    select ${child.revisionId}, ${child.caseId}, ${child.lineageId}, ${child.parentRevisionId}, ${child.inputHash}, ${child.decisionDigest}, ${JSON.stringify(analysis(child))}::jsonb, ${JSON.stringify(child.lifecycle)}::jsonb, 'current', 'analysis' from superseded returning revision_id
  ) select revision_id from inserted`;
  return { persisted: true, created: result.length === 1 };
}
export async function approveAndExport(revisionId: string, lineageId: string, decisionDigest: string, selected: string, reason: string, receipt: ApprovalReceipt) {
  const db = sql(), current = await getRevision(revisionId);
  if (!current || current.lineageId !== lineageId || current.decisionDigest !== decisionDigest) throw new Error("Revision capability is stale or invalid");
  const historical = receiptFrom(current);
  if (historical) { if (!receiptMatches(historical, selected, reason)) throw new Error("Approval receipt conflicts with this revision"); return { receipt: historical, persisted: Boolean(db), repeated: true }; }
  if (current.lifecycle.validity !== "current") throw new Error("Revision is superseded");
  if (!db) {
    const stored = local.get(revisionId)!;
    if (stored.lifecycle.approval) { const prior = receiptFrom(stored)!; if (!receiptMatches(prior, selected, reason)) throw new Error("Approval receipt conflicts with this revision"); return { receipt: prior, persisted: false, repeated: true }; }
    stored.lifecycle.approval = { selected, reason, approvedAt: receipt.approvedAt, receiptId: receipt.receiptId, decisionDigest };
    stored.lifecycle.export = receipt.export; local.set(revisionId, stored); return { receipt, persisted: false, repeated: false };
  }
  const lifecycle = { ...current.lifecycle, approval: { selected, reason, approvedAt: receipt.approvedAt, receiptId: receipt.receiptId, decisionDigest }, export: receipt.export };
  const updated = await db`update case_revisions set lifecycle = ${JSON.stringify(lifecycle)}::jsonb, approval_receipt = ${JSON.stringify(receipt)}::jsonb, export_receipt = ${JSON.stringify(receipt.export)}::jsonb where revision_id = ${revisionId} and lineage_id = ${lineageId} and decision_digest = ${decisionDigest} and current_state = 'current' and approval_receipt is null returning revision_id`;
  if (updated.length) return { receipt, persisted: true, repeated: false };
  const after = await getRevision(revisionId), prior = after && receiptFrom(after);
  if (prior && receiptMatches(prior, selected, reason)) return { receipt: prior, persisted: true, repeated: true };
  throw new Error("Approval receipt conflicts with this revision");
}
