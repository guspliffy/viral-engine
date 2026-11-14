#!/usr/bin/env node
// Camera and caption fit: where the faces, heads and bodies land for a camera you are trying, and where a subtitle
// fits without covering anyone, in about a second from the last layout (9 Nov 2026). Camera and caption placement
// used to be found by trial layouts (about 2 min each); the old-workflow build of Never Has Money 04 placed them by
// projecting the layout's eye points through a camera instead, and every build lost a check round to a subtitle over
// a face. Nothing is drawn: the layout's world points (eyes, mouth, head top) and the bodies where timeline.js puts
// them go through the camera's lens.
//
//   node qa/camfit.mjs <storyboard> --at 6.2                                       the storyboard's own camera
//   node qa/camfit.mjs <storyboard> --at 6.2 --pos 0.2,1.1,4.4 --look 0,0.95,-0.4 --fov 40   a camera to try
//   options: --layout <file> (default out/<id>-<look>.layout.json), --h 100 --w 700 (the subtitle box in px)
//
// Prints per character: the eyes in px and the eye line as a share of the frame from the top, the head top and the
// feet, how tall the body stands in the frame, and whether the face is in the safe zone; then the subtitle tops
// ("pos") where a box of --w x --h px, centred, covers no face and at most 8 % of anyone's body, inside the
// storyboard's "captionBand" (or the app's safe zone). The layout's boxes stay the judge (preflight); this finds
// candidates without a pass. The camera's roll is ignored.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as THREE from "three";
import { loadStoryboard, loadCharacters } from "../engine/load.mjs";
import { actorState, cameraState } from "../engine/page/timeline.js";
import { storyTime } from "../engine/shared/holds.js";
import { RULES } from "./check.mjs";
import { frameSize, frameSafe } from "../engine/shared/frame.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const vec = (s) => s.split(",").map(Number);

function args() {
  const a = process.argv.slice(2), o = { sb: null, at: null, pos: null, look: null, fov: null, layout: null, w: 700, h: 100 };
  for (let i = 0; i < a.length; i++) {
    if (a[i] === "--at") o.at = Number(a[++i]);
    else if (a[i] === "--pos") o.pos = vec(a[++i]);
    else if (a[i] === "--look") o.look = vec(a[++i]);
    else if (a[i] === "--fov") o.fov = Number(a[++i]);
    else if (a[i] === "--layout") o.layout = a[++i];
    else if (a[i] === "--w") o.w = Number(a[++i]);
    else if (a[i] === "--h") o.h = Number(a[++i]);
    else if (!o.sb && !a[i].startsWith("--")) o.sb = a[i];
    else { console.error(`unknown option ${a[i]}`); process.exit(2); }
  }
  if (!o.sb || o.at == null) { console.error("usage: node qa/camfit.mjs <storyboard.json> --at <s> [--pos x,y,z --look x,y,z --fov deg] [--layout file] [--w px --h px]"); process.exit(2); }
  return o;
}

// a lens: world point (metres) -> [x, y] px in the 1080 x 1920 frame, null behind the camera
export function lens({ pos, look, fov }, { W = 1080, H = 1920 } = {}) {
  const cam = new THREE.PerspectiveCamera(fov ?? 32, W / H, 0.05, 300), v = new THREE.Vector3();
  cam.position.fromArray(pos); cam.lookAt(new THREE.Vector3().fromArray(look)); cam.updateMatrixWorld(true); cam.updateProjectionMatrix();
  return (p) => { const q = v.set(p[0], p[1], p[2]).project(cam); return q.z > 1 ? null : [((q.x + 1) / 2) * W, ((1 - q.y) / 2) * H]; };
}

export function camfit(sb, chars, lay, t, cam, { w = 700, h = 100 } = {}) {
  const FR = frameSize(sb), P = lens(cam, FR), smp = lay.samples.reduce((b, s) => (Math.abs(s.t - t) < Math.abs(b.t - t) ? s : b), lay.samples[0]);
  const s = storyTime(sb.holds, t), rows = [];
  for (const c of sb.cast || []) {
    const def = chars[c.character] || {}, st = actorState(sb, c, def, s);
    if (st.visible === false) continue;
    const L = (smp.actors || []).find((a) => a.id === c.id) || {}, B = def.body || {}, k = c.scale ?? def.scale ?? 1;
    const a = ((B.width ?? 0.8) / 2) * k, d = ((B.depth ?? 0.7) / 2) * k, y0 = st.y ?? 0, top = L.top ?? y0 + (B.height ?? 1) * k;
    const pts = [];
    for (const dx of [-a, a]) for (const dz of [-d, d]) for (const y of [y0, top]) { const p = P([st.x + dx, y, st.z + dz]); if (p) pts.push(p); }
    const box = pts.length ? [Math.min(...pts.map((p) => p[0])), Math.min(...pts.map((p) => p[1])), Math.max(...pts.map((p) => p[0])), Math.max(...pts.map((p) => p[1]))] : null;
    rows.push({ id: c.id, eyes: L.eyes ? P(L.eyes) : null, mouth: L.mouth ? P(L.mouth) : null, head: P([st.x, top, st.z]), feet: P([st.x, y0, st.z]), box, layoutEyes: L.eyesPx || null });
  }
  // subtitle tops that clear every face and leave each body at most coverWarn covered
  const band = Array.isArray(sb.captionBand) ? sb.captionBand : [frameSafe(sb).y0, frameSafe(sb).y1], x0 = FR.W / 2 - w / 2, x1 = FR.W / 2 + w / 2, free = [];
  for (let y = band[0]; y + h <= band[1]; y += 10) {
    const ok = rows.every((r) => {
      const faces = [r.eyes, r.mouth].filter(Boolean);
      if (faces.some((p) => p[0] >= x0 - 20 && p[0] <= x1 + 20 && p[1] >= y - 30 && p[1] <= y + h + 30)) return false;
      if (!r.box) return true;
      const ix = Math.max(0, Math.min(x1, r.box[2]) - Math.max(x0, r.box[0])), iy = Math.max(0, Math.min(y + h, r.box[3]) - Math.max(y, r.box[1]));
      return (ix * iy) / (w * h) <= RULES.coverWarn;
    });
    const last = free[free.length - 1];
    if (ok) { if (last && last[1] === y - 10) last[1] = y; else free.push([y, y]); }
  }
  return { sample: smp.t, rows, band, free };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const o = args(), sb = loadStoryboard(o.sb), chars = loadCharacters(sb);
  const file = o.layout || [`${sb.id}-${sb.look || "anime-pro"}.layout.json`, `${sb.id}.layout.json`].map((f) => path.join(ROOT, "out", f)).find((f) => fs.existsSync(f));
  if (!file) { console.error(`no layout for ${sb.id} in out/: run node engine/render.mjs ${o.sb} --layout once`); process.exit(2); }
  const lay = JSON.parse(fs.readFileSync(file, "utf8")), own = cameraState(sb, storyTime(sb.holds, o.at));
  const cam = { pos: o.pos || own.pos, look: o.look || own.look, fov: o.fov ?? own.fov ?? 32 };
  const r = camfit(sb, chars, lay, o.at, cam, o), px = (p) => (p ? `${Math.round(p[0])},${Math.round(p[1])}` : "behind");
  const tried = !!(o.pos || o.look || o.fov != null);
  console.log(`camfit ${sb.id} at ${o.at} s (layout sample ${r.sample} s), ${tried ? "camera tried" : "the storyboard's camera"}: pos ${cam.pos.join(",")} look ${cam.look.join(",")} fov ${cam.fov}`);
  const { x0, y0, x1, y1 } = frameSafe(sb), FR = frameSize(sb);
  for (const a of r.rows) {
    const inF = (p) => p && p[0] >= 0 && p[0] <= FR.W && p[1] >= 0 && p[1] <= FR.H, safe = a.eyes && a.eyes[0] >= x0 && a.eyes[0] <= x1 && a.eyes[1] >= y0 && a.eyes[1] <= y1;
    const tall = a.head && a.feet ? Math.round((Math.abs(a.feet[1] - a.head[1]) / FR.H) * 100) : null;
    console.log(`  ${a.id}: eyes ${px(a.eyes)}${a.eyes ? ` (eye line ${Math.round((a.eyes[1] / FR.H) * 100)} % down${inF(a.eyes) ? "" : ", OUT OF FRAME"}${inF(a.eyes) && !safe ? ", outside the safe zone" : ""})` : ""}, head top ${px(a.head)}, feet ${px(a.feet)}${tall != null ? `, ${tall} % of the frame tall` : ""}${!tried && a.layoutEyes ? ` [layout eyes ${px(a.layoutEyes)}]` : ""}`);
  }
  console.log(r.free.length ? `subtitle tops ("pos") clear of every face and body, a ${o.w} x ${o.h} px box in y ${r.band.join("-")}: ${r.free.map(([a, b]) => (a === b ? `${a}` : `${a}-${b}`)).join(", ")}` : `no subtitle top in y ${r.band.join("-")} clears every face and body for a ${o.w} x ${o.h} px box: move the camera, the cast, or shorten the line`);
}
