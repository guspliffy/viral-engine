# NOTES: Survive it "How to survive a zombie apocalypse" (version B)

Read this first after a compaction. Jonny's go: 11 Nov 2026 22:59 Berlin ("i like zombie b- the extreme version.
create the video"). His rules for the series since the lift draft: realistic, less comedy, no absurdity, the real
struggle on screen, cast in usual colours, the video must match the panels shot for shot.

## Where the build stands

- [x] Outline (version B) and 12-panel prompt: /mnt/project-files/video-scripts/2026-11-08-survive-it/
      11-zombie-apocalypse-CHAIN-OUTLINE.md, 11-zombie-apocalypse-B-10X-IMAGE-PROMPT.txt
- [ ] Sheet B image in the repo as panels-sheet.png (it is on Jonny's PC; asked him to drop it in the thread)
- [x] Prop stubs wired (props-zflat/-zstreet/-zshop.js, KIT_STATE in props3d.js), briefs T1-T3, builders dispatched
- [x] Generator v1: all 13 shots, 28.2 s (make-zombies.mjs). NOT yet seen in a still: every camera is a first guess.
- [ ] Builders done, diffs reviewed, `node tools/vocab.mjs`
- [ ] Stills per panel, cameras fitted against the sheet (qa/camfit.mjs in one batch), PANELS.md with grades
- [ ] Review A on stills (one round), rough draft (--draft --force if only polish fails), send to Jonny, STOP

Step order departure (rule 1): the builders started before a staging proof on boxes. Reason: main has no stand-in
box prop, and the world is fixed by the story (flat, street, ladder, shop roof), not by camera choices. Sizes are
spec keys, so a wrong size is a number in the generator.

## The world (one place, plus rooms far off)

- Set plain, floor "none", overcast grey. `zstreet` at the origin: street along z; our house facade x -4.9, balcony
  floor y 0 at x -4.9..-3.0, z +-1.6, railing top y 1.0; shop building facade x 3.0, roof y 0 from x 3.0 to 11,
  parapet 0.5 high with a 1.0 block at z +-0.5; street floor y -15. The car with the alarm sits at CAR [-0.6, 0.2],
  right under the spot where the tin slips.
- Ladder: origin (-3.25, 1.03, 0), 6.7 long along +x. `ladY(x, sag, crack)` in the generator follows BRIEF-T2's
  formula (check it against the builder's header).
- The flat's room at x 40 (4.4 x 4.4, front door in the back wall at z -2.2), the bathroom at x 70, the shop at x 100.
- Crawling and hanging use `fly` + `pitch` (the `air` helper); every ground scene starts with `scene()` (land, pitch 0).

## Decisions

- Opener A: the door fight runs at frame 0. Narrator: the title at 0.0, then only the days.
- The same car's alarm saves them on day 1 and betrays them on day 6 (callback).
- ADDED beyond the panels: P11b (22.9-25.3), the flat door bursts and all five cross the cracked ladder, because the
  sheet does not show how the other three reach the roof. Jonny is told with the draft.
- Sheet notes from the drawing session: the alarm car is a police car in panels 02 and 10; in panel 01 Spud pushes a
  sofa rather than a wardrobe; in panel 09 Spud is BEHIND the Gunslinger (the generator follows the picture).
- Stand-ins in the rough draft: car alarm = "horn" pulses, held props float near the hands (no grips yet), the
  bucket is `sandbucket`, the privacy screen is the shower `curtain`, music style "sneaky" at 0.45.

## Names looked up

- arm pose back to neutral: "rest". Reset after flying: `land` then `pitch` 0. Narrator: macro "narrate", voice
  "narrator". Set without ground: `{ type: "plain", floor: "none" }`.
- Existing props used: wardrobe (props-ikea, doors face +z), couch, pillarcandle (`lit`), campmug, sandbucket,
  curtain (shower curtain on a rail, hangs 1.6 down), spoon (props-chef).
