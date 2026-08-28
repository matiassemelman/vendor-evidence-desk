# Executable line budget

The product release contains 1,400 non-empty handwritten executable/config lines. The count covers tracked `ts`, `tsx`, `css`, `mjs`, `sql`, `json` and `d.ts` files, excluding fixture/eval data, the lockfile, generated reports and `docs/architecture/`.

The 1,400-line target is now met exactly and 1,450 remains a hard review ceiling. The release demonstrates document-local analysis, deterministic reduction, exact revision authority, selective reuse, idempotent persistence, five tests, five live evals and an inspectable UI without adding a framework around them.

`docs/architecture/` is a presentation artifact: one reviewed data file plus a vendored renderer generate the public atlas and text twin. It is excluded because it does not enter the product runtime or its technical review path; its source, generated outputs and upstream license remain tracked and independently inspectable.

Crossing the ceiling requires deletion or an explicit scope decision. Tests, evidence validation and authority boundaries are never compressed to manufacture a lower count.
