import * as THREE from "three";
import { clamp, P, S, keys, spin, phi, flicker, alphaDeg, sunAt, moonAt, sunRho, storm, psi } from "./spin-tracks.js";

// props-spinsky.js: fact what-if 03 "Earth spins faster" (21 Nov 2026): the sky, the natural counter of the film.
// Design: storyboards/series/facts/03-spin/DESIGN.md sections 0 (tracks, budgets), B1-B4, B6, B7 (sky wheel, sun smear, terminator,
// stars, moon, clouds, comfort) and D (the hurricane). B5 (the room light) is the room builder's. Bench: 03-spin/bench/make-sky-bench.mjs.
// All three kinds are world-placed at the stage origin (x 0, y 0, z 0, rot 0, scale 1), self-lit, look-only (no shadow, no contact
// oval, no hand ray, not solid, no ink line), no grip. Every frame is a pure function of ONE param `t` = clip seconds (the director
// tweens it linear: c.prop(0, id, { t: 0 }, 0, "linear"); c.prop(77.5, id, { t: 77.5 }, 77.5, "linear")); also spec.t. Seed 31703.
// No random, no clock. Needs the storyboard key "far": 6000. Registry (already in props3d.js): SPINSKY_KINDS.
//
// SKY IS A BACKDROP AT INFINITY. ssky and sclouds are drawn with the camera's ROTATION only (translation dropped): from any world
// (Q room, P2 at 250 m, the street at -53 m, HI at x 40000) the sun, moon, stars, terminator and streaks stand at the same directions
// as seen from the room window, so the director never has to move the dome. They draw in the OPAQUE list before everything else
// (renderOrder -1000..-890; the dome has depth test off and write off, the sprites test depth at the far plane and never write it), so any terrain, house, hill, post or room wall covers them
// exactly as a backdrop should. sstorm is real geometry in world Q (depth tested: the room's window frame stands in front of it).
//
//   ssky     dome + sun + moon + stars + terminator (one dome shader, 1 draw; the sun, ghosts, comb, moon are 3 more draws)
//            params: t (clip seconds; default 0). Every key below may also be a tweened param. Spec keys, all optional:
//              rho      override of the sun's wheel radius, degrees (default: the track sunRho, 15 then 24 deg from 31.0 s)
//              trail    1   multiplies the sun trail length and the ghost spacing (B2: 26 / 60 / 180 deg of wheel angle at 2x / 10x / 17x)
//              stars    1   gain of the star wheel (0 = off)
//              sun      1   gain of the whole sun smear (head, ghosts, trail, comb; 0 = off)
//              moon     1   gain of the moon (0 = off)
//              bake     true  from 43.3 s the dome carries the cloud streaks + cumulus itself (B6: 0 sprites then); false = no clouds
//            What it draws, back to front: DOME (-1000: day / night / twilight keys by elevation -12 / -2 / 2 / 8 / 18 / 35 / 75 deg,
//            blended lerp(TWILIGHT, lerp(DAY, NIGHT, N), A) in linear RGB; N is the per-pixel night weight of the terminator B3, which
//            leans 18 deg and has 14 streak lines along the wheel on its seam; the warm glow gain .18, 34 deg wide, on the sun head; the
//            15x-18.5x darkening .62 -> .80; D1 the storm veil while storm(t) > 0, still showing the flip at +-18 %; the 4 star discs
//            (520 stars + 400 faint specks, trail clamp(1.4 s, 2.8, 22) deg) cross-faded and turned by alpha; and from 43.3 s the baked
//            clouds), SUN RIBBON (-960, 1 strip), SUN SPRITES (-950, 15 quads: head core 3 deg + corona 8 deg, up to 5 ghosts, comb of
//            8 discs), MOON (-940, 1 quad: crescent 2.6 deg, earthshine, faint halo; shown while N > .5 and A > .3).
//   sclouds  B6: 28 high streaks (3 sprites each, x radius x min(4, 1.6 + .2 (s - 2)), tilted 20 deg up to the right, drifting -x at
//            9 s m/s, wrapped over x +-1800) + 14 cumulus over the far hills (3 sprites each, drifting at 4 s m/s over x +-3000):
//            126 sprites in ONE draw (-890), day / night palettes blended per vertex by the terminator. Hidden while storm > 0 and
//            from 43.3 s (ssky bakes them: spec.bake false on ssky then leaves the sky clear). params: t. spec: none.
//   sstorm   D hurricane, centre (+60, +140, -1500) in world Q, discs 2400 m (D2 far arms z -1530, D3 near arms -1500, D4 eyewall
//            quad 480 m at -1480, eye radius 72 m = 6 % of the disc radius), 22 scud billows z -300..-900, one lightning blob; params: t; spec/param `tilt` 58 deg (how far the discs lie back). Visible 10.9-15.5 s only (slides
//            in from +x over 10.9-11.5 and out to -x over 15-15.5, fades with storm(t)). Turn counter-clockwise, 14 / 22 / 40 deg/s x s/5.5.
//            Transparent, depth tested, renderOrder 100-104, 6 triangles + 44 scud triangles + 2 flash. NOT included (other builders): the
//            220 rain streaks, the glass rain, the room's cold fill kick (D count's other lines).
//   skyColorAt(t, elDeg, azDeg)  exported helper: the dome's colour at that direction as linear-RGB [r, g, b] (terminator, glow, veil,
//            darkening included; no sun disc, stars or clouds). The Andes builder's mist (C1: "the dome's current colour at el 2 deg")
//            and the street's ground tint can call it per frame; az 0 = -z, + toward +x, el up.
//   Budgets: sprites ssky 16 (15 sun + 1 moon) + 1 ribbon; sclouds 126 (0 from 43.3 s); sstorm 26 (3 discs, 22 scud, 1 flash); draws 4 + 1 + 7. Textures: 4 star discs
//   2048 x 2048, sun atlas 512 x 256, moon 512, cloud atlases 2 x 2048 x 384, cloud bake 4096 x 1024, storm 2048 x 2 + 1024.
//   Composition: the sun orbits the point az 0, el 0 (rises right, tops out ahead, sets left); keep the caption band over the sky.

const SEED = 31703, TAU = Math.PI * 2, DEG = Math.PI / 180;
const lerp = (a, b, k) => a + (b - a) * k;
const fr = (x) => x - Math.floor(x);
const sstep = (a, b, x) => S((x - a) / (b - a));
function rngOf(seed) { let s = (seed >>> 0) || 1; return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
function canvas(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return [c, c.getContext("2d")]; }
function ctex(c, o = {}) {
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = o.aniso ?? 2;
  if (o.nomip) { t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; }
  if (o.premul) t.premultiplyAlpha = true;
  return t;
}
function lookOnly(me, order) { me.castShadow = me.receiveShadow = false; me.frustumCulled = false; me.userData.solid = false; me.userData.lookOnly = true; me.userData.steam = true; if (order != null) me.renderOrder = order; return me; }
const noLine = (m) => { m.userData.noOutline = true; m.userData.noHatch = true; return m; };
const memo = new Map(), once = (k, make) => { if (!memo.has(k)) memo.set(k, make()); return memo.get(k); };
const tOf = (ps, S0) => ps.t ?? S0.t ?? 0;
const dirOf = (az, el) => [Math.sin(az * DEG) * Math.cos(el * DEG), Math.sin(el * DEG), -Math.cos(az * DEG) * Math.cos(el * DEG)];
const WIN = 0.22, SEAM_W = 26, LEAN = Math.tan(18 * DEG), BAKE_T = 43.3, DIST = 4000;
// Fix r1 (item 5, P6 15.4-19 s): spin-tracks flicker() is already down to .62 -> .25 there, so day and night differed too little through the window and the sky read as one dusk.
// The SKY (dome, clouds, moon) takes its depth from skyA: the track, lifted to .92 over 15.7-18.4 s and eased back onto the track by 21.5 s (no step: the lift starts and ends on the track).
// About 2 film days a second there, 2 wipes per day, so about 1 big brightness change a second, each a 0.4 s wipe (qa strobe counts frame-to-frame jumps in the mean: none).
const skyA = (t) => Math.max(flicker(t), keys(t, [[15.0, 0], [15.7, 0.92], [18.4, 0.92], [21.5, 0]]));
const driftD = (t) => 2 * t + 0.15 * t * t;   // integral of the spin s: metres of drift per unit of (m/s per s)

// =============================================================================================================== keys and tracks
const SKY_EL = [-12, -2, 2, 8, 18, 35, 75];
const DAY = ["#7E6A86", "#E59A78", "#FFC08A", "#F2A58F", "#B58BB0", "#6F78B8", "#3F4F96"].map(lin);
const NIGHT = ["#1B2140", "#2A3560", "#2F3F70", "#263562", "#1C2850", "#141C3E", "#0C1230"].map(lin);
const TWI = ["#4A3A5E", "#C9785E", "#F0A066", "#B8708A", "#6E5A9A", "#46508F", "#2B3470"].map(lin);
const VEIL = [[-12, lin("#3A4558")], [2, lin("#6B7A8C")], [18, lin("#4A566B")], [75, lin("#2B3345")]];   // D1
const SEAM_SET = ["#FF9A5C", "#C2567A", "#2A3560"].map(lin), SEAM_RISE = ["#FFD2A0", "#E59A78"].map(lin), STREAK_COL = lin("#FFD2A0");
const GLOW_COL = lin("#FFAB6D");
function veilAt(el) { for (let i = 1; i < VEIL.length; i++) if (el <= VEIL[i][0]) { const [a, ca] = VEIL[i - 1], [b, cb] = VEIL[i], k = clamp((el - a) / (b - a)); return ca.map((v, j) => lerp(v, cb[j], k)); } return VEIL[VEIL.length - 1][1]; }

// B3: the terminator state at t. Fix round 1: the wipe is a WIDE gradient (SEAM_W deg, not the 7 of spin-tracks night()), leaning 18 deg, and the
// line sweeps az_T = 50 - 100 u (not 30 - 60 u) so that with the wide edge no corner of the frame is part-night when a sweep opens or closes.
// Mid-sweep (u = .5, az_T 0) is the same instant as night(); the dome is half-night over the middle ~40 % of the window instead of the middle 25 %.
function terminatorAt(t) {
  const f = fr(psi(t)), dSet = f - 0.5, dRise = f > 0.5 ? f - 1 : f;
  if (Math.abs(dSet) < WIN / 2) { const u = (dSet + WIN / 2) / WIN; return { mode: 1, azT: 50 - 100 * u, n0: 0 }; }
  if (Math.abs(dRise) < WIN / 2) { const u = (dRise + WIN / 2) / WIN; return { mode: 2, azT: 50 - 100 * u, n0: 0 }; }
  return { mode: 0, azT: 0, n0: f < 0.5 ? 0 : 1 };
}
// night weight at a direction; the wipe leans 18 deg (top to the left) up to el 40
function nightField(tm, az, el) {
  if (tm.mode === 0) return tm.n0;
  const n = S((az + LEAN * clamp(el, 0, 40) - tm.azT) / SEAM_W + 0.5);
  return tm.mode === 1 ? n : 1 - n;
}
const darken = (s) => keys(s, [[15, 1], [16.5, 0.62], [18.5, 0.8]]);   // B3: P12's dark sky, back to .80
const ghosts0 = (s) => S(P(s, 10, 10.5));   // fix r1 (item 6): no separate sun ghosts and no comb before 10x (26.7 s): one sun with a streak until then
const ghostCount = (s) => 2 * ghosts0(s) + S(P(s, 11.7, 12.3)) + S(P(s, 13.7, 14.3)) + S(P(s, 15.7, 16.3));   // 2 below 12x, 3, 4, 5 from 16x (the new ghost fades in)
const trailLen = (s) => keys(s, [[2, 26], [10, 60], [17, 180]]);

// the per-frame dome state shared by the shader uniforms and skyColorAt
function domeState(t) {
  const s = spin(t), A = skyA(t), st = storm(t), m = darken(s), tm = terminatorAt(t), sun = sunAt(t);
  const Kd = [], Kn = [], vs = 0.72 * st;
  for (let i = 0; i < 7; i++) {
    const vc = veilAt(SKY_EL[i]), kd = [], kn = [];
    for (let j = 0; j < 3; j++) {
      const d = lerp(TWI[i][j], DAY[i][j], A), n = lerp(TWI[i][j], NIGHT[i][j], A);
      kd.push(lerp(d, vc[j] * 1.18, vs) * m); kn.push(lerp(n, vc[j] * 0.82, vs) * m);   // D1: the flip still shows at +-18 %; the veil is 72 % of the base so the dome keeps its gradient
    }
    Kd.push(kd); Kn.push(kn);
  }
  const glow = 0.18 * sstep(-10, 6, sun.el) * (0.25 + 0.75 * A) * (1 - st);
  return { s, A, st, m, tm, sun, Kd, Kn, glow, seamK: 0.2 + 0.8 * A };
}
function keyBlend(el, K) {
  const c = [0, 0, 0];
  for (let i = 0; i < 7; i++) {
    const e = SKY_EL[i];
    const w = el <= e ? (i > 0 ? clamp((el - SKY_EL[i - 1]) / (e - SKY_EL[i - 1])) : 1) : (i < 6 ? clamp((SKY_EL[i + 1] - el) / (SKY_EL[i + 1] - e)) : 1);
    for (let j = 0; j < 3; j++) c[j] += K[i][j] * w;
  }
  return c;
}
// the seam overlay of B3 (same numbers in the shader): at most 30 % over the base, a band twice as wide as the wipe, no hard edge
function seamOf(tm, az, el, k) {
  if (tm.mode === 0) return null;
  const xs = (az + LEAN * clamp(el, 0, 40) - tm.azT) / SEAM_W, band = 1 - sstep(0.3, 1.1, Math.abs(xs)), elf = 1 - 0.5 * sstep(25, 75, el), sw = 0.3 * band * elf * k;
  let sc;
  if (tm.mode === 1) { const q = clamp(xs / 0.7, -1, 1); sc = q < 0 ? SEAM_SET[1].map((v, j) => lerp(v, SEAM_SET[0][j], -q)) : SEAM_SET[1].map((v, j) => lerp(v, SEAM_SET[2][j], q)); }
  else { const q = S((xs + 0.5) / 1.0); sc = SEAM_RISE[1].map((v, j) => lerp(v, SEAM_RISE[0][j], q)); }
  return { sw, sc };
}
export function skyColorAt(t, elDeg = 2, azDeg = 0) {
  const d = domeState(t), N = nightField(d.tm, azDeg, elDeg), cd = keyBlend(elDeg, d.Kd), cn = keyBlend(elDeg, d.Kn);
  let c = cd.map((v, j) => lerp(v, cn[j], N));
  const sm = seamOf(d.tm, azDeg, elDeg, d.seamK); if (sm) c = c.map((v, j) => lerp(v, sm.sc[j] * d.m, sm.sw));   // the shader scales the seam colour by the darkening too
  const daz = azDeg - d.sun.az, del = elDeg - d.sun.el, g = Math.exp(-(daz * daz + del * del) / (2 * 17 * 17)) * d.glow;
  return c.map((v, j) => v + GLOW_COL[j] * g * d.m);
}

// =============================================================================================================== star discs (B4)
const STAR_TRAILS = [3, 7, 13, 22], STAR_R = 62, STAR_N = 2048;
function starList() {
  return once("starList", () => {
    const R = rngOf(SEED + 31), out = [];
    const add = (n, cls) => { for (let i = 0; i < n; i++) { const r = STAR_R * Math.sqrt(R()), th = R() * TAU, warm = R() < 0.5; out.push({ r, th, cls, col: cls === 0 ? (warm ? "#FFF4DC" : "#DCE6FF") : cls === 3 ? "#E4EAFF" : (warm ? "#FFF0D8" : "#D8E2FF"), a: cls === 3 ? 0.3 + 0.2 * R() : 0.65 + 0.3 * R() }); } };
    add(40, 0); add(160, 1); add(320, 2); add(400, 3);
    return out;
  });
}
function starDisc(trail) {
  return once(`star${trail}`, () => {
    const N = STAR_N, [c, g] = canvas(N, N), k = N / (2 * STAR_R), cx = N / 2;
    g.fillStyle = "#000"; g.fillRect(0, 0, N, N); g.globalCompositeOperation = "lighter"; g.lineCap = "round";
    const W = [1.7, 1.15, 0.8, 0.55];   // line widths, texture px (the disc is magnified about x2 on a 1080-wide frame, so these read as 3 / 2 / 1.3 px)
    for (const st of starList()) {
      const px = (th) => [cx + Math.cos(th) * st.r * k, cx - Math.sin(th) * st.r * k], n = Math.max(1, Math.ceil(trail / 1.2));
      g.lineWidth = W[st.cls];
      for (let j = 0; j < n; j++) {   // head at th, the tail trails behind (smaller angle): the disc turns counter-clockwise
        const a0 = st.th - (trail * j) / n * DEG, a1 = st.th - (trail * (j + 1)) / n * DEG, f = Math.pow(1 - (j + 0.5) / n, 2.2), [x0, y0] = px(a0), [x1, y1] = px(a1);
        g.strokeStyle = rgba(st.col, st.a * f); g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
      }
      const [hx, hy] = px(st.th);
      if (st.cls === 0) { const gr = g.createRadialGradient(hx, hy, 0, hx, hy, 5); gr.addColorStop(0, rgba(st.col, 0.7)); gr.addColorStop(1, rgba(st.col, 0)); g.fillStyle = gr; g.beginPath(); g.arc(hx, hy, 5, 0, TAU); g.fill(); }
      g.fillStyle = rgba(st.col, Math.min(1, st.a * 1.2)); g.beginPath(); g.arc(hx, hy, W[st.cls] * 0.62, 0, TAU); g.fill();
    }
    return ctex(c, { aniso: 4 });
  });
}
// cross-fade weights of the 4 discs for the trail length 1.4 s clamp(2.8, 22): between the two discs that bracket it
function starWeights(s) {
  const L = clamp(1.4 * s, 2.8, 22), w = [0, 0, 0, 0];
  for (let i = 1; i < 4; i++) if (L <= STAR_TRAILS[i] || i === 3) { const k = clamp((L - STAR_TRAILS[i - 1]) / (STAR_TRAILS[i] - STAR_TRAILS[i - 1])); w[i - 1] = 1 - k; w[i] = k; break; }
  return w;
}

// =============================================================================================================== cloud tiles (B6) and their layout
// Palettes: top = the warm lit rim, mid = the body, band = the cool underside band, shade = the deep underside (2-3 tone bands + rim)
const mixHex = (a, b, k) => { const x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16), ch = (sh) => Math.round(lerp((x >> sh) & 255, (y >> sh) & 255, k)); return "#" + ((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1); };
const palOf = (day, night) => ({ day, night, twi: { top: mixHex(day.top, night.top, 0.5), mid: mixHex(day.mid, night.mid, 0.5), band: mixHex(day.band, night.band, 0.5), shade: mixHex(day.shade, night.shade, 0.5) } });
const PAL = {
  streak: palOf({ top: "#FFD9B8", mid: "#F2B8A0", band: "#BE9BA4", shade: "#8A7AA8" }, { top: "#6A7AA8", mid: "#4F5C8A", band: "#3A4670", shade: "#2A3560" }),
  cum: palOf({ top: "#FFD9B8", mid: "#F6EFEA", band: "#C9B8D0", shade: "#8A7AA8" }, { top: "#6A7AA8", mid: "#4A5A8C", band: "#3A4670", shade: "#2A3560" }),
};
const TW = 512, THS = 128, THC = 256, ATLAS_H = THS + THC;   // streak tiles 512 x 128 (top row), cumulus tiles 512 x 256 (bottom row)
// a silhouette (white on clear) turned into toon bands: body, a cool underside band, a deep underside line, a warm lit rim on top; every edge softened 1-2 px
function toon(mask, pal, w, h, o) {
  const [c, g] = canvas(w, h);
  g.drawImage(mask, 0, 0); g.globalCompositeOperation = "source-in"; g.fillStyle = pal.mid; g.fillRect(0, 0, w, h);
  const layer = (dx, dy, color, blur) => {
    const [t, tg] = canvas(w, h); tg.drawImage(mask, 0, 0); tg.globalCompositeOperation = "destination-out"; tg.drawImage(mask, dx, dy);
    tg.globalCompositeOperation = "source-in"; tg.fillStyle = color; tg.fillRect(0, 0, w, h);
    g.save(); g.filter = `blur(${blur}px)`; g.globalCompositeOperation = "source-atop"; g.drawImage(t, 0, 0); g.restore();
  };
  layer(o.sx * 0.5, -o.band, pal.band, 2.2);      // underside band (the bottom `band` px of every column, leaning away from the light)
  layer(o.sx, -o.deep, pal.shade, 1.6);           // deep underside
  layer(o.sx * 0.5, o.rim, pal.top, 1.6);         // lit rim: the top `rim` px
  return c;
}
function softMask(draw, w, h) { const [m, mg] = canvas(w, h); mg.fillStyle = "#fff"; draw(mg); const [c, g] = canvas(w, h); g.filter = "blur(1.5px)"; g.drawImage(m, 0, 0); return c; }
function streakTile(v, pal) {   // a high streak: one long soft brush stroke with tapered ends, thin fibres beside it
  return once(`st${v}${pal.top}`, () => {
    const W = TW, H = THS, R = rngOf(SEED + 100 + v * 7), bend = (R() - 0.5) * 0.18 * H, tmax = H * (0.2 + 0.07 * R()), ph = R() * 3;
    const yAt = (u) => H * 0.5 + bend * Math.sin(Math.PI * u) + 0.015 * H * Math.sin(u * 5 + ph);
    const mask = softMask((g) => {
      const n = 220;
      for (let i = 0; i <= n; i++) {
        const u = i / n, prof = Math.pow(Math.sin(Math.PI * u), 0.8) * (0.85 + 0.15 * Math.sin(u * 23 + ph));
        g.beginPath(); g.ellipse(W * (0.04 + 0.92 * u), yAt(u), Math.max(1.5, W * 0.012), Math.max(0.8, tmax * prof), 0, 0, TAU); g.fill();
      }
      for (let f = 0; f < 4; f++) {   // fibres: thinner tapered strokes above and below the main stroke
        const off = (f % 2 ? 1 : -1) * H * (0.2 + 0.05 * f) * (0.8 + 0.4 * R()), u0 = 0.1 + 0.4 * R(), u1 = Math.min(0.96, u0 + 0.25 + 0.35 * R());
        for (let i = 0; i <= 80; i++) { const u = u0 + (u1 - u0) * i / 80, prof = Math.sin(Math.PI * i / 80) ** 0.9; g.beginPath(); g.ellipse(W * (0.04 + 0.92 * u), yAt(u) + off, W * 0.01, Math.max(0.6, 2.2 * prof), 0, 0, TAU); g.fill(); }
      }
    }, W, H);
    return toon(mask, pal, W, H, { sx: 2, band: 13, deep: 6, rim: 6 });
  });
}
function cumTile(v, pal) {   // an anime cumulus: 6-9 round overlapping lobes on a flat soft base, a lit rim, 3 cool tone bands, a shaded belly on every lobe
  return once(`cu${v}${pal.top}`, () => {
    const W = TW, H = THC, R = rngOf(SEED + 200 + v * 11), n = 6 + Math.floor(R() * 4), baseY = H * 0.88, lobes = [];
    for (let i = 0; i < n; i++) {
      const x = W * (0.15 + 0.7 * (i + 0.5 + (R() - 0.5) * 0.5) / n), bell = Math.pow(1 - Math.pow(Math.abs(2 * x / W - 1), 1.3), 1.2), r = W * (0.06 + 0.17 * bell) * (0.75 + 0.5 * R());
      lobes.push({ x, r, y: baseY - r * (0.62 + 0.3 * R()) });
    }
    const mask = softMask((g) => {
      for (const l of lobes) { g.beginPath(); g.arc(l.x, l.y, l.r, 0, TAU); g.fill(); }
      g.beginPath(); g.roundRect(W * 0.1, baseY - 40, W * 0.8, 40, 18); g.fill();
      g.globalCompositeOperation = "destination-in"; g.fillRect(0, 0, W, baseY);   // a flat base
    }, W, H);
    const c = toon(mask, pal, W, H, { sx: 5, band: 46, deep: 20, rim: 15 }), g = c.getContext("2d");
    for (const l of lobes) {   // each lobe's own lower-right crescent in the band colour: the puffs read as round
      const [t, tg] = canvas(W, H); tg.fillStyle = pal.band; tg.beginPath(); tg.arc(l.x, l.y, l.r, 0, TAU); tg.fill();
      tg.globalCompositeOperation = "destination-out"; tg.beginPath(); tg.arc(l.x - l.r * 0.2, l.y - l.r * 0.26, l.r * 0.98, 0, TAU); tg.fill();
      g.save(); g.filter = "blur(2.4px)"; g.globalCompositeOperation = "source-atop"; g.globalAlpha = 0.6; g.drawImage(t, 0, 0); g.restore();
    }
    return c;
  });
}
function atlasOf(which) {   // 4 tiles wide: streaks 0-3 on the top row (128 high), cumulus 0-3 below (256 high); one canvas per palette
  return once(`atlas${which}`, () => {
    const [c, g] = canvas(TW * 4, ATLAS_H);
    for (let v = 0; v < 4; v++) { g.drawImage(streakTile(v, PAL.streak[which]), v * TW, 0); g.drawImage(cumTile(v, PAL.cum[which]), v * TW, THS); }
    return c;
  });
}
const CLOUD_W = 1800, CUM_W = 3000;
// the sprite table (fixed per seed); positions and sizes are evaluated per t by cloudAt
function cloudTable() {
  return once("cloudTable", () => {
    const R = rngOf(SEED + 5), items = [];
    for (let i = 0; i < 28; i++) {   // B6: 28 high streaks, 3 sprites each
      const z = -(650 + 850 * fr(i * 0.618 + 0.13)), dist = -z, x0 = -CLOUD_W + 2 * CLOUD_W * fr(i * 0.7548776662 + 0.31), el = 3 + 29 * Math.pow(fr(i * 0.5698402909 + 0.17), 1.15);
      const rx = 30 + 75 * R(), ry = 5 + 13 * R(), y = dist * Math.tan(el * DEG);
      for (let k = 0; k < 3; k++) items.push({ kind: 0, x0, y, z: z + (R() - 0.5) * 30, u: k - 1, rx, ry, wf: (0.8 + 0.7 * R()) * 1.25, hf: 2 * (2.6 + 1.0 * R()), v: Math.floor(R() * 4), a: 0.85 + 0.15 * R(), dy: (R() - 0.5) * ry * 0.7 });
    }
    for (let j = 0; j < 14; j++) {   // 14 cumulus over the far hills, 3 sprites each (a sprite is 3 lobes: 9 lobes a cumulus)
      const z = -(3400 + 1800 * fr(j * 0.618 + 0.4)), x0 = -CUM_W + 2 * CUM_W * fr(j * 0.7548776662 + 0.12), w = 420 + 240 * R(), elB = 0.8 + 3.8 * R();
      for (let k = 0; k < 3; k++) { const ww = w * (0.8 + 0.4 * R()); items.push({ kind: 1, x0: x0 + (k - 1) * w * 0.8, y: -z * Math.tan(elB * DEG) + ww * 0.28, z: z + (R() - 0.5) * 120, u: 0, rx: ww / 2, ry: ww * 0.25, wf: 2, hf: 2 * (k === 1 ? 1.05 : 0.8 + 0.15 * R()), v: Math.floor(R() * 4), a: 0.9 + 0.1 * R(), dy: 0 }); }
    }
    items.sort((a, b) => a.z - b.z);   // far to near
    return items;
  });
}
const TILT = 20 * DEG;
function cloudAt(it, t) {   // world centre, size (m), alpha edge factor of one sprite at clip time t
  const s = spin(t), D = driftD(t), W = it.kind ? CUM_W : CLOUD_W, rate = it.kind ? 4 : 9;
  const x = ((((it.x0 - rate * D) % (2 * W)) + 3 * W) % (2 * W)) - W;
  const stretch = it.kind ? 1 : Math.min(4, 1.6 + 0.2 * (s - 2)), w = it.rx * it.wf * stretch, h = it.ry * it.hf;
  const ex = 1 - sstep(W - (it.kind ? 500 : 300), W, Math.abs(x));
  const cx = x + (it.kind ? 0 : it.u * it.rx * 1.15 * stretch * Math.cos(TILT)), cy = it.y + (it.kind ? 0 : it.u * it.rx * 1.15 * stretch * Math.sin(TILT)) + it.dy;
  return { cx, cy, cz: it.z, w, h, ex };
}
function bakeTex() {   // B6: the streaks + cumulus at the state of 43.3 s, drawn once into the dome (az -80..80 over 4096 px, el 0..40 over 1024 px)
  return once("bake", () => {
    const [c, g] = canvas(4096, 1024), px = 4096 / 160, tab = cloudTable();
    for (const it of tab) {
      const p = cloudAt(it, BAKE_T), dist = Math.hypot(p.cx, p.cz), az = Math.atan2(p.cx, -p.cz) / DEG, el = Math.atan2(p.cy, dist) / DEG, wd = (p.w / dist) / DEG, hd = (p.h / dist) / DEG;
      const tile = it.kind ? cumTile(it.v, PAL.cum.twi) : streakTile(it.v, PAL.streak.twi), al = (it.kind ? 0.9 : 0.52) * it.a * p.ex * (1 - sstep(62, 78, Math.abs(az)));
      if (al <= 0.003) continue;
      for (const off of [-160, 0, 160]) {
        g.save(); g.globalAlpha = al; g.translate((az + off + 80) * px, 1024 - el * 25.6); g.rotate(it.kind ? 0 : -TILT); g.drawImage(tile, (-wd * px) / 2, (-hd * 25.6) / 2, wd * px, hd * 25.6); g.restore();
      }
    }
    return ctex(c, { nomip: true, premul: true });
  });
}

// =============================================================================================================== quad mesh on the sky sphere
const QUAD_VS = "attribute vec4 aCol; attribute float aAdd; varying vec2 vUv; varying vec4 vC; varying float vA; void main(){ vUv = uv; vC = aCol; vA = aAdd; vec3 p = mat3(viewMatrix) * position; gl_Position = projectionMatrix * vec4(p, 1.0); }";
const QUAD_FS = "uniform sampler2D uMap; varying vec2 vUv; varying vec4 vC; varying float vA; void main(){ vec4 t = texture2D(uMap, vUv); float a = t.a * vC.a; gl_FragColor = vec4(t.rgb * vC.rgb * a, a * (1.0 - vA));\n#include <colorspace_fragment>\n }";
// Fix r0 (21 Nov 2026): the sprites (sun, ribbon, moon, clouds) were drawn over the cast and the walls (rough draft 1: streaks over Spud and the mural).
// They are now DEPTH TESTED at the far plane: the vertex shader pins z to w * .99999 (the quad's own distance means nothing, it is at infinity), so any
// opaque or depth-writing surface in front covers them whatever the draw order is; nothing writes depth for them and the dome (depth test off, drawn first) is unchanged.
const FAR_Z = " gl_Position.z = gl_Position.w * 0.99999;";
function skyMaterial(vs, fs, uniforms) {
  vs = vs.replace(/\}\s*$/, FAR_Z + " }");
  return noLine(new THREE.ShaderMaterial({ uniforms, vertexShader: vs, fragmentShader: fs, transparent: false, depthTest: true, depthWrite: false, side: THREE.DoubleSide, fog: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor }));
}
function quadBuf(n) {
  const pos = new Float32Array(n * 12), uv = new Float32Array(n * 8), col = new Float32Array(n * 16), add = new Float32Array(n * 4), idx = new Uint16Array(n * 6);
  for (let i = 0; i < n; i++) idx.set([i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3], i * 6);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); geo.setAttribute("aCol", new THREE.BufferAttribute(col, 4)); geo.setAttribute("aAdd", new THREE.BufferAttribute(add, 1)); geo.setIndex(new THREE.BufferAttribute(idx, 1));
  return { n, pos, uv, col, add, geo };
}
// one quad on the sky: centre az/el (deg), size w x h (deg of arc), turned `ang` deg in the az-el plane, atlas rect u0 v0 u1 v1, colour (linear), alpha, additive share
function putQuad(b, i, az, el, w, h, ang, rect, rgb, a, addv) {
  const ca = Math.cos(ang * DEG), sa = Math.sin(ang * DEG), ce = Math.max(Math.cos(el * DEG), 0.3), cs = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  for (let k = 0; k < 4; k++) {
    const lx = cs[k][0] * w / 2, ly = cs[k][1] * h / 2, dx = lx * ca - ly * sa, dy = lx * sa + ly * ca, d = dirOf(az + dx / ce, el + dy), o = (i * 4 + k) * 3;
    b.pos[o] = d[0] * DIST; b.pos[o + 1] = d[1] * DIST; b.pos[o + 2] = d[2] * DIST;
    b.uv[(i * 4 + k) * 2] = cs[k][0] > 0 ? rect[2] : rect[0]; b.uv[(i * 4 + k) * 2 + 1] = cs[k][1] > 0 ? rect[3] : rect[1];
    b.col.set([rgb[0], rgb[1], rgb[2], a], (i * 4 + k) * 4); b.add[i * 4 + k] = addv;
  }
}
const hideQuad = (b, i) => { for (let k = 0; k < 4; k++) b.col[(i * 4 + k) * 4 + 3] = 0; };
const touch = (b) => { b.geo.attributes.position.needsUpdate = true; b.geo.attributes.uv.needsUpdate = true; b.geo.attributes.aCol.needsUpdate = true; b.geo.attributes.aAdd.needsUpdate = true; };

function sunAtlas() {   // 4 x 2 cells of 128: core, corona, ghost
  return once("sunAtlas", () => {
    const [c, g] = canvas(512, 256), cell = (cx, cy, stops) => { const x = cx * 128 + 64, y = cy * 128 + 64, gr = g.createRadialGradient(x, y, 0, x, y, 64); for (const [k, a] of stops) gr.addColorStop(k, `rgba(255,255,255,${a})`); g.fillStyle = gr; g.fillRect(cx * 128, cy * 128, 128, 128); };
    cell(0, 0, [[0, 1], [0.84, 1], [0.97, 0.35], [1, 0]]);                       // core: a disc with a soft limb
    cell(1, 0, [[0, 0.9], [0.18, 0.62], [0.45, 0.24], [0.75, 0.06], [1, 0]]);    // corona
    cell(2, 0, [[0, 1], [0.35, 0.82], [0.7, 0.3], [1, 0]]);                      // ghost
    cell(3, 0, [[0, 1], [0.27, 1], [0.34, 0.5], [0.55, 0.2], [0.8, 0.05], [1, 0]]);   // comb sun: a crisp disc in a halo
    return ctex(c, { nomip: true });
  });
}
const CELL = { core: [0, 0.5, 0.25, 1], corona: [0.25, 0.5, 0.5, 1], ghost: [0.5, 0.5, 0.75, 1], comb: [0.75, 0.5, 1, 1] };
function moonTex() {   // 512: faint halo, earthshine disc, the lit crescent (its lit limb on +x)
  return once("moonTex", () => {
    const [c, g] = canvas(512, 512), cx = 256, r = 51;
    const hg = g.createRadialGradient(cx, cx, 0, cx, cx, 256); hg.addColorStop(0, "rgba(160,180,235,0.20)"); hg.addColorStop(0.2, "rgba(160,180,235,0.09)"); hg.addColorStop(0.55, "rgba(160,180,235,0.025)"); hg.addColorStop(1, "rgba(160,180,235,0)"); g.fillStyle = hg; g.fillRect(0, 0, 512, 512);
    g.fillStyle = "#3A4670"; g.beginPath(); g.arc(cx, cx, r, 0, TAU); g.fill();
    const [c2, g2] = canvas(512, 512); g2.fillStyle = "#F4EFD8"; g2.beginPath(); g2.arc(cx, cx, r, 0, TAU); g2.fill();
    g2.globalCompositeOperation = "destination-out"; g2.beginPath(); g2.arc(cx - r * 0.5, cx, r * 0.93, 0, TAU); g2.fill();
    g.drawImage(c2, 0, 0);
    g.globalCompositeOperation = "source-atop"; const sh = g.createRadialGradient(cx + r * 0.5, cx - r * 0.2, 0, cx + r * 0.5, cx - r * 0.2, r * 1.2); sh.addColorStop(0, "rgba(255,255,240,0.18)"); sh.addColorStop(1, "rgba(255,255,240,0)"); g.fillStyle = sh; g.fillRect(0, 0, 512, 512);
    return ctex(c, { nomip: true });
  });
}

// =============================================================================================================== ssky
const DOME_VS = "varying vec3 vD; void main(){ vD = position; vec3 p = mat3(viewMatrix) * position; gl_Position = projectionMatrix * vec4(p, 1.0); }";
const DOME_FS = `uniform float uEl[7]; uniform vec3 uKd[7]; uniform vec3 uKn[7]; uniform vec4 uTm; uniform vec4 uSun; uniform vec3 uSeam[5]; uniform vec3 uStreakCol; uniform vec3 uSL[14]; uniform vec2 uSM[14];
  uniform vec3 uGlowCol; uniform vec4 uMu; uniform vec4 uSW; uniform vec2 uStar; uniform vec3 uBk;
  uniform sampler2D uS0; uniform sampler2D uS1; uniform sampler2D uS2; uniform sampler2D uS3; uniform sampler2D uBake; varying vec3 vD;
  float sm(float x){ x = clamp(x, 0.0, 1.0); return x * x * (3.0 - 2.0 * x); }
  float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  void main(){
    vec3 d = normalize(vD); float el = degrees(asin(clamp(d.y, -1.0, 1.0))); float az = degrees(atan(d.x, -d.z));
    float xs = 0.0, N = uTm.w;
    if (uTm.x > 0.5) { xs = (az + uTm.z * clamp(el, 0.0, 40.0) - uTm.y) / uMu.z; float n = sm(xs + 0.5); N = uTm.x < 1.5 ? n : 1.0 - n; }
    vec3 cd = vec3(0.0), cn = vec3(0.0);
    for (int i = 0; i < 7; i++) {
      float e = uEl[i], w;
      if (el <= e) w = i > 0 ? clamp((el - uEl[max(i - 1, 0)]) / (e - uEl[max(i - 1, 0)]), 0.0, 1.0) : 1.0; else w = i < 6 ? clamp((uEl[min(i + 1, 6)] - el) / (uEl[min(i + 1, 6)] - e), 0.0, 1.0) : 1.0;
      cd += uKd[i] * w; cn += uKn[i] * w;
    }
    vec3 c = mix(cd, cn, N);
    float mult = uMu.x;
    if (uTm.x > 0.5) {
      float band = 1.0 - smoothstep(0.3, 1.1, abs(xs)), elf = 1.0 - 0.5 * smoothstep(25.0, 75.0, el), sw = 0.3 * band * elf * uMu.y; vec3 sc;
      if (uTm.x < 1.5) { float k = clamp(xs / 0.7, -1.0, 1.0); sc = k < 0.0 ? mix(uSeam[1], uSeam[0], -k) : mix(uSeam[1], uSeam[2], k); } else sc = mix(uSeam[4], uSeam[3], sm((xs + 0.5) / 1.0));
      c = mix(c, sc * mult, sw);
      float rr = length(vec2(az, el)), ls = 0.0;
      for (int i = 0; i < 14; i++) { float q = (rr - uSL[i].x) / uSL[i].y, m = (xs - uSM[i].x) / uSM[i].y; ls += uSL[i].z * exp(-q * q - m * m); }
      c += uStreakCol * mult * ls * uMu.y * 0.08;
    }
    vec2 dh = vec2(az - uSun.x, el - uSun.y); c += uGlowCol * mult * uSun.z * exp(-dot(dh, dh) / 578.0);
    if (uSW.x + uSW.y + uSW.z + uSW.w > 0.001 && uStar.x > 0.0) {
      float ca = cos(uStar.y), sa = sin(uStar.y); vec2 p = vec2(ca * az - sa * el, sa * az + ca * el); vec2 uv = 0.5 + 0.5 * p / 62.0;
      if (uv.x > 0.0 && uv.x < 1.0 && uv.y > 0.0 && uv.y < 1.0) {
        vec3 s = vec3(0.0);
        if (uSW.x > 0.001) s += uSW.x * texture2D(uS0, uv).rgb; if (uSW.y > 0.001) s += uSW.y * texture2D(uS1, uv).rgb; if (uSW.z > 0.001) s += uSW.z * texture2D(uS2, uv).rgb; if (uSW.w > 0.001) s += uSW.w * texture2D(uS3, uv).rgb;
        c += s * smoothstep(0.2, 0.5, N) * uStar.x * (0.45 + 0.55 * smoothstep(-2.0, 14.0, el));
      }
    }
    if (uBk.x > 0.5 && el > 0.0 && el < 40.0) { vec4 cl = texture2D(uBake, vec2(fract((az + uBk.y) / 160.0 + 0.5), el / 40.0)); c = c * (1.0 - cl.a) + cl.rgb * mult * uBk.z; }
    gl_FragColor = vec4(c, 1.0);
    #include <colorspace_fragment>
    gl_FragColor.rgb += (hash(gl_FragCoord.xy) - 0.5) / 255.0;
  }`;
function slLines() {   // B3: 14 streak lines along the wheel: [wheel radius deg, width deg, gain] and [offset across the seam in 7-deg units, half length in the same units]
  return once("sl", () => { const R = rngOf(SEED + 53), L = []; for (let i = 0; i < 14; i++) L.push({ l: [4 + 42 * R(), 0.18 + 0.25 * R(), 0.35 + 0.5 * R()], m: [(R() - 0.5) * 0.7, 0.04 + 0.06 * R()] }); return L; });
}
function skyKind(P0) {
  const S0 = P0.spec, tex0 = (i) => starDisc(STAR_TRAILS[i]);
  const unif = {
    uEl: { value: SKY_EL }, uKd: { value: SKY_EL.map(() => new THREE.Vector3()) }, uKn: { value: SKY_EL.map(() => new THREE.Vector3()) }, uTm: { value: new THREE.Vector4() }, uSun: { value: new THREE.Vector4() },
    uSeam: { value: [...SEAM_SET, ...SEAM_RISE].map((c) => new THREE.Vector3(...c)) }, uStreakCol: { value: new THREE.Vector3(...STREAK_COL) }, uSL: { value: slLines().map((l) => new THREE.Vector3(...l.l)) }, uSM: { value: slLines().map((l) => new THREE.Vector2(...l.m)) },
    uGlowCol: { value: new THREE.Vector3(...GLOW_COL) }, uMu: { value: new THREE.Vector4(1, 1, 0, 0) }, uSW: { value: new THREE.Vector4() }, uStar: { value: new THREE.Vector2() }, uBk: { value: new THREE.Vector3() },
    uS0: { value: tex0(0) }, uS1: { value: tex0(1) }, uS2: { value: tex0(2) }, uS3: { value: tex0(3) }, uBake: { value: null },
  };
  const dm = noLine(new THREE.ShaderMaterial({ uniforms: unif, vertexShader: DOME_VS, fragmentShader: DOME_FS, side: THREE.BackSide, depthTest: false, depthWrite: false, fog: false }));
  const dome = lookOnly(new THREE.Mesh(new THREE.SphereGeometry(DIST, 48, 32), dm), -1000); P0.whole.add(dome);

  // sun ribbon (the tapered trail joining the ghosts): 65 stations x 2
  const NS = 65, rp = new Float32Array(NS * 2 * 3), rc = new Float32Array(NS * 2 * 4), re = new Float32Array(NS * 2), ri = [];
  for (let j = 0; j < NS; j++) { re[j * 2] = -1; re[j * 2 + 1] = 1; if (j < NS - 1) ri.push(j * 2, j * 2 + 1, j * 2 + 2, j * 2 + 1, j * 2 + 3, j * 2 + 2); }
  const rg = new THREE.BufferGeometry(); rg.setAttribute("position", new THREE.BufferAttribute(rp, 3)); rg.setAttribute("aCol", new THREE.BufferAttribute(rc, 4)); rg.setAttribute("aE", new THREE.BufferAttribute(re, 1)); rg.setIndex(ri);
  const rm = skyMaterial("attribute vec4 aCol; attribute float aE; varying vec4 vC; varying float vE; void main(){ vC = aCol; vE = aE; vec3 p = mat3(viewMatrix) * position; gl_Position = projectionMatrix * vec4(p, 1.0); }",
    "varying vec4 vC; varying float vE; void main(){ float a = vC.a * (1.0 - smoothstep(0.25, 1.0, abs(vE))); gl_FragColor = vec4(vC.rgb * a, a * 0.55);\n#include <colorspace_fragment>\n }", {});
  const ribbon = lookOnly(new THREE.Mesh(rg, rm), -960); P0.whole.add(ribbon);

  // sun sprites: comb 0-7, ghosts 8-12, corona 13, core 14
  const sb = quadBuf(15), sm = skyMaterial(QUAD_VS, QUAD_FS, { uMap: { value: sunAtlas() } });
  const sun = lookOnly(new THREE.Mesh(sb.geo, sm), -950); P0.whole.add(sun);
  const mb = quadBuf(1), mm = skyMaterial(QUAD_VS, QUAD_FS, { uMap: { value: moonTex() } });
  const moon = lookOnly(new THREE.Mesh(mb.geo, mm), -940); P0.whole.add(moon);
  const GH_Q = [0.24, 0.46, 0.64, 0.8, 0.93], GH_COL = ["#FFD890", "#FFCB80", "#FFBC74", "#FFAB6A", "#FF9A5C"].map(lin), CORONA = lin("#FFD08A"), COMB = lin("#FFE0A8"), RIB0 = lin("#FFC98A"), RIB1 = lin("#F08A5A");
  const CORE_HI = lin("#FFF6D8"), CORE_LO = lin("#FFB36B");

  return {
    grip: 0,
    apply(ps) {
      const t = tOf(ps, S0), d = domeState(t), { s, A, st, tm } = d, a = alphaDeg(t);
      // dome uniforms
      for (let i = 0; i < 7; i++) { unif.uKd.value[i].set(...d.Kd[i]); unif.uKn.value[i].set(...d.Kn[i]); }
      unif.uTm.value.set(tm.mode, tm.azT, LEAN, tm.n0); unif.uSun.value.set(d.sun.az, d.sun.el, d.glow, A); unif.uMu.value.set(d.m, d.seamK, SEAM_W, 0);
      const sw = starWeights(s); unif.uSW.value.set(...sw); unif.uStar.value.set((ps.stars ?? S0.stars ?? 1) * (0.3 + 0.7 * A) * (1 - 0.6 * st), -a * DEG);
      const bake = (ps.bake ?? S0.bake ?? true) && t >= BAKE_T;
      if (bake && !unif.uBake.value) unif.uBake.value = bakeTex();
      unif.uBk.value.set(bake ? 1 : 0, bake ? Math.atan((9 * (driftD(t) - driftD(BAKE_T))) / 1000) / DEG : 0, 1);
      // sun
      const rho = ps.rho ?? S0.rho ?? sunRho(t), gain = (ps.sun ?? S0.sun ?? 1) * (1 - st), Lw = trailLen(s) * (ps.trail ?? S0.trail ?? 1), head = { az: rho * Math.cos(a * DEG), el: rho * Math.sin(a * DEG) };
      const above = sstep(-9, -3, head.el), core = sstep(0, 8, head.el);
      // comb: 8 discs every 22 deg of wheel angle, drifting along the wheel at 120 deg/s, weight 1 - A
      const base0 = (120 * t) % 22, pulse = 1 + 0.2 * Math.sin(TAU * phi(t));
      for (let j = 0; j < 8; j++) {
        const wa = base0 + 22 * j, wp = { az: rho * Math.cos(wa * DEG), el: rho * Math.sin(wa * DEG) }, al = 0.55 * pulse * (1 - A) * ghosts0(s) * gain * sstep(0, 5, wp.el) * sstep(0, 6, wa) * (1 - sstep(168, 178, wa));
        if (al > 0.003) putQuad(sb, j, wp.az, wp.el, 8, 8, 0, CELL.comb, COMB, al, 0.15); else hideQuad(sb, j);
      }
      // ghosts on the trail: k-th is .82^k the size, alpha .70 x .72^(k-1), stretched 1.25^k along the path
      const gcount = ghostCount(s);
      for (let k = 1; k <= 5; k++) {
        const wa = a - Lw * GH_Q[k - 1], gp = { az: rho * Math.cos(wa * DEG), el: rho * Math.sin(wa * DEG) }, pres = clamp(gcount - k + 1), al = 0.7 * Math.pow(0.72, k - 1) * pres * gain * sstep(-9, -3, gp.el), hh = 5 * Math.pow(0.82, k);
        if (al > 0.003) putQuad(sb, 7 + k, gp.az, gp.el, hh * Math.pow(1.25, k), hh, wa + 90, CELL.ghost, GH_COL[k - 1], al, 0.25); else hideQuad(sb, 7 + k);
      }
      // head: corona 8 deg (#FFD08A .55 -> 0) and core 3 deg (#FFF6D8, #FFB36B low)
      if (gain * above > 0.003) {
        putQuad(sb, 13, head.az, head.el, 8, 8, 0, CELL.corona, CORONA, 0.55 * gain * above, 0.5);
        putQuad(sb, 14, head.az, head.el, 3.1, 3.1, 0, CELL.core, CORE_LO.map((v, j) => lerp(v, CORE_HI[j], core)), gain * above, 0);
      } else { hideQuad(sb, 13); hideQuad(sb, 14); }
      touch(sb);
      // ribbon: tapered, width 1.6 -> .5 deg, #FFC98A -> #F08A5A, alpha .42 -> 0
      for (let j = 0; j < NS; j++) {
        const q = j / (NS - 1), wa = a - Lw * q, cr = Math.cos(wa * DEG), sr = Math.sin(wa * DEG), az = rho * cr, el = rho * sr, hw = lerp(1.6, 0.5, q) / 2, ce = Math.max(Math.cos(el * DEG), 0.3);
        const al = 0.42 * (1 - q) * gain * sstep(-9, -3, el);
        for (let sd = 0; sd < 2; sd++) {
          const sg = sd ? 1 : -1, dr = dirOf(az + (cr * hw * sg) / ce, el + sr * hw * sg), o = (j * 2 + sd) * 3;
          rp[o] = dr[0] * DIST; rp[o + 1] = dr[1] * DIST; rp[o + 2] = dr[2] * DIST;
          rc.set([lerp(RIB0[0], RIB1[0], q), lerp(RIB0[1], RIB1[1], q), lerp(RIB0[2], RIB1[2], q), al], (j * 2 + sd) * 4);
        }
      }
      rg.attributes.position.needsUpdate = true; rg.attributes.aCol.needsUpdate = true;
      // moon: crescent 2.6 deg, shown while N > .5 and A > .3, lit side toward the wheel centre
      const mp = moonAt(t), mN = nightField(tm, mp.az, mp.el), vis = (ps.moon ?? S0.moon ?? 1) * sstep(0.4, 0.62, mN) * sstep(0.24, 0.34, A) * (1 - st) * sstep(-6, 1, mp.el);
      if (vis > 0.003) putQuad(mb, 0, mp.az, mp.el, 13, 13, Math.atan2(-mp.el, -mp.az) / DEG, [0, 0, 1, 1], [1, 1, 1], vis, 0); else hideQuad(mb, 0);
      touch(mb);
    },
  };
}

// =============================================================================================================== sclouds
const CLOUD_VS = "attribute vec2 aNA; varying vec2 vUv; varying vec2 vNA; void main(){ vUv = uv; vNA = aNA; vec3 p = mat3(viewMatrix) * position; gl_Position = projectionMatrix * vec4(p, 1.0); }";
const CLOUD_FS = "uniform sampler2D uDay; uniform sampler2D uNight; varying vec2 vUv; varying vec2 vNA; void main(){ vec4 c = mix(texture2D(uDay, vUv), texture2D(uNight, vUv), vNA.x) * vNA.y; gl_FragColor = c;\n#include <colorspace_fragment>\n }";
function cloudsKind(P0) {
  const S0 = P0.spec, tab = cloudTable(), n = tab.length;   // 126
  const pos = new Float32Array(n * 12), uv = new Float32Array(n * 8), na = new Float32Array(n * 8), idx = new Uint16Array(n * 6);
  // atlas: the canvas top row is the streaks (texture v 2/3-1), the bottom row the cumulus (v 0-2/3)
  tab.forEach((it, i) => {
    idx.set([i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3], i * 6);
    const u0 = it.v * 0.25, v0 = it.kind ? 0 : THC / ATLAS_H, vh = it.kind ? THC / ATLAS_H : THS / ATLAS_H;
    [[u0, v0], [u0 + 0.25, v0], [u0 + 0.25, v0 + vh], [u0, v0 + vh]].forEach(([u, v], k) => { uv[i * 8 + k * 2] = u; uv[i * 8 + k * 2 + 1] = v; });
  });
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); geo.setAttribute("aNA", new THREE.BufferAttribute(na, 2)); geo.setIndex(new THREE.BufferAttribute(idx, 1));
  const day = ctex(atlasOf("day"), { nomip: false, premul: true }), night = ctex(atlasOf("night"), { nomip: false, premul: true });
  const mat = skyMaterial(CLOUD_VS, CLOUD_FS, { uDay: { value: day }, uNight: { value: night } });
  const mesh = lookOnly(new THREE.Mesh(geo, mat), -890); P0.whole.add(mesh);
  const ca = Math.cos(TILT), sa = Math.sin(TILT);
  return {
    grip: 0,
    apply(ps) {
      const t = tOf(ps, S0), st = storm(t), tm = terminatorAt(t), on = t < BAKE_T, A = skyA(t);   // the palette flip eases to the mid palette with A (no cloud strobe at speed)
      mesh.visible = on; if (!on) return;
      tab.forEach((it, i) => {
        const p = cloudAt(it, t), hw = p.w / 2, hh = p.h / 2, tx = it.kind ? 1 : ca, ty = it.kind ? 0 : sa;
        const al = (it.kind ? 0.9 : 0.52) * it.a * p.ex * (1 - 0.85 * st);
        [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sy], k) => {
          const lx = sx * hw, ly = sy * hh, x = p.cx + lx * tx - ly * ty, y = p.cy + lx * ty + ly * tx, o = i * 12 + k * 3;
          pos[o] = x; pos[o + 1] = y; pos[o + 2] = p.cz;
          const az = Math.atan2(x, -p.cz) / DEG, el = Math.atan2(y, Math.hypot(x, p.cz)) / DEG;
          na[i * 8 + k * 2] = lerp(0.5, nightField(tm, az, el), A); na[i * 8 + k * 2 + 1] = al;
        });
      });
      geo.attributes.position.needsUpdate = true; geo.attributes.aNA.needsUpdate = true;
    },
  };
}

// =============================================================================================================== sstorm (D)
const ST_C = [60, 140, -1500], DISC = 2400, SLIDE = 1400;
function lobePaint(g, x, y, r, lit, shade, a, k = 1) {   // one painted lobe: a shaded underside offset down-right, a bright top offset up-left, soft edges
  const soft = (cx, cy, rr, col, al) => { const gr = g.createRadialGradient(cx, cy, 0, cx, cy, rr); gr.addColorStop(0, rgba(col, al)); gr.addColorStop(0.62, rgba(col, al)); gr.addColorStop(1, rgba(col, 0)); g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, rr, 0, TAU); g.fill(); };
  soft(x + 0.16 * r, y + 0.26 * r, r, shade, a * 0.9); soft(x - 0.1 * r, y - 0.2 * r, r * 0.86, lit, a * k);
}
// Panel 5's hurricane. Log spiral r = r0 exp(b theta), counter-clockwise outward in the canvas (y up); each arm is a band of overlapping painted lobes
// (#E8EEF6 tops, #6F7C93 undersides) that thins and breaks up outward; a small clear eye (6 % of the disc radius); dark rain curtains hang off the arms.
const DISC_R = 1000, EYE_R = 60;
function spiralDisc(key, o) {
  return once(key, () => {
    const N = 2048, [c, g] = canvas(N, N), R = rngOf(SEED + o.seed), cx = N / 2, r0 = EYE_R * 1.35;
    if (o.base) { const gr = g.createRadialGradient(cx, cx, EYE_R * 1.2, cx, cx, N / 2); gr.addColorStop(0, rgba(o.base, 0)); gr.addColorStop(0.1, rgba(o.base, 0.8)); gr.addColorStop(0.55, rgba(o.base, 0.6)); gr.addColorStop(1, rgba(o.base, 0)); g.fillStyle = gr; g.fillRect(0, 0, N, N); }
    const at = (arm, r, lat) => { const th = ((o.off + (arm * 360) / o.arms) * DEG) + Math.log(r / r0) / o.b; return [cx + Math.cos(th) * r - Math.sin(th) * lat, cx - (Math.sin(th) * r + Math.cos(th) * lat), th]; };
    for (let arm = 0; arm < o.arms; arm++) {
      const total = (o.lobes[0] + Math.floor(R() * (o.lobes[1] - o.lobes[0] + 1))) * o.dense, ph = R() * 6;
      for (let i = 0; i < total; i++) {
        const u = (i + R() * 0.8) / total, r = r0 * Math.pow(DISC_R / r0, u), wd = lerp(o.wid[0], o.wid[1], Math.pow(u, 0.8));
        const keep = (1 - 0.8 * Math.pow(u, 1.5)) * (0.55 + 0.45 * (0.5 + 0.5 * Math.sin(u * 26 + ph)));   // thins and breaks up outward
        if (R() > keep) continue;
        const lat = (R() - 0.5) * wd * 0.8, rr = Math.max(wd * 0.5, 13 + 16 * u) * (0.75 + 0.6 * R()), [x, y, th] = at(arm, r, lat);
        if (R() < 0.18 && u < 0.85) {   // a rain curtain hanging on the inner side of the arm
          g.strokeStyle = rgba("#2B3345", 0.22 + 0.18 * R()); g.lineWidth = 3 + 4 * R(); g.lineCap = "round"; const L = 30 + 70 * R() * (1 - u * 0.5), ix = x - Math.cos(th) * 0 + Math.sin(th) * L * 0.9, iy = y + Math.cos(th) * L * 0.9;
          g.beginPath(); g.moveTo(x, y); g.lineTo(ix, iy); g.stroke();
        }
        lobePaint(g, x, y, rr, o.lit, o.shade, lerp(o.alpha[0], o.alpha[1], R()), 0.8 + 0.2 * R());
      }
    }
    g.globalCompositeOperation = "destination-out"; const eg = g.createRadialGradient(cx, cx, EYE_R * 0.9, cx, cx, EYE_R * 1.7); eg.addColorStop(0, "rgba(0,0,0,1)"); eg.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = eg; g.fillRect(0, 0, N, N);   // the clear eye
    g.globalCompositeOperation = "destination-in"; const f = g.createRadialGradient(cx, cx, 0, cx, cx, N / 2); f.addColorStop(0, "rgba(0,0,0,1)"); f.addColorStop(0.82, "rgba(0,0,0,1)"); f.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = f; g.fillRect(0, 0, N, N);
    const [c2, g2] = canvas(N, N); g2.filter = "blur(1.6px)"; g2.drawImage(c, 0, 0);
    return ctex(c2, { aniso: 4 });
  });
}
const EYE_QUAD = 480;   // metres; the eye is 6 % of the 1200 m disc radius = 72 m
function eyewallTex() {
  return once("eyewall", () => {
    const N = 1024, [c, g] = canvas(N, N), R = rngOf(SEED + 91), cx = N / 2, k = N / EYE_QUAD;   // px per metre
    const wall = g.createRadialGradient(cx, cx, 70 * k, cx, cx, 175 * k);
    wall.addColorStop(0, rgba("#6F7C93", 0.9)); wall.addColorStop(0.3, rgba("#9AA6BA", 0.95)); wall.addColorStop(0.7, rgba("#E8EEF6", 0.95)); wall.addColorStop(1, rgba("#E8EEF6", 0));
    g.fillStyle = wall; g.beginPath(); g.arc(cx, cx, 175 * k, 0, TAU); g.fill();
    for (let i = 0; i < 84; i++) {   // the sunlit eyewall: cumulus lobes, bright rim, warm on the upper left
      const th = (i / 84) * TAU + (R() - 0.5) * 0.06, rm = (110 + 46 * R()) * k, rr = (17 + 15 * R()) * k, sun = 0.5 + 0.5 * Math.cos(th - 2.3);
      lobePaint(g, cx + Math.cos(th) * rm, cx - Math.sin(th) * rm, rr, sun > 0.55 ? "#FFF8EC" : "#F2F6FB", "#6F7C93", 0.9, 0.85);
    }
    g.globalCompositeOperation = "destination-out"; const eg = g.createRadialGradient(cx, cx, 55 * k, cx, cx, 78 * k); eg.addColorStop(0, "rgba(0,0,0,1)"); eg.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = eg; g.beginPath(); g.arc(cx, cx, 78 * k, 0, TAU); g.fill();   // the clear eye: the sea shows through
    g.globalCompositeOperation = "source-over"; const sea = g.createRadialGradient(cx, cx, 0, cx, cx, 62 * k); sea.addColorStop(0, "rgba(78,98,128,0.55)"); sea.addColorStop(1, "rgba(78,98,128,0)"); g.fillStyle = sea; g.beginPath(); g.arc(cx, cx, 62 * k, 0, TAU); g.fill();
    return ctex(c, { aniso: 4 });
  });
}
function scudTex(v) {
  return once(`scud${v}`, () => {
    const [c, g] = canvas(256, 128), R = rngOf(SEED + 120 + v * 5);
    for (let i = 0; i < 8 + v; i++) { const x = 40 + 176 * (i + R() * 0.5) / (8 + v), y = 64 + (R() - 0.5) * 24, r = 22 + 26 * R(), gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, "rgba(138,150,168,0.9)"); gr.addColorStop(0.6, "rgba(138,150,168,0.55)"); gr.addColorStop(1, "rgba(138,150,168,0)"); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
    return ctex(c);
  });
}
function flashTex() { return once("flash", () => { const [c, g] = canvas(128, 128), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, "rgba(220,232,255,1)"); gr.addColorStop(0.35, "rgba(220,232,255,0.55)"); gr.addColorStop(1, "rgba(220,232,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return ctex(c, { nomip: true }); }); }
const FLASH_T = [11.9, 12.6, 13.05, 13.9, 14.5];
function stormKind(P0) {
  const S0 = P0.spec, plane = (w, h) => new THREE.PlaneGeometry(w, h);
  const mk = (map, order, geo) => { const m = noLine(new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false, depthTest: true, toneMapped: false, fog: false, side: THREE.DoubleSide })); return { m, mesh: lookOnly(new THREE.Mesh(geo ?? plane(DISC, DISC), m), order) }; };
  const d2 = mk(spiralDisc("d2", { seed: 71, arms: 5, off: 0, b: 0.36, lobes: [90, 140], dense: 9, wid: [190, 48], alpha: [0.6, 0.9], lit: "#E8EEF6", shade: "#6F7C93", base: "#4A566B" }), 100);
  const d3 = mk(spiralDisc("d3", { seed: 72, arms: 4, off: 36, b: 0.42, lobes: [110, 130], dense: 7, wid: [140, 36], alpha: [0.6, 0.95], lit: "#F2F6FB", shade: "#6F7C93", base: null }), 101);
  const d4 = mk(eyewallTex(), 102, plane(EYE_QUAD, EYE_QUAD));
  d2.mesh.position.z = -1530; d3.mesh.position.z = -1500; d4.mesh.position.z = -1480;
  const discs = [[d2, 14], [d3, 22], [d4, 40]];
  for (const [d] of discs) P0.whole.add(d.mesh);
  // 22 scud billows (z -300..-900, 60-200 m, #8A96A8 at .6, right -> left at 60-140 m/s)
  const R = rngOf(SEED + 130), scud = Array.from({ length: 22 }, (_, i) => ({ x0: -600 + 1200 * fr(i * 0.7548776662 + 0.2), y: -130 + 280 * R(), z: -(300 + 600 * fr(i * 0.618 + 0.3)), w: 60 + 140 * R(), v: 60 + 80 * R(), tex: i % 3, a: 0.45 + 0.15 * R() }));
  // one mesh per texture variant (3), billow i belongs to variant i % 3
  const scudMeshes = [0, 1, 2].map((v) => { const items = scud.filter((s) => s.tex === v), n = items.length, pos = new Float32Array(n * 12), uv = new Float32Array(n * 8), idx = new Uint16Array(n * 6), geo = new THREE.BufferGeometry(); for (let i = 0; i < n; i++) { idx.set([i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3], i * 6); uv.set([0, 0, 1, 0, 1, 1, 0, 1], i * 8); } geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); geo.setIndex(new THREE.BufferAttribute(idx, 1)); const m = noLine(new THREE.MeshBasicMaterial({ map: scudTex(v), transparent: true, depthWrite: false, depthTest: true, toneMapped: false, fog: false, side: THREE.DoubleSide })); const mesh = lookOnly(new THREE.Mesh(geo, m), 103); P0.whole.add(mesh); return { items, pos, geo, m }; });
  const fm = noLine(new THREE.MeshBasicMaterial({ map: flashTex(), transparent: true, depthWrite: false, depthTest: true, toneMapped: false, fog: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
  const flash = lookOnly(new THREE.Mesh(plane(300, 300), fm), 104); P0.whole.add(flash);
  // the lightning blobs sit at seeded points on D3's arms (radius .35-.85 of the disc), fixed in the world for their .2 s
  const FR = rngOf(SEED + 140), flashes = FLASH_T.map((t0, i) => ({ t0, arm: i % 4, rr: 0.35 + 0.5 * FR(), jit: (FR() - 0.5) * 0.3 }));
  return {
    grip: 0,
    apply(ps) {
      const t = tOf(ps, S0), st = storm(t);
      P0.whole.visible = st > 0.002; if (st <= 0.002) return;
      const dx = SLIDE * (1 - S(P(t, 10.9, 11.5))) - SLIDE * S(P(t, 15, 15.5)), Dn = driftD(t);
      const tilt = (ps.tilt ?? S0.tilt ?? 58) * DEG;   // the discs lie back, seen low over the ocean horizon: top edge away, foreshortened by cos(tilt)
      for (const [d, rate] of discs) { d.mesh.position.x = ST_C[0] + dx; d.mesh.position.y = ST_C[1]; d.mesh.rotation.set(-tilt, 0, (rate / 5.5) * Dn * DEG); d.m.opacity = st; }
      for (const sm of scudMeshes) {
        sm.items.forEach((s, i) => {
          const x = ((((s.x0 - s.v * t) % 1200) + 1800) % 1200) - 600 + dx, hw = s.w / 2, hh = s.w * 0.25, o = i * 12;
          sm.pos.set([x - hw, s.y - hh, s.z, x + hw, s.y - hh, s.z, x + hw, s.y + hh, s.z, x - hw, s.y + hh, s.z], o);
        });
        sm.geo.attributes.position.needsUpdate = true; sm.m.opacity = 0.6 * st;
      }
      let fo = 0;
      for (const f of flashes) {
        const tau = t - f.t0; if (tau < 0 || tau > 0.2) continue;
        const lr = f.rr * 1000 * (DISC / 2048), a = (36 + f.arm * 90) * DEG + Math.log((f.rr * 1000) / (EYE_R * 1.35)) / 0.42 + f.jit + ((22 / 5.5) * driftD(f.t0)) * DEG;   // on D3's arm, turned with D3 as it was at the flash
        const lx = Math.cos(a) * lr, ly = Math.sin(a) * lr;
        flash.position.set(ST_C[0] + dx + lx, ST_C[1] + ly * Math.cos(tilt), -1490 - ly * Math.sin(tilt)); flash.rotation.x = -tilt;
        fo = 0.6 * (1 - tau / 0.2);
      }
      fm.opacity = fo * st; flash.visible = fo > 0.001;
    },
  };
}

export const SPINSKY_KINDS = { ssky: skyKind, sclouds: cloudsKind, sstorm: stormKind };
