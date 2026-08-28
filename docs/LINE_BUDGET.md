# Executable line budget

The product release contains 1,450 non-empty handwritten executable/config lines. The count covers tracked `ts`, `tsx`, `css`, `mjs`, `sql`, `json` and `d.ts` files, excluding fixture/eval data, the lockfile, generated reports and `docs/architecture/`.

The original 1,400-line target remains the baseline and 1,450 is the hard review ceiling. The 50-line extension pays only for an event-backed live Theater, scenario-specific verdict and exception-first handoff; no dependency or workflow framework was added.

`docs/architecture/` is a presentation artifact: one reviewed data file plus a vendored renderer generate the public atlas and text twin. It is excluded because it does not enter the product runtime or its technical review path; its source, generated outputs and upstream license remain tracked and independently inspectable.

Crossing the ceiling requires deletion or an explicit scope decision. Tests, evidence validation and authority boundaries are never compressed to manufacture a lower count.
