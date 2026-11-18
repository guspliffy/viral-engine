// There's a catch EP10 "What if every laugh made you stronger?": the spoken lines, in order (outline v1, 18 Nov 2026,
// /mnt/project-files/videos/what-if/10-laugh-strength/OUTLINE.md). [who, line, tone, style (VoxCPM2 acting direction), { voice, take }]
// "nar" = the series narrator (voice 1, deep storyteller), queued with the narrate macro. Spud speaks in "teo" (warm,
// energetic, slightly raspy young man): his only line is the flip.
export const LINES = [
  ["nar", "What if every laugh made you stronger?", "calm", null],
  ["chip", "Ha ha ha! It's empty!", "happy", "laughing hard, bright, fast, mocking, can't stop laughing"],
  ["wedge", "Ha ha! Trust me, it's fake!", "happy", "low, laughing, slow, teasing, sure of himself"],
  ["chip", "Ha ha! He's gonna snap!", "happy", "laughing hard, high, fast, mocking"],
  ["wedge", "Trust me... he can't lift us!", "happy", "low, laughing, teasing, slow, sure of himself"],
  ["chip", "Ha ha ha ha ha!", "happy", "laughing hard, high, giggling, out of breath"],
  ["nar", "But there's a catch.", "calm", null, { take: 2 }],
  ["chip", "Whoa.", "calm", "quiet, stunned, amazed, breathless, no laugh"],
  ["wedge", "He's actually strong.", "calm", "quiet, low, amazed, slow, serious"],
  ["spud", "Wait. LAUGH AT ME!", "angry", "panicked, straining, desperate, a forced grin, shouting at the end", { voice: "teo", take: 2 }],
];

// panels v3 (18 Nov 2026 21:00: the car lift replaces the bar toss; was outline v2, Jonny's notes on draft 1: longer, a second place, a bigger superhero climb). The gym keeps
// LINES[0..3]; Spud's toss gets his own line; the street part speaks STREET in order.
export const TOSS = ["spud", "Watch this!", "happy", "cocky, proud, grinning, show-off, short", { voice: "teo" }];
export const STREET = [
  ["wedge", "Ha ha! Trust me... he can't lift a car!", "happy", "low, laughing, teasing, slow, sure of himself"],
  ["chip", "Ha ha ha ha!", "happy", "laughing hard, high, giggling, can't stop", { take: 2 }],
  ["chip", "Ha ha! You're a superhero!", "happy", "laughing with relief, bright, proud, fast"],
  ["wedge", "Trust me... he can't lift it with us inside!", "happy", "low, laughing, teasing, quick, sure of himself"],
  ["wedge", "Ha ha ha ha!", "happy", "low, belly laugh, cracking up, can't stop"],
  ["nar", "But there's a catch.", "calm", null, { take: 2 }],
  ["chip", "Whoa.", "calm", "quiet, scared, looking down from high up, breathless, no laugh"],
  ["wedge", "Put us down. Please.", "calm", "quiet, low, scared, slow, serious, no laugh"],
  ["spud", "Wait. LAUGH AT ME!", "angry", "panicked, straining, desperate, a forced grin, shouting at the end", { voice: "teo", take: 2 }],
];
