// Ancient aliens shared kit: the helpers every episode block builds its scenes from, so four threads get ONE Giza, one ship,
// one light. Design numbers: BOARD.md (next to this file). Each kind's full spec: the usage header of its owner file
// (engine/page/props-aa-{giza,site,ship,inside,items}.js, costumes-aliens.js). Proof that it all works together:
// bench/make-aa-proof.mjs (aa-proof-sheet.png), which is also the worked example to copy from.
//
//   import { S, SET, SET_LATE, SET_NIGHT, SUN, CAST, VIEW, TOP, cam, far, gizaToday, giza2560, liftShip, site, host, hat, whiteCar, nightOver } from "../kit/aa-kit.mjs";
//
// HOW A BLOCK IS LAID OUT. A block is one clip with several places. Give each place its own origin o = [x, z], 1000 m or more
// apart (the camera sees 300 m, so a place never shows the next one), and build it with the helpers below. Every helper
// takes an id prefix (ids must be unique in the clip) and returns an ARRAY of prop specs: spread them into `props`.
// World axes everywhere: north -z, south +z, east +x.
//
// TWO SCALES (BOARD section 3). Far things are a MINIATURE at S = 0.2 (gizaToday, giza2560, liftShip far); the cast and
// everything it touches is REAL scale (site, worktop, limeblock, the rooms). The cast stands on the real-scale foreground and
// the miniature starts 25 m or more behind it. A camera 215 m from the miniature sees it as Giza from 1 km.
//
// LIGHT AND TIME OF DAY (the anime look ignores point lights; the kit paints its light instead):
//   - the far pieces carry the time of day themselves: far(..., { time }) + the pyramids' sunAz (SUN.day / afternoon /
//     sunset) + `night` 0..1 on every far piece for dusk and night (params: they tween; seed them at 0).
//   - the CAST's light is one value per storyboard, the `set`: SET (day), SET_LATE (the warm low sun of the sunset) or
//     SET_NIGHT (cool and dim: night outside, and the rooms at night). The engine cannot change it inside a clip, so a
//     block that goes from day to night is written as one storyboard per light and cut together (every change of
//     light in the story is a hard cut to another place). A room by day with its lamps on (the King's Chamber in
//     clue 2) is fine in SET: the walls carry their own baked light and lamp pools.
//   - rooms are closed shells, so the plain set never shows in them; Spud's headlamp has a visible cone (lit 1).
//
// WHAT IS NOT HERE: cameras beyond the few VIEW spots, acting, captions, the clue counter, text, sound (BOARD section 4).

export const S = 0.2;
export const SET = { type: "plain", color: "#8fc3ee", floor: "shadow" };
const light = (o) => ({ ...SET, lighting: { v: 2, measure: false, ao: 0, ...o } });
export const SET_LATE = light({ light: "#ffd2a0", shadow: "#7a5a8c", exposure: 0.95 });
export const SET_NIGHT = light({ light: "#7f92d6", shadow: "#27336e", exposure: 0.5, night: true });
export const SUN = { day: 130, afternoon: 215, sunset: 264 };          // sunAz for the pyramids' baked shading (0 north, 90 east)
export const CAST = {
  spud: "potatobrawl/spud", chip: "potatobrawl/chip", wedge: "potatobrawl/wedge", mash: "potatobrawl/mash",
  crew: "ancient-aliens/alien-crew", foreman: "ancient-aliens/alien-foreman", lifter: "ancient-aliens/alien-lifter",
  workerA: "ancient-aliens/worker-a", workerB: "ancient-aliens/worker-b",
};
const r3 = (x) => Math.round(x * 1000) / 1000;

// Camera spots that are proven on the benches, relative to a place's origin (Khufu's centre for the far ones).
//   todayWide   the three pyramids of today from the south-west (panels 06, 26-27): stand the host at about [-146, 205]
//   pastWide    the half-built pyramid alone, 2560 BC (panels 01-03): host at about [-26, 190]
//   finishedHigh the finished white pyramid from high above (panel 11)
//   sunset      the silhouettes against the low sun (panel 23): host at about [90, 36]
export const VIEW = {
  todayWide: { pos: [-150, 1.7, 232], look: [-56, 24, 56], fov: 32 },
  pastWide: { pos: [-30, 1.7, 215], look: [0, 12, 0], fov: 32 },
  finishedHigh: { pos: [-70, 130, 150], look: [30, 0, -30], fov: 34 },
  sunset: { pos: [100, 1.7, 35], look: [0, 12, 38], fov: 32 },
};
// a camera of a place: cam(o, VIEW.todayWide) or cam(o, { pos, look, fov })
export const cam = (o, v) => ({ pos: [r3(o[0] + v.pos[0]), v.pos[1], r3(o[1] + v.pos[2])], look: [r3(o[0] + v.look[0]), v.look[1], r3(o[1] + v.look[2])], fov: v.fov ?? 32 });

// THE FAR LAYER of one place: sky + ground (+ stars, moon), centred on the CAMERA's x,z (camXZ = [x, z] in world metres; the
// domes follow nothing, so a place whose cameras are more than ~40 m apart needs a far() per camera spot: a dome draws
// nothing for a camera more than 281 m from it, so two far() layers 600 m apart never show together).
//   time "day" | "afternoon" | "sunset" | "dusk" | "night"; night 0..1 darkens a day sky and the ground (tween `night` on
//   `${id}-sky` and `${id}-ground`); tracks true = today's tyre tracks; stars n > 0 adds the starfield (hole = the gap for
//   orion, [az, el, radius]); moon [az, el] adds the moon; sun [az, el] moves the sunset disc.
export function far(id, camXZ, { time = "day", night = 0, tracks = false, seed = 1, stars = 0, hole = null, moon = null, sun = null, rubble } = {}) {
  const [x, z] = camXZ, dark = time === "night" ? 1 : night;
  return [
    { id: `${id}-sky`, kind: "aasky", x, z, time, ...(time !== "night" && { night }), ...(sun && { sun }) },
    { id: `${id}-ground`, kind: "gizaplateau", x, z, tracks, seed, night: dark, ...(rubble != null && { rubble }) },
    ...(stars ? [{ id: `${id}-stars`, kind: "starfield", x, z, n: stars, seed: 2, ...(hole && { hole }) }] : []),
    ...(moon ? [{ id: `${id}-moon`, kind: "moon", x, z, at: moon }] : []),
  ];
}

// GIZA TODAY as a miniature: the three pyramids (+ Cairo's edge in the east). o = Khufu's centre.
export function gizaToday(id, o, { sunAz = SUN.day, night = 0, haze = true, s = S } = {}) {
  return [
    { id: `${id}-giza`, kind: "gizatoday", x: o[0], z: o[1], s, sunAz, night },
    ...(haze ? [{ id: `${id}-cairo`, kind: "cairohaze", x: r3(o[0] + 420 * s), z: o[1], s, night }] : []),
  ];
}

// GIZA 2560 BC as a miniature: Khufu's pyramid ALONE. state "building" (half built, casing on the lower part) | "finished"
// (white, sharp tip); valley = the workers' village, the fields and the Nile in the east. o = the pyramid's centre.
// TOP(s, built) is the height of the working top (what liftShip hovers over).
export const TOP = (s = S, built = 0.5) => r3(146.6 * built * s);
export function giza2560(id, o, { state = "building", built = 0.5, casing = 0.45, sunAz = SUN.day, night = 0, valley = true, s = S } = {}) {
  return [
    { id: `${id}-pyr`, kind: "pyramid", x: o[0], z: o[1], s, state, sunAz, night, ...(state === "building" && { built, casing }) },
    ...(valley ? [{ id: `${id}-nile`, kind: "nilevalley", x: r3(o[0] + 160 * s), z: o[1], s, night }] : []),
  ];
}

// THE LIFT SHIP over a spot, with its beam and the block hanging in it. at = [x, z] of the spot, top = the height of the
// surface under it (TOP() over the miniature, the worktop's y at real scale), s = S for the miniature or 1 beside the cast.
// The ship hovers 40 m (x s) over the spot, the beam's foot stands on the surface. block: null for none, or
//   { y: metres over the surface (x s), k: size factor (1 = a real 1.3 m block; the far miniature needs 4 to read), look }
// Animate in the clip: `${id}-ship` { beam, lit, wobble, y }, `${id}-block` { y, dust } (seed beam and dust with a dur-0
// set at 0). A block lands by tweening its y to `top`, then dust 0 -> 1 over ~1.2 s (real scale only).
// Beside the cast (s 1) use beam 0.5: at 1 the column washes the block inside it out to a pale ghost.
// shipK enlarges the ship alone (the hover height and the beam's length stay): at true size the 30 m ring is 6 m in the
// miniature, 1.6 deg from VIEW.pastWide, so wide shots use shipK 2.5 and block k 4 to read on a phone (the panels' sizes).
export function liftShip(id, at, { top = 0, s = S, beam = 1, lit = 0.4, block = { y: 12, k: 1 }, hover = 40, shipK = 1 } = {}) {
  const k = block?.k ?? 1;
  return [
    { id: `${id}-ship`, kind: "ringship", x: at[0], y: r3(top + hover * s), z: at[1], s: r3(s * shipK), beam, lit, beamLen: r3(hover / shipK), beamR: r3(3.5 / Math.sqrt(shipK)) },
    ...(block ? [{ id: `${id}-block`, kind: "limeblock", x: at[0], y: r3(top + (block.y ?? 12) * s), z: at[1], look: block.look ?? "core", size: [r3(1.3 * s * k), r3(1.05 * s * k), r3(1.3 * s * k)], seed: 5 }] : []),
  ];
}

// THE REAL-SCALE FOOT OF THE PYRAMID the host stands at: a 36 m wide piece of the bottom courses, its foot line along x
// through o, the face rising to the north (-z), on its pavement. era "today" (weathered steps; gap = x of one empty slot in
// the bottom course, a weathered limeblock for it comes back as `${id}-slot`, standing in the slot: slide it out along +z)
// | "past" (white casing, `core` stepped courses above). Frame it low and close: the piece is 9 m high, the sky is above it.
export function site(id, o, { era = "today", gap = null, core = 3, pavement = true, seed = 1 } = {}) {
  return [
    { id: `${id}-base`, kind: "pyramidbase", x: o[0], z: o[1], state: era, seed, ...(era === "today" ? (gap != null && { gap: [gap] }) : { core }) },
    ...(pavement ? [{ id: `${id}-pave`, kind: "gizapavement", x: o[0], z: r3(o[1] + 4.7), size: [36, 10], state: era, seed }] : []),
    ...(era === "today" && gap != null ? [{ id: `${id}-slot`, kind: "limeblock", x: r3(o[0] + gap), z: r3(o[1] - 0.72), look: "weathered", size: [1.3, 1.45, 1.3], seed: 7 }] : []),
  ];
}

// THE HOST'S HEADLAMP (he wears the band in every scene; lit 0 outside, 1 in the dark: tween `lit` on its id).
export const host = (actor = "spud", lit = 0) => ({ id: `${actor}-lamp`, kind: "headlamp", wear: actor, fit: CAST.spud, x: 0, y: 0, z: 0, lit });
// A tourist's straw hat: who = "chip" | "wedge" | "mash" (the cast id the body is fitted to).
export const hat = (actor, who, band) => ({ id: `${actor}-hat`, kind: "strawhat", wear: actor, fit: CAST[who], x: 0, y: 0, z: 0, ...(band && { band }) });
// The tourists' white hatchback (3.3 long x 2.2 wide x 2.06 high, front +z).
export const whiteCar = (id, x, z, rot = 0) => ({ id, kind: "campcar", x, z, rot, color: "#f4f4f2" });

// THE NIGHT OVER TODAY'S PYRAMIDS (clue 5, panels 26-27): far night layer with stars and moon, the miniature at night and
// Orion over it, as seen from VIEW.todayWide. Tween `${id}-orion` { show } to let the Belt rise or fade in (seed at 0).
// belt true = only the three Belt stars. The Belt runs up to the right like the three pyramids below it: Mintaka, the
// faint one, sits off the line as Menkaure does.
export function nightOver(id, o, { belt = false, moon = [24, 21], stars = 5000 } = {}) {
  const c = [o[0] + VIEW.todayWide.pos[0], o[1] + VIEW.todayWide.pos[2]];
  return [
    ...far(id, c, { time: "night", tracks: true, stars, hole: [33, 22, 5], moon }),
    ...gizaToday(id, o, { night: 1, haze: false }),
    { id: `${id}-orion`, kind: "orion", x: o[0] - 32, y: 80, z: o[1] + 51, ...(belt && { belt: true }) },
  ];
}
