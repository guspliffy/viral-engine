TASK T1: `cabinhall`, the whole inside of a single-aisle airliner cabin, one prop
WHY: seven shots play in this cabin (panels 01-04, 06-08): a close-up at a window, a row medium, a look up the aisle to the EXIT sign seven rows ahead, a side view of the brace position, the impact, and a crawl under smoke. It must look like Jonny's panels: dark blue seats with white headrest covers, pale grey walls and bins, oval windows, warm ceiling light panels, a dark blue carpet, a green lit EXIT sign over the door at the front.
DESIGN: briefs/COMMON.md (read first); panels 02, 03, 04, 07, 08.
READ: engine/page/props-plane.js (reuse its planeseat, overhead and cabinwall drawing; import PLANE_KINDS and call its builders or copy the shapes), props3d.js propState only; nothing else unless blocked
OWN: engine/page/props-wakeup-cabin.js (export WAKECABIN_KINDS), bench/make-cabin-bench.mjs; touch nothing else
CONTRACT (hall frame = the prop's frame, origin on the floor in the middle of the aisle at Spud's row):
- Aisle |x| <= 0.5. Seats 0.96 wide, facing +z: centres x = +2.09 (A, port window), +1.03 (B), -1.03 (C), -2.09 (D).
- Rows k = -3..7 at z = 1.35 * k (11 rows). `spec.omit`: seats not drawn, default [[0,"A"],[0,"B"],[1,"B"]] (the director puts real `planeseat` props there). Share geometry between seats (clone one built seat).
- Side walls: inner face at x = +-2.65 up to y 1.9, then curving in to the bins. Bins over the seats: underside y 2.35 from |x| 0.62 to 2.6, front faces up to y 2.75; a flat ceiling strip y 2.75 over the aisle with one warm light panel per row.
- One oval window per row per side: 0.44 wide x 0.6 tall, centre y 1.3, at z = 1.35 * k + 0.4. Each shows an outside VIEW behind it (drawn in a shader or on a card just outside the wall, never a real hole to the world): view 0 = cold grey-white high cloud drifting slowly; view 1 = snowy pine treetops rushing past toward -z at about 60 m/s (streaked, close, filling the pane; panel 04); view 2 = a still snowy pine forest (panel 09's forest), smoke drifting. Views blend between whole numbers.
- Floor y 0, dark navy carpet, a pale strip along both aisle edges.
- Front bulkhead at z = 10.5 with a doorway x -0.5..0.5, y 0..2.0, and the EXIT sign: a box 0.72 x 0.3 m centred (0, 2.2, 10.44) facing -z, green #1faa55 with white letters EXIT (the only words anywhere), emissive. The sign's material: transparent true, depthWrite false, renderOrder 20 (so task T2's smoke, renderOrder 10, never hides it), opacity = its brightness key. The door: closed (a grey panel with a small round window) to open (the panel gone, flat bright cold daylight white-blue behind it).
- Back bulkhead at z = -4.95, plain.
- Every wall, bin and ceiling face is one-sided, facing inward, so a camera outside a wall sees into the cabin. No outside skin.
- Keys (pick existing propState keys and name them in the header): view 0..2; lights 0..1 (ceiling panels, default 1; at 0 the cabin is dim grey with only window light); masks 0..1 (a yellow mask on a white hose drops from the bin underside over every drawn seat, not over omitted ones; swinging a little, a function of time); bins 0..1 (every bin lid swings up, dark inside); door 0..1; sign 0..1 (default 1).
- The whole hall is flagged see-through for the contact checks (COMMON.md) and casts no shadows; it does receive none either if that is cheaper.
MACHINE: stills of your bench only (COMMON.md)
BENCH CAMERAS (pos / look / fov; keys): 1 [1.2,0.95,1.9] / [2.2,0.85,0.1] / 30 (defaults); 2 [0.9,1.25,3.4] / [1.56,0.95,0] / 34 (masks 1); 3 [1.5,1.35,-1.6] / [0,1.3,10.4] / 40 (masks 1); 4 [-0.4,0.95,0.5] / [2.09,0.8,0.3] / 36 (view 1); 5 [-0.6,1.2,-0.8] / [1.4,1.3,1.2] / 50 (view 1, bins 1); 6 [0,0.35,6.0] / [0,0.6,-4] / 45 (lights 0.2, view 2); 7 [0.2,0.5,3.0] / [0,1.0,10.4] / 40 (lights 0.2, view 2, door 1). Put three `planeseat` props (w 0.96, arms "both", the hall's seat colour, cover 0.34) at the omitted seats in the bench.
DONE WHEN:
- the seven stills read as the same cabin as panels 02-04/07-08 at phone size: seat rows in perspective, windows with the right view, the EXIT sign readable at 360 px wide from camera 3 (9.5 m away) and camera 7
- from camera 3 exactly seven seat rows stand between Spud's row and the doorway
- no z-fighting, no world showing through a wall, floor or ceiling from cameras 1-7; camera 4 (outside the row, in the aisle) sees no wall in its way
- usage header on the file; contact sheet at out/<bench id>-sheet.png looked at
OUT OF SCOPE: smoke, fire, the engine outside (T2), bags, cast, any exterior, tilt
