// The light trial (quality plan item 18, wave 3 K): three shipped clips with "set": { "lighting": 2 } added and nothing
// else changed, for the before | after side by side. A night env (Never Looks Up: alien, backyard-stargazing), a day
// env (Friends Try To 02: tent, lakeside-campsite) and a lamp-lit room on a painted plate (Friends Try To 04: the bill,
// cosy-bistro). The shipped storyboards stay as they are.
//   node storyboards/lookdev/light/make-light-trial.mjs
import fs from "node:fs";
import path from "node:path";
const here = path.dirname(new URL(import.meta.url).pathname), S = path.join(here, "../../series");
const TRIAL = {
  alien: "never-looks-up/never-looks-up-alien.json",
  tent: "friends-try-to/02-pitch-a-tent/pitch-a-tent.json",
  bill: "friends-try-to/04-split-the-bill/split-the-bill.json",
};
for (const [name, src] of Object.entries(TRIAL)) {
  const sb = JSON.parse(fs.readFileSync(path.join(S, src), "utf8"));
  sb.id = `${sb.id}-light2`; sb.set = { ...sb.set, lighting: 2 };
  fs.writeFileSync(path.join(here, `${name}-light2.json`), JSON.stringify(sb, null, 1));
  console.log(`${name}-light2.json <- ${src}`);
}
