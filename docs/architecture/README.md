# Architecture walkthrough

The interactive atlas and its text twin explain the verified release from one
editable source.

| File | Role | Edit it? |
|---|---|---|
| `atlas/data.mjs` | Structures, flows, chapters, decisions and claim matrix | Yes |
| `atlas/template.html` + `atlas/build.mjs` | Vendored System Atlas renderer | Only when upgrading upstream |
| `atlas.html` | Interactive walkthrough served at `/architecture` | No; generated |
| `SYSTEM.md` | Accessible text twin and question index | No; generated |
| `CONTEXT.md` | Short domain glossary | Yes |

Build with `pnpm atlas:build`. Never hand-edit the generated files.

The renderer is vendored and minimally adapted for the evidence table from
[inkboard/system-atlas](https://github.com/inkboard/system-atlas) at
`6b3c91bc54e638ff58699b04199d994369ba7e3c` under the included MIT license.
