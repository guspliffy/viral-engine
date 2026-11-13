TASK T6 (v3): the gun fight in the street: a revolver, three zombies that lurch and drop when shot, our building's street door
WHY: v3 (Jonny 12 Nov 2026: "the fight should be a gun fight ending in a being chased by zombies and then getting back
  to shelter"; on the v2 fight: "the fighting scene isnt a real fight"). On the way back from the supermarket three
  zombies block the street; the Gunslinger draws and fires; each one that is hit drops (no blood); the shots call the
  horde; the friends run home and dive through their building's street door, which two friends hold open.
DESIGN: BRIEF-COMMON.md (read first, same folder), panels 11, 12 and 13 of panels-sheet-v3.png (same folder; look at it)
  and their text in /mnt/project-files/video-scripts/2026-11-08-survive-it/11-zombie-apocalypse-V3-IMAGE-PROMPT.txt.
RULES: CLAUDE.md "Rules that apply to every task". REALISTIC, no blood, no wounds, no gore: a zombie that is hit jolts
  back and falls flat on its back, and that is all.
READ: `engine/page/props-zstreet.js` lines 1-140 (the street set: its header, the facade of OUR HOUSE at x -4.9, the
  street floor y -15, the zhorde zombies: reuse their look exactly; import the helpers if exported, else copy what you
  need), `engine/page/costumes-cast.js` lines 180-200 (the Gunslinger's `pistol()` and GUN_HANDLE: the revolver must look
  like that one, import or copy it), `storyboards/lookdev/make-zoutbreak-bench.mjs` (bench pattern).
OWN: `engine/page/props-zfight.js` (a stub exists and is ALREADY registered in props3d.js: replace its body, keep the
  three export names), `storyboards/lookdev/make-zfight-bench.mjs` + its json. Touch nothing else.
CONTRACT (world metres; the cast are ~1.0 m tall potatoes; shots are at street level, 2-6 m away, so detail reads):
  zrevolver  the Gunslinger's revolver (same look as costumes-cast.js pistol(), scale 1.35 like there), held in one
    hand. Origin = the centre of the wooden handle; the barrel points +z at rot 0. GRIP `hand` at the origin (the
    fist closes on the handle), so a director's `grab { grip: "hand" }` puts it in the glove barrel forward. State
    `flash` 0..1: a muzzle flash at the barrel's tip (a small hot-white core, a 4-6 point yellow-orange star ~0.25 m,
    a soft glow card; noOutline); the director pulses it 0 -> 1 -> 0 over 2-3 frames per shot. `smoke` 0..1: a thin
    grey wisp rising from the muzzle, drifting deterministically with t (cards). It must not be see-through to the
    checks (a held thing is solid, like zphone).
  zshot  `n` (3) single zombies of the zhorde look at FULL detail (they are close: outlines are fine here), standing
    on a flat ground, spaced along x by `gap` (1.1) around the origin, all facing +z at rot 0 (toward the shooter).
    Deterministic variety from `seed` (height +-8 %, sprout layout, torn clothes colour: dull greys and browns).
    State `adv` (0): metres each has lurched forward along +z; while adv moves, a stiff
    lurching walk cycle driven by t (arms out forward, a limp, head lolling). `d1`, `d2`, `d3` 0..1 (0): zombie i is hit
    and drops: 0-0.15 a jolt back (body snaps back ~15 deg, arms fly up), then it topples backward and lies flat on
    its back at 1 (rotation about its feet, ending flat on the ground, a small settle). A fallen one stays down.
  zstreetdoor  our building's street entrance, built as a shallow porch IN FRONT of the facade (the facade plane is
    solid and stays): stand it at x -4.9 + 0.02, y -15, facing +x at rot 90 (put the rot in the header example).
    A stone/plaster frame 1.7 wide x 2.5 high protruding 0.7 from the facade, a step, a heavy dark-green wooden door
    1.0 x 2.15 with a small glass panel and a brass handle, hinged on its -z side (rot 90 world), swinging INWARD (into
    the porch); behind the door opening a warm-lit stairwell painted on the porch's back wall (first steps of a stair,
    a dim yellow ceiling lamp, mailboxes) so an open door reads as "inside, safety". A house number plate. State `open`
    0..1 (0 shut, 1 swung fully open inside the porch); `shake` 0..1 (fists on the shut door: the door trembles in
    its frame with t, small). The porch interior floor at y -15; a character must fit through the opening (1.0 wide).
Bench: zrevolver from the side and from the front with flash 1 and smoke 1; zshot at street level with d1 0.1 / d2 0.5 /
  d3 1 and one with adv moving; zstreetdoor shut and open 1 from 4 m. Also the in-hand proof for zrevolver
  (`node storyboards/lookdev/make-grip-tests.mjs --prop zrevolver --hold hand`). Max 8 bench stills.
REPORT: the header text, the bench sheet path, the grip-test sheet path, anything in the contract you could not do.
