import * as THREE from "three";
import { clamp } from "./util.js";
import { JET, SQ, body, hull, skin, foil } from "./props-freefall.js";
import { CITY_KINDS } from "./props-city.js";

// You wake up mid, EP01 "plane crash" (11 Nov 2026): the outside. Four props, built in metres, x right, y up, nose +z.
// Everything solid is built at a tenth and drawn at full size (the airliner's trick, props-freefall.js): the drawn look
// breaks its shadow edges with a noise sized for a 1 m potato, and on a 37 m hull that noise reads as speckle.
//
//   jetwreck   the narrow-body airliner of props-freefall.js BY DAY, crashed belly-first in the snow. Origin on the GROUND
//              under the fuselage's middle, nose +z, its port (left) side +x. The belly is sunk 0.7 m into the snow (the
//              axis is 1.359 m up) and the fuselage rolled 4 degrees to port (left side down). White, one red stripe along
//              the window line, a dark window row (a few lit orange), grey belly, soot and dents, no logos or words. The
//              left wing is torn off 4 m from its root (a ragged, burning stub) and the left engine lies in the snow under
//              it; the right wing is whole; fin and tailplane stand. A berm of ploughed snow runs along both sides of the
//              belly and is piled at the nose. The front-left door (station z +12, +x side) is open: a dark doorway
//              1.0 x 1.9 m with its door leaf swung out, a little orange cabin fire in it.
//              Keys (propState tweens them; spec values for them are ignored, set them with {do:"prop", set:{...}}):
//                fire   0..1  flames on the wing stub and the engine in the snow, and a black-grey smoke column from them,
//                             25 m tall at 1, leaning toward -z and -x (the wind blows from the nose side); 0 = none.
//                broken 0..1  the BREAK key: 0 (default) the crashed wreck above; 1 the plane before the left wing tears
//                             off (panel 05): left wing whole with its engine on the pylon (burning, fire 1: flames and a
//                             smoke trail streaming back along -z), the right engine on its pylon, no snow berm. It flips
//                             at 0.5 (a tween of `broken` is a cut, not a morph).
//                tail   0|1   TAIL TORN OFF (default 0 = the plane as above, drawn exactly as before). At 1 nothing aft of
//                             station z = -9.0 is drawn (fuselage, tail cone, fin, tailplane, stripe, windows, aft doors, dents,
//                             berm). The open end (centre [0, 0.22, -9] in the airframe, 3.4 m wide) has a ragged rim of 26 skin
//                             teeth 0.3-1.2 m long pointing aft and bent outward (white going to soot), a charred edge tube, bare
//                             stringers, six hanging cables, a dark liner and a plug 0.5 m inside (nobody sees through the hull).
//                             With fire > 0: cel flames in the opening and black smoke from it (broken 0: rising and leaning
//                             toward -z and -x like the stub's; broken 1: streaming back along -z, 34 m). Works at broken 0 and 1.
//                             It is a step, not a tween. propState starts `tail` at spec.tail ?? 1 and tweens it, so: set it
//                             in the SPEC ({ tail: 1 } torn from the start) or give the spec `tail: 0` and then
//                             { do:"prop", set:{ tail: 1 } } (an action on a spec without `tail` reads as 0 at its start value 1).
//                torn   0|1   the same switch under a name propState does not know: { do:"prop", set:{ torn: 1 } } works with no
//                             spec value (a step at the action's time; spec.torn also works). Either one tears the tail.
//              Spec: none (tail: see above). rot / tip / roll / x / y / z / scale as for any prop (a tip of +20 pitches the nose down).
//              WRECK.door = [2.098, 1.475, 12]: the door's sill (the middle of its bottom edge, on the skin) in the prop's frame
//              at broken 0: the evacslide's origin goes there (turned with the plane); WRECK.doorW x WRECK.doorH = 1.0 x 1.9 the
//              opening. The sill is 1.475 m up, not 2.3: a 1.9 m door under a roof 3.42 m high cannot start at 2.3 m, so the
//              door runs from y 1.475 to about 3.2 and the slide's spec.h should be 1.475 (or the plane's nose-up pitch changes it).
//              Only fuselage, wings, tail and engines are solid for the checks; fire, smoke, berm, windows, door glass,
//              dents and decals are see-through (userData.steam). Nothing casts a shadow. Nobody holds it (grip 0).
//   wingchunk  the outer 13 m of the airliner's LEFT wing, torn off (x 3.2..16.2 of the wing, the same white-grey loft with its
//              5 degrees of dihedral and its upturned winglet), a loose piece. Origin: the middle of the piece (mid-span, mid-chord),
//              lying flat: span along x, the winglet end at +x, chord along z (leading edge +z), the winglet up. The root end (-x, 6.5 m
//              from the origin, the middle of its chord) is ragged and torn: 28 charred skin teeth bent up and down, black shards,
//              spar stubs, a black cut face and a bent flap. 13 m x 5.8 m at the root. Spec: none. Nobody holds it (grip 0).
//              Key: fire 0..1 (tweens): cel flames at the ragged end (about 5 m wide, 5 m tall) and a short black smoke trail (4 m)
//              rising from it and leaning a little toward -x. Flames and smoke are kept upright in the WORLD however the piece
//              turns (the generator throws and spins it with x / y / z / rot / tip / roll tweens). The whole piece is see-through
//              for the checks (userData.steam), no shadow.
//   evacslide  a yellow inflatable escape slide. Origin: the middle of its top edge (at the door sill); it runs out along
//              +x and down: 1.3 m wide, two side tubes of 0.2 m radius, cross tubes under a grey sliding face, a 0.8 m flat
//              run-out on the ground.
//              Spec: h (drop in m, default 2.3), len (horizontal run to the foot of the slope, default 5.0).
//              Key: on 0..1 inflates it (0 hidden; it unfolds out of the sill, scaled from the origin, tubes filling).
//              SLIDE.at(u, h = 2.3, len = 5.0) -> [x, y, z]: the rider's seat point on the sliding face (the surface, z 0
//              the middle), u 0 at the top edge to 1 at the far end of the run-out (by arc length), in the prop's frame.
//              The whole slide is see-through for the checks (cloth).
//   bridgeend  the broken end of a concrete road bridge. Origin: the middle of the broken edge at road level; the deck
//              (8 m wide, 0.9 thick: asphalt with a dashed centre line, kerbs, steel guard rails both sides bent outward
//              at the break, rebar out of the jagged edge) runs back along -z; one pier under it at z -6 goes down 40 m.
//              Spec: len (deck length, default 16), at (clip time the break lets go, default 0).
//              Debris: 12 concrete chunks and one bent rail piece fly off the edge toward +z and down, ballistic, a pure
//              function of (t - spec.at), for 2.5 s (hidden before spec.at and after +2.5 s); see-through for the checks.
//              No keys. The deck and pier are solid.
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const sm = (x) => { const k = clamp(x); return k * k * (3 - 2 * k); };
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...o });
const flat = (color, o = {}) => { const m = new THREE.MeshBasicMaterial({ color, ...o }); m.userData.noOutline = true; return m; };
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = false; parent.add(o); return o; }
const steamy = (o, order = 0) => { o.traverse((c) => { c.userData.steam = true; c.castShadow = false; if (order) { c.renderOrder = order; c.frustumCulled = false; } }); return o; };
// built in metres, drawn at a tenth (see the top): geometry and positions x K, the group back up by 1 / K
const K = 0.1;
function big(g) {
  const done = new Set();
  g.traverse((o) => { if (o === g) return; o.position.multiplyScalar(K); if (o.geometry && !done.has(o.geometry)) { o.geometry.scale(K, K, K); done.add(o.geometry); } });
  g.scale.setScalar(1 / K);
  return g;
}
// vertex colours from a function of the position: [r, g, b] multipliers on the material colour
function tint(geo, fn) {
  const p = geo.attributes.position, c = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) c.set(fn(p.getX(i), p.getY(i), p.getZ(i)), i * 3);
  geo.setAttribute("color", new THREE.Float32BufferAttribute(c, 3)); return geo;
}
// props-freefall.js's hull() winds its triangles inward (it shows the far wall seen from inside); turn them outward so a
// patch on the near side is not culled and the shading is the right way round
function outward(geo) { const i = geo.index.array; for (let k = 0; k < i.length; k += 3) { const t = i[k + 1]; i[k + 1] = i[k + 2]; i[k + 2] = t; } geo.computeVertexNormals(); return geo; }
const mix3 = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

// ---------------------------------------------------------------- the wreck's numbers
const Y0 = JET.R * SQ - 0.7;                  // the fuselage axis above the snow (the belly 0.7 m down)
const ROLL = (-4 * Math.PI) / 180;            // rolled to port: the +x side goes down
const DOOR = { z0: 11.5, z1: 12.5, a0: 0.12, a1: 1.05 };   // the front-left door's opening: stations and angles on the skin
// a point of the airframe's own frame (axis at the origin) in the prop's frame (ground at the origin, rolled)
const af2p = (x, y, z) => [x * Math.cos(ROLL) - y * Math.sin(ROLL), Y0 + x * Math.sin(ROLL) + y * Math.cos(ROLL), z];
const SILL = af2p(...skin((DOOR.z0 + DOOR.z1) / 2, DOOR.a0, 0.12).p.toArray());
export const WRECK = { door: SILL.map((v) => +v.toFixed(3)), doorW: 1.0, doorH: 1.9 };

// the slide's centre line: (x, y) from the top edge (0, 0) to the foot (len, -h), then 0.8 m of flat run-out
function slideLine(h, len) {
  const f = (s) => { const m0 = 1.35; return m0 * (s - 2 * s * s + s ** 3) + (3 * s * s - 2 * s ** 3); };
  const pts = []; for (let i = 0; i <= 40; i++) pts.push([(len * i) / 40, -h * f(i / 40)]);
  for (let i = 1; i <= 4; i++) pts.push([len + 0.2 * i, -h]);
  return pts;
}
export const SLIDE = {
  at(u, h = 2.3, len = 5.0) {
    const pts = slideLine(h, len), cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const d = clamp(u) * cum[cum.length - 1]; let i = 1; while (i < cum.length - 1 && cum[i] < d) i++;
    const k = (d - cum[i - 1]) / (cum[i] - cum[i - 1] || 1);
    return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k, 0].map((v) => +v.toFixed(4));
  },
};

// ---------------------------------------------------------------- smoke: a ragged cel puff, dark charcoal with a lit top
function smokeMaterial(seed) {
  const m = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uR: { value: 1 }, uA: { value: 0 }, uSeed: { value: seed }, uTone: { value: 0.3 } },
    vertexShader: `uniform float uR; varying vec2 vUv;
      void main() { vUv = uv; vec4 c = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0); c.xy += (uv - 0.5) * 2.0 * uR; gl_Position = projectionMatrix * c; }`,
    fragmentShader: `uniform float uTime, uA, uSeed, uTone; varying vec2 vUv;
      float band(float e, float x) { float w = fwidth(x) * 0.9 + 0.004; return smoothstep(e - w, e + w, x); }
      void main() {
        vec2 q = (vUv - 0.5) * 2.0; float a = atan(q.y, q.x), r = length(q);
        float edge = 0.76 + 0.1 * sin(a * 4.0 + uSeed * 6.0) + 0.07 * sin(a * 7.0 - uSeed * 3.0 + uTime * 0.5) + 0.05 * sin(a * 11.0 + uSeed * 9.0);
        float d = r / edge; if (d > 1.0) discard;
        vec3 dark = mix(vec3(0.035, 0.033, 0.04), vec3(0.11, 0.105, 0.115), uTone), mid = dark * 1.9 + 0.02, lit = mix(vec3(0.2, 0.195, 0.21), vec3(0.4, 0.39, 0.4), uTone);
        float L = q.y * 0.7 - q.x * 0.25 - d * 0.25;
        vec3 col = mix(dark, mid, band(-0.12, L)); col = mix(col, lit, band(0.42, L));
        gl_FragColor = vec4(col, (1.0 - smoothstep(0.88, 1.0, d)) * uA);
      }`,
    transparent: true, depthWrite: false,
  });
  m.userData.noOutline = true; return m;
}
// a column of puffs that ride up a path on a loop (deterministic in t): origin o, up hy metres, along dir by l1 + l2 u^2
function column(parent, n, seed) {
  const puffs = Array.from({ length: n }, (_, i) => {
    const m = smokeMaterial(rnd(seed + i) * 5), o = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), m); steamy(o, 4 + (i % 3));
    o.material.depthWrite = false; parent.add(o);
    return { o, m, s: i / n, jx: rnd(seed + i * 3 + 1) - 0.5, jz: rnd(seed + i * 3 + 2) - 0.5, tone: rnd(seed + i * 5 + 7) };
  });
  return {
    update(t, f, o, hy, dir, l1, l2, size, period) {
      parent.visible = f > 0.01; if (f <= 0.01) return;
      for (const p of puffs) {
        const u = (p.s + t / period) % 1, lat = l1 * u + l2 * u * u, r = size * (0.22 + 0.78 * u ** 0.8);
        p.o.position.set(o[0] + dir[0] * lat + p.jx * r * 0.9 + 0.25 * r * Math.sin(t * 0.7 + p.s * 40), o[1] + hy * u, o[2] + dir[2] * lat + p.jz * r * 0.9);
        p.m.uniforms.uR.value = r; p.m.uniforms.uTone.value = clamp(0.05 + 0.55 * u + 0.25 * p.tone);
        p.m.uniforms.uA.value = f * 0.95 * sm(u / 0.05) * (1 - sm((u - 0.72) / 0.28)); p.m.uniforms.uTime.value = t;
      }
    },
  };
}

// ---------------------------------------------------------------- one engine nacelle (front at z 0, running back to -4.1), the freefall airliner's
function engine(parent, white, metal, dark) {
  const E = new THREE.Group(); parent.add(E);
  const prof = [[0.92, 0], [1.06, 0.15], [1.1, 0.8], [1.06, 2.4], [0.86, 3.6], [0.62, 4.1], [0.0, 4.1]].map(([r, z]) => new THREE.Vector2(r, z));
  const nac = mesh(new THREE.LatheGeometry(prof, 32), white, E); nac.rotation.x = -Math.PI / 2;
  mesh(new THREE.TorusGeometry(0.98, 0.09, 10, 32), metal, E, 0, 0, 0.02);
  mesh(new THREE.CircleGeometry(0.93, 32), dark, E, 0, 0, -0.25);
  const spin = mesh(new THREE.ConeGeometry(0.26, 0.5, 16), mat("#e8ecf2"), E, 0, 0, -0.04); spin.rotation.x = Math.PI / 2;
  for (let b = 0; b < 14; b++) { const bl = mesh(new THREE.BoxGeometry(0.1, 0.72, 0.02), metal, E); const a = (b / 14) * Math.PI * 2; bl.position.set(Math.cos(a) * 0.5, Math.sin(a) * 0.5, -0.22); bl.rotation.set(0.5, 0, a - Math.PI / 2); }
  mesh(new THREE.ConeGeometry(0.42, 1.1, 18), metal, E, 0, 0, -4.6).rotation.x = -Math.PI / 2;
  return E;
}

export const WAKEOUT_KINDS = {
  jetwreck(P) {
    const R = JET.R, g = new THREE.Group(); P.whole.add(g);
    const af = new THREE.Group(); af.position.set(0, Y0, 0); af.rotation.z = ROLL; g.add(af);   // the airframe: axis at the origin, rolled
    // tail 1 (torn off): aftG (everything aft of the cut, drawn as it always was) is hidden and cutG (the shorter hull, the ragged rim, the plug) shown
    const aftG = new THREE.Group(), cutG = new THREE.Group(); af.add(aftG, cutG);
    const TAILZ = -9.0, TNZ = Math.round((110 * (JET.nose - TAILZ)) / (JET.nose - JET.tail));
    const skinM = (color, o = {}) => { const m = mat(color, o); m.userData.noHatch = true; return m; };
    const white = skinM("#eceff3", { vertexColors: true, }), belly = skinM("#a9b1bd"), red = skinM("#c2332f"), grey = skinM("#aab3c0", { side: THREE.DoubleSide });
    const char = skinM("#1f1c1b", { side: THREE.DoubleSide }), metal = mat("#8f98a6", { metalness: 0.3, roughness: 0.5 }), snowM = skinM("#f1f5fb", { roughness: 0.95 });
    const dark = flat("#0f121a"), dent = skinM("#8e97a7", { side: THREE.DoubleSide }), hole = flat("#14161d", { side: THREE.DoubleSide });
    // ---- the fuselage: white with soot streaked over the burning wing and along the back, mottled dirt
    const soot = [0.03, 0.028, 0.026], stain = [0.8, 0.72, 0.62];
    const hullTint = (x, y, z) => {
      const side = clamp(x / 1.2), top = clamp((y - 0.2) / 1.6);
      const s = clamp(0.95 * Math.exp(-(((z - 1) / 5.5) ** 2)) * side * top + 0.7 * Math.exp(-(((z + 5) / 6) ** 2)) * side * top * 0.7 + 0.18 * top);
      const d = 0.5 + 0.5 * Math.sin(z * 1.7 + x * 3.1) * Math.sin(y * 2.3 + z * 0.9);
      return mix3(mix3([1, 1, 1], stain, d > 0.78 ? 0.35 : 0), soot, s * 0.85).map((v) => v * 0.6);   // under the golden sun a white hull blows out into the snow: keep it a light grey
    };
    mesh(tint(outward(hull(0, Math.PI * 2, JET.tail, JET.nose, 0, 48, 110)), hullTint), white, aftG);
    mesh(tint(outward(hull(0, Math.PI * 2, TAILZ, JET.nose, 0, 48, TNZ)), hullTint), white, cutG);
    mesh(outward(hull(Math.PI * 1.13, Math.PI * 1.87, JET.tail + 0.6, JET.nose - 0.4, 0.08, 24, 90)), belly, aftG);
    mesh(outward(hull(Math.PI * 1.13, Math.PI * 1.87, TAILZ, JET.nose - 0.4, 0.08, 24, 60)), belly, cutG);
    for (const s of [1, -1]) {   // the one red stripe along the window line
      const a = (d) => (s > 0 ? d : Math.PI - d), [p0, p1] = [a(-0.24), a(-0.1)].sort((x, y) => x - y);
      mesh(outward(hull(p0, p1, -9.5, 15.6, 0.09, 4, 80)), red, aftG);
      mesh(outward(hull(p0, p1, TAILZ, 15.6, 0.09, 4, 66)), red, cutG);
    }
    // the dark window row, a few lit orange by the fire inside; the door's stretch is left out
    const winGeo = new THREE.PlaneGeometry(0.3, 0.44), glow = flat("#ff9a3d", { toneMapped: false });
    let wi = 0;
    for (const s of [1, -1]) for (let z = 11.2; z > -10.3; z -= 0.53, wi++) {
      if (Math.abs(z - 0.9) < 0.5) continue;
      const { p, n } = skin(z, s > 0 ? 0.2 : Math.PI - 0.2, 0.12), lit = s > 0 && z < 7 && z > -6 && wi % 5 === 2;
      const w = mesh(winGeo, lit ? glow : dark, z < TAILZ + 0.15 ? aftG : af); w.position.copy(p); w.lookAt(p.clone().add(n)); w.userData.steam = true;
    }
    for (const s of [1, -1]) [[16.25, 0.28, 0.5], [16.0, 0.62, 0.42], [15.6, 0.95, 0.36]].forEach(([z, a, w]) => {
      const { p, n } = skin(z, s > 0 ? a * 0.9 + 0.25 : Math.PI - (a * 0.9 + 0.25), 0.11);
      const q = mesh(new THREE.PlaneGeometry(w, 0.36), dark, af); q.position.copy(p); q.lookAt(p.clone().add(n)); q.userData.steam = true;
    });
    // the other doors, shut (the front-left one is the open doorway below)
    for (const [s, z] of [[-1, 12], [1, -11.2], [-1, -11.2]]) {
      const { p, n } = skin(z, s > 0 ? 0.05 : Math.PI - 0.05, 0.11);
      const dg = z < TAILZ ? aftG : af;
      const d = mesh(new THREE.PlaneGeometry(0.85, 1.85), flat("#9aa3b1"), dg); d.position.copy(p); d.lookAt(p.clone().add(n)); d.userData.steam = true;
      const d2 = mesh(new THREE.PlaneGeometry(0.75, 1.75), white, dg); d2.position.copy(p).addScaledVector(n, 0.05); d2.lookAt(p.clone().add(n.clone().multiplyScalar(2))); d2.userData.steam = true;
    }
    // ---- the open front-left door: a frame, a dark opening with the cabin fire low in it, the sill and the door leaf swung out
    const patch = (a0, a1, z0, z1, out, m) => { const o = mesh(outward(hull(a0, a1, z0, z1, out, 10, 8)), m, af); o.userData.steam = true; return o; };
    patch(DOOR.a0 - 0.05, DOOR.a1 + 0.05, DOOR.z0 - 0.09, DOOR.z1 + 0.09, 0.1, flat("#7d8696"));
    const inside = tint(outward(hull(DOOR.a0, DOOR.a1, DOOR.z0, DOOR.z1, 0.13, 10, 8)), (x, y) => mix3([0.05, 0.055, 0.07], [1.0, 0.5, 0.12], clamp((1.2 - y) / 1.0) ** 1.5 * 0.85));
    const open = mesh(inside, new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false }), af); open.userData.steam = true; open.material.userData.noOutline = true;
    const sill = skin((DOOR.z0 + DOOR.z1) / 2, DOOR.a0, 0.13);
    const ledge = mesh(new THREE.BoxGeometry(1.1, 0.08, 0.2), metal, af); ledge.position.copy(sill.p); ledge.lookAt(sill.p.clone().add(sill.n)); ledge.userData.steam = true;
    const hinge = skin(DOOR.z1, (DOOR.a0 + DOOR.a1) / 2, 0.13), leaf = new THREE.Group(); leaf.position.copy(hinge.p); leaf.lookAt(hinge.p.clone().add(hinge.n)); leaf.rotateY(-1.75); af.add(leaf);   // local +x runs aft: hinged on the forward edge, swung outward
    mesh(new THREE.BoxGeometry(0.95, 1.8, 0.06), white, leaf, 0.475, 0, 0.03).userData.steam = true;
    mesh(new THREE.BoxGeometry(0.8, 1.65, 0.02), flat("#8d96a5"), leaf, 0.475, 0, -0.01).userData.steam = true;
    // ---- dents (a flatter, greyer patch) and tears (a dark jagged hole) on the skin, deterministic
    for (let i = 0; i < 16; i++) {
      const z = 10 - rnd(i * 7 + 1) * 20, s = rnd(i * 7 + 2) > 0.45 ? 1 : -1, a = 0.1 + rnd(i * 7 + 3) * 1.1;
      if (s > 0 && z > DOOR.z0 - 1.2 && z < DOOR.z1 + 1.2 && a < 1.3) continue;
      const { p, n } = skin(z, s > 0 ? a : Math.PI - a, 0.05), tear = i % 4 === 0;
      let m;
      if (tear) { const sh = new THREE.Shape(); for (let k = 0; k < 9; k++) { const r = (k % 2 ? 0.18 : 0.42) * (0.7 + rnd(i * 13 + k)); const x = Math.cos((k / 9) * 6.283) * r, y = Math.sin((k / 9) * 6.283) * r; k ? sh.lineTo(x, y) : sh.moveTo(x, y); } m = mesh(new THREE.ShapeGeometry(sh), hole, z < TAILZ + 1.1 ? aftG : af); }
      else { m = mesh(new THREE.CircleGeometry(1, 14), dent, z < TAILZ + 1.1 ? aftG : af); m.scale.set(0.35 + rnd(i * 5 + 4) * 0.7, 0.25 + rnd(i * 5 + 5) * 0.4, 1); }
      m.position.copy(p); m.lookAt(p.clone().add(n)); m.rotateZ(rnd(i * 3 + 9) * 6); m.userData.steam = true;
    }
    // ---- wings: the right one whole; the left one torn off at x 4.5 (the stub, with a charred ragged end) or whole (broken)
    const ROOT = { le: [0, -1.05, 4.0], c: 6.6, t: 0.13 }, half = 16.2, sweep = Math.tan((25 * Math.PI) / 180), dih = Math.tan((5 * Math.PI) / 180);
    const tipOf = (s) => ({ le: [s * half, -1.05 + half * dih, 4.0 - half * sweep], c: 1.7, t: 0.1 });
    const wing = (s, xcut) => {   // the wing from the root to x = xcut (a share of the span), lofted with the same section
      const u = xcut == null ? 1 : (xcut - 0.5) / (half - 0.5), T = tipOf(s), R0 = { ...ROOT, le: [s * 0.5, ROOT.le[1], ROOT.le[2]] };
      const to = { le: R0.le.map((v, i) => v + (T.le[i] - v) * u), c: R0.c + (T.c - R0.c) * u, t: R0.t + (T.t - R0.t) * u };
      return foil(R0, to);
    };
    const R_ = new THREE.Group(), Lfull = new THREE.Group(), Lstub = new THREE.Group(); af.add(R_, Lfull, Lstub);
    mesh(wing(-1), grey, R_);
    mesh(wing(1), grey, Lfull);
    mesh(wing(1, 4.5), grey, Lstub);
    for (const s of [1, -1]) {   // winglets, the wing-root fairings
      const tl = tipOf(s).le, wl = mesh(foil({ le: [tl[0], tl[1], tl[2] + 0.05], c: 1.6, t: 0.1 }, { le: [tl[0] + s * 0.45, tl[1] + 2.2, tl[2] - 1.15], c: 0.7, t: 0.08 }, { vertical: true }), skinM("#aab3c0", { side: THREE.DoubleSide }), s > 0 ? Lfull : R_); void wl;
      const f = mesh(new THREE.SphereGeometry(1, 20, 12), belly, af, s * 1.15, -1.25, 1.2); f.scale.set(1.1, 0.55, 4.2);
    }
    // the tear: charred jagged shards and a bent skin flap on the stub's cut end (x 4.5)
    const tu = (4.5 - 0.5) / (half - 0.5), tle = [4.5, -1.05 + tu * half * dih, 4.0 - tu * half * sweep], tc = 6.6 - tu * 4.9;
    for (let i = 0; i < 9; i++) {
      const z = tle[2] - ((i + 0.5) / 9) * tc * 0.95, sh = mesh(new THREE.ConeGeometry(0.18 + rnd(i + 3) * 0.2, 0.5 + rnd(i + 8) * 0.9, 5), char, Lstub, tle[0] + 0.1, tle[1] + (rnd(i + 12) - 0.35) * 0.4, z);
      sh.rotation.set((rnd(i + 17) - 0.5) * 0.8, 0, -Math.PI / 2 + (rnd(i + 21) - 0.5) * 0.7);
    }
    const flap = mesh(new THREE.PlaneGeometry(1.3, 1.1), char, Lstub, tle[0] + 0.4, tle[1] + 0.5, tle[2] - 1.2); flap.rotation.set(0.5, 0.9, 0.3);
    mesh(new THREE.BoxGeometry(0.12, 0.7, tc * 0.9), char, Lstub, tle[0] + 0.02, tle[1] + 0.02, tle[2] - tc * 0.5);   // the black cut face
    // ---- engines: on their pylons (broken: both), and the left one lying in the snow (the wreck)
    const pylon = (ex, ey, ez, parent) => { const py = mesh(new THREE.BoxGeometry(0.32, 1.25, 3.6), white, parent, ex, ey + 0.95, ez - 2.3); py.rotation.x = 0.06; };
    const Rflight = new THREE.Group(), Lflight = new THREE.Group(); af.add(Rflight, Lflight);
    for (const [s, grp] of [[-1, Rflight], [1, Lflight]]) {
      const ex = s * 5.9, ey = -2.45, ez = 5.9, E = engine(grp, white, metal, dark); E.position.set(ex, ey, ez); pylon(ex, ey, ez, grp);
    }
    const ground = new THREE.Group(); ground.position.set(7.0, 0.6, 0.8); ground.rotation.set(0.1, 0.5, 0.45); g.add(ground);
    const burnt = skinM("#5e5754"); const GE = engine(ground, burnt, metal, dark); GE.position.z = 2.0;
    // ---- tail: the tailplane and the fin (white, the fin scorched), the tail cone
    for (const s of [1, -1]) mesh(foil({ le: [s * 0.4, 0.95, -13.4], c: 3.7, t: 0.11 }, { le: [s * 6.4, 1.55, -17.0], c: 1.4, t: 0.09 }), grey, aftG);
    const finY = body(-13).y + body(-13).r * SQ - 0.15;
    mesh(foil({ le: [0, finY, -10.6], c: 6.4, t: 0.11 }, { le: [0, finY + 6.3, -15.6], c: 2.3, t: 0.09 }, { vertical: true }), skinM("#b9c1cd", { side: THREE.DoubleSide }), aftG);
    mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.4, 14), metal, aftG, 0, body(-18.3).y, -18.4).rotation.x = Math.PI / 2;
    // ---- tail 1: the torn end at station z = -9.0 (cutG): a charred rim of skin teeth bent outward, stringers, a dark liner and a plug 0.5 m in
    const rimAt = (a, z, dr = 0) => { const b = body(TAILZ), r = b.r + dr; return [r * Math.cos(a), b.y + SQ * r * Math.sin(a), z]; };
    let innerMat;
    {
      const NT = 26, wd = Array.from({ length: NT }, (_, i) => 0.65 + 0.7 * rnd(i * 3 + 201)), wsum = wd.reduce((x, y) => x + y, 0);
      const tpos = [], tcol = [], tidx = [], soot2 = [0.05, 0.045, 0.04], skin0 = [0.62, 0.62, 0.64];
      let a0 = 0.2;
      for (let i = 0; i < NT; i++) {
        const a1 = a0 + (wd[i] / wsum) * Math.PI * 2, ac = (a0 + a1) / 2, L = 0.3 + 0.9 * rnd(i * 5 + 211), bend = 0.1 + 0.28 * rnd(i * 5 + 212), at = ac + (rnd(i * 5 + 213) - 0.5) * (a1 - a0) * 0.5;
        const pts = [rimAt(a0, TAILZ), rimAt(a1, TAILZ), rimAt(a1 - (a1 - ac) * 0.3, TAILZ - L * 0.5, bend * 0.4), rimAt(a0 + (ac - a0) * 0.3, TAILZ - L * 0.5, bend * 0.4), rimAt(at, TAILZ - L, bend)];
        const cols = [skin0, skin0, mix3(skin0, soot2, 0.55), mix3(skin0, soot2, 0.55), soot2], b = tpos.length / 3;
        pts.forEach((q, k) => { tpos.push(...q); tcol.push(...cols[k]); });
        tidx.push(b, b + 1, b + 2, b, b + 2, b + 3, b + 3, b + 2, b + 4);
        a0 = a1;
      }
      const tg = new THREE.BufferGeometry(); tg.setAttribute("position", new THREE.Float32BufferAttribute(tpos, 3)); tg.setAttribute("color", new THREE.Float32BufferAttribute(tcol, 3)); tg.setIndex(tidx); tg.computeVertexNormals();
      mesh(tg, skinM("#eceff3", { vertexColors: true, side: THREE.DoubleSide }), cutG);
      // the charred edge: a thin tube round the opening, and one frame ring just inside it
      const ringPts = (z, dr, j) => Array.from({ length: 36 }, (_, k) => { const a = (k / 36) * Math.PI * 2, q = rimAt(a, z + (j ? (rnd(k + j) - 0.5) * 0.1 : 0), dr + (j ? (rnd(k + j + 50) - 0.5) * 0.06 : 0)); return new THREE.Vector3(...q); });
      mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ringPts(TAILZ, 0.02, 300), true), 90, 0.06, 6, true), char, cutG);
      mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ringPts(TAILZ + 0.3, -0.05, 0), true), 90, 0.07, 6, true), metal, cutG);
      // bare stringers and frame ribs sticking out aft of the rim, a few bent
      for (let i = 0; i < 10; i++) {
        const a = rnd(i * 7 + 231) * Math.PI * 2, L = 0.5 + 1.0 * rnd(i * 7 + 232), q = rimAt(a, TAILZ - L / 2, -0.12 + 0.2 * rnd(i * 7 + 233));
        const rod = mesh(new THREE.BoxGeometry(0.05, 0.05, L), metal, cutG, ...q); rod.rotation.set((rnd(i * 7 + 234) - 0.5) * 0.4, (rnd(i * 7 + 235) - 0.5) * 0.4, 0);
      }
      // the inside, so nobody sees through the hull: a dark liner (a little smaller than the skin) from the rim to a plug 0.5 m in
      const heat = (c) => tint(c, (x, y) => mix3([0.05, 0.055, 0.07], [1.0, 0.45, 0.1], clamp((0.5 - y) / 1.6) ** 1.4 * 0.8));
      const innerM = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, toneMapped: false }); innerM.userData.noOutline = true;
      const liner = mesh(heat(hull(0, Math.PI * 2, TAILZ - 0.04, TAILZ + 0.5, -0.05, 40, 4)), innerM, cutG);
      const bP = body(TAILZ + 0.5), plugG = new THREE.CircleGeometry(1, 40); heat(plugG);
      const plug = mesh(plugG, innerM, cutG, 0, bP.y, TAILZ + 0.5); plug.scale.set(bP.r - 0.05, SQ * (bP.r - 0.05), 1);
      void liner;
      // hanging cables: from inside the top of the opening, drooping aft
      const cabM = [flat("#14161c"), flat("#14161c"), flat("#c2332f"), flat("#14161c"), flat("#d9a20c"), flat("#14161c")];
      for (let i = 0; i < 6; i++) {
        const a = 0.55 + (i / 5) * 2.0 + (rnd(i + 241) - 0.5) * 0.3, L = 0.9 + 1.5 * rnd(i + 242), s0 = rimAt(a, TAILZ + 0.2, -0.15), side = rnd(i + 243) - 0.5;
        const c = new THREE.CatmullRomCurve3([s0, [s0[0], s0[1], TAILZ - 0.2], [s0[0] + side * 0.4, s0[1] - 0.25 - 0.2 * rnd(i + 244), TAILZ - L * 0.5], [s0[0] + side * 0.7, s0[1] - 0.6 - 0.9 * rnd(i + 245), TAILZ - L]].map((q) => new THREE.Vector3(...q)));
        mesh(new THREE.TubeGeometry(c, 20, 0.035, 5), cabM[i], cutG);
      }
      cutG.traverse((o) => { if (o.isMesh && (o.geometry === tg || o.material === innerM || o.material === char || o.material === metal || cabM.includes(o.material))) o.userData.steam = true; });
      innerMat = innerM;
    }
    // ---- the snow berm: ploughed up along both sides of the belly and piled at the nose (see-through, no outline)
    const berm = new THREE.Group(); g.add(berm); snowM.userData.noOutline = true;
    const aftLumps = [];   // berm lumps aft of the cut: hidden when the tail is torn off
    const lump = (x, y, z, rx, ry, rz) => { const o = mesh(new THREE.SphereGeometry(1, 14, 10), snowM, berm, x, y, z); o.scale.set(rx, ry, rz); if (z < TAILZ + 0.6) aftLumps.push(o); return o; };
    for (const s of [1, -1]) for (let i = 0; i < 22; i++) {
      const z = 17 - i * 1.6 + (rnd(i * 5 + (s > 0 ? 1 : 2)) - 0.5) * 0.8, k = rnd(i * 3 + (s > 0 ? 5 : 6));
      if (s > 0 && z < 4 && z > -4.5) continue;   // the wing stub and the engine stand clear of the berm
      lump(s * (2.05 + k * 0.5), 0.1, z, 1.05 + k * 0.45, (0.75 + k * 0.4) * (s > 0 ? 0.8 : 1), 1.3 + rnd(i + 31) * 0.4);
    }
    lump(0, 0.2, 20.8, 3.0, 1.9, 2.8); lump(-1.6, 0.1, 19.6, 1.9, 1.3, 2.2); lump(1.7, 0.1, 19.8, 2.0, 1.2, 2.2); lump(0.4, 0.2, 23.0, 2.0, 1.2, 1.7);
    steamy(berm);
    // the checks: only the fuselage, wings, tail and engines are solid; nothing here casts a shadow
    g.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } });
    big(g);
    // ---- fire and smoke (not shrunk): the city's cel fire twice (the stub, the engine in the snow) and two smoke columns
    const flame = (w, h, sc) => { const grp = new THREE.Group(); P.whole.add(grp); const k = CITY_KINDS.firesmoke({ spec: { w, h }, whole: grp }); grp.scale.set(sc * 1.35, sc, sc * 1.35); grp.rotation.y = Math.PI; steamy(grp); return { grp, k, sc }; };
    const fA = flame(0.9, 3, 3.6), fB = flame(1.0, 2.5, 2.6), fC = flame(0.8, 2.2, 2.8);   // fC: the torn end (tail 1)
    const colA = new THREE.Group(), colB = new THREE.Group(), colC = new THREE.Group(); P.whole.add(colA, colB, colC);
    const smokeA = column(colA, 34, 11), smokeB = column(colB, 18, 71), smokeC = column(colC, 30, 131);
    const tailAt = [0, 0.22 - 1.3, TAILZ + 0.2], tailMid = [0, 0.4, TAILZ - 0.3];
    const stubAt = [2.5, -0.5, 0.05], engTop = [5.9, -1.5, 3.2], groundEng = [6.6, 1.5, 0.9];
    const WIND = [-Math.SQRT1_2, 0, -Math.SQRT1_2];
    return {
      grip: 0,
      apply(ps, t) {
        const f = clamp(ps.fire), b = clamp(ps.broken), fl = b >= 0.5, tt = t ?? 0;
        // tail: propState starts it at spec.tail ?? 1 and tweens it, so "unset" is spec.tail undefined with ps.tail still 1 (= 0, as props-race.js does); `torn` is the same switch and needs no spec
        const torn = (P.spec.torn ?? ps.torn ?? 0) >= 0.5 || (P.spec.tail === undefined && ps.tail === 1 ? 0 : clamp(ps.tail)) >= 0.5;
        aftG.visible = !torn; cutG.visible = torn; for (const o of aftLumps) o.visible = !torn;
        innerMat.color.setScalar(0.35 + 0.65 * f);
        Lfull.visible = Lflight.visible = Rflight.visible = fl; Lstub.visible = ground.visible = berm.visible = !fl;
        // flames: the stub (or the engine on its pylon, trailing back, when broken) and the engine in the snow
        const pa = af2p(...(fl ? engTop : stubAt));
        fA.grp.position.set(...pa); fA.grp.scale.set(fl ? 3.8 : 4.9, fl ? 2.8 : 3.6, fl ? 3.8 : 4.9); fA.grp.rotation.x = fl ? -1.0 : 0;
        fA.k.apply({ fire: f }, tt);
        fB.grp.position.set(...groundEng); fB.k.apply({ fire: fl ? 0 : f * 0.9 }, tt);
        // smoke: wreck, a 25 m column leaning toward -z and -x; broken, a trail streaming back from the engine
        const H = 25 * (0.35 + 0.65 * f), oA = [pa[0], pa[1] + (fl ? 0.8 : 2.0), pa[2] - (fl ? 1.0 : 0)];
        if (fl) smokeA.update(tt, f, oA, 7, [0, 0, -1], 22, 6, 2.2, 3.2);
        else smokeA.update(tt, f, oA, H, WIND, 0, 0.42 * H, 4.6 * (0.6 + 0.4 * f), 6.0);
        // the torn end: cel flames in the opening (licking aft; streaming back when it flies) and black smoke from it
        const pt = af2p(...tailAt), pm = af2p(...tailMid);
        fC.grp.position.set(...pt); fC.grp.rotation.x = fl ? -1.1 : -0.35; fC.grp.scale.set(3.0, fl ? 1.9 : 2.1, 3.0);
        fC.k.apply({ fire: torn ? f : 0 }, tt);
        if (fl) smokeC.update(tt, torn ? f : 0, pm, 5, [0, 0, -1], 34, 12, 3.0, 3.0);
        else smokeC.update(tt, torn ? f : 0, [pm[0], pm[1] + 0.8, pm[2]], H * 0.9, WIND, 0, 0.42 * H, 4.0 * (0.6 + 0.4 * f), 6.0);
        smokeB.update(tt, fl ? 0 : f * 0.8, [groundEng[0], groundEng[1] + 1.6, groundEng[2]], 0.55 * H, WIND, 0, 0.3 * H, 2.4, 5.0);
      },
    };
  },

  wingchunk(P) {
    const g = new THREE.Group(); P.whole.add(g);
    const grey = mat("#aab3c0", { side: THREE.DoubleSide }), char = mat("#1f1c1b", { side: THREE.DoubleSide }), metal = mat("#8f98a6", { metalness: 0.3, roughness: 0.5 });
    for (const m of [grey, char, metal]) m.userData.noHatch = true;
    // the outer 13 m of the airliner's left wing (x 3.2 .. 16.2 of jetwreck's airframe), the same loft and winglet
    const half = 16.2, sweep = Math.tan((25 * Math.PI) / 180), dih = Math.tan((5 * Math.PI) / 180), X0 = 3.2, XM = (X0 + half) / 2;
    const secAt = (x) => { const u = (x - 0.5) / (half - 0.5); return { le: [x, -1.05 + half * dih * u, 4.0 - half * sweep * u], c: 6.6 - 4.9 * u, t: 0.13 - 0.03 * u }; };
    const S0 = secAt(X0), S1 = secAt(half), SM = secAt(XM), C = [XM, SM.le[1], SM.le[2] - SM.c / 2];
    const piece = new THREE.Group(); piece.position.set(-C[0], -C[1], -C[2]); g.add(piece);   // the piece's middle is the origin
    mesh(foil(S0, S1), grey, piece);
    const tl = S1.le;
    mesh(foil({ le: [tl[0], tl[1], tl[2] + 0.05], c: 1.6, t: 0.1 }, { le: [tl[0] + 0.45, tl[1] + 2.2, tl[2] - 1.15], c: 0.7, t: 0.08 }, { vertical: true }), grey, piece);
    // the ragged root end (x 3.2): charred shards, skin teeth bent up and down, spar stubs, a black cut face, a bent flap
    const yt = (u, t) => 5 * t * (0.2969 * Math.sqrt(u) - 0.126 * u - 0.3516 * u * u + 0.2843 * u ** 3 - 0.1036 * u ** 4);
    const tpos = [], tcol = [], tidx = [], skin0 = [0.66, 0.68, 0.72], soot2 = [0.05, 0.045, 0.04];
    for (let i = 0; i < 14; i++) for (const sd of [1, -1]) {
      const u0 = 0.04 + (i / 14) * 0.92, u1 = u0 + 0.06, um = (u0 + u1) / 2, L = 0.3 + 0.9 * rnd(i * 5 + (sd > 0 ? 301 : 302)), bend = (0.12 + 0.35 * rnd(i * 5 + 303)) * sd;
      const q = (u, dx, dy) => [X0 + dx, S0.le[1] + sd * yt(u, S0.t) * S0.c + dy, S0.le[2] - u * S0.c];
      const pts = [q(u0, 0, 0), q(u1, 0, 0), q(u1 - 0.01, -L * 0.5, bend * 0.4), q(u0 + 0.01, -L * 0.5, bend * 0.4), q(um, -L, bend)], cols = [skin0, skin0, mix3(skin0, soot2, 0.5), mix3(skin0, soot2, 0.5), soot2], b = tpos.length / 3;
      pts.forEach((p, k) => { tpos.push(...p); tcol.push(...cols[k]); });
      tidx.push(b, b + 1, b + 2, b, b + 2, b + 3, b + 3, b + 2, b + 4);
    }
    const tg = new THREE.BufferGeometry(); tg.setAttribute("position", new THREE.Float32BufferAttribute(tpos, 3)); tg.setAttribute("color", new THREE.Float32BufferAttribute(tcol, 3)); tg.setIndex(tidx); tg.computeVertexNormals();
    const toothM = mat("#c6ccd6", { vertexColors: true, side: THREE.DoubleSide }); toothM.userData.noHatch = true; mesh(tg, toothM, piece);
    for (let i = 0; i < 9; i++) {
      const z = S0.le[2] - ((i + 0.5) / 9) * S0.c * 0.95, sh = mesh(new THREE.ConeGeometry(0.18 + rnd(i + 3) * 0.2, 0.5 + rnd(i + 8) * 0.9, 5), char, piece, X0 - 0.05, S0.le[1] + (rnd(i + 12) - 0.5) * 0.3, z);
      sh.rotation.set((rnd(i + 17) - 0.5) * 0.8, 0, Math.PI / 2 + (rnd(i + 21) - 0.5) * 0.7);   // tips point toward -x
    }
    for (const dz of [0.25, 0.55, 0.8]) mesh(new THREE.BoxGeometry(1.1 + dz, 0.12, 0.1), metal, piece, X0 - 0.5, S0.le[1] + 0.04, S0.le[2] - dz * S0.c).rotation.set(0, (dz - 0.5) * 0.2, 0.08);   // spar stubs
    mesh(new THREE.BoxGeometry(0.12, 0.62, S0.c * 0.9), char, piece, X0 + 0.02, S0.le[1] + 0.02, S0.le[2] - S0.c * 0.5);   // the black cut face
    const flap = mesh(new THREE.PlaneGeometry(1.3, 1.0), char, piece, X0 - 0.5, S0.le[1] + 0.5, S0.le[2] - S0.c * 0.65); flap.rotation.set(0.5, 0.9, 0.3);
    steamy(g);
    g.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } });
    big(g);
    // fire and smoke (not shrunk), kept upright in the world however the piece tumbles (the group turns against the prop's own rotation)
    const rootAt = [X0 - XM, S0.le[1] - C[1], S0.le[2] - S0.c / 2 - C[2]];
    const up = new THREE.Group(); P.whole.add(up);
    const fg = new THREE.Group(); up.add(fg); const fk = CITY_KINDS.firesmoke({ spec: { w: 2.2, h: 2.6 }, whole: fg }); fg.scale.setScalar(2.2); fg.rotation.y = Math.PI / 2; steamy(fg);
    const cg = new THREE.Group(); up.add(cg); const smoke = column(cg, 16, 171);
    const inv = new THREE.Quaternion();
    return {
      grip: 0,
      apply(ps, t) {
        const f = clamp(ps.fire), tt = t ?? 0;
        inv.copy(P.root.quaternion).invert(); up.quaternion.copy(inv); up.position.set(...rootAt);
        fk.apply({ fire: f }, tt);
        smoke.update(tt, f, [0, 1.0, 0], 4.0, [-1, 0, 0], 0, 1.2, 1.5, 2.0);
      },
    };
  },

  evacslide(P) {
    const S = P.spec, h = S.h ?? 2.3, len = S.len ?? 5.0, W = 0.45;
    const yellow = mat("#f6c417", { roughness: 0.55 }), face = mat("#8d95a2", { roughness: 0.7, side: THREE.DoubleSide }), seam = mat("#d9a20c", { roughness: 0.6 });
    const g = new THREE.Group(); P.whole.add(g);
    const pts = slideLine(h, len), v3 = (z, dy = 0) => pts.map(([x, y]) => new THREE.Vector3(x, y + dy, z));
    // the sliding face: a ribbon along the centre line, z -0.45..0.45
    const pos = [], idx = [];
    pts.forEach(([x, y], i) => { pos.push(x, y, -W, x, y, W); if (i) { const a = (i - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } });
    const fg = new THREE.BufferGeometry(); fg.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); fg.setIndex(idx); fg.computeVertexNormals();
    mesh(fg, face, g);
    // the two side tubes (radius 0.2) with rounded ends, the head tube at the sill and the foot tube
    for (const z of [-W, W]) {
      mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(v3(z, 0.04)), 90, 0.2, 12), yellow, g);
      mesh(new THREE.SphereGeometry(0.2, 12, 8), yellow, g, 0, 0.04, z); mesh(new THREE.SphereGeometry(0.2, 12, 8), yellow, g, len + 0.8, -h + 0.04, z);
    }
    for (const [x, y] of [[0, 0.04], [len + 0.8, -h + 0.04]]) { const c = mesh(new THREE.CylinderGeometry(0.17, 0.17, 2 * W, 12), yellow, g, x, y, 0); c.rotation.x = Math.PI / 2; }
    // cross tubes under the face, a seam band on each side tube between them
    const n = 9;
    for (let i = 1; i < n; i++) {
      const [x, y] = pts[Math.round((i / n) * (pts.length - 1))], c = mesh(new THREE.CylinderGeometry(0.11, 0.11, 2 * W + 0.1, 10), yellow, g, x, y - 0.14, 0); c.rotation.x = Math.PI / 2;
      for (const z of [-W, W]) mesh(new THREE.TorusGeometry(0.205, 0.018, 6, 14), seam, g, x, y + 0.04, z).rotation.y = Math.PI / 2;
    }
    steamy(g);
    return {
      grip: 0,
      apply(ps) {
        const on = clamp(ps.on), k = sm(on * 1.05);
        P.whole.visible = on > 0.01; g.scale.set(0.05 + 0.95 * k, 0.05 + 0.95 * k, 0.35 + 0.65 * k);
      },
    };
  },

  bridgeend(P) {
    const S = P.spec, LEN = S.len ?? 16, T0 = S.at ?? 0, DECK = 0.9, X = 4;
    const g = new THREE.Group(); P.whole.add(g);
    const concrete = mat("#aeb0b2", { roughness: 0.95 }), conc2 = mat("#999b9e", { roughness: 0.95 }), asphalt = mat("#3a3c43", { roughness: 0.9 }), kerb = mat("#c3c5c6", { roughness: 0.9 });
    const steel = mat("#8c95a2", { roughness: 0.5, metalness: 0.25 }), rust = mat("#7b4a2c", { roughness: 0.8 }), line = mat("#ecdc98", { roughness: 0.8 });
    for (const m of [concrete, conc2, asphalt, kerb]) m.userData.noHatch = true;
    // the jagged broken edge (z of the edge at each x, 4 -> -4): the top layer reaches out further than the lower slab
    const XS = [4, 3.2, 2.2, 1.3, 0.3, -0.7, -1.7, -2.8, -4], ZT = [-0.5, 0.05, -0.75, 0.1, -0.35, 0.25, -0.9, -0.1, -0.6], ZB = ZT.map((z, i) => z - 0.7 - 0.5 * rnd(i + 40));
    const slab = (zs, y0, depth, m) => {
      const sh = new THREE.Shape(); sh.moveTo(X, -LEN); XS.forEach((x, i) => sh.lineTo(x, zs[i])); sh.lineTo(-X, -LEN); sh.closePath();
      const o = mesh(new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: false }), m, g, 0, y0, 0); o.rotation.x = Math.PI / 2; return o;
    };
    slab(ZB, -0.45, DECK - 0.45, conc2);       // y -0.9 .. -0.45, the recessed lower slab
    slab(ZT, -0.1, 0.35, concrete);            // y -0.45 .. -0.1
    slab(ZT.map((z) => z - 0.04), 0, 0.1, asphalt);   // the asphalt, y -0.1 .. 0
    // dashed centre line, kerbs along both edges
    for (let z = -LEN + 1.5; z < -3.2; z += 4) mesh(new THREE.BoxGeometry(0.16, 0.05, 2), line, g, 0, 0.01, z);
    for (const s of [1, -1]) mesh(new THREE.BoxGeometry(0.4, 0.22, LEN - 1.3), kerb, g, s * 3.75, 0.09, -(LEN + 1.3) / 2);
    // guard rails: two rails on posts, bent outward and drooping over the last 4 m before the break
    for (const s of [1, -1]) {
      for (let z = -LEN + 0.5; z < -3.6; z += 2) mesh(new THREE.BoxGeometry(0.09, 1.0, 0.09), steel, g, s * 3.98, 0.5, z);
      for (const y of [0.55, 0.95]) {
        const c = new THREE.CatmullRomCurve3([[s * 3.98, y, -LEN + 0.5], [s * 3.98, y, -7], [s * 3.98, y, -4.2], [s * 4.35, y - 0.05, -2.9], [s * 5.2, y - 0.5, -1.8], [s * 6.0, y - 1.3, -0.9]].map((p) => new THREE.Vector3(...p)));
        mesh(new THREE.TubeGeometry(c, 40, 0.045, 6), steel, g);
      }
      for (const [z, lean] of [[-3.2, 0.3], [-1.9, 0.75]]) { const p = mesh(new THREE.BoxGeometry(0.09, 1.0, 0.09), steel, g, s * (3.98 + lean * 0.5), 0.45 - lean * 0.2, z); p.rotation.z = -s * lean; }
    }
    // rebar sticking out of the jagged top edge, bent down
    for (let i = 0; i < 12; i++) {
      const x = 3.7 - (i / 11) * 7.4, k = XS.findIndex((v, j) => j + 1 < XS.length && x <= v && x >= XS[j + 1]), j = Math.max(0, k), u = (XS[j] - x) / (XS[j] - XS[j + 1] || 1), ze = ZT[j] + (ZT[j + 1] - ZT[j]) * u, L = 0.35 + rnd(i + 90) * 0.5;
      const bar = mesh(new THREE.CylinderGeometry(0.011, 0.011, L, 5), rust, g, x, -0.3 - rnd(i + 70) * 0.3 - Math.sin(0.15 + rnd(i + 80) * 0.5) * L * 0.5, ze + Math.cos(0.15 + rnd(i + 80) * 0.5) * L * 0.5);
      bar.rotation.set(Math.PI / 2 + 0.15 + rnd(i + 80) * 0.5, 0, (rnd(i + 60) - 0.5) * 0.5);
    }
    // the pier at z -6: a cap beam and the column, 40 m down
    mesh(new THREE.BoxGeometry(6.4, 0.9, 2.1), concrete, g, 0, -DECK - 0.45, -6);
    mesh(new THREE.BoxGeometry(2.2, 40, 1.7), concrete, g, 0, -DECK - 0.9 - 20, -6);
    g.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } });
    big(g);
    // debris: 12 chunks and a bent rail piece, ballistic from the edge (not shrunk, see-through)
    const D = new THREE.Group(); P.whole.add(D);
    const bits = Array.from({ length: 13 }, (_, i) => {
      const rail = i === 12, geo = rail ? new THREE.TubeGeometry(new THREE.CatmullRomCurve3([[-0.9, 0, 0], [-0.3, 0.12, 0], [0.3, -0.05, 0.1], [0.8, -0.35, 0.3]].map((p) => new THREE.Vector3(...p))), 12, 0.05, 6) : new THREE.IcosahedronGeometry(1, 0);
      const o = mesh(geo, rail ? steel : i % 3 ? concrete : conc2, D); if (!rail) o.scale.set(0.2 + rnd(i * 5 + 1) * 0.45, 0.16 + rnd(i * 5 + 2) * 0.32, 0.2 + rnd(i * 5 + 3) * 0.4); steamy(o);
      return { o, p: [(rnd(i * 11 + 1) - 0.5) * 6.4, -0.2 - rnd(i * 11 + 2) * 0.5, 0.1 - rnd(i * 11 + 3) * 0.4], v: [(rnd(i * 11 + 4) - 0.5) * 2.4, -0.4 + rnd(i * 11 + 5) * 2.4, 2.2 + rnd(i * 11 + 6) * 5.5], w: [0, 1, 2].map((k) => (rnd(i * 11 + 7 + k) - 0.5) * 7) };
    });
    return {
      grip: 0,
      apply(ps, t) {
        const age = (t ?? 0) - T0; D.visible = age >= 0 && age <= 2.5; if (!D.visible) return;
        for (const b of bits) {
          b.o.position.set(b.p[0] + b.v[0] * age, b.p[1] + b.v[1] * age - 4.9 * age * age, b.p[2] + b.v[2] * age);
          b.o.rotation.set(b.w[0] * age, b.w[1] * age, b.w[2] * age);
        }
      },
    };
  },
};
