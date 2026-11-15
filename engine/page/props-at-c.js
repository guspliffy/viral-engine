// Ancient aliens EP03 Atlantis, block C's own 3D places and props (owned by the block C thread; see
// storyboards/series/ancient-aliens/03-atlantis/kit/BLOCKS.md). Registered in props3d.js as AT_C_KINDS / AT_C_GRIPS.
// The kinds live in three files, one owner each (block-c/briefs/C1-C3.md); their usage headers are the reference:
//   engine/page/props-at-c-bimini.js  biminiroad, biminibed (Bimini under water: the road, the reef, the ceiling, the light)
//   engine/page/props-at-c-air.js     biminisea, biminiisle, biminiboat (+ clouds) (Bimini from above)
//   engine/page/props-at-c-port.js    portroyal (Port Royal 1692 and its slide)
//   engine/page/props-at-c-road.js    edgeroad2, stormcity (panel 29: the edge road at stormy evening)
//   engine/page/props-at-c-step.js    atstep, stepsea (the marble step in the calm sea, 31-36)
import { C_BIMINI_KINDS, C_BIMINI_GRIPS } from "./props-at-c-bimini.js";
import { C_AIR_KINDS, C_AIR_GRIPS } from "./props-at-c-air.js";
import { C_PORT_KINDS, C_PORT_GRIPS } from "./props-at-c-port.js";
import { C_ROAD_KINDS, C_ROAD_GRIPS } from "./props-at-c-road.js";
import { C_STEP_KINDS, C_STEP_GRIPS } from "./props-at-c-step.js";
import { C_PLATE_KINDS, C_PLATE_GRIPS } from "./props-at-c-plate.js";
export const AT_C_KINDS = { ...C_BIMINI_KINDS, ...C_AIR_KINDS, ...C_PORT_KINDS, ...C_ROAD_KINDS, ...C_STEP_KINDS, ...C_PLATE_KINDS };
export const AT_C_GRIPS = { ...C_BIMINI_GRIPS, ...C_AIR_GRIPS, ...C_PORT_GRIPS, ...C_ROAD_GRIPS, ...C_STEP_GRIPS, ...C_PLATE_GRIPS };
