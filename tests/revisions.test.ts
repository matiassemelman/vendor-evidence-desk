import { afterEach, describe, expect, it } from "vitest";
import { CASE_ID } from "../lib/domain/case";
import { LIVE_MODEL } from "../lib/ai/worker";
import { getRevision } from "../lib/db";
import { POST } from "../app/api/case/route";

const initialEnv = {
  key: process.env.OPENAI_API_KEY,
  live: process.env.LIVE_AI_ENABLED,
  model: process.env.OPENAI_MODEL,
};
const request = (body: object) => new Request("http://local/api/case", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});
const analyze = async (body: object) =>
  (await POST(request({ action: "analyze", caseId: CASE_ID, ...body }))).json();
const replayMode = () => {
  delete process.env.OPENAI_API_KEY;
  process.env.LIVE_AI_ENABLED = "0";
  process.env.OPENAI_MODEL = LIVE_MODEL;
};
const restoreEnv = (name: string, value: string | undefined) => {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
};
afterEach(() => {
  restoreEnv("OPENAI_API_KEY", initialEnv.key);
  restoreEnv("LIVE_AI_ENABLED", initialEnv.live);
  restoreEnv("OPENAI_MODEL", initialEnv.model);
});

describe("case revisions", () => {
  it("allows one same-parent successor and isolates anonymous lineages", async () => {
    replayMode();
    const first = await analyze({ scenario: "bank_conflict" });
    const command = {
      action: "analyze",
      caseId: CASE_ID,
      analysisCapability: first.analysisCapability,
      documentChange: {
        documentId: "DOC-INVOICE-001", variant: "align_profile",
      },
    };
    const contenders = await Promise.all([
      POST(request(command)),
      POST(request(command)),
    ]);
    expect(contenders.map((item) => item.status).sort()).toEqual([200, 409]);

    const staleApproval = await POST(request({
      action: "approve_and_export",
      analysisCapability: first.analysisCapability,
      selected: "4421",
      reason: "The profile is the current authoritative source.",
    }));
    expect(staleApproval.status).toBe(409);
    const other = await analyze({ scenario: "clean" });
    expect(other.revision.lineageId).not.toBe(first.revision.lineageId);
    expect(
      (await getRevision(other.revision.revisionId))?.lifecycle.validity,
    ).toBe("current");
  });

  it("persists immutable approval and an idempotent export receipt by revision", async () => {
    replayMode();
    const first = await analyze({ scenario: "bank_conflict" });
    const approval = {
      action: "approve_and_export",
      analysisCapability: first.analysisCapability,
      selected: "4421",
      reason: "The profile is the current authoritative source.",
    };
    expect((await POST(
      request({ ...approval, reason: "x".repeat(501) }),
    )).status).toBe(400);

    const saved = await (await POST(request(approval))).json();
    const repeated = await (await POST(request(approval))).json();
    expect(repeated).toMatchObject({
      approvalReceipt: saved.approvalReceipt, repeated: true,
    });
    const child = await analyze({
      analysisCapability: first.analysisCapability,
      documentChange: {
        documentId: "DOC-INVOICE-001", variant: "align_profile",
      },
    });

    const historical = await (await POST(request(approval))).json();
    expect(historical.approvalReceipt).toEqual(saved.approvalReceipt);
    const changedDecision = await POST(request({
      ...approval,
      reason: "A different decision must never overwrite history.",
    }));
    expect(changedDecision.status).toBe(409);
    expect(await getRevision(first.revision.revisionId)).toMatchObject({
      lifecycle: {
        validity: "superseded",
        approval: { receiptId: saved.approvalReceipt.receiptId },
      },
    });
    expect(await getRevision(child.revision.revisionId)).toMatchObject({
      parentRevisionId: first.revision.revisionId,
      lifecycle: { validity: "current" },
    });
  });
});
