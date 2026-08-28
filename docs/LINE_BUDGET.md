# Executable line budget

The published baseline at `fb0de8f` contains 884 non-empty handwritten executable/config lines. The count covers tracked `ts`, `tsx`, `css`, `mjs`, `sql`, `json` and `d.ts` files, excluding fixture/eval data and generated files.

The revision-bound Case Lab replaces—not wraps—the current extraction token, whole-packet model call, overwrite-by-case persistence, one-call UI trace and their tests. Approximately 180–250 existing lines are deletion/replacement seams. A credible full implementation is 1,230–1,450 lines.

The release target is 1,400 lines and 1,450 is a hard review ceiling. Crossing it requires deletion or an explicit scope decision; tests, evidence validation and authority boundaries are never compressed to meet the number.

This rebaseline was chosen because retaining 1,000 would require dropping the real document fan-out, selective reuse or Theater—the evidence the release exists to make visible.
