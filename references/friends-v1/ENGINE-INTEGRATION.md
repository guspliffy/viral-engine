# Viral-engine integration brief for the friend trio

Source review: **b6f0e59a22ab36076e47e2bd4ebd815bca091ca5**, fetched 5 November 2026. This is newer than the earlier quality audit at `47bc45f`. No engine source, assets or storyboards were changed while making this pack. All interfaces below marked proposed require implementation; this document is not proof the characters already work.

## 1. The implementation decision

Add an **opt-in rig family with species-specific head/body geometry**, retaining the existing scene, timeline, prop, audio and render pipeline. Share useful limb/face/contact logic through explicit adapters; preserve existing potato defaults and golden frames. These illustrations have separate heads, muzzles, necks, elbows and knees. Merely changing a potato's color and adding ears will not reproduce them.

Prefer geometry built once from reusable code or free offline asset-building scripts, with lightweight runtime posing. If a hand-authored mesh is necessary for the muzzle/hair/hoodie, an offline Blender helper is acceptable; keep the resulting asset and rebuild instructions in the repo. A general runtime/renderer replacement or external AI generation dependency is outside scope.

Implement Rusty as the first end-to-end character. Validate his silhouette, muzzle, face, tail and grip before multiplying the approach across the other two. Moss can share some biped/paw mechanics but requires a different head surface and body proportions. Pip is the humanoid variant, not an animal head attached to a short potato body.

## 2. What the actual engine currently does

| Current source at the reviewed commit | Consequence for integration |
|---|---|
| [engine/load.mjs:15](https://github.com/guspliffy/viral-engine/blob/b6f0e59a22ab36076e47e2bd4ebd815bca091ca5/engine/load.mjs#L15) loads `characters/<cast.character>.json`; `castLook` at line 44 returns early for non-potato rigs | Isolated IDs can follow the existing path convention. A non-potato rig avoids this particular potato cast-look transformation, but it does not automatically create a renderer. |
| [stage.js:411](https://github.com/guspliffy/viral-engine/blob/b6f0e59a22ab36076e47e2bd4ebd815bca091ca5/engine/page/stage.js#L411) directly calls `new Character(def, c.id)` imported from potato.js | Introduce a narrow factory dispatch here or equivalent. A JSON `rig: "friends-v1"` is a **proposed new value**, not presently supported construction. |
| [potato.js:108](https://github.com/guspliffy/viral-engine/blob/b6f0e59a22ab36076e47e2bd4ebd815bca091ca5/engine/page/potato.js#L108) builds a lumped body sphere; head/face are not a separate general humanoid skeleton | Build distinct head and torso volumes; do not distort this sphere until it vaguely resembles the reference. |
| [face.js:98](https://github.com/guspliffy/viral-engine/blob/b6f0e59a22ab36076e47e2bd4ebd815bca091ca5/engine/page/face.js#L98) accepts a `place(u,v)` surface mapping, face layout and eye parameters | Reuse the expression/eye system where appropriate through a head-surface adapter. A capybara mouth needs a muzzle-aware anchor. Check every gaze/lid combination after remapping. |
| [timeline.js:855](https://github.com/guspliffy/viral-engine/blob/b6f0e59a22ab36076e47e2bd4ebd815bca091ca5/engine/page/timeline.js#L855) has potato-specific hand conversion using `LEG_H`, body height and squash | Parameterize attachment/limb metrics through rig data. Total standing height is not interchangeable with potato `body.height`. New longer limbs and separate head must not inherit incorrect scaling. |
| [stage.js:889](https://github.com/guspliffy/viral-engine/blob/b6f0e59a22ab36076e47e2bd4ebd815bca091ca5/engine/page/stage.js#L889) and later contact code directly use `body`, `arms`, `face`, `potatoParts`, costume data and arm curves | Adapt these consumers explicitly. Providing a decorative mesh without diagnostics would make new characters evade checks. A single torso ellipsoid does not represent a separate head, muzzle, ears and tail. |
| [looks.js:557](https://github.com/guspliffy/viral-engine/blob/b6f0e59a22ab36076e47e2bd4ebd815bca091ca5/engine/page/looks.js#L557) assigns procedural skin texture to each exposed `ch.skin`; shadow helpers also depend on `legs`, `rx`, `rz` and `potatoParts` | Guard/map material and shadow roles for the new rig. Non-potato `castLook` alone does not protect fur markings or skin from all potato-specific shading. |
| [assets-gltf.js:61](https://github.com/guspliffy/viral-engine/blob/b6f0e59a22ab36076e47e2bd4ebd815bca091ca5/engine/page/assets-gltf.js#L61) discovers `...Model` definition keys and preloads models, then `modelClone` uses scene cloning | Useful for rigid asset parts. Do not assume this is a complete animated skinned-character pipeline; shared bones/materials and animation bindings need proper isolation if using skins. |
| [clip-template.mjs:23](https://github.com/guspliffy/viral-engine/blob/b6f0e59a22ab36076e47e2bd4ebd815bca091ca5/storyboards/templates/clip-template.mjs#L23) now uses whole-frame sharpness, `motion: { feet: 2 }`, `rig: { hand: 2, eyes: 2 }`, and lighting 2 | Reuse applicable latest mechanics; do not reintroduce older motion or automatic depth-of-field defaults. Adapt gait/body dimensions and face placement before claiming compatibility. |
| [qa/preflight.mjs](https://github.com/guspliffy/viral-engine/blob/b6f0e59a22ab36076e47e2bd4ebd815bca091ca5/qa/preflight.mjs#L1), [qa/golden.mjs:25](https://github.com/guspliffy/viral-engine/blob/b6f0e59a22ab36076e47e2bd4ebd815bca091ca5/qa/golden.mjs#L25), `qa/regress.mjs` exist | Extend existing preflight, contact and temporal golden fixtures. Do not build an unrelated test service. |

The docs mention `rig.hold: 2` as a condition in the gate rollout, but that mention is not sufficient evidence of a fully available generic hold solver. Verify the active path at implementation HEAD before using it. Current stage code still has hand-position-based attachment paths. Similarly, do not assume eye/hand/feet mode 2 has already been adapted to non-potato proportions.

## 3. Files and interfaces to introduce

Proposed layout, not files created by this pack:

```text
characters/friends/rusty.json
characters/friends/pip.json
characters/friends/moss.json
engine/page/character-factory.js
engine/page/rigs/friends-character.js
engine/page/rigs/friends-geometry.js
engine/page/rigs/friends-face.js
engine/page/rigs/friends-secondary.js
assets/characters/friends/                 # if texture/static assets are used
references/friends-v1/                    # this pack, or its relevant files
storyboards/lookdev/friends/              # dedicated diagnostic fixtures
```

Use existing helpers when possible; do not split into modules solely to satisfy these names. Keep the entry point small, and keep new artwork/constants out of the potato class. Register existing `potato` to the original constructor unchanged. Unknown rig IDs should fail clearly rather than silently becoming potatoes.

### Rig contract

Define one minimal actor interface and adapt existing consumers deliberately. The following capabilities are requirements, not claims of a current API:

| Capability | Required semantics |
|---|---|
| Scene root and pose | One root at the floor between feet; `apply(state,time)` uses absolute story time. Head, torso and limbs have explicit descendants. |
| Scale and landmarks | Distinguish total height, torso dimensions, head/face anchors, shoulder/elbow/wrist, hip/knee/ankle and sole. Preserve the +Y/+Z/-X-right convention. |
| Hand sockets | Named left/right grip and pinch transforms; full orientation plus position. Fist center, palm center and socket need not coincide. |
| Foot support | Sole/toe anchors, actual contact phase, support-surface transform, previous/next support events. Handle sitting and intentional airborne phases explicitly. |
| Face/camera | Eye pair, mouth/gaze target and readable face region in head-local coordinates, transformed to world. Focus/frame from the face, not torso center. |
| Contact geometry | Body, head, muzzle, limbs, ears, clothes and tail proxies. Broad phase bounds plus accurate narrow tests where needed. Report intended contacts separately. |
| Visibility | Mesh/region IDs for face, muzzle/mouth, paws, required prop contact, ears and tail when narratively relevant. Same final pose as rendering. |
| Materials | Roles for fur, skin, cloth, hair, eyes, mouth and boots; preserve color/texture ownership through the look conversion. |
| Secondary state | Named ear/tail/tuft channels with deterministic sample/bake/history reconstruction. Include relevant state and parameters in existing cache hashing. |
| Disposal and cloning | No geometry/material leaks, shared mutable skeletons, or state bleed between two copies of the same character. |

Current `Character.rig()` supplies points in actor-root coordinates which stage converts to world. Preserve/document that convention in adapters. Do not double-transform telemetry or label local coordinates as world. Existing field compatibility can be supplied temporarily, but do not use hidden potato geometry as a fake collision/visibility implementation.

### Geometry and facial surfaces

Build a stable neutral mesh first. Use broadly rounded forms with careful silhouette control. Actual eye and mouth placement must be authored on each head/muzzle, not inferred from a generic torso width. For face reuse, provide a smooth `place(u,v) -> {pos,normal}` in the face host's space. Keep the face group under the moving head. If a common surface map cannot describe a muzzle accurately, separate eye/brow and mouth surface adapters rather than stretching all controls across one plane.

Rusty's cheeks/muzzle and Moss's long muzzle should be closed or consistently skinned surfaces with usable normals. Avoid overlapping coplanar cream decals that flicker. Prefer vertex colors or stable UV texture masks. A seam is acceptable on the hidden underside; a doubled outline across the muzzle is not. Teeth are small mouth-local geometry visible only at intended expressions, never fixed to the camera.

Pip's ears require a stable attachment surface and consistent anatomical left/right. Use one pivot per ear plus optional tip deformation. Model the notch in the left ear geometry so a pose cannot mirror it. Hair should be fixed sculpted locks with a small optional accent movement, not independent floating chunks.

### Proportion mapping

Use `CHARACTER-SPEC.json` starting dimensions. Rusty is 1.20 world units tall including ears, Pip 1.344 including hair, Moss 1.104 including ears. Do not feed these values straight into the old `body.height`: that field describes the potato body, not all-anatomy standing height. The new rig must distinguish anatomical metrics and transform hand/foot targets appropriately.

Pin the relative heights and identity landmarks first. Fine adjustment to match the approved look is expected. Record deviations in a small design-change note instead of silently changing height ratios, ear span or muzzle length for each shot.

## 4. Animation, constraints and contact

### Pose evaluation order

1. Map render time through the existing hold/story-time mechanism. Evaluate root path, authored body pose and expression state.
2. Resolve locomotion and support-foot anchors using the rig's own stance width, leg reach, sole geometry and turn limits. Reuse the latest gait planner with parameterized anatomy; inspect its potato home-foot constants before doing so.
3. Resolve object ownership and intended hand contact. Exactly one authority drives each prop transform: primary hand, prop path or explicit free-motion state. A second hand follows its own socket. Reject cyclic ownership.
4. Pose arms with stable bend direction and actual reach limits. Apply final palm/grip offsets, then verify the entire limb and cloth clearance. Do not solve a wrist and later move it with idle sway.
5. Apply head/ear/tail secondary motion within allowed constraints. If a parent correction changes an active hand or foot target, re-solve before rendering. Locked contacts have priority over decorative motion.
6. Update world matrices, emit diagnostics and render exactly that final state. Use the same pose at blur sub-samples; no random pose repair in the renderer alone.

The existing hand rig 2 improves wrist behavior; it is not proof that a new character's elbow reach, paw geometry or hand-prop attachment has been solved. Adapt palm axes and digit bases. Check the sign convention of mirrored hands rather than flipping the full mesh with a negative scale that corrupts normals or grip orientation.

### Hands and props

Four digits total: one thumb plus three fingers. Define grip and pinch transforms from the visible pads, with artistically usable palm orientation. Retain original grip family behavior where valid, but calibrate it to each new hand size. Use the existing grip library for phone/mug/box/handle sequences; do not copy raw world coordinates from potato episodes.

For a two-hand object, both contact points must be reachable and visibly supported. Do not treat the average of hand centers as proof of two contacts. Specify primary-hand ownership or prop-driven hands, then validate both sockets. Test constant offset, accumulated drift and switch/release continuity, not only sudden frame-to-frame jumps. An upright mug may have an explicit orientation rule; it should not arbitrarily inherit every wrist rotation.

### Ears, tail and weight

Rusty's tail uses five to seven joints along a continuous volume. Store stripe coordinates on the mesh/UV, not in world space. Suggested controls are authored attitude, emotional amplitude and explicit contact state; they are new controls until implemented. A small root-driven damped follow-through can add lag. Bound the tail against body, floor, furniture and friends. The contact version of “panda pins his tail” must lock the relevant segment under the paw and let only an allowed distal section move.

Pip's ears support asymmetrical lift/drop/splay, with bounded root rotation and little tip lag. Do not allow an ear to pass through hair/head to reach a pose. Moss's ears have a much smaller range. Secondary motion must be reconstructed from known initial state or baked/cached at fixed steps so random seeks and worker chunks agree. Do not use wall-clock delta or unseeded randomness.

For all three, use explicit anticipation, weight transfer and settle. Foot support cannot be inferred only from whether a walk action exists: one foot remains planted during part of a walk. Set comfortable reach from each rig's geometry and reject impossible combinations rather than stretching arbitrarily or moving the camera to hide them.

### Face state and thought

Keep named expression presets per character, with declared owned channels. Reuse existing lids/brows/mouth/gaze fields where compatible; do not invent JSON keys and assume the runtime reads them. `CHARACTER-SPEC.json` labels new semantic channels as proposals for this reason.

Validate down/side gaze with narrowed lids and every blink transition. The latest eye rig 2 can help but its thresholds and geometry need checking on the new face. Keep pupil/iris visibility within a readable aperture except intentional closed eyes; do not force eyes open during a real blink. Returning to neutral must remove unintended stale controls. Choose attention and expression timing in the existing acting library; no paid voice service is required. Optional speech/voice design is a later decision, not a reason to assign an existing fighter's voice silently.

## 5. Materials, lighting and CPU cost

Preserve the image palette with matte material roles. The JSON hex colors are authored sRGB starting colors; the paintings include illumination and shadows. Calibrate under a fixed neutral light before evaluating painted-set lighting. The new characters must not inherit golden-potato skin remapping, procedural potato specks or unintended hatching over eyes/facial markings.

Keep the current `anime-pro` pipeline if it produces the target after material-role adaptation. Evaluate current lighting 2 rather than reimplementing lighting. Leave depth of field off for initial reference checks and use sharp captures; motion blur cannot hide contact defects. Painted cloth grain and fur strokes should be static and fine enough not to shimmer at phone size, but not so fine that encoding destroys them.

Initial soft budget: aim for roughly **25,000 or fewer visible triangles and about 20 material batches per character**, excluding additional outline/shadow passes. These are engineering starting targets, not measured limits or acceptance guarantees. Report actual draw calls after the look pipeline. Reduce hidden geometry and share atlases where useful; prioritize face, silhouette and hands over tiny pockets or strands.

Avoid per-frame fur meshing, cloth simulation, rebuilding hair and high-frequency procedural noise. Preserve existing hand-mesh workers and caches where useful. Static parts should be built once; dynamic parts should update small transforms/vertices. A free offline GLB can be used for rigid pieces; if choosing skinned assets, implement correct skeleton cloning, pose ownership, joint telemetry and cache dependencies explicitly. The current `modelClone()` scene clone is not that guarantee.

Profile on the actual four-core software renderer: init time, pose time, draw time, cache hits, peak memory and total wall time. Compare an equivalent existing scene with equal output dimensions and cast count, and report both absolute numbers and differences. Do not run several full renderers concurrently and call their contention an animation slowdown. No GPU upgrade, paid tool or remote model should become a hidden requirement.

## 6. Validation and delivery sequence

### Milestone A — identity and anatomy

Build only the neutral character and material roles. Produce one reference board per character with actual front, both three-quarter, profile and rear engine views. Compare to this pack side by side, with matching framing and neutral light. Check head/torso separation, muzzle depth, ears, four-digit hands, costume attachment and relative heights. A pixel-diff against a painting is not a meaningful acceptance test; the engine board needs visual design review. Engine-to-engine golden comparison is appropriate after approval.

### Milestone B — face and grasp

For each character, inspect the four supplied expressions and transitions, plus gaze extremes and blinks. Check with a 270×480 preview and full-resolution face crops. Add one-hand cylinder/mug hold, two-hand phone/box hold, reach, turn/lean while holding, transfer and release. Inspect final contacts every frame and normal-speed playback. Include a deliberately detached/penetrating fixture to prove the diagnostics actually fail.

### Milestone C — motion and interactions

Use short diagnostic sequences, not a new production episode:

| Sequence | Acceptance |
|---|---|
| Start, walk, stop, turn, step backward | Supporting feet remain planted; swing clears floor; head/torso balance matches each character |
| Sit, reach to table, stand | Feet/chair/body contacts are coherent; cuffs, hem and tail clear nearby surfaces |
| Held prop through body turn and lean | Both intended contacts remain visible and within calibrated socket tolerances; no wrist flip |
| Rusty tail lift, wag, wrap, pin and release | Connected tail, stable bands, no penetration, constrained segment remains constrained |
| Pip ear reaction and head turn | Fixed left notch, no ear/hair collision, no silhouette popping |
| Moss surprise then calm | Clear thought without changing muzzle proportions or leaving a stale eye state |
| Two copies of same character in one scene | No shared skeleton/material/secondary-motion state |
| Two friends close together | Ears/tail/hands do not unintentionally cover the required face or prop; overlap exceptions remain narrow |

Test absolute-time pose evaluation sequentially, randomly, in reverse order and across normal worker/shard boundaries. Compare transform positions and orientations (quaternion signs can differ while representing the same rotation), then inspect selected rendered frames in a pinned environment. Confirm new geometry/texture/secondary-motion data invalidates relevant cached output. Do not remove numerical safeguards solely to match a painting.

### Milestone D — integration and regressions

Read the current command help before running tools. Existing entry points include:

```text
node qa/preflight.mjs <new-fixture.json> --fresh --quick --gate 2
node engine/render.mjs <new-fixture.json> --layout
node engine/render.mjs <new-fixture.json> --stills 0,0.5,1
node qa/regress.mjs
node qa/golden.mjs --base <pinned-baseline-commit>
```

`<new-fixture.json>` and the baseline are placeholders to replace with files/commit actually created and verified. Still/preview commands may write artifacts and must be run only during the implementation task, not mistaken for actions already completed by this reference pack. Golden comparison needs a suitable local baseline and dependencies; do not claim it passed if unavailable or skipped. New fixtures absent from the old baseline need initial visual approval, not an automatic pass.

The latest gate/rig improvements are opt-in in some paths. Check the target fixture's supported controls, use appropriate latest options, and report any coverage still absent for the new rig. Keep legacy potato rendering unchanged. A green result caused by omitting new characters from contact/visibility collection is a failure of integration.

### Completion report

Return actual engine comparison boards, small diagnostic motion/contact previews, source/assets and rebuild instructions, tests actually run, measured performance, and remaining limitations. Explain any intentional change from the reference. Do not say “flawless” based only on attractive stills, source inspection or passing a subset of tests. No production episode, publication, deployment or unrelated refactor is included.
