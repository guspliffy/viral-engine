// HOT POTATO, pilot of the deadly-cute game show (11 Nov 2026), from the clip template. Written by the director;
// builders made the props only (engine/page/props-hotpotato-set.js, props-hotpotato.js).
//   node storyboards/series/hot-potato/01-hot-potato/make-hot-potato.mjs -> hot-potato-01.json
//   (--staging: placeholder blocks instead of the builders' props, for the staging proof)
// Brief: Jonny's 10-panel sheet (panels-sheet.png next to this file; the original and his go are in
// /mnt/project-files/video-scripts/2026-11-11-hot-potato-game-show/). PANELS.md and NOTES.md next to this file.
//
// THE BRIEF (about 15 s; Spud, Dragon, the Wizard as host, Viking; a felt preschool-TV studio over a deep fryer)
//   Joke:        the sweetest kids' game show kills its losers, and the fireproof Dragon sneezes the coal into the host.
//   Wants:       Spud wants to be rid of the coal before the clock hits 0; the host wants a loser.
//   Consequence: whoever holds the coal at 0 drops through his tile into the fryer: Viking first, then the host.
//   Ending:      the fry basket lifts the host out golden and crispy, alive, waving: "See you next week, kids!"
//   Callback:    frame 0 the host beams at a player on a red tile; at the end the red tile is his own.
import { clip, write, r3, frame } from "../../../lib/clip.mjs";
import * as act from "../../../lib/acting.mjs";
import { ramp } from "../../../lib/camera.mjs";

const STAGING = process.argv.includes("--staging");
const c = clip({ faces: "strong", lines: { sub: true, blink: false } }), { A, sfx, see, cap } = c;

// ---------------------------------------------------------------- the studio (world metres; camera at +z)
// The stage top is at y S (the cast stand on it: cast `y`); the kitchen floor is y 0. Four trapdoor tiles in a row,
// TILE apart: Viking, Spud, Dragon, host (left to right, as on every panel). In front of the tiles an apron 0.85 m
// deep (the host walks along it to hand Spud the coal). The vat stands on the kitchen floor under and in front of the
// stage. Wall heights and the two master cameras were fitted to the panels' frame shares (NOTES.md).
const S = 1.2, TILE = 0.95;
const X = { vik: r3(-1.5 * TILE), spud: r3(-0.5 * TILE), drg: r3(0.5 * TILE), host: r3(1.5 * TILE) };
const FRONT = 1.45;                                  // the stage's front edge (z)
const WALL_Z = -2.7, SUN_Y = 5.05, CARD_Y = 3.95, SIGN_Y = 3.4;
const VAT = { z: 1.2, d: 2.9, w: 4.0, rim: 0.55, oil: 0.47 };
const TILE_COL = { vik: "#f6b8d0", spud: "#bfe8d0", drg: "#f9e7a0", host: "#d6c3f2" };
const H = { vik: 1.02, spud: 0.88, drg: 0.96, host: 1.0 };   // body heights

const YAW = { vik: 12, spud: 5, drg: -5, host: -12 };
const cast = [
  { id: "vik", character: "potatobrawl/viking", at: [X.vik, 0], y: S, face: YAW.vik, expr: "terrified", follow: 0.3, seed: 4.1 },
  { id: "spud", character: "potatobrawl/spud", at: [X.spud, 0], y: S, face: YAW.spud, expr: "shocked", follow: 0.3, seed: 2.9 },
  { id: "drg", character: "potatobrawl/dragon", at: [X.drg, 0], y: S, face: YAW.drg, expr: "kind", follow: 0.3, seed: 2.7 },
  { id: "host", character: "halloween/wizard-host", at: [X.host, 0], y: S, face: YAW.host, expr: "delighted", follow: 0.3, seed: 0.4 },
  { id: "crisp", character: "hot-potato/wizard-crispy", at: [30, -30], y: r3(S - 1.7), face: -4, expr: "delighted", follow: 0.3, seed: 0.4, hidden: true },
];

const block = (id, x, y, z, w, h, d) => ({ id, kind: "stoneblock", x, y, z, w, h, d, cap: 0 });
const tile = (who) => (STAGING ? block(`tile_${who}`, X[who], S, 0, 0.9, 0.02, 0.9) : { id: `tile_${who}`, kind: "hptile", x: X[who], y: S, z: 0, w: 0.9, color: TILE_COL[who], open: 0, hot: 0 });
// the coal's rest places: Viking's is in his gloves from frame 0 (the grab seats it); the game coal waits in the tongs
// (a cupped hold: the two gloves are body poses, LEG the height of a body's bottom over its feet; the coal's CENTRE sits
// 3 cm over the gloves' middles, between them)
// LEG and the hold heights were read off the layout (qa/peek.mjs): a glove at pose height up is at y S + LEG + up. The
// holds are at the belly, under each face (at 0.3 and up the coal covered mouths and eyes from the level cameras).
const LEG = { vik: 0.18, spud: 0.09, drg: 0.125, host: 0.1 }, UPS = { vik: 0.12, spud: 0.16, drg: 0.22, host: 0.1 }, FWD = 0.38;
const rotY = ([ox, oz], yaw) => { const a = (yaw * Math.PI) / 180; return [ox * Math.cos(a) + oz * Math.sin(a), -ox * Math.sin(a) + oz * Math.cos(a)]; };
const cupAt = (who, [x, z] = [X[who], 0], yaw = YAW[who], up = UPS[who]) => { const [dx, dz] = rotY([0, FWD], yaw); return [r3(x + dx), r3(S + LEG[who] + up + 0.03), r3(z + dz)]; };
const HAND0 = (who) => cupAt(who);
const PARK = [X.host, r3(S - 0.7), -1.5], STAGED = "parked under the stage, tiny, until the host conjures it";
const STAGED_T = "the host's hand follows the tongs (a hand-held carrier cannot carry the coal); parked tiny under the stage before and after";
const props = [
  ...(STAGING ? [
    block("studio", 0, 0, r3((WALL_Z + FRONT) / 2), 4.4, S, r3(FRONT - WALL_Z)),
    block("vat", 0, 0, VAT.z + 0.8, VAT.w, VAT.rim, 1.3),
    { ...block("coal0", HAND0("vik")[0], HAND0("vik")[1], HAND0("vik")[2], 0.18, 0.18, 0.18), staged: "in Viking's cupped gloves" },
    { ...block("coal", PARK[0], PARK[1], PARK[2], 0.18, 0.18, 0.18), scale: 0.001, staged: STAGED },
    { ...block("tongs", PARK[0], PARK[1], PARK[2], 0.05, 0.05, 0.5), scale: 0.001, staged: STAGED },
    block("lift", X.host, r3(S - 1.7), 0, 0.9, 0.04, 0.8),
  ] : [
    { id: "studio", kind: "hpstudio", x: 0, y: 0, z: 0, stageH: S, stageFront: FRONT, wallZ: WALL_Z, sunY: SUN_Y, cardY: CARD_Y, signY: SIGN_Y,
      tiles: [X.vik, X.spud, X.drg, X.host], num: 1, bump: 0, ring: 0, sing: 0 },
    { id: "vat", kind: "hpvat", x: 0, y: 0, z: VAT.z, w: VAT.w, d: VAT.d, h: VAT.rim, castLight: 0.6, haze: 0.35, churn: 0.25 },
    { id: "oil", kind: "fryoil", staged: "the oil in the vat", x: 0, y: VAT.oil, z: VAT.z, w: r3(VAT.w - 0.14), d: r3(VAT.d - 0.14) },
    { id: "coal0", kind: "hpcoal", x: HAND0("vik")[0], y: HAND0("vik")[1], z: HAND0("vik")[2], glow: 1, smoke: 0.6, staged: "in Viking's cupped gloves, then hanging over his hole for a beat" },
    { id: "coal", kind: "hpcoal", x: PARK[0], y: PARK[1], z: PARK[2], glow: 1, smoke: 0.6, scale: 0.001, staged: STAGED },
    { id: "tongs", kind: "hptongs", x: PARK[0], y: PARK[1], z: PARK[2], rot: -60, open: 0, scale: 0.001, staged: STAGED_T },
    { id: "bow", kind: "hpbowtie", wear: "host", x: 0, y: 0.41, z: 0.33, singe: 0 },
    { id: "bow2", kind: "hpbowtie", wear: "crisp", x: 0, y: 0.41, z: 0.33, singe: 1 },
    { id: "lift", kind: "hplift", x: X.host, y: r3(S - 1.7), z: 0, w: 0.9, d: 0.8, h: 0.42, pole: 3.0, drip: 0 },
    { id: "plume", kind: "fireplume", staged: "Dragon's sneeze of fire (an effect)", x: r3(X.drg + 0.3), y: r3(S + 0.46), z: 0.34, rot: 90, length: 0.95, width: 0.44, balls: 26 },
    { id: "confL", kind: "confetti", x: -2.0, y: r3(S + 1.6), z: 0.4, count: 60, spread: 1.3, up: 1.2, floor: 1.6, seed: 5 },
    { id: "confR", kind: "confetti", x: 2.0, y: r3(S + 1.6), z: 0.4, count: 60, spread: 1.3, up: 1.2, floor: 1.6, seed: 9 },
  ]),
  ...["vik", "spud", "drg", "host"].map(tile),
];
// keys propState doesn't start get a number at t 0, so their first tween eases instead of stepping
if (!STAGING) {
  for (const w of ["vik", "spud", "drg", "host"]) c.prop(0, `tile_${w}`, { hot: w === "vik" ? 1 : 0, open: 0 }, 0.01);
  c.prop(0, "studio", { bump: 0, ring: 0, sing: 0 }, 0.01); c.prop(0, "vat", { churn: 0.25 }, 0.01);
  c.prop(0, "plume", { on: 0, len: 0, fade: 0 }, 0.01); c.prop(0, "confL", { burst: 0 }, 0.01); c.prop(0, "confR", { burst: 0 }, 0.01);
  c.prop(0, "tongs", { open: 0 }, 0.01); c.prop(0, "lift", { drip: 0 }, 0.01); c.prop(0, "coal", { smoke: 0.6 }, 0.01);
}
const P_ = (t, id, set, dur, ease) => { if (!STAGING) c.prop(t, id, set, dur, ease); };   // a param the placeholders don't have

// ---------------------------------------------------------------- the clock (story seconds)
// One slow-motion ramp (the sneeze) stretches the video: story 7.95-8.7 plays at 0.3, so the video is about 1.75 s
// longer than the story from there on. Panel times are video seconds.
const T = {
  ding0: 0.72,     // the clock hits 0 for Viking: bell, his tile opens
  bye: 1.25,       // the host: "Bye-bye, Viking!"
  conjure: 1.7,    // the host conjures tongs with a fresh coal and walks along the apron
  give: 2.6,       // the coal goes into Spud's gloves: his tile turns red, the clock starts at 5
  hot: 3.0,        // "Hot! Hot!"
  throw1: 3.78,    // Spud throws it to Dragon
  lob: 5.05,       // Dragon lobs it back
  hurl: 6.62,      // clock 1: Spud hurls it high
  catch2: 7.3,     // Dragon catches it in front of his face
  choo: 8.02,      // the sneeze
  land: 8.42,      // the coal lands in the host's gloves: his tile turns red
  ding1: 9.15,     // the clock hits 0 for the host
  rise: 10.25,     // the fry basket rises
  bye2: 10.95,     // "See you next week, kids!"
  again: 11.85,    // Dragon's nose wrinkles again
};
T.c5 = r3(T.give + 0.05); T.tick = 0.95;
const tickAt = (n) => r3(T.c5 + (5 - n) * T.tick);   // the second n starts (5 .. 1)
const RAMP = { at: 7.95, len: 0.55, rate: 0.3 };
const END = 12.65;

// ---------------------------------------------------------------- text and the game's sounds
// subtitles sit between the sign and the heads, the one free strip in every shot (qa/camfit.mjs; the low band is the
// stage and the vat): y 800 on the wides, 672 on the mediums and Spud's close shot (their cameras are level or look
// down a little, which opens that strip). Dragon's close shot has no free strip (his wings): no line there
const subPos = (t) => (t < r3(T.give - 0.45) || t >= RAMP.at - 0.04 ? 800 : 672);
const say = (t, who, line, dur, tone, sub, o = {}) => c.say(t, who, line, dur, tone, { voice: false, sub, pos: subPos(t), ...o });
const num = (t, n) => { P_(t, "studio", { num: n }, 0.01, "linear"); P_(t, "studio", { bump: 1 }, 0.08, "out"); P_(r3(t + 0.1), "studio", { bump: 0 }, 0.25, "inOut"); };
const hot = (t, who) => { for (const w of ["vik", "spud", "drg", "host"]) P_(t, `tile_${w}`, { hot: w === who ? 1 : 0 }, 0.1, "out"); if (who) sfx(t, "click", { gain: 0.35, reason: `the red light jumps to ${who}'s tile` }); };
const bell = (t) => { P_(t, "studio", { ring: 1 }, 0.06, "out"); P_(r3(t + 0.5), "studio", { ring: 0 }, 0.3, "inOut"); sfx(t, "bell", { gain: 0.7, reason: "0: the sun clock's bell" }); };
sfx(0, "bubbling", { dur: END, gain: 0.2, reason: "the fryer bubbling under the stage, the whole clip" });

// ---------------------------------------------------------------- holding, throwing and catching the coal
// Both gloves cupped at the belly (body poses, 0.29 apart: a 0.2 coal between them). The coal is thrown to the point
// between the gloves and taken there by both hands as it is (keep): from then on it moves with them.
const cup = (who) => ({ R: { x: [-0.145, UPS[who], FWD] }, L: { x: [0.145, UPS[who], FWD] } });
const ready = (t, who, dur = 0.3) => { c.arm(t, who, "R", cup(who).R, dur, "inOut"); c.arm(t, who, "L", cup(who).L, dur, "inOut"); A(t, who, "grip", { side: "both", shape: "cup", dur: 0.15 }); };
// (a hair after the flight ends: at the same instant the float sum can still read as in flight, and the grab then
// blends from the thrower's hand, a 1 m pop). The grip seats the coal's middle 3 cm over the point between the gloves,
// wherever the throw's aim left it by a centimetre or two.
const take = (t, who, prop = "coal") => A(r3(t + 0.01), who, "grab", { prop, hand: "both", grip: [0, -0.03, 0], pose: null, dur: 0 });
// a throw is a glide from the hand to `to` (no physics bodies in this clip: a body bounced off the thrower): straight
// in time, `arc` metres high in the middle
const toss = (t, who, to, dur, arc = 0.25, after = { R: { x: [-0.3, 0.62, 0.3] }, L: { x: [0.3, 0.62, 0.3] } }) => {
  A(t, who, "release", { prop: "coal", to, dur, arc, ease: "linear" });
  c.arm(t, who, "L", after.L, 0.2, "out"); c.arm(t, who, "R", after.R, 0.2, "out");
  A(t, who, "grip", { side: "both", shape: "open", dur: 0.1 });
  sfx(t, "whoosh", { gain: 0.3, reason: `${who} throws the coal` });
};

for (const w of ["vik", "spud", "drg", "host", "crisp"]) A(0, w, "noblink");
act.blinksAt(c, "spud", [2.3, 9.9]); act.blinksAt(c, "drg", [2.35, 6.0]); act.blinksAt(c, "host", [2.4, 6.05]);

// ---------------------------------------------------------------- 01 FRAME 0 (0-0.72): Viking, the coal, the red tile, the clock at 1
c.arm(0, "vik", "R", cup("vik").R, 0); c.arm(0, "vik", "L", cup("vik").L, 0); A(0, "vik", "grip", { side: "both", shape: "cup", dur: 0 });
A(0, "vik", "look", { to: [0, -0.6], dur: 0, blink: false });
A(0, "vik", "expr", { expr: "terrified", set: { open: 0.35, curve: -0.6 }, dur: 0 }); A(0, "vik", "face", { brow: 0.6, lid: 0.35, dur: 0 });
for (let k = 0; k < 3; k++) A(r3(0.05 + k * 0.2), "vik", "squash", { amount: 0.04, dur: 0.18 });   // he shakes
c.at(0.02, { fx: "sweat", who: "vik", dur: 0.7 });
for (const s of ["R", "L"]) { c.arm(0, "spud", s, { x: [s === "R" ? -0.07 : 0.07, 0.24, 0.36] }, 0); c.arm(0, "drg", s, { x: [s === "R" ? -0.08 : 0.08, 0.26, 0.37] }, 0); }
A(0, "spud", "look", { to: [-0.7, -0.1], dur: 0, blink: false }); A(0, "spud", "expr", { expr: "shocked", set: { open: 0.3 }, dur: 0 });
A(0, "drg", "look", { to: [-0.7, -0.1], dur: 0, blink: false }); A(0, "drg", "expr", { expr: "shocked", set: { open: 0.15, eye: 1.15 }, dur: 0 });
// the host: arms spread, beaming at us; his line opens the clip on a voice
c.arm(0, "host", "R", { x: [-0.2, 0.16, 0.3] }, 0); c.arm(0, "host", "L", { o: [0.3, 0.62, 0.12] }, 0);   // one arm out, one presenting the players
A(0, "host", "grip", { side: "both", shape: "open", dur: 0 });
A(0, "host", "expr", { expr: "delighted", set: { curve: 0.9, open: 0.45 }, dur: 0 });
say(0.02, "host", "hot potato!", 0.6, "excited", "HOT POTATO!");
sfx(0.02, "timer-beep", { gain: 0.4, reason: "the clock's last second ticking for Viking" });
see(0, 0.7, ["vik.face", "spud.face", "drg.face", "host.face", "coal0"], "frame 0: Viking with the coal on the red tile, the others watching, the host beaming");

// ---------------------------------------------------------------- 02 THE RULE (0.72-1.7): 0, his tile opens, he drops
num(T.ding0, 0); bell(T.ding0);
P_(r3(T.ding0 + 0.04), "tile_vik", { open: 1 }, 0.12, "in");
sfx(r3(T.ding0 + 0.04), "latch", { gain: 0.6, reason: "Viking's trapdoor tile drops open" });
A(r3(T.ding0 + 0.02), "vik", "expr", { expr: "terrified", set: { open: 0.75, curve: -0.3 }, dur: 0.06 });
// he lets go: the coal hangs a beat over the hole and falls in after him
c.prop(r3(T.ding0 + 0.3), "coal0", { x: X.vik, y: r3(S - 1.1), z: 0.12 }, 0.3, "in"); c.prop(r3(T.ding0 + 0.6), "coal0", { scale: 0.001 }, 0.02, "in");
for (const s of ["R", "L"]) c.arm(r3(T.ding0 + 0.04), "vik", s, "up", 0.16, "out");
A(r3(T.ding0 + 0.04), "vik", "grip", { side: "both", shape: "open", dur: 0.08 });
A(r3(T.ding0 + 0.07), "vik", "drop", { to: r3(S - 1.55), dur: 0.36 });
A(r3(T.ding0 + 0.45), "vik", "hide"); A(r3(T.ding0 + 0.46), "vik", "move", { to: [-6, -6], dur: 0, ease: "linear", steps: 0 });
sfx(r3(T.ding0 + 0.08), "whoosh", { gain: 0.35, reason: "Viking falls through his tile" });
P_(r3(T.ding0 + 0.05), "confL", { burst: 1 }, 2.4, "linear"); P_(r3(T.ding0 + 0.05), "confR", { burst: 1 }, 2.4, "linear");
sfx(r3(T.ding0 + 0.05), "partyhorn", { gain: 0.45, reason: "confetti and a party horn for the loser" });
sfx(r3(T.ding0 + 0.5), "splash", { gain: 0.6, reason: "under the stage: the splash into the fryer" });
sfx(r3(T.ding0 + 0.6), "sizzle", { gain: 0.55, reason: "the sizzle" });
P_(r3(T.ding0 + 0.5), "vat", { churn: 0.4 }, 0.25, "out"); P_(r3(T.ding0 + 1.5), "vat", { churn: 0.25 }, 0.8, "inOut");
// Spud and Dragon stare down at the hole; the host claps his cheeks
for (const w of ["spud", "drg"]) { A(r3(T.ding0 + 0.12), w, "look", { to: [-0.75, -0.7], dur: 0.12, blink: false }); A(r3(T.ding0 + 0.15), w, "expr", { expr: "terrified", set: { open: 0.4 }, dur: 0.15 }); A(r3(T.ding0 + 0.15), w, "squash", { amount: 0.06, dur: 0.25 }); }
for (const s of ["R", "L"]) c.arm(r3(T.ding0 + 0.15), "host", s, "cheeks", 0.3, "inOut");
A(r3(T.ding0 + 0.2), "host", "look", { to: [-0.6, -0.3], dur: 0.15, blink: false });
say(T.bye, "host", "aww! bye-bye viking!", 0.55, "excited", "Bye-bye, Viking!");
P_(r3(T.bye + 0.2), "tile_vik", { open: 0 }, 0.25, "inOut"); hot(r3(T.bye + 0.2), null);
see(T.ding0, r3(T.ding0 + 0.4), ["vik", "tile_vik"], "the rule: at 0 the red tile opens under whoever holds the coal");

// ---------------------------------------------------------------- 03 A FRESH COAL (1.7-3.0): the host conjures it and brings it to Spud
// He steps along the apron to in front of the gap between Spud and Dragon, tongs out toward Spud, and sets the coal
// in Spud's cupped gloves; then (off screen, on Spud's close shot) the tongs go and he walks back to his tile.
// The tongs move on their own tweens (the coal rides them: a carry follows a prop's tween, never a hand) and the host's
// hand follows their handle. They stay level (the carry offset ignores a tip).
const GIVE_AT = [0.42, 0.88], GIVE_YAW = -72, APRON = [1.2, 0.75], SPUD_GIVE = 35;
const C_GIVE = cupAt("spud", [X.spud, 0], SPUD_GIVE);
const dirOf = (rot) => [Math.sin((rot * Math.PI) / 180), Math.cos((rot * Math.PI) / 180)];
const ROT_GIVE = r3((Math.atan2(C_GIVE[0] - GIVE_AT[0], C_GIVE[2] - GIVE_AT[1]) * 180) / Math.PI), ROT0 = -60;
// the walk: two straight legs at one speed, the turn spread over both; the tongs' handle stays at the same place
// beside his body all the way (HANDLE, in his frame), and comes to the give exactly
const WALK = { t0: r3(T.conjure + 0.1), l1: 0.36, l2: 0.38 }, HANDLE = [-0.2, 0.32], TONG_Y = 1.7;
const walkAt = (u) => { const t = u * (WALK.l1 + WALK.l2), k = t < WALK.l1 ? t / WALK.l1 : (t - WALK.l1) / WALK.l2, [a, b] = t < WALK.l1 ? [[X.host, 0], APRON] : [APRON, GIVE_AT]; return { at: [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k], yaw: YAW.host + (GIVE_YAW - YAW.host) * u }; };
const K_GIVE = (() => { const [dx, dz] = dirOf(ROT_GIVE); return { x: r3(C_GIVE[0] - 0.5 * dx), y: C_GIVE[1], z: r3(C_GIVE[2] - 0.5 * dz), rot: ROT_GIVE }; })();
const tongsAt = (u) => {
  const w = walkAt(u), [hx, hz] = rotY(HANDLE, w.yaw), rot = ROT0 + (ROT_GIVE - ROT0) * u, [dx, dz] = dirOf(rot);
  const nom = { x: w.at[0] + hx - 0.13 * dx, y: TONG_Y, z: w.at[1] + hz - 0.13 * dz }, e = u * u;
  return { x: r3(nom.x + (K_GIVE.x - nom.x) * e), y: r3(nom.y + (K_GIVE.y - nom.y) * e), z: r3(nom.z + (K_GIVE.z - nom.z) * e), rot: r3(rot) };
};
const K0 = tongsAt(0);
const K3 = (() => { const [dx, dz] = dirOf(ROT_GIVE); return { x: r3(K_GIVE.x - 0.1 * dx), y: K_GIVE.y, z: r3(K_GIVE.z - 0.1 * dz), rot: ROT_GIVE }; })();   // drawn back after the give
c.arm(r3(T.conjure - 0.25), "host", "L", "rest", 0.3, "inOut");
c.arm(r3(T.conjure - 0.25), "host", "R", { x: [-0.2, 0.44, 0.32] }, 0.22, "inOut");
c.at(r3(T.conjure - 0.04), { do: "prop", id: "tongs", set: K0, dur: 0.01, ease: "linear" });
c.at(r3(T.conjure - 0.03), { do: "carry", prop: "coal", by: "tongs", off: [0, 0, 0.5] });
c.arm(r3(T.conjure - 0.02), "host", "R", { prop: "tongs", grip: "hold", palm: [0, 0, 0.13] }, 0.04);
A(r3(T.conjure - 0.02), "host", "grip", { side: "R", shape: "clasp", dur: 0.05 });
c.at(T.conjure, { do: "prop", id: "tongs", set: { scale: 1 }, dur: 0.08, ease: "back" }); c.at(T.conjure, { do: "prop", id: "coal", set: { scale: 1 }, dur: 0.08, ease: "back" });
c.at(T.conjure, { fx: "poof", who: "host", dur: 0.35 });
sfx(T.conjure, "poof", { gain: 0.5, reason: "the host conjures tongs with a fresh glowing coal" });
A(r3(T.conjure + 0.02), "host", "look", { to: [-0.7, -0.1], dur: 0.12, blink: false });
A(WALK.t0, "host", "turn", { to: GIVE_YAW, dur: r3(WALK.l1 + WALK.l2), ease: "linear" });
A(WALK.t0, "host", "move", { to: APRON, dur: WALK.l1, steps: 2, ease: "linear" });   // out onto the apron, clear of Dragon
A(r3(WALK.t0 + WALK.l1), "host", "move", { to: GIVE_AT, dur: WALK.l2, steps: 2, ease: "linear" });
{ const N = 6, d = (WALK.l1 + WALK.l2) / N; for (let i = 1; i <= N; i++) c.prop(r3(WALK.t0 + (i - 1) * d), "tongs", tongsAt(i / N), r3(d), "linear"); }
// Dragon makes room: arms down, a little lean back, eyes on the coal going past
for (const [s, x] of [["R", -0.22], ["L", 0.22]]) c.arm(r3(T.conjure + 0.05), "drg", s, { x: [x, 0.1, 0.12] }, 0.3, "inOut");
A(r3(T.conjure + 0.1), "drg", "pitch", { to: -5, dur: 0.3 }); A(r3(T.conjure + 0.1), "drg", "look", { to: [0.3, -0.1], dur: 0.12, blink: false });
A(r3(T.conjure + 0.5), "drg", "look", { to: [-0.5, -0.2], dur: 0.15, blink: false });
A(r3(T.hot + 0.4), "drg", "pitch", { to: 0, dur: 0.3 });
A(r3(T.give - 0.3), "host", "pitch", { to: 8, dur: 0.25 });   // he leans in
A(r3(T.give - 0.55), "spud", "turn", { to: SPUD_GIVE, dur: 0.3, ease: "inOut" });
ready(r3(T.give - 0.5), "spud", 0.35);
A(r3(T.give - 0.6), "spud", "look", { to: [0.5, 0.1], dur: 0.12, blink: false });
A(r3(T.give - 0.4), "spud", "expr", { expr: "shocked", set: { open: 0.2, eye: 1.2 }, dur: 0.2 });
A(r3(T.give - 0.15), "spud", "look", { to: [0.15, -0.5], dur: 0.12, blink: false });
P_(r3(T.give - 0.05), "tongs", { open: 1 }, 0.12, "out");
c.at(T.give, { do: "carry", prop: "coal" });
take(T.give, "spud");
hot(T.give, "spud"); num(T.c5, 5);
sfx(T.c5, "timer-beep", { gain: 0.45, reason: "the clock starts: 5" });
see(r3(T.give - 0.2), r3(T.give + 0.4), ["spud.face", "host.face", "coal"], "the fresh coal goes from the tongs into Spud's gloves; his tile turns red");
// he steps back along the apron at once, the tongs with him: by Spud's close shot (T.hot) they are out of its frame,
// and poof away there; he is back on his tile, gloves together at his belly, before the first throw
const BACK = { t0: r3(T.give + 0.12), l1: 0.4, l2: 0.4, via: [1.35, 0.95] };
c.prop(BACK.t0, "tongs", { x: 0.83, y: 1.62, z: 1.0, rot: -100 }, 0.3, "inOut");
A(r3(T.give + 0.1), "host", "pitch", { to: 0, dur: 0.25 });
A(r3(T.give + 0.12), "spud", "turn", { to: YAW.spud, dur: 0.28, ease: "inOut" });
A(BACK.t0, "host", "move", { to: BACK.via, dur: BACK.l1, steps: 2, ease: "linear" });
A(r3(BACK.t0 + BACK.l1), "host", "move", { to: [X.host, 0], dur: BACK.l2, steps: 2, ease: "linear" });
A(r3(BACK.t0 + 0.2), "host", "turn", { to: YAW.host, dur: 0.6, ease: "inOut" });
c.at(r3(T.hot + 0.05), { do: "prop", id: "tongs", set: { scale: 0.001 }, dur: 0.05, ease: "in" });
c.at(r3(T.hot + 0.11), { do: "prop", id: "tongs", set: { x: PARK[0], y: PARK[1], z: PARK[2] }, dur: 0.01, ease: "linear" });
ready(r3(T.hot + 0.08), "host", 0.3);   // gloves together at his belly: the coal will land in them
A(r3(T.hot + 0.3), "host", "look", { to: [-0.6, -0.1], dur: 0.12, blink: false });

// ---------------------------------------------------------------- "HOT! HOT!" (3.0-3.6): it burns
A(T.hot, "spud", "look", { to: [0, -0.6], dur: 0.1, blink: false });
A(T.hot, "spud", "expr", { expr: "terrified", set: { open: 0.6, curve: -0.4 }, dur: 0.12 }); A(T.hot, "spud", "face", { brow: 0.6, dur: 0.12 });
for (let k = 0; k < 3; k++) A(r3(T.hot + 0.04 + k * 0.18), "spud", "squash", { amount: 0.07, dur: 0.16 });
say(r3(T.hot + 0.03), "spud", "hot! hot! hot!", 0.5, "excited", "HOT! HOT! HOT!");
sfx(T.hot, "sizzle", { gain: 0.4, reason: "the coal sizzling in Spud's gloves" });
c.at(r3(T.hot + 0.05), { fx: "sweat", who: "spud", dur: 0.6 });
see(T.hot, r3(T.hot + 0.5), ["spud.face", "coal"], "it burns his gloves");

// ---------------------------------------------------------------- 04 THE PASS (3.6-4.5): Spud throws it to Dragon, who is fireproof
num(tickAt(4), 4); sfx(tickAt(4), "timer-beep", { gain: 0.45, reason: "the clock: 4" });
A(r3(T.throw1 - 0.3), "spud", "look", { to: [0.7, 0], dur: 0.1, blink: false });
A(r3(T.throw1 - 0.25), "drg", "look", { to: [-0.6, 0], dur: 0.12, blink: false });
A(r3(T.throw1 - 0.2), "drg", "expr", { expr: "eager", set: { open: 0.4, curve: 0.6 }, dur: 0.15 });
// Dragon takes it on one open palm (his right, toward Spud), the other arm out
// (out beside his body, in the gap to Spud: an arm across his own face hid his eyes)
const PALM = { x: [-0.4, 0.42, 0.3], palm: [-0.4, 1.5, 0.3] };
const palmAt = (who) => [r3(X[who] - 0.4), r3(S + LEG[who] + 0.42 + 0.15), 0.28];   // the coal's centre over the open palm
c.arm(r3(T.throw1 - 0.2), "drg", "R", PALM, 0.3, "inOut"); A(r3(T.throw1 - 0.2), "drg", "grip", { side: "R", shape: "flat", dur: 0.15 });
c.arm(r3(T.throw1 - 0.2), "drg", "L", { o: [0.15, 0.6, 0.2] }, 0.3, "inOut");
A(r3(T.throw1 - 0.02), "spud", "expr", { expr: "terrified", set: { open: 0.3, eye: 0.3, curve: -0.5 }, dur: 0.1 });
toss(T.throw1, "spud", palmAt("drg"), 0.3, 0.2);
A(r3(T.throw1 + 0.31), "drg", "grab", { prop: "coal", hand: "R", grip: "below", pose: null, dur: 0 });
hot(r3(T.throw1 + 0.3), "drg");
sfx(r3(T.throw1 + 0.3), "pat", { gain: 0.4, reason: "the coal lands on Dragon's palm" });
see(r3(T.throw1 - 0.1), r3(T.throw1 + 0.4), ["spud.face", "drg.face", "coal"], "Spud throws the coal to Dragon");

// ---------------------------------------------------------------- 05 FIREPROOF (4.1-5.0): Dragon enjoys it; Spud blows on his gloves
c.arm(r3(T.throw1 + 0.38), "drg", "R", { x: [-0.42, 0.78, 0.2], palm: [-0.42, 1.9, 0.2] }, 0.4, "inOut");   // up beside his head like a beach ball
A(r3(T.throw1 + 0.4), "drg", "look", { to: [-0.45, 0.45], dur: 0.12, blink: false });
A(r3(T.throw1 + 0.45), "drg", "expr", { expr: "delighted", set: { curve: 0.9, open: 0.5 }, dur: 0.2 }); A(r3(T.throw1 + 0.45), "drg", "face", { lid: 0.75, dur: 0.2 });
say(r3(T.throw1 + 0.55), "drg", "ooh! warm!", 0.5, "excited", "Ooh, cosy!");
for (const [s, x] of [["R", -0.08], ["L", 0.08]]) c.arm(r3(T.throw1 + 0.5), "spud", s, { x: [x, 0.36, 0.36] }, 0.35, "inOut");   // gloves up under his mouth
A(r3(T.throw1 + 0.5), "spud", "look", { to: [0, -0.4], dur: 0.12, blink: false });
A(r3(T.throw1 + 0.6), "spud", "expr", { expr: "sad", set: { pucker: 0.6, open: 0.2 }, dur: 0.2 }); A(r3(T.throw1 + 0.6), "spud", "face", { lid: 0.8, brow: 0.3, dur: 0.2 });
for (const t of [0.75, 1.05]) sfx(r3(T.throw1 + t), "blow", { gain: 0.35, dur: 0.22, reason: "Spud blows on his burnt gloves" });
num(tickAt(3), 3); sfx(tickAt(3), "timer-beep", { gain: 0.45, reason: "the clock: 3" });
see(r3(T.throw1 + 0.6), r3(T.lob - 0.1), ["drg.face", "spud.face", "coal"], "the coal doesn't hurt Dragon; Spud nurses his gloves");

// ---------------------------------------------------------------- THE LOB BACK (5.05-6.2): Dragon lobs it back; Spud juggles it
A(r3(T.lob - 0.45), "drg", "look", { to: [-0.6, 0], dur: 0.12, blink: false });
A(r3(T.lob - 0.4), "drg", "face", { lid: 0.1, dur: 0.15 });
c.arm(r3(T.lob - 0.35), "drg", "R", { x: [-0.4, 0.3, 0.32], palm: [-0.4, 1.4, 0.32] }, 0.25, "inOut");   // down for the underarm swing
A(r3(T.lob - 0.3), "spud", "look", { to: [0.65, 0.1], dur: 0.1, blink: false });
A(r3(T.lob - 0.25), "spud", "expr", { expr: "terrified", set: { open: 0.5 }, dur: 0.12 }); A(r3(T.lob - 0.25), "spud", "face", { lid: 0, brow: 0.6, dur: 0.12 });
say(r3(T.lob - 0.02), "spud", "no no no!", 0.4, "excited", "No no no!");
ready(r3(T.lob - 0.15), "spud", 0.3);
A(T.lob, "drg", "release", { prop: "coal", to: cupAt("spud"), dur: 0.4, arc: 0.35, ease: "linear" });
c.arm(T.lob, "drg", "R", { x: [-0.42, 0.62, 0.3] }, 0.22, "out"); c.arm(r3(T.lob + 0.5), "drg", "R", { x: [-0.22, 0.1, 0.12] }, 0.4, "inOut"); c.arm(r3(T.lob + 0.5), "drg", "L", { x: [0.22, 0.1, 0.12] }, 0.4, "inOut");   // low: the next shot looks up at them
sfx(T.lob, "whoosh", { gain: 0.25, reason: "Dragon lobs the coal back" });
take(r3(T.lob + 0.4), "spud");
hot(r3(T.lob + 0.4), "spud");
num(tickAt(2), 2); sfx(tickAt(2), "timer-beep", { gain: 0.5, reason: "the clock: 2" });
A(r3(T.lob + 0.42), "spud", "look", { to: [0, -0.6], dur: 0.08, blink: false });
A(r3(T.lob + 0.42), "spud", "expr", { expr: "terrified", set: { open: 0.65, curve: -0.4 }, dur: 0.1 });
for (let k = 0; k < 4; k++) A(r3(T.lob + 0.46 + k * 0.17), "spud", "squash", { amount: 0.07, dur: 0.15 });
sfx(r3(T.lob + 0.45), "sizzle", { gain: 0.4, reason: "the coal sizzling in Spud's gloves again" });
A(r3(T.lob + 0.5), "drg", "expr", { expr: "happy", set: { curve: 0.6 }, dur: 0.2 });
see(T.lob, r3(T.lob + 0.6), ["spud.face", "drg.face", "coal"], "Dragon lobs it back: the coal is Spud's again");

// ---------------------------------------------------------------- 06 THE FAKE-OUT (6.2-7.0): clock 1, Spud hurls it high; the host leans in
num(tickAt(1), 1); sfx(tickAt(1), "timer-beep", { gain: 0.6, reason: "the clock: 1" });
say(r3(tickAt(1) - 0.05), "host", "one!", 0.3, "excited", "ONE!");   // (its subtitle ends on the cut to Dragon's close shot)
A(r3(tickAt(1) - 0.3), "host", "pitch", { to: 7, dur: 0.3 });
A(r3(tickAt(1) - 0.3), "host", "look", { to: [-0.7, -0.1], dur: 0.12, blink: false });
A(r3(tickAt(1) - 0.25), "host", "expr", { expr: "evil", set: { curve: 0.85, open: 0.25 }, dur: 0.2 });
A(r3(tickAt(1) + 0.02), "spud", "look", { to: [0.1, 0.8], dur: 0.08, blink: false });
A(r3(T.hurl - 0.1), "spud", "crouch", { to: 0.12, dur: 0.1 });
A(T.hurl, "spud", "crouch", { to: 0, dur: 0.1 });
// high over to Dragon, who catches it right in front of his face
const FACE_AT = cupAt("drg");
toss(T.hurl, "spud", FACE_AT, r3(T.catch2 - T.hurl), 0.75, { R: "up", L: "up" });
A(T.hurl, "spud", "expr", { expr: "terrified", set: { open: 0.8 }, dur: 0.08 }); A(T.hurl, "spud", "face", { brow: 0.7, lid: 0, dur: 0.08 });
A(r3(T.hurl + 0.02), "spud", "hop", { count: 1, height: 0.12, dur: 0.3 });
hot(r3(T.hurl + 0.02), null);
see(r3(T.hurl - 0.3), r3(T.hurl + 0.3), ["spud.face", "host.face"], "clock 1: Spud hurls the coal high, the host leaning in for his loser");

// ---------------------------------------------------------------- 07 SMOKE (7.0-7.95): Dragon catches it under his nose; the smoke goes up it
A(r3(T.hurl + 0.1), "drg", "look", { to: [-0.3, 0.8], dur: 0.12, blink: false });
ready(r3(T.catch2 - 0.4), "drg", 0.35);
take(T.catch2, "drg");
hot(T.catch2, "drg");
sfx(T.catch2, "pat", { gain: 0.45, reason: "Dragon catches the coal in both gloves" });
A(r3(T.catch2 + 0.02), "drg", "look", { to: [0, -0.55], dur: 0.1, blink: false });
P_(T.catch2, "coal", { smoke: 1 }, 0.2, "out");
A(r3(T.catch2 + 0.15), "drg", "expr", { expr: "focused", set: { pucker: 0.5, open: 0.1, eye: 1.15 }, dur: 0.2 }); A(r3(T.catch2 + 0.15), "drg", "face", { brow: -0.3, tilt: 0.3, dur: 0.2 });
A(r3(T.catch2 + 0.2), "drg", "look", { to: [0, 0.1], dur: 0.2, blink: false });   // eyes cross toward his nose
sfx(r3(T.catch2 + 0.25), "gasp", { gain: 0.5, reason: "ah... (the smoke goes up Dragon's nose)" });
A(r3(T.catch2 + 0.3), "drg", "pitch", { to: -8, dur: 0.3, ease: "inOut" });
// Dragon turns away from Spud as the sneeze builds: toward the host
A(r3(T.catch2 + 0.42), "drg", "turn", { to: 42, dur: 0.24, ease: "inOut" });
A(r3(T.catch2 + 0.44), "drg", "pitch", { to: -15, dur: 0.2, ease: "inOut" });
A(r3(T.catch2 + 0.44), "drg", "expr", { expr: "focused", set: { pucker: 0.3, open: 0.5, eye: 0.5 }, dur: 0.15 });
// Spud sees it coming and ducks (done before the slow motion)
A(r3(T.catch2 + 0.3), "spud", "look", { to: [0.7, 0.1], dur: 0.1, blink: false });
A(r3(T.catch2 + 0.36), "spud", "move", { to: [r3(X.spud - 0.34), 0], dur: 0.26, steps: 1 });   // a step away, onto Viking's old tile
A(r3(T.catch2 + 0.42), "spud", "crouch", { to: 0.3, dur: 0.2 });
for (const [s, x] of [["R", -0.14], ["L", 0.14]]) c.arm(r3(T.catch2 + 0.38), "spud", s, { x: [x, 0.92, 0.12] }, 0.24, "inOut");   // gloves over his head
A(r3(T.catch2 + 0.45), "spud", "expr", { expr: "terrified", set: { eye: 0.2, open: 0.2 }, dur: 0.12 });
see(r3(T.catch2 + 0.05), r3(T.catch2 + 0.4), ["drg.face", "coal"], "the smoke goes up Dragon's nose");

// ---------------------------------------------------------------- 08 THE SNEEZE (7.95-8.7, slow motion): the fire carries the coal into the host's gloves
ramp(c, RAMP.at, RAMP.len, RAMP.rate, { in: 0.12, out: 0.2 });
const HOST_CUP = cupAt("host");
say(r3(RAMP.at - 0.03), "drg", "choo!", 0.03, "excited", "CHOO!");   // (before the ramp: a line inside one is off its voice; its subtitle runs through the slow motion)
A(T.choo, "drg", "pitch", { to: 13, dur: 0.07, ease: "out" });
A(T.choo, "drg", "expr", { expr: "focused", set: { pucker: 0, open: 0.75, eye: 0.1 }, dur: 0.05 });
A(T.choo, "drg", "squash", { amount: 0.12, dur: 0.3 });
A(r3(T.choo + 0.01), "drg", "release", { prop: "coal", to: HOST_CUP, dur: r3(T.land - T.choo - 0.01), ease: "out" });
for (const [s, x] of [["R", -0.3], ["L", 0.3]]) c.arm(r3(T.choo + 0.01), "drg", s, { x: [x, 0.5, 0.3] }, 0.1, "out");
P_(T.choo, "plume", { on: 1 }, 0.04, "out"); P_(T.choo, "plume", { len: 1 }, r3(T.land - T.choo), "out");
P_(r3(T.land + 0.05), "plume", { fade: 1 }, 0.4, "inOut");
sfx(T.choo, "blow", { gain: 0.6, dur: 0.35, reason: "CHOO: Dragon's sneeze" });
sfx(r3(T.choo - 0.02), "ai/flare", { gain: 1.4, reason: "the sneeze is fire: a big fwoomp" });
sfx(r3(T.choo + 0.05), "flamejet", { gain: 0.5, reason: "the jet of fire carrying the coal across the stage" });
c.at(T.choo, { fx: "shake", amp: 0.03, dur: 0.4 });
c.at(T.choo, { fx: "speedlines", dur: r3(T.land - T.choo), who: "drg" });
c.at(r3(T.choo + 0.05), { do: "hat", who: "host", off: [0.16, 0.1, -0.12], spin: [0, 0, -24], dur: 0.3, ease: "out" });   // blown back
take(T.land, "host");
hot(T.land, "host");
A(r3(T.land - 0.18), "host", "look", { to: [-0.4, -0.3], dur: 0.1, blink: false });
sfx(T.land, "pat", { gain: 0.5, reason: "the coal lands in the host's gloves" });
A(r3(T.land - 0.02), "host", "pitch", { to: -6, dur: 0.1 });
A(T.land, "host", "expr", { expr: "delighted", set: { curve: 0.9, open: 0.05 }, dur: 0.05 }); A(T.land, "host", "face", { brow: 0.5, lid: 0, dur: 0.08 });   // the smile stays, frozen
see(T.choo, T.land, ["drg.face", "host.face", "coal"], "the sneeze: fire carries the coal from Dragon to the host");

// ---------------------------------------------------------------- 09 THE HOST'S TILE (8.7-10.2): frozen smile, a look down, 0, he drops
A(r3(RAMP.at + RAMP.len + 0.02), "drg", "turn", { to: YAW.drg, dur: 0.35, ease: "inOut" });
A(r3(RAMP.at + RAMP.len + 0.02), "drg", "pitch", { to: 0, dur: 0.3 });
A(r3(RAMP.at + RAMP.len + 0.05), "drg", "expr", { expr: "kind", set: { curve: 0.1 }, dur: 0.25 }); A(r3(RAMP.at + RAMP.len + 0.05), "drg", "face", { brow: 0, tilt: 0, lid: 0.1, dur: 0.25 });
A(r3(RAMP.at + RAMP.len + 0.05), "spud", "crouch", { to: 0, dur: 0.3 });
for (const [s, x] of [["R", -1], ["L", 1]]) { c.arm(r3(RAMP.at + RAMP.len + 0.05), "spud", s, { x: [0.36 * x, 0.6, 0.12] }, 0.2, "inOut"); c.arm(r3(RAMP.at + RAMP.len + 0.25), "spud", s, { x: [0.07 * x, 0.24, 0.36] }, 0.25, "inOut"); }
A(r3(RAMP.at + RAMP.len + 0.1), "spud", "move", { to: [X.spud, 0], dur: 0.3, steps: 1 });   // back onto his tile   // down round his face, not across it
A(r3(RAMP.at + RAMP.len + 0.1), "spud", "look", { to: [0.75, -0.05], dur: 0.12, blink: false });
A(r3(RAMP.at + RAMP.len + 0.15), "spud", "expr", { expr: "shocked", set: { open: 0.3 }, dur: 0.2 });
A(r3(T.land + 0.25), "host", "look", { to: [0, -0.85], dur: 0.14, blink: false });   // down at his own red tile
c.at(r3(T.land + 0.3), { fx: "sweat", who: "host", dur: 0.5 });
say(r3(T.land + 0.32), "host", "uh-oh.", 0.3, "calm", "Uh-oh.");
num(T.ding1, 0); bell(T.ding1);
P_(r3(T.ding1 + 0.04), "tile_host", { open: 1 }, 0.12, "in");
sfx(r3(T.ding1 + 0.04), "latch", { gain: 0.6, reason: "the host's trapdoor tile drops open" });
A(r3(T.ding1 + 0.02), "host", "look", { to: [0, 0], dur: 0.06, blink: false });
A(r3(T.ding1 + 0.07), "host", "drop", { to: r3(S - 1.55), dur: 0.38 });
// his hat stays in the air a beat, then falls in after him
c.at(r3(T.ding1 + 0.07), { do: "hat", who: "host", off: [0.1, 1.5, -0.05], spin: [0, 0, -40], dur: 0.38, ease: "in" });
A(r3(T.ding1 + 0.44), "host", "release", { prop: "coal", to: [X.host, 0.3, 0], dur: 0.02 }); c.at(r3(T.ding1 + 0.43), { do: "prop", id: "coal", set: { scale: 0.001 }, dur: 0.02, ease: "in" });
A(r3(T.ding1 + 0.47), "host", "hide"); A(r3(T.ding1 + 0.48), "host", "move", { to: [6, -6], dur: 0, ease: "linear", steps: 0 });
sfx(r3(T.ding1 + 0.1), "whoosh", { gain: 0.35, reason: "the host falls through his tile" });
sfx(r3(T.ding1 + 0.55), "splash", { gain: 0.6, reason: "under the stage: the splash into the fryer" });
sfx(r3(T.ding1 + 0.65), "sizzle", { gain: 0.6, reason: "the sizzle" });
P_(r3(T.ding1 + 0.55), "vat", { churn: 0.4 }, 0.25, "out"); P_(r3(T.ding1 + 1.6), "vat", { churn: 0.3 }, 0.8, "inOut");
// Dragon wipes his nose; Spud stares at the hole
A(r3(T.ding1 + 0.15), "drg", "look", { to: [0.7, -0.5], dur: 0.12, blink: false });
c.arm(r3(T.ding1 + 0.3), "drg", "R", { x: [-0.02, 0.42, 0.37] }, 0.3, "inOut");
for (const t of [0.62, 0.9]) { c.arm(r3(T.ding1 + t), "drg", "R", { x: [0.05, 0.42, 0.37] }, 0.13, "inOut"); c.arm(r3(T.ding1 + t + 0.13), "drg", "R", { x: [-0.02, 0.42, 0.37] }, 0.13, "inOut"); }
A(r3(T.ding1 + 0.35), "drg", "expr", { expr: "sad", set: { curve: -0.1, pucker: 0.3 }, dur: 0.2 }); A(r3(T.ding1 + 0.35), "drg", "face", { lid: 0.7, dur: 0.2 });
A(r3(T.ding1 + 0.15), "spud", "look", { to: [0.75, -0.6], dur: 0.12, blink: false });
A(r3(T.ding1 + 0.2), "spud", "expr", { expr: "shocked", set: { open: 0.45 }, dur: 0.15 });
see(T.land, r3(T.ding1 + 0.3), ["host.face", "tile_host"], "the red tile is the host's own: his smile freezes, 0, he drops");

// ---------------------------------------------------------------- 10 CRISPY (10.2-end): the basket lifts him out, alive; the next sneeze is coming
P_(r3(T.rise - 0.25), "tile_host", { hot: 0 }, 0.2);
A(r3(T.rise - 0.07), "crisp", "move", { to: [X.host, 0], dur: 0, ease: "linear", steps: 0 });
A(r3(T.rise - 0.05), "crisp", "ride", { prop: "lift", off: [0, 0.02, 0], yaw: -4, dur: 0 });
A(r3(T.rise - 0.04), "crisp", "show");
c.prop(T.rise, "lift", { y: r3(S + 0.02) }, 0.6, "inOut");
sfx(T.rise, "creak", { gain: 0.4, reason: "the fry basket's lift winding up" });
sfx(r3(T.rise + 0.5), "ding", { gain: 0.6, reason: "ding: he's done" });
sfx(r3(T.rise + 0.3), "steam", { gain: 0.4, reason: "steam off the fried host" });
P_(T.rise, "lift", { drip: 1 }, 0.3, "out"); P_(r3(T.rise + 1.2), "lift", { drip: 0.2 }, 0.8, "inOut");
P_(r3(T.rise + 0.2), "studio", { sing: 1 }, 0.2, "out"); P_(r3(T.rise + 0.2), "confL", { burst: 0 }, 0.01, "linear"); P_(r3(T.rise + 0.2), "confR", { burst: 0 }, 0.01, "linear");
P_(r3(T.rise + 0.22), "confL", { burst: 1 }, 2.2, "linear"); P_(r3(T.rise + 0.22), "confR", { burst: 1 }, 2.2, "linear");
sfx(r3(T.rise + 0.2), "partyhorn", { gain: 0.45, reason: "the sun sings and the confetti flies: a winner" });
cap(r3(T.rise + 0.2), r3(T.bye2 - 0.05), "WE HAVE A *WINNER!*", 740, true, { size: 84, kinetic: false });
A(r3(T.rise + 0.3), "crisp", "expr", { expr: "delighted", set: { curve: 0.95, open: 0.4 }, dur: 0.15 });
// he waves beside his head, wide of the hat's brim
c.arm(r3(T.bye2 - 0.3), "crisp", "L", { x: [0.42, 0.66, 0.2] }, 0.3, "inOut");
for (let k = 0; k < 4; k++) c.arm(r3(T.bye2 + 0.05 + k * 0.2), "crisp", "L", { x: [k % 2 ? 0.42 : 0.34, k % 2 ? 0.66 : 0.72, 0.2] }, 0.18, "inOut");
say(T.bye2, "crisp", "see you next week, kids!", 0.85, "excited", "See you next week, kids!");
for (const w of ["spud", "drg"]) A(r3(T.rise + 0.3), w, "look", { to: [0.7, 0], dur: 0.12, blink: false });
A(r3(T.rise + 0.6), "spud", "expr", { expr: "sad", set: { curve: 0.25 }, dur: 0.3 }); A(r3(T.rise + 0.6), "spud", "face", { lid: 0.7, brow: 0.3, dur: 0.3 });   // a weak relieved smile
A(r3(T.rise + 0.6), "spud", "droop", { to: 1, dur: 0.4 });
c.arm(r3(T.rise + 0.3), "drg", "R", { x: [-0.22, 0.1, 0.12] }, 0.35, "inOut");
A(r3(T.rise + 0.5), "drg", "expr", { expr: "happy", set: { curve: 0.5 }, dur: 0.25 }); A(r3(T.rise + 0.5), "drg", "face", { lid: 0.1, dur: 0.25 });
// the button: Dragon's nose wrinkles again
A(T.again, "drg", "expr", { expr: "focused", set: { pucker: 0.5, open: 0.35, eye: 0.7 }, dur: 0.15 }); A(T.again, "drg", "face", { brow: -0.3, tilt: 0.3, dur: 0.15 });
A(r3(T.again + 0.05), "drg", "pitch", { to: -12, dur: 0.35, ease: "inOut" });
sfx(r3(T.again + 0.05), "gasp", { gain: 0.55, reason: "ah... (Dragon's next sneeze building)" });
say(r3(T.again + 0.05), "drg", "ah... ah...", 0.5, "calm", "Ah… ah…");
A(r3(T.again + 0.2), "spud", "look", { to: [0.7, 0.1], dur: 0.08, blink: false });
A(r3(T.again + 0.25), "spud", "expr", { expr: "terrified", set: { open: 0.5 }, dur: 0.1 }); A(r3(T.again + 0.25), "spud", "face", { lid: 0, brow: 0.6, dur: 0.1 });
A(r3(T.again + 0.25), "spud", "droop", { to: 0, dur: 0.1 });
A(r3(T.again + 0.3), "crisp", "look", { to: [-0.7, 0], dur: 0.1, blink: false });
A(r3(T.again + 0.35), "crisp", "expr", { expr: "shocked", set: { open: 0.3, curve: -0.2 }, dur: 0.12 });
see(r3(T.rise + 0.5), r3(END - 0.1), ["crisp.face", "spud.face", "drg.face"], "the host comes up fried and alive, waving; Spud and Dragon are the winners");

// ---------------------------------------------------------------- shots
// WIDE: the whole set, sun to vat, four bodies across (panels 01, 02). MED: level with the wall's card, a wider lens
// from closer, so the sun's card stays in the top of the frame behind bigger bodies (panels 03-06).
const WIDE = frame([0, 2.5, 0], { az: 0, el: 5, h: 6.9, fov: 33.4 });   // (6.4 high cut Viking's side off)
const med = (x) => ({ pos: [r3(x), 2.3, 4.1], look: [r3(x), 2.3, 0.1], fov: 41.2 });   // level, above the heads: the sign clears them by a subtitle's height
const HAND = med(-0.05);                                     // 03: Spud and the host at the handover
const close = (x) => ({ pos: [x, 2.2, 3.4], look: [x, 2.05, 0.1], fov: 40 });   // from a little above: the face, the coal and the red tile inside the safe zone
const SPUD_HOT = close(X.spud);   // "hot! hot!"
const TWO = med(0.0);                                        // 04, 05: Spud and Dragon
const SPUD_LOW = { pos: [-2.6, 1.55, 3.9], look: [0.3, 2.25, -0.1], fov: 42 };   // 06: low and from the left, Spud in front, the host's grin at the far end of the row
const DRG_CLOSE = close(X.drg);   // 07
const WIDE3 = frame([0.3, 2.3, 0], { az: 0, el: 5, h: 5.9, fov: 33.4 });   // 08, 09: Spud, Dragon and the host
const END_W = frame([0.55, 2.25, 0], { az: 0, el: 5, h: 5.4, fov: 33.4 });  // 10
const beats = c.beats([
  ["01 the coal", 0, WIDE, "hook"],
  ["03 a fresh coal", r3(T.give - 0.45), HAND],
  ["hot hot", T.hot, SPUD_HOT],
  ["04 the pass", r3(tickAt(4) - 0.02), TWO],
  ["06 the fake-out", r3(tickAt(1) - 0.3), SPUD_LOW],
  ["07 smoke", r3(T.catch2 - 0.1), DRG_CLOSE],
  ["08 the sneeze", r3(RAMP.at - 0.02), WIDE3, "payoff"],
  ["10 crispy", r3(T.rise - 0.1), { ...WIDE3, to: { pos: END_W.pos, look: END_W.look }, dur: 1.2 }],   // a push in, no cut
], END);

write(import.meta.url, {
  id: "hot-potato-01",
  title: "Hot Potato 01 (pilot)",
  idea: "A preschool-sweet game show over a deep fryer: hold the coal at zero and your tile opens. The fireproof Dragon sneezes it into the host.",
  fps: 30, look: "anime-pro", profile: "short", loop: false, captionStyle: "kinetic",
  captionBand: [240, 1360],
  castLook: "sheet",
  cleanStart: true,
  motion: { feet: 2, overlap: true, timing: true, solve: true },
  rig: { hand: 2, eyes: 2, hold: 2 },
  animeTiming: true,
  set: { type: "plain", color: "#8fc4ee", floor: "#4a4350", para: 0, bloom: "emissive", key: [0.6, 6.5, 4.0],
    aperture: 0, lighting: 2, hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true, satsuei: true },
  music: { style: "bounce", lowCut: 150, gain: 0.3 },
  sound: { sfx: 0.6, ambience: 0.2, guard: true, surface: "indoor" },
  hook: { show: ["vik", "spud", "drg", "host"], hint: 0, what: "Viking holds a glowing coal on a red tile over the fryer, the clock at 1" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  // (the checks read windows on the video's clock, which the slow motion makes about 1.75 s longer than the story)
  allowClip: [
    ...["vik", "spud", "drg", "host", "crisp"].map((who) => ({ who, with: "studio", from: 0, to: END + 3, reason: "the cast stand on the stage (scenery: its box is the whole studio)" })),
    ...["vik", "spud", "drg", "host"].map((who) => ({ who, with: `tile_${who}`, from: 0, to: END + 3, reason: "each player stands on his trapdoor tile (and drops through it)" })),
    { who: "crisp", with: "tile_host", from: 0, to: END + 3, reason: "the basket lifts the fried host up through the open tile" },
    { who: "crisp", with: "lift", from: 0, to: END + 3, reason: "the fried host stands in the fry basket" },
    { who: "host", with: "bow", from: 0, to: END + 3, reason: "he wears the bow tie" }, { who: "crisp", with: "bow2", from: 0, to: END + 3, reason: "he wears the bow tie" },
    ...["vik", "spud", "drg", "host", "crisp"].flatMap((who) => ["confL", "confR"].map((w) => ({ who, with: w, from: 0, to: END + 3, reason: "confetti falls past the cast" }))),
    { who: "vik", with: "vat", from: T.ding0, to: END + 3, reason: "he falls into the fryer under the stage (hidden there)" },
    { who: "host", with: "vat", from: T.ding1, to: END + 3, reason: "he falls into the fryer under the stage (hidden there)" },
    { who: "host", with: "lift", from: T.ding1, to: END + 3, reason: "he falls past the basket under the stage (hidden there)" },
    { who: "spud", with: "tongs", from: r3(T.give - 0.2), to: r3(T.give + 0.3), reason: "the tongs set the coal between his cupped gloves" },
    { who: "crisp", from: 0, to: r3(T.rise + 1.4), checks: ["face-covered"], reason: "hidden behind the wall until the lift" },
    { who: "crisp", with: "vat", from: 0, to: r3(T.rise + 2.4), reason: "under the stage, hidden: the basket lifts him up out of the vat" },
    { who: "crisp", from: 0, to: r3(T.rise + 2.4), checks: ["rig-jump", "stance-slide", "foot-slide", "lean-jump"], reason: "hidden until the lift: he is put in the basket under the stage, then the lift carries him up fast" },
    { who: "host", with: "drg", from: r3(T.hot + 0.05), to: r3(T.hot + 0.6), reason: "off screen (Spud's close shot): the host walks back past Dragon to his tile" },
    { who: "vik", with: "coal0", from: 0, to: 1.3, reason: "Viking holds the coal in both gloves" },
    { who: "spud", with: "coal", from: r3(T.give - 0.1), to: r3(T.hurl + 0.2), reason: "Spud holds, throws and catches the coal" },
    { who: "drg", with: "coal", from: r3(T.throw1 + 0.2), to: r3(T.choo + 0.2), reason: "Dragon holds, lobs and catches the coal" },
    { who: "host", with: "coal", from: r3(T.conjure - 0.1), to: r3(T.ding1 + 0.6), reason: "the host carries the coal in his tongs, and it lands in his gloves" },
    { who: "host", with: "tongs", from: r3(T.conjure - 0.1), to: r3(T.hot + 0.2), reason: "the host holds the tongs" },
    { who: "vik", from: r3(T.ding0 + 0.07), to: END, checks: ["rig-jump", "stance-slide", "foot-slide", "lean-jump"], reason: "the drop through the trapdoor: he falls below the stage and is hidden" },
    { who: "host", from: r3(T.ding1 + 0.07), to: END, checks: ["rig-jump", "stance-slide", "foot-slide", "lean-jump"], reason: "the drop through the trapdoor: he falls below the stage and is hidden" },
  ],
  notes: "Generated by storyboards/series/hot-potato/01-hot-potato/make-hot-potato.mjs.",
});
console.log(JSON.stringify(T));
