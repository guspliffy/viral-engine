// THAT ONE FRIEND WHO ALWAYS ORDERS POTATOES… AT THE BURGER PLACE (always orders potatoes, episode 1, 7 Nov 2026),
// from the clip template.
//   node storyboards/series/always-orders-potatoes/01-fries/make-fries.mjs -> fries.json
// Brief: /mnt/project-files/video-scripts/2026-11-06-always-orders-potatoes/01-fries-at-the-burger-place-ENGINE-PROMPT.md
// (series format: 00-SERIES-FORMAT.md there). Jonny's eight panels: storyboards/01-fries/ there (PANELS.md here).
//
// THE ALIVE FRIES (Jonny 7 Nov 17:53: "regarding the food series potatoes eaten should always be alive also pommes and
// other potato dishes"; the steakhouse's alive potato, PR #153, is the pattern: Viking never eats a potato that is alive)
//   Joke:        a sunny burger bar. Viking promises "the best fries in town" and the three fries in his cone open their
//                eyes and cheer. He leans in for the first bite and the fry waves "Hi!" at his nose; he melts (the
//                blossom). The fries treat his tray like a pool party: one hops into the ketchup like a hot tub, one
//                cannonballs into the mayo, and the last does a backflip off the cone into Reaper's soup.
//   Wants:       Viking wants the best fries in town, and now the fries want the best day out.
//   Consequence: Reaper's soup gets a fry standing upright in it; Viking never eats a single one.
//   Ending:      the fry in the soup, chilling, offers Reaper his own soup with Viking's line, "Want some?"; Gunslinger
//                leans back with both palms up.
//   Callback:    frame 0 the fries are food ("Best fries in town!"); the last frame one of them is a guest in a friend's soup.
// Reach rules v2 (B1 troublemaker + victim medium-wide at frame 0, sound at 0.0, group moment, "Want some?" catchphrase,
// 10 s) and v3 (B7 the first line is a 4-word promise at 0.0, B8 a cut to the victim's face at 1.25 s for 0.65 s, the
// turn by 65 %, the title never names the payoff).
import { clip, write, r3, frame } from "../../../lib/clip.mjs";
import * as act from "../../../lib/acting.mjs";

const c = clip({ faces: "strong", lines: { sub: true, blink: false } }), { A, sfx, see } = c;
// one 3-frame hit-stop (the fry landing in the soup) adds 0.1 s: 9.9 s of story = 10.0 s
const HS = 7.7, END = 9.9;
const V = (tv) => r3(tv <= HS + 0.1 ? tv : tv - 0.1);   // a time on the video's clock -> the story's clock

// ---------------------------------------------------------------- places (x right, z toward the camera)
// Two rows in depth (Jonny's panels): the front row at the table in the booth, left to right Gunslinger (salad), Viking
// (the fries), Reaper (tomato soup); behind the booth on a raised floor Phoenix (back left, phone up) and the Samurai
// (back right, the waiter in his paper cap and apron, deadpan).
const TH = 0.18, TZ = 0.3, TD = 1.2;            // the table: z -0.3 .. 0.9
const FZ = -0.68;
const GSL = [-1.06, -0.68], VIK = [0, FZ], REA = [0.97, -0.72];
const GSL_YAW = 10, REA_YAW = -14;
const STEP = 0.85;                                // the raised back floor
const PHX = [-0.92, -1.75], PHX_YAW = 22, SAM = [0.92, -1.62], SAM_YAW = -12;
const TRAY = [0.04, 0.14], TT = r3(TH + 0.011);   // Viking's tray and the top of its paper
const CONE = [0.04, 0.1], CK = 1.3;   // the cone a size up (the giant fries of panel 1)                         // the cone on the tray
const KET = [-0.27, 0.24], MAY = [0.33, 0.22], PK = 1.9;    // the dip pots, either side of the cone's front
const SALAD = [-0.62, -0.02], SOUP = [0.62, -0.06], SK = 1.3, SHAKE = [-0.4, -0.12];
const SOUP_TOP = r3(TH + 0.075 * 0.78 * SK);            // the soup's surface
// the fries: three characters standing in the cone (scale = height in metres), their lower halves in the paper
const FS = 0.4, FY = r3(TT + 0.06);   // they stand on the fries below them, so their faces clear the cone's rim and their gloves rest inside it, below the rim (at mouth height the black gloves read as moustaches)
const FRY = { a: [CONE[0], r3(CONE[1] - 0.04)], b: [r3(CONE[0] - 0.1), r3(CONE[1] + 0.03)], c: [r3(CONE[0] + 0.1), r3(CONE[1] + 0.03)] };

const cast = [
  { id: "gsl", character: "always-orders-potatoes/gunslinger", at: GSL, face: GSL_YAW, expr: "annoyed", follow: 0.3, seed: 1.3 },
  { id: "vik", character: "always-orders-potatoes/viking", at: VIK, face: 0, expr: "delighted", follow: 0.25, seed: 2.1 },
  { id: "rea", character: "never-has-money/reaper", at: REA, face: REA_YAW, expr: "deadpan", follow: 0.25, seed: 3.3 },
  { id: "phx", character: "duo/phoenix", at: PHX, y: STEP, face: PHX_YAW, expr: "happy", follow: 0.3, seed: 1.7, span: 0.15 },
  { id: "sam", character: "bistro/samurai-waiter", at: SAM, y: STEP, face: SAM_YAW, expr: "deadpan", follow: 0.2, seed: 2.2, sway: 0.4 },
  { id: "fa", character: "always-orders-potatoes/fry", at: FRY.a, y: FY, scale: r3(FS * 1.08), face: 0, expr: "serene", follow: 0, seed: 7.1, signature: false },
  { id: "fb", character: "always-orders-potatoes/fry", at: FRY.b, y: FY, scale: FS, face: 8, expr: "serene", follow: 0, seed: 7.2, signature: false },
  { id: "fc", character: "always-orders-potatoes/fry", at: FRY.c, y: FY, scale: FS, face: -8, expr: "serene", follow: 0, seed: 7.3, signature: false },
];
const FRIES = ["fa", "fb", "fc"];

const props = [
  { id: "floor", kind: "pubstep", x: 0, z: -1.78, w: 3.2, d: 1.1, h: STEP },
  { id: "booth", kind: "boothback", x: 0, y: 0, z: -1.22, w: 3.4, h: 0.82, d: 0.16 },
  { id: "table", kind: "burgertable", x: 0, z: TZ, w: 3.2, d: TD, h: TH },
  { id: "tray", kind: "burgertray", x: TRAY[0], y: TH, z: TRAY[1], w: 0.86, d: 0.5 },
  { id: "cone", kind: "frycone", x: CONE[0], y: TT, z: CONE[1], seed: 4, scale: CK, body: { friction: 0.9, bounce: 0.05 } },
  { id: "ket", kind: "dippot", x: KET[0], y: TT, z: KET[1], sauce: "ketchup", scale: PK },
  { id: "may", kind: "dippot", x: MAY[0], y: TT, z: MAY[1], sauce: "mayo", scale: PK },
  { id: "salad", kind: "saladbowl", x: SALAD[0], y: TH, z: SALAD[1], seed: 4, scale: 1.4 },
  { id: "soup", kind: "tomatosoup", x: SOUP[0], y: TH, z: SOUP[1], steam: 0.7, at: [0, 0], scale: SK },
  { id: "shake", kind: "fullshake", x: SHAKE[0], y: TH, z: SHAKE[1] },
  { id: "phone", kind: "phone", x: PHX[0] + 0.12, y: STEP + 0.78, z: PHX[1] + 0.42, rot: -160, tip: -8, scale: 1.6, case: "#e07a5f", glow: 0.7, staged: "in Phoenix's two gloves from the first frame" },
  { id: "apron", kind: "waiterapron", wear: "sam", x: 0, y: 0, z: 0, y0: 0.4, y1: 0.07, rx: 0.44, rz: 0.39, arc: 130 },
  { id: "hat", kind: "paperhat", wear: "sam", x: 0, y: 1.02, z: 0.02, scale: 1.0 },
];

// Phoenix's phone in both gloves, up in front of his face, filming (Still Scrolling's hold)
const PH_UP = { y: 0.34, z: 0.45 };
const phArms = ({ y, z }) => ({ R: { x: [-0.11, y, z], palm: [0, y, z] }, L: { x: [0.11, y, z], palm: [0, y, z] } });
{ const a = phArms(PH_UP); c.arm(0, "phx", "R", a.R, 0); c.arm(0, "phx", "L", a.L, 0); A(0, "phx", "grip", { side: "both", shape: "hold", dur: 0 }); }
A(0, "phx", "grab", { prop: "phone", hand: "both", grip: [0, 0.035, 0], pose: null, dur: 0 });
const click = (t, why) => { sfx(t, "click", { gain: 1.6, reason: `Phoenix's phone shutter: ${why}` }); c.prop(r3(t - 0.02), "phone", { glow: 1.0 }, 0.03, "out"); c.prop(r3(t + 0.04), "phone", { glow: 0.75 }, 0.15, "in"); };

const SUB_LOW = 1262, SUB_HIGH = 480;
const FRIENDS = ["gsl", "rea", "phx"];
// the shock meter (series format): the friends' sprouts droop one step at a time; the waiter's never moves
const droop = (t, to) => FRIENDS.forEach((w, i) => A(r3(t + i * 0.05), w, "droop", { to, dur: 0.35, ease: "settle" }));
// a fry's gloves (world points from where it stands): down inside the cone, up in a cheer, out on a pot's rim
const fryBase = { fa: FY, fb: FY, fc: FY };
// a fry's gloves go with its body (o: [out past its side, up its height 0..1, forward], each side mirrored), so they
// stay on it through a hop
const fryArms = (t, who, o, shape = "relaxed", dur = 0.15, ease = "out") => { for (const s of ["L", "R"]) { c.arm(t, who, s, { o }, dur, ease); A(t, who, "grip", { side: s, shape, dur: Math.min(dur, 0.12) }); } };
const IN_CONE = [-0.07, 0.28, 0.08], CHEER = [0.06, 1.0, 0.06], CHEER2 = [0.1, 0.92, 0.08], LOW = [-0.07, 0.3, 0.08], RIM = [0.16, 0.34, 0.12], SOUPRIM = [0.2, 0.3, 0.1], CROUCH = [0.06, 0.35, 0.14], TADA = [0.12, 1.08, 0.02];
// a fry's hop from where it stands to (x, z) with its feet at y: the body's base moves there over dur, a hop arc on top
const hopTo = (t, who, [x, z], y, dur, height, flip = 0, quiet = false) => {
  A(t, who, "move", { to: [x, z], y, dur, ease: "linear", steps: 0 });   // across at an even speed (a leap's path), the hop's arc on top
  A(t, who, "hop", { height, dur, ...(quiet && { quiet: true }) });
  if (flip) { A(r3(t + dur * 0.12), who, "pitch", { to: flip, dur: r3(dur * 0.7), ease: "inOut" }); }   // it stays at -360, the same as upright (a reset to 0 read as a one-frame tip)
  fryBase[who] = y;
};

// ---------------------------------------------------------------- 1 BEST FRIES IN TOWN 0-1.25 (panel 1, the wide)
// frame 0 (B1): Viking mid-shout over the cone, both fists up, Gunslinger already glaring at the giant fries; the
// Samurai straightening from setting the tray down (its clack is the first sound, under the promise: B2 + v3 B7)
sfx(0, "hit-wood", { gain: 0.4, reason: "the wooden tray set down on the wooden table: a light tock" });
A(0, "sam", "lean", { to: 10, dur: 0 }); A(0.05, "sam", "lean", { to: 0, dur: 0.45, ease: "inOut" });
A(0, "sam", "look", { to: [-0.4, -0.5], dur: 0, blink: false }); A(0, "sam", "face", { lid: 0.35, dur: 0 });
A(0.7, "sam", "look", { to: [-0.3, -0.15], dur: 0.15, blink: false });
act.opener(c, "vik", "best fries in town!", { at: 0, dur: 0.85, tone: "excited", pos: SUB_HIGH });
A(0, "vik", "look", { to: [0, -0.6], dur: 0, blink: false });
A(0, "vik", "expr", { expr: "eager", set: { open: 0.6 }, dur: 0 });
// at rest his gloves lie on the table either side of the tray (hanging at his sides they went into Gunslinger)
const VREST = { L: { prop: "table", grip: [0.24, r3(TH + 0.035), r3(-0.22 - TZ)], palm: true }, R: { prop: "table", grip: [-0.24, r3(TH + 0.035), r3(-0.22 - TZ)], palm: true } };
const vikRest = (t, dur = 0.3) => { for (const s of ["L", "R"]) c.arm(t, "vik", s, VREST[s], dur, "inOut"); };
const FISTS = { L: { o: [0.1, 0.9, 0.32] }, R: { o: [0.0, 0.92, 0.34] } };   // o is mirrored per side; the right fist stays in, clear of Gunslinger's hat brim
for (const s of ["L", "R"]) { c.arm(0, "vik", s, FISTS[s], 0); A(0, "vik", "grip", { side: s, shape: "fist", dur: 0 }); }
vikRest(1.05);
for (const s of ["L", "R"]) A(1.05, "vik", "grip", { side: s, shape: "relaxed", dur: 0.2 });
// the fries: just food, eyes shut (lids down), still, their gloves down in the cone
for (const f of FRIES) { fryArms(0, f, IN_CONE, "relaxed", 0); A(0, f, "look", { to: [0, 0.1], dur: 0, blink: false }); A(0, f, "face", { lid: 0.95, dur: 0 }); act.blinksAt(c, f, []); }
A(0, "fa", "still", { dur: 0.95, idle: 0 }); A(0, "fb", "still", { dur: 0.95, idle: 0 }); A(0, "fc", "still", { dur: 0.95, idle: 0 });
// the friends: Gunslinger glares at the fries next to his salad; Reaper over his soup; Phoenix films
c.arm(0, "gsl", "R", { o: [0.0, 0.36, 0.34] }, 0); c.arm(0, "gsl", "L", { o: [-0.16, 0.4, 0.32] }, 0);
A(0, "gsl", "look", { to: [0.55, -0.45], dur: 0, blink: false });
// Reaper's gloves rest on the table either side of his soup
for (const [s, dx] of [["R", -0.25], ["L", 0.27]]) { c.arm(0, "rea", s, { prop: "table", grip: [r3(SOUP[0] + dx), r3(TH + 0.04), r3((s === "R" ? -0.3 : -0.24) - TZ)], palm: true }, 0); A(0, "rea", "grip", { side: s, shape: "relaxed", dur: 0 }); }
A(0, "rea", "look", { to: [-0.2, -0.45], dur: 0, blink: false }); A(0, "rea", "face", { lid: 0.4, dur: 0 });
A(0, "phx", "look", { to: [0.3, -0.5], dur: 0, blink: false });
c.prop(0, "phone", { glow: 0.75 }, 0.01);
see(0, 0.9, ["vik.face", "gsl.face", "rea.face", "sam.face", "phx.face", "fa", "cone"], "panel 1: Viking shouts at the giant cone of fries, Best fries in town!");

// 0.95: the fries open their eyes and cheer back, gloves up (the hook's question: he's not going to eat them…?)
const WAKE = 0.95;
sfx(WAKE, "hop", { gain: 0.6, reason: "the three fries' eyes pop open: a quick little rising bwip" });
FRIES.forEach((f, i) => {
  const t = r3(WAKE + i * 0.04);
  A(t, f, "face", { lid: 0, dur: 0.08 });   // the eyes pop open
  A(t, f, "expr", { expr: "delighted", set: { eye: 1.15, curve: 0.9, open: 0.5 }, dur: 0.08 });
  A(t, f, "look", { to: [i === 1 ? 0.3 : i === 2 ? -0.3 : 0, 0.6], dur: 0.08, blink: false });   // up at Viking
  fryArms(r3(t + 0.04), f, CHEER, "open", 0.14);
  A(r3(t + 0.06), f, "hop", { height: 0.045, dur: 0.24, quiet: true });   // the "bwip" is their sound; three tiny landing thuds only muddied it on a phone
});
c.at(r3(WAKE + 0.02), { fx: "sparkle", who: "fa", dur: 0.35, count: 6, color: "#fff2a8" });
c.say(1.0, "fa", "yaaay!", 0.4, "excited", { voice: false, sub: "Yaaay!", pos: SUB_HIGH });
for (const f of FRIES) for (const [t, o] of [[1.3, CHEER2], [1.45, CHEER]]) fryArms(t, f, o, "open", 0.12, "inOut");
act.shock(c, 1.02, "vik", { hold: 0.3, open: 0.35, eye: 1.3, curve: 0.3 });
A(1.0, "gsl", "look", { to: [0.5, -0.5], dur: 0.08, blink: false });
A(1.05, "rea", "look", { to: [-0.45, -0.4], dur: 0.12, blink: false });
A(1.1, "phx", "expr", { expr: "eager", set: { open: 0.4, eye: 1.25 }, dur: 0.15 });
see(1.0, 1.22, ["fa.face", "fb.face", "fc.face", "vik.face", "gsl.face"], "the fries wake up and cheer, Yaaay!");

// ---------------------------------------------------------------- 1b THE VICTIM 1.25-1.9 (v3 B8: a cut to his face)
const GSLCU = 1.25;
act.shock(c, 1.18, "gsl", { hold: 0.6, open: 0.6, eye: 1.4, curve: -0.35 });
A(1.25, "gsl", "lean", { to: -6, dur: 0.3, ease: "out" });
A(1.4, "gsl", "droop", { to: 0.2, dur: 0.25, ease: "settle" });
see(1.3, 1.85, ["gsl.face"], "v3 B8: Gunslinger's face, the victim, horrified at the cheering fries");

// ---------------------------------------------------------------- 2 THE FIRST BITE… "HI!" 1.9-2.8 (panel 2, the push-in)
// he leans in, mouth open, for the tallest fry; it pops up and waves at his nose: "Hi!". He melts: the blossom
A(1.85, "vik", "expr", { expr: "eager", set: { open: 0.55, curve: 0.5 }, dur: 0.15 });
A(1.85, "vik", "look", { to: [0, -0.75], dur: 0.12, blink: false });
A(1.9, "vik", "lean", { to: 4, dur: 0.25, ease: "inOut" });
for (const f of ["fb", "fc"]) fryArms(1.9, f, LOW, "relaxed", 0.2, "inOut");
A(1.9, "fb", "look", { to: [0.4, 0.5], dur: 0.1, blink: false }); A(1.9, "fc", "look", { to: [-0.4, 0.5], dur: 0.1, blink: false });
const HI = 2.08;
A(r3(HI - 0.12), "fa", "hop", { height: 0.03, dur: 0.2 });   // a little bounce in the cone
A(r3(HI - 0.05), "fa", "look", { to: [0, 0.8], dur: 0.08, blink: false });
A(HI, "fa", "expr", { expr: "delighted", set: { curve: 1, open: 0.45, eye: 1.1 }, dur: 0.12 });
c.arm(HI, "fa", "L", { o: CHEER }, 0.12, "out"); A(HI, "fa", "grip", { side: "L", shape: "open", dur: 0.1 }); c.arm(HI, "fa", "R", { o: LOW }, 0.15, "inOut");
for (const [t, out] of [[2.2, 0.14], [2.32, 0.04], [2.44, 0.14]]) c.arm(t, "fa", "L", { o: [out, 0.98, 0.06] }, 0.12, "inOut");   // the wave
c.textPop(HI, "fa", "Hi!", { dur: 0.3, size: 80, xy: [380, 1170], angle: -4, color: "speaker" });   // review B: a word beside the cone (a low subtitle sat on the fries)
sfx(r3(HI + 0.02), "gasp", { gain: 0.55, reason: "Viking's little gasp as the fry waves at him" });
act.shock(c, r3(HI + 0.04), "vik", { hold: 0.2, open: 0.3, eye: 1.3, curve: 0.2 });
A(2.25, "vik", "lean", { to: 2, dur: 0.25, ease: "out" });
// Viking melts: the softest smile, eyes shut, pink cheeks, the blossom pops open on his sprout, a blissful sway
A(2.32, "vik", "expr", { expr: "delighted", set: { curve: 1, open: 0.15 }, dur: 0.2 }); A(2.32, "vik", "face", { lid: 0.85, dur: 0.2 });
c.textPop(2.3, "vik", "Awww!", { dur: 0.48, size: 88, xy: [810, 840], angle: -4, color: "speaker" });   // a word beside his head: a caption over the push-in sat on his face or on the fries for its whole length (review B check)
A(2.4, "vik", "bloom", { to: 1, dur: 0.25, ease: "back" });
sfx(2.4, "pop", { gain: 0.6, reason: "the series' sound logo: the potato blossom pops open on Viking's sprout" });
for (const [t, r] of [[2.45, 5], [2.62, -5], [2.78, 0]]) A(t, "vik", "tilt", { to: [0, r], dur: 0.16 });
A(1.95, "gsl", "look", { to: [0.5, -0.45], dur: 0.1, blink: false });
A(2.0, "rea", "look", { to: [-0.45, -0.35], dur: 0.12, blink: false });
see(1.95, 2.3, ["vik.face", "fa.face"], "panel 2: he leans in for the first bite and the fry pops up and waves, Hi!");
see(2.4, 2.75, ["vik.face", "vik.sprout", "fa.face"], "the blossom");

// ---------------------------------------------------------------- 3 POOL PARTY 2.8-5.8 (panels 3-4)
// the friends stare; one fry spots the ketchup ("Ooh!") and hops in like a hot tub; the next cannonballs into the mayo
act.shock(c, 2.85, "gsl", { hold: 0.8, open: 0.4, eye: 1.35, curve: -0.3 }); act.shock(c, 2.9, "rea", { hold: 0.9, open: 0.15, eye: 1.4 });
click(3.0, "a photo of the waving fry");
droop(3.1, 0.45);   // shock meter, step 1
A(2.8, "vik", "face", { lid: 0.1, dur: 0.15 }); A(2.85, "vik", "expr", { expr: "delighted", set: { curve: 0.9, open: 0.25 }, dur: 0.15 });
vikRest(2.85);
c.arm(2.85, "fa", "L", { o: [0.0, 1.0, -0.06] }, 0.12, "inOut"); c.arm(2.97, "fa", "L", { o: [-0.1, 0.75, -0.02] }, 0.12, "inOut"); c.arm(3.09, "fa", "L", { o: [-0.08, 0.3, 0.02] }, 0.15, "inOut");
// the waving glove comes in behind its head, then down inside and rests a little back (the fries stand shoulder to
// shoulder and fry C is a step in front: down the front, or resting forward in LOW, the arm went through it)
c.arm(2.85, "fa", "R", { o: LOW }, 0.2, "inOut");
for (const s of ["L", "R"]) A(2.85, "fa", "grip", { side: s, shape: "relaxed", dur: 0.2 });
c.arm(5.0, "fa", "L", { o: [0.0, 0.3, 0.06] }, 0.2, "inOut");   // fry C has gone into the mayo: the glove moves out to its side (tucked in, it sank into its own body)
// fry B: looks down at the ketchup, points, "Ooh!", hops in
const OOH = 3.2;
A(r3(OOH - 0.12), "fb", "look", { to: [-0.4, -0.6], dur: 0.12, blink: false });
A(OOH, "fb", "expr", { expr: "eager", set: { open: 0.5, eye: 1.25, curve: 0.6 }, dur: 0.12 });
c.arm(OOH, "fb", "R", { o: [0.22, 0.55, 0.2] }, 0.18, "out"); A(OOH, "fb", "grip", { side: "R", shape: "point", dur: 0.12 });
c.say(r3(OOH + 0.03), "fb", "ooh!", 0.35, "excited", { voice: false, sub: "Ooh!", pos: SUB_LOW });
A(3.3, "vik", "look", { to: [-0.3, -0.75], dur: 0.12, blink: false });
const HOPB = 3.55, INB = 0.4, POT_IN = r3(TT - 0.08);   // in a pot its feet go down under the table top (hidden by the pot), so it sits waist deep; its gloves on the rim
fryArms(r3(HOPB - 0.05), "fb", CHEER, "open", 0.12);
hopTo(HOPB, "fb", [KET[0], r3(KET[1] - 0.025)], POT_IN, INB, 0.16);
sfx(r3(HOPB + INB), "ai/drip", { gain: 0.9, reason: "the fry plops into the ketchup pot" });
c.prop(r3(HOPB + INB), "ket", { splash: 1 }, 0.4, "out");
// in the hot tub: gloves out on the rim, eyes shut, "Aaah!"
fryArms(r3(HOPB + INB + 0.05), "fb", RIM, "relaxed", 0.2);
A(r3(HOPB + INB + 0.1), "fb", "expr", { expr: "delighted", set: { curve: 0.9, open: 0.2 }, dur: 0.15 }); A(r3(HOPB + INB + 0.1), "fb", "face", { lid: 0.9, dur: 0.15 });
c.say(r3(HOPB + INB + 0.12), "fb", "aaah!", 0.45, "happy", { voice: false, sub: "Aaah!", pos: SUB_LOW });
A(r3(HOPB + INB + 0.1), "fb", "still", { dur: 1.0, idle: 0.05 });
// Viking claps with delight
const clap = (t) => { for (const s of ["L", "R"]) { c.arm(t, "vik", s, { o: [-0.36, 0.34, 0.46] }, 0.08, "in"); c.arm(r3(t + 0.12), "vik", s, { o: [-0.22, 0.36, 0.44] }, 0.08, "out"); } };   // the gloves meet in front of his chest
for (const s of ["L", "R"]) A(4.05, "vik", "grip", { side: s, shape: "flat", dur: 0.1 });
for (const t of [4.15, 4.4]) { clap(t); sfx(r3(t + 0.08), "pat", { gain: 0.6, reason: "Viking claps his gloves together with joy at the fry in the ketchup: a soft muffled clap" }); }
A(4.1, "vik", "expr", { expr: "delighted", set: { curve: 1, open: 0.4 }, dur: 0.12 });
// fry C: a cannonball into the mayo
const HOPC = 4.75, INC = 0.42;
A(r3(HOPC - 0.2), "fc", "look", { to: [0.45, -0.6], dur: 0.1, blink: false });
A(r3(HOPC - 0.15), "fc", "expr", { expr: "eager", set: { open: 0.6, eye: 1.2, curve: 0.8 }, dur: 0.1 });
fryArms(r3(HOPC - 0.05), "fc", CHEER, "fist", 0.12);
c.say(HOPC, "fc", "wheee!", 0.45, "excited", { voice: false, sub: "Wheee!", pos: SUB_LOW });
hopTo(HOPC, "fc", [MAY[0], r3(MAY[1] - 0.025)], POT_IN, INC, 0.2);
sfx(r3(HOPC + INC), "splash", { gain: 0.55, reason: "the fry cannonballs into the mayo pot" });
c.prop(r3(HOPC + INC), "may", { splash: 1 }, 0.4, "out");
fryArms(r3(HOPC + INC + 0.05), "fc", RIM, "relaxed", 0.2);
A(r3(HOPC + INC + 0.1), "fc", "expr", { expr: "delighted", set: { curve: 0.9, open: 0.3 }, dur: 0.15 });
A(r3(HOPC + INC + 0.1), "fc", "still", { dur: 1.6, idle: 0.05 });
for (const s of ["L", "R"]) { c.arm(4.62, "vik", s, { o: [-0.12, 0.3, 0.4] }, 0.18, "inOut"); A(4.62, "vik", "grip", { side: s, shape: "relaxed", dur: 0.2 }); }   // the clasped gloves sink, then settle on the table (straight to the table the gloves flipped over)
vikRest(4.82, 0.3);
// Viking eats one (Jonny 8 Nov, panel 4's hamster cheeks): the hot-tub fry looks up, "Me next!", and dives out of the
// ketchup into his open mouth. He catches it, chews with his eyes shut (crunch), and swallows (glk)
const DIVE = 5.3, DIN = 0.33, MOUTH = [-0.05, -0.07];   // Viking's mouth at about (-0.05, 0.54, -0.27): the fry dives head first (tipped back), its middle at mouth height, its head at his lips, and is gone
A(5.05, "fb", "look", { to: [0.25, 0.85], dur: 0.12, blink: false }); A(5.05, "fb", "face", { lid: 0, dur: 0.12 });
A(5.1, "fb", "expr", { expr: "eager", set: { open: 0.55, eye: 1.25, curve: 0.8 }, dur: 0.12 });
c.textPop(5.12, "fb", "Me next!", { dur: 0.5, size: 76, xy: [300, 1080], angle: -4, color: "speaker" });
A(5.05, "vik", "look", { to: [-0.3, -0.7], dur: 0.12, blink: false });
A(5.15, "vik", "expr", { expr: "eager", set: { open: 0.9, curve: 0.4, eye: 1.2 }, dur: 0.15 });   // "aaah": mouth wide open
fryArms(r3(DIVE - 0.08), "fb", [0.04, 0.4, 0.0], "fist", 0.1, "inOut");   // arms in for the dive
hopTo(DIVE, "fb", MOUTH, 0.33, DIN, 0.14, 0, true);   // no landing thump: the crunch is its sound
A(r3(DIVE + 0.03), "fb", "pitch", { to: -85, dur: r3(DIN * 0.75), ease: "inOut" });
c.prop(DIVE, "ket", { splash: 1 }, 0.3, "out");
sfx(DIVE, "ai/drip", { gain: 0.4, reason: "the fry springs out of the ketchup pot: a small wet drip" });
A(r3(DIVE + DIN - 0.02), "fb", "hide", {});
sfx(r3(DIVE + DIN + 0.02), "ai/crunch", { gain: 0.7, reason: "Viking bites down on the fry that dived into his mouth: crunch" });
A(r3(DIVE + DIN), "vik", "face", { lid: 0.85, dur: 0.12 });   // eyes shut, bliss
A(r3(DIVE + DIN), "vik", "expr", { expr: "delighted", set: { curve: 0.9, open: 0.05 }, dur: 0.1 });
for (const [k, t] of [0.12, 0.26, 0.4, 0.54].entries()) {   // chewing
  A(r3(DIVE + DIN + t), "vik", "squash", { amount: 0.03, dur: 0.08 });
  A(r3(DIVE + DIN + t), "vik", "expr", { expr: "delighted", set: { curve: 0.9, open: k % 2 ? 0.05 : 0.22 }, dur: 0.07 });
}
sfx(r3(DIVE + DIN + 0.68), "gulp", { gain: 0.6, reason: "Viking swallows the fry: glk" });
A(r3(DIVE + DIN + 0.7), "vik", "face", { lid: 0.1, dur: 0.15 });
see(5.1, 5.6, ["fb.face", "vik.face"], "Jonny 8 Nov: the hot-tub fry dives out of the ketchup into Viking's open mouth, Me next!");
// Gunslinger pushes his salad away with one finger (panel 3's arrow)
const PUSH = 6.3;   // review B: inside the "seeing this" shot, where his salad is in frame (in the dips shot it was off the edge)
c.arm(r3(PUSH - 0.25), "gsl", "L", { prop: "salad", grip: [-0.09, 0.1, 0.0] }, 0.25, "inOut"); A(r3(PUSH - 0.2), "gsl", "grip", { side: "L", shape: "point", dur: 0.15 });
c.prop(PUSH, "salad", { x: r3(SALAD[0] - 0.08), z: r3(SALAD[1] + 0.02) }, 0.35, "inOut");
sfx(PUSH, "ai/bowl-scrape", { gain: 0.55, reason: "Gunslinger's salad bowl pushed away over the wooden table" });
c.arm(r3(PUSH + 0.45), "gsl", "L", { o: [-0.16, 0.4, 0.32] }, 0.3, "inOut"); A(r3(PUSH + 0.45), "gsl", "grip", { side: "L", shape: "relaxed", dur: 0.2 });
A(4.0, "gsl", "look", { to: [0.4, -0.55], dur: 0.12, blink: false });
A(5.0, "gsl", "look", { to: [0.65, -0.5], dur: 0.12, blink: false });
A(4.9, "phx", "expr", { expr: "eager", set: { open: 0.5 }, dur: 0.12 });
A(4.2, "rea", "look", { to: [-0.35, -0.5], dur: 0.15, blink: false });
see(3.2, 3.5, ["fb.face", "ket", "vik.face"], "panel 3: the fry spots the ketchup, Ooh!");
see(3.95, 4.6, ["fb.face", "vik.face"], "panel 3: the fry in the ketchup like a hot tub, Aaah!; Viking claps");
see(4.75, 5.3, ["fc.face", "may", "vik.face"], "panel 4: the next fry cannonballs into the mayo, Wheee!");

// ---------------------------------------------------------------- 4 ARE YOU SEEING THIS? 5.8-6.8 (panel 5)
const SEEING = 5.95;
A(5.8, "gsl", "turn", { to: 30, dur: 0.3 });
A(5.85, "gsl", "lean", { to: 8, dur: 0.3 });
A(5.85, "gsl", "look", { to: [0.6, -0.5], dur: 0.1, blink: false });   // eyes never leave the fries
act.mood(c, 5.85, "gsl", "annoyed", { hold: 0.8 });
c.say(SEEING, "gsl", "are you seeing this?", 0.75, "question", { voice: false, sub: "Are you seeing this?", pos: SUB_LOW });
A(6.0, "rea", "look", { to: [-0.5, -0.45], dur: 0.15, blink: false });
A(6.0, "rea", "lean", { to: -6, dur: 0.6 });
droop(6.2, 0.85);   // step 2
A(6.7, "gsl", "turn", { to: GSL_YAW, dur: 0.3 }); A(6.7, "gsl", "lean", { to: 0, dur: 0.3 });
A(5.9, "vik", "look", { to: [0.1, -0.7], dur: 0.12, blink: false });
A(6.4, "vik", "expr", { expr: "delighted", set: { curve: 0.8, open: 0.2 }, dur: 0.2 });
see(5.95, 6.7, ["gsl.face", "vik.face"], "panel 5: Gunslinger leans to Reaper, Are you seeing this?");

// ---------------------------------------------------------------- 5 THE BACKFLIP 6.8-8.6 (panels 6-7)
// the last fry in the cone spots Reaper's soup ("Ooh, soup!"), crouches and backflips off the cone: the cone tips over
// behind it (physics) and the fry lands standing upright in the soup (the payoff, hit-stop)
const SPOT = 6.85;
A(SPOT, "fa", "look", { to: [0.75, -0.3], dur: 0.12, blink: false });
A(r3(SPOT + 0.05), "fa", "expr", { expr: "eager", set: { open: 0.55, eye: 1.25, curve: 0.7 }, dur: 0.12 });
c.say(r3(SPOT + 0.1), "fa", "ooh, soup!", 0.5, "excited", { voice: false, sub: "Ooh, soup!", pos: SUB_LOW });
A(r3(SPOT + 0.1), "vik", "look", { to: [0.1, -0.7], dur: 0.12, blink: false });
const LAUNCH = 7.25, FLY = r3(HS - LAUNCH);
fryArms(r3(LAUNCH - 0.2), "fa", CROUCH, "fist", 0.15, "inOut");
A(r3(LAUNCH - 0.2), "fa", "squash", { amount: 0.18, dur: 0.2 });   // the crouch
hopTo(LAUNCH, "fa", [SOUP[0], SOUP[1]], r3(SOUP_TOP - 0.13), FLY, 0.42, -360);
fryArms(LAUNCH, "fa", CHEER, "open", 0.12);
sfx(LAUNCH, "whoosh", { gain: 0.4, reason: "the fry springs off the cone into a backflip" });
c.knock(r3(LAUNCH + 0.2), "cone", { v: [-0.3, 0.06, 0.0], spin: [0, 0, 6.0] });   // the push-off jolts it: it hops and rocks back down in its wire stand (the stand keeps it upright). It wakes once the fry is out of it: woken with the fry's body still inside, the bake shot it 70 cm up
sfx(r3(LAUNCH + 0.35), "put-down-glass", { gain: 0.25, reason: "the paper cone dropping back into its wire stand after the push-off" });
// the landing: upright in the soup, a plop and a splash, the soup rings out round it
sfx(HS, "ai/drip", { gain: 1.0, reason: "the payoff: the fry lands upright in Reaper's soup, a wet plop" });
sfx(HS, "splash", { gain: 0.7, reason: "the soup splashing up round the fry" });
c.prop(HS, "soup", { ripple: 1 }, 0.6, "out");
c.hitStop(HS, 3);
c.at(HS, { fx: "poof", pos: [SOUP[0], r3(SOUP_TOP + 0.03), SOUP[1]], dur: 0.35, color: "#ffd6c8", puffs: 4, sparks: 6, size: 0.14, lift: 0.06 });
// "Ta-da!": both gloves up
fryArms(V(7.82), "fa", TADA, "open", 0.12);
c.textPop(V(7.85), "fa", "Ta-da!", { dur: 0.6, size: 88, xy: [600, 760], angle: -4, color: "speaker" });   // a word beside the fry (the clip's second): a low caption sat on the fry and the soup
A(V(7.82), "fa", "expr", { expr: "delighted", set: { curve: 1, open: 0.5, eye: 1.1 }, dur: 0.12 });
A(V(7.85), "fa", "look", { to: [0.3, 0.5], dur: 0.1, blink: false });   // up at Reaper
// Reaper: looks down at it, then slowly up at Viking; the shock meter hits limp
A(r3(LAUNCH + 0.15), "rea", "look", { to: [-0.35, -0.55], dur: 0.12, blink: false });
A(V(7.9), "rea", "look", { to: [-0.2, -0.75], dur: 0.15, blink: false });
act.shock(c, V(7.8), "rea", { hold: 0.8, open: 0.1, eye: 1.45 });
A(V(8.5), "rea", "look", { to: [-0.55, -0.1], dur: 0.4, blink: false });
droop(V(7.95), 1.35);   // step 3: limp
// Viking: a fist of joy
A(r3(LAUNCH + 0.05), "vik", "look", { to: [0.45, -0.55], dur: 0.12, blink: false });
A(V(7.8), "vik", "expr", { expr: "delighted", set: { curve: 1, open: 0.45 }, dur: 0.15 });
c.arm(V(7.85), "vik", "L", { o: [0.3, 0.72, 0.22] }, 0.2, "out"); A(V(7.85), "vik", "grip", { side: "L", shape: "fist", dur: 0.12 });
c.arm(V(8.45), "vik", "L", { o: [0.22, 0.6, 0.3] }, 0.3, "inOut");   // the fist comes down to chest height and stays (back to the table and up again, the glove flipped over)
A(r3(LAUNCH + 0.05), "gsl", "look", { to: [0.75, -0.4], dur: 0.12, blink: false });
act.shock(c, V(7.85), "gsl", { hold: 0.6, open: 0.4, eye: 1.35, curve: -0.3 });
A(r3(LAUNCH + 0.05), "fc", "look", { to: [0.4, 0.0], dur: 0.12, blink: false });
see(SPOT, 7.2, ["fa.face", "vik.face", "soup"], "panel 6: the last fry spots Reaper's soup, Ooh, soup!");
see(7.3, r3(HS + 0.05), ["fa", "soup", "rea.face"], "panel 6: the backflip off the cone into the soup");
see(V(7.85), V(8.55), ["fa.face", "rea.face", "soup", "vik.face"], "panel 7: the fry standing upright in Reaper's soup, Ta-da!");

// ---------------------------------------------------------------- 6 WANT SOME? 8.6-9.9 (panel 8, the wide)
// the fry leans back in the soup like a hot tub and offers Reaper his own soup; Gunslinger leans back, palms up
const OFFER = V(8.75);
fryArms(OFFER, "fa", SOUPRIM, "relaxed", 0.2, "inOut");
A(OFFER, "fa", "look", { to: [0.3, 0.45], dur: 0.12, blink: false });
A(OFFER, "fa", "expr", { expr: "happy", set: { curve: 0.8, open: 0.3 }, dur: 0.15 });
c.say(V(8.85), "fa", "want some?", 0.55, "question", { voice: false, soft: true, sub: "Want some?", pos: SUB_HIGH });
A(V(9.0), "fa", "still", { dur: 0.85, idle: 0 });
// Reaper, the friend being offered: down at the fry in his soup, a slow lean away, then up at Viking at the cut (review A)
A(V(8.85), "rea", "look", { to: [-0.3, -0.75], dur: 0.15, blink: false }); A(V(8.9), "rea", "lean", { to: -8, dur: 0.6, ease: "inOut" });
A(9.6, "rea", "look", { to: [-0.55, -0.1], dur: 0.15, blink: false });
click(V(8.95), "the fry offering Reaper his own soup");
// Gunslinger: a slow lean back, both palms up (panel 8)
const PALMS = V(8.9);
A(PALMS, "gsl", "lean", { to: -6, dur: 0.5, ease: "inOut" });
c.arm(PALMS, "gsl", "L", { o: [-0.02, 0.5, 0.4] }, 0.3, "out"); c.arm(PALMS, "gsl", "R", { o: [0.22, 0.5, 0.3] }, 0.3, "out");
for (const s of ["L", "R"]) A(PALMS, "gsl", "grip", { side: s, shape: "open", dur: 0.2 });
act.shock(c, PALMS, "gsl", { hold: 0.9, open: 0.35, eye: 1.4, curve: -0.2 });
// Viking, proud: a thumbs-up
A(9.2, "vik", "look", { to: [0.4, -0.5], dur: 0.12, blink: false });
A(9.25, "vik", "grip", { side: "L", shape: "thumb", dur: 0.15 });
A(9.25, "vik", "expr", { expr: "delighted", set: { curve: 1, open: 0.2 }, dur: 0.15 });
see(V(8.9), r3(END - 0.05), ["fa.face", "rea.face", "gsl.face", "vik.face", "phx.face", "vik.sprout"], "panel 8: the fry offers Reaper his own soup, Want some?; Gunslinger leans back, palms up");

// blinks off the lines and the key looks
act.blinksAt(c, "gsl", [0.6, 2.6, 4.7, V(8.3)]); act.blinksAt(c, "rea", [0.5, 4.6, 6.6]); act.blinksAt(c, "phx", [0.7, 4.0, 6.5, V(8.4)]);
act.blinksAt(c, "sam", [1.0, 3.9, 6.1, V(8.6)]); act.blinksAt(c, "vik", [1.6, 4.9, 6.6]);

// ---------------------------------------------------------------- shots (Jonny's panels)
const fw = (target, { w, ...o }) => frame(target, { ...o, h: r3((w * 16) / 9) });
const WIDE = fw([-0.06, 0.98, -0.5], { w: 2.35, el: 7, fov: 46 });
const WIDE_OPEN = fw([-0.06, 0.98, -0.5], { w: 2.35, el: 7, fov: 46, push: 0.1, dur: 1.25 });   // review A: a slow push at the cone from frame 0 (the cut at 1.25 ends it, no pull-back)                       // panels 1, 8: both rows, the cone bottom centre
const VICTIM = fw([GSL[0] + 0.05, 0.74, GSL[1]], { w: 1.0, az: -4, el: 6, fov: 22 });       // v3 B8: Gunslinger's face
const BITE = fw([-0.05, 0.75, -0.42], { w: 1.55, el: 38, fov: 30, push: 0.06, dur: 0.9 });   // from higher: the fries stay under his eyes  // panel 2: the series' straight push-in
const POOL = fw([0.0, 0.52, -0.12], { w: 1.15, el: 20, fov: 32 });                          // panels 3-4: Viking, the tray and the dips, Gunslinger's face
const SEEING_SHOT = fw([-0.35, 0.62, -0.5], { w: 1.9, az: -14, el: 10, fov: 30 });        // panel 5: Gunslinger big front left, Reaper behind his line
const LEAP = fw([0.42, 0.42, -0.3], { w: 1.5, az: 8, el: 20, fov: 30 });   // the cone (the fry that says Ooh, soup!) at the left, the soup big in the middle, Reaper right                  // panels 6-7: the cone, Viking, Reaper and his soup
const beats = c.beats([
  ["P1 best fries in town", 0, WIDE_OPEN, "hook"],
  ["P1b the victim (v3 B8)", GSLCU, VICTIM, "reaction"],
  ["P2 the first bite: Hi!", 1.9, BITE],
  ["P3 pool party", 2.8, WIDE, "escalation"],
  ["P3b the dips", 3.25, POOL],
  ["P5 are you seeing this", 5.8, SEEING_SHOT],
  ["P6 the backflip", 6.8, LEAP, "payoff"],
  ["P8 want some", V(8.6), WIDE],
], END);

// in the wide the lower third is all faces and fries, so lines there go up on the shelf (y 480, under the in-app
// title, over the back row's heads); in the closer shots they sit low. Each line ends before the cut out of its shot
for (const cp of c.captions) {
  if (cp.text === "Best fries in town!") cp.to = 0.95;
  if (cp.text === "Yaaay!") cp.to = GSLCU;
  if (cp.text === "Ooh!") cp.to = 3.55;
  if (cp.text === "Wheee!") cp.to = 5.1;   // it ends before the next fry's "Me next!"
  if (cp.text === "Are you seeing this?") cp.to = 6.8;
  if (cp.text === "Ooh, soup!") cp.to = LAUNCH;
  if (cp.text === "Want some?") cp.to = END;
}

write(import.meta.url, {
  id: "fries",
  title: "That one friend who always orders potatoes… at the burger place",
  idea: "Always orders potatoes, episode 1: a sunny burger bar. Viking shouts Best fries in town! and the three fries in his cone open their eyes and cheer. He leans in for the first bite, the fry waves Hi! at his nose and he melts (the blossom pops). The fries treat his tray like a pool party: one hops into the ketchup like a hot tub, one cannonballs into the mayo, and the last backflips off the cone and lands standing upright in Reaper's tomato soup, then offers him his own soup: Want some?",
  fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, captionStyle: "kinetic",
  cleanStart: true,
  motion: { feet: 2, overlap: true, timing: true, solve: true }, rig: { hand: 2, eyes: 2, hold: 2 }, physics: true,
  cover: 2.5,
  set: { type: "plain", color: "#8a4a32", floor: "#5a3424", light: "golden", para: 0, bloom: "emissive", aperture: 0,
    plate: { src: "assets/plates/burger-bar-day.png", z: -2.6, center: [0.1, 2.75], height: 7.6, depth: false, motion: false, dust: 8 },
    lighting: 2, hatch: { boil: 0.25 } },
  music: { style: "bounce", key: 4, bpm: 112, lowCut: 150, gain: 0.3 },
  sound: { sfx: 0.7, ambience: 0.3, surface: "wood", room: "room", guard: true, signature: { entrances: false } },
  creative: { length: [10, 10] },
  hook: { show: ["vik", "gsl", "rea", "phx", "fa"], hint: WAKE, what: "Viking shouts Best fries in town! at a giant paper cone of fries while Gunslinger glares; at 0.95 s the fries open their eyes and cheer back" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    { who: "sam", with: "apron", from: 0, to: 10, reason: "the waiter's apron (worn)" },
    { who: "sam", with: "hat", from: 0, to: 10, reason: "the waiter's paper cap (worn)" },
    ...["fa", "fb", "fc"].map((f) => ({ who: f, with: "cone", from: 0, to: 10, reason: "a fry stands in the paper cone, its lower half inside it (the dish)" })),
    ...["fa", "fb", "fc"].map((f) => ({ who: f, with: "tray", from: 0, to: 10, reason: "a fry's tiny feet stand on the tray's paper" })),
    { who: "fa", with: "fb", from: 0, to: 3.9, reason: "the three fries stand packed side by side in one cone" },
    { who: "fa", with: "fc", from: 0, to: 5.2, reason: "the three fries stand packed side by side in one cone" },
    { who: "fb", with: "fc", from: 0, to: 3.9, reason: "the three fries stand packed side by side in one cone" },
    { who: "fb", with: "vik", from: 5.4, to: 5.7, reason: "the fry dives into Viking's open mouth: it touches his lips as it goes in" },
    { who: "fa", with: "fb", from: 5.4, to: 5.7, reason: "the diving fry passes just behind the fry in the cone on its way to Viking's mouth" },
    { who: "fb", with: "ket", from: 3.85, to: 10, reason: "the fry sits waist deep in the ketchup pot like a hot tub, its gloves on the rim" },
    { who: "fc", with: "may", from: 5.1, to: 10, reason: "the fry sits waist deep in the mayo pot, its gloves on the rim" },
    ...["fb", "fc"].map((f) => ({ who: f, with: "table", from: 3.8, to: 10, reason: "a fry sitting in a dip pot: its feet go down under the table top, hidden inside the pot" })),
    { who: "fa", with: "soup", from: 7.6, to: 10, reason: "the payoff: the fry stands upright in Reaper's tomato soup, its lower half in the soup" },
    { who: "fa", with: "table", from: 7.6, to: 10, reason: "the fry stands in the soup: its tiny feet go down through the bowl's bottom, hidden in the soup" },
    { who: "rea", with: "vik", from: 0, to: 10, reason: "shoulder to shoulder in the booth: Reaper's right glove rests on the table beside his soup and touches Viking's sleeve, never goes in" },
    { who: "fa", from: 7.25, to: 7.75, checks: ["lean-jump", "motion"], reason: "the backflip: the fry springs off the cone at full speed and turns a whole circle in 0.3 s, so its tip and stretch change fast inside the flip (take-off, apex, landing); a spring has no ease-in" },
    { who: "fa", from: 7.25, to: 7.7, checks: ["hand-pop"], reason: "the backflip: the gloves turn over with the whole body in the air" },
    { who: "vik", from: 1.0, to: 1.3, checks: ["face-covered"], reason: "the fries' cheer: the middle fry's glove passes in front of Viking's eyes for 0.1 s in the wide" },
    { who: "gsl", with: "salad", from: 6.0, to: 6.8, reason: "his glove pushes his salad bowl away" },
  ],
  notes: "Generated by storyboards/series/always-orders-potatoes/01-fries/make-fries.mjs. Panels: PANELS.md.",
});
