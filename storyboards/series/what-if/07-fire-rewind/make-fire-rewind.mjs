// YOU REWIND. ONLY YOU REMEMBER. (There's a catch, episode 7, the fire rewind). Jonny 13 Nov 2026: "sounds good create
// the whole story and panels" (06:04 Berlin) and "looks good create it" on the 16-panel board (06:21).
// Opener type B: the cold open IS loop 1's peak, and the cut back is the fire running backward (hook research Option B,
// /mnt/project-files/research/hook-ep07-fire-rewind-2026-11-13/reports/Fire rewind hook design.md). Stake-first line.
// Story: STORY.md here. Panels: board.png + PANELS.md here. New looks: DESIGN.md here (Fable). Places, cameras: NOTES.md.
//   node storyboards/series/what-if/07-fire-rewind/make-fire-rewind.mjs          -> fire-rewind.json
//   ... --no-vo -> fire-rewind-no-vo.json: without the narrator (staging and local drafts, no speech model)
//
// THE BRIEF
//   Want:     Spud wants to get his best friend Chip out of a burning block. He can rewind time; only he remembers.
//   Catch:    every rewind, the fire starts earlier (the lobby clock shows it).
//   Chain:    loop 1 he is thrown back by the fire, SO he rewinds; loop 2 he runs in past the alarm box, the stairs burst
//             earlier, SO he rewinds; loop 3 smoke is already inside, the neighbour shuts the door on him ("Go home,
//             kid."), the fire drives him down the stairs, the watch cracks, SO he cannot outrun it; SO on the last rewind
//             he does not run to Chip: he pulls the alarm the moment he lands; everyone is out before any fire shows, SO
//             they think he is crazy. Chip, mug in hand, alive beside him: "You're crazy." A curl of smoke proves him right.
//
// WORLD. Frame A, the street: the facade's outer face is z 0, the pavement y 0, x right as seen from the street, the
// origin on the pavement under the fire window (DESIGN 1.1 has every anchor). Frame B, inside: the firelobby prop at
// [0, 0, -40] (local +z toward the front door, the stair rises toward -z); world = local + LOB.
import { clip, write, r3 } from "../../../lib/clip.mjs";
import * as grips from "../../../lib/grips.mjs";

// ---------------------------------------------------------------- the template's picks (storyboards/templates)
const LOOK = "sheet", LIGHTING = 2, HATCH = { boil: 0.25 }, CEL = { at: 0.25 }, ANIME_TIMING = true;
const MOTION = { feet: 2, overlap: true, timing: true, solve: true }, RIG = { hand: 2, eyes: 2, hold: 2 }, PHYSICS = true;
const c = clip({ faces: "strong", lines: { sub: true, blink: false } }), { A, sfx, cap, see } = c;
const VO = !process.argv.includes("--no-vo");
// the builders' packs: until a file is in, its kinds are stood in for by boxes at the real sizes (the staging proof)
const READY = new Set((process.env.READY ?? "block,fire,nbrs").split(",").filter(Boolean));
const has = (pack) => READY.has(pack);
const box = (w, h, d) => ({ kind: "stoneblock", w, h, d });
const ph = (pack, final, stand) => (has(pack) ? final : { id: final.id, x: final.x, y: final.y ?? 0, z: final.z, ...(final.rot != null && { rot: final.rot }), ...stand });
const Pk = (pack, t, id, set, dur, ease) => { if (has(pack)) P(t, id, set, dur, ease); };   // params only the real pack knows

// ---------------------------------------------------------------- the beats (video s = story s)
// 01 loop 1 peak | 02 Chip at the glass | 03 the click | 04 the fire runs backward | 05 the calm | 06 loop 2, past the box |
// 07 the stairs burst | 08 eyes to the clock, click | 09 loop 3, smoke inside | 10 the neighbour | 11 the fall |
// 12 the low | 13 the box | 14 the last click | 15 the pull | 16 everyone out | 17 "You're crazy." | 18 the curl
const T = {
  burst: 0.8, chip: 1.0, ins: 1.9, click: 1.95, rew: 2.3, calm: 3.1, run2: 5.0, lobby2: 6.4, stair2: 7.4, face2: 9.4,
  click2: 11.45, rew2: 11.7, l3: 12.2, hall: 13.2, ndoor: 14.6, slam: 16.0, hfire: 16.2, fall: 16.9, low: 19.0,
  turn: 23.5, boxin: 24.9, ins3: 26.0, click3: 26.35, rew3: 26.6, fin: 27.1, pull: 27.75, out: 29.5, pay: 33.0,
  tag: 37.0, END: 39.0,
};
const END = T.END;
const DOWN = -60;   // parked under the floor
const PARK = [200, 0];   // off every set (a cast member out of the story)

const yawTo = ([x, z], [tx, tz]) => r3((Math.atan2(tx - x, tz - z) * 180) / Math.PI);
const place = (t, who, at, yaw, y) => { A(r3(t - 0.02), who, "move", { to: at, dur: 0.01, steps: 0, ease: "linear", sync: true, ...(y != null && { y }) }); A(r3(t - 0.02), who, "turn", { to: yaw, dur: 0.01, ease: "linear", sync: true }); };
const park = (t, who) => place(t, who, [PARK[0] + { spud: 0, chip: 3, nbr: 6 }[who], PARK[1]], 0, 0);
const expr = (t, who, e, set, dur = 0.12) => A(r3(t), who, "expr", { expr: e, ...(set && { set }), dur });
const P = (t, id, set, dur = 0.01, ease = "linear") => c.prop(r3(t), id, set, dur, ease);
const look = (t, who, to, dur = 0.2) => A(r3(t), who, "look", { to, dur, blink: false });
const SUBY = 470;    // speech lettering in the upper third, under the stake text, never over a face (Jonny 12 Nov)
const say = (t, who, line, dur, tone) => c.say(r3(t), who, line, dur, tone, { voice: false, sub: line, pos: SUBY });

// ---------------------------------------------------------------- places
// frame A (DESIGN 1.1)
const KNEEL = [-0.5, 1.9];              // where loop 1 threw him (frame 0); he stands here through the calm
const DOOR = [2.3, -0.12], DOOR_Y = 0.3;   // the threshold on the landing (steps 0.15 + 0.15)
const LEVER = [3.45, 0.58];            // where he stands to pull the box's lever
const LOWKNEEL = [2.75, 1.45];         // the low: on his knees 1.2 m from the box
const CHIP_PERCH = [-0.3, -0.3], CHIP_PERCH_Y = 2.9, CHIP_UP = 3.02, CHIP_LEAN = [-0.3, -0.16];   // left of the sash's middle bar
const BESIDE = { spud: [-0.6, 1.95], chip: [0.2, 2.25] };   // the payoff, in the frame-0 camera (16)
// frame B: the inside (local numbers + LOB)
const LOB = [0, 0, -40];
const L = (x, y, z) => [r3(x + LOB[0]), r3(y + LOB[1]), r3(z + LOB[2])];
const IN_DOOR = [0.2, -40.4], STAIR_FOOT = [1.7, -42.2], SKID = [0.5, -41.9];
const STAIR = { foot: -42.4, rise: 0.14, tread: 0.3, steps: 16, x: 1.7 };   // step j (1 = the bottom) tread middle
const stepAt = (j) => ({ z: r3(STAIR.foot - STAIR.tread * (j - 0.5)), y: r3(STAIR.rise * j) });
const HALL_Y = 2.24, KNOCK = [1.95, -49.9], NSTAND = [2.95, -49.75], WATCH_LANDS = [0.55, 0, -41.25];

const cast = [
  { id: "spud", character: "potatobrawl/spud", at: KNEEL, face: 18, expr: "terrified", follow: 0.3, seed: 1.3 },
  { id: "chip", character: "potatobrawl/chip", at: CHIP_PERCH, y: CHIP_UP, face: 0, expr: "terrified", follow: 0.3, seed: 4.4 },
  { id: "nbr", character: has("nbrs") ? "what-if/grumpy-neighbour" : "potatobrawl/mash", at: [206, 0], face: 0, expr: "annoyed", follow: 0.3, seed: 5.3 },
];

// ---------------------------------------------------------------- props
const NIL = { ...box(0.01, 0.01, 0.01), y: DOWN };
const CROWD = [   // DESIGN 4.1: h, dress, colour, hat, cap, angry; out of the door to their spot on the pavement
  [0.90, "pyjamas", "#7f9fd0", 0, null, 0.8, [3.6, 1.5]], [0.78, "bathrobe", "#d9c7a3", 2, "#a85a5a", 0.8, [1.9, 1.1]],
  [0.86, "pyjamas", "#9fc3a0", 2, "#9fc3a0", 0.3, [4.2, 2.3]], [0.74, "bathrobe", "#8a7fb4", 0, null, 0.8, [2.6, 2.6]],
  [0.92, "bathrobe", "#5f7f8f", 0, null, 0.8, [3.3, 2.9]], [0.80, "pyjamas", "#e0b3a0", 1, null, 0.3, [1.4, 2.5]],
  [0.84, "bathrobe", "#b7a1c8", 2, "#7a6a94", 0.8, [4.0, 1.0]],
];
const MUG = { id: "mug", kind: "teamug", x: 0, y: DOWN, z: 0, steam: 1 }, MUGB = { ...MUG, id: "mug2" };
const props = [
  // ---- the street (T1 props-fireblock.js; streetlamp + cobbles reused)
  ph("block", { id: "blk", kind: "fireblock", x: 0, y: 0, z: 0, sash: 0, door: 0, pull: 0, ring: 0, lights: 0.75, chip: 1, lobby: 1, fireroom: 0.15, lamp: 1 },
    { ...box(12, 10.6, 0.25), z: -0.125 }),
  { id: "lamp", kind: "streetlamp", x: -2.4, y: 0, z: 2.75, h: 3.2, lit: 1 },
  { id: "pave", kind: "cobbles", x: 0, y: 0, z: 1.6, w: 28, d: 3.2, seed: 4, leaves: 0 },
  { id: "road", kind: "cobbles", x: 0, y: -0.12, z: 7.19, w: 28, d: 7.6, seed: 9, leaves: 0 },
  // ---- the inside (T1): lobby + stair + hallway, the clock
  ph("block", { id: "lob", kind: "firelobby", x: LOB[0], y: 0, z: LOB[2], ndoor: 0, lit: 1 }, { ...box(5, 0.02, 7.2), x: 0, z: -43.6 }),
  ph("block", { id: "clk", kind: "lobbyclock", x: -0.9, y: 3.6, z: -47.17, r: 0.45, minutes: 610 }, { ...box(0.9, 0.9, 0.04), x: -0.9, y: 3.15, z: -47.17 }),
  // ---- the fire (T2 props-firerewind.js): every look a function of its own `time`
  ph("fire", { id: "ff", kind: "facadefire", x: 0, y: 1.15, z: 0, time: 10, grow: 1, curl: 0, low: 0, burstAt: 10.8 }, NIL),
  ph("fire", { id: "bf", kind: "blockfire", x: 0, y: 0, z: 0, time: 0, spread: 0 }, NIL),
  ph("fire", { id: "sf", kind: "stairfire", x: 1.7, y: 0, z: -42.4, time: 0, grow: 0, front: 0.25, at: 10, steps: 16, rise: 0.14, tread: 0.3, w: 1.6 }, NIL),
  ph("fire", { id: "fsL", kind: "floorsmoke", x: 0, y: 0, z: -43.6, box: [5, 7.2], time: 0, level: 0, drift: 0.25 }, NIL),
  ph("fire", { id: "fsH", kind: "floorsmoke", x: 1.7, y: HALL_Y, z: -51.2, box: [1.6, 8], time: 0, level: 0, drift: 0.25 }, NIL),
  { id: "hfire", kind: "flames", x: 1.7, y: HALL_Y, z: -54.4, fire: 0, scale: 1.6 },   // the hallway's far end bursting (loop 3)
  // ---- the watch (props-timewatch.js, from the stadium version) and Chip's mug (props-bonfire.js)
  { id: "watch", kind: "pocketwatch", x: 0, y: DOWN, z: 0, hands: 0, crack: 0, wind: 0, shake: 0, burst: 0, glint: 0, floor: -0.62 },
  // the same watch lying face up on the tiles, cracked, for the one insert 11b (the held one bounces off into the stair smoke)
  { id: "wdown", kind: "pocketwatch", x: 0, y: DOWN, z: 0, hands: -3, crack: 1, wind: 0, shake: 0, burst: 0, glint: 0, floor: -0.62, tip: -90, rot: 20, staged: "lies flat on the lobby tiles" },
  MUG, MUGB,
  // ---- the neighbours (T3: streetpotato dresses); waiting inside the door stub until they pour out
  ...CROWD.map(([h, dress, color, hat, capColor, angry], i) => ({ id: `n${i}`, kind: "streetpotato", x: r3(1.9 + (i % 3) * 0.4), y: DOWN, z: r3(-1.2 - Math.floor(i / 3) * 0.5), rot: 0,
    h, color, skin: "#f9b75c", ...(has("nbrs") ? { dress, hat, ...(capColor && { capColor }), angry } : { dress: "coat", hat: hat ? 1 : 0 }), walk: 0, sway: 0 })),
];

// seed every param that is first tweened later: an unseeded tween starts from undefined and writes NaN (stadium lesson)
for (const [pk, id, set] of [
  ["block", "blk", { sash: 0, door: 0, pull: 0, ring: 0, lights: 0.75, chip: 1, lobby: 1, fireroom: 0.15 }], ["block", "lob", { ndoor: 0 }], ["block", "clk", { minutes: 610 }],
  ["fire", "ff", { time: 10, grow: 1, curl: 0, low: 0 }], ["fire", "bf", { time: 0, spread: 0 }], ["fire", "sf", { time: 0, grow: 0, front: 0.25 }],
  ["fire", "fsL", { time: 0, level: 0 }], ["fire", "fsH", { time: 0, level: 0 }]]) Pk(pk, 0, id, set);
P(0, "watch", { hands: 0, crack: 0, shake: 0, glint: 0, wind: 0 }); P(0, "wdown", { hands: -3, crack: 0, shake: 0, glint: 0, wind: 0 }); P(0, "hfire", { fire: 0 });
CROWD.forEach((_, i) => P(0, `n${i}`, { walk: 0, ...(has("nbrs") && { angry: CROWD[i][5] }) }));

// the watch in Spud's right glove (props-timewatch.js grip "case": a fist under the case)
const watchIn = (t, side = "R", o = { o: [0.1, 0.6, 0.26] }) => {
  c.arm(r3(t), "spud", side, o, 0.01); A(r3(t), "spud", "grip", { side, shape: "fist", dur: 0.01 });
  A(r3(t + 0.01), "spud", "grab", { prop: "watch", hand: side, grip: "case", dur: 0, pose: null });
};
// a rewind: Spud and his watch keep their colour, the world goes grey (DESIGN 3.5, engine/shared/pause.js)
const PAUSES = [];
const rewind = (from, to) => PAUSES.push({ from: r3(from), to: r3(to), keep: ["spud"], origin: "spud", look: "grey", wave: 0.12, back: 0.25, grade: { sat: 0.1, bright: 0.9, contrast: 0.95 }, props: [{ id: "watch" }] });
const click = (t, why) => sfx(r3(t), "click", { gain: 0.9, loud: true, reason: why });
const fireBed = (from, to, gain = 0.5) => { for (let t = from; t < to - 0.2; t = r3(t + 5.5)) sfx(t, "ai/house-fire", { gain, dur: r3(Math.min(6, to - t)), reason: "the fire burning" }); };
const smokeAlarm = (from, to, gain = 0.18) => {   // a household smoke alarm's temporal-3: three 0.5 s beeps, 1.5 s off; low, behind glass
  for (let t = from; t < to - 0.4; t = r3(t + 3.0)) for (let k = 0; k < 3; k++) if (t + k * 0.5 < to - 0.4) sfx(r3(t + k * 0.5), "ai/smoke-alarm", { gain, dur: 0.45, reason: "the smoke alarm behind the glass" });
};

// ================================================================= 01-03 LOOP 1 PEAK (0-2.3): fire under Chip's window, the click
// Frame 0 (panel 01): flames out of the ground-floor window licking up to Chip's sill, a smoke band over his window, Chip's
// gloves on the glass; Spud on one knee on the pavement where the fire threw him, the watch already in his glove.
A(0, "spud", "crouch", { to: 0.75, dur: 0.01 }); A(0, "spud", "pitch", { to: -8, dur: 0.01 });
watchIn(0);
c.arm(0, "spud", "L", { o: [0.18, 0.2, 0.12] }, 0.01);   // his free glove on the cobbles, pushing up
expr(0, "spud", "terrified", { open: 0.35, brow: 0.8 }, 0.01); look(0, "spud", [-0.35, 0.75], 0.01);
A(0.35, "spud", "crouch", { to: 0.25, dur: 0.6, ease: "out" }); A(0.35, "spud", "pitch", { to: 0, dur: 0.6, ease: "out" });
c.arm(0.35, "spud", "L", { o: [0.22, 0.42, 0.1] }, 0.45, "out");
A(0, "chip", "move", { to: CHIP_PERCH, y: CHIP_UP, dur: 0.01, steps: 0, ease: "linear", sync: true });
c.arm(0, "chip", "R", { o: [0.06, 0.78, 0.3] }, 0.01); c.arm(0, "chip", "L", { o: [0.06, 0.74, 0.3] }, 0.01);   // both gloves on the glass
A(0, "chip", "grip", { side: "R", shape: "flat", dur: 0.01 }); A(0, "chip", "grip", { side: "L", shape: "flat", dur: 0.01 });
expr(0, "chip", "terrified", { open: 0.3, eye: 1.2 }, 0.01); look(0, "chip", [0.35, -0.6], 0.01);
// the fire: running forward with the clip (time 10 + t), the glass bursting at clip 0.8 (burstAt 10.8)
Pk("fire", 0, "ff", { time: 10, grow: 1, low: 0 }); Pk("fire", 0.01, "ff", { time: r3(10 + T.rew - 0.01) }, r3(T.rew - 0.02), "linear");
Pk("fire", T.chip, "ff", { low: 0.6 }, 0.8, "inOut");
sfx(T.burst, "ai/glass-smash", { gain: 0.6, reason: "the window under Chip's bursts" });
fireBed(0, T.click + 0.05, 0.55); smokeAlarm(0.1, T.click + 0.05);
cap(0, T.rew, "BEST FRIEND · 1 MINUTE", 255);
see(0, T.chip, ["spud.face", "chip.face", "ff"], "frame 0: the fire under Chip's window, Chip at the glass, Spud thrown back with the watch");
// 02 Chip at the glass (1.0-1.9): the smoke lowers, he presses his glove flat, his eyes go down to Spud
c.arm(T.chip + 0.2, "chip", "R", { o: [0.04, 0.6, 0.32] }, 0.25, "inOut");
sfx(r3(T.chip + 0.3), "ai/knock", { gain: 0.35, reason: "Chip's glove banging the glass, muffled" });
look(T.chip + 0.15, "chip", [0.2, -0.75], 0.15); expr(T.chip + 0.4, "chip", "terrified", { open: 0.45, eye: 1.3, brow: 0.9 }, 0.15);
see(T.chip, T.ins, ["chip.face"], "Chip behind the glass, the smoke coming down over his window");
// 03 the click (1.9-2.3): the watch in Spud's glove, his thumb on the crown, the hands spin back
P(T.click, "watch", { hands: -3, glint: 1 }, r3(T.calm - T.click), "in");
click(T.click, "the watch crown clicks: the rewind");
expr(T.ins, "spud", "focused", { brow: 0.9, open: 0.05 }, 0.1);
see(T.ins, T.rew, ["watch"], "the watch: his thumb clicks the crown, the hands spin backward");

// ================================================================= 04 THE FIRE RUNS BACKWARD (2.3-3.1), 05 THE CALM (3.1-5.0)
// The world goes grey but Spud; the fire pours back into the building at 3x, the glass flies back up into the window.
rewind(T.rew, r3(T.calm - 0.07));   // ends a beat before the cut, so Chip can be placed for the calm
Pk("fire", T.rew, "ff", { time: 9.9 }, r3(T.calm - T.rew), "in");   // 12.3 -> 9.9: the glass re-seats at about clip 2.8
Pk("fire", T.rew, "ff", { grow: 0, low: 0 }, r3(T.calm - T.rew), "in");
A(T.rew, "spud", "crouch", { to: 0, dur: 0.6, ease: "inOut" });   // he gets up, the only thing moving forward
A(T.rew + 0.1, "spud", "turn", { to: 160, dur: 0.6, ease: "inOut" });
look(T.rew + 0.2, "spud", [0, 0.6], 0.3);
sfx(r3(T.rew + 0.05), "ai/heartbeat", { gain: 0.5, reason: "the world stopped: only his heart" });
see(T.rew, T.calm, ["spud", "ff"], "the fire runs backward into the window; grey world, Spud in colour");
// 05 the calm (cut on the colour coming back): Chip leaning out of his open sash with a mug, waving down. Knows nothing.
const CALM0 = r3(T.calm - 0.05);
Pk("block", CALM0, "blk", { sash: 1 });
A(CALM0, "chip", "move", { to: CHIP_LEAN, y: CHIP_PERCH_Y, dur: 0.01, steps: 0, ease: "linear", sync: true });
c.arm(CALM0, "chip", "L", "rest", 0.01); A(CALM0, "chip", "grip", { side: "L", shape: "relaxed", dur: 0.01 });
const hMug = grips.mug(c, "chip", { ...MUG, ...grips.placeFor("teamug", [-0.55, CHIP_PERCH_Y + 0.25, -0.02], 0) }, { side: "R" });
P(r3(CALM0 - 0.01), "mug", { ...grips.placeFor("teamug", [-0.55, CHIP_PERCH_Y + 0.25, -0.02], 0) });
hMug.secure(CALM0, 0.01);
expr(T.calm, "chip", "happy", { curve: 0.6 }, 0.01); look(T.calm, "chip", [0.35, -0.55], 0.01);
c.arm(T.calm + 0.35, "chip", "L", "wave", 0.3, "out"); c.arm(T.calm + 0.8, "chip", "L", { o: [0.2, 1.05, 0.1] }, 0.25); c.arm(T.calm + 1.1, "chip", "L", "wave", 0.25);
place(T.calm, "spud", KNEEL, 160); A(r3(T.calm - 0.02), "spud", "crouch", { to: 0, dur: 0.01 });
expr(T.calm, "spud", "shocked", { open: 0.3, eye: 1.15 }, 0.01); look(T.calm, "spud", [0.2, 0.7], 0.01);
A(T.calm + 0.2, "spud", "squash", { amount: 0.05, dur: 0.5 }); A(T.calm + 0.9, "spud", "squash", { amount: 0.05, dur: 0.5 });   // chest heaving
sfx(T.calm, "ai/warm-resolve", { gain: 0.25, reason: "the calm warm street" });
see(T.calm, T.run2, ["chip.face", "spud", "mug"], "the same block, no fire: Chip leans out with a mug and waves; Spud stares up");

// ================================================================= 06 LOOP 2 (5.0-7.4): in through the door, past the alarm box
// panel 05: Spud sprints in at the front door; the red alarm box on the wall beside it at his shoulder (>= 0.6 s in frame).
park(T.run2, "chip"); A(r3(T.run2 + 0.05), "chip", "release", { prop: "mug", to: [203.5, 0, 0.6], dur: 0.2 });   // the let-go drops at his park spot, off screen
A(T.run2, "spud", "turn", { to: yawTo(KNEEL, DOOR), dur: 0.15 });
expr(T.run2, "spud", "focused", { brow: 1, open: 0.2 }, 0.1);
A(r3(T.run2 + 0.1), "spud", "move", { to: [2.25, 0.75], dur: 0.6, ease: "in", stride: 1.3 });
A(r3(T.run2 + 0.7), "spud", "move", { to: DOOR, y: DOOR_Y, dur: 0.45, ease: "linear", stride: 1.2 });   // up the two steps
Pk("block", r3(T.run2 + 0.75), "blk", { door: 1 }, 0.3, "out");
A(r3(T.run2 + 1.15), "spud", "move", { to: [2.3, -0.9], y: DOOR_Y, dur: 0.35, ease: "linear", stride: 1.2 });
sfx(r3(T.run2 + 0.15), "ai/step-concrete", { gain: 0.5, reason: "running on the cobbles" });
sfx(r3(T.run2 + 0.8), "slam", { gain: 0.35, reason: "the front door banging open" });
see(T.run2, T.lobby2, ["spud", "blk"], "loop 2: he sprints in through the front door, past the red alarm box");
// the lobby: through the door, across the tiles toward the stair
place(T.lobby2, "spud", IN_DOOR, 180, 0);
A(T.lobby2, "spud", "move", { to: SKID, dur: 0.9, ease: "out", stride: 1.3 });
Pk("block", 0, "clk", { minutes: 600 });   // 10:00 in loop 2 (DESIGN 7.1: 10 minutes earlier a loop)
sfx(r3(T.lobby2 + 0.1), "ai/step-concrete", { gain: 0.5, reason: "running across the lobby tiles" });

// ================================================================= 07 THE STAIRS BURST (7.4-9.4): earlier than last time
// panel 06: the staircase ahead bursts into flame under the clock; Spud skids, arm up against the heat.
Pk("fire", 0, "sf", { time: 0 }); Pk("fire", r3(T.stair2 - 0.3), "sf", { time: 9.7, grow: 1, front: 0.25 });
Pk("fire", r3(T.stair2 - 0.29), "sf", { time: r3(9.7 + T.rew2 - T.stair2 + 0.29) }, r3(T.rew2 - T.stair2 + 0.29), "linear");
A(T.stair2, "spud", "move", { to: [0.4, -41.5], y: 0, dur: 0.35, ease: "out", steps: 0 });
A(T.stair2, "spud", "pitch", { to: -12, dur: 0.15, ease: "out" }); A(r3(T.stair2 + 0.6), "spud", "pitch", { to: 0, dur: 0.4 });
c.arm(T.stair2, "spud", "L", { o: [0.12, 0.95, 0.28] }, 0.15, "out");   // arm up against the heat
expr(T.stair2, "spud", "terrified", { open: 0.35, eye: 1.25 }, 0.08);
sfx(T.stair2, "ai/flare", { gain: 0.9, loud: true, reason: "the stair bursting into flame" });
fireBed(T.stair2, T.click2 + 0.05, 0.5);
see(T.stair2, T.face2, ["spud", "sf", "clk"], "the stairs burst into flame under the lobby clock, earlier than last time");
// 08 eyes to the clock, the click (9.4-11.7)
expr(T.face2, "spud", "terrified", { open: 0.15, brow: 0.9 }, 0.1); look(T.face2, "spud", [0.3, 0.1], 0.1);
look(T.face2 + 0.7, "spud", [-0.45, 0.6], 0.18);   // up to the clock
expr(T.face2 + 1.2, "spud", "focused", { brow: 1 }, 0.15);
watchIn(r3(T.face2 + 1.3), "R", { o: [0.1, 0.62, 0.24] });
c.arm(T.face2 + 1.6, "spud", "L", { o: [0.04, 0.64, 0.26] }, 0.3, "inOut");   // the other thumb onto the crown
P(T.click2, "watch", { hands: -6 }, 0.7, "in");
click(T.click2, "the crown clicks: the second rewind");
see(T.face2, T.rew2, ["spud.face"], "his eyes go from the flames up to the clock; he clicks the watch");
// the short rewind (0.5 s): the stair fire sucked back in, grey
rewind(T.rew2, T.l3);
Pk("fire", T.rew2, "sf", { time: 9.9, grow: 0 }, r3(T.l3 - T.rew2 - 0.02), "in");

// ================================================================= 09 LOOP 3 (12.2-14.6): smoke already inside; up the stairs
// He lands where he clicked (the lobby). Smoke rolls along the floor already; the stair is still clear: he runs up.
Pk("block", r3(T.l3 - 0.02), "clk", { minutes: 590 });   // 9:50 now
Pk("fire", r3(T.l3 - 0.02), "fsL", { time: T.l3, level: 0.5 }); Pk("fire", T.l3, "fsL", { time: END }, r3(END - T.l3), "linear");
Pk("fire", r3(T.hall + 0.5), "fsL", { level: 0.12 }, 2.5, "inOut");   // off screen: the lobby smoke thins as the hallway draws it up the stairs, so the watch reads on the tiles
Pk("fire", r3(T.l3 - 0.02), "fsH", { time: T.l3, level: 0.75 }); Pk("fire", T.l3, "fsH", { time: END }, r3(END - T.l3), "linear");
place(T.l3, "spud", [0.6, -41.3], 150, 0); A(r3(T.l3 - 0.02), "spud", "pitch", { to: 0, dur: 0.01 });
c.arm(r3(T.l3 - 0.02), "spud", "L", "rest", 0.01);
expr(T.l3, "spud", "focused", { brow: 1, open: 0.15 }, 0.01);
A(r3(T.l3 + 0.15), "spud", "move", { to: STAIR_FOOT, dur: 0.35, ease: "in", stride: 1.3 });
A(r3(T.l3 + 0.5), "spud", "climb", { to: [STAIR.x, stepAt(8).z], steps: 8, dur: 0.6 });
smokeAlarm(T.l3, T.slam, 0.3);
sfx(r3(T.l3 + 0.15), "ai/step-concrete", { gain: 0.5, reason: "running to the stair" });
see(T.l3, T.hall, ["spud", "fsL"], "loop 3: smoke already rolls over the lobby floor; he runs up the stairs");
// the hallway: he bangs on the first door with both gloves
place(T.hall, "spud", KNOCK, 90, HALL_Y);
c.arm(T.hall, "spud", "R", { o: [-0.02, 0.75, 0.36] }, 0.12, "out"); c.arm(T.hall, "spud", "L", { o: [-0.02, 0.7, 0.36] }, 0.12, "out");
A(T.hall, "spud", "grip", { side: "R", shape: "fist", dur: 0.05 }); A(T.hall, "spud", "grip", { side: "L", shape: "fist", dur: 0.05 });
for (let k = 0; k < 4; k++) { const t = r3(T.hall + 0.2 + k * 0.28); c.arm(t, "spud", k % 2 ? "L" : "R", { o: [-0.02, 0.72, 0.42] }, 0.08, "in"); c.arm(r3(t + 0.1), "spud", k % 2 ? "L" : "R", { o: [-0.02, 0.74, 0.3] }, 0.12, "out"); sfx(r3(t + 0.08), "ai/knock", { gain: 0.7, reason: "Spud banging on the neighbour's door" }); }
expr(T.hall, "spud", "terrified", { open: 0.4 }, 0.1);
see(T.hall, T.ndoor, ["spud", "lob"], "the hallway, smoke along the floor: Spud bangs on a door with both gloves");

// ================================================================= 10 THE NEIGHBOUR (14.6-16.2): "Go home, kid."
place(T.ndoor, "nbr", NSTAND, -90, HALL_Y);
Pk("block", T.ndoor, "lob", { ndoor: 0.45 }, 0.35, "out");
sfx(T.ndoor, "creak", { gain: 0.25, reason: "the neighbour's door opening a crack" });
A(r3(T.ndoor - 0.02), "spud", "turn", { to: 35, dur: 0.01 }); look(T.ndoor, "spud", [0.6, 0.15], 0.01);
c.arm(T.ndoor, "spud", "R", "rest", 0.3); c.arm(T.ndoor, "spud", "L", { o: [0.15, 0.6, 0.3] }, 0.3);   // pleading
expr(T.ndoor, "spud", "terrified", { open: 0.35, brow: 1 }, 0.12);
expr(T.ndoor, "nbr", "annoyed", { brow: -0.5 }, 0.01); look(T.ndoor, "nbr", [-0.1, -0.15], 0.01);
say(r3(T.ndoor + 0.3), "nbr", "Go home, kid.", 1.0, "annoyed");
c.arm(r3(T.ndoor + 0.4), "nbr", "R", "wave", 0.25); c.arm(r3(T.ndoor + 0.75), "nbr", "R", { o: [0.25, 0.7, 0.3] }, 0.2); c.arm(r3(T.ndoor + 1.0), "nbr", "R", "wave", 0.2);
Pk("block", r3(T.slam - 0.15), "lob", { ndoor: 0 }, 0.15, "in");
sfx(T.slam, "slam", { gain: 0.6, reason: "the neighbour slams his door" });
see(T.ndoor, T.slam, ["nbr.face", "spud.face"], "the grumpy neighbour in curlers waves him off: Go home, kid.");

// ================================================================= 11 THE FALL (16.2-19.0): the fire drives him down the stairs
park(T.hfire, "nbr");
P(T.hfire, "hfire", { fire: 1 }, 0.35, "out");   // the hallway's far end bursts (toward Chip's flat): he can't get through
sfx(T.hfire, "ai/flare", { gain: 0.8, loud: true, reason: "flames bursting at the end of the hallway" });
c.arm(T.slam, "spud", "R", "rest", 0.3); c.arm(T.slam, "spud", "L", "rest", 0.3);
A(T.hfire, "spud", "turn", { to: 180, dur: 0.35 }); expr(T.hfire, "spud", "terrified", { open: 0.4, eye: 1.3 }, 0.08);
// the stair: the fire rolls down after him from the top; he falls back down the steps; the watch flies, cracks on the tiles
Pk("fire", r3(T.fall - 0.02), "sf", { time: 9.95, grow: 1, front: 0.1 });
Pk("fire", T.fall, "sf", { time: r3(9.95 + T.low - T.fall) }, r3(T.low - T.fall), "linear");
Pk("fire", T.fall, "sf", { front: 0.8 }, 1.8, "inOut");
place(T.fall, "spud", [STAIR.x, stepAt(9).z], 0, stepAt(9).y);   // facing up the stair (the fire), backing down
expr(T.fall, "spud", "terrified", { open: 0.45, eye: 1.3 }, 0.01); look(T.fall, "spud", [0, 0.5], 0.01);
watchIn(r3(T.fall - 0.02), "R", { o: [0.18, 0.55, 0.15] });
A(T.fall, "spud", "move", { to: [STAIR.x, stepAt(6).z], y: stepAt(6).y, dur: 0.5, ease: "linear", steps: 0 });
A(r3(T.fall + 0.5), "spud", "pitch", { to: -35, dur: 0.25, ease: "in" });   // his heel misses a step
A(r3(T.fall + 0.5), "spud", "move", { to: [STAIR.x, stepAt(1).z], y: stepAt(1).y, dur: 0.6, ease: "in", steps: 0 });
c.arm(r3(T.fall + 0.5), "spud", "L", { o: [0.3, 0.9, 0.1] }, 0.2, "out");
A(r3(T.fall + 0.62), "spud", "release", { prop: "watch", to: WATCH_LANDS, dur: 0.5 });   // out of his glove onto the tiles
// off screen it bounces to a stop under the newel post in the stair smoke; at the cut it lies face up in the clear
P(r3(T.fall + 1.03), "wdown", { x: WATCH_LANDS[0], y: 0.011, z: WATCH_LANDS[2] }); P(r3(T.fall + 1.2), "wdown", { crack: 1 }, 0.25, "out"); P(r3(T.low - 0.02), "wdown", { y: DOWN });
P(r3(T.fall + 1.2), "watch", { crack: 1 }, 0.25, "out");
sfx(r3(T.fall + 1.19), "hit-glass", { gain: 0.6, reason: "the watch glass cracking on the tiles" });
A(r3(T.fall + 1.1), "spud", "move", { to: [1.5, -41.9], y: 0, dur: 0.3, ease: "out", steps: 0 });
A(r3(T.fall + 1.1), "spud", "pitch", { to: -70, dur: 0.3, ease: "out" });
sfx(r3(T.fall + 1.1), "ai/crunch", { gain: 0.3, reason: "landing on the tiles" });
sfx(T.fall, "ai/flare", { gain: 0.6, reason: "the fire rolling down the stairs" });
fireBed(T.fall, T.low, 0.55);
see(T.fall, r3(T.fall + 1.05), ["spud.face", "sf"], "the fire rolls down the stairs; he falls; the watch cracks on the tiles");

// ================================================================= 12 THE LOW (19.0-23.5): the whole block ablaze
// panel 11: on his knees on the pavement, small; the block on fire; Chip's shape in his window, the flames never on him.
place(T.low, "spud", LOWKNEEL, 200); A(r3(T.low - 0.02), "spud", "pitch", { to: 6, dur: 0.01 }); A(r3(T.low - 0.02), "spud", "crouch", { to: 0.9, dur: 0.01 });
P(r3(T.low - 0.03), "watch", { crack: 1 }); watchIn(r3(T.low - 0.02), "L", { o: [0.1, 0.45, 0.22] });
expr(T.low, "spud", "sad", { open: 0.1, eye: 0.9 }, 0.01); look(T.low, "spud", [0, 0.7], 0.01);
A(T.low, "chip", "move", { to: CHIP_PERCH, y: CHIP_UP, dur: 0.01, steps: 0, ease: "linear", sync: true });
A(T.low, "chip", "turn", { to: 0, dur: 0.01 }); c.arm(T.low, "chip", "R", { o: [0.06, 0.78, 0.3] }, 0.01); c.arm(T.low, "chip", "L", { o: [0.06, 0.74, 0.3] }, 0.01);
expr(T.low, "chip", "terrified", { open: 0.3 }, 0.01);
Pk("block", r3(T.low - 0.02), "blk", { sash: 0, door: 0 });
Pk("fire", r3(T.low - 0.02), "ff", { time: 19, grow: 1, low: 0.4 }); Pk("fire", T.low, "ff", { time: r3(19 + T.rew3 - T.low) }, r3(T.rew3 - T.low), "linear");
Pk("fire", r3(T.low - 0.02), "bf", { time: 19, spread: 1 }); Pk("fire", T.low, "bf", { time: r3(19 + T.rew3 - T.low) }, r3(T.rew3 - T.low), "linear");
fireBed(T.low, T.click3 + 0.05, 0.6); smokeAlarm(T.low, T.click3, 0.15);
sfx(r3(T.low + 1.0), "siren", { gain: 0.12, reason: "a fire engine far off, too late" });
see(T.low, T.turn, ["spud", "chip", "bf"], "the low: the whole block ablaze, Spud small on his knees, Chip's shape in his window");

// ================================================================= 13 THE BOX (23.5-26.0): his eyes land on the alarm box
look(T.turn, "spud", [0.55, 0.05], 0.25); expr(r3(T.turn + 0.4), "spud", "focused", { brow: 0.9, open: 0.05 }, 0.25);
A(r3(T.turn + 0.2), "spud", "turn", { to: yawTo(LOWKNEEL, [3.45, 0.05]), dur: 0.6, ease: "inOut" });
sfx(r3(T.turn + 0.3), "ai/heartbeat", { gain: 0.45, reason: "the idea" });
see(T.turn, T.boxin, ["spud.face"], "his eyes land on the red alarm box beside the door");
// 14 the last click (26.0-26.6): the cracked watch, a shaking thumb
watchIn(r3(T.ins3 - 0.02), "L", { o: [-0.1, 0.6, 0.26] });   // up in front of him, as in the first click
P(T.ins3, "watch", { shake: 1 }, 0.1); P(T.click3, "watch", { hands: -9, shake: 0 }, 0.6, "in");
click(T.click3, "the cracked watch's crown clicks: the last rewind");
// the last rewind (26.6-27.1): the whole block's fire sucked back in, the glass back in the window, grey
rewind(T.rew3, T.fin);
Pk("fire", T.rew3, "ff", { time: 10, grow: 0, low: 0 }, r3(T.fin - T.rew3 - 0.02), "in");
Pk("fire", T.rew3, "bf", { time: 0, spread: 0 }, r3(T.fin - T.rew3 - 0.02), "in");
A(r3(T.rew3 + 0.05), "spud", "crouch", { to: 0, dur: 0.35, ease: "out" }); A(r3(T.rew3 + 0.05), "spud", "pitch", { to: 0, dur: 0.35 });

// ================================================================= 15 THE PULL (27.1-29.5): he lands and pulls at once
// panel 14: no fire anywhere; Spud yanks the red lever down with his whole body, the bell above it rings.
park(r3(T.fin + 0.04), "chip");
Pk("fire", r3(T.fin - 0.01), "fsL", { level: 0 }); Pk("fire", r3(T.fin - 0.01), "fsH", { level: 0 });
A(T.fin, "spud", "turn", { to: yawTo(LOWKNEEL, LEVER), dur: 0.12 });
A(r3(T.fin + 0.05), "spud", "move", { to: [LEVER[0], r3(LEVER[1] + 0.12)], dur: 0.55, ease: "inOut", stride: 1.2 });
A(r3(T.fin + 0.55), "spud", "turn", { to: 180, dur: 0.12 });
c.arm(r3(T.pull - 0.15), "spud", "R", { world: [3.45, 0.7, 0.13] }, 0.15, "out"); A(r3(T.pull - 0.1), "spud", "grip", { side: "R", shape: "fist", dur: 0.08 });
c.arm(T.pull, "spud", "R", { world: [3.45, 0.6, 0.17] }, 0.2, "in"); A(T.pull, "spud", "crouch", { to: 0.3, dur: 0.2 });
Pk("block", T.pull, "blk", { pull: 1 }, 0.2, "in"); Pk("block", r3(T.pull + 0.2), "blk", { ring: 1 }, 0.05);
expr(T.pull, "spud", "focused", { brow: 1, open: 0.3 }, 0.1);
sfx(r3(T.pull + 0.18), "latch", { gain: 0.5, reason: "the alarm lever clacking down" });
for (let t = r3(T.pull + 0.2); t < T.pay - 0.1; t = r3(t + 2)) sfx(t, "alarmbell", { gain: 0.45, dur: r3(Math.min(2, T.pay - t)), reason: "the building's fire bell ringing" });
see(T.fin, T.out, ["spud", "blk"], "the last loop: he lands and pulls the alarm before any fire shows; the bell rings");

// ================================================================= 16 EVERYONE OUT (29.5-33.0): furious neighbours; Chip last
// panel 15: neighbours in pyjamas and bathrobes pour out of the door onto the pavement; the curler neighbour jabs a glove at
// Spud; Chip comes out last with his mug.
Pk("block", r3(T.out - 0.02), "blk", { door: 1, pull: 1, ring: 1 });
A(r3(T.out - 0.02), "spud", "crouch", { to: 0, dur: 0.01 }); c.arm(r3(T.out - 0.02), "spud", "R", "rest", 0.01); A(r3(T.out - 0.02), "spud", "grip", { side: "R", shape: "relaxed", dur: 0.01 });
c.arm(r3(T.out - 0.02), "spud", "L", { o: [0.12, 0.42, 0.18] }, 0.01);   // the cracked watch still in his glove
place(T.out, "spud", [1.5, 2.3], 160, 0); expr(T.out, "spud", "sheepish", null, 0.01);
CROWD.forEach(([, , , , , , to], i) => {
  const t0 = r3(T.out + 0.15 * i), from = [2.3, -0.6], d = r3(Math.hypot(to[0] - from[0], to[1] - from[1]));
  P(r3(t0 - 0.02), `n${i}`, { x: from[0], y: DOOR_Y, z: from[1], rot: yawTo(from, to), walk: 0 });
  P(t0, `n${i}`, { x: to[0], y: 0, z: to[1], walk: d }, r3(d / 1.1), "linear");
  P(r3(t0 + d / 1.1), `n${i}`, { rot: yawTo(to, [1.5, 2.3]) }, 0.25);
});
place(T.out, "nbr", [2.3, -0.4], 0, DOOR_Y);
A(r3(T.out + 0.3), "nbr", "move", { to: [3.0, 1.0], y: 0, dur: 1.0, ease: "inOut", stride: 0.9 });
A(r3(T.out + 1.3), "nbr", "turn", { to: yawTo([3.0, 1.0], [1.5, 2.3]), dur: 0.2 });
expr(r3(T.out + 1.3), "nbr", "angry", { brow: -0.6 }, 0.15);
c.arm(r3(T.out + 1.5), "nbr", "R", "point", 0.2, "out");
for (let k = 0; k < 3; k++) c.arm(r3(T.out + 1.8 + k * 0.3), "nbr", "R", { o: [0.2, 0.62 + (k % 2) * 0.06, 0.42] }, 0.12);
sfx(r3(T.out + 0.2), "ai/step-concrete", { gain: 0.35, reason: "slippers on the steps" });
// Chip last, with his mug, confused
place(r3(T.out + 1.4), "chip", [2.3, -0.5], 0, DOOR_Y);
const MUG2 = { ...MUGB, ...grips.placeFor("teamug", [2.52, DOOR_Y + 0.3, -0.3], 0) };
P(r3(T.out + 1.36), "mug2", MUG2); grips.mug(c, "chip", MUG2, { side: "L" }).secure(r3(T.out + 1.38), 0.01);
c.arm(r3(T.out + 1.5), "chip", "L", { o: [0.1, 0.5, 0.24] }, 0.25);   // carried at his chest, on the side away from Spud
A(r3(T.out + 1.5), "chip", "move", { to: [1.85, 1.3], y: 0, dur: 1.4, ease: "inOut", stride: 0.6 });
expr(r3(T.out + 1.5), "chip", "shocked", { open: 0.1, brow: 0.3 }, 0.1);
see(r3(T.out + 1.5), T.pay, ["nbr.face", "spud"], "everyone out before any fire: furious neighbours, the curler neighbour points at Spud, Chip last with his mug");

// ================================================================= 17 "YOU'RE CRAZY." (33.0-37.0): frame 0 again, the block whole
Pk("block", r3(T.pay - 0.02), "blk", { lights: 0.17, chip: 0.25, ring: 0 });
place(T.pay, "spud", BESIDE.spud, 25); place(T.pay, "chip", BESIDE.chip, -10);
expr(T.pay, "spud", "sad", { curve: 0.1 }, 0.01); look(T.pay, "spud", [0.5, -0.1], 0.01);
expr(T.pay, "chip", "annoyed", { brow: 0.4 }, 0.01); look(T.pay, "chip", [-0.5, 0.1], 0.01);
c.arm(r3(T.pay - 0.02), "chip", "L", "rest", 0.01);
say(r3(T.pay + 2.5), "chip", "You're crazy.", 1.0, "deadpan");
expr(r3(T.pay + 3.0), "spud", "kind", { curve: 0.5 }, 0.3);   // he looks at Chip, alive, and smiles
see(T.pay, T.tag, ["spud.face", "chip.face", "mug2"], "the frame-0 camera again, the block dark and whole: Chip alive beside him: You're crazy.");
// 18 the tag (37.0-39.0): a thin curl of smoke out of the ground-floor window that nobody sees
Pk("fire", r3(T.tag - 0.5), "ff", { time: T.tag, curl: 0 }); Pk("fire", r3(T.tag - 0.49), "ff", { time: END, curl: 1 }, r3(END - T.tag + 0.49), "linear");
sfx(r3(T.tag + 0.3), "ai/grass-fire", { gain: 0.12, dur: 1.6, reason: "a faint crackle under the last note" });
see(T.tag, END, ["ff", "spud", "chip"], "a thin curl of smoke slips out of the ground-floor window behind them; nobody sees it");

// ---------------------------------------------------------------- shots (frame A: the street; frame B: inside)
const SH = {
  hook:   { pos: [0.5, 0.5, 5.6], look: [-0.45, 2.3, -0.35], fov: 56 },   // Spud low left, Chip's window upper right
  chip:   { pos: [-0.1, 3.1, 1.3], look: [-0.3, 3.25, -0.3], fov: 38 },
  ins:    { pos: [-0.75, 0.82, 2.72], look: [-0.88, 0.7, 2.33], fov: 34 },
  calm:   { pos: [0.5, 0.55, 5.2], look: [-0.45, 2.35, -0.35], fov: 54, to: { pos: [0.45, 0.6, 4.8], look: [-0.42, 2.4, -0.35], fov: 52 }, dur: 1.9, ease: "inOut" },
  door:   { pos: [1.2, 1.0, 3.1], look: [2.6, 0.9, 0], fov: 46 },
  lobby:  { pos: [0.3, 1.6, -40.2], look: [0.5, 1.3, -46.5], fov: 66 },
  face2:  { pos: [-0.6, 0.8, -43.9], look: [0.4, 0.62, -42.1], fov: 42 },
  l3:     { pos: [0.1, 1.3, -40.15], look: [1.79, 1.1, -43.78], fov: 64 },
  hall:   { pos: [1.2, 3.1, -47.6], look: [2.1, 2.8, -50.2], fov: 50 },
  nbr:    { pos: [1.1, 2.95, -48.2], look: [2.6, 2.85, -50.0], fov: 48 },
  hfire:  { pos: [1.05, 2.7, -48.6], look: [1.9, 3.0, -54.4], fov: 56 },
  fall:   { pos: [1.5, 0.9, -40.8], look: [1.7, 1.2, -44.5], fov: 52 },
  low:    { pos: [0.8, 1.15, 9.6], look: [0.6, 4.4, 0], fov: 56 },
  turn:   { pos: [4.5, 0.62, 0.3], look: [2.66, 0.5, 1.15], fov: 40 },
  boxin:  { pos: [3.05, 0.85, 0.7], look: [3.45, 0.72, 0.05], fov: 36 },
  ins3:   { pos: [2.45, 1.0, 0.96], look: [2.55, 0.59, 1.09], fov: 34 },
  rew3:   { pos: [0.8, 1.15, 9.6], look: [0.6, 4.4, 0], fov: 56 },
  pull:   { pos: [4.6, 0.95, 1.7], look: [3.3, 0.75, 0.25], fov: 46 },
  out:    { pos: [1.0, 1.0, 5.2], look: [2.8, 0.7, 0.9], fov: 46 },
  wcrack: { pos: [0.5, 0.42, -40.98], look: [0.55, 0.01, -41.25], fov: 36 },
  pay:    { pos: [0.5, 0.5, 5.6], look: [-0.45, 2.3, -0.35], fov: 56 },
};
const CUTS = [
  ["01 loop 1 peak", 0, SH.hook, "hook"],
  ["02 Chip at the glass", T.chip, SH.chip],
  ["03 the click", T.ins, SH.ins],
  ["04 the fire runs backward", T.rew, SH.hook, "reveal"],
  ["05 the calm", T.calm, SH.calm],
  ["06 loop 2, past the box", T.run2, SH.door],
  ["06b the lobby", T.lobby2, SH.lobby],
  ["08 eyes to the clock", T.face2, SH.face2],
  ["08b the short rewind", T.rew2, SH.lobby],
  ["09 loop 3, smoke inside", T.l3, SH.l3],
  ["09b the hallway", T.hall, SH.hall],
  ["10 the neighbour", T.ndoor, SH.nbr],
  ["11a the hallway bursts", T.hfire, SH.hfire],
  ["11 the fall", T.fall, SH.fall],
  ["11b the watch cracks", r3(T.fall + 1.05), SH.wcrack],
  ["12 the low", T.low, SH.low, "payoff"],
  ["13 the box", T.turn, SH.turn],
  ["13b the box close", T.boxin, SH.boxin],
  ["14 the last click", T.ins3, SH.ins3],
  ["14b the last rewind", T.rew3, SH.rew3],
  ["15 the pull", T.fin, SH.pull],
  ["16 everyone out", T.out, SH.out],
  ["17 You're crazy", T.pay, SH.pay, "reaction"],
];

// ---------------------------------------------------------------- the narrator (voice 1, deep storyteller), in the gaps
const NG = 4.0;
const NARR = !VO ? [] : [
  [0, "Your best friend. One minute.", 2.4],
  [2.6, "You rewind. Only you remember.", 2.3],
  [T.stair2 + 0.2, "But there's a catch.", 1.8],
  [T.face2 + 0.1, "Every rewind, the fire starts earlier.", 2.7],
  [T.low + 0.5, "You can't outrun it.", 1.8],
  [T.pay + 0.2, "Only you remember.", 1.7],
];
for (const [t, line, dur] of NARR) c.at(r3(t), { macro: "narrate", line, voice: "narrator", take: 1, dur, caption: true, pos: SUBY, gain: NG });

const beats = c.beats(CUTS, END);
for (const cp of c.captions) for (const [, cut] of CUTS) if (cp.from < cut - 0.05 && cp.to > cut - 0.03 && cp.text === "BEST FRIEND · 1 MINUTE") cp.to = r3(cut - 0.03);

const allowClip = [
  { who: "spud", with: "watch", from: 0, to: END, reason: "the pocket watch in his glove" },
  { who: "chip", with: "mug", from: T.calm - 0.1, to: T.run2 + 0.1, reason: "his mug in his glove" },
  { who: "chip", with: "mug2", from: T.out, to: END, reason: "his mug in his glove" },
  { who: "chip", with: "blk", from: 0, to: T.run2, reason: "on his window seat behind the sill, leaning out of the sash" },
  { who: "chip", with: "blk", from: T.low, to: T.fin, reason: "on his window seat behind the glass" },
  { who: "spud", with: "blk", from: T.run2, to: T.lobby2, reason: "running up the front steps and through the door" },
  { who: "spud", with: "lob", from: T.l3, to: T.low, reason: "climbing and falling down the stair treads" },
  { who: "spud", with: "blk", from: T.pull - 0.3, to: T.out, reason: "his glove on the alarm box's lever" },
  { who: "nbr", with: "lob", from: T.ndoor, to: T.slam, reason: "standing in his door crack" },
  { who: "nbr", with: "blk", from: T.out, to: T.out + 1.4, reason: "coming down the front steps" },
  { who: "chip", with: "blk", from: T.out + 1.4, to: T.out + 3.0, reason: "coming down the front steps" },
];

write(import.meta.url, {
  id: VO ? "fire-rewind" : "fire-rewind-no-vo",
  title: "Your best friend. One minute.",
  idea: "There's a catch, episode 7: Spud's best friend is trapped in a burning block; he can rewind time and only he remembers, but every rewind the fire starts earlier; on the last one he pulls the alarm before any fire shows and everyone thinks he is crazy",
  fps: 30, look: "anime-pro", profile: "short", loop: false, captionStyle: "kinetic", captionBand: [250, 1360],
  castLook: LOOK, cleanStart: true,
  motion: MOTION, rig: RIG, physics: PHYSICS, animeTiming: ANIME_TIMING, loopIdle: false,
  set: { type: "plain", color: "#141a45", floor: "#2a2238", light: "night", para: 0, bloom: "emissive", aperture: 0,
    lighting: LIGHTING, hatch: HATCH, cel: CEL, ink: true, satsuei: true },
  pause: PAUSES,
  // dramatic scenario = a recorded orchestra from 0.0 that changes at the turn (Jonny 11 + 12 Nov); the time-travel score
  // (assets/music/time-travel/README.md) for the draft; a fire-rewind cut of it comes with the polish
  music: { file: process.env.MUSIC ?? "time-travel/time-travel-score.ogg", gain: 0.6, lowCut: 90, dip: false, duck: { voice: -6 } },
  sound: { signature: false, sfx: 0.65, ambience: VO ? 0.06 : 0.2, surface: "concrete", room: "open", guard: true },
  hook: { show: ["spud", "chip", "ff", "watch"], hint: 0, what: "a burning block at night: flames under Chip's window, Chip at the glass, Spud thrown back on the pavement with a pocket watch" },
  panels: { md: "storyboards/series/what-if/07-fire-rewind/PANELS.md" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip,
  notes: "Generated by storyboards/series/what-if/07-fire-rewind/make-fire-rewind.mjs.",
});
