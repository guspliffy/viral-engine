// Ancient aliens EP01 "Who really built the pyramids?", BLOCK D (story 2:18-2:55, panels 26-36): clue 5 the stars, the
// south shaft, the ship goes home, "Case closed", the tag. One of four blocks built at the same time from the shared kit
// (kit/BLOCKS.md); the join pass lays one voice-continuous film and ONE orchestra bed over A+B+C+D, so music is off here.
//   node storyboards/series/ancient-aliens/01-pyramids/block-d/make-aa01-block-d.mjs
//
// THE BRIEF (STORY.md rows 2:18-2:48)
//   Joke:        the deadpan believer "proves" the pyramids are a signpost home for aliens, then covers the one real clue.
//   Wants:       Spud wants the last clue to close the case: the stars line up with the pyramids and the shaft.
//   Consequence: the ship leaves toward Orion's Belt; "Case closed."
//   Ending:      the workers' red marks ("Friends of Khufu") are the real answer: he presses his back over them, "...Nobody saw that."
//   Callback:    the film opened on "they tell you humans built this"; it ends on the humans' own signature, hidden by him.
//
// Story chain (cause and effect): Orion rises over the three pyramids, so Spud shows the off-line star = the off-line
// pyramid; so he goes inside to the shaft that pointed at those stars; "four and a half thousand years ago" cuts to
// 2560 BC, where the ship that built it leaves for the Belt; so "Case closed"; but one room up a worker signs the block,
// so Spud hides the signature.
//
// LIGHT: the whole block is night or a dark room, so it is ONE storyboard in SET_NIGHT (kit/aa-kit.mjs).
import { clip, write, r3 } from "../../../../lib/clip.mjs";
import * as act from "../../../../lib/acting.mjs";
import * as grips from "../../../../lib/grips.mjs";
import { S, SET_NIGHT, CAST, VIEW, TOP, cam, far, giza2560, liftShip, host, nightOver, hostSay, lampClip } from "../../kit/aa-kit.mjs";

const MOTION = { feet: 2, overlap: true, timing: true, solve: true };
const RIG = { hand: 2, eyes: 2, hold: 2 };
const WORN = ["clipping", "arm-in-prop", "hand-in-prop", "costume-in-prop"];
const c = clip({ faces: "strong" }), { A, sfx, cap, see } = c;
// every host line through the kit's hostSay (the say macro, voice "reaper", subtitle at y 400); a subtitle ends where the
// next one starts (two never stand on each other)
const subs = [];
const say = (t, line, dur, who, o = {}) => { hostSay(c, t, who, line, dur, "calm", o); subs.push(c.captions[c.captions.length - 1]); };
const trimSubs = () => subs.sort((a, b) => a.from - b.from).forEach((q, i) => { const n = subs[i + 1]; if (n && q.to > n.from - 0.05) q.to = r3(n.from - 0.05); });

// ---------------------------------------------------------------- timing (block time; story time = 2:18 + t)
// spoken lengths from the render's "speech: ... lasts Xs spoken" lines (VoxCPM2, voice reaper)
const LEN = { belt: 1.36, star: 2.51, pyr: 1.76, shaft: 2.44, years: 2.29, us: 1.97, home: 2.51, closed: 1.21, nobody: 1.45 };   // measure-lines.mjs
const T = {
  night: 0, belt: 1.3, star: 2.95, pyr: 5.8,                        // 2:18 panels 26-27
  room: 9.0, shaft: 9.4, pov: 12.1, years: 12.5,                   // 2:27 panels 28-29
  home: 17.0, lift: 17.9, rise: 18.4, us: 19.4, home2: 21.7,       // 2:35 panels 30-31 (2 s with no voice from 17.0)
  pay: 26.0, turn: 26.25, closed: 27.0,                            // 2:44 panel 32, hold 2 s
  tag: 30.0, read: 31.7, see: 32.5, cover: 33.0, close: 34.2, nobody: 34.6,   // 2:48 panels 33-36
  end: 37.0,                                                       // 2:55
};

// ---------------------------------------------------------------- places, 1000 m apart (aa-kit.mjs: one origin per place)
const O = (i) => [i * 1000, 0];
const P = { night: O(0), room: O(1), shaft: O(2), home: O(3), tag: O(4) };
const at = (o, x, z) => [r3(o[0] + x), r3(o[1] + z)];
const who = (id, character, p, face, extra = {}) => ({ id, character, at: p, face, expr: "kind", follow: 0.2, seed: 2.1, ...extra });

// NIGHT (panels 26-27): the three pyramids of today under Orion, Spud from behind, 7.5 m in front of the kit's todayWide camera
const NIGHT_SPUD = at(P.night, -146.6, 225.6);
// ROOM (panel 28): the King's Chamber, south shaft at x 2.735 on the south wall (z +2.615), sill 0.92: he stands under it
const ROOM_SPUD = at(P.room, 2.735, 2.12);
// SHAFT (panel 29): starshaft len 18 rising 45 deg south; the Belt beyond its open end on the shaft's axis
const SHAFT_LEN = 18, BELT_D = 80;
// HOME (panels 30-32): 2560 BC, the finished white pyramid in moonlight, the builders watch the ship go
const HOME_SPUD = at(P.home, -29.3, 208.5);
const BELT_H = [P.home[0] + 6, 70, P.home[1] - 12];                // Alnilam over the pyramid's tip, about 17 deg up
const ORI_DEG = 8;
// NIGHT: the Belt as big as the three pyramids under it (deg 12: about 8 deg long), Alnilam right over Khafre, about 16 deg
// up from the todayWide camera; rolled 148 deg so Mintaka, the faint one, sits left over Menkaure (the small pyramid) and
// the Belt lies about level like the three tips under it
const NIGHT_BELT = (() => { const cx = -150, cz = 232, az = (29.5 * Math.PI) / 180, d = 221;
  return { x: r3(P.night[0] + cx + d * Math.sin(az)), y: 64.6, z: r3(P.night[1] + cz - d * Math.cos(az)), roll: 148, deg: 12 }; })();
// TAG (panels 33-36): the relieving chamber, the marks on the pale block of the north wall (wall face z -2.615)
const WALL = -2.615, MARK_Y = 0.62;

const cast = [
  who("spudN", CAST.spud, NIGHT_SPUD, 152),
  who("spudK", CAST.spud, ROOM_SPUD, 0),
  who("spudH", CAST.spud, HOME_SPUD, 180),
  who("wkH", CAST.workerB, at(P.home, -30.75, 208.1), 175),
  who("crewH", CAST.crew, at(P.home, -27.95, 207.9), 185),
  who("liftH", CAST.lifter, at(P.home, -26.65, 207.1), 190),
  who("spudT", CAST.spud, at(P.tag, -0.95, -1.75), 225),
  who("wkT", CAST.workerA, at(P.tag, 0.66, -2.2), 185),
];

const BRUSH = { id: "brush", kind: "reedbrush", x: P.tag[0] + 0.42, y: 0.42, z: -2.36, tip: -60, rot: 0 };
const props = [
  // NIGHT: far night layer + Giza today at night + Orion (kit nightOver, seen from VIEW.todayWide)
  ...nightOver("n", P.night, { belt: true, moon: [352, 26] }).map((q) => (q.id === "n-orion" ? { ...q, ...NIGHT_BELT } : q)), host("spudN", 0),
  // ROOM: the King's Chamber by night, his headlamp on
  { id: "kc", kind: "kingschamber", x: P.room[0], y: 0, z: P.room[1], lamps: false }, host("spudK", 1),
  // SHAFT: the view up the south shaft to the three Belt stars
  { id: "sh-sky", kind: "aasky", x: P.shaft[0], z: P.shaft[1], time: "night" },
  { id: "sh-stars", kind: "starfield", x: P.shaft[0], z: P.shaft[1], n: 900, seed: 4 },
  { id: "shaft", kind: "starshaft", x: P.shaft[0], y: 0, z: P.shaft[1], len: SHAFT_LEN },
  { id: "sh-belt", kind: "orion", x: P.shaft[0], y: r3(0.5 + BELT_D * Math.SQRT1_2), z: r3(P.shaft[1] + BELT_D * Math.SQRT1_2), rot: 180, belt: true, deg: 1.2, size: 3.2 },
  // HOME: 2560 BC at night, the finished pyramid, the ring ship over its tip, Orion's Belt above, the builders' crowd
  ...far("fh", [P.home[0] + VIEW.pastWide.pos[0], P.home[1] + VIEW.pastWide.pos[2]], { time: "night", stars: 4000, hole: [9, 17, 4], moon: [358, 22], seed: 2 }),
  ...giza2560("gh", P.home, { state: "finished", night: 0.72, sunAz: 70, valley: false }),
  ...liftShip("sh", P.home, { top: TOP(S, 1), hover: 70, beam: 1, lit: 1, block: null, shipK: 2.5 }),
  { id: "h-belt", kind: "orion", x: BELT_H[0], y: BELT_H[1], z: BELT_H[2], belt: true, deg: ORI_DEG },
  // the ship far away as a point of light (panel 32): a tiny ring, hidden under the plateau until the cut
  { id: "dot", kind: "ringship", x: P.home[0], y: -300, z: P.home[1], s: 0.05, beam: 0, lit: 1 },
  { id: "h-workers", kind: "potatocrowd", x: P.home[0] - 24, z: 192, who: "workers", n: 60, box: [22, 10], seed: 5, lookAt: [24, 40, -192] },
  { id: "h-aliens", kind: "potatocrowd", x: P.home[0] - 12, z: 194, who: "aliens", n: 22, box: [10, 6], seed: 8, lookAt: [12, 40, -194] },
  host("spudH", 0),
  // TAG: the relieving chamber, the worker signs the block, oil lamp and paint bowl at his feet
  { id: "rel", kind: "relievingchamber", x: P.tag[0], y: 0, z: P.tag[1] },
  { id: "marks", kind: "gangmarks", x: P.tag[0], y: MARK_Y, z: r3(WALL + 0.004) },
  { id: "oil", kind: "oillamp", x: P.tag[0] - 0.55, y: 0, z: -2.2, wall: 0.41 },
  { id: "bowl", kind: "paintbowl", x: P.tag[0] + 0.95, y: 0, z: -2.25 },
  BRUSH, host("spudT", 1),
];

// seeds (params with no default start at 0)
c.prop(0, "n-orion", { show: 0, y: 52 }, 0); c.prop(0, "n-stars", { show: 1 }, 0);
c.prop(0, "sh-stars", { show: 1 }, 0); c.prop(0, "sh-belt", { show: 1 }, 0); c.prop(0, "fh-stars", { show: 1 }, 0); c.prop(0, "h-belt", { show: 1 }, 0);
c.prop(0, "sh-ship", { beam: 1, wobble: 0.4 }, 0); c.prop(0, "dot", { beam: 0, wobble: 0 }, 0);
c.prop(0, "marks", { paint: 0.55 }, 0);
c.prop(0, "spudK-lamp", { lit: 1 }, 0); c.prop(0, "spudT-lamp", { lit: 1 }, 0);

// ================================================================ 1 CLUE 5, THE STARS (2:18, panels 26-27)
// Orion climbs over the three pyramids; the Belt is three stars in a line over the three pyramids, the faint one off it
cap(0, 17.0, "CLUE 5/5", 230, false, { x: 250, size: 54, kinetic: false });
c.prop(0.1, "n-orion", { show: 1, y: NIGHT_BELT.y }, 2.6, "out");
sfx(0, "ai/storm-wind", { gain: 0.06, dur: 9.0, reason: "the desert night, far under" });
A(0.6, "spudN", "look", { to: [0.2, 0.6], dur: 0.4 });
say(T.belt, "Orion's Belt.", LEN.belt, "spudN");
say(T.star, "The smallest star sits off the line.", LEN.star, "spudN");
say(T.pyr, "So does the smallest pyramid.", LEN.pyr, "spudN");
A(T.pyr, "spudN", "look", { to: [0.15, 0.2], dur: 0.5 });
see(0.3, 9.0, ["n-orion", "spudN"], "Orion over the three pyramids, Spud watching");

// ================================================================ 2 THE SHAFT (2:27, panels 28-29)
// King's Chamber: his headlamp finds the south shaft; then up the shaft to the same three stars
sfx(T.room, "ai/step-concrete", { gain: 0.25, reason: "he steps up to the south wall" });
A(T.room + 0.1, "spudK", "look", { to: [0, 0.9], dur: 0.35 });
A(T.room + 0.1, "spudK", "pitch", { to: -9, dur: 0.4 });
say(T.shaft, "And this shaft pointed right at them.", LEN.shaft, "spudK");
see(T.room, T.pov, ["spudK", "kc"], "his headlamp on the south shaft");
say(T.years, "Four and a half thousand years ago.", LEN.years, "spudK");
see(T.pov, T.home, ["sh-belt"], "the three stars at the top of the shaft");

// ================================================================ 3 THE SHIP GOES HOME (2:35, panels 30-31, 2560 BC)
// the beam goes out, the ring lifts off the tip and climbs toward the Belt; 2 s with no voice
const SHIP0 = { x: P.home[0], y: r3(TOP(S, 1) + 70 * S), z: P.home[1] };
c.prop(T.lift, "sh-ship", { beam: 0, wobble: 0 }, 0.5, "inOut");
sfx(T.home, "rumble", { gain: 0.3, dur: 2.0, reason: "the ship's low hum over the pyramid" });
sfx(T.rise, "rumble", { gain: 0.45, dur: 3.0, reason: "the hum swells as the ring lifts away" });
c.prop(T.rise, "sh-ship", { x: P.home[0] - 4, y: 64, z: P.home[1] - 30 }, T.pay - T.rise, "in");
for (const id of ["spudH", "wkH", "crewH", "liftH"]) A(T.home + 0.2, id, "look", { to: [0, 0.8], dur: 0.4 });
A(T.rise + 0.4, "spudH", "look", { to: [0.05, 1.0], dur: 1.2 });
say(T.us, "They didn't build it for us.", LEN.us, "spudH");
say(T.home2, "They built a signpost home.", LEN.home, "spudH");
see(T.home, T.pay, ["sh-ship", "gh-pyr"], "the ring over the white pyramid, then climbing toward the Belt");

// ================================================================ 4 PAYOFF (2:44, panel 32)
// the big ring is gone; a point of light glides into line with the Belt; Spud turns to us: "Case closed."
c.prop(T.pay, "sh-ship", { y: -400 }, 0);
const DOT0 = [P.home[0] - 4, 64, P.home[1] - 30], DOT1 = [BELT_H[0] + 1.7 * 1.15 * ORI_DEG, BELT_H[1] + 1.7 * 0.74 * ORI_DEG, BELT_H[2]];
c.prop(T.pay, "dot", { x: DOT0[0], y: DOT0[1], z: DOT0[2] }, 0);
c.prop(T.pay + 0.05, "dot", { x: r3(DOT1[0]), y: r3(DOT1[1]), z: DOT1[2] }, 2.4, "out");
A(T.turn, "spudH", "turn", { to: 0, dur: 0.5 });
A(T.turn + 0.2, "spudH", "look", { to: [0, 0], dur: 0.3 });
A(T.turn + 0.4, "spudH", "expr", { expr: "deadpan", dur: 0.3 });
say(T.closed, "Case closed.", LEN.closed, "spudH");
see(T.closed, T.tag, ["spudH.face", "dot"], "his face, the point of light in line with the Belt");

// ================================================================ 5 TAG (2:48, panels 33-36): the real answer
// a worker finishes the red marks; Spud reads them, sees what they say, slides over and presses his back flat on them
const brush = grips.thin(c, "wkT", BRUSH, { side: "L" });
brush.take(0.0, { reach: 0.01, settle: 0.01 });
const stroke = (t, x, y) => brush.carry(t, [r3(P.tag[0] + x), y, -2.36], 0.35, "inOut");
let s = T.tag + 0.1;
for (const [x, y] of [[0.42, 0.5], [0.42, 0.34], [0.36, 0.48], [0.36, 0.32], [0.4, 0.42]]) { stroke(s, x, y); s = r3(s + 0.38); }
c.prop(T.tag + 0.1, "marks", { paint: 1 }, 1.8, "linear");
sfx(T.tag + 0.1, "crinkle", { gain: 0.08, dur: 1.8, reason: "a dry reed brush on limestone, very soft" });
A(T.tag, "spudT", "look", { to: [0.5, 0.2], dur: 0.01 });
A(T.read - 0.15, "spudT", "look", { to: [0.55, 0.3], dur: 0.15 });
A(T.read, "spudT", "move", { to: at(P.tag, -0.6, -1.95), dur: 0.5, steps: 2 });
A(T.read + 0.2, "spudT", "look", { to: [0.6, 0.4], dur: 0.3 });
A(T.see - 0.05, "spudT", "turn", { to: 330, dur: 0.35 });
act.shock(c, T.see, "spudT", { open: 0.15, eye: 1.2, curve: null, brow: 0.35, dur: 0.15, hold: 0.4 });
A(T.see + 0.1, "spudT", "look", { to: [0, 0], dur: 0.2 });
// he slides in front of the marks, back to the wall, arms spread; the worker steps back, brush still up
brush.carry(T.cover - 0.1, [r3(P.tag[0] + 0.62), 0.4, -1.75], 0.45);
A(T.cover - 0.25, "wkT", "look", { to: [-0.5, 0.1], dur: 0.2 });
A(T.cover - 0.1, "wkT", "move", { to: at(P.tag, 1.0, -1.7), dur: 0.45, steps: 2 });
A(T.cover, "spudT", "move", { to: at(P.tag, 0, -2.25), dur: 0.45, steps: 2 });
A(T.cover, "spudT", "turn", { to: 360, dur: 0.35 });
sfx(T.cover + 0.45, "pat", { gain: 0.5, reason: "his back meets the stone" });
c.arm(T.cover + 0.35, "spudT", "R", { o: [0.5, 0.5, -0.12] }, 0.45, "out");
c.arm(T.cover + 0.35, "spudT", "L", { o: [0.5, 0.5, -0.12] }, 0.45, "out");
A(T.cover + 0.3, "spudT", "grip", { side: "R", shape: "flat", dur: 0.15 });
A(T.cover + 0.3, "spudT", "grip", { side: "L", shape: "flat", dur: 0.15 });
A(T.cover + 0.5, "wkT", "look", { to: [-0.6, 0.1], dur: 0.25 });
A(T.cover + 0.6, "spudT", "expr", { expr: "deadpan", dur: 0.3 });
A(T.cover + 0.6, "spudT", "look", { to: [0, 0], dur: 0.2 });
A(T.close, "spudT", "expr", { expr: "deadpan", dur: 0.2 });
A(T.close + 0.05, "spudT", "face", { brow: -0.4, press: 0.6, dur: 0.25 });
say(T.nobody, "...nobody saw that.", LEN.nobody, "spudT", { sub: "...Nobody saw that." });
trimSubs();
see(T.tag, T.cover, ["marks", "wkT", "spudT"], "the worker painting the red marks, Spud beside him");
see(T.close, T.end, ["spudT.face"], "his deadpan look to us, the marks hidden behind him");

// ---------------------------------------------------------------- shots
const shot = (o, pos, look, fov, extra = {}) => ({ ...cam(o, { pos, look, fov }), ...extra });
const NIGHT_A = shot(P.night, [-150, 1.2, 232], [-56, 40, 56], 32);
const NIGHT_B = { ...NIGHT_A, to: { ...shot(P.night, [-150, 1.0, 232], [-56, 22, 56], 30) } };
const beats = c.beats([
  ["orion rises", T.night, NIGHT_A, "hook"],
  ["the smallest star", T.star - 0.2, { ...NIGHT_B, dur: 4.2, ease: "inOut" }],
  ["the south shaft", T.room, shot(P.room, [4.9, 0.8, 2.0], [2.7, 0.85, 2.35], 55)],
  ["up the shaft", T.pov, { ...shot(P.shaft, [0, 0.5, 0], [0, 0.5 + 10, 10], 26), to: shot(P.shaft, [0, 0.5 + 1.2, 1.2], [0, 0.5 + 11.2, 11.2], 24), dur: 5.0, ease: "inOut" }],
  ["the ship goes home", T.home, { ...shot(P.home, [-30, 1.0, 216], [0, 30, 0], 26), to: shot(P.home, [-30, 1.0, 216], [0, 36, 0], 26), dur: 9.0, ease: "inOut" }, "reveal"],
  ["case closed", T.pay, shot(P.home, [-29.3, 0.62, 213.3], [-28.8, 1.95, 200], 30), "payoff"],
  ["the marks", T.tag, shot(P.tag, [0.25, 0.75, 0.9], [-0.15, 0.6, -2.6], 70)],
  ["nobody saw that", T.close, shot(P.tag, [0, 0.55, -0.35], [0, 0.78, -2.6], 50), "reaction"],
], T.end);

write(import.meta.url, {
  id: "aa01-block-d",
  title: "Ancient aliens EP01 block D",
  idea: "Who really built the pyramids? 2:18-2:55: Orion's Belt over the three pyramids, the south shaft, the ring ship leaves for the Belt in 2560 BC, 'Case closed', and the workers' red marks Spud covers with his back",
  format: "series: Ancient aliens (Spud hosts with Reaper's voice, five numbered clues, the alien answer is the premise, the tag winks at the real one); block D of four, joined later",
  fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, captionStyle: "kinetic",
  captionBand: [210, 640],   // speech lettering in the upper third (Jonny 12 Nov)
  cleanStart: true, motion: MOTION, rig: RIG, physics: false, animeTiming: true,
  set: { ...SET_NIGHT, aperture: 0, focus: false, bloom: "emissive", hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true, satsuei: true },
  music: false,   // the join pass lays ONE orchestra bed over the whole film (kit/BLOCKS.md)
  sound: { sfx: 0.65, ambience: 0.06, guard: true, signature: false },
  creative: { length: [T.end, T.end] },
  hook: { show: ["spudN", "n-orion"], hint: 0, what: "block D opens mid-film on a hard cut: night over the three pyramids, Orion rising" },
  cast, props, captions: c.captions, beats, visible: c.visible,
  allowClip: [
    ...lampClip(["spudN", "spudK", "spudH", "spudT"], T.end),
    ...["spudN"].map((w) => ({ who: w, with: "n-ground", from: 0, to: T.end, checks: WORN, reason: "he stands on the plateau's far ground (its rubble humps)" })),
    ...["spudH", "wkH", "crewH", "liftH"].map((w) => ({ who: w, with: "fh-ground", from: 0, to: T.end, checks: WORN, reason: "they stand on the plateau's far ground (its rubble humps)" })),
    { who: "wkT", with: "rel", from: T.tag, to: T.cover, checks: ["arm-in-prop"], reason: "the brush hand paints on the wall" },
    { who: "spudT", with: "rel", from: T.cover, to: T.end, reason: "his back pressed flat on the north wall over the marks (panel 35)" },
    { who: "spudT", with: "marks", from: T.cover, to: T.end, reason: "his back covers the painted marks, 4 mm off the wall (panel 35)" },
    { who: "wkT", with: "brush", from: 0, to: T.end, reason: "the worker holds the reed brush (grips.thin, kit grip bench)" },
    { who: "spudK", with: "kc", from: T.room, to: T.pov, reason: "he stands at the south wall of the closed granite room" },
  ],
  notes: "Generated by storyboards/series/ancient-aliens/01-pyramids/block-d/make-aa01-block-d.mjs. Spec: NOTES.md, PANELS.md next to it; kit/BLOCKS.md.",
});
