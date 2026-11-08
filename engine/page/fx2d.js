// The drawn 2D layer (look-2d-layer-01, 7 Nov 2026; opt-in): drawn touches on top of the 3D picture, the way anime
// studios finish a 3D shot. Each one is an ordinary fx item, written by hand or added with "anime2d": true
// (engine/shared/anime2d.js):
//
//   { "do": "dust",  "who" | "pos", "at", "dur": 0.6 }      drawn dust clouds rolling out from the feet (a landing, a skid)
//   { "do": "smear2d", "at": 0, "dur", "min": 42 }          the drawn smear frame: a body moving faster than min px a
//                                                           frame gets a tapered, inked smear of its own colour trailing
//                                                           behind it, the stretched drawing animators put on one or two
//                                                           frames of a fast move (never across a cut)
//   "size" scales a mark, "color" recolours it.
//
// No reaction signs (anger veins, sweat drops, shock lines, gloom, impact stars): Jonny, 8 Nov 2026, "i dont like these
// extra signs everywhere". They were built and taken out again; feelings stay on the faces.
//
// Hand-drawn, not computer-clean: every stroke tapers, the ink wobbles a little with each drawing (boil, 12 drawings a
// second like a film on 2s) and the shapes come from a seed, so a frame is a function of its time alone (renders,
// shards and the frame cache stay repeatable).

import { rng, clamp, ease } from "./util.js";

const INK = "#1d1620";
export const FX2D = new Set(["dust", "smear2d"]);

// env: { ctx, W, H, fps, body(who, tt?) -> { cx, cy, rx, ry, u, vis, color } | null, cut(t0, t1) -> bool }
export function drawFx2d(env, fx, t) {
  const { ctx } = env;
  const dn = env.drawing ? env.drawing(t) : Math.floor(t * 12 + 1e-4);   // the drawing number: the boil changes with each drawing (12 a second, or the drawn look's own)
  for (let i = 0; i < fx.length; i++) {
    const f = fx[i];
    if (!FX2D.has(f.do)) continue;
    const d = f.dur ?? 1, k = (t - f.at) / d;
    if (k < 0 || k > 1) continue;
    ctx.save();
    try {
      if (f.do === "smear2d") smears(env, f, t, dn);
      else {
        const B = f.who ? env.body(f.who) : null;
        if (f.who && (!B || !B.vis)) continue;
        if (env.debug) { ctx.fillStyle = "#ff0"; ctx.font = "28px sans-serif"; ctx.fillText(`${f.do} ${f.who} k${k.toFixed(2)} ${B ? Math.round(B.cx) + "," + Math.round(B.cy) : "-"}`, 20, 400 + i * 30); }
        if (f.do === "dust" && B && !B.ground) continue;   // dust only rises from the floor, never from a seat
        const r = rng(9173 + i * 131 + dn * 7);   // boil: a new wobble each drawing
        const S = rng(5011 + i * 977);             // shape: the same for the whole mark
        dust(ctx, env, B, f, k, r, S);
      }
    } finally { ctx.restore(); }
  }
}

// a point on another visible character's face (any depth): the eyes and mouth zone of its body ellipse
function inOther(env, who, x, y) {
  for (const o of env.who()) {
    if (o === who) continue;
    const C = env.body(o);
    if (C && C.vis && ((x - C.cx) / (C.rx * 0.8)) ** 2 + ((y - (C.cy - C.ry * 0.15)) / (C.ry * 0.6)) ** 2 < 1) return true;
  }
  return false;
}
const lineW = (u, s = 1) => clamp(u * 0.011 * s, 2.5, 9);
// a stroke that is thin at both ends and full in the middle (a brush or a G-pen), drawn as a filled outline
function taper(ctx, pts, w, color = INK) {
  if (pts.length < 2) return;
  const L = [], R = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], n = Math.hypot(dx, dy) || 1, s = i / (pts.length - 1);
    const ww = (w / 2) * Math.sin(Math.PI * Math.min(1, 0.08 + s * 0.92)) ** 0.7;
    L.push([pts[i][0] - (dy / n) * ww, pts[i][1] + (dx / n) * ww]); R.push([pts[i][0] + (dy / n) * ww, pts[i][1] - (dx / n) * ww]);
  }
  ctx.beginPath(); ctx.moveTo(...L[0]);
  for (const p of L.slice(1)) ctx.lineTo(...p);
  for (const p of R.reverse()) ctx.lineTo(...p);
  ctx.closePath(); ctx.fillStyle = color; ctx.fill();
}

// drawn dust (土煙): cauliflower clouds rolling out to both sides of the feet. Each cloud is a few overlapping lobes; the
// ink is drawn first and the fills over it, so only the cloud's outer outline stays inked (how a dust cloud is
// drawn in a Ghibli film), a lit top and a shaded belly; they swell, drift outward and up, and shrink away
function dust(ctx, env, B, f, k, r, S) {
  const P = f.pos ? env.project(f.pos) : B && { x: B.cx, y: B.feet, u: B.u };
  if (!P) return;
  const u = (f.pos ? P.u : B.u) * (f.size ?? 1), n = f.puffs ?? 6, e = ease("out")(k), lobes = [];
  for (let j = 0; j < n; j++) {
    const side = j % 2 ? 1 : -1, o = Math.floor(j / 2), sp = 0.85 + S() * 0.4;
    const x = P.x + side * (0.1 + o * 0.11 + e * (0.3 + o * 0.12) * sp) * u, y = P.y - (0.02 + e * 0.06 * sp + o * 0.015) * u;
    const rad = u * (0.075 + 0.03 * (2 - o) * S()) * (0.4 + 0.8 * Math.sin(Math.PI * Math.min(1, 0.12 + k * 0.95)));
    if (rad <= 1) continue;
    lobes.push([x, y, rad], [x - side * rad * 0.55, y - rad * 0.45, rad * 0.7], [x + side * rad * 0.5, y - rad * 0.2, rad * 0.62]);
  }
  ctx.globalAlpha = clamp((1 - k) / 0.35) * 0.92;
  const lw = lineW(u, 0.9);
  ctx.fillStyle = INK;
  for (const [x, y, rad] of lobes) { ctx.beginPath(); ctx.arc(x + (r() - 0.5), y + (r() - 0.5), rad + lw, 0, Math.PI * 2); ctx.fill(); }
  for (const [x, y, rad] of lobes) {
    const gr = ctx.createLinearGradient(0, y - rad, 0, y + rad); gr.addColorStop(0, f.color || "#efe2cc"); gr.addColorStop(0.5, "#d2bfa3"); gr.addColorStop(1, "#a8937a");
    ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.fillStyle = gr; ctx.fill();
  }
  ctx.fillStyle = "rgba(255,250,238,0.55)";   // the light on the tops of the lobes
  for (const [x, y, rad] of lobes) { ctx.beginPath(); ctx.ellipse(x - rad * 0.2, y - rad * 0.45, rad * 0.45, rad * 0.22, -0.3, 0, Math.PI * 2); ctx.fill(); }
  // a few grit specks thrown out ahead of the clouds
  ctx.globalAlpha = clamp((1 - k) / 0.5); ctx.fillStyle = "#6e5c49";
  for (let j = 0; j < 6; j++) { const side = j % 2 ? 1 : -1, sp = S(); ctx.beginPath(); ctx.arc(P.x + side * (0.25 + e * (0.65 + sp * 0.3)) * u, P.y - (0.04 + Math.sin(Math.PI * k) * 0.14 * sp) * u, u * 0.009 + 1.5, 0, Math.PI * 2); ctx.fill(); }
}

// the drawn smear frame: for every character moving faster than min px a frame, the stretched drawing an animator
// puts on one or two frames of a fast move: the back of the body pulls out into four or five tapering fingers of its
// own colour (picked off the drawn frame itself, so the light and grade match), inked along their sides, about
// 3.2 frames of travel long and bent along the path it came. They grow out of the body's outline and never cover it.
function smears(env, f, t, dn) {
  const { ctx } = env, min = f.min ?? 42, dt = 1 / env.fps;
  if (env.cut(t - 2 * dt, t)) return;
  for (const who of env.who()) {
    const B = env.body(who);
    if (!B || !B.vis) continue;
    const P1 = env.body(who, t - dt), P2 = env.body(who, t - 2 * dt);
    if (!P1 || !P2) continue;
    const vx = B.cx - P1.cx, vy = B.cy - P1.cy, v = Math.hypot(vx, vy);
    if (env.debug) { ctx.fillStyle = "#0ff"; ctx.font = "28px sans-serif"; ctx.fillText(`smear ${who} v${v.toFixed(0)}`, 20, 1500 + env.who().indexOf(who) * 30); }
    if (v < min) continue;
    // a smear is drawn behind a whole body crossing the frame: not for a body the camera is close on (wider than half
    // the frame) or one mostly out of frame (the cinema close-up drew black spikes off a cloak at its edge)
    const W = ctx.canvas.width, H = ctx.canvas.height;
    if (B.rx > W / 4 || B.cx - B.rx < -0.25 * B.rx || B.cx + B.rx > W + 0.25 * B.rx || B.cy - B.ry < -0.25 * B.ry || B.cy + B.ry > H + 0.25 * B.ry) continue;
    const nx = vx / v, ny = vy / v, px = -ny, py = nx;   // along the motion, and across it
    const er = 1 / Math.sqrt((nx / B.rx) ** 2 + (ny / B.ry) ** 2), wr = 1 / Math.sqrt((px / B.rx) ** 2 + (py / B.ry) ** 2);
    // at most 0.8 of the body along the motion ("cap", in half-bodies): a long fall drew fingers taller than a head
    const len = Math.min(v * (f.trail ?? 3.2), er * (f.cap ?? 1.6)), bx = P1.cx - P2.cx, by = P1.cy - P2.cy, bn = Math.hypot(bx, by) || 1;
    const col = bodyColour(ctx, B) || B.color;
    if (dark(col)) continue;   // a smear in near-black reads as spikes, not speed
    const S = rng(77 + env.who().indexOf(who) * 13), boil = rng(331 + dn);
    const strength = clamp((v - min) / min + 0.6), lw = lineW(B.u, 0.85), n = 5;
    ctx.globalAlpha = strength;
    for (let j = 0; j < n; j++) {
      const o = (j / (n - 1) - 0.5) * 1.5;   // across the body: -0.75 .. 0.75 of its half width
      if (Math.abs(o) > 0.95) continue;
      // the finger's root sits on the outline at that place across the body
      const ox = B.cx + px * wr * o, oy = B.cy + py * wr * o, back = er * Math.sqrt(Math.max(0, 1 - o * o));
      const root = [ox - nx * back * 0.9, oy - ny * back * 0.9];
      let fl = len * (0.55 + 0.45 * (1 - Math.abs(o)) * (0.8 + S() * 0.4));
      // a finger stops short of another character's face (Phoenix's drop into his seat drew them over the Astronaut's)
      for (const k of [0.25, 0.5, 0.75, 1]) if (inOther(env, who, root[0] - (bx / bn) * fl * k, root[1] - (by / bn) * fl * k)) { fl *= k - 0.25; break; }
      if (fl < er * 0.25) continue;
      const fw = wr * (0.17 - 0.05 * Math.abs(o));
      const tip = [root[0] - (bx / bn) * fl + (boil() - 0.5) * 2, root[1] - (by / bn) * fl + (boil() - 0.5) * 2], mid = [root[0] - nx * fl * 0.5, root[1] - ny * fl * 0.5];
      const N = 12, Lp = [], Rp = [];
      for (let i = 0; i <= N; i++) { const s2 = i / N, c = bez(root, mid, tip, s2), w = fw * (1 - s2) ** 0.8 * Math.min(1, 0.6 + s2 * 4); Lp.push([c[0] + px * w, c[1] + py * w]); Rp.push([c[0] - px * w, c[1] - py * w]); }
      ctx.beginPath(); ctx.moveTo(...Lp[0]); for (const q of Lp) ctx.lineTo(...q); for (const q of [...Rp].reverse()) ctx.lineTo(...q); ctx.closePath();
      ctx.fillStyle = col; ctx.fill();
      taper(ctx, Lp.slice(2), lw); taper(ctx, Rp.slice(2), lw);
    }
  }
}
const dark = (c) => {
  c = String(c || ""); let r, g, b;
  if (c[0] === "#") { const n = parseInt(c.slice(1, 7), 16); r = (n >> 16) & 255; g = (n >> 8) & 255; b = n & 255; }
  else { const m = c.match(/\d+/g); if (!m || m.length < 3) return false; [r, g, b] = m.map(Number); }
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 55;
};
// the body's colour as drawn in this frame: the median of a few pixels inside its outline (skips a prop held in front)
function bodyColour(ctx, B) {
  try {
    const px = [];
    for (const [a, b] of [[-0.45, 0.1], [0.45, 0.1], [-0.35, 0.45], [0.35, 0.45], [0, 0.55], [-0.5, -0.2], [0.5, -0.2]]) {
      const d = ctx.getImageData(Math.round(B.cx + a * B.rx), Math.round(B.cy + b * B.ry), 1, 1).data; px.push([d[0], d[1], d[2]]);
    }
    px.sort((p, q) => p[0] + p[1] + p[2] - (q[0] + q[1] + q[2]));
    const m = px[Math.floor(px.length / 2)];
    return `rgb(${m[0]},${m[1]},${m[2]})`;
  } catch { return null; }
}
const bez = (a, b, c, s) => [(1 - s) ** 2 * a[0] + 2 * (1 - s) * s * b[0] + s * s * c[0], (1 - s) ** 2 * a[1] + 2 * (1 - s) * s * b[1] + s * s * c[1]];
