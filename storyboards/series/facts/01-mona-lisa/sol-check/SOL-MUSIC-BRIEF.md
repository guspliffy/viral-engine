# Sol: choose the music for each scene of "How did one thief make the Mona Lisa famous?"

You are the music supervisor for an 83-second vertical animated short (TikTok, Reels, YouTube Shorts). Round potato
characters tell a TRUE story; a deep male narrator (calm, slightly fast) speaks almost all the time. Nobody on the team
can hear, so judge from the descriptions below. The producer's notes: "more dramatic and a bit louder music to underline
it better". House rules: music from 0.0 with the first picture, it matches each scene's mood, it changes at the turns,
it stays under the narrator (he must stay clear on a phone speaker). Dramatic scenes get a recorded-sounding orchestra,
NEVER synth. No cartoon "boing" music. No paid AI; we generate music ourselves with a local Stable Audio model.

## The scenes (video time, the video plays 1.1x fast)

1. 0:00-0:10 HOOK. The Louvre, 1911: visitors walk past the small Mona Lisa, nobody stops. "Nineteen eleven. Nobody stops
   for the Mona Lisa. In two days, the whole world will be hunting for her." Then the thief at the painting: "This man
   put the glass on her. He knows every door in this museum."
2. 0:10-0:13 SUNDAY NIGHT. Dark corridor: he hides in a closet, a guard walks by.
3. 0:13-0:18 MONDAY. The Louvre is closed: he lifts her off four hooks.
4. 0:18-0:24 STAIRWELL. He pulls off the frame and wraps her in his white smock.
5. 0:24-0:30 THE LOCKED DOOR. "But the door is locked. The knob is gone." A plumber walks by... and opens it for him.
6. 0:30-0:34 OUT. He walks out into Paris carrying her. Nobody notices.
7. 0:34-0:41 TUESDAY. A painter comes to copy her: four empty hooks. The guard: "Being photographed!" The guards shrug.
   "Hours later... panic." (alarm bell, guards run)
8. 0:41-0:48 THE WORLD. The Louvre shuts for a week; front pages with her face fly through the street; police even
   question Picasso.
9. 0:48-0:55 THE EMPTY WALL. When it reopens, thousands queue... to stare at an empty wall.
10. 0:55-1:05 HIS ROOM. Police knock: "Where were you on Monday?" She is in the trunk one metre away. They leave. A
    tear-off day counter: "Two years."
11. 1:05-1:11 FLORENCE. He tries to sell her; the dealer: "Leave it with me." The dealer calls the police.
12. 1:11-1:15 CAUGHT. Italy cheers him. He gets seven months.
13. 1:15-1:23 TODAY. The same wall, now behind glass, a packed crowd holding phones up. "Nobody used to stop for her.
    Now, nobody can get close. All because one man carried her out under his smock."

## The music we have (library takes, the generation prompt is what each sounds like)

- orchestra-suspense (11 s): dark suspense film score, slow ominous low piano notes, quiet tremolo strings, soft timpani heartbeat, muted trumpet far away, real orchestra, 75 BPM
- zombies-score (28 s): dark suspense film score, slow ominous cello and double bass ostinato, sparse piano, soft timpani pulse, tremolo violins, dread slowly building
- orchestra-chase (6 s): relentless thriller chase, pounding grand piano chords and racing runs, blaring trumpets, thunderous timpani, full symphony orchestra, 150 BPM
- disaster (15 s): tense disaster movie action, pounding taiko and timpani, urgent staccato string ostinato, blaring brass stabs, 128 BPM
- drama-swell (10 s): dramatic orchestral string swell with soaring choir, slow crescendo to a huge emotional climax, no drums
- epic (8 s): epic orchestral battle music, big taiko, heroic brass, driving strings, trailer style, 120 BPM
- hero-bed (8 s): heroic orchestral theme, brass fanfare, driving strings and timpani, triumphant, 120 BPM
- sos-warm (6 s): warm hopeful string swell with soft choir and piano, major key
- sad (14 s): sad slow piano with soft strings, 70 BPM
- elegant-reveal (11 s): elegant minimal reveal, soft felt piano and celesta, warm strings pad, 84 BPM
- sneaky (16 s): sneaky cartoon tiptoe, pizzicato strings, bassoon, muted plucks, 104 BPM
- spooky (11 s): eerie music box, theremin, low strings, playful creepy cartoon
- calm-landscape (22 s): calm piano with viola and woodwinds, 64 BPM
- sos-tension (14 s): synth bass pulse, ticking hi-hat, cello drone (synth: not for dramatic scenes)
- car-chase (14 s): cartoon surf-rock chase; elevator-bossa (10 s): lounge bossa nova

What plays now: 1 orchestra-suspense then drama-swell; 2-4 zombies-score dread then orchestra-suspense; 5 orchestra-suspense
then zombies-score; 6 zombies-score; 7-8 orchestra-chase, then disaster, then drama-swell; 9 orchestra-suspense; 10
orchestra-suspense + zombies-score; 11-12 orchestra-chase, disaster; 13 drama-swell then hero-bed.

## What to answer

1. For each scene (or run of scenes that should share one cue): the piece you would choose from the library and why, in
   one line each, and where the music should change, drop or hit (with the video time). Say where a moment of near
   silence or a single hit (a timpani boom, a string stab) would land better than a bed.
2. Where nothing in the library fits, write a ready-to-use Stable Audio prompt for a new piece (instruments, tempo in
   BPM, mood, "real orchestra / live recording", length in seconds), at most 4 new pieces.
3. The level: how loud the music should sit under the narrator in each part (a relative scale, e.g. "-6 dB under voice"
   vs "up to equal between lines").
4. One overall theme idea that could become this fact series' recognisable sound (one sentence).

Write the answer in English to SOL-MUSIC.md in this folder. Be concrete and short.
