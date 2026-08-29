# Narrative AI execution UX — 2026-08-29

## Question

How can Vendor Evidence Desk expose verifiable AI progress without letting the
completed execution trace or System Atlas displace the verdict, human decision,
or receipt?

This bounded review used two current first-party references:

1. [Vercel AI Elements — Reasoning](https://elements.ai-sdk.dev/components/reasoning),
   for its streaming-open / terminal-closed disclosure behavior.
2. [GitHub Primer — Delegate](https://primer.style/product/scenario-patterns/delegate/),
   for delegated-work progress, inline results, decision trails, and human
   controls.

## What transferred

| Reference principle | Product decision |
| --- | --- |
| Keep progress in the context where work began. | The selected case becomes the persistent stage; running events appear inside it. |
| Show incremental facts, not an invented percent or ETA. | Every visible step maps to a server-owned event; replay is labeled. |
| Collapse execution reasoning when streaming ends. | The completed Theater becomes one inspectable receipt row. |
| Return short delegated results inline. | The scenario-specific verdict replaces the space released by the Theater. |
| Preserve a reviewable trail through progressive disclosure. | Workers, timings, evidence, revision identity, and architecture remain available on demand. |
| Offer explicit choices when intent is consequential or ambiguous. | The exact source excerpts sit inside the human decision; AI never selects the bank account. |

The Vercel component is a disclosure primitive, not permission to expose chain
of thought. Vendor exposes only owned events, provider facts, exact excerpts,
and deterministic conclusions. Primer is a product pattern, not a prescribed
layout; viewport placement is an implementation inference.

## Applied state contract

| State | Primary surface | Secondary evidence |
| --- | --- | --- |
| Running | selected case + real execution events | per-worker evidence |
| Needs review | human verdict + exact alternatives + one decision | execution receipt + Atlas |
| Approved | approval/export receipt + another-case action | complete record + execution + Atlas |
| Error | what failed + what was preserved + retry | partial execution details |

Green is reserved for a completed human-approved lifecycle. A completed worker
is neutral: technical completion is not business approval.

## Acceptance evidence

- Terminal desktop viewport: execution receipt, verdict, and complete decision
  fit together at 1440 × 900.
- Terminal mobile viewport: receipt and verdict establish meaning before the
  decision begins at 390 px; horizontal overflow is zero.
- Atlas begins minimized and remains usable without covering the decision.
- Approval replaces the decision instead of appending a distant success block.
- Every terminal state offers a recovery or another-case path.

## Limits

Both references were consulted on 2026-08-29 and are web documentation rather
than versioned standards. The specific hierarchy, measurements, copy, and
collapse behavior remain this product's design decisions.

**Reusable rule:** show only progress the system can prove; at completion,
collapse that progress and give the recovered space to the verdict, accountable
human action, or receipt.
