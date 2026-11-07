# Nature beds (`"sound": { "nature": [...] }`, engine/audio.mjs natureBed)

Loopable 30 s mono beds at -20 LUFS, 44.1 kHz. A clip's seed picks take 1 or 2 unless `"take"` pins one. Replaced the
Stable Audio takes on 6 Nov 2026 after Jonny heard them as metallic: those had steady tones 8-15 dB over their
neighbourhood (tools: a Welch spectrum against its 300 Hz median), these stay under 7 dB.

| bed | takes | what it is | source, license |
|---|---|---|---|
| birds | 1, 2 | songbirds in a park, real field recording (from 300 s and 180 s, high-passed at 120 Hz, no voices found by whisper) | "Park ambiences" by thimras, OpenGameArt, CC0 |
| stream | 1, 2 | a small river, steady babble (from 60 s and 270 s, high-passed at 60 Hz) | "Park ambiences" by thimras, OpenGameArt, CC0 |
| lake | 1, 2 | waves lapping on a river shore, slow swells (from 660 s and 1020 s of Vistula.mp3) | "Sea and river wave sounds" by randommind, OpenGameArt, CC0 |
| waterfall | 1, 2 | a steady distant roar with spray, synthesised from filtered noise | tools/sound/nature-synth.py (ours) |
| wind | 1, 2 | a breeze in gusts, synthesised from filtered noise, no whistle | tools/sound/nature-synth.py (ours) |
| leaves | 1, 2 | leaves rustling as the gusts move them, noise grains whose rate follows the gusts | tools/sound/nature-synth.py (ours) |

The synthetic beds follow A. Farnell, Designing Sound (2010): filtered noise only, no resonators, so nothing rings.
Free real recordings of a waterfall, wind in trees and leaves were not found under CC0 (OpenGameArt's wind files are
microphone rumble); a real recording can replace a take under the same name.
