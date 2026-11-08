# Builder brief (copy, fill, send as the builder's prompt)

```
TASK T<id>: <one-line goal>
WHY: <what the viewer should get from this shot / prop / set>
DESIGN: BOARD §<n> (<path to BOARD.md>); panels <n> (<board.png>); Jonny's brief <path>
RULES: docs/rules/<file>.md (only the ones this task needs)
READ: <files>; nothing else unless blocked
OWN: <files to create or change>; touch nothing else
CONTRACT: <prop/env ids, sizes from the staging proof, their API; what the director wires into the generator>
MACHINE: <"yours for layout/preflight/render" or "no layout or render: benches only">
DONE WHEN:
- <criterion with exact numbers, e.g. "card reader 15 x 22 cm, screen reads 84.00 at 360 px wide in the bench still">
- `node qa/preflight.mjs <sb>`: no FAIL; `render.mjs <sb> --layout`: contact gate clean
- draft stills contact sheet at <path>
OUT OF SCOPE: <tempting extras to skip: new moves, engine changes, renders>
```

Report back: STATUS / FILES / CHECKS / ASSUMPTIONS / NOTES, at most 150 words (`.claude/agents/builder.md`).
