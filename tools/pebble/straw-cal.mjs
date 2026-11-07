// Pebble's straw hand-over, calibrated (correction brief 6 Nov 2026). Node, no browser: builds Pebble from the straw
// bench storyboard, then
//   1. with the straw in his lips (t = --mouth, default 0.3), finds the stem's grip point (costume straw.grip along the
//      stem) and the point 7 cm further out along it, in arm-target space: paste them as STRAW_MOUTH / STRAW_OUT
//      (storyboards/pebble/pebble-acting.mjs, both with point "pinch")
//   2. at the contact pose (t = --contact, default 1.3: hand at STRAW_MOUTH, pads closed, still in the lips) prints how
//      far the pinch point is from the grip point, and the straw's pose in the pinch point's space: paste it as
//      costume.straw.hold { m } (characters/pebble/pebble.json)
//   3. --log: one line per frame of the bench: owner (straw.hand), lip end, pinch point, grip point on the straw, their
//      gap, and the straw's move since the previous frame; also evaluated in shuffled and repeated order (no frame may
//      depend on the frame drawn before it)
//   node tools/pebble/straw-cal.mjs [storyboards/pebble/pebble-straw.json] [--mouth 0.3] [--contact 1.3] [--log]
const noop = new Proxy(function () {}, { get: (t, k) => (k === Symbol.toPrimitive ? () => 0 : noop), apply: () => noop, set: () => true });
globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => noop, style: {} }) };
const ROOT = new URL("../../", import.meta.url).pathname;
const THREE = await import("three"); const fs = await import("node:fs");
const { loadStoryboard, castLook } = await import(ROOT + "engine/load.mjs");
const { actorState } = await import(ROOT + "engine/page/timeline.js");
const { Character } = await import(ROOT + "engine/page/potato.js");
const args = process.argv.slice(2), opt = (k, d) => (args.includes(k) ? +args[args.indexOf(k) + 1] : d);
const sbPath = args.find((a) => a.endsWith(".json")) || ROOT + "storyboards/pebble/pebble-straw.json";
const sb = loadStoryboard(sbPath), def = sb.cast[0];
const cdef = castLook(JSON.parse(fs.readFileSync(ROOT + `characters/${def.character}.json`, "utf8")), sb.castLook);
const ch = new Character(cdef, def.id), scene = new THREE.Scene(); scene.add(ch.root);
const info = ch.costume.strawInfo, g = info.group, hand = ch.arms.L.hand;
const at = (t) => { const st = actorState(sb, def, cdef, t); ch.apply(st, t); scene.updateMatrixWorld(true); ch.apply(st, t); scene.updateMatrixWorld(true); return st; };
const r4 = (v) => +v.toFixed(4), V = (v) => v.toArray().map(r4);
// 1. grip point in arm-target space
at(opt("--mouth", 0.3));
const gW = info.gripLocal.clone().applyMatrix4(g.matrixWorld), dirW = new THREE.Vector3(1, 0, 0).transformDirection(g.matrixWorld);
const inP = new THREE.Matrix4().copy(hand.parent.matrixWorld).invert(), gP = gW.clone().applyMatrix4(inP), oW = gW.clone().addScaledVector(dirW, 0.07 * ch.root.scale.x).add(new THREE.Vector3(0, -0.01, 0)), oP = oW.applyMatrix4(inP);
const X = (p) => [r4(p.x), r4((p.y - ch.legH) / ch.H), r4(p.z)];
console.log("STRAW_MOUTH = { x: " + JSON.stringify(X(gP)) + ', point: "pinch" }, STRAW_OUT = { x: ' + JSON.stringify(X(oP)) + ', point: "pinch" }');
// 2. at the contact pose
at(opt("--contact", 1.3));
const pin = hand.userData.pinchPt, pW = new THREE.Vector3().setFromMatrixPosition(pin.matrixWorld), gW2 = info.gripLocal.clone().applyMatrix4(g.matrixWorld);
console.log("contact: pinch to grip point", r4(pW.distanceTo(gW2) / ch.root.scale.x * 100), "cm (character units)");
// the arm lands short of a target near its reach (elbow clearance, wrist limits): the miss in arm-target space, to add
const miss = X(gW2.clone().applyMatrix4(inP)).map((v, i) => r4(v - X(pW.clone().applyMatrix4(inP))[i]));
console.log("pinch misses the grip point by", JSON.stringify(miss), "(arm-target space): add it to STRAW_MOUTH and run again");
const L = new THREE.Matrix4().copy(pin.matrixWorld).invert().multiply(g.matrixWorld), p = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3(); L.decompose(p, q, s);
console.log('hold = { "m": ' + JSON.stringify(L.elements.map((x) => +x.toFixed(6))) + " }   (its scale " + V(s) + ": the mirrored, sized glove)");
// 3. per-frame log
if (args.includes("--log")) {
  const N = Math.round(sb.duration * sb.fps), rows = [], snap = (f) => { const t = f / sb.fps, st = at(t), lip = new THREE.Vector3().setFromMatrixPosition(g.matrixWorld), pn = new THREE.Vector3().setFromMatrixPosition(hand.userData.pinchPt.matrixWorld), gp = info.gripLocal.clone().applyMatrix4(g.matrixWorld); return { f, t, own: st.straw?.hand ?? 0, lip, pn, gp, m: g.matrixWorld.clone() }; };
  let prev = null, worst = { jump: [0, 0], gap: [0, 0] };
  for (let f = 0; f < N; f++) {
    const r = snap(f), gap = r.pn.distanceTo(r.gp) * 100 / ch.root.scale.x, mv = prev ? r.lip.distanceTo(prev.lip) * 100 / ch.root.scale.x : 0; rows.push(r);
    if (r.own > 0.999 && gap > worst.gap[0]) worst.gap = [gap, r.t]; if (mv > worst.jump[0]) worst.jump = [mv, r.t];
    console.log(`${r.t.toFixed(2)}  owner ${r.own >= 0.999 ? "hand" : r.own <= 0.001 ? "lips" : "hand-over " + r.own.toFixed(2)}  lip-end ${V(r.lip)}  pinch ${V(r.pn)}  grip ${V(r.gp)}  gap ${gap.toFixed(2)} cm  moved ${mv.toFixed(2)} cm`);
    prev = r;
  }
  console.log(`worst: pinch-to-grip while held ${worst.gap[0].toFixed(2)} cm at ${worst.gap[1].toFixed(2)} s; straw move in one frame ${worst.jump[0].toFixed(2)} cm at ${worst.jump[1].toFixed(2)} s`);
  // the same frames shuffled (a fixed shuffle) and some repeated: each must give the same straw matrix
  const order = rows.map((r) => r.f).sort((a, b) => ((a * 7919) % 97) - ((b * 7919) % 97)).concat([30, 30, 45, 120, 45]);
  let diff = 0; for (const f of order) { const r = snap(f), m0 = rows[f].m.elements, m1 = r.m.elements; for (let i = 0; i < 16; i++) diff = Math.max(diff, Math.abs(m0[i] - m1[i])); }
  console.log(`shuffled + repeated evaluation: largest straw matrix difference ${diff.toExponential(2)}`);
}
