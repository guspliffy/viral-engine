// Still Scrolling (Jonny's brief and storyboard, 25 Oct 2026): Phoenix sits on a round stool in a bright apartment,
// scrolling his phone. The Wizard (at home, no staff) gets an idea, crouches, grips the stool's rim, checks Phoenix's
// face and slides the stool out from under him. Phoenix's wings start beating just before the seat moves, he lifts a
// little to clear it and keeps hovering in the same seated posture, eyes on the phone. Cut wide: empty air under him,
// a soft shadow on the floor. The Wizard looks from the stool to Phoenix, lets go and straightens. A notification;
// Phoenix smiles and scrolls on. The Wizard's shoulders drop and he gives us a quiet, defeated look. End on that.
//
// Two cuts from one generator:
//   main  12.0 s, Jonny's brief exactly (no loop)
//   loop  14.8 s, the coordinator's optional ending (approved as an alternate): the Wizard sighs, slides the stool
//         back under Phoenix, Phoenix lands on it without looking up, the Wizard steps back to his first mark, so
//         the last frame leads into the first.
//
// Run: node storyboards/home/make-still-scrolling.mjs   -> storyboards/home/still-scrolling.json, still-scrolling-loop.json
import { writeFileSync } from "node:fs";

const r3 = (x) => Math.round(x * 1000) / 1000;

function build(variant) {
  const LOOP = variant === "loop";
  const items = [];
  const at = (t, it) => items.push({ ...it, at: r3(t) });
  const A = (t, who, what, o = {}) => at(t, { who, do: what, ...o });
  const prop = (t, id, set, dur = 0.3, ease = "inOut") => at(t, { do: "prop", id, set, dur, ease });
  const sfx = (t, s, o = {}) => at(t, { sfx: s, ...o });
  const arm = (t, who, side, pose, dur, ease) => A(t, who, "arm", { side, pose, dur, ...(ease && { ease }) });
  const captions = [];
  const cap = (from, to, text, pos, pop = false) => captions.push({ from: r3(from), to: r3(to), text, pos, pop });

  // ---------------------------------------------------------------- places (set-apartment.js APARTMENT)
  const STOOL0 = [-0.5, 0.06], STOOL1 = [0.22, 0.14];           // the stool slides right, a little toward us
  const WIZ0 = [0.55, 0.32];                                     // standing, screen right, a step in front of Phoenix
  const WIZ_GRIP = [0.5, 0.26];                                  // crouched at the stool's right side, a little in front
  const WIZ_END = [WIZ_GRIP[0] + STOOL1[0] - STOOL0[0], WIZ_GRIP[1] + STOOL1[1] - STOOL0[1]];   // stepped back with it
  const SEAT = 0.42 - 0.12, LIFT = 0.12;                         // Phoenix's seated root height, and how far he rises

  // eye targets (face look space: + right on screen, + up)
  const AT_PHONE = [0.03, -1], AT_CAM = [0, 0];
  const WIZ_AT_STOOL = [-0.75, -0.45], WIZ_AT_PHX = [-0.8, 0.12], WIZ_AT_STOOL_HOME = [-0.35, -0.5];

  // poses (character space). Phoenix holds the phone in both hands in front of his chest, palms in on its edges
  const PH_Y = 0.33, PH_Z = 0.44;
  const PHONE_R = { x: [-0.11, PH_Y, PH_Z], palm: [0, PH_Y, PH_Z] }, PHONE_L = { x: [0.11, PH_Y, PH_Z], palm: [0, PH_Y, PH_Z] };
  // the Wizard's hands on the seat's right edge from outside: his right hand at the back point, his left at the front
  // (points on the rim's outside edge, a hand's thickness out, just under the top: angle from +x toward the camera)
  const rimPt = (deg, r = 0.25 + RIM_OUT) => [r * Math.cos((deg * Math.PI) / 180), 0.39, r * Math.sin((deg * Math.PI) / 180)].map(r3);
  const RIM_OUT = Number(process.env.RIM_OUT ?? 0.05), RIM_A = (process.env.RIM_A ?? "-35,25").split(",").map(Number), RIM_SHAPE = process.env.RIM_SHAPE ?? "rim";
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
  A(0, "phx", "noblink");                                                          // placed blinks only, off the key beats
  for (const t of [1.95, 5.2, 7.0, 11.0]) A(t, "phx", "blink", { dur: 0.22 });
  A(0, "phx", "expr", { expr: "kind", set: { curve: 0.25, eye: 0.95 }, dur: 0.01 });
  A(0, "phx", "face", { lid: 0.42, dur: 0.01 });                                 // eyes down at the screen
  A(0, "wiz", "look", { to: WIZ_AT_PHX, dur: 0.01, blink: false });
  // the idea: eyes drop to the stool, one brow up, a sly smile
  A(0.35, "wiz", "look", { to: WIZ_AT_STOOL, dur: 0.3, blink: false });
  A(0.75, "wiz", "expr", { set: { raise: 0.05 }, dur: 0.15 });
  A(0.9, "wiz", "expr", { set: { smirk: 0.35, curve: 0.3 }, dur: 0.2 });
  A(0.75, "wiz", "still", { dur: 0.5, idle: 0.2 });
  // Phoenix scrolls: the right thumb lifts and flicks every second or so
  const scroll = (t) => { A(t, "phx", "grip", { side: "R", shape: "scroll", dur: 0.1 }); A(t + 0.16, "phx", "grip", { side: "R", shape: "hold", dur: 0.12 }); };
  for (const t of [0.4, 1.6, 2.9, 6.0, 7.1, 8.45, 9.3, 10.5, 11.4]) scroll(t);
  cap(0, 2.4, "That friend who never looks up.", 250);

  // ---------------------------------------------------------------- 2 THE IDEA 1.3-3.3
  A(1.3, "wiz", "move", { to: WIZ_GRIP, dur: 0.45, ease: "inOut", steps: 1 });
  A(1.3, "wiz", "turn", { to: -78, dur: 0.5 });
  A(1.65, "wiz", "crouch", { to: 1, dur: 0.4, ease: "out" });
  A(1.75, "wiz", "grip", { side: "both", shape: "open", dur: 0.2 });
  arm(1.8, "wiz", "R", RIM_R, 0.45, "out");
  arm(1.88, "wiz", "L", RIM_L, 0.45, "out");
  A(2.25, "wiz", "grip", { side: "both", shape: RIM_SHAPE, dur: 0.15 });
  sfx(2.3, "tink", { gain: 0.05 });
  // he checks Phoenix's face: eyes up, a beat, back to the stool
  A(2.45, "wiz", "look", { to: WIZ_AT_PHX, dur: 0.2, blink: false });
  A(2.45, "wiz", "still", { dur: 0.75, idle: 0.1 });
  A(3.05, "wiz", "look", { to: WIZ_AT_STOOL_HOME, dur: 0.2, blink: false });

  // ---------------------------------------------------------------- 3 REMOVE THE SEAT 3.3-5.5
  const LIFT_AT = 3.35, SLIDE_AT = 3.75, SLIDE_DUR = 1.25;
  A(LIFT_AT - 0.15, "phx", "span", { to: 0.45, dur: 0.3, ease: "out" });          // the wings open halfway (the Wizard is close)
  A(LIFT_AT, "phx", "fly", { to: { y: SEAT + LIFT }, dur: 0.45, ease: "inOut" });
  A(4.25, "phx", "span", { to: 1, dur: 0.6, ease: "inOut" });                     // and fully once the Wizard has backed off
  sfx(LIFT_AT, "wings", { gain: 0.32, dur: (LOOP ? 12.6 : 12.0) - LIFT_AT });
  prop(SLIDE_AT, "stool", { x: STOOL1[0], z: STOOL1[1] }, SLIDE_DUR, "inOut");
  A(SLIDE_AT, "wiz", "move", { to: WIZ_END, dur: SLIDE_DUR, ease: "inOut", steps: 3 });
  A(SLIDE_AT, "wiz", "look", { to: [-0.55, -0.4], dur: 0.3, blink: false });
  sfx(SLIDE_AT + 0.05, "scrape", { gain: 0.42, dur: SLIDE_DUR - 0.1 });

  // ---------------------------------------------------------------- 4 STILL THERE 5.5-7.3 (wide)
  A(5.15, "wiz", "still", { dur: 0.6, idle: 0.15 });
  A(5.6, "wiz", "look", { to: [-0.3, -0.45], dur: 0.25, blink: false });        // at the stool in his hands
  A(6.15, "wiz", "look", { to: [-0.8, 0.2], dur: 0.3, blink: false });          // up at the hovering Phoenix
  A(6.2, "wiz", "expr", { expr: "shocked", set: { open: 0.12, eye: 1.18, curve: -0.05 }, dur: 0.15 });
  A(6.2, "wiz", "still", { dur: 1.0, idle: 0.08 });

  // ---------------------------------------------------------------- 5 NO RESPONSE 7.3-9.7
  A(7.35, "wiz", "grip", { side: "both", shape: "open", dur: 0.15 });
  arm(7.45, "wiz", "R", "rest", 0.45, "inOut");
  arm(7.5, "wiz", "L", "rest", 0.45, "inOut");
  A(7.55, "wiz", "crouch", { to: 0, dur: 0.45, ease: "inOut" });
  A(7.6, "wiz", "turn", { to: -40, dur: 0.5 });
  sfx(8.0, "notify", { gain: 0.38 });
  A(8.12, "phx", "expr", { expr: "happy", set: { curve: 0.55, eye: 0.9 }, dur: 0.25 });
  A(8.2, "phx", "squash", { amount: 0.025, dur: 0.25 });
  A(9.05, "phx", "expr", { expr: "kind", set: { curve: 0.4, eye: 0.95 }, dur: 0.35 });   // eyes back on the screen
  A(8.0, "wiz", "look", { to: [-0.75, 0.1], dur: 0.2, blink: false });
  A(8.05, "wiz", "expr", { expr: "kind", set: { open: 0.05, eye: 1.08 }, dur: 0.3 });

  // ---------------------------------------------------------------- 6 DEFEATED 9.7-12.0
  A(9.7, "wiz", "macro_sigh", {});
  A(9.75, "wiz", "expr", { expr: "deadpan", set: { curve: -0.12 }, dur: 0.35 });
  A(9.75, "wiz", "face", { lid: 0.42, brow: -0.25, dur: 0.4 });
  arm(9.8, "wiz", "R", { o: [0.03, 0.2, 0.03] }, 0.5, "inOut");   // the shoulders drop: the arms hang lower and closer
  arm(9.8, "wiz", "L", { o: [0.03, 0.2, 0.03] }, 0.5, "inOut");
  A(10.1, "wiz", "turn", { to: -12, dur: 0.5 });
  A(10.2, "wiz", "look", { to: AT_CAM, dur: 0.35, blink: false });
  A(10.6, "wiz", "still", { dur: LOOP ? 0.5 : 1.4, idle: 0.1, sink: 0.012 });

  let END = 12.0;
  if (LOOP) {
    // ---------------------------------------------------------------- 7 (loop) PUT IT BACK 11.1-14.8
    A(11.1, "wiz", "look", { to: [-0.3, -0.5], dur: 0.3, blink: false });
    A(11.15, "wiz", "turn", { to: -78, dur: 0.4 });
    A(11.2, "wiz", "face", { lid: 0.2, brow: 0, dur: 0.3 });
    A(11.3, "wiz", "crouch", { to: 1, dur: 0.35, ease: "out" });
    A(11.3, "wiz", "grip", { side: "both", shape: "open", dur: 0.15 });
    arm(11.35, "wiz", "R", RIM_R, 0.4, "out");
    arm(11.4, "wiz", "L", RIM_L, 0.4, "out");
    A(11.72, "wiz", "grip", { side: "both", shape: RIM_SHAPE, dur: 0.12 });
    prop(11.85, "stool", { x: STOOL0[0], z: STOOL0[1] }, 1.1, "inOut");
    A(11.85, "wiz", "move", { to: WIZ_GRIP, dur: 1.1, ease: "inOut", steps: 3 });
    sfx(11.9, "scrape", { gain: 0.4, dur: 1.0 });
    A(13.0, "phx", "land", { to: SEAT, dur: 0.45, fold: 0.5 });
    sfx(13.42, "land", { gain: 0.08 });
    A(12.4, "phx", "span", { to: 0.45, dur: 0.4 });                                 // the Wizard comes close again
    A(13.5, "phx", "span", { to: 0, dur: 0.5 });
    A(13.5, "wiz", "grip", { side: "both", shape: "open", dur: 0.12 });
    arm(13.55, "wiz", "R", "rest", 0.35, "inOut");
    arm(13.58, "wiz", "L", "rest", 0.35, "inOut");
    A(13.6, "wiz", "crouch", { to: 0, dur: 0.35, ease: "inOut" });
    A(13.85, "wiz", "move", { to: WIZ0, dur: 0.45, ease: "inOut", steps: 1 });
    A(13.85, "wiz", "turn", { to: -35.5, dur: 0.45 });                // back to 3q-left
    A(13.95, "wiz", "expr", { expr: "kind", dur: 0.4 });
    A(13.95, "wiz", "face", { lid: 0, brow: 0, dur: 0.4 });
    A(14.0, "wiz", "look", { to: WIZ_AT_PHX, dur: 0.3, blink: false });
    A(14.3, "wiz", "still", { dur: 0.5, idle: 0.6 });
    A(13.3, "phx", "expr", { expr: "kind", set: { curve: 0.25, eye: 0.95 }, dur: 0.4 });
    END = 14.8;
  }

  // ---------------------------------------------------------------- shots
  const MED = { pos: [0.05, 1.05, 6.3], look: [0.05, 0.8, 0], fov: 36 };
  const SLIDE = { pos: [-0.12, 0.82, 5.6], look: [-0.1, 0.74, 0], fov: 36 };
  const SLIDE_TO = { pos: [0.06, 0.82, 5.6], look: [0.08, 0.74, 0], fov: 36 };
  const WIDE = { pos: [0.25, 1.35, 9.0], look: [0.25, 1.1, -0.2], fov: 36 };
  const PUSH = { pos: [0.33, 1.2, 7.8], look: [0.33, 1.0, -0.1], fov: 36 };
  const SHOTS = [
    ["absorbed", 0, MED, "hook"],
    ["the idea", 1.3, null],
    ["remove the seat", 3.3, { ...SLIDE, to: SLIDE_TO, dur: 1.9, ease: "inOut" }],
    ["still there", 5.5, WIDE],
    ["no response", 7.3, null],
    ["defeated", 9.7, { ...WIDE, to: PUSH, dur: 2.3, ease: "inOut" }],
  ];
  if (LOOP) { SHOTS[5][2] = { ...WIDE, to: PUSH, dur: 1.4, ease: "inOut" }; SHOTS.push(["put it back", 11.1, null, "escalation"], ["landing", 12.95, MED]); }

  // the sigh macro is expanded here (a beat item, not an action)
  for (const it of items) if (it.do === "macro_sigh") { delete it.do; it.macro = "sigh"; }
  items.sort((a, b) => a.at - b.at);
  const beats = SHOTS.map(([name, start, shot, kind], i) => {
    const end = SHOTS[i + 1]?.[1] ?? END;
    const mine = items.filter((x) => x.at >= start - 1e-6 && (i === SHOTS.length - 1 || x.at < end - 1e-6)).map((x) => ({ ...x, at: r3(x.at - start) }));
    return { name, at: start, len: r3(end - start), ...(shot && { shot }), do: mine, ...(kind && { kind }) };
  });
  const late = items.filter((x) => x.at >= END);
  if (late.length) throw new Error(`items after the end: ${JSON.stringify(late.slice(0, 3))}`);

  return {
    id: LOOP ? "still-scrolling-loop" : "still-scrolling",
    title: "Still Scrolling",
    idea: `Jonny's brief and storyboard, 25 Oct 2026${LOOP ? " + the loop ending (Wizard puts the stool back)" : ""}`,
    format: "one joke, one reversal: the prank fails because Phoenix never looks up",
    fps: 30, look: "anime-pro", profile: "short", loop: LOOP,
    cover: 6.6,
    creative: { length: [10, 16], maxEventGap: 2.6 },
    set: { type: "apartment", seed: 5 },
    music: false,
    sound: { sfx: 0.6, ambience: 0.22 },
    cast, props, captions, beats,
    allowClip: [
      { who: "phx", with: "stool", from: 0, to: 3.6, reason: "Phoenix sits on the stool (his legs rest over its edge)" },
      ...(LOOP ? [{ who: "phx", with: "stool", from: 13.2, to: END, reason: "Phoenix has landed back on the stool" }] : []),
    ],
    notes: "Generated by storyboards/home/make-still-scrolling.mjs. No dialogue; sound is room tone, a stool scrape, wings and one notification.",
  };
}

for (const v of ["main", "loop"]) {
  const sb = build(v);
  writeFileSync(new URL(`./${sb.id}.json`, import.meta.url), JSON.stringify(sb, null, 1) + "\n");
  console.log(`${sb.id}: ${sb.beats.reduce((s, b) => s + b.len, 0).toFixed(2)} s, ${sb.beats.length} beats`);
}
