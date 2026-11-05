// The split-the-bill waiter close-up (quality plan item 4): the storyboard with the waiter's eyes as first delivered
// (look [-0.5, -0.4] with lid 0.55, later [-0.55, 0]; Jonny 5 Nov: "the eyes of the waiter are glitchy"), seen through
// a close camera on his face from the clip's own camera direction, with and without "rig": { "eyes": 2 }.
//   node tools/eye-sheet/waiter.mjs   -> storyboards/lookdev/eyes/waiter-{orig-v1,orig-v2,fix-v1}.json
import fs from "node:fs";

const SRC = "storyboards/series/friends-try-to/04-split-the-bill/split-the-bill.json", OUT = "storyboards/lookdev/eyes";
// the clip's own camera, zoomed onto the waiter's eyes (from a layout at 1 s): what Jonny saw, magnified
const EYES = [-0.125, 0.83, -1.37], CAM = [0, 1.85, 4.75], shot = { pos: CAM, look: EYES, fov: 7 };

for (const [name, orig, v2] of [["orig-v1", true, false], ["orig-v2", true, true], ["fix-v1", false, false]]) {
  const sb = JSON.parse(fs.readFileSync(SRC, "utf8"));
  sb.id = `waiter-${name}`; sb.title = `Waiter's eyes ${name}`;
  if (v2) sb.rig = { ...(sb.rig || {}), eyes: 2 };
  if (orig) for (const b of sb.beats) for (const x of b.do) {
    if (x.who !== "sam") continue;
    const same = (a, q) => a && a[0] === q[0] && a[1] === q[1];
    if (x.do === "look" && same(x.to, [-0.22, -0.18])) x.to = [-0.5, -0.4];
    if (x.do === "look" && same(x.to, [-0.28, -0.05])) x.to = [-0.55, 0];
    if (x.do === "face" && x.lid === 0.4) x.lid = 0.55;
  }
  sb.beats[0].shot = shot;   // every later beat keeps it
  sb.captions = []; sb.music = false;
  fs.writeFileSync(`${OUT}/${sb.id}.json`, JSON.stringify(sb, null, 1) + "\n");
  console.log(`${OUT}/${sb.id}.json`);
}
