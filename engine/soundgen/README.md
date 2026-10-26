# soundgen: AI sound effects and music beds

Makes new library sounds with **Stable Audio 3 Small** (SFX and Music versions) on the CPU, through
[sa3.cpp](https://github.com/betweentwomidnights/sa3.cpp) (C++/ggml port, MIT). Output goes straight into the sound
library: effects to `assets/sfx/ai/` (catalog ids `ai/<id>`), music beds to `assets/music/ai/`.

```
engine/soundgen/setup.sh                 # build sa3.cpp for CPU, download weights (~3.3 GB), Python venv
engine/soundgen/serve.sh                 # sa3-server: small-sfx on :8006, small-music on :8007
python3 engine/soundgen/generate.py engine/soundgen/recipes.json RAW_DIR          # raw takes (prompt x seed)
VENV/bin/python engine/soundgen/pick.py engine/soundgen/recipes.json RAW_DIR \
  --sfx-out assets/sfx/ai --music-out assets/music/ai --report RAW_DIR/report.json
node assets/sfx/make-catalog.mjs                                                  # ids ai/<id> in the catalog
VENV/bin/python engine/soundgen/sheet.py . sound-test.mp4                          # numbered test sheet to judge by ear
# (engine-sounds.mjs renders the old code effects and Kenney sounds for the sheet through engine/audio.mjs)
```

## How a sound is made

1. **recipes.json** lists each sound: 2 prompts x 2-3 seeds, 8-10 s per take. Stable Audio makes poor 1-3 s clips
   (the model wants room), so every take is long and holds many hits.
2. **generate.py** renders the takes through the running servers (model stays loaded).
3. **pick.py** cuts the takes. `split` sounds become one hit per file (one footfall, key press, knock or wing flap,
   as the library wants); `oneshot` sounds keep the best single event (katana slice, magic zap). Leading silence is
   cut to under 10 ms so the file starts on the hit frame; 1 ms fade in, 15 ms fade out, peak -1 dBFS, mono 16-bit
   44.1 kHz. Music beds are cut on their own detected beats (first beat to the beat 4 x bars later; the model
   treats the asked BPM as a hint, e.g. "sneaky 104 BPM" came out at 120), and the audio after the cut is
   crossfaded (0.25 s) into the head, so the loop seam is continuous. `bpm` in the manifest is the measured tempo,
   `loopable` means the beat was steady (beat-to-beat spread under 6 %). Stored as Ogg Vorbis at -16 LUFS.
4. **Ranking without ears**: Claude can't hear, so every cut is scored by CLAP (`laion/larger_clap_general`, Apache
   2.0): similarity to its label ("a single knock on a wooden door") minus similarity to the closest distractor
   (other sounds, music, speech, noise, wind...). The best cuts across seeds win (at most 2-3 per take, for variety).
   The scores are in the manifest per take. **Jonny judges the result by ear** from the test sheet.

## Speed (4-core Xeon container, no GPU, 2026-10-25)

| what | time |
|---|---|
| model load (once per server) | ~10 s |
| 10 s SFX take (16 s canvas incl. sa3's 6 s headroom) | ~18 s |
| 8 s SFX take | ~16.5 s |
| music take, 20-29 s (bars + 6 s for the loop cut) | 25-34 s |
| CLAP ranking of ~60 cuts | ~1 min |

One 10 s take gives about 8-10 footsteps or key presses, so a new sound family (6 takes) takes about 2 minutes.
Don't run pick.py while generate.py is running: both use every core and each slows the other 3-4x.
A GPU (`./build.sh cuda` in sa3.cpp) makes this near instant.

## License

Stable Audio 3 Small weights: **Stability AI Community License**. Free for individuals and organisations under
**$1M total annual revenue**; commercial users must register at https://stability.ai/license (free); you own the
outputs. The text encoder is T5Gemma under the Gemma Terms of Use. The weights come from public GGUF mirrors
(`thepatch/*-GGUF`) of Stability's gated Hugging Face repos; the same license applies. Every sound in
`assets/sfx/ai/manifest.json` carries this license string.
