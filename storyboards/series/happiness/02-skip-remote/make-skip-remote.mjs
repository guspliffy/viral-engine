// SKIP THE BORING PARTS (Happiness 02 "Does skipping the boring parts make you happy?").
// Jonny 16 Nov 2026: outline go 07:46 Berlin ("create the panels"), "go for it" on skip-remote-sheet-1/2.png 08:18.
// Opener A (the remote is in his hand at frame 0). Looks: DESIGN.md. Takes, cut list, score plan: NOTES.md.
//   node storyboards/series/happiness/02-skip-remote/make-skip-remote.mjs          -> skip-remote.json
//   ... --no-vo -> skip-remote-no-vo.json (staging without the speech model)
//
// THE CHAIN (but / therefore, one feeling per beat)
//   01-02 in a traffic jam Chip starts a joke; Spud has a remote that skips the boring parts (curiosity) THEREFORE he presses
//   it: 03 he is home, Chip's joke is gone (fun). THEREFORE 04-07 he skips the rain, the queue, Monday: each time Chip vanishes
//   mid-moment (the puddle jump, the loaf on his head, two coffees) and the age counter climbs (joy, then unease). 08 "Would you
//   press it?" (the viewer picks). BUT 09-10 every click jumps further: middle-aged, alone (unease). THEREFORE 11 he is 82 and
//   remembers nothing (sadness). BUT 12 the remote has a REWIND button: 13-14 the TV shows what he skipped (warmth + regret).
//   THEREFORE 15-16 he rewinds to the jam at 25; 17 the remote goes in the glove box (the choice); 18 Chip finishes the joke,
//   Spud laughs; 19-20 sunset over the jam, Chip's head on his shoulder (warmth). The question is never answered out loud.
import { clip, write, r3 } from "../../../lib/clip.mjs";
import { hud } from "../../../lib/overlay.mjs";
import * as grips from "../../../lib/grips.mjs";
import { GLOVE } from "../../../../engine/page/props-skipcar.js";

// ---------------------------------------------------------------- the template's picks
const LOOK = "sheet", LIGHTING = 2, HATCH = { boil: 0.25 }, CEL = { at: 0.25 }, ANIME_TIMING = true;
const MOTION = { feet: 2, overlap: true, timing: true, solve: true }, RIG = { hand: 2, eyes: 2, hold: 2 };
const c = clip({ faces: "strong", lines: { sub: true, blink: false } }), { A, sfx, see } = c;
const VO = !process.argv.includes("--no-vo");
const PRE = 0.012;

// ---------------------------------------------------------------- the beats (video s), cut list v0 from the farm's takes
const T = {
  p01: 0, p02: 3.8, click1: 4.4, p03: 4.6, p04: 9.4, click2: 11.0, p05: 11.3, p06: 12.6, click3: 14.4, p07: 14.7, click4: 16.6,
  p08: 17.0, p09: 19.6, click5: 22.6, p10: 23.1, click6: 24.3, p11: 24.7, p12: 28.6, p13: 30.2, p14: 33.0, p15: 35.0, rew: 35.6,
  p16: 36.6, p17: 38.0, p18: 40.0, punch: 40.15, p19: 42.0, p20: 44.4, follow: 49.8, END: 52.2,   // the worries line is 4.7 s spoken (farm 16 Nov)
};
const END = T.END;

// ---------------------------------------------------------------- places (one world; rooms far apart, cameras cut between them)
const COT = [300, 0, 0], STR = [500, 0, 0], OFF = [700, 0, 0], PRK = [900, 0, 0], LIV = [1100, 0, 0];
const add = (o) => (p) => [r3(p[0] + o[0]), r3(p[1] + o[1]), r3(p[2] + o[2])];
const cot = add(COT), str = add(STR), off = add(OFF), prk = add(PRK), liv = add(LIV);
const xz = (p) => [p[0], p[2]];
const PLACES = [[0, "city"], [T.p02, "str"], [T.p03, "cot"], [T.p04, "str"], [T.p07, "off"], [T.p09, "prk"], [T.p10, "liv"], [T.p16, "city"], [T.p17, "str"], [T.p18, "city"], [T.p19, "dusk"]];
const placeAt = (t) => PLACES.filter(([at]) => at <= t + 1e-6).pop()[1];
const ENVS = { city: "golden-city-crossing", dusk: "twilight-city-crossing" };

// ---------------------------------------------------------------- cast: one instance per place and age (no exits from seats)
const PARK = (k) => [400 + k * 3, 400];
const cast = [
  { id: "spud", character: "potatobrawl/spud", rig: "car", at: [-0.55, -0.12], face: 0, arms: { R: { prop: "wheel", grip: "R" } }, grip: { R: "hold" }, expr: "kind", follow: 0.25, shadowFall: 0.001, seed: 1.1 },
  { id: "chip", character: "potatobrawl/chip", rig: "car", at: [0.55, 0.09], face: 0, expr: "delighted", follow: 0.25, shadowFall: 0.001, seed: 2.2 },
  { id: "spudw", character: "potatobrawl/spud", at: PARK(1), face: 0, expr: "kind", follow: 0.3, seed: 1.3 },
  { id: "chipw", character: "potatobrawl/chip", at: PARK(2), face: 0, expr: "delighted", follow: 0.3, seed: 2.4 },
  { id: "spudm", character: "potatobrawl/spud-mid", at: PARK(3), face: 0, expr: "kind", follow: 0.3, seed: 1.5 },
  { id: "spudo", character: "potatobrawl/spud-old", at: PARK(4), face: 0, expr: "sad", follow: 0.3, seed: 1.7 },
  { id: "chipo", character: "potatobrawl/chip", at: PARK(8), face: 0, expr: "happy", follow: 0.3, seed: 2.5 },
  { id: "chipf", character: "potatobrawl/chip", at: PARK(5), face: 0, expr: "delighted", follow: 0.3, seed: 2.6 },
  { id: "wedge", character: "potatobrawl/wedge", at: PARK(6), face: 0, expr: "happy", follow: 0.3, seed: 3.3 },
  { id: "mash", character: "potatobrawl/mash", at: PARK(7), face: 0, expr: "happy", follow: 0.3, seed: 4.1 },
];
const place = (t, who, at, yaw, y = 0) => {
  const u = Math.max(0, r3(t - PRE));
  A(u, who, "move", { to: at, y, dur: 0.01, steps: 0, ease: "linear", sync: true });
  if (yaw != null) A(u, who, "turn", { to: yaw, dur: 0.01, ease: "linear", sync: true });
  A(u, who, "show");
};
const park = (t, who, k) => { const u = Math.max(0, r3(t - PRE)); A(u, who, "hide"); A(u, who, "move", { to: PARK(k), y: 0, dur: 0.01, steps: 0, ease: "linear", sync: true }); };
const look = (t, who, to, dur = 0.18) => A(r3(t), who, "look", { to, dur, blink: false });
const expr = (t, who, e, set, dur = 0.15) => A(r3(t), who, "expr", { expr: e, ...(set && { set }), dur });
const arm = (t, who, side, pose, dur = 0.25, ease = "inOut") => c.arm(r3(t), who, side, pose, dur, ease);
const grip = (t, who, side, shape, dur = 0.1) => A(r3(t), who, "grip", { side, shape, dur });
const SUBY = 470;   // under the age chip (y 214-332), inside the upper third, never over the faces (they sit lower)
const say = (t, who, line, dur, tone, pos = SUBY) => c.say(r3(t), who, line, dur, tone, { voice: false, sub: line, pos });

// ---------------------------------------------------------------- props, each in its place (shown only while its place is up)
const props = [];
const P = (where, spec, { from = 0, to = 99, stay = false } = {}) => { props.push({ ...spec, _place: where, _from: from, _to: to, _stay: stay }); return spec; };
const has = (id) => props.some((p) => p.id === id);
const pr = (t, id, set, dur = 0.01, ease = "linear", reason) => { if (has(id)) c.at(r3(t), { do: "prop", id, set, dur, ease, ...(reason && { reason }) }); };

// ---- Spud's car (DESIGN 4): the hatchback rig in teal, its seats, wheel, dressing and dash; it is in the jam (01-02, 16-20)
// and parked at the cottage (03). Seats raised from the bench so both read through the windscreen (panel 01)
const CAR_CITY = [0, 0, 1.0], CAR_COT = cot([-2.3, 0, 1.2]), CAR_STR = str([-2.0, 0, 2.4]);
// 02 and 17 look forward out of the windscreen (+z), behind the painting camera: those close-ups are shot on the built
// street instead, the car turned to face its shop fronts (a built room has walls all round; DESIGN 4 close-ups)
// rig keys blend on a Catmull-Rom curve: a hard jump overshoots between its keys, so each jump is four keys squeezed
// into 12 ms that sit between two frames (a cut lands on a frame; the frame before it is 33 ms earlier)
const K = (at, pos, yaw) => ({ at: r3(at), pos, yaw, pitch: 0, roll: 0 });
const jump = (cut, a, ya, b, yb) => [K(cut - 0.024, a, ya), K(cut - 0.02, a, ya), K(cut - 0.016, b, yb), K(cut - 0.012, b, yb)];
const rigs = [{ id: "car", kind: "hatchback", color: "#3f7f7b", plate: false, pivot: [0, 0, 0], keys: [
  K(0, CAR_CITY, 0), ...jump(T.p02, CAR_CITY, 0, CAR_STR, 180), ...jump(T.p03, CAR_STR, 180, CAR_COT, -90), ...jump(T.p04, CAR_COT, -90, CAR_CITY, 0),
  ...jump(T.p17, CAR_CITY, 0, CAR_STR, 180), ...jump(T.p18, CAR_STR, 180, CAR_CITY, 0),
] }];
const GX = 0.05;   // the glove box nearer the middle of the dash, inside Spud's reach from the driver's seat (17)
const SEAT = { kind: "carseat", rig: "car", color: "#e8dcc4", trim: "#c9b893", head: 1, width: 0.52, z: 0.06 };
P("all", { id: "seatS", ...SEAT, x: -0.55, y: 0.24, z: -0.15 });   // back 21 cm: his belly clears the dash
P("all", { id: "seatC", ...SEAT, x: 0.55, y: 0.40 });
P("all", { id: "wheel", kind: "steer", rig: "car", x: -0.55, y: 0.98, z: 0.55, tip: 34, color: "#2a2520" });   // clear of his belly (layout: his face is at z 0.39)
P("all", { id: "carlook", kind: "skipcar", rig: "car", x: 0, y: 0, z: 0 });
P("all", { id: "dash", kind: "skipdash", rig: "car", x: 0, y: 0, z: 0, glove: 0, gx: GX });
// the jam (DESIGN 4: reused citycar, stopped, lamps on), behind and beside the teal car on the painted road
const JAM = [[0, -4.6, 0], [0.1, -9.4, 0], [-3.1, 2.6, 180], [-3.0, -2.4, 180], [-3.2, -7.6, 180], [0.2, -14.6, 0]];
JAM.forEach(([x, z, rot], i) => P("city+dusk", { id: `jam${i}`, kind: "citycar", x, y: 0, z, rot, color: ["#c9483d", "#e8e2d4", "#3d5a8a", "#d9a63a", "#7d8a8e", "#a8c3c9"][i] }));

// ---- the remotes: four instances, never a hand-off (DESIGN 1)
const REM0 = [-0.31, 0.86, 0.28];   // "rem" in Spud's left hand at frame 0, so the hold needs no reach. In the CAR'S frame: a rig rider's hold
// targets are read in the rig's space (layout, 16 Nov: world numbers put his hand a car-offset ahead of him)
// draft 1 (Jonny 16 Nov: "most of the time the remote is glitched in hands"): 0.8 scale (0.10 x 0.20 m), held at chest
// height below the eyes (layout: eyes 0.61 standing, 0.47-0.50 seated, 1.15 in the car), tipped back in the car
const REMS = 0.8, HSTAND = [0.18, 0.2, 0.3], HSEAT = [0.17, 0.1, 0.36];
const REM = (id, where, o = {}) => P(where, { id, kind: "skipremote", x: 0, y: -30, z: 0, scale: REMS, press: 0, dust: 0, wipe: 0, ...o }, { stay: true });
REM("rem", "city+dusk+str", { ...grips.placeFor("skipremote", REM0, 0), tip: -35 });        // clean, in Spud's hand in the car (01-02, 16-17), then in the glove box
REM("remw", "cot+str+off");       // clean, young Spud walking (03-08)
REM("remm", "prk+liv", {}, );     // clean, middle-aged Spud (09-10)
// the one lying in the glove box (17): rides the car, so it sits in the box whatever the car does; shown when his hand lets go
P("all", { id: "remg", kind: "skipremote", rig: "car", x: GX, y: 0.7815, z: 0.61, rot: 0, tip: -90, scale: 0.001, press: 0, dust: 0, wipe: 0, staged: "lies on the glove box floor" }, { stay: true });
REM("remd", "liv", { dust: 0.45, halo: 1, staged: "it lies on the sofa's armrest" });   // dusty on the armrest (11)
REM("remo", "liv", { dust: 0.45 });            // dusty, in old Spud's hands (12-15)

// ---- the cottage (03): the red door, Spud home
P("cot", { id: "door", kind: "archdoor", ...Object.fromEntries(["x", "y", "z"].map((k, i) => [k, cot([0, 0, -0.81])[i]])), color: "#a7382e" });

// ---- the street (04 wet, 05 dry, 06 the bakery queue further along)
const PUD = str([0.35, 0, 0.75]);
P("str", { id: "puddle", kind: "wetpuddle", x: PUD[0], y: 0, z: PUD[2], rx: 0.85, rz: 0.55, splash: 0 }, { to: T.p05 });
P("str", { id: "rain", kind: "rainbox", ...Object.fromEntries(["x", "y", "z"].map((k, i) => [k, str([0, 0, 0.5])[i]])), box: [8, 6, 8], n: 1500, streak: 0.55 }, { to: T.p05 });
const UMB = { id: "umb", kind: "umbrella", x: 0, y: -30, z: 0, open: 1 };
P("str+off", UMB, { to: T.p07, stay: true });   // folded at his side through the queue; he lets go on the office cut
const STALL = str([3.2, 0, -0.5]);
P("str", { id: "stall", kind: "marketstall", x: STALL[0], y: 0, z: STALL[2], rot: 0, w: 1.8, h: 1.9, d: 0.8, color: "#c84a3a" }, { from: T.p06 });
[[2.3, 0.35], [1.75, 0.45], [1.25, 0.4]].forEach(([x, z], i) => { const p = str([x, 0, z]); P("str", { id: `q${i}`, kind: "streetpotato", x: p[0], y: 0, z: p[2], rot: 90, dress: "coat", hat: i % 3, color: ["#6b6e72", "#7a5a44", "#55606a"][i] }, { from: T.p06 }); });
P("str", { id: "loaf", kind: "loaf", x: 0, y: -30, z: 0, staged: "balanced on Chip's head (panel 06)" }, { from: T.p06, stay: true });

// ---- the office (07-08)
const DESK = off([0, 0, -0.35]);
P("off", { id: "desk", kind: "officedesk", x: DESK[0], y: 0, z: DESK[2], rot: 0, color: "#b9a98f", w: 1.5, d: 0.75 });
P("off", { id: "chair", kind: "chair", ...Object.fromEntries(["x", "y", "z"].map((k, i) => [k, off([0, 0, -1.05])[i]])), rot: 0 }, { stay: true });   // seats stay at floor height (a "sit" reads the seat from its spec)
const CUP1 = P("off", { id: "cup1", kind: "cocoacup", x: 0, y: -30, z: 0, steam: 0.35 }, { stay: true });
const CUP2 = P("off", { id: "cup2", kind: "cocoacup", x: 0, y: -30, z: 0, steam: 0.35 }, { stay: true });

// ---- the park (09)
const BENCH = prk([0.2, 0, 0.55]);
P("prk", { id: "pbench", kind: "parkbench", x: BENCH[0], y: 0, z: BENCH[2], rot: 0, w: 2.0 }, { stay: true });

// ---- the living room (10-15): the couch where the set wants it (x 0.2, z -1.3, facing +z), the box TV on its sideboard
// front-left of it, turned to face him
const COUCH = liv([0.2, 0, -1.3]), TV = liv([-1.4, 0, -0.1]), TVROT = 121;
P("liv", { id: "couch", kind: "couch", x: COUCH[0], y: 0, z: COUCH[2], rot: 0, color: "#7e6a74", color2: "#8f7a84" }, { stay: true });
P("liv", { id: "sideb", kind: "sideboard", x: TV[0], y: 0, z: TV[2], rot: TVROT });
const TVS = (f) => ({ src: `storyboards/series/happiness/02-skip-remote/tv/${f}.png`, cols: 1, rows: 1 });
P("liv", { id: "tv", kind: "boxtv", x: TV[0], y: 0.55, z: TV[2], rot: TVROT, on: 0, screen: TVS("tv-jam") }, { to: T.p14 });
P("liv", { id: "tv2", kind: "boxtv", x: TV[0], y: 0.55, z: TV[2], rot: TVROT, on: 1, castLight: 1.6, screen: TVS("tv-puddle") }, { from: T.p14 });
P("liv", { id: "tear", kind: "tear", wear: "spudo", x: -0.12, y: 0.42, z: 0.36, fill: 0, on: 0 }, { from: T.p14 });

// prime every key that is first tweened later (an unseeded tween writes NaN)
for (const id of ["rem", "remw", "remm", "remd", "remo"]) pr(0, id, { press: 0, dust: id === "remd" || id === "remo" ? 0.45 : 0, wipe: 0 });
pr(0, "dash", { glove: 0 }); pr(0, "puddle", { splash: 0 }); pr(0, "tear", { fill: 0, on: 0 });

// show each prop only while its place is up and inside its own from-to (hidden = tiny and 30 m under the floor)
function hideOffstage() {
  for (const p of props) {
    const mine = (name) => p._place === "all" || p._place.split("+").includes(name);
    const on = (t) => mine(placeAt(t)) && t >= p._from - 1e-6 && t < p._to - 1e-6;
    const full = p.scale ?? 1, y0 = p.y ?? 0, away = (now) => ({ scale: now ? full : 0.001, ...(!p.wear && !p._stay && !p.rig && { y: now ? y0 : -30 }) });
    let was = on(0);
    if (!was) Object.assign(p, away(false));
    const times = [...new Set([...PLACES.slice(1).map(([at]) => at), p._from, p._to])].filter((t) => t > 0 && t < END).sort((x, y) => x - y);
    for (const t of times) { const now = on(t); if (now !== was) c.at(r3(t - PRE), { do: "prop", id: p.id, set: away(now), dur: 0.01, ease: "linear", reason: "off the set between scenes: hidden and parked under the floor on the cut" }); was = now; }
  }
}

// a press of the skip button (DESIGN 1 + 7): eyes drop, the thumb presses, a real click, then the hard cut
const press = (t, who, rid, key = "press") => {
  look(t - 0.15, who, [0.15, -0.6], 0.12);
  if (key) { pr(t, rid, { [key]: 1 }, 0.1, "in"); pr(t + 0.2, rid, { [key]: 0 }, 0.12, "out"); }
  sfx(t + 0.08, "click", { gain: 0.55, reason: "the remote's button clicks down" });
};
// a point in a character's own frame (x out to its left, y up, z forward) -> the world; yaw as in "turn"
const rotYd = ([x, y, z], d) => { const a = (d * Math.PI) / 180; return [x * Math.cos(a) + z * Math.sin(a), y, -x * Math.sin(a) + z * Math.cos(a)]; };
const local = (base, yaw, p) => rotYd(p, yaw).map((v, i) => r3(v + base[i]));
const specOf = (id) => props.find((p) => p.id === id);
// a hold made where the prop already is: the prop is put in the hand's reach on the cut (the hold is prop-led, grips.mjs),
// then the hand closes on it. Each holder is placed at the same moment, so the first frame of the shot shows the hold.
const takeAt = (t, who, id, world, yaw, make) => {
  const spec = specOf(id), pf = grips.placeFor(spec.kind, world, yaw);
  pr(r3(t - PRE), id, pf, 0.01, "linear", "put in the hand on the cut (it is off screen until then)");
  const h = make({ ...spec, ...pf });
  h.secure(r3(t - PRE + 0.001), 0.01);
  return h;
};
const REMOTE = (t, who, id, world, yaw) => takeAt(t, who, id, world, yaw, (s) => grips.phone(c, who, s, { side: "L", gap: 0.035, height: 0.42 }));
const MUGL = (t, who, id, world, yaw, side) => takeAt(t, who, id, world, yaw, (s) => grips.mug(c, who, s, { side }));

// ================================================================= 01-02 THE JAM (0-4.6): the remote, Chip's joke
for (const w of ["spud", "chip"]) A(0, w, "sit", { seat: w === "spud" ? "seatS" : "seatC", dur: 0, hands: "keep" });
const SPUD_CAR = [-0.55, 0, 1.09];   // his seat in the world while the car is in the jam (rig at CAR_CITY, yaw 0)
const hR = grips.phone(c, "spud", specOf("rem"), { side: "L", gap: 0.035, height: 0.42 }); hR.secure(0, 0.01);
expr(0, "spud", "deadpan", { brow: 0.1 }, 0.01); look(0, "spud", [0.25, -0.45], 0.01);
expr(0, "chip", "delighted", { open: 0.35 }, 0.01); look(0, "chip", [-0.8, 0.0], 0.01);
arm(0, "chip", "R", "shrug", 0.01); arm(0, "chip", "L", "shrug", 0.01); grip(0, "chip", "R", "open", 0.01); grip(0, "chip", "L", "open", 0.01);
A(0.2, "chip", "talk", { line: "So a potato walks into a bar...", tone: "happy", dur: 3.4, speech: false });
A(0.9, "chip", "hop", { height: 0.02, dur: 0.25, quiet: true }); A(2.3, "chip", "hop", { height: 0.02, dur: 0.25, quiet: true });
look(1.6, "spud", [0.1, -0.5], 0.2);
see(0, T.p02, ["spud.face", "chip.face", "rem"], "a traffic jam: Spud at the wheel looks at a remote in his hand; Chip beside him tells a joke, hands up");
// 02: he lifts it into view, the white button to us (turned like 08), and presses
hR.carry(r3(T.p02 - PRE), [-0.31, 0.9, 0.3], 0.01, "linear", { tip: -45 });   // a little up, the button toward his eyes
press(T.click1, "spud", "rem");
see(T.p02, T.p03, ["rem"], "close from over his head: his thumb on the big white fast-forward button");
void SPUD_CAR;

// ================================================================= 03 HOME (4.6-9.4): the joke is gone
A(r3(T.p03 - PRE), "spud", "hide");   // he is out of the car (03 has its own walking Spud); back on the cut to 16
A(T.p03 - PRE, "chip", "talk", { line: "", dur: 0.01, speech: false });
arm(T.p03 - PRE, "chip", "R", "rest", 0.01); arm(T.p03 - PRE, "chip", "L", "rest", 0.01); grip(T.p03 - PRE, "chip", "R", "relaxed", 0.01); grip(T.p03 - PRE, "chip", "L", "relaxed", 0.01);
expr(T.p03, "chip", "shocked", { open: 0.3, eye: 1.2 }, 0.1); look(T.p03, "chip", [0.6, 0.0], 0.1);
A(T.p03 + 0.5, "chip", "blink", { dur: 0.3 }); A(T.p03 + 1.4, "chip", "blink", { dur: 0.3 });
const W03 = cot([-1.3, 0, 2.3]), W03b = cot([-1.0, 0, 3.0]);
place(T.p03, "spudw", xz(W03), 30);
const hW = REMOTE(T.p03, "spudw", "remw", local(W03, 30, HSTAND), 30);
expr(T.p03, "spudw", "happy", { curve: 0.5 }, 0.01); look(T.p03, "spudw", [0.3, 0.1], 0.01);
A(T.p03 + 0.2, "spudw", "move", { to: xz(W03b), dur: 1.6, stride: 0.3 });
hW.carry(r3(T.p03 + 0.2), local(W03b, 30, HSTAND), 1.6, "inOut");   // walks with him (the hold is prop-led)
look(T.p03 + 1.9, "spudw", [0.0, 0.2], 0.2);
see(T.p03, T.p04, ["spudw.face", "chip.face", "remw"], "evening at his cottage: Spud walks off with the remote; Chip still sits in the parked car, blinking, his joke cut off");

// ================================================================= 04-05 RAIN (9.4-12.6): the puddle jump, skipped
A(r3(T.p04 - PRE), "chip", "hide");   // the car is back in the jam with nobody to see; Chip shows again on 16
const S04 = str([-0.9, 0, 0.95]), C04 = str([-0.05, 0, 0.55]);
place(T.p04, "spudw", xz(S04), 25); place(T.p04, "chipw", xz(C04), -60);
hW.carry(r3(T.p04 - PRE + 0.002), local(S04, 25, HSTAND), 0.01, "linear");   // the held remote goes with him over the cut
const hU = MUGL(T.p04, "spudw", "umb", local(S04, 25, [-0.3, 0.52, 0.2]), 25, "R");   // the canopy clear over his leaf
expr(T.p04, "spudw", "deadpan", { brow: 0.1 }, 0.01); expr(T.p04, "chipw", "delighted", { open: 0.4 }, 0.01);
look(T.p04, "chipw", [-0.8, 0.1], 0.01); look(T.p04, "spudw", [0.4, -0.3], 0.01);
A(T.p04 + 0.4, "chipw", "crouch", { to: 0.4, dur: 0.35 }); arm(T.p04 + 0.4, "chipw", "R", "up", 0.3); arm(T.p04 + 0.4, "chipw", "L", "up", 0.3);
sfx(T.p04, "ai/rain-car-roof", { gain: 0.08, dur: 1.9, reason: "rain on the street, far under the voice" });
press(T.click2, "spudw", "remw");
see(T.p04, T.p05, ["spudw.face", "chipw.face", "puddle"], "rain: Chip crouches to jump into a big puddle, grinning at Spud; Spud under his umbrella presses the remote");
// 05: dry and sunny, Chip gone, the umbrella folded at his side
park(T.p05, "chipw", 2);
pr(T.p05 - PRE, "umb", { open: 0 }, 0.01); hU.carry(r3(T.p05 - PRE), local(S04, 25, [-0.36, 0.3, 0.2]), 0.01, "linear");
expr(T.p05, "spudw", "happy", { curve: 0.5 }, 0.01); look(T.p05, "spudw", [0.0, 0.1], 0.01);
see(T.p05, T.p06, ["spudw.face"], "the same street, dry and sunny: Spud alone with his folded umbrella, pleased; no Chip");

// ================================================================= 06 THE QUEUE (12.6-14.7): the loaf on Chip's head, skipped

const S06 = str([0.6, 0, 0.55]), C06 = str([-0.15, 0, 0.75]);
place(T.p06, "spudw", xz(S06), 30); place(T.p06, "chipw", xz(C06), 60);
hW.carry(r3(T.p06 - PRE + 0.002), local(S06, 30, HSTAND), 0.01, "linear");
hU.carry(r3(T.p06 - PRE + 0.002), local(S06, 30, [-0.36, 0.3, 0.2]), 0.01, "linear");
arm(T.p06, "chipw", "R", "up", 0.2); arm(T.p06, "chipw", "L", "up", 0.2);
pr(T.p06 - PRE, "loaf", { x: C06[0], y: 0.72, z: C06[2], rot: 40, scale: 1 }, 0.01, "linear", "set on Chip's head on the cut");
expr(T.p06, "chipw", "delighted", { open: 0.5 }, 0.01); look(T.p06, "chipw", [0.6, 0.0], 0.01);
expr(T.p06, "spudw", "annoyed", { lid: 0.3 }, 0.01); look(T.p06 + 0.3, "spudw", [-0.3, 0.6], 0.2);
press(T.click3, "spudw", "remw");
see(T.p06, T.p07, ["spudw.face", "chipw.face", "loaf"], "a long queue at the bakery: Chip balances a bread loaf on his head to make Spud laugh; Spud rolls his eyes and presses the remote");

// ================================================================= 07-08 MONDAY (14.7-19.6): two coffees, skipped; the question
// the umbrella is gone with the cut (its stretch ends at 07): let go on the cut, the arm straight to rest (no back-off:
// the hold's back-off point is in the street's world)
A(r3(T.p07 - PRE), "spudw", "release", { prop: "umb", dur: 0 }); grip(T.p07 - PRE, "spudw", "R", "relaxed", 0.01); arm(r3(T.p07 - PRE + 0.001), "spudw", "R", "rest", 0.01, "linear");
park(T.p07, "chipw", 2); pr(T.p07 - PRE, "loaf", { y: -30, scale: 0.001 }, 0.01, "linear", "off the set with the cut");
place(T.p07, "spudw", xz(off([0, 0, -1.05])), 0); A(r3(T.p07 - 0.001), "spudw", "sit", { seat: "chair", dur: 0, hands: "keep" });   // after its seat is back on the set (hideOffstage, t - PRE + 0.01)
hW.carry(r3(T.p07 - PRE + 0.002), local(off([0, 0, -1.05]), 0, HSEAT), 0.01, "linear");
const C07 = off([0.85, 0, 0.45]);
place(T.p07, "chipo", xz(C07), -40);
MUGL(T.p07, "chipo", "cup1", local(C07, -40, [-0.24, 0.3, 0.2]), -40, "R");
MUGL(T.p07, "chipo", "cup2", local(C07, -40, [0.24, 0.3, 0.2]), -40, "L");
expr(T.p07, "chipo", "happy", { curve: 0.6 }, 0.01); look(T.p07, "chipo", [-0.7, -0.1], 0.01);
expr(T.p07, "spudw", "deadpan", { lid: 0.35 }, 0.01); look(T.p07, "spudw", [0.1, -0.5], 0.01);
press(T.click4, "spudw", "remw");
see(T.p07, T.p08, ["spudw.face", "chipo.face", "cup1", "cup2"], "Monday at the office: Chip brings two coffees, smiling; Spud presses the remote without looking up");
// 08: up from the desk, the remote held out to us: "Would you press it?"
park(T.p08, "chipo", 8);
const S08 = off([0, 0, 0.45]);
A(T.p08 - PRE, "spudw", "stand", { dur: 0 }); place(T.p08, "spudw", xz(S08), 0);
expr(T.p08, "spudw", "cocky", { brow: 0.5, curve: 0.4 }, 0.01); look(T.p08, "spudw", [0, 0], 0.01);
hW.carry(r3(T.p08 - PRE + 0.002), local(S08, 0, HSTAND), 0.01, "linear", { rot: 0 });   // turned to show us the button on the cut (a 180 in the hand on screen flips the palm)
hW.carry(r3(T.p08 + 0.1), local(S08, 0, [0.08, 0.24, 0.4]), 0.45, "anticSettle", { rot: false });   // turned to show us the button
see(T.p08, T.p09, ["spudw.face", "remw"], "straight to camera: Spud holds the remote out to us, eyebrows up: would you press it?");

// ================================================================= 09-10 FASTER (19.6-24.7): middle-aged, alone
park(T.p09, "spudw", 1);
place(T.p09, "spudm", xz(BENCH), 0); A(r3(T.p09 - 0.001), "spudm", "sit", { seat: "pbench", dur: 0, hands: "keep" });   // after its seat is back on the set (hideOffstage, t - PRE + 0.01)
const hM = REMOTE(T.p09, "spudm", "remm", local(BENCH, 0, [0.17, 0.14, 0.36]), 0);
expr(T.p09, "spudm", "kind", { curve: 0.1 }, 0.01); look(T.p09, "spudm", [0.2, -0.4], 0.01);
const FAR = prk([-1.2, 0, -5.5]);
[["chipf", -1.05], ["wedge", 0], ["mash", 1.05]].forEach(([who, dx]) => {
  place(T.p09, who, [r3(FAR[0] + dx), FAR[2]], 180);
  A(T.p09 + 0.05, who, "move", { to: [r3(FAR[0] + dx - 0.4), r3(FAR[2] - 2.2)], dur: 3.0, stride: 0.3 });
});
look(T.p09 + 1.0, "spudm", [-0.5, 0.0], 0.3);
press(T.click5, "spudm", "remm");
see(T.p09, T.p10, ["spudm.face", "remm", "chipf"], "an autumn park: middle-aged Spud alone on a bench presses again; far away Chip walks with the other friends");
for (const [i, w] of ["chipf", "wedge", "mash"].entries()) park(T.p10, w, 5 + i);
const M10 = liv([1.75, 0, -1.45]);
A(T.p10 - PRE, "spudm", "stand", { dur: 0 }); place(T.p10, "spudm", xz(M10), -95);
hM.carry(r3(T.p10 - PRE + 0.002), local(M10, -95, HSTAND), 0.01, "linear");
expr(T.p10, "spudm", "sad", { curve: -0.1 }, 0.01); look(T.p10, "spudm", [0.2, -0.5], 0.01);
press(T.click6, "spudm", "remm");
see(T.p10, T.p11, ["spudm.face", "remm"], "his living room at dusk: middle-aged Spud alone at the window presses once more");

// ================================================================= 11-15 EIGHTY-TWO (24.7-36.6): the rewind button, the TV
park(T.p11, "spudm", 3);
place(T.p11, "spudo", xz(COUCH), 0); A(r3(T.p11 - 0.001), "spudo", "sit", { seat: "couch", dur: 0, hands: "keep" });   // after its seat is back on the set (hideOffstage, t - PRE + 0.01)
pr(T.p11 - PRE, "remd", { ...Object.fromEntries(["x", "y", "z"].map((k, i) => [k, local(COUCH, 0, [0.78, 0.605, -0.15])[i]])), rot: 10, tip: -90, scale: 1 }, 0.01, "linear", "laid on the armrest on the cut");
expr(T.p11, "spudo", "sad", { curve: -0.2, lid: 0.3 }, 0.01); look(T.p11, "spudo", [0.0, -0.3], 0.01);
arm(T.p11 - PRE, "spudo", "R", "lap", 0.01); arm(T.p11 - PRE, "spudo", "L", "lap", 0.01);
see(T.p11, T.p12, ["spudo.face", "remd", "tv"], "a dim living room: Spud at 82 alone on the sofa, the remote dusty on the armrest, the TV dark");
// 12: he holds it; the red button on its back faces us
pr(T.p12 - PRE, "remd", { y: -30, scale: 0.001 }, 0.01, "linear", "swapped for the one in his hand on the cut");
const hO = REMOTE(T.p12, "spudo", "remo", local(COUCH, 0, [0.17, 0.12, 0.42]), 0);
pr(T.p12 + 0.5, "remo", { wipe: 1 }, 0.5, "inOut");   // his thumb clears the dust off the red button
expr(T.p12, "spudo", "shocked", { open: 0.25, eye: 1.15 }, 0.15); look(T.p12, "spudo", [0.15, -0.5], 0.01);
see(T.p12, T.p13, ["spudo.face", "remo"], "close: old Spud finds a small red rewind button on the back of the remote");
// 13-14: the TV plays what he skipped
pr(T.p13, "tv", { on: 1 }, 0.25, "out"); sfx(T.p13, "click", { gain: 0.4, reason: "the old TV switches on" });
expr(T.p13, "spudo", "kind", { curve: 0.2 }, 0.3); look(T.p13, "spudo", [-0.8, 0.05], 0.2);
see(T.p13, T.p14, ["tv"], "over his shoulder: on the old TV, Spud and Chip laughing in the car in the traffic jam");
expr(T.p14, "spudo", "happy", { curve: 0.6, lid: 0.35 }, 0.2); pr(T.p14 + 0.3, "tear", { on: 1, fill: 0.8 }, 0.6);
see(T.p14, T.p15, ["spudo.face", "tv2"], "his face lit by the TV, laughing with a tear; on the TV the two of them jump into the puddle together");
// 15: up off the sofa, he presses REWIND
const O15 = liv([0.2, 0, -0.5]);
A(T.p15 - PRE, "spudo", "stand", { dur: 0 }); place(T.p15, "spudo", xz(O15), 0);
hO.carry(r3(T.p15 - PRE + 0.002), local(O15, 0, HSTAND), 0.01, "linear");
expr(T.p15, "spudo", "focused", { brow: -0.3 }, 0.15); look(T.p15, "spudo", [0.2, 0.3], 0.2);
hO.carry(r3(T.p15 + 0.1), local(O15, 0, [0.14, 0.28, 0.4]), 0.4, "anticSettle");   // held out in front, at chest height
press(T.rew, "spudo", "remo", null);   // the red button has no press key (props-skipremote.js): the click and the cut carry it
see(T.p15, T.p16, ["spudo.face", "remo"], "old Spud stands and holds the remote high, pressing the red rewind button");

// ================================================================= 16-18 BACK IN THE JAM (36.6-42.0): the glove box, the punchline
park(T.p16, "spudo", 4);
A(T.p16 - PRE, "spud", "show"); A(T.p16 - PRE, "chip", "show");
expr(T.p16, "spud", "shocked", { open: 0.25, eye: 1.2 }, 0.01); look(T.p16, "spud", [0.0, 0.1], 0.01);
expr(T.p16, "chip", "delighted", { open: 0.35 }, 0.01); look(T.p16, "chip", [-0.8, 0.0], 0.01);
arm(T.p16 - PRE, "chip", "R", "shrug", 0.01); arm(T.p16 - PRE, "chip", "L", "shrug", 0.01); grip(T.p16 - PRE, "chip", "R", "open", 0.01); grip(T.p16 - PRE, "chip", "L", "open", 0.01);
A(T.p16 + 0.1, "chip", "talk", { line: "...and the bartender says...", tone: "happy", dur: 1.2, speech: false });
A(T.p16 + 0.25, "spud", "blink", { dur: 0.3 }); look(T.p16 + 0.7, "spud", [0.7, 0.0], 0.25);
expr(T.p16 + 0.8, "spud", "kind", { curve: 0.4 }, 0.3);
see(T.p16, T.p17, ["spud.face", "chip.face", "rem"], "back in the traffic jam at 25: Spud blinks, the remote in his hand; Chip mid-joke beside him");
// 17: the glove box (on the street close-up set: the car at CAR_STR turned 180, so car x/z flip in the world)
hR.carry(r3(T.p16 - PRE), REM0, 0.01, "linear", { tip: -35 });   // back at his chest for 16
const GLOVE_IN = [GX, r3(GLOVE.rest[1] + 0.02), r3(GLOVE.rest[2] - 0.02)];   // car space, like REM0
arm(T.p17 - PRE, "chip", "R", "lap", 0.01); arm(T.p17 - PRE, "chip", "L", "lap", 0.01);   // his arms out of the glove box close-up
arm(T.p18 - PRE, "chip", "R", "shrug", 0.01); arm(T.p18 - PRE, "chip", "L", "shrug", 0.01);   // the punchline, hands open
pr(T.p17 + 0.1, "dash", { glove: 1 }, 0.35, "inOut"); sfx(T.p17 + 0.1, "click", { gain: 0.35, reason: "the glove box latch" });
A(T.p17 + 0.15, "spud", "lean", { to: -8, dur: 0.4, ease: "inOut" });
hR.carry(r3(T.p17 + 0.25), [GLOVE_IN[0], r3(GLOVE_IN[1] + 0.08), GLOVE_IN[2]], 0.5, "inOut", { rot: false });
hR.put(r3(T.p17 + 0.8), GLOVE_IN, { dur: 0.2 });
A(T.p17 + 1.3, "spud", "lean", { to: 0, dur: 0.4, ease: "inOut" });
pr(T.p17 + 1.35, "dash", { glove: 0 }, 0.3, "in"); sfx(T.p17 + 1.6, "click", { gain: 0.3, reason: "the glove box snaps shut" });
pr(T.p17 + 0.95, "rem", { scale: 0.001 }, 0.01, "linear", "now the one lying in the glove box (remg)"); pr(T.p17 + 0.95, "remg", { scale: REMS }, 0.01, "linear", "laid in the box as his hand lets go");
pr(T.p18 - PRE, "remg", { scale: 0.001 }, 0.01, "linear", "shut in the glove box");
see(T.p17, T.p18, ["dash", "rem"], "close: Spud lays the remote in the glove box and shuts it");
// 18: the punchline
say(T.punch, "chip", "We don't serve fries here!", 1.4, "happy");
A(T.punch + 1.3, "spud", "squash", { amount: 0.06, dur: 0.3 });
expr(T.punch + 1.3, "spud", "delighted", { open: 0.6, curve: 0.8 }, 0.15); expr(T.punch + 1.3, "chip", "delighted", { open: 0.6 }, 0.15);
A(T.punch + 1.3, "spud", "lean", { to: -6, dur: 0.3 });
see(T.p18, T.p19, ["spud.face", "chip.face"], "Chip's punchline; Spud bursts into a real belly laugh");

// ================================================================= 19-20 SUNSET (42.0-51.0)
A(T.p19, "spud", "lean", { to: 0, dur: 0.4 }); arm(T.p19 - 0.5, "chip", "R", "rest", 0.4); arm(T.p19 - 0.5, "chip", "L", "rest", 0.4);   // hands down for the sunset and the lean (an open hand reached across Spud) expr(T.p19, "spud", "serene", { curve: 0.5 }, 0.4); expr(T.p19, "chip", "serene", { curve: 0.5 }, 0.4);
see(T.p19, T.p20, ["car"], "the jammed road at sunset; the teal car in the line, the sun at the end of the street");
A(T.p20 + 0.4, "chip", "lean", { to: -12, dur: 0.6, ease: "settle" }); A(T.p20 + 0.4, "spud", "lean", { to: 3, dur: 0.6, ease: "settle" });
A(T.p20 + 0.6, "chip", "blink", { dur: 0.4 }); expr(T.p20 + 0.6, "chip", "serene", { lid: 0.6, curve: 0.5 }, 0.4);
see(T.p20, END, ["spud.face", "chip.face"], "close through the windscreen at sunset: Spud smiles softly, Chip's head on his shoulder");

// ---------------------------------------------------------------- the age counter + the question pills (DESIGN 3)
const AGE = [[0, 25], [T.p05, 26], [T.p07, 31], [T.p08, 38], [T.p09, 45], [T.p10, 61], [T.p11, 82], [r3(T.rew + 0.1), 25, 1.5]];
const HUD = hud({ age: { keys: AGE, fade: [r3(T.p19 + 0.8), 1.0] }, pills: [r3(T.p08 + 0.2), r3(T.p08 + 2.4)] });

// ---------------------------------------------------------------- sound beds (far under the music)
const bed = (from, to, s, gain) => { for (let t = from; t < to - 0.2; t = r3(t + 6)) sfx(r3(t), s, { gain, dur: r3(Math.min(6, to - t)), reason: "room tone of the place, far under the music" }); };
bed(0, T.p03, "ai/rain-car-roof", 0.0);

// ---------------------------------------------------------------- shots
const inCar = (pos, lk, fov) => ({ rig: "car", pos, look: lk, fov });
const SH = {
  p01: inCar([-0.05, 1.8, 3.4], [-0.05, 1.1, -0.2], 52),
  p02: inCar([0.05, 1.42, 0.0], [-0.14, 0.9, 0.29], 30),   // the remote is at car (-0.14, 0.9, 0.29) here (layout)
  p03: { pos: cot([-1.5, 1.1, 7.4]), look: cot([-1.55, 0.85, 1.9]), fov: 50 },
  p04: { pos: str([-0.3, 1.05, 4.6]), look: str([-0.3, 0.7, 0.2]), fov: 48 },
  p05: { pos: str([-0.7, 1.0, 4.0]), look: str([-0.8, 0.65, 0.5]), fov: 46 },
  p06: { pos: str([0.3, 1.0, 3.6]), look: str([0.3, 0.72, 0.7]), fov: 50 },
  p07: { pos: off([0.35, 1.35, 2.6]), look: off([0.35, 0.75, -0.4]), fov: 50 },
  p08: { pos: off([0.0, 0.9, 3.5]), look: off([0.0, 0.86, 0.45]), fov: 36 },   // the whole of him and the remote; caption room 210-460 (camfit)
  p09: { pos: prk([0.3, 1.0, 4.4]), look: prk([-0.3, 0.7, -1.5]), fov: 48 },
  p10: { pos: liv([0.2, 1.15, 0.3]), look: liv([1.6, 0.8, -1.5]), fov: 44 },
  p11: { pos: liv([0.6, 1.3, 1.7]), look: liv([-0.3, 0.7, -0.9]), fov: 54 },
  p12: { pos: liv([0.4, 0.38, -0.45]), look: liv([0.36, 0.24, -0.9]), fov: 34 },
  p13: { pos: liv([0.85, 1.25, -1.85]), look: liv([-1.4, 0.85, -0.1]), fov: 44 },
  p14: { pos: liv([-1.0, 1.0, 0.3]), look: liv([0.2, 0.85, -1.25]), fov: 42 },
  p15: { pos: liv([-0.25, 0.95, 1.3]), look: liv([0.25, 0.85, -0.5]), fov: 46 },
  p16: inCar([-0.05, 1.8, 3.4], [-0.05, 1.1, -0.2], 52),
  p17: inCar([0.15, 1.45, 0.1], [0.05, 0.82, 0.55], 46),
  p18: inCar([0.03, 1.8, 3.3], [0.03, 1.15, -0.2], 50),
  p19: { pos: [0, 3.0, 7.8], look: [0, 1.0, -4], fov: 44 },   // inside the painting's range (qa/env.mjs --range): the jam toward the sun
  p20: inCar([0.03, 1.75, 3.9], [0.03, 1.12, -0.2], 40),
};
const CUTS = [
  ["01 the jam", 0, SH.p01, "hook"], ["02 the button", T.p02, SH.p02], ["03 home", T.p03, SH.p03],
  ["04 rain", T.p04, SH.p04], ["05 dry", T.p05, SH.p05], ["06 the queue", T.p06, SH.p06, "escalation"],
  ["07 Monday", T.p07, SH.p07], ["08 would you press it", T.p08, SH.p08], ["09 the bench", T.p09, SH.p09],
  ["10 the window", T.p10, SH.p10], ["11 eighty-two", T.p11, SH.p11, "reveal"], ["12 the red button", T.p12, SH.p12],
  ["13 the TV", T.p13, SH.p13], ["14 the puddle on TV", T.p14, SH.p14, "reaction"], ["15 rewind", T.p15, SH.p15, "escalation"],
  ["16 back at 25", T.p16, SH.p16], ["17 the glove box", T.p17, SH.p17], ["18 the punchline", T.p18, SH.p18, "payoff"],
  ["19 sunset", T.p19, SH.p19], ["20 the shoulder", T.p20, SH.p20],
];

// ---------------------------------------------------------------- the narrator (voice 1, says "you"), lengths from the farm's takes
const NG = 4.0;
const NARR = !VO ? [] : [
  [0.1, "You get a remote that skips the boring parts of life.", 3.67, 1],
  [r3(T.p03 + 0.1), "If you've ever wished a Monday away, watch what it costs you.", 4.6, 1],
  [r3(T.p04 + 0.1), "Rain? Skipped.", 1.9, 1],
  [r3(T.p06 + 0.1), "Queues? Skipped.", 1.85, 2],
  [r3(T.p07 + 0.1), "Mondays? Skipped.", 2.01, 1],
  [r3(T.p08 + 0.1), "Would you press it?", 1.17, 1, 370],   // above his head in the close-up (camfit: free 210-380)
  [r3(T.p09 + 0.1), "But most of life is the boring parts.", 3.25, 1],
  [r3(T.p11 + 0.1), "Eighty-two. And you can't remember a single day.", 3.72, 1],
  [r3(T.p13 + 0.1), "So you rewind, to see what you skipped.", 2.69, 1],
  [r3(T.p19 + 0.1), "The boring parts were the good parts.", 2.2, 1],
  [r3(T.p20 + 0.1), "And for one moment, you forget all your worries.", 4.7, 1],
  [T.follow, "Follow for the next question.", 1.77, 1],   // the follow ask after the payoff (test)
];
for (const [t, line, dur, take, pos = SUBY] of NARR) c.at(r3(t), { macro: "narrate", line, voice: "narrator", take, dur, caption: true, pos, gain: NG });

hideOffstage();
const beats = c.beats(CUTS, END);   // after every item (items added later are dropped)
for (const p of props) { delete p._place; delete p._from; delete p._to; delete p._stay; }
write(import.meta.url, {
  id: VO ? "skip-remote" : "skip-remote-no-vo",
  title: "He skipped every boring part of his life",
  idea: "Happiness series 02: Spud gets a remote that skips the boring parts of life; he skips traffic, rain, queues and Mondays, wakes up at 82 remembering nothing, finds a rewind button and goes back to the traffic jam where his best friend is telling a joke",
  format: "series: Spud looks for happiness (one life question per episode, never answered out loud)",
  fps: 30, look: "anime-pro", castLook: LOOK, profile: "short", loop: false, captionStyle: "kinetic", captionBand: [210, 1360],
  cleanStart: true, motion: MOTION, rig: RIG, physics: true, animeTiming: ANIME_TIMING, loopIdle: false,
  set: {
    type: "env", env: ENVS.city,
    swap: PLACES.slice(1).map(([at, name]) => (name === "cot" ? { at, room: { type: "cottage", pos: COT, seed: 3, pumpkins: false } }
      : name === "str" ? { at, room: { type: "street", pos: STR, parking: true } }
      : name === "off" ? { at, room: { type: "office", pos: OFF } }
      : name === "prk" ? { at, room: { type: "park", pos: PRK } }
      : name === "liv" ? { at, room: { type: "livingroom", pos: LIV } }
      : { at, env: ENVS[name] })),
    aperture: 0, focus: false, lighting: LIGHTING, hatch: HATCH, cel: CEL, ink: true, satsuei: true,
  },
  rigs, hud: HUD,
  music: { file: process.env.MUSIC ?? "skip-remote/skip-remote-score.ogg", gain: 0.6, lowCut: 90, dip: false, duck: { voice: -6 } },
  sound: { signature: false, sfx: 0.65, ambience: VO ? 0.06 : 0.2, surface: "concrete", room: "open", guard: true },
  creative: { length: [END, END] },
  hook: { show: ["spud", "rem", "chip"], hint: 0, what: "in a traffic jam Spud holds a remote with one big fast-forward button while his friend tells a joke" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    { who: "spud", with: "seatS", from: 0, to: END, reason: "sitting in the car seat" },
    { who: "chip", with: "seatC", from: 0, to: END, reason: "sitting in the car seat" },
    { who: "spud", with: "wheel", from: 0, to: END, reason: "hands on the wheel rim" },
    { who: "spud", with: "dash", from: 0, to: END, reason: "his sweater's hem and left elbow touch the dash below the windscreen line: every camera sees the car from the front, the fascia hides them" },
    { who: "spud", with: "car", from: 0, to: END, reason: "he sits inside the car (it encloses him)" },
    { who: "chip", with: "car", from: 0, to: END, reason: "he sits inside the car (it encloses him)" },
    { who: "spudw", with: "chair", from: T.p07, to: T.p09, reason: "sitting on the office chair" },
    { who: "spudm", with: "pbench", from: T.p09, to: T.p10, reason: "sitting on the park bench" },
    { who: "spud", with: "remg", from: r3(T.p17 + 0.9), to: r3(T.p17 + 1.4), reason: "the remote he has just laid in the glove box: his fingers let go of it" },
    { who: "chipw", with: "loaf", from: T.p06, to: T.p07, reason: "the loaf is balanced on his hood (panel 06): it rests on him" },
    { who: "spudo", with: "couch", from: T.p11, to: T.p15, reason: "sitting on the sofa" },
    { who: "spudo", with: "tear", from: T.p14, to: T.p16, reason: "the tear is worn on his cheek" },
    { who: "chip", with: "spud", from: r3(T.p20 + 0.4), to: END, reason: "the lean, panel 20 (DESIGN 8)" },
  ],
  notes: "Generated by storyboards/series/happiness/02-skip-remote/make-skip-remote.mjs.",
});
