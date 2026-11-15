// Ancient aliens EP03 Atlantis, block B's own 3D places and props (owned by the block B thread; see
// storyboards/series/ancient-aliens/03-atlantis/kit/BLOCKS.md). Registered in props3d.js as AT_B_KINDS / AT_B_GRIPS.
// The places live in their own files (one builder each); their usage headers are the spec:
//   props-at-b-seabed.js  atbseabed  the Sicily seabed + wreck + amphoras (panels 13-16, 22-24), at P.sicily
//   props-at-b-shelf.js   atbshelf   the shelf edge over the deep (panel 21), at PLACE(25)
import { AT_B_SEABED_KINDS, AT_B_SEABED_GRIPS } from "./props-at-b-seabed.js";
import { AT_B_SHELF_KINDS, AT_B_SHELF_GRIPS } from "./props-at-b-shelf.js";
export const AT_B_KINDS = { ...AT_B_SEABED_KINDS, ...AT_B_SHELF_KINDS };
export const AT_B_GRIPS = { ...AT_B_SEABED_GRIPS, ...AT_B_SHELF_GRIPS };
