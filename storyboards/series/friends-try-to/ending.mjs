// "My friend group trying to…" series: the shared ending (series format, 4 Nov 2026,
// /mnt/project-files/video-scripts/2026-11-04-friends-try-to/00-SERIES-FORMAT.md). Every episode ends the same way:
//
//   T0      .. T0+0.8  WE DID IT   all four cheer: arms up, big grins, a little hop (the music's last bright bar)
//   T0+0.8 .. T0+1.8  THE TINY UNDO  Viking does one small, well-meant thing (the episode's `undo` callback) and it
//                                  undoes everything; the series sting "dö-döm" (ai/dundun) starts on it and the music
//                                  stops on its second hit ("döm")
//   T0+1.8 .. T0+2.8  THE GLARE   the other three turn their heads to Viking one after the other, annoyed; Viking
//                                  freezes with a sheepish grin, one hand rubbing the back of his head. Room tone only.
//
// T0 is on the storyboard's clock (before hit-stops). With two 3-frame hit-stops earlier in the clip, T0 = 7.0 lands
// the cheer at 7.2 s of video and the hard cut at exactly 10.0 (END = T0 + 2.8 = 9.8 story seconds).
//
//   import { ending } from "../ending.mjs";
//   const E = ending(c, {
//     T0: 7.0,
//     at: { wiz: [x, z], vik: [x, z], phx: [x, z], rea: [x, z] },   // where each one stands from T0 on (world, metres)
//     undo: (t) => { ... },              // the episode's undo, starting at t = T0 + 0.8 (Viking's action and its result)
//     sting: 0.15,                       // when the sting starts, after the undo starts (the moment it gives way)
//     arms: { wiz: ["R"], phx: ["L"] },  // which arms go up in the cheer (a hand holding something stays down)
//     cheerHop: ["vik", "phx"],          // who hops in the cheer
//     rub: "R",                          // Viking's hand that rubs the back of his head in the glare (false: none)
//     glareOrder: ["wiz", "phx", "rea"], // who turns first
//   });
//   E.musicStop  -> the "döm": put it in the storyboard's music block as `until`
//   E.end        -> T0 + 2.8 (the storyboard's END)
//   E.payoff     -> the undo's moment (mark that beat "payoff")
import { r3 } from "../../lib/clip.mjs";
import * as act from "../../lib/acting.mjs";

const UP = { o: [0.24, 1.0, 0.1] };   // an arm straight up in the cheer (o: out from the shoulder, up, forward)
const RUB = { o: [0.12, 0.98, -0.12] };   // a hand at the back of the head

// face look target (+ right on screen, + up) from a's place toward b's head, for a camera in front (+z)
function lookAt(a, b, up = 0.15) {
  const dx = b[0] - a[0], dz = b[1] - a[1];
  return [r3(Math.max(-0.95, Math.min(0.95, dx * 0.75))), r3(Math.max(-0.4, Math.min(0.5, up - dz * 0.12)))];
}
// a yaw (degrees, 0 = facing the camera) a share of the way toward b, so the face still reads
function yawTo(a, b, share = 0.55) {
  const deg = (Math.atan2(b[0] - a[0], b[1] - a[1]) * 180) / Math.PI;
  return r3(deg * share);
}

export function ending(c, { T0, at, undo, sting = 0.15, arms = {}, cheerHop = ["vik", "phx"], rub = "R", glareOrder = ["wiz", "phx", "rea"], glareShare = 0.55, ids = { wiz: "wiz", vik: "vik", phx: "phx", rea: "rea" }, glareSub = null }) {
  const { A, sfx, see } = c;
  const all = ["wiz", "vik", "phx", "rea"];
  // ---------------------------------------------------------------- WE DID IT
  for (const k of all) {
    const id = ids[k];
    A(T0, id, "expr", { expr: "delighted", dur: 0.18 });
    A(T0, id, "face", { lid: 0, brow: 0.25, dur: 0.18 });
    A(T0 + 0.02, id, "look", { to: [0, 0.35], dur: 0.12, blink: false });
    for (const s of arms[k] ?? ["R", "L"]) { c.arm(T0 + 0.03, id, s, UP, 0.18, "out"); A(T0 + 0.03, id, "grip", { side: s, shape: "fist", dur: 0.1 }); }
    if (cheerHop.includes(k)) A(T0 + 0.08, id, "hop", { count: 1, height: 0.1, dur: 0.42 });
    A(T0 + 0.3, id, "squash", { amount: 0.05, dur: 0.2 });
  }
  see(T0 + 0.1, T0 + 0.75, all.map((k) => `${ids[k]}.face`), "WE DID IT: all four cheering at the result");
  // arms come down as the undo starts (Viking's arm goes to the undo; the others' drop to rest)
  for (const k of all) for (const s of arms[k] ?? ["R", "L"]) if (k !== "vik") { c.arm(T0 + 0.85, ids[k], s, "rest", 0.3, "inOut"); A(T0 + 0.9, ids[k], "grip", { side: s, shape: "relaxed", dur: 0.2 }); }
  // ---------------------------------------------------------------- THE TINY UNDO
  const U = r3(T0 + 0.8);
  undo(U);
  const S = r3(U + sting);
  sfx(r3(S - 0.06), "dö-döm", { gain: 0.9, reason: "the series sting on the tiny undo (the same in every episode)" });
  const musicStop = r3(S + 0.58);   // the sting's second hit ("döm") is 0.64 s into the file
  // the three watch it go: shock
  for (const k of ["wiz", "phx", "rea"]) act.shock(c, r3(S + 0.08 + (k === "phx" ? 0.04 : k === "rea" ? 0.12 : 0)), ids[k], { open: k === "rea" ? 0.12 : 0.3, hold: 0.45 });
  // ---------------------------------------------------------------- THE GLARE
  const G = r3(T0 + 1.8);
  glareOrder.forEach((k, i) => {
    const id = ids[k], t = r3(G + i * 0.16);
    A(t, id, "look", { to: lookAt(at[k], at.vik), dur: 0.12, blink: false });
    A(t + 0.04, id, "turn", { to: yawTo(at[k], at.vik, glareShare), dur: 0.3, ease: "inOut" });
    act.mood(c, t + 0.08, id, "annoyed", { hold: 0.6 });
  });
  // Viking: frozen mid-gesture, then the sheepish grin and a hand to the back of his head
  act.sheepish(c, r3(G + 0.18), ids.vik);
  A(r3(G + 0.18), ids.vik, "look", { to: [0.1, 0.05], dur: 0.12, blink: false });
  if (rub) { c.arm(r3(G + 0.3), ids.vik, rub, RUB, 0.3, "inOut"); A(r3(G + 0.35), ids.vik, "grip", { side: rub, shape: "relaxed", dur: 0.2 }); }
  for (const tt of [G + 0.62, G + 0.78]) c.arm(r3(tt), ids.vik, rub || "R", { o: [RUB.o[0] + (tt === G + 0.62 ? 0.03 : 0), RUB.o[1], RUB.o[2]] }, 0.14, "inOut");
  see(r3(G + 0.5), r3(T0 + 2.75), all.map((k) => `${ids[k]}.face`), "THE GLARE: three annoyed faces turned to Viking, his sheepish grin");
  if (glareSub) c.cap(glareSub.from, glareSub.to, glareSub.text, glareSub.pos ?? 470, false, glareSub.o ?? {});
  return { cheer: T0, undo: U, sting: S, musicStop, glare: G, end: r3(T0 + 2.8), payoff: S };
}
