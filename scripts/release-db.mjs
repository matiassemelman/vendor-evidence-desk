import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { isDeepStrictEqual } from "node:util";
import { Pool } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL, schema = process.env.RELEASE_DB_SCHEMA;
if (!url || process.env.RELEASE_DB_DISPOSABLE !== "YES" || !schema || !/^ved_release_[a-z0-9_]{8,40}$/.test(schema)) throw new Error("Release DB requires DATABASE_URL, RELEASE_DB_DISPOSABLE=YES and an isolated ved_release_* schema");
const pool = new Pool({ connectionString: url }), client = await pool.connect(), migration = await readFile(new URL("../schema.sql", import.meta.url), "utf8");
const assert = (truth, message) => { if (!truth) throw new Error(message); };
const seed = { recordId: "ERP-CASE-NDC-001", fixture: "legacy-release-gate" }, started = new Date().toISOString();
let report, phase = "create disposable schema";
try {
  await client.query(`create schema "${schema}"`); await client.query(`set search_path to "${schema}"`);
  await client.query("create table approved_cases (case_id text primary key check(case_id='CASE-NDC-001'), record jsonb not null, approved_at timestamptz not null default now())");
  await client.query("insert into approved_cases(case_id,record) values($1,$2)", ["CASE-NDC-001", seed]);
  const baseline = (await client.query("select case_id,record from approved_cases")).rows[0];
  phase = "migration rollback rehearsal"; await client.query("begin"); await client.query(migration); const rehearsal = (await client.query("select source,current_state,input_hash,decision_digest,analysis,approval_receipt,export_receipt,legacy_record from case_revisions")).rows[0]; await client.query("rollback");
  assert((await client.query("select to_regclass('approved_cases') as old,to_regclass('case_revisions') as next")).rows[0].old && !(await client.query("select to_regclass('case_revisions') as next")).rows[0].next, "Migration rollback did not restore the baseline");
  phase = "committed migration"; await client.query("begin"); await client.query(migration); await client.query("commit");
  const legacy = (await client.query("select source,current_state,input_hash,decision_digest,analysis,approval_receipt,export_receipt,legacy_record from case_revisions where source='legacy'")).rows[0];
  assert(isDeepStrictEqual(baseline.record, seed) && isDeepStrictEqual(legacy.legacy_record, seed), "Legacy payload changed");
  for (const row of [rehearsal, legacy]) assert(row.source === "legacy" && row.current_state === "legacy" && [row.input_hash,row.decision_digest,row.analysis,row.approval_receipt,row.export_receipt].every((value) => value === null), "Legacy row gained synthetic authority");

  process.env.DATABASE_SCHEMA = schema;
  const { insertRevision, createSuccessor, getRevision, approveAndExport } = await import("../lib/db.ts");
  const lineageId = randomUUID(), now = new Date().toISOString(), packet = (await import("../fixtures/case.json", { with: { type: "json" } })).default;
  const makeRevision = (revisionId, parentRevisionId) => ({ revisionId, lineageId, parentRevisionId, caseId: "CASE-NDC-001", scenario: "bank_conflict", documents: packet.documents, inputHash: "1".repeat(64), decisionDigest: "2".repeat(64), effectiveModel: { requested: "replay", id: "replay-fixture-v1", contract: { version: "document-analyzer/v1", schema: "fields-v1", reasoning: "low" } }, workers: [], result: { route: "needs_review", issues: [], conflicts: ["bank_account_last4"], extraction: packet.replay }, analysisEvents: [], lifecycle: { validity: "current" }, createdAt: now });
  phase = "application insert"; const parent = makeRevision(randomUUID(), null); await insertRevision(parent);
  const children = [makeRevision(randomUUID(), parent.revisionId), makeRevision(randomUUID(), parent.revisionId)];
  phase = "application CAS"; const cas = await Promise.all(children.map((child) => createSuccessor(parent.revisionId, child)));
  assert(cas.filter((item) => item.created).length === 1, "CAS did not produce one successor and one conflict");
  const winner = children[cas.findIndex((item) => item.created)], storedParent = await getRevision(parent.revisionId), storedChild = await getRevision(winner.revisionId);
  assert(storedParent?.lifecycle.validity === "superseded" && storedChild?.lifecycle.validity === "current", "CAS lifecycle is inconsistent");
  const receipt = { receiptId: `APPROVAL-${randomUUID()}`, revisionId: winner.revisionId, lineageId, decisionDigest: winner.decisionDigest, selected: "4421", reason: "The profile is the current authoritative source.", approvedAt: now, export: { receiptId: `MOCK-${randomUUID()}`, exportedAt: now, mode: "mock_erp" } };
  phase = "application approval/export"; const approvals = await Promise.all([approveAndExport(winner.revisionId,lineageId,winner.decisionDigest,receipt.selected,receipt.reason,receipt), approveAndExport(winner.revisionId,lineageId,winner.decisionDigest,receipt.selected,receipt.reason,receipt)]);
  assert(approvals.filter((item) => !item.repeated).length === 1 && approvals.every((item) => item.receipt.receiptId === receipt.receiptId), "Approval/export was not exactly idempotent");
  assert((await client.query(`select count(*)::int as count from "${schema}".case_revisions where approval_receipt is not null and export_receipt is not null`)).rows[0].count === 1, "Database stored more than one receipt");
  report = { started, completed: new Date().toISOString(), schema, migrationRollback: "PASS", legacyFidelity: "PASS", cas: { successors: 1, conflicts: 1 }, approvalExport: { writes: 1, exactRepeat: "PASS" }, cleanup: "pending" };
} catch (error) { error.message = `${phase}: ${error.message}`; throw error; } finally {
  delete process.env.DATABASE_SCHEMA; await client.query("reset search_path").catch(() => {}); await client.query(`drop schema if exists "${schema}" cascade`).then(() => { if (report) report.cleanup = "PASS"; }); client.release(); await pool.end();
}
await mkdir(new URL("../.omx/artifacts/", import.meta.url), { recursive: true });
await writeFile(new URL(`../.omx/artifacts/release-db-${schema}.json`, import.meta.url), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
