# T4: Chip lying in his sleeping bag (FFF 02 "Bear in the camp", draft 2)

Owner: builder T4. Files you own: `engine/page/props-bearcamp.js` (add one kind, touch nothing else in it),
`storyboards/series/fight-flight-freeze/02-bear-camp/bench/make-lyingbag.mjs` (new), its stills. Nothing else.

## Why
Jonny's panels 05 and 06 (`panels/05.png`, `panels/06.png` in this folder): Chip (characters potatobrawl/chip) lies
on his back, curled, eyes shut, zipped into a navy mummy sleeping bag (#3c4a7a), only his face showing in the hood.
In 05 the bear sniffs his face in the tent door; in 06 the bear walks off dragging the bag along the grass by its
foot end in its teeth, Chip inside. Draft 1 used `sleepbag` (engine/page/props-camp.js), which is made for a SITTER:
its `recline` only tips the shell about its middle, so at recline 85 the shell floats at chest height as a big
blob and Chip sits upright inside it. Jonny on draft 1: "?" over it. It must read at once as "a potato zipped into a
sleeping bag, lying on the ground".

## Build
A new kind `lyingbag` in props-bearcamp.js (same style as the file's other kinds: header lines at the top, cel look,
quilted baffles like sleepbag's, no ink line problems):
- Lies flat on the ground: hood/head end at the origin side, foot end along +z, about 1.25 m long (fits Chip lying, his
  feet inside), puffy, the drawstring hood round an opening where the rider's FACE shows; the rest of Chip is hidden.
- A rider: find how the engine can show a character lying on its back inside (look at `ride`, `pitch`, the bench
  lying lesson in memory is NOT available to you: read engine/page code for `ride` and the actor `pitch`). If a lying
  rider is not possible cleanly, the face-only route is fine IF it is Chip's real rigged face (expressions, lids).
  Say which route you took and why.
- Grip "foot": the tied foot end, the point the bear's mouth holds (the clip moves the bag so this grip sits at the
  bear's mouth; give the grip's local point in the header).
- Params: `drag` 0..1 a slight lift of the foot end (the bag is pulled by it: foot end up ~0.25 m, the body sliding
  flat), `cover` 0..1 hood tightening round the face (1 = only eyes and nose).
- Stays deterministic (no Math.random, no clock except the clip clock if you need it).

## Proof
A bench storyboard (make-lyingbag.mjs) on a plain grass env with Chip in the bag: stills from the side (camera at the
bag's +x, 3 m, eye 0.9) and 3/4 front, at cover 0 and 0.6, drag 0 and 1, and one still with the bag's rot 90 moved
along x by 1 m (a drag). Contact sheet `bench/lyingbag-sheet.png`. Check `node qa/clear.mjs` on the bench and that no
part of Chip shows outside the bag except the face.

## Report
5-10 lines: the route, the exact calls a clip makes (prop spec, ride/pitch calls, the grip point), the sheet path,
anything that looks off. Commit on the current branch (fff-02-bear-camp) with the attribution lines:
Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01KjyEULwhyqjuPsC4yy1fND
Do not push. Do not run qa/golden.mjs (the director will).
