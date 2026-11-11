import * as THREE from "three";
import { clamp, rng } from "./util.js";
import { mat, mesh, canvasTex } from "./props-trend.js";

// "What if your friend could copy money?" / There's a catch, episode 4 (10 Nov 2026): the twist. Hyperinflation in fast
// forward: the diner's price board runs out of digits and its flaps blow off, a wheelbarrow of cash is tipped out for one
// milkshake, and the diner's sign turns from a milkshake to a cowboy hat. Metres, hex colours, front +z, deterministic:
// every frame is drawn from the params alone (hashes, no Math.random, no clock). Params arrive as prop tweens (`set`);
// propState (props3d.js) has no default for stage, clock, blow, dump, load or wheel, so they read spec.<name> (then the
// default below) until a tween sets them, and the first tween of such a key JUMPS: seed it with a dur-0 `set` at time 0.
//
//   flipboard   the diner's wall price board. Origin: its CENTRE; it hangs flat on a wall facing +z (0.05 deep, the wall at
//               z -0.025). spec.w 1.3, spec.h 0.62, spec.drop 1.7 (how far below the board's centre the floor is, where the
//               blown flaps land). A dark chrome-edged frame (#2b2e33, edge #c9ced6); the top 55 %: three cream picture
//               tiles (pie slice with a cherry, burger, pink milkshake with a straw, cel style); the bottom 45 %: one row
//               of 13 split-flap cells (black #15171a flaps, a hinge line across the middle, white digits, right-aligned
//               like a price). Each cell is real 3D: a top flap that falls forward about its hinge (front = this digit's
//               top half, back = the next digit's bottom half) in front of the static halves; the digits are drawn at 128 px
//               a cell from one atlas, so a price is crisp at 900 px wide.
//     stage  0..5 (default 0): 0 "4.50", 1 "450.00", 2 "45,000.00", 3 "4,500,000.00", 4 "4,500,000,000" (all 13 cells
//            full, it has run out of digits). A whole number shows that price, still. Between two whole numbers the cells
//            flip, the right-hand cells first, 3 to 5 flips each (cells that stay blank do not flip), a new leading digit
//            or comma flipping in from blank, timed from `stage` alone. 4 to 5: every cell keeps flipping faster and
//            faster without settling (a different digit per cell per flip from a hash of the cell and the flip count,
//            about 60 flips per unit of stage at the start, 5 times that at 5).
//     clock  seconds (default: the clip time): from stage 4.2 the whole board rattles (up to 1.5 degrees and 1 cm at 5)
//            from the clock; the rattle dies away over blow 0.75..1 (the board is empty and still at 1).
//     blow   0..1 (default 0): the flaps tear off. Each of the 13 cells gives up 3 big black cards (its top flap and its
//            two static halves, 39 in all, each a cell's half: 0.088 x 0.118 m, showing the digit half they had), each on
//            its own hash arc: out toward +z (0.3 to 2.3 m) and to the sides (up to 1.8 m), a pop up, then drifting down
//            like paper, tumbling, to the floor at y = -spec.drop where they lie for good (they grow to 1.3 x on the
//            way, cartoon). A card leaves at blow 0 to 0.5 and takes half the range to land, so blow 1 = all settled.
//            What is left: empty dark holes with a bare hinge rod and its two brackets. Landing zone: x within +-1.8 of
//            the board's centre, z 0.3..2.3, y = -drop.
//     The frame, the tile strip and the hinge parts are solid for the checks; the flaps and cards are see-through
//     (userData.steam). Pair with stage 5 for the blow (the chaos is frozen at its stage-5 digits when the cards go).
//
//   wheelbarrow a builder's wheelbarrow, 1.15 long. Origin: on the floor under the tray's middle; it points +x (the wheel
//               at +x 0.42, r 0.15; the handles toward -x, ends at x -0.72, y 0.5, 0.42 apart). Red metal tray (#c8443a,
//               0.62 long x 0.5 wide at the rim, 0.24 deep, the rim 0.52 above the floor), dark tyre, steel forks and
//               legs under the back of the tray, wooden handles (#a9773f, r 0.016, legs at x -0.2..-0.3). spec.load 1.
//     load   0..1 (default spec.load 1): the heap of cash (about 100 green bundles with cream bands and 50 loose notes,
//            its top 0.9 above the floor) scaled down toward the tray's floor to empty at 0.
//     dump   0..1 (default 0): the barrow tips forward about its wheel axle (x 0.42, y 0.15). The tray tilts 55 degrees at
//            1; the frame (handles, legs, forks) turns 28.4 degrees so the handle ends rise to y 1.0 exactly (a rigid
//            55 degrees would put them at 1.29 m, above a potato's head); the tray therefore lifts off its frame at the
//            back: a dump-cart look. The heap slides out over the front lip, front notes first, between dump 0.22 and
//            0.96 and lands beyond the wheel: x 0.72..1.27, z within +-0.35, y 0.03 (the generator grows a `cashheap`
//            there); each piece shrinks away on landing, so at 1 the tray is empty and no note is left on the barrow.
//     wheel  degrees (default 0): the wheel turns (positive = rolling toward +x). Use `wheel`, NOT `roll`: props3d.js
//            turns every prop about z by `roll` (and hands holding it follow, attach.js ownQ). If `roll` is tweened it is
//            honoured as the wheel's turn too (the lean is cancelled here), but the hands' grip points would still orbit.
//     Tray, legs, forks, handles and wheel are solid; the cash is see-through (userData.steam).
//   dinersign   the diner's roadside sign seen through its window: a rounded board spec.w 1.0 x spec.h 0.7, 0.08 thick, on
//               a steel pole going down 2.2 from its bottom edge. Origin: the board's centre (the pole's foot at y -2.55).
//               Cream face #f6ecd4 with a red neon border #e23b33 and a ring of small bulbs on both sides. Front (+z): a
//               pink milkshake with a straw; back: a brown cowboy hat (curved brim, tall dented crown, a darker band) with a
//               green two-leaf sprout. spec.snow (default false): a little snow lies on the top edge.
//     flip   0..1 (default 0): the board turns 180 degrees about its vertical axis (the pole stands still), the hat in
//            front at 1 (ease is the generator's).
//     lit    0..1 (propState default spec.lit ?? 0, so put lit: 1 in the spec for the day sign): the border and the bulbs
//            glow; at 0 the sign is dead: the faces go grey-blue, the neon and the bulbs dull.
//   Grips: TWIST_GRIPS.wheelbarrow.handleL (z -0.207: the pusher's left, facing +x) and .handleR (z +0.207): points 0.06
//   before the handle ends, for dump 0 (a hand closes round the 3 cm bar from above). For dump 0..1 a FUNCTION:
//   TWIST_GRIPS.wheelbarrow.handleAt(dump) -> { handleL: [x,y,z], handleR: [x,y,z] } in the barrow's own frame (tween
//   a hand's grip point along it; it is exact for the frame's turn, dump 1 puts the grip points at y 0.96, the handle ends at 1.0). Sizes (before scale):
//   flipboard 1.3 x 0.62, wheelbarrow 1.15 x 0.62 x 0.5 (handles 0.42 apart), dinersign 1.0 x 0.7 + pole.
export const TWIST = { board: { w: 1.3, h: 0.62, d: 0.05, cells: 13, drop: 1.7 }, barrow: { len: 1.15, rim: 0.52, heap: 0.9, handleY: 0.5, handleX: -0.72, axle: [0.42, 0.15, 0] }, sign: { w: 1.0, h: 0.7, pole: 2.2 } };

// ---- shared bits
const DEG = Math.PI / 180;
const ss = (x) => { const t = clamp(x); return t * t * (3 - 2 * t); };
const hs = (a, b = 0, c = 0) => { const x = Math.sin(a * 127.1 + b * 311.7 + c * 74.7 + 19.19) * 43758.5453; return x - Math.floor(x); };
const see = (o) => { o.userData.steam = true; o.castShadow = false; return o; };
const INK = "#2a1d18";
const ink = (g, lw = 6) => { g.strokeStyle = INK; g.lineWidth = lw; g.lineJoin = "round"; g.lineCap = "round"; };
const fillStroke = (g, fill, lw = 6) => { g.fillStyle = fill; g.fill(); ink(g, lw); g.stroke(); };
const rrPath = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };

// ---- the cel-style pictures (drawn in a box about 400 wide, centred on 0,0)
function drawPie(g) {
  g.fillStyle = "rgba(60,40,20,0.14)"; g.beginPath(); g.ellipse(-10, 112, 200, 20, 0, 0, Math.PI * 2); g.fill();
  const X0 = -185, X1 = 100, top = (x) => 30 + (-62 - 30) * ((x - X0) / (X1 - X0)), bot = (x) => 54 + (84 - 54) * ((x - X0) / (X1 - X0));
  const at = (x, f) => top(x) + (bot(x) - top(x)) * f;
  const layer = (f0, f1, col) => { g.beginPath(); g.moveTo(X0, at(X0, f0)); g.lineTo(X1, at(X1, f0)); g.lineTo(X1, at(X1, f1)); g.lineTo(X0, at(X0, f1)); g.closePath(); g.fillStyle = col; g.fill(); };
  layer(0, 0.24, "#e0a14a"); layer(0.24, 0.78, "#c8303e"); layer(0.78, 1, "#d99a45");
  // filling lumps and a lattice on the top crust
  g.fillStyle = "#e05560"; for (const x of [-120, -60, 0, 55]) { g.beginPath(); g.ellipse(x, at(x, 0.5), 14, 11, 0, 0, Math.PI * 2); g.fill(); }
  ink(g, 4); g.strokeStyle = "rgba(120,60,20,0.75)"; for (const x of [-110, -50, 10, 70]) { g.beginPath(); g.moveTo(x, at(x, 0)); g.lineTo(x + 18, at(x + 18, 0.24)); g.stroke(); }
  g.beginPath(); g.moveTo(X0, top(X0)); g.lineTo(X1, top(X1)); g.lineTo(X1, bot(X1)); g.lineTo(X0, bot(X0)); g.closePath(); ink(g, 7); g.stroke();
  // the fluted crust at the back end
  g.beginPath(); g.roundRect(X1 - 8, top(X1) - 14, 66, bot(X1) - top(X1) + 28, 26); fillStroke(g, "#e8a94e", 7);
  g.strokeStyle = "rgba(120,60,20,0.7)"; g.lineWidth = 4; for (let i = 1; i < 5; i++) { const y = top(X1) - 6 + i * ((bot(X1) - top(X1) + 14) / 5); g.beginPath(); g.moveTo(X1 + 6, y); g.lineTo(X1 + 44, y + 4); g.stroke(); }
  // the cherry
  const cx = -30, cy = top(cx) - 30;
  ink(g, 6); g.beginPath(); g.moveTo(cx + 2, cy - 22); g.quadraticCurveTo(cx + 18, cy - 62, cx + 44, cy - 66); g.stroke();
  g.beginPath(); g.arc(cx, cy, 30, 0, Math.PI * 2); fillStroke(g, "#d2182b", 7);
  g.fillStyle = "rgba(255,255,255,0.8)"; g.beginPath(); g.ellipse(cx - 10, cy - 11, 8, 5, -0.6, 0, Math.PI * 2); g.fill();
}
function drawBurger(g) {
  g.fillStyle = "rgba(60,40,20,0.14)"; g.beginPath(); g.ellipse(0, 138, 190, 16, 0, 0, Math.PI * 2); g.fill();
  rrPath(g, -150, 84, 300, 52, 26); fillStroke(g, "#d98a36");                                   // bottom bun
  rrPath(g, -168, 38, 336, 52, 26); fillStroke(g, "#6b3b22");                                   // patty
  g.fillStyle = "rgba(255,255,255,0.18)"; g.fillRect(-140, 48, 120, 8);
  g.beginPath(); g.moveTo(-164, 14); g.lineTo(164, 14); g.lineTo(164, 40); g.lineTo(70, 40); g.lineTo(52, 74); g.lineTo(34, 40); g.lineTo(-164, 40); g.closePath(); fillStroke(g, "#f7c642");   // cheese with a drip
  rrPath(g, -152, -4, 304, 22, 10); fillStroke(g, "#d9382f", 5);                                // tomato
  g.beginPath(); g.moveTo(-176, 4); for (let i = 0; i <= 12; i++) g.lineTo(-176 + i * 29.3, i % 2 ? 24 : -8); g.lineTo(176, 2); g.closePath(); fillStroke(g, "#7dc24b", 5);   // lettuce
  g.beginPath(); g.moveTo(-160, -8); g.bezierCurveTo(-160, -130, 160, -130, 160, -8); g.closePath(); fillStroke(g, "#e39a3f", 7);   // top bun
  g.fillStyle = "rgba(255,255,255,0.28)"; g.beginPath(); g.ellipse(-70, -70, 50, 18, -0.5, 0, Math.PI * 2); g.fill();
  g.fillStyle = "#fff2cf"; for (const [x, y, a] of [[-90, -42, -0.6], [-40, -78, 0.3], [20, -88, -0.2], [74, -62, 0.7], [110, -34, 0.5], [-10, -45, 0.9], [45, -36, -0.4], [-118, -22, 0.2]]) { g.beginPath(); g.ellipse(x, y, 11, 6, a, 0, Math.PI * 2); g.fill(); }
}
function drawShake(g) {
  g.fillStyle = "rgba(60,40,20,0.14)"; g.beginPath(); g.ellipse(0, 158, 120, 14, 0, 0, Math.PI * 2); g.fill();
  // the straw (behind the cream), striped, bending out at the top
  ink(g, 6); g.lineWidth = 30; g.strokeStyle = INK; g.beginPath(); g.moveTo(28, -80); g.lineTo(46, -190); g.lineTo(96, -232); g.stroke();
  g.lineWidth = 19; g.strokeStyle = "#ffffff"; g.beginPath(); g.moveTo(28, -80); g.lineTo(46, -190); g.lineTo(96, -232); g.stroke();
  g.strokeStyle = "#e23b45"; g.lineWidth = 19; g.setLineDash([16, 24]); g.beginPath(); g.moveTo(28, -80); g.lineTo(46, -190); g.lineTo(96, -232); g.stroke(); g.setLineDash([]);
  // the glass, the shake, the cream, the cherry
  g.beginPath(); g.moveTo(-86, -118); g.lineTo(86, -118); g.lineTo(56, 138); g.lineTo(-56, 138); g.closePath(); fillStroke(g, "#ffe3ee", 7);
  g.beginPath(); g.moveTo(-83, -92); g.lineTo(83, -92); g.lineTo(56, 138); g.lineTo(-56, 138); g.closePath(); g.fillStyle = "#ff8fbd"; g.fill();
  g.fillStyle = "#ff6ea8"; g.beginPath(); g.moveTo(-70, 40); g.lineTo(70, 40); g.lineTo(56, 138); g.lineTo(-56, 138); g.closePath(); g.fill();
  g.fillStyle = "rgba(255,255,255,0.55)"; g.beginPath(); g.moveTo(-66, -70); g.lineTo(-48, -70); g.lineTo(-36, 110); g.lineTo(-46, 110); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(-86, -118); g.lineTo(86, -118); g.lineTo(56, 138); g.lineTo(-56, 138); g.closePath(); ink(g, 7); g.stroke();
  for (const [x, y, r] of [[-52, -128, 38], [0, -142, 44], [52, -128, 38], [-24, -170, 34], [26, -172, 34]]) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); fillStroke(g, "#ffffff", 6); }
  g.beginPath(); g.arc(0, -214, 24, 0, Math.PI * 2); fillStroke(g, "#d2182b", 6);
  g.fillStyle = "rgba(255,255,255,0.8)"; g.beginPath(); g.ellipse(-8, -222, 7, 4, -0.6, 0, Math.PI * 2); g.fill();
}
// Gunslinger's hat: a curved brim (the ends turned up), a tall crown with a dent, a darker band, a green two-leaf sprout
function drawHat(g) {
  g.fillStyle = "rgba(60,40,20,0.14)"; g.beginPath(); g.ellipse(0, 150, 310, 16, 0, 0, Math.PI * 2); g.fill();
  // brim: wide, the ends curled up
  g.beginPath(); g.moveTo(-318, -8); g.bezierCurveTo(-262, 118, -120, 156, 0, 156); g.bezierCurveTo(120, 156, 262, 118, 318, -8);
  g.bezierCurveTo(282, 62, 156, 98, 0, 98); g.bezierCurveTo(-156, 98, -282, 62, -318, -8); g.closePath(); fillStroke(g, "#8a5629", 8);
  g.strokeStyle = "rgba(230,190,120,0.55)"; g.lineWidth = 4; g.setLineDash([14, 12]); g.beginPath(); g.moveTo(-290, 14); g.bezierCurveTo(-240, 112, -120, 142, 0, 142); g.bezierCurveTo(120, 142, 240, 112, 290, 14); g.stroke(); g.setLineDash([]);
  // crown: tall, tapering, a dent pinched into the top (a little wider than tall, like his)
  g.save(); g.scale(1.2, 0.95); g.translate(0, 8);
  g.beginPath(); g.moveTo(-122, 104); g.bezierCurveTo(-120, 30, -108, -70, -98, -128); g.bezierCurveTo(-72, -150, -34, -134, 0, -100); g.bezierCurveTo(34, -134, 72, -150, 98, -128);
  g.bezierCurveTo(108, -70, 120, 30, 122, 104); g.bezierCurveTo(60, 122, -60, 122, -122, 104); g.closePath(); fillStroke(g, "#a36b38", 8);
  // the pinches either side of the dent
  ink(g, 5); g.beginPath(); g.moveTo(-46, -122); g.bezierCurveTo(-40, -92, -34, -64, -28, -34); g.stroke(); g.beginPath(); g.moveTo(46, -122); g.bezierCurveTo(40, -92, 34, -64, 28, -34); g.stroke();
  g.fillStyle = "rgba(90,50,20,0.3)"; g.beginPath(); g.moveTo(0, -100); g.bezierCurveTo(-24, -92, -28, -50, -28, -34); g.lineTo(28, -34); g.bezierCurveTo(28, -50, 24, -92, 0, -100); g.closePath(); g.fill();
  g.fillStyle = "rgba(255,255,255,0.18)"; g.beginPath(); g.ellipse(-92, -30, 9, 52, 0.08, 0, Math.PI * 2); g.fill();
  // band
  g.beginPath(); g.moveTo(-121, 40); g.bezierCurveTo(-60, 62, 60, 62, 121, 40); g.lineTo(122, 104); g.bezierCurveTo(60, 122, -60, 122, -122, 104); g.closePath(); fillStroke(g, "#4a2c14", 7);
  g.fillStyle = "#c9a15a"; for (let i = -3; i <= 3; i++) g.fillRect(i * 32 - 3, 74 + Math.abs(i) * 1.2, 7, 12);
  // the sprout, rising from the dent
  g.lineCap = "round"; g.lineWidth = 17; g.strokeStyle = INK; g.beginPath(); g.moveTo(0, -98); g.quadraticCurveTo(-5, -150, 2, -184); g.stroke();
  g.lineWidth = 9; g.strokeStyle = "#4aa83a"; g.beginPath(); g.moveTo(0, -98); g.quadraticCurveTo(-5, -150, 2, -184); g.stroke();
  for (const sgn of [-1, 1]) { g.save(); g.translate(2, -184); g.rotate(sgn * 0.7); g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(sgn * 20, -48, sgn * 86, -64, sgn * 112, -34); g.bezierCurveTo(sgn * 94, 14, sgn * 42, 16, 0, 0); g.closePath(); fillStroke(g, sgn < 0 ? "#5bbf45" : "#3f9f3a", 7); g.restore(); }
  g.restore();
}

// the picture strip over the digits: three cream tiles on the dark frame
function drawStrip(g, w, h) {
  g.fillStyle = "#1c1f23"; g.fillRect(0, 0, w, h);
  const gap = w * 0.016, tw = (w - gap * 4) / 3, th = h - gap * 1.4, y0 = gap * 0.7;
  const draws = [drawPie, drawBurger, drawShake], sc = [1.02, 1.0, 0.8], dy = [-8, 4, 34];
  for (let i = 0; i < 3; i++) {
    const x0 = gap + i * (tw + gap);
    rrPath(g, x0, y0, tw, th, 22); g.fillStyle = "#f4e9cf"; g.fill();
    const gr = g.createLinearGradient(0, y0, 0, y0 + th); gr.addColorStop(0, "rgba(255,255,255,0.5)"); gr.addColorStop(1, "rgba(200,170,120,0.28)"); rrPath(g, x0, y0, tw, th, 22); g.fillStyle = gr; g.fill();
    g.strokeStyle = "#0f1114"; g.lineWidth = 5; rrPath(g, x0, y0, tw, th, 22); g.stroke();
    g.save(); g.translate(x0 + tw / 2, y0 + th / 2 + dy[i]); const k = (th / 400) * sc[i] * 1.18; g.scale(k, k); draws[i](g); g.restore();
  }
}

// ---- the split-flap glyph atlas: 0-9, comma, point, blank; each 128 px wide, white on #15171a, a hinge line at the middle
const NG = 13, GW = 128;
function atlasTex(GH) {
  return canvasTex(NG * GW, GH, (g, w, h) => {
    for (let i = 0; i < NG; i++) {
      const x0 = i * GW;
      g.fillStyle = "#15171a"; g.fillRect(x0, 0, GW, h);
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "rgba(255,255,255,0.05)"); gr.addColorStop(0.5, "rgba(255,255,255,0)"); gr.addColorStop(1, "rgba(255,255,255,0.04)"); g.fillStyle = gr; g.fillRect(x0, 0, GW, h);
      const cap = h * 0.6, base = h / 2 + cap / 2;
      g.fillStyle = "#f4f4ef"; g.textAlign = "center"; g.textBaseline = "alphabetic";
      if (i < 10) { g.font = `900 ${Math.round(cap / 0.73)}px "DejaVu Sans Condensed","Arial Narrow","Liberation Sans Narrow",Arial,sans-serif`; g.fillText(String(i), x0 + GW / 2, base, GW * 0.8); }
      else if (i === 10) { g.beginPath(); g.arc(x0 + GW / 2 - 2, base - 12, 17, 0, Math.PI * 2); g.fill(); g.strokeStyle = "#f4f4ef"; g.lineWidth = 13; g.lineCap = "round"; g.beginPath(); g.moveTo(x0 + GW / 2 + 2, base - 8); g.quadraticCurveTo(x0 + GW / 2 + 6, base + 16, x0 + GW / 2 - 14, base + 34); g.stroke(); }
      else if (i === 11) { g.beginPath(); g.arc(x0 + GW / 2, base - 14, 18, 0, Math.PI * 2); g.fill(); }
      g.fillStyle = "#050607"; g.fillRect(x0, h / 2 - 3, GW, 6);                      // the hinge line
      g.fillStyle = "rgba(255,255,255,0.07)"; g.fillRect(x0, h / 2 + 3, GW, 2);
      g.strokeStyle = "#07080a"; g.lineWidth = 6; g.strokeRect(x0 + 3, 3, GW - 6, h - 6);   // the cell's edge
    }
  });
}
const NCH = 13;
const glyphOf = (ch) => (ch === "," ? 10 : ch === "." ? 11 : ch === " " ? 12 : +ch);
const PRICES = ["4.50", "450.00", "45,000.00", "4,500,000.00", "4,500,000,000"];
const ROWS = PRICES.map((t) => { const a = Array(NCH).fill(12); for (let i = 0; i < t.length; i++) a[NCH - t.length + i] = glyphOf(t[i]); return a; });
const digitOf = (c, j, k = 0) => Math.floor(hs(c + 1, j, 3.7 + k) * 10);

// one cell's state at `stage`: the glyph on show (cur), the one under the flap (nxt) and the flap's angle (0 = up, PI = down)
function cellState(c, stage) {
  const s = clamp(stage, 0, 5);
  if (s > 4) {
    const p = s - 4, P = 60 * (p + 3 * p * p) - ((NCH - 1 - c) * 0.35 + hs(c, 1) * 0.5);
    if (P <= 0) return { cur: ROWS[4][c], nxt: ROWS[4][c], ang: 0 };
    const idx = Math.floor(P), fr = P - idx, g = (j) => (j <= 0 ? ROWS[4][c] : digitOf(c, j, 1));
    return { cur: g(idx), nxt: g(idx + 1), ang: Math.PI * Math.pow(fr, 1.4) };
  }
  const i = Math.min(4, Math.floor(s)), u = s - i;
  if (i >= 4 || u <= 1e-6) return { cur: ROWS[i][c], nxt: ROWS[i][c], ang: 0 };
  const from = ROWS[i][c], to = ROWS[i + 1][c];
  if (from === 12 && to === 12) return { cur: 12, nxt: 12, ang: 0 };
  const n = 3 + Math.floor(hs(c, i, 9.1) * 3), ws = 0.04 + 0.5 * ((NCH - 1 - c) / (NCH - 1)), v = (u - ws) / 0.42;
  if (v <= 0) return { cur: from, nxt: from, ang: 0 };
  if (v >= 1) return { cur: to, nxt: to, ang: 0 };
  const f = v * n, j = Math.floor(f), fr = f - j, seq = (q) => (q <= 0 ? from : q >= n ? to : digitOf(c, i * 8 + q));
  return { cur: seq(j), nxt: seq(j + 1), ang: Math.PI * Math.pow(fr, 1.5) };
}
function setUV(geo, gi, top) {
  const uv = geo.attributes.uv, u0 = (gi + 0.015) / NG, u1 = (gi + 0.985) / NG, v0 = top ? 0.5 : 0, v1 = top ? 1 : 0.5;
  uv.setXY(0, u0, v1); uv.setXY(1, u1, v1); uv.setXY(2, u0, v0); uv.setXY(3, u1, v0); uv.needsUpdate = true;
}

export const TWIST_GRIPS = (() => {
  const AX = TWIST.barrow.axle, P1 = [0.15, 0.285, 0.17], P3 = [TWIST.barrow.handleX, TWIST.barrow.handleY, 0.21];
  const d = [P3[0] - P1[0], P3[1] - P1[1], P3[2] - P1[2]], dl = Math.hypot(...d), pt = (z) => [0, 1, 2].map((i) => P3[i] * (i === 2 ? z : 1) - 0.06 * d[i] * (i === 2 ? z : 1) / dl);
  const r3 = (x) => Math.round(x * 1000) / 1000;
  const L = pt(-1).map(r3), R = pt(1).map(r3);
  // the frame's turn that puts the handle end at y 1.0 (it turns about the axle, rear end up)
  const rx = P3[0] - AX[0], ry = P3[1] - AX[1], rr = Math.hypot(rx, ry), phi = Math.atan2(ry, -rx), FRAME_MAX = Math.asin((1.0 - AX[1]) / rr) - phi;
  const turn = (p, a) => { const x = p[0] - AX[0], y = p[1] - AX[1]; return [r3(AX[0] + x * Math.cos(a) + y * Math.sin(a)), r3(AX[1] - x * Math.sin(a) + y * Math.cos(a)), p[2]]; };
  return { wheelbarrow: { handleL: L, handleR: R, frameMax: FRAME_MAX, handleAt: (dump) => { const a = FRAME_MAX * clamp(dump); return { handleL: turn(L, a), handleR: turn(R, a) }; } } };
})();
const FRAME_MAX = TWIST_GRIPS.wheelbarrow.frameMax;

// a rounded-rect outline, dense points (x, y) running round it
function rrLoop(w, h, r, seg = 10) {
  const pts = [], hw = w / 2 - r, hh = h / 2 - r;
  for (const [cx, cy, a0] of [[hw, hh, 0], [-hw, hh, 90], [-hw, -hh, 180], [hw, -hh, 270]]) for (let i = 0; i <= seg; i++) { const a = (a0 + (90 * i) / seg) * DEG; pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
  return pts;
}
function resample(loop, n) {
  const L = [0]; for (let i = 1; i <= loop.length; i++) { const a = loop[i - 1], b = loop[i % loop.length]; L.push(L[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1])); }
  const tot = L[loop.length], out = [];
  for (let k = 0; k < n; k++) { const d = (k / n) * tot; let i = 1; while (L[i] < d) i++; const a = loop[i - 1], b = loop[i % loop.length], t = (d - L[i - 1]) / (L[i] - L[i - 1] || 1); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); }
  return out;
}
function rod(a, b, r, m, parent, seg = 8) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), len = A.distanceTo(B), o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, seg), m);
  o.position.copy(A).add(B).multiplyScalar(0.5); o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize()); o.castShadow = o.receiveShadow = true; parent.add(o); return o;
}

export const TWIST_KINDS = {
  // ------------------------------------------------------------------------------------------------ the price board
  flipboard(P) {
    const S = P.spec, W = S.w ?? TWIST.board.w, H = S.h ?? TWIST.board.h, D = TWIST.board.d, DROP = S.drop ?? TWIST.board.drop, Z0 = D / 2;
    const bw = H * 0.045, zoneW = W - 2 * bw, split = H / 2 - 0.55 * H;                 // the frame, the strip/digit boundary
    const pitch = (zoneW - 0.024) / NCH, CW = pitch - 0.006, CH = H * 0.38, yc = (split - (-H / 2 + bw)) / 2 + (-H / 2 + bw) - 0.003;
    const body = new THREE.Group(); P.whole.add(body);                                  // the rattling part
    const frameM = mat("#2b2e33", { roughness: 0.45, metalness: 0.3 }), chrome = mat("#c9ced6", { roughness: 0.3, metalness: 0.5 });
    mesh(new THREE.BoxGeometry(W, H, D), frameM, body, 0, 0, 0);
    mesh(new THREE.BoxGeometry(W, 0.007, D + 0.004), chrome, body, 0, H / 2 - 0.0035, 0); mesh(new THREE.BoxGeometry(W, 0.007, D + 0.004), chrome, body, 0, -H / 2 + 0.0035, 0);
    mesh(new THREE.BoxGeometry(0.007, H, D + 0.004), chrome, body, -W / 2 + 0.0035, 0, 0); mesh(new THREE.BoxGeometry(0.007, H, D + 0.004), chrome, body, W / 2 - 0.0035, 0, 0);
    // the picture strip
    const stripH = H / 2 - bw - (split + 0.01), stripY = (H / 2 - bw + split + 0.01) / 2, sw = 2048, sh = Math.round(sw * stripH / zoneW);
    const stripM = mat("#ffffff", { map: canvasTex(sw, sh, (g, w, h) => drawStrip(g, w, h)), roughness: 0.55 });
    mesh(new THREE.PlaneGeometry(zoneW, stripH), stripM, body, 0, stripY, Z0 + 0.0008).castShadow = false;
    // the digit zone: a grey housing, one black recess per cell (the hole when the flaps are gone)
    const zoneH = (split - 0.004) - (-H / 2 + bw), zoneY = (split - 0.004 + (-H / 2 + bw)) / 2;
    mesh(new THREE.PlaneGeometry(zoneW, zoneH), mat("#23262b", { roughness: 0.6 }), body, 0, zoneY, Z0 + 0.0008).castShadow = false;
    const AH = Math.round(GW * CH / CW), atlas = atlasTex(AH);
    const flapM = new THREE.MeshStandardMaterial({ map: atlas, roughness: 0.85, metalness: 0 }); flapM.userData.noHatch = true;
    const cells = [], cards = [];
    const rodM = mat("#6b7078", { roughness: 0.4, metalness: 0.6 }), holeM = mat("#020203", { roughness: 0.9 }), brM = mat("#3a3d44", { roughness: 0.5, metalness: 0.4 });
    for (let c = 0; c < NCH; c++) {
      const cx = -zoneW / 2 + 0.012 + pitch * (c + 0.5);
      see(mesh(new THREE.PlaneGeometry(CW + 0.003, CH + 0.003), holeM, body, cx, yc, Z0 + 0.0016));
      see(mesh(new THREE.CylinderGeometry(0.0016, 0.0016, CW + 0.002, 6), rodM, body, cx, yc, Z0 + 0.0042)).rotation.z = Math.PI / 2;
      for (const s of [-1, 1]) see(mesh(new THREE.BoxGeometry(0.004, 0.012, 0.006), brM, body, cx + s * (CW / 2 - 0.002), yc, Z0 + 0.0035));
      const mk = () => { const g = new THREE.PlaneGeometry(CW, CH / 2), o = see(new THREE.Mesh(g, flapM)); o.receiveShadow = true; P.whole.add(o); return o; };
      const backTop = mk(), backBot = mk();
      const pivot = new THREE.Group(), card = new THREE.Group(); pivot.add(card); P.whole.add(pivot);
      const fg = new THREE.PlaneGeometry(CW, CH / 2), fgB = new THREE.PlaneGeometry(CW, CH / 2);
      const front = see(new THREE.Mesh(fg, flapM)), back = see(new THREE.Mesh(fgB, flapM)); front.position.z = 0.0003; back.position.z = -0.0003; back.rotation.x = Math.PI; card.add(front, back);
      front.receiveShadow = back.receiveShadow = true;
      cells.push({ cx, backTop, backBot, pivot, card, front, back, c });
      // 3 cards per cell, each on its own arc (hash of the cell and the card)
      for (let j = 0; j < 3; j++) {
        const s0 = 0.5 * hs(c + 1, j, 11.3), side = cx < 0 ? -1 : 1;
        cards.push({ c, j, s0, lz: 0.3 + 2.0 * hs(c + 1, j, 12.7), lx: cx * 1.45 + side * 0.25 + (hs(c + 1, j, 13.9) - 0.5) * 1.1, pop: 0.12 + 0.34 * hs(c + 1, j, 14.1), ph: hs(c + 1, j, 15.5) * 6.28, yaw: hs(c + 1, j, 16.2) * 6.28, n: [Math.floor(hs(c + 1, j, 17.1) * 3) - 1, Math.floor(hs(c + 1, j, 18.3) * 3) - 1, Math.floor(hs(c + 1, j, 19.7) * 3) - 1], lay: hs(c + 1, j, 20.1) * 0.006, flap: j === 0 });
      }
    }
    const tmpE = new THREE.Euler(0, 0, 0, "YXZ");
    return {
      grip: 0,
      apply(ps, t) {
        const stage = ps.stage ?? S.stage ?? 0, blow = clamp(ps.blow ?? S.blow ?? 0), clock = ps.clock ?? t ?? 0;
        // the rattle: from stage 4.2, dying away as the board empties
        const amp = ss((stage - 4.2) / 0.8) * (1 - ss((blow - 0.75) / 0.25)), ra = amp * 1.5 * DEG * (0.6 * Math.sin(clock * 53) + 0.4 * Math.sin(clock * 89 + 1)), rx = amp * 0.01 * Math.sin(clock * 71 + 2), ry = amp * 0.006 * Math.sin(clock * 97 + 4);
        body.position.set(rx, ry, 0); body.rotation.set(0, 0, ra);
        const rat = (v) => { const x = v.x, y = v.y; v.x = x * Math.cos(ra) - y * Math.sin(ra) + rx; v.y = x * Math.sin(ra) + y * Math.cos(ra) + ry; return v; };   // a rest point in the rattled board
        const zp = Z0 + 0.0058;
        for (const C of cells) {
          const st = cellState(C.c, stage);
          setUV(C.backTop.geometry, st.nxt, true); setUV(C.backBot.geometry, st.cur, false);
          setUV(C.front.geometry, st.cur, true); setUV(C.back.geometry, st.nxt, false);
          C.rest = { top: rat(new THREE.Vector3(C.cx, yc + CH / 4, Z0 + 0.003)), bot: rat(new THREE.Vector3(C.cx, yc - CH / 4, Z0 + 0.003)), flap: rat(new THREE.Vector3(C.cx, yc + (CH / 4) * Math.cos(st.ang), zp + (CH / 4) * Math.sin(st.ang))), hinge: rat(new THREE.Vector3(C.cx, yc, zp)), ang: st.ang };
        }
        // the cards: at rest in the board (rattling with it), then each on its arc
        const fly = (obj, rest, restAng, cd, isFlap, C) => {
          const k = clamp((blow - cd.s0) / 0.5);
          const e = restAng + ra;
          if (k <= 0) {
            if (isFlap) { C.card.position.set(0, CH / 4, 0); C.pivot.position.copy(rest.hinge); C.pivot.rotation.set(rest.ang, 0, ra, "YXZ"); C.pivot.scale.setScalar(1); }
            else { obj.position.copy(restAng === 0 && obj === C.backTop ? rest.top : rest.bot); obj.rotation.set(0, 0, ra); obj.scale.setScalar(1); }
            return;
          }
          const p0 = isFlap ? rest.flap : (obj === C.backTop ? rest.top : rest.bot);
          const h = 1 - Math.pow(1 - k, 2.4), fall = Math.pow(k, 1.5), yF = -DROP + 0.003 + cd.lay;
          const sway = (1 - k);
          const x = p0.x + (cd.lx - p0.x) * h + Math.sin(k * 9 + cd.ph) * 0.1 * sway, z = p0.z + (cd.lz - p0.z) * h + Math.cos(k * 7 + cd.ph) * 0.08 * sway;
          const y = p0.y + (yF - p0.y) * fall + cd.pop * Math.sin(Math.PI * clamp(k / 0.45)) * (1 - 0 * k);
          const sm = ss(k), eo = 1 - Math.pow(1 - k, 2), fl = (1 - k) * 0.35 * Math.sin(k * 11 + cd.ph);
          tmpE.set(e * (1 - sm) + (-Math.PI / 2) * sm + 2 * Math.PI * cd.n[0] * eo + fl, cd.yaw * sm + 2 * Math.PI * cd.n[1] * eo, 2 * Math.PI * cd.n[2] * eo + fl * 0.6, "YXZ");
          const sc = 1 + 0.3 * sm;
          if (isFlap) { C.card.position.set(0, 0, 0); C.pivot.rotation.copy(tmpE); C.pivot.position.set(x, y, z); C.pivot.scale.setScalar(sc); }
          else { obj.rotation.copy(tmpE); obj.position.set(x, y, z); obj.scale.setScalar(sc); }
        };
        for (const cd of cards) {
          const C = cells[cd.c];
          if (cd.j === 0) fly(C.pivot, C.rest, C.rest.ang, cd, true, C);
          else if (cd.j === 1) fly(C.backTop, C.rest, 0, cd, false, C);
          else fly(C.backBot, C.rest, 0, cd, false, C);
        }
      },
    };
  },

  // ------------------------------------------------------------------------------------------------ the wheelbarrow
  wheelbarrow(P) {
    const S = P.spec, AX = TWIST.barrow.axle;
    const red = mat("#c8443a", { roughness: 0.4, metalness: 0.2, side: THREE.DoubleSide }), redD = mat("#b03a31", { roughness: 0.4, metalness: 0.25 });
    const wood = mat("#a9773f", { roughness: 0.7 }), steel = mat("#4a4d55", { roughness: 0.45, metalness: 0.5 }), tyre = mat("#26282c", { roughness: 0.85 }), metal = mat("#b8bec7", { roughness: 0.35, metalness: 0.6 });
    const tray = new THREE.Group(), frame = new THREE.Group(), wheel = new THREE.Group(), cash = new THREE.Group();
    for (const g of [tray, frame, wheel]) { g.position.set(...AX); P.whole.add(g); }
    P.whole.add(cash);
    const rel = (p) => [p[0] - AX[0], p[1] - AX[1], p[2] - AX[2]];
    // the tray: a sloped open box (rim 0.62 x 0.5 at y 0.52, floor 0.38 x 0.30 at y 0.28), a rolled rim
    const TX = 0.31, TZ = 0.25, BX = 0.19, BZ = 0.15, Y0 = 0.28, Y1 = 0.52;
    const cr = (x, y, z) => rel([x, y, z]);
    const quads = [[cr(-BX, Y0, -BZ), cr(BX, Y0, -BZ), cr(BX, Y0, BZ), cr(-BX, Y0, BZ)], [cr(TX, Y1, -TZ), cr(TX, Y1, TZ), cr(BX, Y0, BZ), cr(BX, Y0, -BZ)], [cr(-TX, Y1, TZ), cr(-TX, Y1, -TZ), cr(-BX, Y0, -BZ), cr(-BX, Y0, BZ)], [cr(TX, Y1, TZ), cr(-TX, Y1, TZ), cr(-BX, Y0, BZ), cr(BX, Y0, BZ)], [cr(-TX, Y1, -TZ), cr(TX, Y1, -TZ), cr(BX, Y0, -BZ), cr(-BX, Y0, -BZ)]];
    const pos = []; for (const [a, b, c, d] of quads) pos.push(...a, ...b, ...c, ...a, ...c, ...d);
    const tg = new THREE.BufferGeometry(); tg.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); tg.computeVertexNormals();
    const tr = new THREE.Mesh(tg, red); tr.castShadow = tr.receiveShadow = true; tray.add(tr);
    const rim = (len, x, z, ry) => { const o = mesh(new THREE.BoxGeometry(len, 0.024, 0.026), redD, tray, ...rel([x, Y1, z])); o.rotation.y = ry; };
    rim(2 * TZ + 0.026, TX, 0, Math.PI / 2); rim(2 * TZ + 0.026, -TX, 0, Math.PI / 2); rim(2 * TX + 0.026, 0, TZ, 0); rim(2 * TX + 0.026, 0, -TZ, 0);
    // the frame: wooden handles (r 0.016) from under the tray out to x -0.72, a cross brace, steel forks to the axle, legs
    for (const s of [-1, 1]) {
      const P1 = [0.15, 0.285, 0.17 * s], P3 = [TWIST.barrow.handleX, TWIST.barrow.handleY, 0.21 * s];
      rod(rel(P1), rel(P3), 0.016, wood, frame); mesh(new THREE.SphereGeometry(0.0185, 10, 8), wood, frame, ...rel(P3));
      rod(rel([AX[0], AX[1], 0.085 * s]), rel(P1), 0.014, steel, frame);
      rod(rel([-0.20, 0.37, 0.2 * s]), rel([-0.29, 0.0, 0.205 * s]), 0.015, steel, frame); mesh(new THREE.BoxGeometry(0.09, 0.02, 0.05), steel, frame, ...rel([-0.29, 0.01, 0.205 * s]));
    }
    rod(rel([-0.45, 0.433, -0.2]), rel([-0.45, 0.433, 0.2]), 0.013, wood, frame);
    rod(rel([0.12, 0.3, -0.17]), rel([0.12, 0.3, 0.17]), 0.013, steel, frame);
    // the wheel: a dark tyre with tread blocks, a steel hub and six spokes, on an axle through the forks
    const spin = new THREE.Group(); wheel.add(spin);
    mesh(new THREE.TorusGeometry(0.118, 0.032, 10, 32), tyre, spin);
    for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2, b = mesh(new THREE.BoxGeometry(0.018, 0.02, 0.07), mat("#17181b", { roughness: 0.9 }), spin, Math.cos(a) * 0.148, Math.sin(a) * 0.148, 0); b.rotation.z = a; }
    mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.05, 14), metal, spin).rotation.x = Math.PI / 2;
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2, b = mesh(new THREE.BoxGeometry(0.1, 0.014, 0.014), metal, spin, Math.cos(a) * 0.065, Math.sin(a) * 0.065, 0); b.rotation.z = a; }
    mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.2, 8), steel, wheel).rotation.x = Math.PI / 2;
    // the cash: bundles (green, two cream bands) piled in a mound, loose notes on top and over the rim
    const bundleTex = canvasTex(128, 64, (g, w, h) => {
      g.fillStyle = "#7fae6a"; g.fillRect(0, 0, w, h); g.strokeStyle = "rgba(40,80,40,0.55)"; g.lineWidth = 3; g.strokeRect(4, 4, w - 8, h - 8);
      g.fillStyle = "rgba(235,245,215,0.7)"; g.beginPath(); g.ellipse(w / 2, h / 2, 14, 18, 0, 0, Math.PI * 2); g.fill(); g.strokeStyle = "rgba(40,80,40,0.6)"; g.lineWidth = 2; g.stroke();
      g.fillStyle = "#f1e8c8"; g.fillRect(w * 0.18, 0, w * 0.1, h); g.fillRect(w * 0.72, 0, w * 0.1, h);
      g.fillStyle = "rgba(0,0,0,0.12)"; g.fillRect(w * 0.18, 0, 2, h); g.fillRect(w * 0.28 - 2, 0, 2, h); g.fillRect(w * 0.72, 0, 2, h); g.fillRect(w * 0.82 - 2, 0, 2, h);
    });
    const noteTex = canvasTex(128, 64, (g, w, h) => {
      g.fillStyle = "#8fbb7a"; g.fillRect(0, 0, w, h); g.strokeStyle = "rgba(40,80,40,0.6)"; g.lineWidth = 3; g.strokeRect(5, 5, w - 10, h - 10);
      g.fillStyle = "rgba(235,245,215,0.75)"; g.beginPath(); g.ellipse(w / 2, h / 2, 16, 19, 0, 0, Math.PI * 2); g.fill(); g.stroke();
    });
    const bm = mat("#ffffff", { map: bundleTex, roughness: 0.8 }), nm = mat("#ffffff", { map: noteTex, roughness: 0.8 });
    const R = rng(7), pieces = [], bg = new THREE.BoxGeometry(0.2, 0.045, 0.09), ng = new THREE.BoxGeometry(0.15, 0.003, 0.066);
    const hMound = (x, z) => { const q = (x / 0.36) ** 2 + (z / 0.28) ** 2; return q >= 1 ? 0.3 : 0.3 + 0.6 * Math.sqrt(1 - q); };
    const ax = (y) => (y < Y1 ? BX + (TX - BX) * ((y - Y0) / (Y1 - Y0)) : 0.4) - 0.02, az = (y) => (y < Y1 ? BZ + (TZ - BZ) * ((y - Y0) / (Y1 - Y0)) : 0.4) - 0.02;
    const add = (kind, x, y, z, rx, ry, rz) => {
      const o = new THREE.Mesh(kind === "b" ? bg : ng, kind === "b" ? bm : nm); o.castShadow = false; o.receiveShadow = true; see(o); cash.add(o);
      const f = clamp((x + 0.31) / 0.62), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, "YXZ"));
      pieces.push({ o, p: new THREE.Vector3(x, y, z), q, d: 0.22 + 0.33 * (1 - f) + 0.05 * R(), h1: R(), h2: R(), h3: R(), n: [Math.floor(R() * 3) - 1, Math.floor(R() * 3) - 1] });
    };
    for (let l = 0, y = 0.3; y < 0.9 - 0.02; l++, y += 0.047) {
      const cols = l % 2 ? [-0.21, 0, 0.21] : [-0.105, 0.105];
      for (let zi = -3; zi <= 3; zi++) {
        const zz = zi * 0.098;
        for (const cxx of cols) {
          const x = cxx + (R() - 0.5) * 0.03, z = zz + (R() - 0.5) * 0.02;
          if (hMound(x, z) < y + 0.04 || Math.abs(x) > ax(y) - 0.07 || Math.abs(z) > az(y) - 0.03) continue;
          add("b", x, y + 0.0225, z, (R() - 0.5) * 0.18, (R() - 0.5) * 0.7 + (l % 2 ? 0.25 : 0), (R() - 0.5) * 0.18);
        }
      }
    }
    for (let i = 0; i < 50; i++) {
      const a = R() * 6.283, r = Math.sqrt(R()), x = Math.cos(a) * r * 0.29, z = Math.sin(a) * r * 0.24, y = hMound(x, z) + 0.012;
      add("n", x, y, z, (R() - 0.5) * 0.5, R() * 6.283, (R() - 0.5) * 0.5);
    }
    for (const [x, z, rz, rx] of [[0.3, 0.1, -0.7, 0.2], [0.29, -0.12, -0.8, -0.3], [-0.05, 0.255, 0.1, 0.8], [0.1, -0.26, 0.2, -0.8], [-0.2, 0.25, 0.3, 0.9]]) add("n", x, 0.5 + 0.03, z, rx, 0, rz);
    const zAx = new THREE.Vector3(0, 0, 1), qT = new THREE.Quaternion(), qS = new THREE.Quaternion(), eS = new THREE.Euler(), tv = new THREE.Vector3(), lip = new THREE.Vector3(), AXv = new THREE.Vector3(...AX);
    const toWorld = (q, a) => tv.copy(q).sub(AXv).applyQuaternion(qT.setFromAxisAngle(zAx, -a)).add(AXv);
    return {
      grip: 0,
      apply(ps) {
        const dump = clamp(ps.dump ?? S.dump ?? 0), load = clamp(ps.load ?? S.load ?? 1), wheelDeg = ps.wheel ?? ps.roll ?? S.wheel ?? 0;
        P.root.rotation.z = -(ps.tilt ?? 0) * DEG;                                      // `roll` is the wheel's turn here, not a lean
        const aT = 55 * DEG * dump, aF = FRAME_MAX * dump;
        tray.rotation.z = -aT; frame.rotation.z = -aF; spin.rotation.z = -wheelDeg * DEG;
        cash.visible = load > 0.002;
        const bot = new THREE.Vector3(0, 0.29, 0);
        qT.setFromAxisAngle(zAx, -aT); const qTray = qT.clone();
        for (const pc of pieces) {
          const k = clamp((dump - pc.d) / 0.36);
          if (k >= 1 || load <= 0.002) { pc.o.visible = false; continue; }
          pc.o.visible = true;
          const sc = Math.max(load, 0.001), base = bot.clone().add(pc.p.clone().sub(bot).multiplyScalar(sc));
          const kA = clamp(k / 0.4), eA = kA * kA * (3 - 2 * kA);
          const local = base.clone(); local.x += (0.4 - base.x) * eA; local.y += (Math.max(base.y, 0.56) - base.y) * eA; local.z *= 1 + 0.3 * eA;
          const w0 = toWorld(local, aT).clone();
          qS.copy(qTray).multiply(pc.q); eS.set(0, 0, -0.8 * eA * (pc.h1 > 0.5 ? 1 : -1)); qS.multiply(new THREE.Quaternion().setFromEuler(eS));
          let sz = sc;
          if (k > 0.4) {
            const kB = (k - 0.4) / 0.6, Lx = 0.72 + 0.55 * pc.h1, Lz = (pc.h2 - 0.5) * 0.7, Ly = 0.03 + 0.04 * pc.h3;
            lip.copy(w0); const e = 1 - Math.pow(1 - kB, 1.6);
            w0.set(lip.x + (Lx - lip.x) * e, lip.y + (Ly - lip.y) * kB * kB, lip.z + (Lz - lip.z) * e);
            qS.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(2 * Math.PI * pc.n[0] * kB * 0.8, 0, 2 * Math.PI * pc.n[1] * kB * 0.8)));
            if (kB > 0.88) sz *= 1 - (kB - 0.88) / 0.12;
          }
          pc.o.position.copy(w0); pc.o.quaternion.copy(qS); pc.o.scale.setScalar(Math.max(sz, 0.001));
        }
      },
    };
  },

  // ------------------------------------------------------------------------------------------------ the diner's sign
  dinersign(P) {
    const S = P.spec, W = S.w ?? TWIST.sign.w, H = S.h ?? TWIST.sign.h, T = 0.08, R = 0.09, POLE = TWIST.sign.pole;
    const steel = mat("#7d838c", { roughness: 0.45, metalness: 0.5 });
    mesh(new THREE.CylinderGeometry(0.04, 0.045, POLE, 12), steel, P.whole, 0, -H / 2 - POLE / 2, 0);
    mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.05, 14), steel, P.whole, 0, -H / 2 - 0.02, 0);
    const bd = new THREE.Group(); P.whole.add(bd);
    const shape = new THREE.Shape(), hw = W / 2 - R, hh = H / 2 - R;
    shape.moveTo(-hw, -H / 2); shape.lineTo(hw, -H / 2); shape.absarc(hw, -hh, R, -Math.PI / 2, 0); shape.lineTo(W / 2, hh); shape.absarc(hw, hh, R, 0, Math.PI / 2); shape.lineTo(-hw, H / 2); shape.absarc(-hw, hh, R, Math.PI / 2, Math.PI); shape.lineTo(-W / 2, -hh); shape.absarc(-hw, -hh, R, Math.PI, Math.PI * 1.5);
    const eg = new THREE.ExtrudeGeometry(shape, { depth: T, bevelEnabled: false, curveSegments: 10 }); eg.translate(0, 0, -T / 2);
    mesh(eg, mat("#d8cdb0", { roughness: 0.5 }), bd);
    const faceG = () => { const g = new THREE.ShapeGeometry(shape, 10), p = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / W + 0.5, p.getY(i) / H + 0.5); return g; };
    const cw = 800, ch = Math.round(cw * H / W);
    const sheet = (draw) => canvasTex(cw, ch, (g, w, h) => {
      const gr = g.createRadialGradient(w / 2, h / 2, 40, w / 2, h / 2, w * 0.62); gr.addColorStop(0, "#fbf3df"); gr.addColorStop(1, "#f1e4c4"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.fillStyle = "rgba(226,59,51,0.18)"; for (const [x, y] of [[90, 110], [710, 110], [90, 450], [710, 450], [150, 280], [650, 280]]) { g.beginPath(); for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 - Math.PI / 2, r = i % 2 ? 11 : 26; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } g.closePath(); g.fill(); }
      g.save(); g.translate(w / 2, h / 2 + 8); draw(g); g.restore();
    });
    const frontTex = sheet((g) => { g.scale(1.02, 1.02); g.translate(0, 18); drawShake(g); }), backTex = sheet((g) => { g.scale(0.97, 0.97); g.translate(0, 14); drawHat(g); });
    const faceM = [frontTex, backTex].map((m) => new THREE.MeshStandardMaterial({ map: m, roughness: 0.5 }));
    const ff = new THREE.Mesh(faceG(), faceM[0]); ff.position.z = T / 2 + 0.0008; bd.add(ff);
    const fb = new THREE.Mesh(faceG(), faceM[1]); fb.rotation.y = Math.PI; fb.position.z = -T / 2 - 0.0008; bd.add(fb);
    for (const o of [ff, fb]) o.castShadow = false;
    // the red neon border (a tube round the face) and a ring of bulbs, on both faces
    const neonM = new THREE.MeshStandardMaterial({ color: "#e23b33", roughness: 0.35 }), bulbM = new THREE.MeshStandardMaterial({ color: "#ffe6a0", roughness: 0.3 });
    const nPts = resample(rrLoop(W - 0.09, H - 0.09, R - 0.04, 12), 160), bPts = resample(rrLoop(W - 0.19, H - 0.19, R - 0.1, 12), 30);
    for (const s of [1, -1]) {
      const curve = new THREE.CatmullRomCurve3(nPts.map(([x, y]) => new THREE.Vector3(x * s, y, s * (T / 2 + 0.004))), true);
      const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 200, 0.011, 6, true), neonM); tube.castShadow = false; bd.add(tube);
      for (const [x, y] of bPts) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.0155, 8, 6), bulbM); b.position.set(x * s, y, s * (T / 2 + 0.01)); b.castShadow = false; bd.add(b); }
    }
    // the snow on the top edge
    const snow = new THREE.Group(); bd.add(snow); snow.visible = !!S.snow;
    const snowM = mat("#eef3f8", { roughness: 0.9 });
    for (let i = 0; i < 12; i++) { const x = -0.4 + i * 0.073 + (hs(i, 3) - 0.5) * 0.02, r = 0.028 + 0.02 * hs(i, 5), o = mesh(new THREE.SphereGeometry(r, 10, 8), snowM, snow, x, H / 2 + 0.004 - (Math.abs(x) > 0.36 ? 0.03 : 0), (hs(i, 7) - 0.5) * 0.02); o.scale.set(1.3, 0.62, 1.15); }
    const cDay = new THREE.Color("#ffffff"), cDead = new THREE.Color("#6f7d99"), cNeon = new THREE.Color("#e23b33"), cNeonDead = new THREE.Color("#5b4650"), cBulb = new THREE.Color("#ffe6a0"), cBulbDead = new THREE.Color("#5f6672"), eNeon = new THREE.Color("#ff2a1f"), eBulb = new THREE.Color("#ffd46b");
    return {
      grip: 0,
      apply(ps) {
        const lit = clamp(ps.lit ?? S.lit ?? 0);
        bd.rotation.y = clamp(ps.flip ?? 0) * Math.PI;
        for (const m of faceM) m.color.copy(cDead).lerp(cDay, lit);
        neonM.color.copy(cNeonDead).lerp(cNeon, lit); neonM.emissive.copy(eNeon); neonM.emissiveIntensity = 1.25 * lit;
        bulbM.color.copy(cBulbDead).lerp(cBulb, lit); bulbM.emissive.copy(eBulb); bulbM.emissiveIntensity = 1.5 * lit;
      },
    };
  },
};
