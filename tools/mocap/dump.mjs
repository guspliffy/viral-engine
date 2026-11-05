// Joint tracks of one CMU take, resampled to `fps` (default 30), as JSON: { fps, n, names, frames: [[[x,y,z], ...], ...] }
//   node tools/mocap/dump.mjs <subject.asf> <take.amc> [out.json] [--fps 30]
import fs from "node:fs";
import { readAsf, readAmc, pose } from "./asf-amc.mjs";

const args = process.argv.slice(2), fi = args.indexOf("--fps");
const fps = fi >= 0 ? Number(args.splice(fi, 2)[1]) : 30;
const [asf, amc, out] = args;
if (!asf || !amc) { console.error("usage: node tools/mocap/dump.mjs <subject.asf> <take.amc> [out.json] [--fps 30]"); process.exit(1); }
const sk = readAsf(fs.readFileSync(asf, "utf8")), F = readAmc(fs.readFileSync(amc, "utf8"));
const src = 120, step = src / fps, names = ["root", ...Object.keys(sk.bones)];
const frames = [];
for (let k = 0; k * step <= F.length - 1; k++) {
  const p = pose(sk, F[Math.round(k * step)]).pos;
  frames.push(names.map((n) => p[n].map((v) => Math.round(v * 1e4) / 1e4)));
}
const res = JSON.stringify({ fps, n: frames.length, names, frames });
if (out) fs.writeFileSync(out, res); else process.stdout.write(res);
