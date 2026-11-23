// One heavy render at a time on a machine, taken by engine/render.mjs itself (not by an outside `flock`).
// Why: `flock <lock> node engine/render.mjs ... | head` kept the lock after head quit (the pipe's other end held it),
// and every later render waited in silence (Norse myth 01, 22 Nov: builders stuck until the stale pids were killed).
// This lock names its holder (pid + command) while you wait, and a lock whose holder is gone is taken over at once.
// Off on the farm (CI: one render per runner) and with --no-lock or RENDER_LOCK=0.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export const LOCK = process.env.RENDER_LOCK_FILE || path.join(os.tmpdir(), "viral-engine-render.lock");

const alive = (pid) => { try { process.kill(pid, 0); return true; } catch (e) { return e.code === "EPERM"; } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function takeRenderLock({ off = false, file = LOCK, say = console.error } = {}) {
  if (off || process.env.CI || process.env.RENDER_LOCK === "0") return () => {};
  const me = JSON.stringify({ pid: process.pid, cmd: process.argv.slice(1).join(" "), at: Date.now() });
  let told = 0;
  for (;;) {
    try { fs.writeFileSync(file, me, { flag: "wx" }); break; } catch (e) { if (e.code !== "EEXIST") throw e; }
    let held = null; try { held = JSON.parse(fs.readFileSync(file, "utf8")); } catch { /* half written: read again */ }
    if (held && !alive(held.pid)) { try { fs.unlinkSync(file); } catch { /* another waiter took it over */ } continue; }
    if (held && held.pid === process.pid) break;
    if (held && Date.now() - told > 60e3) {
      say(`render lock: waiting for pid ${held.pid} (${Math.round((Date.now() - held.at) / 1000)} s): ${held.cmd.slice(0, 160)}` +
        `\n  (kill it if it is stuck; --no-lock skips the lock)`);
      told = Date.now();
    }
    await sleep(1000);
  }
  const free = () => { try { if (JSON.parse(fs.readFileSync(file, "utf8")).pid === process.pid) fs.unlinkSync(file); } catch { /* gone */ } };
  process.on("exit", free);
  for (const sig of ["SIGINT", "SIGTERM", "SIGHUP", "SIGPIPE"]) process.once(sig, () => { free(); process.exit(128 + (os.constants.signals[sig] || 1)); });
  return free;
}
