// Word timing for kinetic captions ("captionStyle": "kinetic"): each word of a caption pops in when it is said and
// is lit in the speaker's colour while it is being said. Pure and deterministic, run by compile() so the renderer
// and qa/ see the same times. Shared by Node (compile.mjs) and the page (stage.js reads the result).
//
// A caption's words are matched to the talk lines that overlap it (the say macro's line, or a hand-written caption
// whose words are the line's words), and to narrated lines that have a real voice. With real speech
// (engine/voice/speech.mjs) a matched word pops in when the voice starts it and stays lit until the next word starts,
// from the voice model's own phoneme timings; without it, at its share of the line's time, weighted by its
// syllables. A word nobody says (a narrator's hook without a voice) pops in on a quick stagger instead. When a caption carries on
// the one before it ("and share a…" then "and share a\nFUN FACT."), the words already on screen stay put and the
// first caption doesn't play its exit. "captionLead": s moves every word's pop that much earlier (default 0).

export const STAGGER = 0.07;     // seconds between the words of an unspoken caption
const norm = (w) => w.toLowerCase().replace(/[^\p{L}\p{N}']/gu, "");
const syllables = (w) => Math.max(1, (norm(w).replace(/([^aeiouy])e$/, "$1").match(/[aeiouy]+/g) || []).length);
export const tokens = (text) => text.split(/\s+/).filter(Boolean);
// ALL CAPS words (two letters or more) and *starred* words are the caption's punch: drawn in the accent colour
export const isPunch = (w) => /^\*.+\*[^\p{L}]*$/u.test(w) || (/\p{Lu}.*\p{Lu}/u.test(w) && w === w.toUpperCase());
export const shown = (w) => w.replace(/\*/g, "");
const ms = (t) => Math.round(t * 1000) / 1000;

// Real speech -> word times. phones: [[symbol, start, length], ...] from engine/voice/tts.py, where word gaps and
// punctuation are phones of their own. Returns one entry per token of the line: [start, end] in seconds from the
// line's start for a spoken word, null for a token with no letters ("…", "—"). null overall when the voice read the
// line as a different number of words ("10" -> "ten" is fine, "trick-or-treat" may not be), so the caption keeps
// the syllable guess rather than drift.
const BREAK = /[\s.,!?;:—…"()«»“”¡¿-]/;
export function wordTimes(phones, line) {
  const said = [];
  let cur = null;
  for (const [ph, t0, d] of phones) {
    if (BREAK.test(ph)) { cur = null; continue; }
    if (!cur) said.push((cur = [t0, t0 + d])); else cur[1] = t0 + d;
  }
  const toks = tokens(line), spoken = toks.map((w) => /[\p{L}\p{N}]/u.test(w));
  if (spoken.filter(Boolean).length !== said.length) return null;
  let k = 0;
  return toks.map((_, i) => (spoken[i] ? said[k++].map(ms) : null));
}

export function timeCaptionWords(sb) {
  // narrated lines count only with a real voice: without one nobody says them
  const talks = [...(sb.actions || []).filter((a) => a.do === "talk" && a.line),
    ...(sb.sfx || []).filter((s) => s.sound === "speech" && s.line && s.speech)];
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
    // "said" (optional): the words as spoken, when the caption writes them otherwise (spoken "gee", written "g"); same count
    const mw = (c.said && tokens(c.said).length === words.length ? tokens(c.said) : words).map(norm);
    for (const a of talks.filter((a) => a.at < c.to && a.at + (a.dur ?? 1) > c.from - 0.3).sort((p, q) => p.at - q.at)) {
      const all = tokens(a.line).map(norm), saidAll = a.speech?.words?.length === all.length ? a.speech.words : null;
      // the whole line inside the caption, or (a line split over two captions, with a real voice) the line's head at the
      // caption's end or its tail at the caption's start: o = the first line word on this caption
      const runs = [[0, all.length]];
      if (saidAll) for (let o = 1; o < all.length; o++) runs.push([o, all.length - o], [0, all.length - o]);
      let hit = null;
      for (const [o, n] of runs) {
        if (n < 2 || n > words.length - from) continue;
        const starts = o > 0 ? [from] : n < all.length ? [words.length - n] : Array.from({ length: words.length - n - from + 1 }, (_, k) => from + k);
        const s0 = starts.find((st) => st >= from && all.slice(o, o + n).every((w, i) => w === mw[st + i]));
        if (s0 != null) { hit = [s0, o, n]; break; }
      }
      if (hit) {
        const [s, o, n] = hit, lw = all.slice(o, o + n);
        const said = saidAll ? saidAll.slice(o, o + n) : null;
        if (said) {
          // the voice's own word starts; a word stays lit through the gap until the next one starts
          let at = a.at;
          lw.forEach((_, i) => { if (said[i]) at = ms(a.at + said[i][0]); out[s + i] = { at, who: a.who }; });
          let end = null;
          for (let i = lw.length - 1; i >= 0; i--) {
            if (said[i]) { out[s + i].end = end ?? ms(a.at + said[i][1]); end = out[s + i].at; } else out[s + i].end = end ?? ms(a.at + (a.dur ?? 1));
          }
        } else {
          const dur = a.dur ?? 1, wt = lw.map((_, i) => syllables(words[s + i])), tot = wt.reduce((p, q) => p + q, 0);
          let acc = 0;
          lw.forEach((_, i) => { out[s + i] = { at: ms(a.at + (dur * acc) / tot), end: ms(a.at + (dur * (acc + wt[i])) / tot), who: a.who }; acc += wt[i]; });
        }
        from = s + lw.length;
      }
    }
    // unspoken words pop in on a stagger after the word before them (or the caption's start)
    let last = c.from - STAGGER;
    for (const w of out) { if (w.at == null) w.at = ms(Math.max(c.from, last + STAGGER)); last = Math.max(last, w.at); }
    // "captionLead" (storyboard, seconds, default 0): every word pops that much before its voice starts, never before the
    // caption itself (the pop-in takes 0.16 s, so a word timed on the voice reads a beat late; Jonny 20 Nov, gravity)
    const lead = sb.captionLead || 0;
    if (lead) out.forEach((w, i) => { if (i < kept) return; w.at = ms(Math.max(c.from, w.at - lead)); if (w.end != null) w.end = ms(Math.max(w.at, w.end - lead)); });
    c.words = out;
  });
  return sb;
}
