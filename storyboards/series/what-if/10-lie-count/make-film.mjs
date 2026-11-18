// Writes the whole lie-count film: the story runs once through SCENES on one STORY clock (narrator lengths from
// lines.json, else WPS per word), then each run of scenes in one place becomes one storyboard (a set is one type per
// storyboard): lc10-<nn>-<place>.json, plus SEGMENTS.json (the join list + act times for the score).
//   node storyboards/series/what-if/10-lie-count/make-film.mjs
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { clip, write } from "../../../lib/clip.mjs";
import { F, PLACES, CAST, START, SCENES, ACTS, NARRATOR, WPS, SCORE, LEVEL, stage, shotOf, floorY, r3, yawTo } from "./film.mjs";

const LJ = new URL("./lines.json", import.meta.url);
const MEASURED = existsSync(LJ) ? JSON.parse(readFileSync(LJ, "utf8")) : {};
const words = (s) => s.split(/\s+/).filter(Boolean).length;
const nDur = (text) => MEASURED[text] ?? r3(words(text) * WPS + 0.4);
const sDur = (text) => r3(Math.max(0.7, words(text) * 0.3 + 0.35));
const EXPR = { excited: "eager", calm: "kind", question: "focused", sad: "sad" };

// ---------------------------------------------------------------- pass 1: the story clock
const LIES = Object.fromEntries(Object.entries(START).map(([k, v]) => [k, [[0, v]]]));
const val = (who) => LIES[who].at(-1)[1];
let T = 0, spudTag = null; const SPUD = [];
const timed = [];   // per scene: { sc, T0, T1, ev: [[t, kind, ...]] }
const actAt = {};
for (const sc of SCENES) {
  const P = PLACES[sc.place], S = stage(P), T0 = T, ev = [];
  if (!(sc.act in actAt)) actAt[sc.act] = T0;
  const posNow = {};
  for (const [who, [lx, lz]] of Object.entries(sc.layout)) posNow[who] = S.w([lx, lz]);
  ev.push([T, "cut", sc.shot, { ...posNow }]);
  let t = T + 0.15;
  for (const it of sc.seq) {
    const [k] = it;
    if (k === "n") { const d = nDur(it[1]); ev.push([t, "n", it[1], d]); t += d + 0.7; }
    else if (k === "s") {
      const [, who, line, tone, o = {}] = it, d = sDur(line);
      ev.push([t, "s", who, line, d, tone, o]);
      if (o.lie) { const tk = r3(t + d - 0.15); LIES[who].push([tk, val(who) + 1]); }
      t += d + 0.3;
    } else if (k === "cut") ev.push([t, "cut", it[1], { ...posNow }]);
    else if (k === "wait") t += it[1];
    else if (k === "walk") { posNow[it[1]] = S.w(it[2]); ev.push([t, ...it]); }
    else if (k === "spudtag") { if (spudTag == null) spudTag = r3(t); SPUD.push([r3(t - 0.3), SPUD.length + 1]); ev.push([t, "spudtag"]); }
    else ev.push([t, ...it]);
  }
  T = r3(t + 0.8);
  timed.push({ sc, T0: r3(T0), T1: T, ev });
}
console.log(`story: ${T.toFixed(1)} s (${(T / 60).toFixed(2)} min), ${SCENES.length} scenes`);

// ---------------------------------------------------------------- pass 2: one storyboard per place run
const runs = [];
for (const x of timed) { const last = runs.at(-1); if (last && last.place === x.sc.place) last.scenes.push(x); else runs.push({ place: x.sc.place, scenes: [x] }); }
const segs = [];
runs.forEach((run, ri) => {
  const P = PLACES[run.place], S = stage(P), T0 = run.scenes[0].T0, T1 = run.scenes.at(-1).T1, END = r3(T1 - T0), u = (t) => Math.max(0, r3(t - T0));
  const c = clip({ faces: "strong", lines: { sub: true, blink: false } }), { A } = c;
  const who = [...new Set(run.scenes.flatMap((x) => Object.keys(x.sc.layout)))];
  const cast = who.map((id, k) => ({ id, character: CAST[id], at: [60 + k * 3, 60], face: 0, expr: "kind", follow: 0.3, seed: 1.1 + k * 1.3 }));
  const props = [], cuts = [], allow = [];
  const PRE = 0.012;
  const place = (t, id, [x, z], yaw) => {
    yaw = ((yaw % 360) + 540) % 360 - 180;   // (-180, 180]: a turn to 540 spins the long way
    const uu = Math.max(0, r3(u(t) - PRE)), y = floorY(P, x);
    if (uu === 0) { const e = cast.find((q) => q.id === id); e.at = [x, z]; e.face = r3(yaw); if (y) e.y = y; }
    A(uu, id, "move", { to: [x, z], y, dur: 0.01, steps: 0, ease: "linear", sync: true });
    A(uu, id, "turn", { to: r3(yaw), dur: 0.01, ease: "linear", sync: true });
    A(uu, id, "show");
  };
  const park = (t, id) => { const uu = Math.max(0, r3(u(t) - PRE)); A(uu, id, "hide"); A(uu, id, "move", { to: [90, 90], y: 0, dur: 0.01, steps: 0, ease: "linear", sync: true }); };
  const faceOf = (spec, me, pos) => {
    if (spec === "cam") return S.facing;
    if (Array.isArray(spec)) { const a = yawTo(pos[me], pos[spec[1]]), d = ((S.facing - a + 540) % 360) - 180; return r3(a + d * 0.3); }   // toward the other, cheated 30 % to the camera
    return r3(S.facing + spec);
  };
  // props of the place (made once per storyboard)
  const anyTable = run.scenes.some((x) => x.sc.table), anyPlate = run.scenes.some((x) => x.sc.plate), anyParty = run.scenes.some((x) => x.sc.party);
  if (anyTable) {
    const [x, z] = S.w([0, 0.05]);
    props.push({ id: "ctab", kind: "cafetable", x, y: 0, z, h: 0.46, r: 0.3 });
    const [bx, bz] = S.w([0.18, 0.05]);
    props.push({ id: "plate", kind: "dessertplate", x: bx, y: 0.46, z: bz }, { id: "bun", kind: "cinnabun", x: bx, y: 0.468, z: bz, rot: 0, bite: 0 });
    c.prop(0, "bun", { bite: 0 }, 0, "linear");
  }
  if (anyPlate) {
    const [x, z] = S.w([0.55, 0.05]);
    props.push({ id: "ctab", kind: "cafetable", x, y: 0, z, h: 0.46, r: 0.25 }, { id: "plate", kind: "dessertplate", x, y: 0.46, z }, { id: "bun", kind: "cinnabun", x, y: 0.468, z, rot: 0, bite: 0 });
    c.prop(0, "bun", { bite: 0 }, 0, "linear");
  }
  if (anyParty) {
    const [tx, tz] = S.w([-0.3, 1.25]);
    props.push({ id: "ptab", kind: "cafetable", x: tx, y: 0, z: tz, h: 0.46, r: 0.34 }, { id: "cake", kind: "cake", x: tx, y: 0.46, z: tz });
    props.push({ id: "banner", kind: "banner", text: "SURPRISE!", width: 1.8, x: -0.6, y: 1.55, z: -2.42, rot: 0 });
    props.push({ id: "balloons", kind: "balloons", x: -2.5, y: 0, z: -1.5 });
  }
  if (run.scenes.some((x) => x.sc.baker) || who.includes("baker")) props.push({ id: "toque", kind: "toque", wear: "baker", x: 0, y: 0, z: 0 }), allow.push({ who: "baker", with: "toque", from: 0, to: END, reason: "the chef's hat is worn" });
  if (who.includes("mover")) props.push({ id: "mcap", kind: "flatcap", wear: "mover", fit: "mover", x: 0, y: 0, z: 0 }), allow.push({ who: "mover", with: "mcap", from: 0, to: END, reason: "the flat cap is worn" });

  for (const { sc, T0: s0, T1: s1, ev } of run.scenes) {
    const pos = {};
    // the counter: the baker behind it (stand-on top, y 0.18), Spud in front
    for (const [id, [lx, lz]] of Object.entries(sc.layout)) pos[id] = S.w([lx, lz]);
    if (sc.baker) { pos.baker = [3.0, -1.7]; pos.spud = [3.0, -0.3]; }
    for (const id of who) {
      if (!(id in sc.layout)) { park(s0, id); continue; }
      const f = sc.baker && id === "baker" ? 0 : sc.baker && id === "spud" ? 180 : faceOf(sc.layout[id][2], id, pos);
      place(s0, id, pos[id], f);
      if (sc.baker && id === "baker") A(Math.max(0, u(s0) - PRE), id, "move", { to: pos[id], y: 0.18, dur: 0.01, steps: 0, ease: "linear", sync: true });
      A(u(s0), id, "expr", { expr: "kind", dur: 0.01 });
    }
    const live = { ...pos };
    for (const e of ev) {
      const [t, k] = e, uu = u(t);
      if (k === "cut") {
        const spec = e[2], cp = { ...e[3], ...(sc.baker ? { baker: [3.0, -1.7], spud: [3.0, -0.3] } : {}) };
        const P2 = sc.baker ? { ...P, deck: false } : P;
        // the next cut's start = this shot's end (for the push)
        const next = ev.find((q) => q[0] > t + 1e-6 && q[1] === "cut"), len = (next ? next[0] : s1) - t;
        const sp = { ...spec }; if (sp.t === "close" && sp.face == null) sp.face = (sc.baker && sp.who[0] === "baker") ? 0 : (sc.baker && sp.who[0] === "spud") ? 180 : faceOf(sc.layout[sp.who[0]]?.[2] ?? "cam", sp.who[0], cp);
        const shot = shotOf(P2, sp, (id) => cp[id] ?? live[id], len);
        if (sc.baker) { shot.pos[1] = r3(shot.pos[1] + 0.12); shot.look[1] = r3(shot.look[1] + 0.12); if (shot.to?.pos) shot.to.pos[1] = r3(shot.to.pos[1] + 0.12); }
        cuts.push([`${sc.id} ${spec.t}`, uu, shot]);
      } else if (k === "n") c.at(uu, { macro: "narrate", line: e[2], voice: NARRATOR, take: 1, dur: e[3], caption: true, pos: F.SUB, gain: 4.0 });
      else if (k === "s") {
        const [, , id, line, d, tone, o] = e;
        if (o.expr) A(uu, id, "expr", { expr: o.expr, dur: 0.15 });
        c.say(uu, id, line, d, tone, { voice: false, sub: line.charAt(0).toUpperCase() + line.slice(1), pos: F.SUB });
      } else if (k === "card") c.cap(uu, Math.min(END - 0.05, r3(uu + e[3])), e[2], F.CARD, false, { size: 170, kinetic: false, color: "#f3dc8c", stroke: "#24232b" });
      else if (k === "e") A(uu, e[2], "expr", { expr: e[3], ...(e[4] && { set: e[4] }), dur: 0.25 });
      else if (k === "walk") {
        const [, , id, to, dur] = e, w = S.w(to), from = live[id];
        A(uu, id, "turn", { to: yawTo(from, w), dur: 0.25 });
        A(r3(uu + 0.1), id, "move", { to: w, y: floorY(P, w[0]), dur: r3(dur) });
        live[id] = w;
      } else if (k === "arm") c.arm(uu, e[2], e[3], e[4], 0.3);
      else if (k === "hide") park(t, e[2]);
      else if (k === "sfx") c.sfx(uu, e[2], { reason: "the story's own sound", ...(e[3] || {}) });
      else if (k === "bite") c.prop(uu, e[2], { bite: e[3] }, 0.2, "out");
    }
  }
  // the number over every head (free tags, no glasses view): keys in clip time
  const tags = who.filter((id) => LIES[id]).map((id) => {
    const keys = []; for (const [t, v] of LIES[id]) { const k2 = r3(t - T0); if (k2 <= 0) { keys.length = 0; keys.push([0, v]); } else if (k2 < END) keys.push([k2, v]); }
    return { who: id, keys, free: true, ...(["baker", "mover", "driver"].includes(id) && { k: 0.85 }) };
  });
  if (spudTag != null && spudTag < T1 && who.includes("spud")) tags.push({ who: "spud", keys: (() => { const k = []; for (const [t, v] of SPUD) { const q = u(t); if (q <= 0) { k.length = 0; k.push([0, v]); } else if (q < END) k.push([q, v]); } return k; })(), show: [u(spudTag), END], free: true });
  const beats = c.beats(cuts.sort((a, b) => a[1] - b[1]), END);
  const id = `lc10-${String(ri + 1).padStart(2, "0")}-${run.place}`;
  write(import.meta.url, {
    id, title: "What if you could see how many times everyone has lied to you?",
    idea: "There's a catch EP10, the 8-minute cheap-film trial: Spud sees over every head how many times that person has lied to him. His best friend is at 212.",
    format: "There's a catch (What if), long-form wide film",
    ...F.sb, fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, captionStyle: "kinetic",
    cleanStart: T0 === 0, motion: { feet: 2, overlap: true, timing: true, solve: true }, rig: { hand: 2, eyes: 2, hold: 2 },
    physics: false, animeTiming: true, loopIdle: false,
    set: { ...P.set, aperture: 0, focus: false, lighting: 2, hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true, satsuei: true },
    score: { view: [], tags },
    music: SCORE(T0),
    sound: { signature: false, sfx: 0.65, ambience: 0.06, surface: P.surface, room: P.room, guard: true, level: LEVEL, nature: (P.nature ?? []).map((n) => ({ id: n, gain: 0.05 })) },
    creative: { length: [END, END] },
    ...(T0 === 0 && { hook: { show: ["mash"], hint: 0, what: "two potato friends at a cafe table; a glowing 211 over the eater's head ticks to 212 as he says 'delicious'" } }),
    cast, props, captions: c.captions, beats, visible: c.visible,
    ...(allow.length && { allowClip: allow }),
    story: { T0, T1 },
    notes: `Generated by storyboards/series/what-if/10-lie-count/make-film.mjs (story ${T0}-${T1} s).`,
  });
  segs.push({ id, place: run.place, T0, T1 });
});
writeFileSync(new URL("./SEGMENTS.json", import.meta.url), JSON.stringify({ length: T, acts: actAt, actList: ACTS, segs, lies: LIES, spudTag }, null, 1) + "\n");
