// Krampus myth 01 "One night a year he checks your boots", boots bench (task T-E): the kinds `kboot`, `bootnote` and `ktreat` of
// engine/page/props-krampus-boots.js at their DESIGN sizes (DESIGN.md section E). Not a clip, no cast. One shot per beat (1.1 s each, the still is 0.4 s in):
//   spud, chipMud, chipHalf, chipPolished  Spud's teal felt boot; Chip's yellow felt boot muddy (mud 1), half (0.5, crumbs on the step), polished (shine 1)
//   door8, door9      the raspberry lace-up (gleaming from frame 0), the red suede with its fleece and pompoms
//   back, side        the felt making from behind (seam, heel patch, pull loop) and from the left (the elbow patch)
//   sticks, treats, treatsHalf   the fills: 7 sticks standing in the teal boot; 14 treats in the yellow one, and half way
//   lane, lane2       the lane boots (house 7: moss rubber, orange felt, sky fur-trim; house 6: violet rubber, red felt with 9 dots)
//   coins, fruit, droop, glint   the treats close (a pine coin, a flower coin, one peeled and bitten), a mandarin with its stem and a walnut; the floppy felt; the glint pass
//   wideBefore, wideAfter   both drawings at phone size (a 2.65 m frame): on their own boots, then swapped
//   swapBefore, swapAfter   the swap close (camera (1.1, 0.75, 3.6) -> (1.1, 0.30, 0.95), fov 30: papers 200 and 247 px wide)
//   node storyboards/series/krampus-myth/01-boots/bench/make-boots-bench.mjs
//   flock /tmp/claude-0/render.lock node engine/render.mjs storyboards/series/krampus-myth/01-boots/bench/boots-bench.json --stills <the times printed> --draft --safe --out /tmp/claude-0/bench-boots
//   node qa/contact.mjs /tmp/claude-0/bench-boots/boots-bench-*.png --out storyboards/series/krampus-myth/01-boots/bench/boots-sheet.png
import { clip, write, frame, r3 } from "../../../../lib/clip.mjs";

const c = clip();
const DEG = Math.PI / 180, row = (i) => 3 + i * 1.2;
// a drawing clipped on a boot: the peg 35 degrees round from the toe, 0.095 out from the axis, its jaws on the cuff (y = the cuff + 0.045)
function noteAt(id, who, boot, K = 1, H = 0.30, o = {}) {
  const rot = boot.rot ?? -35, az = (rot + 35) * DEG, d = 0.0946 * K, ax = [boot.x + Math.sin(rot * DEG) * 0.01 * K, boot.z + Math.cos(rot * DEG) * 0.01 * K];
  return { id, kind: "bootnote", who, x: r3(ax[0] + Math.sin(az) * d), y: r3(boot.y + H + 0.045), z: r3(ax[1] + Math.cos(az) * d), rot: r3(rot + 35), ...o };
}
const props = [];
const add = (...p) => props.push(...p);
let i = 0;
const X = () => row(i++);
// 0 spud, 1-3 chip mud sequence, then the dressed ones
const sp = { id: "sp", kind: "kboot", who: "spud", x: X(), y: 0, z: 0, rot: -35 }; add(sp, noteAt("spn", "spud", sp));
const ch = { id: "ch", kind: "kboot", who: "chip", x: sp.x, y: 0, z: 0, rot: -35, mud: 1 }; ch.x = row(i++); add(ch, noteAt("chn", "chip", ch, 0.867, 0.26));
i += 2;
const d8 = { id: "d8", kind: "kboot", style: "leather", x: X(), y: 0, z: 0, rot: -25 }; add(d8);
const d9 = { id: "d9", kind: "kboot", style: "suede", x: X(), y: 0, z: 0, rot: -25 }; add(d9);
const bk = { id: "bk", kind: "kboot", who: "spud", x: X(), y: 0, z: 0, rot: 0 }; add(bk);
const sd = { id: "sd", kind: "kboot", who: "spud", x: X(), y: 0, z: 0, rot: 0 }; add(sd);
const st = { id: "st", kind: "kboot", who: "spud", x: X(), y: 0, z: 0, rot: -35, sticks: 1 }; add(st, noteAt("stn", "spud", st));
const tr = { id: "tr", kind: "kboot", who: "chip", x: X(), y: 0, z: 0, rot: -35, treats: 1 }; add(tr, noteAt("trn", "chip", tr, 0.867, 0.26));
const th = { id: "th", kind: "kboot", who: "chip", x: X(), y: 0, z: 0, rot: -35, treats: 0.5 }; add(th);
const L1 = X(); add({ id: "l1", kind: "kboot", style: "rubber", color: "moss", h: 0.30, x: L1 - 0.2, y: 0, z: 0, rot: -25 }, { id: "l2", kind: "kboot", style: "felt", color: "orange", h: 0.24, x: L1, y: 0, z: 0, rot: -25 }, { id: "l3", kind: "kboot", style: "furtrim", color: "sky", h: 0.18, x: L1 + 0.18, y: 0, z: 0, rot: -25 });
const L2 = X(); add({ id: "l4", kind: "kboot", style: "rubber", color: "violet", h: 0.28, x: L2 - 0.12, y: 0, z: 0, rot: -25 }, { id: "l5", kind: "kboot", style: "felt", color: "red", dots: 9, h: 0.22, x: L2 + 0.1, y: 0, z: 0, rot: -25 });
const CX = X();
add({ id: "c1", kind: "ktreat", type: "coin", n: 0, x: CX - 0.07, y: 0.026, z: 0, rot: 20, tip: 75 }, { id: "c2", kind: "ktreat", type: "coin", n: 1, x: CX, y: 0.026, z: 0, rot: -10, tip: 75 }, { id: "c3", kind: "ktreat", type: "coin", n: 0, x: CX + 0.07, y: 0.045, z: 0, rot: 30, tip: 75, peel: 1, bite: 1 });
const FX = X(); add({ id: "m1", kind: "ktreat", type: "mandarin", stem: true, x: FX - 0.05, y: 0, z: 0 }, { id: "m2", kind: "ktreat", type: "mandarin", x: FX + 0.01, y: 0, z: 0.01, rot: 80 }, { id: "w1", kind: "ktreat", type: "walnut", x: FX + 0.07, y: 0, z: 0, rot: 30 }, { id: "w2", kind: "ktreat", type: "walnut", x: FX + 0.11, y: 0, z: 0.015, rot: 120 });
const dr = { id: "dr", kind: "kboot", who: "chip", x: X(), y: 0, z: 0, rot: -35, droop: 1 }; add(dr);
const gl = { id: "gl", kind: "kboot", who: "chip", x: X(), y: 0, z: 0, rot: -35, shine: 1 }; add(gl);
// the wide frame and the swap close: both boots side by side, the drawings on their own boots (before) or crossed (after)
const WX = 100, SX = 1.0;
const w1 = { id: "w_sp", kind: "kboot", who: "spud", x: WX - 0.16, y: 0, z: 0, rot: -35 }, w2 = { id: "w_ch", kind: "kboot", who: "chip", x: WX + 0.14, y: 0, z: 0, rot: -35, mud: 1 };
const s1 = { id: "s_sp", kind: "kboot", who: "spud", x: SX, y: 0, z: 0.95, rot: -35 }, s2 = { id: "s_ch", kind: "kboot", who: "chip", x: SX + 0.22, y: 0, z: 0.95, rot: -35, mud: 1 };
add(w1, w2, s1, s2);
const onSp = (id, who, b, o) => noteAt(id, who, b, 1, 0.30, o), onCh = (id, who, b, o) => noteAt(id, who, b, 0.867, 0.26, o);
add(onSp("wn_sp", "spud", w1), onCh("wn_ch", "chip", w2), onSp("sn_sp", "spud", s1), onCh("sn_ch", "chip", s2));
// after the swap: the yellow paper on the teal boot, the teal paper (0.06 too long) on the yellow boot with its lower edge kinked
const swapped = (id, who, b, K, H, o = {}) => ({ ...noteAt(id, who, b, K, H), ...o });
add(swapped("wa_ch", "chip", w1, 1, 0.30), swapped("wa_sp", "spud", w2, 0.867, 0.26, { kink: 1 }), swapped("sa_ch", "chip", s1, 1, 0.30), swapped("sa_sp", "spud", s2, 0.867, 0.26, { kink: 1 }));

const T = (id, h, az, el, tx, ty, tz, fov = 24) => frame([tx, ty, tz], { az, el, h, fov });
const shots = [];
const S = (name, cam, acts) => shots.push([name, cam, acts || []]);
S("spud", T("", 0.56, 0, 8, sp.x, 0.17, 0));
S("chipMud", T("", 0.56, 0, 8, ch.x, 0.16, 0), [[0, "ch", { mud: 1, shine: 0 }]]);
S("chipHalf", T("", 0.56, 0, 8, ch.x, 0.16, 0.04), [[0, "ch", { mud: 0.5 }]]);
S("chipPolished", T("", 0.56, 0, 8, ch.x, 0.16, 0), [[0, "ch", { mud: 0, shine: 1 }]]);
S("door8", T("", 0.40, 0, 10, d8.x, 0.13, 0.02));
S("door9", T("", 0.34, 0, 10, d9.x, 0.10, 0.02));
S("back", T("", 0.52, 180, 10, bk.x, 0.16, 0));
S("side", T("", 0.52, -90, 10, sd.x, 0.16, 0));
S("sticks", T("", 0.80, 0, 8, st.x, 0.30, 0, 26));
S("treats", T("", 0.40, 0, 14, tr.x, 0.20, 0));
S("treatsHalf", T("", 0.40, 20, 28, th.x, 0.20, 0));
S("lane", T("", 1.0, 0, 8, L1, 0.16, 0, 24));
S("lane2", T("", 0.8, 0, 8, L2, 0.15, 0, 24));
S("coins", T("", 0.20, 0, 6, CX, 0.026, 0, 22));
S("coinPeel", T("", 0.14, 0, 8, CX + 0.07, 0.045, 0, 22));
S("fruit", T("", 0.16, 0, 14, FX - 0.02, 0.03, 0, 22));
S("nuts", T("", 0.10, 0, 20, FX + 0.09, 0.015, 0, 22));
S("droop", T("", 0.56, 80, 12, dr.x, 0.14, 0.05));
S("glint", T("", 0.46, 0, 8, gl.x, 0.15, 0), [[0, "gl", { glint: 0 }], [0.4, "gl", { glint: 0.5 }]]);
S("wideBefore", T("", 4.71, 0, 6, WX, 0.2, 0, 20));
S("wideAfter", T("", 4.71, 0, 6, WX, 0.2, 0, 20), "swap-w");
S("swapBefore", { pos: [1.1, 0.75, 3.6], look: [1.1, 0.30, 0.95], fov: 30 });
S("swapAfter", { pos: [1.1, 0.75, 3.6], look: [1.1, 0.30, 0.95], fov: 30 }, "swap-s");
// the swap: at a beat marked "swap-*" the four notes trade places (hidden -> shown by scale 0 / 1)
const times = [];
const hideAll = (at, ids) => { for (const id of ids) c.prop(at, id, { scale: 0 }, 0); };
const showAll = (at, ids) => { for (const id of ids) c.prop(at, id, { scale: 1 }, 0); };
for (const id of ["wa_ch", "wa_sp", "sa_ch", "sa_sp"]) c.prop(0, id, { scale: 0 }, 0);
shots.forEach(([name, cam, acts], k) => {
  const at = r3(k * 1.1);
  if (Array.isArray(acts)) for (const [dt, id, set] of acts) c.prop(r3(at + dt), id, set, 0);
  if (acts === "swap-w") { hideAll(at, ["wn_sp", "wn_ch"]); showAll(at, ["wa_ch", "wa_sp"]); }
  if (acts === "swap-s") { hideAll(at, ["sn_sp", "sn_ch"]); showAll(at, ["sa_ch", "sa_sp"]); }
  times.push(r3(at + 0.4));
});
const end = r3(shots.length * 1.1 + 0.2);
const sb = {
  id: "boots-bench", title: "Krampus 01 boots, drawings and treats bench", idea: "Engine look bench for the boots, the crayon drawings and the treats (task T-E), not a clip",
  fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, motion: "natural",
  set: { type: "plain", color: "#1d2744", floor: "#6a7186", light: "soft", para: 0, aperture: 0, lighting: 2, hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true, satsuei: true },
  music: false, sound: { auto: false },
  hook: { show: [], hint: 0, what: "engine bench" },
  cast: [], props, captions: c.captions, beats: c.beats(shots.map(([name, cam], k) => [name, r3(k * 1.1), cam]), end),
  notes: "Generated by storyboards/series/krampus-myth/01-boots/bench/make-boots-bench.mjs (engine bench).",
};
console.log("stills:", times.join(","));
write(import.meta.url, sb);
