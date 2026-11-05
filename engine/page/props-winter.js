import * as THREE from "three";
import { clamp } from "./util.js";

// Props for "The $20 Potato" (New York clip, 4 Nov 2026; Jonny's board storyboard-eight-panels.png) at a holiday market
// like Bryant Park Winter Village. Studied from the real thing before building: the market's huts are small timber
// kiosks with a glazed or open front, a counter at elbow height, a sloped roof whose eaves carry a strip of warm
// string lights, and a fabric awning in bold stripes over the serving hatch; the menu is a painted board hung on the
// front. Fresh snow lies only where it can settle (the awning's top and the board's upper edge), thickest in the middle
// of a slope, thin at the edges, and never on vertical faces. A takeaway clamshell is one moulded piece: a tray with
// a flat lip and a lid joined by a fold along the back edge, so the lid swings up on that fold and never leaves it.
// A banknote is a thin, slightly curled paper rectangle; a coffee-to-go cup has a brown card sleeve and a white snap lid.
//   marketstall  the potato stall: spec.w (front width), spec.h (eave height), spec.d (depth). Origin: the floor at the
//                middle of its front edge; it faces +z. Timber back and side walls with a warm lit inside and shelves,
//                two front posts, a red and green striped awning with a scalloped valance and snow on top, string lights
//                along the awning's edge, and the menu board (spec.sign: { x, y, w, h } on the front, its lines in
//                spec.lines, the biggest last). `lights` 0..1 dims the bulbs.
//   woodcounter  a wooden market counter: spec.w (x), spec.h (top height), spec.d (z). Origin: the floor under the
//                middle of its front... no: under its middle. A thick top with a rounded nosing, a front of vertical
//                boards, and spec.garland: a pine garland with red berries along the top's front edge.
//   clambox      a white takeaway clamshell (spec.w, spec.d, spec.h tray depth, spec.lidH). Origin: the middle of its
//                bottom. The lid is hinged on one edge (spec.hinge "back" -z, the default, or "left" -x / "right" +x):
//                `open` 0 closed .. 1 swung up and over the hinge (spec.openDeg, 112 deg).
//                `steam` 0..1 wisps rising (from the seam when closed, from the tray when open); `cheese` 0..1 fills
//                the tray with melted cheese sauce (a bubbling pool with chives). The tray walls are thin skins.
//   bill20       a twenty: a green banknote lying flat on its origin, "20" in its corners and a big 20 in the middle
//                (spec.w, spec.d). Paper-thin, see-through for the checks (it lies under a palm).
//   cocoacup     a paper cup of hot chocolate with a card sleeve and a white lid (held with the mug hold; grips.mjs
//                SIZE cocoacup). Origin: the middle of its bottom. `steam` 0..1 a thin wisp from the lid's sip hole.
//   cocoaspill   a thin trickle of hot chocolate from a tipped cup's lip to the floor, and the small puddle it makes.
//                Origin: the floor under the lip; spec.lip the lip's height. `pour` 0..1 the stream runs (from the lip
//                down), `pool` 0..1 the puddle spreads. Flat and see-through for the checks.
//   loadedtop    what makes a baked potato "loaded", worn on a potato (spec.wear) at the top of its head: the split
//                along the top with fluffy potato showing, a dollop of sour cream sitting on it like a tiny hat,
//                melted cheese running down from the split, and chives. Origin: the top middle of the split.
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
const steamy = (o, order = 3) => { o.frustumCulled = false; o.renderOrder = order; o.castShadow = false; o.userData.steam = true; return o; };
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
function canvasTex(w, h, draw, rep) {
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h; draw(cv.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); }
  return t;
}
// timber boards: vertical planks of slightly different browns with dark joints and a little grain (1 m of wall)
const boardsTex = (rep, base = [124, 82, 50], vertical = true, seed = 1) => canvasTex(256, 256, (g, W, H) => {
  const n = 7, bw = W / n;
  for (let i = 0; i < n; i++) {
    const k = rnd(seed * 13 + i) - 0.5, [r, gg, b] = base.map((v) => Math.round(v * (1 + 0.14 * k)));
    g.fillStyle = `rgb(${r},${gg},${b})`;
    if (vertical) g.fillRect(i * bw, 0, bw, H); else g.fillRect(0, i * bw, W, bw);
    g.fillStyle = "rgba(60,36,20,0.18)";
    for (let j = 0; j < 5; j++) { const p = rnd(seed + i * 7 + j) * bw; if (vertical) g.fillRect(i * bw + p, 0, 1.4, H); else g.fillRect(0, i * bw + p, W, 1.4); }
    g.fillStyle = "rgba(40,22,12,0.75)"; if (vertical) g.fillRect(i * bw, 0, 2.5, H); else g.fillRect(0, i * bw, W, 2.5);
  }
}, rep);
// the awning's stripes: deep red and pine green with a thin cream edge between, as on the board
const stripeTex = (n) => canvasTex(512, 64, (g, W, H) => {
  const sw = W / n;
  for (let i = 0; i < n; i++) { g.fillStyle = i % 2 ? "#2f6b3c" : "#c22a2a"; g.fillRect(i * sw, 0, sw, H); g.fillStyle = "rgba(255,240,220,0.5)"; g.fillRect(i * sw, 0, 2, H); }
});
// a warm bulb: a bright cel-shaded core and a soft halo (sprites, so they read at any angle)
const bulbTex = () => canvasTex(64, 64, (g) => { const gr = g.createRadialGradient(32, 32, 1, 32, 32, 32); gr.addColorStop(0, "rgba(255,250,225,1)"); gr.addColorStop(0.18, "rgba(255,226,150,1)"); gr.addColorStop(0.32, "rgba(255,190,90,0.55)"); gr.addColorStop(1, "rgba(255,160,60,0)"); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); });

// a soft rounded slab of snow over a w x d footprint: thickest in the middle, a rounded lip hanging a little over
function snowSlab(w, d, th, seed = 1) {
  const g = new THREE.BoxGeometry(w, th, d, 24, 1, 8), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) / (w / 2), z = p.getZ(i) / (d / 2), top = p.getY(i) > 0;
    const edge = Math.max(Math.abs(x), Math.abs(z)), round = 1 - Math.pow(edge, 6);
    if (top) p.setY(i, -th / 2 + th * (0.35 + 0.65 * round) * (0.9 + 0.2 * rnd(seed + Math.round(x * 9) * 3 + Math.round(z * 5))));
  }
  g.computeVertexNormals(); return g;
}

export const WINTER_KINDS = {
  marketstall(P) {
    const S = P.spec, W = S.w ?? 1.6, H = S.h ?? 2.0, D = S.d ?? 1.0, T = 0.05;
    const wood = mat("#ffffff", { map: boardsTex([W, H], [118, 76, 46], true, 3), roughness: 0.8 });
    const sideWood = mat("#ffffff", { map: boardsTex([D, H], [110, 70, 42], true, 5), roughness: 0.8 });
    const dark = mat("#4a2e1c", { roughness: 0.7 }), trim = mat("#5b3a22", { roughness: 0.6 });
    // back wall (its inside lit warm, as a lit hut reads at dusk) and the two side walls
    mesh(new THREE.BoxGeometry(W, H + 0.25, T), wood, P.whole, 0, (H + 0.25) / 2, -D);
    const glow = new THREE.MeshBasicMaterial({ color: "#f3c987" }); glow.userData.noOutline = true;
    const inner = mesh(new THREE.PlaneGeometry(W - 0.12, H - 0.2), new THREE.MeshStandardMaterial({ color: "#c7894e", emissive: new THREE.Color("#b8692c"), emissiveIntensity: 0.55, map: boardsTex([W, H], [176, 120, 70], true, 7), roughness: 0.9 }), P.whole, 0, H / 2 + 0.05, -D + T / 2 + 0.002);
    inner.castShadow = false;
    for (const s of [-1, 1]) mesh(new THREE.BoxGeometry(T, H + 0.15, D), sideWood, P.whole, s * (W / 2 - T / 2), (H + 0.15) / 2, -D / 2);
    // shelves on the back wall: sacks of potatoes and a few foil-wrapped ones, a stack of cheese wheels (clutter, warm)
    for (const [y, seed] of [[1.15, 1], [1.5, 2]]) {
      mesh(new THREE.BoxGeometry(W - 0.2, 0.03, 0.18), trim, P.whole, 0, y, -D + 0.12);
      for (let i = 0; i < 9; i++) {
        const x = -W / 2 + 0.2 + (i + 0.3 * rnd(seed * 9 + i)) * ((W - 0.4) / 9), k = rnd(seed * 31 + i);
        if (k < 0.55) { const sp = mesh(new THREE.SphereGeometry(0.045 + 0.015 * rnd(i + seed), 12, 10), mat(k < 0.3 ? "#c99752" : "#b9babd", { roughness: k < 0.3 ? 0.8 : 0.3, metalness: k < 0.3 ? 0 : 0.6 }), P.whole, x, y + 0.05, -D + 0.12); sp.scale.set(1.25, 0.85, 1); }
        else if (k < 0.8) mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.05, 16), mat("#f2c64b", { roughness: 0.5 }), P.whole, x, y + 0.04, -D + 0.12);
        else { const jar = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.09, 12), mat("#8fbf5a", { roughness: 0.3 }), P.whole, x, y + 0.06, -D + 0.12); jar.castShadow = false; }
      }
    }
    // front posts and the eave beam
    for (const s of [-1, 1]) mesh(new THREE.BoxGeometry(0.09, H, 0.09), trim, P.whole, s * (W / 2 - 0.045), H / 2, -0.05);
    mesh(new THREE.BoxGeometry(W + 0.1, 0.1, 0.1), trim, P.whole, 0, H + 0.02, -0.05);
    // the roof: a slab over the hut, sloping down to the front, with its snow
    const roofD = D + 0.25, roofA = 0.2;
    const roof = new THREE.Group(); roof.position.set(0, H + 0.22, -D / 2 + 0.05); roof.rotation.x = roofA; P.whole.add(roof);
    mesh(new THREE.BoxGeometry(W + 0.25, 0.06, roofD), dark, roof, 0, 0, 0);
    mesh(snowSlab(W + 0.2, roofD - 0.05, 0.09, 11), mat("#f4f7fb", { roughness: 0.95 }), roof, 0, 0.07, 0);
    // the awning: striped cloth sloping out and down from the eave, a scalloped valance hanging from its front edge
    const AW = W + 0.16, AD = S.awning ?? 0.5, aA = 0.42;
    const aw = new THREE.Group(); aw.position.set(0, H + 0.04, 0); aw.rotation.x = aA; P.whole.add(aw);
    const cloth = mat("#ffffff", { map: stripeTex(Math.round(AW / 0.16)), roughness: 0.85, side: THREE.DoubleSide });
    mesh(new THREE.BoxGeometry(AW, 0.012, AD), cloth, aw, 0, 0, AD / 2);
    mesh(snowSlab(AW - 0.06, AD - 0.06, 0.06, 17), mat("#f6f8fc", { roughness: 0.95 }), aw, 0, 0.035, AD / 2 - 0.01);
    // the valance: a row of rounded flaps in the same stripes, square to the ground
    const front = new THREE.Vector3(0, 0, AD).applyEuler(aw.rotation).add(aw.position);
    const nFlap = Math.round(AW / 0.16), fw = AW / nFlap;
    const flap = new THREE.Shape(); flap.moveTo(-fw / 2, 0); flap.lineTo(fw / 2, 0); flap.lineTo(fw / 2, -0.07); flap.absarc(0, -0.07, fw / 2, 0, Math.PI, true); flap.closePath();
    const flapGeo = new THREE.ShapeGeometry(flap, 8);
    for (let i = 0; i < nFlap; i++) mesh(flapGeo, mat(i % 2 ? "#2f6b3c" : "#c22a2a", { roughness: 0.85, side: THREE.DoubleSide }), P.whole, -AW / 2 + fw * (i + 0.5), front.y, front.z + 0.004);
    // string lights: a wire sagging between hooks along the valance, a warm bulb at each low point and between
    const bm = new THREE.SpriteMaterial({ map: bulbTex(), transparent: true, depthWrite: false, toneMapped: false }); bm.userData.noOutline = true;
    const bulbs = [], wirePts = [], n = Math.round(AW / 0.13);
    for (let i = 0; i <= n; i++) {
      const u = i / n, x = -AW / 2 + AW * u, sag = 0.05 * Math.sin(Math.PI * ((u * 6) % 1));
      wirePts.push(new THREE.Vector3(x, front.y - 0.16 - sag, front.z + 0.02));
      if (i % 1 === 0) { const b = steamy(new THREE.Sprite(bm), 5); b.position.set(x, front.y - 0.19 - sag, front.z + 0.03); b.scale.setScalar(0.085); P.whole.add(b); bulbs.push(b); }
      const core = mesh(new THREE.SphereGeometry(0.014, 10, 8), new THREE.MeshBasicMaterial({ color: "#fff1c4" }), P.whole, x, front.y - 0.19 - sag, front.z + 0.03); core.castShadow = false; core.material.userData.noOutline = true;
    }
    const wire = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(wirePts), n * 4, 0.003, 4, false), mat("#1d1a18")); wire.castShadow = false; P.whole.add(wire);
    // a warm light in the hut, so the stall glows against the blue dusk
    const lamp = new THREE.PointLight("#ffbf74", 1.4, 3.2, 1.6); lamp.position.set(0, H - 0.25, -0.35); lamp.castShadow = false; P.whole.add(lamp);
    // the menu board: cream boards in a dark frame, the lines in a bold serif, the price biggest, hung on two short chains
    const sg = S.sign || {}, sw = sg.w ?? 1.0, sh = sg.h ?? 0.62, sx = sg.x ?? 0, sy = sg.y ?? H - 0.45, lines = S.lines || ["LOADED", "BAKED POTATO", "$20"];
    const signT = canvasTex(1024, Math.round(1024 * (sh / sw)), (g, Wc, Hc) => {
      g.fillStyle = "#f3e6c8"; g.fillRect(0, 0, Wc, Hc);
      g.fillStyle = "rgba(150,110,60,0.10)"; for (let i = 0; i < 60; i++) g.fillRect(0, rnd(i) * Hc, Wc, 1.5);
      g.strokeStyle = "#3a2414"; g.lineWidth = 26; g.strokeRect(13, 13, Wc - 26, Hc - 26);
      g.strokeStyle = "#a5762f"; g.lineWidth = 5; g.strokeRect(38, 38, Wc - 76, Hc - 76);
      g.fillStyle = "#2a160a"; g.textAlign = "center"; g.textBaseline = "alphabetic";
      const sizes = lines.map((_, i) => (i === lines.length - 1 ? 1.75 : 1)), sum = sizes.reduce((a, b) => a + b, 0), room = Hc - 120;
      let y = 70;
      lines.forEach((ln, i) => {
        let fs = (room / sum) * sizes[i] * 0.9; const font = (f) => `900 ${f}px "DejaVu Serif", "FreeSerif", Georgia, serif`;
        g.font = font(fs); while (g.measureText(ln).width > Wc - 120 && fs > 20) { fs -= 2; g.font = font(fs); }
        y += (room / sum) * sizes[i]; g.fillText(ln, Wc / 2, y - (room / sum) * sizes[i] * 0.14);
      });
    });
    const board = new THREE.Group(); board.position.set(sx, sy, 0.08); P.whole.add(board);
    mesh(new THREE.BoxGeometry(sw + 0.04, sh + 0.04, 0.03), trim, board, 0, 0, -0.012);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(sw, sh), mat("#ffffff", { map: signT, roughness: 0.75, emissive: new THREE.Color("#3a2a14"), emissiveMap: signT, emissiveIntensity: 0.35 })); face.position.z = 0.004; face.receiveShadow = true; board.add(face);
    face.material.userData.noHatch = true;
    mesh(snowSlab(sw + 0.02, 0.05, 0.03, 23), mat("#f6f8fc", { roughness: 0.95 }), board, 0, sh / 2 + 0.035, -0.005);
    for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.16, 5), mat("#2b2622", { metalness: 0.5, roughness: 0.4 }), board, s * (sw / 2 - 0.08), sh / 2 + 0.1, -0.01);
    return {
      grip: 0,
      apply(ps) { const l = clamp(ps.lights ?? 1); bm.opacity = l; lamp.intensity = 1.4 * l; },
    };
  },

  woodcounter(P) {
    const S = P.spec, W = S.w ?? 2.0, H = S.h ?? 0.42, D = S.d ?? 0.5;
    const top = mat("#ffffff", { map: boardsTex([1, W], [168, 112, 66], false, 9), roughness: 0.55 });
    top.map.rotation = Math.PI / 2;
    const frontM = mat("#ffffff", { map: boardsTex([W / 1.1, H], [120, 76, 44], true, 4), roughness: 0.8 });
    mesh(new THREE.BoxGeometry(W, 0.05, D + 0.04), top, P.whole, 0, H - 0.025, 0);
    const nose = mesh(new THREE.CylinderGeometry(0.025, 0.025, W, 12), top, P.whole, 0, H - 0.025, D / 2 + 0.02); nose.rotation.z = Math.PI / 2;
    mesh(new THREE.BoxGeometry(W - 0.04, H - 0.05, D - 0.06), frontM, P.whole, 0, (H - 0.05) / 2, -0.02);
    mesh(new THREE.BoxGeometry(W - 0.02, 0.05, 0.03), mat("#4a2e1c"), P.whole, 0, 0.025, D / 2 - 0.04);   // kick board
    if (S.garland) {
      // pine garland swagged along the front under the top, red berries in small clusters (never evenly spaced)
      const g = new THREE.Group(); P.whole.add(g); const pine = mat("#2d5a34", { roughness: 0.9 }), pine2 = mat("#3b6e3e", { roughness: 0.9 }), berry = mat("#c8202a", { roughness: 0.4 });
      const nT = Math.round(W / 0.05);
      for (let i = 0; i <= nT; i++) {
        const u = i / nT, x = -W / 2 + 0.03 + (W - 0.06) * u, sag = 0.07 * Math.sin(Math.PI * ((u * 3) % 1));
        const tuft = mesh(new THREE.IcosahedronGeometry(0.032 + 0.01 * rnd(i), 0), rnd(i + 5) < 0.5 ? pine : pine2, g, x, H - 0.07 - sag, D / 2 - 0.01 + 0.01 * rnd(i + 2)); tuft.rotation.set(rnd(i) * 3, rnd(i + 1) * 3, 0); tuft.scale.set(1.3, 0.8, 0.7);
        if (rnd(i * 3 + 7) < 0.28) for (let b = 0; b < 3; b++) mesh(new THREE.SphereGeometry(0.009, 8, 6), berry, g, x + (b - 1) * 0.012, H - 0.075 - sag + 0.008 * rnd(b + i), D / 2 + 0.018);
      }
    }
    return { grip: 0 };
  },

  clambox(P) {
    const S = P.spec, W = S.w ?? 0.26, Dd = S.d ?? 0.2, H = S.h ?? 0.075, LH = S.lidH ?? 0.045, t = 0.004, lip = 0.012;
    const white = mat("#fbfbf8", { roughness: 0.6 }), inside = mat("#efeee8", { roughness: 0.75, side: THREE.DoubleSide });
    // a tapered open tray: outer and inner skins (thin walls), a flat lip round the top
    const tray = (w, d, h, m) => {
      const g = new THREE.Group(), tb = 0.88;   // the bottom is 88 % of the top
      const geo = new THREE.CylinderGeometry(Math.SQRT1_2, Math.SQRT1_2 * tb, 1, 4, 1, true); geo.rotateY(Math.PI / 4); geo.scale(w, h, d); geo.translate(0, h / 2, 0);
      const o = new THREE.Mesh(geo, m); o.castShadow = o.receiveShadow = true; g.add(o);
      const bt = new THREE.Mesh(new THREE.PlaneGeometry(w * tb, d * tb), m); bt.rotation.x = -Math.PI / 2; bt.position.y = 0.0015; g.add(bt);
      return g;
    };
    const base = new THREE.Group(); P.whole.add(base);
    base.add(tray(W, Dd, H, white));
    const inn = tray(W - 2 * t, Dd - 2 * t, H - t, inside); inn.position.y = t; base.add(inn);
    const lipG = new THREE.Shape(); lipG.moveTo(-W / 2 - lip, -Dd / 2 - lip); lipG.lineTo(W / 2 + lip, -Dd / 2 - lip); lipG.lineTo(W / 2 + lip, Dd / 2 + lip); lipG.lineTo(-W / 2 - lip, Dd / 2 + lip); lipG.closePath();
    const hole = new THREE.Path(); hole.moveTo(-W / 2 + t, -Dd / 2 + t); hole.lineTo(-W / 2 + t, Dd / 2 - t); hole.lineTo(W / 2 - t, Dd / 2 - t); hole.lineTo(W / 2 - t, -Dd / 2 + t); hole.closePath(); lipG.holes.push(hole);
    const lipM = mesh(new THREE.ExtrudeGeometry(lipG, { depth: 0.003, bevelEnabled: false }), white, base, 0, H, 0); lipM.rotation.x = -Math.PI / 2;
    // the cheese sauce pool inside (a bumpy disc just under the lip), chives on it
    const cheeseM = mat("#f6b92c", { roughness: 0.25, emissive: new THREE.Color("#7a4a00"), emissiveIntensity: 0.25 }); cheeseM.userData.noHatch = true;
    const cg = new THREE.CircleGeometry(1, 40); cg.scale(W / 2 - t - 0.004, Dd / 2 - t - 0.004, 1);
    const cp = cg.attributes.position; for (let i = 0; i < cp.count; i++) cp.setZ(i, 0.003 * Math.sin(cp.getX(i) * 90) * Math.cos(cp.getY(i) * 70));
    cg.computeVertexNormals();
    const cheese = mesh(cg, cheeseM, base, 0, 0, 0); cheese.rotation.x = -Math.PI / 2; steamy(cheese, 1); cheese.renderOrder = 0;
    const chiveM = mat("#4f9a2a", { roughness: 0.6 }); chiveM.userData.noHatch = true;
    const chives = new THREE.Group(); base.add(chives);
    for (let i = 0; i < 22; i++) { const a = rnd(i + 40) * Math.PI * 2, r = 0.35 + 0.6 * rnd(i + 70); const ch = steamy(mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.012, 5), chiveM, chives, Math.cos(a) * r * (W / 2 - 0.02), 0.002, Math.sin(a) * r * (Dd / 2 - 0.02)), 2); ch.rotation.set(Math.PI / 2, 0, a * 1.7); }
    // bubbles that pop on the cheese
    const bubM = mat("#ffd25a", { roughness: 0.2 }); bubM.userData.noHatch = true;
    const bubbles = [0, 1, 2, 3].map((i) => { const b = steamy(mesh(new THREE.SphereGeometry(0.008, 10, 8), bubM, base, (rnd(i + 3) - 0.5) * W * 0.7, 0, (rnd(i + 9) - 0.5) * Dd * 0.6), 2); return b; });
    // the lid: a shallow upturned tray hinged on the back edge (the pivot sits on the lip's back line)
    const side = S.hinge ?? "back", sx = side === "left" ? -1 : side === "right" ? 1 : 0;
    const hinge = new THREE.Group(); hinge.position.set(sx * (W / 2 + lip), H + 0.003, sx ? 0 : -Dd / 2 - lip); P.whole.add(hinge);
    const lidG = new THREE.Group(); lidG.position.set(-sx * (W / 2 + lip), 0, sx ? 0 : Dd / 2 + lip); hinge.add(lidG);
    const lidOut = tray(W + 2 * lip * 0.4, Dd + 2 * lip * 0.4, LH, white); lidOut.rotation.x = Math.PI; lidOut.position.y = LH; lidG.add(lidOut);
    const lidIn = tray(W - 2 * t, Dd - 2 * t, LH - t, inside); lidIn.rotation.x = Math.PI; lidIn.position.y = LH - t; lidG.add(lidIn);
    const lidLip = mesh(new THREE.ExtrudeGeometry(lipG, { depth: 0.003, bevelEnabled: false }), white, lidG, 0, 0.003, 0); lidLip.rotation.x = -Math.PI / 2;
    // a pressed rib across the lid top and the tab at the front
    mesh(new THREE.BoxGeometry(W * 0.7, 0.004, 0.01), mat("#f0f0ea"), lidG, 0, LH + 0.001, 0.03);
    if (sx) mesh(new THREE.BoxGeometry(0.02, 0.004, 0.05), white, lidG, -sx * (W / 2 + lip + 0.008), 0.0035, 0);   // the tab on the free edge
    else mesh(new THREE.BoxGeometry(0.05, 0.004, 0.02), white, lidG, 0, 0.0035, Dd / 2 + lip + 0.008);
    // steam: soft wisps that curl up and fade, cel-banded white
    const wispT = canvasTex(64, 128, (g, w, h) => { g.strokeStyle = "rgba(255,255,255,0.9)"; g.lineCap = "round"; g.lineWidth = 9; g.beginPath(); g.moveTo(32, 124); g.bezierCurveTo(8, 96, 56, 70, 30, 44); g.bezierCurveTo(14, 26, 40, 14, 34, 4); g.stroke(); });
    const wisps = [0, 1, 2].map((i) => { const m = new THREE.SpriteMaterial({ map: wispT, transparent: true, depthWrite: false, opacity: 0 }); m.userData.noOutline = true; const s = steamy(new THREE.Sprite(m), 6); P.whole.add(s); return { s, m, x: (i - 1) * W * 0.28, ph: rnd(i + 5) }; });
    return {
      grip: H / 2,
      apply(ps, tt) {
        const op = clamp(ps.open ?? 0), st = clamp(ps.steam ?? 0), ch = clamp(ps.cheese ?? 0), T = tt ?? 0;
        const ang = op * ((S.openDeg ?? 112) * Math.PI) / 180;
        if (sx) hinge.rotation.z = -sx * ang; else hinge.rotation.x = -ang;
        cheese.visible = chives.visible = ch > 0.01; cheese.position.y = t + (H - t - 0.012) * ch; chives.position.y = cheese.position.y + 0.002;
        bubbles.forEach((b, i) => { const ph = (T * 0.9 + rnd(i + 21)) % 1; b.visible = ch > 0.01 && op > 0.3; b.position.y = cheese.position.y; b.scale.setScalar(Math.max(0.001, Math.sin(Math.PI * ph) * (ph < 0.85 ? 1 : 0))); });
        const top = op > 0.4 ? H + 0.02 : H + LH + 0.01;
        wisps.forEach(({ s, m, x, ph }, i) => {
          const k = (T * 0.55 + ph) % 1, h = 0.09 + 0.06 * (op > 0.4 ? 1 : 0.4);
          s.position.set(x + 0.012 * Math.sin(T * 2 + i), top + h * 0.5 + k * h, 0);
          s.scale.set(0.05 + 0.02 * k, h * (op > 0.4 ? 1.4 : 0.9), 1);
          m.opacity = st * 0.7 * Math.sin(Math.PI * k);
        });
      },
    };
  },

  bill20(P) {
    const S = P.spec, W = S.w ?? 0.17, Dd = S.d ?? 0.075;
    const tex = canvasTex(512, Math.round(512 * (Dd / W)), (g, w, h) => {
      g.fillStyle = "#9cc98a"; g.fillRect(0, 0, w, h);
      g.strokeStyle = "#2f6b3a"; g.lineWidth = 8; g.strokeRect(10, 10, w - 20, h - 20);
      g.strokeStyle = "rgba(47,107,58,0.5)"; g.lineWidth = 2; for (let i = 0; i < 9; i++) { g.beginPath(); g.moveTo(24, 30 + i * (h - 60) / 8); g.lineTo(w - 24, 30 + i * (h - 60) / 8 + 6 * Math.sin(i)); g.stroke(); }
      g.fillStyle = "#d4ead0"; g.beginPath(); g.ellipse(w / 2, h / 2, h * 0.36, h * 0.36, 0, 0, Math.PI * 2); g.fill();
      g.strokeStyle = "#2f6b3a"; g.lineWidth = 5; g.stroke();
      g.fillStyle = "#1d4d29"; g.textAlign = "center"; g.textBaseline = "middle"; g.font = `900 ${Math.round(h * 0.42)}px "DejaVu Sans", sans-serif`; g.fillText("20", w / 2, h / 2 + 4);
      g.font = `900 ${Math.round(h * 0.22)}px "DejaVu Sans", sans-serif`; for (const [x, y] of [[0.12, 0.25], [0.88, 0.25], [0.12, 0.75], [0.88, 0.75]]) g.fillText("20", w * x, h * y);
    });
    const m = mat("#ffffff", { map: tex, roughness: 0.8, side: THREE.DoubleSide }); m.userData.noHatch = true;
    const g = new THREE.PlaneGeometry(W, Dd, 8, 2), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) p.setZ(i, 0.004 * Math.pow(Math.abs(p.getX(i)) / (W / 2), 2));   // a slight curl at the ends
    g.computeVertexNormals();
    const o = mesh(g, m, P.whole, 0, 0.0015, 0); o.rotation.x = -Math.PI / 2; o.castShadow = false; o.userData.steam = true; o.renderOrder = 1;
    return { grip: 0 };
  },

  cocoacup(P) {
    const R = 0.045, Rb = 0.034, H = 0.115;
    const sleeveT = canvasTex(256, 64, (g, w, h) => { g.fillStyle = "#a8743f"; g.fillRect(0, 0, w, h); g.fillStyle = "rgba(80,48,20,0.25)"; for (let i = 0; i < 30; i++) g.fillRect(0, i * 2.2, w, 0.8); g.fillStyle = "#c22a2a"; g.fillRect(0, h * 0.42, w, h * 0.16); });
    sleeveT.wrapS = THREE.RepeatWrapping;
    mesh(new THREE.CylinderGeometry(R, Rb, H, 28), mat("#fbfaf4", { roughness: 0.6 }), P.whole, 0, H / 2, 0);
    mesh(new THREE.CylinderGeometry(R * 0.93 + 0.003, Rb + (R - Rb) * 0.3 + 0.004, H * 0.42, 28, 1, true), mat("#ffffff", { map: sleeveT, roughness: 0.85 }), P.whole, 0, H * 0.48, 0);
    const lid = mat("#f4f2ea", { roughness: 0.45 });
    mesh(new THREE.CylinderGeometry(R + 0.004, R + 0.004, 0.01, 28), lid, P.whole, 0, H + 0.004, 0);
    mesh(new THREE.CylinderGeometry(R * 0.86, R + 0.002, 0.012, 28), lid, P.whole, 0, H + 0.014, 0);
    mesh(new THREE.BoxGeometry(0.014, 0.004, 0.006), mat("#3a2418"), P.whole, 0, H + 0.021, R * 0.6);   // the sip hole
    const wm = new THREE.SpriteMaterial({ map: canvasTex(32, 64, (g) => { g.strokeStyle = "rgba(255,255,255,0.9)"; g.lineCap = "round"; g.lineWidth = 5; g.beginPath(); g.moveTo(16, 62); g.bezierCurveTo(4, 44, 28, 30, 14, 4); g.stroke(); }), transparent: true, depthWrite: false, opacity: 0 });
    wm.userData.noOutline = true;
    const w = steamy(new THREE.Sprite(wm), 6); P.whole.add(w);
    return {
      grip: 0.06,
      apply(ps, t) { const s = clamp(ps.steam ?? 0), k = ((t ?? 0) * 0.5) % 1; w.position.set(0, H + 0.05 + 0.05 * k, R * 0.6); w.scale.set(0.03, 0.08, 1); wm.opacity = 0.6 * s * Math.sin(Math.PI * k); },
    };
  },

  cocoaspill(P) {
    const S = P.spec, Y = S.lip ?? 0.4;
    const choc = new THREE.MeshStandardMaterial({ color: "#5a2f17", roughness: 0.25, emissive: new THREE.Color("#2a1208"), emissiveIntensity: 0.3 }); choc.userData.noHatch = true;
    const stream = steamy(new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.006, 1, 8, 1, true), choc), 4); P.whole.add(stream);
    const poolG = new THREE.CircleGeometry(1, 28), pp = poolG.attributes.position;
    for (let i = 1; i < pp.count; i++) { const a = Math.atan2(pp.getY(i), pp.getX(i)), k = 0.82 + 0.18 * Math.sin(a * 3 + 1) * Math.sin(a * 5); pp.setXY(i, pp.getX(i) * k, pp.getY(i) * k); }
    const pool = steamy(new THREE.Mesh(poolG, new THREE.MeshStandardMaterial({ color: "#4e2814", roughness: 0.15, polygonOffset: true, polygonOffsetFactor: -2 })), 2); pool.rotation.x = -Math.PI / 2; pool.position.y = 0.003; P.whole.add(pool);
    pool.material.userData.noHatch = true;
    return {
      grip: 0,
      apply(ps, t) {
        const pr = clamp(ps.pour ?? 0), pl = clamp(ps.pool ?? 0), len = Math.max(0.001, Y * pr);
        stream.visible = pr > 0.01 && pr < 1.5; stream.scale.set(1 + 0.15 * Math.sin((t ?? 0) * 30), len, 1); stream.position.y = Y - len / 2;
        stream.visible = pr > 0.01 && (ps.stop ?? 0) < 0.5;
        pool.visible = pl > 0.01; pool.scale.set(0.09 * pl + 0.01, 0.06 * pl + 0.01, 1);
      },
    };
  },

  // apron: a vendor's half apron in red and white vertical stripes, worn (spec.wear) round the lower body: a curved
  // panel hanging from a waistband at spec.y0 down to spec.y1, wrapping spec.arc degrees of the front. Origin: the body's
  // axis; spec.rx, spec.rz the band's radii (a little outside the body there).
  apron(P) {
    const S = P.spec, y0 = S.y0 ?? 0.42, y1 = S.y1 ?? 0.08, rx = S.rx ?? 0.44, rz = S.rz ?? 0.39, arc = ((S.arc ?? 110) * Math.PI) / 180, flare = S.flare ?? 1.06;
    const tex = canvasTex(256, 128, (g, w, h) => { const n = 9, sw = w / n; for (let i = 0; i < n; i++) { g.fillStyle = i % 2 ? "#f6f1e6" : "#c4282c"; g.fillRect(i * sw, 0, sw, h); } g.fillStyle = "rgba(0,0,0,0.06)"; g.fillRect(0, h - 6, w, 6); });
    const m = mat("#ffffff", { map: tex, roughness: 0.85, side: THREE.DoubleSide });
    const geo = new THREE.CylinderGeometry(1, flare, 1, 24, 4, true, -arc / 2, arc), p = geo.attributes.position;
    geo.translate(0, -0.5, 0); geo.scale(rx, y0 - y1, rz);
    for (let i = 0; i < p.count; i++) { const k = (y0 - y1 - (-p.getY(i))) / (y0 - y1); p.setZ(i, p.getZ(i) + 0.004 * Math.sin(p.getX(i) * 40) * (1 - k)); }   // soft folds at the hem
    geo.computeVertexNormals();
    const o = mesh(geo, m, P.whole, 0, y0, 0); o.castShadow = false;
    // the waistband: a tie round the waist, on the same ellipse a little wider than the panel (the cylinder's theta 0
    // is +z, x = sin, z = cos)
    const pts = []; for (let i = 0; i <= 32; i++) { const a = -(arc + 0.5) / 2 + ((arc + 0.5) * i) / 32; pts.push(new THREE.Vector3(Math.sin(a) * rx * 1.01, 0, Math.cos(a) * rz * 1.01)); }
    mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 0.012, 6, false), mat("#c4282c", { roughness: 0.8 }), P.whole, 0, y0 - 0.005, 0).castShadow = false;
    return { grip: 0 };
  },

  loadedtop(P) {
    const S = P.spec, L = S.len ?? 0.36;
    const g = new THREE.Group(); P.whole.add(g);
    // the split: fluffy pale potato bulging out of a slit along the top
    const fluffM = mat("#fbe6a8", { roughness: 0.9 }); fluffM.userData.noHatch = true;
    for (let i = 0; i < 9; i++) { const u = i / 8 - 0.5, b = mesh(new THREE.SphereGeometry(0.045 + 0.012 * rnd(i), 12, 10), fluffM, g, u * L * 0.8, -0.018, 0.01 * rnd(i + 3)); b.scale.set(1.2, 0.6, 0.9); b.castShadow = false; }
    // melted cheese pouring out of the split and running down the sides in a few uneven drips
    const cheeseM = mat("#f5b622", { roughness: 0.25, emissive: new THREE.Color("#7a4a00"), emissiveIntensity: 0.2 }); cheeseM.userData.noHatch = true;
    const top = mesh(new THREE.SphereGeometry(0.11, 20, 12), cheeseM, g, 0, -0.01, 0.0); top.scale.set(L / 0.2, 0.32, 1.05); top.castShadow = false;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + rnd(i) * 0.6, len = 0.05 + 0.08 * rnd(i + 11), x = Math.cos(a) * L * 0.42, z = Math.sin(a) * 0.1;
      const d = mesh(new THREE.CapsuleGeometry(0.014 + 0.006 * rnd(i + 2), len, 4, 8), cheeseM, g, x, -0.03 - len / 2, z); d.rotation.z = -Math.cos(a) * 0.5; d.rotation.x = Math.sin(a) * 0.5; d.castShadow = false;
    }
    // the sour cream: a soft swirled dollop like a tiny hat (three stacked squashed rounds and a curled tip)
    const creamM = mat("#fbfaf4", { roughness: 0.55 });
    const hat = new THREE.Group(); hat.position.set(0, 0.03, 0); g.add(hat);
    for (const [y, r] of [[0, 0.07], [0.035, 0.055], [0.064, 0.036]]) { const d = mesh(new THREE.SphereGeometry(r, 18, 12), creamM, hat, 0, y, 0); d.scale.set(1, 0.6, 1); }
    const tip = mesh(new THREE.ConeGeometry(0.018, 0.04, 10), creamM, hat, 0.008, 0.095, 0); tip.rotation.z = -0.5;
    // chives: short green rings scattered over the cream and the cheese
    const chiveM = mat("#4f9a2a", { roughness: 0.6 }); chiveM.userData.noHatch = true;
    for (let i = 0; i < 16; i++) {
      const onHat = i < 7, a = rnd(i + 50) * Math.PI * 2, r = onHat ? 0.02 + 0.04 * rnd(i + 60) : L * (0.2 + 0.3 * rnd(i + 60));
      const ch = mesh(new THREE.CylinderGeometry(0.0055, 0.0055, 0.016, 6), chiveM, onHat ? hat : g, Math.cos(a) * r, onHat ? 0.02 + 0.05 * rnd(i) : 0.012, Math.sin(a) * r * (onHat ? 1 : 0.4) + (onHat ? 0 : 0.04));
      ch.rotation.set(rnd(i) * 3, rnd(i + 1) * 3, rnd(i + 2) * 3); ch.castShadow = false;
    }
    return { grip: 0 };
  },
};
