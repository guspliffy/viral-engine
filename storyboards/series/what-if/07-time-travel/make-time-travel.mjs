// WHAT IF YOU COULD TIME TRAVEL? BUT THERE'S A CATCH. (There's a catch, episode 7). Jonny 12 Nov 2026 19:20 Berlin:
// "create it" on the 15-panel sheet (board.png here), after outline v3 ("make it 10x more extreme and dramatic").
// Opener type A: the world final is running at frame 0. Stake-first line (Jonny 12 Nov 19:12 rule).
// Outline: /mnt/project-files/video-scripts/2026-11-08-what-if/07-time-travel-OUTLINE.md
// Image prompt: /mnt/project-files/video-scripts/2026-11-08-what-if/07-time-travel-V3-15-PANEL-IMAGE-PROMPT.md
// Panels: board.png + PANELS.md here. Places, cameras and reasons: NOTES.md here.
//   node storyboards/series/what-if/07-time-travel/make-time-travel.mjs            -> time-travel.json
//   ... --no-vo -> time-travel-no-vo.json: without the narrator (staging and local drafts, no speech model)
//
// THE BRIEF
//   Want:        Spud loses a world final by a nose and clicks a pocket watch: time runs back (the rain rises).
//   Chain:       jump 1, he wins, SO the beaten Wedge in rage brings a TV crane down on Chip (ambulance); SO jump 2,
//                Spud drags Chip to the top row and wins again, SO Chip, far from Spud, comforts the sobbing Wedge, on
//                the giant screen, and the screen's replay of the drag turns the stadium against Spud; SO jump 3, he
//                winds the watch too hard: the seasons flash, the watch bursts, one year earlier, before they met.
//   Ending:      on the empty track in the rain Chip doesn't know him, shoves him off, then comes back and offers his
//                hand: "You okay? I'm Chip." Their first meeting again; the broken watch in the puddle.
//
// WORLD (x right, runners run toward +x, z toward the main camera; yaw 0 faces +z, 90 faces +x). STADIUM: the finish
// line's middle at the origin, six lanes across z -3.66..+3.66 (lane 1 nearest the stands), the stands on the -z side
// (front wall z -5.0, 0.9 high; 28 tiers 0.8 deep, 0.42 high), the aisle stair at x +4.0. DAWN: the same stadium,
// empty, one year earlier, at x +1000.
import { clip, write, r3 } from "../../../lib/clip.mjs";
import * as act from "../../../lib/acting.mjs";
import { vote } from "../../../lib/overlay.mjs";

// ---------------------------------------------------------------- the template's picks (storyboards/templates)
const LOOK = "sheet", LIGHTING = 2, HATCH = { boil: 0.25 }, CEL = { at: 0.25 }, ANIME_TIMING = true;
const MOTION = { feet: 2, overlap: true, timing: true, solve: true }, RIG = { hand: 2, eyes: 2, hold: 2 }, PHYSICS = true;
const c = clip({ faces: "strong", lines: { sub: true, blink: false } }), { A, sfx, cap, see } = c;
const VO = !process.argv.includes("--no-vo");
const CHOICE_CARD = process.env.CARD !== "0";   // the optional "1 = JUMP · 2 = STAY" card (trial 2, Jonny decides)
// the builders' packs: until a file is in, its kinds are stood in for by boxes at the real sizes (the staging proof)
const READY = new Set((process.env.READY ?? "stadium,watch,rescue").split(",").filter(Boolean));
const has = (pack) => READY.has(pack);
const box = (w, h, d) => ({ kind: "stoneblock", w, h, d });
const ph = (pack, final, stand) => (has(pack) ? final : { id: final.id, x: final.x, y: final.y ?? 0, z: final.z, ...(final.rot != null && { rot: final.rot }), ...(final.wear && { wear: final.wear }), ...stand });
const Pk = (pack, t, id, set, dur, ease) => { if (has(pack)) P(t, id, set, dur, ease); };   // params only the real pack knows

// ---------------------------------------------------------------- the beats (video s = story s: no ramps)
// 01 photo finish + click | 02 the start | 03 he wins | 04 the crane | 05 the ambulance | 06a jump two | 06 the drag |
// 07 Wedge sobs | 08a the hug | 08 the screen | 09 the boos | 10 the choice | 11 winding | 12 the seasons | 13 the burst |
// 14 one year ago | 15 "I'm Chip"
const T = {
  click: 0.4, back: 0.85, start: 2.4, bang: 3.15, win: 4.0, tape: 4.5, crane: 6.6, amb: 8.7, j2: 11.0, drag: 11.7,
  sob: 13.3, hug: 14.6, screen: 16.0, boo: 17.4, choice: 19.4, wind: 21.6, seasons: 23.0, burst: 24.6, dawn: 25.9,
  shove: 28.4, end15: 29.8, END: 36.8,
};
const END = T.END;
const DOWN = -60;   // parked under the floor
const DX = 1000;    // the dawn stadium's x offset

const rad = (d) => (d * Math.PI) / 180;
const yawTo = ([x, z], [tx, tz]) => r3((Math.atan2(tx - x, tz - z) * 180) / Math.PI);
const place = (t, who, at, yaw, y) => { A(r3(t - 0.02), who, "move", { to: at, dur: 0.01, steps: 0, ease: "linear", sync: true, ...(y != null && { y }) }); A(r3(t - 0.02), who, "turn", { to: yaw, dur: 0.01, ease: "linear", sync: true }); };
const expr = (t, who, e, set, dur = 0.12) => A(r3(t), who, "expr", { expr: e, ...(set && { set }), dur });
const P = (t, id, set, dur = 0.01, ease = "linear") => c.prop(r3(t), id, set, dur, ease);
const look = (t, who, to, dur = 0.2) => A(r3(t), who, "look", { to, dur, blink: false });
const SUBY = 540;   // speech lettering in the upper third, never over a face (Jonny 12 Nov)
const say = (t, who, line, dur, tone, sub, pos = SUBY) => c.say(r3(t), who, line, dur, tone, { voice: false, sub, pos });

// ---------------------------------------------------------------- places (the stadium)
const LANE = (n) => r3(-3.66 + 1.22 * (n - 0.5));   // lane centres: 1 = -3.05 (nearest the stands)
const WZ = LANE(1), SZ = LANE(2);                    // Wedge in lane 1, Spud in lane 2
const START_X = -20;
const TIER = (k) => ({ z: r3(-5.0 - 0.8 * (k - 0.5)), y: r3(0.9 + 0.42 * (k - 1)) });   // the middle of tier k's floor
const CHIP_T1 = [-0.6, TIER(1).z], CHIP_Y1 = TIER(1).y;   // Chip in the front tier behind the barrier, his sign up
const CRANE = [3.2, -4.1];                                // the TV crane's dolly on the apron (a gap in the barrier)
const PULL = [0.6, 0.55, 1.0];                            // where Wedge yanks the crane's cable (relative to the dolly)
const AMB = [8.0, -0.6];                                   // the ambulance across the lanes past the finish, doors to +z
const STAIR_X = 4.0;
const STEP = (j) => ({ z: r3(-5.0 - 0.4 * (j - 0.5)), y: r3(0.9 + 0.21 * (j - 1)) });   // aisle step j's middle
const SOB = [2.8, -2.4];                                   // where Wedge sits sobbing on the track
const LONE = [1.0, -1.2];                                  // Spud alone on the track (09-13)
const H = { spud: 0.88, wdg: 0.98, chip: 0.53 };

const cast = [
  { id: "spud", character: "potatobrawl/spud", at: [-0.6, SZ], face: 90, expr: "focused", follow: 0.3, seed: 1.3 },
  { id: "wdg", character: "potatobrawl/wedge", at: [-0.35, WZ], face: 90, expr: "cocky", follow: 0.3, seed: 2.1 },
  { id: "chip", character: "potatobrawl/chip", at: CHIP_T1, face: 20, expr: "eager", follow: 0.3, seed: 4.4 },
];

// ---------------------------------------------------------------- props
const NIL = { ...box(0.01, 0.01, 0.01), y: DOWN };
const RAIN = { kind: "rainbox", box: [9, 7, 9], n: 1600, speed: 9, slant: [0.08, 0], alpha: 0.55, seed: 7, streak: 1, splash: 1 };
const props = [
  // ---- the night stadium (T1 props-stadium.js)
  ph("stadium", { id: "stad", kind: "stadium", x: 0, y: 0, z: 0, start: START_X, mood: "night", wet: 1 }, { ...box(100, 0.02, 12), y: -0.02, z: -1 }),
  ph("stadium", { id: "crowd", kind: "stadiumcrowd", x: 0, y: 0, z: 0, x0: -50, x1: 50, rows: 28, top: 0, gap: [3.4, 4.6], seed: 11, umbrellas: 0.35, ponchos: 0.4, spacing: 0.55, hole: CHIP_T1[0], cheer: 0, boo: 0, empty: 0, flash: 1, sway: 1, target: [LONE[0], LONE[1]] }, NIL),
  ph("stadium", { id: "screen", kind: "bigscreen", x: 6.25, y: 0, z: -30, scale: 0.72, bottom: 18, photo: "storyboards/series/what-if/07-time-travel/screen-hug.png", photo2: "storyboards/series/what-if/07-time-travel/screen-drag.png", show: 1, pic: 0, glow: 1 }, NIL),
  ...[[-45, -30, 20], [45, -30, -20], [-45, 45, 160], [45, 45, -160]].map(([x, z, rot], i) => ph("stadium", { id: `fl${i}`, kind: "floodlight", x, y: 0, z, rot, lit: 1 }, NIL)),
  ph("stadium", { id: "barL", kind: "crowdbarrier", x: -13.8, y: 0, z: -4.0, len: 32 }, { ...box(32, 1.0, 0.1), x: -13.8, z: -4.0 }),
  ph("stadium", { id: "barR", kind: "crowdbarrier", x: 17.0, y: 0, z: -4.0, len: 26 }, { ...box(26, 1.0, 0.1), x: 17.0, z: -4.0 }),
  ph("stadium", { id: "blkS", kind: "startblock", x: r3(START_X - 0.55), y: 0, z: SZ, rot: 90 }, box(0.3, 0.1, 0.6)),
  ph("stadium", { id: "blkW", kind: "startblock", x: r3(START_X - 0.55), y: 0, z: WZ, rot: 90 }, box(0.3, 0.1, 0.6)),
  ph("stadium", { id: "tape", kind: "finishtape", x: 0.05, y: 0, z: r3((SZ + WZ) / 2), rot: 90, w: 2.6, snap: 0, wave: 0 }, NIL),
  ph("stadium", { id: "sign", kind: "cardsign", x: 0, y: 0, z: 0, text: "GO\nSPUD", crush: 0 }, box(0.42, 0.65, 0.02)),
  // ---- the dawn stadium one year earlier (T1), empty
  ph("stadium", { id: "stad2", kind: "stadium", x: DX, y: 0, z: 0, start: START_X, mood: "dawn", wet: 1 }, { ...box(40, 0.02, 12), x: DX, y: -0.02, z: -1 }),
  // ---- the watch, the rain, the seasons, the medal (T2 props-timewatch.js)
  ph("watch", { id: "watch", kind: "pocketwatch", x: 0, y: DOWN, z: 0, hands: 0, crack: 0, wind: 0, shake: 0, burst: 0, glint: 0, floor: -0.62 }, box(0.075, 0.075, 0.022)),
  ph("watch", { id: "rain", kind: "rainbox", x: 0, y: 0, z: 0, ...RAIN, time: 0 }, NIL),
  ph("watch", { id: "swirl", kind: "seasonswirl", x: LONE[0], y: DOWN, z: LONE[1], r: 6, h: 8, n: 600, snow: 1, leaves: 1, rain: 1 }, NIL),
  ph("watch", { id: "medal", kind: "goldmedal", wear: "spud", x: 0, y: 0.34, z: 0.4, swing: 1, scale: 0.001 }, NIL),
  ph("watch", { id: "wreck", kind: "watchwreck", x: r3(DX + 1.25), y: 0, z: -0.55, rot: 20 }, NIL),
  { id: "puddle", kind: "wetpuddle", x: r3(DX + 0.95), y: 0.003, z: -0.85, rx: 1.0, rz: 0.7, splash: 0, ring: 0 },
  // ---- the crane, the ambulance, the stretcher, the medics, the starter (T3 props-rescue.js)
  ph("rescue", { id: "crane", kind: "tvcrane", x: CRANE[0], y: 0, z: CRANE[1], len: 4.2, swing: 161, boom: 14, yank: 0, fall: 0, tally: 1, drop: 12, land: 1.3, pull: PULL, cableEnd: [0.9, 0, 1.1] }, box(1.3, 1.8, 0.9)),
  ph("rescue", { id: "amb", kind: "ambulance", x: AMB[0], y: 0, z: AMB[1], rot: 0, doors: 1, siren: 1, wet: 1 }, box(2.0, 2.3, 4.6)),
  ph("rescue", { id: "str", kind: "stretcher", x: AMB[0], y: 0, z: 3.4, rot: 90, blanket: 1 }, box(1.5, 0.65, 0.55)),
  ph("rescue", { id: "med1", kind: "medic", x: AMB[0], y: 0, z: 2.45, rot: 180, h: 0.9, lug: 1, walk: 0, sway: 1 }, NIL),
  ph("rescue", { id: "med2", kind: "medic", x: AMB[0], y: 0, z: 4.35, rot: 180, h: 0.9, lug: 1, walk: 0, sway: 1 }, NIL),
  ph("rescue", { id: "starter", kind: "starter", x: r3(START_X + 1.4), y: 0, z: -3.85, rot: -30, h: 0.95, fire: 0, sway: 1 }, NIL),
  // ---- reused: fireworks over the roof (props-bonfire.js), the siren light on the wet track (props-heistset.js)
  ...[[-12, 11, -18, "peony", 0], [-5, 13, -22, "peony", 1], [-17, 9, -14, "peony", 2]].map(([x, y, z, shape, i]) => ({ id: `fw${i}`, kind: "firework", x, y, z, shape, size: 5, colors: ["#fff6d8", "#ffcf4a", "#ff6a3c"], burst: 0 })),
  { id: "wash", kind: "sirenwash", x: AMB[0], y: 0.02, z: 2.6, w: 6, h: 5, flat: true, on: 0 },
];

// ================================================================= 01 THE PHOTO FINISH (0-2.4): the click, the rain rises
// Frame 0: both lunge at the tape in the rain, Wedge's nose ahead; Chip in the front tier behind the barrier with his
// sign up; the watch already in Spud's right glove. 0.4 the click: the rain stops and RISES, the two slide backward.
const watchIn = (t, who = "spud", side = "R", o = { o: [0.16, 0.62, 0.24] }) => {
  c.arm(r3(t), who, side, o, 0.01); A(r3(t), who, "grip", { side, shape: "fist", dur: 0.01 });
  if (has("watch")) A(r3(t + 0.01), who, "grab", { prop: "watch", hand: side, grip: "case", dur: 0, pose: null });
};
watchIn(0);
A(0, "spud", "pitch", { to: 14, dur: 0.01 }); A(0, "wdg", "pitch", { to: 16, dur: 0.01 });
A(0, "spud", "move", { to: [-0.05, SZ], dur: T.click, ease: "out", sync: true });
A(0, "wdg", "move", { to: [0.22, WZ], dur: T.click, ease: "out", sync: true });   // his nose ahead
c.arm(0, "wdg", "L", { o: [0.1, 0.45, -0.25] }, 0.01); c.arm(0, "wdg", "R", { o: [0.12, 0.5, 0.3] }, 0.01);
expr(0, "spud", "focused", { brow: 0.6, open: 0.2 }, 0.01); expr(0, "wdg", "cocky", { open: 0.3 }, 0.01);
// Chip with his sign up
A(0, "chip", "grip", { side: "R", shape: "fist", dur: 0.01 });
if (has("stadium")) A(0.01, "chip", "grab", { prop: "sign", hand: "R", grip: "stick", dur: 0, pose: null });
c.arm(0, "chip", "R", { o: [0.12, 0.95, 0.12] }, 0.01);
c.arm(0, "chip", "L", "up", 0.01);
A(0, "chip", "move", { to: CHIP_T1, y: CHIP_Y1, dur: 0.01, steps: 0, ease: "linear", sync: true });
expr(0, "chip", "eager", { open: 0.6 }, 0.01); look(0, "chip", [0.4, -0.1], 0.01);
Pk("stadium", 0, "crowd", { cheer: 1 });
Pk("watch", 0, "swirl", { y: DOWN });
// seed every param that is first tweened later: an unseeded tween starts from undefined and writes NaN (the farm's
// shards died on the tape's NaN vertices at its snap)
for (const [pk, id, set] of [["rescue", "crane", { fall: 0 }], ["stadium", "crowd", { hole: CHIP_T1[0] }], ["stadium", "fl0", { lit: 1 }], ["stadium", "fl1", { lit: 1 }],
  ["stadium", "fl2", { lit: 1 }], ["stadium", "fl3", { lit: 1 }], ["stadium", "fw0", { burst: 0 }], ["stadium", "fw1", { burst: 0 }], ["stadium", "fw2", { burst: 0 }],
  ["watch", "rain", { alpha: 0.55 }], ["stadium", "screen", { pic: 0, show: 1 }], ["rescue", "starter", { fire: 0 }], ["stadium", "tape", { snap: 0 }],
  ["rescue", "wash", { on: 0 }], ["watch", "watch", { burst: 0, crack: 0, glint: 0, hands: 0 }]]) Pk(pk, 0, id, set);
Pk("stadium", 0, "tape", { wave: 1 });
// the rain: forward with the clock, frozen at the click, then running backward (rising); the watch's hands spin back
Pk("watch", 0, "rain", { x: 0, y: 0, z: -1.5, time: 0, streak: 1 }); Pk("watch", 0, "rain", { time: T.click }, T.click, "linear");
Pk("watch", r3(T.click + 0.02), "rain", { streak: 0 }, 0.12, "out");
Pk("watch", T.back, "rain", { time: r3(T.click - 2.2) }, r3(T.start - T.back - 0.05), "in");
Pk("watch", T.click, "watch", { hands: -6, glint: 1 }, r3(T.start - T.click - 0.05), "in");
expr(T.click, "spud", "focused", { brow: 0.8, open: 0.05 }, 0.08);
sfx(T.click, "click", { gain: 0.9, loud: true, reason: "the watch crown clicks: the power" });
// everyone freezes, then slides back the way they came (time running backward)
A(r3(T.click + 0.02), "spud", "move", { to: [-0.05, SZ], dur: 0.01, steps: 0, sync: true });
A(T.back, "spud", "move", { to: [-1.8, SZ], dur: r3(T.start - T.back - 0.05), steps: 0, ease: "in", sync: true });
A(T.back, "wdg", "move", { to: [-1.55, WZ], dur: r3(T.start - T.back - 0.05), steps: 0, ease: "in", sync: true });
Pk("stadium", T.click, "crowd", { cheer: 0.5 }, 0.3, "out");
cap(0, r3(T.start - 0.05), "3 JUMPS · 1 FRIEND", 300);
see(0, T.start, ["spud.face", "wdg.face", "chip.face", "watch", "sign"], "frame 0: photo finish in the rain, Wedge's nose ahead; Chip with his GO SPUD sign; the watch clicks and the rain rises");

// ================================================================= 02 THE START (2.4-4.0): back at the blocks, the gun
place(T.start, "spud", [r3(START_X - 0.25), SZ], 90); place(T.start, "wdg", [r3(START_X - 0.25), WZ], 90);
for (const who of ["spud", "wdg"]) { A(r3(T.start - 0.02), who, "crouch", { to: 1, dur: 0.01, sync: true }); A(r3(T.start - 0.02), who, "pitch", { to: 20, dur: 0.01, sync: true }); }
c.arm(r3(T.start - 0.02), "spud", "L", { o: [0.12, 0.2, 0.32] }, 0.01); c.arm(r3(T.start - 0.02), "spud", "R", { o: [0.12, 0.22, 0.3] }, 0.01);
c.arm(r3(T.start - 0.02), "wdg", "L", { o: [0.12, 0.2, 0.32] }, 0.01); c.arm(r3(T.start - 0.02), "wdg", "R", { o: [0.12, 0.2, 0.32] }, 0.01);
expr(r3(T.start - 0.02), "spud", "focused", { brow: 0.9 }, 0.01); expr(r3(T.start - 0.02), "wdg", "cocky", {}, 0.01);
look(r3(T.start - 0.02), "spud", [0.2, 0.05], 0.01); look(r3(T.start - 0.02), "wdg", [0, 0.05], 0.01);
Pk("watch", r3(T.start - 0.02), "rain", { x: START_X, z: -1.5, time: T.start, streak: 1 });
Pk("watch", T.start, "rain", { time: END }, r3(END - T.start), "linear");
Pk("stadium", r3(T.start - 0.02), "crowd", { cheer: 0 });
Pk("rescue", T.bang, "starter", { fire: 1 }, 1.0, "out");
sfx(T.bang, "gunshot", { gain: 0.8, loud: true, reason: "the starting pistol" });
// Spud knows the gun: he is off ON the bang, Wedge a beat later
A(r3(T.bang - 0.02), "spud", "crouch", { to: 0, dur: 0.12, sync: true }); A(r3(T.bang - 0.02), "spud", "pitch", { to: 12, dur: 0.12, sync: true });
A(T.bang, "spud", "move", { to: [-13, SZ], dur: r3(T.win - T.bang), ease: "in" });
A(r3(T.bang + 0.18), "wdg", "crouch", { to: 0, dur: 0.12, sync: true }); A(r3(T.bang + 0.18), "wdg", "pitch", { to: 12, dur: 0.12, sync: true });
A(r3(T.bang + 0.18), "wdg", "move", { to: [-15.5, WZ], dur: r3(T.win - T.bang - 0.18), ease: "in" });
watchIn(r3(T.bang + 0.02), "spud", "R", { o: [0.18, 0.5, 0.15] });
see(T.start, T.win, ["spud.face", "wdg", "starter"], "back at the blocks: crouched in the rain, the gun fires, Spud off first");

// ================================================================= 03 HE WINS (4.0-6.6): through the tape, fireworks
place(T.win, "spud", [-2.6, SZ], 90); place(T.win, "wdg", [-3.4, WZ], 90);
A(T.win, "spud", "move", { to: [2.2, SZ], dur: 0.9, ease: "out" });
A(T.win, "wdg", "move", { to: [1.6, WZ], dur: 1.05, ease: "out" });
P(r3(T.tape - 0.02), "tape", { snap: 1 }, 0.35, "out");
sfx(T.tape, "slap", { gain: 0.3, reason: "the finish tape snapping" });
c.arm(r3(T.tape + 0.05), "spud", "R", { o: [0.14, 1.05, 0.08] }, 0.25, "out"); c.arm(r3(T.tape + 0.05), "spud", "L", "up", 0.25, "out");
expr(r3(T.tape + 0.05), "spud", "delighted", { curve: 1, open: 0.7 }, 0.12);
expr(r3(T.tape + 0.15), "wdg", "shocked", { open: 0.4, eye: 1.2 }, 0.12);
Pk("stadium", T.tape, "crowd", { cheer: 1 }, 0.3, "out");
[0, 1, 2].forEach((i) => { P(r3(T.tape + 0.3 + i * 0.45), `fw${i}`, { burst: 1 }, 1.6, "out"); sfx(r3(T.tape + 0.3 + i * 0.45), "firework", { gain: 0.45, reason: "a firework over the roof" }); });
Pk("watch", r3(T.win - 0.02), "rain", { x: 2, z: -1.5 });
see(T.win, T.crane, ["spud.face", "wdg.face", "tape"], "Spud breaks the tape first, arms up; Wedge a step behind, shocked; fireworks over the roof");

// ================================================================= 04 THE CRANE (6.6-8.7): Wedge's rage, Chip below
// Wedge, beaten, yanks the cable of the TV crane; its long arm comes down toward the front tier where Chip stands.
place(T.crane, "wdg", [r3(CRANE[0] + PULL[0] + 0.3), r3(CRANE[1] + PULL[2] + 0.45)], -45);
Pk("rescue", 0, "crane", { swing: 161, boom: 14, yank: 0, tally: 1 });
c.arm(r3(T.crane - 0.02), "wdg", "R", has("rescue") ? { prop: "crane", grip: PULL } : { o: [0.1, 0.55, 0.3] }, 0.01); A(r3(T.crane - 0.02), "wdg", "grip", { side: "R", shape: "fist", dur: 0.01 });
// no grab: the crane must not follow his glove; the glove goes to the cable's yanked end
c.arm(r3(T.crane - 0.02), "wdg", "L", "fist", 0.01);
expr(r3(T.crane - 0.02), "wdg", "angry", { brow: 1 }, 0.01);
Pk("rescue", r3(T.crane + 0.3), "crane", { yank: 1 }, 0.35, "in");
A(r3(T.crane + 0.3), "wdg", "lean", { to: -12, dur: 0.3 });
Pk("rescue", r3(T.crane + 0.7), "crane", { fall: 1 }, 1.9, "in");   // still short of Chip at the cut (fall 0.75 at 8.65)
sfx(r3(T.crane + 0.7), "hit-metal", { gain: 0.45, reason: "the crane's steel pivot giving way" });
look(r3(T.crane + 0.6), "chip", [0.5, 0.6], 0.2); expr(r3(T.crane + 0.6), "chip", "terrified", { open: 0.6, eye: 1.3 }, 0.12);
c.arm(r3(T.crane + 0.65), "chip", "L", { o: [0.05, 0.9, 0.2] }, 0.2);
sfx(r3(T.amb - 0.12), "impact", { gain: 0.9, loud: true, reason: "the crane's arm crashing into the front row (cut before it lands)" });
see(T.crane, T.amb, ["wdg.face", "crane", "chip.face"], "Wedge yanks the crane's cable in rage; its arm comes down toward Chip in the front row");

// ================================================================= 05 THE AMBULANCE (8.7-11.0): the first catch, shown
// Rain, blue light: two medics carry Chip on a stretcher into the ambulance; Spud in the foreground with his gold medal.
const STR0 = [AMB[0], 3.4], STR1 = [AMB[0], 2.3];
A(r3(T.amb - 0.04), "chip", "release", { prop: "sign", to: [0, DOWN, 0], dur: 0.01 });
// Chip lies on his back on the stretcher (head -x), eyes shut, and rides it to the ambulance doors
const LIEY = Number(process.env.LIEY ?? 0.72), LIEDX = Number(process.env.LIEDX ?? 0);
place(T.amb, "chip", [r3(STR0[0] + LIEDX), STR0[1]], Number(process.env.LIEROT ?? 90), LIEY);
A(r3(T.amb - 0.02), "chip", "pitch", { to: Number(process.env.LIEP ?? -85), dur: 0.01 });
c.arm(r3(T.amb - 0.02), "chip", "L", { o: [0.18, 0.3, 0.0] }, 0.01); c.arm(r3(T.amb - 0.02), "chip", "R", { o: [0.18, 0.3, 0.0] }, 0.01);
expr(r3(T.amb - 0.02), "chip", "sad", { eye: 0.05, curve: -0.3 }, 0.01);
A(T.amb, "chip", "move", { to: [r3(STR1[0] + LIEDX), STR1[1]], y: LIEY, dur: 1.6, steps: 0, ease: "inOut" });
place(T.amb, "spud", [5.2, 4.6], -21);
Pk("watch", r3(T.amb - 0.02), "medal", { scale: 1 });
c.arm(r3(T.amb - 0.02), "spud", "R", { o: [0.06, 0.4, 0.08] }, 0.01); c.arm(r3(T.amb - 0.02), "spud", "L", { o: [0.06, 0.38, 0.05] }, 0.01);
watchIn(r3(T.amb - 0.02), "spud", "R", { o: [0.06, 0.4, 0.08] });
expr(r3(T.amb - 0.02), "spud", "shocked", { open: 0.25, eye: 1.2, curve: -0.4 }, 0.01); look(r3(T.amb - 0.02), "spud", [0.6, 0.05], 0.01);
Pk("rescue", T.amb, "str", { x: STR1[0], z: STR1[1] }, 1.6, "inOut");
Pk("rescue", T.amb, "med1", { z: r3(STR1[1] - 0.95), walk: 1.1 }, 1.6, "inOut"); Pk("rescue", T.amb, "med2", { z: r3(STR1[1] + 0.95), walk: 1.1 }, 1.6, "inOut");
P(r3(T.amb - 0.02), "wash", { on: 1 });
Pk("watch", r3(T.amb - 0.02), "rain", { x: 7, z: 2 });
sfx(T.amb, "siren", { dur: 2.3, gain: 0.35, reason: "the ambulance siren in the rain" });
see(T.amb, T.j2, ["spud.face", "amb", "str", "medal"], "rain, blue light: medics load Chip into the ambulance; Spud, gold medal round his neck, frozen");

// ================================================================= 06a JUMP TWO (11.0-11.7): click, the rain rises
expr(T.j2, "spud", "focused", { brow: 1, curve: -0.3 }, 0.1);
Pk("rescue", r3(T.drag - 0.02), "crane", { fall: 0, yank: 0 });   // time ran back: the crane stands again
c.arm(T.j2, "spud", "R", { o: [0.1, 0.62, 0.22] }, 0.15, "out");
Pk("watch", r3(T.j2 + 0.15), "watch", { hands: -14 }, 0.5, "in");
Pk("watch", r3(T.j2 + 0.12), "rain", { time: r3(T.j2 - 2.5), streak: 0 }, 0.55, "in");
sfx(r3(T.j2 + 0.12), "click", { gain: 0.9, loud: true, reason: "the crown clicks again: jump two" });
see(T.j2, T.drag, ["spud.face", "watch"], "the watch clicks again; the rain rises");

// ================================================================= 06 THE DRAG (11.7-13.3): up the aisle to the top row
P(r3(T.drag - 0.02), "wash", { on: 0 }); Pk("watch", r3(T.drag - 0.02), "medal", { scale: 0.001 });
Pk("watch", r3(T.drag - 0.02), "rain", { x: STAIR_X, z: -8, time: T.drag, streak: 1 }); Pk("watch", T.drag, "rain", { time: END }, r3(END - T.drag), "linear");
A(r3(T.drag - 0.02), "chip", "show", { sync: true }); A(r3(T.drag - 0.02), "chip", "pitch", { to: 0, dur: 0.01 });
const S0 = STEP(14), S1 = STEP(20), C0 = STEP(12), C1 = STEP(18);
place(T.drag, "spud", [STAIR_X + 0.15, S0.z], 180, S0.y); place(T.drag, "chip", [STAIR_X - 0.2, C0.z], 180, C0.y);
A(T.drag, "spud", "move", { to: [STAIR_X + 0.15, S1.z], y: S1.y, dur: 1.5, steps: 6 });
A(T.drag, "chip", "move", { to: [STAIR_X - 0.2, C1.z], y: C1.y, dur: 1.5, steps: 8 });
c.arm(r3(T.drag - 0.02), "spud", "L", { o: [-0.05, 0.4, -0.35] }, 0.01);      // reaching back for Chip's glove
c.arm(r3(T.drag - 0.02), "chip", "R", { o: [0.02, 0.75, 0.35] }, 0.01);       // his arm pulled up and forward
expr(r3(T.drag - 0.02), "spud", "focused", { brow: 1 }, 0.01); expr(r3(T.drag - 0.02), "chip", "shocked", { open: 0.3 }, 0.01);
look(r3(T.drag - 0.02), "chip", [0, 0.5], 0.01);
Pk("stadium", r3(T.drag - 0.02), "crowd", { cheer: 0, hole: STAIR_X });
see(T.drag, T.sob, ["spud", "chip.face"], "Spud drags Chip by the arm up the stand steps to the empty top row");

// ================================================================= 07 WEDGE SOBS (13.3-14.6): the race went to Spud again
place(T.sob, "wdg", SOB, 10);
A(r3(T.sob - 0.02), "wdg", "crouch", { to: 1, dur: 0.01, sync: true });
c.arm(r3(T.sob - 0.02), "wdg", "L", "cheeks", 0.01); c.arm(r3(T.sob - 0.02), "wdg", "R", "cheeks", 0.01);
expr(r3(T.sob - 0.02), "wdg", "sad", { curve: -1, eye: 0.6 }, 0.01);
const TOP = STEP(30);
place(T.sob, "chip", [STAIR_X, TOP.z], 0, TOP.y);
A(r3(T.sob + 0.4), "chip", "move", { to: [STAIR_X, STEP(24).z], y: STEP(24).y, dur: 0.85, steps: 6 });
place(T.sob, "spud", [DX, -60], 0);   // off stage
Pk("watch", r3(T.sob - 0.02), "rain", { x: 3, z: -4 });
sfx(r3(T.sob + 0.1), "groan", { gain: 0.35, reason: "Wedge sobbing" });
see(T.sob, T.hug, ["wdg", "chip"], "Wedge alone on the wet track, face in his gloves; far above, Chip starts down the steps");

// ================================================================= 08a THE HUG (14.6-16.0): "Hey... you ran great."
const CHIP_HUG = [r3(SOB[0] - 0.74), r3(SOB[1] + 0.18)];
place(T.hug, "chip", CHIP_HUG, 75, 0);
c.arm(r3(T.hug - 0.02), "chip", "L", { world: [r3(SOB[0] - 0.42), 0.6, r3(SOB[1] + 0.14)] }, 0.01); c.arm(r3(T.hug - 0.02), "chip", "R", { o: [0.12, 0.25, 0.08] }, 0.01);
expr(r3(T.hug - 0.02), "chip", "kind", { curve: 0.4 }, 0.01); look(r3(T.hug - 0.02), "chip", [0.4, 0.1], 0.01);
A(r3(T.hug - 0.02), "wdg", "turn", { to: -40, dur: 0.01, sync: true });
say(r3(T.hug + 0.15), "chip", "Hey... you ran great.", 1.2, "calm", "Hey... you ran great.", 320);
expr(r3(T.hug + 0.7), "wdg", "sad", { curve: -0.6, eye: 0.9 }, 0.2);
see(T.hug, T.screen, ["chip.face", "wdg.face"], "Chip comforts the sobbing Wedge on the track");

// ================================================================= 08 THE SCREEN (16.0-17.4): the whole stadium sees it
Pk("stadium", r3(T.screen - 0.02), "screen", { show: 1, pic: 0 });
Pk("stadium", T.screen, "crowd", { cheer: 1 }, 0.3, "out");
Pk("watch", r3(T.screen - 0.02), "rain", { x: 0, z: 2 });
see(T.screen, T.boo, ["screen"], "the giant screen: Chip hugging Wedge, the packed stadium cheering");

// ================================================================= 09 THE BOOS (17.4-19.4): the replay shows the drag
for (const w of ["chip", "wdg"]) place(T.boo, w, [r3(-2.4 + (w === "chip" ? 0 : 0.85)), -3.1], -110, 0);
A(r3(T.boo - 0.02), "wdg", "crouch", { to: 0, dur: 0.01, sync: true });
for (const w of ["chip", "wdg"]) for (const sd of ["L", "R"]) c.arm(r3(T.boo - 0.02), w, sd, { o: [0.1, 0.3, 0.06] }, 0.01);
place(T.boo, "spud", LONE, 0, 0);
Pk("watch", r3(T.boo - 0.02), "medal", { scale: 1 });
c.arm(r3(T.boo - 0.02), "spud", "L", { o: [0.05, 0.35, 0.05] }, 0.01);
watchIn(r3(T.boo - 0.02), "spud", "R", { o: [0.05, 0.36, 0.06] });
expr(r3(T.boo - 0.02), "spud", "shocked", { curve: -0.5 }, 0.01); look(r3(T.boo - 0.02), "spud", [0, 0.6], 0.01);
Pk("stadium", r3(T.boo - 0.02), "screen", { pic: 1 });
Pk("stadium", T.boo, "crowd", { cheer: 0, boo: 1 }, 0.4, "out");
sfx(T.boo, "groan", { gain: 0.5, dur: 1.8, reason: "the whole stadium booing" });
see(T.boo, T.choice, ["spud", "screen"], "the replay on the screen shows Spud dragging Chip; the whole stadium boos him");

// ================================================================= 10 THE CHOICE (19.4-21.6): would you jump again?
for (const [w, x0, x1] of [["chip", -1.0, -3.0], ["wdg", -0.2, -2.2]]) { place(T.choice, w, [x0, -3.0], -110, 0); A(T.choice, w, "move", { to: [x1, -3.4], dur: 2.1, ease: "linear" }); }
c.arm(r3(T.choice - 0.02), "wdg", "R", { o: [0.3, 0.5, 0.0] }, 0.01);   // his glove out toward Chip's shoulder
c.arm(r3(T.choice - 0.02), "spud", "R", { o: [0.06, 0.6, 0.24] }, 0.01);
expr(r3(T.choice - 0.02), "spud", "sad", { curve: -1, eye: 1.1 }, 0.01); look(r3(T.choice - 0.02), "spud", [0, -0.2], 0.01);
Pk("watch", T.choice, "watch", { shake: 1 });
Pk("stadium", r3(T.choice - 0.02), "crowd", { boo: 0.6 });
if (CHOICE_CARD) vote(c, r3(T.choice + 0.2), 1.9, "", [["1", "JUMP"], ["2", "STAY"]]);
[0, 1, 2, 3].forEach((k) => sfx(r3(T.choice + 0.2 + k * 0.5), "click", { gain: 0.35, reason: "the watch ticking in his shaking glove" }));
see(T.choice, T.wind, ["spud.face", "watch", "chip", "wdg"], "Spud alone in the rain, the watch shaking in his glove; Chip walks off under Wedge's arm");

// ================================================================= 11 WINDING (21.6-23.0): too hard, the glass cracks
c.arm(r3(T.wind - 0.02), "spud", "R", { x: [-0.05, 0.36, 0.3] }, 0.01); c.arm(r3(T.wind - 0.02), "spud", "L", { x: [0.07, 0.4, 0.28] }, 0.01);
expr(r3(T.wind - 0.02), "spud", "angry", { brow: 1, open: 0 }, 0.01); look(r3(T.wind - 0.02), "spud", [0, -0.5], 0.01);
Pk("watch", T.wind, "watch", { wind: 900 }, 1.3, "in"); Pk("watch", r3(T.wind + 0.5), "watch", { crack: 1 }, 0.7, "in");
sfx(r3(T.wind + 0.6), "ai/screen-crack", { gain: 0.6, reason: "the watch glass cracking" });
see(T.wind, T.seasons, ["spud.face", "watch"], "close: Spud winds the crown hard with both gloves, a crack runs across the glass");

// ================================================================= 12 THE SEASONS (23.0-24.6): the stadium empties
A(r3(T.seasons - 0.02), "spud", "turn", { to: 180, dur: 0.01, sync: true });
Pk("watch", r3(T.seasons - 0.02), "swirl", { y: 0 });
Pk("stadium", T.seasons, "crowd", { empty: 1, boo: 0 }, 1.3, "in");
[0, 1, 2, 3].forEach((i) => Pk("stadium", r3(T.seasons + 0.25 + i * 0.3), `fl${i}`, { lit: 0 }, 0.15, "out"));
Pk("stadium", r3(T.seasons + 0.6), "screen", { show: 0 }, 0.3);
sfx(r3(T.seasons + 0.05), "thunder", { gain: 0.6, loud: true, reason: "thunder as the seasons storm round him and the floodlights die" });
see(T.seasons, T.burst, ["spud", "swirl"], "the stadium empties round Spud, floodlights die, snow, leaves and rain swirl at once");

// ================================================================= 13 THE BURST (24.6-25.9): the watch explodes
A(r3(T.burst - 0.02), "spud", "turn", { to: 0, dur: 0.01, sync: true });
Pk("watch", r3(T.burst - 0.02), "swirl", { y: DOWN });
Pk("watch", r3(T.burst + 0.15), "watch", { burst: 1 }, 1.0, "out");
expr(r3(T.burst + 0.15), "spud", "terrified", { open: 0.5, eye: 1.35 }, 0.08);
sfx(r3(T.burst + 0.15), "kenney/impact-glass-heavy", { gain: 0.9, loud: true, reason: "the watch glass bursting" }); sfx(r3(T.burst + 0.2), "ai/screen-crack", { gain: 0.6, reason: "glass and springs scattering" });
see(T.burst, T.dawn, ["spud.face", "watch"], "close: the watch bursts in his glove, glass, gears and springs flying");

// ================================================================= 14 ONE YEAR AGO (25.9-29.8): Chip doesn't know him
cap(T.dawn, r3(T.dawn + 1.6), "1 YEAR AGO", 300);
Pk("watch", r3(T.dawn - 0.02), "watch", { y: DOWN });
c.arm(r3(T.dawn - 0.02), "spud", "R", { o: [0.12, 0.35, 0.12] }, 0.01); c.arm(r3(T.dawn - 0.02), "spud", "L", { o: [0.12, 0.35, 0.12] }, 0.01);
Pk("watch", r3(T.dawn - 0.02), "medal", { scale: 0.001 });
Pk("watch", r3(T.dawn - 0.02), "rain", { x: DX, z: -1, alpha: 0.4 });
place(T.dawn, "spud", [r3(DX + 0.7), -1.5], -80, 0);
expr(r3(T.dawn - 0.02), "spud", "shocked", { open: 0.2 }, 0.01); look(r3(T.dawn - 0.02), "spud", [-0.4, 0], 0.01);
place(T.dawn, "chip", [r3(DX - 5.0), -0.9], 90, 0);
for (const sd of ["L", "R"]) c.arm(r3(T.dawn - 0.02), "chip", sd, { o: [0.1, 0.32, 0.12] }, 0.01);
A(r3(T.dawn + 0.1), "chip", "move", { to: [r3(DX - 0.15), -0.95], dur: 1.0, ease: "linear" });
expr(r3(T.dawn - 0.02), "chip", "focused", {}, 0.01);
A(r3(T.dawn + 1.15), "spud", "move", { to: [r3(DX + 0.55), -1.15], dur: 0.35, ease: "out" });
c.arm(r3(T.dawn + 1.2), "spud", "L", { o: [0.06, 0.55, 0.22] }, 0.3); c.arm(r3(T.dawn + 1.2), "spud", "R", { o: [0.06, 0.55, 0.22] }, 0.3);
expr(r3(T.dawn + 1.2), "spud", "delighted", { open: 0.4 }, 0.1);
A(r3(T.dawn + 1.15), "chip", "turn", { to: 60, dur: 0.2 });
expr(r3(T.dawn + 1.5), "chip", "terrified", { open: 0.3 }, 0.12);
say(r3(T.dawn + 2.1), "chip", "Do I know you?", 1.0, "question", "Do I know you?");
c.arm(r3(T.shove - 0.15), "chip", "L", { o: [0.04, 0.6, 0.2] }, 0.15); c.arm(r3(T.shove - 0.15), "chip", "R", { o: [0.04, 0.6, 0.2] }, 0.15);
A(T.shove, "spud", "move", { to: [r3(DX + 0.95), -1.35], dur: 0.35, ease: "out", steps: 2 });
expr(T.shove, "spud", "sad", { curve: -1 }, 0.15);
sfx(T.shove, "pat", { gain: 0.5, reason: "Chip's gloves shoving Spud's chest" });
see(T.dawn, T.end15, ["spud.face", "chip.face"], "grey dawn, the empty stadium in the rain: Chip jogging; Spud grabs him; Chip shoves him off, scared");

// ================================================================= 15 "I'M CHIP" (29.8-36.8): their first meeting again
place(T.end15, "spud", [r3(DX + 0.85), -1.15], -70, 0);
A(r3(T.end15 - 0.02), "spud", "crouch", { to: 1, dur: 0.01, sync: true }); A(r3(T.end15 - 0.02), "spud", "pitch", { to: 10, dur: 0.01, sync: true });
c.arm(r3(T.end15 - 0.02), "spud", "L", { o: [0.12, 0.2, 0.28] }, 0.01); c.arm(r3(T.end15 - 0.02), "spud", "R", { o: [0.12, 0.2, 0.28] }, 0.01);
expr(r3(T.end15 - 0.02), "spud", "sad", { curve: -1, eye: 1 }, 0.01); look(r3(T.end15 - 0.02), "spud", [0, -0.4], 0.01);
place(T.end15, "chip", [r3(DX - 0.4), -1.3], -90, 0);
for (const sd of ["L", "R"]) c.arm(r3(T.end15 - 0.02), "chip", sd, { o: [0.1, 0.3, 0.06] }, 0.01);
A(T.end15, "chip", "move", { to: [r3(DX - 1.5), -1.5], dur: 0.8, ease: "linear" });
A(r3(T.end15 + 1.0), "chip", "turn", { to: 90, dur: 0.35 });
expr(r3(T.end15 + 1.0), "chip", "sad", { curve: -0.2 }, 0.2);
A(r3(T.end15 + 1.4), "chip", "move", { to: [r3(DX + 0.05), -1.3], dur: 0.9, ease: "inOut" });
const SHAKE = [r3(DX + 0.42), 0.24, -1.15];   // where the two gloves meet
c.arm(r3(T.end15 + 2.4), "chip", "L", { world: SHAKE }, 0.35, "out");   // the glove on the camera side (the far one crossed his face)
expr(r3(T.end15 + 2.4), "chip", "kind", { curve: 0.5 }, 0.2);
say(r3(T.end15 + 2.5), "chip", "You okay? I'm Chip.", 1.4, "calm", "You okay? I'm Chip.");
look(r3(T.end15 + 2.6), "spud", [-0.3, 0.3], 0.25); expr(r3(T.end15 + 2.8), "spud", "sad", { curve: 0.2, eye: 1 }, 0.3);
c.arm(r3(T.end15 + 3.2), "spud", "R", { world: [r3(SHAKE[0] + 0.07), SHAKE[1], SHAKE[2]] }, 0.4, "out");
expr(r3(T.end15 + 3.7), "spud", "kind", { curve: 0.4 }, 0.3);
cap(r3(T.end15 + 3.6), END, "Would you still want it?", SUBY);
see(T.end15, END, ["spud.face", "chip.face", "wreck"], "Spud on his knees in a puddle by the broken watch; Chip comes back and holds out his hand");

// ---------------------------------------------------------------- shots (camera A looks -z from the infield side)
const SH = {
  finish:  { pos: [1.4, 1.0, 1.7], look: [-0.4, 1.0, -4.0], fov: 44, to: { pos: [1.3, 1.0, 1.45], look: [-0.4, 1.0, -4.0], fov: 44 }, dur: T.start, ease: "linear" },
  start:   { pos: [r3(START_X + 2.8), 0.45, 1.4], look: [r3(START_X - 0.4), 0.45, -2.4], fov: 52 },
  win:     { pos: [5.6, 1.1, 0.4], look: [1.2, 1.2, -2.6], fov: 46, to: { pos: [5.3, 1.2, 0.3], look: [1.6, 1.5, -2.6], fov: 48 }, dur: r3(T.crane - T.win), ease: "out" },
  crane:   { pos: [5.6, 1.2, 1.8], look: [2.0, 1.4, -4.4], fov: 58 },
  amb:     { pos: [4.2, 1.0, 7.2], look: [7.0, 1.0, 1.0], fov: 46 },
  j2:      { pos: [4.6, 0.85, 6.45], look: [4.85, 0.62, 4.7], fov: 46 },
  drag:    { pos: [4.6, 6.0, -5.0], look: [4.0, 4.4, -11.5], fov: 48 },
  sob:     { pos: [2.3, 0.9, 1.2], look: [3.4, 1.9, -8], fov: 46 },
  hug:     { pos: [2.5, 1.3, 0.5], look: [2.35, 0.3, -2.3], fov: 46 },
  screen:  { pos: [4.0, 2.0, 6], look: [6.0, 15.5, -28], fov: 56 },
  boo:     { pos: [2.4, 5.5, 14], look: [2.6, 6.0, -20], fov: 58 },
  choice:  { pos: [2.4, 1.05, 0.9], look: [-0.4, 0.8, -2.6], fov: 46 },
  wind:    { pos: [1.08, 0.62, 0.15], look: [1.0, 0.5, -0.95], fov: 40 },
  seasons: { pos: [1.0, 1.3, 4.6], look: [1.0, 4.5, -20], fov: 60 },
  burst:   { pos: [1.12, 0.66, 0.25], look: [1.0, 0.5, -0.95], fov: 42 },
  dawn:    { pos: [r3(DX + 2.9), 1.05, 2.4], look: [r3(DX - 0.2), 0.7, -1.4], fov: 50 },
  end15:   { pos: [r3(DX + 0.95), 1.0, 2.6], look: [r3(DX + 0.55), 0.3, -1.0], fov: 46 },
};
const CUTS = [
  ["01 the photo finish", 0, SH.finish, "hook"],
  ["02 the start", T.start, SH.start],
  ["03 he wins", T.win, SH.win],
  ["04 the crane", T.crane, SH.crane],
  ["05 the ambulance", T.amb, SH.amb, "reveal"],
  ["06a jump two", T.j2, SH.j2],
  ["06 the drag", T.drag, SH.drag],
  ["07 Wedge sobs", T.sob, SH.sob],
  ["08a the hug", T.hug, SH.hug],
  ["08 the screen", T.screen, SH.screen],
  ["09 the boos", T.boo, SH.boo, "payoff"],
  ["10 the choice", T.choice, SH.choice],
  ["11 winding", T.wind, SH.wind],
  ["12 the seasons", T.seasons, SH.seasons],
  ["13 the burst", T.burst, SH.burst],
  ["14 one year ago", T.dawn, SH.dawn],
  ["15 I'm Chip", T.end15, SH.end15, "reaction"],
];

// ---------------------------------------------------------------- the narrator (voice 1, "narrator"), in the gaps
const NG = 4.0;
const NARR = !VO ? [] : [
  [0, "You can undo any loss. By the third jump, your best friend forgets you.", 1, 5.6, NG],
  [r3(T.crane + 0.15), "But there's a catch.", 1, 1.1, NG],
  [r3(T.amb + 0.3), "Every fix breaks something bigger.", 1, 2.1, NG],
  [r3(T.j2 + 0.1), "Jump two.", 1, 0.9, NG],
  [r3(T.screen + 0.3), "Your best friend picked your rival.", 1, 2.6, NG],
  [r3(T.choice + 0.3), "Would you jump again?", 1, 1.6, NG],
  [r3(T.dawn + 0.2), "Jump three. No way back.", 1, 1.9, NG],
  [r3(T.end15 + 4.0), "Would you still want it?", 1, 1.4, NG],
];
for (const [t, line, take, , gain] of NARR) c.at(t, { macro: "narrate", line, voice: "narrator", take, caption: false, gain });

const beats = c.beats(CUTS, END);
for (const cp of c.captions) for (const [, cut] of CUTS) if (cp.from < cut - 0.05 && cp.to > cut - 0.03) cp.to = r3(cut - 0.03);

const allowClip = [
  { who: "spud", with: "watch", from: 0, to: T.dawn, reason: "the pocket watch in his glove" },
  { who: "chip", with: "sign", from: 0, to: T.amb, reason: "his sign in his glove" },
  { who: "chip", with: "stad", from: 0, to: T.amb, reason: "standing on the front tier's tread behind the barrier" },
  ...["spud", "chip"].map((who) => ({ who, with: "stad", from: T.drag, to: T.hug, reason: "climbing the aisle steps of the stand" })),
  { who: "wdg", with: "crane", from: T.crane, to: T.amb, reason: "his glove round the crane's cable" },
  { who: "spud", with: "medal", from: T.amb, to: T.dawn, reason: "the medal worn round his neck" },
  { who: "spud", with: "chip", from: T.drag, to: T.sob, reason: "dragging Chip by the glove up the steps" },
  { who: "chip", with: "wdg", from: T.hug, to: T.screen, reason: "the hug" },
  { who: "chip", with: "spud", from: r3(T.dawn + 1.3), to: T.end15, reason: "Spud grabs Chip, Chip shoves him off" },
  { who: "chip", with: "spud", from: r3(T.end15 + 3.2), to: END, reason: "the handshake" },
];

write(import.meta.url, {
  id: VO ? "time-travel" : "time-travel-no-vo",
  title: "What if you could time travel? But there's a catch.",
  idea: "There's a catch, episode 7: Spud loses a world final by a nose and time-travels to fix it; every fix breaks something bigger: his best friend hurt, then on his rival's side, then, when the watch bursts, a stranger one year earlier",
  fps: 30, look: "anime-pro", profile: "short", loop: false, captionStyle: "kinetic", captionBand: [250, 1360],
  castLook: LOOK, cleanStart: true,
  motion: MOTION, rig: RIG, physics: PHYSICS, animeTiming: ANIME_TIMING, loopIdle: false,
  set: { type: "plain", color: "#0d1526", floor: "#3a1a1a", light: "night", para: 0, bloom: "emissive", aperture: 0,
    lighting: LIGHTING, hatch: HATCH, cel: CEL, ink: true, satsuei: true },
  // music that supports the story (Jonny 11 Nov): from 0.0, changes at the turn; danger = a recorded orchestra (12 Nov)
  // one score (assets/music/time-travel/README.md): chase to the catch, disaster, suspense from the hug, swell into the burst, sad piano at dawn
  music: { file: process.env.MUSIC ?? "time-travel/time-travel-score.ogg", gain: 0.6, lowCut: 90, dip: false, duck: { voice: -6 } },
  sound: { signature: false, sfx: 0.65, ambience: VO ? 0.06 : 0.2, surface: "concrete", room: "open", guard: true },
  hook: { show: ["spud", "wdg", "chip", "watch"], hint: 0, what: "a world final in the rain at the finish tape: Wedge's nose ahead of Spud's, Chip with his sign behind the barrier, the watch clicking" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip,
  notes: "Generated by storyboards/series/what-if/07-time-travel/make-time-travel.mjs.",
});
