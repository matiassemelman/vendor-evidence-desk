const repo = "https://github.com/matiassemelman/vendor-evidence-desk/blob/main/";
const claims = [
  {
    claim: "AI output is grounded, not trusted",
    visible: "Inspect a worker's exact source, candidates and excerpts",
    deep: "Strict output and local evidence resolution",
    file: "lib/ai/worker.ts",
  },
  {
    claim: "The model never owns the route",
    visible: "The bank mismatch survives as a human gate",
    deep: "Deterministic grounding, merge and routing",
    file: "lib/domain/evidence.ts",
  },
  {
    claim: "Selective reanalysis saves actual calls",
    visible: "Two workers report reused and zero calls after one document changes",
    deep: "Input and model identity-based reuse",
    file: "lib/ai/run.ts",
  },
  {
    claim: "Approval is bound to one exact revision",
    visible: "The receipt names the revision; its successor requires review",
    deep: "Signed capability, lifecycle persistence and regressions",
    file: "tests/revisions.test.ts",
  },
  {
    claim: "Evaluation evidence stays honest",
    visible: "Live and replay are labeled; limitations remain public",
    deep: "Five live cases and a calibrated LLM judge",
    file: "evals/run.ts",
  },
];

const claimTable = [
  "### Claim to proof matrix",
  "",
  "| Public claim | Visible proof | Deep proof |",
  "|---|---|---|",
  ...claims.map((item) =>
    `| ${item.claim} | ${item.visible} | [${item.deep}](../../${item.file}) |`
  ),
].join("\n");

export const META = {
  title: "Vendor Evidence Desk",
  artifactUrl: "https://vendor-evidence-desk.vercel.app/architecture",
  sourcePath: "docs/architecture/atlas/data.mjs",
  buildCmd: "pnpm atlas:build",
  stats: [
    { k: "Release", v: "portfolio · 2026-08-28" },
    { k: "AI roles", v: "3 workers + 1 judge" },
  ],
  intro: "_This walkthrough and its text twin are generated from one reviewed architecture source._",
  onePara: "Vendor Evidence Desk prepares a supplier record from three synthetic documents. Three AI workers propose document-local facts with exact excerpts; deterministic code validates and routes; a person resolves consequential ambiguity and approves one exact revision. Changing one document creates an immutable successor and reuses only workers whose input and effective model identities still match.",
  costModel: [
    "The three-worker product path uses GPT-4.1 mini and measured US$0.001752 per case in the verified suite: 95.2% below the prior all-GPT-5.5 baseline.",
    "GPT-5.5 is reserved for one calibrated offline judge batch. The full five-case suite measured US$0.063389: 73.8% below baseline.",
    "Token-derived release estimates are regression evidence, not a representative production-cost claim.",
  ],
  deepDive: claimTable,
  platformGives: "Next.js supplies the web and server boundary; OpenAI Responses supplies structured model output; Neon supplies PostgreSQL transport.",
  weOwn: "Allowlisted inputs, evidence verification, deterministic routing, human authority, revision identity, selective reuse, receipts and evaluation semantics.",
  filesystem: `app/desk.tsx                 guided reviewer surface
app/api/case/route.ts       command and authority boundary
lib/ai/worker.ts            one document-local analyzer
lib/ai/run.ts               parallel run and selective reuse
lib/domain/evidence.ts      grounding and deterministic route
lib/db.ts                   immutable revision lifecycle
tests/                      five authority regressions
evals/run.ts                five live cases and LLM judge`,
};

export const DECISIONS = [
  { axis: "Input", decision: "One synthetic allowlisted case; no public uploads or prompts.", adr: "[Release limits](../../README.md#limits)" },
  { axis: "AI", decision: "One worker per document, strict output, no tools and no provider retry.", adr: "[Evaluation design](../EVALS.md)" },
  { axis: "Models", decision: "GPT-4.1 mini handles bounded extraction; GPT-5.5 is reserved for the calibrated offline judge.", adr: "[Model routing](../MODEL_ROUTING.md)" },
  { axis: "Authority", decision: "AI proposes, deterministic code routes and only a person approves.", adr: "[Build process](../BUILD_PROCESS.md)" },
  { axis: "Change", decision: "A changed document creates a successor; reuse requires exact input and model identity.", adr: "[Release contract](../../README.md#engineering-choices)" },
  { axis: "Evidence", decision: "Five focused tests and five live evals protect visible claims without implying scale.", adr: "[Evaluation design](../EVALS.md)" },
];

export const GROUPS = [
  { id: "path", title: "The guided case" },
  { id: "authority", title: "Authority boundaries" },
  { id: "state", title: "Revision and side effect" },
  { id: "proof", title: "Release evidence" },
];

export const NODES = [
  {
    id: "U", code: "U", name: "Case Lab", short: "CASE LAB", group: "path",
    gx: 1, gy: 7, w: 2.5, d: 2, h: 42, kind: "screen",
    one: "The guided surface where a reviewer runs and inspects one fixed case.",
    what: "It exposes the completed worker trace, evidence, exception, human decision and revision history without simulating live progress.",
    how: "<code>app/desk.tsx</code> renders the run returned by one server route and labels live work, replay and preview memory separately.",
    steps: [["Choose", "Select one of three fixed pressure tests."], ["Analyze", "Send the allowlisted case ID and scenario."], ["Inspect", "Open workers, evidence and events."], ["Decide", "Choose a grounded value and record a reason."]],
    cond: [{ q: "Can a visitor submit arbitrary documents or instructions?", r: "No. Public input is the fixed CASE-NDC-001 scenario contract (2026-08-28)." }],
  },
  {
    id: "D", code: "D", name: "Synthetic packet", short: "DOCUMENTS", group: "path",
    gx: 4, gy: 5, w: 2.4, d: 2.4, h: 22, kind: "cards",
    one: "Three fictional supplier documents form the complete input boundary.",
    what: "A profile, agreement and sample invoice contain eight supplier fields and a deliberate 4421 / 9921 bank conflict.",
    how: "<code>fixtures/case.json</code> is loaded server-side; scenario changes are allowlisted transformations in <code>app/api/case/route.ts</code>.",
    steps: [["Load", "Resolve CASE-NDC-001 on the server."], ["Variant", "Apply only a clean, conflict or adversarial fixture change."], ["Dispatch", "Give each worker exactly one document."]],
    cond: [],
  },
  {
    id: "W", code: "W", name: "Document workers", short: "3 WORKERS", group: "path",
    gx: 8, gy: 2, w: 3.2, d: 3.2, h: 68, kind: "tall",
    one: "Three bounded analyzers propose facts from one document each.",
    what: "Workers cannot see the full case, call tools, approve, route or export. Their only job is to return eight field slots with local candidates and exact excerpts.",
    how: "<code>lib/ai/worker.ts</code> uses GPT-4.1 mini through OpenAI Responses with strict JSON Schema and <code>maxRetries: 0</code>; <code>lib/ai/run.ts</code> runs the three workers concurrently.",
    steps: [["Hash", "Bind the document and effective model identity."], ["Call or reuse", "Invoke once, load labeled replay or reuse a matching result."], ["Parse", "Reject output outside the exact eight-field contract."], ["Return", "Emit candidates, evidence and provider facts."]],
    cond: [{ q: "Why does each analyzer see only one document?", r: "It limits instruction scope and makes changed-document reuse independently verifiable (2026-08-28)." }],
  },
  {
    id: "G", code: "G", name: "Evidence gate", short: "GROUNDING", group: "authority",
    gx: 12.5, gy: 3.5, w: 2.2, d: 2.2, h: 42, kind: "gate",
    one: "Model-shaped output becomes usable only after exact local grounding.",
    what: "Every cited excerpt must exist inside the same document seen by that worker. Missing, fabricated, cross-document or malformed evidence fails closed.",
    how: "<code>readWorker</code> in <code>lib/domain/evidence.ts</code> checks the closed schema, exact document ID and literal excerpt before reduction.",
    steps: [["Shape", "Require the exact field and candidate keys."], ["Roster", "Require all eight field slots."], ["Locality", "Resolve every excerpt against the worker's document."], ["Fail closed", "Reject the worker result before case routing."]],
    cond: [],
  },
  {
    id: "R", code: "R", name: "Deterministic reducer", short: "REDUCER", group: "authority",
    gx: 16, gy: 6, w: 3.5, d: 2.5, h: 25, kind: "slab",
    one: "Code, not model confidence, merges proposals and chooses the route.",
    what: "Equivalent values merge with their evidence; formats and excerpts are checked again; disagreements remain visible as conflicts.",
    how: "<code>reduce</code> and <code>inspect</code> in <code>lib/domain/evidence.ts</code> produce only ready_for_approval, needs_review or blocked.",
    steps: [["Merge", "Canonicalize equivalent candidates across workers."], ["Validate", "Check required fields, formats and exact evidence."], ["Preserve", "Keep multiple grounded bank values."], ["Route", "Derive one deterministic terminal route."]],
    cond: [{ q: "Why not let the model pick the most confident bank value?", r: "Confidence cannot grant authority over a consequential conflict; the route remains needs_review (2026-08-28)." }],
  },
  {
    id: "H", code: "H", name: "Human review", short: "HUMAN GATE", group: "authority",
    gx: 13.5, gy: 10, w: 2.5, d: 2.5, h: 46, kind: "gate",
    one: "A person resolves the bank conflict and supplies an accountable reason.",
    what: "The reviewer can choose only a grounded candidate. Blocked cases and unsupported values never become approvable through this surface.",
    how: "A signed HMAC capability binds <code>revisionId</code>, <code>lineageId</code> and <code>decisionDigest</code>; <code>app/api/case/route.ts</code> validates it before approval.",
    steps: [["Review", "Compare grounded bank candidates and their sources."], ["Select", "Choose one candidate already present in evidence."], ["Explain", "Record a 12–500 character reason."], ["Bind", "Attach the decision to the exact signed revision."]],
    cond: [{ q: "Can the AI approve or silently resolve the conflict?", r: "No. The model has no approval path; only the explicit reviewer command can bind a decision (2026-08-28)." }],
  },
  {
    id: "V", code: "V", name: "Revision ledger", short: "REVISIONS", group: "state",
    gx: 9, gy: 12.5, w: 3, d: 3, h: 25, kind: "store",
    one: "Immutable analysis is paired with a small, exact lifecycle record.",
    what: "One revision is current at a time. A changed document creates a successor; the prior approval and receipt remain historical instead of being rewritten.",
    how: "<code>lib/db.ts</code> stores one JSON analysis snapshot plus lifecycle state in Neon, with local preview memory only when DATABASE_URL is absent.",
    steps: [["Insert", "Persist the immutable analysis snapshot."], ["Approve", "Write the matching approval and mock receipt once."], ["Supersede", "Atomically invalidate the parent and insert its successor."], ["Read", "Hydrate analysis plus current lifecycle."]],
    cond: [{ q: "What happens when an approved document changes?", r: "The prior revision becomes superseded and the new successor starts without approval (2026-08-28)." }],
  },
  {
    id: "X", code: "X", name: "Mock export receipt", short: "MOCK EXPORT", group: "state",
    gx: 4, gy: 12.5, w: 2.4, d: 2.4, h: 32, kind: "box",
    one: "A simulated ERP receipt records the approved revision without claiming a real integration.",
    what: "The release demonstrates revision-bound and idempotent side-effect semantics, but deliberately performs no network call to a real ERP.",
    how: "<code>approveAndExport</code> stores one approval/export receipt for the exact revision and returns the same receipt for an identical repeat.",
    steps: [["Check", "Require the current matching revision and digest."], ["Record", "Persist the approval and mock export receipt together."], ["Repeat", "Return the prior receipt for the same decision."], ["Reject", "Fail conflicting or superseded attempts."]],
    cond: [{ q: "Does this prove production ERP delivery?", r: "No. The public limitation is explicit: this is a mock receipt, not a real ERP integration (2026-08-28)." }],
  },
  {
    id: "E", code: "E", name: "Evaluation suite", short: "EVAL SUITE", group: "proof",
    gx: 18, gy: 11.5, w: 2.4, d: 2.4, h: 34, kind: "job",
    one: "Five fixed live cases exercise the routes and authority boundaries.",
    what: "The suite covers clean evidence, conflict, missing data, prompt injection and fabricated evidence without presenting five examples as an accuracy benchmark.",
    how: "<code>evals/run.ts</code> runs five cases through three live workers and records identities, hashes, usage, latency, routes and decision digests.",
    steps: [["Run", "Execute five fixed inputs with live document workers."], ["Assert", "Check deterministic route and authority facts."], ["Batch", "Send compact outputs plus anchors to the judge."], ["Report", "Write a local evidence report with no accuracy claim."]],
    cond: [],
  },
  {
    id: "J", code: "J", name: "Calibrated LLM judge", short: "LLM JUDGE", group: "proof",
    gx: 21.5, gy: 8, w: 2.5, d: 2.5, h: 52, kind: "tall",
    one: "A separate model adds one bounded qualitative check to deterministic evals.",
    what: "The judge receives reduced outputs and human-labeled positive and negative anchors. Anchor failure invalidates the judge batch.",
    how: "The GPT-5.5 judge call in <code>evals/run.ts</code> uses strict output, one batch and calibrated anchors; deterministic route assertions remain primary.",
    steps: [["Calibrate", "Include one known pass and one known fail anchor."], ["Judge", "Evaluate all five reduced outputs in one batch."], ["Validate", "Require both anchors to classify correctly."], ["Combine", "Report judge and deterministic verdicts separately."]],
    cond: [{ q: "Does a 5/5 judge result prove model accuracy at scale?", r: "No. It is a fixed regression signal over synthetic cases, explicitly not an accuracy claim (2026-08-28)." }],
  },
];

export const FLOWS = [
  {
    id: "case", name: "Conflict to human decision", hops: [
      ["U", "D", "analyze command", { representative: true, caseId: "CASE-NDC-001", scenario: "bank_conflict" }, "yx"],
      ["D", "W", "three local documents", { representative: true, documents: 3 }, "xy"],
      ["W", "G", "structured candidates", { representative: true, workers: 3, tools: 0 }, "xy"],
      ["G", "R", "grounded batch", { representative: true, fields: 8 }, "yx"],
      ["R", "H", "needs_review", { representative: true, conflict: ["4421", "9921"] }, "xy"],
      ["H", "V", "signed decision", { representative: true, selected: "4421", reason: "reviewer supplied" }, "xy"],
      ["V", "X", "approved revision", { representative: true, revisionBound: true }, "yx"],
      ["X", "V", "mock receipt", { representative: true, mode: "mock_erp" }, "xy"],
      ["V", "U", "lifecycle", { representative: true, validity: "current", approved: true }, "yx"],
    ],
  },
  {
    id: "change", name: "Change one document", hops: [
      ["U", "D", "allowlisted invoice change", { representative: true, documentId: "DOC-INVOICE-001" }, "yx"],
      ["V", "W", "prior worker identities", { representative: true, priorWorkers: 3 }, "xy"],
      ["D", "W", "changed invoice", { representative: true, changedDocuments: 1 }, "xy"],
      ["W", "R", "selective result", { representative: true, reused: 2, completed: 1 }, "xy"],
      ["R", "H", "new review", { representative: true, approvalCarried: false }, "yx"],
      ["H", "V", "successor decision", { representative: true, parentSuperseded: true }, "xy"],
    ],
  },
  {
    id: "eval", name: "Live evaluation", hops: [
      ["E", "W", "five cases", { representative: true, cases: 5, liveWorkers: 15 }, "xy"],
      ["W", "R", "grounded outputs", { representative: true, routes: 5 }, "yx"],
      ["R", "E", "deterministic verdicts", { representative: true, primary: true }, "xy"],
      ["E", "J", "reduced batch + anchors", { representative: true, cases: 5, anchors: 2 }, "xy"],
      ["J", "E", "qualitative verdicts", { representative: true, accuracyClaim: false }, "yx"],
    ],
  },
  {
    id: "replay", name: "Labeled replay fallback", hops: [
      ["U", "D", "analyze command", { representative: true, caseId: "CASE-NDC-001" }, "yx"],
      ["D", "W", "versioned fixture", { representative: true, source: "replay", providerCalls: 0 }, "xy"],
      ["W", "G", "fixture candidates", { representative: true, liveEvidence: false }, "xy"],
      ["G", "R", "grounded batch", { representative: true, fields: 8 }, "yx"],
      ["R", "U", "labeled result", { representative: true, source: "replay" }, "xy"],
    ],
  },
];

export const CH = [
  {
    id: "case", title: "The case enters", reveal: ["U", "D"],
    lede: "A reviewer can choose a pressure test, but cannot supply arbitrary content.",
    story: "<p>The browser sends an allowlisted case ID and scenario. The server owns the three synthetic documents, so <mark>public input stays narrow</mark> while the complete product path remains usable.</p>",
    flow: [["U", "D", "analyze command", { representative: true, caseId: "CASE-NDC-001" }], ["D", "U", "three document labels", { representative: true, documents: 3 }]],
  },
  {
    id: "workers", title: "AI proposes locally", reveal: ["W"],
    lede: "Three analyzers work in parallel, each bounded to one untrusted document.",
    story: "<p>The workers return a strict eight-field shape with exact excerpts. They have no tools, approval or routing power: <mark>parallelism changes speed, not authority</mark>.</p>",
    flow: [["D", "W", "one document each", { representative: true, workers: 3 }], ["W", "U", "completed trace", { representative: true, providerFacts: true }]],
  },
  {
    id: "rules", title: "Evidence becomes admissible", reveal: ["G", "R"],
    lede: "Structured output is still only a proposal until deterministic checks resolve its evidence.",
    story: "<p>Grounding rejects fabricated or cross-document excerpts. The reducer merges equivalent facts and preserves disagreement, so <mark>the model cannot vote itself into correctness</mark>.</p>",
    flow: [["W", "G", "candidates + excerpts", { representative: true }], ["G", "R", "grounded batch", { representative: true, fields: 8 }], ["R", "U", "needs_review", { representative: true, conflict: "bank_account_last4" }]],
  },
  {
    id: "human", title: "Consequence stops at a person", reveal: ["H"],
    lede: "The 4421 / 9921 conflict is not silently resolved by source order or confidence.",
    story: "<p>A reviewer selects one grounded candidate and records why. A signed capability binds that decision to the exact analysis, making <mark>human authority explicit and narrow</mark>.</p>",
    flow: [["R", "H", "bank conflict", { representative: true, candidates: ["4421", "9921"] }], ["H", "U", "decision captured", { representative: true, reasonRequired: true }]],
  },
  {
    id: "state", title: "Approval binds one revision", reveal: ["V", "X"],
    lede: "The decision and mock export receipt belong to one exact immutable analysis.",
    story: "<p>Neon stores the analysis separately from its small lifecycle. An identical approval is idempotent; a conflicting or superseded attempt fails, and <mark>no real ERP integration is claimed</mark>.</p>",
    flow: [["H", "V", "signed decision", { representative: true, revisionBound: true }], ["V", "X", "approved snapshot", { representative: true }], ["X", "V", "mock receipt", { representative: true, mode: "mock_erp" }], ["V", "U", "current lifecycle", { representative: true, approved: true }]],
  },
  {
    id: "change", title: "One document changes", reveal: [],
    lede: "A successor revision recomputes only the document whose identity changed.",
    story: "<p>The profile and agreement workers are reused with zero calls; the invoice worker runs once. Historical approval remains visible, but <mark>validity moves to an unapproved successor</mark>.</p>",
    flow: [["U", "D", "invoice change", { representative: true, changedDocuments: 1 }], ["V", "W", "prior identities", { representative: true, workers: 3 }], ["D", "W", "changed invoice", { representative: true }], ["W", "R", "2 reused · 1 completed", { representative: true }], ["R", "H", "review required", { representative: true, approvalCarried: false }]],
  },
  {
    id: "evals", title: "The release tests its claims", reveal: ["E", "J"],
    lede: "Five deterministic cases are primary; one calibrated judge adds a bounded qualitative signal.",
    story: "<p>The suite records live model identity, hashes, usage, routes and decision digests. Positive and negative anchors guard the judge, while <mark>five synthetic cases never become an accuracy claim</mark>.</p>",
    flow: [["E", "W", "5 cases × 3 workers", { representative: true, calls: 15 }], ["W", "R", "grounded outputs", { representative: true }], ["R", "E", "route assertions", { representative: true }], ["E", "J", "results + anchors", { representative: true, anchors: 2 }], ["J", "E", "judge verdicts", { representative: true }]],
  },
  {
    id: "all", title: "The whole release", reveal: [],
    lede: "Explore every boundary and choose the flow that answers your question.",
    story: "<p>Run the main conflict, selective-change, eval or replay flow. Hover a structure for its responsibility, click to pin it, and go inside for execution steps. The <mark>claim-to-proof matrix</mark> is in How it is built.</p>",
    flow: null,
  },
];

const claimHtml = claims.map((item) =>
  `<tr><td><b>${item.claim}</b></td><td>${item.visible}</td><td><a href="${repo}${item.file}">${item.deep}</a><br><code>${item.file}</code></td></tr>`
).join("");

export const HOW_HTML = `<div class="eyebrow">Release 1 · evidence first</div><h1 class="t">How it is built</h1><div class="sub">five public claims, each with a visible and inspectable answer</div>
<table><thead><tr><th>Claim</th><th>Visible proof</th><th>Deep proof</th></tr></thead><tbody>${claimHtml}</tbody></table>
<h3 class="sec">Reading path</h3><pre>desk.tsx → api/case → ai/workers → evidence/reducer\n                      ↓\n              human decision → revision ledger → mock receipt</pre>
<p class="body">All payloads animated in this atlas are representative synthetic examples, not runtime telemetry. Open the <a href="https://vendor-evidence-desk.vercel.app/">live Case Lab</a> to inspect an actual completed run.</p>`;
