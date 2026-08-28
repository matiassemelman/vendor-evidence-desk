import { createHmac, timingSafeEqual } from "node:crypto";
import packetJson from "../../../fixtures/case.json";
import { approve, type Extraction, type Packet } from "../../../lib/case";
import { extract } from "../../../lib/ai";
import { persist } from "../../../lib/db";

export const runtime = "nodejs";
const packet = packetJson as Packet;
const exact = (body: object, keys: string[]) => Object.keys(body).sort().join() === [...keys].sort().join();
const secret = () => {
  if (process.env.APP_SIGNING_SECRET) return process.env.APP_SIGNING_SECRET;
  if (process.env.DATABASE_URL) throw new Error("APP_SIGNING_SECRET is required with persistence");
  return "local-preview-only";
};
const sign = (extraction: Extraction) => {
  const payload = Buffer.from(JSON.stringify(extraction)).toString("base64url");
  return `${payload}.${createHmac("sha256", secret()).update(payload).digest("base64url")}`;
};
const verify = (token: unknown) => {
  if (typeof token !== "string") throw new Error("Invalid approval proof");
  const [payload, signature] = token.split("."), expected = createHmac("sha256", secret()).update(payload).digest("base64url");
  if (!signature || signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) throw new Error("Invalid approval proof");
  return JSON.parse(Buffer.from(payload, "base64url").toString()) as Extraction;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body || typeof body !== "object" || body.caseId !== packet.caseId) throw new Error("Case is not allowlisted");
    if (body.action === "analyze" && exact(body, ["action", "caseId"])) {
      const run = await extract(packet);
      return Response.json({ ...run, proof: sign(run.extraction) });
    }
    if (body.action === "approve" && exact(body, ["action", "caseId", "proof", "selected", "reason"])) {
      const record = approve(packet, verify(body.proof), body.selected, body.reason), persisted = await persist(record);
      return Response.json({ record, persisted, exportMode: persisted ? "mock_erp" : "preview", approvedAt: new Date().toISOString() });
    }
    throw new Error("Unsupported command shape");
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Request failed" }, { status: 400 });
  }
}
