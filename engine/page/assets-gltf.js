import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { rng } from "./util.js";
import { TRAIL, trailFree } from "./set-trail.js";

// Real 3D models in the sets (asset pipeline 01, 31 Oct 2026; plan https://claude.ai/artifact/WQRu19tb1PZ6KdrUVycmne).
// Code-built scenery (spheres for bushes, boxes for rocks) reads as cheap next to Jonny's AI boards: the shapes lack
// an artist's hand. This loads glTF models made by artists (assets/models/nature: Quaternius' Stylized Nature MegaKit,
// CC0) or in Blender (tools/blender) and places them, restyled by the look like any other set mesh (looks.js convert:
// toon ramps, painted shadow edges, wind).
//
// storyboard set spec, all opt-in:
//   "models": [ { "src": "nature/Rock_Medium_1", "at": [x, z], "y": 0, "h": 0.8 (height in m), "rot": deg,
//                 "tilt": deg, "sink": 0.2 (share of the height under the ground), "tint": "#hex" } ]
//   "scatter": [ { "kinds": { "rock": 1, "fern": 2 } | ["rock", "fern"], "zone": [[x0, x1], [z0, z1]], "y": 0,
//                  "count": 40, "clumps": 8, "spread": 0.8, "h": [0.3, 1.4] (per kind if left out), "avoid": "trail" |
//                  "plank" | null, "seed": 3, "tint": "#hex" } ]
// Scatter copies nature (feedback-copy-nature): things grow in clumps with gaps between, many small and few big
// (sizes drawn from a power curve), the big one in the middle of its clump, random turns, rocks half buried and
// tipped, nothing on the trail. Each scatter has its own seed, so it never shifts the set's own random sequence.

// what each kind is, by model name: height range (m) when the storyboard gives none, wind, shadow, burial
const KINDS = {
  tree:     { re: /^(CommonTree|Pine)_/, h: [3.2, 6.5], wind: { amp: 0.035, h: 0, flutter: 1.4 }, leavesOnly: true, cast: true },
  bush:     { re: /^Bush_/, h: [0.45, 0.95], wind: { amp: 0.03, h: 0.6, flutter: 1.6 }, cast: true },
  fern:     { re: /^Fern_/, h: [0.3, 0.6], wind: { amp: 0.05, h: 0.4, flutter: 1.1 } },
  plant:    { re: /^Plant_/, h: [0.15, 0.5], wind: { amp: 0.04, h: 0.35, flutter: 1.3 } },
  grass:    { re: /^Grass_/, h: [0.14, 0.38], wind: { amp: 0.05, h: 0.3, flutter: 1.2 } },
  flower:   { re: /^Flower_/, h: [0.14, 0.3], wind: { amp: 0.045, h: 0.35, flutter: 1.5 } },
  clover:   { re: /^Clover_/, h: [0.08, 0.16], wind: { amp: 0.02, h: 0.15, flutter: 1.5 } },
  mushroom: { re: /^Mushroom_/, h: [0.05, 0.14] },
  // the kit's rocks are cool green-grey; the boards' rocks are warm sandstone grey with moss: a warm multiply
  rock:     { re: /^Rock_/, h: [0.25, 1.3], cast: true, sink: [0.15, 0.4], tilt: 12, tint: "#f4dcc0", tintAll: true, bright: 1.45 },
  pebble:   { re: /^Pebble_/, h: [0.02, 0.06], sink: [0.2, 0.5], tilt: 20, tint: "#f0dcc4", tintAll: true },
  path:     { re: /^RockPath_/, h: [0.02, 0.04], sink: [0.3, 0.5], tint: "#f0dcc4", tintAll: true },
};
// the models of each kind in the nature kit (scatter picks among them)
const KIT = {
  tree: ["CommonTree_1", "CommonTree_2", "CommonTree_3", "CommonTree_4", "CommonTree_5"],
  pine: ["Pine_1", "Pine_2", "Pine_3", "Pine_4", "Pine_5"],
  bush: ["Bush_Common", "Bush_Common", "Bush_Common_Flowers"],
  fern: ["Fern_1"],
  plant: ["Plant_1", "Plant_1_Big", "Plant_7", "Plant_7_Big"],
  grass: ["Grass_Common_Short", "Grass_Common_Tall", "Grass_Wispy_Short", "Grass_Wispy_Tall"],
  flower: ["Flower_3_Group", "Flower_3_Single", "Flower_4_Group", "Flower_4_Single"],
  clover: ["Clover_1", "Clover_2"],
  mushroom: ["Mushroom_Common", "Mushroom_Laetiporus"],
  rock: ["Rock_Medium_1", "Rock_Medium_2", "Rock_Medium_3"],
  pebble: ["Pebble_Round_1", "Pebble_Round_2", "Pebble_Round_3", "Pebble_Round_4", "Pebble_Round_5", "Pebble_Square_1", "Pebble_Square_2", "Pebble_Square_3", "Pebble_Square_4", "Pebble_Square_5", "Pebble_Square_6"],
  path: ["RockPath_Round_Small_1", "RockPath_Round_Small_2", "RockPath_Round_Small_3", "RockPath_Square_Small_1", "RockPath_Square_Small_2", "RockPath_Square_Small_3"],
};
const kitSrc = (k) => (KIT[k] || [k]).map((n) => (n.includes("/") ? n : `nature/${n}`));
const kindOf = (src) => { const n = src.split("/").pop(); for (const [k, v] of Object.entries(KINDS)) if (v.re.test(n)) return { name: k, ...v }; return { name: "other", h: [1, 1] }; };

const CACHE = new Map();   // src -> { scene, box } (the loaded model, its bounding box)
function srcsOf(set) {
  const out = new Set();
  for (const m of set?.models || []) out.add(m.src);
  for (const s of set?.scatter || []) for (const k of Array.isArray(s.kinds) ? s.kinds : Object.keys(s.kinds || {})) for (const src of kitSrc(k)) out.add(src);
  return [...out];
}
// models a character's costume names: any "...Model" key in its definition (costume.cloakModel:
// "characters/reaper-cloak.glb", made by tools/blender/reaper-cloak.py)
function charSrcs(chars) {
  const out = new Set(), walk = (o) => { if (!o || typeof o !== "object") return; for (const [k, v] of Object.entries(o)) { if (/Model$/.test(k) && typeof v === "string") out.add(v); else walk(v); } };
  for (const def of Object.values(chars || {})) walk(def);
  return [...out];
}
// loads every model the set and the cast name before anything is built (stage.js init), so buildSet and the costumes
// stay synchronous and the look converts the models' materials with everything else
export async function preloadModels(sb, chars = null) {
  const loader = new GLTFLoader();
  const propSrcs = (sb.props || []).map((p) => p.model).filter(Boolean);   // props drawn from a model (props3d.js bike spec.model)
  await Promise.all([...new Set([...srcsOf(sb.set), ...charSrcs(chars), ...propSrcs])].filter((s) => !CACHE.has(s)).map(async (src) => {
    const url = `/assets/models/${src}${/\.(glb|gltf)$/.test(src) ? "" : ".gltf"}`;
    const gl = await loader.loadAsync(url);
    const scene = gl.scene; scene.updateMatrixWorld(true);
    CACHE.set(src, { scene, box: new THREE.Box3().setFromObject(scene) });
  }));
}

// a costume model as it was made (already in the character's bodyGroup space: metres, y = 0 the ground, front +z):
// a fresh copy with its own materials; material names say how the look shades them ("cloak" -> cloth, "lining")
const ROLES = { cloak: "cloth", cloth: "cloth", trim: "cloth", lining: "lining", leather: "wood", metal: "char", rubber: "char", cable: "char", frame: "char" };
// o.colors: { materialName: "#hex" } recolours a part (a bike's "frame" in the bike's own colour)
export function modelClone(src, o = {}) {
  const c = CACHE.get(src); if (!c) throw new Error(`model not preloaded: ${src} (name it in a "...Model" costume key)`);
  const g = c.scene.clone(true); g.name = `model-${src.split("/").pop()}`;
  g.traverse((m) => {
    if (!m.isMesh) return;
    m.castShadow = m.receiveShadow = true;
    m.material = m.material.clone(); m.material.side = THREE.DoubleSide;
    const name = (m.material.name || "").toLowerCase(), role = ROLES[name]; if (role) m.material.userData.lookRole = role;
    if (o.colors && o.colors[name]) m.material.color.set(o.colors[name]);
  });
  return g;
}

// one placed copy: scaled to height h, its base on the ground (minus the buried share), turned and tipped
function place(src, o, kind, tint) {
  const c = CACHE.get(src); if (!c) throw new Error(`model not preloaded: ${src}`);
  const size = c.box.getSize(new THREE.Vector3()), k = o.h / Math.max(1e-6, size.y);
  const inner = c.scene.clone(true);
  inner.position.set(-(c.box.min.x + c.box.max.x) / 2 * k, -c.box.min.y * k, -(c.box.min.z + c.box.max.z) / 2 * k); inner.scale.setScalar(k);
  const g = new THREE.Group(); g.add(inner); g.name = `model-${src.split("/").pop()}`;
  g.position.set(o.x, (o.y || 0) - (o.sink || 0) * o.h, o.z);
  g.rotation.set(((o.tiltX || 0) * Math.PI) / 180, ((o.rot || 0) * Math.PI) / 180, ((o.tiltZ || 0) * Math.PI) / 180, "YXZ");
  inner.traverse((m) => {
    if (!m.isMesh) return;
    m.castShadow = !!kind.cast; m.receiveShadow = true;
    m.material = m.material.clone();   // per copy: tints and wind flags never leak into the cached original
    const leafy = m.material.alphaTest > 0 || /leaf|leaves|grass|flower/i.test(m.material.name);
    if (kind.wind && (!kind.leavesOnly || leafy)) m.material.userData.wind = kind.wind;
    if (kind.tint && (leafy || kind.tintAll)) m.material.color.multiply(new THREE.Color(kind.tint)).multiplyScalar(kind.bright || 1);
    if (tint && (leafy || kind.tintAll)) m.material.color.multiply(new THREE.Color(tint));
    if (o.shade && (leafy || kind.tintAll)) m.material.color.multiplyScalar(o.shade);   // no two bushes quite the same green
    if (leafy) m.material.userData.noShine = true;
    m.material.side = THREE.DoubleSide;
  });
  return g;
}

function freeFn(spec, set) {
  if (spec.avoid === null || spec.avoid === false) return () => true;
  if (spec.avoid === "plank") { const P = TRAIL.plank; return (x, z, r) => Math.abs(x) > P.w / 2 + 0.12 + r || z > P.z0 + r || z < P.z1 - r; }
  if (set?.type === "trail") return trailFree(set);
  return () => true;
}

export function addModels(scene, set) {
  if (!set?.models && !set?.scatter) return null;
  const root = new THREE.Group(); root.name = "set-models"; scene.add(root);
  for (const m of set.models || []) {
    const kind = kindOf(m.src), r = rng(Math.round((m.at[0] * 131 + m.at[1] * 71) * 1000) || 1);
    root.add(place(m.src, { x: m.at[0], z: m.at[1], y: m.y, h: m.h ?? kind.h[1], rot: m.rot ?? r() * 360, tiltX: m.tilt ?? 0, sink: m.sink ?? (kind.sink ? kind.sink[0] : 0) }, kind, m.tint));
  }
  (set.scatter || []).forEach((s, si) => scatter(root, s, set, si));
  return root;
}

function scatter(root, s, set, si) {
  const rnd = rng(((s.seed ?? 1) * 7919 + si * 104729) >>> 0);
  const kinds = Array.isArray(s.kinds) ? Object.fromEntries(s.kinds.map((k) => [k, 1])) : s.kinds;
  const names = Object.keys(kinds), total = names.reduce((a, k) => a + kinds[k], 0);
  const pickKind = () => { let u = rnd() * total; for (const k of names) { u -= kinds[k]; if (u <= 0) return k; } return names[names.length - 1]; };
  const [[x0, x1], [z0, z1]] = s.zone, free = freeFn(s, set), count = s.count ?? 20, spread = s.spread ?? 0.8;
  // clump centres: uneven, with gaps (a centre too close to another is dropped), each with its own weight
  const centres = [];
  for (let i = 0, n = s.clumps ?? Math.max(1, Math.ceil(count / 6)); i < n * 6 && centres.length < n; i++) {
    const x = x0 + rnd() * (x1 - x0), z = z0 + rnd() * (z1 - z0);
    if (!free(x, z, 0.1) || centres.some((c) => Math.hypot(c.x - x, c.z - z) < spread * 1.2)) continue;
    centres.push({ x, z, w: 0.3 + rnd() ** 2 * 1.7 });
  }
  if (!centres.length) return;
  const wsum = centres.reduce((a, c) => a + c.w, 0), solids = [];
  for (let i = 0, made = 0; made < count && i < count * 12; i++) {
    let u = rnd() * wsum, c = centres[0]; for (const cc of centres) { u -= cc.w; if (u <= 0) { c = cc; break; } }
    // a gaussian step from the centre (Box-Muller): most near the middle, a few strays
    const d = Math.sqrt(-2 * Math.log(Math.max(1e-6, rnd()))) * spread * 0.5, a = rnd() * Math.PI * 2;
    const x = c.x + Math.cos(a) * d, z = c.z + Math.sin(a) * d;
    if (x < x0 || x > x1 || z < z0 || z > z1) continue;
    const kn = pickKind(), list = kitSrc(kn), src = list[Math.floor(rnd() * list.length)], kind = kindOf(src);
    const [h0, h1] = s.h || kind.h, near = Math.max(0, 1 - d / (spread * 1.5));
    const h = h0 + (h1 - h0) * rnd() ** 2.6 * (0.45 + 0.55 * near);   // power curve: many small, few big, big ones in the middle
    const cdat = CACHE.get(src), sz = cdat.box.getSize(new THREE.Vector3()), fr = (Math.max(sz.x, sz.z) / sz.y) * h * 0.5 * (kind.cast ? 0.8 : 0.3);
    if (!free(x, z, fr)) continue;
    if (kind.cast && solids.some((o) => Math.hypot(o.x - x, o.z - z) < (o.r + fr) * 0.75)) continue;   // big things don't grow through each other
    if (kind.cast) solids.push({ x, z, r: fr });
    const sink = kind.sink ? kind.sink[0] + rnd() * (kind.sink[1] - kind.sink[0]) : 0, tilt = kind.tilt || 0;
    root.add(place(src, { x, z, y: s.y ?? 0, h, rot: rnd() * 360, tiltX: (rnd() - 0.5) * 2 * tilt, tiltZ: (rnd() - 0.5) * 2 * tilt, sink, shade: 0.86 + rnd() * 0.24 }, kind, s.tint));
    made++;
  }
}
