import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { rng } from "./util.js";

// "trail": the forest trail of The Easy Trail (friend comedies 24, 30 Oct 2026). A straight dirt trail runs along
// x 0 toward -z through a sunny forest on a plateau (y 0): an exposed root across it, then a gully crossed by one
// narrow plank, then the plateau ends at a cliff (z TRAIL.edge) over a forested valley far below, a lake and blue
// mountains all round. The trail is lined with bushes close by (they rush past the rider's view), tall leafy trees and
// firs further out. Everything the clip moves is a prop (props-trail.js); this is the still scenery.
// spec: { type: "trail", seed }
export const TRAIL = {
  edge: -8,                       // the cliff's top edge (z); the plateau is z > edge
  root: 3.8,                      // the root across the trail (z of its middle)
  gully: [-1.0, -3.4],            // the gully's two banks (z), its floor at gullyFloor
  gullyFloor: -1.6,
  plank: { z0: -0.5, z1: -3.9, w: 0.3, top: 0.06 },   // one narrow plank from bank to bank, its top surface at y top
  valley: -36,                    // the valley floor (y)
};

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
  const valley = flat(new THREE.Mesh(new THREE.PlaneGeometry(500, 500), lam("#ffffff", { map: valleyTex }))); valley.rotation.x = -Math.PI / 2; valley.position.set(0, T.valley, -60); g.add(valley);
  const lake = flat(new THREE.Mesh(new THREE.CircleGeometry(1, 48), lam("#5fb3e0", { emissive: new THREE.Color("#1f5a86") }))); lake.rotation.x = -Math.PI / 2; lake.scale.set(34, 20, 1); lake.position.set(-26, T.valley + 0.05, -70); g.add(lake);
  {
    const firs = [], firM = lam("#3b7d4c"), trunks = [];
    for (let i = 0; i < 260; i++) {
      const x = (rnd() - 0.5) * 140, z = E - 6 - rnd() * 70, s = 2.5 + rnd() * 3.5;
      if (Math.hypot((x + 26) / 34, (z + 70) / 20) < 1.1) continue;   // not in the lake
      firs.push([new THREE.ConeGeometry(0.42, 1, 8), M4(x, T.valley + s * 0.62, z, s, s * 1.3, s)]);
      trunks.push([new THREE.CylinderGeometry(0.06, 0.08, 1, 6), M4(x, T.valley + s * 0.12, z, s, s * 0.25, s)]);
    }
    g.add(merged(firs, firM, false)); g.add(merged(trunks, lam("#6b4a32"), false));
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
    const lip = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 140, 10, 1, false, 0, Math.PI), lam("#79b85a")); lip.rotation.z = Math.PI / 2; lip.position.set(0, -0.2, E + 0.2); lip.receiveShadow = true; g.add(lip);
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
    const m = flat(new THREE.Mesh(new THREE.PlaneGeometry(120, L), lam("#ffffff", { map: mt }))); m.rotation.x = -Math.PI / 2; m.position.set(0, 0, zc); g.add(m);
    const dt = dirtTex.clone(); dt.needsUpdate = true; dt.repeat.set(1, L / 2.2);
    const d = flat(new THREE.Mesh(new THREE.PlaneGeometry(1.7, L), lam("#ffffff", { map: dt, transparent: true }))); d.rotation.x = -Math.PI / 2; d.position.set(0, 0.004, zc); d.renderOrder = 1; g.add(d);
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
    const trunkM = lam("#ffffff", { map: trunkTex }), leaf = [lam("#5fae4c"), lam("#73c25a"), lam("#4c9a48")], firM = lam("#3e8b55");
    const trunks = [], crowns = [[], [], []], firs = [], bushes = [[], [], []], rocks = [];
    const free = (x, z, r) => Math.abs(x) > 1.05 + r && !(z < G0 + r + 0.2 && z > G1 - r - 0.2) && z > E + 0.6 + r;
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
      const x = side * (1.0 + rnd() * 0.9), r = 0.22 + rnd() * 0.25;
      if (!free(x, z, 0.05)) continue;
      const li = Math.floor(rnd() * 3);
      for (let k = 0; k < 3; k++) bushes[li].push([new THREE.IcosahedronGeometry(1, 1), M4(x + (k - 1) * r * 0.7, r * 0.7, z + (rnd() - 0.5) * r, r, r * 0.8, r)]);
      if (rnd() < 0.12) rocks.push([new THREE.DodecahedronGeometry(1, 0), M4(side * (0.95 + rnd() * 0.3), 0.05, z + 0.2, 0.18, 0.12, 0.15, rnd() * 6)]);
    }
    // a few bushes along the cliff's top edge, kept off the trail's end
    for (let x = -12; x < 12; x += 0.7 + rnd() * 0.6) { if (Math.abs(x) < 1.2) continue; const r = 0.25 + rnd() * 0.25; bushes[1].push([new THREE.IcosahedronGeometry(1, 1), M4(x, r * 0.6, E + 0.45 + rnd() * 0.4, r, r * 0.8, r)]); }
    g.add(merged(trunks, trunkM)); g.add(merged(firs, firM));
    crowns.forEach((c, i) => c.length && g.add(merged(c, leaf[i])));
    bushes.forEach((c, i) => c.length && g.add(merged(c, leaf[i])));
    if (rocks.length) g.add(merged(rocks, lam("#a8a296")));
  }
  return g;
}
