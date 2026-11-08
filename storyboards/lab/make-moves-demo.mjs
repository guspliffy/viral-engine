// ENGINE TEST (8 Nov 2026, X formats review upgrades 3 + 5): the clip template's example with the new moves and
// overlays, written twice from one timeline so the before/after differ only in them:
//   moves-demo-before.json  the template example as the engine made it before (a slow push on the reaction, no HUD)
//   moves-demo-after.json   + a series HUD (day, a clock that jumps on, Phoenix's battery dropping on every scroll),
//                           a freeze frame with a name tag and a record scratch, a speed ramp on the payoff, a dolly
//                           zoom on the Wizard's realisation, a rule card and the comment-vote end card
// A pure engine test: no Fable review (CLAUDE.md, "Skip the reviews only for pure engine tests").
//   node storyboards/lab/make-moves-demo.mjs
import { clip, write } from "../lib/clip.mjs";
import * as act from "../lib/acting.mjs";
import { freeze, ramp } from "../lib/camera.mjs";
import { hud, rule, vote } from "../lib/overlay.mjs";

const END = 9.6;
const PHX = [-0.5, 0.06], WIZ0 = [0.62, 0.3], WIZ_NEAR = [0.5, 0.32];
const AT_PHONE = [0.03, -1], WIZ_AT_PHX = [-0.8, 0.12];
const MED = { pos: [0.1, 0.97, 5.9], look: [0.1, 0.76, 0], fov: 36 };
const SCROLLS = [0.1, 1.3, 2.6, 4.0, 5.2, 6.4, 7.6];

function build(after) {
  const c = clip({ faces: "strong", lines: { sub: true, blink: false } }), { A, sfx, cap, see } = c;
  const cast = [
    { id: "phx", character: "potatobrawl/phoenix", at: PHX, face: "camera", expr: "kind", follow: 0.3, seed: 1.7, span: 0,
      arms: { R: { x: [-0.11, 0.33, 0.44], palm: [0, 0.33, 0.44] }, L: { x: [0.11, 0.33, 0.44], palm: [0, 0.33, 0.44] } }, grip: { R: "hold", L: "hold" } },
    { id: "wiz", character: "halloween/wizard-host", at: WIZ0, face: "3q-left", expr: "kind", follow: 0.5, seed: 2.6 },
  ];
  const props = [
    { id: "stool", kind: "stool", x: PHX[0], z: PHX[1] },
    { id: "phone", kind: "phone", x: PHX[0], y: 0.9, z: 0.45, rot: 180, tip: -28, scale: 1.9, case: "#7cc4bd" },
  ];

  // 1 HOOK 0-2.0: Phoenix on the phone, the Wizard watching (freeze-frame name tag on Phoenix at 0.6)
  A(0, "phx", "sit", { seat: "stool", dur: 0.01, hands: "keep", feet: [0.38, 0.1] });
  A(0, "phx", "grab", { prop: "phone", hand: "both", grip: [0, 0.035, 0], pose: null });
  A(0, "phx", "look", { to: AT_PHONE, dur: 0.01, blink: false });
  A(0, "phx", "face", { lid: 0.42, dur: 0.01 });
  act.blinksAt(c, "phx", [2.9, 6.6]);
  act.scrollPhone(c, "phx", SCROLLS);
  A(0, "wiz", "look", { to: WIZ_AT_PHX, dur: 0.01, blink: false });
  act.blinksAt(c, "wiz", [1.7, 3.95]);
  // the HUD's chips take the top corners: the hook caption goes a line lower
  cap(0, 2.6, "When your friend gets a new phone.", after ? 316 : 250);
  see(0, 2.0, ["phx.face", "wiz.face", "phone"], "the problem at frame 0: Phoenix on the phone, the Wizard watching");
  act.opener(c, "phx", "ooh, nice!", { words: false });
  if (after) freeze(c, 0.6, 1.1, { on: "phx", label: "PHOENIX", sub: "“one more video”", who: "phx", scratch: 0.45 });

  // 2 TRY 2.0-4.0: he steps in and waits to be seen (the clock jumps on two hours)
  A(2.0, "wiz", "move", { to: WIZ_NEAR, dur: 0.45, ease: "inOut", steps: 1 });
  act.checkOn(c, 2.6, "wiz", { at: WIZ_AT_PHX, back: WIZ_AT_PHX, hold: 1.0 });
  see(2.6, 3.6, ["wiz.face"], "the Wizard waits to be seen");

  // 3 PAYOFF 4.0-5.6: Phoenix grins, at the phone (slow motion through the grin and the Wizard's shock)
  sfx(4.0, "notify", { gain: 0.3 });
  act.grin(c, 4.1, "phx");
  act.shock(c, 4.2, "wiz", { open: 0.18, eye: 1.2, curve: null, brow: 0.3, dur: 0.2, hold: 1.0 });
  see(4.1, 4.8, ["phx.face", "phone"], "Phoenix's grin is at the phone");
  if (after) ramp(c, 4.0, 0.8, 0.35, { in: 0.2, out: 0.3 });

  // 4 REACTION 5.6-7.4: the Wizard's defeated look (a dolly zoom: the room closes in on him), the rule
  act.defeated(c, 5.6, "wiz", { hold: 0.3, blink: false });
  see(5.8, 7.0, ["wiz.face"], "the Wizard's defeated look");
  if (after) rule(c, 6.3, 1.1, "RULE 1", "Never compete with a new phone.", { who: "wiz", y: 300 });

  // 5 VOTE 7.4-END: what next, then the loop tail
  if (after) vote(c, 7.4, END - 7.4, "PART 2: how does Wizard get noticed?", [["A", "Hide the charger", "wiz"], ["B", "Wait for 0%", "phx"]], { y: 300 });
  act.backToStart(c, 8.8, END, cast.filter((m) => m.id === "wiz"), { wiz: WIZ_AT_PHX });

  const beats = c.beats([
    ["hook", 0, null, "hook"],
    ["try", 2.0, null],
    ["payoff", 4.0, null, "payoff"],
    ["reaction", 5.6, { who: "wiz" }, after ? "realize" : "reaction"],
    ["vote", 7.4, null],
    ["back to the start", 8.8, null],
  ], END);

  // Phoenix's phone: 23 % and a drop on every scroll; DEAD on the last one
  const HUD = hud({
    day: 3,
    clock: [[0, "21:47"], [2.2, "23:58", 0.6]],
    battery: [[0, 23], ...SCROLLS.slice(1).map((t, i) => [t, [17, 12, 6, 3, 1, 0][i], 0.1])],
  });

  return {
    id: after ? "moves-demo-after" : "moves-demo-before",
    title: after ? "Moves demo: after" : "Moves demo: before",
    idea: "The clip template's example with the new HUD, cards, freeze frame, speed ramp and dolly zoom (after) or without (before)",
    seed: "moves-demo",   // one music bed for both
    fps: 30, look: "anime-pro", profile: "short", loop: true, captionStyle: "kinetic",
    castLook: "sheet", cleanStart: true,
    motion: { feet: 2, overlap: true, timing: true, solve: true },
    rig: { hand: 2, eyes: 2, hold: 2 },
    physics: true, animeTiming: true, loopIdle: true,
    set: { type: "plain", color: "#efe2c8", floor: "#c9a27a", light: "golden", para: 0, bloom: "emissive",
      plate: { src: "assets/plates/livingroom-golden.png", z: -2.3, center: [0.3, 1.7], height: 6.4 },
      aperture: 0, lighting: 2, hatch: { boil: 0.25 }, life: "auto", cel: { at: 0.25 } },
    music: { style: "warm", lowCut: 150, gain: 0.3 },
    direct: { master: MED },
    sound: { sfx: 0.6, ambience: 0.34, guard: true },
    hook: { show: ["phx", "wiz", "phone"], hint: 0, what: "the Wizard stares at Phoenix, who only sees his phone" },
    ...(after && { hud: HUD }),
    cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
    allowClip: [{ who: "phx", with: "stool", from: 0, to: END, reason: "Phoenix sits on the stool (his legs rest over its edge)" }],
    notes: "Generated by storyboards/lab/make-moves-demo.mjs (engine test, no creative review).",
  };
}

write(import.meta.url, build(false));
write(import.meta.url, build(true));
