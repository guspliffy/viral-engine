// SHARE OR STEAL, season 1 episode 1: GUNSLINGER VS VIKING (9 Nov 2026), from the clip template. Written by the
// director (Opus) thread; builders made the props only (props-sos.js, props-sos-set.js).
//   node storyboards/series/share-or-steal/01-gunslinger-viking/make-gunslinger-viking.mjs -> gunslinger-viking.json
// Brief: /mnt/project-files/video-scripts/2026-11-09-share-or-steal/00-SERIES-FORMAT.md (Jonny 9 Nov 13:01 + 13:14).
// No panels: the brief's beat grid is the target. BOARD.md and PANELS.md next to this file.
//
// THE BRIEF (20-24 s; Gunslinger, Viking; the dark studio)
//   Joke:        a trust game over a deep fryer. Gunslinger, who never has money and owes Viking, begs him to trust
//                him in three stair-stepped pleas; Viking melts and shares; Gunslinger steals.
//   Wants:       Gunslinger wants the whole pile; Viking wants his friend to be honest for once.
//   Consequence: Viking's chair tips back through the trapdoor: splash, sizzle, a column of steam over the empty chair.
//   Ending:      Gunslinger hugs the gold. "Gunslinger spent it all by Friday." Then "Share... or steal?", hard cut.
//   Callback:    frame 0 his mitten is already creeping onto the gold and Viking pats it away: the promise ("share")
//                breaks in the first second; at the end he holds all of it.
import { clip, write, r3, frame, SUB_STYLE } from "../../../lib/clip.mjs";
import * as act from "../../../lib/acting.mjs";
import { rule } from "../../../lib/overlay.mjs";
import { patProps, pocketPat, PAT } from "../../never-has-money/pocket-pat.mjs";

const c = clip({ faces: "strong", lines: { sub: true, blink: false } }), { A, sfx, see, cap } = c;

// ---------------------------------------------------------------- helpers (degrees; yaw + turns +z toward +x)
const rad = (d) => (d * Math.PI) / 180;
const dirOf = (yaw) => [Math.sin(rad(yaw)), Math.cos(rad(yaw))];
const leftOf = (yaw) => [Math.cos(rad(yaw)), -Math.sin(rad(yaw))];   // the character's own left (screen right at yaw 0)
// a point from someone at [x, z] facing yaw: f metres ahead, s metres to their own left, at height y
const rotY = ([x, y, z], d) => { const a = rad(d); return [x * Math.cos(a) + z * Math.sin(a), y, -x * Math.sin(a) + z * Math.cos(a)]; };
const P = ([x, z], yaw, f, s = 0, y) => { const d = dirOf(yaw), l = leftOf(yaw); const p = [r3(x + f * d[0] + s * l[0]), r3(z + f * d[1] + s * l[1])]; return y == null ? p : [p[0], y, p[1]]; };

// ---------------------------------------------------------------- the studio (world metres; the camera at +z)
// One round table in the middle under the spotlight, the gold on it. The two players sit behind it at its back left
// and back right, each turned 40 deg toward the table's middle (and so 3/4 to the camera): faces read, and they can
// look at each other with a head turn. The fryer stands behind the table between them (BOARD §2, departure: in 9:16
// beside the table would squeeze them), each player's trapdoor 0.75 m behind his chair.
const TR = 0.6, TH = 0.62;                       // the table: radius, top (0.6: two cards each and the gold fit with room)
const SEAT_D = r3(TR + 0.5);                     // chair middle to the table's middle (a standing body clears the edge)
const G_YAW = 40, V_YAW = -40;   // 40, not 52: the payoff faces stay inside 45 deg of the camera (workflow.md) with room for a look
const G = P([0, 0], 180 + G_YAW, SEAT_D).map((v) => r3(v));   // (-0.71, -0.84)
const V = [r3(-G[0]), G[1]];
const TRAP_BACK = 0.7;
const GT = P(G, G_YAW, -TRAP_BACK), VT = P(V, V_YAW, -TRAP_BACK);
const FZ = -1.85;                                // the fryer's middle (z)
const GOLD = [0, r3(TH + 0.002), 0.02], GOLD_SCALE = 0.8;   // the pile at 0.8: 0.34 x 0.27
// the cards (0.2 x 0.28 at scale 1; 0.75 here, 0.15 x 0.21, so four fit round the pile on a 0.6 m table): two in front
// of each player, 0.36 m from the middle (clear of the heap's 0.18 x 0.14 rim), 16 deg either side of the line to him
// (k 0 on the camera side, k 1 behind it), square to the camera (rot 0) so the word reads to us when it turns. At 0 he
// pushes the chosen one (k 0) 8 cm toward us (PUSHED) and later flips it where it lies: no long reach over the table.
// His resting hands lie outside them, near the edge (ONTABLE): flat fingers over a card went into it.
const CARD_R = 0.36, CARD_SCALE = 0.75;
const cardAng = (who, k) => { const [x, z] = who === "gsl" ? G : V, base = Math.atan2(x, z); return base + (k ? -1 : 1) * Math.sign(base) * -rad(16); };
const cardAt = (who, k) => { const a = cardAng(who, k); return [r3(CARD_R * Math.sin(a)), r3(TH + 0.001), r3(CARD_R * Math.cos(a))]; };
const PUSHED = Object.fromEntries(["gsl", "vik"].map((w) => { const [x, y, z] = cardAt(w, 0); return [w, [x, y, r3(z + 0.08)]]; }));

const cast = [
  { id: "gsl", character: "never-has-money/gunslinger", at: G, face: G_YAW, expr: "eager", follow: 0.3, seed: 1.3 },
  { id: "vik", character: "always-orders-potatoes/viking", at: V, face: V_YAW, expr: "kind", follow: 0.3, seed: 4.1 },
];
const card = (id, who, k, face) => { const [x, y, z] = cardAt(who, k); return { id, kind: "sscard", face, x, y, z, rot: 0, scale: CARD_SCALE, flip: 0, glow: 0 }; };
const props = [
  { id: "studio", kind: "ssstudio", x: 0, z: 0, dim: 0 },
  { id: "fryer", kind: "ssfryer", x: 0, z: FZ, w: 1.3, d: 0.75, h: 1.0, castLight: 1.0, haze: 0.6, churn: 0.3 },   // review A: orange and seething from frame 0 (stakes by 1.5 s)
  { id: "oil", kind: "fryoil", x: 0, y: 0.92, z: FZ, w: 1.18, d: 0.62 },
  // turned 45 deg: the checks measure the round top by its square box, whose corners would point at the two players
  { id: "table", kind: "sostable", x: 0, z: 0, rot: 45, r: TR, h: TH },
  { id: "gold", kind: "goldpile", x: GOLD[0], y: GOLD[1], z: GOLD[2], scale: GOLD_SCALE },
  { id: "chairG", kind: "sschair", x: G[0], z: G[1], rot: G_YAW, tip: 0 },
  { id: "chairV", kind: "sschair", x: V[0], z: V[1], rot: V_YAW, tip: 0 },
  { id: "trapG", kind: "sstrap", x: GT[0], z: GT[1], rot: G_YAW, open: 0, warn: 0, steam: 0, rise: 0 },
  { id: "trapV", kind: "sstrap", x: VT[0], z: VT[1], rot: V_YAW, open: 0, warn: 0, steam: 0, rise: 0 },
  card("gSteal", "gsl", 0, "steal"), card("gShare", "gsl", 1, "share"),   // he picks k 0: STEAL
  card("vShare", "vik", 0, "share"), card("vSteal", "vik", 1, "steal"),   // Viking picks k 0: SHARE
];

// keys props3d.js propState doesn't start (warn, churn, dim) get a number at t 0, so their first tween eases, not steps
for (const id of ["trapG", "trapV"]) c.prop(0, id, { warn: 0 }, 0.01);
c.prop(0, "fryer", { churn: 0.3 }, 0.01); c.prop(0, "studio", { dim: 0 }, 0.01);

// ---------------------------------------------------------------- the clock (story seconds)
// Host lines are the measured reads of voice 5 (narrator-trailer) in the "game-show host" style (BOARD §2).
// Takes (out/sos-voice/run2.log, Whisper word times): intro take 0 (2.51 s), rules take 1 (5.69 s: "One steals" at
// +1.51, "Both steal" at +3.17), end line take 0 (2.23 s, the dry style), the question take 1 (2.21 s).
const T = {
  intro: 0.05,      // "One pile of gold. One fryer."
  rules: 2.35,      // "Both share, you split it. One steals, the other one fries. Both steal, you both fry."
};
T.count = r3(T.rules + 5.5);                      // the countdown 10 .. 0 starts on "fry" (the beeps say "ten seconds")
T.plea1 = r3(T.count + 0.3);
T.owe = r3(T.plea1 + 0.9);
T.plea2 = r3(T.owe + 0.7);                        // he stands and steps out; the pocket pat follows
T.pat = r3(T.plea2 + 0.88);                       // the pocket pat block's 1.5 s (its 1.47 .. 2.84 lands at pat - 0.03 .. pat + 1.34)
T.plea3 = r3(T.pat + 2.0);                       // the wallet back in the holster, then the dash round the front of the table
T.kneel = r3(T.plea3 + 1.05);
T.okay = r3(T.kneel + 0.85);
T.back = r3(T.okay + 0.45);                       // he scrambles back to his chair
T.sit = r3(T.back + 0.95);
T.zero = r3(T.sit + 0.5);                         // 0: the bell, the cards slide (he is down in his chair first)
T.step = r3((T.zero - T.count) / 10);             // a second of the countdown on screen (~0.77 s)
T.slide = T.zero;                                 // Viking pushes his card at slide - 0.1, Gunslinger at slide + 0.12
T.flip1 = r3(T.zero + 0.7);                       // Viking: SHARE
T.flip2 = r3(T.flip1 + 1.2);                      // Gunslinger: STEAL (the payoff)
T.warn = r3(T.flip2 + 0.85);                      // his hurt face holds before the trap arms
T.drop = r3(T.warn + 0.6);                        // the DROP shot cuts in at warn + 0.28: his look down at the lit rim first
T.splash = r3(T.drop + 0.42);
T.hug = r3(T.splash + 0.65);
T.endLine = r3(T.splash + 0.55);
T.ask = r3(T.endLine + 2.15);
const END = r3(T.ask + 1.8);

// ---------------------------------------------------------------- the host (voice 5, never on screen)
const HOST = "deep, dark game-show host, fast and clipped, tense", DRY = "deep, dry, deadpan narrator, unhurried";
const host = (t, line, { take = 0, style = HOST } = {}) => c.at(t, { macro: "narrate", line, voice: "narrator-trailer", style, take, caption: false });
host(T.intro, "One pile of gold. One fryer.");
host(T.rules, "Both share, you split it. One steals, the other one fries. Both steal, you both fry.", { take: 1 });
host(T.endLine, "Gunslinger spent it all by Friday.", { style: DRY });
host(T.ask, "Share... or steal?", { take: 1 });

// ---------------------------------------------------------------- text: title, rules, countdown, end card
// subtitles: low (y 1190) over the table where it is free; during the countdown the pleas are close and the bodies fill
// the low band, so the lines sit in the free band above the heads (y 262), left of the countdown in the top-right corner
const SUB_LO = 1190, TOP = { pos: 262, style: { ...SUB_STYLE, x: 400 } };
cap(0, r3(T.rules - 0.05), "SHARE OR *STEAL*", 250, false, { size: 120, kinetic: false });
// the rules, one card per sentence as the host says it (the third is the proposal Jonny confirms on review)
rule(c, T.rules, 1.48, "SHARE + SHARE", "Split the gold", { color: "#2fae58", y: 300 });
rule(c, r3(T.rules + 1.51), 1.62, "STEAL + SHARE", "The sharer fries", { color: "#ff8a2a", y: 300 });
rule(c, r3(T.rules + 3.17), r3(T.count - T.rules - 3.2), "STEAL + STEAL", "You both fry", { color: "#e0283c", y: 300 });
// the countdown: one big number a step, white, the last three red, a beep on each; a heartbeat under the last three
for (let i = 0; i <= 10; i++) {
  const t = r3(T.count + i * T.step), n = 10 - i, hot = n <= 3;
  c.at(t, { fx: "pop", text: String(n), xy: [800, 300], size: n === 0 ? 180 : 150, dur: n === 0 ? 0.6 : r3(T.step - 0.04), angle: 0, color: hot ? "#ff3b4a" : "#ffffff" });
  if (n > 0) sfx(t, "timer-beep", { gain: hot ? 0.55 : 0.4, reason: "the countdown's beep (the game's clock)" });
  if (n <= 3 && n > 0) sfx(r3(t + 0.05), "ai/heartbeat", { gain: 0.5, reason: "a heartbeat under the last three seconds" });
}
sfx(T.zero, "bell-heavy", { gain: 0.6, reason: "0: the game's dark bell" });
// the end card: the dry line, then the question, over the picture
cap(T.endLine, r3(T.ask - 0.05), "Gunslinger spent it all by Friday.", 300, false, { kinetic: false });
cap(T.ask, END, "SHARE… or *STEAL?*", 300, true, { size: 120, kinetic: false });

// ---------------------------------------------------------------- the room's sound: the fryer
sfx(0, "bubbling", { dur: r3(END), gain: 0.22, reason: "the deep fryer bubbling behind the table, the whole clip" });
sfx(0, "rumble", { dur: r3(T.zero), gain: 0.18, reason: "the studio's low hum under the game, up to the bell" });

// ---------------------------------------------------------------- frame 0 + HOOK 0-2.3: the gold, the fryer, his mitten on the pile
A(0, "gsl", "sit", { seat: "chairG", dur: 0.01, hands: "keep" });
A(0, "vik", "sit", { seat: "chairV", dur: 0.01, hands: "keep" });
// hands on the table: world points on its top, 0.5 m from the middle and 36 deg either side of the line to him (an
// arm pose relative to the body put them on the gold rim, fingers over the edge): the hand toward the camera (his
// right, Viking's left) beyond his front card, the other behind his back card
const ONTABLE = (who, s) => {
  const [x, z] = who === "gsl" ? G : V, base = Math.atan2(x, z), front = (who === "gsl" ? s === "R" : s === "L");
  const a = base + (front ? 1 : -1) * Math.sign(base) * -rad(30);
  // a hand on a prop with palm: true lies palm down on it (a world point kept the forearm's slope: fingers 5 cm in);
  // the table is turned 45 deg, so the point goes into its own frame
  const [lx, , lz] = rotY([0.56 * Math.sin(a), 0, 0.56 * Math.cos(a)], -45);
  return { prop: "table", grip: [r3(lx), r3(TH + 0.035), r3(lz)], palm: [r3(lx), r3(TH - 0.4), r3(lz)] };   // palm down: it faces a point under the grip
};
for (const s of ["R", "L"]) { c.arm(0, "vik", s, ONTABLE("vik", s), 0); A(0, "vik", "grip", { side: s, shape: "flat", dur: 0 }); }
c.arm(0, "gsl", "L", ONTABLE("gsl", "L"), 0); A(0, "gsl", "grip", { side: "L", shape: "flat", dur: 0 });
// frame 0: his right mitten already creeping onto the gold, his eyes on it, a greedy little smile
const GOLD_NEAR = (who) => { const [x, z] = who === "gsl" ? G : V; const k = 0.19 / Math.hypot(x, z - GOLD[2]); return [r3(GOLD[0] + x * k), r3(GOLD[1] + 0.13), r3(GOLD[2] + (z - GOLD[2]) * k)]; };
c.arm(0, "gsl", "R", { world: GOLD_NEAR("gsl") }, 0); A(0, "gsl", "grip", { side: "R", shape: "open", dur: 0 });
A(0, "gsl", "look", { to: [0.35, -0.45], dur: 0, blink: false });
A(0, "gsl", "expr", { expr: "cocky", set: { curve: 0.45, smirk: 0.3 }, dur: 0 });
A(0, "vik", "look", { to: [-0.5, -0.35], dur: 0, blink: false });
A(0, "vik", "expr", { expr: "kind", set: { curve: 0.2 }, dur: 0 });
// 0.55: Viking's big mitten pats down on his (a "tsk"); Gunslinger snatches it back with an innocent grin
const PAT_ON = GOLD_NEAR("gsl").map((v, i) => r3(i === 1 ? v + 0.07 : v));
c.arm(0.12, "vik", "R", { world: PAT_ON }, 0.43, "inOut");
A(0.4, "vik", "expr", { expr: "stern", set: { curve: -0.1 }, dur: 0.25 }); A(0.4, "vik", "face", { brow: -0.15, lid: 0.25, dur: 0.25 });
sfx(0.55, "thud-soft", { gain: 0.55, reason: "Viking's mitten pats down on Gunslinger's on the gold" });
c.arm(0.6, "gsl", "R", { o: [-0.16, 0.4, 0.3] }, 0.45, "inOut"); A(0.6, "gsl", "grip", { side: "R", shape: "relaxed", dur: 0.2 });   // snatched back to his chest: "who, me?"
c.arm(1.7, "gsl", "R", ONTABLE("gsl", "R"), 0.55, "inOut"); A(2.0, "gsl", "grip", { side: "R", shape: "flat", dur: 0.2 });   // and down on the table's edge (a straight line from the gold crossed his card)
c.arm(0.68, "vik", "R", ONTABLE("vik", "R"), 0.6, "inOut");
A(0.62, "gsl", "look", { to: [0.55, 0.05], dur: 0.1, blink: false });
act.grin(c, 0.66, "gsl");
A(0.95, "vik", "expr", { expr: "kind", set: { curve: 0.1 }, dur: 0.35 }); A(0.95, "vik", "face", { brow: 0, lid: 0.1, dur: 0.35 });
see(0, 0.6, ["gsl.face", "vik.face", "gold"], "frame 0: the gold between them, his mitten on it, the fryer behind");

// ---------------------------------------------------------------- RULES 2.3-7.4: both look at the fryer, then at each other
A(r3(T.rules + 2.05), "vik", "look", { to: [-0.15, 0.1], dur: 0.2, blink: false });   // "the other one fries": over his shoulder at the fryer
A(r3(T.rules + 2.1), "gsl", "look", { to: [0.15, 0.1], dur: 0.2, blink: false });
sfx(r3(T.rules + 2.85), "steam", { gain: 0.25, reason: "a hiss of steam off the fryer as the host says 'fries'" });
c.prop(r3(T.rules + 2.8), "fryer", { churn: 0.8 }, 0.2, "out");
c.prop(r3(T.rules + 3.6), "fryer", { churn: 0.3 }, 0.6, "inOut");
A(r3(T.rules + 2.9), "vik", "expr", { expr: "shocked", set: { open: 0.15, eye: 1.1 }, dur: 0.25 }); A(r3(T.rules + 2.9), "vik", "face", { brow: 0.35, dur: 0.25 });
A(r3(T.rules + 4.0), "vik", "look", { to: [-0.55, -0.05], dur: 0.2, blink: false });   // "both steal": at each other
A(r3(T.rules + 4.0), "gsl", "look", { to: [0.55, -0.05], dur: 0.2, blink: false });
A(r3(T.rules + 4.6), "vik", "expr", { expr: "stern", set: { curve: -0.05 }, dur: 0.3 }); A(r3(T.rules + 4.6), "vik", "face", { brow: -0.1, lid: 0.25, dur: 0.3 });
A(r3(T.rules + 4.6), "gsl", "expr", { expr: "eager", set: { curve: 0.4 }, dur: 0.3 });

// ---------------------------------------------------------------- PLEA 1: "I'll share, I swear!" (hand on heart)
c.arm(r3(T.plea1 - 0.2), "gsl", "R", { o: [-0.22, 0.42, 0.32] }, 0.55, "inOut"); A(T.plea1, "gsl", "grip", { side: "R", shape: "flat", dur: 0.15 });
A(T.plea1, "gsl", "pitch", { to: 6, dur: 0.25 });
A(T.plea1, "gsl", "expr", { expr: "eager", set: { curve: 0.55, open: 0.2, raise: 0 }, dur: 0.2 }); A(T.plea1, "gsl", "face", { brow: 0.4, dur: 0.2 });
c.say(r3(T.plea1 + 0.1), "gsl", "I'll share, I swear!", 0.75, "excited", { voice: false, sub: "I'll share, I swear!", ...TOP });
see(T.plea1, r3(T.plea1 + 0.9), ["gsl.face", "vik.face"], "plea 1: his hand on his heart, Viking watching");
// Viking: arms folded, one brow up: "You still owe me fifty!"
// Viking: one finger up off the table ("uh-uh"), one brow up: "You still owe me fifty!"
c.arm(r3(T.owe - 0.45), "vik", "R",  { o: [0, 0.4, 0.55] }, 0.45, "inOut");   // out over the table straight out in front of his right shoulder (o[0] is OUT from his side: < 0 crossed his face, > 0.3 hid behind his fur): the finger follows the forearm
for (const t of [0.15, 0.45]) { c.arm(r3(T.owe + t), "vik", "R", { o: [0, 0.48, 0.55] }, 0.12, "inOut"); c.arm(r3(T.owe + t + 0.13), "vik", "R",  { o: [0, 0.4, 0.55] }, 0.12, "inOut"); }   // two wags
A(r3(T.owe - 0.1), "vik", "look", { to: [-0.55, -0.05], dur: 0.12, blink: false });
A(r3(T.owe - 0.2), "vik", "grip", { side: "R", shape: "point", dur: 0.12 });
c.arm(r3(T.owe + 0.75), "vik", "R", ONTABLE("vik", "R"), 0.5, "inOut"); A(r3(T.owe + 1.0), "vik", "grip", { side: "R", shape: "flat", dur: 0.15 });
A(r3(T.plea1 + 0.55), "vik", "expr", { expr: "annoyed", set: { raise: 0.05 }, dur: 0.25 }); A(r3(T.plea1 + 0.55), "vik", "face", { lid: 0.35, dur: 0.25 });
c.say(T.owe, "vik", "you still owe me fifty!", 0.75, "calm", { voice: false, sub: "You still owe me 50!", ...TOP });
see(T.owe, r3(T.owe + 0.8), ["vik.face"], "Viking, suspicious: you still owe me");

// ---------------------------------------------------------------- PLEA 2: he stands, the pocket pat: empty, a moth
c.arm(r3(T.plea2 - 0.2), "gsl", "R", "rest", 0.4, "inOut"); c.arm(r3(T.plea2 - 0.2), "gsl", "L", "rest", 0.4, "inOut");
A(r3(T.plea2 - 0.05), "gsl", "pitch", { to: 0, dur: 0.2 });
A(T.plea2, "gsl", "stand", { dur: 0.22 });
// he steps out from behind the table to its left front (clear of its edge and of his chair, and in the open for the
// pat), still facing the way his chair does; the block wants him dead still from its first frame
const GS = [-1.21, -0.19];   // clear of his chair's wide back on his left (his hanging left hand went into it)
A(r3(T.plea2 - 0.08), "gsl", "look", { to: [-0.3, -0.1], dur: 0.12, blink: false });   // eyes first: where he steps
A(r3(T.plea2 + 0.2), "gsl", "move", { to: GS, dur: 0.66, steps: 5 });   // 0.6 m once he is up: quick steps, feet planted
// the pocket pat block on its own clock (1.5 .. 2.8 in the block), moved to T.pat
const dt = r3(T.pat - PAT.from);
const shifted = { ...c, A: (t, ...r) => c.A(r3(t + dt), ...r), arm: (t, ...r) => c.arm(r3(t + dt), ...r), prop: (t, ...r) => c.prop(r3(t + dt), ...r),
  sfx: (t, ...r) => c.sfx(r3(t + dt), ...r), see: (a, b, ...r) => c.see(r3(a + dt), r3(b + dt), ...r), at: (t, it) => c.at(r3(t + dt), it), macro: (t, ...r) => c.macro(r3(t + dt), ...r) };
// the wallet waits in his holster (part of his costume: hidden) until his hand gets there, as in NHM EP04
c.at(r3(T.pat + 0.78), { do: "prop", id: "wallet", set: { scale: 1 }, dur: 0.04, ease: "out", reason: "the top of the wallet shows in the holster as his hand gets there" });
pocketPat(shifted, { who: "gsl", at: GS, yaw: G_YAW, friend: [0.6, 0.05], hold: [0.04, 0.4, 0.42] });   // the open wallet held at his chest, under his eyes
// his left hand under the wallet relaxed: the block's palm-up cup flickered between its two turns on the held
// drawings (75-134 deg a frame)
A(r3(T.pat + 1.03), "gsl", "grip", { side: "L", shape: "relaxed", dur: 0.08 });
const HOLSTER = patProps({ who: "gsl", at: GS, yaw: G_YAW })[0];
props.push(...patProps({ who: "gsl", at: GS, yaw: G_YAW }).map((q) => (q.id === "wallet" ? { ...q, scale: 0.001, staged: "down in his holster (part of his costume) until he draws it" } : q)));
// the wallet back in the holster (EP04's moves): it folds shut, his hand takes it down, lets go, and it's gone
c.prop(r3(T.pat + 1.5), "wallet", { open: 0 }, 0.1, "inOut");   // open pat + 1.0 .. 1.45 in his medium (review A: 0.25 s vanished at phone size)
c.arm(r3(T.pat + 1.5), "gsl", "R", { prop: "wallet", grip: [-0.155, 0, 0], at: [HOLSTER.x, HOLSTER.y, HOLSTER.z] }, 0.32, "inOut");   // 45 cm down to his hip: 0.32 s
A(r3(T.pat + 1.83), "gsl", "release", { prop: "wallet", to: [HOLSTER.x, HOLSTER.y, HOLSTER.z], dur: 0.04 });
c.prop(r3(T.pat + 1.95), "wallet", { tip: 360, rot: HOLSTER.rot }, 0.04, "inOut");   // squared up once it's out of sight
c.at(r3(T.pat + 1.89), { do: "prop", id: "wallet", set: { scale: 0.001 }, dur: 0.04, ease: "in", reason: "back down in his holster (part of his costume), so it runs with him" });
c.arm(r3(T.pat + 1.83), "gsl", "R", "rest", 0.42, "inOut");   // as he lets go
c.arm(r3(T.pat + 1.55), "gsl", "L", "rest", 0.45, "inOut"); A(r3(T.pat + 1.57), "gsl", "grip", { side: "L", shape: "relaxed", dur: 0.15 });
c.say(r3(T.pat + 1.08), "gsl", "look! nothing!", 0.5, "excited", { voice: false, sub: "Look! Nothing!", ...TOP });
// Viking's brows come down a little: he softens
A(r3(T.pat + 1.0), "vik", "look", { to: [-0.45, 0.1], dur: 0.15, blink: false });
A(r3(T.pat + 1.5), "vik", "expr", { expr: "sad", set: { curve: -0.15 }, dur: 0.3 }); A(r3(T.pat + 1.5), "vik", "face", { lid: 0.15, brow: 0.15, dur: 0.3 });

// ---------------------------------------------------------------- PLEA 3 (the 10x): a dash round the table, a knee slide, begging, wailing
// The dash runs round the front of the table (the camera side) on a circle clear of the table's edge by his hat brim,
// its heading (yaw = angle + 90 going round) given as turns along it; at its end he drops to his knees and slides the
// last bit, spinning to face us. He ends kneeling a body and a brim from Viking's left side (screen right of him), his
// mittens pressed together begging (no contact: his hat brim is 0.4 m wide, a clutch put it in Viking), 3/4 to us.
// Viking swivels his chair round toward him (the chair turns with him) and looks down; back again as he runs off.
const ARC_R = 1.2, arcPt = (deg) => [r3(ARC_R * Math.sin(rad(deg))), r3(ARC_R * Math.cos(rad(deg)))];
const KNEEL = [1.68, -0.2];
// yaw is a plain number (a turn tweens the number): the dash's headings follow its path (-8 .. 121, round the front),
// the knee slide swivels him back through 90 and 0 to -40 (3/4 to us), the run back heads -39 .. -140 and turns up
// through 0 to 60 (in the cards shot), so the sit's own turn to the chair's 40 is short
const K_YAW = -40;   // from the dash's 121 the short way, through 90 and 0: he swivels round past facing us
const DASH = 0.6, SLIDE = r3(T.kneel - T.plea3 - DASH);
const runArc = (t0, dur, a0, a1, from, to, yaw0, stop = 0, endYaw = null) => {
  // the path: from -> on to the circle at a0 -> round it to a1 -> to, timed by distance (an even speed); stop > 0:
  // the last `stop` share of the time slows evenly to a standstill (the lean and the arms settle instead of snapping)
  const n = 8, way = [from];
  for (let i = 0; i <= n; i++) way.push(arcPt(a0 + ((a1 - a0) * i) / n));
  way.push(to);
  const seg = way.slice(1).map((q, i) => Math.hypot(q[0] - way[i][0], q[1] - way[i][1])), len = seg.reduce((x, y) => x + y, 0);
  // time for a share p of the way: even speed v, then (stop) an even slow-down to 0 at the end
  const v = 1 / (1 - stop / 2), tau = (p) => (p <= v * (1 - stop) || !stop ? p / v : (1 - stop) + stop * (1 - Math.sqrt(Math.max(0, 1 - (2 * (p - v * (1 - stop))) / (v * stop)))));
  let acc = 0; const pts = [[0, ...from]];
  seg.forEach((d, i) => { acc += d; pts.push([r3(dur * tau(acc / len)), ...way[i + 1]]); });
  A(t0, "gsl", "run", { pts, rate: stop ? [[0, 7], [r3(dur * (1 - stop)), 7], [dur, 2.5]] : [[0, 7], [r3(dur * 0.8), 7], [dur, 4]], stride: 2 });
  // his heading: each leg's own direction, unwrapped from yaw0 (his yaw as he sets off), reached by the leg's middle
  let prev = yaw0, first = true;
  for (let i = 1; i < pts.length; i++) {
    const [ta, xa, za] = pts[i - 1], [tb, xb, zb] = pts[i];
    if (endYaw != null && ta / dur > 0.55) break;   // endYaw: the last part turns him to it while his feet still step
    if (Math.hypot(xb - xa, zb - za) < 0.08) continue;   // a leg this short has no heading to speak of
    let h = (Math.atan2(xb - xa, zb - za) * 180) / Math.PI;
    while (h - prev > 180) h -= 360; while (h - prev < -180) h += 360;
    prev = h;
    const L = tb - ta;   // each turn spans its leg's middle half either side: they abut, so the turning rate never stops
    A(r3(t0 + ta - (first ? 0.1 : L / 2)), "gsl", "turn", { to: r3(h), dur: r3(first ? L / 2 + 0.1 : L), ease: first ? "inOut" : "linear" });
    first = false;
  }
  if (endYaw != null) A(r3(t0 + dur * 0.6), "gsl", "turn", { to: endYaw, dur: r3(dur * 0.4 + 0.08), ease: "inOut" });
};
const A_G = r3((Math.atan2(GS[0], GS[1]) * 180) / Math.PI), A_END = 40;   // the dash: from the pat spot (about -104 deg) round the front to 40 deg, then the knee slide
A(r3(T.plea3 - 0.28), "gsl", "look", { to: [0.2, -0.2], dur: 0.1, blink: false });   // eyes first: the way round the table
runArc(T.plea3, DASH, A_G, A_END, GS, arcPt(A_END), G_YAW);   // full speed into the knee slide
sfx(r3(T.plea3 + 0.05), "whoosh", { gain: 0.3, reason: "he dashes off round the table" });
// the knee slide: down on his knees, gliding the last bit, spinning round to face us
A(r3(T.plea3 + DASH - 0.04), "gsl", "kneel", { dur: r3(T.back - T.plea3 - DASH + 0.04), blend: 0.4 });   // the arms ease out of the run
A(r3(T.plea3 + DASH), "gsl", "move", { to: KNEEL, dur: SLIDE, ease: "out", steps: 0 });
A(r3(T.plea3 + DASH), "gsl", "turn", { to: K_YAW, dur: r3(SLIDE + 0.5), ease: "inOut" });   // 121 -> -40: he swivels on his knees as he slides in and stops (1 s: his hands swing round with him)
sfx(r3(T.plea3 + DASH), "scrape", { gain: 0.35, reason: "his knees sliding across the studio floor" });
// begging: mittens pressed together under his chin (after the kneel: dance.js sets its own arms every frame of the
// pose, so these arm actions come later in order)
c.arm(r3(T.kneel - 0.12), "gsl", "R", { x: [-0.045, 0.5, 0.3] }, 0.42, "inOut");   // 0.5 m: 0.42 s
c.arm(r3(T.kneel - 0.1), "gsl", "L", { x: [0.045, 0.5, 0.3] }, 0.42, "inOut");
A(r3(T.kneel + 0.1), "gsl", "grip", { side: "both", shape: "flat", dur: 0.12 });
// Viking swivels round toward him, his hands into his lap
const V_TURN = 15;
for (const s of ["R", "L"]) c.arm(r3(T.kneel - 0.6), "vik", s, "lap", 0.55, "inOut");
A(r3(T.kneel - 0.3), "vik", "turn", { to: V_TURN, dur: 0.45, ease: "inOut" });
c.prop(r3(T.kneel - 0.3), "chairV", { rot: V_TURN }, 0.45, "inOut");
sfx(r3(T.kneel - 0.25), "creak", { gain: 0.25, reason: "Viking's chair swivels round toward him" });
A(r3(T.kneel - 0.1), "gsl", "look", { to: [-0.6, 0.4], dur: 0.12, blink: false });
A(r3(T.kneel - 0.15), "gsl", "pitch", { to: -11, dur: 0.35 });   // he leans back on his knees, face up to Viking (the kneel tips him 7 deg forward: the brim hid his eyes)
A(r3(T.back - 0.15), "gsl", "pitch", { to: 0, dur: 0.2 });
A(T.kneel, "gsl", "expr", { expr: "sad", set: { open: 0.55, curve: -0.7 }, dur: 0.15 }); A(T.kneel, "gsl", "face", { brow: 0.6, lid: 0.55, dur: 0.15 });
c.say(r3(T.kneel + 0.1), "gsl", "pleeease! we're brothers!", 0.85, "sad", { voice: false, sub: "PLEASE, brother!", ...TOP });
for (let k = 0; k < 4; k++) A(r3(T.kneel + 0.1 + k * 0.22), "gsl", "squash", { amount: 0.03, dur: 0.18 });   // sobs
// Viking: looks down at him, the frown melts
A(r3(T.kneel - 0.45), "vik", "look", { to: [0.5, -0.4], dur: 0.15, blink: false });
A(r3(T.kneel + 0.4), "vik", "expr", { expr: "sad", set: { curve: 0.15 }, dur: 0.35 }); A(r3(T.kneel + 0.4), "vik", "face", { brow: 0.45, lid: 0.2, dur: 0.35 });
c.say(T.okay, "vik", "...okay.", 0.45, "sad", { voice: false, sub: "…Okay.", ...TOP });
A(r3(T.okay + 0.05), "vik", "squash", { amount: 0.03, dur: 0.25 });
see(T.kneel, T.okay, ["gsl.face", "vik.face"], "plea 3: on his knees begging, Viking turned to him, his face melting");

// ---------------------------------------------------------------- 3, 2, 1: he scrambles back to his chair; 0: the cards slide
A(T.back, "gsl", "expr", { expr: "eager", set: { curve: 0.3, open: 0.1 }, dur: 0.1 }); A(T.back, "gsl", "face", { brow: 0.2, lid: 0, dur: 0.1 });
c.arm(r3(T.back - 0.1), "gsl", "R", "rest", 0.45, "inOut"); c.arm(r3(T.back - 0.1), "gsl", "L", "rest", 0.45, "inOut");
A(r3(T.back + 0.1), "vik", "turn", { to: V_YAW, dur: 0.5, ease: "inOut" });
c.prop(r3(T.back + 0.1), "chairV", { rot: V_YAW }, 0.5, "inOut");
for (const s of ["R", "L"]) c.arm(r3(T.back + 0.3), "vik", s, ONTABLE("vik", s), 0.6, "inOut");
A(r3(T.back + 0.7), "vik", "grip", { side: "both", shape: "flat", dur: 0.2 });
const BACK = r3(T.sit - T.back - 0.02);
A(r3(T.back - 0.13), "gsl", "look", { to: [-0.6, -0.1], dur: 0.1, blink: false });   // eyes first: back to his chair
const BESIDE = P(G, G_YAW, 0.05, -0.42);           // beside his chair, on its camera side
runArc(r3(T.back + 0.08), r3(BACK - 0.08), A_END, r3((Math.atan2(BESIDE[0], BESIDE[1]) * 180) / Math.PI), KNEEL, BESIDE, K_YAW, 0.3, 60);
// the run back slows to a stop beside his chair, turning from about 152 to 60 over its last steps (152 -> 60 through
// 90, side on, never his back; a pivot on the spot slid his feet, a sit that turned 112 deg swung his hands 90 cm a frame)
A(T.sit, "gsl", "sit", { seat: "chairG", dur: 0.45, hands: "keep" });
// once he's down: his left hand onto the table (his right goes to his STEAL card at the bell, below)
c.arm(r3(T.sit + 0.35), "gsl", "L", ONTABLE("gsl", "L"), 0.5, "inOut");
A(r3(T.sit + 0.7), "gsl", "grip", { side: "L", shape: "flat", dur: 0.15 });
A(r3(T.back - 0.05), "vik", "look", { to: [-0.55, -0.1], dur: 0.2, blink: false });
A(r3(T.back + 0.1), "vik", "expr", { expr: "kind", set: { curve: 0.35 }, dur: 0.3 }); A(r3(T.back + 0.1), "vik", "face", { brow: 0.1, lid: 0.1, dur: 0.3 });

// 0: each pushes his chosen card 8 cm in toward the middle, face down (Viking: SHARE, Gunslinger: STEAL), palm flat on
// it, and keeps his hand on it (guarding it) until he turns it over: one reach, no hand back to the table in between
const HAND = { gsl: "R", vik: "L" };   // the hand on the camera side of his line, where his chosen card lies
const push = (who, id, t, lead) => {
  const side = HAND[who];
  c.arm(r3(t - lead), who, side, { prop: id, grip: [0, 0.085, 0.04], palm: [0, -0.5, 0.04] }, r3(lead - 0.04), "inOut");   // palm down on it
  A(r3(t - 0.18), who, "grip", { side, shape: "flat", dur: 0.12 });
  c.prop(t, id, { x: PUSHED[who][0], z: PUSHED[who][2] }, 0.22, "inOut");
  sfx(t, "kenney/drop-leather", { gain: 0.4, reason: `${who === "gsl" ? "Gunslinger" : "Viking"} slides his card in under his palm` });
};
push("vik", "vShare", r3(T.slide - 0.05), 0.45);
push("gsl", "gSteal", r3(T.slide + 0.3), 0.5);   // his hand goes once he's down in his chair
A(r3(T.slide - 0.35), "gsl", "look", { to: [0.1, -0.5], dur: 0.12, blink: false });
A(r3(T.slide - 0.45), "vik", "look", { to: [-0.1, -0.5], dur: 0.12, blink: false });
see(T.slide, r3(T.slide + 0.4), ["vShare", "gSteal"], "the two chosen cards pushed in, face down");

// ---------------------------------------------------------------- REVEAL 1 (the fake-out): Viking flips SHARE
// the flip: fingertips under the card's outer edge, a flick, it turns over where it lies; the word pops over the table
const flip = (who, id, t, word, color) => {
  const side = HAND[who];
  const ex = who === "gsl" ? -0.1 : 0.1;
  c.arm(r3(t - 0.32), who, side, { prop: id, grip: [ex, 0.07, 0], palm: [ex, -0.5, 0] }, 0.28, "inOut");   // from the push grip on the same card: 7 cm (card units: scaled with it)
  A(r3(t - 0.15), who, "grip", { side, shape: "flat", dur: 0.1 });
  c.prop(t, id, { flip: 1 }, 0.28, "inOut");
  sfx(t, "book-flip", { gain: 0.45, reason: "the card flicked over onto its face" });
  c.prop(r3(t + 0.24), id, { glow: 1 }, 0.15, "out");
  c.at(r3(t + 0.22), { fx: "pop", text: word, xy: [540, 380], size: 170, dur: 1.0, angle: 0, color });
  c.arm(r3(t + 0.1), who, side, ONTABLE(who, side), 0.55, "inOut");
};
flip("vik", "vShare", T.flip1, "SHARE", "#3fd06a");
A(r3(T.flip1 + 0.35), "vik", "look", { to: [-0.55, -0.05], dur: 0.15, blink: false });
A(r3(T.flip1 + 0.4), "vik", "expr", { expr: "delighted", set: { curve: 0.8 }, dur: 0.3 }); A(r3(T.flip1 + 0.4), "vik", "face", { brow: 0.3, lid: 0.15, dur: 0.3 });
A(r3(T.flip1 + 0.5), "gsl", "look", { to: [0.55, -0.05], dur: 0.15, blink: false });
A(r3(T.flip1 + 0.55), "gsl", "expr", { expr: "happy", set: { curve: 0.6 }, dur: 0.3 });
see(T.flip1, r3(T.flip1 + 0.3), ["vShare"], "SHARE: the card face up");
see(r3(T.flip1 + 0.45), r3(T.flip2 - 0.1), ["vik.face", "gsl.face"], "the fake-out: they smile at each other");

// ---------------------------------------------------------------- REVEAL 2 (the payoff): Gunslinger flips STEAL
flip("gsl", "gSteal", T.flip2, "STEAL", "#ff3b4a");
A(r3(T.flip2 + 0.3), "vik", "look", { to: [-0.15, -0.55], dur: 0.1, blink: false });
A(r3(T.flip2 + 0.32), "vik", "expr", { expr: "shocked", set: { open: 0.25, curve: -0.2 }, dur: 0.25 }); A(r3(T.flip2 + 0.32), "vik", "face", { brow: 0.55, lid: 0, dur: 0.25 });
A(r3(T.flip2 + 0.6), "vik", "look", { to: [-0.55, -0.05], dur: 0.15, blink: false });
A(r3(T.flip2 + 0.66), "vik", "expr", { expr: "sad", set: { curve: -0.5 }, dur: 0.3 }); A(r3(T.flip2 + 0.66), "vik", "face", { brow: 0.6, lid: 0.3, dur: 0.3 });
// Gunslinger: a little sheepish shrug
A(r3(T.flip2 + 0.45), "gsl", "look", { to: [0.55, -0.05], dur: 0.12, blink: false });
A(r3(T.flip2 + 0.5), "gsl", "expr", { expr: "cocky", set: { curve: 0.3, smirk: 0.35 }, dur: 0.25 }); A(r3(T.flip2 + 0.5), "gsl", "face", { brow: 0.3, dur: 0.25 });
c.say(r3(T.flip2 + 0.38), "gsl", "sorry, buddy.", 0.4, "calm", { voice: false, sub: "Sorry, buddy.", pos: SUB_LO });
see(T.flip2, r3(T.flip2 + 0.3), ["gSteal"], "STEAL: the card face up");
see(r3(T.flip2 + 0.3), T.drop, ["vik.face", "gsl.face"], "the betrayal: Viking's face falls, Gunslinger's sheepish shrug");

// the trap arms: a red rim lights round the floor behind Viking's chair; he looks down at it
c.prop(T.warn, "trapV", { warn: 1 }, 0.08, "out");
sfx(T.warn, "kenney/metal-latch", { gain: 0.5, reason: "the trapdoor's latch arming under Viking's chair" });
A(r3(T.warn + 0.1), "vik", "look", { to: [0.2, -0.75], dur: 0.12, blink: false });
A(r3(T.warn + 0.15), "vik", "expr", { expr: "terrified", dur: 0.2 }); A(r3(T.warn + 0.15), "vik", "face", { brow: 0.6, dur: 0.2 });
// his hands come up off the table in fright (so they ride down with him: a hand left on the table flipped as he fell)
for (const [s, o] of [["R", [-0.1, 0.34, 0.5]], ["L", [0.08, 0.32, 0.36]]]) c.arm(r3(T.warn - 0.05), "vik", s, { o }, 0.5, "inOut");   // both palms up in front of his chest, clear of his eyes (o[0] is out from each side; his right one further forward: he sits turned 40 deg from the drop shot)   // palms up at his chest: at 0.52 a hand sat on his eye
A(r3(T.warn + 0.12), "vik", "grip", { side: "both", shape: "open", dur: 0.15 });

// ---------------------------------------------------------------- THE DROP: the trap opens, the chair tips back, he's gone
c.prop(T.drop, "trapV", { open: 1 }, 0.12, "in");
sfx(T.drop, "kenney/impact-metal-heavy", { gain: 0.85, reason: "the trapdoor bangs open" });
c.prop(r3(T.drop + 0.02), "chairV", { tip: 95 }, 0.26, "in");
A(r3(T.drop + 0.02), "vik", "pitch", { to: -85, dur: 0.26, ease: "in" });
A(r3(T.drop + 0.08), "vik", "move", { to: VT, dur: 0.24, ease: "in", steps: 0 });
A(r3(T.drop + 0.12), "vik", "drop", { to: -1.9, dur: 0.24 });
A(r3(T.drop + 0.4), "vik", "hide");
sfx(r3(T.drop + 0.05), "whoosh", { gain: 0.35, reason: "Viking falls back through the trapdoor" });
c.prop(r3(T.drop + 0.42), "chairV", { tip: 0 }, 0.3, "out");   // the empty chair springs back up
sfx(r3(T.drop + 0.7), "kenney/impact-metal-medium", { gain: 0.5, reason: "the empty chair's chrome base clanks back down onto the floor" });
// off screen: the splash, the sizzle, the column of steam out of the hole
sfx(T.splash, "splash", { gain: 0.6, reason: "off screen, down the chute: the splash into the fryer" });
sfx(T.splash, "slap", { gain: 0.3, reason: "the splash's wet slap (its punch on a phone speaker)" });
sfx(r3(T.splash + 0.08), "steam", { gain: 0.55, reason: "the steam bursting up out of the trapdoor" });
sfx(r3(T.splash + 0.1), "bubbling", { dur: 2.0, gain: 0.5, reason: "the oil boiling up hard after the splash" });
sfx(r3(T.splash + 0.15), "sizzle", { gain: 0.6, reason: "the sizzle" });
c.prop(T.splash, "trapV", { steam: 1, rise: 1 }, 0.5, "out");
c.prop(T.splash, "fryer", { churn: 1 }, 0.25, "out");
c.prop(r3(T.splash + 1.6), "fryer", { churn: 0.3 }, 1.0, "inOut");
c.prop(r3(T.splash + 2.0), "trapV", { steam: 0.7 }, 1.0, "inOut");
c.prop(T.ask, "trapV", { steam: 0.95 }, 0.5, "out");   // a last puff as the question lands
// Gunslinger winces at the sizzle
A(r3(T.drop + 0.05), "gsl", "look", { to: [0.65, -0.1], dur: 0.1, blink: false });
A(r3(T.splash + 0.05), "gsl", "expr", { expr: "shocked", set: { open: 0.1, curve: -0.3 }, dur: 0.15 }); A(r3(T.splash + 0.05), "gsl", "face", { lid: 0.8, brow: 0.4, dur: 0.15 });
A(r3(T.splash + 0.05), "gsl", "squash", { amount: 0.05, dur: 0.2 });

// ---------------------------------------------------------------- THE GOLD: he leans over the table and hugs the whole pile
A(r3(T.hug - 0.15), "gsl", "face", { lid: 0, brow: 0.1, dur: 0.15 });
A(r3(T.hug - 0.15), "gsl", "look", { to: [0.3, -0.5], dur: 0.12, blink: false });
A(r3(T.hug - 0.1), "gsl", "expr", { expr: "delighted", set: { curve: 0.8 }, dur: 0.25 });
A(T.hug, "gsl", "pitch", { to: 6, dur: 0.4 });
for (const [s, g] of [["R", [0.2, 0.08, 0]], ["L", [-0.2, 0.08, 0]]]) c.arm(r3(T.hug - 0.1), "gsl", s, { prop: "gold", grip: g, palm: true }, 0.55, "inOut");
A(r3(T.hug + 0.25), "gsl", "grip", { side: "both", shape: "press", dur: 0.1 });
sfx(r3(T.hug + 0.4), "coins", { gain: 0.6, reason: "the gold pile jingling as his arms close round it" });
A(r3(T.hug + 0.8), "gsl", "face", { lid: 0.85, dur: 0.25 });
A(r3(T.hug + 0.8), "gsl", "expr", { expr: "happy", set: { curve: 0.85 }, dur: 0.25 });
A(r3(T.hug + 0.85), "gsl", "still", { dur: r3(T.ask - T.hug - 0.9), idle: 0.15 });
// as the question pops: one eye opens on the empty chair, a small guilty gulp, and back to the gold (review A: 4.4 s of one frame)
A(T.ask, "gsl", "face", { lid: 0.1, brow: 0.3, dur: 0.15 });
A(r3(T.ask + 0.05), "gsl", "look", { to: [0.6, -0.2], dur: 0.2, blink: false });
A(r3(T.ask + 0.3), "gsl", "squash", { amount: 0.03, dur: 0.2 });
A(r3(T.ask + 0.6), "gsl", "look", { to: [0.3, -0.5], dur: 0.15, blink: false });
A(r3(T.ask + 0.65), "gsl", "face", { lid: 0.85, brow: 0.1, dur: 0.2 });
A(r3(T.ask + 0.9), "gsl", "still", { dur: r3(END - T.ask - 0.95), idle: 0.15 });
c.prop(r3(T.endLine + 0.2), "studio", { dim: 0.55 }, 1.2, "inOut");
see(T.splash, r3(END - 0.1), ["gsl.face", "chairV"], "the empty chair, the steam, Gunslinger with all the gold");

// ---------------------------------------------------------------- shots: [name, start, camera]
// frame(target, { az, el, h (frame height in metres at the target), fov, push, dur })
const WIDE = frame([0, 0.95, -0.6], { az: 0, el: 7, h: 3.6, fov: 40 });
const TWO = frame([0, 1.02, -0.55], { az: 0, el: 6, h: 2.9, fov: 38 });
const FRYER = frame([0, 0.95, FZ], { az: 0, el: 30, h: 1.1, fov: 36, push: 0.08, dur: 0.8 });
// the countdown's shots keep room above the heads for the subtitles (y 262, left of the countdown)
const VIK_MED = frame([V[0] - 0.25, 1.05, V[1] + 0.1], { az: -18, el: 4, h: 2.7, fov: 36, push: 0.04, dur: 1.0 });
const GSL_MED = frame([GS[0] + 0.12, 0.8, GS[1]], { az: 12, el: 0, h: 2.6, fov: 38 });
// the dash and the scramble back: a wide that pans with him (a hard cut in from Viking's medium: the still wide cropped him at the pat spot)
const RUNW_L = frame([-0.03, 0.8, -0.2], { az: 0, el: 9, h: 5.6, fov: 40 }), RUNW_R = frame([0.43, 0.8, -0.2], { az: 0, el: 9, h: 5.6, fov: 40 });
const HUG = frame([1.26, 0.72, -0.52], { az: -10, el: -14, h: 3.3, fov: 38 });   // low, up under his brim: he kneels
const CARDS = frame([0, TH + 0.02, -0.18], { az: 0, el: 78, h: 1.45, fov: 34 });   // the four cards round the pile, the players' hands coming in
const DROP = { pos: [0.18, 1.75, 3.15], look: [r3((V[0] + VT[0]) / 2 - 0.12), 0.7, r3((V[1] + VT[1]) / 2)], fov: 40 };   // Viking with headroom, his trap's whole rim behind him (review A)
const ENDW = frame([-0.25, 0.9, -0.6], { az: 0, el: -2, h: 3.8, fov: 40, push: 0.08, dur: 4 });   // at his eye height: his face under the brim
const beats = c.beats([
  ["hook", 0, { ...WIDE, to: { pos: TWO.pos, look: TWO.look }, dur: T.rules }],
  ["rules", T.rules, TWO],
  ["the fryer", r3(T.rules + 2.25), FRYER],
  ["both fry", r3(T.rules + 3.4), TWO],
  ["plea 1", T.count, TWO],
  ["you owe me", r3(T.owe - 0.05), VIK_MED],
  ["plea 2", T.pat, GSL_MED],   // he gets up and steps out while we're on Viking: we cut to him already patting
  ["he softens", r3(T.pat + 1.45), VIK_MED],   // Viking's brows (review A); the wallet goes back in the holster off screen
  ["plea 3", T.plea3, { ...RUNW_L, to: { pos: RUNW_R.pos, look: RUNW_R.look }, dur: 1.0 }],   // pans with the dash
  ["on his knees", r3(T.kneel - 0.05), HUG],
  ["scramble back", T.back, RUNW_R],
  ["the cards", r3(T.back + 0.4), CARDS],   // he's halfway back: his arrival and sit happen off the table's top-down shot
  ["share", r3(T.flip1 + 0.4), TWO],
  ["steal", r3(T.flip2 - 0.25), CARDS],
  ["betrayal", r3(T.flip2 + 0.3), TWO, "payoff"],
  ["the trap", r3(T.warn + 0.33), DROP],   // after "Sorry, buddy." (its subtitle would sit on Viking here)
  ["all the gold", r3(T.splash + 0.3), ENDW],
], END);

write(import.meta.url, {
  id: "gunslinger-viking",
  title: "Share or Steal 01: Gunslinger vs Viking",
  idea: "A trust game over a deep fryer: Gunslinger begs, Viking shares, Gunslinger steals; Viking's chair tips back through the trapdoor",
  fps: 30, look: "anime-pro", profile: "short", loop: false, captionStyle: "kinetic",
  captionBand: [240, 1360],
  castLook: "sheet",
  cleanStart: true,
  motion: { feet: 2, overlap: true, timing: true, solve: true },
  rig: { hand: 2, eyes: 2, hold: 2 },
  physics: true,
  animeTiming: true,
  set: { type: "plain", color: "#0c0b11", floor: "#141219", night: true, para: 0, bloom: "emissive", key: [0.4, 5.5, 1.6],
    aperture: 0, lighting: 2, hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true, satsuei: true },
  // the tension bed under the game; the warm swell at Viking's SHARE (the fake-out); cut dead as STEAL turns over
  music: { file: "ai/sos-tension/sos-tension-01.ogg", gain: 0.36, lowCut: 100, duck: { db: 9 }, until: T.flip1,
    then: { file: "ai/sos-warm/sos-warm-01.ogg", from: T.flip1, until: r3(T.flip2 + 0.24), gain: 0.42 } },
  sound: { sfx: 0.6, ambience: 0.2, guard: true, surface: "indoor" },   // the studio's glossy hard floor
  hook: { show: ["gsl", "vik", "gold", "fryer"], hint: 0, what: "his mitten is already on the gold between them, the fryer bubbling behind" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    { who: "gsl", from: r3(T.plea3 + 0.1), to: r3(T.plea3 + 0.25), checks: ["motion"], reason: "he throws himself into the dash: the run's lean lands in one drawing (on 2s), at the frame edge and moving" },
    { who: "gsl", from: r3(T.plea3 + 0.45), to: r3(T.plea3 + 0.62), checks: ["stance-slide"], reason: "the last stride before he drops to his knees: 3 cm as the knee slide starts (he is sliding)" },
    { who: "gsl", from: r3(T.back + 0.42), to: r3(T.back + 0.56), checks: ["rig-jump", "motion"], reason: "off screen: the top-down card shot (cut at back + 0.4) has only the table in frame while he runs to his chair" },
    { who: "gsl", with: "studio", from: 0, to: END, reason: "the studio's glossy floor is a backdrop slab at y 0.001 (solid: false); the body check reads its box, so feet on the floor count" },
    { who: "vik", with: "studio", from: 0, to: END, reason: "the studio's glossy floor is a backdrop slab at y 0.001 (solid: false); the body check reads its box, and he drops through the trapdoor below it" },
    { who: "gsl", with: "chairG", from: T.plea2, to: r3(T.plea2 + 0.7), reason: "his hat brim brushes his chair's high back as he stands and steps out" },
    { who: "gsl", with: "chairG", from: r3(T.sit - 0.2), to: r3(T.sit + 0.1), reason: "he slides in sideways onto his seat from beside it (his hat brim past its high back)" },
    { who: "moth", with: "chairG", from: r3(T.sit - 0.2), to: r3(T.sit + 0.3), reason: "the moth riding his hat brim passes his chair's high back as he slides in (off screen: the cards shot)" },
    { who: "vik", with: "trapV", from: T.drop, to: END, reason: "he falls back through the open trapdoor" },
    // the never-has-money pocket pat (the series block, as in NHM EP04), on this clip's clock (+ dt)
    { who: "gsl", with: "moth", from: r3(2.5 + dt), to: END, reason: "the moth flies round him and sits on his hat brim (worn)" },
    { who: "gsl", with: "wallet", from: r3(2.25 + dt), to: r3(T.pat + 1.93), reason: "he draws the wallet from his holster and slips it back" },
    { who: "gsl", from: r3(1.5 + dt), to: r3(2.35 + dt), checks: ["rig-jump", "hand-jump"], reason: "the series' frantic pocket pat: six slaps in 0.75 s (the same block every Never Has Money episode)" },
    { who: "gsl", from: r3(2.27 + dt), to: r3(2.33 + dt), checks: ["motion"], reason: "the quick-draw (series block): his hand snaps onto the wallet in the holster" },
    { who: "gsl", from: r3(2.38 + dt), to: r3(2.7 + dt), checks: ["prop-pop", "rig-jump"], reason: "the revolver spin (series block): the wallet turns once round his fingers on purpose, then flips open" },
    { who: "gsl", from: r3(T.pat + 1.75), to: r3(T.pat + 1.87), checks: ["prop-pop"], reason: "he lets the wallet go into his holster: it leaves his fingers" },
    { who: "gsl", with: "chairG", from: 0, to: r3(T.plea2 + 0.3), reason: "Gunslinger sits in his chair" },
    { who: "gsl", with: "chairG", from: T.sit, to: END, reason: "Gunslinger sits in his chair again" },
    { who: "vik", with: "chairV", from: 0, to: r3(T.drop + 0.4), reason: "Viking sits in his chair (and rides it as it tips back)" },
        { who: "vik", with: "gsl", from: 0.35, to: 0.8, reason: "Viking's mitten pats down on Gunslinger's on the gold" },
    { who: "gsl", with: "gold", from: 0, to: 0.8, reason: "frame 0: his mitten creeping onto the gold pile" },
    { who: "vik", with: "gold", from: 0.35, to: 0.8, reason: "Viking's pat lands on the gold pile under Gunslinger's mitten" },
    { who: "gsl", with: "gold", from: T.hug, to: END, reason: "he hugs the gold pile to him" },
    { who: "vik", from: r3(T.drop + 0.1), to: END, checks: ["rig-jump", "stance-slide", "foot-slide", "lean-jump"], reason: "the drop through the trapdoor: he falls below the floor and is hidden" },
  ],
  notes: "Generated by storyboards/series/share-or-steal/01-gunslinger-viking/make-gunslinger-viking.mjs.",
});
console.log(JSON.stringify(T));
