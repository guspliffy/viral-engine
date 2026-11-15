// Ancient aliens EP03 Atlantis, block C, Port Royal 1692 and its slide into the sea (panels 34, 35; plates 34, 35). Brief: block-c/briefs/C3.md.
// Bench: storyboards/series/ancient-aliens/03-atlantis/block-c/bench/make-at-c-port.mjs (+ at-c-port-sheet.png, at-c-port-vs.png).
// Exports C_PORT_KINDS (one kind, portroyal) and C_PORT_GRIPS = {} (nothing here is held). Axes: +y up, +x screen right from the default camera, the camera on +z
// looking -z, metres, sea level y 0, Spud 0.88. Everything is scenery (lookOnly, surfaceOnly); only the wharf decks are solid. No Math.random, no wall clock:
// motion comes from the clip clock t and from the two params. A param tweens only when seeded by a dur-0 set at its start; spec.<name> is its start value.
//
//   portroyal   the whole place except the sea. Origin = Spud's spot on the wharf, sea level y 0, the wharf deck top y 1.2 (STANDABLE, solid: the near deck x -2.5..2.5,
//               z -12..12; the far deck is solid too), the wharf runs along -z, the street front of houses on its LEFT (-x, facing +x), the harbour on the RIGHT (+x).
//               The front line runs straight to z -50 at x -3.5 and then curves round the bay to the right (the far town, the hill, the tower follow it).
//               What stands: the near wharf (5 wide, individual planks with nail heads, tarred piles 0.4 with rope and a barnacle band, a timber curb, bollards with
//               rope, 3 barrels + 2 crates at x -2.1 z 2.8..4.6), 9 front houses 6-8 wide x 7-11 high (timber clapboard and lime-washed brick, balconies with
//               balustrades, peeling shutters, striped awnings, tile / shingle roofs, chimneys, washing, bougainvillea), a second row behind (lighter 3D) and the
//               hill town (merged blocks), terraces and trees on a green hill, a brick church tower 22 m (z -170, right of centre from the default camera) with
//               a gold cupola, 8 palms (each its own lean), a pale blue mountain range and cumulus cards on the far horizon (z -950), a second pier mid-frame to
//               the right (x 8..12.5, z -18..-46), two three-masters 35 long (cream sails, red pennants) and a rowing boat, 14 far townspeople (potato folk in tricorns
//               and coats #8a2f2a / #2f3f66 / brown), 3 chimney smokes, pennants and washing that move on t. Put the sea (grade "tropic") and a sky (aasky "day")
//               in the same place; the sea's spec.mirrors may carry the ships and houses. Kind seagulls may be placed by the clip.
//               param sink 0..1 (spec.sink 0; seed a dur-0 set; the clip tweens it over 1.5 s): the slab (the land and the wharf from z -12 to -60, x -28..+4)
//                 rolls 14 deg seaward about x -14 and drops 6 m; each of its 6 front houses and the 6 houses of the row behind leans 8-25 deg more by hash, drops
//                 on its own and starts at its own moment; 3 roofs break; the mid pier tip dives 14 deg; the ships roll up to 8 deg; white water runs up the streets
//                 and foams round everything that goes. Tower, the right 3 houses, the hill and the near wharf (x -2.5..2.5, z 12..-12) stay (it shakes).
//               param shake 0..1 (spec.shake 0): quake jitter of everything, deterministic on t.
//               spec.seed 1 (changes the hashed details), spec.people true (the far townspeople), spec.smoke true.
//
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const TAU = Math.PI * 2, DEG = Math.PI / 180;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const hz = (a, b = 0) => { const x = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return x - Math.floor(x); };
const num = (ps, S, k, d = 0) => ps[k] ?? S[k] ?? d;
const memo = new Map();
const once = (key, make) => { if (!memo.has(key)) memo.set(key, make()); return memo.get(key); };
const col = (h) => new THREE.Color(h);
const mix = (a, b, k) => { const x = col(a), y = col(b); return "#" + x.lerp(y, k).getHexString(); };
function canvas(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return [c, c.getContext("2d")]; }
function tex(c, { wrap = false, aniso = 8 } = {}) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso; if (wrap) t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; }
function mark(o, { solid = false, order, steam = false } = {}) {
  o.traverse((m) => { m.userData.lookOnly = true; m.userData.solid = !!solid; m.userData.surfaceOnly = true; if (steam) m.userData.steam = true; m.castShadow = false; m.receiveShadow = false; m.frustumCulled = false; if (order != null) m.renderOrder = order; });
  return o;
}
const lit = (o = {}) => { const m = new THREE.MeshStandardMaterial({ roughness: 0.92, metalness: 0, ...o }); m.userData.noHatch = true; return m; };
const noLine = (m) => { m.userData.noOutline = true; m.userData.noHatch = true; m.userData.outlineParameters = { visible: false }; return m; };
const basic = (o = {}) => noLine(new THREE.MeshBasicMaterial({ toneMapped: false, ...o }));

// painted surfaces: crops of plates 34 / 35 (assets/props/atlantis/c/port-*.png) drawn over the canvas texture when they have loaded (the engine waits on __loads)
const ASSET = "assets/props/atlantis/c/";
function paintOver(t, c, ctx, file, draw) {
  (globalThis.__loads ||= []).push(new THREE.ImageLoader().loadAsync("/" + ASSET + file).then((img) => { draw ? draw(ctx, img, c) : ctx.drawImage(img, 0, 0, c.width, c.height); t.needsUpdate = true; }).catch(() => {}));
  return t;
}
// ---------------------------------------------------------------------------------------------------- the front line of the town (it curves round the bay)
const FRONT_X = -8;
const frontX = (z) => (z > -30 ? FRONT_X : FRONT_X + 85 * (1 - Math.exp(-(((-z - 30) / 120) ** 2))));
const frontAng = (z) => Math.atan2(frontX(z - 1) - frontX(z + 1), 2);   // the line's turn (rad, + = toward +x going away)

// ---------------------------------------------------------------------------------------------------- merged vertex-coloured geometry
class Batch {
  constructor() { this.g = []; }
  add(geo, { p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1], c = "#ffffff", j = 0.08, k = 0, grad = 0.16 } = {}) {
    const g = (geo.index ? geo.toNonIndexed() : geo.clone());
    if (!g.attributes.uv) g.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    g.computeBoundingBox(); const bb = g.boundingBox, y0 = bb.min.y, hh = Math.max(1e-4, bb.max.y - bb.min.y);
    const n = g.attributes.position.count, cl = new Float32Array(n * 3), base = col(c), jit = 1 + (hz(k + p[0] * 3.1 + p[2] * 1.7, p[1]) - 0.5) * 2 * j, pos = g.attributes.position;
    for (let i = 0; i < n; i++) { const f = 1 - grad + grad * ((pos.getY(i) - y0) / hh) * 1.0; cl[i * 3] = base.r * jit * f; cl[i * 3 + 1] = base.g * jit * f; cl[i * 3 + 2] = base.b * jit * f; }
    g.setAttribute("color", new THREE.BufferAttribute(cl, 3));
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(...p), new THREE.Quaternion().setFromEuler(new THREE.Euler(r[0], r[1], r[2], "YXZ")), new THREE.Vector3(...s)));
    if (this.M) g.applyMatrix4(this.M);
    for (const a of Object.keys(g.attributes)) if (!["position", "normal", "uv", "color"].includes(a)) g.deleteAttribute(a);
    this.g.push(g); return this;
  }
  box(x, y, z, w, h, d, c, o = {}) { return this.add(UNIT.box, { ...o, p: [x, y, z], s: [w, h, d], c }); }
  cyl(x, y0, z, r, h, c, o = {}) { return this.add(UNIT.cyl, { ...o, p: [x, y0, z], s: [r, h, r], c }); }
  rock(x, y, z, r, c, o = {}) { return this.add(UNIT.rock, { ...o, p: [x, y, z], s: [r, r * (o.sy ?? 1), r], c }); }
  blob(x, y, z, r, c, o = {}) { return this.add(UNIT.blob, { ...o, p: [x, y, z], s: [r, r * (o.sy ?? 1), r], c }); }
  under(M, fn) { const o = this.M; this.M = o ? o.clone().multiply(M) : M; fn(); this.M = o; return this; }   // everything added inside fn is moved by M too
  mesh(mat, name) {
    if (!this.g.length) return null;
    const m = new THREE.Mesh(mergeGeometries(this.g), mat); m.name = name || "at-port"; return m;
  }
}
const UNIT = {
  box: new THREE.BoxGeometry(1, 1, 1),
  cyl: new THREE.CylinderGeometry(1, 1, 1, 10).translate(0, 0.5, 0),
  blob: new THREE.IcosahedronGeometry(1, 1),
  rock: new THREE.IcosahedronGeometry(1, 0),
};
const VCOL = () => once("vcol", () => lit({ vertexColors: true }));
const VCOL2 = () => once("vcol2", () => lit({ vertexColors: true, side: THREE.DoubleSide }));
// a prism of a polygon (xy points) extruded along z
function poly(pts, z0, z1, uvs = 1) {
  const sh = new THREE.Shape(pts.map((p) => new THREE.Vector2(p[0], p[1])));
  const g = new THREE.ExtrudeGeometry(sh, { depth: z1 - z0, bevelEnabled: false }); g.translate(0, 0, z0); return g;
}
// a flat polygon facing +z with uvs in metres / size (so a canvas covers w x h)
function wallPoly(pts, w, h) {
  const sh = new THREE.Shape(pts.map((p) => new THREE.Vector2(p[0], p[1]))), g = new THREE.ShapeGeometry(sh), u = g.attributes.uv, p = g.attributes.position;
  for (let i = 0; i < p.count; i++) u.setXY(i, p.getX(i) / w, p.getY(i) / h);
  return g;
}

// ---------------------------------------------------------------------------------------------------- canvas textures (drawn once per key)
const rr = (x, i = 0) => hz(x, i);
function jag(ctx, x, y, w, h, n, seed) {   // a ragged rectangle (peeled paint, lime wash gone)
  ctx.beginPath(); ctx.moveTo(x, y);
  for (let i = 1; i <= n; i++) ctx.lineTo(x + w * i / n, y + (rr(seed + i, 3) - 0.5) * h * 0.4);
  for (let i = 1; i <= n; i++) ctx.lineTo(x + w - (rr(seed + i, 5) - 0.5) * w * 0.15, y + h * i / n);
  for (let i = n; i >= 0; i--) ctx.lineTo(x + w * i / n, y + h + (rr(seed + i, 7) - 0.5) * h * 0.4);
  ctx.closePath();
}
// the wharf deck: planks along v (canvas y), 5 m x 6 m, each plank its own width, tone, grain, butt joints, nail heads, knots, cracks, stains
function deckTex() {
  return once("deck", () => {
    const W = 1024, H = 1024, [c, x] = canvas(W, H), PX = W / 5, PZ = H / 6;
    x.fillStyle = "#6f5a40"; x.fillRect(0, 0, W, H);
    let px = 0, i = 0;
    const tones = ["#86684a", "#7a5f42", "#94764f", "#6d553a", "#84683f", "#977c58", "#664e34", "#765d3f"];
    while (px < W - 2) {
      const w = (0.17 + 0.12 * rr(i, 1)) * PX, base = tones[Math.floor(rr(i, 2) * tones.length)];
      let z = -rr(i, 3) * 3 * PZ;
      while (z < H) {
        const len = (1.6 + 2.4 * rr(i + z * 0.01, 4)) * PZ, y0 = Math.max(0, z), y1 = Math.min(H, z + len - 2.5);
        const tone = mix(base, rr(i * 7 + z, 5) > 0.5 ? "#c9b896" : "#6e5a40", 0.12 + 0.2 * rr(i * 3 + z, 6));
        x.fillStyle = tone; x.fillRect(px + 1, y0, w - 2, y1 - y0);
        // grain: long thin strokes along the plank
        for (let g = 0; g < 9; g++) { const gx = px + 3 + rr(i * 9 + g + z, 8) * (w - 6); x.strokeStyle = rr(g + i, 9) > 0.5 ? "rgba(70,52,34,0.28)" : "rgba(235,222,196,0.2)"; x.lineWidth = 0.6 + rr(g + i, 10); x.beginPath(); x.moveTo(gx, y0 + 1); x.bezierCurveTo(gx + (rr(g, 11) - 0.5) * 4, y0 + (y1 - y0) * 0.35, gx + (rr(g, 12) - 0.5) * 4, y0 + (y1 - y0) * 0.7, gx + (rr(g + i, 13) - 0.5) * 3, y1); x.stroke(); }
        // a knot, a crack, a salt stain
        if (rr(i + z, 14) > 0.62) { const ky = y0 + rr(i + z, 15) * (y1 - y0), kx = px + w * (0.3 + 0.4 * rr(z, 16)); x.fillStyle = "rgba(60,42,28,0.55)"; x.beginPath(); x.ellipse(kx, ky, w * 0.14, w * 0.2, 0, 0, TAU); x.fill(); x.strokeStyle = "rgba(60,42,28,0.35)"; x.lineWidth = 1; x.beginPath(); x.ellipse(kx, ky, w * 0.26, w * 0.4, 0, 0, TAU); x.stroke(); }
        if (rr(i + z, 17) > 0.7) { x.strokeStyle = "rgba(40,28,18,0.7)"; x.lineWidth = 1.2; const cx0 = px + w * (0.25 + 0.5 * rr(z, 18)), cy0 = y0 + rr(z, 19) * (y1 - y0) * 0.6; x.beginPath(); x.moveTo(cx0, cy0); x.lineTo(cx0 + (rr(z, 20) - 0.5) * 5, cy0 + 30 + 40 * rr(z, 21)); x.stroke(); }
        if (rr(i + z, 22) > 0.6) { x.fillStyle = "rgba(235,228,210,0.16)"; jag(x, px + 2, y0 + rr(z, 23) * (y1 - y0) * 0.5, w - 4, 20 + 40 * rr(z, 24), 5, i + z); x.fill(); }
        // butt joint: a dark line, with two nails at each end
        x.fillStyle = "rgba(30,20,12,0.85)"; x.fillRect(px, y1, w, 2.5);
        for (const [ny] of [[y0 + 5], [y1 - 6]]) for (const nx of [px + w * 0.28, px + w * 0.72]) { if (ny < 3 || ny > H - 3) continue; x.fillStyle = "#2b2420"; x.beginPath(); x.arc(nx, ny, 2.3, 0, TAU); x.fill(); x.fillStyle = "rgba(200,190,170,0.55)"; x.beginPath(); x.arc(nx - 0.6, ny - 0.6, 0.9, 0, TAU); x.fill(); x.strokeStyle = "rgba(120,60,30,0.35)"; x.lineWidth = 1; x.beginPath(); x.moveTo(nx, ny + 2); x.lineTo(nx + (rr(nx, 25) - 0.5) * 3, ny + 10 + 6 * rr(ny, 26)); x.stroke(); }
        // the joists: a nail pair across every plank at 0.9 m
        for (let jz = 0; jz < 6; jz += 0.9) { const ny = (jz + 0.2 * rr(i, 27)) * PZ; if (ny > y0 + 8 && ny < y1 - 8) for (const nx of [px + w * 0.3, px + w * 0.7]) { x.fillStyle = "#312821"; x.beginPath(); x.arc(nx, ny, 2.1, 0, TAU); x.fill(); x.fillStyle = "rgba(210,200,180,0.5)"; x.beginPath(); x.arc(nx - 0.5, ny - 0.5, 0.8, 0, TAU); x.fill(); } }
        z += len; i++;
      }
      x.fillStyle = "rgba(25,16,10,0.8)"; x.fillRect(px, 0, 1.6, H);
      px += w;
    }
    // soft big stains and the polished walking line
    for (let k = 0; k < 14; k++) { const gx = rr(k, 30) * W, gy = rr(k, 31) * H, g = x.createRadialGradient(gx, gy, 0, gx, gy, 60 + 90 * rr(k, 32)); g.addColorStop(0, rr(k, 33) > 0.5 ? "rgba(40,28,18,0.22)" : "rgba(240,230,205,0.18)"); g.addColorStop(1, "rgba(0,0,0,0)"); x.fillStyle = g; x.fillRect(0, 0, W, H); }
    return paintOver(tex(c, { wrap: true }), c, x, "port-deck.png");
  });
}
// a clapboard or brick wall, 4 m x 4 m tile
function wallTex(style) {
  return once("wall-" + style, () => {
    const S = 512, [c, x] = canvas(S, S), PX = S / 4;
    if (style === "brick" || style === "lime") {
      x.fillStyle = style === "lime" ? "#d9cdb4" : "#a85d3f"; x.fillRect(0, 0, S, S);
      const bh = 0.075 * PX, bw = 0.24 * PX;
      for (let r = 0, y = 0; y < S; r++, y += bh) for (let b = -1, bx = (r % 2) * bw / 2 - bw / 2; bx < S; b++, bx += bw) {
        const k = rr(r * 41 + b, 40); x.fillStyle = style === "lime" ? mix("#d9cdb4", k > 0.5 ? "#c7a98a" : "#e7dfcb", 0.2 + 0.4 * rr(r + b, 41)) : mix("#a85d3f", k > 0.5 ? "#c4784f" : "#7e4430", 0.2 + 0.5 * rr(r + b, 41)); x.fillRect(bx + 0.8, y + 0.8, bw - 1.6, bh - 1.6);
      }
      x.fillStyle = "rgba(255,250,235,0.55)"; for (let k = 0; k < 7; k++) { jag(x, rr(k, 42) * S, rr(k, 43) * S, 60 + 120 * rr(k, 44), 40 + 80 * rr(k, 45), 6, k * 9); x.fill(); }
    } else {
      const base = style === "grey" ? "#8d8a80" : style === "blue" ? "#8aa0a8" : "#b79e72";
      x.fillStyle = base; x.fillRect(0, 0, S, S);
      const bh = 0.17 * PX;
      for (let r = 0, y = 0; y < S; r++, y += bh) {
        x.fillStyle = mix(base, rr(r, 50) > 0.5 ? "#e8d9b4" : "#5a4a34", 0.1 + 0.25 * rr(r, 51)); x.fillRect(0, y + 1, S, bh - 1);
        x.fillStyle = "rgba(30,20,12,0.45)"; x.fillRect(0, y, S, 1.6);
        x.fillStyle = "rgba(255,245,220,0.18)"; x.fillRect(0, y + bh - 3, S, 1.2);
        for (let g = 0; g < 4; g++) { x.strokeStyle = "rgba(60,44,30,0.2)"; x.lineWidth = 0.6; const gy = y + 3 + rr(r * 5 + g, 52) * (bh - 6); x.beginPath(); x.moveTo(rr(g, 53) * S * 0.4, gy); x.lineTo(S * (0.5 + 0.5 * rr(g + r, 54)), gy + 0.8); x.stroke(); }
        for (let n = 0; n < 3; n++) { const nx = (rr(r * 3 + n, 55) * 0.9 + 0.05) * S; x.fillStyle = "#2c241d"; x.fillRect(nx, y + bh * 0.5, 2, 2); }
      }
      for (let k = 0; k < 6; k++) { x.fillStyle = "rgba(220,205,170,0.18)"; jag(x, rr(k, 56) * S, rr(k, 57) * S, 40 + 90 * rr(k, 58), 30 + 60 * rr(k, 59), 6, k * 5); x.fill(); }
    }
    for (let k = 0; k < 8; k++) { const gx = rr(k, 60) * S, gy = rr(k, 61) * S, g = x.createRadialGradient(gx, gy, 0, gx, gy, 70); g.addColorStop(0, "rgba(40,30,20,0.16)"); g.addColorStop(1, "rgba(0,0,0,0)"); x.fillStyle = g; x.fillRect(0, 0, S, S); }
    return tex(c, { wrap: true });
  });
}
// a roof: terracotta pan tiles, grey shingle or weathered wood shingle; 4 m x 4 m tile, every tile its own tone and place
function roofTex(kind) {
  return once("roof-" + kind, () => {
    const S = 512, [c, x] = canvas(S, S), PX = S / 4;
    const tw = (kind === "tile" ? 0.2 : kind === "slate" ? 0.24 : 0.16) * PX, th = (kind === "tile" ? 0.3 : 0.2) * PX;
    const pal = kind === "tile" ? ["#b4512c", "#c4623a", "#a2452a", "#cf7447", "#8f3c26"] : kind === "slate" ? ["#5f6772", "#707a86", "#4f5662", "#808a95"] : ["#8a7a62", "#7a6a54", "#9a8b72", "#6e604c"];
    x.fillStyle = kind === "tile" ? "#6a2f1e" : "#3f3a34"; x.fillRect(0, 0, S, S);
    for (let r = 0, y = 0; y < S + th; r++, y += th * 0.72) for (let b = -1, bx = (r % 2) * tw / 2 - tw; bx < S; b++, bx += tw) {
      const k = rr(r * 53 + b, 70), colr = mix(pal[Math.floor(rr(r * 7 + b, 71) * pal.length)], k > 0.5 ? "#e6c8a0" : "#3a2a20", 0.08 + 0.2 * rr(r + b * 3, 72));
      x.fillStyle = colr;
      if (kind === "tile") { x.beginPath(); x.moveTo(bx + 1, y); x.lineTo(bx + tw - 1, y); x.lineTo(bx + tw - 1, y + th * 0.9); x.quadraticCurveTo(bx + tw / 2, y + th * 1.06, bx + 1, y + th * 0.9); x.closePath(); x.fill(); x.fillStyle = "rgba(255,230,190,0.22)"; x.fillRect(bx + tw * 0.2, y + 2, tw * 0.12, th * 0.7); x.fillStyle = "rgba(30,10,5,0.5)"; x.fillRect(bx + tw - 2.5, y, 2, th * 0.9); }
      else { x.fillRect(bx + 0.5, y, tw - 1, th * 0.95); x.fillStyle = "rgba(20,14,10,0.5)"; x.fillRect(bx + tw - 1.5, y, 1.2, th * 0.95); x.fillRect(bx, y + th * 0.88, tw, 1.6); if (rr(r * 9 + b, 73) > 0.8) { x.fillStyle = "rgba(255,255,255,0.12)"; x.fillRect(bx + 2, y + 2, tw * 0.5, 2); } }
      x.fillStyle = "rgba(20,10,6,0.45)"; x.fillRect(bx, y + th * 0.84, tw, 2.2);
      if (rr(r * 31 + b, 74) > 0.93) { x.fillStyle = "rgba(90,120,50,0.5)"; x.beginPath(); x.ellipse(bx + tw / 2, y + th * 0.4, tw * 0.3, th * 0.18, 0, 0, TAU); x.fill(); }
    }
    return paintOver(tex(c, { wrap: true }), c, x, kind === "tile" ? "port-roof-tile.png" : "port-roof-shingle.png");
  });
}
// the front of a house, w x h metres (gable: the top h - hb is a triangle); drawn at 52 px/m: wall, windows with frames and peeling shutters, a shop front
function facadeTex(key, o) {
  return once("facade-" + key, () => {
    const { w, hb, h, style, floors, shop, seed } = o, PX = 52, W = Math.ceil(w * PX), H = Math.ceil(h * PX), [c, x] = canvas(W, H);
    const Y = (m) => H - m * PX;
    const wt = wallTex(style).image; x.drawImage(wt, 0, 0, 512, 512, 0, 0, W, H);   // the wall (a 4 m tile stretched over the front: it reads as boards / bricks of the right size on a 4..8 m wall)
    const wood = style !== "brick" && style !== "lime";
    const trim = style === "brick" ? "#e9e1cc" : style === "lime" ? "#cdb88e" : "#e6dcc2", shut = ["#2f6f78", "#3d7a4a", "#5a7a8a", "#6b3a2a", "#2f5a6f"][Math.floor(rr(seed, 80) * 5)];
    const gf = 3.2, fl = (hb - gf) / Math.max(1, floors - 1);
    // corner boards and the floor lines
    x.fillStyle = trim; x.fillRect(0, 0, 5, H); x.fillRect(W - 5, 0, 5, H);
    x.fillStyle = mix(trim, "#3a2a1a", 0.25); x.fillRect(0, Y(gf) - 3, W, 6); x.fillStyle = "rgba(20,12,6,0.4)"; x.fillRect(0, Y(gf) + 3, W, 2);
    const window = (cx, cy, ww, hh, k) => {   // a window: frame, 6 panes, sill, lintel; open / shuttered by hash
      const X0 = cx * PX - ww * PX / 2, Y0 = Y(cy) - hh * PX / 2, w2 = ww * PX, h2 = hh * PX;
      x.fillStyle = "rgba(0,0,0,0.35)"; x.fillRect(X0 - 2, Y0 - 2, w2 + 4, h2 + 5);
      x.fillStyle = trim; x.fillRect(X0 - 4, Y0 - 4, w2 + 8, h2 + 8);
      const g = x.createLinearGradient(X0, Y0, X0, Y0 + h2); g.addColorStop(0, "#1c2832"); g.addColorStop(0.55, "#2c4350"); g.addColorStop(1, "#16202a"); x.fillStyle = g; x.fillRect(X0, Y0, w2, h2);
      x.fillStyle = "rgba(190,225,240,0.35)"; x.beginPath(); x.moveTo(X0 + 3, Y0 + 3); x.lineTo(X0 + w2 * 0.55, Y0 + 3); x.lineTo(X0 + 3, Y0 + h2 * 0.55); x.fill();   // a glint on the glass
      if (rr(k, 81) > 0.75) { x.fillStyle = "rgba(235,225,200,0.9)"; x.fillRect(X0, Y0, w2, h2 * 0.35); x.fillStyle = "rgba(80,60,40,0.35)"; for (let t = 0; t < 5; t++) x.fillRect(X0 + t * w2 / 5, Y0, 1, h2 * 0.35); }   // a curtain
      x.fillStyle = trim; x.fillRect(X0 + w2 / 2 - 1.5, Y0, 3, h2); x.fillRect(X0, Y0 + h2 / 3 - 1.5, w2, 3); x.fillRect(X0, Y0 + 2 * h2 / 3 - 1.5, w2, 3);
      x.fillStyle = mix(trim, "#2a1c10", 0.3); x.fillRect(X0 - 7, Y0 + h2 + 3, w2 + 14, 6); x.fillStyle = "rgba(0,0,0,0.3)"; x.fillRect(X0 - 7, Y0 + h2 + 9, w2 + 14, 3);
      x.fillStyle = mix(trim, "#2a1c10", 0.2); x.fillRect(X0 - 8, Y0 - 10, w2 + 16, 6);
      // shutters either side (the 3D flaps are added by the house), painted, peeling
      if (rr(k, 83) <= 0.5) for (const sd of [-1, 1]) { const sx = sd < 0 ? X0 - w2 * 0.5 - 6 : X0 + w2 + 6; x.fillStyle = shut; x.fillRect(sx, Y0 - 4, w2 * 0.5, h2 + 8); x.fillStyle = "rgba(0,0,0,0.25)"; for (let s = 0; s < 7; s++) x.fillRect(sx + 1, Y0 - 2 + s * (h2 + 4) / 7, w2 * 0.5 - 2, 1.5); x.fillStyle = "rgba(210,200,170,0.5)"; jag(x, sx + 2, Y0 + rr(k * 3 + sd, 82) * h2 * 0.6, w2 * 0.3, h2 * 0.2, 4, k + sd); x.fill(); }
    };
    // upper floors
    const nb = Math.max(2, Math.round(w / 2.3));
    for (let f = 1; f < floors; f++) for (let b = 0; b < nb; b++) { const cx = w * (b + 0.5) / nb; const cy = gf + fl * (f - 0.5); if (rr(b + f * 5, seed) > 0.9) continue; window(cx, cy, 0.82, 1.3, b * 7 + f + seed); }
    // the gable: a round attic window
    if (h > hb + 0.5) { const cx = w / 2, cy = hb + (h - hb) * 0.4; x.fillStyle = trim; x.beginPath(); x.arc(cx * PX, Y(cy), 0.5 * PX, 0, TAU); x.fill(); x.fillStyle = "#223644"; x.beginPath(); x.arc(cx * PX, Y(cy), 0.4 * PX, 0, TAU); x.fill(); x.fillStyle = trim; x.fillRect(cx * PX - 1.5, Y(cy) - 0.4 * PX, 3, 0.8 * PX); x.fillRect(cx * PX - 0.4 * PX, Y(cy) - 1.5, 0.8 * PX, 3); }
    // the ground floor: a shop front between the porch posts (dark inside, shelves, jars, barrels) and a door
    const nOp = Math.max(2, Math.round(w / 2.4)), opW = 1.55, opH = 2.35;
    for (let b = 0; b < nOp; b++) {
      const cx = w * (b + 0.5) / nOp, X0 = cx * PX - opW * PX / 2, Y0 = Y(0.35 + opH), w2 = opW * PX, h2 = opH * PX, door = b === (seed % nOp);
      x.fillStyle = "rgba(0,0,0,0.4)"; x.fillRect(X0 - 5, Y0 - 5, w2 + 10, h2 + 6); x.fillStyle = trim; x.fillRect(X0 - 6, Y0 - 6, w2 + 12, h2 + 6);
      const g = x.createLinearGradient(X0, Y0, X0, Y0 + h2); g.addColorStop(0, "#241a14"); g.addColorStop(1, "#4a3622"); x.fillStyle = g; x.fillRect(X0, Y0, w2, h2);
      if (door) { x.fillStyle = shut; x.fillRect(X0 + w2 * 0.1, Y0 + 4, w2 * 0.8, h2 - 4); x.fillStyle = "rgba(0,0,0,0.3)"; for (let s = 0; s < 6; s++) x.fillRect(X0 + w2 * 0.1 + s * w2 * 0.8 / 6, Y0 + 4, 1.5, h2 - 4); x.fillStyle = "#c9a24a"; x.beginPath(); x.arc(X0 + w2 * 0.8, Y0 + h2 * 0.55, 3, 0, TAU); x.fill(); }
      else {
        for (let s = 0; s < 3; s++) { x.fillStyle = "#6b4a2c"; x.fillRect(X0 + 3, Y0 + 12 + s * h2 * 0.28, w2 - 6, 4); for (let j = 0; j < 5; j++) { const jx = X0 + 8 + j * (w2 - 16) / 5 + rr(j + s, 85) * 6, jy = Y0 + 12 + s * h2 * 0.28; x.fillStyle = ["#b7864a", "#a36a3a", "#d9c7a0", "#6f8a5a", "#9a5a3a"][Math.floor(rr(j * 3 + s + b, 86) * 5)]; x.beginPath(); x.ellipse(jx, jy - 7, 5, 7, 0, 0, TAU); x.fill(); x.fillStyle = "rgba(255,255,255,0.3)"; x.fillRect(jx - 2, jy - 11, 1.5, 6); } }
        x.fillStyle = "rgba(120,90,50,0.8)"; x.fillRect(X0 + 3, Y0 + h2 - 12, w2 - 6, 10);
      }
    }
    // the weathering: stains running down from the sills, peeled patches, a damp band at the foot
    for (let k = 0; k < 14; k++) { const sx = rr(k, 90) * W, sy = rr(k, 91) * H * 0.8, g = x.createLinearGradient(sx, sy, sx, sy + 80 + 60 * rr(k, 92)); g.addColorStop(0, "rgba(40,30,20,0.22)"); g.addColorStop(1, "rgba(40,30,20,0)"); x.fillStyle = g; x.fillRect(sx - 6 - 8 * rr(k, 93), sy, 12 + 16 * rr(k, 93), 140); }
    const dg = x.createLinearGradient(0, H - 40, 0, H); dg.addColorStop(0, "rgba(40,30,20,0)"); dg.addColorStop(1, "rgba(40,30,20,0.4)"); x.fillStyle = dg; x.fillRect(0, H - 40, W, 40);
    return paintOver(tex(c), c, x, seed % 2 ? "port-facade-a.png" : "port-facade-b.png");
  });
}
// soft foam: white cartoon bubbles and arcs, alpha from the pattern; 256 px
function foamTex() {
  return once("foam", () => {
    const S = 256, [c, x] = canvas(S, S); x.clearRect(0, 0, S, S);
    const blob = (px, py, r, f) => { for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) { x.fillStyle = f; x.beginPath(); x.arc(px + ox, py + oy, r, 0, TAU); x.fill(); } };
    for (let i = 0; i < 90; i++) blob(rr(i, 100) * S, rr(i, 101) * S + 3, 9 + 26 * rr(i, 102) ** 1.5, "rgba(120,190,215,0.9)");   // the aqua shadow under the foam
    for (let i = 0; i < 90; i++) blob(rr(i, 100) * S, rr(i, 101) * S, 9 + 26 * rr(i, 102) ** 1.5, "rgba(250,253,255,1)");
    for (let i = 0; i < 46; i++) blob(rr(i, 103) * S, rr(i, 104) * S, 2 + 6 * rr(i, 105), "rgba(0,0,0,1)");   // holes are cut below
    x.globalCompositeOperation = "destination-out"; for (let i = 0; i < 46; i++) { x.fillStyle = "rgba(0,0,0,1)"; x.beginPath(); x.arc(rr(i, 103) * S, rr(i, 104) * S, 2 + 5 * rr(i, 105), 0, TAU); x.fill(); } x.globalCompositeOperation = "source-over";
    x.strokeStyle = "rgba(255,255,255,1)"; x.lineWidth = 2; for (let i = 0; i < 40; i++) { const px = rr(i, 107) * S, py = rr(i, 108) * S, r = 8 + 20 * rr(i, 109); x.beginPath(); x.arc(px, py, r, rr(i, 110) * 3, rr(i, 110) * 3 + 2.2); x.stroke(); }
    return tex(c, { wrap: true });
  });
}
function puffTex() {
  return once("puff", () => {
    const S = 128, [c, x] = canvas(S, S); const g = x.createRadialGradient(64, 64, 0, 64, 64, 62); g.addColorStop(0, "rgba(255,255,255,0.9)"); g.addColorStop(0.55, "rgba(235,235,235,0.55)"); g.addColorStop(1, "rgba(220,220,220,0)"); x.fillStyle = g; x.fillRect(0, 0, S, S);
    return tex(c);
  });
}

// ---------------------------------------------------------------------------------------------------- shared geometry helpers
// uvs in metres / sc from the dominant axis of the normal, so a tile keeps its size on every face
function triplanar(g, sc = 4) {
  const p = g.attributes.position, n = g.attributes.normal, u = g.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i));
    if (ay >= ax && ay >= az) u.setXY(i, p.getX(i) / sc, p.getZ(i) / sc); else if (ax >= az) u.setXY(i, p.getZ(i) / sc, p.getY(i) / sc); else u.setXY(i, p.getX(i) / sc, p.getY(i) / sc);
  }
  return g;
}
// a quad from four corners (counter-clockwise seen from the front), uvs in metres / sc along its edges
function quad(a, b, c, d, sc = 4, flip = false) {
  const g = new THREE.BufferGeometry(), v = [...a, ...b, ...c, ...d], la = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), lb = Math.hypot(d[0] - a[0], d[1] - a[1], d[2] - a[2]);
  g.setAttribute("position", new THREE.Float32BufferAttribute(v, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, la / sc, 0, la / sc, lb / sc, 0, lb / sc], 2));
  g.setIndex(flip ? [0, 2, 1, 0, 3, 2] : [0, 1, 2, 0, 2, 3]); g.computeVertexNormals(); return g;
}
const TORUS = new THREE.TorusGeometry(1, 0.17, 5, 12).rotateX(Math.PI / 2), HOOP = new THREE.TorusGeometry(1, 0.045, 4, 14).rotateX(Math.PI / 2);
const ROPE = "#b49a62";
// a rope turned n times round a pile / bollard of radius r from y0 up, with a hanging end
function ropeWrap(b, x, z, r, y0, turns, k) {
  for (let i = 0; i < turns; i++) b.add(TORUS, { p: [x, y0 + i * 0.075, z], r: [(hz(i, k) - 0.5) * 0.12, 0, (hz(i, k + 1) - 0.5) * 0.12], s: [r + 0.03, 1, r + 0.03].map((v, j) => (j === 1 ? (r + 0.03) : v)), c: i % 2 ? "#a98d56" : ROPE, j: 0.1, grad: 0.05 });
  b.cyl(x + r * 0.7, y0 - 0.5, z + r * 0.7, 0.03, 0.55, ROPE, { j: 0.1 });
}
// a barrel: bulged staves + iron hoops (individual hoops), rolling lid
function barrel(b, x, y, z, k, lying = 0, ry = 0) {
  const tone = ["#9a6b3a", "#8a5c30", "#a77a47", "#7d5430"][k % 4], r = 0.34, h = 0.8, g = new THREE.CylinderGeometry(r * 0.92, r * 0.92, h, 14, 5);
  const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const f = 1 - Math.abs(p.getY(i)) / (h / 2), bulge = 1 + 0.12 * Math.sin(f * Math.PI / 2); p.setX(i, p.getX(i) * bulge); p.setZ(i, p.getZ(i) * bulge); }
  g.computeVertexNormals();
  const M = new THREE.Matrix4().compose(new THREE.Vector3(x, y + (lying ? r : h / 2), z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, lying ? Math.PI / 2 : 0, "YXZ")), new THREE.Vector3(1, 1, 1));
  b.under(M, () => {
    b.add(g, { c: tone, j: 0.1 });
    for (const hy of [-0.3, -0.2, 0.2, 0.3]) { const f = 1 - Math.abs(hy) / (h / 2), bu = (1 + 0.12 * Math.sin(f * Math.PI / 2)) * r * 0.92 + 0.012; b.add(HOOP, { p: [0, hy, 0], s: [bu, bu, bu], c: "#4a4742", j: 0.05, grad: 0 }); }
    b.cyl(0, h / 2 - 0.01, 0, r * 0.84, 0.02, "#6e4a28", { j: 0.1, grad: 0 });
  });
}
function crate(b, x, y, z, w, h, d, k, ry = 0) {
  b.add(UNIT.box, { p: [x, y + h / 2, z], r: [0, ry, 0], s: [w, h, d], c: ["#a98757", "#9a7a4c", "#b59460"][k % 3], j: 0.1 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.add(UNIT.box, { p: [x + Math.cos(ry) * sx * (w / 2 - 0.03) + Math.sin(ry) * sz * (d / 2 - 0.03), y + h / 2, z - Math.sin(ry) * sx * (w / 2 - 0.03) + Math.cos(ry) * sz * (d / 2 - 0.03)], r: [0, ry, 0], s: [0.07, h + 0.02, 0.07], c: "#6b5434", j: 0.08 });
  for (const sy of [0.05, h - 0.05]) b.add(UNIT.box, { p: [x, y + sy, z], r: [0, ry, 0], s: [w + 0.015, 0.06, d + 0.015], c: "#7a6240", j: 0.08 });
}

// ---------------------------------------------------------------------------------------------------- the wharf: decks, piles, rope, bollards
function deckGeo(x0, x1, za, zb, yTop, th = 0.3) {   // za > zb; planks run along z; uvs: u across (5 m = 1), v along (6 m = 1)
  const g = new THREE.BoxGeometry(x1 - x0, th, za - zb).toNonIndexed(), p = g.attributes.position, u = g.attributes.uv, n = g.attributes.normal;
  g.translate((x0 + x1) / 2, yTop - th / 2, (za + zb) / 2);
  const q = g.attributes.position;
  for (let i = 0; i < q.count; i++) { const ay = Math.abs(n.getY(i)); u.setXY(i, ay > 0.5 ? (q.getX(i) + 8) / 10 : 0.02 + 0.9 * ((q.getY(i) - yTop) / th + 1) * 0.1, q.getZ(i) / 6); }
  return g;
}
function pileSet(b, x, z, top, k, big = false, wl = 0) {
  const r = 0.2, bot = wl - 3;
  b.add(new THREE.CylinderGeometry(r * 0.96, r, top - bot, 12, 1).translate(0, (top + bot) / 2, 0), { p: [x, 0, z], c: big ? "#5d4a35" : "#4a3a2a", j: 0.14, grad: 0.3 });
  b.cyl(x, top, z, r * 0.9, 0.02, "#a88a60", { j: 0.1, grad: 0 });   // the cut top, weathered pale, ringed
  if (big) for (let i = 0; i < 2; i++) b.add(TORUS, { p: [x, top + 0.003, z], s: [r * (0.4 + i * 0.35), 1, r * (0.4 + i * 0.35)].map((v, j) => (j === 1 ? 0.5 : v)), c: "#7a6040", j: 0.05, grad: 0 });
  // the barnacle band at the tide line and the green above it
  if (big) for (let i = 0; i < 14; i++) { const a = hz(i + k, 201) * TAU, y = wl - 0.55 + hz(i + k, 202) * 1.1, rr2 = 0.02 + 0.03 * hz(i + k, 203); b.rock(x + Math.cos(a) * (r + 0.005), y, z + Math.sin(a) * (r + 0.005), rr2, hz(i + k, 204) > 0.5 ? "#c9c5b4" : "#a9a592", { j: 0.1, grad: 0.05 }); }
  b.cyl(x, wl - 0.75, z, r + 0.012, 0.5, "#4d5a30", { j: 0.2, grad: 0 });
  // the wear: pale rubbing ring where ropes chafe, vertical splits
  if (big) for (let i = 0; i < 3; i++) b.box(x + Math.cos(hz(i + k, 205) * TAU) * (r + 0.004), top - 0.15 - hz(i + k, 206) * 0.5, z + Math.sin(hz(i + k, 205) * TAU) * (r + 0.004), 0.015, 0.2 + 0.3 * hz(i + k, 207), 0.015, "#2c2218", { j: 0.1, grad: 0 });
}
function bollard(b, x, z, y, k) {
  b.cyl(x, y, z, 0.2, 0.6, "#4f3f2c", { j: 0.12, grad: 0.3 }); b.cyl(x, y + 0.6, z, 0.27, 0.12, "#5a4833", { j: 0.12 }); b.cyl(x, y + 0.72, z, 0.22, 0.02, "#a88a60", { j: 0.1, grad: 0 });
  for (let i = 0; i < 2; i++) b.add(TORUS, { p: [x, y + 0.34 + i * 0.07, z], s: [0.215, 0.215, 0.215], c: ROPE, j: 0.1, grad: 0.05 });
  b.add(TORUS, { p: [x + 0.4, y + 0.04, z + 0.15], s: [0.3, 0.3, 0.3], c: ROPE, j: 0.1, grad: 0.05 }); b.add(TORUS, { p: [x + 0.4, y + 0.1, z + 0.15], s: [0.24, 0.24, 0.24], c: "#a98d56", j: 0.1, grad: 0.05 });
}
// the deck section [zA .. zB] (zA > zB): returns { deck mesh(es), batch mesh } added to `into`
function wharfSection(into, zA, zB, { porch = false, key = 0, big = true, shell = true } = {}) {
  const dg = [];
  const x0 = porch ? -8 : -6;
  dg.push(deckGeo(x0, 2.0, zA, zB, 1.2));
  const b = new Batch();
  // under the deck: stringers along z, cross joists
  b.box(1.7, 0.82, (zA + zB) / 2, 0.22, 0.28, zA - zB, "#4a3a2a", { j: 0.1 }); b.box(-5.7, 0.82, (zA + zB) / 2, 0.22, 0.28, zA - zB, "#4a3a2a", { j: 0.1 });
  // the timber curb along the harbour edge, with end grain and nail heads
  const len = zA - zB, nseg = Math.max(1, Math.round(len / 3.2));
  for (let i = 0; i < nseg; i++) {
    const z0 = zA - len * i / nseg, z1 = zA - len * (i + 1) / nseg, zc = (z0 + z1) / 2, L = z0 - z1 - 0.03;
    b.box(2.16, 1.33, zc, 0.34, 0.26, L, ["#8b7656", "#7d6a4d", "#968160"][(i + key) % 3], { j: 0.1, k: i });
    b.box(2.0, 1.2, zc, 0.04, 0.12, L, "#3a2c20", { j: 0.1 });   // the shadow gap
    for (let n = 0; n < 4; n++) b.cyl(2.16 + (hz(i * 4 + n, 211) - 0.5) * 0.18, 1.46, z0 - L * (0.1 + n * 0.27), 0.022, 0.015, "#2c2622", { j: 0.05, grad: 0 });
  }
  // big piles outside the curb, every 4.4 m, with rope; piles under the deck on both sides
  const nP = Math.max(1, Math.round(len / 4.4));
  for (let i = 0; i < nP; i++) { const z = zA - len * (i + 0.5) / nP; pileSet(b, 2.6, z, 1.85 + 0.35 * hz(i + key, 220), i * 3 + key, true); if (big) ropeWrap(b, 2.6, z, 0.2, 1.1 + 0.12 * hz(i + key, 221), 3 + (i % 2), i + key); }
  for (let z = zA - 1.4; z > zB + 0.5; z -= 3) { pileSet(b, 1.85, z, 1.0, (z * 3) | 0, false); pileSet(b, -5.85, z - 0.2, 1.0, (z * 5) | 0, false); b.add(UNIT.box, { p: [2.2, 0.2, z + 1.5], r: [0, 0, 0.6], s: [0.12, 2.9, 0.12], c: "#4a3a2a", j: 0.1 }); }
  // bollards on the deck by the curb
  for (let z = zA - 2.5; z > zB + 1; z -= 9.5) bollard(b, 1.5, z, 1.2, (z | 0) + key);
  const m = b.mesh(VCOL(), "at-port-wharf"); if (m) into.add(mark(m));
  const dm = new THREE.Mesh(mergeGeometries(dg), once("deckMat", () => lit({ map: deckTex(), roughness: 0.95, color: "#c4b8ac" }))); dm.name = "at-port-deck"; into.add(mark(dm, { solid: true }));
  return { deck: dm };
}

// ---------------------------------------------------------------------------------------------------- one house (front face on local x = 0, facing +x; body back to x = -D; z -w/2..w/2; y 0 = the ground)
const STRIPES = [["#b8332a", "#efe6cf"], ["#2f5f96", "#efe6cf"], ["#d9a62e", "#efe6cf"], ["#3c7a52", "#efe6cf"], ["#c0562f", "#efe6cf"]];
const matCache = (key, make) => once("mat-" + key, make);
function house(o) {
  const { w, H, D = 8, style = "timber", roofKind = "tile", ridge = "x", balcony = false, awning = null, flower = null, washing = false, seed = 1, lite = false, broken = 0, chimney = true } = o;
  const gh = ridge === "x" ? Math.min(w / 2 * 0.72, 3.2) : Math.min(D / 2 * 0.5, 2.4), hb = Math.max(6.2, H - gh), floors = hb >= 8.7 ? 3 : 2, htot = ridge === "x" ? hb + gh : hb;
  const g = new THREE.Group(), out = { g, w, D, H: hb + gh, roofs: [], cloth: null, chimTop: null, hb, gh };
  // the shell: the box (side and back walls tile in metres), the front face with its drawn facade
  const bodyMat = matCache("body-" + style, () => lit({ map: wallTex(style), roughness: 0.95 }));
  const body = new THREE.Mesh(triplanar(new THREE.BoxGeometry(D, hb, w).translate(-D / 2 - 0.02, hb / 2, 0)), bodyMat); body.name = "at-port-body"; g.add(body);
  const fkey = [style, w, hb.toFixed(1), floors, ridge, seed % 6].join("-");
  const fpts = ridge === "x" ? [[0, 0], [w, 0], [w, hb], [w / 2, hb + gh], [0, hb]] : [[0, 0], [w, 0], [w, hb], [0, hb]];
  const fg = wallPoly(fpts, w, htot).rotateY(Math.PI / 2).translate(0.005, 0, w / 2);
  const fmat = matCache("fac-" + fkey, () => lit({ map: facadeTex(fkey, { w, hb, h: htot, style, floors, seed }), roughness: 0.95 }));
  const front = new THREE.Mesh(fg, fmat); front.name = "at-port-front"; g.add(front);
  // gables
  const gab = [];
  if (ridge === "x") gab.push(wallPoly([[-w / 2, hb], [w / 2, hb], [0, hb + gh]], 4, 4).rotateY(-Math.PI / 2).translate(-D - 0.03, 0, 0));
  else for (const sd of [1, -1]) gab.push(wallPoly([[-D, hb], [0, hb], [-D / 2, hb + gh]], 4, 4).rotateY(sd > 0 ? 0 : Math.PI).translate(sd > 0 ? 0 : 0, 0, sd * (w / 2 + 0.005)).applyMatrix4(sd > 0 ? new THREE.Matrix4() : new THREE.Matrix4().makeTranslation(-D, 0, 0)));
  if (gab.length) { const gm = new THREE.Mesh(mergeGeometries(gab.map((q) => q.toNonIndexed())), bodyMat); gm.name = "at-port-gable"; g.add(gm); }
  // the roof: two slopes about the ridge, each its own mesh so one can break
  const rmat = matCache("roof-" + roofKind, () => lit({ map: roofTex(roofKind), roughness: 0.95, side: THREE.DoubleSide }));
  const ov = 0.4, yR = hb + gh;
  const slopes = [];
  if (ridge === "x") {
    const x0 = 0.6, x1 = -D - 0.4, k = ov * gh / (w / 2);
    for (const sd of [1, -1]) slopes.push({ pivot: [0, yR, 0], axis: "x", sd, geo: quad([x0, hb - k, sd * (w / 2 + ov)], [x1, hb - k, sd * (w / 2 + ov)], [x1, yR, 0], [x0, yR, 0], 4, sd < 0) });
  } else {
    const z0 = w / 2 + 0.3, k = ov * gh / (D / 2), xf = ov + 0.15;
    slopes.push({ pivot: [-D / 2, yR, 0], axis: "z", sd: 1, geo: quad([xf, hb - k, -z0], [xf, hb - k, z0], [-D / 2, yR, z0], [-D / 2, yR, -z0], 4, false) });
    slopes.push({ pivot: [-D / 2, yR, 0], axis: "z", sd: -1, geo: quad([-D - ov, hb - k, z0], [-D - ov, hb - k, -z0], [-D / 2, yR, -z0], [-D / 2, yR, z0], 4, false) });
  }
  slopes.forEach((sl, i) => {
    sl.geo.translate(-sl.pivot[0], -sl.pivot[1], -sl.pivot[2]);
    const rg = new THREE.Group(); rg.position.set(...sl.pivot); const m = new THREE.Mesh(sl.geo, rmat); m.name = "at-port-roof"; rg.add(m); g.add(rg);
    const front = ridge === "x" ? (sl.sd === (hz(seed, 9) > 0.5 ? 1 : -1)) : sl.sd === 1;
    out.roofs.push({ rg, axis: sl.axis, sd: sl.sd, brk: broken && front ? broken : 0 });
  });
  // dark attic floor (shows when a roof opens)
  const D3 = new Batch(), at = new THREE.Mesh(new THREE.PlaneGeometry(D, w).rotateX(-Math.PI / 2).translate(-D / 2, hb + 0.04, 0), once("mat-attic", () => basic({ color: "#2a1d14" }))); at.name = "at-port-attic"; g.add(at);
  // ridge cap and rafter tails
  const rc = roofKind === "tile" ? "#8f3c26" : "#5a4e3e";
  if (ridge === "x") { D3.box(-D / 2 + 0.1, yR + 0.07, 0, D + 1.1, 0.16, 0.34, rc, { j: 0.1 }); } else { D3.box(-D / 2, yR + 0.07, 0, 0.34, 0.16, w + 0.7, rc, { j: 0.1 }); }
  if (!lite) {
    if (ridge === "x") for (let i = 0; i < 14; i++) for (const sd of [1, -1]) { const x = 0.45 - i * (D + 0.8) / 13; D3.box(x, hb - 0.34 * gh / (w / 2) - 0.12, sd * (w / 2 + ov - 0.05), 0.09, 0.09, 0.2, "#3d2c1e", { j: 0.12, grad: 0 }); }
    else for (let i = 0; i < 14; i++) for (const sx of [1, -1]) { const z = -w / 2 - 0.1 + i * (w + 0.2) / 13; D3.box(sx > 0 ? ov + 0.05 : -D - ov, hb - 0.25, z, 0.2, 0.09, 0.09, "#3d2c1e", { j: 0.12, grad: 0 }); }
  }
  // the chimney
  if (chimney) { const cx = -D * (0.55 + 0.15 * hz(seed, 11)), cz = (hz(seed, 12) - 0.5) * w * 0.3, cy0 = ridge === "x" ? yR - 0.5 : yR - 0.5; D3.box(cx, cy0 + 1.1, cz, 0.85, 2.2, 0.85, "#9b4f36", { j: 0.12 }); D3.box(cx, cy0 + 2.25, cz, 1.0, 0.16, 1.0, "#cfc3a8", { j: 0.06 }); D3.box(cx - 0.18, cy0 + 2.5, cz - 0.15, 0.22, 0.35, 0.22, "#8a4a30", { j: 0.1 }); D3.box(cx + 0.2, cy0 + 2.45, cz + 0.2, 0.22, 0.28, 0.22, "#8a4a30", { j: 0.1 }); out.chimTop = [cx, cy0 + 2.8, cz]; }
  // ground floor porch: posts, base blocks, caps; the upper floor's balcony or an awning
  const nOp = Math.max(2, Math.round(w / 2.4)), post = style === "brick" ? "#d9cfb4" : "#e6dfc9";
  for (let b = 0; b <= nOp; b++) {
    const z = -w / 2 + 0.12 + (w - 0.24) * b / nOp;
    D3.box(1.05, 1.55, z, 0.17, 3.0, 0.17, post, { j: 0.07, k: b + seed }); D3.box(1.05, 0.12, z, 0.26, 0.24, 0.26, "#7a6a52", { j: 0.08 }); D3.box(1.05, 3.02, z, 0.24, 0.1, 0.24, post, { j: 0.05 });
    D3.box(1.05, 0.24 + 0.4 * hz(b + seed, 13), z, 0.19, 0.04, 0.19, "#5a4a36", { j: 0.1, grad: 0 });
  }
  if (balcony) {
    D3.box(0.62, 3.1, 0, 1.3, 0.14, w + 0.1, "#9a8466", { j: 0.07 }); D3.box(1.28, 3.13, 0, 0.08, 0.2, w + 0.16, "#cfc5a9", { j: 0.05 });
    for (let i = 0; i < nOp * 2 + 1; i++) D3.add(UNIT.box, { p: [0.8, 2.98, -w / 2 + w * i / (nOp * 2)], r: [0, 0, 0.7], s: [0.07, 0.5, 0.07], c: "#6a5a42", j: 0.08, grad: 0 });   // brackets
    const rail = "#efe9d6"; D3.box(1.2, 4.18, 0, 0.1, 0.09, w + 0.14, rail, { j: 0.04 }); D3.box(1.2, 3.34, 0, 0.08, 0.07, w + 0.12, rail, { j: 0.04 });
    const nb = lite ? 8 : Math.round((w - 0.1) / 0.17);
    for (let i = 0; i <= nb; i++) D3.box(1.2, 3.76, -w / 2 + 0.06 + (w - 0.12) * i / nb, 0.055, 0.82, 0.055, rail, { j: 0.05, grad: 0.05 });
    for (const sd of [-1, 1]) { D3.box(1.2, 3.76, sd * (w / 2 + 0.04), 0.16, 1.06, 0.14, rail, { j: 0.04 }); D3.box(1.2, 4.28, sd * (w / 2 + 0.04), 0.2, 0.08, 0.18, rail, { j: 0.04 }); }
  } else if (awning) {
    const [c1, c2] = awning, n = Math.round(w / 0.32), x0 = 0.05, x1 = 1.55, y0 = 3.55, y1 = 2.75, ang = Math.atan2(y0 - y1, x1 - x0), L = Math.hypot(x1 - x0, y0 - y1);
    for (let i = 0; i < n; i++) { const z = -w / 2 + w * (i + 0.5) / n; D3.add(UNIT.box, { p: [(x0 + x1) / 2, (y0 + y1) / 2, z], r: [0, 0, -ang], s: [L, 0.035, w / n + 0.003], c: i % 2 ? c2 : c1, j: 0.05, grad: 0.05 }); D3.box(x1 + 0.01, y1 - 0.11, z, 0.03, 0.2, w / n, i % 2 ? c2 : c1, { j: 0.05, grad: 0.1 }); }
    for (const sd of [-1, 1]) D3.add(UNIT.box, { p: [(x0 + x1) / 2, (y0 + y1) / 2 - 0.04, sd * (w / 2 + 0.01)], r: [0, 0, -ang], s: [L, 0.04, 0.03], c: "#4a3a2a" });
    D3.box(x1, y1 - 0.02, 0, 0.05, 0.05, w + 0.06, "#3a2c20");
  }
  // the shutters: some stand open, hinged at their outer edge, painted and peeling
  const shut = ["#2f6f78", "#3d7a4a", "#5a7a8a", "#6b3a2a", "#2f5a6f"][Math.floor(hz(seed, 80) * 5)], nb2 = Math.max(2, Math.round(w / 2.3)), gf = 3.2, fl = (hb - gf) / Math.max(1, floors - 1);
  for (let f = 1; f < floors; f++) for (let b = 0; b < nb2; b++) {
    const k = b * 7 + f + seed; if (hz(b + f * 5, seed) > 0.9) continue; const cx = -w / 2 + w * (b + 0.5) / nb2, cy = gf + fl * (f - 0.5);
    if (hz(k, 83) > 0.5) for (const sd of [-1, 1]) { const a = 0.45 + 0.9 * hz(k + sd, 84), hz0 = cx + sd * 0.45; D3.add(UNIT.box, { p: [0.04 + 0.205 * Math.sin(a), cy, hz0 + sd * 0.205 * Math.cos(a)], r: [0, sd * a, 0], s: [0.04, 1.33, 0.41], c: shut, j: 0.1, k }); }
    if (hz(k, 85) > 0.6 && !lite) { D3.box(0.1, cy - 0.78, cx, 0.14, 0.16, 1.1, "#6b4a2c", { j: 0.1 }); for (let q = 0; q < 6; q++) D3.rock(0.12, cy - 0.64, cx - 0.45 + q * 0.18, 0.09 + 0.05 * hz(q + k, 86), q % 2 ? "#d65a8a" : "#4f8a3a", { sy: 0.8 }); }
  }
  // goods under the porch: barrels, sacks, a crate
  if (!lite) { const ng = 2 + (seed % 3); for (let i = 0; i < ng; i++) { const z = -w / 2 + 0.7 + hz(i + seed, 14) * (w - 1.4); if (i % 2) barrel(D3, 0.55, 0, z, i + seed); else { D3.blob(0.5, 0.25, z, 0.3, "#c9b78e", { sy: 0.85, j: 0.1 }); D3.blob(0.55, 0.52, z + 0.1, 0.24, "#bba978", { sy: 0.8, j: 0.1 }); } } D3.box(0.6, 0.8, -w / 2 + 0.5, 0.01, 0.01, 0.01, "#000"); }
  // a lantern on the corner post
  if (!lite) { D3.box(1.08, 2.45, w / 2 - 0.15, 0.22, 0.3, 0.22, "#2a2a2a", { grad: 0 }); D3.box(1.08, 2.45, w / 2 - 0.15, 0.14, 0.2, 0.14, "#f2cf7a", { grad: 0, j: 0 }); }
  const dm = D3.mesh(VCOL(), "at-port-detail"); if (dm) g.add(dm);
  // flowers climbing the balcony and the posts
  if (flower) {
    const FB = new Batch(), pal = flower === "yellow" ? ["#f2c230", "#e8ae1c", "#f6d452"] : ["#d1409a", "#e0559f", "#b02f86", "#f06aa8"];
    const nF = lite ? 22 : 70;
    for (let i = 0; i < nF; i++) {
      const side = hz(i + seed, 15), z = (side > 0.45 ? -w / 2 + 0.1 + (w - 0.2) * hz(i, 16) * (side > 0.8 ? 0.2 : 1) : (side > 0.2 ? -w / 2 : w / 2) + (hz(i, 17) - 0.5) * 0.8);
      const y = balcony ? 3.3 + hz(i + seed, 18) * 1.3 : 1.5 + hz(i + seed, 18) * 2.4, x = 0.5 + hz(i + seed, 19) * 0.9;
      FB.rock(x, y, z, 0.06 + 0.11 * hz(i + seed, 20), pal[i % pal.length], { j: 0.12, sy: 0.85 });
      if (i % 2) FB.rock(x - 0.1, y - 0.1, z + (hz(i, 21) - 0.5) * 0.25, 0.05 + 0.07 * hz(i + seed, 22), "#4f8a3a", { j: 0.15 });
    }
    const fm = FB.mesh(VCOL(), "at-port-flowers"); if (fm) g.add(fm);
  }
  // washing: poles on the balcony ends and a line with hung cloths, animated
  if (washing && balcony) {
    const WB = new Batch(); for (const sd of [-1, 1]) WB.cyl(1.15, 3.2, sd * (w / 2 - 0.3), 0.035, 2.2, "#6a5a42", { grad: 0 });
    const wm = WB.mesh(VCOL(), "at-port-poles"); g.add(wm);
    const n = 5, nq = 3, ps = new Float32Array(n * (nq + 1) * 2 * 3), cs = new Float32Array(ps.length), idx = [], cc = ["#f4efe2", "#e9dfc8", "#b7c9d6", "#f7f3ea", "#d8c9b0", "#c9d5c0"];
    for (let c = 0; c < n; c++) { for (let j = 0; j <= nq; j++) for (let r = 0; r < 2; r++) { const q = (c * (nq + 1) + j) * 2 + r, k = col(cc[(c + seed) % cc.length]); cs[q * 3] = k.r * (1 - 0.1 * r); cs[q * 3 + 1] = k.g * (1 - 0.1 * r); cs[q * 3 + 2] = k.b * (1 - 0.1 * r); if (j < nq && r === 0) { idx.push(q, q + 2, q + 1, q + 1, q + 2, q + 3); } } }
    const gg = new THREE.BufferGeometry(); gg.setAttribute("position", new THREE.BufferAttribute(ps, 3).setUsage(THREE.DynamicDrawUsage)); gg.setAttribute("color", new THREE.BufferAttribute(cs, 3)); gg.setIndex(idx); gg.boundingSphere = new THREE.Sphere(new THREE.Vector3(1.1, 4.5, 0), w);
    const cm = new THREE.Mesh(gg, VCOL2()); cm.name = "at-port-washing"; g.add(cm);
    const zA = -w / 2 + 0.3, zB = w / 2 - 0.3;
    out.cloth = { gg, update(t) {
      const a = gg.attributes.position.array, wind = Math.sin(t * 1.3 + seed) * 0.5 + 0.5;
      for (let c = 0; c < n; c++) {
        const zc = lerp(zA, zB, (c + 0.5) / n), w2 = (zB - zA) / n * 0.7, len = 0.62 + 0.18 * hz(c + seed, 30);
        for (let j = 0; j <= nq; j++) for (let r = 0; r < 2; r++) {
          const q = (c * (nq + 1) + j) * 2 + r, f = r, z0 = zc + (j / nq - 0.5) * w2, ysag = 5.4 - 0.07 * Math.sin(Math.PI * (z0 - zA) / (zB - zA)) * 3;
          const sw = Math.sin(t * 2.4 + c * 1.7 + j * 0.9 + seed) * 0.05 * f * (0.6 + wind) + Math.sin(t * 5.1 + c + j) * 0.012 * f;
          a[q * 3] = 1.15 + sw * 1.4 + 0.08 * f; a[q * 3 + 1] = ysag - len * f; a[q * 3 + 2] = z0 + 0.05 * Math.sin(t * 1.9 + c + j * 1.3) * f;
        }
      }
      gg.attributes.position.needsUpdate = true;
    } };
    out.cloth.update(0);
    const ll = new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute([1.15, 5.42, zA - 0.05, 1.15, 5.34, (zA + zB) / 2, 1.15, 5.34, (zA + zB) / 2, 1.15, 5.42, zB + 0.05], 3));
    const ln = new THREE.LineSegments(ll, new THREE.LineBasicMaterial({ color: "#5a4a36" })); ln.name = "at-port-line"; g.add(ln);
  }
  mark(g);
  return out;
}

// ---------------------------------------------------------------------------------------------------- the land: terrain, earth, trees, palms, the hill town
const SLAB = { x0: -32, x1: 8, zN: 20, zS: -40 };   // the sliding block's footprint (multiples of 4: the terrain grid is cut along it)
const HAZE = "#a9d0e6";
const hazeOf = (c, z, x = 0) => { const d = Math.hypot(z, x * 0.5); return mix(c, HAZE, 0.4 * sstep(150, 900, d)); };
function terrainH(x, z) {
  const u = frontX(z) - x;
  if (u < -3) return -4; if (u < 0) return lerp(-4, 1.15, sstep(-3, 0, u) ** 0.7);
  const n = Math.sin(x * 0.07 + z * 0.045) * 1.3 + Math.sin(x * 0.13 - z * 0.09) * 0.7 + Math.sin(z * 0.031 + 1.7) * 1.4;
  if (u < 26) return 1.2;
  const a = sstep(26, 56, u), b = sstep(56, 150, u), c2 = sstep(150, 400, u);
  return 1.2 + 17 * a + 42 * b + 20 * c2 + n * (0.15 + 0.85 * a) * (1 + 1.6 * b);
}
function terrainColor(x, z, h, u) {
  const n = hz((x * 0.21) | 0, (z * 0.21) | 0), m = hz((x * 0.043) | 0, (z * 0.043) | 0);
  if (u < 0) return "#b8a77c";                          // beach / foot of the wharf
  if (u < 26) return mix("#c9b88f", "#b3a173", n * 0.8);     // beaten earth of the streets and yards
  const g = [["#4f9a2f", "#78c040"], ["#2f7a2c", "#4f9a35"], ["#62b03c", "#8ccc48"]][Math.floor(m * 3)];
  return mix(mix(g[0], g[1], n), "#a89a64", sstep(0.85, 1, hz((x * 0.09) | 0, (z * 0.09) | 0)) * 0.7);
}
function terrain(into) {
  const xs = [], zs = [];
  for (let x = -420; x < -60; x += 20) xs.push(x); for (let x = -60; x < 8; x += 4) xs.push(x); for (let x = 8; x < 120; x += 8) xs.push(x); for (let x = 120; x <= 300; x += 20) xs.push(x);
  for (let z = 20; z > -120; z -= 4) zs.push(z); for (let z = -120; z > -300; z -= 10) zs.push(z); for (let z = -300; z >= -740; z -= 30) zs.push(z);
  const cut = (x, z) => x >= SLAB.x0 && x < SLAB.x1 && z <= SLAB.zN && z > SLAB.zS;   // a cell (by its near corner) inside the slab's footprint
  const pos = [], cl = [], idx = [], sk = new Batch();
  const vid = new Map(), V = (x, z) => { const k = x + "," + z; if (vid.has(k)) return vid.get(k); const h = terrainH(x, z), u = frontX(z) - x, c = col(hazeOf(terrainColor(x, z, h, u), z, x)); pos.push(x, h, z); cl.push(c.r, c.g, c.b); vid.set(k, pos.length / 3 - 1); return vid.get(k); };
  for (let j = 0; j < zs.length - 1; j++) for (let i = 0; i < xs.length - 1; i++) {
    const x0 = xs[i], x1 = xs[i + 1], zA = zs[j], zB = zs[j + 1];
    if (cut(x0, zA) && zB >= SLAB.zS) continue; if (x0 >= SLAB.x0 && x1 <= SLAB.x1 && zA <= SLAB.zN && zB >= SLAB.zS) continue;
    const a = V(x0, zA), b = V(x1, zA), c = V(x1, zB), d = V(x0, zB); idx.push(a, b, d, b, c, d);
    // the cut faces of the earth, banded like strata, where this cell touches the slab's footprint
    const touchX = (x1 === SLAB.x0 && zA <= SLAB.zN && zB >= SLAB.zS), touchZ = (zA === SLAB.zS && x0 >= SLAB.x0 && x1 <= SLAB.x1), touchE = (x0 === SLAB.x1 && zA <= SLAB.zN && zB >= SLAB.zS);
    const band = (xa, za, xb, zb, h0, nx, nz) => { for (let y = h0, k = 0; y > -2.5; y -= 0.9, k++) { const c0 = mix(["#8a6a45", "#7a5a3a", "#9a7a50", "#6a4e32"][k % 4], "#5a4630", 0.25 * hz(k + xa, za)); sk.add(new THREE.PlaneGeometry(Math.hypot(xb - xa, zb - za), 0.9), { p: [(xa + xb) / 2 + nx * 0.01, y - 0.45, (za + zb) / 2 + nz * 0.01], r: [0, Math.atan2(nx, nz), 0], c: c0, j: 0.08, grad: 0 }); } };
    if (touchX) band(x1, zA, x1, zB, Math.max(terrainH(x1, zA), terrainH(x1, zB)), 1, 0);
    if (touchZ) band(x0, zA, x1, zA, Math.max(terrainH(x0, zA), terrainH(x1, zA)), 0, 1);
    if (touchE) band(x0, zA, x0, zB, Math.max(terrainH(x0, zA), terrainH(x0, zB)), -1, 0);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(cl, 3)); g.setIndex(idx); g.computeVertexNormals();
  const tm = new THREE.Mesh(g, once("mat-terrain", () => lit({ vertexColors: true, roughness: 1 }))); tm.name = "at-port-terrain"; into.add(mark(tm));
  const sm = sk.mesh(VCOL2(), "at-port-scarp"); if (sm) into.add(mark(sm));
}
function groundTex() {
  return once("ground", () => {
    const S = 512, [c, x] = canvas(S, S); x.fillStyle = "#c6b48a"; x.fillRect(0, 0, S, S);
    for (let i = 0; i < 400; i++) { x.fillStyle = `rgba(${hz(i, 300) > 0.5 ? "120,95,60" : "235,222,190"},${0.08 + 0.12 * hz(i, 301)})`; const r = 3 + 24 * hz(i, 302) ** 2; x.beginPath(); x.ellipse(hz(i, 303) * S, hz(i, 304) * S, r, r * 0.7, hz(i, 305) * 3, 0, TAU); x.fill(); }
    for (let i = 0; i < 260; i++) { const px = hz(i, 306) * S, py = hz(i, 307) * S, r = 1 + 3.5 * hz(i, 308); x.fillStyle = ["#8a7a62", "#a89878", "#d6caa8", "#6e6048"][i % 4]; x.beginPath(); x.ellipse(px, py, r, r * 0.7, hz(i, 309) * 3, 0, TAU); x.fill(); x.fillStyle = "rgba(0,0,0,0.25)"; x.beginPath(); x.ellipse(px + 1.2, py + 1.4, r, r * 0.6, hz(i, 309) * 3, 0, TAU); x.fill(); }
    x.strokeStyle = "rgba(90,70,45,0.28)"; x.lineWidth = 7; for (const ox of [150, 215]) { x.beginPath(); x.moveTo(ox, 0); x.bezierCurveTo(ox + 14, 150, ox - 10, 330, ox + 8, S); x.stroke(); }
    for (let i = 0; i < 90; i++) { x.strokeStyle = "rgba(90,130,50,0.5)"; x.lineWidth = 1.2; const px = hz(i, 310) * S, py = hz(i, 311) * S; for (let k = 0; k < 4; k++) { x.beginPath(); x.moveTo(px, py); x.lineTo(px + (k - 1.5) * 2.5, py - 6 - 4 * hz(i + k, 312)); x.stroke(); } }
    return tex(c, { wrap: true });
  });
}
// the earth block of the sliding slab: a textured top and banded earth sides, bulkhead of tarred timber on the harbour side
function slabLand(into) {
  const x0 = SLAB.x0, x1 = -8, zN = SLAB.zN, zS = SLAB.zS, top = 1.2;
  const g = new THREE.PlaneGeometry(x1 - x0, zN - zS).rotateX(-Math.PI / 2).translate((x0 + x1) / 2, top - 0.02, (zN + zS) / 2), u = g.attributes.uv, p = g.attributes.position;
  for (let i = 0; i < u.count; i++) u.setXY(i, p.getX(i) / 6, p.getZ(i) / 6);
  const m = new THREE.Mesh(g, once("mat-ground", () => lit({ map: groundTex(), roughness: 1 }))); m.name = "at-port-ground"; into.add(mark(m, { solid: true }));
  const b = new Batch();
  const faces = [[x0, zN, x0, zS, -1, 0], [x0, zS, x1, zS, 0, -1], [x1, zN, x0, zN, 0, 1]];
  for (const [xa, za, xb, zb, nx, nz] of faces) for (let y = top - 0.02, k = 0; y > -8; y -= 0.9, k++) b.add(new THREE.PlaneGeometry(Math.hypot(xb - xa, zb - za), 0.9), { p: [(xa + xb) / 2 + nx * 0.01, y - 0.45, (za + zb) / 2 + nz * 0.01], r: [0, Math.atan2(nx, nz), 0], c: mix(["#8a6a45", "#7a5a3a", "#9a7a50", "#6a4e32"][k % 4], "#5a4630", 0.25 * hz(k + xa, za)), j: 0.1, grad: 0 });
  // the harbour-side bulkhead: vertical tarred planks, each its own tone, with iron straps
  for (let z = zN; z > zS + 0.01; z -= 0.28) b.box(x1 + 0.12, -1.6, z - 0.14, 0.14, 5.6, 0.26, ["#4a3a2a", "#3f3224", "#55432f", "#4d3c28"][((z + 100) * 3 | 0) % 4], { j: 0.1, k: z * 7, grad: 0.3 });
  for (const y of [0.5, -1.0]) b.box(x1 + 0.2, y, (zN + zS) / 2, 0.05, 0.12, zN - zS, "#2a2724", { j: 0.05, grad: 0 });
  // earth rubble and mounds on the street, little tufts of grass, stones
  for (let i = 0; i < 90; i++) { const x = x0 + 2 + hz(i, 320) * (x1 - x0 - 4), z = zS + 2 + hz(i, 321) * (zN - zS - 4); b.blob(x, 1.2, z, 0.1 + 0.25 * hz(i, 322), hz(i, 323) > 0.5 ? "#9a8a6a" : "#7a6c52", { sy: 0.6, j: 0.15 }); }
  const mm = b.mesh(VCOL2(), "at-port-landsides"); if (mm) into.add(mark(mm));
}
// trees: round canopies with a trunk, clustered; positions from a hash on the terrain
function trees(into, n0) {
  const b = new Batch();
  for (let i = 0; i < n0; i++) {
    const z = 10 - hz(i, 401) * 480 ** (0.8 + 0.2 * hz(i, 402)), xx = hz(i, 403);
    const x = lerp(-330, 80, xx) ; const u = frontX(z) - x; if (u < 36) continue;
    if (x >= SLAB.x0 - 6 && x < SLAB.x1 && z < SLAB.zN + 6 && z > SLAB.zS - 6) continue;
    const y = terrainH(x, z), r = 2.2 + 3.6 * hz(i, 404) + 0.01 * u * hz(i, 405), pal = ["#3f7a35", "#4f8f3a", "#2f6a30", "#5da042", "#6aa845"], c = hazeOf(pal[Math.floor(hz(i, 406) * 5)], z, x);
    b.cyl(x, y - 0.5, z, 0.25 + 0.002 * r, r * 0.8, "#5a4630", { grad: 0 }); b.blob(x, y + r * 0.9, z, r, c, { sy: 0.85, j: 0.1 }); b.blob(x + r * 0.5, y + r * 0.7, z + r * 0.2, r * 0.7, hazeOf(pal[(i + 2) % 5], z, x), { sy: 0.8, j: 0.1 });
  }
  const m = b.mesh(VCOL(), "at-port-trees"); if (m) into.add(mark(m));
}
// a palm: curved trunk with ring marks, 12 fronds each with its own droop, lean and shade; returns nothing
function palm(into, x, y, z, h, lean, dirA, k) {
  const T = new Batch(), Fr = new Batch(), segs = 9;
  const ptAt = (f) => { const bend = lean * f * f * h; return [x + Math.cos(dirA) * bend, y + h * f, z + Math.sin(dirA) * bend]; };
  for (let i = 0; i < segs; i++) {
    const a = ptAt(i / segs), b = ptAt((i + 1) / segs), len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), r = 0.3 - 0.13 * (i / segs);
    const dir = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize(), q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir), e = new THREE.Euler().setFromQuaternion(q, "YXZ");
    T.add(new THREE.CylinderGeometry(r * 0.88, r, 1, 8).translate(0, 0.5, 0), { p: a, r: [e.x, e.y, e.z], s: [1, len, 1], c: "#8c7a60", j: 0.1, grad: 0.3, k: k + i });
    for (let rg = 0; rg < 3; rg++) { const f = (rg + 0.5) / 3, pt = [lerp(a[0], b[0], f), lerp(a[1], b[1], f), lerp(a[2], b[2], f)]; T.add(TORUS, { p: pt, r: [e.x, e.y, e.z], s: [r + 0.01, 1, r + 0.01].map((v, j) => (j === 1 ? r + 0.01 : v)), c: "#5f5038", j: 0.1, grad: 0 }); }
  }
  const top = ptAt(1), nF = 13;
  T.blob(top[0], top[1] - 0.2, top[2], 0.32, "#5a8a3a", { j: 0.1 });
  for (let i = 0; i < nF; i++) {
    const az = (i / nF) * TAU + hz(i + k, 410) * 0.5, up = 0.55 - 0.9 * hz(i + k, 411) ** 1.2 + 0.4, L = 4.4 + 2.4 * hz(i + k, 412), droop = 0.5 + 0.9 * hz(i + k, 413), n = 9;
    const rows = [];
    for (let s = 0; s <= n; s++) {
      const f = s / n, out = L * f, yy = L * (up * f - droop * f * f * 0.9), w = (0.07 + 0.75 * Math.sin(Math.PI * Math.pow(f, 0.6)) * (1 - f * 0.4)) * (s === n ? 0 : 1);
      const cx = top[0] + Math.cos(az) * out, cz = top[2] + Math.sin(az) * out, cy = top[1] + yy, sx = -Math.sin(az) * w, sz = Math.cos(az) * w, tip = s % 2 ? 0.92 : 1;
      rows.push([[cx + sx * tip, cy - 0.18 * w, cz + sz * tip], [cx, cy + 0.05, cz], [cx - sx * tip, cy - 0.18 * w, cz - sz * tip]]);
    }
    const sh = (i % 3 === 0 ? "#6aa83e" : i % 3 === 1 ? "#4f9a3a" : "#3f8a35");
    for (let s = 0; s < n; s++) for (let sd = 0; sd < 2; sd++) {
      const a = rows[s], b = rows[s + 1], c0 = hazeOf(mix(sh, "#2f6a2c", 0.15 + 0.3 * (s / n)), z, x), g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute([...a[sd * 2], ...a[1], ...b[1], ...b[sd * 2]], 3)); g.setIndex(sd ? [0, 2, 1, 0, 3, 2] : [0, 1, 2, 0, 2, 3]); g.computeVertexNormals();
      Fr.add(g, { c: c0, j: 0.08, k: i * 9 + s, grad: 0 });
    }
  }
  const tm = T.mesh(VCOL(), "at-port-palm-trunk"), fm = Fr.mesh(VCOL2(), "at-port-palm-fronds"); const gg = new THREE.Group(); gg.add(tm, fm); into.add(mark(gg)); return gg;
}

// ---------------------------------------------------------------------------------------------------- the church tower (22 m, gold cupola) and its nave
function church(into, tx, tz) {
  const y0 = terrainH(tx, tz), ang = -frontAng(tz), g = new THREE.Group(); g.position.set(tx, y0 - 0.5, tz); g.rotation.y = ang; g.scale.setScalar(1.45);
  const B = new Batch(), brick = lit({ map: wallTex("brick"), roughness: 0.95 });
  const sh = new THREE.Mesh(triplanar(new THREE.BoxGeometry(6.4, 15, 6.4).translate(0, 7.5, 0)), brick); sh.name = "at-port-tower-shaft"; g.add(sh);
  const bel = new THREE.Mesh(triplanar(new THREE.BoxGeometry(5.8, 4.6, 5.8).translate(0, 17.3, 0)), brick); bel.name = "at-port-tower-belfry"; g.add(bel);
  // white corner quoins, string courses, cornices
  for (let y = 0.4; y < 15; y += 0.9) for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) B.box(sx * 3.2, y, sz * 3.2, y % 1.8 < 0.9 ? 0.65 : 0.45, 0.45, y % 1.8 < 0.9 ? 0.45 : 0.65, "#e9e1cc", { j: 0.06, grad: 0 });
  for (const y of [5.2, 10.2, 15.1]) B.box(0, y, 0, 6.8, 0.28, 6.8, "#e9e1cc", { j: 0.05, grad: 0.1 });
  B.box(0, 19.75, 0, 6.5, 0.36, 6.5, "#efe8d4", { j: 0.05 }); B.box(0, 20.05, 0, 6.2, 0.22, 6.2, "#e9e1cc", { j: 0.05 });
  // arched windows on the shaft and the open belfry arches on every face
  for (const f of [0, 1, 2, 3]) {
    const R = new THREE.Matrix4().makeRotationY(f * Math.PI / 2);
    B.under(R, () => {
      for (const y of [3.1, 8.1, 12.6]) { B.box(0, y, 3.22, 0.9, 1.6, 0.08, "#e9e1cc", { grad: 0 }); B.box(0, y, 3.25, 0.62, 1.32, 0.06, "#1d2a35", { grad: 0, j: 0 }); B.blob(0, y + 0.66, 3.25, 0.31, "#1d2a35", { sy: 0.3, grad: 0, j: 0 }); }
      for (const sx of [-1.4, 0, 1.4]) { B.box(sx, 17.3, 2.94, 1.05, 2.6, 0.1, "#efe8d4", { grad: 0 }); B.box(sx, 17.1, 2.99, 0.78, 2.2, 0.06, "#14202a", { grad: 0, j: 0 }); B.blob(sx, 18.2, 2.99, 0.39, "#14202a", { sy: 0.35, grad: 0, j: 0 }); }
    });
  }
  // the clock on the shaft face, then the octagonal lantern and the gold cupola with its cross
  B.under(new THREE.Matrix4(), () => { B.add(new THREE.CylinderGeometry(0.85, 0.85, 0.1, 20).rotateX(Math.PI / 2), { p: [0, 12.3, 3.25], c: "#f2ecd8", grad: 0 }); B.box(0, 12.3, 3.31, 0.07, 0.62, 0.02, "#2a2a2a", { grad: 0 }); B.box(0.2, 12.4, 3.31, 0.4, 0.06, 0.02, "#2a2a2a", { grad: 0 }); });
  B.add(new THREE.CylinderGeometry(1.7, 1.9, 1.4, 8).translate(0, 0.7, 0), { p: [0, 20.2, 0], c: "#f0e9d4", grad: 0.1 });
  for (let i = 0; i < 8; i++) { const a = i * TAU / 8 + TAU / 16; B.box(Math.cos(a) * 1.78, 20.9, Math.sin(a) * 1.78, 0.3, 0.9, 0.3, "#d8d0b8", { grad: 0 }); if (i % 2 === 0) B.box(Math.cos(a) * 1.7, 20.9, Math.sin(a) * 1.7, 0.7, 0.8, 0.08, "#1d2a35", { grad: 0, j: 0 }); }
  const dome = new THREE.SphereGeometry(1.95, 16, 8, 0, TAU, 0, Math.PI / 2); B.add(dome, { p: [0, 21.6, 0], s: [1, 1.15, 1], c: "#e0aa22", j: 0.04, grad: 0.1 });
  B.cyl(0, 23.7, 0, 0.1, 1.4, "#e0aa22", { grad: 0 }); B.box(0, 24.7, 0, 0.8, 0.12, 0.12, "#e0aa22", { grad: 0 }); B.blob(0, 23.65, 0, 0.3, "#e0aa22", { grad: 0 });
  // the nave behind it: long hall, tile roof, arched windows, a buttress each bay
  const nv = new THREE.Mesh(triplanar(new THREE.BoxGeometry(18, 9, 11).translate(-12, 4.5, 0)), once("mat-nave", () => lit({ map: wallTex("lime"), roughness: 0.95 }))); nv.name = "at-port-nave"; g.add(nv);
  const rf = new THREE.Mesh(mergeGeometries([quad([-3, 8.6, 6.4], [-21.4, 8.6, 6.4], [-21.4, 13.2, 0], [-3, 13.2, 0], 4), quad([-3, 8.6, -6.4], [-3, 13.2, 0], [-21.4, 13.2, 0], [-21.4, 8.6, -6.4], 4)].map((q) => q.toNonIndexed())), once("mat-naveroof", () => lit({ map: roofTex("tile"), side: THREE.DoubleSide }))); rf.name = "at-port-naveroof"; g.add(rf);
  for (let i = 0; i < 4; i++) for (const sd of [1, -1]) { B.box(-6 - i * 4.2, 4.4, sd * 5.6, 0.7, 8.8, 0.5, "#efe8d4", { grad: 0 }); B.box(-8.1 - i * 4.2, 4.6, sd * 5.53, 1.1, 2.6, 0.08, "#1d2a35", { grad: 0, j: 0 }); B.blob(-8.1 - i * 4.2, 5.9, sd * 5.53, 0.55, "#1d2a35", { sy: 0.4, grad: 0, j: 0 }); }
  B.box(-12, 9.0, 0, 18.4, 0.3, 11.4, "#efe8d4", { grad: 0 });
  const m = B.mesh(VCOL(), "at-port-church-trim"); g.add(m); mark(g); into.add(g); return g;
}

// ---------------------------------------------------------------------------------------------------- lighter blocks: the town behind, on the hill and round the bay (merged)
function townBlocks(into, list, key) {
  const B = new Batch(), wallC = ["#efe6cf", "#e9dcc0", "#d8c7a4", "#f3ede0", "#cfb88e", "#e4d2b0"], roofC = ["#b4512c", "#c4623a", "#a2452a", "#6e7480", "#b4512c", "#8a7a62"];
  list.forEach((h, i) => {
    const k = i + key, w = h.w, D = h.D, hh = h.h, c = hazeOf(wallC[Math.floor(hz(k, 500) * wallC.length)], h.z, h.x), rc = hazeOf(roofC[Math.floor(hz(k, 501) * roofC.length)], h.z, h.x);
    const M = new THREE.Matrix4().compose(new THREE.Vector3(h.x, h.y, h.z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, h.yaw, 0)), new THREE.Vector3(1, 1, 1));
    B.under(M, () => {
      B.box(-D / 2, hh / 2, 0, D, hh, w, c, { j: 0.07, k });
      const gh = Math.min(w, D) * 0.32, ridgeX = hz(k, 502) > 0.5;
      if (ridgeX) { B.add(poly([[-w / 2, 0], [w / 2, 0], [0, gh]], -D - 0.3, 0.5).rotateY(Math.PI / 2).translate(0, hh, 0), { c: rc, j: 0.06, k }); }
      else { B.add(poly([[-D - 0.3, 0], [0.5, 0], [-D / 2, gh]], -w / 2 - 0.3, w / 2 + 0.3).translate(0, hh, 0), { c: rc, j: 0.06, k }); }
      const nw = Math.max(2, Math.round(w / 2.6));
      for (let f = 0; f < (hh > 8 ? 3 : 2); f++) for (let b = 0; b < nw; b++) { const z = -w / 2 + w * (b + 0.5) / nw, y = 1.5 + f * 2.8; if (f === 0 && b === (k % nw)) { B.box(0.02, 1.1, z, 0.06, 2.2, 1.1, "#4a3426", { grad: 0, j: 0 }); continue; } B.box(0.03, y + 0.9, z, 0.06, 1.3, 0.85, "#26384a", { grad: 0, j: 0 }); B.box(0.04, y + 0.9, z - 0.62, 0.05, 1.3, 0.34, ["#2f6f78", "#3d7a4a", "#6b3a2a"][(k + b) % 3], { grad: 0, j: 0.05 }); B.box(0.04, y + 0.9, z + 0.62, 0.05, 1.3, 0.34, ["#2f6f78", "#3d7a4a", "#6b3a2a"][(k + b) % 3], { grad: 0, j: 0.05 }); }
      if (hz(k, 503) > 0.4) B.box(-D * 0.6, hh + gh * 0.7, 0, 0.7, 2.2, 0.7, "#9b4f36", { j: 0.1 });
    });
  });
  const m = B.mesh(VCOL(), "at-port-town"); if (m) into.add(mark(m));
}
// the far sky: pale blue mountain range and cumulus on cards behind everything (no depth write, drawn first)
function skyCards(into) {
  const mt = once("mount", () => {
    const [c, x] = canvas(4096, 512);
    const ridge = (base, amp, col1, col2, seed, f) => { const g = x.createLinearGradient(0, base - amp, 0, 512); g.addColorStop(0, col1); g.addColorStop(1, col2); x.fillStyle = g; x.beginPath(); x.moveTo(0, 512); for (let px = 0; px <= 4096; px += 8) { const t = px / 4096, h = amp * (0.5 + 0.28 * Math.sin(t * 17 + seed) + 0.2 * Math.sin(t * 41 + seed * 2.1) + 0.1 * Math.sin(t * 97 + seed * 3.7)) * (0.55 + 0.45 * Math.sin(t * 7 + seed * 0.7)) ; x.lineTo(px, base - h); } x.lineTo(4096, 512); x.closePath(); x.fill(); };
    ridge(470, 300, "#9fb8d6", "#bcd2e4", 1.3); ridge(500, 220, "#86a4c8", "#a9c4dc", 4.1); ridge(520, 140, "#6f93bb", "#98b6d2", 7.7);
    x.strokeStyle = "rgba(255,255,255,0.18)"; x.lineWidth = 2; for (let i = 0; i < 90; i++) { const px = hz(i, 600) * 4096, py = 330 + 100 * hz(i, 601); x.beginPath(); x.moveTo(px, py); x.lineTo(px + 20 + 50 * hz(i, 602), py + 40 * hz(i, 603)); x.stroke(); }
    const hg = x.createLinearGradient(0, 380, 0, 512); hg.addColorStop(0, "rgba(206,228,240,0)"); hg.addColorStop(1, "rgba(206,228,240,0.8)"); x.fillStyle = hg; x.fillRect(0, 380, 4096, 132);
    return tex(c, { aniso: 4 });
  });
  const mm = new THREE.Mesh(new THREE.PlaneGeometry(3000, 330).translate(-200, 120, -960), basic({ map: mt, transparent: true, depthWrite: false })); mm.renderOrder = -6; mm.name = "at-port-mountains"; into.add(mark(mm));
  const cu = once("cumulus", () => {
    const [c, x] = canvas(512, 256);
    for (let i = 0; i < 26; i++) { const px = 70 + hz(i, 610) * 370, py = 150 - 60 * Math.sin(px / 512 * Math.PI) * hz(i, 611) - 10, r = 28 + 44 * hz(i, 612) * Math.sin(px / 512 * Math.PI), g = x.createRadialGradient(px - r * 0.2, py - r * 0.3, 0, px, py, r); g.addColorStop(0, "#ffffff"); g.addColorStop(0.65, "#f4f8fc"); g.addColorStop(1, "#cfe0ee"); x.fillStyle = g; x.beginPath(); x.arc(px, py, r, 0, TAU); x.fill(); }
    const bg = x.createLinearGradient(0, 130, 0, 205); bg.addColorStop(0, "rgba(160,185,210,0)"); bg.addColorStop(1, "rgba(150,178,206,0.75)"); x.globalCompositeOperation = "source-atop"; x.fillStyle = bg; x.fillRect(0, 130, 512, 100); x.globalCompositeOperation = "destination-out"; x.fillRect(0, 205, 512, 60);
    return tex(c, { aniso: 4 });
  });
  for (let i = 0; i < 7; i++) { const w = 260 + 200 * hz(i, 620), m = new THREE.Mesh(new THREE.PlaneGeometry(w, w * 0.5).translate(-760 + i * 270 + (hz(i, 621) - 0.5) * 120, 60 + 70 * hz(i, 622) + w * 0.12, -880 + 40 * hz(i, 623)), basic({ map: cu, transparent: true, depthWrite: false })); m.renderOrder = -5; m.name = "at-port-cumulus"; into.add(mark(m)); }
}

// ---------------------------------------------------------------------------------------------------- ships: lofted hull, three masts, billowed sails, rigging, pennants
function sailTex() {
  return once("sail", () => {
    const S = 256, [c, x] = canvas(S, S), g = x.createLinearGradient(0, 0, 0, S); g.addColorStop(0, "#f4ecd6"); g.addColorStop(0.7, "#e7dcc0"); g.addColorStop(1, "#d3c4a2"); x.fillStyle = g; x.fillRect(0, 0, S, S);
    for (let i = 1; i < 9; i++) { x.strokeStyle = "rgba(110,90,60,0.35)"; x.lineWidth = 1.2; x.beginPath(); x.moveTo(i * S / 9, 0); x.lineTo(i * S / 9, S); x.stroke(); x.strokeStyle = "rgba(255,255,255,0.35)"; x.beginPath(); x.moveTo(i * S / 9 + 2, 0); x.lineTo(i * S / 9 + 2, S); x.stroke(); }
    for (const y of [S * 0.3, S * 0.62]) { x.strokeStyle = "rgba(120,95,60,0.5)"; x.lineWidth = 2; x.beginPath(); x.moveTo(0, y); x.lineTo(S, y); x.stroke(); for (let i = 0; i < 18; i++) { x.fillStyle = "rgba(100,80,50,0.6)"; x.fillRect(i * S / 18 + 4, y + 2, 2, 8); } }
    for (let i = 0; i < 14; i++) { const gx = hz(i, 640) * S, gy = hz(i, 641) * S, gr = x.createRadialGradient(gx, gy, 0, gx, gy, 30 + 30 * hz(i, 642)); gr.addColorStop(0, hz(i, 643) > 0.5 ? "rgba(120,95,60,0.16)" : "rgba(255,255,255,0.2)"); gr.addColorStop(1, "rgba(0,0,0,0)"); x.fillStyle = gr; x.fillRect(0, 0, S, S); }
    x.strokeStyle = "rgba(90,70,45,0.7)"; x.lineWidth = 3; x.strokeRect(1.5, 1.5, S - 3, S - 3);
    return tex(c, { aniso: 4 });
  });
}
function hullGeo(L, B, yk, hbulw, bandsOn) {
  const N = 16, pos = [], cl = [], idx = [];
  const half = (t, y, yd) => { const w0 = Math.min(1, Math.pow(Math.max(0.0, 1 - Math.pow((t - 0.42) / 0.62, 2)), 0.6)) * (t > 0.86 ? sstep(1.0, 0.86, t) * 0.8 + 0.2 : 1); const u = clamp((y - (yk(t))) / (yd(t) - yk(t))); return B / 2 * Math.max(0.03, w0) * (0.4 + 0.6 * Math.pow(Math.sin(Math.min(1, u * 1.5) * Math.PI / 2), 0.8)) * (1 - 0.13 * u * u); };
  const yd = (t) => (bandsOn ? 3.4 + 2.6 * (1 - t) ** 3 + 0.9 * t ** 3 : 0.8 + 0.5 * Math.abs(2 * t - 1) ** 2);
  const band = (t) => { const d = yd(t), ys = bandsOn ? [yk(t), 0, 1.8, 2.25, 3.2, 3.7, d, d + hbulw] : [yk(t), d, d + hbulw], cs = bandsOn ? ["#4a3524", "#241c16", "#d0a22e", "#241c16", "#d0a22e", "#2a211a", "#2a211a"] : ["#6a4e30", "#7a5a38", "#4a3a2a"]; return { ys: ys.filter((y, i) => i === 0 || y > ys[i - 1] + 0.05), cs }; };
  const col3 = (hex) => { const c = col(hex); return [c.r, c.g, c.b]; };
  const quadAdd = (a, b, c2, d, cc) => { const base = pos.length / 3; pos.push(...a, ...b, ...c2, ...d); for (let i = 0; i < 4; i++) cl.push(...cc); idx.push(base, base + 1, base + 2, base, base + 2, base + 3); };
  for (let i = 0; i < N; i++) {
    const t0 = i / N, t1 = (i + 1) / N, x0 = (t0 - 0.5) * L, x1 = (t1 - 0.5) * L, b0 = band(t0), b1 = band(t1), nb = Math.min(b0.ys.length, b1.ys.length) - 1;
    for (let j = 0; j < nb; j++) for (const sd of [1, -1]) {
      const c = col3(mix(b0.cs[j], "#000000", 0.08 * hz(i + j, 650)));
      const A = [x0, b0.ys[j], sd * half(t0, b0.ys[j], yd)], Bq = [x0, b0.ys[j + 1], sd * half(t0, b0.ys[j + 1], yd)], C = [x1, b1.ys[j + 1], sd * half(t1, b1.ys[j + 1], yd)], Dd = [x1, b1.ys[j], sd * half(t1, b1.ys[j], yd)];
      if (sd > 0) quadAdd(A, Dd, C, Bq, c); else quadAdd(A, Bq, C, Dd, c);
    }
    // the deck between the rails
    const dA = [x0, yd(t0), -half(t0, yd(t0), yd) * 0.97], dB = [x0, yd(t0), half(t0, yd(t0), yd) * 0.97], dC = [x1, yd(t1), half(t1, yd(t1), yd) * 0.97], dD = [x1, yd(t1), -half(t1, yd(t1), yd) * 0.97];
    quadAdd(dA, dB, dC, dD, col3(bandsOn ? "#8a6a44" : "#3a2a1c"));
  }
  // the transom: closing the stern, with the stern windows added by the caller
  { const b0 = band(0), x0 = -L / 2; for (let j = 0; j < b0.ys.length - 1; j++) { const y0 = b0.ys[j], y1 = b0.ys[j + 1], h0 = half(0, y0, yd), h1 = half(0, y1, yd); quadAdd([x0, y0, -h0], [x0, y1, -h1], [x0, y1, h1], [x0, y0, h0], col3(b0.cs[j])); } }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(cl, 3)); g.setIndex(idx); g.computeVertexNormals(); return { g, yd, half };
}
function ship(L, k) {
  const root = new THREE.Group(), roll = new THREE.Group(); root.add(roll);
  const B = L * 0.27, yk = (t) => -2.4 + 1.5 * Math.pow(Math.abs(2 * t - 1), 2.2), { g, yd, half } = hullGeo(L, B, yk, 0.9, true);
  roll.add(new THREE.Mesh(g, VCOL2()));
  const D = new Batch();
  const X = (t) => (t - 0.5) * L;
  // castles, stern gallery and windows, rails, cannons, hatches, capstan
  D.box(X(0.1), yd(0.1) + 1.0, 0, L * 0.2, 2.0, B * 0.6, "#3a2a1c", { j: 0.05 }); D.box(X(0.1), yd(0.1) + 2.05, 0, L * 0.21, 0.12, B * 0.64, "#d0a22e", { j: 0.04, grad: 0 });
  D.box(X(0.93), yd(0.93) + 0.6, 0, L * 0.12, 1.2, B * 0.3, "#3a2a1c", { j: 0.05 });
  D.box(-L / 2 - 0.35, yd(0) + 0.5, 0, 0.6, 3.4, B * 0.72, "#2a211a", { j: 0.05 });   // the stern gallery
  for (let r = 0; r < 2; r++) for (let i = -2; i <= 2; i++) D.box(-L / 2 - 0.68, yd(0) - 0.55 + r * 1.05 + 0.4, i * B * 0.13, 0.05, 0.62, 0.5, "#f0d27a", { j: 0.05, grad: 0 });
  D.box(-L / 2 - 0.7, yd(0) + 2.05, 0, 0.1, 0.28, B * 0.74, "#d0a22e", { grad: 0 });
  for (let i = 0; i < 9; i++) for (const sd of [1, -1]) { const t = 0.25 + i * 0.065; D.box(X(t), 2.75, sd * (half(t, 2.75, yd) + 0.02), 0.9, 0.62, 0.08, "#0d0b0a", { grad: 0, j: 0 }); }
  for (const sd of [1, -1]) D.box(0, yd(0.5) + 1.05, sd * (B / 2 * 0.9), L * 0.6, 0.08, 0.1, "#d0a22e", { grad: 0 });
  D.box(X(0.55), yd(0.55) + 0.1, 0, 2.4, 0.2, 1.8, "#4a3622", { j: 0.1 }); D.cyl(X(0.4), yd(0.4), 0, 0.35, 0.8, "#5a4630"); D.box(X(0.62), yd(0.62) + 0.5, 1.2, 0.9, 0.6, 0.9, "#6a4e30", { j: 0.1 });
  // the bowsprit and its stays
  D.add(new THREE.CylinderGeometry(0.17, 0.3, 11, 8).translate(0, 5.5, 0), { p: [X(0.97), yd(1) + 0.2, 0], r: [0, 0, -Math.PI / 2 + 0.28], c: "#6a4e30", j: 0.08, grad: 0 });
  // masts: lower mast, topmast, three yards each, tops
  const masts = [[0.3, 25, 14], [0.58, 31, 16], [0.8, 21, 11]], sailsG = [], lines = [], pen = [];
  masts.forEach(([t, H, yl], mi) => {
    const mx = X(t), y0 = yd(t) - 0.3;
    D.add(new THREE.CylinderGeometry(0.28, 0.42, H * 0.62, 8).translate(0, H * 0.31, 0), { p: [mx, y0, 0], c: "#6a4e30", j: 0.06, grad: 0 });
    D.add(new THREE.CylinderGeometry(0.16, 0.26, H * 0.5, 8).translate(0, H * 0.25, 0), { p: [mx, y0 + H * 0.55, 0], c: "#7a5c3a", j: 0.06, grad: 0 });
    D.box(mx, y0 + H * 0.58, 0, 2.4, 0.2, 2.4, "#4a3622", { j: 0.05, grad: 0 });   // the top
    for (let r = 0; r < 3; r++) {
      const fy = y0 + H * [0.3, 0.58, 0.82][r], yl2 = yl * [1, 0.82, 0.55][r], sh = [7.4, 6.2, 4.4][r] * (H / 28);
      D.add(new THREE.CylinderGeometry(0.1, 0.12, yl2 + 0.6, 6).rotateX(Math.PI / 2), { p: [mx, fy, 0], c: "#6a4e30", j: 0.06, grad: 0 });
      const sg = new THREE.PlaneGeometry(yl2, sh, 6, 5), p = sg.attributes.position;
      for (let v = 0; v < p.count; v++) { const u = p.getX(v) / yl2 + 0.5, w = 0.5 - p.getY(v) / sh, bil = Math.max(0, Math.sin(Math.PI * clamp(u))) ** 0.8 * (0.35 + 0.65 * Math.max(0, Math.sin(Math.PI * clamp(w * 1.1)))), z0 = p.getX(v); p.setXYZ(v, 0.55 + bil * 1.3 + 0.0, p.getY(v) - sh / 2, z0); }
      sg.computeVertexNormals(); sg.translate(mx, fy, 0); sailsG.push(sg);
      // furled corners and the sheets
      lines.push([mx + 0.5, fy - sh, -yl2 / 2, mx + 0.1, fy - sh - 1.2, -yl2 / 2 - 0.2], [mx + 0.5, fy - sh, yl2 / 2, mx + 0.1, fy - sh - 1.2, yl2 / 2 + 0.2]);
    }
    // shrouds and ratlines
    const hw = (B / 2) * 0.95;
    for (const sd of [1, -1]) for (let s = 0; s < 4; s++) { const dx = (s - 1.5) * 0.7; lines.push([mx + dx * 0.2, y0 + H * 0.6, sd * 0.8, mx + dx, yd(t) + 1, sd * hw]); }
    for (const sd of [1, -1]) for (let r = 0; r < 12; r++) { const f = 0.12 + r * 0.07, yy = lerp(yd(t) + 1, y0 + H * 0.6, f); lines.push([mx - 1.05 * (1 - f) - 0.2 * f, yy, sd * lerp(hw, 0.8, f), mx + 1.05 * (1 - f) + 0.2 * f, yy, sd * lerp(hw, 0.8, f)]); }
    if (mi < 2) lines.push([mx, y0 + H * 0.82, 0, masts[mi + 1][0] * L - L / 2, y0 + H * 0.5, 0]);
    lines.push([mx, y0 + H * 0.78, 0, X(0.96), yd(1) + 0.6, 0]);
    pen.push({ x: mx, y: y0 + H * 0.95, ph: mi * 1.7, len: 3.4 + 0.8 * hz(mi + k, 660) });
    D.cyl(mx, y0 + H * 0.9, 0, 0.05, H * 0.12, "#c9a24a", { grad: 0 });
  });
  // jibs: triangles from the bowsprit to the fore mast
  const jib = (a, b, c2) => { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute([...a, ...b, ...c2], 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 1, 0, 0.5, 1], 2)); g.setIndex([0, 1, 2]); g.computeVertexNormals(); return g; };
  const bw = X(1.0) + 3.5, my = yd(0.3) + 14;
  sailsG.push(jib([bw, yd(1) + 3.2, 0.08], [X(0.3) + 0.5, yd(0.3) + 3, 0.1], [X(0.3) + 0.4, my, 0.1]), jib([bw + 1.5, yd(1) + 3.6, 0.1], [X(0.3) + 0.5, yd(0.3) + 11, 0.1], [X(0.3) + 0.4, my + 5, 0.1]));
  const sm = new THREE.Mesh(mergeGeometries(sailsG.map((q) => q.index ? q.toNonIndexed() : q)), once("mat-sail", () => lit({ map: sailTex(), side: THREE.DoubleSide, roughness: 1 }))); sm.name = "at-port-sails"; roll.add(sm);
  const dm = D.mesh(VCOL(), "at-port-shipdetail"); roll.add(dm);
  const lg = new THREE.BufferGeometry(); lg.setAttribute("position", new THREE.Float32BufferAttribute(lines.flat(), 3)); const lm = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: "#3a2c1e" })); lm.name = "at-port-rigging"; roll.add(lm);
  // pennants: strips that wave
  const pn = pen.length * 2, pp = new Float32Array(pn * 6 * 3 / 2 * 2), pg = new THREE.BufferGeometry(), NS = 6, pa = new Float32Array(pen.length * (NS + 1) * 2 * 3), pi = [];
  pen.forEach((q, j) => { for (let s = 0; s < NS; s++) { const a = (j * (NS + 1) + s) * 2; pi.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } });
  pg.setAttribute("position", new THREE.BufferAttribute(pa, 3).setUsage(THREE.DynamicDrawUsage)); pg.setIndex(pi); pg.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 20, 0), 60);
  const pm = new THREE.Mesh(pg, basic({ color: "#c8301f", side: THREE.DoubleSide })); pm.name = "at-port-pennants"; roll.add(pm);
  const upd = (t) => { pen.forEach((q, j) => { for (let s = 0; s <= NS; s++) { const f = s / NS, a = (j * (NS + 1) + s) * 2, wv = Math.sin(t * 5.2 - f * 5.5 + q.ph) * 0.35 * f, wid = 0.55 * (1 - f * 0.92); pa[a * 3] = q.x - q.len * f; pa[a * 3 + 1] = q.y + wid / 2 + wv * 0.4; pa[a * 3 + 2] = wv; pa[a * 3 + 3] = q.x - q.len * f; pa[a * 3 + 4] = q.y - wid / 2 + wv * 0.4; pa[a * 3 + 5] = wv; } }); pg.attributes.position.needsUpdate = true; };
  upd(0);
  mark(root); return { root, roll, upd };
}
function rowBoat() {
  const L = 4.6, root = new THREE.Group(), { g } = hullGeo(L, 1.6, (t) => -0.35 + 0.28 * Math.abs(2 * t - 1) ** 2, 0.0, false);
  root.add(new THREE.Mesh(g, VCOL2()));
  const B = new Batch(); for (const x of [-0.6, 0.5]) B.box(x, 0.58, 0, 0.3, 0.06, 1.2, "#8a6a44", { j: 0.08 });
  for (const sd of [1, -1]) { B.add(new THREE.CylinderGeometry(0.03, 0.04, 2.6, 6).rotateX(Math.PI / 2).translate(0, 0, sd * 1.5), { p: [0.0, 0.85, 0], r: [0, 0, sd * 0.2], c: "#a98757", grad: 0 }); B.box(0, 0.8, sd * 2.7, 0.5, 0.03, 0.2, "#8a6a44"); }
  const m = B.mesh(VCOL(), "at-port-boat-detail"); root.add(m); mark(root); return root;
}

// ---------------------------------------------------------------------------------------------------- the second pier, far townspeople, debris
function pier(into) {
  const g = new THREE.Group(); g.position.set(10.25, 1.2, -15); into.add(g);
  const geos = [deckGeo(-2.25, 2.25, 0, -16, 0), deckGeo(-8.2, -2.2, -0.2, -2.8, 0, 0.26)], B = new Batch(), wl = -1.2;
  const dm = new THREE.Mesh(mergeGeometries(geos), once("deckMat", () => lit({ map: deckTex(), roughness: 0.95, color: "#c4b8ac" }))); dm.name = "at-port-pier-deck"; g.add(mark(dm, { solid: true }));
  for (const sx of [-1, 1]) for (let z = -1.2; z > -16; z -= 3.5) {
    pileSet(B, sx * 2.1, z, 1.35 + 0.25 * hz(z, 230), (z * 5) | 0, true, wl); if (hz(z, 231) > 0.35) ropeWrap(B, sx * 2.1, z, 0.2, 0.5 + 0.2 * hz(z, 232), 3, (z * 7) | 0);
    B.box(sx * 2.1, 0.55, z - 1.75, 0.09, 0.09, 3.5, "#6a5a42", { j: 0.1 }); B.box(sx * 2.1, 1.0, z - 1.75, 0.09, 0.09, 3.5, "#6a5a42", { j: 0.1 });
  }
  for (let z = -0.6; z > -16; z -= 2.4) B.box(0, -0.28, z, 4.6, 0.2, 0.22, "#4a3a2a", { j: 0.1 });
  for (const x of [-6.4, -4.4]) pileSet(B, x, -2.8, 0.5, (x * 7) | 0, false, wl);
  barrel(B, -1.2, 0, -13.4, 3); barrel(B, -0.7, 0, -14.3, 5); crate(B, 1.3, 0, -14.5, 0.8, 0.7, 0.8, 1, 0.3); B.cyl(0, 0, -15.6, 0.22, 0.5, "#4f3f2c"); B.add(TORUS, { p: [0, 0.22, -15.6], s: [0.23, 0.23, 0.23], c: ROPE, grad: 0 });
  const m = B.mesh(VCOL(), "at-port-pier-detail"); g.add(mark(m)); return g;
}
function potatoes(into, list) {
  const B = new Batch(), COAT = ["#8a2f2a", "#2f3f66", "#6a4a2e", "#8a2f2a", "#2f3f66", "#7a5a38"];
  list.forEach((q, i) => {
    const M = new THREE.Matrix4().compose(new THREE.Vector3(q.x, q.y, q.z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, q.yaw, 0)), new THREE.Vector3(1, 1, 1)), coat = COAT[i % COAT.length], h = 0.85 + 0.1 * hz(i, 700);
    B.under(M, () => {
      B.blob(0, 0.5 * h, 0, 0.3 * h, "#dcb66e", { sy: 1.3, j: 0.08 });                                       // the potato
      B.add(new THREE.CylinderGeometry(0.31 * h, 0.36 * h, 0.5 * h, 10).translate(0, 0.25 * h, 0), { p: [0, 0.16 * h, 0], c: coat, j: 0.06 });   // the coat
      B.box(0, 0.35 * h, 0, 0.7 * h, 0.05 * h, 0.7 * h, "#2a1d14", { grad: 0, j: 0 });                          // the belt
      B.add(new THREE.CylinderGeometry(0.4 * h, 0.4 * h, 0.06, 3), { p: [0, 0.84 * h, 0], r: [0, hz(i, 701) * 3, 0], c: "#1f1a1a", grad: 0 });    // tricorn brim
      B.cyl(0, 0.84 * h, 0, 0.2 * h, 0.14 * h, "#2a2222", { grad: 0 });
      for (const sd of [-1, 1]) { B.blob(0.24 * h, 0.58 * h, sd * 0.1 * h, 0.035 * h, "#15110e", { grad: 0, j: 0 }); B.blob(0, 0.04 * h, sd * 0.15 * h, 0.08 * h, "#2a1d14", { sy: 0.6, grad: 0, j: 0 }); B.blob(0.02 * h, 0.3 * h, sd * 0.33 * h, 0.07 * h, "#dcb66e", { sy: 1.2, j: 0 }); }
    });
  });
  const m = B.mesh(VCOL(), "at-port-people"); if (m) into.add(mark(m)); return m;
}

// soft cast shade of a house on the deck: darkest under the porch and balcony, fading out in about 7 m (sun behind the camera, left)
function shade(parent, x, z, w, yaw) {
  const t = once("shadeTex", () => { const [c, cx] = canvas(256, 4), g = cx.createLinearGradient(0, 0, 256, 0); g.addColorStop(0, "rgba(10,12,30,0.62)"); g.addColorStop(0.2, "rgba(10,12,30,0.5)"); g.addColorStop(0.55, "rgba(10,12,30,0.2)"); g.addColorStop(1, "rgba(10,12,30,0)"); cx.fillStyle = g; cx.fillRect(0, 0, 256, 4); return tex(c); });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(7.5, w + 0.4).rotateX(-Math.PI / 2).translate(3.75, 0, 0), once("mat-shade", () => basic({ map: t, transparent: true, depthWrite: false, side: THREE.DoubleSide })));
  m.position.set(x, 1.24, z); m.rotation.y = yaw; m.renderOrder = 2; m.name = "at-port-shade"; parent.add(mark(m, { steam: true })); return m;
}
// ---------------------------------------------------------------------------------------------------- the place
const ROW1 = [
  { w: 7.5, H: 10.5, style: "timber", roofKind: "shingle", ridge: "x", balcony: true, flower: "magenta", washing: true, seed: 3, gap: 0.7 },
  { w: 7, H: 9.5, style: "grey", roofKind: "tile", ridge: "z", awning: STRIPES[1], seed: 7, gap: 3.0, broken: 1 },
  { w: 6, H: 8.5, style: "brick", roofKind: "slate", ridge: "x", balcony: true, flower: "yellow", seed: 11, gap: 0.7 },
  { w: 7.5, H: 10, style: "timber", roofKind: "tile", ridge: "z", awning: STRIPES[0], seed: 5, gap: 0.7, broken: 1 },
  { w: 6.5, H: 9, style: "lime", roofKind: "tile", ridge: "x", balcony: true, flower: "magenta", seed: 13, gap: 2.6, broken: 1 },
  { w: 7, H: 9.5, style: "blue", roofKind: "shingle", ridge: "z", balcony: true, washing: true, flower: "magenta", seed: 2, gap: 3.3 },
  { w: 7, H: 10.5, style: "brick", roofKind: "tile", ridge: "z", awning: STRIPES[3], seed: 17, gap: 0.8 },
  { w: 8, H: 11, style: "timber", roofKind: "slate", ridge: "x", balcony: true, flower: "yellow", washing: true, seed: 19, gap: 2.4 },
  { w: 6.5, H: 8, style: "lime", roofKind: "tile", ridge: "z", awning: STRIPES[4], seed: 23, gap: 1 },
];
const ROW2W = [7, 8, 6.5, 7.5, 8, 6.5, 7, 8, 6.5];

function portroyal(P) {
  const S = P.spec, G = P.whole, sd0 = S.seed ?? 1;
  const shakeG = new THREE.Group(); G.add(shakeG);
  const statG = new THREE.Group(); shakeG.add(statG);
  const slabPiv = new THREE.Group(), slab = new THREE.Group(); slabPiv.position.set(-18, 1.2, 0); slab.position.set(18, -1.2, 0); slabPiv.add(slab); shakeG.add(slabPiv);
  const homes = [];   // every house on the slab: { hp, o, i, ... }
  // ---- the far world: sky cards, land, trees, the tower
  skyCards(statG); terrain(statG); trees(statG, 300);
  const tz = -200, tx = 10; church(statG, tx, tz);
  // ---- the wharves
  wharfSection(statG, 12, -12, { key: 1 });
  const porchGeo = deckGeo(-8, -6, 14, -12, 1.2); const pm0 = new THREE.Mesh(porchGeo, once("deckMat", () => lit({ map: deckTex(), roughness: 0.95, color: "#c4b8ac" }))); pm0.name = "at-port-porch"; slab.add(mark(pm0, { solid: true }));
  slabLand(slab); wharfSection(slab, -12, -40, { porch: true, key: 5 });
  for (let z = -40, i = 0; z > -160; z -= 10, i++) { const gz = new THREE.Group(); gz.position.set(frontX(z - 5) - FRONT_X, 0, z - 5); gz.rotation.y = -frontAng(z - 5); statG.add(gz); wharfSection(gz, 5.3, -5.3, { porch: true, key: 20 + i, big: i % 2 === 0 }); gz.traverse((m) => { if (m.userData) m.userData.solid = false; }); }
  // ---- the foreground goods on the near deck (they never go): 3 barrels, 2 crates, a coil of rope, as plate 34
  { const B = new THREE.Group(), b = new Batch();
    barrel(b, -3.3, 1.2, 4.4, 1); barrel(b, -3.9, 1.2, 5.6, 2); barrel(b, -2.7, 1.2, 6.2, 3);
    crate(b, -3.0, 1.2, 3.3, 0.8, 0.7, 0.8, 0, 0.2); crate(b, -4.4, 1.2, 7.0, 0.9, 0.8, 0.8, 1, -0.15); crate(b, -4.3, 2.0, 7.0, 0.6, 0.5, 0.6, 2, 0.4);
    b.add(TORUS, { p: [1.3, 1.24, -6.5], s: [0.5, 0.5, 0.5], c: ROPE, j: 0.1, grad: 0 }); b.add(TORUS, { p: [1.3, 1.31, -6.5], s: [0.4, 0.4, 0.4], c: "#a98d56", j: 0.1, grad: 0 }); b.add(TORUS, { p: [1.3, 1.38, -6.5], s: [0.3, 0.3, 0.3], c: ROPE, j: 0.1, grad: 0 });
    const m = b.mesh(VCOL(), "at-port-goods"); statG.add(mark(m)); void B; }
  // ---- the broken edge of the near deck and the porch (hidden below the deck until the slab drops): splintered planks hanging and a rubble slope
  { const b = new Batch();
    for (let i = 0; i < 22; i++) { const x = -5.9 + 7.8 * (i + hz(i, 790)) / 22, L = 0.4 + 1.3 * hz(i, 791); b.add(UNIT.box, { p: [x, 1.0 - 0.15 * hz(i, 792), -12.02 - L / 2 * 0.95], r: [0.5 * hz(i, 793) + 0.1, (hz(i, 794) - 0.5) * 0.2, 0], s: [0.16 + 0.1 * hz(i, 795), 0.09, L], c: ["#9a7d58", "#8a6f4c", "#a58a62"][i % 3], j: 0.1 }); }
    for (let i = 0; i < 18; i++) { const z = 12 - 24 * (i + hz(i, 796)) / 18, L = 0.8 + 2.2 * hz(i, 797); b.add(UNIT.box, { p: [-6.4 - L * 0.4, 0.55 - L * 0.28, z], r: [0, 0, -0.55 - 0.5 * hz(i, 798)], s: [L, 0.09, 0.2 + 0.2 * hz(i, 799)], c: ["#9a7d58", "#7d6446", "#a58a62"][i % 3], j: 0.1 }); }
    for (let i = 0; i < 40; i++) b.rock(-6.7 - 2.2 * hz(i, 801), 0.3 - 1.0 * hz(i, 802), 12 - 24 * hz(i, 803), 0.18 + 0.4 * hz(i, 804), ["#a89878", "#8a7a62", "#b86a4a", "#c9b88f"][i % 4], { sy: 0.7, j: 0.12 });
    const m = b.mesh(VCOL(), "at-port-rubble"); statG.add(mark(m)); }
  // ---- the houses: row 1 (z from +11), the gaps between them, palms in the wide gaps
  let cur = 11, hi = 0; const gapsAt = [];
  const addHouse = (parent, o, x0, y0, z0, i, hostSlab, yaw = 0) => {
    const h = house({ ...o, D: o.D ?? 8 }), hp = new THREE.Group(); hp.position.set(x0 - h.D / 2, y0, z0); h.g.position.x = h.D / 2; hp.add(h.g); hp.rotation.y = yaw; parent.add(hp);
    if (hostSlab) homes.push({ hp, h, i, base: [x0 - h.D / 2, y0, z0], lean: (10 + 22 * hz(i + sd0, 710)) * DEG, drop: 1.2 + 3.0 * hz(i + sd0, 711), start: 0.4 * hz(i + sd0, 712), roll: (hz(i + sd0, 713) - 0.5) * 9 * DEG, twist: (hz(i + sd0, 714) - 0.5) * 7 * DEG, ph: hz(i, 715) * 6 });
    return h;
  };
  const statics = [];
  ROW1.forEach((o, i) => {
    if (i === 6) cur = -44;
    const zc = cur - o.w / 2; cur -= o.w + o.gap; if (o.gap > 2) gapsAt.push({ z: cur + o.gap / 2, i });
    const hostSlab = i < 6; const h = addHouse(hostSlab ? slab : statG, o, hostSlab ? FRONT_X : frontX(zc), 1.2, zc, i, hostSlab, hostSlab ? 0 : -frontAng(zc)); shade(hostSlab ? slab : statG, hostSlab ? FRONT_X : frontX(zc), zc, o.w, hostSlab ? 0 : -frontAng(zc)); statics.push({ h, zc, o, i });
  });
  // palms: in the wide gaps (the first two on the slab), the yard, the hill, the bay
  const palms = [];
  palms.push({ g: palm(slab, -9.2, 1.2, gapsAt[0].z, 11.5, 0.16, -1.3, 1), slab: true }); palms.push({ g: palm(slab, -9.2, 1.2, gapsAt[1].z, 10.5, 0.26, -0.3, 2), slab: true });
  palms.push({ g: palm(slab, -24, 1.2, -22, 9.5, 0.22, 0.6, 3), slab: true });
  palms.push({ g: palm(statG, frontX(gapsAt[3].z) - 1.2, 1.2, gapsAt[3].z, 11, 0.28, 0.1, 4) });
  palm(statG, -46, terrainH(-46, -30), -30, 11, 0.2, 0.3, 5); palm(statG, -50, terrainH(-50, -75), -75, 12, 0.25, -0.2, 6); palm(statG, frontX(-96) - 3, 1.2, -96, 10.5, 0.3, 0.2, 7); palm(statG, -42, terrainH(-42, 6), 6, 10, 0.2, 0.4, 8);
  // row 2 (lighter 3D), 6 on the slab and the rest on the plateau; row 3 on the rising ground
  { const R2 = [{ style: "brick", roofKind: "tile" }, { style: "timber", roofKind: "slate" }, { style: "lime", roofKind: "tile" }, { style: "grey", roofKind: "shingle" }, { style: "brick", roofKind: "slate" }, { style: "timber", roofKind: "tile" }];
    let z = 10; ROW2W.forEach((w, i) => { const zc = z - w / 2; z -= w + 1.4; const hostSlab = z > -40, st = R2[i % 6]; addHouse(hostSlab ? slab : statG, { w, H: 8 + 2.5 * hz(i, 720), D: 8, ...st, ridge: i % 2 ? "x" : "z", seed: 30 + i, lite: true, flower: i % 4 === 1 ? "magenta" : null, balcony: i % 3 === 0, awning: i % 3 === 1 ? STRIPES[i % 5] : null, chimney: true }, hostSlab ? -18 : frontX(zc) - 10, 1.2, zc, 20 + i, hostSlab, hostSlab ? 0 : -frontAng(zc)); });
    z = 14; for (let i = 0; i < 9; i++) { const w = 6.5 + 2 * hz(i, 721), zc = z - w / 2; z -= w + 2 + 3 * hz(i, 722); const y = terrainH(-37, zc) - 0.1; if (z < -80) break; addHouse(statG, { w, H: 7.5 + 2.5 * hz(i, 723), D: 8, style: ["lime", "timber", "brick", "grey"][i % 4], roofKind: ["tile", "slate", "tile", "shingle"][i % 4], ridge: i % 2 ? "z" : "x", seed: 40 + i, lite: true, chimney: i % 2 === 0 }, -34, y, zc, 40 + i, false); } }
  // ---- the town behind and round the bay: merged blocks on the terraces
  { const list = [];
    for (const [r, u0] of [[0, 1.5], [1, 15], [2, 29], [3, 45], [4, 63], [5, 84]]) {
      for (let z = -64 - 8 * hz(r, 730); z > -330; z -= 8.5 + 9 * hz(z + r, 731)) { if (Math.abs(z - tz) < 16 && u0 > 20 && u0 < 40) continue; const w = 6 + 3.5 * hz(z, 732 + r), D = 7 + 2 * hz(z, 733 + r), x = frontX(z) - u0, y = terrainH(x - D / 2, z) - 0.25; list.push({ x, y, z, w, D, h: (6 + 4.5 * hz(z, 734 + r)) * (1 + 0.15 * r), yaw: -frontAng(z) + (hz(z, 735) - 0.5) * 0.08 }); }
    }
    for (const [r, u0] of [[3, 46], [4, 64], [5, 86], [6, 112]]) for (let z = 20 - 8 * hz(r, 736); z > -66; z -= 8.5 + 9 * hz(z + r, 737)) { const w = 6 + 3.5 * hz(z, 738 + r), D = 7 + 2 * hz(z, 739 + r), x = frontX(z) - u0, y = terrainH(x - D / 2, z) - 0.25; list.push({ x, y, z, w, D, h: (6 + 4.5 * hz(z, 740 + r)) * (1 + 0.12 * r), yaw: (hz(z, 741) - 0.5) * 0.12 }); }
    townBlocks(statG, list, 100); S._town = list; }
  // ---- the mid pier, ships, the rowing boat
  const pierG = pier(statG);
  const shipTex = new THREE.Texture(); (globalThis.__loads ||= []).push(new THREE.ImageLoader().loadAsync("/" + ASSET + "port-ship.png").then((img) => { shipTex.image = img; shipTex.colorSpace = THREE.SRGBColorSpace; shipTex.needsUpdate = true; }).catch(() => {}));
  const shipCard = (wd, x, z, flip) => { const g = new THREE.Group(), m = new THREE.Mesh(new THREE.PlaneGeometry(wd * (flip ? -1 : 1), wd * 405 / 291).translate(0, wd * 405 / 291 / 2 - 1.4, 0), basic({ map: shipTex, alphaTest: 0.5, side: THREE.DoubleSide })); g.add(m); g.position.set(x, 0, z); g.name = "at-port-ship"; statG.add(mark(g)); return g; };
  const shipA = shipCard(34, 82, -128, false), shipB = shipCard(27, 56, -158, true);
  const boat = rowBoat(); boat.position.set(7.0, 0.1, -24); boat.rotation.y = 0.35; statG.add(boat);
  // ---- the far townspeople: 6 on the slab, 8 on the far wharf
  { const slabL = [], statL = [];
    [[-14, -3.8], [-19, 0.4], [-23.5, -4.5], [-28, -1.2], [-33, -4.2], [-37, 0.6]].forEach(([z, x], i) => slabL.push({ x, y: 1.2, z, yaw: hz(i, 750) * TAU }));
    [-45, -50, -55, -61, -68, -76, -85, -95].forEach((z, i) => statL.push({ x: frontX(z) + 5 + (hz(i, 751) - 0.5) * 6, y: 1.2, z, yaw: hz(i, 752) * TAU }));
    if (S.people !== false) { potatoes(slab, slabL); potatoes(statG, statL); } }
  // ---- chimney smoke (3), dust and spray, foam, debris
  const puff = (a) => { const m = new THREE.SpriteMaterial({ map: puffTex(), transparent: true, depthWrite: false, opacity: 0, color: a, toneMapped: false }); noLine(m); const sp = new THREE.Sprite(m); sp.userData.lookOnly = true; sp.userData.solid = false; sp.userData.steam = true; sp.frustumCulled = false; sp.renderOrder = 9; return sp; };
  const smokes = [], smokeSrc = [];
  for (const j of [6, 8]) { const st = statics[j], ct = st.h.chimTop; if (ct) smokeSrc.push([FRONT_X + ct[0], 1.2 + ct[1], st.zc + ct[2]]); }
  { const L = S._town[30]; if (L) smokeSrc.push([L.x - L.D * 0.6, L.y + L.h + 2.2, L.z]); }
  smokeSrc.slice(0, 3).forEach((src, si) => { for (let i = 0; i < 9; i++) { const sp = puff("#f2f2f0"); statG.add(sp); smokes.push({ sp, src, i, si }); } });
  const dust = []; for (let i = 0; i < 14; i++) { const sp = puff("#d9c49a"); shakeG.add(sp); dust.push({ sp, i }); }
  // foam
  const foams = [], foamMat = (op = 0) => { const t = foamTex().clone(); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.needsUpdate = true; return basic({ map: t, transparent: false, alphaTest: 0.5, side: THREE.DoubleSide }); };
  const foam = (w, d, x, z, name, rep = 1) => { const m = foamMat(), me = new THREE.Mesh(new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2), m); m.map.repeat.set(w / 3 * rep, d / 3 * rep); me.position.set(x, 0.3, z); me.name = name; shakeG.add(mark(me, { steam: true })); me.visible = false; const f = { me, m, w, d, x, z, rep }; foams.push(f); return f; };
  const fSea = foam(15, 48, 8, -28, "at-port-foam-sea"), fRift = foam(14, 11, -0.5, -12.5, "at-port-foam-rift"), fLeft = foam(9, 30, -9.5, 1, "at-port-foam-left"), fBack = foam(8, 66, -32, -11, "at-port-foam-back"), fSlab = foam(40, 56, -14, -13, "at-port-foam-slab", 1.4), fSlab2 = foam(40, 56, -14, -13, "at-port-foam-slab2", 2.1);
  const fSt = gapsAt.slice(0, 3).map((g) => foam(26, 4.5, -18, g.z, "at-port-foam-street")), fStreets = [];
  for (const h of homes) { const f = foam(h.h.w + 6, h.h.D + 6, 0, 0, "at-port-foam-house"); fStreets.push({ f, h }); }
  const fShip = [foam(40, 10, 82, -128, "at-port-foam-ship"), foam(32, 9, 56, -158, "at-port-foam-ship")];
  // spray
  const NSP = 380, sPos = new Float32Array(NSP * 3), sg = new THREE.BufferGeometry(); sg.setAttribute("position", new THREE.BufferAttribute(sPos, 3).setUsage(THREE.DynamicDrawUsage)); sg.boundingSphere = new THREE.Sphere(new THREE.Vector3(-6, 3, -20), 80);
  const spm = new THREE.PointsMaterial({ map: puffTex(), size: 0.36, sizeAttenuation: true, transparent: true, opacity: 0.7, depthWrite: false, color: "#ffffff", toneMapped: false }); noLine(spm);
  const spray = new THREE.Points(sg, spm); spray.name = "at-port-spray"; spray.renderOrder = 9; shakeG.add(mark(spray, { steam: true })); spray.visible = false;
  // debris: planks, a few barrels, riding the churn
  const deb = [], plankMat = lit({ vertexColors: false, color: "#8a7658", roughness: 1 }), bb = new Batch(); barrel(bb, 0, -0.3, 0, 2, 1);
  const barrelGeo = mergeGeometries(bb.g);
  for (let i = 0; i < 34; i++) { const me = new THREE.Mesh(i < 3 ? barrelGeo : UNIT.box, i < 3 ? once("mat-brl", () => lit({ vertexColors: true })) : plankMat); const L = 1.5 + 3.5 * hz(i, 760); if (i >= 3) me.scale.set(L, 0.11, 0.2 + 0.1 * hz(i, 761)); me.visible = false; me.name = "at-port-debris"; shakeG.add(mark(me)); deb.push({ me, a: hz(i, 762), b: hz(i, 763), c: hz(i, 764), i }); }
  const askew = [], pileMat = lit({ color: "#4a3a2a", roughness: 1 });
  for (let i = 0; i < 22; i++) { const L = 4 + 3 * hz(i, 810), me = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, L, 8), pileMat); me.visible = false; me.name = "at-port-askew"; shakeG.add(mark(me)); askew.push({ me, L, i, x: i % 2 ? lerp(1.2, 4.2, hz(i, 811)) : lerp(-7, -4, hz(i, 811)), z: lerp(-10, -42, (i + hz(i, 812)) / 22), lean: (hz(i, 813) - 0.5) * 1.2, tw: (hz(i, 814) - 0.5) * 0.7 }); }
  mark(shakeG);
  // ---------------------------------------------------------------------------------------------------- the clock
  const v3 = new THREE.Vector3(), housePos = [];
  const wind = (t, k) => Math.sin(t * 1.1 + k) * 0.5 + 0.5;
  return {
    grip: 0, top: 1.2,
    apply(ps, t) {
      const sink = clamp(num(ps, S, "sink", 0)), shake = clamp(num(ps, S, "shake", 0));
      // the quake: small deterministic jitter of the whole place, and a heavier lurch while it goes
      const amp = shake * 0.06 + 0.05 * Math.sin(Math.PI * clamp(sink)) * (sink > 0 && sink < 1 ? 1 : 0);
      shakeG.position.set(amp * (Math.sin(t * 47.3) + 0.6 * Math.sin(t * 29.1 + 1)), amp * 0.8 * (Math.sin(t * 53.7 + 2) + 0.5 * Math.sin(t * 33.3)), amp * 0.5 * Math.sin(t * 41.9 + 4));
      shakeG.rotation.set(amp * 0.012 * Math.sin(t * 37.1 + 1), 0, amp * 0.02 * Math.sin(t * 44.9));
      // the slab: rolls 14 deg seaward about x -14 and drops 6 m
      const ks = sstep(0.0, 0.9, sink);
      slabPiv.position.set(-18, 1.2 - 6.2 * ks, 0); slabPiv.rotation.set(0, 0, -14 * DEG * ks);
      // each house: its own moment, lean (8-25 deg), drop, roll, twist; roofs that open
      for (const o of homes) {
        const k = sstep(o.start, o.start + 0.6, sink), e = k * k * (3 - 2 * k);
        o.hp.position.set(o.base[0], o.base[1] - o.drop * e, o.base[2]);
        o.hp.rotation.set(o.roll * e + 0.012 * Math.sin(t * 9 + o.ph) * shake, o.twist * e, -o.lean * e + 0.01 * Math.sin(t * 11 + o.ph) * (shake + k * (1 - k) * 2));
        for (const r of o.h.roofs) if (r.brk) r.rg.rotation[r.axis] = (r.axis === "x" ? r.sd : -r.sd) * 58 * DEG * (0.15 + 0.85 * k) * k;
        o.k = k;
      }
      const kp = sstep(0.05, 0.95, sink);
      pierG.rotation.set(-14 * DEG * kp, 0, 3 * DEG * kp * Math.sin(t * 2)); pierG.position.y = 1.2 - 0.6 * kp;
      // ships roll
      const rolA = 8 * DEG * sstep(0.05, 0.5, sink) * (1 - 0.3 * sstep(0.8, 1, sink));
      shipA.rotation.z = rolA * Math.sin(t * 1.9) + 0.015 * Math.sin(t * 0.8); shipB.rotation.z = rolA * Math.sin(t * 1.7 + 1.2) + 0.012 * Math.sin(t * 0.7); boat.rotation.z = 0.05 * Math.sin(t * 1.3) + rolA * 0.8 * Math.sin(t * 2.4);
      shipA.position.y = 0.12 * Math.sin(t * 0.9); shipB.position.y = 0.1 * Math.sin(t * 0.8 + 1);
      // washing
      for (const o of homes) if (o.h.cloth) o.h.cloth.update(t); for (const st of statics) if (st.h.cloth) st.h.cloth.update(t);
      // the white water: it runs up the streets, foams round the slab's edge, ships and every house that goes
      G.updateMatrixWorld(true);
      const en = sstep(0.03, 0.4, sink), sc = (f, a) => { f.m.alphaTest = lerp(0.97, 0.42, clamp(a)); f.me.visible = a > 0.02; if (f.me.visible) { f.m.map.offset.set(0.13 * t * f.rep, 0.31 * t * f.rep); } };
      sc(fSea, en * (0.8 + 0.2 * Math.sin(t * 3))); fSea.me.position.set(fSea.x - 1.5 * ks, 0.34 + 0.05 * Math.sin(t * 2), fSea.z);
      sc(fRift, sstep(0.02, 0.3, sink)); sc(fLeft, en); sc(fBack, sstep(0.1, 0.6, sink) * 0.9); sc(fSlab, sstep(0.12, 0.5, sink)); fSlab.me.position.set(fSlab.x - 8 * ks + 2, 0.4 + 0.06 * Math.sin(t * 2.3), fSlab.z); sc(fSlab2, sstep(0.3, 0.8, sink) * 0.9); fSlab2.me.position.set(fSlab2.x - 8 * ks, 0.62 + 0.08 * Math.sin(t * 2.9 + 1), fSlab2.z + 3 * Math.sin(t * 0.7));
      fSt.forEach((f, j) => { const a = sstep(0.12 + 0.1 * j, 0.7, sink); sc(f, a); f.me.scale.x = Math.max(0.05, a); f.me.position.set(-8 - 13 * f.me.scale.x, 0.3 + 0.9 * (1 - a) * 0, f.z); });
      for (const { f, h } of fStreets) { h.hp.getWorldPosition(v3); G.worldToLocal(v3); const sub = clamp(h.k ?? 0); f.me.position.set(v3.x + h.h.D / 2 - 1.5, 0.3 + 0.04 * Math.sin(t * 3 + h.ph), v3.z); sc(f, sstep(0.03, 0.3, sub) * 0.95 * (1 - 0.0 * sub)); f.me.scale.set(1 + 0.2 * Math.sin(t * 2 + h.ph), 1, 1); }
      fShip.forEach((f) => sc(f, en * 0.55));
      // spray
      const so = sstep(0.05, 0.35, sink) * (1 - 0.25 * sstep(0.9, 1, sink));
      spray.visible = so > 0.01; if (spray.visible) {
        spm.opacity = 0.9 * so;
        for (let i = 0; i < NSP; i++) {
          const ph = (t * (0.7 + 0.5 * hz(i, 770)) + hz(i, 771) * 3) % 1, ax = lerp(-30, 3.5, hz(i, 772) ** 1.3), az = lerp(10, -44, hz(i, 773));
          const hgt = 0.3 + (2.5 + 5.5 * hz(i, 774)) * 4 * ph * (1 - ph) * so, dx = 1.8 * ph * (hz(i, 775) - 0.3), dz = 1.2 * ph * (hz(i, 776) - 0.5);
          sPos[i * 3] = ax + dx - 1.0 * ks; sPos[i * 3 + 1] = hgt; sPos[i * 3 + 2] = az + dz;
        }
        sg.attributes.position.needsUpdate = true;
      }
      // dust over the houses as they let go
      dust.forEach((d, i) => { const o = homes[i % homes.length]; if (!o) { d.sp.visible = false; return; } o.hp.getWorldPosition(v3); G.worldToLocal(v3); const k = o.k ?? 0, ph = (t * 0.6 + hz(i, 780)) % 1, a = Math.sin(Math.PI * clamp(k)) * (1 - ph); d.sp.visible = a > 0.02; d.sp.material.opacity = 0.5 * a; d.sp.position.set(v3.x + (hz(i, 781) - 0.3) * 5, 1.5 + 5 * ph + o.h.H * 0.25, v3.z + (hz(i, 782) - 0.5) * 4); d.sp.scale.setScalar(3 + 5 * ph); });
      // debris
      const dv = sstep(0.08, 0.5, sink);
      for (const d of deb) { d.me.visible = dv > 0.02; if (!d.me.visible) continue; const sw = t * (0.12 + 0.1 * d.b) + d.a * 6; d.me.position.set(lerp(-30, 6, d.a) + 1.4 * Math.sin(sw) - 2 * ks, 0.55 + 0.12 * Math.sin(t * 1.6 + d.i), lerp(10, -42, d.b) + 1.0 * Math.cos(sw * 1.3)); if (d.i < 3) d.me.rotation.set(0.3 * Math.sin(t + d.i), d.c * TAU + 0.4 * Math.sin(t * 0.5 + d.i), 0.35 * Math.sin(t * 1.3 + d.a * 9)); else { d.me.rotation.set((d.b - 0.5) * 1.3 + 0.1 * Math.sin(t * 1.2 + d.i), d.c * TAU, (d.a - 0.5) * 1.5 + 0.1 * Math.sin(t * 1.5 + d.i)); d.me.scale.y = 0.11 * dv; d.me.position.y += 0.35 * dv * (d.i % 3); if (d.i > 18) { d.me.position.x = lerp(-8, 2, d.a); d.me.position.z = lerp(-12, -40, d.b); } } }
      for (const a of askew) { a.me.visible = dv > 0.05; if (!a.me.visible) continue; a.me.position.set(a.x - 2 * ks, -1.2 + a.L * 0.33 * dv, a.z); a.me.rotation.set(a.tw, 0, a.lean * (0.4 + 0.6 * dv)); a.me.scale.y = 0.4 + 0.6 * dv; }
      // smoke
      smokes.forEach((s) => { const ph = (t * 0.18 + s.i / 9 + s.si * 0.31) % 1, w = wind(t, s.si); s.sp.position.set(s.src[0] + 8 * ph * (0.6 + 0.6 * w) + 0.5 * Math.sin(ph * 6 + s.i), s.src[1] + 14 * ph, s.src[2] + 1.5 * Math.sin(ph * 5 + s.si)); s.sp.scale.setScalar(1 + 5 * ph); s.sp.material.opacity = 0.55 * Math.sin(Math.PI * ph) ** 0.8; });
    },
  };
}

export const C_PORT_KINDS = { portroyal };
export const C_PORT_GRIPS = {};
