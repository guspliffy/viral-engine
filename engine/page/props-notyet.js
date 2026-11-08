import * as THREE from "three";
import { clamp, rng } from "./util.js";
import { radialTexture } from "./geo.js";
import { scythe } from "./costumes-pb.js";
import { staff } from "./costumes.js";

// Props for "Not Yet" (Jonny's GTA VI countdown storyboard, 1 Nov 2026). One module per clip, so parallel clips never
// edit the same prop file (props3d.js merges NOTYET_KINDS). Nothing here carries lettering, numbers or game marks.
//   magicshield  the Wizard's shield spell: an upright glowing blue oval (local xy plane, facing +z), a bright rim and a
//                faint hex weave. glow 0..1 fades it in; burst 0..1 is the flash of a hit (tween up and back);
//                crack 0..1 draws one bright crack across it (it grows from the hit point, upper left, outward).
//                spec.r: its half height (default 0.5)
//   wallcalendar a paper wall calendar with a spiral top: a blank grid and ONE cell circled in red, no letters or
//                numbers. Origin: its bottom centre; the picture is on its -z face (held with the phone hold it faces
//                away from the holder; on a wall turn it rot 180). CALENDAR has its size.
//   countcalendar the same calendar with red X's on the first spec.xs cells and a black skull (rise 0..1) and flame
//                (puff 0..1) drawn in the cell after the circle (Death waits for GTA 6, ep 2). Drawn at 4x for inserts.
//   gamepad      a small plain game controller lying flat (two grips, two sticks, four grey buttons, no marks). Origin
//                its bottom centre, the grips along x. spec.color
//   sidelamp     a small side cabinet with a table lamp on it (lit: a warm bulb light). smash 0..1: the lamp is hit,
//                topples off the cabinet toward -x and lies on the floor, the shade off, the light out.
//   wallshelf    a short wall shelf on two brackets with books and a little pot. Origin: the plank's middle at the wall
//                (spec.y its height above the floor). smash 0..1: the right bracket gives, the plank swings down from its
//                left end and the books and pot fall to the floor and lie there.
//   doorway      a door casing on the wall with bright daylight behind it (put a "frontdoor" leaf in it, swinging
//                out). spec.w, spec.h. Origin: the bottom middle of the opening.
//   spellbolt    the Wizard's wild bolt: a hot pink-violet head with a short trail, flying from spec.from to spec.to
//                (offsets from the prop's position). rise 0..1 is the flight (tween it linearly); hidden at 0 and 1.
//   flattv       a low TV bench with a flat screen showing only a plain blue-white glow (no picture). glow 0..1.
//   stuffing     a few white tufts of sofa stuffing poking out (spec.at: [[x, y, z], ...] offsets). puff 0..1 grows them.
//   floorlamp    a tall standing lamp, lit: a warm shade and a soft painted glow round it (the toon look ignores point
//                lights, so the warm pool is a sprite). spec.glow 0..1 (default 1).
//   debris       wreckage lying on the floor (spec.items: [[x, z, type, rotDeg, size]], type plank | chip | tuft |
//                plaster | shard); puff 0..1 shows it (default spec.puff ?? 1), so it can appear on the frame it lands.
//   dustmotes    dust hanging in the air, lit warm: spec.n specks in a box spec.box [w, h, d] round the prop's origin,
//                drifting slowly (a pure function of time). burst 0..1 thickens them (after an impact), puff 0..1
//                sinks them toward the floor (the end).
//   lightbeam    a soft shaft of light (additive, painted): from the prop's origin along local -z, spec.len long, spec.w
//                wide at the far end, spec.color; glow 0..1.
//   wallart      a framed painting on a wall (local xy plane, facing +z): spec.w x spec.h, spec.scene "hills" | "sea" |
//                "forest", spec.frame colour. No letters.
//   wallclock    a round wall clock with tick marks and two hands (no numbers), facing +z. spec.r.
//   clutter      lived-in bits on the floor or a top: spec.items [[x, z, type, rotDeg, y?]], type books | mug | can |
//                basket | console | cable | slippers | box. Plain, no marks.
//   sofarips     torn holes in a sofa's cover (decals laid on its surfaces, offsets from the prop's origin): spec.at
//                [[x, y, z, face, size, spin]], face "front" (+z) | "up" (+y) | "left" (-x) | "right" (+x). Each is a
//                ragged hole: frayed lighter fabric round a dark rim, pale foam inside with stuffing bulging out.
//                puff 0..1 tears them open (they grow from the middle). spec.cover: the sofa's colour for the frayed edge.
//   sofatape     grey duct-tape patches stuck over tears in a sofa's cover (Death waits for GTA 6, ep 2: the patched sofa
//                in Jonny's panels): two crossed strips with torn ends, laid like sofarips (spec.at [[x, y, z, face,
//                size, spin]], offsets from the prop's origin, face "front" | "up" | "left" | "right").
//   parkedscythe Reaper's costume scythe as a loose prop (his own is left home: noProp). Origin: where his fist holds it.
//   parkedstaff  the Wizard's costume staff as a loose prop. Origin: where his fist holds it.
export const CALENDAR = { w: 0.26, h: 0.34, t: 0.008 };
export const PAD = { w: 0.17, h: 0.045, d: 0.1 };

const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...o });
const glowM = (o) => { const m = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, ...o }); m.userData.noOutline = true; m.userData.outlineParameters = { visible: false }; return m; };
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
function canvasTex(w, h, draw) { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
// sprites need a SpriteMaterial to face the camera (a MeshBasicMaterial draws a flat quad facing +z, unseen from behind)
const spriteM = (o) => { const m = new THREE.SpriteMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, ...o }); m.userData.noOutline = true; m.userData.outlineParameters = { visible: false }; return m; };
// a soft painted glow (additive sprite): lamps and screens read as lit in the toon look, which ignores point lights
function halo(parent, color, size, opacity, x = 0, y = 0, z = 0) {
  const c = new THREE.Color(color), rgb = `${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)}`;
  const m = spriteM({ map: radialTexture([[0, `rgba(${rgb},1)`], [0.35, `rgba(${rgb},0.45)`], [1, `rgba(${rgb},0)`]]), opacity });
  const sp = new THREE.Sprite(m); sp.scale.setScalar(size); sp.position.set(x, y, z); sp.renderOrder = 4; parent.add(sp); return sp;
}
const smooth = (x) => { const k = clamp(x); return k * k * (3 - 2 * k); };

export const NOTYET_KINDS = {
  magicshield(P) {
    const R = P.spec.r ?? 0.5, rnd = rng(31);
    // the face: a soft blue body, a brighter rim, a faint hex weave
    const face = canvasTex(256, 256, (g, w, h) => {
      const gr = g.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w / 2);
      gr.addColorStop(0, "rgba(120,185,255,0.42)"); gr.addColorStop(0.72, "rgba(90,160,255,0.55)"); gr.addColorStop(0.9, "rgba(225,245,255,1)"); gr.addColorStop(1, "rgba(200,235,255,0)");
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.strokeStyle = "rgba(230,245,255,0.55)"; g.lineWidth = 2;
      for (let r = 0; r < 12; r++) for (let q = 0; q < 12; q++) {
        const cx = q * 24 + (r % 2) * 12, cy = r * 21; g.beginPath();
        for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + Math.PI / 6; g[i ? "lineTo" : "moveTo"](cx + 11 * Math.cos(a), cy + 11 * Math.sin(a)); }
        g.closePath(); g.stroke();
      }
    });
    const crackT = canvasTex(256, 256, (g, w, h) => {
      // a crack network from the hit point (upper left): a main crack to the lower right, branches off it and a small
      // web round the hit, drawn as a soft blue glow under a white core (spec.web false: just the main crack)
      const walk = (x, y, ang, n, step) => { const p = [[x, y]]; for (let i = 0; i < n; i++) { ang += (rnd() - 0.5) * 0.7; x += Math.cos(ang) * step; y += Math.sin(ang) * step; p.push([x, y]); } return p; };
      const main = walk(70, 52, 0.85, 9, 21), lines = [main];
      if (P.spec.web !== false) {
        for (const k of [2, 4, 6, 7]) lines.push(walk(...main[k], 0.85 + (rnd() < 0.5 ? -1 : 1) * (0.7 + rnd() * 0.5), 3 + Math.floor(rnd() * 3), 16));
        for (let i = 0; i < 6; i++) lines.push(walk(70, 52, (i / 6) * Math.PI * 2 + rnd() * 0.5, 2, 14));
      }
      for (const [lw, col] of [[10, "rgba(150,210,255,0.55)"], [3.5, "rgba(255,255,255,1)"]]) {
        g.strokeStyle = col; g.lineJoin = "miter";
        lines.forEach((p, j) => { g.lineWidth = j ? lw * 0.7 : lw; g.beginPath(); p.forEach(([x, y], i) => g[i ? "lineTo" : "moveTo"](x, y)); g.stroke(); });
      }
    });
    const geo = new THREE.CircleGeometry(R, 48); geo.scale(0.72, 1, 1);
    const fm = glowM({ map: face, opacity: 0, side: THREE.DoubleSide, blending: THREE.NormalBlending }), body = mesh(geo, fm, P.whole); body.castShadow = body.receiveShadow = false; body.renderOrder = 5;
    // the crack: revealed from its start outward (a clip of its texture's width), drawn over the face
    const cm = glowM({ map: crackT, opacity: 0, side: THREE.DoubleSide }), crack = mesh(geo.clone(), cm, P.whole, 0, 0, 0.004); crack.castShadow = crack.receiveShadow = false; crack.renderOrder = 6;
    const flashM = glowM({ map: radialTexture([[0, "rgba(255,255,255,1)"], [0.4, "rgba(150,210,255,0.6)"], [1, "rgba(120,190,255,0)"]]), opacity: 0 });
    const flash = new THREE.Sprite(flashM); flash.position.set(-R * 0.35, R * 0.45, 0.02); flash.scale.setScalar(R * 1.4); flash.renderOrder = 7; P.whole.add(flash);
    const light = new THREE.PointLight("#8cc4ff", 0, 3, 1.6); light.position.set(0, 0, 0.3); P.whole.add(light);
    const uv = geo.attributes.uv, cuv = crack.geometry.attributes.uv;
    return {
      grip: 0,
      apply(ps, t = 0) {
        const g = clamp(ps.glow ?? 0), b = clamp(ps.burst ?? 0), k = clamp(ps.crack ?? 0);
        P.whole.visible = g > 0.01;
        fm.opacity = g * (0.85 + 0.15 * Math.sin(t * 9)); light.intensity = g * (1.2 + 3 * b);
        flashM.opacity = b; flash.scale.setScalar(R * (1.0 + 0.9 * b));
        // the crack reveals along its diagonal: texels past the front are pushed off the texture (clamped, blank edge)
        cm.opacity = k > 0.01 ? g : 0;
        for (let i = 0; i < cuv.count; i++) { const u = uv.getX(i), v = uv.getY(i), d = (u + (1 - v)) / 2; cuv.setXY(i, d <= 0.2 + 0.75 * k ? u : -1, v); }
        cuv.needsUpdate = true;
      },
    };
  },

  wallcalendar(P) {
    const { w: W, h: H, t: T } = CALENDAR;
    const page = canvasTex(260, 340, (g, w, h) => {
      g.fillStyle = "#fbf8f1"; g.fillRect(0, 0, w, h);
      g.fillStyle = "#e9e2d3"; g.fillRect(0, 0, w, 58);   // the blank header band (no month name)
      g.strokeStyle = "#9a978f"; g.lineWidth = 2.2;
      const x0 = 16, y0 = 76, cw = (w - 32) / 7, ch = (h - y0 - 16) / 5;
      for (let i = 0; i <= 7; i++) { g.beginPath(); g.moveTo(x0 + i * cw, y0); g.lineTo(x0 + i * cw, y0 + 5 * ch); g.stroke(); }
      for (let j = 0; j <= 5; j++) { g.beginPath(); g.moveTo(x0, y0 + j * ch); g.lineTo(x0 + 7 * cw, y0 + j * ch); g.stroke(); }
      // ONE cell circled in red, a hand-drawn loop that overshoots its start
      const cx = x0 + 4.5 * cw, cy = y0 + 2.5 * ch;
      g.strokeStyle = "#e0262b"; g.lineWidth = 7; g.lineCap = "round"; g.beginPath();
      for (let i = 0; i <= 40; i++) { const a = -0.6 + (i / 40) * Math.PI * 2.25, r = 1 + 0.08 * Math.sin(a * 3); g[i ? "lineTo" : "moveTo"](cx + cw * 0.62 * r * Math.cos(a), cy + ch * 0.6 * r * Math.sin(a)); }
      g.stroke();
    });
    const paper = mat("#f2eee4", { roughness: 0.9 });
    const sheet = mesh(new THREE.BoxGeometry(W, H, T), paper, P.whole, 0, H / 2, 0);
    const front = mesh(new THREE.PlaneGeometry(W - 0.004, H - 0.004), new THREE.MeshStandardMaterial({ map: page, roughness: 0.85 }), P.whole, 0, H / 2, -T / 2 - 0.001);
    front.rotation.y = Math.PI; front.castShadow = false; sheet.castShadow = true;
    // the spiral binding along the top: small grey loops
    const wire = mat("#8b8d93", { roughness: 0.35, metalness: 0.6 });
    for (let i = 0; i < 9; i++) { const l = mesh(new THREE.TorusGeometry(0.011, 0.0025, 6, 12), wire, P.whole, -W / 2 + 0.025 + i * ((W - 0.05) / 8), H + 0.002, 0); l.rotation.y = Math.PI / 2; l.castShadow = false; }
    return { grip: H / 2 };
  },

  // countcalendar (Death waits for GTA 6, episode 2, 8 Nov 2026): the same calendar a week later, lying or hanging,
  // drawn at 4x for a close insert. spec.xs: the first xs cells carry a red X (the days that have passed); the circle
  // sits on cell spec.circle (default 18, the wall calendar's). A black marker skull in the cell after the circle
  // draws itself stroke by stroke as `rise` goes 0..1 (the head, the eyes, the nose, the teeth), and a little flame
  // beside it with `puff` 0..1. No letters or numbers.
  countcalendar(P) {
    const { w: W, h: H, t: T } = CALENDAR, K = 4, CW = 260 * K, CH = 340 * K, xs = P.spec.xs ?? 0, circ = P.spec.circle ?? 18;
    const cv = document.createElement("canvas"); cv.width = CW; cv.height = CH;
    const g = cv.getContext("2d"), page = new THREE.CanvasTexture(cv); page.colorSpace = THREE.SRGBColorSpace; page.anisotropy = 8;
    const x0 = 16 * K, y0 = 76 * K, cw = (CW - 32 * K) / 7, ch = (CH - y0 - 16 * K) / 5;
    const cell = (i) => [x0 + (i % 7) * cw, y0 + Math.floor(i / 7) * ch];
    const rnd = rng(P.spec.seed ?? 19);
    // the hand-drawn wobble of each X, fixed once so it never changes from frame to frame
    const wob = Array.from({ length: 35 }, () => [0, 1, 2, 3].map(() => (rnd() - 0.5) * 0.12));
    // a stroke drawn up to share k (0..1) of its length: pts in cell units round the skull's middle
    const part = (pts, k, cx, cy, s) => {
      if (k <= 0) return; const n = pts.length - 1, m = k * n; g.beginPath();
      for (let i = 0; i <= Math.min(n, Math.ceil(m)); i++) {
        const f = Math.min(1, m - (i - 1)), [ax, ay] = pts[Math.max(0, i - 1)], [bx, by] = pts[i];
        const x = i ? ax + (bx - ax) * f : bx, y = i ? ay + (by - ay) * f : by;
        g[i ? "lineTo" : "moveTo"](cx + x * s, cy + y * s);
      }
      g.stroke();
    };
    const ring = (rx, ry, oy, a0 = -1.9, turns = 1.05, n = 36) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + (i / n) * Math.PI * 2 * turns; return [rx * Math.cos(a), oy + ry * Math.sin(a)]; });
    let key = "";
    const draw = (rise, puff) => {
      g.fillStyle = "#fbf8f1"; g.fillRect(0, 0, CW, CH);
      g.fillStyle = "#e9e2d3"; g.fillRect(0, 0, CW, 58 * K);   // the blank header band (no month name)
      g.strokeStyle = "#9a978f"; g.lineWidth = 2.2 * K; g.lineCap = "butt";
      for (let i = 0; i <= 7; i++) { g.beginPath(); g.moveTo(x0 + i * cw, y0); g.lineTo(x0 + i * cw, y0 + 5 * ch); g.stroke(); }
      for (let j = 0; j <= 5; j++) { g.beginPath(); g.moveTo(x0, y0 + j * ch); g.lineTo(x0 + 7 * cw, y0 + j * ch); g.stroke(); }
      // the days gone: a red X in each, a little uneven
      g.strokeStyle = "#d8282d"; g.lineWidth = 4.5 * K; g.lineCap = "round";
      for (let i = 0; i < Math.min(xs, circ); i++) {
        const [x, y] = cell(i), q = wob[i], m = 0.2;
        g.beginPath(); g.moveTo(x + cw * (m + q[0]), y + ch * (m + q[1])); g.lineTo(x + cw * (1 - m + q[2]), y + ch * (1 - m + q[3])); g.stroke();
        g.beginPath(); g.moveTo(x + cw * (1 - m + q[1]), y + ch * (m + q[0])); g.lineTo(x + cw * (m + q[3]), y + ch * (1 - m + q[2])); g.stroke();
      }
      // launch day, circled in red (the wall calendar's loop)
      { const [x, y] = cell(circ), cx = x + cw / 2, cy = y + ch / 2; g.lineWidth = 7 * K; g.beginPath();
        for (let i = 0; i <= 40; i++) { const a = -0.6 + (i / 40) * Math.PI * 2.25, r = 1 + 0.08 * Math.sin(a * 3); g[i ? "lineTo" : "moveTo"](cx + cw * 0.62 * r * Math.cos(a), cy + ch * 0.6 * r * Math.sin(a)); }
        g.stroke(); }
      // the skull in the next cell: a big, quick black marker drawing that spills over the cell's lines
      if (rise > 0) {
        const [x, y] = cell(circ + 1), cx = x + cw / 2, cy = y + ch * 0.5, s = cw * 0.62;
        g.strokeStyle = "#16141a"; g.fillStyle = "#16141a"; g.lineWidth = 5.5 * K; g.lineJoin = "round";
        const seg = (a, b) => clamp((rise - a) / (b - a));
        part(ring(0.62, 0.56, -0.12), seg(0, 0.42), cx, cy, s);                                         // the cranium
        part([[-0.4, 0.3], [-0.36, 0.62], [0.36, 0.62], [0.4, 0.3]], seg(0.42, 0.58), cx, cy, s);           // the jaw
        for (const [ex, a, b] of [[-0.24, 0.58, 0.7], [0.24, 0.7, 0.82]]) {                                 // the eyes, filled in
          const k = seg(a, b); if (k > 0) { g.beginPath(); g.ellipse(cx + ex * s, cy - 0.08 * s, 0.17 * s * k, 0.19 * s * k, 0, 0, Math.PI * 2); g.fill(); }
        }
        part([[-0.05, 0.2], [0, 0.1], [0.05, 0.2]], seg(0.82, 0.88), cx, cy, s);                          // the nose
        for (let i = 0; i < 3; i++) part([[-0.18 + i * 0.18, 0.4], [-0.18 + i * 0.18, 0.6]], seg(0.88 + i * 0.04, 0.92 + i * 0.04), cx, cy, s);   // the teeth
      }
      // a little flame beside it: Phoenix's mark
      if (puff > 0) {
        const [x, y] = cell(circ + 1), fx = x + cw * 1.42, fy = y + ch * 0.88, s = cw * 0.8;   // in the next cell, apart from the skull
        const F = [[0, 0], [-0.32, -0.25], [-0.2, -0.62], [-0.05, -0.42], [0.04, -0.9], [0.3, -0.45], [0.32, -0.15], [0, 0]];
        g.strokeStyle = "#16141a"; g.fillStyle = "#16141a"; g.lineWidth = 5.5 * K;
        part(F, puff, fx, fy, s);
        if (puff >= 1) { g.beginPath(); F.forEach(([u, v], i) => g[i ? "lineTo" : "moveTo"](fx + u * s, fy + v * s)); g.fill(); }   // filled in: it reads at phone size
      }
      page.needsUpdate = true;
    };
    draw(0, 0);
    const paper = mat("#f2eee4", { roughness: 0.9 });
    const sheet = mesh(new THREE.BoxGeometry(W, H, T), paper, P.whole, 0, H / 2, 0);
    const front = mesh(new THREE.PlaneGeometry(W - 0.004, H - 0.004), new THREE.MeshStandardMaterial({ map: page, roughness: 0.85 }), P.whole, 0, H / 2, -T / 2 - 0.001);
    front.rotation.y = Math.PI; front.castShadow = false; sheet.castShadow = true;
    const wire = mat("#8b8d93", { roughness: 0.35, metalness: 0.6 });
    for (let i = 0; i < 9; i++) { const l = mesh(new THREE.TorusGeometry(0.011, 0.0025, 6, 12), wire, P.whole, -W / 2 + 0.025 + i * ((W - 0.05) / 8), H + 0.002, 0); l.rotation.y = Math.PI / 2; l.castShadow = false; }
    return { grip: H / 2, apply(ps) { const r = Math.round(clamp(ps.rise ?? 0) * 200) / 200, f = Math.round(clamp(ps.puff ?? 0) * 200) / 200, k = `${r}|${f}`; if (k !== key) { key = k; draw(r, f); } } };
  },

  gamepad(P) {
    const body = mat(P.spec.color || "#f1f2f4", { roughness: 0.45 }), dark = mat(P.spec.dark || "#2b2d33", { roughness: 0.5 }), btn = mat("#9aa0aa", { roughness: 0.4 });
    const { w: W, h: Hh, d: D } = PAD;
    if (P.spec.style === "xbox") {
      // a white Xbox One-style pad (no logo): a broad rounded body, two grips sweeping back and down, the left stick
      // high and the d-pad low on the left, the right stick low and four coloured face buttons high on the right, a
      // plain round button in the middle and two bumpers along the top edge
      const mid = mesh(new THREE.CapsuleGeometry(D * 0.4, W * 0.4, 8, 20), body, P.whole, 0, Hh / 2, -0.004); mid.rotation.z = Math.PI / 2; mid.scale.set(1, 1, 0.62);
      for (const s of [-1, 1]) { const gr = mesh(new THREE.CapsuleGeometry(0.026, 0.05, 8, 14), body, P.whole, s * W * 0.34, Hh / 2 - 0.006, 0.03); gr.rotation.x = Math.PI / 2; gr.rotation.y = s * 0.55; gr.scale.set(1, 1, 0.78); }
      for (const s of [-1, 1]) { const bp = mesh(new THREE.CapsuleGeometry(0.008, 0.045, 4, 8), body, P.whole, s * W * 0.26, Hh * 0.75, -D * 0.4); bp.rotation.z = Math.PI / 2 + s * 0.3; }
      for (const [x, z] of [[-0.045, -0.012], [0.025, 0.016]]) { const st = mesh(new THREE.CylinderGeometry(0.012, 0.013, 0.014, 16), dark, P.whole, x, Hh + 0.005, z); st.castShadow = false; }
      for (const [x, z, c] of [[0.058, 0.004, "#5fae4e"], [0.07, -0.008, "#d84a3a"], [0.046, -0.008, "#3f7ad0"], [0.058, -0.02, "#e8c23a"]]) { const b = mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.006, 10), mat(c, { roughness: 0.35 }), P.whole, x, Hh + 0.002, z); b.castShadow = false; }
      for (const [w, d] of [[0.024, 0.008], [0.008, 0.024]]) { const dp = mesh(new THREE.BoxGeometry(w, 0.006, d), dark, P.whole, -0.025, Hh + 0.002, 0.016); dp.castShadow = false; }
      const home = mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.004, 14), mat("#d9dce2", { roughness: 0.3 }), P.whole, 0, Hh + 0.003, -0.022); home.castShadow = false;
      return { grip: Hh / 2 };
    }
    const mid = mesh(new THREE.CapsuleGeometry(D * 0.36, W * 0.42, 6, 16), body, P.whole, 0, Hh / 2, -0.005); mid.rotation.z = Math.PI / 2; mid.scale.set(1, 1, 0.5 / 0.72 * 0.9);
    for (const s of [-1, 1]) { const gr = mesh(new THREE.CapsuleGeometry(0.024, 0.045, 6, 12), body, P.whole, s * W * 0.33, Hh / 2 - 0.004, 0.026); gr.rotation.x = Math.PI / 2; gr.rotation.y = s * 0.45; gr.scale.set(1, 1, 0.8); }
    for (const s of [-1, 1]) { const st = mesh(new THREE.CylinderGeometry(0.011, 0.012, 0.012, 14), dark, P.whole, s * 0.03, Hh + 0.004, 0.012); st.castShadow = false; }
    for (const [x, z] of [[0.06, -0.012], [0.072, 0], [0.048, 0], [0.06, 0.012]]) { const b = mesh(new THREE.CylinderGeometry(0.0055, 0.0055, 0.006, 10), btn, P.whole, x, Hh + 0.001, z - 0.006); b.castShadow = false; }
    const pad = mesh(new THREE.BoxGeometry(0.024, 0.006, 0.008), btn, P.whole, -0.06, Hh + 0.001, -0.006); pad.castShadow = false;
    const pad2 = mesh(new THREE.BoxGeometry(0.008, 0.006, 0.024), btn, P.whole, -0.06, Hh + 0.001, -0.006); pad2.castShadow = false;
    return { grip: Hh / 2 };
  },

  sidelamp(P) {
    const wood = mat("#9b6a3f", { roughness: 0.55 }), CW = 0.42, CH = 0.5, CD = 0.34;
    mesh(new THREE.BoxGeometry(CW, CH, CD), wood, P.whole, 0, CH / 2, 0);
    mesh(new THREE.BoxGeometry(CW - 0.06, 0.012, 0.01), mat("#7c5230"), P.whole, 0, CH * 0.55, CD / 2 + 0.004);
    const lamp = new THREE.Group(); P.whole.add(lamp);
    const brass = mat("#c99a3e", { roughness: 0.35, metalness: 0.5 });
    mesh(new THREE.CylinderGeometry(0.07, 0.085, 0.03, 20), brass, lamp, 0, 0.015, 0);
    mesh(new THREE.SphereGeometry(0.075, 18, 14), mat("#5f8fa8", { roughness: 0.35 }), lamp, 0, 0.1, 0).scale.set(1, 1.15, 1);
    mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.18, 8), brass, lamp, 0, 0.26, 0);
    const shadeM = mat("#fff0cf", { side: THREE.DoubleSide, emissive: new THREE.Color("#ffb85a"), emissiveIntensity: 0.6 });
    const shade = mesh(new THREE.CylinderGeometry(0.1, 0.16, 0.18, 24, 1, true), shadeM, P.whole, 0, 0, 0);
    const light = new THREE.PointLight("#ffc77a", 0, 3.5, 1.6); P.whole.add(light);
    const glow = halo(P.whole, "#ffb860", 1.3, 0.55, 0, CH + 0.4, 0.05);
    const rnd = rng(17), shards = Array.from({ length: 6 }, () => { const m = mesh(new THREE.TetrahedronGeometry(0.018 + rnd() * 0.015, 0), mat("#5f8fa8", { roughness: 0.35 }), P.whole); return { m, x: -0.15 - rnd() * 0.45, z: (rnd() - 0.4) * 0.5, r: rnd() * 6 }; });
    return {
      grip: CH,
      apply(ps) {
        const s = clamp(ps.smash ?? 0), k = smooth(s), fall = s * s;
        // the lamp pivots over the cabinet's left edge as it goes, then drops to the floor lying on its side
        lamp.position.set(-0.22 * k - 0.1 * fall, CH * (1 - fall) + 0.07 * fall, 0.04 * k); lamp.rotation.z = k * 1.45;
        shade.position.set(-0.55 * k, CH + 0.37 - (CH + 0.27) * fall + 0.2 * Math.sin(Math.PI * k), 0.15 * k); shade.rotation.set(0.6 * k, 0, 2.2 * k);
        const on = s < 0.04; shadeM.emissiveIntensity = on ? 0.6 : 0.05; light.intensity = on ? 1.2 : 0; light.position.set(0, CH + 0.35, 0.1);
        glow.visible = on || s < 0.1; glow.material.opacity = 0.55 * Math.max(0, 1 - s * 10);
        for (const q of shards) { q.m.visible = s > 0.5; q.m.position.set(q.x * k, 0.012, q.z * k + 0.1); q.m.rotation.set(q.r, q.r * 0.5, 0); }
      },
    };
  },

  wallshelf(P) {
    const Y = P.spec.y ?? 1.5, wood = mat("#b07a48", { roughness: 0.6 }), W = 0.72, D = 0.2;
    const plank = new THREE.Group(); P.whole.add(plank);   // hinged at its left end (x -W/2)
    mesh(new THREE.BoxGeometry(W, 0.03, D), wood, plank, W / 2, 0, D / 2);
    const brk = (x) => { const b = mesh(new THREE.BoxGeometry(0.025, 0.14, 0.02), mat("#5a5048"), P.whole, x, -0.085, 0.012); const s = mesh(new THREE.BoxGeometry(0.025, 0.02, 0.15), mat("#5a5048"), P.whole, x, -0.025, 0.08); return [b, s]; };
    brk(-W / 2 + 0.1); const right = brk(W / 2 - 0.1);
    const cols = ["#d97b5c", "#6f9bc4", "#e8c066", "#8fb37a", "#c48fb0"], rnd = rng(23), items = [];
    let x = 0.06;
    for (let i = 0; i < 5; i++) {
      const bw = 0.04 + rnd() * 0.025, bh = 0.17 + rnd() * 0.07, m = mesh(new THREE.BoxGeometry(bw, bh, 0.14), mat(cols[i], { roughness: 0.7 }), P.whole);
      items.push({ m, x0: -W / 2 + x + bw / 2, y0: 0.015 + bh / 2, z0: D / 2, land: [-0.5 + rnd() * 0.9, 0.07 + rnd() * 0.2], lie: bw / 2, spin: (rnd() - 0.5) * 3, delay: rnd() * 0.15 }); x += bw + 0.006;
    }
    const pot = mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.08, 14), mat("#c9673e"), P.whole);
    items.push({ m: pot, x0: W / 2 - 0.12, y0: 0.055, z0: D / 2, land: [0.35, 0.3], lie: 0.045, spin: 1.4, delay: 0.05, pot: true });
    const leaf = mesh(new THREE.SphereGeometry(0.06, 10, 8), mat("#6aa84f"), pot, 0, 0.07, 0); leaf.scale.set(1, 0.8, 1);
    return {
      grip: 0,
      apply(ps) {
        const s = clamp(ps.smash ?? 0), k = smooth(s / 0.4);
        plank.position.x = -W / 2; plank.children[0].position.x = W / 2; plank.rotation.z = -0.62 * k;
        for (const o of right) o.visible = s < 0.02;
        for (const it of items) {
          const f = clamp((s - it.delay) / (1 - it.delay)), fy = f * f;
          // on the plank until it tips, then a fall to the floor (local y -Y) where it lies on its side
          const px = it.x0 + W / 2, onx = -W / 2 + px * Math.cos(0.62 * k), ony = it.y0 - px * Math.sin(0.62 * k);
          it.m.position.set(onx + (it.land[0] - onx) * f, ony + (-Y + it.lie - ony) * fy, it.z0 + (it.land[1] - it.z0) * f);
          it.m.rotation.set(0, it.spin * f, (it.pot ? 0 : 1.5708) * smooth(f * 1.4) - 0.62 * k * (1 - f));
        }
      },
    };
  },

  doorway(P) {
    const W = P.spec.w ?? 1.0, H = P.spec.h ?? 1.8, trim = mat("#fbf3e4", { roughness: 0.6 });
    const sky = canvasTex(64, 128, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#fff6dc"); gr.addColorStop(0.7, "#ffd79a"); gr.addColorStop(1, "#e9b979"); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
    const back = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshBasicMaterial({ map: sky })); back.position.set(0, H / 2, -0.01); back.material.userData.noOutline = true; P.whole.add(back);
    for (const s of [-1, 1]) mesh(new THREE.BoxGeometry(0.09, H + 0.09, 0.06), trim, P.whole, s * (W / 2 + 0.045), (H + 0.09) / 2, 0.02);
    mesh(new THREE.BoxGeometry(W + 0.18, 0.09, 0.06), trim, P.whole, 0, H + 0.045, 0.02);
    const light = new THREE.PointLight("#ffd79a", 2.2, 4, 1.4); light.position.set(0, H * 0.6, 0.5); P.whole.add(light);
    return { grip: 0 };
  },

  spellbolt(P) {
    const from = new THREE.Vector3(...(P.spec.from || [0, 0, 0])), to = new THREE.Vector3(...(P.spec.to || [1, 0, 0]));
    const tex = radialTexture([[0, "rgba(255,255,255,1)"], [0.25, "rgba(255,140,235,0.9)"], [1, "rgba(170,60,255,0)"]]);
    const head = new THREE.Sprite(glowM({ map: tex })); head.scale.setScalar(0.32); P.whole.add(head);
    const trail = Array.from({ length: 8 }, (_, i) => { const s = new THREE.Sprite(glowM({ map: tex, opacity: 0.8 * (1 - i / 9) })); s.scale.setScalar(0.26 * (1 - i * 0.08)); P.whole.add(s); return s; });
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 10), new THREE.MeshBasicMaterial({ color: "#ffffff" })); core.material.userData.noOutline = true; P.whole.add(core);
    const light = new THREE.PointLight("#ff8ae6", 0, 2.5, 1.6); P.whole.add(light);
    const at = (k, v) => v.copy(from).lerp(to, clamp(k));
    return {
      grip: 0,
      apply(ps) {
        const k = ps.rise ?? 0, on = k > 0.001 && k < 0.999;
        P.whole.visible = on; light.intensity = on ? 2.5 : 0;
        at(k, head.position); core.position.copy(head.position); light.position.copy(head.position);
        trail.forEach((s, i) => at(k - (i + 1) * 0.022, s.position));
      },
    };
  },

  flattv(P) {
    const W = P.spec.w ?? 0.95, H = W * 0.58, dark = mat("#1d1f25", { roughness: 0.4 }), wood = mat("#7d5636", { roughness: 0.6 });
    mesh(new THREE.BoxGeometry(W + 0.25, 0.32, 0.38), wood, P.whole, 0, 0.16, 0);
    mesh(new THREE.BoxGeometry(0.22, 0.03, 0.14), dark, P.whole, 0, 0.335, 0);
    mesh(new THREE.BoxGeometry(0.04, 0.12, 0.03), dark, P.whole, 0, 0.4, -0.02);
    mesh(new THREE.BoxGeometry(W + 0.04, H + 0.04, 0.04), dark, P.whole, 0, 0.46 + H / 2, -0.02);
    const glowT = canvasTex(64, 64, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, w * 0.7); gr.addColorStop(0, "#f2f8ff"); gr.addColorStop(1, "#8fc0f5"); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
    const sm = new THREE.MeshBasicMaterial({ map: glowT, color: "#ffffff" }); sm.userData.noOutline = true;
    const screen = mesh(new THREE.PlaneGeometry(W, H), sm, P.whole, 0, 0.46 + H / 2, 0.001); screen.castShadow = false;
    const light = new THREE.PointLight("#b9dcff", 0, 4, 1.4); light.position.set(0, 0.46 + H / 2, 0.5); P.whole.add(light);
    const glow = halo(P.whole, "#9ccaff", W * (P.spec.halo ?? 2.1), 0.5, 0, 0.46 + H / 2 + (P.spec.haloUp ?? 0), 0.06);
    return { grip: 0.32, apply(ps) { const g = clamp(ps.glow ?? 1); sm.color.setScalar(0.18 + 0.82 * g); light.intensity = 3.2 * g; glow.material.opacity = (P.spec.haloK ?? 0.5) * g; } };
  },

  stuffing(P) {
    const rnd = rng(41), white = mat("#f6f1e6", { roughness: 1 });
    const tufts = (P.spec.at || [[0, 0, 0]]).map(([x, y, z]) => { const g = new THREE.Group(); g.position.set(x, y, z); P.whole.add(g); for (let i = 0; i < 4; i++) mesh(new THREE.IcosahedronGeometry(0.028 + rnd() * 0.02, 1), white, g, (rnd() - 0.5) * 0.06, rnd() * 0.03, (rnd() - 0.5) * 0.04); return g; });
    return { grip: 0, apply(ps) { const k = clamp(ps.puff ?? 0); for (const t of tufts) { t.visible = k > 0.01; t.scale.setScalar(Math.max(0.01, k)); } } };
  },

  floorlamp(P) {
    const brass = mat("#b8893a", { roughness: 0.35, metalness: 0.5 }), Hh = P.spec.h ?? 1.45;
    mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.03, 24), brass, P.whole, 0, 0.015, 0);
    mesh(new THREE.CylinderGeometry(0.014, 0.014, Hh, 10), brass, P.whole, 0, Hh / 2, 0);
    const shadeM = mat("#fff0cf", { side: THREE.DoubleSide, emissive: new THREE.Color("#ffb85a"), emissiveIntensity: 0.7 });
    mesh(new THREE.CylinderGeometry(0.13, 0.21, 0.26, 24, 1, true), shadeM, P.whole, 0, Hh + 0.05, 0);
    const pool = halo(P.whole, "#ffae55", 2.2, 0.42, 0, Hh, -0.05), core = halo(P.whole, "#ffe2a8", 0.6, 0.7, 0, Hh + 0.05, 0.02);
    return { grip: 0, apply(ps) { const g = clamp(ps.glow ?? P.spec.glow ?? 1); shadeM.emissiveIntensity = 0.1 + 0.6 * g; pool.material.opacity = 0.42 * g; core.material.opacity = 0.7 * g; } };
  },

  debris(P) {
    const rnd = rng(P.spec.seed ?? 53), wood = mat("#8a5a36", { roughness: 0.7 }), pale = mat("#e6d8c2", { roughness: 0.9 }), raw = mat("#d9b07a", { roughness: 0.8 });
    const white = mat("#f6f1e6", { roughness: 1 }), glass = mat("#7fa4b8", { roughness: 0.3 });
    const items = (P.spec.items || []).map(([x, z, type, rot = 0, size = 1]) => {
      const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = (rot * Math.PI) / 180; P.whole.add(g);
      if (type === "plank") {
        const L = 0.42 * size; mesh(new THREE.BoxGeometry(L, 0.028, 0.09), wood, g, 0, 0.014, 0);
        for (let i = 0; i < 3; i++) { const sp = mesh(new THREE.BoxGeometry(0.06 + rnd() * 0.05, 0.022, 0.018), raw, g, L / 2 + 0.02, 0.013, -0.03 + i * 0.03); sp.rotation.y = (rnd() - 0.5) * 0.8; }
      } else if (type === "chip" || type === "plaster" || type === "shard") {
        const m = type === "chip" ? raw : type === "plaster" ? pale : glass;
        for (let i = 0; i < 5; i++) { const q = mesh(type === "shard" ? new THREE.TetrahedronGeometry(0.02 * size + rnd() * 0.015, 0) : new THREE.BoxGeometry((0.03 + rnd() * 0.04) * size, 0.015 + rnd() * 0.01, (0.02 + rnd() * 0.03) * size), m, g, (rnd() - 0.5) * 0.3 * size, 0.01, (rnd() - 0.5) * 0.22 * size); q.rotation.y = rnd() * 6; }
      } else {
        for (let i = 0; i < 5; i++) mesh(new THREE.IcosahedronGeometry((0.03 + rnd() * 0.03) * size, 1), white, g, (rnd() - 0.5) * 0.14 * size, 0.025, (rnd() - 0.5) * 0.1 * size);
      }
      return g;
    });
    return { grip: 0, apply(ps) { const k = clamp(ps.puff ?? P.spec.puff ?? 1); for (const g of items) { g.visible = k > 0.01; g.scale.setScalar(Math.max(0.01, k)); } } };
  },

  dustmotes(P) {
    const [bw, bh, bd] = P.spec.box || [3, 1.6, 2], n = P.spec.n ?? 90, rnd = rng(P.spec.seed ?? 71);
    const tex = radialTexture([[0, "rgba(255,236,200,1)"], [0.4, "rgba(255,220,170,0.5)"], [1, "rgba(255,210,160,0)"]]);
    const motes = Array.from({ length: n }, () => {
      const m = new THREE.Sprite(spriteM({ map: tex, opacity: 0.5 + rnd() * 0.4 })); m.scale.setScalar(0.018 + rnd() * 0.03); m.renderOrder = 3; P.whole.add(m);
      return { m, x: (rnd() - 0.5) * bw, y: 0.15 + rnd() * bh, z: (rnd() - 0.5) * bd, sp: 0.03 + rnd() * 0.05, ph: rnd() * 6.28, big: rnd() < 0.5 };
    });
    return {
      grip: 0,
      apply(ps, t = 0) {
        const b = clamp(ps.burst ?? 0), st = clamp(ps.puff ?? 0);   // puff: the dust settling (a lerped key)
        for (const q of motes) {
          q.m.visible = !q.big || b > 0.02 || st > 0.02;
          const drift = Math.sin(t * 0.7 + q.ph) * 0.06, fall = st * (q.y - 0.05) * 0.6;
          q.m.position.set(q.x + drift + Math.sin(t * q.sp * 5 + q.ph) * 0.04, q.y - fall + Math.sin(t * 0.9 + q.ph * 2) * 0.03, q.z + Math.cos(t * 0.6 + q.ph) * 0.05);
          q.m.material.opacity = (q.big ? Math.max(b, 0.6 * st) : 1) * (0.45 + 0.25 * Math.sin(t * 2 + q.ph));
        }
      },
    };
  },

  lightbeam(P) {
    const L = P.spec.len ?? 2.5, W = P.spec.w ?? 1.2, c = new THREE.Color(P.spec.color || "#ffd9a0");
    const m = new THREE.ShaderMaterial({
      uniforms: { uColor: { value: c }, uK: { value: 0.35 } },
      vertexShader: "varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: "uniform vec3 uColor; uniform float uK; varying vec2 vUv; void main() { float a = (1.0 - smoothstep(0.0, 0.5, abs(vUv.x - 0.5))) * (1.0 - vUv.y) * smoothstep(0.0, 0.12, vUv.y + 0.02); gl_FragColor = vec4(uColor * uK * a, 1.0); }",
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    });
    m.userData.outlineParameters = { visible: false }; m.userData.noOutline = true;
    const g = new THREE.BufferGeometry(), hw0 = (P.spec.w0 ?? 0.45) / 2, hw = W / 2;
    g.setAttribute("position", new THREE.Float32BufferAttribute([-hw0, 0, 0, hw0, 0, 0, -hw, 0, -L, hw, 0, -L].map((v, i) => v), 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1, 1, 1], 2)); g.setIndex([0, 2, 1, 1, 2, 3]);
    const beams = [0, 1.05, -1.05].map((r) => { const b = new THREE.Mesh(g, m); b.rotation.z = r; b.renderOrder = 2; P.whole.add(b); return b; });
    void beams;
    return { grip: 0, apply(ps) { m.uniforms.uK.value = 0.35 * clamp(ps.glow ?? P.spec.glow ?? 1); } };
  },

  wallart(P) {
    const W = P.spec.w ?? 0.5, H = P.spec.h ?? 0.4, sc = P.spec.scene || "hills", rnd = rng(sc.length * 13);
    const pic = canvasTex(256, Math.round(256 * H / W), (g, w, h) => {
      const sky = g.createLinearGradient(0, 0, 0, h);
      if (sc === "sea") { sky.addColorStop(0, "#f3b77a"); sky.addColorStop(0.5, "#f7d9a6"); sky.addColorStop(0.52, "#4f86a8"); sky.addColorStop(1, "#2f5c7e"); }
      else if (sc === "forest") { sky.addColorStop(0, "#cfe3d2"); sky.addColorStop(1, "#7fa986"); }
      else { sky.addColorStop(0, "#9cc2e0"); sky.addColorStop(0.6, "#f2dcb0"); sky.addColorStop(1, "#e8c48a"); }
      g.fillStyle = sky; g.fillRect(0, 0, w, h);
      if (sc === "sea") { g.fillStyle = "#ffe6b0"; g.beginPath(); g.arc(w * 0.68, h * 0.46, w * 0.09, Math.PI, 0); g.fill(); g.fillStyle = "rgba(255,240,200,0.5)"; for (let i = 0; i < 6; i++) g.fillRect(w * (0.55 + rnd() * 0.25), h * (0.56 + i * 0.07), w * 0.12, 2); }
      else if (sc === "forest") { for (let i = 0; i < 9; i++) { const x = rnd() * w, th = h * (0.4 + rnd() * 0.45); g.fillStyle = ["#3f6b4a", "#4f7d55", "#2f5a3c"][i % 3]; g.beginPath(); g.moveTo(x, h - th); g.lineTo(x - th * 0.25, h); g.lineTo(x + th * 0.25, h); g.fill(); } }
      else { for (const [y, c] of [[0.62, "#8fb07a"], [0.72, "#6f9a62"], [0.84, "#55804f"]]) { g.fillStyle = c; g.beginPath(); g.moveTo(0, h); for (let x = 0; x <= w; x += 16) g.lineTo(x, h * y - Math.sin(x / w * 5 + y * 9) * h * 0.06); g.lineTo(w, h); g.fill(); } }
    });
    const fr = mat(P.spec.frame || "#6b4a2e", { roughness: 0.5 });
    mesh(new THREE.BoxGeometry(W + 0.06, H + 0.06, 0.03), fr, P.whole, 0, 0, 0);
    const face = mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshStandardMaterial({ map: pic, roughness: 0.8 }), P.whole, 0, 0, 0.0155); face.castShadow = false;
    return { grip: 0 };
  },

  wallclock(P) {
    const R = P.spec.r ?? 0.16, rim = mat("#3c3a40", { roughness: 0.4 }), dial = mat("#f4ecd8", { roughness: 0.8 }), ink = mat("#2a2a30");
    const c1 = mesh(new THREE.CylinderGeometry(R, R, 0.04, 36), rim, P.whole); c1.rotation.x = Math.PI / 2;
    const c2 = mesh(new THREE.CylinderGeometry(R * 0.88, R * 0.88, 0.042, 36), dial, P.whole, 0, 0, 0.002); c2.rotation.x = Math.PI / 2;
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2, tk = mesh(new THREE.BoxGeometry(0.008, i % 3 ? 0.018 : 0.032, 0.004), ink, P.whole, Math.sin(a) * R * 0.74, Math.cos(a) * R * 0.74, 0.024); tk.rotation.z = -a; tk.castShadow = false; }
    for (const [len, a, w] of [[0.55, 2.1, 0.014], [0.78, -0.5, 0.009]]) { const hnd = mesh(new THREE.BoxGeometry(w, R * len, 0.004), ink, P.whole, Math.sin(a) * R * len / 2, Math.cos(a) * R * len / 2, 0.026); hnd.rotation.z = -a; hnd.castShadow = false; }
    return { grip: 0 };
  },

  clutter(P) {
    const rnd = rng(P.spec.seed ?? 19), cols = ["#c96f4a", "#5f8fb4", "#e3c062", "#7fa874", "#b48ab0", "#e9dfcf"];
    for (const [x, z, type, rot = 0, y = 0] of P.spec.items || []) {
      const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = (rot * Math.PI) / 180; P.whole.add(g);
      if (type === "books") { let h = 0; for (let i = 0; i < 3 + Math.floor(rnd() * 2); i++) { const bh = 0.035 + rnd() * 0.02, b = mesh(new THREE.BoxGeometry(0.2 + rnd() * 0.06, bh, 0.15 + rnd() * 0.04), mat(cols[Math.floor(rnd() * cols.length)]), g, (rnd() - 0.5) * 0.03, h + bh / 2, 0); b.rotation.y = (rnd() - 0.5) * 0.4; h += bh; } }
      else if (type === "mug") { mesh(new THREE.CylinderGeometry(0.04, 0.036, 0.09, 16), mat("#d9604a"), g, 0, 0.045, 0); const hd = mesh(new THREE.TorusGeometry(0.025, 0.007, 6, 12), mat("#d9604a"), g, 0.045, 0.05, 0); hd.rotation.y = 0; }
      else if (type === "can") { const cn = mesh(new THREE.CylinderGeometry(0.033, 0.033, 0.12, 16), mat("#d33a3a", { roughness: 0.35, metalness: 0.3 }), g, 0, 0.033, 0); cn.rotation.z = Math.PI / 2; }
      else if (type === "basket") { mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.22, 20, 1, true), mat("#b98a52", { side: THREE.DoubleSide }), g, 0, 0.11, 0); mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.01, 20), mat("#9a7040"), g, 0, 0.005, 0); for (let i = 0; i < 3; i++) mesh(new THREE.SphereGeometry(0.09, 10, 8), mat(["#8fa6c4", "#e2b5a0", "#c9d7a8"][i]), g, (i - 1) * 0.08, 0.2, (rnd() - 0.5) * 0.06).scale.set(1, 0.6, 1); }
      else if (type === "console") { mesh(new THREE.BoxGeometry(0.3, 0.06, 0.24), mat("#f0f0f2", { roughness: 0.4 }), g, 0, 0.03, 0); mesh(new THREE.BoxGeometry(0.3, 0.006, 0.24), mat("#2a2c31"), g, 0, 0.063, 0); }
      else if (type === "cable") { const pts = Array.from({ length: 8 }, (_, i) => new THREE.Vector3(i * 0.09, 0.008, Math.sin(i * 1.3) * 0.08)); mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.006, 6), mat("#24262b"), g); }
      else if (type === "slippers") { for (const sx of [-0.07, 0.07]) mesh(new THREE.CapsuleGeometry(0.04, 0.12, 6, 10), mat("#c45b6b", { roughness: 0.9 }), g, sx, 0.03, 0).rotation.x = Math.PI / 2; }
      else if (type === "box") { mesh(new THREE.BoxGeometry(0.34, 0.26, 0.3), mat("#c9a273", { roughness: 0.9 }), g, 0, 0.13, 0); mesh(new THREE.BoxGeometry(0.34, 0.004, 0.06), mat("#e8d8b0"), g, 0, 0.262, 0); }
    }
    return { grip: 0 };
  },

  sofarips(P) {
    const cover = new THREE.Color(P.spec.cover || "#3d4f8e"), edge = cover.clone().lerp(new THREE.Color("#c9d3f0"), 0.45);
    const css = (c) => `rgb(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)})`;
    const holes = [0, 1, 2].map((v) => canvasTex(128, 128, (g, w, h) => {
      const rnd = rng(101 + v * 17), n = 22, pts = (r0, j) => Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2, r = r0 * (1 + (rnd() - 0.5) * j); return [w / 2 + Math.cos(a) * r * w / 2, h / 2 + Math.sin(a) * r * h / 2 * 0.8]; });
      const poly = (P2, fill) => { g.fillStyle = fill; g.beginPath(); P2.forEach(([x, y], i) => g[i ? "lineTo" : "moveTo"](x, y)); g.closePath(); g.fill(); };
      poly(pts(0.95, 0.35), css(edge));                      // the frayed, lighter cover round the hole
      g.strokeStyle = css(edge); g.lineWidth = 2; for (let i = 0; i < 26; i++) { const a = rnd() * 6.28, r = 0.62 + rnd() * 0.3; g.beginPath(); g.moveTo(w / 2 + Math.cos(a) * r * w / 2, h / 2 + Math.sin(a) * r * h * 0.4); g.lineTo(w / 2 + Math.cos(a) * (r + 0.12) * w / 2, h / 2 + Math.sin(a) * (r + 0.12) * h * 0.4); g.stroke(); }
      poly(pts(0.72, 0.4), "#2a2438");                       // the dark torn rim
      poly(pts(0.62, 0.35), "#efe1bc");                      // pale foam inside
      for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(${rnd() < 0.5 ? "190,165,110" : "255,252,236"},0.55)`; g.beginPath(); g.arc(w / 2 + (rnd() - 0.5) * w * 0.5, h / 2 + (rnd() - 0.5) * h * 0.4, 1 + rnd() * 2.5, 0, 7); g.fill(); }
      const sh = g.createRadialGradient(w / 2, h / 2 - h * 0.12, 4, w / 2, h / 2, w * 0.32); sh.addColorStop(0, "rgba(0,0,0,0)"); sh.addColorStop(1, "rgba(60,40,30,0.35)"); g.fillStyle = sh; g.beginPath(); g.ellipse(w / 2, h / 2, w * 0.3, h * 0.24, 0, 0, 7); g.fill();
    }));
    const white = mat("#f8f4ea", { roughness: 1 }), rnd = rng(61), FACE = { front: [0, 0, 0], up: [-Math.PI / 2, 0, 0], left: [0, -Math.PI / 2, 0], right: [0, Math.PI / 2, 0] };
    const rips = (P.spec.at || []).map(([x, y, z, face = "front", size = 0.16, spin = 0], i) => {
      const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.set(...FACE[face]); P.whole.add(g);
      const m = new THREE.MeshStandardMaterial({ map: holes[i % 3], transparent: true, alphaTest: 0.05, roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 });
      const d = new THREE.Mesh(new THREE.PlaneGeometry(size * 1.25, size), m); d.rotation.z = spin; d.position.z = 0.004; d.receiveShadow = true; g.add(d);
      for (let k = 0; k < 2; k++) { const b = mesh(new THREE.IcosahedronGeometry(size * (0.07 + rnd() * 0.04), 1), white, g, (rnd() - 0.5) * size * 0.3, (rnd() - 0.5) * size * 0.2, size * 0.02); b.scale.z = 0.5; }
      return g;
    });
    return { grip: 0, apply(ps) { const k = clamp(ps.puff ?? 0); for (const g of rips) { g.visible = k > 0.01; g.scale.setScalar(Math.max(0.01, k)); } } };
  },

  sofatape(P) {
    const tape = canvasTex(160, 128, (g, w, h) => {
      const rnd = rng(211);
      const strip = (ang, len, wid) => {
        g.save(); g.translate(w / 2, h / 2); g.rotate(ang);
        g.fillStyle = "#a9adb3"; g.beginPath(); g.moveTo(-len / 2, -wid / 2);
        for (let i = 0; i <= 6; i++) g.lineTo(len / 2 + (rnd() - 0.5) * 6, -wid / 2 + (i / 6) * wid);   // a torn end
        for (let i = 6; i >= 0; i--) g.lineTo(-len / 2 + (rnd() - 0.5) * 6, -wid / 2 + (i / 6) * wid);
        g.closePath(); g.fill();
        g.strokeStyle = "rgba(70,74,82,0.55)"; g.lineWidth = 2; g.stroke();
        g.strokeStyle = "rgba(255,255,255,0.28)"; g.lineWidth = 1;   // the cloth weave of duct tape
        for (let x = -len / 2 + 4; x < len / 2 - 4; x += 5) { g.beginPath(); g.moveTo(x, -wid / 2 + 2); g.lineTo(x + 2, wid / 2 - 2); g.stroke(); }
        g.restore();
      };
      strip(0.42, 140, 30); strip(-0.38, 132, 28);
      g.strokeStyle = "#3a3f4a"; g.lineWidth = 2;   // a few stitches over it, where someone tried to sew it first
      for (let i = 0; i < 4; i++) { const x = 46 + i * 22, y = 62 + (rnd() - 0.5) * 10; g.beginPath(); g.moveTo(x - 4, y - 7); g.lineTo(x + 4, y + 7); g.stroke(); }
    });
    const FACE = { front: [0, 0, 0], up: [-Math.PI / 2, 0, 0], left: [0, -Math.PI / 2, 0], right: [0, Math.PI / 2, 0] };
    for (const [x, y, z, face = "front", size = 0.16, spin = 0] of P.spec.at || []) {
      const m = new THREE.MeshStandardMaterial({ map: tape, transparent: true, alphaTest: 0.05, roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 });
      const d = new THREE.Mesh(new THREE.PlaneGeometry(size * 1.25, size), m); d.position.set(x, y, z); d.rotation.set(...FACE[face]); d.rotateZ(spin); d.translateZ(0.005); d.receiveShadow = true; P.whole.add(d);
    }
    return { grip: 0 };
  },

  parkedscythe(P) {
    const { g } = scythe({ wood: P.spec.wood, blade: P.spec.blade }); P.whole.add(g); return { grip: 0 };
  },
  parkedstaff(P) {
    const s = staff({ staffWood: P.spec.wood || "#7a4e2a", glow: P.spec.glow || "#f2c14e" }); P.whole.add(s.group); return { grip: 0 };
  },
};
