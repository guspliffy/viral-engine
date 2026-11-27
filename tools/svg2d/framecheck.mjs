// Continuity + framing check for code-drawn clips (tools/svg2d scene modules), before a human or Sol looks.
//   node tools/svg2d/framecheck.mjs <scene.mjs> [--fps 10]
// No browser, no rendering: it imports the scene and samples its probe(t) at --fps (default 10) over [0, DUR).
// A scene opts in by exporting probe(t), a pure function of t returning plain data (screen px, 1080x1920 frame):
//   { shot: "<id, changes at each cut>", faces: [{ id, x, y, r }], props: [{ id, x, y, holder: "kid.handL" | "world" | "air" | ..., state?: { fingers } }],
//     caption: { x0, y0, x1, y1 } | null, captionLine: "<line id>" | null }
// holder "world" = resting on something, "air" = in free flight (thrown, falling: may move fast). A face wholly outside
// the frame is a character out of shot, not a framing fault, so it is not reported.
// Optional export LINES = [{ id, t0, t1 }] (when each line is spoken) turns on CAPTION_CARRY.
// Prints one line per finding (time range, FAIL/WARN, kind, detail), then a summary; exit 1 on any FAIL.
// Checks: FACE_EDGE, CAPTION_FACE, PROP_JUMP, COUNT_BACK, CAPTION_CARRY (fail); HOLDER_SWITCH (warn). Thresholds below.
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export const FRAME_W = 1080, FRAME_H = 1920;
export const FACE_EDGE_FRAC = 0.15;        // FACE_EDGE: share of a face circle's area outside the frame
export const CAPTION_FACE_PAD = 0;         // CAPTION_FACE: px the caption box may come into a face circle
export const PROP_JUMP_FRAC = 0.08;        // PROP_JUMP: move between two samples in one shot, holder unchanged (x frame height)
export const COUNT_EPS = 0.01;             // COUNT_BACK: fingers may not drop below their running max by more than this
export const WORLD = "world", AIR = "air"; // HOLDER_SWITCH: holders that legitimately sit between two hands; AIR skips PROP_JUMP

// share of a circle's area outside the frame (grid sampling, 24 x 24 cells over the bounding square)
function outsideFrac(f, w, h) {
  const N = 24; let inC = 0, out = 0;
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    const dx = ((i + 0.5) / N * 2 - 1) * f.r, dy = ((j + 0.5) / N * 2 - 1) * f.r;
    if (dx * dx + dy * dy > f.r * f.r) continue;
    inC++; const x = f.x + dx, y = f.y + dy;
    if (x < 0 || x > w || y < 0 || y > h) out++;
  }
  return inC ? out / inC : 0;
}
// how far (px) a box reaches into a circle (<= 0: no overlap)
function boxIntoCircle(b, f) {
  const cx = Math.max(b.x0, Math.min(f.x, b.x1)), cy = Math.max(b.y0, Math.min(f.y, b.y1));
  return f.r - Math.hypot(f.x - cx, f.y - cy);
}

// S = the scene module (needs DUR and probe). Returns { findings: [{ t0, t1, level, kind, id, msg }], samples, skipped: [] }
export function checkScene(S, { fps = 10 } = {}) {
  const W = S.W || FRAME_W, H = S.H || FRAME_H, N = Math.max(1, Math.floor(S.DUR * fps - 1e-9) + 1);
  const smp = [];
  for (let i = 0; i < N; i++) { const t = i / fps; if (t < S.DUR) smp.push({ t, ...S.probe(t) }); }
  const found = [], skipped = [], tt = (t) => +t.toFixed(2);
  // runs: one finding per contiguous stretch of samples with the same key
  const open = new Map();
  const hit = (key, s, level, kind, id, msg) => {
    const r = open.get(key);
    if (r && r.last === s.i - 1) { r.last = s.i; r.f.t1 = tt(s.t); r.f.worst = Math.max(r.f.worst, msg.v); r.f.msg = msg.fmt(r.f.worst); return; }
    const f = { t0: tt(s.t), t1: tt(s.t), level, kind, id, shot: s.shot, worst: msg.v, msg: msg.fmt(msg.v) };
    found.push(f); open.set(key, { last: s.i, f });
  };
  smp.forEach((s, i) => { s.i = i; s.faces ||= []; s.props ||= []; });
  // shot start times (each contiguous run of one shot id)
  let shotStart = 0;
  for (const s of smp) { if (s.i === 0 || s.shot !== smp[s.i - 1].shot) shotStart = s.t; s.shotStart = shotStart; }

  for (const s of smp) {
    for (const f of s.faces) {
      const o = outsideFrac(f, W, H);
      if (o > FACE_EDGE_FRAC && o < 1) hit(`edge:${f.id}`, s, "FAIL", "FACE_EDGE", f.id, { v: o, fmt: (v) => `${f.id} face up to ${Math.round(v * 100)}% outside the frame` });
      if (s.caption) {
        const d = boxIntoCircle(s.caption, f);
        if (d > CAPTION_FACE_PAD) hit(`cap:${f.id}`, s, "FAIL", "CAPTION_FACE", f.id, { v: d, fmt: (v) => `caption ${s.captionLine ?? ""} over ${f.id}'s face (up to ${Math.round(v)} px in)` });
      }
    }
  }
  // props, per id, sample to sample
  const ids = [...new Set(smp.flatMap((s) => s.props.map((p) => p.id)))];
  for (const id of ids) {
    let prev = null, prevS = null, maxF = -Infinity, lastHand = null, worldSince = false, cutSince = false;
    for (const s of smp) {
      const p = s.props.find((q) => q.id === id) || null;
      const sameShot = prevS && prevS.shot === s.shot;
      if (prevS && !sameShot) cutSince = true;
      if (sameShot && !!p !== !!prev) {
        const m = p ? `${id} appears mid-shot (in ${p.holder} at ${Math.round(p.x)},${Math.round(p.y)})` : `${id} disappears mid-shot (was in ${prev.holder})`;
        found.push({ t0: tt(prevS.t), t1: tt(s.t), level: "FAIL", kind: "PROP_JUMP", id, shot: s.shot, msg: m });
      }
      if (sameShot && p && prev && p.holder === prev.holder && p.holder !== AIR) {
        const d = Math.hypot(p.x - prev.x, p.y - prev.y);
        if (d > PROP_JUMP_FRAC * H) found.push({ t0: tt(prevS.t), t1: tt(s.t), level: "FAIL", kind: "PROP_JUMP", id, shot: s.shot, msg: `${id} jumps ${Math.round(d)} px in ${p.holder} within one shot` });
      }
      if (p) {
        if (p.holder === WORLD || p.holder === AIR) worldSince = true;
        else {
          if (lastHand && p.holder !== lastHand.holder && !worldSince && cutSince)
            found.push({ t0: lastHand.t, t1: tt(s.t), level: "WARN", kind: "HOLDER_SWITCH", id, shot: s.shot, msg: `${id} goes from ${lastHand.holder} to ${p.holder} across a cut, never put down` });
          lastHand = { holder: p.holder, t: tt(s.t) }; worldSince = false; cutSince = false;
        }
        const fg = p.state?.fingers;
        if (typeof fg === "number") {
          if (fg < maxF - COUNT_EPS) hit(`count:${id}`, s, "FAIL", "COUNT_BACK", id, { v: maxF - fg, fmt: () => `${id} fingers ${+fg.toFixed(2)} after ${+maxF.toFixed(2)}` });
          maxF = Math.max(maxF, fg);
        }
      }
      prev = p; prevS = s;
    }
  }
  // captions carried into a shot that began after their line ended
  const LINES = S.LINES ? Object.fromEntries((Array.isArray(S.LINES) ? S.LINES : Object.entries(S.LINES).map(([id, v]) => ({ id, ...v }))).map((l) => [l.id, l])) : null;
  if (!LINES) skipped.push("CAPTION_CARRY (the scene exports no LINES)");
  else for (const s of smp) {
    const l = s.caption && s.captionLine != null ? LINES[s.captionLine] : null;
    if (l && s.shotStart >= l.t1) hit(`carry:${l.id}:${s.shot}`, s, "FAIL", "CAPTION_CARRY", l.id, { v: 0, fmt: () => `caption of ${l.id} (ended ${tt(l.t1)} s) still up in shot ${s.shot} (began ${tt(s.shotStart)} s)` });
  }
  found.sort((a, b) => a.t0 - b.t0 || a.kind.localeCompare(b.kind));
  return { findings: found.map(({ worst, ...f }) => f), samples: smp.length, skipped };
}

export function report({ findings, samples, skipped }, name = "scene") {
  const lines = findings.map((f) => `${f.t0.toFixed(2).padStart(6)}-${f.t1.toFixed(2).padEnd(6)} ${f.level.padEnd(4)} ${f.kind.padEnd(13)} ${f.msg}  [shot ${f.shot}]`);
  for (const k of skipped) lines.push(`  note: skipped ${k}`);
  const nf = findings.filter((f) => f.level === "FAIL").length, nw = findings.length - nf;
  lines.push(`framecheck ${name}: ${samples} samples, ${nf} FAIL, ${nw} WARN -> ${nf ? "FAIL" : "PASS"}`);
  return { text: lines.join("\n"), fail: nf > 0 };
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  const args = process.argv.slice(2), scene = args.find((a) => !a.startsWith("--") && args[args.indexOf(a) - 1] !== "--fps");
  const fi = args.indexOf("--fps"), fps = fi >= 0 ? Number(args[fi + 1]) : 10;
  if (!scene) { console.log("usage: node tools/svg2d/framecheck.mjs <scene.mjs> [--fps 10]"); process.exit(2); }
  const S = await import(pathToFileURL(resolve(scene)).href);
  if (typeof S.probe !== "function") { console.log(`framecheck: ${scene} exports no probe(t); nothing checked`); process.exit(2); }
  if (!(S.DUR > 0)) { console.log(`framecheck: ${scene} exports no DUR`); process.exit(2); }
  const r = report(checkScene(S, { fps }), scene);
  console.log(r.text);
  process.exit(r.fail ? 1 : 0);
}
