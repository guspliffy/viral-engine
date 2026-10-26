import * as THREE from "three";
import { rng } from "./util.js";
import { canvas, tex } from "./set-porch.js";

// "elevator": a smart hotel lift and the hallway outside it, for Fart in the Elevator (Jonny's storyboard, 26 Oct
// 2026). Inside: warm brushed-steel walls in panels with dark teal pilasters, a brass handrail round three sides, a
// polished stone floor and a lit ceiling. The floor sign is a prop (props-elevator.js "floorsign"), and so are the
// sliding doors ("elevdoors"), so their numbers and opening can be timed.
// The car has no front wall while the camera looks in from outside (the classic cut-away): the camera stands where
// the hallway would be. When the camera is inside the car (z < ELEVATOR.gateZ), the front wall with its door opening
// and the hallway beyond appear instead: a warm corridor with sconces, plants and a painting, where someone waits.
// Each piece says which side it belongs to in userData.camGate (stage.js shows it only when the camera is on that side).
// spec: { type: "elevator", seed }.
export const ELEVATOR = { halfW: 2.05, backZ: -1.6, frontZ: 1.25, gateZ: 1.2, H: 3.4, rail: 0.72, door: { halfW: 0.62, h: 2.05 }, hallEnd: 7.5, hallHalfW: 1.7 };

const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...o });
const basic = (o) => { const m = new THREE.MeshBasicMaterial({ fog: false, ...o }); m.userData.noOutline = true; return m; };
function box(parent, w, h, d, m, x, y, z, cast = false) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = cast; b.receiveShadow = true; parent.add(b); return b; }
const flat = (o) => { o.material.userData.noOutline = true; o.receiveShadow = true; return o; };
const inside = (cam) => cam.z < ELEVATOR.gateZ, outside = (cam) => cam.z >= ELEVATOR.gateZ;

// warm brushed steel in tall panels: fine vertical streaks, a darker seam between panels, a dark teal pilaster at
// every third seam (the storyboard's teal strips)
function steelTex(rnd, w, h, panel = 0.9) {
  const W = 512, H = 1024, [c, g] = canvas(W, H), px = (W / w) * panel;
  g.fillStyle = "#b9ae9f"; g.fillRect(0, 0, W, H);
  // a faint diagonal sheen across the whole wall, the brushing, and dark seams round each panel
  const sh = g.createLinearGradient(0, H, W, 0); sh.addColorStop(0, "rgba(255,250,240,0)"); sh.addColorStop(0.5, "rgba(255,250,240,0.07)"); sh.addColorStop(1, "rgba(255,250,240,0)");
  g.fillStyle = sh; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 160; i++) { const x = rnd() * W, a = 0.01 + rnd() * 0.015; g.fillStyle = rnd() < 0.5 ? `rgba(255,248,236,${a})` : `rgba(70,60,50,${a})`; g.fillRect(x, 0, 1, H); }
  g.fillStyle = "rgba(60,48,38,0.5)";
  for (let x = 0; x < W + 1; x += px) g.fillRect(x - 1.5, 0, 3, H);
  g.fillRect(0, H * (1 - 1.15 / h), W, 3);   // a seam just above the handrail
  return tex(c);
}

// polished stone floor: big warm grey tiles with a faint veining and thin grout
function stoneTex(rnd, base = "#cfc6b8", vein = "rgba(120,108,96,0.18)") {
  const S = 512, [c, g] = canvas(S, S), n = 4, tw = S / n;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const v = 0.96 + rnd() * 0.06, col = new THREE.Color(base).multiplyScalar(v);
    g.fillStyle = `#${col.getHexString()}`; g.fillRect(i * tw, j * tw, tw, tw);
    g.strokeStyle = vein; g.lineWidth = 1.2;
    for (let k = 0; k < 3; k++) { g.beginPath(); let x = i * tw + rnd() * tw, y = j * tw; g.moveTo(x, y); for (let s = 0; s < 6; s++) { x += (rnd() - 0.5) * 30; y += tw / 6; g.lineTo(x, y); } g.stroke(); }
  }
  g.fillStyle = "rgba(90,78,66,0.35)"; for (let i = 0; i <= n; i++) { g.fillRect(i * tw - 1, 0, 2, S); g.fillRect(0, i * tw - 1, S, 2); }
  return tex(c, 2, 2);
}

// the hallway wallpaper: warm cream with a quiet damask stripe
function paperTex(rnd) {
  const [c, g] = canvas(256, 256);
  g.fillStyle = "#e9d3b0"; g.fillRect(0, 0, 256, 256);
  for (let x = 0; x < 256; x += 32) { g.fillStyle = "rgba(196,160,112,0.22)"; g.fillRect(x, 0, 10, 256); }
  g.fillStyle = "rgba(255,246,226,0.25)"; for (let i = 0; i < 40; i++) { g.beginPath(); g.ellipse(16 + Math.floor(rnd() * 8) * 32, rnd() * 256, 5, 9, 0, 0, Math.PI * 2); g.fill(); }
  return tex(c, 4, 2);
}

// a framed painting of soft green hills (hallway)
function paintingTex() {
  const [c, g] = canvas(256, 180);
  const sky = g.createLinearGradient(0, 0, 0, 180); sky.addColorStop(0, "#9cc7e6"); sky.addColorStop(1, "#f3e3c4"); g.fillStyle = sky; g.fillRect(0, 0, 256, 180);
  for (const [y, col] of [[110, "#8fb87a"], [130, "#6f9e5e"], [152, "#5d8a4e"]]) { g.fillStyle = col; g.beginPath(); g.moveTo(0, 180); for (let x = 0; x <= 256; x += 16) g.lineTo(x, y - 18 * Math.sin(x / 40 + y)); g.lineTo(256, 180); g.fill(); }
  return tex(c);
}

// a wall sconce: a brass back plate, a cream glass shade that glows warm, and a soft halo on the wall behind it
function sconce(parent, x, y, z, facing) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = facing; parent.add(g);
  box(g, 0.1, 0.22, 0.02, std("#b8893a", { metalness: 0.6, roughness: 0.35 }), 0, 0, 0.01);
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.11, 0.16, 20, 1, true), basic({ color: "#fff1cf", side: THREE.DoubleSide })); shade.position.set(0, 0.06, 0.12); g.add(shade);
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color("#ffd28a") } },
    vertexShader: "varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: "uniform vec3 uColor; varying vec2 vUv; void main() { float r = length(vUv - 0.5) * 2.0; gl_FragColor = vec4(uColor * 0.42 * pow(1.0 - smoothstep(0.0, 1.0, r), 1.6), 1.0); }",
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  halo.material.userData.outlineParameters = { visible: false }; halo.position.set(0, 0.08, 0.025); g.add(halo);
  return g;
}

function plant(parent, rnd, x, z, h) {
  const g = new THREE.Group(); g.position.set(x, 0, z); parent.add(g);
  const p = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.4, 20), std("#3e5f5a", { roughness: 0.5 })); p.position.y = 0.2; p.receiveShadow = true; g.add(p);
  const greens = ["#4f8a46", "#67a457", "#3f7a3a"].map((c) => std(c, { roughness: 0.7 }));
  for (let i = 0; i < 13; i++) {
    const a = (i / 13) * Math.PI * 2 + rnd() * 0.4, tilt = 0.3 + rnd() * 0.55, L = h * (0.5 + rnd() * 0.4);
    const stem = new THREE.Group(); stem.position.y = 0.38; stem.rotation.set(Math.sin(a) * tilt, 0, -Math.cos(a) * tilt); g.add(stem);
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 8), greens[i % 3]); leaf.scale.set(0.6, L / 0.18, 0.22); leaf.position.y = L / 2; stem.add(leaf);
  }
  return g;
}

export function buildElevator(scene, S = {}) {
  const rnd = rng((S.seed || 3) * 613), root = new THREE.Group(); scene.add(root);
  const E = ELEVATOR, hw = E.halfW, depth = E.frontZ - E.backZ, cz = (E.frontZ + E.backZ) / 2;
  scene.background = new THREE.Color("#2b2522");
  scene.fog = new THREE.Fog("#2b2522", 18, 40);
  const car = new THREE.Group(), outs = new THREE.Group(), ins = new THREE.Group();
  outs.userData.camGate = outside; ins.userData.camGate = inside;
  root.add(car, outs, ins);

  // ---------------------------------------------------------------- the car
  const floorM = std("#ffffff", { map: stoneTex(rnd), roughness: 0.4 });
  const floor = flat(new THREE.Mesh(new THREE.PlaneGeometry(hw * 2, depth), floorM)); floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, cz); floor.name = "set-floor-car"; car.add(floor);
  const steelBack = std("#ffffff", { map: steelTex(rnd, hw * 2, E.H), roughness: 0.45, metalness: 0.15 });
  const steelSide = std("#ffffff", { map: steelTex(rnd, depth + 2, E.H), roughness: 0.45, metalness: 0.15 });
  const back = flat(new THREE.Mesh(new THREE.PlaneGeometry(hw * 2, E.H), steelBack)); back.position.set(0, E.H / 2, E.backZ); car.add(back);
  // side walls run on past the front while the camera is outside, so a wide shot never sees past the car
  for (const s of [-1, 1]) {
    const w = flat(new THREE.Mesh(new THREE.PlaneGeometry(depth, E.H), steelSide)); w.rotation.y = -s * Math.PI / 2; w.position.set(s * hw, E.H / 2, cz); car.add(w);
    const ext = flat(new THREE.Mesh(new THREE.PlaneGeometry(6, E.H), steelSide)); ext.rotation.y = -s * Math.PI / 2; ext.position.set(s * hw, E.H / 2, E.frontZ + 3); outs.add(ext);
  }
  const floorExt = flat(new THREE.Mesh(new THREE.PlaneGeometry(hw * 2, 8), floorM)); floorExt.rotation.x = -Math.PI / 2; floorExt.position.set(0, 0, E.frontZ + 4); outs.add(floorExt);
  // the dark teal pilasters at the back corners and either side of the middle, and a teal skirting all round
  const teal = std("#24494a", { roughness: 0.5, metalness: 0.2 });
  for (const x of [-hw + 0.06, -0.62, 0.62, hw - 0.06]) box(car, 0.12, E.H, 0.03, teal, x, E.H / 2, E.backZ + 0.015);
  for (const s of [-1, 1]) for (const z of [E.backZ + 0.06, E.frontZ - 0.06]) box(car, 0.03, E.H, 0.12, teal, s * (hw - 0.015), E.H / 2, z);
  box(car, hw * 2, 0.1, 0.03, teal, 0, 0.05, E.backZ + 0.02);
  for (const s of [-1, 1]) box(car, 0.03, 0.1, depth, teal, s * (hw - 0.02), 0.05, cz);
  // the brass handrail: back and both sides, on short brackets
  const brass = std("#c99a3e", { metalness: 0.75, roughness: 0.3 });
  const rail = (len, x, z, rotY) => { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, len, 16), brass); r.rotation.set(0, rotY, Math.PI / 2); r.position.set(x, E.rail, z); r.castShadow = false; r.receiveShadow = true; car.add(r); return r; };
  rail(hw * 2 - 0.3, 0, E.backZ + 0.09, 0);
  for (const s of [-1, 1]) rail(depth - 0.5, s * (hw - 0.09), cz - 0.1, Math.PI / 2);
  for (const x of [-hw + 0.35, 0, hw - 0.35]) box(car, 0.03, 0.03, 0.08, brass, x, E.rail, E.backZ + 0.045);
  for (const s of [-1, 1]) for (const z of [E.backZ + 0.4, E.frontZ - 0.5]) box(car, 0.08, 0.03, 0.03, brass, s * (hw - 0.045), E.rail, z);
  // the ceiling: cream panels round a big warm light panel
  const ceil = flat(new THREE.Mesh(new THREE.PlaneGeometry(hw * 2, depth + 6), std("#e8dfcf"))); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, E.H, cz + 3); car.add(ceil);
  for (const x of [-1.1, 0, 1.1]) for (const z of [cz - 0.6, cz + 0.6]) {
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.09, 0.115, 28), std("#c99a3e", { metalness: 0.7, roughness: 0.3, side: THREE.DoubleSide })); ring.rotation.x = Math.PI / 2; ring.position.set(x, E.H - 0.006, z); car.add(ring);
    const l = new THREE.Mesh(new THREE.CircleGeometry(0.09, 28), basic({ color: "#fff3d6", side: THREE.DoubleSide })); l.rotation.x = Math.PI / 2; l.position.set(x, E.H - 0.008, z); car.add(l);
  }

  // ---------------------------------------------------------------- inside only: the front wall round the doors
  const D = E.door, fz = E.frontZ - 0.03;
  const sh = new THREE.Shape(); sh.moveTo(-hw, 0); sh.lineTo(hw, 0); sh.lineTo(hw, E.H); sh.lineTo(-hw, E.H); sh.lineTo(-hw, 0);
  const hole = new THREE.Path(); hole.moveTo(-D.halfW, 0); hole.lineTo(-D.halfW, D.h); hole.lineTo(D.halfW, D.h); hole.lineTo(D.halfW, 0); hole.lineTo(-D.halfW, 0); sh.holes.push(hole);
  const frontM = std("#ffffff", { map: steelTex(rnd, hw * 2, E.H), roughness: 0.45, metalness: 0.15, side: THREE.DoubleSide });
  const front = flat(new THREE.Mesh(new THREE.ShapeGeometry(sh), frontM)); front.position.z = fz; front.rotation.y = Math.PI; ins.add(front);
  // the door frame: brass jambs and header, a steel sill with a groove
  box(ins, 0.06, D.h + 0.06, 0.08, brass, -D.halfW - 0.03, (D.h + 0.06) / 2, fz - 0.02);
  box(ins, 0.06, D.h + 0.06, 0.08, brass, D.halfW + 0.03, (D.h + 0.06) / 2, fz - 0.02);
  box(ins, D.halfW * 2 + 0.12, 0.06, 0.08, brass, 0, D.h + 0.03, fz - 0.02);
  box(ins, D.halfW * 2, 0.012, 0.16, std("#9b9590", { metalness: 0.5, roughness: 0.4 }), 0, 0.006, E.frontZ + 0.02);
  for (const x of [-hw + 0.06, hw - 0.06]) box(ins, 0.12, E.H, 0.03, teal, x, E.H / 2, fz - 0.015);
  box(ins, hw * 2, 0.1, 0.03, teal, 0, 0.05, fz - 0.02);
  // the call buttons beside the door
  const panel = box(ins, 0.14, 0.36, 0.02, std("#3a3532", { roughness: 0.4 }), D.halfW + 0.3, 1.0, fz - 0.015);
  for (let i = 0; i < 4; i++) { const b = new THREE.Mesh(new THREE.CircleGeometry(0.022, 16), basic({ color: i === 1 ? "#ffd68a" : "#d8d2c8" })); b.position.set(0, 0.12 - i * 0.08, -0.012); b.rotation.y = Math.PI; panel.add(b); }

  // ---------------------------------------------------------------- inside only: the hallway beyond the doors
  const hall = new THREE.Group(); ins.add(hall);
  const hz0 = E.frontZ + 0.05, hz1 = E.hallEnd, hh = E.hallHalfW, hc = (hz0 + hz1) / 2, hL = hz1 - hz0;
  const hallFloor = flat(new THREE.Mesh(new THREE.PlaneGeometry(8, hL + 1), std("#ffffff", { map: stoneTex(rnd, "#e6dccb", "rgba(150,130,110,0.16)"), roughness: 0.35 })));
  hallFloor.rotation.x = -Math.PI / 2; hallFloor.position.set(0, -0.002, hc + 0.4); hall.add(hallFloor);
  // a long runner rug down the middle
  const rug = flat(new THREE.Mesh(new THREE.PlaneGeometry(1.1, hL - 0.6), std("#7d2f2f", { roughness: 0.95 }))); rug.rotation.x = -Math.PI / 2; rug.position.set(0, 0.003, hc + 0.5); hall.add(rug);
  const rugEdge = std("#c9a24f", { roughness: 0.8 });
  for (const s of [-1, 1]) { const e = flat(new THREE.Mesh(new THREE.PlaneGeometry(0.05, hL - 0.6), rugEdge)); e.rotation.x = -Math.PI / 2; e.position.set(s * 0.5, 0.004, hc + 0.5); hall.add(e); }
  const paperM = std("#ffffff", { map: paperTex(rnd) }), wains = std("#7a5434", { roughness: 0.6 }), trimM = std("#f4ead8", { roughness: 0.5 });
  const endWall = flat(new THREE.Mesh(new THREE.PlaneGeometry(hh * 2 + 0.2, 3.2), paperM)); endWall.position.set(0, 1.6, hz1); endWall.rotation.y = Math.PI; hall.add(endWall);
  box(hall, hh * 2, 0.9, 0.04, wains, 0, 0.45, hz1 - 0.02);
  for (const s of [-1, 1]) {
    const w = flat(new THREE.Mesh(new THREE.PlaneGeometry(hL, 3.2), paperM)); w.rotation.y = -s * Math.PI / 2; w.position.set(s * hh, 1.6, hc); hall.add(w);
    box(hall, 0.04, 0.9, hL, wains, s * (hh - 0.02), 0.45, hc);
    box(hall, 0.05, 0.05, hL, trimM, s * (hh - 0.025), 0.92, hc);
    // sconces down both walls, a plant and a door at the far end of each side
    for (const z of [hz0 + 1.2, hz0 + 3.6]) sconce(hall, s * (hh - 0.01), 1.75, z, -s * Math.PI / 2);
    plant(hall, rnd, s * (hh - 0.38), hz1 - 0.5, 0.75);
  }
  const hallCeil = flat(new THREE.Mesh(new THREE.PlaneGeometry(hh * 2 + 0.2, hL + 1), std("#efe4d0"))); hallCeil.rotation.x = Math.PI / 2; hallCeil.position.set(0, 3.1, hc); hall.add(hallCeil);
  // the painting on the end wall, in a gilt frame
  box(hall, 0.86, 0.64, 0.04, std("#b8893a", { metalness: 0.5, roughness: 0.4 }), 0, 1.75, hz1 - 0.03);
  const pt = new THREE.Mesh(new THREE.PlaneGeometry(0.74, 0.52), basic({ map: paintingTex() })); pt.position.set(0, 1.75, hz1 - 0.055); pt.rotation.y = Math.PI; hall.add(pt);
  // a warm glow pooled down the corridor
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(hh * 2, hL), new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color("#ffcf8f") } },
    vertexShader: "varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: "uniform vec3 uColor; varying vec2 vUv; void main() { float r = abs(vUv.x - 0.5) * 2.0; gl_FragColor = vec4(uColor * 0.16 * (1.0 - smoothstep(0.2, 1.0, r)), 1.0); }",
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2,
  }));
  pool.material.userData.outlineParameters = { visible: false }; pool.rotation.x = -Math.PI / 2; pool.position.set(0, 0.006, hc); hall.add(pool);
  return root;
}
