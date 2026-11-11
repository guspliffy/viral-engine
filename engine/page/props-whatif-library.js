import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

// What if, episode 2 "faster than sound" (9 Nov 2026): the daylight library's dressing (storyboards/series/what-if/
// 02-library/BOARD.md §5 T1; the look comes from Jonny's eight panels). Oak and brass like props-library.js. Origin: the
// floor under the middle, facing +z at rot 0, unless said. No point lights, no lettering anywhere, no Math.random.
//   longclock  a longcase clock, w 0.5 x h 2.1 x d 0.3, dark oak with brass trim: a plinth, a trunk with a glass door
//              (0.30 w, y 0.55-1.45) showing a brass pendulum (rod 0.7, bob r 0.07), a hood with a brass-ringed white
//              dial (middle y 1.75, r 0.16, Roman numerals) and two black spade hands. Solid (the case); the glass
//              is see-through for the checks.
//              Params: time (hours, 12.667 = 12:40 when nothing sets it), swing (degrees, pendulum angle, + toward +x),
//              clock (the clip time, tweened by the director: c.prop(0, id, {clock: 0}, 0, "linear"); c.prop(0, id,
//              {clock: END}, END, "linear")). spec.ticks [clip seconds]: the pendulum reaches an end at each tick time
//              (first tick the + end, then alternating, a cosine between) and the minute hand jumps one minute on each
//              (a 0.04 s snap that ends on the tick); spec.amp (degrees, 6) is how far the ends are, and `swing` is added on top.
//   quietsign  the hanging QUIET sign: the origin is its ceiling point; two brass chains spec.len (0.7) down to a board
//              spec.w (1.0) x spec.h (0.65) x 0.03, cream in a dark oak frame, a dark-brown face in profile with a
//              finger to its lips painted on it (facing +z; no words). Param swing (degrees about the hang point's x
//              axis, + lifts the bottom toward +z, up to 80). Not solid.
//   bookcart   a library book trolley, l 0.9 (x) x w 0.45 (z): dark oak trays (tops at y 0.44 and 0.18), brass corner
//              posts and side rails, a brass push rail at 0.9 m on the -x end, four black castors r 0.05. Solid.
//              The books are separate `libbook`s: standing (stand 1) on the top tray in two rows at x +-0.13, five
//              each along z at 0.07, each book's middle at y 0.56 and its x origin 0.085 left of the row's middle.
//   brasslamp  a brass pendant: the origin is its ceiling point; a chain spec.len (1.3) to a brass dome shade r 0.22 with a
//              lit warm bulb (#ffe2a8, emissive, a soft halo, no light). Param swing (degrees about the hang point,
//              + toward +x). Not solid.
//   orbstand   a green glass orb r 0.09 on a three-claw brass stand 0.12 tall, origin on the desk top. The glass glows
//              (#7dff9a core, #2f8f4f edge) with a soft additive halo. Param glow 0..1: the engine's default for a
//              prop with no spec.glow is 0, so set spec.glow 1 (a bare orbstand with no glow at all is read as 1).
//   libpage    one loose book page 0.17 x 0.24, cream with grey printed lines (no readable letters) and a drop cap
//              block. Origin its middle, standing in the x/y plane facing +z. Param bend 0..1 curls it round a vertical
//              axis (radius 0.18 at 1, the middle toward +z) so it can sit over a face. Not solid.
//   dayfloor   the hall's pale polished stone floor (a flat sheet, like props-library.js libfloor): origin its middle, lying
//              at y 0.002, spec.w (18) x spec.d (22). Cream tiles 0.6 m square (#ebe2cc / #ddd0b4 in a soft checker, thin
//              grout #c9b896, a few tiles warmer or cooler from spec.seed). spec.patches [[x, z, w, d, rot], ...] (floor
//              metres, rot degrees about y, default two window patches [[-2.6, -1.2, 1.4, 2.2, -25], [-2.4, 1.6, 1.4,
//              2.2, -25]]): sun patches of warm white (#fff6dc, additive), each a 2 x 3 grid of panes (2 across w, 3 along
//              d) split by 0.06 m mullion shadows with soft edges. Not solid.
// Chains, signs, lamps, glass, halos and pages are see-through for the checks (userData.steam); the clock, the cart and
// the stand are solid.
export const WHATIFLIB_GRIPS = {};

const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
function canvasTex(w, h, draw) { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const DEG = Math.PI / 180;
const OAK = "#4e2e1a", OAK2 = "#5d3a22", BRASS = "#c99a3a";
const brassMat = () => mat(BRASS, { roughness: 0.3, metalness: 0.75 });
// not solid for the checks, not casting a shadow that counts
const see = (o) => { o.userData.steam = true; return o; };
// the see-through glow quad (additive, drawn after the solid things)
function halo(parent, color, size, opacity, x, y, z) {
  const t = canvasTex(128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, color); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity }));
  s.material.userData.noOutline = true; s.position.set(x, y, z); s.scale.setScalar(size); s.renderOrder = 3; s.frustumCulled = false; s.userData.steam = true; parent.add(s); return s;
}
// a hanging chain: stretched torus links, alternate links turned a quarter, from y 0 down to -len (one merged mesh)
function chainGeo(len) {
  const n = Math.max(2, Math.round(len / 0.02)), pitch = len / n, parts = [];
  for (let i = 0; i < n; i++) {
    const g = new THREE.TorusGeometry(0.0105, 0.0027, 6, 10);
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(0, -(i + 0.5) * pitch, 0), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, i % 2 ? Math.PI / 2 : 0, 0)), new THREE.Vector3(1, 1.45, 1)));
    parts.push(g);
  }
  return mergeGeometries(parts);
}
// a spade hand pointing up +y from its pivot
function spadeHand(len, wid, m) {
  const s = new THREE.Shape();
  s.moveTo(-wid * 0.35, -len * 0.16); s.lineTo(-wid * 0.3, len * 0.62); s.quadraticCurveTo(-wid * 1.1, len * 0.76, 0, len);
  s.quadraticCurveTo(wid * 1.1, len * 0.76, wid * 0.3, len * 0.62); s.lineTo(wid * 0.35, -len * 0.16); s.closePath();
  const o = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.005, bevelEnabled: false }), m); o.castShadow = true; return o;
}

// the clock's dial: warm white, a ring, minute ticks, all twelve Roman numerals turned to the centre's outside
const ROMAN = ["XII", "I", "II", "III", "IIII", "V", "VI", "VII", "VIII", "IX", "X", "XI"];
const dialTex = () => canvasTex(512, 512, (g, w) => {
  const c = w / 2;
  const grd = g.createRadialGradient(c, c * 0.9, 10, c, c, c); grd.addColorStop(0, "#fffaf0"); grd.addColorStop(1, "#efe4cc");
  g.fillStyle = grd; g.fillRect(0, 0, w, w);
  g.strokeStyle = "#1d1b20"; g.lineWidth = 6; g.beginPath(); g.arc(c, c, c * 0.95, 0, Math.PI * 2); g.stroke();
  g.lineWidth = 3; g.beginPath(); g.arc(c, c, c * 0.72, 0, Math.PI * 2); g.stroke();
  for (let i = 0; i < 60; i++) { const a = (i / 60) * Math.PI * 2, big = i % 5 === 0; g.lineWidth = big ? 5 : 2; g.beginPath(); g.moveTo(c + Math.sin(a) * c * 0.88, c - Math.cos(a) * c * 0.88); g.lineTo(c + Math.sin(a) * c * 0.94, c - Math.cos(a) * c * 0.94); g.stroke(); }
  g.fillStyle = "#1d1b20"; g.font = "bold 58px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle";
  ROMAN.forEach((t, i) => { const a = (i / 12) * Math.PI * 2, r = c * 0.8; g.save(); g.translate(c + Math.sin(a) * r, c - Math.cos(a) * r); g.rotate(a); g.scale(1, 1.15); g.fillText(t, 0, 0); g.restore(); });
});

// the pendulum's angle from the tick list: an end at each tick (alternating sides, the first +), a cosine between,
// held at the ends before the first and after the last (the first/last gap is used outward)
function tickWave(ticks, t) {
  const n = ticks.length;
  const d0 = n > 1 ? ticks[1] - ticks[0] : 0.5, d1 = n > 1 ? ticks[n - 1] - ticks[n - 2] : 0.5;
  const ext = [ticks[0] - d0, ...ticks, ticks[n - 1] + d1];   // ext[j] is an end, odd j is the + end
  if (t <= ext[0]) return -1;
  if (t >= ext[ext.length - 1]) return ext.length % 2 ? -1 : 1;
  let j = 0; while (j < ext.length - 2 && t >= ext[j + 1]) j++;
  const u = (t - ext[j]) / (ext[j + 1] - ext[j]), s = j % 2 ? 1 : -1;   // at ext[j] the wave is s, at ext[j+1] it is -s
  return s * Math.cos(Math.PI * u);
}

// the QUIET picture, in the board's own proportions: a dark-brown face in profile (looking right) with a raised
// finger across its lips; a cream outline round the hand and a cream eye/mouth cut keep it readable small
function quietTex(W, H) {
  const pw = 768, ph = Math.round((768 * H) / W);
  return canvasTex(pw, ph, (g, w, h) => {
    g.fillStyle = "#efe4cc"; g.fillRect(0, 0, w, h);
    g.strokeStyle = "#c9b58a"; g.lineWidth = Math.max(3, h * 0.012); g.strokeRect(h * 0.05, h * 0.05, w - h * 0.1, h * 0.9);
    const ink = "#3a2414", cream = "#efe4cc", s = h / 112;
    g.save(); g.beginPath(); g.rect(h * 0.07, h * 0.07, w - h * 0.14, h * 0.86); g.clip();
    g.translate(w * 0.47, h * 0.45); g.scale(s, s);
    // head and neck and shoulders, in profile
    g.fillStyle = ink; g.beginPath();
    g.moveTo(-30, 0); g.bezierCurveTo(-32, -34, -4, -42, 14, -33); g.bezierCurveTo(25, -28, 29, -17, 28, -8);
    g.bezierCurveTo(31, -2, 39, 6, 36, 10); g.bezierCurveTo(33, 12, 30, 12, 28, 13);
    g.bezierCurveTo(30, 15, 30, 17, 28, 19); g.lineTo(25, 20); g.lineTo(28, 22); g.bezierCurveTo(29, 24, 27, 26, 25, 27);
    g.bezierCurveTo(27, 31, 25, 37, 17, 39); g.bezierCurveTo(8, 41, 0, 37, -6, 32);
    g.lineTo(-9, 52); g.quadraticCurveTo(30, 54, 36, 80); g.lineTo(-110, 80); g.lineTo(-110, 66); g.quadraticCurveTo(-40, 56, -34, 48);
    g.lineTo(-34, 20); g.bezierCurveTo(-34, 12, -31, 6, -30, 0); g.closePath(); g.fill();
    // a cream eye (closed, calm) and ear hint
    g.strokeStyle = cream; g.lineCap = "round"; g.lineWidth = 2.4; g.beginPath(); g.moveTo(14, -7); g.quadraticCurveTo(19, -4, 24, -7); g.stroke();
    g.lineWidth = 1.8; g.beginPath(); g.arc(-6, 4, 6, -1.2, 1.6); g.stroke();
    // the hand: a raised finger across the lips (cream outline first), a fist under it
    const hand = () => {
      g.beginPath(); g.moveTo(31, -3); g.quadraticCurveTo(31, -7, 36, -7); g.quadraticCurveTo(41, -7, 41, -3); g.lineTo(41, 26); g.lineTo(31, 26); g.closePath();   // the finger
      g.moveTo(24, 24); g.quadraticCurveTo(24, 22, 32, 22); g.lineTo(52, 22); g.quadraticCurveTo(58, 24, 57, 36); g.quadraticCurveTo(54, 48, 40, 48); g.quadraticCurveTo(26, 46, 24, 36); g.closePath();   // the fist
      g.moveTo(52, 26); g.quadraticCurveTo(62, 22, 66, 28); g.quadraticCurveTo(64, 36, 56, 36); g.closePath();   // the thumb
    };
    g.strokeStyle = cream; g.lineWidth = 5; g.lineJoin = "round"; hand(); g.stroke();
    g.fillStyle = ink; hand(); g.fill();
    g.strokeStyle = cream; g.lineWidth = 1.6; for (const y of [30, 36, 42]) { g.beginPath(); g.moveTo(32, y); g.lineTo(50, y); g.stroke(); }
    g.restore();
  });
}

export const WHATIFLIB_KINDS = {
  longclock(P) {
    const S = P.spec, oak = mat(OAK, { roughness: 0.5 }), oak2 = mat(OAK2, { roughness: 0.45 }), brass = brassMat();
    const ink = mat("#16141a", { roughness: 0.5 }), inside = mat("#1c100a", { roughness: 0.8 });
    // plinth and base, the trunk (hollow behind the glass door), the hood with the dial, a pediment and a finial
    mesh(new THREE.BoxGeometry(0.5, 0.07, 0.3), oak2, P.whole, 0, 0.035, 0);
    mesh(new THREE.BoxGeometry(0.46, 0.27, 0.27), oak, P.whole, 0, 0.205, 0);
    mesh(new THREE.BoxGeometry(0.49, 0.03, 0.295), oak2, P.whole, 0, 0.355, 0);
    mesh(new THREE.BoxGeometry(0.4, 0.012, 0.2), brass, P.whole, 0, 0.376, 0.045);   // a brass kick plate on the front of the base
    const TZ = 0.13;   // the trunk's front face
    mesh(new THREE.BoxGeometry(0.4, 1.17, 0.02), inside, P.whole, 0, 0.955, -0.115);   // the back wall
    for (const s of [-1, 1]) mesh(new THREE.BoxGeometry(0.04, 1.17, 0.26), oak, P.whole, s * 0.18, 0.955, 0);
    for (const s of [-1, 1]) mesh(new THREE.BoxGeometry(0.05, 0.9, 0.02), oak2, P.whole, s * 0.175, 1.0, TZ - 0.01);   // the door's stiles
    mesh(new THREE.BoxGeometry(0.4, 0.2, 0.26), oak, P.whole, 0, 0.47, 0);   // below the door: 0.37-0.57
    mesh(new THREE.BoxGeometry(0.4, 0.07, 0.26), oak, P.whole, 0, 1.465, 0);   // above the door
    mesh(new THREE.BoxGeometry(0.31, 0.03, 0.02), oak2, P.whole, 0, 0.565, TZ - 0.01);
    mesh(new THREE.BoxGeometry(0.31, 0.03, 0.02), oak2, P.whole, 0, 1.435, TZ - 0.01);
    mesh(new THREE.BoxGeometry(0.43, 0.02, 0.28), brass, P.whole, 0, 1.5, 0);   // the brass line under the hood
    mesh(new THREE.BoxGeometry(0.46, 0.46, 0.28), oak, P.whole, 0, 1.745, 0);
    for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.4, 10), brass, P.whole, s * 0.215, 1.745, 0.12);   // brass hood pillars
    mesh(new THREE.BoxGeometry(0.5, 0.05, 0.3), oak2, P.whole, 0, 2.0, 0);
    mesh(new THREE.BoxGeometry(0.42, 0.04, 0.26), oak, P.whole, 0, 2.045, 0);
    mesh(new THREE.CylinderGeometry(0.012, 0.02, 0.03, 10), brass, P.whole, 0, 2.08, 0);
    mesh(new THREE.SphereGeometry(0.022, 12, 10), brass, P.whole, 0, 2.098, 0);
    // the glass door: a faint shine over the dark trunk (see-through for the checks)
    const glass = see(new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.9), new THREE.MeshStandardMaterial({ color: "#ffffff", transparent: true, opacity: 0.06, roughness: 0.3, metalness: 0, depthWrite: false })));
    glass.position.set(0, 1.0, TZ + 0.002); glass.userData.noOutline = true; P.whole.add(glass);
    // the dial and its brass ring and the hands
    const dm = new THREE.MeshStandardMaterial({ map: dialTex(), roughness: 0.6 }); dm.userData.noHatch = true;
    const DZ = 0.141, face = new THREE.Group(); face.position.set(0, 1.75, DZ); P.whole.add(face);
    mesh(new THREE.CircleGeometry(0.16, 48), dm, face, 0, 0, 0.001).castShadow = false;
    mesh(new THREE.TorusGeometry(0.168, 0.011, 10, 48), brass, face, 0, 0, 0.004);
    const hour = spadeHand(0.09, 0.016, ink), min = spadeHand(0.135, 0.012, ink);
    hour.position.z = 0.004; min.position.z = 0.011; face.add(hour, min);
    mesh(new THREE.SphereGeometry(0.01, 10, 8), brass, face, 0, 0, 0.017);
    // the pendulum: rod 0.7 and a lens bob r 0.07, hung from a brass pivot at the top of the door opening
    const pend = new THREE.Group(); pend.position.set(0, 1.42, 0.02); P.whole.add(pend);
    mesh(new THREE.SphereGeometry(0.012, 8, 6), brass, pend, 0, 0, -0.01);
    mesh(new THREE.CylinderGeometry(0.0045, 0.0045, 0.7, 8), brass, pend, 0, -0.35, 0);
    const bob = mesh(new THREE.SphereGeometry(0.07, 24, 14), brass, pend, 0, -0.7, 0); bob.scale.z = 0.3;
    mesh(new THREE.TorusGeometry(0.045, 0.006, 8, 24), mat("#e0b858", { roughness: 0.25, metalness: 0.8 }), pend, 0, -0.7, 0.022);
    const ticks = Array.isArray(S.ticks) && S.ticks.length ? S.ticks.map(Number) : null, AMP = S.amp ?? 6;
    return {
      grip: 0,
      apply(ps) {
        const clock = ps.clock ?? S.clock ?? 0;
        // the engine's default time is 2.75 (a prop with no spec.time): a longclock reads 12:40 then
        const tm = S.time == null && ps.time === 2.75 ? 12.667 : ps.time ?? 12.667;
        let n = 0, ang = ps.swing ?? S.swing ?? 0;
        if (ticks) { for (const tk of ticks) n += clamp((clock - tk + 0.04) / 0.04); ang += AMP * tickWave(ticks, clock); }
        pend.rotation.z = ang * DEG;
        hour.rotation.z = -(((tm + n / 60) % 12) / 12) * Math.PI * 2;
        min.rotation.z = -(((tm * 60 + n) % 60) / 60) * Math.PI * 2;
      },
    };
  },

  quietsign(P) {
    const S = P.spec, W = S.w ?? 1.0, H = S.h ?? 0.65, L = S.len ?? 0.7, T = 0.03, F = 0.045;
    const oak = mat(OAK, { roughness: 0.5 }), brass = brassMat();
    const pivot = new THREE.Group(); P.whole.add(pivot);   // swing turns about the ceiling point
    const parts = [];
    const add = (g, m, x, y, z) => { const o = mesh(g, m, pivot, x, y, z); parts.push(o); return o; };
    const cx = W / 2 - 0.09, top = -L;
    for (const s of [-1, 1]) { add(chainGeo(L - 0.01), brass, s * cx, 0, 0); add(new THREE.SphereGeometry(0.018, 10, 8), brass, s * cx, top - 0.005, 0); }
    add(new THREE.BoxGeometry(2 * cx + 0.1, 0.02, 0.04), brass, 0, 0.0, 0);   // the bar the chains hang from
    // the board: the frame's four sides, a cream back, the painted front
    const cy = top - H / 2 - 0.01;
    add(new THREE.BoxGeometry(W, F, T), oak, 0, cy + H / 2 - F / 2, 0); add(new THREE.BoxGeometry(W, F, T), oak, 0, cy - H / 2 + F / 2, 0);
    for (const s of [-1, 1]) add(new THREE.BoxGeometry(F, H - 2 * F, T), oak, s * (W / 2 - F / 2), cy, 0);
    add(new THREE.BoxGeometry(W - 2 * F, H - 2 * F, 0.012), mat("#efe4cc", { roughness: 0.9 }), 0, cy, -0.004);
    const pic = new THREE.MeshStandardMaterial({ map: quietTex(W - 2 * F, H - 2 * F), roughness: 0.9 }); pic.userData.noHatch = true;
    const face = add(new THREE.PlaneGeometry(W - 2 * F, H - 2 * F), pic, 0, cy, 0.0035); face.castShadow = false;
    for (const s of [-1, 1]) add(new THREE.SphereGeometry(0.02, 10, 8), brass, s * cx, cy + H / 2 + 0.005, T / 2);   // brass eyes at the top corners
    for (const o of parts) see(o);
    return { apply(ps) { pivot.rotation.x = -clamp(ps.swing ?? S.swing ?? 0, -90, 90) * DEG; } };
  },

  bookcart(P) {
    const oak = mat(OAK, { roughness: 0.55 }), oak2 = mat(OAK2, { roughness: 0.5 }), brass = brassMat(), black = mat("#17151a", { roughness: 0.6 });
    const LX = 0.9, WZ = 0.45, TH = 0.025;
    for (const [top, k] of [[0.44, "top"], [0.18, "low"]]) {
      mesh(new THREE.BoxGeometry(LX, TH, WZ), oak, P.whole, 0, top - TH / 2, 0);
      mesh(new THREE.BoxGeometry(LX + 0.02, 0.012, WZ + 0.02), oak2, P.whole, 0, top - TH - 0.006, 0);   // a darker moulding under the tray
      for (const s of [-1, 1]) mesh(new THREE.BoxGeometry(LX, 0.03, 0.014), oak2, P.whole, 0, top + 0.015, s * (WZ / 2 - 0.007));   // a low lip along each long side
    }
    const cxp = LX / 2 - 0.02, czp = WZ / 2 - 0.02;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const tall = sx < 0, top = tall ? 0.9 : 0.52, y0 = 0.1;
      mesh(new THREE.CylinderGeometry(0.012, 0.012, top - y0, 10), brass, P.whole, sx * cxp, (top + y0) / 2, sz * czp);
      mesh(new THREE.SphereGeometry(0.017, 10, 8), brass, P.whole, sx * cxp, top, sz * czp);
      // a black castor: a fork under the lower tray, the wheel (axle along z, so it rolls along x), r 0.05
      mesh(new THREE.BoxGeometry(0.04, 0.05, 0.05), black, P.whole, sx * (cxp - 0.03), 0.13, sz * czp);
      const w = mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.024, 20), black, P.whole, sx * (cxp - 0.03), 0.05, sz * czp); w.rotation.x = Math.PI / 2;
      mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.028, 10), brass, P.whole, sx * (cxp - 0.03), 0.05, sz * czp).rotation.x = Math.PI / 2;
    }
    for (const sz of [-1, 1]) { const r = mesh(new THREE.CylinderGeometry(0.008, 0.008, 2 * cxp, 8), brass, P.whole, 0, 0.52, sz * czp); r.rotation.z = Math.PI / 2; }   // the side rails of the top tray
    const rail = mesh(new THREE.CylinderGeometry(0.014, 0.014, 2 * czp + 0.04, 12), brass, P.whole, -cxp, 0.9, 0); rail.rotation.x = Math.PI / 2;   // the push rail
    return { grip: 0.44 };
  },

  brasslamp(P) {
    const S = P.spec, L = S.len ?? 1.3, brass = brassMat();
    const pivot = new THREE.Group(); P.whole.add(pivot);
    const parts = [];
    const add = (g, m, x, y, z) => { const o = mesh(g, m, pivot, x, y, z); parts.push(o); return o; };
    add(new THREE.CylinderGeometry(0.045, 0.05, 0.018, 18), brass, 0, -0.009, 0);   // the ceiling rose
    add(chainGeo(L - 0.02), brass, 0, -0.018, 0);
    add(new THREE.CylinderGeometry(0.014, 0.02, 0.05, 12), brass, 0, -L, 0);   // the cap on top of the shade
    const dome = (r, m) => { const d = add(new THREE.SphereGeometry(r, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2), m, 0, -L - 0.02, 0); d.scale.y = 0.9; return d; };
    dome(0.22, mat(BRASS, { roughness: 0.28, metalness: 0.8 }));
    const lit = new THREE.MeshStandardMaterial({ color: "#ffe2a8", emissive: new THREE.Color("#ffe2a8"), emissiveIntensity: 0.9, roughness: 0.8, side: THREE.BackSide });
    dome(0.214, lit);   // the warm inside of the shade
    const rim = add(new THREE.TorusGeometry(0.22, 0.008, 8, 36), brass, 0, -L - 0.02, 0); rim.rotation.x = Math.PI / 2;
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.04, 14, 10), new THREE.MeshBasicMaterial({ color: "#ffe2a8" })); bulb.position.set(0, -L - 0.1, 0); bulb.userData.noOutline = true; pivot.add(bulb); parts.push(bulb);
    for (const o of parts) see(o);
    halo(pivot, "rgba(255,226,168,0.9)", 0.5, 0.4, 0, -L - 0.14, 0.01);
    return { apply(ps) { pivot.rotation.z = (ps.swing ?? S.swing ?? 0) * DEG; } };
  },

  orbstand(P) {
    const S = P.spec, brass = brassMat();
    mesh(new THREE.CylinderGeometry(0.05, 0.056, 0.012, 20), brass, P.whole, 0, 0.006, 0);
    mesh(new THREE.CylinderGeometry(0.014, 0.022, 0.03, 12), brass, P.whole, 0, 0.027, 0);
    mesh(new THREE.TorusGeometry(0.03, 0.005, 8, 18), brass, P.whole, 0, 0.044, 0).rotation.x = Math.PI / 2;
    for (let k = 0; k < 3; k++) {   // three claws curving up and out to hold the orb's lower half
      const a = (k / 3) * Math.PI * 2 + 0.5, c = (r, y) => new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r);
      const curve = new THREE.CatmullRomCurve3([c(0.012, 0.035), c(0.04, 0.05), c(0.062, 0.085), c(0.0735, 0.12)]);
      mesh(new THREE.TubeGeometry(curve, 14, 0.0055, 6), brass, P.whole);
      mesh(new THREE.SphereGeometry(0.0075, 8, 6), brass, P.whole, Math.cos(a) * 0.0735, 0.12, Math.sin(a) * 0.0735);
    }
    // the glass: bright core to deep edge (a view-dependent gradient), the whole glowing; glow dims it to dark glass
    const mt = new THREE.ShaderMaterial({
      uniforms: { uGlow: { value: 1 } },
      vertexShader: "varying vec3 vN; varying vec3 vV; void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }",
      fragmentShader: `uniform float uGlow; varying vec3 vN; varying vec3 vV;
        void main() {
          float f = clamp(dot(normalize(vN), normalize(vV)), 0.0, 1.0);
          vec3 edge = vec3(0.184, 0.561, 0.31), core = vec3(0.49, 1.0, 0.604);
          vec3 lit = mix(edge, core, pow(f, 1.4));
          lit = mix(lit, vec3(0.85, 1.0, 0.88), smoothstep(0.82, 1.0, f) * 0.45);
          vec3 off = vec3(0.07, 0.2, 0.12) * (0.5 + 0.5 * f);
          gl_FragColor = vec4(mix(off, lit, uGlow), 1.0);
        }`,
    });
    mt.userData.noHatch = true;
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.09, 28, 18), mt); orb.position.y = 0.17; orb.castShadow = false; P.whole.add(orb);
    const h = halo(P.whole, "rgba(125,255,154,0.9)", 0.5, 0.5, 0, 0.17, 0.02);
    return {
      grip: 0,
      apply(ps) {
        const g = clamp(S.glow == null && !ps.glow ? 1 : ps.glow);
        mt.uniforms.uGlow.value = g; h.material.opacity = 0.5 * g; h.visible = g > 0.01;
      },
    };
  },

  libpage(P) {
    const S = P.spec, W = 0.17, H = 0.24, SX = 12, SY = 2;
    const tex = canvasTex(256, 362, (g, w, h) => {
      g.fillStyle = "#f1e7cd"; g.fillRect(0, 0, w, h);
      g.fillStyle = "#e6d8b6"; g.fillRect(0, 0, 6, h); g.fillRect(w - 6, 0, 6, h);
      const m = 26;
      g.fillStyle = "#6a3a2a"; g.fillRect(m, 34, 44, 46);   // the drop cap block (a coloured square, no letter)
      g.fillStyle = "#f1e7cd"; g.fillRect(m + 10, 44, 24, 6); g.fillRect(m + 10, 58, 24, 6);
      g.fillStyle = "#9a9486";
      const rows = 22; for (let i = 0; i < rows; i++) {
        const y = 34 + i * 14, short = i === 7 || i === 15 ? 0.55 : 1, x0 = i < 4 ? m + 54 : m;
        g.fillRect(x0, y, (w - m - x0) * (i === rows - 1 ? 0.4 : short) * (0.9 + 0.1 * ((i * 37) % 10) / 10), 5);
      }
    });
    const geo = new THREE.PlaneGeometry(W, H, SX, SY);
    const m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, side: THREE.DoubleSide }); m.userData.noHatch = true;
    const page = see(mesh(geo, m, P.whole)); page.castShadow = true;
    const base = Float32Array.from(geo.attributes.position.array);
    return {
      apply(ps) {
        const k = clamp(ps.bend || S.bend || 0) / 0.18, p = geo.attributes.position;   // curvature: radius 0.18 at bend 1
        for (let i = 0; i < p.count; i++) {
          const x = base[i * 3];
          if (k < 1e-4) { p.setX(i, x); p.setZ(i, 0); } else { p.setX(i, Math.sin(k * x) / k); p.setZ(i, -(1 - Math.cos(k * x)) / k); }
        }
        p.needsUpdate = true; geo.computeVertexNormals(); geo.computeBoundingBox(); geo.computeBoundingSphere();
      },
    };
  },
};

// the hall's floor: pale stone tiles in a soft checker with a few warmer/cooler ones, and the window's sun patches on it
const rngf = (seed) => { let a = (Math.round(seed * 1000) * 2654435761) >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const DAY_PATCHES = [[-2.6, -1.2, 1.4, 2.2, -25], [-2.4, 1.6, 1.4, 2.2, -25]];
WHATIFLIB_KINDS.dayfloor = function dayfloor(P) {
  const S = P.spec, W = S.w ?? 18, D = S.d ?? 22, r = rngf(S.seed ?? 7), N = 10, PX = 128;   // a 10 x 10 tile canvas, repeated
  const tile = canvasTex(N * PX, N * PX, (g) => {
    g.fillStyle = "#c9b896"; g.fillRect(0, 0, N * PX, N * PX);
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const base = (i + j) % 2 ? [221, 208, 180] : [235, 226, 204], k = r(), warm = k < 0.1 ? [8, 0, -10] : k > 0.9 ? [-6, -2, 6] : [0, 0, 0], v = (r() - 0.5) * 5;
      const gr = g.createLinearGradient(i * PX, j * PX, (i + 1) * PX, (j + 1) * PX);   // a slight polish: lighter at one corner
      gr.addColorStop(0, `rgb(${base.map((c, q) => Math.round(c + warm[q] + v + 5)).join(",")})`); gr.addColorStop(1, `rgb(${base.map((c, q) => Math.round(c + warm[q] + v - 4)).join(",")})`);
      g.fillStyle = gr; g.fillRect(i * PX + 1.5, j * PX + 1.5, PX - 3, PX - 3);
    }
  });
  tile.wrapS = tile.wrapT = THREE.RepeatWrapping; tile.repeat.set(W / (N * 0.6), D / (N * 0.6));
  const fm = new THREE.MeshStandardMaterial({ map: tile, roughness: 0.35, metalness: 0.03 }); fm.userData.noOutline = true;
  const floor = see(new THREE.Mesh(new THREE.PlaneGeometry(W, D), fm)); floor.rotation.x = -Math.PI / 2; floor.position.y = 0.002; floor.receiveShadow = true; P.whole.add(floor);
  for (const [x, z, w, d, rot] of S.patches ?? DAY_PATCHES) {
    const cw = 256, ch = Math.round((256 * d) / w), mull = 0.06 / w * cw, blur = 5;
    const pt = canvasTex(cw, ch, (g) => {
      g.clearRect(0, 0, cw, ch); g.filter = `blur(${blur}px)`; g.fillStyle = "#fff6dc";
      const m = blur * 1.6, pw = (cw - 2 * m - mull) / 2, ph = (ch - 2 * m - 2 * (0.06 / d) * ch) / 3;
      for (let i = 0; i < 2; i++) for (let j = 0; j < 3; j++) g.fillRect(m + i * (pw + mull), m + j * (ph + (0.06 / d) * ch), pw, ph);
    });
    const pm = new THREE.MeshBasicMaterial({ map: pt, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.32, toneMapped: false }); pm.userData.noOutline = true;
    const grp = new THREE.Group(); grp.position.set(x, 0.005, z); grp.rotation.y = (rot * Math.PI) / 180; P.whole.add(grp);
    const q = see(new THREE.Mesh(new THREE.PlaneGeometry(w, d), pm)); q.rotation.x = -Math.PI / 2; q.renderOrder = 2; q.castShadow = false; q.receiveShadow = false; q.frustumCulled = false; grp.add(q);
  }
  return {};
};
