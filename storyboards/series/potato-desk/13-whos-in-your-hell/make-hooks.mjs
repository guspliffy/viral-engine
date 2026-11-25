// Potato Desk 13 "Who's in your hell?": HOOK OPTIONS as short clips (Jonny 25 Nov 2026: he watches hook options as
// clips, not on paper). Four openings of about 5-7 s each, on a ROUGH set: the Potato Desk 09 hell lobby with a plain
// couch (the episode's own waiting room is designed after his outline OK and the panel sheet, docs/rules/images.md).
//   node storyboards/series/potato-desk/13-whos-in-your-hell/make-hooks.mjs   -> desk13-hook-h1..h4.json
// His hook pattern (25 Nov): power word -> a question of ~5 words -> the rule -> (story) -> fast end. 8-line rule
// line 2/8: the plain-English label at 0 s is laid on afterwards with ffmpeg (as the hell reviews YT cut), not here.
//   H1* pattern straight: "Welcome to HELL." / "Who's in my hell?" / "One rule. Forever... with everyone who ever annoyed you."
//   H2  cold open (type B): 1.5 s of the full couch at its worst, then the H1 lines
//   H3  question first: "Who's in my HELL?" / "Everyone who ever annoyed you. Forever." (he points at the empty seats)
//   H4  series opener first: "In hell, there's one rule." / "Forever... with everyone who ever annoyed you." / "Who's in mine?"
// No names in any line. Voices 20 % faster (*-x12 recipes).
import { clip, write, r3 } from "../../../lib/clip.mjs";
import * as act from "../../../lib/acting.mjs";
import { HOOK_LINES as L } from "./hook-lines.mjs";

// measured spoken lengths (node qa/lines.mjs desk13-hook-probe.json); estimates until measured
const DUR = JSON.parse(process.env.HOOK_DUR ?? "null") ?? {
  welcome: 1.0, who: 0.9, whoLoud: 0.9, whoMine: 0.8, rule: 2.6, ruleOpen: 1.2, ruleForever: 2.0, everyone: 1.9, spoil: 0.9, stop: 0.5,
};

const COUCH = [0, -0.45], CSC = 1.3;              // a plain couch for two, scaled to 2.1 m (rough stand-in for the waiting room)
const SPUD_ALONG = -0.42;                         // the hero at the left end: the empty seats on his right are the stake
const DEV = [0.98, 0.42], DEV_YAW = -35;
const SPUD_AT_DEV = [0.7, 0.25], DEV_AT_SPUD = [-0.7, -0.1], AT_US = [0, 0.05], AT_SEATS = [0.2, -0.45];
const PARK = { chip: [-30, 5], wedge: [-34, 5], mash: [-38, 5] };

function build(H) {
  const c = clip({ faces: "strong", lines: { sub: false, blink: false } }), { A, sfx, cap, see } = c;
  const SUB = 470;
  const say = (k, at, extra = {}) => {
    const [who, line, tone, style, o = {}] = L[k];
    c.macro(r3(at), who, "say", { line, tone, style, ...o, dur: DUR[k], caption: false, ...extra });
    cap(r3(at), r3(at + DUR[k] + 0.25), line, SUB, false, { size: 64 });
    return r3(at + DUR[k]);
  };
  const arm = (t, who, side, pose, dur = 0.3, ease = "inOut") => A(t, who, "arm", { side, pose, dur, ease });
  const grip = (t, who, side, shape, dur = 0.2) => A(t, who, "grip", { side, shape, dur });
  const look = (t, who, to, dur = 0.2) => A(t, who, "look", { to, dur });
  const expr = (t, who, e, dur = 0.2) => A(t, who, "expr", { expr: e, dur });
  const shots = [];
  const shot = (name, t, cam, kind) => { shots.push([name, r3(Math.round(t * 15) / 15), cam, kind].filter((v) => v !== undefined)); return r3(Math.round(t * 15) / 15); };

  const cold = H === "h2";
  const cast = [
    { id: "spud", character: "potatobrawl/spud", at: COUCH, face: 0, expr: "worried", follow: 0.3, seed: 1.1 },
    { id: "devil", character: "potatobrawl/devil", at: DEV, face: DEV_YAW, expr: "delighted", follow: 0.3, seed: 6.6 },
    { id: "chip", character: "potatobrawl/chip", at: PARK.chip, face: 0, expr: "kind", follow: 0.3, seed: 2.3 },
    { id: "wedge", character: "potatobrawl/wedge", at: PARK.wedge, face: 0, expr: "smug", follow: 0.3, seed: 3.1 },
    { id: "mash", character: "potatobrawl/mash", at: PARK.mash, face: 0, expr: "smug", follow: 0.3, seed: 4.1 },
  ];
  const at3 = (x, y, z) => ({ x, y, z });
  const props = [
    { id: "room", staged: "the lobby shell", kind: "lobbyroom", ...at3(0, 0, 0) },
    { id: "window", staged: "set in the back wall", kind: "curtainwindow", ...at3(-1.60, 0, -1.30), open: 1 },
    { id: "island", staged: "far outside the window: heaven, out of reach", kind: "heavenisland", ...at3(-1.90, 1.40, -4.6), scale: 1.6 },
    { id: "rock", staged: "far backdrop", kind: "rockshaft", ...at3(-2.2, 1.0, -9) },
    { id: "exit", staged: "set in the back wall: the door the others come through", kind: "exitdoor", ...at3(1.10, 0, -1.30), leaf: "#5a1f1c" },
    { id: "tub", staged: "stands on the floor", kind: "lavatub", ...at3(-1.70, 0, 0.75), glow: 1 },
    { id: "couch", staged: "stands on the floor", kind: "couch", ...at3(COUCH[0], 0, COUCH[1]), rot: 0, scale: CSC, color: "#7a2a2a", color2: "#923834" },
  ];

  // everyone in their place at 0
  A(0, "spud", "sit", { seat: "couch", along: cold ? -0.05 : SPUD_ALONG, dur: 0.01, hands: "lap", feet: [0.32, 0.1] });
  for (const k of ["chip", "wedge", "mash"]) A(0, k, "hide");
  look(0, "spud", SPUD_AT_DEV, 0.01); look(0, "devil", DEV_AT_SPUD, 0.01);
  let t = 0;

  // ---- H2 cold open: the couch at its worst for 1.5 s (chewer in his ear, phone pings, the spoiler over his shoulder)
  if (cold) {
    A(0, "chip", "show"); A(0, "wedge", "show"); A(0, "mash", "show");
    A(0, "chip", "sit", { seat: "couch", along: 0.50, dur: 0.01, hands: "lap", feet: [0.30, 0.1] });
    A(0, "wedge", "sit", { seat: "couch", along: -0.62, dur: 0.01, hands: "lap", feet: [0.34, 0.1] });
    A(0, "mash", "move", { to: [-0.25, -1.08], dur: 0.01, ease: "linear", sync: true });
    look(0, "chip", [-0.6, 0], 0.01); look(0, "wedge", [0.4, -0.3], 0.01); look(0, "mash", [0.2, -0.4], 0.01);
    expr(0, "spud", "angry", 0.01);
    for (const s of [0.05, 0.35, 0.62, 0.9, 1.2]) sfx(s, "kenney/impact-plank-light", { gain: 0.35 });   // crunch stand-in (rough)
    for (const s of [0.2, 0.55, 0.95]) sfx(s, "notify", { gain: 0.4 });
    shot("cold open", 0, { pos: [0, 1.05, 5.4], look: [0, 0.72, -0.4], fov: 32, to: { pos: [0, 1.0, 4.9] }, dur: 1.6, ease: "linear" }, "hook");
    say("spoil", 0.15); t = say("stop", 1.1);
    see(0, 1.5, ["spud.face", "chip", "wedge", "mash"], "the couch at its worst");
    t = shot("welcome", r3(t + 0.15), null);
    for (const k of ["chip", "wedge", "mash"]) A(r3(t - 0.02), k, "hide");
    A(r3(t - 0.02), "spud", "sit", { seat: "couch", along: SPUD_ALONG, dur: 0.01, hands: "lap", feet: [0.32, 0.1] });
    expr(r3(t - 0.02), "spud", "worried", 0.01);
  }

  const WIDE = { pos: [0.25, 1.25, 7.2], look: [0.25, 0.78, -0.2], fov: 30 };
  const push = (cam, dur, k = 0.07) => ({ ...cam, to: { pos: cam.pos.map((p, j) => r3(p + (cam.look[j] - p) * k)) }, dur, ease: "linear" });
  const SPUD_CU = { pos: [-0.35, 0.95, 3.6], look: [-0.55, 0.78, -0.4], fov: 30 };
  const DEV_MS = { pos: [0.55, 1.15, 4.4], look: [0.95, 0.85, 0.3], fov: 30 };

  const welcomeBeat = (t0) => {
    // the Devil throws his arms wide: Welcome to HELL. (the lava tub flares)
    arm(t0, "devil", "both", { o: [0.30, 0.95, 0.12] }, 0.25, "out"); grip(t0, "devil", "both", "open");
    sfx(r3(t0 + 0.1), "whoosh", { gain: 0.4 });
    const e = say("welcome", r3(t0 + 0.05));
    act.shock(c, r3(t0 + 0.4), "spud", { open: 0.2, eye: 1.2, curve: null, brow: 0.35, dur: 0.15, hold: 0.6 });
    return e;
  };
  const ruleBeat = (k, t0) => {
    // he counts it off on the empty seats beside the hero
    arm(t0, "devil", "R", { o: [0.10, 0.85, 0.30] }, 0.3, "out"); grip(t0, "devil", "R", "point");
    arm(t0, "devil", "L", "rest", 0.3);
    look(t0, "devil", AT_SEATS, 0.25);
    return say(k, r3(t0 + 0.05));
  };

  if (H === "h1" || H === "h2") {
    const s0 = cold ? t : shot("welcome", 0, push(WIDE, 2.2), "hook");
    t = welcomeBeat(r3(s0 + 0.05));
    const s1 = shot("who", r3(t + 0.1), push(SPUD_CU, 1.4, 0.05));
    t = say("who", r3(s1 + 0.05));
    const s2 = shot("rule", r3(t + 0.15), push(DEV_MS, 3.2, 0.06));
    t = ruleBeat("rule", r3(s2 + 0.05));
    see(r3(s2 + 0.2), t, ["devil.face"], "the rule");
  } else if (H === "h3") {
    let s0 = shot("who", 0, push(SPUD_CU, 1.4, 0.05), "hook");
    expr(0, "spud", "scared", 0.01);
    t = say("whoLoud", 0.05);
    const s1 = shot("everyone", r3(t + 0.15), push(WIDE, 3.0));
    t = ruleBeat("everyone", r3(s1 + 0.05));
    look(r3(s1 + 0.6), "spud", [0.6, -0.2], 0.25);
    see(r3(s1 + 0.2), t, ["devil.face", "spud.face", "couch"], "the empty seats are the stake");
  } else if (H === "h4") {
    shot("rule open", 0, push(DEV_MS, 1.6, 0.06), "hook");
    arm(0, "devil", "both", { o: [0.30, 0.95, 0.12] }, 0.01);
    t = say("ruleOpen", 0.05);
    const s1 = shot("forever", r3(t + 0.15), push(WIDE, 2.6));
    t = ruleBeat("ruleForever", r3(s1 + 0.05));
    const s2 = shot("mine", r3(t + 0.15), push(SPUD_CU, 1.4, 0.05));
    t = say("whoMine", r3(s2 + 0.05));
    see(s2, t, ["spud.face"], "who's in mine?");
  }
  // the pen plant (E1): two clicks after the last line, the hero's own small habit
  sfx(r3(t + 0.15), "click", { gain: 0.5 }); sfx(r3(t + 0.32), "click", { gain: 0.5 });
  const END = r3(Math.round((t + 0.7) * 15) / 15);
  act.blinksAt(c, "spud", [r3(END - 0.5)]);
  const beats = c.beats(shots, END);
  write(import.meta.url, {
    id: `desk13-hook-${H}`,
    title: `Who's in your hell? hook ${H.toUpperCase()}`,
    idea: "Potato Desk 13 hook option (rough set): hell = forever with the people who annoyed you most",
    fps: 30, look: "anime-pro", profile: "short", loop: false,
    captionBand: [470, 1360], captionStyle: "kinetic", castLook: "sheet", cleanStart: true,
    motion: { feet: 2, overlap: true, timing: true, solve: true }, rig: { hand: 2, eyes: 2, hold: 2 }, physics: true, animeTiming: true,
    set: { type: "plain", color: "#2a2024", floor: "none", light: "soft", para: 0, aperture: 0, lighting: 2, hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true, satsuei: true },
    music: { style: "sneaky", lowCut: 150, gain: 0.24 },
    sound: { sfx: 0.6, ambience: 0.05, guard: true, signature: false, surface: "indoor" },
    creative: { length: [3, 10] },
    hook: { show: ["spud", "devil"], hint: 0, what: "a potato on a couch in hell, the Devil welcoming him" },
    cast, props, captions: c.captions, beats, visible: c.visible,
    allowClip: [
      { who: "spud", with: "couch", from: 0, to: END, reason: "he sits on the couch" },
      ...(cold ? [{ who: "chip", with: "couch", from: 0, to: 1.6, reason: "squeezed onto the couch" }, { who: "wedge", with: "couch", from: 0, to: 1.6, reason: "squeezed onto the couch" },
        { who: "spud", with: "wedge", from: 0, to: 1.6, checks: ["character-overlap", "reach"], reason: "the cold open: squeezed shoulder to shoulder" },
        { who: "spud", with: "chip", from: 0, to: 1.6, checks: ["character-overlap", "reach"], reason: "the cold open: the chewer in his ear" }] : []),
    ],
    notes: "Generated by storyboards/series/potato-desk/13-whos-in-your-hell/make-hooks.mjs (rough hook option).",
  }, `desk13-hook-${H}.json`);
}
for (const H of (process.argv[2] ? [process.argv[2]] : ["h1", "h2", "h3", "h4"])) build(H);
