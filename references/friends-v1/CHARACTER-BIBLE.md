# Character bible — Rusty, Pip and Moss

Proposed design v1 · 5 November 2026. Names and series title are working choices. These are a separate proposed cast, not reskins or replacements for the golden PotatoBrawl characters.

## The shared world

Three young-adult-coded cartoon friends share ordinary comforts, minor embarrassments and impractical ideas. They can live in a cozy apartment and visit a café, park or shop. They have recognizable human social behavior while retaining their distinct anatomy. The imp does not require magic to be funny. Each friend can be competent, mistaken, stubborn or kind; none is permanently the victim or the all-knowing solver.

The look is dimensional, matte, warm and clean: selected contours, designed shadow shapes, expressive eyes and restrained painted texture. Read the large silhouette first, the face second and small cloth details last. Preserve the illustrated charm through shaped geometry and stable color regions; microscopic fur and constant surface movement are unnecessary.

## Reference authority and resolved discrepancies

Later explicit user direction takes precedence. Next: hard identity rules in this document; proposed measurements in the JSON; individual sheets for shapes/expressions; lineup for relationships; earlier exploration last. The numerical values are practical starting targets, not measurements extracted from these paintings.

| Ambiguity in illustrations | Canonical implementation rule |
|---|---|
| Open hands in the original exploration/lineup can suggest five digits | **Four digits total per hand: three fingers and one opposable thumb.** Individual open-hand studies are the preferred guide. |
| Rusty's lineup includes small hoodie strings | **No drawstrings.** Use the individual Rusty sheet: hood down, closed zipper, coral pull. |
| Tail stripe count and apparent tail length vary with foreshortening | **Six broad dark-russet bands, lighter tip, one continuous root.** Use a single stable UV/vertex pattern; do not redraw bands per camera angle. |
| Some views labelled FRONT are slightly turned, especially Moss | They establish design, not exact orthographic geometry. Build actual front/profile/back views from one consistent mesh; do not distort the mesh separately to match each painting. |
| Earlier generation prompt requested Pip's elbow patch; finished sheet places it higher | Final choice: **one patch on the anatomical RIGHT upper outer sleeve**, between shoulder and elbow. Preserve its location in all views. |
| Pip's hair/notch can appear reversed in a turned close-up | Hair's dominant swept mass goes toward anatomical RIGHT; one V notch is on the upper outer edge of anatomical LEFT ear. Use the full-body front/back sheet to establish sides. |
| Image lighting changes apparent fabric/fur colors | Palette values are initial sRGB albedo choices. Calibrate under the test light to preserve reference appearance; do not sample every painted shadow as a separate material. |
| The group lineup is not a measurement chart | Enforce standing-height ratios **Rusty 1.00 : Pip 1.12 : Moss 0.92** with all feet on the same floor. Do not scale by each individual sheet's canvas framing. |

All left/right instructions refer to **the character's own anatomy**. In the engine's front-facing +Z pose, anatomical right is -X and anatomical left is +X. In an image viewed from the front, their left appears on the viewer's right.

## Rusty — lead red panda

**Personality.** Rusty wants to seem composed, capable and independent. He actually cares deeply about being liked and having his friends around. His appealing contradiction is confidence outside, feelings leaking through. He is sometimes successfully cool; do not make every confident pose a guaranteed failure. His tail is an occasional emotional tell, not a constant gag machine.

**Read-at-a-glance features.** Round cream-lined ears; russet crown and cheek tufts; large cream cheek masks and cream brow patches; warm amber eyes; small dark nose; short cream muzzle; slate-blue hoodie; dark paws; broad ringed tail. These should identify him even without the hoodie.

**Anatomy.** Separate rounded head, short neck inside the hoodie, pear-shaped torso and short but articulated limbs. Broad cheek fur is part of the head silhouette, not floating decorations. The muzzle projects from the face; eyes sit above and behind its front. Do not attach a flat face to an oval torso. His proportions are approximately 2.5 head heights including ears. The chosen engine starting height is 1.20 units; body/head landmark targets are in the JSON.

**Wardrobe and materials.** Closed zip hoodie, hood resting against upper back, broad cuffs, two simple pocket openings, one coral zipper pull. No logos, dangling strings, pants or shoes. Fur covers the lower body; dark hind paws have readable flat sole contact. Fur is painted color blocks plus sparse modeled silhouette tufts. Keep cream facial markings fixed in head-local coordinates.

**Tail.** Attaches to the sacrum/back of pelvis below the hoodie hem; never to the garment or arbitrary world position. Proposed length 0.80 units, maximum radius 0.15, five to seven control joints. It tapers to a lighter tip and carries six stable dark bands. Blend authored tail attitudes with restrained lag. Provide calm curve, pleased wag, embarrassed wrap, alert lift and alarm expansion as separate performances. Alarm expansion is a small bounded shape change, not exploding fur. Tail contact with floor, couch or paw needs a constraint; merely switching off collision is not acceptable. A tail held under a paw cannot continue freely through that paw.

**Face.** Confident uses one raised brow, slightly unequal lid openings and a small asymmetric smile. Caught opens the lids and parts the mouth; avoid enlarging the eyeballs. Soft uses gentler brow tension and a small sincere smile. For worry, lead with gaze and a lip-corner change. Cream brow patches need a clear silhouette and separation from the eye line.

**Movement.** Moderate cadence, planted steps and a clear weight shift; tail counterbalances turns with a short lag. He can hold a composed torso while the ears give away excitement. He looks at a prop before reaching; shoulders and torso support the reach. Restore his balance after a failed lift rather than sliding the whole character.

**Must not drift into:** fox-shaped long muzzle, raccoon-grey coat, black eye-mask, teddy-bear ears without cream lining, canine paw pads replacing gripping fingers, potato body/sprout, a tail floating from the hoodie, or a baby mascot.

## Pip — impulsive woodland-imp friend

**Personality.** Pip is curious, eager to help and quick to commit. An idea feels excellent to Pip a moment before its practicality is checked. He can surprise the others with real ingenuity. When things go wrong, sincerity makes him likable; he is not malicious or constantly hyperactive.

**Read-at-a-glance features.** Large sideways leaf ears, dark petrol-teal swept hair, warm peach-tan skin, freckles over nose and upper cheeks, expressive hazel eyes, small upper canine accent, ochre jacket and plum trousers. The single ear notch and sleeve repair are identity details, not large focal points.

**Anatomy.** Clearly humanoid separate head, short neck, narrow shoulders, torso, elbows, hips, knees and ankles. Approximately 3.2 head heights including hair. Total height 1.344 units, 1.12 times Rusty. Ears spread wider than the head; keep their root attachment broad and believable. Both eyelids and brows sit on a rounded face with a modest projecting nose, not a flat sticker.

**Asymmetry.** One small V notch on anatomical LEFT ear, upper outer edge. Anatomical RIGHT ear is intact. The main swept hair mass goes toward anatomical RIGHT. One russet rectangular repair patch on anatomical RIGHT upper outer sleeve. Rear views reverse screen sides while retaining the same anatomy.

**Wardrobe.** Open cropped ochre utility jacket with restrained pocket/button details; cream shirt; plum trousers cuffed below the knee/above boots as the sheet shows; dark brown ankle boots. Keep the jacket hem and cuffs controlled. No cape, horns, wings, tail, jewelry or extra belts. Hair is a few shaped locks plus painted accents; it should not be a full hair simulation.

**Face and ear acting.** Curious: gaze finds the object, one brow lifts. Idea: ear roots lift/splay, smile arrives, then the body commits. Oops: ears lower, brows pull inward, mouth tightens; retain the same jaw and eyes. Sincere: small relaxed smile, ears settle. One root pivot per ear with an optional tip bend is sufficient initially. Do not shear the ear into a new shape every expression. The notch follows its mesh.

**Movement.** Slightly quicker cadence than Rusty and a narrower stance, with anticipation before each intentional action. Hands lead explanations, eyes lead decisions. Use controlled quick accents and pauses; do not make every idle a bounce. Boots roll through contact and clear the floor during swing. Long ears stay out of friends' faces during close staging.

**Must not drift into:** a human child with ordinary small ears, an unstructured bean torso, an animal muzzle, five-finger realistic hands, a constantly shouting face, mirrored ear notch, or excessively long spindly legs.

## Moss — calm capybara friend

**Personality.** Moss likes comfort, peace and snacks. He observes before acting and offers practical kindness without making a performance of it. He can also be stubborn, slow to intervene or wrong. A deliberately small reaction can be his funniest contribution.

**Read-at-a-glance features.** Elongated blunt rectangular capybara muzzle, gently sloped/flat forehead, small high rounded ears, broad dark nose, relaxed warm eyes, low mouth, wide barrel body and sage sweatshirt with an oatmeal pocket. His species should remain evident from profile alone.

**Anatomy.** Separate head and torso with a short broad neck. Head volume includes a substantial muzzle, not a round teddy-bear snout attached to a sphere. Short stocky limbs and a wide support stance. Total height 1.104 units, 0.92 times Rusty; torso about 20% wider. No visible tail. No buck teeth or hair-thin whisker geometry. The main mouth corner sits low on the muzzle and must move with it.

**Wardrobe.** Sage-green crewneck sweatshirt with broad rib cuffs and hem. One oatmeal patch pocket on anatomical LEFT chest. No hood, strings, trousers or shoes. Fur-covered hips/legs and dark cocoa paws. Lower hem should remain above the hip crease during walking/sitting rather than cutting through the thighs.

**Face.** Calm is a gentle small smile with relaxed lids, not a closed-eye sleeping face. Really? uses a slight side-eye and one raised brow. Pleased is a warmer smile without a huge toothy grin. Surprise opens lids and slightly parts the mouth while preserving muzzle length. His ordinary eyes are smaller than Rusty's/Pip's; do not force a uniform face template on all three.

**Movement.** Deliberate weight transfer before stepping or lifting. A stable torso, small ear motion and a low center of mass. When still, quiet breathing and an occasional eye shift are enough. Use purposeful pauses instead of constantly moving to satisfy a motion percentage. His full surprise should be earned by the situation.

**Must not drift into:** bear, hamster, dog, pig or beaver anatomy; large incisors; a visible tail; glossy short plastic fur; tiny unreadable facial features; or an expressionless prop who only solves other people's problems.

## Shared performance and contact rules

- Four digits total per hand. Keep a real thumb opposition axis and distinguish palm center, grip center and fingertip pinch; a palm center is not automatically a valid prop socket.
- Eyes lead purposeful attention shifts. Use gaze/lid coordination; do not expose a black slit or disappear one pupil unintentionally. Blinks genuinely close the eyes and remain allowed between important acting beats.
- Expressions own relevant channels explicitly and return to a known state. No stale frightened lids after returning to neutral.
- Primary physical contact outranks idle motion. Feet do not skate during a support phase; hands do not lose props during body sway or a turn; an acquired handhold does not switch sides abruptly.
- Distinguish three-dimensional collision from intentional image overlap. A friend may hide behind another, but a required reaction or grip must remain visible in the shot.
- All new ears, muzzle volumes, tail segments, garments and boots are included in relevant contact/visibility checks. No non-potato character may become invisible to QA because it lacks `potatoParts`.
- Use the same design across front, profile, rear, expressions and motion. Artistically different poses do not authorize different anatomy.

## Minimum visual approval set

For each character: neutral front, both three-quarter views, true profile, back; four expressions matching the sheet; open/closed hand and a simple grip; walking and stopping; a turn/reach; sitting/standing; interaction beside one friend. Include a 270×480 phone-size view of the eventual 9:16 staging, plus full-resolution face/hand crops. Inspect source and engine side by side before treating any 3D rendition as approved.
