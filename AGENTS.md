# Repository contract

Build one legible portfolio product, not a reusable workflow platform.

- The public story is `documents → evidence → deterministic exception → human decision → mock export`.
- AI may propose fields and evidence; only deterministic code routes and only a person approves.
- Accept only `CASE-NDC-001`; never add anonymous uploads or free-form prompts to this release.
- Target at most 1400 handwritten executable/config lines; crossing 1450 blocks release review. The extra room exists only for the revision-bound Case Lab, selective document analysis, visible product quality and real verification—not verbosity or speculative architecture.
- Keep exactly five focused tests and five inspectable eval cases.
- No new service, abstraction, dependency, or guard unless it protects a visible claim.
- Never claim live AI, persistence, deployment, or eval results without direct evidence.
- Run `pnpm verify` and `pnpm eval` (with credentials) before publishing behavior changes.


<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
