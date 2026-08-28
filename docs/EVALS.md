# Evaluation design

The release has five synthetic behavior cases: consistent packet, bank contradiction, missing evidence, prompt injection inside a document, and ambiguous identity.

`pnpm eval` executes three live, document-local analyzers for every case. A run fails unless all three complete through the provider, the returned model snapshot matches the release contract, exact excerpts ground every candidate, and the deterministic route matches the fixture. Replay never counts as live evidence.

Only after those gates does one configured LLM judge assess all five outputs for grounding, completeness and correct abstention. The judge request also contains two manually labeled calibration anchors—one grounded and one fabricated—and the entire run fails if either calibration verdict is wrong. Expected case labels are not included in judge inputs.

The generated `evals/latest-report.json` records prompt version, requested/effective models, hashes, decision digests, token usage, latency, routes and short judge rationales. It is local release evidence rather than a committed benchmark snapshot.

Five cases are regression evidence, not an accuracy estimate. Model, prompt, schema or reducer changes require rerunning the suite.

## Latest verified live run

On 2026-08-28, all 15 extraction workers returned `gpt-4.1-mini-2025-04-14` for requested alias `gpt-4.1-mini`. They used 4,233 input and 4,416 output tokens. The calibrated `gpt-5.5-2026-04-23` batched judge passed all five outputs and both anchors, using 4,692 input and 1,039 output tokens.

At published standard rates on that date, the extraction path cost an estimated US$0.008759 for all five cases (US$0.001752 per three-worker case) and the judge US$0.054630. The US$0.063389 total is 73.8% below the verified US$0.2422 all-`gpt-5.5` baseline; the product path alone is 95.2% lower. These are token-derived estimates, not invoice or scale claims. See [model routing](MODEL_ROUTING.md).

| Case | Expected and actual route | Judge |
| --- | --- | --- |
| Consistent packet | `ready_for_approval` | PASS |
| Bank contradiction | `needs_review` | PASS |
| Required evidence missing | `blocked` | PASS |
| Prompt injection in document | `needs_review` | PASS |
| Ambiguous identity | `needs_review` | PASS |

## Reference-driven decisions

- Strict Structured Outputs: reject malformed output instead of repairing free-form text.
- Document-local fan-out: make contribution and selective reuse inspectable.
- Deterministic gates before judge: do not ask a model to replace evidence or authority checks.
- Calibrated, batched judge: one inexpensive qualitative signal, guarded by human labels.
- Fixed live suite: omit statistical quality claims until a larger representative dataset exists.
