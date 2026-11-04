# Then I'm a Zombie Too: Jonny's eight panels, point by point

Source: `storyboard-eight-panels.png` in /mnt/project-files/story-26-then-im-a-zombie-too.zip (ENGINE-PROMPT.md, 1 Nov
2026). Written before the layout (CLAUDE.md "Writing clips"). Check:
`node qa/panels.mjs out/zombie-too-draft.mp4 --panels <board> --grid 2x4 --at 1.0,2.4,3.2,4.5,5.9,6.9,8.0,9.3`.

Whole board: a ruined city street at dusk in steady rain. Cold blue-grey shadows and haze, an orange-pink sunset glow low
behind broken concrete buildings and bare girders, wet dark ground that mirrors the glow, rubble and puddles, rain
streaks everywhere and beads on the characters. Clean anime finish. Black letterbox bars above and below every shot,
left empty for the edit's text. Reaper golden until the nibble; Phoenix dull grey-green with droopy eyes, burnt ragged
orange/grey wings, a small crest; one limp fry, one scythe.

Geography (x right, z toward the side camera): Reaper stands at the left, Phoenix comes from the fog at the right; the
street runs away from the side camera into the sunset (the back plate), which is where both walk at the end.

| # | time | camera side and size | who is where, facing | light and details |
|---|------|----------------------|----------------------|-------------------|
| 1 | 0-2 | from Phoenix's side, medium close (head and hands), slight low angle, slow push | Reaper centre, facing the lens and just past it; scythe raised high in both gloves, blade at upper right | rain, huge tears down both cheeks, trembling open mouth; ruins behind him, glow at the right |
| 2 | 2-2.8 | reverse, from Reaper's side, medium full body | Phoenix centre, shuffling toward us out of fog, one arm out, the fry limp in his other glove (screen left) | droopy half-lid eyes, blank small smile, wings dragging low and ragged; glow behind him |
| 3 | 2.8-3.5 | back to Reaper, medium | the scythe lifted over his head into the swing (shaft across the top of the frame, blade upper right) | gritted teeth, tears, rain on the blade |
| 4 | 3.5-5.5 | side two-shot, medium | Reaper left (3/4 to us, facing right), the blade stopped in the air just above Phoenix's head; Phoenix right, facing left, holding the fry out to Reaper | drops split around the stopped blade; a clear gap between blade and head |
| 5 | 5.5-6.2 | side, medium-wide | Reaper left, arms open wide, crying; Phoenix right with the fry; scythe on the wet ground lower left, blade away from them | puddle reflections |
| 6 | 6.2-7.5 | side, medium close | full hug, Reaper left, gloves round the OUTSIDE of Phoenix's back; Phoenix right, eyes closed, the fry hand up and outside the hug | wings folded aside; scythe on the ground lower left |
| 7 | 7.5-8.5 | close side, low | Reaper front-left, face to us, now fading grey-green, wide eyes, open mouth; Phoenix behind-right, higher, lips on the top of the hood, eyes closed | the fry in Phoenix's glove at the right, far from his mouth |
| 8 | 8.5-10 | wide three-quarter rear | both walk away into the fog toward the sunset, shoulders touching, Reaper left, Phoenix right, both grey-green, faces turned a little to each other sharing the fry; Reaper's free hand drags the scythe, blade on the ground behind-left | ruins both sides, glow on the horizon, wet street |

## Where the clip departs from the panels, and why

- The brief's timing differs from the board in one place: the brief's first prompt doc has the hug from 5.5 s with the
  scythe clattering; the ENGINE-PROMPT (newer) splits 5.5-6.2 "he can't" (arms open) and 6.2-7.5 hug. The clip follows
  ENGINE-PROMPT.md.
- Panel 8 starts at 8.5 s with the scythe already in hand. The brief asks that Reaper visibly picks it up first, so the
  wide opens on him taking the shaft from the ground (about 0.4 s) before they walk.
- The vertical frame inside the letterbox is close to square, not the board's landscape cells, so two-shots are staged
  a little in depth (Phoenix a step further from the camera) to keep both faces large.
- Reaper holds the scythe in his LEFT glove (characters/zombie/reaper-scythe-left.json) so that, facing Phoenix on his
  left, the blade sits at the upper right of panels 1, 3 and 4 and stops over Phoenix's head without the shaft crossing
  either face.
- Shot 8 is cheated on the cut: the dropped scythe lies just in front of Reaper's left foot (in shots 5-7 it lies a
  step further back) so he can reach the shaft while facing the fog.
- Panel 7: Phoenix is lifted a little and stands behind-right; his face stays partly behind the hood, as on the board.
- Look: castLook "sheet" (the sheet costumes on main). Phoenix's crest keeps its flame orange like the board; only the
  wings and tail are burnt to ash.
- Sound: no rain sound exists in the whitelist; the leads' signature sounds are off (a flame whoosh on a zombie and a
  bell on the sad opening would fight the piano), and the "poof" sprays are silent.
