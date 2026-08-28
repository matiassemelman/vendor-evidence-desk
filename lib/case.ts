export const CASE_ID = "CASE-NDC-001";
export const FIELD_NAMES = ["legal_name", "tax_id", "registered_address", "country", "primary_contact_email", "payment_currency", "payment_terms_days", "bank_account_last4"] as const;
export type FieldName = typeof FIELD_NAMES[number];
export type Evidence = { documentId: string; excerpt: string };
export type Candidate = { value: string; evidence: Evidence[] };
export type Extraction = { fields: { name: FieldName; candidates: Candidate[] }[] };
export type Packet = { caseId: string; synthetic: boolean; documents: { id: string; title: string; content: string }[]; replay: Extraction };
export type Inspection = { route: "ready_for_approval" | "needs_review" | "blocked"; issues: string[]; conflicts: FieldName[]; extraction: Extraction };
export type ApprovedRecord = { recordId: string; caseId: string; fields: Record<FieldName, string>; resolution: { field: FieldName; selected: string; reason: string } | null };

const exact = (value: object, keys: string[]) => Object.keys(value).sort().join() === [...keys].sort().join();
export function readExtraction(value: unknown): Extraction {
  if (!value || typeof value !== "object" || !exact(value, ["fields"]) || !Array.isArray((value as Extraction).fields)) throw new Error("Invalid model output");
  const fields = (value as Extraction).fields;
  if (fields.length !== FIELD_NAMES.length || new Set(fields.map((field) => field.name)).size !== FIELD_NAMES.length) throw new Error("Invalid field roster");
  for (const field of fields) {
    if (!field || !exact(field, ["name", "candidates"]) || !FIELD_NAMES.includes(field.name) || !Array.isArray(field.candidates) || field.candidates.length > 3) throw new Error("Invalid field proposal");
    for (const candidate of field.candidates) {
      const invalid = !candidate || !exact(candidate, ["value", "evidence"]) || typeof candidate.value !== "string"
        || !Array.isArray(candidate.evidence) || !candidate.evidence.length || candidate.evidence.length > 3;
      if (invalid) throw new Error("Invalid candidate");
      for (const evidence of candidate.evidence) {
        const invalidEvidence = !evidence || !exact(evidence, ["documentId", "excerpt"])
          || typeof evidence.documentId !== "string" || typeof evidence.excerpt !== "string";
        if (invalidEvidence) throw new Error("Invalid evidence");
      }
    }
  }
  return { fields };
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
  if (packet.caseId !== CASE_ID || !packet.synthetic) throw new Error("Case is not allowlisted");
  const extraction = readExtraction(raw), documents = new Map(packet.documents.map((document) => [document.id, document.content]));
  const issues: string[] = [], conflicts: FieldName[] = [];
  const bank = extraction.fields.find((field) => field.name === "bank_account_last4")!;
  for (const document of packet.documents) {
    const match = document.content.match(/Remittance account ending: (\d{4})/);
    if (match && !bank.candidates.some((candidate) => candidate.value === match[1])) {
      bank.candidates.push({ value: match[1], evidence: [{ documentId: document.id, excerpt: match[0] }] });
    }
  }
  for (const field of extraction.fields) {
    if (!field.candidates.length) issues.push(`missing:${field.name}`);
    const values = new Set<string>();
    for (const candidate of field.candidates) {
      values.add(candidate.value);
      if (!formatOk(field.name, candidate.value)) issues.push(`format:${field.name}`);
      const resolves = candidate.evidence.every((evidence) => documents.get(evidence.documentId)?.includes(evidence.excerpt));
      const supports = candidate.evidence.some((evidence) => evidence.excerpt.toLowerCase().includes(candidate.value.toLowerCase()));
      if (!resolves || !supports) issues.push(`ungrounded:${field.name}`);
    }
    if (values.size > 1) conflicts.push(field.name);
  }
  const route = issues.length ? "blocked" : conflicts.length ? "needs_review" : "ready_for_approval";
  return { route, issues: [...new Set(issues)], conflicts, extraction };
}

export function approve(packet: Packet, raw: unknown, selected = "", reason = ""): ApprovedRecord {
  const result = inspect(packet, raw);
  if (result.route === "blocked") throw new Error("Blocked cases cannot be approved");
  if (result.conflicts.some((name) => name !== "bank_account_last4")) throw new Error("Only the bank conflict can be resolved in this release");
  const bank = result.extraction.fields.find((field) => field.name === "bank_account_last4")!;
  if (result.route === "needs_review" && (!bank.candidates.some((candidate) => candidate.value === selected) || reason.trim().length < 12)) throw new Error("A supported selection and review reason are required");
  const fields = Object.fromEntries(result.extraction.fields.map((field) => [field.name, field.name === "bank_account_last4" && selected ? selected : field.candidates[0]?.value])) as Record<FieldName, string>;
  return { recordId: `ERP-${packet.caseId}`, caseId: packet.caseId, fields, resolution: selected ? { field: "bank_account_last4", selected, reason: reason.trim() } : null };
}
