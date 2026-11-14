// Set obstacles a floor plan can't see (14 Nov 2026): a set kind can draw solid things inside its one mesh (the gorge's bridge
// posts) that no storyboard footprint describes, so qa/clear.mjs passed Chip being pulled through a post that Jonny saw in the
// final (There's a catch EP09b). Each kind lists its upright posts in its own frame: [x, y, z, r, h] = the foot of the post,
// its radius and height in metres. The kind's builder reads the same list (one source), and qa/clear.mjs checks every body
// standing between the post's foot and its top against it, moved with the prop's x, y, z, rot and scale.
export const KIND_POSTS = {
  // props-gorge.js bridgerope: four 1.3 m posts, 0.08 thick with hand-rope turns to 0.092 (DESIGN 2)
  bridgerope: [[-0.9, 0, 0.5, 0.092, 1.3], [0.9, 0, 0.5, 0.092, 1.3], [-0.9, 0.4, -9.5, 0.092, 1.3], [0.9, 0.4, -9.5, 0.092, 1.3]],
};

// the posts of one storyboard prop in world coordinates: [{ x, y, z, r, h }]
export function postsOf(p) {
  const list = KIND_POSTS[p.kind];
  if (!list) return [];
  const k = p.scale ?? 1, a = ((p.rot ?? 0) * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  return list.map(([x, y, z, r, h]) => ({ x: (p.x ?? 0) + k * (x * c + z * s), y: (p.y ?? 0) + k * y, z: (p.z ?? 0) + k * (-x * s + z * c), r: r * k, h: h * k }));
}
