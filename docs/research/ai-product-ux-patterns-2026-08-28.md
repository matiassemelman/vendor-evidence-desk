# AI product UX patterns — 2026-08-28

## Scope and evidence standard

This is a short, docs-first reference for the Case Lab's existing contract:
fixed pressure tests, three document-local workers, deterministic reduction,
and a human-only approval. “SOTA” here means patterns supported by current
first-party docs for real AI/evaluation products and SDKs as accessed on
2026-08-28; it is not a popularity ranking or a claim that a vendor's UI should
be copied. Recommendations below are product-design inferences from that
technical evidence.

## A. Choose a scenario / pressure test

**Pattern to use — scenario as an evaluation contract, not a feature menu.**
Show the three fixed pressure tests as compact cards, each with: (1) the
condition injected, (2) the expected *safe route* (`ready_for_approval`,
`needs_review`, or `blocked`), and (3) the question it proves. Selection should
say “Run bank-conflict pressure test”, not “Try AI analysis”. The selected card
becomes the immutable run header, so the reviewer can later understand what was
tested without reconstructing it from the trace.

This is the appropriate translation of an evaluation dataset: LangSmith defines
offline examples as curated test cases with reference outputs, and an experiment
as outputs, scores, and execution traces for one application version on that
dataset. OpenAI's Evals API likewise separates a data-source schema from testing
criteria and permits the same evaluation structure to be run against different
models/configurations. In this product, the cards should expose the *scenario
and expected routing property*, not model knobs. [LangSmith Evaluation
concepts](https://docs.langchain.com/langsmith/evaluation-concepts) · [OpenAI
Evals API reference](https://developers.openai.com/api/reference/resources/evals)

**Do not copy.** Do not expose prompt/model/temperature selectors, arbitrary
input, a generic “demo” gallery, or a pass-rate dashboard before the run. Those
would blur a bounded evidence test into an unbounded chatbot and weaken the
portfolio claim.

## B. Observable wait: 3 AI workers + reducer

**Pattern to use — an event-backed fork/join ledger.** During a genuine live
run, render one row per named document worker and a separate reducer row. A row
may move only on an event the system owns: `started`, `completed`, `reused`, or
`failed`; the reducer may start only after its required worker terminal states.
Each terminal row exposes actual provider facts already captured by the run
(duration, model identity, usage where available) and the reducer exposes only
its deterministic route. If streaming is unavailable, keep the existing
completed trace and label it **Recorded execution**, not a live progress view.

The OpenAI Agents SDK is a concrete implementation reference: its full stream
distinguishes model events, agent changes, and SDK run items rather than only
text; its tracing model records nested operations with start/end times, and
tracks concurrent work in the current trace. That supports real fork/join
visibility without inventing percent complete. [OpenAI Agents SDK:
Streaming](https://openai.github.io/openai-agents-js/guides/streaming/) ·
[Tracing](https://openai.github.io/openai-agents-js/guides/tracing/)

**Do not copy.** No animated “thinking”, token waterfall, spinner-to-percent
conversion, ETA, or prose such as “worker is validating” unless a corresponding
event exists. Do not turn the product screen into a raw tracing dashboard; the
trace remains drill-down evidence, not the primary reading surface.

## C. From technical theater to reduced record + human decision

**Pattern to use — collapse on route, then present an accountable decision
record.** Once reduction reaches `needs_review`, replace the expanded worker
theater with a compact revision-bound record: route and why it stopped,
conflicting grounded values with document/excerpt links, revision ID, and one
human action: choose an already-grounded candidate and supply a reason. Keep
“Inspect execution” as a secondary disclosure. After approval, show the
decision, reason, exact revision, and receipt/state—not a triumphant AI answer.

This follows two mature primitives. The OpenAI SDK presents approval as an
interruption with inspectable parsed arguments, then resumes from the same
state; its serialized state is designed for delayed resumption and fails closed
when output ownership cannot be proven. LangSmith makes human review of outputs
and the full intermediate execution trace a first-class evaluation path. The UX
inference is to give the person the reduced decision surface first and preserve
the trace as evidence behind it. [OpenAI Agents SDK: Human in the
loop](https://openai.github.io/openai-agents-js/guides/human-in-the-loop/) ·
[LangSmith Evaluation
concepts](https://docs.langchain.com/langsmith/evaluation-concepts)

**Do not copy.** No automatic selection from model confidence, editable
free-text replacement value, “Approve all”, or deletion of the unresolved
alternative after a choice. Confidence can describe a proposal; it cannot
authorize a consequential decision.

## Reusable takeaway

**Choose a named failure mode → reveal only event-backed fan-out/fan-in facts →
collapse to the smallest revision-bound record on which a human can make one
grounded decision.** This strengthens the current Case Lab story while keeping
the essential boundary legible: AI proposes, deterministic code routes, a
person decides.

## Version / ambiguity note

The cited SDK/product documentation is the providers' current, unversioned web
documentation as accessed on 2026-08-28. It proves available primitives and
their semantics, not a mandated visual design. Before implementing live
streaming, verify the installed SDK/version and the product's actual event
contract; until then, the completed-run presentation is the honest default.
