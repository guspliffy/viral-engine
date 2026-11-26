# Registry lines for engine/page/props-armrest.js (builder A) - for the director to apply

## engine/page/props3d.js (3 edits)

1. With the other imports (near line 151, after the STEAK_KINDS import):
```js
import { ARMREST_KINDS, ARMREST_GRIPS, ARMREST_STATE } from "./props-armrest.js";   // rival duel 01 armrest war: sharedarm, butterknife, fakearm, crowbar
```
2. With the other Object.assign lines (after `Object.assign(KINDS, WAKECABIN_KINDS, ...)`, near line 1560):
```js
Object.assign(KINDS, ARMREST_KINDS); Object.assign(GRIPS, ARMREST_GRIPS);   // rival duel 01 armrest war (props-armrest.js)
```
3. KIT_STATE (the long `const KIT_STATE = { ...ZFLAT_STATE, ...` line, near 1537): add `...ARMREST_STATE, ` right after `...ZWAIT_STATE, `
   (without it `guard`, `press`, `butter` do not tween: the "prop" set would jump).
   NB: KIT_STATE is declared above the Object.assign line of step 2 only if the import in step 1 is a top-level import (it is): order does not matter.

## storyboards/lib/grips.mjs SIZE (DESIGN 4b, after the `corncob` line)
```js
  sharedarm: { h: 0.72 },            // props-armrest.js: rest hold, a glove or a forearm on the console top
  butterknife: { len: 0.2, r: 0.006 },   // props-armrest.js: upright on its blade tip: thin pinch at 0.6 x 0.2 = y 0.12, on the handle
  fakearm: { r: 0.07, h: 0.2 },      // props-armrest.js: upright, hand end up: mug hold round the sleeve, fist at 0.66 x 0.2 = y 0.13
  crowbar: { r: 0.02, h: 0.636 },    // props-armrest.js: upright, hook up: mug hold, fist at 0.66 x 0.636 = y 0.42; the other glove on ARMREST_GRIPS.crowbar.high
```
