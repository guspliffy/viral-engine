import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { rng } from "./util.js";

// "trail": the forest trail of The Easy Trail (friend comedies 24, 30 Oct 2026). A straight dirt trail runs along
// x 0 toward -z through a sunny forest on a plateau (y 0): an exposed root across it, then a gully crossed by one
// narrow plank, then the plateau ends at a cliff (z TRAIL.edge) over a forested valley far below, a lake and blue
// mountains all round. The trail is lined with bushes close by (they rush past the rider's view), tall leafy trees and
// firs further out. Everything the clip moves is a prop (props-trail.js); this is the still scenery.
// spec: { type: "trail", seed, trees: false (no tall trees: a painted plate's forest instead), moss: tint of the ground,
//         leaf: [three bush/crown colours] }
export const TRAIL = {
  edge: -8,                       // the cliff's top edge (z); the plateau is z > edge
  root: 3.8,                      // the root across the trail (z of its middle)
  gully: [-1.0, -3.4],            // the gully's two banks (z), its floor at gullyFloor
  gullyFloor: -1.6,
  plank: { z0: -0.5, z1: -3.9, w: 0.3, top: 0.06 },   // one narrow plank from bank to bank, its top surface at y top
  valley: -36,                    // the valley floor (y)
};

// bend: { z0, z1, x } (Jonny 31 Oct: "we need a turn in the path ... logic"): after the plank the trail swings out to x
// round a big boulder that blocks the straight line and comes back to x 0 before the cliff edge. trailX(z) is the
// trail's middle at z; the storyboard's riders follow the same curve
export function trailX(z, B) {
  if (!B || z > B.z0 || z < B.z1) return 0;
  const u = (B.z0 - z) / (B.z0 - B.z1); return B.x * Math.sin(Math.PI * u) ** 2;
}
// the trail's heading at z: degrees, + to the left (the way a rider riding toward -z turns)
export function trailYaw(z, B) { const d = 0.01; return (Math.atan((trailX(z + d, B) - trailX(z - d, B)) / (2 * d)) * 180) / Math.PI; }

function canvasTex(w, h, draw, rx = 1, ry = 1) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 8;
  return t;
}
const lam = (color, o = {}) => new THREE.MeshLambertMaterial({ color, ...o });
const flat = (o) => { o.material.userData.noOutline = true; o.receiveShadow = true; return o; };
// merge a list of [geometry, matrix] into one mesh (fewer draw calls for the CPU renderer)
function merged(parts, m, cast = true) {
  if (!parts.length) return null;
  const geo = mergeGeometries(parts.map(([g, M]) => { const q = g.index ? g.toNonIndexed() : g.clone(); q.applyMatrix4(M); for (const k of Object.keys(q.attributes)) if (k !== "position" && k !== "normal" && k !== "uv") q.deleteAttribute(k); return q; }));
  const o = new THREE.Mesh(geo, m); o.castShadow = cast; o.receiveShadow = true; return o;
}
const M4 = (x, y, z, sx = 1, sy = 1, sz = 1, ry = 0, rx = 0, rz = 0) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(sx, sy, sz));

// a soft rocky texture: grey-brown with strata and cracks
function rockTex(rnd, base = "#9a8a78", rx = 1, ry = 1) {
  return canvasTex(512, 512, (c, w, h) => {
    c.fillStyle = base; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 420; i++) { const v = rnd(); c.fillStyle = v < 0.5 ? `rgba(70,58,50,${0.12 + 0.12 * rnd()})` : `rgba(235,222,200,${0.1 + 0.12 * rnd()})`; c.beginPath(); c.ellipse(rnd() * w, rnd() * h, 8 + rnd() * 40, 4 + rnd() * 14, 0, 0, 7); c.fill(); }
    c.strokeStyle = "rgba(60,48,40,0.35)"; c.lineWidth = 2;
    for (let i = 0; i < 26; i++) { let x = rnd() * w, y = rnd() * h; c.beginPath(); c.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (rnd() - 0.5) * 40; y += 10 + rnd() * 30; c.lineTo(x, y); } c.stroke(); }
    for (let y = 30; y < h; y += 40 + rnd() * 50) { c.fillStyle = "rgba(80,66,55,0.18)"; c.fillRect(0, y, w, 3 + rnd() * 5); }
  }, rx, ry);
}

// leafy: each bush blob becomes a darker core covered in leaf cards (a painted leaf with a midrib, cut out by its
// alpha), turned outwards with some scatter, plus fern fronds arching out at the foot of the bush. Its own random
// stream, so the layout of everything else stays as it was.
function leafTex(draw) { const t = canvasTex(128, 128, draw); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t; }
function leafyBushes(g, bushes, S, rnd) {
  const cols = S.leaf || ["#5fae4c", "#73c25a", "#4c9a48"];
  const leafT = leafTex((c, w, h) => {
    for (const [cx, cy, a, k] of [[64, 66, -0.5, 1], [40, 44, 0.6, 0.8], [88, 40, -1.1, 0.75]]) {
      c.save(); c.translate(cx, cy); c.rotate(a); c.scale(k, k);
      const gr = c.createLinearGradient(-22, 0, 22, 0); gr.addColorStop(0, "#c8c8c8"); gr.addColorStop(0.5, "#ffffff"); gr.addColorStop(1, "#a8a8a8");
      c.fillStyle = gr; c.beginPath(); c.moveTo(0, -46); c.quadraticCurveTo(30, -10, 0, 46); c.quadraticCurveTo(-30, -10, 0, -46); c.fill();
      c.strokeStyle = "rgba(90,90,90,0.55)"; c.lineWidth = 2.5; c.beginPath(); c.moveTo(0, -40); c.lineTo(0, 44); c.stroke();
      c.lineWidth = 1.2; for (let y = -26; y < 34; y += 11) { c.beginPath(); c.moveTo(0, y + 6); c.lineTo(13, y - 3); c.moveTo(0, y + 6); c.lineTo(-13, y - 3); c.stroke(); }
      c.restore();
    }
  });
  const fernT = leafTex((c, w, h) => {
    c.strokeStyle = "#9a9a9a"; c.lineWidth = 3; c.beginPath(); c.moveTo(64, 128); c.lineTo(64, 4); c.stroke();
    for (let y = 120; y > 8; y -= 7) { const L = 8 + 44 * Math.sin(Math.PI * (128 - y) / 128) * (y / 128 + 0.2); c.fillStyle = y % 14 < 7 ? "#ffffff" : "#e6e6e6";
      for (const s of [-1, 1]) { c.beginPath(); c.moveTo(64, y); c.quadraticCurveTo(64 + s * L * 0.6, y - 9, 64 + s * L, y - 12); c.quadraticCurveTo(64 + s * L * 0.5, y - 2, 64, y + 3); c.fill(); } }
  });
  const card = new THREE.PlaneGeometry(1, 1), q = new THREE.Quaternion(), e = new THREE.Euler(), n = new THREE.Vector3(), up = new THREE.Vector3(0, 0, 1);
  bushes.forEach((parts, li) => {
    if (!parts.length) return;
    const core = new THREE.Color(cols[li]).multiplyScalar(0.62), cards = [], ferns = [];
    for (const [, M] of parts) {
      const p = new THREE.Vector3(), sc = new THREE.Vector3(); M.decompose(p, q, sc);
      cards.push([new THREE.IcosahedronGeometry(0.86, 1), M]);   // the shadowed inside, so no gaps show through
      const nCards = Math.round(26 + 60 * sc.x);
      for (let k = 0; k < nCards; k++) {
        const th = rnd() * Math.PI * 2, ph = Math.asin(rnd() * 1.8 - 0.8);   // more on top than underneath
        n.set(Math.cos(ph) * Math.sin(th), Math.sin(ph), Math.cos(ph) * Math.cos(th));
        const at = new THREE.Vector3(n.x * sc.x, n.y * sc.y, n.z * sc.z).multiplyScalar(0.92).add(p);
        q.setFromUnitVectors(up, n); e.set((rnd() - 0.5) * 1.1, (rnd() - 0.5) * 1.1, rnd() * 6.3); const tw = new THREE.Quaternion().setFromEuler(e);
        const s = (0.13 + rnd() * 0.09) * Math.min(1.4, 0.6 + sc.x);
        cards.push([card, new THREE.Matrix4().compose(at, q.clone().multiply(tw), new THREE.Vector3(s, s, s))]);
      }
      if (rnd() < 0.55) for (let f = 0; f < 3; f++) {   // ferns at the foot, arching out and down
        const a = rnd() * Math.PI * 2, L = 0.35 + rnd() * 0.25, fq = new THREE.Quaternion().setFromEuler(new THREE.Euler(-1.0 - rnd() * 0.4, a, 0, "YXZ"));
        ferns.push([card, new THREE.Matrix4().compose(new THREE.Vector3(p.x + Math.sin(a) * sc.x * 0.9, 0.08, p.z + Math.cos(a) * sc.z * 0.9), fq, new THREE.Vector3(L * 0.55, L, 1))]);
      }
    }
    // overhang (Phase 2): leafy branch ends reaching over the trail edges at head height, so the rider's view passes
    // under and beside near leaves (the closest layer of depth); a share of them goes into each colour's leaves
    if (S.overhang && li < 3) for (let z = 12 - li * 1.2; z > TRAIL.edge + 1.5; z -= 3.6 + rnd() * 1.5) {
      if (z < TRAIL.gully[0] + 0.3 && z > TRAIL.gully[1] - 0.3) continue;
      const side = rnd() < 0.5 ? -1 : 1, base = new THREE.Vector3(trailX(z, S.bend) + side * (1.05 + rnd() * 0.35), 1.55 + rnd() * 0.45, z);
      const twig = new THREE.Vector3(-side * (0.35 + rnd() * 0.25), -0.12 - rnd() * 0.12, (rnd() - 0.5) * 0.4);
      for (let k = 0; k < 46; k++) {
        const a = rnd(), at = base.clone().addScaledVector(twig, a).add(new THREE.Vector3((rnd() - 0.5) * 0.32, (rnd() - 0.5) * 0.22 - a * 0.08, (rnd() - 0.5) * 0.32));
        n.set(rnd() - 0.5, 0.3 + rnd(), rnd() - 0.5).normalize(); q.setFromUnitVectors(up, n); e.set((rnd() - 0.5) * 1.2, (rnd() - 0.5) * 1.2, rnd() * 6.3);
        const s = 0.12 + rnd() * 0.08; cards.push([card, new THREE.Matrix4().compose(at, q.clone().multiply(new THREE.Quaternion().setFromEuler(e)), new THREE.Vector3(s, s, s))]);
      }
    }
    const coreParts = cards.filter(([geo]) => geo !== card), leafParts = cards.filter(([geo]) => geo === card);
    g.add(merged(coreParts, lam(core)));
    const lm = lam(cols[li], { map: leafT, alphaTest: 0.5, side: THREE.DoubleSide }), fm = lam(new THREE.Color(cols[li]).multiplyScalar(0.9), { map: fernT, alphaTest: 0.5, side: THREE.DoubleSide });
    if (S.wind) { lm.userData.wind = { amp: 0.018 * S.wind, h: 0, flutter: 1.8 }; fm.userData.wind = { amp: 0.05 * S.wind, h: 0.5, flutter: 1 }; }   // Phase 2: leaves shiver, fronds bend
    g.add(merged(leafParts, lm));
    if (ferns.length) g.add(merged(ferns, fm, false));
  });
}

// the bend's boulder: where it sits (on the straight line the trail no longer takes), and whether x, z is inside it
const rockAt = (B) => B && { x: B.rockX ?? -B.x * 0.4, z: B.rockZ ?? (B.z0 + B.z1) / 2, r: B.rockR ?? 0.85 };
const inRock = (x, z, B) => { const R = rockAt(B); return !!R && Math.hypot((x - R.x) / R.r, (z - R.z) / (R.r * 1.1)) < 1; };
// with leafy: grass tufts and small ferns along the trail's edges, pebbles and twigs on the dirt, and dappled sunlight
// (soft dark patches where the trees shade the trail) over the ground
function groundDetail(g, S, rnd, free) {
  const T = TRAIL, [G0, G1] = T.gully, E = T.edge, bx = (z) => trailX(z, S.bend);
  const grassT = leafTex((c, w, h) => {
    for (let i = 0; i < 26; i++) {
      const x0 = 30 + rnd() * 68, lean = (x0 - 64) * 0.9 + (rnd() - 0.5) * 30, top = 10 + rnd() * 60, wd = 3 + rnd() * 3;
      const sh = 170 + Math.round(rnd() * 85); c.fillStyle = `rgb(${sh},${sh},${sh})`;
      c.beginPath(); c.moveTo(x0 - wd, 128); c.quadraticCurveTo(x0 + lean * 0.3, (128 + top) / 2, x0 + lean, top); c.quadraticCurveTo(x0 + lean * 0.3 + wd, (128 + top) / 2, x0 + wd, 128); c.fill();
    }
  });
  const card = new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0), tufts = [], pebbles = [], twigs = [];
  const onTrail = (z) => !(z < G0 + 0.15 && z > G1 - 0.15) && z > E + 0.4;
  for (let z = E + 0.5; z < 40; z += 0.025) {
    for (const side of [-1, 1]) {
      const x = bx(z) + side * (0.7 + Math.pow(rnd(), 1.8) * 3.4);
      if (!onTrail(z) || inRock(x, z, S.bend)) continue;
      const hgt = 0.12 + rnd() * 0.16, wd = hgt * (1.1 + rnd() * 0.6), a = rnd() * Math.PI;
      for (const k of [0, 1]) tufts.push([card, new THREE.Matrix4().compose(new THREE.Vector3(x, 0, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, a + k * Math.PI / 2, 0)), new THREE.Vector3(wd, hgt, 1))]);
    }
    if (rnd() < 0.5 && onTrail(z)) {   // pebbles and twigs on the dirt, mostly toward its edges
      const x = bx(z) + (rnd() < 0.5 ? -1 : 1) * Math.pow(rnd(), 0.6) * 0.7, r = 0.012 + rnd() * 0.03;
      if (rnd() < 0.8) pebbles.push([new THREE.DodecahedronGeometry(1, 0), M4(x, r * 0.35, z, r * 1.3, r * 0.6, r, rnd() * 6)]);
      else twigs.push([new THREE.CylinderGeometry(0.006, 0.004, 1, 5), M4(x, 0.008, z, 1, 0.1 + rnd() * 0.18, 1, 0, Math.PI / 2, rnd() * 6)]);
    }
  }
  const grassCol = new THREE.Color(S.grass || (S.leaf ? S.leaf[1] : "#73c25a"));
  const gm = lam(grassCol, { map: grassT, alphaTest: 0.5, side: THREE.DoubleSide });
  if (S.wind) gm.userData.wind = { amp: 0.06 * S.wind, h: 0.3, flutter: 1.2 };   // Phase 2: grass bends with the gusts
  g.add(merged(tufts, gm, false));
  if (pebbles.length) g.add(merged(pebbles, lam("#857a68")));
  if (twigs.length) g.add(merged(twigs, lam("#6a4a30"), false));
  // dappled light: soft shade patches on a plane just above the ground, darker in the middle, drifting nowhere
  const dap = canvasTex(512, 512, (c, w, h) => {
    for (let i = 0; i < 70; i++) {
      const x = rnd() * w, y = rnd() * h, r = 20 + rnd() * 70, gr = c.createRadialGradient(x, y, r * 0.2, x, y, r);
      gr.addColorStop(0, "rgba(30,24,8,0.6)"); gr.addColorStop(0.6, "rgba(30,24,8,0.45)"); gr.addColorStop(1, "rgba(40,30,10,0)");
      c.fillStyle = gr; c.beginPath(); c.ellipse(x, y, r * 1.4, r, rnd() * 3, 0, 7); c.fill();
    }
  }, 6, 30);
  for (const [z0, z1] of [[50, G0], [G1, E]]) {
    const L = z0 - z1, m = new THREE.Mesh(new THREE.PlaneGeometry(12, L), new THREE.MeshBasicMaterial({ map: dap, transparent: true, depthWrite: false, fog: true }));
    dap.repeat.set(2.4, L / 2); m.rotation.x = -Math.PI / 2; m.position.set(0, 0.006, (z0 + z1) / 2); m.renderOrder = 2; m.material.userData.noOutline = true; g.add(m);
  }
}

export function buildTrail(scene, S = {}) {
  const rnd = rng((S.seed || 7) * 431), g = new THREE.Group(); scene.add(g);
  const T = TRAIL, [G0, G1] = T.gully, E = T.edge;
  scene.background = new THREE.Color("#8fc6ef");
  scene.fog = new THREE.Fog("#d4e8f4", 30, 240);

  // the sky: a big gradient dome (the stage's own is too small for the valley), deep blue overhead, pale at the horizon
  const sky = new THREE.Mesh(new THREE.SphereGeometry(260, 32, 20), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color("#4f9be6") }, hor: { value: new THREE.Color("#d9eefa") } },
    vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
    fragmentShader: "uniform vec3 top; uniform vec3 hor; varying vec3 vP; void main(){ float h = clamp(vP.y * 1.8, 0.0, 1.0); gl_FragColor = vec4(mix(hor, top, pow(h, 0.65)), 1.0);\n#include <colorspace_fragment>\n}",
  }));
  sky.position.set(0, -10, -20); sky.material.userData.noOutline = true; g.add(sky);

  // mountains and clouds painted round the valley on two open cylinders (far blue peaks with snow, nearer green hills)
  const ring = (radius, height, y0, draw, seed) => {
    const tex = canvasTex(4096, 1024, (c, w, h) => draw(c, w, h, rng(seed)));
    tex.wrapS = THREE.RepeatWrapping; tex.repeat.set(1, 1);
    const m = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.BackSide, fog: false, depthWrite: false });
    m.userData.noOutline = true;
    const o = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 96, 1, true), m); o.position.set(0, y0 + height / 2, -20); o.renderOrder = -1; g.add(o); return o;
  };
  const ridge = (c, w, h, r, base, amp, col, snow) => {
    const pts = []; let y = base;
    for (let x = 0; x <= w; x += 16) { y = base - amp * (0.5 + 0.5 * Math.sin(x * 0.0021 + r() * 0.2)) * (0.6 + 0.4 * Math.sin(x * 0.0067 + 1.3)) - amp * 0.25 * r(); pts.push([x, y]); }
    c.fillStyle = col; c.beginPath(); c.moveTo(0, h); for (const [x, yy] of pts) c.lineTo(x, yy); c.lineTo(w, h); c.fill();
    if (snow) { c.fillStyle = "rgba(250,252,255,0.9)"; for (let i = 1; i < pts.length - 1; i++) { const [x, yy] = pts[i]; if (yy < base - amp * 0.72 && pts[i - 1][1] > yy && pts[i + 1][1] >= yy) { c.beginPath(); c.moveTo(x - 40, yy + 34); c.lineTo(x, yy); c.lineTo(x + 44, yy + 30); c.lineTo(x + 18, yy + 24); c.lineTo(x, yy + 36); c.lineTo(x - 16, yy + 26); c.fill(); } } }
  };
  ring(200, 150, T.valley - 4, (c, w, h, r) => {
    c.clearRect(0, 0, w, h);
    // clouds high up
    for (let i = 0; i < 26; i++) { const x = r() * w, y = 120 + r() * 260, s = 40 + r() * 70; c.fillStyle = "rgba(255,255,255,0.85)"; for (let k = 0; k < 6; k++) { c.beginPath(); c.arc(x + (k - 2.5) * s * 0.55, y + Math.abs(k - 2.5) * s * 0.12, s * (0.55 + 0.3 * r()), 0, 7); c.fill(); } }
    ridge(c, w, h, r, 860, 330, "#9db8d8", true);
    ridge(c, w, h, r, 900, 200, "#86a6c9", false);
  }, 11);
  ring(130, 90, T.valley - 2, (c, w, h, r) => {
    c.clearRect(0, 0, w, h);
    ridge(c, w, h, r, 900, 200, "#6f9e86", false);
    ridge(c, w, h, r, 960, 120, "#5f9474", false);
  }, 12);

  // the valley floor far below: forest canopy as dark and light green blobs, a lake, and 3D firs near the cliff foot
  const valleyTex = canvasTex(1024, 1024, (c, w, h) => {
    c.fillStyle = "#4f8f4e"; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) { const v = rnd(); c.fillStyle = v < 0.45 ? `rgba(38,92,52,${0.5 + 0.3 * rnd()})` : v < 0.8 ? `rgba(98,160,78,${0.45 + 0.3 * rnd()})` : `rgba(150,190,96,0.5)`; c.beginPath(); c.arc(rnd() * w, rnd() * h, 4 + rnd() * 10, 0, 7); c.fill(); }
  }, 10, 10);
  const valley = flat(new THREE.Mesh(new THREE.PlaneGeometry(500, 500), lam("#ffffff", { map: valleyTex }))); valley.rotation.x = -Math.PI / 2; valley.position.set(0, T.valley, -60); valley.name = "trail-valley"; g.add(valley);
  const lake = flat(new THREE.Mesh(new THREE.CircleGeometry(1, 48), lam("#5fb3e0", { emissive: new THREE.Color("#1f5a86") }))); lake.rotation.x = -Math.PI / 2; lake.scale.set(34, 20, 1); lake.position.set(-26, T.valley + 0.05, -70); lake.name = "trail-valley-lake"; g.add(lake);
  {
    const firs = [], firM = lam("#3b7d4c"), trunks = [];
    for (let i = 0; i < 260; i++) {
      const x = (rnd() - 0.5) * 140, z = E - 6 - rnd() * 70, s = 2.5 + rnd() * 3.5;
      if (Math.hypot((x + 26) / 34, (z + 70) / 20) < 1.1) continue;   // not in the lake
      firs.push([new THREE.ConeGeometry(0.42, 1, 8), M4(x, T.valley + s * 0.62, z, s, s * 1.3, s)]);
      trunks.push([new THREE.CylinderGeometry(0.06, 0.08, 1, 6), M4(x, T.valley + s * 0.12, z, s, s * 0.25, s)]);
    }
    const vf = merged(firs, firM, false), vt = merged(trunks, lam("#6b4a32"), false); vf.name = "trail-valley-firs"; vt.name = "trail-valley-trunks"; g.add(vf); g.add(vt);
  }

  // the cliff: a rough rock wall from the plateau's edge down to the valley, with a grassy lip and bushes on top
  {
    // local +z is out from the plateau (the wall is turned to face -z); the bumps grow from nothing at the top edge
    const H = -T.valley, geo = new THREE.PlaneGeometry(140, H, 140, 40), p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), wy = p.getY(i) - H / 2, a = Math.min(1, -wy / 1.5);
      p.setZ(i, a * (0.45 * Math.sin(x * 1.3 + wy * 0.4) + 0.3 * Math.sin(x * 3.1 - wy * 1.7) + 0.8 * Math.sin(x * 0.37 + wy * 0.21) + 0.8) + Math.max(0, -wy - 14) * 0.25);
    }
    geo.computeVertexNormals();
    const wall = new THREE.Mesh(geo, lam("#ffffff", { map: rockTex(rnd, "#a39280", 30, 8) })); wall.rotation.y = Math.PI; wall.position.set(0, -H / 2, E); wall.receiveShadow = true; wall.castShadow = true; g.add(wall);
    // the lip: a turf band along the edge, a little rounded over
    const lip = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 140, 10, 1, false, 0, Math.PI), lam(S.lip || (S.moss && S.leaf ? S.leaf[1] : "#79b85a"))); lip.rotation.z = Math.PI / 2; lip.position.set(0, -0.2, E + 0.2); lip.receiveShadow = true; g.add(lip);
  }

  // the plateau's mossy ground, in two pieces either side of the gully, and the dirt trail along x 0
  const mossTex = canvasTex(512, 512, (c, w, h) => {
    c.fillStyle = "#86c463"; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 300; i++) { c.fillStyle = rnd() < 0.6 ? `rgba(60,130,56,${0.2 + 0.2 * rnd()})` : `rgba(190,220,110,${0.18 + 0.15 * rnd()})`; c.beginPath(); c.arc(rnd() * w, rnd() * h, 5 + rnd() * 24, 0, 7); c.fill(); }
    for (let i = 0; i < 900; i++) { c.fillStyle = "rgba(40,100,40,0.35)"; c.fillRect(rnd() * w, rnd() * h, 2, 5); }
  }, 1, 1);
  const dirtTex = canvasTex(256, 512, (c, w, h) => {
    // a strip: dirt in the middle with two worn ruts, soft grassy edges (alpha)
    const gr = c.createLinearGradient(0, 0, w, 0);
    gr.addColorStop(0, "rgba(176,128,82,0)"); gr.addColorStop(0.16, "rgba(176,128,82,0.95)"); gr.addColorStop(0.84, "rgba(176,128,82,0.95)"); gr.addColorStop(1, "rgba(176,128,82,0)");
    c.fillStyle = gr; c.fillRect(0, 0, w, h);
    for (const x of [0.38, 0.62]) { c.fillStyle = "rgba(140,96,60,0.45)"; c.fillRect(x * w - 9, 0, 18, h); }
    for (let i = 0; i < 700; i++) { const x = (0.15 + 0.7 * rnd()) * w; c.fillStyle = rnd() < 0.5 ? "rgba(110,78,50,0.5)" : "rgba(222,190,140,0.55)"; c.fillRect(x, rnd() * h, 2 + rnd() * 4, 2 + rnd() * 4); }
    for (let i = 0; i < 40; i++) { const x = (0.2 + 0.6 * rnd()) * w; c.fillStyle = "rgba(150,140,128,0.9)"; c.beginPath(); c.ellipse(x, rnd() * h, 3 + rnd() * 4, 2 + rnd() * 3, 0, 0, 7); c.fill(); }
  }, 1, 1);
  const ground = (z0, z1) => {
    const L = z0 - z1, zc = (z0 + z1) / 2, mt = mossTex.clone(); mt.needsUpdate = true; mt.repeat.set(40, L / 3);
    const m = flat(new THREE.Mesh(new THREE.PlaneGeometry(120, L), lam(S.moss || "#ffffff", { map: mt })));   // moss: a tint (to sit in a painted plate's forest) m.rotation.x = -Math.PI / 2; m.position.set(0, 0, zc); g.add(m);
    const dt = dirtTex.clone(); dt.needsUpdate = true; dt.repeat.set(1, L / 2.2);
    // the dirt strip: straight, or bent sideways along the trail's middle where it meets S.bend (a ribbon of rows)
    const rows = S.bend ? Math.max(1, Math.round(L * 12)) : 1, dg = new THREE.PlaneGeometry(1.7, L, 1, rows);
    if (S.bend) { const P = dg.attributes.position; for (let i = 0; i < P.count; i++) { const z = zc - P.getY(i); P.setX(i, P.getX(i) * Math.cos((trailYaw(z, S.bend) * Math.PI) / 180) + trailX(z, S.bend)); } }
    const d = flat(new THREE.Mesh(dg, lam("#ffffff", { map: dt, transparent: true }))); d.rotation.x = -Math.PI / 2; d.position.set(0, 0.004, zc); d.renderOrder = 1; g.add(d);
  };
  ground(60, G0); ground(G1, E);

  // the gully: two rock banks, a floor of pebbles and a stream running across it
  {
    const rt = rockTex(rnd, "#9c8b77", 40, 1);
    for (const [z, ry] of [[G0, Math.PI], [G1, 0]]) {
      const geo = new THREE.PlaneGeometry(120, -T.gullyFloor + 0.05, 120, 4), p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) p.setZ(i, 0.08 * Math.sin(p.getX(i) * 2.3) + 0.06 * Math.sin(p.getX(i) * 5.1 + p.getY(i) * 3));
      geo.computeVertexNormals();
      const w = new THREE.Mesh(geo, lam("#ffffff", { map: rt })); w.rotation.y = ry; w.position.set(0, T.gullyFloor / 2, z); w.receiveShadow = true; g.add(w);
    }
    const floor = flat(new THREE.Mesh(new THREE.PlaneGeometry(120, G0 - G1), lam("#8c8574"))); floor.rotation.x = -Math.PI / 2; floor.position.set(0, T.gullyFloor, (G0 + G1) / 2); g.add(floor);
    const waterTex = canvasTex(512, 128, (c, w, h) => {
      c.fillStyle = "#4aa3d8"; c.fillRect(0, 0, w, h);
      for (let i = 0; i < 160; i++) { c.fillStyle = `rgba(230,248,255,${0.35 + 0.4 * rnd()})`; c.fillRect(rnd() * w, rnd() * h, 14 + rnd() * 40, 2 + rnd() * 2); }
    }, 30, 1);
    const water = flat(new THREE.Mesh(new THREE.PlaneGeometry(120, (G0 - G1) * 0.62), lam("#ffffff", { map: waterTex, emissive: new THREE.Color("#174e74") }))); water.rotation.x = -Math.PI / 2; water.position.set(0, T.gullyFloor + 0.03, (G0 + G1) / 2); g.add(water);
    const rocks = [];
    for (let i = 0; i < 60; i++) { const s = 0.12 + rnd() * 0.3; rocks.push([new THREE.DodecahedronGeometry(1, 0), M4((rnd() - 0.5) * 40, T.gullyFloor + s * 0.4, G1 + 0.2 + rnd() * (G0 - G1 - 0.4), s * 1.3, s * 0.8, s, rnd() * 6)]); }
    g.add(merged(rocks, lam("#a59a8a")));
  }

  // the plank: one narrow solid timber spanning the gully, narrower than a handlebar, with wood grain
  {
    const P = T.plank, L = P.z0 - P.z1;
    const grain = canvasTex(64, 512, (c, w, h) => {
      c.fillStyle = "#b98a56"; c.fillRect(0, 0, w, h);
      for (let i = 0; i < 18; i++) { c.strokeStyle = `rgba(110,72,40,${0.25 + 0.3 * rnd()})`; c.lineWidth = 1 + rnd() * 2; const x = rnd() * w; c.beginPath(); c.moveTo(x, 0); for (let y = 0; y <= h; y += 32) c.lineTo(x + 3 * Math.sin(y * 0.03 + i), y); c.stroke(); }
      for (let i = 0; i < 3; i++) { c.fillStyle = "rgba(100,64,36,0.6)"; c.beginPath(); c.ellipse(rnd() * w, rnd() * h, 4, 9, 0, 0, 7); c.fill(); }
    });
    const plank = new THREE.Mesh(new THREE.BoxGeometry(P.w, P.top, L), lam("#ffffff", { map: grain })); plank.position.set(0, P.top / 2, (P.z0 + P.z1) / 2); plank.castShadow = plank.receiveShadow = true; g.add(plank);
  }

  // the root: one gnarled root arching out of the ground right across the trail, with a thinner side root
  {
    const bark = canvasTex(256, 64, (c, w, h) => { c.fillStyle = "#7a5233"; c.fillRect(0, 0, w, h); for (let i = 0; i < 30; i++) { c.fillStyle = "rgba(60,38,22,0.5)"; c.fillRect(rnd() * w, 0, 2 + rnd() * 3, h); } }, 4, 1);
    const bm = lam("#ffffff", { map: bark });
    // a thick main root humped right across the trail (top about 0.3 m), knotted, with a second root crossing it
    const tube = (pts, r, seg = 40) => { const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(([x, y, z]) => new THREE.Vector3(x, y, T.root + z))), seg, r, 12), bm); m.castShadow = m.receiveShadow = true; g.add(m); return m; };
    tube([[-1.9, -0.14, 0.6], [-1.1, 0.06, 0.16], [-0.35, 0.15, -0.02], [0.3, 0.16, 0.04], [0.9, 0.1, -0.12], [1.7, -0.14, -0.55]], 0.14);
    tube([[-1.5, -0.1, -0.5], [-0.7, 0.07, -0.16], [0.05, 0.1, 0.02], [0.75, 0.04, 0.28], [1.4, -0.1, 0.7]], 0.085);
    tube([[-0.5, 0.12, 0.0], [-0.7, 0.04, 0.4], [-1.05, -0.06, 0.85]], 0.05, 16);
    // knots and swellings along it, and earth heaped where it dives in at the trail's edges
    for (const [x, y, z, sx, sy, sz] of [[-0.62, 0.13, 0.05, 0.2, 0.17, 0.18], [0.12, 0.17, 0.02, 0.17, 0.16, 0.16], [0.62, 0.13, -0.06, 0.19, 0.16, 0.17]]) {
      const k = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), bm); k.scale.set(sx, sy, sz); k.position.set(x, y, T.root + z); k.castShadow = k.receiveShadow = true; g.add(k);
    }
    const earth = lam("#6e4a2c");
    for (const [x, z] of [[-1.25, 0.25], [1.2, -0.3]]) { const e = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 8), earth); e.scale.set(0.35, 0.09, 0.3); e.position.set(x, 0, T.root + z); e.receiveShadow = true; g.add(e); }
  }

  // the forest: tall leafy trees and firs, kept off the trail and the gully, denser further out; bushes and ferns line
  // the trail close by so they rush past the rider's view; mossy rocks
  {
    const trunkTex = canvasTex(128, 256, (c, w, h) => { c.fillStyle = "#8a6242"; c.fillRect(0, 0, w, h); for (let i = 0; i < 26; i++) { c.fillStyle = `rgba(60,40,26,${0.3 + 0.3 * rnd()})`; c.fillRect(rnd() * w, 0, 2 + rnd() * 4, h); } }, 2, 2);
    const trunkM = lam("#ffffff", { map: trunkTex }), leaf = (S.leaf || ["#5fae4c", "#73c25a", "#4c9a48"]).map((c) => lam(c)), firM = lam("#3e8b55");
    const trunks = [], crowns = [[], [], []], firs = [], bushes = [[], [], []], rocks = [];
    const bx = (z) => trailX(z, S.bend);
    const free = (x, z, r) => Math.abs(x - bx(z)) > 1.05 + r && !(z < G0 + r + 0.2 && z > G1 - r - 0.2) && z > E + 0.6 + r && !inRock(x, z, S.bend);
    for (let i = 0; i < 150; i++) {
      const side = i % 2 ? 1 : -1, near = i < 60, x = side * (near ? 1.6 + rnd() * 3 : 4 + rnd() * 18), z = E + 0.8 + rnd() * 52, s = 0.8 + rnd() * 0.6;
      if (!free(x, z, 0.5)) continue;
      if (rnd() < 0.3) {
        trunks.push([new THREE.CylinderGeometry(0.09, 0.13, 1, 8), M4(x, 0.45 * s, z, s, 0.9 * s, s)]);
        for (let k = 0; k < 4; k++) firs.push([new THREE.ConeGeometry(1, 1, 10), M4(x, (0.9 + k * 0.75) * s, z, (0.95 - k * 0.2) * s, 1.25 * s, (0.95 - k * 0.2) * s)]);
      } else {
        const hgt = (2.6 + rnd() * 1.6) * s;
        trunks.push([new THREE.CylinderGeometry(0.13, 0.2, 1, 9), M4(x, hgt / 2, z, s, hgt, s, rnd() * 6)]);
        const li = Math.floor(rnd() * 3);
        for (let k = 0; k < 5; k++) crowns[li].push([new THREE.IcosahedronGeometry(1, 2), M4(x + (rnd() - 0.5) * 1.3 * s, hgt + (rnd() * 0.9 - 0.1) * s, z + (rnd() - 0.5) * 1.1 * s, (0.8 + rnd() * 0.45) * s, (0.7 + rnd() * 0.35) * s, (0.8 + rnd() * 0.45) * s)]);
      }
    }
    // bushes and ferns right beside the trail (every half metre or so, with gaps), and a few rocks
    for (let z = E + 0.9; z < 40; z += 0.45 + rnd() * 0.5) for (const side of [-1, 1]) {
      if (rnd() < 0.25) continue;
      const x = bx(z) + side * (1.0 + rnd() * 0.9), r = 0.22 + rnd() * 0.25;
      if (!free(x, z, 0.05)) continue;
      const li = Math.floor(rnd() * 3);
      for (let k = 0; k < 3; k++) bushes[li].push([new THREE.IcosahedronGeometry(1, 1), M4(x + (k - 1) * r * 0.7, r * 0.7, z + (rnd() - 0.5) * r, r, r * 0.8, r)]);
      if (rnd() < 0.12) rocks.push([new THREE.DodecahedronGeometry(1, 0), M4(side * (0.95 + rnd() * 0.3), 0.05, z + 0.2, 0.18, 0.12, 0.15, rnd() * 6)]);
    }
    // a few bushes along the cliff's top edge, kept off the trail's end
    for (let x = -12; x < 12; x += 0.7 + rnd() * 0.6) { if (Math.abs(x) < 1.2) continue; const r = 0.25 + rnd() * 0.25; bushes[1].push([new THREE.IcosahedronGeometry(1, 1), M4(x, r * 0.6, E + 0.45 + rnd() * 0.4, r, r * 0.8, r)]); }
    // trees: false leaves the tall forest to a painted plate (set.plate.follow) and keeps the bushes along the trail
    // the bend's boulder: a big mossy rock on the straight line, so the trail has a reason to swing round it, with
    // bushes and ferns round its foot; it hides the cliff edge until the rider is round it
    const R = rockAt(S.bend);
    if (R) {
      const geo = new THREE.IcosahedronGeometry(1, 3), P = geo.attributes.position, v = new THREE.Vector3(), rr = rng(41);
      const bumps = Array.from({ length: 11 }, () => [new THREE.Vector3(rr() - 0.5, rr() - 0.25, rr() - 0.5).normalize(), 0.18 + rr() * 0.22]);
      for (let i = 0; i < P.count; i++) {
        v.fromBufferAttribute(P, i); let k = 1; for (const [d, a] of bumps) k += a * Math.max(0, v.dot(d)) ** 3;
        k += 0.035 * Math.sin(v.x * 9 + v.y * 5) * Math.sin(v.z * 8 - v.y * 6) + 0.1 * Math.sin(v.x * 2.3 + v.z * 3.1 + 1) * Math.cos(v.y * 2.7 - v.z * 1.9);
        if (v.y > 0.45) v.y = 0.45 + (v.y - 0.45) * 0.45;   // a broad, flattish top, not a ball
        v.multiplyScalar(k); if (v.y < -0.35) v.y = -0.35 + (v.y + 0.35) * 0.2; P.setXYZ(i, v.x, v.y, v.z);
      }
      geo.computeVertexNormals();
      const rock = new THREE.Mesh(geo, lam("#ffffff", { map: rockTex(rnd, "#8e8574", 2, 2) })); rock.scale.set(R.r * 1.0, (S.bend.rockH ?? 1.1) * 0.8, R.r * 1.1); rock.position.set(R.x, 0.22, R.z); rock.rotation.y = 0.35; rock.castShadow = rock.receiveShadow = true; g.add(rock);
      for (let k = 0; k < 9; k++) { const a = (k / 9) * Math.PI * 2 + 0.3, x = R.x + Math.cos(a) * R.r * 1.02, z = R.z + Math.sin(a) * R.r * 0.92, r = 0.2 + rnd() * 0.18; if (Math.abs(x - bx(z)) < 0.75) continue; const li = k % 3; for (let j = 0; j < 2; j++) bushes[li].push([new THREE.IcosahedronGeometry(1, 1), M4(x + (j - 0.5) * r * 0.6, r * 0.7, z, r, r * 0.8, r)]); }
    }
    if (S.trees !== false) { g.add(merged(trunks, trunkM)); g.add(merged(firs, firM)); crowns.forEach((c, i) => c.length && g.add(merged(c, leaf[i]))); }
    if (S.leafy) { leafyBushes(g, bushes, S, rng((S.seed || 7) * 977)); groundDetail(g, S, rng((S.seed || 7) * 613), free); }   // leaves instead of smooth blobs (Jonny 31 Oct: "green clouds")
    else bushes.forEach((c, i) => c.length && g.add(merged(c, leaf[i])));
    if (rocks.length) g.add(merged(rocks, lam("#a8a296")));
  }
  return g;
}
