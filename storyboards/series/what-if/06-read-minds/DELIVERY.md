# FINAL v4 (12 Nov 2026, 20:20 Berlin): the card hold fixed

- Video: `read-minds-FINAL-v4.mp4` (32.2 s). Same as v3 (hero music from 0.0) except Spud's card hold: his glove now
  wraps the bottom of the two cards from the backs' side (Jonny 20:04: "the card hood is glitchy again", the v2/v3
  hold left the cards stuck to the side of the glove). Checked in stills at 0.8, 4.2, 5.6 and 6.6 s.
- Farm run 43287388119: `qa/check.mjs` PASS, 0 fails; -14.0 LUFS, true peak -2.0 dBTP, no pops.

---

# FINAL v3 (12 Nov 2026, 20:05 Berlin): triumphant music from 0.0

- Video: `read-minds-FINAL-v3.mp4` (32.2 s). Same cut, cover and post pack as v2 below; only the music changed.
- Jonny 19:51: "we should have the triumphatic music by second 0": the casino bed is hero-bed-01 looped from the first
  frame until "But there's a catch" (v2 had poker tension into the hero theme on the call).
- Farm run 43284233520: `qa/check.mjs` PASS, 0 fails; -14.0 LUFS, true peak -2.0 dBTP, no pops, no dropout.

---

# There's a catch 06: "What if you could read minds?" FINAL v2 (new opening, 12 Nov 2026 evening)

- Video: `read-minds-FINAL-v2.mp4` (32.2 s, 1080x1920, 30 fps). Cover without text: `read-minds-cover-v2.png` (2.6 s,
  the bubble over Wedge with his bluff). This replaces `read-minds-FINAL.mp4` (v1, hall echo on the voices).
- Branch `theres-a-catch-06-read-minds-opening`, farm run 43277728716 (full render), draft run 43269137580.
- Jonny's words: 18:08 "the voice ... sounding like in a hall. it should be like in v3"; 18:01 "change the opening
  ... like you suggested" ("he or you" instead of Spud); 19:04 on the draft "the story is good i like it" + two glitches.

## What changed against v1

- Voices dry again as in rough draft 3: sound.room "open" (v1 had "hall"; draft 3's "party" was not a room, so open).
- New opening: 0.0 Spud's glowing eyes close, "ALL IN. BY MIDNIGHT." in the upper third (0-1.6 s); 1.6 the bubble
  over Wedge (8 and 3, the bluff); narrator 0.0-4.7 s "You can hear every thought at this table. By midnight, it costs
  you everything." (quick storyteller style); 3.4 the all-in; 5.2 "Trust me."; 6.1 his 3-3 over the shoulder; 7.1 one
  more look at the bubble; 7.8 "Call!". From the call on it is the approved cut (+2.2 s). Music bed rebuilt so the
  hero theme still starts on the call.
- Glitch fixes (Jonny 19:04): 0:06 the glove pinches the cards' edge (was inside the cards); 0:20 Wedge's right glove
  goes round the tower's side (his hand came out through the chip stacks).

## Hook trial (state it when posting)

Opener **B** (cold open on the power), a stake-first "you" line with a deadline. Judge it against the There's a catch
median at 0:03 / 0:05 and the T. rex episode's 46 % / 38 %.

## Check

`qa/check.mjs` PASS, 0 fails (27 notes); -14.0 LUFS, true peak -2.5 dBTP, no pops, no dropout, realistic-sounds ok.
Left as warnings: Spud's feet slide a little in the street walk (as v1); the eye line in the 0.0 close-up sits at 73 %
down (the text needed the top of the frame).

## Listen at

0:03.5-0:04.7 "it costs you everything" (Whisper sometimes heard "cost"); 0:02.8 and 0:28.2 the loudest narrator lines.

## Post pack: as v1 below (title, caption, poll, playlist unchanged).

---

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
- One fix from this video (Jonny's "add it" 12 Nov 16:52, built as PR #217, waits for "merge it"): a preflight warning that lists every non-realistic sound
  in a clip (pop and chime effects, magic zaps, party horns, hop boings, signature jingles, auto stings), so his new
  sound rule is checked by the machine instead of by memory. Should bring his sound notes on drafts to 0.
