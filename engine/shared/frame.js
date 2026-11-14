// The picture's shape. A storyboard is tall (1080 x 1920, the default: TikTok, Reels, Shorts) or, with
// "frame": "wide", 1920 x 1080 (a YouTube film). Everything that measures in output pixels asks here.
// SAFE is the zone captions and faces must stay in: on a tall frame the apps' buttons and bars cover the rest; a wide
// frame only keeps a margin (YouTube's player bar hides the bottom strip while it shows).
export const isWide = (sb) => !!sb && sb.frame === "wide";
export function frameSize(sb) { return isWide(sb) ? { W: 1920, H: 1080 } : { W: 1080, H: 1920 }; }
export function frameSafe(sb) { return isWide(sb) ? { x0: 80, y0: 40, x1: 1840, y1: 960 } : { x0: 60, y0: 210, x1: 920, y1: 1360 }; }
// a caption's default tops ("top" | "mid" | "low"), its centre and the widest line, in output pixels
export function captionSpots(sb) {
  return isWide(sb) ? { top: 70, mid: 470, low: 800, cxTop: 960, cxLow: 960, maxTop: 1500, maxLow: 1500 } : { top: 250, mid: 860, low: 1150, cxTop: 540, cxLow: 480, maxTop: 860, maxLow: 780 };
}
