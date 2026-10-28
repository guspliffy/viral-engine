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
// camera. In a directed clip (sb.direct) a beat without a camera gets a placeholder that engine/direct.mjs resolves. A beat's "caption" (text or { text, pos, style, beats }) shows for that beat, or for "beats" beats.
// A flat storyboard (no "beats", or its own "actions") passes through unchanged.

import { timeCaptionWords } from "./shared/captions.js";

const r3 = (x) => Math.round(x * 1000) / 1000;

// roughly how long a line of gibberish takes to say, so voice, mouth and caption agree
const sayLen = (line, tone) => Math.max(0.45, line.trim().split(/\s+/).length * (tone === "excited" ? 0.24 : 0.3));

// Each macro returns items timed relative to its own start (same item kinds as above, macros excluded).
export const MACROS = {
  // a line of dialogue: voice + mouth, and the line as a caption unless caption: false. With real speech
  // (engine/voice/speech.mjs runs first) dur is the spoken length and speech carries the audio id and mouth keys.
  say: ({ who, line, tone = "calm", dur, caption = true, pos, seed, speech }) => {
    const d = dur ?? sayLen(line, tone);
    // the line rides on the talk action: it seeds the voice, so the same line always sounds the same wherever it is
    return [{ who, do: "talk", tone, dur: d, line, ...(seed != null ? { seed } : {}), ...(speech ? { speech } : {}) }, ...(caption ? [{ caption: line, len: Math.max(d + 0.5, line.split(/\s+/).length / 3) , pos }] : [])];
  },
  // a narrator nobody on screen speaks for (voice: "storyteller-warm" by default, see engine/voice/voices.json):
  // sound only, no mouth, and the line as a caption unless caption: false. Needs real speech; without it, captions only.
  narrate: ({ line, dur, caption = true, pos, speech, gain = 0.5 }) => {
    const d = dur ?? sayLen(line, "calm");
    return [{ sfx: "speech", dur: d, line, gain, ...(speech ? { speech } : {}) }, ...(caption ? [{ caption: line, len: Math.max(d + 0.5, line.split(/\s+/).length / 3), pos }] : [])];
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
  // Performances: small acted sequences with a thought process (eyes first, a held beat, then the body), built
  // from still holds and the acting eases (antic, settle). Times are tuned at 30 fps; scale them with "len" later.
  // realisation: eyes find it, the body holds while it lands, the face changes, then the body reacts; "then" looks
  // at someone afterwards
  realize: ({ who, to = [0, 0], then, expr = "shocked", big = false }) => [
    { who, do: "look", to, dur: 0.1 }, { who, do: "still", dur: 0.3, idle: 0.1, fade: 0.08 },
    { who, do: "expr", expr, dur: 0.12, at: 0.28 }, { who, do: "squash", amount: big ? 0.14 : 0.09, dur: 0.25, at: 0.36 },
    ...(big ? [{ who, do: "hop", height: 0.08, dur: 0.25, at: 0.38 }] : []),
    ...(then ? [{ who, do: "look", to: then, dur: 0.15, at: 0.8 }] : []),
  ],
  // reaching for something: eyes go first, a small lean away (hesitation), then the arm winds up and goes, overshoots
  // a touch and settles while the body leans into it
  reach: ({ who, side = "R", pose, look, dur = 0.5, hesitate = 0.2 }) => {
    const s = side === "L" ? -1 : 1, go = 0.1 + hesitate;
    return [
      ...(look ? [{ who, do: "look", to: look, dur: 0.15 }] : []),
      { who, do: "lean", to: -3 * s, dur: 0.2, ease: "out", at: 0.1 },
      { who, do: "arm", side, pose, dur, ease: "anticSettle", at: go },
      { who, do: "lean", to: 5 * s, dur: dur * 0.8, at: go + 0.05 }, { who, do: "lean", to: 0, dur: 0.35, at: go + dur + 0.1 },
    ];
  },
  // one exact action with no wasted motion (Reaper): the body goes still, the arm snaps to the pose and settles,
  // holds, and goes back
  precise: ({ who, side = "L", pose, back = "rest", hold = 0.3, look }) => [
    { who, do: "still", dur: 0.85 + hold, idle: 0.1 },
    ...(look ? [{ who, do: "look", to: look, dur: 0.12, at: 0.1 }] : []),
    { who, do: "arm", side, pose, dur: 0.22, ease: "settle", at: 0.3 },
    { who, do: "arm", side, pose: back, dur: 0.3, at: 0.55 + hold },
  ],
  // the big confident start (Phoenix): crouch, spring up with arms open, a flourish, land on hands on hips
  demonstrate: ({ who, expr = "cocky" }) => [
    { who, do: "squash", amount: 0.14, dur: 0.25 }, { who, do: "expr", expr, dur: 0.12, at: 0.05 },
    { who, do: "arm", side: "both", pose: "up", dur: 0.25, ease: "settle", at: 0.2 }, { who, do: "hop", height: 0.06, dur: 0.25, at: 0.2 },
    { who, do: "flare", dur: 0.6, at: 0.25 },
    { who, do: "arm", side: "both", pose: "hips", dur: 0.3, ease: "settle", at: 0.8 }, { who, do: "squash", amount: 0.05, dur: 0.2, at: 0.85 },
  ],
  // caught failing: freeze, eyes dart, sag, then snap into a confident pose as if it was the plan
  recover: ({ who, to = [0, 0], pose = "hips", expr = "cocky" }) => [
    { who, do: "still", dur: 0.5, idle: 0, fade: 0.06 }, { who, do: "expr", expr: "shocked", dur: 0.08 },
    { who, do: "look", to: [-0.5, 0], dur: 0.08, at: 0.18 }, { who, do: "look", to: [0.5, 0], dur: 0.08, at: 0.32 },
    { who, do: "droop", to: 0.6, dur: 0.2, at: 0.25 },
    { who, do: "expr", expr, dur: 0.12, at: 0.55 }, { who, do: "droop", to: 0, dur: 0.15, at: 0.55 },
    ...(pose ? [{ who, do: "arm", side: "both", pose, dur: 0.25, ease: "settle", at: 0.55 }] : []), { who, do: "squash", amount: 0.06, dur: 0.2, at: 0.58 },
    { who, do: "look", to, dur: 0.12, at: 0.6 },
  ],
  // quiet affection (Reaper): looks at them, a slow blink, the smile comes slowly, then he looks away and gives the
  // smallest nod, as if nobody should see it
  affection: ({ who, other = [-0.6, 0.05], away }) => [
    { who, do: "still", dur: 1.9, idle: 0.3 }, { who, do: "look", to: other, dur: 0.25 },
    { who, do: "blink", dur: 0.35, at: 0.35 }, { who, do: "expr", expr: "kind", dur: 0.5, at: 0.6 },
    { who, do: "look", to: away || [other[0] * 0.3, -0.35], dur: 0.3, at: 1.2 }, { who, do: "squash", amount: 0.04, dur: 0.3, at: 1.5 },
  ],
  // something hits them (a bonk on the hat): the hit, then the body, then the eyes, then the face, five frames
  // apart instead of all on one frame, with the eyes kept open through the take. The hat is knocked up and askew
  // (pushed down, its cone would cut into the head); hat: { off, spin } knocks it another way, false leaves it alone;
  // hold is how long it stays askew
  hit: ({ who, look = [0, 0.7], expr = "shocked", set, hat = true, recoil = -5, hold = 0.4 }) => [
    { who, do: "still", dur: hold + 0.35, idle: 0.5, fade: 0.05 },
    ...(hat ? [{ who, do: "hat", off: hat.off || [0.02, 0.05, -0.01], spin: hat.spin || [-6, 0, -15], dur: 0.16 }, { who, do: "hat", off: [0, 0, 0], spin: [0, 0, 0], dur: 0.3, ease: "settle", at: hold }] : []),
    { who, do: "squash", amount: 0.16, dur: 0.25, at: 0.02 },
    { who, do: "pitch", to: recoil, dur: 0.12, ease: "out", at: 0.03 }, { who, do: "pitch", to: 0, dur: 0.3, ease: "settle", at: 0.2 },
    { who, do: "look", to: look, dur: 0.08, at: 0.07 }, { who, do: "expr", expr, ...(set ? { set } : {}), dur: 0.08, at: 0.1 },
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
  const out = compileBeats(sb);
  // kinetic captions: each word's time, from the talk lines (engine/shared/captions.js)
  return out.captionStyle === "kinetic" ? timeCaptionWords({ ...out, captions: (out.captions || []).map((c) => ({ ...c })) }) : out;
}

function compileBeats(sb) {
  // flat storyboards (with their own "actions") pass through, even if they carry a "beats" list as notes
  if (!Array.isArray(sb.beats) || Array.isArray(sb.actions)) return sb;
  const out = { ...sb, shots: [...(sb.shots || [])], actions: [...(sb.actions || [])], fx: [...(sb.fx || [])], sfx: [...(sb.sfx || [])], captions: [...(sb.captions || [])] };
  const beatSpans = [];
  let t = 0;
  const openCaps = [];
  sb.beats.forEach((b, bi) => {
    const start = b.at != null ? b.at : t;
    // a directed clip (sb.direct, engine/direct.mjs): a beat without a camera, or with a shot size, gets one chosen
    // from its kind and who acts in it
    const sized = b.shot && b.shot !== "keep" && !b.shot.pos;
    if (sb.direct && (b.shot == null || sized)) out.shots.push({ at: r3(start), direct: { kind: b.kind, ...(b.who && { who: b.who }), ...(sized && (typeof b.shot === "string" ? { size: b.shot } : b.shot)) } });
    else if (b.shot && b.shot !== "keep") out.shots.push({ ...b.shot, at: r3(start) });
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
      // a prop tween ({ do: "prop", id, set }) and a prop carrying another ({ do: "carry", prop, by }) belong to no one
      if (!rest.do || (!rest.who && rest.do !== "prop" && rest.do !== "carry")) throw new Error(`beat "${b.name ?? bi}": item needs who + do, do: "prop", fx, sfx, caption or macro: ${JSON.stringify(g)}`);
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
