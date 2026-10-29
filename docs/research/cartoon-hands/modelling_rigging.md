# Modelling and rigging stylized cartoon hands as one surface with the arm

Scope: 3D modelling, topology, rigging and toon-shading practice for stylized hands (4-finger: 3 fingers + thumb, glove and mitten hands), aimed at replacing an engine hand built from glued primitives (palm ellipsoid + capsule fingers + knuckle spheres + thumb capsule on a tube arm, toon shaded with outlines) with one that reads as a single piece.

Source quality: production-grade primary sources on stylized *hands* specifically are scarce on the open web. The strongest primary source found is Arc System Works' own Guilty Gear toon-line lecture (inverted-hull outlines, outline normals, closing gaps in valleys and at glove rims). The Blender Rigify manual is primary for rig structure. Topology and twist-bone advice comes mostly from practitioner forums (Polycount, Blender Artists), which is consistent but anecdotal. I found no reliable published numbers for the hands of Mario, Sonic, Kirby, Animal Crossing villagers, Minions, Crash or Pokémon. See the Gaps sections.

## 1. Topology of stylized hands: one mesh with the forearm, wrist loops, finger branching, thumb mass, poly count

### Takeaway
Practitioners build the hand as one quad mesh continuous with the forearm. The palm is blocked out as a box and the digits are extruded or merged from it, with loops at every bending joint (about three per joint) and poles and triangles kept off the wrist, knuckles and finger joints. No authoritative source gives a stylized-hand poly budget or exact loop counts, so those numbers are gaps.

### Cited Findings
- Box-palm-first workflow: the palm is blocked as a polygonal cube sized to the palm and the digits are added afterwards (Maya cartoon-character course, "Blocking out the hand") — [LinkedIn/Lynda: Modeling a Cartoon Character in Maya](https://origin-www.lynda.com/Maya-tutorials/Blocking-out-hand/191958/378124-4.html)
- For a simple three-finger creature hand, the digits are extruded from the box's faces, the tips are bevelled, and edge loops are added at the joints to form knuckles and finger-pad indents — [Highend3D: Creature Hand Tutorial (Erin Nicholson)](https://www.highend3d.com/tutorials/creature-hand-tutorial-by-erin-nicholson); after extrusion, specific vertices are collapsed to tidy the branch area — [Highend3D tutorial p.2](https://jobs.highend3d.com/3dsmax/tutorials/characters/c/creature-hand-tutorial-by-erin-nicholson/page/2)
- Duplicate-and-merge alternative: model one finger in detail, duplicate it to the other positions, then combine and merge edges into one seamless all-quad mesh — [SimplyMaya forum](https://simplymaya.com/forum/showthread.php?p=77474)
- Wrist on a cartoon hand: carry the extra edges a little further up the forearm, and put any needed triangle in a non-deforming area just before or after the wrist — [Blender Artists: Best way to topologise this hand](https://blenderartists.org/t/best-way-to-topologise-this-hand/604296)
- Add more topology at the knuckles; the palm needs clearly defined pads with a crease between each — [Blender Artists: Hand Topology/Proportions](https://blenderartists.org/t/hand-topology-proportions/490517)
- Stretching and deformation problems concentrate at the wrist, elbow, knees and fingers, so move triangles and poles away from them — [GameDev.tv community: Hand Topology Help](https://community.gamedev.tv/t/hand-topology-help/255048)
- Practitioner rule of about three edge loops per joint for clean deformation — [ahmadmerheb.com: Hand topology](https://ahmadmerheb.com/?p=93918) (secondary, blog-level source)
- Wrist resolution example: a Polycount user had 9 vertices around the wrist where the reference seemed to have 11 or 12, and the thread discusses raising it without changing the whole body (the thread is about game limbs) — [Polycount discussion](https://polycount.com/discussion/comment/2714529) (summarised via search; the page returned 403 on direct fetch)
- Drawing-side guidance carried into 3D: treat the thumb as a separate wedge attached to the palm, since it moves on a different plane from the fingers — [Proko: How to draw cartoon hands](https://www.proko.com/how-to-draw-cartoon-hands-comic-cartoon-and-mickey-mouse/)
- One extracted Genshin Impact character was reported at about 17,616 triangles in total, with its vertex layout "purely to support better deformation" (unverified forum claim; no hand-specific count) — [Polycount comment](https://polycount.com/discussion/comment/2761397)

### Inferences
- The engine's look of "separate parts" comes from topology. Each primitive is a closed surface with its own silhouette, shading terminator and outline hull, so every junction shows a line. Practitioners avoid this by building one manifold mesh: palm box, fingers branching from its front face, thumb pulled from the side face, wrist ring continuous with the forearm tube.
- Implementable topology for a procedural 4-finger hand, derived from the findings above. The specific counts are my proposal, not sourced numbers:
  - Use a constant ring count down the forearm (e.g. 8 or 12 vertices per ring) so the arm tube and wrist share rings and no seam is possible. With 12 around the wrist, the distal palm edge can split into 3 finger rings of 4 vertices each, a clean branch with no extra poles in the finger tubes. The thumb takes a 4-vertex patch from the side of the palm (the thenar side) one ring back from the knuckle line.
  - Place three loops at each bending joint (wrist, MCP knuckle row, each finger joint), as the "three loops per joint" rule suggests, and keep the poles from the finger split on the palm between the knuckles (the webbing), not on the joint loops.
- Branching alternative that needs no hand topology work: define the hand as an implicit surface (smooth-min union of the palm, finger and thumb capsules and the arm tube, i.e. SDF blending with a blend radius of a few mm), then polygonise it (marching cubes or dual contouring) and skin it from the nearest bones. Smooth-min gives fillets at the finger roots and the wrist automatically. This matches the "one continuous surface" goal without hand-authored loops, but it costs a remesh per hand shape and gives no clean loops for deformation.
- Mitten or glove hands (fingers merged, thumb separate) reduce the problem to one branch (thumb), so they are the cheapest way to make the hand read as one piece.

### Gaps
- No primary (studio) source gave triangle budgets for stylized game hands (e.g. Nintendo, Sonic Team, Mediatonic). The only figure found is a whole-character count for Genshin.
- The Polycount wiki Limb Topology page (wiki.polycount.com/wiki/Limb_Topology) returned HTTP 503, and the Polycount hand-topology threads returned 403, so their loop diagrams couldn't be read.
- No source documents the interdigital (webbing) loop flow or the thenar mass topology with numbers.

## 2. Forearm into wrist: taper, no hard edge, and deformation when the hand rotates

### Takeaway
The wrist stays attached on rotation because of (a) continuous geometry with extra loops just past the wrist, and (b) forearm twist distribution: 2–3 twist bones (or segments) that each take a share of the wrist roll, with weights blending from the twist bones near the wrist back to the forearm bone near the elbow. Volume loss ("candy wrapper") is handled with dual-quaternion "Preserve Volume", corrective smoothing or shape keys.

### Cited Findings
- Linear blend skinning loses volume when the forearm twists (the candy-wrapper look). Dual-quaternion skinning avoids the loss but bulges at bent joints — [Phys.org, Disney Research joint-bending technique (2016)](https://phys.org/news/2016-07-character-animation-technique-realistic-joints.pdf); [BrightSurf summary](https://www.brightsurf.com/news/LNMJE6E1/character-animation-technique-produces-realistic-looking-bends-at-joints.html)
- Add 2–3 twist segments to the forearm so each takes a fraction of the wrist rotation (Biped/CAT advice) — [Autodesk forum: rotate wrist and have forearm twist](https://forums.autodesk.com/t5/3ds-max-animation-and-rigging/rotate-wrist-and-have-forearm-twist-automatically-cat-rig/m-p/8986259)
- Weights lean toward the twist bones near the wrist and blend back to the main forearm bone near the elbow. Twist bones should be set up before skinning, since adding them afterwards makes weighting harder — [Polycount comment](https://polycount.com/discussion/comment/1687102) (via search summary)
- Blender options: "Preserve Volume" in the Armature modifier as a simpler alternative to building twist systems (Iker J. de los Mozos); weight painting plus Corrective Smooth (Samuel Francis); a bones-and-constraints wrist setup (Royal Skies) — [80.lv: Make your character's wrists move naturally](https://80.lv/articles/make-your-character-s-wrists-move-naturally-with-this-blender-tutorial)
- Preserve Volume can break deformation when vertex groups cover the whole limb; clean the vertex groups per bone, or turn it off and use corrective shape keys — [Blender Artists: Preserve Volume broken?](https://blenderartists.org/t/preserve-volume-broken/661620); [Blender Artists: candy wrapper deformation](https://blenderartists.org/t/beginner-to-blender-and-require-help-please-candy-wrapper-deformation/1545879)
- Packt's Blender rigging book has a dedicated "wrist bone twisting" section — [Packt: 3D Character Rigging in Blender, ch. 8](https://packtpub.com/en-se/product/3d-character-rigging-in-blender-9781803238807/chapter/chapter-8-beyond-the-basics-11/section/wrist-bone-twisting-ch11lvl1sec50)
- Rigify's arm takes "Limb Segments" ("the number of additional tweak controls each limb bone will have") and "B-Bone Segments" ("the number of b-bone segments each tweak control will be split into"). Bendy-bone segments are Blender's way of spreading twist and bend smoothly along the forearm — [Blender Manual: Rigify Limbs](https://docs.blender.org/manual/en/latest/addons/rigify/rig_types/limbs.html)
- UE: automatic forearm twist in Modular Rig is shown in the Control Rig Sample Pack — [Unreal forum: Modular Rig forearm twist](https://forums.unrealengine.com/t/modular-rig-forearm-twist/1997065)
- In some game characters a procedural wrist bone is added for this purpose (a Lumine port changelog lists "added procedural bones for the wrists") — [Steam Workshop changelog](https://steamcommunity.com/sharedfiles/filedetails/changelog/2252304893?p=8)

### Inferences
- For a procedural engine without a skinning pipeline, this is how the twist distribution maps: when the hand rolls by angle θ about the forearm axis, rotate each forearm ring i (of n, from elbow to wrist) by θ·(i/n), optionally eased so the last 30–40% of the forearm takes most of it. That is exactly what 2–3 twist bones with blended weights produce, and it removes the "detached wrist" look where a rigid hand turns on a static tube.
- Bend (flexion/extension) at the wrist: interpolate the wrist rings between the forearm frame and the hand frame (e.g. slerp at 0.5 for the ring at the joint, 0.25/0.75 for the neighbours), so the joint is a fillet, not a hinge. Dual-quaternion blending, or simply scaling the joint ring by about 1/cos(θ/2), preserves its thickness.
- The wrist should be a ring narrower than both the palm and the forearm (cartoon taper), and the palm should flare out from it over at least one or two rings. A palm ellipsoid touching a cylinder tangentially gives a crease line instead.

### Gaps
- No studio source (Pixar, DreamWorks, Blue Sky) was found giving their stylized wrist rig specs. The search found no SIGGRAPH stylized-arm paper with numbers.
- The exact twist percentages per bone used in commercial game rigs weren't found in a citable source.

## 3. Rigging 4-finger cartoon hands: bones, curl controls, fists, squash and stretch, keeping the fingers attached

### Takeaway
Standard practice is a chain of 3 bones per finger (2 for the thumb plus a metacarpal or palm bone), with a master control per finger whose scale or rotation drives the curl of all segments ("automation"), plus palm bones that fan the fingers for spread and cupping. Pose sliders or libraries (fist, open, point) sit on top. Fingers stay attached when curled because the knuckle loops are weighted across both the palm and the finger bones.

### Cited Findings
- Rigify `limbs.super_finger`: needs a chain of at least two connected bones; a master control's scale drives bending on a chosen "Bend Rotation Axis" ("Defines the automatic rotation axis to be linked to the scale of the master bone"), with B-Bone segments per tweak control and optional extra IK — [Blender Manual: Rigify Limbs](https://docs.blender.org/manual/en/latest/addons/rigify/rig_types/limbs.html)
- Rigify `limbs.super_palm`: needs at least two bones with the same parent (the metacarpals); the control on the last palm bone spreads and rotates the inner palm bones automatically ("Primary Rotation Axis"), with "Both Sides" blending influence between the controls on either side of the palm — [Blender Manual: Rigify Limbs](https://docs.blender.org/manual/en/latest/addons/rigify/rig_types/limbs.html)
- Rigify `limbs.simple_tentacle` (the manual says it can be used for fingers): "Automation Axis" makes later controls copy the local rotation of earlier ones (a Copy Rotation constraint), the usual "one control curls the whole finger" behaviour — [Blender Manual: Rigify Limbs](https://docs.blender.org/manual/en/latest/addons/rigify/rig_types/limbs.html)
- Rigify recommends a separate "held object" control (basic.raw_copy) as a shared parent for the fingers, for parent switching when holding props. Finger IK keeps a fingertip pinned to a surface and is meant for temporary locking — [Blender Manual: Rigify Limbs](https://docs.blender.org/manual/en/latest/addons/rigify/rig_types/limbs.html)
- Anime-style posable hand assets combine about 15 preset anime poses on a slider with per-finger and palm bones for fine-tuning — [Clip Studio Assets: 3D hands (anime preset)](https://assets.clip-studio.com/en-us/detail?id=2103301); [Clip Studio manual: 3D Hand Models](https://help.clip-studio.com/en-us/manual_en/660_3d/3D_Hand_Models.htm)
- Squash and stretch: Guilty Gear Xrd's look is widely credited to stretchy (scaled) bones in the animation, which Unity didn't support at the time according to forum commenters — [Polycount comment](https://polycount.com/discussion/comment/2187341) (community, unofficial)
- Why 3 fingers + thumb: animators and design writers explain it as circular construction (five fingers on a round palm look crowded, "like bananas") and labour (hands are slow to animate; Steamboat Willie took over 11,000 drawings). Four digits still read as a hand, while three read as non-human. These are popular sources, not studio records — [Mental Floss](https://www.mentalfloss.com/entertainment/why-cartoon-characters-have-four-fingers); [/Film](https://slashfilm.com/1770751/why-cartoon-characters-have-four-fingers)

### Inferences
- Minimum procedural rig for a 4-digit cartoon hand: wrist (1) + 3 fingers × 3 segments (9) + thumb × 3 (a metacarpal that swings in the palm plane plus 2 segments) = 13 joints. A mitten needs about 5 (wrist, finger-block × 2–3, thumb × 2). One scalar "curl" per finger, applied as rotation c·(1.0, 1.1, 0.9)×90° across its three joints, and one "spread" fanning the 3 metacarpal directions by ±s, follow Rigify's master-scale/automation idea.
- Fingers stay connected when curled because the knuckle ring is skinned half to the palm and half to the proximal finger bone (and the two neighbouring rings ~75/25), so the root bends as a fillet. With primitives (a capsule finger rotating about its base sphere), the capsule rotates rigidly and the gap or crease is visible. Either skin a continuous mesh or, with an SDF, re-evaluate the smooth union after posing, so the blend fillet follows the pose.
- For cartoon squash and stretch, scale whole finger segments along their length (Xrd-style bone scale) instead of moving them apart. Stretching a continuous mesh stays attached; translating primitives does not.

### Gaps
- No Pixar, DreamWorks or Blue Sky document was found describing their production hand rigs (bone counts, curl/cup/spread controls). Pixar's and DreamWorks' SIGGRAPH rig papers weren't located in this pass.
- No public source states finger bone counts for Genshin or other anime gacha game rigs. A community file analysis only says miHoYo reuses a small set of base skeletons — [Google Docs community analysis](https://docs.google.com/document/d/1PURGSxT0DKQJNzdD7y1JrAUTgjj3Czzwl1dOY0xQlyc/export?format=pdf)

## 4. Toon shading and anime 3D: inverted-hull outlines, normals and hiding the finger-root lines

### Takeaway
Arc System Works (Guilty Gear) uses an inverted-hull outline whose width comes from vertex colour alpha (0 = none, 0.5 = standard, 1.0 = double). It sets alpha to 0 in valleys, and explicitly at glove and sleeve rims, to close the floating lines a hull leaves where two surfaces meet. It also gives the outline its own smoothed normal set, separate from the lighting normals, so hard edges don't split the hull. For a hand, lines at finger roots and the wrist are suppressed by those same tools: one continuous hull, zero width in the creases, and smooth or transferred normals for both outline and shading.

### Cited Findings
- Outline width = the backface displacement amount × vertex colour alpha: 0.0 = no line, 0.5 = standard, 1.0 = maximum, twice the 0.5 width. Alpha 0 is recommended for eyelids and eyelashes — [ASW Academy: Guilty Gear Toon Line Control Techniques (ENG), pp. 49–50](https://docswell.com/s/ASW_Academy/5LVY67-GG-Toonline-Eng)
- Per-part tuning: thin lines for hair, feathers and small details, thick for muscles and big volumes — [ASW lecture p.51](https://docswell.com/s/ASW_Academy/5LVY67-GG-Toonline-Eng)
- Floating lines appear in valleys because the expanded backface mesh leaves a gap with the body. Setting vertex colour toward 0 there closes them: cloth wrinkles 0.5 → 0.1, muscle valleys, **gloves and sleeve rims**, and the nose bridge at shallow angles — [ASW lecture pp. 71–76](https://docswell.com/s/ASW_Academy/5LVY67-GG-Toonline-Eng)
- Vertex colour B pushes the hull away from the camera so only the outermost rim shows (used on hair). This is preferred over zeroing the width, because "the outermost contour line will always remain" — [ASW lecture pp. 55, 68](https://docswell.com/s/ASW_Academy/5LVY67-GG-Toonline-Eng)
- With hard edges, adjacent normals point different ways and the expanded hull looks "segregated and disjointed". Spherised custom normals (used for lighting) also push the hull in the wrong direction. Fix: a second normal set used only for the outline, stored in the Tangent attribute so it deforms with the bones (vertex colours don't), which needed an import-pipeline change in UE4 — [ASW lecture pp. 57–62](https://docswell.com/s/ASW_Academy/5LVY67-GG-Toonline-Eng)
- Outline width scales with camera distance and FOV (B = A·tan(FOV/2)), and the outline is a second pass over the same skinned vertices, so bone deformation is computed once — [ASW lecture pp. 31–33, 43–46](https://docswell.com/s/ASW_Academy/5LVY67-GG-Toonline-Eng)
- The Xrd art talk (Motomura, GDC 2015) covered models, textures, shaders and rendering for rebuilding a 2D fighter in 3D with custom cel shaders — [GDC Vault](https://gdcvault.com/play/1022031/GuiltyGearXrd-s-Art-Style-The); [Arc System Works post](https://www.arcsystemworks.com/guilty-gear-xrd-art-talk-at-game-developers-conference-2015/)
- Community Xrd recreations: outline thickness from a vertex-colour channel, green for distance scaling, blue for Z-offset; normals transferred from simplified meshes in Blender, "the most important thing is probably getting the normals right" — [Unity discussions: Guilty Gear Xrd shader test](https://discussions.unity.com/t/guilty-gear-xrd-shader-test/650399); [Polycount comment](https://polycount.com/discussion/comment/2344470)
- Normal transfer for toon shading: copy the normals from a much simpler proxy (e.g. a sphere) onto the detailed mesh with Blender's Data Transfer modifier, so the shading looks simpler than the geometry — [Blender Artists: Customizing Normals tutorial series](https://blenderartists.org/t/customizing-normals-tutorial-series/1369038); [80.lv: clean normals for stylized shading](https://80.lv/articles/get-clean-normals-for-stylized-shading-with-this-free-blender-tool/); [80.lv: custom normals add-on](https://80.lv/articles/achieve-clean-stylized-rendering-with-custom-normals-add-on-for-blender/)
- Hard-edged cel shading means the usual normal-map artefacts don't fully apply (forum view on Genshin models) — [Polycount comment](https://polycount.com/discussion/comment/2761389/)

### Inferences
- The current engine's symptom (a hand reading as separate parts) is what the ASW lecture calls "segregated and disjointed" hulls, made worse because each primitive has its own closed hull. Every finger-to-palm and knuckle-sphere junction then draws an outline across the hand. Fixes, cheapest first:
  1. Draw one outline for the whole arm+hand: build the hull from a merged mesh (or switch hands to a screen-space edge pass on depth or object-ID, with all hand parts sharing one ID so only the silhouette and real gaps get lines).
  2. Set the outline width toward 0 at finger roots, the wrist ring and the knuckle region (ASW's glove-rim rule), keeping the full width on the silhouette.
  3. Give the outline smoothed, averaged normals (one normal per position, the ASW "second normal set") so the hull doesn't split at seams between primitives.
  4. Shade with normals transferred from a smooth proxy (e.g. the SDF gradient of a blended hand, or a rounded box for the palm plus tube for the fingers), so the cel terminator flows across the finger roots instead of restarting on each primitive.
- Knuckle spheres are probably the worst offender: each adds a silhouette bump and an outline ring. A continuous mesh with a slightly fatter knuckle ring (or a vertex-colour width of 0 there) gives the knuckle read without the line.

### Gaps
- The ASW lecture gives no hand-specific guidance beyond the glove and sleeve rim valleys, and I found no Arc System Works source on hand models per pose.
- No source on how Genshin (miHoYo) treats hand normals or outlines specifically.

## 5. Swapping hand models per pose vs one deforming mesh

### Takeaway
Swap systems exist and work when every variant shares identical wrist geometry and pivot (the stop-motion replacement idea), so the swap is invisible at the seam. Deforming meshes with pose presets are more common for posable anime hands. I found no primary source confirming that a specific anime 3D game swaps hand meshes per pose.

### Cited Findings
- A stylized low-poly hand pack ships separate fist, point, open, thumbs-up and grab models that share the same wrist geometry and origin, so swapping doesn't shift or glitch the hand (5 poses, left and right) — [itch.io: Low poly hands (Kickin' It Studios)](https://kickin-it-studios.itch.io/low-poly-hands-great-for-vr)
- Engine practice: replacing a VR template's hand mesh means matching the existing grip animation and physics, and the harder part is rebuilding the skeletal mesh and reusing the grip animation — [Unreal forum: customized hands with no skinning](https://forums.unrealengine.com/t/possible-to-have-customized-hands-with-no-skinning-rigging-replacing-the-robot-hand-in-vr-template/111016)
- Some games build the hand and weapon as one mesh, so swapping the hand means re-rigging to the hand bones — [GameGuru forum: Change the hand?](https://forum.game-guru.com/thread/216515)
- Deforming alternative with presets: anime hand assets in Clip Studio have about 15 preset poses on a slider plus finger and palm bones — [Clip Studio Assets](https://assets.clip-studio.com/en-us/detail?id=2103301)

### Inferences
- For this engine, a hybrid suits the 2-frame contact rules (no part jumping between frames): keep one deforming hand driven by a small pose library (open, relaxed, fist, point, grip-mug, grip-thin...) and blend the pose parameters over ≥ 3 frames. A hard mesh swap is a one-frame change, which `qa/motion.mjs` would flag unless the swap happens on a cut or behind motion blur or occlusion.
- If swap meshes are used (e.g. for a hand-sculpted fist that deformation can't reach), every variant must share the wrist ring verbatim (same vertex count, positions, normals and outline width), so the arm-to-hand join never changes. That is the shared wrist origin from the itch.io pack, plus the shared outline normals from section 4.

### Gaps
- No primary source (GDC/CEDEC talk or interview) confirmed per-pose hand mesh swaps in Guilty Gear, Genshin, Dragon Ball FighterZ or other anime 3D titles. CEDEC (Japanese) talks were not searched and may cover it.
- Stop-motion replacement-hand practice (e.g. Aardman, Laika) wasn't researched in this pass.

## 6. Franchise examples: what each does and why

### Takeaway
The only well-sourced design rationale found is that Rayman's floating hands began as a technical workaround (fan and secondary sources, not interviews) and that four-digit cartoon hands come from circular construction and animation labour. I found no reliable modelling or rigging specifics for Mario, Sonic, Minions, Fall Guys, Animal Crossing, Kirby, Pokémon or Crash.

### Cited Findings
- Rayman's missing limbs: accounts say he originally had limbs, but rendering and processing limits on the target systems made animated limbs impractical; dropping them "saved a ton of animation headaches" and enabled the flying fist. Sources are fan wikis and secondary articles, and the exact technical cause is unconfirmed — [Wikipedia: Rayman (character)](https://en.wikipedia.org/wiki/Rayman_(character)); [RetroOnly: why does Rayman have no limbs](https://retroonly.com/why-does-rayman-have-no-limbs/); [RaymanPC wiki](https://raymanpc.com/wiki/en/Ray)
- Fall Guys: official concept art (Tudor Morris) shows "large hands" in an anatomy diagram. The characters were designed to be "unathletic but ambitious" and badly built for the task, for comedy (Dan Hoang). No source covers the finger construction — [Creative Bloq](https://www.creativebloq.com/news/fall-guys-concept-art); [PlayStation Blog: Creating the character designs of Fall Guys](https://blog.playstation.com/?p=224711)
- Four-finger convention (Mickey and others): circular construction, labour savings, four digits still reading as human — [Mental Floss](https://www.mentalfloss.com/entertainment/why-cartoon-characters-have-four-fingers); [/Film](https://slashfilm.com/1770751/why-cartoon-characters-have-four-fingers)

### Inferences
- From the shapes alone (not sourced): the examples sit on a ladder of hand complexity, from nub or mitten (Kirby, Animal Crossing villagers, Fall Guys-style) through a glove with a separate thumb, to a full 4-digit glove (Mario, Sonic, Mickey). Simpler hands mean fewer junctions, fewer outline seams and fewer contact failures. For PotatoBrawl puppets, a fat 3-finger glove whose fingers stay together except on pose beats (point, grip) would keep the 4-digit read while using the mitten's single-surface look most of the time. Any change to the hands' look is Jonny's call (CLAUDE.md, Characters).
- Rayman shows the opposite solution: if parts must be separate, make the separation the design (big visible gaps) instead of near-contact joints, which read as broken.

### Gaps
- No primary source on hand topology or rigging was found for Mario (Nintendo), Sonic (Sonic Team), Minions (Illumination), Animal Crossing, Kirby, Pokémon or Crash. Specific claims like "villager hands are simple nubs because..." could not be sourced. Model-rip sites (e.g. models.spriters-resource.com) could provide vertex and bone counts, but weren't analysed here.
