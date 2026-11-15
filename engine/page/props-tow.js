import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { clamp } from "./util.js";

// "Does money make you happy?" redo (happiness 01, 15 Nov 2026; DESIGN.md sections 4 and 8a): panel 16's tow truck and panel 15's coat
// heap. Metres; ORIGIN bottom centre on the ground, FRONT +z, unless said. Nothing here carries a word, letter, numeral or logo.
// House look comes from the engine: each part is one flat colour (the LIT tone below), the cel pass makes the half and shade tones.
// Glass and glow are userData.steam (see-through for the contact checks, no shadow). Everything is a function of the keys and the
// clip time t (no Math.random, no clock). Keys propState (props3d.js) knows tween smoothly (len, bend, lights, x, y, z, rot, scale, tip);
// the rest (clock, door) read spec.<key> or their default and tween only after a first { do: "prop", id, set: { key }, dur: 0 } at t 0.
//
//   towtruck   a red-orange recovery truck, 5.60 long (z -2.80..+2.80), 2.10 wide, roof y 2.15 (lamp bar to 2.33), boom tip y 3.10.
//              Cab z +0.90..+2.80 (lit #e2572b, shade #a83a1f), dark glass #1c222c at 0.6 (nobody inside), two round headlamps
//              #fff6c8, a plain dark grille, a roof bar with two amber lamps #ffb02e. Open deck z -2.80..+0.90 at y 0.98 with side boards
//              0.25 tall #3a3f47 carrying 5 diagonal yellow #f2c230 stripes (dark #22252b between). Crane: pivot (0, 1.30, +0.20), a boom 3.6
//              long, 0.14 square, #f2c230 (the sliding top section #b58a1c) raised 30 degrees to the REAR, tip (0, 3.10, -2.92); a
//              cable r 0.012 hangs 1.75 to a steel hook #9aa3a8 0.22 tall, the hook's top at (0, 1.35, -2.92) and its bow opening to -z.
//              Wheels r 0.42: front z +1.90 (x +-0.94), twin rear z -1.60 (x +-0.72 and +-0.94). Solid.
//                lights 0..1 (spec.lights 0)  the two amber lamps flash IN TURN, 2 a second, and their glow cards (each lamp: lit half
//                                             of every 0.5 s, the left (-x) one first); 0 = both dark amber
//                clock  seconds (default: the clip time t)  the flash phase
//                len    metres rolled (0): the wheels turn len / 0.42 (the truck itself moves by x/z or a `move`)
//                bend   the front wheels' steer, degrees (0)
//              THE TOW (as sheet 2, tail first; DESIGN 4): the coupe is not turned. It hangs by its tail lip, lifted, rolling on its
//              front wheels, already hooked on the cut (no hooking shown). In the TRUCK's frame: coupe at (0, 0.19, -5.10), rot +180,
//              tip +7 (measured on the bench: a positive tip lifts the coupe's own tail), door 0, lamp 0. Train length 10.45
//              (z -7.65 .. +2.80). TOW.pose(x, y, z, rot) gives both specs for a truck at that world place:
//                const { truck, coupe } = TOW.pose(-20, 0, 10, -90);   // truck facing -x pulls the coupe toward -x
//              (spread into the props' first keys, or into `move`s that carry both at the same speed; give both the same `len`
//              from 0 -> 5 m/s in 1.2 s then steady, and the truck's wheels turn len / 0.42, the coupe's len / 0.358).
//              It reads at 220 px tall as: the slanted yellow boom, the cable, amber flashes, the gold car hanging tail-up behind.
//
//   coatheap   Spud's fur coat lying on the coupe's driver cushion (DESIGN 8a). No new colour: cloth #efe3c8 (shade #cdbb98), lobe
//              clumps #f7efdc along every edge, ink marks #8a7556. The heap is 0.60 (x) x 0.48 (z) x 0.24 tall with a collar roll
//              (at -z, the seat-back side) peaking at 0.30. ORIGIN: bottom centre; ride it at the coupe's seat, car frame
//              COAT_AT = (0.22, 0.46, -0.25) (the cushion top). Solid.
//                door 0..1 (spec.door 0)  0: only the heap, one sleeve folded on it, the chain's S lying on top (nothing hangs out).
//                                         > 0.02: THE SPILL: the sleeve runs over the cushion's door-side edge (+x), across the body
//                                         sill (car y 0.19) and lies 0.30 out on the road, cuff clumps last; the chain (links 0.046 x 0.032,
//                                         #f6c832 / #b5801c, glint #fff3b0 on every third link) goes with it, its S staying on the mound.
//                                         Prime it with the coupe's `door` value (it is the same number).
//              The spill lies at +x in the heap's frame: on the road at x +0.76..+1.06, y -0.46 (the road, since the origin is the cushion
//              top, 0.46 up). With the coupe at rot 0 that is the driver's side; with the coupe turned, turn the heap with it (same rot).
//              CHAIN COUNT: the design's 13 + 7 + 4 = 24 links cannot be one chain: the heap's edge is 0.9 m of chain from the road (0.38 across,
//              0.46 down and out to the asphalt), the S needs 0.4 on top. So the path is 1.42 m and takes 42 links (spec.links overrides):
//              15 on the heap (the S), 22 from the edge over the cushion and the sill, 5 on the asphalt (printed by bench/tow/count-triangles.mjs).
//              No sunglasses.
//   Triangle budgets (design): towtruck 9k (built 3.8k), coatheap 2.5k (built 2.46k). bench/tow/count-triangles.mjs prints each kind's count.
export const COAT_AT = [0.22, 0.46, -0.25];
export const TOW = {
  len: 5.6, w: 2.1, roof: 2.15, tip: [0, 3.1, -2.92], hook: [0, 1.35, -2.92], wheelR: 0.42, train: 10.45,
  coupeIn: { x: 0, y: 0.19, z: -5.10, rot: 180, tip: 7, door: 0, lamp: 0 },
  // both specs for a truck standing at (x, y, z) turned `rot` degrees (three's rotation.y: front +z turns toward +x for rot +90)
  pose(x = 0, y = 0, z = 0, rot = 0) {
    const r = (rot * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r), L = TOW.coupeIn;
    return { truck: { x, y, z, rot }, coupe: { x: x + L.z * s + L.x * c, y: y + L.y, z: z + L.z * c - L.x * s, rot: rot + L.rot, tip: L.tip, door: 0, lamp: 0 } };
  },
};

const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const sm = (x) => { const k = clamp(x); return k * k * (3 - 2 * k); };
const rad = (d) => (d * Math.PI) / 180;
const fract = (x) => x - Math.floor(x);
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.75, ...o });
const basic = (c) => { const m = new THREE.MeshBasicMaterial({ color: c }); m.userData.noOutline = true; return m; };
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
const steamy = (o, order = 5) => { o.frustumCulled = false; o.renderOrder = order; o.castShadow = false; o.receiveShadow = false; o.userData.steam = true; return o; };
const rawColor = (hex) => new THREE.Color().setStyle(hex, THREE.LinearSRGBColorSpace);
const box = (w, h, d, x = 0, y = 0, z = 0) => new THREE.BoxGeometry(w, h, d).translate(x, y, z);
const cylX = (r, w, seg = 20) => new THREE.CylinderGeometry(r, r, w, seg).rotateZ(Math.PI / 2);
// a square beam from A to B (arrays), w x w
function beam(A, B, w, m, parent, h = w) {
  const a = new THREE.Vector3(...A), b = new THREE.Vector3(...B), d = b.clone().sub(a), L = d.length();
  const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, L), m); o.castShadow = o.receiveShadow = true;
  o.position.copy(a).addScaledVector(d, 0.5); o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), d.normalize()); parent.add(o); return o;
}
// a soft round additive glow card that faces the camera (the ambulance's)
function glowCard(parent, color, R, push = 0) {
  const m = new THREE.ShaderMaterial({
    uniforms: { uR: { value: R }, uA: { value: 0 }, uC: { value: rawColor(color) }, uPush: { value: push } },
    vertexShader: `uniform float uR, uPush; varying vec2 vUv;
      void main() { vUv = uv; vec4 c = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0); c.xy += (uv - 0.5) * 2.0 * uR; c.z += uPush; gl_Position = projectionMatrix * c; }`,
    fragmentShader: `uniform float uA; uniform vec3 uC; varying vec2 vUv;
      void main() { float r = length(vUv - 0.5) * 2.0; float a = pow(max(0.0, 1.0 - r), 1.6) * uA; gl_FragColor = vec4(uC, a); }`,
    transparent: true, depthWrite: true, blending: THREE.AdditiveBlending, opacity: 0.45,
  });
  m.userData.noOutline = true; m.userData.glow = true;
  const o = steamy(new THREE.Mesh(new THREE.PlaneGeometry(1, 1), m), 5); parent.add(o); return o;
}
// two lamps in turn, 2 a second: the first (-x) lit in the first half of each 0.5 s, the second in the next, a short crossfade
function turn(clk) { const p = fract(clk * 2), dc = Math.abs(fract(p + 0.25) - 0.5), a = 1 - sm((dc - 0.21) / 0.08); return [a, 1 - a]; }
// a flat quad on a side plane (x = const), points [z, y]; double sided so the winding does not matter
function sideQuad(x, pts, m, parent, order = 0) {
  const pos = [], idx = [0, 1, 2, 0, 2, 3];
  pts.forEach(([z, y]) => pos.push(x, y, z));
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  const o = new THREE.Mesh(g, m); o.castShadow = false; o.receiveShadow = true; if (order) o.renderOrder = order; parent.add(o); return o;
}

export const TOW_KINDS = {
  // ------------------------------------------------------------------------------------------------------------ towtruck
  towtruck(P) {
    const S = P.spec, W = 1.0, red = mat(S.color || "#e2572b", { roughness: 0.55 }), dark = mat("#22252b", { roughness: 0.8 }), steel = mat("#9aa3a8", { roughness: 0.4, metalness: 0.4 }), ram = mat("#6b707c", { roughness: 0.4, metalness: 0.4 });
    const yel = mat("#f2c230", { roughness: 0.55 }), yelD = mat("#b58a1c", { roughness: 0.55 }), board = mat("#3a3f47", { roughness: 0.7 }), tyre = mat("#26252b", { roughness: 0.92 });
    const pane = mat("#1c222c", { roughness: 0.15, metalness: 0.3, transparent: true, opacity: 0.6, depthWrite: false, side: THREE.DoubleSide }); pane.userData.noOutline = true;
    const stripeY = mat("#f2c230", { roughness: 0.6, side: THREE.DoubleSide }), stripeD = mat("#22252b", { roughness: 0.8, side: THREE.DoubleSide });
    // the cab: one side profile (z, y) extruded across the width (the ambulance's way); the bevel adds 0.04 each way
    const pr = new THREE.Shape(); [[0.94, 0.54], [2.76, 0.54], [2.76, 1.03], [2.58, 1.2], [2.0, 1.23], [1.47, 2.11], [0.94, 2.11]].forEach(([z, y], i) => (i ? pr.lineTo(z, y) : pr.moveTo(z, y))); pr.closePath();
    const cg = new THREE.ExtrudeGeometry(pr, { depth: 2 * W - 0.08, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 1 });
    cg.rotateY(-Math.PI / 2); cg.translate(W - 0.04, 0, 0); cg.computeVertexNormals();
    mesh(cg, red, P.whole);
    // glass: the raked windscreen, a side window each side, a small rear window (dark, see-through)
    const ang = Math.atan2(0.53, 0.88), nz = Math.cos(ang), ny = Math.sin(ang);
    const ws = steamy(new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.96), pane), 3); ws.rotation.x = -ang; ws.position.set(0, 1.68 + ny * 0.012, 1.735 + nz * 0.012); P.whole.add(ws);
    const rw = steamy(new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.55), pane), 3); rw.rotation.y = Math.PI; rw.position.set(0, 1.72, 0.9 - 0.045); P.whole.add(rw);
    for (const s of [-1, 1]) {
      const x = s * (W + 0.047);
      steamy(sideQuad(x, [[1.02, 1.42], [1.82, 1.42], [1.52, 2.0], [1.02, 2.0]], pane, P.whole), 3);
      mesh(box(0.012, 0.9, 0.012, s * (W + 0.048), 1.12, 1.0), dark, P.whole);                // the door line
      mesh(box(0.014, 0.025, 0.12, s * (W + 0.05), 1.38, 1.1), steel, P.whole);                // the handle
      const arch = mesh(new THREE.CircleGeometry(0.5, 24), dark, P.whole, s * (W + 0.002), 0.42, 1.9); arch.rotation.y = s * Math.PI / 2; arch.castShadow = false;
      mesh(box(0.1, 0.32, 0.2, s * (W + 0.1), 1.62, 1.95), dark, P.whole);                       // a plain mirror
    }
    // the front: a plain grille (dark panel, four steel bars), two round headlamps, a bumper
    mesh(box(1.0, 0.3, 0.02, 0, 0.78, 2.8 + 0.045), dark, P.whole);
    for (let i = 0; i < 4; i++) mesh(box(0.94, 0.02, 0.02, 0, 0.67 + i * 0.07, 2.8 + 0.06), steel, P.whole);
    mesh(box(2.08, 0.18, 0.14, 0, 0.42, 2.8 + 0.06), dark, P.whole);
    const lampM = basic("#fff6c8");
    for (const s of [-1, 1]) {
      const hl = mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.04, 20), lampM, P.whole, s * 0.72, 0.92, 2.8 + 0.045); hl.rotation.x = Math.PI / 2; hl.castShadow = false;
      const rg = mesh(new THREE.TorusGeometry(0.115, 0.014, 6, 20), steel, P.whole, s * 0.72, 0.92, 2.8 + 0.04); rg.castShadow = false;
    }
    // the roof bar: a dark base 1.3 x 0.24 and two amber domes (to y 2.33), a glow card each
    mesh(box(1.3, 0.05, 0.24, 0, 2.15 + 0.025, 1.2), dark, P.whole);
    const ambD = new THREE.Color("#6a4a14"), ambH = new THREE.Color("#ffb02e"), ambW = new THREE.Color("#ffe6a8"), lamps = [-1, 1].map((s) => {
      const m = new THREE.MeshBasicMaterial({ color: ambD.clone() }); m.userData.noOutline = true;
      const dome = mesh(new THREE.SphereGeometry(0.13, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.95, 0.85), m, P.whole, s * 0.45, 2.2, 1.2); dome.castShadow = false;
      const glow = glowCard(P.whole, "#ffb02e", 0.55, 0.25); glow.position.set(s * 0.45, 2.27, 1.2);
      return { m, glow };
    });
    // the deck: a steel slab y 0.86..0.98, the frame under it, side boards with five diagonal stripes, a rear board and a head board
    mesh(box(2.1, 0.12, 3.7, 0, 0.92, -0.95), board, P.whole);
    mesh(box(1.3, 0.36, 5.5, 0, 0.68, -0.05), dark, P.whole);
    mesh(box(2.1, 0.14, 0.14, 0, 0.5, -2.82), dark, P.whole);                                  // rear bumper beam
    for (const s of [-1, 1]) {
      mesh(box(0.05, 0.25, 3.7, s * 1.05, 0.98 + 0.125, -0.95), board, P.whole);
      const x = s * (1.05 + 0.028);
      for (let i = 0; i < 5; i++) {
        const a = -2.8 + 0.35 + i * 0.74;
        sideQuad(x, [[a, 0.98], [a + 0.3, 0.98], [a + 0.05, 1.23], [a - 0.25, 1.23]], stripeY, P.whole);
        if (i < 4) sideQuad(x, [[a + 0.37, 0.98], [a + 0.55, 0.98], [a + 0.3, 1.23], [a + 0.12, 1.23]], stripeD, P.whole);
      }
      mesh(box(0.14, 0.2, 0.03, s * 0.88, 0.64, -2.84), new THREE.MeshBasicMaterial({ color: "#c8302a" }), P.whole).castShadow = false;   // tail lamps
    }
    mesh(box(2.1, 0.25, 0.05, 0, 0.98 + 0.125, -2.775), board, P.whole);
    mesh(box(2.1, 0.25, 0.05, 0, 0.98 + 0.125, 0.875), board, P.whole);
    // the crane: a turntable on the deck, a ram, the boom (pivot (0, 1.30, 0.2), 30 degrees to the rear, tip (0, 3.10, -2.92)), a sheave, cable, hook
    const PV = [0, 1.3, 0.2], TIP = TOW.tip, dir = new THREE.Vector3(TIP[0] - PV[0], TIP[1] - PV[1], TIP[2] - PV[2]).normalize();
    mesh(box(0.56, 0.32, 0.5, 0, 1.14, 0.2), yelD, P.whole);
    mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.1, 14).rotateZ(Math.PI / 2), steel, P.whole, 0, 1.3, 0.2);
    const at = (s) => [PV[0], PV[1] + dir.y * s, PV[2] + dir.z * s];
    beam(at(0), at(2.2), 0.14, yel, P.whole);
    beam(at(1.9), at(3.6), 0.11, yelD, P.whole);                                                  // the sliding section, to the tip
    for (const s of [0.5, 1.0, 1.5]) beam(at(s - 0.03), at(s + 0.03), 0.152, dark, P.whole);       // three dark bands
    beam([0, 0.98, 0.6], at(1.35), 0.07, ram, P.whole); beam([0, 0.98, 0.6], at(0.8), 0.1, ram, P.whole);   // the ram
    mesh(cylX(0.07, 0.2, 12), steel, P.whole, 0, TIP[1] - 0.03, TIP[2] + 0.02);                    // the sheave at the tip
    const hookTop = TOW.hook;
    mesh(new THREE.CylinderGeometry(0.012, 0.012, TIP[1] - 0.03 - hookTop[1], 6), steel, P.whole, 0, (TIP[1] - 0.03 + hookTop[1]) / 2, hookTop[2]);   // the cable
    // the hook: an eye, a shank and a J bow opening toward -z, 0.22 tall
    const hk = new THREE.Group(); hk.position.set(hookTop[0], hookTop[1], hookTop[2]); P.whole.add(hk);
    mesh(new THREE.TorusGeometry(0.035, 0.012, 5, 10), steel, hk, 0, -0.03, 0);
    mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.07, 8), steel, hk, 0, -0.07, 0);
    mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([[0, -0.07, 0], [0, -0.13, 0], [0, -0.18, -0.02], [0, -0.2, -0.08], [0, -0.17, -0.15], [0, -0.115, -0.225]].map((p) => new THREE.Vector3(...p))), 10, 0.021, 6), steel, hk);
    // detail: fender flares over the front wheels, rear mud flaps, an exhaust stack and a headache rack behind the cab
    for (const s of [-1, 1]) {
      const fl = mesh(new THREE.TorusGeometry(0.5, 0.035, 4, 12, Math.PI), board, P.whole, s * (W + 0.03), 0.42, 1.9); fl.rotation.y = Math.PI / 2;
      mesh(box(0.03, 0.3, 0.3, s * 1.0, 0.45, -2.12), dark, P.whole);
      mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.5, 8), steel, P.whole, s * 0.9, 1.65, 0.8 - 0.05).castShadow = false;
    }
    for (const x of [-0.95, 0.95]) mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.0, 6), dark, P.whole, x, 1.48, 0.7);
    mesh(box(1.9, 0.06, 0.06, 0, 1.98, 0.7), dark, P.whole); mesh(box(1.9, 0.05, 0.05, 0, 1.55, 0.7), dark, P.whole);
    // the wheels: dark tyre, steel hub with five lugs; front on a steering pivot; twin at the rear
    const wheels = [];
    const wheel = (x, z, front, w) => {
      const pivot = new THREE.Group(); pivot.position.set(x, 0.42, z); P.whole.add(pivot);
      const spin = new THREE.Group(); pivot.add(spin);
      mesh(cylX(0.42, w, 22), tyre, spin);
      mesh(cylX(0.25, w + 0.02, 16), steel, spin);
      for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; mesh(cylX(0.025, w + 0.05, 6), dark, spin, 0, Math.cos(a) * 0.14, Math.sin(a) * 0.14); }
      wheels.push({ pivot, spin, front });
    };
    for (const s of [-1, 1]) { wheel(s * 0.94, 1.9, true, 0.26); wheel(s * 0.94, -1.6, false, 0.22); wheel(s * 0.72, -1.6, false, 0.22); }
    for (const s of [-1, 1]) { const ra = mesh(new THREE.CircleGeometry(0.5, 24), dark, P.whole, s * 1.052, 0.42, -1.6); ra.rotation.y = s * Math.PI / 2; ra.castShadow = false; }
    return {
      grip: 0,
      apply(ps, t) {
        const d = ps.len ?? 0, st = ps.bend ?? 0, lights = clamp(ps.lights ?? S.lights ?? 0), clk = ps.clock ?? S.clock ?? t ?? 0, f = turn(clk);
        for (const W of wheels) { W.pivot.rotation.y = W.front ? rad(st) : 0; W.spin.rotation.x = d / 0.42; }
        lamps.forEach((l, i) => { const v = clamp(f[i] * lights); l.m.color.copy(ambD).lerp(ambH, v).lerp(ambW, 0.35 * v * v); l.glow.material.uniforms.uA.value = 0.9 * v; l.glow.visible = v > 0.01; });
      },
    };
  },

  // ------------------------------------------------------------------------------------------------------------ coatheap
  coatheap(P) {
    const S = P.spec, cloth = mat("#efe3c8", { roughness: 0.95 }), clump = mat("#f7efdc", { roughness: 0.95 }), ink = mat("#8a7556", { roughness: 0.95 }), gold = mat("#f6c832", { roughness: 0.35, metalness: 0.5 }), glintM = basic("#fff3b0");
    const RX = 0.3, RZ = 0.24, H = 0.24;
    // the mound: an upper half-superellipsoid with a gentle hand-made wobble, open below (it sits on the cushion)
    const mg = new THREE.SphereGeometry(1, 14, 5, 0, Math.PI * 2, 0, Math.PI / 2), mp = mg.attributes.position, v = new THREE.Vector3();
    for (let i = 0; i < mp.count; i++) {
      v.fromBufferAttribute(mp, i); const w = 1 + 0.07 * Math.sin(v.x * 9 + 1.3) * Math.cos(v.z * 8 + 0.4) * (v.y > 0.05 ? 1 : 0);
      mp.setXYZ(i, v.x * RX, v.y * H * w, v.z * RZ);
    }
    mg.computeVertexNormals(); mesh(mg, cloth, P.whole);
    const top = (x, z) => H * Math.sqrt(Math.max(0, 1 - (x / RX) ** 2 - (z / RZ) ** 2));
    // the collar roll along the back (-z), peaking at 0.30; the folded sleeve across the front
    const tubeAt = (pts, r, n, seg = 5) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))), n, r, seg);
    mesh(tubeAt([[-0.25, 0.07, -0.1], [-0.15, 0.2, -0.17], [0, 0.23, -0.19], [0.15, 0.2, -0.17], [0.25, 0.07, -0.1]], 0.07, 12, 4), cloth, P.whole);
    const foldPath = [[-0.12, 0.145, 0.12], [0.06, 0.19, 0.12], [0.2, 0.17, 0.07], [0.27, 0.1, 0.02]];
    const folded = new THREE.Group(); P.whole.add(folded);
    mesh(tubeAt(foldPath, 0.052, 8, 4), cloth, folded);
    // the spill sleeve: the same start, over the cushion's edge (x 0.33), the sill (local y -0.27) and 0.30 out on the road (local y -0.46)
    const spillPath = [[-0.12, 0.145, 0.12], [0.06, 0.19, 0.12], [0.22, 0.14, 0.07], [0.34, 0.02, 0.03], [0.5, -0.12, 0.0], [0.65, -0.23, -0.02], [0.76, -0.31, -0.02], [0.84, -0.39, 0.0], [0.92, -0.405, 0.0], [1.06, -0.405, 0.02]];
    const spill = new THREE.Group(); P.whole.add(spill);
    const sleeveCurve = new THREE.CatmullRomCurve3(spillPath.map((p) => new THREE.Vector3(...p)));
    mesh(new THREE.TubeGeometry(sleeveCurve, 18, 0.055, 4), cloth, spill);
    // lobe clumps: along the mound's rim, the collar's crest, the sleeves' ridge, the cuffs last
    const lobeG = new THREE.SphereGeometry(1, 5, 3), lobes = (arr, group) => {
      const gs = arr.map(([x, y, z, r, sy = 0.8]) => lobeG.clone().scale(r, r * sy, r).translate(x, y, z));
      mesh(mergeGeometries(gs), clump, group);
    };
    const rim = []; for (let i = 0; i < 11; i++) { const a = (i / 11) * Math.PI * 2 + 0.2; rim.push([Math.cos(a) * (RX - 0.01), 0.035 + 0.012 * rnd(i), Math.sin(a) * (RZ - 0.01), 0.04 + 0.014 * rnd(i + 20)]); }
    for (let i = 0; i < 5; i++) { const k = i / 4; rim.push([(k - 0.5) * 0.46, 0.225 + 0.08 * Math.sin(k * Math.PI) - 0.02, -0.19 - 0.02 * Math.sin(k * Math.PI), 0.034 + 0.008 * rnd(i + 40)]); }
    lobes(rim, P.whole);
    lobes([[0.27, 0.1, 0.02, 0.05, 1], [0.29, 0.07, 0.07, 0.04, 1], [0.24, 0.06, -0.04, 0.04, 1], [-0.12, 0.2, 0.12, 0.03], [0.0, 0.245, 0.12, 0.03], [0.14, 0.235, 0.1, 0.03]], folded);
    const ridge = []; for (let i = 0; i < 7; i++) { const q = sleeveCurve.getPointAt(0.14 + (0.6 * i) / 6); ridge.push([q.x, q.y + 0.05, q.z, 0.03 + 0.006 * rnd(i + 60)]); }
    const cuff = sleeveCurve.getPointAt(0.99);
    lobes([...ridge, [cuff.x + 0.01, cuff.y + 0.005, cuff.z, 0.062, 1], [cuff.x - 0.03, cuff.y + 0.03, cuff.z + 0.045, 0.045, 1], [cuff.x - 0.03, cuff.y + 0.02, cuff.z - 0.05, 0.045, 1], [cuff.x + 0.05, cuff.y, cuff.z + 0.03, 0.04, 1]], spill);
    // ink marks: short flat strokes lying on the mound (and three on the sleeve), the coat's hand-drawn hatching
    const strokes = [], flat = (x, y, z, a, len = 0.05) => strokes.push(new THREE.PlaneGeometry(len, 0.011).rotateX(-Math.PI / 2).rotateY(a).translate(x, y, z));
    for (let i = 0; i < 9; i++) { const x = -0.22 + 0.44 * rnd(i + 80), z = -0.12 + 0.24 * rnd(i + 90); flat(x, top(x, z) + 0.012, z, rad(-30 + 70 * rnd(i + 100))); }
    mesh(mergeGeometries(strokes), ink, P.whole).castShadow = false;
    const sk = []; for (let i = 0; i < 4; i++) { const q = sleeveCurve.getPointAt(0.3 + 0.17 * i); sk.push(new THREE.PlaneGeometry(0.045, 0.011).rotateX(-Math.PI / 2).rotateY(rad(25 * i)).translate(q.x, q.y + 0.056, q.z)); }
    mesh(mergeGeometries(sk), ink, spill).castShadow = false;
    // the chain: links 0.046 x 0.032 at 0.034 pitch along one path: an S on the mound, then over the cushion edge and the sill to the
    // road. The path is 1.2 m long, so it takes about 36 links, not the costume's 24: the heap edge is 0.9 m of chain from the road.
    const sPts = []; for (let i = 0; i <= 8; i++) { const u = i / 8, x = 0.0 + 0.3 * u, z = 0.07 + 0.045 * Math.sin(u * Math.PI * 2 + 0.3), y = Math.max(top(x, z) + 0.028, 0.025); sPts.push([x, y, z]); }
    const dPts = [[0.34, 0.03, 0.14], [0.45, -0.07, 0.14], [0.58, -0.17, 0.14], [0.68, -0.25, 0.14], [0.78, -0.31, 0.13], [0.86, -0.385, 0.13], [0.92, -0.435, 0.13], [1.06, -0.44, 0.13]];
    const chainCurve = new THREE.CatmullRomCurve3([...sPts, ...dPts].map((p) => new THREE.Vector3(...p)), false, "centripetal");
    const linkG = new THREE.TorusGeometry(0.0155, 0.0052, 3, 5).scale(1, 1.44, 1), links = { heap: [], spill: [] }, glints = { heap: [], spill: [] };
    const CL = chainCurve.getLength(), N = S.links ?? Math.floor((CL - 0.012) / 0.034) + 1, up = new THREE.Vector3(0, 1, 0), counts = { heap: 0, sill: 0, road: 0, length: +CL.toFixed(3) };
    for (let i = 0; i < N; i++) {
      const u = Math.min(1, (0.006 + i * 0.034) / CL), p = chainCurve.getPointAt(u), tg = chainCurve.getTangentAt(u);
      const q = new THREE.Quaternion().setFromUnitVectors(up, tg).multiply(new THREE.Quaternion().setFromAxisAngle(up, (i % 2) * Math.PI / 2));
      const g = linkG.clone().applyMatrix4(new THREE.Matrix4().compose(p, q, new THREE.Vector3(1, 1, 1)));
      counts[p.x < 0.31 ? "heap" : p.y > -0.425 ? "sill" : "road"]++;
      const key = p.x < 0.31 ? "heap" : "spill"; links[key].push(g);
      if (i % 3 === 1) glints[key].push(new THREE.SphereGeometry(0.0075, 3, 2).translate(p.x, p.y + 0.014, p.z));
    }
    P.chainCounts = counts;
    mesh(mergeGeometries(links.heap), gold, P.whole); mesh(mergeGeometries(links.spill), gold, spill);
    for (const k of ["heap", "spill"]) if (glints[k].length) mesh(mergeGeometries(glints[k]), glintM, k === "heap" ? P.whole : spill).castShadow = false;
    return {
      grip: 0,
      apply(ps) {
        const on = clamp(ps.door ?? S.door ?? 0) > 0.02;
        spill.visible = on; folded.visible = !on;
      },
    };
  },
};
