// EVERY JUMP, SOMEONE FORGETS YOU. (There's a catch, episode 9, new story). Jonny 13 Nov 2026: "kind of nice" on the catch,
// "go for it, dont forget to add music fitting the situation" (18:59 Berlin) on the 16-panel board (BOARD-PROMPT.md).
// Opener A: the stake at frame 0 (Chip on the last rope). Stake-first line + 2-4 word text. Story + beats: STORY.md.
// New looks: DESIGN.md (Fable). Places, cameras, decisions: NOTES.md.
//   node storyboards/series/what-if/09b-teleport-forget/make-teleport-forget.mjs          -> teleport-forget.json
//   ... --no-vo -> teleport-forget-no-vo.json: without the narrator (staging and local drafts, no speech model)
//
// THE BRIEF
//   Want:   Spud wants to save his best friend Chip, hanging from the last rope of a broken bridge. He can teleport.
//   Catch:  every jump, someone forgets him. He doesn't pick who.
//   Chain:  Chip hangs, SO Spud jumps onto the rope (Mash forgets: he fades from Mash's photo), SO he grabs Chip's wrist;
//           the last strand snaps, SO they fall; SO he jumps them up to the lip (Wedge forgets); Wedge pulls only Chip up,
//           his eyes passing over Spud, and the lip breaks, SO Spud falls alone; SO he jumps back (Chip forgets):
//           "...who are you?" Last frame: the photo, three friends and a gap.
//
// WORLD (DESIGN 1): the near ledge is y 0 for z > 0, its lip at z 0; the gap z 0 .. -9; the far top y 0.4 for z < -9;
// the river y -70. The rope runs along z at x 0 (near post z 0.5, far post z -9.5), sagging to its lowest at z -4.5.
// Mash's room: a zroom (props-zflat.js, dress "living") at ROOM, far off the gorge. The photo doubles stand at PHOTO.
import { clip, write, r3 } from "../../../lib/clip.mjs";
import * as grips from "../../../lib/grips.mjs";

// ---------------------------------------------------------------- the template's picks (storyboards/templates)
const LOOK = "sheet", LIGHTING = 2, HATCH = { boil: 0.25 }, CEL = { at: 0.25 }, ANIME_TIMING = true;
const MOTION = { feet: 2, overlap: true, timing: true, solve: true }, RIG = { hand: 2, eyes: 2, hold: 2 }, PHYSICS = true;
const c = clip({ faces: "strong", lines: { sub: true, blink: false } }), { A, sfx, cap, see } = c;
const VO = !process.argv.includes("--no-vo");
// the builder's pack: until props-gorge.js is in, its kinds are stood in for by boxes at the real sizes (the staging proof)
const READY = new Set((process.env.READY ?? "gorge").split(",").filter(Boolean));
const has = (pack) => READY.has(pack);
const box = (w, h, d) => ({ kind: "stoneblock", w, h, d });
const ph = (pack, final, stand) => (has(pack) ? final : { id: final.id, x: final.x, y: final.y ?? 0, z: final.z, ...(final.rot != null && { rot: final.rot }), ...stand });
const Pk = (pack, t, id, set, dur, ease) => { if (has(pack)) P(t, id, set, dur, ease); };

// ---------------------------------------------------------------- the beats (video s)
// 01 Chip on the rope | 02 the fray | 03 Spud decides | 04 jump 1 | 05 Mash | 06 the photo fades | 07 the wrist |
// 08 the snap | 09 the fall | 10 jump 2, the lip | 11 Wedge forgets | 12 the glove slips | 13 the fall alone |
// 14 jump 3 | 15 "...who are you?" | 15b Spud | 16 the photo with the gap
const T = {
  fray: 1.4, pop1: 2.0, decide: 2.6, j1: 4.35, a1: 4.75, mash: 5.6, photo: 6.6, fade: 7.0, rope: 8.4, grab: 8.65, pop2: 9.3,
  snapC: 10.0, snap: 10.3, fall: 10.8, j2: 12.45, lip: 12.6, hood: 13.5, lipbreak: 14.7, slip: 15.6, off: 16.25,
  alone: 16.6, j3: 18.75, a3: 19.0, meet: 21.0, who: 21.9, close: 23.6, still: 24.0, gap: 25.6, END: 28.6,
};
const END = T.END;
const DOWN = -200;          // parked far under the gorge
const PARK = [300, 0];      // off every set
const yawTo = ([x, z], [tx, tz]) => r3((Math.atan2(tx - x, tz - z) * 180) / Math.PI);
const place = (t, who, at, yaw, y) => { A(r3(t - 0.02), who, "move", { to: at, dur: 0.01, steps: 0, ease: "linear", sync: true, ...(y != null && { y }) }); A(r3(t - 0.02), who, "turn", { to: yaw, dur: 0.01, ease: "linear", sync: true }); };
const park = (t, who, k = 0) => place(t, who, [PARK[0] + k * 3, PARK[1]], 0, 0);
const expr = (t, who, e, set, dur = 0.12) => A(r3(t), who, "expr", { expr: e, ...(set && { set }), dur });
const P = (t, id, set, dur = 0.01, ease = "linear") => c.prop(r3(t), id, set, dur, ease);
const look = (t, who, to, dur = 0.2) => A(r3(t), who, "look", { to, dur, blink: false });
const SUBY = 470;   // speech lettering in the upper third, under the stake text, never over a face (Jonny 12 Nov)
const say = (t, who, line, dur, tone) => c.say(r3(t), who, line, dur, tone, { voice: false, sub: line, pos: SUBY });
const arm = (t, who, side, pose, dur = 0.2, ease = "inOut") => c.arm(r3(t), who, side, pose, dur, ease);
const grip = (t, who, side, shape, dur = 0.08) => A(r3(t), who, "grip", { side, shape, dur });

// ---------------------------------------------------------------- places (world metres, DESIGN 1-2)
const ROPE_Y = -0.9;                                  // the rope's lowest point (z -4.5), its top surface ~ +0.03
const ropeY = (z) => r3(ROPE_Y + 0.12 * ((z + 4.5) / 5) ** 2 * 5);   // a shallow sag either side of z -4.5 (stand-in until DESIGN 2's curve)
const CHIP_GLOVE = [0, ropeY(-4.55), -4.55];          // Chip's L glove round the rope
const SPUD_GLOVE = [0, ropeY(-5.15), -5.15];          // Spud's L glove round the rope
const HANG = { chip: 0.86, spud: 1.12 };              // root under the glove (glove y - root y) for a straight hanging arm (layout)
const CHIP_HANG = [0.0, -4.42], SPUD_HANG = [0.18, -5.12];   // Spud a little to the side, so his reach to the wrist passes beside Chip
const LEDGE = { spud: [-0.75, 0.8], wedge: [0.8, 0.88] };   // panel 01: the two friends at the lip, backs to us
const LIP = { spud: [0.2, 0.15], chip: [-0.75, 0.2] };          // DESIGN 1.5 SPUD_LIP (on the chunk), CHIP_LIP
const PULLED = [-0.75, 0.75];                                  // where Wedge drags Chip back to
const WEDGE_PULL = [-0.75, 1.08];                              // Wedge behind Chip, reaching for the hood
const KNEEL3 = [0.55, 0.75];                                   // jump 3: Spud on his knees on the ledge
const MEET = { chip: [-0.3, 0.7], wedge: [-0.95, 1.15] };
const ROOM = [0, 0, -260];                                     // Mash's flat (zroom), far off the gorge
const COUCH = [0, ROOM[2] - 1.0];
const PHOTO = { x: 0, z: 1.5 };                                // DESIGN 6: the doubles on the near ledge, the gorge behind them
const PH_X = { pwedge: 4.85, pspud: 5.78, pchip: 6.6, pmash: 7.28 };   // DESIGN 6 spread a little: shoulder to shoulder, no arm through a body

const cast = [
  { id: "spud", character: "potatobrawl/spud", at: LEDGE.spud, face: 180, expr: "terrified", follow: 0.3, seed: 1.3 },
  { id: "chip", character: "potatobrawl/chip", at: CHIP_HANG, y: r3(CHIP_GLOVE[1] - HANG.chip), face: 60, expr: "terrified", follow: 0.3, seed: 4.4 },
  { id: "wedge", character: "potatobrawl/wedge", at: LEDGE.wedge, face: 185, expr: "terrified", follow: 0.3, seed: 2.2 },
  { id: "mash", character: "potatobrawl/mash", at: [PARK[0] + 9, PARK[1]], face: 0, expr: "kind", follow: 0.3, seed: 3.1 },
  // the photo on Mash's phone: the four friends as they were, arm to arm (only the snapshots see them)
  ...Object.entries(PH_X).map(([id, x], i) => ({ id, character: `potatobrawl/${id.slice(1)}`, at: [r3(PHOTO.x + x), PHOTO.z], face: 0, expr: "happy", follow: 0.3, seed: 6 + i })),
];

// ---------------------------------------------------------------- props
const NIL = { ...box(0.01, 0.01, 0.01), y: DOWN };
const PLANK_T = [0.15, 0.9, 2.2, 3.6, 9.4, 10.35];   // loose planks letting go of the broken bridge (panels 01, 09)
const props = [
  // ---- the gorge (T1 props-gorge.js, DESIGN 1-3)
  ph("gorge", { id: "gorge", kind: "gorge", x: 0, y: 0, z: 0, lipbreak: 0 }, { ...box(120, 40, 14), y: -40, z: 7 }),
  ph("gorge", { id: "farcliff", kind: "stoneblock", x: 0, y: DOWN, z: 0, w: 0.01, h: 0.01, d: 0.01 }, { ...box(120, 40.4, 14), y: -40, z: -16 }),
  ph("gorge", { id: "rope", kind: "bridgerope", x: 0, y: 0, z: 0, strands: 3, snap: 0, sway: 0 }, NIL),
  ph("gorge", { id: "planks", kind: "planks", x: 0, y: 0, z: 0, starts: PLANK_T }, NIL),
  // ---- Mash's flat (props-zflat.js zroom, dress living) + couch + lamp
  { id: "room", kind: "zroom", x: ROOM[0], y: 0, z: ROOM[2], w: 4.4, d: 3.6, h: 2.6, dress: "living", floor: "boards", seed: 3, dim: 0.35, glowx: 1.3, glowz: r3(ROOM[2] - 1.1) },
  { id: "couch", kind: "couch", x: COUCH[0], y: 0, z: COUCH[1], rot: 0, color: "#4f6b45", color2: "#668a5a" },   // board 05: a green sofa
  { id: "lamp", kind: "sidelamp", x: 1.3, z: r3(ROOM[2] - 1.3) },
  { id: "mphone", kind: "phone", x: 0, y: DOWN, z: 0 },
];

// seed every param that is first tweened later (an unseeded tween writes NaN)
Pk("gorge", 0, "gorge", { lipbreak: 0, crumble: 0 }); Pk("gorge", 0, "rope", { strands: 3, snap: 0, sway: 0, nearfall: 0 });

// a jump: the body gone in one frame (hidden + parked), a puff of dust where he was; never a fade, flash or flicker
const puff = (t, pos, leave) => c.at(r3(t), { fx: "poof", pos, dur: leave ? 0.6 : 0.45, color: "#cdbfa6", puffs: leave ? 12 : 7, sparks: 0, size: leave ? 0.3 : 0.2, lift: 0.05, sound: false });
const scuff = (t, why) => sfx(r3(t), "ai/step-concrete", { gain: 0.35, reason: why });
const jumpOut = (t, who, pos) => { A(r3(t), who, "squash", { amount: 0.12, dur: 0.07 }); A(r3(t + 0.07), who, "hide"); puff(r3(t + 0.07), pos, true); scuff(r3(t + 0.07), "dust scuffing up where he was"); };
const jumpIn = (t, who, pos) => { A(r3(t - 0.01), who, "show"); puff(t, pos, false); A(r3(t), who, "squash", { amount: 0.08, dur: 0.12 }); };
const creak = (t, gain = 0.35, why = "the last rope creaking under the weight") => sfx(r3(t), "creak", { gain, reason: why });
const popStrand = (t, n) => { Pk("gorge", t, "rope", { strands: n }, 0.06, "out"); sfx(r3(t), "ai/branch-snap", { gain: 0.45, reason: "a rope strand parting" }); };
const wind = (from, to, gain = 0.06) => { for (let t = from; t < to - 0.2; t = r3(t + 6)) sfx(r3(t), "ai/storm-wind", { gain, dur: r3(Math.min(6, to - t)), reason: "wind in the gorge, far under" }); };

// ================================================================= 01 CHIP ON THE ROPE (0-1.4) + 02 THE FRAY (1.4-2.6)
// Frame 0: Chip hangs by his left glove from the single rope, legs kicking over the drop; planks tumble past him;
// Spud and Wedge at the lip, frozen, backs to us.
A(0, "chip", "move", { to: CHIP_HANG, y: r3(CHIP_GLOVE[1] - HANG.chip), dur: 0.01, steps: 0, ease: "linear", sync: true });
arm(0, "chip", "L", { world: CHIP_GLOVE }, 0.01); grip(0, "chip", "L", "fist", 0.01);
arm(0, "chip", "R", { o: [0.25, 0.35, 0.12] }, 0.01);
for (let t = 0.3; t < T.rope; t = r3(t + 0.9)) arm(t, "chip", "R", { o: [t % 1.8 < 0.9 ? 0.32 : 0.2, t % 1.8 < 0.9 ? 0.45 : 0.3, 0.15] }, 0.35);   // the free arm reaching, flailing
expr(0, "chip", "terrified", { open: 0.45, eye: 1.25 }, 0.01); look(0, "chip", [0.35, 0.65], 0.01);
expr(0, "spud", "terrified", { open: 0.3 }, 0.01); expr(0, "wedge", "terrified", { open: 0.35 }, 0.01);
look(0, "spud", [0.1, -0.5], 0.01); look(0, "wedge", [-0.1, -0.5], 0.01);
arm(0, "wedge", "R", { o: [0.15, 0.45, 0.25] }, 0.01); arm(0, "wedge", "L", { o: [0.15, 0.45, 0.25] }, 0.01);
cap(0, T.j1, "BEST FRIEND FALLING", 255);
creak(0.05, 0.4); creak(1.2, 0.35); wind(0, T.mash);
sfx(0.6, "plank-rattle", { gain: 0.25, reason: "a plank clattering down the rock face far below" });
see(0, T.fray, ["chip.face", "spud", "wedge"], "frame 0: Chip hangs by one glove from the last rope over the gorge; Spud and Wedge frozen at the lip");
// 02 the fray: close on his glove and the three strands beside it; one pops
popStrand(T.pop1, 2);
look(T.fray + 0.1, "chip", [0.0, 0.9], 0.15); expr(T.pop1 + 0.05, "chip", "terrified", { open: 0.6, eye: 1.35 }, 0.06);
A(r3(T.pop1 + 0.02), "chip", "squash", { amount: 0.06, dur: 0.2 });
see(T.fray, T.decide, ["chip.face", "rope"], "his glove on the rope, the strands beside it popping; his face below, looking up at it");

// ================================================================= 03 SPUD DECIDES (2.6-4.35) + 04 JUMP 1 (4.35-5.6)
look(T.decide, "spud", [0.0, -0.35], 0.15);
expr(T.decide + 0.2, "spud", "focused", { brow: 1.0, open: 0.05 }, 0.15);
A(r3(T.decide + 0.3), "spud", "blink", { dur: 0.9 });   // eyes shut tight
grip(T.decide + 0.3, "spud", "R", "fist", 0.15); grip(T.decide + 0.3, "spud", "L", "fist", 0.15);
arm(T.decide + 0.3, "spud", "R", { o: [0.12, 0.3, 0.12] }, 0.25); arm(T.decide + 0.3, "spud", "L", { o: [0.12, 0.3, 0.12] }, 0.25);
look(T.decide + 0.5, "wedge", [-0.7, 0.0], 0.2);
arm(T.decide + 0.7, "wedge", "L", { world: [-0.05, 0.6, 0.85] }, 0.45, "out");   // reaching toward Spud (his left: Spud stands on that side)
expr(T.decide + 0.7, "wedge", "terrified", { open: 0.3, brow: 0.8 }, 0.15);
see(T.decide, T.j1, ["spud.face", "wedge.face"], "Spud at the lip, eyes shut, fists clenched; Wedge reaching for him");
// the jump: gone from the ledge, Wedge's glove closes on air; in the same frame Spud appears on the rope beside Chip
jumpOut(T.j1, "spud", [LEDGE.spud[0], 0.05, LEDGE.spud[1]]);
grip(T.j1 + 0.1, "wedge", "L", "fist", 0.12); arm(T.j1 + 0.1, "wedge", "L", { world: [-0.3, 0.58, 0.82] }, 0.2, "out");
expr(T.j1 + 0.15, "wedge", "shocked", { open: 0.5, eye: 1.3 }, 0.08); look(T.j1 + 0.15, "wedge", [-0.6, -0.2], 0.12);
// he arrives hanging by his left glove, 0.5 m beyond Chip on the rope
place(T.a1 - 0.03, "spud", SPUD_HANG, 60, r3(SPUD_GLOVE[1] - HANG.spud));
arm(r3(T.a1 - 0.03), "spud", "L", { world: SPUD_GLOVE }, 0.01); grip(T.a1 - 0.03, "spud", "L", "fist", 0.01);
arm(r3(T.a1 - 0.03), "spud", "R", { o: [0.32, 0.3, -0.05] }, 0.01);
expr(T.a1 - 0.03, "spud", "focused", { brow: 1, open: 0.2 }, 0.01); look(T.a1 - 0.03, "spud", [0.6, 0.0], 0.01);
jumpIn(T.a1, "spud", [0, r3(SPUD_GLOVE[1] - 0.5), SPUD_HANG[1]]);
Pk("gorge", T.a1, "rope", { sway: 0.06 }, 0.25, "out"); Pk("gorge", r3(T.a1 + 0.25), "rope", { sway: 0 }, 0.8, "inOut");
creak(T.a1 + 0.05, 0.5, "the rope taking his weight");
look(T.a1 + 0.1, "chip", [-0.8, 0.1], 0.15); expr(T.a1 + 0.15, "chip", "shocked", { open: 0.4 }, 0.1);
see(T.j1, T.mash, ["wedge.face"], "jump 1: Spud gone from the ledge in a puff of dust, Wedge's glove closes on air");

// ================================================================= 05 MASH (5.6-6.6) + 06 THE PHOTO FADES (6.6-8.4)
// Far away at home, Mash on his sofa scrolling: he never notices. The cut away is the catch made visible.
const SOFA = [COUCH[0], r3(COUCH[1] + 0.05)];
place(T.mash, "mash", SOFA, 0);
A(r3(T.mash + 0.01), "mash", "sit", { seat: "couch", dur: 0.01, hands: "keep", feet: [0.36, 0.08] });
const PHONE = { id: "mphone", kind: "phone", ...grips.placeFor("phone", [0.1, 0.78, r3(SOFA[1] + 0.38)], 180), tip: -25 };
P(r3(T.mash - 0.03), "mphone", { x: PHONE.x, y: PHONE.y, z: PHONE.z, rot: PHONE.rot, tip: PHONE.tip });
const hPh = grips.phone(c, "mash", PHONE, { side: "R" });
c.arm(r3(T.mash - 0.02), "mash", "R", { prop: "mphone", grip: hPh.hands.R.grip, palm: true }, 0.01); grip(T.mash - 0.02, "mash", "R", "hold", 0.01);
A(r3(T.mash - 0.01), "mash", "grab", { prop: "mphone", hand: "R", grip: hPh.hands.R.grip, dur: 0, pose: null });
arm(T.mash - 0.02, "mash", "L", { o: [0.08, 0.42, 0.24] }, 0.01);
expr(T.mash, "mash", "deadpan", { lid: 0.3 }, 0.01); look(T.mash, "mash", [0.05, -0.55], 0.01);
A(r3(T.mash + 0.5), "mash", "tap", { count: 2, every: 0.35, side: "L" });
see(T.mash, T.photo, ["mash.face", "mphone"], "Mash at home on his sofa, bored, scrolling his phone at chest height");
// the phone: the friends' photo; Spud fades out of it, the others stay. Snapshot of the doubles on the ledge.
const PHOTO_CAM = { pos: [6.0, 1.0, 7.8], look: [6.0, 1.05, 1.5], fov: 50 };   // DESIGN 6
c.at(T.photo, { fx: "photo", style: "screen", dur: r3(T.rope - T.photo), shot: 0.5, cam: PHOTO_CAM, aspect: 1.0, w: 900, pos: [540, 960],
  fade: { hide: ["pspud"], at: r3(T.fade - T.photo), dur: 1.0 } });
see(T.photo, T.rope, ["mphone"], "the photo of the four friends on Mash's phone: Spud fades out of it");

// ================================================================= 07 THE WRIST (8.4-10.0) + 08 THE SNAP (10.0-10.8)
// Spud hangs by his left glove and grabs Chip's left wrist with his right; another strand pops
const WRIST = [0, r3(CHIP_GLOVE[1] - 0.14), r3(CHIP_GLOVE[2] - 0.04)];
arm(T.grab - 0.25, "spud", "R", { world: [0.08, r3(WRIST[1] - 0.05), r3(WRIST[2] - 0.08)] }, 0.25, "out");
arm(T.grab, "spud", "R", { world: WRIST }, 0.12, "in"); grip(T.grab + 0.05, "spud", "R", "fist", 0.08);
look(T.rope, "spud", [0.6, 0.15], 0.01); look(T.rope, "chip", [-0.7, 0.15], 0.01);
expr(T.grab + 0.1, "chip", "terrified", { open: 0.2, brow: 0.6 }, 0.15);
popStrand(T.pop2, 1); creak(T.rope + 0.2, 0.45);
expr(T.pop2 + 0.05, "spud", "terrified", { open: 0.3 }, 0.08); look(T.pop2 + 0.05, "spud", [0.8, 0.3], 0.1);
// Jonny 13 Nov (draft 1): "not enough motion ... no drama". The two swing under the rope, legs kicking, both terrified;
// the pop jolts them and the camera; Chip screams.
const SWING = [[8.42, 0.15], [8.8, -0.11], [9.18, 0.09], [9.42, 0.17], [9.78, -0.12], [10.0, 0.06]];
for (const [who, at] of [["chip", CHIP_HANG], ["spud", SPUD_HANG]]) {
  let t0 = T.rope;
  for (const [t1, dx] of SWING) { A(r3(t0), who, "move", { to: [r3(at[0] + (who === "spud" ? dx * 0.8 : dx)), at[1]], dur: r3(t1 - t0), steps: 3.2 }); t0 = t1; }
}
expr(T.rope, "spud", "terrified", { open: 0.35, brow: 0.9 }, 0.01); expr(T.rope, "chip", "terrified", { open: 0.75, eye: 1.4 }, 0.01);
for (let t = T.rope; t < T.snapC; t = r3(t + 0.3)) A(r3(t), "chip", "squash", { amount: 0.03, dur: 0.15 });   // sobbing breaths
A(r3(T.pop2), "chip", "squash", { amount: 0.1, dur: 0.18 }); A(r3(T.pop2), "spud", "squash", { amount: 0.1, dur: 0.18 });
c.at(r3(T.pop2), { fx: "shake", dur: 0.35, amp: 0.05 });
expr(T.pop2 + 0.1, "chip", "terrified", { open: 0.9, eye: 1.5 }, 0.06);
say(T.pop2 + 0.15, "chip", "Don't let go!", 0.75, "excited");
sfx(r3(T.rope + 0.3), "crumble", { gain: 0.2, reason: "grit from the rope fibres pattering down the wall" });
creak(T.rope + 0.9, 0.45); creak(T.pop2 + 0.25, 0.55, "the rope groaning after the strand parts");
see(T.rope, T.snapC, ["spud.face", "chip.face", "rope"], "Spud hangs beside Chip and grabs his wrist; another strand pops");
popStrand(T.snap, 0); Pk("gorge", r3(T.snap + 0.03), "rope", { snap: 1 }, 1.0, "out");
sfx(r3(T.snap), "ai/branch-snap", { gain: 0.8, loud: true, reason: "the last strand snapping" });
c.at(r3(T.snap), { fx: "shake", dur: 0.45, amp: 0.06 });
see(T.snapC, T.fall, ["rope"], "close on the rope: the last strand snaps, the ends fly apart");

// ================================================================= 09 THE FALL (10.8-12.45): together, he holds Chip's wrist
// From the snap they drop on one curve, so his grip on the wrist never moves on Chip (local poses, the same fall for both).
const FALL = r3(T.j2 - T.snap - 0.05), FALL_DY = -16;
for (const [who, at] of [["spud", SPUD_HANG], ["chip", CHIP_HANG]]) {
  const y0 = r3((who === "spud" ? SPUD_GLOVE[1] - HANG.spud : CHIP_GLOVE[1] - HANG.chip));
  A(r3(T.snap + 0.05), who, "drop", { to: r3(y0 + FALL_DY), dur: FALL });
}
// both hands leave the rope at the snap and fly up; the wrist hold stays a world aim moving with them
arm(T.snap + 0.05, "spud", "L", { o: [0.25, 0.75, 0.05] }, 0.25, "out"); grip(T.snap + 0.05, "spud", "L", "open", 0.1);
arm(T.snap + 0.05, "chip", "L", { world: [WRIST[0], r3(WRIST[1] + FALL_DY), WRIST[2]] }, FALL, "in");
arm(T.snap + 0.05, "spud", "R", { world: [WRIST[0], r3(WRIST[1] + FALL_DY), WRIST[2]] }, FALL, "in");
expr(T.snap + 0.1, "chip", "terrified", { open: 0.7, eye: 1.4 }, 0.06); expr(T.snap + 0.1, "spud", "terrified", { open: 0.5, eye: 1.3 }, 0.06);
sfx(r3(T.snap + 0.1), "ai/storm-wind", { gain: 0.3, dur: 1.9, reason: "air rushing past them as they fall" });
see(T.fall, T.j2, ["spud", "chip"], "looking down the gorge: they fall together, small against the cliffs, his glove on Chip's wrist");

// ================================================================= 10 JUMP 2 (12.45-13.5) + 11 WEDGE FORGETS (13.5-15.6)
// The camera hangs over the gorge looking back at the ledge (frame of 10-15): faces turned toward the drop read.
jumpOut(T.j2, "spud", [0, -14, -4.95]); A(r3(T.j2 + 0.07), "chip", "hide"); puff(r3(T.j2 + 0.07), [0, -14.5, -4.4], true);
place(T.lip - 0.02, "spud", LIP.spud, -160, 0); place(T.lip - 0.02, "chip", LIP.chip, 175, 0);
for (const side of ["R", "L"]) { arm(T.lip - 0.02, "spud", side, { o: [0.2, 0.25, 0.22] }, 0.01); grip(T.lip - 0.02, "spud", side, "open", 0.01); arm(T.lip - 0.02, "chip", side, { o: [side === "R" ? 0.12 : 0.28, 0.45, 0.12] }, 0.01); }
A(r3(T.lip - 0.02), "spud", "crouch", { to: 0.5, dur: 0.01 }); A(r3(T.lip - 0.02), "chip", "pitch", { to: 16, dur: 0.01 });   // Chip tipping toward the drop
jumpIn(T.lip, "spud", [LIP.spud[0], 0.05, LIP.spud[1]]); A(r3(T.lip - 0.01), "chip", "show"); puff(T.lip, [LIP.chip[0], 0.05, LIP.chip[1]], false);
expr(T.lip, "chip", "terrified", { open: 0.6 }, 0.01); look(T.lip, "chip", [0, -0.8], 0.01);
expr(T.lip, "spud", "terrified", { open: 0.4 }, 0.01); look(T.lip, "spud", [0.4, -0.4], 0.01);
A(r3(T.lip + 0.3), "spud", "crouch", { to: 0.15, dur: 0.4 });
// Wedge runs in from where he stood, behind Chip, both fists to the hood on Chip's back
place(T.lip - 0.02, "wedge", LEDGE.wedge, yawTo(LEDGE.wedge, WEDGE_PULL), 0);
for (const side of ["R", "L"]) { arm(T.lip - 0.02, "wedge", side, "rest", 0.01); grip(T.lip - 0.02, "wedge", side, "open", 0.01); }
expr(T.lip, "wedge", "terrified", { open: 0.4, brow: 0.9 }, 0.01); look(T.lip, "wedge", [0.0, -0.4], 0.01);
A(r3(T.lip + 0.05), "wedge", "move", { to: WEDGE_PULL, dur: 0.65, ease: "out", stride: 1.2 });
A(r3(T.lip + 0.6), "wedge", "turn", { to: 180, dur: 0.2 });
const HOOD0 = [LIP.chip[0], 0.45, r3(LIP.chip[1] + 0.36)], HOOD1 = [PULLED[0], 0.45, r3(PULLED[1] + 0.36)];   // the rolled hood on his back (Chip 0.53 tall)
const fists = (t, at, dur, ease) => { arm(t, "wedge", "R", { world: [r3(at[0] - 0.07), at[1], at[2]] }, dur, ease); arm(t, "wedge", "L", { world: [r3(at[0] + 0.07), at[1], at[2]] }, dur, ease); };
fists(T.hood - 0.3, [HOOD0[0], r3(HOOD0[1] + 0.1), r3(HOOD0[2] + 0.12)], 0.3, "out");
fists(T.hood, HOOD0, 0.1, "in");
grip(T.hood + 0.08, "wedge", "R", "fist"); grip(T.hood + 0.08, "wedge", "L", "fist");
sfx(r3(T.hood + 0.1), "crinkle", { gain: 0.3, reason: "Wedge's fists closing on the hoodie" });
// the pull: Chip back onto the rock; Wedge's fists stay on the hood (both on the same ease and clock)
const PULL = 0.8, P0 = r3(T.hood + 0.2);
A(P0, "chip", "move", { to: PULLED, dur: PULL, steps: 0, ease: "inOut" }); A(P0, "chip", "pitch", { to: 0, dur: PULL, ease: "inOut" });
A(P0, "wedge", "move", { to: [PULLED[0], r3(PULLED[1] + 0.7)], dur: PULL, ease: "inOut", stride: 0.6 });
fists(P0, HOOD1, PULL, "inOut");
for (const side of ["R", "L"]) arm(r3(P0 + PULL + 0.15), "wedge", side, { o: [0.12, 0.42, 0.22] }, 0.35);   // he lets go, gloves on Chip's shoulders
grip(P0 + PULL + 0.1, "wedge", "R", "open"); grip(P0 + PULL + 0.1, "wedge", "L", "open");
// his eyes pass over Spud like over a stranger: nothing in his face changes
look(r3(P0 + PULL + 0.2), "wedge", [0.8, -0.2], 0.35); expr(r3(P0 + PULL + 0.2), "wedge", "deadpan", { lid: 0.1 }, 0.3);
look(r3(P0 + PULL + 0.8), "wedge", [-0.2, -0.4], 0.3);
arm(r3(P0 + PULL + 0.2), "spud", "L", { world: [-0.15, 0.62, 0.55] }, 0.3, "out"); grip(P0 + PULL + 0.2, "spud", "L", "open");   // Spud reaching for Wedge
expr(r3(P0 + PULL + 0.25), "spud", "shocked", { open: 0.4, eye: 1.25 }, 0.12); look(r3(P0 + PULL + 0.25), "spud", [-0.7, 0.3], 0.15);
see(T.lip, T.slip, ["wedge.face", "spud.face", "chip.face"], "Wedge pulls Chip up by the hood, his eyes passing over Spud as if he isn't there");
// the lip breaks under Spud (DESIGN 1.3: p linear over 2.44 s is real gravity); he drops into the notch and catches
// the rock either side of it with both gloves
const LB = 2.44;
Pk("gorge", T.lipbreak, "gorge", { lipbreak: 1 }, LB, "linear"); Pk("gorge", T.lipbreak, "rope", { nearfall: 1 }, LB, "linear");
sfx(r3(T.lipbreak), "crumble", { gain: 0.6, loud: true, reason: "the rock lip breaking under him" });
const HANG_EDGE = [0.2, 0.0], EDGE_HANG_Y = -1.0, EDGE_R = [-0.12, 0.0, 0.25], EDGE_L = [0.52, 0.0, 0.25];
A(r3(T.lipbreak + 0.3), "spud", "crouch", { to: 0, dur: 0.12 });
A(r3(T.lipbreak + 0.25), "spud", "turn", { to: 0, dur: 0.18 });
A(r3(T.lipbreak + 0.3), "spud", "move", { to: HANG_EDGE, y: EDGE_HANG_Y, dur: 0.35, steps: 0, ease: "in" });
arm(T.lipbreak + 0.45, "spud", "R", { world: EDGE_R }, 0.25, "out"); arm(T.lipbreak + 0.45, "spud", "L", { world: EDGE_L }, 0.25, "out");
grip(T.lipbreak + 0.6, "spud", "R", "fist"); grip(T.lipbreak + 0.6, "spud", "L", "fist");
expr(T.lipbreak + 0.3, "spud", "terrified", { open: 0.7, eye: 1.4 }, 0.06); look(T.lipbreak + 0.4, "spud", [0, 0.9], 0.2);
// the two step back from the edge: Chip shaken, Wedge holding him
look(T.lipbreak + 0.2, "chip", [0.6, -0.5], 0.2); expr(T.lipbreak + 0.2, "chip", "shocked", { open: 0.4 }, 0.1);

// ================================================================= 12 THE GLOVE SLIPS (15.6-16.6) + 13 THE FALL ALONE (16.6-18.75)
// Seen from above the lip: his face turned up to the two of them; the flake under his glove breaks (crumble)
Pk("gorge", r3(T.off - 0.45), "gorge", { crumble: 1 }, 1.5, "linear");
arm(T.off - 0.35, "spud", "L", { world: [0.52, -0.08, 0.2] }, 0.3, "in");   // the left glove slides off first
grip(T.off - 0.05, "spud", "L", "open", 0.06);
sfx(r3(T.off - 0.35), "scrape", { gain: 0.3, reason: "his glove sliding over the rock" });
sfx(r3(T.off - 0.15), "crumble", { gain: 0.3, reason: "the flake under his glove breaking away" });
see(T.slip, T.off, ["spud.face"], "close from above: his gloves slipping off the broken lip, pebbles falling, his wide eyes");
const FALL2 = r3(T.j3 - T.off - 0.05), FALL2_DY = -20;
A(T.off, "spud", "drop", { to: r3(EDGE_HANG_Y + FALL2_DY), dur: FALL2 });
A(T.off, "spud", "move", { to: [0.2, -0.55], dur: 0.4, steps: 0, ease: "out" });   // no y: a y here held him at the lip (draft 1)   // out into corridor B, off the wall
A(T.off, "spud", "pitch", { to: -35, dur: 0.6, ease: "out" });   // falling on his back, face up to them
grip(T.off, "spud", "R", "open", 0.06);
arm(T.off, "spud", "R", { o: [0.3, 0.8, 0.2] }, 0.3, "out"); arm(T.off, "spud", "L", { o: [0.3, 0.8, 0.2] }, 0.3, "out");
look(T.off + 0.1, "spud", [0, 1], 0.2);
sfx(r3(T.off + 0.05), "ai/storm-wind", { gain: 0.3, dur: 2.4, reason: "air rushing past him as he falls" });
see(T.alone, T.j3, ["spud.face"], "from above: Spud falls away alone into the gorge, his face up to the two at the edge");

// ================================================================= 14 JUMP 3 (18.75-21.0) + 15 "...WHO ARE YOU?" + 16 THE GAP
jumpOut(T.j3, "spud", [0.2, r3(EDGE_HANG_Y - 18), -0.55]);
place(T.a3 - 0.02, "spud", KNEEL3, -140, 0);
A(r3(T.a3 - 0.02), "spud", "pitch", { to: 0, dur: 0.01 });
A(r3(T.a3 - 0.02), "spud", "crouch", { to: 0.8, dur: 0.01 });
for (const side of ["R", "L"]) { arm(T.a3 - 0.02, "spud", side, { o: [0.2, 0.12, 0.22] }, 0.01); grip(T.a3 - 0.02, "spud", side, "flat", 0.01); }   // gloves on the rock
expr(T.a3 - 0.02, "spud", "sad", { open: 0.3, brow: 0.6 }, 0.01); look(T.a3 - 0.02, "spud", [0, -0.6], 0.01);
jumpIn(T.a3, "spud", [KNEEL3[0], 0.05, KNEEL3[1]]);
place(T.a3, "chip", MEET.chip, 140, 0); place(T.a3, "wedge", MEET.wedge, 155, 0);
for (const side of ["R", "L"]) { arm(T.a3, "wedge", side, "rest", 0.01); arm(T.a3, "chip", side, "rest", 0.01); grip(T.a3, "wedge", side, "relaxed", 0.01); }
look(T.a3, "chip", [0.8, -0.2], 0.01); look(T.a3, "wedge", [0.8, -0.2], 0.01);
expr(T.a3 + 0.15, "chip", "shocked", { open: 0.3 }, 0.1); expr(T.a3 + 0.15, "wedge", "shocked", { open: 0.2 }, 0.1);
for (const t of [T.a3 + 0.3, T.a3 + 0.9, T.a3 + 1.5]) A(r3(t), "spud", "squash", { amount: 0.05, dur: 0.45 });   // panting
sfx(r3(T.a3 + 0.2), "ai/heartbeat", { gain: 0.45, reason: "his heart after the fall" });
see(T.a3, T.meet, ["spud", "chip.face", "wedge"], "jump 3: Spud on his knees on the ledge, panting; Chip and Wedge a step away");
// 15: he looks up, sees Chip alive, gets up with a trembling smile and reaches for him; Chip leans back, polite
look(T.meet - 0.4, "spud", [-0.8, 0.4], 0.25); expr(T.meet - 0.2, "spud", "happy", { curve: 0.6, eye: 1.1 }, 0.3);
A(r3(T.meet), "spud", "crouch", { to: 0, dur: 0.5 });
arm(T.meet + 0.4, "spud", "R", { o: [0.15, 0.42, 0.36] }, 0.45, "out"); grip(T.meet + 0.4, "spud", "R", "open", 0.2);
arm(T.meet + 0.4, "spud", "L", "rest", 0.4); grip(T.meet + 0.4, "spud", "L", "relaxed", 0.2);
A(r3(T.meet + 0.55), "chip", "lean", { to: -10, dur: 0.4 });
expr(T.meet + 0.55, "chip", "kind", { curve: 0.15, brow: 0.35 }, 0.3);   // the polite face you give a stranger
look(T.meet + 0.2, "chip", [0.8, 0.3], 0.2); look(T.meet + 0.2, "wedge", [0.8, 0.2], 0.2); expr(T.meet + 0.4, "wedge", "deadpan", {}, 0.3);
say(T.who, "chip", "...who are you?", 1.3, "question");
expr(T.who + 1.3, "spud", "sad", { open: 0.15, brow: 0.8, curve: -0.3 }, 0.35);
arm(T.who + 1.5, "spud", "R", { o: [0.12, 0.3, 0.22] }, 0.5); grip(T.who + 1.5, "spud", "R", "relaxed", 0.3);
see(T.meet, T.close, ["spud.face", "chip.face"], "Spud reaches for Chip with a relieved smile; Chip leans back from a stranger: ...who are you?");
see(T.close, T.gap, ["spud.face"], "close on Spud: it lands");
// 16 the photo again: three friends and a gap
c.at(T.gap, { fx: "photo", style: "screen", dur: r3(END - T.gap), shot: 0.5, cam: PHOTO_CAM, aspect: 1.0, w: 900, pos: [540, 960], hide: ["pspud"] });
see(T.gap, END, ["mphone"], "the photo on Mash's phone: three friends and an empty gap where Spud stood");

// the photo doubles: arm to arm, smiling, the whole clip (only the snapshots look at them)
for (const id of Object.keys(PH_X)) { expr(0, id, "happy", { curve: 0.8 }, 0.01); look(0, id, [0, 0.1], 0.01); for (const side of ["R", "L"]) arm(0, id, side, "rest", 0.01); }
arm(0, "pspud", "R", "wave", 0.01); arm(0, "pchip", "L", "up", 0.01);   // a wave and a cheer for the photo

// ---------------------------------------------------------------- shots
const SH = {
  hook:  { pos: [-0.35, 1.85, 4.1], look: [0.0, -1.6, -4.5], fov: 52 },   // board 01: from just behind the two, down into the gorge
  fray:  { pos: [1.3, -1.05, -3.55], look: [0, -1.2, -4.5], fov: 40 },
  decide:{ pos: [-0.55, 1.05, -2.3], look: [-0.45, 0.55, 0.8], fov: 56 },
  j1:    { pos: [1.6, 3.0, 3.6], look: [0.0, -1.4, -3.4], fov: 58 },
  mash:  { pos: [0.6, 1.05, r3(ROOM[2] + 1.6)], look: [0.0, 0.6, r3(ROOM[2] - 1.0)], fov: 46 },
  rope:  { pos: [3.3, -0.7, -3.7], look: [0, -1.45, -4.8], fov: 50, to: { pos: [2.5, -0.95, -4.1], look: [0, -1.4, -4.8], fov: 46 }, dur: 1.6, ease: "linear" },   // board 07: side on, the drop below
  snap:  { pos: [1.05, -0.6, -4.72], look: [0, -0.77, -4.44], fov: 22 },
  fall:  { pos: [3.0, 0.8, -4.6], look: [0, -12, -4.6], fov: 60 },   // board 09: straight down, the walls left and right
  lip:   { pos: [-1.3, 0.95, -1.7], look: [-0.3, 0.5, 0.6], fov: 52 },
  slip:  { pos: [0.2, 1.15, 1.35], look: [0.2, -0.75, 0.0], fov: 46 },
  alone: { pos: [0.3, 1.0, -1.2], look: [0.2, -6, -0.45], fov: 60, to: { pos: [0.3, -15, -1.2], look: [0.2, -28, -0.45], fov: 60 }, dur: 2.15, ease: "in" },   // Jonny: he must really fall; the camera chases him down corridor B
  a3:    { pos: [0.1, 0.95, -1.5], look: [0.1, 0.45, 0.8], fov: 52 },
  meet:  { pos: [-0.1, 0.95, -1.4], look: [0.0, 0.55, 0.75], fov: 54 },
  close: { pos: [-0.75, 0.8, -0.85], look: [0.55, 0.62, 0.75], fov: 34 },
};
const CUTS = [
  ["01 Chip on the rope", 0, SH.hook, "hook"],
  ["02 the fray", T.fray, SH.fray],
  ["03 Spud decides", T.decide, SH.decide],
    ["05 Mash", T.mash, SH.mash],
  ["06 the photo", T.photo, SH.mash],
  ["07 the wrist", T.rope, SH.rope],
  ["08 the snap", T.snapC, SH.snap],
  ["09 the fall", T.fall, SH.fall],
  ["10 jump 2, the lip", T.lip, SH.lip],
  ["12 the glove slips", T.slip, SH.slip],
  ["13 the fall alone", T.alone, SH.alone],
  ["14 jump 3", T.a3, SH.a3],
  ["15 who are you", T.meet, SH.meet, "payoff"],
  ["15b Spud", T.close, SH.close, "reaction"],
  ["16 the gap", T.gap, SH.mash],
];

// ---------------------------------------------------------------- the narrator (voice 1, deep storyteller), in the gaps
const NG = 4.0;
const NARR = !VO ? [] : [
  [0.15, "Your best friend is falling.", 2.3],
  [2.75, "But you can teleport.", 1.5],
  [4.8, "But there's a catch.", 1.4],
  [6.45, "Every jump, someone forgets you.", 2.2],
  [T.still, "Would you still jump?", 1.4],
];
for (const [t, line, dur] of NARR) c.at(r3(t), { macro: "narrate", line, voice: "narrator", take: 1, dur, caption: true, pos: SUBY, gain: NG });

const beats = c.beats(CUTS, END);

const allowClip = [
  { who: "chip", with: "rope", from: 0, to: T.snap, reason: "his glove round the rope" },
  { who: "spud", with: "rope", from: T.a1, to: T.snap, reason: "his glove round the rope" },
  { who: "spud", with: "chip", from: T.grab, to: T.j2, reason: "his glove round Chip's wrist" },
  { who: "wedge", with: "chip", from: T.hood, to: r3(P0 + PULL + 0.1), reason: "his fists on Chip's hood" },
  ...["pwedge", "pspud", "pchip", "pmash"].map((who) => ({ who, from: 0, to: END, reason: "the photo's four, arm to arm (DESIGN 6); only the snapshot camera sees them" })),
  { who: "spud", with: "gorge", from: T.lipbreak, to: T.off, reason: "his gloves on the broken lip" },
  { who: "spud", from: r3(T.snap + 1.2), to: r3(T.j2 + 0.1), checks: ["rig-jump"], reason: "free fall: 10-15 m/s at the end of the drop is 35-50 cm a frame" },
  { who: "chip", from: r3(T.snap + 1.2), to: r3(T.j2 + 0.1), checks: ["rig-jump"], reason: "free fall: 10-15 m/s at the end of the drop is 35-50 cm a frame" },
  { who: "spud", from: r3(T.off + 1.0), to: r3(T.j3 + 0.1), checks: ["rig-jump"], reason: "free fall alone: 12-16 m/s at the end of the drop" },
];

write(import.meta.url, {
  id: VO ? "teleport-forget" : "teleport-forget-no-vo",
  title: "He saves his best friend. Then they forget him",
  idea: "There's a catch, episode 9: Spud can teleport to save his best friend Chip from a snapping rope bridge, but every jump someone forgets him; Mash fades him out of a photo, Wedge leaves him on the lip, and the friend he saved asks who he is",
  fps: 30, look: "anime-pro", profile: "short", loop: false, captionStyle: "kinetic", captionBand: [250, 1360],
  castLook: LOOK, cleanStart: true,
  motion: MOTION, rig: RIG, physics: PHYSICS, animeTiming: ANIME_TIMING, loopIdle: false,
  set: { type: "plain", color: "#9ec3e6", floor: "none", light: "sunset", para: 0, aperture: 0,
    lighting: LIGHTING, hatch: HATCH, cel: CEL, ink: true, satsuei: true },
  // dramatic scenario = a recorded orchestra from 0.0 that changes at the turn (Jonny 11 + 12 Nov; 13 Nov "music fitting
  // the situation"): assets/music/teleport-forget/README.md
  music: { file: process.env.MUSIC ?? "teleport-forget/teleport-forget-score.ogg", gain: 0.6, lowCut: 90, dip: false, duck: { voice: -6 } },
  sound: { signature: false, sfx: 0.65, ambience: VO ? 0.06 : 0.2, surface: "grass", room: "open", guard: true },
  hook: { show: ["chip", "spud", "wedge", "rope"], hint: 0, what: "Chip hanging by one glove from the last frayed rope of a broken bridge over a deep gorge; Spud and Wedge frozen at the edge" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip,
  notes: "Generated by storyboards/series/what-if/09b-teleport-forget/make-teleport-forget.mjs.",
});
