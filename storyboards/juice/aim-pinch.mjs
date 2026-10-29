// measures where the Wizard's straw pinch lands at each key of Vampire vs Juice Box and writes the hand's offset from
// it to vampire-pinch.json, so the generator can put the hand where the pinch meets the straw. Run it until it settles:
//   node storyboards/juice/aim-pinch.mjs   (renders --layout, about 20 s a round)
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
const here = new URL(".", import.meta.url), file = new URL("vampire-pinch.json", here), gen = new URL("make-vampire-vs-juice-box.mjs", here);
const sb = new URL("vampire-vs-juice-box.json", here).pathname;
for (let round = 0; round < Number(process.argv[2] || 3); round++) {
  const { AIM } = await import(`${gen.href}?r=${round}`);
  execFileSync("node", [gen.pathname]);
  // the layout is written even when its contact gate fails (exit code 1): the aim comes first, the contacts after
  try { execFileSync("node", ["engine/render.mjs", sb, "--layout"], { stdio: "ignore" }); } catch (e) { if (e.status !== 1) throw e; }
  const lay = JSON.parse(readFileSync("out/vampire-vs-juice-box-anime-pro.layout.json", "utf8"));
  const old = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : {};
  const want = JSON.parse(readFileSync(sb, "utf8"));
  let worst = 0; const out = {};
  for (const [key, t] of Object.entries(AIM)) {
    const s = lay.aims.find((a) => Math.abs(a.t - t) < 1e-6), w = s?.actors.find((a) => a.id === "wiz");
    if (!w?.pinch?.R) { console.log(`${key}: no pinch at ${t}`); continue; }
    const off = w.hands.R.map((v, i) => Math.round((v - w.pinch.R[i]) * 1e4) / 1e4);
    worst = Math.max(worst, ...off.map((v, i) => Math.abs(v - (old[key]?.[i] ?? v + 1))));
    out[key] = off;
  }
  writeFileSync(file, JSON.stringify(out, null, 1) + "\n");
  console.log(`round ${round}: offsets moved up to ${(worst * 1000).toFixed(1)} mm`, JSON.stringify(out));
  if (worst < 0.0005) break;
}
execFileSync("node", [gen.pathname]);
