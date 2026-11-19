import * as THREE from "three";
import { clamp } from "./util.js";

// Fact story 01 "How did one thief make the Mona Lisa famous?" (19 Nov 2026): the painting and the theft's props.
// Metres, y up, front +z, origin as said per kind. Every frame is a pure function of the params (no random, no clock).
// Potato scale: the cast are about 1.05 m tall, so the 77 x 53 cm panel is drawn about two thirds size.
// Registry line for props3d.js: import { MONALISA_KINDS, MONALISA_GRIPS } from "./props-monalisa.js";
//   Object.assign(KINDS, MONALISA_KINDS); Object.assign(GRIPS, MONALISA_GRIPS);
//
//   painting    The Mona Lisa (assets/props/monalisa/mona-lisa.jpg, public domain, Wikimedia C2RMF scan) on a wooden panel
//               spec.w 0.34 x spec.h 0.5, 0.02 thick, in a carved gilt frame 0.06 wide (spec.frame colour #8a6a2e) with an
//               optional glass pane (spec.glass true: a faint sheen). Origin: the bottom middle of the panel's BACK (it hangs on
//               a wall in the local xy plane, facing +z; hang it with y = centre height - h/2). Params: `cover` 0..1 = how much of the frame + glass is left
//               (1 = framed, 0 = the bare panel; jumps unless tweened: seed it). spec.src another picture (repo path).
//               Held by the box hold on its two side edges (GRIPS.painting.L/R at the panel's half height). Param `wrap` 0..1
//               wraps the bare panel in his white knit smock from the bottom up to 0.7 h (her face peeks out).
//   mlwall      Today's display: a dark blue free wall 2.6 x 2.8 with a glazed bronze-edged case round the painting.
//   frameonly   The empty gilt frame with its glass, lying or leaning: spec.w/h as the painting's, origin the middle of its back.
//   wallhooks   Four iron wall hooks (two up, two low) round where the painting hung, spec.w 0.34 x spec.h 0.5, and a slightly
//               paler rectangle on the wall behind (the dust line). Origin: the middle of that rectangle, on the wall (xy plane).
//   trunk       A wooden travelling trunk 0.62 (x) x 0.36 (y) x 0.38 (z): dark stained boards, two iron bands, brass corners,
//               a lid hinged at the back. Param `open` 0..1 (the lid swings up to 100 deg). Inside: a red cloth lining and a
//               false-bottom board (spec.bottom 0.12 up). Origin: bottom centre. Solid.
//   newspaper   One newspaper front page in the local xy plane facing +z, spec.w 0.42 x spec.h 0.56, origin its middle: a
//               masthead bar, grey column lines (no real words), and the painting as a big photo in the middle (sepia).
//               spec.bend 0..1 curls it a little (a page in the air). Not solid.
//   daypad      A tear-off day calendar on a wall, 0.26 x 0.34, origin the middle of its back. Param `count` = the day number
//               shown (floored; tweens smoothly, so the number runs). spec.label shown above the number ("DAY"). Not solid.
// Hands: only the painting is held (box hold, both palms on its side edges).

const mat = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
function canvasTex(w, h, draw) { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
const memo = new Map(), once = (key, make) => { if (!memo.has(key)) memo.set(key, make()); return memo.get(key); };
const queueLoad = (p) => (globalThis.__loads ||= []).push(p);
function picTex(src) {
  return once("ml:" + src, () => {
    let ok, bad; const job = new Promise((res, rej) => { ok = res; bad = rej; });
    const t = new THREE.TextureLoader().load(`/${src.replace(/^\/+/, "")}`, () => ok(), undefined, () => bad(new Error(`props-monalisa: ${src} is missing`)));
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; queueLoad(job); return t;
  });
}
const SRC = "assets/props/monalisa/mona-lisa.jpg";
const GILT = (c) => mat(c || "#8a6a2e", { roughness: 0.35, metalness: 0.55 });

// a carved frame round w x h: four bevelled bars with a raised inner lip
function frameGroup(w, h, fw, col) {
  const g = new THREE.Group(), m = GILT(col), dark = GILT("#5e4520");
  const bar = (len, x, y, rz) => {
    const b = mesh(new THREE.BoxGeometry(len, fw, 0.035), m, g, x, y, 0.0175); b.rotation.z = rz;
    const lip = mesh(new THREE.BoxGeometry(len - fw, 0.012, 0.012), dark, g, x - Math.sin(rz) * 0, y, 0.04); lip.rotation.z = rz;
    lip.position.x = x + (Math.abs(rz) > 0.1 ? -Math.sign(x) * (fw / 2 - 0.006) : 0); lip.position.y = y + (Math.abs(rz) > 0.1 ? 0 : -Math.sign(y) * (fw / 2 - 0.006));
  };
  bar(w + 2 * fw, 0, h / 2 + fw / 2, 0); bar(w + 2 * fw, 0, -h / 2 - fw / 2, 0);
  bar(h, -w / 2 - fw / 2, 0, Math.PI / 2); bar(h, w / 2 + fw / 2, 0, Math.PI / 2);
  return g;
}
function glassPane(w, h, z) {
  const m = new THREE.MeshBasicMaterial({ color: "#dfe9f2", transparent: true, opacity: 0.12, depthWrite: false });
  m.userData.noOutline = true; m.userData.glass = true;
  const o = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); o.position.z = z; o.userData.steam = true; o.userData.solid = false; return o;
}

export const MONALISA_KINDS = {
  painting(P) {
    const S = P.spec, w = S.w ?? 0.34, h = S.h ?? 0.5, fw = 0.06, G = new THREE.Group(); G.position.y = h / 2; P.whole.add(G);
    mesh(new THREE.BoxGeometry(w, h, 0.02), mat("#6b5134", { roughness: 0.85 }), G, 0, 0, 0.01);
    const face = mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: picTex(S.src || SRC), roughness: 0.7 }), G, 0, 0, 0.0205); face.castShadow = false;
    const fr = frameGroup(w, h, fw, S.frame); G.add(fr);
    const gl = S.glass !== false ? glassPane(w + 0.01, h + 0.01, 0.05) : null; if (gl) G.add(gl);
    // the smock: white knit cloth wrapped round the bare panel from the bottom up to 0.7 h (her face still peeks out)
    const cloth = new THREE.Group(); cloth.position.y = -h / 2 - 0.02; G.add(cloth);
    const knit = mat("#ece6d6", { roughness: 1 });
    mesh(new THREE.BoxGeometry(w + 0.05, 1, 0.07), knit, cloth, 0, 0.5, 0.01);
    for (const y of [0.25, 0.6, 0.92]) { const f = mesh(new THREE.BoxGeometry(w + 0.07, 0.025, 0.08), mat("#d8d0bd", { roughness: 1 }), cloth, 0, y, 0.012); f.rotation.z = (y - 0.55) * 0.25; }
    return {
      grip: h / 2,
      apply(ps) {
        const on = (ps.cover ?? S.cover ?? 1) > 0.5; fr.visible = on; if (gl) gl.visible = on;
        const k = clamp(ps.wrap ?? S.wrap ?? 0, 0, 1); cloth.visible = k > 0.01; cloth.scale.y = Math.max(0.001, k * (0.7 * h + 0.02));
      },
    };
  },

  // today's display (Salle des Etats): a dark blue free wall 2.6 x 2.8 m, 0.04 thick, and on it a glazed case with a dark
  // bronze edge round where the painting hangs (spec.cy = the case's centre height, 0.87; spec.cw x spec.ch 0.62 x 0.82, 0.3 deep).
  // Origin: the bottom middle of the wall's BACK, facing +z (stand it 0.01 off the gallery wall; hang the painting 0.06 in front).
  mlwall(P) {
    const S = P.spec, W = S.w ?? 2.6, H = S.h ?? 2.8, cy = S.cy ?? 0.87, cw = S.cw ?? 0.62, ch = S.ch ?? 0.82, cd = 0.3;
    mesh(new THREE.BoxGeometry(W, H, 0.04), mat(S.color || "#33465c", { roughness: 0.85 }), P.whole, 0, H / 2, 0.02);
    const bronze = mat("#3a3128", { roughness: 0.4, metalness: 0.6 }), e = 0.025;
    for (const [x, y, bw, bh] of [[0, cy + ch / 2, cw + e, e], [0, cy - ch / 2, cw + e, e], [-cw / 2, cy, e, ch + e], [cw / 2, cy, e, ch + e]]) mesh(new THREE.BoxGeometry(bw, bh, e), bronze, P.whole, x, y, 0.04 + cd);
    for (const [x, y] of [[-cw / 2, cy + ch / 2], [cw / 2, cy + ch / 2], [-cw / 2, cy - ch / 2], [cw / 2, cy - ch / 2]]) mesh(new THREE.BoxGeometry(e, e, cd), bronze, P.whole, x, y, 0.04 + cd / 2);
    const gm = new THREE.MeshBasicMaterial({ color: "#dfe9f2", transparent: true, opacity: 0.14, depthWrite: false }); gm.userData.noOutline = true; gm.userData.glass = true;
    const front = new THREE.Mesh(new THREE.PlaneGeometry(cw, ch), gm); front.position.set(0, cy, 0.04 + cd); P.whole.add(front);
    const sheen = new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.18, depthWrite: false }); sheen.userData.noOutline = true;
    const st = new THREE.Mesh(new THREE.PlaneGeometry(0.06, ch * 0.9), sheen); st.position.set(-cw * 0.22, cy, 0.041 + cd); st.rotation.z = -0.35; P.whole.add(st);
    return { grip: 0 };
  },

  frameonly(P) {
    const S = P.spec, w = S.w ?? 0.34, h = S.h ?? 0.5;
    P.whole.add(frameGroup(w, h, 0.06, S.frame)); P.whole.add(glassPane(w + 0.01, h + 0.01, 0.03));
    return { grip: 0 };
  },

  wallhooks(P) {
    const S = P.spec, w = S.w ?? 0.34, h = S.h ?? 0.5, iron = mat("#2d2b2a", { roughness: 0.4, metalness: 0.6 });
    const pale = new THREE.MeshStandardMaterial({ color: S.wall || "#cbbfa6", roughness: 0.9, transparent: true, opacity: 0.55 });
    const r = mesh(new THREE.PlaneGeometry(w + 0.12, h + 0.12), pale, P.whole, 0, 0, 0.002); r.castShadow = false;
    for (const [x, y] of [[-w / 2 + 0.03, h / 2 + 0.02], [w / 2 - 0.03, h / 2 + 0.02], [-w / 2 + 0.03, -h / 2 + 0.04], [w / 2 - 0.03, -h / 2 + 0.04]]) {
      const peg = mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.05, 8), iron, P.whole, x, y, 0.025); peg.rotation.x = Math.PI / 2;
      const tip = mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.025, 8), iron, P.whole, x, y + 0.012, 0.05);
      tip.castShadow = false;
    }
    return { grip: 0 };
  },

  trunk(P) {
    const S = P.spec, W = 0.62, H = 0.36, D = 0.38, LID = 0.08, wood = mat("#5a3a22", { roughness: 0.8 }), iron = mat("#2b2a2a", { roughness: 0.45, metalness: 0.5 }), brass = mat("#b48a3c", { roughness: 0.35, metalness: 0.7 });
    const t = 0.02, body = new THREE.Group(); P.whole.add(body);
    mesh(new THREE.BoxGeometry(W, t, D), wood, body, 0, t / 2, 0);
    mesh(new THREE.BoxGeometry(W, H - LID, t), wood, body, 0, (H - LID) / 2, D / 2 - t / 2);
    mesh(new THREE.BoxGeometry(W, H - LID, t), wood, body, 0, (H - LID) / 2, -D / 2 + t / 2);
    for (const s of [-1, 1]) mesh(new THREE.BoxGeometry(t, H - LID, D), wood, body, s * (W / 2 - t / 2), (H - LID) / 2, 0);
    mesh(new THREE.BoxGeometry(W - 2 * t, 0.012, D - 2 * t), mat("#9b2a2a", { roughness: 0.95 }), body, 0, S.bottom ?? 0.12, 0);
    for (const x of [-W / 3, W / 3]) mesh(new THREE.BoxGeometry(0.03, H - LID + 0.004, D + 0.006), iron, body, x, (H - LID) / 2, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) mesh(new THREE.BoxGeometry(0.045, 0.045, 0.045), brass, body, sx * (W / 2 - 0.02), 0.022, sz * (D / 2 - 0.02));
    mesh(new THREE.BoxGeometry(0.05, 0.06, 0.012), brass, body, 0, H - LID - 0.03, D / 2 + 0.005);
    const hinge = new THREE.Group(); hinge.position.set(0, H - LID, -D / 2); P.whole.add(hinge);
    const lid = mesh(new THREE.BoxGeometry(W, LID, D), wood, hinge, 0, LID / 2, D / 2);
    for (const x of [-W / 3, W / 3]) mesh(new THREE.BoxGeometry(0.03, LID + 0.004, D + 0.006), iron, hinge, x, LID / 2, D / 2);
    mesh(new THREE.BoxGeometry(W - 2 * t, 0.006, D - 2 * t), mat("#9b2a2a", { roughness: 0.95 }), hinge, 0, 0.004, D / 2);
    lid.userData.lid = true;
    return { grip: 0, apply(ps) { hinge.rotation.x = -clamp(ps.open ?? S.open ?? 0, 0, 1) * (100 * Math.PI / 180); } };
  },

  newspaper(P) {
    const S = P.spec, w = S.w ?? 0.42, h = S.h ?? 0.56;
    const pic = picTex(S.src || SRC);
    const page = canvasTex(420, 560, (g, W, H) => {
      g.fillStyle = "#efe8d6"; g.fillRect(0, 0, W, H);
      g.fillStyle = "#1d1b19"; g.fillRect(24, 18, W - 48, 46); g.fillStyle = "#efe8d6"; g.fillRect(30, 24, W - 60, 34);
      g.fillStyle = "#1d1b19"; for (let i = 0; i < 6; i++) g.fillRect(44 + i * 56, 32, 40, 18);
      g.fillRect(24, 74, W - 48, 4); g.fillRect(40, 86, W - 80, 30);
      g.fillStyle = "#8d877c"; for (let col = 0; col < 3; col++) for (let r = 0; r < 26; r++) { const x = 24 + col * ((W - 48) / 3), y = 130 + r * 15; if (col === 1 && y < 430) continue; g.fillRect(x + 4, y, (W - 48) / 3 - 14 - ((r * 7 + col * 3) % 5) * 6, 6); }
    });
    const m = new THREE.MeshStandardMaterial({ map: page, roughness: 0.95, side: THREE.DoubleSide });
    const geo = new THREE.PlaneGeometry(w, h, 8, 1), bend = S.bend ?? 0, pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) { const x = pos.getX(i); pos.setZ(i, -bend * 0.08 * (x / (w / 2)) ** 2); }
    geo.computeVertexNormals();
    const o = mesh(geo, m, P.whole); o.userData.steam = true; o.userData.solid = false;
    const photo = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.3, h * 0.42), new THREE.MeshStandardMaterial({ map: pic, color: "#d9c39b", roughness: 0.9 }));
    photo.position.set(0, -h * 0.05, 0.002 - bend * 0.0); photo.userData.steam = true; photo.userData.solid = false; P.whole.add(photo);
    return { grip: 0 };
  },

  daypad(P) {
    const S = P.spec, w = 0.26, h = 0.34, label = S.label ?? "DAY";
    mesh(new THREE.BoxGeometry(w, h, 0.04), mat("#f2ede2", { roughness: 0.9 }), P.whole, 0, 0, 0.02);
    mesh(new THREE.BoxGeometry(w, 0.06, 0.045), mat("#a1302b", { roughness: 0.7 }), P.whole, 0, h / 2 - 0.03, 0.0225);
    const cv = document.createElement("canvas"); cv.width = 256; cv.height = 256;
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
    const face = mesh(new THREE.PlaneGeometry(w - 0.02, h - 0.08), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }), P.whole, 0, -0.03, 0.0405); face.castShadow = false;
    let shown = null;
    const draw = (n) => {
      const g = cv.getContext("2d"); g.fillStyle = "#f7f3ea"; g.fillRect(0, 0, 256, 256);
      g.fillStyle = "#6d675d"; g.font = "bold 40px sans-serif"; g.textAlign = "center"; g.fillText(label, 128, 56);
      g.fillStyle = "#1e1c1a"; g.font = `bold ${n >= 100 ? 120 : 150}px serif`; g.fillText(String(n), 128, 200);
      tex.needsUpdate = true;
    };
    return { grip: 0, apply(ps) { const n = Math.max(1, Math.floor(ps.count ?? S.count ?? 1)); if (n !== shown) { shown = n; draw(n); } } };
  },
};

// the box hold on the painting's side edges, at half height (local frame, metres)
export const MONALISA_GRIPS = {
  painting: { L: [-0.2, 0.25, 0.03], R: [0.2, 0.25, 0.03] },
};
