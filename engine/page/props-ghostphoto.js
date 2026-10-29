import * as THREE from "three";
import { clamp, lerp } from "./util.js";
import { radialTexture } from "./geo.js";

// Props for "The Ghost Photo Had One Extra Ghost" (eight trend tests #01, 29 Oct 2026), in their own file so clips made
// in parallel never edit the same one (props3d.js merges these into its KINDS):
//   sheetghost  a white bedsheet worn as a ghost costume over a whole character, with black sunglasses on its front.
//               Stand it at the wearer's x / z and turn it with them (rot). spec: { shape: "round" | "hat", h (top of the
//               head, m), r (radius over the head and shoulders), hem (radius at the floor), dz (depth / width),
//               eyeY (the sunglasses' height), lift (the front hem's height when `open` is 1), seed }; "hat" drapes a
//               wizard hat: hatTip (y), brimY, brimR, tipBend [x, z].
//               `open` 0..1 lifts the front of the hem up to `lift` (both hands gather it there: a peek from under the
//               sheet); the sunglasses ride up on the gathered fold. `glow` 0..1 is an orange glow at the shoulders,
//               `puff` 0..1 a thin curl of smoke rising from the top. `rise` (m) lifts the whole sheet off the wearer.
//               `burn` 0..1 is one sweep from the top down that turns the cloth into a translucent ember outline of the
//               same ghost shape (its sunglasses stay solid black); a bright band of fire marks the sweep line, and
//               once it is through, flames lick up from the hem. `wobble` 0..1 lets it float (a slow bob and sway).
//   tripodcam   a small camera on a tripod, the lens facing -z (stand it in front of the group, rot 180 turns it round).
//               spec: { h (the lens height, default 0.82), blinks: [times the timer lamp lights], blink (seconds it stays
//               lit, 0.14), flash (the time the flash fires) }. `lit` 0..1 dims the lamp's glow as a whole.
//               GHOST_PHOTO.lens(spec) gives the lens centre in the prop's frame (for the photo's camera).
//   cobbles     a cobbled courtyard floor with fallen maple leaves, spec.w x spec.d metres (10 x 8) centred on the prop,
//               to stand in front of a painted plate whose own floor is cobbled (set "plain" under it). spec.seed
export const GHOST_PHOTO = { lens: (s) => [0, s.h ?? 0.82, -0.11] };

const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
const smooth = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };
const wrapPi = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const glowSprite = (stops, add = true) => {
  const m = new THREE.SpriteMaterial({ map: radialTexture(stops), transparent: true, depthWrite: false, ...(add && { blending: THREE.AdditiveBlending }) });
  m.userData.noOutline = true; return new THREE.Sprite(m);
};
function roundRect(w, h, r, taper = 0) {
  // a rounded rectangle, the bottom edge `taper` narrower each side (a wayfarer lens)
  const s = new THREE.Shape(), x = w / 2, y = h / 2, b = x - taper;
  s.moveTo(-b + r, -y); s.lineTo(b - r, -y); s.quadraticCurveTo(b, -y, b + (x - b) * 0.3, -y + r);
  s.lineTo(x, y - r); s.quadraticCurveTo(x, y, x - r, y); s.lineTo(-x + r, y); s.quadraticCurveTo(-x, y, -x, y - r);
  s.lineTo(-b - (x - b) * 0.3, -y + r); s.quadraticCurveTo(-b, -y, -b + r, -y);
  return s;
}

// the sheet's profile, top (v 0) to hem (v 1): [radius, height] for a sheet over a round head or over a pointed hat
function profileOf(S) {
  const N = 240, out = [];
  for (let i = 0; i <= N; i++) {
    const v = i / N;
    if (S.shape === "hat") {
      const vb = 0.34;
      if (v < vb) { const k = v / vb; out.push([lerp(0.015, S.brimR, Math.pow(k, 1.25)), lerp(S.hatTip, S.brimY, k), 1 - k]); }
      else { const s = (v - vb) / (1 - vb); out.push([S.brimR + (S.hem - S.brimR) * Math.pow(s, 1.5), lerp(S.brimY - 0.03, S.hemY, s), 0]); }
    } else {
      const vs = 0.3;
      if (v < vs) { const a = (v / vs) * Math.PI / 2; out.push([S.r * Math.sin(a), S.h - S.r * (1 - Math.cos(a)), 0]); }
      else { const s = (v - vs) / (1 - vs); out.push([S.r + (S.hem - S.r) * Math.pow(s, 1.6), lerp(S.h - S.r, S.hemY, s), 0]); }
    }
  }
  return out;   // [r, y, bend] (bend: how much of the hat tip's lean applies there)
}
// the profile at v (0..1), interpolated
function profAt(P, v) {
  const f = clamp(v) * (P.length - 1), i = Math.min(P.length - 2, Math.floor(f)), k = f - i;
  return [lerp(P[i][0], P[i + 1][0], k), lerp(P[i][1], P[i + 1][1], k), lerp(P[i][2], P[i + 1][2], k)];
}
// the v where the profile comes down to height y (the profile only ever goes down)
function vAtY(P, y) {
  if (y <= P[P.length - 1][1]) return 1;
  for (let i = 1; i < P.length; i++) if (P[i][1] <= y) { const k = (P[i - 1][1] - y) / Math.max(1e-6, P[i - 1][1] - P[i][1]); return (i - 1 + k) / (P.length - 1); }
  return 1;
}

const EMBER_VS = `varying vec3 vN; varying vec3 vV; varying float vY;
  void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = -mv.xyz; vY = position.y; gl_Position = projectionMatrix * mv; }`;
const EMBER_FS = `uniform vec3 uBody; uniform vec3 uRim; uniform float uOp; uniform float uTop; varying vec3 vN; varying vec3 vV; varying float vY;
  void main() {
    float f = 1.0 - abs(dot(normalize(vN), normalize(vV)));
    float rim = pow(f, 2.0), h = clamp(vY / uTop, 0.0, 1.0);
    vec3 c = mix(uBody, uRim, clamp(rim * 1.3 + 0.15 * h, 0.0, 1.0));
    float a = uOp * (0.3 + 0.14 * h + 1.6 * rim); gl_FragColor = vec4(c * a, a);
  }`;
const BAND_FS = `uniform float uOp; varying vec2 vUv;
  void main() { float a = sin(vUv.y * 3.14159); a = a * a * uOp; vec3 c = mix(vec3(1.0, 0.38, 0.06), vec3(1.0, 0.78, 0.36), a); gl_FragColor = vec4(c * a, a); }`;

export const GHOSTPHOTO_GRIPS = {};

// cobbles in rows, dusky grey-violet with a warm top light, dark mortar, and orange and red maple leaves on them
function cobbleTex(seed, n = 6) {
  const S = 1024, c = document.createElement("canvas"); c.width = c.height = S; const g = c.getContext("2d");
  let q = seed * 9301 + 49297; const rnd = () => ((q = (q * 16807) % 2147483647) / 2147483647);
  g.fillStyle = "#2f2730"; g.fillRect(0, 0, S, S);
  const rowH = S / 14;
  for (let r = 0; r < 14; r++) {
    let x = -rnd() * 40;
    while (x < S) {
      const w = 50 + rnd() * 34, cx = x + w / 2, cy = (r + 0.5) * rowH + (rnd() - 0.5) * 6, v = 0.82 + rnd() * 0.3;
      g.fillStyle = `rgb(${Math.round(112 * v)},${Math.round(100 * v)},${Math.round(108 * v)})`;
      g.beginPath(); g.ellipse(cx, cy, w / 2 - 4, rowH / 2 - 5, (rnd() - 0.5) * 0.2, 0, Math.PI * 2); g.fill();
      g.fillStyle = `rgba(255,196,140,${0.12 + rnd() * 0.1})`; g.beginPath(); g.ellipse(cx - 4, cy - 6, w / 2 - 12, rowH / 2 - 14, 0, 0, Math.PI * 2); g.fill();
      x += w + 3;
    }
  }
  const leafC = ["#d9541e", "#f08a24", "#b8321c", "#e8a33a", "#c4421c"];
  for (let i = 0; i < n * 14; i++) {
    const x = rnd() * S, y = rnd() * S, s = 9 + rnd() * 9, a = rnd() * Math.PI * 2;
    g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = leafC[i % 5];
    g.beginPath(); for (let k = 0; k < 10; k++) { const ang = (k / 10) * Math.PI * 2, rr = k % 2 ? s * 0.45 : s; g.lineTo(Math.cos(ang) * rr, Math.sin(ang) * rr); } g.closePath(); g.fill();
    g.strokeStyle = "rgba(80,30,10,0.5)"; g.lineWidth = 1.5; g.beginPath(); g.moveTo(0, 0); g.lineTo(s * 1.3, 0); g.stroke(); g.restore();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t;
}

export const GHOSTPHOTO_KINDS = {
  cobbles(P) {
    const sp = P.spec, w = sp.w ?? 10, d = sp.d ?? 8, tex = cobbleTex(sp.seed ?? 4, sp.leaves ?? 6); tex.repeat.set(w / 2.6, d / 2.6);
    const m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }); m.userData.lookRole = "set";
    const f = mesh(new THREE.PlaneGeometry(w, d), m, P.whole, 0, 0.002, 0); f.rotation.x = -Math.PI / 2; f.castShadow = false;
    return { grip: 0 };
  },
  sheetghost(P) {
    const sp = P.spec, seed = sp.seed ?? 1;
    const S = { shape: sp.shape || "round", h: sp.h ?? 1.12, r: sp.r ?? 0.44, hem: sp.hem ?? 0.6, hemY: 0.015, hatTip: sp.hatTip ?? 1.7, brimY: sp.brimY ?? 1.18, brimR: sp.brimR ?? 0.44 };
    const DZ = sp.dz ?? 0.86, EYE = sp.eyeY ?? 0.66, LIFT = sp.lift ?? 0.8, BEND = sp.tipBend || [0, 0];
    const PROF = profileOf(S), TOP = S.shape === "hat" ? S.hatTip : S.h;
    const NA = 96, NV = 48, cols = NA + 1, rows = NV + 1;
    const body = new THREE.Group(); P.whole.add(body);
    const geo = new THREE.BufferGeometry(), pos = new Float32Array(cols * rows * 3);
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const uv = new Float32Array(cols * rows * 2);
    for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) { uv[(i * cols + j) * 2] = j / NA; uv[(i * cols + j) * 2 + 1] = 1 - i / NV; }
    geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    const quads = []; for (let i = 0; i < NV; i++) for (let j = 0; j < NA; j++) { const a = i * cols + j, b = a + cols; quads.push([a, b, a + 1, b, b + 1, a + 1]); }
    const allIdx = quads.flat(); geo.setIndex(allIdx);
    const eGeo = new THREE.BufferGeometry(); eGeo.setAttribute("position", geo.attributes.position); eGeo.setIndex([]);
    const cloth = mat(sp.color ?? "#f4f2f7", { roughness: 0.92, side: THREE.DoubleSide }); cloth.userData.lookRole = "cloth";
    const sheet = mesh(geo, cloth, body); sheet.frustumCulled = false;
    const emberM = new THREE.ShaderMaterial({ uniforms: { uBody: { value: new THREE.Color("#ff6a10") }, uRim: { value: new THREE.Color("#ffe6a0") }, uOp: { value: 0 }, uTop: { value: TOP } }, vertexShader: EMBER_VS, fragmentShader: EMBER_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    emberM.userData.outlineParameters = { visible: false }; emberM.userData.noOutline = true;
    const ember = new THREE.Mesh(eGeo, emberM); ember.frustumCulled = false; ember.renderOrder = 3; body.add(ember);
    // the gathered hem: a soft roll along the bottom edge, thick where the front is lifted
    const hemPts = Array.from({ length: cols }, () => new THREE.Vector3());
    const hemM = mat(sp.color ?? "#f4f2f7", { roughness: 0.92 }); hemM.userData.lookRole = "cloth";
    const hemRoll = mesh(new THREE.BufferGeometry(), hemM, body); hemRoll.frustumCulled = false;
    // the fire band on the sweep line
    const bandGeo = new THREE.BufferGeometry(), bandPos = new Float32Array(cols * 2 * 3), bandUv = new Float32Array(cols * 2 * 2), bandIdx = [];
    for (let j = 0; j < cols; j++) { bandUv.set([j / NA, 0, j / NA, 1], j * 4); if (j < NA) { const a = j * 2; bandIdx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
    bandGeo.setAttribute("position", new THREE.BufferAttribute(bandPos, 3)); bandGeo.setAttribute("uv", new THREE.BufferAttribute(bandUv, 2)); bandGeo.setIndex(bandIdx);
    const bandM = new THREE.ShaderMaterial({ uniforms: { uOp: { value: 0 } }, vertexShader: "varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }", fragmentShader: BAND_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
    bandM.userData.outlineParameters = { visible: false }; bandM.userData.noOutline = true;
    const band = new THREE.Mesh(bandGeo, bandM); band.frustumCulled = false; band.renderOrder = 4; body.add(band);

    // the sunglasses: two wayfarer lenses and a bridge, glossy black, a white glint on each for the drawn look
    const shades = new THREE.Group(); body.add(shades);
    const blackM = new THREE.MeshStandardMaterial({ color: "#0a0a0e", roughness: 0.22, metalness: 0.1 });
    const LW = sp.lensW ?? 0.19, LH = LW * 0.62, GAP = LW * 1.12;
    for (const s of [-1, 1]) {
      const lg = new THREE.ExtrudeGeometry(roundRect(LW, LH, LH * 0.32, LW * 0.08), { depth: 0.008, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.004, bevelSegments: 2, curveSegments: 8 });
      const lens = mesh(lg, blackM, shades, (s * GAP) / 2, 0, 0); lens.rotation.y = s * 0.2; lens.castShadow = false;
      const gl = new THREE.Mesh(new THREE.PlaneGeometry(LW * 0.12, LH * 0.62), new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.85 }));
      gl.material.userData.noOutline = true; gl.position.set((s * GAP) / 2 - LW * 0.22, LH * 0.05, 0.014); gl.rotation.set(0, s * 0.2, 0.5); shades.add(gl);
    }
    mesh(new THREE.BoxGeometry(GAP - LW * 0.8, 0.016, 0.012), blackM, shades, 0, LH * 0.28, 0.002).castShadow = false;

    // the shoulder glow and the smoke curl
    const glows = [-1, 1].map(() => { const g = glowSprite([[0, "rgba(255,150,40,0.95)"], [0.4, "rgba(255,120,30,0.55)"], [1, "rgba(255,90,0,0)"]], false); body.add(g); return g; });
    const halo = glowSprite([[0, "rgba(255,170,70,0.55)"], [0.5, "rgba(255,110,30,0.22)"], [1, "rgba(255,80,0,0)"]]); halo.renderOrder = 2; body.add(halo);
    const puffs = Array.from({ length: 11 }, () => { const g = glowSprite([[0, "rgba(255,255,255,0.9)"], [0.5, "rgba(255,255,255,0.45)"], [1, "rgba(255,255,255,0)"]], false); body.add(g); return g; });
    const sparks = Array.from({ length: 14 }, () => { const g = glowSprite([[0, "rgba(255,240,180,1)"], [0.4, "rgba(255,150,40,0.7)"], [1, "rgba(255,90,0,0)"]]); body.add(g); return g; });

    const colY = new Float32Array(cols * rows);
    const v3 = new THREE.Vector3();
    return {
      grip: 0,
      apply(ps, t) {
        const open = clamp(ps.open ?? 0), burn = clamp(ps.burn ?? 0), glow = clamp(ps.glow ?? 0), puff = clamp(ps.puff ?? 0), wob = clamp(ps.wobble ?? 0);
        const eShape = smooth(0.15, 1, burn), flames = smooth(0.85, 1, burn);
        body.position.set(0, (ps.rise ?? 0) + wob * 0.035 * Math.sin(t * 2.1), 0);
        body.rotation.set(0, 0, wob * 0.045 * Math.sin(t * 1.45 + 0.6));
        // the cloth: each column runs from the top down to its hem; a lifted front ends higher (the rest is gathered)
        for (let j = 0; j < cols; j++) {
          const th = (j / NA) * Math.PI * 2 + Math.PI, d = Math.abs(wrapPi(th)), w = 1 - smooth(0.5, 1.5, d);
          const Lh = open * LIFT * w, vEnd = vAtY(PROF, Math.max(S.hemY, Lh)), sn = Math.sin(th), cs = Math.cos(th);
          for (let i = 0; i < rows; i++) {
            const v = (i / NV) * vEnd, [r0, y0, bend] = profAt(PROF, v), s = clamp((y0 < TOP ? (TOP - y0) / TOP : 0)), low = Math.pow(i / NV, 4);
            let r = r0 * (1 + Math.pow(s, 1.4) * (0.045 * Math.sin(7 * th + seed) + 0.024 * Math.sin(12 * th + 2.3 * seed)));
            r += 0.055 * w * open * low;                                   // the gathered cloth bunches out
            let y = y0 + (i === NV ? 0.018 * Math.sin(5 * th + seed) * (1 - w * open) : 0) * 1;
            if (S.shape === "hat") y += 0;
            // ember: a ghost's outline: two little arms flare out at the sides, the body tapers into a swaying tail,
            // and the hem licks up in flame tongues once the sweep is through
            const arm = eShape * Math.exp(-(((s - 0.36) / 0.11) ** 2)) * Math.pow(Math.abs(sn), 5);
            r = r * (1 - 0.5 * eShape * Math.pow(s, 1.6)) + 0.2 * arm;
            y += 0.07 * arm;
            const tail = eShape * 0.11 * Math.pow(s, 2) * Math.sin(t * 1.7 + s * 3.2);
            y += flames * Math.pow(i / NV, 6) * 0.09 * Math.max(0, Math.sin(9 * th - t * 5.5 + 1.7 * Math.sin(t * 2.3 + th * 3)));
            const k = (i * cols + j) * 3;
            pos[k] = r * sn + bend * BEND[0] + tail; pos[k + 1] = y; pos[k + 2] = r * cs * DZ + bend * BEND[1];
            colY[i * cols + j] = y;
          }
          hemPts[j].set(pos[(NV * cols + j) * 3], pos[(NV * cols + j) * 3 + 1], pos[(NV * cols + j) * 3 + 2]);
        }
        geo.attributes.position.needsUpdate = true; geo.setIndex(allIdx); geo.computeVertexNormals();   // normals from the whole sheet (an empty index would zero them: NaN in the bloom)
        // the sweep: faces above the line are ember, below it cloth
        const top = TOP + 0.04, yS = lerp(top, -0.06, burn);
        if (burn <= 0) eGeo.setIndex([]);
        else if (burn >= 1) { geo.setIndex([]); eGeo.setIndex(allIdx); }
        else {
          const a = [], b = [];
          for (const q of quads) { const cy = (colY[q[0]] + colY[q[1]] + colY[q[4]] + colY[q[2]]) / 4; (cy > yS ? b : a).push(...q); }
          geo.setIndex(a); eGeo.setIndex(b);
        }
        eGeo.attributes.normal = geo.attributes.normal;
        sheet.visible = burn < 1; ember.visible = burn > 0;
        emberM.uniforms.uOp.value = smooth(0, 0.08, burn);
        hemRoll.visible = burn < 1;
        if (hemRoll.visible) {
          const lift = (j) => { const th = (j / NA) * Math.PI * 2 + Math.PI; return open * (1 - smooth(0.5, 1.5, Math.abs(wrapPi(th)))); };
          hemRoll.geometry.dispose();
          const pts = hemPts.slice(0, NA);
          hemRoll.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), NA * 2, 1, 6, true);
          // the roll's thickness follows the lift: rescale each ring about its centre
          const tp = hemRoll.geometry.attributes.position, segs = NA * 2, ring = 7, curve = new THREE.CatmullRomCurve3(pts, true);
          for (let i = 0; i <= segs; i++) {
            const u = i / segs, c = curve.getPointAt(u % 1), rr = 0.011 + 0.03 * lift(Math.round(u * NA) % NA);
            for (let k = 0; k < ring; k++) { const n = i * ring + k; v3.fromBufferAttribute(tp, n).sub(c).multiplyScalar(rr).add(c); tp.setXYZ(n, v3.x, v3.y, v3.z); }
          }
          tp.needsUpdate = true; hemRoll.geometry.computeVertexNormals();
        }
        // the fire band, on the sweep line
        const bOn = burn > 0 && burn < 1; band.visible = bOn; bandM.uniforms.uOp.value = bOn ? Math.min(1, burn * 12, (1 - burn) * 10) : 0;
        if (bOn) for (let j = 0; j < cols; j++) {
          let px = 0, py = yS, pz = 0, ok = false;
          for (let i = 1; i < rows; i++) {
            const k0 = ((i - 1) * cols + j) * 3, k1 = (i * cols + j) * 3;
            if (pos[k0 + 1] >= yS && pos[k1 + 1] <= yS) { const f = (pos[k0 + 1] - yS) / Math.max(1e-6, pos[k0 + 1] - pos[k1 + 1]); px = lerp(pos[k0], pos[k1], f); pz = lerp(pos[k0 + 2], pos[k1 + 2], f); ok = true; break; }
          }
          if (!ok) { const k = (NV * cols + j) * 3; px = pos[k]; py = pos[k + 1]; pz = pos[k + 2]; }
          const L = Math.hypot(px, pz) || 1, ox = (px / L) * 0.012, oz = (pz / L) * 0.012, hw = 0.05;
          bandPos.set([px + ox, py - hw, pz + oz, px + ox, py + hw * 1.3, pz + oz], j * 6);
        }
        bandGeo.attributes.position.needsUpdate = true;
        // the sunglasses on the front, riding up on a lifted fold
        const gy = Math.max(EYE, open * LIFT + 0.07 * open), gv = vAtY(PROF, gy), [gr, , gb] = profAt(PROF, gv);
        const gv2 = vAtY(PROF, gy + 0.04), [gr2] = profAt(PROF, gv2);
        shades.position.set(gb * BEND[0], gy, gr * (1 - 0.22 * eShape * 0) * DZ + 0.006 + gb * BEND[1] + 0.03 * open);
        shades.rotation.set(-Math.atan2(gr - gr2, 0.04) * 0.8, 0, 0);
        // the shoulder glow and the smoke (grey on the cloth, glowing once it is ember)
        const fl = 0.85 + 0.15 * Math.sin(t * 17.3) * Math.sin(t * 7.1 + 1);
        glows.forEach((g, n) => {
          const th = (n ? 1 : -1) * 0.95, [rr, yy] = profAt(PROF, vAtY(PROF, (sp.shoulderY ?? (S.shape === "hat" ? S.brimY - 0.15 : S.h - S.r * 0.72))));
          g.position.set(Math.sin(th) * (rr + 0.03), yy, Math.cos(th) * (rr + 0.03) * DZ); const k = glow * (1 - burn); g.scale.setScalar(0.42 * k * fl + 1e-4); g.material.opacity = k; g.visible = k > 0.01;
        });
        halo.position.set(0, TOP * 0.55, -0.05); const hk = smooth(0, 0.5, burn); halo.scale.setScalar(2.1 * hk + 1e-4); halo.material.opacity = 0.75 * hk * fl; halo.visible = hk > 0.01;
        puffs.forEach((g, n) => {
          const u = (n / puffs.length + t * 0.33) % 1, ang = u * 6.5 + seed, yy = TOP + 0.02 + 0.48 * u;
          g.position.set(Math.sin(ang) * 0.06 * u, yy, Math.cos(ang) * 0.03 * u); const a = puff * (1 - u) * smooth(0, 0.18, u);
          g.scale.setScalar((0.045 + 0.13 * u) * (1 - 0.35 * burn) + 1e-4);
          g.material.color.setRGB(lerp(0.86, 1.0, burn), lerp(0.84, 0.62, burn), lerp(0.88, 0.25, burn));
          g.material.blending = burn > 0.3 ? THREE.AdditiveBlending : THREE.NormalBlending; g.material.opacity = a * 0.8; g.visible = a > 0.01;
        });
        sparks.forEach((g, n) => {
          const u = (n / sparks.length + t * 0.55 + 0.13 * Math.sin(n * 3.1)) % 1, th = n * 2.39996 + seed, rr = 0.25 + 0.15 * Math.sin(n * 1.7);
          const a = smooth(0, 0.6, burn) * (1 - u) * smooth(0, 0.1, u);
          g.position.set(Math.sin(th) * rr * (1 + u * 0.5), TOP * (0.25 + 0.95 * u), Math.cos(th) * rr * DZ); g.scale.setScalar(0.035 * (1 - 0.6 * u) + 1e-4); g.material.opacity = a; g.visible = a > 0.01;
        });
      },
    };
  },

  tripodcam(P) {
    const sp = P.spec, H = sp.h ?? 0.82, legM = mat("#2c2c33", { roughness: 0.4, metalness: 0.5 }), bodyM = mat("#1b1b20", { roughness: 0.45 }), trimM = mat("#3a3a44", { roughness: 0.35, metalness: 0.4 });
    // the tripod: three splayed legs from the head down to rubber feet, a centre column
    const headY = H - 0.11;
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + Math.PI / 6, foot = new THREE.Vector3(Math.sin(a) * 0.24, 0.01, Math.cos(a) * 0.24), top = new THREE.Vector3(Math.sin(a) * 0.03, headY, Math.cos(a) * 0.03);
      const len = foot.distanceTo(top), leg = mesh(new THREE.CylinderGeometry(0.011, 0.008, len, 10), legM, P.whole);
      leg.position.copy(foot).add(top).multiplyScalar(0.5); leg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), top.clone().sub(foot).normalize());
      mesh(new THREE.SphereGeometry(0.014, 10, 8), mat("#111114"), P.whole, foot.x, 0.012, foot.z);
    }
    mesh(new THREE.CylinderGeometry(0.03, 0.026, 0.06, 16), trimM, P.whole, 0, headY + 0.02, 0);
    mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.25, 8), legM, P.whole, 0, headY - 0.12, 0);
    // the camera: a body with a grip on the right, a lens toward -z, a flash on top, the timer lamp at the front corner
    const cam = new THREE.Group(); cam.position.set(0, H, 0); P.whole.add(cam);
    mesh(new THREE.BoxGeometry(0.24, 0.15, 0.085), bodyM, cam, 0, 0, 0);
    mesh(new THREE.BoxGeometry(0.055, 0.15, 0.11), bodyM, cam, 0.1, -0.005, -0.012);
    mesh(new THREE.BoxGeometry(0.09, 0.035, 0.07), bodyM, cam, -0.02, 0.09, 0);
    const lens = mesh(new THREE.CylinderGeometry(0.052, 0.056, 0.085, 28), trimM, cam, -0.01, 0, -0.085); lens.rotation.x = Math.PI / 2;
    const glass = mesh(new THREE.CircleGeometry(0.042, 28), new THREE.MeshStandardMaterial({ color: "#14203a", roughness: 0.05, metalness: 0.5 }), cam, -0.01, 0, -0.1285); glass.rotation.y = Math.PI;
    const back = mesh(new THREE.PlaneGeometry(0.15, 0.1), new THREE.MeshBasicMaterial({ color: "#2b3a55" }), cam, -0.02, 0, 0.0435); back.castShadow = false; back.material.userData.noOutline = true;
    const flashBox = mesh(new THREE.BoxGeometry(0.07, 0.04, 0.05), bodyM, cam, -0.02, 0.13, -0.005);
    const flashFace = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.03), new THREE.MeshBasicMaterial({ color: "#d9dde6" })); flashFace.material.userData.noOutline = true;
    flashFace.position.set(-0.02, 0.13, -0.031); flashFace.rotation.y = Math.PI; cam.add(flashFace); void flashBox;
    const lampM = new THREE.MeshBasicMaterial({ color: "#5a3a10" }); lampM.userData.noOutline = true;
    const lamp = mesh(new THREE.SphereGeometry(0.014, 14, 10), lampM, cam, 0.075, 0.082, -0.03); lamp.castShadow = false;
    const lampGlow = glowSprite([[0, "rgba(255,220,140,1)"], [0.3, "rgba(255,160,40,0.7)"], [1, "rgba(255,120,0,0)"]]); lampGlow.position.copy(lamp.position); cam.add(lampGlow);
    const burst = glowSprite([[0, "rgba(255,255,255,1)"], [0.25, "rgba(255,250,235,0.8)"], [1, "rgba(255,240,210,0)"]]); burst.position.set(-0.02, 0.13, -0.06); cam.add(burst);
    const blinks = sp.blinks || [], on = sp.blink ?? 0.14;
    return {
      grip: 0,
      apply(ps, t) {
        const lit = blinks.some((b) => t >= b && t < b + on), k = (ps.lit ?? 1) * (lit ? 1 : 0);
        lampM.color.set(lit ? "#ffb23c" : "#5a3a10"); lampGlow.visible = k > 0; lampGlow.scale.setScalar(0.17 * k + 1e-4);
        const f = sp.flash != null && t >= sp.flash ? Math.exp(-(t - sp.flash) / 0.09) : 0;
        burst.visible = f > 0.02; burst.scale.setScalar(1.6 * f + 1e-4); flashFace.material.color.set(f > 0.05 ? "#ffffff" : "#d9dde6");
      },
    };
  },
};
