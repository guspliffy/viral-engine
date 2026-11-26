// Legend channel, code-only look proof (26 Nov 2026): the Japan beat drawn and animated entirely in code, flat vector.
// The curious kid leans toward the masked woman under the lamp, the keeper's candle shrinks, she grabs his sleeve,
// he turns back shocked, the woman turns to us and her eyes smile above the mask.
//   node tools/svg2d/render.mjs tools/svg2d/scenes/legend-japan.mjs out/legend-svg-japan.mp4
export const W = 1080, H = 1920, FPS = 30, DUR = 5.0;
export const MUSIC = "assets/music/ai/orchestra-suspense/orchestra-suspense-01.ogg", GAIN = 0.5;

const F = 1300, H0 = 1140;                       // focal length px, horizon line
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
// keys [[t, v, ease?], ...]
function tr(keys, t) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1], b = keys[i];
    if (t <= b[0]) return lerp(a[1], b[1], ease((t - a[0]) / (b[0] - a[0]), b[2]));
  }
  return keys[keys.length - 1][1];
}
const hash = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const blink = (t, times) => times.some((b) => t >= b && t < b + 0.1);

// ---------------------------------------------------------------- camera: a slow dolly in
function camera(t) { const u = ease(t / DUR); return { x: lerp(0.12, 0.02, u), y: lerp(1.3, 1.24, u), z: lerp(0, 0.45, u) }; }
function P(c, X, Y, Z) { const s = F / (Z - c.z); return { x: W / 2 + (X - c.x) * s, y: H0 + (c.y - Y) * s, s }; }
const pts = (a) => a.map((p) => `${n(p.x)},${n(p.y)}`).join(" ");
const poly = (a, fill, extra = "") => `<polygon points="${pts(a)}" fill="${fill}" ${extra}/>`;
// a point inside a quad (a b c d, u along a->b, v along a->d)
const quadPt = (q, u, v) => { const top = { x: lerp(q[0].x, q[1].x, u), y: lerp(q[0].y, q[1].y, u) }, bot = { x: lerp(q[3].x, q[2].x, u), y: lerp(q[3].y, q[2].y, u) }; return { x: lerp(top.x, bot.x, v), y: lerp(top.y, bot.y, v) }; };
const sub = (q, u0, u1, v0, v1) => [quadPt(q, u0, v0), quadPt(q, u1, v0), quadPt(q, u1, v1), quadPt(q, u0, v1)];

const DEFS = `<defs>
  <style>.ol > :not([stroke]) { stroke: #1b1430; stroke-width: 0.85; stroke-linejoin: round; }</style>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d0c2e"/><stop offset="0.45" stop-color="#2a2266"/><stop offset="0.72" stop-color="#6a3f8f"/><stop offset="1" stop-color="#d0748e"/></linearGradient>
  <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b2352"/><stop offset="1" stop-color="#4a3c7c"/></linearGradient>
  <linearGradient id="fog" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9a7cc4" stop-opacity="0"/><stop offset="0.5" stop-color="#9a7cc4" stop-opacity="0.28"/><stop offset="1" stop-color="#9a7cc4" stop-opacity="0"/></linearGradient>
  <radialGradient id="warm"><stop offset="0" stop-color="#ffd58a" stop-opacity="0.75"/><stop offset="0.35" stop-color="#ffb35c" stop-opacity="0.3"/><stop offset="1" stop-color="#ff9a4a" stop-opacity="0"/></radialGradient>
  <radialGradient id="pool"><stop offset="0" stop-color="#ffcf86" stop-opacity="0.55"/><stop offset="1" stop-color="#ffb060" stop-opacity="0"/></radialGradient>
  <radialGradient id="red"><stop offset="0" stop-color="#ff6a50" stop-opacity="0.5"/><stop offset="1" stop-color="#ff4a3a" stop-opacity="0"/></radialGradient>
  <radialGradient id="cool"><stop offset="0" stop-color="#bfe8ff" stop-opacity="0.45"/><stop offset="1" stop-color="#8fd0ff" stop-opacity="0"/></radialGradient>
  <radialGradient id="moon"><stop offset="0" stop-color="#fff3d2" stop-opacity="0.4"/><stop offset="1" stop-color="#fff3d2" stop-opacity="0"/></radialGradient>
  <radialGradient id="flame"><stop offset="0" stop-color="#fff1b8" stop-opacity="0.95"/><stop offset="0.3" stop-color="#ffc35a" stop-opacity="0.45"/><stop offset="1" stop-color="#ff9a3a" stop-opacity="0"/></radialGradient>
  <radialGradient id="vig" cx="0.5" cy="0.48" r="0.75"><stop offset="0.55" stop-color="#05030f" stop-opacity="0"/><stop offset="1" stop-color="#05030f" stop-opacity="0.6"/></radialGradient>
</defs>`;

// ---------------------------------------------------------------- set
function sky(c) {
  let s = `<rect width="${W}" height="${H}" fill="url(#sky)"/>`;
  for (let i = 0; i < 46; i++) {
    const x = hash(i) * W, y = hash(i + 50) * 760, r = 1.2 + hash(i + 99) * 2.2;
    s += `<circle cx="${n(x - c.x * 8)}" cy="${n(y)}" r="${n(r)}" fill="#fff6e0" opacity="${n(0.35 + 0.5 * hash(i + 7))}"/>`;
  }
  const mx = 770 - c.x * 20, my = 300;
  s += `<circle cx="${n(mx)}" cy="${my}" r="190" fill="url(#moon)"/><circle cx="${n(mx)}" cy="${my}" r="66" fill="#fff1cc"/><circle cx="${n(mx + 22)}" cy="${my - 14}" r="11" fill="#f2e2b8"/><circle cx="${n(mx - 18)}" cy="${my + 20}" r="7" fill="#f2e2b8"/>`;
  return s;
}
function far(c) {
  // hills and a pagoda at the end of the street
  const hill = `M0,${H0 + 10} Q180,${H0 - 70} 360,${H0 - 20} T720,${H0 - 40} T1080,${H0 - 10} L1080,${H0 + 60} L0,${H0 + 60} Z`;
  let s = `<path d="${hill}" fill="#30276a" transform="translate(${n(-c.x * 15)},0)"/>`;
  const b = P(c, -7, 0, 70), k = b.s;
  const tiers = [[0, 9, 4.5], [5.5, 7.6, 3.8], [10, 6.4, 3.2], [14, 5.2, 2.7], [17.6, 4.2, 2.3]];
  for (const [y0, w, h] of tiers) {
    const y = b.y - y0 * k;
    s += `<rect x="${n(b.x - w * 0.32 * k)}" y="${n(y - h * k)}" width="${n(w * 0.64 * k)}" height="${n(h * k)}" fill="#231c55"/>`;
    s += `<path d="M${n(b.x - w / 2 * k - 1.2 * k)},${n(y - h * k + 0.4 * k)} Q${n(b.x - w / 2 * k)},${n(y - h * k - 0.2 * k)} ${n(b.x - w * 0.2 * k)},${n(y - h * k - 1.2 * k)} L${n(b.x + w * 0.2 * k)},${n(y - h * k - 1.2 * k)} Q${n(b.x + w / 2 * k)},${n(y - h * k - 0.2 * k)} ${n(b.x + w / 2 * k + 1.2 * k)},${n(y - h * k + 0.4 * k)} Z" fill="#1b1546"/>`;
    s += `<rect x="${n(b.x - 0.5 * k)}" y="${n(y - h * 0.7 * k)}" width="${n(k)}" height="${n(h * 0.35 * k)}" fill="#ffb867" opacity="0.8"/>`;
  }
  s += `<rect x="${n(b.x - 0.15 * k)}" y="${n(b.y - 25 * k)}" width="${n(0.3 * k)}" height="${n(5 * k)}" fill="#1b1546"/>`;
  s += `<rect width="${W}" height="520" y="${H0 - 330}" fill="url(#fog)"/>`;
  return s;
}
function ground(c) {
  let s = `<rect x="0" y="${H0}" width="${W}" height="${H - H0}" fill="url(#ground)"/>`;
  // stone slabs: lines across and along
  for (let z = 3; z < 40; z *= 1.16) {
    const a = P(c, -2.1, 0, z), b = P(c, 2.0, 0, z);
    s += `<line x1="${n(a.x)}" y1="${n(a.y)}" x2="${n(b.x)}" y2="${n(b.y)}" stroke="#5a4a8e" stroke-width="${n(Math.max(1, 0.025 * a.s))}" opacity="0.55"/>`;
  }
  for (const x of [-1.2, -0.4, 0.4, 1.2]) {
    const a = P(c, x, 0, 2.2), b = P(c, x, 0, 40);
    s += `<line x1="${n(a.x)}" y1="${n(a.y)}" x2="${n(b.x)}" y2="${n(b.y)}" stroke="#5a4a8e" stroke-width="3" opacity="0.35"/>`;
  }
  return s;
}
const LEFT = [[5.2, 9.2, 3.5, "#43356f"], [9.2, 13.6, 3.0, "#3b2e66"], [13.6, 18.4, 3.7, "#46387a"], [18.4, 24.5, 3.1, "#3b2e66"], [24.5, 33, 3.4, "#43356f"], [33, 48, 3.0, "#3b2e66"]];
const RIGHT = [[7.4, 11.5, 3.2, "#3d3069"], [11.5, 16.5, 3.8, "#463878"], [16.5, 22, 3.0, "#3d3069"], [22, 30, 3.5, "#43356f"], [30, 48, 3.1, "#3d3069"]];
function houses(c, t, side) {
  const X = side < 0 ? -2.3 : 2.1, list = side < 0 ? LEFT : RIGHT, eave = X - side * 0.6, back = X + side * 1.4;
  let s = "";
  for (let i = list.length - 1; i >= 0; i--) {
    const [z0, z1, h, col] = list[i];
    s += poly([P(c, X, h, z0), P(c, X, h, z1), P(c, back, h + 1.3, z1), P(c, back, h + 1.3, z0)], "#1d1740");
    const wall = [P(c, X, h, z0), P(c, X, h, z1), P(c, X, 0, z1), P(c, X, 0, z0)];
    s += poly(wall, col);
    // a wooden beam line and a lit shoji window
    s += poly(sub(wall, 0, 1, 0.42, 0.46), "#2c2252");
    const w0 = 0.18, w1 = Math.min(0.78, w0 + 1.6 / (z1 - z0));
    const win = sub(wall, w0, w1, 0.5, 0.78);
    s += poly(win, "#ffc46b");
    for (const u of [0.25, 0.5, 0.75]) s += poly(sub(win, u - 0.015, u + 0.015, 0, 1), "#c98a3c");
    s += poly(sub(win, 0, 1, 0.48, 0.53), "#c98a3c");
    s += poly(sub(wall, 0, 1, 0, 0.06), "#2a2150");   // shadow under the eave
    s += poly([P(c, X, h, z0), P(c, X, h, z1), P(c, eave, h - 0.35, z1), P(c, eave, h - 0.35, z0)], "#251d4c");
    // a red paper lantern under the eave
    if (i % 2 === 0) {
      const sw = Math.sin(t * 1.7 + i) * 4, L = P(c, X - side * 0.45, h - 0.85, z0 + 0.6), r = L.s;
      s += `<circle cx="${n(L.x)}" cy="${n(L.y)}" r="${n(0.9 * r)}" fill="url(#red)"/>`;
      s += `<g transform="translate(${n(L.x)},${n(L.y)}) rotate(${n(sw)})"><line x1="0" y1="${n(-0.5 * r)}" x2="0" y2="${n(-0.25 * r)}" stroke="#1d1740" stroke-width="${n(0.02 * r)}"/><ellipse rx="${n(0.17 * r)}" ry="${n(0.24 * r)}" fill="#e0463d"/><ellipse rx="${n(0.17 * r)}" ry="${n(0.24 * r)}" fill="none" stroke="#b2302e" stroke-width="${n(0.015 * r)}" transform="scale(0.55,1)"/><rect x="${n(-0.09 * r)}" y="${n(-0.27 * r)}" width="${n(0.18 * r)}" height="${n(0.05 * r)}" fill="#2a1f3a"/><rect x="${n(-0.09 * r)}" y="${n(0.22 * r)}" width="${n(0.18 * r)}" height="${n(0.05 * r)}" fill="#2a1f3a"/></g>`;
    }
  }
  return s;
}
function vending(c) {
  const X = 1.75, z0 = 6.6, z1 = 7.5;
  const front = [P(c, X, 1.85, z0), P(c, X, 1.85, z1), P(c, X, 0, z1), P(c, X, 0, z0)];
  const g = P(c, X - 0.4, 0, (z0 + z1) / 2);
  let s = `<ellipse cx="${n(g.x)}" cy="${n(g.y)}" rx="${n(1.3 * g.s)}" ry="${n(0.3 * g.s)}" fill="url(#cool)"/>`;
  s += poly([P(c, X, 1.85, z0), P(c, X + 0.6, 1.85, z0), P(c, X + 0.6, 0, z0), P(c, X, 0, z0)], "#9e2230");
  s += poly(front, "#d6343f");
  const shop = sub(front, 0.1, 0.9, 0.08, 0.55);
  s += poly(shop, "#e9f6ff");
  const cols = ["#4fb3e8", "#f2c641", "#7ad18a", "#f07a5a", "#a98ce0"];
  for (let r = 0; r < 3; r++) for (let k = 0; k < 5; k++) s += poly(sub(shop, 0.08 + k * 0.17, 0.18 + k * 0.17, 0.12 + r * 0.3, 0.32 + r * 0.3), cols[(k + r) % 5]);
  s += poly(sub(front, 0.15, 0.85, 0.82, 0.9), "#2a1626");
  return s;
}
function lamp(c, t) {
  const fl = 1 - 0.55 * Math.max(0, Math.sin(Math.PI * clamp((t - 4.05) / 0.12))) - 0.45 * Math.max(0, Math.sin(Math.PI * clamp((t - 4.3) / 0.1)));
  const foot = P(c, -1.7, 0, 6.3), top = P(c, -1.7, 3.05, 6.3), head = P(c, -1.7, 2.85, 6.3), k = foot.s;
  const pool = P(c, -1.4, 0, 6.0), pz = P(c, -1.4, 0, 4.9);
  let s = `<ellipse cx="${n(pool.x)}" cy="${n(pool.y)}" rx="${n(1.7 * pool.s)}" ry="${n(Math.max(20, pz.y - pool.y))}" fill="url(#pool)" opacity="${n(fl)}"/>`;
  s += `<rect x="${n(foot.x - 0.05 * k)}" y="${n(top.y)}" width="${n(0.1 * k)}" height="${n(foot.y - top.y)}" fill="#1a1536"/>`;
  s += `<rect x="${n(foot.x - 0.1 * k)}" y="${n(foot.y - 0.25 * k)}" width="${n(0.2 * k)}" height="${n(0.25 * k)}" fill="#1a1536"/>`;
  s += `<circle cx="${n(head.x)}" cy="${n(head.y)}" r="${n(1.6 * k)}" fill="url(#warm)" opacity="${n(fl)}"/>`;
  s += `<rect x="${n(head.x - 0.17 * k)}" y="${n(head.y - 0.22 * k)}" width="${n(0.34 * k)}" height="${n(0.44 * k)}" rx="${n(0.03 * k)}" fill="${fl > 0.7 ? "#ffe6a6" : "#c79a5a"}"/>`;
  s += `<rect x="${n(head.x - 0.17 * k)}" y="${n(head.y - 0.22 * k)}" width="${n(0.34 * k)}" height="${n(0.44 * k)}" rx="${n(0.03 * k)}" fill="none" stroke="#1a1536" stroke-width="${n(0.035 * k)}"/>`;
  s += `<line x1="${n(head.x)}" y1="${n(head.y - 0.22 * k)}" x2="${n(head.x)}" y2="${n(head.y + 0.22 * k)}" stroke="#1a1536" stroke-width="${n(0.02 * k)}"/>`;
  s += `<path d="M${n(head.x - 0.24 * k)},${n(head.y - 0.22 * k)} L${n(head.x)},${n(head.y - 0.36 * k)} L${n(head.x + 0.24 * k)},${n(head.y - 0.22 * k)} Z" fill="#1a1536"/>`;
  return { s, fl };
}

// ---------------------------------------------------------------- cast (local units: cm, feet at 0, up = -y)
const place = (p, rot = 0) => `translate(${n(p.x)},${n(p.y)}) rotate(${n(rot)}) scale(${(p.s / 100).toFixed(4)})`;
function toScreen(p, rot, lx, ly) { const a = rot * Math.PI / 180, k = p.s / 100; return { x: p.x + k * (lx * Math.cos(a) - ly * Math.sin(a)), y: p.y + k * (lx * Math.sin(a) + ly * Math.cos(a)) }; }
const shadow = (p, w) => `<ellipse cx="${n(p.x)}" cy="${n(p.y)}" rx="${n(w * p.s)}" ry="${n(w * 0.22 * p.s)}" fill="#120d2a" opacity="0.45"/>`;

function woman(c, t, lampFl) {
  const p = P(c, -1.2, 0, 5.9);
  const turn = tr([[3.2, 0], [4.4, 1]], t), fx = 6 * (1 - turn), smile = tr([[4.35, 0], [4.6, 1]], t);
  const skin = "#f0d6c6", hair = "#141023";
  const eye = (x, far) => {
    const rx = far ? lerp(1.2, 1.9, turn) : 1.9;
    if (smile > 0.5) return `<path d="M${n(x - 2.4)},-157 Q${n(x)},${n(-161.5)} ${n(x + 2.4)},-157" stroke="#1b1426" stroke-width="1.3" fill="none" stroke-linecap="round"/>`;
    return `<ellipse cx="${n(x)}" cy="-158" rx="${n(rx)}" ry="2.3" fill="#1b1426"/><circle cx="${n(x + 0.6)}" cy="-158.8" r="0.6" fill="#fff" stroke="none"/>`;
  };
  return shadow(p, 0.32) + `<g class="ol" transform="${place(p)}">
    <path d="M${n(-17 - fx * 0.5)},-170 Q${n(-25 - fx * 0.5)},-138 ${n(-20 - fx * 0.3)},-96 L${n(17 - fx * 0.3)},-96 Q${n(22 - fx * 0.5)},-138 ${n(15 - fx * 0.5)},-170 Z" fill="${hair}"/>
    <rect x="-10" y="-48" width="7" height="46" fill="#2a2238"/><rect x="3" y="-48" width="7" height="46" fill="#2a2238"/>
    <ellipse cx="-6.5" cy="-1.5" rx="6" ry="2.6" fill="#120e1c"/><ellipse cx="7" cy="-1.5" rx="6" ry="2.6" fill="#120e1c"/>
    <path d="M-14,-140 L14,-140 L26,-44 Q0,-39 -26,-44 Z" fill="#d9c19b"/>
    <path d="M4,-140 L14,-140 L26,-44 Q16,-41 8,-40 Z" fill="#c4a87f" stroke="none"/>
    <rect x="-20" y="-99" width="40" height="5" fill="#a88b62"/><rect x="-3" y="-100" width="6" height="7" fill="#7d6646"/>
    <path d="M-9,-140 L0,-112 L9,-140 Z" fill="#ead6b4"/><path d="M-4,-140 L0,-128 L4,-140 Z" fill="#2a2238"/>
    <path d="M-14,-136 Q-23,-112 -22,-80 L-15,-80 Q-16,-110 -9,-130 Z" fill="#cbb08a"/><circle cx="-18.5" cy="-77" r="3.6" fill="${skin}"/>
    <path d="M14,-136 Q23,-112 22,-80 L15,-80 Q16,-110 9,-130 Z" fill="#b99c74"/><circle cx="18.5" cy="-77" r="3.6" fill="${skin}"/>
    <rect x="-4" y="-148" width="8" height="10" fill="#e2c3b0"/>
    <ellipse cx="${n(fx * 0.3)}" cy="-157" rx="12.5" ry="15" fill="${skin}"/>
    <path d="M${n(-13.5 + fx * 0.2)},-156 Q${n(-14 + fx * 0.2)},-175 ${n(fx * 0.4)},-174 Q${n(14 + fx * 0.2)},-175 ${n(13.5 + fx * 0.2)},-156 L${n(10 + fx * 0.6)},-162 L${n(-10 + fx * 0.6)},-162 Z" fill="${hair}"/>
    <path d="M${n(-13.5 + fx * 0.2)},-160 L${n(-15 + fx * 0.1)},-118 L${n(-10 + fx * 0.2)},-118 L${n(-10.5 + fx * 0.3)},-152 Z" fill="${hair}"/>
    <path d="M${n(13.5 + fx * 0.2)},-160 L${n(15 + fx * 0.1)},-118 L${n(10 + fx * 0.2)},-118 L${n(10.5 + fx * 0.3)},-152 Z" fill="${hair}"/>
    ${eye(-4.6 + fx, false)}${eye(4.6 + fx, true)}
    <path d="M${n(-9.8 + fx * 0.6)},-153 Q${n(fx * 0.7)},-155.5 ${n(9.8 + fx * 0.6)},-153 L${n(9 + fx * 0.6)},-145 Q${n(fx * 0.7)},-140.5 ${n(-9 + fx * 0.6)},-145 Z" fill="#f6f4ee"/>
    <path d="M${n(-8 + fx * 0.6)},-150 Q${n(fx * 0.7)},-151.5 ${n(8 + fx * 0.6)},-150 M${n(-8 + fx * 0.6)},-147 Q${n(fx * 0.7)},-148.5 ${n(8 + fx * 0.6)},-147" stroke="#d6d2c8" stroke-width="0.6" fill="none"/>
  </g>`;
}

function kid(c, t) {
  const pull = tr([[2.42, 0], [2.6, 0.06, "out"], [3.4, 0.03]], t);
  const p = P(c, -0.08 + pull, 0, 3.7);
  const lean = tr([[0.6, 0], [1.6, -9], [2.38, -9], [2.62, 4, "out"], [3.2, 0]], t);
  const shock = tr([[2.38, 0], [2.5, 1, "out"]], t), hop = Math.sin(Math.PI * clamp((t - 2.4) / 0.25)) * 5;
  const fx = lerp(-6, 5, shock), blinkNow = blink(t, [1.2, 3.9]);
  const skin = "#f7d3b5", tug = shock * 4;
  const eyes = [-7 + fx, 7 + fx].map((x, i) => {
    if (blinkNow) return `<path d="M${n(x - 3)},-97 Q${n(x)},-95 ${n(x + 3)},-97" stroke="#20182c" stroke-width="1.2" fill="none"/>`;
    const ry = lerp(4, 4.6, shock), rx = (i === 0 && shock < 0.5) || (i === 1 && shock >= 0.5) ? 3 : 2.5;
    return (shock > 0.3 ? `<ellipse cx="${n(x)}" cy="-98" rx="${n(rx + 1.6)}" ry="${n(ry + 1.4)}" fill="#fff" stroke="#1b1430" stroke-width="0.6"/>` : "") + `<ellipse cx="${n(x)}" cy="-98" rx="${n(rx * lerp(1, 0.65, shock))}" ry="${n(ry * lerp(1, 0.7, shock))}" fill="#20182c"/><circle cx="${n(x + 1)}" cy="-99.5" r="1.1" fill="#fff" stroke="none"/>`;
  }).join("");
  const mouth = shock > 0.4 ? `<ellipse cx="${n(fx * 0.9)}" cy="-86" rx="2.6" ry="3.4" fill="#5a2032"/>` : `<path d="M${n(fx * 0.9 - 2.5)},-87 Q${n(fx * 0.9)},-85 ${n(fx * 0.9 + 2.5)},-87" stroke="#5a2032" stroke-width="1.1" fill="none"/>`;
  const brows = shock > 0.4 ? `<path d="M${n(-10 + fx)},-108 L${n(-4 + fx)},-110 M${n(4 + fx)},-110 L${n(10 + fx)},-108" stroke="#1a1522" stroke-width="1.3"/>` : `<path d="M${n(-10 + fx)},-106 L${n(-4 + fx)},-107 M${n(4 + fx)},-107 L${n(10 + fx)},-106" stroke="#1a1522" stroke-width="1.2"/>`;
  const svg = shadow(P(c, -0.08 + pull, 0, 3.7), 0.24) + `<g class="ol" transform="${place(p, lean)} translate(0,${n(-hop)})">
    <rect x="-10" y="-31" width="8" height="29" fill="#efe0c2"/><rect x="2" y="-31" width="8" height="29" fill="#e3d1ae"/>
    <ellipse cx="-7" cy="-2" rx="6.5" ry="3" fill="#a8323a"/><ellipse cx="7" cy="-2" rx="6.5" ry="3" fill="#8f2a33"/>
    <path d="M${n(19)},-75 Q${n(25 + tug)},-62 ${n(23 + tug * 1.5)},-47 L${n(17 + tug)},-46 Q${n(18)},-60 ${n(14)},-70 Z" fill="#d7678c"/><circle cx="${n(20 + tug * 1.3)}" cy="-45" r="3.6" fill="${skin}"/>
    <path d="M-20,-78 Q-23,-42 -19,-29 L19,-29 Q23,-42 20,-78 Q0,-85 -20,-78 Z" fill="#ec7fa2"/>
    <path d="M8,-82 Q20,-80 20,-78 Q23,-42 19,-29 L9,-29 Q12,-50 8,-82 Z" fill="#d86c91" stroke="none"/>
    <path d="M-17,-70 L-5,-56 M-17,-56 L-5,-42 M5,-74 L17,-60 M5,-60 L17,-46 M-5,-74 L5,-64 M-5,-46 L5,-36" stroke="#f6a9c0" stroke-width="1.3"/>
    <path d="M-16,-80 Q0,-72 16,-80 L13,-74 Q0,-68 -13,-74 Z" fill="#d9668b"/>
    <line x1="${n(fx * 0.3)}" y1="-75" x2="${n(fx * 0.3)}" y2="-66" stroke="#7a3550" stroke-width="0.8"/><circle cx="${n(fx * 0.3)}" cy="-63" r="3.4" fill="#f3c33f"/><circle cx="${n(fx * 0.3)}" cy="-62" r="0.9" fill="#7a5a10"/>
    <path d="M-19,-75 Q-26,-62 -24,-47 L-18,-46 Q-18,-60 -14,-70 Z" fill="#ef8aab"/><circle cx="-21" cy="-45" r="3.6" fill="${skin}"/>
    <circle cx="${n(-fx * 2.6)}" cy="-99" r="4" fill="${skin}"/>
    <circle cx="${n(fx * 0.25)}" cy="-100" r="22" fill="${skin}"/>
    <path d="M${n(-22 + fx * 0.25)},-102 L${n(-27 + fx * 0.2)},-112 L${n(-18 + fx * 0.25)},-113 L${n(-21 + fx * 0.2)},-125 L${n(-9 + fx * 0.3)},-118 L${n(-6 + fx * 0.3)},-131 L${n(3 + fx * 0.3)},-120 L${n(10 + fx * 0.3)},-130 L${n(13 + fx * 0.3)},-117 L${n(24 + fx * 0.2)},-121 L${n(20 + fx * 0.25)},-111 L${n(27 + fx * 0.2)},-108 L${n(22 + fx * 0.25)},-102 Q${n(fx * 0.4)},-112 ${n(-22 + fx * 0.25)},-102 Z" fill="#1a1522"/>
    ${brows}${eyes}
    <ellipse cx="${n(-11 + fx)}" cy="-90" rx="3.4" ry="2" fill="#f2909f" opacity="0.6" stroke="none"/><ellipse cx="${n(11 + fx)}" cy="-90" rx="3.4" ry="2" fill="#f2909f" opacity="0.6" stroke="none"/>
    ${mouth}
  </g>`;
  return { svg, sleeve: toScreen(p, lean, 21 + tug * 0.8, -60 - hop), p };
}

function keeper(c, t, sleeve) {
  const p = P(c, 0.52, 0, 2.9);
  const fl = tr([[0.8, 1], [2.4, 0.35]], t) * (1 + 0.06 * Math.sin(t * 21) + 0.04 * Math.sin(t * 33 + 1));
  const stern = tr([[2.05, 0], [2.25, 1]], t), fx = -5, blinkNow = blink(t, [0.45, 3.6]);
  const skin = "#ebc6a6", cloak = "#2f2b70", lining = "#f2a93b";
  const eyes = [-8 + fx, 2 + fx].map((x) => blinkNow || stern < 0.5 ? `<path d="M${n(x - 2.4)},-127 Q${n(x)},${stern < 0.5 ? -129.5 : -126} ${n(x + 2.4)},-127" stroke="#2a1e2a" stroke-width="1.2" fill="none" stroke-linecap="round"/>` : `<circle cx="${n(x)}" cy="-127" r="1.7" fill="#2a1e2a"/>`).join("");
  const brows = stern > 0.5 ? `<path d="M${n(-11 + fx)},-134 L${n(-5 + fx)},-132 M${n(-1 + fx)},-132 L${n(5 + fx)},-134" stroke="#d9d3c6" stroke-width="1.6"/>` : `<path d="M${n(-11 + fx)},-133 L${n(-5 + fx)},-134 M${n(-1 + fx)},-134 L${n(5 + fx)},-133" stroke="#d9d3c6" stroke-width="1.6"/>`;
  // the grab arm: from her near shoulder to his sleeve (screen space), drawn over both
  const reach = tr([[2.0, 0], [2.42, 1, "back"]], t);
  const sh = toScreen(p, 0, -13, -108), rest = toScreen(p, 0, -20, -80);
  const hand = { x: lerp(rest.x, sleeve.x, reach), y: lerp(rest.y, sleeve.y, reach) }, k = p.s / 100;
  const elbow = { x: lerp(sh.x, hand.x, 0.5) - 4 * k, y: Math.max(sh.y, hand.y) + lerp(6, 10, reach) * k };
  const arm = `<path d="M${n(sh.x)},${n(sh.y)} Q${n(elbow.x)},${n(elbow.y)} ${n(hand.x)},${n(hand.y)}" stroke="#1b1430" stroke-width="${n(11.7 * k)}" stroke-linecap="round" fill="none"/><path d="M${n(sh.x)},${n(sh.y)} Q${n(elbow.x)},${n(elbow.y)} ${n(hand.x)},${n(hand.y)}" stroke="${cloak}" stroke-width="${n(10 * k)}" stroke-linecap="round" fill="none"/>
    <circle cx="${n(lerp(elbow.x, hand.x, 0.82))}" cy="${n(lerp(elbow.y, hand.y, 0.82))}" r="${n(5.4 * k)}" fill="${lining}" stroke="#1b1430" stroke-width="${n(0.85 * k)}"/>
    <circle cx="${n(hand.x)}" cy="${n(hand.y)}" r="${n(4.2 * k)}" fill="${skin}" stroke="#1b1430" stroke-width="${n(0.85 * k)}"/>`;
  const jar = { x: 30, y: -178 };
  const svg = shadow(p, 0.42) + `<g transform="${place(p)}"><circle cx="${jar.x}" cy="${jar.y}" r="${n(16 + 46 * fl)}" fill="url(#flame)"/></g><g class="ol" transform="${place(p)}">
    <path d="M0,-132 Q-8,-120 -14,-96 Q-30,-40 -46,-2 Q0,4 46,-2 Q30,-40 14,-96 Q8,-120 0,-132 Z" fill="${cloak}"/>
    <path d="M4,-130 Q14,-110 18,-92 Q30,-40 46,-2 Q30,1 16,1 Q14,-60 4,-130 Z" fill="#25225c" stroke="none"/>
    <path d="M-46,-2 Q0,4 46,-2 L44,-9 Q0,-3 -44,-9 Z" fill="${lining}"/>
    <path d="M-7,-110 Q-14,-50 -22,-4 L-12,-3 Q-6,-50 -2,-108 Z" fill="${lining}"/>
    <path d="M-1,-110 Q-4,-50 -9,-3 L-2,-3 Q1,-50 3,-108 Z" fill="#26235e"/>
    <path d="M14,-112 Q28,-104 30,-94 L23,-90 Q19,-100 10,-104 Z" fill="${cloak}"/>
    <rect x="28.2" y="-171" width="3.6" height="171" rx="1.5" fill="#7b4f31"/>
    <circle cx="27" cy="-93" r="4.2" fill="${skin}"/>
    <rect x="${jar.x - 8}" y="${jar.y - 10}" width="16" height="19" rx="4" fill="#cfe6ff" opacity="0.35" stroke="#e9f3ff" stroke-width="1"/>
    <rect x="${jar.x - 6}" y="${jar.y - 13}" width="12" height="4" rx="1" fill="#3a2a2a"/><rect x="${jar.x - 6}" y="${jar.y + 8}" width="12" height="3" rx="1" fill="#3a2a2a"/>
    <rect x="${jar.x - 1.6}" y="${jar.y + 1}" width="3.2" height="7" fill="#fff4e0"/>
    <path d="M${jar.x},${n(jar.y + 1 - 9 * fl)} Q${n(jar.x + 3.2 * fl)},${n(jar.y - 2 * fl)} ${jar.x},${jar.y + 1} Q${n(jar.x - 3.2 * fl)},${n(jar.y - 2 * fl)} ${jar.x},${n(jar.y + 1 - 9 * fl)} Z" fill="#ffd36a"/>
    <path d="M-10,-114 Q0,-108 10,-114 L8,-109 Q0,-104 -8,-109 Z" fill="#26235e"/>
    <circle cx="${n(fx * 0.3)}" cy="-127" r="16.5" fill="${skin}"/>
    <path d="M${n(-17 + fx * 0.3)},-128 Q${n(-17 + fx * 0.3)},-146 ${n(fx * 0.3)},-145 Q${n(17 + fx * 0.3)},-146 ${n(17 + fx * 0.3)},-128 Q${n(10 + fx * 0.3)},-138 ${n(fx * 0.3)},-138 Q${n(-10 + fx * 0.3)},-138 ${n(-17 + fx * 0.3)},-128 Z" fill="#f2eee4"/>
    <circle cx="${n(3 + fx * 0.2)}" cy="-149" r="7.5" fill="#f2eee4"/><line x1="${n(-5 + fx * 0.2)}" y1="-152" x2="${n(11 + fx * 0.2)}" y2="-146" stroke="#d8443a" stroke-width="1.4"/>
    ${brows}${eyes}
    <path d="M${n(-7 + fx)},-118 Q${n(-3 + fx)},${stern > 0.5 ? -119 : -116.5} ${n(1 + fx)},-118" stroke="#7a4a3a" stroke-width="1.1" fill="none"/>
    <ellipse cx="${n(-12 + fx)}" cy="-121" rx="2.8" ry="1.6" fill="#e89a8a" opacity="0.5" stroke="none"/>
  </g>`;
  return { svg, arm };
}

// petals and the cherry branch: screen-space layers that zoom past us faster than the set
function near(c, t) {
  const z = 1 + c.z * 0.55, cx = W / 2, cy = 1000;
  const T = (x, y) => ({ x: cx + (x - cx) * z, y: cy + (y - cy) * z });
  let s = "";
  const b0 = T(-30, 300), b1 = T(260, 240), b2 = T(470, 170), t1 = T(250, 245), t2 = T(330, 320), t3 = T(150, 270), t4 = T(170, 200);
  s += `<path d="M${n(b0.x)},${n(b0.y)} Q${n(b1.x)},${n(b1.y)} ${n(b2.x)},${n(b2.y)}" stroke="#25172b" stroke-width="${n(18 * z)}" fill="none" stroke-linecap="round"/>`;
  s += `<path d="M${n(t1.x)},${n(t1.y)} L${n(t2.x)},${n(t2.y)} M${n(t3.x)},${n(t3.y)} L${n(t4.x)},${n(t4.y)}" stroke="#25172b" stroke-width="${n(8 * z)}" stroke-linecap="round"/>`;
  const blossoms = [[110, 275], [200, 238], [300, 215], [400, 182], [460, 168], [330, 322], [290, 285], [175, 198], [60, 298], [240, 270], [365, 205]];
  blossoms.forEach(([x, y], i) => {
    const q = T(x, y), r = (15 + 7 * hash(i + 3)) * z, rot = hash(i) * 72 + Math.sin(t * 1.4 + i) * 6;
    let f = "";
    for (let k = 0; k < 5; k++) f += `<ellipse cx="0" cy="${n(-r * 0.55)}" rx="${n(r * 0.42)}" ry="${n(r * 0.55)}" fill="${i % 3 ? "#f6b3c6" : "#fbd0dc"}" transform="rotate(${k * 72})"/>`;
    s += `<g transform="translate(${n(q.x)},${n(q.y)}) rotate(${n(rot)})">${f}<circle r="${n(r * 0.22)}" fill="#e2668a"/></g>`;
  });
  for (let i = 0; i < 18; i++) {
    const sp = 110 + 90 * hash(i + 20), y = ((t * sp + hash(i + 40) * 2200) % 2200) - 120, x = hash(i + 60) * 1180 - 50 + 40 * Math.sin(t * 1.3 + i * 2.1) - t * 25;
    const r = 6 + 6 * hash(i + 80);
    s += `<ellipse cx="0" cy="0" rx="${n(r)}" ry="${n(r * 0.6)}" fill="#f7b6c8" opacity="0.9" transform="translate(${n(x)},${n(y)}) rotate(${n(t * 120 * (hash(i) - 0.5) + i * 40)})"/>`;
  }
  return s;
}

export function draw(t) {
  const c = camera(t);
  const L = lamp(c, t), k = kid(c, t), kp = keeper(c, t, k.sleeve);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${DEFS}
    ${sky(c)}${far(c)}${ground(c)}${houses(c, t, -1)}${houses(c, t, 1)}${vending(c)}
    ${L.s}${woman(c, t, L.fl)}${k.svg}${kp.svg}${kp.arm}${near(c, t)}
    <rect width="${W}" height="${H}" fill="url(#vig)"/></svg>`;
}
