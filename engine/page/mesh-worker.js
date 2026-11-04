// A worker that meshes glove skins (handmesh-core.js meshArrays) for mesh-pool.js. Same code as the page's own
// meshing, so the same shape gives the same numbers here as on the page.
import { meshArrays } from "./handmesh-core.js";

self.onmessage = (e) => {
  const { id, shape, h } = e.data, m = meshArrays(shape, h);
  self.postMessage({ id, m }, [m.pos.buffer, m.nrm.buffer, m.ink.buffer, m.idx.buffer]);
};
