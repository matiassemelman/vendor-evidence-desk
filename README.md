# Vendor Evidence Desk

Turn supplier documents into an evidence-backed vendor record, surface contradictions for human review, and export only after approval.

This is a compact AI/full-stack case study. It accepts one synthetic, allowlisted packet—not uploads or prompts—then makes one server-side structured extraction. Every proposed value links to an exact source excerpt. Deterministic rules keep the `4421` / `9921` bank conflict unresolved until a reviewer selects a value and explains why.

![Vendor Evidence Desk product overview](docs/product-overview.png)

## Why this exists

Supplier onboarding is not just extraction. The product decision is to automate preparation while keeping consequential judgment explicit. The demo proves that boundary without pretending to be a production ERP or an adopted customer system.

## Run it

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Without credentials the UI uses a versioned replay labeled as such. Set `OPENAI_API_KEY` and `LIVE_AI_ENABLED=1` for a bounded live run. Add `DATABASE_URL` after applying `schema.sql` to persist the approved snapshot; otherwise export remains clearly labeled `preview`.

```bash
pnpm verify       # lint, types, 5 tests, production build
pnpm eval         # 5 live cases + calibrated LLM judge; requires API key
```

Latest verification: 5/5 deterministic routes and 5/5 calibrated judge verdicts passed with `gpt-5.5`; two repeated approved exports produced one Neon row on 2026-08-27. See [evaluation design and results](docs/EVALS.md).

## Engineering choices

- OpenAI Responses API + strict JSON Schema; documents are untrusted data and the model has no tools.
- Evidence resolution and routing are deterministic, after the model response.
- A single Next.js Route Handler is the server boundary; secrets never reach the browser.
- One PostgreSQL table stores the approved JSON snapshot with an idempotent case key.
- Five deterministic tests guard authority boundaries; five versioned eval cases run live with configured credentials.

See [eval design](docs/EVALS.md) and [the human–AI build process](docs/BUILD_PROCESS.md). All companies, people, identifiers, addresses, and bank details are fictional.

## Limits

One known document shape, English text only, no OCR, no authentication, no arbitrary files, no scale or accuracy claim. Public deployment requires platform rate limiting and an OpenAI project spend cap; those controls are external by design rather than simulated in application memory.
