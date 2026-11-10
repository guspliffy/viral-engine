import * as THREE from "three";
import { clamp, lerp } from "./util.js";
import { noteTexture } from "./props-money.js";

// "Your broke friend can copy money. There's a catch." (There's a catch, episode 4, 10 Nov 2026): the money tsunami outside
// the diner's big window, the notes that pour in under it and the rain of paper IOUs. Metres, each prop in its own frame:
// origin on the floor, the room side is +z, the generator turns and places them. Everything unlit (flat, bright, cel bands),
// deterministic (every motion is a function of the params and a hash of the instance index, no history), and see-through
// for the checks (userData.steam) except nothing here is touched by a hand. A param that propState (props3d.js) has no
// default for (front, clock, grow, amount) reads spec.<name> until a tween sets it, and the first tween of such a key
// JUMPS: seed it with a dur-0 `set` at time 0, then tween (`level` has a propState default of spec.level ?? 1).
//   windowwall  the diner's window wall: the painted plate as a standing wall card with the panes cut out, so what is behind
//               shows through the glass. Origin: the floor under the middle of the wall, the card in the plane z 0 facing +z.
//               spec: src ("assets/plates/diner-sunny.png"), h (6.4, the card's height; its width is h x the picture's
//               aspect, 3.66 for the plate), cy (1.3, the card centre's height above the floor, so the panes span y 0.2 to
//               2.65), tiles (1; 2 or 3 repeats the picture along x, every second copy mirrored: the clip uses 2, 7.3 m
//               wide, panes cut in every copy), panes (rectangles in picture shares [x0, y0, x1, y1, leafy?], top left
//               origin; the default is the plate's seven panes between the red mullions, split at the thin cross bars so
//               every red frame and bar stays opaque, plus the two narrow far-left panes with leafy 1 = the houseplant's
//               leaves stay opaque), back (4.5, metres behind the wall where an unlit copy of the picture stands as the far
//               street, scaled by 1 + back/8 about the panes' centre, so the sky, palms and street stay in the windows; its
//               red frames are painted out so no second window frame shows through), glass (0.12, a faint white sheen with
//               two soft streaks on the panes; 0 for none). No params. The card blocks nothing for the contact checks but
//               hides what is behind it outside the panes.
//   moneywave   the wave: a curling crest of banknotes seen in profile, standing behind the wall (the generator places it
//               1.0 to 3.5 m behind), running along x: it enters from -x and rolls toward +x. Origin: the floor at the middle
//               of its length and its depth (z -d/2 to d/2, the face toward +z is the one seen from the room).
//               spec: len (16, x extent: the crest's tip runs from -len/2 to +len/2), h (2.7, the crest's height at level 1),
//               d (2.5, depth z), notes (4200, banknotes on the face), car (1: the red hatchback riding it; 0 none),
//               palm ([1.8, 0.2], x and z of the palm the wave bends over; null for none).
//               Params: front 0..1 (the lip's tip along len: 0 = not yet in view at the -x end, 1 = past the +x end, the
//               street full), level 0..1 (how high the flood behind the crest stands: at 1 it stands at 85 % of spec.h, the
//               crest at spec.h; at 0.3 the flood is 0.25 h and the crest 0.65 h), clock (seconds; every tumble, bob and
//               spray runs on it). Look: a surf wave built of banknotes (the note texture, bright bands by depth under a
//               pale foam rim), a dark body under it (#5e9457 up top to #3f6f47 at the bottom), spray notes flying off the
//               lip and ahead of the crest.
//   noteflood   notes pouring into the room under the wall: a fan of notes on the floor in front of the origin (+z).
//               spec: w (3.6, width along x), d (2.2, how far it reaches into the room at grow 1), n (900 notes).
//               Params: grow 0..1 (default spec.grow 0; the edge reaches grow x d, 3 to 8 cm deep, thicker at the wall),
//               clock (seconds: the edge breathes and single notes slide ahead of it). Lies on the floor from y 0.004.
//   noterain    paper falling from above onto a spot. Origin: the floor under the middle of the disc.
//               spec: look ("iou" cream paper 0.14 x 0.1 with a ruled line and a hand-written IOU in blue ink | "note" the
//               green banknote 0.2 x 0.1 | "snow" white round flakes r 0.012 to 0.03 that never pile), n (60; snow 200,
//               up to 400), top (3.2, start height), r (0.9; snow 3, up to 6, the disc round the origin), span (1.0 s over
//               which the cards are let go, one after another; paper only).
//               Params: amount 0..1 (default spec.amount 1: how many are in the air or down, the first n x amount of a
//               low-discrepancy order so any share is spread over the disc), clock (seconds; a card takes 1.1 s from the top
//               to the floor, card i starting at clock i/n x span; snow loops top to floor in 3 s and never lands).
//               Paper lands flat, stays, and stacks a little (y from 0.004).
export const FLOOD_KINDS = {};

const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const R2a = (i) => (0.5 + i * 0.7548776662466927) % 1, R2b = (i) => (0.5 + i * 0.5698402909980532) % 1;   // a low-discrepancy 2D sequence: any prefix is spread evenly
const sm = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const par = (ps, S, k, d) => ps[k] ?? S[k] ?? d;
const noOutline = (m) => { m.userData.noOutline = true; return m; };
const basicMat = (o) => noOutline(new THREE.MeshBasicMaterial({ fog: false, toneMapped: false, ...o }));
// see-through for the checks and out of the shadow pass (the whole subtree)
const see = (root) => { root.traverse((o) => { o.castShadow = o.receiveShadow = false; o.userData.steam = true; if (o.isMesh) o.frustumCulled = false; }); return root; };
const canvasOf = (w, h, draw) => { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); return c; };
const texOf = (c) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };

// a pale banknote for foam: the shared note face washed out toward cream
function foamTexture() {
  const t = noteTexture(), src = t.image;
  return texOf(canvasOf(src.width, src.height, (g, w, h) => { g.drawImage(src, 0, 0); g.fillStyle = "rgba(246,250,226,0.4)"; g.fillRect(0, 0, w, h); }));
}
// the paper IOU: cream, faint blue ruled lines, a red margin line, "IOU" in dark blue ink
function iouTexture() {
  return texOf(canvasOf(280, 200, (g, w, h) => {
    g.fillStyle = "#f6efd9"; g.fillRect(0, 0, w, h);
    g.strokeStyle = "rgba(90,130,190,0.45)"; g.lineWidth = 2;
    for (let y = 46; y < h; y += 30) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    g.strokeStyle = "rgba(200,70,70,0.5)"; g.beginPath(); g.moveTo(34, 0); g.lineTo(34, h); g.stroke();
    g.strokeStyle = "rgba(60,50,30,0.25)"; g.lineWidth = 4; g.strokeRect(2, 2, w - 4, h - 4);
    g.save(); g.translate(w / 2 + 12, h / 2 + 14); g.rotate(-0.07);
    g.fillStyle = "#1f2f7a"; g.textAlign = "center"; g.textBaseline = "middle"; g.font = "italic 900 96px 'Comic Sans MS', 'Segoe Script', cursive, sans-serif"; g.fillText("IOU", 0, 0);
    g.strokeStyle = "#1f2f7a"; g.lineWidth = 5; g.lineCap = "round"; g.beginPath(); g.moveTo(-80, 52); g.quadraticCurveTo(-10, 40, 82, 56); g.stroke();
    g.restore();
  }));
}
// a banded gradient strip (v = 0 bottom, 1 top), nearest-filtered so the bands stay hard (cel style)
function bandTexture(bottom, top, bands) {
  const a = new THREE.Color(bottom), b = new THREE.Color(top);
  const c = canvasOf(4, bands, (g, w, h) => { for (let i = 0; i < bands; i++) { const k = bands > 1 ? i / (bands - 1) : 0, col = a.clone().lerp(b, k); g.fillStyle = `#${col.getHexString()}`; g.fillRect(0, h - 1 - i, w, 1); } });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; return t;
}
// a pool of flat note cards: one instanced mesh, matrices and colours set per frame
function noteMesh(parent, tex, n, order = 0, doubleSide = true) {
  const m = basicMat({ map: tex, side: doubleSide ? THREE.DoubleSide : THREE.FrontSide });
  const im = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), m, n);
  im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); im.renderOrder = order; im.frustumCulled = false; im.castShadow = im.receiveShadow = false; im.userData.steam = true;
  im.setColorAt(0, new THREE.Color(1, 1, 1));
  parent.add(im); return im;
}
const ZERO = new THREE.Matrix4().makeScale(0, 0, 0);

// ------------------------------------------------------------------------------------------------ the window wall
// the plate's panes in picture pixels (768 x 1344), measured from assets/plates/diner-sunny.png: x0, y0, x1, y1 (the red
// frame and the thin cross bars stay out), leafy 1 for the far-left panes behind the houseplant
const PX = 768, PY = 1344;
const PANES_PX = [
  [226, 407, 293, 576], [226, 583, 293, 686], [226, 692, 293, 903],
  [304, 407, 374, 576], [304, 581, 374, 682], [304, 688, 374, 903],
  [409, 407, 494, 903],
  [527, 407, 594, 546], [527, 553, 594, 622], [527, 629, 594, 903],
  [605, 407, 672, 544], [605, 550, 672, 620], [605, 628, 672, 903],
  [716, 407, 768, 540], [716, 546, 768, 617], [716, 624, 768, 903],
  [126, 410, 182, 903, 1], [62, 690, 88, 903, 1],
];
const PANES = PANES_PX.map(([a, b, c, d, f]) => (f ? [a / PX, b / PY, c / PX, d / PY, 1] : [a / PX, b / PY, c / PX, d / PY]));

// the picture with its red window frames painted out (the far street: no second frame shows through the glass): every
// short red run is bridged with the colours at its ends, across (posts), then down (cross bars)
function cleanedStreet(img) {
  const w = img.width, h = img.height, c = canvasOf(w, h, (g) => g.drawImage(img, 0, 0)), g = c.getContext("2d");
  const d = g.getImageData(0, 0, w, h), a = d.data, y0 = Math.round(h * 0.29), y1 = Math.round(h * 0.69);
  const red = (i) => a[i] > 140 && a[i + 1] < 120 && a[i + 2] < 115 && a[i] - a[i + 1] > 60;
  const bridge = (idx, n, maxRun, isRed) => {   // idx(k) -> pixel offset along the line, k 0..n-1
    let k = 0;
    while (k < n) {
      if (!isRed(idx(k))) { k++; continue; }
      let e = k; while (e < n && isRed(idx(e))) e++;
      if (e - k <= maxRun) {
        const L = k > 0 ? idx(k - 1) : idx(Math.min(e, n - 1)), R = e < n ? idx(e) : L;
        for (let j = k; j < e; j++) { const t = (j - k + 1) / (e - k + 1), p = idx(j); for (let q = 0; q < 3; q++) a[p + q] = a[L + q] + (a[R + q] - a[L + q]) * t; }
      }
      k = e;
    }
  };
  for (let y = y0; y < y1; y++) bridge((x) => (y * w + x) * 4, w, 42, red);
  for (let x = 0; x < w; x++) bridge((y) => ((y0 + y) * w + x) * 4, y1 - y0, 22, red);
  g.putImageData(d, 0, 0);
  const t = texOf(c); t.anisotropy = 4; return t;
}

FLOOD_KINDS.windowwall = (P) => {
  const S = P.spec, src = S.src ?? "assets/plates/diner-sunny.png", H = S.h ?? 6.4, cy = S.cy ?? 1.3, back = S.back ?? 4.5, glass = S.glass ?? 0.12;
  const tiles = Math.max(1, Math.min(4, Math.round(S.tiles ?? 1))), panes = S.panes ?? PANES;
  const root = P.whole;
  const load = new THREE.TextureLoader().loadAsync(`/${src.replace(/^\/+/, "")}`).then((map) => {
    map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 4;
    const img = map.image, iw = img.width, ih = img.height, W = H * iw / ih, sx = W / iw, sy = H / ih;
    // the pane masks: cut (white = card stays, black = pane) and sheen (the panes, with two soft light streaks)
    const px = panes.map(([a, b, c, d, f]) => [Math.round(a * iw), Math.round(b * ih), Math.round(c * iw), Math.round(d * ih), f]);
    const pic = canvasOf(iw, ih, (g) => g.drawImage(img, 0, 0)).getContext("2d").getImageData(0, 0, iw, ih).data;
    const cut = canvasOf(iw, ih, (g, w, h) => { g.fillStyle = "#fff"; g.fillRect(0, 0, w, h); });
    const gc = cut.getContext("2d"), cd = gc.getImageData(0, 0, iw, ih), sheenC = canvasOf(iw, ih, (g, w, h) => { g.fillStyle = "#000"; g.fillRect(0, 0, w, h); });
    const sg = sheenC.getContext("2d"), sd = sg.getImageData(0, 0, iw, ih);
    for (const [x0, y0, x1, y1, leafy] of px) {
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
        const i = (y * iw + x) * 4;
        if (leafy && pic[i + 1] > pic[i] && pic[i + 1] >= pic[i + 2] - 4) continue;   // a leaf of the houseplant: stays
        cd.data[i] = cd.data[i + 1] = cd.data[i + 2] = 0;
        const streak = (x - y * 0.5) % 190 < 22 || (x - y * 0.5 + 60) % 190 < 8;
        sd.data[i] = sd.data[i + 1] = sd.data[i + 2] = streak ? 255 : 128;
      }
    }
    gc.putImageData(cd, 0, 0); sg.putImageData(sd, 0, 0);
    const cutTex = new THREE.CanvasTexture(cut), sheenTex = new THREE.CanvasTexture(sheenC);
    for (const t of [cutTex, sheenTex]) { t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; }
    const street = back > 0 ? cleanedStreet(img) : null;
    // the panes' centre (picture px, from the clean panes): the far street is scaled about it
    const clean = px.filter((p) => !p[4]), bx0 = Math.min(...clean.map((p) => p[0])), bx1 = Math.max(...clean.map((p) => p[2])), by0 = Math.min(...clean.map((p) => p[1])), by1 = Math.max(...clean.map((p) => p[3]));
    const pcx = ((bx0 + bx1) / 2 - iw / 2) * sx, pcy = cy + H / 2 - ((by0 + by1) / 2) * sy;   // in a tile's own frame (x from its middle, y above the floor)
    const frontM = basicMat({ map, alphaMap: cutTex, alphaTest: 0.5 }), sheenM = basicMat({ color: "#ffffff", alphaMap: sheenTex, transparent: true, opacity: Math.min(1, glass * 2), depthWrite: false });
    const backM = street && basicMat({ map: street });
    for (let k = 0; k < tiles; k++) {
      const flip = k % 2 === 1, xk = (k - (tiles - 1) / 2) * W;
      const mirror = (geo) => { if (flip) { const u = geo.attributes.uv; for (let i = 0; i < u.count; i++) u.setX(i, 1 - u.getX(i)); } return geo; };
      const card = new THREE.Mesh(mirror(new THREE.PlaneGeometry(W, H)), frontM); card.position.set(xk, cy, 0); card.name = "windowwall-card"; root.add(card);
      if (glass > 0) { const sh = new THREE.Mesh(mirror(new THREE.PlaneGeometry(W, H)), sheenM); sh.position.set(xk, cy, 0.004); sh.renderOrder = 3; root.add(sh); }
      if (backM) {   // the far street: the same picture, mirrored like the card, scaled about the panes' centre
        // cropped (in the world) to the card's own width and to the floor and the card's top, so it never shows round the wall
        const bxk = flip ? -pcx : pcx, s = 1 + back / 8, px0 = -W / 2 - bxk, py0 = cy - H / 2 - pcy;
        const lx0 = Math.max(px0, (-W / 2 - bxk) / s), lx1 = Math.min(px0 + W, (W / 2 - bxk) / s), ly0 = Math.max(py0, -pcy / s), ly1 = Math.min(py0 + H, (cy + H / 2 - pcy) / s);
        const geo = new THREE.PlaneGeometry(lx1 - lx0, ly1 - ly0).translate((lx0 + lx1) / 2, (ly0 + ly1) / 2, 0), pa = geo.attributes.position, ua = geo.attributes.uv;
        for (let i = 0; i < ua.count; i++) { const u = (pa.getX(i) - px0) / W; ua.setXY(i, flip ? 1 - u : u, (pa.getY(i) - py0) / H); }
        const far = new THREE.Mesh(geo, backM); far.scale.setScalar(s); far.position.set(xk + bxk, pcy, -back - 0.004 * k); root.add(far);
      }
    }
    see(root);
  });
  (globalThis.__loads ||= []).push(load);
  return { grip: 0, apply() {} };
};

// ------------------------------------------------------------------------------------------------ the money wave
// unit face curve (u back from the toe, y up), the heading turning from nearly flat to over 200 degrees as its curvature
// grows: a surf wave's concave face that stands up and curls over into a lip. Integrated once.
const DEG = Math.PI / 180, CURVE_N = 40;
const UNIT = (() => {
  const pts = [[0, 0, 0]]; let x = 0, y = 0;
  for (let i = 1; i <= CURVE_N; i++) {
    const s = (i - 0.5) / CURVE_N, phi = Math.PI - (10 + 225 * Math.pow(s, 2.0)) * DEG;
    x += Math.cos(phi) / CURVE_N; y += Math.sin(phi) / CURVE_N; pts.push([x, y, phi]);
  }
  return pts;
})();
const chaikin = (pts, rounds) => {   // corner cutting that keeps both ends
  for (let r = 0; r < rounds; r++) {
    const out = [pts[0]];
    for (let i = 0; i < pts.length - 1; i++) { const [a, b] = [pts[i], pts[i + 1]]; out.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]); }
    out.push(pts[pts.length - 1]); pts = out;
  }
  return pts;
};
// the wave's side profile as a polygon in the crest frame (u forward, 0 at the lip's tip; y up): tail foot, toe, the face up
// into the curl, the lip's tip, the thin crescent's outer edge, the back slope to the flood's top, the flood's top to the tail.
// Hc crest top, Hf flood top, uL the tail's end (negative). Returns { poly, nFree (the free surface runs over vertices
// 1 to nFree, the last being the tail's top), face (the face up to the lip's tip), free (the surface behind the lip) }.
export function waveProfile(Hc, Hf, uL) {
  const tau = 0.17 * Hc, maxy = Math.max(...UNIT.map((p) => p[1])), k = (Hc - tau) / maxy;
  const face = UNIT.map(([x, y, phi]) => [x * k, y * k, phi]);
  const tip = face[CURVE_N], sb = 0.88, ib = Math.round(sb * CURVE_N), outer = [];
  for (let i = CURVE_N; i >= ib; i--) {
    const [x, y, phi] = face[i], th = tau * Math.pow(Math.min(1, (1 - i / CURVE_N) / (1 - sb)), 0.6);
    outer.push([x - Math.sin(phi) * th, y + Math.cos(phi) * th]);
  }
  const ob = outer[outer.length - 1], Lb = 0.8 * Hc, back = [];
  for (let j = 1; j <= 8; j++) { const t = j / 8, s = t * t * (3 - 2 * t); back.push([ob[0] - Lb * t, ob[1] + (Math.min(Hf, ob[1] - 0.05) - ob[1]) * s]); }
  const path = chaikin([...outer, ...back], 2), free = path.map(([x, y]) => [x - tip[0], y]);
  const uEnd = free[free.length - 1][0];
  const poly = [[Math.min(uL, uEnd - 0.4), 0], ...face.map(([x, y]) => [x - tip[0], y]), ...free, [Math.min(uL, uEnd - 0.4), free[free.length - 1][1]]];
  const nFree = poly.length - 1, uTail = poly[0][0];
  return { poly, nFree, face: face.map(([x, y]) => [x - tip[0], y]), free, tipU: 0, toeU: -tip[0], uTail, Lb };
}
const triIndex = (pts) => THREE.ShapeUtils.triangulateShape(pts.map(([x, y]) => new THREE.Vector2(x, y)), []).flat();

// signed distance to the free surface (positive inside): inside test on the whole polygon, distance on the free edges
function surfaceDist(poly, nFree, x, y) {
  const n = poly.length; let inside = false, dmin = 1e9;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  for (let i = 1; i < nFree; i++) {
    const xi = poly[i][0], yi = poly[i][1], dx = poly[i + 1][0] - xi, dy = poly[i + 1][1] - yi;
    let t = ((x - xi) * dx + (y - yi) * dy) / (dx * dx + dy * dy || 1); t = t < 0 ? 0 : t > 1 ? 1 : t;
    const ex = xi + t * dx - x, ey = yi + t * dy - y, d2 = ex * ex + ey * ey; if (d2 < dmin) dmin = d2;
  }
  return inside ? Math.sqrt(dmin) : -Math.sqrt(dmin);
}

const inPoly = (poly, x, y) => { let inside = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside; } return inside; };
// a palm for the wave to bend over: a trunk of short segments that bend more and more, a crown of drooping fronds
function makePalm(parent, H) {
  const trunkM = basicMat({ color: "#9a7448" }), ringM = basicMat({ color: "#7a5a38" }), frondM = [basicMat({ color: "#3f9e44", side: THREE.DoubleSide }), basicMat({ color: "#66bb4e", side: THREE.DoubleSide })];
  const root = new THREE.Group(); parent.add(root);
  const SEG = 6, segs = []; let at = root;
  for (let i = 0; i < SEG; i++) {
    const g = new THREE.Group(); g.position.y = i ? H / SEG : 0; at.add(g);
    const r0 = 0.15 - i * 0.012, m = new THREE.Mesh(new THREE.CylinderGeometry(r0 - 0.012, r0, H / SEG + 0.01, 8), i % 2 ? ringM : trunkM); m.position.y = H / SEG / 2; g.add(m);
    segs.push(g); at = g;
  }
  const crown = new THREE.Group(); crown.position.y = H / SEG; at.add(crown);
  const blade = (() => {   // one frond: a strip that droops, widest a third of the way out
    const N = 7, pos = [], idx = [];
    for (let i = 0; i <= N; i++) { const t = i / N, wd = 0.3 * Math.sin(Math.PI * Math.pow(t, 0.7)) * (1 - 0.3 * t) + 0.01, x = t * 1.25, y = -0.5 * t * t; pos.push(x, y, -wd, x, y, wd); }
    for (let i = 0; i < N; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); return g;
  })();
  const fronds = [];
  for (let i = 0; i < 9; i++) {
    const f = new THREE.Mesh(blade, frondM[i % 2]); const a = (i / 9) * Math.PI * 2; f.rotation.set(0, a, 0); f.userData.a = a; f.userData.k = 0.25 + rnd(i) * 0.3;
    const pivot = new THREE.Group(); pivot.add(f); pivot.rotation.z = 0; crown.add(pivot); fronds.push([pivot, f]);
  }
  return { root, segs, fronds, H };
}
// a small rounded hatchback in red, 1.9 long, facing +x (origin: the middle of its floor), unlit with a few flat tones
function makeCar(parent) {
  const g = new THREE.Group(); parent.add(g);
  const red = basicMat({ color: "#d8453a" }), dark = basicMat({ color: "#a8322b" }), glassM = basicMat({ color: "#cfeaf6" }), tyre = basicMat({ color: "#2a2b33" }), hub = basicMat({ color: "#d9dde3" });
  const body = new THREE.Shape();
  body.moveTo(-0.95, 0.2); body.lineTo(-0.95, 0.5); body.quadraticCurveTo(-0.95, 0.63, -0.8, 0.68); body.lineTo(-0.62, 0.84); body.quadraticCurveTo(-0.55, 0.9, -0.4, 0.9);
  body.lineTo(0.0, 0.9); body.quadraticCurveTo(0.14, 0.9, 0.24, 0.8); body.lineTo(0.5, 0.64); body.lineTo(0.88, 0.58); body.quadraticCurveTo(0.97, 0.54, 0.96, 0.4); body.lineTo(0.95, 0.2); body.closePath();
  const bx = (sh, m, depth, bevel) => { const geo = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2 }); geo.translate(0, 0, -depth / 2); return new THREE.Mesh(geo, m); };
  g.add(bx(body, red, 0.7, 0.05));
  const sk = new THREE.Shape(); sk.moveTo(-0.95, 0.2); sk.lineTo(0.95, 0.2); sk.lineTo(0.95, 0.36); sk.lineTo(-0.95, 0.36); sk.closePath();
  const skirt = bx(sk, dark, 0.8, 0.0); g.add(skirt);
  const win = new THREE.Shape(); win.moveTo(-0.58, 0.7); win.lineTo(-0.45, 0.84); win.lineTo(-0.02, 0.84); win.lineTo(0.2, 0.7); win.closePath();
  g.add(bx(win, glassM, 0.8, 0));
  for (const x of [-0.58, 0.58]) for (const z of [-0.37, 0.37]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.14, 14), tyre); w.rotation.x = Math.PI / 2; w.position.set(x, 0.2, z); g.add(w);
    const h = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.16, 10), hub); h.rotation.x = Math.PI / 2; h.position.set(x, 0.2, z); g.add(h);
  }
  return g;
}

FLOOD_KINDS.moneywave = (P) => {
  const S = P.spec, LEN = S.len ?? 16, HH = S.h ?? 2.7, D = S.d ?? 2.5, NB = S.notes ?? 4200, NR = Math.round(LEN * 10), NF = 170, YMAX = 3.4;
  const palmAt = S.palm === null ? null : S.palm ?? [1.8, 0.2];
  const root = P.whole, NW = 0.3, NH = 0.19;   // a note on the wave: 0.3 x 0.19 m (bigger than life, so it reads from the street)
  // the dark body: the profile's cap on the room side, the strips of its surface back to z -d/2, and the barrel's far wall
  const bodyBand = bandTexture("#3f6f47", "#5e9457", 6), darkBand = bandTexture("#2b573c", "#3f7a4a", 5);
  const MAXV = 140, mkGeo = (maxV, maxI) => { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(maxV * 3), 3)); g.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(maxV * 2), 2)); g.setIndex(new THREE.BufferAttribute(new Uint32Array(maxI), 1)); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e4); return g; };
  const capGeo = mkGeo(MAXV, MAXV * 3), stripGeo = mkGeo(MAXV * 2, MAXV * 6), hollowGeo = mkGeo(MAXV, MAXV * 3);
  const mk = (geo, tex) => { const m = new THREE.Mesh(geo, basicMat({ map: tex, side: THREE.DoubleSide })); m.frustumCulled = false; root.add(m); return m; };
  const parts = [mk(capGeo, bodyBand), mk(stripGeo, darkBand), mk(hollowGeo, darkBand)];
  const setPoly = (geo, pts, z, tri) => {   // a flat polygon at depth z
    const p = geo.attributes.position, u = geo.attributes.uv; pts.forEach(([x, y], i) => { p.setXYZ(i, x, y, z); u.setXY(i, 0.5, clamp(y / YMAX)); });
    geo.index.array.set(tri); geo.setDrawRange(0, tri.length); p.needsUpdate = u.needsUpdate = geo.index.needsUpdate = true;
  };
  const setStrips = (geo, pts, n, z0, z1) => {   // the free surface extruded from z0 to z1 (n points)
    const p = geo.attributes.position, u = geo.attributes.uv, idx = geo.index.array; let ti = 0;
    for (let i = 0; i < n; i++) { const [x, y] = pts[i]; p.setXYZ(i * 2, x, y, z0); p.setXYZ(i * 2 + 1, x, y, z1); u.setXY(i * 2, 0.5, clamp(y / YMAX)); u.setXY(i * 2 + 1, 0.5, clamp(y / YMAX)); }
    for (let i = 0; i < n - 1; i++) { const a = i * 2; idx[ti++] = a; idx[ti++] = a + 1; idx[ti++] = a + 2; idx[ti++] = a + 1; idx[ti++] = a + 3; idx[ti++] = a + 2; }
    geo.setDrawRange(0, ti); p.needsUpdate = u.needsUpdate = geo.index.needsUpdate = true;
  };
  // the notes: banknotes over the face (instanced), a foam rim of pale notes along the free surface, spray in the air
  const noteTex = noteTexture(), foamTex = foamTexture();
  const body = noteMesh(root, noteTex, NB, 1), rim = noteMesh(root, foamTex, NR, 2), spray = noteMesh(root, foamTex, NF, 3);
  const car = S.car === 0 ? null : makeCar(root), palm = palmAt && makePalm(root, 2.7);
  see(root);
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(0, 0, 0, "XYZ"), V = new THREE.Vector3(), SC = new THREE.Vector3(), C = new THREE.Color();
  const put = (im, i, x, y, z, rx, ry, rz, w, h) => { E.set(rx, ry, rz); Q.setFromEuler(E); V.set(x, y, z); SC.set(w, h, 1); M.compose(V, Q, SC); im.setMatrixAt(i, M); };
  const BOX_L = -LEN - 3, BOX_R = 2.2;   // notes are scattered over this span of the crest frame (the lip's tip at 0)
  const nSeed = Array.from({ length: NB }, (_, i) => ({ a: R2a(i), b: R2b(i), ph: rnd(i + 5) * 6.283, w: (rnd(i + 9) - 0.5) * 5, z: rnd(i + 13), f: rnd(i + 21) }));
  return {
    grip: 0,
    apply(ps, t) {
      const front = clamp(par(ps, S, "front", 0)), level = clamp(ps.level ?? S.level ?? 1), clk = par(ps, S, "clock", 0);
      root.visible = front > 0.002 && level > 0.002; if (!root.visible) return;
      const xTip = -LEN / 2 + front * LEN, Hc = HH * (0.5 + 0.5 * level), Hf = Math.min(0.85 * HH * level, Hc * 0.97);
      const prof = waveProfile(Hc, Hf, (-LEN / 2 - 1) - xTip), { poly, nFree, face, free } = prof, zc = D / 2;
      // the body: cap (triangulated), strips along the free surface, the barrel's far wall (the face and the lip closed by a chord)
      setPoly(capGeo, poly, zc, triIndex(poly));
      setStrips(stripGeo, poly.slice(1, nFree + 1), nFree, zc, -zc);
      const hollow = face.slice(); setPoly(hollowGeo, hollow, -zc + 0.05, triIndex(hollow));
      for (const o of parts) o.position.x = xTip;   // the polygons are in the crest frame
      // banknotes over the face
      for (let i = 0; i < NB; i++) {
        const s = nSeed[i], u = BOX_R + s.a * (BOX_L - BOX_R), y = s.b * (Hc + 0.35), d = surfaceDist(poly, nFree, u, y);
        if (d < 0 && inPoly(face, u, y)) {   // in the barrel: notes on its far wall, in shadow
          const kk = sm(0.1, 0.25, -d), ang = s.ph + s.w * clk * 0.6;
          if (kk <= 0) { body.setMatrixAt(i, ZERO); continue; }
          C.setRGB(0.3, 0.62, 0.3); body.setColorAt(i, C);
          put(body, i, xTip + u, y, -zc + 0.1 + s.z * 0.1, 0.3 * Math.sin(1.7 * clk + s.ph * 3), 0.3 * Math.sin(1.3 * clk + s.ph * 5), ang, NW * kk, NH * kk); continue;
        }
        const k = sm(0.05, 0.17, d);
        if (k <= 0) { body.setMatrixAt(i, ZERO); continue; }
        const tint = (d < 0.42 ? 1 : d < 0.95 ? 0.78 : 0.58) * (y < Hc * 0.22 ? 0.82 : 1);
        C.setRGB(0.62 * tint, 1.32 * tint, 0.58 * tint); body.setColorAt(i, C);
        const ang = s.ph + s.w * clk;
        put(body, i, xTip + u + 0.03 * Math.sin(1.9 * clk + s.ph), y + 0.03 * Math.sin(2.3 * clk + s.ph * 2), zc + 0.03 + s.z * 0.1, 0.45 * Math.sin(1.7 * clk + s.ph * 3), 0.45 * Math.sin(1.3 * clk + s.ph * 5), ang, NW * k, NH * k);
      }
      body.instanceMatrix.needsUpdate = true; body.instanceColor.needsUpdate = true;
      // the foam rim: pale notes along the free surface (arc length from the toe: a fixed share of the longest rim)
      const cum = [0]; for (let i = 1; i < nFree; i++) cum.push(cum[i - 1] + Math.hypot(poly[i + 1][0] - poly[i][0], poly[i + 1][1] - poly[i][1]));
      const total = cum[cum.length - 1], MAXP = LEN + 14;
      for (let i = 0; i < NR; i++) {
        const sArc = R2a(i) * MAXP;
        if (sArc >= total) { rim.setMatrixAt(i, ZERO); continue; }
        let j = 1; while (j < nFree - 1 && cum[j] < sArc) j++;
        const a = poly[j], b = poly[j + 1], len = cum[j] - cum[j - 1] || 1, t0 = clamp((sArc - cum[j - 1]) / len), tx = (b[0] - a[0]) / len, ty = (b[1] - a[1]) / len;
        const x = a[0] + (b[0] - a[0]) * t0 - ty * 0.07, y = a[1] + (b[1] - a[1]) * t0 + tx * 0.07;   // a little inside the surface (the left normal)
        const ph = rnd(i + 31) * 6.283, w = (rnd(i + 37) - 0.5) * 4;
        C.setRGB(0.92, 1.12, 0.78); rim.setColorAt(i, C);
        put(rim, i, xTip + x, Math.max(y, 0.06), zc + 0.12 + rnd(i + 41) * 0.05, 0.3 * Math.sin(1.5 * clk + ph), 0.3 * Math.sin(1.1 * clk + ph * 2), ph + w * clk, 0.2, 0.125);
      }
      rim.instanceMatrix.needsUpdate = true; rim.instanceColor.needsUpdate = true;
      // the spray: single pale notes leaving the lip and the face, a cartoon arc forward and down, looping on the clock
      for (let i = 0; i < NF; i++) {
        const T = 1.0 + rnd(i + 51) * 0.7, c = clk / T + rnd(i + 53), tau = (c - Math.floor(c)) * T, grow = sm(0, 0.1 * T, tau) * sm(T, T * 0.8, tau);
        const sp = face[Math.min(CURVE_N, 22 + Math.floor(rnd(i + 57) * 19))], vx = 0.8 + rnd(i + 59) * 3.2, vy = 1.0 + rnd(i + 61) * 2.6, ph = rnd(i + 63) * 6.283;
        const x = sp[0] + vx * tau + (rnd(i + 65) < 0.3 ? 1.0 : 0) * 0, y = Math.max(0.04, sp[1] + vy * tau - 3.4 * tau * tau);
        C.setRGB(0.95, 1.1, 0.82); spray.setColorAt(i, C);
        put(spray, i, xTip + x, y, zc + (rnd(i + 67) - 0.35) * 0.9, 2.2 * tau + ph, 1.7 * tau, 5 * tau + ph, 0.19 * grow, 0.12 * grow);
      }
      spray.instanceMatrix.needsUpdate = true; spray.instanceColor.needsUpdate = true;
      // the car: just behind the crest on the back slope, nose up 12 degrees on top of the slope, bobbing
      if (car) {
        const sl = free, uC = prof.free[Math.min(sl.length - 1, Math.floor(sl.length * 0.45))][0] - 0.4;
        let j = 0; while (j < sl.length - 2 && sl[j + 1][0] > uC) j++;
        const a = sl[j], b = sl[j + 1], tt = clamp((a[0] - uC) / ((a[0] - b[0]) || 1)), yC = a[1] + (b[1] - a[1]) * tt, ang = Math.atan2(b[1] - a[1], a[0] - b[0]);
        car.position.set(xTip + uC, yC - 0.3 + 0.07 * Math.sin(clk * 4.1), zc - 0.45);
        car.rotation.set(0, 0, ang * 0.9 + 12 * DEG + 0.04 * Math.sin(clk * 3.3 + 1));
      }
      if (palm) {   // upright until the toe is two metres off, then bent over forward, flat by the time the crest is on it
        const dx = palmAt[0] - xTip, bend = sm(2.6, -0.3, dx);
        palm.root.position.set(palmAt[0], 0, palmAt[1]);
        palm.segs.forEach((s, i) => { s.rotation.z = -(bend * 1.25 / palm.segs.length) * (0.4 + 0.6 * i / palm.segs.length) * 1.6 + 0.01 * Math.sin(clk * 1.3 + i); });
        palm.fronds.forEach(([pivot, f], i) => { pivot.rotation.z = -0.5 * bend + 0.12 * Math.sin(clk * 2.1 + f.userData.a * 2); f.rotation.z = -(0.15 + f.userData.k) * (1 - bend * 0.5) + 0.08 * Math.sin(clk * 2.7 + i); });
        palm.root.visible = palmAt[0] - xTip > -3;
      }
    },
  };
};

// ------------------------------------------------------------------------------------------------ the note flood on the floor
FLOOD_KINDS.noteflood = (P) => {
  const S = P.spec, W = S.w ?? 3.6, DD = S.d ?? 2.2, N = S.n ?? 900, NS = 40, NX = 40, NZ = 16;
  const root = P.whole, Y0 = 0.004;
  // the fan's edge along x for a grow g: reaches g x d in the middle, about a third of that at the sides, breathing on the clock
  const edge = (x, g, clk) => g * DD * (0.34 + 0.66 * Math.pow(Math.max(0, 1 - (2 * x / W) ** 2), 0.7)) * (1 + 0.06 * Math.sin(clk * 1.7 + x * 3.1) + 0.04 * Math.sin(clk * 2.9 - x * 5.3));
  // the depth of the pile: 8 cm at the wall to 3 cm near the edge, rolling off to nothing at the very edge
  const depth = (z, e, g) => (e <= 0.02 || z >= e ? 0 : (0.03 + 0.05 * (1 - z / e)) * (0.35 + 0.65 * g) * sm(0, 0.12, e - z));
  // the mound under the notes: a grid of heights (dark green, lighter where it is deeper)
  const pos = new Float32Array((NX + 1) * (NZ + 1) * 3), col = new Float32Array((NX + 1) * (NZ + 1) * 3), idx = [];
  for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NX; i++) {
    if (i < NX && j < NZ) { const a = j * (NX + 1) + i, b = a + 1, c = a + NX + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("color", new THREE.BufferAttribute(col, 3)); geo.setIndex(idx); geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, DD / 2), 10);
  const mound = new THREE.Mesh(geo, basicMat({ vertexColors: true, side: THREE.DoubleSide })); mound.frustumCulled = false; root.add(mound);
  const notes = noteMesh(root, noteTexture(), N, 1), slide = noteMesh(root, noteTexture(), NS, 2);
  see(root);
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(0, 0, 0, "YXZ"), V = new THREE.Vector3(), SC = new THREE.Vector3(), C = new THREE.Color();
  const put = (im, i, x, y, z, rx, yaw, w, h) => { E.set(-Math.PI / 2 + rx[0], yaw, rx[1]); Q.setFromEuler(E); V.set(x, y, z); SC.set(w, h, 1); M.compose(V, Q, SC); im.setMatrixAt(i, M); };
  const dark = new THREE.Color("#3f7a47"), light = new THREE.Color("#6fae5c");
  return {
    grip: 0,
    apply(ps) {
      const g = clamp(par(ps, S, "grow", 0)), clk = par(ps, S, "clock", 0);
      root.visible = g > 0.01; if (!root.visible) return;
      for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NX; i++) {
        const x = (i / NX - 0.5) * W, e = edge(x, g, clk), z = Math.min(j / NZ * 1.0, 1) * Math.max(e, 0.001), h = depth(z, e, g), k = (j * (NX + 1) + i) * 3;
        pos[k] = x; pos[k + 1] = Y0 + h; pos[k + 2] = z;
        C.copy(dark).lerp(light, clamp(h / 0.08)); col[k] = C.r; col[k + 1] = C.g; col[k + 2] = C.b;
      }
      geo.attributes.position.needsUpdate = geo.attributes.color.needsUpdate = true;
      for (let i = 0; i < N; i++) {
        const x = (R2a(i) - 0.5) * W, e = edge(x, g, clk), z = R2b(i) * DD, k = sm(0, 0.14, e - z - 0.03);
        if (k <= 0) { notes.setMatrixAt(i, ZERO); continue; }
        const h = depth(z, e, g), shade = 0.8 + 0.2 * rnd(i + 3);
        C.setRGB(0.8 * shade, 1.1 * shade, 0.75 * shade); notes.setColorAt(i, C);
        put(notes, i, x, Y0 + h + 0.003 + 0.002 * rnd(i + 7), z, [(rnd(i + 11) - 0.5) * 0.3, (rnd(i + 13) - 0.5) * 0.3], rnd(i + 17) * 6.283, 0.17 * k, 0.085 * k);
      }
      notes.instanceMatrix.needsUpdate = true; notes.instanceColor.needsUpdate = true;
      for (let i = 0; i < NS; i++) {   // single notes sliding ahead of the edge
        const x = (R2a(i + 100) - 0.5) * W * 0.9, e = edge(x, g, clk), c = clk * 0.35 + rnd(i + 71), gap = (c - Math.floor(c)) * 0.55, k = sm(0, 0.08, gap) * sm(0.55, 0.38, gap) * sm(0.01, 0.1, g);
        if (k <= 0 || e < 0.05) { slide.setMatrixAt(i, ZERO); continue; }
        put(slide, i, x + 0.15 * Math.sin(clk * 1.1 + i), Y0 + 0.003, e + 0.02 + gap, [0, 0], rnd(i + 73) * 6.283 + clk * (rnd(i + 75) - 0.5) * 2, 0.17 * k, 0.085 * k);
      }
      slide.instanceMatrix.needsUpdate = true;
    },
  };
};

// ------------------------------------------------------------------------------------------------ paper (and snow) falling on a spot
FLOOD_KINDS.noterain = (P) => {
  const S = P.spec, look = S.look ?? "iou", snow = look === "snow", top = S.top ?? 3.2;
  const N = Math.min(400, Math.round(S.n ?? (snow ? 200 : 60))), R = Math.min(6, S.r ?? (snow ? 3 : 0.9)), span = S.span ?? 1.0, FALL = 1.1;
  const root = P.whole;
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(0, 0, 0, "YXZ"), V = new THREE.Vector3(), SC = new THREE.Vector3();
  // where each lands (a low-discrepancy spread over the disc, so any share of the first cards is even) and how high it
  // lies there on the cards that landed before it
  const land = Array.from({ length: N }, (_, i) => { const r = R * Math.sqrt(R2a(i)), a = R2b(i) * 6.283 + rnd(i) * 0.4; return [r * Math.cos(a), r * Math.sin(a)]; });
  const lay = land.map(([x, z], i) => { let c = 0; if (!snow) for (let j = 0; j < i; j++) if (Math.hypot(x - land[j][0], z - land[j][1]) < 0.09) c++; return 0.004 + 0.0012 * Math.min(c, 9); });
  if (snow) {
    const m = basicMat({ color: "#ffffff" }), im = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 6, 4), m, N);
    im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); im.frustumCulled = false; root.add(im); see(root);
    const T = 3.0, rad = (i) => 0.012 + 0.018 * rnd(i + 5);
    return {
      grip: 0,
      apply(ps) {
        const amount = clamp(par(ps, S, "amount", 1)), clk = par(ps, S, "clock", 0);
        for (let i = 0; i < N; i++) {
          const r = (i + 0.5) / N, k0 = sm(r - 0.001, r + 0.05, amount), c = clk / T + rnd(i + 3), p = c - Math.floor(c), k = k0 * sm(0, 0.05, p) * sm(1, 0.93, p);
          if (k <= 0) { im.setMatrixAt(i, ZERO); continue; }
          const ph = rnd(i + 9) * 6.283;
          V.set(land[i][0] + 0.22 * Math.sin(p * 9 + ph) + 0.1 * p, top * (1 - p), land[i][1] + 0.18 * Math.cos(p * 7 + ph * 2));
          Q.identity(); SC.setScalar(rad(i) * k); M.compose(V, Q, SC); im.setMatrixAt(i, M);
        }
        im.instanceMatrix.needsUpdate = true;
      },
    };
  }
  const iou = look === "iou", w = iou ? 0.14 : 0.2, h = iou ? 0.1 : 0.1;
  const im = noteMesh(root, iou ? iouTexture() : noteTexture(), N, 1); see(root);
  return {
    grip: 0,
    apply(ps) {
      const amount = clamp(par(ps, S, "amount", 1)), clk = par(ps, S, "clock", 0);
      for (let i = 0; i < N; i++) {
        const r = (i + 0.5) / N, p = (clk - r * span) / FALL, k = sm(r - 0.001, r + 0.05, amount);
        if (k <= 0 || p <= 0) { im.setMatrixAt(i, ZERO); continue; }
        const q = clamp(p), ph = rnd(i + 5) * 6.283, f = 0.8 + rnd(i + 7) * 1.4, flat = sm(0.78, 1, q), loose = 1 - flat, yaw = rnd(i + 11) * 6.283;
        const e = q * (0.7 + 0.3 * q), sway = Math.pow(1 - q, 0.6);
        const x = land[i][0] + 0.28 * sway * Math.sin(6.283 * f * q + ph) * (1 - 0.3 * q), z = land[i][1] + 0.22 * sway * Math.cos(6.283 * f * q + ph * 2);
        const y = lay[i] + (top - lay[i]) * (1 - e);
        E.set(-Math.PI / 2 + loose * 1.1 * Math.sin(6.283 * f * q * 1.3 + ph), yaw + loose * 5 * q * (rnd(i + 13) - 0.5) * 2, loose * 0.9 * Math.sin(6.283 * f * q + ph * 3));
        Q.setFromEuler(E); V.set(x, y, z); SC.set(w * k, h * k, 1); M.compose(V, Q, SC); im.setMatrixAt(i, M);
      }
      im.instanceMatrix.needsUpdate = true;
    },
  };
};
