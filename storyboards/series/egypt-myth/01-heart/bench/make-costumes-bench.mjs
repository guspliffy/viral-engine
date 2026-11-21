// Egypt myth 01 costume bench (task T5, 20 Nov 2026): costume `jackal` (engine/page/costumes-jackal.js, characters/egypt-myth/jackal.json) and
// costume `assessor` (engine/page/costumes-assessor.js, assessor-a/b/c.json). Not a clip, no story. Stills, one per beat (1.2 s each, the still is 0.9 s in):
//   jfront   jackal front            j34     jackal 3/4 (turn 35)         jprof   jackal profile (turn 90)         jback   jackal from behind (turn 160)
//   jhead    close on the head, front   jhead2  close on the head, 3/4      jopen   close, jaw open (the rig's mouth open 0.9: the lower jaw 11 degrees)
//   jpass    left arm 60 degrees above level, 0.35 forward, palm flat to the cast ("Pass.")
//   jnext    body turned 35 degrees, left arm straight and level, one finger out ("Next.")
//   jpillar  right hand flat at pillar height (world y 0.95, hand 0.62 to the right: the pillar's surface; a prop stands in for it)
//   afront   the 3 assessors side by side 1.2 m apart (a: height 0.85 lean 5, b: 0.88 lean 10, c: 0.91 lean 15), stern, from 13 m (the frame is 9:16: 3.6 m wide needs it);
//   aA aB aC each one front, close
//   a3q      the 3 from the side (turn 40)    aback   from behind (turn 170)
//   ahead    close on the headband + feather, assessor b, 3/4 and front
//   aseat    assessor on a box at stool height (0.42), body 25 degrees forward, one hand on the knee (panel 08), from the front and the side
//   node storyboards/series/egypt-myth/01-heart/bench/make-costumes-bench.mjs
//   flock /tmp/claude-0/render.lock node engine/render.mjs storyboards/series/egypt-myth/01-heart/bench/costumes-bench.json --stills <times printed> --draft --safe --out /tmp/claude-0/bench-costumes
//   node qa/contact.mjs /tmp/claude-0/bench-costumes/costumes-bench-*.png --out storyboards/series/egypt-myth/01-heart/bench/costumes-sheet.png
import { clip, write } from "../../../../lib/clip.mjs";

const c = clip(), { A } = c;
const JX = -6, AX = [-1.2, 0, 1.2], SX = 4.2;
const shots = [];
let T = 0;
const beat = (name, cam, acts = () => {}) => { acts(T); shots.push([name, T, cam]); T += 1.2; };
const cam = (x, y, z, lx, ly, lz, fov) => ({ pos: [x, y, z], look: [lx, ly, lz], fov });

// everyone starts at rest, still blinking off for the stills
const WHO = ["jackal", "asra", "asrb", "asrc", "asrs"];
A(0, "asrs", "sit", { seat: "box", height: 0.42, dur: 0.01, hands: "lap" });   // seated from the first frame (the box is in the cast from 0)
for (const w of WHO) { A(0, w, "noblink"); c.arm(0, w, "R", "rest", 0.01); c.arm(0, w, "L", "rest", 0.01); }

beat("jfront", cam(JX, 0.88, 3.8, JX, 0.82, 0, 28));
beat("j34", cam(JX, 0.88, 3.8, JX, 0.82, 0, 28), (t) => A(t, "jackal", "turn", { to: 35, dur: 0.2 }));
beat("jprof", cam(JX, 0.88, 3.8, JX, 0.82, 0, 28), (t) => A(t, "jackal", "turn", { to: 90, dur: 0.2 }));
beat("jback", cam(JX, 0.88, 3.8, JX, 0.82, 0, 28), (t) => A(t, "jackal", "turn", { to: 160, dur: 0.2 }));
beat("jhead", cam(JX, 0.8, 2.3, JX, 0.76, 0, 24), (t) => A(t, "jackal", "turn", { to: 0, dur: 0.2 }));
beat("jhead2", cam(JX, 0.8, 2.3, JX, 0.76, 0, 24), (t) => A(t, "jackal", "turn", { to: 40, dur: 0.2 }));
beat("jopen", cam(JX + 0.15, 0.8, 2.3, JX, 0.75, 0, 24), (t) => { A(t, "jackal", "turn", { to: 25, dur: 0.01 }); A(t, "jackal", "expr", { expr: "shocked", set: { open: 0.9 }, dur: 0.1 }); });
beat("jpass", cam(JX + 0.2, 0.9, 4.0, JX + 0.2, 0.85, 0, 28), (t) => {
  A(t, "jackal", "expr", { expr: "kind", dur: 0.1 }); A(t, "jackal", "turn", { to: 0, dur: 0.2 });
  c.arm(t, "jackal", "L", { x: [0.5, 0.66, 0.35] }, 0.3); A(t, "jackal", "grip", { side: "L", shape: "flat", dur: 0.2 });
});
beat("jnext", cam(JX, 0.9, 4.0, JX, 0.85, 0, 28), (t) => {
  A(t, "jackal", "turn", { to: 25, dur: 0.3 }); c.arm(t, "jackal", "L", { x: [0.66, 0.5, 0.05] }, 0.3); A(t, "jackal", "grip", { side: "L", shape: "point", dur: 0.2 });
});
beat("jpillar", cam(JX, 0.9, 4.0, JX, 0.85, 0, 28), (t) => {
  A(t, "jackal", "turn", { to: 0, dur: 0.2 }); c.arm(t, "jackal", "L", "rest", 0.2); A(t, "jackal", "grip", { side: "L", shape: "open", dur: 0.2 });
  c.arm(t, "jackal", "R", { x: [-0.62, 0.64, 0.25] }, 0.3); A(t, "jackal", "grip", { side: "R", shape: "flat", dur: 0.2 });
});
beat("afront", cam(0, 0.5, 13, 0, 0.5, 0, 28));
beat("aA", cam(AX[0], 0.65, 4.4, AX[0], 0.62, 0, 26));
beat("aB", cam(AX[1], 0.65, 4.4, AX[1], 0.62, 0, 26));
beat("aC", cam(AX[2], 0.65, 4.4, AX[2], 0.62, 0, 26));
beat("a3q", cam(0, 0.5, 13, 0, 0.5, 0, 28), (t) => { for (const w of ["asra", "asrb", "asrc"]) A(t, w, "turn", { to: 40, dur: 0.2 }); });
beat("aback", cam(0, 0.5, 13, 0, 0.5, 0, 28), (t) => { for (const w of ["asra", "asrb", "asrc"]) A(t, w, "turn", { to: 170, dur: 0.2 }); });
beat("ahead", cam(0.0, 1.2, 2.4, 0, 1.18, 0, 24), (t) => { for (const w of ["asra", "asrb", "asrc"]) A(t, w, "turn", { to: 0, dur: 0.2 }); });
beat("ahead2", cam(0.0, 1.2, 2.4, 0, 1.18, 0, 24), (t) => { A(t, "asrb", "turn", { to: 50, dur: 0.2 }); });
beat("aseat", cam(SX, 0.9, 5.0, SX, 0.85, 0, 28), (t) => {
  A(t, "asrs", "lean", { to: 25, dur: 0.3 });
});
beat("aseat2", cam(SX + 5.0, 0.9, 0, SX, 0.85, 0, 28), (t) => { A(t, "asrs", "turn", { to: 90, dur: 0.01 }); });
const END = T + 1.2;
const stills = shots.map(([n, t]) => Math.round((t + 0.9) * 100) / 100);
console.log("stills:", stills.join(","));
write(import.meta.url, {
  id: "costumes-bench", title: "Egypt myth 01 costumes bench", idea: "Bench for the jackal and assessor costumes (task T5), not a clip",
  fps: 30, look: "anime-pro", profile: "short", loop: false, castLook: "sheet", physics: false,
  set: { type: "plain", color: "#7e8799", floor: "#555a66", para: 0, aperture: 0, lighting: 2, hatch: { boil: 0.25 }, cel: { at: 0.25 }, satsuei: true },
  music: false, sound: { auto: false },
  hook: { show: ["jackal"], hint: 0, what: "engine test" },
  cast: [
    { id: "jackal", character: "egypt-myth/jackal", at: [JX, 0], face: 0, expr: "kind", follow: 0.2, seed: 1.3 },
    { id: "asra", character: "egypt-myth/assessor-a", at: [AX[0], 0], face: 0, expr: "stern", follow: 0.2, seed: 2.6 },
    { id: "asrb", character: "egypt-myth/assessor-b", at: [AX[1], 0], face: 0, expr: "stern", follow: 0.2, seed: 3.9 },
    { id: "asrc", character: "egypt-myth/assessor-c", at: [AX[2], 0], face: 0, expr: "stern", follow: 0.2, seed: 4.8 },
    { id: "asrs", character: "egypt-myth/assessor-b", at: [SX, 0], face: 0, expr: "stern", follow: 0.2, seed: 5.7 },
  ],
  props: [{ id: "box", kind: "woodcounter", x: SX, y: 0, z: 0, w: 0.6, h: 0.42, d: 0.5 }],
  captions: c.captions,
  beats: c.beats(shots, END),
  notes: "Generated by storyboards/series/egypt-myth/01-heart/bench/make-costumes-bench.mjs (costume bench, no story).",
});
