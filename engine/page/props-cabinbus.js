import * as THREE from "three";
import { clamp } from "./util.js";

// The cabin variant of the "bus" kind (props3d.js bus(P) calls cabinBus(P) when the spec has cabin: true; without it the old bus is
// built untouched). There's a catch EP10 "Laugh strength", DESIGN-STREET.md sections 1, 4 and 6 task 1. Every number is in bus-local
// metres at scale 1 (the clip scales the prop: 1.8 in the street part).
//
//   bus { cabin: true }   ORIGIN: on the ground at the middle of the front door, near side. The bus runs x -3.35 (rear) .. +0.55 (front,
//                         facing +x) and z 0 (near side) .. -1 (far side), y 0 .. 1.63. Same paint #F2B51F, white stripe, lamps, side
//                         route sign "10 CITY" and wheel look as the plain bus. Not held (grip 0). Params as the plain bus:
//     open    0..1 (default 0). The door's two clear leaves slide apart outside the near wall: at 1 the opening is a real hole 0.60 wide
//             (x -0.30 .. +0.30) and 1.18 high (y 0.26 .. 1.44). At 0 the leaves close it (clear glass, you still see in).
//     bulge   0..1.5 puffs the shell as before. (full, the squashed passengers, is not built in the cabin.)
//     The wheels turn with ps.x (propState, so "prop" x tweens turn them; a y lift does not).
//   Hollow shell, walls 0.03, interior x -3.32 .. 0.52, z -0.03 .. -0.97:
//     floor top y 0.26 "#4B4650"; ceiling (roof underside) y 1.57 "#F7F4EC"; underside panel "#2B2830" bottom at y 0.19.
//     Clear glass: tint "#CFE6F2", opacity 0.18, no outline, not solid. Side windows both sides y 0.87 .. 1.37 between 0.06 pillars
//     (near side posts flank the door), rear window y 0.87 .. 1.37, windscreen y 0.70 .. 1.42, z -0.06 .. -0.94.
//   Four wheels (near x -0.55 and -2.65, far side mirrored) r 0.26, tyre 0.16 wide, standing 0.14 proud of the wall, and an axle bar
//     (y 0.205, r 0.03, "#3A3640") per pair hanging 0.015 under the panel.
//   Underside (seen from below): panel y 0.19 .. 0.23; rails "#3A3640" 0.06 wide, 0.02 deep, along x at z -0.3 and -0.7; exhaust "#9AA3AD"
//     D0.04 along the far rail (z -0.76, x -3.28 .. -1.5). A flat clear patch x -1.5 .. -0.7, z -0.2 .. -0.8 around (-1.1, -0.5)
//     has no rail or pipe: the gloves lie on it (hold the bus up by the panel at y 0.19).
//   Front deck x 0.12 .. 0.53, z -0.03 .. -0.97, y 0.26 .. 0.62 "#3A3640"; one step 0.2 high (top y 0.46) at its door end: x -0.08 .. 0.12,
//     z -0.03 .. -0.5. Dash ledge x 0.36 .. 0.53, z -0.05 .. -0.50, top y 0.75. Ride Chip at [0.38, 0.75, -0.27], Wedge [0.30, 0.62, -0.66].
//   Front face: a second "10 CITY" sign 0.70 x 0.14 at y 1.50, z -0.5; two wing mirrors "#2D3340" on 0.12 stalks at the top corners
//     (z +0.12 and -1.12 at the tip, y 1.50).
//   Six seat backs on the far wall, 0.30 x 0.45 "#2F6FD1", tops y 1.05, x -2.9 .. -0.4 every 0.5 (my addition: a seat block "#2859A8"
//     0.26 deep, top y 0.50, under each, so they do not float).
//   SOLID: every wall, floor, deck, ledge, seat and the roof is a closed box, so qa/clear.mjs / contact checks see it as solid; the glass
//     is not (see-through under half opacity, as before). Riders stand on the floor / deck / ledge tops by their ride offsets;
//     a prop dropped on the cabin lands on those tops (the engine's surfaces are the visible meshes).
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...o });
const box = (m, parent, x0, x1, y0, y1, z0, z1) => {
  const o = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), m);
  o.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); o.castShadow = o.receiveShadow = true; parent.add(o); return o;
};
const sign = (w, h, cw, ch, fs, tx0) => {
  const c = document.createElement("canvas"); c.width = cw; c.height = ch; const x = c.getContext("2d");
  x.fillStyle = "#15161c"; x.fillRect(0, 0, cw, ch); x.fillStyle = "#ffae2b"; x.font = `900 ${fs}px sans-serif`; x.textBaseline = "middle"; x.fillText("10  CITY", tx0, ch * 0.54);
  const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tx }));
};

export function cabinBus(P) {
  const paint = mat("#f2b51f", { roughness: 0.45 }), white = mat("#f7f4ec", { roughness: 0.5 }), dark = mat("#2d3340", { roughness: 0.6 });
  const glass = mat("#cfe6f2", { roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.18, depthWrite: false }); glass.userData.noOutline = true;
  const tyre = mat("#22232a", { roughness: 0.9 }), hub = mat("#c9ccd3", { metalness: 0.4, roughness: 0.35 });
  const floorM = mat("#4b4650"), panelM = mat("#2b2830"), railM = mat("#3a3640"), pipeM = mat("#9aa3ad", { metalness: 0.4, roughness: 0.4 });
  const seatM = mat("#2f6fd1"), seatB = mat("#2859a8");
  const body = new THREE.Group(); P.whole.add(body);
  const X0 = -3.35, X1 = 0.55, D = 1.0, W = 0.03, XC = (X0 + X1) / 2;
  const ZN = -W, ZF = -D + W;                       // the inner faces of the near and far walls
  const IX0 = X0 + W, IX1 = X1 - W;                 // the inner faces of the rear and front walls
  const Y_FLOOR = 0.26, Y_WIN0 = 0.87, Y_WIN1 = 1.37, Y_ROOF = 1.57;
  const pane = (x0, x1, y0, y1, z0, z1) => { const g = box(glass, body, x0, x1, y0, y1, z0, z1); g.castShadow = false; g.receiveShadow = false; return g; };

  // ---- floor, underside, skirt, roof
  box(floorM, body, IX0, IX1, 0.23, Y_FLOOR, ZF, ZN);
  box(panelM, body, IX0, IX1, 0.19, 0.23, ZF, ZN);
  box(dark, body, X0 - 0.01, X1 + 0.01, 0.19, Y_FLOOR, 0.01, ZN);               // the skirt: four strips round the floor (the door's sill is its top)
  box(dark, body, X0 - 0.01, X1 + 0.01, 0.19, Y_FLOOR, ZF, -D - 0.01);
  box(dark, body, X0 - 0.01, IX0, 0.19, Y_FLOOR, -D - 0.01, 0.01);
  box(dark, body, IX1, X1 + 0.01, 0.19, Y_FLOOR, -D - 0.01, 0.01);
  box(white, body, X0 - 0.005, X1 + 0.005, Y_ROOF, 1.63, -D - 0.005, 0.005);    // the roof; its underside is the ceiling
  // rails along x at z -0.3 and -0.7, none across the clear patch x -1.5 .. -0.7, and the exhaust beside the far rail
  for (const z of [-0.3, -0.7]) for (const [a, b] of [[X0 + 0.1, -1.5], [-0.7, X1 - 0.1]]) box(railM, body, a, b, 0.17, 0.19, z - 0.03, z + 0.03);
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.78, 10), pipeM); pipe.rotation.z = Math.PI / 2; pipe.position.set(-2.39, 0.17, -0.76); pipe.castShadow = true; body.add(pipe);

  // ---- the two sides: a lower band, the window band between pillars, an upper band; the near side is cut by the door
  const pillars = (xs, z0, z1, doorSide) => {
    const list = [[X0 + 0.03, 0.06], ...xs.map((x) => [x, 0.06])];
    if (doorSide) list.push([-0.32, 0.04], [0.32, 0.04]);
    list.push([X1 - 0.03, 0.06]); list.sort((a, b) => a[0] - b[0]);
    for (const [x, w] of list) box(paint, body, x - w / 2, x + w / 2, Y_WIN0, Y_WIN1, z0, z1);
    for (let i = 0; i + 1 < list.length; i++) {
      const a = list[i][0] + list[i][1] / 2, b = list[i + 1][0] - list[i + 1][1] / 2;
      if (b > a + 0.01 && !(doorSide && a >= -0.3 - 1e-6 && b <= 0.3 + 1e-6)) pane(a, b, Y_WIN0, Y_WIN1, (z0 + z1) / 2 - 0.005, (z0 + z1) / 2 + 0.005);
    }
  };
  // near side (z -0.03 .. 0): the door opening x -0.3 .. 0.3, y 0.26 .. 1.44
  box(paint, body, X0, -0.3, Y_FLOOR, Y_WIN0, ZN, 0); box(paint, body, 0.3, X1, Y_FLOOR, Y_WIN0, ZN, 0);
  box(paint, body, X0, -0.3, Y_WIN1, Y_ROOF, ZN, 0); box(paint, body, 0.3, X1, Y_WIN1, Y_ROOF, ZN, 0);
  box(paint, body, -0.3, 0.3, 1.44, Y_ROOF, ZN, 0);                              // the header over the door
  pillars([-2.65, -2.15, -1.65, -1.15, -0.65], ZN, 0, true);
  box(white, body, X0 - 0.005, -0.3, 0.685, 0.755, -0.005, 0.015); box(white, body, 0.3, X1 + 0.005, 0.685, 0.755, -0.005, 0.015);   // the white stripe
  // far side (z -1 .. -0.97)
  box(paint, body, X0, X1, Y_FLOOR, Y_WIN0, -D, ZF); box(paint, body, X0, X1, Y_WIN1, Y_ROOF, -D, ZF);
  pillars([-2.65, -2.15, -1.65, -1.15, -0.65, -0.15, 0.35], -D, ZF, false);
  box(white, body, X0 - 0.005, X1 + 0.005, 0.685, 0.755, -D - 0.015, -D + 0.005);
  // rear (x -3.35 .. -3.32): a clear window between two posts, the red lamps outside
  box(paint, body, X0, IX0, Y_FLOOR, Y_WIN0, ZF, ZN); box(paint, body, X0, IX0, Y_WIN1, Y_ROOF, ZF, ZN);
  box(paint, body, X0, IX0, Y_WIN0, Y_WIN1, -0.06, ZN); box(paint, body, X0, IX0, Y_WIN0, Y_WIN1, ZF, -0.94);
  pane(X0 + 0.01, X0 + 0.02, Y_WIN0, Y_WIN1, -0.94, -0.06);
  // front (x 0.52 .. 0.55): the windscreen y 0.70 .. 1.42, z -0.06 .. -0.94
  box(paint, body, IX1, X1, Y_FLOOR, 0.70, ZF, ZN); box(paint, body, IX1, X1, 1.42, Y_ROOF, ZF, ZN);
  box(paint, body, IX1, X1, 0.70, 1.42, -0.06, ZN); box(paint, body, IX1, X1, 0.70, 1.42, ZF, -0.94);
  pane(X1 - 0.02, X1 - 0.01, 0.70, 1.42, -0.94, -0.06);
  const lamp = new THREE.MeshBasicMaterial({ color: "#fff3b0" }), red = new THREE.MeshBasicMaterial({ color: "#e0352b" });
  for (const z of [-0.12, -D + 0.12]) {
    const l = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 8), lamp); l.position.set(X1 + 0.01, 0.42, z); body.add(l);
    const r = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.12, 0.06), red); r.position.set(X0 - 0.01, 0.48, z); r.castShadow = r.receiveShadow = true; body.add(r);
  }
  // the route signs: the side one as before, a second on the front face (0.70 x 0.14, y 1.50)
  const side = sign(0.9, 0.17, 256, 48, 36, 12); side.position.set(-1.6, 1.47, 0.006); body.add(side);
  const front = sign(0.70, 0.14, 280, 56, 40, 12); front.rotation.y = Math.PI / 2; front.position.set(X1 + 0.006, 1.50, -0.5); body.add(front);
  // two wing mirrors on 0.12 stalks at the top corners
  for (const s of [1, -1]) {
    const z0 = s > 0 ? 0 : -D, st = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.12, 8), dark);
    st.rotation.x = Math.PI / 2; st.position.set(X1 - 0.04, 1.50, z0 + s * 0.06); st.castShadow = true; body.add(st);
    box(dark, body, X1 - 0.075, X1 - 0.005, 1.42, 1.58, z0 + s * 0.12 - 0.0125, z0 + s * 0.12 + 0.0125);
  }
  // ---- inside: the front deck with its step, the dash ledge, six seats against the far wall
  box(railM, body, 0.12, 0.53, Y_FLOOR, 0.62, ZF, ZN);
  box(railM, body, -0.08, 0.12, Y_FLOOR, 0.46, -0.5, ZN);
  box(railM, body, 0.36, 0.53, 0.62, 0.75, -0.5, -0.05);
  for (let k = 0; k < 6; k++) {
    const x = -2.9 + k * 0.5;
    box(seatB, body, x - 0.15, x + 0.15, Y_FLOOR, 0.50, ZF, -0.71);
    box(seatM, body, x - 0.15, x + 0.15, 0.60, 1.05, ZF, ZF + 0.05);
  }
  // ---- the door's two clear leaves (outside the near wall), slid apart by open
  const leaves = [-1, 1].map((s) => {
    const l = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1.14, 0.02), glass); l.position.set(s * 0.145, 0.85, 0.026); body.add(l);
    const k = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.06, 0.022), paint); k.position.set(0, 0.32, 0); l.add(k);
    return [s, l];
  });
  // ---- four wheels with dark arches on the walls, an axle bar per pair
  const wheels = [];
  for (const wx of [-0.55, -2.65]) {
    const ax = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.1, 10), railM); ax.rotation.x = Math.PI / 2; ax.position.set(wx, 0.205, -0.5); ax.castShadow = true; body.add(ax);
    for (const s of [1, -1]) {
      const zw = s > 0 ? 0 : -D;
      const arch = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.02, 24, 1, false, 0, Math.PI), dark); arch.rotation.set(Math.PI / 2, 0, Math.PI / 2); arch.position.set(wx, 0.26, zw + s * 0.002); body.add(arch);
      const w = new THREE.Group(); w.position.set(wx, 0.26, zw + s * 0.06); P.whole.add(w);
      const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.16, 24), tyre); tr.rotation.x = Math.PI / 2; tr.castShadow = tr.receiveShadow = true; w.add(tr);
      const hb = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.02, 16), hub); hb.rotation.x = Math.PI / 2; hb.position.z = s * 0.085; hb.castShadow = hb.receiveShadow = true; w.add(hb);
      for (let k = 0; k < 5; k++) { const n = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.03), dark); n.position.set(Math.cos(k * 1.2566) * 0.07, Math.sin(k * 1.2566) * 0.07, s * 0.1); w.add(n); }
      wheels.push(w);
    }
  }
  return {
    grip: 0,
    apply(ps) {
      const o = clamp(ps.open ?? 0), b = clamp(ps.bulge ?? 0, 0, 1.5);
      for (const [s, l] of leaves) l.position.x = s * (0.145 + 0.30 * o);
      body.scale.set(1 + 0.04 * b, 1 + 0.18 * b, 1 + 0.3 * b); body.position.y = -0.02 * b;
      const turn = -(ps.x ?? 0) / (0.26 * Math.max(ps.scale ?? 1, 0.01));
      for (const w of wheels) w.rotation.z = turn;
    },
  };
}
