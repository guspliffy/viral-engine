// Beat storyboards: write a clip as a list of beats with relative timing and macros, compile it to the flat
// storyboard (absolute shots / actions / fx / sfx / captions) that the renderers and qa/ read.
//
//   { "id": "x", "cast": [...], "set": {...}, "beats": [
//       { "name": "hook", "shot": { "pos": [...], "look": [...] }, "caption": "make me golden.",
//         "do": [ { "macro": "say", "who": "gun", "line": "make me golden", "tone": "excited" },
//                 { "who": "gun", "do": "hop", "height": 0.18, "dur": 0.4 },
//                 { "who": "wiz", "do": "look", "to": [-0.7, 0], "at": "+0.1" } ] },
//       ... ] }
//
// Timing inside a beat: "at" is seconds from the beat's start (default 0); "+0.2" means 0.2 s after the previous
// item ends, caption included (a say's caption stays up 0.5 s past the voice); "voice+0.2" means 0.2 s after the
// previous item's voice or action ends, ignoring its caption; "end-0.3" means 0.3 s before the beat ends (needs
// "len"). A beat lasts "len" seconds, or until its last item ends plus "hold" (default 0.15). Without "duration",
// the clip lasts as long as its beats.
// Item kinds: an action ({ who, do }), an effect ({ fx: "flash", ... }), a sound ({ sfx: "tink", ... }) or a
// macro ({ macro, who, ... }, see MACROS). A beat's "shot" starts at the beat; "shot": "keep" (default) keeps the
// camera. A beat's "caption" (text or { text, pos, style, beats }) shows for that beat, or for "beats" beats.
// A flat storyboard (no "beats", or its own "actions") passes through unchanged.

const r3 = (x) => Math.round(x * 1000) / 1000;

// roughly how long a line of gibberish takes to say, so voice, mouth and caption agree
const sayLen = (line, tone) => Math.max(0.45, line.trim().split(/\s+/).length * (tone === "excited" ? 0.24 : 0.3));

// Each macro returns items timed relative to its own start (same item kinds as above, macros excluded).
export const MACROS = {
  // a line of dialogue: voice + mouth, and the line as a caption unless caption: false
  say: ({ who, line, tone = "calm", dur, caption = true, pos, seed }) => {
    const d = dur ?? sayLen(line, tone);
    // the line rides on the talk action: it seeds the voice, so the same line always sounds the same wherever it is
    return [{ who, do: "talk", tone, dur: d, line, ...(seed != null ? { seed } : {}) }, ...(caption ? [{ caption: line, len: Math.max(d + 0.5, line.split(/\s+/).length / 3) , pos }] : [])];
  },
  // walks in to a spot and settles with a small squash
  enter: ({ who, to, dur = 0.7 }) => [{ who, do: "move", to, dur, ease: "out" }, { who, do: "squash", amount: 0.08, dur: 0.2, at: dur - 0.05 }],
  // double take: glance at "to", look away, snap back shocked
  take: ({ who, to: target = [0, 0], away = [-0.6, 0.1] }) => [
    { who, do: "look", to: target, dur: 0.12 }, { who, do: "look", to: away, dur: 0.15, at: 0.3 },
    { who, do: "look", to: target, dur: 0.06, at: 0.6 }, { who, do: "expr", expr: "shocked", dur: 0.08, at: 0.6 },
    { who, do: "squash", amount: 0.12, dur: 0.2, at: 0.6 }, { who, do: "hop", height: 0.08, dur: 0.25, at: 0.62 },
  ],
  // a quick emotional reaction; big: true adds a hop
  react: ({ who, expr = "shocked", big = false }) => [
    { who, do: "expr", expr, dur: 0.1 }, { who, do: "squash", amount: big ? 0.14 : 0.07, dur: 0.22 },
    ...(big ? [{ who, do: "hop", height: 0.12, dur: 0.3, at: 0.05 }] : []),
  ],
  nod: ({ who, times = 2 }) => Array.from({ length: times }, (_, i) => ({ who, do: "squash", amount: 0.07, dur: 0.22, at: i * 0.27 })),
  // smug shrug: arms up, lean, smug face; arms come down after hold seconds
  shrug: ({ who, hold = 0.9, expr = "smug" }) => [
    { who, do: "expr", expr, dur: 0.2 }, { who, do: "arm", side: "both", pose: "shrug", dur: 0.3, ease: "out" },
    { who, do: "lean", to: -6, dur: 0.3 }, { who, do: "arm", side: "both", pose: "rest", dur: 0.35, at: 0.3 + hold },
    { who, do: "lean", to: 0, dur: 0.35, at: 0.3 + hold },
  ],
  // deflates: deadpan face, sprout droops, a little sag
  sigh: ({ who }) => [{ who, do: "expr", expr: "deadpan", dur: 0.3 }, { who, do: "droop", to: 0.45, dur: 0.3 }, { who, do: "squash", amount: 0.08, dur: 0.45 }],
  // tries, it goes wrong, pretends it was on purpose
  "fail-and-recover": ({ who }) => [
    { who, do: "hop", height: 0.1, dur: 0.3 }, { who, do: "expr", expr: "shocked", dur: 0.08, at: 0.3 },
    { who, do: "squash", amount: 0.15, dur: 0.2, at: 0.3 }, { who, do: "look", to: [0, 0], dur: 0.15, at: 0.75 },
    { who, do: "expr", expr: "cocky", dur: 0.2, at: 0.8 },
  ],
  // magic transformation cover: flash + poof + shake at once
  zap: ({ who, color = "#ffe27a" }) => [
    { fx: "flash", dur: 0.25, only: "standard" }, { fx: "impact", dur: 0.1, only: "anime" }, { fx: "flash", dur: 0.2, peak: 0.8, at: 0.1, only: "anime" },
    { fx: "shake", dur: 0.3, amp: 0.05 }, { fx: "poof", who, dur: 0.7, spark: color, puffs: 14 },
  ],
};

const itemEnd = (it) => {
  if (it.caption != null) return it.len ?? 0;
  if (it.do === "hop" || it.do === "move" || it.do === "talk" || it.do === "charge") return it.dur ?? 0.3;
  return it.dur ?? (it.fx ? 0.1 : it.sfx ? 0.2 : 0.3);
};

export function compile(sb) {
  // flat storyboards (with their own "actions") pass through, even if they carry a "beats" list as notes
  if (!Array.isArray(sb.beats) || Array.isArray(sb.actions)) return sb;
  const out = { ...sb, shots: [...(sb.shots || [])], actions: [...(sb.actions || [])], fx: [...(sb.fx || [])], sfx: [...(sb.sfx || [])], captions: [...(sb.captions || [])] };
  const beatSpans = [];
  let t = 0;
  const openCaps = [];
  sb.beats.forEach((b, bi) => {
    const start = b.at != null ? b.at : t;
    if (b.shot && b.shot !== "keep") out.shots.push({ ...b.shot, at: r3(start) });
    // expand macros, then resolve relative times
    const items = [];
    for (const it of b.do || []) {
      if (it.macro) {
        const m = MACROS[it.macro];
        if (!m) throw new Error(`beat "${b.name ?? bi}": unknown macro "${it.macro}" (known: ${Object.keys(MACROS).join(", ")})`);
        items.push({ group: m(it), at: it.at });
      } else items.push(it);
    }
    let prevEnd = 0, prevVoiceEnd = 0, last = 0;
    const placed = [];
    const when = (at) => {
      if (at == null) return 0;
      if (typeof at === "number") return at;
      const m = String(at).match(/^(\+|voice\+|end-)([\d.]+)$/);
      if (!m) throw new Error(`beat "${b.name ?? bi}": bad time "${at}" (use seconds, "+0.2", "voice+0.2" or "end-0.3")`);
      if (m[1] === "+") return prevEnd + Number(m[2]);
      if (m[1] === "voice+") return prevVoiceEnd + Number(m[2]);
      if (b.len == null) throw new Error(`beat "${b.name ?? bi}": "end-" times need the beat's "len"`);
      return b.len - Number(m[2]);
    };
    for (const it of items) {
      const at0 = when(it.at);
      const group = it.group ? it.group.map((g) => ({ ...g, at: at0 + (g.at ?? 0) })) : [{ ...it, at: at0 }];
      let gEnd = at0, vEnd = at0;
      for (const g of group) { placed.push(g); gEnd = Math.max(gEnd, g.at + itemEnd(g)); if (g.caption == null) vEnd = Math.max(vEnd, g.at + itemEnd(g)); }
      prevEnd = gEnd; prevVoiceEnd = vEnd; last = Math.max(last, gEnd);
    }
    const len = b.len ?? last + (b.hold ?? 0.15);
    for (const g of placed) {
      const abs = r3(start + g.at), { at, ...rest } = g;
      if (rest.caption != null) { out.captions.push({ text: rest.caption, from: abs, to: r3(Math.min(start + len, abs + (rest.len ?? len))), pos: rest.pos || "top" }); continue; }
      if (rest.fx) { const { fx, ...f } = rest; out.fx.push({ do: fx, at: abs, ...f }); continue; }
      if (rest.sfx) { const { sfx, ...f } = rest; out.sfx.push({ sound: sfx, at: abs, ...f }); continue; }
      if (!rest.who || !rest.do) throw new Error(`beat "${b.name ?? bi}": item needs who + do, fx, sfx, caption or macro: ${JSON.stringify(g)}`);
      out.actions.push({ ...rest, at: abs });
    }
    if (b.caption != null) {
      const c = typeof b.caption === "string" ? { text: b.caption } : b.caption;
      openCaps.push({ c, from: start, left: c.beats ?? 1 });
    }
    for (const oc of openCaps) if (oc.left > 0 && --oc.left === 0) {
      const { beats, ...c } = oc.c;
      out.captions.push({ pos: "top", ...c, from: r3(oc.from), to: r3(start + len) });
    }
    beatSpans.push({ name: b.name ?? `beat ${bi + 1}`, kind: b.kind, from: r3(start), to: r3(start + len) });
    t = start + len;
  });
  for (const oc of openCaps) if (oc.left > 0) { const { beats, ...c } = oc.c; out.captions.push({ pos: "top", ...c, from: r3(oc.from), to: r3(t) }); }
  out.duration = sb.duration ?? r3(t);
  out.beatSpans = beatSpans; // for contact sheets and reviews
  if (beatSpans.some((b) => b.kind === "escalation")) out.escalation = true;
  for (const k of ["shots", "actions", "fx", "sfx", "captions"]) out[k].sort((a, b) => (a.at ?? a.from) - (b.at ?? b.from));
  delete out.beats;
  return out;
}

// node engine/compile.mjs storyboards/x.json [out.json]  -> prints or writes the flat storyboard
if (process.argv[1] && import.meta.url === (await import("node:url")).pathToFileURL(process.argv[1]).href) {
  const fs = await import("node:fs");
  const flat = JSON.stringify(compile(JSON.parse(fs.readFileSync(process.argv[2], "utf8"))), null, 2);
  if (process.argv[3]) fs.writeFileSync(process.argv[3], flat); else console.log(flat);
}
