// Glove skins meshed in parallel (render-speed-02, 4 Nov 2026). Meshing the seamless skins (handmesh-core.js) was half
// of a full render's time on a 4-core machine: about 115 ms per hand, 8 hands a frame for a cast of four, all on the
// page's one thread while the CPU's other cores waited. Before a frame is drawn, stage.js poses it once to collect the
// skins that need a new mesh (potato.js _skin, collect mode), this pool meshes them on one worker per core, and the
// real pose then takes each finished mesh whose exact shape matches (shapeKey). Anything not ready (a photo's own
// pose, a QA pass, a worker that failed) is meshed on the page as before, so the picture never depends on the pool.
const pool = [];
let next = 0, failed = false;
const waiting = new Map();

function start() {
  if (pool.length || failed || typeof Worker === "undefined") return pool.length > 0;
  try {
    const n = Math.max(1, Math.min(8, (globalThis.navigator && navigator.hardwareConcurrency) || 2));
    for (let i = 0; i < n; i++) {
      const w = new Worker(new URL("./mesh-worker.js", import.meta.url), { type: "module" });
      w.onmessage = (e) => { const r = waiting.get(e.data.id); if (r) { waiting.delete(e.data.id); r.ok(e.data.m); } };
      w.onerror = (e) => { e.preventDefault?.(); failed = true; for (const r of waiting.values()) r.bad(new Error(`mesh worker: ${e.message}`)); waiting.clear(); };
      pool.push(w);
    }
  } catch { failed = true; pool.length = 0; }
  return pool.length > 0;
}

// the grid cells a shape's box spans: the meshing time grows with it (a fist's rolled fingers took three times an
// open hand's 100 ms)
function size(j) {
  const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity], s = j.shape;
  for (const c of [...s.arm, ...s.palm, ...s.digits.flat(), ...(s.cuff || [])]) for (let i = 0; i < 3; i++) { lo[i] = Math.min(lo[i], c.lo[i]); hi[i] = Math.max(hi[i], c.hi[i]); }
  return ((hi[0] - lo[0]) * (hi[1] - lo[1]) * (hi[2] - lo[2])) / j.h ** 3;
}

// jobs: [{ key, shape, h }] -> Map key -> mesh arrays (the same shape twice is meshed once). The biggest shapes go
// first and each worker takes the next job when it is free, so a slow fist doesn't start last and hold up the frame.
export async function meshAll(jobs) {
  const ready = new Map();
  if (!jobs.length || !start()) return ready;
  const queue = [...new Map(jobs.map((j) => [j.key, j])).values()].map((j) => ({ j, n: size(j) })).sort((a, b) => b.n - a.n).map((x) => x.j);
  const run = async (w) => {
    for (let j; (j = queue.shift()); ) {
      const id = next++;
      const m = await new Promise((ok, bad) => { waiting.set(id, { ok, bad }); w.postMessage({ id, shape: j.shape, h: j.h }); });
      ready.set(j.key, m);
    }
  };
  // a failed worker only costs speed: whatever it didn't mesh is meshed on the page
  try { await Promise.all(pool.map(run)); } catch (e) { console.log(`diag: ${e.message}; meshing on the page instead`); }
  return ready;
}
