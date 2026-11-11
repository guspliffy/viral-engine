import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

// Props for "That one friend with too much energy", episode 1: the library (Jonny's eight panels, 5 Nov 2026), in their
// own file so parallel clips never edit the same one (props3d.js merges LIBRARY_KINDS and LIBRARY_GRIPS on their own
// line). The hall behind is a painted plate (assets/plates/library-hall.png). Nothing here carries lettering.
//   libstack   a tall double-sided library bookcase (a "stack"), full of books on both faces. Origin: its bottom centre,
//              its long side along local x, its faces to +z and -z. spec.l (1.6), h (2.3), d (0.44), shelves (5),
//              seed. spec.rail: a brass ladder rail along its +z face at spec.railY (1.55) with a round end stop at
//              the -x end (spec.stop 1: the +x end). It never moves by itself: it falls as a physics body (spec.body { shape: "box" }).
//              Param bare 0..1 (0): empties the shelves from the top down, at 1 bare wood (bookstorm takes the books:
//              libstackBooks(spec) gives their slots).
//   libladder  a rolling library ladder: two side rails and round rungs, hooks at the top that sit on the rail, two
//              small wheels at the foot. Origin: the foot's middle; it leans back toward -z by spec.lean degrees (14),
//              climbed from +z. spec.h (1.75 along the rails), w (0.5). Grip "railL" / "railR": the rails at chest
//              height of a rider on the second rung.
//   libbook    a hardcover book lying closed (its spine toward -x) or held: spec.w (0.16 across the cover), h (0.22,
//              along the spine), t (0.04 thick), color, seed. spec.art "dragon": a dragon on the cover, and open 0..1
//              opens it (the cover half swings over the spine to -x: a spread of two pages with a dragon each);
//              stand 0..1 stands it up facing +z, like a picture book held toward us.
//   libdesk    the librarian's issue desk: a panelled wooden counter, its front to +z, a top with a little stack of
//              books and a card box. spec.w (1.3), h (0.72), d (0.55).
//   greenlamp  a reading lamp with a brass stem and a domed shade; lit, a warm glow under it. spec.color (shade, "#2f6b45").
//   shush      white swoosh lines of a shushed gust, a sprite group blowing toward +x in the prop's own frame (spec.size scales the lines);
//              blow 0..1 sweeps them across spec.l (1.4 m) and fades them out at the end.
export const LIBRARY_GRIPS = {
  libladder: { railL: [-0.23, 0.95, 0.05], railR: [0.23, 0.95, 0.05] },
  libbook: { cover: [0, 0, 0] },
};

const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
const clamp = (x) => Math.min(1, Math.max(0, x ?? 0));
function canvas(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return [c, c.getContext("2d")]; }
function tex(c) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
// a small seeded generator (mulberry32), so the same seed always fills the shelves the same way
function rng(seed) { let a = (seed * 2654435761) >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// book cloth colours of an old library: mostly muted, a few strong ones (copy nature: many dull, few bright)
const CLOTH = ["#7a2e2a", "#8c3b2e", "#5a3a26", "#2f4a3a", "#35506b", "#6b5a2e", "#4b2f45", "#7d6a4a", "#9a4a2a", "#3d3a5c", "#2c5a5a", "#a8743a", "#5e6b3a", "#8a2c3c"];

// libstack's book slots (bookstorm launches exactly these): per shelf (bottom up) and face (-z, then +z), runs of
// upright books of mixed width and height, a gap here and there, now and then one leaning on its neighbour or a short
// pile lying flat (nothing in a rhythm), from the stack's seed. Each slot is a box in the stack's own frame: its middle
// x, y, z, size w (along x), h (y), d (z), turn rz about z, face -1 / 1, flat (one of a pile lying flat), c (CLOTH index)
// and color. libstack draws these boxes; the order is its draw order.
export function libstackBooks(S) {
  const L = S.l ?? 1.6, H = S.h ?? 2.3, D = S.d ?? 0.44, N = S.shelves ?? 5, r = rng(S.seed ?? 3), T = 0.04;
  const y0 = 0.1, step = (H - 0.14 - y0) / N, out = [];
  const book = (x, y, z, w, h, d, rz, c, face, flat) => out.push({ x, y, z, w, h, d, rz, c, color: CLOTH[c], face, flat });
  for (let i = 0; i < N; i++) for (const f of [-1, 1]) {
    const yb = y0 + i * step + 0.014, hmax = step - 0.05;
    let x = -L / 2 + T * 1.5 + 0.01;
    const xe = L / 2 - T * 1.5 - 0.01;
    while (x < xe - 0.03) {
      const u = r();
      if (u < 0.06) { x += 0.05 + r() * 0.12; continue; }   // a gap
      if (u < 0.11) {   // a short pile lying flat
        const w = Math.min(0.22 + r() * 0.06, xe - x), n = 2 + Math.floor(r() * 3);
        if (w < 0.18) break;
        for (let k = 0; k < n; k++) book(x + w / 2 + (r() - 0.5) * 0.02, yb + 0.02 + k * 0.04, f * (D / 4), w - 0.02 * k, 0.035, D / 2 - 0.05, 0, Math.floor(r() * CLOTH.length), f, true);
        x += w + 0.01; continue;
      }
      const w = 0.025 + r() * 0.045, h = hmax * (0.62 + r() * 0.36), d = D / 2 - 0.04 - r() * 0.04;
      if (x + w > xe) break;
      const lean = u > 0.95 ? 0.22 : 0;   // one leaning on the next
      book(x + w / 2 + lean * h * 0.5, yb + h / 2 - lean * 0.01, f * (D / 4 + 0.005), w, h, d, -lean, Math.floor(r() * CLOTH.length), f, false);
      x += w + (lean ? h * 0.22 : 0.002);
    }
  }
  return out;
}

// a little dragon, drawn in a few strokes (cover and pages): a curled body, a wing, a head with a horn
function drawDragon(g, cx, cy, s, body, wing) {
  g.save(); g.translate(cx, cy); g.scale(s, s);
  g.fillStyle = wing; g.beginPath(); g.moveTo(-5, -10); g.quadraticCurveTo(-30, -48, 6, -46); g.quadraticCurveTo(-2, -34, 16, -30); g.quadraticCurveTo(6, -20, 10, -10); g.closePath(); g.fill();
  g.fillStyle = body; g.beginPath(); g.ellipse(0, 0, 26, 15, -0.2, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.moveTo(22, -6); g.quadraticCurveTo(34, -22, 40, -24); g.quadraticCurveTo(50, -24, 48, -14); g.quadraticCurveTo(40, -10, 30, 2); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(-24, 4); g.quadraticCurveTo(-44, 10, -40, 24); g.quadraticCurveTo(-36, 14, -20, 12); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(42, -24); g.lineTo(40, -34); g.lineTo(46, -24); g.fill();
  g.fillStyle = "#1c1410"; g.beginPath(); g.arc(44, -18, 1.8, 0, Math.PI * 2); g.fill();
  g.restore();
}

export const LIBRARY_KINDS = {
  libstack(P) {
    const S = P.spec, L = S.l ?? 1.6, H = S.h ?? 2.3, D = S.d ?? 0.44, N = S.shelves ?? 5;
    const wood = mat("#6b4428", { roughness: 0.5 }), dark = mat("#4a2e1a", { roughness: 0.6 }), T = 0.04;
    const g = new THREE.Group(); P.whole.add(g);
    // the carcass: two end panels with a plinth and a cornice, a middle board between the two faces, the shelves
    for (const s of [-1, 1]) mesh(new THREE.BoxGeometry(T * 1.5, H, D), wood, g, s * (L / 2 - T * 0.75), H / 2, 0);
    mesh(new THREE.BoxGeometry(L, 0.1, D + 0.02), dark, g, 0, 0.05, 0);
    mesh(new THREE.BoxGeometry(L + 0.08, 0.08, D + 0.08), wood, g, 0, H - 0.04, 0);
    mesh(new THREE.BoxGeometry(L + 0.12, 0.03, D + 0.12), dark, g, 0, H + 0.01, 0);
    mesh(new THREE.BoxGeometry(L - T * 2, H - 0.12, 0.02), dark, g, 0, H / 2, 0);
    const y0 = 0.1, step = (H - 0.14 - y0) / N;
    for (let i = 0; i <= N; i++) mesh(new THREE.BoxGeometry(L - T * 2, 0.028, D), wood, g, 0, y0 + i * step, 0);
    // the books (libstackBooks below: the same slots bookstorm launches): every book of the bookcase goes into one
    // mesh (vertex colours): hundreds of separate meshes made the contact checks, which measure hands against every
    // prop mesh, take minutes
    const geos = [], col = new THREE.Color(), O = new THREE.Object3D(), slots = libstackBooks(S);
    for (const k of slots) {
      O.position.set(k.x, k.y, k.z); O.rotation.set(0, 0, k.rz); O.scale.set(k.w, k.h, k.d); O.updateMatrix();
      const b = new THREE.BoxGeometry(1, 1, 1).toNonIndexed(); b.applyMatrix4(O.matrix); b.deleteAttribute("uv");
      col.set(CLOTH[k.c]); const n = b.attributes.position.count, a = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { a[i * 3] = col.r; a[i * 3 + 1] = col.g; a[i * 3 + 2] = col.b; }
      b.setAttribute("color", new THREE.BufferAttribute(a, 3)); geos.push(b);
    }
    // (not measured by the contact checks: the books sit inside the shelves, and a hand meets the shelves' boards first)
    const books = geos.length ? mesh(mergeGeometries(geos), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8 }), g) : null;
    if (books) books.userData.solid = false;
    // the brass rail for the rolling ladder on the +z face, on brackets, with a round end stop at the -x end
    if (S.rail) {
      const brass = mat("#b8913a", { roughness: 0.3, metalness: 0.6 }), ry = S.railY ?? 1.55, rz = D / 2 + 0.07;
      const rail = mesh(new THREE.CylinderGeometry(0.018, 0.018, L + 0.06, 12), brass, g, 0, ry, rz); rail.rotation.z = Math.PI / 2;
      for (const x of [-L / 2 + 0.05, 0, L / 2 - 0.05]) { const b = mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.08, 8), brass, g, x, ry, rz - 0.04); b.rotation.x = Math.PI / 2; }
      mesh(new THREE.SphereGeometry(0.045, 14, 10), brass, g, (S.stop ?? -1) * (L / 2 + 0.03), ry, rz);
    }
    // bare 0..1 (default 0: every book as before): the shelves empty from the top shelf down (the books after the
    // first (1 - bare) of the slots are not drawn); at 1 the shelves are bare wood. A step to 1 at bookstorm's t0
    // hands every book to the storm, which draws them in these same slots at that instant.
    // (a new draw range bumps the colours' version, so the frame cache's memo of this mesh sees the change)
    const nb = slots.length; let shown = nb;
    return {
      apply(ps) {
        if (!books) return;
        const k = Math.round((1 - clamp(ps.bare)) * nb);
        books.visible = k > 0;
        if (k !== shown) { shown = k; books.geometry.setDrawRange(0, k >= nb ? Infinity : k * 36); books.geometry.attributes.color.needsUpdate = true; }
      },
    };
  },

  libladder(P) {
    const S = P.spec, H = S.h ?? 1.75, W = S.w ?? 0.5, lean = ((S.lean ?? 14) * Math.PI) / 180;
    const wood = mat("#8a5a30", { roughness: 0.45 }), brass = mat("#b8913a", { roughness: 0.3, metalness: 0.6 }), dark = mat("#2a2420", { roughness: 0.6 });
    const g = new THREE.Group(); g.rotation.x = -lean; P.whole.add(g);
    for (const s of [-1, 1]) mesh(new THREE.BoxGeometry(0.045, H, 0.06), wood, g, (s * W) / 2, H / 2 + 0.05, 0);
    const n = 6;
    for (let i = 0; i < n; i++) { const y = 0.3 + (i * (H - 0.45)) / (n - 1); const rung = mesh(new THREE.CylinderGeometry(0.018, 0.018, W, 10), wood, g, 0, y, 0); rung.rotation.z = Math.PI / 2; }
    // the hooks at the top (they ride on the rail) and the wheels at the foot
    for (const s of [-1, 1]) {
      const hook = new THREE.TorusGeometry(0.035, 0.01, 8, 16, Math.PI * 1.2); const h = mesh(hook, brass, g, (s * W) / 2, H + 0.06, -0.04); h.rotation.y = Math.PI / 2;
      const wh = mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.025, 14), dark, g, (s * W) / 2, 0.04, 0.0); wh.rotation.z = Math.PI / 2;
    }
    return {};
  },

  libbook(P) {
    const S = P.spec, W = S.w ?? 0.16, H = S.h ?? 0.22, Tk = S.t ?? 0.04, r = rng(S.seed ?? 5);
    const color = S.color ?? CLOTH[Math.floor(r() * CLOTH.length)];
    let coverMat = mat(color, { roughness: 0.75 });
    const pageMat = mat("#efe4c8", { roughness: 0.9 });
    if (S.art === "dragon") {
      const [c, g] = canvas(256, 352); g.fillStyle = color; g.fillRect(0, 0, 256, 352);
      g.strokeStyle = "#d9b24a"; g.lineWidth = 8; g.strokeRect(14, 14, 228, 324); g.lineWidth = 3; g.strokeRect(26, 26, 204, 300);
      drawDragon(g, 120, 190, 2.0, "#e2b84a", "#c9952f");
      coverMat = new THREE.MeshStandardMaterial({ map: tex(c), roughness: 0.7 });
    }
    // closed it lies in the x/z plane: the cover on top (+y), the spine along z at -x. Open, the two halves swing up
    // about the spine to face +z like a picture book held toward us
    const g = new THREE.Group(); P.whole.add(g);
    const half = (s) => {
      const h = new THREE.Group(); g.add(h);
      const cov = mesh(new THREE.BoxGeometry(W, 0.006, H), s > 0 ? coverMat : mat(color, { roughness: 0.75 }), h, W / 2, s * (Tk / 2 - 0.003), 0);
      const pg = mesh(new THREE.BoxGeometry(W - 0.01, Tk / 2 - 0.006, H - 0.012), pageMat, h, W / 2 - 0.004, s * (Tk / 4), 0);
      return { h, cov, pg };
    };
    const top = half(1), bot = half(-1);
    mesh(new THREE.BoxGeometry(0.01, Tk, H), mat(color, { roughness: 0.75 }), g, 0, 0, 0);
    // the open spread: two pages with a dragon each (only shown open)
    let spread = null;
    if (S.art === "dragon") {
      const [c, gg] = canvas(512, 352); gg.fillStyle = "#f3e9cf"; gg.fillRect(0, 0, 512, 352);
      gg.fillStyle = "#e8d9b4"; gg.fillRect(250, 0, 12, 352);
      // a full-page picture on each side (readable at phone size from across the room)
      gg.fillStyle = "#a9c9e6"; gg.fillRect(18, 18, 222, 316); gg.fillStyle = "#c9e2f2"; gg.fillRect(272, 18, 222, 316);
      drawDragon(gg, 124, 200, 2.2, "#c8432e", "#9a2c22"); drawDragon(gg, 380, 200, 2.1, "#4a63b8", "#33478a");
      spread = mesh(new THREE.PlaneGeometry(W * 2 - 0.01, H - 0.01), new THREE.MeshStandardMaterial({ map: tex(c), roughness: 0.9 }), g, 0, -0.0015, 0);
      spread.rotation.x = -Math.PI / 2; spread.castShadow = false; spread.visible = false;
    }
    return {
      grip: 0,
      apply(ps) {
        // open 0..1 swings the cover half over the spine to the -x side (pages up: a spread); stand 0..1 stands the
        // whole book up facing +z (held toward us)
        const o = clamp(ps.open);
        top.h.rotation.z = o * Math.PI;
        g.rotation.x = clamp(ps.stand) * (Math.PI / 2);
        if (spread) spread.visible = o > 0.97;
      },
    };
  },

  libdesk(P) {
    const S = P.spec, W = S.w ?? 1.3, H = S.h ?? 0.72, D = S.d ?? 0.55, r = rng(S.seed ?? 9);
    const wood = mat("#6e4326", { roughness: 0.45 }), dark = mat("#4a2c18", { roughness: 0.55 }), green = mat("#2f5a3e", { roughness: 0.9 });
    mesh(new THREE.BoxGeometry(W, H - 0.05, D), wood, P.whole, 0, (H - 0.05) / 2, 0);
    mesh(new THREE.BoxGeometry(W + 0.08, 0.05, D + 0.08), dark, P.whole, 0, H - 0.025, 0);
    mesh(new THREE.BoxGeometry(W - 0.12, 0.012, D - 0.12), green, P.whole, 0, H + 0.006, 0);   // the leather inlay
    // three raised panels on the front
    for (let i = 0; i < 3; i++) { const x = (i - 1) * (W / 3); mesh(new THREE.BoxGeometry(W / 3 - 0.08, H - 0.22, 0.02), dark, P.whole, x, H / 2, D / 2 + 0.01); mesh(new THREE.BoxGeometry(W / 3 - 0.14, H - 0.3, 0.012), wood, P.whole, x, H / 2, D / 2 + 0.025); }
    // a little stack of returned books and a card box at the left end
    let y = H + 0.012;
    for (let k = 0; k < 4; k++) { const t = 0.03 + r() * 0.025; const b = mesh(new THREE.BoxGeometry(0.2 - k * 0.012, t, 0.15 - k * 0.006), mat(CLOTH[Math.floor(r() * CLOTH.length)], { roughness: 0.8 }), P.whole, -W / 2 + 0.2 + (r() - 0.5) * 0.02, y + t / 2, -0.02); b.rotation.y = (r() - 0.5) * 0.3; y += t; }
    mesh(new THREE.BoxGeometry(0.16, 0.08, 0.22), mat("#9a7a4a", { roughness: 0.7 }), P.whole, W / 2 - 0.18, H + 0.05, -0.04);
    return { grip: H };
  },

  greenlamp(P) {
    const S = P.spec, brass = mat("#b8913a", { roughness: 0.3, metalness: 0.6 });
    mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.025, 18), brass, P.whole, 0, 0.012, 0);
    mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.3, 10), brass, P.whole, 0, 0.16, 0);
    const shade = mesh(new THREE.SphereGeometry(0.11, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat(S.color ?? "#2f6b45", { roughness: 0.35, side: THREE.DoubleSide, emissive: new THREE.Color("#3a5a2a"), emissiveIntensity: 0.2 }), P.whole, 0, 0.31, 0);
    shade.scale.set(1.25, 0.55, 0.8);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 8), new THREE.MeshBasicMaterial({ color: "#fff1c4" })); bulb.position.set(0, 0.28, 0); P.whole.add(bulb);
    const [c, g] = canvas(128, 128); const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, "rgba(255,226,150,0.9)"); gr.addColorStop(1, "rgba(255,200,120,0)"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex(c), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.55 })); glow.material.userData.noOutline = true; glow.position.set(0, 0.24, 0.02); glow.scale.setScalar(0.55); P.whole.add(glow);
    return {};
  },

  shush(P) {
    const S = P.spec, L = S.l ?? 1.4, K = S.size ?? 1;   // size: the lines' scale
    const [c, g] = canvas(256, 64); g.strokeStyle = "rgba(255,255,255,0.95)"; g.lineCap = "round"; g.lineWidth = 9;
    g.beginPath(); g.moveTo(10, 40); g.bezierCurveTo(80, 10, 150, 60, 246, 26); g.stroke();
    g.strokeStyle = "rgba(170,200,230,0.9)"; g.lineWidth = 3; g.stroke();
    const m = new THREE.SpriteMaterial({ map: tex(c), transparent: true, depthWrite: false, opacity: 0 }); m.userData.noOutline = true;
    const lines = [[0, 0.0, 0], [-0.1, 0.18, 0.05], [0.05, -0.16, -0.04], [-0.2, 0.34, 0.02]].map(([x, y, z], i) => { const s = new THREE.Sprite(m); s.position.set(x, y * K, z); s.scale.set((0.7 - i * 0.08) * K, (0.17 - i * 0.02) * K, 1); P.whole.add(s); return { s, x }; });
    return {
      apply(ps) {
        const b = clamp(ps.blow);
        m.opacity = b <= 0 ? 0 : Math.min(1, b * 5) * (b > 0.75 ? (1 - b) / 0.25 : 1);
        for (const l of lines) { l.s.position.x = l.x + b * L; l.s.visible = m.opacity > 0.01; }
      },
    };
  },
};

// libfloor: the hall's polished wooden floor (it matches the painted floor in library-hall.png): long planks of warm
// red-brown in staggered rows, a few darker and lighter boards, a soft sheen. spec.w (12), d (14), seed. Origin: its
// middle, lying at y 0.002 so it covers the set's plain floor.
LIBRARY_KINDS.libfloor = function libfloor(P) {
  const S = P.spec, W = S.w ?? 12, D = S.d ?? 14, r = rng(S.seed ?? 21);
  const [c, g] = canvas(1024, 1024);
  g.fillStyle = "#5e3020"; g.fillRect(0, 0, 1024, 1024);
  const rows = 16, rh = 1024 / rows;
  for (let i = 0; i < rows; i++) {
    let x = -r() * 300;
    while (x < 1024) {
      const len = 220 + r() * 260, k = r(), base = k < 0.12 ? [92, 46, 30] : k > 0.9 ? [150, 84, 52] : [120 + r() * 18, 62 + r() * 12, 38 + r() * 8];
      const gr = g.createLinearGradient(0, i * rh, 0, (i + 1) * rh); gr.addColorStop(0, `rgb(${base.map((v) => Math.round(v * 1.08)).join(",")})`); gr.addColorStop(1, `rgb(${base.map((v) => Math.round(v * 0.9)).join(",")})`);
      g.fillStyle = gr; g.fillRect(x + 2, i * rh + 2, len - 4, rh - 4);
      g.strokeStyle = "rgba(60,30,18,0.35)"; g.lineWidth = 1.5; for (let q = 0; q < 3; q++) { g.beginPath(); const y = i * rh + 8 + r() * (rh - 16); g.moveTo(x + 6, y); g.bezierCurveTo(x + len * 0.3, y + 3, x + len * 0.6, y - 3, x + len - 6, y + 1); g.stroke(); }
      x += len;
    }
  }
  const t = tex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(W / 4, D / 4);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshStandardMaterial({ map: t, roughness: 0.35, metalness: 0.05 }));
  m.rotation.x = -Math.PI / 2; m.position.y = 0.002; m.receiveShadow = true; m.material.userData.noOutline = true; P.whole.add(m);
  return {};
};

// libdais: the low wooden platform the issue desk stands on (old libraries raise the librarian, so he sees the whole
// hall): a plank top with a darker edge and one step at its front. spec.w (1.6), d (1.1), h (0.32). Origin: its
// bottom centre, the step on +z.
LIBRARY_KINDS.libdais = function libdais(P) {
  const S = P.spec, W = S.w ?? 1.6, Dd = S.d ?? 1.1, Hh = S.h ?? 0.32;
  const top = mat("#7a4a2c", { roughness: 0.45 }), edge = mat("#4e2e1a", { roughness: 0.6 });
  mesh(new THREE.BoxGeometry(W, Hh - 0.03, Dd), edge, P.whole, 0, (Hh - 0.03) / 2, 0);
  mesh(new THREE.BoxGeometry(W + 0.04, 0.03, Dd + 0.04), top, P.whole, 0, Hh - 0.015, 0);
  mesh(new THREE.BoxGeometry(W * 0.6, Hh / 2, 0.24), top, P.whole, 0, Hh / 4, Dd / 2 + 0.12);
  return { grip: Hh };
};
