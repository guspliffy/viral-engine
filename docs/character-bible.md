# Character bible

Who the characters are, so every clip draws on the same people. **Canon** below was decided by Jonny on
24 Oct 2026. Anything marked *proposal* is not canon until he confirms it. Changes to a character's look or
personality are his call (`CLAUDE.md`).

## Spud, the main character

Jonny, 11 Nov 2026: one simple main potato for every video, so the account is recognised faster, with the ten
fighters as side characters. `characters/potatobrawl/spud.json`, costume type `spud`, reference sheet
`/mnt/project-files/videos/cast/spud/spud-reference-sheet-2026-11-11.png`.

- **Neutral on purpose** (canon): no quirk and no type, so the average person can stand in for him. He wants an
  ordinary day and reacts the way anyone would. His one soft trait: he goes along with his friends.
- **The fighters carry the quirks.** A fighter's idea starts the trouble, Spud says yes, and the rest follows as one
  cause-and-effect chain. Never give Spud a strong personality type of his own.
- **Look**: no hat, no weapon, no prop. A teal knit sweater (rolled collar, hem and cuffs, one patch on the left
  elbow), brown boots, one leaf on the sprout, about 85 % of a fighter's height. The sprout shows his mood (`droop`).
- *Proposal until a pilot video is judged*: the same short sound at 0.0 of every video, and his voice numbers.

## Chip, Wedge and Mash, Spud's everyday friends

Jonny, 12 Nov 2026: everyday potatoes for the "that one friend who…" jokes, where the costumed fighters do not fit.
His picks; all three wear **Spud's skin, eyes and hands** ("a same skin color makes them more easy identifiable"),
so a friend is told apart by body shape and size, ONE garment in one colour of its own, the leaf and one everyday
thing. Files `characters/potatobrawl/{chip,wedge,mash}.json`, costume types `chip`, `wedge`, `mash`
(`engine/page/costumes-everyday.js`), test clips from `storyboards/characters/make-everyday-test.mjs`. The approved
reference sheets (12 Nov) are on Jonny's PC; their measurements are the numbers in those files.

| | Chip | Wedge | Mash |
|---|---|---|---|
| **Friend type** | Too much energy | "Trust me": sure of himself, usually wrong | Never looks up from his phone |
| **Shape** | The smallest, a round ball, 0.65 of Spud | The biggest, broad on top and narrow below, 1.1 of Spud | A tall narrow oval, 1.35 of Spud |
| **Garment** | Sunny yellow hoodie, hood down, two white drawstrings | Red bomber jacket, cream shawl collar, cuffs and hem | Charcoal hoodie, hood down |
| **Leaf** | Two leaves in a V | One big leaf swept to the side | One leaf drooping to the side |
| **Everyday thing** | White trainers with a red stripe | Brown sunglasses on TOP of the head | Light-blue headphones round the neck; a phone when a clip hands him one |
| **Catchphrase** *(proposal)* | "Let's go!" | "Trust me." | "One sec." |

- The default face of all three is neutral and open, as Spud's. A type look (smug lids, eyes on the phone) is an
  expression a clip sets, never the resting face.
- Catchphrases are gibberish with the same subtitle every time; voices are proposals until Jonny has heard them.
- Departures from the sheets, both said to Jonny: Wedge is drawn 1.24 of Spud and built 1.1; Mash is drawn 1.43 and
  built 1.35. Wedge's body stays at or under 0.88 wide, or his hands jump in a turn.
- Later, not picked yet: Russ (never has money) and Lottie (has it together).

## The series: Phoenix and Reaper

Their relationship carries the series. **Phoenix reads Reaper's restraint as disapproval. Reaper finds Phoenix
exhausting but enjoys the company.**

**Both of them win, fail and surprise us.** If Phoenix always fails and Reaper always solves everything, the
relationship turns predictable. Keep the outcomes varied across episodes (see the outcome log below), and don't
reuse a punchline with a new prop: a new episode needs a new predicament, choice or consequence.

| | Phoenix | Reaper | Wizard (occasional third) |
|---|---|---|---|
| **Wants** | To impress people and feel capable | Peace, order and ordinary comforts | To be useful and respected |
| **Flaw** | Commits to elaborate shortcuts before understanding the problem | Takes instructions literally and struggles to show affection | Overcomplicates simple requests |
| **Endearing** | Enthusiastic, generous, keeps trying | Quietly helps when nobody is watching | Patient and sincerely curious |
| **Comic pattern** | Confident demonstration → unexpected consequence → tries to keep its dignity | Minimal reaction → precise action → unexpectedly thoughtful outcome | Technically successful solution → unforeseen consequence |

The Wizard appears now and then, not in every episode. In the "same task, each character" format he is the one who
always messes up (Jonny, 24 Oct), which fits the pattern above: the spell works, the result doesn't.

## How the engine plays them

These are the current settings, not personality canon:

- **Phoenix**: flame wings, flies and hovers (`fly`, `hover`, `drop`), wing flare. Fast, high, wide-ranging voice
  (`characters/potatobrawl/phoenix.json`). Big moves suit it: hops, spins, flares.
- **Reaper**: hooded, carries the scythe in the right hand. Low, slow, narrow voice. Small moves suit him: a look, a
  nod, one precise action. Holding still is part of the joke.
- **Wizard**: hat, staff with a crystal that glows when he charges a spell. Calm, mid voice.

## Tone limits

- Cartoon impacts only: stars, dust, squash and stretch. No splatter, mash or severed parts (`CLAUDE.md`).
- Reaper can look ominous as a misdirect (the surprise episode), but the reveal is always warm.

## The first six episodes (pilot calibration)

Starting premises to storyboard and review, from Jonny. The outcome column is the plan; fill in what the finished
episode actually does.

| Episode | Premise | Wins | Fails | Surprises |
|---|---|---|---|---|
| The jar | Phoenix performs an elaborate opening ritual; Reaper quietly points out the screw direction. | Reaper | Phoenix | |
| The photograph | Phoenix keeps improving the lighting until only its own silhouette is visible. | | Phoenix | |
| The gift | Phoenix assumes Reaper forgot an occasion, then discovers a carefully repaired treasured object. | Reaper | | Reaper |
| The shortcut | Reaper's meticulously efficient route becomes inconvenient; Phoenix improvises the rescue. | Phoenix | Reaper | |
| The last seat | Both pretend they don't want it, escalating into increasingly uncomfortable politeness. | | both | |
| The surprise | Reaper's attempt to organise a cheerful surprise looks ominous until the reveal. | Reaper | | Reaper |

## Proposals (not canon yet)

- Phoenix's dignity move after a failure: a quick "I meant to do that" pose, the cocky face and a small flare.
- Reaper's tell when he is pleased: a tiny nod after Phoenix has looked away.
- Recurring setting: the kitchen, so the look stays the same across the pilot.

## Other fighters

The "same task, each character" clips use all ten fighters. Signatures Jonny confirmed on 24 Oct: the Wizard always
messes up, the Samurai slices everything, the Viking destroys everything, the Gunslinger shoots everything. Other
signatures are proposals until he confirms them.
