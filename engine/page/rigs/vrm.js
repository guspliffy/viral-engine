// Rig "vrm-v1": a person built on a real anime body (a VRM model: VRoid's CC0 bases, 6 Nov 2026), after the first
// human test (rig "human-v1", a body of smooth signed-distance shapes) read as a plastic mannequin next to Ghibli stills.
// The model brings what an anime person needs and our procedural build could not: a face with painted anime eyes and
// expression shapes (blink, mouth vowels, joy...), hair in clumps with spring bones that swing, clothes cut with seams.
//
// It plays the same motion-capture performance as human-v1 (human-perform.js: the CMU skeleton's world turns, each
// a turn away from the T pose) on the model's normalized humanoid bones (whose rest is that same T pose), so a clip
// plays on any VRM body. The materials are handed to the house look as ordinary surfaces with a role (skin, hair, cloth),
// so it gets the same flat cels, ink lines and pencil hatching as the potato cast; the eyes, brows and mouth stay flat
// painted (no shading, no lines).
//
// Everything is a pure function of story time: the hair's springs start at rest 0.6 s before each frame and run to it.
//
// character JSON: { "rig": "vrm-v1", "vrm": "assets/models/vrm/<file>.vrm", "look": { "<material name part>": {...} } }
//   look entries (matched on the material's name, first match wins): color "#rrggbb" (multiplies the texture),
//   hue / sat / light (shift the texture), role (skin | hair | cloth | char | flat), iris (eye iris scale, < 1 smaller)
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { VRMLoaderPlugin, VRMUtils } from "@pixiv/three-vrm";
import { Character } from "../potato.js";
import { Performance, worldPose } from "./human-perform.js";
import { humanClips } from "./human.js";
import { BONES } from "./human-skel.js";

const VRMS = new Map();
export async function preloadVrms(chars, sb) {
  const loader = new GLTFLoader(); loader.register((p) => new VRMLoaderPlugin(p, { autoUpdateHumanBones: true }));
  const jobs = [];
  for (const c of sb.cast || []) {
    const def = chars[c.character]; if (!def || def.rig !== "vrm-v1") continue;
    const key = `${c.id}:${def.vrm}`; if (VRMS.has(key)) continue;
    jobs.push(loader.loadAsync(`/${def.vrm}`).then((g) => VRMS.set(key, g.userData.vrm)));
  }
  await Promise.all(jobs);
}

// CMU bone -> VRM humanoid bone (the database's three back bones fold into spine, chest and upper chest)
const MAP = {
  hips: "root", spine: "lowerback", chest: "upperback", upperChest: "thorax", neck: "upperneck", head: "head",
  leftShoulder: "lclavicle", leftUpperArm: "lhumerus", leftLowerArm: "lradius", leftHand: "lhand",
  rightShoulder: "rclavicle", rightUpperArm: "rhumerus", rightLowerArm: "rradius", rightHand: "rhand",
  leftUpperLeg: "lfemur", leftLowerLeg: "ltibia", leftFoot: "lfoot", leftToes: "ltoes",
  rightUpperLeg: "rfemur", rightLowerLeg: "rtibia", rightFoot: "rfoot", rightToes: "rtoes",
};
const ORDER = Object.keys(MAP);
const FINGERS = ["Index", "Middle", "Ring", "Little"];
const smooth = (x) => { const w = Math.min(1, Math.max(0, x)); return w * w * (3 - 2 * w); };
const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

export class VrmCharacter extends Character {
  constructor(def, id, cast) {
    super({ ...def, rig: "potato", body: { lump: 0, color: "#f4cfb1", height: 0.5, width: 0.36, depth: 0.26, seed: 3 }, limbs: { color: "#f4cfb1", width: 0.03 }, hands: { type: "mitten" }, costume: null, sprout: null }, id);
    this.human = true; this.def = def; this.cast = cast || {};
    const vrm = VRMS.get(`${id}:${def.vrm}`); if (!vrm) throw new Error(`vrm not loaded: ${def.vrm}`);
    this.vrm = vrm;
    VRMUtils.rotateVRM0(vrm);   // VRM 0.x faces -z; turned to face +z like every other character
    this.bodyRoot = new THREE.Group(); this.bodyRoot.name = "human";
    this.bodyRoot.add(vrm.scene); this.root.add(this.bodyRoot);
    const H = vrm.humanoid;
    this.nb = Object.fromEntries([...ORDER, ...FINGERS.flatMap((f) => ["Proximal", "Intermediate", "Distal"].flatMap((k) => [`left${f}${k}`, `right${f}${k}`])), "leftThumbMetacarpal", "leftThumbProximal", "leftThumbDistal", "rightThumbMetacarpal", "rightThumbProximal", "rightThumbDistal", "leftThumbIntermediate", "rightThumbIntermediate"].map((n) => [n, H.getNormalizedBoneNode(n)]).filter(([, b]) => b));
    this.map = { ...MAP }; if (!this.nb.upperChest) this.map.chest = "thorax";
    // rest alignment: the database's T pose and the model's differ bone by bone (its legs stand 20 degrees apart, its
    // collarbones rise, its spine curves), so each bone gets the turn A that lays the model's rest direction onto the
    // database's: the model's bone then points where the recorded bone points, with the recorded twist
    vrm.scene.updateMatrixWorld(true);
    const rootQi = this.root.getWorldQuaternion(new THREE.Quaternion()).invert();
    this.F = rootQi.clone().multiply(this.nb.hips.parent.getWorldQuaternion(new THREE.Quaternion()));
    const CH = { hips: "spine", spine: "chest", chest: this.nb.upperChest ? "upperChest" : "neck", upperChest: "neck", neck: "head" };
    for (const sd of ["left", "right"]) Object.assign(CH, { [`${sd}Shoulder`]: `${sd}UpperArm`, [`${sd}UpperArm`]: `${sd}LowerArm`, [`${sd}LowerArm`]: `${sd}Hand`, [`${sd}Hand`]: `${sd}MiddleProximal`, [`${sd}UpperLeg`]: `${sd}LowerLeg`, [`${sd}LowerLeg`]: `${sd}Foot`, [`${sd}Foot`]: `${sd}Toes` });
    this.A = {};
    for (const b of ORDER) {
      const ch = CH[b], cb = BONES[this.map[b]];
      if (!this.nb[b] || !ch || !this.nb[ch] || !cb || b === "hips") continue;
      const dv = this.nb[ch].getWorldPosition(new THREE.Vector3()).sub(this.nb[b].getWorldPosition(new THREE.Vector3())).applyQuaternion(rootQi).normalize();
      this.A[b] = new THREE.Quaternion().setFromUnitVectors(dv, new THREE.Vector3(...cb[1]));
    }
    // the body's leg length (thigh + shin, rest pose) scales each clip's steps and hip height
    vrm.scene.updateMatrixWorld(true);
    const wp = (n) => H.getRawBoneNode(n).getWorldPosition(new THREE.Vector3());
    this.legLen = wp("leftUpperLeg").distanceTo(wp("leftLowerLeg")) + wp("leftLowerLeg").distanceTo(wp("leftFoot"));
    this.hipH = wp("hips").y;
    this.footH = (wp("leftFoot").y + wp("rightFoot").y) / 2;   // the ankle's height over the sole in the rest pose
    if (this.cast.diagPalms) console.log(`diag:rest foot ${this.footH.toFixed(3)} toes ${wp("leftToes").y.toFixed(3)} hips ${this.hipH.toFixed(3)}`);
    // the house look takes ordinary materials: each VRM material becomes a standard one with its texture and a role
    hideCoveredSkin(vrm);
    this.mats = {};
    vrm.scene.traverse((o) => {
      if (!o.isMesh) return;
      o.frustumCulled = false; o.castShadow = true; o.receiveShadow = true;
      // the model's own MToon outline pass (three-vrm adds it as a second material and a second geometry group,
      // "<name> (Outline)"): dropped, group and all, so each surface is one material and the house ink lines draw
      // round it (with the pair in place the house lines never drew on the clothes and skin, 6 Nov test)
      const ms = [].concat(o.material);
      if (ms.length > 1 && o.geometry.groups.length) {
        const keep = ms.map((m) => !(m.isOutline || /\(Outline\)/.test(m.name || "")));
        if (keep.some((k) => !k)) {
          const g = o.geometry, idx = ms.map((_, i) => keep.slice(0, i).filter(Boolean).length);
          g.groups = g.groups.filter((gr) => keep[gr.materialIndex]).map((gr) => ({ ...gr, materialIndex: idx[gr.materialIndex] }));
          o.material = ms.filter((_, i) => keep[i]);
          if (o.material.length === 1) { o.material = o.material[0]; g.clearGroups(); }
        }
      }
      o.material = [].concat(o.material).map((m) => this._material(m));
      if (o.material.length === 1) o.material = o.material[0];
    });
    this.skinMat = Object.values(this.mats).find((m) => m.userData.lookRole === "skin") || null;
    // (the potato's own face stays built but hidden with the rest of the potato: the model's face does the eyes,
    // blinks and mouth)
    this.perf = new Performance(this.cast.perform || [], humanClips(), this.cast.fingers || [], this.legLen);
    this.R0 = new THREE.Quaternion();
    this._q = new THREE.Quaternion(); this._x = new THREE.Vector3(1, 0, 0); this._qi = new THREE.Quaternion(); this._e = new THREE.Euler(); this._ta = new THREE.Vector3();
  }

  _material(m) {
    const name = m.name || "", L = this.def.look || {};
    // the model's own MToon outline pass (three-vrm adds it as a second material, "<name> (Outline)"): as an ordinary
    // material it drew the surface again a little fatter in its texture colour, a pale halo round the clothes; the
    // house ink lines replace it
    if (m.isOutline || /\(Outline\)/.test(name)) { const off = new THREE.MeshBasicMaterial({ visible: false }); off.name = name; off.userData.outlineParameters = { visible: false }; return off; }
    const look = Object.entries(L).find(([k]) => name.includes(k))?.[1] || {};
    if (/Body_INNER_/.test(name)) {
      const inn = this.def.inner || {}, out = new THREE.MeshBasicMaterial({ color: /LEGS/.test(name) ? inn.legs || "#14161f" : inn.top || "#3a1d1a" });
      out.userData.outlineParameters = { visible: false }; out.name = name; return out;
    }
    const role = look.role || (/_SKIN/.test(name) ? "skin" : /_HAIR/.test(name) ? "hair" : /_CLOTH/.test(name) ? "cloth" : "flat");
    let map = m.map || m.uniforms?.map?.value || null;
    if (map && (look.hue || look.sat || look.light || look.tint || look.flatten != null)) map = recolor(map, look);
    if (map && look.iris) { map = map.clone(); map.needsUpdate = true; map.repeat.set(1 / look.iris, 1 / look.iris); map.offset.set(0.5 - 0.5 / look.iris, 0.5 - 0.5 / look.iris); map.wrapS = map.wrapT = THREE.ClampToEdgeWrapping; }
    const base = m.color || m.uniforms?.litFactor?.value || new THREE.Color(1, 1, 1);
    const color = look.color ? new THREE.Color(look.color) : new THREE.Color(base.r ?? 1, base.g ?? 1, base.b ?? 1);
    const transparent = !!m.transparent;
    // cut-out parts (the body under the clothes, hair strands, the iris) keep the model's 0.5 alpha cut-off
    const alphaTest = Math.max(m.alphaTest || 0, !transparent && /Body_00_SKIN|_CLOTH|_HAIR|EyeIris/.test(name) ? 0.5 : 0);
    let out;
    if (role === "flat") {
      // painted face parts: eyes, brows, lashes, mouth: flat colour, no light, no lines
      out = new THREE.MeshBasicMaterial({ map, color, transparent, alphaTest, side: m.side, depthWrite: m.depthWrite });
      out.userData.outlineParameters = { visible: false };
    } else {
      out = new THREE.MeshStandardMaterial({ map, color, transparent, alphaTest: alphaTest || (transparent ? 0 : 0), side: m.side, roughness: 0.9, metalness: 0, depthWrite: m.depthWrite });
      out.userData.lookRole = role === "hair" ? "hair" : role;
      // ink: Ghibli line art is one dark warm brown everywhere (the house rule darkens the base colour, which is white
      // here because the texture carries the colour, so it would draw grey); no rim glow, which read as a pale halo
      out.userData.noShine = true;
      out.userData.lineColor = look.line || this.def.line || "#2e211c";
      out.userData.lineK = look.lineK || this.def.lineK || 1;
      if (transparent) out.userData.noOutline = true;
    }
    out.name = name; out.userData.vrmName = name;
    this.mats[name] = out;
    return out;
  }

  // the pose at t onto the model: root place and every humanoid bone's turn
  _vrmPose(t) {
    const P = this.perf.at(t); if (!P) return null;
    const W = worldPose(P), nb = this.nb, R0 = this.R0;
    const hips = nb.hips, rig = hips.parent;
    rig.updateMatrixWorld(true); rig.getWorldQuaternion(R0);
    // a world turn away from the T pose W (times the bone's rest alignment A) becomes the rig-space turn D: R0 D = W A F,
    // F = the rig's rest turn inside a root that faces +z
    const R0i = R0.clone().invert(), D = {};
    for (const b of ORDER) {
      const c = this.map[b]; if (!nb[b] || !W[c]) continue;
      const Wa = this.A[b] ? W[c].q.clone().multiply(this.A[b]) : W[c].q.clone();
      D[b] = R0i.clone().multiply(Wa).multiply(this.F);
    }
    for (const b of ORDER) {
      if (!D[b]) continue;
      let p = nb[b].parent, pd = null;
      while (p && !pd) { const k = ORDER.find((x) => nb[x] === p); pd = k ? D[k] : null; if (p === rig) break; p = p.parent; }
      nb[b].quaternion.copy(pd ? pd.clone().invert().multiply(D[b]) : D[b]);
    }
    // wrists: the database's hand markers are noisy (palms flip up mid-walk), so the hand keeps only part of its
    // recorded turn against the forearm ("wristCalm" 0..1, how much is calmed)
    const wc = this.def.wristCalm ?? 0.6;
    if (wc) for (const b of ["leftHand", "rightHand"]) if (nb[b]) nb[b].quaternion.slerp(this._qi, wc);
    // posture: the recorded actors look at the floor and hunch; anime people stand tall and look ahead, so the neck,
    // head and chest get a small lift about their own side axis (character "posture", a cast entry can override it)
    const pos = { ...(this.def.posture || {}), ...(this.cast.posture || {}) };
    // a value is a lift about the bone's side axis, or [x, y, z] turns (radians, the bone's own axes). Cast "poses":
    // [{ from, to, ramp, bones: {...} }] adds more for a while, eased in and out over ramp seconds (e.g. the boxing
    // guard held a little further from the bigger anime face)
    const add = (b, a, w) => { if (!nb[b] || !a) return; const v = Array.isArray(a) ? a : [a, 0, 0]; this._e.set(v[0] * w, v[1] * w, v[2] * w); nb[b].quaternion.multiply(this._q.setFromEuler(this._e)); };
    for (const [b, a] of Object.entries(pos)) add(b, a, 1);
    for (const k of this.cast.poses || []) {
      const r = k.ramp ?? 0.2, w = Math.min(smooth((t - k.from) / r + 1), smooth((k.to - t) / r + 1));
      if (w > 0) for (const [b, a] of Object.entries(k.bones || {})) add(b, a, w);
    }
    // the hips: the performance's root, in the rig's space
    hips.position.copy(rig.worldToLocal(P.pos.clone()));
    // fingers: a curl 0 (open) .. 1 (fist) for each hand, every joint of a finger sharing it, the thumb folding across
    const fc = this.perf.fingersAt(t);
    // a hand at rest is never flat: the fingers keep a relaxed curl ("restCurl") unless the performance closes them more
    const rc = this.cast.fingers?.length ? 0 : this.def.restCurl ?? 0.4;   // (a cast entry with its own finger keys sets every curl itself: flat palms on the ground in a handspring)
    // (a VRM 0.x model is turned half round, so its normalized finger axes are too: curl the other way, or the fingers
    // bend backwards, 6 Nov)
    const fl = this.vrm.meta?.metaVersion === "0" ? -1 : 1;
    for (const [side, c, sx] of [["left", Math.max(rc, fc.L), fl], ["right", Math.max(rc, fc.R), -fl]]) {
      FINGERS.forEach((f, i) => {
        const spread = (1 - c) * (i - 1.5) * 0.06;
        const k = [0.95, 1.25, 0.9];
        ["Proximal", "Intermediate", "Distal"].forEach((j, n) => {
          const bone = nb[`${side}${f}${j}`]; if (!bone) return;
          bone.quaternion.setFromEuler(new THREE.Euler(0, n === 0 ? spread * sx : 0, -sx * (c * k[n] + 0.12)));
        });
      });
      const th = [nb[`${side}ThumbMetacarpal`] || nb[`${side}ThumbProximal`], nb[`${side}ThumbProximal`] && nb[`${side}ThumbMetacarpal`] ? nb[`${side}ThumbProximal`] : nb[`${side}ThumbIntermediate`], nb[`${side}ThumbDistal`]];
      // the thumb folds across the front of the fist (axis picked from six tried on the VRoid base, 6 Nov)
      const A0 = this.def.thumbAxis || [0, -1, 0], ax = (side === "right" ? this._ta.set(A0[0], A0[1], A0[2]) : this._ta.set(A0[0], -A0[1], -A0[2])).normalize();   // (given for the right hand; the left is its mirror)
      th.forEach((bone, n) => { if (bone) bone.quaternion.setFromAxisAngle(ax, c * [0.5, 0.55, 0.5][n] * (this.def.thumbK ?? 1)); });
    }
    if (this.def.ground !== false) this._ground();
    this.vrm.humanoid.update();
    return P;
  }

  // the feet on the floor: the recorded actor's legs are not this body's legs, so a planted foot came out floating
  // a few cm or sunk into the ground (seated feet 6 cm under, 6 Nov). The hips come down when both feet hover a
  // little (never in a jump: the drop fades out between 6 and 14 cm), then each leg is bent or stretched (two-bone
  // turn, the knee kept on its own side, the foot's turn kept) so an ankle near the floor sits at its rest height and
  // one under it is lifted out. Character "ground": false turns it off
  _ground() {
    const nb = this.nb, fh = this.footH, V = THREE.Vector3; if (!fh || !nb.hips) return;
    const legs = ["left", "right"].map((sd) => [nb[`${sd}UpperLeg`], nb[`${sd}LowerLeg`], nb[`${sd}Foot`]]).filter((l) => l.every(Boolean));
    nb.hips.parent.updateMatrixWorld(true);
    const ay = () => Math.min(...legs.map((l) => l[2].getWorldPosition(new V()).y)) - fh;
    const d0 = ay();
    if (d0 > 0) {
      const drop = d0 * (1 - smooth((d0 - 0.06) / 0.08));
      if (drop > 1e-4) { const w = nb.hips.getWorldPosition(new V()); w.y -= drop; nb.hips.position.copy(nb.hips.parent.worldToLocal(w)); nb.hips.parent.updateMatrixWorld(true); }
    }
    const wq = (o) => o.getWorldQuaternion(new THREE.Quaternion());
    const setW = (o, q) => o.quaternion.copy(wq(o.parent).invert().multiply(q));
    for (const [U, L, F] of legs) {
      const h = U.getWorldPosition(new V()), k = L.getWorldPosition(new V()), a = F.getWorldPosition(new V()), d = a.y - fh;
      const dn = d < 0 ? 0 : d < 0.04 ? (d * d) / 0.08 : d - 0.02;
      if (Math.abs(dn - d) < 5e-4) continue;
      const T = a.clone(); T.y = fh + dn;
      const fq = wq(F), la = h.distanceTo(k), lb = k.distanceTo(a);
      const ok = k.clone().sub(h).normalize();
      let n = ok.clone().cross(a.clone().sub(k)); if (n.lengthSq() < 1e-8) n = ok.clone().cross(T.clone().sub(h)); if (n.lengthSq() < 1e-8) n.set(1, 0, 0); n.normalize();
      const ht = T.clone().sub(h), dist = Math.min(ht.length(), la + lb - 1e-4), dir = ht.normalize();
      const A = Math.acos(Math.max(-1, Math.min(1, (la * la + dist * dist - lb * lb) / (2 * la * dist))));
      const k1 = dir.clone().applyAxisAngle(n, A), k2 = dir.clone().applyAxisAngle(n, -A), kd = k1.dot(ok) >= k2.dot(ok) ? k1 : k2;
      setW(U, new THREE.Quaternion().setFromUnitVectors(ok, kd).multiply(wq(U))); U.updateMatrixWorld(true);
      const kk = L.getWorldPosition(new V()), aa = F.getWorldPosition(new V());
      setW(L, new THREE.Quaternion().setFromUnitVectors(aa.sub(kk).normalize(), T.clone().sub(kk).normalize()).multiply(wq(L))); L.updateMatrixWorld(true);
      setW(F, fq); F.updateMatrixWorld(true);
    }
  }

  apply(st, t) {
    super.apply(st, t);
    this.potatoParts.visible = false;
    for (const c of this.root.children) if (c !== this.bodyRoot) c.visible = false;
    const P0 = this.perf.at(t);
    if (P0) {
      // the root stands under the pelvis and turns with the body (holds, contact shadows and checks find her there)
      const par = this.root.parent;
      if (par) {
        par.updateMatrixWorld(true);
        const g = new THREE.Vector3(P0.pos.x, 0, P0.pos.z).applyMatrix4(new THREE.Matrix4().copy(par.matrixWorld).invert());
        this.root.position.x = g.x; this.root.position.z = g.z;
        const f = new THREE.Vector3(0, 0, 1).applyQuaternion(P0.q.root); f.y = 0;
        if (f.lengthSq() > 1e-6) this.root.rotation.set(0, Math.atan2(f.x, f.z), 0);
      }
      this.root.updateMatrixWorld(true);
      // hair and skirt springs: from rest 0.6 s before t, stepped at 60 Hz up to t (a pure function of t)
      const sb = this.vrm.springBoneManager, dt = 1 / 60;
      if (sb) {
        // (a segment with blend 0 is a cut: the body jumps to a new place, so the springs start there, not swinging
        // over from the last shot)
        const cut = this.perf.L.filter((g) => g.blend === 0 && g.at <= t).reduce((a, g) => Math.max(a, g.at), 0);
        let s = Math.max(0, t - 0.6, cut);
        this._vrmPose(s); this.vrm.scene.updateMatrixWorld(true); sb.reset();
        while (s + dt <= t + 1e-6) { s += dt; this._vrmPose(s); this.vrm.scene.updateMatrixWorld(true); sb.update(dt); }
      }
      this._vrmPose(t);
    }
    // the face: blinks (fast close, slow open, about every 3 s, never two alike) and the expression's shapes
    const E = this.vrm.expressionManager;
    if (E) {
      let blink = 0;
      for (let i = 0; i < 12; i++) {
        const at = 0.7 + i * 2.9 + hash(i + (this.def.seed || 1)) * 1.4, u = (t - at) * 30;
        if (u >= 0 && u < 3) blink = Math.max(blink, smooth(u / 2.2));
        else if (u >= 3 && u < 8) blink = Math.max(blink, 1 - smooth((u - 3) / 5));
      }
      E.setValue("blink", blink);
      const ex = this.cast.face || {};
      for (const [k, v] of Object.entries(ex)) E.setValue(k, v);
      E.update();
    }
    this.vrm.scene.updateMatrixWorld(true);
    // the potato's hands and feet ride on the person's (hidden): holds put a prop in her palm, contact shadows land
    // under her shoes
    const rootInv = new THREE.Matrix4().copy(this.root.matrixWorld).invert(), H = this.vrm.humanoid;
    for (const [S, side] of [["L", "left"], ["R", "right"]]) {
      const hand = H.getRawBoneNode(`${side}Hand`), mid = H.getRawBoneNode(`${side}MiddleProximal`);
      const hp = hand.getWorldPosition(new THREE.Vector3()), mp = mid ? mid.getWorldPosition(new THREE.Vector3()) : hp;
      const palm = hp.clone().lerp(mp, 0.7).applyMatrix4(rootInv);
      if (this.cast.diagPalms) { const w = hp.clone().lerp(mp, 0.7), f = H.getRawBoneNode(`${side}Foot`).getWorldPosition(new THREE.Vector3()), pv = H.getRawBoneNode("hips").getWorldPosition(new THREE.Vector3()); console.log(`diag:palm t=${t.toFixed(3)} ${S} ${w.x.toFixed(3)} ${w.y.toFixed(3)} ${w.z.toFixed(3)} foot ${f.x.toFixed(3)} ${f.y.toFixed(3)} ${f.z.toFixed(3)} knee ${H.getRawBoneNode(`${side}LowerLeg`).getWorldPosition(new THREE.Vector3()).toArray().map((v) => v.toFixed(3)).join(" ")} hips ${pv.x.toFixed(3)} ${pv.y.toFixed(3)} ${pv.z.toFixed(3)}`); }   // (cast diagPalms: where the palms really are, for placing props)
      const hq = hand.getWorldQuaternion(new THREE.Quaternion()).premultiply(this.root.getWorldQuaternion(new THREE.Quaternion()).invert());
      const A = this.arms[S].hand; A.quaternion.copy(hq);
      const gp = A.userData.grip ? A.userData.grip.position.clone().applyQuaternion(hq) : new THREE.Vector3();
      A.position.copy(palm).sub(gp);
      this.arms[S].elbow = H.getRawBoneNode(`${side}LowerArm`).getWorldPosition(new THREE.Vector3()).applyMatrix4(rootInv);
      this.arms[S].shoulder = H.getRawBoneNode(`${side}UpperArm`).getWorldPosition(new THREE.Vector3()).applyMatrix4(rootInv);
      this.arms[S].joint = true;
      const fp = H.getRawBoneNode(`${side}Foot`).getWorldPosition(new THREE.Vector3()).applyMatrix4(rootInv);
      this.legs[S].foot.position.set(fp.x, Math.max(0.03, fp.y - 0.06), fp.z);
    }
  }
  handWorld(s) { return this.vrm.humanoid.getRawBoneNode(s === "l" ? "leftHand" : "rightHand").getWorldPosition(new THREE.Vector3()); }
}

// a texture with its colours shifted (look entry hue degrees, sat and light factors, tint "#rrggbb" mixed by tintK)
function recolor(tex, o) {
  const img = tex.image; if (!img || !img.width) return tex;
  const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
  const g = c.getContext("2d"); g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, c.width, c.height), p = d.data, col = new THREE.Color(), hsl = {};
  const tint = o.tint ? new THREE.Color(o.tint) : null, tk = o.tintK ?? 0.6;
  // flatten k (0..1): the painted airbrush shading pulled toward the surface's middle tone, so the house look's one
  // hard shadow does the shading (Ghibli cels are flat colour); seams and lines (dark pixels) stay as drawn
  let mid = 0.5;
  if (o.flatten != null) { const ls = []; for (let i = 0; i < p.length; i += 64) if (p[i + 3] > 128) { col.setRGB(p[i] / 255, p[i + 1] / 255, p[i + 2] / 255); col.getHSL(hsl); ls.push(hsl.l); } ls.sort((a, b) => a - b); mid = ls[Math.floor(ls.length * 0.6)] ?? 0.5; }
  for (let i = 0; i < p.length; i += 4) {
    col.setRGB(p[i] / 255, p[i + 1] / 255, p[i + 2] / 255); col.getHSL(hsl);
    if (o.flatten != null && hsl.l > mid * 0.55) hsl.l = mid + (hsl.l - mid) * o.flatten;
    if (tint) { const th = {}; tint.getHSL(th); hsl.h = th.h; hsl.s = hsl.s * (1 - tk) + th.s * tk; hsl.l = hsl.l * (1 - tk) + th.l * tk * (0.6 + hsl.l * 0.8); }
    hsl.h = (hsl.h + (o.hue || 0) / 360 + 1) % 1; hsl.s = Math.min(1, hsl.s * (o.sat ?? 1)); hsl.l = Math.min(1, hsl.l * (o.light ?? 1));
    col.setHSL(hsl.h, hsl.s, hsl.l); p[i] = col.r * 255; p[i + 1] = col.g * 255; p[i + 2] = col.b * 255;
  }
  g.putImageData(d, 0, 0);
  const t = new THREE.CanvasTexture(c); t.flipY = tex.flipY; t.colorSpace = tex.colorSpace; t.wrapS = tex.wrapS; t.wrapT = tex.wrapT; t.channel = tex.channel;
  return t;
}

// the body under the clothes: a VRoid body is whole under its clothes, and once the arms come down from the T pose its
// shoulders and upper arms poke through the sleeves (skin patches on the hoodie, 6 Nov test). Every body triangle whose
// three corners have cloth just outside them (within 15 cm along the normal, in the rest pose: the baggy hoodie stands off the ribs by more than 6 cm, 6 Nov) is dropped, once, at load
function hideCoveredSkin(vrm) {
  vrm.scene.updateMatrixWorld(true);
  const body = [], cloth = [];
  vrm.scene.traverse((o) => {
    if (!o.isMesh) return;
    for (const m of [].concat(o.material)) { if (/Body_00_SKIN/.test(m.name)) body.push(o); else if (/_CLOTH/.test(m.name)) cloth.push(o); }
  });
  if (!body.length || !cloth.length) return;
  // the cloth as plain meshes in the rest pose (a skinned mesh's raycast skins every corner it tests: far too slow)
  const stat = cloth.map((o) => { const m = new THREE.Mesh(o.geometry, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide })); m.matrixWorld.copy(o.matrixWorld); m.matrixAutoUpdate = false; return m; });
  const ray = new THREE.Raycaster(); ray.far = 0.15;
  const p = new THREE.Vector3(), n = new THREE.Vector3(), nm = new THREE.Matrix3();
  for (const o of new Set(body)) {
    const g = o.geometry, P = g.attributes.position, N = g.attributes.normal, idx = g.index; if (!idx || !N) continue;
    nm.getNormalMatrix(o.matrixWorld);
    const covered = new Uint8Array(P.count);
    for (let i = 0; i < P.count; i++) {
      p.fromBufferAttribute(P, i).applyMatrix4(o.matrixWorld); n.fromBufferAttribute(N, i).applyMatrix3(nm).normalize();
      ray.set(p.clone().addScaledVector(n, -0.004), n);
      covered[i] = ray.intersectObjects(stat, false).length ? 1 : 0;
    }
    // what is left of the body under the sleeves and trousers (the arms and legs, hands excepted) is drawn in the clothes' own inside colour: where a baggy sleeve opens at the armpit or a corner of the
    // body pokes through, it reads as a fold in the cloth, never as a skin patch (6 Nov: a bare diamond on the sleeve)
    const SI = g.attributes.skinIndex, SW = g.attributes.skinWeight, bones = o.skeleton?.bones || [];
    const H = vrm.humanoid, open = new Set(), legs = new Set();
    const under = (n, set) => { const b = H.getRawBoneNode(n); if (b) b.traverse((x) => set.add(x)); };
    // (the middle of the chest stays skin, 9 cm each side: the hoodie's V neck shows it; the sides go inner)
    const arms = new Set();
    for (const n of ["neck", "leftHand", "rightHand"]) under(n, open);
    for (const n of ["leftUpperLeg", "rightUpperLeg"]) under(n, legs);
    for (const n of ["leftShoulder", "rightShoulder"]) under(n, arms);
    const kind = new Uint8Array(P.count);   // 0 skin, 1 top, 2 legs
    if (SI && SW) for (let i = 0; i < P.count; i++) {
      let best = 0, bw = -1; for (let k = 0; k < 4; k++) { const w = SW.getComponent(i, k); if (w > bw) { bw = w; best = SI.getComponent(i, k); } }
      const bone = bones[best]; kind[i] = !bone || open.has(bone) ? 0 : legs.has(bone) ? 2 : arms.has(bone) ? 1 : Math.abs(p.fromBufferAttribute(P, i).applyMatrix4(o.matrixWorld).x) < 0.09 ? 0 : 1;
    }
    const lists = [[], [], []];
    for (let t = 0; t < idx.count; t += 3) {
      const a = idx.getX(t), b = idx.getX(t + 1), c = idx.getX(t + 2); if (covered[a] && covered[b] && covered[c]) continue;
      const v = [kind[a], kind[b], kind[c]], k = v.filter((x) => x === 0).length >= 2 ? 0 : v.filter((x) => x === 2).length >= 2 ? 2 : 1;
      lists[k].push(a, b, c);
    }
    g.setIndex([...lists[0], ...lists[1], ...lists[2]]); g.clearGroups();
    let at = 0; lists.forEach((l, i) => { if (l.length) g.addGroup(at, l.length, i); at += l.length; });
    const skin = [].concat(o.material)[0];
    const inner = (nm) => { const m = new THREE.MeshBasicMaterial(); m.name = nm; return m; };
    o.material = [skin, inner("Body_INNER_TOP"), inner("Body_INNER_LEGS")];
  }
}
