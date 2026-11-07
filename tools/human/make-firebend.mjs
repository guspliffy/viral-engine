// The anime person bends fire (Jonny, 7 Nov 2026: "a short 10 sec action scene with this character. the character
// should bend fire like the firebenders do in avatar master of the elements. do research on how it looks"). Research:
// /mnt/project-files/research/firebending-01/ (the show's firebending is Northern Shaolin: long low stances, snapping
// straight punches and kicks, the fire leaving the fist or foot on the strike and following the limb's line, arcs off
// round kicks, the breath before the big one). The moves are real karate and kicking recordings from the CMU database
// (subject 135: lunge punch, roundhouse and side kick from a horse stance; 88_06 a jump spin kick), each in its own
// shot in the sunset volcano valley; the fire is props-fire.js "firebend", thrown from the drawn fist or foot.
//   node tools/human/make-firebend.mjs        -> storyboards/human/fire/firebend-01.json
// The fire's sources are measured on the drawn body (the page's palms and feet, tools/human/firebend-src.mjs writes
// storyboards/human/fire/firebend-01.src.json from a layout pass); without that file they come from the recording.
import fs from "node:fs";
import * as THREE from "three";
import { Performance, prepClip, worldPose, palmWorld } from "../../engine/page/rigs/human-perform.js";

const LEG = 0.845;
const VY = 0;


const clips = {};
const load = (n) => (clips[n] ??= prepClip(JSON.parse(fs.readFileSync(`assets/mocap/${n}.json`, "utf8"))));
const R = (v, n = 3) => +(+v).toFixed(n);

// the shots: a take (clip, seconds in the clip file), which way he faces (heading, degrees from facing the camera),
// where his pelvis path's middle stands, the camera, and the fire: per strike the limb (L, R fists; LF, RF feet), the
// clip seconds it pours, its kind and how far it flies (reach: it splashes there)
const SHOTS = [
  // the fire grows strike by strike (size 0.14 -> 0.24, then 0.42 on the last), so the finisher reads as the big one
  // (Fable review A). 1. frame 0 is already the step in with a flame waiting in the right fist; the punch throws it,
  // the fire born as the arm locks out (a cone off the knuckles)
  { name: "punch1", clip: "c135_09", from: 2.15, to: 3.0, heading: 45, mid: [-0.4, 0], cam: { az: 8, el: 4, fov: 42 },
    fire: [{ limb: "R", at: -0.3, to: 0.3, kind: "hold", speed: 1, size: 0.045, rate: 70, life: 0.28, lift: 0.4 }, { limb: "R", from: 2.3, to: 2.95, kind: "jet", speed: 8, dur: 0.22, size: 0.14 }] },
  // 2. the other fist, from the hips up (a medium, so the cut from the wide is no jump cut)
  { name: "punch2", clip: "c135_09", from: 4.05, to: 4.75, heading: 75, mid: [-0.5, 0.1], cam: { az: -10, el: 3, fov: 38, fit: 1.0, nofire: true },
    fire: [{ limb: "L", from: 4.15, to: 4.75, kind: "jet", speed: 9, dur: 0.25, size: 0.17 }] },
  // 3. a roundhouse, wide: the fire laid along the swing of the foot, a crescent
  { name: "round", clip: "c135_07", from: 0.5, to: 1.55, heading: 60, mid: [-0.25, 0], cam: { az: 8, el: 12, fov: 44 },
    fire: [{ limb: "RF", from: 0.75, to: 1.15, kind: "arc", speed: 3, size: 0.2, rate: 300, life: 0.42, minY: 0.75 }] },
  // 4. and back the other way with the left foot
  { name: "round2", clip: "c135_07", from: 3.2, to: 4.1, heading: 110, mid: [0.25, 0], cam: { az: -5, el: 4, fov: 44, push: 0.8 },
    fire: [{ limb: "LF", from: 3.45, to: 3.85, kind: "arc", speed: 3, size: 0.21, rate: 300, life: 0.42, minY: 0.75 }] },
  // 5. a side kick: a jet off the sole along the leg
  { name: "side", clip: "c135_11", from: 1.25, to: 2.4, heading: -15, mid: [0.45, 0], cam: { az: 6, el: 3, fov: 48, nofire: true },
    fire: [{ limb: "RF", from: 1.65, to: 2.2, kind: "jet", speed: 9, size: 0.22, dur: 0.25 }] },
  // 6. he steps in and kicks high: the jet goes up past his head
  { name: "high", clip: "c135_11", from: 3.8, to: 4.55, heading: 70, mid: [-0.2, 0], cam: { az: -6, el: 6, fov: 46, push: 0.78 },
    fire: [{ limb: "RF", from: 3.85, to: 4.3, kind: "jet", speed: 7, size: 0.24, dur: 0.25 }] },
  // 7. the jump spin kick: a ring of fire off the foot as it swings round, cut on the landing
  { name: "spin", clip: "c88_06", from: 0.38, to: 1.2, heading: 20, mid: [0, -0.2], cam: { az: 0, el: 4, fov: 46 },
    fire: [{ limb: "RF", from: 0.4, to: 0.8, kind: "arc", speed: 3, size: 0.2, rate: 260, life: 0.38, minY: 0.8 }] },
  // 8. the breath: he sinks into a horse stance, guard up, and the fire waits in both fists (the dip before the payoff)
  { name: "breath", clip: "c135_11", from: 0.0, to: 1.3, heading: 25, mid: [0, 0], cam: { az: 0, el: 2, fov: 34, upper: true, fit: 1.1 },
    fire: [{ limb: "L", at: 0.5, to: 1.25, kind: "hold", speed: 1, size: 0.035, rate: 70, life: 0.28, lift: 0.4 }, { limb: "R", at: 0.55, to: 1.25, kind: "hold", speed: 1, size: 0.035, rate: 70, life: 0.28, lift: 0.4 }] },
  // 9. the big one: the last lunge punch, the longest, widest blast, tapering into smoke and embers; he holds the
  // punch, then both fists light again as he comes back (the end answers the opening's flame in the fist). Cut before
  // the recording walks off (7.8 s)
  { name: "final", clip: "c135_09", from: 5.85, to: 7.8, heading: 26, mid: [-0.35, -0.2], cam: { az: -8, el: 5, fov: 46, fit: 1.08 },
    fire: [{ limb: "L", from: 5.95, to: 7.3, kind: "jet", speed: 13, size: 0.42, rate: 260, life: 0.7, dur: 0.9, spread: 0.2, level: 0.25, taper: 0.15 },
      { limb: "L", at: 1.35, to: 1.95, kind: "hold", speed: 1, size: 0.045, rate: 70, life: 0.28, lift: 0.4 }, { limb: "R", at: 1.4, to: 1.95, kind: "hold", speed: 1, size: 0.045, rate: 70, life: 0.28, lift: 0.4 }] },
];

const segsOf = (sh, heading, place) => [{ at: 0, clip: sh.clip, from: sh.from, to: sh.to, place, heading, blend: 0 }];
const lenOf = (sh) => R(sh.to - sh.from);
const one = (sh, heading, place) => new Performance(segsOf(sh, heading, place), clips, [], LEG);
const list = [];
let t = 0;
for (const sh of SHOTS) {
  load(sh.clip);
  const len = lenOf(sh), P0 = one(sh, sh.heading, [0, 0]), a = P0.at(0).pos, b = P0.at(len - 1e-4).pos;
  const ref = { x: (a.x + b.x) / 2, z: (a.z + b.z) / 2 };
  const segs = segsOf(sh, sh.heading, [R(sh.mid[0] - ref.x, 4), R(sh.mid[1] - ref.z, 4)]).map((g) => ({ ...g, at: R(g.at + t) }));
  list.push(...segs); sh.seg = segs[0]; sh.t0 = t; sh.t1 = t + len;
  t = sh.t1;
}
const END = R(t);
const perf = new Performance(list, clips, [], LEG);
const T = (sh, u) => R(sh.t0 + (u - sh.from), 4);

// the fire's sources: the drawn body's fist or foot when measured, else the recording's, and the limb's line
const MEAS = fs.existsSync("storyboards/human/fire/firebend-01.src.json") ? JSON.parse(fs.readFileSync("storyboards/human/fire/firebend-01.src.json", "utf8")) : null;
// the measured place at s, between the two frames round it
const near = (arr, s) => { if (!arr?.length) return null; let i = arr.findIndex((q) => q.t >= s); if (i <= 0) return arr[Math.max(0, i)]; const a = arr[i - 1], b = arr[i], k = (s - a.t) / Math.max(1e-6, b.t - a.t); return { t: s, p: a.p.map((v, j) => v + (b.p[j] - v) * k) }; };
function source(limb, s) {
  const W = worldPose(perf.at(Math.min(s, END - 1e-4))), side = limb[0].toLowerCase();
  let p, d;
  if (limb.length === 1) {   // a fist: the knuckles, along the forearm
    const palm = palmWorld(W, side), el = W[`${side}radius`].start;
    d = palm.clone().sub(el).normalize(); p = palm.clone().addScaledVector(d, 0.05);
    const m = near(MEAS?.[limb], s); if (m) p = new THREE.Vector3(...m.p).addScaledVector(d, 0.05);
  } else {                   // a foot: the sole's front, along the leg (hip to foot)
    const ball = W[`${side}foot`].end, hip = W[`${side}femur`].start;
    d = ball.clone().sub(hip).normalize(); p = ball.clone();
    const m = near(MEAS?.[limb], s); if (m) p = new THREE.Vector3(...m.p);
  }
  return [R(s, 4), R(p.x), R(p.y), R(p.z), R(d.x), R(d.y), R(d.z)];
}
// the fire is born on the frame the limb reaches its full stretch, never in the wind-up (research: "the strike throws
// it"), and a jet keeps the strike's own line (shoulder or hip to the fist or foot at full stretch): the forearm's
// line wobbles while the fist turns over
const reachOf = (limb, s) => { const W = worldPose(perf.at(Math.min(s, END - 1e-4))), side = limb[0].toLowerCase();
  const end = limb.length === 1 ? palmWorld(W, side) : W[`${side}foot`].end, base = limb.length === 1 ? W[`${side}humerus`].start : W[`${side}femur`].start;
  return { end, base, d: end.distanceTo(base) }; };
const blasts = [];
for (const sh of SHOTS) for (const f of sh.fire || []) {
  const { limb, from, to, at: holdAt, dur, minY, level, ...rest } = f;
  let a, b, line = null;
  if (f.kind === "hold") { a = T(sh, sh.from + holdAt); b = T(sh, sh.from + to); }
  else {
    // the search window's fullest stretch
    const w0 = T(sh, from), w1 = T(sh, to); let pk = w0, pd = 0;
    for (let s2 = w0; s2 <= w1; s2 += 1 / 120) { const r = reachOf(limb, s2); if (r.d > pd && (minY == null || r.end.y >= minY)) { pd = r.d; pk = s2; } }
    a = pk; for (let s2 = pk; s2 >= w0; s2 -= 1 / 120) { if (reachOf(limb, s2).d < 0.9 * pd) break; a = s2; }
    // an arc: all the while the foot swings high (over minY) round the fullest stretch
    if (f.kind === "arc") { a = pk; b = pk; for (let s2 = pk; s2 >= w0; s2 -= 1 / 120) { if (reachOf(limb, s2).end.y < minY) break; a = s2; } for (let s2 = pk; s2 <= w1; s2 += 1 / 120) { if (reachOf(limb, s2).end.y < minY) break; b = s2; } }
    else {
      // a jet pours for dur, but never once the limb pulls back (the fist going home would drag the stream through
      // his own body: Fable review B on the last blast)
      b = Math.min(w1, a + (dur ?? 0.22)); for (let s2 = pk; s2 <= b; s2 += 1 / 120) if (reachOf(limb, s2).d < 0.7 * pd) { b = s2; break; }
      const r = reachOf(limb, pk); line = r.end.clone().sub(r.base); if (level != null) line.y *= level; line.normalize(); }
    a = R(a, 4); b = R(b, 4);
  }
  const src = [];
  for (let s2 = a; s2 <= b + 1e-6; s2 += 1 / 60) { const q = source(limb, s2); if (line) q.splice(4, 3, R(line.x), R(line.y), R(line.z)); if (minY == null || q[2] >= minY * 0.9) src.push(q); }
  if (!src.length) { console.warn("no fire for", sh.name, limb); continue; }
  // cut: the flames vanish at the shot's last frame (left alive, they hung in the air of the next shot, where his
  // fists had been in the last one)
  blasts.push({ at: src[0][0], end: src[src.length - 1][0], cut: R(sh.t1, 4), src, ...rest });
}

// the cameras: one per move, still (the cut does the work; the fire moves enough). Each looks from its angle (az: round
// from the front toward +x, el: up from level) and stands back just far enough to hold the whole body through the
// shot and most of the fire it throws (fit: the margin; upper: from the hips up)
const beats = SHOTS.map((sh) => {
  const c = sh.cam, pts = [];
  for (let s2 = sh.t0; s2 < sh.t1; s2 += 1 / 15) {
    const W = worldPose(perf.at(Math.min(s2, END - 1e-4)));
    pts.push(W.head.end.clone().add(new THREE.Vector3(0, 0.12, 0)), palmWorld(W, "l"), palmWorld(W, "r"), W.root.start.clone());
    if (!c.upper) pts.push(W.lfoot.end.clone(), W.rfoot.end.clone(), W.ltoes.end.clone(), W.rtoes.end.clone());
  }
  // nofire: frame the body only (the fire may leave the frame), for a shot whose lunge already crosses it
  if (!c.nofire) for (const B of blasts) if (B.at >= sh.t0 && B.at < sh.t1) for (const q of B.src) {
    const reach = Math.min(B.reach ?? 9, (B.speed ?? 7) / (B.drag ?? 3)) * (B.kind === "jet" ? 0.3 : 0.15);
    pts.push(new THREE.Vector3(q[1] + q[4] * reach, q[2] + q[5] * reach, q[3] + q[6] * reach));
  }
  const lo = new THREE.Vector3(Infinity, Infinity, Infinity), hi = lo.clone().multiplyScalar(-1);
  for (const p of pts) { lo.min(p); hi.max(p); }
  const ctr = lo.clone().add(hi).multiplyScalar(0.5), az = c.az * Math.PI / 180, el = c.el * Math.PI / 180;
  const back = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));   // target -> camera
  const fw = back.clone().negate(), rt = fw.clone().cross(new THREE.Vector3(0, 1, 0)).normalize(), up = rt.clone().cross(fw);
  const tv = Math.tan(c.fov * Math.PI / 360), th = tv * 9 / 16, fit = c.fit ?? 1.12;
  let D = 1.5;
  for (const p of pts) { const v = p.clone().sub(ctr), x = Math.abs(v.dot(rt)), y = Math.abs(v.dot(up)), z = v.dot(back); D = Math.max(D, z + (x * fit) / th, z + (y * fit) / tv); }
  // the painting holds only so much: the camera stays in front of where it was painted from, and near its line
  D = Math.min(D, (4.7 - ctr.z) / Math.max(0.2, back.z));
  // push: a step in (a medium), so two cuts in a row never differ by less than a shot size. Done with the lens, not by
  // walking the camera in: nearer the body, the camera sees past the painting's layers (blurred backfill behind rocks)
  const pos = ctr.clone().addScaledVector(back, D); pos.x = Math.max(-0.45, Math.min(0.45, pos.x)); pos.y = Math.max(0.45, pos.y);
  // the wides from low, at the hips (Fable review A): he stands against the pale sky and far hills instead of the
  // brown earth, and a low lens hides the blurred ground the painting keeps behind its foreground ferns
  if (!c.upper) pos.y = c.y ?? 0.8;
  // the clamps and the low lens moved the camera off the line it was fitted on, so aim and size again from where it
  // stands: centre the look on everything the shot must hold, then open or close the lens to fit it (Fable review B:
  // after two cuts he started at the frame's edge)
  const cam = new THREE.PerspectiveCamera(c.fov, 9 / 16, 0.05, 100), look = ctr.clone(); c.vy ??= VY;
  let fov = c.fov;
  for (let k = 0; k < 4; k++) {
    cam.fov = fov; cam.position.copy(pos); cam.lookAt(look); cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const p of pts) { const q = p.clone().project(cam); x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); y0 = Math.min(y0, q.y); y1 = Math.max(y1, q.y); }
    const m = Math.max((x1 - x0) / 2, (y1 - y0) / 2) * fit, dz = look.clone().project(cam).z;
    look.copy(new THREE.Vector3((x0 + x1) / 2, (y0 + y1) / 2 * (c.vy ?? 1), dz).unproject(cam));
    fov = Math.max(c.fov * 0.9, Math.min(c.fov, 2 * Math.atan(Math.tan(fov * Math.PI / 360) * m) * 180 / Math.PI));
  }

  ctr.copy(look);
  return { name: sh.name, at: R(sh.t0), len: R(sh.t1 - sh.t0), kind: sh.name === "final" ? "payoff" : undefined,
    shot: { pos: [R(pos.x), R(pos.y), R(pos.z)], look: [R(ctr.x), R(ctr.y), R(ctr.z)], fov: R(fov * (c.push ?? 1), 1) }, do: [] };
});

// the sound, every one on the frame the picture makes it: a roaring fwoosh as each jet or spin ring is born (its burst
// starts on the birth frame, loudest 0.2 s on, as the flame opens out), a swish of the leg and a small fwump of flame on
// the two roundhouses, the inhale as he sinks for the last one, a wick-catch tick as each fist lights and the hiss of
// the held flames, and on the last blast two roars (the second as it widens) over a low rumble
const shotAt = (s) => beats.find((b) => s >= b.at - 1e-6 && s < b.at + b.len) ?? beats[beats.length - 1];
const put = (s, item) => { const b = shotAt(s); b.do.push({ ...(item.sfx ? { reason: "the fire is born on this frame" } : {}), ...item, at: R(Math.max(0, s - b.at)) }); };
const hitStop = [];
for (const B of blasts) {
  const b = shotAt(B.at);
  if (B.kind === "hold") { if (b.name !== "punch1") put(B.at, { sfx: "ai/ignite", gain: 1.6 }); continue; }
  if (b.name === "round" || b.name === "round2") { put(B.at - 0.12, { sfx: "whoosh", dur: 0.4, gain: 0.45 }); put(B.at, { sfx: "ai/flare", gain: 0.8 }); continue; }
  const big = b.name === "final", LADDER = { punch1: 0.55, punch2: 0.6, side: 0.65, high: 0.7, spin: 0.7 };
  put(B.at - 0.02, { sfx: "flamejet", gain: big ? 1.0 : LADDER[b.name] ?? 0.7 });
  if (big) { put(B.at, { fx: "shake", dur: 0.25, amp: 0.035 }); hitStop.push({ at: R(Math.round((B.at + 0.1) * 30) / 30), frames: 3 }); }
  if (big) { put(B.at + 0.3, { sfx: "flamejet", gain: 0.8 }); put(B.at - 0.05, { sfx: "rumble", dur: 1.3, gain: 0.5, reason: "the big blast's roar" }); }
}
{ const br = beats.find((b) => b.name === "breath"), holds = blasts.filter((B) => B.kind === "hold" && shotAt(B.at) === br);
  put(br.at + 0.2, { sfx: "gasp", gain: 1.0, reason: "he breathes in as he sinks into the stance" });
  if (holds.length) put(holds[0].at + 0.05, { sfx: "sizzle", dur: R(holds[0].end - holds[0].at), gain: 1.2 }); }

const sb = {
  id: "firebend-01",
  title: "Firebending",
  idea: "The anime person bends fire in a volcano valley at sunset: two lunge punches, two roundhouses, a side kick, a high kick, a jump spin kick and one big last blast, each strike throwing fire off the fist or foot",
  fps: 30, look: "anime-pro", profile: "short", loop: false,
  castLook: "sheet",
  rig: { hand: 2, eyes: 2, hold: 2 },
  physics: true,
  set: { type: "env", env: "fern-valley-campfire", aperture: 0, focus: false, lighting: 2, hatch: { boil: 0.25 } },
  // taiko drums and brass (an AI bed Jonny picked by ear for action), locked so the last blast lands on beat 1
  music: { file: "ai/epic/epic-02.ogg", lowCut: 150, gain: 0.4 },
  sound: { sfx: 0.6, ambience: 0.34, surface: "dirt", room: "open", guard: true },
  creative: { notes: false },
  cast: [{ id: "h", character: "human/vrm-test-01", at: [list[0].place[0], list[0].place[1]], face: { angry: 0.85 }, seed: 1.3, perform: list,
    fingers: [[0, 0.95, 0.95]], diagPalms: !!process.env.DIAG, diagFeet: !!process.env.DIAG }],
  props: [{ id: "fire", kind: "firebend", x: 0, y: 0, z: 0, rot: 0, blasts, light: 20, staged: "fire: light, it rests on nothing" }],
  beats,
  hitStop,
  captions: [],
  duration: END,
  credits: "Character base: VRoid Studio sample model (CC0). Motion: CMU Graphics Lab Motion Capture Database, mocap.cs.cmu.edu (funded by NSF EIA-0196217).",
  notes: "Generated by tools/human/make-firebend.mjs.",
};
fs.mkdirSync("storyboards/human/fire", { recursive: true });
fs.writeFileSync("storyboards/human/fire/firebend-01.json", JSON.stringify(sb, null, 1));
console.log("END", END, SHOTS.map((s) => `${s.name} ${R(s.t0, 2)}`).join("  "), "blasts", blasts.length, MEAS ? "(measured sources)" : "(recorded sources)");
