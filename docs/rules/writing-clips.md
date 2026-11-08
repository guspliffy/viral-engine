# Writing clips

Moved out of CLAUDE.md on 8 Nov 2026 (motion studio workflow); the text is unchanged. Read it when the task in CLAUDE.md's table says so.

When Jonny wrote a brief (his story library's ENGINE-PROMPT.md), follow its shots, placements, props and "no ..."
rules literally; a theft reads only if the thing starts where the brief puts it (Charger). Departures go in the
delivery with a reason.

**When Jonny sends storyboard panels or images, they are the target, not just the beats** (Not Yet, 1 Nov 2026: the
panels were read only for their beats, and the ending looked the wrong way; "I create these images with purpose, not
to be ignored"). Even when a brief calls them "a staging reference":
1. Before the layout, write `PANELS.md` next to the generator. It has one row per panel: the camera side and shot size,
   who is where and what they face, the light and colours, and the details (wreckage, props, glow). Build the set so
   that every panel's camera works.
2. Copy the look as well as the staging: the room's colours and time of day, the lighting, and the amount of detail and
   wreckage.
3. Before any full render, check the draft against the panels:
   `node qa/panels.mjs out/<id>-draft.mp4 --panels <board.png> --grid 2x4 --at <one time per panel>`. Look at it, and
   give it to creative review A, telling the review that the panels are the target.
4. A departure, such as a vertical frame that can't hold a landscape composition, goes in PANELS.md and in the
   delivery, with its reason.
5. Match the detail and the energy, not only the layout. v2 of Not Yet was still "a simple room" next to the panels.
   Copy:
   - a lived-in room: patterned walls, panels, pictures, a clock, clutter
   - dust hanging in the air, and dust and debris bursts on every hit
   - heavy spark bursts and light shafts
   - torn materials shown as ragged holes with foam, never white blobs
6. The last frame must read on its own. Held props stay in hand, at chest height, in a colour that contrasts with the
   costume. A released prop goes back to its spec place unless `release` has `to:`. The eyeline target, or its glow, is
   in frame.

Start every new clip from **`storyboards/templates/clip-template.mjs`** (copy it, fill the four brief lines, keep
the order of work). It uses the shared builder `storyboards/lib/clip.mjs` and the acting loops in
`storyboards/lib/acting.mjs`; don't copy helpers or performances out of older generators. When the same group of
actions shows up in a second clip, move it into `acting.mjs` (the first clip must still produce the same storyboard).
Hands on props come from the **grip library** `storyboards/lib/grips.mjs` (mug, bowl, box, thin, phone): pick the hold,
don't build a new one. A prop it doesn't cover gets a new hold there, tested on its close-up bench
(`storyboards/lookdev/make-grip-tests.mjs`) and approved by Jonny from the video before a clip uses it.
The output is a **beat storyboard** (relative timing + macros): see `docs/STORYBOARD.md`. Old flat storyboards still work.
The template's camera is **directed from the story** (`"direct"`, `engine/direct.mjs`): mark each beat's `kind`
(hook, payoff, reaction, reveal) and leave its camera out; set a shot by hand only where the story needs one the
grammar doesn't give, and check the result with `qa/framing.mjs` and the draft stills.
The template also carries **Jonny's lab picks** (30 Oct): a lead's gibberish line in the first half second
(`act.opener`), depth of field with focus on who acts (`set.focus: "acting"`), stronger faces held longer
(`clip({ faces: "strong" })`) and, on a hit, `act.impact` (impact frame, shake, stars and a 3-frame hit-stop). Each is
opt-in per storyboard and has a flag at the top of the template; see `docs/STORYBOARD.md`. The template turns on **kinetic captions** (`"captionStyle": "kinetic"`: words pop in as they're said, lit in the
speaker's colour) and its builder has `textPop` for a comic word beside a head; both are 2D only (`engine/page/text.js`).
