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
import { S, SET_NIGHT, CAST, VIEW, TOP, cam, far, giza2560, liftShip, host, nightOver, hostSay, lampClip, score, clueTag } from "../../kit/aa-kit.mjs";

const MOTION = { feet: 2, overlap: true, timing: true, solve: true };
const RIG = { hand: 2, eyes: 2, hold: 2 };
const WORN = ["clipping", "arm-in-prop", "hand-in-prop", "costume-in-prop"];
const c = clip({ faces: "strong" }), { A, sfx, cap, see } = c;
// every host line through the kit's hostSay (the say macro, voice "reaper", subtitle at y 400); a subtitle ends where the
// next one starts (two never stand on each other)
const subs = [];
const say = (t, line, dur, who, o = {}) => { hostSay(c, t, who, line, dur, o.tone ?? "calm", { pos: SUBY, ...o }); if (o.sub !== false) subs.push(c.captions[c.captions.length - 1]); };
const trimSubs = () => subs.sort((a, b) => a.from - b.from).forEach((q, i) => { const n = subs[i + 1]; if (n && q.to > n.from - 0.05) q.to = r3(n.from - 0.05); });

// ---------------------------------------------------------------- timing (block time; story time = 2:18 + t)
// spoken lengths: measure-lines.mjs (VoxCPM2, voice reaper; "Orion's Belt." read excited, the clue reveal)
const LEN = { belt: 1.38, star: 2.51, pyr: 1.76, shaft: 2.44, years: 2.29, us: 1.97, home: 2.51, closed: 1.21, nobody: 1.45 };
// v2 (kit/BLOCKS.md "How we explain", Jonny's OK on block A v2): a change at least every 3 s, every cut on a whole frame
const T = {
  night: 0, belt: 1.3, star: 3.0, starL: 3.15, pyr: 5.7, pyrL: 5.85,      // 2:18 panels 26-27
  room: 9.0, shaft: 9.4, hop: 9.55, pov: 12.0, years: 12.4,              // 2:27 panels 28-29
  home: 17.0, lift: 17.6, rise: 18.0, faces: 19.5, us: 19.6, climb: 22.0, home2: 22.1,   // 2:35 panels 30-31 (2 s with no voice)
  pay: 26.0, turn: 26.25, closed: 27.0,                                  // 2:44 panel 32, hold 2 s
  tag: 30.0, read: 31.8, see: 32.5, cover: 33.0, close: 34.2, nobody: 34.6,   // 2:48 panels 33-36
  end: 37.0,                                                             // 2:55
};
const TONE = { belt: "excited" };
// the number texts (read without English): big in the upper third, subtitles under them
const SUBY = 470, TXT = 300, TXTS = { size: 96, kinetic: false };
const count = (t0, t1, hold, a, b, fmt, o = {}) => {
  const n = Math.max(1, Math.round((t1 - t0) / 0.1));
  for (let i = 0; i <= n; i++) {
    const v = a + (b - a) * (1 - Math.pow(1 - i / n, 3)), ts = r3(t0 + i * 0.1);
    cap(ts, i === n ? hold : r3(ts + 0.1), fmt(i === n ? b : v), o.pos ?? TXT, false, { ...TXTS, ...o });
  }
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
  { id: "dot", kind: "ringship", x: P.home[0], y: -300, z: P.home[1], s: 0.09, beam: 0, lit: 1 },
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
// Start on the evidence: the sky, Orion's Belt climbing; the stars count in one by one; Spud points up. Then the camera
// pushes in on the Belt (the faint one off the line), then tilts down to the three pyramids: the same pattern below.
clueTag(c, 0, 17.0, 5);
c.prop(0.1, "n-orion", { show: 1, y: NIGHT_BELT.y }, 2.6, "out");
sfx(0, "ai/storm-wind", { gain: 0.06, dur: 9.0, reason: "the desert night, far under" });
for (const [t, k] of [[0.5, 1], [0.9, 2], [1.3, 3]]) cap(t, k === 3 ? 2.95 : r3(t + 0.4), Array(k).fill("☆").join(" "), TXT, false, { ...TXTS, size: 110 });
A(0.3, "spudN", "look", { to: [0.2, 0.7], dur: 0.35 });
A(0.6, "spudN", "grip", { side: "R", shape: "point", dur: 0.2 });
c.arm(0.6, "spudN", "R", { o: [0.18, 0.78, 0.22] }, 0.45, "out");
say(T.belt, "Orion's Belt.", LEN.belt, "spudN", { tone: TONE.belt });
say(T.starL, "The smallest star sits off the line.", LEN.star, "spudN");
cap(4.3, T.pyr - 0.05, "1 OFF THE LINE", TXT, false, { ...TXTS, size: 84 });
// he swings his point from the Belt down to the small pyramid on the left
c.arm(T.pyr + 0.1, "spudN", "R", { o: [0.3, 0.35, 0.3] }, 0.6, "inOut");
A(T.pyr + 0.1, "spudN", "look", { to: [-0.2, 0.15], dur: 0.4 });
say(T.pyrL, "So does the smallest pyramid.", LEN.pyr, "spudN");
cap(8.05, T.room - 0.05, "SAME PATTERN", TXT, false, { ...TXTS, size: 104 });
c.arm(8.3, "spudN", "R", "rest", 0.5, "inOut");
A(8.5, "spudN", "grip", { side: "R", shape: "relaxed", dur: 0.2 });
A(T.room - 0.25, "spudN", "noblink", { dur: 0.25 });
see(0.3, 3.0, ["n-orion"], "Orion's Belt rising, Spud pointing up");
see(T.pyr, T.room, ["n-orion", "spudN"], "the Belt over the three pyramids");

// ================================================================ 2 THE SHAFT (2:27, panels 28-29)
// Start on the evidence: the dark square of the south shaft in the granite; his headlamp beam finds it from below and he
// hops to see in (the sill is above his head: 0.92 m, he is 0.88). Then up the shaft to the same three stars, while the
// years count back from today to 2560 BC.
sfx(T.room + 0.05, "ai/step-concrete", { gain: 0.25, reason: "he steps up to the south wall" });
A(T.room + 0.05, "spudK", "look", { to: [0, 0.9], dur: 0.3 });
A(T.room + 0.05, "spudK", "pitch", { to: -9, dur: 0.4 });
say(T.shaft, "And this shaft pointed right at them.", LEN.shaft, "spudK");
A(T.hop, "spudK", "hop", { count: 2, height: 0.16, dur: 0.9 });
cap(10.4, T.pov - 0.05, "45°", TXT, false, { ...TXTS, size: 110 });
A(T.pov - 0.25, "spudK", "noblink", { dur: 0.25 });
see(T.room, T.pov, ["spudK", "kc"], "the south shaft, his headlamp on it, he hops to see in");
say(T.years, "Four and a half thousand years ago.", LEN.years, "spudK");
count(12.5, 14.6, T.home - 0.05, 2026, -2560, (v) => { const y = Math.round(v); return y < 0 ? `${-y} BC` : `${Math.max(1, y)} AD`; }, { size: 110 });
see(T.pov, T.home, ["sh-belt"], "the three stars at the top of the shaft");

// ================================================================ 3 THE SHIP GOES HOME (2:35, panels 30-31, 2560 BC)
// The beam goes out, the ring lifts off the tip; a crew alien waves it off and Spud copies the wave; the faces looking up;
// the ring climbs toward the Belt.
c.prop(T.lift, "sh-ship", { beam: 0, wobble: 0 }, 0.4, "inOut");
sfx(T.home, "rumble", { gain: 0.3, dur: 1.6, reason: "the ship's low hum over the pyramid" });
sfx(T.rise, "rumble", { gain: 0.45, dur: 3.5, reason: "the hum swells as the ring lifts away" });
c.prop(T.rise, "sh-ship", { x: P.home[0] - 4, y: 64, z: P.home[1] - 30 }, T.pay - T.rise, "in");
for (const id of ["spudH", "wkH", "crewH", "liftH"]) A(T.home + 0.1, id, "look", { to: [0, 0.8], dur: 0.4 });
c.arm(18.2, "crewH", "R", "wave", 0.35, "out");
c.arm(18.9, "spudH", "R", "wave", 0.35, "out");
A(18.85, "spudH", "look", { to: [0.4, 0.4], dur: 0.2 });
A(19.2, "spudH", "look", { to: [0.05, 0.9], dur: 0.3 });
c.arm(21.3, "crewH", "R", "rest", 0.5, "inOut"); c.arm(21.4, "spudH", "R", "rest", 0.5, "inOut");
say(T.us, "They didn't build it for us.", LEN.us, "spudH");
say(T.home2, "They built a signpost home.", LEN.home, "spudH");
A(T.pay - 0.25, "spudH", "noblink", { dur: 0.25 });
see(T.home, T.faces, ["sh-ship", "gh-pyr"], "the ring over the white pyramid lifts off");
see(T.faces, T.climb, ["spudH.face", "crewH.face"], "the faces looking up, the alien and Spud waving");
see(T.climb, T.pay, ["sh-ship", "h-belt"], "the ring climbs toward the Belt");

// ================================================================ 4 PAYOFF (2:44, panel 32)
// the big ring is gone; a point of light glides into line with the Belt; Spud turns to us: "Case closed."
c.prop(T.pay, "sh-ship", { y: -400 }, 0);
const DOT0 = [P.home[0] - 4, 64, P.home[1] - 30], DOT1 = [BELT_H[0] + 1.7 * 1.15 * ORI_DEG, BELT_H[1] + 1.7 * 0.74 * ORI_DEG, BELT_H[2]];
c.prop(T.pay, "dot", { x: DOT0[0], y: DOT0[1], z: DOT0[2] }, 0);
c.prop(T.pay + 0.05, "dot", { x: r3(DOT1[0]), y: r3(DOT1[1]), z: DOT1[2] }, 2.4, "out");
A(T.turn, "spudH", "turn", { to: 0, dur: 0.5 });
A(T.turn + 0.2, "spudH", "look", { to: [0, 0], dur: 0.3 });
A(T.turn + 0.4, "spudH", "expr", { expr: "deadpan", dur: 0.3 });
A(T.turn + 0.45, "spudH", "face", { lid: 0.4, brow: -0.25, dur: 0.3 });
say(T.closed, "Case closed.", LEN.closed, "spudH", { sub: false });
cap(27.35, T.tag - 0.05, "CASE CLOSED", TXT, false, { ...TXTS, size: 120 });
sfx(27.35, "step", { gain: 0.5, reason: "a dull stamp as the words land" });
A(T.tag - 0.25, "spudH", "noblink", { dur: 0.25 });
see(T.closed, T.tag, ["spudH.face", "dot"], "his face, the point of light in line with the Belt");

// ================================================================ 5 TAG (2:48, panels 33-36): the real answer
// Start on the evidence: the reed brush finishing the red marks, close. Spud leans in to read; the translation punches in
// ("FRIENDS OF KHUFU": the workers' own gang name); he slides over and presses his back flat on it; the words go with it.
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
cap(32.1, 33.25, "“FRIENDS OF KHUFU”", TXT, false, { ...TXTS, size: 84 });
A(T.see - 0.05, "spudT", "turn", { to: 330, dur: 0.35 });
act.shock(c, T.see, "spudT", { open: 0.15, eye: 1.2, curve: null, brow: 0.35, dur: 0.15, hold: 0.4 });
A(T.see + 0.1, "spudT", "look", { to: [0, 0], dur: 0.2 });
brush.carry(T.cover - 0.1, [r3(P.tag[0] + 0.62), 0.4, -1.75], 0.45);
A(T.cover - 0.25, "wkT", "look", { to: [-0.5, 0.1], dur: 0.2 });
A(T.cover - 0.1, "wkT", "move", { to: at(P.tag, 1.0, -1.7), dur: 0.45, steps: 2 });
A(T.cover, "spudT", "move", { to: at(P.tag, 0, -2.25), dur: 0.45, steps: 2 });
A(T.cover, "spudT", "turn", { to: 360, dur: 0.35 });
sfx(T.cover + 0.45, "pat", { gain: 0.5, reason: "his back meets the stone" });
c.arm(T.cover + 0.4, "spudT", "R", { o: [0.5, 0.5, -0.12] }, 0.6, "inOut");
c.arm(T.cover + 0.4, "spudT", "L", { o: [0.5, 0.5, -0.12] }, 0.6, "inOut");
A(T.cover + 0.4, "spudT", "grip", { side: "R", shape: "flat", dur: 0.5 });
A(T.cover + 0.4, "spudT", "grip", { side: "L", shape: "flat", dur: 0.5 });
A(T.cover + 0.5, "wkT", "look", { to: [-0.6, 0.1], dur: 0.25 });
A(T.cover + 0.6, "spudT", "expr", { expr: "deadpan", dur: 0.3 });
A(T.cover + 0.6, "spudT", "look", { to: [0, 0], dur: 0.2 });
A(T.close - 0.25, "spudT", "noblink", { dur: 0.25 });
A(T.close, "spudT", "expr", { expr: "deadpan", dur: 0.2 });
A(T.close + 0.05, "spudT", "face", { lid: 0.48, brow: -0.4, press: 0.6, dur: 0.25 });
say(T.nobody, "...nobody saw that.", LEN.nobody, "spudT", { sub: "...Nobody saw that." });
A(T.end - 0.3, "spudT", "noblink", { dur: 0.3 });
trimSubs();
see(T.tag, T.read, ["marks"], "the brush finishing the red marks");
see(T.read, T.cover, ["marks", "spudT"], "Spud reads the marks");
see(T.close, T.end, ["spudT.face"], "his deadpan look to us, the marks hidden behind him");

// ---------------------------------------------------------------- shots (a push or a move on every one)
const shot = (o, pos, look, fov, extra = {}) => ({ ...cam(o, { pos, look, fov }), ...extra });
const move = (a, b, dur, ease = "inOut") => ({ ...a, to: { pos: b.pos, look: b.look, fov: b.fov }, dur, ease });
const NB = [P.night[0] + NIGHT_BELT.x - P.night[0], NIGHT_BELT.y, NIGHT_BELT.z];   // the Belt in world metres
const SKY_A = shot(P.night, [-150, 0.9, 232], [-60, 58, 48], 34), SKY_B = shot(P.night, [-150, 1.0, 232], [-60, 44, 54], 32);
const BELT_A = { pos: SKY_B.pos, look: [r3(NB[0]), NB[1], r3(NB[2])], fov: 22 }, BELT_B = { ...BELT_A, fov: 15 };
const PYR_A = shot(P.night, [-150, 1.2, 232], [-56, 40, 56], 32), PYR_B = shot(P.night, [-150, 1.0, 230.5], [-56, 24, 56], 30);
const ROOM_A = shot(P.room, [4.0, 1.05, 1.7], [2.735, 1.0, 2.6], 42), ROOM_B = shot(P.room, [4.9, 0.85, 1.85], [2.7, 0.9, 2.4], 55);
const POV_A = shot(P.shaft, [0, 0.5, 0], [0, 10.5, 10], 26), POV_B = shot(P.shaft, [0, 1.9, 1.4], [0, 11.9, 11.4], 22);
const HOME_A = shot(P.home, [-30, 1.0, 216], [0, 31, 0], 26), HOME_B = shot(P.home, [-30, 1.0, 215.2], [0, 33, 0], 26);
const FACE_A = shot(P.home, [-29.0, 0.35, 205.9], [-29.0, 0.95, 209.5], 52), FACE_B = shot(P.home, [-29.0, 0.4, 206.4], [-29.0, 0.95, 209.5], 46);
const CLIMB_A = shot(P.home, [-30, 1.0, 216], [-2, 40, -10], 28), CLIMB_B = shot(P.home, [-30, 1.0, 216], [2, 58, -16], 26);
const PAY_A = shot(P.home, [-29.3, 0.62, 213.3], [-28.8, 1.95, 200], 30), PAY_B = shot(P.home, [-29.3, 0.62, 212.4], [-28.8, 1.95, 200], 30);
const MARK_A = shot(P.tag, [0.35, 0.65, -1.35], [0.15, 0.6, -2.6], 48), MARK_B = shot(P.tag, [0.3, 0.66, -1.15], [0.1, 0.6, -2.6], 52);
const WIDE_A = shot(P.tag, [0.25, 0.75, 0.9], [-0.15, 0.6, -2.6], 70), WIDE_B = shot(P.tag, [0.2, 0.74, 0.55], [-0.15, 0.6, -2.6], 70);
const CU_A = shot(P.tag, [0, 0.55, -0.35], [0, 0.78, -2.6], 50), CU_B = shot(P.tag, [0, 0.56, -0.6], [0, 0.76, -2.6], 50);
const beats = c.beats([
  ["orion rises", T.night, move(SKY_A, SKY_B, 3.0), "hook"],
  ["the smallest star", T.star, move(BELT_A, BELT_B, 2.7)],
  ["the smallest pyramid", T.pyr, move(PYR_A, PYR_B, 3.3)],
  ["the south shaft", T.room, move(ROOM_A, ROOM_B, 3.0)],
  ["up the shaft", T.pov, move(POV_A, POV_B, 5.0)],
  ["the ship goes home", T.home, move(HOME_A, HOME_B, 2.5), "reveal"],
  ["faces up", T.faces, move(FACE_A, FACE_B, 2.5)],
  ["toward the Belt", T.climb, move(CLIMB_A, CLIMB_B, 4.0)],
  ["case closed", T.pay, move(PAY_A, PAY_B, 4.0), "payoff"],
  ["the brush", T.tag, move(MARK_A, MARK_B, 1.8)],
  ["the marks", T.read, move(WIDE_A, WIDE_B, 2.4)],
  ["nobody saw that", T.close, move(CU_A, CU_B, 2.8), "reaction"],
], T.end);

write(import.meta.url, {
  id: "aa01-block-d",
  title: "Ancient aliens EP01 block D",
  idea: "Who really built the pyramids? 2:18-2:55: Orion's Belt over the three pyramids, the south shaft, the ring ship leaves for the Belt in 2560 BC, 'Case closed', and the workers' red marks Spud covers with his back",
  format: "series: Ancient aliens (Spud hosts with Reaper's voice, five numbered clues, the alien answer is the premise, the tag winks at the real one); block D of four, joined later",
  fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, captionStyle: "kinetic",
  captionBand: [210, 640],   // numbers at y 300, subtitles at y 470   // speech lettering in the upper third (Jonny 12 Nov)
  cleanStart: true, motion: MOTION, rig: RIG, physics: false, animeTiming: true,
  set: { ...SET_NIGHT, aperture: 0, focus: false, bloom: "emissive", hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true, satsuei: true },
  music: score(138),   // the pilot score from story 2:18 (kit score(): swell under the ship, out before the tag, pizzicato under it)
  sound: { sfx: 0.65, ambience: 0.06, guard: true, signature: false },
  creative: { length: [T.end, T.end] },
  hook: { show: ["spudN", "n-orion"], hint: 0, what: "block D opens mid-film on a hard cut: night over the three pyramids, Orion rising" },
  cast, props, captions: c.captions, beats, visible: c.visible,
  allowClip: [
    ...lampClip(["spudN", "spudK", "spudH", "spudT"], T.end),
    { who: "spudK", with: "spudK-lamp", from: T.room, to: T.pov, checks: ["shell"], reason: "the worn headlamp band squashes with his body as he hops (it sits on the skin)" },
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
