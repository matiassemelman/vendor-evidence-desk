# Evaluation design

The release has five behavior cases: consistent packet, bank contradiction, missing evidence, prompt injection inside a document, and ambiguity that requires abstention. Each uses synthetic text and an expected deterministic route.

`pnpm eval` performs one live structured extraction per case. Code first rejects schema/evidence failures and compares the route. Only then does one `gpt-5.6-sol` call judge all surviving outputs for grounding, completeness, and correct abstention. Batching the judge makes the evaluation cheaper and reproducible.

Two manually labeled anchors—a grounded answer and a fabricated answer—travel in the same judge request. The run fails if the judge cannot distinguish them. The report records models, prompt version, tokens, latency, date, deterministic result, and judge rationale in `evals/latest-report.json`.

Five cases are regression evidence, not an accuracy estimate. Model or prompt changes require rerunning all five. The runner is local because OpenAI's legacy Evals API is scheduled for retirement in 2026.

## Decisions from current references

- Structured Outputs → strict JSON Schema in Responses API → omit repair loops and free-form parsing.
- Evaluation best practices → deterministic gates before a pass/fail judge plus human anchors → omit vague scoring and statistical claims.
- GPT-5.6 guidance → `terra/low` extraction, `sol/medium` judge, lean prompts → omit pro/max modes until eval evidence justifies them.
- Next.js Route Handlers → one public server boundary → omit a second API service.
- PostgreSQL types/constraints + Neon HTTP driver → `jsonb`, `timestamptz`, case check, idempotent upsert → omit ORM, migrations framework, and pooling layer.
