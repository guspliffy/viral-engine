// Potato Desk "Heaven's terms and conditions" (heaven/hell 4C): the spoken lines, in order (OUTLINE.md, Jonny's pick
// 25 Nov 2026 13:51 Berlin: hook H1 + ending E1). [who, line, tone, style (VoxCPM2 acting direction), { take, voice }]
// No names in any line; the hero stays unnamed (Jonny 25 Nov, as idea A). First spoken line = the series opener + the rule.
// Voices 20 % faster than usual (Jonny 25 Nov 13:32): each recipe's own tempo x 1.2 (the Angel = Reaper recipe, already
// 1.25 since 23 Nov, goes to 1.4, not 1.5: a deadpan clerk at 1.5 rushes; Jonny judges it in the draft).
// Clause numbers COUNT UP as he walks DOWN: clause 1 lies by the gate, clause 100 on the hatch (the scroll's end).
import fs from "node:fs";
const VOICES = JSON.parse(fs.readFileSync(new URL("../../../../engine/voice/voices.json", import.meta.url), "utf8"));
const fast = (name, tempo) => ({ voice: { ...VOICES[name], tempo } });
const ANGEL = "flat, dry, tired, polite, a heaven clerk who has seen it all";
const A = fast("reaper", 1.4);
const S = fast("spud", 1.2);
const D = fast("gunslinger", 1.2);                                         // the Devil reads in the gunslinger's voice (as Desk 09, heaven steps)
const X = { voice: { voice: { af_bella: 1 }, speed: 1.1, tempo: 1.1, lang: "en-us", pitch: 1, note: "the ex: Kokoro af_bella, sweet, too friendly (stand-in)" } };
export const LINES = [
  ["angel", "At heaven's gate, there's one rule: you agree to everything. Forever.", "calm", `${ANGEL}, matter-of-fact`, A],   // 0  H1, panel 01-02
  ["spud", "Who reads these?", "calm", "carefree, breezy, already stamping, not looking", S],                                  // 1  panel 03
  ["angel", "Clause three. Harp practice. Six A.M.", "calm", `${ANGEL}, deadpan`, A],                                         // 2  panel 05
  ["spud", "I'm dead. Let me sleep.", "sad", "groggy, whiny, half asleep", S],                                                // 3  panel 05
  ["spud", "Why is it wet?!", "excited", "disgusted, high, squeamish", S],                                                     // 4  panel 06
  ["angel", "Clause eight. Clouds are wet.", "calm", `${ANGEL}, unimpressed`, A],                                              // 5  panel 06
  ["ex", "Hiii!", "excited", null, X],                                                                                          // 6  panel 07
  ["angel", "Clause fifteen. Your ex lives next door.", "calm", `${ANGEL}, slow`, A],                                          // 7  panel 07
  ["spud", "No no no no no.", "whisper", "whispering in panic, hiding", S],                                                    // 8  panel 07
  ["angel", "Clause sixteen. Free hugs.", "calm", `${ANGEL}, bored`, A],                                                       // 9  break in the ladder
  ["spud", "Oh, nice!", "excited", "pleasantly surprised, bright", S],                                                         // 10
  ["ex", "I missed you sooo much!", "excited", null, X],                                                                       // 11 panel 08
  ["spud", "Help.", "whisper", "squeezed, tiny, no air", S],                                                                   // 12 panel 08
  ["spud", "Where's the wifi?", "excited", "desperate, stretching, searching", S],                                             // 13 panel 09
  ["devil", "Five bars down here!", "excited", "bright, quick, warm game-show host, waving, delighted"],                         // 14 panel 10 (o: voice set below)
  ["angel", "Clause twenty-two. Wifi is downstairs.", "calm", `${ANGEL}, without looking up`, A],                               // 15 panel 10
  ["spud", "I want to READ it.", "excited", "angry, stubborn, pointing", S],                                                   // 16 panel 11
  ["angel", "Nobody gets to the end.", "calm", `${ANGEL}, quiet, a little ominous`, A],                                        // 17 panel 11 (second loop)
  ["spud", "Clause forty-one. No snooze button.", "calm", "reading aloud, muttering, a little worried", S],                     // 18 panel 12
  ["spud", "Clause sixty-eight. Mondays. Forever.", "sad", "reading aloud, worried, slower", S],                               // 19 panel 13
  ["spud", "Clause ninety-three. Heaven may change these terms at any time.", "sad", "reading fast, nervous, legal-speed", S],  // 20 panel 13
  ["devil", "Keep reading, buddy!", "calm", "warm game-show host, smooth, sipping a drink, amused"],                              // 21 panel 14
  ["spud", "Clause one hundred. Anyone who didn't read this... goes to hell.", "sad", "reading aloud, slowing down, realising, horrified on the last word", S],   // 22 panel 15 -> hatch drops on "hell"
];
for (const l of LINES) if (l[0] === "devil") l[4] = D;
