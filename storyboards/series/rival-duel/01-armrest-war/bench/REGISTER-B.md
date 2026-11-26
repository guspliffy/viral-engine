# Registry lines for engine/page/props-armrest-fx.js (builder B), for engine/page/props3d.js

Exports: `ARMREST_FX_KINDS` (pilothat, sleepmask, wingspin, ejecthatch, seatrocket, cockpitcard), `ARMREST_FX_STATE` (wingspin { show: 1 },
ejecthatch { hatch: 0 }, seatrocket { flame: 0 }), `ARMREST_FX_GRIPS` ({}; nothing is held, no GRIPS line needed), `WEDGE_FIT`, `skinXY`, `skinN`.

1. Import, next to the other props-*.js imports (e.g. after the props-zfight.js line):

```js
import { ARMREST_FX_KINDS, ARMREST_FX_STATE } from "./props-armrest-fx.js";   // rival duel 01 armrest war: pilothat, sleepmask, wingspin, ejecthatch, seatrocket, cockpitcard
```

2. Kinds, with the other `Object.assign(KINDS, ...)` lines (after the HEIST ones):

```js
Object.assign(KINDS, ARMREST_FX_KINDS);   // rival duel 01 armrest war (props-armrest-fx.js)
```

3. State defaults: add `...ARMREST_FX_STATE` to the `KIT_STATE = { ... }` spread (e.g. first: `const KIT_STATE = { ...ARMREST_FX_STATE, ...ZFLAT_STATE, ...`).
   Without it `hatch`, `flame` and `show` have no default and the first "prop" tween jumps.

Director notes:
- Worn kinds: `{ kind: "sleepmask", wear: "wedge", x: 0, y: 0, z: 0 }` and `{ kind: "wingspin", wear: "wedge", x: 0, y: 0, z: 0 }`. The mask: scale 0 -> 1 in 2 frames (prop `scale`);
  the pin: key `show`. Both fit Wedge only (WEDGE_FIT); spec.fit / spec.at override.
- Props far from the floor (ejecthatch at y 2.35, seatrocket under the floor, cockpitcard at the doorway) may need `staged: "<reason>"` for the prop-support check.
- Scratch tools in this folder: measure-wedge.mjs (face and skin numbers of Wedge, node, no browser), measure-jacket.mjs (his jacket shell by ray).
