// KRAMPUS MYTH 01 "One night a year he checks your boots" (the heart-video recipe; Jonny 21 Nov 2026: story A packaged as P1
// "street countdown" + ending A 09:03, last line "...That's not my picture." / "It is now." 09:08, "love to the detail you also
// shown in the egypt heart video" 09:26). Story: STORY.md here. Looks + floor plan: DESIGN.md here (Fable).
//   node storyboards/series/krampus-myth/01-boots/make-boots.mjs -> boots.json
//
// Chain: the Krampus punishes the kid at door 9, so Chip learns he and Spud are door 4 and the check walks down the lane;
// Saint Nick reads your year, the Krampus does the rest, so Chip polishes his boot, but a clean boot at door 8 gets sticks
// too (it is the book, not the boot); Chip's page has the fries, so he hides in the woodpile, but the Krampus sniffs (a cat
// saves him); he is next door and it is real, so Chip swaps the two drawings behind Spud's back; Nick reads "Spud's" page at
// Chip's boot (chocolate), then Chip's page at Spud's boot (the roll runs on): sticks, and the basket opens for Spud.
// Hook: frame 0 = a boot and a horned shadow; on screen ONE NIGHT A YEAR HE CHECKS YOUR BOOTS; caption question
// "Chocolate or sticks: what would your boot get?". Every shot moves; a new framing on every line; cut 0.1-0.2 s after an action.
// Departures from DESIGN.md (rough draft): Nick keeps the book in both hands all film (no crook in hand, no sack: the treats
// arrive in the boot while he kneels and reads); the Krampus changes doors between shots (never seen walking the ramps).
import { clip, write, r3, frame } from "../../../lib/clip.mjs";
import * as act from "../../../lib/acting.mjs";
import * as grips from "../../../lib/grips.mjs";
import { LINES, DUR } from "./lines.mjs";
import VOICES from "../../../../engine/voice/voices.json" with { type: "json" };

const c = clip({ faces: "strong", lines: { sub: false, blink: false } }), { A, sfx, cap, see } = c;
const F = (t) => r3(Math.round(t * 30) / 30);
const FL = (t) => Math.floor(t * 30 + 1e-6) / 30;   // the frame a cut at t starts on (clip.mjs snaps beats down)
const D2R = Math.PI / 180;

// ---------------------------------------------------------------- the line clock (gaps 0.1-0.2 s; extra time only for actions)
const T = new Array(LINES.length).fill(null);
let now = 0;
const L = (i, gap = 0.12) => { T[i] = r3(now + gap); now = r3(T[i] + DUR[i]); return T[i]; };
const END_OF = (i) => r3(T[i] + DUR[i]);
const after = (t) => { now = r3(Math.max(now, t)); };

// ---------------------------------------------------------------- places (DESIGN A: door 4's apron = origin, houses on -z, lane on +z, up the lane = -x)
const X = (k) => r3(-7.6 * (k - 4)), Y = (k) => r3(0.8 * (k - 4));
const NICK_AT = (k) => [r3(X(k) - 0.85), Y(k), 1.15], KR_AT = (k) => [r3(X(k) + 1.15), Y(k), 1.10];
const BOOT_AT = (k) => [r3(X(k) + 0.30), Y(k), 1.10];
const TEAL = [0.92, 0, 0.95], YEL = [1.30, 0, 0.95];
// the cast at door 4 (DESIGN A marks): the rules by the door, the payoff by the boots (behind them, toward the lane)
const SPUD0 = [-0.85, 0.90], CHIP0 = [0.30, 1.00];
const CHIP_POL = [1.10, 1.55];   // polishing, on the apron in front of the boots
const PILE_IN = [3.18, 0.38];    // inside the hollow (x 2.80..3.60, z 0.05..0.71), lying face down toward +x
const CHIP_OUT = [2.20, 0.95];   // crawled out of the hollow mouth
const SPUD_E = [1.25, 0.62], CHIP_E = [2.12, 0.62];   // z 0.62: clear of the snow banked on the plinth   // the payoff: on the apron behind their boots, facing out; the Krampus left, Nick right
const K4 = [0.07, 0, 1.10], K4ROT = 100, NICK_Y = [2.65, 0, 1.30], NICK_T = [0.80, 0, 1.95], NICK_OFF = [-1.35, 0, 1.6];   // Nick reads the long page from the lane side, then steps off
const AWAY = -60;

// ---------------------------------------------------------------- the drawings on their pegs (bench/make-boots-bench.mjs noteAt)
const noteAt = (who, boot, K = 1, H = 0.30) => {
  const rot = boot.rot ?? -35, az = (rot + 35) * D2R, d = 0.0946 * K, ax = [boot.x + Math.sin(rot * D2R) * 0.01 * K, boot.z + Math.cos(rot * D2R) * 0.01 * K];
  return { x: r3(ax[0] + Math.sin(az) * d), y: r3(boot.y + H + 0.045), z: r3(ax[1] + Math.cos(az) * d), rot: r3(rot + 35) };
};

// ---------------------------------------------------------------- cast: 2 hosts, Saint Nick (a rig), a hidden speaker for the kid
const cast = [
  { id: "chip", character: "potatobrawl/chip", at: CHIP0, face: -40, expr: "shocked", follow: 0.4, seed: 2.3 },
  { id: "spud", character: "potatobrawl/spud", at: SPUD0, face: 30, expr: "stern", follow: 0.3, seed: 1.1 },
  { id: "nick", character: "krampus-myth/nick", at: [NICK_AT(9)[0], NICK_AT(9)[2]], face: 80, expr: "kind", follow: 0.2, seed: 5.3 },
  { id: "kv", character: "potatobrawl/chip", at: [-300, 300], face: 0, expr: "kind", hidden: true },   // the kid's voice (the kid is a prop in the basket)
];
const SPEAKER = { kid: "kv" };

// ---------------------------------------------------------------- props (DESIGN A-F)
const TEAL_B = { id: "bt", kind: "kboot", who: "spud", x: TEAL[0], y: 0, z: TEAL[2], rot: -35 };
const YEL_B = { id: "by", kind: "kboot", who: "chip", x: YEL[0], y: 0, z: YEL[2], rot: -35, mud: 1 };
const D9 = { id: "b9", kind: "kboot", style: "suede", x: BOOT_AT(9)[0], y: Y(9), z: BOOT_AT(9)[2], rot: -25 };
const D8 = { id: "b8", kind: "kboot", style: "leather", x: BOOT_AT(8)[0], y: Y(8), z: BOOT_AT(8)[2], rot: -25 };
const N_SPUD0 = noteAt("spud", TEAL_B), N_CHIP0 = noteAt("chip", YEL_B, 0.867, 0.26);
// after the swap: the teal drawing (Spud's) on the yellow boot, the yellow drawing (Chip's) on the teal boot
const N_SPUD1 = noteAt("spud", YEL_B, 0.867, 0.26), N_CHIP1 = noteAt("chip", TEAL_B);
const BOOK = { id: "book", kind: "goldenbook", x: 0, y: AWAY, z: 0, rot: 0, rollDir: [0.15, 1], apron: [0.96, 0.16] };
const props = [
  { id: "lane", kind: "krampuslane", x: 0, y: 0, z: 0, shakeAt: 5 },
  { id: "kr", kind: "krampus", x: KR_AT(9)[0], y: Y(9), z: KR_AT(9)[2], rot: 270, mirror: true },
  { id: "shadow", kind: "krampusshadow", x: X(9), y: Y(9), z: 0.16, rot: 0 },
  TEAL_B, YEL_B, D9, D8,
  { id: "nt", kind: "bootnote", who: "spud", ...N_SPUD0, staged: "pinned on a peg at the boot's top (DESIGN E)" },
  { id: "ny", kind: "bootnote", who: "chip", ...N_CHIP0, staged: "pinned on a peg at the boot's top (DESIGN E)" },
  BOOK,
  { id: "cat", kind: "ktabby", x: 0, y: AWAY, z: 0, rot: 270, staged: "off the set (show 0) until its one bolt across the snow" },
  { id: "run", kind: "krampusrun", x: 400, y: 0, z: 0 },
];

// ---------------------------------------------------------------- helpers
const SUB = 300;   // captions in the upper third: balconies, eaves and sky behind them
const CAPTEXT = { 2: "Who are *THEY?!*", 4: "Bad kids get *him.* Krampus.", 6: "My boot is *dirty.* Is that bad?!", 9: "He doesn't check the boot. He checks the *book.*",
  11: "The *fries.*", 12: "That was *ONE* time!", 13: "Every *Tuesday.*", 16: "He can *SMELL* me?", 17: "His name comes from *claw.*", 21: "I'm a *good* kid!",
  22: "...That's not *my* picture.", 23: "It is *now.*" };
const CAPS = [];
const say = (i, extra = {}, capTo = null) => {
  const [who, line, tone, style, o = {}] = LINES[i];
  const actor = SPEAKER[who] ?? who;
  const le = lastExpr[actor];
  if (le && (OPEN[le[1]] ?? 0) > 0.2) { const t = r3(Math.max(le[0] + 0.02, T[i] - 0.06)); A(t, actor, "expr", { expr: le[1], dur: 0.06, set: { ...(le[2] || {}), open: 0.1 } }); }
  c.macro(T[i], actor, "say", { line, tone, ...(style ? { style } : {}), ...o, dur: DUR[i], caption: false, ...extra });
  CAPS.push([i, capTo]);
};
// a face's open mouth wins over the talk (heart Sol 1 (2)): say() closes it to 0.1 for the line; "worried" is "sad" with softer corners
const OPEN = { shocked: 0.95, terrified: 0.8, delighted: 0.6, evil: 0.4, happy: 0.35, dizzy: 0.3, eager: 0.25 };
const lastExpr = {};
const EXPR_AS = { worried: ["sad", { curve: -0.25, eye: 1.05 }] };
const expr = (t, who, e, dur = 0.2, set) => {
  const [name, s0] = EXPR_AS[e] ?? [e, null], st = s0 || set ? { ...(s0 || {}), ...(set || {}) } : null;
  lastExpr[who] = [r3(t), name, st];
  A(r3(t), who, "expr", { expr: name, dur, ...(st ? { set: st } : {}) });
};
const arm = (t, who, side, pose, dur = 0.3, ease = "inOut") => c.arm(r3(t), who, side, pose, dur, ease);
const grip = (t, who, side, shape, dur = 0.2) => A(r3(t), who, "grip", { side, shape, dur });
const look = (t, who, to, dur = 0.2) => A(r3(t), who, "look", { to, dur, blink: false });
const turn = (t, who, to, dur = 0.3) => A(r3(t), who, "turn", { to, dur });
const P = (t, id, st, dur = 0, ease) => c.prop(r3(t), id, st, dur, ease);
const place = (t, who, to, yaw, y = 0) => {
  const t0 = r3(FL(t) - 0.02);
  A(t0, who, "move", { to, dur: 0.01, ease: "linear", sync: true, y, steps: 0 });
  A(t0, who, "turn", { to: yaw, dur: 0.01, ease: "linear", sync: true });
};
// the pair arrives at door k (between shots: nobody sees them move); Nick keeps the book at his chest
const atDoor = (t, k, { nick = true } = {}) => {
  const n = NICK_AT(k), kr = KR_AT(k);
  if (nick) { place(t, "nick", [n[0], n[2]], 80, n[1]);
    gBook.carry(r3(FL(t) - 0.005), BOOK_AT([n[0], n[2]], 80, n[1]), 0.004, "linear", { rot: BROT(80) }); }
  P(FL(t) - 0.02, "kr", { x: kr[0], y: kr[1], z: kr[2], rot: 270, stoop: 0, jam: 0, gait: 0 }, 0);
  P(FL(t) - 0.02, "lane", { lit: k }, 0);
};
// one Krampus check at a door: Nick reads and shakes his head, the Krampus stoops and jams the sticks into the boot `boot`
const check = (t, boot, { shake = true } = {}) => {
  P(t, "book", { glow: 1 }, 0.3); P(t + 0.1, "book", { page: Math.round(pageNow += 1) }, 0.27);
  if (shake) { A(t + 0.5, "nick", "turn", { to: 65, dur: 0.18 }); A(t + 0.68, "nick", "turn", { to: 95, dur: 0.18 }); A(t + 0.86, "nick", "turn", { to: 80, dur: 0.16 }); }
  P(t + 0.6, "kr", { stoop: 1 }, 0.35, "inOut"); P(t + 0.95, "kr", { jam: 1 }, 0.18, "in");
  P(t + 1.13, boot, { sticks: 1 }, 0.13); P(t + 1.13, "kr", { bunch: 0 }, 0);
  sfx(t + 1.13, "hit-wood", { gain: 0.35 }); bells(t + 0.95, 0.5);
  P(t + 1.3, "kr", { jam: 0 }, 0.25); P(t + 1.45, "kr", { stoop: 0, bunch: 1 }, 0.4);
  return r3(t + 1.85);
};
let pageNow = 0;
// the bells: a swing and a few strikes (rough draft: the heavy bell, low; Jonny judges the sound)
const bells = (t, gain = 0.4, n = 3) => { P(t, "kr", { ring: 1 }, 0.1); P(t + 0.6, "kr", { ring: 0.3 }, 0.6); for (let k = 0; k < n; k++) sfx(r3(t + k * 0.21), "bell-heavy", { gain: r3(gain * (1 - k * 0.2)) }); };

// ---------------------------------------------------------------- frame 0 seeds (every tweened state key, dur 0)
P(0, "lane", { visited: 10, lit: 9, door4: 1, snowfall: 0, shake: 0, trickle: 0.3, smoke: 1, tense: 0.6, kidsUp: -1 }, 0);
P(0, "kr", { stoop: 0, nose: 0, sniff: 0, twist: 0, headYaw: 0, headPitch: 0, gait: 0, jam: 0, bunch: 1, tongue: 0.35, lick: 0, jaw: 0, breath: 0, lids: 0.3, glow: 0.5, ring: 0, lid: 0, stow: 0, kidPeek: 1, kidTalk: 0, kidKick: 0, scarfOut: 0, spares: 3 }, 0);
P(0, "shadow", { grow: 0, sway: 0 }, 0);
P(0, "bt", { mud: 0, shine: 0, sticks: 0, treats: 0, droop: 0, glint: 0, shade: 0 }, 0);
P(0, "by", { mud: 1, shine: 0, sticks: 0, treats: 0, droop: 0, glint: 0, shade: 0 }, 0);
P(0, "b9", { sticks: 0, shade: 1 }, 0); P(0, "b8", { sticks: 0, shine: 1 }, 0);
P(0, "nt", { flutter: 0.1, swing: 0, kink: 0 }, 0); P(0, "ny", { flutter: 0.1, swing: 0, kink: 0 }, 0);
P(0, "book", { open: 1, page: 0, glow: 0.6, run: 0, spread: "plain" }, 0);
P(0, "cat", { run: 0, streak: 0, bound: 0, rate: 4.2, tail: 0.5, ears: 0, show: 0 }, 0);
P(0, "run", { march: 0, torch: 1, ring: 0.8, cheer: 0.5, show: 0 }, 0);
for (const w of ["chip", "spud", "nick", "kv"]) A(0, w, "noblink");
turn(0, "chip", -40, 0.01); turn(0, "spud", 30, 0.01);
look(0, "chip", [-0.6, 0.1], 0.01); look(0, "spud", [-0.6, 0], 0.01);
// Nick holds the book open at his chest the whole film (grips.box: both palms on its edges)
const BROT = (yaw) => grips.placeFor("goldenbook", [0, 0, 0], yaw).rot;
const BOOK_AT = (C, yaw, y = 0, h = 0.22) => { const a = yaw * D2R; return [r3(C[0] + Math.sin(a) * 0.36), r3(y + h), r3(C[1] + Math.cos(a) * 0.36)]; };
const B0 = { ...BOOK, ...grips.placeFor("goldenbook", BOOK_AT([NICK_AT(9)[0], NICK_AT(9)[2]], 80, Y(9)), 80) };
P(0, "book", { x: B0.x, y: B0.y, z: B0.z, rot: B0.rot }, 0);
const gBook = grips.box(c, "nick", B0);
gBook.secure(0, 0.001);
A(0, "nick", "move", { to: [NICK_AT(9)[0], NICK_AT(9)[2]], dur: 0.01, ease: "linear", sync: true, y: Y(9), steps: 0 });
expr(0, "nick", "stern", 0.01);
act.blinksAt(c, "spud", [5.4, 12.8, 24.6, 33.0, 47.2, 60.8]); act.blinksAt(c, "chip", [3.9, 9.8, 19.0, 27.4, 41.2, 52.6, 63.4]);
act.blinksAt(c, "nick", [8.1, 22.6, 57.4, 64.0]);
// the wind in the pines under everything (realistic, low)
const WIND = [];   // laid at the end, up to END

// ================================================================= 0.0-4.1 THE NARRATOR (Jonny 22 Nov 07:41 + 07:43 Berlin): a place line over the
// village, the Krampus by second 2, 20 % faster than the narrator's usual reading (his note: "very slow, loses viewers")
const NARR = 0.1, NARR_LINE = "In Austria, one night a year, Krampus checks every kid's boot.";
const NARR_V = { ...VOICES.narrator, tempo: 1.2 }, ND = r3(4.78 / 1.2);   // 4.78 s measured at tempo 1 (22 Nov)
c.at(NARR, { macro: "narrate", line: NARR_LINE, voice: NARR_V, dur: ND, caption: false, gain: 4.0 });
cap(NARR, r3(NARR + ND + 0.15), "In *Austria,* one night a year, *Krampus* checks every kid's boot.", SUB, false, { size: 64 });
bells(0.0, 0.22, 3); sfx(0.9, "bell-heavy", { gain: 0.18 });
see(0, 1.9, ["lane"], "a snowy Alpine village at night, lit windows, a lane of wooden houses running up the hill");
const KR_CUT = r3(NARR + 1.75);   // on "Krampus"
P(KR_CUT - 0.02, "kr", { tongue: 1, jaw: 0.6, glow: 1, headPitch: 0.15 }, 0);
P(KR_CUT, "kr", { headYaw: 0.25 }, 0.5); bells(KR_CUT, 0.5, 3); sfx(KR_CUT + 0.1, "ai/bear-huff", { gain: 0.5 });
see(KR_CUT, r3(KR_CUT + 1.0), ["kr"], "the Krampus' face: carved wood, curled horns, glowing eyes, a long red tongue");
const SH = r3(KR_CUT + 1.05);   // on "every kid's boot": the boot and the shadow
P(SH - 0.02, "kr", { tongue: 0.35, jaw: 0, headYaw: 0, headPitch: 0 }, 0);
P(SH, "shadow", { grow: 1 }, 0.5, "out"); P(SH + 0.2, "shadow", { sway: 1 }, 0.6);
sfx(SH + 0.1, "kenney/footstep-snow", { gain: 0.5 }); sfx(SH + 0.35, "kenney/footstep-snow", { gain: 0.55 });
see(SH, r3(SH + 0.8), ["b9", "shadow"], "a small red boot on a snowy doorstep; a huge horned shadow falls over it");
const D9T = r3(SH + 0.85);
// door 9 (Jonny 22 Nov 08:43: "show how krampus stuffes the kid in his bag"): Nick reads the kid's page and shakes his head; the
// Krampus holds the kid up by the scruff (stow 0: the free claw out, the kid dangling, legs pedalling), the kid pleads, and the
// Krampus stuffs him into the basket on his back (stow 0 -> 1) and slams the lid on "tomorr-"
P(D9T - 0.3, "book", { glow: 1 }, 0.3); P(D9T - 0.2, "book", { page: Math.round(pageNow += 1) }, 0.27);
A(D9T + 0.15, "nick", "turn", { to: 65, dur: 0.18 }); A(D9T + 0.33, "nick", "turn", { to: 95, dur: 0.18 }); A(D9T + 0.51, "nick", "turn", { to: 80, dur: 0.16 });
bells(D9T + 0.1, 0.4, 2);
P(D9T + 0.2, "kr", { scarfOut: 1 }, 0.4); P(D9T, "kr", { headYaw: -0.3 }, 0.3);
const KID9 = r3(D9T + 0.6);
P(KID9 - 0.02, "kr", { hold: 1, lid: 0 }, 0);   // the kid held out in front of him for the plea   // the cut to the close two-shot: the kid in his claw, the basket behind
// KID (held up by the scruff): I was gonna be good tomorr-  (stuffed in, the lid thumps shut on it)
L(0, KID9 + 0.1);
c.macro(T[0], "kv", "say", { line: LINES[0][1], tone: LINES[0][2], ...LINES[0][4], dur: DUR[0], caption: false }); CAPS.push([0, null]);
for (let k = 0; k < 6; k++) { P(T[0] + k * 0.28, "kr", { kidTalk: 1 }, 0.07); P(T[0] + 0.14 + k * 0.28, "kr", { kidTalk: 0.2 }, 0.07); }
const LID9 = r3(END_OF(0) - 0.05);
P(LID9 - 0.95, "kr", { hold: 0 }, 0.35, "inOut"); P(LID9 - 0.75, "kr", { lid: 1, headYaw: 0.2 }, 0.2); P(LID9 - 0.55, "kr", { stow: 1 }, 0.45, "inOut");   // over the shoulder, in
P(LID9 - 0.15, "kr", { kidPeek: 0 }, 0.12, "in"); P(LID9, "kr", { lid: 0 }, 0.08, "in"); P(LID9 + 0.1, "kr", { kidKick: 1 }, 0.25);
sfx(LID9 - 0.5, "cloth", { gain: 0.4 });
sfx(LID9 + 0.06, "thud-soft", { gain: 0.7 }); sfx(LID9 + 0.08, "kenney/impact-wood-light", { gain: 0.4 });
see(D9T, KID9, ["kr", "nick", "book"], "Saint Nick reads a glowing golden book and shakes his head; the horned Krampus holds a small kid up by the scruff");
see(KID9, r3(LID9 + 0.2), ["kr"], "the kid dangles from his claw, pleading; the Krampus stuffs him over his shoulder into the wicker basket and slams the lid");
cap(0.05, r3(SH + 0.8), "ONE NIGHT A YEAR HE CHECKS YOUR BOOTS", 1020, false, { size: 76, kinetic: false });

// ================================================================= 2.6-14.5 DOOR 4: THE RULES (the street countdown starts)
const WHIP = r3(LID9 + 0.3);
P(WHIP - 0.02, "lane", { tense: 0.2 }, 0); P(WHIP - 0.02, "kr", { kidKick: 0, scarfOut: 0 }, 0);
expr(WHIP, "chip", "shocked", 0.01); expr(WHIP, "spud", "deadpan", 0.01);
look(WHIP, "chip", [-0.9, 0.15], 0.01); look(WHIP, "spud", [-0.9, 0.1], 0.01);
// SPUD: That's number nine. We're number four.
L(1, WHIP + 0.25 - now);
say(1);
see(WHIP, END_OF(1), ["chip", "spud", "lane", "bt", "by"], "down a snowy Alpine lane at night: two little potatoes peek out of their door, two boots with drawings pinned on their step");
// CHIP: Who are THEY?!
L(2, 0.15);
expr(T[2] - 0.1, "chip", "terrified"); turn(T[2] - 0.15, "chip", 20, 0.25); look(T[2], "chip", [0.4, 0.2]);
A(T[2] - 0.1, "chip", "squash", { amount: -0.06, dur: 0.08 }); A(T[2] + 0.05, "chip", "squash", { amount: 0, dur: 0.12 });
say(2);
// SPUD: Saint Nick reads your whole year from the golden book. Good kids get chocolate.  (Nick turns a page at door 9)
L(3, 0.15);
expr(T[3], "spud", "kind"); look(T[3], "spud", [0.6, -0.1]);
say(3);
const PAGE1 = r3(T[3] + 0.9);
P(PAGE1, "book", { page: Math.round(pageNow += 1) }, 0.27); P(PAGE1, "book", { glow: 1 }, 0.3);
A(PAGE1 + 0.6, "nick", "turn", { to: 70, dur: 0.3 });
see(PAGE1, r3(PAGE1 + 1.8), ["nick", "book"], "the old bishop turns a page of the glowing golden book");
// SPUD: Bad kids get him. Krampus.  (the tongue unrolls; birch sticks in his fist)
L(4, 0.15);
const TONGUE = r3(T[4] + 0.5);
P(TONGUE, "kr", { tongue: 1, jaw: 0.6 }, 0.6, "out"); P(TONGUE, "kr", { glow: 1, headPitch: 0.15 }, 0.4);
sfx(TONGUE, "ai/bear-huff", { gain: 0.5 });
say(4);
P(END_OF(4) + 0.2, "kr", { tongue: 0.35, jaw: 0 }, 0.4);
see(TONGUE, END_OF(4), ["kr"], "the Krampus: carved wooden face, curled horns, a long red tongue rolls out, birch sticks in his fist");
// CHIP: And really bad kids?  (Spud only looks at the basket: the legs kick inside, the lid thumps)
L(5, 0.2);
expr(T[5], "chip", "worried"); look(T[5], "chip", [0.2, 0.1]);
say(5);
const BASKET = r3(END_OF(5) + 0.1);
P(BASKET, "kr", { kidKick: 1 }, 0.25); P(BASKET + 0.5, "kr", { kidKick: 0 }, 0.25); P(BASKET + 0.75, "kr", { kidKick: 1 }, 0.2);
sfx(BASKET + 0.2, "thud-soft", { gain: 0.4 }); sfx(BASKET + 0.85, "thud-soft", { gain: 0.35 });
look(BASKET, "spud", [-0.7, 0.3], 0.3); expr(BASKET + 0.3, "chip", "terrified");
see(BASKET, r3(BASKET + 1.2), ["kr"], "his wicker basket: the lid shut, two small legs kick out of it");
after(BASKET + 1.2);

// ================================================================= 14.5-30.5 POLISH (false close 1): door 8
const POL = r3(now + 0.1);
atDoor(POL, 8);
place(POL, "chip", CHIP_POL, -20); place(POL, "spud", [0.25, 1.10], 25);
// the yellow boot is in Chip's right hand from this cut (a fist round the shaft)
const BY_HAND = [r3(CHIP_POL[0] - 0.24), 0.06, r3(CHIP_POL[1] + 0.16)];
const BY0 = { ...YEL_B, ...grips.placeFor("kboot", BY_HAND, -20) };
P(POL - 0.02, "by", { x: BY0.x, y: BY0.y, z: BY0.z, rot: BY0.rot }, 0);
P(POL - 0.02, "ny", { y: AWAY }, 0);   // the drawing stays on the step while he holds the boot (rough draft: off set)
const gBoot = grips.mug(c, "chip", BY0, { side: "R" });
gBoot.secure(POL - 0.01, 0.001);
expr(POL, "chip", "shocked", 0.01); look(POL, "chip", [0.35, -0.2], 0.01); look(POL, "spud", [0.3, -0.3], 0.01);
bells(POL + 0.1, 0.3, 2);
// CHIP: My boot is dirty. Is that bad?!
L(6, POL + 0.15 - now);
say(6);
see(T[6], END_OF(6), ["chip", "by"], "the little one holds up his muddy yellow felt boot in horror");
// SPUD: Kids clean their boots for him. That's the rule.  (Chip scrubs with his sleeve: the mud goes, the shine comes)
L(7, 0.12);
expr(T[7], "spud", "kind"); look(T[7], "spud", [0.4, -0.2]);
say(7);
const RUB = r3(T[7] + 0.2), RUB_END = r3(RUB + 2.2);
expr(RUB, "chip", "angry", 0.15, { open: 0.1 });
for (let k = 0; k < 7; k++) {
  const t = r3(RUB + k * 0.3);
  arm(t, "chip", "L", { world: [r3(BY_HAND[0] + 0.02), r3(BY_HAND[1] + 0.16), r3(BY_HAND[2] + 0.07)] }, 0.14, "inOut");
  arm(t + 0.15, "chip", "L", { world: [r3(BY_HAND[0] + 0.07), r3(BY_HAND[1] + 0.10), r3(BY_HAND[2] + 0.07)] }, 0.14, "inOut");
  if (k % 2 === 0) sfx(t, "cloth", { gain: 0.35 });
}
P(RUB, "by", { mud: 0 }, RUB_END - RUB - 0.4, "inOut"); P(RUB + 0.6, "by", { shine: 1 }, RUB_END - RUB - 0.6, "in");
arm(RUB_END, "chip", "L", "rest", 0.3);
// CHIP: Done. Good kid.  (he holds it up: the glint crosses the shaft)
L(8, RUB_END + 0.1 - now);
expr(T[8] - 0.1, "chip", "smug"); look(T[8], "chip", [0, 0.3]);
const HOLD_UP = [r3(CHIP_POL[0] - 0.22), 0.22, r3(CHIP_POL[1] + 0.24)];
gBoot.carry(T[8] - 0.15, HOLD_UP, 0.3, "out");
P(T[8] + 0.3, "by", { glint: 1 }, 0.2); sfx(T[8] + 0.3, "cloth", { gain: 0.2 });
say(8);
see(T[8], END_OF(8), ["chip", "by"], "he holds up the yellow boot, polished to a mirror shine, grinning");
// door 8: a gleaming leather boot; Nick reads, shakes his head; sticks go in anyway
const D8T = r3(END_OF(8) + 0.15);
P(D8T - 0.02, "lane", { visited: 9 }, 0);
const D8E = check(D8T, "b8");
see(D8T, D8E, ["nick", "kr", "b8"], "next door: a gleaming clean leather boot; Saint Nick shakes his head; the Krampus jams sticks into it anyway");
// SPUD: Oh. He doesn't check the boot. He checks the book.  (Chip frozen mid-grin, the boot droops)
L(9, D8E + 0.05 - now);
place(T[9] - 0.05, "chip", CHIP_POL, -20);
expr(T[9] - 0.1, "chip", "shocked", 0.15, { open: 0.15 }); look(T[9], "spud", [0.6, -0.1]); expr(T[9], "spud", "deadpan");
gBoot.carry(T[9] + 0.6, BY_HAND, 0.5, "inOut");
say(9);
P(T[9] + 1.0, "by", { droop: 1 }, 0.5, "out");
P(T[9] - 0.02, "lane", { visited: 8 }, 0);
// CHIP: What's on my page?  SPUD: The fries.  CHIP: That was ONE time!  SPUD: Every Tuesday.
L(10, 0.15); expr(T[10], "chip", "worried"); look(T[10], "chip", [-0.6, 0.15]); say(10);
L(11, 0.12); look(T[11], "spud", [0.5, -0.25]); say(11);
L(12, 0.12); expr(T[12], "chip", "angry"); A(T[12], "chip", "hop", { height: 0.06, dur: 0.3, quiet: true }); arm(T[12], "chip", "L", { o: [0.12, 0.62, 0.12] }, 0.15, "out"); grip(T[12], "chip", "L", "point"); say(12);
arm(END_OF(12) + 0.1, "chip", "L", "rest", 0.3); grip(END_OF(12) + 0.1, "chip", "L", "relaxed");
L(13, 0.12); expr(T[13], "spud", "deadpan"); say(13);
// the boot goes back on the step (off camera, at the next cut), the drawing back on it
const HIDE0 = r3(END_OF(13) + 0.25);
gBoot.release(HIDE0 - 0.05, { rest: "rest" });
P(HIDE0 - 0.02, "by", { x: YEL_B.x, y: 0, z: YEL_B.z, rot: YEL_B.rot, droop: 0 }, 0);
P(HIDE0 - 0.02, "ny", { ...N_CHIP0 }, 0);

// ================================================================= 30.5-44 HIDE AND SNIFF (false close 2): doors 7 -> 6
atDoor(HIDE0, 7); P(HIDE0, "lane", { visited: 7 }, 0); P(HIDE0, "b8", { sticks: 1 }, 0);
place(HIDE0, "chip", [1.55, 1.25], 100); place(HIDE0, "spud", [0.25, 1.10], 70);
bells(HIDE0 + 0.05, 0.38, 3);
// CHIP: Then he doesn't find me.  (he runs and dives head first into the woodpile's hollow)
L(14, HIDE0 + 0.15 - now);
expr(T[14], "chip", "eager"); look(T[14], "chip", [0.8, -0.1]);
say(14);
const RUN0 = r3(T[14] + 0.35), DIVE = r3(RUN0 + 0.55);
A(RUN0, "chip", "move", { to: [2.40, 0.42], dur: 0.55, ease: "in" });
A(DIVE, "chip", "pitch", { to: 88, dur: 0.18, ease: "in" }); A(DIVE, "chip", "move", { to: PILE_IN, dur: 0.3, ease: "out", y: 0.12 });
sfx(DIVE + 0.25, "hit-wood", { gain: 0.5 }); sfx(DIVE + 0.3, "kenney/impact-wood-light", { gain: 0.4 });
look(RUN0, "spud", [0.8, -0.2], 0.3);
see(RUN0, r3(DIVE + 0.6), ["chip", "lane"], "he dives head first into the woodpile; only his white trainers stick out");
// SPUD: The bells aren't decoration. They're so you hear him coming.  (unimpressed, at the trainers)
L(15, DIVE + 0.55 - now);
expr(T[15], "spud", "deadpan"); look(T[15], "spud", [0.7, -0.4]);
say(15);
// door 6: he stops, sniffs, licks the falling snow, turns toward the pile
const SNIFF = r3(END_OF(15) + 0.15);
atDoor(SNIFF, 6); P(SNIFF, "lane", { visited: 6, tense: 0.7 }, 0);
P(SNIFF, "lane", { snowfall: 0.6 }, 1.0);
P(SNIFF + 0.1, "kr", { headPitch: 0.35, nose: 0.3 }, 0.4); P(SNIFF + 0.4, "kr", { sniff: 1 }, 0.12); P(SNIFF + 0.55, "kr", { sniff: 0 }, 0.12);
P(SNIFF + 0.7, "kr", { sniff: 1 }, 0.12); P(SNIFF + 0.85, "kr", { sniff: 0 }, 0.12);
sfx(SNIFF + 0.4, "ai/bear-huff", { gain: 0.35 }); sfx(SNIFF + 0.7, "ai/bear-huff", { gain: 0.3 });
P(SNIFF + 1.1, "kr", { tongue: 0.9, lick: 1 }, 0.5); P(SNIFF + 1.7, "kr", { tongue: 0.35, lick: 0 }, 0.3);
P(SNIFF + 1.8, "kr", { headYaw: 0.6, headPitch: 0, glow: 1 }, 0.5);   // toward the pile (down the lane)
see(SNIFF, r3(SNIFF + 2.4), ["kr"], "up the lane the Krampus stops in the falling snow, sniffs the air like a dog and turns toward the woodpile");
// the cat bolts out of the pile past his hooves; he watches it go and moves on
const CAT = r3(SNIFF + 2.5);
const CAT_A = [r3(KR_AT(6)[0] + 1.3), Y(6), r3(KR_AT(6)[2] + 0.45)], CAT_B = [r3(KR_AT(6)[0] - 1.5), Y(6), r3(KR_AT(6)[2] + 0.7)];
P(CAT - 0.02, "cat", { x: CAT_A[0], y: CAT_A[1], z: CAT_A[2], rot: 265, run: 1, streak: 1, ears: -1, show: 1 }, 0);
P(CAT, "cat", { x: CAT_B[0], z: CAT_B[2] }, 1.1, "linear");
P(CAT + 0.1, "kr", { headYaw: -0.4 }, 0.5); sfx(CAT + 0.05, "kenney/footstep-snow", { gain: 0.3 }); sfx(CAT + 0.3, "kenney/footstep-snow", { gain: 0.25 });
P(CAT + 1.15, "cat", { y: AWAY, show: 0 }, 0);
see(CAT, r3(CAT + 1.1), ["cat"], "a grey tabby cat bolts out past his hooves; he turns to watch it go");
// CHIP crawls out: He can SMELL me?  SPUD: His name comes from claw.
const OUT = r3(CAT + 1.1);
A(OUT - 0.05, "chip", "pitch", { to: 0, dur: 0.01 }); place(OUT, "chip", CHIP_OUT, -60);
A(OUT - 0.02, "chip", "crouch", { to: 0.5, dur: 0.01 }); A(OUT + 0.1, "chip", "crouch", { to: 0, dur: 0.4 });
expr(OUT, "chip", "terrified", 0.01); look(OUT, "chip", [-0.8, 0.1], 0.01); place(OUT, "spud", [1.30, 1.35], 100);
L(16, OUT + 0.25 - now); say(16);
L(17, 0.15); expr(T[17], "spud", "kind"); look(T[17], "spud", [-0.3, -0.25]);
arm(T[17] + 0.1, "spud", "R", { o: [0.18, 0.5, 0.2] }, 0.25, "out"); grip(T[17] + 0.1, "spud", "R", "claw");
say(17);
arm(END_OF(17) + 0.1, "spud", "R", "rest", 0.3); grip(END_OF(17) + 0.1, "spud", "R", "relaxed");

// ================================================================= 44-55 NEXT DOOR: it's real; the swap
const NEXT5 = r3(END_OF(17) + 0.2);
atDoor(NEXT5, 5, { nick: false });   // (Nick is not in the door-5 shot) P(NEXT5, "lane", { visited: 5, tense: 0.5, snowfall: 0.3 }, 0);
place(NEXT5, "chip", [0.55, 1.30], -60); place(NEXT5, "spud", [-0.15, 1.20], -60);
expr(NEXT5, "chip", "terrified", 0.01); look(NEXT5, "chip", [-0.7, 0.35], 0.01); look(NEXT5, "spud", [-0.7, 0.3], 0.01);
bells(NEXT5 + 0.05, 0.6, 4); P(NEXT5 + 0.3, "lane", { shake: 1 }, 1.2, "linear"); sfx(NEXT5 + 0.4, "thud-soft", { gain: 0.5 });
see(NEXT5, r3(NEXT5 + 1.6), ["kr", "lane"], "the Krampus is right next door, bells swinging, snow sliding off the roof above the two little ones");
// CHIP: This is just a story, right?
L(18, NEXT5 + 1.0 - now); say(18);
// SPUD: Every December they still walk the Alps. Hundreds of them.  (a torch-lit Krampus run in a town square)
L(19, 0.15);
const RUN_SQ = r3(T[19] + 0.9);
say(19);
P(RUN_SQ - 0.02, "run", { march: 0.15, show: 1 }, 0); P(RUN_SQ, "run", { march: 0.75 }, r3(END_OF(19) + 0.2 - RUN_SQ), "linear");
see(RUN_SQ, END_OF(19), ["run"], "a real Alpine Krampus run at night: dozens of horned, furry runners with torches and cowbells parade through a snowy square past potato onlookers");
for (let k = 0; k < 6; k++) sfx(r3(RUN_SQ + k * 0.4), "bell-heavy", { gain: 0.25 });
// CHIP: Okay. Last idea.  (Spud turns to watch the street; Chip looks down at the two boots)
const SWAP0 = r3(END_OF(19) + 0.15);
P(SWAP0 - 0.02, "run", { show: 0 }, 0);
place(SWAP0, "spud", [-0.25, 1.25], -75); place(SWAP0, "chip", [0.98, 0.60], 0);
look(SWAP0, "spud", [-0.8, 0.3], 0.01); expr(SWAP0, "spud", "stern", 0.01);
L(20, SWAP0 + 0.2 - now);
expr(T[20], "chip", "smug"); look(T[20], "chip", [0, -0.6]);
say(20);
// the swap (close): his hands go to the pegs, the two drawings cross over
const SWAP = r3(END_OF(20) + 0.2), SWD = 0.7;
arm(SWAP - 0.2, "chip", "R", { world: [N_SPUD0.x, r3(N_SPUD0.y + 0.03), N_SPUD0.z] }, 0.2, "out");
arm(SWAP - 0.2, "chip", "L", { world: [N_CHIP0.x, r3(N_CHIP0.y + 0.03), N_CHIP0.z] }, 0.2, "out");
grip(SWAP, "chip", "R", "pinch"); grip(SWAP, "chip", "L", "pinch");
P(SWAP, "nt", { x: N_SPUD1.x, y: r3(N_SPUD1.y + 0.04), z: N_SPUD1.z, rot: N_SPUD1.rot }, SWD, "inOut");
P(SWAP, "ny", { x: N_CHIP1.x, y: r3(N_CHIP1.y + 0.04), z: N_CHIP1.z, rot: N_CHIP1.rot }, SWD, "inOut");
P(SWAP + SWD, "nt", { y: N_SPUD1.y, swing: 1 }, 0.1); P(SWAP + SWD, "ny", { y: N_CHIP1.y, swing: 1 }, 0.1);
P(SWAP + SWD + 0.1, "nt", { swing: 0, kink: 1 }, 0.5); P(SWAP + SWD + 0.1, "ny", { swing: 0 }, 0.5);
arm(SWAP + 0.05, "chip", "R", { world: [N_CHIP1.x, r3(N_CHIP1.y + 0.03), N_CHIP1.z] }, SWD - 0.05, "inOut");
arm(SWAP + 0.05, "chip", "L", { world: [N_SPUD1.x, r3(N_SPUD1.y + 0.03), N_SPUD1.z] }, SWD - 0.05, "inOut");
sfx(SWAP + 0.1, "cloth", { gain: 0.3 }); sfx(SWAP + SWD, "kenney/impact-wood-light", { gain: 0.2 });
arm(SWAP + SWD + 0.15, "chip", "R", "rest", 0.3); arm(SWAP + SWD + 0.15, "chip", "L", "rest", 0.3);
grip(SWAP + SWD + 0.15, "chip", "R", "relaxed"); grip(SWAP + SWD + 0.15, "chip", "L", "relaxed");
see(SWAP, r3(SWAP + SWD + 0.3), ["nt", "ny", "chip"], "close: his hands swap the two crayon drawings between the teal boot and the yellow boot");

// ================================================================= 55-72 DOOR 4: CHOCOLATE (false close 3), THEN THE LONG PAGE
const D4 = r3(SWAP + SWD + 0.7);
P(D4 - 0.02, "lane", { visited: 4, lit: 4, tense: 0, snowfall: 0.2 }, 0);
place(D4, "spud", SPUD_E, 10); place(D4, "chip", CHIP_E, -10);
expr(D4, "spud", "kind", 0.01); expr(D4, "chip", "eager", 0.01); look(D4, "spud", [0.4, -0.3], 0.01); look(D4, "chip", [-0.1, -0.45], 0.01);
// Nick at the yellow boot (now wearing Spud's drawing): he kneels, reads a short glowing page and smiles
place(D4, "nick", [NICK_Y[0], NICK_Y[2]], 255, 0);
gBook.carry(r3(FL(D4) - 0.005), BOOK_AT([NICK_Y[0], NICK_Y[2]], 255), 0.004, "linear", { rot: BROT(255) });
gBook.carry(r3(D4 + 0.05), BOOK_AT([NICK_Y[0], NICK_Y[2]], 255, 0, 0.14), 0.5, "inOut", { rot: BROT(255) });
P(D4 - 0.02, "kr", { x: K4[0], y: 0, z: K4[2], rot: K4ROT, stoop: 0, jam: 0, ring: 0 }, 0);   // DESIGN K4, the teal boot dead ahead at 0.86
A(D4 + 0.05, "nick", "kneel", { dur: 0.5 });
P(D4, "book", { spread: "good", page: Math.round(pageNow += 1), glow: 1 }, 0.27);
expr(D4 + 0.6, "nick", "happy", 0.3); sfx(D4 + 0.5, "cloth", { gain: 0.3 });
see(D4, r3(D4 + 1.2), ["nick", "book", "by", "nt"], "Saint Nick kneels at the yellow boot (it now wears the teal drawing), reads a short glowing page and smiles");
const POUR = r3(D4 + 1.3);
P(POUR, "by", { treats: 1 }, 1.1, "linear");
for (let k = 0; k < 5; k++) sfx(r3(POUR + k * 0.22), "coins", { gain: 0.35 });
// CHIP: I'm a good kid!
L(21, POUR + 0.6 - now);
expr(T[21] - 0.1, "chip", "delighted"); A(T[21], "chip", "hop", { height: 0.1, dur: 0.35, quiet: true });
say(21);
see(POUR, END_OF(21), ["by", "chip"], "chocolate coins, mandarins and walnuts pour into the yellow boot; the little one beams");
// Nick turns to the teal boot (Chip's drawing on it): the page goes on and on (the roll runs across the snow); he shakes his head
const LONG = r3(END_OF(21) + 0.3);
// (the cut to the reverse shot: he is standing at the teal boot)
A(r3(FL(LONG) - 0.03), "nick", "stand", { dur: 0.005 });
place(LONG, "nick", [NICK_T[0], NICK_T[2]], 160, 0);
gBook.carry(r3(FL(LONG) - 0.005), BOOK_AT([NICK_T[0], NICK_T[2]], 160), 0.004, "linear", { rot: BROT(160) });
P(LONG + 0.1, "lane", { tense: 0.8 }, 0.6);
P(LONG + 0.15, "book", { spread: "long", page: Math.round(pageNow += 1), glow: 0.3 }, 0.27);
expr(LONG + 0.15, "nick", "stern", 0.2);
const ROLL = r3(LONG + 0.5);
P(ROLL, "book", { run: 1 }, 3.0, "out");
sfx(ROLL + 0.1, "cloth", { gain: 0.35 }); sfx(ROLL + 1.2, "cloth", { gain: 0.3 }); sfx(ROLL + 2.3, "cloth", { gain: 0.25 });
look(ROLL, "chip", [-0.5, -0.4], 0.3); expr(ROLL + 0.8, "chip", "worried");
A(ROLL + 2.4, "nick", "turn", { to: 55, dur: 0.18 }); A(ROLL + 2.58, "nick", "turn", { to: 85, dur: 0.18 }); A(ROLL + 2.76, "nick", "turn", { to: 70, dur: 0.16 });
see(ROLL, r3(ROLL + 3.0), ["nick", "book"], "at the teal boot the page goes on and on: a long roll of fries pictures runs across the snow; he shakes his head");
// the Krampus jams the sticks into the teal boot; the bells turn to Spud; the basket lid creaks open toward him
const JAM4 = r3(ROLL + 3.1);
place(JAM4, "nick", [NICK_OFF[0], NICK_OFF[2]], 90, 0);   // he has stepped back to watch (a cut)
gBook.carry(r3(FL(JAM4) - 0.005), BOOK_AT([NICK_OFF[0], NICK_OFF[2]], 90), 0.004, "linear", { rot: BROT(90) });
P(JAM4, "kr", { stoop: 1 }, 0.35); P(JAM4 + 0.35, "kr", { jam: 1 }, 0.18, "in");
P(JAM4 + 0.53, "bt", { sticks: 1 }, 0.13); P(JAM4 + 0.53, "kr", { bunch: 0 }, 0);
sfx(JAM4 + 0.53, "hit-wood", { gain: 0.45 }); bells(JAM4 + 0.35, 0.5, 3);
P(JAM4 + 0.7, "kr", { jam: 0 }, 0.25); P(JAM4 + 0.85, "kr", { stoop: 0, headYaw: 0.5, glow: 1 }, 0.45);
const LIDT = r3(JAM4 + 1.3);
P(LIDT, "kr", { lid: 0.33 }, 0.25); P(LIDT + 0.35, "kr", { lid: 0.66 }, 0.25); P(LIDT + 0.7, "kr", { lid: 1 }, 0.3);
sfx(LIDT, "door-creak", { gain: 0.45 }); sfx(LIDT + 0.5, "door-creak", { gain: 0.35 });
see(JAM4, r3(LIDT + 1.0), ["kr", "bt", "spud"], "the Krampus jams birch sticks into the teal boot and turns to the tall one; his basket lid creaks open toward him");
// SPUD: ...That's not my picture.  CHIP (mouth full of chocolate): It is now.
L(22, LIDT + 0.85 - now);
expr(T[22] - 0.1, "spud", "shocked", 0.2, { open: 0.15 }); look(T[22] - 0.2, "spud", [-0.2, -0.6], 0.2);
say(22);
L(23, 0.2);
expr(T[23] - 0.1, "chip", "smug"); look(T[23], "chip", [-0.3, 0.1]);
say(23, {}, r3(END_OF(23) + 0.3));
const END = F(END_OF(23) + 0.35);   // end on the punchline (Jonny 20 Nov), no tail
for (let t = 0; t < END - 1; t += 5.8) sfx(r3(t), "ai/storm-wind", { gain: 0.05 });

for (const [i, capTo] of CAPS) {
  const nxt = T.slice(i + 1).find((x) => x != null), to = r3(Math.min(END_OF(i) + 0.3, (nxt ?? END + 0.2) - 0.2));
  cap(T[i], capTo ?? to, CAPTEXT[i] ?? LINES[i][1], SUB, false, { size: 64 });
}

// ================================================================= cameras: every shot moves; a new framing on every line
const mv = (s, to, dur, ease = "inOut") => ({ ...s, to: { pos: to.pos ?? s.pos, look: to.look ?? s.look, fov: to.fov ?? s.fov }, dur, ease });
const push = (s, k = 0.06, dur = 2) => mv(s, { pos: s.pos.map((v, i) => r3(v + (s.look[i] - v) * k)) }, dur);
const drift = (s, dx = 0.12, dur = 2, dz = 0) => mv(s, { pos: [r3(s.pos[0] + dx), s.pos[1], r3(s.pos[2] + dz)], look: [r3(s.look[0] + dx * 0.5), s.look[1], r3(s.look[2] + dz * 0.5)] }, dur);
const fr = (target, { lift = 0, ...o }) => { const s = frame([target[0], r3(target[1] + lift * (o.h ?? 1)), target[2]], o); return { pos: s.pos, look: s.look, fov: s.fov }; };
const at = (C, h = 0.45, y = 0) => [C[0], r3(y + h), C[1]];
// the hook (door 9)
const O_BOOT = fr([BOOT_AT(9)[0] + 0.35, Y(9) + 0.55, 0.95], { az: -35, el: 8, h: 1.6, fov: 40 });   // the boot, his hooves and fur behind it
const VILLAGE = { pos: [4.5, 3.4, 7.0], look: [-30, 3.6, 0.5], fov: 50 };   // down the lane, up the hill toward door 9
const KR9_KID = fr([KR_AT(9)[0] - 0.4, Y(9) + 1.6, KR_AT(9)[2] + 0.3], { az: -40, el: 6, h: 2.7, fov: 40 });   // in front of him: the kid held out in his claw, then swung over his shoulder
const KR9_FACE = fr([KR_AT(9)[0], Y(9) + 1.85, KR_AT(9)[2]], { az: -60, el: 2, h: 1.2, fov: 34 });
const O_D9 = fr([X(9) + 0.45, Y(9) + 1.15, 1.1], { az: 18, el: 6, h: 4.0, fov: 44 });
// door 4
const DOWN = fr([0.4, 0.55, 1.1], { az: 60, el: 8, h: 2.2, fov: 44 });   // from down the lane: the pair in the door, their boots
const CHIP_CL = (C, az = 20, y = 0) => fr(at(C, 0.42, y), { az, el: 3, h: 1.3, fov: 42, lift: 0.14 });
const SPUD_CL = (C, az = -20, y = 0) => fr(at(C, 0.72, y), { az, el: 3, h: 1.8, fov: 36, lift: 0.06 });
const NICK_CL = fr([NICK_AT(9)[0] + 0.2, Y(9) + 0.85, NICK_AT(9)[2]], { az: 55, el: 6, h: 2.0, fov: 34 });
const KR_FACE = fr([KR_AT(9)[0], Y(9) + 1.85, KR_AT(9)[2]], { az: -60, el: 2, h: 1.3, fov: 34 });
const KR_BASKET = fr([KR_AT(9)[0] + 0.3, Y(9) + 1.7, KR_AT(9)[2] - 0.2], { az: 50, el: 14, h: 1.5, fov: 36 });
// polish, door 8
const POL_S = fr([CHIP_POL[0] + 0.1, 0.5, CHIP_POL[1]], { az: 10, el: 4, h: 1.5, fov: 40, lift: 0.08 });
const POL_TWO = fr([0.65, 0.55, 1.3], { az: 8, el: 5, h: 2.1, fov: 40, lift: 0.08 });
const D8_S = fr([X(8) + 0.15, Y(8) + 1.0, 1.1], { az: 10, el: 6, h: 3.8, fov: 42 });
// hide, door 6
const HIDE_S = fr([2.0, 0.5, 0.95], { az: 35, el: 6, h: 2.0, fov: 44, lift: 0.06 });
const PILE_S = fr([2.95, 0.35, 0.55], { az: -70, el: 12, h: 1.7, fov: 44 });
const SNIFF_S = fr([KR_AT(6)[0], Y(6) + 1.6, KR_AT(6)[2]], { az: -35, el: 3, h: 2.2, fov: 38 });
const CAT_S = fr([KR_AT(6)[0] - 0.1, Y(6) + 0.45, KR_AT(6)[2] + 0.55], { az: 8, el: 10, h: 2.2, fov: 44 });
const OUT_S = fr([CHIP_OUT[0] - 0.3, 0.45, CHIP_OUT[1] + 0.15], { az: -15, el: 4, h: 1.7, fov: 40, lift: 0.06 });
// next door
const NEXT_S = { pos: [1.7, 1.2, 2.7], look: [-5.6, 1.6, 1.0], fov: 44 };   // over their shoulders, up the lane to door 5
const RUN_S = { pos: [400.4, 1.15, 7.8], look: [400, 1.35, -4], fov: 46 };   // the bench's panel-19 framing
const SWAP_S = fr([0.38, 0.55, 0.9], { az: 8, el: 6, h: 2.5, fov: 42 });
const NOTES_CL = fr([1.12, 0.31, 1.08], { az: 0, el: 12, h: 0.55, fov: 34 });
// the payoff
const POUR_S = fr([1.7, 0.5, 0.95], { az: -40, el: 8, h: 1.9, fov: 40 });
const CHIP_E_CL = CHIP_CL(CHIP_E, -20);
const LONG_S = { pos: [0.45, 0.95, 0.25], look: [0.55, 0.55, 2.1], fov: 50 };   // reverse: from the door over the boots at Nick
const JAM_S = fr([0.5, 0.95, 0.85], { az: 5, el: 6, h: 2.7, fov: 40 });
const SPUD_E_CL = SPUD_CL(SPUD_E, 0);
const LAST = fr([1.2, 0.5, 0.75], { az: 0, el: 6, h: 1.7, fov: 40, lift: 0.04 });

const beats = c.beats([
  ["the village", 0, mv(VILLAGE, { pos: [2.5, 3.2, 6.2], look: [-30, 3.7, 0.6] }, KR_CUT), "hook"],
  ["krampus face", KR_CUT, push(KR9_FACE, 0.1, SH - KR_CUT)],
  ["boot and shadow", SH, push(O_BOOT, 0.12, D9T - SH)],
  ["door nine", D9T, push(O_D9, 0.08, KID9 - D9T)],
  ["the kid", KID9, push(KR9_KID, 0.08, WHIP - KID9)],
  ["number nine", r3(T[1] - 0.25), push(DOWN, 0.08, 2.4)],
  ["who are they", r3(T[2] - 0.15), push(CHIP_CL(CHIP0, 25), 0.06, 1.5)],
  ["saint nick", r3(T[3] - 0.05), drift(SPUD_CL(SPUD0, -20), 0.1, PAGE1 - T[3] + 0.05)],
  ["the golden book", PAGE1, push(NICK_CL, 0.1, END_OF(3) - PAGE1 + 0.15)],
  ["bad kids get him", r3(T[4] - 0.05), push(KR_FACE, 0.08, END_OF(4) - T[4] + 0.2)],
  ["really bad kids", r3(T[5] - 0.05), push(CHIP_CL(CHIP0, 20), 0.06, BASKET - T[5] + 0.05)],
  ["the basket", BASKET, push(KR_BASKET, 0.1, 1.2)],
  ["my boot is dirty", POL, push(POL_S, 0.08, T[7] - POL)],
  ["clean their boots", r3(T[7] - 0.05), drift(POL_TWO, 0.15, RUB_END - T[7] + 0.05)],
  ["done good kid", r3(T[8] - 0.1), push(POL_S, 0.1, D8T - T[8] + 0.1)],
  ["door eight", D8T, push(D8_S, 0.08, D8E - D8T + 0.05)],
  ["checks the book", r3(T[9] - 0.05), push(POL_TWO, 0.06, T[10] - T[9])],
  ["my page", r3(T[10] - 0.05), push(CHIP_CL(CHIP_POL, 15), 0.06, T[11] - T[10])],
  ["the fries", r3(T[11] - 0.05), push(SPUD_CL([0.25, 1.10], -10), 0.06, T[12] - T[11])],
  ["one time", r3(T[12] - 0.05), push(CHIP_CL(CHIP_POL, 10), 0.08, T[13] - T[12])],
  ["every tuesday", r3(T[13] - 0.05), push(SPUD_CL([0.25, 1.10], -25), 0.06, HIDE0 - T[13] + 0.05)],
  ["doesn't find me", HIDE0, drift(HIDE_S, 0.2, DIVE + 0.55 - HIDE0)],
  ["the trainers", r3(DIVE + 0.55), push(PILE_S, 0.06, SNIFF - DIVE - 0.55)],
  ["he sniffs", SNIFF, push(SNIFF_S, 0.1, CAT - SNIFF)],
  ["the cat", CAT, drift(CAT_S, -0.4, OUT - CAT)],
  ["smell me", OUT, push(OUT_S, 0.08, T[17] - OUT)],
  ["claw", r3(T[17] - 0.05), push(SPUD_CL([1.30, 1.35], 30), 0.06, NEXT5 - T[17] + 0.05)],
  ["next door", NEXT5, push(NEXT_S, 0.08, T[19] - NEXT5)],
  ["the alps", r3(T[19] - 0.05), push(SPUD_CL([-0.15, 1.20], -30), 0.06, RUN_SQ - T[19] + 0.05)],
  ["krampus run", RUN_SQ, mv(RUN_S, { pos: [400.2, 1.1, 7.2] }, SWAP0 - RUN_SQ)],
  ["last idea", SWAP0, push(SWAP_S, 0.08, SWAP - SWAP0)],
  ["the swap", SWAP, push(NOTES_CL, 0.1, D4 - SWAP), "insert"],
  ["good page", D4, push(POUR_S, 0.08, T[21] - D4 - 0.05)],
  ["good kid", r3(T[21] - 0.05), push(CHIP_E_CL, 0.06, LONG - T[21] + 0.05)],
  ["the long page", LONG, mv(LONG_S, { pos: [LONG_S.pos[0] + 0.4, LONG_S.pos[1], LONG_S.pos[2] + 0.2] }, JAM4 - LONG), "escalation"],
  ["sticks for spud", JAM4, push(JAM_S, 0.08, T[22] - JAM4 - 0.05)],
  ["not my picture", r3(T[22] - 0.05), push(SPUD_E_CL, 0.08, T[23] - T[22])],
  ["it is now", r3(T[23] - 0.1), push(LAST, 0.08, END - T[23] + 0.1), "payoff"],
], END);

// the light per act (DESIGN 7): a keyed grade on the finished picture
const grade = [
  [0, { w: -0.25, s: 1.02 }],
  [r3(WHIP), { w: -0.1 }, 0.3],
  [r3(SNIFF), { w: -0.35, s: 0.95 }, 0.6],
  [r3(RUN_SQ - 0.02), { w: 0.35, s: 1.1 }],
  [r3(SWAP0 - 0.02), { w: -0.15, s: 1.0 }],
  [r3(D4), { w: 0.3, s: 1.08, lift: 0.02 }, 0.8],
  [r3(LONG + 0.4), { w: -0.3, s: 0.98, lift: 0 }, 1.0],
];

write(import.meta.url, {
  id: "boots",
  title: "One night a year he checks your boots",
  idea: "Krampus myth (heart-video recipe): the Krampus and Saint Nick check the boots door by door down an Alpine lane; Chip polishes his boot, hides in the woodpile, and finally swaps the drawings on the boots, so Spud's boot gets the birch sticks.",
  fps: 30, look: "anime-pro", profile: "short", loop: false, far: 320,
  captionBand: [150, 1360], captionStyle: "kinetic",
  castLook: "sheet", cleanStart: true,
  motion: { feet: 2, overlap: true, timing: true, solve: true },
  rig: { hand: 2, eyes: 2, hold: 2 },
  physics: true, animeTiming: true,
  set: { type: "plain", color: "#0e1630", floor: "none", night: true, key: [-0.62, 0.47, 0.63], light: "soft", para: 0, aperture: 0,
    lighting: { v: 2, measure: false, key: [-0.62, 0.47, 0.63], light: "#b9cdf5", shadow: "#34428a", rim: "#9fb4e8", exposure: 0.95 },
    hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true, satsuei: true, vignette: 0.25 },
  grade,
  music: { file: "krampus-myth/boots-score.ogg", lock: false, dip: false, lowCut: 90, gain: 0.45 },   // make-score.mjs
  sound: { sfx: 0.6, ambience: 0.05, guard: true, signature: false, surface: "snow" },
  creative: { length: [60, 95] },
  hook: { show: ["b9", "shadow"], hint: 0, what: "a small red boot on a snowy doorstep at night; a huge horned shadow with bells falls over it" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    { who: "chip", with: "lane", from: r3(DIVE - 0.05), to: r3(OUT), checks: ["clipping", "body-in-prop", "leg-in-prop", "costume-in-prop", "shell", "hand-in-prop", "arm-in-prop"], reason: "he lies inside the woodpile's hollow (DESIGN A: x 2.80..3.60, 0.66 high), only his trainers out" },
    { who: "nick", with: "lane", from: r3(D4), to: r3(LONG + 0.4), checks: ["costume-in-prop", "leg-in-prop", "clipping", "shell"], reason: "kneeling, the cope lies on the snow of the apron (DESIGN C)" },
    { who: "chip", with: "by", from: r3(POL), to: r3(HIDE0), checks: ["hand-in-prop", "arm-in-prop"], reason: "he holds and scrubs his boot" },
    { who: "nick", with: "book", from: 0, to: END, checks: ["hand-in-prop", "arm-in-prop"], reason: "his palms hold the golden book's edges all film (grips.box)" },
    { who: "chip", from: r3(SWAP - 0.25), to: r3(SWAP + SWD + 0.4), checks: ["face-covered"], reason: "the insert on his hands swapping the drawings: the hands are the shot" },
    { who: "spud", with: "lane", from: r3(SWAP0 - 0.1), to: END, checks: ["shell"], reason: "he stands in the snow banked 0.25 against the plinth (DESIGN A house kit): feet in the snow" },
    { who: "chip", with: "lane", from: r3(SWAP0 - 0.1), to: END, checks: ["shell"], reason: "he stands in the snow banked 0.25 against the plinth (DESIGN A house kit): feet in the snow" },
    { who: "kv", from: 0, to: END, checks: ["clipping", "body-in-prop"], reason: "the kid's voice is an unseen speaker parked off every set" },
    { who: "chip", with: "by", from: r3(T[8] - 0.2), to: r3(T[9] + 1.1), checks: ["held-high"], reason: "'Done. Good kid.': he holds the polished boot up to show it" },
  ],
  notes: "Generated by storyboards/series/krampus-myth/01-boots/make-boots.mjs.",
});
console.log("T:", T.map((t, i) => `${i}:${t}`).join(" "));
console.log({ D9T, WHIP, PAGE1, BASKET, POL, RUB, D8T, HIDE0, DIVE, SNIFF, CAT, OUT, NEXT5, RUN_SQ, SWAP0, SWAP, D4, POUR, LONG, ROLL, JAM4, LIDT, END });
