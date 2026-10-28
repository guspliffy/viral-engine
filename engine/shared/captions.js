// Word timing for kinetic captions ("captionStyle": "kinetic"): each word of a caption pops in when it is said and
// is lit in the speaker's colour while it is being said. Pure and deterministic, run by compile() so the renderer
// and qa/ see the same times. Shared by Node (compile.mjs) and the page (stage.js reads the result).
//
// A caption's words are matched to the talk lines that overlap it (the say macro's line, or a hand-written caption
// whose words are the line's words). A matched word starts at its share of the line's spoken time, weighted by its
// syllables; a word nobody says (a narrator's hook) pops in on a quick stagger instead. When a caption carries on
// the one before it ("and share a…" then "and share a\nFUN FACT."), the words already on screen stay put and the
// first caption doesn't play its exit.

export const STAGGER = 0.07;     // seconds between the words of an unspoken caption
const norm = (w) => w.toLowerCase().replace(/[^\p{L}\p{N}']/gu, "");
const syllables = (w) => Math.max(1, (norm(w).replace(/([^aeiouy])e$/, "$1").match(/[aeiouy]+/g) || []).length);
export const tokens = (text) => text.split(/\s+/).filter(Boolean);
// ALL CAPS words (two letters or more) and *starred* words are the caption's punch: drawn in the accent colour
export const isPunch = (w) => /^\*.+\*[^\p{L}]*$/u.test(w) || (/\p{Lu}.*\p{Lu}/u.test(w) && w === w.toUpperCase());
export const shown = (w) => w.replace(/\*/g, "");

export function timeCaptionWords(sb) {
  const talks = (sb.actions || []).filter((a) => a.do === "talk" && a.line);
  const caps = sb.captions || [];
  caps.forEach((c, ci) => {
    const words = tokens(c.text), out = words.map(() => ({ at: null }));
    // carries on the caption before it: same place, starts as it ends, and repeats its words first
    const prev = caps[ci - 1];
    let kept = 0;
    if (prev && Math.abs(prev.to - c.from) < 0.05 && (prev.pos ?? "top") === (c.pos ?? "top")) {
      const pw = tokens(prev.text).map(norm);
      if (pw.length < words.length && pw.every((w, i) => w === norm(words[i]))) { kept = pw.length; prev.cont = true; }
    }
    for (let i = 0; i < kept; i++) out[i].at = c.from - 1;   // already on screen: no pop
    // spoken words: each talk line overlapping the caption, matched as a run of the caption's words
    let from = kept;
    for (const a of talks.filter((a) => a.at < c.to && a.at + (a.dur ?? 1) > c.from - 0.3).sort((p, q) => p.at - q.at)) {
      const lw = tokens(a.line).map(norm);
      for (let s = from; s + lw.length <= words.length; s++) {
        if (!lw.every((w, i) => w === norm(words[s + i]))) continue;
        const dur = a.dur ?? 1, wt = lw.map((_, i) => syllables(words[s + i])), tot = wt.reduce((p, q) => p + q, 0);
        let acc = 0;
        lw.forEach((_, i) => { out[s + i] = { at: Math.round((a.at + (dur * acc) / tot) * 1000) / 1000, end: Math.round((a.at + (dur * (acc + wt[i])) / tot) * 1000) / 1000, who: a.who }; acc += wt[i]; });
        from = s + lw.length;
        break;
      }
    }
    // unspoken words pop in on a stagger after the word before them (or the caption's start)
    let last = c.from - STAGGER;
    for (const w of out) { if (w.at == null) w.at = Math.round(Math.max(c.from, last + STAGGER) * 1000) / 1000; last = Math.max(last, w.at); }
    c.words = out;
  });
  return sb;
}
