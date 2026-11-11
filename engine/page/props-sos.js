import * as THREE from "three";
import { clamp, rng as rngOf } from "./util.js";

// Share or Steal (season 1, episode 1, 9 Nov 2026): the game pieces on a dark game-show set. Built by task T1; the
// design is storyboards/series/share-or-steal/01-gunslinger-viking/BOARD.md §2-§3. The fryer and the studio are
// props-sos-set.js. Everything is a pure function of the params and t (seeded rng, no Math.random, no wall clock).
// Origins at the floor / bottom centre unless said; +z is the prop's front (the camera side at rot 0).
//   sostable   the round game table: r spec.r (0.46), top at spec.h (0.62), 5 cm thick, black lacquer with a thin gold
//              inlay ring 4 cm in from the edge and a gold edge band; one thick black pedestal (r 0.12) on a round
//              base (r 0.3, 3 cm). Grip = h. spec.pedestal "drum" (T2) = instead of that pedestal and base, one steel
//              drum (r 0.27) from the floor to the underside of the top: brushed steel, two hoop bands, a ring of
//              24 rivets under the top.
//   goldpile   ~130 gold coins heaped into a mound with 6 gold bars poking out and four-point glints twinkling: one
//              rigid prop (footprint 0.42 x 0.34, 0.18 high), origin on the table top. Grips "L" and "R" (SOS_GRIPS).
//   sscard     a stiff game card 0.2 (x) x 0.28 (z) x 0.012 lying flat, spec.face "share" | "steal". Its back (navy,
//              gold border, a gold coin) is up at flip 0, the face (cream, the word in green / red) when flip is 1.
//              Params: flip 0..1 (a half turn about the card's own long axis z; it lifts as it turns so the corner
//              never cuts the table), glow 0..1 (a soft rim of light in the face colour on the table round it).
//              spec.back "red" (T2) = the back in deep red (#a3202a) with a cream border line and a fine darker-red wave
//              (seigaiha) pattern; absent = the navy back. spec.solid true (T2) = the face is a solid card in the word's
//              colour (green SHARE, red STEAL), a thin cream border line 6 % in, the word in bold white capitals with a dark
//              outline, as large as fits (across the short side); default false = the cream face. The glow keeps the colour.
//   sscardfan  (T2) both cards as ONE rigid thing held up in one glove: two cards 0.2 x 0.28 x 0.012 standing upright,
//              faces toward +z, fanned about a common pivot at the bottom middle (the origin, where thumb and fingers
//              pinch): SHARE in front, turned 12 degrees to the viewer's left (top toward -x); STEAL behind it, turned 12
//              degrees to the right, 6 mm behind (its word is drawn small in the top right strip SHARE leaves free, so
//              both words read). About 0.32 wide x 0.3 high (SIZE in storyboards/lib/grips.mjs, the
//              phone hold). spec.back as for sscard; spec.scale as for any prop. No params. spec.solid true: solid coloured
//              faces, spread wider (SHARE 16 degrees left at x -0.045, STEAL 16 degrees right at x +0.045, so 0.09 apart and
//              over half of each card shows, about 0.44 wide), each word whole along the long side reading bottom to top on
//              the half of its card the other one leaves free.
//   sschair    a high-back game-show chair facing +z: seat top at SEAT_Y (0.42), seat 0.66 x 0.55, oxblood leather
//              with button tufting, a back 0.66 x 0.12 rising to 1.15, a chrome pedestal on a 4-star chrome base,
//              no armrests; the seat is where "sit" puts a character (seat id = the prop id). Param tip (degrees,
//              0..110): the whole chair turns backward about the line along x through (y 0, z -0.3), its rear
//              casters; positive = the back goes down toward -z. NOTE: the engine's own prop tip (props3d.js
//              apply: root.rotation.x = +tip) turns the root about the origin the other way, so this kind undoes it
//              inside its own group (the visual is exactly the contract); gripWorld / sit, which only know the
//              engine's tip, place a seated character as if the chair leaned FORWARD about its centre while tipping.
//   sstrap     a 0.9 x 0.9 floor trapdoor: origin = the hole's centre, hinge along the +z edge. A flush dark brushed
//              steel flap (y 0.003) in a 2 cm bright steel rim with two hinge knuckles, and under it a pure black hole.
//              Params: open 0..1 (the flap swings down 100 degrees; under y 0 the set's floor hides it), warn 0..1 (a
//              thin red glowing strip round the rim and a red halo), steam 0..1 and rise 0..1 (a column of soft white
//              puffs lit warm from below streaming up out of the hole; its top at rise * 2.4 m, thicker with steam).
//              The first `warn` tween should be preceded by { warn: 0 } at t 0 (props3d.js propState starts only the
//              keys it lists as numbers; a number tweens, an unknown key steps on the first set).
// Glow, steam and glints are see-through for the checks (opacity under 0.5, userData.steam); the hole is a flat black
// square, the flap and the cards are solid.
const SEAT_Y = 0.42;   // props3d.js SEAT_Y (not imported: props3d imports this file)

// where a hand closes on a prop (the registry, props3d.js GRIPS, is the director's: it spreads this in)
export const SOS_GRIPS = {
  goldpile: { L: [-0.2, 0.08, 0], R: [0.2, 0.08, 0] },
};

const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, ...o });
// the anime look lights the key's rim on every surface seen at a grazing angle (looks.js krimK): at the low game-show camera
// that washes the table top, the cards and the seat pale. These are flat matte things: no key rim, no shine.
const quiet = (m, k = 0) => { m.userData.krimK = k; m.userData.noShine = true; return m; };
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
function canvasTex(w, h, draw) { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const steamy = (o, order = 3) => { o.frustumCulled = false; o.renderOrder = order; o.castShadow = false; o.userData.steam = true; return o; };
const flat = (geo) => geo.rotateX(-Math.PI / 2);   // a plane lying on the floor, facing up

// merge many small geometries (same attributes) into one, so a heap of 130 coins is two draw calls, not 130
function mergeGeos(list) {
  const out = new THREE.BufferGeometry(), pos = [], nor = [], uv = [], idx = [];
  let base = 0;
  for (const g of list) {
    const p = g.attributes.position, n = g.attributes.normal, u = g.attributes.uv;
    for (let i = 0; i < p.count; i++) { pos.push(p.getX(i), p.getY(i), p.getZ(i)); nor.push(n.getX(i), n.getY(i), n.getZ(i)); uv.push(u.getX(i), u.getY(i)); }
    for (const k of g.index.array) idx.push(base + k);
    base += p.count;
  }
  out.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); out.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3)); out.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  out.setIndex(idx); return out;
}

// a rounded rectangle (w x h, corners r; rt overrides the top two corners) centred on x, from y 0 up
function slab(w, h, r, rt = r) {
  const s = new THREE.Shape(), x = w / 2;
  s.moveTo(-x + r, 0); s.lineTo(x - r, 0); s.quadraticCurveTo(x, 0, x, r);
  s.lineTo(x, h - rt); s.quadraticCurveTo(x, h, x - rt, h); s.lineTo(-x + rt, h); s.quadraticCurveTo(-x, h, -x, h - rt);
  s.lineTo(-x, r); s.quadraticCurveTo(-x, 0, -x + r, 0); return s;
}

// a camera-facing disc of steam: soft round edge, white, lit warm from below (the hole's glow); uWarm 1 = orange
// right at the hole, 0 = the cooled white at the top of the column (props-hell.js puffMaterial, one extra uniform)
function puffMaterial() {
  const m = new THREE.ShaderMaterial({
    uniforms: { uR: { value: 0.1 }, uA: { value: 0 }, uSeed: { value: 0 }, uTime: { value: 0 }, uWarm: { value: 1 } },
    vertexShader: `uniform float uR; varying vec2 vUv;
      void main() { vUv = uv; vec4 c = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0); c.xy += (uv - 0.5) * 2.0 * uR; gl_Position = projectionMatrix * c; }`,
    fragmentShader: `uniform float uA, uSeed, uTime, uWarm; varying vec2 vUv;
      void main() {
        vec2 q = (vUv - 0.5) * 2.0; float a = atan(q.y, q.x), r = length(q);
        float edge = 0.86 + 0.08 * sin(a * 4.0 + uSeed * 6.3 + uTime * 1.5) + 0.05 * sin(a * 7.0 - uSeed * 2.0);
        float d = r / edge; if (d > 1.0) discard;
        vec3 warm = vec3(1.0, 0.55, 0.22), white = vec3(1.0, 0.97, 0.94);
        float under = smoothstep(0.1, 0.9, -q.y * 0.5 + d * 0.6);
        vec3 col = mix(white, warm, clamp(uWarm * (0.15 + 0.7 * under), 0.0, 1.0));
        float al = uA * (1.0 - smoothstep(0.35, 1.0, d));
        gl_FragColor = vec4(col, al);
      }`,
    transparent: true, depthWrite: false, opacity: 0.4,
  });
  m.userData.noOutline = true;
  return m;
}

// a soft glow texture: 0 = a radial blob, 1 = a rounded rectangle fading outward (inner box fully lit)
function glowTex(rect) {
  return canvasTex(128, 128, (g, w, h) => {
    if (!rect) {
      const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.4, "rgba(255,255,255,0.4)"); gr.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = gr; g.fillRect(0, 0, w, h); return;
    }
    g.fillStyle = "#000"; g.fillRect(0, 0, w, h);
    g.filter = "blur(12px)"; g.fillStyle = "#fff"; g.beginPath(); g.roundRect(34, 34, w - 68, h - 68, 10); g.fill();
  });
}

// ---- the card textures ----------------------------------------------------------------------------------------------
const CW = 512, CH = 717;   // 0.2 x 0.28
const GOLD = "#f2c23a";
function cardBack() {
  return canvasTex(CW, CH, (g, w, h) => {
    const bg = g.createLinearGradient(0, 0, w, h); bg.addColorStop(0, "#1b2744"); bg.addColorStop(1, "#111a30");
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.strokeStyle = GOLD; g.lineWidth = 7; g.beginPath(); g.roundRect(24, 24, w - 48, h - 48, 26); g.stroke();
    g.lineWidth = 2.5; g.globalAlpha = 0.7; g.beginPath(); g.roundRect(40, 40, w - 80, h - 80, 16); g.stroke(); g.globalAlpha = 1;
    // the coin emblem: a gold disc with a milled rim, an inner ring and a four-point sparkle
    const cx = w / 2, cy = h / 2, R = 118;
    const cg = g.createRadialGradient(cx - 40, cy - 40, 10, cx, cy, R); cg.addColorStop(0, "#ffe27a"); cg.addColorStop(0.6, GOLD); cg.addColorStop(1, "#b8841c");
    g.fillStyle = cg; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.fill();
    g.strokeStyle = "#8a5f10"; g.lineWidth = 5; g.beginPath(); g.arc(cx, cy, R - 4, 0, Math.PI * 2); g.stroke();
    g.lineWidth = 3; for (let i = 0; i < 48; i++) { const a = (i / 48) * Math.PI * 2; g.beginPath(); g.moveTo(cx + Math.cos(a) * (R - 18), cy + Math.sin(a) * (R - 18)); g.lineTo(cx + Math.cos(a) * (R - 8), cy + Math.sin(a) * (R - 8)); g.stroke(); }
    g.lineWidth = 5; g.beginPath(); g.arc(cx, cy, R - 30, 0, Math.PI * 2); g.stroke();
    g.fillStyle = "#8a5f10"; g.beginPath();
    for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4 - Math.PI / 2, rr = i % 2 ? 11 : 62; g[i ? "lineTo" : "moveTo"](cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
    g.closePath(); g.fill();
    // corner pips
    g.fillStyle = GOLD; for (const [x, y] of [[70, 70], [w - 70, 70], [70, h - 70], [w - 70, h - 70]]) { g.beginPath(); g.arc(x, y, 9, 0, Math.PI * 2); g.fill(); }
  });
}
// the red back (T2): deep red, a cream border line and a fine darker-red wave pattern (seigaiha: rows of overlapping
// concentric scallops), as on Jonny's panel 03
function cardBackRed() {
  return canvasTex(CW, CH, (g, w, h) => {
    g.fillStyle = "#a3202a"; g.fillRect(0, 0, w, h);
    g.save(); g.beginPath(); g.roundRect(40, 40, w - 80, h - 80, 16); g.clip();
    g.strokeStyle = "#5e0e17"; g.lineWidth = 3.5; g.lineCap = "round";
    const R = 46, rows = Math.ceil(h / (R / 2)) + 2, cols = Math.ceil(w / (R * 2)) + 2;
    for (let j = rows; j >= 0; j--) for (let i = -1; i < cols; i++) {
      const cx = i * R * 2 + (j % 2 ? R : 0), cy = j * (R / 2) + R * 0.5;
      for (const k of [1, 0.74, 0.48, 0.22]) { g.beginPath(); g.arc(cx, cy, R * k, Math.PI, 0); g.stroke(); }
    }
    g.restore();
    g.strokeStyle = "#f3e6c8"; g.lineWidth = 8; g.beginPath(); g.roundRect(24, 24, w - 48, h - 48, 26); g.stroke();
    g.lineWidth = 2.5; g.globalAlpha = 0.7; g.beginPath(); g.roundRect(40, 40, w - 80, h - 80, 16); g.stroke(); g.globalAlpha = 1;
  });
}
function cardFace(word, color, wedge = false) {
  return canvasTex(CW, CH, (g, w, h) => {
    g.fillStyle = "#f6efe0"; g.fillRect(0, 0, w, h);
    g.strokeStyle = color; g.lineWidth = 9; g.beginPath(); g.roundRect(22, 22, w - 44, h - 44, 26); g.stroke();
    g.lineWidth = 3; g.beginPath(); g.roundRect(40, 40, w - 80, h - 80, 16); g.stroke();
    // heavy bold capitals filling 85 % of the card's width, a stroke in the same colour to thicken them
    g.fillStyle = g.strokeStyle = color; g.textAlign = "center"; g.textBaseline = "middle"; g.lineJoin = "round";
    const stack = (px) => `900 ${px}px Inter, "Arial Black", Impact, sans-serif`;
    // wedge (the fan's back card): the word sits in the top right strip the front card leaves uncovered, 0.074 m wide, clear of a glove on the right edge
    const fit = wedge ? 190 : w * 0.85 - 8, wx = wedge ? 372 : w / 2, wy = wedge ? 104 : h / 2;
    let px = 160; g.font = stack(px); px = Math.round(px * (fit / g.measureText(word).width)); g.font = stack(px);
    g.lineWidth = wedge ? 5 : 8; g.strokeText(word, wx, wy + px * 0.04); g.fillText(word, wx, wy + px * 0.04);
    // small pips above and below, in the word's colour
    if (!wedge) for (const y of [h * 0.3, h * 0.7]) { g.fillRect(w * 0.5 - 40, y - 3, 80, 6); }
  });
}

// the solid face (T2, spec.solid): a flat card in the word's colour, a thin cream border line 6 % in, the word in bold white
// capitals with a dark outline, as large as fits. along: null = across the short side (a card lying flat); "up" = along
// the long side reading bottom to top, centred at texture x cx (the fan: each word sits on the half the other card leaves free)
function cardFaceSolid(word, color, along = null, cx = CW / 2) {
  return canvasTex(CW, CH, (g, w, h) => {
    g.fillStyle = color; g.fillRect(0, 0, w, h);
    g.strokeStyle = "#f6ecd2"; g.lineWidth = 4; g.beginPath(); g.roundRect(w * 0.06, w * 0.06, w * 0.88, h - w * 0.12, 16); g.stroke();
    g.textAlign = "center"; g.textBaseline = "middle"; g.lineJoin = "round";
    const stack = (px) => `900 ${px}px Inter, "Arial Black", Impact, sans-serif`;
    g.save();
    if (along) { g.translate(cx, h / 2); g.rotate(-Math.PI / 2); } else g.translate(w / 2, h / 2);
    const fit = along ? h * 0.84 : w * 0.84;
    g.font = stack(160); const px = Math.round(160 * (fit / g.measureText(word).width)); g.font = stack(px);
    g.strokeStyle = "#2a2018"; g.lineWidth = Math.max(8, px * 0.12); g.strokeText(word, 0, px * 0.04);
    g.fillStyle = "#ffffff"; g.fillText(word, 0, px * 0.04);
    g.restore();
  });
}

// ---- the chair's tufted leather (lines and buttons on a clear ground; laid over the cushion 1.5 mm above it) --------
function tuftTex(w, h, cell, clipFn) {
  return canvasTex(w, h, (g) => {
    g.save(); g.beginPath(); clipFn(g, w, h); g.clip();
    g.lineCap = "round";
    // a diamond lattice: the lines x - y = a * cell and x + y = b * cell, a button where two cross
    const lines = (dx, col, lw) => {
      g.strokeStyle = col; g.lineWidth = lw;
      for (let a = -Math.ceil(h / cell); a <= Math.ceil(w / cell); a++) { g.beginPath(); g.moveTo(a * cell + dx, 0); g.lineTo(a * cell + h + dx, h); g.stroke(); }
      for (let b = 0; b <= Math.ceil((w + h) / cell); b++) { g.beginPath(); g.moveTo(b * cell + dx, 0); g.lineTo(b * cell - h + dx, h); g.stroke(); }
    };
    lines(2, "rgba(150,70,80,0.35)", 4); lines(0, "rgba(22,4,8,0.85)", 3.2);
    for (let m = 0; m * cell / 2 <= w + cell; m++) for (let n = 0; n * cell / 2 <= h + cell; n++) {
      if ((m + n) % 2) continue;
      const x = m * cell / 2, y = n * cell / 2;
      g.fillStyle = "rgba(16,3,6,0.95)"; g.beginPath(); g.arc(x, y, cell * 0.075, 0, Math.PI * 2); g.fill();
      g.fillStyle = "rgba(210,130,140,0.7)"; g.beginPath(); g.arc(x - cell * 0.02, y - cell * 0.025, cell * 0.025, 0, Math.PI * 2); g.fill();
    }
    g.restore();
  });
}

// ---- the heap -------------------------------------------------------------------------------------------------------
// one source of truth for the mound's profile: height of the heap's surface at normalised radius n (0 centre .. 1 rim)
const HEAP_A = 0.225, HEAP_B = 0.18, HEAP_H = 0.128;
const heapH = (n) => HEAP_H * Math.pow(Math.max(0, 1 - n * n), 0.75);

export const SOS_KINDS = {
  sostable(P) {
    const S = P.spec, R = S.r ?? 0.46, H = S.h ?? 0.62, T = 0.05;
    const lacquer = quiet(mat("#07070b", { roughness: 0.9, metalness: 0 }));
    const gold = mat("#f2c23a", { roughness: 0.28, metalness: 0.7, emissive: new THREE.Color("#7a5200"), emissiveIntensity: 0.35 });
    const column = quiet(mat("#101016", { roughness: 0.3, metalness: 0.3 }), 0.12);
    // the base, the pedestal, the top (spec.pedestal "drum": one brushed steel drum instead)
    if (S.pedestal === "drum") {
      const DR = 0.27, DH = H - T;
      const steel = mat("#c2c8d2", { roughness: 0.5, metalness: 0.4, emissive: new THREE.Color("#2e333d"), emissiveIntensity: 0.8, map: canvasTex(256, 256, (g, w, h) => {
        g.fillStyle = "#b4bbc6"; g.fillRect(0, 0, w, h);
        for (let y = 0; y < h; y++) { g.fillStyle = `rgba(${rnd(y + 5) > 0.5 ? "255,255,255" : "20,24,32"},${0.05 + rnd(y + 9) * 0.14})`; g.fillRect(0, y, w, 1); }
      }) }); steel.userData.krimK = 0.3;
      const hoop = mat("#8d95a3", { roughness: 0.4, metalness: 0.5, emissive: new THREE.Color("#20242c"), emissiveIntensity: 0.7 }); hoop.userData.krimK = 0.3;
      mesh(new THREE.CylinderGeometry(DR, DR, DH, 56), steel, P.whole, 0, DH / 2, 0);
      for (const y of [0.1, DH - 0.15]) { mesh(new THREE.CylinderGeometry(DR + 0.008, DR + 0.008, 0.032, 56), hoop, P.whole, 0, y, 0); for (const dy of [-0.019, 0.019]) mesh(new THREE.TorusGeometry(DR + 0.008, 0.004, 6, 56), hoop, P.whole, 0, y + dy, 0).rotation.x = Math.PI / 2; }
      for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; mesh(new THREE.SphereGeometry(0.011, 8, 6), hoop, P.whole, Math.cos(a) * (DR + 0.002), DH - 0.035, Math.sin(a) * (DR + 0.002)); }
    } else {
    mesh(new THREE.CylinderGeometry(0.29, 0.3, 0.03, 40), column, P.whole, 0, 0.015, 0);
    mesh(new THREE.TorusGeometry(0.288, 0.005, 6, 48), gold, P.whole, 0, 0.03, 0).rotation.x = Math.PI / 2;
    mesh(new THREE.CylinderGeometry(0.12, 0.12, H - T - 0.03, 32), column, P.whole, 0, 0.03 + (H - T - 0.03) / 2, 0);
    for (const y of [0.075, H - T - 0.045]) mesh(new THREE.TorusGeometry(0.122, 0.009, 8, 36), gold, P.whole, 0, y, 0).rotation.x = Math.PI / 2;
    }
    mesh(new THREE.CylinderGeometry(R - 0.004, R - 0.03, T, 56), lacquer, P.whole, 0, H - T / 2, 0);
    // the gold edge band (round the thick edge, a lip of black under it) and the thin inlay ring 4 cm in from the edge
    mesh(new THREE.CylinderGeometry(R + 0.0015, R + 0.0015, 0.034, 56, 1, true), gold, P.whole, 0, H - 0.017, 0);
    const inlay = mesh(new THREE.RingGeometry(R - 0.04 - 0.004, R - 0.04 + 0.004, 72), gold, P.whole, 0, H + 0.0012, 0); inlay.rotation.x = -Math.PI / 2; inlay.castShadow = false;
    return { grip: H };
  },

  goldpile(P) {
    const gold = mat("#f2c23a", { roughness: 0.3, metalness: 0.55, emissive: new THREE.Color("#7a5200"), emissiveIntensity: 0.4 });
    const goldDark = mat("#d49a22", { roughness: 0.34, metalness: 0.55, emissive: new THREE.Color("#5c3a00"), emissiveIntensity: 0.4 });
    const bar = mat("#ffd45a", { roughness: 0.2, metalness: 0.65, emissive: new THREE.Color("#8a6000"), emissiveIntensity: 0.45 });
    const r = rngOf(31);
    // a core under the coins so the heap has no see-through gaps
    const core = mesh(new THREE.SphereGeometry(1, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), goldDark, P.whole, 0, 0, 0);
    core.scale.set(HEAP_A * 0.72, HEAP_H * 0.86, HEAP_B * 0.72); core.castShadow = false;
    // 130 coins (r 0.028-0.035, 8 mm) lying on the heap's surface tilted with its slope, a few on edge
    const flatCoin = new THREE.CylinderGeometry(1, 1, 0.008, 14), up = new THREE.Vector3(0, 1, 0);
    const bright = [], dark = [];
    for (let i = 0; i < 130; i++) {
      const ang = r() * Math.PI * 2, n = Math.sqrt(r()) * 0.8, cr = 0.028 + r() * 0.007;
      const x = Math.cos(ang) * n * HEAP_A, z = Math.sin(ang) * n * HEAP_B;
      const y = Math.max(0.026, heapH(n) * 0.93 + (r() - 0.35) * 0.012);
      const out = new THREE.Vector3(Math.cos(ang) * HEAP_B, 0, Math.sin(ang) * HEAP_A).normalize();
      const phi = r() < 0.1 ? 0.9 + r() * 0.5 : 0.18 + 0.65 * n + (r() - 0.5) * 0.5;
      const nrm = out.multiplyScalar(Math.sin(phi)).add(new THREE.Vector3(0, Math.cos(phi), 0)).normalize();
      const q = new THREE.Quaternion().setFromUnitVectors(up, nrm).multiply(new THREE.Quaternion().setFromAxisAngle(up, r() * 6.28));
      const g = flatCoin.clone(); g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(cr, 1, cr)));
      (i % 3 ? bright : dark).push(g);
    }
    mesh(mergeGeos(bright), gold, P.whole).castShadow = true;
    mesh(mergeGeos(dark), goldDark, P.whole).castShadow = true;
    // 6 gold bars (0.13 x 0.05 x 0.04, a little narrower at the top) half buried and poking out
    const barGeo = new THREE.BoxGeometry(0.13, 0.04, 0.05, 1, 1, 1);
    { const p = barGeo.attributes.position; for (let i = 0; i < p.count; i++) if (p.getY(i) > 0) { p.setX(i, p.getX(i) * 0.86); p.setZ(i, p.getZ(i) * 0.8); } barGeo.computeVertexNormals(); }
    const bars = [[-0.08, -0.04, 0.5, 0.2, 0.1], [0.07, -0.05, -0.7, -0.15, 0.25], [-0.02, 0.07, 0.2, 0.28, -0.12], [0.125, 0.055, 1.9, -0.3, 0.2], [-0.13, 0.05, -0.4, 0.1, -0.35], [0.01, -0.01, 1.2, 0.4, 0.05]];
    for (const [x, z, yaw, tx, tz] of bars) {
      const n = Math.hypot(x / HEAP_A, z / HEAP_B);
      const b = mesh(barGeo, bar, P.whole, x, Math.min(0.158, heapH(n) + 0.012), z); b.rotation.set(tx, yaw, tz, "YXZ");
    }
    // four-point glints that twinkle (in the heap's front, so they face the camera)
    const gl = new THREE.MeshBasicMaterial({ color: "#fff6c8", transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }); gl.userData.noOutline = true;
    const star = new THREE.Shape(); for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4, rr = i % 2 ? 0.008 : 0.05; star[i ? "lineTo" : "moveTo"](Math.cos(a) * rr, Math.sin(a) * rr); }
    const glints = [[-0.07, 0.15, 0.07], [0.09, 0.115, 0.1], [0.0, 0.17, 0.02], [0.15, 0.07, 0.05], [-0.16, 0.075, 0.02]].map(([x, y, z], i) => {
      const m = steamy(new THREE.Mesh(new THREE.ShapeGeometry(star), gl), 6); m.position.set(x, y, z); m.userData.ph = i * 1.9; P.whole.add(m); return m;
    });
    return {
      grip: 0.08,
      apply(ps, t) {
        for (const g of glints) { const k = Math.max(0, Math.sin((t ?? 0) * 4 + g.userData.ph)); g.scale.setScalar(0.25 + 1.2 * k); g.rotation.z = (t ?? 0) * 0.8; }
      },
    };
  },

  sscard(P) {
    const face = P.spec.face === "steal" ? "steal" : "share", word = face.toUpperCase(), col = face === "steal" ? "#e0283c" : "#2fae58";
    const edge = quiet(mat("#161f38", { roughness: 0.6 }));
    // the printing also glows a little (emissiveMap) so the word keeps its colour whatever light the set throws on it
    const printed = (map) => quiet(mat("#8a8a8a", { map, roughness: 0.65, emissive: new THREE.Color("#ffffff"), emissiveMap: map, emissiveIntensity: 0.5 }));
    const back = printed(P.spec.back === "red" ? cardBackRed() : cardBack()), front = printed(P.spec.solid ? cardFaceSolid(word, col) : cardFace(word, col));
    back.userData.noHatch = front.userData.noHatch = true;
    // the card turns about its own centre line (z); y 0.006 = half its thickness, the origin is the table top
    const turn = new THREE.Group(); P.whole.add(turn);
    const slab_ = mesh(new THREE.BoxGeometry(0.2, 0.012, 0.28), edge, turn); slab_.receiveShadow = true;
    const top = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.28), back); top.rotation.x = -Math.PI / 2; top.position.y = 0.0062; top.receiveShadow = true; top.castShadow = false; turn.add(top);
    // the face is the same plane turned over: a half turn about z puts it up, text upright for a viewer at +z
    const under = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.28), front); under.rotation.order = "ZXY"; under.rotation.set(-Math.PI / 2, 0, Math.PI); under.position.y = -0.0062; under.receiveShadow = true; under.castShadow = false; turn.add(under);
    // the rim glow: a rounded halo lying on the table under the card (the card covers its middle), additive
    const gm = new THREE.MeshBasicMaterial({ map: glowTex(true), color: col, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    gm.userData.noOutline = true;
    const glow = steamy(new THREE.Mesh(flat(new THREE.PlaneGeometry(0.2 + 0.2, 0.28 + 0.2)), gm), 4); glow.position.y = 0.0025; P.whole.add(glow);
    return {
      grip: 0.006,
      apply(ps) {
        const f = clamp(ps.flip), th = f * Math.PI, s = Math.sin(th), c = Math.abs(Math.cos(th));
        // centre height: the card's lowest corner clears the table the whole way round (half width 0.1 x |sin| + half
        // thickness x |cos|) with 1 cm to spare mid-turn
        turn.position.y = 0.1 * s + 0.006 * c + 0.01 * s;
        turn.rotation.z = th;
        const g = clamp(ps.glow);
        gm.opacity = 0.9 * g; glow.visible = g > 0.01;
      },
    };
  },

  sscardfan(P) {
    // two upright cards fanned about the bottom middle: the origin is the pivot (where the glove pinches)
    const edge = quiet(mat("#161f38", { roughness: 0.6 }));
    const printed = (map) => { const m = quiet(mat("#8a8a8a", { map, roughness: 0.65, emissive: new THREE.Color("#ffffff"), emissiveMap: map, emissiveIntensity: 0.5 })); m.userData.noHatch = true; return m; };
    const red = P.spec.back === "red", solid = !!P.spec.solid;
    // [word, colour, turn about z in degrees (+ = the top goes to the viewer's left), x, z, the word's texture x (solid)]
    // solid: 16 degrees each way and 0.09 apart (+-0.045 about the pivot), so over half of each card shows; the word runs
    // up the long side on the half the other card does not cover (SHARE the left half, STEAL the right half)
    const cards = solid
      ? [["SHARE", "#2fae58", 16, -0.045, 0, CW * 0.25], ["STEAL", "#e0283c", -16, 0.045, -0.006, CW * 0.75]]
      : [["SHARE", "#2fae58", 12, 0, 0, 0], ["STEAL", "#e0283c", -12, 0, -0.006, 0]];
    for (const [word, col, deg, x, z, cx] of cards) {
      const card = new THREE.Group(); card.position.set(x, 0, z); card.rotation.z = (deg * Math.PI) / 180; P.whole.add(card);
      mesh(new THREE.BoxGeometry(0.2, 0.28, 0.012), edge, card, 0, 0.14, 0);
      const map = solid ? cardFaceSolid(word, col, "up", cx) : cardFace(word, col, deg < 0);
      const front = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.28), printed(map)); front.position.set(0, 0.14, 0.0062); front.castShadow = false; card.add(front);
      const back = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.28), printed(red ? cardBackRed() : cardBack())); back.rotation.y = Math.PI; back.position.set(0, 0.14, -0.0062); back.castShadow = false; card.add(back);
    }
    return { grip: 0 };
  },

  sschair(P) {
    const leather = quiet(mat("#4a1620", { roughness: 0.95, metalness: 0 }));
    const chrome = mat("#8e96a6", { roughness: 0.28, metalness: 0.6, emissive: new THREE.Color("#14171e"), emissiveIntensity: 0.4 }); chrome.userData.krimK = 0.3;
    const body = new THREE.Group(); P.whole.add(body);   // the tip turns this group (not P.whole)
    // the 4-star base: an X of four chrome legs with a caster at each end (the rear casters are the tip line at z -0.3)
    const hub = mesh(new THREE.CylinderGeometry(0.07, 0.085, 0.05, 20), chrome, body, 0, 0.055, 0);
    for (let k = 0; k < 4; k++) {
      const leg = new THREE.Group(); leg.rotation.y = Math.PI / 4 + (k * Math.PI) / 2; body.add(leg);
      const L = 0.3 / Math.SQRT1_2 * 0.99999;   // the rear casters sit at z -0.3 (the tip line)
      mesh(new THREE.BoxGeometry(0.05, 0.035, L), chrome, leg, 0, 0.062, L / 2).scale.set(1, 1, 1);
      mesh(new THREE.SphereGeometry(0.03, 12, 10), chrome, leg, 0, 0.03, L);
    }
    // the gas-lift column with collars, up to the seat
    mesh(new THREE.CylinderGeometry(0.04, 0.045, SEAT_Y - 0.1 - 0.08, 16), chrome, body, 0, 0.08 + (SEAT_Y - 0.18) / 2, 0);
    mesh(new THREE.CylinderGeometry(0.065, 0.07, 0.07, 18), chrome, body, 0, 0.12, 0);
    mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.045, 20), chrome, body, 0, SEAT_Y - 0.115, 0);
    // the seat: a rounded cushion 0.66 x 0.55, top at SEAT_Y
    const bt = 0.012, depthS = 0.058;
    const seatShape = slab(0.66 - 2 * bt, 0.55 - 2 * bt, 0.07); const seatG = new THREE.ExtrudeGeometry(seatShape, { depth: depthS, bevelEnabled: true, bevelThickness: bt, bevelSize: bt, bevelSegments: 3, curveSegments: 8 });
    seatG.translate(0, -(0.55 - 2 * bt) / 2, 0);   // the shape runs 0..h in y; centre it on z after the turn
    const seat = mesh(seatG, leather, body, 0, SEAT_Y - (depthS + bt), 0); seat.rotation.x = -Math.PI / 2;
    // the back: 0.66 wide, 0.12 thick, from 0.30 up to 1.15, big rounded top corners
    const bh = 1.15 - 0.30, bd = 0.12 - 2 * bt;
    const backG = new THREE.ExtrudeGeometry(slab(0.66 - 2 * bt, bh - 2 * bt, 0.05, 0.24), { depth: bd, bevelEnabled: true, bevelThickness: bt, bevelSize: bt, bevelSegments: 3, curveSegments: 10 });
    backG.translate(0, bt, 0);
    const back = mesh(backG, leather, body, 0, 0.30, -0.36 + bt);
    // the tufting overlays (alpha-tested planes just proud of the leather)
    const tuftMat = (tex) => { const m = new THREE.MeshStandardMaterial({ map: tex, transparent: true, alphaTest: 0.35, roughness: 0.5, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }); m.userData.noOutline = true; return quiet(m); };
    const SEATW = 0.6, SEATD = 0.49, BACKW = 0.6, BACKH = 0.8;
    const sTex = tuftTex(450, Math.round((450 * SEATD) / SEATW), 75, (g, w, h) => g.roundRect(0, 0, w, h, 30));
    const sOver = new THREE.Mesh(flat(new THREE.PlaneGeometry(SEATW, SEATD)), tuftMat(sTex)); sOver.position.set(0, SEAT_Y + 0.0015, 0); sOver.renderOrder = 2; body.add(sOver);
    const bTex = tuftTex(450, Math.round((450 * BACKH) / BACKW), 75, (g, w, h) => g.roundRect(0, 0, w, h, [150, 150, 28, 28]));
    const bOver = new THREE.Mesh(new THREE.PlaneGeometry(BACKW, BACKH), tuftMat(bTex)); bOver.position.set(0, 0.30 + 0.04 + BACKH / 2, -0.24 + 0.0015); bOver.renderOrder = 2; body.add(bOver);
    void hub; void back;
    const pivot = new THREE.Vector3(0, 0, -0.3), ax = new THREE.Vector3(1, 0, 0);
    return {
      grip: SEAT_Y,
      apply(ps) {
        // the engine's root already turned everything by +tip about the origin (the wrong way, about the wrong line):
        // undo it and turn by -tip about the pivot. Net = Rx(-a) about the pivot  =>  body = Rx(-2a), moved by
        // Rx(-a) p - Rx(-2a) p
        const a = (clamp(ps.tip ?? 0, -10, 130) * Math.PI) / 180;
        body.rotation.set(-2 * a, 0, 0);
        const p1 = pivot.clone().applyAxisAngle(ax, -a), p2 = pivot.clone().applyAxisAngle(ax, -2 * a);
        body.position.copy(p1.sub(p2));
      },
    };
  },

  sstrap(P) {
    const N = 22;   // puffs in the column
    const steelDark = quiet(mat("#1c1c22", { roughness: 0.42, metalness: 0.5, map: canvasTex(256, 256, (g, w, h) => {
      g.fillStyle = "#2e2e36"; g.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 2) { g.fillStyle = `rgba(${rnd(y) > 0.5 ? "255,255,255" : "0,0,0"},${0.04 + rnd(y + 3) * 0.08})`; g.fillRect(0, y, w, 2); }
    }) }), 0.3);
    const steelBright = mat("#9096a2", { roughness: 0.3, metalness: 0.7, emissive: new THREE.Color("#262a32"), emissiveIntensity: 0.6 });
    // the hole: a pure black square under the flap (it shows once the flap swings open)
    const holeM = new THREE.MeshBasicMaterial({ color: "#000000" }); holeM.userData.noOutline = true;
    const hole = new THREE.Mesh(flat(new THREE.PlaneGeometry(0.86, 0.86)), holeM); hole.position.y = 0.002; hole.castShadow = false; hole.userData.noOutline = true; P.whole.add(hole);
    // the rim: a 2 cm bright steel frame round the hole (0.86 inside, 0.90 outside)
    for (const [x, z, w, d] of [[0, 0.44, 0.9, 0.02], [0, -0.44, 0.9, 0.02], [0.44, 0, 0.02, 0.86], [-0.44, 0, 0.02, 0.86]]) {
      const m = mesh(new THREE.BoxGeometry(w, 0.003, d), steelBright, P.whole, x, 0.0016, z); m.castShadow = false;
    }
    // the hinge knuckles on the +z edge
    for (const x of [-0.27, 0.27]) { const k = mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.1, 12), steelBright, P.whole, x, 0.0045, 0.43); k.rotation.z = Math.PI / 2; k.castShadow = false; }
    // the flap: hinged on the +z edge (z 0.43), lying back toward -z; opening swings its far edge down
    const hinge = new THREE.Group(); hinge.position.set(0, 0.003, 0.43); P.whole.add(hinge);
    const flap = mesh(new THREE.BoxGeometry(0.86, 0.004, 0.86), steelDark, hinge, 0, 0, -0.43); flap.castShadow = false;
    // the red warning strip round the rim (1 cm, glowing) and its halo
    const warnM = new THREE.MeshStandardMaterial({ color: "#2a0006", emissive: new THREE.Color("#ff1a30"), emissiveIntensity: 0, roughness: 0.4, transparent: true, opacity: 0.45 }); warnM.userData.noOutline = true;
    const warnG = new THREE.Group(); P.whole.add(warnG);
    for (const [x, z, w, d] of [[0, 0.44, 0.9, 0.008], [0, -0.44, 0.9, 0.008], [0.44, 0, 0.008, 0.88], [-0.44, 0, 0.008, 0.88]]) {
      const m = steamy(new THREE.Mesh(new THREE.BoxGeometry(w, 0.002, d), warnM), 4); m.position.set(x, 0.0046, z); warnG.add(m);
    }
    const haloM = new THREE.MeshBasicMaterial({ map: glowTex(true), color: "#ff2038", transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }); haloM.userData.noOutline = true;
    const halo = steamy(new THREE.Mesh(flat(new THREE.PlaneGeometry(1.5, 1.5)), haloM), 4); halo.position.y = 0.0035; P.whole.add(halo);
    // the hot light from the hole on the floor round it (orange, additive) under the rising steam
    const floorM = new THREE.MeshBasicMaterial({ map: glowTex(false), color: "#ff8a2a", transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }); floorM.userData.noOutline = true;
    const floorGlow = steamy(new THREE.Mesh(flat(new THREE.PlaneGeometry(2.1, 2.1)), floorM), 4); floorGlow.position.y = 0.0042; P.whole.add(floorGlow);
    // the column of steam: soft camera-facing puffs streaming up
    const puffs = Array.from({ length: N }, (_, i) => {
      const m = puffMaterial(); m.uniforms.uSeed.value = rnd(i);
      const o = steamy(new THREE.Mesh(new THREE.PlaneGeometry(1, 1), m), 5 + (i % 3)); P.whole.add(o);
      return { o, m, ph: (i + rnd(i + 17) * 0.6) / N, jx: rnd(i + 21) - 0.5, jz: rnd(i + 31) - 0.5, sw: rnd(i + 41) * 6.28 };
    });
    return {
      grip: 0,
      apply(ps, t) {
        const open = clamp(ps.open), warn = clamp(ps.warn ?? P.spec.warn ?? 0), st = clamp(ps.steam), rise = clamp(ps.rise), tt = t ?? 0;
        hinge.rotation.x = -open * (100 * Math.PI) / 180;
        hole.visible = open > 0.001;
        warnG.visible = halo.visible = warn > 0.01;
        const pulse = 0.82 + 0.18 * Math.sin(tt * 14);
        warnM.emissiveIntensity = 3.2 * warn * pulse; warnM.opacity = 0.45;
        haloM.opacity = 0.42 * warn * pulse;
        floorM.opacity = 0.4 * st * Math.min(1, rise * 4 + 0.2); floorGlow.visible = st > 0.01;
        const H = rise * 2.4;
        for (const p of puffs) {
          // each puff climbs the column on a 2.4 s loop, spreading, swelling and cooling as it goes
          const u = (tt * 0.42 + p.ph) % 1, ur = u * u * (3 - 2 * u) * 0.4 + u * 0.6;
          p.o.position.set(p.jx * (0.5 + 0.7 * u) + Math.sin(tt * 1.3 + p.sw) * 0.1 * u, 0.02 + ur * H, p.jz * (0.5 + 0.7 * u) + Math.cos(tt * 1.1 + p.sw) * 0.08 * u);
          p.m.uniforms.uR.value = (0.14 + 0.3 * u) * (0.55 + 0.45 * Math.min(1, rise * 3));
          p.m.uniforms.uA.value = st * 0.85 * Math.min(1, u * 10) * (1 - u) ** 0.9 * Math.min(1, rise * 6);
          p.m.uniforms.uWarm.value = (1 - Math.min(1, u * 1.6)) * st;
          p.m.uniforms.uTime.value = tt;
          p.o.visible = st > 0.01 && rise > 0.01;
        }
      },
    };
  },
};
