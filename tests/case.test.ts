import { describe, expect, it } from "vitest";
import packetJson from "../fixtures/case.json";
import { approve, inspect, type Packet } from "../lib/case";
import { POST } from "../app/api/case/route";

const packet = packetJson as Packet;
describe("authority boundaries", () => {
  it("rejects a case outside the allowlist", () => expect(() => inspect({ ...packet, caseId: "CASE-OTHER" }, packet.replay)).toThrow("allowlisted"));
  it("rejects malformed or fabricated model output", () => {
    expect(() => inspect(packet, { fields: packet.replay.fields.slice(1) })).toThrow("roster");
    const forged = structuredClone(packet.replay); forged.fields[0].candidates[0].value = "Fabricated Supplier LLC";
    expect(inspect(packet, forged).route).toBe("blocked");
  });
  it("restores an omitted document-level bank contradiction", () => {
    const omitted = structuredClone(packet.replay); omitted.fields.at(-1)!.candidates.pop(); omitted.fields[0].candidates.push({ value: "Northstar Demo Components, LLC", evidence: [{ documentId: "DOC-AGREEMENT-001", excerpt: "Northstar Demo Components, LLC" }] });
    expect(inspect(packet, omitted)).toMatchObject({ route: "needs_review", conflicts: ["bank_account_last4"] });
  });
  it("blocks approval without a supported choice and reason", () => expect(() => approve(packet, packet.replay)).toThrow("reason"));
  it("exports only the exact server-issued extraction", async () => {
    const request = (body: object) => new Request("http://local/api/case", { method: "POST", body: JSON.stringify(body) });
    const run = await (await POST(request({ action: "analyze", caseId: packet.caseId }))).json();
    expect(run.trace).toMatchObject({ source: "replay", attempt: "not_attempted", proposal: { fields: 8 }, verifiedFields: 8 });
    expect(run.trace).not.toHaveProperty("model");
    const command = { action: "approve", caseId: packet.caseId, proof: run.proof, selected: "4421", reason: "The profile is current; the invoice is stale." };
    expect((await POST(request({ ...command, proof: `${run.proof}x` }))).status).toBe(400);
    expect(await (await POST(request(command))).json()).toMatchObject({ record: { recordId: "ERP-CASE-NDC-001" }, exportMode: "preview" });
  });
});
