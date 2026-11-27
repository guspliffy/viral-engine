# Urashima: edit round 1 (from Codex Sol xhigh, 27 Nov 2026, FIX 49; director's cut of it = version A)

Sol proposed 72.2 s by dropping 9 lines. Version A applies Sol's timing, framing and glitch fixes but KEEPS the hosts'
lines (L05 L06 L10 L14 L15 L23) and the reveal L25 (it answers the hook "Someone's three hundred years"). Dropped/trimmed:
"Why?" from L02, "under the sea" from L07, "Nobody knew his face." from L16, all of L19. Trim words by cutting the take at
word times (vpost/<id>.words.json) and dropping those words from the caption cue too. Gaps: 0.1-0.25 s in a scene,
0.3-0.45 s at a scene change. Target about 85 s.

## Timing / edit list (source times = draft 2)
1. Open: hand insert, fingers already pulling the red cord, the lid lifts to show a dark slit; L01 starts at ~0.3 s;
   staff comes in from grandma's side and shuts the slit at ~0.8 s (show gap -> staff contact -> gap closes). Cut on the
   staff rebound to the pair. L02 = "What's inside?" only, boy close-up. L03: small push that keeps the WHOLE candle +
   flame in frame; flame shrinks on "three hundred", cut out on "years".
2. Rescue L04 in three shots: a stick swings down toward the turtle -> Urashima steps in and blocks it (clear grip) ->
   hands lower the shell into the surf, flipper kick, shell slips under the waterline. Feet and shell ON the sand.
   Kids: give them proper hands/feet, not block torsos on sticks.
3. L05/L06 kept but tight (two quick singles, 0.1 s gaps).
4. Dive (L07 up to "Dragon Palace"): one downward follow with the turtle's nose in frame (same shell markings as the
   rescue turtle, now ride-sized below the surface), then cut to the wide palace exterior on "Dragon Palace".
5. L08: palace exterior -> medium two-shot on "You saved my messenger"; close the gap between its two sentences;
   Urashima's reverse on "Stay as long as you like", his eyes go to the windows.
6. Seasons: one slow push to the four-pane wall on the first sentence of L09; then spring/summer/autumn/winter inserts
   EXACTLY on their spoken words (0.7-0.8 s each; fix: winter showed under "Autumn."). L10 kid close-up (kept).
   L11 grandma starts "Every window is a year"; on "year" cut to a LOCKED wide of all four panes and move the
   highlight spring -> summer -> autumn -> winter at 9 frames per pane, then 6 frames per pane (fixed wall, no
   full-frame flashes, no scale pop, extend the floor so no red strip shows below it); winter holds the last 15 frames
   under "He didn't count."
7. L12 Urashima close. L13: two-shot with BOTH characters; the box rests in Otohime's open palms on "Then take this";
   cut to the handoff on "But never open it", both have visible contact as the weight transfers; end when he holds it.
8. L14/L15 kept, tight. Grandma's L15 gesture: animate her FREE arm (not a third hand); the staff hand stays.
9. Village: L16 = "Back home, the pines were giants." over a near-match of the rescue shore with the same pine now
   towering; L17: start with Urashima tapping his chest, mouthing (silent), the woman turns, says the line, looks to the
   water; cut to Urashima's frozen look on "three hundred", "years ago" over him. Woman's hands/cane grip/legs: clear
   silhouettes, not pegs and sticks; caption must not ride on her hat tip.
10. Grave: music out by the grave cut (score already silent there). Urashima looks down -> insert of moss -> wider kneel:
    he sets the CLOSED box in the sand within reach (the box must exist in this scene), touches the stone; feet stay
    anchored until the knees land; hold ~0.6 s after L18. (L19 dropped.)
11. L20: one slow glide over the scroll (no scale steps; give the paper a period-manuscript texture, brush columns, no
    readable text), cut to the shrine on "A shrine", then through its lattice to a CLOSED lacquer box with the palace
    motif on "still keeps his box".
12. L21: silhouette + small pine on the first sentence; cut closer on "Fly near light speed"; inside ONE registered
    shot one day-night cycle sweeps past (light ramps, no flicker) and the pine grows two stages; figure fixed; on "aged
    without you" match the figure into Urashima with the box at dusk.
13. L22 kept ("Alone on the beach, he hoped the box could take him back."): medium at dusk -> his eyes drop to the knot
    -> fingers. L23 kid "No, no, no..." stays but as ONE kid close-up with his mouth moving only on his words (grandma
    never moves her mouth on his line), then back to the fingers: thumb hesitates, pulls the SAME cord loose, lifts the
    near edge of the lid (lid hinged to the box, never a floating slab), first wisp at the crack on "White smoke".
    Keep the legend dusk light through the whole opening (no grey jump).
14. L24: locked medium, face + hands + box visible; a wisp covers the face, hair/wrinkles change under it on "three
    hundred years", shoulders and knees drop in the same breath, smoke thins progressively (upper puffs drift out, no
    one-frame vanish), old face clear by the end of L24, ~0.5 s to register; one registered composition, no feet snap,
    head not against the edge, box not cut. One palm visibly carries the box. L25 kept over the ancient face (slow push).
15. Return: L26 two-shot, the boy's SHOE visibly pushes the present-day box (give it green seaweed + a chipped corner so
    it differs from the shrine box), box slides and stops, then boy close. L27+L28: ONE steady grandma close-up, her free
    hand touches the bun on "Just a peek" and settles (no third hand, no pop); trim the wait after "Once"; ~0.4 s after
    "peek"; eye contact through "I was nineteen."; hard cut picture + sound at the end of "nineteen".

## Also fix (Sol part B)
- Opening scale pop: no oversized red sleeve shape; true hand insert, then reveal the pair.
- Captions never over grandma's bun/hairpin, Otohime's headdress/eyes, the rider's head, the aged face: keep the
  caption lane clear (shift the artwork down in tight shots). Captions now come from tools/svg2d/lib/captions.mjs
  (fixed size per chunk); keep that.
- No body slivers of the other character at frame edges in singles.
- Present-day hosts keep their own beach colours; legend grey never bleeds into host shots.
- Dive: no size snap mid-follow; size change only at the exterior cut.
