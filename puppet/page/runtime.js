/* The puppet runtime: draws a storyboard frame with PotatoBrawl's own drawing code.
   puppet/render.mjs evaluates moves.js + this file inside the game's script scope (through a hook it adds to a copy of the
   game's built page), so drawBackground, drawStage, drawShadow, drawFighter, cam, L, DPR and FIG are the game's own.
   Nothing here writes game state the game would read: the game's loop never runs (requestAnimationFrame is stubbed).
   Every frame is a pure function of t: no wall clock, and Math.random is reseeded per frame. */

const OW = 1080, OH = 1920;
const SAFE = { x0: 60, y0: 210, x1: 920, y1: 1360 };
const CAPS = { main: { font: '900 74px "PupBlack"', size: 74, stroke: 14 }, sub: { font: '800 60px "PupBold"', size: 60, stroke: 12 } };
let SB = null, OPT = {}, out = null, oc = null, sil = null, sc = null, ACT = [], CAMS = [];

function mulberry(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const EASE = { linear: (x) => x, in: (x) => x * x, out: (x) => 1 - (1 - x) * (1 - x), inout: sm, snap: (x) => 1 - Math.pow(1 - x, 4) };

/* ---------- setup ---------- */
async function init(d) {
  SB = d.sb; OPT = d.opts || {};
  for (const [fam, b64] of Object.entries(d.fonts || {})) {
    const ff = new FontFace(fam, Uint8Array.from(atob(b64), (ch) => ch.charCodeAt(0)));
    document.fonts.add(await ff.load());
  }
  out = document.createElement("canvas"); out.width = OW; out.height = OH;
  out.style.cssText = "position:fixed;left:0;top:0;z-index:2147483647;width:1080px;height:1920px";
  document.body.appendChild(out); oc = out.getContext("2d");
  sil = document.createElement("canvas"); sil.width = OW / 4; sil.height = OH / 4; sc = sil.getContext("2d", { willReadFrequently: true });
  const mapIx = BL.MAPS.findIndex((m) => m.id === (SB.map || "kitchen"));
  if (mapIx < 0) throw new Error(`unknown map "${SB.map}" (maps: ${BL.MAPS.map((m) => m.id).join(", ")})`);
  ACT = SB.cast.map((c, i) => makeActor(c, i));
  BL.useStage({ map: mapIx });   // after the actors: BL.newGame points STAGE at its own map
  CAMS = camSegments(SB.camera || [{ at: 0, x: 0, y: -75, z: 4 }]);
  propSegments();
  return { map: BL.STAGE.id, cast: ACT.map((a) => `${a.id}=${a.f.spec.id}`) };
}

const POS_ACTS = { walk: 1, slide: 1, fly: 1, climb: 1, drop: 1 };
function makeActor(c, i) {
  const spec = FIG[c.fighter];
  if (!spec) throw new Error(`unknown fighter "${c.fighter}" (fighters: ${Object.keys(FIG).join(", ")})`);
  const pal = spec.palettes[c.skin || 0] || spec.palettes[0];
  const f = BL.newGame({ seed: 1, players: [{ spec, pal }, { spec, pal }], countdown: 1 }).fighters[0];
  Object.assign(f, { slot: i, x: c.x || 0, y: c.y || 0, facing: c.facing || 1, state: "fin", st: 0, grounded: true, move: null, mid: null, mt: 0, flash: 0, armorFlash: 0, invuln: 0, hitstun: 0, vy: 0, finRole: "w" });
  const acts = (SB.actions || []).filter((a) => a.who === c.id).sort((p, q) => p.at - q.at);
  const A = {
    id: c.id, c, f, costume: spec.look.costume,
    // a walk also moves the legs (style: "tiptoe" for tiptoe legs); fly, climb and drop only move the fighter
    body: acts.filter((a) => MOVES[a.do] || a.do === "hold" || a.do === "walk").map((a) => ({ ...a, move: a.do === "walk" ? a.style || "walk" : a.do })),
    adds: acts.filter((a) => ADDS[a.do]),
    faces: acts.filter((a) => a.do === "face"),
    moves: acts.filter((a) => POS_ACTS[a.do]),   // + the end of each carry (added below)
    turns: acts.filter((a) => a.do === "turn"),
    carried: (SB.actions || []).filter((a) => a.do === "carry" && a.target === c.id),
    mouth: (OPT.mouth || {})[c.id] || null,
  };
  for (const a of A.body.concat(A.adds, A.moves, A.carried)) if (a.dur == null) throw new Error(`${c.id}: "${a.do}" at ${a.at}s needs a dur`);
  // when a carry ends the fighter is left where it hung (a drop or a walk then starts from there)
  for (const a of A.carried) A.moves.push({ do: "uncarry", at: a.at + a.dur, dur: 0, carry: a });
  A.moves.sort((p, q) => p.at - q.at);
  return A;
}

/* ---------- time -> pose ---------- */
const beatAt = (t) => { const m = SB.music || {}; return ((t - (m.offset || 0)) * (m.bpm || 120)) / 60; };
const sizeOf = (A) => { const s = A.f.s, L_ = A.f.spec.look; return { w: s.w, leg: s.h * L_.leg, tor: s.h * L_.torso }; };

function evalMove(A, a, t, table) {
  const d = a.dur, u = Math.max(0, Math.min(d, t - a.at));
  const x = { ...a, u, d, k: d > 0 ? u / d : 1, beat: beatAt(t) * (a.speed || 1), amp: a.amp ?? 1, sk: sizeOf(A) };
  return table[a.move || a.do](x) || {};
}
function mixPose(p, q, k) {
  const o = {};
  for (const key of new Set([...Object.keys(p), ...Object.keys(q)])) {
    const a = p[key], b = q[key];
    if (a === undefined) o[key] = b; else if (b === undefined) o[key] = a;
    else if (Array.isArray(a)) o[key] = lerpP(a, b, k); else o[key] = a + (b - a) * k;
  }
  return o;
}
const carryAt = (A, t) => A.carried.find((a) => t >= a.at && t < a.at + a.dur) || null;
function bodyAt(A, t, depth = 0) {
  const rest = restPose(sizeOf(A), A.costume);
  let cur = null, last = null;
  for (const a of A.body) { if (a.at <= t && t < a.at + a.dur) cur = a; if (a.at + a.dur <= t) last = a; }
  // being carried: hang from the hand unless the storyboard gives the body something else to do
  if (!cur) { const cr = carryAt(A, t); if (cr) cur = { at: cr.at, dur: cr.dur, move: "dangle", blend: 0.15 }; }
  if (cur) {
    // a "hold" keeps whatever the body was doing when it started
    const p = cur.move === "hold" ? (depth < 8 ? bodyAt(A, cur.at - 1e-3, depth + 1) : rest) : { ...rest, ...evalMove(A, cur, t, MOVES) };
    const bl = cur.blend ?? (MOVE_BLEND[cur.move] || [0.12])[0];
    if (t - cur.at < bl && depth < 8) return mixPose(bodyAt(A, cur.at - 1e-3, depth + 1), p, sm((t - cur.at) / bl));
    return p;
  }
  if (last && depth < 8) {
    const end = last.at + last.dur, bl = last.release ?? (MOVE_BLEND[last.move] || [0, 0.18])[1];
    if (t - end < bl) return mixPose(bodyAt(A, end - 1e-3, depth + 1), rest, sm((t - end) / bl));
  }
  return rest;
}
function poseAt(A, t) {
  const p = bodyAt(A, t);
  for (const a of A.adds) {
    if (t < a.at || t >= a.at + a.dur) continue;
    const q = evalMove(A, a, t, ADDS);
    for (const k of ["hop", "spin", "dx", "lean", "crouch", "wingUp"]) if (q[k]) p[k] = (p[k] || 0) + q[k];
  }
  return p;
}
function faceAt(A, t) {
  let cur = null;
  for (const a of A.faces) if (a.at <= t && (a.dur == null || t < a.at + a.dur)) cur = a;
  return cur ? { expr: cur.expr || "", exK: sm((t - cur.at) / (cur.ease ?? 0.12)) } : { expr: A.c.expr || "", exK: 1 };
}
// where the fighter stands (x, y; y up is negative) and whether it is in the air.
//   walk / slide: x by `to` (a stage x) or `by` (a distance); fly: `to` and/or `y`, wings flapping;
//   climb: up onto something `y` high (negative) with a small hop; drop: straight down to `y` (default 0), falling like a stone
function posAt(A, t) {
  let x = A.c.x || 0, y = A.c.y || 0, air = y < 0 && !A.c.perched, perch = !!A.c.perched;
  for (const a of A.moves) {
    if (t < a.at) break;
    if (a.do === "uncarry") { const W = placeAt(A, a.at - 1e-4); x = W.x; y = W.y + (W.p.lift || 0); air = true; continue; }
    const x0 = x, y0 = y;
    x = a.to ?? x0 + (a.by || 0);
    y = a.do === "drop" ? a.y ?? 0 : a.y ?? y0;
    const ease = EASE[a.ease || { walk: "linear", slide: "inout", fly: "inout", climb: "inout", drop: "in" }[a.do]];
    if (a.do === "fly") air = true;
    if (a.do === "climb" || a.do === "drop" || a.do === "walk") air = false;
    if (t < a.at + a.dur) {
      const q = (a.at + a.dur - a.at) > 0 ? clamp01((t - a.at) / a.dur) : 1, e = ease(q);
      const arc = a.do === "climb" ? Math.sin(Math.PI * q) * (a.arc ?? 10) : a.arc ? Math.sin(Math.PI * q) * a.arc : 0;
      return { x: x0 + (x - x0) * e, y: y0 + (y - y0) * e - arc, air: a.do === "fly" || a.do === "drop" || (a.do === "climb" && q < 1) };
    }
  }
  return { x, y, air: air && y < -1 };
}
function facingAt(A, t) {
  let f = A.c.facing || 1;
  for (const a of A.turns) if (a.at <= t) f = a.to === "right" ? 1 : a.to === "left" ? -1 : -f;
  return f;
}
function mouthAt(A, t) {
  if (!A.mouth) return 0;
  const i = Math.round(t * (SB.fps || 30));
  return A.mouth[Math.max(0, Math.min(A.mouth.length - 1, i))] || 0;
}
// a point in the fighter's own units -> the world, the way drawPotato places it (hop, spin about the middle, facing)
function toWorld(W, pt) {
  const h = W.A.f.s.h, q = W.p.spin ? rot(pt, [0, -h * 0.5], W.p.spin) : pt;
  return [W.x + W.facing * q[0], W.y - (W.p.hop || 0) + q[1]];
}
// everything about where an actor is at t, without touching the game objects (props and carried actors read it too)
function placeAt(A, t, depth = 0) {
  const p = poseAt(A, t), pos = posAt(A, t), facing = facingAt(A, t);
  let x = pos.x + (p.dx || 0) * facing, y = pos.y - (p.lift || 0), air = pos.air;
  const cr = carryAt(A, t);
  if (cr && depth < 4) {
    // hang below the carrier's hand, by our own raised front hand
    const C = ACT.find((o) => o.id === cr.who), W = placeAt(C, t, depth + 1), hand = toWorld(W, W.p[cr.hand === "F" ? "hF" : "hB"]);
    x = hand[0] - facing * p.hF[0]; y = hand[1] - p.hF[1] + (p.hop || 0); air = true;
  }
  return { A, p, x, y, facing, air };
}
const handOf = (W, which) => (which === "both" ? lerpP(toWorld(W, W.p.hF), toWorld(W, W.p.hB), 0.5) : toWorld(W, W.p[which === "B" ? "hB" : "hF"]));

// put the actor into the state the game's pose() reads: a "fin" stand-in whose finPose hook returns our pose
function stage(A, t) {
  const W = placeAt(A, t), p = W.p, fc = faceAt(A, t), m = mouthAt(A, t), f = A.f;
  f.x = W.x; f.y = W.y; f.facing = W.facing; f.grounded = !W.air; f.vy = 0;
  const talking = m > 0.05;
  f.finPose = (P) => {
    P.lean = p.lean || 0; P.crouch = clamp01(p.crouch || 0); P.spin = p.spin || 0; P.hop = p.hop || 0; P.wingUp = p.wingUp || 0;
    // a talking face shows the open mouth; only rage has its own talking mouth
    const ex = talking && fc.expr !== "rage" ? "" : fc.expr;
    if (ex) { P.expr = ex; P.exK = fc.exK; }
    P.mouth = ex === "rage" ? m : m > 0.3 ? 1 : 0;
    return { hF: p.hF, hB: p.hB, fF: p.fF, fB: p.fB };
  };
  return W;
}

/* ---------- props ---------- */
// SB.props: [{ id, kind, x, y, layer: "back" | "front", ...state }]. Actions on a prop:
//   { do: "prop", id, at, dur, ease, set: { x, y, rot, scale, split, glow, lid, fill, time, alpha, ... } }   numbers tween, the rest switch
//   { who, do: "grab", prop, at, hand: "F" | "B" | "both", off: [dx, dy] }   from then on it sits in that hand
//   { who, do: "release", prop, at, to: [x, y], dur }   it stays where the hand let go, or moves to `to` (put down, thrown)
let PSEG = {};
function propSegments() {
  PSEG = {};
  for (const pr of SB.props || []) {
    const evs = (SB.actions || []).filter((a) => (a.do === "prop" && (a.id || a.who) === pr.id) || ((a.do === "grab" || a.do === "release") && a.prop === pr.id)).sort((p, q) => p.at - q.at);
    PSEG[pr.id] = { def: pr, evs };
  }
}
function propAt(id, t) {
  const S = PSEG[id], s = { ...S.def };
  let held = null;
  for (const e of S.evs) {
    if (e.at > t) break;
    if (e.do === "grab") { held = e; continue; }
    if (e.do === "release") {
      held = null;
      const W = placeAt(ACT.find((a) => a.id === e.who), e.at), g = PSEG[id].evs.filter((x) => x.do === "grab" && x.at <= e.at).pop();
      const hp = handOf(W, g ? g.hand || "F" : "F"), off = (g && g.off) || [0, 2];
      s.x = hp[0] + off[0] * W.facing; s.y = hp[1] + off[1]; s.flip = W.facing < 0;
      if (e.to) { const q = (EASE[e.ease || "inout"])(clamp01((t - e.at) / (e.dur || 0.3))), arc = Math.sin(Math.PI * q) * (e.arc || 0); s.x += (e.to[0] - s.x) * q; s.y += (e.to[1] - s.y) * q - arc; }
      continue;
    }
    // a tween: from the value at its start (everything before it, at that moment) to its set
    const q = (EASE[e.ease || "inout"])(e.dur ? clamp01((t - e.at) / e.dur) : 1), from = e.dur ? propAt(id, e.at - 1e-4) : s;
    for (const [k, v] of Object.entries(e.set || {})) s[k] = typeof v === "number" && typeof from[k] === "number" ? from[k] + (v - from[k]) * q : v;
  }
  if (held) {
    const W = placeAt(ACT.find((a) => a.id === held.who), t), hp = handOf(W, held.hand || "F"), off = held.off || [0, 2];
    s.x = hp[0] + off[0] * W.facing; s.y = hp[1] + off[1]; s.flip = W.facing < 0; s.held = held;
  }
  return s;
}
function drawProps(c, t, layer, onlyHeldBy, hand) {
  for (const pr of SB.props || []) {
    const s = propAt(pr.id, t);
    if (onlyHeldBy) { if (!s.held || s.held.who !== onlyHeldBy || (s.held.hand === "B") !== (hand === "B")) continue; }
    else if (s.held || (s.layer || "back") !== layer) continue;
    drawProp(c, pr.kind, s, t);
  }
}

/* ---------- camera ---------- */
function camSegments(keys) {
  const segs = [], k0 = { x: 0, y: -75, z: 4, ...keys[0] };
  segs.push({ at: k0.at || 0, dur: 0, from: k0, to: k0, ease: "linear" });
  for (const k of keys.slice(1)) {
    const from = camVal(segs[segs.length - 1], k.at);
    segs.push({ at: k.at, dur: k.dur || 0, from, to: { ...from, ...k }, ease: k.ease || "inout" });
  }
  return segs;
}
function camVal(s, t) {
  const q = s.dur > 0 ? (EASE[s.ease] || sm)(clamp01((t - s.at) / s.dur)) : 1;
  return { x: s.from.x + (s.to.x - s.from.x) * q, y: s.from.y + (s.to.y - s.from.y) * q, z: s.from.z + (s.to.z - s.from.z) * q };
}
function camAt(t) {
  let s = CAMS[0];
  for (const x of CAMS) if (x.at <= t) s = x;
  const v = camVal(s, t);
  let sx = 0, sy = 0;
  for (const f of SB.fx || []) if (f.do === "shake" && t >= f.at && t < f.at + (f.dur ?? 0.3)) {
    const k = 1 - (t - f.at) / (f.dur ?? 0.3), a = (f.amp ?? 10) * k;
    sx += Math.sin(t * 91) * a; sy += Math.cos(t * 77) * a;
  }
  return { ...v, sx, sy };
}
const toPx = (C, wx, wy) => [OW / 2 + (wx - C.x) * C.z + C.sx, OH / 2 + (wy - C.y) * C.z + C.sy];

/* ---------- captions ---------- */
function capLayout(c) {
  const st = CAPS[c.style === "sub" ? "sub" : "main"], pos = c.pos ?? "top";
  const top = typeof pos === "number" ? pos : { top: 250, mid: 860, low: 1150 }[pos] ?? 250;
  const cx = (SAFE.x0 + SAFE.x1) / 2, maxW = SAFE.x1 - SAFE.x0 - st.stroke - 16;
  oc.font = st.font;
  const words = String(c.text).split(/\s+/), lines = []; let line = "";
  for (const w of words) { const test = line ? line + " " + w : w; if (oc.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test; }
  if (line) lines.push(line);
  const lh = st.size * 1.12, w = Math.max(...lines.map((ln) => oc.measureText(ln).width)) + st.stroke;
  return { st, top, cx, lines, lh, box: [Math.round(cx - w / 2), Math.round(top - st.stroke / 2), Math.round(w), Math.round(lines.length * lh + st.stroke)] };
}
const capsAt = (t) => (SB.captions || []).filter((c) => t >= c.at && t < c.end);
function drawCaption(c, t) {
  const L0 = capLayout(c), { st, top, cx, lines, lh } = L0, cy = top + (lines.length * lh) / 2;
  const k = clamp01((t - c.at) / 0.12), s = c.pop === false ? 1 : 0.86 + 0.14 * EASE.snap(k);
  oc.save(); oc.font = st.font; oc.textAlign = "center"; oc.textBaseline = "middle"; oc.lineJoin = "round"; oc.miterLimit = 2;
  oc.translate(cx, cy); oc.scale(s, s); oc.translate(-cx, -cy);
  lines.forEach((ln, i) => {
    const y = top + lh * (i + 0.5);
    oc.lineWidth = st.stroke; oc.strokeStyle = "#111"; oc.strokeText(ln, cx, y);
    oc.fillStyle = c.color || "#fff"; oc.fillText(ln, cx, y);
  });
  oc.restore();
}

/* ---------- effects ---------- */
function fxWorld(c, C, t) {
  (SB.fx || []).forEach((f, i) => {
    if (t < f.at || t >= f.at + (f.dur ?? 0.6)) return;
    const k = (t - f.at) / (f.dur ?? 0.6), A = f.who ? ACT.find((a) => a.id === f.who) : null;
    const pr = f.prop ? propAt(f.prop, t) : null;
    const ax = A ? A.f.x : pr ? pr.x : f.x || 0, ay = A ? A.f.y - A.f.s.h * 1.25 : pr ? pr.y + (f.dy ?? -10) : f.y ?? -80;
    if (f.do === "notes") {   // music notes drifting up from the head
      const r = mulberry(4100 + i * 37), n = f.count ?? 5;
      c.save(); c.font = '700 22px "DejaVu Sans", sans-serif'; c.textAlign = "center";
      for (let j = 0; j < n; j++) {
        const t0 = r() * 0.6, q = (k * (f.dur ?? 0.6) - t0 * (f.dur ?? 0.6)) / ((f.dur ?? 0.6) * 0.5);
        if (q < 0 || q > 1) continue;
        const x = ax + (r() - 0.5) * 40 + Math.sin(q * 6 + j) * 6, y = ay - q * 60;
        c.globalAlpha = Math.min(1, q * 5, (1 - q) * 3); c.lineWidth = 3; c.strokeStyle = "#1a1210"; c.fillStyle = f.color || "#ffe14a";
        const g = j % 2 ? "♪" : "♫"; c.strokeText(g, x, y); c.fillText(g, x, y);
      }
      c.restore();
    } else if (f.do === "sparkle") {   // four-point stars popping around the actor
      const r = mulberry(5200 + i * 53), n = f.count ?? 7;
      for (let j = 0; j < n; j++) {
        const t0 = r() * 0.5, q = (k - t0) / 0.5, x = ax + (r() - 0.5) * 70, y = ay + 20 + (r() - 0.5) * 60;
        if (q < 0 || q > 1) continue;
        star4(c, x, y, 7 * Math.sin(Math.PI * q) * (f.size ?? 1), f.color || "#fff6c8");
      }
    } else if (f.do === "drops") {   // a spill or a splash: drops thrown out and falling (from a prop or a point)
      const r = mulberry(6300 + i * 71), n = f.count ?? 9, el = t - f.at, col = f.color || "#9a5a2a", floor = f.floor ?? 0;
      for (let j = 0; j < n; j++) {
        const t0 = r() * 0.25, vx = (r() - 0.5) * (f.spread ?? 50) + (f.vx ?? 0), vy = -(20 + r() * 40), tt = el - t0;
        if (tt < 0) continue;
        const x = ax + vx * tt, y = Math.min(floor, ay + vy * tt + 160 * tt * tt), sz = 1.6 + r() * 1.6;
        c.fillStyle = col; c.strokeStyle = OUT; c.lineWidth = 0.8;
        c.beginPath(); if (y >= floor) c.ellipse(x, floor - 0.6, sz * 1.8, sz * 0.5, 0, 0, Math.PI * 2); else c.arc(x, y, sz, 0, Math.PI * 2); c.fill(); c.stroke();
      }
    } else if (f.do === "pop") {   // a burst ring (a lid popping, a split): short white strokes flying out
      const n = f.count ?? 10, e = sm(k), R0 = 6 + 26 * e;
      c.save(); c.strokeStyle = f.color || "#fff6c8"; c.lineCap = "round"; c.lineWidth = 2.2 * (1 - k) + 0.4; c.globalAlpha = 1 - k * 0.8;
      c.beginPath(); for (let j = 0; j < n; j++) { const a = (j / n) * Math.PI * 2 + 0.3; c.moveTo(ax + Math.cos(a) * R0, ay + Math.sin(a) * R0); c.lineTo(ax + Math.cos(a) * (R0 + 8), ay + Math.sin(a) * (R0 + 8)); } c.stroke();
      c.restore();
    }
  });
}
function fxScreen(t) {
  (SB.fx || []).forEach((f, i) => {
    const dur = f.dur ?? 0.6;
    if (t < f.at || t >= f.at + dur) return;
    const k = (t - f.at) / dur;
    if (f.do === "lines") {   // manga focus lines; the pattern redraws 15 times a second like drawn frames
      const r = mulberry(9001 + i * 131 + Math.floor(t * 15) * 7), C = camAt(t), A = f.who ? ACT.find((a) => a.id === f.who) : null;
      const [cx, cy] = A ? toPx(C, A.f.x, A.f.y - A.f.s.h * 0.6) : f.center || [540, 900], n = f.count ?? 110;
      oc.save(); oc.globalAlpha = Math.min(1, k * 8, (1 - k) * 8) * (f.alpha ?? 0.8); oc.fillStyle = f.color || "#1a1210";
      for (let j = 0; j < n; j++) {
        const a = ((j + r() * 0.9) / n) * Math.PI * 2, inner = (f.inner ?? 380) + r() * 300, w = 0.003 + r() * 0.011, R = 2200;
        oc.beginPath(); oc.moveTo(cx + Math.cos(a - w) * R, cy + Math.sin(a - w) * R); oc.lineTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner); oc.lineTo(cx + Math.cos(a + w) * R, cy + Math.sin(a + w) * R); oc.closePath(); oc.fill();
      }
      oc.restore();
    } else if (f.do === "flash") {   // never a fully white frame: peaks at 0.85
      oc.save(); oc.globalAlpha = Math.min(0.85, (f.peak ?? 0.8) * (1 - k)); oc.fillStyle = f.color || "#fff"; oc.fillRect(0, 0, OW, OH); oc.restore();
    } else if (f.do === "spot") {   // the room dims except a circle on one actor
      const C = camAt(t), A = ACT.find((a) => a.id === f.who), [cx, cy] = A ? toPx(C, A.f.x, A.f.y - A.f.s.h * 0.55) : [540, 960];
      const e = Math.min(1, k * dur / 0.15, (1 - k) * dur / 0.15), R = (f.r ?? 70) * C.z;
      oc.save(); oc.globalAlpha = (f.alpha ?? 0.6) * e; oc.fillStyle = "#06060c"; oc.beginPath(); oc.rect(0, 0, OW, OH); oc.arc(cx, cy, R, 0, Math.PI * 2, true); oc.fill("evenodd"); oc.restore();
    }
  });
}

/* ---------- a frame ---------- */
function setView(C) { L.gw = OW; L.gh = OH; DPR = 1; cam.x = C.x; cam.y = C.y; cam.z = C.z; cam.sx = C.sx; cam.sy = C.sy; }
function drawActors(c, t, onlyShape) {
  const order = ACT.map((A, i) => ({ A, z: A.c.z ?? i })).sort((p, q) => p.z - q.z).map((o) => o.A);
  for (const A of order) stage(A, t);
  if (!onlyShape) for (const A of order) drawShadow(c, A.f);
  for (const A of order) {
    // a prop in the back hand goes behind the body, one in the front hand (or both) in front of it
    if (!onlyShape) drawProps(c, t, null, A.id, "B");
    drawFighter(c, A.f, Math.round(t * 60));
    if (!onlyShape) drawProps(c, t, null, A.id, "F");
  }
}
function frame(t) {
  const rnd = mulberry(Math.round(t * 1000) + 7), realRandom = Math.random;
  Math.random = rnd;
  try {
    const C = camAt(t), tk = Math.round(t * 60);
    setView(C);
    oc.setTransform(1, 0, 0, 1, 0, 0); oc.globalAlpha = 1; oc.clearRect(0, 0, OW, OH);
    oc.save(); oc.beginPath(); oc.rect(0, 0, OW, OH); oc.clip();
    drawBackground(oc, tk);
    const ox = OW / 2 - C.x * C.z + C.sx, oy = OH / 2 - C.y * C.z + C.sy;
    oc.setTransform(C.z, 0, 0, C.z, ox, oy);
    drawStage(oc, tk);
    drawProps(oc, t, "back");
    drawActors(oc, t);
    drawProps(oc, t, "front");
    fxWorld(oc, C, t);
    oc.setTransform(1, 0, 0, 1, 0, 0);
    oc.restore();
    fxScreen(t);
    for (const c of capsAt(t)) drawCaption(c, t);
    if (OPT.safe) { oc.save(); oc.setLineDash([18, 12]); oc.lineWidth = 4; oc.strokeStyle = "#ff2bd6"; oc.strokeRect(SAFE.x0, SAFE.y0, SAFE.x1 - SAFE.x0, SAFE.y1 - SAFE.y0); oc.restore(); }
  } finally { Math.random = realRandom; }
}
function capture(fmt) { return out.toDataURL(fmt === "png" ? "image/png" : "image/jpeg", 0.95); }

// caption boxes (with the share hidden behind a fighter, from a quarter-size silhouette) and fighter boxes, output pixels
function layout(t) {
  const rnd = mulberry(Math.round(t * 1000) + 7), realRandom = Math.random;
  Math.random = rnd;
  try {
    const C = camAt(t); setView(C);
    sc.setTransform(1, 0, 0, 1, 0, 0); sc.clearRect(0, 0, sil.width, sil.height);
    sc.setTransform(C.z / 4, 0, 0, C.z / 4, (OW / 2 - C.x * C.z + C.sx) / 4, (OH / 2 - C.y * C.z + C.sy) / 4);
    drawActors(sc, t, true);
    const px = sc.getImageData(0, 0, sil.width, sil.height).data;
    const captions = capsAt(t).map((c) => {
      const box = capLayout(c).box;
      let n = 0, hit = 0;
      for (let y = Math.max(0, Math.floor(box[1] / 4)); y < Math.min(sil.height, Math.ceil((box[1] + box[3]) / 4)); y++)
        for (let x = Math.max(0, Math.floor(box[0] / 4)); x < Math.min(sil.width, Math.ceil((box[0] + box[2]) / 4)); x++) { n++; if (px[(y * sil.width + x) * 4 + 3] > 40) hit++; }
      return { box, covered: n ? +(hit / n).toFixed(3) : 0 };
    });
    const actors = ACT.map((A) => {
      // the fighter's ink box from the silhouette pass would need one pass per fighter; a generous box from its size is enough here
      const W = placeAt(A, t), h = A.f.s.h, w = A.f.s.w, [x0, y0] = toPx(C, W.x - w * 1.25, W.y - (h * 1.55 + (W.p.hop || 0))), [x1, y1] = toPx(C, W.x + w * 1.25, W.y + 4);
      return { id: A.id, box: [Math.round(x0), Math.round(y0), Math.round(x1 - x0), Math.round(y1 - y0)] };
    });
    return { t, captions, actors };
  } finally { Math.random = realRandom; }
}

// render.mjs wraps moves.js + this file in one function and calls it: this is what it hands back
return { init, frame, capture, layout };
