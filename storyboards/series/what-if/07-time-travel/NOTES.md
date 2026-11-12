# NOTES: time-travel (the director's working memory)

## Where the build stands

- v3 10x (Jonny "create it" 12 Nov 19:20 Berlin on the 15-panel sheet): generator 36.8 s, 17 cuts.
- Builders: T1 props-stadium.js (stadium, stadiumcrowd, floodlight, bigscreen, crowdbarrier, startblock, finishtape,
  cardsign), T2 props-timewatch.js (pocketwatch, watchwreck, rainbox, seasonswirl, goldmedal), T3 props-rescue.js
  (tvcrane, ambulance, stretcher, medic, starter). Bench sheets in bench/.
- Staging proof: layout gate 0 fails, preflight 0 fails (24 visible-glitch warnings for the polish round).
- Score: assets/music/time-travel/ (one ffmpeg-joined orchestra score, README there).
- Screen photos screen-hug.png / screen-drag.png are crops of this clip's own draft stills at 15.3 and 12.5 s.
- Choice card (trial 2) is on; `CARD=0` drops it (Jonny has not picked).
- Next: rough draft on the farm (narrator VoxCPM only there), then Jonny's notes.

## Gotchas

- seasonswirl has no "on" param: park it at y DOWN until the seasons beat.
- medic param "lug" (not "carry", which collides with propState).
- No grab on the crane cable: the crane follows a grabbing glove; the glove goes to grip PULL instead.
- Bigscreen sits between roof posts (x 6.25, scale 0.72): a post at x 0 crossed the screen.
- Chip on the stretcher: pitch -85, yaw 90, y 0.72, rides with a move; pitch back to 0 at the drag.
- No crowd, cheer, boo or rain sound in the library: the crowd is visual only; ambience is the set's default bed.
