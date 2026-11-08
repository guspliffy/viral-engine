# BOARD: <clip id> (<series, episode>)

Written after the staging proof (docs/rules/workflow.md), never before. One BOARD per clip, next to its generator (`storyboards/<topic>/<clip>/BOARD.md`). A spec, not a story: numbers, not
adjectives. Jonny's brief and panels win; BOARD only makes them exact. Briefs cite sections as BOARD §n. Replace
superseded sections instead of appending.

## §1 Brief

- Joke / Wants / Consequence / Ending / Callback: <the template's four brief lines + callback>
- Source: <Jonny's brief path, panels path>; gate: <series episode: no animatic | new series/format: animatic>
- Length <s> (8-11 s for new clips, reach rules v2); loop: <yes/no>; profile: short

- Sizes for anything a character passes through or stands behind come from the staging proof, not guesses: a potato
  is ~0.8 m wide and the Gunslinger's hat brim is wider (EP03's door had to be 1.25 m); a counter in front of
  standing potatoes hides them to the eyes.

## §2 Look

- Cast + look: <ids>, castLook "sheet"; set: <env id or set>, `life`: <auto/storm/off>, `lighting`: 2
- Light: <key side, time of day>; palette: <3-5 hex from the env or panels>
- Music: <style, gain>; signature sounds expected: <...>

## §3 Shots

### §3.1 <beat name> (<from>-<to> s, kind: hook)

- Purpose: <one line>
- We see: <camera side + size; who is where, facing what>
- Action by time: <0.0 s ..., 0.4 s ..., 1.2 s ...>
- On-screen text: "<exact caption>" <from>-<to> s, subtitle y <px>
- Line: <who: "gibberish" / words> at <s>; sound cue: <whitelisted name in Jonny's words> on <s>
- Must be true at check times (the `see` list): <t s: faces X, Y to camera; prop Z in frame; nobody in front of X>
- Must read (story chain): <the beat in viewer words, e.g. "the friends leave in their coats"> - proven at the staging proof
- Why this camera: <only when it departs from the panel: the reason, and that review A agreed>
- Camera move: <a name from docs/CAMERA-MOVES.md, e.g. Locked-off shot, Dolly in, Dolly zoom, Speed ramp, Freeze frame>
- Transition in / out: <cut / continuous>

### §3.2 ...

## §4 Check times

<one time per shot for the draft stills and qa/panels.mjs, e.g. 0.0, 1.5, 3.2, 5.0, 6.8, 8.4>
