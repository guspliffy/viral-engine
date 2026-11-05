// Small picture helpers for the pixel checks (qa/golden.mjs, qa/readability.mjs), with ffmpeg as the only codec:
// any image in as raw RGB at a chosen size, raw RGB out as PNG, and a grid of pictures as one sheet.
import { spawnSync } from "node:child_process";

// the picture scaled to w x h (area average, so a half-size copy keeps thin lines as soft lines), 3 bytes a pixel
export function readRGB(file, w, h) {
  const r = spawnSync("ffmpeg", ["-v", "error", "-i", file, "-vf", `scale=${w}:${h}:flags=area`, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], { maxBuffer: 1 << 28 });
  if (r.status !== 0 || r.stdout.length !== w * h * 3) throw new Error(`can't read ${file}: ${String(r.stderr).slice(-500)}`);
  return r.stdout;
}

export function writePNG(file, rgb, w, h) {
  const r = spawnSync("ffmpeg", ["-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", `${w}x${h}`, "-i", "-", "-frames:v", "1", file], { input: rgb, maxBuffer: 1 << 28 });
  if (r.status !== 0) throw new Error(`can't write ${file}: ${String(r.stderr).slice(-500)}`);
}

// rows of equal-size pictures side by side, with a gap; returns { rgb, w, h }
export function grid(rows, w, h, gap = 8, bg = [24, 24, 28]) {
  const cols = Math.max(...rows.map((r) => r.length)), W = cols * w + (cols + 1) * gap, H = rows.length * h + (rows.length + 1) * gap;
  const out = Buffer.alloc(W * H * 3);
  for (let i = 0; i < W * H; i++) out.set(bg, i * 3);
  rows.forEach((row, ry) => row.forEach((img, cx) => {
    if (!img) return;
    const x0 = gap + cx * (w + gap), y0 = gap + ry * (h + gap);
    for (let y = 0; y < h; y++) img.copy(out, ((y0 + y) * W + x0) * 3, y * w * 3, (y + 1) * w * 3);
  }));
  return { rgb: out, w: W, h: H };
}

// sRGB byte -> linear light, and relative luminance (WCAG) of one pixel
const LIN = Array.from({ length: 256 }, (_, i) => { const c = i / 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); });
export const luminance = (r, g, b) => 0.2126 * LIN[r] + 0.7152 * LIN[g] + 0.0722 * LIN[b];

// CIE L*a*b* of one pixel (D65), for colour differences people see (Delta E 76: about 2.3 is just noticeable)
export function lab(r, g, b) {
  const R = LIN[r], G = LIN[g], B = LIN[b];
  const f = (t) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);
  const x = f((0.4124 * R + 0.3576 * G + 0.1805 * B) / 0.95047), y = f(0.2126 * R + 0.7152 * G + 0.0722 * B), z = f((0.0193 * R + 0.1192 * G + 0.9505 * B) / 1.08883);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}
