# There's a catch 06: "What if you could read minds?" (delivery, 12 Nov 2026)

- Video: `read-minds-FINAL.mp4` (30.0 s, 1080x1920, 30 fps). Cover without text: `read-minds-cover.png` (1.0 s, the
  all-in with the crowd).
- Opener type: **A, contest running at frame 0** (Wedge is already shoving his chips and gold watch into the pot).
- Branch `theres-a-catch-06-read-minds`, generator `storyboards/series/what-if/06-read-minds/make-read-minds.mjs`,
  panels: the 15-panel Hold'em sheet v5 (`board.png`, PANELS.md).
- Jonny's OK: rough draft 3, 12 Nov 16:24 Berlin ("this one is good").

## Check result

Full render on the farm (run 43249776902), `qa/check.mjs`: **PASS, 0 fails** (29 creative notes). Loudness -14.0 LUFS,
true peak -2.1 dBTP, no dropout, no odd single frames. `qa/golden.mjs`: all 12 stills and 5 motion strips unchanged
against main. Farm renders: 1.
Warnings left (seen in the frames, none Jonny flagged on draft 3): two fast glove turns while Spud pushes through
the bubbles (5.2 s, 15.9 s); costume 3 cm into the table rail while seated; Spud's eyes behind the chip tower for
0.2 s at 10.7 s; Spud's feet slide a little in the street walk.

## Listen with headphones at (qa/risky.mjs)

```
0:02.5  gulp only -9.4 dB over what plays under it: can you hear it?
0:12.8  payoff "the flood": does the hit land, is it the loudest thing so far?
0:14.8  keys slam only -1.9 dB over what plays under it
0:16.2  the chip tower pushed in only -1.9 dB over the music
0:17.2  the cards turned only -1.7 dB over the music
```

## What changed since rough draft 3

- The false `cartoon-only` fail is fixed in `qa/check.mjs` (the cast id "mash" matched the gore word list; effects are
  now tested without the `who`). Proof: draft 3's check FAIL -> ok with only that change.
- The casino got a hall echo instead of open air. Nothing else changed.

## Reviews

- Review B not run: Jonny judged the drafts himself and OK'd draft 3; the cut did not change after it.

## Departures from the panels

- 03: past Spud's cards we see Wedge's heap and glove, not his face (he sits beside Spud in the arc; a 9:16 frame
  cannot hold players on opposite sides).
- 12: the showdown is seen steeply from the front of the table, under the lamp (straight down, the lamp blinds the
  shot). A 0.8 s close on Spud slumping follows.
- 14: no tiny Spud in the street from 40 m up (one pixel).
- Sound: realistic sounds only (Jonny 12 Nov): bubbles appear silently, the power is a heartbeat.

## Post pack

- TITLE: What if you could read minds?
- CAPTION: What if you could read minds at the poker table? 🧠🃏
  Which one are you, the bluffer or the one who always calls?
  #funnyanimation #animation #poker
- POLL: Which one are you? / The bluffer 😏 / I always call 🃏
- PLAYLIST: There's a catch · SLOT: 07-09 or 22-24 Berlin · label it as AI content.

## Improvement loop

- Ledger row 11 (docs/LEDGER.md on the branch). Fix on test: the draft pops line: **kept** (draft 2 printed the
  one-frame pop at 23.47 s, fixed before the full render; renders stayed at 1).
- One fix from this video (waits for Jonny's word, not built): a preflight note that lists every non-realistic sound
  in a clip (pop and chime effects, magic zaps, party horns, hop boings, signature jingles, auto stings), so his new
  sound rule is checked by the machine instead of by memory. Should bring his sound notes on drafts to 0.
