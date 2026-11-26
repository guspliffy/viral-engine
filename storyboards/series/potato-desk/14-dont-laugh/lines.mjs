// Potato Desk 14 "Don't. Laugh." (court, a YOU situation: nobody says the hero's name, Jonny 26 Nov 2026 08:55 Berlin):
// the spoken lines, in order, as RHYMES (Jonny 08:58 "make it rhyme again"). Story + picks: STORY.md here.
// The rule tells itself in the story (Jonny 08:42: "Don't drink it", never "there is one rule"): one more laugh = ten years,
// don't look at his head. Voices: the x1.15 recipes (story.md section 5, first use in a new clip); Mash's oath and answers
// after a breath of balloon helium = mash-helium. [who, line, tone, style (VoxCPM2 acting direction), { voice, take }]
// Cast: vik = the judge (his head above the brows is off frame until the reveal), wedge = your lawyer, spud = you,
// mash = your best friend, the witness; chip + two jurors laugh at the end (E4, Jonny 08:59).
const J = { voice: "viking-x115" }, L = { voice: "wedge-x115" }, Y = { voice: "spud-x115" }, M = { voice: "mash" }, MH = { voice: "mash-helium" };
export const LINES = [
  ["vik", "You laughed in my courtroom. Not once. But TWICE.", "angry", "deep, stern, furious, slow, a judge", J],
  ["wedge", "One more, it's ten years. So here's my advice:", "whisper", "urgent whisper, serious, close to the ear", L],
  ["wedge", "Keep your face still, and whatever you do...", "whisper", "urgent whisper, deadly serious", L],
  ["wedge", "DON'T look at his head. It's too dangerous for you.", "whisper", "urgent whisper, scared, deadly serious", L],
  ["spud", "Why? What's on his head?", "whisper", "curious whisper, nervous", Y],
  ["wedge", "The most dangerous thing. Eyes down, like I said.", "whisper", "sharp whisper, stern", L],
  ["vik", "Defense, your witness. Let's get this done.", "calm", "deep, stern, impatient, a judge", J],
  ["wedge", "Your Honor, his best friend. The most serious one.", "calm", "proud, confident, a lawyer presenting", L],
  ["spud", "Oh no.", "sad", "quiet, dread, horrified", Y],
  ["vik", "A smile is five years. A giggle is ten.", "angry", "deep, stern, slow, threatening, a judge", J],
  ["vik", "Now raise your right hand. And swear it. And then...", "calm", "deep, stern, a judge", J],
  ["mash", "I swear to tell the truth, the whole truth, amen!", "calm", "solemn, serious, very sincere", MH],
  ["wedge", "Think sad thoughts. Think rain. Think tax.", "whisper", "urgent whisper, panicked", L],
  ["vik", "Is he a serious man? Just give me the facts.", "calm", "deep, stern, a judge", J],
  ["mash", "The most serious man that I've ever known.", "calm", "solemn, sincere, proud", { ...MH, take: 2 }],   // take 1 read "most serious matter" (Whisper)
  ["wedge", "Exhibit A: his serious face. Fully grown.", "calm", "proud, confident, presenting evidence", L],
  ["vik", "Did he ever laugh at something... he shouldn't?", "calm", "deep, slow, suspicious, a judge", J],
  ["mash", "At your head? Oh, he NEVER! I mean... he couldn't!", "excited", "blurting, panicked, then backpedalling", MH],
  ["vik", "Case dismissed. You are free to go.", "calm", "deep, stern, flat, final", J],
  ["spud", "I... held it.", "sad", "squeaky, strained, tearful, proud, barely holding in a laugh", Y],
  ["vik", "All of you? TEN YEARS. EACH. Told you so.", "angry", "deep, very loud, furious, a judge", { ...J, take: 2 }],
];
// The jury's breakdown (E4): one voiced burst each, overlapping (assets/sfx has no laugh). [who, line, tone, style, { voice }]
export const LAUGHS = [
  ["chip", "Ha! Ha ha ha ha ha!", "excited", "bursting out laughing, can't stop, wheezing, high", { voice: "chip-x115" }],
  ["agent", "Hahaha! Ha ha ha!", "excited", "big belly laugh, snorting, losing it", { voice: "archaeologist" }],
  ["rosti", "Hahaha! Ha ha!", "excited", "crying with laughter, howling", { voice: "teo" }],
];
