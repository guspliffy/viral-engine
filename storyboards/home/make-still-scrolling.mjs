// Still Scrolling (Jonny's brief and storyboard, 25 Oct 2026): Phoenix sits on a round stool in a bright apartment,
// scrolling his phone. The Wizard (at home, no staff) gets an idea, crouches, grips the stool's rim, checks Phoenix's
// face and slides the stool out from under him. Phoenix's wings start beating just before the seat moves, he lifts a
// little to clear it and keeps hovering in the same seated posture, eyes on the phone. Cut wide: empty air under him,
// a soft shadow on the floor. The Wizard looks from the stool to Phoenix, lets go and straightens. A notification;
// Phoenix smiles and scrolls on. The Wizard's shoulders drop and he gives us a quiet, defeated look. End on that.
//
// Three cuts from one generator:
//   main  12.0 s, Jonny's brief exactly (no loop)
//   directed  the main cut with its camera directed from the story (engine/direct.mjs) instead of the hand-set shots:
//         medium two-shot, wide for the reveal, a snap-in on the payoff, a close-up with a push on the defeated look
//   loop  14.8 s, the coordinator's optional ending (approved as an alternate): the Wizard sighs, slides the stool
//         back under Phoenix, Phoenix lands on it without looking up, the Wizard steps back to his first mark, so
//         the last frame leads into the first.
//
// Run: node storyboards/home/make-still-scrolling.mjs   -> storyboards/home/still-scrolling.json, still-scrolling-loop.json
import { clip, write, r3 } from "../lib/clip.mjs";
import * as act from "../lib/acting.mjs";

function build(variant) {
  const LOOP = variant === "loop", DIRECTED = variant === "directed";
  const c = clip(), { A, prop, sfx, arm, cap, captions } = c;

  // ---------------------------------------------------------------- places (set-apartment.js APARTMENT)
  const STOOL0 = [-0.5, 0.06], STOOL1 = [0.16, 0.14];           // the stool slides right, a little toward us
  const WIZ0 = [0.55, 0.32];                                     // standing, screen right, a step in front of Phoenix
  const WIZ_GRIP = [0.5, 0.26];                                  // crouched at the stool's right side, a little in front
  const WIZ_END = [WIZ_GRIP[0] + STOOL1[0] - STOOL0[0], WIZ_GRIP[1] + STOOL1[1] - STOOL0[1]];   // stepped back with it
  const WIZ_STAND = [WIZ_END[0] - 0.2, WIZ_END[1] + 0.02];      // after letting go
  const SEAT = 0.42 - 0.12, LIFT = 0.12;                         // Phoenix's seated root height, and how far he rises

  // eye targets (face look space: + right on screen, + up)
  const AT_PHONE = [0.03, -1];
  const WIZ_AT_STOOL = [-0.75, -0.45], WIZ_AT_PHX = [-0.8, 0.12], WIZ_AT_STOOL_HOME = [-0.35, -0.5];

  // poses (character space). Phoenix holds the phone in both hands in front of his chest, palms in on its edges
  const PH_Y = 0.33, PH_Z = 0.44;
  const PHONE_R = { x: [-0.11, PH_Y, PH_Z], palm: [0, PH_Y, PH_Z] }, PHONE_L = { x: [0.11, PH_Y, PH_Z], palm: [0, PH_Y, PH_Z] };
  // the Wizard's hands on the seat's right edge from outside: his right hand at the back point, his left at the front
  // (points on the rim's outside edge, a hand's thickness out, just under the top: angle from +x toward the camera)
  const rimPt = (deg, r = 0.25 + RIM_OUT) => [r * Math.cos((deg * Math.PI) / 180), 0.39, r * Math.sin((deg * Math.PI) / 180)].map(r3);
  const RIM_OUT = Number(process.env.RIM_OUT ?? 0.05), RIM_A = (process.env.RIM_A ?? "-40,8").split(",").map(Number), RIM_SHAPE = process.env.RIM_SHAPE ?? "rim";
  const RIM_R = { prop: "stool", grip: rimPt(RIM_A[0]), palm: true }, RIM_L = { prop: "stool", grip: rimPt(RIM_A[1]), palm: true };

  const cast = [
    { id: "phx", character: "potatobrawl/phoenix", at: STOOL0, face: "camera", expr: "kind", follow: 0.3, seed: 1.7, span: 0, shadowFall: 1.6,   // wings folded; a soft shadow stays under the hover
      arms: { R: PHONE_R, L: PHONE_L }, grip: { R: "hold", L: "hold" } },
    { id: "wiz", character: "halloween/wizard-host", at: WIZ0, face: "3q-left", expr: "kind", follow: 0.5, seed: 2.6 },
  ];
  const props = [
    { id: "stool", kind: "stool", x: STOOL0[0], z: STOOL0[1] },
    { id: "phone", kind: "phone", x: STOOL0[0], y: 0.9, z: 0.45, rot: 180, tip: -28, scale: 1.9, case: "#7cc4bd" },
  ];

  // ---------------------------------------------------------------- 1 ABSORBED 0-1.3
  A(0, "phx", "sit", { seat: "stool", dur: 0.01, hands: "keep", feet: [0.38, 0.1] });   // legs out over the edge
  A(0, "phx", "grab", { prop: "phone", hand: "both", grip: [0, 0.035, 0], pose: null });
  A(0, "phx", "look", { to: AT_PHONE, dur: 0.01, blink: false });
  act.blinksAt(c, "phx", [1.95, 5.2, 7.0, 11.0]);                                  // placed blinks only, off the key beats
  A(0, "phx", "expr", { expr: "kind", set: { curve: 0.25, eye: 0.95 }, dur: 0.01 });
  A(0, "phx", "face", { lid: 0.42, dur: 0.01 });                                 // eyes down at the screen
  A(0, "wiz", "look", { to: WIZ_AT_PHX, dur: 0.01, blink: false });
  // the idea: eyes drop to the stool, one brow up, a sly smile
  act.idea(c, 0.25, "wiz", { at: WIZ_AT_STOOL });
  // Phoenix scrolls: the right thumb lifts and flicks every second or so
  act.scrollPhone(c, "phx", [0.1, 1.2, 2.5, 6.0, 7.1, 8.45, 9.3, 10.5, 11.4]);
  A(11.42, "phx", "squash", { amount: 0.02, dur: 0.25 });
  cap(0, 3.3, "That friend who never looks up.", 250);

  // ---------------------------------------------------------------- 2 THE IDEA 1.3-3.3
  A(1.3, "wiz", "move", { to: WIZ_GRIP, dur: 0.45, ease: "inOut", steps: 1 });
  A(1.3, "wiz", "turn", { to: -78, dur: 0.5 });
  A(1.65, "wiz", "crouch", { to: 0.8, dur: 0.4, ease: "out" });
  A(1.75, "wiz", "grip", { side: "both", shape: "open", dur: 0.2 });
  arm(1.8, "wiz", "R", RIM_R, 0.45, "out");
  arm(1.88, "wiz", "L", RIM_L, 0.45, "out");
  A(2.25, "wiz", "grip", { side: "both", shape: RIM_SHAPE, dur: 0.15 });
  sfx(2.3, "tink", { gain: 0.05 });
  // he checks Phoenix's face: eyes up, a beat, back to the stool
  act.checkOn(c, 2.45, "wiz", { at: WIZ_AT_PHX, back: WIZ_AT_STOOL_HOME });

  // ---------------------------------------------------------------- 3 REMOVE THE SEAT 3.3-5.5
  // the wings start beating just before the seat moves; the stool's slow start lets him rise clear before it travels
  const SLIDE_AT = 3.6, LIFT_AT = 3.64, SLIDE_DUR = 1.25;
  A(SLIDE_AT, "phx", "span", { to: 0.3, dur: 0.3, ease: "out" });                 // narrow beats while the Wizard is close
  A(LIFT_AT, "phx", "fly", { to: { y: SEAT + LIFT }, dur: 0.35, ease: "inOut" });
  A(4.45, "phx", "span", { to: 1, dur: 0.5, ease: "inOut" });                     // full once the Wizard has backed off
  sfx(3.6, "wings", { gain: 0.48, dur: (LOOP ? 13.95 : 12.0) - 3.6 });
  prop(SLIDE_AT, "stool", { x: STOOL1[0], z: STOOL1[1] }, SLIDE_DUR, "inOut");
  A(SLIDE_AT, "wiz", "move", { to: WIZ_END, dur: SLIDE_DUR, ease: "inOut", steps: 3 });
  A(SLIDE_AT, "wiz", "look", { to: [-0.55, -0.4], dur: 0.3, blink: false });
  sfx(SLIDE_AT + 0.05, "scrape", { gain: 0.42, dur: SLIDE_DUR - 0.1 });

  // ---------------------------------------------------------------- 4 STILL THERE 5.5-7.3 (wide)
  A(5.15, "wiz", "still", { dur: 0.6, idle: 0.15 });
  A(5.6, "wiz", "look", { to: [-0.3, -0.45], dur: 0.25, blink: false });        // at the stool in his hands
  A(6.15, "wiz", "look", { to: [-0.8, 0.2], dur: 0.3, blink: false });          // up at the hovering Phoenix
  A(6.15, "wiz", "turn", { to: -55, dur: 0.35 });                                  // toward us, so the shock reads (hands stay on the rim)
  act.shock(c, 6.2, "wiz");

  // ---------------------------------------------------------------- 5 NO RESPONSE 7.3-9.7
  A(7.0, "wiz", "turn", { to: -78, dur: 0.3 });                                   // back to the stool before letting go (the arms drop cleanly from there)
  A(7.35, "wiz", "grip", { side: "both", shape: "open", dur: 0.15 });
  arm(7.45, "wiz", "R", "rest", 0.45, "inOut");
  arm(7.5, "wiz", "L", "rest", 0.45, "inOut");
  A(7.55, "wiz", "crouch", { to: 0, dur: 0.45, ease: "inOut" });
  A(7.6, "wiz", "turn", { to: -40, dur: 0.5 });
  A(7.75, "wiz", "move", { to: WIZ_STAND, dur: 0.5, ease: "inOut", steps: 1 });   // a step in, the stool stays beside him
  sfx(8.0, "notify", { gain: 0.3 });
  // the only "response": a closed-eye grin at the screen, never at the Wizard
  act.grin(c, 8.12, "phx");                                                         // eyes back on the screen at 9.05
  A(8.0, "wiz", "look", { to: [-0.75, 0.1], dur: 0.2, blink: false });
  act.shock(c, 8.05, "wiz", { open: 0.18, eye: 1.2, curve: null, brow: 0.3, dur: 0.2 });

  // ---------------------------------------------------------------- 6 DEFEATED 9.7-12.0
  act.defeated(c, 9.7, "wiz", { hold: LOOP ? 1.0 : 1.4, blink: !LOOP });           // the loop cut gets up instead of the slow blink

  let END = 12.0;
  if (LOOP) {
    // ---------------------------------------------------------------- 7 (loop) PUT IT BACK 11.6-13.1, LANDING 13.1-14.8
    A(11.6, "wiz", "look", { to: [-0.3, -0.5], dur: 0.3, blink: false });
    A(11.6, "wiz", "turn", { to: -78, dur: 0.35 });
    A(11.6, "wiz", "move", { to: WIZ_END, dur: 0.3, ease: "inOut", steps: 1 });
    A(11.65, "wiz", "face", { lid: 0.2, brow: 0, dur: 0.3 });
    A(11.7, "wiz", "crouch", { to: 0.8, dur: 0.3, ease: "out" });
    A(11.7, "wiz", "grip", { side: "both", shape: "open", dur: 0.12 });
    arm(11.72, "wiz", "R", RIM_R, 0.35, "out");
    arm(11.76, "wiz", "L", RIM_L, 0.35, "out");
    A(12.05, "wiz", "grip", { side: "both", shape: RIM_SHAPE, dur: 0.1 });
    A(12.0, "phx", "span", { to: 0.3, dur: 0.4 });                                  // the Wizard comes close again
    prop(12.15, "stool", { x: STOOL0[0], z: STOOL0[1] }, 0.9, "inOut");
    A(12.15, "wiz", "move", { to: WIZ_GRIP, dur: 0.9, ease: "inOut", steps: 2 });
    sfx(12.2, "scrape", { gain: 0.4, dur: 0.8 });
    // he lets go first, then Phoenix settles onto the seat
    A(13.5, "phx", "land", { to: SEAT, dur: 0.45, fold: 0.5 });
    sfx(13.92, "land", { gain: 0.08 });
    A(13.95, "phx", "span", { to: 0, dur: 0.5 });
    A(13.45, "phx", "expr", { expr: "kind", set: { curve: 0.25, eye: 0.95 }, dur: 0.4 });
    A(13.15, "wiz", "grip", { side: "both", shape: "open", dur: 0.12 });
    arm(13.2, "wiz", "R", "rest", 0.3, "inOut");
    arm(13.22, "wiz", "L", "rest", 0.3, "inOut");
    A(13.25, "wiz", "crouch", { to: 0, dur: 0.3, ease: "inOut" });
    A(13.9, "wiz", "move", { to: WIZ0, dur: 0.4, ease: "inOut", steps: 1 });
    A(13.9, "wiz", "turn", { to: -35.5, dur: 0.4 });                // back to 3q-left
    A(13.95, "wiz", "expr", { expr: "kind", dur: 0.35 });
    A(13.95, "wiz", "face", { lid: 0, brow: 0, dur: 0.35 });
    A(14.05, "wiz", "look", { to: WIZ_AT_PHX, dur: 0.3, blink: false });
    A(14.35, "wiz", "still", { dur: 0.45, idle: 0.6 });
    END = 14.8;
  }

  // ---------------------------------------------------------------- shots
  const MED = { pos: [0.02, 0.97, 5.9], look: [0.02, 0.76, 0], fov: 36 };          // panel 01: Phoenix, stool and Wizard
  const SLIDE = { pos: [0.25, 0.85, 7.0], look: [0.25, 0.74, 0], fov: 36 };            // static: the seat leaving, both in frame
  const REVEAL = { pos: [0.15, 1.0, 7.6], look: [0.15, 0.8, -0.1], fov: 36 };          // wider: empty air under him, his shadow
  const PUSH = { pos: [0.1, 0.95, 7.0], look: [0.1, 0.8, 0], fov: 36 };              // the deadpan fills the frame (panel 06)
  const SHOTS = [
    ["absorbed", 0, MED, "hook"],
    ["the idea", 1.3, null],
    ["remove the seat", 3.3, SLIDE],
    ["still there", 5.5, REVEAL],
    ["no response", 7.3, null],
    ["defeated", 9.7, { ...REVEAL, to: PUSH, dur: 2.3, ease: "inOut" }],
  ];
  if (LOOP) { SHOTS[5][2] = { ...REVEAL, to: PUSH, dur: 1.6, ease: "inOut" }; SHOTS.push(["put it back", 11.6, REVEAL, "escalation"], ["landing", 13.1, MED]); }

  // the directed cut: the same acting, shots chosen from each beat's kind (the payoff gets its own beat at the notification)
  const DIRECT = [
    ["absorbed", 0, null, "hook"],
    ["the idea", 1.3, null],
    ["remove the seat", 3.3, null],
    ["still there", 5.5, null, "reveal"],
    ["no response", 7.3, "keep"],
    ["the notification", 8.0, null, "payoff"],
    ["defeated", 9.7, null, "reaction"],
  ];
  const beats = c.beats(DIRECTED ? DIRECT : SHOTS, END);

  return {
    id: LOOP ? "still-scrolling-loop" : DIRECTED ? "still-scrolling-directed" : "still-scrolling",
    title: "Still Scrolling",
    idea: `Jonny's brief and storyboard, 25 Oct 2026${LOOP ? " + the loop ending (Wizard puts the stool back)" : ""}`,
    format: "one joke, one reversal: the prank fails because Phoenix never looks up",
    fps: 30, look: "anime-pro", profile: "short", loop: LOOP,
    cover: 6.6,
    creative: { length: [10, 16], maxEventGap: 2.6 },
    set: { type: "apartment", seed: 5 },
    music: false,
    ...(DIRECTED && { direct: { master: MED } }),
    sound: { sfx: 0.6, ambience: 0.34 },
    cast, props, captions, beats,
    allowClip: [
      { who: "phx", with: "stool", from: 0, to: 3.6, reason: "Phoenix sits on the stool (his legs rest over its edge)" },
      ...(LOOP ? [{ who: "phx", with: "stool", from: 13.5, to: END, reason: "Phoenix has landed back on the stool" }] : []),
    ],
    notes: "Generated by storyboards/home/make-still-scrolling.mjs. No dialogue; sound is room tone, a stool scrape, wings and one notification.",
  };
}

for (const v of ["main", "loop", "directed"]) write(import.meta.url, build(v));
