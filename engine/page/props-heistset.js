import * as THREE from "three";
import { buildHatchback, HATCH } from "./car-hatchback.js";
import { clamp } from "./util.js";

// Fight, Flight or Freeze 01 "You just robbed a bank" (10 Nov 2026): the set pieces. Metres; origin bottom centre and
// front +z unless said; every blink, flash or tip is a function of the params below (nothing reads a wall clock).
// Params are tweened by `prop` actions. Only the params named in props3d.js propState's list tween smoothly (smash,
// open, on, blink, len, bend ...); `clock`, `lights`, `rock`, `shh`, `look` and `crook` are not in that list yet, so a
// tween of them steps to its end value (until the registry adds them to ps). They also read spec.<name> as a default.
// `clock` falls back to the clip time t, so a flashing prop with no clock param still flashes in step with the clip.
//
//   producecrate  a slatted wooden market crate: corner posts, three slats a side with gaps, weathered wood
//                 #a9794a / #8a5f38. Origin: bottom middle. SOLID.
//                 spec  w 0.9 (x), d 0.5 (z), h 0.34 (rim), fill null | "carrots" | "cabbages" | "apples" (a heaped top
//                       0.06 over the rim; the heap is solid too)
//                 param smash 0..1: the slats and posts burst outward, tumble and lie flat on the ground (at 1 their
//                       centres are within 0.6 m of the origin), the produce spills and rolls out
//                 hold  two-hand carry: HEISTSET_GRIPS.producecrate.sides = the +x short end, mid height (the box hold
//                       mirrors it to the other end); for the small crate (w 0.5, d 0.36, h 0.3) storyboards/lib/
//                       grips.mjs SIZE.producecrate has those sizes, so spec {w 0.5, d 0.36, h 0.3} with grips.box
//   spudbin       a low wide market bin of the same wood on two short runners, no lid, filled with raw potatoes.
//                 Origin: bottom middle of the bin; the rim top is at y spec.h. Rim and box SOLID; the potato heap is
//                 NOT solid (userData.solid false: a body lies in it).
//                 spec  w 1.5, d 1.0, h 0.28 (rim), dip 0.14 (the trough in the middle: edge 0.04 under the rim, the
//                       middle spec.dip lower; nothing of the heap above y 0.2 inside the middle 1.1 x 0.7),
//                       seed 1 (the potatoes' layout), tagX -0.35 (the price tag's x)
//                       six ALIVE potatoes sit near the front right (x 0.2..0.65, toward +z), two eyes each, 0.035 wide,
//                       facing +z and up 30 deg; the three at the front edge sit up so their eyes clear the rim
//                 param blink 0..1 (all six eyelids; 1 = shut), look -1..1 (pupils left/right), shh 0..1 (potato 1, the
//                       nearest to the front right corner, purses a round mouth and raises a tiny leaf-hand to it),
//                       crook deg 0 (the price tag's lean about z; negative leans its top to the right, seen from the front)
//                 price tag: a cream card 0.3 x 0.18 on a short stake at the front edge, its top 0.5 up, facing +z,
//                       "POTATOES" over a red "2.99"
//   policevan     a dark navy #1c2440 box van seen from behind: its back at the origin plane facing +z, 1.9 wide, 1.9
//                 tall (body y 0.3..2.2), 3.2 long toward -z (the last 0.8 is the cab), wheels r 0.3. White stripe along
//                 each side and across the doors, POLICE on each door, two rear doors 0.9 x 1.45 hinged on the outer
//                 edges (barred window each), a step under them, a dark inside with a bench each side. The opening is
//                 1.7 wide x 1.45 tall, floor at y 0.45, a potato fits inside. Body, doors, benches SOLID.
//                 param open 0..1 (1 = both doors 100 deg out), rock deg (the body rolls about z on its springs, the
//                       wheels stay), lights 0..1 + clock (a roof light bar near the back: blue #2f6bff on the left, red
//                       #ff3b30 on the right, alternating 2.5 times a second from clock, each with a soft additive
//                       glow r 0.5; clock 0.1 = blue, 0.3 = red)
//   policecar     the city hatchback (car-hatchback.js, as citycar) in navy #1c2440 with a white door stripe and the same
//                 roof light bar. Origin: on the ground under its middle, front +z. Nobody inside (dark cabin).
//                 param lights, clock (as the van), len (metres rolled: the wheels turn), bend (front wheels, deg)
//   sirenwash     police light on the world: a soft-edged additive patch spec.w 4 x spec.h 3 facing +z (spec.flat true:
//                 lying on the ground facing up, h along -z), alternating blue and red 2.5 times a second from clock,
//                 a radial falloff to nothing at its edges. Origin: the middle of the patch. See-through (steam).
//                 param on 0..1 (strength; 1 = 0.35 of full additive), clock
//   lightpool     a spotlight's pool: a soft-edged additive ellipse spec.w 1.2 x spec.d 0.8, spec.color #fff1c2, a
//                 slightly brighter core. spec.face "up" (default): lying on the ground, d along z, centre at the origin
//                 (y 0.008); "z": standing and facing +z, d is its height, centre at the origin. See-through (steam).
//                 param on 0..1
//   copshadow     a long cast shadow lying on the ground from the origin (the cop's feet) toward -z: the silhouette of a
//                 potato in a peaked cap holding a torch out to its right (+x, the visor to the left), spec.len 2.6 long,
//                 spec.w 1.1 at its widest, soft edges, #0c0b1a at on x 0.6 opacity, normal blended at y 0.006.
//                 See-through (steam). param on 0..1
//   roofblock     the top of a city building for a rooftop leap: dark brick #4a3550, front (+z) with two rows of small
//                 windows (some warm lit #ffcf7a), a pale stone coping 0.08 tall overhanging 0.04, a flat tar roof
//                 (walkable, SOLID, its top at exactly y = spec.h). Origin: bottom middle, the block stands on y 0.
//                 spec  w 2.8, d 2.0, h 1.0, seed 1 (which windows are lit),
//                       extras [] of "chimney" | "tank" | "antenna" | "vent": dark shapes at the back edge, spread
//                       along x in the order given
export const HEISTSET_GRIPS = {
  producecrate: { sides: [0.45, 0.17, 0] },   // the +x short end of the default 0.9 x 0.5 x 0.34 crate, mid height
};

const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const sm = (x) => { const k = clamp(x); return k * k * (3 - 2 * k); };
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.75, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
function canvasTex(w, h, draw) { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
// see-through for the checks and drawn after the solid things (glows, light patches, decals)
// NOTE (found on the bench, dusk-back-alley, 10 Nov): a see-through plane with depthWrite false is NOT drawn over the env's
// painted cards (walls, sky), only over the ground and bodies; with depthWrite true it tints the painting too. So the
// light patches and glow cards here write depth, and are drawn last (high renderOrder) so nothing behind them draws after.
const glowy = (o, order = 4) => { o.frustumCulled = false; o.renderOrder = order; o.castShadow = false; o.receiveShadow = false; o.userData.steam = true; return o; };
// the glows write their colour as given (the shaders output no colour-space conversion), so the hex stays the hex
const rawColor = (hex) => new THREE.Color().setStyle(hex, THREE.LinearSRGBColorSpace);
const rad = (d) => (d * Math.PI) / 180;
const fract = (x) => x - Math.floor(x);

const WOOD_A = "#a9794a", WOOD_B = "#8a5f38";
// a weathered plank: the base colour with grain streaks, a knot or two and darker ends
function woodMat(color, seed) {
  const map = canvasTex(256, 64, (g, w, h) => {
    g.fillStyle = color; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 28; i++) {
      const y = rnd(seed + i) * h;
      g.strokeStyle = rnd(seed + i + 50) > 0.5 ? "rgba(55,30,12,0.30)" : "rgba(255,225,170,0.16)"; g.lineWidth = 1 + rnd(seed + i + 90) * 2.2;
      g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(w * 0.3, y + rnd(seed + i + 7) * 7 - 3.5, w * 0.7, y + rnd(seed + i + 8) * 7 - 3.5, w, y + rnd(seed + i + 9) * 5 - 2.5); g.stroke();
    }
    for (let k = 0; k < 2; k++) { g.fillStyle = "rgba(50,28,10,0.38)"; g.beginPath(); g.ellipse(20 + rnd(seed + k * 3 + 200) * (w - 40), 10 + rnd(seed + k * 3 + 201) * (h - 20), 7, 3.5, 0, 0, Math.PI * 2); g.fill(); }
    const edge = g.createLinearGradient(0, 0, w, 0); edge.addColorStop(0, "rgba(40,22,8,0.35)"); edge.addColorStop(0.06, "rgba(40,22,8,0)"); edge.addColorStop(0.94, "rgba(40,22,8,0)"); edge.addColorStop(1, "rgba(40,22,8,0.35)");
    g.fillStyle = edge; g.fillRect(0, 0, w, h);
  });
  return mat("#ffffff", { map, roughness: 0.88 });
}

// a lumpy potato: a unit sphere (radius 0.5) pushed about by position, scaled per instance to (L, 0.62 L, 0.68 L)
function spudGeo(seed) {
  const g = new THREE.SphereGeometry(0.5, 14, 10), p = g.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const k = 1 + 0.09 * Math.sin(v.x * 11 + seed) * Math.sin(v.y * 9 + seed * 2) + 0.06 * Math.sin(v.z * 13 + seed * 3);
    p.setXYZ(i, v.x * k, v.y * k, v.z * k);
  }
  g.computeVertexNormals(); return g;
}

// a pieces animator: each piece has a home and, for `smash` 0..1, bursts out along dir, arcs, tumbles and lies at restY
function piece(g, home, o) { g.position.set(...home); g.rotation.order = "YXZ"; return { g, home, ...o }; }
function smashPieces(pieces, q) {
  for (const p of pieces) {
    const u = clamp((q - p.delay) / (1 - p.delay)), out = 1 - (1 - u) * (1 - u), e = sm(u);
    p.g.position.set(p.home[0] + p.dir[0] * p.dist * out, p.home[1] + (p.restY - p.home[1]) * u * u + p.arc * 4 * u * (1 - u), p.home[2] + p.dir[1] * p.dist * out);
    p.g.rotation.set((p.rot0?.[0] ?? 0) + p.spin[0] * e, (p.rot0?.[1] ?? 0) + p.spin[1] * e, (p.rot0?.[2] ?? 0) + p.spin[2] * e);
  }
}

// a soft additive patch (sirenwash, lightpool): a plane with a radial falloff, two colours and a mix
function softPatch(w, h, c1, c2, inner, core) {
  const m = new THREE.ShaderMaterial({
    uniforms: { uC1: { value: rawColor(c1) }, uC2: { value: rawColor(c2) }, uMix: { value: 0 }, uK: { value: 0 }, uIn: { value: inner }, uCore: { value: core } },
    vertexShader: "varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: `uniform vec3 uC1, uC2; uniform float uMix, uK, uIn, uCore; varying vec2 vUv;
      void main() {
        float r = length((vUv - 0.5) * 2.0);
        float f = 1.0 - smoothstep(uIn, 1.0, r);
        float c = 1.0 - smoothstep(0.0, 0.5, r);
        gl_FragColor = vec4(mix(uC1, uC2, uMix), uK * mix(f, c, uCore));
      }`,
    transparent: true, depthWrite: true, blending: THREE.AdditiveBlending, opacity: 0.45, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
  });
  m.userData.noOutline = true; m.userData.glow = true;
  const o = glowy(new THREE.Mesh(new THREE.PlaneGeometry(w, h), m), 20);
  return { o, m };
}
// police light: blue for the first half of each 0.4 s, red for the second, with a short crossfade
const FLASH_HZ = 2.5;
function flash(clk) {
  const p = fract(clk * FLASH_HZ), dc = Math.abs(fract(p + 0.25) - 0.5);   // dc: how far p is from the middle of the blue half
  const blue = 1 - sm((dc - 0.21) / 0.08);
  return { blue, red: 1 - blue, mix: 1 - blue };
}
// a soft round additive glow card that faces the camera and sits `push` m toward it
function glowCard(parent, color, R, push) {
  const m = new THREE.ShaderMaterial({
    uniforms: { uR: { value: R }, uA: { value: 0 }, uC: { value: rawColor(color) }, uPush: { value: push } },
    vertexShader: `uniform float uR, uPush; varying vec2 vUv;
      void main() { vUv = uv; vec4 c = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0); c.xy += (uv - 0.5) * 2.0 * uR; c.z += uPush; gl_Position = projectionMatrix * c; }`,
    fragmentShader: `uniform float uA; uniform vec3 uC; varying vec2 vUv;
      void main() { float r = length(vUv - 0.5) * 2.0; float a = pow(max(0.0, 1.0 - r), 1.6) * uA; gl_FragColor = vec4(uC, a); }`,
    transparent: true, depthWrite: true, blending: THREE.AdditiveBlending, opacity: 0.45,
  });
  m.userData.noOutline = true; m.userData.glow = true;
  const o = glowy(new THREE.Mesh(new THREE.PlaneGeometry(1, 1), m), 5); parent.add(o); return o;
}
// the roof light bar: a dark base with a blue lens on the left and a red one on the right, each with a glow r 0.5.
// set(clk, lights) lights them from the clock
function lightBar(parent, x, y, z, w) {
  const d = 0.26;
  mesh(new THREE.BoxGeometry(w, 0.05, d), mat("#14171f", { roughness: 0.5 }), parent, x, y + 0.025, z);
  const sides = [-1, 1].map((s, i) => {
    const hex = i ? "#ff3b30" : "#2f6bff", dim = new THREE.Color(i ? "#4a1410" : "#142453"), hot = new THREE.Color(hex), white = new THREE.Color("#ffffff");
    const lens = new THREE.MeshBasicMaterial({ color: dim.clone() });
    const lx = x + s * (w / 4 + 0.01);
    mesh(new THREE.BoxGeometry(w / 2 - 0.03, 0.15, d - 0.05), lens, parent, lx, y + 0.125, z);
    mesh(new THREE.BoxGeometry(w / 2 - 0.0, 0.025, d), mat("#14171f", { roughness: 0.5 }), parent, lx - s * 0.015, y + 0.212, z);
    const glow = glowCard(parent, hex, 0.5, 0.25); glow.position.set(lx, y + 0.13, z);
    return { lens, dim, hot, white, glow };
  });
  return {
    set(clk, lights) {
      const f = flash(clk), k = [f.blue, f.red];
      sides.forEach((s, i) => { const v = clamp(k[i] * lights); s.lens.color.copy(s.dim).lerp(s.hot, v).lerp(s.white, 0.35 * v * v); s.glow.material.uniforms.uA.value = 0.85 * v; s.glow.visible = v > 0.01; });
    },
  };
}

// ---- lettering canvases
function tagTex() {
  return canvasTex(512, 307, (g, w, h) => {
    g.fillStyle = "#f3e8c8"; g.fillRect(0, 0, w, h);
    g.strokeStyle = "#cdb88a"; g.lineWidth = 8; g.strokeRect(10, 10, w - 20, h - 20);
    // hand-lettered: each letter on its own, a hair off its line and turn
    const word = (txt, y, fs, color, jit) => {
      g.font = `900 ${fs}px "Liberation Sans", "DejaVu Sans", Arial, sans-serif`; g.textBaseline = "middle"; g.fillStyle = color; g.strokeStyle = color; g.lineWidth = fs * 0.045; g.lineJoin = "round";
      const adv = [...txt].map((c) => g.measureText(c).width + fs * 0.02), tot = adv.reduce((a, b) => a + b, 0);
      let x = (w - tot) / 2;
      [...txt].forEach((c, i) => { g.save(); g.translate(x + adv[i] / 2, y + (rnd(i * 3 + jit) - 0.5) * fs * 0.06); g.rotate((rnd(i * 5 + jit + 40) - 0.5) * 0.09); g.textAlign = "center"; g.fillText(c, 0, 0); g.strokeText(c, 0, 0); g.restore(); x += adv[i]; });
    };
    word("POTATOES", 88, 86, "#2b2118", 1);
    word("2.99", 213, 168, "#d4271c", 7);
  });
}
function policeTex() {
  return canvasTex(512, 168, (g, w, h) => {
    g.fillStyle = "#f2f2ee"; g.fillRect(0, 0, w, h);
    const txt = "POLICE";
    let fs = 150; g.font = `900 ${fs}px "Liberation Sans", "DejaVu Sans", Arial, sans-serif`;
    while (g.measureText(txt).width > w * 0.88 && fs > 40) { fs -= 4; g.font = `900 ${fs}px "Liberation Sans", "DejaVu Sans", Arial, sans-serif`; }
    g.fillStyle = "#1c2440"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(txt, w / 2, h / 2 + fs * 0.04);
  });
}

// the cop's long shadow on the ground, drawn in metres: canvas top = far end (-z), bottom = the cop's feet at the origin
function copShadowTex(len, wid, color) {
  const PX = 300;   // pixels per metre
  return canvasTex(Math.round(wid * PX), Math.round(len * PX), (g, w, h) => {
    const X = (x) => (x / wid + 0.5) * w, Y = (d) => h * (1 - d / len);   // x metres from the middle (+x right), d metres out from the feet
    g.clearRect(0, 0, w, h);
    g.filter = `blur(${Math.round(PX * 0.022)}px)`; g.fillStyle = color; g.strokeStyle = color; g.lineCap = "round"; g.lineJoin = "round";
    const body = (cx, d0, d1, hw) => { g.beginPath(); g.ellipse(X(cx), Y((d0 + d1) / 2), hw * PX, ((d1 - d0) / 2) * PX, 0, 0, Math.PI * 2); g.fill(); };
    // two short legs at the feet, the long potato body, the cap: a crown and a visor to the left (-x)
    for (const s of [-1, 1]) body(-0.06 + s * 0.09, 0.0, 0.2, 0.05);
    body(-0.06, 0.1, len * 0.80, 0.26);
    body(-0.06, len * 0.64, len * 0.93, 0.22);                       // the cap's crown
    g.beginPath(); g.moveTo(X(-0.2), Y(len * 0.905)); g.lineTo(X(-0.5), Y(len * 0.935)); g.lineTo(X(-0.5), Y(len * 0.88)); g.lineTo(X(-0.2), Y(len * 0.86)); g.closePath(); g.fill();   // the visor
    // the right arm out to the torch: a thick arm and a torch held up and out, its lamp head flared at the end
    g.lineWidth = 0.095 * PX; g.beginPath(); g.moveTo(X(0.12), Y(len * 0.52)); g.lineTo(X(0.42), Y(len * 0.58)); g.stroke();
    g.lineWidth = 0.05 * PX; g.beginPath(); g.moveTo(X(0.42), Y(len * 0.55)); g.lineTo(X(0.46), Y(len * 0.78)); g.stroke();
    g.beginPath(); g.moveTo(X(0.405), Y(len * 0.78)); g.lineTo(X(0.51), Y(len * 0.78)); g.lineTo(X(0.55), Y(len * 0.845)); g.lineTo(X(0.365), Y(len * 0.845)); g.closePath(); g.fill();
    // the left arm hangs at the side
    g.lineWidth = 0.08 * PX; g.beginPath(); g.moveTo(X(-0.28), Y(len * 0.5)); g.lineTo(X(-0.36), Y(len * 0.34)); g.stroke();
  });
}

// the front of a roof block: dark brick with two rows of small windows, some lit warm (drawn into the colour map and
// the emissive map)
function roofFront(w, h, seed) {
  const PX = 360, cw = Math.round(w * PX), ch = Math.round(h * PX), lit = [];
  for (let r = 0; r < 2; r++) for (let c = 0; c < 5; c++) lit.push(rnd(seed * 17 + r * 5 + c + 3) < 0.45);
  const win = (g, r, c, onlyLit) => {
    const cx = ((c + 0.5) / 5) * cw, cy = ch - (r ? 0.62 : 0.27) * (h / 0.91) * PX, ww = 0.26 * PX, wh = 0.3 * PX, L = lit[r * 5 + c];
    if (onlyLit && !L) return;
    g.fillStyle = L ? "#ffcf7a" : "#1b1424"; g.fillRect(cx - ww / 2, cy - wh / 2, ww, wh);
    if (!onlyLit) { g.strokeStyle = L ? "#b8822f" : "#0d0a12"; g.lineWidth = 4; g.strokeRect(cx - ww / 2, cy - wh / 2, ww, wh); g.beginPath(); g.moveTo(cx, cy - wh / 2); g.lineTo(cx, cy + wh / 2); g.moveTo(cx - ww / 2, cy); g.lineTo(cx + ww / 2, cy); g.stroke(); }
  };
  const map = canvasTex(cw, ch, (g) => {
    g.fillStyle = "#4a3550"; g.fillRect(0, 0, cw, ch);
    const bh = 0.065 * PX, bw = 0.2 * PX;
    for (let row = 0, y = 0; y < ch; row++, y += bh) for (let x = -(row % 2) * bw * 0.5, i = 0; x < cw; x += bw, i++) {
      const v = rnd(seed + row * 31 + i), sh = (v - 0.5) * 22;
      g.fillStyle = `rgb(${74 + sh},${53 + sh * 0.7},${80 + sh * 0.8})`; g.fillRect(x + 1.5, y + 1.5, bw - 3, bh - 3);
    }
    for (let r = 0; r < 2; r++) for (let c = 0; c < 5; c++) win(g, r, c, false);
  });
  const emissive = canvasTex(cw, ch, (g) => { g.fillStyle = "#000000"; g.fillRect(0, 0, cw, ch); for (let r = 0; r < 2; r++) for (let c = 0; c < 5; c++) win(g, r, c, true); });
  return { map, emissive };
}
function brickSide(seed) {
  return canvasTex(256, 128, (g, w, h) => {
    g.fillStyle = "#4a3550"; g.fillRect(0, 0, w, h);
    const bh = 10, bw = 30;
    for (let row = 0, y = 0; y < h; row++, y += bh) for (let x = -(row % 2) * bw * 0.5, i = 0; x < w; x += bw, i++) { const sh = (rnd(seed + row * 17 + i + 400) - 0.5) * 22; g.fillStyle = `rgb(${74 + sh},${53 + sh * 0.7},${80 + sh * 0.8})`; g.fillRect(x + 1, y + 1, bw - 2, bh - 2); }
  });
}

export const HEISTSET_KINDS = {
  // ------------------------------------------------------------------------------------------------- producecrate
  producecrate(P) {
    const S = P.spec, W = S.w ?? 0.9, D = S.d ?? 0.5, H = S.h ?? 0.34, fill = S.fill ?? null;
    const woods = [woodMat(WOOD_A, 3), woodMat(WOOD_B, 11)], post = 0.045, T = 0.016, FLOOR = 0.03;
    const sl = (H - FLOOR) * 0.26, gap = ((H - FLOOR) - 3 * sl) / 2;
    const pieces = [], posts = [];
    // the base boards stay put
    mesh(new THREE.BoxGeometry(W - 0.01, FLOOR, D - 0.01), woods[1], P.whole, 0, FLOOR / 2, 0);
    // slats: front and back run between the corner posts; the ends run between the long sides
    let n = 0;
    for (const [axis, sgn] of [["z", 1], ["z", -1], ["x", 1], ["x", -1]]) for (let k = 0; k < 3; k++) {
      const y = FLOOR + sl / 2 + k * (sl + gap), long = axis === "z", len = long ? W - 2 * post : D - 2 * post;
      const g = new THREE.Group(); mesh(new THREE.BoxGeometry(long ? len : T, sl, long ? T : len), woods[(k + n) % 2], g);
      const home = long ? [0, y, sgn * (D / 2 - T / 2)] : [sgn * (W / 2 - T / 2), y, 0], r = (i) => rnd(n * 13 + i + 5);
      const a = Math.atan2(long ? 0 : sgn, long ? sgn : 0) + (r(1) - 0.5) * 1.0, flat = (r(2) > 0.5 ? 1 : -1) * Math.PI / 2;
      pieces.push(piece(g, home, { dir: [Math.sin(a), Math.cos(a)], dist: 0.14 + 0.2 * r(3) + (long ? 0.1 : 0), arc: 0.12 + 0.2 * r(4), restY: T / 2 + 0.002, spin: long ? [flat, (r(5) - 0.5) * 1.6, 0] : [0, (r(5) - 0.5) * 1.6, flat], delay: 0.12 * k + 0.05 * r(6) }));
      P.whole.add(g); n++;
    }
    // corner posts: they topple outward and lie down
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const g = new THREE.Group(); mesh(new THREE.BoxGeometry(post, H, post), woods[1], g);
      const a = Math.atan2(sx * 0.8, sz) + (rnd(n * 7) - 0.5) * 0.6;
      posts.push(piece(g, [sx * (W / 2 - post / 2), H / 2, sz * (D / 2 - post / 2)], { dir: [Math.sin(a), Math.cos(a)], dist: 0.1 + 0.12 * rnd(n * 9 + 1), arc: 0.08 + 0.12 * rnd(n * 9 + 2), restY: post / 2 + 0.002, spin: rnd(n) > 0.5 ? [Math.PI / 2, (rnd(n * 3) - 0.5) * 2, 0] : [0, (rnd(n * 3) - 0.5) * 2, Math.PI / 2], delay: 0.08 + 0.1 * rnd(n * 11) }));
      P.whole.add(g); n++;
    }
    pieces.push(...posts);
    // the produce: a filler under the heap (it sinks as the crate bursts) and the items on top
    let base = null; const items = [];
    if (fill) {
      const flat = (c) => mat(c, { roughness: 0.85 });
      const bg = new THREE.BoxGeometry(W - 0.07, H - 0.07 - FLOOR, D - 0.07); bg.translate(0, (H - 0.07 - FLOOR) / 2, 0);
      base = mesh(bg, flat(fill === "carrots" ? "#b4651a" : fill === "cabbages" ? "#4f7f2a" : "#8f1d17"), P.whole, 0, FLOOR, 0);
      const add = (g, home, restY, i, rot0 = [0, 0, 0], round = false) => {
        const a = Math.atan2(home[0], home[2] + 1e-4) + (rnd(i + 70) - 0.5) * 1.6;
        // round things (apples, cabbages) tumble any way; carrots only turn on the spot (they lie along the ground)
        items.push(piece(g, home, { dir: [Math.sin(a), Math.cos(a)], dist: 0.12 + 0.42 * rnd(i + 71), arc: 0.05 + 0.18 * rnd(i + 72), restY, rot0, spin: round ? [(rnd(i + 73) - 0.5) * 6, (rnd(i + 74) - 0.5) * 6, (rnd(i + 75) - 0.5) * 6] : [-rot0[0], (rnd(i + 74) - 0.5) * 6, -rot0[2]], delay: 0.1 + 0.25 * rnd(i + 76) }));
        g.rotation.set(...rot0); P.whole.add(g);
      };
      if (fill === "carrots") {
        const orange = mat("#e9801a", { roughness: 0.7 }), leaf = mat("#4f9a3a", { roughness: 0.8 }), cg = new THREE.ConeGeometry(0.032, 0.3, 10); cg.rotateZ(Math.PI / 2);   // thick end at -x, point at +x
        for (let i = 0; i < 16; i++) {
          const g = new THREE.Group(), top = i >= 9;
          mesh(cg, orange, g).scale.set(1, 1, 1);
          for (let l = 0; l < 3; l++) { const lf = mesh(new THREE.ConeGeometry(0.012, 0.09, 6), leaf, g, -0.17, 0.005 * (l - 1), 0.012 * (l - 1)); lf.rotation.z = Math.PI / 2 + 0.25 * (l - 1); lf.rotation.x = 0.2 * (l - 1); }
          const col = top ? i - 9 : i, x = (top ? -0.26 + (col % 4) * 0.17 : -0.3 + (col % 5) * 0.15) + (rnd(i + 1) - 0.5) * 0.06, z = top ? -0.12 + Math.floor(col / 4) * 0.12 + (rnd(i + 2) - 0.5) * 0.05 : -0.16 + Math.floor(col / 5) * 0.16 + (rnd(i + 3) - 0.5) * 0.05;
          add(g, [x, H + (top ? 0.028 : 0.0), z], 0.032, i, [rnd(i + 4) * 0.4 - 0.2, (rnd(i + 5) - 0.5) * (top ? 1.9 : 0.5), (rnd(i + 6) - 0.5) * 0.12]);
        }
      } else if (fill === "cabbages") {
        const green = mat("#74ad3e", { roughness: 0.8 }), rib = mat("#a3d466", { roughness: 0.8 }), sg = new THREE.SphereGeometry(0.125, 18, 12);
        for (let i = 0; i < 6; i++) {
          const g = new THREE.Group(), b = mesh(sg, green, g); b.scale.set(1, 0.9, 1);
          for (let l = 0; l < 3; l++) { const t = mesh(new THREE.TorusGeometry(0.12, 0.007, 6, 24, Math.PI * 1.3), rib, g); t.rotation.set(0.5 + l * 0.9, l * 1.8 + i, 0); t.scale.set(1, 0.9, 1); }
          add(g, [-0.28 + (i % 3) * 0.28, H + 0.06 - 0.125 * 0.9, i < 3 ? -0.115 : 0.115], 0.113, i, [0, rnd(i) * 6, 0], true);
        }
      } else {
        const sg = new THREE.SphereGeometry(0.052, 14, 10), reds = ["#c8281e", "#d63a22", "#b81f1d"].map((c) => mat(c, { roughness: 0.4 })), stem = mat("#5b3a1c", { roughness: 0.8 });
        for (let i = 0; i < 21; i++) {
          const row = Math.floor(i / 7), col = i % 7, g = new THREE.Group(), a = mesh(sg, reds[i % 3], g); a.scale.set(1, 0.94, 1);
          mesh(new THREE.CylinderGeometry(0.004, 0.005, 0.02, 5), stem, g, 0, 0.049, 0);
          const mid = 1 - Math.abs(row - 1) * 0.5;
          add(g, [-0.345 + col * 0.115 + (row % 2) * 0.03 + (rnd(i) - 0.5) * 0.015, H + 0.008 - 0.03 * (1 - mid) - 0.004 * Math.abs(col - 3) * 0.3, -0.125 + row * 0.125], 0.049, i, [(rnd(i + 8) - 0.5) * 0.5, rnd(i + 9) * 6, (rnd(i + 10) - 0.5) * 0.5], true);
        }
      }
    }
    smashPieces(pieces, 0);
    return {
      grip: H * 0.55,
      apply(ps) {
        const q = clamp(ps.smash ?? 0);
        smashPieces(pieces, q); smashPieces(items, q);
        if (base) { base.scale.y = Math.max(0.0001, 1 - sm(q * 1.5)); base.visible = base.scale.y > 0.03; }
      },
    };
  },

  // ------------------------------------------------------------------------------------------------------- spudbin
  spudbin(P) {
    const S = P.spec, W = S.w ?? 1.5, D = S.d ?? 1.0, H = S.h ?? 0.28, DIP = S.dip ?? 0.14, seed = S.seed ?? 1, TAGX = S.tagX ?? -0.35;
    const woods = [woodMat(WOOD_A, 21), woodMat(WOOD_B, 29)], RUN = 0.05, TH = 0.03;
    // two short runners under the bin, the floor, four walls of two planks each, corner posts and a rim
    for (const sx of [-1, 1]) mesh(new THREE.BoxGeometry(0.09, RUN, D * 0.72), woods[1], P.whole, sx * (W / 2 - 0.22), RUN / 2, 0);
    mesh(new THREE.BoxGeometry(W - 0.02, 0.025, D - 0.02), woods[1], P.whole, 0, RUN + 0.0125, 0);
    const wallH = H - RUN - 0.02, pl = (wallH - 0.008) / 2;
    for (let k = 0; k < 2; k++) {
      const y = RUN + k * (pl + 0.008) + pl / 2;
      for (const sz of [-1, 1]) mesh(new THREE.BoxGeometry(W - 0.1, pl, TH), woods[k], P.whole, 0, y, sz * (D / 2 - TH / 2));
      for (const sx of [-1, 1]) mesh(new THREE.BoxGeometry(TH, pl, D - 0.1), woods[1 - k], P.whole, sx * (W / 2 - TH / 2), y, 0);
    }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) mesh(new THREE.BoxGeometry(0.055, H - RUN, 0.055), woods[1], P.whole, sx * (W / 2 - 0.0275), RUN + (H - RUN) / 2, sz * (D / 2 - 0.0275));
    for (const sz of [-1, 1]) mesh(new THREE.BoxGeometry(W, 0.02, 0.07), woods[0], P.whole, 0, H - 0.01, sz * (D / 2 - 0.035));
    for (const sx of [-1, 1]) mesh(new THREE.BoxGeometry(0.07, 0.02, D - 0.14), woods[0], P.whole, sx * (W / 2 - 0.035), H - 0.01, 0);
    // ---- the heap
    const heap = new THREE.Group(); P.whole.add(heap);
    const ix = W / 2 - TH, iz = D / 2 - TH, EDGE = H - 0.04;
    const surf = (x, z) => {
      const u = Math.max(0, Math.abs(x) - 0.5) / (ix - 0.5), v = Math.max(0, Math.abs(z) - 0.3) / (iz - 0.3);
      return EDGE - DIP * (1 - sm(Math.hypot(u, v)));
    };
    // the mass under the potatoes: a displaced sheet 0.05 under the surface so the gaps never show the floor
    const sg = new THREE.PlaneGeometry(2 * ix, 2 * iz, 36, 24); sg.rotateX(-Math.PI / 2);
    const sp = sg.attributes.position, cols = [];
    for (let i = 0; i < sp.count; i++) {
      const x = sp.getX(i), z = sp.getZ(i), v = rnd(seed * 5 + i);
      sp.setY(i, surf(x, z) - 0.05 + 0.014 * Math.sin(x * 23 + seed) * Math.sin(z * 19));
      const c = new THREE.Color("#6e5029").lerp(new THREE.Color("#5a4122"), v); cols.push(c.r, c.g, c.b);
    }
    sg.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3)); sg.computeVertexNormals();
    mesh(sg, mat("#ffffff", { vertexColors: true, roughness: 0.9 }), heap);
    const geos = [1, 2, 3, 4, 5].map((s) => spudGeo(s + seed * 7)), mats = Array.from({ length: 6 }, (_, i) => mat(new THREE.Color("#c9a060").lerp(new THREE.Color("#b58a4a"), i / 5), { roughness: 0.86 }));
    // the six living ones: x, z, length, yaw, then either how far they sit up out of the heap (m) or, as {peek}, the height
    // of the body's middle: the three at the front edge sit up so their eyes clear the rim (a camera at 0.9 m, 4.5 m away,
    // sees nothing lower than 0.26 just behind a rim at 0.28). The three inside the middle 1.1 x 0.7 stay in the trough.
    const ALIVE = [[0.62, 0.4, 0.13, -8, { peek: 0.272 }], [0.43, 0.405, 0.125, 10, { peek: 0.268 }], [0.27, 0.4, 0.13, -5, { peek: 0.268 }], [0.6, 0.22, 0.12, 12, 0.03], [0.4, 0.25, 0.12, -10, 0], [0.24, 0.22, 0.12, 6, 0]];
    // the plain ones on a jittered 10 x 6 grid, the cells under the living ones left out: 54 + 6 = 60
    const cells = [];
    for (let r = 0; r < 6; r++) for (let c = 0; c < 10; c++) {
      const x = -ix + 0.04 + (c + 0.5 + (rnd(seed * 3 + r * 10 + c) - 0.5) * 0.7) * ((2 * ix - 0.08) / 10), z = -iz + 0.04 + (r + 0.5 + (rnd(seed * 3 + r * 10 + c + 60) - 0.5) * 0.7) * ((2 * iz - 0.08) / 6);
      cells.push({ x, z, d: Math.min(...ALIVE.map((a) => Math.hypot(a[0] - x, a[1] - z))) });
    }
    cells.sort((a, b) => b.d - a.d); cells.length = 54;
    cells.forEach((c, i) => {
      const L = 0.09 + 0.05 * rnd(seed + i * 3 + 1), g = geos[i % 5], m = mats[Math.floor(rnd(seed + i * 5 + 2) * 6)];
      const o = mesh(g, m, heap, c.x, 0, c.z); o.scale.set(L, 0.62 * L, 0.68 * L);
      o.position.y = surf(c.x, c.z) - 0.31 * L + 0.008 * rnd(i + 9);
      o.rotation.set((rnd(i + 11) - 0.5) * 0.7, rnd(i + 12) * Math.PI * 2, (rnd(i + 13) - 0.5) * 0.7);
    });
    // living potatoes: a body, two eyes (white, pupil, eyelid) facing +z and up 30 deg; potato 1 can shush
    const FACE = new THREE.Vector3(0, Math.sin(rad(30)), Math.cos(rad(30))), ZAX = new THREE.Vector3(0, 0, 1), YAX = new THREE.Vector3(0, 1, 0);
    const EYE_R = 0.0175, lids = [], pupils = [];
    const skin = (rx, ry, rz, d) => 1 / Math.sqrt((d.x / rx) ** 2 + (d.y / ry) ** 2 + (d.z / rz) ** 2);
    let shush = null;
    ALIVE.forEach(([x, z, L, yaw, up], i) => {
      const nat = surf(x, z) - 0.31 * L, grp = new THREE.Group(); grp.position.set(x, up.peek ? Math.max(nat, up.peek) : nat + up, z); grp.rotation.y = rad(yaw); heap.add(grp);
      const bodyM = mat(new THREE.Color("#c9a060").lerp(new THREE.Color("#b58a4a"), 0.25 + 0.1 * i), { roughness: 0.82 });
      const b = mesh(geos[i % 5], bodyM, grp); b.scale.set(L, 0.62 * L, 0.68 * L);
      const rx = L / 2, ry = 0.31 * L, rz = 0.34 * L;
      for (const sx of [-1, 1]) {
        const d = new THREE.Vector3(sx * 0.5, 0.5, 0.866).normalize(), p = d.clone().multiplyScalar(skin(rx, ry, rz, d) * 0.97);
        const eye = new THREE.Group(); eye.position.copy(p); eye.quaternion.setFromUnitVectors(ZAX, FACE); grp.add(eye);
        const white = mesh(new THREE.SphereGeometry(EYE_R, 16, 12), new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.35 }), eye); white.scale.z = 0.55;
        const pup = mesh(new THREE.SphereGeometry(0.0085, 12, 8), new THREE.MeshStandardMaterial({ color: "#17121c", roughness: 0.3 }), eye, 0, 0, 0.0075); pup.scale.z = 0.35; pupils.push(pup);
        mesh(new THREE.SphereGeometry(0.0026, 8, 6), new THREE.MeshBasicMaterial({ color: "#ffffff" }), pup, 0.0032, 0.0034, 0.004);
        const lid = mesh(new THREE.SphereGeometry(0.0188, 16, 12), bodyM, eye); lid.scale.set(1, 0.0001, 0.62); lid.position.y = EYE_R; lids.push(lid);
      }
      if (i === 0) {
        // the shush: a small round mouth low on the face, and a tiny leaf-hand that rises from the right side to it
        const dm = new THREE.Vector3(0, Math.sin(rad(6)), Math.cos(rad(6))), pm = dm.clone().multiplyScalar(skin(rx, ry, rz, dm) * 0.99);
        const mouth = new THREE.Group(); mouth.position.copy(pm); mouth.quaternion.setFromUnitVectors(ZAX, new THREE.Vector3(0, Math.sin(rad(14)), Math.cos(rad(14)))); grp.add(mouth);
        mesh(new THREE.CircleGeometry(0.0085, 16), new THREE.MeshBasicMaterial({ color: "#3a1818" }), mouth, 0, 0, 0.001);
        mesh(new THREE.TorusGeometry(0.0095, 0.0032, 8, 18), new THREE.MeshStandardMaterial({ color: "#b86a5a", roughness: 0.6 }), mouth, 0, 0, 0.002);
        const base = new THREE.Vector3(rx * 0.97, -0.006, 0.012), tgt = new THREE.Vector3(0.011, pm.y + 0.001, pm.z + 0.014), len = base.distanceTo(tgt);
        const hand = new THREE.Group(); hand.position.copy(base); grp.add(hand);
        const armL = Math.max(0.02, len - 0.022);
        mesh(new THREE.CylinderGeometry(0.0045, 0.0055, armL, 8), new THREE.MeshStandardMaterial({ color: "#6aa84a", roughness: 0.7 }), hand, 0, armL / 2, 0);
        const leaf = mesh(new THREE.SphereGeometry(0.011, 10, 8), new THREE.MeshStandardMaterial({ color: "#5aa03a", roughness: 0.6 }), hand, 0, armL + 0.01, 0); leaf.scale.set(0.55, 1.1, 0.25);
        shush = { mouth, hand, q0: new THREE.Quaternion().setFromUnitVectors(YAX, new THREE.Vector3(0.7, -0.7, 0.1).normalize()), q1: new THREE.Quaternion().setFromUnitVectors(YAX, tgt.clone().sub(base).normalize()) };
      }
    });
    heap.traverse((o) => { o.userData.solid = false; });   // a body lies in it: nothing of the heap is touched by the checks
    // ---- the price tag on a stake at the front edge: a cream card 0.3 x 0.18, its top 0.5 up, facing +z
    mesh(new THREE.BoxGeometry(0.024, 0.4, 0.024), woods[1], P.whole, TAGX, 0.2, D / 2 + 0.032);
    const card = new THREE.Group(); card.position.set(TAGX, 0.41, D / 2 + 0.047); P.whole.add(card);
    mesh(new THREE.BoxGeometry(0.3, 0.18, 0.008), mat("#ffffff", { map: tagTex(), roughness: 0.85 }), card);
    return {
      grip: 0.1,
      apply(ps) {
        const bl = clamp(ps.blink ?? 0), lk = clamp(ps.look ?? S.look ?? 0, -1, 1), sh = clamp(ps.shh ?? S.shh ?? 0);
        for (const lid of lids) { lid.scale.y = Math.max(0.0001, bl); lid.position.y = EYE_R * (1 - bl); lid.visible = bl > 0.01; }
        for (const p of pupils) p.position.x = lk * 0.0072;
        shush.mouth.scale.setScalar(Math.max(0.0001, sm(sh * 2))); shush.mouth.visible = sh > 0.01;
        shush.hand.quaternion.slerpQuaternions(shush.q0, shush.q1, sm(sh)); shush.hand.scale.setScalar(Math.max(0.0001, sm(sh * 3))); shush.hand.visible = sh > 0.01;
        card.rotation.z = rad(ps.crook ?? S.crook ?? 0);
      },
    };
  },

  // ----------------------------------------------------------------------------------------------------- policevan
  policevan(P) {
    const S = P.spec, NAVY = "#1c2440", paint = mat(NAVY, { roughness: 0.5 }), white = mat("#f2f2ee", { roughness: 0.5 }), inner = mat("#0d101b", { roughness: 0.9 });
    const dark = mat("#15161c", { roughness: 0.8 }), steel = mat("#6b707c", { roughness: 0.4, metalness: 0.4 }), bench = mat("#272c3a", { roughness: 0.8 });
    const body = new THREE.Group(); body.position.set(0, 0.3, 0); P.whole.add(body);       // the body rolls about z through the axle line
    const B = (w, h, d, m, x, y, z) => mesh(new THREE.BoxGeometry(w, h, d), m, body, x, y - 0.3, z);
    const SHELL = 2.4, X = 0.95;
    // the rear shell, hollow: floor, two walls (dark inside, navy outside), roof, bulkhead; the frame round the opening
    B(1.9, 0.15, SHELL, inner, 0, 0.375, -SHELL / 2);
    for (const s of [-1, 1]) { B(0.025, 1.9, SHELL, inner, s * (X - 0.0375), 1.25, -SHELL / 2); B(0.025, 1.9, SHELL, paint, s * (X - 0.0125), 1.25, -SHELL / 2); }
    B(1.9, 0.025, SHELL, inner, 0, 2.1625, -SHELL / 2); B(1.9, 0.025, SHELL, paint, 0, 2.1875, -SHELL / 2);
    B(1.9, 1.75, 0.05, inner, 0, 1.325, -SHELL + 0.025);
    B(1.9, 0.3, 0.1, paint, 0, 2.05, -0.05);                                  // the header over the opening
    for (const s of [-1, 1]) B(0.1, 1.45, 0.1, paint, s * 0.9, 1.175, -0.05);  // the pillars
    B(1.9, 0.15, 0.1, paint, 0, 0.375, -0.05);                                 // the sill
    B(1.9, 0.14, 0.12, dark, 0, 0.25, 0.06);                                   // the bumper
    B(1.2, 0.04, 0.3, steel, 0, 0.32, 0.15);                                   // the step under the doors
    // benches along both walls
    for (const s of [-1, 1]) { B(0.3, 0.38, 2.1, bench, s * 0.75, 0.64, -1.35); B(0.3, 0.05, 2.1, mat("#3a4052", { roughness: 0.7 }), s * 0.75, 0.865, -1.35); B(0.04, 0.3, 2.1, bench, s * 0.88, 1.02, -1.35); }
    // the cab: a solid wedge (the hood and a raked windscreen) from the shell to the nose
    const prof = new THREE.Shape(); [[2.4, 0.3], [3.2, 0.3], [3.2, 1.15], [2.95, 1.3], [2.4, 2.2]].forEach(([a, b], i) => (i ? prof.lineTo(a, b) : prof.moveTo(a, b))); prof.closePath();
    const wg = new THREE.ExtrudeGeometry(prof, { depth: 1.9, bevelEnabled: false }); wg.rotateY(Math.PI / 2); wg.translate(-0.95, -0.3, 0);
    mesh(wg, paint, body);
    const slope = Math.atan2(-0.521, -0.853), ws = mesh(new THREE.PlaneGeometry(1.7, 1.055), mat("#0e1424", { roughness: 0.15, metalness: 0.3 }), body, 0, 1.75 - 0.3, -2.675); ws.rotation.x = slope; ws.translateZ(0.004); ws.castShadow = false;
    for (const s of [-1, 1]) { const hl = mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.05, 16), new THREE.MeshBasicMaterial({ color: "#fff3c4" }), body, s * 0.62, 0.78 - 0.3, -3.2); hl.rotation.x = Math.PI / 2; }
    // the white stripe along each side
    for (const s of [-1, 1]) B(0.012, 0.22, 3.05, white, s * (X + 0.006), 1.03, -1.6);
    // ---- the rear doors: hinged on the outer edges, a white stripe with POLICE across both, a barred window each
    const stripeM = new THREE.MeshStandardMaterial({ map: policeTex(), roughness: 0.55 }), doors = [];
    for (const s of [-1, 1]) {       // s: -1 the left door (hinge at x -0.93), +1 the right
      const hinge = new THREE.Group(); hinge.position.set(s * 0.91, 0.45 - 0.3, 0); body.add(hinge);
      const sh = new THREE.Shape(), d = -s;   // the door extends from the hinge toward the middle
      sh.moveTo(0, 0); sh.lineTo(d * 0.9, 0); sh.lineTo(d * 0.9, 1.45); sh.lineTo(0, 1.45); sh.closePath();
      const hole = new THREE.Path(); hole.moveTo(d * 0.2, 0.88); hole.lineTo(d * 0.7, 0.88); hole.lineTo(d * 0.7, 1.28); hole.lineTo(d * 0.2, 1.28); hole.closePath(); sh.holes.push(hole);
      const dg = new THREE.ExtrudeGeometry(sh, { depth: 0.05, bevelEnabled: false }); mesh(dg, paint, hinge);
      const strip = mesh(new THREE.PlaneGeometry(0.9, 0.3), stripeM, hinge, d * 0.45, 0.5, 0.0515); strip.castShadow = false;
      mesh(new THREE.PlaneGeometry(0.5, 0.4), inner, hinge, d * 0.45, 1.08, 0.02).castShadow = false;
      for (let k = 0; k < 4; k++) mesh(new THREE.BoxGeometry(0.014, 0.4, 0.02), steel, hinge, d * (0.2 + 0.5 * (k + 0.5) / 4), 1.08, 0.035);
      mesh(new THREE.BoxGeometry(0.06, 0.03, 0.04), steel, hinge, d * 0.82, 0.78, 0.07);        // the handle
      for (const hy of [0.25, 1.2]) mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.1, 8), steel, hinge, 0, hy, 0.03);
      doors.push({ hinge, s });
    }
    // wheels
    for (const sx of [-1, 1]) for (const z of [-0.75, -2.55]) {
      const w = new THREE.Group(); w.position.set(sx * 1.0, 0.3, z); P.whole.add(w);
      mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.22, 24), dark, w).rotation.z = Math.PI / 2;
      mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.235, 18), steel, w).rotation.z = Math.PI / 2;
    }
    const bar = lightBar(body, 0, 2.2 - 0.3, -0.34, 1.1);
    return {
      grip: 0,
      apply(ps, t) {
        const op = clamp(ps.open ?? S.open ?? 0);
        for (const { hinge, s } of doors) hinge.rotation.y = s * rad(100) * op;
        body.rotation.z = rad(ps.rock ?? S.rock ?? 0);
        bar.set(ps.clock ?? S.clock ?? t ?? 0, clamp(ps.lights ?? S.lights ?? 0));
      },
    };
  },

  // ---------------------------------------------------------------------------------------------------- policecar
  policecar(P) {
    const S = P.spec, car = buildHatchback({ color: S.color || "#1c2440", plate: false }); P.whole.add(car.root);
    const tint = new THREE.MeshStandardMaterial({ color: S.tint || "#1c222c", roughness: 0.25, metalness: 0.2 });
    const cab = new THREE.Mesh(new THREE.BoxGeometry(HATCH.W * 1.86, 0.98, HATCH.cabin[1] - HATCH.cabin[0] - 0.08), tint);
    cab.position.set(0, HATCH.belt + 0.47, (HATCH.cabin[0] + HATCH.cabin[1]) / 2); cab.castShadow = false; car.root.add(cab);
    const white = new THREE.MeshStandardMaterial({ color: "#f2f2ee", roughness: 0.5, emissive: "#f2f2ee", emissiveIntensity: 0.5 });
    for (const s of [-1, 1]) mesh(new THREE.BoxGeometry(0.02, 0.1, 1.9), white, car.root, s * (HATCH.W * 0.985), 0.6, -0.15).castShadow = false;
    const bar = lightBar(car.root, 0, HATCH.roof + 0.1, -0.45, 1.0);
    return {
      grip: 0.9,
      apply(ps, t) {
        const d = ps.len ?? 0, st = ps.bend ?? 0;
        for (const W of car.wheels) { W.pivot.rotation.y = W.front ? rad(st) : 0; W.w.rotation.x = d / car.R; }
        bar.set(ps.clock ?? S.clock ?? t ?? 0, clamp(ps.lights ?? S.lights ?? 0));
      },
    };
  },

  // ---------------------------------------------------------------------------------------------------- sirenwash
  sirenwash(P) {
    const S = P.spec, { o, m } = softPatch(S.w ?? 4, S.h ?? 3, "#2f6bff", "#ff3b30", 0, 0);
    if (S.flat) { o.rotation.x = -Math.PI / 2; o.position.y = 0.01; }
    P.whole.add(o);
    return {
      grip: 0,
      apply(ps, t) {
        const on = clamp(ps.on ?? 0), f = flash(ps.clock ?? S.clock ?? t ?? 0);
        m.uniforms.uMix.value = f.mix; m.uniforms.uK.value = 0.35 * on; o.visible = on > 0.001;
      },
    };
  },

  // ---------------------------------------------------------------------------------------------------- lightpool
  lightpool(P) {
    const S = P.spec, color = S.color || "#fff1c2", W = S.w ?? 1.2, Dd = S.d ?? 0.8, up = (S.face ?? "up") !== "z";
    const { o, m } = softPatch(W, Dd, color, color, 0.3, 0.3);
    if (up) { o.rotation.x = -Math.PI / 2; o.position.y = 0.008; }
    P.whole.add(o);
    return { grip: 0, apply(ps) { const on = clamp(ps.on ?? 0); m.uniforms.uK.value = 0.6 * on; o.visible = on > 0.001; } };
  },

  // ---------------------------------------------------------------------------------------------------- copshadow
  copshadow(P) {
    const S = P.spec, len = S.len ?? 2.6, wid = S.w ?? 1.1;
    const m = new THREE.MeshBasicMaterial({ map: copShadowTex(len, wid, "#0c0b1a"), transparent: true, depthWrite: false, opacity: 0, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    m.userData.noOutline = true;
    const o = glowy(new THREE.Mesh(new THREE.PlaneGeometry(wid, len), m), 2); o.rotation.x = -Math.PI / 2; o.position.set(0, 0.006, -len / 2); P.whole.add(o);
    return { grip: 0, apply(ps) { const on = clamp(ps.on ?? 0); m.opacity = 0.6 * on; o.visible = on > 0.001; } };
  },

  // ----------------------------------------------------------------------------------------------------- roofblock
  roofblock(P) {
    const S = P.spec, W = S.w ?? 2.8, D = S.d ?? 2.0, H = S.h ?? 1.0, seed = S.seed ?? 1, extras = S.extras ?? [];
    const BH = H - 0.09, front = roofFront(W, BH, seed), side = new THREE.MeshStandardMaterial({ map: brickSide(seed), roughness: 0.95 });
    const frontM = new THREE.MeshStandardMaterial({ map: front.map, emissiveMap: front.emissive, emissive: "#ffffff", emissiveIntensity: 0.9, roughness: 0.95 });
    mesh(new THREE.BoxGeometry(W, BH, D), [side, side, side, side, frontM, side], P.whole, 0, BH / 2, 0);
    const stone = mat("#cfc6b8", { roughness: 0.9 });
    mesh(new THREE.BoxGeometry(W + 0.08, 0.08, D + 0.08), stone, P.whole, 0, H - 0.05, 0);
    mesh(new THREE.BoxGeometry(W - 0.06, 0.04, D - 0.06), mat("#26232b", { roughness: 0.95 }), P.whole, 0, H - 0.02, 0);   // the tar roof, top at y = H
    for (let r = 0; r < 2; r++) for (let c = 0; c < 5; c++) mesh(new THREE.BoxGeometry(0.34, 0.025, 0.05), stone, P.whole, ((c + 0.5) / 5 - 0.5) * W, (r ? 0.62 : 0.27) * (BH / 0.91) - 0.17, D / 2 + 0.012);
    // dark shapes at the back edge against the sky
    const sil = mat("#17121f", { roughness: 0.95 }), zb = -D / 2 + 0.28;
    extras.forEach((kind, i) => {
      const x = ((i + 0.5) / extras.length - 0.5) * W, g = new THREE.Group(); g.position.set(x, H, zb); P.whole.add(g);
      if (kind === "chimney") { mesh(new THREE.BoxGeometry(0.34, 0.8, 0.3), sil, g, 0, 0.4, 0); mesh(new THREE.BoxGeometry(0.44, 0.07, 0.4), sil, g, 0, 0.835, 0); }
      else if (kind === "tank") {
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const leg = mesh(new THREE.BoxGeometry(0.045, 0.5, 0.045), sil, g, sx * 0.25, 0.25, sz * 0.25); leg.rotation.z = -sx * 0.08; leg.rotation.x = sz * 0.08; }
        mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.72, 20), sil, g, 0, 0.86, 0); mesh(new THREE.ConeGeometry(0.4, 0.26, 20), sil, g, 0, 1.35, 0);
      }
      else if (kind === "antenna") {
        mesh(new THREE.CylinderGeometry(0.014, 0.018, 1.7, 8), sil, g, 0, 0.85, 0);
        for (const [y, w] of [[1.55, 0.7], [1.3, 0.5], [1.05, 0.34]]) mesh(new THREE.BoxGeometry(w, 0.02, 0.02), sil, g, 0, y, 0);
        for (let k = 0; k < 3; k++) { const leg = mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.4, 6), sil, g, Math.cos(k * 2.09) * 0.12, 0.17, Math.sin(k * 2.09) * 0.12); leg.rotation.set(Math.sin(k * 2.09) * 0.5, 0, -Math.cos(k * 2.09) * 0.5); }
      }
      else if (kind === "vent") {
        mesh(new THREE.BoxGeometry(0.28, 0.14, 0.28), sil, g, 0, 0.07, 0); mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.5, 14), sil, g, 0, 0.39, 0);
        const el = mesh(new THREE.TorusGeometry(0.1, 0.075, 10, 16, Math.PI / 2), sil, g, 0.1, 0.64, 0); el.rotation.z = Math.PI / 2;
        mesh(new THREE.CylinderGeometry(0.075, 0.095, 0.16, 14), sil, g, 0.2, 0.545, 0);
      }
    });
    return { grip: H };
  },
};
