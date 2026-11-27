// Legend ep 03 (Urashima Taro) design proof: twelve held stills, one per second. Not story: just the look.
//   node tools/svg2d/render.mjs tools/svg2d/scenes/legend-sea-proof.mjs out/sea.mp4 --stills 0.5,1.5,2.5,3.5,4.5,5.5,6.5,7.5,8.5,9.5,10.5,11.5 --dir out/sea
// 0 beach wide | 1 hosts + box (dialogue framing) | 2 dive, turtle + rider | 3 the palace far below | 4 palace hall, the gift
// 5 four-season wall | 6 his village then | 7 the village 300 years on, the grave | 8 age 0 / 0.5 / 1 + smoke
// 9 golden hour, hosts close | 10 the staff on the lid | 11 cast sheet | 12, 13 close two-shot preset (sunny, gold)
import * as L from "../lib/legend.mjs";
import * as SEA from "../lib/legend-sea.mjs";
const { blinkAmt } = L;
export const W = 1080, H = 1920, FPS = 30, DUR = 14;

function hosts(c, t, o = {}) {
  const B = SEA.BEACH;
  const kd = L.kid(c, { ...B.kid, ...(o.kidAt || {}), fx: 0.7, reachL: 0, shock: o.shock || 0, grin: o.grin || 0, talk: o.kidTalk || 0, blink: blinkAmt(t % 1, [0.9]) }, t);
  const kp = L.keeper(c, { ...B.keeper, ...(o.keeperAt || {}), fx: -0.7, stern: o.stern ?? 0.6, flame: o.flame ?? 0.7, talk: o.talk || 0 }, t);
  return o.kidFront ? kp.svg + (kp.arm || "") + kd.svg : kd.svg + kp.svg + (kp.arm || "");
}

export function draw(t) {
  L.resetIds(); SEA.resetIds();
  const k = Math.floor(t); let body = "";
  if (k === 0) {                 // the beach, wide
    SEA.mood(0); const c = SEA.BEACH.cam.wide, b = SEA.beach(c, t, { sun: [800, 190, 64] });
    body = b.back + SEA.box(c, { ...SEA.BEACH.box, worn: 1 }, t).svg + hosts(c, t) + b.front;
  } else if (k === 1) {          // hosts and the washed-up box, dialogue framing
    SEA.mood(0); const c = SEA.BEACH.cam.two, b = SEA.beach(c, t, { sun: [860, 250, 70] });
    body = b.back + hosts(c, t, { shock: 0.3, stern: 0.9 }) + SEA.box(c, { ...SEA.BEACH.box, worn: 1 }, t).svg;
  } else if (k === 2) {          // the dive
    SEA.mood(1); const c = SEA.DIVE.cam.main, d = SEA.dive(c, t, { depth: 0.3 });
    const tu = SEA.turtle(c, { X: -0.1, Y: 1.15, Z: 3.9, size: 1, dir: 1, pitch: 16, swim: 0.9 }, t);
    const ur = SEA.urashima(c, { ...tu.seat, ride: 1, fx: 0.75, shock: 0.5, bow: 10, look: 0.6 }, t);
    body = d.back + tu.svg + ur.svg + tu.front + d.front;
  } else if (k === 3) {          // the palace comes into view
    SEA.mood(1.25); const c = SEA.DIVE.cam.main, d = SEA.dive(c, t, { depth: 0.97, palace: 1 });
    const tu = SEA.turtle(c, { X: -0.9, Y: 3.1, Z: 8.5, size: 1, dir: 1, pitch: 24, swim: 2.2 }, t);
    const ur = SEA.urashima(c, { ...tu.seat, ride: 1, fx: 0.75, bow: 12 }, t);
    body = d.back + tu.svg + ur.svg + tu.front + d.front;
  } else if (k === 4) {          // the hall: the gift
    SEA.mood(2); const c = { x: 0.0, y: 1.45, z: 6.3, h0: 1130 }, h = SEA.palace(c, t, {});
    const ot = SEA.otohime(c, { X: 0.5, Y: 0, Z: 9.9, fx: -0.6, sad: 0.8, give: 1 }, t);
    const ur = SEA.urashima(c, { X: -0.5, Z: 9.8, fx: 0.75, reach: 0.8, sad: 0.4 }, t);
    body = h.back + ot.svg + ur.svg + SEA.box(c, { ...ot.hold, X: ot.hold.X - 0.02, held: true }, t).svg + h.front;
  } else if (k === 5) {          // the four seasons
    SEA.mood(2); body = SEA.seasons(SEA.SEASONS.cam.all, t, {});
  } else if (k === 6) {          // his village, then
    SEA.mood(0); const c = SEA.VILLAGE.cam.wide, vl = SEA.village(c, t, { era: 0, sun: [760, 200, 60] });
    const ur = SEA.urashima(c, { X: 0.3, Z: 5.6, fx: -0.75, rod: true, mino: true }, t);
    body = vl.back + ur.svg + vl.front;
  } else if (k === 7) {          // the same place 300 years on
    SEA.mood(3); const c = SEA.VILLAGE.cam.wide, vl = SEA.village(c, t, { sun: [760, 200, 56] });
    const ur = SEA.urashima(c, { ...SEA.VILLAGE.stand, fx: 0.75, sad: 1, reach: 1, bow: 8 }, t);
    body = SEA.wash(vl.back + ur.svg) + SEA.box(c, { ...ur.hold, held: true }, t).svg + SEA.wash(vl.front);
  } else if (k === 8) {          // one breath: age 0, 0.5, 1
    SEA.mood(3); const c = { x: 0.1, y: 1.0, z: 1.75, h0: 1130 }, b = SEA.beach(c, t, { boat: false, pines: false, sun: false });
    const men = [0, 0.5, 1].map((u, i) => SEA.urashima(c, { X: -0.86 + i * 0.74, Z: 4.6, age: u, fx: 0.75, reach: 1, shock: i === 1 ? 0.6 : 0, sad: i === 2 ? 1 : 0 }, t));
    body = SEA.wash(b.back + men.map((m) => m.svg).join(""));
    men.forEach((m, i) => { const bx = SEA.box(c, { ...m.hold, lid: [0, 0.7, 1][i], cord: [0, 1, 1][i], held: true }, t); body += bx.svg + SEA.smoke(c, { ...bx.mouth, amt: [0, 0.4, 1][i], rise: [0, 0.9, 2.2][i], spread: [0, 0.4, 0.62][i], drift: [0, 0.5, 0.75][i], seed: i + 2 }, t); });
  } else if (k === 9) {          // golden hour: the hosts
    SEA.mood(4); const c = SEA.BEACH.cam.faces, b = SEA.beach(c, t, { sun: [230, 760, 120], glitter: [230], boat: false });
    body = b.back + hosts(c, t, { stern: 1, shock: 0.6, flame: 1, kidAt: { X: -0.3 }, keeperAt: { X: 0.3 } });
  } else if (k === 10) {         // golden hour: the staff comes down on the lid (close-up, loose staff prop)
    SEA.mood(4); const c = SEA.BEACH.cam.box, b = SEA.beach(c, t, { sun: [200, 520, 130], glitter: [200], boat: false, pines: false, prints: false });
    const bx = SEA.box(c, { X: 0.08, Y: 0, Z: 4.0, size: 1.3, worn: 1, cord: 0.72, lid: 0.12 }, t);
    body = b.back + SEA.smoke(c, { ...bx.mouth, amt: 0.3, rise: 1.1, spread: 0.4, drift: -0.5, seed: 4 }, t) + bx.svg + SEA.staff(c, { ...bx.topW, Y: bx.topW.Y + 0.03, Z: 3.99, rot: 16, flame: 1 }, t);
  } else if (k === 12 || k === 13) {   // close two-shot preset, sunny and gold
    SEA.mood(k === 12 ? 0 : 4); const c = SEA.BEACH.cam.close, b = SEA.beach(c, t, k === 12 ? { sun: [860, 200, 70] } : { sun: [200, 700, 130], glitter: [200], boat: false });
    body = b.back + hosts(c, t, { stern: 0.8, shock: k === 12 ? 0.2 : 0.5, kidTalk: k === 12 ? 0.6 : 0, talk: k === 13 ? 0.6 : 0, flame: 1, kidFront: true, kidAt: SEA.BEACH.closeAt.kid, keeperAt: SEA.BEACH.closeAt.keeper });
  } else {                       // cast sheet
    SEA.mood(2);
    const c = { x: 0, y: 1.0, z: 1.75, h0: 1230 };
    body = `<rect width="${W}" height="${H}" fill="#f4ead8"/>`;
    body += SEA.otohime(c, { X: -0.52, Z: 4.2, fx: 0.6, sad: 0.5 }, t).svg + SEA.urashima(c, { X: 0.5, Z: 4.2, fx: -0.75, rod: true }, t).svg;
    const tu = SEA.turtle(c, { X: -0.1, Y: 2.5, Z: 4.2, size: 0.5, dir: 1, swim: 0.4 }, t); body += tu.svg + tu.front;
  }
  const k9 = Math.floor(t) === 11;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${SEA.defs()}${body}${k9 ? "" : SEA.grade() + SEA.vignette()}</svg>`;
}
