// EGYPT EP04 "Sixty tonnes. For one cow." (Serapeum of Saqqara, 66 s): Spud asks, the mummy Pharaoh answers with real facts,
// the pictures behind him show the aliens doing the work. Story + panels: /mnt/project-files/videos/ancient-aliens/04-egypt/STORY.md
// (24 panels on egypt-04-sheet-1/2.png), facts: RESEARCH.md, design: DESIGN.md here (GPT-6.2 Sol; its section 8 dialogue is NOT used,
// lines.mjs is). The light of the cast is one value per storyboard, so the episode is SEVEN segment storyboards cut together on
// story time (tunnel / Memphis day / tunnel / quarry day / Nile sunset / Saqqara day / tunnel), each with its slice of the one score.
//   node storyboards/series/ancient-aliens/04-serapeum/measure-lines.mjs      -> lines.json (spoken lengths)
//   node storyboards/series/ancient-aliens/04-serapeum/make-serapeum.mjs      -> eg04-<seg>-tall.json (+ --wide)
import { clip, write, r3 } from "../../../lib/clip.mjs";
import { existsSync, readFileSync } from "node:fs";
import { host, lampClip } from "../kit/aa-kit.mjs";
import { LINES } from "./lines.mjs";
import { VOICE } from "./voice.mjs";

const MEASURED = new URL("./lines.json", import.meta.url);
const DUR = existsSync(MEASURED) ? JSON.parse(readFileSync(MEASURED, "utf8")) : Object.fromEntries(Object.entries(LINES).map(([k, l]) => [k, r3(0.3 + l[1].split(/\s+/).length * 0.36)]));
const MOTION = { feet: 2, overlap: true, timing: true, solve: true }, RIG = { hand: 2, eyes: 2, hold: 2 };
const CAST = {
  spud: "potatobrawl/spud", pharaoh: "ancient-aliens/pharaoh", priest: "ancient-aliens/priest", priestL: "ancient-aliens/priest-leopard",
  wa: "ancient-aliens/worker-a", wb: "ancient-aliens/worker-b", crew: "ancient-aliens/alien-crew", foreman: "ancient-aliens/alien-foreman",
};
// tall = TikTok / Reels / Shorts (the first cut), wide = YouTube. Captions in the upper third, numbers under them, the counter top left.
const FRAME = {
  tall: { key: "tall", sb: { far: 300 }, W: 1080, H: 1920, SUB: 400, subSize: 62, NUM: 265, numSize: 120, tag: { y: 240, x: 250, size: 44 } },
  wide: { key: "wide", sb: { frame: "wide", far: 300 }, W: 1920, H: 1080, SUB: 150, subSize: 54, NUM: 290, numSize: 110, tag: { y: 60, x: 230, size: 40 } },
};
// ---- the light of the cast (one per storyboard)
const keyOf = ([az, el]) => { const a = az * Math.PI / 180, e = el * Math.PI / 180; return [r3(-Math.sin(a) * Math.cos(e) * 10), r3(Math.sin(e) * 10), r3(-Math.cos(a) * Math.cos(e) * 10)]; };
// floor "none": every place here brings its own floor at y 0; the plain set's "shadow" floor puts an invisible depth mask at
// y 0 too, and the two fight frame by frame (draft 2: the ground flickered blue in every scene, Jonny 18 Nov + Sol)
const light = (color, sun, o) => ({ type: "plain", color, floor: "none", lighting: { v: 2, measure: false, ao: 0, key: keyOf(sun), ...o } });
const TUNNEL = light("#0e1520", [200, 35], { light: "#ffc27a", shadow: "#26304a", exposure: 0.82 });
const DAY = light("#88bbe3", [40, 51], { light: "#fff4dc", shadow: "#7f8fc0", exposure: 1.0 });
const SUNSET = light("#eb9775", [190, 6], { light: "#ffb070", shadow: "#5a4a7a", exposure: 0.92 });
const score = (storyTime) => ({ file: "ancient-aliens/aa04-score.ogg", from: 0, skip: storyTime, gain: 0.6, lowCut: 90, dip: false, duck: { voice: -6 }, mood: "dramatic" });

// ---- the Serapeum (props-eg-serapeum.js): bay i at z -4.4 i, aisle x +-0.825, chambers right (+x) and left; R0 and R4 hold their own boxes
const BAY = (i) => r3(-4.4 * i);
const LAMPS = [];
for (let i = 0; i < 8; i++) {
  LAMPS.push({ id: `lampL${i}`, kind: "oillamp", x: -0.91, y: 1.4, z: r3(BAY(i) + 1.6), rot: 90 });
  LAMPS.push({ id: `lampR${i}`, kind: "oillamp", x: 0.91, y: 1.4, z: i === 0 ? 2.04 : r3(BAY(i) + 1.6), rot: -90 });
}
const gallery = (o = {}) => ({ id: "gallery", kind: "gallery", x: 0, z: 0, lids: "q", omit: ["R0", "R4"], foot: ["R0", "R4"], staged: "the room itself (its own floor at y 0); the set floor is off so it cannot z-fight it", ...o });
const box = (id, bay, o = {}) => ({ id, kind: "granitebox", x: 1.55, y: -0.18, z: BAY(bay), rot: -90, lidSlide: 0, ...o });

// ---- one segment: its own clip, its times written in story seconds (t0 = the segment's first frame)
function segment(F, t0, t1, fill, story) {   // story = where the segment starts in the cut (its music slice); times inside are design times
  const c = clip({ faces: "strong" }), T = (t) => r3(t - t0);
  const S = {
    c, F, T, END: r3(t1 - t0),
    A: (t, who, what, o) => c.at(T(t), { who, do: what, ...o }),
    place(t, who, xz, yaw, y = 0) { S.A(t - 0.02, who, "move", { to: xz, y, dur: 0.01, steps: 0, ease: "linear", sync: true }); S.A(t - 0.02, who, "turn", { to: yaw, dur: 0.01, ease: "linear", sync: true }); },
    walk: (t, who, xz, dur, o = {}) => S.A(t, who, "move", { to: xz, dur, ...o }),
    turn: (t, who, yaw, dur = 0.4) => S.A(t, who, "turn", { to: yaw, dur, ease: "inOut" }),
    look: (t, who, to, dur = 0.2) => S.A(t, who, "look", { to, dur, blink: false }),
    expr: (t, who, e, set, dur = 0.15) => S.A(t, who, "expr", { expr: e, ...(set && { set }), dur }),
    arm: (t, who, side, pose, dur = 0.35, ease = "inOut") => c.arm(T(t), who, side, pose, dur, ease),
    prop: (t, id, set, dur = 0.01, ease = "linear") => c.prop(T(t), id, set, dur, ease),
    sfx: (t, s, o = {}) => c.sfx(T(t), s, o),
    // a spoken line: the say macro in the speaker's voice + its subtitle in the upper third; hold = how long the subtitle stays after the voice
    say(t, k, next) {
      const [who, line, tone, take] = LINES[k], d = DUR[k], hold = next == null ? 0.4 : Math.max(0, Math.min(0.4, r3(next - t - d - 0.05)));
      c.at(T(t), { macro: "say", who, line, tone, dur: d, voice: VOICE[who], caption: false, ...(take && { take }) });
      c.cap(T(t), T(t + d + hold), line, F.SUB, false, { size: F.subSize, kinetic: false });
      return r3(t + d);
    },
    num: (a, b, text, { y = F.NUM, ...o } = {}) => c.cap(T(a), T(b), text, y, false, { size: F.numSize, kinetic: false, ...o }),
    tag: (a, b, text) => c.cap(T(a), T(b), text, F.tag.y, false, { style: "label", size: F.tag.size, kinetic: false, x: F.tag.x }),
    shots: [],
    shot(name, t, cam, kind) { S.shots.push([name, T(t), cam, kind]); },
  };
  const o = fill(S);
  const beats = c.beats(S.shots, S.END);
  return { ...o, fps: 30, look: "anime-pro", profile: "short", loop: false, captionStyle: "kinetic", castLook: "sheet", cleanStart: true,
    motion: MOTION, rig: RIG, physics: false, loopIdle: false, music: score(story), captions: c.captions, beats, visible: c.visible };
}
// the gallery is the room (floor, walls, vault as one prop): its clipping and shell checks are off for the cast; hand and costume checks stay on
const room = (ids, end) => ids.map((who) => ({ who, with: "gallery", from: 0, to: end, checks: ["clipping", "shell"], reason: "the gallery is the room they stand in; chamber floors sit at -0.18" }));
// arm targets ({ o: [out, up, fwd] }, mirrored per side)
const TOUCH = { o: [0.1, 0.2, 0.5] }, PUSHF = { o: [0.16, 0.36, 0.42] }, PANEL = { o: [0.08, 0.3, 0.4] }, JAR = { o: [0.1, 0.28, 0.36] }, MOUTH = { o: [-0.18, 0.44, 0.46] }, PUSHN = { o: [0.05, 0.36, 0.42] }, SPREAD = { o: [0.5, 0.3, 0.22] };
// the box's own grips (props-eg-serapeum.js: brace = left hand on the rim, tipA -> tipB = the fingertip's track along the
// polished inner wall, padL/padR = hands on the lid edge; the pads follow lidSlide)
const G = { brace: [-0.16, 1.48, 0.6325], tipA: [-0.18, 1.405, 0.465], tipB: [0.34, 1.405, 0.465], padL: [-0.17, 1.585, 0.6325], padR: [0.17, 1.585, 0.6325] };
const LIPS = { o: [-0.37, 0.4, 0.56], frame: { y: [0.1, 1, 0.1], z: [0.35, 0, -1], elbow: 1 } };   // a hand to the mouth (the Plato bench)
const cam = (pos, look, fov, to, dur, ease = "inOut") => ({ pos, look, fov, ...(to && { to, dur, ease }) });
const tv = (F, w, t) => (F.key === "tall" ? t : w);

// ================================================================= 0. SAQQARA TODAY 0-3.9 (draft 2, Jonny 18 Nov: "expect that the viewer knows nothing")
// a crane from the step pyramid down to the cliff and the tunnel mouth; Spud walks in: "Egypt. Under this desert lies a secret tunnel."
const seg0 = (F) => segment(F, 0, 3.9, (S) => {
  const cast = [{ id: "spud", character: CAST.spud, at: [2.0, 4.0], face: 212, expr: "neutral", follow: 0.2, seed: 4.1 }];
  const props = [{ id: "sky", kind: "aasky", time: "day" }, { id: "desert", kind: "saqqara", x: 0, z: 0, mouth: true, staged: "the ground itself (desert slab and cliff)" },
    { id: "djoser", kind: "djoser", x: -48, y: 2.6, z: -40, rot: 14, staged: "stands on a far rise behind the cliff (DESIGN.md), 60 m away" }, host("spud", 1)];
  S.look(0, "spud", [0, 0.1], 0.01);
  S.walk(0.1, "spud", [0.4, 1.4], 3.6, { ease: "linear" });
  S.say(0.15, "n01", 3.9);
  S.c.cap(S.T(0.3), S.T(3.9), "SAQQARA, EGYPT", S.F.tag.y, false, { style: "label", size: S.F.tag.size, kinetic: false, x: S.F.W / 2 });   // the place, centred (the left tag spot is too narrow)
  S.shot("00 Saqqara", 0, cam([6.9, 6.0, 5.8], [-6, 3.0, -5], tv(S.F, 46, 60), { pos: [3.4, 2.1, 4.6], look: [0, 1.1, 0] }, 3.9), "hook");
  return { id: `eg04-0-${S.F.key}`, title: "Sixty tonnes (0: Saqqara)", idea: "seg 0 of 7", set: DAY, cast, props,
    sound: { signature: false, sfx: 0.6, ambience: 0.06, surface: "sand", room: "open", guard: true },
    hook: { show: ["spud"], hint: 0, what: "the step pyramid, a desert cliff with a dark tunnel mouth; Spud walks toward it" },
    allowClip: [...lampClip(["spud"], S.END)],
    notes: "Generated by make-serapeum.mjs, segment 0 (story 0-3.9)." };
}, 0);

// ================================================================= 1. TUNNEL 0-8: the box, the corridor, the Pharaoh steps out
const seg1 = (F) => segment(F, 0, 13.9, (S) => {
  const cast = [
    { id: "spud", character: CAST.spud, at: [0.2, 0.37], face: 90, expr: "neutral", follow: 0.2, seed: 4.1 },
    { id: "pharaoh", character: CAST.pharaoh, at: [-1.55, -4.4], y: -0.18, face: 70, expr: "neutral", seed: 7.3 },
  ];
  const props = [gallery({ omit: ["R0", "R4", "L1"] }), box("boxR0", 0, { reflect: true }), box("boxR4", 4, { lidSlide: 0.324111 }), ...LAMPS, host("spud", 1)];
  // 01 (0-4): his lamp on a box the size of a van: "Inside: twenty-four stone boxes. Sixty tonnes each."
  S.look(0, "spud", [0.1, 0.45], 0.01); S.expr(0, "spud", "neutral", { brow: 0.7, lid: 0.2 }, 0.01);
  S.say(0.15, "s01a", 4.0);
  S.num(2.2, 4.0, "60 t", { y: tv(S.F, 250, S.F.NUM) });   // over Spud's head (camfit: only 210 is free in the tall frame, 265 = inside the safe zone)
  S.shot("01 the box", 0, cam([-0.75, 1.3, 2.2], [1.05, 0.78, -0.1], tv(S.F, 42, 56), { pos: [-0.65, 1.27, 1.95] }, 4.0));   // Spud whole on the left (Sol: a sliver at the edge)
  // 02 (4-6.8): the corridor, a box in every chamber; the counter runs to 24: "All that... for one dead cow?"
  S.place(4.0, "spud", [-0.2, 0.93], 180);
  S.look(4.05, "spud", [0, 0.1], 0.15); S.walk(4.2, "spud", [-0.2, 0.3], 1.6);
  for (let i = 1; i <= 24; i++) S.tag(r3(4.0 + (i - 1) * 0.06), i === 24 ? 6.8 : r3(4.0 + i * 0.06), `BOX ${i}/24`);
  S.say(4.2, "s01b", 6.8);
  S.shot("02 twenty-four boxes", 4.0, cam([0.22, 1.3, -3.4], [-0.2, 0.85, 0.7], tv(S.F, 44, 58), { pos: [0.2, 1.28, -3.0] }, 2.8));   // ahead of him: his face on the question (Sol), boxes both sides
  // 03 (6.8-13.9): out of a dark chamber, dust falling from his wraps: "Not a cow. The holy bull Apis." "To us, he was a god."
  S.place(6.8, "spud", [-0.4, -2.2], 180); S.look(6.8, "spud", [-0.1, 0.1], 0.01);
  S.look(6.72, "pharaoh", [0.5, 0], 0.15); S.walk(6.85, "pharaoh", [0.05, -3.75], 1.1, { y: 0 });
  S.turn(6.9, "pharaoh", 20, 0.8);
  S.A(7.1, "spud", "move", { to: [-0.42, -1.95], dur: 0.35, ease: "out" }); S.expr(7.05, "spud", "surprised", { open: 0.3 }, 0.12);
  S.turn(7.9, "pharaoh", 345, 0.5); S.look(7.2, "pharaoh", [0, 0.05], 0.3);   // to Spud (Sol: he answered the camera)
  S.expr(7.8, "pharaoh", "neutral", null, 0.2);
  S.say(7.6, "p03", 11.75); S.say(11.75, "p03b", 13.9);
  S.A(7.6, "pharaoh", "noblink", { dur: 6.2 }); S.A(0.02, "spud", "noblink", { dur: 6.7 }); S.A(6.5, "pharaoh", "noblink", { dur: 0.3 });
  S.sfx(6.9, "step-concrete", { gain: 0.25, dur: 1.1, reason: "his wrapped feet on the stone" });
  S.shot("03 the Pharaoh", 6.8, cam([0.75, 1.05, -0.6], [-0.12, 0.78, -3.1], tv(S.F, 50, 70), { pos: [0.68, 1.03, -0.9] }, 7.1));
  return { id: `eg04-1-${S.F.key}`, title: "Sixty tonnes (1: the box)", idea: "seg 1 of 7", set: TUNNEL, cast, props,
    sound: { signature: false, sfx: 0.6, ambience: 0.05, surface: "stone", room: "open", guard: true },
    hook: { show: ["spud"], hint: 0, what: "Spud's lamp on a giant black granite box in a dark tunnel; 60 t on screen" },
    allowClip: [...lampClip(["spud"], S.END), { who: "spud", with: "gallery", from: 0, to: S.END, checks: ["clipping", "shell"], reason: "the gallery is the room he stands in (floor, walls, vault as one prop); hand and costume checks stay on" },
      { who: "pharaoh", with: "gallery", from: 0, to: S.END, checks: ["clipping", "shell"], reason: "the gallery is the room; he steps up out of the side chamber (floor -0.18) into the aisle" }],
    notes: "Generated by make-serapeum.mjs, segment 1 (story 3.9-17.8)." };
}, 3.9);

// ================================================================= 2. MEMPHIS 8-12: the dead god-bull; 70 days
const seg2 = (F) => segment(F, 8, 13, (S) => {
  const cast = [
    { id: "pr1", character: CAST.priest, at: [-1.6, 0.3], face: 90, expr: "sad", seed: 1.1 },   // in front of and beside the bier (Sol: none were in frame)
    { id: "pr2", character: CAST.priest, at: [-0.85, 1.0], face: 150, expr: "sad", seed: 1.7 },
    { id: "pr3", character: CAST.priest, at: [0.85, 1.0], face: 210, expr: "sad", seed: 2.3 },
    { id: "pr4", character: CAST.priestL, at: [1.6, 0.3], face: 270, expr: "sad", seed: 2.9 },
    { id: "pharaoh", character: CAST.pharaoh, at: [0, 30], face: 0, expr: "neutral", seed: 7.3 },   // off camera: his voice over the flashback
  ];
  const props = [{ id: "sky", kind: "aasky", time: "day" }, { id: "court", kind: "memphiscourt", x: 0, z: 0, palms: true }, { id: "bier", kind: "apisbier", x: 0, z: 0 }];
  for (const p of ["pr1", "pr2", "pr3", "pr4"]) S.look(8, p, [0, -0.45], 0.01);
  S.say(8.2, "p04", 13.0);
  S.num(10.2, 13.0, "70 DAYS");
  S.shot("04 Memphis: Apis is dead", 8, cam([-0.4, 1.6, 4.9], [0, 0.7, 0.3], tv(S.F, 40, 64), { pos: [-0.3, 1.5, 4.4] }, 5));
  return { id: `eg04-2-${S.F.key}`, title: "Sixty tonnes (2: Memphis)", idea: "seg 2 of 7", set: DAY, cast, props,
    sound: { signature: false, sfx: 0.6, ambience: 0.06, surface: "stone", room: "open", guard: true },
    allowClip: ["pr1", "pr2", "pr3", "pr4"].map((who) => ({ who, with: "court", from: 0, to: S.END, checks: ["clipping", "shell"], reason: "the court is the place they stand in (floor, walls, columns as one prop)" })),
    notes: "Generated by make-serapeum.mjs, segment 2 (story 17.8-22.8): flashback, the Pharaoh's line as a voice over." };
}, 17.8);

// ================================================================= 3. TUNNEL 12-18: "The inside is perfect." "We had... good tools."
const seg3 = (F) => segment(F, 12, 18.7, (S) => {
  const cast = [
    { id: "spud", character: CAST.spud, at: [0.55, 0.06], y: 0.34, face: 90, expr: "neutral", follow: 0.2, seed: 4.1 },
    { id: "pharaoh", character: CAST.pharaoh, at: [-0.2, -0.95], face: 32, expr: "neutral", seed: 7.3 },
    { id: "alien", character: CAST.crew, at: [0.45, -8.0], face: 200, expr: "surprised", seed: 3.3 },
  ];
  // 05: the box of bay R0 sits lower in this close shot (y -0.62) so Spud on the stepping block looks over its rim into it
  const props = [gallery(), box("boxR0", 0, { y: -0.62, lidSlide: 1, reflect: true }), box("boxR4", 4, { lidSlide: 0.324111 }), ...LAMPS, host("spud", 1),
    { id: "spill", kind: "crackshaft", x: 0, z: 0, spill: true, at: [1.0, 1.0, -8.6], beam: 1, staged: "a glow of light, not an object" }];
  S.look(12, "spud", [0.2, -0.35], 0.01); S.expr(12, "spud", "neutral", { brow: 0.75 }, 0.01);
  S.arm(12.3, "spud", "L", { prop: "boxR0", grip: G.brace }, 0.35); S.arm(12.4, "spud", "R", { prop: "boxR0", grip: G.tipA, point: "pinch" }, 0.45, "out");
  S.look(12.77, "spud", [0.25, -0.4], 0.3);   // the eyes go ahead of the finger
  S.arm(12.9, "spud", "R", { prop: "boxR0", grip: G.tipB, point: "pinch" }, 1.2, "inOut");   // along the inner wall, over the rim (Sol: the hand went through the granite)
  S.arm(14.3, "spud", "R", "rest", 0.4); S.arm(14.35, "spud", "L", "rest", 0.4);
  S.say(12.3, "s05", 14.5);
  S.sfx(12.6, "ai/cookie-scrape", { gain: 0.12, dur: 0.8, reason: "his fingertip squeaks along the polished granite" });
  S.shot("05 the inside is perfect", 12, cam([1.5, 2.6, 1.4], [1.1, 0.75, -0.05], tv(S.F, 40, 55), { pos: [1.45, 2.5, 1.3] }, 2.5));   // above, into the polished box
  // 06: his eyes slide away
  S.look(14.5, "pharaoh", [0.35, 0.05], 0.01);
  S.say(14.6, "p06", 17.3); S.A(14.5, "pharaoh", "noblink", { dur: 2.8 }); S.A(12.0, "spud", "noblink", { dur: 5.3 });
  S.look(15.0, "pharaoh", [-0.55, 0.05], 0.25); S.expr(15.0, "pharaoh", "neutral", { lid: 0.55 }, 0.25);
  S.shot("06 good tools", 14.5, cam([-0.15, 1.02, 1.25], [-0.2, 0.86, -0.95], tv(S.F, 34, 46), { pos: [-0.16, 1.01, 1.1] }, 2.8));
  // 07: far behind him a turquoise glow goes out, an antenna ducks behind a box
  S.look(17.72, "alien", [0.6, 0], 0.13); S.walk(17.85, "alien", [1.25, -8.9], 0.45, { y: -0.18 });
  S.prop(18.0, "spill", { beam: 0 }, 0.58, "inOut");
  S.sfx(17.4, "kenney/space-engine-low", { gain: 0.12, dur: 1.2, reason: "a faint ship hum behind the stone" });
  S.shot("07 behind him", 17.3, cam([0.0, 1.8, 0.35], [0.8, 0.9, -8.5], tv(S.F, 22, 30)));   // a long lens over his head onto the glow (Sol: too small; draft 3: his crown filled the frame)
  return { id: `eg04-3-${S.F.key}`, title: "Sixty tonnes (3: good tools)", idea: "seg 3 of 7", set: TUNNEL, cast, props,
    sound: { scenes: ["scifi"], signature: false, sfx: 0.6, ambience: 0.05, surface: "stone", room: "open", guard: true },
    allowClip: [...lampClip(["spud"], S.END), ...room(["spud", "pharaoh", "alien"], S.END), { who: "spud", with: "spud-lamp", from: 0, to: S.END, checks: ["shell"], reason: "the headlamp band is worn on his head; it presses in as he bows over the box" }],
    notes: "Generated by make-serapeum.mjs, segment 3 (story 22.8-29.5)." };
}, 22.8);

// ================================================================= 4. QUARRY 18-20.5: the alien cutter slices the block; "And the stone?"
const seg4 = (F) => segment(F, 18, 20.5, (S) => {
  const cast = [
    { id: "crew1", character: CAST.crew, at: [-1.4, 2.15], face: 180, expr: "neutral", seed: 3.1 },   // at the cutter's control slab (pedestal moved to -1.4, 1.6)
    { id: "crew2", character: CAST.crew, at: [-0.75, 2.55], face: 200, expr: "neutral", seed: 3.6 },
    { id: "w1", character: CAST.wa, at: [0.3, 3.3], face: 200, expr: "surprised", seed: 5.1 },
    { id: "w2", character: CAST.wb, at: [0.88, 2.78], face: 210, expr: "surprised", seed: 5.4 },
    { id: "w3", character: CAST.wa, at: [1.62, 2.5], face: 220, expr: "surprised", seed: 5.9 },
    { id: "spud", character: CAST.spud, at: [0, 40], face: 0, expr: "neutral", seed: 4.1 },   // off camera: his question as a voice over
  ];
  const props = [{ id: "sky", kind: "aasky", time: "day" }, { id: "quarry", kind: "aswanquarry", x: 0, z: -3 }, { id: "block", kind: "roughgranite", x: 0.6, z: 0 },
    { id: "cutter", kind: "granitecutter", x: 0, z: 0, slide: 0.2, cut: 1, pedestal: [-1.4, 0, 1.6] },
    { id: "pd1", kind: "pounder", x: 0.1, z: 2.2 }, { id: "pd2", kind: "pounder", x: 1.9, z: 2.2 }];
  S.prop(18.0, "cutter", { slide: 0.2 }, 0.01); S.prop(18.05, "cutter", { slide: 0.75 }, 2.4, "linear");   // one slow continuous pass (Sol: it jumped)
  S.arm(18.1, "crew1", "R", PANEL, 0.3);
  S.say(18.35, "s08", 20.5);
  S.sfx(18.2, "kenney/space-engine-low", { gain: 0.3, dur: 2.2, reason: "the cutter's hum" });
  S.shot("08 the quarry", 18, cam([-0.4, 2.6, 5.6], [-0.4, 1.55, 0.4], tv(S.F, 46, 66), { pos: [-0.35, 2.55, 5.2] }, 2.5));   // operator, beam on the stone, workers watching
  return { id: `eg04-4-${S.F.key}`, title: "Sixty tonnes (4: the quarry)", idea: "seg 4 of 7", set: DAY, cast, props,
    sound: { scenes: ["scifi"], signature: false, sfx: 0.6, ambience: 0.06, surface: "stone", room: "open", guard: true }, allowClip: [],
    notes: "Generated by make-serapeum.mjs, segment 4 (story 29.5-32.0)." };
}, 29.5);

// ================================================================= 5. NILE 20.5-24: the barge at sunset; "Granite. From the south. By boat."
const seg5 = (F) => segment(F, 20.5, 24.3, (S) => {
  const cast = [{ id: "pharaoh", character: CAST.pharaoh, at: [0, 60], face: 0, expr: "neutral", seed: 7.3 }];   // voice over
  const props = [{ id: "sky", kind: "aasky", time: "sunset", sun: [11, 5] }, { id: "water", kind: "nilewater", x: 0, z: 0, staged: "the river surface itself" }, { id: "banks", kind: "nilebanks", x: 0, z: 0, sunset: true },
    { id: "barge", kind: "nilebarge", x: 0, y: -0.42, z: 0, row: 0, drift: 0 }, { id: "reed", kind: "reedboat", x: -16, z: -20, scale: 0.75 }];
  S.prop(20.5, "barge", { row: 0, drift: 0 }, 0.01);   // seed (row/drift have no default)
  S.prop(20.52, "barge", { drift: 1 }, 3.78, "linear");
  S.prop(20.52, "barge", { row: 1 }, 1.88, "linear"); S.prop(22.4, "barge", { row: 0 }, 0.01); S.prop(22.42, "barge", { row: 1 }, 1.88, "linear");   // two strokes
  S.say(20.7, "p09", 24.3);
  S.tag(20.5, 24.3, "DAY 41");
  S.sfx(20.5, "ai/swim-splash", { gain: 0.08, dur: 3.5, reason: "oars in the river" });
  S.shot("09 the Nile", 20.5, cam([0.2, 2.16, 10.9], [0.21, 1.67, 0], tv(S.F, 31, 55), { pos: [0.9, 2.1, 10.4] }, 3.8));
  return { id: `eg04-5-${S.F.key}`, title: "Sixty tonnes (5: the Nile)", idea: "seg 5 of 7", set: SUNSET, cast, props,
    sound: { signature: false, sfx: 0.6, ambience: 0.06, surface: "wood", room: "open", guard: true }, allowClip: [],
    notes: "Generated by make-serapeum.mjs, segment 5 (story 32.0-35.8)." };
}, 32.0);

// ================================================================= 6. SAQQARA 24-32.5: 4 can't, 40 on wet sand can, the mouth is too narrow
const seg6 = (F) => segment(F, 24, 32.5, (S) => {
  const SZ = 16.2;                    // the sledge's z in 10; the crowd pulls it 1.83 toward the mouth in 11; 12 cuts to z 1.1 at the mouth
  const pushers = [[-1.2, 0.25], [-0.42, 0.45], [0.42, 0.45], [1.2, 0.25]];   // x, behind the back edge (SZ + 1.41)
  const cast = [
    ...pushers.map(([x, z], i) => ({ id: `p${i}`, character: i % 2 ? CAST.wb : CAST.wa, at: [x, r3(SZ + 1.41 + z)], face: [150, 180, 180, 210][i], expr: "angry", seed: 6 + i })),
    { id: "pourer", character: CAST.wa, at: [1.15, 14.44], face: 240, expr: "neutral", seed: 8.2 },
    { id: "spud", character: CAST.spud, at: [0, 60], face: 0, expr: "neutral", seed: 4.1 },
    { id: "pharaoh", character: CAST.pharaoh, at: [3, 60], face: 0, expr: "neutral", seed: 7.3 },
  ];
  const props = [{ id: "sky", kind: "aasky", time: "day" }, { id: "desert", kind: "saqqara", x: 0, z: 0, mouth: true, staged: "the ground itself (desert slab and cliff)" }, { id: "djoser", kind: "djoser", x: -48, y: 2.6, z: -40, rot: 14, staged: "stands on a far rise behind the cliff (DESIGN.md), 60 m away" },
    { id: "sledge", kind: "sledge", x: 0, z: SZ, rot: 0, ropes: true }, { id: "load", kind: "granitebox", x: 0, y: 0.19, z: SZ, rot: 90, staged: "rests on the sledge crossbeams (the support ray falls between them)" },
    { id: "haul", kind: "egypthaul", x: 0, y: -60, z: r3(SZ - 1.32), along: 0, staged: "the hauling team; parked out of sight below the ground when not in the shot" },
    { id: "jar", kind: "waterjar", x: 0.62, z: 14.39, rot: 180, pour: 0 }, { id: "wet", kind: "wetsand", x: 0, z: 13.84, wet: 0, track: 0 },
    { id: "camel", kind: "camel", x: -11, z: -18, scale: 0.6 }];
  // 10 (24-27): four push, nothing moves
  S.tag(24, 30.5, "DAY 60"); S.num(24.4, 27, "4");
  pushers.forEach((_, i) => { S.arm(24.1, `p${i}`, "L", PUSHN, 0.3); S.arm(24.1, `p${i}`, "R", PUSHN, 0.3); S.A(24.3 + i * 0.05, `p${i}`, "lean", { to: 16, dur: 0.4 }); S.A(25.6 + i * 0.07, `p${i}`, "lean", { to: 22, dur: 0.5 }); S.A(26.3, `p${i}`, "lean", { to: 12, dur: 0.4 }); S.A(24.6 + i * 0.1, `p${i}`, "move", { to: [pushers[i][0], r3(SZ + 1.36 + pushers[i][1])], dur: 0.5, ease: "inOut" }); });
  S.sfx(24.5, "kenney/impact-wood-medium", { gain: 0.25, reason: "shoulders against the sledge" });
  S.shot("10 four push", 24, cam([3.45, 1.2, 22.4], [0, 1.02, SZ], tv(S.F, 43, 62), { pos: [3.2, 1.18, 21.6] }, 3));
  // 11 (27-30): forty on two ropes; water on the sand; it slides
  for (let i = 0; i < 4; i++) S.place(27, `p${i}`, [r3(8 + i), 60], 0);
  S.prop(26.98, "haul", { y: 0 });
  S.prop(27.2, "jar", { pour: 1 }, 0.5, "out"); S.prop(27.45, "wet", { wet: 1 }, 0.6, "out");
  S.arm(27.2, "pourer", "L", JAR, 0.3); S.arm(27.2, "pourer", "R", JAR, 0.3); S.arm(28.0, "pourer", "L", "rest", 0.3); S.arm(28.0, "pourer", "R", "rest", 0.3);
  S.prop(28.25, "haul", { along: 1 }, 1.7, "inOut"); S.prop(28.25, "sledge", { z: r3(SZ - 1.83) }, 1.7, "inOut"); S.prop(28.25, "load", { z: r3(SZ - 1.83) }, 1.7, "inOut"); S.prop(28.25, "wet", { track: 1 }, 1.7, "inOut");
  S.num(27.5, 30, "40");
  S.say(28.6, "s11", 30.0);
  S.sfx(27.4, "ai/water-gush", { gain: 0.12, dur: 1.2, reason: "a jar of water poured on the sand" });
  S.sfx(27.9, "ai/bag-drag", { gain: 0.3, dur: 1.8, reason: "the sledge slides on the wet sand" });
  S.shot("11a water on the sand", 27, cam([1.7, 0.85, 12.9], [0.4, 0.15, 14.0], tv(S.F, 40, 54)));   // the pour and the wet patch close (Sol: no stream seen)
  S.shot("11b forty pull", 28.2, cam([3.2, 6.8, 21.0], [0, 0.4, 9.0], tv(S.F, 50, 64), { pos: [3.0, 6.6, 20.4] }, 1.8));   // high behind: both files of twenty run up the frame
  // 12 (30-32.5): the mouth is barely wider than the box; ropes slack
  S.prop(29.98, "haul", { y: -60 }); S.prop(29.98, "sledge", { z: 1.1 }); S.prop(29.98, "load", { z: 1.1 }); S.place(30, "pourer", [6, 60], 0);
  for (const [i, x, z] of [[0, -1.2, 2.6], [1, 1.2, 2.6], [2, -1.75, 3.3], [3, 1.75, 3.3]]) { S.place(30, `p${i}`, [x, r3(z)], 180); S.arm(30.4, `p${i}`, "R", "hat", 0.4); }
  S.say(30.4, "p12", 32.5);
  S.num(30.6, 32.5, "≈3 m");
  S.shot("12 the mouth", 30, cam([2.4, 1.55, 5.6], [-0.1, 1.05, 0.6], tv(S.F, 44, 58)));   // three-quarter: jambs, the gap, the workers (Sol: head-on hid it)
  return { id: `eg04-6-${S.F.key}`, title: "Sixty tonnes (6: Saqqara)", idea: "seg 6 of 7", set: DAY, cast, props,
    sound: { signature: false, sfx: 0.6, ambience: 0.06, surface: "sand", room: "open", guard: true }, allowClip: [],
    notes: "Generated by make-serapeum.mjs, segment 6 (story 35.8-44.3). '≈3 m' is our estimate (RESEARCH.md)." };
}, 35.8);

// ================================================================= 7. TUNNEL 32.5-66.3 (design times; story 44.3-78.1): 8 levers, the jam; day 70; empty; the tag
const seg7 = (F) => segment(F, 32.5, 66.3, (S) => {
  // the crew: two levers under the sledge's back edge (tip under it), l0/l1 on the lever butts, l2/l3 a step behind pushing the sledge's
  // tail; everything keyed on the sledge's z (sz): lever origin sz + 1.51 (tip .23 ahead of it), butt hands at origin + 1.15
  const LX = [-0.42, 0.42], crew = (sz) => [[-0.42, r3(sz + 2.86)], [0.42, r3(sz + 2.86)], [-0.345, r3(sz + 3.5)], [0.345, r3(sz + 3.5)],
    [-0.28, r3(sz + 4.25)], [0.28, r3(sz + 4.85)], [-0.28, r3(sz + 5.45)], [0.28, r3(sz + 6.05)]];   // the next shift waits staggered, so no two stand shoulder to shoulder   // eight (Sol: only four under the "8")
  const cast = [
    ...crew(-1.65).map(([x, z], i) => ({ id: `l${i}`, character: i % 2 ? CAST.wb : CAST.wa, at: [x, z], face: 180, expr: "angry", seed: 9 + i })),
    { id: "spud", character: CAST.spud, at: [-0.05, -14.83], face: 180, expr: "neutral", follow: 0.2, seed: 4.1 },
    { id: "pharaoh", character: CAST.pharaoh, at: [0.16, -13.89], face: 200, expr: "neutral", seed: 7.3 },
    { id: "a1", character: CAST.crew, at: [-2, 60], face: 180, expr: "neutral", seed: 3.1 },
    { id: "a2", character: CAST.crew, at: [0, 60], face: 180, expr: "neutral", seed: 3.6 },
    { id: "a3", character: CAST.foreman, at: [2, 60], face: 180, expr: "neutral", seed: 3.9 },
  ];
  const props = [gallery({ foot: ["R4"] }), box("boxR0", 0, { reflect: true }), box("boxR4", 4, { y: -60, lidSlide: 0.324111, staged: "parked out of sight until day seventy, then in its chamber" }), ...LAMPS, host("spud", 1),
    { id: "load", kind: "granitebox", x: 0, y: 0.19, z: -1.65, rot: 90, staged: "rests on the sledge crossbeams" }, { id: "sledge", kind: "sledge", x: 0, z: -1.65, ropes: false, staged: "on the gallery floor; parked out of sight after 42" },
    ...LX.map((x, i) => ({ id: `lv${i}`, kind: "lever", x, z: r3(-1.65 + 1.51), rot: 0, snap: 0, pry: 0, snapAt: 6.82, staged: "under the sledge lip on the floor; parked out of sight after 42" })),   // snapAt = clip time of the snap (design 39.32)
    { id: "dust", kind: "dustcloud", x: 0.6, y: 0.2, z: -5.6, age: 0, size: 1 },
    { id: "shaft", kind: "crackshaft", x: 0, z: 0, beam: 0, staged: "a beam of light through the ceiling crack, not an object" },
    { id: "puff", kind: "dustcloud", x: 0.2, y: 0.72, z: -16.25, age: 0, size: 0.5, staged: "a puff of dust from his cough, at his mouth" },
    { id: "stuck", kind: "granitebox", x: 0.55, y: -60, z: 5.64, rot: 18, material: "red", unfinished: true, staged: "parked out of sight until shot 24, then on the corridor floor" }];
  const PRESS = { o: [0.06, 0.12, 0.42] }, SHOVE = { o: [0.07, 0.34, 0.4] }, WAIT = { o: [0.1, 0.05, 0.24] }, RECOIL = { o: [0.08, 0.32, 0.22] };   // RECOIL: hands up at the chest, a step back
  // move the sledge, its box, the levers and the crew together to sledge z `sz`
  const haul = (t, sz, dur, ease = "inOut") => {
    S.prop(t, "load", { z: sz }, dur, ease); S.prop(t, "sledge", { z: sz }, dur, ease);
    LX.forEach((_, i) => S.prop(t, `lv${i}`, { z: r3(sz + 1.51) }, dur, ease));
    crew(sz).forEach((xz, i) => S.A(t, `l${i}`, "move", { to: xz, dur, ease, steps: Math.max(2, Math.round(dur * 2.5)) }));
  };
  // the present-day pair waits in the dark until 42 (they stand at bay 3, far behind the past shots' framing)
  // 13 (32.5-36): the crew with levers inside; it creeps
  S.tag(32.5, 36, "DAY 66"); S.num(32.8, 36, "8");
  for (const i of [0, 1]) { S.arm(32.5, `l${i}`, "L", PRESS, 0.01); S.arm(32.5, `l${i}`, "R", PRESS, 0.01); }   // set from the first frame
  for (const i of [2, 3]) { S.arm(32.5, `l${i}`, "L", SHOVE, 0.01); S.arm(32.5, `l${i}`, "R", SHOVE, 0.01); }
  for (const i of [4, 5, 6, 7]) { S.arm(32.5, `l${i}`, "L", WAIT, 0.01); S.arm(32.5, `l${i}`, "R", WAIT, 0.01); }
  for (const i of [4, 5, 6, 7]) S.A(32.6, `l${i}`, "lean", { to: 8, dur: 0.4 });   // the next shift waits its turn
  for (const [t, sz] of [[33.0, -2.1], [34.5, -2.6]]) {
    for (const i of [0, 1]) { S.prop(t - 0.4, `lv${i}`, { pry: 1 }, 0.5, "inOut"); S.prop(t + 0.6, `lv${i}`, { pry: 0 }, 0.5, "inOut"); }
    haul(t, sz, 0.9); S.sfx(t, "ai/bag-drag", { gain: 0.3, dur: 0.9, reason: "the sledge scrapes forward a hand's width" });
  }
  S.shot("13 eight levers", 32.5, cam([0.55, 2.45, 5.9], [0, 0.15, 0.1], tv(S.F, 46, 60)));   // high behind: all eight, the levers, the runners
  // 14 (36-39): the long way still ahead
  S.tag(36, 39, "DAY 68");
  haul(36, -3.25, 2.8);
  S.shot("14 the long way", 36, cam([0.3, 2.35, 2.6], [0, 1.3, -9], tv(S.F, 45, 60)));
  // 15 (39-42): it jams crooked at a chamber's edge; a lever snaps; the crew stumbles back; dust
  S.tag(39, 42, "DAY 69");
  haul(38.98, -4.9, 0.01, "linear");
  S.prop(39.0, "load", { z: -5.25, rot: 80 }, 0.35, "out"); S.prop(39.0, "sledge", { z: -5.25, rot: -10 }, 0.35, "out");
  S.prop(39.32, "lv1", { snap: 1 }); S.prop(39.34, "dust", { age: 1 }, 1.6, "linear");
  crew(-4.9).forEach(([x, z], i) => S.A(39.35, `l${i}`, "move", { to: [x, r3(z + 0.45)], dur: 0.35, ease: "out" }));
  for (let i = 0; i < 8; i++) { S.arm(39.4, `l${i}`, "L", RECOIL, 0.3); S.arm(39.4, `l${i}`, "R", RECOIL, 0.3); S.expr(39.4, `l${i}`, "surprised", { open: 0.3 }, 0.12); }
  S.sfx(39.0, "kenney/impact-wood-heavy", { gain: 0.5, reason: "the box jams against the stone" });
  S.sfx(39.32, "ai/branch-snap", { gain: 0.45, reason: "the lever snaps" });
  S.say(40.0, "s15", 42.0);
  S.shot("15a the lever snaps", 39, cam([-0.6, 0.62, -3.0], [0.42, 0.18, -3.3], tv(S.F, 40, 52)), "peak");   // close on the loaded lever (Sol: a head hid the break)
  S.shot("15b stuck", 39.95, cam([-0.45, 2.3, -0.2], [0.25, 0.6, -5.4], tv(S.F, 48, 60)));   // above the crew: the whole box jammed crooked (draft 3: the lens was against the box)   // in front of the crew: the box jammed crooked
  // the past leaves: crew, sledge, levers parked far away, a body-width apart
  for (let i = 0; i < 8; i++) S.place(42, `l${i}`, [r3(-7 + i * 2), 40], 0);
  for (const id of ["lv0", "lv1"]) S.prop(41.98, id, { y: -60 });
  // 16 (42-44): the Pharaoh looks at us: "Day seventy."
  S.prop(41.98, "load", { y: -60 }); S.prop(41.98, "sledge", { y: -60 }); S.prop(41.98, "boxR4", { y: -0.18 });
  S.turn(41.98, "pharaoh", 346, 0.01); S.look(42, "pharaoh", [0, 0], 0.01); S.expr(42, "pharaoh", "neutral", { lid: 0.5 }, 0.01);
  S.say(42.3, "p16", 44.0); S.num(42.4, 44, "DAY 70");
  S.shot("16 day seventy", 42, cam([-0.4, 1.02, -11.68], [0.16, 0.84, -13.89], tv(S.F, 26, 36)));
  // 17 (44-46.5): he turns: the box is in its chamber, a turquoise column fades through the crack
  S.prop(44.0, "shaft", { beam: 1 }); S.prop(44.65, "shaft", { beam: 0 }, 1.73, "inOut");
  for (const [id, x, z] of [["a1", -0.3, -19.3], ["a2", 0.05, -18.64], ["a3", 0.29, -17.77]]) S.place(44, id, [x, z], 180);   // the crew appears only now, in the dark behind the box
  S.turn(44.1, "spud", 146, 0.6); S.look(44.3, "spud", [0.3, 0.35], 0.3); S.expr(44.5, "spud", "surprised", { open: 0.2 }, 0.2);
  S.sfx(44.0, "kenney/space-engine-low", { gain: 0.2, dur: 2.2, reason: "the hum fades with the light" });
  S.shot("17 day seventy: it is in", 44, cam([-0.5, 2.3, -14.4], [1.4, 0.85, -17.6], tv(S.F, 48, 60), { pos: [-0.45, 2.2, -14.7] }, 2.5), "reveal");   // the box whole in its chamber (Sol: hard to read)
  // 18 (46.5-48.5): three aliens tiptoe away; the last one waves
  for (const [id, x, z] of [["a1", -0.3, -19.3], ["a2", 0.05, -18.64], ["a3", 0.29, -17.77]]) S.walk(46.55, id, [x, r3(z - 3.6)], 1.9);   // out of frame before the cut (Sol)
  S.look(47.0, "a3", [0.8, 0.1], 0.25); S.look(47.7, "a3", [0, 0], 0.25);   // the last one glances back (no wave: Sol saw the arm snap)
  S.shot("18 tiptoe", 46.5, cam([-0.16, 1.0, -15.04], [0.05, 0.7, -18.38], tv(S.F, 40, 58)));
  // 19 (48.5-52): "On time." "How?" "Good tools."
  S.place(48.5, "spud", [-0.62, -16.5], 50); S.place(48.5, "pharaoh", [0.62, -16.5], -50);
  ["a1", "a2", "a3"].forEach((id, i) => S.place(48.5, id, [r3(-2 + i * 2), 60], 0));
  S.look(48.5, "pharaoh", [0, 0.05], 0.01); S.look(48.5, "spud", [0, 0.05], 0.01);   // they face each other, three-quarter to us (Sol)
  S.expr(48.5, "spud", "neutral", { lid: 0.45, brow: -0.3 }, 0.01);
  const a = S.say(48.7, "p19a", 49.9); S.say(Math.max(a + 0.25, 49.9), "s19", 50.9); S.say(50.9, "p19b", 52.0);
  S.shot("19 how", 48.5, cam([0, 1.12, -14.3], [0, 0.72, -16.5], tv(S.F, 47, 66)));
  // 20 (52-55): the lid: empty
  S.place(52.0, "spud", [0.55, -17.35], 90, 0.34); S.place(52.0, "pharaoh", [-0.4, -15.4], 160);   // at the cut, not a frame before it (Sol: the pop at the shot 20 cut)
  S.prop(51.98, "boxR4", { y: -0.62, lidSlide: 0.15 });
  S.arm(52.1, "spud", "L", { prop: "boxR4", grip: G.padL }, 0.4); S.arm(52.1, "spud", "R", { prop: "boxR4", grip: G.padR }, 0.4);   // palms on the lid edge; the pads ride with the lid (Sol: hands sank)
  S.arm(53.75, "spud", "L", "rest", 0.4); S.arm(53.8, "spud", "R", "rest", 0.4);
  S.prop(52.55, "boxR4", { lidSlide: 0.75 }, 1.1, "inOut"); S.sfx(52.55, "ai/bag-drag", { gain: 0.25, dur: 1.1, reason: "stone on stone: the lid slides" });
  S.look(53.4, "spud", [0.2, -0.5], 0.25);
  S.say(53.75, "s20", 55.0);
  S.shot("20 empty", 52, cam([0.1, 2.95, -18.5], [1.35, 0.5, -17.3], tv(S.F, 50, 64)));   // high, from past the box: into the open box, Spud at its edge   // from the aisle, not the 05 angle (Sol: read as the same box)
  // 21 (55-58.5): every box, empty
  S.prop(54.98, "boxR4", { y: -0.18, lidSlide: 0.6 });
  S.place(55, "spud", [-0.3, 0.82], 180); S.place(55, "pharaoh", [0.32, 1.4], 180);   // a step apart in depth: both faces, no arms touching
  S.say(55.3, "p21", 58.5);
  S.shot("21 every box", 55, cam([0, 1.35, -6.4], [0, 0.95, 0.82], tv(S.F, 46, 60), { pos: [0, 1.32, -6.0] }, 3.5));   // from the far end: their faces, the boxes between (Sol: backs)
  // 22 (58.5-61.5): he looks up at the crack: "So... they took the cows?"
  S.place(58.5, "spud", [-0.5, -16.5], 50); S.place(58.5, "pharaoh", [0.5, -16.5], -50);
  S.look(58.6, "spud", [0.2, 0.7], 0.6); S.look(58.5, "pharaoh", [0, 0], 0.01);
  S.say(59.0, "s22", 61.5);
  S.shot("22 they took the cows", 58.5, cam([0, 1.05, -14.2], [0, 0.95, -16.6], tv(S.F, 52, 68)));
  // 23 (61.5-63.5): the cough, a puff of dust
  S.arm(61.75, "pharaoh", "R", LIPS, 0.27); S.expr(62.0, "pharaoh", "shocked", { lid: 0.85 }, 0.08);   // mouth wide, eyes squeezed ("pain" is not an expression) S.A(61.95, "pharaoh", "lean", { to: 10, dur: 0.12 }); S.A(62.3, "pharaoh", "lean", { to: 0, dur: 0.4 });   // hand to the mouth, a jolt (Sol: unreadable)
  S.prop(62.04, "puff", { age: 1 }, 0.8, "linear"); S.sfx(62.0, "ai/wet-cough", { gain: 0.35, reason: "a dry, dusty cough" });
  S.arm(62.75, "pharaoh", "R", "rest", 0.5); S.expr(62.9, "pharaoh", "neutral", null, 0.2);
  S.shot("23 cough", 61.5, cam([-0.45, 1.0, -15.65], [0.5, 0.72, -16.5], tv(S.F, 40, 54)));   // square on to his face, so the hand at his mouth reads
  // 24 (63.5-66): near the exit, the unfinished box in the corridor; he spreads his arms in front of it
  S.prop(63.48, "stuck", { y: 0 });
  S.place(63.5, "pharaoh", [0.2, 4.18], 180);   // facing us, in front of the box
  S.place(63.5, "spud", [-1.34, 5.2], 0);
  S.walk(63.6, "spud", [-1.34, 6.45], 2.3);
  S.arm(63.72, "pharaoh", "L", "shrug", 0.6); S.arm(63.72, "pharaoh", "R", "shrug", 0.6);   // (Sol: the straight spread stretched the arms)
  S.expr(64.4, "pharaoh", "happy", { lid: 0.7 }, 0.2);
  S.shot("24 nothing to see", 63.5, cam([-0.55, 1.45, 1.9], [0.3, 0.85, 5.2], tv(S.F, 50, 66)));   // inside the aisle (draft 3: x -1 was in the wall)   // three-quarter: the box's corner and lid show (Sol: read as a wall)
  return { id: `eg04-7-${S.F.key}`, title: "Sixty tonnes (7: day seventy)", idea: "seg 7 of 7", set: TUNNEL, cast, props,
    sound: { scenes: ["scifi"], signature: false, sfx: 0.6, ambience: 0.05, surface: "stone", room: "open", guard: true },
    allowClip: [...lampClip(["spud"], S.END), ...room(["spud", "pharaoh", "a1", "a2", "a3", "l0", "l1", "l2", "l3", "l4", "l5", "l6", "l7"], S.END),
      { who: "l0", with: "gallery", from: 6.6, to: 6.9, checks: ["hand-in-prop"], reason: "at the jam his palm brushes the shadowed side wall, 3 cm for 4 frames" }],
    notes: "Generated by make-serapeum.mjs, segment 7 (story 44.3-78.1): past interior 13-15, present 16-24." };
}, 44.3);

const SEGS = [seg0, seg1, seg2, seg3, seg4, seg5, seg6, seg7];
const only = process.argv.find((a) => /^--seg=/.test(a))?.slice(6).split(",").map(Number);
const FRAMES = process.argv.includes("--wide") ? [FRAME.tall, FRAME.wide] : [FRAME.tall];
for (const F of FRAMES) SEGS.forEach((g, i) => { if (!only || only.includes(i)) { const sb = g(F); write(import.meta.url, { ...F.sb, ...sb }); } });
