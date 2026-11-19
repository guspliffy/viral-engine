import * as THREE from "three";
import { rng } from "./util.js";
import { canvas, tex } from "./set-porch.js";

// "gravroom": fact what-if 02 "What if gravity got stronger every five seconds?" (19 Nov 2026): the high-floor living room at
// golden dusk (storyboards/series/facts/02-gravity/DESIGN.md §1). Props that live in it: props-gravroom.js (gsofa, gtv, glamp,
// gplant, grug, gtunnel, ghaze). The city, sky, Moon, clouds and satellites are other props (props-gravcity.js, props-gravsky.js).
//
// spec: { type: "gravroom", bare: false }
//   bare  false (default): the room, the lights and the background. true: ONLY the lights and the sky-less background (no wall,
//         floor, ceiling, window frame or glass), so the outside can be benched through where the window would be.
// The storyboard asks for "far": 6000 (the outside is kilometres away), near stays at its default.
//
// WORLD (metres, x right, +z toward the camera, camera A looks down -z):
//   room        x -2.10..2.10, z -2.65..3.45 (no front wall: no camera looks that way), y 0..3.55. Back wall at z -2.65.
//   window      the opening x -1.95..1.95, y .09..3.43 in the back wall: two opaque jambs (x +-1.95 .. +-1.877, .073 wide), 4 mullions
//               (centres x -1.69 / -.48 / .94 / 1.69, widths .043 / .060 / .054 / .043, depth .065), a head and a sill (.080 tall),
//               all #2C2426, no crossbar; a glass pane at z -2.68 (#BCCDE3, opacity .05, see-through, not solid). Everything beyond
//               z -2.65 (the city, the sky) is another builder's: nothing here draws past the pane.
//   colours     back wall piers + head #9F715C, side walls #AF8067, ceiling #A47661, floor #79513D (boards .15-.22 m along z, seams
//               #4B332A .002 m, seeded 26031), baseboards #694638 .075 m tall.
//   lights      all inside the set's own group (the look's relight keeps them): the key (#FFB479, 2.10, shadows, rays travel
//               (-.58,-.40,+.71) into the room, so it is the FIRST directional light the toon ramp reads), the hemisphere fill (.74,
//               sky #90A7D8, ground #60463E), the warm floor bounce (#E6A06B, .15 x key, from below, no shadow) and the lamp point
//               (#FFD19A at (1.16,1.94,-2.12), range 3.2, decay 2). The design's 110 cd is a physical number that burns out in
//               this engine's unit-less lights: LAMP_I below is the same light in engine units (tuned on the bench stills).
// Layout constants are exported so the props and the generators line up with the room.
export const GRAVROOM = {
  x0: -2.10, x1: 2.10, wallZ: -2.65, frontZ: 3.45, h: 3.55, win: { x0: -1.95, x1: 1.95, y0: 0.09, y1: 3.43 },
  sofa: [0.20, -1.61], tv: [-1.52, -0.99, 34], lamp: [1.45, -2.12], plant: [1.80, -1.60], rug: [0.18, 0.11],
  lampLight: [1.16, 1.94, -2.12], keyRay: [-0.58, -0.40, 0.71],
};
const LAMP_I = 2.6;   // the lamp point's intensity in engine units (design: 110 cd)

const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...o });
function box(parent, w, h, d, m, x, y, z, shadow = true) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = shadow; b.receiveShadow = true; parent.add(b); return b; }

// floor boards .15-.22 m wide along z, each a little different in tone, thin dark seams, staggered end joints, a little grain
function floorTex(W, D) {
  const PX = 480, cw = Math.round(W * PX), ch = Math.round(D * PX * 0.7), [c, g] = canvas(cw, ch), rnd = rng(26031);
  g.fillStyle = "#79513D"; g.fillRect(0, 0, cw, ch);
  let x = 0;
  while (x < cw) {
    const bw = Math.round((0.15 + rnd() * 0.07) * PX), tone = 0.93 + rnd() * 0.14;
    // the board is cut into lengths 1.2-2.6 m (end joints), each length a slightly different tone
    let y = -Math.round(rnd() * 1.2 * PX * 0.7);
    while (y < ch) {
      const len = Math.round((1.2 + rnd() * 1.4) * PX * 0.7), t2 = tone * (0.97 + rnd() * 0.06);
      g.fillStyle = `rgb(${Math.round(121 * t2)},${Math.round(81 * t2)},${Math.round(61 * t2)})`; g.fillRect(x, y, bw, len);
      g.strokeStyle = "rgba(60,36,24,0.16)"; g.lineWidth = 1;
      for (let k = 0; k < 4; k++) { const gx = x + 4 + rnd() * (bw - 8); g.beginPath(); g.moveTo(gx, y); g.bezierCurveTo(gx + 3, y + len * 0.3, gx - 3, y + len * 0.6, gx + 1, y + len); g.stroke(); }
      g.fillStyle = "#4B332A"; g.fillRect(x, y, bw, 1);   // the end joint
      y += len;
    }
    g.fillStyle = "#4B332A"; g.fillRect(x, 0, 1, ch);   // the seam (about .002 m)
    x += bw;
  }
  const t = tex(c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t;
}

// the warm sheen the dusk window light lays on a glossy floor (the target image's orange streaks): an emissive map, brightest at the
// window and fading toward the camera, in slanted bands (the key travels toward -x), plus a soft pool by the lamp. Canvas top = the back wall.
function sheenTex(W, D) {
  const cw = 256, ch = 512, [c, g] = canvas(cw, ch), X = (x) => ((x - -W / 2) / W) * cw, Z = (z) => ((z - (GRAVROOM.wallZ - 0.12)) / D) * ch;
  g.fillStyle = "#333333"; g.fillRect(0, 0, cw, ch);
  const fade = g.createLinearGradient(0, 0, 0, ch); fade.addColorStop(0, "rgba(255,255,255,0.95)"); fade.addColorStop(0.5, "rgba(255,255,255,0.62)"); fade.addColorStop(1, "rgba(255,255,255,0.32)");
  g.filter = "blur(5px)";
  for (const [a, b] of [[-1.86, -1.72], [-1.66, -0.52], [-0.44, 0.90], [0.98, 1.65], [1.73, 1.9]]) {
    const sl = -0.42;   // x shift per metre toward the camera
    g.save(); g.beginPath(); g.moveTo(X(a), Z(-2.6)); g.lineTo(X(b), Z(-2.6)); g.lineTo(X(b + sl * 5.6), Z(3.0)); g.lineTo(X(a + sl * 5.6), Z(3.0)); g.closePath(); g.clip();
    g.fillStyle = fade; g.fillRect(0, 0, cw, ch); g.restore();
  }
  const [lx, lz] = GRAVROOM.lamp, pool = g.createRadialGradient(X(lx - 0.2), Z(lz + 0.5), 2, X(lx - 0.2), Z(lz + 0.5), 60); pool.addColorStop(0, "rgba(255,255,255,0.5)"); pool.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = pool; g.fillRect(0, 0, cw, ch);
  g.filter = "none";
  const t = tex(c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t;
}

function buildLights(g) {
  const k = GRAVROOM.keyRay, dir = new THREE.Vector3(k[0], k[1], k[2]).normalize(), target = new THREE.Vector3(0, 0.8, 0.3);
  const key = new THREE.DirectionalLight("#FFB479", 2.1);
  key.name = "gravroom-key"; key.position.copy(target).addScaledVector(dir, -9);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02; key.shadow.radius = 4;
  Object.assign(key.shadow.camera, { left: -4.4, right: 4.4, top: 4.4, bottom: -4.4, near: 1, far: 18 });
  key.target.position.copy(target); g.add(key); g.add(key.target);
  const hemi = new THREE.HemisphereLight("#90A7D8", "#60463E", 0.74); hemi.name = "gravroom-fill"; g.add(hemi);
  const bounce = new THREE.DirectionalLight("#E6A06B", 0.15 * 2.1); bounce.name = "gravroom-bounce"; bounce.position.set(0.3, -6, -1.5); bounce.target.position.set(0, 0, 0); bounce.castShadow = false; g.add(bounce); g.add(bounce.target);
  const lamp = new THREE.PointLight("#FFD19A", LAMP_I, 3.2, 2); lamp.name = "gravroom-lamp"; lamp.position.set(...GRAVROOM.lampLight); lamp.castShadow = false; g.add(lamp);
}

export function buildGravroom(scene, S = {}) {
  const g = new THREE.Group(); g.name = "gravroom"; scene.add(g);
  scene.background = new THREE.Color("#6c5a7c");   // a dusk violet where no sky is built (the sky is another builder's)
  buildLights(g);
  if (S.bare) return g;

  const R = GRAVROOM, win = R.win, WZ = R.wallZ, Z0 = WZ - 0.12, Zlen = R.frontZ - Z0, Zc = (R.frontZ + Z0) / 2, W = R.x1 - R.x0;
  const piers = std("#9F715C"), sideM = std("#AF8067"), ceilM = std("#A47661"), frame = std("#2C2426", { roughness: 0.55 }), base = std("#694638", { roughness: 0.6 });

  // floor
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, Zlen), std("#ffffff", { map: floorTex(W, Zlen), roughness: 0.42, emissive: "#FF9C58", emissiveMap: sheenTex(W, Zlen), emissiveIntensity: 0.8 }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, Zc); floor.receiveShadow = true; g.add(floor);
  // ceiling and side walls (thick boxes on the outside of the room, so they cast and take shadow)
  box(g, W + 0.2, 0.1, Zlen, ceilM, 0, R.h + 0.05, Zc);
  for (const s of [-1, 1]) box(g, 0.1, R.h, Zlen, sideM, s * (R.x1 + 0.05), R.h / 2, Zc);
  // back wall: two piers beside the window, the head above and the strip below it (.12 deep, so the opening has a reveal)
  const pw = R.x1 - win.x1;
  for (const s of [-1, 1]) box(g, pw, R.h, 0.12, piers, s * (win.x1 + pw / 2), R.h / 2, WZ - 0.06);
  box(g, win.x1 - win.x0, R.h - win.y1, 0.12, piers, 0, (win.y1 + R.h) / 2, WZ - 0.06);
  box(g, win.x1 - win.x0, win.y0, 0.12, piers, 0, win.y0 / 2, WZ - 0.06);
  // window frame: jambs, head, sill, four mullions (no crossbar), centred on the wall plane
  const wh = win.y1 - win.y0, wy = (win.y0 + win.y1) / 2, D = 0.065;
  for (const s of [-1, 1]) box(g, 0.073, wh, D, frame, s * (win.x1 - 0.0365), wy, WZ);
  box(g, win.x1 - win.x0, 0.08, D, frame, 0, win.y1 - 0.04, WZ);
  box(g, win.x1 - win.x0, 0.08, D + 0.03, frame, 0, win.y0 + 0.04, WZ + 0.015);
  for (const [x, w] of [[-1.69, 0.043], [-0.48, 0.060], [0.94, 0.054], [1.69, 0.043]]) box(g, w, wh - 0.16, D, frame, x, wy, WZ);
  // the glass: very faint tint, see-through (the 3D city and sky are outside it)
  const gm = new THREE.MeshBasicMaterial({ color: "#BCCDE3", transparent: true, opacity: 0.05, depthWrite: false, fog: false });
  gm.userData.noOutline = true; gm.userData.glass = true; gm.userData.solid = false;
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(win.x1 - win.x0, wh), gm); glass.position.set(0, wy, WZ - 0.03); glass.renderOrder = 3; glass.userData.steam = true; g.add(glass);
  // baseboards
  const bt = 0.02, bh = 0.075;
  box(g, W, bh, bt, base, 0, bh / 2, WZ + bt / 2, false);
  for (const s of [-1, 1]) box(g, bt, bh, R.frontZ - WZ, base, s * (R.x1 - bt / 2), bh / 2, (R.frontZ + WZ) / 2, false);
  return g;
}
