import * as THREE from "three";

// The light of the fire on the cast (firebender duel v2, 8 Nov 2026; Jonny's boards: "the nearby fire illuminates only
// the corresponding planes of cheek, fingers and hoodie in warm orange, with deep cool hard shadows opposite"). The
// toon shading (looks.js patchToon) keeps only how lit a surface is, not the colour of what lights it, so a point light
// next to a face changed nothing you could see. These shared uniforms carry one fire light (where the young flames
// are, their colour, their strength); patchToon adds it as a hard cel band of warm light on the planes turned to it.
// The fire prop (props-fire.js) sets them each frame when its spec has "castLight" (opt-in; 0 adds exactly nothing).
export const FIRE_U = {
  uFirePos: { value: new THREE.Vector3() },
  uFireCol: { value: new THREE.Color("#ff9a3c") },
  uFireK: { value: 0 },
};
