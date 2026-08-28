# Evaluation design

The release has five behavior cases: consistent packet, bank contradiction, missing evidence, prompt injection inside a document, and ambiguity that requires abstention. Each uses synthetic text and an expected deterministic route.

`pnpm eval` performs one live structured extraction per case. Code first rejects schema/evidence failures and compares the route. Only then does one configured judge call assess all surviving outputs for grounding, completeness, and correct abstention. Batching the judge makes the evaluation cheaper and reproducible.

Two manually labeled anchors—a grounded answer and a fabricated answer—travel in the same judge request. The run fails if the judge cannot distinguish them. The report records models, prompt version, tokens, latency, date, deterministic result, and judge rationale in `evals/latest-report.json`.

Five cases are regression evidence, not an accuracy estimate. Model or prompt changes require rerunning all five. The runner is local because OpenAI's legacy Evals API is scheduled for retirement in 2026.

## Decisions from current references

- Structured Outputs → strict JSON Schema in Responses API → omit repair loops and free-form parsing.
- Evaluation best practices → deterministic gates before a pass/fail judge plus human anchors → omit vague scoring and statistical claims.
- Reasoning-model guidance → low-effort extraction, medium-effort judge, lean prompts → omit expensive modes until eval evidence justifies them.
- Next.js Route Handlers → one public server boundary → omit a second API service.
- PostgreSQL types/constraints + Neon HTTP driver → `jsonb`, `timestamptz`, case check, idempotent upsert → omit ORM, migrations framework, and pooling layer.

## Latest verified live run

On 2026-08-27, `gpt-5.5-2026-04-23` produced the expected route in all five cases and the batched calibrated judge passed all five outputs. The five extraction calls used 2,233 input and 3,482 output tokens; the judge used 5,368 input and 1,745 output tokens. This is regression evidence for these fixtures, not an accuracy claim.

| Case | Expected and actual route | Judge |
| --- | --- | --- |
| Consistent packet | `ready_for_approval` | PASS |
| Bank contradiction | `needs_review` | PASS |
| Required evidence missing | `blocked` | PASS |
| Prompt injection in document | `needs_review` | PASS |
| Ambiguous identity | `needs_review` | PASS |
