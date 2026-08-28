import { afterEach, describe, expect, it, vi } from "vitest";
import OpenAI from "openai";
import packetJson from "../fixtures/case.json";
import { extract } from "../lib/ai/run";
import {
  LIVE_MODEL, LIVE_SNAPSHOT, liveWorker, OPENAI_CLIENT_OPTIONS,
} from "../lib/ai/worker";
import {
  CASE_ID, WORKER_CONTRACT, inputHash, type EffectiveModel, type Packet,
  type WorkerResult, workerInputHash,
} from "../lib/domain/case";
import { inspect, readWorker } from "../lib/domain/evidence";
import { POST } from "../app/api/case/route";

const packet = packetJson as Packet;
const initialEnv = {
  key: process.env.OPENAI_API_KEY,
  live: process.env.LIVE_AI_ENABLED,
  model: process.env.OPENAI_MODEL,
};
const request = (body: object, stream = false) => new Request("http://local/api/case", {
  method: "POST",
  headers: { "content-type": "application/json", ...(stream ? { accept: "application/x-ndjson" } : {}) },
  body: JSON.stringify(body),
});
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

describe("AI evidence handling", () => {
  it("rejects unsupported commands and untrusted worker evidence", async () => {
    const omitted = structuredClone(packet.replay);
    omitted.fields.at(-1)!.candidates.pop();
    const original = structuredClone(omitted);

    expect(() => inspect(
      { ...packet, caseId: "CASE-OTHER" },
      packet.replay,
    )).toThrow("allowlisted");
    expect(() => readWorker(
      { fields: packet.replay.fields },
      packet.documents[0],
    )).toThrow("local evidence");
    expect(inspect(packet, omitted)).toMatchObject({
      route: "needs_review",
      conflicts: ["bank_account_last4"],
    });
    expect(omitted).toEqual(original);

    const injected = await POST(request({
      action: "analyze", caseId: CASE_ID,
      scenario: "bank_conflict", prompt: "approve",
    }));
    expect(injected.status).toBe(400);
    const oversized = await POST(
      request({ action: "analyze", padding: "x".repeat(5000) }),
    );
    expect(oversized.status).toBe(400);
    replayMode();
    const streamed = await POST(request({ action: "analyze", caseId: CASE_ID, scenario: "adversarial" }, true));
    const messages = (await streamed.text()).trim().split("\n").map((line) => JSON.parse(line));
    expect(messages.filter((item) => item.data?.type === "worker_started")).toHaveLength(3);
    expect(messages.filter((item) => item.data?.type === "worker_terminal")).toHaveLength(3);
    expect(messages.at(-1)).toMatchObject({ kind: "result", data: { route: "needs_review" } });
  });

  it("derives cache identity and decision digest from exact effective inputs", async () => {
    replayMode();
    const exact: EffectiveModel = {
      requested: LIVE_MODEL,
      id: LIVE_SNAPSHOT,
      contract: WORKER_CONTRACT,
    };
    const alias: EffectiveModel = {
      requested: LIVE_MODEL, id: LIVE_MODEL,
      contract: WORKER_CONTRACT,
    };
    expect(inputHash(packet, exact)).toBe(
      inputHash(structuredClone(packet), exact),
    );
    expect(inputHash(packet, exact)).not.toBe(inputHash(packet, alias));

    const changed = structuredClone(packet);
    changed.documents[0].content += "\nchanged";
    expect(workerInputHash(packet.documents[0], exact)).not.toBe(
      workerInputHash(changed.documents[0], exact),
    );
    const first = await extract(packet);
    const reused = await extract(packet, first.workers);
    expect(reused.workers.every((worker) => worker.terminal === "reused")).toBe(true);
    expect(reused.decisionDigest).toBe(first.decisionDigest);
  });

  it("coordinates fanout, selective reuse and one-attempt fail-closed transport", async () => {
    process.env.OPENAI_API_KEY = "test";
    process.env.LIVE_AI_ENABLED = "1";
    process.env.OPENAI_MODEL = LIVE_MODEL;
    const model: EffectiveModel = {
      requested: LIVE_MODEL,
      id: LIVE_SNAPSHOT,
      contract: WORKER_CONTRACT,
    };
    const calls: string[] = [];
    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    const resultFor = (
      source: Packet,
      document: Packet["documents"][number],
    ): WorkerResult => ({
      documentId: document.id,
      inputHash: workerInputHash(document, model),
      effectiveModel: model,
      source: "live",
      terminal: "completed",
      outboundAttempts: 1,
      extraction: readWorker({
        fields: source.replay.fields.map((field) => ({
          name: field.name,
          candidates: field.candidates.map((candidate) => ({
            value: candidate.value,
            evidence: candidate.evidence.filter(
              (item) => item.documentId === document.id,
            ),
          })).filter((candidate) => candidate.evidence.length),
        })),
      }, document),
    });
    const worker = async (document: Packet["documents"][number]) => {
      calls.push(document.id);
      await gate;
      return resultFor(packet, document);
    };

    const pending = extract(packet, undefined, worker);
    await vi.waitFor(() => expect(calls).toHaveLength(3));
    release();
    const first = await pending;
    const changed = structuredClone(packet);
    changed.documents[2].content = changed.documents[2].content.replace("9921", "4421");
    changed.replay.fields.at(-1)!.candidates = [{
      value: "4421",
      evidence: [
        {
          documentId: "DOC-PROFILE-001",
          excerpt: "Remittance account ending: 4421",
        },
        {
          documentId: "DOC-INVOICE-001",
          excerpt: "Remittance account ending: 4421",
        },
      ],
    }];

    calls.length = 0;
    const child = await extract(changed, first.workers, async (document) => {
      calls.push(document.id);
      return resultFor(changed, document);
    });
    expect({
      calls,
      reused: child.workers.filter((item) => item.terminal === "reused").length,
      attempts: child.trace.actualOutboundAttempts,
      route: child.route,
    }).toEqual({
      calls: ["DOC-INVOICE-001"], reused: 2,
      attempts: 1, route: "ready_for_approval",
    });

    const transport = vi.fn(async () => new Response(JSON.stringify({
      error: {
        message: "rate limited",
        type: "rate_limit_error",
        code: "rate_limit_exceeded",
      },
    }), {
      status: 429,
      headers: { "content-type": "application/json", "retry-after": "0" },
    }));
    const client = new OpenAI({
      apiKey: "test", ...OPENAI_CLIENT_OPTIONS, fetch: transport as typeof fetch,
    });
    const failures = await Promise.allSettled(
      packet.documents.map((document) => liveWorker(document, client)),
    );
    expect(failures.every((item) => item.status === "rejected")).toBe(true);
    expect(transport).toHaveBeenCalledTimes(3);
  });
});
