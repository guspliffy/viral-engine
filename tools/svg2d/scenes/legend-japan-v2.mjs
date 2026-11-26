// Legend channel, code-only look proof v2 (26 Nov 2026, Jonny: "make the image more sophisticated"): the same Japan beat
// as legend-japan.mjs, with grown-up stylised figures (almond eyes, small pupils, long limbs, cloth folds, hair strands),
// one shade tone + thin outlines, cobbles, timber houses, noren, atmospheric fade, lamp light over everything.
//   node tools/svg2d/render.mjs tools/svg2d/scenes/legend-japan-v2.mjs out/legend-svg-japan-v2.mp4
export const W = 1080, H = 1920, FPS = 30, DUR = 5.0;
export const MUSIC = "assets/music/ai/orchestra-suspense/orchestra-suspense-01.ogg", GAIN = 0.5;

const F = 1300, H0 = 1140, INK = "#1a1328", FOG = "#5d4c92";
const n = (v) => Math.round(v * 10) / 10;
const lerp = (a, b, u) => a + (b - a) * u;
const clamp = (u) => Math.min(1, Math.max(0, u));
function ease(u, k = "inOut") {
  u = clamp(u);
  if (k === "linear") return u;
  if (k === "out") return 1 - (1 - u) ** 3;
  if (k === "in") return u ** 3;
  if (k === "back") { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * (u - 1) ** 3 + c1 * (u - 1) ** 2; }
  return u * u * (3 - 2 * u);
}
function tr(keys, t) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1], b = keys[i];
    if (t <= b[0]) return lerp(a[1], b[1], ease((t - a[0]) / (b[0] - a[0]), b[2]));
  }
  return keys[keys.length - 1][1];
}
const hash = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const blinkAmt = (t, times) => Math.max(0, ...times.map((b) => 1 - Math.abs(t - b - 0.06) / 0.06));
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, u) => { const A = hex(a), B = hex(b); return "#" + A.map((v, i) => Math.round(lerp(v, B[i], clamp(u))).toString(16).padStart(2, "0")).join(""); };

// ---------------------------------------------------------------- camera + projection
function camera(t) { const u = ease(t / DUR); return { x: lerp(0.12, 0.02, u), y: lerp(1.3, 1.24, u), z: lerp(0, 0.45, u) }; }
function P(c, X, Y, Z) { const s = F / (Z - c.z); return { x: W / 2 + (X - c.x) * s, y: H0 + (c.y - Y) * s, s }; }
const pts = (a) => a.map((p) => `${n(p.x)},${n(p.y)}`).join(" ");
const poly = (a, fill, extra = "") => `<polygon points="${pts(a)}" fill="${fill}" ${extra}/>`;
const quadPt = (q, u, v) => { const top = { x: lerp(q[0].x, q[1].x, u), y: lerp(q[0].y, q[1].y, u) }, bot = { x: lerp(q[3].x, q[2].x, u), y: lerp(q[3].y, q[2].y, u) }; return { x: lerp(top.x, bot.x, v), y: lerp(top.y, bot.y, v) }; };
const sub = (q, u0, u1, v0, v1) => [quadPt(q, u0, v0), quadPt(q, u1, v0), quadPt(q, u1, v1), quadPt(q, u0, v1)];
const fade = (col, z) => mix(col, FOG, clamp((z - 6) / 38) * 0.75);

const DEFS = `<defs>
  <style>.ol > :not([stroke]) { stroke: ${INK}; stroke-width: 0.6; stroke-linejoin: round; }</style>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b0a26"/><stop offset="0.35" stop-color="#1f1b55"/><stop offset="0.58" stop-color="#4a3384"/><stop offset="0.7" stop-color="#8a4f93"/><stop offset="0.8" stop-color="#d77f8a"/></linearGradient>
  <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a2f6c"/><stop offset="1" stop-color="#2a2152"/></linearGradient>
  <linearGradient id="fog" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a185cc" stop-opacity="0"/><stop offset="0.55" stop-color="#a185cc" stop-opacity="0.38"/><stop offset="1" stop-color="#a185cc" stop-opacity="0"/></linearGradient>
  <linearGradient id="wallshade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d0a22" stop-opacity="0.55"/><stop offset="1" stop-color="#0d0a22" stop-opacity="0"/></linearGradient>
  <linearGradient id="wood" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8a5a37"/><stop offset="0.5" stop-color="#6f4528"/><stop offset="1" stop-color="#4e2f1d"/></linearGradient>
  <linearGradient id="hairsheen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3b3358"/><stop offset="1" stop-color="#3b3358" stop-opacity="0"/></linearGradient>
  <radialGradient id="warm"><stop offset="0" stop-color="#ffe0a0" stop-opacity="0.85"/><stop offset="0.25" stop-color="#ffb860" stop-opacity="0.35"/><stop offset="1" stop-color="#ff9a4a" stop-opacity="0"/></radialGradient>
  <radialGradient id="win"><stop offset="0" stop-color="#ffc870" stop-opacity="0.45"/><stop offset="1" stop-color="#ffb060" stop-opacity="0"/></radialGradient>
  <radialGradient id="red"><stop offset="0" stop-color="#ff6a50" stop-opacity="0.55"/><stop offset="1" stop-color="#ff4a3a" stop-opacity="0"/></radialGradient>
  <radialGradient id="cool"><stop offset="0" stop-color="#bfe8ff" stop-opacity="0.5"/><stop offset="1" stop-color="#8fd0ff" stop-opacity="0"/></radialGradient>
  <radialGradient id="moon"><stop offset="0" stop-color="#fff3d2" stop-opacity="0.35"/><stop offset="0.4" stop-color="#e8c8ff" stop-opacity="0.12"/><stop offset="1" stop-color="#e8c8ff" stop-opacity="0"/></radialGradient>
  <radialGradient id="flame"><stop offset="0" stop-color="#fff1b8" stop-opacity="0.95"/><stop offset="0.3" stop-color="#ffc35a" stop-opacity="0.45"/><stop offset="1" stop-color="#ff9a3a" stop-opacity="0"/></radialGradient>
  <radialGradient id="soft"><stop offset="0" stop-color="#0a0718" stop-opacity="0.55"/><stop offset="1" stop-color="#0a0718" stop-opacity="0"/></radialGradient>
  <linearGradient id="streak" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffcf86" stop-opacity="0.5"/><stop offset="1" stop-color="#ffcf86" stop-opacity="0"/></linearGradient>
  <radialGradient id="vig" cx="0.5" cy="0.5" r="0.78"><stop offset="0.5" stop-color="#05030f" stop-opacity="0"/><stop offset="1" stop-color="#05030f" stop-opacity="0.7"/></radialGradient>
  <filter id="dof" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="5"/></filter>
  <filter id="haze" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="1.4"/></filter>
</defs>`;

// ---------------------------------------------------------------- set
function sky(c, t) {
  let s = `<rect width="${W}" height="${H}" fill="url(#sky)"/>`;
  for (let i = 0; i < 70; i++) {
    const x = hash(i) * W, y = hash(i + 50) * 820, r = 0.8 + hash(i + 99) ** 2 * 2.6, tw = 0.55 + 0.45 * Math.sin(t * (1.5 + hash(i + 3) * 3) + i);
    s += `<circle cx="${n(x - c.x * 8)}" cy="${n(y)}" r="${n(r)}" fill="#fff6e0" opacity="${n((0.25 + 0.6 * hash(i + 7)) * tw)}"/>`;
  }
  const mx = 770 - c.x * 20, my = 300;
  s += `<circle cx="${n(mx)}" cy="${my}" r="260" fill="url(#moon)"/><circle cx="${n(mx)}" cy="${my}" r="64" fill="#fff0cc"/>`;
  s += `<path d="M${n(mx + 10)},${my - 62} A64,64 0 0 1 ${n(mx + 10)},${my + 62} A52,64 0 0 0 ${n(mx + 10)},${my - 62} Z" fill="#ead6ad" opacity="0.7"/>`;
  for (const [dx, dy, r] of [[-20, -18, 10], [14, 22, 7], [-26, 24, 5], [22, -30, 4.5], [-6, 6, 4]]) s += `<circle cx="${n(mx + dx)}" cy="${my + dy}" r="${r}" fill="#e7d3a8" opacity="0.8"/>`;
  // drifting cloud bands across the moon
  for (let i = 0; i < 5; i++) {
    const y = 180 + i * 95 + 20 * hash(i + 9), x = ((hash(i + 13) * 1400 + t * (8 + 6 * hash(i))) % 1600) - 300, w = 300 + 260 * hash(i + 4);
    s += `<path d="M${n(x)},${n(y)} q${n(w * 0.2)},-26 ${n(w * 0.45)},-8 q${n(w * 0.18)},-24 ${n(w * 0.4)},-2 q${n(w * 0.1)},10 ${n(w * 0.15)},16 Z" fill="#4b3a86" opacity="${n(0.35 + 0.25 * hash(i + 2))}"/>`;
  }
  return s;
}
function far(c) {
  const hills = (y, col, k, amp) => `<path d="M-50,${y} ${Array.from({ length: 12 }, (_, i) => `Q${n(i * 100 + 50 - c.x * k)},${n(y - amp * (0.5 + hash(i + amp)))} ${n(i * 100 + 100 - c.x * k)},${n(y - amp * 0.3 * hash(i + 31))}`).join(" ")} L1130,${H0 + 60} L-50,${H0 + 60} Z" fill="${col}"/>`;
  let s = hills(H0 - 30, "#3b2f78", 10, 90) + hills(H0 + 5, "#30276a", 18, 50);
  const b = P(c, -7, 0, 70), k = b.s;
  const tiers = [[0, 9, 4.5], [5.5, 7.6, 3.8], [10, 6.4, 3.2], [14, 5.2, 2.7], [17.6, 4.2, 2.3]];
  for (const [y0, w, h] of tiers) {
    const y = b.y - y0 * k;
    s += `<rect x="${n(b.x - w * 0.32 * k)}" y="${n(y - h * k)}" width="${n(w * 0.64 * k)}" height="${n(h * k)}" fill="#2a2263"/>`;
    for (let j = -1; j <= 1; j++) s += `<rect x="${n(b.x + j * w * 0.18 * k - 0.35 * k)}" y="${n(y - h * 0.72 * k)}" width="${n(0.7 * k)}" height="${n(h * 0.38 * k)}" fill="#ffb867" opacity="${j ? 0.45 : 0.85}"/>`;
    s += `<path d="M${n(b.x - w / 2 * k - 1.4 * k)},${n(y - h * k + 0.5 * k)} Q${n(b.x - w / 2 * k)},${n(y - h * k - 0.1 * k)} ${n(b.x - w * 0.2 * k)},${n(y - h * k - 1.3 * k)} L${n(b.x + w * 0.2 * k)},${n(y - h * k - 1.3 * k)} Q${n(b.x + w / 2 * k)},${n(y - h * k - 0.1 * k)} ${n(b.x + w / 2 * k + 1.4 * k)},${n(y - h * k + 0.5 * k)} Z" fill="#1e1850"/>`;
  }
  s += `<rect x="${n(b.x - 0.12 * k)}" y="${n(b.y - 25.5 * k)}" width="${n(0.24 * k)}" height="${n(6 * k)}" fill="#1e1850"/>`;
  for (let j = 0; j < 6; j++) s += `<rect x="${n(b.x - 0.45 * k)}" y="${n(b.y - (24.5 - j * 0.75) * k)}" width="${n(0.9 * k)}" height="${n(0.18 * k)}" fill="#1e1850"/>`;
  s += `<rect width="${W}" height="560" y="${H0 - 360}" fill="url(#fog)"/>`;
  return s;
}
function ground(c, t) {
  let s = `<rect x="0" y="${H0}" width="${W}" height="${H - H0}" fill="#1c1640"/>`;
  // cobbles, row by row, warmer near the lamp
  let row = 0;
  for (let z = 2.0; z < 26; z += z * 0.06, row++) {
    const dz = z * 0.06, off = hash(row + 400) * 0.3;
    for (let x = -2.2 - off, j = 0; x < 2.1; j++) {
      const sw = 0.22 + 0.16 * hash(row * 17 + j), g = 0.02 + 0.003 * z, x0 = Math.max(-2.25, x + g), x1 = Math.min(2.05, x + sw - g); x += sw;
      if (x1 <= x0) continue;
      const q = [P(c, x0, 0, z + dz - g), P(c, x1, 0, z + dz - g), P(c, x1, 0, z + g), P(c, x0, 0, z + g)];
      const id = row * 31 + j, d = Math.hypot((x0 + x1) / 2 + 1.4, z - 6.0), lit = clamp(1 - d / 2.6) * 0.7;
      let col = mix(mix("#3d336b", "#4c4183", hash(id)), "#2a2250", clamp((4.5 - z) / 2.5) * 0.6);
      col = mix(col, "#8e6a86", lit);
      s += poly(q, fade(col, z));
      if (z < 9) s += poly(sub(q, 0.1, 0.9, 0.62, 0.9), mix(col, "#7a6aa8", 0.35), `opacity="0.6"`);
    }
  }
  // wet reflections: the lamp, the lanterns, the vending machine
  const L = P(c, -1.7, 0, 6.3), Lr = P(c, -1.7, 0, 4.4);
  s += `<rect x="${n(L.x - 0.16 * L.s)}" y="${n(L.y)}" width="${n(0.32 * L.s)}" height="${n(Lr.y - L.y)}" fill="url(#streak)" opacity="0.55"/>`;
  const V = P(c, 1.4, 0, 7.0), Vr = P(c, 1.4, 0, 5.2);
  s += `<rect x="${n(V.x - 0.25 * V.s)}" y="${n(V.y)}" width="${n(0.5 * V.s)}" height="${n(Vr.y - V.y)}" fill="#cfefff" opacity="0.12"/>`;
  // a puddle catching the moon
  const pu = P(c, 0.6, 0, 4.6), pz = P(c, 0.6, 0, 4.2);
  s += `<ellipse cx="${n(pu.x)}" cy="${n(pu.y)}" rx="${n(0.55 * pu.s)}" ry="${n(pz.y - pu.y)}" fill="#6d5aa8" opacity="0.55"/><ellipse cx="${n(pu.x + 0.12 * pu.s)}" cy="${n(pu.y)}" rx="${n(0.12 * pu.s)}" ry="${n((pz.y - pu.y) * 0.45)}" fill="#f6e6c4" opacity="0.6"/>`;
  return s;
}
const LEFT = [[5.2, 9.2, 3.5, "#4a3a78", 1], [9.2, 13.6, 3.0, "#41336e", 0], [13.6, 18.4, 3.7, "#4c3d80", 1], [18.4, 24.5, 3.1, "#41336e", 0], [24.5, 33, 3.4, "#4a3a78", 1], [33, 48, 3.0, "#41336e", 0]];
const RIGHT = [[7.4, 11.5, 3.2, "#433571", 0], [11.5, 16.5, 3.8, "#4c3d80", 1], [16.5, 22, 3.0, "#433571", 0], [22, 30, 3.5, "#4a3a78", 1], [30, 48, 3.1, "#433571", 0]];
function houses(c, t, side) {
  const X = side < 0 ? -2.3 : 2.1, list = side < 0 ? LEFT : RIGHT, eave = X - side * 0.65, back = X + side * 1.4;
  let s = "";
  for (let i = list.length - 1; i >= 0; i--) {
    const [z0, z1, h, base, door] = list[i], zm = (z0 + z1) / 2, f = (col) => fade(col, zm);
    // roof with tile rows
    const roof = [P(c, X, h, z0), P(c, X, h, z1), P(c, back, h + 1.3, z1), P(c, back, h + 1.3, z0)];
    s += poly(roof, f("#221b4a"));
    for (const v of [0.2, 0.4, 0.6, 0.8]) s += poly(sub(roof, 0, 1, v, v + 0.04), f("#30285f"));
    s += poly(sub(roof, 0, 1, 0.94, 1), f("#3a3170"));
    const wall = [P(c, X, h, z0), P(c, X, h, z1), P(c, X, 0, z1), P(c, X, 0, z0)];
    s += poly(wall, f(base));
    s += poly(sub(wall, 0, 1, 0, 0.42), "url(#wallshade)");
    s += poly(sub(wall, 0, 1, 0.78, 1), f("#2f2557"));                                  // wooden lower panel
    for (let u = 0.04; u < 1; u += 0.05) s += poly(sub(wall, u, u + 0.006, 0.78, 1), f("#251d48"));
    s += poly(sub(wall, 0, 1, 0.4, 0.44), f("#2a2150"));                                // beam
    for (const u of [0, 0.5, 0.985]) s += poly(sub(wall, u, u + 0.015, 0, 1), f("#2a2150"));   // posts
    // a lit shoji window with lattice, and its glow
    const w0 = 0.1, w1 = Math.min(0.42, w0 + 1.4 / (z1 - z0));
    const win = sub(wall, w0, w1, 0.48, 0.74), wc = quadPt(win, 0.5, 0.5), wr = P(c, X, 1.6, z0 + 1).s;
    s += `<circle cx="${n(wc.x)}" cy="${n(wc.y)}" r="${n(1.1 * wr)}" fill="url(#win)" opacity="${n(1 - clamp((zm - 6) / 40) * 0.6)}"/>`;
    s += poly(win, f("#ffc46b"));
    for (const u of [0.2, 0.4, 0.6, 0.8]) s += poly(sub(win, u - 0.012, u + 0.012, 0, 1), f("#b9792f"));
    for (const v of [0.33, 0.66]) s += poly(sub(win, 0, 1, v - 0.025, v + 0.025), f("#b9792f"));
    s += poly(sub(win, 0, 1, 0, 0.06), f("#2a2150")) + poly(sub(win, 0, 1, 0.94, 1.0), f("#2a2150"));
    // a doorway with a noren curtain (three panels, swaying)
    if (door) {
      const d = sub(wall, 0.58, 0.86, 0.42, 1);
      s += poly(d, f("#1a1433"));
      for (let k = 0; k < 3; k++) {
        const sw = Math.sin(t * 1.3 + k + i) * 0.04;
        const pn = sub(d, k / 3 + 0.01, (k + 1) / 3 - 0.01, 0.02, 0.5);
        pn[2] = quadPt(d, (k + 1) / 3 - 0.01 + sw, 0.5); pn[3] = quadPt(d, k / 3 + 0.01 + sw, 0.5);
        s += poly(pn, f(i % 4 ? "#2e5d8c" : "#8c2e3e"));
      }
      const cc = quadPt(d, 0.5, 0.25), cr = P(c, X, 1.5, z0 + 3).s * 0.12;
      s += `<circle cx="${n(cc.x)}" cy="${n(cc.y)}" r="${n(cr)}" fill="none" stroke="${f("#e8e0d0")}" stroke-width="${n(cr * 0.25)}"/>`;
    }
    // eave + rafter ends
    const ev = [P(c, X, h, z0), P(c, X, h, z1), P(c, eave, h - 0.35, z1), P(c, eave, h - 0.35, z0)];
    s += poly(ev, f("#2a2152"));
    for (let u = 0.03; u < 1; u += 0.07) s += poly(sub(ev, u, u + 0.02, 0.75, 1), f("#3a2f68"));
    s += poly(sub(ev, 0, 1, 0.9, 1), f("#171236"));
    // a red paper lantern under the eave
    if (i % 2 === 0) {
      const sw = Math.sin(t * 1.7 + i) * 4, L = P(c, X - side * 0.45, h - 0.85, z0 + 0.6), r = L.s;
      s += `<circle cx="${n(L.x)}" cy="${n(L.y)}" r="${n(1.1 * r)}" fill="url(#red)"/>`;
      s += `<g transform="translate(${n(L.x)},${n(L.y)}) rotate(${n(sw)})"><line x1="0" y1="${n(-0.5 * r)}" x2="0" y2="${n(-0.25 * r)}" stroke="#1d1740" stroke-width="${n(0.02 * r)}"/>
        <ellipse rx="${n(0.17 * r)}" ry="${n(0.24 * r)}" fill="#e0463d"/><ellipse cx="${n(0.05 * r)}" rx="${n(0.1 * r)}" ry="${n(0.22 * r)}" fill="#f2735a" opacity="0.6"/>
        ${[-0.14, -0.07, 0, 0.07, 0.14].map((y) => `<path d="M${n(-0.165 * r)},${n(y * r)} Q0,${n((y + 0.02) * r)} ${n(0.165 * r)},${n(y * r)}" stroke="#a82c2a" stroke-width="${n(0.008 * r)}" fill="none"/>`).join("")}
        <rect x="${n(-0.09 * r)}" y="${n(-0.27 * r)}" width="${n(0.18 * r)}" height="${n(0.05 * r)}" fill="#2a1f3a"/><rect x="${n(-0.09 * r)}" y="${n(0.22 * r)}" width="${n(0.18 * r)}" height="${n(0.05 * r)}" fill="#2a1f3a"/>
        <line x1="0" y1="${n(0.27 * r)}" x2="0" y2="${n(0.36 * r)}" stroke="#d8a040" stroke-width="${n(0.02 * r)}"/></g>`;
    }
  }
  return s;
}
function vending(c, t) {
  const X = 1.75, z0 = 6.6, z1 = 7.5;
  const front = [P(c, X, 1.85, z0), P(c, X, 1.85, z1), P(c, X, 0, z1), P(c, X, 0, z0)];
  const g = P(c, X - 0.4, 0, (z0 + z1) / 2);
  let s = `<ellipse cx="${n(g.x)}" cy="${n(g.y)}" rx="${n(1.4 * g.s)}" ry="${n(0.32 * g.s)}" fill="url(#cool)"/>`;
  s += poly([P(c, X, 1.85, z0), P(c, X + 0.6, 1.85, z0), P(c, X + 0.6, 0, z0), P(c, X, 0, z0)], "#8e1f2c");
  s += poly([P(c, X, 1.85, z0), P(c, X + 0.6, 1.85, z0), P(c, X + 0.6, 1.92, z0 + 0.05), P(c, X, 1.92, z0 + 0.05)], "#b52a38");
  s += poly(front, "#d6343f") + poly(sub(front, 0, 1, 0, 0.06), "#e85560");
  const shop = sub(front, 0.08, 0.92, 0.08, 0.56);
  s += poly(shop, "#e9f6ff");
  const cols = ["#4fb3e8", "#f2c641", "#7ad18a", "#f07a5a", "#a98ce0", "#ffffff"];
  for (let r = 0; r < 3; r++) for (let k = 0; k < 6; k++) {
    s += poly(sub(shop, 0.05 + k * 0.155, 0.14 + k * 0.155, 0.08 + r * 0.31, 0.27 + r * 0.31), cols[(k * 2 + r) % 6]);
    s += poly(sub(shop, 0.05 + k * 0.155, 0.14 + k * 0.155, 0.29 + r * 0.31, 0.32 + r * 0.31), "#c23a48");
  }
  s += poly(sub(front, 0.12, 0.62, 0.62, 0.7), "#2a1626") + poly(sub(front, 0.72, 0.88, 0.6, 0.72), "#f4d35e");
  s += poly(sub(front, 0.15, 0.85, 0.82, 0.92), "#2a1626");
  return s;
}
function lamp(c, t) {
  const fl = 1 - 0.6 * Math.max(0, Math.sin(Math.PI * clamp((t - 4.05) / 0.12))) - 0.5 * Math.max(0, Math.sin(Math.PI * clamp((t - 4.3) / 0.1)));
  const foot = P(c, -1.7, 0, 6.3), top = P(c, -1.7, 3.05, 6.3), head = P(c, -1.7, 2.85, 6.3), k = foot.s;
  const pool = P(c, -1.4, 0, 6.0), pz = P(c, -1.4, 0, 4.9);
  let s = `<ellipse cx="${n(pool.x)}" cy="${n(pool.y)}" rx="${n(1.8 * pool.s)}" ry="${n(Math.max(20, pz.y - pool.y))}" fill="url(#warm)" opacity="${n(0.8 * fl)}"/>`;
  s += `<rect x="${n(foot.x - 0.05 * k)}" y="${n(top.y)}" width="${n(0.1 * k)}" height="${n(foot.y - top.y)}" fill="#1a1536"/>`;
  s += `<rect x="${n(foot.x - 0.02 * k)}" y="${n(top.y)}" width="${n(0.025 * k)}" height="${n(foot.y - top.y)}" fill="#6a4a5a" opacity="0.7"/>`;
  s += `<path d="M${n(foot.x - 0.13 * k)},${n(foot.y)} L${n(foot.x - 0.08 * k)},${n(foot.y - 0.35 * k)} L${n(foot.x + 0.08 * k)},${n(foot.y - 0.35 * k)} L${n(foot.x + 0.13 * k)},${n(foot.y)} Z" fill="#1a1536"/>`;
  s += `<circle cx="${n(head.x)}" cy="${n(head.y)}" r="${n(1.9 * k)}" fill="url(#warm)" opacity="${n(fl)}"/>`;
  s += `<rect x="${n(head.x - 0.17 * k)}" y="${n(head.y - 0.22 * k)}" width="${n(0.34 * k)}" height="${n(0.44 * k)}" rx="${n(0.03 * k)}" fill="${fl > 0.7 ? "#fff0c0" : "#c79a5a"}"/>`;
  s += `<rect x="${n(head.x - 0.17 * k)}" y="${n(head.y - 0.22 * k)}" width="${n(0.34 * k)}" height="${n(0.44 * k)}" rx="${n(0.03 * k)}" fill="none" stroke="#1a1536" stroke-width="${n(0.035 * k)}"/>`;
  s += `<path d="M${n(head.x)},${n(head.y - 0.22 * k)} V${n(head.y + 0.22 * k)} M${n(head.x - 0.17 * k)},${n(head.y)} H${n(head.x + 0.17 * k)}" stroke="#1a1536" stroke-width="${n(0.018 * k)}"/>`;
  s += `<path d="M${n(head.x - 0.27 * k)},${n(head.y - 0.2 * k)} Q${n(head.x - 0.1 * k)},${n(head.y - 0.26 * k)} ${n(head.x)},${n(head.y - 0.4 * k)} Q${n(head.x + 0.1 * k)},${n(head.y - 0.26 * k)} ${n(head.x + 0.27 * k)},${n(head.y - 0.2 * k)} Z" fill="#1a1536"/>`;
  return { s, fl, head };
}

// ---------------------------------------------------------------- cast helpers (local cm, feet at 0, up = -y)
const place = (p, rot = 0) => `translate(${n(p.x)},${n(p.y)}) rotate(${n(rot)}) scale(${(p.s / 100).toFixed(4)})`;
function toScreen(p, rot, lx, ly) { const a = rot * Math.PI / 180, k = p.s / 100; return { x: p.x + k * (lx * Math.cos(a) - ly * Math.sin(a)), y: p.y + k * (lx * Math.sin(a) + ly * Math.cos(a)) }; }
const shadow = (p, w) => `<ellipse cx="${n(p.x)}" cy="${n(p.y)}" rx="${n(w * p.s)}" ry="${n(w * 0.2 * p.s)}" fill="url(#soft)"/>`;
// a limb as an outlined round stroke through points (local cm)
function limb(ptsL, w, col, shade) {
  const d = "M" + ptsL.map(([x, y]) => `${n(x)},${n(y)}`).join(" L");
  return `<path d="${d}" stroke="${INK}" stroke-width="${n(w + 1.2)}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>` +
    `<path d="${d}" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>` +
    (shade ? `<path d="${d}" stroke="${shade}" stroke-width="${n(w * 0.4)}" stroke-linecap="round" stroke-linejoin="round" fill="none" transform="translate(${n(w * 0.28)},0)"/>` : "");
}
// an almond eye: x,y centre, w half width, h height, look -1..1, open 0..1, dir = which way the outer corner points
function eye(id, x, y, w, h, look, open, dir, iris = "#2a1d24") {
  h *= Math.max(0.08, open);
  const shape = `M${n(x - w * dir)},${n(y + h * 0.1)} Q${n(x - w * 0.25 * dir)},${n(y - h * 1.05)} ${n(x + w * dir)},${n(y - h * 0.25)} Q${n(x + w * 0.2 * dir)},${n(y + h * 0.75)} ${n(x - w * dir)},${n(y + h * 0.1)} Z`;
  if (open < 0.25) return `<path d="M${n(x - w * dir)},${n(y)} Q${n(x)},${n(y + 1)} ${n(x + w * dir)},${n(y - 0.3)}" stroke="${INK}" stroke-width="0.9" fill="none" stroke-linecap="round"/>`;
  const ix = x + look * w * 0.45, ir = Math.min(w * 0.42, 2.6);
  return `<clipPath id="${id}"><path d="${shape}"/></clipPath><path d="${shape}" fill="#f3ede6" stroke="none"/>` +
    `<g clip-path="url(#${id})"><circle cx="${n(ix)}" cy="${n(y - h * 0.15)}" r="${n(ir)}" fill="${iris}"/><circle cx="${n(ix)}" cy="${n(y - h * 0.15)}" r="${n(ir * 0.45)}" fill="#0b0710"/><circle cx="${n(ix + ir * 0.35)}" cy="${n(y - h * 0.15 - ir * 0.35)}" r="${n(ir * 0.28)}" fill="#fff"/></g>` +
    `<path d="M${n(x - w * dir)},${n(y + h * 0.1)} Q${n(x - w * 0.25 * dir)},${n(y - h * 1.05)} ${n(x + w * dir)},${n(y - h * 0.25)} l${n(0.9 * dir)},-0.7" stroke="${INK}" stroke-width="1.1" fill="none" stroke-linecap="round"/>`;
}
// a 3/4 head outline: cranium + jaw that points where the face looks (fx -1 left .. 1 right)
function headPath(hx, hy, rx, ry, fx, chin = 1) {
  const jx = hx + fx * rx * 0.38;
  return `M${n(hx - rx)},${n(hy - ry * 0.15)} C${n(hx - rx * 1.05)},${n(hy - ry * 1.35)} ${n(hx + rx * 1.05)},${n(hy - ry * 1.35)} ${n(hx + rx)},${n(hy - ry * 0.15)} C${n(hx + rx * 0.98 - (fx < 0 ? 0 : fx * 1.5))},${n(hy + ry * 0.45)} ${n(jx + rx * 0.45)},${n(hy + ry * 0.95 * chin)} ${n(jx)},${n(hy + ry * chin)} C${n(jx - rx * 0.45)},${n(hy + ry * 0.95 * chin)} ${n(hx - rx * 0.98 - (fx > 0 ? 0 : fx * 1.5))},${n(hy + ry * 0.45)} ${n(hx - rx)},${n(hy - ry * 0.15)} Z`;
}

// ---------------------------------------------------------------- the masked woman (172 cm, slim, long hair, trench coat)
function woman(c, t) {
  const p = P(c, -1.2, 0, 5.9);
  const turn = tr([[3.2, 0], [4.4, 1]], t), fx = lerp(0.75, 0, turn), smile = tr([[4.3, 0], [4.6, 1]], t);
  const skin = "#efdacd", hair = "#120e20", coat = "#d6bd96", coatS = "#b79b73";
  const hx = fx * 2, hy = -152, ex = hx + fx * 5;
  const eyes = smile > 0.5
    ? [-4.4, 4.4].map((d) => `<path d="M${n(ex + d - 2.6)},${n(hy - 1)} Q${n(ex + d)},${n(hy - 4.6)} ${n(ex + d + 2.6)},${n(hy - 1)}" stroke="${INK}" stroke-width="1.2" fill="none" stroke-linecap="round"/>`).join("")
    : eye("we1", ex - 4.4, hy - 1.5, 2.6 * (fx > 0.3 ? 0.85 : 1), 2.3, lerp(1, 0, turn), 1, -1, "#3a1420") + eye("we2", ex + 4.4, hy - 1.5, 2.6, 2.3, lerp(1, 0, turn), 1, 1, "#3a1420");
  const strands = Array.from({ length: 7 }, (_, i) => { const x = -15 + i * 5 - fx * 3; return `<path d="M${n(x)},-166 Q${n(x - 2 + hash(i) * 4)},-130 ${n(x + (hash(i + 5) - 0.5) * 4)},${n(-92 - hash(i + 9) * 6)}" stroke="#2c2542" stroke-width="0.7" fill="none"/>`; }).join("");
  return shadow(p, 0.36) + `<g class="ol" transform="${place(p)}">
    <path d="M${n(-17 - fx * 3)},-168 Q${n(-22 - fx * 3)},-130 ${n(-19 - fx * 2)},-90 Q0,-86 ${n(17 - fx * 2)},-90 Q${n(21 - fx * 3)},-130 ${n(14 - fx * 3)},-168 Z" fill="${hair}"/>
    ${strands}
    <path d="M-8,-52 L-3,-52 L-4,-7 L-7.5,-7 Z" fill="#251e33"/><path d="M3,-52 L8,-52 L7.5,-7 L4,-7 Z" fill="#1d1729"/>
    <path d="M-10,-1 L-9,-7 L-3,-7 L-2.5,-1 Z" fill="#100c18"/><path d="M3,-1 L4,-7 L9,-7 L10.5,-1 Z" fill="#100c18"/>
    <path d="M-12,-140 L12,-140 Q17,-112 16,-98 L24,-48 Q12,-45 1,-47 L0,-62 L-1,-47 Q-12,-45 -24,-48 L-16,-98 Q-17,-112 -12,-140 Z" fill="${coat}"/>
    <path d="M5,-140 L12,-140 Q17,-112 16,-98 L24,-48 Q14,-46 8,-46 Q10,-80 5,-140 Z" fill="${coatS}" stroke="none"/>
    <path d="M-14,-90 Q-17,-70 -19,-50 M-6,-88 Q-7,-70 -8,-48 M10,-88 Q13,-70 15,-50" stroke="#ad9068" stroke-width="0.6" fill="none"/>
    <path d="M-17,-100 L17,-100 L17.3,-95 L-17.3,-95 Z" fill="#a48660"/><rect x="-3.2" y="-101" width="6.4" height="7" rx="0.8" fill="none" stroke="#5a4630" stroke-width="0.9"/>
    <path d="M-12,-140 L-2,-112 L-9,-104 L-15,-128 Z" fill="#e4cfab"/><path d="M12,-140 L2,-112 L9,-104 L15,-128 Z" fill="#c8ad85"/>
    <path d="M-5,-140 L0,-126 L5,-140 Z" fill="#2a2238"/>
    ${[-118, -108, -88, -76].map((y) => `<circle cx="-5" cy="${y}" r="0.9" fill="#6e583c" stroke="none"/><circle cx="5" cy="${y}" r="0.9" fill="#6e583c" stroke="none"/>`).join("")}
    ${limb([[-13, -136], [-18.5, -112], [-19.5, -86]], 6.5, coat)}<path d="M-22.5,-86 L-16.5,-86 L-16.8,-82 L-22.2,-82 Z" fill="#c2a67e"/><path d="M-21.5,-82 Q-22,-74 -19.5,-72 Q-17,-74 -17.5,-82 Z" fill="${skin}"/>
    ${limb([[13, -136], [18.5, -112], [19.5, -86]], 6.5, coatS)}<path d="M16.5,-86 L22.5,-86 L22.2,-82 L16.8,-82 Z" fill="#a88d66"/><path d="M17.5,-82 Q17,-74 19.5,-72 Q22,-74 21.5,-82 Z" fill="${skin}"/>
    <path d="M-3.5,-146 L3.5,-146 L3,-137 L-3,-137 Z" fill="#dcc2b3"/>
    <path d="${headPath(hx, hy, 11, 13.5, fx, 1.05)}" fill="${skin}"/>
    <path d="M${n(hx - 12.2)},${n(hy - 2)} Q${n(hx - 13)},${n(hy - 19)} ${n(hx + fx * 2)},${n(hy - 18.5)} Q${n(hx + 13)},${n(hy - 19)} ${n(hx + 12.2)},${n(hy - 2)} L${n(hx + 10.5 + fx * 2)},${n(hy - 5)} L${n(hx - 10.5 + fx * 2)},${n(hy - 5)} Z" fill="${hair}"/>
    <path d="M${n(hx - 6 + fx * 2)},${n(hy - 16)} Q${n(hx - 2 + fx * 2)},${n(hy - 12)} ${n(hx + 4 + fx * 2)},${n(hy - 16)}" stroke="url(#hairsheen)" stroke-width="1.6" fill="none"/>
    <path d="M${n(hx - 12.2)},${n(hy - 6)} Q${n(hx - 13.5)},${n(hy + 12)} ${n(hx - 13)},${n(hy + 34)} L${n(hx - 8.5)},${n(hy + 34)} Q${n(hx - 9.5)},${n(hy + 10)} ${n(hx - 9.4 + fx)},${n(hy - 4)} Z" fill="${hair}"/>
    <path d="M${n(hx + 12.2)},${n(hy - 6)} Q${n(hx + 13.5)},${n(hy + 12)} ${n(hx + 13)},${n(hy + 34)} L${n(hx + 8.5)},${n(hy + 34)} Q${n(hx + 9.5)},${n(hy + 10)} ${n(hx + 9.4 + fx)},${n(hy - 4)} Z" fill="${hair}"/>
    <path d="M${n(ex - 7)},${n(hy - 6.5)} Q${n(ex - 4.5)},${n(hy - 7.5)} ${n(ex - 2)},${n(hy - 6.8)} M${n(ex + 2)},${n(hy - 6.8)} Q${n(ex + 4.5)},${n(hy - 7.5)} ${n(ex + 7)},${n(hy - 6.5)}" stroke="${INK}" stroke-width="0.7" fill="none"/>
    ${eyes}
    <path d="M${n(hx - 9.6 + fx * 3)},${n(hy + 1.5)} Q${n(ex)},${n(hy - 0.5)} ${n(hx + 9.6 + fx * 3)},${n(hy + 1.5)} L${n(hx + 8.6 + fx * 3)},${n(hy + 10)} Q${n(ex)},${n(hy + 14.5)} ${n(hx - 8.6 + fx * 3)},${n(hy + 10)} Z" fill="#f7f5f0"/>
    <path d="M${n(hx - 8 + fx * 3)},${n(hy + 4.5)} Q${n(ex)},${n(hy + 3.2)} ${n(hx + 8 + fx * 3)},${n(hy + 4.5)} M${n(hx - 8 + fx * 3)},${n(hy + 7.5)} Q${n(ex)},${n(hy + 6.5)} ${n(hx + 8 + fx * 3)},${n(hy + 7.5)}" stroke="#cfcac0" stroke-width="0.55" fill="none"/>
    <path d="M${n(hx + 8 + fx * 3)},${n(hy + 7)} Q${n(hx + 9 + fx * 3)},${n(hy + 9)} ${n(hx + 8.6 + fx * 3)},${n(hy + 10)}" stroke="#d9d4ca" stroke-width="2" fill="none" opacity="0.8"/>
  </g>`;
}

// ---------------------------------------------------------------- the curious kid (150 cm, slim 12-year-old, poppy quilted jacket, wrist bell)
function kid(c, t) {
  const pull = tr([[2.42, 0], [2.6, 0.06, "out"], [3.4, 0.03]], t);
  const p = P(c, -0.08 + pull, 0, 3.7);
  const lean = tr([[0.6, 0], [1.6, -7], [2.38, -7], [2.62, 4, "out"], [3.2, 0]], t);
  const reachL = tr([[0.7, 0], [1.7, 1], [2.38, 1], [2.6, 0.15, "out"]], t);
  const shock = tr([[2.38, 0], [2.52, 1, "out"]], t), hop = Math.sin(Math.PI * clamp((t - 2.4) / 0.25)) * 4;
  const fx = lerp(-0.8, 0.8, shock), bl = blinkAmt(t, [1.15, 3.95]), open = (1 - bl) * lerp(1, 1.35, shock);
  const skin = "#f3cdb0", jac = "#e8476a", jacS = "#bd2f50", jacL = "#f27a93", hairC = "#1d1829", tug = shock * 3.5;
  const hx = fx * 1.5, hy = -138, ex = hx + fx * 4.5;
  // left arm (toward the woman) reaches out with the bell on its wrist
  const eL = [lerp(-15.5, -24, reachL), lerp(-100, -110, reachL)], wL = [lerp(-16, -36, reachL), lerp(-80, -108, reachL)];
  const bellSw = Math.sin(t * 7) * 6 * (0.3 + reachL);
  const bell = `<g transform="translate(${n(wL[0])},${n(wL[1] + 2.5)}) rotate(${n(bellSw)})"><path d="M0,0 L0,3" stroke="#a82c2a" stroke-width="0.8"/><path d="M-2.6,6.6 Q-2.8,2.8 0,2.6 Q2.8,2.8 2.6,6.6 Z" fill="#e0b040"/><path d="M-1.2,4 Q0,3.2 1,4" stroke="#fff3b0" stroke-width="0.5" fill="none"/><circle cy="6.8" r="0.7" fill="#6b4a10"/></g>`;
  const mouth = shock > 0.4
    ? `<path d="M${n(ex - 1.8)},${n(hy + 8)} Q${n(ex)},${n(hy + 5.8)} ${n(ex + 1.8)},${n(hy + 8)} Q${n(ex)},${n(hy + 11.5)} ${n(ex - 1.8)},${n(hy + 8)} Z" fill="#5a1f30"/>`
    : `<path d="M${n(ex - 2)},${n(hy + 8.4)} Q${n(ex + 0.3)},${n(hy + 9.2)} ${n(ex + 2)},${n(hy + 7.8)}" stroke="#6a2a38" stroke-width="0.8" fill="none" stroke-linecap="round"/>`;
  const browY = shock > 0.4 ? hy - 9.2 : hy - 7.6;
  const fringe = [-9, -5, -1, 3, 7].map((x, i) => `<path d="M${n(hx + x + fx * 2)},${n(hy - 14)} Q${n(hx + x + fx * 2 + 3 * (fx < 0 ? -1 : 1))},${n(hy - 8)} ${n(hx + x + fx * 4 + (fx < 0 ? -3.5 : 3.5))},${n(hy - 3.5 - (i % 2) * 2.5)} L${n(hx + x + fx * 2 + 3)},${n(hy - 12)} Z" fill="${hairC}"/>`).join("");
  const svg = shadow(P(c, -0.08 + pull, 0, 3.7), 0.26) + `<g class="ol" transform="${place(p, lean)} translate(0,${n(-hop)}) scale(0.94)">
    <path d="M1.5,-78 L9,-78 L8.5,-8 L3,-8 Z" fill="#d9cba9"/><path d="M-9,-78 L-1.5,-78 L-3,-8 L-8.5,-8 Z" fill="#ece0c4"/>
    <path d="M-7,-46 Q-5,-43 -3,-46 M4.5,-50 Q6.5,-47 8,-50 M-8,-22 L-4,-24" stroke="#bfae8a" stroke-width="0.6" fill="none"/>
    <path d="M2,-1 Q1.5,-7 4,-8.5 L9,-8.5 Q12,-6 12.5,-1 Z" fill="#e4e0ea"/><path d="M2,-1 L12.5,-1 L12.5,-2.5 L2,-2.5 Z" fill="#b8344c"/>
    <path d="M-13,-1 Q-13,-6 -9,-8.5 L-3,-8.5 Q-1.5,-6 -1.5,-1 Z" fill="#f2eff6"/><path d="M-13,-1 L-1.5,-1 L-1.5,-2.5 L-13,-2.5 Z" fill="#c23a52"/>
    ${limb([[12.5, -120], [16 + tug * 0.5, -99], [17 + tug, -80]], 7.5, jacS)}
    <path d="M${n(14 + tug)},-81 L${n(20.5 + tug)},-81 L${n(20.3 + tug)},-77.5 L${n(14.2 + tug)},-77.5 Z" fill="#a8284a"/>
    <path d="M${n(15 + tug)},-77.5 Q${n(14.5 + tug)},-71 ${n(17.5 + tug)},-70 Q${n(20.5 + tug)},-71 ${n(20 + tug)},-77.5 Z" fill="${skin}"/>
    <path d="M-13,-124 Q-16.5,-110 -15.5,-96 Q-16.5,-84 -14.5,-74 Q0,-70.5 14.5,-74 Q16.5,-84 15.5,-96 Q16.5,-110 13,-124 Q0,-128 -13,-124 Z" fill="${jac}"/>
    <path d="M3,-126 Q13,-126 13,-124 Q16.5,-110 15.5,-96 Q16.5,-84 14.5,-74 Q9,-72.5 5,-72.3 Q7,-100 3,-126 Z" fill="${jacS}" stroke="none"/>
    <path d="M-12,-122 Q-14.5,-108 -13.5,-97" stroke="${jacL}" stroke-width="1.4" fill="none"/>
    ${[-113, -102, -91, -81].map((y) => `<path d="M-15.5,${y} Q0,${y + 2.2} 15.5,${y}" stroke="#a8284a" stroke-width="0.6" fill="none"/>`).join("")}
    ${[-10, -3, 4, 11].map((x) => `<path d="M${x},-124 L${x + (x < 0 ? -1 : 1)},-74" stroke="#a8284a" stroke-width="0.35" fill="none" opacity="0.7"/>`).join("")}
    <path d="M${n(-1 + fx * 3)},-127 L${n(-1.5 + fx * 3)},-73" stroke="#7d1d36" stroke-width="0.8"/>
    <path d="M-14.5,-76 Q0,-72 14.5,-76 L14.5,-73 Q0,-69.5 -14.5,-73 Z" fill="#a8284a"/>
    <path d="M-7.5,-125 L-7.5,-131 Q0,-133.5 7.5,-131 L7.5,-125 Q0,-122.5 -7.5,-125 Z" fill="${jac}"/><path d="M2,-132.6 Q7,-132 7.5,-131 L7.5,-125 Q5,-124 2,-123.4 Z" fill="${jacS}" stroke="none"/>
    <path d="M-3,-131 L3,-131 L2.6,-127 L-2.6,-127 Z" fill="#e2b89c"/>
    <path d="${headPath(hx, hy, 10, 12, fx, 1.02)}" fill="${skin}"/>
    ${Math.abs(fx) > 0.3 ? `<path d="M${n(hx - fx * 9.2)},${n(hy - 1)} q${n(-fx * 3.2)},1 ${n(-fx * 2.2)},5 q${n(fx * 1)},1.5 ${n(fx * 2.4)},0.6" fill="${skin}"/>` : ""}
    <path d="M${n(hx - 10.8)},${n(hy + 1)} Q${n(hx - 12.5)},${n(hy - 16)} ${n(hx - 2)},${n(hy - 17.5)} Q${n(hx + 9)},${n(hy - 19)} ${n(hx + 11.2)},${n(hy - 6)} L${n(hx + 10.4)},${n(hy + 1)} Q${n(hx + 8 - fx * 3)},${n(hy - 8)} ${n(hx - fx * 3)},${n(hy - 10)} Q${n(hx - 8 - fx * 3)},${n(hy - 8)} ${n(hx - 10.8)},${n(hy + 1)} Z" fill="${hairC}"/>
    ${fringe}
    <path d="M${n(hx - 5)},${n(hy - 15.5)} Q${n(hx + 1)},${n(hy - 17)} ${n(hx + 6)},${n(hy - 14)}" stroke="#463e66" stroke-width="1.1" fill="none"/>
    <path d="M${n(ex - 7)},${n(browY + (shock > 0.4 ? 0.6 : 0))} L${n(ex - 2.2)},${n(browY)} M${n(ex + 2.2)},${n(browY)} L${n(ex + 7)},${n(browY + (shock > 0.4 ? 0.6 : 0))}" stroke="${hairC}" stroke-width="1.1" stroke-linecap="round"/>
    ${eye("ke1", ex - 4.3, hy - 2, fx < -0.3 ? 2.1 : 2.6, 2.4, fx, open, -1)}${eye("ke2", ex + 4.3, hy - 2, fx > 0.3 ? 2.1 : 2.6, 2.4, fx, open, 1)}
    <path d="M${n(ex + fx * 1.5)},${n(hy + 1.5)} q${n(fx * 1.2)},2.2 ${n(-fx * 0.6)},3" stroke="#c48a74" stroke-width="0.8" fill="none" stroke-linecap="round"/>
    <ellipse cx="${n(ex - 6.5)}" cy="${n(hy + 4.5)}" rx="2" ry="1.1" fill="#f08a96" opacity="0.45" stroke="none"/><ellipse cx="${n(ex + 6.5)}" cy="${n(hy + 4.5)}" rx="2" ry="1.1" fill="#f08a96" opacity="0.45" stroke="none"/>
    ${mouth}
    ${limb([[-12.5, -120], eL, wL], 7.5, jac)}
    <g transform="translate(${n(wL[0])},${n(wL[1])}) rotate(${n(lerp(0, 60, reachL))})"><path d="M-3.4,-1.5 L3.4,-1.5 L3.2,2 L-3.2,2 Z" fill="#a8284a"/><path d="M-2.6,2 Q-3,8 0,9 Q3,8 2.6,2 Z" fill="${skin}"/><path d="M-2.5,4 Q-4.5,5 -3.6,6.6" stroke="${INK}" stroke-width="0.5" fill="${skin}"/></g>
    ${bell}
  </g>`;
  return { svg, sleeve: toScreen(p, lean, (16 + tug * 0.6) * 0.94, (-100 - hop) * 0.94), p };
}

// ---------------------------------------------------------------- the rule keeper (125 cm, short and wide, indigo cloak with marigold lining, staff + candle jar)
function keeper(c, t, sleeve) {
  const p = P(c, 0.52, 0, 2.9);
  const fl = tr([[0.8, 1], [2.4, 0.35]], t) * (1 + 0.06 * Math.sin(t * 21) + 0.04 * Math.sin(t * 33 + 1));
  const stern = tr([[2.0, 0], [2.2, 1]], t), fx = -0.7, bl = blinkAmt(t, [0.45, 3.6]);
  const skin = "#e6bf9e", cloak = "#2b2f6b", cloakS = "#20234f", lining = "#f2a93b", white = "#efebe3";
  const hx = -2 + fx * 1.5, hy = -112, ex = hx + fx * 4.5;
  const eyes = stern < 0.5
    ? [-4, 4].map((d) => `<path d="M${n(ex + d - 2.4)},${n(hy - 1.5)} Q${n(ex + d)},${n(hy - 4)} ${n(ex + d + 2.4)},${n(hy - 1.5)}" stroke="${INK}" stroke-width="1.1" fill="none" stroke-linecap="round"/>`).join("")
    : eye("pe1", ex - 4, hy - 2, 1.7, 1.35, -0.6, 1 - bl, -1, "#3a2418") + eye("pe2", ex + 4, hy - 2, 1.9, 1.35, -0.6, 1 - bl, 1, "#3a2418");
  const browD = stern > 0.5 ? 1.2 : -0.4;
  // the grab arm in screen space: from her near shoulder to his sleeve
  const reach = tr([[2.0, 0], [2.4, 1, "back"]], t), k = p.s / 100;
  const sh = toScreen(p, 0, -14, -94), rest = toScreen(p, 0, -18, -68);
  const hand = { x: lerp(rest.x, sleeve.x, reach), y: lerp(rest.y, sleeve.y, reach) };
  const elbow = { x: lerp(sh.x, hand.x, 0.5) - 3 * k, y: Math.max(sh.y, hand.y) + lerp(8, 9, reach) * k };
  const armD = `M${n(sh.x)},${n(sh.y)} Q${n(elbow.x)},${n(elbow.y)} ${n(hand.x)},${n(hand.y)}`;
  const cuff = { x: lerp(elbow.x, hand.x, 0.8), y: lerp(elbow.y, hand.y, 0.8) };
  const ang = Math.atan2(hand.y - elbow.y, hand.x - elbow.x) * 180 / Math.PI;
  const arm = `<path d="${armD}" stroke="${INK}" stroke-width="${n(12.2 * k)}" stroke-linecap="round" fill="none"/><path d="${armD}" stroke="${cloak}" stroke-width="${n(11 * k)}" stroke-linecap="round" fill="none"/>
    <path d="${armD}" stroke="${cloakS}" stroke-width="${n(3.5 * k)}" stroke-linecap="round" fill="none" transform="translate(0,${n(3 * k)})"/>
    <g transform="translate(${n(cuff.x)},${n(cuff.y)}) rotate(${n(ang)}) scale(${k.toFixed(4)})"><ellipse rx="2.6" ry="6.2" fill="${lining}" stroke="${INK}" stroke-width="0.6"/></g>
    <g transform="translate(${n(hand.x)},${n(hand.y)}) rotate(${n(ang)}) scale(${k.toFixed(4)})"><path d="M-3,-4 Q4,-5.5 5.5,-1 Q6,3 2,4.5 Q-3,4.5 -3.5,0 Z" fill="${skin}" stroke="${INK}" stroke-width="0.6"/><path d="M0,-4.5 Q3,-2 2,0" stroke="${INK}" stroke-width="0.5" fill="none"/></g>`;
  const jar = { x: 34, y: -160 }, staffX = 26;
  const cord = (y, sw) => `<path d="M${staffX - 1.8},${y} L${staffX + 1.8},${y + 1} M${staffX - 1.8},${y + 1.6} L${staffX + 1.8},${y + 2.6}" stroke="#d6b071" stroke-width="0.9"/><path d="M${staffX + 1.8},${y + 1.5} Q${n(staffX + 3 + sw)},${y + 7} ${n(staffX + 2 + sw * 1.5)},${y + 12}" stroke="#c9463e" stroke-width="0.8" fill="none"/><circle cx="${n(staffX + 2 + sw * 1.5)}" cy="${y + 12.5}" r="1" fill="#c9463e" stroke="none"/>`;
  const sw = Math.sin(t * 2.3) * 1.2;
  const svg = shadow(p, 0.46) + `<g transform="${place(p)}"><circle cx="${jar.x}" cy="${jar.y + 4}" r="${n(14 + 50 * fl)}" fill="url(#flame)"/></g><g class="ol" transform="${place(p)}">
    <path d="M-12,-1 Q-12,-5 -7,-5 L-2,-5 L-2,-1 Z" fill="#3a2a2a"/>
    <path d="M0,-100 Q-14,-98 -20,-84 Q-31,-44 -40,-3 Q0,2.5 40,-3 Q31,-44 20,-84 Q14,-98 0,-100 Z" fill="${cloak}"/>
    <path d="M3,-99 Q14,-97 20,-84 Q31,-44 40,-3 Q28,-0.8 15,-0.3 Q16,-50 3,-99 Z" fill="${cloakS}" stroke="none"/>
    <path d="M-10,-60 Q-14,-30 -17,-3 M-24,-46 Q-28,-24 -31,-4 M7,-56 Q9,-30 10,-2 M24,-40 Q27,-20 30,-3" stroke="#1c1f48" stroke-width="0.8" fill="none"/>
    <path d="M-40,-3 Q0,2.5 40,-3 L39,-7.5 Q0,-2 -39,-7.5 Z" fill="${lining}"/>
    <path d="M-5,-92 Q-12,-50 -18,-3.5 L-10,-2.5 Q-4.5,-50 -1,-91 Z" fill="${lining}"/>
    <path d="M-1,-91 Q-4.5,-50 -10,-2.5 L-4,-2 Q-0.5,-50 2,-90 Z" fill="#232758"/>
    <path d="M-19,-90 Q0,-80 19,-90 Q17,-101 0,-104 Q-17,-101 -19,-90 Z" fill="#363a7d"/><path d="M-15,-90 Q0,-82.5 15,-90" stroke="${lining}" stroke-width="1.2" fill="none"/>
    <rect x="${staffX - 1.8}" y="-150" width="3.6" height="150" rx="1.4" fill="url(#wood)"/>
    <path d="M${staffX},-150 Q${staffX},-160 ${jar.x - 3},-163 L${jar.x},-163" stroke="#4e2f1d" stroke-width="2.4" fill="none"/>
    ${cord(-128, sw)}${cord(-60, sw * 0.6)}
    ${limb([[13, -93], [21, -84], [24, -76]], 7, cloakS)}
    <path d="M21,-79 Q26,-82 29,-78 Q29,-73 25,-72 Q21,-73 21,-79 Z" fill="${skin}"/>
    <path d="M${jar.x},-163 L${jar.x},-158" stroke="#3a2a2a" stroke-width="0.8"/>
    <path d="M${jar.x - 6},-156 Q${jar.x - 7.5},-150 ${jar.x - 6},-142 Q${jar.x},-139.5 ${jar.x + 6},-142 Q${jar.x + 7.5},-150 ${jar.x + 6},-156 Z" fill="#cfe6ff" opacity="0.35" stroke="#e9f3ff" stroke-width="0.8"/>
    <path d="M${jar.x - 6.5},-159 L${jar.x + 6.5},-159 L${jar.x + 6},-156 L${jar.x - 6},-156 Z" fill="#3a2a2a"/>
    <path d="M${jar.x - 1.4},-143 L${jar.x + 1.4},-143 L${jar.x + 1.4},-148 L${jar.x - 1.4},-148 Z" fill="#fff4e0"/>
    <path d="M${jar.x},${n(-148 - 8 * fl)} Q${n(jar.x + 2.8 * fl)},${n(-149 - 2 * fl)} ${jar.x},-148 Q${n(jar.x - 2.8 * fl)},${n(-149 - 2 * fl)} ${jar.x},${n(-148 - 8 * fl)} Z" fill="#ffd36a" stroke="#ff9a3a" stroke-width="0.4"/>
    <path d="M-3,-101 L3,-101 L2.5,-98 L-2.5,-98 Z" fill="#d7ab8a"/>
    <path d="${headPath(hx, hy, 10.5, 11.5, fx, 0.98)}" fill="${skin}"/>
    <path d="M${n(hx + 8.6)},${n(hy - 1)} q3,0.5 2.2,4.6 q-1,1.6 -2.6,0.8" fill="${skin}"/>
    <path d="M${n(hx - 11)},${n(hy - 1)} Q${n(hx - 12.5)},${n(hy - 15)} ${n(hx + 1)},${n(hy - 15)} Q${n(hx + 12.5)},${n(hy - 15)} ${n(hx + 11)},${n(hy - 1)} L${n(hx + 9.8)},${n(hy + 2)} Q${n(hx + 8.5)},${n(hy - 8)} ${n(hx + 2)},${n(hy - 9.5)} Q${n(hx - 6)},${n(hy - 10)} ${n(hx - 10)},${n(hy + 2)} Z" fill="${white}"/>
    <path d="M${n(hx - 6)},${n(hy - 13)} Q${n(hx)},${n(hy - 11)} ${n(hx + 6)},${n(hy - 13.5)} M${n(hx - 9)},${n(hy - 8)} Q${n(hx - 6)},${n(hy - 11)} ${n(hx - 2)},${n(hy - 11.5)}" stroke="#c9c1b3" stroke-width="0.6" fill="none"/>
    <circle cx="${n(hx + 4)}" cy="${n(hy - 17)}" r="6.2" fill="${white}"/><path d="M${n(hx + 0)},${n(hy - 19)} Q${n(hx + 4)},${n(hy - 14)} ${n(hx + 8.5)},${n(hy - 18)}" stroke="#c9c1b3" stroke-width="0.6" fill="none"/>
    <path d="M${n(hx - 1.5)},${n(hy - 15)} Q${n(hx + 4)},${n(hy - 12.5)} ${n(hx + 10)},${n(hy - 16)}" stroke="#d8443a" stroke-width="1.4" fill="none" stroke-linecap="round"/>
    <path d="M${n(hx + 6)},${n(hy - 22)} L${n(hx + 13)},${n(hy - 26)}" stroke="#4e2f1d" stroke-width="1.1" stroke-linecap="round"/>
    <path d="M${n(ex - 7)},${n(hy - 6.5 + browD)} Q${n(ex - 4.5)},${n(hy - 8)} ${n(ex - 1.5)},${n(hy - 6.5 - browD)} M${n(ex + 1.5)},${n(hy - 6.5 - browD)} Q${n(ex + 4.5)},${n(hy - 8)} ${n(ex + 7)},${n(hy - 6.5 + browD)}" stroke="#d9d2c4" stroke-width="1.2" fill="none" stroke-linecap="round"/>
    ${eyes}
    <path d="M${n(ex - 7.2)},${n(hy - 2.5)} l-1.4,-0.8 M${n(ex - 7.2)},${n(hy - 1.3)} l-1.5,0.3 M${n(ex + 7.4)},${n(hy - 2.5)} l1.3,-0.8" stroke="#a8806a" stroke-width="0.5"/>
    <path d="M${n(ex + fx * 1.2)},${n(hy)} q${n(fx * 1.8)},3 ${n(-fx * 0.4)},3.8" stroke="#b07e64" stroke-width="0.8" fill="none" stroke-linecap="round"/>
    <path d="M${n(ex - 5)},${n(hy + 3)} Q${n(ex - 5.5)},${n(hy + 6)} ${n(ex - 3.5)},${n(hy + 7.5)} M${n(ex + 4)},${n(hy + 3)} Q${n(ex + 4.5)},${n(hy + 6)} ${n(ex + 3)},${n(hy + 7.5)}" stroke="#c09078" stroke-width="0.5" fill="none"/>
    <path d="M${n(ex - 2.2)},${n(hy + 7)} Q${n(ex)},${n(hy + (stern > 0.5 ? 6.2 : 8.2))} ${n(ex + 2.2)},${n(hy + 7)}" stroke="#7a4a3a" stroke-width="0.9" fill="none" stroke-linecap="round"/>
    <ellipse cx="${n(ex - 6.5)}" cy="${n(hy + 4)}" rx="2.2" ry="1.2" fill="#e08a80" opacity="0.4" stroke="none"/>
  </g>`;
  return { svg, arm };
}

// ---------------------------------------------------------------- foreground: an out-of-focus cherry branch + falling petals
const petal = (x, y, r, rot, col) => `<path d="M0,${n(-r)} Q${n(r * 0.9)},${n(-r * 0.4)} ${n(r * 0.35)},${n(r * 0.8)} L0,${n(r * 0.55)} L${n(-r * 0.35)},${n(r * 0.8)} Q${n(-r * 0.9)},${n(-r * 0.4)} 0,${n(-r)} Z" fill="${col}" transform="translate(${n(x)},${n(y)}) rotate(${n(rot)})"/>`;
function near(c, t) {
  const z = 1 + c.z * 0.6, cx = W / 2, cy = 1000;
  const T = (x, y) => ({ x: cx + (x - cx) * z, y: cy + (y - cy) * z });
  let s = `<g filter="url(#dof)">`;
  const br = [[-60, 330], [90, 300], [230, 250], [330, 215], [470, 160], [560, 140]].map(([x, y]) => T(x, y));
  s += `<path d="M${n(br[0].x)},${n(br[0].y)} C${n(br[1].x)},${n(br[1].y)} ${n(br[2].x)},${n(br[2].y + 20)} ${n(br[3].x)},${n(br[3].y)} S${n(br[4].x)},${n(br[4].y)} ${n(br[5].x)},${n(br[5].y)}" stroke="#20132a" stroke-width="${n(22 * z)}" fill="none" stroke-linecap="round"/>`;
  const tw = [[[200, 262], [280, 330], [330, 345]], [[120, 290], [150, 210], [190, 180]], [[380, 200], [430, 255]]];
  for (const tws of tw) { const q = tws.map(([x, y]) => T(x, y)); s += `<path d="M${q.map((p) => `${n(p.x)},${n(p.y)}`).join(" L")}" stroke="#20132a" stroke-width="${n(9 * z)}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`; }
  const blossoms = [[110, 285], [175, 205], [200, 250], [260, 300], [300, 225], [330, 345], [400, 190], [430, 255], [470, 165], [520, 150], [60, 315], [240, 240], [365, 210], [150, 180], [290, 330]];
  blossoms.forEach(([x, y], i) => {
    const q = T(x, y), r = (17 + 9 * hash(i + 3)) * z, rot = hash(i) * 72 + Math.sin(t * 1.4 + i) * 5;
    let f = "";
    for (let k = 0; k < 5; k++) f += `<path d="M0,0 Q${n(-r * 0.55)},${n(-r * 0.6)} ${n(-r * 0.18)},${n(-r)} L0,${n(-r * 0.85)} L${n(r * 0.18)},${n(-r)} Q${n(r * 0.55)},${n(-r * 0.6)} 0,0 Z" fill="${i % 3 ? "#f6b3c6" : "#fbd3de"}" transform="rotate(${k * 72})"/>`;
    s += `<g transform="translate(${n(q.x)},${n(q.y)}) rotate(${n(rot)})">${f}<circle r="${n(r * 0.24)}" fill="#d9557c"/></g>`;
  });
  s += `</g>`;
  for (let i = 0; i < 22; i++) {
    const sp = 100 + 90 * hash(i + 20), y = ((t * sp + hash(i + 40) * 2200) % 2200) - 120, x = hash(i + 60) * 1180 - 50 + 40 * Math.sin(t * 1.3 + i * 2.1) - t * 25;
    s += petal(x, y, 6 + 7 * hash(i + 80), t * 140 * (hash(i) - 0.5) + i * 40, i % 3 ? "#f7b6c8" : "#fdd8e2");
  }
  return s;
}

export function draw(t) {
  const c = camera(t);
  const L = lamp(c, t), k = kid(c, t), kp = keeper(c, t, k.sleeve);
  // the lamp's light laid over the whole picture (screen blend), flickering with the lamp
  const light = `<radialGradient id="lampL" gradientUnits="userSpaceOnUse" cx="${n(L.head.x)}" cy="${n(L.head.y + 120)}" r="${n(4.2 * L.head.s)}"><stop offset="0" stop-color="#ffb35c" stop-opacity="${n(0.32 * L.fl)}"/><stop offset="1" stop-color="#ff8a4a" stop-opacity="0"/></radialGradient>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${DEFS}<defs>${light}</defs>
    <g filter="url(#haze)">${sky(c, t)}${far(c)}</g>${ground(c, t)}${houses(c, t, -1)}${houses(c, t, 1)}${vending(c, t)}
    ${L.s}${woman(c, t)}${k.svg}${kp.svg}${kp.arm}
    <rect width="${W}" height="${H}" fill="url(#lampL)" style="mix-blend-mode:screen"/>
    ${near(c, t)}
    <rect width="${W}" height="${H}" fill="url(#vig)"/></svg>`;
}
