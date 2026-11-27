# Monkey's Paw: shot list (director, 26 Nov 2026). H1 attic + E1 wrong voice.
Lines: lines.json, voices out/legend-paw/voice (post-voice.py done). World lib tools/svg2d/lib/legend-paw.mjs (+ legend.mjs hosts).
Rules: new framing every 1-3 s (sub-shots cut on word times, like ep01), always a slow push/drift (no still frames), faces fill
>= 1/4 of frame width in dialogue close-ups, no burned-in lettering except the spoken-line subtitles (word by word, upper third,
never over faces; say-lines (L04, L08, L13) map Whisper words back to the written words, e.g. "nineteen oh two" -> "1902",
"two hundred" -> "200", by aligning normalised words (LCS) so captions never garble). Hosts: kid + keeper (candle jar = fear meter:
flame size follows the beat). Paw fingers: 0 down at start; 1 at L09, 2 at L16 end, 3 at L21 "last wish"; the kid's paw at L25 = a
4th curl is impossible, so at L25 the paw is the hosts' own paw (separate prop, fingers start 0) and ONE finger curls on "keep it".
Gaps: pre 0.1-0.25 s between lines unless noted. Target ~92 s.

| # | line | where / mood | shots (cut on words) | sound |
|---|---|---|---|---|
| 1 | L01 G | attic / attic | 0.0 already close on the paw in the kid's hand (fingers up), push in; "Put it down!" keeper's staff/hand slaps his wrist (paw drops to trunk lid) -> 2-shot medium; "Three wishes" close on keeper stern, flame flares; "Don't make one" close on paw on trunk | music A from 0.0; slap = thud-soft; candle flare = small flame |
| 2 | L02 K | attic | close kid, cheeky half smile, eyes on paw | |
| 3 | L04 N | parlour / parlour | wide parlour push-in (fire, chess, mother knitting); on "1902" cut to window outside (wind, laburnum); on "most dangerous gift" close on paw on the mantel / in soldier's hand | fire crackle bed (ai/house-fire low, lowpass), clock tick very low |
| 4 | L05 N | parlour | soldier medium holding paw up (sit), push; "holy man" = paw close with slow glow 0.3 + mood mix toward paw 0.3; "fate punishes" back to faces of father + son listening | |
| 5 | L06 S | parlour | soldier close, haunted 1 (talk); on "death" push hard into his eyes, fire dims | music thins to one cello note on "death" |
| 6 | L07 N | parlour | soldier throw (wind-up -> fling) into fire, fire flares; "father ... pulled it back out" father kneel+reach at hearth, holds it up | flare sfx, coins? no |
| 7 | L08 F | parlour | father stand, hold paw up, half smile, son grinning behind (smile 1), mother watching | |
| 8 | L09 N | parlour->paw | close paw in his hand: twist 0->1->0 + finger 0->1 + glow flash, mood parlour->paw->parlour; father drops it (wide); on "nothing" 2-shot father + son shrug | music: paw motif; dry creak (kenney/creak) on twist; then silence |
| 9 | L10 K | attic | kid close, smug | silence |
| 10 | L11 G | attic | keeper close, flame shrinks; hold 0.5 s after | silence |
| 11 | L12 N | factory gate / grief | gate wide push-in, smoke; on "caught" tilt down to the dropped flat cap (no gore, no body) | music B (wide cello/viola) |
| 12 | L13 C | front door / grief | clerk on the doorstep, nervous, hat turning; mother + father inside; on "wish" clerk's eyes down; on "200" envelope offered (offer + hold envelope) close | |
| 13 | L14 K | attic / grief tint | kid close, whisper, flame small | |
| 14 | L15 N | parlour / grief (fire out, cold) | mother takes paw from mantel (reach + hold), close on her hand | |
| 15 | L16 M | parlour / grief | mother close, tears, holds paw up to father ("bring him back" = "bring him back" scene); father reluctant, holds it; finger 1->2 + twist on line end | swell music C |
| 16 | L17 K | attic | kid close, hopeful | music ducks to cello D |
| 17 | L18 G | attic | keeper close, very quiet; flame tiny; hold 0.6 s | music cut just before the line, dry |
| 18 | L19 N | hall / knock | dark hall push toward the door; on "knocked" door shakes (knock 1) | music D very soft then OUT before first knock; knocks: 3 slow knocks after the line (ai/knock/knock, loudest sounds, -6 dB peak) |
| 19 | (knocks) | hall | 3 knocks, each a hard cut closer to the door (wide, medium, bolt close) 0.7 s apart | |
| 20 | L20 M | hall | mother up + tiptoe at the bolt, frantic (bolt 0->0.6 jerks) | knocks continue under her line (louder, faster) |
| 21 | L21 N | parlour dark / knock | father crawl in the dark, reach; close hand finds paw on floor; on "last wish" finger 2->3 + glow flash | knocks keep going until "wish" |
| 22 | L22 N | hall / knock->road | "knocking stopped" = hold on door, silence 0.4 s; "door swung open" open 0->1; "road was empty" = road wide, lamp, mist, push in | room tone only; faint cello D back after "empty" (music D) |
| 23 | L23 K | attic / attic | kid close whisper, holding the hosts' paw again (kid picked it up from the trunk lid) | music E thin cello |
| 24 | L24 G | attic | keeper close; music falls away on "knows" | |
| 25 | L25 K | attic | kid close, sneaky, turned away from her; paw held near his face | |
| 26 | (curl) | attic | extreme close paw: ONE finger curls (0->1), small glow; 0.8 s | exposed piano motif / creak |
| 27 | L26 GX | attic / attic->blank | keeperBlank blank 0->1 over 0.3 s before the line, close, dead still | dry, no music |
| 28 | L27 K | attic / blank | kid close, frightened, turns to her; 0.4 s after line: candleLight -> 0, cut to black | snuff (ai/snuff); kill all audio at black |
| end | | black | hard cut, 0.3 s black, end | |

Colour: moods from legend-paw.mjs per row; use moodMix for transitions (0.3-0.5 s); hosts get grade(m, a) washes to sit in the mood.
Kid + keeper shots: keep keeper fx near +/-0.7 (ear bug), father crawl near profile (fx +/-0.7), mother face-hands at |fx|<=0.4.
