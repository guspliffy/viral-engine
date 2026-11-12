// Props for "Fight, Flight or Freeze" 02 "Bear in the camp" (12 Nov 2026): a lonely camp at night in a dry thunderstorm. Metres;
// origin the bottom centre and the front +z unless said; every animated value is a param 0..1 unless said. A param that
// propState has no default for (listed below) is undefined until its first set: seed it with a dur-0 set at 0 (the prop
// also reads spec.<name> as its start value). Every light in a kind is skipped with spec.light false. Bench:
// storyboards/series/fight-flight-freeze/02-bear-camp/bench (make-bearcamp-props.mjs, bearcamp-props-sheet.png).
//
//   domecamp    a three-person dome tent: forest green fly #3f6b3a with darker #2c4a2a seams, a tan #8a7a5a floor tub rim, footprint
//               2.6 w (x) x 2.2 d (z), peak 1.45, two crossing poles under the fly (ridges corner to corner). Origin the middle of
//               the footprint. Front (+z): a D-shaped door 1.0 wide, 0.95 high. Left wall (-x): a 0.7 x 0.5 window (z -0.35..0.35,
//               y 0.4..0.9) of fine dark mesh, see-through (userData.steam) and cut out of the fly, so a camera inside (a few
//               metres in, eye 0.75) looks out through it. The door has a mesh window too, like a real tent door: its upper 60% (y 0.38
//               up, a D inset 6 cm from the door's outline) is the same see-through mesh, the lower part solid; it rolls down with open. Inside is open: floor at y 0.03, nothing in the way of three seated
//               potatoes. The fly is cut out of its own map's alpha (the look drops alphaMap) and has no ink line.
//               open 0..1 (propState default 0) rolls the door panel down from the top into a roll at the sill (1 = open, the
//               D shows the dark green inside); rip 0..1 (seed) four parallel claw slits 0.9 m long down the front-top fly (0.55 of
//               it draws them), then the three strips between them peel out and hang in ragged flaps with the inside showing;
//               push 0..1 (seed) a bulge of the front fly inward, 0.35 deep at 1 (centre x 0, y 0.78); flutter 0..1 (seed) wind
//               ripple (1.5 cm) of the fly and flaps, on the clip clock.
//   campcar     the hatchback (car-hatchback.js, 3.3 long x 2.2 wide x 2.06 high, front +z, driver at +x), plain dark silver
//               spec.color #8d9297, no plate, parked (a prop: its wheels do not turn). smash 0..1 (default 0) the windscreen
//               crazes outward from one impact point spec.hit [0.3, 0.12] (m right, up from the pane's middle), white cracks and
//               a frosted fill, a sag inward and a ragged hole from 0.75; door 0..1 (seed) the driver door (+x) hinges open
//               about its front edge to 70 deg; torn 0 | 1 (seed) hides the door and leaves two hinge stubs (the door is the next
//               kind); lights 0..1 (default 0) headlights on: white-hot lamps, two soft see-through beams 6 m long (userData.steam),
//               a glow on each lamp and one spot light; flash (a count, seed) blinks the lights once per whole number: the lights
//               are on while flash is 0 or its fraction is under 0.5, off for the second half (tween flash 0 -> n). spec.hit,
//               spec.color, spec.lampColor, spec.wheel.
//   cardoor     that driver door alone (same paint and shape, 1.1 long x 1.64 high, outer skin toward +x), origin its HINGE edge
//               at the bottom middle of the skin: the door runs back along -z and up +y. Window glass shattered (cracked pane, a
//               hole, teeth of glass in the frame), the hinge edge torn: ragged bent metal. Laid on the grass it takes tilt -90
//               (outer skin up) and y 0.045. GRIPS edge [0.03, 1.6, -0.08] (the top front corner, where the paw pulls).
//   cooler      a hard cooler, blue #2f6fb0, white lid #e9eef2, 0.72 w (x) x 0.46 d x 0.48 h, two side handles, a front latch,
//               scuffed. SOLID and standable: the lid is flat, its top at y 0.48. dent 0..1 (seed) crushes the top front +x corner.
//   cookpot     a brushed steel pot #b9bec4, dark inside, spec.r 0.11, spec.h 0.15, origin the middle of its bottom, with ONE long
//               riveted handle along +x (to x 0.33, 0.22 beyond the wall, its middle at y 0.115). dent 0..1 (seed) bends the rim
//               in with two dents on the -x side. GRIPS handle [0.28, 0.115, 0]. Hold it like a frying pan: grips.phone (defaults)
//               puts the fist on the handle (SIZE cookpot: w 0.49, h 0.274); grips.mug works with { angle: 90, height: 0.42 }.
//               Proof: make-grip-tests.mjs --prop cookpot --hold phone.
//   burnbranch  a dry pine branch 0.75 long up +y, origin the held end, r 0.03 there tapering to 0.015, two side twigs, a charred top
//               third. A cel-banded flame (red rim, orange, yellow, white-yellow core, see-through) licks 0.35 m up off the top
//               third (y 0.5 to 0.9) and flickers on the clip clock, a few sparks, a glow and a point light. fire 0..1 (default
//               0) its strength. GRIPS hold [0, 0.08, 0]. Hold it with grips.mug (SIZE burnbranch: r 0.03, h 0.121, fist at 0.08 up).
//               Proof: make-grip-tests.mjs --prop burnbranch --hold mug.
//   gaslantern  a camping gas lantern 0.28 tall: green base (r 0.085), glass globe, a wire cage and bail, a glowing mantle. Origin the
//               bottom centre. lit 0..1 (default 0) the warm glow #ffcf7a (a see-through sprite and a point light, a slow flicker);
//               tip 0..1 (default 0) it falls toward +x about its foot edge (0..0.45, accelerating to 90 deg) then rolls 0.2 m
//               and spins, staying lit (`fall` does the same). Note the engine's own prop `tip` is a lean in degrees about x:
//               at tip 1 the whole prop leans 1 deg, harmless.
//   grassfire   low burning dry grass along a strip spec.w (2.5) x spec.d (0.8), origin its middle, spec.seed (3), spec.n (120)
//               flames: cel-banded cones 0.15 to 0.45 tall in the campfire's style, a glow and a scorch decal on the ground, a thin
//               smoke drift (grey sprites), a point light; all see-through (userData.steam). fire 0..1 (default 0) strength;
//               spread 0..1 (seed) grows the burning from the -x end (0 = the first 0.2 m) to the +x end (1), the front edge
//               0.4 m of flames growing from nothing.
//   clawmarks   four parallel fresh gouges in pine bark, 0.6 long, pale wood #d9c39a with dark lips, torn bark and splinters at the
//               ends. Origin its middle, facing +z, spec.r (0.35) the trunk radius it wraps: the origin sits on the trunk's surface
//               (put it at z = the trunk's radius). Four gouges 0.067 apart, leaning 0.2 over their length.
//   climbpine   a tall pine, spec.h 10.2: trunk r 0.36 at the ground to 0.12 at 9 m (SOLID, deep furrows, bark #3a2c22), dead stubs
//               from 2.5 m, live branches with ragged needle skirts (#1d3a33 / #264a3e / #16302b) from 5 m to the crown; no branch on
//               the climb side (+z, within 66 deg) between 1 m and 7.4 m, so a bear and a potato climb up the +z face. sway -1..1
//               (seed) swings the top 0.5 m (to +x at 1), shake 0..1 (seed) adds a 13 Hz tremble on the clip clock; snap (a count, seed)
//               branch bits (up to 8) break off the +x side at 5-9 m: bit i falls during snap i -> i + 1 and lies below it after.
//               cut 0..1 (seed; off below 0.5, on from 0.5, no animation) a film-set wild wall: the back half of the fly (local -z, opposite
//               the door) is not drawn, a clean seam on the z = 0 line over the dome; the poles stay, the floor tub rim on that side
//               drops to a 4 cm lip, the door half shows its darker inner green, the side window keeps its front half. A camera
//               outside behind the tent (about 2 m) sees straight in. Not solid there: only the cloth that is drawn counts.
// Solid: the car, the door, the cooler, the pot, the branch, the lantern's metal, the trunk and branches. See-through (userData.steam):
// the window mesh, the beams, flames, glows, smoke. The tent is an enclosing shell (the potatoes sit inside): list it for
// the contact checks. Sizes of the held props: storyboards/lib/grips.mjs SIZE.
import * as THREE from "three";
import { buildHatchback, HATCH } from "./car-hatchback.js";
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const smooth = (x) => { const k = clamp(x); return k * k * (3 - 2 * k); };
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const sgn = Math.sign;
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; if (parent) parent.add(o); return o; }
function canvas(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return [c, c.getContext("2d")]; }
function tex(c, repeat) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); } return t; }
// see-through for the checks, drawn after the solid things (flames, beams, glows, smoke, mesh)
const steamy = (o, order = 5) => { o.frustumCulled = false; o.renderOrder = order; o.castShadow = false; o.receiveShadow = false; o.userData.steam = true; return o; };
const basic = (color, o = {}) => { const m = new THREE.MeshBasicMaterial({ color, transparent: true, depthWrite: false, toneMapped: false, ...o }); m.userData.noOutline = true; return m; };
// a state number: the propState value, else the spec's, else 0 (a param propState has no default for is undefined until
// its first set; seed it with a dur-0 set at 0 to tween from 0)
const num = (ps, S, k, d = 0) => ps[k] ?? S[k] ?? d;
// a tube along points (arrays), closed or not
const tubeGeo = (pts, r, seg = 6, closed = false) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)), closed), Math.max(6, pts.length * 3), r, seg, closed);

function gridGeo(nu, nv) {
  const geo = new THREE.BufferGeometry(), n = (nu + 1) * (nv + 1), pos = new Float32Array(n * 3), uv = new Float32Array(n * 2), idx = [];
  for (let i = 0; i <= nu; i++) for (let j = 0; j <= nv; j++) { const k = i * (nv + 1) + j; uv[k * 2] = i / nu; uv[k * 2 + 1] = j / nv; }
  for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) { const a = i * (nv + 1) + j, b = a + nv + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); geo.setIndex(idx);
  return geo;
}
// f(u, v) -> [x, y, z] for every grid vertex (u along the first count, v along the second, both 0..1)
function fill(geo, nu, nv, f) {
  const pos = geo.attributes.position.array;
  for (let i = 0; i <= nu; i++) for (let j = 0; j <= nv; j++) { const k = (i * (nv + 1) + j) * 3, p = f(i / nu, j / nv); pos[k] = p[0]; pos[k + 1] = p[1]; pos[k + 2] = p[2]; }
  geo.attributes.position.needsUpdate = true; geo.computeVertexNormals(); geo.computeBoundingBox(); geo.computeBoundingSphere();
}
// the first and last column of a wrapped grid are one seam: average their normals so no line shows
function weld(geo, nu, nv) {
  const n = geo.attributes.normal.array;
  for (let j = 0; j <= nv; j++) { const a = j * 3, b = (nu * (nv + 1) + j) * 3; for (let k = 0; k < 3; k++) { const v = (n[a + k] + n[b + k]) / 2; n[a + k] = n[b + k] = v; } }
  geo.attributes.normal.needsUpdate = true;
}
// a rounded box (a superellipsoid): w x h x d, centred on the origin, n the squareness (2 = ellipsoid, 8 = nearly a box)
function pad(w, h, d, n = 8, seg = 28) {
  const g = new THREE.SphereGeometry(1, seg, Math.round(seg * 0.65)), p = g.attributes.position, v = new THREE.Vector3();
  const f = (q) => sgn(q) * Math.abs(q) ** (2 / n);
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); p.setXYZ(i, (f(v.x) * w) / 2, (f(v.y) * h) / 2, (f(v.z) * d) / 2); }
  g.computeVertexNormals(); return g;
}
// a soft round glow texture (white centre to clear), for additive sprites and ground glows
function glowTex(r, g, b) {
  const [c, x] = canvas(128, 128), gr = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  for (let i = 0; i <= 10; i++) { const k = i / 10; gr.addColorStop(k, `rgba(${r},${g},${b},${(0.9 * Math.pow(1 - k, 2.6)).toFixed(3)})`); }
  x.fillStyle = gr; x.fillRect(0, 0, 128, 128); return tex(c);
}
function glowSprite(parent, color3, scale, order = 6) {
  const m = new THREE.SpriteMaterial({ map: glowTex(...color3), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0, toneMapped: false });
  m.userData.noOutline = true; const s = steamy(new THREE.Sprite(m), order); s.scale.setScalar(scale); parent.add(s); return s;
}
// a cel-banded flame set: tongues (flat-shaded cones, four bands: red rim, orange, yellow, white-yellow core) that
// flicker on the clip clock, the campfire's style (props-dino.js campfire)
const FLAME_COLS = ["#e8431a", "#ff8a1f", "#ffc531", "#fff1b0"];
const FLAME_MATS = () => FLAME_COLS.map((c) => basic(c, { opacity: 0.95 }));
function flameTongue(parent, mats, band, r, x, z, order = 6) {
  const c = steamy(new THREE.Mesh(new THREE.ConeGeometry(r, 1, 7), mats[band]), order + band); c.position.set(x, 0, z); parent.add(c); return c;
}

// ---------------------------------------------------------------------------------------------------------------
// domecamp: the three-person dome. The fly is a height field y = H (1 - rho^2)^0.8 over a rounded-rectangle footprint
// (rho 1 at the rim, 0 at the peak), drawn as one polar grid (angle round, rho in from the rim); a painted alpha map
// cuts the door's D, the mesh window and the claw rips out of it, and the same grid seen from inside (dark green)
// shows through those holes.
const DA = 1.3, DB = 1.1, DH = 1.45, DP = 2.6, DM = 0.8;       // half width, half depth, peak, footprint squareness, wall
const TAU = Math.PI * 2;
const rhoY = (y) => Math.sqrt(Math.max(0, 1 - Math.pow(clamp(y / DH), 1 / DM)));
const frontPt = (x, y) => { const r = rhoY(y), q = Math.max(0, Math.pow(r, DP) - Math.pow(Math.abs(x) / DA, DP)); return [x, y, DB * Math.pow(q, 1 / DP)]; };
const leftPt = (z, y) => { const r = rhoY(y), q = Math.max(0, Math.pow(r, DP) - Math.pow(Math.abs(z) / DB, DP)); return [-DA * Math.pow(q, 1 / DP), y, z]; };
function domeN(x, z) {   // outward unit normal at the surface point over (x, z)
  const ax = Math.abs(x) / DA, az = Math.abs(z) / DB, r = Math.max(1e-3, Math.pow(Math.pow(ax, DP) + Math.pow(az, DP), 1 / DP));
  const q = Math.pow(r, 1 - DP), Fr = DH * DM * Math.pow(Math.max(1e-3, 1 - r * r), DM - 1) * (-2 * r);
  const Fx = Fr * q * Math.pow(ax, DP - 1) * sgn(x) / DA, Fz = Fr * q * Math.pow(az, DP - 1) * sgn(z) / DB, l = Math.hypot(Fx, 1, Fz);
  return [-Fx / l, 1 / l, -Fz / l];
}
const polarPt = (al, rho) => { const c = Math.cos(al), s = Math.sin(al); return [DA * rho * sgn(c) * Math.abs(c) ** (2 / DP), DH * Math.pow(Math.max(0, 1 - rho * rho), DM), DB * rho * sgn(s) * Math.abs(s) ** (2 / DP)]; };
// the dome point (x, y, z) in the canvas of its polar uv: x = angle round (0 at +x, to +z at a quarter), y = rho
function uvPx(p, W, H) {
  const r = Math.max(rhoY(p[1]), 1e-3), cx = sgn(p[0]) * Math.min(1, Math.abs(p[0]) / (DA * r)) ** (DP / 2), sz = sgn(p[2]) * Math.min(1, Math.abs(p[2]) / (DB * r)) ** (DP / 2);
  let a = Math.atan2(sz, cx); if (a < 0) a += TAU; return [(a / TAU) * W, r * H];
}
// the door's D: straight sides up to 0.45, a half ellipse above (top 0.95); half width 0.5
const DOOR = { hw: 0.5, hs: 0.45, top: 0.95 };
const doorHW = (y) => (y <= DOOR.hs ? DOOR.hw : DOOR.hw * Math.sqrt(Math.max(0, 1 - ((y - DOOR.hs) / (DOOR.top - DOOR.hs)) ** 2)));
const WIN = { z0: -0.35, z1: 0.35, y0: 0.4, y1: 0.9 };         // the mesh window on the left (-x) wall
// the four claw slits (front-top of the fly): their x at y, slit i of 0..3, from the top YT down to YT - RIPLEN
const YT = 1.22, RIPLEN = 0.74, SLX = [-0.21, -0.07, 0.07, 0.21], SLF = [-0.07, -0.025, 0.025, 0.07];
const slitX = (i, y) => SLX[i] + SLF[i] * ((YT - y) / RIPLEN);

function domeCanvases() {
  // colour map (1024 x 512): green fly, soft blotches, darker seams along the poles and panel joins, a hem at the rim
  const W = 1024, H = 512, [c, g] = canvas(W, H);
  g.fillStyle = "#3f6b3a"; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 220; i++) { const a = rnd(i + 1), b = rnd(i + 2); g.fillStyle = `rgba(${i % 2 ? "25,50,25" : "150,190,120"},0.05)`; g.beginPath(); g.ellipse(a * W, b * H, 14 + a * 50, 5 + b * 16, i, 0, TAU); g.fill(); }
  g.strokeStyle = "rgba(60,100,55,0.35)"; g.lineWidth = 2;
  for (let k = 0; k < 4; k++) { const x = (k / 4) * W; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
  g.strokeStyle = "#2c4a2a"; g.lineWidth = 7;                    // the pole sleeves, corner to corner
  for (let k = 0; k < 4; k++) { const x = ((k + 0.5) / 4) * W; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
  g.fillStyle = "#2c4a2a"; g.fillRect(0, H * 0.972, W, H * 0.03);   // the hem
  // dark bindings round the door's D and the window
  g.lineWidth = 9; g.lineJoin = "round";
  const outline = (pts) => { g.beginPath(); pts.forEach((p, i) => { const q = uvPx(p, W, H); i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); }); g.closePath(); g.stroke(); };
  outline(doorPoly(1.05)); outline(winPoly(1.0));
  return { base: c, W, H };
}
function doorPoly(k = 1) {
  const pts = [];
  for (let y = 0; y <= DOOR.top * k + 1e-6; y += 0.05) pts.push(frontPt(doorHW(y / k) * k, y));
  for (let y = DOOR.top * k; y >= 0; y -= 0.05) pts.push(frontPt(-doorHW(y / k) * k, y));
  return pts;
}
// the door's mesh window: the upper 60% of the door (y 0.38 and up) as a D inset 6 cm from the door's outline (straight sides
// to 0.45, a half ellipse above, top 0.89), as a polygon in the door panel's texture (u = x / half width at y, v = y / 0.97)
const DMESH = { y0: 0.38, hw: DOOR.hw - 0.06, top: DOOR.top - 0.06 };
const dmeshHW = (y) => (y <= DOOR.hs ? DMESH.hw : DMESH.hw * Math.sqrt(Math.max(0, 1 - ((y - DOOR.hs) / (DMESH.top - DOOR.hs)) ** 2)));
function dmeshPath(g, cw, ch) {
  const pt = (sgn, y) => { const yy = Math.min(y, DMESH.top - 0.0005), u = 0.5 + 0.5 * sgn * dmeshHW(yy) / doorHW(Math.min(yy, DOOR.top - 0.001)); return [u * cw, ch - (y / 0.97) * ch]; };
  g.beginPath(); let first = true;
  for (let y = DMESH.y0; y <= DMESH.top + 1e-6; y += 0.01) { const [x, py] = pt(1, y); first ? g.moveTo(x, py) : g.lineTo(x, py); first = false; }
  for (let y = DMESH.top; y >= DMESH.y0 - 1e-6; y -= 0.01) { const [x, py] = pt(-1, y); g.lineTo(x, py); }
  g.closePath();
}
function winPoly(k = 1) {
  const pts = [], h = 0.5 * (WIN.y1 + WIN.y0), dh = 0.5 * (WIN.y1 - WIN.y0) * k, hz = 0.5 * (WIN.z1 - WIN.z0) * k;
  for (let i = 0; i <= 8; i++) pts.push(leftPt(-hz + (2 * hz * i) / 8, h - dh));
  for (let i = 0; i <= 8; i++) pts.push(leftPt(hz, h - dh + (2 * dh * i) / 8));
  for (let i = 0; i <= 8; i++) pts.push(leftPt(hz - (2 * hz * i) / 8, h + dh));
  for (let i = 0; i <= 8; i++) pts.push(leftPt(-hz, h + dh - (2 * dh * i) / 8));
  return pts;
}

export const BEARCAMP_GRIPS = {
  cardoor: { edge: [0.03, 1.6, -0.08] },       // the top corner at the hinge edge, where the bear's paw pulls
  cookpot: { handle: [0.28, 0.115, 0] },       // the handle near its end: a fist round it, like a frying pan
  burnbranch: { hold: [0, 0.08, 0] },          // 0.08 up from the held end
};

// the hatchback's driver door in its hinge frame: origin at the hinge edge on the bottom edge, the door runs back along -z
// (1.1 long), up +y (1.64), its outer skin facing +x. shattered: the cardoor (jagged glass in the frame, torn metal at the
// hinge edge); otherwise the whole glass (campcar)
const DOORD = { l: 1.1, h: 1.64, belt: 0.54 };
function buildDoor(parent, paint, shattered) {
  const g = new THREE.Group(); parent.add(g);
  const dark = mat("#2b2b30", { roughness: 0.6 }), trim = mat("#3a3640", { roughness: 0.6 }), chrome = mat("#dfe3ea", { roughness: 0.22, metalness: 0.75 });
  mesh(pad(0.07, DOORD.belt, DOORD.l, 6), paint, g, 0, DOORD.belt / 2, -DOORD.l / 2);                                     // the lower panel
  mesh(new THREE.BoxGeometry(0.075, 0.03, DOORD.l - 0.04), trim, g, 0, DOORD.belt + 0.005, -DOORD.l / 2);                  // the belt strip
  const fr = [[0.02, DOORD.belt, -0.05], [0.02, DOORD.h - 0.02, -0.3], [0.02, DOORD.h - 0.02, -0.92], [0.02, DOORD.belt, -1.06]];
  mesh(tubeGeo(fr, 0.04, 8, true), paint, g);                                                                              // the window frame
  mesh(pad(0.04, 0.05, 0.2, 4), chrome, g, 0.04, 0.46, -0.85).castShadow = false;                                          // the handle
  mesh(new THREE.BoxGeometry(0.05, 0.12, 0.07), dark, g, -0.01, 0.12, -0.03); mesh(new THREE.BoxGeometry(0.05, 0.12, 0.07), dark, g, -0.01, 0.45, -0.03);   // hinge leaves
  // the glass, in the frame's plane (shape x = -z, so the pane faces +x)
  const inner = [[-0.1, 0.6], [-0.33, 1.56], [-0.88, 1.56], [-1.02, 0.6]];
  const sh = new THREE.Shape(inner.map(([z, y]) => new THREE.Vector2(-z, y)));
  const glassG = new THREE.ShapeGeometry(sh); glassG.computeBoundingBox();
  { const b = glassG.boundingBox, uv = glassG.attributes.uv, p = glassG.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, (p.getX(i) - b.min.x) / (b.max.x - b.min.x), (p.getY(i) - b.min.y) / (b.max.y - b.min.y)); }
  glassG.rotateY(Math.PI / 2);
  let glassM;
  if (!shattered) { glassM = new THREE.MeshStandardMaterial({ color: "#d8eef8", roughness: 0.08, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide }); }
  else {
    const [c, x] = canvas(256, 256); x.clearRect(0, 0, 256, 256); x.fillStyle = "rgba(220,238,250,0.16)"; x.fillRect(0, 0, 256, 256);
    x.strokeStyle = "rgba(255,255,255,0.9)"; x.lineCap = "round";
    for (let i = 0; i < 16; i++) { x.lineWidth = 2.2; x.beginPath(); x.moveTo(110, 150); const a = (i / 16) * TAU + rnd(i) * 0.3; for (let r = 12; r < 150 + 80 * rnd(i + 9); r += 12) x.lineTo(110 + Math.cos(a) * r + 5 * Math.sin(r), 150 + Math.sin(a) * r + 5 * Math.cos(r * 1.3)); x.stroke(); }
    x.lineWidth = 1.2; for (let k = 1; k < 8; k++) { x.beginPath(); for (let i = 0; i <= 16; i++) { const a = (i / 16) * TAU, r = k * 22 * (0.8 + 0.4 * rnd(i + k * 5)); i ? x.lineTo(110 + Math.cos(a) * r, 150 + Math.sin(a) * r) : x.moveTo(110 + Math.cos(a) * r, 150 + Math.sin(a) * r); } x.stroke(); }
    x.globalCompositeOperation = "destination-out"; x.fillStyle = "#000"; x.beginPath(); for (let i = 0; i < 11; i++) { const a = (i / 11) * TAU, r = 34 + 30 * rnd(i + 20); i ? x.lineTo(150 + Math.cos(a) * r, 120 + Math.sin(a) * r * 0.8) : x.moveTo(150 + Math.cos(a) * r, 120 + Math.sin(a) * r * 0.8); } x.fill();
    glassM = new THREE.MeshStandardMaterial({ color: "#ffffff", map: tex(c), roughness: 0.1, transparent: true, depthWrite: false, side: THREE.DoubleSide });
  }
  glassM.userData.noOutline = true;
  const gm = mesh(glassG, glassM, g, 0.012, 0, 0); gm.castShadow = false;
  if (shattered) {
    const shardM = new THREE.MeshStandardMaterial({ color: "#e8f4fa", roughness: 0.1, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false }); shardM.userData.noOutline = true;
    for (let i = 0; i < 9; i++) {   // jagged teeth of glass still in the frame, pointing in
      const side = i % 3, t = 0.2 + 0.6 * rnd(i + 51), edge = side === 0 ? [lerp(-0.1, -0.33, t), lerp(0.6, 1.56, t), 0.75] : side === 1 ? [lerp(-1.02, -0.88, t), lerp(0.6, 1.56, t), -0.25] : [lerp(-0.33, -0.88, t), 1.56, 0], len = 0.1 + 0.16 * rnd(i + 60);
      const dz = side === 0 ? -1 : side === 1 ? 1 : 0, dy = side === 2 ? -1 : 0, p0 = [edge[0], edge[1]], tri = new THREE.Shape([new THREE.Vector2(-p0[0] + 0.02, p0[1] - 0.03), new THREE.Vector2(-p0[0] - 0.02, p0[1] + 0.03), new THREE.Vector2(-(p0[0] + dz * len * 0.8), p0[1] + dy * len)]);
      const tg = new THREE.ShapeGeometry(tri); tg.rotateY(Math.PI / 2); const m = mesh(tg, shardM, g, 0.014, 0, 0); m.castShadow = false;
    }
    for (let i = 0; i < 5; i++) {   // the hinge edge torn out of the body: bent, ragged metal
      const y = 0.06 + i * 0.12 + 0.05 * rnd(i + 80), w = 0.05 + 0.07 * rnd(i + 81), m = mesh(new THREE.BoxGeometry(0.02, 0.08 + 0.05 * rnd(i + 82), w), paint, g, 0.0, y + 0.04, 0.012 + w / 2 - 0.01); m.rotation.set(0.5 * (rnd(i + 83) - 0.5), 0.6 * (rnd(i + 84) - 0.5), 0.9 * (rnd(i + 85) - 0.5));
    }
  }
  return g;
}

export const BEARCAMP_KINDS = {
  domecamp(P) {
    const S = P.spec, NA = 96, NR = 40, CW = 2048, CH = 1024;
    const { base } = domeCanvases();
    // the cloth's map with the cuts (the door's D, the window, the claw slits and the strips' footprints) erased from its
    // own alpha: the look swaps standard materials for toon ones that keep map and alphaTest but not alphaMap
    const [ac, ag] = canvas(CW, CH), alpha = tex(ac);
    // the fly's polar grid
    const fly = gridGeo(NA, NR), rest = [], restN = [];
    {
      const pos = fly.attributes.position.array, uv = fly.attributes.uv.array;
      for (let i = 0; i <= NA; i++) for (let j = 0; j <= NR; j++) {
        const k = i * (NR + 1) + j, rho = 1 - Math.pow(j / NR, 1.7), p = polarPt((i / NA) * TAU, rho);
        pos[k * 3] = p[0]; pos[k * 3 + 1] = p[1]; pos[k * 3 + 2] = p[2]; uv[k * 2] = i / NA; uv[k * 2 + 1] = 1 - rho; rest.push(p);
      }
      fly.computeVertexNormals(); weld(fly, NA, NR);
      const nrm = fly.attributes.normal.array, q = (NA / 4) * (NR + 1) + Math.round(NR * 0.4), n0 = domeN(rest[q][0], rest[q][2]);
      if (nrm[q * 3] * n0[0] + nrm[q * 3 + 1] * n0[1] + nrm[q * 3 + 2] * n0[2] < 0) {   // faces inward: reverse the winding
        const ix = fly.index.array; for (let a = 0; a < ix.length; a += 3) { const t = ix[a + 1]; ix[a + 1] = ix[a + 2]; ix[a + 2] = t; } fly.index.needsUpdate = true;
      }
    }
    for (let k = 0; k < rest.length; k++) restN.push(domeN(rest[k][0], rest[k][2]));
    const flyM = mat("#ffffff", { map: alpha, alphaTest: 0.5, roughness: 0.72 });
    const inM = mat("#2a4a30", { map: alpha, alphaTest: 0.5, roughness: 1, side: THREE.BackSide, emissive: "#0e1c10", emissiveIntensity: 0.6 });
    flyM.userData.noOutline = inM.userData.noOutline = true;   // the ink hull would fill the cuts when seen from inside
    const flyMesh = mesh(fly, flyM, P.whole); flyMesh.frustumCulled = false;
    const inMesh = mesh(fly, inM, P.whole); inMesh.castShadow = inMesh.receiveShadow = false; inMesh.frustumCulled = false; flyMesh.receiveShadow = false;   // no self-shadow on the cloth (acne on its dark side)
    // floor tub: a tan rim round the base and the floor inside
    // (two arcs: the door half, and the back half which `cut` lowers to a 4 cm lip)
    const rimArc = (a0, a1, y) => { const pts = []; for (let i = 0; i <= 24; i++) { const a = lerp(a0, a1, i / 24), c = Math.cos(a), s = Math.sin(a); pts.push([1.012 * DA * sgn(c) * Math.abs(c) ** (2 / DP), y, 1.012 * DB * sgn(s) * Math.abs(s) ** (2 / DP)]); } return pts; };
    const rimM = mat("#8a7a5a", { roughness: 0.95 });
    mesh(tubeGeo(rimArc(0, Math.PI, 0.05), 0.05, 8, false), rimM, P.whole);
    const rimBack = mesh(tubeGeo(rimArc(Math.PI, TAU, 0.05), 0.05, 8, false), rimM, P.whole); let lastCut = 0;
    {
      const sh = new THREE.Shape(); for (let i = 0; i < 64; i++) { const a = (i / 64) * TAU, c = Math.cos(a), s = Math.sin(a), x = 0.99 * DA * sgn(c) * Math.abs(c) ** (2 / DP), z = 0.99 * DB * sgn(s) * Math.abs(s) ** (2 / DP); i ? sh.lineTo(x, -z) : sh.moveTo(x, -z); }
      const fl = mesh(new THREE.ShapeGeometry(sh), mat("#6f6046", { roughness: 1 }), P.whole, 0, 0.03, 0); fl.rotation.x = -Math.PI / 2; fl.castShadow = false;
    }
    // two crossing poles (sleeves under the fly, seen as ridges), corner to corner
    const poleM = mat("#365f33", { roughness: 0.6 });
    const poles = [0, 1].map((n) => mesh(new THREE.BufferGeometry(), poleM, P.whole)); poles.forEach((p) => { p.frustumCulled = false; });
    // the door's panel (a D on the fly) and its roll at the top edge
    const panelM = (() => { const [c, g] = canvas(256, 288); g.fillStyle = "#437040"; g.fillRect(0, 0, 256, 288);
      for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(${i % 2 ? "25,50,25" : "150,190,120"},0.06)`; g.beginPath(); g.ellipse(rnd(i + 5) * 256, rnd(i + 6) * 288, 10 + rnd(i) * 30, 4 + rnd(i + 3) * 10, i, 0, TAU); g.fill(); }
      g.strokeStyle = "#2c4a2a"; g.lineWidth = 8; g.beginPath();   // the D: binding, then the zip's stitched track just inside
      for (let y = 0; y <= DOOR.top; y += 0.02) { const px = 128 + (doorHW(y) / 0.52) * 128, py = 288 - (y / 0.97) * 288; y ? g.lineTo(px, py) : g.moveTo(px, py); }
      for (let y = DOOR.top; y >= 0; y -= 0.02) { const px = 128 - (doorHW(y) / 0.52) * 128, py = 288 - (y / 0.97) * 288; g.lineTo(px, py); } g.stroke();
      g.strokeStyle = "#b9c4a8"; g.lineWidth = 2; g.setLineDash([6, 5]); g.beginPath();
      for (let y = 0.03; y <= DOOR.top - 0.03; y += 0.02) { const px = 128 + ((doorHW(y) - 0.045) / 0.52) * 128, py = 288 - (y / 0.97) * 288; y > 0.03 ? g.lineTo(px, py) : g.moveTo(px, py); }
      g.stroke(); g.setLineDash([]); g.fillStyle = "#c9ccd2"; g.fillRect(34, 212, 14, 26);   // the zip pull
      g.globalCompositeOperation = "destination-out"; g.fillStyle = "#000"; dmeshPath(g, 256, 288); g.fill();   // the mesh window cut out of the cloth (alpha)
      g.globalCompositeOperation = "source-over"; g.strokeStyle = "#2c4a2a"; g.lineWidth = 5; g.lineJoin = "round"; dmeshPath(g, 256, 288); g.stroke();   // its binding
      const m = mat("#ffffff", { map: tex(c), alphaTest: 0.5, roughness: 0.72, side: THREE.DoubleSide }); m.userData.noOutline = true; return m; })();
    // the same cut filled with fine dark mesh (a faint grid, see-through), on the panel's own grid so it rolls down with it
    const dmeshM = (() => { const [c, g] = canvas(256, 288); g.save(); dmeshPath(g, 256, 288); g.clip(); g.fillStyle = "rgba(10,14,12,0.1)"; g.fillRect(0, 0, 256, 288);
      g.strokeStyle = "rgba(8,10,8,0.55)"; g.lineWidth = 1.4; for (let i = 0; i <= 256; i += 5) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 288); g.stroke(); } for (let i = 0; i <= 288; i += 5) { g.beginPath(); g.moveTo(0, i); g.lineTo(256, i); g.stroke(); } g.restore();
      const m = new THREE.MeshBasicMaterial({ map: tex(c), transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: true }); m.userData.noOutline = true; return m; })();
    const NDX = 14, NDY = 20, panel = gridGeo(NDX, NDY), panelMesh = mesh(panel, panelM, P.whole); panelMesh.frustumCulled = false;
    const dmeshMesh = steamy(new THREE.Mesh(panel, dmeshM), 4); P.whole.add(dmeshMesh);
    const rollM = mat("#3a6436", { roughness: 0.8 }), roll = mesh(new THREE.BufferGeometry(), rollM, P.whole); roll.frustumCulled = false;
    // the mesh window on the left wall: see-through, a faint dark grid
    const winM = (() => { const [c, g] = canvas(128, 92); g.fillStyle = "rgba(10,14,12,0.1)"; g.fillRect(0, 0, 128, 92);
      g.strokeStyle = "rgba(8,10,8,0.55)"; g.lineWidth = 1.4; for (let i = 0; i <= 128; i += 4) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 92); g.stroke(); } for (let i = 0; i <= 92; i += 4) { g.beginPath(); g.moveTo(0, i); g.lineTo(128, i); g.stroke(); }
      const m = new THREE.MeshBasicMaterial({ map: tex(c), transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: true }); m.userData.noOutline = true; return m; })();
    const NWX = 10, NWY = 8, win = gridGeo(NWX, NWY), winMesh = steamy(new THREE.Mesh(win, winM), 4); P.whole.add(winMesh);
    // claw strips (three between the four slits) hanging out of the rip
    const stripM = mat("#3f6b3a", { roughness: 0.78, side: THREE.DoubleSide });
    const NSX = 6, NSY = 14, strips = [0, 1, 2].map(() => { const g = gridGeo(NSX, NSY), m = mesh(g, stripM, P.whole); m.frustumCulled = false; m.receiveShadow = false; return { g, m }; });

    const flyAt = (p, off, d) => { const n = domeN(p[0], p[2]), k = off + d; return [p[0] + n[0] * k, p[1] + n[1] * k, p[2] + n[2] * k]; };
    let lastKey = "", lastAlpha = "";
    const drawAlpha = (rip, cut) => {
      ag.globalCompositeOperation = "source-over"; ag.clearRect(0, 0, CW, CH); ag.drawImage(base, 0, 0, CW, CH); ag.globalCompositeOperation = "destination-out"; ag.fillStyle = "#000";
      const poly = (pts) => { ag.beginPath(); pts.forEach((p, i) => { const q = uvPx(p, CW, CH); i ? ag.lineTo(q[0], q[1]) : ag.moveTo(q[0], q[1]); }); ag.closePath(); ag.fill(); };
      poly(doorPoly(1)); poly(winPoly(1));
      if (cut) ag.fillRect(CW / 2, 0, CW / 2 + 1, CH);   // the wild wall: the back half (-z, a from pi to 2 pi) not drawn, the seam on the z = 0 grid line
      const rr = clamp(rip), len = RIPLEN * clamp(rr / 0.55);
      if (len > 0.02) {
        for (let i = 0; i < 4; i++) {   // the slits: ragged ribbons
          const L = [], R = []; for (let y = YT, k = 0; y >= YT - len - 1e-6; y -= 0.03, k++) { const hw = 0.012 + 0.008 * rnd(i * 31 + k) + 0.012 * rr, x = slitX(i, y); L.push(frontPt(x - hw, y)); R.push(frontPt(x + hw, y)); }
          poly([...L, ...R.reverse()]);
        }
        if (rr > 0.3) for (let s = 0; s < 3; s++) {   // each strip's footprint, ragged at its free end
          const L = [], R = []; for (let y = YT; y >= YT - len - 1e-6; y -= 0.03) { L.push(frontPt(slitX(s, y) + 0.014, y)); R.push(frontPt(slitX(s + 1, y) - 0.014, y)); }
          const yEnd = YT - len, teeth = [0, 1, 2, 3].map((k) => frontPt(lerp(slitX(s, yEnd) + 0.014, slitX(s + 1, yEnd) - 0.014, k / 3), yEnd + (k % 2 ? 0.0 : 0.05 * rnd(s * 7 + k + 1))));
          poly([...L, ...teeth, ...R.reverse()]);
        }
      }
      alpha.needsUpdate = true;
    };
    drawAlpha(0, 0); lastAlpha = "0|0";
    return {
      grip: 0,
      apply(ps, t) {
        const tt = t ?? 0, op = clamp(num(ps, S, "open")), rip = clamp(num(ps, S, "rip")), push = clamp(num(ps, S, "push")), flut = clamp(num(ps, S, "flutter")), cut = num(ps, S, "cut") >= 0.5 ? 1 : 0;
        const key = [op, rip, push, flut, cut, flut > 0 || rip > 0.6 ? tt.toFixed(3) : 0].join("|"); if (key === lastKey) return; lastKey = key;
        const ak = Math.round(rip * 40) + "|" + cut; if (ak !== lastAlpha) { lastAlpha = ak; drawAlpha(rip, cut); }
        if (cut !== lastCut) { lastCut = cut; rimBack.geometry.dispose(); rimBack.geometry = tubeGeo(rimArc(Math.PI, TAU, cut ? 0.02 : 0.05), cut ? 0.02 : 0.05, 8, false); }
        // displacement along the fly's normal at a rest point: the bear's push (in) and the wind's ripple
        const disp = (x, y, z) => {
          const bulge = Math.exp(-((x / 0.62) ** 2 + ((y - 0.78) / 0.55) ** 2)) * smooth((z + 0.2) / 0.6);
          return -0.35 * push * bulge + flut * (0.4 + 0.6 * y / DH) * (0.014 * Math.sin(x * 5.1 + y * 3.7 + tt * 7.3) + 0.009 * Math.sin(z * 6.3 - y * 4.1 + tt * 11.1));
        };
        const pos = fly.attributes.position.array;
        for (let k = 0; k < rest.length; k++) { const p = rest[k], n = restN[k], d = push > 0 || flut > 0 ? disp(p[0], p[1], p[2]) : 0; pos[k * 3] = p[0] + n[0] * d; pos[k * 3 + 1] = p[1] + n[1] * d; pos[k * 3 + 2] = p[2] + n[2] * d; }
        fly.attributes.position.needsUpdate = true; fly.computeVertexNormals(); weld(fly, NA, NR); fly.computeBoundingSphere();
        // poles
        poles.forEach((pm, n) => { const pts = []; for (let i = -12; i <= 12; i++) { const r = Math.abs(i) / 12, p = polarPt(i < 0 ? (n ? 0.75 : 0.25) * Math.PI + Math.PI : (n ? 0.75 : 0.25) * Math.PI, r); pts.push(flyAt(p, 0.006, disp(p[0], p[1], p[2]))); } pm.geometry.dispose(); pm.geometry = tubeGeo(pts, 0.02, 6); });
        // the door panel: the D below its rolled-up top edge Y; the roll sits on that edge
        const Y = Math.max(0.06, DOOR.top * (1 - op)), cutK = 1.04;
        fill(panel, NDX, NDY, (u, v) => { const y = Y * v, x = (u * 2 - 1) * doorHW(Math.min(y, DOOR.top - 0.001)) * cutK, p = frontPt(x, y); return flyAt(p, 0.014, disp(p[0], p[1], p[2])); });
        { const uv = panel.attributes.uv.array; for (let i = 0; i <= NDX; i++) for (let j = 0; j <= NDY; j++) { const k = (i * (NDY + 1) + j) * 2; uv[k] = i / NDX; uv[k + 1] = (Y * (j / NDY)) / 0.97; } panel.attributes.uv.needsUpdate = true; }
        panelMesh.visible = dmeshMesh.visible = op < 0.995;
        roll.visible = op > 0.02;
        if (roll.visible) { const rr = 0.012 + 0.05 * op, hw = Math.max(0.1, doorHW(Math.min(Y, DOOR.top - 0.001))) * cutK, pts = [];
          for (let i = 0; i <= 12; i++) { const x = (i / 6 - 1) * hw, p = frontPt(x, Y); pts.push(flyAt(p, 0.014 + rr * 0.9, disp(p[0], p[1], p[2]))); } roll.geometry.dispose(); roll.geometry = tubeGeo(pts, rr, 10); }
        // the window
        fill(win, NWX, NWY, (u, v) => { const z = lerp(cut ? 0 : WIN.z0, WIN.z1, u), y = lerp(WIN.y0, WIN.y1, v), p = leftPt(z, y); return flyAt(p, 0.004, disp(p[0], p[1], p[2])); });
        // the claw strips: from the slit's top, lifting off the fly as they hang and splaying a little
        const len = RIPLEN * clamp(rip / 0.55), lift = smooth((rip - 0.3) / 0.7);
        strips.forEach(({ g, m }, s) => {
          m.visible = rip > 0.3; if (!m.visible) return;
          fill(g, NSX, NSY, (u, v) => {
            const y = YT - len * v - (v > 0.93 && (Math.round(u * NSX) % 2) ? 0.05 : 0), xl = slitX(s, y) + 0.014, xr = slitX(s + 1, y) - 0.014, xc = (xl + xr) / 2;
            const x = xc + (lerp(xl, xr, u) - xc) * (1 + 0.15 * lift * v) + (xc - lerp(SLX[1], SLX[2], 0.5)) * 0.35 * lift * v;
            const p = frontPt(x, y), off = 0.016 + lift * (0.02 + 0.24 * Math.pow(v, 1.5)) * (1 + 0.25 * Math.sin(s * 2.1 + u * 3)) + flut * 0.03 * v * Math.sin(tt * 9 + s * 1.7 + v * 5);
            return flyAt(p, off, disp(p[0], p[1], p[2]) * 0.6);
          });
        });
      },
    };
  },

  // -------------------------------------------------------------------------------------------------------------
  campcar(P) {
    const S = P.spec, car = buildHatchback({ kind: "hatchback", color: S.color ?? "#8d9297", plate: false, wheel: S.wheel });
    P.whole.add(car.root);
    car.root.traverse((o) => { o.frustumCulled = false; if (o.material && o.material.isMeshStandardMaterial && o.material.emissiveIntensity > 0) o.material.emissiveIntensity *= 0.16; });   // the studio paint glow is too bright at night
    // the headlamp domes: their own material, dull when off, white-hot when on
    const lampM = basic(S.lampColor ?? "#fff6c8", { transparent: false, depthWrite: true }), lamps = [];
    car.root.traverse((o) => { if (o.isMesh && o.material && o.material.isMeshBasicMaterial && o.material.color.getHexString() === "fff6c8") { o.material = lampM; lamps.push(o); } });
    // the windscreen: a crazed, sagging pane over the plain one
    const gl = []; car.root.traverse((o) => { if (o.name === "hatchback-glass") gl.push(o); });
    const w0 = gl[0], GW = w0.geometry.parameters.width, GH = w0.geometry.parameters.height;
    const [cc, cg] = canvas(512, 320), crackT = tex(cc), crackG = gridGeo(24, 16);
    const crackM = new THREE.MeshStandardMaterial({ color: "#ffffff", map: crackT, transparent: true, depthWrite: false, roughness: 0.1, side: THREE.DoubleSide }); crackM.userData.noOutline = true;
    const crack = mesh(crackG, crackM, car.root); crack.position.copy(w0.position); crack.rotation.copy(w0.rotation); crack.castShadow = false; crack.visible = false;
    const HIT = S.hit ?? [0.3, 0.12];   // the impact point on the pane (metres from its middle: right, up)
    const drawCracks = (k) => {
      cg.clearRect(0, 0, 512, 320);
      const hx = (HIT[0] / GW + 0.5) * 512, hy = (0.5 - HIT[1] / GH) * 320, reach = 40 + 620 * k;
      const fr = cg.createRadialGradient(hx, hy, 0, hx, hy, reach * 0.9); fr.addColorStop(0, `rgba(235,245,255,${0.5 * k})`); fr.addColorStop(1, "rgba(235,245,255,0)"); cg.fillStyle = fr; cg.fillRect(0, 0, 512, 320);
      cg.lineCap = "round"; cg.strokeStyle = `rgba(255,255,255,${0.35 + 0.6 * k})`;
      const NRAD = 18, ang = (i) => (i / NRAD) * TAU + rnd(i + 3) * 0.3, rad = (i) => reach * (0.35 + 0.65 * rnd(i + 40)), at = (i, r) => [hx + Math.cos(ang(i)) * r * 1.0 + 6 * Math.sin(r * 0.11 + i), hy + Math.sin(ang(i)) * r * 0.8 + 5 * Math.cos(r * 0.13 + i)];
      for (let i = 0; i < NRAD; i++) { cg.lineWidth = 2.4; cg.beginPath(); cg.moveTo(hx, hy); for (let r = 14; r <= rad(i); r += 14) { const p = at(i, r); cg.lineTo(p[0], p[1]); } cg.stroke(); }
      cg.lineWidth = 1.3;
      for (let ring = 1; ring <= 9; ring++) { const r = ring * 34 * (0.75 + 0.5 * rnd(ring)); if (r > reach) break; for (let i = 0; i < NRAD; i++) { if (rad(i) < r || rad((i + 1) % NRAD) < r) continue; const a = at(i, r), b = at((i + 1) % NRAD, r); cg.beginPath(); cg.moveTo(a[0], a[1]); cg.lineTo((a[0] + b[0]) / 2 + 4 * rnd(i + ring), (a[1] + b[1]) / 2 + 4 * rnd(i + ring + 9)); cg.lineTo(b[0], b[1]); cg.stroke(); } }
      if (k > 0.75) { cg.globalCompositeOperation = "destination-out"; cg.fillStyle = "#000"; cg.beginPath(); for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU, r = (16 + 22 * rnd(i + 70)) * (k - 0.6) * 2.5; i ? cg.lineTo(hx + Math.cos(a) * r, hy + Math.sin(a) * r) : cg.moveTo(hx + Math.cos(a) * r, hy + Math.sin(a) * r); } cg.fill(); cg.globalCompositeOperation = "source-over"; }
      crackT.needsUpdate = true;
    };
    // the driver's door (+x), hinged at its front edge
    const hinge = new THREE.Group(); hinge.position.set(HATCH.W + 0.02, 0.36, 0.74); car.root.add(hinge);
    const doorPaint = mat(S.color ?? "#8d9297", { roughness: 0.32, metalness: 0.05, emissive: S.color ?? "#8d9297", emissiveIntensity: 0.115 });
    buildDoor(hinge, doorPaint, false);
    const stubs = [0.12, 0.45].map((y) => mesh(new THREE.BoxGeometry(0.05, 0.12, 0.07), mat("#2b2b30", { roughness: 0.6 }), car.root, HATCH.W + 0.02, 0.36 + y, 0.74)); stubs.forEach((s) => { s.visible = false; });
    // the lights: two soft beams 6 m long, a glow on each lamp and one spot on the grass
    const beamM = (() => { const m = new THREE.ShaderMaterial({ uniforms: { uA: { value: 0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      vertexShader: "varying vec3 vN; varying vec3 vV; varying float vF; void main() { vF = uv.y; vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position, 1.0); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }",
      fragmentShader: "uniform float uA; varying vec3 vN; varying vec3 vV; varying float vF; void main() { float e = pow(abs(dot(normalize(vN), normalize(vV))), 1.4); float a = uA * e * pow(vF, 1.3) * 0.5; if (a < 0.003) discard; gl_FragColor = vec4(vec3(1.0, 0.95, 0.74) * a, a); }" }); m.userData.noOutline = true; return m; })();
    const beams = [-1, 1].map((s) => { const g = new THREE.ConeGeometry(0.95, 6, 28, 1, true); g.translate(0, -3, 0); g.rotateX(-Math.PI / 2); const b = steamy(new THREE.Mesh(g, beamM), 7); b.position.set(s * 0.66, 0.78, 1.6); b.rotation.x = 0.05; car.root.add(b); return b; });
    const flares = [-1, 1].map((s) => { const f = glowSprite(car.root, [255, 244, 200], 1.1, 8); f.position.set(s * 0.66, 0.78, 1.7); return f; });
    const spot = new THREE.SpotLight("#fff1c8", 0, 14, 0.5, 0.8, 1.4); spot.position.set(0, 0.85, 1.6); spot.target.position.set(0, 0.2, 9); spot.castShadow = false; if (S.light !== false) { car.root.add(spot); car.root.add(spot.target); }
    let last = "", lastCrack = -1;
    return {
      grip: 0,
      apply(ps) {
        const smash = clamp(ps.smash ?? S.smash ?? 0), door = clamp(num(ps, S, "door")), torn = num(ps, S, "torn") >= 0.5, lights = clamp(ps.lights ?? 0), flash = num(ps, S, "flash");
        const blink = flash > 0 && flash % 1 >= 0.5 ? 0 : 1, on = lights * blink, key = [smash, door, torn, on].join("|"); if (key === last) return; last = key;
        const qs = Math.round(smash * 50); if (qs !== lastCrack) { lastCrack = qs; if (smash > 0) drawCracks(smash); }
        crack.visible = smash > 0; w0.visible = smash <= 0;
        const sx = HIT[0], sy = HIT[1];
        fill(crackG, 24, 16, (u, v) => { const x = (u - 0.5) * GW, y = (v - 0.5) * GH, d2 = (x - sx) ** 2 + (y - sy) ** 2; return [x, y, 0.004 - smash * (0.025 + 0.15 * smash * Math.exp(-d2 / 0.16))]; });
        hinge.visible = !torn; hinge.rotation.y = -1.22 * door; stubs.forEach((s) => { s.visible = torn; });
        lampM.color.set(on > 0.02 ? "#fffbe6" : "#6a6f78");
        beams.forEach((b) => { b.visible = on > 0.01; }); beamM.uniforms.uA.value = on;
        flares.forEach((f) => { f.material.opacity = on * 0.85; f.visible = on > 0.01; }); spot.intensity = 9 * on;
      },
    };
  },

  // -------------------------------------------------------------------------------------------------------------
  cardoor(P) {
    const S = P.spec, paint = mat(S.color ?? "#8d9297", { roughness: 0.32, metalness: 0.05, emissive: S.color ?? "#8d9297", emissiveIntensity: 0.115 });
    buildDoor(P.whole, paint, true);
    return { grip: DOORD.h };
  },

  // -------------------------------------------------------------------------------------------------------------
  cooler(P) {
    const S = P.spec, BW = 0.72, BD = 0.46, BH = 0.4, LH = 0.09;
    const blotchTex = (base, dirt, n) => {
      const [c, g] = canvas(256, 256); g.fillStyle = base; g.fillRect(0, 0, 256, 256);
      for (let i = 0; i < n; i++) { const a = rnd(i + 1), b = rnd(i + 2); g.fillStyle = `rgba(${dirt},${0.04 + 0.05 * rnd(i + 3)})`; g.beginPath(); g.ellipse(a * 256, b * 256, 6 + a * 40, 3 + b * 12, i, 0, TAU); g.fill(); }
      g.strokeStyle = "rgba(255,255,255,0.25)"; g.lineWidth = 1; for (let i = 0; i < 14; i++) { const x = rnd(i + 90) * 256, y = rnd(i + 91) * 256, a = rnd(i + 92) * 3; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * (10 + 22 * rnd(i + 93)), y + Math.sin(a) * (10 + 22 * rnd(i + 93))); g.stroke(); }
      return tex(c);
    };
    const bodyM = mat("#ffffff", { map: blotchTex("#2f6fb0", "10,25,50", 70), roughness: 0.5 }), lidM = mat("#ffffff", { map: blotchTex("#e9eef2", "90,80,60", 60), roughness: 0.45 });
    const bodyG = pad(BW, BH, BD, 9, 36), lidG = pad(BW + 0.03, LH, BD + 0.03, 12, 36);
    const bodyR = bodyG.attributes.position.array.slice(), lidR = lidG.attributes.position.array.slice();
    const body = mesh(bodyG, bodyM, P.whole, 0, BH / 2, 0), lid = mesh(lidG, lidM, P.whole, 0, BH + LH / 2 - 0.012, 0);
    // the lid's groove, latch, hinges, handles, feet, drain plug
    const dark = mat("#2b3138", { roughness: 0.6 }), grey = mat("#cfd6dc", { roughness: 0.5 });
    mesh(new THREE.BoxGeometry(BW * 0.94, 0.012, BD * 0.94), dark, P.whole, 0, BH - 0.004, 0).castShadow = false;
    mesh(pad(0.12, 0.09, 0.03, 4, 14), dark, P.whole, 0, BH - 0.01, BD / 2 + 0.008);                                        // the front latch
    for (const x of [-0.24, 0.24]) mesh(new THREE.BoxGeometry(0.1, 0.07, 0.03), dark, P.whole, x, BH + 0.01, -BD / 2 - 0.006);
    for (const s of [-1, 1]) {
      mesh(tubeGeo([[s * (BW / 2 - 0.02), 0.3, -0.11], [s * (BW / 2 + 0.035), 0.3, -0.11], [s * (BW / 2 + 0.05), 0.3, 0], [s * (BW / 2 + 0.035), 0.3, 0.11], [s * (BW / 2 - 0.02), 0.3, 0.11]], 0.014, 8), grey, P.whole);
      for (const z of [-0.2, 0.2]) mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.02, 10), dark, P.whole, s * 0.3, 0.012, z);
    }
    mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.02, 12), dark, P.whole, BW / 2 + 0.004, 0.08, -0.12).rotation.z = Math.PI / 2;
    let last = "";
    return {
      grip: BH + LH - 0.012,
      apply(ps) {
        const dn = clamp(num(ps, S, "dent")), key = String(dn); if (key === last) return; last = key;
        // a crushed corner: the top front corner on +x pushed in and down
        for (const [g, r, oy] of [[bodyG, bodyR, BH / 2], [lidG, lidR, BH + LH / 2 - 0.012]]) {
          const p = g.attributes.position.array;
          for (let i = 0; i < p.length; i += 3) {
            const x = r[i], y = r[i + 1] + oy, z = r[i + 2], d2 = (x - BW / 2) ** 2 + (z - BD / 2) ** 2 + 0.6 * (y - BH) ** 2, w = dn * Math.exp(-d2 / 0.03);
            p[i] = x - w * 0.06 * sgn(x); p[i + 1] = r[i + 1] - w * 0.035; p[i + 2] = z - w * 0.05 * sgn(z) + w * 0.012 * Math.sin(x * 40 + y * 30);
          }
          g.attributes.position.needsUpdate = true; g.computeVertexNormals(); g.computeBoundingSphere();
        }
      },
    };
  },

  // -------------------------------------------------------------------------------------------------------------
  cookpot(P) {
    const S = P.spec, R = S.r ?? 0.11, H = S.h ?? 0.15, T = 0.005, NS = 56;
    const brush = (() => { const [c, g] = canvas(256, 128); g.fillStyle = "#b9bec4"; g.fillRect(0, 0, 256, 128); for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(${i % 2 ? "255,255,255" : "60,66,74"},${0.05 + 0.06 * rnd(i)})`; g.fillRect(0, rnd(i + 1) * 128, 256, 0.7 + rnd(i + 2) * 1.2); } return tex(c, [3, 1]); })();
    const steel = mat("#ffffff", { map: brush, roughness: 0.36, metalness: 0.45, emissive: "#8a9098", emissiveIntensity: 0.05 });
    const inside = mat("#3a3e44", { roughness: 0.55, metalness: 0.3, side: THREE.DoubleSide });
    const prof = (pts) => pts.map(([r, y]) => new THREE.Vector2(r, y));
    const outerG = new THREE.LatheGeometry(prof([[0, 0], [R - 0.014, 0], [R - 0.006, 0.002], [R - 0.0012, 0.008], [R, 0.016], [R, H - 0.006], [R + 0.003, H - 0.002], [R + 0.003, H + 0.002]]), NS);
    const innerG = new THREE.LatheGeometry(prof([[R - 0.003, H + 0.002], [R - T, H - 0.004], [R - T, 0.014], [R - T - 0.004, T + 0.002], [0, T]]), NS);
    const outerR = outerG.attributes.position.array.slice(), innerR = innerG.attributes.position.array.slice();
    mesh(outerG, steel, P.whole); mesh(innerG, inside, P.whole);
    const rim = mesh(new THREE.BufferGeometry(), steel, P.whole);
    // ONE long handle on +x: a riveted base plate on the wall, a rounded strap 0.22 out, a hanging hole at its end
    const hy = H - 0.035, base = mesh(pad(0.05, 0.03, 0.036, 4, 14), steel, P.whole, R + 0.004, hy, 0);
    mesh(pad(0.24, 0.013, 0.03, 5, 18), steel, P.whole, R + 0.11, hy, 0);
    mesh(new THREE.TorusGeometry(0.008, 0.0028, 6, 14), steel, P.whole, R + 0.225, hy, 0).rotation.x = Math.PI / 2;
    for (const z of [-0.011, 0.011]) mesh(new THREE.SphereGeometry(0.0045, 8, 6), steel, P.whole, R + 0.018, hy + 0.012, z);
    void base;
    let last = "";
    return {
      grip: 0,
      apply(ps) {
        const dn = clamp(num(ps, S, "dent")), key = String(dn); if (key === last) return; last = key;
        // two dents in the rim on the -x side, a fang's width apart
        const bend = (r, a, y) => { let w = 0; for (const c of [Math.PI - 0.3, Math.PI + 0.3]) { let d = a - c; d = Math.atan2(Math.sin(d), Math.cos(d)); w = Math.max(w, Math.exp(-((d / 0.19) ** 2))); } return 1 - 0.3 * dn * w * smooth((y - 0.5 * H) / (0.5 * H)); };
        for (const [g, orig] of [[outerG, outerR], [innerG, innerR]]) {
          const p = g.attributes.position.array;
          for (let i = 0; i < p.length; i += 3) { const x = orig[i], y = orig[i + 1], z = orig[i + 2], r = Math.hypot(x, z), k = r < 0.01 ? 1 : bend(r, Math.atan2(z, x), y); p[i] = x * k; p[i + 2] = z * k; p[i + 1] = y - (k < 1 ? 0.012 * (1 - k) / 0.3 * smooth((y - 0.5 * H) / (0.5 * H)) : 0); }
          g.attributes.position.needsUpdate = true; g.computeVertexNormals(); g.computeBoundingSphere();
        }
        const pts = []; for (let i = 0; i < 64; i++) { const a = (i / 64) * TAU, k = bend(R, a, H); pts.push([Math.cos(a) * (R + 0.002) * k, H - (k < 1 ? 0.012 * (1 - k) / 0.3 : 0), Math.sin(a) * (R + 0.002) * k]); }
        rim.geometry.dispose(); rim.geometry = tubeGeo(pts, 0.0045, 6, true);
      },
    };
  },

  // -------------------------------------------------------------------------------------------------------------
  burnbranch(P) {
    const S = P.spec, L = 0.75;
    const curve = new THREE.CatmullRomCurve3([[0, 0, 0], [0.012, 0.2, 0.01], [-0.01, 0.45, -0.008], [0.008, 0.62, 0.012], [0, L, 0]].map((p) => new THREE.Vector3(...p)));
    const taper = (u) => lerp(0.03, 0.015, u);
    const tapered = (u0, u1, grow, seg = 36) => {   // a tube along the curve between u0 and u1, its radius tapering
      const pts = []; for (let i = 0; i <= seg; i++) pts.push(curve.getPointAt(lerp(u0, u1, i / seg)));
      const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), seg, 1, 8, false), p = g.attributes.position;
      for (let k = 0; k < p.count; k++) { const i = Math.floor(k / 9), c = pts[Math.min(seg, i)], r = taper(lerp(u0, u1, i / seg)) * grow; p.setXYZ(k, c.x + (p.getX(k) - c.x) * r, c.y + (p.getY(k) - c.y) * r, c.z + (p.getZ(k) - c.z) * r); }
      g.computeVertexNormals(); return g;
    };
    const bark = (() => { const [c, g] = canvas(128, 256); g.fillStyle = "#5b4332"; g.fillRect(0, 0, 128, 256); for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(${i % 3 ? "30,20,14" : "140,110,80"},${0.1 + 0.15 * rnd(i)})`; g.fillRect(rnd(i + 1) * 128, rnd(i + 2) * 256, 1 + rnd(i + 3) * 3, 8 + rnd(i + 4) * 40); } return tex(c, [1, 1]); })();
    mesh(tapered(0, 0.66, 1), mat("#ffffff", { map: bark, roughness: 0.95 }), P.whole);
    const charM = mat("#1c1411", { roughness: 1, emissive: "#ff5a1a", emissiveIntensity: 0 }), char = mesh(tapered(0.62, 1, 1.06), charM, P.whole);
    const twigM = mat("#4e3a2b", { roughness: 0.95 });
    for (const [u, ax, az, len] of [[0.3, 0.7, 0.2, 0.16], [0.52, -0.6, -0.5, 0.14]]) {
      const c = curve.getPointAt(u), t = mesh(new THREE.CylinderGeometry(0.004, 0.009, len, 6), twigM, P.whole, c.x + ax * len * 0.4, c.y + len * 0.35, c.z + az * len * 0.4);
      t.rotation.set(az * 1.1, 0, -ax * 1.1);
    }
    // the flame: tongues in four cel bands on the top third, flickering on the clip clock
    const mats = FLAME_MATS(), tongues = [];
    for (let i = 0; i < 16; i++) {
      const band = i < 5 ? 0 : i < 10 ? 1 : i < 14 ? 2 : 3, yb = 0.5 + 0.24 * rnd(i + 5), c = curve.getPointAt(Math.min(1, yb / L));
      const r = [0.05, 0.04, 0.03, 0.02][band] * (0.8 + 0.4 * rnd(i + 6)), h = (0.9 - yb) * [1, 0.88, 0.7, 0.45][band] * (0.85 + 0.3 * rnd(i + 7));
      const cone = flameTongue(P.whole, mats, band, r, c.x + (rnd(i + 8) - 0.5) * 0.035, c.z + (rnd(i + 9) - 0.5) * 0.035);
      tongues.push({ cone, yb, h, x: cone.position.x, z: cone.position.z, ph: rnd(i + 10) * TAU, sp: 8 + rnd(i + 11) * 7 });
    }
    const sparks = Array.from({ length: 10 }, (_, i) => { const s = steamy(new THREE.Mesh(new THREE.SphereGeometry(0.01, 6, 4), basic(i % 2 ? "#ffd27a" : "#ff8a3a")), 9); P.whole.add(s); return { s, ph: rnd(i + 30), sp: 0.5 + rnd(i + 31) * 0.5, x: (rnd(i + 32) - 0.5) * 0.12, z: (rnd(i + 33) - 0.5) * 0.12 }; });
    const glow = glowSprite(P.whole, [255, 150, 60], 1.1, 4); glow.position.set(0, 0.72, 0.03);
    const lt = S.light === false ? null : new THREE.PointLight("#ff9a4a", 0, 4.5, 1.5); if (lt) { lt.position.set(0, 0.72, 0.1); P.whole.add(lt); }
    return {
      grip: 0.08,
      apply(ps, t) {
        const tt = t ?? 0, f = clamp(ps.fire ?? S.fire ?? 0);
        charM.emissiveIntensity = 0.5 * f;
        for (const q of tongues) {
          const k = Math.max(0.005, f * q.h * (0.8 + 0.25 * Math.sin(tt * q.sp + q.ph))), lean = 0.025 * f * Math.sin(tt * 5 + q.ph);
          q.cone.visible = f > 0.01; q.cone.scale.set(0.6 + 0.4 * f, k, 0.6 + 0.4 * f); q.cone.position.set(q.x + lean, q.yb + k / 2, q.z);
          q.cone.rotation.z = -lean * 2.2;
        }
        for (const s of sparks) { const u = (((tt * s.sp + s.ph) % 1) + 1) % 1; s.s.visible = f > 0.05; s.s.position.set(s.x * (1 + 2 * u), 0.7 + u * (0.5 + 0.5 * f), s.z * (1 + 2 * u)); s.s.scale.setScalar(Math.max(0.01, 1 - u)); }
        glow.visible = f > 0.01; glow.material.opacity = 0.6 * f * (0.9 + 0.1 * Math.sin(tt * 17));
        if (lt) lt.intensity = 2.6 * f * (0.9 + 0.1 * Math.sin(tt * 19));
      },
    };
  },

  // -------------------------------------------------------------------------------------------------------------
  gaslantern(P) {
    const S = P.spec, RB = 0.085;
    const tipG = new THREE.Group(); P.whole.add(tipG); const lan = new THREE.Group(); lan.position.x = -RB; tipG.add(lan);
    const green = mat("#2f5a3c", { roughness: 0.45, metalness: 0.4, emissive: "#14281a", emissiveIntensity: 0.4 }), wire = mat("#9aa0a6", { roughness: 0.4, metalness: 0.6, emissive: "#555a60", emissiveIntensity: 0.3 });
    const glassM = new THREE.MeshStandardMaterial({ color: "#f4ead0", roughness: 0.12, transparent: true, opacity: 0.42, depthWrite: false, emissive: new THREE.Color("#ffcf7a"), emissiveIntensity: 0 }); glassM.userData.glass = true;
    mesh(new THREE.CylinderGeometry(0.07, RB, 0.07, 20), green, lan, 0, 0.035, 0);                       // the base, with the gas canister under it
    mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.008, 18), wire, lan, 0, 0.074, 0);                   // the burner's plate
    const knob = mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.02, 10), mat("#1d1d22", { roughness: 0.6 }), lan, 0.082, 0.03, 0); knob.rotation.z = Math.PI / 2;
    mesh(new THREE.CylinderGeometry(0.058, 0.058, 0.12, 20, 1, true), glassM, lan, 0, 0.134, 0).castShadow = false;   // the globe
    mesh(new THREE.CylinderGeometry(0.03, 0.068, 0.036, 20), green, lan, 0, 0.208, 0);                    // the cap
    mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.026, 12), green, lan, 0, 0.239, 0);                      // the vent
    for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU + 0.4; mesh(new THREE.CylinderGeometry(0.0022, 0.0022, 0.14, 4), wire, lan, Math.cos(a) * 0.062, 0.138, Math.sin(a) * 0.062).castShadow = false; }
    const bail = mesh(new THREE.TorusGeometry(0.055, 0.003, 6, 22, Math.PI), wire, lan, 0, 0.225, 0);       // the wire bail over the top
    const mantle = steamy(new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), basic("#fff0c0", { transparent: false })), 6); mantle.position.set(0, 0.125, 0); mantle.scale.set(1, 1.5, 1); lan.add(mantle);
    const glow = glowSprite(lan, [255, 207, 122], 1.0, 4); glow.position.set(0, 0.13, 0);
    const lt = S.light === false ? null : new THREE.PointLight("#ffcf7a", 0, 5, 1.4); if (lt) { lt.position.set(0, 0.14, 0); lan.add(lt); }
    void bail;
    return {
      grip: 0.28,
      apply(ps, t) {
        const tt = t ?? 0, lit = clamp(ps.lit ?? S.lit ?? 0), tip = clamp(Math.max(ps.tip ?? 0, ps.fall ?? 0, 0));
        // falls over about its foot edge on +x (accelerating), then rolls 0.2 m with a few rocks
        const p1 = clamp(tip / 0.45), u = clamp((tip - 0.45) / 0.55), su = smooth(u);
        tipG.position.set(RB + 0.2 * su, 0, 0);
        tipG.rotation.z = -(Math.PI / 2) * p1 * p1 + 0.09 * Math.sin(u * 17) * (1 - u) * (p1 >= 1 ? 1 : 0);
        lan.rotation.y = 1.6 * Math.PI * su;
        const fl = 0.9 + 0.1 * Math.sin(tt * 17) * Math.sin(tt * 5.3);
        glassM.emissiveIntensity = (0.05 + 1.1 * lit) * fl; mantle.visible = lit > 0.02; glow.visible = lit > 0.02; glow.material.opacity = 0.85 * lit * fl;
        if (lt) lt.intensity = 3.2 * lit * fl;
      },
    };
  },

  // -------------------------------------------------------------------------------------------------------------
  grassfire(P) {
    const S = P.spec, W = S.w ?? 2.5, D = S.d ?? 0.8, seed = S.seed ?? 3, NT = S.n ?? 120;
    const mats = FLAME_MATS(), tongues = [];
    for (let i = 0; i < NT; i++) {
      const r = (k) => rnd(seed * 97 + i * 13 + k), band = r(1) < 0.35 ? 0 : r(1) < 0.65 ? 1 : r(1) < 0.9 ? 2 : 3, x = (r(2) - 0.5) * W, z = (r(3) - 0.5) * D;
      const c = flameTongue(P.whole, mats, band, [0.06, 0.05, 0.038, 0.026][band] * (0.8 + 0.5 * r(4)), x, z, 5);
      tongues.push({ c, x, z, h: (0.15 + 0.3 * r(5)) * [1, 0.9, 0.75, 0.55][band], ph: r(6) * TAU, sp: 8 + r(7) * 8 });
    }
    const flat = (m, w, d, y, order) => { const o = steamy(new THREE.Mesh(new THREE.PlaneGeometry(w, d), m), order); o.rotation.x = -Math.PI / 2; o.position.y = y; P.whole.add(o); return o; };
    const scarT = (() => { const [c, g] = canvas(256, 128), gr = g.createRadialGradient(128, 64, 8, 128, 64, 128); gr.addColorStop(0, "rgba(14,10,8,0.85)"); gr.addColorStop(0.7, "rgba(14,10,8,0.55)"); gr.addColorStop(1, "rgba(14,10,8,0)"); g.save(); g.scale(1, 0.5); g.translate(0, 64); g.fillStyle = gr; g.fillRect(0, -64, 256, 256); g.restore(); return tex(c); })();
    const scar = flat(basic("#ffffff", { map: scarT, opacity: 0 }), 1, 1, 0.006, 1), glow = flat(new THREE.MeshBasicMaterial({ map: glowTex(255, 120, 40), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0, toneMapped: false }), 1, 1, 0.014, 2);
    glow.material.userData.noOutline = true;
    const puffs = Array.from({ length: 14 }, (_, i) => { const m = new THREE.SpriteMaterial({ map: glowTex(96, 96, 104), transparent: true, depthWrite: false, opacity: 0 }); m.userData.noOutline = true; const s = steamy(new THREE.Sprite(m), 4); P.whole.add(s); return { s, ph: rnd(seed + i * 5) , jx: rnd(i + 70) - 0.5, jz: rnd(i + 80) - 0.5 }; });
    const lt = S.light === false ? null : new THREE.PointLight("#ff8a3a", 0, 6, 1.4); if (lt) P.whole.add(lt);
    return {
      grip: 0,
      apply(ps, t) {
        const tt = t ?? 0, f = clamp(ps.fire ?? S.fire ?? 0), sp = clamp(num(ps, S, "spread"));
        const xf = -W / 2 + 0.2 + (W - 0.2) * sp, ext = xf + W / 2 + 0.3, xc = -W / 2 - 0.15 + ext / 2, on = f > 0.01;
        for (const q of tongues) {
          const a = smooth((xf - q.x) / 0.4), k = Math.max(0.004, f * a * q.h * (0.75 + 0.3 * Math.sin(tt * q.sp + q.ph)));
          q.c.visible = on && a > 0.02; q.c.scale.set(0.5 + 0.5 * a, k, 0.5 + 0.5 * a); q.c.position.y = k / 2; q.c.position.x = q.x + 0.03 * Math.sin(tt * 4 + q.ph) * f;
        }
        scar.visible = glow.visible = on;
        scar.scale.set(ext + 0.4, D + 0.5, 1); scar.position.x = xc; scar.material.opacity = 0.9 * f;
        glow.scale.set(ext + 1.2, D + 1.4, 1); glow.position.x = xc; glow.material.opacity = 0.7 * f * (0.88 + 0.12 * Math.sin(tt * 13));
        for (const p of puffs) {
          const u = (((p.ph + tt / 3.2) % 1) + 1) % 1;
          p.s.visible = on; p.s.position.set(-W / 2 + (p.jx + 0.5) * (xf + W / 2) + u * 0.8, 0.25 + u * 1.7, p.jz * D); p.s.scale.setScalar(0.3 + 0.5 * u);
          p.s.material.opacity = 0.35 * f * Math.sin(Math.PI * u);
        }
        if (lt) { lt.position.set(xc, 0.5, 0); lt.intensity = 4 * f * (0.5 + 0.5 * sp) * (0.9 + 0.1 * Math.sin(tt * 15)); }
      },
    };
  },

  // -------------------------------------------------------------------------------------------------------------
  clawmarks(P) {
    const S = P.spec, R = S.r ?? 0.35, LEN = 0.6, XS = [-0.1, -0.033, 0.033, 0.1], SL = 0.2;   // the gouges' x, and how far each leans (x over the length)
    const zAt = (x) => Math.sqrt(Math.max(0.0001, R * R - x * x)) - R;                         // the trunk's surface at x, the origin on it
    const wood = (() => { const [c, g] = canvas(64, 256); g.fillStyle = "#d9c39a"; g.fillRect(0, 0, 64, 256); for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(${i % 2 ? "150,115,70" : "255,245,215"},0.35)`; g.fillRect(rnd(i + 1) * 64, 0, 1 + rnd(i + 2) * 2, 256); } return tex(c); })();
    const paleM = mat("#ffffff", { map: wood, roughness: 0.7, emissive: "#6b5a3a", emissiveIntensity: 0.35 }), darkM = mat("#1c140e", { roughness: 1 }), chipM = mat("#2a1f17", { roughness: 1 });
    const NV = 22, ribbon = (xi, hw, off, m) => {
      const g = gridGeo(1, NV);
      fill(g, 1, NV, (u, v) => { const s = (v - 0.5) * LEN, w = hw * Math.pow(Math.max(0, 1 - Math.abs(2 * s / LEN) ** 2.2), 0.6), x = xi + (s / LEN) * SL + (u - 0.5) * 2 * w + 0.01 * Math.sin(s * 9 + xi * 40); return [x, s, zAt(x) + off]; });
      const o = mesh(g, m, P.whole); o.castShadow = false; o.material.side = THREE.DoubleSide; return o;
    };
    XS.forEach((xi, i) => {
      ribbon(xi, 0.022, 0.003, darkM); ribbon(xi, 0.0155, 0.008, paleM);
      for (const [end, sy] of [[-1, 1], [1, 1]]) {   // splinters at both ends, a few slivers standing out of the cut
        for (let k = 0; k < 3; k++) {
          const s = end * (LEN / 2 - 0.02 - 0.03 * rnd(i * 9 + k + (end > 0 ? 40 : 0))), x = xi + (s / LEN) * SL + (rnd(i * 5 + k + 3) - 0.5) * 0.02, len = 0.04 + 0.05 * rnd(i * 7 + k + (end > 0 ? 20 : 0));
          const sp = mesh(new THREE.BoxGeometry(0.005, len, 0.0035), paleM, P.whole, x, s + end * len * 0.3, zAt(x) + 0.014); sp.rotation.set(0.7 + 0.5 * rnd(i + k), 0, (rnd(i * 3 + k) - 0.5) * 0.8 - end * 0.15 * 0);
          sp.castShadow = false;
        }
      }
      for (let k = 0; k < 5; k++) {   // torn bark curling at the lips
        const s = (rnd(i * 11 + k) - 0.5) * LEN * 0.8, side = k % 2 ? 1 : -1, x = xi + (s / LEN) * SL + side * 0.024, ch = mesh(new THREE.BoxGeometry(0.014, 0.05 + 0.04 * rnd(i + k * 3), 0.006), chipM, P.whole, x, s, zAt(x) + 0.012); ch.rotation.set(0, side * 0.5, side * 0.2);
        ch.castShadow = false;
      }
    });
    return { grip: 0 };
  },

  // -------------------------------------------------------------------------------------------------------------
  climbpine(P) {
    const S = P.spec, PH = S.h ?? 10.2, NA = 40, NY = 72;
    const R = (y) => (y <= 9 ? lerp(0.36, 0.12, y / 9) : lerp(0.12, 0.02, clamp((y - 9) / (PH - 9))));
    const parts = [];   // geometries bent by the sway: [geo, rest positions]
    const reg = (geo, m) => { m.frustumCulled = false; parts.push([geo, geo.attributes.position.array.slice()]); return m; };
    // the trunk: deep vertical furrows in the bark (a displaced polar grid), azimuth 0 at +z
    const barkT = (() => { const [c, g] = canvas(256, 512); g.fillStyle = "#3a2c22"; g.fillRect(0, 0, 256, 512);
      for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(${i % 3 ? "18,12,9" : "92,72,54"},${0.18 + 0.25 * rnd(i)})`; g.fillRect(rnd(i + 1) * 256, rnd(i + 2) * 512, 2 + rnd(i + 3) * 8, 30 + rnd(i + 4) * 120); } return tex(c, [2, 7]); })();
    const trunk = gridGeo(NA, NY), bark = mat("#ffffff", { map: barkT, roughness: 1 });
    const furrow = (phi, y) => { const a = 0.5 + 0.5 * Math.sin(phi * 13 + 2.2 * Math.sin(y * 0.9 + phi * 2.0) + y * 0.35); return 1 - 0.1 * Math.pow(1 - a, 2.2) - 0.03 * Math.sin(phi * 31 + y * 2.1); };
    fill(trunk, NA, NY, (u, v) => { const y = v * PH, phi = u * TAU, r = R(y) * furrow(phi, y); return [Math.sin(phi) * r, y, Math.cos(phi) * r]; }); weld(trunk, NA, NY);
    reg(trunk, mesh(trunk, bark, P.whole));
    // branches: dead stubs from 2.5 m, live ones from 5 m, none on the climb side (+z) between 1 and 7 m
    const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
    const pick = (k, y, lim) => { let a = wrap(k * 2.39996 + 0.55); for (let n = 0; n < 8 && y < 7.4 && Math.abs(a) < lim; n++) a = wrap(a + 1.1); return a; };
    const deadM = mat("#4a382c", { roughness: 1 }), liveM = mat("#3a2c22", { roughness: 1 });
    const needleM = ["#1d3a33", "#264a3e", "#16302b"].map((c) => mat(c, { roughness: 1, flatShading: true, emissive: "#0a1a16", emissiveIntensity: 0.5 }));
    const taperTube = (pts, r0, r1, seg = 8, rad = 6) => {
      const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))), g = new THREE.TubeGeometry(curve, seg, 1, rad, false), p = g.attributes.position;
      for (let k = 0; k < p.count; k++) { const i = Math.floor(k / (rad + 1)), c = curve.getPointAt(i / seg), r = lerp(r0, r1, i / seg); p.setXYZ(k, c.x + (p.getX(k) - c.x) * r, c.y + (p.getY(k) - c.y) * r, c.z + (p.getZ(k) - c.z) * r); }
      g.computeVertexNormals(); return g;
    };
    const jit = (x, y, z, s) => rnd(Math.round(x * 9) * 3.1 + Math.round(y * 9) * 7.3 + Math.round(z * 9) * 13.7 + s);
    const clump = (c, ax, a, b, d, s) => {   // a ragged needle mass at c, its long axis (a) along +x turned to azimuth ax
      const g = new THREE.IcosahedronGeometry(1, 1), p = g.attributes.position; g.deleteAttribute("uv");
      for (let i = 0; i < p.count; i++) { const k = 0.78 + 0.5 * jit(p.getX(i), p.getY(i), p.getZ(i), s); p.setXYZ(i, p.getX(i) * k, p.getY(i) * k, p.getZ(i) * k); }
      g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(...c), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), ax), new THREE.Vector3(a, b, d)));
      g.computeVertexNormals(); return g;
    };
    let nb = 0;
    const branch = (y, phi, len, live) => {
      const dx = Math.sin(phi), dz = Math.cos(phi), r0 = R(y) * 0.8, pts = [];
      for (let i = 0; i <= 4; i++) { const s = i / 4, h = r0 + s * len, yy = y + (live ? len * (0.26 * s - 0.5 * s * s) : len * 0.12 * s); pts.push([dx * h, yy, dz * h]); }
      const g = taperTube(pts, live ? 0.04 : 0.036, live ? 0.008 : 0.016, 8, 6);
      reg(g, mesh(g, live ? liveM : deadM, P.whole));
      if (!live) return;
      const ax = -Math.atan2(dz, dx);   // rotateY(ax) turns +x onto the branch's horizontal direction
      [[0.42, 0.28, 0.14, 0.24], [0.7, 0.32, 0.16, 0.26], [0.97, 0.3, 0.13, 0.22]].forEach(([s, a, b, d], k) => {
        const i = Math.min(4, Math.round(s * 4)), c = pts[i], g2 = clump([c[0], c[1] - 0.02 * len, c[2]], ax, a * len + 0.06, b * len + 0.05, d * len + 0.06, nb * 5 + k);
        reg(g2, mesh(g2, needleM[(nb + k) % 3], P.whole));
      });
      nb++;
    };
    let k = 0;
    for (let y = 2.5; y < 5; y += 0.4) for (let n = 0; n < 2; n++) { k++; branch(y + 0.12 * rnd(k), pick(k, y, 0.96), 0.28 + 0.35 * rnd(k + 9), false); }
    for (let y = 5; y < 9.7; y += 0.42) for (let n = 0; n < (y < 8 ? 3 : 2); n++) { k++; const yy = y + 0.2 * rnd(k + 3); branch(yy, pick(k, yy, 1.15), lerp(1.4, 0.4, clamp((yy - 5) / (PH - 5))) * (0.8 + 0.4 * rnd(k + 5)), true); }
    // the crown: stacked cones
    [[9.1, 0.42, 1.2], [9.6, 0.3, 0.95], [10.0, 0.17, 0.55]].forEach(([y, r, h], i) => { const g = new THREE.ConeGeometry(r, h, 9, 1); g.translate(0, y + h / 2 - 0.1, 0); g.deleteAttribute("uv"); reg(g, mesh(g, needleM[i % 3], P.whole)); });
    // branch bits that break off the +x side: bit i falls while the count goes from i to i + 1, and lies below once it has
    const bitM = mat("#4e3a2b", { roughness: 1 }), tuftM = needleM[1], paleM = mat("#d9c39a", { roughness: 0.7, emissive: "#6b5a3a", emissiveIntensity: 0.3 });
    const bits = Array.from({ length: 8 }, (_, i) => {
      const g = new THREE.Group(); P.whole.add(g);
      mesh(new THREE.CylinderGeometry(0.008, 0.016, 0.42, 6), bitM, g, 0, 0, 0).rotation.z = Math.PI / 2;
      mesh(new THREE.CylinderGeometry(0.017, 0.017, 0.02, 6), paleM, g, -0.21, 0, 0).rotation.z = Math.PI / 2;     // the broken end
      const tu = mesh(new THREE.IcosahedronGeometry(0.09, 0), tuftM, g, 0.14, 0, 0); tu.scale.set(1.5, 0.7, 1);
      const y0 = 5.2 + 0.55 * i + 0.3 * rnd(i + 90), az = Math.PI / 2 + (rnd(i + 91) - 0.5) * 0.9;
      return { g, y0, x0: Math.sin(az) * (R(y0) + 0.5), z0: Math.cos(az) * (R(y0) + 0.5), vx: 0.35 + 0.5 * rnd(i + 92), vz: (rnd(i + 93) - 0.5) * 0.6, sp: 4 + 5 * rnd(i + 94), yaw: rnd(i + 95) * TAU };
    });
    let last = "";
    return {
      grip: 0,
      apply(ps, t) {
        const tt = t ?? 0, sway = clamp(num(ps, S, "sway"), -1, 1), shake = clamp(num(ps, S, "shake")), snap = Math.max(0, num(ps, S, "snap"));
        const key = [sway, shake, shake > 0 ? tt.toFixed(3) : 0].join("|");
        if (key !== last) {
          last = key;
          const ox = 0.5 * sway + 0.07 * shake * Math.sin(tt * 13), oz = 0.06 * shake * Math.sin(tt * 11 + 1);
          for (const [g, b] of parts) {
            const p = g.attributes.position.array;
            for (let i = 0; i < p.length; i += 3) { const k2 = Math.min(1.3, Math.max(0, b[i + 1]) / 9) ** 2; p[i] = b[i] + ox * k2; p[i + 1] = b[i + 1]; p[i + 2] = b[i + 2] + oz * k2; }
            g.attributes.position.needsUpdate = true;
          }
        }
        for (const [i, b] of bits.entries()) {
          const p = clamp(snap - i); b.g.visible = p > 0.001;
          b.g.position.set(b.x0 + b.vx * p, lerp(b.y0, 0.05, p * p), b.z0 + b.vz * p); b.g.rotation.set(0, b.yaw, -b.sp * p * (1 - 0.3 * p));
        }
      },
    };
  },
};
