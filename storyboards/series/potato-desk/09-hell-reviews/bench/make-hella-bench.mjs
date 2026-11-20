// Potato Desk 09 props bench, set A + hand props (task T2, 19 Nov 2026): the kinds of engine/page/props-hella.js at their DESIGN sizes
// (storyboards/series/potato-desk/09-hell-reviews/DESIGN.md sections 0, 2, 4). Not a clip, no cast. One shot per beat (1.1 s each, the still is 0.4 s in):
//   awide      A-WIDE (0, 1.45, 10.4) fov 26: deck, terrace, 8 puffs, sky, both doors and badges, the counter, scythe (the 360 px read)
//   glow       the same, the hell door's casing glow 1 (beat 4)
//   open       the same, the hell door open 1 + glow 1 (beat 5): the hot box
//   doorX      the hell door close (scorch marks, knob, mat, ember leak, smoke);  doorH  the heaven door close
//   badge0     A-BADGE (0.86, 2.03, 3.6) fov 24 at flicker 0;  badge1  the same at flicker 1 (4.8, star 5 dim);  badgeH  the heaven badge close
//   tab0       the tablet at lit 0, hover 1 (B-TAB camera);  tab4  lit 4, hover 0
//   hands      the held props on a table (x 1.6..4.4): tablet, cloche, ketchupbottle, pitchfork, 2 palmleaf (bend 0 and 1), drinkglass, partyhat;  hands2 / hands3  close, left and right half
// Hell door state, the badge flicker and the tablet are tweened by c.prop (flicker and hover are seeded at 0 first: not propState keys).
//   node storyboards/series/potato-desk/09-hell-reviews/bench/make-hella-bench.mjs
//   flock /tmp/claude-0/render.lock node engine/render.mjs storyboards/series/potato-desk/09-hell-reviews/bench/hella-bench.json --stills <the times the generator prints> --draft --safe --out <dir>
//   node qa/contact.mjs <dir>/hella-bench-*.png --out storyboards/series/potato-desk/09-hell-reviews/bench/hella-sheet.png
import { clip, write } from "../../../../lib/clip.mjs";

const c = clip();
const TER = 0.40, TB = 0.40, TX = 3.0, TABX = 6.5;   // the tablet stands off to the right, out of the A-WIDE frame, against the dark half of the sky
const PUFFS = [[-2.30, 0.30, 11], [-1.62, 0.26, 12], [-0.98, 0.32, 13], [-0.30, 0.24, 14], [0.40, 0.33, 15], [1.08, 0.27, 16], [1.78, 0.31, 17], [2.42, 0.25, 18]];
const props = [
  { id: "sky", kind: "afterlifesky", x: 0, y: -2, z: -14 },
  { id: "deck", kind: "clouddeck", x: 0, y: 0, z: 0, w: 16 },
  { id: "fog", kind: "fogveil", x: 0, y: 0, z: 0, box: [[-4, 0.02, -2.2], [4, 0.12, 4]], n: 36, size: 1.5, color: "#f7fafc", a: 0.4, drift: [-0.05, 0] },
  ...PUFFS.map(([x, r, seed], i) => ({ id: `puff${i}`, kind: "cloudpuff", x, y: Math.round(r * 850) / 1000, z: -0.78, r, seed })),
  { id: "counter", kind: "woodcounter", x: 0, y: 0, z: -0.075, rot: 90, w: 1.25, d: 0.50, h: 0.50 },
  { id: "form", kind: "blankreport", x: 0.05, y: 0.505, z: 0.25 },
  { id: "stamp", kind: "rubberstamp", x: -0.10, y: 0.50, z: 0.38, color: "#b43a23" },
  { id: "scythe", kind: "parkedscythe", x: 0, y: 0.59, z: -0.76 },   // origin = the fist point: y 0.59 puts the blade tip at 1.55
  { id: "doorH", kind: "reviewdoor", x: -0.90, y: TER, z: -1.30, side: "heaven" },
  { id: "doorX", kind: "reviewdoor", x: 0.90, y: TER, z: -1.30, side: "hell", inside: true },
  { id: "badgeH", kind: "reviewbadge", x: -0.86, y: 2.04, z: -1.26, side: "heaven" },
  { id: "badgeX", kind: "reviewbadge", x: 0.86, y: 2.04, z: -1.26, side: "hell" },
  { id: "tab", kind: "reviewtablet", x: TABX, y: 1.2, z: 0.30, rot: 150, lit: 0, hover: 1 },
  { id: "table", kind: "woodcounter", x: TX, y: 0, z: 0.3, w: 3.4, h: TB, d: 0.9 },
  { id: "h1", kind: "reviewtablet", x: TX - 1.15, y: TB, z: 0.3, rot: 180, lit: 3 },
  { id: "h2", kind: "cloche", x: TX - 0.70, y: TB, z: 0.3, rot: 180 },
  { id: "h3", kind: "ketchupbottle", x: TX - 0.28, y: TB, z: 0.3, rot: 180 },
  { id: "h4", kind: "pitchfork", x: TX, y: TB, z: 0.3, rot: 180 },
  { id: "h5", kind: "palmleaf", x: TX + 0.25, y: TB, z: 0.3, rot: 180 },
  { id: "h5b", kind: "palmleaf", x: TX + 0.70, y: TB, z: 0.3, rot: 180, bend: 1 },
  { id: "h6", kind: "drinkglass", x: TX + 1.05, y: TB, z: 0.3, rot: 180 },
  { id: "h7", kind: "partyhat", x: TX + 1.32, y: TB, z: 0.3 },
];
c.prop(0, "badgeX", { flicker: 0 }, 0); c.prop(6.6, "badgeX", { flicker: 1 }, 0.01); c.prop(7.7, "badgeX", { flicker: 0 }, 0.01);
c.prop(1.1, "doorX", { glow: 1 }, 0.01); c.prop(2.2, "doorX", { open: 1 }, 0.01); c.prop(3.3, "doorX", { open: 0, glow: 0 }, 0.01);
c.prop(9.9, "tab", { lit: 4, hover: 0 }, 0.01);
c.prop(0, "h1", { hover: 0 }, 0);

const AWIDE = { pos: [0, 1.45, 10.4], look: [0, 1.45, 0], fov: 26 };
const DOORX = { pos: [0.9, 1.0, 4.5], look: [0.9, 1.0, -1.3], fov: 28 };
const DOORH = { pos: [-0.9, 1.0, 4.5], look: [-0.9, 1.0, -1.3], fov: 28 };
const ABADGE = { pos: [0.86, 2.03, 3.6], look: [0.86, 2.03, -1.3], fov: 24 };
const ABADGEH = { pos: [-0.86, 2.03, 3.6], look: [-0.86, 2.03, -1.3], fov: 24 };
const BTAB = { pos: [TABX, 1.6, 4.7], look: [TABX, 1.6, 0.3], fov: 24 };
const HANDS = { pos: [TX, 0.9, 9.3], look: [TX, 0.7, 0.3], fov: 30 };
const HANDS2 = { pos: [TX - 0.62, 0.78, 5.4], look: [TX - 0.58, 0.68, 0.3], fov: 30 };
const HANDS3 = { pos: [TX + 0.8, 0.85, 5.4], look: [TX + 0.8, 0.78, 0.3], fov: 30 };

const end = 14.3;
const sb = {
  id: "hella-bench", title: "Hell Reviews set A + hand props bench", idea: "Engine look bench for set A and the hand props of 09 (task T2), not a clip",
  fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, motion: "natural",
  set: { type: "plain", color: "#9fd0f0", floor: "none", light: "soft", para: 0, aperture: 0, lighting: 2, hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true, satsuei: true },   // the clip's own set
  music: false, sound: { auto: false },
  hook: { show: [], hint: 0, what: "engine bench" },
  cast: [],
  props, captions: c.captions,
  beats: c.beats([["awide", 0, AWIDE], ["glow", 1.1, AWIDE], ["open", 2.2, AWIDE], ["doorX", 3.3, DOORX], ["doorH", 4.4, DOORH], ["badge0", 5.5, ABADGE], ["badge1", 6.6, ABADGE], ["badgeH", 7.7, ABADGEH], ["tab0", 8.8, BTAB], ["tab4", 9.9, BTAB], ["hands", 11.0, HANDS], ["hands2", 12.1, HANDS2], ["hands3", 13.2, HANDS3]], end),
  notes: "Generated by storyboards/series/potato-desk/09-hell-reviews/bench/make-hella-bench.mjs (engine bench, no reviews).",
};
console.log("stills:", sb.beats.map((b) => Math.round((b.at + 0.4) * 100) / 100).join(","));
write(import.meta.url, sb);
