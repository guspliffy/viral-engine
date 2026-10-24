/* Props drawn in the game's style: flat fills, a dark ink outline (the game's OUT), a light strip for the shine.
   Units are game units (a fighter is about 64 tall, 44 wide). Each prop is drawn about its base centre: (0, 0) is
   where it stands, up is negative y. Runs in the game's scope (OUT, TAU-free: uses Math.PI).

   PROPS[kind] = { w (width, for splitting), draw(c, s, t) }   s = the prop's state (see runtime.js):
     split 0..1   the prop breaks in two down the middle: the halves slide apart and tip outwards (gap, tilt)
     glow 0..1    a coloured glow behind it (glowCol);  lid 0..1 (jar: the lid pops off);  fill (cup: how full)
     time         (clock) the hour as a number, 2.75 = 2:45 */

const INK = () => OUT;
const shine = (c, x, y, w, h, a = 0.35) => { c.fillStyle = `rgba(255,255,255,${a})`; c.fillRect(x, y, w, h); };
function inked(c, lw) { c.strokeStyle = INK(); c.lineWidth = lw; c.lineJoin = "round"; c.lineCap = "round"; c.fill(); c.stroke(); }

const PROPS = {
  // a small kitchen table, seen from the side: the top at y = -34 (about a seated potato's chest)
  table: { w: 110, draw(c, s) {
    const w = 110, top = -34, wood = s.color || "#b9783f", dark = "#8a5428";
    c.fillStyle = dark;
    for (const x of [-w / 2 + 8, w / 2 - 14]) { c.beginPath(); c.roundRect(x, top + 6, 6, -top - 6, [0, 0, 2, 2]); inked(c, 2); }
    c.fillStyle = dark; c.beginPath(); c.rect(-w / 2 + 8, top + 8, w - 16, 4); inked(c, 1.5);   // the apron under the top
    c.fillStyle = wood; c.beginPath(); c.roundRect(-w / 2, top - 1, w, 8, 3); inked(c, 2.5);
    shine(c, -w / 2 + 3, top, w - 6, 2, 0.3);
  } },
  // a chair, side on: seat at y = -14 (a sitting potato's feet dangle), the back on the side away from `face`
  chair: { w: 30, draw(c, s) {
    const back = -(s.face || 1), wood = s.color || "#a8683a", dark = "#7d4a25", seat = -14;
    c.fillStyle = dark;
    for (const x of [-12, 9]) { c.beginPath(); c.roundRect(x, seat + 3, 4, -seat - 3, [0, 0, 1.5, 1.5]); inked(c, 1.8); }
    c.fillStyle = wood; c.beginPath(); c.roundRect(back * 12 - 2.5, -56, 5, 56 + seat + 3, 2); inked(c, 2);   // the back post
    c.fillStyle = dark; c.beginPath(); c.roundRect(back * 12 - 3.5, -52, 7, 14, 2); inked(c, 1.8);   // the back rest, seen edge-on
    c.fillStyle = wood; c.beginPath(); c.roundRect(-15, seat - 4, 30, 6, 2); inked(c, 2.2);
    shine(c, -13, seat - 3, 26, 1.5, 0.3);
  } },
  // a wall clock (hang it with y about -110); s.time is the hour it shows
  clock: { w: 30, draw(c, s) {
    const r = 15, y = -r, tm = s.time ?? 2.75;
    c.fillStyle = s.color || "#c0392b"; c.beginPath(); c.arc(0, y, r, 0, Math.PI * 2); inked(c, 2.5);
    c.fillStyle = "#f4efe2"; c.beginPath(); c.arc(0, y, r * 0.8, 0, Math.PI * 2); c.fill();
    c.fillStyle = INK();
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2, q = i % 3 ? 1 : 1.8; c.fillRect(Math.cos(a) * r * 0.66 - q / 2, y + Math.sin(a) * r * 0.66 - q / 2, q, q); }
    const hand = (a, l, w) => { c.lineWidth = w; c.strokeStyle = INK(); c.lineCap = "round"; c.beginPath(); c.moveTo(0, y); c.lineTo(Math.sin(a) * l, y - Math.cos(a) * l); c.stroke(); };
    hand(((tm % 12) / 12) * Math.PI * 2, r * 0.42, 2); hand(((tm % 1)) * Math.PI * 2, r * 0.62, 1.4);
    c.fillStyle = INK(); c.beginPath(); c.arc(0, y, 1.4, 0, Math.PI * 2); c.fill();
  } },
  // a teacup on its saucer; s.fill 0..1 how much tea shows, s.color the cup
  teacup: { w: 18, draw(c, s) {
    const col = s.color || "#f2efe6";
    c.fillStyle = col; c.beginPath(); c.ellipse(0, -1.5, 9, 2, 0, 0, Math.PI * 2); inked(c, 1.3);   // saucer
    c.beginPath(); c.arc(6.5, -7, 3, -1.2, 1.4); c.strokeStyle = INK(); c.lineWidth = 3.2; c.stroke(); c.strokeStyle = col; c.lineWidth = 1.4; c.stroke();   // handle
    c.fillStyle = col; c.beginPath(); c.moveTo(-6, -11); c.lineTo(6, -11); c.quadraticCurveTo(5.5, -2.5, 0, -2.5); c.quadraticCurveTo(-5.5, -2.5, -6, -11); c.closePath(); inked(c, 1.5);
    if ((s.fill ?? 1) > 0.05) { c.fillStyle = "#9a5a2a"; c.beginPath(); c.ellipse(0, -11, 5.4, 1.3, 0, 0, Math.PI * 2); c.fill(); }
    c.strokeStyle = s.trim || "#5b8fd1"; c.lineWidth = 1; c.beginPath(); c.moveTo(-5.6, -9); c.lineTo(5.6, -9); c.stroke();
  } },
  // a pickle jar: glass, three pickles, a lid. s.glow turns it red and glowing, s.lid pops the lid up and away
  jar: { w: 24, draw(c, s, t) {
    const w = 22, h = 28, g = s.glow || 0, lid = s.lid || 0;
    if (g > 0) {
      const pul = 0.85 + 0.15 * Math.sin(t * 9), rg = c.createRadialGradient(0, -h / 2, 2, 0, -h / 2, 38);
      rg.addColorStop(0, `rgba(255,40,30,${0.55 * g * pul})`); rg.addColorStop(1, "rgba(255,40,30,0)");
      c.fillStyle = rg; c.beginPath(); c.arc(0, -h / 2, 38, 0, Math.PI * 2); c.fill();
    }
    c.fillStyle = g > 0 ? `rgba(${Math.round(200 + 55 * g)},${Math.round(225 - 160 * g)},${Math.round(200 - 150 * g)},0.55)` : "rgba(200,225,200,0.55)";
    c.beginPath(); c.roundRect(-w / 2, -h, w, h, 5); c.fill();
    const pick = g > 0.5 ? "#c8402e" : "#6f9a2e";   // the pickles inside
    for (const [x, y, a] of [[-4.5, -9, 0.3], [3.5, -11, -0.2], [-0.5, -19, 0.1]]) { c.fillStyle = pick; c.beginPath(); c.ellipse(x, y, 3.2, 7, a, 0, Math.PI * 2); inked(c, 1.2); }
    c.fillStyle = "rgba(255,255,255,0.0)"; c.beginPath(); c.roundRect(-w / 2, -h, w, h, 5); c.strokeStyle = INK(); c.lineWidth = 2; c.stroke();
    shine(c, -w / 2 + 3, -h + 4, 2.5, h - 9, 0.45);
    c.save(); c.translate(lid * 14, -h - lid * 34); c.rotate(lid * 2.6);
    c.fillStyle = "#c9a227"; c.beginPath(); c.roundRect(-w / 2 - 1, -5, w + 2, 6, 2); inked(c, 2); shine(c, -w / 2 + 1, -4, w - 2, 1.3, 0.4);
    c.restore();
  } },
  // a round cookie with chips, side-on it reads as a disc: drawn face-on, about 16 across
  cookie: { w: 16, draw(c, s) {
    c.fillStyle = s.color || "#d9a253"; c.beginPath(); c.arc(0, -8, 8, 0, Math.PI * 2); inked(c, 1.8);
    c.fillStyle = "#5a3418"; for (const [x, y] of [[-3, -10], [2.5, -5], [3, -11.5], [-2, -4.5], [0, -8.5]]) { c.beginPath(); c.arc(x, y, 1.1, 0, Math.PI * 2); c.fill(); }
    shine(c, -5, -13, 4, 1.2, 0.35);
  } },
  // a plate, side-on (a flat dish) about 30 across
  plate: { w: 30, draw(c, s) {
    c.fillStyle = s.color || "#ece7da"; c.beginPath(); c.moveTo(-15, -4); c.lineTo(15, -4); c.lineTo(10, 0); c.lineTo(-10, 0); c.closePath(); inked(c, 1.8);
    c.fillStyle = s.trim || "#5b8fd1"; c.fillRect(-13, -3.4, 26, 1);
  } },
};

// one prop in its state, split if s.split > 0: each half clipped at the middle, slid apart and tipped outwards about its foot
function drawProp(c, kind, s, t) {
  const P = PROPS[kind];
  if (!P) throw new Error(`unknown prop "${kind}" (props: ${Object.keys(PROPS).join(", ")})`);
  c.save(); c.translate(s.x || 0, s.y || 0); c.rotate(s.rot || 0); c.scale((s.flip ? -1 : 1) * (s.scale ?? 1), s.scale ?? 1);
  c.globalAlpha *= s.alpha ?? 1;
  const k = s.split || 0;
  if (k <= 0) P.draw(c, s, t);
  else {
    const gap = (s.gap ?? P.w * 0.45) * k, tilt = (s.tilt ?? 0.35) * k;
    for (const side of [-1, 1]) {
      c.save(); c.translate(side * gap, 0); c.rotate(side * tilt);
      c.beginPath(); c.rect(side < 0 ? -400 : 0, -400, 400, 800); c.clip();
      P.draw(c, s, t);
      c.restore();
    }
  }
  c.restore();
}
