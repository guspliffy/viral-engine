// "I could see everyone's happiness score" (Happiness 03), the OPENING + BLOCK A "Copy him" (story 0:00-0:50, panels 01-12).
// Jonny 16 Nov 2026: outline v2 OK, sheets OK, every place in real 3D ("nice well done"); he reviews ONE whole-film animatic.
// One storyboard per place segment (a set is one type per storyboard); every time below is STORY time, each storyboard
// starts at its T0 (kit at() shifts story keys to clip time). The kit (../kit/score-kit.mjs) holds the timeline, the
// scores, HUD, colour arc, voices; this file stages the shots.
//   node storyboards/series/happiness/03-happiness-score/block-a/make-block-a.mjs [tall]   -> hs03-a<n>-wide.json (tall: -tall)
//
// THE CHAIN (Thursday: curiosity, hope, letdown)
//   O1 glasses view: a grey moving-day street, everyone has a number, his own reflection says 41 (the premise, frame 0).
//   O2 he lowers the glasses over the DON'T KEEP box (colour); Mash passes, whistling THE TUNE (the shoulder tap).
//   O3 glasses view: Mash is 88, the van, the train chip SUN 19:42 (the stake + the clock). THEREFORE
//   05 he studies him (the notebook: MASH = 88. WHY?), 06 the bakery, 07-08 copies him (same hoodie, bun, river),
//   09 Wedge: "it's the hoodie". BUT 10 still 41. 11 TWIST 1: every check, it drops (40, 39). 12 rain, 39, alone.
import { clip, write } from "../../../../lib/clip.mjs";
import * as grips from "../../../../lib/grips.mjs";
import {
  r3, FRAME, SETS, CAST, SCORES, at, hudFor, gradeOf, scoreOf, narrate, say, card, tune,
  STREET, HALL, BAKERY, RIVER,
} from "../kit/score-kit.mjs";

const F = process.argv.includes("tall") ? FRAME.tall : FRAME.wide;
const PRE = 0.012;
const rad = (d) => (d * Math.PI) / 180;
const yawTo = (a, b) => r3((Math.atan2(b[0] - a[0], b[1] - a[1]) * 180) / Math.PI);
// a point `d` metres ahead of [x, z] facing yaw, at height y (where a carried box sits in front of the chest)
const ahead = ([x, z], yaw, d, y) => [r3(x + Math.sin(rad(yaw)) * d), r3(y), r3(z + Math.cos(rad(yaw)) * d)];
// a held bun at the chest of a potato at [x, z] facing yaw: fwd metres out, side metres to his right, height y
const chest = ([x, z], yaw, { fwd = 0.45, side = 0.06, y = 0.42 } = {}) => { const a = rad(yaw); return [r3(x + Math.sin(a) * fwd - Math.cos(a) * side), r3(y), r3(z + Math.cos(a) * fwd + Math.sin(a) * side)]; };
const MUSIC = (T0) => ({ file: "score-film/hs03-a-temp.ogg", from: 0, skip: r3(T0), gain: 0.55, lowCut: 90, dip: false, duck: { voice: -6 } });

// a pinhole projection of a world point for a shot (the score tags fixed in px, the reflection's tag, the -1 card)
function project(shot, p) {
  const f = norm(sub(shot.look, shot.pos)), r = norm(cross(f, [0, 1, 0])), u = cross(r, f), d = sub(p, shot.pos);
  const z = dot(d, f), k = F.H / 2 / Math.tan(rad(shot.fov) / 2);
  return [Math.round(F.W / 2 + (dot(d, r) / z) * k), Math.round(F.H / 2 - (dot(d, u) / z) * k)];
}
function sub(a, b) { return a.map((v, i) => v - b[i]); }
function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
function norm(a) { const l = Math.hypot(...a); return a.map((v) => v / l); }
// a camera at pos that puts the world point p at screen px [sx, sy] (a lens centre in a glasses view: wide [1400, 560] / [520, 560])
function aim(pos, p, [sx, sy], fov) {
  const d = sub(p, pos), th = Math.atan2(d[0], d[2]), ph = Math.atan2(d[1], Math.hypot(d[0], d[2])), k = F.H / 2 / Math.tan(rad(fov) / 2);
  const T = th + Math.atan((sx - F.W / 2) / k), P = ph + Math.atan((sy - F.H / 2) / k), L = 6;
  return { pos: pos.map(r3), look: [r3(pos[0] + Math.sin(T) * Math.cos(P) * L), r3(pos[1] + Math.sin(P) * L), r3(pos[2] + Math.cos(T) * Math.cos(P) * L)], fov };
}
// a point in a camera's frame (right, up, forward metres) -> the world (the bun in front of the lens in 10)
const camPoint = (shot, [x, y, z]) => { const f = norm(sub(shot.look, shot.pos)), r = norm(cross(f, [0, 1, 0])), u = cross(r, f); return shot.pos.map((v, i) => r3(v + r[i] * x + u[i] * y + f[i] * z)); };

const SEGS = [];
// one storyboard: key (a1..), set key (kit SETS), story span, and the staging
function seg(key, setKey, T0, T1, build) { SEGS.push({ key, setKey, T0, T1, build }); }

function make({ key, setKey, T0, T1, build }) {
  const c = clip({ faces: "strong", lines: { sub: true, blink: false } }), { A } = c;
  const END = r3(T1 - T0), t = (s) => r3(s - T0);   // story -> clip time
  const cast = [], props = [], cuts = [], views = [], tags = [], allow = [];
  let hud = hudFor(T0, T1), sound = { nature: [] }, extraSb = {};
  const PARK = (k) => [60 + k * 3, 60];
  const S = {
    c, A, t, END, T0, T1, props, cuts, views, tags, allow,
    actor(id, who, o = {}) { cast.push({ id, character: CAST[who] ?? who, at: PARK(cast.length), face: 0, expr: "kind", follow: 0.3, seed: 1.1 + cast.length * 1.3, ...o }); },
    prop(spec) { props.push(spec); return spec; },
    place(s, who, xz, yaw, y = 0) {
      const u = Math.max(0, r3(t(s) - PRE));
      if (u === 0) { const e = cast.find((x) => x.id === who); if (e) { e.at = xz.map(r3); if (yaw != null) e.face = r3(yaw); if (y) e.y = r3(y); } }
      A(u, who, "move", { to: xz.map(r3), y: r3(y), dur: 0.01, steps: 0, ease: "linear", sync: true });
      if (yaw != null) A(u, who, "turn", { to: r3(yaw), dur: 0.01, ease: "linear", sync: true });
      A(u, who, "show");
    },
    park(s, who) { const u = Math.max(0, r3(t(s) - PRE)); A(u, who, "hide"); A(u, who, "move", { to: [90, 90], y: 0, dur: 0.01, steps: 0, ease: "linear", sync: true }); },
    look: (s, who, to, dur = 0.18) => A(Math.max(0, t(s)), who, "look", { to, dur, blink: false }),
    expr: (s, who, e, set, dur = 0.15) => A(Math.max(0, t(s)), who, "expr", { expr: e, ...(set && { set }), dur }),
    arm: (s, who, side, pose, dur = 0.25, ease = "inOut") => c.arm(Math.max(0, t(s)), who, side, pose, dur, ease),
    grip: (s, who, side, shape, dur = 0.1) => A(Math.max(0, t(s)), who, "grip", { side, shape, dur }),
    rest(s, who) { for (const sd of ["R", "L"]) { S.arm(s - PRE, who, sd, "rest", 0.01); S.grip(s - PRE, who, sd, "relaxed", 0.01); } },
    walk: (s, who, to, dur, steps, y = 0) => A(t(s), who, "move", { to: to.map(r3), y: r3(y), dur: r3(dur), ...(steps != null && { steps }) }),
    // a hold that is already made at story time s (the prop placed by grips.placeFor where the hands are)
    holdNow(s, who, H, spec) {
      const u = Math.max(0, t(s));
      for (const sd of H.sides) { c.arm(u, who, sd, { prop: spec.id, grip: H.hands[sd].grip, ...(H.hands[sd].palm != null && { palm: H.hands[sd].palm }) }, 0); A(u, who, "grip", { side: sd, shape: H.hands[sd].shape ?? "hold", dur: 0 }); }
      A(u, who, "grab", { prop: spec.id, hand: H.hand, grip: H.hands[H.sides[0]].grip, dur: 0, pose: null });
    },
    sfx: (s, id, o = {}) => c.sfx(Math.max(0, t(s)), id, o),
    narrate: (s, line, dur, o) => narrate(c, F, t(s), line, dur, o),
    say: (s, who, line, dur, tone, o) => say(c, F, t(s), who, line, dur, tone, o),
    card: (s0, s1, text, size, pos) => card(c, F, t(s0), t(s1), text, size, pos),
    cut: (name, s, shot, kind) => cuts.push([name, Math.max(0, t(s)), shot, ...(kind ? [kind] : [])]),
    see: (s0, s1, what, why) => c.see(Math.max(0, t(s0)), t(s1), what, why),
    view: (s0, s1) => views.push([s0, s1]),
    tag: (o) => tags.push(o),
    hud: (h) => { hud = h; },
    sound: (o) => { sound = { ...sound, ...o }; },
    sb: (o) => { extraSb = { ...extraSb, ...o }; },
  };
  build(S);
  const beats = c.beats(cuts.sort((a, b) => a[1] - b[1]), END);
  const used = new Set(beats.flatMap((b) => b.do.map((x) => x.who)).filter(Boolean));
  write(import.meta.url, {
    id: `hs03-${key}-${F.key}`,
    title: "I could see everyone's happiness score",
    idea: "Happiness series 03 (YouTube film + four parts): Spud finds glasses that show everyone's happiness score; his is 41, his best friend Mash's 88, and Mash moves away on Sunday. He copies Mash to learn the secret, and every time he checks, his number drops.",
    format: "series: Spud looks for happiness (one life question per film, never answered out loud)",
    ...F.sb, fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, captionStyle: "kinetic",
    cleanStart: T0 === 0, motion: { feet: 2, overlap: true, timing: true, solve: true }, rig: { hand: 2, eyes: 2, hold: 2 },
    physics: true, animeTiming: true, loopIdle: false,
    set: { ...SETS[setKey], aperture: 0, focus: false, lighting: 2, hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true, satsuei: true },
    grade: gradeOf(T0, views),
    ...(views.length || tags.length ? { score: scoreOf(T0, views, tags) } : {}),
    ...(Object.keys(hud).length && { hud }),
    music: MUSIC(T0),
    sound: { signature: false, sfx: 0.65, ambience: 0.06, surface: "stone", room: "open", guard: true, ...sound },
    creative: { length: [END, END] },
    ...(T0 === 0 && { hook: { show: ["mover"], hint: 0, what: "through a pair of old glasses: a grey moving-day street where everyone has a glowing number; his own reflection says 41" } }),
    cast: cast.filter((x) => used.has(x.id) || x.keep), props, captions: c.captions, beats, visible: c.visible,
    ...(allow.length && { allowClip: allow }),
    story: { T0, T1 },
    ...extraSb,
    notes: `Generated by storyboards/series/happiness/03-happiness-score/block-a/make-block-a.mjs (story ${T0}-${T1} s).`,
  });
}

// ================================================================= O1 THE STREET THROUGH THE GLASSES (0.0-5.0), panel 01
seg("a1", "street", 0, 5.0, (S) => {
  const { c } = S;
  S.prop({ id: "van", kind: "boxvan", x: STREET.van.x, y: STREET.van.y, z: STREET.van.z, rot: -90, open: 1, len: 0, win: 0 });
  // the mover rests by the armchair he just carried out (DESIGN 10 fallback for the carry): chair on the pavement, he wipes his brow
  S.prop({ id: "chair", kind: "armchair", x: 3.3, y: 0, z: 1.8, rot: -130 });
  S.prop({ id: "mcap", kind: "flatcap", wear: "mover", fit: "mover", x: 0, y: 0, z: 0 });
  S.actor("mover", "mover", { expr: "deadpan" });
  // Spud's eyes = the camera: on the pavement facing the van's cab window, which shows his reflection (a card on the glass)
  const WIN = [r3(STREET.van.x - 1.6), 1.6, r3(STREET.van.z - 1.05 - 0.012)];
  const SH = aim([1.15, 0.74, -0.55], WIN, [1400, 470], 50);
  S.prop({ id: "refl", kind: "reflectcard", as: "van", reflectView: "front", w: 0.62, x: WIN[0], y: WIN[1], z: WIN[2], rot: 180 });
  S.place(0, "mover", [2.0, 2.2], -158); S.rest(0, "mover");
  S.expr(0, "mover", "deadpan", { brow: 0.3 }, 0.01); S.look(0, "mover", [-0.4, -0.2], 0.01);
  S.arm(0.6, "mover", "R", "hat", 0.4); S.grip(0.6, "mover", "R", "flat", 0.2);
  S.arm(1.0, "mover", "R", { o: [0.02, 0.98, 0.22] }, 0.45);   // the glove slides across the brow
  S.arm(1.7, "mover", "R", "hips", 0.45); S.arm(1.7, "mover", "L", "hips", 0.45);
  S.A(S.t(1.8), "mover", "squash", { amount: 0.06, dur: 0.5 });   // a breath out
  S.look(2.4, "mover", [0.5, 0.1], 0.3); S.expr(2.4, "mover", "kind", { curve: 0.3 }, 0.3);
  S.view(0, 5.0);
  S.tag({ who: "mover", keys: [[0, SCORES.mover]], k: 0.85 });
  // the reflection's tag: over the reflected leaf tip (91 % up the card), fixed in px
  const tip = project(SH, [WIN[0], r3(WIN[1] - 0.31 + 0.91 * 0.62 + 0.06), WIN[2]]);
  S.tag({ xy: tip, keys: [[0, 41]], size: "medium" });
  // "41" up top for the first 2.6 s (frame 0 is the title), then the line's caption; the own chip takes over at 2.6
  S.card(0, 2.6, "41", 220, 180);
  S.narrate(0.2, "You find glasses that show everyone's happiness score. Yours is forty-one.", 4.6, { caption: false });
  c.cap(S.t(2.65), S.t(5.0), "You find glasses that show everyone's happiness score. Yours is forty-one.", F.SUB);
  S.hud({ own: { keys: [[2.6, 41]] } });
  S.sound({ nature: [{ id: "birds", gain: 0.05 }, { id: "leaves", gain: 0.05 }] });
  S.cut("01 the street through the glasses", 0, SH, "hook");
  S.see(0, 5.0, ["mover.face", "van", "refl"], "through old round glasses: a grey moving-day street; a mover by an armchair, a white van, a potato's reflection in its window; glowing numbers over them");
  S.allow.push({ who: "mover", with: "mcap", from: 0, to: 5.0, reason: "the flat cap is worn" });
});

// ================================================================= O2 THE HALL: THE BOX, THE TUNE (5.0-11.0), panels 02 + 03
const KEEP = HALL.keepbox, KNEEL = [-0.78, 1.45];
const hallProps = (S) => {
  S.prop({ id: "door", ...HALL.frontdoor, open: 1 });
  S.prop({ id: "keep", kind: "keepbox", x: KEEP.x, y: 0, z: KEEP.z, rot: 0 });
  S.prop({ id: "case", kind: "scorecase", x: r3(KEEP.x + 0.06), y: 0.2, z: r3(KEEP.z + 0.02), rot: 90, open: 1 });
};
seg("a2", "hall", 5.0, 11.0, (S) => {
  hallProps(S);
  S.actor("spud", "spud"); S.actor("mash", "mash");
  // the glasses slid down his nose (SCORE_FITS "half"): he looks over them at the box
  S.prop({ id: "glw", kind: "scoreglasses", wear: "spud", x: 0, y: 0.535, z: 0.382, tip: 25, fold: 0 });
  S.allow.push({ who: "spud", with: "glw", from: 5.0, to: 11.0, reason: "the glasses are worn (SCORE_FITS half)" });
  S.place(5.0, "spud", KNEEL, 90); S.A(0, "spud", "crouch", { to: 0.3, dur: 0.01 }); S.rest(5.0, "spud");
  S.expr(5.0, "spud", "shocked", { open: 0.15, eye: 1.15, curve: 0 }, 0.01); S.look(5.0, "spud", [0.3, -0.45], 0.01);
  S.A(S.t(6.2), "spud", "blink", { dur: 0.3 });
  S.look(6.6, "spud", [0.1, -0.25], 0.4); S.expr(6.6, "spud", "focused", { brow: 0.3, curve: 0.1 }, 0.4);
  // 03: Mash passes behind him with a box, whistling THE TUNE; Spud's eyes follow him
  const W0 = [0.15, -0.2], W1 = [2.2, -1.95], WY = yawTo(W0, W1);
  const BOX = S.prop({ id: "mbox", kind: "parcel", ...grips.placeFor("parcel", ahead(W0, WY, 0.42, 0.3), WY) });
  const hb = grips.box(S.c, "mash", BOX);
  S.place(7.6, "mash", W0, WY); S.holdNow(7.6, "mash", hb, BOX);
  S.expr(7.6, "mash", "serene", { curve: 0.2, open: 0.12, eye: 0.15 }, 0.01); S.look(7.6, "mash", [0, 0.1], 0.01);
  S.walk(7.7, "mash", W1, 3.1, 6); hb.carry(S.t(7.7), ahead(W1, WY, 0.42, 0.3), 3.1, "linear");
  tune(S.c, S.t(7.9), { gain: 0.3 });
  S.look(7.9, "spud", [0.6, 0.2], 0.4); S.A(S.t(8.0), "spud", "turn", { to: 60, dur: 0.6 });
  S.expr(8.4, "spud", "sad", { curve: -0.1, brow: 0.35 }, 0.5);
  S.narrate(5.15, "If you've ever compared yourself to a friend, watch what it costs you.", 5.0);
  S.sound({ room: "hall", surface: "wood", nature: [{ id: "birds", gain: 0.03 }] });
  S.cut("02 the box", 5.0, { pos: [1.1, 1.0, 3.0], look: [-0.4, 0.5, 1.45], fov: 38 });
  S.cut("03 Mash passes", 7.6, { pos: [-0.2, 1.0, 4.1], look: [0.6, 0.95, 0.0], fov: 48 });
  S.see(5.0, 7.6, ["spud.face", "keep", "case"], "close: Spud kneels at a cardboard box marked DON'T KEEP, old round glasses slid down his nose, an empty glasses case in the box");
  S.see(7.6, 11.0, ["spud", "mash"], "the sunny hall on moving day: his best friend Mash walks past behind him with a box, whistling");
});

// ================================================================= O3 MASH = 88, THE TRAIN (11.0-17.2), panel 04 (glasses view)
seg("a3", "hall", 11.0, 17.2, (S) => {
  hallProps(S);
  S.actor("mash", "mash");
  const DOOR = [2.35, -2.3];
  const BOX = S.prop({ id: "mbox", kind: "parcel", ...grips.placeFor("parcel", ahead(DOOR, -30, 0.42, 0.3), -30) });
  const hb = grips.box(S.c, "mash", BOX);
  S.place(11.0, "mash", DOOR, -30); S.holdNow(11.0, "mash", hb, BOX);
  S.expr(11.0, "mash", "serene", { curve: 0.25, open: 0.12, eye: 0.15 }, 0.01); S.look(11.0, "mash", [-0.2, 0.15], 0.01);
  S.A(S.t(12.4), "mash", "lean", { to: 4, dur: 0.8 }); S.A(S.t(13.6), "mash", "lean", { to: -2, dur: 0.8 });
  tune(S.c, S.t(11.1), { gain: 0.22, dur: 2.0 });
  // he turns and carries the box out to the van
  const OUT = [2.5, -3.95];
  S.A(S.t(15.2), "mash", "turn", { to: -180, dur: 0.5 }); hb.carry(S.t(15.2), ahead(DOOR, -180, 0.42, 0.3), 0.5, "inOut", { rot: r3(BOX.rot - 150) });
  S.walk(15.75, "mash", OUT, 1.4, 3); hb.carry(S.t(15.75), ahead(OUT, -180, 0.42, 0.3), 1.4, "linear", { rot: r3(BOX.rot - 150) });
  S.prop({ id: "van", kind: "boxvan", x: HALL.van.x, y: HALL.van.y, z: HALL.van.z, rot: -90, open: 1, len: 0, win: 0 });
  S.view(11.0, 17.2);
  S.tag({ who: "mash", keys: [[11.0, 88]], k: 1.15 });
  S.narrate(11.3, "Your best friend is eighty-eight. And on Sunday, he's gone.", 3.9);
  S.card(15.75, 17.2, "88. HOW?", 150, 180);
  S.sound({ room: "hall", surface: "wood", nature: [{ id: "birds", gain: 0.03 }] });
  // Spud's eyes from where he kneels, lifted to the door
  S.cut("04 Mash is 88", 11.0, aim([0.1, 0.62, 1.45], [DOOR[0], 0.62, DOOR[1]], [1380, 780], 40));
  S.see(11.0, 17.2, ["mash.face"], "through the glasses: Mash in the open front door with a box, eyes closed, whistling; a white moving van outside; his number 88 glows");
});

// ================================================================= 05 THE NOTEBOOK (17.2-22.0): he studies him
seg("a4", "street", 17.2, 22.0, (S) => {
  S.prop({ id: "van", kind: "boxvan", x: STREET.van.x, y: STREET.van.y, z: STREET.van.z, rot: 90, open: 1, len: 0, win: 0 });
  S.actor("spud", "spud"); S.actor("mash", "mash");
  S.prop({ id: "glw", kind: "scoreglasses", wear: "spud", x: 0, y: 0.64, z: 0.349, tip: 6, fold: 0 });
  S.allow.push({ who: "spud", with: "glw", from: 17.2, to: 22.0, reason: "the glasses are worn (SCORE_FITS nose)" });
  // Spud sits on Mash's front step, the pad in his left hand; the camera from the left along the pavement (panel 05)
  const SP = [-0.25, -0.62], SY = 55;
  S.place(17.2, "spud", SP, SY, 0); S.A(0, "spud", "sit", { rot: SY, dur: 0.01, height: STREET.stepTop, hands: "keep" });
  const LAP = chest(SP, SY, { fwd: 0.36, side: 0.02, y: r3(STREET.stepTop + 0.1) });
  const PAD = S.prop({ id: "pad", kind: "spudpad", ...grips.placeFor("spudpad", LAP, SY), tip: -50, write: 0 });
  const hp = grips.phone(S.c, "spud", PAD, { side: "L", height: 0.2 });
  S.holdNow(17.2, "spud", hp, PAD); S.grip(17.2, "spud", "L", "hold", 0.01);
  const WR = chest(SP, SY, { fwd: 0.43, side: 0.1, y: r3(STREET.stepTop + 0.24) });
  S.arm(17.2, "spud", "R", { world: WR }, 0.01); S.grip(17.2, "spud", "R", "pinch", 0.01);
  for (let k = 0; k < 8; k++) S.arm(17.6 + k * 0.35, "spud", "R", { world: [r3(WR[0] + (k % 2) * 0.02), r3(WR[1] - (k % 3) * 0.012), r3(WR[2] - (k % 2) * 0.03)] }, 0.3);
  S.c.prop(S.t(17.2), "pad", { write: 0 }, 0, "linear");
  S.c.prop(S.t(17.6), "pad", { write: 0.55 }, 2.8, "linear");
  S.c.prop(S.t(20.8), "pad", { write: 1 }, 1.0, "linear");
  S.expr(17.2, "spud", "focused", { brow: 0.6, curve: -0.1 }, 0.01); S.look(17.2, "spud", [0.7, 0.05], 0.01);
  S.look(18.4, "spud", [0.25, -0.35], 0.3); S.look(19.6, "spud", [0.75, 0.05], 0.3);
  S.sfx(17.6, "scribble", { gain: 0.3, dur: 2.6, reason: "his pencil on the pad" }); S.sfx(20.8, "scribble", { gain: 0.35, dur: 0.9, reason: "the pencil underlines it twice" });
  // Mash in the background carries another box along the pavement to the van
  const M0 = [4.8, 0.25], M1 = [3.0, 0.95], MY = yawTo(M0, M1);
  const BOX = S.prop({ id: "mbox", kind: "parcel", ...grips.placeFor("parcel", ahead(M0, MY, 0.42, 0.3), MY) });
  const hb = grips.box(S.c, "mash", BOX);
  S.place(17.2, "mash", M0, MY); S.holdNow(17.2, "mash", hb, BOX);
  S.expr(17.2, "mash", "serene", { curve: 0.3, eye: 0.3 }, 0.01);
  S.walk(17.3, "mash", M1, 3.4, 7); hb.carry(S.t(17.3), ahead(M1, MY, 0.42, 0.3), 3.4, "linear");
  S.narrate(17.4, "Three days to learn how he does it.", 3.1);
  S.sound({ nature: [{ id: "birds", gain: 0.05 }, { id: "leaves", gain: 0.05 }] });
  S.cut("05 the notebook", 17.2, aim([-0.95, 0.85, 1.65], [SP[0], 0.84, SP[1]], [560, 600], 46));
  // the page insert, over his right shoulder (DESIGN 6: 1.2 s, readable only here)
  const PW = [LAP[0], r3(LAP[1] + 0.12), LAP[2]], OS = chest(SP, SY, { fwd: 0.12, side: 0.62, y: r3(STREET.stepTop + 0.72) });
  S.cut("05i the page", 20.8, { pos: OS, look: PW, fov: 32 });
  S.see(17.2, 20.8, ["spud.face", "pad", "mash"], "Spud on his friend's front step with round glasses and a notepad, frowning, writing; Mash carries a box to the van behind him");
  S.see(20.8, 22.0, ["pad"], "over his shoulder: the pad says MASH = 88. WHY? underlined twice");
});

// ================================================================= 06 THE BAKERY (22.0-26.6): he watches Mash buy a bun
const bakeryCast = (S) => { S.actor("baker", "baker"); S.prop({ id: "toque", kind: "toque", wear: "baker", x: 0, y: 0, z: 0 }); };
seg("a5", "bakery", 22.0, 26.6, (S) => {
  bakeryCast(S); S.actor("spud", "spud"); S.actor("mash", "mash");
  S.prop({ id: "glw", kind: "scoreglasses", wear: "spud", x: 0, y: 0.64, z: 0.349, tip: 6, fold: 0 });
  S.allow.push({ who: "spud", with: "glw", from: 22.0, to: 26.6, reason: "the glasses are worn" }, { who: "baker", with: "toque", from: 22.0, to: 26.6, reason: "the chef's hat is worn" });
  const B = BAKERY.spots;
  S.place(22.0, "baker", [B.baker.x, B.baker.z], 0, 0.18); S.rest(22.0, "baker");
  S.expr(22.0, "baker", "kind", { curve: 0.6 }, 0.01); S.look(22.0, "baker", [0, -0.1], 0.01);
  // Mash at the counter (his back to us), the bun handed over the counter; Spud peeks from behind the lamp, pad up
  S.place(22.0, "mash", [B.spud06.x, B.spud06.z], 180); S.rest(22.0, "mash"); S.look(22.0, "mash", [0, 0.1], 0.01);
  const BUN = S.prop({ id: "bun", kind: "cinnabun", ...grips.placeFor("cinnabun", [B.baker.x, r3(BAKERY.counterTop + 0.02), -1.05], 180), bite: 0 });
  S.c.prop(0, "bun", { bite: 0 }, 0, "linear");
  const hm = grips.mug(S.c, "mash", BUN, { side: "R" });
  { const e = hm.take(S.t(23.4), { reach: 0.35, settle: 0.15 }); hm.carry(e + 0.1, chest([B.spud06.x, B.spud06.z], 180), 0.45); }
  S.A(S.t(23.3), "baker", "lean", { to: 8, dur: 0.4 }); S.A(S.t(24.2), "baker", "lean", { to: 0, dur: 0.4 });
  S.expr(24.0, "mash", "happy", { curve: 0.7, eye: 0.4 }, 0.3);
  S.A(S.t(24.6), "mash", "squash", { amount: 0.06, dur: 0.3 });   // a little nod of thanks
  const SPY = [B.mash06.x, B.mash06.z];
  S.place(22.0, "spud", SPY, 150); S.rest(22.0, "spud");
  const PAD = S.prop({ id: "pad", kind: "spudpad", ...grips.placeFor("spudpad", [r3(SPY[0] - 0.12), 0.62, r3(SPY[1] - 0.25)], 150), tip: -20, write: 1 });
  const hp = grips.phone(S.c, "spud", PAD, { side: "L", height: 0.2 });
  S.holdNow(22.0, "spud", hp, PAD);
  S.expr(22.0, "spud", "focused", { brow: 0.7, curve: -0.15, eye: 0.8 }, 0.01); S.look(22.0, "spud", [0.35, 0.1], 0.01);
  S.A(S.t(22.8), "spud", "lean", { to: -6, dur: 0.5 });   // peeks round the lamp
  S.A(S.t(25.2), "spud", "lean", { to: 0, dur: 0.4 }); S.look(24.4, "spud", [0.1, -0.4], 0.25); S.sfx(24.5, "scribble", { gain: 0.25, dur: 0.6, reason: "a quick note on the pad" });
  S.narrate(22.1, "So you do what any good friend would do. You study him.", 4.4);
  S.sound({ nature: [{ id: "birds", gain: 0.04 }] });
  S.cut("06 the bakery", 22.0, { pos: [-3.1, 0.88, 4.4], look: [1.4, 0.95, -0.9], fov: 40 });
  S.see(22.0, 26.6, ["spud", "mash", "baker.face", "bun"], "a corner bakery: Mash buys a cinnamon bun from the baker; Spud spies on him from behind a lamp post with his notepad");
});

// ================================================================= 07-08 THE RIVER (26.6-33.8): ten steps behind; same hoodie, same bun
seg("a6", "river", 26.6, 33.8, (S) => {
  const SPD = 0.55, M = RIVER.stand.mash07;
  S.actor("mash", "mash"); S.actor("spud", "spud"); S.actor("copy", "spudcopy");
  S.prop({ id: "glw", kind: "scoreglasses", wear: "spud", x: 0, y: 0.64, z: 0.349, tip: 6, fold: 0 });
  S.prop({ id: "glc", kind: "scoreglasses", wear: "copy", x: 0, y: 0.64, z: 0.349, tip: 6, fold: 0 });
  S.allow.push({ who: "spud", with: "glw", from: 26.6, to: 33.8, reason: "the glasses are worn" }, { who: "copy", with: "glc", from: 26.6, to: 33.8, reason: "the glasses are worn" });
  // a bun in the right hand at the chest, WORN on the walker (a body-frame point), the hand on its side in the body frame:
  // a carried prop tweened along a walk flipped the hand every step (draft 1 farm gate)
  const BUNB = [-0.07, 0.4, 0.42];
  const bunFor = (id, who) => {
    S.prop({ id, kind: "cinnabun", wear: who, x: BUNB[0], y: BUNB[1], z: BUNB[2], rot: 0, bite: 0.35 });
    S.c.prop(0, id, { bite: 0.35 }, 0, "linear");
    S.arm(S.T0, who, "R", { x: [r3(BUNB[0] - 0.12), 0.36, r3(BUNB[2] - 0.02)] }, 0.01); S.grip(S.T0, who, "R", "hold", 0.01);
    S.arm(S.T0, who, "L", "rest", 0.01);
    S.allow.push({ who, with: id, from: S.T0, to: S.T1, checks: ["clipping", "hand-in-prop"], reason: "the bun rides in his hand at the chest (worn on the body): the fingers close 2 cm round its paper cup, a hold" });
  };
  const walkWith = (s0, s1, who, x, z0) => {
    const d = SPD * (s1 - s0), z1 = r3(z0 + d);
    S.place(s0, who, [x, z0], 0); S.walk(s0 + 0.05, who, [x, z1], r3(s1 - s0 - 0.1), Math.round(d / 0.3));
  };
  bunFor("bunm", "mash"); bunFor("bunc", "copy");
  // 07: Spud in his own sweater, 7.5 m behind
  walkWith(26.6, 29.8, "mash", M.x, -1.4);
  S.expr(26.6, "mash", "serene", { curve: 0.35, eye: 0.25 }, 0.01); S.look(26.6, "mash", [0, -0.1], 0.01);
  const S7 = RIVER.stand.spud07;
  walkWith(26.6, 29.8, "spud", S7.x, S7.z); S.rest(26.6, "spud");
  S.expr(26.6, "spud", "focused", { brow: 0.5 }, 0.01); S.look(26.6, "spud", [0, 0.05], 0.01);
  S.park(29.8, "spud");
  // 08: the copy (hoodie, headphones, bun), 3.5 m behind, in step
  const S8 = RIVER.stand.spud08;
  walkWith(29.8, 33.8, "mash", M.x, -1.4);
  walkWith(29.8, 33.8, "copy", S8.x, S8.z);
  S.expr(29.8, "copy", "eager", { curve: 0.3, brow: 0.2 }, 0.01); S.look(29.8, "copy", [0.05, 0.05], 0.01);
  S.A(S.t(31.6), "copy", "blink", { dur: 0.3 });
  S.narrate(30.0, "Same hoodie. Same bun. Same river.", 3.0);
  S.sound({ nature: [{ id: "stream", gain: 0.05 }, { id: "birds", gain: 0.04 }, { id: "leaves", gain: 0.03 }] });
  S.cut("07 ten steps behind", 26.6, RIVER.cams.p07);
  S.cut("08 same hoodie", 29.8, RIVER.cams.p08);
  S.see(26.6, 29.8, ["mash.face", "spud"], "an autumn river path, an old stone bridge: Mash walks toward us eating a cinnamon bun; far behind him Spud follows");
  S.see(29.8, 33.8, ["mash.face", "copy.face"], "the same walk: now Spud wears the same grey hoodie and headphones and eats the same bun, a few steps behind him");
});

// ================================================================= 09 WEDGE (33.8-37.4): "It's the hoodie."
seg("a7", "bakery", 33.8, 37.4, (S) => {
  S.actor("wedge", "wedge"); S.actor("copy", "spudcopy");
  S.prop({ id: "glc", kind: "scoreglasses", wear: "copy", x: 0, y: 0.64, z: 0.349, tip: 6, fold: 0 });
  S.allow.push({ who: "copy", with: "glc", from: 33.8, to: 37.4, reason: "the glasses are worn" });
  const B = BAKERY.spots, WP = [B.mash09.x, B.mash09.z], CP = [B.spud09.x, B.spud09.z];
  S.place(33.8, "wedge", WP, 35); S.rest(33.8, "wedge"); S.place(33.8, "copy", CP, -30); S.rest(33.8, "copy");
  const BUN = S.prop({ id: "bun", kind: "cinnabun", ...grips.placeFor("cinnabun", chest(CP, -30), -30), bite: 0.6 });
  S.c.prop(0, "bun", { bite: 0.6 }, 0, "linear"); S.holdNow(33.8, "copy", grips.mug(S.c, "copy", BUN, { side: "R" }), BUN);
  S.expr(33.8, "wedge", "cocky", { curve: 0.7 }, 0.01); S.look(33.8, "wedge", [0.5, 0], 0.01);
  S.expr(33.8, "copy", "eager", { brow: 0.3, curve: 0.1 }, 0.01); S.look(33.8, "copy", [-0.5, 0.05], 0.01);
  S.say(34.0, "wedge", "Trust me. It's the hoodie. Give it a day.", 2.4, "cocky");
  S.arm(35.0, "wedge", "R", "fist", 0.3, "out"); S.grip(35.0, "wedge", "R", "thumb", 0.15);
  S.A(S.t(35.1), "wedge", "lean", { to: -5, dur: 0.3 });
  S.expr(36.5, "copy", "happy", { curve: 0.6, eye: 0.7 }, 0.3); S.A(S.t(36.6), "copy", "squash", { amount: 0.07, dur: 0.25 });   // he nods: hope
  S.sound({ nature: [{ id: "birds", gain: 0.04 }] });
  S.cut("09 Wedge", 33.8, { pos: [-5.9, 0.86, 4.6], look: [-3.85, 0.82, 1.3], fov: 38 });
  S.see(33.8, 37.4, ["wedge.face", "copy.face"], "by the ivy wall: Wedge in a red jacket gives the hoodie-wearing Spud a thumbs up; Spud nods, hopeful");
});

// ================================================================= 10 THE BRIDGE THROUGH THE GLASSES (37.4-41.0): still 41
seg("a8", "bridge", 37.4, 41.0, (S) => {
  S.actor("mash", "mash");
  const Z = RIVER.bridge.z, eye = 0.72;
  const SH = aim([25, r3(RIVER.deckY(25) + eye), r3(Z - 0.35)], [18.6, r3(RIVER.deckY(18.6) + 0.45), Z], [1400, 600], 40);
  S.place(37.4, "mash", [19.5, Z], -90, r3(RIVER.deckY(19.5))); S.rest(37.4, "mash");
  // he walks away up over the arch (the deck rises to 4.2 at x 16.5): a few steps at a time on the slope
  const xs = [19.5, 18.6, 17.7, 16.9];
  xs.slice(1).forEach((x, i) => S.walk(37.5 + i * 1.15, "mash", [x, Z], 1.1, 2, r3(RIVER.deckY(x))));
  // his bun in Spud's hand, at the bottom left of the lens (no hand: the arm is below the frame)
  const BP = camPoint(SH, [-0.2, -0.13, 0.5]);
  S.prop({ id: "bun", kind: "cinnabun", x: BP[0], y: BP[1], z: BP[2], rot: 90, tip: 22, bite: 0.5 });
  S.view(37.4, 41.0);
  S.tag({ who: "mash", keys: [[37.4, 88]], k: 1.15 });
  S.narrate(38.2, "Still forty-one.", 1.5);
  S.sound({ nature: [{ id: "stream", gain: 0.05 }] });
  S.cut("10 the bridge through the glasses", 37.4, SH);
  S.see(37.4, 41.0, ["mash", "bun"], "through the glasses: a grey stone bridge, his half-eaten bun in front of the lens, Mash walking away with his 88");
});

// ================================================================= 11 THE CHECKS (41.0-46.9): TWIST 1, every check it drops
seg("a9", "bakery", 41.0, 46.9, (S) => {
  S.actor("copy", "spudcopy");
  S.prop({ id: "glc", kind: "scoreglasses", wear: "copy", x: 0, y: 0.64, z: 0.349, tip: 6, fold: 0 });
  S.allow.push({ who: "copy", with: "glc", from: 41.0, to: 46.9, reason: "the glasses are worn" });
  const P = [1.6, 1.2];
  S.place(41.0, "copy", P, 160); S.rest(41.0, "copy");
  const BUN = S.prop({ id: "bun", kind: "cinnabun", ...grips.placeFor("cinnabun", chest(P, 160), 160), bite: 0.8 });
  S.c.prop(0, "bun", { bite: 0.8 }, 0, "linear"); S.holdNow(41.0, "copy", grips.mug(S.c, "copy", BUN, { side: "R" }), BUN);
  S.expr(41.0, "copy", "eager", { brow: 0.3 }, 0.01); S.look(41.0, "copy", [0, -0.2], 0.01);
  // (a) eyes up; (b) the glasses view up: the tag ticks, -1; twice
  S.look(41.15, "copy", [0, 0.85], 0.2);
  S.expr(42.6, "copy", "sad", { curve: -0.25, brow: 0.5 }, 0.2); S.look(42.6, "copy", [0, -0.3], 0.25);
  S.look(43.25, "copy", [0, 0.85], 0.2); S.expr(43.25, "copy", "worried", { brow: 0.5 }, 0.1);
  S.expr(44.5, "copy", "sad", { curve: -0.4, brow: 0.7, eye: 0.85 }, 0.3); S.look(44.5, "copy", [0, -0.45], 0.35);
  S.A(S.t(44.7), "copy", "droop", { to: 0.5, dur: 0.6 }); S.A(S.t(44.7), "copy", "squash", { amount: 0.08, dur: 0.6 });
  const HIGH = { pos: [r3(P[0] - 0.25), 2.25, r3(P[1] - 1.55)], look: [P[0], 0.45, P[1]], fov: 42 };
  const UP = { pos: [P[0], 0.7, P[1]], look: [r3(P[0] - 0.4), 2.6, r3(P[1] - 2.3)], fov: 50 };
  S.view(41.7, 42.6); S.view(43.6, 44.5);
  S.tag({ xy: [960, 760], keys: [[41.0, 41], [42.0, 40], [44.0, 39]], minus: true, minusCard: [42.0], minusTo: [960, 330], size: "close" });
  S.narrate(42.7, "And every time you checked, it dropped.", 2.7);
  S.sound({ nature: [{ id: "birds", gain: 0.03 }] });
  S.cut("11a eyes up", 41.0, HIGH);
  S.cut("11b the check", 41.7, UP);
  S.cut("11c again", 42.6, HIGH);
  S.cut("11d the check", 43.6, UP);
  S.cut("11e it dropped", 44.5, { ...HIGH, to: { pos: [r3(P[0] - 0.2), 1.9, r3(P[1] - 1.2)], look: [P[0], 0.45, P[1]], fov: 42 }, dur: 2.4, ease: "inOut" });
  S.see(41.0, 41.7, ["copy.face"], "from above: Spud in the copied hoodie looks up at his own number");
  S.see(42.6, 43.6, ["copy.face"], "he looks down, hurt, then up again");
  S.see(44.5, 46.9, ["copy.face"], "he sags, the bun lowered");
});

// ================================================================= 12 RAIN UNDER THE AWNING (46.9-50.0): 39, a quiet hold
seg("a10", "bakeryRain", 46.9, 50.0, (S) => {
  S.actor("copy", "spudcopy");
  S.prop({ id: "glc", kind: "scoreglasses", wear: "copy", x: 0, y: 0.64, z: 0.349, tip: 6, fold: 0 });
  S.allow.push({ who: "copy", with: "glc", from: 46.9, to: 50.0, reason: "the glasses are worn" });
  const B = BAKERY.spots.spud12, P = [B.x, B.z];
  S.place(46.9, "copy", P, 10); S.A(0, "copy", "sit", { rot: 10, dur: 0.01, height: 0, hands: "lap" });
  const BUN = S.prop({ id: "bun", kind: "cinnabun", ...grips.placeFor("cinnabun", chest(P, 10, { fwd: 0.4, y: 0.3 }), 10), bite: 0.8 });
  S.c.prop(0, "bun", { bite: 0.8 }, 0, "linear"); S.holdNow(46.9, "copy", grips.mug(S.c, "copy", BUN, { side: "R" }), BUN);
  S.expr(46.9, "copy", "sad", { curve: -0.3, brow: 0.5, eye: 0.8 }, 0.01); S.look(46.9, "copy", [0.4, -0.15], 0.01);
  S.A(S.t(47.9), "copy", "blink", { dur: 0.45 }); S.look(48.6, "copy", [0.6, 0.0], 0.8);
  S.prop({ id: "rain", kind: "rainfall", box: [[-6, 0, 0.85], [6, 6, 9]], n: 900, on: 1, x: 0, y: 0, z: 0 });
  S.sfx(46.9, "ai/rain-car-roof", { gain: 0.1, dur: 3.1, reason: "rain drumming on the canvas awning" });
  S.cut("12 rain", 46.9, { pos: [-1.0, 0.68, 3.3], look: [-0.95, 0.75, -0.6], fov: 42, to: { pos: [-1.0, 0.66, 2.9], look: [-0.95, 0.72, -0.6], fov: 42 }, dur: 3.1, ease: "linear" });
  S.see(46.9, 50.0, ["copy.face"], "rain: Spud sits alone under the bakery awning in the copied hoodie, the bun in his lap");
});

for (const s of SEGS) make(s);
