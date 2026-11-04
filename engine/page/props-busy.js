import * as THREE from "three";
import { clamp } from "./util.js";

// Props for "Look Busy" (the 4 Nov redo of story 18): an office rubber stamp, the ink marks it leaves on the bare desk,
// a two-sided MANAGER desk sign and the boss's tie.
//   rubberstamp  a wooden office stamp: a red rubber pad under a wooden block, a turned neck and a round knob on top.
//                Origin: the middle of the rubber's face (it stands on it). Held round the neck with the mug hold
//                (grips.mjs SIZE rubberstamp). spec.color the knob.
//   stampmarks   ink stamps on a desk top: spec.at [[x, z, rotDeg], ...] (offsets from the prop), spec.size [w, d] m,
//                spec.color. `count` 0..N shows the first N; each one appears at full strength on the frame its
//                count passes it (a stamp leaves its mark at once). Flat decals just above the surface, see-through
//                for the checks.
//   deskplate    a two-sided triangular desk sign (an A-frame of two slopes on a dark wood base) with spec.text
//                (default MANAGER) in dark letters on brass on both slopes, so it reads from either side. spec.w its
//                width. Origin: the bottom middle. Held with the box hold (grips.mjs SIZE deskplate).
//   blankreport  the unwritten report: a sheet with a title and empty lines, lying flat on its origin.
//   necktie      a tie: a knot and a long blade with diagonal stripes, hanging down from the origin (the knot) along -y
//                and lying on +z. spec.color, spec.stripe, spec.len. Worn with spec.wear.
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
function canvasTex(w, h, draw) {
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h; draw(cv.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

export const BUSY_KINDS = {
  rubberstamp(P) {
    const wood = mat("#a8703c", { roughness: 0.55 }), dark = mat("#5a3a20", { roughness: 0.5 }), rubber = mat("#b8282e", { roughness: 0.9 });
    mesh(new THREE.BoxGeometry(0.1, 0.01, 0.064), rubber, P.whole, 0, 0.005, 0);
    mesh(new THREE.BoxGeometry(0.104, 0.026, 0.068), wood, P.whole, 0, 0.023, 0);
    mesh(new THREE.CylinderGeometry(0.019, 0.026, 0.012, 20), dark, P.whole, 0, 0.042, 0);
    mesh(new THREE.CylinderGeometry(0.016, 0.02, 0.06, 20), wood, P.whole, 0, 0.078, 0);
    const knob = mesh(new THREE.SphereGeometry(0.031, 22, 16), mat(P.spec.color || "#c0312e", { roughness: 0.4 }), P.whole, 0, 0.118, 0);
    knob.scale.y = 0.85;
    return { grip: 0.08 };
  },

  stampmarks(P) {
    const [w, d] = P.spec.size || [0.1, 0.064], col = P.spec.color || "#c8263a";
    const tex = canvasTex(256, 164, (g, W, H) => {
      g.strokeStyle = col; g.fillStyle = col; g.lineWidth = 14; g.strokeRect(12, 12, W - 24, H - 24);
      let fs = 54; g.font = `900 ${fs}px sans-serif`; while (g.measureText("APPROVED").width > W - 64 && fs > 20) { fs -= 2; g.font = `900 ${fs}px sans-serif`; }
      g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("APPROVED", W / 2, H / 2 + 2);   // fitted inside the frame
      // a little missing ink, like a real stamp
      g.globalCompositeOperation = "destination-out";
      for (let i = 0; i < 40; i++) { const x = (Math.sin(i * 91.7) * 0.5 + 0.5) * W, y = (Math.sin(i * 37.3 + 1) * 0.5 + 0.5) * H; g.beginPath(); g.arc(x, y, 2 + (i % 4), 0, Math.PI * 2); g.fill(); }
    });
    const m = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.88, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
    m.userData.noOutline = true;
    const marks = (P.spec.at || []).map(([x, z, r], i) => {
      const o = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m); o.rotation.order = "YXZ"; o.rotation.set(-Math.PI / 2, ((r ?? 0) * Math.PI) / 180, 0);
      o.position.set(x, 0.001 + i * 0.0002, z); o.renderOrder = 2; o.frustumCulled = false; o.userData.steam = true; P.whole.add(o); return o;
    });
    return { grip: 0, apply(ps) { const n = ps.count ?? 0; marks.forEach((o, i) => { o.visible = n >= i + 1 - 1e-6; }); } };
  },

  deskplate(P) {
    const W = P.spec.w ?? 0.36, H = 0.1, D = 0.1, wood = mat("#3b2a20", { roughness: 0.5 });
    mesh(new THREE.BoxGeometry(W + 0.02, 0.012, D + 0.012), wood, P.whole, 0, 0.006, 0);
    const brassT = canvasTex(512, 128, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#f6d985"); gr.addColorStop(1, "#c99b38"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.strokeStyle = "#8a6420"; g.lineWidth = 6; g.strokeRect(6, 6, w - 12, h - 12);
      g.fillStyle = "#24180c"; g.font = "900 78px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(P.spec.text || "MANAGER", w / 2, h / 2 + 4);
    });
    const brass = new THREE.MeshStandardMaterial({ map: brassT, roughness: 0.35, metalness: 0.35 });
    const slant = Math.hypot(H, D / 2), tilt = Math.atan2(D / 2, H);
    for (const s of [1, -1]) {
      const g = new THREE.Group(); g.position.set(0, 0.012, (s * D) / 2); g.rotation.x = -s * tilt; P.whole.add(g);
      const face = mesh(new THREE.BoxGeometry(W, slant, 0.008), brass, g, 0, slant / 2, 0);
      if (s < 0) face.rotation.y = Math.PI;   // the back slope's letters read the right way from behind
    }
    return { grip: H * 0.5 };
  },

  // the report he should be writing: a white sheet lying flat, a REPORT title, a name line and empty ruled lines
  // (nothing written yet). Origin: the sheet's middle. spec.w, spec.d.
  blankreport(P) {
    const W = P.spec.w ?? 0.34, D = P.spec.d ?? 0.44;
    const tex = canvasTex(300, 390, (g, w, h) => {
      g.fillStyle = "#fbfaf6"; g.fillRect(0, 0, w, h);
      g.fillStyle = "#26324a"; g.font = "900 50px sans-serif"; g.textAlign = "center"; g.fillText("REPORT", w / 2, 68);
      g.fillStyle = "#8d96a6"; g.font = "700 22px sans-serif"; g.textAlign = "left"; g.fillText("Name:", 34, 116); g.fillRect(104, 112, 160, 3);
      g.fillStyle = "#c9d6e6"; for (let y = 160; y < h - 20; y += 30) g.fillRect(34, y, w - 68, 3);
    });
    const m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 });
    const o = mesh(new THREE.BoxGeometry(W, 0.004, D), [mat("#f4f2ec"), mat("#f4f2ec"), m, mat("#f4f2ec"), mat("#f4f2ec"), mat("#f4f2ec")], P.whole, 0, 0.002, 0);
    o.castShadow = false;
    return { grip: 0 };
  },

  necktie(P) {
    const L = P.spec.len ?? 0.32, tex = canvasTex(64, 256, (g, w, h) => {
      g.fillStyle = P.spec.color || "#2f5fb8"; g.fillRect(0, 0, w, h); g.strokeStyle = P.spec.stripe || "#e9c04a"; g.lineWidth = 7;
      for (let y = -w; y < h + w; y += 34) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y + w * 0.7); g.stroke(); }
    });
    const cloth = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7 });
    const sh = new THREE.Shape(); sh.moveTo(-0.018, 0); sh.lineTo(0.018, 0); sh.lineTo(0.048, -L + 0.05); sh.lineTo(0, -L); sh.lineTo(-0.048, -L + 0.05); sh.closePath();
    const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.01, bevelEnabled: true, bevelSize: 0.003, bevelThickness: 0.003, bevelSegments: 1 });
    geo.computeBoundingBox(); const b = geo.boundingBox, uv = geo.attributes.uv, pos = geo.attributes.position;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) - b.min.x) / (b.max.x - b.min.x), (pos.getY(i) - b.min.y) / (b.max.y - b.min.y));
    const blade = mesh(geo, cloth, P.whole, 0, -0.03, 0); blade.rotation.x = P.spec.lean ?? -0.25;
    const knot = mesh(new THREE.BoxGeometry(0.05, 0.045, 0.03), cloth, P.whole, 0, -0.012, 0.01); knot.scale.x = 0.9;
    return { grip: 0 };
  },
};
