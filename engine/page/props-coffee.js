import * as THREE from "three";
import { clamp, rng } from "./util.js";
import { mat, basic, mesh, canvasTex } from "./props-trend.js";

// "That one friend who never has money… on a coffee run" (never has money, episode 2, 7 Nov 2026): a sunny shared-flat
// kitchen. Jonny's eight panels: a tall rounded retro fridge in egg-yolk yellow covered top to bottom in pale yellow
// IOU sticky notes ("IOU" and a little cup doodle in blue marker), layered like feathers, the newest crooked, a few
// curling at a corner; paper coffee cups with a kraft sleeve, a potato logo and a white lid; a pulp cup carrier; a
// wooden table with a red-checked runner and a bowl of apples; a glass milk bottle with a cow on its label.
//
// How the notes behave (real paper, copied from how sticky notes go): a note is held on by a strip of glue along its
// top edge only, so the rest hangs free and its bottom edge lifts a little off the door. Stuck in rows from the bottom
// up, each row overlaps the top of the row below (feathers, roof tiles). Yanked hard, a door accelerates out from under
// its notes: their glue strips let go, and the notes stay where they were for a moment (inertia), then fall. Paper
// falls slowly, rocking from side to side like a leaf, edge first, and slides off whatever it lands on; a heap of it is
// loose and soft, and anything under it pushes up through it.
//
//   ioufridge   the fridge: spec.w (0.7), spec.d (0.65), spec.h (1.7). Origin: the floor under its middle; its front
//               (+z) faces the room. The door (nearly the whole front) is hinged on the left (-x) edge; the chrome
//               handle stands on its right (opening) edge at spec.handle [y0, y1] (0.72..1.05). About spec.notes (62) IOU
//               notes on the door, a dozen more on the right side. Inside: shelves, eggs, a jar, greens (the milk bottle
//               is its own prop). Params:
//                 open 0..1   the door swings toward camera-left on its hinge, to 105 degrees
//                 fall 0..1   the avalanche: the door's notes let go (in the first quarter, from the opening edge
//                             toward the hinge) where the door was, then fall rocking into the heap; 0 they are on the door
//                 drop 0..1   the heap round spec.pile slumps from its top to spec.pile.low (he digs himself out)
//               (fall and drop are prop-state keys propState tweens; a key it doesn't know jumps to its end at once)
//               spec.pile { x, z, r, h, low } in the fridge's own frame: the heap's middle (where he stands), its radius,
//               its height and its height after `drop`; spec.spill { x, z, r, h }: the low drift in front of the door.
//               The fridge's body, door and handle are solid; the paper is not (contact checks leave it out: it is
//               loose paper that he stands in).
//   iounote     one fresh sticky note (spec.size 0.16 across, a hand-sized prop at potato scale), bright and new, glue
//               along its top edge. Its writing is on its BACK (-z), so the phone hold (face to the holder) shows the
//               writing to whoever he holds it out to. `ink` 0..1 writes it: the I, the O, the U, then the cup doodle.
//   feltpen     a fat blue marker, its felt tip at the origin pointing down, its cap end up (len 0.13): the thin pinch.
//   coffeecup   a takeaway paper cup with a kraft sleeve and the potato logo, a white snap lid (r 0.045, h 0.115, the
//               cocoacup's size): the mug hold round the sleeve. `steam` 0..1 a wisp from the sip hole.
//   cuptray     a moulded pulp carrier for four cups (0.25 across), its cups' bottoms at y 0.012 in the holes at
//               (+-0.062, +-0.062).
//   milkbottle  a glass milk bottle with a red cap and a cow on its label (r 0.04, h 0.2): the mug hold round its body.
//   milkpour    a thin white stream from the origin down to spec.lip (pour 0..1 its length), then gone at stop 1.
//   kitchentable a wooden table along x (spec.w, spec.d, spec.h) with a red-checked runner down its length.
//   fruitbowl   a shallow wooden bowl of red apples (table dressing).
//   kitchencounter a run of cream kitchen cupboards with a butcher-block worktop (spec.w, spec.d, spec.h), a moka pot,
//               a little radio and a jar of spoons on it.
//   wrapscarf   a chunky knitted scarf (worn: spec.wear, in the body's frame; its origin the wrap's middle) wound once round the body
//               with radii spec.rx, spec.rz (the body's there, plus the knit's thickness), its two ends hanging
//               down the front at the right, a fringe at their ends. spec.color (purple).
//   plankfloor  warm honey floorboards: a thin sheet on the ground (spec.w, spec.d).
export const COFFEE = { fridge: { w: 0.7, d: 0.65, h: 1.7 }, note: 0.16, cup: { r: 0.045, h: 0.115 }, tray: 0.062, pen: { len: 0.13, r: 0.009 }, milk: { r: 0.04, h: 0.2 } };

const YOLK = "#f2b51f", NOTE = "#fff09a", NOTE_OLD = "#f7e37c", INK = "#1f3c8f", CHROME = () => mat("#d8dde3", { roughness: 0.18, metalness: 0.85 });
const smooth = (k) => k * k * (3 - 2 * k);

// a rounded box (the retro fridge's soft corners): bevelled all round, w x h, d deep (centred)
function softBox(w, h, d, r, seg = 4) {
  const s = new THREE.Shape(), x = w / 2 - r, y = h / 2 - r;
  s.moveTo(-x, -h / 2); s.lineTo(x, -h / 2); s.quadraticCurveTo(w / 2, -h / 2, w / 2, -y); s.lineTo(w / 2, y); s.quadraticCurveTo(w / 2, h / 2, x, h / 2);
  s.lineTo(-x, h / 2); s.quadraticCurveTo(-w / 2, h / 2, -w / 2, y); s.lineTo(-w / 2, -y); s.quadraticCurveTo(-w / 2, -h / 2, -x, -h / 2);
  const g = new THREE.ExtrudeGeometry(s, { depth: Math.max(0.001, d - 2 * r), bevelEnabled: true, bevelThickness: r, bevelSize: r * 0.98, bevelSegments: seg, curveSegments: 8 });
  g.translate(0, 0, -(d - 2 * r) / 2);
  return g;
}

// a cabinet shell: the rounded outline w x h (corner radius r) with a w2 x h2 hole (its centre dy above the middle),
// extruded d deep (z centred), a small bevel on the edges
function shellGeo(w, h, d, r, w2, h2, dy, b = 0.018) {
  const s = new THREE.Shape(), x = w / 2 - r, y = h / 2 - r;
  s.moveTo(-x, -h / 2); s.lineTo(x, -h / 2); s.quadraticCurveTo(w / 2, -h / 2, w / 2, -y); s.lineTo(w / 2, y); s.quadraticCurveTo(w / 2, h / 2, x, h / 2);
  s.lineTo(-x, h / 2); s.quadraticCurveTo(-w / 2, h / 2, -w / 2, y); s.lineTo(-w / 2, -y); s.quadraticCurveTo(-w / 2, -h / 2, -x, -h / 2);
  const hx = w2 / 2, hy = h2 / 2, q = 0.03, hole = new THREE.Path();
  hole.moveTo(-hx + q, dy - hy); hole.quadraticCurveTo(-hx, dy - hy, -hx, dy - hy + q); hole.lineTo(-hx, dy + hy - q); hole.quadraticCurveTo(-hx, dy + hy, -hx + q, dy + hy);
  hole.lineTo(hx - q, dy + hy); hole.quadraticCurveTo(hx, dy + hy, hx, dy + hy - q); hole.lineTo(hx, dy - hy + q); hole.quadraticCurveTo(hx, dy - hy, hx - q, dy - hy); hole.lineTo(-hx + q, dy - hy);
  s.holes.push(hole);
  const g = new THREE.ExtrudeGeometry(s, { depth: Math.max(0.001, d - 2 * b), bevelEnabled: true, bevelThickness: b, bevelSize: b * 0.9, bevelSegments: 3, curveSegments: 10 });
  g.translate(0, 0, -(d - 2 * b) / 2);
  return g;
}

// The IOU handwriting: a quick blue marker "IOU" and a steaming cup doodle, a little different on every note (the
// slant, the size, sometimes "x2" or "4.50" under it). ink 0..1 draws it stroke by stroke (for the note he writes).
function drawIOU(g, w, h, { seed = 1, ink = 1, paper = NOTE, glue = true, fresh = false } = {}) {
  const r = rng(seed);
  g.fillStyle = paper; g.fillRect(0, 0, w, h);
  // the glue strip along the top (a touch darker and glossier), and a soft shadow of age at the bottom on old notes
  if (glue) { g.fillStyle = "rgba(160,120,0,0.10)"; g.fillRect(0, 0, w, h * 0.16); }
  if (!fresh) { const gr = g.createLinearGradient(0, h * 0.6, 0, h); gr.addColorStop(0, "rgba(150,110,20,0)"); gr.addColorStop(1, "rgba(150,110,20,0.16)"); g.fillStyle = gr; g.fillRect(0, h * 0.6, w, h * 0.4); }
  g.save(); g.translate(w / 2, h * 0.5); g.rotate((r() - 0.5) * 0.25); g.translate(-w / 2, -h * 0.5);
  g.strokeStyle = INK; g.lineCap = "round"; g.lineJoin = "round"; g.lineWidth = w * (0.05 + r() * 0.012);
  const s = 0.9 + r() * 0.2, y0 = h * 0.2, y1 = h * (0.5 + 0.02 * r()), xs = w * 0.17;
  // strokes: [x0, y0, x1, y1] lines and arcs, in the order a hand writes them
  const strokes = [];
  strokes.push((k) => { g.beginPath(); g.moveTo(xs, y0); g.lineTo(xs + (r() - 0.5) * 2, y0 + (y1 - y0) * k); g.stroke(); });   // I
  const ox = w * 0.44, oy = (y0 + y1) / 2, orx = w * 0.12 * s, ory = (y1 - y0) / 2;
  strokes.push((k) => { g.beginPath(); g.ellipse(ox, oy, orx, ory, 0, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * k); g.stroke(); });   // O
  const ux = w * 0.68;
  strokes.push((k) => { g.beginPath(); g.moveTo(ux, y0); g.lineTo(ux, y1 - ory * 0.6); g.quadraticCurveTo(ux, y1, ux + orx, y1); g.quadraticCurveTo(ux + orx * 2, y1, ux + orx * 2, y1 - ory * 0.6); g.lineTo(ux + orx * 2, y0 + (y1 - y0) * (1 - k)); g.stroke(); });   // U
  // the cup doodle: a cup, its handle, two wisps of steam
  const cx = w * 0.5, cy = h * 0.8, cw = w * 0.13 * s, ch = h * 0.11;
  g.lineWidth *= 0.7;
  strokes.push((k) => {
    g.beginPath(); g.moveTo(cx - cw, cy - ch); g.lineTo(cx - cw * 0.75, cy + ch); g.lineTo(cx + cw * 0.75, cy + ch); g.lineTo(cx + cw, cy - ch); g.closePath(); g.stroke();
    if (k > 0.4) { g.beginPath(); g.arc(cx + cw * 1.05, cy, ch * 0.55, -Math.PI / 2, Math.PI / 2); g.stroke(); }
    if (k > 0.7) for (const dx of [-0.35, 0.35]) { g.beginPath(); g.moveTo(cx + cw * dx, cy - ch * 1.3); g.quadraticCurveTo(cx + cw * (dx + 0.3), cy - ch * 1.8, cx + cw * dx, cy - ch * 2.3); g.stroke(); }
  });
  const n = strokes.length, done = ink * n;
  for (let i = 0; i < n; i++) if (done > i) strokes[i](Math.min(1, done - i));
  // a few old ones carry a tally
  if (!fresh && ink >= 1 && r() < 0.3) { g.lineWidth = w * 0.03; g.font = `bold ${Math.round(w * 0.13)}px 'Comic Sans MS', 'DejaVu Sans', sans-serif`; g.fillStyle = INK; g.fillText(r() < 0.5 ? "x2" : "4.50", w * 0.66, h * 0.86); }
  g.restore();
}

// a note's paper: a square sheet hanging from its glued top edge (the origin is the middle of that edge, the sheet
// hangs down -y, its face +z), its free bottom lifting off the surface by `lift` and curling at one corner by `curl`
function noteGeo(W, { lift = 0.006, curl = 0, side = 1 } = {}) {
  const g = new THREE.PlaneGeometry(W, W, 4, 4); g.translate(0, -W / 2, 0);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const v = -p.getY(i) / W, u = p.getX(i) / W + 0.5;   // v 0 at the glue, 1 at the free edge; u 0..1 across
    const corner = curl * Math.max(0, (side > 0 ? u : 1 - u) - 0.55) * Math.max(0, v - 0.55) * 8;
    p.setZ(i, lift * v * v + corner * W * 0.12);
  }
  g.computeVertexNormals();
  return g;
}

// the textures of the old notes: a handful of hands, shared by every note on the fridge (an atlas would be cheaper
// but per-note materials let a few look older)
let OLD = null;
function oldNoteMats() {
  if (OLD) return OLD;
  OLD = [];
  for (let i = 0; i < 6; i++) {
    const t = canvasTex(256, 256, (g, w, h) => drawIOU(g, w, h, { seed: 11 + i * 7, paper: i % 3 === 2 ? NOTE_OLD : NOTE }));
    const m = mat("#ffffff", { map: t, roughness: 0.9, side: THREE.DoubleSide }); m.userData.noHatch = true;
    OLD.push(m);
  }
  return OLD;
}

export const COFFEE_GRIPS = {};

export const COFFEE_KINDS = {
  ioufridge(P) {
    const S = P.spec, F = { ...COFFEE.fridge, ...S }, W = F.w, D = F.d, H = F.h, R = 0.11;
    const [hy0, hy1] = S.handle ?? [0.72, 1.05], NW = S.noteSize ?? 0.15, rnd = rng(S.seed ?? 7);
    const yolk = mat(S.color ?? YOLK, { roughness: 0.32, metalness: 0.05 }), chrome = CHROME(), white = mat("#f6f4ee", { roughness: 0.4 }), dark = mat("#3a3530", { roughness: 0.6 });
    // the cabinet: a rounded shell open at the front (a back, two sides, a top and a floor), white inside
    const DT = 0.08;   // the door's thickness: the cabinet's box stops behind it
    const BD = D - DT;
    // the opening, seen when the door swings: a white lined hole through the front of the shell
    const IW = W - 0.1, IH = H - 0.3, ID = BD - 0.06, iy = 0.08 + 0.1 + IH / 2;
    // the shell: the rounded front outline with the opening cut out, run back the cabinet's depth (two sides, a top and
    // a floor, solid walls round an open hole), and a back panel. A hand reaching for the milk goes into the hole, not
    // into a closed box
    const by = 0.08 + (H - 0.08) / 2;
    const body = mesh(shellGeo(W, H - 0.08, BD, R, IW, IH, iy - by), yolk, P.whole, 0, by, -DT / 2);
    body.userData.solid = true;
    const back = mesh(new THREE.BoxGeometry(W - 0.04, H - 0.12, 0.04), yolk, P.whole, 0, by, -DT / 2 - BD / 2 + 0.03);
    back.userData.solid = true;
    const inner = new THREE.Group(); P.whole.add(inner);
    const lining = mesh(new THREE.BoxGeometry(IW, IH, ID), new THREE.MeshStandardMaterial({ color: "#eef3f4", roughness: 0.5, side: THREE.BackSide }), inner, 0, iy, BD / 2 - DT / 2 - ID / 2 + 0.002);
    lining.userData.solid = false;
    // the cold light inside (it glows only while the door is open)
    const glowM = basic({ color: "#e9f6ff", transparent: true, opacity: 0 });
    const glow = mesh(new THREE.PlaneGeometry(IW * 0.8, 0.05), glowM, inner, 0, iy + IH / 2 - 0.04, BD / 2 - DT / 2 - ID + 0.05); glow.userData.solid = false; glow.castShadow = false;
    // shelves (glass with a chrome lip), the eggs, a jar of pickles, a head of lettuce, a butter dish
    const glass = mat("#dfeef2", { roughness: 0.1, transparent: true, opacity: 0.5 });
    const shelfY = [0.42, 0.78, 1.12].map((v) => 0.08 + v * (IH / 1.4));
    const zMid = BD / 2 - DT / 2 - ID / 2;
    for (const y of shelfY) { const sh = mesh(new THREE.BoxGeometry(IW - 0.01, 0.012, ID - 0.02), glass, inner, 0, y, zMid); sh.userData.solid = false; const lip = mesh(new THREE.BoxGeometry(IW - 0.01, 0.014, 0.012), chrome, inner, 0, y + 0.006, zMid + ID / 2 - 0.01); lip.userData.solid = false; }
    const egg = mat("#f7ecd9", { roughness: 0.6 }), carton = mat("#c9b79a", { roughness: 0.9 });
    const ec = mesh(new THREE.BoxGeometry(0.26, 0.04, 0.11), carton, inner, -0.1, shelfY[2] + 0.026, zMid + 0.06); ec.userData.solid = false;
    for (let i = 0; i < 6; i++) { const e = mesh(new THREE.SphereGeometry(0.024, 12, 10), egg, inner, -0.2 + (i % 3) * 0.1 + (i > 2 ? 0.0 : 0), shelfY[2] + 0.06, zMid + 0.035 + (i > 2 ? 0.05 : 0)); e.scale.y = 1.3; e.userData.solid = false; }
    const jar = mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.12, 16), mat("#c2552b", { roughness: 0.3 }), inner, 0.17, shelfY[2] + 0.07, zMid); jar.userData.solid = false;
    const lid = mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.02, 16), mat("#e0d6c2"), inner, 0.17, shelfY[2] + 0.14, zMid); lid.userData.solid = false;
    const greens = mat("#5fae3e", { roughness: 0.8 });
    for (let i = 0; i < 5; i++) { const l = mesh(new THREE.IcosahedronGeometry(0.045, 1), greens, inner, 0.12 + (rnd() - 0.5) * 0.12, shelfY[0] + 0.05 + rnd() * 0.03, zMid - 0.03 + (rnd() - 0.5) * 0.1); l.userData.solid = false; }
    const jam = mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.09, 14), mat("#8e1f3a", { roughness: 0.3 }), inner, -0.2, shelfY[0] + 0.05, zMid - 0.05); jam.userData.solid = false;
    // the kick plate and the little chrome badge at the top
    mesh(new THREE.BoxGeometry(W - 0.12, 0.08, 0.04), dark, P.whole, 0, 0.04, D / 2 - DT - 0.04).userData.solid = false;

    // THE DOOR: hinged on the left edge of the front; nearly the whole front
    const hinge = new THREE.Group(); hinge.position.set(-W / 2 + 0.01, 0, D / 2 - DT); P.whole.add(hinge);
    const DW = W - 0.02, DH = H - 0.12, dy = 0.1 + DH / 2;
    const door = mesh(softBox(DW, DH, DT, 0.035), yolk, hinge, DW / 2, dy, DT / 2);
    door.userData.solid = true;
    // the inside of the door: white, with a bottle rail
    const din = mesh(new THREE.BoxGeometry(DW - 0.1, DH - 0.12, 0.01), white, hinge, DW / 2, dy, 0.004); din.userData.solid = false;
    for (const y of [0.45, 0.85, 1.2]) { const rail = mesh(new THREE.BoxGeometry(DW - 0.14, 0.05, 0.05), white, hinge, DW / 2, y, -0.03); rail.userData.solid = false; }
    // the chrome handle: a bar on two posts at the opening edge
    const hx = DW - 0.055, hz = DT + 0.045, hl = hy1 - hy0;
    const bar = mesh(new THREE.CylinderGeometry(0.014, 0.014, hl, 12), chrome, hinge, hx, (hy0 + hy1) / 2, hz); bar.userData.solid = true;
    for (const y of [hy0 + 0.02, hy1 - 0.02]) { const post = mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.05, 8), chrome, hinge, hx, y, DT + 0.022); post.rotation.x = Math.PI / 2; post.userData.solid = true; }
    // the fresh note he sticks on the handle (shown from `tagged`: it rides the door from then on); his note prop is
    // let go exactly here and hidden on the same frame
    const tagT = canvasTex(256, 256, (g, w, h) => drawIOU(g, w, h, { seed: S.tagSeed ?? 3, fresh: true }));
    const tagM = mat("#ffffff", { map: tagT, roughness: 0.85, side: THREE.DoubleSide }); tagM.userData.noHatch = true;
    const TAG = S.tag ?? { y: 0.9, size: COFFEE.note };
    const tag = mesh(new THREE.PlaneGeometry(TAG.size, TAG.size, 2, 2), tagM, hinge, hx, TAG.y, hz + 0.016); tag.userData.solid = false; tag.castShadow = false; tag.visible = false;
    // a chrome badge near the top
    const badge = mesh(new THREE.BoxGeometry(0.16, 0.035, 0.008), chrome, hinge, DW / 2, DH + 0.02, DT + 0.004); badge.userData.solid = false;

    // THE NOTES on the door: rows from the bottom up, each row overlapping the top of the one below (feathers);
    // crooked, a few with a curled corner; the newest (top rows) the most crooked. In the door's frame.
    const mats = oldNoteMats(), notes = [];
    const rowsY = []; for (let y = 0.2 + NW; y < DH + 0.07; y += NW * 0.72) rowsY.push(y);
    const pmat = rng((S.seed ?? 7) + 3);
    rowsY.forEach((y, ri) => {
      const cols = Math.round((DW - 0.04) / (NW * 0.82));
      for (let ci = 0; ci < cols; ci++) {
        const x = 0.03 + NW / 2 + ci * ((DW - 0.06 - NW) / Math.max(1, cols - 1)) + (pmat() - 0.5) * 0.07;
        if (pmat() < 0.06) continue;   // a gap here and there, never in a rhythm
        notes.push({ x, y: y + (pmat() - 0.5) * 0.05, ri, tilt: (pmat() - 0.5) * (0.34 + ri * 0.025), m: mats[Math.floor(pmat() * mats.length)], curl: pmat() < 0.2 ? 0.6 + pmat() * 0.6 : 0, side: pmat() < 0.5 ? -1 : 1 });
      }
    });
    // the door's notes as their own meshes (each one falls on its own path)
    const flyer = new THREE.Group(); P.whole.add(flyer);
    for (const [i, n] of notes.entries()) {
      const o = new THREE.Mesh(noteGeo(NW, { lift: 0.012, curl: n.curl, side: n.side }), n.m);
      o.userData.solid = false; o.castShadow = false; o.receiveShadow = true;
      o.position.set(n.x, n.y, DT + 0.002 + n.ri * 0.0012 + (i % 3) * 0.0004); o.rotation.z = n.tilt;
      hinge.add(o); n.o = o;
    }
    // a dozen more on the right side of the cabinet (they stay: the door's swing never reaches them)
    const sideG = new THREE.Group(); sideG.position.set(W / 2 + 0.002, 0, -DT / 2); sideG.rotation.y = Math.PI / 2; P.whole.add(sideG);
    for (let y = 0.25 + NW; y < H - 0.15; y += NW * 0.75) for (let x = -BD / 2 + NW / 2 + 0.03; x < BD / 2 - NW / 2; x += NW * 0.85) {
      if (pmat() < 0.25) continue;
      const o = mesh(noteGeo(NW, { lift: 0.01, curl: pmat() < 0.2 ? 0.8 : 0, side: 1 }), mats[Math.floor(pmat() * mats.length)], sideG, x + (pmat() - 0.5) * 0.03, y, 0.002 + y * 0.001);
      o.rotation.z = (pmat() - 0.5) * 0.25; o.userData.solid = false; o.castShadow = false;
    }

    // THE HEAP: loose notes on a soft mound round where he stands (spec.pile), and a low drift in front of the door
    // (spec.spill). Each piece is a note lying on the mound's surface, tipped to its slope and turned at random; under
    // them a yellow core fills the gaps. One mesh for all the pieces; its height grows with the notes that have landed.
    const PL = { x: 0.9, z: 0.55, r: 0.75, h: 1.05, low: 0.62, ...(S.pile ?? {}) }, SP = { x: 0.15, z: 0.7, r: 0.6, h: 0.22, ...(S.spill ?? {}) };
    const mound = (m, x, z) => { const d = Math.hypot(x - m.x, z - m.z) / m.r; return d >= 1 ? 0 : m.h * (1 - d ** 4); };
    const heapAt = (x, z) => Math.max(mound(PL, x, z), mound(SP, x, z));
    const heap = new THREE.Group(); P.whole.add(heap);
    const pileG = new THREE.Group(), spillG = new THREE.Group(); heap.add(pileG); heap.add(spillG);
    const buildMound = (m, parent, count, seed) => {
      const pr = rng(seed), geos = mats.map(() => []);
      parent.position.set(m.x, 0, m.z);
      for (let i = 0; i < count; i++) {
        // spread over the mound, more on the slopes (they show)
        const a = pr() * Math.PI * 2, d = Math.sqrt(pr()) * m.r * 1.04, x = m.x + Math.cos(a) * d, z = m.z + Math.sin(a) * d;
        const y = mound(m, x, z);
        const e = 0.002, gx = (mound(m, x + e, z) - mound(m, x - e, z)) / (2 * e), gz = (mound(m, x, z + e) - mound(m, x, z - e)) / (2 * e);
        const n = new THREE.Vector3(-gx, 1, -gz).normalize();
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), n);
        q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), pr() * Math.PI * 2));
        q.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler((pr() - 0.5) * 0.7, (pr() - 0.5) * 0.7, 0)));
        const g = new THREE.PlaneGeometry(NW, NW, 1, 1);
        g.applyQuaternion(q); g.translate(x - m.x, y + 0.004 + pr() * 0.02, z - m.z);
        geos[Math.floor(pr() * mats.length)].push(g);
      }
      geos.forEach((list, k) => { if (!list.length) return; const merged = mergeGeos(list); const o = new THREE.Mesh(merged, mats[k]); o.userData.solid = false; o.castShadow = false; o.receiveShadow = true; parent.add(o); });
      // the core under the paper: a soft yellow dome, a little lower than the surface
      const core = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat("#f6dc5c", { roughness: 0.95 }));
      core.scale.set(m.r * 0.92, m.h * 0.94, m.r * 0.92); core.userData.solid = false; core.castShadow = false; parent.add(core);
    };
    buildMound(PL, pileG, S.pieces ?? 420, (S.seed ?? 7) + 11);
    buildMound(SP, spillG, Math.round((S.pieces ?? 420) * 0.35), (S.seed ?? 7) + 23);

    // each door note's fall: it lets go where it is (the door's closed place: the door leaves it behind), drops and
    // rocks down onto the heap. Release order: from the opening edge toward the hinge, top rows a little first (the
    // swing pulls the free edge out first); its landing spot is on the heap where it is when it lands.
    const fr = rng((S.seed ?? 7) + 31);
    const doorPos = (n) => new THREE.Vector3(-W / 2 + 0.01 + n.x, n.y, D / 2 - DT + DT + 0.002);
    const fall = notes.map((n) => {
      const rel = 0.22 * (1 - n.x / DW) + 0.06 * (1 - n.y / DH) + fr() * 0.05;
      const dur = 0.42 + fr() * 0.25;
      const toPile = fr() < 0.62, m = toPile ? PL : SP;
      const a = fr() * Math.PI * 2, d = Math.sqrt(fr()) * m.r * (toPile ? 0.7 : 0.9);
      return { n, start: doorPos(n), rel, dur, land: [m.x + Math.cos(a) * d * (toPile ? 1 : 1), m.z + Math.sin(a) * d], toPile,
        sway: 0.04 + fr() * 0.06, ph: fr() * 6.28, spin: (fr() - 0.5) * 3, tumble: (fr() - 0.5) * 2 };
    });
    // the heap's fill at a moment: the share of notes that have landed, eased (the heap rises as they arrive)
    const ends = fall.map((f) => f.rel + f.dur).sort((a, b) => a - b);
    const landed = (p) => { let k = 0; for (const e of ends) if (e <= p) k++; return k / ends.length; };
    fall.forEach((f) => { f.k = landed(f.rel + f.dur); });
    return {
      grip: 0,
      apply(ps) {
        const open = clamp(ps.open ?? 0), peel = clamp(ps.fall ?? 0), settle = clamp(ps.drop ?? 0);
        hinge.rotation.y = (-105 * Math.PI / 180) * open;
        tag.visible = (ps.tagged ?? 0) > 0.5;
        glowM.opacity = 0.9 * clamp(open * 3);
        // the heap: it grows with the landed share (a soft start: the first notes make a scatter, not a mound)
        const k = landed(peel), kk = k <= 0 ? 0 : 0.12 + 0.88 * smooth(k);
        heap.visible = k > 0;
        const low = PL.low / PL.h;
        pileG.scale.set(1, Math.max(0.001, kk * (1 - settle * (1 - low))), 1);
        spillG.scale.set(1, Math.max(0.001, kk), 1);
        for (const f of fall) {
          const o = f.n.o, u = (peel - f.rel) / f.dur;
          if (u <= 0 || peel <= 0) {   // still on the door
            if (o.parent !== hinge) { hinge.add(o); o.position.set(f.n.x, f.n.y, DT + 0.002 + f.n.ri * 0.0012); o.rotation.set(0, 0, f.n.tilt); o.scale.set(1, 1, 1); }
            o.visible = true;
            continue;
          }
          if (o.parent !== flyer) flyer.add(o);
          if (u >= 1) { o.visible = false; continue; }
          o.visible = true;
          // the landing height: the heap's surface there when it lands
          const L = f.land, hy = (f.toPile ? mound(PL, L[0], L[1]) : mound(SP, L[0], L[1])) * (0.12 + 0.88 * smooth(f.k));
          // a quick drop away from the door first (out and down), then a slow rocking fall, leaf-like
          const s = smooth(u), x = f.start.x + (L[0] - f.start.x) * s + Math.sin(u * 9 + f.ph) * f.sway * (1 - u);
          const z = f.start.z + 0.12 * Math.sin(Math.PI * Math.min(1, u * 1.6)) + (L[1] - f.start.z) * s;
          const y = f.start.y + (hy + 0.01 - f.start.y) * (u * u * 0.35 + u * 0.65);
          o.position.set(x, y, z);
          // edge first, rocking: it tips from hanging upright toward lying flat on the heap as it lands
          o.rotation.set(-Math.PI / 2 * s + 0.4 * Math.sin(u * 7 + f.ph) * (1 - u), f.spin * u, f.n.tilt + f.tumble * Math.sin(u * 5 + f.ph) * (1 - u));
        }
      },
    };
  },

  iounote(P) {
    const S = P.spec, W = S.size ?? COFFEE.note;
    // a few ink levels, each its own texture (drawn once): the writing appears stroke by stroke. The writing shows on
    // both faces (the marker soaks through thin paper; at phone size the viewer only ever sees one side at a time)
    const steps = 12, front = [], back = [];
    for (let i = 0; i <= steps; i++) {
      front.push(canvasTex(256, 256, (g, w, h) => drawIOU(g, w, h, { seed: S.seed ?? 3, ink: i / steps, fresh: true })));
      back.push(canvasTex(256, 256, (g, w, h) => { g.translate(w, 0); g.scale(-1, 1); drawIOU(g, w, h, { seed: S.seed ?? 3, ink: i / steps, fresh: true }); }));
    }
    const mf = mat("#ffffff", { map: front[steps], roughness: 0.85, side: THREE.FrontSide }), mb = mat("#ffffff", { map: back[steps], roughness: 0.85, side: THREE.BackSide });
    mf.userData.noHatch = mb.userData.noHatch = true;
    // the sheet, centred on the origin (the phone hold's frame), its glue edge up, its free edge curling back a little
    const g = new THREE.PlaneGeometry(W, W, 4, 4);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const v = (W / 2 - p.getY(i)) / W; p.setZ(i, -0.006 * v * v); }
    g.computeVertexNormals();
    const of = mesh(g, mf, P.whole), ob = mesh(g, mb, P.whole); of.castShadow = ob.castShadow = false;
    let last = -1;
    return {
      grip: 0,
      apply(ps, t) {
        const k = Math.round(clamp(ps.ink ?? 1) * steps);
        if (k !== last) { mf.map = front[k]; mb.map = back[k]; mf.needsUpdate = mb.needsUpdate = true; last = k; }
        const w = clamp(ps.wag ?? 0), rz = w * 0.4 * Math.sin((t ?? 0) * 11), rx = w * 0.3 * Math.sin((t ?? 0) * 7 + 1);
        of.rotation.set(rx, 0, rz); ob.rotation.set(rx, 0, rz);
      },
    };
  },

  feltpen(P) {
    const { len: L, r: R } = COFFEE.pen;
    const body = mat("#2a55c9", { roughness: 0.35 }), cap = mat("#1d3d96", { roughness: 0.35 }), felt = mat("#16245c", { roughness: 0.9 });
    mesh(new THREE.ConeGeometry(R * 0.55, 0.018, 10), felt, P.whole, 0, 0.009, 0).rotation.x = Math.PI;   // the felt tip, down
    mesh(new THREE.CylinderGeometry(R * 0.75, R * 0.6, 0.014, 12), mat("#e8e8e8", { roughness: 0.4 }), P.whole, 0, 0.025, 0);
    mesh(new THREE.CylinderGeometry(R, R * 0.8, L * 0.62, 14), body, P.whole, 0, 0.032 + L * 0.31, 0);
    mesh(new THREE.CylinderGeometry(R * 1.05, R * 1.05, L * 0.3, 14), cap, P.whole, 0, 0.032 + L * 0.62 + L * 0.15 - 0.01, 0);
    mesh(new THREE.BoxGeometry(0.004, L * 0.24, 0.005), CHROME(), P.whole, R * 1.1, 0.032 + L * 0.66, 0);   // the clip
    return { grip: 0 };
  },

  coffeecup(P) {
    const { r: R, h: H } = COFFEE.cup, Rb = 0.034;
    const sleeveT = canvasTex(512, 96, (g, w, h) => {
      g.fillStyle = "#b07d48"; g.fillRect(0, 0, w, h);
      g.fillStyle = "rgba(90,55,25,0.18)"; for (let i = 0; i < 44; i++) g.fillRect(0, i * 2.2, w, 0.8);
      // the potato logo on the front (u 0.25: the cup's +z side) and the back: a lumpy oval with two eye dots
      for (const u of [0.25, 0.75]) {
        g.save(); g.translate(w * u, h * 0.5);
        g.fillStyle = "#f1d9a8"; g.strokeStyle = "#5a3416"; g.lineWidth = 3.5;
        g.beginPath(); g.ellipse(0, 0, 26, 34, 0.25, 0, Math.PI * 2); g.fill(); g.stroke();
        g.fillStyle = "#5a3416"; for (const [x, y] of [[-6, -8], [8, -4], [-2, 12]]) { g.beginPath(); g.arc(x, y, 2.2, 0, Math.PI * 2); g.fill(); }
        g.restore();
      }
    });
    sleeveT.wrapS = THREE.RepeatWrapping; sleeveT.offset.x = 0.0;
    mesh(new THREE.CylinderGeometry(R, Rb, H, 28), mat("#fbfaf4", { roughness: 0.6 }), P.whole, 0, H / 2, 0);
    const sl = mesh(new THREE.CylinderGeometry(R * 0.93 + 0.004, Rb + (R - Rb) * 0.3 + 0.004, H * 0.46, 28, 1, true), mat("#ffffff", { map: sleeveT, roughness: 0.85 }), P.whole, 0, H * 0.47, 0);
    sl.rotation.y = -Math.PI / 2;   // the logo to the front (+z)
    const lid = mat("#f8f7f2", { roughness: 0.45 });
    mesh(new THREE.CylinderGeometry(R + 0.004, R + 0.004, 0.01, 28), lid, P.whole, 0, H + 0.004, 0);
    mesh(new THREE.CylinderGeometry(R * 0.86, R + 0.002, 0.014, 28), lid, P.whole, 0, H + 0.015, 0);
    mesh(new THREE.BoxGeometry(0.016, 0.004, 0.007), mat("#3a2418"), P.whole, 0, H + 0.023, R * 0.6);   // the sip hole
    return { grip: 0.06 };
  },

  cuptray(P) {
    const pulp = mat("#c9bfae", { roughness: 0.95 }), T = COFFEE.tray, A = 0.25;
    // a moulded pulp carrier: a flat base, four round wells, a raised cross in the middle with a finger hole
    mesh(new THREE.BoxGeometry(A, 0.012, A), pulp, P.whole, 0, 0.006, 0);
    for (const x of [-T, T]) for (const z of [-T, T]) {
      const w = mesh(new THREE.CylinderGeometry(0.05, 0.046, 0.03, 20, 1, true), pulp, P.whole, x, 0.022, z);
      w.material = pulp;
    }
    mesh(new THREE.BoxGeometry(A * 0.94, 0.05, 0.024), pulp, P.whole, 0, 0.034, 0);
    mesh(new THREE.BoxGeometry(0.024, 0.05, A * 0.94), pulp, P.whole, 0, 0.034, 0);
    mesh(new THREE.BoxGeometry(0.06, 0.04, 0.03), pulp, P.whole, 0, 0.07, 0);
    return { grip: 0 };
  },

  milkbottle(P) {
    const { r: R, h: H } = COFFEE.milk;
    const label = canvasTex(256, 96, (g, w, h) => {
      g.fillStyle = "#ffffff"; g.fillRect(0, 0, w, h);
      g.fillStyle = "#2d6fc4"; g.fillRect(0, 0, w, 10); g.fillRect(0, h - 10, w, 10);
      // a little cow face on the front (u 0.25)
      g.save(); g.translate(w * 0.25, h * 0.52);
      g.fillStyle = "#ffffff"; g.strokeStyle = "#222"; g.lineWidth = 3; g.beginPath(); g.ellipse(0, 0, 22, 20, 0, 0, Math.PI * 2); g.fill(); g.stroke();
      g.fillStyle = "#222"; g.beginPath(); g.ellipse(-9, -8, 8, 6, 0.4, 0, Math.PI * 2); g.fill();
      g.fillStyle = "#f2a7b8"; g.beginPath(); g.ellipse(0, 9, 13, 8, 0, 0, Math.PI * 2); g.fill(); g.stroke();
      g.fillStyle = "#222"; for (const x of [-6, 6]) { g.beginPath(); g.arc(x, -3, 2.5, 0, Math.PI * 2); g.fill(); }
      g.restore();
    });
    const milk = mat("#fbfbf6", { roughness: 0.35 });
    const pts = [[0, 0], [R, 0], [R, H * 0.6], [R * 0.55, H * 0.82], [R * 0.45, H * 0.95], [R * 0.48, H]].map(([x, y]) => new THREE.Vector2(x, y));
    mesh(new THREE.LatheGeometry(pts, 24), milk, P.whole);
    const lb = mesh(new THREE.CylinderGeometry(R + 0.002, R + 0.002, H * 0.32, 24, 1, true), mat("#ffffff", { map: label, roughness: 0.6 }), P.whole, 0, H * 0.3, 0);
    lb.rotation.y = -Math.PI / 2;
    mesh(new THREE.CylinderGeometry(R * 0.5, R * 0.5, 0.018, 18), mat("#d23a32", { roughness: 0.4 }), P.whole, 0, H + 0.006, 0);
    return { grip: H * 0.45 };
  },

  milkpour(P) {
    const S = P.spec, Y = S.lip ?? 0.25;
    const m = new THREE.MeshStandardMaterial({ color: "#fdfdf8", roughness: 0.25, emissive: new THREE.Color("#555550"), emissiveIntensity: 0.2 }); m.userData.noHatch = true;
    const stream = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.007, 1, 8, 1, true), m); stream.userData.solid = false; stream.castShadow = false; P.whole.add(stream);
    return {
      grip: 0,
      apply(ps, t) {
        const pr = clamp(ps.pour ?? 0), len = Math.max(0.001, Y * pr);
        stream.visible = pr > 0.01 && (ps.stop ?? 0) < 0.5;
        stream.scale.set(1 + 0.15 * Math.sin((t ?? 0) * 31), len, 1); stream.position.y = -len / 2;
      },
    };
  },

  kitchentable(P) {
    const S = P.spec, W = S.w ?? 1.1, D = S.d ?? 0.5, H = S.h ?? 0.42;
    const wood = mat("#b7773f", { roughness: 0.55 }), legM = mat("#8c5629", { roughness: 0.6 });
    const grain = canvasTex(512, 256, (g, w, h) => {
      g.fillStyle = "#c08048"; g.fillRect(0, 0, w, h);
      const r = rng(5); for (let i = 0; i < 70; i++) { g.strokeStyle = `rgba(110,60,25,${0.08 + r() * 0.12})`; g.lineWidth = 1 + r() * 2; g.beginPath(); const y = r() * h; g.moveTo(0, y); g.bezierCurveTo(w * 0.3, y + (r() - 0.5) * 12, w * 0.7, y + (r() - 0.5) * 12, w, y + (r() - 0.5) * 8); g.stroke(); }
      for (let i = 1; i < 4; i++) { g.fillStyle = "rgba(80,40,15,0.35)"; g.fillRect(0, (h * i) / 4, w, 2); }
    });
    mesh(new THREE.BoxGeometry(W, 0.045, D), mat("#ffffff", { map: grain, roughness: 0.5 }), P.whole, 0, H - 0.0225, 0);
    for (const x of [-1, 1]) for (const z of [-1, 1]) mesh(new THREE.CylinderGeometry(0.028, 0.022, H - 0.045, 10), legM, P.whole, x * (W / 2 - 0.07), (H - 0.045) / 2, z * (D / 2 - 0.06));
    mesh(new THREE.BoxGeometry(W - 0.12, 0.06, 0.02), wood, P.whole, 0, H - 0.075, D / 2 - 0.06);
    // the red-checked runner down its length, hanging a little over each end
    const check = canvasTex(256, 256, (g, w, h) => {
      g.fillStyle = "#f4ece0"; g.fillRect(0, 0, w, h);
      g.fillStyle = "rgba(196,42,42,0.55)"; for (let i = 0; i < 8; i += 2) { g.fillRect((i * w) / 8, 0, w / 8, h); g.fillRect(0, (i * h) / 8, w, h / 8); }
    });
    check.wrapS = check.wrapT = THREE.RepeatWrapping; check.repeat.set(3, 1);
    const run = S.runner ?? [W * 0.7, D * 0.55];
    mesh(new THREE.BoxGeometry(run[0], 0.004, run[1]), mat("#ffffff", { map: check, roughness: 0.9 }), P.whole, S.runnerX ?? 0, H + 0.002, 0);
    return { grip: H };
  },

  fruitbowl(P) {
    const wood = mat("#9a5e2c", { roughness: 0.5 }), red = mat("#d8322b", { roughness: 0.35 }), red2 = mat("#b8242a", { roughness: 0.4 }), stem = mat("#5a3b1f"), leaf = mat("#5cbf55");
    const pts = [[0, 0], [0.07, 0], [0.12, 0.03], [0.14, 0.07], [0.13, 0.07], [0.11, 0.035], [0.065, 0.012], [0, 0.012]].map(([x, y]) => new THREE.Vector2(x, y));
    mesh(new THREE.LatheGeometry(pts, 28), wood, P.whole);
    const r = rng(9);
    for (const [x, z, y] of [[-0.05, 0.02, 0.06], [0.055, 0.03, 0.06], [0.0, -0.05, 0.06], [0.01, 0.01, 0.13]]) {
      const a = mesh(new THREE.SphereGeometry(0.05, 18, 14), r() < 0.5 ? red : red2, P.whole, x, y, z); a.scale.y = 0.9;
      mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.025, 6), stem, P.whole, x, y + 0.055, z).rotation.z = 0.3;
      if (r() < 0.6) { const l = mesh(new THREE.SphereGeometry(0.014, 8, 6), leaf, P.whole, x + 0.012, y + 0.06, z); l.scale.set(1.4, 0.3, 0.7); }
    }
    return { grip: 0 };
  },

  kitchencounter(P) {
    const S = P.spec, W = S.w ?? 1.4, D = S.d ?? 0.55, H = S.h ?? 0.5;
    const cream = mat("#efe3c8", { roughness: 0.6 }), top = mat("#c38a52", { roughness: 0.45 }), knob = mat("#8a6a45", { roughness: 0.4 });
    mesh(new THREE.BoxGeometry(W, H - 0.04, D - 0.03), cream, P.whole, 0, (H - 0.04) / 2, -0.015);
    mesh(new THREE.BoxGeometry(W + 0.03, 0.04, D + 0.02), top, P.whole, 0, H - 0.02, 0);
    const n = Math.max(1, Math.round(W / 0.45));
    for (let i = 0; i < n; i++) {
      const x = -W / 2 + (W / n) * (i + 0.5);
      const pn = mesh(new THREE.BoxGeometry(W / n - 0.03, H - 0.12, 0.012), mat("#f5ecd6", { roughness: 0.55 }), P.whole, x, (H - 0.04) / 2 + 0.01, D / 2 - 0.02);
      pn.userData.solid = false;
      mesh(new THREE.SphereGeometry(0.014, 10, 8), knob, P.whole, x + (i % 2 ? -1 : 1) * (W / n / 2 - 0.06), H - 0.14, D / 2 - 0.005).userData.solid = false;
    }
    // the moka pot, a little radio, a jar of wooden spoons (dressing, at spec.items x offsets)
    const steel = mat("#b9bec4", { roughness: 0.25, metalness: 0.7 });
    const mx = S.moka ?? W / 2 - 0.2;
    mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.09, 8), steel, P.whole, mx, H + 0.045, -0.05);
    mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.08, 8), steel, P.whole, mx, H + 0.13, -0.05);
    mesh(new THREE.ConeGeometry(0.035, 0.03, 8), mat("#222"), P.whole, mx, H + 0.185, -0.05);
    const rx = S.radio ?? -W / 2 + 0.25;
    mesh(new THREE.BoxGeometry(0.2, 0.12, 0.08), mat("#5f9c8e", { roughness: 0.5 }), P.whole, rx, H + 0.06, -0.12);
    mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.01, 16), mat("#e8e0cc"), P.whole, rx - 0.05, H + 0.06, -0.075).rotation.x = Math.PI / 2;
    const jx = S.spoons ?? 0;
    mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.12, 14), mat("#d9c9a8", { roughness: 0.4 }), P.whole, jx, H + 0.06, -0.1);
    for (let i = 0; i < 3; i++) { const sp = mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.2, 6), mat("#a87444"), P.whole, jx + (i - 1) * 0.015, H + 0.16, -0.1); sp.rotation.z = (i - 1) * 0.2; }
    return { grip: H };
  },

  wrapscarf(P) {
    const S = P.spec, Y = 0, RX = S.rx ?? 0.4, RZ = S.rz ?? 0.37, TH = S.th ?? 0.05, C = S.color ?? "#7d3fb8";
    const knit = canvasTex(256, 64, (g, w, h) => {
      g.fillStyle = C; g.fillRect(0, 0, w, h);
      for (let x = 0; x < w; x += 8) { g.fillStyle = "rgba(0,0,0,0.16)"; g.fillRect(x, 0, 3, h); g.fillStyle = "rgba(255,255,255,0.08)"; g.fillRect(x + 4, 0, 2, h); }
    });
    knit.wrapS = knit.wrapT = THREE.RepeatWrapping;
    const m = mat("#ffffff", { map: knit, roughness: 0.95 });
    // the wrap: a fat soft ring round the body, a little lower at the front
    const ring = new THREE.TorusGeometry(1, TH, 10, 40); ring.rotateX(Math.PI / 2);
    const p = ring.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); p.setXYZ(i, x * RX, p.getY(i) * 1 - 0.03 * Math.max(0, z), z * RZ); }
    ring.computeVertexNormals();
    mesh(ring, m, P.whole, 0, Y, 0);
    // the knot at the front right, and two ends hanging down over the chest
    const kx = RX * 0.45, kz = RZ * 0.92;
    mesh(new THREE.SphereGeometry(TH * 1.35, 14, 10), m, P.whole, kx, Y - 0.03, kz).scale.set(1.2, 0.9, 0.8);
    for (const [dx, len, sw] of [[-0.03, 0.2, -0.12], [0.035, 0.16, 0.1]]) {
      const tail = new THREE.BoxGeometry(0.075, len, 0.022, 2, 6, 1); tail.translate(0, -len / 2, 0);
      const tp = tail.attributes.position;
      for (let i = 0; i < tp.count; i++) { const v = -tp.getY(i) / len; tp.setZ(i, tp.getZ(i) + 0.05 * v * v); }
      tail.computeVertexNormals();
      const o = mesh(tail, m, P.whole, kx + dx, Y - 0.05, kz + 0.02); o.rotation.z = sw;
      // the fringe
      for (let f = 0; f < 4; f++) { const fr = mesh(new THREE.CylinderGeometry(0.005, 0.004, 0.035, 5), m, o, -0.027 + f * 0.018, -len - 0.016, 0.05 + 0.005); fr.castShadow = false; }
    }
    return { grip: 0 };
  },

  plankfloor(P) {
    const S = P.spec, W = S.w ?? 8, D = S.d ?? 8;
    const t = canvasTex(512, 512, (g, w, h) => {
      const r = rng(4);
      const rows = 10;
      for (let i = 0; i < rows; i++) {
        let x = -r() * w * 0.5;
        while (x < w) {
          const len = w * (0.35 + r() * 0.5), c = 150 + Math.floor(r() * 30);
          g.fillStyle = `rgb(${c + 40},${c - 5},${c - 60})`; g.fillRect(x, (i * h) / rows, len, h / rows);
          g.strokeStyle = "rgba(70,40,15,0.5)"; g.lineWidth = 2; g.strokeRect(x, (i * h) / rows, len, h / rows);
          for (let k = 0; k < 4; k++) { g.strokeStyle = `rgba(90,50,20,${0.08 + r() * 0.1})`; g.lineWidth = 1; g.beginPath(); const y = (i + 0.2 + r() * 0.6) * (h / rows); g.moveTo(x, y); g.lineTo(x + len, y + (r() - 0.5) * 4); g.stroke(); }
          x += len;
        }
      }
    });
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(W / 2.4, D / 2.4);
    const o = mesh(new THREE.PlaneGeometry(W, D), mat("#ffffff", { map: t, roughness: 0.6 }), P.whole, 0, 0.002, 0);
    o.rotation.x = -Math.PI / 2; o.castShadow = false; o.userData.solid = false;
    return { grip: 0 };
  },
};

// merge plane geometries (non-indexed is fine: a few hundred quads)
function mergeGeos(list) {
  const pos = [], uv = [], nor = [];
  for (const g0 of list) {
    const g = g0.index ? g0.toNonIndexed() : g0;
    pos.push(...g.attributes.position.array); uv.push(...g.attributes.uv.array); nor.push(...g.attributes.normal.array);
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  out.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  return out;
}
