// Writes the Mona Lisa fact story: the story runs once through SCENES on one STORY clock (narrator lengths from
// lines.json, else WPS per word), then each run of scenes in one place becomes one storyboard: ml01-<nn>-<place>.json,
// plus SEGMENTS.json (the join list + act times for the score). Adapted from what-if/10-lie-count/make-film.mjs.
//   node storyboards/series/facts/01-mona-lisa/make-film.mjs
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { clip, write } from "../../../lib/clip.mjs";
import { F, PLACES, CAST, WEAR, SCENES, ACTS, NARRATOR, TAKES, ALLOW, WPS, SCORE, LEVEL, ML, stage, shotOf, r3, yawTo } from "./film.mjs";

const LJ = new URL("./lines.json", import.meta.url);
const MEASURED = existsSync(LJ) ? JSON.parse(readFileSync(LJ, "utf8")) : {};
const words = (s) => s.split(/\s+/).filter(Boolean).length;
const nDur = (text) => MEASURED[text] ?? r3(words(text) * WPS + 0.3);
const sDur = (text) => r3(Math.max(0.7, words(text) * 0.28 + 0.3));
const MAXSHOT = 2.8;   // Jonny 19 Nov: no slow cuts; a shot longer than this is split into an angle change

// ---------------------------------------------------------------- pass 1: the story clock
let T = 0; const timed = [], actAt = {};
for (const sc of SCENES) {
  const P = PLACES[sc.place], S = stage(P), T0 = T, ev = [];
  if (!(sc.act in actAt)) actAt[sc.act] = T0;
  const posNow = {};
  for (const [who, [lx, lz]] of Object.entries(sc.layout)) posNow[who] = S.w([lx, lz]);
  ev.push([T, "cut", sc.shot, { ...posNow }]);
  let t = T + 0.1;
  for (const it of sc.seq) {
    const [k] = it;
    if (k === "n") { const d = nDur(it[1]); ev.push([t, "n", it[1], d]); t += d + 0.18; }
    else if (k === "s") { const [, who, line, tone] = it, d = sDur(line); ev.push([t, "s", who, line, d, tone]); t += d + 0.45; }
    else if (k === "cut") ev.push([t, "cut", it[1], { ...posNow }]);
    else if (k === "wait") t += it[1];
    else if (k === "walk") { posNow[it[1]] = S.w(it[2]); ev.push([t, ...it]); }
    else if (k === "show") { posNow[it[1]] = S.w(it[2]); ev.push([t, ...it]); }
    else ev.push([t, ...it]);
  }
  T = r3(t + 0.15);
  // no shot over MAXSHOT: split it into a 20-degree angle change and a size step (never a jump cut)
  const cutsOf = () => ev.filter((e) => e[1] === "cut").sort((a, b) => a[0] - b[0]);
  for (let k = 0, g = 0; g < 40; g++) {
    const cs = cutsOf(), i = cs.findIndex((c, j) => !c[2].hold && (cs[j + 1]?.[0] ?? T) - c[0] > MAXSHOT + 0.5);
    if (i < 0) break;
    const c = cs[i], at2 = r3(c[0] + Math.min(MAXSHOT, ((cs[i + 1]?.[0] ?? T) - c[0]) / 2)), b = c[2].base ?? c[2];
    // a two/group shot without its own h keeps the size computed from who is in it (Sol r1: the split cropped both faces)
    const own = (b.t === "two" || b.t === "group") && b.h == null;
    const v = { ...b, base: b, az: (b.az ?? 0) + (k % 2 ? -20 : 20), h: own ? undefined : (b.h ?? (b.t === "close" ? 1.05 : b.t === "insert" ? 0.8 : P.wideH)) * (k % 2 ? 1.15 : 0.82), auto: 1 };
    ev.push([at2, "cut", v, c[3]]); k++;
  }
  timed.push({ sc, T0: r3(T0), T1: T, ev });
}
console.log(`story: ${T.toFixed(1)} s, ${SCENES.length} scenes`);

// ---------------------------------------------------------------- pass 2: one storyboard per place run
const runs = [];
for (const x of timed) { const last = runs.at(-1); if (last && last.place === x.sc.place) last.scenes.push(x); else runs.push({ place: x.sc.place, scenes: [x] }); }
const segs = [];
runs.forEach((run, ri) => {
  const P = PLACES[run.place], S = stage(P), T0 = run.scenes[0].T0, T1 = run.scenes.at(-1).T1, END = r3(T1 - T0), u = (t) => Math.max(0, r3(t - T0));
  const c = clip({ faces: "strong", lines: { sub: true, blink: false } }), { A } = c;
  const who = [...new Set(run.scenes.flatMap((x) => [...Object.keys(x.sc.layout), ...x.sc.seq.filter((q) => q[0] === "show").map((q) => q[1])]))];
  const cast = who.map((id, k) => ({ id, character: CAST[id], at: [60 + k * 3, 60], face: 0, expr: "kind", follow: 0.3, seed: 1.1 + k * 1.3 }));
  const props = [...(P.props ? P.props() : [])], allow = [], cuts = [];
  // the run's own props (each scene's extra), once each; a prop a scene doesn't list waits under the floor
  const own = new Map(); for (const x of run.scenes) for (const p of x.sc.extra ?? []) if (!own.has(p.id)) own.set(p.id, p);
  props.push(...own.values());
  for (const id of who) if (WEAR[id]) { const w = WEAR[id]; props.push({ id: `cap-${id}`, wear: id, x: 0, y: 0, z: 0, ...w }); allow.push({ who: id, with: `cap-${id}`, from: 0, to: END, reason: "the cap is worn" }, { who: id, with: `cap-${id}`, from: 0, to: END, checks: ["shell"], reason: "the cap is worn: its band sits into the head by the flatcap fit (props-spree.js), the same on every capped body" }); }
  const PRE = 0.012;
  const place = (t, id, [x, z], yaw) => {
    yaw = ((yaw % 360) + 540) % 360 - 180;
    const uu = Math.max(0, r3(u(t) - PRE));
    if (uu === 0) { const e = cast.find((q) => q.id === id); e.at = [x, z]; e.face = r3(yaw); }
    A(uu, id, "move", { to: [x, z], dur: 0.01, steps: 0, ease: "linear", sync: true });
    A(uu, id, "turn", { to: r3(yaw), dur: 0.01, ease: "linear", sync: true });
    A(uu, id, "show");
  };
  const park = (t, id) => { const uu = Math.max(0, r3(u(t) - PRE)); A(uu, id, "hide"); A(uu, id, "move", { to: [90, 90], dur: 0.01, steps: 0, ease: "linear", sync: true }); };
  const faceOf = (spec, me, pos) => {
    if (spec === "cam") return S.facing;
    if (Array.isArray(spec)) { const a = yawTo(pos[me], pos[spec[1]]), d = ((S.facing - a + 540) % 360) - 180; return r3(a + d * 0.3); }
    return r3(S.facing + spec);
  };
  const facing = {};
  for (const { sc, T0: s0, T1: s1, ev } of run.scenes) {
    const pos = {}, us0 = Math.max(0, r3(u(s0) - PRE));
    for (const [id, [lx, lz]] of Object.entries(sc.layout)) pos[id] = S.w([lx, lz]);
    for (const id of who) {
      if (!(id in sc.layout)) { park(s0, id); continue; }
      const f = faceOf(sc.layout[id][2], id, pos); facing[id] = f;
      place(s0, id, pos[id], f);
      A(u(s0), id, "expr", { expr: "kind", dur: 0.01 });
      A(u(s0), id, "arm", { side: "R", pose: "rest", dur: 0.01 }); A(u(s0), id, "arm", { side: "L", pose: "rest", dur: 0.01 });
    }
    // the run's props: listed ones to their scene state, the others under the floor
    for (const [id, p] of own) {
      const st = sc.props?.[id] ?? (sc.extra ?? []).find((q) => q.id === id);
      const set = st ? { x: st.x ?? p.x, y: st.y ?? p.y, z: st.z ?? p.z, rot: st.rot ?? p.rot ?? 0, ...(st.cover != null && { cover: st.cover }), ...(st.tip != null && { tip: st.tip }), ...(st.open != null && { open: st.open }) } : { y: -40 };
      c.prop(us0, id, set, 0, "linear");
    }
    const live = { ...pos };
    for (const e of ev) {
      const [t, k] = e, uu = u(t);
      if (k === "cut") {
        const spec = { ...e[2] }, cp = { ...e[3] };
        if (typeof spec.at === "string") { const np = own.get(spec.at); spec.at = NPAPER_AT(S); }
        const next = ev.find((q) => q[0] > t + 1e-6 && q[1] === "cut"), len = (next ? next[0] : s1) - t;
        if (spec.t === "close" && spec.face == null) spec.face = facing[spec.who[0]] ?? S.facing;
        const shot = shotOf(P, spec, (id) => cp[id] ?? live[id], len);
        const sg = (cuts.length % 2 ? -1 : 1) * 5, pv = r3(Math.hypot(...shot.pos.map((v, i) => v - shot.look[i])));
        if (!shot.yaw) shot.yaw = { keys: [[uu, 0], [r3(uu + len), sg]], pivot: pv };   // a slow arc on every shot
        cuts.push([`${sc.id} ${spec.t}${spec.auto ? " +" : ""}`, uu, shot]);
      } else if (k === "n") {
        // the caption is the clip's own (absolute), not the macro's: a macro caption ends with its beat, so a line that
        // starts just before a cut lost its subtitle (draft 2: "The dealer calls the police."); it ends 0.15 s after the
        // voice, before the next narrator line (0.18 s gap)
        c.at(uu, { macro: "narrate", line: e[2], voice: NARRATOR, ...(TAKES[e[2]] && { take: TAKES[e[2]] }), dur: e[3], caption: false, pos: F.SUB, gain: 4.0 });
        c.cap(uu, Math.min(r3(uu + e[3] + 0.15), END), e[2], F.SUB);
      }
      else if (k === "s") {
        const [, , id, line, d, tone] = e;
        c.say(uu, id, line, d, tone, { voice: false, sub: line.charAt(0).toUpperCase() + line.slice(1), pos: F.SUB });
      } else if (k === "e") A(uu, e[2], "expr", { expr: e[3], ...(e[4] && { set: e[4] }), dur: 0.2 });
      else if (k === "walk") {
        const [, , id, to, dur] = e, w = S.w(to), from = live[id];
        // the turn into the walk takes longer the further it turns (a 0.2 s half-turn threw the hands ~40 cm a frame:
        // rig-jump on the painter, a guard, the inspector and the dealer)
        const dy = Math.abs(((yawTo(from, w) - (facing[id] ?? yawTo(from, w)) + 540) % 360) - 180), td = r3(0.2 + (0.45 * dy) / 180);
        A(uu, id, "turn", { to: yawTo(from, w), dur: td });
        A(r3(uu + 0.08 + td * 0.5), id, "move", { to: w, dur: r3(dur) });
        facing[id] = yawTo(from, w); live[id] = w;
      } else if (k === "turn") {
        // a turn followed at once by a walk of the same body: the walk's own turn wins (two turns at one moment fought
        // and threw the arms ~40 cm in a frame: rig-jump, and the panel's prop-pop as he left the wall)
        if (ev.some((q) => q[0] === e[0] && q[1] === "walk" && q[2] === e[2])) continue;
        const f = faceOf(e[3], e[2], live); A(uu, e[2], "turn", { to: f, dur: 0.25 }); facing[e[2]] = f; }
      else if (k === "look") A(uu, e[2], "look", { to: e[3], dur: 0.3 });
      else if (k === "arm") c.arm(uu, e[2], e[3], e[4], 0.3);
      else if (k === "hide") park(t, e[2]);
      else if (k === "show") { const [, , id, [lx, lz, f]] = e; place(t, id, S.w([lx, lz]), faceOf(f, id, live)); live[id] = S.w([lx, lz]); facing[id] = faceOf(f, id, live); }
      else if (k === "sfx") c.sfx(uu, e[2], { reason: "the story's own sound", ...(e[3] || {}) });
      else if (k === "prop") c.prop(uu, e[2], e[3], e[4] ?? 0.3, e[5] ?? "inOut");
      else if (k === "hop") A(uu, e[2], "hop", { count: 2, height: 0.08 });
      else if (k === "fx") c.at(uu, e[2]);
      else if (k === "grab") {
        c.arm(uu, e[2], "R", { o: [0.2, 0.26, 0.34] }, 0.25); c.arm(uu, e[2], "L", { o: [0.2, 0.26, 0.34] }, 0.25);
        A(r3(uu + 0.3), e[2], "grab", { prop: e[3], hand: "R", keep: true, dur: 0.01 });
      } else if (k === "mltake" || k === "mlhold") {
        // carried at his right side by its edge, her face out: the baker body's arms can't reach round the belly, so
        // the panel stands where the resting R hand is (measured: 0.50 out, 0.06 forward, 0.40 up) and the hand keeps it
        const id = e[2], f = facing[id] ?? S.facing, a = (f * Math.PI) / 180, p = live[id];
        const side = -0.66, fwd = 0.06, at = [r3(p[0] + side * Math.cos(a) + fwd * Math.sin(a)), 0.13, r3(p[1] - side * Math.sin(a) + fwd * Math.cos(a))];
        const t0 = k === "mltake" ? uu : us0, d = k === "mltake" ? 0.75 : 0;
        c.arm(t0, id, "R", "rest", k === "mltake" ? 0.6 : 0.01); c.arm(t0, id, "L", "rest", k === "mltake" ? 0.6 : 0.01);
        c.prop(t0, "ml", { x: at[0], y: at[1], z: at[2], rot: r3(f), tip: 0, ...(e[3] || {}) }, d, d ? "inOut" : "linear");
        A(r3(t0 + d + 0.02), id, "grab", { prop: "ml", hand: "R", keep: true, dur: 0.01 });
      } else if (k === "papers") {
        // four front pages blow across the street; the first one ends up filling the insert
        const ends = [NPAPER_AT(S)], spots = [[-3, 2.4, -0.3], [-2.5, 2.0, 0.6], [3.0, 2.2, 0.2], [2.6, 1.8, -0.6]];
        spots.forEach(([lx, y, lz], i) => {
          const [x0, z0] = S.w([lx, lz]), [x1, z1] = i === 0 ? [ends[0][0], ends[0][2]] : S.w([-lx * 0.9, lz + 0.8]), y1 = i === 0 ? ends[0][1] : 0.02;
          const t0 = r3(uu + i * 0.35), d = i === 0 ? 2.2 : 2.6;
          c.prop(t0, `np${i}`, { x: x0, y, z: z0, rot: r3(S.facing + 30 * (i % 2 ? 1 : -1)), tilt: 40 }, 0, "linear");
          c.prop(r3(t0 + 0.02), `np${i}`, { x: x1, y: y1, z: z1, rot: r3(S.facing), tilt: i === 0 ? 0 : 85 }, d, "out");
        });
      }
    }
  }
  const beats = c.beats(cuts.sort((a, b) => a[1] - b[1]), END);
  const id = `ml01-${String(ri + 1).padStart(2, "0")}-${run.place}`;
  const first = run.scenes[0].sc;
  if (T0 === 0 && first.card) c.cap(0, first.card[1], first.card[0], F.CARD, false, { size: 68, kinetic: false, color: "#ffffff", stroke: "#1d1b20" });
  write(import.meta.url, {
    id, title: "How did one thief make the Mona Lisa famous?",
    idea: "Fact story 01: in 1911 a glass fitter walked out of the Louvre with the Mona Lisa under his smock; the theft made her the most famous painting on Earth.",
    format: "Fact story (vertical, 60 s+)",
    fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, captionStyle: "kinetic",
    cleanStart: T0 === 0, motion: { feet: 2, overlap: true, timing: true, solve: true }, rig: { hand: 2, eyes: 2, hold: 2 },
    physics: false, animeTiming: true, loopIdle: false,
    set: { ...P.set, aperture: 0, focus: false, lighting: 2, hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true, satsuei: true },
    music: SCORE(T0),
    sound: { signature: false, sfx: 0.65, ambience: 0.06, surface: P.surface, room: P.room, guard: true, level: LEVEL, nature: (P.nature ?? []).map((n) => ({ id: n, gain: 0.05 })) },
    creative: { length: [END, END] },
    ...(T0 === 0 && { hook: { show: ["ml"], hint: 0, what: "the Louvre in 1911: visitors walk past the Mona Lisa without a look; the question on screen" } }),
    cast, props, captions: c.captions, beats, visible: c.visible,
    ...((allow.length || ALLOW[id]) && { allowClip: [...allow, ...(ALLOW[id] || [])] }),
    story: { T0, T1 },
    notes: `Generated by storyboards/series/facts/01-mona-lisa/make-film.mjs (story ${T0}-${T1} s).`,
  });
  segs.push({ id, place: run.place, T0, T1 });
});
writeFileSync(new URL("./SEGMENTS.json", import.meta.url), JSON.stringify({ length: T, acts: actAt, actList: ACTS, segs }, null, 1) + "\n");

// where the front page ends up for its insert: 1.1 m in front of the stage centre toward the camera, at face height
function NPAPER_AT(S) { const [x, z] = S.w([-0.2, -0.9]); return [x, 1.15, z]; }
