import * as THREE from "three";
import { clamp, lerp } from "./util.js";

// Hot Potato (pilot, 11 Nov 2026): the hand props of the game. Built by task T2; the design is Jonny's panel sheet
// storyboards/series/hot-potato/01-hot-potato/panels-sheet.png (the coal in panels 01-07, the tongs and the host's bow tie
// in 03, the basket on its pole in 10). The set (studio, tiles, vat) is props-hotpotato-set.js. Everything is a pure function
// of the params and the clip time (hashes, no Math.random, no wall clock). Metres. +z is a prop's front.
//
//   hpcoal    one lump of charcoal, fist-sized. ORIGIN = ITS CENTRE (not the bottom). Faceted, near-black (#2a2422) with a
//             web of glowing cracks and hot patches (orange #ff7a1a to white-yellow at the hottest; an additive shader
//             skin over the lump, pushed past white so it blooms with set.bloom "emissive"), a soft orange halo, and a thin
//             grey smoke wisp that always rises straight up in the world, 0.45 m, whatever the lump does.
//             spec  r      0.1    the lump's radius (0.2 across); the smoke stays in metres
//             param glow   1      0..1 the heat (cracks, patches, halo, ember tint). 0 = cold black charcoal
//                   smoke  0.6    0..1 the wisp's strength. Seed it at t 0 ({ smoke: 0.6 }) before the first tween (the engine
//                                 steps a key it has not seen, props3d.js propState); glow and open are already tweenable
//             Slow flicker (about 4 s per cycle, each crack cell on its own phase). Grips (HP_GRIPS.hpcoal, prop frame):
//             "L" [-0.15, -0.03, 0.013] and "R" [0.15, -0.03, 0.013] the two gloves cupped on the lower sides (the glove's
//             middle 5 cm off the surface), "below" [0, -0.15, 0.02] one palm up under it. In both hands use
//             grips.bowl(c, who, COAL) (SIZE.hpcoal in grips.mjs); the grip proof is make-grip-tests.mjs --prop hpcoal --hold bowl.
//             Held by tongs: { do: "carry", prop: <coal>, by: <tongs>, off } (see hptongs for off).
//   hptongs   long steel kitchen tongs: ORIGIN = THE HINGE (the handle end, a U bend of steel strip), two flat arms running
//             along +z to scalloped jaw pads. spec len 0.55 (the whole prop scales by len / 0.556: jaw tips at z 0.556).
//             param open 0.25: 0..1 the spread. At 0 the pads' inner faces are 0.2 m apart exactly (they hold a 0.2 m coal
//             whose centre is at z 0.5); 0.25 is loose round it; 1 = about 0.5 m between the pads. Polished steel, solid.
//             Grips (HP_GRIPS.hptongs): "hold" [0, 0.06, 0.13] a glove on top of the handle (clasp: palm down, the fingers
//             curled down round both arms), "below" [0, -0.06, 0.13] from underneath, "far" [0, 0.06, 0.2] further out.
//             The tongs are NOT grabbed when they carry the coal: a { do: "carry", by } rides the carrier's own tween
//             position, not the hand it is held in (props3d.js carriedAt). Move the tongs with c.prop tweens (x, y, z, rot,
//             tip), give them spec.staged (a reason, the layout counts them as staged), and aim the hand at them with an arm
//             pose { prop, grip: "hold", palm: [0, 0, 0.13] } and the clasp grip: the hand follows the prop, the coal follows the
//             tongs. The carry offset is in the tongs' yaw-turned frame and ignores their tip, so with tip T (degrees, + = jaws
//             down) and scale k = len / 0.55 use off = [0, -0.5 k sin T, 0.5 k cos T]: the coal sits between the pads.
//   hpbowtie  the host's big rainbow bow tie, WORN: spec.wear = his cast id, x, y, z = a point in his body's frame (the
//             director places it on his chest under his face, about x 0, y 0.34, z 0.33; it turns with his body).
//             ORIGIN = THE KNOT. 0.36 wide x 0.17 tall, two puffy lobes (0.045 thick) and a centre knot, six vertical stripes
//             (red, orange, yellow, green, blue, violet) with a dark edge. Faces +z.
//             param singe 0 0..1: the stripes darken toward brown and the lobes' edges char (he comes out of the fryer).
//             Seed { singe: 0 } at t 0 to tween it. Solid (a costume part, like the pumpkin helmet).
//   hplift    the fry-basket lift: ORIGIN = THE CENTRE OF THE BASKET'S FLOOR. A wire basket w 0.9 x d 0.8 x h 0.42 (thin steel
//             wire on a 0.1 grid, open top, a potato stands inside and shows through the front), a steel pole 0.05 thick at its
//             right side (x w/2 + 0.08) from `pole` 3.0 m below the floor to 0.55 m above the rim, and two short arms from the
//             pole holding the rim and the bottom frame. A character stands in it with
//             { do: "ride", prop, off: [0, 0.02, 0], yaw, dur: 0 } exactly as with fryerbasket (feet on the floor wires at y 0.018).
//             spec  w 0.9, d 0.8, h 0.42, pole 3.0
//             param drip 0 0..1: amber oil drips falling from the floor's wires, `dripLen` (spec, default 1.0 m) down.
//                   Seed { drip: 0 } at t 0 to tween it.
// Smoke, halo, the glow skin and the drips are see-through for the checks (userData.steam, opacity or additive); the lump,
// the tongs, the tie, the wire and the pole are solid.

// where a hand closes on a prop (the registry, props3d.js GRIPS, is the director's: it spreads this in)
export const HP_GRIPS = {
  hpcoal: { L: [-0.15, -0.03, 0.013], R: [0.15, -0.03, 0.013], below: [0, -0.15, 0.02] },
  hptongs: { hold: [0, 0.06, 0.13], below: [0, -0.06, 0.13], far: [0, 0.06, 0.2] },
};

const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
const steamy = (o, order = 3) => { o.frustumCulled = false; o.renderOrder = order; o.castShadow = false; o.receiveShadow = false; o.userData.steam = true; return o; };
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const hash3 = (x, y, z) => { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); };
const smooth = (u) => { const k = clamp(u); return k * k * (3 - 2 * k); };
function vnoise(x, y, z) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z), fx = smooth(x - ix), fy = smooth(y - iy), fz = smooth(z - iz);
  const c = (a, b, d) => hash3(ix + a, iy + b, iz + d);
  return lerp(lerp(lerp(c(0, 0, 0), c(1, 0, 0), fx), lerp(c(0, 1, 0), c(1, 1, 0), fx), fy), lerp(lerp(c(0, 0, 1), c(1, 0, 1), fx), lerp(c(0, 1, 1), c(1, 1, 1), fx), fy), fz);
}
function canvasTex(w, h, draw) { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }

// merge many small geometries (same attributes: position, normal, uv, index) into one: a wire basket is a few draw calls
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
// a cylinder of radius rad from point a to point b, as a geometry in the parent's frame (for mergeGeos)
const UPV = new THREE.Vector3(0, 1, 0);
function barGeo(a, b, rad, seg = 6) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), len = A.distanceTo(B);
  const g = new THREE.CylinderGeometry(rad, rad, len, seg, 1);
  g.applyMatrix4(new THREE.Matrix4().compose(A.clone().add(B).multiplyScalar(0.5), new THREE.Quaternion().setFromUnitVectors(UPV, B.clone().sub(A).normalize()), new THREE.Vector3(1, 1, 1)));
  return g;
}

// camera-facing soft discs (the coal's smoke and halo): the disc is placed by the prop, grown in view space
const BB_VERT = `uniform float uR; varying vec2 vUv;
  void main() { vUv = uv; vec4 c = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0); c.xy += (uv - 0.5) * 2.0 * uR; gl_Position = projectionMatrix * c; }`;
function smokeMaterial() {
  const m = new THREE.ShaderMaterial({
    uniforms: { uR: { value: 0.05 }, uA: { value: 0 }, uSeed: { value: 0 }, uTime: { value: 0 }, uWarm: { value: 0 } },
    vertexShader: BB_VERT,
    fragmentShader: `uniform float uA, uSeed, uTime, uWarm; varying vec2 vUv;
      void main() {
        vec2 q = (vUv - 0.5) * 2.0; float a = atan(q.y, q.x), r = length(q);
        float edge = 0.84 + 0.09 * sin(a * 3.0 + uSeed * 6.3 + uTime * 1.2) + 0.05 * sin(a * 6.0 - uSeed * 2.0);
        float d = r / edge; if (d > 1.0) discard;
        vec3 col = mix(vec3(0.6, 0.6, 0.63), vec3(1.0, 0.6, 0.28), uWarm * 0.3);
        gl_FragColor = vec4(col, uA * (1.0 - smoothstep(0.2, 1.0, d)));
      }`,
    transparent: true, depthWrite: false, opacity: 0.4,
  });
  m.userData.noOutline = true; return m;
}
function haloMaterial() {
  const m = new THREE.ShaderMaterial({
    uniforms: { uR: { value: 0.3 }, uA: { value: 0 }, uCol: { value: new THREE.Color(1, 0.42, 0.08) } },
    vertexShader: BB_VERT,
    fragmentShader: `uniform float uA; uniform vec3 uCol; varying vec2 vUv;
      void main() { float r = length((vUv - 0.5) * 2.0); if (r > 1.0) discard; float k = pow(1.0 - r, 2.2); gl_FragColor = vec4(uCol * k * uA, 1.0); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.4,
  });
  m.userData.noOutline = true; m.userData.glow = true; return m;
}

// ---- the coal -------------------------------------------------------------------------------------------------------
// a unit lump: an icosphere pushed about by two octaves of noise and sliced by nine flat cuts (the facets), normalised so
// its mean radius is 1. Non-indexed: every triangle its own flat normal, and a random shade per face.
function lumpGeometry() {
  const g = new THREE.IcosahedronGeometry(1, 3), p = g.attributes.position, v = new THREE.Vector3();
  const cuts = [];
  for (let k = 0; k < 9; k++) { const y = 1 - ((k + 0.5) * 2) / 9, rr = Math.sqrt(1 - y * y), a = k * 2.399963; cuts.push({ n: new THREE.Vector3(Math.cos(a) * rr, y, Math.sin(a) * rr), d: 0.8 + 0.12 * hash3(k, 3.1, 1.7) }); }
  let sum = 0;
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i).normalize();
    let r = 1 + 0.26 * (vnoise(v.x * 1.9 + 3.1, v.y * 1.9, v.z * 1.9) - 0.5) + 0.1 * (vnoise(v.x * 4.3, v.y * 4.3 + 9.2, v.z * 4.3) - 0.5);
    for (const c of cuts) { const d = v.dot(c.n); if (d > 0.05) r = Math.min(r, c.d / d); }
    sum += r; p.setXYZ(i, v.x * r, v.y * r * 0.93, v.z * r);
  }
  const k = p.count / sum;
  for (let i = 0; i < p.count; i++) p.setXYZ(i, p.getX(i) * k, p.getY(i) * k, p.getZ(i) * k);
  g.computeVertexNormals();
  const col = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) { const f = Math.floor(i / 3), s = 0.55 + 0.85 * hash3(f, 1.3, 7.7); col[i * 3] = s; col[i * 3 + 1] = s * 0.97; col[i * 3 + 2] = s * 0.95; }
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  return g;
}

// the heat skin: a cellular crack web (cell edges glow), a second finer web, hot patches from slow noise, a slow pulse per
// cell; drawn additively just over the lump in object space, so the cracks stay on the charcoal when it turns
const HEAT_FRAG = `uniform float uTime, uGlow; varying vec3 vP;
  vec3 h33(vec3 p) { p = vec3(dot(p, vec3(127.1, 311.7, 74.7)), dot(p, vec3(269.5, 183.3, 246.1)), dot(p, vec3(113.5, 271.9, 124.6))); return fract(sin(p) * 43758.5453); }
  float h31(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
  float vnoise(vec3 p) {
    vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(h31(i), h31(i + vec3(1, 0, 0)), f.x), mix(h31(i + vec3(0, 1, 0)), h31(i + vec3(1, 1, 0)), f.x), f.y),
               mix(mix(h31(i + vec3(0, 0, 1)), h31(i + vec3(1, 0, 1)), f.x), mix(h31(i + vec3(0, 1, 1)), h31(i + vec3(1, 1, 1)), f.x), f.y), f.z);
  }
  vec3 vor(vec3 p) {
    vec3 ip = floor(p), fp = fract(p); float f1 = 8.0, f2 = 8.0, id = 0.0;
    for (int k = -1; k <= 1; k++) for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
      vec3 g = vec3(float(i), float(j), float(k)); vec3 r = g + h33(ip + g) - fp; float d = dot(r, r);
      if (d < f1) { f2 = f1; f1 = d; id = h31(ip + g); } else if (d < f2) f2 = d;
    }
    return vec3(sqrt(f1), sqrt(f2), id);
  }
  void main() {
    vec3 p = vP * 1.8 + 4.7;
    vec3 v = vor(p); float e = v.y - v.x;
    float crack = pow(1.0 - smoothstep(0.0, 0.13, e), 1.2);
    float field = vnoise(vP * 1.7 + vec3(0.0, uTime * 0.05, 1.3));
    float hot = smoothstep(0.42, 0.8, field);
    float pulse = 0.8 + 0.2 * sin(uTime * 1.6 + v.z * 6.2831) + 0.04 * sin(uTime * 7.0 + v.z * 40.0);
    vec3 w = vor(p * 2.4 + 7.0); float fine = (1.0 - smoothstep(0.0, 0.08, w.y - w.x)) * (0.1 + 0.9 * hot);
    float heat = crack * (0.3 + 1.0 * hot) * pulse + hot * 0.2 * smoothstep(0.0, 0.5, e) * pulse;
    heat = max(heat, fine * 0.5 * pulse);
    heat *= uGlow;
    vec3 col = mix(vec3(0.6, 0.06, 0.0), vec3(1.0, 0.46, 0.09), smoothstep(0.05, 0.5, heat));
    col = mix(col, vec3(1.0, 0.93, 0.55), smoothstep(0.6, 1.1, heat));
    gl_FragColor = vec4(col * heat * 3.0, 1.0);
  }`;

// ---- the tongs' jaw pad: a scalloped paddle in the (z, y) plane, extruded 7 mm along x -------------------------------
function padGeometry(len, thick) {
  const pts = [], top = (z) => 0.014 + 0.016 * smooth(z / 0.03), N = 14;
  // the lower edge out to the tip, the scalloped tip, the upper edge back; scallops are convex arcs with a cusp between
  const scal = (z, k) => (z < 0.025 ? 0 : 0.0035 * Math.abs(Math.sin((z * Math.PI) / 0.0165 + k)));
  for (let i = 0; i <= N * 4; i++) { const z = (i / (N * 4)) * (len - 0.004); pts.push([z, -(top(z) - 0.0035 + scal(z, 0))]); }
  for (let i = 0; i <= 8; i++) { const y = -top(len) + (i / 8) * 2 * top(len); pts.push([len - 0.004 + 0.004 * Math.abs(Math.sin((y * Math.PI) / 0.0133)), y]); }
  for (let i = N * 4; i >= 0; i--) { const z = (i / (N * 4)) * (len - 0.004); pts.push([z, top(z) - 0.0035 + scal(z, 0)]); }
  const s = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  const g = new THREE.ExtrudeGeometry(s, { depth: thick, bevelEnabled: false });
  g.translate(0, 0, -thick / 2); g.rotateY(-Math.PI / 2);   // shape x -> z, shape y -> y, the thickness along x
  return g;
}

// ---- the bow tie's stripes ------------------------------------------------------------------------------------------
const STRIPES = ["#e8312f", "#ff8a1f", "#ffd91a", "#3fbf3f", "#2d6fe8", "#8a3fd1"];
function stripeTex() {
  return canvasTex(512, 128, (g, w, h) => {
    STRIPES.forEach((c, i) => { g.fillStyle = c; g.fillRect((i * w) / 6, 0, w / 6 + 1, h); });
    g.fillStyle = "#2a1228"; for (let i = 1; i < 6; i++) g.fillRect((i * w) / 6 - 2, 0, 4, h);
  });
}
const TIE = { w: 0.36, h: 0.17, knot: 0.03, thick: 0.045 };
// one lobe of the tie as a closed pillow (front and back sheets meeting at the rim), x from the knot out to the tip;
// `rim` per vertex says how near the edge it is (0 centre .. 1 edge) for the dark outline and the char
function lobeParts(side) {
  const NU = 26, NV = 14, W0 = TIE.knot, W1 = TIE.w / 2;
  const pos = [], uv = [], rim = [], idx = [];
  for (const face of [1, -1]) {
    const base = pos.length / 3;
    for (let iu = 0; iu <= NU; iu++) for (let iv = 0; iv <= NV; iv++) {
      const u = iu / NU, v = (iv / NV) * 2 - 1, s = u > 0.78 ? (u - 0.78) / 0.22 : 0;
      const cap = Math.pow(Math.max(0, 1 - Math.pow(s, 4)), 0.25);
      const hh = lerp(0.034, TIE.h / 2, smooth(u * 1.15)) * cap;
      const x = side * (W0 + (W1 - W0) * u), y = v * hh;
      const z = face * TIE.thick * Math.pow(Math.max(0, 1 - v * v), 0.5) * cap * (0.78 + 0.22 * Math.sin(Math.PI * u)) * (1 - 0.14 * Math.exp(-v * v * 14));
      pos.push(x, y, z); uv.push((x + TIE.w / 2) / TIE.w, (y + TIE.h / 2) / TIE.h);
      rim.push(Math.max(Math.abs(v), s));
    }
    for (let iu = 0; iu < NU; iu++) for (let iv = 0; iv < NV; iv++) {
      const a = base + iu * (NV + 1) + iv, b = a + 1, c = a + NV + 1, d = c + 1;
      // the front sheet faces +z for the right lobe; mirror and back sheet flip the winding
      if ((face * side) > 0) idx.push(a, c, b, b, c, d); else idx.push(a, b, c, b, d, c);
    }
  }
  return { pos, uv, rim, idx };
}

export const HP_KINDS = {
  hpcoal(P) {
    const S = P.spec, r = S.r ?? 0.1;
    S.glow ??= 1;   // propState starts glow at spec.glow ?? 0: the coal's default is hot
    const body = new THREE.Group(); body.scale.setScalar(r); P.whole.add(body);
    const geo = lumpGeometry();
    // the lump: near-black charcoal, a random shade per face, a dull ember tint under the cracks
    const shell = mat("#2a2422", { roughness: 0.95, metalness: 0, vertexColors: true, emissive: new THREE.Color("#5a1a05"), emissiveIntensity: 0.18 });
    shell.userData.krimK = 0.15; shell.userData.noShine = true;
    mesh(geo, shell, body);
    // the heat skin
    const heat = new THREE.ShaderMaterial({ uniforms: { uTime: { value: 0 }, uGlow: { value: 1 } }, vertexShader: "varying vec3 vP; void main() { vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }", fragmentShader: HEAT_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
    heat.userData.noOutline = true; heat.userData.glow = true;
    const skin = steamy(new THREE.Mesh(geo, heat), 2); skin.scale.setScalar(1.006); body.add(skin);
    // the halo round it (a camera-facing additive disc; the lump hides its middle)
    const haloM = haloMaterial(), halo = steamy(new THREE.Mesh(new THREE.PlaneGeometry(1, 1), haloM), 4); halo.userData.glow = true; P.whole.add(halo);
    // the smoke wisp: a group that undoes the prop's own turn, so it always rises up the world
    const smokeG = new THREE.Group(); P.whole.add(smokeG);
    const puffs = Array.from({ length: 8 }, (_, i) => {
      const m = smokeMaterial(); m.uniforms.uSeed.value = rnd(i + 3);
      const o = steamy(new THREE.Mesh(new THREE.PlaneGeometry(1, 1), m), 5 + (i % 3)); smokeG.add(o);
      return { o, m, ph: (i + rnd(i + 17) * 0.5) / 8, sw: rnd(i + 41) * 6.28 };
    });
    const q = new THREE.Quaternion();
    return {
      grip: 0,
      apply(ps, t) {
        const tt = t ?? 0, glow = clamp(ps.glow ?? 1), sm = clamp(ps.smoke ?? S.smoke ?? 0.6);
        heat.uniforms.uTime.value = tt; heat.uniforms.uGlow.value = glow; skin.visible = glow > 0.01;
        shell.emissiveIntensity = 0.18 * glow;
        const fl = 0.85 + 0.15 * Math.sin(tt * 1.6) + 0.04 * Math.sin(tt * 9.1);
        halo.visible = glow > 0.01; halo.scale.setScalar(1); haloM.uniforms.uR.value = r * 2.7; haloM.uniforms.uA.value = 0.5 * glow * fl;
        smokeG.quaternion.copy(q.copy(P.root.quaternion).invert());
        for (const p of puffs) {
          const k = (tt * 0.5 + p.ph) % 1;
          p.o.visible = sm > 0.01;
          p.o.position.set(Math.sin(k * 5 + p.sw) * 0.03 * (1 + 1.5 * k), r * 0.75 + 0.45 * k, Math.cos(k * 4 + p.sw) * 0.02 * k);
          p.m.uniforms.uR.value = 0.03 + 0.085 * k;
          p.m.uniforms.uA.value = sm * 0.42 * Math.sin(Math.PI * Math.min(1, k * 1.15)) * (0.55 + 0.45 * glow);
          p.m.uniforms.uWarm.value = (1 - Math.min(1, k * 2.2)) * glow; p.m.uniforms.uTime.value = tt;
        }
      },
    };
  },

  hptongs(P) {
    const S = P.spec; S.open ??= 0.25;
    const K = (S.len ?? 0.55) / 0.556, L1 = 0.455, PAD = 0.11, HINGE = 0.0145, T0 = Math.asin((0.1035 - HINGE) / L1), T1 = Math.asin((0.25 - HINGE) / L1);
    const root = new THREE.Group(); root.scale.setScalar(K); P.whole.add(root);
    const steel = mat("#9aa4b4", { roughness: 0.22, metalness: 0.8, emissive: new THREE.Color("#1a2030"), emissiveIntensity: 0.6 });
    const bright = mat("#b4bece", { roughness: 0.18, metalness: 0.85, emissive: new THREE.Color("#222838"), emissiveIntensity: 0.6 });
    // the hinge: a flat strip bent into a half ring behind the origin
    const ring = new THREE.Shape(); ring.absarc(0, 0, 0.0175, Math.PI, 2 * Math.PI, false); ring.lineTo(0.0115, 0); ring.absarc(0, 0, 0.0115, 2 * Math.PI, Math.PI, true);
    const bend = new THREE.ExtrudeGeometry(ring, { depth: 0.028, bevelEnabled: false, curveSegments: 14 }); bend.translate(0, 0, -0.014); bend.rotateX(Math.PI / 2);
    mesh(bend, steel, root);
    const padG = padGeometry(PAD, 0.007);
    const arms = [1, -1].map((k) => {
      const g = new THREE.Group(); g.position.set(k * HINGE, 0, 0); root.add(g);
      mesh(new THREE.BoxGeometry(0.006, 0.028, L1), steel, g, 0, 0, L1 / 2);
      // grip ridges along the handle's outside
      for (let i = 0; i < 5; i++) mesh(new THREE.BoxGeometry(0.005, 0.03, 0.009), bright, g, k * 0.004, 0, 0.045 + i * 0.03);
      const pad = new THREE.Group(); pad.position.set(0, 0, L1); g.add(pad);
      mesh(padG, bright, pad);
      return { k, g, pad };
    });
    return {
      grip: 0,
      apply(ps) {
        const th = lerp(T0, T1, clamp(ps.open ?? 0.25));
        for (const { k, g, pad } of arms) { g.rotation.y = k * th; pad.rotation.y = -k * th; }
      },
    };
  },

  hpbowtie(P) {
    const S = P.spec, tex = stripeTex();
    const m = mat("#ffffff", { map: tex, vertexColors: true, roughness: 0.7, emissive: new THREE.Color("#ffffff"), emissiveMap: tex, emissiveIntensity: 0.35 });
    m.userData.lineColor = "#2a1228"; m.userData.noHatch = true;
    const rims = [], geos = [];
    for (const side of [1, -1]) {
      const { pos, uv, rim, idx } = lobeParts(side), g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
      g.setAttribute("color", new THREE.Float32BufferAttribute(new Float32Array(pos.length).fill(1), 3));
      g.setIndex(idx); g.computeVertexNormals();
      mesh(g, m, P.whole); rims.push(rim); geos.push(g);
    }
    // the knot: a squashed ball in the middle stripes, wrapped by a band
    const kg = new THREE.SphereGeometry(0.045, 24, 16), kp = kg.attributes.position, ku = kg.attributes.uv;
    for (let i = 0; i < kp.count; i++) { kp.setXYZ(i, kp.getX(i) * 0.78, kp.getY(i) * 1.05, kp.getZ(i) * 1.1); ku.setXY(i, (kp.getX(i) + TIE.w / 2) / TIE.w, (kp.getY(i) + TIE.h / 2) / TIE.h); }
    kg.computeVertexNormals(); kg.setAttribute("color", new THREE.Float32BufferAttribute(new Float32Array(kp.count * 3).fill(1), 3));
    mesh(kg, m, P.whole, 0, 0, 0.012);
    geos.push(kg); rims.push(null);
    let drawn = -1;
    const paint = (singe) => {
      for (const [i, g] of geos.entries()) {
        const c = g.attributes.color, p = g.attributes.position;
        for (let j = 0; j < c.count; j++) {
          const e = rims[i] ? rims[i][j % rims[i].length] : 0;
          // the dark edge always, the char creeping in from the edge with singe (ragged, from noise)
          const edge = smooth((e - 0.82) / 0.18), n = hash3(Math.round(p.getX(j) * 200), Math.round(p.getY(j) * 200), 5.5);
          const char = singe * smooth((e - (0.3 + 0.3 * n)) / 0.3) * 0.9 + singe * 0.2 * n;
          const k = Math.max(0.08, 1 - 0.8 * edge - char);
          c.setXYZ(j, k, k, k);
        }
        c.needsUpdate = true;
      }
    };
    return {
      grip: 0,
      apply(ps) {
        const s = clamp(ps.singe ?? S.singe ?? 0);
        if (s === drawn) return; drawn = s;
        paint(s);
        m.color.setRGB(lerp(1, 0.4, s), lerp(1, 0.27, s), lerp(1, 0.2, s)); m.emissiveIntensity = 0.35 * (1 - 0.75 * s);
      },
    };
  },

  hplift(P) {
    const S = P.spec, W = S.w ?? 0.9, D = S.d ?? 0.8, H = S.h ?? 0.42, POLE = S.pole ?? 3.0, r = 0.008, step = 0.1;
    const wireM = mat("#d9d4dc", { roughness: 0.3, metalness: 0.5, emissive: new THREE.Color("#16141a"), emissiveIntensity: 0.5 });
    const frameM = mat("#b9b3be", { roughness: 0.3, metalness: 0.55, emissive: new THREE.Color("#14121a"), emissiveIntensity: 0.5 });
    const poleM = mat("#a9afb9", { roughness: 0.28, metalness: 0.6, emissive: new THREE.Color("#1a1d24"), emissiveIntensity: 0.6 });
    const x = W / 2, z = D / 2, wire = [], frame = [];
    // the walls: upright wires all round, two bands, a thick rim and a thick bottom frame
    const nx = Math.round(W / step), nz = Math.round(D / step);
    for (let i = 0; i <= nx; i++) for (const s of [-1, 1]) wire.push(barGeo([-x + (i * W) / nx, 0, s * z], [-x + (i * W) / nx, H, s * z], r));
    for (let i = 1; i < nz; i++) for (const s of [-1, 1]) wire.push(barGeo([s * x, 0, -z + (i * D) / nz], [s * x, H, -z + (i * D) / nz], r));
    for (const y of [H * 0.38, H * 0.72]) for (const s of [-1, 1]) { wire.push(barGeo([-x, y, s * z], [x, y, s * z], r)); wire.push(barGeo([s * x, y, -z], [s * x, y, z], r)); }
    for (const [y, rad] of [[0.012, 0.013], [H, 0.017]]) for (const s of [-1, 1]) { frame.push(barGeo([-x, y, s * z], [x, y, s * z], rad, 8)); frame.push(barGeo([s * x, y, -z], [s * x, y, z], rad, 8)); }
    // the floor: a grid of wires the potato stands on (its top at y 0.018)
    for (let i = 0; i <= nx; i++) wire.push(barGeo([-x + (i * W) / nx, 0.01, -z], [-x + (i * W) / nx, 0.01, z], r));
    for (let i = 0; i <= nz; i++) wire.push(barGeo([-x, 0.01, -z + (i * D) / nz], [x, 0.01, -z + (i * D) / nz], r));
    mesh(mergeGeos(wire), wireM, P.whole).castShadow = false;
    mesh(mergeGeos(frame), frameM, P.whole);
    // the pole on the basket's right: from POLE m under the floor to 0.55 m over the rim, a cap, and two short arms
    const px = x + 0.08, top = H + 0.55;
    mesh(new THREE.CylinderGeometry(0.025, 0.025, top + POLE, 14), poleM, P.whole, px, (top - POLE) / 2, 0);
    mesh(new THREE.SphereGeometry(0.03, 14, 10), poleM, P.whole, px, top, 0);
    const arm = [];
    // the upper arm reaches over the rim and hooks down behind it; the lower one holds the bottom frame
    arm.push(barGeo([px, H + 0.045, 0], [x - 0.045, H + 0.045, 0], 0.016, 8), barGeo([x - 0.045, H + 0.045, 0], [x - 0.045, H - 0.04, 0], 0.016, 8));
    arm.push(barGeo([px, 0.05, 0], [x - 0.02, 0.05, 0], 0.016, 8));
    mesh(mergeGeos(arm), poleM, P.whole);
    // the drips: drops that fall from the floor's wires, each on its own loop
    const dropM = new THREE.MeshBasicMaterial({ color: "#ffb43a", transparent: true, opacity: 0.45 }); dropM.userData.noOutline = true;
    const fall = S.dripLen ?? 1.0;
    const drops = Array.from({ length: 22 }, (_, i) => {
      const o = steamy(new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 6), dropM), 3); o.scale.set(1, 1.8, 1); P.whole.add(o);
      return { o, x: (rnd(i) - 0.5) * (W - 0.1), z: (rnd(i + 50) - 0.5) * (D - 0.1), ph: rnd(i + 90), per: 0.3 + rnd(i + 130) * 0.25 };
    });
    return {
      grip: 0,
      apply(ps, t) {
        const dr = clamp(ps.drip ?? S.drip ?? 0);
        for (const d of drops) {
          const u = ((t ?? 0) / d.per + d.ph) % 1;
          d.o.position.set(d.x, -0.01 - u * u * fall, d.z);
          d.o.visible = dr > rnd(d.ph * 77) * 0.9 + 0.05;
        }
      },
    };
  },
};
