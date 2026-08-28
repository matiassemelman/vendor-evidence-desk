# Vendor Evidence Desk — System Definition

_This walkthrough and its text twin are generated from one reviewed architecture source._

_Question status: **0 open · 7 resolved**._

## One paragraph

Vendor Evidence Desk prepares a supplier record from three synthetic documents. Three AI workers propose document-local facts with exact excerpts; deterministic code validates and routes; a person resolves consequential ambiguity and approves one exact revision. Changing one document creates an immutable successor and reuses only workers whose input and effective model identities still match.

## Decisions locked

| Axis | Decision | Source |
|---|---|---|
| Input | One synthetic allowlisted case; no public uploads or prompts. | [Release limits](../../README.md#limits) |
| AI | One worker per document, strict output, no tools and no provider retry. | [Evaluation design](../EVALS.md) |
| Authority | AI proposes, deterministic code routes and only a person approves. | [Build process](../BUILD_PROCESS.md) |
| Change | A changed document creates a successor; reuse requires exact input and model identity. | [Release contract](../../README.md#engineering-choices) |
| Evidence | Five focused tests and five live evals protect visible claims without implying scale. | [Evaluation design](../EVALS.md) |

## Cost model

The release records token usage per completed live run; five synthetic cases do not establish a representative production cost.

## Deep dives

### Claim to proof matrix

| Public claim | Visible proof | Deep proof |
|---|---|---|
| AI output is grounded, not trusted | Inspect a worker's exact source, candidates and excerpts | [Strict output and local evidence resolution](../../lib/ai/worker.ts) |
| The model never owns the route | The bank mismatch survives as a human gate | [Deterministic grounding, merge and routing](../../lib/domain/evidence.ts) |
| Selective reanalysis saves actual calls | Two workers report reused and zero calls after one document changes | [Input and model identity-based reuse](../../lib/ai/run.ts) |
| Approval is bound to one exact revision | The receipt names the revision; its successor requires review | [Signed capability, lifecycle persistence and regressions](../../tests/revisions.test.ts) |
| Evaluation evidence stays honest | Live and replay are labeled; limitations remain public | [Five live cases and a calibrated LLM judge](../../evals/run.ts) |

## Reading order (the atlas chapters)

1. **The case enters** — A reviewer can choose a pressure test, but cannot supply arbitrary content. _(adds U, D)_
2. **AI proposes locally** — Three analyzers work in parallel, each bounded to one untrusted document. _(adds W)_
3. **Evidence becomes admissible** — Structured output is still only a proposal until deterministic checks resolve its evidence. _(adds G, R)_
4. **Consequence stops at a person** — The 4421 / 9921 conflict is not silently resolved by source order or confidence. _(adds H)_
5. **Approval binds one revision** — The decision and mock export receipt belong to one exact immutable analysis. _(adds V, X)_
6. **One document changes** — A successor revision recomputes only the document whose identity changed.
7. **The release tests its claims** — Five deterministic cases are primary; one calibrated judge adds a bounded qualitative signal. _(adds E, J)_
8. **The whole release** — Explore every boundary and choose the flow that answers your question.

## Structures

### The guided case

#### U · Case Lab

**In one line.** The guided surface where a reviewer runs and inspects one fixed case.

**What it does.** It exposes the completed worker trace, evidence, exception, human decision and revision history without simulating live progress.

**How it's built.** `app/desk.tsx` renders the run returned by one server route and labels live work, replay and preview memory separately.

**Steps in execution.**

1. **Choose** — Select one of three fixed pressure tests.
2. **Analyze** — Send the allowlisted case ID and scenario.
3. **Inspect** — Open workers, evidence and events.
4. **Decide** — Choose a grounded value and record a reason.

**Questions.**

- ~~**Q-U1** Can a visitor submit arbitrary documents or instructions?~~ ✓ No. Public input is the fixed CASE-NDC-001 scenario contract (2026-08-28).

#### D · Synthetic packet

**In one line.** Three fictional supplier documents form the complete input boundary.

**What it does.** A profile, agreement and sample invoice contain eight supplier fields and a deliberate 4421 / 9921 bank conflict.

**How it's built.** `fixtures/case.json` is loaded server-side; scenario changes are allowlisted transformations in `app/api/case/route.ts`.

**Steps in execution.**

1. **Load** — Resolve CASE-NDC-001 on the server.
2. **Variant** — Apply only a clean, conflict or adversarial fixture change.
3. **Dispatch** — Give each worker exactly one document.

#### W · Document workers

**In one line.** Three bounded analyzers propose facts from one document each.

**What it does.** Workers cannot see the full case, call tools, approve, route or export. Their only job is to return eight field slots with local candidates and exact excerpts.

**How it's built.** `lib/ai/worker.ts` uses OpenAI Responses with strict JSON Schema and `maxRetries: 0`; `lib/ai/run.ts` runs the three workers concurrently.

**Steps in execution.**

1. **Hash** — Bind the document and effective model identity.
2. **Call or reuse** — Invoke once, load labeled replay or reuse a matching result.
3. **Parse** — Reject output outside the exact eight-field contract.
4. **Return** — Emit candidates, evidence and provider facts.

**Questions.**

- ~~**Q-W1** Why does each analyzer see only one document?~~ ✓ It limits instruction scope and makes changed-document reuse independently verifiable (2026-08-28).

### Authority boundaries

#### G · Evidence gate

**In one line.** Model-shaped output becomes usable only after exact local grounding.

**What it does.** Every cited excerpt must exist inside the same document seen by that worker. Missing, fabricated, cross-document or malformed evidence fails closed.

**How it's built.** `readWorker` in `lib/domain/evidence.ts` checks the closed schema, exact document ID and literal excerpt before reduction.

**Steps in execution.**

1. **Shape** — Require the exact field and candidate keys.
2. **Roster** — Require all eight field slots.
3. **Locality** — Resolve every excerpt against the worker's document.
4. **Fail closed** — Reject the worker result before case routing.

#### R · Deterministic reducer

**In one line.** Code, not model confidence, merges proposals and chooses the route.

**What it does.** Equivalent values merge with their evidence; formats and excerpts are checked again; disagreements remain visible as conflicts.

**How it's built.** `reduce` and `inspect` in `lib/domain/evidence.ts` produce only ready_for_approval, needs_review or blocked.

**Steps in execution.**

1. **Merge** — Canonicalize equivalent candidates across workers.
2. **Validate** — Check required fields, formats and exact evidence.
3. **Preserve** — Keep multiple grounded bank values.
4. **Route** — Derive one deterministic terminal route.

**Questions.**

- ~~**Q-R1** Why not let the model pick the most confident bank value?~~ ✓ Confidence cannot grant authority over a consequential conflict; the route remains needs_review (2026-08-28).

#### H · Human review

**In one line.** A person resolves the bank conflict and supplies an accountable reason.

**What it does.** The reviewer can choose only a grounded candidate. Blocked cases and unsupported values never become approvable through this surface.

**How it's built.** A signed HMAC capability binds `revisionId`, `lineageId` and `decisionDigest`; `app/api/case/route.ts` validates it before approval.

**Steps in execution.**

1. **Review** — Compare grounded bank candidates and their sources.
2. **Select** — Choose one candidate already present in evidence.
3. **Explain** — Record a 12–500 character reason.
4. **Bind** — Attach the decision to the exact signed revision.

**Questions.**

- ~~**Q-H1** Can the AI approve or silently resolve the conflict?~~ ✓ No. The model has no approval path; only the explicit reviewer command can bind a decision (2026-08-28).

### Revision and side effect

#### V · Revision ledger

**In one line.** Immutable analysis is paired with a small, exact lifecycle record.

**What it does.** One revision is current at a time. A changed document creates a successor; the prior approval and receipt remain historical instead of being rewritten.

**How it's built.** `lib/db.ts` stores one JSON analysis snapshot plus lifecycle state in Neon, with local preview memory only when DATABASE_URL is absent.

**Steps in execution.**

1. **Insert** — Persist the immutable analysis snapshot.
2. **Approve** — Write the matching approval and mock receipt once.
3. **Supersede** — Atomically invalidate the parent and insert its successor.
4. **Read** — Hydrate analysis plus current lifecycle.

**Questions.**

- ~~**Q-V1** What happens when an approved document changes?~~ ✓ The prior revision becomes superseded and the new successor starts without approval (2026-08-28).

#### X · Mock export receipt

**In one line.** A simulated ERP receipt records the approved revision without claiming a real integration.

**What it does.** The release demonstrates revision-bound and idempotent side-effect semantics, but deliberately performs no network call to a real ERP.

**How it's built.** `approveAndExport` stores one approval/export receipt for the exact revision and returns the same receipt for an identical repeat.

**Steps in execution.**

1. **Check** — Require the current matching revision and digest.
2. **Record** — Persist the approval and mock export receipt together.
3. **Repeat** — Return the prior receipt for the same decision.
4. **Reject** — Fail conflicting or superseded attempts.

**Questions.**

- ~~**Q-X1** Does this prove production ERP delivery?~~ ✓ No. The public limitation is explicit: this is a mock receipt, not a real ERP integration (2026-08-28).

### Release evidence

#### E · Evaluation suite

**In one line.** Five fixed live cases exercise the routes and authority boundaries.

**What it does.** The suite covers clean evidence, conflict, missing data, prompt injection and fabricated evidence without presenting five examples as an accuracy benchmark.

**How it's built.** `evals/run.ts` runs five cases through three live workers and records identities, hashes, usage, latency, routes and decision digests.

**Steps in execution.**

1. **Run** — Execute five fixed inputs with live document workers.
2. **Assert** — Check deterministic route and authority facts.
3. **Batch** — Send compact outputs plus anchors to the judge.
4. **Report** — Write a local evidence report with no accuracy claim.

#### J · Calibrated LLM judge

**In one line.** A separate model adds one bounded qualitative check to deterministic evals.

**What it does.** The judge receives reduced outputs and human-labeled positive and negative anchors. Anchor failure invalidates the judge batch.

**How it's built.** The judge call in `evals/run.ts` uses strict output, one batch and calibrated anchors; deterministic route assertions remain primary.

**Steps in execution.**

1. **Calibrate** — Include one known pass and one known fail anchor.
2. **Judge** — Evaluate all five reduced outputs in one batch.
3. **Validate** — Require both anchors to classify correctly.
4. **Combine** — Report judge and deterministic verdicts separately.

**Questions.**

- ~~**Q-J1** Does a 5/5 judge result prove model accuracy at scale?~~ ✓ No. It is a fixed regression signal over synthetic cases, explicitly not an accuracy claim (2026-08-28).

## Flows (representative packets)

Payload shapes are what the design implies, not measured traffic.

### Conflict to human decision

| # | From → To | Packet | Representative payload |
|---|---|---|---|
| 1 | U → D | analyze command | `{"representative":true,"caseId":"CASE-NDC-001","scenario":"bank_conflict"}` |
| 2 | D → W | three local documents | `{"representative":true,"documents":3}` |
| 3 | W → G | structured candidates | `{"representative":true,"workers":3,"tools":0}` |
| 4 | G → R | grounded batch | `{"representative":true,"fields":8}` |
| 5 | R → H | needs_review | `{"representative":true,"conflict":["4421","9921"]}` |
| 6 | H → V | signed decision | `{"representative":true,"selected":"4421","reason":"reviewer supplied"}` |
| 7 | V → X | approved revision | `{"representative":true,"revisionBound":true}` |
| 8 | X → V | mock receipt | `{"representative":true,"mode":"mock_erp"}` |
| 9 | V → U | lifecycle | `{"representative":true,"validity":"current","approved":true}` |

### Change one document

| # | From → To | Packet | Representative payload |
|---|---|---|---|
| 1 | U → D | allowlisted invoice change | `{"representative":true,"documentId":"DOC-INVOICE-001"}` |
| 2 | V → W | prior worker identities | `{"representative":true,"priorWorkers":3}` |
| 3 | D → W | changed invoice | `{"representative":true,"changedDocuments":1}` |
| 4 | W → R | selective result | `{"representative":true,"reused":2,"completed":1}` |
| 5 | R → H | new review | `{"representative":true,"approvalCarried":false}` |
| 6 | H → V | successor decision | `{"representative":true,"parentSuperseded":true}` |

### Live evaluation

| # | From → To | Packet | Representative payload |
|---|---|---|---|
| 1 | E → W | five cases | `{"representative":true,"cases":5,"liveWorkers":15}` |
| 2 | W → R | grounded outputs | `{"representative":true,"routes":5}` |
| 3 | R → E | deterministic verdicts | `{"representative":true,"primary":true}` |
| 4 | E → J | reduced batch + anchors | `{"representative":true,"cases":5,"anchors":2}` |
| 5 | J → E | qualitative verdicts | `{"representative":true,"accuracyClaim":false}` |

### Labeled replay fallback

| # | From → To | Packet | Representative payload |
|---|---|---|---|
| 1 | U → D | analyze command | `{"representative":true,"caseId":"CASE-NDC-001"}` |
| 2 | D → W | versioned fixture | `{"representative":true,"source":"replay","providerCalls":0}` |
| 3 | W → G | fixture candidates | `{"representative":true,"liveEvidence":false}` |
| 4 | G → R | grounded batch | `{"representative":true,"fields":8}` |
| 5 | R → U | labeled result | `{"representative":true,"source":"replay"}` |

## Questions — index

Reference by ID. ✓ resolved (with date) · otherwise open.

- ~~**Q-U1**~~ (U) ✓ No. Public input is the fixed CASE-NDC-001 scenario contract (2026-08-28).
- ~~**Q-W1**~~ (W) ✓ It limits instruction scope and makes changed-document reuse independently verifiable (2026-08-28).
- ~~**Q-R1**~~ (R) ✓ Confidence cannot grant authority over a consequential conflict; the route remains needs_review (2026-08-28).
- ~~**Q-H1**~~ (H) ✓ No. The model has no approval path; only the explicit reviewer command can bind a decision (2026-08-28).
- ~~**Q-V1**~~ (V) ✓ The prior revision becomes superseded and the new successor starts without approval (2026-08-28).
- ~~**Q-X1**~~ (X) ✓ No. The public limitation is explicit: this is a mock receipt, not a real ERP integration (2026-08-28).
- ~~**Q-J1**~~ (J) ✓ No. It is a fixed regression signal over synthetic cases, explicitly not an accuracy claim (2026-08-28).

## What the platform gives vs what we own

**Platform gives:** Next.js supplies the web and server boundary; OpenAI Responses supplies structured model output; Neon supplies PostgreSQL transport.

**We own:** Allowlisted inputs, evidence verification, deterministic routing, human authority, revision identity, selective reuse, receipts and evaluation semantics.

## Planned filesystem

```
app/desk.tsx                 guided reviewer surface
app/api/case/route.ts       command and authority boundary
lib/ai/worker.ts            one document-local analyzer
lib/ai/run.ts               parallel run and selective reuse
lib/domain/evidence.ts      grounding and deterministic route
lib/db.ts                   immutable revision lifecycle
tests/                      five authority regressions
evals/run.ts                five live cases and LLM judge
```

## How this file is maintained

Generated from `docs/architecture/atlas/data.mjs` by `pnpm atlas:build`, which also builds the interactive atlas (`atlas.html`, published at https://vendor-evidence-desk.vercel.app/architecture). Edit the data file, rebuild, republish — never edit this file by hand.
