import * as THREE from "three";
import { clamp } from "./util.js";
import { steamWisps } from "./steam.js";

// Props for "Compliments to the Chef" (Jonny's story library #09, 28 Oct 2026): Odin's pea soup, the Gunslinger's
// teaspoon and Odin's wooden ladle.
//   soupbowl  a pale-blue ceramic bowl of smooth pea-green soup with three tiny herb leaves. Origin = its bottom centre;
//             the soup's surface is at SOUP_Y. `steam` 0..1 curls a little steam off it. The tiny payoff lives here too:
//             spec.from = [x, y, z] (in the bowl's frame, before its scale) is where the drops leave (his mouth), and
//             `fall` 0..2 runs them: 0..1 the drops fall one after another into the soup, 1..2 their rings spread and
//             fade on the surface. Tween fall 0 -> 2 linearly (about 0.8 s: each drop falls in about 0.18 s).
//   spoon     a silver teaspoon: an oval bowl at +z, the handle toward -z. Origin = where the fist holds the handle's
//             end (grip "handle" = [0, 0, 0]). `fill` 0..1 is the trace of soup in its bowl (default 1, loaded).
//   ladle     a wooden cooking ladle held upright like a sceptre: the round cup on top (+y), the handle down.
//             Origin = where the fist holds the handle (grip "handle" = [0, 0, 0]).
export const SOUP_Y = 0.082;   // the soup's surface over the bowl's bottom
export const BOWL_R = 0.165;   // the rim's radius
export const DROPS = 4;        // drops in the tiny payoff
export const CHEF_GRIPS = {
  spoon: { handle: [0, 0, 0] },
  ladle: { handle: [0, 0, 0] },
};

const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.5, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }

// where drop i of DROPS lands on the soup (in the bowl's frame): a small cluster just in front of the centre, toward
// where they come from, so they never reach the rim
const landing = (from, i) => {
  const d = Math.hypot(from[0], from[2]) || 1, ux = from[0] / d, uz = from[2] / d, k = Math.min(0.06, d * 0.6);
  const sx = [0, 0.018, -0.016, 0.006][i % 4], sz = [0, -0.012, 0.01, 0.02][i % 4];
  return [ux * k + sx, SOUP_Y + 0.002, uz * k + sz];
};
// drop i's own progress 0..1 while it falls, and its ring's age 0..1 after it lands, from fall 0..2
const STAGGER = 0.12, FALL = 0.45, RING = 0.9;
export const dropPhase = (fall, i) => ({ u: clamp((fall - i * STAGGER) / FALL), ring: clamp((fall - i * STAGGER - FALL) / RING) });

export const CHEF_KINDS = {
  soupbowl(P) {
    const S = P.spec, china = mat(S.color ?? "#a9d0e6", { roughness: 0.32 }), inner = mat(S.inner ?? "#e9f3f8", { roughness: 0.3 });
    // a thick-walled lathe: foot ring, the outside rising to a rolled rim, the inside back down to a shallow well
    const prof = [[0, 0], [0.07, 0], [0.074, 0.006], [0.07, 0.014], [0.1, 0.02], [0.142, 0.05], [0.162, 0.084], [BOWL_R, 0.1], [0.163, 0.106], [0.156, 0.104],
      [0.148, 0.09], [0.128, 0.058], [0.09, 0.03], [0, 0.024]].map(([x, y]) => new THREE.Vector2(x, y));
    const outer = mesh(new THREE.LatheGeometry(prof.slice(0, 9), 56), china, P.whole); outer.material.side = THREE.DoubleSide;
    const well = mesh(new THREE.LatheGeometry(prof.slice(8), 56), inner, P.whole); well.material.side = THREE.DoubleSide; well.castShadow = false;
    // the soup: a smooth, opaque pea-green disc with a lighter swirl painted in, and three tiny herb leaves
    const tex = (() => {
      const c = document.createElement("canvas"); c.width = c.height = 256; const g = c.getContext("2d");
      const gr = g.createRadialGradient(118, 112, 10, 128, 128, 128); gr.addColorStop(0, S.soupHi ?? "#b9dc5a"); gr.addColorStop(0.7, S.soup ?? "#9cc63c"); gr.addColorStop(1, S.soupLo ?? "#86ad2e");
      g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
      g.strokeStyle = "rgba(230,245,170,0.35)"; g.lineWidth = 7; g.beginPath();
      for (let a = 0; a < 9; a += 0.1) { const r = 18 + a * 9; g.lineTo(128 + Math.cos(a) * r, 128 + Math.sin(a) * r * 0.9); } g.stroke();
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
    })();
    const soup = mesh(new THREE.CircleGeometry(0.148, 48), mat("#ffffff", { map: tex, roughness: 0.42 }), P.whole, 0, SOUP_Y, 0); soup.rotation.x = -Math.PI / 2; soup.castShadow = false;
    soup.material.userData.noOutline = true;
    const leafM = mat("#4f9a2e", { roughness: 0.5 });
    for (const [a, r, rot] of [[0.6, 0.012, 0.3], [2.6, 0.016, 2.2], [4.4, 0.014, 4.1]]) {
      const l = mesh(new THREE.SphereGeometry(0.014, 12, 8), leafM, P.whole, Math.cos(a) * r - 0.006, SOUP_Y + 0.002, Math.sin(a) * r);
      l.scale.set(1, 0.18, 0.55); l.rotation.y = rot; l.castShadow = false;
    }
    const steam = steamWisps(P.whole, SOUP_Y + 0.02);
    // the payoff's drops (opaque, rounded, soup-coloured) and their rings on the surface
    const from = S.from || [0, 0.3, 0.1], dropM = mat(S.soup ?? "#9cc63c", { roughness: 0.25 }), ringM = new THREE.MeshBasicMaterial({ color: "#e8f5b8", transparent: true, opacity: 0, depthWrite: false });
    ringM.userData.noOutline = true;
    const drops = [], rings = [];
    for (let i = 0; i < DROPS; i++) {
      const d = mesh(new THREE.SphereGeometry(0.015 * [1, 0.85, 0.75, 0.6][i], 14, 10), dropM, P.whole); d.castShadow = false; d.visible = false; drops.push(d);
      const r = mesh(new THREE.RingGeometry(0.8, 1, 32), ringM.clone(), P.whole, ...landing(from, i)); r.rotation.x = -Math.PI / 2; r.castShadow = false; r.visible = false; rings.push(r);
    }
    return {
      grip: 0,
      apply(ps, t) {
        steam(ps.steam, t);
        for (let i = 0; i < DROPS; i++) {
          const { u, ring } = dropPhase(ps.fall ?? 0, i), L = landing(from, i);
          // gravity: across at an even pace, down accelerating; stretched along the fall as it speeds up
          drops[i].visible = u > 0 && u < 1;
          drops[i].position.set(from[0] + (L[0] - from[0]) * u, from[1] + (L[1] - from[1]) * u * u, from[2] + (L[2] - from[2]) * u);
          drops[i].scale.set(1 - 0.15 * u, 1 + 0.5 * u, 1 - 0.15 * u);
          rings[i].visible = ring > 0 && ring < 1;
          const rr = 0.008 + 0.03 * Math.sqrt(ring); rings[i].scale.setScalar(rr); rings[i].material.opacity = 0.7 * (1 - ring);
        }
      },
    };
  },
  spoon(P) {
    const steel = mat(P.spec.color ?? "#d9dee6", { roughness: 0.22, metalness: 0.55 });
    // the handle: a flat, slightly tapered strip (its end inside the fist), then a narrow neck
    const pts = [[0, 0, -0.012], [0, 0.004, 0.03], [0, 0.012, 0.09], [0, 0.02, 0.125]].map((p) => new THREE.Vector3(...p));
    const h = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.0055, 8, false), steel, P.whole); h.scale.x = 1.6;
    // the bowl: a shallow oval cup, open side up
    const cup = mesh(new THREE.SphereGeometry(0.022, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), steel, P.whole, 0, 0.026, 0.15);
    cup.scale.set(1, 0.42, 1.45); cup.material.side = THREE.DoubleSide;
    const trace = mesh(new THREE.CircleGeometry(0.017, 24), mat("#9cc63c", { roughness: 0.35 }), P.whole, 0, 0.022, 0.15); trace.rotation.x = -Math.PI / 2; trace.scale.set(1, 1.4, 1); trace.castShadow = false;
    return { grip: 0, apply(ps) { const f = clamp(ps.fill ?? 1); trace.visible = f > 0.02; trace.scale.set(0.3 + 0.7 * f, 1.4 * (0.3 + 0.7 * f), 1); trace.position.y = 0.017 + 0.005 * f; } };
  },
  ladle(P) {
    const wood = mat(P.spec.color ?? "#b77a42", { roughness: 0.6 }), dark = mat("#8c5a2e", { roughness: 0.6 });
    // the handle runs from below the fist up to the cup; a little knob at its foot
    mesh(new THREE.CylinderGeometry(0.014, 0.017, 0.42, 14), wood, P.whole, 0, 0.08, 0);
    mesh(new THREE.SphereGeometry(0.02, 12, 10), dark, P.whole, 0, -0.13, 0);
    // the cup at the top: a deep round bowl on the handle's end, its opening facing the camera a little
    const cup = mesh(new THREE.SphereGeometry(0.06, 24, 14, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), wood, P.whole, 0, 0.33, 0.018);
    cup.rotation.x = 0.9; cup.material.side = THREE.DoubleSide;
    const lip = mesh(new THREE.TorusGeometry(0.06, 0.007, 8, 32), dark, P.whole, 0, 0.33, 0.018); lip.rotation.x = 0.9 - Math.PI / 2;
    return { grip: 0 };
  },
};
