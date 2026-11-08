import * as THREE from "three";
import { lifeRng, gustAt, leaveTime, GUST_MAX } from "../shared/life.js";
import { envCamera } from "./set-env.js";

// The living world (set "life", opt-in, 7 Nov 2026; research and plan in
// /mnt/project-files/research/living-worlds-2026-11-07): the painted set breathes and answers the cast.
//
//   "set": { "type": "env", "env": "meadow-path", "life": {
//       "seed": 11,
//       "wind": { "speed": 3.2, "every": [2.6, 5], "strength": [0.7, 1.2], "calm": 0.4 } | false,
//       "clouds": { "drift": 0.0035, "shadow": 0.3, "speed": 4, "scale": 16, "near": 14 } | false,
//       "birds": [ { "at": [x, y, z], "yaw": 20 } | { "perch": [u, v], "card": "mid-3" } | { "flock": { "n": 5, "at": [x, z], "r": 0.6 } } ],
//       "butterflies": { "n": 3, "at": [[x, y, z], ...], "r": 0.5, "color": "#f2a33a" },
//       "leaves": { "from": [[x, y, z], ...], "n": 4, "color": "#9bbf4a" },
//       "startle": [ { "t": 5.1, "at": [x, z], "loud": 1 } ],   // a loud sound: birds within 6 m * loud leave
//       "song": 1 } }                                           // birdsong in the bed (engine/audio.mjs)
//
// One wind drives everything (engine/shared/life.js gustAt): travelling gust bands bend the painted grass and leaves
// harder and show their paler sides as they pass, shake leaves loose from the trees, push the butterflies, and are
// heard in the bed at the moment they cross the frame. The cloud shadows slide over the far hills with the same
// wind, and the sky drifts with them. Everything is a function of the frame time (__setTicks), stepped with the
// drawn look (stage.js onTwos), so renders stay deterministic and shardable.

const now = { t: 0 };
let S = null;

// the shared uniforms of every painted layer
const U = { uLifeT: { value: 0 }, uGust: { value: Array.from({ length: GUST_MAX }, () => new THREE.Vector4(0, 0, 1, 0)) }, uGustN: { value: 0 },
  uWind: { value: new THREE.Vector2(3.2, 0.4) }, uCloud: { value: new THREE.Vector4(4, 16, 0.3, 14) },
  uBend: { value: new THREE.Vector2(0, 6) }, uGrade: { value: new THREE.Vector4(1, 1, 1, 1) }, uDrift: { value: 0 } };

export function initLife(spec) {
  S = spec;
  if (!S) return;
  const g = S.wind.gusts;
  g.forEach((G, i) => U.uGust.value[i].set(G.tc, G.s, G.w, G.ph));
  U.uGustN.value = g.length;
  U.uWind.value.set(S.wind.speed, S.wind.calm);
  const C = S.clouds;
  U.uCloud.value.set(C?.speed ?? 0, C?.scale ?? 16, C ? C.shadow : 0, C?.near ?? 14);
  U.uBend.value.set(S.bend || 0, 6);
  if (S.grade) U.uGrade.value.set(...S.grade.mul, S.grade.sat ?? 1);
  (globalThis.__setTicks ||= []).push((t) => { now.t = t; U.uLifeT.value = t; U.uDrift.value = (S.clouds?.drift ?? 0) * t; });
}

const DECL = `uniform float uDrift; uniform float uLifeT; uniform vec4 uGust[${GUST_MAX}]; uniform int uGustN; uniform vec2 uWind; uniform vec4 uCloud; uniform vec2 uBend; uniform vec4 uGrade;`;
// the trees and tall grass bend from their foot: a lean that follows the gust plus the trunk's own slow rocking
// (0.2-1.1 Hz, Jackson 2019), growing with the square of the height, so the ground and the feet never move
const BEND = /* glsl */`
  vec3 lw = (modelMatrix * vec4(transformed, 1.0)).xyz;
  float bg = lifeGust(lw), hh = clamp(lw.y / uBend.y, 0.0, 1.6);
  float rock = sin(uLifeT * 2.3 + lw.x * 0.6) * 0.6 + sin(uLifeT * 3.9 + lw.x * 1.4 + 1.3) * 0.25;
  transformed.x += uBend.x * hh * hh * (max(0.0, bg - 0.3) * 0.8 + rock * bg * 0.45);`;
const NOISE = /* glsl */`
  float lifeH(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float lifeVN(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(lifeH(i), lifeH(i + vec2(1.0, 0.0)), f.x), mix(lifeH(i + vec2(0.0, 1.0)), lifeH(i + vec2(1.0, 1.0)), f.x), f.y); }
  float lifeFbm(vec2 p) { return 0.55 * lifeVN(p) + 0.3 * lifeVN(p * 2.07 + 3.1) + 0.15 * lifeVN(p * 4.3 + 7.7); }
  float lifeGust(vec3 w) {
    float g = uWind.y;
    for (int i = 0; i < ${GUST_MAX}; i++) { if (i >= uGustN) break; vec4 G = uGust[i];
      float front = uWind.x * (uLifeT - G.x) + sin(w.z * 0.33 + G.w) * 1.1; float d = (w.x - front) / G.z; g += G.y * exp(-d * d); }
    return g; }`;

// a painted layer of the env set (set-env.js), in place of set-plate.js animate(): the same leaf and grass motion
// (motion mask red = sways, green = sun patches that shimmer), but its strength follows the gusts, a gust leans the
// leaves downwind and lightens them a touch (the paler undersides), and far layers take the cloud shadows.
// o.life: the card's life mask (engine/plates/env_life.py): R the true sky, which drifts with the clouds (only the
// sky, never the far lake or mountains painted into the sky card), G painted foliage on a card without a motion mask
// of its own (far woods and hills), which sways with the gusts, harder in a storm, but never bends the card
export function lifeLayer(mat, motion, width, o = {}) {
  if (!S) return false;
  const far = !motion && !!o.life;
  if (far) motion = o.life;
  const drift = !!(o.sky && o.life && S.clouds?.drift);
  const ch = far ? "g" : "r";
  const amp = (far ? (S.storm ? 2.2 : 1.2) * (o.amp ?? 3) / 3 : o.amp ?? 3).toFixed(2), shadows = !!S.clouds && !o.sky, bend = !!motion && !far && S.bend > 0, grade = !!S.grade;
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U, { uMotion: { value: motion }, uPx: { value: 1 / width } });
    sh.vertexShader = `varying vec3 vLifeW; ${DECL}\n${NOISE}\n` + sh.vertexShader
      .replace("#include <begin_vertex>", `#include <begin_vertex>${bend ? BEND : ""}`)
      .replace("#include <project_vertex>", "#include <project_vertex>\n  vLifeW = (modelMatrix * vec4(transformed, 1.0)).xyz;");
    sh.fragmentShader = `varying vec3 vLifeW; ${DECL}
      uniform sampler2D uMotion; uniform float uPx;\n${NOISE}\n` + sh.fragmentShader.replace("#include <map_fragment>", /* glsl */`
      float g = lifeGust(vLifeW), gx = max(0.0, g - uWind.y);
      ${motion ? /* glsl */`
      vec4 mo = texture2D(uMotion, vMapUv);
      float ph = vMapUv.x * 23.0 + vMapUv.y * 11.0;
      float k = 0.35 + 0.85 * g;                                    // calm air: a slow breathing sway; a gust: much more
      vec2 sway = vec2(sin(uLifeT * 1.3 + ph) * 0.7 + sin(uLifeT * 3.7 + ph * 2.1) * 0.3 + sin(uLifeT * 5.3 + ph * 3.7) * 0.35 * gx,
                       sin(uLifeT * 1.9 + ph * 1.3) * 0.35) * k;
      sway.x -= gx * 0.9;                                           // leaning downwind (+x): the picture is sampled upwind
      vec4 sampledDiffuseColor = texture2D(map, vMapUv + sway * uPx * ${amp} * mo.${ch});${far ? "" : /* glsl */`
      vec2 q = vMapUv * vec2(5.0, 9.0) + vec2(uLifeT * 0.21, -uLifeT * 0.08);
      float n = sin(q.x * 2.3 + sin(q.y * 1.7 + uLifeT * 0.6)) * sin(q.y * 1.9 - sin(q.x * 1.3 - uLifeT * 0.4));
      sampledDiffuseColor.rgb *= 1.0 + mo.g * n * (0.05 + 0.05 * gx);`}
      sampledDiffuseColor.rgb = mix(sampledDiffuseColor.rgb, sampledDiffuseColor.rgb * vec3(1.05, 1.08, 1.0) + 0.025, clamp(gx * 0.55, 0.0, 1.0) * mo.${ch});${drift ? /* glsl */`
      // the clouds drift downwind over the true sky only: a cloud shows where it is sky now and was sky where it came
      // from, so it slides behind a ridge or a tree and nothing of the landscape is dragged along
      vec2 du = vMapUv - vec2(uDrift, 0.0);
      sampledDiffuseColor = mix(sampledDiffuseColor, texture2D(map, du), mo.r * texture2D(uMotion, du).r);` : ""}` : /* glsl */`
      vec4 sampledDiffuseColor = texture2D(map, vMapUv);`}
      ${shadows ? /* glsl */`
      // cloud shadows: soft patches on the ground plane under the clouds, sliding downwind; a standing card takes them as
      // if its higher pixels lay further away (a hillside), and nothing near the cast is touched
      vec2 cq = vec2(vLifeW.x, vLifeW.z - max(vLifeW.y, 0.0) * 2.5) / uCloud.y - vec2(uCloud.x * uLifeT / uCloud.y, 0.0);
      float cs = smoothstep(0.5, 0.62, lifeFbm(cq)) * uCloud.z * smoothstep(uCloud.w, uCloud.w * 1.8, -vLifeW.z);
      sampledDiffuseColor.rgb *= mix(vec3(1.0), vec3(0.6, 0.67, 0.86), cs);` : ""}
      ${grade ? /* glsl */`
      // a grey day: the painting dimmed and cooled, and its colour drained toward grey
      float lum = dot(sampledDiffuseColor.rgb, vec3(0.3, 0.59, 0.11));
      sampledDiffuseColor.rgb = mix(vec3(lum), sampledDiffuseColor.rgb, uGrade.w) * uGrade.rgb;${o.sky && S.grade?.sky ? /* glsl */`
      // the sky itself: the white clouds turn to rain clouds (bright pixels pulled down to a blue-grey, the blue gaps
      // greyed), with darker bellies where the painting is already shaded
      float sk = ${(+S.grade.sky).toFixed(3)};
      sampledDiffuseColor.rgb = mix(sampledDiffuseColor.rgb, vec3(lum) * vec3(0.66, 0.7, 0.78) + vec3(0.04, 0.05, 0.07), sk);` : ""}` : ""}
      diffuseColor *= sampledDiffuseColor;`);
  };
  mat.customProgramCacheKey = () => `set-life-${motion ? 1 : 0}-${far ? 1 : 0}-${drift ? 1 : 0}-${shadows ? 1 : 0}-${bend ? 1 : 0}-${grade ? 1 : 0}-${o.sky ? 1 : 0}-${amp}`;
  mat.needsUpdate = true;
  return true;
}

// the depth-only twin of a card (set-env.js) bends with it, so the painting still hides what stands behind it
export function lifeTwin(mat) {
  if (!S || !(S.bend > 0)) return;
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = `${DECL}\n${NOISE}\n` + sh.vertexShader.replace("#include <begin_vertex>", `#include <begin_vertex>${BEND}`);
  };
  mat.customProgramCacheKey = () => "set-life-twin";
  mat.needsUpdate = true;
}

// is the living world on for this set (an env card only loads its life mask then)
export const lifeOn = () => !!S;

// ---------- creatures and leaves ----------
const ink = "#2a2230";
const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.8, ...o });

// a house sparrow, about 20 cm (a little bigger than life, so it reads at phone size): brown back, buff belly,
// grey crown, a dark eye; wings hinged at the shoulder (folded along the back, or spread and beating)
function sparrow(r) {
  const g = new THREE.Group(), tone = 0.9 + r() * 0.2;
  const back = std(new THREE.Color("#8a5f3c").multiplyScalar(tone)), belly = std("#d9c6a3"), crown = std("#7d7064"), beakM = std("#5a4a3e");
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 12), back); body.scale.set(0.95, 0.9, 1.45); body.position.set(0, 0.07, 0); g.add(body);
  const bel = new THREE.Mesh(new THREE.SphereGeometry(0.046, 14, 10), belly); bel.scale.set(0.9, 0.85, 1.2); bel.position.set(0, 0.06, 0.012); g.add(bel);
  const headP = new THREE.Group(); headP.position.set(0, 0.11, 0.05); g.add(headP);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.034, 14, 10), back); headP.add(head);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.0352, 14, 10, 0, Math.PI * 2, 0, 0.8), crown); cap.position.set(0, 0.002, -0.004); headP.add(cap);
  const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 8), belly); cheek.scale.set(1.05, 0.8, 0.9); cheek.position.set(0, -0.01, 0.008); headP.add(cheek);
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.011, 0.028, 8), beakM); beak.rotation.x = Math.PI / 2; beak.position.set(0, -0.004, 0.04); headP.add(beak);
  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.0065, 8, 6), new THREE.MeshBasicMaterial({ color: "#1a1418" })); eye.position.set(s * 0.024, 0.006, 0.02); headP.add(eye);
  }
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.008, 0.07), back); tail.position.set(0, 0.075, -0.09); tail.rotation.x = -0.35; g.add(tail);
  // wings: a rounded feather blade, root at the shoulder, span along local +x
  const wings = [];
  for (const s of [-1, 1]) {
    // a broad rounded wing: leading edge straight-ish, the trailing edge scalloped by the flight feathers; covert
    // feathers brown, the primaries at the tip dark (the wing reads as a wing from above, below and the front)
    const blade = (pts, depth) => { const sh = new THREE.Shape(); sh.moveTo(...pts[0]); for (let k = 1; k < pts.length; k += 2) sh.quadraticCurveTo(...pts[k], ...pts[k + 1]); sh.closePath();
      const geo = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.002, bevelSegments: 1, curveSegments: 6 }); geo.rotateX(-Math.PI / 2); if (s < 0) geo.scale(-1, 1, 1); return geo; };
    const cover = blade([[0, 0.025], [0.05, 0.04], [0.1, 0.03], [0.12, 0.0], [0.09, -0.02], [0.05, -0.045], [0.0, -0.04]], 0.006);
    const prim = blade([[0.06, 0.035], [0.12, 0.04], [0.165, 0.018], [0.17, 0.0], [0.15, -0.015], [0.13, -0.02], [0.11, -0.035], [0.09, -0.03], [0.07, -0.04]], 0.004);
    const pivot = new THREE.Group(); pivot.position.set(s * 0.035, 0.1, 0.01);
    pivot.add(new THREE.Mesh(prim, std(new THREE.Color("#3e2c22").multiplyScalar(tone), { side: THREE.DoubleSide })));
    const cm = new THREE.Mesh(cover, std(new THREE.Color("#7a5232").multiplyScalar(tone), { side: THREE.DoubleSide })); cm.position.y = 0.002; pivot.add(cm);
    g.add(pivot); wings.push({ pivot, s });
  }
  // little legs
  for (const s of [-1, 1]) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.03, 4), beakM); leg.position.set(s * 0.012, 0.015, 0.0); g.add(leg); }
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.material.userData.lineK = 0.8; } });
  return { g, headP, wings, body };
}

// the wing pose: folded along the back, or one of the beat's three drawings (up, level, down), held for a drawing
function wingPose(B, mode, k) {
  for (const { pivot, s } of B.wings) {
    if (mode === "fold") { pivot.rotation.set(0.12, s * 1.42, s * -0.2); continue; }   // span swung back along its own side of the body
    const flap = [1.15, 0.15, -0.75][k % 3];
    pivot.rotation.set(-0.35, s * 0.15, s * flap);   // the wing pitched, so a bird coming at us shows its wing faces
    if (mode === "glide") pivot.rotation.set(0.1, s * 1.2, s * 0.1);                    // the bound: wings closed in, for a beat
  }
}

// a bird's day on the ground: hops, pecks and quick head turns (sparrows move their heads in snaps, not sweeps),
// scheduled from its own seed so any frame can be drawn on its own
function groundPlan(r, dur) {
  const ev = []; let t = r() * 0.6;
  while (t < dur) {
    const p = r();
    if (p < 0.35) ev.push({ t, kind: "hop", dur: 0.13, d: 0.04 + r() * 0.06, dir: r() * 6.283 });
    else if (p < 0.7) ev.push({ t, kind: "peck", dur: 0.18 + r() * 0.12 });
    else ev.push({ t, kind: "look", dur: 0, yaw: (r() - 0.5) * 1.6, tilt: (r() - 0.5) * 0.4 });
    t += 0.25 + r() * 0.6;
  }
  return ev;
}

function placeBirds(L, E, r) {
  const out = [];
  for (const b of L.birds || []) {
    if (b.flock) {
      // a loose flock with a clump and a straggler, never a ring or a row (copy nature)
      const { n = 5, at = [0, 0], r: R = 0.6 } = b.flock;
      // each bird keeps a body or two from its neighbours (sparrows feeding space themselves), up to 40 tries
      const placed = [];
      for (let i = 0; i < n; i++) {
        let p = null;
        for (let k = 0; k < 40 && !p; k++) {
          const a = r() * 6.283, d = R * (i === n - 1 ? 1 + r() * 0.5 : Math.sqrt(r()));
          const q = [at[0] + Math.cos(a) * d, at[1] + Math.sin(a) * d];
          if (placed.every((o) => Math.hypot(o[0] - q[0], o[1] - q[1]) > 0.17)) p = q;
        }
        if (!p) continue;
        placed.push(p); out.push({ at: [p[0], 0, p[1]], yaw: r() * 360, ground: true });
      }
    } else if (b.perch && E) {
      const cam = envCamera(E), c = E.cards.find((k) => k.name === b.card);
      const [x0, , x1] = c.rect, f = c.foot ? c.foot[Math.max(0, Math.min(c.foot.length - 1, Math.round(((b.perch[0] - x0) / (x1 - x0)) * (c.foot.length - 1))))] : c.z;
      const p = cam.ray(b.perch[0], b.perch[1]).multiplyScalar((f + (b.dz ?? 0)) / cam.f).add(cam.pos);
      out.push({ at: p.toArray(), yaw: b.yaw ?? (r() - 0.5) * 120, ground: false, scale: b.scale });
    } else out.push({ at: b.at, yaw: b.yaw ?? r() * 360, ground: (b.at[1] ?? 0) < 0.05, scale: b.scale });
  }
  return out;
}

export function addLife(scene, spec) {
  if (!S) return null;
  const L = spec.life, E = spec.envData, r = lifeRng(S.seed + 5), dur = S.duration;
  const grp = new THREE.Group(); grp.name = "set-life"; scene.add(grp);
  const ticks = [];

  // ---- birds
  placeBirds(L, E, r).forEach((b, i) => {
    const B = sparrow(r); B.g.scale.setScalar(b.scale ?? 1); grp.add(B.g);
    const br = lifeRng(S.seed * 13 + i), plan = b.ground ? groundPlan(br, dur + 1) : groundPlan(br, dur + 1).filter((e) => e.kind !== "hop");
    const leave = leaveTime(S, b, i), yaw0 = (b.yaw * Math.PI) / 180;
    // the escape: away from the sound, up at 35-55 degrees, swinging up to 40 degrees off the straight line
    // the cameras look from +z (sets.js): a bird never flies straight into the lens, it peels off to the side
    let away = null;
    if (leave) {
      let ax = b.at[0] - leave.from[0], az = b.at[2] - leave.from[1]; const n = Math.hypot(ax, az) || 1; ax /= n; az /= n;
      if (az > 0.3) { az = 0.3; ax = (Math.sign(ax) || 1) * Math.sqrt(1 - az * az); }
      away = Math.atan2(ax, az) + (br() - 0.5) * 0.7;
    }
    const climb = 0.95 + br() * 0.3, curl = (br() - 0.5) * 0.9, fl = 0.9 + br() * 0.25;
    ticks.push((t) => {
      let x = b.at[0], y = b.at[1], z = b.at[2], yaw = yaw0, pitch = 0, headPitch = 0, headYaw = 0;
      // the ground routine up to now: the sum of the hops done, the move in progress
      for (const e of plan) {
        if (e.t > t || (leave && e.t > (leave.alert ?? leave.t))) break;
        if (e.kind === "hop") { const k = Math.min(1, (t - e.t) / e.dur); x += Math.sin(e.dir) * e.d * k; z += Math.cos(e.dir) * e.d * k; y += Math.sin(Math.PI * k) * 0.025; yaw = e.dir; headYaw = 0; }
        else if (e.kind === "peck") { const k = (t - e.t) / e.dur; headPitch = k < 1 ? Math.sin(Math.PI * Math.min(1, k)) * 0.9 : 0; pitch = headPitch * 0.35; }
        else if (e.kind === "look") { headYaw = e.yaw; }
      }
      if (leave && t >= leave.alert && t < leave.t) {
        // alert: frozen, body up, the head snapped round toward the sound (a quick small turn of the body too)
        const toSrc = Math.atan2(leave.from[0] - x, leave.from[1] - z), turn = Math.atan2(Math.sin(toSrc - yaw), Math.cos(toSrc - yaw));
        const bodyTurn = Math.max(-0.5, Math.min(0.5, turn * 0.4));
        B.g.position.set(x, y, z); B.g.rotation.set(-0.25, yaw + bodyTurn, 0, "YXZ");
        B.headP.rotation.set(-0.2, Math.max(-1.3, Math.min(1.3, turn - bodyTurn)), 0); wingPose(B, "fold"); B.g.visible = true; return;
      }
      if (!leave || t < leave.t) { B.g.position.set(x, y, z); B.g.rotation.set(pitch, yaw, 0, "YXZ"); B.headP.rotation.set(headPitch, headYaw, 0); wingPose(B, "fold"); B.g.visible = true; return; }
      // take-off: a 2-frame crouch, then the legs throw it up (80-95 % of the launch speed, Provini 2012) and the
      // first downstroke starts at lift-off; flapping bursts with a short closed-wing bound (small birds' flight)
      const tau = t - leave.t, CR = 0.06;
      if (tau < CR) { B.g.position.set(x, y - 0.012, z); B.g.rotation.set(-0.3, away, 0, "YXZ"); B.headP.rotation.set(-0.3, 0, 0); wingPose(B, "flap", 0); return; }
      const s = tau - CR, dist = (1.6 * s + 2.4 * s * s) * fl, h = dist * Math.tan(climb) * (s < 0.15 ? s / 0.15 : 1);
      const dir = away + curl * Math.min(1, s * 1.5);
      B.g.position.set(x + Math.sin(dir) * dist, y + 0.02 + h, z + Math.cos(dir) * dist);
      B.g.rotation.set(-climb * 0.7, dir, Math.sin(s * 9) * 0.15, "YXZ"); B.headP.rotation.set(0.2, 0, 0);
      const k = Math.floor(s * 15 + i), bound = s > 0.55 && (s % 0.5) > 0.38;
      wingPose(B, bound ? "glide" : "flap", k);
      B.g.visible = dist < 40;
    });
  });

  // ---- butterflies: two painted wings that clap on a 3-frame cycle (~10 Hz), an erratic path round their flowers
  // (the body bobs with each beat), pushed by the gusts
  const BF = L.butterflies;
  if (BF) {
    const n = BF.n ?? 3, homes = BF.at || [[-1, 0.4, -3]];
    for (let i = 0; i < n; i++) {
      const g = new THREE.Group(), col = new THREE.Color(BF.color || "#f2a33a").offsetHSL((r() - 0.5) * 0.04, 0, (r() - 0.5) * 0.1);
      const wingM = std(col, { side: THREE.DoubleSide }), wings = [];
      for (const s of [-1, 1]) {
        const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.bezierCurveTo(0.02, 0.05, 0.06, 0.05, 0.055, 0.015); sh.bezierCurveTo(0.06, -0.01, 0.04, -0.04, 0, -0.01); sh.closePath();
        const geo = new THREE.ShapeGeometry(sh, 8); geo.rotateX(-Math.PI / 2); if (s < 0) geo.scale(-1, 1, 1);
        const m = new THREE.Mesh(geo, wingM); m.material.userData.lineK = 0.6; const p = new THREE.Group(); p.add(m); g.add(p); wings.push({ p, s });
      }
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.003, 0.035, 5), std("#2a2028")); body.rotation.x = Math.PI / 2; g.add(body);
      grp.add(g);
      const home = homes[i % homes.length], R = BF.r ?? 0.5, ph = [r() * 6.3, r() * 6.3, r() * 6.3], f = [0.7 + r() * 0.5, 0.9 + r() * 0.6, 1.1 + r() * 0.5];
      ticks.push((t) => {
        const gw = gustAt(S, home[0], home[2], t) - S.wind.calm;
        const x = home[0] + Math.sin(t * f[0] + ph[0]) * R + Math.sin(t * f[1] * 2.3 + ph[1]) * R * 0.3 + gw * 0.25;
        const y = home[1] + Math.sin(t * f[1] + ph[1]) * R * 0.35 + Math.abs(Math.sin(t * 31 + ph[2])) * 0.02;
        const z = home[2] + Math.sin(t * f[2] + ph[2]) * R * 0.6;
        const dx = Math.cos(t * f[0] + ph[0]) * f[0] + gw * 0.2, dz = Math.cos(t * f[2] + ph[2]) * f[2] * 0.6;
        g.position.set(x, y, z); g.rotation.set(0, Math.atan2(dx, dz), 0);
        const k = Math.floor(t * 30 + i) % 3, a = [1.25, 0.5, -0.15][k];
        for (const { p, s } of wings) p.rotation.set(0, 0, s * a);
      });
    }
  }

  // ---- leaves shaken loose by a gust: each gust that crosses a tree drops one or two, which flutter down
  // (asymmetric leaves fall slowly and swing side to side, Tadrist 2018 / falling-plate studies) and drift downwind
  const LV = L.leaves;
  if (LV) {
    const leafGeo = (() => { const sh = new THREE.Shape(); sh.moveTo(0, -0.03); sh.quadraticCurveTo(0.022, -0.005, 0, 0.03); sh.quadraticCurveTo(-0.022, -0.005, 0, -0.03); return new THREE.ShapeGeometry(sh, 6); })();
    const drops = [];
    for (const src of LV.from || []) for (const G of S.wind.gusts) {
      const tArrive = G.tc + src[0] / S.wind.speed;
      if (G.s < 0.85) continue;
      for (let k = 0; k < (LV.n ?? 2); k++) drops.push({ t0: tArrive + r() * 0.4, at: [src[0] + (r() - 0.5) * 0.8, src[1] - r() * 0.3, src[2] + (r() - 0.5) * 0.6], ph: r() * 6.3, sw: 0.25 + r() * 0.2, fall: 0.45 + r() * 0.25 });
    }
    for (const d of drops) {
      const m = new THREE.Mesh(leafGeo, std(new THREE.Color(LV.color || "#8fb547").offsetHSL((r() - 0.5) * 0.06, 0, (r() - 0.5) * 0.15), { side: THREE.DoubleSide }));
      m.material.userData.lineK = 0.6; grp.add(m);
      ticks.push((t) => {
        const s = t - d.t0;
        if (s < 0 || d.at[1] - d.fall * s < 0.02) { m.visible = false; return; }
        m.visible = true;
        const sw = Math.sin(s * 3.1 + d.ph);   // the pendulum swing of a fluttering leaf, ~2 s a period
        m.position.set(d.at[0] + s * 1.1 + sw * d.sw, d.at[1] - d.fall * s + Math.abs(sw) * 0.05, d.at[2] + Math.cos(s * 2.3 + d.ph) * 0.15);
        m.rotation.set(sw * 0.9 + 0.6, s * 1.7 + d.ph, Math.cos(s * 3.1 + d.ph) * 0.8);
      });
    }
  }

  // ---- a grey day: the cast's lights dimmed and cooled with the painting (every light in the scene, from its own
  // first values, so any frame drawn on its own gets the same)
  if (S.grade) {
    const G = S.grade, tint = new THREE.Color(G.tint || "#ffffff"), orig = new Map();
    if (scene.background?.isColor) scene.background.multiply(new THREE.Color(...G.mul));
    ticks.push(() => {
      scene.traverse((o) => {
        if (!o.isLight) return;
        if (!orig.has(o)) orig.set(o, { i: o.intensity, c: o.color.clone(), g: o.groundColor?.clone() });
        const O = orig.get(o); o.intensity = O.i * (G.light ?? 1); o.color.copy(O.c).multiply(tint);
        if (o.groundColor && O.g) o.groundColor.copy(O.g).multiply(tint);
      });
    });
  }

  // ---- rain: thin streaks slanting with the wind, a fixed set falling through a box round the stage on a loop
  // (each streak's height is the clock modulo the box, so any frame stands alone)
  if (S.rain) {
    const R = S.rain, N = R.n ?? 600, len = R.len ?? 0.3, v = R.speed ?? 9, box = R.box || [[-4, 3], [4, -12]], top = 4.5;
    const seeds = Array.from({ length: N }, () => [box[0][0] + r() * (box[1][0] - box[0][0]), r() * top, box[0][1] + r() * (box[1][1] - box[0][1]), 0.8 + r() * 0.4]);
    const pos = new Float32Array(N * 6), geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const m = new THREE.LineBasicMaterial({ color: R.color || "#dfe8f2", transparent: true, opacity: R.opacity ?? 0.45, depthWrite: false, fog: false });
    m.userData.noOutline = true; m.userData.outlineParameters = { visible: false };
    const lines = new THREE.LineSegments(geo, m); lines.frustumCulled = false; lines.renderOrder = 4; lines.name = "set-life-rain"; grp.add(lines);
    ticks.push((t) => {
      for (let i = 0; i < N; i++) {
        const [x, y0, z, k] = seeds[i], g = gustAt(S, x, z, t), slant = 0.12 * g;   // the wind blows the drops sideways
        const y = top - ((((top - y0) + t * v * k) % top) + top) % top, x1 = x + (top - y) * slant;
        pos.set([x1, y, z, x1 + len * slant * 2.5, y - len, z], i * 6);
      }
      geo.attributes.position.needsUpdate = true;
    });
  }

  // ---- debris: leaves torn off upwind, tumbling across the frame with the wind (each starts its trip at its own
  // time, spread over the clip, so there are always a few in the air and never a wave of them)
  if (S.debris) {
    const n = S.debris.n ?? 20, span = dur + 4, leafGeo = (() => { const sh = new THREE.Shape(); sh.moveTo(0, -0.03); sh.quadraticCurveTo(0.022, -0.005, 0, 0.03); sh.quadraticCurveTo(-0.022, -0.005, 0, -0.03); return new THREE.ShapeGeometry(sh, 6); })();
    for (let i = 0; i < n; i++) {
      const col = new THREE.Color(["#7fa040", "#9cae4a", "#b49a46", "#6f8a3a"][i % 4]).offsetHSL(0, 0, (r() - 0.5) * 0.1);
      const m = new THREE.Mesh(leafGeo, std(col, { side: THREE.DoubleSide })); m.material.userData.lineK = 0.6; m.scale.setScalar(0.8 + r() * 0.6); grp.add(m);
      const t0 = -3 + (i / n) * span + r() * (span / n), y0 = 0.4 + r() * 2.4, z = -9 + r() * 9.5, vx = 3 + r() * 2.5, ph = r() * 6.3, spin = 5 + r() * 6;
      ticks.push((t) => {
        const s2 = t - t0, x = -5 + vx * s2;
        if (s2 < 0 || x > 6) { m.visible = false; return; }
        m.visible = true;
        const g = gustAt(S, x, z, t);
        m.position.set(x + Math.sin(s2 * 2.1 + ph) * 0.2, Math.max(0.05, y0 - 0.25 * s2 + Math.sin(s2 * 3.3 + ph) * 0.25 * g), z + Math.cos(s2 * 1.7 + ph) * 0.3);
        m.rotation.set(s2 * spin + ph, s2 * spin * 0.6, s2 * spin * 0.3);
      });
    }
  }

  const tick = (t) => { for (const f of ticks) f(t); };
  tick(0); (globalThis.__setTicks ||= []).push(tick);
  return grp;
}
