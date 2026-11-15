# NOTES: money-happy (Happiness series pilot "Does money make you happy?", the director's working memory)

## Where the build stands
- 14 Nov 22:12 Berlin: Jonny "go" (bank robbery version); 22:20 "go for it" on OUTLINE.md; 22:52 "ok" on board.png
  (Codex sheet, 10 panels). Opener B (cold open). Stake line + text below.
- DESIGN.md: Fable 5.2. Builders T1-T5 done and committed. Generator written 15 Nov; rough draft next.
- Score: assets/music/money-happy/make-score.py -> money-happy-score.ogg (nine library takes, one per scene, on T below).
- Improvement loop: fix on test = preflight in the farm's first job (#230): should keep full renders at 1.

## Timeline (video s, as built in make-money-happy.mjs T; the score is cut on it, 48.0 s)
| s | scene | narrator (voice 1), gibberish | music |
|---|---|---|---|
| 0.0-3.8 | S1 cold open: in the gold car, rain, wiper; bags on the back seat; empty face | 0.15 "He has ten million." 1.65 "He hasn't smiled in thirty days." | sad |
| 3.8-9.05 | S2 city: Spud, pocket linings out; the white limo glides in, laughing couple, three shop bags | 4.0 "Thirty days earlier." Spud 6.9 "Mo-ney... ha-ppy?" 8.1 "So he made a plan." | elegant |
| 9.05-11.0 | S3 vault: balaclava, two sacks hugged, alarm 9.75 | - | orchestra chase |
| 11.0-14.45 | S3b night street: out of the bank with a sack, police cars race past 11.5-13.2, he crouches, laughs | - | chase |
| 14.45-17.55 | S4 mansion by day, fountain, gold car: arms (coat) wide | 14.8 "He bought everything happy people have." | hero |
| 17.55-20.5 | S5 TURN, hall at night: a siren passes, he hides the sacks under the floor tile | 18.3 "But now he had something to lose." | suspense |
| 20.5-24.0 | S6 door: ten locks; knock 22.1; Chip with a gift at the side window; he backs away | Chip 22.7 "Spud? It's me!" | suspense |
| 24.0-25.15 | S6b the clock at 3:00 | - | suspense |
| 25.15-27.95 | S7 LOW: far end of the long table, one candle; 27.95 a siren stops outside | - | sad |
| 28.7-30.45 | S8 gate at night, red/blue beyond the gate: he runs to the car with a sack | - | disaster |
| 30.45-37.0 | S9 car again; 31.25 needle to E; 32.25 wide: rolls to a stop, one cough, lamps die; 33.8 climb with a sack; 34.2 an ambulance passes | 35.6 "Nobody was ever coming for him." | low score |
| 37.0-48.0 | S10 clouds break 37.4; 41.0 close: notes blow from the open sack, 41.9 first smile; 45.0 hold, sun sinks | 42.2 "For one moment, he forgot everything he owned." | drama swell, calm tail |

Stake text 0-3.8, upper third: "$10,000,000" then "HAPPY?" (the outline's emoji "💰 = 😊 ?" can't render: the caption
font is Inter only, no emoji; the number and "HAPPY?" read without English for the 82 % German-speaking viewers).

## Chain (X, so Y)
He is rich and empty in the car (S1), because thirty days earlier he saw that rich potatoes look happy (S2), so he
robbed a bank (S3), so he could buy everything (S4), so he had something to lose: every siren is for him (S5), so he
locks himself in and shuts his friend out (S6), so he is alone (S7); a siren stops at his gate, so he flees with the
money (S8), so the car runs dry on the coast road; he runs on, and the siren was only an ambulance (S9); with nothing
left to run from he sits, and the sunset gives him what the money didn't (S10).

## Decisions
- One world, places far apart as props (the 09b pattern), cameras cut between them; envs only where a painted one fits.

## Names looked up
- Clip pattern: storyboards/series/what-if/09b-teleport-forget/make-teleport-forget.mjs (place/park/say/narrate/CUTS).
- Music library: assets/music/ai/manifest.json (moods: sad, elegant-reveal, orchestra-chase, hero-bed,
  orchestra-suspense, disaster, zombies-score, drama-swell, sos-warm, calm-landscape).
