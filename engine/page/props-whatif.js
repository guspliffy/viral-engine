import * as THREE from "three";
import { clamp } from "./util.js";
const SEAT_Y = 0.42;   // props3d.js SEAT_Y (not imported: props3d imports this file)

// "What if your friend could pause time?" (what if, episode 1, 8 Nov 2026): a summer park road.
//   parkclock  an old park clock on a post, cast iron painted bottle green with gold trim: a stepped plinth, a fluted
//              post with a collar, and a round two-faced clock head (white enamel dials, black hour marks and Roman XII,
//              III, VI, IX, black spade hands, a gold bezel, a glass that catches the light) with a little ball finial.
//              Potato scale: the dial's middle at spec.face (1.0 m), its radius spec.r (0.2). A winding crank on the
//              post's right side (+x) at spec.crankY (0.62), its knob spec.crankR (0.13) from the axle at x 0.11 (the
//              knob's middle at x 0.155): the crank turns about x with `spin` (turns; 0 = the knob straight up, + turns
//              the knob toward +z first).
//              Params: time (hours on the dial, 12.667 = 12:40; tween it to make the hands race), spin (crank turns).
//              Origin: the ground under the post; the dial faces +z (the other face -z).
//   parkbench  a long park bench for two (spec.w 2.0): five oak slats on cast-iron ends with a scroll, a two-slat back.
//              The seat at SEAT_Y (so "sit" with along works), facing +z.
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
function canvasTex(w, h, draw) { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }

// the enamel dial: warm white, a thin black ring, 60 minute ticks (every fifth long), Roman XII III VI IX
const dialTex = () => canvasTex(512, 512, (g, w) => {
  const c = w / 2;
  const grd = g.createRadialGradient(c, c * 0.9, 10, c, c, c); grd.addColorStop(0, "#fffaf0"); grd.addColorStop(1, "#efe4cc");
  g.fillStyle = grd; g.fillRect(0, 0, w, w);
  g.strokeStyle = "#1d1b20"; g.lineWidth = 7; g.beginPath(); g.arc(c, c, c * 0.93, 0, Math.PI * 2); g.stroke();
  g.lineWidth = 3; g.beginPath(); g.arc(c, c, c * 0.8, 0, Math.PI * 2); g.stroke();
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2, big = i % 5 === 0, r0 = big ? c * 0.8 : c * 0.86, r1 = c * 0.92;
    g.lineWidth = big ? 9 : 3; g.beginPath(); g.moveTo(c + Math.sin(a) * r0, c - Math.cos(a) * r0); g.lineTo(c + Math.sin(a) * r1, c - Math.cos(a) * r1); g.stroke();
  }
  g.fillStyle = "#1d1b20"; g.font = "bold 74px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle";
  for (const [txt, a] of [["XII", 0], ["III", 90], ["VI", 180], ["IX", 270]]) { const r = c * 0.62, ra = (a * Math.PI) / 180; g.fillText(txt, c + Math.sin(ra) * r, c - Math.cos(ra) * r); }
  g.fillStyle = "#b8862e"; g.beginPath(); g.arc(c, c, 16, 0, Math.PI * 2); g.fill();
});

// a spade hand (flat, pointing up its +y from the pivot)
function spadeHand(len, wid, m) {
  const s = new THREE.Shape();
  s.moveTo(-wid * 0.35, -len * 0.16); s.lineTo(-wid * 0.3, len * 0.62); s.quadraticCurveTo(-wid * 1.1, len * 0.76, 0, len);
  s.quadraticCurveTo(wid * 1.1, len * 0.76, wid * 0.3, len * 0.62); s.lineTo(wid * 0.35, -len * 0.16); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.006, bevelEnabled: false }); return new THREE.Mesh(g, m);
}

export const WHATIF_KINDS = {
  parkclock(P) {
    const S = P.spec, FY = S.face ?? 1.0, R = S.r ?? 0.2;
    const iron = mat(S.color || "#1f4a35", { roughness: 0.42, metalness: 0.35 }), gold = mat("#c99a3a", { roughness: 0.32, metalness: 0.75 });
    const ink = mat("#16141a", { roughness: 0.5 });
    // the plinth: three steps, then the post (a fluted column of 12 ribs) with a collar and a capital under the head
    mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.08, 24), iron, P.whole, 0, 0.04, 0);
    mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.07, 24), iron, P.whole, 0, 0.115, 0);
    mesh(new THREE.TorusGeometry(0.105, 0.012, 8, 24), gold, P.whole, 0, 0.155, 0).rotation.x = Math.PI / 2;
    const postTop = FY - R - 0.09, postH = postTop - 0.15;
    mesh(new THREE.CylinderGeometry(0.045, 0.06, postH, 12), iron, P.whole, 0, 0.15 + postH / 2, 0);
    for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; mesh(new THREE.CylinderGeometry(0.008, 0.01, postH * 0.92, 5), iron, P.whole, Math.sin(a) * 0.05, 0.15 + postH / 2, Math.cos(a) * 0.05); }
    mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.04, 18), iron, P.whole, 0, 0.15 + postH * 0.32, 0);
    mesh(new THREE.TorusGeometry(0.066, 0.008, 8, 20), gold, P.whole, 0, 0.15 + postH * 0.32 + 0.022, 0).rotation.x = Math.PI / 2;
    mesh(new THREE.CylinderGeometry(0.09, 0.05, 0.08, 18), iron, P.whole, 0, postTop + 0.02, 0);
    mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.08, 10), iron, P.whole, 0, postTop + 0.08, 0);
    // the head: a drum (two dials back to back), the gold bezels, the glass
    const head = new THREE.Group(); head.position.set(0, FY, 0); P.whole.add(head);
    const drum = mesh(new THREE.CylinderGeometry(R + 0.03, R + 0.03, 0.12, 40), iron, head); drum.rotation.x = Math.PI / 2;
    const dm = new THREE.MeshStandardMaterial({ map: dialTex(), roughness: 0.6 });
    dm.userData.noHatch = true;
    const hands = [];
    for (const side of [1, -1]) {
      const face = new THREE.Group(); face.position.z = side * 0.061; if (side < 0) face.rotation.y = Math.PI; head.add(face);
      const dial = mesh(new THREE.CircleGeometry(R, 48), dm, face); dial.position.z = 0.001;
      const bez = mesh(new THREE.TorusGeometry(R + 0.012, 0.016, 10, 48), gold, face); bez.position.z = 0.006;
      const hour = spadeHand(R * 0.55, 0.022, ink), min = spadeHand(R * 0.82, 0.016, ink);
      hour.position.z = 0.004; min.position.z = 0.011; face.add(hour, min);
      mesh(new THREE.SphereGeometry(0.013, 10, 8), gold, face, 0, 0, 0.018);
      // the glass: a faint shine, never solid to the checks (see-through, no depth)
      const glass = new THREE.Mesh(new THREE.CircleGeometry(R, 40), new THREE.MeshStandardMaterial({ color: "#ffffff", transparent: true, opacity: 0.08, roughness: 0.05, metalness: 0.2, depthWrite: false }));
      glass.position.z = 0.022; glass.castShadow = false; glass.userData.noOutline = true; face.add(glass);
      hands.push([hour, min]);
    }
    // the finial and the crown on top
    mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.05, 14), iron, head, 0, R + 0.05, 0);
    mesh(new THREE.SphereGeometry(0.035, 14, 10), gold, head, 0, R + 0.1, 0);
    // the winding crank on the post's right side (+x) at spec.crankY (0.62): a gold boss, an iron arm turning about x and
    // a turned wooden knob sticking out at its end (the hand closes round the knob: spec.crankR from the axle)
    const CY = S.crankY ?? 0.62, CR = S.crankR ?? 0.13;
    const crank = new THREE.Group(); crank.position.set(0.05, CY, 0); P.whole.add(crank);
    mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.05, 14), gold, crank, 0.025, 0, 0).rotation.z = Math.PI / 2;
    const arm = new THREE.Group(); arm.position.x = 0.06; crank.add(arm);
    mesh(new THREE.BoxGeometry(0.02, CR + 0.03, 0.03), iron, arm, 0, CR / 2, 0);
    mesh(new THREE.SphereGeometry(0.022, 10, 8), gold, arm, 0, 0, 0);
    const knob = mesh(new THREE.CylinderGeometry(0.02, 0.024, 0.07, 12), mat("#7a4a26", { roughness: 0.6 }), arm, 0.045, CR, 0); knob.rotation.z = Math.PI / 2;
    return {
      grip: FY,
      apply(ps) {
        const tm = ps.time ?? 12.667;
        for (const [h, m] of hands) { h.rotation.z = -((tm % 12) / 12) * Math.PI * 2; m.rotation.z = -(tm % 1) * Math.PI * 2; }
        arm.rotation.x = (ps.spin ?? 0) * Math.PI * 2;
      },
    };
  },

  parkbench(P) {
    const S = P.spec, Wd = S.w ?? 2.0;
    const oak = mat("#b07642", { roughness: 0.72 }), oak2 = mat("#9a6236", { roughness: 0.75 }), iron = mat("#2a2d33", { roughness: 0.45, metalness: 0.35 });
    for (let k = 0; k < 5; k++) mesh(new THREE.BoxGeometry(Wd, 0.03, 0.075), k % 2 ? oak2 : oak, P.whole, 0, SEAT_Y - 0.015, 0.17 - k * 0.085);
    for (let k = 0; k < 2; k++) mesh(new THREE.BoxGeometry(Wd, 0.085, 0.028), k % 2 ? oak2 : oak, P.whole, 0, SEAT_Y + 0.17 + k * 0.13, -0.25 - k * 0.02).rotation.x = -0.12;
    for (const x of [-Wd / 2 + 0.12, Wd / 2 - 0.12, ...(Wd > 1.6 ? [0] : [])]) {
      // a cast-iron end: front leg, back leg up into the back support, a seat rail and an armrest scroll
      mesh(new THREE.BoxGeometry(0.045, SEAT_Y, 0.05), iron, P.whole, x, SEAT_Y / 2, 0.16);
      const back = mesh(new THREE.BoxGeometry(0.045, SEAT_Y + 0.45, 0.05), iron, P.whole, x, (SEAT_Y + 0.45) / 2 - 0.02, -0.23); back.rotation.x = -0.1;
      mesh(new THREE.BoxGeometry(0.05, 0.04, 0.46), iron, P.whole, x, SEAT_Y - 0.05, -0.03);
      if (x !== 0) { const sc = mesh(new THREE.TorusGeometry(0.06, 0.014, 8, 18, Math.PI * 1.4), iron, P.whole, x, SEAT_Y + 0.12, 0.08); sc.rotation.y = Math.PI / 2; }
    }
    return { grip: 0 };
  },
};
