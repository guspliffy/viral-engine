// Norse myth 01 "One eye for one sip" (Wednesday): the spoken lines, in order (STORY.md v1, Jonny's picks 22 Nov 2026 08:27 Berlin).
// [who, line, tone, style (VoxCPM2 acting direction; null = the recipe's base + tone), { voice, take }]
// No names on screen; spoken names are fine (Odin is in the line on purpose: hook 1 = direct talk to a god everyone knows).
// All lower case where a word is stressed (the TTS spells caps out: heart video lesson). Voices for the rough draft (Jonny judges by ear):
// Chip "chip-clean", Spud "spud-quick", Odin "reaper" (low, flat, old) read slow, the head "dragon" read very slow, ravens "wedge" / "mash" quick.
const CH = { voice: "chip-clean" }, SP = { voice: "spud-quick" }, OD = { voice: "reaper" }, HD = { voice: "dragon" }, R1 = { voice: "wedge" }, R2 = { voice: "mash" };
const ODIN = "old, deep, slow, calm, a god who has seen everything";
const HEAD = "very deep, very slow, ancient, echoing, strict";
const RAVEN = "rough, quick, whispered, gossiping, a little smug";
export const LINES = [
  ["chip", "Odin... what happened to your eye?", "excited", "curious, a little scared, looking up", CH],          // 0   0.0
  ["odin", "I paid it. For one sip.", "calm", ODIN, OD],                                                         // 1   1.6
  ["spud", "This is the well of wisdom. One sip and you know everything.", "calm", "calm, knowing, explaining", SP], // 2   3.0
  ["chip", "I have a test tomorrow. I studied zero.", "excited", "embarrassed grin, fast", CH],                   // 3   6.0
  ["head", "One eye. One sip.", "calm", HEAD, HD],                                                               // 4   8.5
  ["chip", "Do you take cash?", "excited", "hopeful, small", CH],                                                 // 5   11.0
  ["head", "Eyes.", "calm", HEAD, { ...HD, take: 2 }],                                                           // 6
  ["chip", "Nope. Is there a free way?", "excited", "disgusted, then quick and hopeful", CH],                     // 7   14.5
  ["odin", "I hung on this tree. Nine nights. No food, no water.", "calm", ODIN, { ...OD, take: 2 }],             // 8   16.5
  ["odin", "That's how I found the runes. The first letters.", "calm", ODIN, { ...OD, take: 3 }],                 // 9   21.0
  ["chip", "Nine nights? I can do one.", "calm", "cocky, relaxed, grinning", CH],                                 // 10  24.0
  ["chip", "How long has it been?", "excited", "strained, face red, upside down", CH],                            // 11  26.0
  ["spud", "Four seconds.", "calm", "calm, dry", SP],                                                             // 12
  ["odin", "Then ask them. Every day they fly over the whole world and tell me everything.", "calm", ODIN, { ...OD, take: 4 }], // 13 30.0
  ["raven1", "He never studied.", "calm", RAVEN, R1],                                                             // 14  35.0
  ["raven2", "He played games till four.", "calm", RAVEN, R2],                                                    // 15  37.0
  ["chip", "Your birds are snitching on me!", "excited", "outraged, betrayed, high, fast", CH],                   // 16  39.0
  ["head", "You drink. You pay.", "calm", HEAD, { ...HD, take: 3 }],                                              // 17  43.0
  ["chip", "I need both! One for reading, one for... the other reading!", "excited", "panicked, bargaining, fast", CH], // 18 45.5
  ["spud", "Chip. You're a potato.", "calm", "calm, patient, one finger up", SP],                                 // 19  48.5
  ["chip", "So?", "calm", "confused, small", CH],                                                                 // 20
  ["spud", "Potatoes have eyes all over.", "calm", "calm, amused, explaining", SP],                                 // 21  51.0
  ["head", "...Fair.", "calm", HEAD, { ...HD, take: 4 }],                                                         // 22  55.0
  ["chip", "So now I know everything?", "excited", "breathless, amazed", CH],                                     // 23  57.0
  ["head", "One eye. One sip. One thing.", "calm", HEAD, { ...HD, take: 5 }],                                     // 24  60.5
  ["chip", "Wednesday... is named after you.", "excited", "slow dawning wonder, a discovery", CH],                // 25  62.5
  ["odin", "Woden's day. My day.", "calm", "old, deep, warm, proud, the first smile", { ...OD, take: 5 }],        // 26  65.5
  ["chip", "I paid an eye for that?!", "excited", "outraged, high, fast", CH],                                    // 27  68.0
  ["chip", "Because it's Odin's day.", "calm", "smug, slow, savouring it", { ...CH, take: 2 }],                    // 28  74.5
];
// measured spoken lengths (qa/lines.mjs odin-voice-probe.json, 22 Nov 2026), in LINES order; total ~59.3 s of speech
export const DUR = [1.29, 2.54, 3.46, 2.50, 2.16, 1.01, 0.94, 1.59, 5.75, 3.49, 1.72, 0.93, 0.99, 5.23, 1.13, 1.80, 1.49, 3.03, 3.23, 2.12, 0.34, 1.65, 0.80, 1.15, 3.61, 2.17, 2.46, 1.12, 1.07];
