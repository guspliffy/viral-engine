import * as THREE from "three";
import { clamp, rng } from "./util.js";
import { mat, basic, mesh, canvasTex } from "./props-trend.js";

// "That one friend who never has money… when it's his round" (never has money, episode 3, 8 Nov 2026): a warm wooden
// pub at night. Jonny's eight panels: dark timber, dark green upper walls, brass lamps, a long bar with the Samurai
// behind it, small clear tumblers (three empty, one with lemonade and a lemon slice), the toilet door at the back left
// with a toilet pictogram and a little light box over it (green free, red taken), a big arched window at the right onto
// a deep blue night street, and a chunky card reader whose screen glows 84.00.
//
//   hightable    a round high pub table (spec.r 0.4, top at spec.h 0.5: a potato's belly, where a person's bar is), dark
//                oak, a turned post on a cross foot. Origin: the floor under its middle. Grip: its top (h).
//   pubbar       the bar along x (spec.w, spec.d, spec.h): a dark polished top with a rounded front edge, raised panels
//                on its front (+z), a brass foot rail. Origin: the floor under its middle.
//   tumbler      a small clear glass (r 0.034, h 0.085) with a heavy base. `fill` 0..1 its fizzy lemonade (amber, a few
//                bubbles); spec.lemon puts a lemon slice on its rim. Empty (fill 0) a little amber dreg stays at the
//                bottom. Origin: its bottom. The mug hold.
//   loodoor      the toilet door in its own wall, facing +z: a dark wood door (spec.w 0.66 x spec.h 1.62) hinged on its
//                left edge, a toilet pictogram plaque and a brass push plate on its front, a casing round it, the wall
//                (spec.wl to the left of the opening, spec.wr to the right, spec.wh high: dark wood panelling to the
//                dado, dark green above) and behind it a little lit toilet room of cream tiles (spec.room deep, spec.roomw wide,
//                spec.roomx its middle off the doorway's);
//                spec.ret: a side return on the wall's right edge running that far back (the block's side).
//                `open` 0..1 swings the door in, away from us (-z), to 100°; `on` 0..1 is the light over the door:
//                0 green (free), 1 red (taken). Origin: the floor at the middle of the doorway, in the wall's front.
//   windowwall   a wall with a big arched window (facing +z): spec.w x spec.wh, the opening spec.win { w, h, sill } (its
//                bottom at sill), dark wood panelling under it, dark green above, a deep wooden arch and sill, glazing
//                bars (win.cols panes across, win.rails 1 or 2 rails) and a faint glass sheen; win.x moves the opening off the wall's middle, spec.ret adds a side
//                return on the left edge running back. What is outside is a plate behind it (set.plates). Origin: the floor at
//                the wall's middle, in its front.
//   coatpeg      a coat stand: a turned pole on four feet with hooks, Reaper's dark grey coat and the Wizard's brown
//                coat hanging on it (spec.colors). `fade` 0..1 takes the first coat (gone from 0.5), `gap` the
//                second. Origin: the floor under the pole.
//   drapedcoat   a coat folded over a bar's front edge: the fold on the top (spec.top deep), the rest hanging down
//                the front (spec.flap long, spec.w wide), a sleeve beside it; spec.color. `fade` 0..1 takes it (gone
//                from 0.5). Origin: on the top of the front edge.
//   wearcoat     a coat on (worn: spec.wear): a long coat round the body's back and sides from the shoulders (spec.y0)
//                to the hem (spec.y1), open down the front, a turned-down collar; spec.color; spec.body { rx, rz, cy,
//                ry, taper } is the body's shape (the wearer's character file) so it sits just outside it. `on` 0..1
//                throws it on: it swings round from behind the shoulders and wraps in. Origin: the body's frame.
//   bartowel     a white bar towel folded over a shoulder (worn: spec.wear; its middle on the shoulder's top).
//   barreader    a chunky card reader: a dark wedge (0.15 x 0.22, read at phone size), its screen glowing spec.total
//                ("84.00") in big pale blue digits, a keypad with red, yellow and green keys at the near end (+z: it is
//                read from that side). `glow` 0..1 flashes the screen (the beep). Origin: its bottom middle.
export const PUB = { table: { r: 0.4, h: 0.5 }, tumbler: { r: 0.034, h: 0.085 }, reader: { w: 0.15, d: 0.22, h: 0.065 } };

const OAK = "#4a2c18", OAK2 = "#5d3820", GREEN = "#2f4a36", BRASS = () => mat("#c99a3e", { roughness: 0.3, metalness: 0.8 });
const nosolid = (o) => { o.traverse((m) => { if (m.isMesh) m.userData.solid = false; }); return o; };

// dark wood grain on a canvas (u along the planks)
const grainTex = (seed, base = "#5a361e", rows = 6) => canvasTex(512, 256, (g, w, h) => {
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  const r = rng(seed);
  for (let i = 0; i < 60; i++) { g.strokeStyle = `rgba(30,15,6,${0.1 + r() * 0.15})`; g.lineWidth = 1 + r() * 2.5; g.beginPath(); const y = r() * h; g.moveTo(0, y); g.bezierCurveTo(w * 0.3, y + (r() - 0.5) * 10, w * 0.7, y + (r() - 0.5) * 10, w, y + (r() - 0.5) * 6); g.stroke(); }
  for (let i = 0; i < 18; i++) { g.strokeStyle = `rgba(150,95,50,${0.06 + r() * 0.08})`; g.lineWidth = 1; g.beginPath(); const y = r() * h; g.moveTo(0, y); g.lineTo(w, y + (r() - 0.5) * 6); g.stroke(); }
  for (let i = 1; i < rows; i++) { g.fillStyle = "rgba(20,10,4,0.45)"; g.fillRect(0, (h * i) / rows - 1, w, 2); }
});
// a wall: dark wood panelling up to the dado (raised panels), dark green paint above, a rail between
const wallTex = (wpx, hpx, dado, seed) => canvasTex(wpx, hpx, (g, w, h) => {
  const r = rng(seed), dy = h * (1 - dado);
  g.fillStyle = GREEN; g.fillRect(0, 0, w, dy);
  for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${r() < 0.5 ? "0,0,0" : "255,255,255"},${0.02 + r() * 0.03})`; g.fillRect(r() * w, r() * dy, 2 + r() * 6, 2 + r() * 6); }
  g.fillStyle = "#4f301b"; g.fillRect(0, dy, w, h - dy);
  const n = Math.max(1, Math.round(w / 110)), pw = w / n;
  for (let i = 0; i < n; i++) {
    const x = i * pw;
    g.fillStyle = "#3b2313"; g.fillRect(x + pw * 0.14, dy + (h - dy) * 0.14, pw * 0.72, (h - dy) * 0.7);
    g.fillStyle = "#5c3a22"; g.fillRect(x + pw * 0.18, dy + (h - dy) * 0.18, pw * 0.64, (h - dy) * 0.62);
    g.strokeStyle = "rgba(160,100,55,0.35)"; g.lineWidth = 2; g.strokeRect(x + pw * 0.18, dy + (h - dy) * 0.18, pw * 0.64, (h - dy) * 0.62);
  }
  g.fillStyle = "#2a170b"; g.fillRect(0, dy - 6, w, 12);
  g.fillStyle = "rgba(200,140,70,0.35)"; g.fillRect(0, dy - 6, w, 2);
  g.fillStyle = "#2a170b"; g.fillRect(0, h - 10, w, 10);
});

export const PUB_GRIPS = {};

export const PUB_KINDS = {
  hightable(P) {
    const S = P.spec, R = S.r ?? PUB.table.r, H = S.h ?? PUB.table.h;
    const top = mat("#ffffff", { map: grainTex(3, "#6a4026", 1), roughness: 0.32 }), dark = mat(OAK, { roughness: 0.5 });
    const t = mesh(new THREE.CylinderGeometry(R, R - 0.012, 0.045, 48), top, P.whole, 0, H - 0.0225, 0); t.userData.solid = true;
    mesh(new THREE.TorusGeometry(R - 0.006, 0.012, 8, 48), dark, P.whole, 0, H - 0.024, 0).rotation.x = Math.PI / 2;
    // the turned post: a few rings, thicker at the foot
    const pts = [[0, 0.06], [0.07, 0.06], [0.05, 0.1], [0.04, 0.16], [0.05, 0.19], [0.032, 0.24], [0.03, H - 0.12], [0.045, H - 0.09], [0.07, H - 0.06], [0.08, H - 0.045], [0, H - 0.045]].map(([x, y]) => new THREE.Vector2(x, y));
    mesh(new THREE.LatheGeometry(pts, 20), dark, P.whole).userData.solid = true;
    for (const a of [0, Math.PI / 2]) { const f = mesh(new THREE.BoxGeometry(R * 1.5, 0.05, 0.06), dark, P.whole, 0, 0.03, 0); f.rotation.y = a + Math.PI / 4; f.userData.solid = true; }
    return { grip: H };
  },

  pubbar(P) {
    const S = P.spec, W = S.w ?? 2.2, D = S.d ?? 0.5, H = S.h ?? 0.55;
    const topT = grainTex(9, "#5c3620", 1); topT.wrapS = THREE.RepeatWrapping; topT.repeat.set(W / 1.2, 1);
    const topM = mat("#ffffff", { map: topT, roughness: 0.25 }), dark = mat("#3c2414", { roughness: 0.55 }), panel = mat("#4d2f1a", { roughness: 0.5 }), brass = BRASS();
    // the top: a slab with a rounded front edge, 4 cm over the front
    const tp = mesh(new THREE.BoxGeometry(W, 0.05, D + 0.04), topM, P.whole, 0, H - 0.025, 0.02); tp.userData.solid = true;
    const nose = mesh(new THREE.CylinderGeometry(0.028, 0.028, W, 12), topM, P.whole, 0, H - 0.028, D / 2 + 0.04); nose.rotation.z = Math.PI / 2;
    // the body: a box with raised panels on its front
    const body = mesh(new THREE.BoxGeometry(W - 0.04, H - 0.05, D - 0.06), dark, P.whole, 0, (H - 0.05) / 2, -0.01); body.userData.solid = true;
    const n = Math.max(2, Math.round(W / 0.45)), pw = (W - 0.08) / n;
    for (let i = 0; i < n; i++) {
      const x = -W / 2 + 0.04 + pw * (i + 0.5);
      nosolid(mesh(new THREE.BoxGeometry(pw * 0.78, (H - 0.05) * 0.62, 0.018), panel, P.whole, x, (H - 0.05) * 0.52, D / 2 - 0.04 + 0.009));
    }
    // the kick plinth and the brass foot rail on its posts
    nosolid(mesh(new THREE.BoxGeometry(W - 0.02, 0.06, 0.02), mat("#24150b"), P.whole, 0, 0.03, D / 2 - 0.035));
    const rail = mesh(new THREE.CylinderGeometry(0.013, 0.013, W - 0.1, 10), brass, P.whole, 0, 0.09, D / 2 + 0.06); rail.rotation.z = Math.PI / 2; rail.userData.solid = false;
    for (let i = 0; i <= 3; i++) { const x = -W / 2 + 0.08 + ((W - 0.16) * i) / 3; nosolid(mesh(new THREE.BoxGeometry(0.014, 0.014, 0.1), brass, P.whole, x, 0.09, D / 2 + 0.01)); }
    return { grip: H };
  },

  tumbler(P) {
    const S = P.spec, { r: R, h: H } = PUB.tumbler;
    const glass = new THREE.MeshPhysicalMaterial({ color: "#f2fbff", roughness: 0.05, transparent: true, opacity: 0.32, depthWrite: false, clearcoat: 1, side: THREE.DoubleSide });
    glass.userData.glass = true;
    const prof = [[0.001, 0], [R * 0.9, 0], [R * 0.92, 0.016], [R, H], [R - 0.003, H], [R * 0.84, 0.02], [0.001, 0.02]].map(([x, y]) => new THREE.Vector2(x, y));
    const sh = mesh(new THREE.LatheGeometry(prof, 32), glass, P.whole); sh.castShadow = false; sh.renderOrder = 3;
    const rim = mesh(new THREE.TorusGeometry(R - 0.0015, 0.002, 6, 32), mat("#ffffff", { roughness: 0.15 }), P.whole, 0, H, 0); rim.rotation.x = Math.PI / 2; rim.castShadow = false;
    // the thick base catches the light
    mesh(new THREE.CylinderGeometry(R * 0.86, R * 0.9, 0.018, 28), mat("#e4f4f8", { roughness: 0.1, transparent: true, opacity: 0.55 }), P.whole, 0, 0.009, 0).castShadow = false;
    const lemM = new THREE.MeshStandardMaterial({ color: "#f4b52e", transparent: true, opacity: 0.78, roughness: 0.15, depthWrite: false, emissive: new THREE.Color("#a8600c"), emissiveIntensity: 0.25 }); lemM.userData.liquid = true;
    const liq = mesh(new THREE.CylinderGeometry(R * 0.93, R * 0.85, 1, 28), lemM, P.whole); liq.renderOrder = 2; liq.castShadow = false;
    const top = mesh(new THREE.CircleGeometry(R * 0.92, 28), mat("#ffd56a", { roughness: 0.1, emissive: new THREE.Color("#d08a1a"), emissiveIntensity: 0.3 }), P.whole); top.rotation.x = -Math.PI / 2; top.castShadow = false;
    const dreg = mesh(new THREE.CylinderGeometry(R * 0.8, R * 0.8, 0.004, 24), mat("#e6a63a", { roughness: 0.2, transparent: true, opacity: 0.6 }), P.whole, 0, 0.022, 0); dreg.castShadow = false;
    const r = rng(S.seed ?? 3), bubbles = [];
    const bm = basic({ color: "#fff6d0", transparent: true, opacity: 0.85 });
    for (let i = 0; i < 9; i++) { const a = r() * 6.28, d = Math.sqrt(r()) * R * 0.7; const b = mesh(new THREE.SphereGeometry(0.0035 + r() * 0.002, 6, 4), bm, P.whole, Math.cos(a) * d, 0, Math.sin(a) * d); b.castShadow = false; b.userData.h = r(); bubbles.push(b); }
    if (S.lemon) {
      // a lemon slice cut to the middle and pushed onto the rim at the back right
      const g = new THREE.Group(); g.position.set(R * 0.62, H - 0.004, -R * 0.62); g.rotation.set(0, -Math.PI / 4, 0); P.whole.add(g);
      const rind = mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.007, 24, 1, false, 0, Math.PI * 2), mat("#f6d23a", { roughness: 0.4 }), g); rind.rotation.x = Math.PI / 2;
      const flesh = canvasTex(64, 64, (c, w, h) => { c.fillStyle = "#fff3a8"; c.fillRect(0, 0, w, h); c.strokeStyle = "#f6e070"; c.lineWidth = 3; for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; c.beginPath(); c.moveTo(w / 2, h / 2); c.lineTo(w / 2 + Math.cos(a) * w / 2, h / 2 + Math.sin(a) * h / 2); c.stroke(); } });
      for (const s of [1, -1]) { const f = mesh(new THREE.CircleGeometry(0.023, 24), mat("#ffffff", { map: flesh, roughness: 0.5 }), g, 0, 0, s * 0.0036); if (s < 0) f.rotation.y = Math.PI; }
      g.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.userData.solid = false; } });
    }
    return {
      grip: H * 0.5,
      apply(ps, t) {
        const f = clamp(ps.fill ?? 1), y1 = 0.02 + (H - 0.03) * f;
        liq.visible = top.visible = f > 0.02; dreg.visible = !liq.visible; liq.scale.y = Math.max(0.001, y1 - 0.02); liq.position.y = (y1 + 0.02) / 2; top.position.y = y1 + 0.001;
        bubbles.forEach((b) => { const k = ((b.userData.h + (t ?? 0) * 0.35) % 1); b.visible = liq.visible; b.position.y = 0.024 + (y1 - 0.03) * k; });
      },
    };
  },

  loodoor(P) {
    const S = P.spec, W = S.w ?? 0.66, H = S.h ?? 1.62, WL = S.wl ?? 0.6, WR = S.wr ?? 0.5, WH = S.wh ?? 2.6, T = 0.08, RD = S.room ?? 0.9;
    // the wall: two side pieces and a lintel round the opening (dark wood panelling to the dado, dark green above)
    const piece = (x0, x1, y0, y1, seed) => {
      const w = x1 - x0, h = y1 - y0;
      const tex = wallTex(Math.round(w * 256), Math.round(h * 256), Math.min(1, 0.85 / h), seed);
      if (y0 > 0) { tex.repeat.set(1, 1); }
      const m = mat("#ffffff", { map: tex, roughness: 0.75 });
      const o = mesh(new THREE.BoxGeometry(w, h, T), m, P.whole, (x0 + x1) / 2, (y0 + y1) / 2, -T / 2); o.userData.solid = true; return o;
    };
    piece(-W / 2 - WL, -W / 2, 0, WH, 1); piece(W / 2, W / 2 + WR, 0, WH, 2);
    const lin = mesh(new THREE.BoxGeometry(W, WH - H, T), mat(GREEN, { roughness: 0.8 }), P.whole, 0, H + (WH - H) / 2, -T / 2); lin.userData.solid = true;
    // a side return on the right edge, back to the back wall (spec.ret metres): the toilet block's side
    if (S.ret) { const rt = mesh(new THREE.BoxGeometry(T, WH, S.ret), mat("#ffffff", { map: wallTex(Math.round(S.ret * 256), Math.round(WH * 256), Math.min(1, 0.85 / WH), 3), roughness: 0.75 }), P.whole, W / 2 + WR - T / 2, WH / 2, -S.ret / 2); rt.userData.solid = true; }
    // the casing round the opening
    const cas = mat("#3a2212", { roughness: 0.45 });
    for (const s of [-1, 1]) nosolid(mesh(new THREE.BoxGeometry(0.07, H + 0.07, 0.03), cas, P.whole, s * (W / 2 + 0.035), (H + 0.07) / 2, 0.015));
    nosolid(mesh(new THREE.BoxGeometry(W + 0.14, 0.07, 0.035), cas, P.whole, 0, H + 0.035, 0.0175));
    // the light box over the door: a little brass box with a round lens, green (free) or red (taken)
    const box = mesh(new THREE.BoxGeometry(0.16, 0.09, 0.06), BRASS(), P.whole, 0, H + 0.2, 0.03); box.userData.solid = false;
    const lensM = new THREE.MeshBasicMaterial({ color: "#35e06a" }); lensM.userData.noHatch = true; lensM.userData.noOutline = true;
    const lens = mesh(new THREE.CircleGeometry(0.03, 24), lensM, P.whole, 0, H + 0.2, 0.0605); lens.userData.solid = false; lens.castShadow = false;
    const haloM = new THREE.MeshBasicMaterial({ color: "#35e06a", transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending }); haloM.userData.noOutline = true; haloM.userData.noHatch = true;
    const halo = mesh(new THREE.CircleGeometry(0.11, 24), haloM, P.whole, 0, H + 0.2, 0.062); halo.userData.solid = false; halo.castShadow = false;
    // the toilet room behind: cream tiles, lit warm (it reads bright when the door opens)
    const tiles = canvasTex(256, 256, (g, w, h) => { g.fillStyle = "#f3e7c8"; g.fillRect(0, 0, w, h); g.strokeStyle = "#cdbb92"; g.lineWidth = 3; for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo((i * w) / 8, 0); g.lineTo((i * w) / 8, h); g.stroke(); g.beginPath(); g.moveTo(0, (i * h) / 8); g.lineTo(w, (i * h) / 8); g.stroke(); } });
    tiles.wrapS = tiles.wrapT = THREE.RepeatWrapping; tiles.repeat.set(2, 2);
    const roomM = new THREE.MeshStandardMaterial({ map: tiles, roughness: 0.4, emissive: new THREE.Color("#f6e2b0"), emissiveIntensity: 0.45, side: THREE.BackSide });
    // spec.roomw: its width (W + 0.5), spec.roomx: its middle off the doorway's (+ right)
    const RW = S.roomw ?? W + 0.5, RX = S.roomx ?? 0;
    const room = mesh(new THREE.BoxGeometry(RW, H + 0.4, RD), roomM, P.whole, RX, (H + 0.4) / 2, -T - RD / 2); room.userData.solid = false; room.castShadow = false;
    // THE DOOR: hinged on its left edge, swinging in (-z)
    const hinge = new THREE.Group(); hinge.position.set(-W / 2 + 0.005, 0, -0.035); P.whole.add(hinge);
    const leafT = canvasTex(256, 512, (g, w, h) => {
      g.fillStyle = "#4a2b17"; g.fillRect(0, 0, w, h);
      for (const [y0, y1] of [[0.06, 0.46], [0.52, 0.94]]) { g.fillStyle = "#3a2010"; g.fillRect(w * 0.12, h * y0, w * 0.76, h * (y1 - y0)); g.fillStyle = "#56331c"; g.fillRect(w * 0.16, h * y0 + 6, w * 0.68, h * (y1 - y0) - 12); g.strokeStyle = "rgba(170,110,60,0.35)"; g.lineWidth = 2; g.strokeRect(w * 0.16, h * y0 + 6, w * 0.68, h * (y1 - y0) - 12); }
      const r = rng(4); for (let i = 0; i < 40; i++) { g.strokeStyle = `rgba(25,12,5,${0.08 + r() * 0.1})`; g.lineWidth = 1 + r() * 2; g.beginPath(); const x = r() * w; g.moveTo(x, 0); g.lineTo(x + (r() - 0.5) * 8, h); g.stroke(); }
    });
    const leaf = mesh(new THREE.BoxGeometry(W - 0.01, H - 0.01, 0.04), mat("#ffffff", { map: leafT, roughness: 0.5 }), hinge, (W - 0.01) / 2, (H - 0.01) / 2 + 0.005, 0); leaf.userData.solid = true;
    // the pictogram plaque (a man and a woman, white on a dark green enamel plate) and the brass push plate + knob
    const picto = canvasTex(256, 192, (g, w, h) => {
      g.fillStyle = "#e9dfc5"; g.beginPath(); g.roundRect(4, 4, w - 8, h - 8, 22); g.fill();
      g.fillStyle = "#2c3e33"; g.beginPath(); g.roundRect(14, 14, w - 28, h - 28, 16); g.fill();
      g.fillStyle = "#f2ead6";
      for (const [cx, skirt] of [[w * 0.33, false], [w * 0.67, true]]) {
        g.beginPath(); g.arc(cx, h * 0.28, 14, 0, Math.PI * 2); g.fill();
        if (skirt) { g.beginPath(); g.moveTo(cx - 10, h * 0.4); g.lineTo(cx + 10, h * 0.4); g.lineTo(cx + 24, h * 0.66); g.lineTo(cx - 24, h * 0.66); g.closePath(); g.fill(); }
        else g.fillRect(cx - 14, h * 0.4, 28, h * 0.27);
        g.fillRect(cx - 11, h * 0.64, 9, h * 0.2); g.fillRect(cx + 2, h * 0.64, 9, h * 0.2);
      }
      g.fillRect(w / 2 - 2, h * 0.18, 4, h * 0.64);
    });
    const pl = mesh(new THREE.PlaneGeometry(0.3, 0.225), mat("#ffffff", { map: picto, roughness: 0.3 }), hinge, W / 2, H * 0.74, 0.0215); pl.userData.solid = false; pl.castShadow = false;
    const brass = BRASS();
    nosolid(mesh(new THREE.BoxGeometry(0.07, 0.24, 0.006), brass, hinge, W - 0.1, H * 0.52, 0.023));
    const knob = mesh(new THREE.SphereGeometry(0.024, 14, 10), brass, hinge, W - 0.09, H * 0.44, 0.045); knob.userData.solid = false;
    const knobI = mesh(new THREE.SphereGeometry(0.024, 14, 10), brass, hinge, W - 0.09, H * 0.44, -0.045); knobI.userData.solid = false;
    const RED = new THREE.Color("#ff2e2e"), GRN = new THREE.Color("#35e06a");
    return {
      grip: H * 0.44,
      apply(ps) {
        hinge.rotation.y = (clamp(ps.open ?? 0) * 100 * Math.PI) / 180;   // + about y swings the free edge to -z (in)
        const k = clamp(ps.on ?? 0);
        lensM.color.copy(GRN).lerp(RED, k); haloM.color.copy(GRN).lerp(RED, k);
      },
    };
  },

  windowwall(P) {
    const S = P.spec, W = S.w ?? 1.8, WH = S.wh ?? 2.6, T = 0.12, win = { w: 1.05, h: 1.15, sill: 0.5, ...(S.win || {}) };
    const ow = win.w, oh = win.h, sy = win.sill, ar = ow / 2, ox = win.x ?? 0;   // the arch's radius (a round head); ox: the opening's middle from the wall's
    // the wall with the arched opening cut out
    const sh = new THREE.Shape(); sh.moveTo(-W / 2, 0); sh.lineTo(W / 2, 0); sh.lineTo(W / 2, WH); sh.lineTo(-W / 2, WH); sh.closePath();
    const hole = new THREE.Path(); const ry = sy + oh - ar;
    hole.moveTo(ox - ow / 2, sy); hole.lineTo(ox + ow / 2, sy); hole.lineTo(ox + ow / 2, ry); hole.absarc(ox, ry, ar, 0, Math.PI, false); hole.lineTo(ox - ow / 2, sy);
    sh.holes.push(hole);
    const g = new THREE.ExtrudeGeometry(sh, { depth: T, bevelEnabled: false, curveSegments: 24 });
    g.translate(0, 0, -T);
    // UVs: the extrude's front face gets x, y in metres; map them onto the wall texture
    const uv = g.attributes.uv, pos = g.attributes.position;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) + W / 2) / W, pos.getY(i) / WH);
    const tex = wallTex(Math.round(W * 256), Math.round(WH * 256), Math.min(1, (sy + 0.02) / WH), 7);
    const wall = mesh(g, mat("#ffffff", { map: tex, roughness: 0.75 }), P.whole); wall.userData.solid = true;
    // a side return on the left edge, back to the back wall (spec.ret metres), so the wall reads as a corner
    if (S.ret) { const rt = mesh(new THREE.BoxGeometry(T, WH, S.ret), mat("#ffffff", { map: wallTex(Math.round(S.ret * 256), Math.round(WH * 256), Math.min(1, 0.85 / WH), 8), roughness: 0.75 }), P.whole, -W / 2 + T / 2, WH / 2, -S.ret / 2); rt.userData.solid = true; }
    // the arch's deep wooden frame and the sill (in a group at the opening's middle)
    const O = new THREE.Group(); O.position.x = ox; P.whole.add(O);
    const wood = mat("#3d2312", { roughness: 0.45 });
    const fs = new THREE.Shape(); fs.moveTo(-ow / 2 - 0.08, sy); fs.lineTo(ow / 2 + 0.08, sy); fs.lineTo(ow / 2 + 0.08, ry); fs.absarc(0, ry, ar + 0.08, 0, Math.PI, false); fs.lineTo(-ow / 2 - 0.08, sy);
    const fh = new THREE.Path(); fh.moveTo(-ow / 2, sy); fh.lineTo(ow / 2, sy); fh.lineTo(ow / 2, ry); fh.absarc(0, ry, ar, 0, Math.PI, false); fh.lineTo(-ow / 2, sy); fs.holes.push(fh);
    const fg = new THREE.ExtrudeGeometry(fs, { depth: 0.04, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 2, curveSegments: 24 });
    nosolid(mesh(fg, wood, O, 0, 0, 0.0));
    const sill = mesh(new THREE.BoxGeometry(ow + 0.26, 0.05, 0.2), wood, O, 0, sy - 0.025, 0.02); sill.userData.solid = true;
    // the glazing bars: a grid in the opening (three uprights, two rails, a fan in the arch) set back in it
    const bar = mat("#2e1a0d", { roughness: 0.5 }), zb = -T * 0.55;
    // win.cols panes across (4: three uprights), win.rails 2 (one at the middle of the straight part, one where the arch
    // starts) or 1 (only at the arch: nothing across a face at the glass)
    const cols = win.cols ?? 4, rails = win.rails ?? 2;
    for (let i = 1; i < cols; i++) nosolid(mesh(new THREE.BoxGeometry(0.025, oh, 0.03), bar, O, (i / cols - 0.5) * ow * 0.98, sy + oh / 2, zb));
    for (const y of rails > 1 ? [sy + (ry - sy) * 0.5, ry] : [ry]) nosolid(mesh(new THREE.BoxGeometry(ow, 0.025, 0.03), bar, O, 0, y, zb));
    for (const a of [Math.PI / 6, Math.PI / 3, (2 * Math.PI) / 3, (5 * Math.PI) / 6]) { const b = nosolid(mesh(new THREE.BoxGeometry(0.022, ar, 0.03), bar, O, Math.cos(a) * ar / 2, ry + Math.sin(a) * ar / 2, zb)); b.rotation.z = a - Math.PI / 2; }
    // the glass: a faint cool sheen with a soft diagonal reflection
    const sheen = canvasTex(256, 256, (c, w, h) => { const gr = c.createLinearGradient(0, 0, w, h); gr.addColorStop(0, "rgba(180,210,255,0.10)"); gr.addColorStop(0.45, "rgba(220,235,255,0.22)"); gr.addColorStop(0.55, "rgba(180,210,255,0.06)"); gr.addColorStop(1, "rgba(150,180,240,0.12)"); c.fillStyle = gr; c.fillRect(0, 0, w, h); });
    const gm = new THREE.MeshBasicMaterial({ map: sheen, transparent: true, depthWrite: false }); gm.userData.noOutline = true; gm.userData.noHatch = true; gm.userData.glass = true;
    const gs = new THREE.Shape(); gs.moveTo(-ow / 2, sy); gs.lineTo(ow / 2, sy); gs.lineTo(ow / 2, ry); gs.absarc(0, ry, ar, 0, Math.PI, false); gs.lineTo(-ow / 2, sy);
    const gg = new THREE.ShapeGeometry(gs, 24); const gu = gg.attributes.uv, gp = gg.attributes.position;
    for (let i = 0; i < gu.count; i++) gu.setXY(i, (gp.getX(i) + ow / 2) / ow, (gp.getY(i) - sy) / oh);
    const glassM = mesh(gg, gm, O, 0, 0, zb + 0.02); glassM.userData.solid = false; glassM.castShadow = false; glassM.renderOrder = 4;
    return { grip: sy };
  },

  coatpeg(P) {
    const S = P.spec, [cA, cB] = S.colors ?? ["#4d4c55", "#8a5a34"];
    const wood = mat("#3c2414", { roughness: 0.5 });
    const pts = [[0, 0], [0.03, 0], [0.025, 0.05], [0.02, 1.4], [0.03, 1.45], [0.02, 1.5], [0, 1.5]].map(([x, y]) => new THREE.Vector2(x, y));
    mesh(new THREE.LatheGeometry(pts, 12), wood, P.whole).userData.solid = true;
    for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + Math.PI / 4; const f = mesh(new THREE.BoxGeometry(0.28, 0.035, 0.04), wood, P.whole, Math.cos(a) * 0.12, 0.03, Math.sin(a) * 0.12); f.rotation.y = -a; f.userData.solid = true; }
    for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2; const h = mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.12, 6), wood, P.whole, Math.cos(a) * 0.05, 1.42, Math.sin(a) * 0.05); h.rotation.z = Math.cos(a) * 0.9; h.rotation.x = -Math.sin(a) * 0.9; h.userData.solid = false; }
    // the two coats hang from hooks on the camera side and on the left
    const coat = (color, ang) => {
      const g = new THREE.Group(); g.position.set(Math.sin(ang) * 0.11, 1.42, Math.cos(ang) * 0.11); g.rotation.y = ang; P.whole.add(g);
      const m = mat(color, { roughness: 0.85 });
      const prof = [[0.02, 0], [0.11, -0.06], [0.15, -0.25], [0.17, -0.6], [0.18, -0.85], [0.001, -0.85]].map(([x, y]) => new THREE.Vector2(x, y));
      const body = mesh(new THREE.LatheGeometry(prof, 18), m, g); body.scale.z = 0.45; body.userData.solid = false;
      const col = mesh(new THREE.TorusGeometry(0.06, 0.02, 6, 16), mat(new THREE.Color(color).multiplyScalar(0.8).getStyle(), { roughness: 0.85 }), g, 0, -0.05, 0); col.rotation.x = Math.PI / 2; col.userData.solid = false;
      return g;
    };
    const A = coat(cA, 0.35), B = coat(cB, -0.9);
    return { grip: 1.0, apply(ps) { A.visible = (ps.fade ?? 0) < 0.5; B.visible = (ps.gap ?? 0) < 0.5; } };
  },

  drapedcoat(P) {
    // a coat folded over the bar's front edge (where a pub's regulars leave theirs): the fold on the top, the rest hanging
    // down the front, the collar showing at the fold; `fade` 0..1 takes it (gone from 0.5: the hand has it)
    const S = P.spec, W = S.w ?? 0.3, F = S.flap ?? 0.32, T = S.top ?? 0.12, color = S.color ?? "#4d4c55";
    const m = mat(color, { roughness: 0.85 }), dark = mat(new THREE.Color(color).multiplyScalar(0.72).getStyle(), { roughness: 0.85 });
    const g = new THREE.Group(); P.whole.add(g);
    const top = mesh(new THREE.BoxGeometry(W, 0.022, T), m, g, 0, 0.011, -T / 2 + 0.01);
    const fold = mesh(new THREE.CylinderGeometry(0.022, 0.022, W, 12), m, g, 0, -0.004, 0.022); fold.rotation.z = Math.PI / 2;
    const flap = mesh(new THREE.BoxGeometry(W * 1.04, F, 0.024), m, g, 0, -F / 2, 0.034); flap.rotation.x = 0.05;
    const hem = mesh(new THREE.BoxGeometry(W * 1.08, 0.03, 0.028), dark, g, 0, -F + 0.012, 0.038); hem.rotation.x = 0.05;
    const collar = mesh(new THREE.BoxGeometry(W * 0.62, 0.016, 0.07), dark, g, 0, 0.026, -T + 0.05);
    // a sleeve hanging down the front beside the body
    const sl = mesh(new THREE.CylinderGeometry(0.03, 0.036, F * 0.85, 10), m, g, W * 0.36, -F * 0.43, 0.06); sl.rotation.z = 0.06;
    [top, fold, flap, hem, collar, sl].forEach((o) => { o.userData.solid = false; o.castShadow = true; });
    return { grip: 0, apply(ps) { g.visible = (ps.fade ?? 0) < 0.5; } };
  },

  wearcoat(P) {
    const S = P.spec, B = { rx: 0.38, rz: 0.36, cy: 0.66, ry: 0.52, taper: 0.16, ...(S.body || {}) }, Y0 = S.y0 ?? 1.0, Y1 = S.y1 ?? 0.3, M = S.margin ?? 0.03;
    const OPEN = ((S.open ?? 34) * Math.PI) / 180;   // half the gap down the front
    const color = S.color ?? "#4d4c55";
    const m = mat(color, { roughness: 0.85, side: THREE.DoubleSide });
    // the body's half-widths at a height, plus the cloth's margin
    const at = (y) => { const d = clamp((y - B.cy) / B.ry, -0.999, 0.999), s = Math.sqrt(1 - d * d), tp = 1 - B.taper * d; return [B.rx * s * tp + M, B.rz * s * tp + M]; };
    const NU = 28, NV = 12, geo = new THREE.BufferGeometry(), P3 = [], IDX = [];
    for (let j = 0; j <= NV; j++) {
      const v = j / NV, y = Y1 + (Y0 - Y1) * v;
      // the hem flares a little; the shoulders hug
      const [ax, az] = at(y), fl = 1 + 0.08 * (1 - v) * (1 - v);
      for (let i = 0; i <= NU; i++) { const a = OPEN + ((Math.PI * 2 - 2 * OPEN) * i) / NU; P3.push(Math.sin(a) * ax * fl, y, Math.cos(a) * az * fl); }
    }
    for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) { const a = j * (NU + 1) + i, b = a + 1, c = a + NU + 1, d = c + 1; IDX.push(a, c, b, b, c, d); }
    geo.setAttribute("position", new THREE.Float32BufferAttribute(P3, 3)); geo.setIndex(IDX); geo.computeVertexNormals();
    const pivot = new THREE.Group(); pivot.position.set(0, Y0, 0); P.whole.add(pivot);
    const shell = mesh(geo, m, pivot, 0, -Y0, 0); shell.userData.solid = false;
    // the turned-down collar: a fat ring round the top, open at the front, and two lapels
    const [cx, cz] = at(Y0 - 0.02);
    const cr = new THREE.TorusGeometry(1, 0.035, 8, 28, Math.PI * 2 - 2 * OPEN + 0.3); cr.rotateX(Math.PI / 2); cr.rotateY(-Math.PI / 2 + OPEN - 0.15);
    const cp = cr.attributes.position; for (let i = 0; i < cp.count; i++) cp.setXYZ(i, cp.getX(i) * (cx + 0.01), cp.getY(i), cp.getZ(i) * (cz + 0.01));
    cr.computeVertexNormals();
    const collar = mesh(cr, mat(new THREE.Color(color).multiplyScalar(0.75).getStyle(), { roughness: 0.85 }), pivot, 0, -0.03, 0); collar.userData.solid = false;
    // buttons down the right front edge
    const bm = mat("#2a1d14", { roughness: 0.4 });
    for (const y of [0.78, 0.62, 0.46]) { if (y > Y0 || y < Y1) continue; const [ax, az] = at(y); const a = OPEN + 0.12; nosolid(mesh(new THREE.SphereGeometry(0.014, 8, 6), bm, pivot, Math.sin(a) * (ax + 0.006), y - Y0, Math.cos(a) * (az + 0.006))); }
    P.whole.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    return {
      grip: 0,
      apply(ps) {
        // throwing it on: it swings round from behind the shoulders (pitched back, held up), and wraps in
        const k = clamp(ps.on ?? 1), e = k * k * (3 - 2 * k);
        pivot.visible = k > 0.02;
        pivot.rotation.x = -1.2 * (1 - e);
        pivot.scale.set(1 + 0.25 * (1 - e), 0.35 + 0.65 * e, 1 + 0.25 * (1 - e));
      },
    };
  },

  bartowel(P) {
    const m = mat("#f4f1e8", { roughness: 0.9 }), stripe = mat("#3d6fa8", { roughness: 0.9 });
    // folded over the shoulder: a curved top and two flaps, the front one shorter
    const top = mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.13, 12, 1, true, -Math.PI / 2, Math.PI), m, P.whole, 0, 0, 0); top.rotation.z = Math.PI / 2; top.rotation.y = Math.PI / 2;
    const front = mesh(new THREE.BoxGeometry(0.13, 0.16, 0.012), m, P.whole, 0, -0.08, 0.05); front.rotation.x = -0.15;
    const back = mesh(new THREE.BoxGeometry(0.13, 0.26, 0.012), m, P.whole, 0, -0.13, -0.05); back.rotation.x = 0.12;
    for (const y of [-0.12, -0.14]) nosolid(mesh(new THREE.BoxGeometry(0.131, 0.008, 0.013), stripe, P.whole, 0, y, 0.054));
    nosolid(P.whole); P.whole.traverse((o) => { if (o.isMesh) o.castShadow = false; });
    return { grip: 0 };
  },

  barreader(P) {
    const S = P.spec, { w: W, d: D, h: H } = PUB.reader, TOTAL = S.total ?? "84.00";
    const shell = mat("#24262d", { roughness: 0.45 }), rim = mat("#3a3d47", { roughness: 0.35 });
    // a wedge: thin at the near (+z) end, the far end tall, its top sloping toward the reader of it
    const sh = new THREE.Shape(); sh.moveTo(-D / 2, 0); sh.lineTo(D / 2, 0); sh.lineTo(D / 2, H * 0.45); sh.lineTo(-D / 2, H); sh.closePath();
    const g = new THREE.ExtrudeGeometry(sh, { depth: W, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 2 });
    g.translate(0, 0, -W / 2); g.rotateY(-Math.PI / 2);   // the shape's x (far -> near) runs along +z
    const body = mesh(g, shell, P.whole); body.userData.solid = true;
    const slope = Math.atan2(H - H * 0.45, D);   // the top's tilt
    const topY = (z) => H * 0.45 + ((D / 2 - z) / D) * (H - H * 0.45);
    // the screen: the far half of the top, the total in big glowing digits
    const scr = canvasTex(320, 192, (c, w, h) => {
      c.fillStyle = "#0d1c3a"; c.fillRect(0, 0, w, h);
      const gr = c.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w * 0.6); gr.addColorStop(0, "rgba(80,160,255,0.35)"); gr.addColorStop(1, "rgba(80,160,255,0)"); c.fillStyle = gr; c.fillRect(0, 0, w, h);
      c.fillStyle = "#bfe3ff"; c.font = "bold 92px Arial, Helvetica, sans-serif"; c.textAlign = "center"; c.textBaseline = "middle";
      c.shadowColor = "#5fb0ff"; c.shadowBlur = 18; c.fillText(TOTAL, w / 2, h / 2 + 4);
    });
    const scrM = new THREE.MeshBasicMaterial({ map: scr, toneMapped: false }); scrM.userData.noHatch = true; scrM.userData.noOutline = true;
    const sw = W * 0.82, sd = D * 0.42;
    const screen = mesh(new THREE.PlaneGeometry(sw, sd), scrM, P.whole, 0, topY(-D * 0.22) + 0.0075, -D * 0.22); screen.rotation.x = -Math.PI / 2 + slope; screen.castShadow = false; screen.userData.solid = false;
    const frame = mesh(new THREE.BoxGeometry(sw + 0.012, 0.004, sd + 0.012), rim, P.whole, 0, topY(-D * 0.22) + 0.004, -D * 0.22); frame.rotation.x = slope; frame.userData.solid = false;
    // the keypad: 3 x 3 grey keys and a row of red, yellow, green
    const key = (x, z, c) => { const k = mesh(new THREE.BoxGeometry(0.022, 0.006, 0.014), mat(c, { roughness: 0.4 }), P.whole, x, topY(z) + 0.008, z); k.rotation.x = slope; k.userData.solid = false; k.castShadow = false; };
    for (let r = 0; r < 3; r++) for (let q = 0; q < 3; q++) key((q - 1) * 0.03, D * 0.06 + r * 0.02, "#8d929e");
    [["#d8352e", -1], ["#e9c13a", 0], ["#3fae55", 1]].forEach(([c, q]) => key(q * 0.03, D * 0.06 + 3 * 0.02, c));
    const glowM = new THREE.MeshBasicMaterial({ color: "#7cc4ff", transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }); glowM.userData.noOutline = true; glowM.userData.noHatch = true;
    const glow = mesh(new THREE.PlaneGeometry(sw * 1.5, sd * 1.6), glowM, P.whole, 0, topY(-D * 0.22) + 0.012, -D * 0.22); glow.rotation.x = -Math.PI / 2 + slope; glow.castShadow = false; glow.userData.solid = false;
    return { grip: H * 0.5, apply(ps) { glowM.opacity = 0.55 * clamp(ps.glow ?? 0); } };
  },
};
