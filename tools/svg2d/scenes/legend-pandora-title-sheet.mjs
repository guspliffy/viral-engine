// Title options for "Pandora's jar" over the frame-0 shot (stills only).
//   node tools/svg2d/render.mjs tools/svg2d/scenes/legend-pandora-title-sheet.mjs <out.mp4> --stills 0.5,1.5,2.4,3.5,4.5,5.4,6.5,7.5,8.4,10.5,13.5 --dir <dir>
//   t = 3 * option + the card's own clock: options 0 A jar, 1 B frieze, 2 C seal (all T1), 3 A + T2, 4 A + T3.
//   STYLE=jar|frieze|seal TEASER=T1|T2|T3 pins one option, t is then the card's clock.
//   The thin box is where the subtitle goes (y 520..640): it is only on this sheet.
import { frame0 } from "./legend-pandora-proof.mjs";
import { titleCard } from "../lib/legend-pandora-title.mjs";
export const W = 1080, H = 1920, FPS = 30, DUR = 15;
export const OPTIONS = [["jar", "T1"], ["frieze", "T1"], ["seal", "T1"], ["jar", "T2"], ["jar", "T3"]];
export function draw(t) {
  const pin = process.env.STYLE, i = pin ? 0 : Math.min(OPTIONS.length - 1, Math.floor(t / 3 + 1e-6)), [style, teaser] = pin ? [pin, process.env.TEASER || "T1"] : OPTIONS[i], tt = pin ? t : t - i * 3;
  return frame0(tt, titleCard(tt, { style, teaser }) + `<rect x="150" y="520" width="780" height="120" rx="14" fill="none" stroke="#ffffff" stroke-width="2" stroke-dasharray="10 10" opacity="0.35"/>`);
}
