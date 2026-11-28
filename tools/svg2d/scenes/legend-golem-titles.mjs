// Title options for "The Golem of Prague": the four styles of G.titleCard, five moments each (one per second of this
// scene, so --stills 0,1,...,19 gives the sheet): in (half way), held, held over the opening wide with the first
// subtitle, leaving (half way), gone. Rows A clay, B stone, C ink, D relief.
//   node tools/svg2d/render.mjs tools/svg2d/scenes/legend-golem-titles.mjs out/legend-golem/titles.mp4 --stills 0,1,2,...,19 --dir out/legend-golem/titles
import * as L from "../lib/legend.mjs";
import * as G from "../lib/legend-golem.mjs";
import { captionSvg } from "../lib/captions.mjs";
import { hosts } from "./legend-golem-proof.mjs";
export const W = 1080, H = 1920, FPS = 1, DUR = 20;
export const STYLES = [["A", "clay"], ["B", "stone"], ["C", "ink"], ["D", "relief"]];
const SUB = [{ at: 0, ws: "Get DOWN! Nobody goes up there.".split(" ").map((w, i) => [w, i * 0.3, i * 0.3 + 0.3]) }];
export function draw(time) {
  L.resetIds();
  const f = Math.round(time), [lab, style] = STYLES[Math.floor(f / 5) % 4], col = f % 5, T = G.TITLE_STYLES[style].time, m = G.mood("friday");
  const t = [(T.in[0] + T.in[1]) / 2, 1.4, 1.4, (T.out[0] + T.out[1]) / 2, 2.62][col];
  let bg;
  if (col === 2) { const c = G.SYN.CAM.wide; bg = G.todaySynagogue(c, t, m) + hosts(c, t, m, { up: 1, hop: 26, fx: -0.2 }, { talk: 0.7 }); }
  else bg = `<rect width="${W}" height="${H}" fill="${m.ramp[1]}"/><path d="M0,470 L300,462 L700,474 L1080,466 L1080,1920 L0,1920 Z" fill="${L.mix(m.ramp[1], m.ramp[2], 0.55)}"/><path d="M0,760 L400,770 L800,756 L1080,766 L1080,1920 L0,1920 Z" fill="${m.ramp[2]}"/>`;
  const tag = col === 0 ? `<text x="34" y="500" font-family="Georgia, serif" font-weight="700" font-size="76" fill="#fff" stroke="#120c24" stroke-width="12" paint-order="stroke">${lab}</text><text x="100" y="496" font-family="Georgia, serif" font-size="34" fill="#fff" stroke="#120c24" stroke-width="7" paint-order="stroke">${style}</text>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${L.defs("night")}${bg}${G.titleCard(t, { style })}${col === 2 ? captionSvg(SUB, 1.4) : ""}${tag}</svg>`;
}
