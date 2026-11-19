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
const DUR = [1.33, 1.33, 1.04, 1.01, 2.21, 1.86, 0.69, 1.28, 1.07, 0.84, 1.42, 0.86, 1.01, 0.83, 1.04, 1.93, 2.49, 0.84, 1.30, 1.76, 0.89, 0.54, 1.13, 0.85, 1.12, 1.33, 2.70, 0.90];
const T = new Array(LINES.length).fill(null);
const END_OF = (i) => r3(T[i] + DUR[i]);

// ---------------------------------------------------------------- places
const BX = 40;                                   // set B's world offset along x
const B = (x, z) => [r3(BX + x), z];             // a set-B floor point
const TER = 0.40;                                // the cloud terrace's top (set A)
// set A marks (DESIGN §2)
const REAP = [-0.82, 0.30], CHIP_A = [0.70, 0.10], DEV_DOOR = [0.80, -0.92], DEV_PEEK = [0.88, -2.15];   // a little left of the door centre, turned to the gap: both eyes in it, the arms inside the doorway (Sol r1 #1, r2 #4)   // DEV_PEEK: inside the hot box behind the hell door
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
const TABR = { id: "tabletR", staged: "propped on the tub's rim", kind: "reviewtablet", ...at3(BX - 0.84, AWAY, 0.48), rot: 160, scale: 0.75, lit: 3, hover: 0 };   // on the rim level with him at his right, screen turned to us and him: his wrist comes round the left bezel in view (Sol r1 #3, r2 #2, r3 #2)
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
  { id: "window", staged: "set in the back wall", kind: "curtainwindow", ...at3(BX - 1.60, 0, -1.30) },
  { id: "island", staged: "far outside the window", kind: "heavenisland", ...at3(BX - 1.90, 1.40, -4.6), scale: 1.6 },   // Sol r1 #4: was a tiny washed-out cluster at -7.5
  { id: "rock", staged: "far backdrop", kind: "rockshaft", ...at3(BX - 2.2, 1.0, -9) },
  { id: "beach", staged: "far outside the window", kind: "beachview", ...at3(BX - 2.05, AWAY, -7.5) },
  { id: "sunset", staged: "far backdrop", kind: "sunsetsky", ...at3(BX - 2.2, AWAY, -9) },
  { id: "speaker", staged: "stands on the floor", kind: "speakerbox", ...at3(BX - 0.82, 0, -1.05) },
  { id: "balloon", staged: "tied to the speaker", kind: "balloon", ...at3(BX - 0.80, 0.56, -1.05) },
  { id: "exit", staged: "set in the back wall", kind: "exitdoor", ...at3(BX + 1.10, 0, -1.30) },
  { id: "exitsign", staged: "screwed to the back wall", kind: "officesign", ...at3(BX + 1.10, 1.84, -1.27), w: 0.50, h: 0.20, lines: [["EXIT", 0.12]], plate: "#1f7a3a", ink: "#f3ead2", frame: "#d9a93a" },
  { id: "lights", staged: "hung on the wall", kind: "partylights", ...at3(BX, 0, -1.25) },
  // the lobby's front wall, only up in the outside shot of his face on the glass (Sol r3 #5: he looked outdoors)
  { id: "lobbyback", staged: "the lobby's front wall, up for one shot", kind: "officesign", ...at3(BX - 1.60, AWAY, 1.40), rot: 180, w: 3.2, h: 2.6, frameW: 0.0, lines: [], plate: "#4a2428", ink: "#4a2428", frame: "#4a2428" },
  // party light (Sol r2 #7): soft additive colour pools on the wall and floor, and one faint wash in front of the two of
  // them (the toon materials take no scene light), all off until the party snap
  { id: "glowW1", staged: "light on the back wall", kind: "lightpool", ...at3(BX - 0.35, 1.20, -1.22), face: "z", w: 1.4, d: 1.1, color: "#ff5fa8", on: 0 },
  { id: "glowW2", staged: "light on the back wall", kind: "lightpool", ...at3(BX + 0.85, 1.05, -1.22), face: "z", w: 1.2, d: 1.0, color: "#4fc8ff", on: 0 },
  { id: "glowF1", staged: "light on the floor", kind: "lightpool", ...at3(BX - 0.10, 0, 0.55), w: 1.8, d: 1.1, color: "#ffcf2e", on: 0 },
  { id: "glowF2", staged: "light on the floor", kind: "lightpool", ...at3(BX - 0.95, 0, 1.05), w: 1.2, d: 0.8, color: "#b06cff", on: 0 },
  { id: "glowC", staged: "light falling on the two of them", kind: "lightpool", ...at3(BX - 0.15, 0.55, 1.45), face: "z", w: 1.6, d: 1.3, color: "#ff7ab8", on: 0 },
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
  TABD, TABR, LEAF,
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
// at a cut the body is hidden for one gait sample (1/120 s, between two drawn frames) just before the jump: the step
// planner's look-ahead stops at an off-feet moment but not at a teleport, so the feet strode toward the next shot's
// spot in the last frames before the cut (Sol r2 #8). Skipped for park (it hides anyway).
const place = (t, who, to, yaw, y = 0, blink = true) => {
  if (blink && CUTS.has(t) && !HIDDEN.has(who)) { A(r3(t - 0.029), who, "hide"); A(r3(t - 0.02), who, "show"); }
  A(r3(t - 0.02), who, "move", { to, dur: 0.01, ease: "linear", sync: true, ...(y != null && { y }) });
  A(r3(t - 0.02), who, "turn", { to: yaw, dur: 0.01, ease: "linear", sync: true });
};
const HIDDEN = new Set(["imp", "wedge", "devil"]);   // who is hidden now, in the order this file writes the clip (a blink must not show them)
const park = (t, who) => { place(t, who, PARK[who], 0, 0, false); A(r3(t - 0.02), who, "hide"); HIDDEN.add(who); };
const unpark = (t, who, to, yaw, y = 0) => { HIDDEN.add(who); place(t, who, to, yaw, y); A(r3(t - 0.02), who, "show"); HIDDEN.delete(who); };
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
const STAR = (i) => [r3((3 - i) * 0.058), 0.19, -0.04];   // a fingertip on star i of a review tablet (HELLA_GRIPS.reviewtablet), star1 = viewer's left
const hideProp = (t, id) => c.prop(t, id, { y: AWAY }, 0);
const showProp = (t, id, y) => c.prop(t, id, { y }, 0);

// ---------------------------------------------------------------- cameras (DESIGN §0)
const camAt = (x, y = 1.45, fov = 26) => ({ pos: [r3(x), y, 10.4], look: [r3(x), y, 0], fov });
const A_WIDE = camAt(0);
const A_BADGE = { pos: [0.86, 2.03, 3.6], look: [0.86, 2.03, -1.3], fov: 24 };
const A_PEEK = { pos: [0.80, 2.06, 4.3], look: [0.80, 1.89, -1.5], fov: 24 };   // the whole badge with air above it for the caption (Sol r3 #1)   // the whole badge on top, his face in the gap below it (Sol r2 #4)   // square on the door: the Devil deep in the hot box fits inside the doorway (Sol r1 #1: he showed beside the jamb)   // the tag's insert: the Devil in the hell door's gap
const B_C = camAt(BX), B_L = camAt(BX - 0.75), B_R = camAt(BX + 0.75);
const B_GLASS = { pos: [BX - 1.60, 0.62, -4.3], look: [BX - 1.60, 0.55, -1.3], fov: 30 };   // wider: the gold window trim in frame (Sol r3 #5)
const B_TAB = { pos: [BX + 0.62, 0.75, 4.7], look: [BX + 0.62, 0.75, 0.3], fov: 24 };
const B_PAR = { pos: [BX + 0.15, 1.82, 8.6], look: [BX + 0.15, 1.42, 0], fov: 28 };   // (Sol r2 #5: raised 0.22 so the board sits under the caption line)   // the conga: closer and lower than the B_R massage shot before it
const B_VIEW = { pos: [BX - 0.80, 1.65, 7.6], look: [BX - 0.80, 1.45, 0], fov: 26 };   // (raised 0.2: caption clear of the board, Sol r2 #5)   // the view: a step closer than the party wide (B_C to B_L read as a skipped frame)
const B_MAS = { pos: [BX + 0.55, 0.66, 6.4], look: [BX + 0.55, 0.41, 0], fov: 26 };   // (lowered 0.34: the board rides up above the caption line, the caption sits on the wall under it, Sol r2 #5)   // massage: closer than the buffet's B_R (Sol r1 #6: the same framing read as a pop)
const B_TUB = { pos: [BX - 0.92, 1.3, 6.0], look: [BX - 0.92, 0.6, 0], fov: 26 };   // four stars: closer and lower than B_L, so the cut from snap party reads as a cut
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
// 4 GAP: one dry beat, "Funny. Everyone picks hell." Then the Reaper stamps HELL and the door bursts (Sol r1 #15: the stamp
// came 3 s before the door)
look(r3(t + 0.1), "reaper", AT_US, 0.25); A(r3(t + 0.1), "reaper", "face", { lid: 0.42, dur: 0.2 });
t = say(4, r3(t + 0.35));
expr(r3(T[4] + 0.6), "chip", "kind");
look(r3(T[4] + 0.8), "chip", [0.2, 0.2]);
const ST = r3(t + 0.05);
e = hs.carry(ST, [STAMP_AT[0], 0.74, STAMP_AT[2]], 0.18, "out");   // a small lift
e = hs.carry(r3(e + 0.04), STAMP_HIT_AT, 0.1, "in");               // down onto the form: tok
const STAMP_HIT = e;
sfx(STAMP_HIT, "kenney/impact-wood-medium", { gain: 1.0 });
c.prop(STAMP_HIT, "doorX", { glow: 1 }, 0.25, "out");
sfx(r3(STAMP_HIT + 0.03), "ai/ignite", { gain: 0.35 });
e = hs.carry(r3(e + 0.15), STAMP_AT, 0.3, "inOut");
see(T[4], STAMP_HIT, ["reaper.face", "chip.face", "doorX"], "the gap: everyone picks hell (why?)");
// 5a the hell door bursts open: the Devil, arms wide, in a burst of ember smoke
const BURST = r3(STAMP_HIT + 0.3);
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
const MAS = shot("massage", t, B_MAS);
dropHidden(MAS, "devil", "ketchup");
place(MAS, "chip", B(0.20, 0.40), -90); place(MAS, "devil", B(1.30, -0.70), -30);   // he stands in pure profile: his back is the right edge, the prongs meet it in plain view (Sol r2 #3)
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
const FORK_BACK = [r3(IMP[0] - 0.12), 0.16, r3(IMP[1])], FORK_JAB = [r3(IMP[0] - 0.16), 0.16, r3(IMP[1])];   // the tips stop on the hoodie (Sol r3 #3: 10 cm sank the head in)
e = hf.carry(r3(MAS + 0.1), FORK_BACK, 0.7, "inOut", { tip: -68 });   // the head a hand off his back, y ~0.35
for (let k = 0; k < 4; k++) {   // each poke: the whole fork jabs 4 cm in, he hops on that contact, it pulls back (Sol r2 #3: the shaft barely moved)
  const p = r3(e + 0.1 + k * 0.5);
  hf.carry(p, FORK_JAB, 0.12, "out", { tip: -68 }); hf.carry(r3(p + 0.14), FORK_BACK, 0.22, "inOut", { tip: -68 });
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
// the conga (Sol r1 #13: two backs; in profile the faces didn't read either): one diagonal lane toward us and to the
// right, so both faces show three-quarter; the little one in front (the subject owns the front), the Devil 0.75 m behind
// him, arms up, herding him on: a conga he can't leave
const LANE = 15, ld = [Math.sin(LANE * Math.PI / 180), Math.cos(LANE * Math.PI / 180)], P0 = B(-0.05, 0.15), RUN = 0.95;   // down the carpet toward us (Sol r2 #9)
const laneAt = (k, side = 0) => [r3(P0[0] + k * ld[0] + side), r3(P0[1] + k * ld[1])];
// one shared conga step: the same cadence and bob for both (Sol r2 #9), the Devil a step to the left so his face shows
place(PAR, "chip", laneAt(0), LANE); A(r3(PAR + 0.05), "chip", "move", { to: laneAt(RUN), dur: 2.7, steps: 3, bob: 0.03 });
place(PAR, "devil", laneAt(-0.75, -0.30), LANE); A(r3(PAR + 0.05), "devil", "move", { to: laneAt(RUN - 0.75, -0.30), dur: 2.7, steps: 3, bob: 0.03 });
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
showProp(r3(GLASS - 0.02), "lobbyback", 1.2);   // the lobby's far wall behind him, this shot only (Sol r3 #5)
arm(GLASS, "chip", "both", { o: [0.25, 0.65, 0.28] }, 0.01); grip(GLASS, "chip", "both", "flat", 0.01);
look(GLASS, "chip", [0, 0.6], 0.01); expr(GLASS, "chip", "sad", 0.01);
see(GLASS, r3(GLASS + 1.4), ["chip.face"], "from outside: his face on the glass, heaven's party above");
const VIEWB = shot("worst", r3(GLASS + 1.5), B_L);
hideProp(r3(VIEWB - 0.02), "lobbyback");
place(VIEWB, "chip", B(-1.30, -0.60), -10);
arm(VIEWB, "chip", "both", { o: [0.25, 0.65, 0.2] }, 0.01); grip(VIEWB, "chip", "both", "fist", 0.01);
look(VIEWB, "chip", AT_US, 0.01); expr(VIEWB, "chip", "angry", 0.01);
place(VIEWB, "devil", B(0.0, -0.45), 100); arm(VIEWB, "devil", "both", "rest", 0.01);
step(r3(VIEWB + 0.4), "devil", B(1.10, -0.35), 1.4);   // he slips off toward the EXIT (Sol r1 #12), where the next shot finds him
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
const CHIP_X = B(0.25, 0.38);   // in reach of the Devil's tablet (Sol r1 #2: the finger missed it)
step(EXI, "chip", CHIP_X, 0.9, { steps: 3 });
const DEV_BLOCK = B(0.95, 0.0);
step(r3(EXI + 0.3), "devil", DEV_BLOCK, 0.5); turn(r3(EXI + 0.3), "devil", -45, 0.4);
htd.carry(r3(EXI + 0.3), TABD_AT(DEV_BLOCK[0], DEV_BLOCK[1], -45), 0.5);
turn(r3(EXI + 0.95), "chip", 80, 0.25); expr(r3(EXI + 0.75), "chip", "annoyed");
t = say(16, r3(EXI + 0.8));
see(EXI, t, ["chip.face", "devil.face", "tabletD"], "the Devil blocks the exit: rate your stay");

// 12 one star (B-TAB + A-BADGE insert)
const TAB = shot("one star", r3(t + 0.1), B_TAB);
A(TAB, "chip", "face", { lid: 0.3, dur: 0.01 }); expr(TAB, "chip", "deadpan", 0.01);
grip(r3(TAB + 0.15), "chip", "L", "point", 0.15);
arm(r3(TAB + 0.2), "chip", "L", { prop: "tabletD", grip: STAR(1) }, 0.35);
c.prop(r3(TAB + 0.56), "tabletD", { hover: 1 }, 0.05); sfx(r3(TAB + 0.56), "kenney/tick", { gain: 0.45 });   // on contact
t = say(17, r3(TAB + 0.55));
expr(r3(t + 0.05), "devil", "shocked", 0.1); A(r3(t + 0.05), "devil", "face", { corner: -0.3, dur: 0.15 });
const BADGE = shot("badge flickers", r3(t + 0.15), A_BADGE);
for (let k = 0; k < 3; k++) { c.prop(r3(BADGE + k * 0.17), "badgeX", { flicker: 1 }, 0.03); c.prop(r3(BADGE + k * 0.17 + 0.085), "badgeX", { flicker: 0 }, 0.03); }
sfx(BADGE, "kenney/glitch", { gain: 0.4 });
see(BADGE, r3(BADGE + 0.5), ["badgeX"], "hell's 4.9 flickers to 4.8");
const TAB2 = shot("wait one", r3(BADGE + 0.55), B_TAB);
arm(TAB2, "chip", "L", "rest", 0.01); grip(TAB2, "chip", "L", "relaxed", 0.01); A(TAB2, "chip", "face", { lid: 0.3, dur: 0.01 });
t = say(18, r3(TAB2 + 0.05));
// the tablet slips out of his hands in the shock and clatters to the floor (Sol r1 #7: it used to jump into the little
// one's hands on the cut; a hand-over put hands in faces, workflow rule 5: restage simpler). Rated by voice from here.
// an aimed drop with a forward tumble (a plain let-go landed it standing on its edge): it falls flat, face down
const DROP_AT = [r3(BX + 0.58), 0.0, 0.52];   // in front of him, between them (tdAt0 was stale: it threw the tablet back under his tail, Sol r2 #8)
A(r3(T[18] + 0.25), "devil", "release", { prop: "tabletD", to: DROP_AT, dur: 0.4, spin: [5.2, 0, 3.0] });
arm(r3(T[18] + 0.29), "devil", "both", { o: [0.32, 0.75, 0.18] }, 0.2, "out"); grip(r3(T[18] + 0.25), "devil", "both", "open", 0.15);
sfx(r3(T[18] + 0.62), "kenney/impact-generic-light", { gain: 0.45 });
look(r3(T[18] + 0.35), "chip", [0.5, -0.4], 0.2);
see(TAB2, t, ["devil.face", "chip.face"], "the Devil's smile cracks; the tablet drops");

// 13 snap 1 (B-L): the lava turns into a bubble bath with the duck; X peels off HOT TUB. He holds the tablet now (1 star)
const S1 = shot("snap tub", r3(t + 0.15), B_L);
c.prop(r3(S1 - 0.03), "tabletD", { scale: 0.001 }, 0);   // the dropped tablet goes on the cut (it lay where he stands in this shot)
const CHIP_S = B(0.08, 1.10), CHIP_S_YAW = -30;
place(S1, "devil", B(-0.32, 0.45), -40); place(S1, "chip", CHIP_S, CHIP_S_YAW);
arm(S1, "devil", "both", "rest", 0.01); grip(S1, "devil", "both", "relaxed", 0.01);
arm(S1, "chip", "both", "rest", 0.01); grip(S1, "chip", "both", "relaxed", 0.01);
expr(S1, "devil", "terrified", 0.01); expr(S1, "chip", "deadpan", 0.01); look(S1, "chip", [-0.3, 0.1], 0.01);
e = snap(r3(S1 + 0.15));
poof(e, [BX - 1.30, 0.35, 0.50], 0.6);
c.prop(r3(e + 0.05), "tub", { fix: 1 }, 0.2); c.prop(r3(e + 0.05), "duck", { wilt: 0, y: 0.22, x: BX - 1.55, z: 0.30 }, 0.01);
sfx(r3(e + 0.15), "ai/bubbles-burst", { gain: 0.45 });
peelX(r3(e + 0.3), 0);
arm(r3(e + 0.2), "devil", "R", { o: [0.30, 0.45, 0.25] }, 0.3);   // presents the tub with the near hand (L went into the customer)
t = say(19, r3(e + 0.35));
see(S1, t, ["devil.face", "tub", "board"], "snap: a real hot tub; X off HOT TUB");

// 14 snaps 2, 3 (B-R): cake buffet; the imp rubs his shoulders gently; X off BUFFET and MASSAGE (2 stars)
const S2 = shot("snap buffet", r3(t + 0.2), B_R);
const CHIP_M = B(0.10, 0.40), CHIP_M_YAW = -90;
place(S2, "devil", B(0.95, -0.62), -20); place(S2, "chip", CHIP_M, CHIP_M_YAW);
arm(S2, "devil", "both", "rest", 0.01);
const IMP_M = [r3(CHIP_M[0] + 0.42 * Math.sin(90 * Math.PI / 180)), r3(CHIP_M[1] + 0.42 * Math.cos(90 * Math.PI / 180))];   // he stands in profile; the imp at his back, both in profile, its face in the clear
unpark(S2, "imp", IMP_M, -90);
// the imp still holds the pitchfork; the snap's puff takes it and the kneading starts (Sol r3 #4: it kneaded before the snap)
const FORK_AT2 = [r3(IMP_M[0] - 0.02), 0, r3(IMP_M[1] - 0.12)];
c.prop(r3(S2 - 0.02), "fork", { scale: 1, ...grips.placeFor("pitchfork", FORK_AT2, -90) }, 0);
const hf2 = grips.mug(c, "imp", { ...FORK, ...grips.placeFor("pitchfork", FORK_AT2, -90) }, { side: "R" });
hf2.take(r3(S2 - 0.015), { reach: 0.01, settle: 0.01 });
look(S2, "chip", AT_US, 0.01); expr(S2, "chip", "deadpan", 0.01); expr(S2, "imp", "terrified", 0.01);
arm(S2, "imp", "L", "rest", 0.01);
e = snap(r3(S2 + 0.1));
poof(e, [BX + 1.63, 0.62, 0.30], 0.7);
poof(e, [IMP_M[0], 0.45, r3(IMP_M[1] + 0.05)], 0.45);
A(r3(e + 0.12), "imp", "release", { prop: "fork", dur: 0 }); c.prop(r3(e + 0.12), "fork", { scale: 0.001 }, 0);   // gone in the puff
arm(r3(e + 0.14), "imp", "R", { o: [0.08, 0.80, 0.17] }, 0.16, "out"); arm(r3(e + 0.14), "imp", "L", { o: [0.08, 0.80, 0.22] }, 0.16, "out"); grip(r3(e + 0.14), "imp", "both", "relaxed", 0.12);
hideProp(r3(e + 0.05), "fries"); showProp(r3(e + 0.05), "cake", 0.40);
for (let k = 0; k < 3; k++) hideProp(r3(e + 0.05), `plate${k}`);   // Sol r1 #9: a fries carton stayed beside the cake
peelX(r3(e + 0.25), 1);
for (let k = 0; k < 5; k++) { const p = r3(e + 0.3 + k * 0.45); arm(p, "imp", "R", { o: [0.08, 0.84, 0.22] }, 0.22); arm(p, "imp", "L", { o: [0.08, 0.76, 0.17] }, 0.22); arm(r3(p + 0.22), "imp", "R", { o: [0.08, 0.80, 0.17] }, 0.22); arm(r3(p + 0.22), "imp", "L", { o: [0.08, 0.80, 0.22] }, 0.22); }   // kneading his back (Sol r1 #10)
A(r3(e + 0.4), "chip", "face", { lid: 0.35, dur: 0.3 }); expr(r3(e + 0.5), "chip", "serene", 0.3);
peelX(r3(e + 1.25), 2);
t = say(20, r3(e + 0.9));
expr(r3(t), "devil", "terrified"); A(r3(t), "devil", "squash", { to: 0.05, dur: 0.2 });
t = say(21, r3(t + 0.08));
see(S2, t, ["chip.face", "devil.face", "cake", "board"], "cake buffet and a gentle massage: two stars?!");

// 15 snap 4 (B-L): party lights, confetti, balloons, the beach; the board is clean (3 stars)
const S3 = shot("snap party", r3(t + 0.2), B_L);
park(S3, "imp"); hideProp(r3(S3 - 0.02), "fork2");
place(S3, "devil", B(-0.40, 0.20), -40); place(S3, "chip", CHIP_S, CHIP_S_YAW);
A(S3, "devil", "squash", { to: 0, dur: 0.01 }); arm(S3, "devil", "both", "rest", 0.01);
expr(S3, "chip", "deadpan", 0.01); look(S3, "chip", [-0.5, 0.4], 0.01);
e = snap(r3(S3 + 0.1));
poof(e, [BX - 1.60, 1.10, -1.0], 0.8);
poof(e, [BX - 0.80, 1.20, -1.0], 0.75);   // Sol r1 #14: the balloons came in above the puff
c.prop(r3(e + 0.03), "lights", { on: 1 }, 0.1); c.prop(r3(e + 0.03), "room", { bright: 1 }, 0.5);
for (const [id, on] of [["glowW1", 1], ["glowW2", 1], ["glowF1", 0.8], ["glowF2", 0.8], ["glowC", 0.3]]) c.prop(r3(e + 0.03), id, { on }, 0.3, "out");
c.prop(r3(e + 0.03), "balloon", { cluster: 1 }, 0.1);
hideProp(r3(e + 0.03), "island"); hideProp(r3(e + 0.03), "rock");
showProp(r3(e + 0.03), "beach", 1.05); showProp(r3(e + 0.03), "sunset", 1.0);
c.prop(r3(e + 0.03), "speaker", { bpm: 112 }, 0);
// (no jingle on the party fix: the score plays through; two tunes at once clashed)
peelX(r3(e + 0.3), 3); peelX(r3(e + 0.5), 4);
look(r3(e + 0.4), "chip", [-0.8, 0.5]);
t = say(22, r3(e + 0.8));
see(S3, t, ["chip.face", "board", "window"], "a real party and a sunset beach; the board is clean: three");

// 16 four stars (B-L): he lounges in the foam; the Devil fans him, sweating; he taps the tablet on the rim
const S4 = shot("four stars", r3(t + 0.3), B_TUB);
const CHIP_TUB = B(-1.20, 0.42);   // in the middle of the foam (Sol r2 #10: at the front rim he hid it), the rim tablet in arm's reach
place(S4, "chip", CHIP_TUB, 30, -0.06);   // sits in the foam: head top about y 0.61, the foam to his chest
showProp(r3(S4 - 0.02), "tabletR", 0.14);
const DEV_FAN = B(-0.16, 0.30), DEV_FAN_YAW = -60;   // a step right: his glove clear of the rim tablet
place(S4, "devil", DEV_FAN, DEV_FAN_YAW); arm(S4, "devil", "L", "rest", 0.01);   // R holds the leaf from the cut
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
grip(r3(S4 + 0.5), "chip", "L", "point", 0.15);
arm(r3(S4 + 0.55), "chip", "L", { prop: "tabletR", grip: STAR(4) }, 0.4);
c.prop(r3(S4 + 0.95), "tabletR", { lit: 4 }, 0.08); sfx(r3(S4 + 0.95), "kenney/tick", { gain: 0.5 });   // on contact
arm(r3(S4 + 1.3), "chip", "L", "rest", 0.4); grip(r3(S4 + 1.3), "chip", "L", "relaxed", 0.3);
t = say(23, r3(S4 + 1.1));
see(S4, t, ["chip.face", "devil.face", "tabletR"], "he lounges in the foam; the Devil fans him: four stars");

// 17 sob (B-DEVIL): he hugs the tablet (4 lit, 1 grey) and sobs
const SOB = shot("sob", r3(Math.max(t + 0.2, S4 + 2.9)), B_DEVIL);
dropHidden(SOB, "devil", "leaf");
const DEV_SOB = B(-0.28, 0.30);
place(SOB, "devil", DEV_SOB, 0);
// (no tablet: it stays on the tub's rim; Sol r1 #7 saw it jump from the rim into his hands) both fists to his eyes
arm(SOB, "devil", "both", "rest", 0.01);   // arms hang (the short arms cannot reach the eyes: they went out to the sides like a shrug) grip(SOB, "devil", "both", "relaxed", 0.01);
expr(SOB, "devil", "sad", 0.01); A(SOB, "devil", "face", { lid: 0.55, brow: 0.6, corner: -0.7, tear: 1, dur: 0.3 });
look(SOB, "devil", AT_US, 0.01);
t = say(24, r3(SOB + 0.2));
A(r3(SOB + 0.2), "devil", "shake", { amount: 0.01, dur: DUR[24] });
see(SOB, r3(t + 0.2), ["devil.face"], "the Devil sobs: four stars");

// ================================================================ TAG, set A: the next customer already knows
const TAG = shot("tag", r3(t + 0.4), A_WIDE, "payoff");
park(TAG, "chip"); arm(TAG, "devil", "both", "rest", 0.01); grip(TAG, "devil", "both", "relaxed", 0.01);
c.prop(r3(TAG - 0.02), "doorX", { open: 0, glow: 0 }, 0.01);
place(TAG, "devil", DEV_PEEK, -20, TER, false); A(r3(TAG - 0.02), "devil", "hide"); HIDDEN.add("devil"); A(TAG, "devil", "face", { lid: 0.2, brow: 0.5, corner: -0.5, tear: 0.6, dur: 0.01 });
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
A(r3(PEEK - 0.02), "devil", "show"); A(r3(PEEK - 0.02), "wedge", "hide"); HIDDEN.delete("devil"); HIDDEN.add("wedge"); hideProp(r3(PEEK - 0.02), "scythe");
c.prop(PEEK, "doorX", { open: 0.55 }, 0.3, "out");   // a half-open gap (Sol r2 #4: 0.75 swung the door out of frame) sfx(PEEK, "door-creak", { gain: 0.6 });
look(PEEK, "devil", AT_US, 0.01);
arm(r3(PEEK - 0.02), "devil", "both", { o: [-0.02, 0.40, 0.26] }, 0.01);   // hands together in front: no glove pokes past the jamb
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
  music: { file: "hell-reviews/hell-reviews-score.ogg", lock: false, dip: false, lowCut: 150, gain: 0.24 },   // make-score.mjs: one score through the whole clip (Jonny 19 Nov: no elevator music, the music must not stop)
  sound: { sfx: 0.6, ambience: 0.05, guard: true, signature: false, surface: "indoor", scenes: ["ui", "jingle"] },   // ui: the review tablet and the badge; jingle: the speaker's three-note loop
  creative: { length: [50, 66] },
  hook: { show: ["reaper", "chip", "badgeH", "badgeX"], hint: 0, what: "a desk between heaven 3.1 stars and hell 4.9 stars; heaven or hell?" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    { who: "reaper", with: "counter", from: r3(STAMP_HIT - 0.25), to: r3(STAMP_HIT + 0.32), checks: ["arm-in-prop", "costume-in-prop"], reason: "the stamp slams down on the form: the forearm and sleeve brush the counter's top edge for 0.3 s (panel 04)" },
    { who: "devil", with: "chip", from: r3(SOB - 0.05), to: r3(SOB + 0.1), checks: ["character-overlap", "reach"], reason: "the cut to the sob close-up: the Devil is placed for it while the customer sits in the tub off-screen; the frame shows only the Devil" },
    { who: "imp", with: "chip", from: S2, to: S3, checks: ["character-overlap", "reach"], reason: "the imp kneads his back: its hands press into his sweater (Sol r1 #10)" },
    { who: "chip", with: "tub", from: r3(S4 - 0.05), to: TAG, checks: ["clipping", "shell"], reason: "he sits in the foam of the fixed hot tub (panel 16)" },
    { who: "devil", with: "doorX", from: r3(TAG - 0.05), to: END, checks: ["clipping", "shell"], reason: "the Devil stands in the hot box behind the hell door and peeks through the gap (panel 18)" },
  ],
  notes: "Generated by storyboards/series/potato-desk/09-hell-reviews/make-hell-reviews.mjs.",
});
