# Potato Desk 01 "Reaper's Help Desk": notes (director, 17 Nov 2026)

- Brief ../BRIEF.md ep 1; design ../DESIGN.md (Fable 5.2): counter end-on along z, camera (0, 1.25, 10.4) fov 25 (0.2 m lower than DESIGN).
- Voices: free VoxCPM2. Chip = new recipe `chip` (engine/voice/voices.json, targets/chip-ref.wav, designed from a description,
  seed 11 of 4). Reaper = `reaper` (character notyet/reaper-noscythe; the scythe is the wall prop `parkedscythe`).
  Real speech only through the `say` MACRO (c.say writes a talk action = gibberish in a beat clip). Lines + styles in lines.mjs,
  measured lengths in DUR (make-voice-probe.mjs + node qa/lines.mjs).
- Places: Reaper (-1.02, 0.1) yaw 60, Chip (0.45, 0.1) yaw -60, chair (0.75, -0.8). Facing +x, Reaper's RIGHT hand is the camera side.
- Typing: one finger, right hand only (both hands crossed the counter edge). Stamp: mug hold with the right hand, he never
  lets go (every let-go flipped the palm in 2 frames). Bell: left hand rest.
- The ticket is never picked up on screen: the jump cut (JUMP, fov 23.5 shot) covers it. Old Chip (potatobrawl/chip-old,
  costume keys age/oldBeard/brows/dust) sits hidden from frame 0, shown at the jump; cobwebs + aged ticket move in at J.
- Captions upper third y 470 (Jonny 12 Nov), digits for numbers; title band y 200-440 left for his in-app title.
- Fix on test: held-high (#247). Comparison video: happiness-02 skip remote (52 s).
