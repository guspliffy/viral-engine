import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { clamp, lerp, rng } from "./util.js";
import { mat, basic, mesh, canvasTex } from "./props-trend.js";

// "That one friend who never has money… when it's his round" (never has money, episode 3, 8 Nov 2026): the pub at
// night. Jonny's eight panels (storyboards/series/never-has-money/03-his-round/PANELS.md, BOARD.md §2-§4): dark wood,
// green, brass and warm amber; round dark-red leather stools, small clear tumblers, a dark-wood toilet door with a
// two-figure pictogram and a red/green lamp, a desk card terminal showing "84.00". (props-steak.js `barcounter` is a
// plain slab with no foot rail or lit edge, so the bar is rebuilt here instead of aliased.)
// Metres; +z faces the camera (the bartender's side), the customers sit on the -z side.
//   pubbar      a bar counter along x (spec.w 3.2, spec.d 0.45, spec.h 0.66): a plank front on both sides, a polished warm top
//               (#7a4a28) with a lighter bullnose edge that overhangs the customers' side (-z), a brass foot rail and
//               brackets on the customers' side. Origin: the floor under its middle. Grip: its top (h).
//   pubstool    a round bar stool: a dark-red leather seat (#7a2a24) with a brass trim, dark wood splayed legs, a brass
//               foot ring and a low back rail behind the seat (-z at rot 0; the sitter faces +z). spec.h = the seat top
//               (0.38), spec.r the seat's radius (0.27). Origin: the floor under its middle. Sit on it with
//               A(t, id, "sit", { seat: <stool id>, height: <spec.h> }). PUB.stool.rail: the rail's radius and its
//               height above the seat top (a drape coat's origin is at (stool x, stool y + h + rail.y, stool z - rail.r)).
//   tumbler     a small clear glass tumbler (r 0.035 at the rim, h 0.09). `fill` 0..1 the amber lemonade (#e8a531) level, the
//               surface at y = 0.011 + fill * 0.07 m, a few bubbles; GIVE `fill` ON EVERY TUMBLER (the engine's default
//               when it is missing is 1, a full glass). spec.lemon true: a lemon slice on the rim, facing +z. Origin:
//               its bottom centre. Hold: grips.mug with the kind swapped for the size table (see PUB.tumbler.gripKind).
//   toiletdoor  a toilet partition (spec.w 1.3, spec.h 1.5): dark wood panelling below, green (#2f4a36) above, a dark
//               wood door frame, and the door (spec.dw 0.5 x spec.dh 1.05, hinged on its left edge) opening toward +z
//               by `open` 0..90 degrees (the engine's own `open`, here in degrees). A two-figure pictogram plaque and a
//               brass push plate on the door; behind it when open a warm cream tiled glow and a soft spill on the floor.
//               A lamp above the door: `lamp` 0 = red lit, 1 = green lit (emissive, bloom catches it; give `lamp` in
//               the spec or tween it with a prop action's set). Origin: the floor under the DOOR's middle at the
//               partition's middle thickness; spec.off (-0.15) moves the partition's middle sideways of it.
//   pubreader   a desk card terminal at the scale of props-bistro `cardreader`: a dark base with a keypad, a screen
//               tilted back 55 degrees from flat (it faces its own +z), glowing cyan digits spec.text (default
//               "84.00"), no brand, no currency symbol. Lies flat on its origin (its bottom is y 0), so a prop x/z tween
//               slides it along the bar. Origin: the middle of its base, on the bar.
//   bartowel    a white bar towel (a pale blue stripe at each end) draped over the character's LEFT shoulder (+x in the
//               body frame): worn (spec.wear), the origin is the body frame's origin (x 0, y 0, z 0 like waiterapron);
//               spec.x (0.33) is where it crosses the shoulder, spec.front / spec.back how far it hangs (0.22 / 0.26).
//   pubcoat     a coat in spec.color (default Reaper's #4a4a52; the Wizard's is #a07850), spec.scarf an optional scarf
//               colour. spec.mode "drape": folded over a stool's back rail (the origin on the rail, a long panel
//               hanging behind it (-z), a short one in front, one sleeve); "worn" (spec.wear, the body frame, origin
//               0,0,0): a coat round the back and flanks with a standing collar and an open front, with armholes so
//               it stays clear of the arms; spec.scarf adds a wrapped scarf and two tails at the front.
export const PUB = {
  bar: { w: 3.2, d: 0.45, h: 0.66, top: 0.045, rail: { y: 0.13, z: -0.265 } },
  stool: { seat: 0.38, r: 0.27, rail: { r: 0.46, y: 0.15 } },
  tumbler: { r: 0.035, h: 0.09, gripKind: "waterglass" },   // grips.mjs SIZE.waterglass (r 0.038, h 0.1): grips.mug(c, who, { ...spec, kind: "waterglass" })
  door: { w: 0.5, h: 1.05, partW: 1.3, partH: 1.5, off: -0.15 },
  reader: { w: 0.1, d: 0.15, h: 0.11, base: 0.028 },
  towel: { x: 0.33 },
  coat: { reaper: "#4a4a52", wizard: "#a07850" },
};

const BRASS = "#d9a441", WOOD = "#5a3520", WOOD_DK = "#3d2312", LEATHER = "#7a2a24", GREEN = "#2f4a36";
const smooth = (k) => k * k * (3 - 2 * k);
const rad = (d) => (d * Math.PI) / 180;
const brass = (o = {}) => mat(BRASS, { roughness: 0.3, metalness: 0.7, ...o });
const wood = (c = WOOD, o = {}) => { const m = mat(c, { roughness: 0.62, ...o }); m.userData.lookRole = "wood"; return m; };

// textures are built once per key (the stage rebuilds props between shots; the canvases are costly)
const TEX = new Map();
const cached = (key, make) => { if (!TEX.has(key)) TEX.set(key, make()); return TEX.get(key); };
const repeat = (t, x, y) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(x, y); return t; };

// wood grain: long fine strokes along x (or y when `vertical`), planks cut by dark seams every `plank` px
function woodTex(key, w, h, { base, dark = "rgba(25,12,4,", light = "rgba(255,190,120,", seed = 1, vertical = false, plank = 0, grain = 160, seam = 0.55 }) {
  return cached(key, () => canvasTex(w, h, (g) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    const r = rng(seed), L = vertical ? h : w, N = vertical ? w : h;
    for (let i = 0; i < grain; i++) {
      const p = r() * N, s = r() * L, len = 30 + r() * L * 0.5, a = 0.05 + r() * 0.16;
      g.strokeStyle = (i % 3 ? dark : light) + a + ")"; g.lineWidth = 0.6 + r() * 1.8;
      g.beginPath();
      if (vertical) { g.moveTo(p, s); g.quadraticCurveTo(p + (r() - 0.5) * 3, s + len / 2, p, s + len); } else { g.moveTo(s, p); g.quadraticCurveTo(s + len / 2, p + (r() - 0.5) * 3, s + len, p); }
      g.stroke();
    }
    if (plank) for (let x = plank; x < N; x += plank) {
      g.strokeStyle = `rgba(15,6,2,${seam})`; g.lineWidth = 2.5; g.beginPath();
      if (vertical) { g.moveTo(0, x); g.lineTo(w, x); } else { g.moveTo(x, 0); g.lineTo(x, h); }
      g.stroke();
    }
  }));
}

// a cylinder between two points
function between(parent, m, p, q, r0, r1 = r0, seg = 10) {
  const a = new THREE.Vector3(...p), b = new THREE.Vector3(...q), len = a.distanceTo(b);
  const o = mesh(new THREE.CylinderGeometry(r1, r0, len, seg), m, parent, (a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
  o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  return o;
}

// a cloth surface: f(u, v) -> [x, y, z] on a (nu x nv) grid
function sheet(nu, nv, f) {
  const pos = [], uv = [], idx = [];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { pos.push(...f(i / nu, j / nv)); uv.push(i / nu, j / nv); }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}

// the potato body's outline in its own frame (egg: 0.40 wide, 0.36 deep, 0.5 +- 0.52 tall): half sizes at height y
const bodyHalf = (y, x = 0) => { const k = Math.sqrt(Math.max(0, 1 - ((y - 0.5) / 0.52) ** 2 - (x / 0.4) ** 2)); return [0.4 * Math.sqrt(Math.max(0, 1 - ((y - 0.5) / 0.52) ** 2)), 0.36 * k]; };

// a soft additive glow that always faces the camera (the lamp's halo); colour is set per use
function halo(parent, color, y = 0, z = 0) {
  const m = new THREE.ShaderMaterial({
    uniforms: { uR: { value: 0.18 }, uA: { value: 1 }, uC: { value: new THREE.Color(color) } },
    vertexShader: `uniform float uR; varying vec2 vUv;
      void main() { vUv = uv; float s = length(modelMatrix[0].xyz); vec4 c = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
        c.xy += (uv - 0.5) * 2.0 * uR * s; gl_Position = projectionMatrix * c; }`,
    fragmentShader: `uniform float uA; uniform vec3 uC; varying vec2 vUv;
      void main() { float r = length(vUv - 0.5) * 2.0; float a = pow(max(0.0, 1.0 - r), 2.0) * uA; gl_FragColor = vec4(uC, a); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  m.userData.noOutline = true;
  const o = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), m); o.position.set(0, y, z); o.frustumCulled = false; o.renderOrder = 3; o.castShadow = false; o.userData.steam = true;
  parent.add(o);
  return o;
}

export const PUB_KINDS = {
  pubbar(P) {
    const S = P.spec, W = S.w ?? PUB.bar.w, D = S.d ?? PUB.bar.d, H = S.h ?? PUB.bar.h, T = PUB.bar.top;
    // the carcass: dark planks front and back, set back under the top's overhang on the customers' side
    const front = woodTex(`barfront`, 512, 256, { base: "#5a3520", seed: 11, vertical: true, plank: 40, grain: 220 }).clone();
    front.needsUpdate = true; repeat(front, W / 1.28, 1);
    const carcass = wood("#ffffff", { map: front, roughness: 0.7 });
    const zf = -D / 2 + 0.08, zb = D / 2, Dc = zb - zf;
    mesh(new THREE.BoxGeometry(W, H - T, Dc), carcass, P.whole, 0, (H - T) / 2, (zf + zb) / 2);
    // a darker kickboard and a moulding under the top's lip
    mesh(new THREE.BoxGeometry(W + 0.004, 0.07, Dc + 0.012), wood(WOOD_DK, { roughness: 0.7 }), P.whole, 0, 0.035, (zf + zb) / 2);
    mesh(new THREE.BoxGeometry(W + 0.004, 0.03, 0.03), wood("#3a2214"), P.whole, 0, H - T - 0.015, zf - 0.012);
    mesh(new THREE.BoxGeometry(W + 0.004, 0.03, 0.03), wood("#3a2214"), P.whole, 0, H - T - 0.015, zb + 0.012);
    // raised battens on the customers' face so the front is not one flat board
    const batten = wood("#6a4024");
    for (let i = 0; i <= 8; i++) mesh(new THREE.BoxGeometry(0.035, H - T - 0.16, 0.012), batten, P.whole, -W / 2 + 0.06 + (i * (W - 0.12)) / 8, 0.08 + (H - T - 0.16) / 2 + 0.004, zf - 0.006);
    // the top: polished warm wood, grain along x
    const topTex = woodTex(`bartop:${W}`, 1024, 192, { base: "#7a4a28", seed: 5, grain: 260, light: "rgba(255,200,130,", dark: "rgba(60,25,8," });
    const topM = mat("#ffffff", { map: topTex, roughness: 0.26 }); topM.userData.lookRole = "wood";
    const zt0 = -D / 2 - 0.03, zt1 = D / 2 + 0.03;
    mesh(new THREE.BoxGeometry(W, T, zt1 - zt0), topM, P.whole, 0, H - T / 2, (zt0 + zt1) / 2);
    // the lighter edge: a rounded bullnose along the customers' side and a flat band at the two ends
    const edge = wood("#a56e3b", { roughness: 0.3 });
    const nose = mesh(new THREE.CylinderGeometry(T / 2, T / 2, W, 14), edge, P.whole, 0, H - T / 2, zt0 + T / 2); nose.rotation.z = Math.PI / 2;
    for (const s of [-1, 1]) mesh(new THREE.BoxGeometry(0.022, T, zt1 - zt0 - T), edge, P.whole, s * (W / 2 - 0.011), H - T / 2 + 0.0005, (zt0 + zt1) / 2 + T / 2);
    // the brass foot rail on the customers' side (-z), a tube along x on brackets back to the carcass
    const fr = PUB.bar.rail, rz = -D / 2 - 0.04;
    const rail = mesh(new THREE.CylinderGeometry(0.016, 0.016, W - 0.12, 16), brass(), P.whole, 0, fr.y, rz); rail.rotation.z = Math.PI / 2;
    for (const x of [-W / 2 + 0.06, -W / 4, 0, W / 4, W / 2 - 0.06]) {
      between(P.whole, brass({ roughness: 0.35 }), [x, fr.y, rz], [x, fr.y, zf - 0.006], 0.01, 0.01, 8);
      mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.012, 14), brass(), P.whole, x, fr.y, zf - 0.008).rotation.x = Math.PI / 2;
    }
    for (const s of [-1, 1]) mesh(new THREE.SphereGeometry(0.02, 12, 8), brass(), P.whole, s * (W / 2 - 0.06), fr.y, rz);
    return { grip: H };
  },

  pubstool(P) {
    const S = P.spec, R = S.r ?? PUB.stool.r, Hs = S.h ?? PUB.stool.seat, rl = PUB.stool.rail;
    const dark = wood(WOOD_DK, { roughness: 0.55 }), leather = mat(LEATHER, { roughness: 0.4 });
    const seatT = 0.075, y0 = Hs - seatT;
    // the seat: a domed, rounded leather cushion on a dark wood disc
    const cushion = cached("stoolcushion", () => {
      const prof = [[0, 0.012], [R - 0.012, 0.012], [R, 0.026], [R + 0.006, 0.045], [R - 0.002, 0.066], [R - 0.03, 0.073], [R * 0.5, 0.078], [0, 0.08]].map(([x, y]) => new THREE.Vector2(x, y));
      return new THREE.LatheGeometry(prof, 40);
    });
    mesh(cushion, leather, P.whole, 0, y0 - 0.005, 0);
    mesh(new THREE.CylinderGeometry(R * 0.93, R * 0.93, 0.03, 36), dark, P.whole, 0, y0 - 0.005 + 0.006, 0);
    mesh(new THREE.TorusGeometry(R + 0.002, 0.005, 6, 48), brass({ roughness: 0.35 }), P.whole, 0, y0 + 0.018, 0).rotation.x = Math.PI / 2;
    // four splayed legs, a brass foot ring a third of the way up
    const yTop = y0 - 0.005, top = R * 0.55, foot = R * 0.92, ang = [45, 135, 225, 315].map(rad);
    const legAt = (a, y) => { const k = y / yTop, r = foot + (top - foot) * k; return [r * Math.cos(a), y, r * Math.sin(a)]; };
    for (const a of ang) between(P.whole, dark, legAt(a, 0), legAt(a, yTop + 0.01), 0.02, 0.026, 10);
    const yR = 0.17, rR = foot + (top - foot) * (yR / yTop);
    const ring = mesh(new THREE.TorusGeometry(rR + 0.012, 0.011, 8, 40), brass(), P.whole, 0, yR, 0); ring.rotation.x = Math.PI / 2;
    for (const a of ang) between(P.whole, brass({ roughness: 0.35 }), legAt(a, yR), [(rR + 0.012) * Math.cos(a), yR, (rR + 0.012) * Math.sin(a)], 0.007, 0.007, 6);
    // the low back rail: a hoop behind the seat (-z), braced to the seat's rim
    const arc = rad(110), yRail = Hs + rl.y;
    const hoop = new THREE.TorusGeometry(rl.r, 0.015, 8, 24, arc); hoop.rotateZ(1.5 * Math.PI - arc / 2); hoop.rotateX(Math.PI / 2);
    mesh(hoop, dark, P.whole, 0, yRail, 0);
    for (const k of [-1, 0, 1]) {
      const a = 1.5 * Math.PI + k * (arc / 2 - 0.02), c = Math.cos(a), s = Math.sin(a);
      between(P.whole, dark, [(R - 0.05) * c, y0 + 0.01, (R - 0.05) * s], [rl.r * c, yRail, rl.r * s], 0.014, 0.014, 8);
    }
    for (const k of [-1, 1]) { const a = 1.5 * Math.PI + k * (arc / 2); mesh(new THREE.SphereGeometry(0.02, 10, 8), brass(), P.whole, rl.r * Math.cos(a), yRail, rl.r * Math.sin(a)); }
    return { grip: Hs };
  },

  tumbler(P) {
    const S = P.spec, H = PUB.tumbler.h, RT = 0.0345, RB = 0.027, BASE = 0.011;
    const glass = new THREE.MeshPhysicalMaterial({ color: "#f4fbff", roughness: 0.05, transparent: true, opacity: 0.32, depthWrite: false, clearcoat: 1, side: THREE.DoubleSide }); glass.userData.glass = true;
    const geo = cached("tumblergeo", () => new THREE.LatheGeometry([[0.001, 0], [RB, 0], [RB + 0.0012, 0.003], [RT, H], [RT - 0.0025, H], [RB - 0.0018, BASE + 0.001], [0.001, BASE]].map(([x, y]) => new THREE.Vector2(x, y)), 28));
    const sh = mesh(geo, glass, P.whole); sh.castShadow = false; sh.renderOrder = 3;
    // the lemonade: a tapered cylinder (unit height, rim radius 1) scaled to the level
    const juice = new THREE.MeshStandardMaterial({ color: "#e8901a", emissive: new THREE.Color("#7a3d00"), emissiveIntensity: 0.4, transparent: true, opacity: 0.95, roughness: 0.15, depthWrite: false }); juice.userData.liquid = true;
    const liqGeo = new THREE.CylinderGeometry(1, 1, 1, 24, 1, true);   // two rings of 25 vertices: the top (row 0) and the bottom (row 1), re-set per level
    const liqDir = Float32Array.from(liqGeo.attributes.position.array);
    const liq = mesh(liqGeo, juice, P.whole, 0, 0, 0); liq.renderOrder = 2; liq.castShadow = false; liq.frustumCulled = false;
    const surface = mesh(new THREE.CircleGeometry(1, 24), mat("#f3c05a", { roughness: 0.2, emissive: new THREE.Color("#a56a12"), emissiveIntensity: 0.3 }), P.whole, 0, BASE, 0);
    surface.rotation.x = -Math.PI / 2; surface.castShadow = false;
    const bubbleM = mat("#fff2c8", { roughness: 0.2, transparent: true, opacity: 0.75 });
    const bubbles = [[-0.011, 0.012, 0.004, 0.2], [0.008, 0.021, 0.0035, 0.35], [0.013, 0.008, 0.003, 0.5], [-0.004, 0.017, 0.0028, 0.62], [0.002, 0.026, 0.0032, 0.78], [-0.014, 0.004, 0.0026, 0.9]].map(([x, z, r, at]) => {
      const b = mesh(new THREE.SphereGeometry(r, 8, 6), bubbleM, P.whole, x, BASE + at * 0.07 + 0.004, z); b.castShadow = false; return { b, at };
    });
    // a lemon slice on the rim toward the camera
    if (S.lemon) {
      const lem = new THREE.Group(); lem.position.set(0, H - 0.002, RT + 0.001); lem.rotation.x = -0.3; P.whole.add(lem);
      const rind = mat("#f2c82c", { roughness: 0.5, emissive: new THREE.Color("#6b5208"), emissiveIntensity: 0.3 }), flesh = mat("#fbe9a0", { roughness: 0.5, emissive: new THREE.Color("#7a6a20"), emissiveIntensity: 0.25 });
      mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.005, 24), rind, lem).rotation.x = Math.PI / 2;
      mesh(new THREE.CylinderGeometry(0.0218, 0.0218, 0.0056, 24), flesh, lem).rotation.x = Math.PI / 2;
      for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2, s = mesh(new THREE.BoxGeometry(0.0014, 0.021, 0.0062), mat("#f7f1d4", { roughness: 0.6 }), lem, Math.cos(a) * 0.012, Math.sin(a) * 0.012, 0); s.rotation.z = a + Math.PI / 2; s.castShadow = false; }
    }
    // the lemonade is re-set to the level (its top ring and bottom ring; the surface disc and bubbles follow)
    const rIn = (yy) => RB - 0.0018 + (RT - 0.0025 - (RB - 0.0018)) * (yy / H) - 0.0004;
    let last = -1;
    const setLevel = (f) => {
      last = f;
      const y = BASE + f * 0.07, pos = liq.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) { const top = i < 25, rr = top ? rIn(y) : rIn(BASE); pos.setXYZ(i, liqDir[i * 3] * rr, top ? y : BASE, liqDir[i * 3 + 2] * rr); }
      pos.needsUpdate = true; liq.geometry.computeVertexNormals(); liq.geometry.computeBoundingSphere();
      surface.position.y = y; surface.scale.setScalar(rIn(y));
      for (const { b, at } of bubbles) b.visible = BASE + at * 0.07 + 0.004 < y - 0.003;
    };
    setLevel(0.001); liq.visible = surface.visible = false;
    return {
      grip: H / 2,
      apply(ps) {
        const f = clamp(ps.fill ?? 0);
        liq.visible = surface.visible = f > 0.005;
        if (liq.visible && f !== last) setLevel(f);
      },
    };
  },

  toiletdoor(P) {
    const S = P.spec, W = S.w ?? PUB.door.partW, H = S.h ?? PUB.door.partH, off = S.off ?? PUB.door.off, DW = S.dw ?? PUB.door.w, DH = S.dh ?? PUB.door.h, TH = 0.08;
    const WY = Math.min(0.55, DH * 0.5);   // the panelling's top edge
    const woodM = (c = WOOD) => wood(c), greenM = mat(GREEN, { roughness: 0.85 }); greenM.userData.lookRole = "wall";
    const panelTex = woodTex("doorpanel", 256, 256, { base: "#5a3520", seed: 21, vertical: true, plank: 36, grain: 120 });
    const panelM = wood("#ffffff", { map: panelTex, roughness: 0.65 });
    const x0 = off - W / 2, x1 = off + W / 2, dl = -DW / 2, dr = DW / 2, F = 0.05;   // the partition's ends and the door opening (frame outside it)
    // the partition: panelling below, green above; two side pieces and a lintel over the doorway
    const piece = (xa, xb, ya, yb, m) => mesh(new THREE.BoxGeometry(xb - xa, yb - ya, TH), m, P.whole, (xa + xb) / 2, (ya + yb) / 2, 0);
    for (const [xa, xb] of [[x0, dl - F], [dr + F, x1]]) { piece(xa, xb, 0, WY, panelM); piece(xa, xb, WY, H, greenM); }
    piece(dl - F, dr + F, DH + F, H, greenM);
    // a dark wood dado rail, a skirting board and a top cap along the whole partition
    const trim = woodM(WOOD_DK);
    mesh(new THREE.BoxGeometry(W, 0.035, TH + 0.03), trim, P.whole, off, WY + 0.0175, 0);
    mesh(new THREE.BoxGeometry(W, 0.06, TH + 0.015), trim, P.whole, off, 0.03, 0);
    mesh(new THREE.BoxGeometry(W + 0.02, 0.03, TH + 0.04), trim, P.whole, off, H + 0.015, 0);
    // the door frame: two stiles and a head, a little proud of the wall
    const frameM = woodM("#4a2a18");
    for (const s of [-1, 1]) mesh(new THREE.BoxGeometry(F, DH + F, TH + 0.03), frameM, P.whole, s * (DW / 2 + F / 2), (DH + F) / 2, 0);
    mesh(new THREE.BoxGeometry(DW + 2 * F, F, TH + 0.03), frameM, P.whole, 0, DH + F / 2, 0);
    // behind the doorway: a small tiled room in warm cream, lit from inside (basic materials: it glows)
    const room = new THREE.Group(); P.whole.add(room); room.visible = false;
    const tile = cached("pubtile", () => canvasTex(128, 128, (g, w, h) => {
      g.fillStyle = "#ffe9b2"; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { g.fillStyle = (i + j) % 2 ? "#fff0c6" : "#f7dc9c"; g.fillRect(i * 32 + 2, j * 32 + 2, 28, 28); }
      g.strokeStyle = "rgba(190,150,80,0.55)"; g.lineWidth = 2; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 32, 0); g.lineTo(i * 32, h); g.stroke(); g.beginPath(); g.moveTo(0, i * 32); g.lineTo(w, i * 32); g.stroke(); }
    }));
    const RD = 0.34;
    const wallM = (rx, ry) => { const m = basic({ map: repeat(tile.clone(), rx, ry), color: new THREE.Color(1.15, 1.05, 0.85) }); m.map.needsUpdate = true; return m; };
    const back = mesh(new THREE.PlaneGeometry(DW, DH), wallM(DW / 0.25, DH / 0.25), room, 0, DH / 2, -RD); back.castShadow = false;
    for (const s of [-1, 1]) { const w = mesh(new THREE.PlaneGeometry(RD, DH), wallM(RD / 0.25, DH / 0.25), room, s * DW / 2, DH / 2, -RD / 2); w.rotation.y = -s * Math.PI / 2; w.castShadow = false; }
    const fl = mesh(new THREE.PlaneGeometry(DW, RD), wallM(DW / 0.25, RD / 0.25), room, 0, 0.004, -RD / 2); fl.rotation.x = -Math.PI / 2; fl.castShadow = false;
    const ce = mesh(new THREE.PlaneGeometry(DW, RD), wallM(1, 1), room, 0, DH - 0.003, -RD / 2); ce.rotation.x = Math.PI / 2; ce.castShadow = false;
    for (const o of room.children) o.userData.solid = false;
    // the warm spill across the floor in front of the open door
    const spillTex = cached("pubspill", () => canvasTex(128, 128, (g, w, h) => { const gr = g.createRadialGradient(w / 2, 0, 0, w / 2, 0, h); gr.addColorStop(0, "rgba(255,214,140,0.85)"); gr.addColorStop(1, "rgba(255,214,140,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); }));
    const spill = mesh(new THREE.PlaneGeometry(DW * 1.5, 0.6), basic({ map: spillTex, transparent: true, opacity: 0.45, depthWrite: false, blending: THREE.AdditiveBlending }), P.whole, 0, 0.006, TH / 2 + 0.3);
    spill.rotation.x = -Math.PI / 2; spill.castShadow = false; spill.renderOrder = 2; spill.userData.steam = true; spill.visible = false;
    // the door leaf, hinged on its left edge (x = -DW/2), swinging toward +z
    const hinge = new THREE.Group(); hinge.position.set(dl, 0, TH / 2 - 0.02); P.whole.add(hinge);
    const LT = 0.04, lw = DW - 0.006, lh = DH - 0.004;
    const leafTex = woodTex("doorleaf", 256, 512, { base: "#5e3a22", seed: 31, vertical: true, plank: 32, grain: 150 });
    const leafM = wood("#ffffff", { map: leafTex, roughness: 0.6 });
    mesh(new THREE.BoxGeometry(lw, lh, LT), leafM, hinge, lw / 2 + 0.002, lh / 2, 0);
    const insetM = wood("#6e4528", { roughness: 0.55 });
    for (const [y, h] of [[DH * 0.27, DH * 0.34], [DH * 0.74, DH * 0.34]]) mesh(new THREE.BoxGeometry(lw - 0.1, h, 0.012), insetM, hinge, lw / 2, y, LT / 2 + 0.005);
    // the two-figure pictogram on a brass-framed plaque
    const pic = cached("pubpicto", () => canvasTex(128, 128, (g, w, h) => {
      g.fillStyle = "#2b1a0e"; g.fillRect(0, 0, w, h);
      g.fillStyle = "#e0b968"; g.strokeStyle = "#e0b968"; g.lineCap = "round"; g.lineWidth = 7;
      // a man: head, a block body, two legs
      g.beginPath(); g.arc(40, 34, 11, 0, Math.PI * 2); g.fill();
      g.fillRect(27, 50, 26, 30); g.beginPath(); g.moveTo(34, 82); g.lineTo(34, 112); g.moveTo(46, 82); g.lineTo(46, 112); g.stroke();
      // a woman: head, a triangle dress, two legs
      g.beginPath(); g.arc(88, 34, 11, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.moveTo(88, 50); g.lineTo(106, 90); g.lineTo(70, 90); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(83, 92); g.lineTo(83, 112); g.moveTo(93, 92); g.lineTo(93, 112); g.stroke();
      g.lineWidth = 2.5; g.beginPath(); g.moveTo(64, 20); g.lineTo(64, 116); g.stroke();
    }));
    const pz = LT / 2 + 0.011, py = DH * 0.78, pxc = lw / 2;
    mesh(new THREE.BoxGeometry(0.2, 0.2, 0.01), brass(), hinge, pxc, py, pz - 0.003);
    const plaque = mesh(new THREE.PlaneGeometry(0.17, 0.17), basic({ map: pic, color: new THREE.Color(0.9, 0.85, 0.75) }), hinge, pxc, py, pz + 0.0035); plaque.castShadow = false;
    // the brass push plate near the free edge, and a small brass knob under it
    mesh(new THREE.BoxGeometry(0.065, 0.2, 0.006), brass({ roughness: 0.25 }), hinge, lw - 0.06, DH * 0.47, LT / 2 + 0.004);
    mesh(new THREE.SphereGeometry(0.018, 12, 8), brass(), hinge, lw - 0.06, DH * 0.47 - 0.14, LT / 2 + 0.016);
    // two small brass hinges on the left edge
    for (const y of [0.18, DH - 0.18]) mesh(new THREE.BoxGeometry(0.03, 0.09, 0.012), brass(), hinge, 0.012, y, LT / 2 + 0.003);
    // the lamp above the door: a brass housing and a lit lens (red / green), with a soft halo
    const ly = DH + F + (H - DH - F) * 0.5 + 0.0, lamp = new THREE.Group(); lamp.position.set(0, Math.min(ly, DH + 0.2), TH / 2 + 0.015); P.whole.add(lamp);
    mesh(new RoundedBoxGeometry(0.2, 0.085, 0.04, 3, 0.015), brass({ roughness: 0.35 }), lamp);
    const lensM = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.7, 0.05, 0.04), toneMapped: false }); lensM.userData.noOutline = true; lensM.userData.noHatch = true;
    const lens = mesh(new THREE.SphereGeometry(0.05, 18, 12), lensM, lamp, 0, 0, 0.012); lens.scale.set(1.5, 0.62, 0.35); lens.castShadow = false;
    const glow = halo(lamp, "#ff2a1a", 0, 0.05);
    const RED = new THREE.Color(1.7, 0.05, 0.04), GRN = new THREE.Color(0.25, 1.7, 0.4);
    return {
      grip: 0,
      apply(ps) {
        const o = clamp(ps.open ?? 0, 0, 100);
        hinge.rotation.y = -rad(o);
        room.visible = o > 0.5; spill.visible = o > 0.5; spill.material.opacity = 0.45 * smooth(clamp(o / 50));
        const green = (ps.lamp ?? S.lamp ?? 0) >= 0.5;
        lensM.color.copy(green ? GRN : RED); glow.material.uniforms.uC.value.set(green ? "#35ff70" : "#ff2a1a"); glow.material.uniforms.uA.value = 0.9; glow.material.uniforms.uR.value = 0.2;
      },
    };
  },

  pubreader(P) {
    const S = P.spec, text = S.text ?? "84.00", { w, d, base } = PUB.reader;
    const shell = mat("#24262c", { roughness: 0.4 });
    mesh(new RoundedBoxGeometry(w, base, d, 3, 0.01), shell, P.whole, 0, base / 2, 0);
    // the screen head: leaning back, its face toward +z, 55 degrees up from flat
    const head = new THREE.Group(); head.position.set(0, base - 0.004, -d * 0.28); head.rotation.x = -rad(35); P.whole.add(head);
    const hh = 0.1;
    mesh(new RoundedBoxGeometry(w, hh, 0.024, 3, 0.008), shell, head, 0, hh / 2, 0);
    const tex = cached(`readerscreen:${text}`, () => canvasTex(256, 128, (g, cw, ch) => {
      g.fillStyle = "#04222c"; g.fillRect(0, 0, cw, ch);
      g.strokeStyle = "rgba(60,200,230,0.12)"; g.lineWidth = 1; for (let y = 8; y < ch; y += 8) { g.beginPath(); g.moveTo(0, y); g.lineTo(cw, y); g.stroke(); }
      g.font = "800 78px 'Courier New', monospace"; g.textAlign = "center"; g.textBaseline = "middle";
      g.shadowColor = "#00d8ff"; g.shadowBlur = 16; g.fillStyle = "#74f0ff"; g.fillText(text, cw / 2, ch / 2 + 4);
      g.shadowBlur = 0; g.fillText(text, cw / 2, ch / 2 + 4);
    }));
    const scrM = basic({ map: tex, color: new THREE.Color(1.6, 1.6, 1.6), toneMapped: false });
    const bez = mesh(new THREE.PlaneGeometry(w - 0.012, hh - 0.014), basic({ color: 0x0a0b0e }), head, 0, hh / 2, 0.0125); bez.castShadow = false;
    const scr = mesh(new THREE.PlaneGeometry(w - 0.024, (w - 0.024) / 2), scrM, head, 0, hh * 0.56, 0.0128); scr.castShadow = false;
    // keypad on the base's front half: a 4 x 3 grid, the bottom row red / yellow / green
    const keyM = mat("#cfd2d8", { roughness: 0.5 });
    const kx = 0.022, kz = 0.017, k0z = d * 0.5 - 0.028 - 3 * kz;
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) {
      const c = i === 3 ? ["#d23a32", "#e5b523", "#3aa655"][j] : null;
      mesh(new RoundedBoxGeometry(0.019, 0.006, 0.013, 2, 0.002), c ? mat(c, { roughness: 0.5 }) : keyM, P.whole, (j - 1) * kx, base + 0.002, k0z + i * kz).castShadow = false;
    }
    return { grip: base };
  },

  bartowel(P) {
    const S = P.spec, x0 = S.x ?? PUB.towel.x, Lf = S.front ?? 0.22, Lb = S.back ?? 0.26, HW = 0.065, off = 0.022;
    const tex = cached("towel", () => canvasTex(64, 128, (g, w, h) => {
      g.fillStyle = "#fbfaf6"; g.fillRect(0, 0, w, h);
      g.fillStyle = "#8fb0dc"; for (const y of [8, 15, h - 16, h - 9]) g.fillRect(0, y, w, 3);
      g.strokeStyle = "rgba(150,150,160,0.18)"; g.lineWidth = 1; for (let x = 6; x < w; x += 6) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
    }));
    // a strip over the shoulder: v runs from the front hem up over the top and down the back, hugging the egg-shaped body
    const geo = sheet(6, 24, (u, v) => {
      const x = x0 + (u - 0.5) * 2 * HW, ry = 0.52, sx = Math.sqrt(Math.max(0.05, 1 - (x / 0.4) ** 2));
      const hem = 1 + 0.06 * Math.sin(u * 9 + 1);
      const phiF = rad(60 + Lf * 90 * hem), phiB = rad(-(Lb * 120 * hem)), phi = lerp(phiF, phiB, v);   // angle from the top, + toward the front
      const az = ry * sx + off, bz = 0.36 * sx + off;
      const fold = 0.006 * Math.sin(v * 17 + u * 4) * Math.sin(Math.PI * v);
      return [x + fold * 0.4, 0.5 + az * Math.cos(phi), bz * Math.sin(phi) + fold];
    });
    const m = mat("#ffffff", { map: tex, roughness: 0.92, side: THREE.DoubleSide });
    mesh(geo, m, P.whole).castShadow = false;
    return { grip: 0 };
  },

  pubcoat(P) {
    const S = P.spec, C = S.color ?? PUB.coat.reaper, mode = S.mode ?? (S.wear ? "worn" : "drape");
    const cloth = mat(C, { roughness: 0.92, side: THREE.DoubleSide });
    const darker = mat(new THREE.Color(C).multiplyScalar(0.72), { roughness: 0.92, side: THREE.DoubleSide });
    const lighter = mat(new THREE.Color(C).multiplyScalar(1.3), { roughness: 0.9, side: THREE.DoubleSide });
    const scarfM = S.scarf ? mat(S.scarf, { roughness: 0.95, side: THREE.DoubleSide }) : null;
    if (mode === "drape") {
      // folded over the rail: a long panel behind it (-z), a short one in front, one sleeve hanging at the right
      const Wd = 0.46, rho = 0.024, Lf = 0.2, Lb = 0.52, arcL = Math.PI * rho;
      const cover = (width, Lfront, Lback, x0, m) => {
        const total = Lfront + arcL + Lback;
        return mesh(sheet(10, 20, (u, v) => {
          const s = v * total, x = x0 + (u - 0.5) * width, hemK = 1 + 0.1 * Math.sin(x * 23 + 1.3) + 0.05 * Math.sin(x * 51);
          let y, z;
          if (s < Lfront) { const d = (Lfront - s) * hemK; y = -d; z = rho + 0.005 + 0.02 * (d / Lfront) * (d / Lfront) + 0.008 * Math.sin(x * 40 + d * 9) * (d / Lfront); }
          else if (s < Lfront + arcL) { const a = ((s - Lfront) / arcL) * Math.PI; y = (rho + 0.005) * Math.sin(a); z = (rho + 0.005) * Math.cos(a); }
          else { const d = (s - Lfront - arcL) * (1 + (hemK - 1) * ((s - Lfront - arcL) / Lback)); y = -d; z = -(rho + 0.005) - 0.012 * (d / Lback) - 0.01 * Math.sin(x * 34 + d * 7) * (d / Lback); }
          return [x, y, z];
        }), m, P.whole);
      };
      cover(Wd, Lf, Lb, 0, cloth).castShadow = true;
      // the lining shows at the front panel's hem, the collar sticks out at one end
      const sl = mesh(new THREE.CapsuleGeometry(0.042, 0.34, 4, 10), darker, P.whole, Wd / 2 + 0.01, -0.3, -(rho + 0.05)); sl.rotation.z = -0.07;
      mesh(new THREE.CapsuleGeometry(0.036, 0.05, 4, 8), lighter, P.whole, Wd / 2 + 0.02, -0.5, -(rho + 0.05));
      if (scarfM) {
        mesh(sheet(3, 16, (u, v) => { const s = v * (0.2 + 0.4 + 0.07), x = -0.1 + (u - 0.5) * 0.07; return s < 0.2 ? [x, -(0.2 - s), rho + 0.012 + 0.012 * s] : s < 0.27 ? [x, (rho + 0.012) * Math.sin(((s - 0.2) / 0.07) * Math.PI), (rho + 0.012) * Math.cos(((s - 0.2) / 0.07) * Math.PI)] : [x, -(s - 0.27), -(rho + 0.012) - 0.01]; }), scarfM, P.whole).castShadow = false;
      }
      return { grip: 0 };
    }
    // worn: the shell follows the body's egg outline, a little proud of it; armholes at the sides, the front open
    const OFF = 0.14, flare = (y) => 0.26 * smooth(clamp((0.36 - y) / 0.24)), collar = (y) => 0.1 * smooth(clamp((y - 0.7) / 0.18));
    const piece = (a0, a1, y0, y1, m, extra = 0, nu = 8, nv = 16) => mesh(sheet(nu, nv, (u, v) => {
      const th = lerp(a0, a1, u), yy = lerp(y0, y1, v), [hx, hz] = bodyHalf(yy), r = OFF + extra + flare(yy) + collar(yy);
      const ruff = 0.004 * Math.sin(th * 9 + yy * 14);
      return [(hx + r + ruff) * Math.sin(th), yy, (hz + r + ruff) * Math.cos(th)];
    }), m, P.whole);
    piece(rad(112), rad(248), 0.12, 0.93, cloth, 0, 14, 18);                    // the back and the standing collar
    for (const s of [-1, 1]) {
      piece(s * rad(34), s * rad(68), 0.12, 0.76, cloth, 0, 5, 14);         // a front flap each side
      piece(s * rad(34), s * rad(41), 0.12, 0.76, lighter, 0.006, 2, 14);       // its lapel edge
      piece(s * rad(68), s * rad(112), 0.12, 0.21, darker, -0.02, 5, 3);        // the side hem below the armhole
    }
    // buttons down the right flap
    for (const y of [0.3, 0.45, 0.6]) { const [hx, hz] = bodyHalf(y), r = OFF + 0.012 + flare(y), th = rad(48); mesh(new THREE.SphereGeometry(0.014, 10, 8), mat("#1c1c20", { roughness: 0.4 }), P.whole, (hx + r) * Math.sin(th), y, (hz + r) * Math.cos(th)).castShadow = false; }
    if (scarfM) {
      // a wrapped scarf at the chest and two tails down the front, like the wrapscarf prop
      const yS = 0.47, [hx, hz] = bodyHalf(yS), ring = new THREE.TorusGeometry(1, 0.042, 10, 40); ring.rotateX(Math.PI / 2);
      const p = ring.attributes.position; for (let i = 0; i < p.count; i++) p.setXYZ(i, p.getX(i) * (hx + 0.052), p.getY(i) - 0.03 * Math.max(0, p.getZ(i)), p.getZ(i) * (hz + 0.052));
      ring.computeVertexNormals();
      mesh(ring, scarfM, P.whole, 0, yS, 0);
      for (const [dx, len, sw] of [[-0.03, 0.2, -0.1], [0.04, 0.15, 0.08]]) {
        const tail = new THREE.BoxGeometry(0.07, len, 0.02, 2, 6, 1); tail.translate(0, -len / 2, 0);
        const o = mesh(tail, scarfM, P.whole, hx * 0.45 + dx, yS - 0.04, hz + 0.075); o.rotation.z = sw; o.castShadow = false;
      }
    }
    return { grip: 0 };
  },
};
