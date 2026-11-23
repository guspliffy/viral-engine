// Set obstacles a floor plan can't see (14 Nov 2026): a set kind can draw solid things inside its one mesh (the gorge's bridge
// posts) that no storyboard footprint describes, so qa/clear.mjs passed Chip being pulled through a post that Jonny saw in the
// final (There's a catch EP09b). Each kind lists its upright posts in its own frame: [x, y, z, r, h] = the foot of the post,
// its radius and height in metres. The kind's builder reads the same list (one source), and qa/clear.mjs checks every body
// standing between the post's foot and its top against it, moved with the prop's x, y, z, rot and scale.
// props-shed.js gardenshed (Kid vs Dad 01, DESIGN 6): its walls, 1.90 x 1.30 floor, eaves 1.50, the door wall on +z with a 1.20 doorway
// (x -0.75..+0.45) left open: round posts 0.06 every 0.10 along the back wall, the two side walls and the two bits of front wall.
// props-shed.js reads SHED (one source).
export const SHED = { w: 1.9, d: 1.3, eaves: 1.5, ridge: 1.9, doorX0: -0.75, doorX1: 0.45, doorH: 1.4, wall: 0.05 };
function shedWalls() {
  const L = [], hx = SHED.w / 2, hz = SHED.d / 2, step = 0.1, put = (x, z) => L.push([x, 0, z, 0.06, SHED.eaves]);
  for (let x = -hx; x <= hx + 1e-6; x += step) put(+x.toFixed(3), -hz);                                      // back
  for (let z = -hz + step; z < hz - 1e-6; z += step) { put(-hx, +z.toFixed(3)); put(hx, +z.toFixed(3)); }     // the sides
  for (let x = -hx; x <= SHED.doorX0 + 1e-6; x += step) put(+x.toFixed(3), hz);                              // front, left of the doorway
  for (let x = SHED.doorX1; x <= hx + 1e-6; x += step) put(+x.toFixed(3), hz);                               // front, right of it
  return L;
}

export const KIND_POSTS = {
  // props-gorge.js bridgerope: four 1.3 m posts, 0.08 thick with hand-rope turns to 0.092 (DESIGN 2)
  bridgerope: [[-0.9, 0, 0.5, 0.092, 1.3], [0.9, 0, 0.5, 0.092, 1.3], [-0.9, 0.4, -9.5, 0.092, 1.3], [0.9, 0.4, -9.5, 0.092, 1.3]],
  gardenshed: shedWalls(),
};

// the posts of one storyboard prop in world coordinates: [{ x, y, z, r, h }]
export function postsOf(p) {
  const list = KIND_POSTS[p.kind];
  if (!list) return [];
  const k = p.scale ?? 1, a = ((p.rot ?? 0) * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  return list.map(([x, y, z, r, h]) => ({ x: (p.x ?? 0) + k * (x * c + z * s), y: (p.y ?? 0) + k * y, z: (p.z ?? 0) + k * (-x * s + z * c), r: r * k, h: h * k }));
}
