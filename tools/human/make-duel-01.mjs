// Firebender duel 01 (Jonny, 7 Nov 2026 21:19): "an epic anime scene starting with a conflict and close up, ending in an
// epic fight between two firebenders in different sceneries with lots of action ... more urban area, real physics, no
// glitches, lots of epic close ups and fight scenes ... each character should have a unique design and clothing ... around
// 20-30 sec"; 21:20 "the fight should end open in an epic clash of flames"; 21:24 "little conversations are allowed too".
// Research: /mnt/project-files/research/firebender-duel-2026-11-07/ (prompt, notes, report with the build checklist).
//
// Two original fighters on the CC0 VRoid body, each in his own clothes (characters/human/teo.json, ryn.json, garments in
// engine/page/rigs/vrm-garments.js): A = Teo (dark hair, white top, open teal vest, rolled sleeves, wrist wraps, teal
// headband with tails: round, open, big fire) and B = Ryn (silver hair, black hoodie, steel shoulder guard, blue gloves,
// blue sash with tails: closed, precise, thin fast jets). Teo is always screen left, Ryn screen right.
//
// The fight climbs through three painted city places, one storyboard each (an env set per storyboard; the acts are
// rendered alone and joined, tools/human/join-duel.mjs):
//   street  (golden-city-crossing, golden hour): the standoff (fist ignites, eyes, two lines), jabs, a redirect that knocks
//           over a wheelie bin, a crescent kick on a guard, and a blast that bursts on Ryn's guard and fills the frame;
//   alley   (dusk-back-alley): Ryn skids out of the fire, twin blades, Teo throws them into the wall (scorch, a burst
//           steam pipe), both fire at once and the streams pop in the middle, Teo's spin kick and Ryn jet-jumps out;
//   roof    (sunset-rooftop): both land, both power up, both fire everything: the streams meet in the middle and pile
//           into a ball of fire that neither can push through. It ends open on the clash (Jonny 21:20), nobody wins.
// Every exchange is at range (Jonny 19:22 on fight v1: no fist fight, nobody lies down).
//   node tools/human/make-duel-01.mjs <street|alley|roof>      -> storyboards/human/duel/duel-01-<act>.json
// Fire sources are measured on the drawn bodies: DIAG=A / DIAG=B layout passes, tools/human/firebend-src.mjs <log>
// storyboards/human/duel/duel-01-<act>.src.<A|B>.json, then this again (tools/human/duel-measure.sh does all of it).
import fs from "node:fs";
import * as THREE from "three";
import { Performance, prepClip, worldPose, palmWorld } from "../../engine/page/rigs/human-perform.js";
import { frameCoverage } from "../../engine/shared/env-coverage.js";

const LEG = 0.845, R = (v, n = 3) => +(+v).toFixed(n), D2R = Math.PI / 180, FPS = 30;
const clips = {};
const load = (n) => (clips[n] ??= prepClip(JSON.parse(fs.readFileSync(`assets/mocap/${n}.json`, "utf8"))));
const OUT = "storyboards/human/duel", ACT = process.argv[2] || "street", ID = `duel-01-${ACT}`;

const GRIT = { angry: 1, ih: 0.55 }, ANGRY = { angry: 0.85 }, SHOUT = { angry: 1, aa: 0.75 }, GRIN = { happy: 0.75, angry: 0.25 }, COLD = { angry: 0.45 },
  STRAIN = { angry: 1, aa: 0.6 }, SMIRK = { angry: 0.4, happy: 0.35 }, FOCUS = { angry: 0.7 };
// fire looks per fighter (research: Teo round, billowing bursts; Ryn narrow, fast jets with sharp tongues)
const TEO = { spread: 0.2, size: 0.17, grow: 1.9, speed: 13, rate: 260 }, RYN = { spread: 0.07, size: 0.1, grow: 1.25, speed: 17, rate: 300 };
const look = (who) => (who === "A" ? TEO : RYN);

// the three places: the painting, where the fight stands (centre x, z), and the camera's safe box (node qa/env.mjs --range)
const PLACES = {
  street: { env: "golden-city-crossing", centre: [0, -1.5], cam: { x: [-1.8, 1.8], y: [0.9, 5.5], z: [0.0, 10.9], yaw: 13, pitch: [-5.27, 9.4], fov: 54 }, surface: "road", life: true },
  alley: { env: "dusk-back-alley", centre: [-0.2, -2.0], cam: { x: [-2.6, 2.6], y: [0.8, 5.5], z: [1.0, 7.6], yaw: 13, pitch: [-9.27, 9.4], fov: 54 }, surface: "road", life: true },
  roof: { env: "sunset-rooftop", centre: [0, -5.0], cam: { x: [-2.9, 2.9], y: [0.75, 5.5], z: [1.0, 7.6], yaw: 13, pitch: [-10.18, 9.4], fov: 54 }, surface: "concrete", life: true },
};

// where the two stand in a shot: A left, B right, on a line `line` degrees off the frame's width (positive: A nearer
// the camera, negative: B nearer), `half` metres from the middle each (fighters 4 m apart: ranged, never in reach)
const spotOf = (sh, who) => { const d = sh.half ?? 2.0, a = (sh.line ?? 30) * D2R, sx = who === "A" ? -1 : 1;
  return [sx * d * Math.cos(a), -sx * d * Math.sin(a)]; };

// ---------------------------------------------------------------------------------------------------- the shots
// Per fighter: the take, its rate, the moment it is turned to face the other (ref) by "strike" (the limb's line),
// "body" (the hips) or "travel"; slide: { at, dur, d } (story seconds into the shot, metres straight away from the other).
// fire: as fight-02 (kinds hold / jet / arc / burst; into: "palm:R" | "ball" | "mid"; exit: a redirect; at "opp": ends
// on the other's guard); cam: { az, el, fov } wide, { close: who } head and shoulders, { on: who }, frame: ["A.palmR",
// "B.head", "B.footR", "mid"] the points to hold (an extreme close-up). say: [{ who, line, at, tone }]. fx: extra
// effects at shot seconds. len: the shot's length (else the lead's take).
const SHOTS_BY = {
  street: [
    // 1. frame 0: Teo's fist in close-up in front of his grin: the knuckles crack and the fist catches fire
    { name: "fist", line: -50, lead: "A", len: 0.62,
      A: { clip: "c76_04", from: 1.05, rate: 0.6, ref: 1.3, aim: "body" },
      B: { clip: "c76_04", from: 2.0, ref: 2.1, aim: "body" },
      face: { A: GRIN, B: COLD },
      fire: [{ who: "A", limb: "R", at: 0, to: 0.62, kind: "hold", speed: 1, size: 0.04, sizeTo: 0.06, rate: 90, life: 0.32, lift: 0.5 }],
      cam: { frame: ["A.palmR", "A.head"], az: 0, fov: 18, fit: 1.25 },
      sfx: [[0.02, "ai/screen-crack", 0.9, "his knuckles crack"], [0.1, "ai/ignite", 0.9, "his fist catches fire"]] },
    // 2. Ryn's eyes narrow; two fingers by his face light a thin blade of flame
    { name: "eyes", line: 50, lead: "B", len: 1.3,
      B: { clip: "c76_04", from: 2.3, rate: 0.35, ref: 2.6, aim: "body" },
      A: { clip: "c76_04", from: 1.4, ref: 1.5, aim: "body" },
      face: { B: COLD, A: GRIN },
      say: [{ who: "B", line: "Go home, Teo.", at: 0.15, tone: "calm", style: "cold, low, quiet and controlled", take: 2 }],
      cam: { close: "B", az: 0, fov: 14, fit: 1.45, headroom: 0.3 } },
    // 3. the standoff, wide: both in guard across the avenue, the low sun between them. Ryn: "Go home, Teo."
    { name: "standoff", line: 22, half: 1.8, lead: "B", len: 0.9,
      B: { clip: "c76_04", from: 2.4, rate: 0.5, ref: 2.6, aim: "body" },
      A: { clip: "c76_04", from: 1.5, rate: 0.5, ref: 1.6, aim: "body" },
      face: { B: COLD, A: SMIRK },
      fire: [{ who: "A", limb: "R", at: 0, to: 0.9, kind: "hold", speed: 1, size: 0.035, rate: 90, life: 0.2, lift: 0.4, silent: true },
        { who: "B", limb: "L", at: 0, to: 0.9, kind: "hold", speed: 1.4, size: 0.035, rate: 110, life: 0.26, lift: 1.2, spread: 0.04 }],
      cam: { az: 0, el: 6, fov: 30, fit: 1.1 } },
    // 4. Teo grins: "I am home."
    { name: "home", line: -50, lead: "A", len: 1.05,
      A: { clip: "c76_04", from: 1.6, rate: 0.5, ref: 1.7, aim: "body" },
      B: { clip: "c76_04", from: 2.6, ref: 2.7, aim: "body" },
      face: { A: GRIN, B: COLD },
      say: [{ who: "A", line: "I am home.", at: 0.08, tone: "calm", style: "cocky, amused, confident, a grin in the voice" }],
      cam: { close: "A", az: 0, fov: 16, fit: 1.45, headroom: 0.3 } },
    // 5. over Teo's shoulder: jab, cross: two round bursts across the gap; Ryn's knife-hand takes the first, skids
    { name: "jabs", line: 62, lead: "A",
      A: { clip: "c143_23", from: 0.35, to: 1.4, ref: 0.55, aim: "strike", limb: "L" },
      B: { clip: "c135_10", from: 4.75, ref: 5.1, aim: "body", slide: { at: 0.4, dur: 0.35, d: 0.35 } },
      face: { A: SHOUT, B: ANGRY },
      fire: [{ who: "A", limb: "L", from: 0.4, to: 0.8, kind: "jet", ...TEO, drag: 1.4, dur: 0.18, life: 0.5, at: "opp", splash: 0.25 },
        { who: "A", limb: "R", from: 0.95, to: 1.4, kind: "jet", ...TEO, drag: 1.4, dur: 0.2, life: 0.5, at: "opp", splash: 0.25 }],
      cam: { az: 0, el: 5, fov: 34 } },
    // 6. Ryn turns the next one aside (tai chi roll back): it flies off and knocks the wheelie bin flying
    { name: "redirect", open: ["B"], focus: "B", line: 40, lead: "B",
      B: { clip: "c12_04", from: 1.7, to: 3.5, rate: 2.6, ref: 1.7, aim: "body", slide: { at: 0.02, dur: 0.28, d: 0.22 } },
      A: { clip: "c143_23", from: 1.4, rate: 0.4, ref: 1.4, aim: "strike", limb: "R" },
      face: { B: FOCUS, A: ANGRY },
      fire: [{ who: "A", limb: "R", at: 0, to: 0.3, pre: 0.22, kind: "jet", ...TEO, size: 0.075, grow: 1.1, spread: 0.08, drag: 1.3, life: 0.5, into: "palm:R", splash: 0.02, taper: 0.3, cont: true },
        { who: "B", limb: "R", at: 0.02, to: 0.5, kind: "jet", ...RYN, speed: 11, drag: 1.1, size: 0.09, life: 0.45, grow: 1.3, exit: true, taper: 0.2, bin: true }],
      cam: { on: "B", az: 0, el: 4, fov: 22, fit: 1.3 } },
    // 7. over Ryn's shoulder: his roundhouse throws a crescent blade of fire at Teo
    { name: "crescent", line: -60, lead: "B",
      B: { clip: "c135_07", from: 0.5, to: 1.45, rate: 1.4, ref: 0.95, aim: "strike", limb: "RF" },
      A: { clip: "c76_04", from: 1.05, ref: 1.5, aim: "body" },
      face: { B: SHOUT, A: ANGRY },
      fire: [{ who: "B", limb: "RF", from: 0.75, to: 1.15, kind: "arc", ...RYN, speed: 22, drag: 1.4, at: "opp", splash: 0.2, size: 0.13, grow: 1.3, rate: 280, life: 0.55, minY: 0.75 }],
      lines: 0.35,
      cam: { az: 0, el: 5, fov: 34 } },
    // 8. Teo's crossed guard takes it: hit-stop, flash, a sideways shake, he skids back half a metre
    { name: "guardA", focus: "A", line: -45, lead: "A", len: 0.78,
      A: { clip: "c76_04", from: 1.2, rate: 0.7, ref: 1.5, aim: "body", slide: { at: 0.05, dur: 0.42, d: 0.5 } },
      B: { clip: "c135_07", from: 1.45, rate: 0.4, ref: 1.45, aim: "body" },
      face: { A: STRAIN },
      fire: [{ who: "B", limb: "RF", at: 0, to: 0.12, pre: 0.2, kind: "arc", ...RYN, speed: 22, drag: 1.4, at2: "chest", splash: 0.3, size: 0.13, grow: 1.3, rate: 280, life: 0.3, cont: true, into: "chest" }],
      hit: { at: 0.0, frames: 6, flash: 0.32, shake: 0.045 },
      cam: { on: "A", az: 0, el: 4, fov: 18, fit: 1.25 } },
    // 9. Teo answers with everything: a lunge punch, the biggest blast yet bursts on Ryn's guard and fills the frame
    { name: "blast", line: 58, lead: "A",
      A: { clip: "c135_09", from: 6.15, to: 7.0, ref: 6.7, aim: "strike", limb: "R" },
      B: { clip: "c135_10", from: 3.4, ref: 3.6, aim: "body", slide: { at: 0.55, dur: 0.3, d: 0.4 } },
      face: { A: SHOUT, B: ANGRY },
      fire: [{ who: "A", limb: "R", from: 6.3, to: 7.0, kind: "jet", ...TEO, size: 0.24, grow: 2.0, rate: 320, speed: 15, drag: 1.2, dur: 0.5, spread: 0.2, life: 0.6, at: "opp", splash: 1.1, peak: "hold" }],
      wipe: true, lines: 0.45,
      cam: { az: 0, el: 5, fov: 32 } },
  ],
  alley: [
    // 10. the fire clears in the back street: Ryn is still skidding back out of it, guard up, smoking
    { name: "skid", focus: "B", line: 60, lead: "B", len: 0.85,
      B: { clip: "c76_04", from: 1.3, rate: 0.7, ref: 1.5, aim: "body", slide: { at: 0.0, dur: 0.6, d: 1.1 } },
      A: { clip: "c135_09", from: 6.95, rate: 0.4, ref: 6.95, aim: "strike", limb: "R" },
      face: { B: STRAIN, A: ANGRY },
      fire: [{ who: "A", limb: "R", at: 0, to: 0.16, pre: 0.1, cont: true, kind: "jet", ...TEO, size: 0.16, grow: 1.6, rate: 260, speed: 15, drag: 1.2, into: "chest", splash: 0.3, taper: 0.3 }],
      cam: { on: "B", az: 0, fov: 26, fit: 1.3 } },
    // 11. Ryn answers: jab, jab: two thin blades down the alley at Teo
    { name: "blades", line: -55, lead: "B",
      B: { clip: "c143_23", from: 0.35, to: 1.4, ref: 0.55, aim: "strike", limb: "L" },
      A: { clip: "c76_04", from: 1.05, ref: 1.5, aim: "body" },
      face: { B: SHOUT, A: ANGRY },
      fire: [{ who: "B", limb: "L", from: 0.4, to: 0.8, kind: "jet", ...RYN, drag: 1.2, dur: 0.16, life: 0.5, at: "opp", splash: 0.2 },
        { who: "B", limb: "R", from: 0.95, to: 1.4, kind: "jet", ...RYN, drag: 1.2, dur: 0.16, life: 0.5, into: "palm:R", splash: 0.02 }],
      cam: { az: 0, fov: 30 } },
    // 12. Teo sweeps the second blade aside into the wall: it scorches the bricks and bursts the steam pipe
    { name: "sweep", open: ["A"], focus: "A", line: -60, lead: "A",
      A: { clip: "c12_04", from: 1.7, to: 3.3, rate: 2.6, ref: 1.7, aim: "body", slide: { at: 0.02, dur: 0.25, d: 0.2 } },
      B: { clip: "c143_23", from: 1.4, rate: 0.4, ref: 1.4, aim: "strike", limb: "R" },
      face: { A: FOCUS, B: ANGRY },
      fire: [{ who: "B", limb: "R", at: 0, to: 0.4, pre: 0.2, kind: "jet", ...RYN, drag: 1.2, life: 0.5, into: "palm:R", splash: 0.02, taper: 0.12, cont: true },
        { who: "A", limb: "R", at: 0.02, to: 0.55, kind: "jet", ...TEO, speed: 11, drag: 1.1, size: 0.16, life: 0.7, grow: 1.8, exit: true, taper: 0.2, wall: true }],
      cam: { on: "A", az: 0, el: 12, fov: 22, fit: 1.3 } },
    // 13. both fire at once: the two streams meet half way and burst; both are pushed back
    { name: "meet", line: -40, half: 2.2, lead: "A",
      A: { clip: "c135_09", from: 2.45, to: 3.3, ref: 2.6, aim: "strike", limb: "R" },
      B: { clip: "c135_09", from: 4.2, ref: 4.8, aim: "strike", limb: "L", slide: { at: 0.6, dur: 0.3, d: 0.3 } },
      face: { A: SHOUT, B: SHOUT },
      fire: [{ who: "A", limb: "R", from: 2.45, to: 3.2, kind: "jet", ...TEO, drag: 1.2, dur: 0.35, life: 0.5, into: "mid", splash: 0.3, peak: "hold" },
        { who: "B", limb: "L", from: 4.3, to: 5.0, kind: "jet", ...RYN, drag: 1.2, dur: 0.35, life: 0.5, into: "mid", splash: 0.3, peak: "hold", sync: "A" }],
      pop: true,
      cam: { az: 0, el: 25, fov: 40, y: 3.6 } },
    // 14. Teo's spinning kick lays an arc across the alley; Ryn jet-jumps: fire from both feet, straight up and out
    { name: "jump", line: -65, lead: "B", len: 1.0,
      B: { clip: "c16_01", from: 0.55, to: 1.25, rate: 1.0, ref: 0.9, aim: "body" },
      A: { clip: "c88_06", from: 0.38, to: 1.2, ref: 0.8, aim: "strike", limb: "RF" },
      face: { B: FOCUS, A: SHOUT },
      fire: [{ who: "A", limb: "RF", from: 0.55, to: 1.0, kind: "arc", ...TEO, speed: 20, drag: 1.4, at: "opp", splash: 0.3, size: 0.15, grow: 1.5, rate: 260, life: 0.5, minY: 0.6 },
        { who: "B", limb: "LF", at: 0.42, to: 0.85, kind: "jet", ...RYN, speed: 8, drag: 2, size: 0.11, life: 0.35, down: true, silent: true },
        { who: "B", limb: "RF", at: 0.42, to: 0.85, kind: "jet", ...RYN, speed: 8, drag: 2, size: 0.11, life: 0.35, down: true },
        { who: "A", limb: "LF", at: 0.78, to: 1.0, kind: "jet", ...TEO, speed: 8, drag: 2, size: 0.13, life: 0.3, down: true },
        { who: "A", limb: "RF", at: 0.78, to: 1.0, kind: "jet", ...TEO, speed: 8, drag: 2, size: 0.13, life: 0.3, down: true, silent: true }],
      lines: 0.4,
      cam: { az: 0, fov: 30 } },
  ],
  roof: [
    // 15. the rooftop at sunset: both land out of their jumps, the fire at their feet braking them
    { name: "land", focus: "B", line: 50, half: 1.7, lead: "B", len: 0.55,
      B: { clip: "c16_01", from: 1.25, to: 2.05, ref: 1.6, aim: "body" },
      A: { clip: "c16_01", from: 1.15, ref: 1.6, aim: "body" },
      face: { B: COLD, A: ANGRY },
      fire: [{ who: "B", limb: "LF", at: 0, to: 0.22, kind: "jet", ...RYN, speed: 6, drag: 2.5, size: 0.11, life: 0.3, down: true },
        { who: "B", limb: "RF", at: 0, to: 0.22, kind: "jet", ...RYN, speed: 6, drag: 2.5, size: 0.11, life: 0.3, down: true, silent: true },
        { who: "A", limb: "LF", at: 0.05, to: 0.3, kind: "jet", ...TEO, speed: 6, drag: 2.5, size: 0.13, life: 0.3, down: true },
        { who: "A", limb: "RF", at: 0.05, to: 0.3, kind: "jet", ...TEO, speed: 6, drag: 2.5, size: 0.13, life: 0.3, down: true, silent: true }],
      cam: { on: "B", az: 0, el: 3, fov: 24, fit: 1.2 } },
    // 16. Teo powers up: a ball of fire gathers between his palms, the gravel lifts, speed lines
    { name: "powerA", open: ["A"], focus: "A", line: -50, lead: "A", len: 1.0,
      A: { clip: "c12_04", from: 12.6, to: 14.2, rate: 1.6, ref: 12.8, aim: "body" },
      B: { clip: "c135_11", from: 0.3, ref: 0.6, aim: "body" },
      face: { A: SHOUT },
      fire: [{ who: "A", limb: "LR", at: 0.05, to: 1.0, kind: "burst", speed: 0.5, size: 0.06, sizeTo: 0.14, grow: 0.9, rate: 260, life: 0.25, drag: 4, lift: 0.3 }],
      lines: 0.55, rise: true,
      cam: { close: "A", az: 0, fov: 16, fit: 1.25, hands: true },
      sfx: [[0.02, "gasp", 0.8, "Teo breathes in"], [0.1, "sizzle", 1.3, "the fireball hisses between his palms", 0.9]] },
    // 17. Ryn powers up: horse stance, both fists catch fire
    { name: "powerB", focus: "B", line: 50, lead: "B", len: 1.0,
      B: { clip: "c135_11", from: 0.3, to: 0.95, rate: 0.65, ref: 0.6, aim: "body", turn: 180 },
      A: { clip: "c12_04", from: 14.2, ref: 14.3, aim: "body" },
      face: { B: SHOUT },
      fire: [{ who: "B", limb: "L", at: 0.08, to: 1.0, kind: "hold", speed: 1.4, size: 0.045, rate: 100, life: 0.3, lift: 1.0, spread: 0.05 },
        { who: "B", limb: "R", at: 0.14, to: 1.0, kind: "hold", speed: 1.4, size: 0.045, rate: 100, life: 0.3, lift: 1.0, spread: 0.05 }],
      lines: 0.55, rise: true,
      cam: { close: "B", az: 0, fov: 16, fit: 1.2, hands: true } },
    // 18-19. both fire: Teo's lunge punch, then Ryn's (one each, held on its thrower)
    { name: "fireA", focus: "A", line: -50, lead: "A", len: 0.5,
      A: { clip: "c135_09", from: 6.3, to: 6.8, ref: 6.7, aim: "strike", limb: "R" },
      B: { clip: "c135_11", from: 0.95, ref: 1.0, aim: "body" },
      face: { A: SHOUT },
      fire: [{ who: "A", limb: "R", from: 6.45, to: 6.8, kind: "jet", ...TEO, size: 0.22, grow: 1.8, rate: 320, speed: 15, drag: 1.2, dur: 0.5, life: 0.5, into: "mid", splash: 0.3, peak: "hold", clash: true }],
      cam: { on: "A", az: 0, fov: 20, fit: 1.15 } },
    { name: "fireB", focus: "B", line: 50, lead: "B", len: 0.5,
      B: { clip: "c135_09", from: 4.35, to: 4.85, ref: 4.8, aim: "strike", limb: "L" },
      A: { clip: "c135_09", from: 6.8, rate: 0.05, ref: 6.8, aim: "strike", limb: "R" },
      face: { B: SHOUT, A: SHOUT },
      fire: [{ who: "B", limb: "L", from: 4.5, to: 4.85, kind: "jet", ...RYN, size: 0.14, rate: 340, speed: 17, drag: 1.2, dur: 0.5, life: 0.5, into: "mid", splash: 0.3, peak: "hold", clash: true }],
      cam: { on: "B", az: 0, fov: 20, fit: 1.15 } },
    // 20. the streams meet in the middle (a low wide from the roof deck, the sun behind them)
    { name: "clash", line: 18, half: 1.7, lead: "A", len: 0.5,
      A: { clip: "c135_09", from: 6.8, rate: 0.04, ref: 6.8, aim: "strike", limb: "R" },
      B: { clip: "c135_09", from: 4.85, rate: 0.04, ref: 4.85, aim: "strike", limb: "L" },
      face: { A: STRAIN, B: STRAIN },
      clashFire: { meet: 0.36 },
      cam: { az: 0, el: -2, fov: 40, fit: 1.08, y: 1.45 } },
    // 21. the impact, cut in on the ball of fire: the biggest hit of the clip (10-frame hit-stop, flash, shake, lines)
    { name: "impact", line: 18, half: 1.7, lead: "A", len: 0.5, kind: "payoff",
      A: { clip: "c135_09", from: 6.81, rate: 0.04, ref: 6.8, aim: "strike", limb: "R", slide: { at: 0.05, dur: 0.5, d: 0.25 } },
      B: { clip: "c135_09", from: 4.86, rate: 0.04, ref: 4.85, aim: "strike", limb: "L", slide: { at: 0.05, dur: 0.5, d: 0.25 } },
      clashFire: {},
      hit: { at: 0.0, frames: 10, flash: 0, shake: 0.07 }, lines: 0.6,
      cam: { frame: ["mid"], az: 0, fov: 12, fit: 1.9 } },
    // 22-23. straining faces, mirrored, gritted teeth (review B: open mouths read as surprise); a step wide for the arm
    { name: "strainA", focus: "A", line: -50, lead: "A", len: 0.7,
      A: { clip: "c135_09", from: 6.84, rate: 0.04, ref: 6.8, aim: "strike", limb: "R" },
      B: { clip: "c135_09", from: 4.89, rate: 0.04, ref: 4.85, aim: "strike", limb: "L" },
      face: { A: GRIT },
      clashFire: { small: true },
      cam: { close: "A", az: 0, fov: 14, fit: 1.45 } },
    { name: "strainB", focus: "B", line: 50, lead: "B", len: 0.7,
      B: { clip: "c135_09", from: 4.91, rate: 0.04, ref: 4.85, aim: "strike", limb: "L" },
      A: { clip: "c135_09", from: 6.86, rate: 0.04, ref: 6.8, aim: "strike", limb: "R" },
      face: { B: GRIT },
      clashFire: { small: true },
      cam: { close: "B", az: 0, fov: 14, fit: 1.45 } },
    // 24. the low wide again: the ball swells between them, grit rises, both pushed back a step: the ball swells between them, grit rises, both pushed back a step
    { name: "final", line: 18, half: 1.7, lead: "A", len: 1.0,
      A: { clip: "c135_09", from: 6.9, rate: 0.04, ref: 6.8, aim: "strike", limb: "R", slide: { at: 0.3, dur: 0.6, d: 0.12 } },
      B: { clip: "c135_09", from: 4.95, rate: 0.04, ref: 4.85, aim: "strike", limb: "L", slide: { at: 0.6, dur: 0.6, d: 0.12 } },
      face: { A: STRAIN, B: STRAIN },
      clashFire: { grow: true }, rise: true, lines: 0.4,
      cam: { az: 0, el: -2, fov: 40, fit: 1.08, y: 1.45 } },
    // 26. it ends on the ball of fire filling the frame as the light floods up: open, nobody winning
    { name: "ballEnd", line: 18, half: 1.7, lead: "A", len: 1.5,
      A: { clip: "c135_09", from: 6.96, rate: 0.04, ref: 6.8, aim: "strike", limb: "R" },
      B: { clip: "c135_09", from: 5.01, rate: 0.04, ref: 4.85, aim: "strike", limb: "L" },
      clashFire: { grow: true }, lines: 0.5,
      cam: { frame: ["mid"], az: 0, fov: 12, fit: 1.5 } },
  ],
};
const P0 = PLACES[ACT], SHOTS = SHOTS_BY[ACT];
const ENV = JSON.parse(fs.readFileSync(`assets/environments/${P0.env}/env.json`, "utf8"));
const CEN = P0.centre;

// one take as a perform segment, turned and placed so that at clip second `ref` it faces `to` from `at`
const lineOf = (W, limb) => {
  const side = limb[0].toLowerCase();
  const end = limb.length === 1 ? palmWorld(W, side) : W[`${side}foot`].end, base = limb.length === 1 ? W[`${side}humerus`].start : W[`${side}femur`].start;
  return end.clone().sub(base);
};
const bodyFwd = (W) => new THREE.Vector3(0, 0, 1).applyQuaternion(W.root.q);
function segFor(P, at, to, t0) {
  load(P.clip); const rate = P.rate ?? 1;
  const base = { at: R(t0), clip: P.clip, from: P.from, to: P.to, speed: rate, blend: 0 };
  const probe = new Performance([{ ...base, at: 0, heading: 0, place: [0, 0] }], clips, [], LEG);
  const tl = (P.ref - P.from) / rate, W = worldPose(probe.at(Math.max(0, tl)));
  let f = P.aim === "strike" ? lineOf(W, P.limb) : P.aim === "travel" ? probe.at(tl).pos.clone().sub(probe.at(0).pos) : bodyFwd(W); f.y = 0;
  const want = Math.atan2(to[0] - at[0], to[1] - at[1]), have = Math.atan2(f.x, f.z);
  const heading = R((want - have) / D2R + (P.turn ?? 0), 2);
  const turned = new Performance([{ ...base, at: 0, heading, place: [0, 0] }], clips, [], LEG);
  const r = turned.at(Math.max(0, tl)).pos;
  const seg = { ...base, heading, place: [R(at[0] - r.x, 4), R(at[1] - r.z, 4)] };
  if (P.slide) { const away = new THREE.Vector2(at[0] - to[0], at[1] - to[1]).normalize(), u0 = P.from + P.slide.at * rate;
    seg.slide = [R(u0, 4), R(u0 + P.slide.dur * rate, 4), R(away.x * P.slide.d, 4), R(away.y * P.slide.d, 4)]; }
  return seg;
}

// the timeline: a shot lasts its lead's take (or `len`); the other fighter's take runs as long
const list = { A: [], B: [] };
let t = 0;
for (const sh of SHOTS) {
  const lead = sh[sh.lead], len = R(Math.round((sh.len ?? (lead.to - lead.from) / (lead.rate ?? 1)) * FPS) / FPS, 4);
  for (const who of ["A", "B"]) {
    const P = sh[who]; P.to ??= R(P.from + len * (P.rate ?? 1), 3);
    const me = spotOf(sh, who), opp = spotOf(sh, who === "A" ? "B" : "A");
    list[who].push(segFor(P, me, opp, t));
  }
  sh.t0 = t; sh.t1 = R(t + len); sh.len = len; t = sh.t1;
}
const END = R(t);
// each shot centred on the place's fighting spot (a close-up centres its one fighter; `dx`, `dz` nudge it)
{ const Pf = { A: new Performance(list.A, clips, [], LEG), B: new Performance(list.B, clips, [], LEG) };
  SHOTS.forEach((sh) => {
    const lo = [Infinity, Infinity], hi = [-Infinity, -Infinity];
    for (let s2 = sh.t0; s2 < sh.t1; s2 += 1 / 15) for (const who of ["A", "B"]) { const p = Pf[who].at(s2).pos; lo[0] = Math.min(lo[0], p.x); hi[0] = Math.max(hi[0], p.x); lo[1] = Math.min(lo[1], p.z); hi[1] = Math.max(hi[1], p.z); }
    let dx = CEN[0] + (sh.dx ?? 0) - (lo[0] + hi[0]) / 2, dz = CEN[1] + (sh.dz ?? 0) - (lo[1] + hi[1]) / 2;
    // a close-up brings its fighter up to the camera (a long lens from the back of the box would blow the painting up
    // into a blur): he stands `near` metres in front of the nearest camera place; the other one comes along with him,
    // out of frame beside or behind the camera (a cheat a cut hides: the head-and-shoulders frame shows no floor)
    const c = sh.cam, subj = c.close ?? (c.frame && !c.frame.includes("mid") ? c.frame[0][0] : null);
    const midOf = (s2) => Pf.A.at(s2).pos.clone().add(Pf.B.at(s2).pos).multiplyScalar(0.5);
    if (subj || c.frame?.includes("mid")) { let zs = 0, xs = 0, n = 0; for (let s2 = sh.t0; s2 < sh.t1; s2 += 1 / 15) { const p = subj ? Pf[subj].at(s2).pos : midOf(s2); zs += p.z; xs += p.x; n++; }
      dz = P0.cam.z[0] + 0.05 - (c.near ?? (c.frame?.includes("mid") ? 3.2 : c.frame ? 1.6 : 2.3)) - zs / n; dx = Math.max(P0.cam.x[0] + 0.3, Math.min(P0.cam.x[1] - 0.3, xs / n)) - xs / n + (sh.dx ?? 0); }
    for (const who of ["A", "B"]) for (const g of list[who]) if (g.at >= sh.t0 - 1e-6 && g.at < sh.t1 - 1e-6) g.place = [R(g.place[0] + dx, 4), R(g.place[1] + dz, 4)];
  }); }
const perf = { A: new Performance(list.A, clips, [], LEG), B: new Performance(list.B, clips, [], LEG) };
const poseAt = (who, s) => worldPose(perf[who].at(Math.min(Math.max(0, s), END - 1e-4)));
const T = (sh, who, u) => R(sh.t0 + (u - sh[who].from) / (sh[who].rate ?? 1), 4);
const shotOfT = (s) => SHOTS.find((x) => s >= x.t0 - 1e-6 && s < x.t1 - 1e-6) ?? SHOTS[SHOTS.length - 1];

// measured palms and feet (per fighter), else the recording's
const MEAS = {};
for (const w of ["A", "B"]) { const f = `${OUT}/${ID}.src.${w}.json`; MEAS[w] = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : null; }
const near = (arr, s) => { if (!arr?.length) return null; let i = arr.findIndex((q) => q.t >= s); if (i <= 0) return arr[Math.max(0, i)]; const a = arr[i - 1], b = arr[i], k = (s - a.t) / Math.max(1e-6, b.t - a.t); return { t: s, p: a.p.map((v, j) => v + (b.p[j] - v) * k) }; };
const palmAt = (who, side, s) => { const m = near(MEAS[who]?.[side.toUpperCase()], s); return m ? new THREE.Vector3(...m.p) : palmWorld(poseAt(who, s), side); };
const footAt = (who, side, s) => { const m = near(MEAS[who]?.[`${side.toUpperCase()}F`], s); return m ? new THREE.Vector3(...m.p) : poseAt(who, s)[`${side}foot`].end.clone(); };
const ballAt = (who, s) => palmAt(who, "l", s).add(palmAt(who, "r", s)).multiplyScalar(0.5);
const chest = (who, s) => { const W = poseAt(who, s); return W.thorax ? W.thorax.end.clone() : W.root.start.clone().add(new THREE.Vector3(0, 0.35, 0)); };
// the clash point: half way between the two pouring fists, drifting a little toward one then the other (nobody wins)
const fistOf = { A: "r", B: "l" };
const midAt = (s) => { const a = palmAt("A", fistOf.A, s), b = palmAt("B", fistOf.B, s), sh = shotOfT(s);
  const u = 0.5 + (sh.clashFire ? 0.06 * Math.sin((s - SHOTS[0].t0) * 2.2) : 0); return a.lerp(b, u); };
function source(who, limb, s) {
  const W = poseAt(who, s);
  let p, d;
  if (limb === "LR") { p = ballAt(who, s); d = bodyFwd(W).setY(0).normalize(); }
  else if (limb.length === 1) { const side = limb.toLowerCase(), palm = palmWorld(W, side), el = W[`${side}radius`].start; d = palm.clone().sub(el).normalize(); p = palmAt(who, side, s).addScaledVector(d, 0.05); }
  else { const side = limb[0].toLowerCase(), ball = W[`${side}foot`].end, hip = W[`${side}femur`].start; d = ball.clone().sub(hip).normalize(); p = footAt(who, side, s); }
  return [R(s, 4), R(p.x), R(p.y), R(p.z), R(d.x), R(d.y), R(d.z)];
}
const reachOf = (who, limb, s) => { const W = poseAt(who, s), l = lineOf(W, limb), side = limb[0].toLowerCase();
  return { d: l.length(), end: limb.length === 1 ? palmWorld(W, side) : W[`${side}foot`].end, line: l }; };
const target = (who, spec, s) => spec === "ball" ? ballAt(who, s) : spec === "chest" ? chest(who, s) : spec === "mid" ? midAt(s) : palmAt(who, spec.split(":")[1].toLowerCase(), s);

const blasts = [], marks = { silent: new Set(), arrive: [], exits: [] };
const firesOf = (sh) => {
  const out = [...(sh.fire || [])];
  // the clash: both fighters pour a stream into the meeting point all shot long, and a ball of fire churns there
  if (sh.clashFire) {
    const big = sh.clashFire.grow, small = sh.clashFire.small;
    out.push({ who: "A", limb: "R", at: 0, to: sh.len, pre: sh.name === "clash" ? 0.3 : 0.25, cont: true, kind: "jet", ...TEO, size: small ? 0.14 : 0.22, grow: 1.8, rate: 320, speed: 15, drag: 1.2, life: 0.5, into: "mid", splash: 0.3, silent: true },
      { who: "B", limb: "L", at: 0, to: sh.len, pre: sh.name === "clash" ? 0.3 : 0.25, cont: true, kind: "jet", ...RYN, size: small ? 0.1 : 0.14, rate: 340, speed: 17, drag: 1.2, life: 0.5, into: "mid", splash: 0.3, silent: true },
      { who: "M", limb: "M", at: sh.clashFire.meet ?? 0, to: sh.len, ...(sh.clashFire.meet ? {} : { pre: 0.4 }), kind: "burst", speed: 1.4, size: big ? 0.3 : 0.26, sizeTo: big ? 0.62 : 0.32, grow: 1.4, rate: 360, life: 0.32, drag: 3, lift: 0.4, spread: 3.1, silent: true });
  }
  return out;
};
for (const sh of SHOTS) for (const f of firesOf(sh)) {
  const { who, limb, from, to, dur, minY, level, at: _a, at2, peak, silent, into, exit, cont, cutAt, pre, bin, wall, down, sync, clash, ...rest } = f;
  const opp = who === "A" ? "B" : "A", timed = f.kind === "hold" || f.kind === "burst" || cont || exit || down;
  let a, b, line = null;
  if (timed) { a = R(Math.max(0, sh.t0 + _a) - (pre ?? 0), 4); b = R(Math.min(sh.t1, sh.t0 + to), 4); }
  else {
    const w0 = T(sh, who, from), w1 = T(sh, who, to); let pk = w0, pd = 0;
    for (let s2 = w0; s2 <= w1; s2 += 1 / 120) { const r = reachOf(who, limb, s2); if (r.d > pd && (minY == null || r.end.y >= minY)) { pd = r.d; pk = s2; } }
    a = pk; for (let s2 = pk; s2 >= w0; s2 -= 1 / 120) { if (reachOf(who, limb, s2).d < 0.9 * pd) break; a = s2; }
    if (f.kind === "arc") { a = pk; b = pk; for (let s2 = pk; s2 >= w0; s2 -= 1 / 120) { if (reachOf(who, limb, s2).end.y < minY) break; a = s2; } for (let s2 = pk; s2 <= w1; s2 += 1 / 120) { if (reachOf(who, limb, s2).end.y < minY) break; b = s2; } }
    else {
      b = Math.min(w1, sh.t1, a + (dur ?? 0.22)); if (peak !== "hold") for (let s2 = pk; s2 <= b; s2 += 1 / 120) if (reachOf(who, limb, s2).d < 0.7 * pd) { b = s2; break; }
      if (f.kind === "jet") { line = reachOf(who, limb, pk).line; if (level != null) line.y *= level; line.normalize(); }
    }
    a = R(a - (pre ?? 0), 4); b = R(clash ? sh.t1 : b, 4);
  }
  const src = [];
  let prev = null;
  for (let s2 = a; s2 <= b + 1e-6; s2 += 1 / 60) {
    const sp = pre ? Math.max(s2, sh.t0 + 1e-4) : s2;
    let q;
    if (who === "M") { const m = midAt(sp); q = [R(s2, 4), R(m.x), R(m.y), R(m.z), 0, 1, 0]; }
    else q = source(who, limb, sp);
    q[0] = R(s2, 4);
    if (into && who !== "M") { const tp = target(opp, into, Math.max(sp, s2 + 0.12)), dv = tp.sub(new THREE.Vector3(q[1], q[2], q[3])).normalize(); q.splice(4, 3, R(dv.x), R(dv.y), R(dv.z)); }
    else if (exit) {
      // the redirect: the fire leaves along the hand's own sweep (its velocity over the next 0.1 s), lifted a little
      const p1 = source(who, limb, s2 + 0.1), v = new THREE.Vector3(p1[1] - q[1], p1[2] - q[2], p1[3] - q[3]);
      if (v.length() < 0.02) v.copy(prev ?? new THREE.Vector3(0, 1, 0)); v.normalize(); v.y += bin ? 0.05 : 0.2; v.normalize(); if (prev) v.lerp(prev, 0.75).normalize(); prev = v.clone();   // (eased: the end of a sweep never snaps the stream round)
      q.splice(4, 3, R(v.x), R(v.y), R(v.z));
    }
    else if (down) q.splice(4, 3, 0, -1, 0);
    else if (line) q.splice(4, 3, R(line.x), R(line.y), R(line.z));
    else if (f.kind === "arc" && (_a === "opp" || into === "chest")) { const dv = chest(opp, s2 + 0.3).sub(new THREE.Vector3(q[1], q[2], q[3])).normalize(); q.splice(4, 3, R(dv.x), R(dv.y), R(dv.z)); }
    if (minY == null || q[2] >= minY * 0.9) src.push(q);
  }
  if (!src.length) { console.warn("no fire for", sh.name, who, limb); continue; }
  let reach;
  const sm = (a + b) / 2, qm = who === "M" ? null : source(who, limb, sm), pm = qm && new THREE.Vector3(qm[1], qm[2], qm[3]);
  if (_a === "opp" && pm) reach = Math.max(0.2, pm.distanceTo(chest(opp, sm)) - 0.3);
  if (into && pm) reach = Math.max(0.2, pm.distanceTo(target(opp, into, sm)) - (into === "chest" ? 0.3 : into === "mid" ? 0.08 : 0.04));
  if (reach != null && f.kind !== "hold") { const v = (rest.speed ?? 7) * (f.kind === "arc" ? 0.5 : 1), k = rest.drag ?? 3, x = Math.min(0.95, reach * k / v), ta = -Math.log(1 - x) / k;
    rest.life = R(Math.max(0.12, ta * (into && into !== "chest" ? 0.95 : 1.1)), 3); }
  if (pre) rest.show = R(Math.max(0, sh.t0), 4);
  const B = { at: src[0][0], end: src[src.length - 1][0], cut: R(cutAt ?? sh.t1, 4), src, ...(reach != null ? { reach: R(reach) } : {}), ...rest };
  blasts.push(B);
  if (reach != null) { const v = (rest.speed ?? 7) * (f.kind === "arc" ? 0.5 : 1), k = rest.drag ?? 3, x = reach * k / v; marks.arrive.push({ sh: sh.name, who, at: R(src[0][0] + (x < 1 ? -Math.log(1 - x) / k : 0.3), 3), B, into }); }
  if (silent) marks.silent.add(B);
  if (exit) marks.exits.push({ sh, B, bin, wall });
}

// --------------------------------------------------------------------------------------------- props + physics
const props = [{ id: "fire", kind: "firebend", x: 0, y: 0, z: 0, rot: 0, blasts, light: 18, staged: "fire: light, it rests on nothing" }];
const extra = [];   // beat items: [s, item]
// a redirect that hits something: the stream's line 1.6-2.4 m out from the hand, at the frame it gets there
for (const e of marks.exits) {
  const q = e.B.src[Math.min(e.B.src.length - 1, 8)], p = new THREE.Vector3(q[1], q[2], q[3]), d = new THREE.Vector3(q[4], q[5], q[6]).normalize();
  const hitAt = R(q[0] + 0.16, 3);
  if (e.bin) {
    const g = p.clone().addScaledVector(d, 1.9); g.y = 0;
    props.push({ id: "bin", kind: "wheeliebin", x: R(g.x), y: 0, z: R(g.z), rot: R(Math.atan2(-d.x, -d.z) / D2R, 1), scale: 0.95, staged: "a wheelie bin on the pavement edge" });
    extra.push([hitAt, { do: "physics", prop: "bin", mode: "knock", v: [R(d.x * 3.2), 1.6, R(d.z * 3.2)], spin: [R(-d.z * 4), 0.6, R(d.x * 4)] }]);
    extra.push([hitAt, { sfx: "hit-metal", gain: 0.85, reason: "the redirected fire knocks the wheelie bin flying" }]);
    extra.push([hitAt, { do: "poof", pos: [R(g.x), 0.6, R(g.z)], dur: 0.6, color: "#3a3236", puffs: 6, sparks: 6, size: 0.3, lift: 0.4, sound: false }]);
  }
  if (e.wall) {
    // the wall: where the stream's flight runs into the alley's side (|x| ~ 1.5 m from the centre line); a scorch and
    // the steam pipe there bursts
    const k = Math.max(0.5, Math.min(3, (Math.sign(d.x || 1) * 1.55 + CEN[0] - p.x) / (d.x || 1e-3))), w = p.clone().addScaledVector(d, k);
    const hw = R(q[0] + k / 11 * 1.2, 3);
    extra.push([hw, { do: "poof", pos: [R(w.x), R(w.y), R(w.z)], dur: 0.9, color: "#2b2426", puffs: 8, sparks: 10, size: 0.32, lift: 0.3, sound: false }]);
    extra.push([hw, { sfx: "steam", gain: 0.8, reason: "the fire bursts the steam pipe on the wall" }]);
    extra.push([hw, { sfx: "crumble", gain: 0.6, reason: "the fire scorches and chips the bricks" }]);
    props.push({ id: "steam", kind: "steamjet", x: R(w.x), y: R(Math.max(0.6, w.y)), z: R(w.z), rot: Math.sign(w.x) > 0 ? -90 : 90, scale: 1.2, show: [hw, END], staged: "steam from the burst pipe" });
  }
}

// ---------------------------------------------------------------------------------------------- the cameras
// still, one per shot. A wide holds both fighters all shot long; "close": head and shoulders (and hands); "on": one
// fighter whole; "frame": the named points (an extreme close-up). Long lenses from the safe box of the painting.
const LIM = P0.cam;
const ptOf = (key, s) => {
  if (key === "mid") return midAt(s);
  const [w, part] = key.split("."), W = poseAt(w, s), up = new THREE.Vector3(0, 1, 0);
  if (part === "head") return W.head.end.clone().addScaledVector(up, 0.02);
  if (part === "palmR") return palmAt(w, "r", s);
  if (part === "palmL") return palmAt(w, "l", s);
  if (part === "footR") return W.rfoot.end.clone().setY(0.02);
  if (part === "footL") return W.lfoot.end.clone().setY(0.02);
  return W.root.start.clone();
};
const beats = SHOTS.map((sh) => {
  const c = sh.cam, pts = [], up = new THREE.Vector3(0, 1, 0);
  for (let s2 = sh.t0; s2 < sh.t1; s2 += 1 / 15) {
    if (c.frame) { for (const k of c.frame) { const p = ptOf(k, s2); pts.push(p); if (k.endsWith("head")) pts.push(p.clone().addScaledVector(up, 0.12), p.clone().addScaledVector(up, -0.16)); if (k === "mid") for (const o of [[0.35, 0, 0], [-0.35, 0, 0], [0, 0.35, 0], [0, -0.35, 0]]) pts.push(p.clone().add(new THREE.Vector3(...o))); } continue; }
    for (const who of c.close ? [c.close] : c.on ? [c.on] : ["A", "B"]) {
      const W = poseAt(who, s2);
      if (c.close) { pts.push(W.head.end.clone().addScaledVector(up, 0.12), W.thorax.end.clone().addScaledVector(up, -0.12), W.lclavicle.end.clone(), W.rclavicle.end.clone());
        if (c.hands) pts.push(palmWorld(W, "l"), palmWorld(W, "r")); }
      else pts.push(W.head.end.clone().addScaledVector(up, 0.12), palmWorld(W, "l"), palmWorld(W, "r"), W.root.start.clone(), W.lfoot.end.clone(), W.rfoot.end.clone());
    }
  }
  const lo = new THREE.Vector3(Infinity, Infinity, Infinity), hi = lo.clone().multiplyScalar(-1);
  for (const p of pts) { lo.min(p); hi.max(p); }
  const ctr = lo.clone().add(hi).multiplyScalar(0.5), az = (c.az ?? 0) * D2R, el = (c.el ?? 4) * D2R;
  // the camera as near as the painting allows on its line (z inside the box), then clamped into the box
  const back = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
  // as far back as the wanted lens needs to hold the points (then clamped into the painting's box; the lens is refit)
  const ext = Math.max((hi.y - lo.y) / 2, (hi.x - lo.x) / 2 / (9 / 16)) * (c.fit ?? 1.08);
  let D = ext / Math.tan(((c.fov ?? 30) * D2R) / 2) + (hi.z - lo.z) / 2;
  const pos0 = ctr.clone().addScaledVector(back, D);
  const yl = Array.isArray(LIM.yaw) ? LIM.yaw : [-LIM.yaw, LIM.yaw];
  const fit = c.fit ?? 1.08;
  const aimIn = (pos, look) => { const v = look.clone().sub(pos), h = Math.hypot(v.x, v.z), yaw = Math.atan2(v.x, -v.z), pit = Math.atan2(v.y, h);
    const y2 = Math.max((yl[0] + 0.3) * D2R, Math.min((yl[1] - 0.3) * D2R, yaw)), p2 = Math.max((LIM.pitch[0] - LIM.pitch[1]) * D2R, Math.min((LIM.pitch[0] + LIM.pitch[1]) * D2R, pit)), L = v.length();
    look.copy(pos).add(new THREE.Vector3(Math.sin(y2) * Math.cos(p2), Math.sin(p2), -Math.cos(y2) * Math.cos(p2)).multiplyScalar(L)); };
  // the lens and aim that hold the points from one camera place
  const fitFrom = (pos) => {
    const cam = new THREE.PerspectiveCamera(30, 9 / 16, 0.05, 200), look = ctr.clone();
    let fov = Math.min(LIM.fov, c.fov ?? 30), m = 1;
    for (let k = 0; k < 7; k++) {
      aimIn(pos, look);
      cam.fov = fov; cam.position.copy(pos); cam.lookAt(look); cam.updateProjectionMatrix(); cam.updateMatrixWorld();
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
      for (const p of pts) { const q = p.clone().project(cam); x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); y0 = Math.min(y0, q.y); y1 = Math.max(y1, q.y); }
      m = Math.max((x1 - x0) / 2, (y1 - y0) / 2) * fit; const dz = look.clone().project(cam).z;
      look.copy(new THREE.Vector3((x0 + x1) / 2, (y0 + y1) / 2, dz).unproject(cam));
      fov = Math.max(4, Math.min(LIM.fov, 2 * Math.atan(Math.tan(fov * Math.PI / 360) * m) * 180 / Math.PI));
    }
    aimIn(pos, look);
    if (c.headroom) { look.y += look.distanceTo(pos) * Math.tan(fov * D2R * c.headroom); aimIn(pos, look); }
    const fails = frameCoverage(ENV, { pos: pos.toArray(), look: look.toArray(), fov: fov * 1.15 + 1 }).filter((r) => r.level === "fail" && r.rule !== "gap");   // (fov: room for the shakes)
    return { pos, look, fov, fails, crop: fov >= LIM.fov - 0.01 && m > 1.001 };
  };
  // from the wanted distance in toward the subject until every frame point is on the painting (a camera too far back
  // sees floor in front of the painted one) and nothing has to be cropped
  const clampIn = (p) => { p.x = Math.max(LIM.x[0], Math.min(LIM.x[1], p.x)); p.y = Math.max(LIM.y[0], Math.min(LIM.y[1], c.y ?? p.y)); p.z = Math.max(LIM.z[0], Math.min(LIM.z[1], p.z)); return p; };
  let best = null;
  for (let k = 0; k <= 40; k++) {
    const p = clampIn(ctr.clone().add(pos0.clone().sub(ctr).multiplyScalar(1 - k * 0.022)));
    const r = fitFrom(p);
    if (!r.fails.length && !r.crop) { best = r; break; }
    best ??= r;
  }
  if (process.env.CAMDBG && best.fails.length) console.log("dbg", sh.name, best.pos.toArray().map((v) => R(v)), best.look.toArray().map((v) => R(v)), R(best.fov, 1), best.fails.slice(0, 4).map((r) => r.rule + "@" + r.at).join(" "));
  if (best.fails.length) {   // still off: tilt up from the first place (the floor runs out at the bottom)
    for (let k = 0; k < 40 && best.fails.length; k++) { best.look.y += best.look.distanceTo(best.pos) * Math.tan(0.5 * D2R);
      best.fails = frameCoverage(ENV, { pos: best.pos.toArray(), look: best.look.toArray(), fov: best.fov * 1.15 + 1 }).filter((r) => r.level === "fail" && r.rule !== "gap"); }
    if (best.fails.length) console.warn("camera still off the painting:", sh.name, best.fails[0].rule, best.fails[0].at);
    else console.warn("camera tilted up to stay on the painting:", sh.name);
  }
  const { pos, look, fov } = best;
  return { name: sh.name, at: R(sh.t0), len: R(sh.len), kind: sh.kind,
    shot: { pos: [R(pos.x), R(pos.y), R(pos.z)], look: [R(look.x), R(look.y), R(look.z)], fov: R(fov, 1) }, do: [] };
});

// ---------------------------------------------------------------------------------------------- sound + effects
const shotAt = (s) => beats.find((b) => s >= b.at - 1e-6 && s < b.at + b.len) ?? beats[beats.length - 1];
const put = (s, item) => { const b = shotAt(s); b.do.push({ ...(item.sfx && !item.reason ? { reason: "the fire is born on this frame" } : {}), ...item, at: R(Math.max(0, s - b.at)) }); };
const fx = [], hitStop = [], fr = (s) => R(Math.round(s * FPS) / FPS);
for (const [s, it] of extra) { if (it.do === "poof") fx.push({ ...it, at: R(s, 3) }); else put(s, it); }
for (const B of blasts) {
  if (marks.silent.has(B)) continue;
  const b = shotAt(B.at);
  if (B.kind === "hold") { put(B.at, { sfx: "ai/ignite", gain: 0.8, reason: "fire catches on his hand" }); continue; }
  if (B.kind === "burst") continue;
  if (B.kind === "arc") { put(B.at - 0.12, { sfx: "whoosh", dur: 0.4, gain: 0.8, reason: "the kicking leg swings through" }); put(B.at, { sfx: "ai/flare", gain: 0.9 }); continue; }
  put(B.at - 0.02, { sfx: "flamejet", gain: B.size > 0.18 ? 1.0 : 0.72 });
}
for (const sh of SHOTS) for (const [s, n, g, why, dur] of sh.sfx || []) put(sh.t0 + s, { sfx: n, gain: g, reason: why, ...(dur ? { dur } : {}) });
// a skid: the guard is driven back over the ground (a gritty rumble the length of the slide), dust off both feet
for (const sh of SHOTS) for (const who of ["A", "B"]) {
  const P = sh[who]; if (!P.slide) continue;
  const s0 = sh.t0 + P.slide.at, s1 = s0 + P.slide.dur;
  put(s0, { sfx: "tyres", dur: R(P.slide.dur), gain: 0.3 + 0.15 * Math.min(1, P.slide.d), reason: `${who === "A" ? "Teo" : "Ryn"}'s feet skid back over the ground` });
  for (let k = 0; k < 3; k++) { const s2 = s0 + (s1 - s0) * k / 3, W = poseAt(who, s2);
    for (const side of ["l", "r"]) { const f = W[`${side}foot`].end; fx.push({ do: "poof", at: R(s2, 3), pos: [R(f.x), 0.02, R(f.z)], dur: 0.5, color: ACT === "street" ? "#cdbba2" : ACT === "alley" ? "#7a6a72" : "#b9a39a", puffs: 5, sparks: 0, size: 0.16 + 0.08 * Math.min(1.5, P.slide.d), lift: 0.05, sound: false }); } }
}
// each arrival on a guard: a small sideways shake
for (const m of marks.arrive) if (m.into !== "mid" && !(m.into || "").startsWith("palm") && m.into !== "chest") put(m.at, { fx: "shake", dur: 0.16, amp: 0.02 });
// speed lines on the power-ups and the big attacks
for (const sh of SHOTS) if (sh.lines) { const b = beats.find((x) => x.name === sh.name); fx.push({ do: "speedlines", at: R(b.at), dur: R(b.len), alpha: sh.lines, count: 90, inner: 520, color: "#2a160f" }); }
// a hit: flash on its frame, hit-stop, a sideways shake, the boom
for (const sh of SHOTS) if (sh.hit) { const h = fr(sh.t0 + sh.hit.at), b = beats.find((x) => x.name === sh.name);
  if (sh.hit.flash) b.do.push({ fx: "flash", at: R(h - b.at), dur: 0.07, peak: sh.hit.flash, sound: false });
  put(h, { fx: "shake", dur: 0.35, amp: sh.hit.shake });
  put(h, { sfx: "impact", gain: 0.9, reason: sh.name === "impact" ? "the two streams slam into each other" : "the fire slams into his guard" });
  put(h, { sfx: "kenney/impact-punch-heavy", gain: 0.6, reason: "the hit's punch on a phone speaker" });
  hitStop.push({ at: h, frames: sh.hit.frames }); }
// two streams meeting half way (the alley): a pop of fire and smoke where they meet, both pushed back
for (const sh of SHOTS) if (sh.pop) { const ar = marks.arrive.filter((m) => m.sh === sh.name); if (ar.length < 2) continue;
  const s = fr(Math.max(...ar.map((m) => m.at))), m = midAt(s);
  blasts.push({ at: s, end: R(s + 0.22, 4), cut: R(sh.t1, 4), kind: "burst", speed: 3.2, size: 0.16, rate: 260, life: 0.3, drag: 3, lift: 1.0, spread: 3.1, src: [[s, R(m.x), R(m.y), R(m.z), 0, 1, 0], [R(s + 0.22, 4), R(m.x), R(m.y), R(m.z), 0, 1, 0]] });
  const b = beats.find((x) => x.name === sh.name); b.do.push({ fx: "flash", at: R(s - b.at), dur: 0.07, peak: 0.3, sound: false });
  put(s, { fx: "shake", dur: 0.3, amp: 0.04 }); put(s, { sfx: "firework", gain: 0.9, reason: "the two streams meet and burst" }); hitStop.push({ at: s, frames: 5 }); }
// the frame-filling burst at the end of the street (Teo's blast on Ryn's guard): the cut to the alley comes out of it
for (const sh of SHOTS) if (sh.wipe) { const ar = marks.arrive.find((m) => m.sh === sh.name); if (!ar) continue;
  const s = fr(ar.at), c = chest("B", s);
  blasts.push({ at: s, end: R(sh.t1, 4), cut: R(sh.t1, 4), kind: "burst", speed: 7, size: 0.4, sizeTo: 1.5, rate: 440, life: 0.45, drag: 2, lift: 0.6, spread: 3.1, src: [[s, R(c.x), R(c.y), R(c.z), 0, 0, 1], [R(sh.t1, 4), R(c.x), R(c.y), R(c.z), 0, 0, 1]] });
  const b = beats.find((x) => x.name === sh.name); b.do.push({ fx: "flash", at: R(s - b.at), dur: R(sh.t1 - s), peak: 0.55, sound: false });
  put(s, { fx: "shake", dur: R(sh.t1 - s), amp: 0.035 }); put(s, { sfx: "impact", gain: 1.0, reason: "Teo's blast bursts on Ryn's guard" }); put(s, { sfx: "firework", gain: 0.9, reason: "the crack of the burst on a phone speaker" }); hitStop.push({ at: s, frames: 4 }); }
// debris rising round a power-up and the clash (zero-g gravel: physics, not tweens)
for (const sh of SHOTS) if (sh.rise) {
  const b = beats.find((x) => x.name === sh.name), who = sh.focus ?? null, c = who ? poseAt(who, sh.t0).root.start : midAt(sh.t0);
  for (let k = 0; k < 7; k++) { const id = `grit-${sh.name}-${k}`, a = k * 2.39 + (who === "B" ? 1 : 0), r = 0.35 + 0.12 * (k % 3);
    props.push({ id, kind: "rubble", x: R(c.x + Math.cos(a) * r), y: 0.03, z: R(c.z + Math.sin(a) * r * 0.6), rot: k * 37, scale: 0.12 + 0.03 * (k % 2), body: { settle: true }, staged: "grit on the roof" }); }
  put(sh.t0 + 0.05, { do: "physics", mode: "float", g: 0.6, dur: 0.3, damp: 1.2 });
  put(sh.t1 - 0.02, { do: "physics", mode: "float", g: -9.81, dur: 0.05 });
  put(sh.t0 + 0.05, { sfx: "windswell", gain: 0.6, dur: R(sh.len), reason: "the air rushes in as he powers up" }); }
// the clash: one long roar rising under it all, and the light flooding up to the end (it never whites out: 0.85 at most)
{ const cl = SHOTS.find((x) => x.name === "impact");
  if (cl) { const s0 = cl.t0, len = END - s0;
    put(s0, { sfx: "flamejet", gain: 1.0, dur: R(Math.min(2.0, len)), reason: "both streams pour into the clash" });
    put(s0, { sfx: "rumble", gain: 0.9, dur: R(len), reason: "the clash ball roars and grows" });
    put(s0 + 0.2, { sfx: "ai/slowmo-air", gain: 0.6, reason: "the shockwave rolls out" });
    const fin = beats.find((x) => x.name === "final"), end = beats.find((x) => x.name === "ballEnd");
    end.do.push({ fx: "flash", at: R(end.len - 1.2), dur: 1.2, peak: 0.75, ramp: true, sound: false });
    for (let k = 0; k < 7; k++) put(fin.at + k * 0.4, { fx: "shake", dur: 0.38, amp: 0.012 + k * 0.004 });
    put(end.at + end.len - 1.4, { sfx: "windswell", gain: 0.8, dur: 1.4, reason: "the light floods up over the clash" }); } }
// voice lines
for (const sh of SHOTS) for (const L of sh.say || []) { const b = beats.find((x) => x.name === sh.name);
  if (!b.do.some((x) => x.do === "noblink")) for (const w of ["teo", "ryn"]) beats[0].do.push({ who: w, do: "noblink", at: 0 });
  b.do.push({ macro: "say", who: L.who === "A" ? "teo" : "ryn", line: L.line, tone: L.tone, ...(L.style ? { style: L.style } : {}), ...(L.take ? { take: L.take } : {}), at: L.at, pos: "top" }); }

// faces: each shot's face per fighter, keyed at its start (eased in over 0.2 s)
const faces = { A: [], B: [] };
for (const sh of SHOTS) for (const who of ["A", "B"]) if (sh.face?.[who]) faces[who].push([R(sh.t0), sh.face[who]]);
for (const who of ["A", "B"]) if (!faces[who].length) faces[who].push([0, ANGRY]);
// fingers: fists to fight, open palms to turn fire and to gather a ball; Ryn's blade hand: two fingers out
const hands = { A: [[0, 0.95, 0.95]], B: [[0, 0.95, 0.95]] };
for (const who of ["A", "B"]) {
  const spans = []; for (const sh of SHOTS) if (sh.open?.includes(who)) { const l = spans.at(-1); if (l && Math.abs(l[1] - sh.t0) < 1e-6) l[1] = sh.t1; else spans.push([sh.t0, sh.t1]); }
  for (const [a, b] of spans) hands[who].push([R(Math.max(0, a - 0.12)), 0.95, 0.95], [R(a + 0.05), 0.2, 0.2], ...(b < END - 0.01 ? [[R(b - 0.05), 0.2, 0.2], [R(b + 0.1), 0.95, 0.95]] : []));
  hands[who].sort((x, y) => x[0] - y[0]);
}
const LINES = SHOTS.flatMap((sh) => (sh.say || []).map((L) => ({ t: sh.t0 + L.at })));
const cast = (id, who, look) => ({ id, character: look, at: list[who][0].place, face: ANGRY, faces: faces[who], seed: who === "A" ? 1.3 : 2.1, perform: list[who],
  fingers: hands[who], noBlink: LINES.map((L) => [R(L.t), R(L.t + 1.6)]), diagPalms: process.env.DIAG === who, diagFeet: process.env.DIAG === who });
const vis = beats.map((b) => { const sh = SHOTS.find((s) => s.name === b.name), c = sh.cam;
  const see = c.frame ? [] : c.close ? [`${c.close === "A" ? "teo" : "ryn"}.face`] : c.on ? [c.on === "A" ? "teo" : "ryn"] : ["teo", "ryn"];
  return see.length ? { from: R(b.at + 0.08), to: R(b.at + b.len - 0.04), see, why: c.close ? `the close-up on ${c.close === "A" ? "Teo" : "Ryn"}'s face` : `the fighters in the ${b.name} shot` } : null; }).filter(Boolean);
const titles = { street: "Firebender duel 01: the street", alley: "Firebender duel 01: the back street", roof: "Firebender duel 01: the rooftop" };
const sb = {
  id: ID,
  title: titles[ACT],
  idea: "Two rival firebenders, Teo and Ryn, face off on a city street at golden hour, fight down a back street at dusk and end on a rooftop at sunset where their two streams of fire meet in a ball neither can push through",
  fps: FPS, look: "anime-pro", profile: "short", loop: false,
  castLook: "sheet",
  rig: { hand: 2, eyes: 2, hold: 2 },
  physics: true,
  motionBlur: false,
  set: { type: "env", env: P0.env, aperture: 0, focus: false, lighting: 2, hatch: { boil: 0.25 }, ...(P0.life ? { life: "auto" } : {}) },
  music: false,
  sound: { sfx: 0.6, ambience: 0.3, surface: P0.surface, room: ACT === "alley" ? "street" : "open", guard: true, speech: true },
  creative: { notes: false },
  cast: [cast("teo", "A", "human/teo"), cast("ryn", "B", "human/ryn")],
  props,
  beats,
  fx,
  hitStop,
  visible: vis,
  allowClip: SHOTS.flatMap((sh) => ["A", "B"].filter((w) => sh[w].slide).map((w) => ({ who: [w === "A" ? "teo" : "ryn"], from: R(sh.t0 + sh[w].slide.at), to: R(sh.t0 + sh[w].slide.at + sh[w].slide.dur + 0.1), checks: ["foot-slide"], reason: "the guard is blasted back and skids over the ground on planted feet (anime defence: the slide shows the hit's force)" }))),
  captions: [], captionStyle: "kinetic",
  duration: END,
  credits: "Character base: VRoid Studio sample model (CC0). Motion: CMU Graphics Lab Motion Capture Database, mocap.cs.cmu.edu (funded by NSF EIA-0196217).",
  notes: `Generated by tools/human/make-duel-01.mjs ${ACT}.`,
};
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(`${OUT}/${ID}.json`, JSON.stringify(sb, null, 1));
console.log(ACT, "END", END, SHOTS.map((s) => `${s.name} ${R(s.t0, 2)}`).join("  "), "blasts", blasts.length, Object.values(MEAS).some(Boolean) ? "(measured)" : "(recorded)");
console.log("arrive", marks.arrive.map((m) => `${m.sh}:${m.who}@${m.at}`).join(" "));
