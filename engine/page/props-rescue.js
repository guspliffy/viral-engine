import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { clamp } from "./util.js";

// There's a catch, episode 7 "time travel" (Nov 2026), task T3: the first catch shown big. Wedge yanks the cable of a TV
// camera crane and its boom comes down on the front row (panel 04), medics carry Chip into an ambulance under blue light
// in the rain (panel 05), a starter fires the starting pistol (panel 02). Metres, origin bottom centre unless said, a
// prop faces +z at rot 0, ghost = see-through and not solid for the checks (userData.steam + userData.solid false).
// Everything is a pure function of the params and t (seeded hash, no Math.random, no wall clock).
// PARAMS arrive as prop tweens (`set`). props3d.js propState has a default only for the keys it lists. Listed (tween
// smoothly, no seeding): `fall` (0), `fire` (0). NOT listed (read spec.<name> or the default below until a tween sets them,
// and the first tween of such a key JUMPS: seed them with a dur-0 `set` at time 0): swing, boom, yank, tally, doors, siren,
// wet, clock, blanket, walk, sway, lug. Two names the brief used collide with propState, so DO NOT use them as params:
//   `drop` (propState makes it spec.drop ?? 0) and `pull` (spec.pull ?? 0) are only read from the SPEC here (never from ps);
//   `carry` (propState: the carried-by link, a tween of it would move the medic to 0,0,0) is called `lug` on the medic.
//
//   tvcrane    a broadcast camera crane on the apron, origin bottom centre of its dolly (x 0, z 0, y 0); the boom points +x at
//              swing 0 (toward the finish line), the dolly's front is +z. Parts: a 4-wheel dolly 1.3 (x) x 0.9 (z) x 0.2 (top
//              at y 0.4, wheels r 0.17), a dark column 1.5 high (y 0.4..1.9, 0.4 square) with a turntable on top, the boom's
//              hinge axis at y 2.05, a black lattice boom spec.len long (taper 0.44 -> 0.2 high) with a yellow-and-grey
//              counterweight box 1.2 behind the pivot (0.8 x 0.6 x 0.62), a gimbal head at the boom's tip: a big grey-blue TV
//              camera (lens, black hood, finder, red tally light) hanging 0.45 below the tip, lens toward +x (the boom's
//              direction); the head's middle is the boom tip, the camera's middle is 0.5 under it. A thick cable (r 0.04,
//              ghost): from the camera head under the boom to the turntable, down the column's +z side to the dolly, then along
//              the ground to its free end at spec.cableEnd.
//              Spec: len 5.5, cableColor "#3a3f52", cableR 0.04, cableEnd [-2, 0, 0.3] (the free end at rest, relative to the origin), pull [-1.5, 0.55, 0.9] (where
//              the yanked end is: relative to the origin, NOT rotated by swing; the cable's tail does not follow swing), drop 40
//              (the final pitch of the fallen boom, degrees down), land 1.0 (the head's height when it has landed).
//              Params: swing 0 (deg yaw of the boom, + turns the tip toward -z, the stands), boom 18 (deg pitch, + up), yank 0..1
//              (the cable's free end lifts from the ground to spec.pull and the cable pulls taut), fall 0..1 (default 0: the
//              boom snaps at the pivot: the pitch eases from `boom` to -spec.drop, the boom's hinge end lifts off the column
//              as the tip drops (a see-saw: the counterweight swings UP), ending with the head at y spec.land, spec.len out
//              (horizontally len x cos(drop) = 4.2 for len 5.5, drop 40); a torn stub shows on the column), tally 0..1 (red
//              light and its glow). NOTE: a 1.5 m column cannot lower a 5.5 m boom below -12 degrees without the hinge end lifting,
//              so the fall is a lever: give spec.drop 12 for a boom that stays on the column. Boom, column, dolly SOLID.
//              Grip "cable" (RESCUE_GRIPS.tvcrane.cable = [-1.5, 0.55, 0.9], spec.pull at its default): a glove closes round the
//              cable there at yank 1; for another spec.pull pass the point itself ({ prop, grip: [x, y, z] }). Hold: fist.
//   ambulance  a white rounded box ambulance at potato scale, 4.6 long (z -2.3 cab .. +2.3 rear), 2.0 wide, 2.3 high; origin
//              bottom centre; the rear doors are on the +z end at rot 0, the cab at -z. Red and yellow chequered bands (painted
//              squares, two rows) along both sides and across the rear doors, a blue light bar on the cab roof (two domes), two
//              blue corner lights on the rear roof edge, a hollow lit box inside (floor y 0.5, rail y 0.75, ceiling 2.1) with an
//              opening 1.8 wide, y 0.55..2.05 (a stretcher fits: 0.55 x 1.5).
//              Params: doors 0..1 (both rear doors swing out 100 degrees, the lit interior and two stretcher rails show),
//              siren 0..1 (the lights flash alternately, 2.5 Hz, left and right, from `clock`, falling back to the clip time;
//              a soft additive blue wash on the ground r 4.5 round it, brighter on the lit side; the wash is a ghost),
//              wet 0..1 (rain beads on the roof, hood and sides, and a gloss), clock (seconds). Body and doors SOLID, lights,
//              beads and wash ghost.
//   stretcher  a wheeled ambulance stretcher, 1.5 long overall (x, handle bar to handle bar), 0.55 wide (z), mattress top y 0.65,
//              origin on the ground at the middle of its footprint (x 0, z 0; the four wheels are at x +-0.52, z +-0.2).
//              Orange-red frame, navy vinyl mattress (1.4 x 0.5, 0.1 thick, its top is y 0.65, centre [0, 0.65, 0]), grey
//              blanket, two straps, a raised head end (-x) and a foot end (+x). Params: blanket 0..1 (default spec.blanket 0: the
//              blanket lies folded at the foot, 0.55 long; 1 it is pulled up to the chest, over 1.05 of the mattress).
//              A lying potato goes on it with its middle at [0, 0.65, 0]. Grips (RESCUE_GRIPS.stretcher): "head" [-0.75, 0.78, 0] and
//              "foot" [0.75, 0.78, 0], the middle of the bar handles at both ends (the bars run along z, 0.5 long). SIZE.stretcher in
//              storyboards/lib/grips.mjs puts grips.box (both palms on the two ends) on them. Solid.
//   medic      a potato paramedic extra (casinoguest's build, h 0.9): golden skin, dot eyes, blush, small smile; a white jacket
//              with a blue cross patch on the chest, a yellow-green reflective ring, a white cap with a blue cross patch, dark
//              navy trousers and two small dark feet. Origin between the feet on the ground, faces +z at rot 0.
//              Spec: h 0.9 (the head's top), id (the body's lumps). Params: walk (metres walked, 0: feet step, arms swing,
//              stride 0.28, as streetpotato), sway 0..1 (an idle 3 degree sway), lug 0..1 (both small arms forward and up and a little
//              in, the hands at y 0.72, 0.24 in front of the body and 0.24 either side of its middle, round a bar at that height; arms stay still while walking).
//              Ghost (the director parents him to the stretcher's ends).
//   starter    a potato race official extra (h 0.95): navy blazer with two columns of gold buttons, a gold badge, a white peaked
//              cap with a dark band and a gold badge, grey trousers; his right arm (-x side, seen from the front) straight up
//              holding a black starting pistol, its muzzle about 1.1 m above the ground (flash and smoke start there). Origin between the feet, faces +z.
//              Params: fire 0..1 (propState default 0; 0 nothing, 0..0.1 a muzzle flash, then a white smoke puff rises 0.6 m and
//              fades out by 1), sway 0..1. Ghost.
export const RESCUE_GRIPS = {
  tvcrane: { cable: [-1.5, 0.55, 0.9] },
  stretcher: { head: [-0.75, 0.78, 0], foot: [0.75, 0.78, 0] },
};
export const RESCUE = {
  crane: { len: 5.5, axisY: 2.05, cableEnd: [-2, 0, 0.3], pull: [-1.5, 0.55, 0.9], drop: 40, land: 1.0 },
  ambulance: { l: 4.6, w: 2.0, h: 2.3 },
  stretcher: { top: 0.65, centre: [0, 0.65, 0], l: 1.5, w: 0.55 },
};

// ------------------------------------------------------------------------------------------------ small things
const TAU = Math.PI * 2;
const DEG = Math.PI / 180;
const hs = (i, k = 0) => { const x = Math.sin(i * 127.1 + k * 311.7 + 17.3) * 43758.5453; return x - Math.floor(x); };
const strHash = (s) => [...String(s)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 9973, 7);
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const cvs = (w, h, draw) => { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); return c; };
const tex = (c) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...o });
const bas = (o = {}) => { const m = new THREE.MeshBasicMaterial({ fog: false, toneMapped: false, ...o }); m.userData.noOutline = true; return m; };
const ghost = (o, order = 0) => { o.frustumCulled = false; o.renderOrder = order; o.castShadow = false; o.receiveShadow = false; o.userData.steam = true; o.userData.solid = false; return o; };
const ghostAll = (g, order = 0) => { g.traverse((o) => { if (o.isMesh || o.isSprite) ghost(o, order); }); return g; };
function put(parent, geo, m, x = 0, y = 0, z = 0, shadow = true) {
  const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = shadow; parent.add(o); return o;
}
const box = (p, w, h, d, m, x, y, z, shadow) => put(p, new THREE.BoxGeometry(w, h, d), m, x, y, z, shadow);
const rbox = (p, w, h, d, r, m, x, y, z, shadow) => put(p, new RoundedBoxGeometry(w, h, d, 3, r), m, x, y, z, shadow);
const radial = (stops, size = 128) => tex(cvs(size, size, (g, w, h) => {
  const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  for (const [o, c] of stops) gr.addColorStop(o, c);
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
}));
const addM = (map, color = "#ffffff", opacity = 1) => bas({ map, color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
function glowSprite(parent, map, color, size, x, y, z) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false, opacity: 0 }));
  s.material.userData.noOutline = true; s.position.set(x, y, z); s.scale.setScalar(size); ghost(s, 6); parent.add(s); return s;
}
// a rod between two points (r radius), for the lattice
function strut(a, b, r) {
  const d = new THREE.Vector3().subVectors(b, a), L = d.length(), g = new THREE.CylinderGeometry(r, r, L, 6, 1);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize()));
  const m = a.clone().add(b).multiplyScalar(0.5); g.translate(m.x, m.y, m.z); return g;
}

// ------------------------------------------------------------------------------------------------ hand-drawn textures
// dark painted metal: scratches, flecks and a worn lighter edge, drawn once
function metalTex(base, hi, seed, W = 128, H = 128) {
  return tex(cvs(W, H, (g) => {
    g.fillStyle = base; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(${hs(i, seed) < 0.5 ? hi : "10,12,20"},${0.06 + 0.14 * hs(i, seed + 1)})`; g.fillRect(hs(i, seed + 2) * W, hs(i, seed + 3) * H, 1 + 6 * hs(i, seed + 4), 1 + 1.5 * hs(i, seed + 5)); }
    for (let i = 0; i < 26; i++) { g.strokeStyle = `rgba(${hi},${0.1 + 0.2 * hs(i, seed + 6)})`; g.lineWidth = 0.8; g.beginPath(); const y = hs(i, seed + 7) * H, x = hs(i, seed + 8) * W; g.moveTo(x, y); g.lineTo(x + 10 + 30 * hs(i, seed + 9), y + (hs(i, seed + 10) - 0.5) * 8); g.stroke(); }
    g.strokeStyle = `rgba(${hi},0.25)`; g.lineWidth = 3; g.strokeRect(0, 0, W, H);
  }));
}
// the counterweight: concrete grey with yellow-black hazard stripes on the front and back, hand-wobbled
const WEIGHT_TEX = () => tex(cvs(256, 160, (g, W, H) => {
  g.fillStyle = "#8f929a"; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 300; i++) { g.fillStyle = hs(i, 1) < 0.5 ? `rgba(255,255,255,${0.04 + 0.08 * hs(i, 2)})` : `rgba(30,30,40,${0.05 + 0.1 * hs(i, 2)})`; g.fillRect(hs(i, 3) * W, hs(i, 4) * H, 1 + 4 * hs(i, 5), 1 + 3 * hs(i, 6)); }
  for (let k = -2; k < 14; k++) { g.fillStyle = "#e8b830"; g.beginPath(); const x0 = k * 22 + 2 * hs(k, 3); g.moveTo(x0, H * 0.74); g.lineTo(x0 + 12, H * 0.74); g.lineTo(x0 + 34, H); g.lineTo(x0 + 22, H); g.closePath(); g.fill(); }
  g.fillStyle = "rgba(20,20,28,0.55)"; g.fillRect(0, H * 0.72, W, 3);
  g.strokeStyle = "rgba(20,20,28,0.4)"; g.lineWidth = 4; g.strokeRect(0, 0, W, H);
}));

// ------------------------------------------------------------------------------------------------ tvcrane
const NAVY_METAL = "#2d3140";
function buildLattice(len) {
  const x0 = -0.85, n = Math.max(4, Math.round((len - x0) / 0.5)), pts = [];
  const hy = (x) => 0.22 - 0.12 * clamp(x / len), hz = (x) => 0.17 - 0.08 * clamp(x / len);
  const geos = [];
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((len - x0) * i) / n, y = hy(x), z = hz(x);
    pts.push([x, y, z]);
    const c = [new THREE.Vector3(x, y, z), new THREE.Vector3(x, y, -z), new THREE.Vector3(x, -y, -z), new THREE.Vector3(x, -y, z)];
    for (let k = 0; k < 4; k++) geos.push(strut(c[k], c[(k + 1) % 4], 0.02));
  }
  for (let i = 0; i < n; i++) {
    const [xa, ya, za] = pts[i], [xb, yb, zb] = pts[i + 1], f = i % 2 ? 1 : -1;
    for (const sy of [-1, 1]) for (const sz of [-1, 1]) geos.push(strut(new THREE.Vector3(xa, sy * ya, sz * za), new THREE.Vector3(xb, sy * yb, sz * zb), 0.034));   // the four chords
    for (const sz of [-1, 1]) geos.push(strut(new THREE.Vector3(xa, -f * ya, sz * za), new THREE.Vector3(xb, f * yb, sz * zb), 0.018));        // side diagonals
    for (const sy of [-1, 1]) geos.push(strut(new THREE.Vector3(xa, sy * ya, -f * za), new THREE.Vector3(xb, sy * yb, f * zb), 0.016));        // top and bottom diagonals
  }
  return mergeGeometries(geos);
}
function tube(pts, r, seg = 40) { return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))), seg, r, 6, false); }

function tvcrane(P) {
  const S = P.spec, g = P.whole, SZ = RESCUE.crane;
  const len = S.len ?? SZ.len, cableEnd = S.cableEnd ?? SZ.cableEnd, pull = S.pull ?? SZ.pull, drop = S.drop ?? SZ.drop, land = S.land ?? SZ.land, AX = SZ.axisY;
  const dark = std("#ffffff", { map: metalTex(NAVY_METAL, "190,200,225", 1), roughness: 0.5, metalness: 0.2 });
  const darkB = std("#ffffff", { map: metalTex("#232633", "150,160,190", 7), roughness: 0.55, metalness: 0.25 });
  const yel = std("#ffffff", { map: WEIGHT_TEX(), roughness: 0.85 });
  const hazard = std("#e8b830", { roughness: 0.6 });
  const rubber = std("#262a35", { roughness: 0.5 });
  const cableC = S.cableColor ?? "#3a3f52";   // spec.cableColor: a jacketed cable that reads at night (EP07: hazard orange)
  const cableM = std(cableC, { roughness: 0.25, metalness: 0.1, emissive: new THREE.Color(S.cableColor ? cableC : "#1c2236"), emissiveIntensity: S.cableColor ? 0.45 : 0.9 });
  const hub = std("#9aa2b4", { roughness: 0.4, metalness: 0.5 });

  // ---- dolly, wheels, column, turntable (solid)
  rbox(g, 1.3, 0.2, 0.9, 0.05, darkB, 0, 0.3, 0);
  box(g, 1.3, 0.05, 0.05, hazard, 0, 0.23, 0.46, false); box(g, 1.3, 0.05, 0.05, hazard, 0, 0.23, -0.46, false);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const w = put(g, new THREE.CylinderGeometry(0.17, 0.17, 0.14, 16), rubber, sx * 0.5, 0.17, sz * 0.4); w.rotation.z = Math.PI / 2;
    const h = put(g, new THREE.CylinderGeometry(0.08, 0.08, 0.15, 12), hub, sx * 0.5, 0.17, sz * 0.4, false); h.rotation.z = Math.PI / 2;
    box(g, 0.05, 0.16, 0.09, darkB, sx * 0.5, 0.26, sz * 0.4, false);   // the caster fork
  }
  rbox(g, 0.4, 1.5, 0.4, 0.04, dark, 0, 1.15, 0);
  box(g, 0.42, 0.14, 0.42, hazard, 0, 0.5, 0, false); box(g, 0.44, 0.04, 0.44, darkB, 0, 0.44, 0, false);
  put(g, new THREE.CylinderGeometry(0.3, 0.34, 0.12, 20), darkB, 0, 1.96, 0);
  // a torn stub of the boom's hinge, shown while it falls
  const stub = new THREE.Group(); g.add(stub); stub.visible = false;
  for (let i = 0; i < 5; i++) { const sp = new THREE.ConeGeometry(0.05 + 0.03 * hs(i, 2), 0.18 + 0.2 * hs(i, 3), 4); const o = put(stub, sp, std("#c8cedc", { roughness: 0.3, metalness: 0.6 }), -0.14 + i * 0.07, 2.08 + 0.05 * hs(i, 4), (hs(i, 5) - 0.5) * 0.2); o.rotation.set((hs(i, 6) - 0.5) * 0.8, 0, (hs(i, 7) - 0.5) * 0.9); }

  // ---- the boom: yaw about the column, pitch about the hinge (z)
  const yaw = new THREE.Group(); yaw.position.set(0, AX, 0); g.add(yaw);
  const lev = new THREE.Group(); yaw.add(lev);                               // the hinge end's lift while it falls
  const pitch = new THREE.Group(); lev.add(pitch);
  put(pitch, buildLattice(len), darkB, 0, 0, 0);
  rbox(pitch, 0.42, 0.46, 0.5, 0.05, dark, 0, 0, 0);                           // the hinge block
  rbox(pitch, 0.8, 0.6, 0.62, 0.05, yel, -1.2, -0.05, 0);                      // the counterweight
  box(pitch, 0.06, 0.5, 0.5, hazard, -0.78, -0.05, 0, false);
  // the head: a gimbal at the tip, the camera hanging under it
  const head = new THREE.Group(); head.position.set(len, 0, 0); pitch.add(head);
  put(head, new THREE.CylinderGeometry(0.06, 0.06, 0.2, 10), hub, 0, -0.1, 0, false);
  box(head, 0.5, 0.05, 0.4, darkB, 0, -0.22, 0);
  for (const sz of [-1, 1]) box(head, 0.05, 0.42, 0.05, darkB, 0, -0.42, sz * 0.2, false);
  const camBody = std("#ffffff", { map: metalTex("#4a566c", "200,215,240", 21), roughness: 0.45, metalness: 0.15 });
  rbox(head, 0.62, 0.36, 0.34, 0.06, camBody, -0.04, -0.5, 0);
  const lens = put(head, new THREE.CylinderGeometry(0.115, 0.135, 0.3, 16), darkB, 0.43, -0.5, 0); lens.rotation.z = Math.PI / 2;
  const hood = put(head, new THREE.CylinderGeometry(0.21, 0.165, 0.2, 18, 1, true), std("#1b1d27", { roughness: 0.8, side: THREE.DoubleSide }), 0.66, -0.5, 0); hood.rotation.z = Math.PI / 2;
  const glass = put(head, new THREE.CircleGeometry(0.115, 16), std("#1c3f7a", { roughness: 0.1, metalness: 0.4, emissive: new THREE.Color("#0c2a66"), emissiveIntensity: 0.8 }), 0.585, -0.5, 0, false); glass.rotation.y = Math.PI / 2;
  rbox(head, 0.36, 0.17, 0.2, 0.04, camBody, -0.2, -0.27 + 0.06, 0);           // the viewfinder on top
  rbox(head, 0.2, 0.05, 0.16, 0.02, darkB, 0.1, -0.29, 0, false);              // the handle
  const tally = put(head, new THREE.SphereGeometry(0.04, 10, 8), std("#6a1010", { roughness: 0.3, emissive: new THREE.Color("#ff2418"), emissiveIntensity: 0 }), 0.25, -0.3, 0, false);
  const tallyGlow = glowSprite(head, radial([[0, "rgba(255,90,70,1)"], [0.4, "rgba(255,50,40,0.5)"], [1, "rgba(255,30,20,0)"]]), "#ffffff", 0.5, 0.25, -0.3, 0.02);
  // the boom's run of cable (boom frame): the head's underside back to the hinge
  const run = tube([[len - 0.05, -0.66, 0.06], [len - 0.35, -0.36, 0.17], [len * 0.7, -0.36, 0.19], [len * 0.4, -0.31, 0.19], [0.35, -0.27, 0.15]], 0.036, 48);
  const runM = ghost(new THREE.Mesh(run, cableM)); pitch.add(runM);
  // the rest of the cable (world): hinge, down the column, along the ground to the free end; rebuilt when the params change
  const rest = ghost(new THREE.Mesh(new THREE.BufferGeometry(), cableM)); g.add(rest);
  const plug = ghost(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.16, 8), std("#c8a02a", { roughness: 0.4, metalness: 0.5 }))); g.add(plug);
  let key = "";
  return {
    grip: 0,
    apply(ps) {
      const swing = ps.swing ?? S.swing ?? 0, boom = ps.boom ?? S.boom ?? 18, yank = clamp(ps.yank ?? S.yank ?? 0), fall = clamp(ps.fall ?? 0), tl = clamp(ps.tally ?? S.tally ?? 0);
      const sinD = Math.sin(drop * DEG), delta = Math.max(0, land + len * sinD - AX), kk = smooth(0, 1, fall);
      const pDeg = boom + (-drop - boom) * kk, lift = delta * kk;
      yaw.rotation.y = swing * DEG; lev.position.y = lift; pitch.rotation.z = pDeg * DEG; head.rotation.z = -pDeg * DEG * (1 - 0.5 * kk);
      stub.visible = fall > 0.02;
      tally.material.emissiveIntensity = 2.2 * tl; tallyGlow.material.opacity = tl; tallyGlow.visible = tl > 0.01;
      // the cable's start: the boom's hinge point in the world
      const ca = Math.cos(pDeg * DEG), sa = Math.sin(pDeg * DEG), px = 0.35 * ca + 0.27 * sa, py = 0.35 * sa - 0.27 * ca, pz = 0.15, yw = swing * DEG;
      const st = [px * Math.cos(yw) + pz * Math.sin(yw), AX + lift + py, -px * Math.sin(yw) + pz * Math.cos(yw)];
      const E = [cableEnd[0] + (pull[0] - cableEnd[0]) * yank, 0.045 + (Math.max(pull[1], 0.045) - 0.045) * yank, cableEnd[2] + (pull[2] - cableEnd[2]) * yank];
      const k2 = [pDeg.toFixed(2), swing, lift.toFixed(3), yank.toFixed(3)].join();
      if (k2 !== key) {
        key = k2;
        const B = [0.18, 0.06, 0.42], pts = [st, [0.1 + 0.15 * st[0], (st[1] + 1.2) / 2, 0.3], [0.12, 1.25, 0.3], [0.14, 0.7, 0.34], [0.16, 0.42, 0.4], B];
        for (const t of [0.22, 0.45, 0.7]) {
          const wob = (1 - yank) * 0.22 * Math.sin(t * 9 + 1.3);
          pts.push([B[0] + (E[0] - B[0]) * t, Math.max(0.045, B[1] + (E[1] - B[1]) * t - (1 - yank) * 0.01), B[2] + (E[2] - B[2]) * t + wob]);
        }
        pts.push(E);
        rest.geometry.dispose(); rest.geometry = tube(pts, S.cableR ?? 0.04, 80);
        plug.position.set(E[0], E[1] + 0.02, E[2]); plug.rotation.z = Math.atan2(E[1] - pts[pts.length - 2][1], E[0] - pts[pts.length - 2][0]) + Math.PI / 2;
      }
    },
  };
}

// ------------------------------------------------------------------------------------------------ ambulance
// chequered band: two rows of red and yellow squares, painted by hand (each square a touch off, scuffed edges)
function chequerTex(cols, W, H) {
  return tex(cvs(W, H, (g) => {
    const sw = W / cols, sh = H / 2;
    g.fillStyle = "#f3efe2"; g.fillRect(0, 0, W, H);
    for (let r = 0; r < 2; r++) for (let c = 0; c < cols; c++) {
      const red = (r + c) % 2 === 0, j = (k) => (hs(r * 31 + c, k) - 0.5) * 3;
      g.fillStyle = red ? "#d83a2c" : "#f0c020"; g.fillRect(c * sw + j(1), r * sh + j(2), sw + j(3), sh + j(4));
      g.strokeStyle = "rgba(60,30,10,0.35)"; g.lineWidth = 1.5; g.strokeRect(c * sw + j(5) + 1, r * sh + j(6) + 1, sw - 2, sh - 2);
      for (let i = 0; i < 4; i++) { g.fillStyle = `rgba(255,255,255,${0.12 + 0.2 * hs(r * 31 + c, 10 + i)})`; g.fillRect(c * sw + hs(c + r, 20 + i) * sw, r * sh + hs(c + r, 30 + i) * sh, 4 + 8 * hs(c, 40 + i), 1.5); }
    }
    g.strokeStyle = "rgba(60,30,10,0.5)"; g.lineWidth = 3; g.strokeRect(1, 1, W - 2, H - 2);
  }));
}
// painted white body: grime streaks hanging from the roof and the edges, hand-drawn, a pale blue shadow
function bodyTex(seed, W = 256, H = 128) {
  return tex(cvs(W, H, (g) => {
    g.fillStyle = "#e9eef2"; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(${hs(i, seed) < 0.5 ? "255,255,255" : "120,140,170"},${0.05 + 0.1 * hs(i, seed + 1)})`; g.fillRect(hs(i, seed + 2) * W, hs(i, seed + 3) * H, 2 + 18 * hs(i, seed + 4), 1 + 3 * hs(i, seed + 5)); }
    for (let i = 0; i < 26; i++) { const x = hs(i, seed + 6) * W, l = 14 + 50 * hs(i, seed + 7); const gr = g.createLinearGradient(0, 0, 0, l); gr.addColorStop(0, "rgba(110,120,140,0.28)"); gr.addColorStop(1, "rgba(110,120,140,0)"); g.fillStyle = gr; g.fillRect(x, 0, 1.5 + 2 * hs(i, seed + 8), l); }
    g.fillStyle = "rgba(140,170,210,0.22)"; g.fillRect(0, H * 0.86, W, H * 0.14);
  }));
}

function ambulance(P) {
  const S = P.spec, g = P.whole;
  const wetMats = [];
  const paint = (seed) => { const m = std("#ffffff", { map: bodyTex(seed), roughness: 0.62, emissive: new THREE.Color("#cfd8e6"), emissiveIntensity: 0.1 }); wetMats.push(m); return m; };
  const white = paint(1), whiteB = paint(5), grey = std("#8e96a6", { roughness: 0.5, metalness: 0.3 }), rubber = std("#232630", { roughness: 0.6 });
  const inner = std("#c9d0da", { roughness: 0.8, emissive: new THREE.Color("#ffe9c0"), emissiveIntensity: 0.25 });
  const floorM = std("#8a93a3", { roughness: 0.8, emissive: new THREE.Color("#a8aebb"), emissiveIntensity: 0.12 });
  const glassM = std("#1c3c6e", { roughness: 0.12, metalness: 0.4, emissive: new THREE.Color("#0c2455"), emissiveIntensity: 0.6 });
  const railM = std("#d9dde6", { roughness: 0.3, metalness: 0.7, emissive: new THREE.Color("#7f8896"), emissiveIntensity: 0.2 });
  const W = 2.0, Z0 = -2.3, Z1 = 2.3, ZB = -0.85;                      // cargo box from z ZB to Z1
  // ---- the cargo box: floor, two walls, roof, bulkhead, a rear frame round the 1.8 x 1.5 opening
  box(g, W, 0.1, Z1 - ZB, floorM, 0, 0.5, (Z1 + ZB) / 2);
  for (const sx of [-1, 1]) {
    box(g, 0.08, 1.8, Z1 - ZB, inner, sx * (W / 2 - 0.12), 1.4, (Z1 + ZB) / 2, false);
    rbox(g, 0.1, 1.9, Z1 - ZB, 0.03, white, sx * (W / 2 - 0.05), 1.35, (Z1 + ZB) / 2);
  }
  box(g, W, 0.08, Z1 - ZB, inner, 0, 2.18, (Z1 + ZB) / 2, false);
  rbox(g, W, 0.12, Z1 - ZB, 0.04, whiteB, 0, 2.24, (Z1 + ZB) / 2);
  box(g, W, 1.8, 0.1, inner, 0, 1.4, ZB + 0.05);
  box(g, W, 0.3, 0.12, white, 0, 2.15, Z1 - 0.06); box(g, W, 0.1, 0.12, white, 0, 0.5, Z1 - 0.06);   // header and sill at the rear
  for (const sx of [-1, 1]) box(g, 0.1, 1.6, 0.12, white, sx * 0.95, 1.3, Z1 - 0.06);
  // the lit inside: two stretcher rails (y 0.75, along z), a cabinet with a green oxygen bottle, a ceiling light strip
  for (const sx of [-1, 1]) { const r = put(g, new THREE.CylinderGeometry(0.025, 0.025, 2.7, 8), railM, sx * 0.45, 0.78, 0.9, false); r.rotation.x = Math.PI / 2; box(g, 0.06, 0.28, 0.06, railM, sx * 0.45, 0.62, 0.2, false); box(g, 0.06, 0.28, 0.06, railM, sx * 0.45, 0.62, 1.6, false); }
  box(g, 0.34, 0.9, 0.9, std("#cfd6dd", { roughness: 0.5, emissive: new THREE.Color("#8fa0b0"), emissiveIntensity: 0.15 }), 0.78, 1.1, -0.2, false);
  for (let i = 0; i < 3; i++) box(g, 0.02, 0.05, 0.22, std("#5d6674"), 0.6, 0.85 + i * 0.22, -0.2, false);
  put(g, new THREE.CylinderGeometry(0.08, 0.08, 0.6, 12), std("#2e9a52", { roughness: 0.4, emissive: new THREE.Color("#176a35"), emissiveIntensity: 0.4 }), -0.78, 0.85, -0.45, false);
  box(g, 0.3, 0.04, 1.6, bas({ color: "#f0e2b8" }), 0, 2.12, 0.6, false);
  // ---- the cab
  rbox(g, W, 0.8, 1.5, 0.1, white, 0, 0.9, -1.55);                           // lower cab and bonnet
  rbox(g, 1.9, 0.8, 0.95, 0.12, whiteB, 0, 1.55, -1.28);                      // the cab's upper box
  rbox(g, 1.5, 0.05, 0.05, 0.02, grey, 0, 0.62, -2.34, false);                 // front bumper bar
  box(g, 2.04, 0.12, 0.1, grey, 0, 0.55, -2.3);
  const wsp = put(g, new THREE.PlaneGeometry(1.6, 0.5), glassM, 0, 1.62, -1.28 - 0.475 - 0.003, false); wsp.rotation.y = Math.PI;   // windscreen
  for (const sx of [-1, 1]) { const sw = put(g, new THREE.PlaneGeometry(0.7, 0.45), glassM, sx * 0.953, 1.62, -1.28, false); sw.rotation.y = sx * Math.PI / 2; }
  for (const sx of [-1, 1]) { const hl = put(g, new THREE.CircleGeometry(0.13, 14), std("#fff0b0", { emissive: new THREE.Color("#ffe27a"), emissiveIntensity: 0.9, roughness: 0.2 }), sx * 0.7, 0.88, -2.3 - 0.003, false); hl.rotation.y = Math.PI; }
  // ---- side bands (the chequer) and the rear's
  const band = std("#ffffff", { map: chequerTex(15, 480, 64), roughness: 0.6 }), bandCab = std("#ffffff", { map: chequerTex(7, 224, 64), roughness: 0.6 });
  for (const sx of [-1, 1]) {
    const b = put(g, new THREE.PlaneGeometry(3.15, 0.42), band, sx * (W / 2 + 0.003), 1.0, (Z1 + ZB) / 2, false); b.rotation.y = sx * Math.PI / 2;
    const b2 = put(g, new THREE.PlaneGeometry(1.5, 0.42), bandCab, sx * (W / 2 + 0.003), 0.95, -1.55, false); b2.rotation.y = sx * Math.PI / 2;
    // a wheel arch: a dark disc behind each wheel, and the wheels
    for (const wz of [-1.5, 1.2]) {
      const ar = put(g, new THREE.CircleGeometry(0.5, 20), std("#14161d", { roughness: 0.9 }), sx * (W / 2 + 0.004), 0.45, wz, false); ar.rotation.y = sx * Math.PI / 2;
      const tyre = put(g, new THREE.CylinderGeometry(0.4, 0.4, 0.28, 20), rubber, sx * 0.9, 0.4, wz); tyre.rotation.z = Math.PI / 2;
      const hub = put(g, new THREE.CylinderGeometry(0.22, 0.22, 0.3, 14), std("#aab2c2", { roughness: 0.35, metalness: 0.6 }), sx * 0.9, 0.4, wz, false); hub.rotation.z = Math.PI / 2;
      const cap = put(g, new THREE.CylinderGeometry(0.07, 0.07, 0.33, 8), std("#e9edf4", { roughness: 0.3, metalness: 0.5 }), sx * 0.9, 0.4, wz, false); cap.rotation.z = Math.PI / 2;
    }
  }
  // ---- the rear doors, hinged on the outer edges: 0.9 wide, y 0.55..2.05, outside white with a frosted window and the chequer
  const doorM = std("#ffffff", { map: tex(cvs(128, 256, (c, w, h) => {
    c.fillStyle = "#e9eef2"; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) { c.fillStyle = `rgba(120,140,170,${0.05 + 0.1 * hs(i, 3)})`; c.fillRect(hs(i, 1) * w, hs(i, 2) * h, 2 + 14 * hs(i, 4), 1 + 2 * hs(i, 5)); }
    c.fillStyle = "rgba(150,185,225,0.9)"; c.beginPath(); c.roundRect(w * 0.18, h * 0.16, w * 0.64, h * 0.3, 10); c.fill();
    c.strokeStyle = "#9aa6b8"; c.lineWidth = 4; c.stroke();
    c.fillStyle = "rgba(255,255,255,0.35)"; c.beginPath(); c.moveTo(w * 0.24, h * 0.42); c.lineTo(w * 0.42, h * 0.18); c.lineTo(w * 0.5, h * 0.18); c.lineTo(w * 0.32, h * 0.42); c.fill();
    c.strokeStyle = "rgba(70,80,100,0.5)"; c.lineWidth = 3; c.strokeRect(2, 2, w - 4, h - 4);
  })), roughness: 0.6 });
  wetMats.push(doorM);
  const doors = [];
  for (const sx of [-1, 1]) {
    const hinge = new THREE.Group(); hinge.position.set(sx * 0.9, 0, Z1); g.add(hinge); doors.push([sx, hinge]);
    const leaf = new THREE.Group(); leaf.position.set(-sx * 0.45, 1.3, 0.03); hinge.add(leaf);
    box(leaf, 0.9, 1.5, 0.06, inner, 0, 0, -0.01);
    const fr = put(leaf, new THREE.PlaneGeometry(0.88, 1.48), doorM, 0, 0, 0.022, false);
    put(leaf, new THREE.PlaneGeometry(0.88, 0.2), std("#ffffff", { map: chequerTex(4, 160, 48), roughness: 0.6 }), 0, -0.55, 0.0235, false);
    box(leaf, 0.05, 0.2, 0.07, grey, -sx * 0.38, 0.0, 0.04, false);   // the handle
    void fr;
  }
  box(g, 1.96, 0.1, 0.16, grey, 0, 0.58, Z1 + 0.1);                           // rear bumper
  for (const sx of [-1, 1]) box(g, 0.12, 0.2, 0.05, std("#c02a24", { emissive: new THREE.Color("#701510"), emissiveIntensity: 0.5 }), sx * 0.8, 0.9, Z1 + 0.03, false);
  // ---- lights: a bar of two blue domes on the cab roof, two corner lights on the rear roof edge
  const blueOn = new THREE.Color("#3a78ff"), blueOff = new THREE.Color("#123070");
  const lightM = () => std("#2a62d8", { roughness: 0.25, emissive: blueOff.clone(), emissiveIntensity: 1 });
  const dome = (x, y, z, r, sy) => { const d = put(g, new THREE.SphereGeometry(r, 14, 10, 0, TAU, 0, Math.PI / 2), lightM(), x, y, z, false); d.scale.y = sy; return d; };
  rbox(g, 1.3, 0.08, 0.3, 0.03, grey, 0, 1.99, -1.28);
  const domes = { L: [dome(-0.45, 2.03, -1.28, 0.2, 0.7), dome(-0.86, 2.3, 2.2, 0.1, 1)], R: [dome(0.45, 2.03, -1.28, 0.2, 0.7), dome(0.86, 2.3, 2.2, 0.1, 1)] };
  const lightGlow = { L: [], R: [] }, glowT = radial([[0, "rgba(120,170,255,1)"], [0.3, "rgba(60,120,255,0.55)"], [1, "rgba(30,80,255,0)"]]);
  lightGlow.L.push(glowSprite(g, glowT, "#ffffff", 1.5, -0.45, 2.2, -1.28), glowSprite(g, glowT, "#ffffff", 0.9, -0.86, 2.4, 2.2));
  lightGlow.R.push(glowSprite(g, glowT, "#ffffff", 1.5, 0.45, 2.2, -1.28), glowSprite(g, glowT, "#ffffff", 0.9, 0.86, 2.4, 2.2));
  // the wash on the ground: a soft blue pool round it, brighter toward the lit side
  const wash = ghost(new THREE.Mesh(new THREE.PlaneGeometry(9, 9).rotateX(-Math.PI / 2), addM(radial([[0, "rgba(80,140,255,0.9)"], [0.4, "rgba(40,100,255,0.45)"], [1, "rgba(20,60,255,0)"]], 256), "#ffffff", 0.5)), 1);
  wash.position.y = 0.012; wash.material.polygonOffset = true; wash.material.polygonOffsetFactor = -2; g.add(wash);
  // rain beads: flattened drops on the roof, the bonnet and the sides, seeded
  const NB = 90, beadG = new THREE.SphereGeometry(0.03, 6, 4), beads = new THREE.InstancedMesh(beadG, bas({ color: "#b4d0f0", transparent: true, opacity: 0.45, depthWrite: false }), NB);
  const bm = new THREE.Matrix4(), bq = new THREE.Quaternion(), bs = new THREE.Vector3(), bp = new THREE.Vector3();
  for (let i = 0; i < NB; i++) {
    const kind = i % 3, r = 0.5 + 0.7 * hs(i, 2);
    let nx = 0, ny = 1, nz = 0;
    if (kind === 0) { bp.set((hs(i, 3) - 0.5) * 1.8, 2.305, ZB + hs(i, 4) * (Z1 - ZB)); }
    else if (kind === 1) { const sx = hs(i, 5) < 0.5 ? -1 : 1; bp.set(sx * (W / 2 + 0.01), 1.45 + 0.7 * hs(i, 4), ZB + hs(i, 3) * (Z1 - ZB)); nx = sx; ny = 0; }
    else { bp.set((hs(i, 3) - 0.5) * 1.8, 1.305, -2.25 + hs(i, 4) * 0.45); }
    bq.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(nx, ny, nz));
    bs.set(r, 0.5 + 0.5 * hs(i, 7), r * (1 + 0.5 * hs(i, 8))); bm.compose(bp, bq, bs); beads.setMatrixAt(i, bm);
  }
  ghost(beads, 2); g.add(beads);
  return {
    grip: 0,
    apply(ps, t) {
      const dr = clamp(ps.doors ?? S.doors ?? 0), sr = clamp(ps.siren ?? S.siren ?? 0), wet = clamp(ps.wet ?? S.wet ?? 0), clk = ps.clock ?? S.clock ?? t ?? 0;
      for (const [sx, h] of doors) h.rotation.y = sx * 100 * DEG * smooth(0, 1, dr) ;
      const left = ((clk * 2.5) % 1 + 1) % 1 < 0.5 ? 1 : 0;
      for (const side of ["L", "R"]) {
        const on = (side === "L" ? left : 1 - left) * sr;
        for (const d of domes[side]) { d.material.emissive.copy(blueOff).lerp(blueOn, on); d.material.emissiveIntensity = 1 + 1.6 * on; }
        for (const s of lightGlow[side]) { s.material.opacity = on; s.visible = on > 0.01; }
      }
      wash.material.opacity = 0.55 * sr; wash.visible = sr > 0.01; wash.position.x = (left ? -0.35 : 0.35) * sr;
      for (const m of wetMats) { m.roughness = 0.62 - 0.44 * wet; m.metalness = 0.2 * wet; }
      beads.count = Math.round(NB * wet); beads.visible = beads.count > 0;
    },
  };
}

// ------------------------------------------------------------------------------------------------ stretcher
function stretcher(P) {
  const S = P.spec, g = P.whole;
  const frameM = std("#ffffff", { map: metalTex("#e0431f", "255,180,140", 31), roughness: 0.4, metalness: 0.35 });
  const chrome = std("#aab2c2", { roughness: 0.3, metalness: 0.6 }), rubber = std("#2a2d38", { roughness: 0.6 });
  const mattM = std("#ffffff", { map: tex(cvs(256, 128, (c, w, h) => {
    c.fillStyle = "#2c4a7c"; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 120; i++) { c.fillStyle = `rgba(${hs(i, 1) < 0.5 ? "140,170,220" : "10,20,50"},${0.05 + 0.1 * hs(i, 2)})`; c.fillRect(hs(i, 3) * w, hs(i, 4) * h, 2 + 12 * hs(i, 5), 1 + 2 * hs(i, 6)); }
    c.strokeStyle = "rgba(190,210,245,0.55)"; c.lineWidth = 1.5; c.setLineDash([5, 4]); c.strokeRect(6, 6, w - 12, h - 12);   // the stitching
    c.setLineDash([]); c.strokeStyle = "rgba(10,20,40,0.35)"; c.lineWidth = 2; c.beginPath(); c.moveTo(w * 0.16, 8); c.lineTo(w * 0.16 + 4, h - 8); c.stroke();
  })), roughness: 0.4 });
  // rails, a lower shelf and the cross tubes (all along x, the frame's top at y 0.55)
  for (const sz of [-1, 1]) {
    const rail = put(g, new THREE.CylinderGeometry(0.022, 0.022, 1.44, 8), frameM, 0, 0.55, sz * 0.23); rail.rotation.z = Math.PI / 2;
    const low = put(g, new THREE.CylinderGeometry(0.018, 0.018, 1.04, 8), frameM, 0, 0.3, sz * 0.2, false); low.rotation.z = Math.PI / 2;
    for (const sx of [-1, 1]) {
      put(g, new THREE.CylinderGeometry(0.018, 0.018, 0.26, 6), frameM, sx * 0.52, 0.42, sz * 0.2, false);                  // a leg
      put(g, new THREE.CylinderGeometry(0.03, 0.03, 0.05, 8), chrome, sx * 0.52, 0.28, sz * 0.2, false);                     // the caster stem
      const w = put(g, new THREE.CylinderGeometry(0.075, 0.075, 0.045, 14), rubber, sx * 0.52, 0.075, sz * 0.2); w.rotation.x = Math.PI / 2;
      box(g, 0.03, 0.14, 0.02, chrome, sx * 0.52, 0.17, sz * 0.2 + 0.03 * sz, false);
      // the bar handles at the ends: two stubs and a bar along z at x +-0.75, y 0.78
      const st = put(g, new THREE.CylinderGeometry(0.018, 0.018, 0.24, 6), frameM, sx * 0.735, 0.665, sz * 0.2, false); st.rotation.z = -sx * 0.2;
      box(g, 0.02, 0.02, 0.06, frameM, sx * 0.75, 0.78, sz * 0.2 + sz * 0.02, false);
    }
  }
  for (const sx of [-1, 1]) {
    const bar = put(g, new THREE.CylinderGeometry(0.024, 0.024, 0.5, 8), chrome, sx * 0.75, 0.78, 0); bar.rotation.x = Math.PI / 2;
    for (const sz of [-1, 1]) put(g, new THREE.SphereGeometry(0.03, 8, 6), chrome, sx * 0.75, 0.78, sz * 0.25, false);
    const cr = put(g, new THREE.CylinderGeometry(0.016, 0.016, 0.46, 6), frameM, sx * 0.4, 0.5, 0, false); cr.rotation.x = Math.PI / 2;
  }
  rbox(g, 1.4, 0.1, 0.5, 0.04, mattM, 0, 0.6, 0);                                // the mattress: top at y 0.65
  rbox(g, 0.34, 0.1, 0.4, 0.04, mattM, -0.52, 0.665, 0, false);                   // a raised pillow rest at the head end
  // the straps, over the mattress (orange, with a buckle)
  const strapM = std("#e8832a", { roughness: 0.7 });
  for (const x of [-0.12, 0.25]) { box(g, 0.06, 0.012, 0.56, strapM, x, 0.658, 0, false); box(g, 0.05, 0.02, 0.06, chrome, x, 0.665, 0.1, false); }
  // the blanket: grey, a woven look drawn by hand, a folded hem; it lies on the foot's 0.55 and slides up (scale x) to 1.05
  const blanketM = std("#ffffff", { map: tex(cvs(256, 128, (c, w, h) => {
    c.fillStyle = "#8a909c"; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 90; i++) { c.strokeStyle = `rgba(${hs(i, 1) < 0.5 ? "190,196,208" : "60,66,80"},${0.1 + 0.2 * hs(i, 2)})`; c.lineWidth = 1 + hs(i, 3); c.beginPath(); const y = hs(i, 4) * h; c.moveTo(0, y); c.bezierCurveTo(w * 0.3, y + 6 * (hs(i, 5) - 0.5), w * 0.6, y - 6 * (hs(i, 6) - 0.5), w, y + 4 * (hs(i, 7) - 0.5)); c.stroke(); }
    for (let i = 0; i < 6; i++) { c.fillStyle = `rgba(40,46,60,${0.1 + 0.1 * hs(i, 9)})`; c.fillRect(hs(i, 8) * w, 0, 3 + 4 * hs(i, 10), h); }   // folds
    c.fillStyle = "#c2574a"; c.fillRect(0, 0, 10, h); c.fillStyle = "rgba(255,255,255,0.18)"; c.fillRect(10, 0, 3, h);                                   // the hem stripe
  })), roughness: 0.95 });
  const blanket = rbox(g, 1, 0.045, 0.56, 0.02, blanketM, 0, 0.695, 0);
  return {
    grip: 0,
    apply(ps) {
      const b = clamp(ps.blanket ?? S.blanket ?? 0), L = 0.55 + 0.5 * b;           // the foot end stays at x +0.7
      blanket.scale.x = L; blanket.position.x = 0.7 - L / 2; blanket.position.y = 0.695 + 0.012 * b;
    },
  };
}

// ------------------------------------------------------------------------------------------------ the two potato extras
const SKIN = "#e2a95c";
let SKIN_TEX = null;
function skinTex() {
  return (SKIN_TEX ||= tex(cvs(256, 128, (g, W, H) => {
    g.fillStyle = SKIN; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(${hs(i, 1) < 0.5 ? "130,80,30" : "250,215,150"},${0.05 + 0.1 * hs(i, 2)})`; g.beginPath(); g.ellipse(hs(i, 3) * W, hs(i, 4) * H, 2 + 7 * hs(i, 5), 1.5 + 4 * hs(i, 6), hs(i, 7) * 3, 0, TAU); g.fill(); }
    for (let i = 0; i < 10; i++) { g.fillStyle = "rgba(110,70,30,0.35)"; g.beginPath(); g.ellipse(hs(i, 11) * W, (0.15 + 0.7 * hs(i, 12)) * H, 2.5 + 2 * hs(i, 13), 1.6 + 1.2 * hs(i, 14), 0, 0, TAU); g.fill(); }
  })));
}
const CLOTH = new Map();
function clothTex(color) {
  if (!CLOTH.has(color)) CLOTH.set(color, tex(cvs(128, 128, (g, W) => {
    g.fillStyle = color; g.fillRect(0, 0, W, W);
    for (let i = 0; i < 420; i++) { g.fillStyle = hs(i, 1) < 0.5 ? `rgba(255,255,255,${0.03 + 0.06 * hs(i, 2)})` : `rgba(0,0,0,${0.05 + 0.08 * hs(i, 2)})`; g.fillRect(hs(i, 3) * W, hs(i, 4) * W, 1 + 3 * hs(i, 5), 1 + 4 * hs(i, 6)); }
    for (let i = 0; i < 14; i++) { g.strokeStyle = "rgba(0,0,0,0.1)"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(hs(i, 7) * W, 0); g.lineTo(hs(i, 7) * W + (hs(i, 8) - 0.5) * 12, W); g.stroke(); }
  })));
  return CLOTH.get(color);
}
function potatoBody(rx, ry, rz, seed) {
  const g = new THREE.SphereGeometry(1, 28, 20), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), l = 1 + 0.035 * Math.sin(x * 3 + seed) * Math.cos(y * 2.4 + seed * 1.7) + 0.025 * Math.sin(z * 4 + y * 2 + seed * 2.9);
    p.setXYZ(i, x * rx * l, y * ry * l, z * rz * l);
  }
  g.computeVertexNormals(); return g;
}
// a white patch with a blue cross, hand-drawn (no letters)
function crossTex() {
  return tex(cvs(96, 96, (g, W) => {
    g.fillStyle = "#f6f4ec"; g.beginPath(); g.roundRect(3, 3, W - 6, W - 6, 14); g.fill();
    g.strokeStyle = "rgba(40,60,110,0.5)"; g.lineWidth = 3; g.stroke();
    g.fillStyle = "#1f62d6"; g.beginPath(); g.roundRect(W * 0.38 + 0.8, W * 0.14, W * 0.24, W * 0.72, 4); g.fill(); g.beginPath(); g.roundRect(W * 0.14, W * 0.38 - 0.7, W * 0.72, W * 0.24, 4); g.fill();
    g.fillStyle = "rgba(255,255,255,0.28)"; g.fillRect(W * 0.4, W * 0.18, 4, W * 0.2);
  }));
}
function badgeTex() {
  return tex(cvs(64, 64, (g, W) => {
    const gr = g.createRadialGradient(W * 0.4, W * 0.35, 2, W / 2, W / 2, W / 2); gr.addColorStop(0, "#fff0a0"); gr.addColorStop(0.5, "#e8b830"); gr.addColorStop(1, "#a8761a");
    g.fillStyle = gr; g.beginPath(); g.arc(W / 2, W / 2, W / 2 - 3, 0, TAU); g.fill();
    g.fillStyle = "#fff6c8"; g.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 7 : 17, a = -Math.PI / 2 + (i * Math.PI) / 5; g.lineTo(W / 2 + r * Math.cos(a), W / 2 + r * Math.sin(a)); } g.closePath(); g.fill();
    g.strokeStyle = "#7a5010"; g.lineWidth = 2; g.beginPath(); g.arc(W / 2, W / 2, W / 2 - 3, 0, TAU); g.stroke();
  }));
}
const burstTex = () => tex(cvs(128, 128, (g, W) => {
  const c = W / 2, rg = g.createRadialGradient(c, c, 0, c, c, c * 0.55); rg.addColorStop(0, "rgba(255,255,255,1)"); rg.addColorStop(0.35, "rgba(255,230,140,0.9)"); rg.addColorStop(1, "rgba(255,170,60,0)"); g.fillStyle = rg; g.fillRect(0, 0, W, W);
  for (let i = 0; i < 8; i++) {
    const a = (i * TAU) / 8, l = c * (0.65 + 0.3 * hs(i, 2)); g.save(); g.translate(c, c); g.rotate(a);
    const lg = g.createLinearGradient(0, 0, l, 0); lg.addColorStop(0, "rgba(255,250,210,1)"); lg.addColorStop(1, "rgba(255,190,70,0)"); g.fillStyle = lg;
    g.beginPath(); g.moveTo(0, -5); g.lineTo(l, 0); g.lineTo(0, 5); g.closePath(); g.fill(); g.restore();
  }
}));
const puffTex = () => tex(cvs(128, 128, (g, W) => {
  for (let i = 0; i < 9; i++) {
    const a = hs(i, 1) * TAU, d = 16 * hs(i, 2), r = 22 + 14 * hs(i, 3), x = W / 2 + Math.cos(a) * d, y = W / 2 + Math.sin(a) * d;
    const rg = g.createRadialGradient(x, y, 2, x, y, r); rg.addColorStop(0, "rgba(240,244,250,0.9)"); rg.addColorStop(0.7, "rgba(225,230,240,0.55)"); rg.addColorStop(1, "rgba(215,222,235,0)");
    g.fillStyle = rg; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
  }
}));
const lerpHex = (a, b, t) => { const c = new THREE.Color(a).lerp(new THREE.Color(b), t); return "#" + c.getHexString(); };
const STRIDE = 0.28;

function potatoExtra(P, kind) {
  const LIFT = 0.03, S = P.spec, medic = kind === "medic", h = S.h ?? (medic ? 0.9 : 0.95), k = h / (0.9 + LIFT), ident = strHash(S.id ?? kind);
  const RX = 0.39, RY = 0.4, RZ = 0.34, CY = 0.5, root = new THREE.Group(); root.scale.setScalar(k); P.whole.add(root);
  const feetG = new THREE.Group(); root.add(feetG);
  const body = new THREE.Group(); root.add(body);
  const lit = (c, e = 0.22) => std("#ffffff", { map: clothTex(c), roughness: 0.65, emissive: new THREE.Color(c), emissiveIntensity: e });
  const skin = std("#ffffff", { map: skinTex(), roughness: 0.75, emissive: new THREE.Color(SKIN), emissiveIntensity: 0.22 });
  put(body, potatoBody(RX, RY, RZ, ident % 50), skin, 0, CY, 0);
  const shell = (th0, th1, grow, m, parent = body) => { const sg = new THREE.SphereGeometry(1, 28, 14, 0, TAU, th0, th1 - th0); sg.scale(RX * grow, RY * grow, RZ * grow); return put(parent, sg, m, 0, CY, 0); };
  const surfZ = (x, y, grow = 1) => RZ * grow * Math.sqrt(Math.max(0, 1 - (x / (RX * grow)) ** 2 - ((y - CY) / (RY * grow)) ** 2));
  const ring = (th, grow, m, tube) => { const r = new THREE.TorusGeometry(1, tube, 6, 28); r.scale(RX * grow * Math.sin(th), RZ * grow * Math.sin(th), 1); const o = put(body, r, m, 0, CY + RY * grow * Math.cos(th), 0); o.rotation.x = Math.PI / 2; return o; };
  const patch = (map, w, x, y, grow, tiltX = 0) => { const m = bas({ map, transparent: true, side: THREE.DoubleSide }); const o = put(body, new THREE.PlaneGeometry(w, w), m, x, y, surfZ(x, y, grow) + 0.006); o.rotation.x = tiltX; o.material.polygonOffset = true; o.material.polygonOffsetFactor = -2; return o; };
  const jacketC = medic ? "#d6dce8" : "#1f2f55", legC = medic ? "#26324a" : "#6c7384", acc = medic ? "#d6e83a" : "#e8b830";
  const jacket = lit(jacketC, medic ? 0.1 : 0.22), legM = lit(legC, 0.2), accM = std(acc, { roughness: 0.45, emissive: new THREE.Color(acc), emissiveIntensity: medic ? 0.35 : 0.25 });
  shell(1.64, Math.PI, 1.05, jacket); ring(1.64, 1.05, accM, medic ? 0.03 : 0.022);
  if (medic) {
    ring(2.2, 1.06, accM, 0.02);                                                  // the reflective ring
    patch(crossTex(), 0.15, 0.17, 0.4, 1.06, 0.1);
  } else {
    const gold = std("#e8b830", { roughness: 0.3, metalness: 0.5, emissive: new THREE.Color("#7a5a10"), emissiveIntensity: 0.4 });
    for (const sx of [-1, 1]) for (const dy of [0.42, 0.33, 0.24]) put(body, new THREE.SphereGeometry(0.02, 8, 6), gold, sx * 0.07, dy, surfZ(sx * 0.07, dy, 1.05) + 0.004, false);
    for (const sx of [-1, 1]) { const lp = new RoundedBoxGeometry(0.06, 0.26, 0.012, 2, 0.005); const o = put(body, lp, lit("#17224a", 0.2), sx * 0.13, 0.38, surfZ(sx * 0.13, 0.38, 1.07) + 0.004, false); o.rotation.z = sx * -0.35; }
    patch(badgeTex(), 0.075, 0.2, 0.44, 1.06, 0.1);
    const sh = std("#f4f2ec", { roughness: 0.6, emissive: new THREE.Color("#ffffff"), emissiveIntensity: 0.3 });
    const sg = new THREE.SphereGeometry(1, 20, 12, Math.PI / 2 - 0.2, 0.4, 1.64, 0.5); sg.scale(RX * 1.058, RY * 1.058, RZ * 1.058); put(body, sg, sh, 0, CY, 0, false);
  }
  // face: two dot eyes with a highlight, blush, a small smile
  const eyeM = std("#2a1608", { roughness: 0.3 }), hiM = bas({ color: "#ffffff" }), blushM = bas({ color: "#ff8f8f", transparent: true, opacity: 0.55 });
  for (const sx of [-1, 1]) {
    const ex = sx * 0.125, ey = 0.6, ez = RZ * Math.sqrt(Math.max(0, 1 - (ex / RX) ** 2 - ((ey - CY) / RY) ** 2));
    const e = put(body, new THREE.SphereGeometry(0.04, 12, 10), eyeM, ex, ey, ez - 0.004); e.scale.set(0.9, 1.25, 0.55);
    put(body, new THREE.SphereGeometry(0.011, 8, 6), hiM, ex + 0.01, ey + 0.02, ez + 0.012);
    const bx = sx * 0.225, by = 0.53, bz = RZ * Math.sqrt(Math.max(0, 1 - (bx / RX) ** 2 - ((by - CY) / RY) ** 2));
    const bl = put(body, new THREE.CircleGeometry(0.045, 14), blushM, bx, by, bz + 0.002); bl.rotation.y = sx * 0.55; bl.scale.set(1.2, 0.8, 1);
  }
  const sm = put(body, new THREE.TorusGeometry(0.04, 0.0065, 6, 14, Math.PI), std("#4a2008"), 0, 0.54, RZ * Math.sqrt(1 - (0.06 / RY) ** 2)); sm.rotation.z = Math.PI; sm.rotation.x = -0.1;
  // the cap: white, a band and a visor; a blue cross (medic) or a gold badge (official)
  const capM = std("#ffffff", { map: clothTex("#f0f1f4"), roughness: 0.6, emissive: new THREE.Color("#e8ecf2"), emissiveIntensity: 0.12 });
  shell(0, 0.95, 1.07, capM); ring(0.95, 1.07, medic ? lit("#1f62d6", 0.3) : lit("#1a1d2e", 0.25), medic ? 0.02 : 0.034);
  const vis = put(body, new RoundedBoxGeometry(0.3, 0.02, 0.15, 2, 0.008), medic ? lit("#2a3550", 0.2) : lit("#171a28", 0.2), 0, 0.752, 0.3, false); vis.rotation.x = 0.22;
  if (medic) patch(crossTex(), 0.1, 0.0, 0.84, 1.07, -0.5); else patch(badgeTex(), 0.07, 0.0, 0.82, 1.07, -0.5);
  // arms: sleeve and a hand hung from the shoulders
  const handM = std("#ffffff", { map: skinTex(), roughness: 0.75, emissive: new THREE.Color(SKIN), emissiveIntensity: 0.22 }), arms = [];
  for (const sx of [-1, 1]) {
    const pv = new THREE.Group(); pv.position.set(sx * (RX * 0.92), 0.62, 0.02); body.add(pv); arms.push([sx, pv]);
    put(pv, new THREE.CapsuleGeometry(0.045, 0.14, 4, 8), jacket, 0, -0.12, 0); put(pv, new THREE.SphereGeometry(0.05, 10, 8), handM, 0, -0.245, 0);
    if (!medic && sx < 0) {   // the starting pistol in the raised right hand: grip in the fist, the barrel up and a little forward
      const pg = new THREE.Group(); pg.position.set(0, -0.245, 0.02); pv.add(pg); pg.rotation.z = Math.PI;   // the arm is turned upside down: this turns the pistol back up
      const steel = std("#ffffff", { map: metalTex("#2b2d38", "200,205,225", 41), roughness: 0.3, metalness: 0.6 });
      put(pg, new RoundedBoxGeometry(0.035, 0.09, 0.028, 2, 0.008), steel, 0, 0.0, 0, false);               // the grip, in the fist
      put(pg, new RoundedBoxGeometry(0.04, 0.05, 0.04, 2, 0.01), steel, 0, 0.065, 0, false);               // the frame
      put(pg, new THREE.CylinderGeometry(0.013, 0.013, 0.09, 8), steel, 0, 0.12, 0, false);                 // the barrel
    }
  }
  // legs (hip in the body) and dark shoes (on the ground)
  const shoeM = std(medic ? "#1d2230" : "#241c1a", { roughness: 0.35 }), legs = [], shoes = [];
  const legG = new THREE.CylinderGeometry(0.032, 0.036, 1, 8); legG.translate(0, -0.5, 0);
  for (const sx of [-1, 1]) {
    legs.push([sx, put(body, legG, legM, sx * 0.1, 0.13, 0.02)]);
    const sg = new THREE.SphereGeometry(0.075, 12, 8); sg.scale(1.0, 0.6, 1.6); shoes.push([sx, put(feetG, sg, shoeM, sx * 0.1, 0.035, 0.05)]);
  }
  // soft blob shadow
  const sh = put(root, new THREE.CircleGeometry(0.34, 24), bas({ map: radial([[0, "rgba(0,0,0,0.55)"], [0.6, "rgba(0,0,0,0.3)"], [1, "rgba(0,0,0,0)"]], 64), transparent: true, depthWrite: false }), 0, 0.006, 0.02, false); sh.rotation.x = -Math.PI / 2; sh.scale.set(1.15, 0.85, 1);
  // the starter's flash and smoke
  let flash = null; const puffs = [];
  if (!medic) {
    const ax = -RX * 0.92 - 0.012, topY = 0.62 + 0.245 + 0.2;                  // above the raised hand, in model units
    flash = glowSprite(body, burstTex(), "#ffffff", 0.4, ax, topY + 0.04, 0.0);
    const pt = puffTex();
    for (let i = 0; i < 5; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: pt, color: "#e6ebf4", transparent: true, depthWrite: false, toneMapped: false, fog: false, opacity: 0 }));
      s.material.userData.noOutline = true; s.position.set(ax, topY, 0); ghost(s, 5); body.add(s); puffs.push(s);
    }
  }
  ghostAll(root, 0);
  const phase = ident * 0.37;
  const footZ = (f) => (f < 0.5 ? STRIDE / 2 - (f / 0.5) * STRIDE : -STRIDE / 2 + ((1 - Math.cos(((f - 0.5) / 0.5) * Math.PI)) / 2) * STRIDE);
  const footY = (f) => (f < 0.5 ? 0 : 0.05 * Math.sin(((f - 0.5) / 0.5) * Math.PI));
  return {
    grip: 0,
    apply(ps, t) {
      const tt = t ?? 0, wk = (ps.walk ?? S.walk ?? 0) + (S.phase ?? 0), u = wk / (2 * STRIDE), fr = (v) => v - Math.floor(v), sway = clamp(ps.sway ?? S.sway ?? 0);
      const lug = medic ? clamp(ps.lug ?? S.carry ?? S.lug ?? 0) : 0;
      const bob = 0.025 * (1 - Math.cos(2 * Math.PI * 2 * u)) / 2;
      body.position.y = LIFT + bob; body.rotation.x = 0.05; body.rotation.z = 0.035 * Math.sin(2 * Math.PI * u) + (3 * DEG) * sway * Math.sin(tt * 1.7 + phase);
      const zr = {};
      for (const [sx, shoe] of shoes) {
        const f = fr(u + (sx > 0 ? 0.5 : 0)), dz = footZ(f) / k, dy = footY(f) / k; zr[sx] = footZ(f);
        shoe.position.set(sx * 0.1, 0.035 + dy, 0.05 + dz); shoe.rotation.x = f < 0.5 ? 0 : -0.35 * Math.sin(((f - 0.5) / 0.5) * Math.PI);
      }
      for (const [sx, lg] of legs) {
        const f = fr(u + (sx > 0 ? 0.5 : 0)), dz = footZ(f) / k + 0.03, hipY = 0.13 + LIFT + bob, ankleY = 0.06 + footY(f) / k, dyy = Math.max(0.03, hipY - ankleY);
        lg.rotation.x = -Math.atan2(dz, dyy); lg.scale.y = Math.hypot(dz, dyy);
      }
      for (const [sx, pv] of arms) {
        if (!medic && sx < 0) { pv.rotation.set(0, 0, Math.PI + 0.06); continue; }   // the official's right arm: straight up
        const swing = 3.2 * zr[sx] * (1 - lug);
        pv.rotation.set(swing + lug * -2.06, 0, sx * 0.22 * (1 - lug) - sx * 0.5 * lug);
      }
      if (!medic) {
        const f = clamp(ps.fire ?? 0);
        const fl = f > 0.0005 && f < 0.1 ? Math.pow(Math.sin(Math.PI * f / 0.1), 0.6) : 0;
        flash.material.opacity = fl; flash.visible = fl > 0.01; flash.scale.setScalar(0.28 + 0.2 * fl); flash.material.rotation = 0.5 * f * 30;
        const u2 = clamp((f - 0.06) / 0.94);
        puffs.forEach((p, i) => {
          const d = hs(i, 4), a = (hs(i, 5) - 0.5) * 0.12;
          const q = clamp(u2 * 1.15 - 0.03 * i);
          p.position.set(-RX * 0.92 - 0.012 + a * 4 * q + 0.04 * Math.sin(q * 3 + i), 0.62 + 0.245 + 0.2 + (0.6 * q * (0.8 + 0.2 * d)) / k, 0.02 + 0.04 * i * q);
          p.scale.setScalar((0.16 + 0.3 * q + 0.06 * d) / k);
          p.material.opacity = f > 0.06 ? 0.72 * Math.pow(Math.sin(Math.PI * q), 0.6) : 0; p.visible = p.material.opacity > 0.01;
        });
      }
    },
  };
}

export const RESCUE_KINDS = {
  tvcrane,
  ambulance,
  stretcher,
  medic: (P) => potatoExtra(P, "medic"),
  starter: (P) => potatoExtra(P, "starter"),
};
