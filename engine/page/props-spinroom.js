import * as THREE from "three";
import { rng, clamp, lerp } from "./util.js";
import { canvas, tex } from "./set-porch.js";
import { weight, spin, psi, P, S, flicker, storm } from "./spin-tracks.js";
import { SPINROOM, SEED, once, rad, std, canvasMap, mesh, flat, wbox, Bag, vcMat, lathe, glowTex, glowMat, windAt, applyRoomLight, llamaPath, grainMap, setShadows } from "./set-spinroom.js";

// props-spinroom.js: fact what-if 03 "Earth spun faster every second" (21 Nov 2026): the moving things of Spud's Quito flat
// (storyboards/series/facts/03-spin/DESIGN.md A2, A8-A12, B5). The flat itself (walls, sofa, books, plants, rug, lights) is the set
// "spinroom" (set-spinroom.js). World metres, y up, +z toward the camera, rot 0 faces +z. Seed 31703. Everything is a pure function of the clip
// time t (the second argument of apply, i.e. the real clip seconds; a param "t" tweened by the director overrides it) and of the spec.
// TWEENING: a param props3d.js propState does not know (slam, signal, spit, hit ...) JUMPS at its first "prop" action unless seeded: they are all
// OPTIONAL here: when they are absent the spec's times drive everything, so a clip needs only the spec. Known keys (open, ring, smash, glow, on,
// scale) tween as usual. Scale 0 hides a prop. Props that throw things (smug, scrisps, sclock, scrt, spendant, swindow) put the flying bits in
// WORLD space (added to the scene root on the first frame), so a prop that is held and moves does not drag its spray along.
//
//  KIND       ORIGIN (put it at)                                   SPEC KEYS (default)                                                            PARAMS
//  swindow    the room origin (0,0,0): the insert fills the opening x -1.95..1.95, y .09..3.43, z -2.77..-2.575.
//             open (.86) S slides LEFT 1.00 x open (ps.open also tweens); slamAt (none): the slam starts, S closes in .20 s accelerating, then
//             shivers +-.004 m for .25 s, 9 dust motes fall from the head; wind (D) = storm x open, until slamAt + .6; wetAt (slamAt - 2.0): the wet
//             patch .9 x .6 at (1.40,0,-2.20) from that time on, forever (wet: false hides it); slam (ps.slam overrides P(slamAt, +.2)).
//             Timber #4A2F22, lit edge #7A5238, parapet 6 raised panels #6A4630, sill board y .44-.48 .16 deep, fixed light F x -1.84..+.76 (outer
//             track z -2.65), sash S x +.70..+1.84 (room-side track z -2.60), stiles .07 x .045, brass pull .16 long on S's right stile at y .90
//             (x 1.805 closed, .945 at open .86), keeper plate on the right jamb, thumb latch on F, glass #BCCDE3 .05 + 2 diagonal sheen streaks.
//  scrt       floor under the stand's middle; (1.45, 0, -.25) rot -48 (screen to the left-front). Footprint .80 x .45 stand, set .62 x .52 x .46 on it
//             (top y 1.03 with ears to 1.55). Screen .44 x .34 centred at (0, .79, +.255) in the prop frame, facing +z.
//             t0 (0) not used; driftAt (9.0) the satellite icon starts sliding out (signal 1 -> .5 in .5 s), staticAt (9.5) the picture breaks up
//             (-> 0 in .5 s), slapAt (10.5) the slap: signal .8 for .35 s then 0, dust + rods wag .5 s. signal (ps.signal overrides the lot).
//             Programme redrawn at 15 fps; static = 8 pre-drawn frames (5 n + 3) mod 8 and a rolling bar at 300 px/s. glow (1) the screen's halo.
//  sclock     floor under the side table's middle; (.23, 0, -2.22). Table .40 x .40, top y .52, drawer + brass knob, 4 tapered legs, TABLE LAMP (vase
//             #2F6E7A, pleated shade #F3DDA6, glow) at (+.10,.52,-.10) in the prop frame = world (.33,.52,-2.32), ALARM CLOCK (.15 tall, red
//             #C23A2B, 12 numerals, bells #D9A441) at (-.08,.52,+.10) = world (.15,.52,-2.12), dial turned 20 deg to the room.
//             Hands follow psi(t): hour 720 deg x psi, minute 12x that (a translucent disc above 2 rev/s, i.e. all of P6). ringFrom (16.27) to smashAt
//             (18.3): hammer as 3 ghosts at -22/0/+22 deg, bells shake +-.002, the clock rocks +-3 deg at 7.5 Hz and walks .03 m/s toward the front edge.
//             smashAt: smash = P(smashAt, +.45) (ps.smash > 0 overrides); fist [x,y,z] (world, the clock's centre + .10 up): 17 pieces (3 shell,
//             dial in 2, 2 bells, hammer, 2 hands, 3 gears, 4 glass shards) fly 1.2-3.4 m/s, 20-70 deg up, spin 2-7 rev/s, gravity 9.81 w, then lie;
//             one bell rolls off the table edge; the body flattens to .45 of its height. burst (-18): heading deg of the throw (0 = +z, + = +x), +-100.
//  scrisps    the bag: its bottom centre (stand it where Spud's hand is; held with the phone hold on a side edge, see GRIPS below).
//             Bag .19 (x) x .27 (y) x .07 (z) foil pillow, top torn (11 teeth), red #C8322B, 5 diagonal cream stripes, yellow sunburst d .09 with a
//             crisp icon, silver inside, 9 creases; 3 crisps show in its mouth until the toss. t0 (19.2) the toss; from [x,y,z] (.12,.52,-.30) world
//             where the crisps leave the bag; mouth [x,y,z] (-.06,.60,-.45) world: the hero crisp H ends in it at t0 + 2.35 (apex y 1.45 at t0 + .45,
//             then 1.9 s at about .44 m/s down an S-curve, face to the camera twice in the last .6 s, 2 crumbs puff at the bite); crown [x,y,z]
//             (-.02,.98,-.42) where one crisp comes to rest on his head; rug / manta targets (.30,.02,-.20) (-.25,.02,-.70) (-.12,.64,-1.90).
//             22 crisps (8 ridged), 30 crumbs. Falls at .34-.55 m/s (a film exaggeration, ours) scaled by weight(t) / weight(t0).
//  swing      see spendant.
//  spendant   the rim's middle (rest (0, 1.93, -.45)); the chain runs up 1.44 m to a hook on the middle beam at y 3.37, and the whole lamp swings about
//             that hook. Shade r .26, .14 deep to y +.14, dark bronze #3B302B + brushed band #7A6250, inside #FFE6AE, bulb #FFF2C4, glow sprite 1.1 m,
//             26 chain links. tb (28.0) the bonk: roll 24 deg x exp(-tau/1.6) x cos(phase), period T = 2 pi sqrt(1.47 / (9.81 w)) (3.0 s at 10x), bulb
//             gain x1.8 for 3 frames then a 6-frame flicker, 7 dust motes drop from the shade; slamAt as swindow (wind +-5 deg while the window is
//             open); dir (0) the swing's heading in degrees about y (0 = swings along x). A warm point light travels with the bulb.
//  smug       the mug's bottom centre (Spud holds it): .095 tall, diameter .082, handle on +x (D, .05 x .06), glaze #F1E6CF, a band .034 high with 3 nested
//             zigzags (teal, orange, red), coffee disc, 3 steam wisps until the spit. t0 (0): spit = P(.10,.95) after t0 (ps.spit overrides);
//             mouth [x,y,z] (.22,.62,-1.20) world; dir (.92,.30,-.25). One gout (5 lobes, 0 -> .42 m) + 46 drops launched .10-.32 s, 2.6-5.2 m/s in a 16 deg
//             cone, gravity 9.81 w. 12 hero drops are AIMED at splat spots on the right of the glass (x 1.05-1.84, a film cheat: the cone alone never
//             reaches the window from the staged mouth); where they land 12 splats (d .02-.07) stay on the glass FOR EVER with 2-4 drip runs growing
//             .05-.18 m over 1.2 s; 2 more land on the sill. GRIPS: mug hold, h .095, r .041 (handle +x, like campmug: grips TURN -125).
//  squilt     floor under the sofa's middle (-1.00, 0, -2.03): P6's quilt, 1.5 x 1.1 m, #E8E6E4 with shade #B9B9C4, 5 soft folds, 6 x 5 quilting
//             diamonds, over the seat and the front edge. Scale 0 hides it (the manta is in the set).
//  sroomlight no geometry. B5: the room's key light, moon key, hemisphere, bounce and the floor sheen follow t (set-spinroom.js applyRoomLight).
//             Put it anywhere (0,0,0). Without it the room keeps its t = 0 light.
// GRIPS (storyboards/lib/grips.mjs SIZE, the director adds them): smug { r: .041, h: .095 } with TURN smug -125; scrisps { w: .19, h: .27, t: .07 } held with
// the phone hold (grips.phone, side "L" or "R", height .42 x h: a palm on the side edge at x = +-(.095 + .035), y .113).
// Budgets (measured in node, everything built, hidden parts not counted): triangles swindow 960, scrt 1,594, sclock 3,650, spendant 2,218, smug 1,138,
// scrisps 4,781 (instances included), squilt 1,320; draw calls swindow 6, scrt 7, sclock 15, spendant 10, smug 10, scrisps 9, squilt 1; transparent <= 14;
// small opaque instances <= 54 (crisps 22 + 32 crumbs; drops and pieces extra while they fly). Per shot with the set: see set-spinroom.js header.

const memo = once, T0 = (ps, t) => (typeof ps.t === "number" ? ps.t : t);
const D2R = Math.PI / 180;
const sprite = (c0, size, op, color = "#ffffff") => { const sp = new THREE.Sprite(glowMat(c0, op, color)); sp.scale.set(size, size, 1); sp.userData.glow = true; sp.userData.solid = false; return sp; };
const rootOf = (o) => { while (o.parent) o = o.parent; return o; };
// a world-space group, added to the scene root on the first apply (so a moving or held prop does not drag it)
function worldGroup(P0, store) { if (!store.g) { store.g = new THREE.Group(); rootOf(P0.root).add(store.g); } store.g.visible = P0.root.visible; return store.g; }
const sstep = (a, b, x) => S((x - a) / (b - a));
const hash = (seed, i, k) => { const r = rng(seed * 7919 + i * 131 + k * 17); return r(); };
const flatQuad = (w, h) => new THREE.PlaneGeometry(w, h);
const dustTex = () => once("dust", () => { const [c, g] = canvas(32, 32), gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, "rgba(240,225,200,0.9)"); gr.addColorStop(1, "rgba(240,225,200,0)"); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); return tex(c); });
// dust motes: n sprites that fall from `from` points at time t0 (gravity 9.81 w, drag), alive `life` seconds
function dustMotes(n, seed, size = 0.03) {
  const grp = new THREE.Group(), sps = [];
  for (let i = 0; i < n; i++) { const m = new THREE.SpriteMaterial({ map: dustTex(), transparent: true, opacity: 0, depthWrite: false, fog: false }); m.userData.noOutline = true; const sp = new THREE.Sprite(m); sp.userData.solid = false; sp.userData.glow = true; sp.scale.set(size, size, 1); grp.add(sp); sps.push(sp); }
  return {
    grp, set(tau, origin, spread, seedK = 0, vup = 0.25, life = 1.4) {
      sps.forEach((sp, i) => {
        const on = tau > 0 && tau < life; sp.visible = on; if (!on) return;
        const a = hash(seed + seedK, i, 1) * 6.283, rr = hash(seed + seedK, i, 2) * spread, vy = vup * (0.5 + hash(seed, i, 3)), g = 9.81 * weight(0) * 0.35;
        sp.position.set(origin[0] + Math.cos(a) * rr + Math.sin(a) * tau * 0.1, origin[1] + vy * tau - 0.5 * g * tau * tau, origin[2] + Math.sin(a) * rr * 0.6);
        sp.material.opacity = 0.4 * (1 - sstep(0.5 * life, life, tau)) * sstep(0, 0.06, tau); sp.scale.setScalar(size * (0.7 + hash(seed, i, 4) * 0.8));
      });
    },
  };
}
// timber (vertex-coloured) material, shared per prop file
const timberMat = () => once("timber", () => vcMat(grainMap("wood"), { roughness: 0.6 }));
const plainMat = (o = {}) => vcMat(null, { roughness: 0.6, ...o });
const brassMat = () => once("brass", () => { const m = vcMat(null, { roughness: 0.35, metalness: 0.5 }); return m; });

// ================================================================================================= swindow
function swindow(P0) {
  const Sx = P0.spec, G = P0.whole, R = SPINROOM, store = {};
  const TIM = "#4A2F22", LIT = "#7A5238", PAN = "#6A4630", BRASS = "#C9A24A", BRASS_LIT = "#F2D27A", SILL_TOP = "#A87A52";
  // ---- the frame: jambs .11, head y 3.31-3.43, parapet y .09-.44 with 6 raised panels, sill board
  const fr = new Bag(), zc = -2.66, D = 0.16;
  const box = (w, h, d, c, x, y, z) => fr.add(wbox(w, h, d, 0.5), c, x, y, z);
  for (const s of [-1, 1]) { box(0.11, 3.34, D, TIM, s * (1.95 - 0.055), 1.76, zc); box(0.012, 3.22, D + 0.004, LIT, s * (1.95 - 0.11 - 0.006), 1.9, zc); }
  box(3.9, 0.12, D, TIM, 0, 3.37, zc); box(3.68, 0.012, D + 0.004, LIT, 0, 3.304, zc);   // head, lit lower edge
  box(3.9, 0.35, D - 0.02, TIM, 0, 0.265, zc - 0.01);   // parapet (y .09-.44)
  for (let i = 0; i < 6; i++) { const w = 0.5, x = -1.62 + i * 0.648; box(w, 0.2, 0.02, PAN, x, 0.265, -2.575 - 0.0); box(w + 0.03, 0.012, 0.024, LIT, x, 0.368, -2.575); box(0.012, 0.2, 0.024, "#3A2418", x - w / 2 - 0.006, 0.265, -2.575); box(0.012, 0.2, 0.024, "#3A2418", x + w / 2 + 0.006, 0.265, -2.575); }
  box(3.78, 0.04, 0.16, "#5A3A28", 0, 0.46, -2.57);   // sill board y .44-.48, z -2.65..-2.49
  box(3.78, 0.006, 0.047, SILL_TOP, 0, 0.481, -2.5145);   // the worn front 4 cm
  box(3.78, 0.03, 0.012, "#5A3A28", 0, 0.441, -2.484);   // nosing
  // fixed light F x -1.84..+.76, outer track z -2.65: stiles and rails .07 x .045
  const SW = 0.07, TH = 0.045;
  const FRAME = (x0, x1, z, c = TIM) => { const w = x1 - x0, xm = (x0 + x1) / 2; fr.add(wbox(SW, 2.76, TH, 0.4), c, x0 + SW / 2, 1.895, z); fr.add(wbox(SW, 2.76, TH, 0.4), c, x1 - SW / 2, 1.895, z); fr.add(wbox(w - 2 * SW, SW, TH, 0.4), c, xm, 0.515, z); fr.add(wbox(w - 2 * SW, SW, TH, 0.4), c, xm, 3.275, z); fr.add(wbox(0.01, 2.62, 0.01, 0.4), LIT, x0 + SW + 0.005, 1.895, z + TH / 2); };
  FRAME(-1.84, 0.76, -2.65);
  fr.mesh(timberMat(), G);
  // ---- sash S: its own group; the room-side track z -2.60
  const sash = new THREE.Group(), sb = new Bag(); G.add(sash);
  { const x0 = 0.70, x1 = 1.84, w = x1 - x0, xm = (x0 + x1) / 2, z = -2.60;
    sb.add(wbox(SW, 2.76, TH, 0.4), TIM, x0 + SW / 2, 1.895, z); sb.add(wbox(SW, 2.76, TH, 0.4), TIM, x1 - SW / 2, 1.895, z); sb.add(wbox(w - 2 * SW, SW, TH, 0.4), TIM, xm, 0.515, z); sb.add(wbox(w - 2 * SW, SW, TH, 0.4), TIM, xm, 3.275, z);
    sb.add(wbox(0.01, 2.62, 0.01, 0.4), LIT, x0 + SW + 0.005, 1.895, z + TH / 2); sb.add(wbox(0.01, 2.62, 0.01, 0.4), LIT, x1 - SW - 0.005, 1.895, z + TH / 2); }
  sb.mesh(timberMat(), sash);
  // brass: bar pull .16 long on S's right stile (centre y .90), keeper plate on the right jamb, thumb latch on F's right stile
  const br = new Bag(), pull = new Bag();
  { const x = 1.805, z = -2.60 + TH / 2; for (const dy of [-0.065, 0.065]) pull.add(new THREE.CylinderGeometry(0.006, 0.006, 0.028, 8), BRASS, x, 0.90 + dy, z + 0.014, Math.PI / 2, 0, 0); pull.add(new THREE.CylinderGeometry(0.008, 0.008, 0.16, 10), BRASS_LIT, x, 0.90, z + 0.03); pull.add(new THREE.SphereGeometry(0.0085, 8, 6), BRASS_LIT, x, 0.98, z + 0.03); pull.add(new THREE.SphereGeometry(0.0085, 8, 6), BRASS_LIT, x, 0.82, z + 0.03); pull.add(wbox(0.03, 0.2, 0.003, 0.3), BRASS, x, 0.90, z + 0.0015); }
  pull.mesh(brassMat(), sash);
  br.add(wbox(0.012, 0.16, 0.05, 0.3), BRASS, 1.893, 0.90, -2.60); br.add(wbox(0.004, 0.06, 0.03, 0.3), "#3A2418", 1.8995, 0.90, -2.60);
  br.add(wbox(0.02, 0.07, 0.003, 0.3), BRASS, 0.725, 1.30, -2.65 + TH / 2 + 0.0015); br.add(new THREE.CylinderGeometry(0.004, 0.004, 0.06, 6), BRASS_LIT, 0.725, 1.30, -2.65 + TH / 2 + 0.014, 0, 0, 0); br.add(new THREE.SphereGeometry(0.008, 8, 6), BRASS_LIT, 0.725, 1.33, -2.65 + TH / 2 + 0.014);
  br.mesh(brassMat(), G);
  // ---- glass: very faint tint, two diagonal sheen streaks across each pane (a canvas of two streaks), not solid
  const sheenT = once("sheen", () => { const [c, g] = canvas(256, 512); g.fillStyle = "rgba(188,205,227,0.05)"; g.fillRect(0, 0, 256, 512); for (const [x0, w, a] of [[40, 34, 0.07], [120, 12, 0.055]]) { g.fillStyle = `rgba(255,255,255,${a})`; g.beginPath(); g.moveTo(x0, 512); g.lineTo(x0 + w, 512); g.lineTo(x0 + w + 140, 0); g.lineTo(x0 + 140, 0); g.fill(); } return tex(c); });
  // one plane per pane: the faint tint is the sheen canvas' own base (alpha .05), so no second plane
  const mkGlass = (x0, x1, z, name) => { const w = x1 - x0, h = 2.62;
    const sm = new THREE.MeshBasicMaterial({ map: sheenT, transparent: true, depthWrite: false, fog: false, opacity: 1 }); sm.userData.noOutline = true; sm.userData.solid = false; sm.userData.glass = true;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), sm); m.position.set((x0 + x1) / 2, 1.895, z); m.renderOrder = 3; m.userData.steam = true; m.name = name; return m; };
  G.add(mkGlass(-1.77, 0.69, -2.655, "glass-F")); sash.add(mkGlass(0.77, 1.77, -2.605, "glass-S"));
  // ---- the wet patch on the boards (D): boards 40 % darker #5A3B2C, 18 specular dots; shown from wetAt for ever
  const wet = (() => { const [c, g] = canvas(512, 342), r = rng(SEED + 41); g.clearRect(0, 0, 512, 342); g.fillStyle = "rgba(90,59,44,0.46)"; g.beginPath(); for (let i = 0; i <= 40; i++) { const a = (i / 40) * 6.2832, rr = 1 + 0.12 * Math.sin(a * 3 + 1) + 0.06 * Math.sin(a * 7); g.lineTo(256 + Math.cos(a) * 236 * rr, 171 + Math.sin(a) * 150 * rr); } g.fill();
    g.fillStyle = "rgba(60,38,28,0.18)"; g.beginPath(); g.ellipse(256, 171, 150, 90, 0.2, 0, 6.3); g.fill();
    for (let i = 0; i < 18; i++) { const a = r() * 6.28, rr = Math.sqrt(r()) * 0.8; g.fillStyle = "rgba(255,246,230,0.7)"; g.beginPath(); g.ellipse(256 + Math.cos(a) * 200 * rr, 171 + Math.sin(a) * 120 * rr, 2 + r() * 3.5, 1.4 + r() * 2, 0, 0, 6.3); g.fill(); }
    const m = new THREE.MeshBasicMaterial({ map: tex(c), transparent: true, depthWrite: false, fog: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }); m.userData.noOutline = true; m.userData.solid = false;
    const q = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.6), m); q.rotation.x = -Math.PI / 2; q.position.set(R.wet[0], 0.004, R.wet[1]); q.renderOrder = 1; return q; })();
  flat(wet); G.add(wet);
  const dust = dustMotes(9, SEED + 43, 0.026); G.add(dust.grp);
  let windNodes = null, lastWind = -1;
  return {
    grip: 0, apply(ps, t) {
      const tt = T0(ps, t), slamAt = Sx.slamAt, open = ps.open > 0 || Sx.open === 0 ? ps.open : (Sx.open ?? 0.86);
      const slam = typeof ps.slam === "number" ? ps.slam : slamAt != null ? P(tt, slamAt, slamAt + 0.2) : 0, tc = slamAt != null ? slamAt + 0.2 : 1e9, since = tt - tc;
      let x = -open * (1 - slam * slam);
      if (since > 0 && since < 0.25) x += 0.004 * Math.exp(-since * 10) * Math.sin(since * 2 * Math.PI * 20);   // 5 decaying cycles in .25 s
      sash.position.x = x;
      dust.set(since, [1.3, 3.28, -2.62], 0.5, 0, 0.1, 1.4);
      wet.visible = Sx.wet !== false && tt >= (Sx.wetAt ?? (slamAt != null ? slamAt - 2.0 : 1e9));
      // wind (D): plants' leaf groups and the manta's fringe (set nodes with userData.windDeg) swing about their own origin
      if (!windNodes) { windNodes = []; rootOf(P0.root).traverse((o) => { if (o.userData.windDeg) windNodes.push(o); }); }
      const w = windAt(tt, slamAt, open > 0 ? Math.max(open, 0.001) : 0);
      for (const o of windNodes) { const ph = o.userData.windPhase || 0, a = o.userData.windDeg * D2R * w; o.rotation.z = a * Math.sin(2 * Math.PI * 3 * tt + ph); o.rotation.x = a * 0.6 * Math.sin(2 * Math.PI * 3 * tt + ph + 1.3); }
      void lastWind; void store; void S;
    },
  };
}

// ================================================================================================= scrt (the CRT on its stand)
const TVW = 512, TVH = 384;
// South America as a 28-vertex outline on the 512 x 384 canvas (uv fractions)
const SA = [[0.40, 0.30], [0.46, 0.27], [0.55, 0.29], [0.62, 0.33], [0.72, 0.38], [0.80, 0.42], [0.86, 0.50], [0.80, 0.58], [0.74, 0.64], [0.70, 0.72], [0.64, 0.78], [0.60, 0.86], [0.55, 0.94], [0.50, 0.98], [0.47, 0.90], [0.48, 0.80], [0.46, 0.70], [0.43, 0.60], [0.40, 0.52], [0.36, 0.46], [0.33, 0.40], [0.30, 0.35], [0.32, 0.31], [0.36, 0.29], [0.38, 0.32], [0.37, 0.38], [0.35, 0.42], [0.39, 0.36]];
function scrt(P0) {
  const Sx = P0.spec, G = P0.whole, store = {};
  // stand .80 x .45 x .50 walnut, a lower shelf with 9 tapes/books
  const st = new Bag(), WAL = "#6A4630", WALD = "#4E3322";
  st.add(wbox(0.80, 0.03, 0.45, 0.5), WAL, 0, 0.485, 0); st.add(wbox(0.80, 0.025, 0.45, 0.5), WALD, 0, 0.16, 0);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) st.add(wbox(0.035, 0.5, 0.035, 0.5), WALD, sx * 0.375, 0.25, sz * 0.2);
  st.add(wbox(0.80, 0.05, 0.02, 0.5), WAL, 0, 0.44, 0.215); st.add(wbox(0.80, 0.05, 0.02, 0.5), WAL, 0, 0.44, -0.215);
  const TAPES = ["#8C2F2B", "#2F6E7A", "#E0A63C", "#33506B", "#3B2F2A", "#7A8B4A", "#E6D7B5", "#5B3A5E", "#C9572E"];
  // tapes: 9 standing on the shelf, spines to the front (+z), x from -.32
  TAPES.forEach((c, i) => { const w = 0.03 + 0.005 * (i % 3), h = 0.13 + 0.02 * ((i * 3) % 4), x = -0.33 + i * 0.062 + (i > 4 ? 0.07 : 0); st.add(wbox(w, h, 0.17, 0.5), c, x, 0.1725 + h / 2, 0, 0, 0, i === 4 ? 0.14 : 0); st.add(wbox(w * 0.7, 0.012, 0.004, 0.5), "#F0E2C4", x, 0.1725 + h * 0.72, 0.086); });
  st.mesh(timberMat(), G);
  // the set: casing (front block + tapered back), bezel, feet, control strip, speaker slots, rabbit ears
  const cs = new Bag(), CAS = "#8E8C86", CASL = "#B4B1A8", CASD = "#5E5C5A", Y0 = 0.515, CW = 0.62, CH = 0.52, CD = 0.46, FZ = 0.10;
  const taper = (w, h, d, k) => { const g = new THREE.BoxGeometry(w, h, d), p = g.attributes.position; for (let i = 0; i < p.count; i++) if (p.getZ(i) < 0) { p.setX(i, p.getX(i) * k); p.setY(i, p.getY(i) * k); } g.computeVertexNormals(); return g; };
  cs.add(wbox(CW, CH, 0.22, 0.5), CAS, 0, Y0 + CH / 2, 0.12); cs.add(taper(CW * 0.98, CH * 0.98, CD - 0.22, 0.58), CASD, 0, Y0 + CH / 2, 0.01 - (CD - 0.22) / 2 + 0.0);
  cs.add(wbox(CW + 0.012, 0.012, 0.222, 0.5), CASL, 0, Y0 + CH - 0.006, 0.12);   // lit top edge
  cs.add(wbox(0.01, CH, 0.222, 0.5), CASD, CW / 2 + 0.001, Y0 + CH / 2, 0.12); cs.add(wbox(0.01, CH, 0.222, 0.5), CASL, -CW / 2 - 0.001, Y0 + CH / 2, 0.12);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) cs.add(new THREE.CylinderGeometry(0.018, 0.022, 0.03, 10), "#2B2A2C", sx * 0.24, 0.5 + 0.015, sz * 0.14);
  // bezel: a dark frame around the screen, inset .03; control strip .08 wide on the right
  const SX = -0.04, SCY = Y0 + 0.28, SCZ = 0.231;   // the screen's centre (the set is .62 wide: screen .44, strip .08, margins)
  cs.add(wbox(0.50, 0.40, 0.012, 0.5), "#2B2A2C", SX, SCY, SCZ - 0.012);
  cs.add(wbox(0.075, 0.46, 0.008, 0.5), "#6F6D68", 0.235, SCY - 0.03, SCZ - 0.01);
  for (let i = 0; i < 9; i++) cs.add(wbox(0.05, 0.004, 0.004, 0.3), "#3A3938", 0.235, SCY - 0.2 + i * 0.012, SCZ - 0.004);
  for (const dy of [0.12, 0.05]) { cs.add(new THREE.CylinderGeometry(0.0175, 0.0175, 0.016, 14), "#2B2A2C", 0.235, SCY + dy, SCZ + 0.002, Math.PI / 2, 0, 0); cs.add(wbox(0.003, 0.014, 0.003, 0.3), "#F4F1EA", 0.235, SCY + dy + 0.008, SCZ + 0.011); }
  // rabbit ears: dome base .09, two 3-stage chrome rods .52 at +-32 deg, ball tips .014
  const ears = new THREE.Group(); ears.position.set(-0.04, Y0 + CH + 0.005, 0.10); G.add(ears);
  cs.add(lathe([[0.001, 0.0], [0.045, 0.0], [0.04, 0.018], [0.02, 0.03], [0.002, 0.034]], 18), "#2B2A2C", -0.04, Y0 + CH + 0.005, 0.10);
  cs.mesh(plainMat({ roughness: 0.5 }), G);
  const rods = [-1, 1].map((s) => { const pv = new THREE.Group(); pv.position.set(0, 0.03, 0); pv.userData.s = s; ears.add(pv); const rb = new Bag(); [[0.0042, 0.17], [0.0034, 0.17], [0.0026, 0.18]].forEach(([r, l], k) => rb.add(new THREE.CylinderGeometry(r, r, l, 8), "#D5D8DD", 0, 0.17 * k * (k > 1 ? 1.03 : 1) + l / 2 - 0.0, 0)); rb.add(new THREE.SphereGeometry(0.014, 10, 8), "#E8EAEE", 0, 0.52 + 0.012, 0); rb.mesh(plainMat({ roughness: 0.25, metalness: 0.6 }), pv); pv.rotation.z = -s * 32 * D2R; return pv; });
  // the picture: canvas 512 x 384 (redrawn at 15 fps), the screen bulges .018; unlit; never outlined
  const cvs = document.createElement("canvas"); cvs.width = TVW; cvs.height = TVH; const g2 = cvs.getContext("2d"), tvTex = new THREE.CanvasTexture(cvs); tvTex.colorSpace = THREE.SRGBColorSpace;
  const sm = new THREE.MeshBasicMaterial({ map: tvTex, toneMapped: false, fog: false }); sm.userData.noOutline = true; sm.userData.solid = false;
  const sg = new THREE.PlaneGeometry(0.44, 0.34, 8, 8), sp = sg.attributes.position; for (let i = 0; i < sp.count; i++) { const u = sp.getX(i) / 0.22, v = sp.getY(i) / 0.17; sp.setZ(i, 0.018 * (1 - u * u * 0.5) * (1 - v * v * 0.5)); }   // bulge .018
  const screen = flat(new THREE.Mesh(sg, sm)); screen.position.set(SX, SCY, SCZ - 0.002); G.add(screen);
  // corner radius .05: four dark corner wedges over the picture's corners
  const corner = new Bag(); { const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(0.05, 0); sh.absarc(0.05, 0.05, 0.05, -Math.PI / 2, -Math.PI, true); sh.lineTo(0, 0); const cg = new THREE.ShapeGeometry(sh, 6); [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(([a, b]) => { corner.add(cg, "#2B2A2C", SX + a * 0.22, SCY + b * 0.17, SCZ + 0.0165, 0, 0, 0, -a, -b, 1); }); }
  { const cm = new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, side: THREE.DoubleSide }); cm.userData.noOutline = true; flat(corner.mesh(cm, G, false)); }
  const halo = (() => { const m = new THREE.MeshBasicMaterial({ map: glowTex("160,190,235", 0.9), transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }); m.userData.noOutline = true; m.userData.glow = true; const q = flat(new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.8), m)); q.position.set(SX, SCY, SCZ + 0.035); q.renderOrder = 2; G.add(q); return q; })();
  const light = new THREE.PointLight("#BFD0E6", 0.6, 2.6, 2); light.position.set(SX, SCY, SCZ + 0.22); light.castShadow = false; G.add(light);
  // 8 pre-drawn static frames 256 x 192: grey, mean 46 %, 2 bright bands of 22 px each
  const statics = once("tvstatic", () => Array.from({ length: 8 }, (_, f) => { const [c, g] = canvas(256, 192), r = rng(SEED + 51 + f), id = g.createImageData(256, 192); for (let i = 0; i < 256 * 192; i++) { const v = Math.round(26 + Math.pow(r(), 1.7) * 216); id.data[i * 4] = id.data[i * 4 + 1] = id.data[i * 4 + 2] = v; id.data[i * 4 + 3] = 255; } g.putImageData(id, 0, 0); for (const yb of [r() * 80, 100 + r() * 70]) { g.fillStyle = "rgba(240,240,240,0.45)"; g.fillRect(0, yb, 256, 22); } return c; }));
  const dust = dustMotes(9, SEED + 53, 0.03); G.add(dust.grp);
  const drawProgramme = (tt, signal) => {
    const W = TVW, H = TVH, X = (u) => u * W, Y = (v) => v * H; g2.save(); g2.fillStyle = "#1E5A9A"; g2.fillRect(0, 0, W, H);
    // the map (clean programme), bands displaced when the signal is weak
    const u = clamp((0.5 - signal) / 0.5), bands = u > 0 ? 5 : 1, bh = H / bands;
    for (let b = 0; b < bands; b++) {
      g2.save(); g2.beginPath(); g2.rect(0, b * bh, W, bh + 1); g2.clip(); const dx = u > 0 ? Math.sin(b * 2.3 + Math.floor(tt * 15) * 0.9) * 40 * u : 0; g2.translate(dx, 0);
      g2.fillStyle = "#2468A8"; for (let i = 0; i < 6; i++) g2.fillRect(0, i * 70, W, 2);   // graticule
      g2.fillStyle = "#4E7A3A"; g2.beginPath(); SA.forEach(([a, c], i) => (i ? g2.lineTo(X(a), Y(c)) : g2.moveTo(X(a), Y(c)))); g2.closePath(); g2.fill();
      g2.fillStyle = "#B99A5E"; g2.beginPath(); [[0.55, 0.34], [0.66, 0.4], [0.62, 0.5], [0.5, 0.46]].forEach(([a, c], i) => (i ? g2.lineTo(X(a), Y(c)) : g2.moveTo(X(a), Y(c)))); g2.closePath(); g2.fill();
      g2.strokeStyle = "rgba(20,50,20,0.5)"; g2.lineWidth = 1.2; g2.beginPath(); SA.forEach(([a, c], i) => (i ? g2.lineTo(X(a), Y(c)) : g2.moveTo(X(a), Y(c)))); g2.closePath(); g2.stroke();
      // the cloud spiral: 5 arms turning 40 deg/s off the coast at uv (.30,.34)
      const cx = X(0.20), cy = Y(0.34), ang = tt * 40 * D2R;
      for (let arm = 0; arm < 5; arm++) { g2.strokeStyle = "rgba(255,255,255,0.8)"; g2.lineWidth = 7; g2.lineCap = "round"; g2.beginPath(); for (let k = 0; k <= 22; k++) { const a = ang + arm * 1.2566 + k * 0.17, rr = 4 + k * 2.1; const px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr * 0.95; if (k) g2.lineTo(px, py); else g2.moveTo(px, py); } g2.stroke(); }
      g2.fillStyle = "#12365E"; g2.beginPath(); g2.arc(cx, cy, 5, 0, 6.3); g2.fill();
      // the red pin at Quito (.36,.38), pulsing 1 Hz
      const pr = 5 + 3 * Math.abs(Math.sin(Math.PI * tt)); g2.fillStyle = "rgba(220,40,30,0.4)"; g2.beginPath(); g2.arc(X(0.36), Y(0.38), pr * 1.8, 0, 6.3); g2.fill(); g2.fillStyle = "#E0301F"; g2.beginPath(); g2.arc(X(0.36), Y(0.38), pr, 0, 6.3); g2.fill();
      g2.restore();
    }
    // the satellite icon, 34 px, top right: slides out to the upper right as the signal goes 1 -> .5
    const out = clamp((1 - signal) / 0.5), sx = W - 52 + out * 180, sy = 44 - out * 110; g2.save(); g2.translate(sx, sy); g2.rotate(0.6); g2.fillStyle = "#F4F1EA"; g2.fillRect(-7, -7, 14, 14); g2.fillStyle = "#3B6FB0"; g2.fillRect(-26, -4, 15, 8); g2.fillRect(11, -4, 15, 8); g2.fillStyle = "#C9A24A"; g2.fillRect(-1.5, 7, 3, 9); g2.restore();
    g2.fillStyle = "#E0301F"; g2.beginPath(); g2.arc(28, 28, 8, 0, 6.3); g2.fill();   // the red live dot, top left
    // static over it
    if (u > 0) {
      const sa = u < 0.8 ? 0.45 * u / 0.8 : lerp(0.45, 1, (u - 0.8) / 0.2), fi = (5 * Math.floor(tt * 15) + 3) % 8; g2.globalAlpha = sa; g2.drawImage(statics[fi], 0, 0, W, H);
      g2.globalAlpha = 1; const by = ((tt * 300) % (H + 38)) - 38; g2.fillStyle = `rgba(10,10,12,${0.55 * Math.min(1, u * 1.5)})`; g2.fillRect(0, by, W, 38);
    }
    g2.restore();
  };
  let key = "";
  return {
    grip: 0, apply(ps, t) {
      const tt = T0(ps, t), driftAt = Sx.driftAt ?? 9.0, staticAt = Sx.staticAt ?? 9.5, slapAt = Sx.slapAt ?? 10.5, since = tt - slapAt;
      let signal = typeof ps.signal === "number" ? ps.signal : tt < driftAt ? 1 : tt < staticAt ? lerp(1, 0.5, P(tt, driftAt, driftAt + 0.5)) : tt < slapAt ? lerp(0.5, 0, P(tt, staticAt, staticAt + 0.5)) : since < 0.35 ? 0.8 : 0;
      const frame = Math.floor(tt * 15 + 1e-6), k = `${frame}|${signal.toFixed(3)}`;
      if (k !== key) { key = k; drawProgramme(frame / 15, signal); tvTex.needsUpdate = true; }
      const fi = (5 * frame + 3) % 8, u = clamp((0.5 - signal) / 0.5), gl = clamp(ps.glow ?? 1);
      light.intensity = (0.6 + 0.25 * (u > 0 ? fi / 8 : 0.5)) * gl; halo.material.opacity = 0.22 * gl; halo.visible = gl > 0.02;
      // slap: dust motes jump off the top, the rods wag +-6 deg for .5 s
      const wag = since > 0 && since < 0.5 ? 6 * D2R * Math.exp(-since * 4) * Math.sin(since * 2 * Math.PI * 8) : 0;
      rods.forEach((pv) => { pv.rotation.z = -pv.userData.s * 32 * D2R + wag * pv.userData.s; });
      P0.root.updateMatrixWorld(true); const o = new THREE.Vector3(0.0, 1.06, 0.1); G.localToWorld(o);
      dust.set(since, [o.x, o.y, o.z], 0.2, 0, 1.0, 1.0);
      if (!dust.grp.parent || dust.grp.parent === G) { G.remove(dust.grp); worldGroup(P0, store).add(dust.grp); }
    },
  };
}

// ================================================================================================= sclock
function pleatedShade(r0, r1, h, pleats, depth) {   // top radius r0, bottom r1, with N pleats (zigzag radius)
  const pos = [], idx = [], N = pleats * 2, rows = 3;
  for (let j = 0; j <= rows; j++) { const v = j / rows, r = lerp(r1, r0, v); for (let i = 0; i < N; i++) { const a = (i / N) * 6.2832, rr = r * (1 + (i % 2 ? -depth : 0)); pos.push(Math.cos(a) * rr, v * h, Math.sin(a) * rr); } }
  for (let j = 0; j < rows; j++) for (let i = 0; i < N; i++) { const a = j * N + i, b = j * N + ((i + 1) % N), c = a + N, d = b + N; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
function dialTex() {
  return once("dial", () => { const [c, g] = canvas(256, 256); g.fillStyle = "#F4EAD2"; g.beginPath(); g.arc(128, 128, 128, 0, 6.3); g.fill(); g.strokeStyle = "#3B2F2A"; g.lineWidth = 3; g.beginPath(); g.arc(128, 128, 120, 0, 6.3); g.stroke();
    for (let i = 0; i < 60; i++) { const a = (i / 60) * 6.2832, l = i % 5 ? 5 : 10; g.lineWidth = i % 5 ? 1.2 : 2.4; g.beginPath(); g.moveTo(128 + Math.sin(a) * 114, 128 - Math.cos(a) * 114); g.lineTo(128 + Math.sin(a) * (114 - l), 128 - Math.cos(a) * (114 - l)); g.stroke(); }
    g.fillStyle = "#2A2226"; g.font = "bold 26px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle"; for (let n = 1; n <= 12; n++) { const a = (n / 12) * 6.2832; g.fillText(String(n), 128 + Math.sin(a) * 86, 128 - Math.cos(a) * 86); }
    return tex(c); });
}
function sclock(P0) {
  const Sx = P0.spec, G = P0.whole, store = {};
  // ---- the side table #5B3A2A: top .40 (overhang .02 over a .36 carcass), drawer with a brass knob, 4 tapered legs
  const tb = new Bag(), TW = "#5B3A2A", TWL = "#7A5238";
  tb.add(wbox(0.40, 0.03, 0.40, 0.5), TW, 0, 0.505, 0); tb.add(wbox(0.40, 0.006, 0.40, 0.5), TWL, 0, 0.517, 0);
    tb.add(wbox(0.36, 0.13, 0.36, 0.5), "#4A2F22", 0, 0.425, 0); tb.add(wbox(0.30, 0.095, 0.012, 0.5), "#6A4630", 0, 0.425, 0.186); tb.add(wbox(0.31, 0.006, 0.014, 0.5), TWL, 0, 0.4745, 0.186); tb.add(wbox(0.31, 0.006, 0.014, 0.5), "#3A2418", 0, 0.3765, 0.186);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) tb.add(new THREE.CylinderGeometry(0.02, 0.011, 0.365, 8), TW, sx * 0.165, 0.1825, sz * 0.165);
  tb.mesh(timberMat(), G);
  const knob = new Bag(); knob.add(new THREE.SphereGeometry(0.015, 12, 8), "#C9A24A", 0, 0.425, 0.208); knob.add(new THREE.CylinderGeometry(0.005, 0.005, 0.02, 6), "#C9A24A", 0, 0.425, 0.196, Math.PI / 2, 0, 0); knob.mesh(brassMat(), G);
  // ---- the table lamp at (+.10, .52, -.10): vase #2F6E7A .20, brass neck, pleated shade r .12 / .17 (top / bottom) .19 tall #F3DDA6 emissive
  const lamp = new THREE.Group(); lamp.position.set(0.10, 0.52, -0.10); G.add(lamp);
  const lb = new Bag(); lb.add(lathe([[0.001, 0.0], [0.045, 0.0], [0.06, 0.04], [0.065, 0.1], [0.05, 0.16], [0.03, 0.19], [0.022, 0.2], [0.02, 0.2]], 24), "#2F6E7A", 0, 0, 0);
  lb.add(lathe([[0.001, 0.0], [0.043, 0.0], [0.043, 0.006], [0.001, 0.006]], 16), "#5B3A2A", 0, 0, 0);
  lb.add(new THREE.CylinderGeometry(0.018, 0.022, 0.06, 12), "#C9A24A", 0, 0.225, 0); lb.add(new THREE.SphereGeometry(0.012, 8, 6), "#F2D27A", 0, 0.46, 0); lb.add(new THREE.CylinderGeometry(0.004, 0.004, 0.04, 6), "#C9A24A", 0, 0.45, 0);
  lb.mesh(vcMat(null, { roughness: 0.35, metalness: 0.15 }), lamp);
  const shadeM = new THREE.MeshStandardMaterial({ color: "#F3DDA6", emissive: "#F3DDA6", emissiveIntensity: 0.32, roughness: 1, side: THREE.DoubleSide }); shadeM.userData.lineColor = "#2A2226";
  const shade = mesh(pleatedShade(0.12, 0.17, 0.19, 24, 0.045), shadeM, lamp, 0, 0.27, 0, false);
  const lg = sprite("255,200,130", 0.7, 0.3); lg.position.set(0, 0.36, 0.06); lamp.add(lg); const lg2 = sprite("255,200,130", 0.3, 0.3); lg2.position.set(0, 0.06, 0.2); lamp.add(lg2);
  // ---- the alarm clock at (-.08, .52, +.10): .15 tall, body d .115 x .055, red enamel, turned 20 deg to the room
  const clock = new THREE.Group(); clock.position.set(-0.08, 0.52, 0.10); G.add(clock);
  const body = new THREE.Group(); body.rotation.y = -20 * D2R; body.position.y = 0; clock.add(body);   // squashes under the fist
  const sq = new THREE.Group(); body.add(sq);
  const cb = new Bag(), RED = "#C23A2B", CY = 0.057;   // the body's centre height (ball feet .011 under)
  const cyl = new THREE.CylinderGeometry(0.0575, 0.0575, 0.05, 32); cyl.rotateX(Math.PI / 2);
  cb.add(cyl, RED, 0, CY, 0); const rim = new THREE.TorusGeometry(0.0575, 0.006, 8, 32); cb.add(rim, "#E0574A", 0, CY, 0.026); cb.add(rim, "#8E2A22", 0, CY, -0.026);
  for (const s of [-1, 1]) cb.add(new THREE.SphereGeometry(0.011, 8, 6), "#8E2A22", s * 0.038, 0.012, 0.0, 0, 0, 0);   // 2 ball feet
  { const arc = new THREE.TorusGeometry(0.058, 0.0035, 6, 24, Math.PI * 0.62); cb.add(arc, "#C9A24A", 0, CY, -0.0, 0, 0, Math.PI / 2 - Math.PI * 0.31); }
  cb.add(new THREE.CylinderGeometry(0.004, 0.004, 0.012, 6), "#C9A24A", 0.06, CY - 0.02, -0.03, 0, 0, Math.PI / 2); cb.add(new THREE.CylinderGeometry(0.008, 0.008, 0.004, 8), "#C9A24A", 0.068, CY - 0.02, -0.03, 0, 0, Math.PI / 2);   // the key
  const bodyMesh = cb.mesh(vcMat(null, { roughness: 0.35 }), sq);
  const dial = new THREE.Mesh(new THREE.CircleGeometry(0.0475, 40), std("#ffffff", { map: dialTex(), roughness: 0.6 })); dial.position.set(0, CY, 0.0262); setShadows(dial, false, true); sq.add(dial);
  // hands: hour .028, minute .040 (black), a translucent disc above 2 rev/s
  const hand = (len, wid, col) => { const g = new THREE.Group(), m = mesh(wbox(wid, len, 0.002, 1), std(col, { roughness: 0.5 }), g, 0, len / 2 - 0.004, 0, false); void m; return g; };
  const hourH = hand(0.028, 0.0045, "#1E1A1A"), minH = hand(0.040, 0.0032, "#1E1A1A"); hourH.position.set(0, CY, 0.0285); minH.position.set(0, CY, 0.0300); sq.add(hourH, minH);
  const discM = new THREE.MeshBasicMaterial({ color: "#3B2F2A", transparent: true, opacity: 0.22, depthWrite: false, fog: false, side: THREE.DoubleSide }); discM.userData.noOutline = true;
  const disc = new THREE.Mesh(new THREE.CircleGeometry(0.040, 28), discM); disc.position.set(0, CY, 0.0310); disc.renderOrder = 2; flat(disc); sq.add(disc);
  const secM = new THREE.MeshBasicMaterial({ color: "#C23A2B", transparent: true, opacity: 0.2, depthWrite: false, fog: false }); secM.userData.noOutline = true;
  const secRing = new THREE.Mesh(new THREE.RingGeometry(0.0395, 0.0412, 28), secM); secRing.position.set(0, CY, 0.0312); secRing.renderOrder = 2; flat(secRing); sq.add(secRing);
  const pinM = new THREE.Mesh(new THREE.CircleGeometry(0.0035, 10), std("#C9A24A")); pinM.position.set(0, CY, 0.0322); sq.add(pinM);
  // two brass bells d .042 at +-.034 on top, hammer between them
  const bellG = lathe([[0.001, 0.0], [0.021, 0.0], [0.0215, 0.004], [0.017, 0.014], [0.009, 0.02], [0.001, 0.022]], 16);
  const bells = [-1, 1].map((s) => { const pv = new THREE.Group(); pv.position.set(s * 0.034, CY + 0.052, 0); sq.add(pv); pv.userData.s = s; const bb = new Bag(); bb.add(bellG, "#D9A441", 0, 0, 0, 0, 0, 0); bb.add(new THREE.SphereGeometry(0.004, 6, 5), "#F2D27A", 0, 0.022, 0); bb.mesh(brassMat(), pv); pv.rotation.z = -s * 0.32; return pv; });
  const stem = new Bag(); stem.add(new THREE.CylinderGeometry(0.0022, 0.0022, 0.03, 6), "#3A3A3A", 0, 0.015, 0); stem.add(new THREE.SphereGeometry(0.012, 10, 8), "#C9A24A", 0, 0.036, 0);
  const ghostM = brassMat().clone(); ghostM.transparent = true; ghostM.opacity = 0.4; ghostM.depthWrite = false;
  const hammerGs = [-22, 0, 22].map((deg, i) => { const pv = new THREE.Group(); pv.position.set(0, CY + 0.052, 0); const m = stem.mesh(i === 1 ? brassMat() : ghostM, pv); m.castShadow = false; pv.rotation.z = deg * D2R; sq.add(pv); return pv; });
  // pieces (17): 3 shell parts, dial in 2, 2 bells, hammer, 2 hands, 3 gears, 4 glass shards; built once, shown from the smash
  const pieces = []; const pg = new THREE.Group(); G.add(pg);
  const RR = rng(SEED + 61);
  const addPiece = (geo, mat, size) => { const m = new THREE.Mesh(geo, mat); setShadows(m, true, true); m.userData.solid = false; m.visible = false; pg.add(m); pieces.push({ m, size }); return m; };
  const redM = std(RED, { roughness: 0.35, side: THREE.DoubleSide }), dialM = std("#ffffff", { map: dialTex(), side: THREE.DoubleSide, roughness: 0.6 }), brM = std("#D9A441", { roughness: 0.3, metalness: 0.5, side: THREE.DoubleSide }), blM = std("#1E1A1A", { side: THREE.DoubleSide }), glM = new THREE.MeshBasicMaterial({ color: "#EAF4FF", transparent: true, opacity: 0.55, side: THREE.DoubleSide, fog: false }); glM.userData.noOutline = true;
  for (let i = 0; i < 3; i++) { const g = new THREE.CylinderGeometry(0.0575, 0.0575, 0.05, 10, 1, false, i * 2.1, 2.1); g.rotateX(Math.PI / 2); addPiece(g, redM, 0.05); }
  for (let i = 0; i < 2; i++) addPiece(new THREE.CircleGeometry(0.0475, 14, i * Math.PI, Math.PI), dialM, 0.045);
  for (let i = 0; i < 2; i++) addPiece(bellG.clone(), brM, 0.02);
  addPiece(stem.geometry ? stem.geometry() : new THREE.CylinderGeometry(0.003, 0.003, 0.04, 5), brM, 0.02);
  for (let i = 0; i < 2; i++) addPiece(wbox(0.004, 0.032 + i * 0.012, 0.002, 1), blM, 0.02);
  for (const r of [0.018, 0.024, 0.030]) { const sh = new THREE.Shape(); for (let k = 0; k < 16; k++) { const rr = k % 2 ? r * 0.82 : r; sh.lineTo(Math.cos((k / 16) * 6.2832) * rr, Math.sin((k / 16) * 6.2832) * rr); } addPiece(new THREE.ShapeGeometry(sh), brM, r); }
  for (let i = 0; i < 4; i++) { const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(0.02 + 0.01 * i, 0.004); sh.lineTo(0.008, 0.026 + 0.005 * i); addPiece(new THREE.ShapeGeometry(sh), glM, 0.02); }
  // ring: the hammer's 3 ghosts, bells shake, rocks, walks
  const dust = dustMotes(9, SEED + 63, 0.028);
  return {
    grip: 0, apply(ps, t) {
      const tt = T0(ps, t), ringFrom = Sx.ringFrom ?? 16.27, smashAt = Sx.smashAt ?? 18.3, w0 = weight(smashAt);
      const smash = ps.smash > 0 ? ps.smash : P(tt, smashAt, smashAt + 0.45), ringing = (ps.ring > 0 ? 1 : tt >= ringFrom && tt < smashAt ? 1 : 0), since = tt - ringFrom;
      // hands run on the film sky: hour 720 deg x psi, minute 12 x that
      const hourA = 720 * psi(tt) * D2R, minA = hourA * 12, rate = (720 * (0.16 + 0.024 * tt)) / 360;   // hour hand rev/s
      hourH.rotation.z = -hourA; minH.rotation.z = -minA; const minFast = rate * 12 > 2, hourFast = rate > 2;
      minH.visible = !minFast; hourH.visible = !hourFast; disc.visible = minFast; disc.material.opacity = 0.22; secRing.visible = true;
      // ring
      let rock = 0, walk = 0;
      if (ringing) { rock = 3 * D2R * Math.sin(2 * Math.PI * 7.5 * tt); walk = Math.min(0.07, 0.03 * Math.max(0, since)); }
      else if (tt >= smashAt) walk = Math.min(0.07, 0.03 * Math.max(0, smashAt - ringFrom));
      clock.rotation.z = rock; clock.position.set(-0.08, 0.52, 0.10 + walk);
      bells.forEach((b, i) => { b.position.x = (i ? 1 : -1) * 0.034 + (ringing ? 0.002 * Math.sin(2 * Math.PI * 30 * tt + i) : 0); b.position.y = CY + 0.052 + (ringing ? 0.0015 * Math.sin(2 * Math.PI * 27 * tt + i * 2) : 0); });
      hammerGs.forEach((h, i) => { h.visible = ringing ? true : i === 1; });
      // smash:      // smash: the body flattens to .45 of its height under the fist; the dial, hands, bells, hammer and the ghosts leave with the pieces
      const flatK = lerp(1, 0.45, S(smash * 3));
      sq.scale.y = flatK; bodyMesh.visible = true;
      const gone = smash > 0.001; dial.visible = !gone; hourH.visible = hourH.visible && !gone; minH.visible = minH.visible && !gone; disc.visible = disc.visible && !gone; secRing.visible = !gone; pinM.visible = !gone; bells.forEach((b) => (b.visible = !gone)); hammerGs.forEach((h) => (h.visible = h.visible && !gone));
      // the pieces: radially from the fist, ballistic, then they lie; one bell rolls off the table edge
      pg.visible = gone;
      if (gone) {
        const fist = Sx.fist || [0.15, 0.68, -2.12], heading = (Sx.burst ?? -18) * D2R, ts = tt - smashAt, gg = 9.81 * w0, cwp = new THREE.Vector3(0, 0, 0);
        G.worldToLocal(cwp.set(fist[0], fist[1], fist[2]));
        pieces.forEach((pc, i) => {
          const r1 = hash(SEED + 67, i, 1), r2 = hash(SEED + 67, i, 2), r3 = hash(SEED + 67, i, 3), r4 = hash(SEED + 67, i, 4), r5 = hash(SEED + 67, i, 5);
          const az = heading + (r1 - 0.5) * 200 * D2R, el = (20 + 50 * r2) * D2R, v = 1.2 + 2.2 * r3, vh = v * Math.cos(el), vy = v * Math.sin(el);
          const ox = cwp.x + Math.sin(az) * 0.03, oy = cwp.y - 0.1, oz = cwp.z + Math.cos(az) * 0.03;   // from the clock's place, local to the table
          const floorY = -0.52 + 0.012 * (1 + r5), tableTop = 0, onTable = (x, z) => Math.abs(x) < 0.2 && Math.abs(z) < 0.2;
          // landing time: the table top (if over it) or the floor, whichever comes first
          const solve = (h) => (vy + Math.sqrt(vy * vy + 2 * gg * (oy - h))) / gg;
          let tl = solve(tableTop + 0.012), lx = ox + Math.sin(az) * vh * tl, lz = oz + Math.cos(az) * vh * tl, lh = tableTop + 0.012;
          if (!onTable(lx, lz) || oy < tableTop) { tl = solve(floorY); lx = ox + Math.sin(az) * vh * tl; lz = oz + Math.cos(az) * vh * tl; lh = floorY; }
          const k = Math.min(ts, tl), x = ox + Math.sin(az) * vh * k, z = oz + Math.cos(az) * vh * k, y = ts >= tl ? lh : oy + vy * k - 0.5 * gg * k * k;
          let px = x, pz = z; const isBell = i === 3 || i === 4;
          // one bell (index 3) rolls off the edge of the table: it lands on the table, then rolls toward +z over the edge
          pc.m.visible = ts >= 0;
          pc.m.position.set(px, y, pz);
          const spin = (2 + 5 * r4) * 2 * Math.PI * Math.min(ts, tl) * (r1 < 0.5 ? 1 : -1), land = ts >= tl;
          pc.m.rotation.set(land ? r4 * 6.28 * 0 + (r1 - 0.5) * 0.4 + Math.PI / 2 * (i % 3 === 0 ? 1 : 0) : spin * 0.6, r2 * 6.28 + (land ? 0 : spin), land ? (r3 - 0.5) * 1.5 : spin * 0.4);
          if (isBell && i === 3 && ts > tl) { const roll = ts - tl, edge = 0.2; if (lh > -0.1) { const run = Math.min(0.5 * roll * roll * 0.5 + 0.0, 0.6); pc.m.position.z = Math.min(pz + run, edge + 0.05) ; if (pz + run > edge) { const fall = Math.max(0, roll - Math.sqrt(Math.max(0, (edge - pz) * 4))); pc.m.position.z = edge + 0.02 * fall; pc.m.position.y = Math.max(floorY, tableTop + 0.012 - 0.5 * gg * fall * fall); } } }
          pc.m.scale.setScalar(1);
          void px; void pz; void r5;
        });
        dust.set(ts, [cwp.x, cwp.y, cwp.z], 0.05, 0, 0.5, 1.2);
      }
      void ringing; void store; void lg; void lg2; void shade;
    },
  };
}

// ================================================================================================= spendant
function chainTex() {
  return once("chain", () => { const [c, g] = canvas(64, 1024); g.clearRect(0, 0, 64, 1024); for (let i = 0; i < 26; i++) { const y = (i + 0.5) * (1024 / 26), flatLink = i % 2 === 0; g.strokeStyle = "#2A2420"; g.lineWidth = 9; g.beginPath(); if (flatLink) g.ellipse(32, y, 17, 25, 0, 0, 6.3); else g.ellipse(32, y, 7, 25, 0, 0, 6.3); g.stroke(); g.strokeStyle = "#8A6F55"; g.lineWidth = 3; g.beginPath(); if (flatLink) g.ellipse(30, y - 1, 15, 23, 0, 3.6, 5.6); else g.ellipse(31, y - 1, 5, 23, 0, 3.6, 5.6); g.stroke(); } return tex(c); });
}
function spendant(P0) {
  const Sx = P0.spec, G = P0.whole, store = {}, HOOK = 1.44;   // hook height above the rim (3.37 - 1.93)
  const pv = new THREE.Group(); pv.position.set(0, HOOK, 0); G.add(pv);   // the pendulum: everything below the hook swings about it
  const lamp = new THREE.Group(); lamp.position.set(0, -HOOK, 0); pv.add(lamp);
  // shade r .26, .14 deep to y +.14: dark bronze outside with a brushed band, inside #FFE6AE, rim lip
  const outer = lathe([[0.262, 0.0], [0.255, 0.012], [0.2, 0.06], [0.13, 0.108], [0.05, 0.136], [0.032, 0.14], [0.001, 0.14]], 40), inner = lathe([[0.001, 0.136], [0.03, 0.134], [0.12, 0.104], [0.195, 0.058], [0.25, 0.01], [0.254, 0.0]], 40);
  const bronze = std("#3B302B", { roughness: 0.45, metalness: 0.35, side: THREE.FrontSide }); const sh = mesh(outer, bronze, lamp, 0, 0, 0);
  const band = new Bag(); band.add(lathe([[0.2, 0.062], [0.2025, 0.06], [0.131, 0.11], [0.1285, 0.108]].map(([r, y]) => [r + 0.0012, y]), 40), "#7A6250", 0, 0, 0); band.mesh(vcMat(null, { roughness: 0.4, metalness: 0.5, side: THREE.DoubleSide }), lamp, false);
  const innerM = new THREE.MeshStandardMaterial({ color: "#FFE6AE", emissive: "#FFE6AE", emissiveIntensity: 0.55, roughness: 1, side: THREE.DoubleSide }); innerM.userData.lineColor = "#2A2226"; const inn = mesh(inner, innerM, lamp, 0, 0, 0, false); void sh; void inn;
  const lip = new THREE.Mesh(new THREE.TorusGeometry(0.258, 0.007, 6, 40), bronze); lip.rotation.x = Math.PI / 2; lip.position.y = 0.002; lamp.add(lip);
  const sock = new Bag(); sock.add(new THREE.CylinderGeometry(0.03, 0.036, 0.05, 16), "#2B2522", 0, 0.14 + 0.02, 0); sock.add(new THREE.SphereGeometry(0.014, 8, 6), "#C9A24A", 0, 0.19, 0); sock.mesh(vcMat(null, { roughness: 0.4, metalness: 0.4 }), lamp);
  const bm = new THREE.MeshBasicMaterial({ color: "#FFF2C4", fog: false }); bm.userData.noOutline = true; const bulb = flat(mesh(new THREE.SphereGeometry(0.045, 14, 10), bm, lamp, 0, 0.078, 0, false));
  const glow = sprite("255,220,150", 1.1, 0.5); glow.position.set(0, 0.04, 0.05); lamp.add(glow);
  const pl = new THREE.PointLight("#FFD9A0", 0.9, 3.4, 2); pl.position.set(0, 0.07, 0); pl.castShadow = false; lamp.add(pl);
  // chain: 26 links, 2 crossed alpha ribbons .022 wide, from the shade top (y .14) to the hook (y 1.44), and the hook on the middle beam
  const cm = new THREE.MeshBasicMaterial({ map: chainTex(), transparent: true, alphaTest: 0.35, side: THREE.DoubleSide, fog: false }); cm.userData.noOutline = true;
  const clen = HOOK - 0.19, cg = flatQuad(0.022, clen); for (const ry of [0, Math.PI / 2]) { const m = new THREE.Mesh(cg, cm); m.position.set(0, 0.19 + clen / 2, 0); m.rotation.y = ry; m.castShadow = false; m.userData.solid = false; lamp.add(m); }
  const hk = new Bag(); hk.add(new THREE.TorusGeometry(0.02, 0.004, 6, 14), "#C9A24A", 0, HOOK - 0.02, 0); hk.add(new THREE.CylinderGeometry(0.03, 0.034, 0.02, 12), "#2B2522", 0, HOOK + 0.0, 0); hk.mesh(brassMat(), lamp, false);
  lamp.traverse((o) => { if (o.isMesh) o.userData.solid = false; });
  const dust = dustMotes(7, SEED + 71, 0.016);
  // the swing's phase: the integral of sqrt(9.81 w / 1.47) from tb (so T = 2 pi sqrt(1.47 / (9.81 w)) follows the weight)
  const phase = (tau, tb) => { let ph = 0, u = 0; const dt = 0.05; while (u + dt < tau) { ph += Math.sqrt((9.81 * weight(tb + u + dt / 2)) / 1.47) * dt; u += dt; } return ph + Math.sqrt((9.81 * weight(tb + (u + tau) / 2)) / 1.47) * (tau - u); };
  const flick = [1.0, 0.25, 1.0, 0.45, 0.9, 0.35];
  return {
    grip: 0, apply(ps, t) {
      const tt = T0(ps, t), tb = Sx.tb ?? 28.0, tau = tt - tb, dir = (Sx.dir ?? 0) * D2R, on = clamp(ps.on > 0 || Sx.on === 0 ? ps.on : 1);
      let roll = 0; if (tau > 0) roll = 24 * Math.exp(-tau / 1.6) * Math.cos(phase(tau, tb));
      const w = windAt(tt, Sx.slamAt, Sx.open ?? 0.86); roll += 5 * w * Math.sin(2 * Math.PI * 0.9 * tt);
      pv.rotation.set(0, dir, 0); pv.rotation.z = 0; const sw = new THREE.Euler(0, 0, roll * D2R, "XYZ"); void sw;
      pv.rotation.order = "YXZ"; pv.rotation.set(0, dir, roll * D2R);
      // bulb gain x1.8 for 3 frames then a 6-frame flicker
      const f = Math.floor(tau * 30 + 1e-6); let gain = 1; if (tau >= 0 && f < 3) gain = 1.8; else if (tau >= 0 && f < 9) gain = flick[f - 3];
      pl.intensity = 0.9 * gain * on; glow.material.opacity = 0.5 * Math.min(gain, 1.4) * on; glow.scale.setScalar(1.1 * (0.9 + 0.1 * gain)); innerM.emissiveIntensity = 0.55 * gain * on; bulb.visible = on > 0.5;
      // dust: 7 motes drop from the shade, world space
      if (!dust.grp.parent || dust.grp.parent === G) { G.remove(dust.grp); worldGroup(P0, store).add(dust.grp); }
      const rp = P0.root.position; dust.set(tau, [rp.x, rp.y + 0.12, rp.z], 0.2, 0, 0.1, 1.5);
    },
  };
}

// ================================================================================================= smug (mug + coffee spit)
function bandTex() {
  return once("mugband", () => { const [c, g] = canvas(512, 160); g.fillStyle = "#F1E6CF"; g.fillRect(0, 0, 512, 160); g.fillStyle = "#3B2F2A"; g.fillRect(0, 10, 512, 5); g.fillRect(0, 145, 512, 5);
    for (const [col, k] of [["#2F8C8C", 0], ["#E0902F", 1], ["#B5352B", 2]]) { g.fillStyle = col; const amp = 52 - k * 14, mid = 80, step = 512 / 7; g.beginPath(); g.moveTo(0, mid + amp); for (let i = 0; i <= 7; i++) { g.lineTo(i * step + step / 2, mid - amp); g.lineTo((i + 1) * step, mid + amp); } g.lineTo(512, 150); g.lineTo(0, 150); g.fill(); g.fillStyle = k === 0 ? "#F1E6CF" : k === 1 ? "#2F8C8C" : "#E0902F"; const a2 = amp - 12; g.beginPath(); g.moveTo(0, mid + amp + 4); for (let i = 0; i <= 7; i++) { g.lineTo(i * step + step / 2, mid - a2); g.lineTo((i + 1) * step, mid + amp + 4); } g.lineTo(512, 156); g.lineTo(0, 156); g.fill(); }
    const t = tex(c); t.wrapS = THREE.RepeatWrapping; return t; });
}
// splat atlas: 4 blobs (core #5A3320, highlight #8A5A3A, rim #2E190F) and a drip strip, 256 x 256
function splatTex() {
  return once("splat", () => { const [c, g] = canvas(256, 256), r = rng(SEED + 81); g.clearRect(0, 0, 256, 256);
    const blob = (cx, cy, rad0, k) => { const pts = []; for (let i = 0; i < 18; i++) { const a = (i / 18) * 6.2832, rr = rad0 * (0.75 + 0.5 * r() * (i % 3 ? 1 : 1.5)); pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
      const path = (s) => { g.beginPath(); pts.forEach(([x, y], i) => { const px = cx + (x - cx) * s, py = cy + (y - cy) * s; i ? g.lineTo(px, py) : g.moveTo(px, py); }); g.closePath(); };
      g.fillStyle = "#2E190F"; path(1.0); g.fill(); g.fillStyle = "#5A3320"; path(0.86); g.fill(); g.fillStyle = "#8A5A3A"; g.beginPath(); g.ellipse(cx - rad0 * 0.25, cy - rad0 * 0.3, rad0 * 0.28, rad0 * 0.14, -0.6, 0, 6.3); g.fill();
      for (let i = 0; i < 5; i++) { const a = r() * 6.28, d = rad0 * (1.1 + 0.4 * r()); g.fillStyle = "#5A3320"; g.beginPath(); g.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, rad0 * (0.08 + 0.1 * r()), 0, 6.3); g.fill(); } };
    blob(64, 64, 40, 0); blob(192, 64, 34, 1); blob(64, 176, 30, 2); blob(160, 176, 26, 3);
    g.fillStyle = "#2E190F"; g.fillRect(222, 8, 12, 150); g.beginPath(); g.arc(228, 166, 10, 0, 6.3); g.fill(); g.fillStyle = "#5A3320"; g.fillRect(225, 8, 6, 150); g.beginPath(); g.arc(228, 166, 7, 0, 6.3); g.fill(); g.fillStyle = "#8A5A3A"; g.fillRect(226, 10, 2, 140); g.beginPath(); g.arc(226, 163, 2.5, 0, 6.3); g.fill();
    return tex(c); });
}
// hero drops: where the splats are (x, y on the glass plane z -2.574; the last two on the sill top y .481)
const SPLAT_SPOTS = (() => { const r = rng(SEED + 91), out = []; for (let i = 0; i < 12; i++) out.push([1.06 + r() * 0.78, 0.66 + r() * 1.12, -2.574, 0.02 + r() * 0.05, Math.floor(r() * 4), 2 + Math.floor(r() * 3)]); out.push([1.30, 0.481, -2.55, 0.04, 1, 0], [1.62, 0.481, -2.56, 0.05, 2, 0]); return out; })();
function aimAt(M, T, v, g) {   // launch velocity vector reaching T from M at speed ~v (raises v up to 5.2 until a solution exists)
  const dx = T[0] - M[0], dz = T[2] - M[2], D = Math.hypot(dx, dz), dY = T[1] - M[1];
  for (let sp = v; sp <= 5.2 + 1e-9; sp += 0.2) { const a = (g * D * D) / (2 * sp * sp), c = dY + a, disc = D * D - 4 * a * c; if (disc >= 0) { const u = (D - Math.sqrt(disc)) / (2 * a), cphi = 1 / Math.sqrt(1 + u * u); return [(dx / D) * sp * cphi, sp * u * cphi, (dz / D) * sp * cphi, D / (sp * cphi)]; } }
  const sp = 5.2, a = (g * D * D) / (2 * sp * sp), u = D / (2 * a), cphi = 1 / Math.sqrt(1 + u * u); return [(dx / D) * sp * cphi, sp * u * cphi, (dz / D) * sp * cphi, D / (sp * cphi)];
}
function smug(P0) {
  const Sx = P0.spec, G = P0.whole, store = {};
  // ---- the mug: .095 tall, d .082, glaze #F1E6CF, inside #E9DFC8, handle D .05 x .06 on +x, a band .034 high
  const R0 = 0.041, H0 = 0.095, glaze = std("#F1E6CF", { roughness: 0.3 }), inside = std("#E9DFC8", { roughness: 0.4, side: THREE.BackSide });
  mesh(lathe([[0.001, 0.0], [0.034, 0.0], [0.038, 0.004], [R0, 0.02], [R0 + 0.0005, H0 - 0.004], [R0 - 0.001, H0], [R0 - 0.0045, H0]], 36), glaze, G);
  const inn = mesh(lathe([[R0 - 0.0045, H0], [R0 - 0.0045, 0.012], [0.001, 0.012]], 36), inside, G, 0, 0, 0, false); void inn;
  const bandM = std("#ffffff", { map: bandTex(), roughness: 0.3 }); const band = mesh(new THREE.CylinderGeometry(R0 + 0.0009, R0 + 0.0009, 0.034, 36, 1, true), bandM, G, 0, 0.045, 0, false); band.rotation.y = Math.PI;
  const hand = new THREE.Mesh(new THREE.TorusGeometry(0.0265, 0.0058, 8, 20, Math.PI), glaze); hand.scale.set(1.0, 1.1, 1); hand.rotation.z = -Math.PI / 2; hand.position.set(R0 - 0.003, 0.0475, 0); setShadows(hand); G.add(hand);
  const stem = new THREE.Mesh(new THREE.TorusGeometry(0.0265, 0.0058, 8, 20, Math.PI), glaze); void stem;
  // coffee disc #3A2116 + highlight crescent
  const cof = new THREE.Mesh(new THREE.CircleGeometry(R0 - 0.0045 - 0.001, 32), std("#3A2116", { roughness: 0.15 })); cof.rotation.x = -Math.PI / 2; cof.position.y = H0 - 0.012; cof.castShadow = false; cof.userData.solid = false; G.add(cof);
  const hl = new THREE.Mesh(new THREE.RingGeometry(0.024, 0.029, 20, 1, 3.4, 1.6), new THREE.MeshBasicMaterial({ color: "#6B4A32", fog: false })); hl.material.userData.noOutline = true; hl.rotation.x = -Math.PI / 2; hl.position.y = H0 - 0.0115; flat(hl); G.add(hl);
  // 3 steam wisps until the spit (sprites)
  const wisps = [0, 1, 2].map((i) => { const sp = sprite("245,240,232", 0.05, 0.3); sp.userData.glow = false; sp.material.blending = THREE.NormalBlending; G.add(sp); return sp; });
  // ---- the spray, in world space: one gout ribbon + 46 drops (instanced) + 12 + 2 splats on the glass and the sill
  const world = new THREE.Group(); store.world = world;
  const NR = 26, NC = 6; const gpos = new Float32Array((NR + 1) * NC * 3), gcol = new Float32Array((NR + 1) * NC * 3), gidx = []; const gg = new THREE.BufferGeometry();
  const COLS = ["#2E190F", "#5A3320", "#8A5A3A", "#5A3320", "#2E190F"].map((c) => new THREE.Color(c));
  for (let j = 0; j <= NR; j++) for (let k = 0; k < NC; k++) { const c = COLS[Math.min(4, k)] || COLS[4], o = (j * NC + k) * 3; gcol[o] = c.r; gcol[o + 1] = c.g; gcol[o + 2] = c.b; }
  for (let j = 0; j < NR; j++) for (let k = 0; k < NC - 1; k++) { const a = j * NC + k, b = a + NC; gidx.push(a, a + 1, b, a + 1, b + 1, b); }
  gg.setAttribute("position", new THREE.BufferAttribute(gpos, 3)); gg.setAttribute("color", new THREE.BufferAttribute(gcol, 3)); gg.setIndex(gidx);
  const gm = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.2, side: THREE.DoubleSide }); gm.userData.lineColor = "#2E190F"; gm.userData.noOutline = true;
  const gout = new THREE.Mesh(gg, gm); gout.frustumCulled = false; gout.castShadow = false; gout.userData.solid = false; world.add(gout);
  const ND = 46, dropM = std("#5A3320", { roughness: 0.15 }); dropM.userData.noOutline = true;
  const drops = new THREE.InstancedMesh(new THREE.OctahedronGeometry(1, 1), dropM, ND); drops.frustumCulled = false; drops.castShadow = false; drops.userData.solid = false; world.add(drops);
  // splats: 14 quads + 36 drip quads in one dynamic mesh (glass plane z -2.574, the sill top)
  const NS = SPLAT_SPOTS.length, nDrip = SPLAT_SPOTS.reduce((s, p) => s + p[5], 0), NQ = NS + nDrip, spPos = new Float32Array(NQ * 12), spUv = new Float32Array(NQ * 8), spIdx = [];
  for (let q = 0; q < NQ; q++) spIdx.push(q * 4, q * 4 + 1, q * 4 + 2, q * 4, q * 4 + 2, q * 4 + 3);
  const spg = new THREE.BufferGeometry(); spg.setAttribute("position", new THREE.BufferAttribute(spPos, 3)); spg.setAttribute("uv", new THREE.BufferAttribute(spUv, 2)); spg.setIndex(spIdx);
  const spm = new THREE.MeshBasicMaterial({ map: splatTex(), transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }); spm.userData.noOutline = true; spm.userData.solid = false;
  const splats = new THREE.Mesh(spg, spm); splats.frustumCulled = false; splats.renderOrder = 4; splats.userData.steam = true; world.add(splats);
  let drawnKey = "";
  const mouthOf = () => Sx.mouth || [0.22, 0.62, -1.20], dirOf = () => { const d = Sx.dir || [0.92, 0.30, -0.25], l = Math.hypot(...d); return d.map((v) => v / l); };
  // every drop's launch (deterministic): time, velocity, landing time and place (hero drops aimed at the splat spots)
  const launchOf = (M, dir, g) => {
    const out = [];
    for (let i = 0; i < ND; i++) {
      const hero = i < NS, L = 0.10 + 0.22 * hash(SEED + 93, i, 1), sp = 2.6 + 2.6 * hash(SEED + 93, i, 2); let v;
      if (hero) { const T = SPLAT_SPOTS[i], a = aimAt(M, [T[0], T[1], T[2]], Math.max(3.4, sp), g); v = [a[0], a[1], a[2]]; out.push({ L: L + 0.0, v, hero: true, tl: a[3], d: 0.02, big: i < 6 }); continue; }
      const az = (hash(SEED + 93, i, 3) - 0.5) * 2, el = (hash(SEED + 93, i, 4) - 0.5) * 2, k = Math.tan(8 * D2R);   // a 16 deg cone
      const up = new THREE.Vector3(0, 1, 0), d0 = new THREE.Vector3(...dir), rgt = new THREE.Vector3().crossVectors(d0, up).normalize(), up2 = new THREE.Vector3().crossVectors(rgt, d0).normalize();
      const dv = d0.clone().addScaledVector(rgt, az * k).addScaledVector(up2, el * k).normalize();
      v = [dv.x * sp, dv.y * sp, dv.z * sp]; const tl = (v[1] + Math.sqrt(v[1] * v[1] + 2 * g * (M[1] - 0.02))) / g;
      out.push({ L, v, hero: false, tl, d: 0.008 + 0.022 * hash(SEED + 93, i, 5), big: i >= 40 });
    }
    return out;
  };
  const gout_set = (tau, M, dir) => {
    const len = 0.42 * S(P(tau, 0.10, 0.34)), fade = 1 - S(P(tau, 0.40, 0.62)), W = 0.09 * fade;
    gout.visible = tau > 0.1 && fade > 0.01 && len > 0.003; if (!gout.visible) return;
    const dv = new THREE.Vector3(...dir), up = new THREE.Vector3(0, 0, 1), wdir = new THREE.Vector3().crossVectors(dv, up).normalize();
    for (let j = 0; j <= NR; j++) {
      const s = j / NR, lobes = 0.45 + 0.55 * Math.abs(Math.sin(Math.PI * s * 2.5 + 0.4)), prof = Math.pow(Math.sin(Math.PI * Math.min(1, s * 0.92 + 0.06)), 0.6) * lobes, w = W * prof;
      const cx = M[0] + dv.x * len * s, cy = M[1] + dv.y * len * s - 0.38 * len * s * s, cz = M[2] + dv.z * len * s;
      for (let k = 0; k < NC; k++) { const f = (k / (NC - 1)) * 2 - 1, o = (j * NC + k) * 3; gpos[o] = cx + wdir.x * w * f; gpos[o + 1] = cy + wdir.y * w * f; gpos[o + 2] = cz + wdir.z * w * f; }
    }
    gg.attributes.position.needsUpdate = true; gg.computeVertexNormals(); gg.computeBoundingSphere();
  };
  return {
    grip: 0.05, apply(ps, t) {
      const tt = T0(ps, t), t0 = Sx.t0 ?? 0, tau = tt - t0, spit = typeof ps.spit === "number" && ps.spit > 0 ? ps.spit : P(tau, 0.10, 0.95), M = mouthOf(), dir = dirOf(), g = 9.81 * weight(t0);
      if (!world.parent) rootOf(P0.root).add(world);
      world.visible = P0.root.visible;
      // steam until the spit
      wisps.forEach((sp, i) => { const ph = (tt * 0.6 + i / 3) % 1; sp.visible = spit < 0.01 && tau < 0.1; sp.position.set(Math.sin(ph * 6 + i * 2) * 0.008, H0 + 0.01 + ph * 0.07, Math.cos(ph * 5 + i) * 0.006); sp.material.opacity = 0.32 * Math.sin(Math.PI * ph); sp.scale.setScalar(0.03 + 0.03 * ph); });
      cof.visible = true;
      // the spit's time axis: ps.spit overrides tau through its own time
      const ts = typeof ps.spit === "number" && ps.spit > 0 ? 0.10 + ps.spit * 0.85 : tau;
      gout_set(ts, M, dir);
      if (!store.L) store.L = launchOf(M, dir, g);
      const Ls = store.L, m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), vv = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
      let nvis = 0;
      for (let i = 0; i < ND; i++) {
        const d = Ls[i], u = ts - d.L, landed = u >= d.tl; let on = u > 0 && !landed && ts < 1.6;
        if (!on) { m4.makeScale(0, 0, 0); drops.setMatrixAt(i, m4); continue; }
        const x = M[0] + d.v[0] * u, y = M[1] + d.v[1] * u - 0.5 * g * u * u, z = M[2] + d.v[2] * u; vv.set(d.v[0], d.v[1] - g * u, d.v[2]); const sp = vv.length(); vv.normalize(); q.setFromUnitVectors(up, vv);
        const r = d.d * (d.big ? 1.4 : 1) * 0.5, stretch = 1 + Math.min(1.5, sp * 0.18);
        m4.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(r, r * stretch, r)); drops.setMatrixAt(i, m4); nvis++;
      }
      drops.instanceMatrix.needsUpdate = true; drops.visible = nvis > 0;
      // splats: on the glass from their landing time, drips grow over 1.2 s
      const key = `${Math.floor((ts - 0.1) * 60)}`;
      if (key !== drawnKey) {
        drawnKey = key; let q0 = 0, di = NS;
        SPLAT_SPOTS.forEach((sp, i) => {
          const d = Ls[i], landT = d.L + d.tl, age = ts - landT, show = age >= 0, ix = (sp[4] % 2) * 0.5, iy = Math.floor(sp[4] / 2) * 0.5, onSill = sp[1] < 0.5;
          const size = sp[3] * (show ? 0.5 + 0.5 * S(age / 0.12) : 0.001), o = q0 * 12, uo = q0 * 8;
          const c = [sp[0], sp[1], sp[2]];
          const pts = onSill ? [[c[0] - size, c[1], c[2] + size], [c[0] + size, c[1], c[2] + size], [c[0] + size, c[1], c[2] - size], [c[0] - size, c[1], c[2] - size]] : [[c[0] - size, c[1] - size, c[2]], [c[0] + size, c[1] - size, c[2]], [c[0] + size, c[1] + size, c[2]], [c[0] - size, c[1] + size, c[2]]];
          pts.forEach((p3, k) => { spPos.set(p3, o + k * 3); }); spUv.set([ix, iy, ix + 0.5, iy, ix + 0.5, iy + 0.5, ix, iy + 0.5].map((v, k) => (k % 2 ? 1 - v : v)), uo); q0++;
          for (let k = 0; k < sp[5]; k++) {   // 2-4 drip runs growing .05-.18 m over 1.2 s
            const dx = (hash(SEED + 97, i, k + 1) - 0.5) * size * 1.4, run = (0.05 + 0.13 * hash(SEED + 97, i, k + 7)) * S(age / 1.2) * (show ? 1 : 0), wd = 0.0035 + 0.0025 * hash(SEED + 97, i, k + 3), o2 = di * 12, u2 = di * 8, y0 = c[1] - size * 0.7;
            const quad = [[c[0] + dx - wd, y0, c[2]], [c[0] + dx + wd, y0, c[2]], [c[0] + dx + wd, y0 - run - 0.001, c[2]], [c[0] + dx - wd, y0 - run - 0.001, c[2]]]; quad.forEach((p3, kk) => spPos.set(p3, o2 + kk * 3));
            spUv.set([0.865, 0.97, 0.915, 0.97, 0.915, 0.31, 0.865, 0.31], u2); void quad; di++;
          }
        });
        for (let k = q0; k < NS; k++) void k;
        spg.attributes.position.needsUpdate = true; spg.attributes.uv.needsUpdate = true; spg.computeBoundingSphere();
      }
      splats.visible = true;
    },
  };
}

// ================================================================================================= scrisps (bag + crisps)
function bagTex() {
  return once("bag", () => { const [c, g] = canvas(512, 768); g.fillStyle = "#C8322B"; g.fillRect(0, 0, 512, 768);
    g.save(); g.fillStyle = "#F3E4C0"; for (let i = 0; i < 5; i++) { const x0 = -300 + i * 150; g.beginPath(); g.moveTo(x0, 768); g.lineTo(x0 + 52, 768); g.lineTo(x0 + 52 + 500, 0 + 0); g.lineTo(x0 + 500, 0); g.fill(); } g.restore();
    g.fillStyle = "rgba(200,50,43,0.0)";
    const cx = 256, cy = 380; g.fillStyle = "#F2C230"; g.beginPath(); for (let i = 0; i < 28; i++) { const a = (i / 28) * 6.2832, r = i % 2 ? 130 : 168; g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } g.closePath(); g.fill();
    g.fillStyle = "#E0902F"; g.beginPath(); g.arc(cx, cy, 112, 0, 6.3); g.fill(); g.fillStyle = "#F2C230"; g.beginPath(); g.arc(cx, cy, 100, 0, 6.3); g.fill();
    g.save(); g.translate(cx, cy); g.rotate(-0.4); g.fillStyle = "#E9B94E"; g.strokeStyle = "#8C5A1E"; g.lineWidth = 5; g.beginPath(); g.ellipse(0, 0, 64, 40, 0, 0, 6.3); g.fill(); g.stroke(); g.fillStyle = "#8C5A1E"; for (const [x, y] of [[-20, -8], [14, 6], [30, -14], [-34, 12], [4, -18]]) { g.beginPath(); g.arc(x, y, 3.4, 0, 6.3); g.fill(); } g.restore();
    g.fillStyle = "rgba(0,0,0,0.12)"; g.fillRect(0, 0, 512, 40); g.fillRect(0, 728, 512, 40);   // the crimped seals
    for (let i = 0; i < 9; i++) { g.strokeStyle = "rgba(255,255,255,0.18)"; g.lineWidth = 3; g.beginPath(); const x = 30 + i * 56 + (i % 2) * 14; g.moveTo(x, 40); g.lineTo(x + (i % 3 - 1) * 22, 730); g.stroke(); g.strokeStyle = "rgba(60,0,0,0.12)"; g.lineWidth = 2; g.beginPath(); g.moveTo(x + 5, 40); g.lineTo(x + 5 + (i % 3 - 1) * 22, 730); g.stroke(); }
    return tex(c); });
}
const BAG = { w: 0.19, h: 0.27, d: 0.07 };
function bagGeo(inside) {
  const NY = 18, NA = 36, pos = [], uv = [], idx = [], teeth = 11, W2 = BAG.w / 2;
  for (let j = 0; j <= NY; j++) {
    const v = j / NY;
    for (let i = 0; i <= NA; i++) {
      const a = (i / NA) * 2 * Math.PI, ca = Math.cos(a), sa = Math.sin(a);
      // the seal at the bottom (y 0-.025) is flat; the belly swells in the middle; the torn top is open with a jagged edge
      const seal = Math.min(1, v / 0.1), belly = Math.max(Math.sin(Math.PI * clamp((v - 0.04) / 0.94)), v > 0.8 ? 0.55 * clamp((v - 0.8) / 0.2) : 0), hd = BAG.d / 2 * (0.12 + 0.88 * seal * Math.pow(belly, 0.55));
      const toothK = i === 0 || i === NA ? 0 : 0, tooth = (j === NY) ? 0.014 * Math.abs(Math.sin((a / (2 * Math.PI)) * teeth * Math.PI * 2 * 0.5 * 1)) : 0;
      let x = ca * W2 * (1 - 0.06 * v), z = sa * hd * (1 + 0.1 * Math.sin(a * 4 + v * 9)), y = v * BAG.h - tooth - toothK;
      if (inside) { x *= 0.97; z *= 0.9; }
      pos.push(x, y, z); uv.push((ca + 1) / 2, 1 - v);
    }
  }
  for (let j = 0; j < NY; j++) for (let i = 0; i < NA; i++) { const a = j * (NA + 1) + i, b = a + NA + 1; if (inside) idx.push(a, a + 1, b, a + 1, b + 1, b); else idx.push(a, b, a + 1, a + 1, b, b + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
// one crisp: a saddle disc d 1, rise .009 / .05 of d, 6 x 6 segments, tones by the rise, 4-7 fry specks; ridged: 14 scallops
function crispGeo(ridged, seed) {
  const N = 6, pos = [], col = [], idx = [], r = rng(seed), lit = new THREE.Color("#F6D67A"), base = new THREE.Color("#E9B94E"), shd = new THREE.Color("#C08A2E"), speck = new THREE.Color("#8C5A1E");
  for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) {
    const u = (i / N) * 2 - 1, v = (j / N) * 2 - 1;
    // map the square to the disc
    const dx = u * Math.sqrt(1 - (v * v) / 2) * 0.5, dz = v * Math.sqrt(1 - (u * u) / 2) * 0.5;
    let rad0 = Math.hypot(dx, dz), ang = Math.atan2(dz, dx); const scallop = ridged ? 1 + 0.045 * Math.cos(ang * 14) : 1; const px = Math.cos(ang) * rad0 * scallop, pz = Math.sin(ang) * rad0 * scallop, y = 0.34 * (px * px - pz * pz) + (ridged ? 0.02 * Math.cos(ang * 14) * rad0 : 0);
    pos.push(px, y, pz); const t = clamp(0.5 + y / 0.17), c = shd.clone().lerp(base, clamp(t * 2)).lerp(lit, clamp(t * 2 - 1)); col.push(c.r, c.g, c.b);
  }
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const a = j * (N + 1) + i, b = a + N + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  // fry specks: 4-7 small dark triangles on the top surface
  const ns = 4 + Math.floor(r() * 4); let vi = (N + 1) * (N + 1);
  for (let k = 0; k < ns; k++) { const a = r() * 6.28, rr = Math.sqrt(r()) * 0.34, px = Math.cos(a) * rr, pz = Math.sin(a) * rr, y = 0.34 * (px * px - pz * pz) + 0.004, s = 0.03 + 0.02 * r(); pos.push(px, y, pz - s, px + s, y, pz + s * 0.6, px - s, y, pz + s * 0.6); for (let q = 0; q < 3; q++) col.push(speck.r, speck.g, speck.b); idx.push(vi, vi + 2, vi + 1); vi += 3; }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
  // a thin underside so it is a solid sheet
  return g;
}
function scrisps(P0) {
  const Sx = P0.spec, G = P0.whole, store = {};
  // ---- the bag: red foil pillow with cream stripes and a sunburst, silver inside, torn top (11 teeth), 9 creases in the canvas
  const outM = std("#ffffff", { map: bagTex(), roughness: 0.28, metalness: 0.1, side: THREE.FrontSide }); const out = new THREE.Mesh(bagGeo(false), outM); setShadows(out); G.add(out);
  const inM = std("#C9CCD2", { roughness: 0.3, metalness: 0.35, side: THREE.FrontSide }); const inn = new THREE.Mesh(bagGeo(true), inM); inn.castShadow = false; inn.receiveShadow = true; G.add(inn);
  const seal = new Bag(); seal.add(wbox(BAG.w * 0.97, 0.012, 0.01, 0.3), "#B22A24", 0, 0.006, 0); seal.add(wbox(BAG.w * 0.97, 0.004, 0.012, 0.3), "#E55A4E", 0, 0.012, 0); seal.mesh(vcMat(null, { roughness: 0.3 }), G);
  // 3 crisps showing in the mouth until the toss
  const crispR = crispGeo(false, SEED + 101), crispQ = crispGeo(true, SEED + 103), crispM = vcMat(null, { roughness: 0.55, side: THREE.DoubleSide }); crispM.userData.lineColor = "#6A4418";
  const peeks = [0, 1, 2].map((i) => { const m = new THREE.Mesh(i === 1 ? crispQ : crispR, crispM); m.scale.setScalar(0.052 - 0.004 * i); m.position.set(-0.03 + i * 0.03, BAG.h - 0.012 + i * 0.006, (i - 1) * 0.004); m.rotation.set(-0.9 + i * 0.3, i * 1.7, 0.4 - i * 0.5); setShadows(m); m.userData.solid = false; G.add(m); return m; });
  // ---- the flying crisps: 14 plain + 8 ridged (instanced), 30 crumbs + 2 bite crumbs; world space
  const world = new THREE.Group(); store.world = world;
  const NPL = 14, NRG = 8, NCR = 32, plain = new THREE.InstancedMesh(crispR, crispM, NPL), ridged = new THREE.InstancedMesh(crispQ, crispM, NRG);
  for (const m of [plain, ridged]) { m.frustumCulled = false; m.castShadow = true; m.receiveShadow = true; m.userData.solid = false; world.add(m); }
  const crumbM = std("#E9B94E", { roughness: 0.7 }); crumbM.userData.noOutline = true; const crumbs = new THREE.InstancedMesh(new THREE.OctahedronGeometry(1, 0), crumbM, NCR); crumbs.frustumCulled = false; crumbs.userData.solid = false; crumbs.castShadow = false; world.add(crumbs);
  const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), e4 = new THREE.Euler(0, 0, 0, "YXZ"), v3 = new THREE.Vector3(), s3 = new THREE.Vector3();
  // the weight-scaled descent distance of unit speed, for a fall that starts at time ta and lasts u seconds (smooth start over `ramp`)
  const RAMP = 0.25, fallDist = (ta, u, w0) => { let d = 0, x = 0; const dt = 0.05; while (x < u) { const h = Math.min(dt, u - x), xm = x + h / 2; d += sstep(0, RAMP, xm) * (weight(ta + xm) / w0) * h; x += h; } return d; };
  const tossOf = () => Sx.t0 ?? 19.2;
  const hero = () => once("hero:" + JSON.stringify([Sx.t0, Sx.from, Sx.mouth]), () => { const t0 = tossOf(), w0 = weight(t0 + 0.45), mouth = Sx.mouth || [-0.06, 0.60, -0.45], dy = 1.45 - mouth[1]; return { v: dy / fallDist(t0 + 0.45, 1.9, w0), w0, mouth }; });
  const crispState = (i, tt) => {   // returns { pos: [x,y,z], rock, yaw, rest, on } for crisp i (0 = hero)
    const t0 = tossOf(), from = Sx.from || [0.12, 0.52, -0.30], mouth = Sx.mouth || [-0.06, 0.60, -0.45], crown = Sx.crown || [-0.02, 0.98, -0.42];
    const rnd = (k) => hash(SEED + 111, i, k), stag = i === 0 ? 0 : 0.18 * rnd(1), tau = tt - t0 - stag; if (tau < 0) return { on: false };
    const fx = from[0] + (rnd(2) - 0.5) * 0.06, fy = from[1], fz = from[2] + (rnd(3) - 0.5) * 0.06;
    const phase = (u) => 2 * Math.PI * (1.1 * u + 1.25 * Math.max(0, u - 1.75) ** 2 * (i === 0 ? 1 : 0)) + rnd(4) * 6.28;
    let x, y, z, land = false, restY = 0.03, rest = null;
    if (i === 0) {   // the hero: apex y 1.45 at +.45, then 1.9 s at about .44 m/s down an S-curve into the mouth (+2.35)
      const h = hero(), apex = 1.45, ta = 0.45, tf = 1.9, ax = lerp(fx, mouth[0] + 0.10, 1), az = lerp(fz, mouth[2] - 0.05, 1);
      if (tau <= ta) { const k = tau / ta; y = fy + (apex - fy) * (1 - (1 - k) * (1 - k)); x = lerp(fx, ax, S(k)); z = lerp(fz, az, S(k)); }
      else { const u = Math.min(tau - ta, tf), d = h.v * fallDist(t0 + ta, u, h.w0); y = apex - d; const k = u / tf; x = lerp(ax, mouth[0], S(k)) + 0.045 * Math.sin(2 * Math.PI * 1.1 * tau) * (1 - sstep(1.6, 1.9, u)); z = lerp(az, mouth[2], S(k)) + 0.03 * Math.sin(2 * Math.PI * 1.1 * tau + 1.2) * (1 - sstep(1.6, 1.9, u)); if (tau >= ta + tf) land = true; }
      if (land) return { on: false, bite: tau - ta - tf };
      return { on: true, pos: [x, y, z], rock: (35 * D2R) * Math.sin(phase(Math.max(0, tau - ta))), yaw: rnd(5) * 6.28 + 0.6 * tau, hero: true };
    }
    // the others: out of the bag with a puff, up to their own apex, then down at .34-.55 m/s; 4 aimed at the rug, the manta and the crown
    const tgt = i === 1 ? [0.30, 0.03, -0.20] : i === 2 ? [-0.25, 0.03, -0.70] : i === 3 ? [-0.12, 0.655, -1.90] : i === 4 ? crown : null;
    const apex = fy + 0.15 + 0.7 * rnd(6) + (i < 5 ? 0.2 : 0), ta = Math.sqrt(2 * (apex - fy) / 9.1), vf = 0.34 + 0.21 * rnd(7), hx = (rnd(8) - 0.5) * 1.1, hz = (rnd(9) - 0.5) * 1.1;
    const gx = tgt ? tgt[0] : fx + hx * 0.8, gz = tgt ? tgt[2] : fz + hz * 0.8, gy = tgt ? tgt[1] : 0.03 + (Math.hypot(gx - 0.10, gz + 0.35) < 1.0 ? 0 : -0.0);
    const w0 = weight(t0);
    if (tau <= ta) { const k = tau / ta; y = fy + (apex - fy) * (1 - (1 - k) * (1 - k)); x = lerp(fx, lerp(fx, gx, 0.3), S(k)); z = lerp(fz, lerp(fz, gz, 0.3), S(k)); }
    else { const need = apex - gy; let u = 0, dd = 0; const dt = 0.05; const target = tau - ta; while (u < target) { const h = Math.min(dt, target - u), xm = u + h / 2, step = vf * sstep(0, RAMP, xm) * (weight(t0 + ta + xm) / w0) * h; if (dd + step >= need) { u += h * (need - dd) / step; dd = need; break; } dd += step; u += h; }
      const landed = dd >= need - 1e-6; y = apex - dd; const tl = landed ? u : null; void tl; const k = clamp(u / Math.max(0.5, (need / vf))); x = lerp(lerp(fx, gx, 0.3), gx, S(k)); z = lerp(lerp(fz, gz, 0.3), gz, S(k)); land = landed; }
    const flut = land ? 0 : 1, ramp = sstep(0, 0.3, tau - ta);
    x += 0.045 * Math.sin(2 * Math.PI * 1.1 * tau + rnd(10) * 6.28) * flut * ramp; z += 0.03 * Math.sin(2 * Math.PI * 1.1 * tau + rnd(11) * 6.28) * flut * ramp;
    return { on: true, pos: [x, y, z], rock: land ? 0 : (35 * D2R) * Math.sin(phase(tau)), yaw: rnd(5) * 6.28 + (land ? 0 : 0.5 * tau), land };
  };
  return {
    grip: 0.1, apply(ps, t) {
      const tt = T0(ps, t), t0 = tossOf(); if (!world.parent) rootOf(P0.root).add(world); world.visible = P0.root.visible;
      peeks.forEach((m) => (m.visible = tt < t0));
      const mouth = Sx.mouth || [-0.06, 0.60, -0.45], from = Sx.from || [0.12, 0.52, -0.30]; let pi = 0, ri = 0, bite = -1;
      for (let i = 0; i < NPL + NRG; i++) {
        const ridge = (i % 3 === 2 || i === 21) && ri < NRG, tgt = ridge ? ridged : plain, slot = ridge ? ri++ : pi++, st = crispState(i, tt);
        if (i === 0) bite = st.bite ?? -1;
        if (!st.on) { m4.makeScale(0, 0, 0); tgt.setMatrixAt(slot, m4); continue; }
        const sz = 0.045 + 0.017 * hash(SEED + 113, i, 1), base = (62 * D2R) * (st.land ? 0 : 1);
        e4.set(0, st.yaw, 0, "YXZ"); q4.setFromEuler(e4); const qx = new THREE.Quaternion().setFromEuler(new THREE.Euler(st.land ? (hash(SEED + 115, i, 1) - 0.5) * 0.2 : base + st.rock, 0, 0)); q4.multiply(qx);
        v3.set(...st.pos); s3.setScalar(sz); m4.compose(v3, q4, s3); tgt.setMatrixAt(slot, m4);
      }
      for (let k = pi; k < NPL; k++) { m4.makeScale(0, 0, 0); plain.setMatrixAt(k, m4); } for (let k = ri; k < NRG; k++) { m4.makeScale(0, 0, 0); ridged.setMatrixAt(k, m4); }
      plain.instanceMatrix.needsUpdate = true; ridged.instanceMatrix.needsUpdate = true;
      // crumbs: 30 spray from the bag at the toss and fall slowly; 2 more puff at the bite
      for (let i = 0; i < NCR; i++) {
        let p = null, r;
        if (i < 30) { const tau = tt - t0 - 0.05 * hash(SEED + 117, i, 1); if (tau > 0) { const vx = (hash(SEED + 117, i, 2) - 0.5) * 1.6, vz = (hash(SEED + 117, i, 3) - 0.5) * 1.6, vy = 1.2 + 1.8 * hash(SEED + 117, i, 4), gg = 9.81 * weight(t0) * 0.5; const y = from[1] + vy * tau - 0.5 * gg * tau * tau; if (y > 0.015) p = [from[0] + vx * tau, y, from[2] + vz * tau]; else p = [from[0] + vx * (2 * vy / gg), 0.012, from[2] + vz * (2 * vy / gg)]; r = 0.003 + 0.005 * hash(SEED + 117, i, 5); } }
        else if (bite >= 0 && bite < 0.6) { const k = i - 30, a = k * 3.1 + 0.5, vv = 0.5 + 0.3 * k, u = bite; p = [mouth[0] + Math.cos(a) * vv * u * 0.4, mouth[1] + 0.02 + 0.35 * u - 0.9 * u * u, mouth[2] + Math.sin(a) * vv * u * 0.4 + 0.05]; r = 0.004; }
        if (!p) { m4.makeScale(0, 0, 0); crumbs.setMatrixAt(i, m4); continue; }
        e4.set(i, i * 2, i * 3); q4.setFromEuler(e4); v3.set(...p); s3.setScalar(r); m4.compose(v3, q4, s3); crumbs.setMatrixAt(i, m4);
      }
      crumbs.instanceMatrix.needsUpdate = true;
    },
  };
}

// ================================================================================================= squilt (P6)
function quiltTex() {
  return once("quilt", () => { const [c, g] = canvas(512, 384); g.fillStyle = "#E8E6E4"; g.fillRect(0, 0, 512, 384); const r = rng(SEED + 121);
    for (let i = 0; i < 700; i++) { g.fillStyle = r() < 0.5 ? "rgba(255,255,255,0.35)" : "rgba(150,150,170,0.10)"; g.fillRect(r() * 512, r() * 384, 3, 2); }
    g.strokeStyle = "#B9B9C4"; g.lineWidth = 2.4; const nx = 6, ny = 5;
    for (let i = -ny; i <= nx; i++) { g.beginPath(); g.moveTo((i / nx) * 512, 0); g.lineTo(((i + ny) / nx) * 512, 384 * 1.0); g.stroke(); g.beginPath(); g.moveTo((i / nx) * 512, 384); g.lineTo(((i + ny) / nx) * 512, 0); g.stroke(); }
    g.strokeStyle = "rgba(255,255,255,0.6)"; g.lineWidth = 1; for (let i = -ny; i <= nx; i++) { g.beginPath(); g.moveTo((i / nx) * 512 + 2, 0); g.lineTo(((i + ny) / nx) * 512 + 2, 384); g.stroke(); }
    return tex(c); });
}
function squilt(P0) {
  const G = P0.whole, NU = 30, NV = 22, pos = [], uv = [], idx = [], W = 1.5, L = 1.1;
  // lies over the seat (y .465) and hangs over the front edge; sofa-local coordinates, origin the floor under the sofa's middle
  for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) {
    const u = i / NU, v = j / NV, x = (u - 0.5) * W, zb = -0.24 + v * L;   // along z from the back cushion to over the front edge
    const fold = 0.014 * Math.sin(u * 9.4 + v * 3.1) * (1 - 0.6 * v) + 0.01 * Math.sin(v * 7 + u * 2) + 0.008 * Math.sin(u * 17), edge = Math.abs(x) > 0.86 ? 0 : 1;
    let y = 0.475 + fold + 0.02 * Math.sin(u * Math.PI) * 0.5, z = zb;
    if (zb > 0.47) { const d = zb - 0.47, R2 = 0.07, a = Math.min(Math.PI / 2, d / R2); z = 0.47 + R2 * Math.sin(a) + (d > R2 * Math.PI / 2 ? 0.012 : 0); y = 0.475 - R2 * (1 - Math.cos(a)) - Math.max(0, d - (R2 * Math.PI) / 2); }
    y = Math.max(y, 0.06) + fold * 0.3 * (zb > 0.47 ? 1 : 0); void edge;
    pos.push(x, y, z); uv.push(u, 1 - v);
  }
  for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) { const a = j * (NU + 1) + i, b = a + NU + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, std("#ffffff", { map: quiltTex(), roughness: 1, side: THREE.DoubleSide })); setShadows(m); m.userData.solid = false; G.add(m);
  return { grip: 0 };
}

// ================================================================================================= sroomlight (B5)
function sroomlight(P0) {
  let live = null;
  return {
    grip: 0, apply(ps, t) {
      if (!live) { const s = rootOf(P0.root).getObjectByName("spinroom"); live = s && s.userData.live; if (!live) return; }
      applyRoomLight(live, T0(ps, t));
    },
  };
}

// every prop root joins the room's tint (set-spinroom.js tintRoom); the lights that never dim (lamp, pendant, CRT screen) are basic or emissive
const tinted = (f) => (P0) => { P0.root.userData.spinroomProp = true; return f(P0); };
export const SPINROOM_KINDS = { swindow: tinted(swindow), scrt: tinted(scrt), sclock: tinted(sclock), scrisps: tinted(scrisps), spendant: tinted(spendant), smug: tinted(smug), squilt: tinted(squilt), sroomlight };
export { splatTex };
