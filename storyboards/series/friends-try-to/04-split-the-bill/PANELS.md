# Split the bill: Jonny's eight panels

Source: `/mnt/project-files/video-scripts/2026-11-04-friends-try-to/storyboards/04-split-the-bill/storyboard-eight-panels.png`
(2x4 grid). One camera side for all eight: straight on from the front across the table, a little above table height.

| Panel | Camera, shot | Who is where, facing | Light, colours | Details | In the clip |
|---|---|---|---|---|---|
| 1 | front, wide | left to right Wizard, Viking (napkin), Phoenix (phone), Reaper (hood), all behind the table; the waiter back right behind Reaper, deadpan | warm bulbs and candle on the faces, cool blue rainy window behind | brick wall, rainy blue window, hanging bulbs, bottle shelf; candle in a bottle bottom left, plant bottom right, red-striped cloth; the bill tray, four hands on it | 0-1.5 s |
| 2 | same | the Wizard holds the bill and raises his staff; the glowing sum spins over the table and bursts | gold spell glow | "328 + 456 + 189 + 276 = 1,249", confetti everywhere, in the glass, Viking's plate stack | 1.5-3.3 s, "Easy." |
| 3 | same | Phoenix holds up his glass of water; Viking pours his pouch | same | coins, buttons, a marble, the fish bone | 3.3-4.5 s, "I only had water!" |
| 4 | same | the Wizard and Viking point and shout, Phoenix shows his phone | same | | 4.5-5.5 s, "THREE mains!" |
| 5 | same | Reaper holds the bill up, one purple scythe arc; four strips on four plates | purple slash | | 5.5-7.2 s |
| 6 | same | the cheer: a high-five across the table | warm | | 7.2-8.0 s |
| 7 | same, a touch lower | Viking's finger up to the waiter; the long new bill runs from the waiter across the table and down onto the floor | | | 8.0-9.0 s, "…dessert?" |
| 8 | same | three glares at Viking, his sheepish grin; the waiter holds out the card machine; the long bill still on the floor | | | 9.0-10.0 s |

Departures, with reasons:
- The room is a painted plate (`assets/plates/cosy-bistro.png`, paint.py seed 52): brick, hanging bulbs in front of a deep
  blue night window, an empty café table behind. Its window sits in the middle and it has no chalkboard; three
  prompt rounds (11 seeds) didn't paint the panels' left window and right chalkboard as a straight-on wall.
- The four stand behind a low table (0.38 m) instead of sitting on chairs, as in Friends Who Copy Everything: seated
  potatoes would sink below the table top in this frame, and the panels show no chairs either.
- The Wizard carries his staff in his right hand and Reaper his scythe in his left (`characters/bistro/`), so both sit
  on the outer side of the table ends and never cross the others.
- Reaper's scythe stays in his hand all clip (Moving One Sofa) instead of leaning on the wall: picking up a loose
  scythe would be a new hold.
- The Wizard's bill skids across the cloth to Reaper when he drops it to point (the visible cause for Reaper having it).
- The waiter stands back centre, a head taller, between Viking and Phoenix instead of back right: in 9:16 Reaper fills
  the right edge and the waiter was hidden behind him. He holds the new bill (a fat roll) and the card machine from
  frame 0, lobs the roll over the table (it lands and rolls across the table and off its front edge onto the floor),
  and holds the card machine up over their heads at the end.
- The candle in a bottle stands on the corner of the next table in the foreground (bottom left) and the plant bottom
  right, so the bottom of the tall frame isn't empty floor; both stay clear of the long bill's lane.
- The music is the engine's swung "bounce" bed in F at 104 bpm: there is no bossa style in puppet/beat.mjs.
- No burned-in title (Jonny types it in-app), so the top of frame stays clear 0-2 s.
