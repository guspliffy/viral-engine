// PHONE: "your phone is on 1%: what each fighter does", the "same task, each fighter their own way" format (Jonny's
// rules, 2026-10-24): one living room in the evening, one couch, one charger in the wall. Each fighter flops onto the
// couch scrolling, the phone goes to 1% (a red "1%" pops up), and they deal with it the way a type of real person
// does (docs/each-activities.md), in their signature way. One continuous take. Frame 0 is the Astronaut on 1%,
// reaching for his power bank; the last frame sets that up again.
//   node storyboards/make-phone.mjs   ->  storyboards/phone-01-one-percent.json
import { clip } from "./each-lib.mjs";

const COUCH = [0.2, -1.3], SOCKET = [-0.95, 0.3, -1.975], REST = [-0.42, 0.02, -0.95];   // the charger's plug end lies by the couch
const WAIT = [1.6, -0.9], NEAR = [0.75, -1.05], ENTER = [2.8, -0.85], OUT = [-0.35, -0.4], EXIT = [-2.9, -0.4];
const FACE = { o: [-0.05, 0.72, 0.32] }, FLICK = { o: [-0.03, 0.76, 0.32] };   // the phone in front of the face; a thumb flick
const PLUG_OFF = [0, -0.07, 0.02];   // the plug end held at the bottom of the phone
const RED = "#e8402f", GREEN = "#2fb84a", GREY = "#6b6b6b";
const c = clip({
  id: "phone-01-one-percent", title: "1%: what each fighter does when the phone is dying",
  format: "each-character-vs-X, one continuous take: fighters take turns on one couch with a phone on 1%, each copes their own way",
  set: { type: "livingroom" },
  props: [
    { id: "couch", kind: "couch", x: COUCH[0], z: COUCH[1], color: "#3f7f74", color2: "#58a294" },
    { id: "hole", kind: "socket", hole: true, x: SOCKET[0], y: SOCKET[1], z: SOCKET[2] - 0.004, scale: 0 },
    { id: "socket", kind: "socket", x: SOCKET[0], y: SOCKET[1], z: SOCKET[2], wall: "#e9b98a" },
    { id: "charger", kind: "charger", x: SOCKET[0], y: SOCKET[1], z: SOCKET[2] + 0.01, to: "plug", cable: "#3a3a3a", thick: 0.014, knotAt: 0.82, knotSize: 2 },
    { id: "plug", kind: "plugend", x: REST[0], y: REST[1], z: REST[2], tilt: 90 },
    { id: "ph0", kind: "phone", x: COUCH[0], y: 0.8, z: COUCH[1] + 0.3, glow: 1, scale: 1.5 },
    { id: "ph1", kind: "phone", x: ENTER[0], y: 0.5, z: ENTER[1], glow: 1, scale: 1.5 },
    { id: "pbank", kind: "powerbank", x: COUCH[0], y: 0.6, z: COUCH[1] + 0.3, scale: 0 },
    { id: "bolt", kind: "bolt", x: 0.1, y: 0.95, z: -1.0, scale: 0.4 },
  ],
});
const { A, prop, fx, sfx, walk } = c;
const grab = (who, id, hand, at, off = [0, 0, 0.03], dur = 0.01) => c.items.push({ who, do: "grab", prop: id, hand, at, dur, off });
const release = (who, id, at, to, dur = 0.25, arc = 0) => c.items.push({ who, do: "release", prop: id, at, to, dur, arc });
const pct = (who, t, text, color = RED, dur = 0.8) => fx(t, { fx: "alert", who, text, color, dur });

// ---- pieces every turn uses
let k = 1;
const queue = (who, t) => {   // in from the right, scrolling, waits just off screen
  const ph = `ph${k++ % 2}`;
  prop(ph, t - 0.03, { glow: 1, burn: 0, scale: 1.5 }, 0);
  A(who, t, "show"); grab(who, ph, "R", t);
  A(who, t, "turn", { to: "left", dur: 0.01 }); walk(who, t, WAIT, 0.5); A(who, t + 0.45, "turn", { to: "camera", dur: 0.15 });
  A(who, t + 0.5, "arm", { side: "R", pose: FACE, dur: 0.2 });
  return ph;
};
const sitDown = (who, t) => {   // walks in, flops onto the couch, phone up, and there it is: 1%
  A(who, t - 0.32, "turn", { to: "left", dur: 0.1 }); walk(who, t - 0.32, NEAR, 0.32, "out", 2);
  A(who, t, "sit", { seat: "couch", dur: 0.35 }); sfx(t + 0.3, "land", { gain: 0.2 });
  A(who, t + 0.3, "arm", { side: "R", pose: FACE, dur: 0.15 }); A(who, t + 0.3, "look", { to: [-0.15, -0.2], dur: 0.12 });
  pct(who, t + 0.45, "1%", RED, 0.55); sfx(t + 0.45, "sting", { gain: 0.18 }); A(who, t + 0.5, "expr", { expr: "shocked" });
  return t + 0.65;
};
const leave = (who, t, dur = 0.5) => {
  A(who, t, "stand", { dur: 0.2 }); A(who, t + 0.05, "turn", { to: "left", dur: 0.15 }); A(who, t, "look", { to: [0, 0], dur: 0.12 });
  walk(who, t + 0.1, OUT, 0.25, "inOut", 2); walk(who, t + 0.35, EXIT, dur, "linear"); A(who, t + 0.35 + dur, "hide");
  return t + 0.3;
};
const order = ["ast", "rea", "sor", "wiz", "dra", "phx", "gun", "all", "sam", "vik"];
c.cast("ast", COUCH, { expr: "shocked" });
for (const id of order.slice(1)) c.cast(id, ENTER, { hidden: true });
for (const id of order) for (const p of ["couch", "ph0", "ph1", "plug", "pbank", "bolt"]) c.clipOk(id, p);

// ---- 1. Astronaut: always carries a power bank. Out of the suit, plugged in, 100%
// (frame 0: on the couch, the red 1% just popped; the last frame matches)
const start = (t) => {
  A("ast", t, "sit", { seat: "couch", dur: 0.01 }); grab("ast", "ph0", "R", t); A("ast", t, "arm", { side: "R", pose: FACE, dur: 0.01 });
  A("ast", t, "look", { to: [-0.15, -0.2], dur: 0.01 }); A("ast", t, "expr", { expr: "shocked" });
};
start(-0.4); pct("ast", -0.15, "1%");
c.beat("ast", 0, "always prepared: a power bank out of his suit, 100% in a second", "carries a power bank");
A("ast", 0.2, "look", { to: [0, 0], dur: 0.12 }); A("ast", 0.45, "look", { to: [-0.15, -0.2], dur: 0.12 });   // a look at us: 1%!
grab("ast", "pbank", "L", 0.5, [0, 0, 0.03], 0.25); prop("pbank", 0.6, { scale: 2.0 }, 0.2, "out");
fx(0.7, { fx: "sparkle", who: "ast", dur: 0.6 }); sfx(0.7, "tink", { gain: 0.25 });
A("ast", 0.75, "arm", { side: "L", pose: { o: [-0.12, 0.66, 0.36] }, dur: 0.15 }); prop("pbank", 0.85, { glow: 1 }, 0.3);
pct("ast", 1.1, "100%", GREEN); sfx(1.1, "tink", { gain: 0.25 }); A("ast", 1.1, "expr", { expr: "delighted" }); A("ast", 1.15, "look", { to: [0, 0], dur: 0.12 });
let ph = queue("rea", 0.9);
let free = leave("ast", 1.8);
prop("pbank", free + 1.0, { scale: 0, glow: 0 }, 0);

// ---- 2. Reaper: lets it die. Watches the last percent go, completely at peace
let t = free;
c.beat("rea", t, "lets it die: watches it go black, completely at peace", "lets it die");
let b = sitDown("rea", t); A("rea", b - 0.15, "expr", { expr: "deadpan" });
prop(ph, b + 0.35, { glow: -0.2 }, 0.3); pct("rea", b + 0.4, "0%", GREY); sfx(b + 0.4, "sadslide", { gain: 0.15 });
A("rea", b + 0.55, "look", { to: [0, 0], dur: 0.15 }); A("rea", b + 0.6, "expr", { expr: "serene" }); A("rea", b + 0.6, "arm", { side: "R", pose: "lap", dur: 0.25 });
A("rea", b + 0.9, "blink", { dur: 0.2 });
const reaPh = ph; ph = queue("sor", b + 0.3);
free = leave("rea", b + 1.15);

// ---- 3. Sorcerer: won't get up. The charger floats across the room to him
t = free;
c.beat("sor", t, "won't get up for the charger: it floats over to him", "won't get up");
b = sitDown("sor", t);
A("sor", b, "expr", { expr: "smug" }); A("sor", b, "arm", { side: "L", pose: "cast", dur: 0.15 }); A("sor", b, "charge", { to: 1, dur: 0.15 });
fx(b + 0.05, { fx: "poof", pos: REST, dur: 0.4, puffs: 2, sparks: 10, color: "#c9f7b0", spark: "#9dff6a" }); sfx(b + 0.05, "charge", { dur: 0.6, gain: 0.2 });
grab("sor", "plug", "R", b + 0.1, PLUG_OFF, 0.55);
A("sor", b + 0.65, "charge", { to: 0, dur: 0.15 }); A("sor", b + 0.65, "arm", { side: "L", pose: "lap", dur: 0.2 }); sfx(b + 0.65, "click", { gain: 0.3 });
pct("sor", b + 0.7, "100%", GREEN); fx(b + 0.7, { fx: "sparkle", who: "sor", dur: 0.5 });
const sorPh = ph; ph = queue("wiz", b + 0.4);
release("sor", "plug", b + 1.1, REST, 0.3);   // puts it back down as he gets up
free = leave("sor", b + 1.15);

// ---- 4. Wizard: a charging spell... overcharges it. It pops and smokes
t = free + 0.1;
c.beat("wiz", t, "casts a charging spell; the phone overcharges and pops", "the spell goes wrong");
b = sitDown("wiz", t);
A("wiz", b, "expr", { expr: "stern" }); A("wiz", b, "arm", { side: "L", pose: "cast", dur: 0.15 }); A("wiz", b, "charge", { to: 0.8, dur: 0.15 });
fx(b + 0.25, { fx: "poof", who: "wiz", dur: 0.5, puffs: 3, sparks: 12, spark: "#c8b6ff" }); sfx(b + 0.25, "charge", { dur: 0.6, gain: 0.2 });
pct("wiz", b + 0.5, "500%", "#9a4dff", 0.8);
prop(ph, b + 0.85, { burn: 1 }, 0.1); sfx(b + 0.85, "pop", { gain: 0.4 }); fx(b + 0.85, { fx: "flash", dur: 0.08, peak: 0.25 });
fx(b + 0.87, { fx: "poof", who: "wiz", dur: 0.8, puffs: 8, sparks: 0, color: "#6b6b6b" });
A("wiz", b + 0.85, "charge", { to: 0, dur: 0.1 }); A("wiz", b + 0.85, "arm", { side: "L", pose: "lap", dur: 0.2 }); A("wiz", b + 0.9, "expr", { expr: "shocked" });
A("wiz", b + 1.2, "expr", { expr: "sad" }); A("wiz", b + 1.2, "droop", { to: 1, dur: 0.25 });
ph = queue("dra", b + 0.6);
A("wiz", b + 1.5, "droop", { to: 0, dur: 0.15 });
free = leave("wiz", b + 1.55);

// ---- 5. Dragon: the cable's too short. Phone on the charger means sitting on the floor by the socket
t = free;
const SPOT = [-0.95, -1.62];   // crouched in front of the socket
c.beat("dra", t, "plugs it in, and the cable's too short: stuck on the floor by the socket", "the cable's too short");
b = sitDown("dra", t);
grab("dra", "plug", "R", b, PLUG_OFF, 0.3); sfx(b + 0.3, "click", { gain: 0.3 }); pct("dra", b + 0.35, "2%", RED, 0.5);
A("dra", b + 0.3, "arm", { side: "R", pose: { o: [0.4, 0.5, 0.1] }, dur: 0.15 }); A("dra", b + 0.3, "look", { to: [-0.6, -0.3], dur: 0.12 });   // the cable pulls taut
A("dra", b + 0.35, "squash", { amount: 0.1, dur: 0.15 }); fx(b + 0.4, { fx: "shake", dur: 0.15, amp: 0.02 }); A("dra", b + 0.45, "expr", { expr: "shocked" });
b += 0.35;
A("dra", b + 0.45, "stand", { dur: 0.2 }); A("dra", b + 0.5, "turn", { to: "left", dur: 0.15 }); walk("dra", b + 0.55, SPOT, 0.4, "inOut", 2);
A("dra", b + 0.95, "turn", { to: "camera", dur: 0.15 }); A("dra", b + 1.0, "kneel", { dur: 0.7 }); A("dra", b + 1.0, "arm", { side: "R", pose: FACE, dur: 0.15 });
A("dra", b + 1.1, "expr", { expr: "sad" }); fx(b + 1.2, { fx: "sweat", who: "dra", dur: 0.6, count: 4 });
ph = queue("phx", b + 0.55);
c.clipOk("dra", "charger");
A("dra", b + 1.65, "turn", { to: "left", dur: 0.15 }); walk("dra", b + 1.7, EXIT, 0.7, "linear"); A("dra", b + 2.4, "hide");
release("dra", "plug", b + 1.7, REST, 0.25);
free = b + 1.75;

// ---- 6. Phoenix: 1% is plenty. Selfie, selfie, selfie... dies mid-pose
t = free;
c.beat("phx", t, "1% is plenty for one more selfie... and one more", "one more selfie");
b = sitDown("phx", t); A("phx", b, "expr", { expr: "cocky" });
A("phx", b + 0.05, "arm", { side: "R", pose: { o: [0.05, 0.95, 0.35] }, dur: 0.15 }); A("phx", b + 0.05, "look", { to: [-0.2, 0.3], dur: 0.12 });
A("phx", b + 0.2, "expr", { expr: "smug" }); fx(b + 0.25, { fx: "flash", dur: 0.08, peak: 0.25 }); sfx(b + 0.25, "click", { gain: 0.3 });
A("phx", b + 0.4, "arm", { side: "R", pose: { o: [0.25, 0.8, 0.3] }, dur: 0.12 }); fx(b + 0.55, { fx: "flash", dur: 0.08, peak: 0.25 }); sfx(b + 0.55, "click", { gain: 0.3 }); fx(b + 0.5, { fx: "sparkle", who: "phx", dur: 0.5 });
prop(ph, b + 0.75, { glow: -0.2 }, 0.1); pct("phx", b + 0.8, "0%", GREY, 0.6); A("phx", b + 0.8, "expr", { expr: "shocked" }); A("phx", b + 0.8, "look", { to: [0.1, 0.1], dur: 0.1 });
sfx(b + 0.8, "sadslide", { gain: 0.15 });
A("phx", b + 1.1, "arm", { side: "R", pose: "lap", dur: 0.2 }); A("phx", b + 1.1, "expr", { expr: "sad" });
ph = queue("gun", b + 0.5);
free = leave("phx", b + 1.35);

// ---- 7. Gunslinger: power-saving mode. Shoots out the lamp to save battery
t = free;
c.beat("gun", t, "power-saving mode: shoots the lamp out to save battery", "power-saving mode");
b = sitDown("gun", t); A("gun", b, "expr", { expr: "stern" });
A("gun", b + 0.05, "look", { to: [0.8, 0.3], dur: 0.12 }); A("gun", b + 0.05, "arm", { side: "L", pose: "point", dur: 0.12 });
fx(b + 0.3, { fx: "flash", dur: 0.08, peak: 0.25 }); sfx(b + 0.3, "impact", { gain: 0.35 });
fx(b + 0.32, { fx: "poof", pos: [1.2, 1.5, -1.6], dur: 0.4, puffs: 2, sparks: 10, spark: "#ffd34d" }); fx(b + 0.32, { fx: "lights", to: 0.75, lamp: 0, dur: 0.1 });
A("gun", b + 0.5, "arm", { side: "L", pose: "lap", dur: 0.2 }); A("gun", b + 0.5, "look", { to: [-0.15, -0.2], dur: 0.12 }); A("gun", b + 0.55, "expr", { expr: "smug" });
pct("gun", b + 0.6, "1%", RED, 0.5);
ph = queue("all", b + 0.35);
free = leave("gun", b + 1.1);
fx(free + 0.4, { fx: "lights", to: 1, lamp: 1, dur: 0.3 });   // a new bulb (while the next one sits down)

// ---- 8. Allfather: charges it the god way. One lightning bolt, 100%, a little smoke
t = free;
c.beat("all", t, "charges it the god way: one lightning bolt", "the god way");
b = sitDown("all", t); A("all", b, "expr", { expr: "focused" });
A("all", b + 0.05, "arm", { side: "L", pose: "up", dur: 0.15 });
prop("bolt", b + 0.25, { on: 1 }, 0.01); prop("bolt", b + 0.42, { on: 0 }, 0.01); fx(b + 0.25, { fx: "flash", dur: 0.12, peak: 0.4 }); sfx(b + 0.25, "impact", { gain: 0.4 }); fx(b + 0.25, { fx: "shake", dur: 0.2, amp: 0.04 });
pct("all", b + 0.4, "100%", GREEN); fx(b + 0.42, { fx: "poof", who: "all", dur: 0.6, puffs: 3, sparks: 0, color: "#8a8a8a" });
A("all", b + 0.45, "arm", { side: "L", pose: "lap", dur: 0.2 }); A("all", b + 0.5, "expr", { expr: "smug" }); A("all", b + 0.55, "squash", { amount: 0.06, dur: 0.15 });
ph = queue("sam", b + 0.4);
free = leave("all", b + 1.05);

// ---- 9. Samurai: the tangled cable. One clean cut through the knot... the cable is now two cables
t = free;
c.beat("sam", t, "the cable's in a knot: one clean cut, and now it's two cables", "the tangled cable");
prop("charger", t, { knot: 1 }, 0.3);
b = sitDown("sam", t); A("sam", b, "expr", { expr: "serene" });
A("sam", b + 0.05, "look", { to: [-0.4, -0.5], dur: 0.15 });
A("sam", b + 0.2, "arm", { side: "L", pose: "up", dur: 0.12 }); A("sam", b + 0.4, "arm", { side: "L", pose: "point", dur: 0.08 });
fx(b + 0.4, { fx: "speedlines", dur: 0.12 }); fx(b + 0.42, { fx: "flash", dur: 0.08, peak: 0.25 }); sfx(b + 0.42, "shing", { gain: 0.25 });
prop("charger", b + 0.45, { cut: 1 }, 0.25, "in");
A("sam", b + 0.65, "arm", { side: "L", pose: "lap", dur: 0.2 }); A("sam", b + 0.7, "blink", { dur: 0.2 }); A("sam", b + 0.95, "look", { to: [0, 0], dur: 0.15 });
pct("sam", b + 0.95, "1%", RED, 0.5);
ph = queue("vik", b + 0.4);
free = leave("sam", b + 1.25);
fx(free + 0.35, { fx: "poof", pos: [-0.7, 0.15, -1.4], dur: 0.4, puffs: 4, sparks: 4 }); prop("charger", free + 0.4, { knot: 0, cut: 0 }, 0);   // a new cable

// ---- 10. Viking: the cable won't reach the couch? He pulls. The socket comes out of the wall
t = free + 0.1;
c.beat("vik", t, "the cable won't reach the couch, so he pulls: the socket comes out of the wall", "makes it reach");
b = sitDown("vik", t); A("vik", b, "expr", { expr: "stern" });
grab("vik", "plug", "L", b, [0, 0, 0.03], 0.3);
A("vik", b + 0.35, "arm", { side: "L", pose: { o: [0.3, 0.55, -0.1] }, dur: 0.12 }); A("vik", b + 0.35, "squash", { amount: 0.1, dur: 0.12 });
A("vik", b + 0.55, "squash", { amount: 0.1, dur: 0.12 }); fx(b + 0.5, { fx: "shake", dur: 0.3, amp: 0.02 }); fx(b + 0.5, { fx: "sweat", who: "vik", dur: 0.4, count: 3 }); sfx(b + 0.5, "creak", { dur: 0.3, gain: 0.2 });
const rip = b + 0.85, TO = [-0.3, 0.55, -0.95];
sfx(rip, "impact", { gain: 0.5 }); fx(rip, { fx: "shake", dur: 0.35, amp: 0.05 });
fx(rip, { fx: "poof", pos: [SOCKET[0], SOCKET[1], SOCKET[2] + 0.1], dur: 0.6, puffs: 6, sparks: 10, color: "#e9e4d8", spark: "#ffe08a" });
prop("hole", rip, { scale: 1 }, 0.01);
for (const id of ["socket", "charger"]) prop(id, rip, { x: TO[0], y: TO[1], z: TO[2], roll: 200 }, 0.35, "out");
prop("socket", rip + 0.35, { y: 0.06, roll: 270 }, 0.25, "in"); prop("charger", rip + 0.35, { y: 0.06, roll: 270 }, 0.25, "in"); sfx(rip + 0.6, "tink", { gain: 0.3 });
c.clipOk("vik", "socket"); c.clipOk("vik", "charger");
A("vik", rip + 0.25, "arm", { side: "L", pose: "lap", dur: 0.2 }); pct("vik", rip + 0.3, "100%", GREEN);
A("vik", rip + 0.35, "expr", { expr: "happy" }); A("vik", rip + 0.4, "arm", { side: "both", pose: "up", dur: 0.2 });
const vikDone = rip + 0.4;

// ---- the loop: a poof mends the wall; the Astronaut is back on the couch, on 1%: frame 0
const fresh = vikDone + 0.7;
fx(fresh, { fx: "poof", pos: [-0.35, 0.6, -1.4], dur: 0.45, puffs: 14, sparks: 8, spark: "#ffe08a" }); sfx(fresh, "poof", { gain: 0.3 });
A("vik", fresh + 0.08, "hide"); prop(ph, fresh + 0.08, { scale: 0 }, 0);
prop("hole", fresh + 0.08, { scale: 0 }, 0);
for (const id of ["socket", "charger"]) prop(id, fresh + 0.08, { x: SOCKET[0], y: SOCKET[1], z: SOCKET[2] + (id === "charger" ? 0.01 : 0), roll: 0 }, 0);
release("vik", "plug", fresh + 0.08, REST, 0.01);
prop("ph0", fresh + 0.06, { glow: 1, burn: 0, scale: 1.5 }, 0);
A("ast", fresh + 0.06, "show"); start(fresh + 0.07);
const end = fresh + 0.55;
pct("ast", end - 0.15, "1%");

c.finish(end, {
  shot: process.env.SHOT ? JSON.parse(process.env.SHOT) : { pos: [-0.3, 1.3, 4.4], look: [-0.3, 1.2, -1.5], fov: 44 },
  title: "1%", hook: "Phone on 1%.", hookTo: 1.0, askAt: vikDone + 0.1, cover: rip + 0.4,
  file: new URL("./phone-01-one-percent.json", import.meta.url),
});
