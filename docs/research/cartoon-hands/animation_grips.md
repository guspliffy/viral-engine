# Hand animation craft for cartoon and anime: poses, grips and appeal (4-finger glove hands)

Scope note: written for a procedural engine (poses set by code, no artist keyframing) with a glove hand of 3 fingers + thumb.
Sources fetched in full: AnimSchool blog (two hand-posing posts, one overlap post), Wikibooks overlapping action,
Feix et al. GRASP taxonomy PDF (text extracted locally), sunstrikestudios timing guide, John K's hand lesson,
Keith Lango staging notes (via a student's summary). Animation Mentor pages returned HTTP 403, so their claims below come
from search snippets only and are flagged. Book sources (Williams, Blair, Goldberg, Illusion of Life) could not be read
directly; claims about them come from secondary pages and are flagged. Frame counts are rare in the sources; most numbers
in "Inferences" are my translation into parameters, not sourced facts.

## Key hand poses and a pose library for 4-finger cartoon hands

### Takeaway
Sources agree on how a rest pose and a fist are built (curved, grouped, asymmetric fingers; bent wrist; fingertip joint
saved for tension) and give a real-world grasp taxonomy (Feix GRASP, 33 types reducible to 17) to choose holds from.
No source found gives a pose-by-pose library written for 3-finger + thumb glove hands, so the per-finger mapping below is
inference.

### Cited Findings
- Relaxed pose: a default rig hand is "flat and rigid, with no natural form to it"; the neutral relaxed pose has fingers arcing across the palm, made by rotating each finger slightly in Y (spread axis) so they are no longer parallel — [AnimSchool, Hand Posing Basics](https://blog.animschool.edu/2025/05/09/hand-posing-basics/)
- Once fingers have a small Y rotation they overlap naturally when curled in X, e.g. the pinky slightly overlaps the ring finger — [AnimSchool, Hand Posing Basics](https://blog.animschool.edu/2025/05/09/hand-posing-basics/)
- In a relaxed hand most curvature comes from the first and second joints (knuckle and middle joint); the third joint (nearest the fingertip) is reserved for tension poses such as clenching or grasping, and overusing it is a common mistake — [AnimSchool, Hand Posing Basics](https://blog.animschool.edu/2025/05/09/hand-posing-basics/)
- Relaxed does not mean limp: curved fingers, a slight wrist bend and an arc across the knuckles; fingers press gently toward the palm around "a central point of tension" — [AnimSchool, Posing Hands for Animation](https://blog.animschool.edu/2025/06/13/posing-hands-for-animation-2/)
- Group fingers rather than spacing them evenly: e.g. middle, ring and pinky close together with the index floating slightly apart — [AnimSchool, Posing Hands for Animation](https://blog.animschool.edu/2025/06/13/posing-hands-for-animation-2/)
- Fist: avoid robotic symmetry; keep the index slightly raised or angled differently, and avoid even spacing between knuckles — [AnimSchool, Hand Posing Basics](https://blog.animschool.edu/2025/05/09/hand-posing-basics/)
- Stylized/fast motion: exaggerate hand poses (scale fingers, group them), make the grouped fingers one simplified silhouette that supports the move's direction, and reduce distracting negative space between fingers — [AnimSchool, Hand Posing Basics](https://blog.animschool.edu/2025/05/09/hand-posing-basics/)
- Construction: never start a hand from the fingers; build it from two masses, (1) palm and (2) the finger mass, posed in the gesture first, then cut the fingers into part 2 — [John K Stuff, Animation School Lesson 5a: Hands](http://johnkstuff.blogspot.com/2006/06/animation-school-lesson-hands.html)
- Blair-style cartoon hand: palm as a slightly flat disk ("fat burger patty"), fingers as rounded cylinders (snippet only, not fetched) — [The Drawing Website, Cartoon Hand Formulas](http://www.thedrawingwebsite.com/2017/10/18/cartoon-hand-formulas/); Blair's hands are described as having strong "directionality" and the thumb starting at the wrist (snippet only) — [DRAWSMALL!: Preston Blair Hands](http://draw-small.blogspot.com/2010/06/preston-blair-hands.html)
- Why 4 digits: it saved drawing time per cel, and round character designs had no room for five round fingers; Walt Disney's "bunch of bananas" remark is reported secondhand; the "5 fingers looks like 6 when moving" Tezuka anecdote is unsourced — [Mental Floss](https://www.mentalfloss.com/posts/why-cartoon-characters-have-four-fingers); gloves separated Mickey's hands from his black body, first in The Opry House (1929), per a Disney Family Museum account quoted in search results — [IFLScience](https://www.iflscience.com/why-do-cartoon-characters-tend-to-have-only-three-fingers-and-why-do-they-wear-gloves-77151)
- Real-world grasp taxonomy: Feix et al. merge 22 taxonomies into 33 static one-hand grasps, classified by (1) opposition type, (2) virtual-finger assignment, (3) power / intermediate / precision, (4) thumb abducted or adducted; ignoring object size they reduce to 17 prototypes that still cover 83.4% of observed grasp duration and 75.8% of frequency — [Feix et al. 2016, IEEE THMS](https://www.eng.yale.edu/grablab/pubs/Feix_THMS2016.pdf)
- Opposition types: Pad opposition = force parallel to the palm, between finger pads and thumb (needle, small ball); Palm opposition = force perpendicular to the palm, fingers against palm (hammer, screwdriver); Side opposition = force across the palm, thumb pad against the side of the index (a key) or a cigarette between the sides of fingers — [Feix et al. 2016](https://www.eng.yale.edu/grablab/pubs/Feix_THMS2016.pdf)
- Virtual finger (VF): fingers that push in the same direction and move in unison act as one unit; in pad opposition the thumb is VF1 and the opposing finger(s) VF2; in palm opposition the palm is VF1 and all fingers VF2; a finger opposing a task force (e.g. index on top of a knife) is VF3 — [Feix et al. 2016](https://www.eng.yale.edu/grablab/pubs/Feix_THMS2016.pdf)
- Power grip = object rigid relative to the hand, all object motion comes from the arm; precision handling = fingers can move the object without the arm — [Feix et al. 2016 citing Landsmeer](https://www.eng.yale.edu/grablab/pubs/Feix_THMS2016.pdf)
- Real-life frequency (housekeepers and machinists, ~4700 grasps per subject): medium wrap (#3) is the most used, 12.7% of grasps and 23.8% of grasp time; precision disk (#12) 7.1% / 18.8%; lateral (#16, thumb pad on side of index) 8.9% / 5.9%; tripod (#14) 8.4% / 6.1%; #25 (lateral tripod per the paper's text) 10.4% / 5.1%; palmar pinch (#9) 3.9% / 2.3%; tip pinch (#24) only 0.3% / 0.1% — [Feix et al. 2016, Table I](https://www.eng.yale.edu/grablab/pubs/Feix_THMS2016.pdf). Note: the paper's text calls the lateral tripod "#16" in one sentence while Table I gives #25 the 10% frequency the sentence cites; likely a typo in the paper.
- Palmar and tip pinch are over-represented in the literature (10% and 7%) relative to real use (about 4% together); the lateral pinch/tripod family is used far more than it is depicted — [Feix et al. 2016](https://www.eng.yale.edu/grablab/pubs/Feix_THMS2016.pdf)
- For pad (tip) opposition the thumb must be abducted (swung out to face the fingertips); adducted thumb is used for lateral grasps or to "get out of the way" — [Feix et al. 2016](https://www.eng.yale.edu/grablab/pubs/Feix_THMS2016.pdf)
- Most everyday grasps act on objects under 500 g and need a hand opening of 5 cm or less; index finger extension (#17), precision disk (#12) and writing tripod (#20) are the grasps dominated by interaction force rather than object weight — [Feix et al. 2016](https://www.eng.yale.edu/grablab/pubs/Feix_THMS2016.pdf)
- Medium wrap (#3) and prismatic 4-finger (#6) look alike; the wrap has palm contact, the prismatic grasp only fingertip contact — [Feix et al. 2016](https://www.eng.yale.edu/grablab/pubs/Feix_THMS2016.pdf)

### Inferences
- Map 5-finger grasps to the glove hand by virtual fingers, not by anatomy: glove finger 1 = index (often its own VF, the
  one that points, pinches, extends along a handle); glove fingers 2 and 3 = "the rest" (middle+ring+pinky group) and should
  usually move as one group with a small stagger. This matches AnimSchool's grouping (index apart, others clustered).
- Proposed pose library (parameters per finger: knuckle curl / mid curl / tip curl in degrees, spread in degrees; f1 = index,
  f2, f3; all angles are starting values to tune, not sourced numbers):
  - Relaxed: f1 15/20/5, f2 20/25/5, f3 25/30/5; spread f1 −4, f2 0, f3 +4 so f3 overlaps f2 slightly; thumb at about 30°
    from the palm plane, lightly bent; wrist 10–15° extension or ulnar bend. Tip joint near zero (no tension).
  - Fist: f1 slightly less curled or angled (index raised), f2/f3 fully curled with tip joint engaged; knuckle line on an
    arc, not straight; thumb wrapped across f1/f2 middle segments.
  - Point: f1 straight (small hyperextension reads livelier), f2/f3 curled as a fist, thumb tucked over f2 or relaxed.
  - Open / presenting: fingers spread with uneven gaps (f1 apart, f2/f3 nearer), slight backward curve, wrist bent back.
  - Cupped (holding a bowl from below, carrying): palm opposition flattened, all three fingers mildly curled together,
    thumb up the side; two hands carry a box with palm opposition from the sides or below.
  - Pinch (small precision): thumb pad to f1 pad (palmar pinch, #9), f2/f3 curled more than f1 so they clear the object.
    Prefer pad-to-pad over tip-to-tip: tip pinch is rare in real life (0.3%).
  - Thin rod in use (pen, straw, wand): writing tripod (#20) or lateral tripod (#25) mapped to thumb + f1 + f2, f3 curled
    into the palm; the object rests on the side of f2 and in the web of the thumb, so it shows both above and below.
  - Handle / staff / bat: medium wrap (#3, the most-used human grasp), all three fingers wrapped round with the thumb
    closing over f1; palm contact on the far side.
  - Phone: light-tool / palm hold with f2/f3 behind, thumb on the face; or lateral hold.
- Use "power" grasps (object locked to the hand, all motion from arm) for anything the clip moves as a unit; reserve
  "precision" grasps for moments where fingers move the prop (a twirl, a flick).

### Gaps
- No source found with an explicit 3-finger + thumb pose library or which glove finger replaces which; mapping above is inference.
- Feix's per-grasp figure (finger contacts per grasp, object size per grasp) is an image in the PDF and could not be read as text; consult grasp.xief.net or the PDF's Fig. 3/5 for exact per-grasp diagrams.
- Preston Blair's "The Hands" chapter and Goldberg's book were not accessible; nothing direct from them is cited.

## Grip and pinch on thin objects: approach, contact, hold, release

### Takeaway
Sequence the reach so joints arrive in order (upper arm, forearm, wrist, fingers last), make the hand settle on the prop
with a short, crisp contact before the lift, and treat the held prop as rigid in the hand (power grip). Real thin-object
holds (lateral, tripod, writing tripod) put the object against the side of a finger with the thumb pad, not in a tip pinch.
Few sources give frame counts; the ones found are rules of thumb.

### Cited Findings
- Reach-to-grab order (keys on a table): upper arm rises first, forearm pivots out, wrist bends back, fingers curl around the keys last; each motion starts before the previous one finishes. Moving all arm parts to the end pose together is named as the common mistake — [Wikibooks, Overlapping action](https://en.wikibooks.org/wiki/Traditional_Principles_of_Animation/Overlapping_action)
- The curl order when closing a hand: "The smallest finger closes first and opens last" — [AnimSchool, Posing Hands for Animation](https://blog.animschool.edu/2025/06/13/posing-hands-for-animation-2/)
- Pick-up timing: "a crisp 3-5 frame contact", then a two-stage lift: a quick break off the surface, then a slightly slower carry that eases to the target; presented as starting points, not laws; no fps stated for this rule — [Sunstrike Studios, Timing in Animation](https://sunstrikestudios.com/en/blog/timing_in_animation/)
- Settles: each settle stage halves in amplitude and drops a couple of frames; cap at one or two bounces — [Sunstrike Studios](https://sunstrikestudios.com/en/blog/timing_in_animation/)
- Catching a falling object: about 1–5 frames anticipation, 1 frame for the catch, 3–6 frames follow-through (low-authority guest post) — [SIIT guest post](https://siit.co/guestposts/how-to-animate-a-character-catching-a-falling-object-in-3d/)
- A short hold on the object before yanking it gives the move anticipation instead of an instant reaction on contact (search snippet; page not fetched) — [Animation Mentor, Animating Character Environmental Interaction](https://www.animationmentor.com/blog/tutorial-animating-character-environmental-interaction/)
- Prop constraint switching: blend to the hand parent is keyed 0 on the frame before contact and 1 on the next frame, i.e. the prop is attached on the contact frame, never blended over several frames (search snippet) — [Animation Mentor, Character-Prop Interaction Using Parent Constraint](https://www.animationmentor.com/blog/tutorial-animating-character-prop-interaction/)
- A glance at the object first cues that the character is going to take it — [I Want to be an Animator, throw tutorial](https://iwanttobeananimator.wordpress.com/2017/07/31/tutorial-07-how-to-animate-a-throw/)
- Thin-object real holds: side opposition = thumb pad against the radial side of the index (key), or a stick held between the sides of fingers (cigarette) — [Feix et al. 2016](https://www.eng.yale.edu/grablab/pubs/Feix_THMS2016.pdf)
- Tripod = thumb opposes index and middle, tips converging (secondary source) — [EPPA grasp-taxonomy docs](https://eppa-docs.pages.dev/fronts/manos-agarres/docs/grasp-taxonomy/); Feix counts tripod (#14) and writing tripod (#20) as precision grasps, while some authors call them intermediate — [Feix et al. 2016](https://www.eng.yale.edu/grablab/pubs/Feix_THMS2016.pdf)
- In a power grip "there is a rigid relation between the object and the hand", all object movement comes from the arm — [Feix et al. 2016](https://www.eng.yale.edu/grablab/pubs/Feix_THMS2016.pdf)

### Inferences (proposed engine parameters, 30 fps)
- Approach: eyes to the prop first (the repo's eyesLead ~4 frames), then shoulder → elbow → wrist → fingers, each starting
  2–3 frames after the previous one; the hand opens wider than the prop (pre-shape) during the last third of the reach,
  then closes on contact.
- Pre-shape: open the aperture to about prop diameter + 30–50% while traveling; close in 3–5 frames at contact (the
  "crisp contact"), fingers closing f3 → f2 → f1 one frame apart (smallest first), thumb locking last or with f1.
- Hold-before-lift: 2–4 frames of no travel after the fingers close, then a 2-stage lift (fast break of 3–4 frames, slower
  ease-out carry).
- Release: reverse order (f1 and thumb open first, f3 last: "opens last"), the hand moves away only after the fingers clear
  the surface (1–2 frames), never pulling back through the prop.
- Rigid prop: once attached, the prop transform is the hand transform times a fixed offset; any per-frame correction goes
  to the hand/arm, not to the prop. Attach and detach on single frames.
- Thin prop readability: a pad-to-pad pinch at the end of a straw hides the straw in the glove at phone size. Use a lateral
  or tripod hold gripped near the upper third, so the shaft shows above the thumb web and below the fingers.
- Avoid tip pinch as a default; it is rare in life (0.3% of grasps) and reads as fussy.

### Gaps
- No source with authoritative frame counts for grab/release of thin objects at 30 fps (Williams' book not accessible).
- No source found on cartoon-specific ways to keep a held prop from appearing to pass through fingers (beyond rigid
  parenting); no data on how much fingers may squash against a prop in stylized 3D.

## Appeal principles: twinning, spread and overlap, line of action, wrist break, curl stagger, drag, squash, smears

### Takeaway
Break symmetry everywhere (between fingers, knuckles and the two hands), group and overlap fingers, bend the wrist, and let
the chain lag: shoulder, elbow, wrist, fingers break in succession and fingers settle last. Cartoony styles may twin when
there is a reason. No source with hand-specific smear or squash rules was found.

### Cited Findings
- Avoid twinning in hand gestures for more authentic movement (search snippet) — [Animation Mentor, How to Animate Hand Gestures](https://www.animationmentor.com/blog/tutorial-how-to-animate-hand-gestures/)
- The more cartoony the style, the more safely you can twin, but only when you have a reason; offset hands by a frame for realistic work (search snippet; page 403) — [Animation Mentor, Twinning and Why You Should (Usually) Avoid It](https://www.animationmentor.com/blog/twinning-and-why-you-should-usually-avoid-it/)
- Avoid "spatula hands" (flat, lifeless); use secondary motion: fingers dropping at different times, hands moving in arcs, wrists leading gestures (search snippet) — [Animation Mentor, How to Animate Hand Gestures](https://www.animationmentor.com/blog/tutorial-how-to-animate-hand-gestures/)
- Default rig fingers are perfectly aligned and parallel; add small rotations to break that — [AnimSchool, Hand Posing Basics](https://blog.animschool.edu/2025/05/09/hand-posing-basics/)
- "A perfectly straight wrist breaks the illusion of life"; add subtle bends or twists that follow the flow of the fingers; treat the hand as linked curves — [AnimSchool, Posing Hands for Animation](https://blog.animschool.edu/2025/06/13/posing-hands-for-animation-2/)
- Successive breaking of joints: "Joint 1 breaks, then Joint 2, then Joint 3"; for an arm, upper arm then elbow then wrist then fingers; drag = parts trailing behind in an action — [AnimSchool, Follow Through and Overlap](https://blog.animschool.edu/2024/04/19/follow-through-and-overlap-animation-tips/)
- The term is credited to Art Babbitt's lectures at Richard Williams' studio in the 1970s; parts further down the chain lag more — [Animation Apprentice blog](https://animationapprentice.blogspot.com/2019/04/what-is-successive-breaking-of-joints.html); Williams' Survival Kit presents successive breaking of joints as the way to get flexibility (bookseller summary) — [49th Shelf](https://49thshelf.com/Books/T/The-Animator-s-Survival-Kit-Flexibility-and-Weight)
- Riggers note Williams-style breaks are a whip motion best done as rotation (joints flip over, they are not literal bends against the joint) — [Tech-Artists.Org thread](https://www.tech-artists.org/t/successive-breaking-of-joints-in-ik/3716)
- Overlap = staggering parts during an action; follow-through = parts continuing after the main action stops; wrists named as a key place where the lag sells weight — [Wikipedia, Follow through and overlapping action](https://en.wikipedia.org/wiki/Follow_through_and_overlapping_action)
- Fast or stylized moves: group fingers into one simplified silhouette in the direction of motion and scale fingers for exaggeration — [AnimSchool, Hand Posing Basics](https://blog.animschool.edu/2025/05/09/hand-posing-basics/)

### Inferences (proposed parameters)
- Curl stagger: per-finger curl = base × (1 + k·i) with i = 0,1,2 for f1..f3 and k ≈ 0.15–0.25, so the outer finger always
  curls most; time offset 1 frame per finger (f3 leads when closing, trails when opening).
- Spread asymmetry: never equal gaps; e.g. f1–f2 gap 1.5–2× the f2–f3 gap; f3 rotated so it overlaps f2 in a curl.
- Two hands: offset by 1–2 frames and by a few degrees in pose unless the beat calls for a deliberate twin (a cartoony
  "hands up" shock can twin).
- Drag on fingers: when the wrist starts or stops fast, fingers counter-rotate (lag) 5–15° and settle over 3–6 frames with
  one overshoot; tip joints lag most. In a held grip this must not apply (the prop is rigid), only to free fingers.
- Wrist break: on a fast arm swing the wrist trails (bends opposite to motion) then snaps through at the end; on a
  reach the wrist bends back (extension) as the forearm arrives (Wikibooks order).
- Smears and squash/stretch on hands are a 2D convention; in 3D a 1–2 frame finger stretch (scale along the motion) at
  peak velocity is a possible equivalent but is unsourced here.

### Gaps
- No source fetched with numbers for curl stagger or finger drag angles; Williams' finger-overlap pages not accessible.
- No hand-specific source on smears, squash and stretch of hands, or breaking (hyperextending) finger joints for appeal.

## Wrist and forearm: keeping the hand connected, leading with the wrist, arcs

### Takeaway
The wrist leads gestures and bends to continue the flow of the fingers; hands travel in arcs. Sources give order, not
angles.

### Cited Findings
- Wrists lead gestures and hands move in arcs (search snippet) — [Animation Mentor, How to Animate Hand Gestures](https://www.animationmentor.com/blog/tutorial-how-to-animate-hand-gestures/)
- Wrist bends back while the arm is still rotating upward, overlapping it — [Wikibooks, Overlapping action](https://en.wikibooks.org/wiki/Traditional_Principles_of_Animation/Overlapping_action)
- Wrist bends or twists should follow the flow of the fingers — [AnimSchool, Posing Hands for Animation](https://blog.animschool.edu/2025/06/13/posing-hands-for-animation-2/)
- Keith Lango prefers an IK hand control because fixing the arc of a hand path is faster with one control than with five or six FK controls (search snippet) — [Keith Lango, Funky rigging details](http://keithlango.blogspot.com/2009/06/funky-rigging-details.html)

### Inferences
- Procedural rule: drive the hand path as a curve (arc) in world space via IK, then layer wrist rotation that lags the
  forearm by 2–3 frames on starts and overshoots slightly on stops.
- Keep forearm roll and wrist bend continuous: distribute forearm twist along the forearm (not all at the wrist) so the
  glove cuff does not pinch; avoid wrist bends beyond what reads natural (roughly ±60° flex/extension; matches the repo's
  existing "hand turning more than 60° in one frame" warning as a per-frame bound, unsourced as a craft rule).

### Gaps
- No source with recommended wrist angle ranges or forearm twist distribution for stylized rigs.

## Hand acting and readability at phone size

### Takeaway
Show a gesture only when the story needs it, stage it with the hand farther from camera so it does not cover the body,
and simplify fast or distant hands into one readable silhouette. No source found specific to vertical short-video sizes.

### Cited Findings
- Only show a gesture if it matters to the story; don't crowd a close-up with gestures; a weight shift can imply an
  off-screen gesture — [Keith Lango notes via Crowlena](https://crowlena.wordpress.com/2015/12/18/keith-lango-posing-weight-and-staging-hands/)
- Use the hand farther from camera for gestures that would otherwise cover the body — [Keith Lango notes via Crowlena](https://crowlena.wordpress.com/2015/12/18/keith-lango-posing-weight-and-staging-hands/)
- Think of the weight in the hands, how far out the elbow is, the slope of the shoulders; mix introverted (limbs close) and extroverted (wide) poses for contrast — [Keith Lango notes via Crowlena](https://crowlena.wordpress.com/2015/12/18/keith-lango-posing-weight-and-staging-hands/)
- Don't pose by silhouette alone; base poses on natural weight — [Keith Lango notes via Crowlena](https://crowlena.wordpress.com/2015/12/18/keith-lango-posing-weight-and-staging-hands/)
- Reduce negative space between fingers and group them into a simple silhouette in stylized motion — [AnimSchool, Hand Posing Basics](https://blog.animschool.edu/2025/05/09/hand-posing-basics/)
- Gloves helped hands stand out against dark bodies (Mickey) — [IFLScience](https://www.iflscience.com/why-do-cartoon-characters-tend-to-have-only-three-fingers-and-why-do-they-wear-gloves-77151)

### Inferences
- At phone size a glove hand is a few dozen pixels; finger-level acting reads only in close shots. For wide shots, act
  with the whole hand shape (fist vs open vs point) and wrist angle, and keep finger-gap negative space either clearly open
  (a spread "jazz" hand) or closed (mitten), not half-open.
- Silhouette test: the prop and pointing finger should break the hand's outline (not sit inside it) to read in black.

### Gaps
- No source found measuring hand legibility at phone/vertical video scale.

## Anime conventions: simplified hands at distance, detail in close-up, sakuga

### Takeaway
Anime and manga practice simplifies hands as they recede or move fast and adds joint and nail detail only in close-ups;
sources here are tutorials and fan analysis, not studio documents.

### Cited Findings
- From distance, hands become simple shapes; fist joints are hinted, not drawn; nail outlines only in close-up (tutorial-level sources) — [AnimeOutline, How to Draw Anime Hands](https://www.animeoutline.com/how-to-draw-anime-and-manga-hands/); [Envato Tuts+, Anime Hands and Feet](https://design.tutsplus.com/tutorials/how-to-draw-anime-hands-and-feet--cms-31925)
- Highly animated scenes are simplified while static scenes carry more detail (Dan Da Dan analysis) — [Japan Powered, Dan Da Dan's Sakuga](https://www.japanpowered.com/anime-articles/dan-da-dan-sakuga)
- In wide shots of action, characters' faces are only approximate to keep constant motion — [fullfrontal.moe, Sakuga Espresso](https://fullfrontal.moe/sakuga-espresso/)

### Inferences
- Level-of-detail rule for the engine: in close-ups allow per-finger offsets and tip joints; in medium/wide shots and fast
  motion collapse f2/f3 into one group and drive the hand from a few presets.

### Gaps
- No sakugabooru/animator-interview source on hand animation specifically was found in the time available.
