// Ancient aliens EP03 Atlantis, block D's own 3D places and props (owned by the block D thread; see
// storyboards/series/ancient-aliens/03-atlantis/kit/BLOCKS.md). Registered in props3d.js as AT_D_KINDS / AT_D_GRIPS.
// The kinds live in two block-local files (one builder each); their usage headers are the spec:
//   props-at-d-helike.js   helike (panel 37: Helike at night and its flood)
//   props-at-d-room.js     platoroom, klismos (panels 39, 47-48: Plato's room in Athens, the bronze lamp, the window view)
//   props-at-d-ship.js     the city-ship at midnight (panels 42-44, 46: hull, falls, beam, whirlpool, storm sky, far ring)
//   props-at-d-hatch.js    the hatch deck and lit hall (panel 45)
import { AT_D_HELIKE_KINDS } from "./props-at-d-helike.js";
import { AT_D_ROOM_KINDS, AT_D_ROOM_GRIPS } from "./props-at-d-room.js";
import { AT_D_SHIP_KINDS } from "./props-at-d-ship.js";
import { AT_D_HATCH_KINDS } from "./props-at-d-hatch.js";
export const AT_D_KINDS = { ...AT_D_HELIKE_KINDS, ...AT_D_ROOM_KINDS, ...AT_D_SHIP_KINDS, ...AT_D_HATCH_KINDS };
export const AT_D_GRIPS = { ...AT_D_ROOM_GRIPS };
