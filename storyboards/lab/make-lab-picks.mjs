// LAB PICKS before/after: the quality lab's 3-second scene (branch quality-lab-01, storyboards/lab/make-quality-lab.mjs)
// as it was ("before", today's defaults) and with the four looks Jonny picked on 30 Oct ("after"): a gibberish line in
// the first half second (act.opener), depth of field with focus on who acts (set.focus), comic force with an impact
// frame and a 3-frame hit-stop (act.windUp / act.impact / act.landDust), and stronger faces held longer
// (clip({ faces: "strong" }), act.mood / act.sheepish). Pure engine test, not for posting.
//
//   node storyboards/lab/make-lab-picks.mjs   -> storyboards/lab/picks-before.json, picks-after.json
//
// The scene: Phoenix shows off with a flame-wing flare, the flare singes Reaper beside him, Reaper's slow glare and
// Phoenix's sheepish grin. Both are drawn without motion blur (today's default from PR #57).
import { clip, write } from "../lib/clip.mjs";
import { aim } from "../lib/camera.mjs";
import * as act from "../lib/acting.mjs";

const END = 3.0, T_HIT = 0.42;
const PHX = [-0.44, 0.22], REA = [0.48, 0.12];
const PHX_AT_REA = [0.75, 0.0], PHX_AT_CAM = [0, 0], REA_AT_PHX = [-0.8, 0.0];
const SHOT = aim([0.0, 0.78, 0.2], { az: 0, el: 8, h: 3.0, fov: 30, push: 0.05, dur: END });

function scene(picks) {
  const c = clip({ faces: picks ? "strong" : "normal" }), { A } = c;
  // ------------------------------------------------ the action: Phoenix's flare (frame 0 is already the crouch)
  A(0, "phx", "noblink"); A(0, "rea", "noblink");
  A(0, "phx", "look", { to: PHX_AT_CAM, dur: 0, blink: false });
  A(0, "rea", "look", { to: REA_AT_PHX, dur: 0, blink: false });
  A(0, "rea", "expr", { expr: "deadpan", dur: 0 });
  A(0, "rea", "still", { dur: T_HIT, idle: 0.1 });
  A(0, "phx", "expr", { expr: "cocky", dur: 0.1 });
  if (picks) act.windUp(c, 0, "phx"); else A(0, "phx", "squash", { amount: 0.14, dur: 0.25 });
  A(0.2, "phx", "arm", { side: "both", pose: "up", dur: picks ? 0.16 : 0.25, ease: picks ? "anticSettle" : "settle" });
  A(0.2, "phx", "hop", { height: picks ? 0.16 : 0.06, dur: picks ? 0.32 : 0.25 });
  A(0.12, "phx", "span", { to: 1, dur: 0.12 });
  A(0.24, "phx", "wings", { to: 1, dur: picks ? 0.12 : 0.2, ease: picks ? "anticSettle" : "out" });
  A(0.8, "phx", "arm", { side: "both", pose: "hips", dur: 0.3, ease: "settle" });
  A(0.85, "phx", "squash", { amount: picks ? 0.08 : 0.05, dur: 0.2 });
  // the flame reaches Reaper: a puff of fire at his sprout
  c.at(T_HIT - 0.02, { fx: "poof", pos: [REA[0] - 0.06, 0.72, REA[1] + 0.05], dur: 0.6, color: "#ffb36b", spark: "#ffd23f", puffs: picks ? 12 : 7, sparks: picks ? 22 : 12 });
  c.sfx(T_HIT - 0.02, "poof", { gain: 0.8 });
  // ------------------------------------------------ Reaper takes the hit
  if (picks) {
    act.impact(c, T_HIT, "rea");
    act.landDust(c, 0.95, PHX);
  } else c.macro(T_HIT, "rea", "hit", { hat: false, look: [0, 0.35], recoil: -5, expr: "shocked", hold: 0.35, set: { eye: 1.25, open: 0.5, curve: -0.5 } });
  A(T_HIT + 0.08, "rea", "droop", { to: 1, dur: 0.35 });
  // ------------------------------------------------ the reaction: Reaper's slow glare, Phoenix's sheepish grin
  const tG = picks ? 1.25 : 1.05;   // strong faces hold the shocked face longer
  A(tG, "rea", "look", { to: REA_AT_PHX, dur: picks ? 0.45 : 0.35, blink: false });
  act.mood(c, tG + 0.25, "rea", "annoyed", { hold: END - tG - 0.35 - (picks ? 0.2 : 0) });
  A(1.0, "phx", "look", { to: PHX_AT_REA, dur: 0.2, blink: false });
  const tS = picks ? 1.55 : 1.35;
  act.sheepish(c, tS, "phx");
  A(tS + 0.1, "phx", "wings", { to: 0.25, dur: 0.5, ease: "inOut" });
  A(tS + 0.1, "phx", "arm", { side: "both", pose: "rest", dur: 0.45, ease: "inOut" });
  A(tS + 0.15, "phx", "still", { dur: END - tS - 0.2, idle: 0.08 });
  if (!picks) A(2.45, "phx", "look", { to: [-0.35, -0.25], dur: 0.2, blink: false });   // he looks away (the stronger face holds on Reaper)
  // ------------------------------------------------ hook caption, and the opener line in the first half second
  if (picks) act.opener(c, "phx", "watch this!");
  c.cap(0, 1.7, "When your friend says “watch this”", 250);
  return c;
}

for (const [id, picks] of [["before", false], ["after", true]]) {
  const c = scene(picks);
  const beats = c.beats([["the flare", 0, SHOT, "hook"], ["singed", 0.4, null, "payoff"], ["the glare", 1.05, null, "reaction"]], END);
  write(import.meta.url, {
    id: `picks-${id}`, title: `Lab picks: ${id}`,
    idea: "Quality lab 01 scene: Phoenix's flame-wing flare singes Reaper, Reaper glares, Phoenix grins sheepishly",
    fps: 30, look: "anime-pro", profile: "short", loop: false, captionStyle: "kinetic",
    creative: { length: [2, 4], loop: false },
    set: { type: "plain", color: "#efe2c8", floor: "#c9a27a", light: "golden", para: 0, bloom: "emissive",
      plate: { src: "assets/plates/livingroom-golden.png", z: -2.3, center: [0.3, 1.7], height: 6.4 },
      aperture: picks ? 0.045 : 0, ...(picks && { focus: "acting" }) },
    music: { file: "ai/hero-bed/hero-bed-01.ogg", gain: 0.45 },
    sound: { sfx: 0.7, ambience: 0.3, surface: "carpet", signature: false, speech: false },
    hook: { show: ["phx", "rea"], hint: 0.2, what: "Phoenix winds up a flame-wing flare right next to deadpan Reaper" },
    cast: [
      { id: "phx", character: "duo/phoenix", at: PHX, face: 24, expr: "cocky", span: 0, follow: 0.3, seed: 1.7 },
      { id: "rea", character: "lookdev/reaper-crisp", at: REA, face: -26, expr: "deadpan", follow: 0.25, seed: 4.1 },
    ],
    props: [], captions: c.captions, beats, ...(c.hitStops.length && { hitStop: c.hitStops }),
    notes: "Generated by storyboards/lab/make-lab-picks.mjs (lab picks before/after, engine test, not for posting).",
  });
}
