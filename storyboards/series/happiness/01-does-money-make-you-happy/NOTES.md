# NOTES: money-happy (Happiness series pilot "Does money make you happy?", the director's working memory)

## Where the build stands
- 14 Nov 22:12 Berlin: Jonny "go" (bank robbery version); 22:20 "go for it" on OUTLINE.md; 22:52 "ok" on board.png
  (Codex sheet, 10 panels). Opener B (cold open). Stake line + text below.
- DESIGN.md: Fable 5.2. Builders T1-T5 done and committed. Generator written 15 Nov; rough draft next.
- Score: assets/music/money-happy/make-score.py -> money-happy-score.ogg (nine library takes, one per scene, on T below).
- Improvement loop: fix on test = preflight in the farm's first job (#230): should keep full renders at 1.

## Draft 2 (15 Nov, Jonny's notes on draft 1 at 07:40 Berlin)
Narrator on every scene (draft 1 lost it: items after c.beats() were dropped); poor dirty Spud can't pay for a coffee,
then the rich (new couple Duchess + Dauphin standing by their limo with shop bags); a real hold-up at a bank counter
(revolver, cashier Tot pushes two sacks over); he pushes the sacks into the floor hole by hand and shuts the tile; the
ending: the wind empties the sack, all the money flies into the sun (notestorm), then the smile. DESIGN.md section 11.

## Timeline (draft 2, video s, as built in make-money-happy.mjs T; the score is cut on it, 61.0 s)
| s | scene | narrator (voice 1) / speech | music |
|---|---|---|---|
| 0.0-4.3 | S1 cold open: rich, sad, in the gold car in the rain | 0.15 "This potato has ten million dollars." 2.2 "And he hasn't smiled in thirty days." | sad |
| 4.3-7.7 | S2a coffee cart: reach, the seller's palm, pockets out, empty palms, head shake | 4.35 "Thirty days earlier, he couldn't even pay for a coffee." | sad |
| 7.7-13.4 | S2b the rich couple laugh by their limo; he stares; "Mo-ney... ha-ppy?" 10.9; idea | 8.4 "Then he saw how the rich live." 12.25 "So he made a plan." | elegant |
| 13.4-17.6 | S3a bank: balaclava, revolver, "Gi-ve mo-ney!" 13.6, hands up, two sacks pushed over (over-gun cut 14.8) | 16.45 "He robbed a bank." | chase |
| 17.6-21.0 | S3b night street: police race past, he hides and laughs | 18.5 "And he got away with it." | chase, hero 20.15 |
| 21.0-24.0 | S4 mansion by day: arms wide | 21.1 "He bought everything happy people have." | hero |
| 24.0-29.0 | S5 hall: siren; he pushes both sacks into the floor hole, shuts the tile | 24.9 "But now, he had something to lose." | suspense |
| 29.0-33.5 | S6 ten locks; Chip at the window "Spud? It's me!" 31.05; he backs away | 29.1 "He locked every door." 32.1 "Even his best friend had to stay outside." | suspense |
| 33.5-37.0 | S6b 3:00, S7 alone at the long table | 34.6 "He had everything... and no one." | sad |
| 37.0-40.6 | siren stops at the gate; he flees with a sack | 37.2 "Then one night, a siren stopped at his gate." | disaster |
| 40.6-49.4 | S9 car, fuel needle, stop, climb, ambulance passes 44.4 | 41.0 "He ran, until the tank ran dry." 45.9 "It was only an ambulance." 47.6 "Nobody was ever coming for him." | zombies-score |
| 49.4-61.0 | S10 sunset, clouds break 49.8, storm t0 51.0 (pour 51.8-54.0, last note 55.4), close 54.5, smile 55.8, hold 57.4 | 51.9 "The wind took every dollar he had." 56.9 "And for one moment, he forgot all his worries." | drama swell, calm 58.2 |

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
