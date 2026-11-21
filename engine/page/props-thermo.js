// Potato Desk 11 "Thermostat war": the hero props thermostat, thermobox, stepstool (storyboards/series/potato-desk/11-thermostat/DESIGN.md sections 2, 3).
// Metres; x right, y up, +z toward the camera. Deterministic: pure functions of the prop state and the clip time, seeded drawing only, no clock.
// Bench: storyboards/lookdev/make-thermo-bench.mjs -> thermo-bench.json (every state, the three cameras of the DESIGN).
// Lettering: the only marks are the thermostat's two LCD digits (drawn as seven segments, no font) and its degree ring.
//
// thermostat   A wall thermostat. ORIGIN = the centre of its back face ON the wall; it faces +z (design: x 0, y 1.36, z -1.30). Everything below is in that frame.
//              Wall plate 0.42 x 0.38 x 0.012 #D9D0B8 (four screw bosses O0.035 at (+-0.15, +-0.13), a dust outline on the wall). Cover 0.48 x 0.44 x 0.075, r 0.05,
//              #E4DCC6 (x -0.24..0.24, y -0.22..0.22, front face z 0.075, hollow behind, inside #D2C9B0, lower edge band #CFC6AD). LCD window 0.34 x 0.20, centre y +0.065,
//              sunk 0.006 behind a bezel #BDB49C. Ground #B9C4A8, unlit segments #AAB69B, lit #1E2A22. Two seven-segment digits 0.165 high x 0.095 wide, 0.04 apart,
//              stroke 0.026, slanted 6 degrees; degree ring O0.03, stroke 0.008, top right. The LCD is unlit paint (basic material): no light pool or shadow dims it.
//              Buttons O0.09, 0.012 proud, #BFB7A2 with a 0.004 rim #8E8775, centres y -0.135 at x -0.105 (UP, triangle up) and +0.105 (DOWN, triangle down), triangles #5E5A50.
//              Not held. The cover and the plate are solid (a palm or fingertip may touch them); the LCD and the tape are paint.
//   spec.temp  start value (default 19), 12..30 or "blank". STATE `temp`: a number shows Math.round(temp) clamped 12..30 (a tween steps through whole numbers, the degree
//              ring lit); a string ("blank") or any pop > 0 shows every segment unlit and no ring.
//   state up, down  0..1 (default 0): the cap dips 0.006 * value; the LCD ground flashes #C9D4B8 while the value is above 0.7 (a pure function of the tween value, so a 0 -> 1 -> 0
//              tween of 0.15 s gives about 2 frames). A held value of 1 shows the flash all the time.
//   spec.tape / state tape  0..1 (default 0): two strips of grey duct tape #9FA7B0 (Sol r1: cream vanished on the cover) 0.17 x 0.034, torn ends, crossed at +-42 degrees over DOWN, the first lands by 0.5, the second by 1
//              (each drops 0.05 and shrinks from 1.15 as it lands).
//   state shake  0..1 (default 0): the cover and all it carries rock +-5 degrees and +-0.012 in x at 9 Hz from the clip time t (the plate stays).
//   spec.pop / state pop  0..1 (default 0), as the DESIGN: 0..0.2 the cover jumps 0.03 off the plate; 0.2..1 it swings in the wall's plane about its top right clip at (+0.24, +0.22)
//              (a grey hinge bracket shows there from pop > 0.01)
//              to 105 degrees and back to 95 (centre ends at (+0.48, 0, 0.105), face to camera, LCD blank, plate bare). Nothing is behind it: no board, no battery.
//   Grip points (gripPoint(spec, name); props3d.js needs THERMO_GRIPS in its GRIPS, see the report): the numbers are in the frame above. They are static: the
//   director moves them with the state where it says so.
//     btnUp        (-0.105, -0.135, 0.087)   the UP cap's front at rest (subtract 0.006 * up while it dips)
//     btnDown      (+0.105, -0.135, 0.087)   the DOWN cap's front
//     coverLowL    (-0.240, -0.220, 0.075)   the cover's lower left front corner (the mug's wall)
//     coverRight   (+0.240,  0.000, 0.0375)  the middle of the cover's right edge (the ice bag)
//     coverClip    (+0.240, -0.220, 0.075)   the low right front corner at pop 0 (the flick)
//     coverLow     (+0.327, -0.254, 0.105)   the lowest point of the hanging cover at pop 1 (world y 1.106 at the design origin): where the fingertip props it
//
// thermobox    A clear lock box over the thermostat. ORIGIN as the thermostat (centre of the back face on the wall). 0.58 x 0.54 x 0.13, wall 0.006, #DCEBEE at 20 %, bright edges
//              #F4FBFC at 60 %, four steel tabs 0.05 x 0.05 #B9BEC4 at the corners (x +-0.315, y +-0.245) each with a screw head O0.018 #8E959B, a brass-grey lock barrel O0.05
//              #C9CED2 0.02 proud centred at (0, -0.235) with a 0.004 slot. The clear front has the LCD window CUT in it (0.36 x 0.22 centred y +0.065, no edge round the hole):
//              the plastic never muddies the digits. spec.window 0 = a full clear front (for comparison only). The shell is solid (palms lie on it).
//   state on    0..1 (tween it: propState starts `on` at 0 = hidden): slides in along the wall from x +0.60, tipped 20 degrees, seats with a 0.008 bounce in z (over on 0..0.85, bounce 0.85..1).
//   state key / spec.key  0..1 (default 0 = the key IS in the lock, not turned; 1 = gone): 0..0.5 the brass key #C9A23C (0.07 long, bow O0.024) and the barrel slot turn 90 degrees,
//              0.5..1 it is drawn out 0.14 along +z and shrinks away (hidden at 1; the slot stays turned).
//   state tug   -1..1 (default 0): the box slides 0.035 * tug in x and tips 7 degrees * tug (top toward +x when tug > 0). Palms on sideL / sideR must add the same: x + 0.035 * tug.
//   state rip / spec.rip  0..1 (default 0): the box lifts 0.03 off the wall by 0.6 while the four screws walk out (shafts show in the wall, 6 specks of plaster dust each), at 0.8..1 the
//              lower pair let go and the bottom tips out 12 degrees about the top edge. spec.dropAt (story seconds, default none = it stays hanging): from dropAt, with rip 1, it falls
//              straight down to the floor over 0.5 s (centre height from its start to 0.276, tumbling to 70 degrees top back) and slides to spec.floorZ (default -0.9) and settles in 0.15 s on its
//              back, front face up, 0.065 above the floor (WORLD y 0; the origin's y and z are the prop's own, the fall is worked out from them). It is not a physics body.
//   Grip points (box frame, static; add the tug / on offsets above):
//     sideL (-0.29, 0, 0.065)   sideR (+0.29, 0, 0.065)   railR (+0.22, -0.27, 0.065)   barrel (0, -0.235, 0.15)
//
// stepstool    spec.h 0.74 (default): three treads, tops at 0.25 / 0.50 / 0.74, treads 0.03 #C9A878, wood #B98A56, stringers, risers and a back. The top tread is the footprint
//              0.38 (x) x 0.36 (z), centred on the ORIGIN (bottom centre = under the top tread's middle), x -0.19..+0.19; the two lower treads (0.22 deep each) step down toward -x:
//              mid x -0.41..-0.19 (top 0.50), low x -0.63..-0.41 (top 0.25). Whole piece x -0.63..+0.19. rot turns it about the origin.
//              spec.h 0.26: one box 0.40 x 0.26 x 0.36 (x, y, z), top slab 0.03 #C9A878 overhanging 0.005, sides #B98A56, a darker hand hole on the +z face. Origin: bottom centre.
//              Every tread and side is solid (userData.solid true): a body stands on the tops. Not held.
import * as THREE from "three";
import { clamp, rng } from "./util.js";
import { mat, mesh, canvasTex } from "./props-trend.js";

export const THERMO_GRIPS = {
  thermostat: { btnUp: [-0.105, -0.135, 0.087], btnDown: [0.105, -0.135, 0.087], coverLowL: [-0.24, -0.22, 0.075], coverRight: [0.24, 0, 0.0375], coverClip: [0.24, -0.22, 0.075], coverLow: [0.327, -0.254, 0.105] },
  thermobox: { sideL: [-0.29, 0, 0.065], sideR: [0.29, 0, 0.065], railR: [0.22, -0.27, 0.065], barrel: [0, -0.235, 0.15] },
};

const DEG = Math.PI / 180, TAU = Math.PI * 2;
const sm = (u) => { const k = clamp(u); return k * k * (3 - 2 * k); };
const eo = (u) => { const k = clamp(u); return 1 - (1 - k) * (1 - k) * (1 - k); };
const decor = (o) => { o.userData.solid = false; o.castShadow = false; return o; };
const solid = (o) => { o.userData.solid = true; return o; };
const flat = (m) => { m.userData.noOutline = true; return m; };
const basic = (o) => { const m = new THREE.MeshBasicMaterial(o); m.userData.noOutline = true; m.userData.noHatch = true; return m; };
function box(w, h, d, parent, m, x = 0, y = 0, z = 0) { return mesh(new THREE.BoxGeometry(w, h, d), m, parent, x, y, z); }
// a disc with its axis along z, its back face at z0
function disc(r, h, parent, m, x, y, z0, seg = 28) { return mesh(new THREE.CylinderGeometry(r, r, h, seg).rotateX(Math.PI / 2), m, parent, x, y, z0 + h / 2); }
// a rounded rectangle outline (centred) on a Shape or Path
function rr(p, w, h, r) {
  const x = -w / 2, y = -h / 2;
  p.moveTo(x + r, y); p.lineTo(x + w - r, y); p.absarc(x + w - r, y + r, r, -Math.PI / 2, 0); p.lineTo(x + w, y + h - r); p.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2);
  p.lineTo(x + r, y + h); p.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI); p.lineTo(x, y + r); p.absarc(x + r, y + r, r, Math.PI, 1.5 * Math.PI);
  return p;
}
const rectPath = (w, h, cx, cy) => { const p = new THREE.Path(); p.moveTo(cx - w / 2, cy - h / 2); p.lineTo(cx + w / 2, cy - h / 2); p.lineTo(cx + w / 2, cy + h / 2); p.lineTo(cx - w / 2, cy + h / 2); p.closePath(); return p; };
const extrude = (shape, depth, z0 = 0) => new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 6 }).translate(0, 0, z0);

// ------------------------------------------------------------------------------------------------ the LCD
// 2000 px per metre over the 0.34 x 0.20 window. Segment polygons on a digit box (x right, y down, metres).
const LCD = { w: 0.34, h: 0.2, ppm: 2000, dw: 0.095, dh: 0.165, st: 0.026, gap: 0.04, slant: Math.tan(6 * DEG), gx: 0.032, gy: 0.0175 };
const SEGS = { 0: "abcdef", 1: "bc", 2: "abged", 3: "abgcd", 4: "fgbc", 5: "afgcd", 6: "afgedc", 7: "abc", 8: "abcdefg", 9: "abcdfg" };
function segPoly(s) {
  const { dw: w, dh: h, st: t } = LCD, g = 0.0022, hl = (len) => len / 2 - g, ht = t / 2;
  const hor = (cy) => { const cx = w / 2, L = hl(w); return [[cx - L, cy], [cx - L + ht, cy - ht], [cx + L - ht, cy - ht], [cx + L, cy], [cx + L - ht, cy + ht], [cx - L + ht, cy + ht]]; };
  const ver = (cx, y0, y1) => { const cy = (y0 + y1) / 2, L = (y1 - y0) / 2 - g; return [[cx, cy - L], [cx + ht, cy - L + ht], [cx + ht, cy + L - ht], [cx, cy + L], [cx - ht, cy + L - ht], [cx - ht, cy - L + ht]]; };
  switch (s) {
    case "a": return hor(ht); case "g": return hor(h / 2); case "d": return hor(h - ht);
    case "f": return ver(ht, 0, h / 2); case "e": return ver(ht, h / 2, h);
    case "b": return ver(w - ht, 0, h / 2); default: return ver(w - ht, h / 2, h);   // c
  }
}
function drawLcd(g, W, H, number, flash) {
  const P = LCD.ppm, ink = "#1E2A22", off = "#AAB69B";
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.fillStyle = flash ? "#C9D4B8" : "#B9C4A8"; g.fillRect(0, 0, W, H);
  g.fillStyle = "rgba(60,70,50,0.16)"; g.fillRect(0, 0, W, 5); g.fillRect(0, 0, 4, H);   // the sink under the bezel
  const lit = number == null ? ["", ""] : [SEGS[Math.floor(number / 10)], SEGS[number % 10]];
  for (let d = 0; d < 2; d++) {
    const ox = LCD.gx + d * (LCD.dw + LCD.gap), oy = LCD.gy, k = LCD.slant;
    g.setTransform(P, 0, -k * P, P, (ox + k * LCD.dh) * P, oy * P);   // x' = x + k (h - y)
    for (const s of "abcdefg") {
      const pts = segPoly(s); g.fillStyle = lit[d].includes(s) ? ink : off; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fill();
    }
  }
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.lineWidth = 0.008 * P; g.strokeStyle = number == null ? off : ink; g.beginPath(); g.arc(0.306 * P, 0.039 * P, 0.011 * P, 0, TAU); g.stroke();   // the degree ring
}

// ------------------------------------------------------------------------------------------------ thermostat
const PIV = [0.24, 0.22];   // the cover's top right clip
function thermostat(P) {
  const S = P.spec, W = P.whole;
  const plateM = mat("#d9d0b8", { roughness: 0.8 }), coverM = mat("#e4dcc6", { roughness: 0.6 }), innerM = mat("#d2c9b0", { roughness: 0.8 }), bezelM = mat("#bdb49c", { roughness: 0.6 });
  const shadeM = mat("#cfc6ad", { roughness: 0.7 }), capM = mat("#bfb7a2", { roughness: 0.55 }), rimM = mat("#8e8775", { roughness: 0.6 }), triM = flat(mat("#5e5a50", { roughness: 0.8, side: THREE.DoubleSide }));
  // the wall: the dust outline round the plate, the plate, four screw bosses
  const dust = canvasTex(256, 232, (g, w, h) => {
    const r = rng(7); g.clearRect(0, 0, w, h);
    g.strokeStyle = "rgba(120,110,86,0.22)"; g.lineWidth = 9; g.beginPath(); g.roundRect(10, 10, w - 20, h - 20, 14); g.stroke();
    for (let i = 0; i < 150; i++) { const e = r() * 4, x = e < 1 ? r() * w : e < 2 ? r() * w : e < 3 ? r() * 18 : w - r() * 18, y = e < 1 ? r() * 18 : e < 2 ? h - r() * 18 : r() * h; g.fillStyle = `rgba(120,110,86,${0.05 + r() * 0.1})`; g.fillRect(x, y, 2 + r() * 3, 2 + r() * 2); }
  });
  const dm = new THREE.MeshBasicMaterial({ map: dust, transparent: true, depthWrite: false }); dm.userData.noOutline = true; dm.userData.noHatch = true;
  decor(mesh(new THREE.PlaneGeometry(0.46, 0.417), dm, W, 0, 0, 0.0015));
  solid(box(0.42, 0.38, 0.012, W, plateM, 0, 0, 0.006));
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
    solid(disc(0.0175, 0.01, W, plateM, sx * 0.15, sy * 0.13, 0.012, 16));
    decor(box(0.022, 0.0035, 0.002, W, rimM, sx * 0.15, sy * 0.13, 0.0222)).rotation.z = (sx * sy * 35 + 20) * DEG;
  }
  // everything on the cover lives in `cover` (origin the cover's centre); `coverRoot` swings, `cover` shakes
  const coverRoot = new THREE.Group(); W.add(coverRoot);
  // the hinge clip (Sol r1 #4, 20 Nov): a grey bracket from the plate's top right corner to the cover's clip, shown once the cover pops, so the
  // hanging cover reads as clipped on, not balanced in the air
  const hingeM = mat("#8e959b", { roughness: 0.45, metalness: 0.3 }), hinge = new THREE.Group(); W.add(hinge); hinge.visible = false;
  box(0.05, 0.05, 0.045, hinge, hingeM, PIV[0] - 0.02, PIV[1] - 0.02, 0.0225); disc(0.012, 0.03, hinge, hingeM, PIV[0], PIV[1], 0.045, 12);
  const cover = new THREE.Group(); coverRoot.add(cover);
  const shell = rr(new THREE.Shape(), 0.48, 0.44, 0.05); shell.holes.push(rr(new THREE.Path(), 0.468, 0.428, 0.044));
  solid(mesh(extrude(shell, 0.063), [coverM, coverM], cover));
  const front = rr(new THREE.Shape(), 0.48, 0.44, 0.05); front.holes.push(rectPath(0.36, 0.22, 0, 0.065));
  solid(mesh(extrude(front, 0.012, 0.063), [coverM, coverM], cover));
  const liner = flat(mat("#d2c9b0", { roughness: 0.9, side: THREE.BackSide }));
  decor(mesh(extrude(rr(new THREE.Shape(), 0.4675, 0.4275, 0.0435), 0.063), liner, cover)).renderOrder = 0;
  decor(box(0.38, 0.018, 0.0004, cover, shadeM, 0, -0.205, 0.0752));   // the lower edge band
  // the bezel and the LCD
  for (const [w, h, x, y] of [[0.36, 0.01, 0, 0.065 + 0.105], [0.36, 0.01, 0, 0.065 - 0.105], [0.01, 0.2, -0.175, 0.065], [0.01, 0.2, 0.175, 0.065]]) solid(box(w, h, 0.0135, cover, bezelM, x, y, 0.0698));
  const cv = document.createElement("canvas"); cv.width = Math.round(LCD.w * LCD.ppm); cv.height = Math.round(LCD.h * LCD.ppm);
  const lcdTex = new THREE.CanvasTexture(cv); lcdTex.colorSpace = THREE.SRGBColorSpace; lcdTex.anisotropy = 8;
  const lcdM = basic({ map: lcdTex });
  decor(mesh(new THREE.PlaneGeometry(LCD.w, LCD.h), lcdM, cover, 0, 0.065, 0.069));
  const g2 = cv.getContext("2d"); let drawn = null;
  // the two buttons
  const btn = (x, dir) => {
    const g = new THREE.Group(); g.position.set(x, -0.135, 0.075); cover.add(g);
    solid(disc(0.045, 0.012, g, rimM, 0, 0, 0)); solid(disc(0.041, 0.0125, g, capM, 0, 0, 0));
    const t = new THREE.Shape(); t.moveTo(0, dir * 0.0175); t.lineTo(-0.02, -dir * 0.0175); t.lineTo(0.02, -dir * 0.0175); t.closePath();
    decor(mesh(new THREE.ShapeGeometry(t), triM, g, 0, 0, 0.0127));
    return g;
  };
  const bUp = btn(-0.105, 1), bDown = btn(0.105, -1);
  // the tape X: two torn strips on a bent plane (the middle over the cap, the ends down on the cover)
  const tapeM = new THREE.MeshStandardMaterial({ color: "#9fa7b0", roughness: 0.7, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }); tapeM.userData.noHatch = true;
  const tapes = [42, -42].map((deg, i) => {
    const r = rng(31 + i), NX = 16, NY = 4, g = new THREE.PlaneGeometry(0.17, 0.034, NX, NY), p = g.attributes.position;
    for (let k = 0; k < p.count; k++) {
      const ix = k % (NX + 1), x = p.getX(k);
      if (ix === 0) p.setX(k, x + r() * 0.009); else if (ix === NX) p.setX(k, x - r() * 0.009);
      p.setZ(k, 0.0012 + 0.012 * sm((0.075 - Math.abs(x)) / 0.04));
    }
    g.computeVertexNormals();
    const grp = new THREE.Group(); grp.position.set(0.105, -0.135, 0.0752 + 0.0015 * i); grp.rotation.z = deg * DEG; cover.add(grp);
    decor(mesh(g, tapeM, grp)); return grp;
  });
  return {
    grip: 0,
    apply(ps, t) {
      const up = clamp(ps.up), dn = clamp(ps.down), pop = clamp(ps.pop), blank = typeof ps.temp !== "number" || pop > 0;
      const n = blank ? null : clamp(Math.round(ps.temp), 12, 30), flash = up > 0.7 || dn > 0.7, key = `${n}|${flash}`;
      if (key !== drawn) { drawn = key; drawLcd(g2, cv.width, cv.height, n, flash); lcdTex.needsUpdate = true; }
      bUp.position.z = 0.075 - 0.006 * up; bDown.position.z = 0.075 - 0.006 * dn;
      const tp = clamp(ps.tape);
      tapes.forEach((grp, i) => { const k = eo(i ? (tp - 0.5) / 0.5 : tp / 0.5); grp.visible = k > 0; grp.scale.setScalar(1 + 0.15 * (1 - k)); grp.position.z = 0.0752 + 0.0015 * i + 0.05 * (1 - k) * (1 - k); });
      const sh = clamp(ps.shake) * Math.sin(TAU * 9 * t);
      cover.rotation.z = sh * 5 * DEG; cover.position.x = sh * 0.012;
      // the pop: jump 0.03 off the plate, then swing about the top right clip to 105 and back to 95 degrees
      const jump = 0.03 * sm(pop / 0.2), s = clamp((pop - 0.2) / 0.8);
      const th = (s < 0.6 ? 105 * Math.sin((Math.PI / 2) * (s / 0.6)) : 105 - 10 * sm((s - 0.6) / 0.4)) * DEG;
      hinge.visible = pop > 0.01;
      coverRoot.rotation.z = th; coverRoot.position.set(PIV[0] - (PIV[0] * Math.cos(th) - PIV[1] * Math.sin(th)), PIV[1] - (PIV[0] * Math.sin(th) + PIV[1] * Math.cos(th)), jump);
    },
  };
}

// ------------------------------------------------------------------------------------------------ thermobox
const BX = { w: 0.58, h: 0.54, d: 0.13, t: 0.006 };
function thermobox(P) {
  const S = P.spec, W = P.whole, { w, h, d, t } = BX, hz = d / 2;
  const clear = flat(new THREE.MeshStandardMaterial({ color: "#dceBee", transparent: true, opacity: 0.2, roughness: 0.15, side: THREE.DoubleSide, depthWrite: false }));
  const edgeM = flat(new THREE.MeshStandardMaterial({ color: "#f4fbfc", transparent: true, opacity: 0.6, roughness: 0.3, depthWrite: false }));
  const steel = mat("#b9bec4", { roughness: 0.4, metalness: 0.3 }), screwM = mat("#8e959b", { roughness: 0.4, metalness: 0.3 }), barrelM = mat("#c9ced2", { roughness: 0.35, metalness: 0.3 });
  const brass = mat("#c9a23c", { roughness: 0.35, metalness: 0.4 }), dark = mat("#3a3d42", { roughness: 0.8 });
  const pivot = new THREE.Group(); W.add(pivot);                                // the box turns about its centre
  const body = new THREE.Group(); body.position.z = -hz; pivot.add(body);       // back face at the body's z 0 .. front at z d
  const pane = (pw, ph, pd, x, y, z) => { const o = solid(box(pw, ph, pd, body, clear, x, y, z)); o.castShadow = false; o.receiveShadow = false; return o; };
  pane(w, t, d, 0, h / 2 - t / 2, hz); pane(w, t, d, 0, -h / 2 + t / 2, hz); pane(t, h - 2 * t, d, -w / 2 + t / 2, 0, hz); pane(t, h - 2 * t, d, w / 2 - t / 2, 0, hz);
  const wy0 = 0.065 - 0.11, wy1 = 0.065 + 0.11;
  if (S.window === 0) pane(w - 2 * t, h - 2 * t, t, 0, 0, d - t / 2);
  else {   // the front round the cut window 0.36 x 0.22
    pane(w - 2 * t, h / 2 - t - wy1, t, 0, (wy1 + h / 2 - t) / 2, d - t / 2); pane(w - 2 * t, wy0 + h / 2 - t, t, 0, (wy0 - h / 2 + t) / 2, d - t / 2);
    pane((w - 2 * t - 0.36) / 2, wy1 - wy0, t, -(0.18 + (w - 2 * t - 0.36) / 4), 0.065, d - t / 2); pane((w - 2 * t - 0.36) / 2, wy1 - wy0, t, 0.18 + (w - 2 * t - 0.36) / 4, 0.065, d - t / 2);
  }
  // bright edges: the front frame and the four depth edges (none round the window)
  const E = 0.0045;
  for (const [ew, eh, ed, x, y, z] of [[w, E, E, 0, h / 2 - E / 2, d - E / 2], [w, E, E, 0, -h / 2 + E / 2, d - E / 2], [E, h, E, -w / 2 + E / 2, 0, d - E / 2], [E, h, E, w / 2 - E / 2, 0, d - E / 2],
    ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sy]) => [E, E, d, sx * (w / 2 - E / 2), sy * (h / 2 - E / 2), d / 2])]) decor(box(ew, eh, ed, body, edgeM, x, y, z));
  // the tabs and screw heads, lying on the wall at the corners
  const heads = [];
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
    solid(box(0.05, 0.05, 0.004, body, steel, sx * 0.315, sy * 0.245, 0.002));
    solid(disc(0.009, 0.006, body, screwM, sx * 0.315, sy * 0.245, 0.004, 14));
    decor(box(0.012, 0.002, 0.0015, body, dark, sx * 0.315, sy * 0.245, 0.0101));
    heads.push([sx * 0.315, sy * 0.245]);
  }
  // the lock: barrel + slot + key, turned together
  const lock = new THREE.Group(); lock.position.set(0, -0.235, 0); body.add(lock);
  solid(disc(0.025, 0.02, lock, barrelM, 0, 0, d, 28));
  decor(box(0.004, 0.032, 0.002, lock, dark, 0, 0, d + 0.0205));
  const key = new THREE.Group(); key.position.z = d + 0.02; lock.add(key);
  box(0.003, 0.012, 0.02, key, brass, 0, 0, -0.01); box(0.004, 0.009, 0.02, key, brass, 0, 0, 0.01);
  mesh(new THREE.TorusGeometry(0.0125, 0.0045, 6, 18).rotateY(Math.PI / 2), brass, key, 0, 0, 0.0345);
  // the wall side (does not move with the box): screw shafts, plaster dust
  const wallG = new THREE.Group(); W.add(wallG);
  const shafts = heads.map(([x, y]) => { const m = mesh(new THREE.CylinderGeometry(0.003, 0.003, 1, 6).rotateX(Math.PI / 2), screwM, wallG, x, y, 0); m.castShadow = false; return m; });
  const dustM = mat("#c9c2b0", { roughness: 0.9 }), r = rng(19), specks = [];
  heads.forEach(([x, y]) => { for (let j = 0; j < 6; j++) { const o = decor(mesh(new THREE.SphereGeometry(0.0035 + 0.0015 * r(), 5, 4), dustM, wallG, x, y, 0.02)); specks.push({ o, x, y, start: 0.05 + 0.09 * j + 0.03 * r(), dx: (r() - 0.5) * 0.05, dz: 0.01 + 0.03 * r() }); } });
  const dropAt = S.dropAt, floorZ = S.floorZ ?? -0.9, A12 = 12 * DEG;
  return {
    grip: 0,
    apply(ps, t) {
      const s = clamp(ps.on), rip = clamp(ps.rip), kk = clamp(ps.key), tug = Math.max(-1, Math.min(1, ps.tug || 0));
      pivot.visible = s > 0;
      // the screws
      const e1 = clamp(rip / 0.6);
      shafts.forEach((m) => { const L = Math.max(1e-4, 0.03 * e1); m.scale.z = L; m.position.z = L / 2; m.visible = e1 > 0.01; });
      for (const sp of specks) { const age = rip - sp.start, k = age / 0.4; sp.o.visible = age > 0 && k < 1; if (sp.o.visible) { sp.o.position.set(sp.x + sp.dx * k, sp.y - (0.2 * k + 0.5 * k * k) * 0.3, 0.02 + sp.dz * k); sp.o.scale.setScalar(1 - k * 0.6); } }
      // the key and the lock
      lock.rotation.z = Math.PI / 2 * clamp(kk / 0.5);
      const kd = clamp((kk - 0.5) / 0.5); key.visible = kk < 0.999; key.position.z = d + 0.02 + 0.14 * eo(kd); key.scale.setScalar(1 - 0.8 * sm((kd - 0.7) / 0.3));
      if (s <= 0) return;
      // the pose: x, y, z of the box centre (box frame), tip about x (bottom out = negative), roll about z
      const slide = eo(s / 0.85), bounce = 0.008 * Math.sin(Math.PI * clamp((s - 0.85) / 0.15));
      let x = 0.6 * (1 - slide) + 0.035 * tug, y = 0, z = hz + bounce, rx = 0, rz = (20 * (1 - slide) - 7 * tug) * DEG;
      z += 0.03 * e1;
      const a = A12 * sm((rip - 0.8) / 0.2);   // the lower pair let go: the bottom tips out about the top edge
      rx = -a; y += (h / 2) * (1 - Math.cos(a)); z += (h / 2) * Math.sin(a);
      if (rip >= 1 && dropAt != null && t >= dropAt) {
        const u = clamp((t - dropAt) / 0.5), w2 = clamp((t - dropAt - 0.5) / 0.15), ang = (12 + 58 * u) * DEG + 20 * DEG * sm(w2);
        const hc0 = ps.y + y, hc = hc0 - (hc0 - 0.276) * u * u - (0.276 - 0.065) * sm(w2);
        y = hc - ps.y; z = z + (floorZ - ps.z - z) * eo(u) + 0 * w2; rx = -ang; x *= 1 - u; rz *= 1 - u;
      }
      pivot.position.set(x, y, z); pivot.rotation.set(rx, 0, rz);
    },
  };
}

// ------------------------------------------------------------------------------------------------ stepstool
function stepstool(P) {
  const h = P.spec.h ?? 0.74, W = P.whole;
  const wood = mat("#b98a56", { roughness: 0.8 }), tread = mat("#c9a878", { roughness: 0.7 }), deep = mat("#7c5a36", { roughness: 0.9 });
  const sb = (bw, bh, bd, m, x, y, z) => solid(box(bw, bh, bd, W, m, x, y, z));
  if (h < 0.5) {   // the box
    sb(0.4, 0.23, 0.36, wood, 0, 0.115, 0); sb(0.41, 0.03, 0.37, tread, 0, 0.245, 0);
    decor(mesh(new THREE.ShapeGeometry(rr(new THREE.Shape(), 0.12, 0.04, 0.02)), flat(mat("#7c5a36", { roughness: 0.9 })), W, 0, 0.14, 0.1805));
    for (const sx of [-1, 1]) sb(0.02, 0.23, 0.36, deep, sx * 0.19, 0.115, 0.0).scale.set(1, 1, 1.002);
    return { grip: 0 };
  }
  const T = 0.03, D = 0.36, ST = 0.022, ys = [0.25, 0.5, 0.74], xs = [[-0.63, -0.41], [-0.41, -0.19], [-0.19, 0.19]];
  ys.forEach((y, i) => { const [a, b] = xs[i]; sb(b - a + 0.01, T, D + 0.01, tread, (a + b) / 2 - (i < 2 ? 0.005 : 0), y - T / 2, 0); });
  // stringers: the stair silhouette under the treads, one each side
  const pr = new THREE.Shape(); [[0.19, 0], [0.19, 0.71], [-0.19, 0.71], [-0.19, 0.47], [-0.41, 0.47], [-0.41, 0.22], [-0.63, 0.22], [-0.63, 0]].forEach(([x, y], i) => (i ? pr.lineTo(x, y) : pr.moveTo(x, y)));
  const gS = new THREE.ExtrudeGeometry(pr, { depth: ST, bevelEnabled: false });
  for (const sz of [-1, 1]) solid(mesh(gS, wood, W, 0, 0, sz > 0 ? D / 2 - ST : -D / 2));
  // risers under each tread's front edge, and the back board
  sb(0.02, 0.22, D - 2 * ST, wood, -0.62, 0.11, 0); sb(0.02, 0.22, D - 2 * ST, wood, -0.4, 0.36, 0); sb(0.02, 0.21, D - 2 * ST, wood, -0.18, 0.605, 0);
  sb(0.02, 0.71, D - 2 * ST, deep, 0.18, 0.355, 0);
  return { grip: h };
}

export const THERMO_KINDS = { thermostat, thermobox, stepstool };
