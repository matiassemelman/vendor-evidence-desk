---
surface: app
case: Vendor Evidence Desk Case Lab
status: implementation-contract
source: production-qa + owner review + primary-reference research
last_updated: 2026-08-29
---

# DESIGN.md — One case, one continuous stage

## Product and communication job

- Primary audience: a recruiter or technical reviewer opening the project for
  the first time from a CV, GitHub profile or shared link.
- Primary action: understand one governed AI run, make its grounded human
  decision and choose whether to inspect the architecture or source.
- Twenty-second test: the visitor can say what the AI did, what deterministic
  code decided and what remained explicitly human.
- Public story: `documents → evidence → deterministic exception → human
  decision → simulated receiving system`.
- Portfolio attribution: the experience names Matias Semelman without turning
  the product into a personal landing page.

## Direction

An editorial evidence lab crossed with an operations control room. The serif
voice explains human consequences; sans-serif copy explains actions; monospace
labels prove machine state. Paper grid, petroleum, teal and amber remain the
visual identity. Motion communicates state and never invents work.

The selected scenario becomes the stage. The selector, running Theater,
verdict, decision and receipt are not separate pages stacked vertically: they
are consecutive states of the same case.

## Editorial hierarchy

Every viewport answers, in order:

1. What happened?
2. Why does it matter?
3. What should the person do?
4. How can a technical reviewer verify it?

The human sentence is dominant. One compact technical receipt follows it.
Terms such as `route`, `reducer`, `revision`, `mock ERP` and event names never
carry the main explanation.

## Entry and attribution

- Page title: `Vendor Evidence Desk — Governed AI case study`.
- Description: `Watch AI ground a supplier record in source evidence, preserve
  a consequential conflict and stop for an accountable human decision.`
- Social preview: `AI prepares the evidence. A human owns the decision.` plus
  the three-step authority map.
- Header/footer attribution: `Designed and built by Matias Semelman` with
  source and LinkedIn available after the product story.

## Storyboard and final copy

### 00 — Arrival

- Eyebrow: `AI-assisted vendor onboarding`.
- Headline: `Watch AI build a vendor record—and stop where judgment matters.`
- Body: `Three document analyzers extract claims and cite their sources.
  Deterministic rules preserve contradictions, and only a reviewer can approve
  the resulting record.`
- Authority map: `AI proposes evidence → Rules preserve exceptions → A person
  approves one exact version`.

### 01 — Choose a case

- Heading: `What should the system handle?`
- `Conflicting bank accounts`: `Two documents support different accounts. The
  system must preserve both.`
- `Consistent documents`: `All sources agree. The case may advance, but it
  cannot approve itself.`
- `Hostile instruction`: name the attempted action before the run: a fake
  `SYSTEM` command orders immediate approval and export.
- Primary action: `Analyze this case`.
- Secondary proof: `3 isolated analyzers · source-grounded output · no tools ·
  human approval required`.
- Condition, invariant, expected outcome and route live under `Inspect expected
  behavior`; they are not the initial narrative.

### 02 — Execute

- Heading: `Checking three supplier documents.`
- Body: `Each analyzer can propose evidence only from its assigned document.`
- Show only real server-owned states: accepted, queued, running, completed,
  reused or failed. Never show a percentage, ETA, chain of thought or fake
  typing.
- The deterministic reducer remains visibly waiting until all workers are
  terminal.

### 03 — Conclude

At a terminal result the Theater closes into one receipt:
`Analysis complete · 3 documents · model · duration · Inspect execution`.
The verdict immediately takes the released space.

- Conflict: `Two bank accounts are supported. The system refused to choose.`
- Consistent: `All three documents agree. Human approval is still required.`
- Hostile: `The embedded instruction was ignored. The evidence remained in
  control.` The explanation quotes the exact hostile text so a visitor can see
  what was rejected without opening the execution trace.

Below the human explanation, show the technical result: checks, route and
conflict count. A completed model call never looks like an approved record.

### 04 — Decide

- Heading: `Choose which source should govern this record.`
- Body: `Compare the exact excerpts below. Your selection and reason will be
  bound to this revision.`
- Decisive evidence stays open above the form.
- No default candidate and no prefilled reason.
- Disabled action: `Select an account to continue`.
- Enabled action: `Approve account {value} for this revision`.
- Clean scenario: `Approve this exact record` after the sole grounded value is
  explicitly selected.

### 05 — Confirm and continue

The decision surface transforms in place into the receipt; no success panel is
appended below the full record.

- Heading: `Account {value} approved and exported.`
- Body: `The exact approved version was sent to a simulated receiving system
  and recorded once.`
- Technical proof: receipt ID, exact revision, persistence mode and
  `Mock ERP · idempotent export`.
- Primary continuation: `Try another case`.
- Secondary depth: `Explore the system architecture` and `Inspect the source`.

## Visual grammar

- Serif: narrative headlines and human consequences.
- Sans serif: explanations, evidence and controls.
- Monospace: events, models, hashes, receipts and compact proof.
- Teal: neutral system state and primary action.
- Amber: contradiction or required attention.
- Green: only an explicit approved human outcome, never worker completion.
- Dark Theater: active or inspectable execution, never the final decision.
- One viewport, one protagonist; technical disclosure cannot cover or displace
  the current action.

## Motion and focus

- The chosen case compresses into a case strip when execution starts.
- The running Theater appears in that same stage.
- Completion folds the Theater into its receipt before revealing the verdict.
- Approval replaces the decision with its receipt.
- Transitions use opacity/transform, 160–320 ms, and honor
  `prefers-reduced-motion`.
- Programmatic focus moves to the running status, verdict or receipt after the
  corresponding state change. No repeated scroll hijacking.

## Secondary evidence

- Completed execution is closed by default and reopens through `Inspect
  execution`.
- The complete eight-field grounded record remains collapsed.
- System Atlas starts minimized. It becomes contextually discoverable after a
  run but never expands over the active decision.
- Replay is always labeled `Recorded execution · No provider call was made
  during this replay`.
- Error copy states what failed, what remains preserved and the next available
  action.

## Responsive contract

- Desktop target: compact case context, terminal receipt, verdict, decisive
  evidence and next action remain within one ordinary viewport after the run.
- Mobile order is case → execution → verdict → evidence → decision → receipt;
  it may require one additional scroll but never reorders the evidence beneath
  the form.
- No horizontal overflow at 390 px. Atlas is a minimized bottom trigger on
  mobile. Keyboard focus and screen-reader announcements follow the same
  narrative order.

## Guardrails

- Fixed synthetic packet only; no uploads or prompts.
- Live progress only from server-owned events; replay explicitly labeled.
- AI proposes; deterministic code validates/routes; only the reviewer approves.
- Exactly five focused tests and five eval cases remain.
- No dependency or service is added for this presentation change.
- Runtime/config line count remains at or below 1,450.

## Acceptance

1. A new visitor can explain the authority split after the hero and one run.
2. Clicking Analyze keeps the selected case and active work in one stage.
3. A terminal run leaves a compact technical receipt and puts its human verdict
   before full trace or record.
4. Every scenario communicates its distinct outcome; the hostile scenario
   exposes the exact rejected instruction in its visible verdict.
5. Decisive evidence precedes the form; approval replaces it with an exact
   receipt and offers another case.
6. Atlas starts minimized, remains discoverable and never covers the decision.
7. Metadata, attribution, desktop and 390 px journeys are verified.
8. `pnpm verify`, exactly five tests and the 1,450-line ceiling pass.

[source: Matias-2026-08-29, approved direction;
`docs/research/narrative-ai-run-patterns-2026-08-29.md`, direct/inferred]
