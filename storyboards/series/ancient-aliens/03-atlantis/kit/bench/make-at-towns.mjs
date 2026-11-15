// Bench for the Atlantis overlays on paintings (engine/page/props-at-towns.js, task T5 of ../briefs/T5.md): three storyboards, each with one beat per still (the still is 0.55 s into
// its beat; each beat starts by setting the props' params with dur-0 tweens). Wide frame, far 1500. Not a clip.
//   at-towns-env.json   envflash on the env at-harbour-dawn (the brass wall; plate 02's citadel wall replaces it when assets/environments/at-citadel-wall-dawn/ exists):
//                       flash 0, 0.5, 1 + hot 1, a tight shot of the left wall at flash 0.5 / hot 1, and the camera moved 0.5 m right and 0.15 m up (flash 0.35, hot 1).
//   at-towns-map.json   maproute + mapoutline on a flat map plate: route half drawn, route done + dots + pillars, outline half drawn, outline filled.
//   at-towns-page.json  pagemarks on a flat page plate: typed marks, pencil half way, pencil done (full page, then a close shot).
// The flat plates are STAND-INS (out/at-towns/standin-{map,page}.png, painted by kit/tools/flashmask.py standin ...) until plate-18-sea-map and plate-26-page-1940 arrive in
// /mnt/project-files/videos/ancient-aliens/03-atlantis/plates/; give the PNG as argv 2 / 3 to use the real ones.
// The flash mask of at-harbour-dawn (generated into the env's folder, keep these arguments if the painting changes):
//   python3 storyboards/series/ancient-aliens/03-atlantis/kit/tools/flashmask.py at-harbour-dawn --debug \
//    --poly "0,630 197,630 190,700 148,940 0,940" --poly "420,625 1212,625 1212,880 1196,940 420,940" --poly "2328,625 2872,625 2872,940 2328,940" \
//    --exclude "462,595 568,595 568,905 462,905" --exclude "2715,595 2825,595 2825,905 2715,905" \
//    --exclude "765,800 1062,795 1062,820 1040,830 1035,985 780,985 775,830" --exclude "888,735 918,735 918,800 888,800" \
//    --exclude "2418,800 2688,800 2688,835 2640,985 2440,985 2420,830" --exclude "2532,750 2556,750 2556,800 2532,800" \
//    --seams "17,118;565,642,732,843,915,1010,1130;2443,2505,2588,2705" --hseams "778;778;778"
//   node storyboards/series/ancient-aliens/03-atlantis/kit/bench/make-at-towns.mjs [env|map|page ...] [map.png] [page.png]
//   node engine/render.mjs storyboards/series/ancient-aliens/03-atlantis/kit/bench/at-towns-env.json --stills <times> --draft --out out/at-towns
//   node qa/contact.mjs out/at-towns/at-towns-*.png --out storyboards/series/ancient-aliens/03-atlantis/kit/bench/at-towns-sheet.png
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { clip, r3 } from "../../../../../lib/clip.mjs";
import { host, lampClip } from "../../../kit/aa-kit.mjs";
const OUT = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(OUT, "../../../../../..");
const args = process.argv.slice(2), pngs = args.filter((a) => a.endsWith(".png")), which = args.filter((a) => !a.endsWith(".png"));
const want = (k) => !which.length || which.includes(k);
const MAPPNG = pngs[0] || "out/at-towns/standin-map.png", PAGEPNG = pngs[1] || "out/at-towns/standin-page.png";
const write = (sb) => { fs.writeFileSync(path.join(OUT, `${sb.id}.json`), JSON.stringify(sb, null, 1) + "\n"); console.log("wrote", `${sb.id}.json`, "stills:", sb.stills.join(",")); delete sb.stills; };
const shotsOf = (list) => list.map((s, i) => ({ ...s, t: r3(i), still: r3(i + 0.55) }));
const base = { frame: "wide", far: 1500, fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, motion: "natural", music: false, sound: { sfx: 0, ambience: 0 }, creative: { length: [0, 20], notes: false } };

// ------------------------------------------------------------------------------------------------------------- env
if (want("env")) {
  const ENV = "at-harbour-dawn", E = JSON.parse(fs.readFileSync(path.join(ROOT, "assets/environments", ENV, "env.json"), "utf8"));
  const [W, H] = E.size, f = E.eye.f, p = (E.eye.pitch * Math.PI) / 180, [ex, ey, ez] = E.eye.pos;
  // the painting camera's ray through picture pixel (u, v), as in set-env.js envCamera
  const ray = (u, v) => { const up = [0, Math.cos(p), -Math.sin(p)], fw = [0, -Math.sin(p), -Math.cos(p)]; const r = [u - W / 2, 0, 0]; for (let k = 0; k < 3; k++) r[k] += -(v - H / 2) * up[k] + f * fw[k]; const l = Math.hypot(...r); return r.map((x) => x / l); };
  const eyeCam = (fov, dx = 0, dy = 0, at = null) => { const pos = [ex + dx, ey + dy, ez], d = at ? ray(...at) : [0, -Math.sin(p), -Math.cos(p)]; return { pos: pos.map(r3), look: pos.map((x, i) => r3(x + d[i] * 10)), fov }; };
  const SH = shotsOf([
    { name: "E0", label: "flash 0 (hot 0)", set: { flash: 0, hot: 0 }, cam: eyeCam(40) },
    { name: "E1", label: "flash 0.5", set: { flash: 0.5, hot: 0 }, cam: eyeCam(40) },
    { name: "E2", label: "flash 1 (past the wall), hot 1", set: { flash: 1, hot: 1 }, cam: eyeCam(40) },
    { name: "E3", label: "tight on the left wall, flash 0.45, hot 1", set: { flash: 0.45, hot: 1 }, cam: eyeCam(15, 0, 0, [820, 780]) },
    { name: "E4", label: "camera moved 0.5 m right, 0.15 m up: flash 0.35, hot 1 (locked to the plates)", set: { flash: 0.35, hot: 1 }, cam: eyeCam(40, 0.5, 0.15) },
    { name: "E5", label: "right wall, flash 0.62, hot 0", set: { flash: 0.62, hot: 0 }, cam: eyeCam(15, 0, 0, [2600, 780]) },
  ]);
  const c = clip(), END = r3(SH.length + 0.1);
  for (const s of SH) { c.prop(s.t, "flash", s.set, 0); c.cap(s.t, s.t + 0.95, s.label, 1020, false, { kinetic: false, size: 30 }); }
  write({
    id: "at-towns-env", title: "Atlantis overlays bench: envflash", ...base,
    set: { type: "env", env: ENV, shade: "soft", aperture: 0, focus: false, life: "auto" },
    cast: [{ id: "spud", character: "potatobrawl/spud", at: [-0.7, 1.0], face: "camera", expr: "kind", seed: 1.3 }],
    props: [host("spud", 0), { id: "flash", kind: "envflash", env: ENV, x: 0, y: 0, z: 0, flash: 0, hot: 0 }], allowClip: lampClip(["spud"], END),
    captions: c.captions, beats: c.beats(SH.map((s) => [s.name, s.t, s.cam]), END), duration: END, stills: SH.map((s) => s.still),
    notes: "Generated by make-at-towns.mjs (bench).",
  });
}

// ------------------------------------------------------------------------------------------------------------- flat plates
const flat = (png, size = [3072, 2048]) => {
  const PL = { src: png, z: -2.2, center: [0, 1.6], height: 3.2, depth: false, motion: false, dust: 0 };
  const k = PL.height / size[1];
  const cam = (cx, cy, vw) => {   // looks straight at plate pixel (cx, cy); the window is vw plate px wide
    const X = (cx - size[0] / 2) * k, Y = 1.6 - (cy - size[1] / 2) * k, dist = 3.4, vh = vw * k * 9 / 16;
    return { pos: [r3(X), r3(Y), r3(-2.2 + dist)], look: [r3(X), r3(Y), -2.2], fov: r3(2 * Math.atan(vh / 2 / dist) * 180 / Math.PI) };
  };
  return { PL, cam };
};
const flatSb = (id, title, PL, props, SH, END, c) => ({
  id, title, ...base, set: { type: "plain", color: "#101010", floor: "none", plate: PL }, cast: [], props, captions: c.captions,
  beats: c.beats(SH.map((s) => [s.name, s.t, s.cam]), END), duration: END, stills: SH.map((s) => s.still), notes: "Generated by make-at-towns.mjs (bench).",
});

if (want("map")) {
  const { PL, cam } = flat(MAPPNG), info = fs.existsSync(path.join(ROOT, MAPPNG.replace(/\.png$/, ".json"))) ? JSON.parse(fs.readFileSync(path.join(ROOT, MAPPNG.replace(/\.png$/, ".json")), "utf8")) : {};
  const ATH = info.athens || [2560, 760], BOX = info.box || [330, 760, 600, 760];
  const route = { id: "route", kind: "maproute", plate: PL, x: 0, y: 0, z: 0, from: ATH, via: [[2050, 940], [1500, 1040], [1260, 1050]], to: [1010, 1062], pillars: [[1160, 700], [1175, 1385]], pillarH: 0.03, draw: 0, dots: 0 };
  const isle = { id: "isle", kind: "mapoutline", plate: PL, x: 0, y: 0, z: 0, box: BOX, draw: 0, fillP: 0 };
  const SH = shotsOf([
    { name: "M0", label: "map: nothing drawn but the two pillars", set: [["route", { draw: 0, dots: 0 }], ["isle", { draw: 0, fillP: 0 }]], cam: cam(1536, 1024, 3500) },
    { name: "M1", label: "route drawn 62 %, dots 1", set: [["route", { draw: 0.62, dots: 1 }]], cam: cam(1536, 1024, 3500) },
    { name: "M2", label: "route done, dots, close on the pillars", set: [["route", { draw: 1, dots: 1 }]], cam: cam(1170, 1040, 1600) },
    { name: "M3", label: "outline drawn 55 %", set: [["route", { draw: 0, dots: 0 }], ["isle", { draw: 0.55, fillP: 0 }]], cam: cam(...[BOX[0] + BOX[2] / 2, BOX[1] + BOX[3] / 2], 1100) },
    { name: "M4", label: "outline done, fill 1 (60 % strength)", set: [["route", { draw: 0, dots: 0 }], ["isle", { draw: 1, fillP: 1 }]], cam: cam(BOX[0] + BOX[2] / 2, BOX[1] + BOX[3] / 2, 1100) },
    { name: "M5", label: "all together, whole map", set: [["isle", { draw: 1, fillP: 1 }], ["route", { draw: 1, dots: 1 }]], cam: cam(1536, 1024, 3500) },
  ]);
  const c = clip(), END = r3(SH.length + 0.1);
  for (const s of SH) { for (const [id, v] of s.set) c.prop(s.t, id, v, 0); c.cap(s.t, s.t + 0.95, s.label, 1020, false, { kinetic: false, size: 30 }); }
  write(flatSb("at-towns-map", "Atlantis overlays bench: map", PL, [route, isle], SH, END, c));
}

if (want("page")) {
  const { PL, cam } = flat(PAGEPNG), jf = path.join(ROOT, PAGEPNG.replace(/\.png$/, ".json")), info = fs.existsSync(jf) ? JSON.parse(fs.readFileSync(jf, "utf8")) : { marks: [{ text: "1940", x: 1620, y: 470 }, { text: "68", x: 1836, y: 1196 }, { text: "69", x: 1598, y: 1262 }], size: 36, pitch: 21.6 };
  const marks = { id: "marks", kind: "pagemarks", plate: PL, x: 0, y: 0, z: 0, marks: info.marks, size: info.size, pitch: info.pitch, type: 0, draw: 0 };
  const m = info.marks, closeAt = [(m[1].x + m[2].x) / 2 + 40, (m[1].y + m[2].y) / 2];
  const SH = shotsOf([
    { name: "P0", label: "page: no marks yet", set: { type: 0, draw: 0 }, cam: cam(1536, 1024, 3500) },
    { name: "P1", label: "typed marks, no pencil", set: { type: 1, draw: 0 }, cam: cam(1536, 1024, 3500) },
    { name: "P2", label: "date line: typed 1940, pencil half way", set: { type: 1, draw: 0.2 }, cam: cam(m[0].x + 60, m[0].y, 420) },
    { name: "P3", label: "lines 12-13: pencil done", set: { type: 1, draw: 1 }, cam: cam(closeAt[0], closeAt[1], 520) },
    { name: "P4", label: "full page, pencil done", set: { type: 1, draw: 1 }, cam: cam(1536, 1024, 3500) },
    { name: "P5", label: "typing: 3 of 8 characters", set: { type: 0.4, draw: 0 }, cam: cam(m[0].x + 60, m[0].y, 420) },
  ]);
  const c = clip(), END = r3(SH.length + 0.1);
  for (const s of SH) { c.prop(s.t, "marks", s.set, 0); c.cap(s.t, s.t + 0.95, s.label, 1020, false, { kinetic: false, size: 30 }); }
  write(flatSb("at-towns-page", "Atlantis overlays bench: page", PL, [marks], SH, END, c));
}
