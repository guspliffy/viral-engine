// POTATO DESK 09 "Hell has better reviews than heaven" (Help Desk 2: the six court mechanics on the Help Desk format;
// Jonny 19 Nov 2026: story v2 + reversal ending "lets do it like this" 12:51, panel sheet "go" 13:37 Berlin).
// Story + panels: /mnt/project-files/videos/potato-desk/09-hell-reviews/ (STORY.md, sheets/hell-reviews-sheet-v1.png).
// Design (sizes, marks, cameras): DESIGN.md next to this file.
//   node storyboards/series/potato-desk/09-hell-reviews/make-hell-reviews.mjs -> hell-reviews.json
//
// Hook (on trial): on screen "Hell has better reviews than heaven." (Jonny adds it in the app), caption question "Why
// would anyone rate hell five stars?". The ending releases it: hell's five stars are a vain Devil's; threaten him with
// one star and he fixes every catch and serves you himself.
// Chain: the reviews say hell, so the little one picks hell, so the Devil welcomes him, so each perk is a catch (lava,
// fries, pitchfork, one song, a view of heaven), so he heads for the exit, so the Devil begs a rating, so he says one
// star, so the Devil cracks and fixes every perk, so the stars go up to four, so the Devil sobs; the next customer
// already knows the trick ("Hell. One star.").
// Opener A (the desk is running at frame 0: "Heaven or hell?" over both badges from 0.0 s).
// Two sets in one world: set A (the crossroads desk) at the origin, set B (the hell resort lobby) at x + BX, so the
// rail camera of set B never sees set A. No names in any line (Jonny 18 Nov).
import { clip, write, r3 } from "../../../lib/clip.mjs";
import * as act from "../../../lib/acting.mjs";
import * as grips from "../../../lib/grips.mjs";
import { LINES } from "./lines.mjs";

const c = clip({ faces: "strong", lines: { sub: false, blink: false } }), { sfx, cap, see } = c;
// an action set exactly at a cut moves 0.02 s earlier, so the first drawing of the new shot already has it (animeTiming
// draws on twos: a pose set at the cut frame showed the old shot's arms for two frames, rig-jump in layout 1)
const CUTS = new Set();
const A = (t, ...rest) => c.A(CUTS.has(r3(t)) ? r3(t - 0.02) : t, ...rest);
const F = (t) => r3(Math.round(t * 30) / 30);
const F2 = (t) => r3(Math.round(t * 15) / 15);

// measured spoken lengths (node qa/lines.mjs desk09-voice-probe.json, 19 Nov 2026), in LINES order
const DUR = [1.33, 1.33, 1.04, 0.88, 2.21, 1.86, 0.69, 1.28, 1.07, 0.84, 1.42, 0.86, 1.01, 0.83, 1.04, 1.93, 2.49, 0.84, 1.30, 1.76, 0.89, 0.54, 1.13, 0.85, 1.12, 1.33, 2.70, 0.90];
const T = new Array(LINES.length).fill(null);
const END_OF = (i) => r3(T[i] + DUR[i]);

// ---------------------------------------------------------------- places
const BX = 40;                                   // set B's world offset along x
const B = (x, z) => [r3(BX + x), z];             // a set-B floor point
const TER = 0.40;                                // the cloud terrace's top (set A)
// set A marks (DESIGN §2)
const REAP = [-0.82, 0.30], CHIP_A = [0.70, 0.10], DEV_DOOR = [0.80, -0.92], DEV_PEEK = [0.64, -1.82];   // DEV_PEEK: inside the hot box behind the hell door
const REAP_YAW = 35, CHIP_YAW = -35;
// parking spots far off camera (hidden there too)
const PARK = { chip: [-30, 5], devil: [-34, 5], imp: [-38, 5], wedge: [-42, 5] };
// looks [x, y]: + screen right, + up
const AT_US = [0, 0.05];

const cast = [
  { id: "reaper", character: "notyet/reaper-noscythe", at: REAP, face: REAP_YAW, expr: "deadpan", follow: 0.2, seed: 1.3 },
  { id: "chip", character: "potatobrawl/chip", at: CHIP_A, face: CHIP_YAW, expr: "eager", follow: 0.4, seed: 2.3 },
  { id: "devil", character: "potatobrawl/devil", at: PARK.devil, face: 0, expr: "delighted", follow: 0.3, seed: 6.6 },
  { id: "imp", character: "potatobrawl/devil-imp", at: PARK.imp, face: 0, expr: "deadpan", follow: 0.2, seed: 4.4 },
  { id: "wedge", character: "potatobrawl/wedge", at: PARK.wedge, face: CHIP_YAW, expr: "smug", follow: 0.3, seed: 3.1 },
];

// ---------------------------------------------------------------- props
const at3 = (x, y, z) => ({ x, y, z });
const AWAY = -60;                                // a prop parked below the world (swapped on a cut or under a poof)
const PUFFS = [[-2.30, 0.30, 11], [-1.62, 0.26, 12], [-0.98, 0.32, 13], [-0.30, 0.24, 14], [0.40, 0.33, 15], [1.08, 0.27, 16], [1.78, 0.31, 17], [2.42, 0.25, 18]];
// held props (holds from storyboards/lib/grips.mjs; props-hella.js header): each one's place where its hold is made
const STAMP_AT = [-0.42, 0.66, 0.52];   // up in his left hand from frame 0 (panel 01), the counter side
const STAMP_HIT_AT = [-0.20, 0.505, 0.44];   // the form on the counter
const STAMP = { id: "stamp", kind: "rubberstamp", ...grips.placeFor("rubberstamp", STAMP_AT, REAP_YAW) };
const KETCHUP_AT = [BX + 1.20, 0.16, -0.40];   // in his hand by his side from the buffet cut
const KETCHUP = { id: "ketchup", staged: "parked under the world until a hand takes it on a cut", kind: "ketchupbottle", ...grips.placeFor("ketchupbottle", [BX + 1.20, AWAY, -0.40], -20) };
const FORK = { id: "fork", staged: "parked under the world until a hand takes it on a cut", kind: "pitchfork", ...at3(BX + 0.62, AWAY, 0.30), rot: 90 };
const TABD = { id: "tabletD", staged: "parked under the world until a hand takes it on a cut", kind: "reviewtablet", ...at3(BX + 1.15, AWAY, 0.30), rot: 135, scale: 0.8, lit: 0, hover: 0 };
const TABH = { id: "tabletH", staged: "parked under the world until a hand takes it on a cut", kind: "reviewtablet", ...at3(BX - 0.30, AWAY, 0.74), rot: 180, scale: 0.8, lit: 4, hover: 0 };
const TABC = { id: "tabletC", staged: "parked under the world until a hand takes it on a cut", kind: "reviewtablet", ...at3(BX + 0.25, AWAY, 0.80), rot: 150, scale: 0.75, lit: 1, hover: 0 };
const TABR = { id: "tabletR", staged: "propped on the tub's rim", kind: "reviewtablet", ...at3(BX - 0.90, AWAY, 0.78), rot: 120, scale: 0.6, lit: 3, hover: 0 };
const LEAF = { id: "leaf", staged: "parked under the world until a hand takes it on a cut", kind: "palmleaf", ...at3(BX - 0.45, AWAY, 0.55), rot: 135 };
const props = [
  // set A: the crossroads desk (DESIGN §2)
  { id: "skyA", staged: "far backdrop", kind: "afterlifesky", ...at3(0, -2, -14) },
  { id: "deck", staged: "the cloud floor", kind: "clouddeck", ...at3(0, 0, 0) },
  ...PUFFS.map(([x, r, seed], i) => ({ id: `puff${i}`, staged: "cloud on the terrace's front edge", kind: "cloudpuff", ...at3(x, r3(r * 0.85), -0.78), r, seed })),
  { id: "counter", staged: "stands on the cloud floor", kind: "woodcounter", ...at3(0, 0, -0.075), rot: 90, w: 1.25, d: 0.50, h: 0.50 },
  { id: "form", staged: "lies on the counter", kind: "blankreport", ...at3(0.05, 0.505, 0.25) },
  STAMP,
  { id: "scythe", staged: "planted in the cloud", kind: "parkedscythe", ...at3(0, 0.59, -0.76) },   // blade tip y 1.55 (DESIGN §2)
  { id: "doorH", staged: "stands on the terrace", kind: "reviewdoor", ...at3(-0.90, TER, -1.30), side: "heaven" },
  { id: "doorX", staged: "stands on the terrace", kind: "reviewdoor", ...at3(0.90, TER, -1.30), side: "hell", inside: true, smoke: true },
  { id: "badgeH", staged: "sits on the heaven door's casing", kind: "reviewbadge", ...at3(-0.86, 2.04, -1.26), side: "heaven" },
  { id: "badgeX", staged: "sits on the hell door's casing", kind: "reviewbadge", ...at3(0.86, 2.04, -1.26), side: "hell", flicker: 0 },
  // set B: the hell resort lobby (DESIGN §3), every x + BX
  { id: "room", staged: "the lobby shell", kind: "lobbyroom", ...at3(BX, 0, 0) },
  { id: "board", staged: "on two posts bolted to the floor", kind: "perkboard", ...at3(BX, 0, -1.00) },
  { id: "window", staged: "set in the back wall", kind: "curtainwindow", ...at3(BX - 1.60, 0.35, -1.30) },
  { id: "island", staged: "far outside the window", kind: "heavenisland", ...at3(BX - 2.05, 1.62, -7.5) },
  { id: "rock", staged: "far backdrop", kind: "rockshaft", ...at3(BX - 2.2, 1.0, -9) },
  { id: "beach", staged: "far outside the window", kind: "beachview", ...at3(BX - 2.05, AWAY, -7.5) },
  { id: "sunset", staged: "far backdrop", kind: "sunsetsky", ...at3(BX - 2.2, AWAY, -9) },
  { id: "speaker", staged: "stands on the floor", kind: "speakerbox", ...at3(BX - 0.82, 0, -1.05) },
  { id: "balloon", staged: "tied to the speaker", kind: "balloon", ...at3(BX - 0.80, 0.56, -1.05) },
  { id: "exit", staged: "set in the back wall", kind: "exitdoor", ...at3(BX + 1.10, 0, -1.30) },
  { id: "exitsign", staged: "screwed to the back wall", kind: "officesign", ...at3(BX + 1.10, 1.84, -1.27), w: 0.50, h: 0.20, lines: [["EXIT", 0.12]], plate: "#1f7a3a", ink: "#f3ead2", frame: "#d9a93a" },
  { id: "lights", staged: "hung on the wall", kind: "partylights", ...at3(BX, 0, -1.25) },
  { id: "tub", staged: "stands on the floor", kind: "lavatub", ...at3(BX - 1.30, 0, 0.50), glow: 1 },
  { id: "duck", staged: "floats on the tub", kind: "rubberduck", ...at3(BX - 1.12, 0.10, 0.42) },
  { id: "table", staged: "stands on the floor", kind: "buffettable", ...at3(BX + 1.63, 0, 0.25) },
  { id: "fries", staged: "on the table", kind: "friesmound", ...at3(BX + 1.63, 0.40, 0.0) },
  { id: "cake", staged: "on the table (swapped in under the poof)", kind: "cakestack", ...at3(BX + 1.63, AWAY, 0.0) },
  ...[0.31, 0.52, 0.73].map((z, i) => ({ id: `plate${i}`, staged: "on the table", kind: "buffetplate", ...at3(BX + 1.63, 0.40, z), food: "fries" })),
  KETCHUP,
  { id: "mat", staged: "lies on the floor", kind: "towelmat", ...at3(BX + 0.20, 0, 0.40) },
  FORK,
  { id: "fork2", staged: "lies on the floor", kind: "pitchfork", ...at3(BX + 0.95, AWAY, 0.75), tip: 90, rot: 70 },
  TABD, TABH, TABC, TABR, LEAF,
];

// ---------------------------------------------------------------- helpers
const SUB = 470;   // captions: upper third, under the in-app title band (Jonny 12 Nov)
const CAPTEXT = {};
const say = (i, at, extra = {}, capTo = null) => {
  T[i] = r3(at);
  const [who, line, tone, style, o = {}] = LINES[i];
  c.macro(T[i], who, "say", { line, tone, style, ...o, dur: DUR[i], caption: false, ...extra });
  cap(T[i], capTo ?? r3(END_OF(i) + 0.3), CAPTEXT[i] ?? line, SUB, false, { size: 64 });
  return END_OF(i);
};
const arm = (t, who, side, pose, dur = 0.3, ease = "inOut") => A(t, who, "arm", { side, pose, dur, ease });   // A: see CUTS
const grip = (t, who, side, shape, dur = 0.2) => A(t, who, "grip", { side, shape, dur });
const step = (t, who, to, dur, o = {}) => A(t, who, "move", { to, dur, ...o });   // o.steps: cadence (cycles a second; 3 = short strides for short, slow moves)
const look = (t, who, to, dur = 0.2) => A(t, who, "look", { to, dur });
const turn = (t, who, to, dur = 0.3) => A(t, who, "turn", { to, dur });
const expr = (t, who, e, dur = 0.2) => A(t, who, "expr", { expr: e, dur });
// placing someone on a cut (clip lessons: dur 0.01, linear, sync, at t - 0.02)
const place = (t, who, to, yaw, y = 0) => {
  A(r3(t - 0.02), who, "move", { to, dur: 0.01, ease: "linear", sync: true, ...(y != null && { y }) });
  A(r3(t - 0.02), who, "turn", { to: yaw, dur: 0.01, ease: "linear", sync: true });
};
const park = (t, who) => { place(t, who, PARK[who], 0); A(r3(t - 0.02), who, "hide"); };
const unpark = (t, who, to, yaw, y = 0) => { place(t, who, to, yaw, y); A(r3(t - 0.02), who, "show"); };
const poof = (t, pos, size = 0.45) => {
  c.at(r3(t), { fx: "poof", pos, dur: 0.4, color: "#f7fafc", puffs: 9, sparks: 0, size, lift: 0.08, sound: false });
  sfx(r3(t), "ai/cushion-poof", { gain: 0.55 });
};
const snap = (t, side = "R") => {   // thumb against middle finger at horn height, 3-frame flick
  arm(t, "devil", side, { o: [0.30, 1.05, 0.10] }, 0.3); grip(t, "devil", side, "pinch", 0.2);
  grip(r3(t + 0.3), "devil", side, "point", 0.1);
  sfx(r3(t + 0.32), "click", { gain: 0.9 });
  return r3(t + 0.33);
};
const slamX = (t, row) => {   // a red X slams across perk row `row` (0..4): the board's count tweens row -> row + 1
  c.prop(t, "board", { count: row + 1 }, 0.13, "out");
  sfx(r3(t + 0.1), "kenney/impact-plank-medium", { gain: 0.9 });
};
const peelX = (t, row) => { c.prop(t, "board", { fall: row + 1 }, 0.4, "linear"); sfx(r3(t + 0.05), "ai-package/cardboard-rustle", { gain: 0.4 }); };
// let go of a prop on a cut and hide it: a released prop falls with physics wherever the hand was, so it shrinks to nothing
const dropHidden = (tt, who, id) => { A(r3(tt - 0.03), who, "release", { prop: id, dur: 0 }); c.prop(r3(tt - 0.03), id, { scale: 0.001 }, 0); arm(r3(tt - 0.02), who, "both", "rest", 0.01); grip(r3(tt - 0.02), who, "both", "relaxed", 0.01); };
const hideProp = (t, id) => c.prop(t, id, { y: AWAY }, 0);
const showProp = (t, id, y) => c.prop(t, id, { y }, 0);

// ---------------------------------------------------------------- cameras (DESIGN §0)
const camAt = (x, y = 1.45, fov = 26) => ({ pos: [r3(x), y, 10.4], look: [r3(x), y, 0], fov });
const A_WIDE = camAt(0);
const A_BADGE = { pos: [0.86, 2.03, 3.6], look: [0.86, 2.03, -1.3], fov: 24 };
const A_PEEK = { pos: [0.60, 1.30, 2.3], look: [0.62, 1.28, -1.5], fov: 22 };   // the tag's insert: the Devil in the hell door's gap
const B_C = camAt(BX), B_L = camAt(BX - 0.75), B_R = camAt(BX + 0.75);
const B_GLASS = { pos: [BX - 1.60, 0.62, -4.3], look: [BX - 1.60, 0.50, -1.3], fov: 24 };
const B_TAB = { pos: [BX + 0.62, 0.75, 4.7], look: [BX + 0.62, 0.75, 0.3], fov: 24 };
const B_PAR = { pos: [BX + 0.35, 1.25, 8.6], look: [BX + 0.35, 0.85, 0], fov: 26 };   // the conga: closer and lower than the B_R massage shot before it
const B_VIEW = { pos: [BX - 0.80, 1.1, 7.6], look: [BX - 0.80, 0.9, 0], fov: 26 };   // the view: a step closer than the party wide (B_C to B_L read as a skipped frame)
const B_TUB = { pos: [BX - 0.80, 1.0, 6.0], look: [BX - 0.80, 0.75, 0], fov: 26 };   // four stars: closer and lower than B_L, so the cut from snap party reads as a cut
const B_DEVIL = { pos: [BX + 0.40, 0.78, 4.6], look: [BX - 0.28, 0.66, 0.3], fov: 24 };   // from the right: the window, the balloons and the beach behind him, not the board
const shots = [];
// cuts on the 2-frame grid animeTiming draws (a cut on an odd frame shows the old drawing one frame into the new shot)
const shot = (name, t, cam, kind) => { shots.push([name, F2(t), cam, kind].filter((v) => v !== undefined)); CUTS.add(F2(t)); return F2(t); };

// ================================================================ SET A: the desk (beats 1-5a)
const hs = grips.mug(c, "reaper", STAMP, { side: "L" });
let e = hs.take(0, { reach: 0.01, settle: 0.01 });
A(0, "imp", "hide"); A(0, "wedge", "hide"); A(0, "devil", "hide");
look(0, "reaper", [0.6, -0.1], 0.01); look(0, "chip", [-0.5, 0.35], 0.01);
act.blinksAt(c, "reaper", [2.4, 5.6]);
act.blinksAt(c, "chip", [3.3]);
shot("heaven or hell", 0, A_WIDE, "hook");
see(0, 1.3, ["reaper.face", "chip.face", "badgeH", "badgeX"], "the desk between heaven 3.1 and hell 4.9");
// 1 REAPER: Heaven or hell?
let t = say(0, 0.05);
// 2 CHIP points up at the 4.9, then the 3.1, and back: Hell. Five stars!
look(r3(t - 0.3), "chip", [0.35, 0.95]);
arm(r3(t - 0.3), "chip", "L", { o: [0.18, 1.0, 0.12] }, 0.35, "out"); grip(r3(t - 0.2), "chip", "L", "point");
expr(t, "chip", "delighted");
t = say(1, r3(t + 0.1));
arm(r3(t - 0.5), "chip", "L", { o: [-0.25, 0.95, 0.15] }, 0.3); look(r3(t - 0.5), "chip", [-0.7, 0.9]);
arm(r3(t + 0.05), "chip", "L", { o: [0.18, 1.0, 0.12] }, 0.3); look(r3(t + 0.05), "chip", [0.35, 0.95]);
see(T[1], t, ["chip.face", "badgeX"], "he points at hell's five stars");
// 3 REAPER's slow look: You're sure?   CHIP: Look at the reviews!
look(r3(t + 0.1), "reaper", [0.7, -0.15], 0.4); A(r3(t + 0.1), "reaper", "face", { lid: 0.42, dur: 0.3 });
t = say(2, r3(t + 0.45));
arm(r3(t + 0.05), "chip", "L", "rest", 0.4); grip(r3(t + 0.1), "chip", "L", "open", 0.3);
look(r3(t + 0.05), "chip", [-0.55, 0.35]);
t = say(3, r3(t + 0.15));
// 4 GAP: the Reaper stamps HELL; one dry beat. Funny. Everyone picks hell.
const ST = r3(t + 0.1);
e = hs.carry(ST, [STAMP_AT[0], 0.74, STAMP_AT[2]], 0.18, "out");   // a small lift
e = hs.carry(r3(e + 0.04), STAMP_HIT_AT, 0.1, "in");               // down onto the form: tok
const STAMP_HIT = e;
sfx(STAMP_HIT, "kenney/impact-wood-medium", { gain: 1.0 });
c.prop(STAMP_HIT, "doorX", { glow: 1 }, 0.25, "out");
sfx(r3(STAMP_HIT + 0.03), "ai/ignite", { gain: 0.35 });
e = hs.carry(r3(e + 0.15), STAMP_AT, 0.3, "inOut");
look(r3(STAMP_HIT + 0.3), "reaper", AT_US, 0.25); A(r3(STAMP_HIT + 0.3), "reaper", "face", { lid: 0.42, dur: 0.2 });
t = say(4, r3(STAMP_HIT + 0.65));
expr(r3(T[4] + 0.6), "chip", "kind");
look(r3(T[4] + 0.8), "chip", [0.2, 0.2]);
see(ST, t, ["reaper.face", "chip.face", "doorX"], "the gap: everyone picks hell (why?)");
// 5a the hell door bursts open: the Devil, arms wide, in a burst of ember smoke
const BURST = r3(t + 0.25);
c.prop(BURST, "doorX", { open: 1 }, 0.17, "out");
sfx(BURST, "door-slam", { gain: 0.9 });
c.at(r3(BURST + 0.05), { fx: "poof", pos: [0.80, TER + 0.5, -1.10], dur: 0.6, color: "#8f4a3a", puffs: 12, sparks: 0, size: 0.6, lift: 0.2 });
unpark(r3(BURST + 0.15), "devil", DEV_DOOR, -10, TER);
arm(r3(BURST + 0.15), "devil", "both", { o: [0.30, 0.62, 0.14] }, 0.01);
grip(r3(BURST + 0.15), "devil", "both", "open", 0.01);
look(r3(BURST + 0.1), "chip", [0.3, 0.6], 0.15); expr(r3(BURST + 0.1), "chip", "shocked", 0.15);
turn(r3(BURST + 0.1), "chip", -15, 0.3);
look(r3(BURST + 0.2), "reaper", [0.5, 0.4], 0.3);
t = say(5, r3(BURST + 0.45));
see(BURST, t, ["devil.face", "chip.face"], "the Devil bursts out of the hell door");

// ================================================================ SET B: the hell resort (beats 5b-17)
// 5b B-C: the Devil under the board, arms wide; the little one looks up at it (all five perks unmarked)
const LOBBY = shot("welcome", F(t + 0.1), B_C);
unpark(LOBBY, "devil", B(0, 0.20), 0); place(LOBBY, "chip", B(0.80, 0.50), -15);
arm(LOBBY, "devil", "both", { o: [0.30, 0.62, 0.12] }, 0.01);
look(LOBBY, "chip", [-0.3, 0.9], 0.01); expr(LOBBY, "chip", "delighted", 0.01);
look(LOBBY, "devil", AT_US, 0.01); expr(LOBBY, "devil", "delighted", 0.01);
sfx(LOBBY, "kenney/footstep-carpet", { gain: 0.3 });
see(LOBBY, r3(LOBBY + 1.4), ["board", "devil.face", "chip.face"], "the perk board: HOT TUB, BUFFET, MASSAGE, PARTY, VIEW");
t = r3(LOBBY + 1.5);

// 6 HOT TUB (B-L): lava; the duck melts; X on row 1
const TUB = shot("hot tub", t, B_L);
place(TUB, "devil", B(-1.30, -0.55), 0); place(TUB, "chip", B(-0.40, 0.45), -60);
arm(TUB, "devil", "both", { o: [0.30, 0.45, 0.25] }, 0.01); expr(TUB, "devil", "delighted", 0.01);
look(TUB, "chip", [-0.8, -0.4], 0.01); expr(TUB, "chip", "eager", 0.01);
A(r3(TUB + 0.2), "chip", "lean", { to: 12, dur: 0.4 });
c.prop(r3(TUB + 0.5), "duck", { wilt: 1 }, 1.0, "in");
sfx(r3(TUB + 0.5), "ai/water-leak-hiss", { gain: 0.35 });
A(r3(TUB + 1.0), "chip", "lean", { to: 0, dur: 0.15 }); step(r3(TUB + 1.0), "chip", B(-0.10, 0.45), 0.3);
expr(r3(TUB + 1.0), "chip", "shocked", 0.1); look(r3(TUB + 1.1), "chip", [-0.5, 0.2]);
t = say(6, r3(TUB + 1.25));
look(r3(t), "devil", [0.4, -0.2]);
t = say(7, r3(t + 0.15));
slamX(r3(t + 0.1), 0);
see(TUB, r3(t + 0.4), ["chip.face", "devil.face", "tub", "board"], "the hot tub is lava; X on HOT TUB");
t = r3(t + 0.55);

// 7 BUFFET (B-R): all you can eat, and every plate is fries; he backs away. The Devil offers ketchup. X on row 2
// (departure from panel 07: no cloche; the fries show at once, one hold less: clip lessons, many small hand props)
const BUF = shot("buffet", t, B_R);
const DEV_BUF = B(1.45, -0.68);
place(BUF, "devil", DEV_BUF, -20); place(BUF, "chip", B(0.95, 0.25), 70);
arm(BUF, "devil", "L", { o: [0.30, 0.45, 0.25] }, 0.01); arm(BUF, "devil", "R", "rest", 0.01);
look(BUF, "chip", [0.6, -0.4], 0.01); expr(BUF, "chip", "eager", 0.01);
A(r3(BUF + 0.15), "chip", "lean", { to: 10, dur: 0.3 });
expr(r3(BUF + 0.55), "chip", "terrified", 0.1);
A(r3(BUF + 0.6), "chip", "lean", { to: 0, dur: 0.15 });
step(r3(BUF + 0.65), "chip", B(0.55, 0.25), 1.0, { steps: 3 });
arm(r3(BUF + 0.65), "chip", "both", { o: [0.28, 0.55, 0.12] }, 0.3); grip(r3(BUF + 0.65), "chip", "both", "open", 0.2);
t = say(8, r3(BUF + 0.75));
const hk = grips.mug(c, "devil", { ...KETCHUP, ...grips.placeFor("ketchupbottle", KETCHUP_AT, -20) }, { side: "R" });
c.prop(r3(BUF - 0.03), "ketchup", { ...grips.placeFor("ketchupbottle", KETCHUP_AT, -20) }, 0);
hk.take(r3(BUF - 0.025), { reach: 0.01, settle: 0.01 });
e = hk.carry(r3(T[8] + 0.3), [BX + 1.10, 0.30, -0.36], 0.35, "out");
look(r3(e - 0.2), "devil", [-0.5, -0.1]);
t = say(9, r3(Math.max(t + 0.15, e - 0.1)));
slamX(r3(t + 0.1), 1);
see(BUF, r3(t + 0.4), ["chip.face", "devil.face", "fries", "board"], "the buffet is fries (his own kind); X on BUFFET");
t = r3(t + 0.55);

// 8 MASSAGE (B-R): on the mat, the imp pokes his back with the pitchfork; he hops on each. X on row 3
const MAS = shot("massage", t, B_R);
dropHidden(MAS, "devil", "ketchup");
place(MAS, "chip", B(0.20, 0.40), -70); place(MAS, "devil", B(0.90, -0.62), -20);
arm(MAS, "chip", "both", "rest", 0.01); grip(MAS, "chip", "both", "open", 0.01);
arm(MAS, "devil", "both", "rest", 0.01); grip(MAS, "devil", "both", "relaxed", 0.01);
const IMP = B(1.05, 0.40), IMP_YAW = -90;
unpark(MAS, "imp", IMP, IMP_YAW);
look(MAS, "chip", AT_US, 0.01); expr(MAS, "chip", "kind", 0.01);
// the imp has the fork from the first frame: its hold is made at the cut (the prop placed in his hand)
const FORK_AT = [r3(IMP[0] - 0.02), 0, r3(IMP[1] - 0.12)];
c.prop(r3(MAS - 0.02), "fork", { ...grips.placeFor("pitchfork", FORK_AT, IMP_YAW) }, 0);
const hf = grips.mug(c, "imp", { ...FORK, ...grips.placeFor("pitchfork", FORK_AT, IMP_YAW) }, { side: "R" });
hf.take(r3(MAS - 0.015), { reach: 0.01, settle: 0.01 });
e = hf.carry(r3(MAS + 0.1), [r3(IMP[0] - 0.12), 0.10, r3(IMP[1] - 0.05)], 0.7, "inOut", { tip: -60 });
for (let k = 0; k < 4; k++) {
  const p = r3(e + 0.1 + k * 0.5);
  A(p, "imp", "lean", { to: 10, dur: 0.12, ease: "out" }); A(r3(p + 0.15), "imp", "lean", { to: 0, dur: 0.2 });
  A(r3(p + 0.12), "chip", "hop", { count: 1, height: 0.04, quiet: true });
  sfx(r3(p + 0.12), "kenney/impact-soft-medium", { gain: 0.5 });
}
expr(r3(e + 0.2), "chip", "shocked", 0.1);
t = say(10, r3(e + 0.25));
t = say(11, r3(Math.max(t + 0.2, e + 1.9)));
slamX(r3(t + 0.1), 2);
see(MAS, r3(t + 0.4), ["chip.face", "devil.face", "imp", "board"], "the massage is a pitchfork; X on MASSAGE");
t = r3(t + 0.55);

// 9 PARTY (B-C): one balloon, one speaker, the same three notes; a conga loop he can't leave. X on row 4
const PAR = shot("party", t, B_PAR);
dropHidden(PAR, "imp", "fork"); park(PAR, "imp");
// the conga oval (front lane z 1.05 going -x, back lane z 0.15 going +x): each dancer walks it at one speed, the little
// one 1.0 m of path behind the Devil, so their bodies never meet
const OVAL = [B(0.95, 1.05), B(-0.25, 1.05), B(-0.25, 0.15), B(0.95, 0.15)];
const ovalAt = (d) => {   // the point d metres along the oval from OVAL[0], and the facing there
  const segs = OVAL.map((p, i) => [p, OVAL[(i + 1) % 4]]), lens = segs.map(([p, q]) => Math.hypot(q[0] - p[0], q[1] - p[1]));
  const per = lens.reduce((x, y) => x + y, 0); d = ((d % per) + per) % per;
  for (let i = 0; i < 4; i++) { if (d <= lens[i]) { const [p, q] = segs[i], k = d / lens[i]; const yaw = Math.round(Math.atan2(q[0] - p[0], q[1] - p[1]) * 180 / Math.PI); return { at: [r3(p[0] + (q[0] - p[0]) * k), r3(p[1] + (q[1] - p[1]) * k)], yaw }; } d -= lens[i]; }
};
// one move per straight stretch, the default ease (the feet plant: linear 0.3 s moves skated in layout 4)
const conga = (who, d0, t0, dur, v = 0.8) => {
  const lens = OVAL.map((p, i) => { const q = OVAL[(i + 1) % 4]; return Math.hypot(q[0] - p[0], q[1] - p[1]); });
  const s0 = ovalAt(d0), y0 = ovalAt(d0 + 0.01).yaw; place(t0, who, s0.at, y0);   // face the first stretch at once (a turn before the place was lost: the Devil walked sideways, then spun through the camera)
  const stops = []; let acc = 0;
  for (let lap = 0; lap < 2; lap++) for (const L of lens) { acc += L; stops.push(acc); }
  let d = d0, tt = t0, yaw = y0; const dEnd = d0 + v * dur;
  for (const st of stops) {
    if (st <= d + 0.05) continue;
    const to = Math.min(st, dEnd), n = ovalAt(to), here = ovalAt(d + 0.01);
    if (here.yaw !== yaw) { turn(r3(tt - 0.1), who, here.yaw, 0.3); yaw = here.yaw; }
    const len = r3((to - d) / v);
    A(r3(tt), who, "move", { to: n.at, dur: len });
    d = to; tt = r3(tt + len + 0.05);
    if (to >= dEnd - 1e-6) break;
  }
};
conga("devil", 1.2, PAR, 2.7, 0.6); conga("chip", 0.0, PAR, 2.7, 0.6);
arm(PAR, "devil", "both", { o: [0.30, 0.85, 0.10] }, 0.01); arm(PAR, "chip", "both", "rest", 0.01);
expr(PAR, "chip", "annoyed", 0.01);
for (let k = 0; k < 4; k++) { sfx(r3(PAR + k * 0.9), "kenney/low-three-tone", { gain: 0.7 }); c.prop(r3(PAR + k * 0.9), "speaker", { puff: 1 }, 0.08, "out"); c.prop(r3(PAR + k * 0.9 + 0.1), "speaker", { puff: 0 }, 0.15); }
look(r3(PAR + 1.2), "chip", AT_US, 0.2);
t = say(12, r3(PAR + 1.3));
look(r3(t), "devil", AT_US); expr(r3(t), "devil", "delighted");
t = say(13, r3(t + 0.1));
slamX(r3(t + 0.1), 3);
see(PAR, r3(t + 0.4), ["chip.face", "devil.face", "board", "speaker"], "the party is one song forever; X on PARTY");
t = r3(Math.max(t + 0.55, PAR + 2.75));

// 10 VIEW (B-L, B-GLASS, B-L): the curtain opens on heaven's party; his face on the glass; X on row 5
const VIEW = shot("view", t, B_VIEW);
place(VIEW, "devil", B(0.0, -0.45), -30); place(VIEW, "chip", B(-0.30, 0.45), -40);
arm(VIEW, "devil", "both", "rest", 0.01); arm(VIEW, "chip", "both", "rest", 0.01);
look(VIEW, "chip", [-0.6, 0.3], 0.01); expr(VIEW, "chip", "annoyed", 0.01); look(VIEW, "devil", AT_US, 0.01);
t = say(14, r3(VIEW + 0.15));
e = snap(r3(t - 0.3));   // he snaps the curtain open (the snap he uses again for every fix)
c.prop(r3(e + 0.02), "window", { open: 1 }, 0.35, "out"); sfx(r3(e + 0.02), "kenney/cloth", { gain: 0.6 });
arm(r3(t + 0.5), "devil", "R", "rest", 0.4); grip(r3(t + 0.5), "devil", "R", "relaxed", 0.3);
expr(r3(t + 0.4), "chip", "shocked", 0.1); look(r3(t + 0.4), "chip", [-0.8, 0.6]);
// he faces where he walks (a move keeps the facing: at -40 he walked sideways), then turns to the glass before the cut
turn(r3(t + 0.45), "chip", -140, 0.3);
step(r3(t + 0.6), "chip", B(-0.85, -0.25), 0.7); step(r3(t + 1.4), "chip", B(-1.60, -0.98), 0.9);
turn(r3(t + 2.3), "chip", 180, 0.3);
const GLASS = shot("face on the glass", r3(t + 2.7), B_GLASS);
place(GLASS, "chip", B(-1.60, -0.98), 180);
arm(GLASS, "chip", "both", { o: [0.25, 0.65, 0.28] }, 0.01); grip(GLASS, "chip", "both", "flat", 0.01);
look(GLASS, "chip", [0, 0.6], 0.01); expr(GLASS, "chip", "sad", 0.01);
see(GLASS, r3(GLASS + 1.4), ["chip.face"], "from outside: his face on the glass, heaven's party above");
const VIEWB = shot("worst", r3(GLASS + 1.5), B_L);
place(VIEWB, "chip", B(-1.30, -0.60), -10);
arm(VIEWB, "chip", "both", { o: [0.25, 0.65, 0.2] }, 0.01); grip(VIEWB, "chip", "both", "fist", 0.01);
look(VIEWB, "chip", AT_US, 0.01); expr(VIEWB, "chip", "angry", 0.01);
park(VIEWB, "devil");   // he waits off camera by the exit (beat 11)
t = say(15, r3(VIEWB + 0.1));
slamX(r3(t + 0.05), 4);
see(VIEWB, r3(t + 0.4), ["chip.face", "board"], "five stars? this is the worst; all five perks crossed out");
t = r3(t + 0.5);

// 11 EXIT (B-R): he marches to EXIT; the Devil slides in with the tablet (held from the cut)
const EXI = shot("exit", t, B_R);
const DEV_IN = B(1.10, -0.75), DEV_IN_YAW = -30;   // waits in front of the EXIT door
place(EXI, "chip", B(-0.30, 0.30), 90); unpark(EXI, "devil", DEV_IN, DEV_IN_YAW);
arm(EXI, "chip", "both", { o: [0.18, 0.40, 0.10] }, 0.01); grip(EXI, "chip", "both", "fist", 0.01);
look(EXI, "chip", [0.8, 0.1], 0.01); expr(EXI, "chip", "angry", 0.01);
expr(EXI, "devil", "delighted", 0.01);
const TABD_AT = (x, z, yaw) => [r3(x + 0.44 * Math.sin(yaw * Math.PI / 180)), 0.14, r3(z + 0.44 * Math.cos(yaw * Math.PI / 180))];
const tdAt0 = TABD_AT(DEV_IN[0], DEV_IN[1], DEV_IN_YAW);
c.prop(r3(EXI - 0.02), "tabletD", { ...grips.placeFor("reviewtablet", tdAt0, DEV_IN_YAW) }, 0);
const htd = grips.box(c, "devil", { ...TABD, ...grips.placeFor("reviewtablet", tdAt0, DEV_IN_YAW) });
htd.take(r3(EXI - 0.015), { reach: 0.01, settle: 0.01 });
step(EXI, "chip", B(0.12, 0.30), 0.8, { steps: 3 });
const DEV_BLOCK = B(0.95, 0.0);
step(r3(EXI + 0.3), "devil", DEV_BLOCK, 0.5); turn(r3(EXI + 0.3), "devil", -45, 0.4);
htd.carry(r3(EXI + 0.3), TABD_AT(DEV_BLOCK[0], DEV_BLOCK[1], -45), 0.5);
turn(r3(EXI + 0.85), "chip", 60, 0.25); expr(r3(EXI + 0.75), "chip", "annoyed");
t = say(16, r3(EXI + 0.8));
see(EXI, t, ["chip.face", "devil.face", "tabletD"], "the Devil blocks the exit: rate your stay");

// 12 one star (B-TAB + A-BADGE insert)
const TAB = shot("one star", r3(t + 0.1), B_TAB);
A(TAB, "chip", "face", { lid: 0.3, dur: 0.01 }); expr(TAB, "chip", "deadpan", 0.01);
arm(r3(TAB + 0.2), "chip", "R", { o: [0.25, 0.50, 0.30] }, 0.35, "out"); grip(r3(TAB + 0.25), "chip", "R", "point");
c.prop(r3(TAB + 0.5), "tabletD", { hover: 1 }, 0.1);
t = say(17, r3(TAB + 0.55));
expr(r3(t + 0.05), "devil", "shocked", 0.1); A(r3(t + 0.05), "devil", "face", { corner: -0.3, dur: 0.15 });
const BADGE = shot("badge flickers", r3(t + 0.15), A_BADGE);
for (let k = 0; k < 3; k++) { c.prop(r3(BADGE + k * 0.17), "badgeX", { flicker: 1 }, 0.03); c.prop(r3(BADGE + k * 0.17 + 0.085), "badgeX", { flicker: 0 }, 0.03); }
sfx(BADGE, "kenney/glitch", { gain: 0.4 });
see(BADGE, r3(BADGE + 0.5), ["badgeX"], "hell's 4.9 flickers to 4.8");
const TAB2 = shot("wait one", r3(BADGE + 0.55), B_TAB);
arm(TAB2, "chip", "R", "rest", 0.01); grip(TAB2, "chip", "R", "relaxed", 0.01); A(TAB2, "chip", "face", { lid: 0.3, dur: 0.01 });
t = say(18, r3(TAB2 + 0.05));
see(TAB2, t, ["devil.face", "chip.face"], "the Devil's smile cracks");

// 13 snap 1 (B-L): the lava turns into a bubble bath with the duck; X peels off HOT TUB. He holds the tablet now (1 star)
const S1 = shot("snap tub", r3(t + 0.15), B_L);
dropHidden(S1, "devil", "tabletD");
const CHIP_S = B(0.38, 0.62), CHIP_S_YAW = -30;
place(S1, "devil", B(-0.32, 0.45), -40); place(S1, "chip", CHIP_S, CHIP_S_YAW);
const tcAt = [r3(CHIP_S[0] + 0.33 * Math.sin(CHIP_S_YAW * Math.PI / 180)), 0.05, r3(CHIP_S[1] + 0.33 * Math.cos(CHIP_S_YAW * Math.PI / 180))];
c.prop(r3(S1 - 0.02), "tabletC", { ...grips.placeFor("reviewtablet", tcAt, CHIP_S_YAW) }, 0);
const htc = grips.box(c, "chip", { ...TABC, ...grips.placeFor("reviewtablet", tcAt, CHIP_S_YAW) });
htc.take(r3(S1 - 0.015), { reach: 0.01, settle: 0.01 });
arm(S1, "devil", "both", "rest", 0.01);
expr(S1, "devil", "terrified", 0.01); expr(S1, "chip", "deadpan", 0.01); look(S1, "chip", [-0.3, 0.1], 0.01);
e = snap(r3(S1 + 0.15));
poof(e, [BX - 1.30, 0.35, 0.50], 0.6);
c.prop(r3(e + 0.05), "tub", { fix: 1 }, 0.2); c.prop(r3(e + 0.05), "duck", { wilt: 0, y: 0.22, x: BX - 1.55, z: 0.30 }, 0.01);
sfx(r3(e + 0.15), "ai/bubbles-burst", { gain: 0.45 });
peelX(r3(e + 0.3), 0);
arm(r3(e + 0.2), "devil", "both", { o: [0.30, 0.45, 0.25] }, 0.3);
t = say(19, r3(e + 0.35));
see(S1, t, ["devil.face", "tub", "board"], "snap: a real hot tub; X off HOT TUB");

// 14 snaps 2, 3 (B-R): cake buffet; the imp rubs his shoulders gently; X off BUFFET and MASSAGE (2 stars)
const S2 = shot("snap buffet", r3(t + 0.2), B_R);
const CHIP_M = B(0.20, 0.40), CHIP_M_YAW = -20;
place(S2, "devil", B(0.95, -0.62), -20); place(S2, "chip", CHIP_M, CHIP_M_YAW);
arm(S2, "devil", "both", "rest", 0.01);
htc.carry(r3(S2 - 0.02), [r3(CHIP_M[0] + 0.33 * Math.sin(CHIP_M_YAW * Math.PI / 180)), 0.05, r3(CHIP_M[1] + 0.33 * Math.cos(CHIP_M_YAW * Math.PI / 180))], 0.01, "linear");
c.prop(r3(S2 - 0.02), "tabletC", { lit: 2 }, 0);
unpark(S2, "imp", B(0.68, 0.36), -80);
showProp(r3(S2 - 0.02), "fork2", 0.012);
look(S2, "chip", [0.6, 0.1], 0.01); expr(S2, "chip", "deadpan", 0.01); expr(S2, "imp", "terrified", 0.01);
arm(S2, "imp", "both", { o: [0.10, 0.75, 0.15] }, 0.01);
e = snap(r3(S2 + 0.1));
poof(e, [BX + 1.63, 0.62, 0.30], 0.7);
hideProp(r3(e + 0.05), "fries"); showProp(r3(e + 0.05), "cake", 0.40);
for (let k = 0; k < 3; k++) c.prop(r3(e + 0.05), `plate${k}`, { food: ["cupcake", "donut", "jelly"][k] }, 0);
peelX(r3(e + 0.25), 1);
for (let k = 0; k < 4; k++) { const p = r3(e + 0.4 + k * 0.5); arm(p, "imp", "both", { o: [0.14, 0.82, 0.17] }, 0.25); arm(r3(p + 0.25), "imp", "both", { o: [0.10, 0.75, 0.15] }, 0.25); }
A(r3(e + 0.4), "chip", "face", { lid: 0.35, dur: 0.3 }); expr(r3(e + 0.5), "chip", "serene", 0.3);
peelX(r3(e + 0.7), 2);
t = say(20, r3(e + 0.9));
expr(r3(t), "devil", "terrified"); A(r3(t), "devil", "squash", { to: 0.05, dur: 0.2 });
t = say(21, r3(t + 0.08));
see(S2, t, ["chip.face", "devil.face", "cake", "board"], "cake buffet and a gentle massage: two stars?!");

// 15 snap 4 (B-L): party lights, confetti, balloons, the beach; the board is clean (3 stars)
const S3 = shot("snap party", r3(t + 0.2), B_L);
park(S3, "imp"); hideProp(r3(S3 - 0.02), "fork2");
place(S3, "devil", B(-0.40, 0.20), -40); place(S3, "chip", CHIP_S, CHIP_S_YAW);
htc.carry(r3(S3 - 0.02), tcAt, 0.01, "linear");
c.prop(r3(S3 - 0.02), "tabletC", { lit: 3 }, 0);
A(S3, "devil", "squash", { to: 0, dur: 0.01 }); arm(S3, "devil", "both", "rest", 0.01);
expr(S3, "chip", "deadpan", 0.01); look(S3, "chip", [-0.5, 0.4], 0.01);
e = snap(r3(S3 + 0.1));
poof(e, [BX - 1.60, 1.10, -1.0], 0.8);
c.prop(r3(e + 0.03), "lights", { on: 1 }, 0.1); c.prop(r3(e + 0.03), "room", { bright: 1 }, 0.2);
c.prop(r3(e + 0.03), "balloon", { cluster: 1 }, 0.1);
hideProp(r3(e + 0.03), "island"); hideProp(r3(e + 0.03), "rock");
showProp(r3(e + 0.03), "beach", 1.05); showProp(r3(e + 0.03), "sunset", 1.0);
c.prop(r3(e + 0.03), "speaker", { bpm: 112 }, 0);
sfx(r3(e + 0.05), "jingle-sax", { gain: 0.6 });
peelX(r3(e + 0.3), 3); peelX(r3(e + 0.5), 4);
look(r3(e + 0.4), "chip", [-0.8, 0.5]);
t = say(22, r3(e + 0.8));
see(S3, t, ["chip.face", "board", "window"], "a real party and a sunset beach; the board is clean: three");

// 16 four stars (B-L): he lounges in the foam; the Devil fans him, sweating; he taps the tablet on the rim
const S4 = shot("four stars", r3(t + 0.3), B_TUB);
dropHidden(S4, "chip", "tabletC");
const CHIP_TUB = B(-1.20, 0.55);
place(S4, "chip", CHIP_TUB, 30, -0.06);   // sits in the foam: head top about y 0.61, the foam to his chest
showProp(r3(S4 - 0.02), "tabletR", 0.14);
const DEV_FAN = B(-0.28, 0.30), DEV_FAN_YAW = -60;
place(S4, "devil", DEV_FAN, DEV_FAN_YAW); arm(S4, "devil", "both", "rest", 0.01);
const leafAt = [r3(DEV_FAN[0] + 0.46 * Math.sin(DEV_FAN_YAW * Math.PI / 180)), 0.30, r3(DEV_FAN[1] + 0.46 * Math.cos(DEV_FAN_YAW * Math.PI / 180))];
c.prop(r3(S4 - 0.03), "leaf", { ...grips.placeFor("palmleaf", leafAt, DEV_FAN_YAW) }, 0);
const hl = grips.mug(c, "devil", { ...LEAF, ...grips.placeFor("palmleaf", leafAt, DEV_FAN_YAW) }, { side: "R" });
hl.take(r3(S4 - 0.025), { reach: 0.01, settle: 0.01 });
expr(S4, "chip", "serene", 0.01); A(S4, "chip", "face", { lid: 0.4, dur: 0.01 }); look(S4, "chip", [0.4, -0.2], 0.01);
expr(S4, "devil", "terrified", 0.01);
c.at(r3(S4 + 0.1), { fx: "sweat", who: "devil", dur: 2.4, count: 3 });
for (let k = 0; k < 2; k++) {
  const p = r3(S4 + 0.3 + k * 1.0);
  hl.carry(p, [leafAt[0], 0.38, leafAt[2]], 0.5, "inOut", { tip: -10 }); c.prop(p, "leaf", { bend: 1 }, 0.5);
  hl.carry(r3(p + 0.5), [leafAt[0], 0.30, leafAt[2]], 0.5, "inOut", { tip: 0 }); c.prop(r3(p + 0.5), "leaf", { bend: -1 }, 0.5);
}
arm(r3(S4 + 0.6), "chip", "L", { o: [0.30, 0.30, 0.25] }, 0.3); grip(r3(S4 + 0.7), "chip", "L", "point");
c.prop(r3(S4 + 0.9), "tabletR", { lit: 4 }, 0.1); sfx(r3(S4 + 0.9), "kenney/tick", { gain: 0.5 });
t = say(23, r3(S4 + 1.1));
see(S4, t, ["chip.face", "devil.face", "tabletR"], "he lounges in the foam; the Devil fans him: four stars");

// 17 sob (B-DEVIL): he hugs the tablet (4 lit, 1 grey) and sobs
const SOB = shot("sob", r3(Math.max(t + 0.2, S4 + 2.9)), B_DEVIL);
dropHidden(SOB, "devil", "leaf");
const DEV_SOB = B(-0.28, 0.30);
place(SOB, "devil", DEV_SOB, 0);
const tabHug = [DEV_SOB[0], 0.12, r3(DEV_SOB[1] + 0.44)];
c.prop(r3(SOB - 0.02), "tabletH", { ...grips.placeFor("reviewtablet", tabHug, 0) }, 0);
const hth = grips.box(c, "devil", { ...TABH, ...grips.placeFor("reviewtablet", tabHug, 0) });
hth.take(r3(SOB - 0.015), { reach: 0.01, settle: 0.01 });
expr(SOB, "devil", "sad", 0.01); A(SOB, "devil", "face", { lid: 0.55, brow: 0.6, corner: -0.7, tear: 1, dur: 0.3 });
look(SOB, "devil", AT_US, 0.01);
t = say(24, r3(SOB + 0.2));
A(r3(SOB + 0.2), "devil", "shake", { amount: 0.01, dur: DUR[24] });
see(SOB, r3(t + 0.2), ["devil.face"], "the Devil sobs: four stars");

// ================================================================ TAG, set A: the next customer already knows
const TAG = shot("tag", r3(t + 0.4), A_WIDE, "payoff");
park(TAG, "chip"); dropHidden(TAG, "devil", "tabletH");
c.prop(r3(TAG - 0.02), "doorX", { open: 0, glow: 0 }, 0.01);
place(TAG, "devil", DEV_PEEK, -20, TER); A(r3(TAG - 0.02), "devil", "hide"); A(TAG, "devil", "face", { lid: 0.2, brow: 0.5, corner: -0.5, tear: 0.6, dur: 0.01 });
expr(TAG, "devil", "sad", 0.01);
unpark(TAG, "wedge", [0.88, 0.10], CHIP_YAW);
look(TAG, "reaper", [0.6, -0.1], 0.01); A(TAG, "reaper", "face", { lid: 0, dur: 0.01 });
look(TAG, "wedge", [-0.5, 0.3], 0.01);
t = say(25, r3(TAG + 0.1));
arm(r3(t + 0.05), "wedge", "R", { o: [0.12, 1.0, 0.15] }, 0.3, "out"); grip(r3(t + 0.1), "wedge", "R", "point");
expr(r3(t + 0.1), "wedge", "cocky");
t = say(26, r3(t + 0.2), {}, r3(t + 0.2 + DUR[26] + 0.06));
see(TAG, t, ["wedge.face", "reaper.face", "badgeX"], "the next one already knows: Hell. One star.");
// the insert: the hell door opens a crack; the Devil's wet eyes in the gap
const PEEK = shot("peek", r3(t + 0.1), A_PEEK);
A(r3(PEEK - 0.02), "devil", "show"); A(r3(PEEK - 0.02), "wedge", "hide"); hideProp(r3(PEEK - 0.02), "scythe");
c.prop(PEEK, "doorX", { open: 0.42 }, 0.25, "out"); sfx(PEEK, "door-creak", { gain: 0.6 });
look(PEEK, "devil", AT_US, 0.01);
t = say(27, r3(PEEK + 0.35), { soft: true });
const END = F2(t + 0.8);
see(PEEK, END, ["devil.face"], "...Nooo.");

// a caption ends where the next one starts (the 0.3 s tail ran into quick replies: caption-collide in draft 2)
{ const cs = [...c.captions].sort((x, y) => x.from - y.from); for (let k = 0; k + 1 < cs.length; k++) if (cs[k].to > cs[k + 1].from - 0.02) cs[k].to = r3(cs[k + 1].from - 0.02); }
const beats = c.beats(shots, END);

write(import.meta.url, {
  id: "hell-reviews",
  title: "Hell has better reviews than heaven",
  idea: "Potato Desk 09: the little one picks hell for its five stars; every perk is a catch until he threatens one star, and the vain Devil fixes everything and serves him.",
  fps: 30, look: "anime-pro", profile: "short", loop: false,
  captionBand: [470, 1360], captionStyle: "kinetic",
  castLook: "sheet", cleanStart: true,
  motion: { feet: 2, overlap: true, timing: true, solve: true },
  rig: { hand: 2, eyes: 2, hold: 2 },
  physics: true, animeTiming: true,
  set: { type: "plain", color: "#9fd0f0", floor: "none", light: "soft", para: 0, aperture: 0,
    lighting: 2, hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true, satsuei: true },
  music: { file: "ai/elevator-bossa/elevator-bossa-01.ogg", until: T[12], lowCut: 150, gain: 0.22 },
  sound: { sfx: 0.6, ambience: 0.05, guard: true, signature: false, surface: "indoor", scenes: ["ui", "jingle"] },   // ui: the review tablet and the badge; jingle: the speaker's three-note loop and the real party tune
  creative: { length: [50, 66] },
  hook: { show: ["reaper", "chip", "badgeH", "badgeX"], hint: 0, what: "a desk between heaven 3.1 stars and hell 4.9 stars; heaven or hell?" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    { who: "reaper", with: "counter", from: r3(STAMP_HIT - 0.25), to: r3(STAMP_HIT + 0.2), checks: ["arm-in-prop", "costume-in-prop"], reason: "the stamp slams down on the form: the forearm and sleeve brush the counter's top edge for 0.3 s (panel 04)" },
    { who: "chip", with: "tub", from: r3(S4 - 0.05), to: TAG, checks: ["clipping", "shell"], reason: "he sits in the foam of the fixed hot tub (panel 16)" },
    { who: "devil", with: "doorX", from: r3(TAG - 0.05), to: END, checks: ["clipping", "shell"], reason: "the Devil stands in the hot box behind the hell door and peeks through the gap (panel 18)" },
  ],
  notes: "Generated by storyboards/series/potato-desk/09-hell-reviews/make-hell-reviews.mjs.",
});
