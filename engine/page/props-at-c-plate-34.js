// Block C painted scenes for plates 34 (Port Royal 1692) and 35 (Port Royal sinking): data for props-at-c-plate.js (see its header for the format).
// Owner: the C plate-34/35 builder. Scene keys "34" and "35". Light AT_DAY. Assets: assets/props/atlantis/c/c-p34*.webp|png, c-p35*.webp|png
// (built by storyboards/series/ancient-aliens/03-atlantis/block-c/tools/plate-34.py from the env paint.png of at-port-royal / at-port-royal-sink).
//
// HOW THIS FILE WORKS: the pieces are authored in PLATE PIXELS (1536 x 1024) and lifted to 3D by the painter's camera: a pixel polygon
// plus the plane it lies on (floor, a vertical wall, a roof, a depth plane) gives world points, so every piece's edge sits on the painted
// edge by construction. From the painter's camera the frame is the plate; a move of up to ~1 m keeps real parallax.
//
// USAGE (clip generators): { kind: "cplate", scene: "34" | "35", x: 0, y: 0, z: 0, light: "day", hide: ["ships"], still: false }
//   Place the prop at x 0, z 0 (or anywhere: all numbers below are relative to it), y 0. Spec keys: scene, light ("day" default), grade,
//   still, hide (groups below); params quake / sink (35, both 0..1, spec or tween; default 0).
//   spec.hide groups: "ships" (the painted ships, cut cards: place 3D ships if you hide them), "houses" (the shop fronts and town row of 34;
//   the leaning houses of 35), "palm" (34: the palm card), "jetty" (34: the jetty rails and piles), "piles" (35: piles and wrecked rails).
//   35 params: quake 0..1 shakes the "houses" group by up to ~3 cm (sin of the clip clock, deterministic); sink 0..1 lowers it by up to 0.8 m
//   (the painting goes down with it, the sea hides what is below y -1.2).
//   THE FLOOR IS THE BOARDWALK TOP at LOCAL y 0, so the prop's y is 0 (no offset): the contact ovals land on it. The sea is at local
//   y -1.2. Origin x 0, z 0 = the point on the floor under the painter's camera (which stands 2.0 m above the boards).
//   Standable (`tops`, invisible slabs at y 0): 34 x -9..1.5, z -16..0.8; 35 x -8..2.0, z -9..1.2 (the rest of each deck is painted floor).
//   Spud's spot (feet on the floor): 34 x -0.15, z -4.38 (plate pixel 520, 940, left of centre, 4.4 m ahead);
//                                    35 x 1.30, z -3.82 (plate pixel 440, 870, left of the beam, 3.8 m ahead).
//   Props that stand on the floor: 34 three barrels (x -3.8,-2.7,-1.5, z -9.8,-6.4,-3.4), two crates, six posts (lathes, 1 m tall, r 0.2-0.26)
//   and a jetty (cut card on its front plane, 13 m); 35 a capstan (0.4 m).
//
// PAINTER'S CAMERAS (the plate is 1536 x 1024; f and hy in plate px; yaw deg, + turns left; pitch deg, - looks down; cx 768):
//   34: pos [0, 2, 0], yaw -12, pitch 0, f 1000, hy 470 (horizon row 470).
//       As a 16:9 clip camera showing the whole plate width (window rows 128..992): pos [0, 2, 0], look [10.4, -2.5, -48.9], fov 46.7.
//   35: pos [0, 2, 0], yaw -38, pitch -8, f 1000, hy 512 (the horizon falls at plate row 372).
//       As a 16:9 clip camera (window rows 80..944): pos [0, 2, 0], look [30.5, -5.0, -39.0], fov 46.7.
//   34 and 35 share the camera position (the same 2 m eye height over the boards) and f; they differ by 26 deg of yaw and 8 deg of pitch,
//   so one camera cannot serve both: each scene is its own world, place them 12000 m apart if both are in one storyboard.
// MOVING THE CAMERA: from the painter's spot, a move of up to ~1 m (0.8 sideways + 0.5 in were proven on the bench) and a pan of ~5 deg keep the
//   picture clean; beyond that the faces the painter never saw (sides of posts, the far side of the jetty, behind the houses) show the plate
//   mirrored. Push-ins and pans are free. The far world (sky 1300 m, hills 350 m / town 150 m) is within the clip camera's far 1500.
// Deterministic: no Math.random, no clock.
const DEG = Math.PI / 180;

// ------------------------------------------------------------------------------------------ the pixel -> world helpers
const V = {
  add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  mul: (a, k) => [a[0] * k, a[1] * k, a[2] * k], dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
  norm: (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
};
const r3 = (x) => Math.round(x * 1000) / 1000;
const R = (p) => p.map(r3);

function rig(c) {
  const th = c.yaw * DEG, pt = (c.pitch ?? 0) * DEG, f = c.f, cx = c.cx ?? 768, hy = c.hy, pos = c.pos;
  const fwd = [-Math.sin(th) * Math.cos(pt), Math.sin(pt), -Math.cos(th) * Math.cos(pt)], rt = [Math.cos(th), 0, -Math.sin(th)];
  const upv = [Math.sin(pt) * Math.sin(th), Math.cos(pt), Math.sin(pt) * Math.cos(th)];
  const hz = [-Math.sin(th), 0, -Math.cos(th)];                                           // the view direction on the ground
  const dir = (px, py) => [fwd[0] + ((px - cx) / f) * rt[0] + ((hy - py) / f) * upv[0], fwd[1] + ((hy - py) / f) * upv[1], fwd[2] + ((px - cx) / f) * rt[2] + ((hy - py) / f) * upv[2]];
  const hit = (pl, px, py) => { const d = dir(px, py), den = V.dot(pl.n, d), t = (pl.d - V.dot(pl.n, pos)) / den; return V.add(pos, V.mul(d, t)); };
  const depthOf = (P) => V.dot(fwd, V.sub(P, pos));
  const Y = (y) => ({ n: [0, 1, 0], d: y });
  const Wd = (w) => ({ n: fwd, d: V.dot(fwd, pos) + w });                                  // perpendicular to the view axis
  const Vd = (w) => ({ n: hz, d: V.dot(hz, pos) + w });                                    // upright, facing the camera, w m ahead on the ground
  const vert = (A, B) => { const n = V.norm([-(B[2] - A[2]), 0, B[0] - A[0]]); return { n, d: V.dot(n, A) }; };
  const plane3 = (A, B, C) => { const n = V.norm(V.cross(V.sub(B, A), V.sub(C, A))); return { n, d: V.dot(n, A) }; };
  const shift = (pl, k) => ({ n: pl.n, d: pl.d + k });
  const g = (px, py) => hit(Y(0), px, py);                                             // plate pixel -> the floor (y 0)
  const up = (P, row) => [P[0], pos[1] + ((hy - row) * depthOf(P)) / f, P[2]];         // pitch 0 only: the point above P at plate row `row`
  const wpt = (w, s, y) => [pos[0] + w * hz[0] + s * rt[0], y, pos[2] + w * hz[2] + s * rt[2]];   // ground distance w, lateral s, height y
  // a roof plane through the eave line E0-E1 rising `alpha` degrees away from the camera
  const roof = (E0, E1, alpha) => {
    let b = V.norm(V.cross([0, 1, 0], V.sub(E1, E0))); if (V.dot(b, hz) < 0) b = V.mul(b, -1);
    const r = V.add(V.mul(b, Math.cos(alpha * DEG)), [0, Math.sin(alpha * DEG), 0]);
    const n = V.norm(V.cross(V.sub(E1, E0), r)); return { n, d: V.dot(n, E0) };
  };
  return { pos, fwd, rt, upv, hz, dir, hit, depthOf, Y, Wd, Vd, vert, plane3, shift, g, up, wpt, roof };
}

// ear clipping of a pixel polygon (any simple polygon) -> triangles of indices
function earclip(P) {
  const n = P.length; if (n < 3) return [];
  let area = 0; for (let i = 0; i < n; i++) { const a = P[i], b = P[(i + 1) % n]; area += a[0] * b[1] - b[0] * a[1]; }
  const idx = P.map((_, i) => i); if (area < 0) idx.reverse();
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const inside = (p, a, b, c) => cross(a, b, p) >= -1e-9 && cross(b, c, p) >= -1e-9 && cross(c, a, p) >= -1e-9;
  const out = []; let guard = 0;
  while (idx.length > 3 && guard++ < 4000) {
    let cut = false;
    for (let k = 0; k < idx.length; k++) {
      const i0 = idx[(k + idx.length - 1) % idx.length], i1 = idx[k], i2 = idx[(k + 1) % idx.length], a = P[i0], b = P[i1], c = P[i2];
      if (cross(a, b, c) <= 1e-9) continue;
      let ok = true; for (const j of idx) if (j !== i0 && j !== i1 && j !== i2 && inside(P[j], a, b, c)) { ok = false; break; }
      if (!ok) continue;
      out.push([i0, i1, i2]); idx.splice(k, 1); cut = true; break;
    }
    if (!cut) { out.push([idx[0], idx[1], idx[2]]); idx.splice(1, 1); }
  }
  if (idx.length === 3) out.push([idx[0], idx[1], idx[2]]);
  return out;
}

// the piece builders: each returns a list of [type, layer, geometry, options] entries
function maker(C) {
  const o = rig(C);
  const poly = (layer, plane, pts, opt) => earclip(pts).map(([a, b, c]) => ["poly", layer, [R(o.hit(plane, ...pts[a])), R(o.hit(plane, ...pts[b])), R(o.hit(plane, ...pts[c]))], opt]);
  const quad = (layer, A, B, Cc, D, opt) => [["quad", layer, [R(A), R(B), R(Cc), R(D)], opt]];
  // the plate row of the straight base line A-B (plate pixels) at column x
  const bl = (A, B, x) => A[1] + ((B[1] - A[1]) * (x - A[0])) / (B[0] - A[0]);
  // a wall standing on the ground line A-B (plate pixels, both on the floor): `top` is its upper outline (plate pixels, left to right)
  const facade = (layer, A, B, top, opt) => {
    const pts = [...top, [top[top.length - 1][0], bl(A, B, top[top.length - 1][0])], [top[0][0], bl(A, B, top[0][0])]];
    return poly(layer, o.vert(o.g(...A), o.g(...B)), pts, opt);
  };
  // a roof through the eave P-Q (plate pixels on the wall of ground line A-B), rising `alpha` deg away from the camera; `outline` in plate pixels
  const roof = (layer, A, B, P, Q, alpha, outline, opt) => {
    const wp = o.vert(o.g(...A), o.g(...B));
    return poly(layer, o.roof(o.hit(wp, ...P), o.hit(wp, ...Q), alpha), outline, opt);
  };
  // an upright card on the depth plane w (plate pixels rect x0, y0, x1, y1)
  const card = (layer, w, x0, y0, x1, y1, opt) => poly(layer, o.Vd(w), [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], opt);
  // an oriented box (rot deg about y, + turns the +x edge toward -z), floor y0..y1, centre (cx, cz), size sx x sz
  const obox = (layer, cx, cz, sx, sz, y0, y1, rot, opt) => {
    const c = Math.cos(rot * DEG), s = Math.sin(rot * DEG), L = (a, b) => [cx + a * c + b * s, cz - a * s + b * c];
    const k = [[-sx / 2, -sz / 2], [sx / 2, -sz / 2], [sx / 2, sz / 2], [-sx / 2, sz / 2]].map(([a, b]) => L(a, b)), out = [];
    for (let i = 0; i < 4; i++) { const a = k[i], b = k[(i + 1) % 4]; out.push(...quad(layer, [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]], opt)); }
    out.push(...quad(layer, [k[0][0], y1, k[0][1]], [k[1][0], y1, k[1][1]], [k[2][0], y1, k[2][1]], [k[3][0], y1, k[3][1]], opt));
    return out;
  };
  // a barrel or post: a lathe about the vertical axis through the plate pixel (px, py) taken at height h; radius rad (m), profile [[r factor, y fraction]]
  const turned = (layer, px, py, h, rad, prof, y0 = 0, opt = {}) => {
    const P = o.hit(o.Y(h), px, py);
    return [["lathe", layer, [r3(P[0]), r3(P[2]), prof.map(([k, f]) => [r3(k * rad), r3(y0 + f * (h - y0))])], { n: 16, ...opt }]];
  };
  return { o, poly, quad, facade, roof, card, obox, turned };
}
const BARREL = [[0.86, 0], [0.97, 0.2], [1, 0.5], [0.97, 0.78], [0.88, 1], [0, 1]];
const POST = [[1, 0], [1, 0.92], [0.94, 1], [0, 1]];

// ------------------------------------------------------------------------------------------------------------- plate 34
const CAM34 = { pos: [0, 2.0, 0], yaw: -12, pitch: 0, f: 1000, cx: 768, hy: 470 };
function scene34() {
  const M = maker(CAM34), o = M.o, pieces = [];
  const add = (...a) => pieces.push(...a.flat());
  const SEA = -1.2, H = "houses";
  // ---- the far world: the sky + far hills quad (1300 m), the hill town on a 350 m strip, the water body
  add(M.poly("clean", o.Wd(1300), [[-2600, -1800], [4200, -1800], [4200, 520], [-2600, 520]]));
  add(M.poly("clean", o.Wd(350), [[330, 205], [450, 192], [560, 170], [660, 160], [740, 190], [850, 195], [860, 190], [926, 195], [930, 205], [1000, 225], [1060, 222], [1100, 255], [1200, 300], [1280, 335], [1330, 400], [1330, 470], [1090, 500], [330, 500]]));
  add([["quad", "water", [R(o.wpt(0.4, -2500, SEA)), R(o.wpt(0.4, 2500, SEA)), R(o.wpt(1250, 2500, SEA)), R(o.wpt(1250, -2500, SEA))]]]);
  // ---- the boardwalk: the floor y 0 (a polygon in plate pixels: right edge of the planks, far line along the shop fronts, the left and the bottom beyond the frame)
  const EDGE = [[1400, 1105], [1215, 985], [1020, 860], [855, 745], [787, 685], [735, 652], [675, 605], [652, 590], [655, 565], [689, 537], [804, 520], [940, 503], [1075, 490], [1100, 488]];
  const FAR = [[1100, 488], [1090, 487], [1000, 491], [900, 497], [850, 502], [765, 519], [700, 526], [640, 534], [560, 546], [500, 549], [420, 552], [322, 572], [318, 598], [150, 602], [0, 607], [-600, 615], [-600, 1105]];
  add(M.poly("clean", o.Y(0), [...EDGE, ...FAR.slice(1)]));
  // the rail beam along the edge (a 0.2 m high ribbon: the near part from the plank ends to the outer edge; the quay part a thin ribbon)
  add(M.poly("clean", o.Y(0.2), [[1400, 1105], [1215, 985], [1020, 860], [855, 745], [787, 685], [735, 652], [675, 605], [652, 590], [652, 586], [690, 608], [745, 652], [840, 718], [1025, 803], [1140, 853], [1360, 958], [1536, 1040], [1536, 1105]]));
  add(M.poly("clean", o.Y(0.2), [[652, 590], [655, 565], [689, 537], [804, 520], [940, 503], [1075, 490], [1100, 488], [1100, 484], [1075, 486], [940, 499], [804, 516], [689, 533], [659, 562], [656, 586]]));
  // the quay front below its beam: a wall from the deck down to the sea
  { const Q = [[689, 537], [804, 520], [940, 503], [1075, 490]].map(([x, y]) => o.g(x, y));
    for (let i = 0; i < Q.length - 1; i++) add(M.quad("clean", Q[i], Q[i + 1], [Q[i + 1][0], SEA, Q[i + 1][2]], [Q[i][0], SEA, Q[i][2]])); }
  // ---- the jetty: deck top, front beam, then the piles and rails as a cut card on the front plane
  add(M.poly("clean", o.Y(0), [[760, 602], [1388, 598], [1392, 622], [760, 625]]));
  { const F0 = o.g(760, 625), F1 = o.g(1392, 622);
    add(M.quad("clean", F0, F1, [F1[0], -0.3, F1[2]], [F0[0], -0.3, F0[2]]));
    add(M.poly("base", o.vert(F0, F1), [[868, 548], [1395, 548], [1395, 722], [868, 722]], { g: "jetty" }).map((p) => (p[1] = "cut", p))); }
  // ---- the near things: posts, barrels, crates (the base layer; the clean layer has them painted out)
  add(M.turned("base", 1087, 707, 1.0, 0.235, POST, -0.2));        // the big post at the edge
  add(M.turned("base", 1465, 818, 1.0, 0.24, POST, -0.2));         // the post at the right frame edge
  add(M.turned("base", 676, 532, 1.0, 0.22, POST, -0.2));          // the rope posts along the beam
  add(M.turned("base", 756, 541, 1.0, 0.26, POST, -0.2));
  add(M.turned("base", 852, 632, 1.0, 0.21, POST, -0.2));
  add(M.turned("base", 851, 537, 0.9, 0.24, POST, SEA));           // the pile at the jetty's near end
  add(M.turned("base", 108, 590, 0.95, 0.36, BARREL));              // barrels at the left
  add(M.turned("base", 66, 655, 0.95, 0.36, BARREL));
  add(M.turned("base", 30, 820, 0.95, 0.36, BARREL));
  { const A = o.hit(o.Y(0.65), 190, 690), B = o.hit(o.Y(0.65), 232, 850);                              // two crates
    add(M.obox("base", A[0], A[2], 0.66, 0.66, 0, 0.65, 18), M.obox("base", B[0], B[2], 0.72, 0.72, 0, 0.65, 24)); }
  // ---- the left houses and the shop row (the clean layer; the palm is a card in front)
  const L1a = [42, 590], L1b = [310, 602], L2a = [330, 568], L2b = [520, 548], L2c = [615, 533], L3a = [628, 533], L3b = [762, 516];
  add(M.facade("clean", L1a, L1b, [[0, 172], [322, 250]], { g: H }), M.roof("clean", L1a, L1b, [0, 172], [322, 250], 40, [[0, 0], [232, 0], [358, 248], [322, 250], [0, 172]], { g: H }));
  add(M.facade("clean", L2a, L2b, [[322, 290], [521, 284]], { g: H }), M.roof("clean", L2a, L2b, [322, 290], [521, 284], 35, [[322, 290], [330, 235], [350, 230], [352, 182], [392, 182], [392, 210], [578, 193], [521, 284]], { g: H }));
  add(M.facade("clean", L2b, L2c, [[521, 285], [578, 196], [628, 306]], { g: H }));
  add(M.facade("clean", L3a, L3b, [[628, 309], [760, 352]], { g: H }), M.roof("clean", L3a, L3b, [628, 309], [760, 350], 30, [[628, 309], [637, 278], [710, 297], [760, 320], [760, 350]], { g: H }));
  { // the far row of the shop front: one ribbon of wall and one of roof, from x 762 to 1095
    const base = [[762, 516], [800, 506], [895, 497], [1050, 490], [1095, 486]], top = [352, 370, 378, 372, 385], ridge = [320, 335, 322, 322, 345];
    const G = base.map(([x, y]) => o.g(x, y)), E = G.map((P, i) => o.up(P, top[i]));
    for (let i = 0; i < G.length - 1; i++) {
      add(M.quad("clean", G[i], G[i + 1], E[i + 1], E[i], { g: H }));
      const tg = V.sub(G[i + 1], G[i]); let bk = V.norm(V.cross([0, 1, 0], tg)); if (V.dot(bk, o.hz) < 0) bk = V.mul(bk, -1);
      const Qa = o.hit({ n: bk, d: V.dot(bk, V.add(G[i], V.mul(bk, 6))) }, base[i][0], ridge[i]), Qb = o.hit({ n: bk, d: V.dot(bk, V.add(G[i + 1], V.mul(bk, 6))) }, base[i + 1][0], ridge[i + 1]);
      add(M.quad("clean", E[i], E[i + 1], Qb, Qa, { g: H }));
    } }
  // ---- the palm: a trunk card and a frond card on the depth plane of its foot (20 m)
  add(M.card("base", 20, 245, 0, 645, 590, { g: "palm" }).map((p) => (p[1] = "cut", p)));
  // ---- the ships: cut cards on the water at the depth where their waterline meets the sea (the painting's own scale)
  add(M.card("base", 3200 / (494 - 470), 1062, 185, 1275, 494, { g: "ships", bob: 0.3 }).map((p) => (p[1] = "cut", p)));
  add(M.card("base", 3200 / (481 - 470), 1255, 55, 1536, 481, { g: "ships", bob: 2.1 }).map((p) => (p[1] = "cut", p)));
  return { pieces, M, o };
}
const S34 = scene34();

// ------------------------------------------------------------------------------------------------------------- plate 35
const CAM35 = { pos: [0, 2.0, 0], yaw: -38, pitch: -8, f: 1000, cx: 768, hy: 512 };   // horizon at plate row 372
function scene35() {
  const M = maker(CAM35), o = M.o, pieces = [];
  const add = (...a) => pieces.push(...a.flat());
  const SEA = -1.2, H = "houses";
  const cut = (arr) => arr.map((p) => (p[1] = "cut", p));
  // ---- far world: sky (1300 m), the church and the town on a 150 m strip, the sea
  add(M.poly("clean", o.Vd(1300), [[-3000, -2600], [4600, -2600], [4600, 420], [-3000, 420]]));
  add(M.poly("clean", o.Vd(150), [[480, 150], [560, 100], [660, 98], [740, 110], [790, 70], [805, 20], [825, 5], [900, 5], [918, 40], [925, 130], [960, 170], [1040, 230], [1100, 240], [1160, 255], [1210, 262], [1240, 300], [1300, 380], [1130, 400], [700, 340], [480, 330]]));
  add([["quad", "water", [R(o.wpt(0.4, -2500, SEA)), R(o.wpt(0.4, 2500, SEA)), R(o.wpt(1250, 2500, SEA)), R(o.wpt(1250, -2500, SEA))]]]);
  // ---- the pier deck: the floor y 0 up to the plank ends along the beam, then the broken edge toward the houses
  add(M.poly("clean", o.Y(0), [[1250, 1130], [1180, 1080], [1055, 1005], [930, 950], [800, 875], [625, 810], [560, 720], [540, 660], [520, 640], [440, 622], [330, 605], [250, 582], [215, 555], [190, 520], [-400, 470], [-400, 1130]]));
  add(M.poly("clean", o.Y(0.25), [[645, 755], [820, 820], [950, 895], [1075, 950], [1200, 1025], [1300, 1075], [1250, 1130], [1180, 1080], [1055, 1005], [930, 950], [800, 875], [625, 810]]));
  add(M.turned("base", 47, 668, 0.4, 0.2, POST, -0.1));                     // the capstan at the left edge
  // ---- the houses: vertical planes through their feet (leaning is in the painting), group "houses" (quake and sink move it)
  const house = (A, B, outline) => M.poly("clean", o.vert(o.g(...A), o.g(...B)), outline, { g: H });
  add(house([0, 447], [346, 478], [[-150, -100], [370, -100], [375, 0], [395, 140], [375, 240], [350, 330], [340, 420], [346, 478], [0, 447], [-150, 434]]));
  add(house([380, 505], [690, 445], [[380, 140], [430, 105], [500, 115], [560, 180], [640, 225], [700, 240], [705, 330], [690, 380], [690, 445], [380, 505], [365, 420], [355, 330], [365, 250]]));
  add(house([830, 480], [1010, 455], [[790, 370], [850, 320], [900, 305], [975, 350], [1010, 400], [1090, 385], [1105, 430], [1010, 455], [830, 480], [800, 440]]));
  add(house([1000, 395], [1130, 380], [[985, 310], [1040, 245], [1130, 255], [1165, 295], [1135, 380], [1000, 395]]));
  // ---- the piles and wrecked rails in the sea: two cut cards (far zone 11 m, near zone 6.5 m), cut by colour
  add(cut(M.poly("base", o.Vd(11), [[300, 540], [560, 525], [800, 520], [1000, 495], [1100, 470], [1130, 445], [1536, 445], [1536, 740], [945, 740], [945, 610], [770, 610], [770, 700], [560, 700], [540, 660], [520, 640], [440, 622], [330, 605], [300, 590]], { g: "piles" })));
  add(cut(M.poly("base", o.Vd(6.5), [[770, 610], [945, 610], [945, 740], [1536, 740], [1536, 1024], [1210, 1024], [1075, 946], [950, 891], [830, 815], [770, 790]], { g: "piles" })));
  // ---- the ships: cut cards where their waterlines meet the sea
  add(cut(M.poly("base", o.Vd(3200 / (400 - 372)), [[1100, 60], [1360, 60], [1360, 410], [1100, 410]], { g: "ships", bob: 0.3 })));
  add(cut(M.poly("base", o.Vd(3200 / (434 - 372)), [[1370, -100], [1700, -100], [1700, 438], [1370, 438]], { g: "ships", bob: 2.1 })));
  const apply = ({ P, groups }) => {
    const S = P.spec, hs = groups[H] ?? [];
    return (ps, t) => {
      const q = Math.min(1, Math.max(0, ps?.quake ?? S.quake ?? 0)), k = Math.min(1, Math.max(0, ps?.sink ?? S.sink ?? 0));
      const x = 0.03 * q * (Math.sin(t * 37.1) + 0.6 * Math.sin(t * 61.7 + 1.3)), y = 0.02 * q * Math.sin(t * 47.3 + 0.7), z = 0.015 * q * Math.sin(t * 29.9 + 2.1);
      for (const me of hs) me.position.set(x, y - 0.8 * k, z);
    };
  };
  return { pieces, M, o, apply };
}
const S35 = scene35();

// for the bench and the clip generators: the painter's cameras and "the floor point under plate pixel (px, py)" -> [x, 0, z]
export const CPLATE_CAMS = { "34": CAM34, "35": CAM35 };
export const floorAt = (key, px, py) => R(rig(CPLATE_CAMS[key]).g(px, py));
export const SCENES_34 = {
  "34": { file: "c-p34", clean: true, mask: true, size: [1536, 1024], cam: CAM34, grade: true, pieces: S34.pieces, tops: [[-9, -16, 1.5, 0.8, 0]] },
  "35": { file: "c-p35", clean: true, mask: true, size: [1536, 1024], cam: CAM35, grade: true, pieces: S35.pieces, tops: [[-8, -9, 2.0, 1.2, 0]], apply: S35.apply },
};
