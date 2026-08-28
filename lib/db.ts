import { neon } from "@neondatabase/serverless";
import type { ApprovedRecord } from "./case";

export async function persist(record: ApprovedRecord) {
  if (!process.env.DATABASE_URL) return false;
  const sql = neon(process.env.DATABASE_URL);
  await sql`insert into approved_cases (case_id, record) values (${record.caseId}, ${record}) on conflict (case_id) do update set record = excluded.record, approved_at = now()`;
  return true;
}
