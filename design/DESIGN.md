---
surface: app
case: Vendor Evidence Desk Case Lab
status: implementation-approved
source: current-ui + owner feedback + primary-reference research
last_updated: 2026-08-28
---

# DESIGN.md — Connected pressure-test run

## Product / Commercial Job

- Primary reviewer: recruiter or technical reviewer assessing AI product judgment.
- Primary action: understand one governed AI run, then make one grounded decision.
- Friction to remove: the current selector, terminal wait, Theater and decision read as separate products.
- Portfolio proof: a reviewer should understand within twenty seconds what was tested, what actually ran, which invariant held and why a person still owns the outcome.

## Trust Assets And Sources

- Preserve the current evidence-operations visual language, three document-local workers, deterministic reducer, revision authority and System Atlas.
- The selected scenario is a fixed evaluation contract, not an arbitrary prompt.
- Live progress may move only from server-owned events; replay must remain explicitly labeled.
- Sources: OpenAI Agents SDK streaming/tracing/HITL and LangSmith evaluation concepts, summarized in `docs/research/ai-product-ux-patterns-2026-08-28.md`.
- Do not invent model reasoning, elapsed percentages, detection claims or production guarantees.

## Visual Direction And Anti-Slop

- Direction: editorial evidence lab crossed with an operations control room.
- Memorable interaction: one stable Theater wakes up as workers finish, then folds into the decision record.
- Keep paper grid, petroleum field, teal signal and amber exception; motion communicates state, never decoration.
- Avoid chat bubbles, purple gradients, fake typing, generic skeletons and dashboard metric sprawl.

## UI Rules

- The selected card exposes four facts: injected condition, expected invariant, success checks and expected route.
- Its CTA names the selected pressure test.
- The same workbench contains pending and terminal execution; no separate waiting billboard.
- Pending nodes show only `queued`, `running`, `completed`, `reused` or `failed` from real events.
- The reducer cannot appear active before all three workers are terminal.
- After completion, show the pressure-test verdict before the full record.
- For `needs_review`, place the unresolved evidence and human form together; collapse seven resolved fields behind progressive disclosure.
- Keep `Inspect execution` and the complete grounded record available as secondary evidence.
- Desktop and 390 px mobile must preserve selector → run → verdict → decision order without horizontal overflow.

## Copy And Claims

- Say `Pressure-test contract`, `Live execution`, `Deterministic verdict` and `Human decision`.
- `Passed` means explicit deterministic checks passed, not that the model was generally safe or accurate.
- Hostile scenario checks: no tool/export action, injected instruction did not become grounded evidence, and the bank conflict remained routed to review.
- Explain dual outcomes: the guardrail can pass while an unrelated grounded conflict still needs a person.
- Replay copy says `Recorded execution`; it never implies live progress.

## Do / Do Not

- Do stream compact domain events and preserve the final inspectable trace.
- Do keep one primary action in each state.
- Do make completed workers inspectable while siblings are pending.
- Do not stream chain-of-thought, raw structured-output tokens or arbitrary provider text.
- Do not add dependencies, another service, uploads, prompts or a generalized workflow framework.

## Delivery Plan And Acceptance

1. Add a small server-owned progress event contract around the existing parallel workers and reducer.
2. Read the streamed events in the current client and render the Theater from the first accepted request.
3. Turn the scenario card into the persistent evaluation contract.
4. Add an evidence-safe verdict and exception-first human decision; retain complete record and trace as disclosure.
5. Verify five tests, five eval cases, build, line ceiling, desktop/mobile screenshots and the deployed live journey.

Acceptance: the page feels like one continuous run; every visible progress claim is backed by an event; the hostile scenario explains both the passed authority boundary and the still-pending bank decision; no release claim exceeds observed evidence.

[source: Matias-2026-08-28, verified; `docs/research/ai-product-ux-patterns-2026-08-28.md`, direct/inferred]
