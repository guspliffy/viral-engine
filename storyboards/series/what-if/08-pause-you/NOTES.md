# NOTES: pause-you (There's a catch EP08; the director's working memory)

## Where the build stands
- 13 Nov ~07:00 Berlin Jonny "build the story" on his own script (BRIEF.md) + the Codex sheet (PANEL-PROMPT.md; sheet on his PC).
- Builders (13 Nov ~07:15): T1 senior = pause `world: false` + `look: "frozen"` (pause.js, stage.js); T2 sonnet = props-pauseyou.js
  (magicremote, pauseray with via/bounce, cookiehalf); T3 senior = props-tray.js (silvertray with a real reflection).
  props-pauseyou.js / props-tray.js are pre-registered in props3d.js by the director (empty KINDS until the builders fill them).
- Generator blocks the clip with placeholders (phone = remote, plate = tray, lightbeam = ray). NOPAUSE=1 drops the pause
  windows until T1 lands (checkPauses refuses "frozen" before it).
- Next: rough draft (A and B) to Jonny before any polish (workflow rule 2).

## Staging (why)
- Reaper on the sofa's right half, sofa turned +35; Wizard in the red armchair turned -50; table between, tray on the line
  between their faces, so from over Reaper's shoulder the flat tray shows the Wizard (true mirror, DESIGN 4).
- 9:16 two-shot: they sit ~1.35 m apart, MAIN from z 3.5 (fov 40) keeps both + table; a wider spread doesn't fit.
- Remote in the Wizard's RIGHT glove (the hand on Reaper's side here; DESIGN 1 said left = camera side, but then the aim
  crosses his body: limb-through-costume). Cookie + cushion with his left.
- Reaper stands at 21.6 and steps back-right to REA_UP (behind the table's back edge) to shield; near the Wizard for the press.

## Tried and dropped
- Wizard facing -78 (beside the sofa): his face away from camera; the reflection geometry fails.
- Characters 1.6 m apart: don't fit a 9:16 two-shot.

## Names looked up
- sit `along` (timeline.js 809), sofahalf takes rot; SOFA dims props-sofa.js:20; redarmchair props-raven.js.

## Rough draft (13 Nov): --force reason
The draft renders with `--force` over 22 contact fails: every one is a glove or finger a few cm into the table, plate,
cookie, tray or remote, one cross-body throw (6.9 s) and Reaper's tray hand over his eyes at 35.7-39.4 s. None hides a
beat (workflow rule 2: the rough draft fixes only those); all go in the polish round after Jonny's OK.
Staging changes in this round: the tray is moved by its own prop tweens and the gloves are posed on its handles (the
two-hand grab floated 16 cm); the shield is a true mirror (rot/tip from the bisector of lens and Wizard chest); new
BOUNCE_CAM (front right) for the bounce and the release; the plate sits back left on a 1.2x tray so the reflection
insert (16 s, a camera on the line from the mirrored face through the tray) shows the Wizard and the remote.
Open for polish: the reflection reads only roughly at draft size; Reaper's hand reaches; real sound picks for the tray
set-down and the halves' tap; music is still the synth "sneaky" bed (to be a recorded one).
