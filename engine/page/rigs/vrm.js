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
import { buildGarments, poseTails } from "./vrm-garments.js";

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
    // character "garments" (vrm-garments.js, 7 Nov 2026): sleeves cut, vests, wraps, bands; before the covered skin
    // is hidden, so a cut uncovers skin and a garment covers it
    this.garb = buildGarments(vrm, def.garments);
    hideCoveredSkin(vrm, this.def.bare || [], this.def.inner !== false);
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
    // character "faceLight" (own character creator, 8 Nov 2026; research "Human looking anime character design"): an
    // anime face stays lit and the jaw throws a fixed shadow on the neck (Arc System Works' per-vertex shading shift):
    // the head's ellipsoid, measured here from the skin the head bone carries, rides the head bone and the set "cel"
    // shading reads it (looks.js CEL_HEAD). { k: how far the face's shadow line is pushed back (N.L), neck: shadow
    // depth under the jaw in metres (0 = none) }
    if (def.faceLight) this.faceFrame = headFrame(vrm, this.root, def.faceLight);
    if (this.faceFrame) for (const m of Object.values(this.mats)) if (m.userData.lookRole === "skin") m.userData.faceFrame = this.faceFrame;
    // character "hairSelfShadow": false (own character creator, 8 Nov 2026): the hair takes no cast shadow (each lock's
    // hard-edged shadow on the locks under it drew blocky patches no drawn sheet has); it still shades by its own
    // normals and still throws its shadow on the face and the clothes
    if (def.hairSelfShadow === false) vrm.scene.traverse((o) => { if (o.isMesh && [].concat(o.material).every((m) => m.userData.lookRole === "hair")) o.receiveShadow = false; });
    // (the potato's own face stays built but hidden with the rest of the potato: the model's face does the eyes,
    // blinks and mouth)
    this.perf = new Performance(this.cast.perform || [], humanClips(), this.cast.fingers || [], this.legLen);
    this.R0 = new THREE.Quaternion();
    this._q = new THREE.Quaternion(); this._x = new THREE.Vector3(1, 0, 0); this._qi = new THREE.Quaternion(); this._e = new THREE.Euler(); this._ta = new THREE.Vector3();
    this.armLen = wp("leftUpperArm").distanceTo(wp("leftLowerArm")) + wp("leftLowerArm").distanceTo(wp("leftHand")) + (H.getRawBoneNode("leftMiddleProximal") ? wp("leftHand").distanceTo(wp("leftMiddleProximal")) * 0.7 : 0);
    this.toeH = this.nb.leftToes ? (wp("leftToes").y + wp("rightToes").y) / 2 : this.footH;
    // (the head's rest turn inside the root, for posture "level": which way the face points)
    if (this.nb.head) this.headRest = this.root.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(this.nb.head.getWorldQuaternion(new THREE.Quaternion())).invert();
    if (this.def.ground !== false && this.perf.L.length) this._autoFloor();
    if (this.def.ground !== false && this.def.contacts !== false && this.cast.contacts !== false && this.perf.L.length) this.plan = this._planContacts();
    if (this.def.ground !== false && this.perf.L.length && (this.cast.seat || []).length) this._seatFeet = this._planSeatFeet();
  }

  // seated knees (human motion v5, 7 Nov 2026): this anime body's shins are long (ankle + shin 0.59 m: a real 1.7 m man's
  // popliteal height is about 0.43, ANSUR II 0.245 of stature), so on an ordinary 42 cm chair its knees stood 8 cm over
  // its hip joints: the thigh of a grown-up on a child's stool (CMU stepstool sitters 13_04, 14_32: +8 to +10 degrees,
  // knees 6-8 cm high; ordinary chair sitters 113_15, 143_18, 14_31, 86_15: -7 to +5 degrees). A real sitter whose chair
  // is too low slides the feet forward once the weight is on the seat, so the shins lean and the knees come down. After
  // each cast "seat" lands, each foot takes a small settling step forward (lifted 3.5 cm, 0.4 s, the needier foot first,
  // the other 0.22 s later) just far enough that the thigh slopes "slope" (default 6 degrees, knee over the hip joint, the ordinary-chair sitters top end).
  // Seat entry or character "sitFeet": { slope, lift, dur, gap, delay, max } or false.
  _planSeatFeet() {
    const V = THREE.Vector3, nb = this.nb, out = [];
    for (const g of this.cast.seat || []) {
      const o = g.feet === false || this.def.sitFeet === false ? null : { slope: 6, lift: 0.035, dur: 0.45, gap: 0.22, delay: 0.05, max: 0.4, ...(this.def.sitFeet || {}), ...(g.feet || {}) };
      if (!o) continue;
      const r = g.ramp ?? 0.4, t0 = g.from + r + o.delay, ts = Math.min(g.to - 0.01, t0 + 0.05);
      this._vrmPose(ts); nb.hips.parent.updateMatrixWorld(true);
      const legs = {};
      for (const sd of ["left", "right"]) {
        const H = nb[`${sd}UpperLeg`].getWorldPosition(new V()), K = nb[`${sd}LowerLeg`].getWorldPosition(new V()), A = nb[`${sd}Foot`].getWorldPosition(new V());
        const la = H.distanceTo(K), lb = K.distanceTo(A), s = (o.slope * Math.PI) / 180, kY = H.y + la * Math.sin(s);
        // (the step goes the way the body faces, a third of it along the thigh: knees that fall open would carry the feet
        // wide apart)
        const lat = nb.leftUpperLeg.getWorldPosition(new V()).sub(nb.rightUpperLeg.getWorldPosition(new V())).setY(0).normalize(), fw = lat.clone().cross(new V(0, 1, 0)).normalize();
        const th = K.clone().sub(H).setY(0); if (th.lengthSq() < 1e-6) continue; th.normalize();
        if (fw.dot(th) < 0) fw.negate();
        const dir = fw.multiplyScalar(0.67).addScaledVector(th, 0.33).normalize();
        const dA = la * Math.cos(s) + Math.sqrt(Math.max(0, lb * lb - (kY - A.y) ** 2)), dA0 = A.clone().sub(H).dot(th);
        const d = K.y > kY + 0.005 ? Math.min(o.max, Math.max(0, (dA - dA0) / Math.max(0.5, dir.dot(th)))) : 0;
        if (d > 0.005) legs[sd] = { dir, d, kneeY: K.y, hipY: H.y };
      }
      const order = Object.keys(legs).sort((a, b) => legs[b].d - legs[a].d);
      order.forEach((sd, i) => Object.assign(legs[sd], { t0: t0 + i * o.gap, t1: t0 + i * o.gap + o.dur }));
      if (this.cast.diagFeet || this.cast.diagJoints) console.log(`diag:sitfeet ${g.from} ${order.map((sd) => `${sd} ${(legs[sd].d * 100).toFixed(1)}cm knee-over-hip ${((legs[sd].kneeY - legs[sd].hipY) * 100).toFixed(1)}cm`).join(", ")}`);
      out.push({ from: g.from, to: g.to, ramp: r, lift: o.lift, legs });
    }
    return out;
  }
  // a foot's settling step at t: { v: the forward shift so far, up: its lift, p: 0..1 (1 = put down) } or null
  _seatFootAt(sd, t) {
    if (!this._seatFeet || t == null) return null;
    for (const s of this._seatFeet) {
      const L = s.legs[sd]; if (!L || t < L.t0 || t > s.to + s.ramp) continue;
      const p = Math.min(1, (t - L.t0) / (L.t1 - L.t0)), out = Math.min(1, smooth((s.to - t) / s.ramp + 1));
      return { v: L.dir.clone().multiplyScalar(L.d * smooth(p) * out), up: p < 1 ? s.lift * Math.sin(Math.PI * p) : 0, p };
    }
    return null;
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
      // the painting's key-light edge (set lighting 2) lifts dark cloth toward a light grey: in a deep bend the folded
      // trouser faces turn edge-on and the whole fold went grey (6 Nov pick-up). Dark cloth gets a faint edge, no back glow
      const kr = look.krimK ?? this.def.krimK?.[role];
      if (kr != null) out.userData.krimK = kr;
      if (transparent) out.userData.noOutline = true;
      // (our own character creator's face front: an anime face has no ink inside it, tools/character/face.py)
      if (/_NOLINE/.test(name)) out.userData.noOutline = true;
      // (and its hair inks only round the silhouette and on the free tips: "lineMask", the weights in the UVs)
      if (role === "hair" && this.def.lineMask) out.userData.lineMask = true;
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
    // shoulders: the database's collarbones never move (every take records 0 for them) and point 34 degrees up from the
    // neck, its T-pose marker geometry, so copying them held the shoulders in a permanent shrug (7 Nov, Jonny: "the
    // shoulders seem shrugged up"). The collarbone is set from the arm instead, as on a real body: at rest it hangs a
    // little below the model's own line, and it rises (about 6 degrees by a level arm, Ludewig 2009 / Inman) and comes
    // forward (reaching, punching) only as the arm lifts or reaches. Character/cast "shoulders": { rest, elev, prot,
    // back } (radians, radians per radian of arm lift), or false to copy the recording.
    const shp = this.cast.shoulders === false || this.def.shoulders === false ? null : { rest: -0.07, elev: 0.1, high: 0.12, prot: 0.14, back: 0.06, ...(this.def.shoulders || {}), ...(this.cast.shoulders || {}) };
    if (shp) for (const [sd, s, sx] of [["left", "l", 1], ["right", "r", -1]]) {
      const sb = `${sd}Shoulder`, h = W[`${s}humerus`], th = W.thorax || W.upperback;
      if (!D[sb] || !h || !th) continue;
      let p = nb[sb].parent, pk = null; while (p && !pk) { pk = ORDER.find((x) => nb[x] === p && D[x]) || null; if (p === rig) break; p = p.parent; }
      if (!pk) continue;
      const a = new THREE.Vector3(...BONES[`${s}humerus`][1]).applyQuaternion(h.q).applyQuaternion(th.q.clone().invert());
      const lift = Math.acos(Math.max(-1, Math.min(1, -a.y)));            // 0 hanging .. PI/2 level .. PI overhead
      const fwd = a.z, elev = shp.rest + shp.elev * Math.max(0, lift - 0.5) + shp.high * Math.max(0, lift - Math.PI / 2);
      const prot = shp.prot * Math.max(0, fwd) * smooth(lift / 0.8) - shp.back * Math.max(0, -fwd);
      this._e.set(0, -sx * prot, sx * elev);
      D[sb] = D[pk].clone().multiply(this._q.setFromEuler(this._e));
      if (this.cast.diagJoints) this._shDiag = { ...(this._shDiag || {}), [s]: [+lift.toFixed(2), +fwd.toFixed(2), +elev.toFixed(3), +prot.toFixed(3)] };
    }
    for (const b of ORDER) {
      if (!D[b]) continue;
      let p = nb[b].parent, pd = null;
      while (p && !pd) { const k = ORDER.find((x) => nb[x] === p); pd = k ? D[k] : null; if (p === rig) break; p = p.parent; }
      nb[b].quaternion.copy(pd ? pd.clone().invert().multiply(D[b]) : D[b]);
    }
    // wrists: the database's hand markers are noisy (palms flip up mid-walk), so the hand keeps only part of its
    // recorded turn against the forearm ("wristCalm" 0..1, how much is calmed)
    // (cast "calm": [{ from, to, ramp, k }] calms the wrists more for a while: the sit take's left hand flips 70
    // degrees in a frame as the actor feels for the chair, 6 Nov)
    let wc = this.def.wristCalm ?? 0.6;
    for (const g of this.cast.calm || []) { const r = g.ramp ?? 0.2, w = Math.min(smooth((t - g.from) / r + 1), smooth((g.to - t) / r + 1)); if (w > 0) wc += ((g.k ?? 0.95) - wc) * w; }
    if (wc) for (const b of ["leftHand", "rightHand"]) if (nb[b]) nb[b].quaternion.slerp(this._qi, wc);
    // soft elbows (human motion v5, 7 Nov 2026): a relaxed arm never locks straight (it hangs 10-15 degrees bent, and a
    // walker's elbow swings through 15-30 degrees without straightening, Gait & Posture 2018 review), but the walk and
    // jump actors' elbows reached 3 degrees, a stiff mannequin arm. An elbow under 1.5 x "min" is eased up to "min"
    // (default 0.21 rad, 12 degrees) in its own bend plane (forward when it is straight). Character "elbows": { min } or false
    const el = this.def.elbows === false || this.cast.elbows === false ? null : { min: 0.21, ...(this.def.elbows || {}), ...(this.cast.elbows || {}) };
    if (el && el.min > 0 && nb.leftUpperLeg && nb.rightUpperLeg) {
      rig.updateMatrixWorld(true);
      const V = THREE.Vector3, lat = nb.leftUpperLeg.getWorldPosition(new V()).sub(nb.rightUpperLeg.getWorldPosition(new V())).setY(0).normalize(), fw = lat.clone().cross(new V(0, 1, 0)).normalize();
      for (const sd of ["left", "right"]) {
        const U = nb[`${sd}UpperArm`], L = nb[`${sd}LowerArm`], Hd = nb[`${sd}Hand`]; if (!U || !L || !Hd) continue;
        const s0 = U.getWorldPosition(new V()), e0 = L.getWorldPosition(new V()), h0 = Hd.getWorldPosition(new V());
        const u = e0.clone().sub(s0).normalize(), f = h0.clone().sub(e0).normalize(), flex = Math.acos(Math.max(-1, Math.min(1, u.dot(f)))), m = el.min;
        if (flex >= 1.5 * m) continue;
        const want = flex + (m - flex) * (1 - smooth(flex / (1.5 * m))), d = want - flex; if (d < 1e-4) continue;
        let ax = u.clone().cross(f); if (flex < 0.1 || ax.lengthSq() < 1e-6) ax = u.clone().cross(fw); if (ax.lengthSq() < 1e-8) continue; ax.normalize();
        const lq = L.getWorldQuaternion(new THREE.Quaternion());
        L.quaternion.copy(L.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(new THREE.Quaternion().setFromAxisAngle(ax, d).multiply(lq))); L.updateMatrixWorld(true);
      }
    }
    // posture: the recorded actors look at the floor and hunch; anime people stand tall and look ahead, so the neck,
    // head and chest get a small lift about their own side axis (character "posture", a cast entry can override it)
    const pos = { ...(this.def.posture || {}), ...(this.cast.posture || {}) };
    // a value is a lift about the bone's side axis, or [x, y, z] turns (radians, the bone's own axes). Cast "poses":
    // [{ from, to, ramp, bones: {...} }] adds more for a while, eased in and out over ramp seconds (e.g. the boxing
    // guard held a little further from the bigger anime face)
    const add = (b, a, w) => { if (!nb[b] || !a) return; const v = Array.isArray(a) ? a : [a, 0, 0]; this._e.set(v[0] * w, v[1] * w, v[2] * w); nb[b].quaternion.multiply(this._q.setFromEuler(this._e)); };
    // (the lift is for an upright body: upside down in a handspring it threw the face onto the floor, 6 Nov, so it fades
    // out as the chest tips past level; with the palms on the floor the head tucks toward the chest, eyes on the hands)
    let up = 1;
    if (nb.head && nb.hips) { nb.hips.parent.updateMatrixWorld(true); const d = nb.head.getWorldPosition(new THREE.Vector3()).sub(nb.hips.getWorldPosition(new THREE.Vector3())).normalize(); up = smooth((d.y - 0.2) / 0.5); }
    // posture "level" (human motion v5, 7 Nov 2026): a fixed lift of neck and head (0.42 rad together) put right the
    // recorded actors' downward look while standing, but it tipped the head back wherever the actor already looked
    // ahead: seated against the chair back the face pointed 19 degrees up at the sky (actor: level). Real people keep
    // their eyes near level (the face drops 10-15 degrees to watch the ground ahead when walking), so with "level": k
    // (0..1) the face's own pitch decides the lift: a face pointing down by p is lifted by k p (at most "max", 0.45
    // rad), shared by neck and head; a face already level or up is left as recorded. The other posture entries
    // (chest) still add as before.
    if (pos.level != null && nb.head && nb.neck && this.headRest) {
      const qh = this.root.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(nb.head.getWorldQuaternion(new THREE.Quaternion())).multiply(this.headRest);
      const f = new THREE.Vector3(0, 0, 1).applyQuaternion(qh), p = Math.asin(Math.max(-1, Math.min(1, f.y)));
      // (while the eyes are on a gaze target, the face aims at it instead of the horizon: down at the apple it picks up)
      let want = 0;
      const gz = this._gazeAt(t);
      if (gz.g) { const hp = nb.head.getWorldPosition(new THREE.Vector3()), d = new THREE.Vector3(...gz.g.at).sub(hp); want = Math.atan2(d.y, Math.hypot(d.x, d.z)) * gz.w; }
      const lift = Math.min(pos.max ?? 0.45, Math.max(0, (want - p) * pos.level));
      if (lift > 0) { add("neck", lift * 0.5, up); add("head", lift * 0.5, up); }
      if (this.cast.diagJoints) this._pitch = [+(p * 57.3).toFixed(1), +(lift * 57.3).toFixed(1)];
    }
    for (const [b, a] of Object.entries(pos)) if (pos.level == null || (b !== "neck" && b !== "head" && b !== "level" && b !== "max")) add(b, a, up);
    if (this.plan && !this._lockOff) { const tk = this.def.contact?.tuck ?? -0.3, w = Math.max(this._contactAt(this.plan.left, t).wP, this._contactAt(this.plan.right, t).wP) * (1 - up); if (w > 0) { add("neck", tk, w); add("head", tk, w); } }
    for (const k of this.cast.poses || []) {
      const r = k.ramp ?? 0.2, w = Math.min(smooth((t - k.from) / r + 1), smooth((k.to - t) / r + 1));
      if (w > 0) for (const [b, a] of Object.entries(k.bones || {})) add(b, a, w);
    }
    // breathing: the chest rises and the shoulders lift a little on each breath (about 15 a minute, slower and deeper
    // once settled), a reason for the still moments to stay alive. Character/cast "breath": { rate, k } (k 0 = off)
    const br = { rate: 0.26, k: 1, ...(this.def.breath || {}), ...(this.cast.breath || {}) };
    if (br.k) {
      const ph = Math.sin(2 * Math.PI * br.rate * t + (this.def.seed || 0)), in_ = 0.5 + 0.5 * ph;
      add(nb.upperChest ? "upperChest" : "chest", -0.018 * br.k * in_, 1);
      add("leftShoulder", [0, 0, 0.02 * br.k * in_], 1); add("rightShoulder", [0, 0, -0.02 * br.k * in_], 1);
    }
    // the hips: the performance's root, in the rig's space
    // (palm support, see _planContacts: the body rides up on straight arms where the recorded hands would go under the floor)
    const lift = this._liftAt(t), hp = lift ? P.pos.clone().setY(P.pos.y + lift) : P.pos.clone();
    // seat contact: cast "seat": [{ from, to, ramp, y }]: the hips joint is brought to y (the seat top plus the
    // hips-to-sitting-bones depth), eased in over ramp seconds as the take sits, so the weight lands on the real seat
    // (v3: the take's own floor put the seated body 6 cm over the chair); the held feet stay where they are
    for (const g of this.cast.seat || []) { const r = g.ramp ?? 0.4, w = Math.min(smooth((t - g.from) / r), smooth((g.to - t) / r)); if (w > 0) hp.y += (g.y - hp.y) * w; }
    hips.position.copy(rig.worldToLocal(hp));
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
    if (this.def.ground !== false && !this._noGround) this._ground(t);
    if (!this._noGround) this._hands(t);
    this.vrm.humanoid.update();
    return P;
  }

  // the feet on the floor: the recorded actor's legs are not this body's legs, so a planted foot came out floating
  // a few cm or sunk into the ground (seated feet 6 cm under, 6 Nov) and slid across it (the retarget scales the
  // root's path by leg length, not the steps the legs take). The hips come down when both feet hover a little (never
  // in a jump: the drop fades out between 6 and 14 cm), then each leg is bent or stretched (two-bone turn, the knee
  // kept on its own side, the foot's turn kept) so an ankle near the floor sits at its rest height and one under it
  // is lifted out. Contacts (motion brief 6 Nov): the support plan (_planContacts) says when the heel and when the ball
  // of each foot is planted and where; a planted point is held where it landed (heel first, then the ball as the heel
  // peels off: the foot rolls over its active contact), and the hips give way when a held foot is out of reach.
  // Character "ground": false turns it all off, "contacts": false only the holding
  _ground(t) {
    const nb = this.nb, fh = this.footH, V = THREE.Vector3; if (!fh || !nb.hips) return;
    const legs = ["left", "right"].map((sd) => [nb[`${sd}UpperLeg`], nb[`${sd}LowerLeg`], nb[`${sd}Foot`], nb[`${sd}Toes`], sd]).filter((l) => l.slice(0, 3).every(Boolean));
    nb.hips.parent.updateMatrixWorld(true);
    const ay = () => Math.min(...legs.map((l) => l[2].getWorldPosition(new V()).y)) - fh;
    const d0 = ay();
    if (d0 > 0) {
      let drop = d0 * (1 - smooth((d0 - 0.06) / 0.08));
      // (not while the feet are still falling fast onto a landing: the drop came a frame early there and the hips fell
      // 15.5 cm in one frame of the jump's landing against the actor's 9, v4 reel; it fades out from 0.4 to 1.0 m/s down)
      const fy = this.footY; if (fy && t != null && drop > 0) { const i = Math.min(fy.v.length - 2, Math.max(1, Math.round(t / fy.dt))); if (fy.s[i - 1] === fy.s[i + 1]) { const vy = (fy.v[i + 1] - fy.v[i - 1]) / (2 * fy.dt); drop *= 1 - smooth((-vy - 0.4) / 0.6); } }
      // (and with a support plan only as much as a foot is planted: in a run's flight both feet hover too, and the drop
      // there went 6 -> 3.6 -> 5.9 cm over three frames, the hips spiking 4.5 cm over the actor's at every toe-off)
      // (a contact up to 0.15 s away still counts, fading with the distance, so the drop never switches off in a frame)
      if (this.plan && !this._lockOff && t != null && drop > 0) {
        let cw = 0;
        for (let o = -0.12; o <= 0.121; o += 0.04) for (const sd of ["left", "right"]) { const c = this._contactAt(this.plan[sd], t + o); cw = Math.max(cw, Math.max(c.wH, c.wT) * (1 - Math.abs(o) / 0.15)); }
        drop *= smooth(cw);
      }
      if (drop > 1e-4) { const w = nb.hips.getWorldPosition(new V()); w.y -= drop; nb.hips.position.copy(nb.hips.parent.worldToLocal(w)); nb.hips.parent.updateMatrixWorld(true); }
    }
    const wq = (o) => o.getWorldQuaternion(new THREE.Quaternion());
    const setW = (o, q) => o.quaternion.copy(wq(o.parent).invert().multiply(q));
    // each leg's target ankle: grounded height, then pulled onto its held contact
    const plan = this._lockOff ? null : this.plan, tg = [];
    // (the stance-width push, see _planContacts: along the line from the right hip to the left)
    let lat = null;
    if (this.width && !this._lockOff && t != null && nb.leftUpperLeg && nb.rightUpperLeg) lat = nb.leftUpperLeg.getWorldPosition(new V()).sub(nb.rightUpperLeg.getWorldPosition(new V())).setY(0).normalize();
    for (const [U, L, F, Tz, sd] of legs) {
      const a = F.getWorldPosition(new V()), d = a.y - fh;
      let sv = null;
      if (lat) { const W = this.width[sd], f = Math.min(W.length - 1, Math.max(0, t / this.width.dt)), i = Math.min(W.length - 2, Math.floor(f)), v = W.length > 1 ? W[i] + (W[i + 1] - W[i]) * (f - i) : W[0] || 0; if (v > 1e-5) { sv = lat.clone().multiplyScalar(sd === "left" ? v : -v); a.add(sv); } }
      // (without a support plan an ankle near the floor is eased onto it; with one only a held heel is put down, so a
      // swinging foot keeps its recorded clearance instead of being flattened onto the floor while it still travels)
      const c = plan && t != null ? this._contactAt(plan[sd], t) : null;
      let dn = d < 0 ? 0 : !this.plan ? (d < 0.04 ? (d * d) / 0.08 : d - 0.02) : c ? d * (1 - c.wH) : d;
      if (c?.nH) dn = Math.max(dn, c.nH.k * Math.hypot(a.x - c.nH.p.x, a.z - c.nH.p.z));
      const T = a.clone(); T.y = fh + dn;
      let wT = 0, toeY = 0;
      if (c) {
        if (c.wH > 0 || c.wT > 0) {
          const toe = Tz ? Tz.getWorldPosition(new V()) : a.clone(); if (Tz && sv) toe.add(sv);
          if (c.H) T.addScaledVector(new V(c.H.x - a.x, 0, c.H.z - a.z), c.wH);
          if (c.T) { T.addScaledVector(new V(c.T.x - toe.x, 0, c.T.z - toe.z), (1 - c.wH) * c.wT); wT = c.wT; toeY = c.T.y; }
        }
      }
      // (seated: the settling step forward, see _planSeatFeet; the ball lets go of the floor while the foot is up)
      const sf = this._seatFootAt(sd, t);
      if (sf) { T.add(sf.v); T.y += sf.up; if (sf.p < 1) wT *= 1 - Math.sin(Math.PI * sf.p); }
      tg.push({ U, L, F, Tz, T, wT, toeY, nT: c?.nT, cT: c?.T && !(sf && sf.p < 1) ? c.T : null, wB: c?.wT || 0, wHh: c?.wH || 0 });
    }
    // heel peel (human motion v5, 7 Nov 2026): the trailing foot of a long anime stride is held where it landed while
    // the hips travel on, and once it was out of reach the hips were pulled down to it (6-9 cm under the actor's at
    // every double support) and sprang back up the frame the hold let go, the foot jumping 7 cm with them (walk, v4
    // reel). A real trailing foot peels instead: the heel comes up and the foot pivots on its ball, which lengthens
    // the leg by up to a foot's rise. So a held ball out of reach lifts its ankle about the ball first (rise at most
    // contact "peel", 0.1 m), and only what is left pulls the hips
    const peelMax = this.def.contact?.peel ?? 0.1;
    if (peelMax > 0) for (const g of tg) {
      if (!g.cT || !(g.wB > 0) || !g.Tz) continue;
      const h = g.U.getWorldPosition(new V()), R = (h.distanceTo(g.L.getWorldPosition(new V())) + g.L.getWorldPosition(new V()).distanceTo(g.F.getWorldPosition(new V()))) * 0.985;
      const lf = g.F.getWorldPosition(new V()).distanceTo(g.Tz.getWorldPosition(new V())), base = this.footH - this.toeH;
      let rise = 0;
      for (let it = 0; it < 3; it++) {
        if (g.T.distanceTo(h) <= R) break;
        const hz = Math.hypot(g.T.x - h.x, g.T.z - h.z); if (hz >= R) break;
        const need = Math.min(peelMax - rise, h.y - Math.sqrt(R * R - hz * hz) - g.T.y); if (need <= 1e-4) break;
        // (the ankle swings up round the held ball: it comes closer to the ball as it rises)
        const r0 = Math.sqrt(Math.max(0, lf * lf - (base + rise) ** 2)), r1 = Math.sqrt(Math.max(0, lf * lf - (base + rise + need) ** 2));
        const tb = new V(g.cT.x - g.T.x, 0, g.cT.z - g.T.z); if (tb.lengthSq() > 1e-8) g.T.addScaledVector(tb.normalize(), (r0 - r1) * g.wB);
        g.T.y += need * g.wB; rise += need;
      }
      g.peel = rise;
    }
    // reach: a held foot the leg can't reach pulls the hips toward it (down and over) instead of the foot letting go
    const pull = new V();
    for (const g of tg) {
      const h = g.U.getWorldPosition(new V()), la = h.distanceTo(g.L.getWorldPosition(new V())), lb = g.L.getWorldPosition(new V()).distanceTo(g.F.getWorldPosition(new V()));
      const ht = g.T.clone().sub(h), ex = ht.length() - (la + lb) * 0.985;
      if (ex > 0) pull.addScaledVector(ht.normalize(), ex);
    }
    if (pull.lengthSq() > 1e-8) { const w = nb.hips.getWorldPosition(new V()).add(pull); nb.hips.position.copy(nb.hips.parent.worldToLocal(w)); nb.hips.parent.updateMatrixWorld(true); }
    for (const { U, L, F, Tz, T, wT, toeY, nT, cT, wB, wHh, peel } of tg) {
      const h = U.getWorldPosition(new V()), k = L.getWorldPosition(new V()), a = F.getWorldPosition(new V());
      if (a.distanceToSquared(T) > 2.5e-7) {
        const fq = wq(F), la = h.distanceTo(k), lb = k.distanceTo(a);
        const ok = k.clone().sub(h).normalize();
        let n = ok.clone().cross(a.clone().sub(k)); if (n.lengthSq() < 1e-8) n = ok.clone().cross(T.clone().sub(h)); if (n.lengthSq() < 1e-8) n.set(1, 0, 0); n.normalize();
        // soft reach: the last 1.5 % of the leg's length is eased, so a nearly straight knee never snaps
        const ht = T.clone().sub(h), raw = ht.length(), mx = la + lb, s0 = mx * 0.97;
        const dist = raw < s0 ? raw : s0 + (mx * 0.999 - s0) * (1 - Math.exp(-(raw - s0) / (mx * 0.999 - s0))), dir = ht.normalize();
        const A = Math.acos(Math.max(-1, Math.min(1, (la * la + dist * dist - lb * lb) / (2 * la * dist))));
        const k1 = dir.clone().applyAxisAngle(n, A), k2 = dir.clone().applyAxisAngle(n, -A), kd = k1.dot(ok) >= k2.dot(ok) ? k1 : k2;
        setW(U, new THREE.Quaternion().setFromUnitVectors(ok, kd).multiply(wq(U))); U.updateMatrixWorld(true);
        const kk = L.getWorldPosition(new V()), aa = F.getWorldPosition(new V());
        setW(L, new THREE.Quaternion().setFromUnitVectors(aa.sub(kk).normalize(), T.clone().sub(kk).normalize()).multiply(wq(L))); L.updateMatrixWorld(true);
        setW(F, fq); F.updateMatrixWorld(true);
      }
      // deep bends: knees track over the toes. Real deep squats (6 people measured, CMU 13, 22, 23, 69; anatomy texts)
      // open the knees 20-35 degrees out from straight ahead with the toes turned the same way; the pick-up actor's
      // thighs fell almost flat to the sides (61-88 degrees), which on this body read as a frog crouch (7 Nov). As the
      // knee folds past 70 degrees its bend plane turns about the hip-ankle line (the ankle stays put) until the knee
      // points `knees.out` off the body's forward. The foot keeps its own planted turn ("toe" > 0 turns it with the knee,
      // but a foot turning while its ball is held swings the ball 7 cm, 7 Nov). Character/cast "knees": { out, from, to, toe }
      if (this._kn !== false && lat) {
        const kn = this._kn ||= this.cast.knees === false || this.def.knees === false ? false : { out: 0.5, from: 1.2, to: 1.9, toe: 0, ...(this.def.knees || {}), ...(this.cast.knees || {}) };
        if (kn) {
          const h1 = U.getWorldPosition(new V()), k1 = L.getWorldPosition(new V()), a1 = F.getWorldPosition(new V());
          const flex = Math.PI - k1.clone().sub(h1).angleTo(a1.clone().sub(k1).negate());
          const w = smooth((flex - kn.from) / (kn.to - kn.from));
          if (w > 1e-3) {
            const sg = U === nb.leftUpperLeg ? 1 : -1, fw = lat.clone().cross(new V(0, 1, 0)).normalize();
            const want = fw.clone().applyAxisAngle(new V(0, 1, 0), sg * kn.out);   // (left knee turns toward +lat)
            const ax = a1.clone().sub(h1).normalize(), perp = (v) => v.clone().addScaledVector(ax, -v.dot(ax));
            const kv = perp(k1.clone().sub(h1)), dv = perp(want);
            // (only knees that fall wider than that are brought in: a sitter's or a lunger's knees are left alone)
            const kh = k1.clone().sub(h1), cur = Math.atan2(sg * kh.dot(lat), kh.dot(fw));
            if (cur > kn.out && kv.lengthSq() > 1e-6 && dv.lengthSq() > 1e-6) {
              kv.normalize(); dv.normalize();
              const ang = Math.atan2(kv.clone().cross(dv).dot(ax), kv.dot(dv)) * w;
              const fq = wq(F), q = new THREE.Quaternion().setFromAxisAngle(ax, ang);
              setW(U, q.clone().multiply(wq(U))); U.updateMatrixWorld(true);
              // the foot keeps its own turn, then yaws with the knee (toes out with it)
              const yaw = new THREE.Quaternion().setFromAxisAngle(new V(0, 1, 0), ang * kn.toe * (ax.y < 0 ? -1 : 1));
              setW(F, yaw.multiply(fq)); F.updateMatrixWorld(true);
            }
          }
        }
      }
      // a held ball stays where it landed (human motion v5, 7 Nov 2026): with the heel held too, only the foot's recorded
      // yaw moved the ball, swinging it round the heel 5-28 cm per stance (grab 28, punch 17, jump 14-16, v4 reel). The
      // foot now yaws about the ankle so the ball points at its held spot (a real planted foot pivots on heel or ball,
      // never slides; character/cast contact "yaw": false keeps the recorded turn)
      if (Tz && cT && wB > 0 && this.def.contact?.yaw !== false && this.cast.contact?.yaw !== false) {
        const an = F.getWorldPosition(new V()), to = Tz.getWorldPosition(new V());
        const a0 = Math.atan2(to.x - an.x, to.z - an.z), a1 = Math.atan2(cT.x - an.x, cT.z - an.z);
        let da = a1 - a0; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
        if (Math.hypot(to.x - an.x, to.z - an.z) > 0.03 && Math.hypot(cT.x - an.x, cT.z - an.z) > 0.03 && Math.abs(da) < 1.2 && Math.abs(da) > 1e-4) {
          setW(F, new THREE.Quaternion().setFromAxisAngle(new V(0, 1, 0), da * wB).multiply(wq(F))); F.updateMatrixWorld(true);
        }
      }
      // the ball of a held foot rests on the floor (pitched about the ankle), and no toe ever goes under it
      if (Tz) {
        const an = F.getWorldPosition(new V()), to = Tz.getWorldPosition(new V());
        const floor = this.toeH + (nT ? nT.k * Math.hypot(to.x - nT.p.x, to.z - nT.p.z) : 0), want = wT > 0 ? Math.max(to.y, floor) + (toeY - Math.max(to.y, floor)) * wT : Math.max(to.y, floor);
        if (Math.abs(want - to.y) > 5e-4) {
          const v = to.clone().sub(an), r = Math.hypot(v.x, v.z), ny = Math.max(-0.999 * v.length(), Math.min(0.999 * v.length(), want - an.y));
          const nr = Math.sqrt(Math.max(0, v.lengthSq() - ny * ny)), w2 = new V(r > 1e-6 ? (v.x / r) * nr : 0, ny, r > 1e-6 ? (v.z / r) * nr : 0);
          setW(F, new THREE.Quaternion().setFromUnitVectors(v.normalize(), w2.normalize()).multiply(wq(F))); F.updateMatrixWorld(true);
        }
      }
      // ...and once the foot is pitched, a held ball is put back on its spot: the foot pitches about the ankle, so a heel
      // peeling up while still held pulled the ball 5-8 cm back toward it (the punch's back foot, v4 reel). A real foot
      // peels about the ball, so the whole foot (ankle and all) is moved by what the ball is off as the heel lets go (with
      // the heel held too the yaw above keeps the ball; moving the foot then dragged the held heel 12 cm in the squat)
      if (Tz && cT && wB > 0 && this.def.contact?.ballFix !== false && this.cast.contact?.ballFix !== false) {
        const to = Tz.getWorldPosition(new V()), e = new V(cT.x - to.x, 0, cT.z - to.z), k = wB * (1 - wHh * (1 - Math.min(1, (peel || 0) / 0.01)));
        if (e.lengthSq() > 1e-6 && e.length() < 0.25) this._twoBone(U, L, F, F.getWorldPosition(new V()).addScaledVector(e, k));
      }
    }
  }

  // the cast "gaze" entry that holds the eyes at t, and how much: { g, w }
  _gazeAt(t) {
    let g = null, w = 0;
    if (t != null) for (const x of this.cast.gaze || []) { const r = x.ramp ?? 0.15, k = Math.min(smooth((t - x.from) / r + 1), smooth((x.to - t) / r + 1)); if (k > w) { w = k; g = x; } }
    return { g, w };
  }

  // a two-bone chain (upper, lower, end) turned so the end's joint reaches T, the bend kept in its own plane and on its
  // own side, the end's world turn kept
  _twoBone(U, L, F, T) {
    const V = THREE.Vector3, wq = (o) => o.getWorldQuaternion(new THREE.Quaternion()), setW = (o, q) => o.quaternion.copy(wq(o.parent).invert().multiply(q));
    const h = U.getWorldPosition(new V()), k = L.getWorldPosition(new V()), a = F.getWorldPosition(new V());
    const fq = wq(F), la = h.distanceTo(k), lb = k.distanceTo(a), ok = k.clone().sub(h).normalize();
    let n = ok.clone().cross(a.clone().sub(k)); if (n.lengthSq() < 1e-8) n = ok.clone().cross(T.clone().sub(h)); if (n.lengthSq() < 1e-8) n.set(1, 0, 0); n.normalize();
    const ht = T.clone().sub(h), raw = ht.length(), mx = la + lb, s0 = mx * 0.97;
    const dist = raw < s0 ? raw : s0 + (mx * 0.999 - s0) * (1 - Math.exp(-(raw - s0) / (mx * 0.999 - s0))), dir = ht.normalize();
    const A = Math.acos(Math.max(-1, Math.min(1, (la * la + dist * dist - lb * lb) / (2 * la * dist))));
    const k1 = dir.clone().applyAxisAngle(n, A), k2 = dir.clone().applyAxisAngle(n, -A), kd = k1.dot(ok) >= k2.dot(ok) ? k1 : k2;
    setW(U, new THREE.Quaternion().setFromUnitVectors(ok, kd).multiply(wq(U))); U.updateMatrixWorld(true);
    const kk = L.getWorldPosition(new V()), aa = F.getWorldPosition(new V());
    setW(L, new THREE.Quaternion().setFromUnitVectors(aa.sub(kk).normalize(), T.clone().sub(kk).normalize()).multiply(wq(L))); L.updateMatrixWorld(true);
    setW(F, fq); F.updateMatrixWorld(true);
  }

  // palms held on the floor (handspring, push-ups, a hand on the ground): the arm reaches the held place, the wrist
  // keeps its turn, the palm sits on the floor
  _hands(t) {
    if (this._lockOff || t == null) return;
    const plan = this.plan, V = THREE.Vector3, nb = this.nb;
    // cast "rest": [{ hand: "L"|"R", from, to, ramp, on: "thigh", u: 0.6, up: 0.07, out: 0.02 }]: a hand settles on
    // its own thigh (u along it from the hip, a lift onto its top, a little out to the side), the palm turned down
    // onto it: a seated person's hands rest on a real support instead of hovering (motion brief: sit)
    for (const r of this.cast.rest || []) {
      const ramp = r.ramp ?? 0.35, w = Math.min(smooth((t - r.from) / ramp), smooth((r.to - t) / ramp)); if (w <= 0) continue;
      const sd = r.hand === "L" ? "left" : "right", U = nb[`${sd}UpperArm`], L = nb[`${sd}LowerArm`], F = nb[`${sd}Hand`];
      const hip = nb[`${sd}UpperLeg`], knee = nb[`${sd}LowerLeg`]; if (!U || !L || !F || !hip || !knee) continue;
      const hp = hip.getWorldPosition(new V()), kp = knee.getWorldPosition(new V()), goal = hp.clone().lerp(kp, r.u ?? 0.6);
      const lat = nb.leftUpperLeg.getWorldPosition(new V()).sub(nb.rightUpperLeg.getWorldPosition(new V())).setY(0).normalize().multiplyScalar(sd === "left" ? 1 : -1);
      goal.y += r.up ?? 0.07; goal.addScaledVector(lat, r.out ?? 0.02);
      const wq = F.getWorldQuaternion(new THREE.Quaternion()), n = new V(0, -1, 0).applyQuaternion(wq);
      const turn = new THREE.Quaternion().slerp(new THREE.Quaternion().setFromUnitVectors(n, new V(0, -1, 0)), w);
      F.quaternion.copy(F.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(turn.multiply(wq))); F.updateMatrixWorld(true);
      const pm = this._palm(sd), wr = F.getWorldPosition(new V()), off = pm.clone().sub(wr);
      this._twoBone(U, L, F, pm.lerp(goal, w).sub(off));
    }
    if (!plan) return;
    for (const sd of ["left", "right"]) {
      const c = this._contactAt(plan[sd], t); if (!c.P || c.wP <= 0) continue;
      const U = nb[`${sd}UpperArm`], L = nb[`${sd}LowerArm`], F = nb[`${sd}Hand`]; if (!U || !L || !F) continue;
      const pm = this._palm(sd), w = F.getWorldPosition(new V()), off = pm.clone().sub(w);
      const goal = pm.clone().lerp(c.P, c.wP);
      this._twoBone(U, L, F, goal.sub(off));
    }
  }

  // the centre of a palm in the world (the normalized rig): 70 % of the way from the wrist to the middle knuckle
  _palm(sd) {
    const h = this.nb[`${sd}Hand`], m = this.nb[`${sd}MiddleProximal`], V = THREE.Vector3;
    const a = h.getWorldPosition(new V()); return m ? a.lerp(m.getWorldPosition(new V()), 0.7) : a;
  }
  _liftAt(t) {
    const L = this.lift; if (!L || this._lockOff) return 0;
    const f = Math.min(L.v.length - 1, Math.max(0, t / L.dt)), i = Math.min(L.v.length - 2, Math.floor(f));
    return L.v.length > 1 ? L.v[i] + (L.v[i + 1] - L.v[i]) * (f - i) : L.v[0] || 0;
  }

  // each take stands on the floor: the recorded floor isn't always at 0 (the handspring take stood 27 cm up, 6 Nov),
  // so each take is moved up or down by its lowest ankle or ball of the foot under the rest heights over the take
  _autoFloor() {
    this._lockOff = true; this._noGround = true;
    const V = THREE.Vector3;
    for (const s of this.perf.L) {
      let lo = Infinity;
      for (let u = 0; u <= s.dur + 1e-6; u += 1 / 30) {
        this._vrmPose(s.at + Math.min(u, s.dur - 1e-4)); this.nb.hips.parent.updateMatrixWorld(true);
        for (const sd of ["left", "right"]) {
          lo = Math.min(lo, this.nb[`${sd}Foot`].getWorldPosition(new V()).y - this.footH);
          if (this.nb[`${sd}Toes`]) lo = Math.min(lo, this.nb[`${sd}Toes`].getWorldPosition(new V()).y - this.toeH);
        }
      }
      if (Number.isFinite(lo) && Math.abs(lo) > 0.01) s.lift = (s.lift || 0) - lo;
      if (this.cast.diagPalms || this.cast.diagFeet) console.log(`diag:floor ${s.clip} ${(-lo).toFixed(3)}`);
    }
    this._lockOff = false; this._noGround = false;
  }

  // the support plan: the performance played once at 60 Hz (before any holding), and for each foot the spans where its
  // heel (ankle) or its ball (toe joint) is down and still: under 5 cm over its rest height (a retargeted planted foot floats up to 5 cm) and moving under 0.7 m/s (a running stance foot of this retarget creeps up to that before it is held)
  // across the floor. A span longer than 0.1 s becomes a contact held at the place it settled (its slowest frames
  // weigh most). Spans never cross a cut. Pure: the same list, the same plan
  _planContacts() {
    const L = this.perf.L, last = L[L.length - 1], end = last.at + last.dur, dt = 1 / 60, V = THREE.Vector3;
    const seg = (t) => { let i = 0; while (i + 1 < L.length && L[i + 1].at <= t) i++; return L[i].blend === 0 ? i : -1; };
    const S = { left: [], right: [] };
    this._lockOff = true;
    for (let i = 0; i * dt <= end + 1e-6; i++) {
      const t = i * dt; this._vrmPose(t); this.nb.hips.parent.updateMatrixWorld(true);
      const hl = this.nb.leftUpperLeg.getWorldPosition(new V()), hr = this.nb.rightUpperLeg.getWorldPosition(new V()), mid = hl.clone().add(hr).multiplyScalar(0.5), lat = hl.sub(hr).setY(0).normalize();
      for (const sd of ["left", "right"]) S[sd].push({ t, s: seg(t), mid, lat, a: this.nb[`${sd}Foot`].getWorldPosition(new V()), b: (this.nb[`${sd}Toes`] || this.nb[`${sd}Foot`]).getWorldPosition(new V()), h: this._palm(sd), sh: this.nb[`${sd}UpperArm`].getWorldPosition(new V()) });
    }
    this._lockOff = false;
    // palm support (motion brief: a handspring changes support from feet to palms with straight arms): this body's arms
    // are longer for its legs than the recorded actor's, so its hands reach the floor while the actor's are still
    // above it (palms 13 cm under the floor in the handspring, 6 Nov). Wherever a palm would go under the floor the
    // whole body is lifted by that much (widened 0.12 s each way and smoothed, so it never pops), not the arms bent
    {
      const n = S.left.length, need = new Float32Array(n), lift = new Float32Array(n), pf = this.def.contact?.palm ?? 0.025, W = Math.round(0.12 / dt);
      // (and a palm on the floor takes the weight on a nearly straight arm: the body rises until the shoulder is an
      // arm's length (def.contact.straight, 0.93 of it) over the palm; the recorded actor's elbows folded and this
      // bigger head reached the floor, 6 Nov)
      const ar = this.armLen * (this.def.contact?.straight ?? 0.93);
      for (let i = 0; i < n; i++) {
        need[i] = Math.max(0, pf - Math.min(S.left[i].h.y, S.right[i].h.y));
        for (const sd of ["left", "right"]) {
          const f = S[sd][i]; if (f.h.y > pf + 0.08) continue;
          const hz = Math.hypot(f.sh.x - f.h.x, f.sh.z - f.h.z); if (hz >= ar) continue;
          need[i] = Math.max(need[i], Math.sqrt(ar * ar - hz * hz) - (f.sh.y - Math.max(f.h.y, pf)) + Math.max(0, pf - f.h.y));
        }
      }
      const dil = need.map((_, i) => { let m = 0; for (let j = i - W; j <= i + W; j++) if (j >= 0 && j < n && S.left[j].s === S.left[i].s) m = Math.max(m, need[j]); return m; });
      for (let i = 0; i < n; i++) { let a = 0, c = 0; for (let j = i - W; j <= i + W; j++) if (j >= 0 && j < n && S.left[j].s === S.left[i].s) { a += dil[j]; c++; } lift[i] = a / c; }
      this.lift = { dt, v: lift };
      // (the lower ankle's recorded height every 1/60 s, to know when the feet are coming down fast: see _ground)
      this.footY = { dt, v: Float32Array.from(S.left.map((f, i) => Math.min(f.a.y, S.right[i].a.y))), s: S.left.map((f) => f.s) };
      // (palms are held where the recorded hands meet the floor, so the lifted body straightens its arms down to them)
      for (const sd of ["left", "right"]) S[sd].forEach((f, i) => { f.a.y += lift[i]; f.b.y += lift[i]; f.h0 = f.h.clone().setY(Math.max(f.h.y, pf)); f.h.y += lift[i]; });
    }
    // stance width (motion brief: no narrow crossing gait): the recorded walkers put each ankle 0-5 cm off the line
    // under the pelvis (a catwalk on this wider-hipped body, 6 Nov front view); each foot is kept at least half the
    // gait "width" (default 12 cm between ankle centres: real walkers step 10-11 +-3 cm wide, heels 5 cm or more apart
    // as one passes the other; v4's 16 cm walked with the feet 17 cm apart on average, 7 Nov) out on its own side, the push smoothed over 0.4 s so the swing
    // carries it too. The pushed feet are the ones the contacts hold
    const half = (this.cast.gait?.width ?? this.def.gait?.width ?? 0.12) / 2, n = S.left.length;
    this.width = { dt, left: new Float32Array(n), right: new Float32Array(n) };
    for (const [sd, sg] of [["left", 1], ["right", -1]]) {
      // (a deep squat stands wider: real squatters put the ankles 1.3-2.2 hip-widths apart, the pick-up actor 1.1, 7 Nov;
      // the width grows to gait "squat" (default 30 cm) as the hips sink below 0.6 leg lengths)
      const sq = (this.cast.gait?.squat ?? this.def.gait?.squat ?? 0.3) / 2;
      const hw = (f) => half + Math.max(0, sq - half) * smooth((0.6 - (f.mid.y - this.footH) / this.legLen) / 0.25);
      const F = S[sd], need = F.map((f) => Math.max(0, hw(f) - sg * f.a.clone().sub(f.mid).dot(f.lat))), W = Math.round(0.2 / dt);
      for (let i = 0; i < n; i++) {
        let sum = 0, cnt = 0; for (let j = i - W; j <= i + W; j++) if (j >= 0 && j < n && F[j].s === F[i].s) { sum += need[j]; cnt++; }
        const v = sum / cnt; this.width[sd][i] = v;
        F[i].a.addScaledVector(F[i].lat, sg * v); F[i].b.addScaledVector(F[i].lat, sg * v);
      }
    }
    const C = { ...(this.def.contact || {}), ...(this.cast.contact || {}) }, up = C.height ?? 0.05, vmax = C.speed ?? 0.7, minLen = C.minLen ?? 0.1;
    const spans = (F, key, base, up2 = up, v2 = vmax) => {
      const out = []; let cur = null;
      const sp = (i) => { const p = F[Math.max(0, i - 1)], q = F[Math.min(F.length - 1, i + 1)]; if (p.s !== q.s) return 0; return Math.hypot(q[key].x - p[key].x, q[key].z - p[key].z) / (q.t - p.t || dt); };
      F.forEach((f, i) => {
        const v = sp(i), on = f[key].y < base + up2 && v < v2;
        if (on && cur && cur.s === f.s) { cur.b = f.t; cur.pts.push([f[key], v]); }
        else { if (cur) out.push(cur); cur = on ? { a: f.t, b: f.t, s: f.s, pts: [[f[key], v]] } : null; }
      });
      if (cur) out.push(cur);
      return out.filter((c) => c.b - c.a >= minLen).map((c) => {
        let wx = 0, wz = 0, ws = 0; for (const [p, v] of c.pts) { const w = 1 / (v + 0.05); wx += p.x * w; wz += p.z * w; ws += w; }
        return { a: c.a, b: c.b, s: c.s, p: new V(wx / ws, base, wz / ws) };
      });
    };
    const plan = {};
    for (const sd of ["left", "right"]) plan[sd] = { H: spans(S[sd], "a", this.footH), T: spans(S[sd], "b", this.toeH), P: spans(S[sd], "h0", this.def.contact?.palm ?? 0.025, 0.1, 1.0) };   // (a palm comes down fast and the arm reaches the last 10 cm)
    if (this.cast.diagPalms || this.cast.diagFeet) for (const sd of ["left", "right"]) console.log(`diag:plan ${sd} widen max ${Math.max(...this.width[sd]).toFixed(3)} mean ${(this.width[sd].reduce((a, b) => a + b, 0) / n).toFixed(3)} side ${(S[sd].reduce((a, f) => a + (sd === "left" ? 1 : -1) * f.a.clone().sub(f.mid).dot(f.lat), 0) / n).toFixed(3)}`), console.log(`diag:plan ${sd} heel ${plan[sd].H.map((c) => `${c.a.toFixed(2)}-${c.b.toFixed(2)}`).join(",")} ball ${plan[sd].T.map((c) => `${c.a.toFixed(2)}-${c.b.toFixed(2)}`).join(",")} palm ${plan[sd].P.map((c) => `${c.a.toFixed(2)}-${c.b.toFixed(2)}`).join(",")} lift max ${Math.max(...this.lift.v).toFixed(3)}`);
    return plan;
  }

  // how much a foot's heel and ball are held at t, and where: full inside a span, eased in and out over 0.06 s at its
  // ends (never into another shot)
  _contactAt(P, t) {
    const r = this.def.contact?.ramp ?? 0.06, L = this.perf.L;
    let si = 0; while (si + 1 < L.length && L[si + 1].at <= t) si++;
    const s = L[si].blend === 0 ? si : -1;
    const pick = (list) => {
      let best = null, bw = 0;
      for (const c of list) { if (c.s !== s) continue; const w = Math.min(smooth((t - c.a) / r + 1), smooth((c.b - t) / r + 1)); if (w > bw) { bw = w; best = c; } }
      return [best, bw];
    };
    // the nearest contact of each kind in this shot within 0.3 s (a foot about to land or just lifted): a point near
    // the floor keeps a clearance over it of 30 % of its distance from that spot, so a heel comes down ON the place it
    // will hold instead of touching early and sliding there, and a ball peels up off its spot instead of skidding away
    const near = (list) => {
      let best = null, bg = 0.3;
      for (const c of list) { if (c.s !== s) continue; const g = t < c.a ? c.a - t : t > c.b ? t - c.b : 0; if (g < bg) { bg = g; best = c; } }
      return best ? { p: best.p, k: (this.def.contact?.clear ?? 0.3) * (1 - smooth(bg / 0.3)) } : null;
    };
    const [H, wH] = pick(P.H), [T, wT] = pick(P.T), [Pm, wP] = pick(P.P || []);
    return { H: H?.p, wH, T: T?.p, wT, nH: near(P.H), nT: near(P.T), P: Pm?.p, wP };
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
      // gaze (motion brief: eyes find the goal first): cast "gaze": [{ from, to, ramp, at: [x, y, z] }] turns the eyes
      // toward a place in the world (an apple before the hand goes, the camera once seated); otherwise straight ahead
      const L = this.vrm.lookAt;
      if (L) {
        L.autoUpdate = false; const { g: best, w: bw } = this._gazeAt(t);
        this.vrm.scene.updateMatrixWorld(true);
        if (best) { L.lookAt(new THREE.Vector3(...best.at)); L.yaw *= bw; L.pitch *= bw; } else { L.yaw = 0; L.pitch = 0; }
        L.update(0);
      }
    }
    // the face: blinks (fast close, slow open, about every 3 s, never two alike) and the expression's shapes
    const E = this.vrm.expressionManager;
    if (E) {
      let blink = 0;
      for (let i = 0; i < 12; i++) {
        const at = 0.7 + i * 2.9 + hash(i + (this.def.seed || 1)) * 1.4, u = (t - at) * 30;
        // cast "noBlink": [[from, to], ...]: no automatic blink starts there (a key line, CLAUDE.md "no blink on a key line")
        if (this.cast.noBlink?.some(([a, b]) => at >= a - 0.27 && at <= b)) continue;
        if (u >= 0 && u < 3) blink = Math.max(blink, smooth(u / 2.2));
        else if (u >= 3 && u < 8) blink = Math.max(blink, 1 - smooth((u - 3) / 5));
      }
      E.setValue("blink", blink);
      let ex = this.cast.face || {};
      // cast "faces": [[t, { angry: 0.85, aa: 0.5 }], ...]: the expression changes over the clip, each key eased in
      // over 0.2 s from the one before (a shout on an attack, eyes wide on a shock); unset shapes are 0
      if (this.cast.faces?.length) {
        const K = this.cast.faces; let i = 0; while (i + 1 < K.length && K[i + 1][0] <= t) i++;
        const a = i > 0 ? K[i - 1][1] : K[0][1], b = K[i][1], w = i > 0 ? smooth((t - K[i][0]) / 0.2) : 1;
        ex = {}; for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) ex[k] = (a[k] ?? 0) + ((b[k] ?? 0) - (a[k] ?? 0)) * w;
      }
      // a spoken line (a "say" in the storyboard): the mouth opens with the speech's own syllables (timeline.js talk:
      // st.talk, st.round), on top of the face's own shape
      if (st?.talk > 0.01) { const o = Math.min(1, st.talk * 1.5), r = Math.min(1, st.round ?? 0);
        ex = { ...ex, aa: Math.max(ex.aa ?? 0, o * (1 - r)), ou: Math.max(ex.ou ?? 0, o * r) }; }
      for (const [k, v] of Object.entries(ex)) E.setValue(k, v);
      E.update();
    }
    this.vrm.scene.updateMatrixWorld(true);
    // garment ribbons (headband tails): hang and trail against the way the body moved over the last 0.1 s
    if (this.garb?.tails?.length && P0) {
      const Pp = this.perf.at(Math.max(0, t - 0.1)), v = Pp ? P0.pos.clone().sub(Pp.pos).multiplyScalar(10) : new THREE.Vector3();
      poseTails(this.garb.tails, t, v);
    }
    // cast "diagJoints": the recorded actor's joints and this body's at the same moment, in the world, named as the
    // database names them (tools/human/compare.mjs compares angles: knee, hip, trunk, shoulder slope)
    if (this.cast.diagJoints) {
      const H2 = this.vrm.humanoid, P2 = this.perf.at(t), W2 = P2 && worldPose(P2), r3 = (v) => v.toArray().map((x) => +x.toFixed(4));
      const g = (n) => r3(H2.getRawBoneNode(n).getWorldPosition(new THREE.Vector3()));
      const C = { lhipjoint: g("leftUpperLeg"), rhipjoint: g("rightUpperLeg"), lfemur: g("leftLowerLeg"), rfemur: g("rightLowerLeg"), ltibia: g("leftFoot"), rtibia: g("rightFoot"), lfoot: g("leftToes"), rfoot: g("rightToes"), thorax: g("neck"), lclavicle: g("leftUpperArm"), rclavicle: g("rightUpperArm"), head: g("head"), lhumerus: g("leftLowerArm"), rhumerus: g("rightLowerArm"), lradius: g("leftHand"), rradius: g("rightHand"), lshoulder: g("leftShoulder"), rshoulder: g("rightShoulder"), chest: g(this.nb.upperChest ? "upperChest" : "chest") };
      const A = {}; if (W2) for (const k of ["lhipjoint", "rhipjoint", "lfemur", "rfemur", "ltibia", "rtibia", "lfoot", "rfoot", "thorax", "lclavicle", "rclavicle", "head", "lhumerus", "rhumerus", "lradius", "rradius"]) if (W2[k]) A[k] = r3(W2[k].end);
      console.log(`diag:joints ${JSON.stringify({ t: +t.toFixed(4), A, C, pitch: this._pitch })}`);
    }
    // cast "diagFeet": every frame's ankle and ball of each foot, in the world (tools/human/skate.mjs measures sliding)
    if (this.cast.diagFeet) { const H2 = this.vrm.humanoid, f = (n) => H2.getRawBoneNode(n).getWorldPosition(new THREE.Vector3()).toArray().map((v) => v.toFixed(4)).join(" "); console.log(`diag:feet t=${t.toFixed(4)} L ${f("leftFoot")} ${f("leftToes")} R ${f("rightFoot")} ${f("rightToes")}`); }
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
// bare: body parts the outfit leaves uncovered ("arms": short sleeves, the arms are skin where no sleeve covers them; "feet": barefoot), so
// they stay skin instead of the clothes' inside colour
// paintInner false (character "inner": false, our own character creator's bodies, tools/character): only the skin
// fully under the clothes goes; what is left stays skin (the inner colours are for the VRoid sample body's undershirt)
// the head as an ellipsoid riding the head bone (character "faceLight"): the skin vertices bound almost wholly to the head
// bone, at rest, give its box (ears to ears, crown to chin, nose to the back of the skull); the frame maps the unit sphere
// onto it with +z forward and +y up at rest, so the shader's face patch and neck shadow follow every turn of the head
function headFrame(vrm, root, o) {
  const hb = vrm.humanoid.getRawBoneNode("head"); if (!hb) return null;
  vrm.scene.updateMatrixWorld(true);
  const box = new THREE.Box3(), v = new THREE.Vector3(), front = [];
  vrm.scene.traverse((m) => {
    if (!m.isSkinnedMesh || ![].concat(m.material).some((x) => /Body_00_SKIN/.test(x.name || ""))) return;
    // (the head bone and the bones under it: the jaw carries the mouth and chin)
    const under = new Set(); hb.traverse((b) => { const k = m.skeleton.bones.indexOf(b); if (k >= 0) under.add(k); });
    if (!under.size) return;
    const P = m.geometry.attributes.position, I = m.geometry.attributes.skinIndex, W = m.geometry.attributes.skinWeight;
    for (let i = 0; i < P.count; i++) {
      let w = 0; for (let k = 0; k < 4; k++) if (under.has(I.getComponent(i, k))) w += W.getComponent(i, k);
      if (w < 0.5) continue;
      m.getVertexPosition(i, v); m.applyBoneTransform(i, v); v.applyMatrix4(m.matrixWorld);
      if (w >= 0.95) box.expandByPoint(v);
      front.push(v.clone());
    }
  });
  if (box.isEmpty()) return null;
  // the chin: the lowest point of the face's front (the jaw shares its weight with the neck, so the box above stops short)
  const zc = (box.min.z + box.max.z) / 2;
  for (const p of front) if (p.z > zc + 0.03 && Math.abs(p.x) < 0.03) box.min.y = Math.min(box.min.y, p.y);
  if (o.diag) console.log(`diag:headFrame min ${box.min.toArray().map((x) => x.toFixed(3))} max ${box.max.toArray().map((x) => x.toFixed(3))} head ${hb.getWorldPosition(new THREE.Vector3()).toArray().map((x) => x.toFixed(3))}`);
  const rq = root.getWorldQuaternion(new THREE.Quaternion());
  const c = box.getCenter(new THREE.Vector3()), r = box.getSize(new THREE.Vector3()).multiplyScalar(0.5 * (o.scale ?? 1));
  const Fw = new THREE.Matrix4().compose(c, rq, r), L = hb.matrixWorld.clone().invert().multiply(Fw);
  const M = new THREE.Matrix4();
  return {
    bone: hb, L, k: o.k ?? 0.6, neck: o.neck ?? 0.012, us: new Set(),
    update() { hb.updateWorldMatrix(true, false); M.multiplyMatrices(hb.matrixWorld, L).invert(); for (const u of this.us) u.uFaceInv.value.copy(M); },
  };
}

function hideCoveredSkin(vrm, bare = [], paintInner = true) {
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
    if (bare.includes("arms")) for (const n of ["leftUpperArm", "rightUpperArm"]) under(n, open);
    if (bare.includes("feet")) for (const n of ["leftFoot", "rightFoot"]) under(n, open);
    for (const n of ["leftUpperLeg", "rightUpperLeg"]) under(n, legs);
    for (const n of ["leftShoulder", "rightShoulder"]) under(n, arms);
    // (the neck is never dropped: the hood stands within the 15 cm test of it in the rest pose, so its sides went and
    // a square hole opened under the ear whenever the head turned or tilted, 7 Nov once the relaxed shoulders showed it)
    const neck = new Set(); under("neck", neck);
    const kind = new Uint8Array(P.count);   // 0 skin, 1 top, 2 legs
    if (SI && SW && paintInner) for (let i = 0; i < P.count; i++) {
      let best = 0, bw = -1; for (let k = 0; k < 4; k++) { const w = SW.getComponent(i, k); if (w > bw) { bw = w; best = SI.getComponent(i, k); } }
      const bone = bones[best]; kind[i] = !bone || open.has(bone) || vrm.scene.userData.bare?.has(bone) ? 0 : legs.has(bone) ? 2 : arms.has(bone) ? 1 : Math.abs(p.fromBufferAttribute(P, i).applyMatrix4(o.matrixWorld).x) < 0.09 ? 0 : 1;
      if (neck.has(bone)) covered[i] = 0;
    }
    if (!paintInner) {
      // (one material, the covered triangles dropped: groups with the unused inner materials thinned the skin's ink)
      const keep = []; for (let t = 0; t < idx.count; t += 3) { const a = idx.getX(t), b = idx.getX(t + 1), c = idx.getX(t + 2); if (!(covered[a] && covered[b] && covered[c])) keep.push(a, b, c); }
      g.setIndex(keep); g.clearGroups(); continue;
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
