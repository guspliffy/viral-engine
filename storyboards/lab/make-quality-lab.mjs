// QUALITY LAB 01 (research prompt v2, part E): one fixed 3-second scene, rendered in labelled variants side by side.
// Pure engine test: no Fable review, not for posting. Each variant changes one thing against "base".
//
//   node storyboards/lab/make-quality-lab.mjs        -> storyboards/lab/ql-*.json (one per variant)
//
// The scene (3.0 s, the warm cream living room the recent clips use): Phoenix shows off with a flame-wing flare,
// the flare singes Reaper beside him (the action), Reaper's slow glare and Phoenix's sheepish grin (the reaction).
// No hand contact on purpose, so the variants only differ in what is being tested.
import { clip, write } from "../lib/clip.mjs";
import { aim } from "../lib/camera.mjs";
import * as act from "../lib/acting.mjs";
import fs from "node:fs";

const END = 3.0;
const PHX = [-0.44, 0.22], PHX_YAW = 24, REA = [0.48, 0.12], REA_YAW = -26;
const PHX_AT_REA = [0.75, 0.0], PHX_AT_CAM = [0, 0], REA_AT_PHX = [-0.8, 0.0], REA_AT_CAM = [0, 0.02];
const LIVING = { type: "plain", color: "#efe2c8", floor: "#c9a27a", light: "golden", aperture: 0, para: 0, bloom: "emissive",
  plate: { src: "assets/plates/livingroom-golden.png", z: -2.3, center: [0.3, 1.7], height: 6.4 } };
const SHOT = aim([0.0, 0.78, 0.2], { az: 0, el: 8, h: 3.0, fov: 30, push: 0.05, dur: END });

// o: what a variant changes. force: comic force (squash, anticipation, overshoot, impact frame, shake, dust, stars);
// faces: stronger expression extremes and longer holds (same face shapes)
function scene(o = {}) {
  const c = clip(), { A } = c, F = !!o.force, X = !!o.faces;
  const T_HIT = 0.42;
  // ------------------------------------------------ the action: Phoenix's flare (frame 0 is already the crouch)
  A(0, "phx", "noblink"); A(0, "rea", "noblink");
  A(0, "phx", "look", { to: PHX_AT_CAM, dur: 0, blink: false });
  A(0, "rea", "look", { to: REA_AT_PHX, dur: 0, blink: false });
  A(0, "rea", "expr", { expr: "deadpan", dur: 0 });
  A(0, "rea", "still", { dur: T_HIT, idle: 0.1 });
  A(0, "phx", "expr", { expr: "cocky", dur: 0.1 });
  A(0, "phx", "squash", { amount: F ? 0.2 : 0.14, dur: 0.25 });                       // the wind-up
  A(0.2, "phx", "arm", { side: "both", pose: "up", dur: F ? 0.16 : 0.25, ease: F ? "anticSettle" : "settle" });
  A(0.2, "phx", "hop", { height: F ? 0.16 : 0.06, dur: F ? 0.32 : 0.25 });
  A(0.12, "phx", "span", { to: 1, dur: 0.12 });
  A(0.24, "phx", "wings", { to: 1, dur: F ? 0.12 : 0.2, ease: F ? "anticSettle" : "out" });   // the flare: the fast move
  A(0.8, "phx", "arm", { side: "both", pose: "hips", dur: 0.3, ease: "settle" });
  A(0.85, "phx", "squash", { amount: F ? 0.08 : 0.05, dur: 0.2 });
  // the flame reaches Reaper: a puff of fire at his head
  c.at(T_HIT - 0.02, { fx: "poof", pos: [REA[0] - 0.06, 0.72, REA[1] + 0.05], dur: 0.6, color: "#ffb36b", spark: "#ffd23f", puffs: F ? 12 : 7, sparks: F ? 22 : 12 });   // at the sprout, above the face
  c.sfx(T_HIT - 0.02, "poof", { gain: 0.8 });
  if (F) {
    c.at(T_HIT, { fx: "impact", dur: 0.067 });                                          // two frames of black on white
    c.at(T_HIT, { fx: "shake", dur: 0.25, amp: 0.035 });
    c.at(T_HIT + 0.1, { fx: "sparkle", who: "rea", dur: 0.9, count: 5, color: "#fff2a8" });   // stars round the singed head
    c.at(0.95, { fx: "poof", pos: [PHX[0], 0.02, PHX[1]], dur: 0.45, color: "#e9d8c0", puffs: 8, sparks: 0 });   // landing dust
    c.sfx(T_HIT, "thud-soft", { gain: 0.6 });
  }
  // ------------------------------------------------ Reaper takes the hit
  c.macro(T_HIT, "rea", "hit", { hat: false, look: [0, 0.35], recoil: F ? -11 : -5, expr: "shocked", hold: X ? 0.55 : 0.35,
    set: X ? { eye: 1.42, open: 0.72, curve: -0.75 } : { eye: 1.25, open: 0.5, curve: -0.5 } });
  if (F) A(T_HIT + 0.02, "rea", "squash", { amount: 0.26, dur: 0.3 });
  A(T_HIT + 0.08, "rea", "droop", { to: 1, dur: 0.35 });                                 // the singed sprout
  // ------------------------------------------------ the reaction: Reaper's slow glare, Phoenix's sheepish grin
  const tG = X ? 1.25 : 1.05;                                                          // longer hold on the shocked face
  A(tG, "rea", "look", { to: REA_AT_PHX, dur: X ? 0.45 : 0.35, blink: false });
  act.mood(c, tG + 0.25, "rea", "annoyed", { hold: END - tG - 0.35, ...(X && { lid: 0.46 }) });
  A(1.0, "phx", "look", { to: PHX_AT_REA, dur: 0.2, blink: false });
  const tS = X ? 1.55 : 1.35;
  A(tS, "phx", "expr", { expr: "kind", set: X ? { tilt: 0.45, curve: 0.42, open: 0.16, eye: 1.08, smirk: 0.4 } : { tilt: 0.34, curve: 0.38, open: 0.12, eye: 1.02, smirk: 0.32 }, dur: 0.3 });
  A(tS, "phx", "face", { brow: X ? 0.4 : 0.25, dur: 0.3 });
  A(tS + 0.1, "phx", "wings", { to: 0.25, dur: 0.5, ease: "inOut" });
  A(tS + 0.1, "phx", "arm", { side: "both", pose: "rest", dur: 0.45, ease: "inOut" });
  A(tS + 0.15, "phx", "still", { dur: END - tS - 0.2, idle: 0.08 });
  if (!X) A(2.45, "phx", "look", { to: [-0.35, -0.25], dur: 0.2, blink: false });   // he looks away (the stronger face holds on Reaper)
  if (o.word) act.emote(c, tG + 0.35, "rea", "...", { dur: 1.2 });
  // ------------------------------------------------ hook caption + the gibberish line in the first half second
  if (o.say) c.say(0.0, "phx", "watch this!", 0.45, "excited");
  const cap = o.caption ?? { text: "When your friend says “watch this”", pos: 250 };
  if (cap) c.cap(0, 1.7, cap.text, cap.pos, false, cap.o || {});
  if (o.slam) c.textPop(o.slam.at, o.slam.who, o.slam.text, o.slam.o);
  return c;
}

function variant(id, title, o = {}) {
  const c = scene(o);
  const beats = c.beats([["the flare", 0, SHOT, "hook"], ["singed", 0.4, null, "payoff"], ["the glare", 1.05, null, "reaction"]], END);
  write(import.meta.url, {
    id: `ql-${id}`, title: `Quality lab: ${title}`,
    idea: "Quality lab 01: Phoenix's flame-wing flare singes Reaper, Reaper glares, Phoenix grins sheepishly (one variable per variant)",
    fps: 30, look: "anime-pro", profile: "short", loop: false, captionStyle: o.captionStyle ?? "kinetic",
    creative: { length: [2, 4], loop: false },
    set: { ...LIVING, ...(o.set || {}), plate: { ...LIVING.plate, ...(o.plate || {}) }, ...(o.lab && { lab: o.lab }) },
    music: o.music ?? { file: "ai/hero-bed/hero-bed-01.ogg", gain: 0.45 },
    sound: { sfx: 0.7, ambience: 0.3, surface: "carpet", signature: false, speech: false, ...(o.sound || {}) },
    ...(o.motionBlur !== undefined && { motionBlur: o.motionBlur }),
    hook: { show: ["phx", "rea"], hint: 0.2, what: "Phoenix winds up a flame-wing flare right next to deadpan Reaper" },
    cast: [
      { id: "phx", character: o.phx ?? "duo/phoenix", at: PHX, face: PHX_YAW, expr: "cocky", span: 0, follow: 0.3, seed: 1.7 },
      { id: "rea", character: o.rea ?? "lookdev/reaper-crisp", at: REA, face: REA_YAW, expr: "deadpan", follow: 0.25, seed: 4.1 },
    ],
    props: [], captions: c.captions, beats,
    notes: "Generated by storyboards/lab/make-quality-lab.mjs (quality lab 01, engine test, not for posting).",
  });
}

const CAP = "When your friend says “watch this”";
// base: today's defaults (look C crisp, golden living room, kinetic hook caption, music bed from 0:00)
variant("base", "today");
// (a) subject pop
variant("a-cool", "cool backdrop", { plate: { src: "assets/plates/lab/livingroom-cool.png" } });
variant("a-quiet", "quieter backdrop (darker, less saturated)", { plate: { src: "assets/plates/lab/livingroom-quiet.png" } });
variant("a-dof", "depth of field", { set: { aperture: 0.045 } });
// (b) character finish (engine/page/looks.js set.lab, lab branch only)
variant("b-rim", "rim light", { lab: { rim: 4 } });
variant("b-ground", "contact shadow + AO", { lab: { ground: 2.4, occ: 2.6 } });
variant("b-sat", "character saturation", { lab: { charSat: 1.22 } });
variant("b-line", "heavier outline", { lab: { line: 2.4 } });
variant("b-soft", "softer, no ink (question only)", { lab: { line: 0, soft: true } });
// (c) motion style: base is today's blur; no blur and twos are drawn from the same no-blur render
variant("c-smear", "smear on the fastest frames only", { motionBlur: { shutter: 1.0, min: 40, gap: 4, max: 15 } });
// (d) comic force (+ a 3-frame hit-stop added in the cut)
variant("d-force", "comic force", { force: true });
// (e) faces at feed size
variant("e-faces", "stronger faces, longer holds", { faces: true });
// (f) caption
variant("f-classic", "classic caption", { captionStyle: "classic" });
variant("f-big", "bigger caption", { caption: { text: CAP, pos: 250, o: { size: 96 } } });
variant("f-box", "soft box caption", { captionStyle: "classic", caption: { text: CAP, pos: 250, o: { style: "soft" } } });
variant("f-third", "top-third caption", { caption: { text: CAP, pos: 470 } });
variant("f-slam", "one slam word", { caption: false, slam: { at: 0.05, who: "phx", text: "WATCH THIS", o: { dur: 1.3, size: 118, dx: 0.75, dy: -1.0, angle: -6, burst: "#ffffff" } } });
// (g) sound: picture of base, sound only (render --audio-only)
variant("g-gib", "gibberish line in the first 0.5 s", { say: true });
variant("g-duck", "music ducks under the effects", { music: { file: "ai/hero-bed/hero-bed-01.ogg", gain: 0.45, duck: { amount: 0.55 } } });
variant("g-dip", "silence before the payoff", { music: { file: "ai/hero-bed/hero-bed-01.ogg", gain: 0.45, dips: [[0.12, 0.4]] } });

// skin test 01 (gap list points 2 and 3, Jonny's call): the cast's skin turned from lemon (~38° in the frame) toward the
// reference's golden orange (~30°), half way and all the way, and slightly bigger eyes with a heavier upper lid line
variant("s-gold-half", "skin half way to golden", { lab: { skinGold: 0.5 } });
variant("s-gold", "golden skin", { lab: { skinGold: 1 } });
// the eye test's characters are copies of today's two with face.size (eye radius) and a heavier lid line
const EYES = { size: 1.12, lash: 1.6 };
for (const [from, to] of [["duo/phoenix", "lab/phoenix-eyes"], ["lookdev/reaper-crisp", "lab/reaper-eyes"]]) {
  const dir = new URL("../../characters/", import.meta.url), ch = JSON.parse(fs.readFileSync(new URL(`${from}.json`, dir), "utf8"));
  ch.id = to; ch.name += " (skin test 01: bigger eyes, heavier lid line)";
  // browShape.clear (as the crisp Wizard has): the brows lift clear of the bigger eye instead of touching its lid line
  ch.face = { ...ch.face, size: EYES.size, eye: { ...ch.face.eye, lash: +((ch.face.eye?.lash ?? 1) * EYES.lash).toFixed(2) }, browShape: { ...ch.face.browShape, clear: 0.008 } };
  fs.mkdirSync(new URL("lab/", dir), { recursive: true });
  fs.writeFileSync(new URL(`${to}.json`, dir), JSON.stringify(ch, null, 1) + "\n");
}
variant("s-eyes", "bigger eyes, heavier lid line", { phx: "lab/phoenix-eyes", rea: "lab/reaper-eyes" });
variant("s-eyes-gold", "bigger eyes + golden skin", { phx: "lab/phoenix-eyes", rea: "lab/reaper-eyes", lab: { skinGold: 1 } });
