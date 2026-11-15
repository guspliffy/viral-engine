// ANCIENT ALIENS EP03 "Where did Atlantis go?", BLOCK A (story 0:00-0:50, TikTok part 1): hook, contract, clue 1 the plan.
// Panels 01-12 of ancient-aliens-03-sheet-1.png. Story: /mnt/project-files/videos/ancient-aliens/03-atlantis/STORY.md.
//   node storyboards/series/ancient-aliens/03-atlantis/block-a/measure-lines.mjs   -> lines.json (spoken lengths)
//   node storyboards/series/ancient-aliens/03-atlantis/block-a/make-block-a.mjs    -> aa03-a-wide.json (+ --tall after Jonny's OK)
//
// THE LOOK (Jonny 15 Nov: "much love to the detail"): every place is a PAINTING made from his approved panel (gpt-image-2 on his
// PC), cut into a layered env (assets/environments/at-*); one storyboard, the places swap on cuts (set.swap). 3D only for what
// moves: Spud, the wall flash (envflash), the scroll, the canal cut-away (a built room at its own place).
// Emotion map (STORY.md): awe 0-9 s, loss at the snap, promise at the scroll, wonder at scale 22-45, doubt then surprise at the end.
// Opener A (the city is there at frame 0). Part 1's hook = the film's first 2 s: "A whole island. Gone in one day." + "24 h".
import { clip, write, r3 } from "../../../../lib/clip.mjs";
import { existsSync, readFileSync } from "node:fs";
import { FRAME, FAR, P, hostSay, clueTag, atlantisClock, count, score, partScore, hookOf, host, lampClip, CAST } from "../kit/at-kit.mjs";
import { LINES, toneOf } from "./lines.mjs";

const ROOT = new URL("../../../../../", import.meta.url);
const MEASURED = new URL("./lines.json", import.meta.url);
const DUR = existsSync(MEASURED) ? JSON.parse(readFileSync(MEASURED, "utf8")) : Object.fromEntries(Object.entries(LINES).map(([k, l]) => [k, r3(0.3 + l.split(/\s+/).length * 0.42)]));
const ENV = (n) => JSON.parse(readFileSync(new URL(`assets/environments/${n}/env.json`, ROOT), "utf8"));
const MOTION = { feet: 2, overlap: true, timing: true, solve: true }, RIG = { hand: 2, eyes: 2, hold: 2 };

// a camera relative to an env's painting eye: dx/dy/dz metres, pan/tilt degrees (+ = right / up), fov; `to` the same for a move
function ecam(name, v) {
  const E = ENV(name), [ex, ey, ez] = E.eye.pos, pitch = -E.eye.pitch;
  const one = (s) => {
    const pos = [r3(ex + (s.dx ?? 0)), r3(ey + (s.dy ?? 0)), r3(ez + (s.dz ?? 0))];
    const yaw = ((s.pan ?? 0) * Math.PI) / 180, tl = (((s.tilt ?? 0) + pitch) * Math.PI) / 180;
    return { pos, look: [r3(pos[0] + Math.sin(yaw) * Math.cos(tl) * 10), r3(pos[1] + Math.sin(tl) * 10), r3(pos[2] - Math.cos(yaw) * Math.cos(tl) * 10)] };
  };
  const a = one(v);
  return { ...a, fov: v.fov ?? 40, ...(v.to && { to: one({ ...v, ...v.to }), dur: v.dur, ease: v.ease ?? "inOut" }) };
}

function build(F) {
  const H = hookOf(F, "a"), T0 = 0;
  const c = clip({ faces: "strong" }), { A, sfx, cap } = c;
  const PR = (t, id, set, dur = 0.01, ease = "linear") => c.prop(r3(t + H), id, set, dur, ease);
  const place = (t, who, xz, yaw) => { A(r3(t - 0.02), who, "move", { to: xz, dur: 0.01, steps: 0, ease: "linear", sync: true }); A(r3(t - 0.02), who, "turn", { to: yaw, dur: 0.01, ease: "linear", sync: true }); };
  const look = (t, who, to, dur = 0.2) => A(r3(t), who, "look", { to, dur, blink: false });
  const expr = (t, who, e, set, dur = 0.15) => A(r3(t), who, "expr", { expr: e, ...(set && { set }), dur });
  const say = (t, k, next) => { const hold = next == null ? 0.4 : Math.max(0, Math.min(0.4, r3(next - t - DUR[k] - 0.05))); hostSay(c, F, r3(t), "spud", LINES[k], DUR[k], toneOf(k), { hold }); return r3(t + DUR[k]); };
  const OFF = [0, 40];   // Spud waits out of sight (behind the painting camera) when he is not in a shot

  // ---------------------------------------------------------------- the beats (video s = story s)
  const T = { s01: 0, s02: 2.6, s03: 4.7, s04: 8.9, snap: 10.7, s06: 13.4, s07: 21.4, s08: 26.0, s09: 29.0, s10: 31.8, s11: 35.3, s12: 41.9, END: 50.0 };
  const END = T.END;
  // the places: one env per painting, all with their painting camera at (0, h, 6); the canal cut-away is a built room far away
  const CANAL = P.canal;
  const set = {
    type: "env", env: "at-harbour-dawn", shade: "soft", aperture: 0, focus: false, life: "auto",
    swap: [
      { at: r3(T.s02 + H), env: "at-citadel-wall-dawn" },
      { at: r3(T.s03 + H), env: "at-aerial-rings" },
      { at: r3(T.s04 + H), env: "at-harbour-wall-past" },
      { at: r3(T.snap + H), env: "at-gibraltar-rock" },
      { at: r3(T.s07 + H), env: "at-aerial-rings" },
      { at: r3(T.s08 + H), env: "at-canal-cutaway" },
      { at: r3(T.s09 + H), env: "at-canal-suez" },
      { at: r3(T.s10 + H), env: "at-citadel-wall-dawn" },
      { at: r3(T.s11 + H), env: "at-walls-view" },
      { at: r3(T.s12 + H), env: "at-gibraltar-rock" },
    ],
  };

  // ---------------------------------------------------------------- cast + props
  const cast = [{ id: "spud", character: CAST.spud, at: [-0.7, 1.0], face: 15, expr: "neutral", follow: 0.2, seed: 2.1 }];
  const props = [
    host("spud", 0),
    { id: "flash02", kind: "envflash", env: "at-citadel-wall-dawn", x: 0, y: 0, z: 0, flash: 0, hot: 0, staged: "the red-gold wall of panel 02: the flash runs along it" },
    { id: "scroll06", kind: "scroll", x: 0.55, y: -60, z: 1.05, rot: -10, open: 0, staged: "Plato's plan on the flat of the rock" },
  ];

  // ================================================================= 01-02 HOOK (0-4.7): the ring city at dawn, the wall flashes
  // he stands on the quay, three-quarter to us, the city behind; the line at frame 0 (part 1's hook)
  look(0, "spud", [0.15, 0.05], 0.01); expr(0, "spud", "neutral", { brow: 0.6, lid: 0.25 }, 0.01);
  say(0.15, "l1", T.s02 + 0.2);
  A(1.6, "spud", "turn", { to: 160, dur: 0.6, ease: "inOut" });          // he turns to look at the city
  look(1.7, "spud", [0.3, 0.35], 0.3);
  cap(r3(0 + H), r3(4.6 + H), "24 h", F.NUM + 80, false, { size: F.numSize, kinetic: false });
  place(T.s02, "spud", OFF, 0);
  PR(T.s02 + 0.3, "flash02", { flash: 1 }, 1.2, "inOut"); PR(T.s02 + 1.4, "flash02", { hot: 1 }, 0.6, "out"); PR(T.s03 - 0.02, "flash02", { flash: 0, hot: 0 });

  // ================================================================= 03 THE RINGS (4.7-8.9): from high above
  say(T.s03 + 0.2, "l2", T.s04);

  // ================================================================= 04-05 SNAP (8.9-13.4): the harbour wall, then the same frame today
  place(T.s04, "spud", [0.5, 1.0], 20); look(T.s04, "spud", [0.3, 0.2], 0.01); expr(T.s04, "spud", "neutral", { brow: 0.4 }, 0.01);
  c.arm(T.s04 + 0.4, "spud", "R", "point", 0.35, "out"); A(T.s04 + 0.4, "spud", "grip", { side: "R", shape: "point", dur: 0.2 });
  // the snap: same spot, same pose; the city is gone; he lowers the arm slowly
  sfx(T.snap, "ai/car-waves", { gain: 0.45, dur: 2.8, reason: "today: empty sea breaking on the rock" });
  c.arm(T.snap + 0.9, "spud", "R", "rest", 0.6, "inOut");
  look(T.snap + 0.8, "spud", [0, 0.05], 0.3); expr(T.snap + 0.9, "spud", "neutral", { brow: 0.75, lid: 0.35 }, 0.3);
  say(T.snap + 0.25, "l3", T.s06);

  // ================================================================= 06 THE CONTRACT (13.4-21.4): the scroll, four clues, by midnight
  place(T.s06, "spud", [0.05, 1.0], 10); look(T.s06, "spud", [0.25, -0.4], 0.01);
  PR(T.s06 - 0.02, "scroll06", { y: 0.02 }); PR(T.s06 + 0.3, "scroll06", { open: 1 }, 0.6, "out"); PR(T.s07 - 0.02, "scroll06", { y: -60 });
  const l4a = say(T.s06 + 0.4, "l4a", 17.4);
  look(l4a - 0.6, "spud", [0, 0.05], 0.25);
  // four clues: he holds up his hand (four fingers), the clock punches in
  c.arm(17.3, "spud", "R", "up", 0.3, "out"); A(17.3, "spud", "grip", { side: "R", shape: "open", dur: 0.2 });
  say(17.4, "l4b", 18.5);
  cap(r3(17.45 + H), r3(18.6 + H), "4", F.NUM, false, { size: F.numSize, kinetic: false });
  c.arm(18.6, "spud", "R", "rest", 0.4, "inOut");
  say(18.6, "l4c", T.s07);
  expr(19.0, "spud", "neutral", { brow: 0.85, lid: 0.3 }, 0.25);

  // ================================================================= 07 CLUE 1 (21.4-27.6): the plan, ring by ring, about 5 km
  place(T.s07, "spud", OFF, 0);
  say(T.s07 + 0.2, "l5", T.s08);
  count(c, F, r3(T.s07 + 2.6 + H), r3(T.s07 + 4.2 + H), r3(T.s08 + H), 0, 5, (v) => `${Math.round(v)} km`);

  // ================================================================= 08-09 THE CANAL (27.6-35.4): 30 m, deeper than Suez (24 m)
  const l6a = say(T.s08 + 0.3, "l6a", T.s09);
  count(c, F, r3(T.s08 + 0.6 + H), r3(T.s08 + 2.4 + H), r3(T.s09 + H), 0, 30, (v) => `${Math.round(v)} m`);
  say(T.s09 + 0.2, "l6b", T.s10);
  cap(r3(T.s09 + H), r3(T.s10 + H), "30 m", F.NUM + 150, false, { size: F.numSize, kinetic: false, x: Math.round(F.W * 0.22) });
  cap(r3(T.s09 + 0.4 + H), r3(T.s10 + H), "SUEZ 24 m", F.NUM, false, { size: F.numSize, kinetic: false, x: Math.round(F.W * 0.72) });
  sfx(T.s08, "ai/underwater-amb", { gain: 0.25, dur: r3(T.s10 - T.s08), reason: "the cut-away: water pressing on the stone" });

  // ================================================================= 10-11 THE WALLS (35.4-44.4): white, black, red; brass, tin, red metal
  place(T.s10, "spud", [-0.8, 0.6], 160); look(T.s10, "spud", [0, 0.2], 0.01); PR(T.s10 + 1.0, "flash02", { hot: 1 }, 0.8, "out"); PR(T.s11 - 0.02, "flash02", { flash: 0, hot: 0 });
  c.arm(T.s10 + 0.5, "spud", "R", "out", 0.4, "out");                     // his palm out to the bare stone
  say(T.s10 + 0.3, "l7a", T.s11);
  place(T.s11, "spud", OFF, 0);
  say(T.s11 + 0.2, "l7b", T.s12);

  // ================================================================= 12 THE TURN (44.4-50): he looks down into the dark water
  place(T.s12, "spud", [0.5, 1.0], 0); look(T.s12, "spud", [0.1, -0.6], 0.01); expr(T.s12, "spud", "neutral", { brow: 0.6, lid: 0.45 }, 0.01);
  say(T.s12 + 0.3, "l8a", 47.4);
  look(47.2, "spud", [0, 0.05], 0.25); expr(47.3, "spud", "surprised", { open: 0.15 }, 0.2);
  say(47.4, "l8b");
  A(r3(END - 0.6), "spud", "noblink", { dur: 0.6 });

  // the clock (24:00 from frame 0), the clue tag, gulls and sea under the outdoor shots (far under the voice)
  atlantisClock(c, F, T0 - H, 0, r3(END + H));
  clueTag(c, F, r3(T.s07 + H), r3(END + H), 1);
  for (const [a, b] of [[0, T.s03], [T.s04, T.s07], [T.s12, END]]) sfx(a, "ai/car-waves", { gain: 0.08, dur: r3(b - a), reason: "the sea under the shot" });

  // ---------------------------------------------------------------- shots (a push or a move on every one)
  const O = (pl, v) => ({ pos: [r3(pl[0] + v.pos[0]), v.pos[1], r3(pl[1] + v.pos[2])], look: [r3(pl[0] + v.look[0]), v.look[1], r3(pl[1] + v.look[2])], fov: v.fov, ...(v.to && { to: { pos: [r3(pl[0] + v.to.pos[0]), v.to.pos[1], r3(pl[1] + v.to.pos[2])] }, dur: v.dur, ease: "inOut" }) });
  const SHOTS = [
    ["01 the ring city at dawn", T.s01, ecam("at-harbour-dawn", { fov: 40, to: { dz: -0.5 }, dur: T.s02 }), "hook"],
    ["02 the red wall flashes", T.s02, ecam("at-citadel-wall-dawn", { fov: 40, pan: -4, to: { pan: 4, dx: 0.6 }, dur: r3(T.s03 - T.s02) })],
    ["03 the rings from above", T.s03, ecam("at-aerial-rings", { fov: 40, to: { dz: -3 }, dur: r3(T.s04 - T.s03) })],
    ["04 the harbour wall", T.s04, ecam("at-harbour-wall-past", { fov: 40, to: { dz: -0.25 }, dur: r3(T.snap - T.s04) })],
    ["05 today", T.snap, ecam("at-gibraltar-rock", { fov: 40, dz: -0.25, to: { dz: -0.5 }, dur: r3(T.s06 - T.snap) }), "reveal"],
    ["06 the scroll", T.s06, ecam("at-gibraltar-rock", { fov: 34, dz: -1.6, dy: -0.2, tilt: -4, to: { dz: -1.9 }, dur: r3(T.s07 - T.s06) })],
    ["07 clue one: the plan", T.s07, ecam("at-aerial-rings", { fov: 36, dz: -2, to: { dz: -6 }, dur: r3(T.s08 - T.s07) })],
    ["08 the canal cut-away", T.s08, ecam("at-canal-cutaway", { fov: 42, to: { dz: -1.2 }, dur: r3(T.s09 - T.s08) })],
    ["09 deeper than Suez", T.s09, { ...ecam("at-canal-suez", { fov: 35 }), to: { ...ecam("at-canal-suez", { fov: 35 }), fov: 32 }, dur: r3(T.s10 - T.s09), ease: "inOut" }],
    ["10 the bare stone", T.s10, ecam("at-citadel-wall-dawn", { fov: 40, pan: -3, tilt: -4, to: { dz: -0.4, pan: 0, tilt: -4 }, dur: r3(T.s11 - T.s10) })],
    ["11 brass, tin, red", T.s11, ecam("at-walls-view", { fov: 35, to: { dz: -1.5 }, dur: r3(T.s12 - T.s11) })],
    ["12 the dark water", T.s12, ecam("at-gibraltar-rock", { fov: 36, dz: -1.2, to: { dz: -1.6, tilt: -5 }, dur: r3(END - T.s12) })],
  ];
  const beats = c.beats(SHOTS.map(([n, t, s, k]) => [n, r3(t + H), s, k]), r3(END + H));

  return {
    title: "Where did Atlantis go? (block A)",
    idea: "Ancient aliens EP03 block A (0:00-0:50): the ring city at dawn, 'a whole island, gone in one day'; the wall flashes; the rings from above; snap to today's empty sea; Plato's scroll and the contract (four clues, by midnight); clue 1: the plan, the canal 30 m deep (Suez 24 m), the walls of white, black and red stone, brass, tin and a red metal; 'nobody has found one stone... they found the metal'",
    fps: 30, look: "anime-pro", profile: "short", loop: false, captionStyle: "kinetic",
    castLook: "sheet", cleanStart: true, motion: MOTION, rig: RIG, physics: false, loopIdle: false,
    set, music: H ? partScore("a") : score(T0),
    sound: { signature: false, sfx: 0.65, ambience: 0.06, surface: "stone", room: "open", guard: true },
    hook: { show: ["spud"], hint: 0, what: "Atlantis at dawn: Spud on the harbour quay, the ring city and its walls behind him; 24 h on screen" },
    cast, props, captions: c.captions, beats, visible: c.visible,
    allowClip: [...lampClip(["spud"], r3(END + H))],
    notes: "Generated by storyboards/series/ancient-aliens/03-atlantis/block-a/make-block-a.mjs. Block A of four; music = the EP03 score's first 50 s (kit score(0)). Backgrounds: painted envs from the approved panels.",
  };
}

const FRAMES = process.argv.includes("--tall") ? [FRAME.wide, FRAME.tall] : [FRAME.wide];
for (const F of FRAMES) write(import.meta.url, { id: `aa03-a-${F.key}`, ...F.sb(FAR.other), ...build(F) });
