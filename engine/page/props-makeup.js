import * as THREE from "three";

// Props for "Alien makeup, wrong surface" (Jonny's story library #03, 28 Oct 2026): the Wizard paints an alien face on
// the OUTSIDE of the Astronaut's visor, and the Astronaut flips the whole look up off his clean face.
//   bubblehelmet  the Astronaut's helmet as a free prop, the same size and glass as the costume's (costumes-cast.js:
//                 use a character with "costume": { "helmet": false } underneath). Its origin is the sphere's centre;
//                 for the stock Astronaut on the floor that is y 0.738 (HELMET_Y), z +0.01 from his centre.
//                 A fixed rear shell with two temple pivots, and a rigid front visor (glass pane, silver frame, side
//                 arms) that turns up about the pivots: `open` 0..1 (0 closed, 1 = VISOR_OPEN degrees up).
//                 The makeup is painted on the visor's outer surface and moves with it: `write` 0..1 paints it stroke
//                 by stroke (the green wash to 0.6, the two almond eyes to 0.88, then one last stroke on the left cheek
//                 that closes the gap). spec.paint sets the paint colour.
//   brush         a make-up brush: a wooden handle, a steel ferrule and a tuft tipped in paint. Origin = where the fist
//                 holds it (grip 0); the tuft points up +y, so tilt it toward what it paints. spec.paint = tip colour.
//   paintpot      a small dark-green makeup pot, open, full of the green paint. Origin = its bottom centre.
//   handmirror    an oval hand mirror on a short handle. Origin = where the fist holds the handle; the glass faces +z
//                 and shows the alien face (its reflection: the same design, mirrored); spec.reflect false = plain glass.
export const HELMET_R = 0.53, HELMET_Y = 0.738;   // astronaut.json body: max(0.41, 0.49 * 0.78) + 0.12; 0.14 + 0.49 * 1.22
export const VISOR_OPEN = 50;                      // degrees the visor turns up at open 1
// the visor pane, on the sphere: phi (round the vertical axis, pi/2 = straight ahead) and theta (down from the top)
export const VISOR = { R: HELMET_R * 1.022, W: 2.05, T0: 0.15 * Math.PI, T1: 0.645 * Math.PI };
// a point on the visor's surface in the helmet's frame: u 0 (screen left) .. 1 across, v 0 (top) .. 1 down, out = metres
// outside the glass, at visor angle `open` (0..1). The clip generator aims hands and the brush tip with it.
export function visorPoint(u, v, out = 0, open = 0) {
  const phi = Math.PI / 2 - VISOR.W / 2 + u * VISOR.W, th = VISOR.T0 + v * (VISOR.T1 - VISOR.T0), r = VISOR.R + out;
  const x = -r * Math.cos(phi) * Math.sin(th), y = r * Math.cos(th), z = r * Math.sin(phi) * Math.sin(th);
  const a = (-open * VISOR_OPEN * Math.PI) / 180;   // about x, the front going up
  return [x, y * Math.cos(a) - z * Math.sin(a), y * Math.sin(a) + z * Math.cos(a)];
}

export const MAKEUP_GRIPS = {
  paintpot: { side: [0, 0.03, 0] },
  handmirror: { handle: [0, 0, 0] },
};

function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; parent.add(o); return o; }
const tube = (pts, r, m, parent) => { const o = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))), pts.length * 3, r, 8, false), m); o.castShadow = true; parent.add(o); return o; };

// the alien face on a 512 x 512 canvas that covers the visor's paint patch (x across, y down). An egg-shaped alien head
// in brushy horizontal passes, two big dark almond eyes slanting up and out. No mouth.
const HEAD = { cx: 256, cy: 262, rx: 222, top: 22, bottom: 492 };
function headPath(ctx) {
  const { cx, rx, top, bottom } = HEAD, mid = top + (bottom - top) * 0.42;
  ctx.beginPath();
  ctx.moveTo(cx, top);
  ctx.bezierCurveTo(cx + rx * 0.9, top, cx + rx, mid - 110, cx + rx, mid);
  ctx.bezierCurveTo(cx + rx, mid + 150, cx + 70, bottom, cx, bottom);
  ctx.bezierCurveTo(cx - 70, bottom, cx - rx, mid + 150, cx - rx, mid);
  ctx.bezierCurveTo(cx - rx, mid - 110, cx - rx * 0.9, top, cx, top);
  ctx.closePath();
}
const CHEEK = { x: 128, y0: 320, y1: 470 };   // the last stroke: the strip left of x on the screen-left cheek
// a leaf-shaped almond: two arcs meeting in points, the outer end higher (slanting up and out)
function eyePts(s) {
  const pts = [], ex = 256 + s * 104, ey = 250, a = s * 0.5, L = 86, H = 40;
  for (let j = 0; j <= 28; j++) {
    const t = j / 28, top = t <= 0.5, u = top ? t * 2 : (t - 0.5) * 2, x = top ? -L + 2 * L * u : L - 2 * L * u;
    const y = (top ? -1 : 1) * H * Math.sin(Math.PI * u) ** 0.8 * (top ? 0.9 : 1.1);
    pts.push([ex + x * Math.cos(a) - y * Math.sin(a), ey + x * Math.sin(a) + y * Math.cos(a)]);
  }
  return pts;
}
const PHASES = { wash: [0, 0.6], eyes: [0.6, 0.88], last: [0.88, 1] };
const PASSES = 10;
const k01 = (p, [a, b]) => Math.max(0, Math.min(1, (p - a) / (b - a)));
// mirror: draw it flipped left to right (a reflection)
export function paintFace(ctx, p, wash, mirror = false) {
  ctx.clearRect(0, 0, 512, 512);
  if (p <= 0) return;
  ctx.save();
  if (mirror) { ctx.translate(512, 0); ctx.scale(-1, 1); }
  ctx.lineCap = ctx.lineJoin = "round";
  // 1 the wash: horizontal passes top to bottom, each wiped across, clipped to the head; rows in the cheek strip stop
  // short of it (the last stroke fills it)
  ctx.save(); headPath(ctx); ctx.clip();
  const kw = k01(p, PHASES.wash) * PASSES, step = (HEAD.bottom - HEAD.top) / (PASSES - 1);
  for (let i = 0; i < PASSES; i++) {
    const f = Math.max(0, Math.min(1, kw - i)); if (f <= 0) break;
    const y = HEAD.top + i * step, cheek = y + step / 2 > CHEEK.y0 && y - step / 2 < CHEEK.y1;
    const x0 = cheek ? CHEEK.x : 0, x1 = 512, l2r = i % 2 === 0;
    const a = l2r ? x0 : x1, b = a + (l2r ? 1 : -1) * (x1 - x0) * f;
    ctx.strokeStyle = wash; ctx.lineWidth = step * 1.35;
    ctx.beginPath(); ctx.moveTo(a, y); ctx.lineTo(b, y + 3); ctx.stroke();
    // bristle streaks along the pass, lighter and darker
    for (let k = 0; k < 5; k++) {
      ctx.strokeStyle = k % 2 ? "rgba(255,255,220,0.16)" : "rgba(40,90,20,0.14)"; ctx.lineWidth = 3 + (k % 3);
      const yy = y - step * 0.5 + (k + 0.5) * (step / 5);
      ctx.beginPath(); ctx.moveTo(a, yy); ctx.lineTo(a + (b - a) * (0.7 + 0.06 * k), yy + 2); ctx.stroke();
    }
  }
  // 3 the last stroke: down the cheek strip
  const kl = k01(p, PHASES.last);
  if (kl > 0) {
    ctx.strokeStyle = wash; ctx.lineWidth = 140;
    ctx.beginPath(); ctx.moveTo(CHEEK.x - 60, CHEEK.y0 - 20); ctx.lineTo(CHEEK.x - 60, CHEEK.y0 - 20 + (CHEEK.y1 - CHEEK.y0 + 40) * kl); ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,220,0.22)"; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(CHEEK.x - 40, CHEEK.y0); ctx.lineTo(CHEEK.x - 40, CHEEK.y0 + (CHEEK.y1 - CHEEK.y0) * kl); ctx.stroke();
  }
  ctx.restore();
  // 2 the eyes: filled almonds, the screen-left one first
  const ke = k01(p, PHASES.eyes) * 2;
  [-1, 1].forEach((s, i) => {
    const f = Math.max(0, Math.min(1, ke - i)); if (f <= 0) return;
    const pts = eyePts(s), n = Math.max(2, Math.ceil(pts.length * f));
    ctx.fillStyle = ctx.strokeStyle = "#1e2a16"; ctx.lineWidth = 14;
    ctx.beginPath(); pts.slice(0, n).forEach(([x, y], j) => (j ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    if (f >= 1) { ctx.closePath(); ctx.fill(); } else ctx.stroke();
  });
  ctx.restore();
}

const glassMat = () => { const m = new THREE.MeshPhysicalMaterial({ color: "#dff2ff", roughness: 0.05, metalness: 0, transparent: true, opacity: 0.16, depthWrite: false, clearcoat: 1, side: THREE.DoubleSide }); m.userData.glass = true; return m; };

export const MAKEUP_KINDS = {
  bubblehelmet(P) {
    const R = P.spec.r ?? HELMET_R, { W, T0, T1 } = VISOR, F0 = Math.PI / 2 - W / 2;
    const silver = new THREE.MeshStandardMaterial({ color: "#c9d0da", roughness: 0.3, metalness: 0.6 });
    // the rear shell: the top cap all round, and the band behind the visor opening
    const shellM = glassMat();
    const cap = mesh(new THREE.SphereGeometry(R, 40, 6, 0, Math.PI * 2, 0, T0 + 0.02), shellM, P.whole); cap.castShadow = false;
    const band = mesh(new THREE.SphereGeometry(R, 32, 20, F0 + W - 0.02, Math.PI * 2 - W + 0.04, T0, 0.62 * Math.PI - T0), shellM, P.whole); band.castShadow = false;
    // the temple pivots: a silver disc and a hub on each side, on the axis the visor turns about
    for (const s of [-1, 1]) {
      const d = mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.03, 24), silver, P.whole, s * (R + 0.022), 0, 0); d.rotation.z = Math.PI / 2;
      const h = mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.05, 16), silver, P.whole, s * (R + 0.04), 0, 0); h.rotation.z = Math.PI / 2;
    }
    // the visor: one rigid group turning about x through the centre (the pivots)
    const visor = new THREE.Group(); P.whole.add(visor);
    const pane = mesh(new THREE.SphereGeometry(VISOR.R, 40, 24, F0, W, T0, T1 - T0), glassMat(), visor); pane.castShadow = false;
    const on = (u, v, out = 0) => visorPoint(u, v, out, 0);
    const edge = (f, n = 14) => Array.from({ length: n + 1 }, (_, i) => f(i / n));
    tube(edge((u) => on(u, 1, 0.004)), 0.014, silver, visor);        // the lower rim (he grips it)
    tube(edge((u) => on(u, 0, 0.004)), 0.01, silver, visor);         // the top edge
    for (const e of [0, 1]) tube(edge((v) => on(e, v, 0.004), 10), 0.01, silver, visor);   // the side edges
    // the side arms: from the middle of each side edge round to its pivot
    for (const s of [-1, 1]) {
      const vm = (Math.PI / 2 - T0) / (T1 - T0), pts = [];
      for (let i = 0; i <= 8; i++) { const ph = (s < 0 ? F0 : F0 + W) + (s < 0 ? -1 : 1) * (i / 8) * (Math.PI / 2 - W / 2); const r = VISOR.R + 0.006; pts.push([-r * Math.cos(ph), 0, r * Math.sin(ph)]); }
      pts[0] = on(s < 0 ? 0 : 1, vm, 0.006);
      tube(pts, 0.013, silver, visor);
    }
    // the paint: a patch just outside the pane, a little inside its edges, carried by the visor
    const can = document.createElement("canvas"); can.width = can.height = 512;
    const ctx = can.getContext("2d"), tex = new THREE.CanvasTexture(can); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
    const bu = 0.05, bv = 0.05, pw = W * (1 - 2 * bu), pt0 = T0 + (T1 - T0) * bv, ptl = (T1 - T0) * (1 - 2 * bv);
    // opaque with a cut-out edge (not see-through): it hides the face and the shell's edges behind it, outlines included
    const paintM = new THREE.MeshBasicMaterial({ map: tex, alphaTest: 0.5, side: THREE.DoubleSide });
    paintM.userData.noOutline = true;
    const paint = new THREE.Mesh(new THREE.SphereGeometry(VISOR.R + 0.003, 48, 32, F0 + W * bu, pw, pt0, ptl), paintM);
    paint.renderOrder = 2; visor.add(paint);
    // a glint on the glass over the paint, top left: the brief's "glass edge/glint makes the surface readable"
    const gc = document.createElement("canvas"); gc.width = gc.height = 256; const g = gc.getContext("2d");
    g.strokeStyle = "rgba(255,255,255,0.75)"; g.lineCap = "round"; g.lineWidth = 16; g.beginPath(); g.arc(150, 170, 120, Math.PI * 1.08, Math.PI * 1.38); g.stroke();
    g.lineWidth = 8; g.beginPath(); g.arc(150, 170, 92, Math.PI * 1.12, Math.PI * 1.3); g.stroke();
    const glintT = new THREE.CanvasTexture(gc); glintT.colorSpace = THREE.SRGBColorSpace;
    const glintM = new THREE.MeshBasicMaterial({ map: glintT, transparent: true, depthWrite: false }); glintM.userData.noOutline = true;
    const glint = new THREE.Mesh(new THREE.SphereGeometry(VISOR.R + 0.006, 24, 16, F0, W * 0.5, T0, (T1 - T0) * 0.55), glintM); glint.renderOrder = 3; visor.add(glint);
    const wash = P.spec.paint ?? "#8fd14f";
    let last = -1;
    return {
      grip: 0,
      apply(ps) {
        const p = Math.round(Math.max(0, Math.min(1, ps.write ?? 0)) * 400) / 400;
        if (p !== last) { paintFace(ctx, p, wash); tex.needsUpdate = true; last = p; }
        paint.visible = p > 0;
        visor.rotation.x = (-Math.max(0, Math.min(1, ps.open ?? 0)) * VISOR_OPEN * Math.PI) / 180;
      },
    };
  },
  brush(P) {
    const wood = new THREE.MeshStandardMaterial({ color: P.spec.color ?? "#6b3f2a", roughness: 0.55 });
    const steel = new THREE.MeshStandardMaterial({ color: "#c9ced6", roughness: 0.3, metalness: 0.7 });
    const hair = new THREE.MeshStandardMaterial({ color: "#efe3cf", roughness: 0.8 }), tip = new THREE.MeshStandardMaterial({ color: P.spec.paint ?? "#8fd14f", roughness: 0.6 });
    mesh(new THREE.CylinderGeometry(0.011, 0.014, 0.26, 14), wood, P.whole, 0, -0.04, 0);
    mesh(new THREE.CylinderGeometry(0.014, 0.012, 0.05, 14), steel, P.whole, 0, 0.115, 0);
    mesh(new THREE.CylinderGeometry(0.017, 0.013, 0.04, 14), hair, P.whole, 0, 0.158, 0);
    const t = mesh(new THREE.SphereGeometry(0.017, 14, 10), tip, P.whole, 0, 0.18, 0); t.scale.set(1, 1.6, 1);
    return { grip: 0 };
  },
  paintpot(P) {
    const pot = new THREE.MeshStandardMaterial({ color: "#1f5a32", roughness: 0.25, metalness: 0.1 });
    const paintM = new THREE.MeshStandardMaterial({ color: P.spec.paint ?? "#8fd14f", roughness: 0.35 });
    mesh(new THREE.CylinderGeometry(0.05, 0.052, 0.05, 28), pot, P.whole, 0, 0.025, 0);
    const lip = mesh(new THREE.TorusGeometry(0.047, 0.006, 8, 28), pot, P.whole, 0, 0.05, 0); lip.rotation.x = Math.PI / 2;
    mesh(new THREE.CylinderGeometry(0.044, 0.044, 0.004, 28), paintM, P.whole, 0, 0.046, 0);
    return { grip: 0.03 };
  },
  handmirror(P) {
    const gold = new THREE.MeshStandardMaterial({ color: "#d9a948", roughness: 0.3, metalness: 0.65 });
    const wood = new THREE.MeshStandardMaterial({ color: "#7a4a2a", roughness: 0.5 });
    mesh(new THREE.CylinderGeometry(0.013, 0.016, 0.13, 12), wood, P.whole, 0, 0.0, 0);
    mesh(new THREE.CylinderGeometry(0.018, 0.014, 0.02, 12), gold, P.whole, 0, 0.07, 0);
    const fr = new THREE.Group(); fr.position.y = 0.165; P.whole.add(fr);
    const RX = 0.07, RY = 0.088;
    const ring = mesh(new THREE.TorusGeometry(1, 0.11, 10, 40), gold, fr); ring.scale.set(RX, RY, RX);
    mesh(new THREE.CircleGeometry(1, 40), gold, fr, 0, 0, -0.004).scale.set(RX * 1.02, RY * 1.02, 1);
    // the glass: a cool mirror sheen, and the alien face reflected in it (the same design, mirrored)
    const can = document.createElement("canvas"); can.width = 256; can.height = 320; const g = can.getContext("2d");
    const gr = g.createLinearGradient(0, 0, 256, 320); gr.addColorStop(0, "#eaf6ff"); gr.addColorStop(0.55, "#b8d6ec"); gr.addColorStop(1, "#8fb5d6"); g.fillStyle = gr; g.fillRect(0, 0, 256, 320);
    if (P.spec.reflect !== false) {
      // the helmet glass behind the paint, then the face scaled into the oval
      g.fillStyle = "rgba(240,190,90,0.55)"; g.beginPath(); g.ellipse(128, 175, 112, 130, 0, 0, Math.PI * 2); g.fill();
      const f = document.createElement("canvas"); f.width = f.height = 512; paintFace(f.getContext("2d"), 1, P.spec.paint ?? "#8fd14f", true);
      g.drawImage(f, 28, 52, 200, 230);
    }
    g.fillStyle = "rgba(255,255,255,0.55)"; g.save(); g.translate(70, 70); g.rotate(-0.6); g.fillRect(-36, -5, 72, 8); g.fillRect(-24, 10, 48, 5); g.restore();
    const tex = new THREE.CanvasTexture(can); tex.colorSpace = THREE.SRGBColorSpace;
    const glassM = new THREE.MeshBasicMaterial({ map: tex }); glassM.userData.noOutline = true;
    const glass = new THREE.Mesh(new THREE.CircleGeometry(1, 40), glassM); glass.scale.set(RX * 0.95, RY * 0.95, 1); glass.position.z = 0.004; fr.add(glass);
    return { grip: 0 };
  },
};
