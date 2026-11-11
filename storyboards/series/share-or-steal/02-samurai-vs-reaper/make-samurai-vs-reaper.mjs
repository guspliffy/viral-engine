// SHARE OR STEAL, season 1 episode 2: SAMURAI VS REAPER (11 Nov 2026), the first episode in the short format (v2).
// Written by the director thread; builders made the props only (props-sos-vat.js, props-sos.js additions, card.js).
//   node storyboards/series/share-or-steal/02-samurai-vs-reaper/make-samurai-vs-reaper.mjs -> samurai-vs-reaper.json
// Target: Jonny's eight panels (PANELS.md next to this file). Brief: 00-SERIES-FORMAT.md "Format v2" in
// /mnt/project-files/video-scripts/2026-11-09-share-or-steal/ (rules shown, not spoken; a 4 to 0 timer; both players
// sit above the fryer).
//
// THE BRIEF (about 15 s; Samurai, Reaper; the dark studio, a grate over a round vat of boiling oil)
//   Joke:        the two calm ones never say a word. They shake on it, both steal, both drop. Then the lift brings
//                Reaper back up, fried and bored, and he takes the gold: you can't fry Death.
//   Chain:       two cards each, so the rules (pictures), so each lays one face down and the clock runs, so Samurai
//                offers his hand and they shake, so at 0 Samurai turns STEAL and smirks, but Reaper turns STEAL too,
//                so both hatches drop, so the lifts come back: one chair empty, one with a fried Reaper, so he takes it.
//   Ending:      "You can't fry Death." Then "Share... or steal?", hard cut.
import { clip, write, r3, frame } from "../../../lib/clip.mjs";
import { picrule } from "../../../lib/overlay.mjs";

const c = clip({ faces: "strong", lines: { sub: true, blink: false } }), { A, sfx, see, cap } = c;

// ---------------------------------------------------------------- helpers (degrees; yaw + turns +z toward +x)
const rad = (d) => (d * Math.PI) / 180;
const dirOf = (yaw) => [Math.sin(rad(yaw)), Math.cos(rad(yaw))];
const leftOf = (yaw) => [Math.cos(rad(yaw)), -Math.sin(rad(yaw))];   // the character's own left
const rotY = ([x, y, z], d) => { const a = rad(d); return [x * Math.cos(a) + z * Math.sin(a), y, -x * Math.sin(a) + z * Math.cos(a)]; };
const P = ([x, z], yaw, f, s = 0, y) => { const d = dirOf(yaw), l = leftOf(yaw); const p = [r3(x + f * d[0] + s * l[0]), r3(z + f * d[1] + s * l[1])]; return y == null ? p : [p[0], y, p[1]]; };
const g = (s) => r3(Math.round(s * 15) / 15);   // onto the 2s drawing grid (animeTiming): beats move in 0.067 s steps

// ---------------------------------------------------------------- the set (world metres; y 0 = the top of the grate)
// EP01's table and seats (proven reaches): the players behind the table at its back left and back right, each turned
// 40 deg toward its middle. New: the whole thing stands on a grating deck across a round vat of oil, and each chair
// stands on its own dunk lift (a square plate with a light rim that drops straight down and comes back up).
const TR = 0.6, TH = 0.62;
const SEAT_D = r3(TR + 0.5);
const S_YAW = 40, R_YAW = -40;
const SEAT = { sam: P([0, 0], 180 + S_YAW, SEAT_D).map((v) => r3(v)) };   // (-0.707, -0.843)
SEAT.rpr = [r3(-SEAT.sam[0]), SEAT.sam[1]];
const YAW = { sam: S_YAW, rpr: R_YAW };
const GOLD = [0, r3(TH + 0.002), 0.02], GOLD_SCALE = 0.8;
const DEEP = 2.0;
const SEATED = [0, 0.3, 0.03];                     // a seated body over its chair's origin (timeline.js "sit": SEAT_Y 0.42 - legs 0.12; 3 cm forward): the offset a "ride" on the chair keeps                                // how far a lift drops: chair and player under the oil
// one card each on the table, face down under the camera-side glove (Samurai's right, Reaper's left), 0.36 m from the
// middle and 40 deg round toward us from the line to its player, square to the camera so the word reads when it turns
const CARD_R = 0.36, CARD_SCALE = 1;
const HAND = { sam: "R", rpr: "L" }, FAR = { sam: "L", rpr: "R" };
const cardAt = (who) => { const [x, z] = SEAT[who], a = Math.atan2(x, z) - Math.sign(x) * rad(40); return [r3(CARD_R * Math.sin(a)), r3(TH + 0.001), r3(CARD_R * Math.cos(a) + 0.08)]; };
const CARD = { sam: "sCard", rpr: "rCard" }, LIFT = { sam: "liftS", rpr: "liftR" }, CHAIR = { sam: "chairS", rpr: "chairR" }, FAN = { sam: "fanS", rpr: "fanR" };
// the fan of two cards he holds up at frame 0: in his far hand (the one nearer the table), at chest height in front
// of that shoulder, its faces to the camera
const fanAt = (who) => [who === "sam" ? -0.3 : 0.3, 0.7, -0.3];   // over the table on his side, under his face from our side, clear of the other fan
const fanLap = (who) => P(SEAT[who], YAW[who], 0.5, who === "sam" ? 0.1 : -0.1, 0.56);   // on his knees, clear of his belly

const cast = [
  { id: "sam", character: "duo/samurai", at: SEAT.sam, face: S_YAW, expr: "stern", follow: 0.3, seed: 2.3 },
  { id: "rpr", character: "notyet/reaper-noscythe", at: SEAT.rpr, face: R_YAW, expr: "deadpan", follow: 0.3, seed: 5.1 },
  // the same Reaper after the fryer: he takes the first one's place under the oil and rides the lift back up
  { id: "rprF", character: "share-or-steal/reaper-fried", at: SEAT.rpr, face: R_YAW, expr: "deadpan", follow: 0.3, seed: 5.1 },
];
const card = (who) => { const [x, y, z] = cardAt(who); return { id: CARD[who], kind: "sscard", face: "steal", back: "red", solid: true, x, y, z, rot: 0, scale: 0.001, flip: 0, glow: 0, staged: "in his fan until he lays it face down under his palm (on the cut at 3.0 s)" }; };
const fan = (who) => { const [x, y, z] = fanAt(who); return { id: FAN[who], kind: "sscardfan", back: "red", solid: true, x, y, z, rot: 0, tip: 0, scale: 0.95 }; };
const props = [
  { id: "studio", kind: "ssstudio", x: 0, z: 0, dim: 0, pit: true, trussY: 2.9, beams: [SEAT.sam, SEAT.rpr] },
  { id: "vat", kind: "ssvat", x: 0, z: 0, r: 2.25, holes: [SEAT.sam, SEAT.rpr], haze: 0.7, castLight: 1, churn: 0.3 },
  { id: "liftS", kind: "sslift", x: SEAT.sam[0], z: SEAT.sam[1], glow: 0, drop: 0, steam: 0, burst: 0 },
  { id: "liftR", kind: "sslift", x: SEAT.rpr[0], z: SEAT.rpr[1], glow: 0, drop: 0, steam: 0, burst: 0 },
  { id: "table", kind: "sostable", x: 0, z: 0, rot: 45, r: TR, h: TH, pedestal: "drum" },
  { id: "gold", kind: "goldpile", x: GOLD[0], y: GOLD[1], z: GOLD[2], scale: GOLD_SCALE },
  { id: "chairS", kind: "sschair", x: SEAT.sam[0], z: SEAT.sam[1], rot: S_YAW, tip: 0 },
  { id: "chairR", kind: "sschair", x: SEAT.rpr[0], z: SEAT.rpr[1], rot: R_YAW, tip: 0 },
  card("sam"), card("rpr"), fan("sam"), fan("rpr"),
  { id: "smokeA", kind: "smokewisp", x: r3(SEAT.rpr[0] - 0.12), y: 1.42, z: r3(SEAT.rpr[1] - 0.05), h: 0.9, n: 9, size: 0.16, alpha: 0.7, rgb: "215,210,205", on: 0 },
  { id: "smokeB", kind: "smokewisp", x: r3(SEAT.rpr[0] + 0.2), y: 1.3, z: r3(SEAT.rpr[1] - 0.1), h: 0.7, n: 9, size: 0.14, alpha: 0.7, rgb: "215,210,205", on: 0 },
];
// keys props3d.js propState doesn't start get a number at t 0, so their first tween eases, not steps
c.prop(0, "vat", { churn: 0.3 }, 0.01); c.prop(0, "studio", { dim: 0 }, 0.01);
for (const id of ["smokeA", "smokeB"]) c.prop(0, id, { on: 0 }, 0.01);

// ---------------------------------------------------------------- the clock (story seconds, on the 2s grid)
// Draft 2 (Jonny, 11 Nov 12:07: "make the rules a bit more clear and maybe even let the voice comment like a game
// show moderator"): each rule card has its own spoken line and a label, and the host comments every beat.
// The host's takes were picked by length and by what Whisper heard (out/sos-voice/make3.mjs, run3.log): the rules as
// full sentences ran 6 s, so he says just the three labels ("Split it!" 0.62, "One fries!" 0.92, "Both fry!" 0.99)
// after the title (1.25 s); the cards show who did what.
const STEP = g(0.73);
const T = { pic1: g(1.33), pic2: g(2.13), pic3: g(3.13), count: g(4.27) };
T.lower = g(T.count - 0.47);
T.n = (k) => r3(T.count + (4 - k) * STEP);       // the countdown's number k
T.offer = g(T.n(2) - 0.13);                      // Samurai's hand goes out over the gold on "2"
T.clasp = T.n(1);                                // they shake on "1"
T.zero = T.n(0);
T.flip1 = g(T.zero + 0.93);                      // Samurai: STEAL (the fake-out: he thinks he has won)
T.warn1 = g(T.flip1 + 0.47);                     // the rim under Reaper goes red
T.grab = g(T.flip1 + 0.6);                       // Samurai's glove onto the gold
T.flip2 = g(T.flip1 + 1.6);                      // Reaper: STEAL too (the truth)
T.warn2 = g(T.flip2 + 0.53);                     // the rim under Samurai goes red as well
T.drop = g(T.flip2 + 1.6);                      // both lifts drop
T.splash = g(T.drop + 0.33);
T.up1 = g(T.drop + 1.27);                        // Samurai's lift comes back up: an empty chair
T.up2 = g(T.up1 + 0.6);                          // Reaper's lift comes back up: Reaper, fried
T.endLine = g(T.up2 + 0.6);                      // "You can't fry Death."
T.pull = g(T.endLine + 0.4);                     // he takes the gold
T.ask = g(T.endLine + 1.73);
const END = g(T.ask + 1.67);

// ---------------------------------------------------------------- the host (voice 5, never on screen): a game-show moderator
const SHOW = "energetic TV game-show host, big showman voice, fast and punchy", HOST = "deep, dark game-show host, fast and clipped, tense", DRY = "deep, dry, deadpan narrator, unhurried";
const host = (t, line, { take = 0, style = SHOW } = {}) => c.at(t, { macro: "narrate", line, voice: "narrator-trailer", style, take, caption: false });
host(0.05, "Share or steal!", { take: 1, style: HOST });        // 1.25 s
host(T.pic1, "Split it!");                                       // 0.62 s
host(T.pic2, "One fries!", { take: 1 });                         // 0.92 s
host(T.pic3, "Both fry!");                                       // 0.99 s
host(r3(T.count + 0.1), "Four seconds!");                        // 1.05 s
host(r3(T.n(2) + 0.2), "A handshake!");                          // 1.0 s, as Samurai's hand goes out
host(r3(T.clasp + 0.25), "How sweet.", { take: 1 });             // 0.62 s
host(r3(T.flip1 - 0.8), "Samurai steals!");                      // 1.3 s: "steals" lands on the card
host(r3(T.flip2 - 0.75), "Reaper steals too!", { take: 1 });     // 1.33 s
host(r3(T.warn2 + 0.2), "Both fry!");                            // the third rule again, as both rims go red
host(T.endLine, "You can't fry Death.", { style: DRY, take: 2 });   // 1.39 s
host(T.ask, "Share... or steal?", { take: 1, style: HOST });

// ---------------------------------------------------------------- text: title, picture rules, countdown, end card
cap(0, r3(T.pic1 - 0.05), "SHARE OR *STEAL*", 250, false, { size: 104, kinetic: false });
// the rules: three picture cards, each popping in as the host says it, with its outcome in two words under it; all
// three stay up until the clock starts (panel 02)
const PICS = [[T.pic1, 198, ["share", "share"], ["gold", "gold"], "SPLIT IT", "#3fd06a"], [T.pic2, 490, ["steal", "share"], ["gold", "fire"], "ONE FRIES", "#ff9a3a"], [T.pic3, 782, ["steal", "steal"], ["fire", "fire"], "BOTH FRY", "#ff3b4a"]];
for (const [t, x, top, bottom, label, color] of PICS) {
  picrule(c, t, r3(T.count - t), top, bottom, { x, y: 300, w: 268 });
  c.at(r3(t + 0.12), { fx: "pop", text: label, xy: [x, 690], size: 42, dur: r3(T.count - t - 0.12), angle: 0, color });
  sfx(t, "pop", { gain: 0.5, reason: "a picture rule card pops in" });
}
// the countdown 4 .. 0: one number a step, top right (panels 03, 04), the last two red, a beep on each
for (let k = 4; k >= 0; k--) {
  const t = T.n(k), hot = k <= 1;
  c.at(t, { fx: "pop", text: String(k), xy: [900, 330], size: k === 0 ? 190 : 160, dur: k === 0 ? 0.6 : r3(STEP - 0.04), angle: 0, color: hot ? "#ff3b4a" : "#ffffff" });
  if (k > 0) sfx(t, "timer-beep", { gain: hot ? 0.55 : 0.42, reason: "the countdown's beep (the game's clock)" });
  if (k <= 2 && k > 0) sfx(r3(t + 0.05), "ai/heartbeat", { gain: 0.5, reason: "a heartbeat under the last two seconds" });
}
sfx(T.zero, "bell-heavy", { gain: 0.6, reason: "0: the game's dark bell" });
cap(T.endLine, r3(T.ask - 0.05), "You can't fry Death.", 300, false, { kinetic: false });
cap(T.ask, END, "SHARE… or *STEAL?*", 300, true, { size: 120, kinetic: false });

// ---------------------------------------------------------------- the room's sound: the vat
sfx(0, "bubbling", { dur: r3(END), gain: 0.26, reason: "the vat of oil bubbling under the grate, the whole clip" });
sfx(0, "rumble", { dur: r3(T.zero), gain: 0.18, reason: "the studio's low hum under the game, up to the bell" });

// ---------------------------------------------------------------- hands on the table (EP01's proven palm-down hold)
// a point on the table top r metres from its middle, a deg round from the line to the player (toward the camera when
// front), in the table's own frame (it is turned 45 deg), palm down: it faces a point under the grip
const onTable = (who, front, r = 0.5, a = 30) => {
  const [x, z] = SEAT[who], base = Math.atan2(x, z), ang = base + (front ? 1 : -1) * Math.sign(base) * -rad(a);
  const [lx, , lz] = rotY([r * Math.sin(ang), 0, r * Math.cos(ang)], -45);
  return { prop: "table", grip: [r3(lx), r3(TH + 0.035), r3(lz)], palm: [r3(lx), r3(TH - 0.4), r3(lz)] };
};
const ON_CARD = { grip: [0, 0.07, 0.03], palm: [0, -0.5, 0.03] };   // palm flat on his card (card units)
// where his palm lands before the card is under it: the same spot, written on the table
const cardSpot = (who) => { const [x, , z] = cardAt(who), [lx, , lz] = rotY([x, 0, z + 0.03], -45); return { prop: "table", grip: [r3(lx), r3(TH + 0.071), r3(lz)], palm: [r3(lx), r3(TH - 0.4), r3(lz)] }; };

// ---------------------------------------------------------------- frame 0 + TITLE 0-1.0: two calm players, two cards each
for (const who of ["sam", "rpr"]) {
  A(0, who, "sit", { seat: CHAIR[who], dur: 0.01, hands: "keep" });
  c.arm(0, who, HAND[who], "lap", 0);
  // the fan held up in his far hand: fingers closed on its lower edge from behind, the faces to the camera
  c.arm(0, who, FAR[who], { prop: FAN[who], grip: [0, 0.03, -0.02], palm: true }, 0); A(0, who, "grip", { side: FAR[who], shape: "hold", dur: 0 });
}
// the fried Reaper: hidden, seated on the same chair from the start and riding it, so he goes down and comes up with it
A(0, "rprF", "sit", { seat: "chairR", dur: 0.01, hands: "keep" });
A(0, "rprF", "hide");
A(0, "rprF", "skin", { color: "#4a1f08", to: 0.85, dur: 0.01 });   // deep-fried brown
A(0.03, "rprF", "ride", { prop: "chairR", off: SEATED, dur: 0.01 });
A(0, "sam", "look", { to: [0.5, -0.05], dur: 0, blink: false });
A(0, "sam", "expr", { expr: "stern", set: { curve: -0.05 }, dur: 0 }); A(0, "sam", "face", { brow: -0.2, lid: 0.3, dur: 0 });
A(0, "rpr", "look", { to: [-0.5, -0.05], dur: 0, blink: false });
A(0, "rpr", "expr", { expr: "deadpan", dur: 0 }); A(0, "rpr", "face", { lid: 0.5, dur: 0 });
see(0, 0.9, ["sam.face", "rpr.face", "gold", "fanS", "fanR"], "frame 0: both over the oil, each holding up his two cards, the gold between them");

// ---------------------------------------------------------------- RULES 1.0-3.0: three picture cards; the rims blink with the flames
const rim = (who, t, v, dur = 0.08) => c.prop(t, LIFT[who], { glow: v }, dur, "out");
rim("rpr", r3(T.pic2 + 0.35), 1); rim("rpr", r3(T.pic3 - 0.2), 0, 0.15);   // "... the other one fries": one rim, on "fries"
sfx(r3(T.pic2 + 0.35), "kenney/metal-latch", { gain: 0.3, reason: "a hatch rim blinks red under Reaper's chair" });
A(r3(T.pic2 + 0.42), "rpr", "look", { to: [0.15, -0.7], dur: 0.12, blink: false });   // he looks down at it, lids the same
A(r3(T.pic2 + 0.82), "rpr", "look", { to: [-0.5, -0.05], dur: 0.15, blink: false });
rim("sam", T.pic3, 1); rim("rpr", T.pic3, 1);                     // "both steal, both fry": both, held (panel 02)
sfx(T.pic3, "kenney/metal-latch", { gain: 0.4, reason: "both hatch rims go red" });
A(r3(T.pic3 + 0.07), "sam", "look", { to: [-0.15, -0.7], dur: 0.12, blink: false });
A(r3(T.pic3 + 0.4), "sam", "look", { to: [0.5, -0.05], dur: 0.15, blink: false });
rim("sam", r3(T.count - 0.2), 0, 0.2); rim("rpr", r3(T.count - 0.2), 0, 0.2);
see(r3(T.pic3 + 0.1), r3(T.count - 0.25), ["sam.face", "rpr.face", "liftS", "liftR"], "the rules are up, both rims red under the chairs");

// each picks: the fan goes down into his lap, and his other hand comes up and lays one card face down (the card
// itself shows from the cut at 3.0, under his palm)
for (const who of ["sam", "rpr"]) {
  const [fx, fy, fz] = fanLap(who);
  c.prop(T.lower, FAN[who], { x: fx, y: fy, z: fz, tip: -75 }, 0.36, "inOut");
  c.arm(r3(T.lower + 0.05), who, HAND[who], cardSpot(who), 0.4, "inOut"); A(r3(T.lower + 0.3), who, "grip", { side: HAND[who], shape: "flat", dur: 0.12 });
  // on the cut: the fan is tucked away, the chosen card lies under his palm, his far hand rests in his lap
  c.at(T.count, { do: "prop", id: FAN[who], set: { scale: 0.001 }, dur: 0.01, reason: "tucked into his robe as the shot changes" });
  c.at(T.count, { do: "prop", id: CARD[who], set: { scale: CARD_SCALE }, dur: 0.01, reason: "the card he chose, laid face down under his palm as the shot changes" });
  c.arm(T.count, who, HAND[who], { prop: CARD[who], ...ON_CARD }, 0.01);
  c.arm(T.count, who, FAR[who], "lap", 0.3, "inOut"); A(T.count, who, "grip", { side: FAR[who], shape: "relaxed", dur: 0.15 });
  sfx(r3(T.count - 0.05), "kenney/drop-leather", { gain: 0.35, reason: `${who === "sam" ? "Samurai" : "Reaper"} lays his card face down` });
}

// ---------------------------------------------------------------- 4, 3: the stare-down (panel 03)
A(r3(T.count - 0.1), "sam", "pitch", { to: 7, dur: 0.4 }); A(r3(T.count - 0.1), "rpr", "pitch", { to: 4, dur: 0.4 });
A(T.count, "sam", "expr", { expr: "focused", set: { curve: -0.1 }, dur: 0.2 }); A(T.count, "sam", "face", { brow: -0.3, lid: 0.35, dur: 0.2 });
c.at(r3(T.count + 0.3), { fx: "sweat", who: "sam", dur: 1.2, count: 2 });
A(r3(T.n(3) + 0.05), "sam", "look", { to: [0.1, -0.55], dur: 0.1, blink: false });   // a flick down at his own card
A(r3(T.n(3) + 0.38), "sam", "look", { to: [0.5, -0.05], dur: 0.1, blink: false });
A(r3(T.n(3) + 0.3), "rpr", "blink", { dur: 0.3 });                                    // Reaper: one slow blink
see(r3(T.count + 0.1), r3(T.n(3) + 0.6), ["sam.face", "rpr.face", "sCard", "rCard"], "the stare-down: gloves on the two face-down cards, a bead of sweat on Samurai");

// ---------------------------------------------------------------- 2, 1: the silent handshake over the gold (panel 04)
// the two hands nearer the table (Samurai's left, Reaper's right) meet over its back half, above the gold from our
// side and below both faces; each keeps his other glove on his card
const MEET = [0, 0.88, -0.42];
const meet = (who, dy = 0) => ({ world: [r3(MEET[0] + (who === "sam" ? -0.035 : 0.035)), r3(MEET[1] + dy), MEET[2]] });
A(r3(T.offer - 0.1), "sam", "look", { to: [0.5, -0.05], dur: 0.1, blink: false });
A(T.offer, "sam", "pitch", { to: 11, dur: 0.4 });
c.arm(T.offer, "sam", "L", meet("sam"), 0.45, "inOut"); A(r3(T.offer + 0.1), "sam", "grip", { side: "L", shape: "open", dur: 0.2 });
A(r3(T.offer + 0.2), "sam", "face", { brow: 0.1, lid: 0.3, dur: 0.25 });               // brows up a little: deal?
A(r3(T.offer + 0.4), "rpr", "look", { to: [-0.3, -0.35], dur: 0.12, blink: false });   // Reaper looks at the hand ...
A(r3(T.offer + 0.75), "rpr", "look", { to: [-0.5, -0.05], dur: 0.12, blink: false });  // ... then at him
A(r3(T.clasp - 0.42), "rpr", "pitch", { to: 9, dur: 0.35 });
c.arm(r3(T.clasp - 0.42), "rpr", "R", meet("rpr"), 0.4, "inOut");
A(r3(T.clasp - 0.08), "sam", "grip", { side: "L", shape: "clasp", dur: 0.1 }); A(r3(T.clasp - 0.08), "rpr", "grip", { side: "R", shape: "clasp", dur: 0.1 });
sfx(T.clasp, "pat", { gain: 0.5, reason: "their gloves meet: the handshake" });
for (const [k, dy] of [[0.07, -0.05], [0.2, 0.04], [0.33, -0.05], [0.47, 0]]) for (const who of ["sam", "rpr"]) c.arm(r3(T.clasp + k), who, FAR[who], meet(who, dy), 0.12, "inOut");   // two pumps, together
A(r3(T.clasp + 0.05), "sam", "face", { brow: -0.2, lid: 0.35, dur: 0.2 });
see(r3(T.clasp), r3(T.clasp + 0.55), ["sam.face", "rpr.face"], "the handshake over the gold, eyes locked");
// they let go as the clock hits 0, each hand back into its lap
for (const who of ["sam", "rpr"]) { c.arm(r3(T.zero - 0.13), who, FAR[who], "lap", 0.45, "inOut"); A(T.zero, who, "grip", { side: FAR[who], shape: "relaxed", dur: 0.15 }); }
A(r3(T.zero - 0.1), "sam", "pitch", { to: 5, dur: 0.4 }); A(r3(T.zero - 0.1), "rpr", "pitch", { to: 3, dur: 0.4 });

// ---------------------------------------------------------------- REVEAL 1, the fake-out: Samurai turns STEAL (panel 05)
const flip = (who, t, pop = true) => {
  const side = HAND[who], ex = who === "sam" ? -0.1 : 0.1;
  c.arm(r3(t - 0.32), who, side, { prop: CARD[who], grip: [ex, 0.07, 0], palm: [ex, -0.5, 0] }, 0.28, "inOut");
  A(r3(t - 0.15), who, "grip", { side, shape: "flat", dur: 0.1 });
  c.prop(t, CARD[who], { flip: 1 }, 0.28, "inOut");
  sfx(t, "book-flip", { gain: 0.45, reason: "the card flicked over onto its face" });
  c.prop(r3(t + 0.24), CARD[who], { glow: 1 }, 0.15, "out");
  if (pop) c.at(r3(t + 0.22), { fx: "pop", text: "STEAL", xy: [540, 400], size: 180, dur: 1.1, angle: 0, color: "#ff3b4a" });
  c.arm(r3(t + 0.1), who, side, onTable(who, true), 0.5, "inOut");
};
A(r3(T.flip1 - 0.4), "sam", "look", { to: [0.15, -0.5], dur: 0.1, blink: false });
flip("sam", T.flip1);
A(r3(T.flip1 + 0.12), "rpr", "look", { to: [-0.3, -0.5], dur: 0.12, blink: false });   // Reaper reads it
A(r3(T.flip1 + 0.3), "sam", "look", { to: [0.5, -0.05], dur: 0.12, blink: false });
A(r3(T.flip1 + 0.33), "sam", "expr", { expr: "cocky", set: { curve: 0.35, smirk: 0.45 }, dur: 0.25 }); A(r3(T.flip1 + 0.33), "sam", "face", { brow: -0.1, lid: 0.35, dur: 0.25 });
see(T.flip1, r3(T.flip1 + 0.3), ["sCard"], "STEAL: Samurai's card face up");
// the rim under Reaper goes red; he looks down at it, unbothered
rim("rpr", T.warn1, 1);
sfx(T.warn1, "kenney/metal-latch", { gain: 0.5, reason: "the lift's latch arming under Reaper's chair" });
A(r3(T.warn1 + 0.12), "rpr", "look", { to: [0.15, -0.75], dur: 0.15, blink: false });
// Samurai's other glove goes onto the gold and draws it a hand's width to him
c.arm(T.grab, "sam", "L", { prop: "gold", grip: [-0.19, 0.13, -0.02], palm: true }, 0.45, "inOut"); A(r3(T.grab + 0.3), "sam", "grip", { side: "L", shape: "press", dur: 0.12 });
c.prop(r3(T.grab + 0.5), "gold", { x: -0.07, z: -0.03 }, 0.3, "inOut");
sfx(r3(T.grab + 0.55), "coins", { gain: 0.45, reason: "the gold shifts under Samurai's glove" });
see(r3(T.grab + 0.5), r3(T.flip2 - 0.2), ["sam.face", "rpr.face", "gold", "liftR"], "the fake-out: his smirk, his glove on the gold, the red rim under Reaper");

// ---------------------------------------------------------------- REVEAL 2, the truth: Reaper turns STEAL too (panel 06)
flip("rpr", T.flip2);
c.arm(r3(T.flip2 + 0.1), "rpr", "L", { prop: "rCard", ...ON_CARD }, 0.3, "inOut");     // his glove stays on it
A(r3(T.flip2 + 0.3), "rpr", "look", { to: [-0.5, -0.05], dur: 0.2, blink: false });    // and only now he looks up
A(r3(T.flip2 + 0.27), "sam", "look", { to: [0.35, -0.5], dur: 0.08, blink: false });   // Samurai: at the card ...
A(r3(T.flip2 + 0.33), "sam", "expr", { expr: "shocked", set: { open: 0.3, curve: -0.2, eye: 1.2 }, dur: 0.15 }); A(r3(T.flip2 + 0.33), "sam", "face", { brow: 0.5, lid: 0, dur: 0.15 });
c.arm(r3(T.flip2 + 0.4), "sam", "L", { o: [0.02, 0.36, 0.4] }, 0.35, "inOut"); A(r3(T.flip2 + 0.4), "sam", "grip", { side: "L", shape: "open", dur: 0.15 });   // his glove comes off the gold
see(T.flip2, r3(T.flip2 + 0.3), ["rCard"], "STEAL: Reaper's card face up too");
rim("sam", T.warn2, 1);
sfx(T.warn2, "kenney/metal-latch", { gain: 0.55, reason: "the lift's latch arming under Samurai's chair too" });
A(r3(T.warn2 + 0.1), "sam", "look", { to: [-0.2, -0.75], dur: 0.1, blink: false });    // ... then down at his own rim
A(r3(T.warn2 + 0.15), "sam", "expr", { expr: "terrified", dur: 0.2 });
A(r3(T.warn2 + 0.45), "sam", "look", { to: [0.5, -0.05], dur: 0.1, blink: false });    // ... and at Reaper
c.arm(r3(T.warn2 + 0.3), "sam", "R", { o: [0.02, 0.36, 0.42] }, 0.35, "inOut"); A(r3(T.warn2 + 0.3), "sam", "grip", { side: "R", shape: "open", dur: 0.15 });
see(r3(T.warn2 + 0.1), r3(T.drop - 0.3), ["sam.face", "rpr.face", "liftS", "liftR"], "the truth: both cards red, both rims red, Samurai's smirk gone");
// Reaper folds his arms and waits
const FOLD = { R: { x: [0.1, 0.4, 0.3] }, L: { x: [-0.1, 0.34, 0.31] } };
const fold = (who, t, dur = 0.4) => { for (const s of ["R", "L"]) c.arm(t, who, s, FOLD[s], dur, "inOut"); A(r3(t + dur * 0.5), who, "grip", { side: "both", shape: "relaxed", dur: 0.15 }); };
fold("rpr", r3(T.warn2 + 0.2));
A(r3(T.warn2 + 0.2), "rpr", "pitch", { to: 0, dur: 0.35 });

// ---------------------------------------------------------------- THE DROP (panel 07): both lifts go straight down
for (const who of ["sam", "rpr"]) {
  c.prop(T.drop, LIFT[who], { drop: DEEP }, 0.3, "in");
  c.prop(T.drop, CHAIR[who], { y: -DEEP }, 0.3, "in");
  A(r3(T.drop - 0.03), who, "ride", { prop: CHAIR[who], off: SEATED, dur: 0.01 });   // he goes down with his chair, on its own curve
  A(r3(T.drop + 0.31), who, "hide");
  const k = who === "sam" ? 0 : 0.06;
  c.prop(r3(T.splash + k), LIFT[who], { burst: 1 }, 0.7, "linear");
  c.prop(r3(T.splash + k), LIFT[who], { steam: 0.8 }, 0.5, "out");
  sfx(r3(T.splash + k), "splash", { gain: 0.6, reason: `${who === "sam" ? "Samurai" : "Reaper"} hits the oil` });
}
sfx(T.drop, "kenney/impact-metal-heavy", { gain: 0.85, reason: "both lifts let go with a bang" });
sfx(r3(T.drop + 0.04), "whoosh", { gain: 0.35, reason: "both chairs drop through the grate" });
// Samurai: arms thrown up, mouth wide open; Reaper: arms folded, the same face
A(r3(T.drop - 0.07), "sam", "pitch", { to: 0, dur: 0.12 });
for (const s of ["R", "L"]) c.arm(r3(T.drop - 0.23), "sam", s, "up", 0.3, "inOut");   // 0.9 m: nine frames
A(r3(T.drop - 0.07), "sam", "expr", { expr: "terrified", set: { open: 0.75 }, dur: 0.1 }); A(r3(T.drop - 0.07), "sam", "face", { brow: 0.7, lid: 0, dur: 0.1 });
// the two cards jump off the table with the bang and fall back
for (const [who, to, spin] of [["sam", [-0.34, r3(TH + 0.006), 0.16], [2, 0.6, 1]], ["rpr", [0.3, r3(TH + 0.006), 0.2], [-2, 0.8, -1]]]) {
  c.prop(T.drop, CARD[who], { glow: 0 }, 0.1);
  c.throw(r3(T.drop + 0.03), CARD[who], { to, in: 0.8, spin });
}
sfx(r3(T.drop + 0.85), "kenney/drop-leather", { gain: 0.3, reason: "the cards land back on the table" });
sfx(T.splash, "slap", { gain: 0.3, reason: "the splash's wet slap (its punch on a phone speaker)" });
sfx(r3(T.splash + 0.08), "steam", { gain: 0.55, reason: "steam bursting up out of both hatches" });
sfx(r3(T.splash + 0.1), "bubbling", { dur: 1.8, gain: 0.5, reason: "the oil boiling up hard after the splash" });
sfx(r3(T.splash + 0.15), "sizzle", { gain: 0.6, reason: "the long sizzle" });
c.prop(T.splash, "vat", { churn: 1 }, 0.25, "out");
c.prop(r3(T.splash + 1.3), "vat", { churn: 0.35 }, 0.9, "inOut");
see(T.drop, r3(T.drop + 0.25), ["sam.face", "rpr.face"], "the drop: Samurai's arms up, Reaper's folded");
see(r3(T.splash + 0.1), r3(T.up1 - 0.1), ["gold", "liftS", "liftR"], "both gone: steam out of both hatches, the gold alone on the table");

// ---------------------------------------------------------------- THE LIFTS COME BACK (panel 08): an empty chair, then Reaper, fried
const rise = (who, t) => {
  c.prop(t, LIFT[who], { drop: 0 }, 0.45, "out"); c.prop(t, CHAIR[who], { y: 0 }, 0.45, "out");
  sfx(t, "doorslide", { gain: 0.4, reason: `the lift under ${who === "sam" ? "Samurai's" : "Reaper's"} chair comes back up` });
  sfx(r3(t + 0.42), "kenney/impact-metal-medium", { gain: 0.5, reason: "the lift's plate clunks home in the grate" });
  rim(who, t, 0, 0.3);
};
rise("sam", T.up1);
c.prop(r3(T.up1 + 0.1), "liftS", { steam: 0.45 }, 0.6, "inOut");
rise("rpr", T.up2);
c.prop(r3(T.up2 - 0.2), "liftR", { steam: 0 }, 0.3, "inOut");
// the fried Reaper takes his place under the oil, already seated, arms folded, and rides the plate up
for (const s of ["R", "L"]) c.arm(r3(T.up2 - 0.17), "rprF", s, FOLD[s], 0.01);
A(r3(T.up2 - 0.17), "rprF", "look", { to: [-0.5, -0.05], dur: 0.01, blink: false });
A(r3(T.up2 - 0.17), "rprF", "face", { lid: 0.5, dur: 0.01 });
A(r3(T.up2 - 0.03), "rprF", "show");
A(r3(T.up2 + 0.5), "rprF", "ride", {});
A(r3(T.up2 + 0.45), "rprF", "squash", { amount: 0.04, dur: 0.2 });
for (const id of ["smokeA", "smokeB"]) c.prop(r3(T.up2 + 0.3), id, { on: 1 }, 0.4, "out");
sfx(r3(T.up2 + 0.35), "sizzle", { gain: 0.35, reason: "Reaper, still sizzling" });
A(r3(T.up2 + 0.75), "rprF", "blink", { dur: 0.3 });
// he takes the gold: arms unfold, both gloves onto the pile, and it comes to him
A(r3(T.pull - 0.05), "rprF", "look", { to: [-0.3, -0.5], dur: 0.15, blink: false });
A(T.pull, "rprF", "pitch", { to: 4, dur: 0.4 }); A(r3(T.pull + 0.6), "rprF", "pitch", { to: 0, dur: 0.6 });
for (const [s, gr] of [["R", [0.19, 0.06, -0.06]], ["L", [0.15, 0.06, 0.11]]]) c.arm(T.pull, "rprF", s, { prop: "gold", grip: gr, palm: true }, 0.5, "inOut");
A(r3(T.pull + 0.35), "rprF", "grip", { side: "both", shape: "press", dur: 0.12 });
c.prop(r3(T.pull + 0.55), "gold", { x: 0.24, z: -0.06 }, 0.6, "inOut");
sfx(r3(T.pull + 0.6), "coins", { gain: 0.6, reason: "the whole pile slides across to Reaper" });
A(r3(T.ask - 0.1), "rprF", "look", { to: [-0.35, 0.05], dur: 0.2, blink: false });   // a flat look across at the empty chair
A(r3(T.ask + 0.5), "rprF", "blink", { dur: 0.3 });
A(r3(T.ask + 0.8), "rprF", "still", { dur: r3(END - T.ask - 0.85), idle: 0.15 });
c.prop(r3(T.endLine + 0.2), "studio", { dim: 0.5 }, 1.2, "inOut");
see(r3(T.up1 + 0.5), r3(T.up2 - 0.05), ["chairS"], "Samurai's chair comes back up empty, in steam");
see(r3(T.up2 + 0.5), r3(END - 0.1), ["rprF.face", "chairS", "gold"], "Reaper back in his chair, fried and bored, the gold in his gloves, the other chair empty");

// ---------------------------------------------------------------- shots
const WIDE0 = frame([0, 0.78, -0.3], { az: 0, el: 14, h: 4.8, fov: 40 });
const WIDE = frame([0, 0.8, -0.3], { az: 0, el: 14, h: 4.5, fov: 40 });
// the countdown is one shot: the two-shot of the stare-down pushes in through the handshake (panels 03 to 04)
const CLOSE = frame([0, 1.03, -0.6], { az: 0, el: 5, h: 2.95, fov: 34 }), CLOSE_IN = frame([0, 1.0, -0.55], { az: 0, el: 6, h: 2.6, fov: 34 });
const MED = frame([0, 0.6, -0.28], { az: 0, el: 18, h: 3.5, fov: 38 });
const ENDW = frame([0.12, 0.8, -0.35], { az: 0, el: 11, h: 4.0, fov: 40 });
const beats = c.beats([
  ["title", 0, { ...WIDE0, to: { pos: WIDE.pos, look: WIDE.look, fov: WIDE.fov }, dur: T.count }],
  ["4", T.count, { ...CLOSE, to: { pos: CLOSE_IN.pos, look: CLOSE_IN.look, fov: CLOSE_IN.fov }, dur: r3(T.zero - T.count) }],
  ["0: steal", T.zero, MED],
  ["steal too", r3(T.flip2 - 0.2), MED, "payoff"],
  ["the drop", r3(T.drop - 0.27), WIDE],
  ["you can't fry death", r3(T.up2 + 0.6), { ...WIDE, to: { pos: ENDW.pos, look: ENDW.look, fov: ENDW.fov }, dur: 3.2 }],   // starts on the WIDE: no cut to see
], END);

write(import.meta.url, {
  id: "samurai-vs-reaper",
  title: "Share or Steal 02: Samurai vs Reaper",
  idea: "A trust game on a grate over boiling oil: the two calm ones shake on it, both steal, both drop; the lift brings Reaper back up fried and he takes the gold",
  fps: 30, look: "anime-pro", profile: "short", loop: false, captionStyle: "kinetic",
  captionBand: [240, 1360],
  castLook: "sheet",
  cleanStart: true,
  motion: { feet: 2, overlap: true, timing: true, solve: true },
  rig: { hand: 2, eyes: 2, hold: 2 },
  physics: true,
  animeTiming: true,
  panels: { md: "storyboards/series/share-or-steal/02-samurai-vs-reaper/PANELS.md" },
  set: { type: "plain", color: "#0c0b11", floor: "none", night: true, para: 0, bloom: "emissive", key: [0.4, 5.5, 1.6],
    aperture: 0, lighting: 2, hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true, satsuei: true },
  // the tension bed under the game, cut dead as Reaper's card turns; the warm bed comes in dry under the end line
  music: { file: "ai/sos-tension/sos-tension-01.ogg", gain: 0.36, lowCut: 100, duck: { db: 9 }, until: r3(T.flip2 + 0.24),
    then: { file: "ai/sos-warm/sos-warm-01.ogg", from: T.endLine, until: END, gain: 0.3 } },
  sound: { sfx: 0.6, ambience: 0.2, guard: true, surface: "indoor" },
  hook: { show: ["sam", "rpr", "gold", "vat"], hint: 0, what: "two calm players on a grate over a vat of boiling oil, each holding up a SHARE and a STEAL card, the gold between them" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    { who: "sam", with: "chairS", from: 0, to: r3(T.drop + 0.35), reason: "Samurai sits in his chair (and rides it down on the lift)" },
    { who: "rpr", with: "chairR", from: 0, to: r3(T.drop + 0.35), reason: "Reaper sits in his chair (and rides it down on the lift)" },
    { who: "rprF", with: "chairR", from: 0, to: END, reason: "Reaper, fried, sits in his chair as the lift brings it back up" },
    { who: "rpr", with: "rprF", from: 0, to: END, reason: "the same character: the fried Reaper is hidden until the lift comes back up and takes the first one's place under the oil" },
    { who: "sam", with: "rpr", from: r3(T.clasp - 0.15), to: r3(T.zero + 0.1), reason: "the handshake: their gloves clasped over the table" },
    ...["sam", "rpr", "rprF"].flatMap((who) => [LIFT[who === "sam" ? "sam" : "rpr"], "vat"].map((w) => ({ who, with: w, from: who === "rprF" ? 0 : r3(T.drop - 0.05), to: who === "rprF" ? r3(T.up2 + 0.5) : END, reason: who === "rprF" ? "the fried Reaper waits under the oil and rides his lift up through the hatch" : "he goes down through the hatch on his lift, into the vat (hidden under the oil)" }))),
    { who: "sam", with: "fanS", from: 0, to: r3(T.count + 0.05), reason: "Samurai holds his fan of two cards and lowers it onto his knees" },
    { who: "rpr", with: "fanR", from: 0, to: r3(T.count + 0.05), reason: "Reaper holds his fan of two cards and lowers it onto his knees" },
    { who: "sam", with: "gold", from: T.grab, to: r3(T.flip2 + 0.8), reason: "Samurai's glove on the gold pile" },
    { who: "rprF", with: "gold", from: T.pull, to: END, reason: "Reaper pulls the gold pile to him with both gloves" },
  ],
  notes: "Generated by storyboards/series/share-or-steal/02-samurai-vs-reaper/make-samurai-vs-reaper.mjs.",
});
console.log(JSON.stringify({ ...T, n: undefined, END }));
