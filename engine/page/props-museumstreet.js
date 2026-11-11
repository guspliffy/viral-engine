import * as THREE from "three";
import { clamp, lerp, rng } from "./util.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

// "There's a catch" episode 5, "back to life" (task T4): the museum's outside and the town square. Bright midday, metres,
// x right, y up, z toward the main camera, every prop faces +z at rot 0. Nothing here is solid for the checks and nothing
// casts a shadow (every mesh is flagged userData.steam + solid false, so it is also out of the ground blobs and the light
// box): animals and the cast walk through the wall line. All unlit-ish or lit by the set's key light, every frame a pure
// function of the params (seeded canvases, no Math.random, no clock). Params arrive as prop tweens (`set`): burst, rise,
// grow, jaw and blink have a default in propState; `breach` has none (it reads spec.breach until a tween sets it, and the
// first tween of it JUMPS, which is what a wall breaking does anyway).
//   museumfront  the museum's neoclassical front. Spec: w 34, h 10, breachX 1.4, breachW 9, breachH 7.5. Origin: the ground
//                at the middle of the wall plane, the wall faces +z (the wall is a plane, the hole shows 2 m of broken
//                stone thickness and a dark warm hall on a card at z -2, the hall floor strip at its foot).
//                - cream stone #e8dfc8, shadow tone #c9bda2: rusticated base to 2 m, string course, two rows of tall
//                  windows with dark panes at x -14.4, -4.8, -1.6, 1.6, 4.8, 8, 11.2, 14.4 (rows y 2.6..4.8 and 5.5..7.2, so the hole's top edge at 7.5 clears the upper row and the wall above it is calm),
//                  dentils, a cornice (y 8.45..9.05) and a balustrade on top (to y 10);
//                - the entrance at x -9: a portico of four columns (x -11.7, -9.9, -8.1, -6.3, z 1.5) with an entablature
//                  carrying the MUSEUM frieze (y 6.2..7.2) and a pediment (apex y 8.5), dark double doors behind them, and
//                  six steps 6 wide (x -12..-6) on a 2.2 m deep landing at y 1.14 (the steps reach 1.6 m out from it, z 2.2
//                  to 3.8). Nothing stands between x -4 and 8 (the cast runs there) but the wall.
//                breach 0..1 (default spec.breach 0): 0 whole wall; above 0 a ragged hole opens (size follows an ease-out of
//                  breach) centred on x breachX from the ground up: at 1 it is exactly breachW wide and breachH tall, with
//                  chipped stone blocks on its rim. Open the hole and set burst > 0 in the same frame.
//                burst 0..2 (seconds since the break, propState default spec.burst 0): 50 wall-coloured chunks (0.15 to 0.8 m,
//                  tumbling) fly out toward +z, land 2.3 to 8.7 m out (never in x -1.2..1.6, z 2..14: they land at least
//                  1.75 m left or 2.15 m right of x 0.2), hop once and stay lying; 14 cream dust puffs (soft sprites)
//                  billow out and are gone by 1.6 s. With burst 0 nothing is loose (chunks, blobs and dust hidden). Spec dust 1 scales the puffs' opacity (0 = none).
//   townsquare   the square. Spec: w 40, d 34. Origin: the square's centre; the museum wall is at z -10 in its frame. Cobbles
//                (grey #a39f97, every stone drawn once in world metres, a lighter worn lane down x 0.2, flagstone pavement
//                beyond x +-13, a sharper close-up layer over x -8..8, z 0..17 so a camera on the ground sees stones, not
//                blur; the ground plane starts at the wall, z -9.95), kerbs along x +-13.15 (z -8..16), at x = +-15 from
//                z -8 to 16 four four-storey town houses each side facing the square (alternating cream and pale stone,
//                blue-grey shutters, iron balcony rail on the first floor, cornices, blue-grey slate mansards 14.5..18.4 m
//                with dormers and chimneys, 24 m of facade, 7 m deep roofs; spec rowX 15 and rowZ 4 (the middle of the rows) move
//                them: at the contract spot they are out of frame for narrow 9:16 cameras near x 0), three small trees in stone rings (x -9 z -3,
//                x 9 z 2, x -8.5 z 11) and seven soft white cloud cards behind the museum (z -30..-60, y 10..40, facing
//                +z). The ground takes shadows; nothing on it casts any.
//   hillneck     a long-neck dinosaur as big as a hill under the city, facing +z, origin the ground at the middle of its
//                back. rise 0..1 (propState default spec.rise 0): at 0 nothing is above ground; to 0.45 the back heaves up
//                (earth, grass, three tiny houses and five trees that tilt and slide off from 0.35, 40 clods of earth and
//                rock that fall off from 0.2 to 0.95), the neck (thick, grey-green #8f9a84, paler throat) swings up and
//                forward from rise 0.3 to 0.85 to a small gentle head at y 36, z 14 in front of the origin looking down
//                toward +z. Spec headH 36 and headZ 14 (the head's height and distance in front of the origin: the neck is
//                scaled to them), bend 1 (the sideways S of the neck, 0 = in one plane). Back at rise 1: 26 wide (x +-13), 12 tall, 22 deep (z +-11). jaw 0..1 (mouth), blink 0..1
//                (eyelids). Dust billows at its base (10 sprites, strongest while it heaves).
//   streetcracks the dropped scythe's crack in the cobbles. Spec: r 2.6 (the reach of the longest arm is 0.75..1.1 r).
//                Origin: the point of impact, y 0.01. grow 0..1 (propState default spec.grow 0): nine jagged main arms with
//                branches run out from the middle, green light #7dff6a glows up from inside them (additive core, soft halo)
//                and a soft green pool spreads at the centre; at 0 nothing is drawn. Decals 4 to 14 mm over the ground.

const rnd = (i, k = 0) => { const x = Math.sin(i * 127.1 + k * 311.7 + 17.3) * 43758.5453; return x - Math.floor(x); };
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const easeOut = (x) => 1 - (1 - clamp(x)) ** 3;
const rgbOf = (c) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
const mix = (a, b, t) => { const A = rgbOf(a), B = rgbOf(b); return `rgb(${Math.round(lerp(A[0], B[0], t))},${Math.round(lerp(A[1], B[1], t))},${Math.round(lerp(A[2], B[2], t))})`; };

// ------------------------------------------------------------------------------------------------ small things
const cvs = (w, h, draw) => { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); return c; };
const tex = (c) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
// never solid, never casts, out of the ground blobs and the light box
const ghost = (o, order = 0) => { o.frustumCulled = false; o.renderOrder = order; o.castShadow = false; o.receiveShadow = false; o.userData.steam = true; o.userData.solid = false; return o; };
const noLine = (m) => { m.userData.noOutline = true; m.userData.outlineParameters = { visible: false }; return m; };
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.92, metalness: 0, ...o });
const bas = (o = {}) => noLine(new THREE.MeshBasicMaterial({ fog: false, ...o }));
function put(parent, geo, m, x = 0, y = 0, z = 0, order = 0) { const o = ghost(new THREE.Mesh(geo, m), order); o.position.set(x, y, z); parent.add(o); return o; }
const box = (parent, w, h, d, m, x, y, z) => put(parent, new THREE.BoxGeometry(w, h, d), m, x, y, z);
const ell = (rx, ry, rz, seg = 24) => { const g = new THREE.SphereGeometry(1, seg, Math.round(seg * 0.7)); g.scale(rx, ry, rz); return g; };
// a stone chunk: a twice-split box with its corners pushed about (the same corner moves the same way on every face)
function rockGeo(seed, jit = 0.2) {
  const g = new THREE.BoxGeometry(1, 1, 1, 2, 2, 2), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = x * 37.1 + y * 17.3 + z * 7.7 + seed * 13.7;
    p.setXYZ(i, x + (rnd(k, 1) - 0.5) * jit, y + (rnd(k, 2) - 0.5) * jit, z + (rnd(k, 3) - 0.5) * jit);
  }
  g.computeVertexNormals(); return g;
}
const radial = (stops, size = 128) => tex(cvs(size, size, (g, w, h) => {
  const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  for (const [o, c] of stops) gr.addColorStop(o, c);
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
}));
const spriteOf = (parent, map, color = "#ffffff", order = 6) => {
  const m = new THREE.SpriteMaterial({ map, color, transparent: true, depthWrite: false, toneMapped: false, fog: false, opacity: 0 });
  m.userData.noOutline = true;
  const s = new THREE.Sprite(m); ghost(s, order); parent.add(s); return s;
};
// a lumpy cartoon puff of dust or cloud: overlapped soft discs, a cool or warm shade under them (drawn once from a seed)
function puffCanvas(seed, light, shade, n = 9, size = 256) {
  return cvs(size, size, (g, w, h) => {
    const R = rng(seed), discs = [];
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + R() * 0.5, d = (0.14 + 0.2 * R()) * w, r = (0.17 + 0.1 * R()) * w; discs.push([w / 2 + Math.cos(a) * d, h / 2 + Math.sin(a) * d * 0.72 + 0.03 * h, r]); }
    discs.push([w / 2, h / 2, 0.26 * w]);
    for (const [pass, col, dy] of [[0, shade, 0.045 * h], [1, light, 0]]) {
      for (const [x, y, r] of discs) {
        const gr = g.createRadialGradient(x, y + dy, 0, x, y + dy, r * 1.15);
        gr.addColorStop(0, col.replace("A", "1")); gr.addColorStop(0.62, col.replace("A", pass ? "0.85" : "0.7")); gr.addColorStop(1, col.replace("A", "0"));
        g.fillStyle = gr; g.beginPath(); g.arc(x, y + dy, r * 1.15, 0, Math.PI * 2); g.fill();
      }
    }
  });
}

// ------------------------------------------------------------------------------------------------ museum front
const MF = { W: 34, WALL_H: 8.6, BX: 1.4, BW: 9, BH: 7.5, HALL_Z: -2.0, N: 40, PX: 80 };
const WIN_X = [-14.4, -4.8, -1.6, 1.6, 4.8, 8.0, 11.2, 14.4];
const WIN_ROWS = [[2.6, 4.8], [5.5, 7.2]];
const PORT = { x: -9, cols: [-11.7, -9.9, -8.1, -6.3], z: 1.5, y0: 1.14, depth: 2.2 };
const STONE = "#e8dfc8", SHADE = "#c9bda2";

// the hole's outline (a ragged superellipse from the ground up) at breach b: N points [x, y] counter-clockwise from the bottom
function holePts(b, bx, bw, bh) {
  const s = easeOut(b), hw = (bw / 2) * s, top = bh * s, cy = top / 2, pts = [], N = MF.N;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2 - Math.PI / 2, ca = Math.cos(a), sa = Math.sin(a), p = 3.2;
    const k = (Math.abs(ca) ** p + Math.abs(sa) ** p) ** (-1 / p);
    // inward jitter only: the four extreme points (bottom is the ground, top, left, right) stay exact
    const exact = i === N / 2 || i === N / 4 || i === (3 * N) / 4;
    const jit = exact ? 1 : 1 - 0.2 * rnd(i, 7) - (i % 3 === 0 ? 0.1 * rnd(i, 9) : 0);
    pts.push([bx + hw * ca * k * jit, Math.max(0, cy + cy * sa * k * jit)]);
  }
  return pts;
}

function facadeCanvas() {
  const W = MF.W, H = MF.WALL_H, PX = MF.PX;
  return cvs(W * PX, Math.round(H * PX), (g, w, h) => {
    const R = rng(4411), X = (x) => (x + W / 2) * PX, Y = (y) => h - y * PX;
    const rect = (x0, y0, x1, y1) => g.fillRect(X(x0), Y(y1), (x1 - x0) * PX, (y1 - y0) * PX);
    g.fillStyle = STONE; g.fillRect(0, 0, w, h);
    // ashlar above the base: staggered blocks, each a touch lighter or darker, soft joints
    g.fillStyle = "#d3c7aa"; rect(-17, 2.25, 17, H);
    for (let row = 0, y = 2.25; y < H; row++, y += 0.55) {
      let x = -17.7 + ((row % 2) * 0.7);
      while (x < 17.2) {
        const bw = 1.15 + 0.55 * R(), t = R();
        g.fillStyle = mix(STONE, t < 0.3 ? SHADE : "#f1e9d3", Math.abs(R() * 0.5 - 0.1));
        g.fillRect(X(x) + 1.5, Y(y + 0.55) + 1.5, bw * PX - 3, 0.55 * PX - 3);
        g.fillStyle = "rgba(255,255,255,0.22)"; g.fillRect(X(x) + 1.5, Y(y + 0.55) + 1.5, bw * PX - 3, 2);
        g.fillStyle = "rgba(120,100,60,0.12)"; g.fillRect(X(x) + 1.5, Y(y) - 4.5, bw * PX - 3, 3);
        x += bw;
      }
    }
    // rusticated base: deep grooves, bevelled blocks
    g.fillStyle = "#8f8164"; rect(-17, 0, 17, 2.0);
    for (let row = 0, y = 0; y < 2.0; row++, y += 0.5) {
      let x = -17.7 + (row % 2) * 0.75;
      while (x < 17.2) {
        const bw = 1.4 + 0.5 * R();
        g.fillStyle = mix("#e0d4b6", "#c4b692", R() * 0.7); g.fillRect(X(x) + 3, Y(y + 0.5) + 3, bw * PX - 6, 0.5 * PX - 6);
        g.fillStyle = "rgba(255,255,255,0.3)"; g.fillRect(X(x) + 3, Y(y + 0.5) + 3, bw * PX - 6, 4);
        g.fillStyle = "rgba(90,70,40,0.22)"; g.fillRect(X(x) + 3, Y(y) - 10, bw * PX - 6, 7);
        x += bw;
      }
    }
    // dirt at the foot, a string course between base and first floor, shadow under the cornice, dentils
    let gr = g.createLinearGradient(0, Y(0.9), 0, Y(0)); gr.addColorStop(0, "rgba(110,90,55,0)"); gr.addColorStop(1, "rgba(110,90,55,0.28)"); g.fillStyle = gr; rect(-17, 0, 17, 0.9);
    g.fillStyle = "#f3ecd8"; rect(-17, 2.0, 17, 2.22); g.fillStyle = "rgba(255,255,255,0.5)"; rect(-17, 2.17, 17, 2.22);
    gr = g.createLinearGradient(0, Y(2.0), 0, Y(1.7)); gr.addColorStop(0, "rgba(90,70,40,0.35)"); gr.addColorStop(1, "rgba(90,70,40,0)"); g.fillStyle = gr; rect(-17, 1.7, 17, 2.0);
    gr = g.createLinearGradient(0, Y(H), 0, Y(H - 0.7)); gr.addColorStop(0, "rgba(90,70,40,0.4)"); gr.addColorStop(1, "rgba(90,70,40,0)"); g.fillStyle = gr; rect(-17, H - 0.7, 17, H);
    for (let x = -16.9; x < 17; x += 0.42) { g.fillStyle = mix("#f3ecd8", SHADE, R() * 0.25); rect(x, H - 0.34, x + 0.26, H - 0.12); g.fillStyle = "rgba(90,70,40,0.3)"; rect(x + 0.26, H - 0.34, x + 0.32, H - 0.12); }
    // quoins at both ends
    for (let y = 2.25, i = 0; y < H; y += 0.55, i++) for (const s of [-1, 1]) { g.fillStyle = "#f4edda"; const ww = i % 2 ? 1.0 : 1.5; rect(s < 0 ? -17 : 17 - ww, y + 0.02, s < 0 ? -17 + ww : 17, y + 0.53); }
    // windows: stone surround, sky-reflecting dark panes, cream bars, a glint, a sill
    const win = (cx, y0, y1, row) => {
      const w0 = row ? 1.4 : 1.5, fw = w0 + 0.62;
      g.fillStyle = "rgba(70,55,35,0.5)"; rect(cx - fw / 2 - 0.05, y0 - 0.34, cx + fw / 2 + 0.05, y1 + 0.3 + (row ? 0.05 : 0.5));
      g.fillStyle = "#f3ecd8"; rect(cx - fw / 2, y0 - 0.3, cx + fw / 2, y1 + 0.26);
      g.fillStyle = "rgba(120,100,60,0.3)"; rect(cx + fw / 2 - 0.12, y0 - 0.3, cx + fw / 2, y1 + 0.26);
      if (!row) { g.fillStyle = "rgba(70,55,35,0.5)"; g.beginPath(); g.moveTo(X(cx - fw / 2 - 0.1), Y(y1 + 0.26)); g.lineTo(X(cx), Y(y1 + 0.78)); g.lineTo(X(cx + fw / 2 + 0.1), Y(y1 + 0.26)); g.fill(); g.fillStyle = "#f6f0de"; g.beginPath(); g.moveTo(X(cx - fw / 2 - 0.04), Y(y1 + 0.28)); g.lineTo(X(cx), Y(y1 + 0.72)); g.lineTo(X(cx + fw / 2 + 0.04), Y(y1 + 0.28)); g.fill(); g.fillStyle = "rgba(120,100,60,0.3)"; g.beginPath(); g.moveTo(X(cx + 0.1), Y(y1 + 0.5)); g.lineTo(X(cx + fw / 2 + 0.04), Y(y1 + 0.28)); g.lineTo(X(cx), Y(y1 + 0.28)); g.fill(); }
      else { g.fillStyle = "#f6f0de"; rect(cx - fw / 2 - 0.08, y1 + 0.26, cx + fw / 2 + 0.08, y1 + 0.42); g.fillStyle = "rgba(120,100,60,0.35)"; rect(cx - fw / 2 - 0.08, y1 + 0.26, cx + fw / 2 + 0.08, y1 + 0.3); }
      const pane = g.createLinearGradient(0, Y(y1), 0, Y(y0)); pane.addColorStop(0, "#6f93b3"); pane.addColorStop(0.45, "#35506b"); pane.addColorStop(1, "#1a2735"); g.fillStyle = pane; rect(cx - w0 / 2, y0, cx + w0 / 2, y1);
      g.fillStyle = "rgba(255,255,255,0.22)"; g.beginPath(); g.moveTo(X(cx - w0 / 2 + 0.1), Y(y1 - 0.1)); g.lineTo(X(cx - w0 / 2 + 0.5), Y(y1 - 0.1)); g.lineTo(X(cx - w0 / 2 + 0.1 + 0.2), Y(y0 + 0.5)); g.lineTo(X(cx - w0 / 2 + 0.1), Y(y0 + 0.5)); g.fill();
      g.fillStyle = "#eee5cc"; rect(cx - 0.04, y0, cx + 0.04, y1);
      const rows = row ? 2 : 3; for (let i = 1; i < rows; i++) rect(cx - w0 / 2, y0 + ((y1 - y0) * i) / rows - 0.035, cx + w0 / 2, y0 + ((y1 - y0) * i) / rows + 0.035);
      g.fillStyle = "rgba(0,0,0,0.3)"; rect(cx - w0 / 2, y1 - 0.1, cx + w0 / 2, y1);
      g.fillStyle = "#f6f0de"; rect(cx - fw / 2 - 0.1, y0 - 0.46, cx + fw / 2 + 0.1, y0 - 0.3); g.fillStyle = "rgba(120,100,60,0.4)"; rect(cx - fw / 2 - 0.1, y0 - 0.46, cx + fw / 2 + 0.1, y0 - 0.42);
      gr = g.createLinearGradient(0, Y(y0 - 0.46), 0, Y(y0 - 1.0)); gr.addColorStop(0, "rgba(110,90,55,0.28)"); gr.addColorStop(1, "rgba(110,90,55,0)"); g.fillStyle = gr; rect(cx - fw / 2 - 0.1, y0 - 1.0, cx + fw / 2 + 0.1, y0 - 0.46);
    };
    WIN_ROWS.forEach(([y0, y1], row) => WIN_X.forEach((cx) => win(cx, y0, y1, row)));
    // the entrance: shade of the portico, stone doorcase, dark double doors with raised panels, a fanlight
    g.fillStyle = "rgba(100,80,45,0.2)"; rect(-12.1, 1.14, -5.9, 6.2);
    const dx = PORT.x, dy = PORT.y0;
    g.fillStyle = "rgba(70,55,35,0.5)"; rect(dx - 1.5, dy, dx + 1.5, 4.8); g.beginPath(); g.arc(X(dx), Y(4.8), 1.5 * PX, Math.PI, 0); g.fill();
    g.fillStyle = "#efe6cf"; rect(dx - 1.42, dy, dx + 1.42, 4.8); g.beginPath(); g.arc(X(dx), Y(4.8), 1.42 * PX, Math.PI, 0); g.fill();
    g.fillStyle = "#2b2019"; rect(dx - 1.2, dy, dx + 1.2, 4.2); g.beginPath(); g.arc(X(dx), Y(4.2), 1.2 * PX, Math.PI, 0); g.fill();
    for (const s of [-1, 1]) { g.fillStyle = "#3d2e24"; rect(dx + (s < 0 ? -1.12 : 0.08), dy + 0.15, dx + (s < 0 ? -0.08 : 1.12), 2.0); rect(dx + (s < 0 ? -1.12 : 0.08), dy + 2.2, dx + (s < 0 ? -0.08 : 1.12), 3.9); g.fillStyle = "#d8b45a"; g.beginPath(); g.arc(X(dx + s * 0.2), Y(2.15), 5, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = "#0e0a08"; rect(dx - 0.02, dy, dx + 0.02, 4.2);
    const fan = g.createRadialGradient(X(dx), Y(4.2), 0, X(dx), Y(4.2), 1.2 * PX); fan.addColorStop(0, "#9ab4c8"); fan.addColorStop(1, "#33485c"); g.fillStyle = fan; g.beginPath(); g.arc(X(dx), Y(4.35), 1.0 * PX, Math.PI, 0); g.fill();
    g.strokeStyle = "#efe6cf"; g.lineWidth = 3; for (let i = 0; i <= 5; i++) { const a = Math.PI + (i / 5) * Math.PI; g.beginPath(); g.moveTo(X(dx), Y(4.35)); g.lineTo(X(dx) + Math.cos(a) * 1.0 * PX, Y(4.35) + Math.sin(a) * 1.0 * PX); g.stroke(); }
    // weather: faint streaks under the sills and a speckle of pits
    for (let i = 0; i < 160; i++) { const x = -16.8 + 33.6 * R(), y = 0.5 + 7.6 * R(); g.fillStyle = `rgba(120,100,65,${0.04 + 0.05 * R()})`; rect(x, y - 0.5 - R() * 0.9, x + 0.05 + 0.1 * R(), y); }
    for (let i = 0; i < 2600; i++) { g.fillStyle = R() < 0.5 ? "rgba(120,100,65,0.22)" : "rgba(255,255,255,0.3)"; g.fillRect(R() * w, R() * h, 2, 2); }
  });
}

// the dark warm hall seen through the hole (a card 2 m behind the wall)
function hallCanvas() {
  return cvs(1024, 768, (g, w, h) => {
    const R = rng(7);
    let gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#4a3022"); gr.addColorStop(0.45, "#a8794a"); gr.addColorStop(0.7, "#7a5636"); gr.addColorStop(1, "#2a1c14"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    // a lit skylight far off and its shafts
    gr = g.createRadialGradient(w * 0.5, h * 0.1, 10, w * 0.5, h * 0.1, w * 0.6); gr.addColorStop(0, "rgba(255,232,170,0.85)"); gr.addColorStop(1, "rgba(255,200,120,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 4; i++) { const x = w * (0.2 + 0.2 * i + 0.04 * R()); g.fillStyle = "rgba(255,226,160,0.16)"; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 70, 0); g.lineTo(x + 260 - 120 * i * 0.3, h * 0.8); g.lineTo(x + 120, h * 0.8); g.fill(); }
    // arches and pillars in the dark, a polished floor
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const x = w / 2 + s * (150 + 120 * i), ww = 70 - i * 12; g.fillStyle = `rgba(60,38,24,${0.55 - i * 0.13})`; g.fillRect(x - ww / 2, h * 0.14 + i * 22, ww, h * 0.62); g.beginPath(); g.arc(x, h * 0.14 + i * 22, ww / 2, Math.PI, 0); g.fill(); }
    g.fillStyle = "#6b4a30"; g.fillRect(0, h * 0.76, w, h * 0.24);
    gr = g.createLinearGradient(0, h * 0.76, 0, h); gr.addColorStop(0, "rgba(255,214,150,0.5)"); gr.addColorStop(1, "rgba(30,18,10,0.7)"); g.fillStyle = gr; g.fillRect(0, h * 0.76, w, h * 0.24);
    // a few drifting dust motes
    for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(255,236,190,${0.15 + 0.2 * R()})`; g.beginPath(); g.arc(R() * w, R() * h * 0.8, 1.5 + 2.5 * R(), 0, Math.PI * 2); g.fill(); }
    gr = g.createRadialGradient(w / 2, h / 2, h * 0.25, w / 2, h / 2, h * 0.85); gr.addColorStop(0, "rgba(20,10,5,0)"); gr.addColorStop(1, "rgba(20,10,5,0.75)"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
}

// a stone grain for the chunks, columns and steps: cream with soft darker flecks and thin chips
const stoneGrain = (seed = 3) => tex(cvs(128, 128, (g, w, h) => {
  const R = rng(seed); g.fillStyle = STONE; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 160; i++) { g.fillStyle = R() < 0.55 ? "rgba(150,130,95,0.2)" : "rgba(255,255,255,0.3)"; g.beginPath(); g.ellipse(R() * w, R() * h, 1 + 3 * R(), 1 + 2 * R(), R() * 3, 0, Math.PI * 2); g.fill(); }
  g.strokeStyle = "rgba(110,90,55,0.35)"; g.lineWidth = 1.2; for (let i = 0; i < 3; i++) { g.beginPath(); let x = R() * w, y = R() * h; g.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (R() - 0.5) * 36; y += (R() - 0.5) * 36; g.lineTo(x, y); } g.stroke(); }
}));

// the MUSEUM frieze: the entablature's front, 6.4 x 1.0 m
const friezeCanvas = () => cvs(1024, 160, (g, w, h) => {
  g.fillStyle = "#efe6cf"; g.fillRect(0, 0, w, h);
  g.fillStyle = "#f8f2e0"; g.fillRect(0, 0, w, 22); g.fillStyle = "rgba(120,100,60,0.35)"; g.fillRect(0, 22, w, 4);
  g.fillStyle = "#dccfae"; g.fillRect(0, 36, w, 92); g.fillStyle = "rgba(120,100,60,0.3)"; g.fillRect(0, 126, w, 5); g.fillStyle = "#f3ecd8"; g.fillRect(0, 131, w, 29);
  g.font = "bold 84px 'Times New Roman', Georgia, serif"; g.textBaseline = "middle";
  const word = "MUSEUM", gap = 24, ws = [...word].map((c) => g.measureText(c).width), tw = ws.reduce((a, b) => a + b, 0) + gap * (word.length - 1);
  let x = (w - tw) / 2;
  [...word].forEach((c, i) => { g.fillStyle = "#9d8c66"; g.fillText(c, x + 2, 84); g.fillStyle = "#fff8e6"; g.fillText(c, x - 1.5, 80); g.fillStyle = "#c2b48e"; g.fillText(c, x, 82); x += ws[i] + gap; });
});

// the pediment's face: a shaded tympanum with a stone sunburst
const tympanumCanvas = () => cvs(512, 96, (g, w, h) => {
  const R = rng(19); g.fillStyle = "#dccfae"; g.fillRect(0, 0, w, h);
  g.strokeStyle = "rgba(120,100,60,0.3)"; g.lineWidth = 2; for (let i = 0; i < 18; i++) { const a = Math.PI + (i / 17) * Math.PI; g.beginPath(); g.moveTo(w / 2 + Math.cos(a) * 14, h + Math.sin(a) * 6); g.lineTo(w / 2 + Math.cos(a) * 80 * (0.8 + 0.4 * R()), h + Math.sin(a) * 78); g.stroke(); }
  g.fillStyle = "#efe6cf"; g.beginPath(); g.arc(w / 2, h + 4, 24, Math.PI, 0); g.fill();
  for (let i = 0; i < 300; i++) { g.fillStyle = "rgba(130,110,70,0.18)"; g.fillRect(R() * w, R() * h, 2, 2); }
});

// a column shaft: vertical flutes, shaded to one side (u runs round it)
const columnCanvas = () => cvs(256, 64, (g, w, h) => {
  const R = rng(23); const gr = g.createLinearGradient(0, 0, w, 0);
  gr.addColorStop(0, "#c9bda2"); gr.addColorStop(0.16, "#e8dfc8"); gr.addColorStop(0.32, "#f6f0de"); gr.addColorStop(0.5, "#e8dfc8"); gr.addColorStop(0.75, "#c9bda2"); gr.addColorStop(1, "#b3a687");
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 24; i++) { const x = (i / 24) * w; g.fillStyle = "rgba(100,85,55,0.28)"; g.fillRect(x, 0, 2.5, h); g.fillStyle = "rgba(255,255,255,0.22)"; g.fillRect(x + 3, 0, 1.5, h); }
  for (let i = 0; i < 80; i++) { g.fillStyle = "rgba(100,85,55,0.15)"; g.fillRect(R() * w, R() * h, 2, 3); }
});

// ------------------------------------------------------------------------------------------------ town canvases
// cobbles in world metres: every stone drawn once from its row and place (so the base layer and the close-up layer
// agree stone for stone), a lighter worn lane down x 0.2, flagstone pavement beyond x +-13.3
function drawCobbles(g, X0, Z0, X1, Z1, PXM, close) {
  const w = (X1 - X0) * PXM, h = (Z1 - Z0) * PXM, RH = 0.36, LANE = 0.2;
  g.fillStyle = "#6a655d"; g.fillRect(0, 0, w, h);
  const rr = (x, y, ww, hh, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + ww, y, x + ww, y + hh, r); g.arcTo(x + ww, y + hh, x, y + hh, r); g.arcTo(x, y + hh, x, y, r); g.arcTo(x, y, x + ww, y, r); g.closePath(); };
  for (let r = Math.floor(Z0 / RH) - 1; r <= Math.ceil(Z1 / RH) + 1; r++) {
    let x = -24 - rnd(r, 41) * 0.5, j = 0;
    while (x < X1 + 1) {
      const k = r * 211 + j, sw = 0.3 + 0.2 * rnd(k, 42), sz = RH * (0.84 + 0.16 * rnd(k, 43)), cx = x + sw / 2, cz = r * RH + RH / 2;
      if (cx + sw / 2 > X0 - 0.2 && cx - sw / 2 < X1 + 0.2 && Math.abs(cx) < 13.2) {
        const lane = 1 - smooth(1.2, 4.6, Math.abs(cx - LANE)), t = (rnd(k, 44) - 0.5) * 0.17 + lane * 0.13, warm = (rnd(k, 45) - 0.5) * 0.06;
        const R = Math.round(163 * (1 + t + warm)), G = Math.round(159 * (1 + t)), B = Math.round(151 * (1 + t - warm));
        const gap = 0.032, px = (cx - sw / 2 + gap - X0) * PXM, pz = (cz - sz / 2 + gap - Z0) * PXM, ww = (sw - 2 * gap) * PXM, hh = (sz - 2 * gap) * PXM;
        g.fillStyle = `rgb(${R},${G},${B})`; rr(px, pz, ww, hh, Math.min(ww, hh) * 0.3); g.fill();
        if (ww > 7) {
          g.fillStyle = "rgba(255,255,255,0.14)"; rr(px + 0.08 * ww, pz + 0.06 * hh, ww * 0.6, hh * 0.28, hh * 0.14); g.fill();
          g.fillStyle = "rgba(40,35,28,0.14)"; rr(px + 0.1 * ww, pz + 0.7 * hh, ww * 0.82, hh * 0.26, hh * 0.13); g.fill();
        }
        if (close && rnd(k, 46) < 0.35) { g.fillStyle = "rgba(60,55,45,0.2)"; g.beginPath(); g.ellipse(px + ww * rnd(k, 47), pz + hh * rnd(k, 48), ww * 0.05, hh * 0.04, 0, 0, 7); g.fill(); }
        if (close && rnd(k, 49) < 0.12) { g.strokeStyle = "rgba(50,45,38,0.4)"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(px + ww * 0.2, pz + hh * 0.3); g.lineTo(px + ww * 0.55, pz + hh * 0.6); g.lineTo(px + ww * 0.8, pz + hh * 0.5); g.stroke(); }
      }
      x += sw; j++;
    }
  }
  // flagstone pavement beside the kerbs (x beyond +-13.32)
  for (const s of [-1, 1]) {
    const lo = s > 0 ? Math.max(13.32, X0) : X0, hi = s > 0 ? X1 : Math.min(-13.32, X1);
    if (hi <= lo) continue;
    g.fillStyle = "#8d887d"; g.fillRect((lo - X0) * PXM, 0, (hi - lo) * PXM, h);
    for (let r = Math.floor(Z0) - 1; r <= Math.ceil(Z1) + 1; r++) {
      let x = -46 - 0.6 * rnd(r, 60), j = 0;
      while (x < hi) {
        const fw = 1.2 + 0.4 * rnd(r * 17 + j, 61), k = r * 17 + j, a = Math.max(x + 0.02, lo), b = Math.min(x + fw - 0.02, hi);
        if (b > a) { const t = (rnd(k, 62) - 0.5) * 0.12; g.fillStyle = `rgb(${Math.round(190 * (1 + t))},${Math.round(185 * (1 + t))},${Math.round(173 * (1 + t))})`; g.fillRect((a - X0) * PXM, (r + 0.02 - Z0) * PXM, (b - a) * PXM, 0.96 * PXM); }
        x += fw; j++;
      }
    }
  }
}

// blue-grey slate: rows of scales, each its own tone, a light edge on top and a dark shadow below
function slateCanvas(seed, L = 24, Hh = 4.6) {
  const PX = 64;
  return cvs(L * PX, Math.round(Hh * PX), (g, w, h) => {
    const R = rng(seed), rowH = 0.3 * PX; g.fillStyle = "#4b5b6e"; g.fillRect(0, 0, w, h);
    for (let r = 0; r * rowH < h + rowH; r++) {
      let x = -((r % 2) * 0.17 + 0.1) * PX;
      while (x < w) {
        const sw = (0.28 + 0.1 * R()) * PX; g.fillStyle = mix("#617387", "#8da0b6", R() * R());
        g.beginPath(); g.moveTo(x + 1, r * rowH); g.lineTo(x + sw - 1, r * rowH); g.lineTo(x + sw - 1, r * rowH + rowH * 0.8); g.quadraticCurveTo(x + sw / 2, r * rowH + rowH * 1.18, x + 1, r * rowH + rowH * 0.8); g.fill();
        g.fillStyle = "rgba(255,255,255,0.18)"; g.fillRect(x + 1, r * rowH, sw - 2, 2);
        x += sw;
      }
      g.fillStyle = "rgba(20,30,45,0.28)"; g.fillRect(0, r * rowH + rowH * 0.84, w, 3);
    }
  });
}
// pale brick (chimneys)
const brickCanvas = () => cvs(128, 128, (g, w, h) => {
  const R = rng(77); g.fillStyle = "#cdb89a"; g.fillRect(0, 0, w, h);
  for (let r = 0; r < 12; r++) for (let x = -(r % 2) * 14; x < w; x += 28) { g.fillStyle = mix("#e2cfae", "#c59a74", R() * 0.6); g.fillRect(x + 1.5, r * 10.7 + 1.5, 25, 8); }
});
// a first-floor iron rail: bars between two rails, transparent between
const railCanvas = () => cvs(512, 64, (g, w, h) => {
  g.fillStyle = "#23262d"; g.fillRect(0, 4, w, 6); g.fillRect(0, h - 8, w, 6);
  for (let x = 4; x < w; x += 16) { g.fillRect(x, 4, 4, h - 8); g.beginPath(); g.arc(x + 2, 8, 5, 0, 7); g.fill(); }
  for (let x = 12; x < w; x += 64) { g.beginPath(); g.arc(x, h / 2, 11, 0, 7); g.lineWidth = 3; g.strokeStyle = "#23262d"; g.stroke(); }
});
// a dormer's window
const dormerWindowCanvas = () => cvs(128, 160, (g, w, h) => {
  g.fillStyle = "#f2ebd6"; g.fillRect(0, 0, w, h);
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#7ea0bd"); gr.addColorStop(1, "#2f4a63"); g.fillStyle = gr; g.fillRect(12, 14, w - 24, h - 26);
  g.fillStyle = "#f2ebd6"; g.fillRect(w / 2 - 3, 14, 6, h - 26); g.fillRect(12, h * 0.45, w - 24, 6); g.fillStyle = "rgba(255,255,255,0.25)"; g.fillRect(18, 20, 14, 50);
  g.fillStyle = "rgba(110,90,60,0.4)"; g.fillRect(w - 12, 0, 12, h);
});
const leafCanvas = () => cvs(256, 128, (g, w, h) => {
  const R = rng(91); g.fillStyle = "#5e9a3e"; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 260; i++) { g.fillStyle = mix("#3f7a2c", "#9fcf62", R()); g.beginPath(); g.ellipse(R() * w, R() * h, 3 + 7 * R(), 2 + 4 * R(), R() * 3, 0, 7); g.fill(); }
});
const barkCanvas = () => cvs(64, 128, (g, w, h) => {
  const R = rng(92); g.fillStyle = "#6b4a30"; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 40; i++) { g.strokeStyle = `rgba(${40 + 30 * R()},${26 + 18 * R()},14,0.6)`; g.lineWidth = 1 + 2 * R(); g.beginPath(); const x = R() * w; g.moveTo(x, R() * h * 0.5); g.lineTo(x + (R() - 0.5) * 6, h * 0.5 + R() * h * 0.5); g.stroke(); }
});

// one row of four town houses seen from the square: 24 m x 14.2 m (u runs along the facade, y up)
function rowFacadeCanvas(seed) {
  const L = 24, H = 14.2, PX = 64, w = L * PX, h = Math.round(H * PX);
  return cvs(w, h, (g) => {
    const R = rng(seed), X = (u) => u * PX, Y = (y) => h - y * PX;
    const rect = (x0, y0, x1, y1) => g.fillRect(X(x0), Y(y1), (x1 - x0) * PX, (y1 - y0) * PX);
    const TONES = [["#ece3cc", "#d0c5a7"], ["#dedac9", "#bdb7a4"], ["#efe6d0", "#d3c8aa"], ["#d9d5c4", "#b8b29f"]];
    const SHUT = ["#7e91a6", "#6f8399", "#8a9bb0"], AWN = [["#c2453b", "#f3ead2"], ["#2f6f8f", "#f3ead2"]];
    const win = (cx, y0, y1, ww, o = {}) => {
      const fw = ww + 0.3;
      g.fillStyle = "rgba(70,55,35,0.45)"; rect(cx - fw / 2 - 0.04, y0 - 0.2, cx + fw / 2 + 0.04, y1 + 0.2);
      g.fillStyle = "#f4eedc"; rect(cx - fw / 2, y0 - 0.16, cx + fw / 2, y1 + 0.16);
      g.fillStyle = "rgba(120,100,60,0.3)"; rect(cx + fw / 2 - 0.07, y0 - 0.16, cx + fw / 2, y1 + 0.16);
      const gr = g.createLinearGradient(0, Y(y1), 0, Y(y0)); gr.addColorStop(0, "#7ea0bd"); gr.addColorStop(0.5, "#3f5d78"); gr.addColorStop(1, "#22364a"); g.fillStyle = gr; rect(cx - ww / 2, y0, cx + ww / 2, y1);
      if (o.curtain) { g.fillStyle = "rgba(244,236,214,0.75)"; rect(cx - ww / 2, y0 + (y1 - y0) * 0.35, cx + ww / 2, y1); g.fillStyle = "rgba(200,180,140,0.5)"; rect(cx - 0.04, y0 + (y1 - y0) * 0.35, cx + 0.04, y1); }
      g.fillStyle = "#eee5cc"; rect(cx - 0.03, y0, cx + 0.03, y1); rect(cx - ww / 2, (y0 + y1) / 2 - 0.03, cx + ww / 2, (y0 + y1) / 2 + 0.03);
      g.fillStyle = "rgba(255,255,255,0.22)"; rect(cx - ww / 2 + 0.06, y1 - 0.5, cx - ww / 2 + 0.2, y0 + 0.3);
      g.fillStyle = "#f7f1e0"; rect(cx - fw / 2 - 0.07, y0 - 0.26, cx + fw / 2 + 0.07, y0 - 0.14);
      g.fillStyle = "#f7f1e0"; rect(cx - fw / 2 - 0.07, y1 + 0.16, cx + fw / 2 + 0.07, y1 + 0.28); g.fillStyle = "rgba(120,100,60,0.35)"; rect(cx - fw / 2 - 0.07, y1 + 0.16, cx + fw / 2 + 0.07, y1 + 0.2);
      if (o.shut) for (const s of [-1, 1]) {
        const sx = cx + s * (fw / 2 + 0.24), c = SHUT[Math.floor(R() * 3)];
        g.fillStyle = c; rect(sx - 0.21, y0 - 0.1, sx + 0.21, y1 + 0.1);
        g.fillStyle = "rgba(20,35,55,0.3)"; for (let y = y0; y < y1; y += 0.1) rect(sx - 0.17, y, sx + 0.17, y + 0.03);
        g.fillStyle = "rgba(255,255,255,0.2)"; rect(sx - 0.21, y0 - 0.1, sx - 0.17, y1 + 0.1);
      }
      if (o.flowers) { g.fillStyle = "#6b4a30"; rect(cx - ww / 2 - 0.1, y0 - 0.45, cx + ww / 2 + 0.1, y0 - 0.26); for (let i = 0; i < 14; i++) { g.fillStyle = ["#d8445e", "#f0a2b8", "#e8d048", "#4f9a3a"][i % 4]; g.beginPath(); g.arc(X(cx - ww / 2 - 0.05 + (ww + 0.1) * (i / 13)), Y(y0 - 0.5 + 0.1 * R()), 4, 0, 7); g.fill(); } }
    };
    for (let k = 0; k < 4; k++) {
      const u0 = k * 6, [c, sh] = TONES[(k + seed) % 4];
      g.fillStyle = c; rect(u0, 0, u0 + 6, H);
      for (let y = 4.0, row = 0; y < 14.0; y += 0.45, row++) { g.fillStyle = "rgba(120,100,70,0.1)"; rect(u0, y, u0 + 6, y + 0.025); for (let u = u0 + (row % 2) * 0.55; u < u0 + 6; u += 1.1) { g.fillStyle = "rgba(120,100,70,0.07)"; rect(u, y, u + 0.02, y + 0.45); } }
      // rusticated ground floor
      g.fillStyle = sh; rect(u0, 0, u0 + 6, 4.0);
      for (let y = 0, row = 0; y < 4.0; y += 0.5, row++) for (let u = u0 + (row % 2) * 0.6; u < u0 + 6; u += 1.2) { g.fillStyle = mix(c, sh, 0.25 + 0.35 * R()); g.fillRect(X(Math.max(u, u0)) + 2, Y(y + 0.5) + 2, X(Math.min(u + 1.2, u0 + 6)) - X(Math.max(u, u0)) - 4, 0.5 * PX - 4); }
      // shop bays and the door
      for (const du of [1.1, 4.9]) {
        g.fillStyle = "rgba(70,55,35,0.5)"; rect(u0 + du - 0.95, 0.5, u0 + du + 0.95, 3.0); g.beginPath(); g.arc(X(u0 + du), Y(3.0), 0.95 * PX, Math.PI, 0); g.fill();
        g.fillStyle = "#f2ebd6"; rect(u0 + du - 0.88, 0.55, u0 + du + 0.88, 3.0); g.beginPath(); g.arc(X(u0 + du), Y(3.0), 0.88 * PX, Math.PI, 0); g.fill();
        const gr = g.createLinearGradient(0, Y(3.8), 0, Y(0.8)); gr.addColorStop(0, "#d9b878"); gr.addColorStop(1, "#7c5a36"); g.fillStyle = gr; rect(u0 + du - 0.72, 0.8, u0 + du + 0.72, 3.0); g.beginPath(); g.arc(X(u0 + du), Y(3.0), 0.72 * PX, Math.PI, 0); g.fill();
        g.fillStyle = "#f2ebd6"; rect(u0 + du - 0.02, 0.8, u0 + du + 0.02, 3.7);
      }
      g.fillStyle = "rgba(70,55,35,0.5)"; rect(u0 + 2.2, 0, u0 + 3.8, 3.1); g.beginPath(); g.arc(X(u0 + 3), Y(3.1), 0.8 * PX, Math.PI, 0); g.fill();
      g.fillStyle = "#f2ebd6"; rect(u0 + 2.28, 0, u0 + 3.72, 3.1); g.beginPath(); g.arc(X(u0 + 3), Y(3.1), 0.72 * PX, Math.PI, 0); g.fill();
      g.fillStyle = ["#2e3f52", "#4a2e2a", "#2e4a3c", "#3a3040"][(k + seed) % 4]; rect(u0 + 2.4, 0, u0 + 3.6, 3.1); g.beginPath(); g.arc(X(u0 + 3), Y(3.1), 0.6 * PX, Math.PI, 0); g.fill();
      g.fillStyle = "rgba(255,255,255,0.14)"; rect(u0 + 2.5, 0.3, u0 + 2.9, 2.8); rect(u0 + 3.1, 0.3, u0 + 3.5, 2.8); g.fillStyle = "#d8b45a"; g.beginPath(); g.arc(X(u0 + 2.92), Y(1.4), 3, 0, 7); g.fill(); g.beginPath(); g.arc(X(u0 + 3.08), Y(1.4), 3, 0, 7); g.fill();
      if (k % 2 === 0) for (const du of [1.1, 4.9]) { const [a, b] = AWN[(k / 2 + (du > 3 ? 1 : 0)) % 2]; for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? b : a; g.beginPath(); g.moveTo(X(u0 + du - 0.95 + i * 0.2375), Y(3.65)); g.lineTo(X(u0 + du - 0.95 + (i + 1) * 0.2375), Y(3.65)); g.lineTo(X(u0 + du - 1.1 + (i + 1) * 0.275), Y(3.2)); g.lineTo(X(u0 + du - 1.1 + i * 0.275), Y(3.2)); g.fill(); } }
      // upper floors
      for (const du of [1, 3, 5]) {
        win(u0 + du, 4.45, 7.0, 0.95, { shut: true, curtain: R() < 0.3 });
        win(u0 + du, 8.0, 10.3, 0.95, { shut: true, curtain: R() < 0.3 });
        win(u0 + du, 11.3, 13.2, 0.9, { shut: R() < 0.6, flowers: R() < 0.4, curtain: R() < 0.25 });
      }
      // party walls
      g.fillStyle = "rgba(255,255,255,0.35)"; rect(u0, 0, u0 + 0.06, H); g.fillStyle = "rgba(90,70,40,0.35)"; rect(u0 + 0.06, 0, u0 + 0.1, H);
    }
    // floor lines and the cornice shadow
    for (const y of [4.0, 7.6]) { g.fillStyle = "#f4eedc"; rect(0, y - 0.1, L, y + 0.12); g.fillStyle = "rgba(90,70,40,0.3)"; rect(0, y - 0.28, L, y - 0.1); }
    let gr = g.createLinearGradient(0, Y(H), 0, Y(H - 0.9)); gr.addColorStop(0, "rgba(90,70,40,0.4)"); gr.addColorStop(1, "rgba(90,70,40,0)"); g.fillStyle = gr; rect(0, H - 0.9, L, H);
    for (let i = 0; i < 1600; i++) { g.fillStyle = R() < 0.5 ? "rgba(120,100,65,0.18)" : "rgba(255,255,255,0.25)"; g.fillRect(R() * w, R() * h, 2, 2); }
  });
}

// ------------------------------------------------------------------------------------------------ hill canvases
const clampN = (x, a, b) => Math.min(b, Math.max(a, x));
// the dinosaur's neck skin: grey-green #8f9a84 with wrinkles round it and a paler throat band at u 0.25 (the side that faces forward)
function neckSkinCanvas(head = false) {
  return cvs(256, 512, (g, w, h) => {
    const R = rng(head ? 55 : 51);
    for (let x = 0; x < w; x++) {
      const t = x / w, d = Math.min(Math.abs(t - 0.25), Math.abs(t - 1.25)), pale = 1 - smooth(0.06, 0.2, d), back = smooth(0.55, 0.8, t) * (1 - smooth(0.9, 1, t)) * 0.4;
      g.fillStyle = mix("#84917b", "#c3cab0", pale); g.fillRect(x, 0, 1, h);
      if (back > 0) { g.fillStyle = `rgba(70,85,66,${back * 0.5})`; g.fillRect(x, 0, 1, h); }
    }
    for (let i = 0; i < 26; i++) { const y = (i / 26) * h + R() * 8; g.strokeStyle = "rgba(60,75,58,0.4)"; g.lineWidth = 2 + 3 * R(); g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= w; x += 32) g.lineTo(x, y + (R() - 0.5) * 10 + 6 * Math.sin(x / 40)); g.stroke(); g.strokeStyle = "rgba(255,255,255,0.12)"; g.lineWidth = 1.5; g.beginPath(); g.moveTo(0, y + 5); for (let x = 0; x <= w; x += 32) g.lineTo(x, y + 5 + (R() - 0.5) * 8); g.stroke(); }
    for (let i = 0; i < 220; i++) { g.fillStyle = R() < 0.5 ? "rgba(60,75,58,0.18)" : "rgba(255,255,255,0.14)"; g.beginPath(); g.arc(R() * w, R() * h, 2 + 3 * R(), 0, 7); g.fill(); }
  });
}
// the back: grass and earth on top, grey-green skin down the flanks (v runs from the crown down)
const humpCanvas = () => cvs(1024, 512, (g, w, h) => {
  const R = rng(61); g.fillStyle = "#6f9a4a"; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 420; i++) { g.fillStyle = mix("#4f8a38", "#a3cf6a", R()); g.beginPath(); g.ellipse(R() * w, R() * h * 0.65, 8 + 26 * R(), 5 + 12 * R(), R() * 3, 0, 7); g.fill(); }
  for (let i = 0; i < 60; i++) { g.fillStyle = mix("#7a5a3a", "#9a7a52", R()); g.beginPath(); g.ellipse(R() * w, R() * h * 0.7, 18 + 36 * R(), 10 + 20 * R(), R() * 3, 0, 7); g.fill(); }
  for (let i = 0; i < 40; i++) { g.fillStyle = mix("#8a8a80", "#b4b2a4", R()); g.beginPath(); g.ellipse(R() * w, R() * h * 0.7, 6 + 12 * R(), 4 + 8 * R(), R() * 3, 0, 7); g.fill(); }
  for (let i = 0; i < 90; i++) { g.fillStyle = ["#f4e04a", "#f4f0e0", "#e8708a"][i % 3]; g.beginPath(); g.arc(R() * w, R() * h * 0.5, 2.5, 0, 7); g.fill(); }
  // the skin shows through lower down, with a ragged edge and wrinkles
  g.fillStyle = "#8f9a84"; g.beginPath(); g.moveTo(0, h * 0.62); for (let x = 0; x <= w; x += 16) g.lineTo(x, h * 0.6 + 26 * Math.sin(x / 70) + 22 * R()); g.lineTo(w, h); g.lineTo(0, h); g.fill();
  for (let i = 0; i < 22; i++) { const y = h * 0.64 + R() * h * 0.34; g.strokeStyle = "rgba(60,75,58,0.4)"; g.lineWidth = 2 + 3 * R(); g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= w; x += 40) g.lineTo(x, y + (R() - 0.5) * 12); g.stroke(); }
  const gr = g.createLinearGradient(0, h * 0.8, 0, h); gr.addColorStop(0, "rgba(90,70,45,0)"); gr.addColorStop(1, "rgba(90,70,45,0.55)"); g.fillStyle = gr; g.fillRect(0, h * 0.8, w, h * 0.2);
});
const earthCanvas = () => cvs(128, 128, (g, w, h) => {
  const R = rng(66); g.fillStyle = "#7a5c3a"; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 90; i++) { g.fillStyle = mix("#5a4228", "#a08060", R()); g.beginPath(); g.arc(R() * w, R() * h, 2 + 7 * R(), 0, 7); g.fill(); }
  for (let i = 0; i < 24; i++) { g.fillStyle = "#6f9a4a"; g.fillRect(R() * w, R() * h * 0.5, 6 + 8 * R(), 2); }
});

export const MUSEUMSTREET_KINDS = {
  // ------------------------------------------------------------------------------------------------ museumfront
  museumfront(P) {
    const g = P.whole, S = P.spec, W = S.w ?? MF.W, BX = S.breachX ?? MF.BX, BW = S.breachW ?? MF.BW, BH = S.breachH ?? MF.BH, WALL_H = MF.WALL_H;
    const grain = stoneGrain(), stoneM = std("#ffffff", { map: grain }), shadeM = std("#d9ccae", { map: grain }), lightM = std("#f6f0de", { map: grain });
    const stoneFlat = std("#ffffff", { map: grain, flatShading: true });

    // ---- the wall: one plane whose hole is cut into its map's alpha (redrawn when breach changes), 2 m of broken stone round it
    // (the look swaps standard materials for toon ones that keep map and alphaTest but not alphaMap: so the hole is cut
    // into the facade map's own alpha, redrawn from the finished painting whenever breach changes)
    const base = facadeCanvas(), live = document.createElement("canvas"); live.width = base.width; live.height = base.height;
    const liveTex = tex(live), PXM = MF.PX;
    const maskDraw = (pts) => {
      const c = live.getContext("2d"); c.globalCompositeOperation = "source-over"; c.clearRect(0, 0, live.width, live.height); c.drawImage(base, 0, 0);
      if (pts) { c.globalCompositeOperation = "destination-out"; c.fillStyle = "#000"; c.beginPath(); pts.forEach(([x, y], i) => { const px = (x + W / 2) * PXM, py = live.height - y * PXM; if (i) c.lineTo(px, py); else c.moveTo(px, py); }); c.closePath(); c.fill(); c.globalCompositeOperation = "source-over"; }
      liveTex.needsUpdate = true;
    };
    maskDraw(null);
    const wallM = noLine(std("#ffffff", { map: liveTex, alphaTest: 0.5 }));
    put(g, new THREE.PlaneGeometry(W, WALL_H), wallM, 0, WALL_H / 2, 0);

    const N = MF.N, rings = 3, pos = new Float32Array(N * rings * 3), col = new Float32Array(N * rings * 3), idx = [];
    const ringCol = [new THREE.Color("#efe6cd"), new THREE.Color("#b6a888"), new THREE.Color("#33261c")];
    for (let r = 0; r < rings; r++) for (let i = 0; i < N; i++) { const c = ringCol[r].clone().multiplyScalar(r === 1 ? 0.82 + 0.3 * rnd(i, 21) : 1); col.set([c.r, c.g, c.b], (r * N + i) * 3); }
    for (let r = 0; r < rings - 1; r++) for (let i = 0; i < N; i++) { const a = r * N + i, b = r * N + ((i + 1) % N), c2 = a + N, d = b + N; idx.push(a, c2, b, b, c2, d); }
    const revGeo = new THREE.BufferGeometry(); revGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); revGeo.setAttribute("color", new THREE.BufferAttribute(col, 3)); revGeo.setIndex(idx);
    const reveal = put(g, revGeo, noLine(std("#ffffff", { vertexColors: true, side: THREE.DoubleSide, flatShading: true })), 0, 0, 0);
    // the hall behind: a card and a floor strip, both unlit
    const hall = new THREE.Group(); g.add(hall);
    put(hall, new THREE.PlaneGeometry(BW + 3.2, BH + 1.8), bas({ map: tex(hallCanvas()) }), BX, (BH + 1.8) / 2, MF.HALL_Z - 0.02);
    const hf = put(hall, new THREE.PlaneGeometry(BW + 1.6, 2.1), bas({ color: "#5c3e28" }), BX, 0.03, MF.HALL_Z / 2); hf.rotation.x = -Math.PI / 2;
    hall.visible = false; reveal.visible = false;
    // chipped blocks on the hole's rim
    const chipGeos = [0, 1, 2, 3].map((i) => rockGeo(40 + i, 0.3)), chips = [];
    for (let k = 0; k < N / 2; k++) { const c = put(g, chipGeos[k % 4], k % 3 ? stoneFlat : shadeM, 0, 0, 0.1); chips.push(c); c.visible = false; }
    // string-course ledge pieces: they leave with the stone they hang on
    const ledgeM = std("#f3ecd8", { map: grain }), ledges = [];
    for (let x = -16.5; x < 17; x += 1.65) { if (x > -12.6 && x < -5.4) continue; ledges.push([x, box(g, 1.65, 0.2, 0.14, ledgeM, x, 2.11, 0.07)]); }

    // ---- cornice, balustrade, portico: whole, they never break
    const cr = [[8.45, 8.65, 0.3, stoneM], [8.65, 8.95, 0.75, shadeM], [8.95, 9.05, 0.85, lightM]];
    for (const [y0, y1, d, m] of cr) box(g, W + 0.7, y1 - y0, d, m, 0, (y0 + y1) / 2, d / 2);
    for (let x = -16.9; x < 17; x += 0.55) box(g, 0.3, 0.18, 0.18, lightM, x, 8.57, 0.36).castShadow = false;
    const baluster = new THREE.LatheGeometry([[0.07, 0], [0.13, 0.05], [0.1, 0.12], [0.15, 0.28], [0.17, 0.34], [0.15, 0.4], [0.09, 0.5], [0.12, 0.56], [0.1, 0.6]].map(([r, y]) => new THREE.Vector2(r, y)), 10);
    const bals = []; for (let x = -16.7; x < 17; x += 0.5) bals.push(baluster.clone().translate(x, 9.2, 0.42));
    put(g, mergeGeometries(bals), lightM);
    box(g, W + 0.5, 0.15, 0.5, stoneM, 0, 9.125, 0.42); box(g, W + 0.5, 0.2, 0.55, lightM, 0, 9.9, 0.42);
    for (const x of [-16.9, 16.9]) box(g, 0.7, 1.0, 0.7, lightM, x, 9.5, 0.42);
    for (const x of [-8.5, 0, 8.5]) box(g, 0.45, 0.8, 0.45, stoneM, x, 9.6, 0.42);

    // portico: landing, six steps, four columns, the entablature with the frieze, the pediment
    const px = PORT.x, steps = [];
    for (let k = 1; k <= 6; k++) { const d = PORT.depth + (6 - k) * 0.32, h = (PORT.y0 * k) / 6; steps.push(new THREE.BoxGeometry(6, h, d).translate(px, h / 2, d / 2)); }
    put(g, mergeGeometries(steps.map((s) => s.toNonIndexed())), shadeM);
    for (let k = 1; k <= 6; k++) { const d = PORT.depth + (6 - k) * 0.32, h = (PORT.y0 * k) / 6; box(g, 6.06, 0.05, 0.1, lightM, px, h + 0.01, d - 0.03); }
    box(g, 6.8, 0.2, 0.2, stoneM, px, PORT.y0 + 0.1, PORT.depth + 0.0);
    const colM = std("#ffffff", { map: tex(columnCanvas()) });
    const shaft = new THREE.LatheGeometry(Array.from({ length: 9 }, (_, i) => new THREE.Vector2(0.36 - 0.05 * (i / 8) + 0.03 * Math.sin((i / 8) * Math.PI), 0.18 + (i / 8) * 4.3)), 24);
    for (const cx of PORT.cols) {
      const c = new THREE.Group(); c.position.set(cx, PORT.y0, PORT.z); g.add(c);
      put(c, shaft, colM, 0, 0, 0); put(c, new THREE.CylinderGeometry(0.46, 0.5, 0.18, 20), stoneM, 0, 0.09, 0); put(c, new THREE.TorusGeometry(0.43, 0.06, 8, 20), lightM, 0, 0.2, 0).rotation.x = Math.PI / 2;
      put(c, new THREE.CylinderGeometry(0.58, 0.36, 0.32, 20), stoneM, 0, 4.62, 0); put(c, new THREE.TorusGeometry(0.5, 0.07, 8, 20), lightM, 0, 4.5, 0).rotation.x = Math.PI / 2;
      box(c, 1.05, 0.2, 1.05, lightM, 0, 4.88, 0);
      for (const s of [-1, 1]) { const v = put(c, new THREE.TorusGeometry(0.16, 0.06, 8, 14), shadeM, s * 0.55, 4.66, 0); v.scale.z = 1.4; }
    }
    box(g, 6.4, 1.0, 2.1, stoneM, px, 6.7, 1.05);
    put(g, new THREE.PlaneGeometry(6.4, 1.0), std("#ffffff", { map: tex(friezeCanvas()) }), px, 6.7, 2.106);
    box(g, 7.0, 0.16, 2.4, lightM, px, 7.28, 1.2);
    const pedShape = new THREE.Shape(); pedShape.moveTo(-3.3, 0); pedShape.lineTo(3.3, 0); pedShape.lineTo(0, 1.15); pedShape.closePath();
    const ped = put(g, new THREE.ExtrudeGeometry(pedShape, { depth: 1.9, bevelEnabled: false }), stoneM, px, 7.36, 0);
    ped.geometry.computeVertexNormals();
    const tym = put(g, new THREE.ShapeGeometry(pedShape), std("#ffffff", { map: tex(tympanumCanvas()) }), px, 7.36, 1.906);
    { const uv = tym.geometry.attributes.uv, p2 = tym.geometry.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, p2.getX(i) / 6.6 + 0.5, p2.getY(i) / 1.15); }
    for (const s of [-1, 1]) { const len = Math.hypot(3.3, 1.15), r = box(g, len + 0.3, 0.2, 2.2, lightM, px + s * 1.65, 7.36 + 0.6, 1.0); r.rotation.z = s * Math.atan2(1.15, 3.3) * -1; }

    // ---- loose stone: 50 chunks on arcs, a blob under each, 14 dust puffs
    const chunkM = [std("#ffffff", { map: grain, flatShading: true }), std("#e9dfc6", { map: grain, flatShading: true }), std("#cfc3a6", { map: grain, flatShading: true })];
    const cg = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => rockGeo(i + 1, 0.3));
    const blobM = bas({ map: radial([[0, "rgba(60,45,30,0.6)"], [0.6, "rgba(60,45,30,0.3)"], [1, "rgba(60,45,30,0)"]], 64), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
    const GRAV = 9.8, ch = [];
    for (let i = 0; i < 50; i++) {
      const s = 0.15 + 0.65 * rnd(i, 1) ** 2.2;
      const x0 = BX + (rnd(i, 2) - 0.5) * BW * 0.8, y0 = 0.4 + rnd(i, 3) * 2.8;
      let lx = BX + (rnd(i, 4) - 0.5) * 2 * 6.0 * (0.45 + 0.55 * rnd(i, 5));
      if (lx > -1.75 && lx < 2.15) { const sg = lx < 0.2 ? -1 : 1; lx = 0.2 + sg * (1.95 + 0.1 + 2.2 * rnd(i, 6)); }
      const lz = 2.3 + 6.4 * rnd(i, 7) ** 0.85, rest = s * 0.42, Tf = 0.55 + 0.045 * lz + 0.2 * rnd(i, 8);
      const mesh = put(g, cg[i % 8], chunkM[i % 3], x0, y0, 0.15, 2); mesh.scale.set(s * (0.8 + 0.4 * rnd(i, 10)), s * (0.7 + 0.4 * rnd(i, 11)), s * (0.8 + 0.4 * rnd(i, 12))); mesh.visible = false;
      const blob = put(g, new THREE.PlaneGeometry(1, 1), blobM, 0, 0.02, 0, 1); blob.rotation.x = -Math.PI / 2; blob.visible = false;
      ch.push({ mesh, blob, s, x0, y0, z0: 0.15, lx, lz, rest, Tf, t0: 0.12 * rnd(i, 9), vx: (lx - x0) / Tf, vz: (lz - 0.15) / Tf, vy: (rest - y0 + 0.5 * GRAV * Tf * Tf) / Tf,
        w: [(rnd(i, 13) - 0.5) * 14, (rnd(i, 14) - 0.5) * 14, (rnd(i, 15) - 0.5) * 14], rr: [(rnd(i, 16) - 0.5) * 0.5, rnd(i, 17) * 6.28, (rnd(i, 18) - 0.5) * 0.5], hop: 0.08 + 0.3 * rnd(i, 19) * (1 - s), slide: 0.3 * (lx < 0.2 ? -1 : 1) });
    }
    const puffMaps = [0, 1, 2].map((i) => tex(puffCanvas(61 + i, "rgba(246,238,216,A)", "rgba(205,190,155,A)")));
    const dust = [];
    for (let i = 0; i < 14; i++) {
      const low = i >= 9, s = spriteOf(g, puffMaps[i % 3], "#ffffff", 7);
      dust.push({ s, x0: low ? BX + (rnd(i, 31) - 0.5) * BW * 0.9 : BX + (i % 2 ? -1 : 1) * (1.9 + 2.6 * rnd(i, 31)), y0: low ? 1.5 + 0.8 * rnd(i, 32) : 1.2 + 2.4 * rnd(i, 32), vx: (rnd(i, 33) - 0.5) * (low ? 7 : 4.5), vy: low ? 0.3 : (rnd(i, 34) - 0.3) * 2.0, vz: low ? 3.8 + 2.6 * rnd(i, 35) : 2.0 + 3.4 * rnd(i, 35), r0: low ? 1.3 + 0.9 * rnd(i, 36) : 0.9 + 0.9 * rnd(i, 36), rot: (rnd(i, 37) - 0.5) * 1.6 });
    }

    let lastB = -1;
    const rebuild = (b) => {
      lastB = b;
      const on = b > 0.001, pts = on ? holePts(b, BX, BW, BH) : null;
      maskDraw(pts); hall.visible = reveal.visible = on;
      for (const [x, m] of ledges) { const s = easeOut(b), hw = (BW / 2) * s; m.visible = !(on && Math.abs(x - BX) < hw + 1.2); }
      for (const c of chips) c.visible = on;
      if (!on) return;
      const s = easeOut(b), cx = BX, cy = (BH * s) / 2, p = reveal.geometry.attributes.position;
      for (let i = 0; i < N; i++) {
        const [x, y] = pts[i];
        p.setXYZ(i, cx + (x - cx) * 1.012, y + (y > 0.01 ? (y - cy) * 0.012 : 0), 0.012);
        const j = 0.88 + 0.12 * rnd(i, 22);
        p.setXYZ(N + i, cx + (x - cx) * j, cy + (y - cy) * j, -0.7 - 0.25 * rnd(i, 23));
        p.setXYZ(2 * N + i, cx + (x - cx) * 0.9, Math.max(0, cy + (y - cy) * 0.9), MF.HALL_Z + 0.03);
      }
      p.needsUpdate = true; reveal.geometry.computeVertexNormals(); reveal.geometry.computeBoundingSphere();
      chips.forEach((c, k) => {
        const [x, y] = pts[k * 2], dx = x - cx, dy = y - cy, l = Math.hypot(dx, dy) || 1, sz = (0.45 + 0.6 * rnd(k, 51)) * Math.min(1, b * 4);
        c.position.set(x + (dx / l) * 0.18 * rnd(k, 52), Math.max(0.2, y + (dy / l) * 0.12), 0.1 + 0.1 * rnd(k, 53));
        c.scale.set(sz * 1.1, sz * 0.7, sz * 0.7); c.rotation.set(0, 0, (rnd(k, 54) - 0.5) * 1.0);
      });
    };
    return {
      grip: 0,
      apply(ps) {
        const b = clamp(ps.breach ?? S.breach ?? 0), burst = Math.max(0, ps.burst ?? 0);
        if (b !== lastB) rebuild(b);
        const live = b > 0.001 && burst > 0.0005;
        for (const c of ch) {
          c.mesh.visible = c.blob.visible = live;
          if (!live) continue;
          const u = burst - c.t0, tau = clamp(u, 0, c.Tf), w = clamp((u - c.Tf) / 0.3);
          let x = c.x0 + c.vx * tau, z = c.z0 + c.vz * tau, y = c.y0 + c.vy * tau - 0.5 * GRAV * tau * tau;
          if (u > c.Tf) { y = c.rest + c.hop * 4 * w * (1 - w); x += c.slide * easeOut(w); }
          const spin = c.Tf - tau;
          c.mesh.position.set(x, y, z); c.mesh.rotation.set(c.rr[0] + c.w[0] * spin, c.rr[1] + c.w[1] * spin, c.rr[2] + c.w[2] * spin);
          const h = Math.max(0, y - c.rest), k = 1 - clamp(h / 7) * 0.7;
          c.blob.position.set(x, 0.02, z); c.blob.scale.set(c.s * 1.8 * k, c.s * 1.8 * k, 1);
        }
        for (const d of dust) {
          const t = burst, vis = live && t < 1.62;
          d.s.visible = vis; if (!vis) continue;
          const f = (1 - Math.exp(-1.8 * t)) / 1.8, r = d.r0 * (0.5 + 1.0 * (1 - Math.exp(-2.2 * t)));
          d.s.position.set(d.x0 + d.vx * f, d.y0 + d.vy * f, 0.4 + d.vz * f); d.s.scale.set(r * 2, r * 1.7, 1);
          d.s.material.opacity = (S.dust ?? 1) * 0.5 * smooth(0, 0.1, t) * (1 - smooth(0.3, 1.6, t)); d.s.material.rotation = d.rot * t;
        }
      },
    };
  },
  // ------------------------------------------------------------------------------------------------ townsquare
  townsquare(P) {
    const g = P.whole, S = P.spec, W = S.w ?? 40, D = S.d ?? 34, WALL_Z = -10;
    const gz0 = WALL_Z + 0.05, gz1 = D / 2, gd = gz1 - gz0;
    // ---- the ground: a base layer for the whole square and a sharper layer where a camera low on the ground looks
    const baseC = cvs(Math.round(W * 51.2), Math.round(gd * 51.2), (c) => drawCobbles(c, -W / 2, gz0, W / 2, gz1, 51.2, false));
    const base = put(g, new THREE.PlaneGeometry(W, gd), std("#ffffff", { map: tex(baseC), roughness: 1 }), 0, 0.004, (gz0 + gz1) / 2);
    base.rotation.x = -Math.PI / 2; base.receiveShadow = true;
    const dx0 = -8, dx1 = 8, dz0 = 0, dz1 = gz1;
    const detC = cvs((dx1 - dx0) * 128, (dz1 - dz0) * 128, (c) => drawCobbles(c, dx0, dz0, dx1, dz1, 128, true));
    const det = put(g, new THREE.PlaneGeometry(dx1 - dx0, dz1 - dz0), std("#ffffff", { map: tex(detC), roughness: 1, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }), (dx0 + dx1) / 2, 0.007, (dz0 + dz1) / 2);
    det.rotation.x = -Math.PI / 2; det.receiveShadow = true;
    // ---- kerbs along both sides
    const kerbM = std("#c8c3b6", { roughness: 1 }), kg = [];
    for (const sx of [-1, 1]) for (let z = -8; z < 16; z += 1.5) kg.push(new THREE.BoxGeometry(0.3, 0.12 + 0.04 * rnd(z, 3), 1.46).translate(sx * 13.15, 0.07 + 0.02 * rnd(z, 4), z + 0.75));
    const kerb = put(g, mergeGeometries(kg), kerbM); kerb.receiveShadow = true;

    // ---- the town houses, one row each side
    const grain = stoneGrain(31), slateM = std("#ffffff", { map: tex(slateCanvas(5)), roughness: 0.8 }), deckM = std("#ffffff", { map: tex(slateCanvas(8, 24, 5.4)), roughness: 0.8 });
    const paleM = std("#e4dcc4", { map: grain }), brickM = std("#ffffff", { map: tex(brickCanvas()) }), potM = std("#b8643f"), railM = bas({ map: tex(railCanvas()), transparent: false, alphaTest: 0.5, side: THREE.DoubleSide });
    const dormerWin = std("#ffffff", { map: tex(dormerWindowCanvas()) });
    for (const side of [-1, 1]) {
      const row = new THREE.Group(); row.position.set(side * (S.rowX ?? 15), 0, S.rowZ ?? 4); row.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2; g.add(row);
      put(row, new THREE.PlaneGeometry(24, 14.2), noLine(std("#ffffff", { map: tex(rowFacadeCanvas(side < 0 ? 11 : 12)), roughness: 1 })), 0, 7.1, 0);
      box(row, 24.5, 0.5, 0.85, paleM, 0, 14.25, 0.28);
      for (const y of [4.0, 7.6]) box(row, 24.2, 0.22, 0.36, paleM, 0, y, 0.16);
      box(row, 24.1, 0.14, 0.85, paleM, 0, 4.2, 0.42);
      put(row, new THREE.PlaneGeometry(24, 0.9), railM, 0, 4.7, 0.82);
      // mansard: steep slope, shallow deck, end caps in stone
      const rise = 4.1, back = 2.2, L = Math.hypot(back, rise), th = Math.atan2(back, rise);
      const slope = put(row, new THREE.PlaneGeometry(24, L), slateM, 0, 14.5 + rise / 2, -0.1 - back / 2); slope.rotation.x = -th; slope.material.side = THREE.DoubleSide;
      const deck = put(row, new THREE.PlaneGeometry(24, 5.4), deckM, 0, 18.6, -0.1 - back - 2.7); deck.rotation.x = -Math.PI / 2;
      for (const ex of [-12, 12]) {
        const sh = new THREE.Shape(); sh.moveTo(-0.1, 14.0); sh.lineTo(-0.1, 14.5); sh.lineTo(-0.1 - back, 14.5 + rise); sh.lineTo(-0.1 - back - 5.4, 18.6); sh.lineTo(-0.1 - back - 5.4, 14.0); sh.closePath();
        const cap = put(row, new THREE.ShapeGeometry(sh), paleM, ex, 0, 0); cap.rotation.y = -Math.PI / 2; cap.material.side = THREE.DoubleSide;
      }
      // dormers: two a house, a stone box with a window and a gabled slate roof
      for (let h = 0; h < 4; h++) for (const du of [1.5, 4.5]) {
        const x = -12 + h * 6 + du, d = new THREE.Group(); d.position.set(x, 15.8, -0.8); row.add(d);
        box(d, 1.5, 1.7, 1.45, paleM, 0, 0.85, -0.72);
        put(d, new THREE.PlaneGeometry(1.3, 1.5), dormerWin, 0, 0.86, 0.003);
        const gab = put(d, new THREE.CylinderGeometry(1.0, 1.0, 1.8, 3), std("#6b7c90", { roughness: 0.8 }), 0, 1.7 + 0.35, -0.8); gab.rotation.x = -Math.PI / 2; gab.scale.set(0.95, 1, 0.55);
      }
      // chimneys
      for (const cx of [-8, 0, 8]) {
        const c = new THREE.Group(); c.position.set(cx, 18.6, -4.2); row.add(c);
        box(c, 1.1, 2.6, 1.2, brickM, 0, 1.3, 0); box(c, 1.3, 0.22, 1.4, paleM, 0, 2.7, 0);
        for (const px of [-0.28, 0.28]) put(c, new THREE.CylinderGeometry(0.16, 0.2, 0.5, 10), potM, px, 3.0, 0);
      }
    }
    // ---- three small trees in stone rings
    const leafM = std("#ffffff", { map: tex(leafCanvas()), roughness: 1 }), barkM = std("#ffffff", { map: tex(barkCanvas()) }), ringM = std("#c8c3b6", { roughness: 1 }), soilM = std("#5a4630");
    [[-9, -3, 1], [9, 2, 2], [-8.5, 11, 3]].forEach(([x, z, sd]) => {
      const t = new THREE.Group(); t.position.set(x, 0, z); g.add(t);
      put(t, new THREE.CylinderGeometry(0.85, 0.85, 0.3, 20), soilM, 0, 0.16, 0);
      for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2, b = box(t, 0.55, 0.36, 0.34, ringM, Math.cos(a) * 0.98, 0.18, Math.sin(a) * 0.98); b.rotation.y = -a + Math.PI / 2; b.receiveShadow = true; }
      put(t, new THREE.CylinderGeometry(0.17, 0.26, 2.7, 10), barkM, 0, 1.5, 0);
      for (let i = 0; i < 6; i++) { const a = rnd(i, sd) * 6.28, r = i ? 0.8 : 0, rr = 1.35 - 0.1 * i % 3; put(t, ell(rr, rr * 0.9, rr, 18), leafM, Math.cos(a) * r, 3.5 + (i ? 0.5 * rnd(i, sd + 4) : 0.9), Math.sin(a) * r); }
    });
    // ---- clouds: soft white cards far behind the museum, facing +z
    [[-38, 34, -34, 17], [22, 28, -44, 20], [-8, 16, -50, 16], [46, 38, -58, 22], [-52, 18, -40, 15], [4, 40, -60, 19], [30, 12, -34, 13]].forEach(([x, y, z, w], i) => {
      const m = bas({ map: tex(puffCanvas(100 + i, "rgba(255,255,255,A)", "rgba(196,214,238,A)", 11, 256)), transparent: true, depthWrite: false });
      put(g, new THREE.PlaneGeometry(w, w * 0.55), m, x, y, z, 0);
    });
    return { grip: 0 };
  },
  // ------------------------------------------------------------------------------------------------ hillneck
  hillneck(P) {
    const g = P.whole, S = P.spec, HW = 13, HH = 12, HD = 11;   // the back: half width, height, half depth at rise 1
    const skinM = std("#ffffff", { map: tex(neckSkinCanvas()), roughness: 0.95 }), humpM = std("#ffffff", { map: tex(humpCanvas()), roughness: 1 });
    const earthM = std("#ffffff", { map: tex(earthCanvas()), roughness: 1, flatShading: true }), rockM = std("#9a9a90", { roughness: 1, flatShading: true });
    const surf = (x, z) => HH * Math.sqrt(Math.max(0, 1 - (x / HW) ** 2 - (z / HD) ** 2));

    // ---- the back: an earth-covered dome that rises out of the ground, with a pushed-up rim of earth round it
    const hump = put(g, new THREE.SphereGeometry(1, 56, 30, 0, Math.PI * 2, 0, Math.PI * 0.6), humpM, 0, 0, 0); hump.scale.set(HW, HH, HD);
    const rim = []; for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2, m = put(g, ell(2.2 + rnd(i, 71), 1.0 + 0.6 * rnd(i, 72), 2.2 + rnd(i, 73), 12), earthM, 0, 0, 0); rim.push([m, a]); }
    // ---- three tiny houses and five trees ride the back and slide off
    const riders = [];
    const houseG = () => { const h = new THREE.Group(); box(h, 2.4, 1.7, 1.9, std("#efe3c8"), 0, 0.85, 0); const r = put(h, new THREE.CylinderGeometry(0.1, 1.55, 1.1, 4), std("#b5533c"), 0, 2.25, 0); r.rotation.y = Math.PI / 4; r.scale.z = 0.8; box(h, 0.5, 0.9, 0.05, std("#5a3a2a"), 0, 0.45, 0.96); return h; };
    const treeG = (k) => { const t = new THREE.Group(); put(t, new THREE.CylinderGeometry(0.14, 0.2, 1.4, 8), std("#6b4a30"), 0, 0.7, 0); put(t, ell(0.95, 1.0 + 0.2 * k, 0.95, 12), std(k ? "#4f8a38" : "#5f9a3e"), 0, 1.9 + 0.1 * k, 0); return t; };
    [[-6, -2], [3, -5.5], [7.5, 3]].forEach(([x, z], i) => riders.push({ o: houseG(), x, z, i, house: true }));
    [[-9, 2], [-3, 3.5], [1, -0.5], [5.5, -7], [9.5, -1]].forEach(([x, z], i) => riders.push({ o: treeG(i % 2), x, z, i: i + 3 }));
    for (const r of riders) { g.add(r.o); r.o.traverse((o) => { if (o.isMesh) ghost(o); }); r.ex = (r.x < 0 ? -1 : 1) * (16 + 5 * rnd(r.i, 74)); r.ez = clampN(r.z * 1.6 - 2 + 4 * rnd(r.i, 75), -22, 11); r.ts = 0.34 + 0.12 * rnd(r.i, 76); r.tilt = (r.x < 0 ? 1 : -1) * (0.9 + 0.5 * rnd(r.i, 77)); }
    // ---- forty clods of earth and rock
    const cgeo = [0, 1, 2, 3].map((i) => rockGeo(60 + i, 0.5)), clods = [];
    for (let i = 0; i < 40; i++) {
      const a = rnd(i, 80) * 6.283, rr = Math.sqrt(rnd(i, 81)) * 0.9, sx = HW * rr * Math.cos(a), sz = HD * rr * Math.sin(a) * 0.9, size = 0.5 + 1.1 * rnd(i, 82) ** 1.5;
      const m = put(g, cgeo[i % 4], i % 3 === 0 ? rockM : earthM, 0, 0, 0); m.scale.setScalar(size);
      clods.push({ m, sx, sz, size, ex: (sx / HW) * (15 + 9 * rnd(i, 83)) + (rnd(i, 84) - 0.5) * 3, ez: clampN((sz / HD) * (13 + 9 * rnd(i, 85)), -24, 12), ts: 0.2 + 0.6 * rnd(i, 86), sp: [rnd(i, 87) * 5, rnd(i, 88) * 5, rnd(i, 89) * 5] });
    }
    // ---- the neck: a tube along a fixed curve, swung up about its root (at the front of the back) and forward
    const HEAD_H = S.headH ?? 36, HEAD_Z = S.headZ ?? 14, BEND = S.bend ?? 1, KY = (HEAD_H + 0.2 - 6.5) / 29.7, KZ = (HEAD_Z - 1 - 8) / 5;
    const NM = 28, RING = 18, FIN = new THREE.CatmullRomCurve3([[0, 6.5, 8], [-1.6, 15, 6.5], [1.6, 24, 7.5], [2.4, 31, 10.2], [0.6, 36.2, 13.0]].map(([x, y, z]) => new THREE.Vector3(x * BEND, 6.5 + (y - 6.5) * KY, 8 + (z - 8) * KZ)));
    const cpts = FIN.getSpacedPoints(NM), nrm = [], rad = [];
    for (let i = 0; i <= NM; i++) { const t = FIN.getTangentAt(i / NM); nrm.push(new THREE.Vector3(0, -t.z, t.y).normalize()); rad.push(1.5 + 2.4 * (1 - i / NM) ** 1.2); }
    const npos = new Float32Array((NM + 1) * (RING + 1) * 3), nuv = new Float32Array((NM + 1) * (RING + 1) * 2), nidx = [];
    for (let i = 0; i <= NM; i++) for (let j = 0; j <= RING; j++) { nuv.set([j / RING, (i / NM) * 5], (i * (RING + 1) + j) * 2); if (i < NM && j < RING) { const a = i * (RING + 1) + j, b = a + 1, c2 = a + RING + 1, d = c2 + 1; nidx.push(a, c2, b, b, c2, d); } }
    const ngeo = new THREE.BufferGeometry(); ngeo.setAttribute("position", new THREE.BufferAttribute(npos, 3)); ngeo.setAttribute("uv", new THREE.BufferAttribute(nuv, 2)); ngeo.setIndex(nidx);
    const neck = put(g, ngeo, skinM, 0, 0, 0);
    // ---- the head: gentle, big eyes, a closed-ish smile; jaw and eyelids move
    const head = new THREE.Group(); g.add(head);
    const hskin = std("#ffffff", { map: tex(neckSkinCanvas(true)), roughness: 0.95 }), paleM = std("#c9d0b8"), mouthM = std("#7a2a34"), white = new THREE.MeshBasicMaterial({ color: "#fbfaf4" }), iris = new THREE.MeshBasicMaterial({ color: "#6b4a2a" }), pup = new THREE.MeshBasicMaterial({ color: "#1a120c" }), glint = new THREE.MeshBasicMaterial({ color: "#ffffff" });
    put(head, ell(1.3, 1.2, 1.4, 26), hskin, 0, 0, 0.9); put(head, ell(0.88, 0.68, 1.3, 22), hskin, 0, -0.3, 2.3);
    for (const s of [-1, 1]) { put(head, ell(0.09, 0.07, 0.07, 8), std("#4d5a48"), s * 0.28, 0.12, 3.5); const ck = put(head, new THREE.CircleGeometry(0.28, 14), bas({ color: "#d9a59a", transparent: true, opacity: 0.5, depthWrite: false }), s * 1.02, -0.3, 1.75); ck.rotation.y = s * 1.25; }
    put(head, ell(0.55, 0.12, 0.9, 12), mouthM, 0, -0.62, 2.0);
    const jaw = new THREE.Group(); jaw.position.set(0, -0.62, 1.2); head.add(jaw);
    put(jaw, ell(0.75, 0.3, 1.2, 18), paleM, 0, -0.12, 1.1); put(jaw, ell(0.5, 0.06, 0.8, 10), std("#d97c88"), 0, 0.14, 1.0);
    const eyes = [-1, 1].map((s) => {
      const e = new THREE.Group(); e.position.set(s * 0.95, 0.5, 1.55); e.rotation.y = s * 0.55; head.add(e);
      for (const [geo, m, z] of [[new THREE.SphereGeometry(0.5, 20, 14), white, 0], [new THREE.CircleGeometry(0.3, 20), iris, 0.455], [new THREE.CircleGeometry(0.17, 18), pup, 0.46], [new THREE.CircleGeometry(0.07, 12), glint, 0.465]]) { const o = put(e, geo, m, z === 0.465 ? 0.1 : 0, z === 0.465 ? 0.1 : 0, z); }
      const lid = put(e, new THREE.SphereGeometry(0.53, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), hskin, 0, 0, 0); lid.rotation.x = -Math.PI / 2;
      const lp = new THREE.Group(); e.add(lp); lp.add(lid);
      const brow = put(e, ell(0.46, 0.09, 0.2, 10), std("#6f7c68"), 0, 0.62, 0.05); brow.rotation.z = -s * 0.18;
      return { lp };
    });
    // ---- dust at the base
    const dustMap = tex(puffCanvas(140, "rgba(226,212,180,A)", "rgba(170,150,115,A)", 10, 256)), dust = [];
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 + 0.3 * rnd(i, 90); dust.push({ s: spriteOf(g, dustMap, "#ffffff", 7), x: 17 * Math.cos(a), z: 14 * Math.sin(a), r: 4.5 + 3.5 * rnd(i, 91), ph: rnd(i, 92) }); }

    const pivot = FIN.getPointAt(0), tmp = new THREE.Vector3();
    let lastKey = "";
    return {
      grip: 0,
      apply(ps) {
        const rise = clamp(ps.rise ?? S.rise ?? 0), jawK = clamp(ps.jaw ?? 0), blink = clamp(ps.blink ?? 0);
        const e = easeOut(rise / 0.45), y0 = HH * (e - 1), q = clamp((rise - 0.3) / 0.55), sw = q * q * (3 - 2 * q), alpha = 2.3 * (1 - sw);
        const on = rise > 0.002;
        for (const o of [hump, neck, head, ...rim.map((r) => r[0])]) o.visible = on;
        const key = `${rise}|${jawK}|${blink}`; if (key === lastKey) return; lastKey = key;
        hump.visible = on; hump.position.y = y0; hump.rotation.z = 0.012 * Math.sin(rise * 60) * (1 - e);
        for (const [m, a] of rim) { const k = smooth(0, 0.35, rise); m.position.set((HW + 1.6) * Math.cos(a) * 1.05, 0.2 + 0.2 * k, (HD + 1.6) * Math.sin(a) * 1.05); m.scale.set(1, k, 1); m.visible = on && k > 0.02; }
        // neck
        const cs = Math.cos(alpha), sn = Math.sin(alpha), p = neck.geometry.attributes.position;
        for (let i = 0; i <= NM; i++) for (let j = 0; j <= RING; j++) {
          const ph = (j / RING) * Math.PI * 2, r = rad[i];
          tmp.set(cpts[i].x + Math.cos(ph) * r * 1.08, cpts[i].y + nrm[i].y * Math.sin(ph) * r, cpts[i].z + nrm[i].z * Math.sin(ph) * r);
          const dy = tmp.y - pivot.y, dz = tmp.z - pivot.z;
          p.setXYZ(i * (RING + 1) + j, tmp.x, pivot.y + dy * cs - dz * sn + y0, pivot.z + dy * sn + dz * cs);
        }
        p.needsUpdate = true; neck.geometry.computeVertexNormals(); neck.geometry.computeBoundingSphere();
        const end = cpts[NM], dy = end.y - pivot.y, dz = end.z - pivot.z;
        head.position.set(end.x, pivot.y + dy * cs - dz * sn + y0, pivot.z + dy * sn + dz * cs); head.rotation.set(alpha + 0.4, 0, 0);
        neck.visible = on && sw > 0.003; head.visible = on && sw > 0.003;
        jaw.rotation.x = 0.55 * jawK;
        const lidK = 0.2 + 0.8 * blink; for (const e2 of eyes) e2.lp.rotation.x = (35 + 140 * lidK) * Math.PI / 180;
        // riders and clods: carried on the back, then they slide and fall as it rises
        for (const r of riders) {
          const u = clamp((rise - r.ts) / 0.4);
          const ys = (HH * (e - 1)) + surf(r.x, r.z), gy = r.house ? 0.8 : 0.9;
          r.o.visible = on; r.o.position.set(lerp(r.x, r.ex, u * u), lerp(ys, gy, u * u), lerp(r.z, r.ez, u * u));
          r.o.rotation.set(0.35 * u * Math.sin(r.i * 2), u * 2.4 * (r.i % 2 ? 1 : -1), r.tilt * smooth(0.0, 0.8, u) * (r.house ? 1 : 1.3));
          if (u < 0.001) r.o.rotation.set((r.z / (HD * HD)) * HH * 0.6, 0, -(r.x / (HW * HW)) * HH * 0.6);
        }
        for (const c of clods) {
          const u = clamp((rise - c.ts) / 0.3), ys = HH * (e - 1) + surf(c.sx, c.sz) + 0.1;
          c.m.visible = on && rise > 0.12; c.m.position.set(lerp(c.sx, c.ex, u * (2 - u) * 0.9 + 0.1 * u * u), lerp(ys, c.size * 0.45, u * u), lerp(c.sz, c.ez, u * (2 - u) * 0.9 + 0.1 * u * u));
          c.m.rotation.set(c.sp[0] * u, c.sp[1] * u, c.sp[2] * u);
        }
        for (const d of dust) {
          const k = smooth(0.02, 0.2, rise) * (0.35 + 0.65 * (1 - smooth(0.5, 1, rise))), sc = d.r * (0.6 + 0.9 * smooth(0, 0.6, rise));
          d.s.visible = k > 0.01; d.s.position.set(d.x * (0.9 + 0.2 * smooth(0, 0.5, rise)), sc * 0.5, d.z); d.s.scale.set(sc * 2, sc * 1.4, 1); d.s.material.opacity = 0.3 * k;
        }
      },
    };
  },

  // ------------------------------------------------------------------------------------------------ streetcracks
  streetcracks(P) {
    const g = P.whole, R0 = P.spec.r ?? 2.6;
    // polylines on the ground (x, z): nine main arms with branches; each knows its parent and where it splits off
    const lines = [];
    const walk = (x, z, ang, len, n, seed) => {
      const pts = [[x, z]]; let a = ang;
      for (let i = 0; i < n; i++) { a += (rnd(seed + i, 101) - 0.5) * 0.75 + (i % 2 ? 0.12 : -0.12) * (rnd(seed, 102) - 0.5) * 2; x += Math.cos(a) * (len / n) * (0.7 + 0.6 * rnd(seed + i, 103)); z += Math.sin(a) * (len / n) * (0.7 + 0.6 * rnd(seed + i, 103)); pts.push([x, z]); }
      return { pts, a };
    };
    for (let a = 0; a < 9; a++) {
      const ang = (a / 9) * Math.PI * 2 + (rnd(a, 104) - 0.5) * 0.5, len = R0 * (0.75 + 0.35 * rnd(a, 105)), n = 13, main = walk(0, 0, ang, len, n, a * 17);
      const arm = { pts: main.pts, w0: 0.11 * (R0 / 2.6), par: -1, at: 0, speed: 0.6 + 0.25 * rnd(a, 106) };
      lines.push(arm); const ai = lines.length - 1;
      for (let k = 0; k < 3; k++) {
        const at = 3 + k * 3 + Math.floor(rnd(a * 3 + k, 107) * 2), p0 = main.pts[at], p1 = main.pts[at + 1], dir = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]) + (k % 2 ? 1 : -1) * (0.5 + 0.5 * rnd(a * 3 + k, 108));
        const br = walk(p0[0], p0[1], dir, len * (0.36 - 0.07 * k) * (0.8 + 0.4 * rnd(a * 3 + k, 109)), 6, a * 31 + k * 7 + 3);
        lines.push({ pts: br.pts, w0: 0.06 * (R0 / 2.6), par: ai, at, speed: arm.speed });
      }
    }
    const NP = lines.reduce((s, l) => s + l.pts.length, 0);
    const mk = (m, order) => {
      const pos = new Float32Array(NP * 2 * 3), uv = new Float32Array(NP * 2 * 2), idx = []; let o = 0;
      for (const l of lines) { l.o = o; for (let i = 0; i < l.pts.length; i++) { uv.set([i / (l.pts.length - 1), 0, i / (l.pts.length - 1), 1], (o + i) * 4); if (i) idx.push((o + i - 1) * 2, (o + i - 1) * 2 + 1, (o + i) * 2, (o + i) * 2, (o + i - 1) * 2 + 1, (o + i) * 2 + 1); } o += l.pts.length; }
      const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); geo.setIndex(idx);
      m.side = THREE.DoubleSide; const mesh = put(g, geo, m, 0, 0.004, 0, order); return mesh;
    };
    const decal = { transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 };
    const haloT = tex(cvs(8, 64, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "rgba(125,255,106,0)"); gr.addColorStop(0.5, "rgba(125,255,106,0.4)"); gr.addColorStop(1, "rgba(125,255,106,0)"); c.fillStyle = gr; c.fillRect(0, 0, w, h); }));
    const halo = mk(bas({ map: haloT, blending: THREE.AdditiveBlending, toneMapped: false, ...decal }), 2);
    const dark = mk(bas({ color: "#0b0907", ...decal }), 3);
    const core = mk(bas({ color: "#7dff6a", blending: THREE.AdditiveBlending, toneMapped: false, ...decal }), 4);
    const poolT = radial([[0, "rgba(160,255,130,0.95)"], [0.3, "rgba(125,255,106,0.55)"], [0.7, "rgba(125,255,106,0.15)"], [1, "rgba(125,255,106,0)"]]);
    const pool = put(g, new THREE.PlaneGeometry(R0 * 1.5, R0 * 1.5), bas({ map: poolT, blending: THREE.AdditiveBlending, toneMapped: false, ...decal }), 0, 0.003, 0, 1); pool.rotation.x = -Math.PI / 2;
    const hubShape = new THREE.Shape(); for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2, r = (i % 2 ? 0.1 : 0.22) * (R0 / 2.6) * (0.8 + 0.4 * rnd(i, 110)); i ? hubShape.lineTo(Math.cos(a) * r, Math.sin(a) * r) : hubShape.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
    const hub = put(g, new THREE.ShapeGeometry(hubShape), bas({ color: "#0b0907", ...decal }), 0, 0.0045, 0, 3); hub.rotation.x = -Math.PI / 2;
    const hubGlow = put(g, new THREE.CircleGeometry(0.13 * (R0 / 2.6), 14), bas({ color: "#7dff6a", blending: THREE.AdditiveBlending, toneMapped: false, ...decal }), 0, 0.005, 0, 4); hubGlow.rotation.x = -Math.PI / 2;
    const layers = [[halo, 3.4], [dark, 1.3], [core, 0.3]];
    let lastG = -1;
    const upd = (grow) => {
      // arms first, then branches by how far their parent has run
      lines.forEach((l) => { if (l.par < 0) l.f = clamp(grow * 1.25 * l.speed * 1.4); });
      lines.forEach((l) => { if (l.par >= 0) { const par = lines[l.par], run = par.f * (par.pts.length - 1); l.f = clamp((run - l.at) / (l.pts.length + 1)); } });
      for (const [mesh, wk] of layers) {
        const pos = mesh.geometry.attributes.position;
        for (const l of lines) {
          const m = l.pts.length, tL = l.f * (m - 1);
          for (let i = 0; i < m; i++) {
            const ti = Math.min(i, tL), i0 = Math.floor(ti), i1 = Math.min(m - 1, i0 + 1), fr = ti - i0;
            const x = lerp(l.pts[i0][0], l.pts[i1][0], fr), z = lerp(l.pts[i0][1], l.pts[i1][1], fr);
            const a = l.pts[Math.min(m - 1, i + 1)], b = l.pts[Math.max(0, i - 1)], dx = a[0] - b[0], dz = a[1] - b[1], dl = Math.hypot(dx, dz) || 1;
            const taper = (1 - (i / (m - 1)) ** 0.9) * 0.85 + 0.15, wd = i <= tL + 1e-6 ? l.w0 * taper * (0.7 + 0.6 * rnd(l.o + i, 111)) * wk * (i === Math.ceil(tL) && tL < m - 1 ? 0.3 : 1) : 0;
            pos.setXYZ((l.o + i) * 2, x - (dz / dl) * wd, 0, z + (dx / dl) * wd); pos.setXYZ((l.o + i) * 2 + 1, x + (dz / dl) * wd, 0, z - (dx / dl) * wd);
          }
        }
        pos.needsUpdate = true; mesh.geometry.computeBoundingSphere();
      }
    };
    return {
      grip: 0,
      apply(ps) {
        const grow = clamp(ps.grow ?? P.spec.grow ?? 0), on = grow > 0.002;
        for (const o of [halo, dark, core, pool, hub, hubGlow]) o.visible = on;
        if (!on || grow === lastG) return; lastG = grow;
        upd(grow);
        pool.scale.setScalar(0.45 + 0.55 * easeOut(grow * 1.4)); pool.material.opacity = 0.6 * smooth(0, 0.25, grow);
        const hs2 = smooth(0, 0.12, grow); hub.scale.setScalar(hs2); hubGlow.scale.setScalar(hs2);
      },
    };
  },
};
