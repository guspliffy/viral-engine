#!/usr/bin/env node
// Never Looks Up 07: the ride photo on the exit kiosk's screen (Jonny's panel 08 shows panel 06's frame: three friends
// screaming, Phoenix head down in his phone). It is drawn from the clip itself, the photo camera's frame just before
// the flash (7.97 s), cropped to the screen's shape (1.9 x 2.2) -> assets/plates/coaster-ride-photo.webp.
// Run it again after any change to shot 06 or to what the riders do there, then render the clip.
//   node storyboards/series/never-looks-up/make-ep7-ride-photo.mjs
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const sb = "storyboards/series/never-looks-up/never-looks-up-roller-coaster.json", T = "7.97";
const run = (cmd, args) => { const r = spawnSync(cmd, args, { cwd: root, stdio: "inherit" }); if (r.status !== 0) throw new Error(`${cmd} ${args.join(" ")} failed`); };
// the photo camera's frame without the SMILE sign that stands in front of it (RIDE_PHOTO leaves it out), then the clip's
// own storyboard again
const env = { ...process.env, RIDE_PHOTO: "1" };
const r0 = spawnSync("node", ["storyboards/series/never-looks-up/make-ep7-roller-coaster.mjs"], { cwd: root, stdio: "inherit", env });
if (r0.status !== 0) throw new Error("generator failed");
try { run("node", ["engine/render.mjs", sb, "--stills", T]); } finally { run("node", ["storyboards/series/never-looks-up/make-ep7-roller-coaster.mjs"]); }
// cropped in on the four riders, from over the Dragon's sprout and bucket to the car's rim, at the screen's 1.9 : 2.2
// (the whole width made each face a thumbnail on the kiosk: review A)
const w = 900, h = Math.round(w / (1.9 / 2.2)), x0 = 10, y0 = 470;
run("ffmpeg", ["-y", "-loglevel", "error", "-i", `out/never-looks-up-roller-coaster-anime-pro-t${T}.png`, "-vf", `crop=${w}:${h}:${x0}:${y0},scale=760:880:flags=lanczos`, "-quality", "88", "assets/plates/coaster-ride-photo.webp"]);
console.log("wrote assets/plates/coaster-ride-photo.webp");
