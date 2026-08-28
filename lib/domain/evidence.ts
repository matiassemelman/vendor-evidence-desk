import {
  CASE_ID, FIELD_NAMES, canonicalJson,
  type Candidate, type Extraction, type FieldName, type Inspection,
  type Packet, type WorkerResult,
} from "./case";

const hasExactKeys = (value: object, keys: string[]) =>
  Object.keys(value).sort().join() === [...keys].sort().join();

const cloneExtraction = (extraction: Extraction): Extraction => ({
  fields: extraction.fields.map((field) => ({
    name: field.name,
    candidates: field.candidates.map((candidate) => ({
      value: candidate.value,
      evidence: candidate.evidence.map((proof) => ({ ...proof })),
    })),
  })),
});

export function readExtraction(value: unknown): Extraction {
  const invalidRoot = !value || typeof value !== "object"
    || !hasExactKeys(value, ["fields"])
    || !Array.isArray((value as Extraction).fields);
  if (invalidRoot) throw new Error("Invalid model output");

  const fields = (value as Extraction).fields;
  const invalidRoster = fields.length !== FIELD_NAMES.length
    || new Set(fields.map((field) => field.name)).size !== FIELD_NAMES.length;
  if (invalidRoster) throw new Error("Invalid field roster");

  for (const field of fields) {
    const invalidField = !field || !hasExactKeys(field, ["name", "candidates"])
      || !FIELD_NAMES.includes(field.name) || !Array.isArray(field.candidates)
      || field.candidates.length > 3;
    if (invalidField) throw new Error("Invalid field proposal");

    for (const candidate of field.candidates) {
      const invalidCandidate = !candidate
        || !hasExactKeys(candidate, ["value", "evidence"])
        || typeof candidate.value !== "string" || !Array.isArray(candidate.evidence)
        || !candidate.evidence.length || candidate.evidence.length > 3;
      if (invalidCandidate) throw new Error("Invalid candidate");

      for (const proof of candidate.evidence) {
        const invalidEvidence = !proof
          || !hasExactKeys(proof, ["documentId", "excerpt"])
          || typeof proof.documentId !== "string"
          || typeof proof.excerpt !== "string";
        if (invalidEvidence) throw new Error("Invalid evidence");
      }
    }
  }
  return cloneExtraction({ fields });
}

export function readWorker(value: unknown, document: Packet["documents"][number]) {
  const extraction = readExtraction(value);
  for (const field of extraction.fields) {
    for (const candidate of field.candidates) {
      for (const proof of candidate.evidence) {
        const isLocal = proof.documentId === document.id
          && document.content.includes(proof.excerpt);
        if (!isLocal) throw new Error("Invalid local evidence");
      }
    }
  }
  return extraction;
}

const formatIsValid = (name: FieldName, value: string) => {
  if (name === "primary_contact_email") {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }
  if (name === "tax_id") return /^\d{2}-\d{7}$/.test(value);
  if (name === "payment_currency") return /^[A-Z]{3}$/.test(value);
  if (name === "payment_terms_days") return /^\d{1,3}$/.test(value);
  if (name === "bank_account_last4") return /^\d{4}$/.test(value);
  return Boolean(value.trim());
};

const normalizeValue = (name: FieldName, value: string) =>
  name === "legal_name"
    ? value.toLowerCase().replace(/[,\.\s]/g, "")
    : value.trim();

const addBankCandidatesFromDocuments = (packet: Packet, extraction: Extraction) => {
  const bank = extraction.fields.find(
    (field) => field.name === "bank_account_last4",
  )!;
  for (const document of packet.documents) {
    const match = document.content.match(/Remittance account ending: (\d{4})/);
    if (match && !bank.candidates.some((item) => item.value === match[1])) {
      bank.candidates.push({
        value: match[1],
        evidence: [{ documentId: document.id, excerpt: match[0] }],
      });
    }
  }
};

export function inspect(packet: Packet, raw: unknown): Inspection {
  const isAllowlisted = packet.caseId === CASE_ID && packet.synthetic
    && packet.documents.length === 3
    && new Set(packet.documents.map((document) => document.id)).size
      === packet.documents.length;
  if (!isAllowlisted) throw new Error("Case is not allowlisted");

  const extraction = readExtraction(raw);
  const documents = new Map(
    packet.documents.map((document) => [document.id, document.content]),
  );
  const issues: string[] = [];
  const conflicts: FieldName[] = [];
  addBankCandidatesFromDocuments(packet, extraction);

  for (const field of extraction.fields) {
    if (!field.candidates.length) issues.push(`missing:${field.name}`);
    const values = new Set<string>();
    for (const candidate of field.candidates) {
      values.add(normalizeValue(field.name, candidate.value));
      if (!formatIsValid(field.name, candidate.value)) {
        issues.push(`format:${field.name}`);
      }
      const exactExcerpts = candidate.evidence.every((proof) =>
        documents.get(proof.documentId)?.includes(proof.excerpt)
      );
      const valueAppears = candidate.evidence.some((proof) =>
        proof.excerpt.toLowerCase().includes(candidate.value.toLowerCase())
      );
      if (!exactExcerpts || !valueAppears) issues.push(`ungrounded:${field.name}`);
    }
    if (values.size > 1) conflicts.push(field.name);
  }

  const route = issues.length ? "blocked"
    : conflicts.length ? "needs_review"
    : "ready_for_approval";
  return { route, issues: [...new Set(issues)], conflicts, extraction };
}

const mergeCandidates = (name: FieldName, workers: WorkerResult[]) => {
  const merged = new Map<string, Candidate>();
  const candidates = workers.flatMap((worker) =>
    worker.extraction.fields.find((field) => field.name === name)!.candidates
  );
  for (const candidate of candidates) {
    const key = normalizeValue(name, candidate.value);
    const prior = merged.get(key);
    if (!prior) {
      merged.set(key, structuredClone(candidate));
      continue;
    }
    prior.evidence = [...new Map(
      [...prior.evidence, ...candidate.evidence].map((item) =>
        [canonicalJson(item), item]
      ),
    ).values()];
  }
  return [...merged.values()].slice(0, 3);
};

export function reduce(packet: Packet, workers: WorkerResult[]): Inspection {
  const incomplete = workers.length !== packet.documents.length
    || new Set(workers.map((worker) => worker.documentId)).size
      !== packet.documents.length;
  if (incomplete) throw new Error("Incomplete worker packet");
  return inspect(packet, {
    fields: FIELD_NAMES.map((name) => ({
      name,
      candidates: mergeCandidates(name, workers),
    })),
  });
}
