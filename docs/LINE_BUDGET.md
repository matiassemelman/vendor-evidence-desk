# Executable line budget

The release contains 1,286 non-empty handwritten executable/config lines. The count covers tracked `ts`, `tsx`, `css`, `mjs`, `sql`, `json` and `d.ts` files, excluding fixture/eval data, the lockfile and generated reports.

The target is 1,400 lines and 1,450 is a hard review ceiling. The unused budget is intentional: the release demonstrates document-local analysis, deterministic reduction, exact revision authority, selective reuse, idempotent persistence, five tests, five live evals and an inspectable UI without adding a framework around them.

Crossing the ceiling requires deletion or an explicit scope decision. Tests, evidence validation and authority boundaries are never compressed to manufacture a lower count.
