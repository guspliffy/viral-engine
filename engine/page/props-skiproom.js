import * as THREE from "three";
import { clamp } from "./util.js";
import { FIRE_U } from "./firelight.js";

// Happiness EP02 "skip the boring parts" (16 Nov 2026, task T9; DESIGN.md section 5): old Spud's walnut box TV and the
// sideboard it stands on (panels 11 dark, 13 playing, 14 lighting his face). Metres, origin the middle of the base, the
// front face toward +z. Every mark is drawn once by index (no Math.random, no clock, no tiled texture); the picture and
// the glow come from the keys and story time only. Registered in props3d.js as SKIPROOM_KINDS.
//
//   boxtv       the walnut cabinet TV, 0.78 wide x 0.54 tall x 0.42 deep, walnut #6b4a32 with 2 drawn grain runs per face
//               (front, top, both sides), ORIGIN the middle of its BASE, screen facing +z. The bulged 4:3 glass is 0.52 x
//               0.39, corner 0.06, 0.025 proud at the centre, in a #4a3a2c surround; its centre is at (x -0.045, y 0.29,
//               z 0.214) so the knob column clears the glass. Two brass #b08a3c knobs r 0.028 at x +0.30, y 0.43 and 0.34
//               (DESIGN's (0.30, 0.16) and (0.30, 0.07) from the middle of the front face, y 0.27), and 9 speaker slats
//               0.14 x 0.006 under them (y 0.28 down to 0.136). About 1.5k triangles.
//               spec: { color "#6b4a32", surround "#4a3a2c", knob "#b08a3c", grain "#4e3421", glow 1, glowReach 2.2,
//                       castLight 0, screen { src, cols, rows, tint? }, fps 0, t0 0, loop true, on, feed }
//               spec.screen.src is a REPO PATH to a PNG atlas of cols x rows tiles, row by row ("storyboards/.../atlas.png",
//               "assets/screens/<name>/atlas.png"); cols 1 rows 1 = a single still. Without spec.screen the lit screen is a
//               flat blue-grey card (so a bench or a layout pass still reads).
//               KEY on 0..1 (propState's own, spec.on, default 0): 0 = dark glass (panel 11: #0e1113 with its sheen,
//               vignette and streak), 1 = the picture, the whites lifted 0.04 toward blue, and the glow light lit. It
//               crossfades, so tween it like any key.
//               KEY feed (propState's own, spec.feed, default 0): the TILE INDEX, floored. Tween it to play the atlas
//               (feed 0 -> 24 over 2.0 s = DESIGN's 12 drawings a second). ALTERNATIVE, time-based: spec.fps > 0 (12 for
//               DESIGN) steps the tile from STORY TIME instead, tile = floor((t - spec.t0) * fps), wrapped by spec.loop
//               (default true; false holds the last tile). spec.fps ignores `feed`.
//               CRT read, drawn once per frame, no scanline tile: the bulge itself, a corner vignette at 0.35, one
//               diagonal reflection streak at 0.18, a 0.04 blue lift on the whites. (DESIGN's rewind tracking bars are
//               not built: the director dropped them from draft 1.)
//               THE GLOW: one point light at the screen's centre, 0.06 in front of the glass (x -0.045, y 0.29, z 0.299 in
//               the prop's frame), colour = the tile's average (spec.screen.tint ["#hex", ...] per tile overrides it; else
//               it is measured from the tile itself), intensity 0.55 x spec.glow, range spec.glowReach 2.2, stepping with
//               the tiles. The colour carries `on` (the engine rescales every room light's intensity each frame, so a
//               light must not carry a level in its intensity). It lights the SET and PROPS near it.
//               THE GLOW ON THE CAST: the drawn look's toon shading keeps only how lit a surface is, not what lights it,
//               so that point light does nothing to a face (looks.js, props-fire.js). A fire's channel carries it instead:
//               spec.castLight (opt-in, DEFAULT 0 = exactly nothing) feeds firelight.js FIRE_U with the glow point, the
//               tile's HUE (the average lifted to full strength: a picture's average is dark and the channel multiplies it
//               by the surface's own colour) and that strength while `on`; patchToon then paints a hard band of that colour
//               on every plane turned to the TV. It is ONE channel for the whole scene (a fire or a second lit TV would
//               fight it), so only the playing TV should have it. Reach: the band is min(0.8, castLight / (1 + 1.4 d^2)),
//               so 0.28 of it on a face 1.35 m away (DESIGN's distance for old Spud) at castLight 1 and 0.74 on the wall
//               and the cabinet half a metre off, which a whole-scene tint has to live with. Bench proof, TV on against TV
//               off at castLight 1: bench/tv/contact.png (7.80 s / 9.60 s).
//               Size 0.78 x 0.54 x 0.42. Stands on the sideboard: y = SIDEBOARD.top (0.55).
//   sideboard   the small walnut sideboard under it, 0.90 wide x 0.55 tall x 0.42 deep, ORIGIN the middle of its base,
//               front toward +z: a plinth 0.05 tall set back 0.03, the carcase, a top slab 0.03 thick overhanging 0.02 all
//               round (so the TV's base rests at y 0.55 = SIDEBOARD.top, exported), two doors with inset panels either
//               side of a centre stile and a brass knob r 0.012 on each, 2 grain runs per face. No keys.
//               spec: { color "#6b4a32", panel "#5c3f2b", knob "#b08a3c", grain "#4e3421", w 0.9, h 0.55, d 0.42 }
//               About 0.7k triangles. Size 0.90 x 0.55 x 0.42.

export const SIDEBOARD = { w: 0.9, h: 0.55, d: 0.42, top: 0.55 };
export const BOXTV = { w: 0.78, h: 0.54, d: 0.42, screen: [0.52, 0.39], screenAt: [-0.045, 0.29, 0.214], glowAt: [-0.045, 0.29, 0.299] };

const hash = (i) => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
let LIT = null;   // which boxtv owns the shared fire channel (firelight.js FIRE_U) this frame
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.62, ...o });
function add(parent, geo, m, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
function decal(parent, geo, m, x, y, z) {
  const o = add(parent, geo, m, x, y, z); o.castShadow = false;
  m.polygonOffset = true; m.polygonOffsetFactor = -2; m.polygonOffsetUnits = -2;
  return o;
}

// a rounded rectangle, middle at 0, 0
function rrShape(w, h, r) {
  const a = w / 2, b = h / 2, s = new THREE.Shape();
  s.moveTo(-a + r, -b); s.lineTo(a - r, -b); s.absarc(a - r, -b + r, r, -Math.PI / 2, 0, false);
  s.lineTo(a, b - r); s.absarc(a - r, b - r, r, 0, Math.PI / 2, false);
  s.lineTo(-a + r, b); s.absarc(-a + r, b - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(-a, -b + r); s.absarc(-a + r, -b + r, r, Math.PI, 1.5 * Math.PI, false);
  return s;
}

// ONE grain run: a wavy ribbon 2-4 mm wide drawn along the face's long axis, each one placed by its index (seed), never
// a tile. Returns a flat geometry in the x/y plane, to be turned onto the face it belongs to.
function grainGeo(len, off, seed, amp = 0.012) {
  const N = 22, pos = [], idx = [];
  const ph = hash(seed) * 6.283, ph2 = hash(seed + 7.3) * 6.283, k = 1.6 + hash(seed + 2.1) * 1.8;
  for (let i = 0; i <= N; i++) {
    const u = -len / 2 + (len * i) / N, p = u / len;
    const y = off + amp * Math.sin(ph + p * 6.283 * k) + amp * 0.45 * Math.sin(ph2 + p * 6.283 * k * 2.3);
    const th = 0.0012 + 0.0011 * (0.5 + 0.5 * Math.sin(ph2 + p * 6.283 * 1.7));
    pos.push(u, y - th, 0, u, y + th, 0);
  }
  for (let i = 0; i < N; i++) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}
// the 2 runs of one face: `place` turns a flat ribbon onto that face
function grainPair(parent, m, len, span, seed, place) {
  for (let i = 0; i < 2; i++) {
    const off = span * (i === 0 ? -0.26 : 0.24) + (hash(seed + i * 3.7) - 0.5) * span * 0.18;
    const o = decal(parent, grainGeo(len, off, seed + i * 11.9, Math.min(0.014, span * 0.09)), m, 0, 0, 0);
    place(o, i);
  }
}

// the bulged 4:3 glass: a grid over the rounded rectangle (the unit square mapped onto its outline), 0.025 proud at the
// middle, with the picture spanning its bounding box
function glassGeo(w, h, r, bulge, NX = 20, NY = 16) {
  const hw = w / 2, hh = h / 2, cx = hw - r, cy = hh - r, pos = [], uv = [], idx = [];
  for (let j = 0; j <= NY; j++) for (let i = 0; i <= NX; i++) {
    const u = -1 + (2 * i) / NX, v = -1 + (2 * j) / NY, m = Math.max(Math.abs(u), Math.abs(v));
    let x = 0, y = 0;
    if (m > 1e-6) {
      const du = u / m, dv = v / m;                                  // the point on the unit square's edge
      let qx = Math.abs(du) * hw, qy = Math.abs(dv) * hh;
      if (qx > cx && qy > cy) { const ex = qx - cx, ey = qy - cy, L = Math.hypot(ex, ey) || 1; qx = cx + (r * ex) / L; qy = cy + (r * ey) / L; }
      x = Math.sign(du) * qx * m; y = Math.sign(dv) * qy * m;
    }
    pos.push(x, y, bulge * (1 - m * m)); uv.push(x / w + 0.5, y / h + 0.5);
  }
  for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
    const a = j * (NX + 1) + i, b = a + 1, c = a + NX + 1, d = c + 1;
    idx.push(a, b, c, b, d, c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

// ------------------------------------------------------------------------------------------------ the box TV
function boxtv(P) {
  const S = P.spec, W = BOXTV.w, H = BOXTV.h, D = BOXTV.d;
  const wood = std(S.color || "#6b4a32", { roughness: 0.66 });
  const grainM = std(S.grain || "#4e3421", { roughness: 0.8 });
  const surM = std(S.surround || "#4a3a2c", { roughness: 0.7 });
  const brass = std(S.knob || "#b08a3c", { roughness: 0.38, metalness: 0.55 });
  const dark = std("#241c15", { roughness: 0.9 });
  const g = new THREE.Group(); P.whole.add(g);

  // the cabinet, and its grain: 2 runs on the front (in the band under the glass), the top and each side
  add(g, new THREE.BoxGeometry(W, H, D), wood, 0, H / 2, 0);
  grainPair(g, grainM, W * 0.9, 0.05, 101, (o) => { o.position.set(0, 0.05, D / 2 + 0.001); });
  grainPair(g, grainM, W * 0.92, 0.15, 203, (o) => { o.rotation.x = -Math.PI / 2; o.position.set(0, H + 0.001, 0); });
  for (const s of [1, -1]) grainPair(g, grainM, D * 0.9, 0.16, 307 + s * 13, (o) => { o.rotation.y = s * Math.PI / 2; o.position.set(s * (W / 2 + 0.001), H / 2, 0); });

  // the glass, its surround and the dark gap round it
  const [SW, SH] = BOXTV.screen, [SX, SY, SZ] = BOXTV.screenAt, R = 0.06;
  const bez = new THREE.Shape(); bez.setFromPoints(rrShape(SW + 0.08, SH + 0.08, R + 0.03).getPoints(40));
  bez.holes.push(new THREE.Path(rrShape(SW + 0.004, SH + 0.004, R).getPoints(40)));
  decal(g, new THREE.ShapeGeometry(bez, 10), surM, SX, SY, D / 2 + 0.001);
  decal(g, new THREE.ShapeGeometry(rrShape(SW + 0.004, SH + 0.004, R), 10), dark, SX, SY, D / 2 + 0.0005);

  // the picture: a canvas the glass carries, redrawn only when the tile or `on` changes
  const SC = S.screen, NT = SC ? Math.max(1, SC.cols * SC.rows) : 1;
  const CW = 1024, CH = 768;
  const cv = document.createElement("canvas"); cv.width = CW; cv.height = CH;
  const ctx = cv.getContext("2d"), tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const glassM = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, fog: false });
  glassM.userData.noOutline = true;
  const glass = add(g, glassGeo(SW, SH, R, 0.025), glassM, SX, SY, SZ);   // SZ = D / 2 + 0.004: the glass's rim plane
  glass.castShadow = false; glass.receiveShadow = false;

  // the knobs (a brass face, a pointer notch, a dark collar behind) and the speaker slats under them
  for (const ky of [0.43, 0.34]) {
    const k = add(g, new THREE.CylinderGeometry(0.028, 0.026, 0.026, 18), brass, 0.30, ky, D / 2 + 0.013);
    k.rotation.x = Math.PI / 2;
    const c = add(g, new THREE.CylinderGeometry(0.034, 0.034, 0.004, 18), dark, 0.30, ky, D / 2 + 0.002); c.rotation.x = Math.PI / 2;
    decal(g, new THREE.PlaneGeometry(0.004, 0.018), dark, 0.30, ky + 0.009, D / 2 + 0.027);
  }
  for (let i = 0; i < 9; i++) decal(g, new THREE.PlaneGeometry(0.14, 0.006), dark, 0.30, 0.28 - i * 0.018, D / 2 + 0.001);

  // the glow: one point light in front of the glass; its colour carries `on` and the tile's average
  const light = new THREE.PointLight("#000000", 0.55 * (S.glow ?? 1), S.glowReach ?? 2.2, 1.6);
  light.position.set(...BOXTV.glowAt); g.add(light);

  // the tile's average colour, measured once per tile from the atlas itself (spec.screen.tint overrides it)
  const sc = document.createElement("canvas"); sc.width = 16; sc.height = 12;
  const sg = sc.getContext("2d", { willReadFrequently: true });
  const avgs = {}, pics = {};
  if (SC && SC.src) (globalThis.__loads ||= []).push(new THREE.ImageLoader().loadAsync(`/${String(SC.src).replace(/^\/+/, "")}`).then((img) => { pics.atlas = img; }).catch(() => {}));
  const avg = (i) => {
    if (SC && SC.tint && SC.tint[i]) return new THREE.Color(SC.tint[i]);
    if (avgs[i]) return avgs[i];
    if (!pics.atlas) return new THREE.Color("#9fb6c8");
    const tw = pics.atlas.width / SC.cols, th = pics.atlas.height / SC.rows;
    sg.drawImage(pics.atlas, (i % SC.cols) * tw, Math.floor(i / SC.cols) * th, tw, th, 0, 0, 16, 12);
    const d = sg.getImageData(0, 0, 16, 12).data;
    let r = 0, gg = 0, b = 0;
    for (let k = 0; k < d.length; k += 4) { r += d[k]; gg += d[k + 1]; b += d[k + 2]; }
    const n = d.length / 4, c = new THREE.Color().setRGB(r / n / 255, gg / n / 255, b / n / 255, THREE.SRGBColorSpace);
    return (avgs[i] = c);
  };
  // the same colour at full strength for the cast's band: a tile's average is dark (a picture is mostly mid tones) and
  // the fire channel multiplies it by the surface's own colour, so the hue is kept and the level comes from castLight
  const hues = {};
  const hue = (i) => {
    if (hues[i]) return hues[i];
    const c = avg(i).clone(), m = Math.max(c.r, c.g, c.b);
    return (hues[i] = m > 0.02 ? c.multiplyScalar(1 / m) : c);
  };

  // the CRT marks, drawn once each (no scanline tile): the corner vignette, one diagonal reflection streak
  const marks = (on) => {
    const vg = ctx.createRadialGradient(CW / 2, CH / 2, CH * 0.22, CW / 2, CH / 2, CH * 0.78);
    vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, `rgba(0,0,0,${(0.35 + 0.15 * (1 - on)).toFixed(3)})`);
    ctx.fillStyle = vg; ctx.fillRect(0, 0, CW, CH);
    ctx.save(); ctx.translate(CW * 0.34, CH * 0.42); ctx.rotate(-0.62);
    const st = ctx.createLinearGradient(0, -CH * 0.09, 0, CH * 0.09);
    st.addColorStop(0, "rgba(255,255,255,0)"); st.addColorStop(0.5, `rgba(255,255,255,${(0.18 + 0.06 * (1 - on)).toFixed(3)})`); st.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = st; ctx.fillRect(-CW * 0.7, -CH * 0.09, CW * 1.4, CH * 0.18); ctx.restore();
  };
  const draw = (i, on) => {
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#0e1113"; ctx.fillRect(0, 0, CW, CH);                       // the dark glass of panel 11
    if (on > 0.004) {
      ctx.save(); ctx.globalAlpha = on;
      if (SC && pics.atlas) {
        const tw = pics.atlas.width / SC.cols, th = pics.atlas.height / SC.rows;
        ctx.drawImage(pics.atlas, (i % SC.cols) * tw, Math.floor(i / SC.cols) * th, tw, th, 0, 0, CW, CH);
      } else { ctx.fillStyle = "#4f6b86"; ctx.fillRect(0, 0, CW, CH); }
      ctx.globalCompositeOperation = "screen"; ctx.globalAlpha = on * 0.04;      // the blue lift on the whites
      ctx.fillStyle = "#4a78ff"; ctx.fillRect(0, 0, CW, CH); ctx.restore();
    }
    ctx.globalCompositeOperation = "source-over";
    marks(on); tex.needsUpdate = true;
  };
  let drawn = "";
  const wp = new THREE.Vector3();
  return { grip: 0, apply(ps, t) {
    const on = clamp(ps.on ?? 0);
    let i;
    if (S.fps) { const k = Math.floor(((t ?? 0) - (S.t0 ?? 0)) * S.fps); i = S.loop === false ? Math.min(NT - 1, Math.max(0, k)) : ((k % NT) + NT) % NT; }
    else i = Math.min(NT - 1, Math.max(0, Math.floor((ps.feed ?? 0) + 1e-6)));
    const key = `${i}|${on.toFixed(3)}|${!!pics.atlas}`;
    if (key !== drawn) { drawn = key; draw(i, on); }
    light.color.copy(avg(i)).multiplyScalar(on);
    // the glow on the cast (opt-in): the fire channel, since the drawn look's shading ignores point lights
    if (S.castLight) {
      if (on > 0.004) {
        light.updateWorldMatrix(true, false); light.getWorldPosition(wp);
        FIRE_U.uFirePos.value.copy(wp); FIRE_U.uFireCol.value.copy(hue(i)); FIRE_U.uFireK.value = S.castLight * on; LIT = S.id;
      } else if (LIT === S.id) { FIRE_U.uFireK.value = 0; LIT = null; }
    }
  } };
}

// ------------------------------------------------------------------------------------------------ the sideboard
function sideboard(P) {
  const S = P.spec, W = S.w ?? SIDEBOARD.w, H = S.h ?? SIDEBOARD.h, D = S.d ?? SIDEBOARD.d;
  const wood = std(S.color || "#6b4a32", { roughness: 0.66 });
  const panelM = std(S.panel || "#5c3f2b", { roughness: 0.72 });
  const grainM = std(S.grain || "#4e3421", { roughness: 0.8 });
  const brass = std(S.knob || "#b08a3c", { roughness: 0.38, metalness: 0.55 });
  const g = new THREE.Group(); P.whole.add(g);
  const PL = 0.05, TS = 0.03, OV = 0.02;                                  // plinth, top slab, the top's overhang
  add(g, new THREE.BoxGeometry(W - 0.06, PL, D - 0.06), std("#4e3421", { roughness: 0.8 }), 0, PL / 2, 0);
  const cH = H - PL - TS;
  add(g, new THREE.BoxGeometry(W, cH, D), wood, 0, PL + cH / 2, 0);
  add(g, new THREE.BoxGeometry(W + 2 * OV, TS, D + 2 * OV), wood, 0, H - TS / 2, 0);   // the top: the TV stands on y = H

  // two doors with an inset panel each, a centre stile between them, a brass knob on each
  const dW = (W - 0.09) / 2, dH = cH - 0.06, cy = PL + cH / 2;
  for (const s of [-1, 1]) {
    const x = s * (W / 4 + 0.005);
    decal(g, new THREE.PlaneGeometry(dW, dH), wood, x, cy, D / 2 + 0.002);
    decal(g, new THREE.PlaneGeometry(dW - 0.08, dH - 0.08), panelM, x, cy, D / 2 + 0.003);
    const k = add(g, new THREE.CylinderGeometry(0.012, 0.010, 0.022, 14), brass, x + s * (dW / 2 - 0.035), cy + 0.02, D / 2 + 0.013);
    k.rotation.x = Math.PI / 2;
  }
  // the grain: 2 runs on the top, 2 on each side, 2 across the doors
  grainPair(g, grainM, W * 0.92, 0.1, 401, (o) => { o.rotation.x = -Math.PI / 2; o.position.set(0, H + 0.001, 0); });
  for (const s of [1, -1]) grainPair(g, grainM, D * 0.9, 0.16, 503 + s * 17, (o) => { o.rotation.y = (s * Math.PI) / 2; o.position.set(s * (W / 2 + 0.001), cy, 0); });
  grainPair(g, grainM, W * 0.9, 0.08, 607, (o) => { o.position.set(0, cy, D / 2 + 0.004); });
  return { grip: 0 };
}

export const SKIPROOM_KINDS = { boxtv, sideboard };
