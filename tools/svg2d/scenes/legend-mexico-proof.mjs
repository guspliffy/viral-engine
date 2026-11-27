// Legend ep 02 (La Lechuza) design proof, 6 s, no sound: the adobe set from outside and inside, the owl's poses, the
// threat-driven colour. Not story: just the look.
//   node tools/svg2d/render.mjs tools/svg2d/scenes/legend-mexico-proof.mjs out/legend-mexico-proof.mp4 [--stills 0.9,2.3,3.2,4.0,4.85,5.5 --dir out/mx]
import * as L from "../lib/legend.mjs";
import * as MX from "../lib/legend-mexico.mjs";
const { lerp, clamp, tr, ease, blinkAmt } = L;
export const W = 1080, H = 1920, FPS = 30, DUR = 6.0;
const cam = (u, a, b, k = "inOut") => { const e = ease(u, k); return { x: lerp(a[0], b[0], e), y: lerp(a[1], b[1], e), z: lerp(a[2], b[2], e) }; };
const R = MX.HOUSE.roost, CUTS = [1.7, 3.3, 4.6];

function yard(c, t, o) {
  const kid = o.kid ? L.kid(c, { ...MX.HOUSE.kidSpot, blink: blinkAmt(t % 4.1, [1.1]), ...o.kid }, t).svg : "";
  const hs = MX.house(c, t, { open: o.open ?? 1, light: o.light ?? 1, inside: kid, salt: o.salt || 0 });
  return `<g filter="url(#haze)">${MX.sky(c, t, { moon: o.moon })}${MX.far(c)}</g>${MX.ground(c, t)}${MX.fog(c, t, [13])}${MX.mesquite(c, t)}${hs.svg}
    ${MX.clothesline(c, t)}${MX.nopal(c, { X: 2.75, Z: 7.1, seed: 2 })}${MX.nopal(c, { X: -4.6, Z: 8.6, seed: 5, size: 0.8 })}
    ${o.owl ? MX.lechuza(c, o.owl, t) : ""}${o.loose ? MX.feathers(c, o.loose) : ""}${MX.fog(c, t, [8.2, 6.4])}${o.near === false ? "" : MX.near(c, t)}${MX.grade()}${hs.glow}`;
}

export function draw(t) {
  L.resetIds(); MX.resetIds();
  let body;
  if (t < CUTS[0]) {                                   // 1. the yard: she sits on the roof, his face in the window
    const u = t / CUTS[0], c = cam(u, [-0.5, 1.75, 1.6], [-0.2, 1.8, 3.0]);
    MX.mood(lerp(0.0, 0.3, u));
    body = yard(c, t, { kid: { fx: 0.15, worry: 0.6 }, moon: [800, 360, 125],
      owl: { ...R, ...MX.owlPose("watch", "perch", ease(clamp((u - 0.35) / 0.4))), look: tr([[0, 0.8], [0.6, 0]], u), blink: blinkAmt(t, [0.45]) } });
  } else if (t < CUTS[1]) {                            // 2. inside: warm room, his hand to the latch, her hand on his sleeve
    const v = t - CUTS[0], u = v / (CUTS[1] - CUTS[0]), c = cam(u, [0.02, 1.3, 0.9], [0.22, 1.12, 1.75], "out");
    MX.mood(lerp(0.0, 0.55, ease(u)));
    const open = tr([[0.95, 0], [1.6, 0.42]], v);
    const out = MX.outside(c, t, { moon: [300, 500, 110] }) + MX.lechuza(c, { ...MX.ROOM.owlSpot, Y: -0.62, turn: 0, wide: 0.3, look: 0.4, shadow: false }, t);
    const rm = MX.room(c, t, { open, latch: tr([[0.35, 0], [0.9, 1, "back"]], v), outside: out });
    const kd = L.kid(c, { X: 0.4, Z: 4.2, fx: -0.75, reachL: tr([[0, 0.2], [0.4, 1]], v), tug: tr([[1.0, 0], [1.3, 1]], v), shock: tr([[1.1, 0], [1.4, 0.5]], v), blink: blinkAmt(v, [0.7]) }, t);
    const kp = L.keeper(c, { X: 0.92, Z: 3.85, fx: -0.7, stern: 1, open: 1, grab: tr([[0.7, 0], [1.2, 1, "back"]], v), flame: tr([[0, 0.9], [1.6, 0.45]], v), blink: blinkAmt(v, [0.3]) }, t, kd.sleeve);
    body = `${rm.back}${kd.svg}${kp.svg}${kp.arm}${rm.light}${rm.front}${MX.grade()}`;
  } else if (t < CUTS[2]) {                            // 3. close on her: the cry
    const v = t - CUTS[1], u = v / (CUTS[2] - CUTS[1]), c = { ...cam(u, [0.74, 4.18, 6.1], [0.78, 4.2, 6.45], "out"), h0: 1010 };
    MX.mood(1);
    const wail = clamp(tr([[0.1, 0], [0.4, 1, "out"], [1.3, 0.85]], v) + 0.08 * Math.sin(v * 26));
    body = yard(c, t, { near: false, light: 0.7, moon: [760, 520, 170], owl: { ...R, ...MX.owlPose("perch", "cry", wail), turn: tr([[0, 0.3], [0.35, 0]], v), look: 0, pupil: 0.42 } });
  } else {                                             // 4. salt on the sill: she flinches, and is gone; the warm comes back
    const v = t - CUTS[2], c = cam(v / 1.4, [0.25, 1.95, 2.6], [0.0, 2.3, 1.9]);
    MX.mood(tr([[0, 1], [0.35, 0.9], [1.3, -0.8]], v));
    const fl = tr([[0, 0], [0.16, 1, "back"]], v), go = clamp((v - 0.42) / 0.98), e = ease(go, "in");
    const pose = go <= 0 ? MX.owlPose("perch", "flinch", fl) : MX.owlPose("flinch", "flight", clamp(go * 4));
    const owl = { ...R, ...pose, X: R.X + e * -3.4, Y: R.Y + ease(go) * 5.2, Z: R.Z + e * 15, facing: go > 0.2 ? -1 : 1, lift: go > 0 ? Math.sin(v * 17) * 0.9 : pose.lift, look: -0.3, shadow: go <= 0 };
    const loose = v > 0.15 ? [0, 1, 2, 3].map((i) => { const q = v - 0.15 - i * 0.07; return { X: R.X - 0.5 + i * 0.36 + Math.sin(q * 3 + i) * 0.15, Y: R.Y + 1.5 + 0.2 * i - q * (0.7 + 0.12 * i), Z: R.Z - 0.1, rot: i * 70 + q * 160 * (i % 2 ? 1 : -1), size: 0.9 }; }).filter((f) => f.Y > 0.05) : [];
    body = yard(c, t, { kid: { fx: 0.1, shock: 0.5 * (1 - go), grin: go }, salt: 1, owl, loose, moon: [820, 300, 125] });
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${MX.defs()}${body}${MX.vignette()}</svg>`;
}
