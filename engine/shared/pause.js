// Pause time (the "What if your friend could..." format, 8 Nov 2026): the world stops for everyone but the keepers,
// who walk around in it, then it carries on from where it stopped.
//
//   "pause": [{ "from": 1.2, "to": 3.1, "keep": ["vik"], "look": "grey", "origin": "vik",
//               "props": [{ "id": "cup", "from": 5.4, "to": 6.4 }] }]
//
// Clocks. Everything is still written in clip time (what you see on screen). A frozen actor plays its timeline on its
// own clock, which stops inside each pause that doesn't keep it and runs on after it: tau(t) = t minus the paused time
// before t. Its actions are moved onto that clock (pauseView), so an action written at clip time T still plays at T on
// screen, an action running when the pause starts is held mid-way (a hand mid-swing, a cup mid-fall stays where it
// was) and finishes after it, and its idle (breathing, blinks, flames, wings) stops too. The set's life (wind, clouds,
// birds), a prop's own idle (steam) and particle effects run on the world clock (worldTime: stopped in every pause).
// The keepers, the camera, captions, sounds, flashes and physics run on clip time; physics bodies are stopped with a
// "settle" physics action at the pause's start (a keeper can then take one out of the air: a grab ends the bake).
//
// Look (stage.js, the frame's 2D composite): "grey" drains the colour out of everything but the keepers (and the
// props listed in `props` while they're listed: what a keeper carries), cooler and a little darker, spreading from the
// keeper `origin` as a ring over `wave` seconds; at the end the colour floods back out from them over `back` seconds.
// "dark": every light stops, so the frame goes black but the keepers' eyes (the eye whites, irises and lids: what
// still sees). "none": the world stops without a look.
//
// "Your friend pauses YOU" (There's a catch EP08, 13 Nov 2026): `world: false` keeps the world clock running through the
// window (worldTime ignores it: set life, prop idles, particle effects play on), so only the cast it doesn't keep stop.
// `look: "frozen"` is the inverse of "grey": ONLY the actors the window freezes (cast not in `keep`, plus the props
// listed in `props`: what the frozen actor holds) go grey-cool, the keepers, set and props stay in colour. It spreads
// over the frozen body from `hit` ([x, y, z] world metres; default the first frozen actor's chest) as a ring over
// `wave` s (0.12) and floods back from `thawHit` (default `hit`) over `back` s (0.15). grade: sat 0.35, bright 0.94,
// contrast 0.95, tint "#9fb4d8" mixed in at tintK 0.18.
//
// Pure and deterministic: shared by Node (load.mjs checks) and the page (timeline.js, stage.js).

const r6 = (x) => Math.round(x * 1e6) / 1e6;

// sb.pause -> [{ from, to, keep: Set, props, look, origin, wave, back, grade }], sorted, cached per storyboard
const PLANS = new WeakMap();
export function pausesOf(sb) {
  if (!sb || !Array.isArray(sb.pause) || !sb.pause.length) return null;
  let P = PLANS.get(sb);
  if (P) return P;
  P = sb.pause.map((p) => {
    const look = p.look ?? "grey", fr = look === "frozen";
    return {
      from: p.from, to: p.to, keep: new Set([].concat(p.keep || [])), props: p.props || [], look,
      origin: p.origin ?? [].concat(p.keep || [])[0] ?? null, wave: p.wave ?? (fr ? 0.12 : 0.3), back: p.back ?? (fr ? 0.15 : 0.2), grade: p.grade || {},
      world: p.world !== false, hit: p.hit ?? null, thawHit: p.thawHit ?? p.hit ?? null,
    };
  }).sort((a, b) => a.from - b.from);
  PLANS.set(sb, P);
  return P;
}

// the paused time before t of the windows `ws` (each counts from its start up to t)
const pausedBefore = (ws, t) => ws.reduce((s, w) => s + Math.max(0, Math.min(t, w.to) - w.from), 0);

// the world's clock: stopped in every pause that stops the world (all but `world: false`)
export function worldTime(sb, t) {
  const P = pausesOf(sb);
  return P ? r6(t - pausedBefore(P.filter((w) => w.world), t)) : t;
}

// the windows that freeze actor `id` (every pause that doesn't keep it), or null
export function freezesOf(sb, id) {
  const P = pausesOf(sb);
  if (!P) return null;
  const ws = P.filter((w) => !w.keep.has(id));
  return ws.length ? ws : null;
}

// actor id's own clock
export function actorTime(sb, id, t) {
  const ws = freezesOf(sb, id);
  return ws ? r6(t - pausedBefore(ws, t)) : t;
}

// is actor id frozen at clip time t
export function frozenAt(sb, id, t) {
  const ws = freezesOf(sb, id);
  return !!ws && ws.some((w) => t >= w.from && t < w.to);
}

// the storyboard as a frozen actor's clock sees it: every actor action moved onto the clock of the windows that
// freeze `id` (all actors with the same windows share one view, so a frozen actor's contact solver sees its frozen
// neighbours where they really are). Props, physics, effects, shots and captions keep clip time.
const VIEWS = new WeakMap();
export function pauseView(sb, id) {
  const ws = freezesOf(sb, id);
  if (!ws) return null;
  let per = VIEWS.get(sb);
  if (!per) { per = new Map(); VIEWS.set(sb, per); }
  const key = ws.map((w) => `${w.from}-${w.to}`).join("|");
  let v = per.get(key);
  if (!v) {
    const tau = (t) => r6(t - pausedBefore(ws, t));
    const actions = (sb.actions || []).map((a) => (a.who != null && a.at != null ? { ...a, at: tau(a.at) } : a));
    v = { sb: { ...sb, actions, __pauseBase: sb, __pauseView: key }, tau };
    per.set(key, v);
  }
  return v;
}

// how far the look has spread at clip time t: { w, look, origin, ring: 0..1 (the wave's front, 0 at the keeper, 1 past
// the frame's far corner), back: 0..1 (how far the colour has flooded back out) }, or null outside every pause
export function pauseLookAt(sb, t) {
  const P = pausesOf(sb);
  if (!P) return null;
  for (const w of P) {
    if (w.look === "none" || t < w.from || t >= w.to + w.back) continue;
    const ring = w.wave > 0 ? Math.min(1, (t - w.from) / w.wave) : 1;
    const back = t < w.to ? 0 : w.back > 0 ? Math.min(1, (t - w.to) / w.back) : 1;
    if (back >= 1) continue;
    return { w, look: w.look, origin: w.origin, ring, back };
  }
  return null;
}

// the props a pause keeps in colour at t (what a keeper carries; for "frozen": the props that go grey with the frozen)
export function keptProps(w, t) { return w.props.filter((p) => t >= (p.from ?? w.from) && t < (p.to ?? w.to)).map((p) => p.id); }

// load.mjs: windows inside the clip, in order, not overlapping, keepers that exist
export function checkPauses(sb) {
  const P = pausesOf(sb);
  if (!P) return [];
  const ids = new Set((sb.cast || []).map((c) => c.id)), props = new Set((sb.props || []).map((p) => p.id)), err = [];
  P.forEach((w, i) => {
    if (!(w.to > w.from)) err.push(`pause ${i}: to (${w.to}) must be after from (${w.from})`);
    if (w.from < 0 || w.to > (sb.duration ?? Infinity)) err.push(`pause ${i}: ${w.from}-${w.to} s is outside the clip`);
    if (i && w.from < P[i - 1].to + (P[i - 1].back ?? 0)) err.push(`pause ${i}: starts before pause ${i - 1} has ended`);
    for (const k of w.keep) if (!ids.has(k)) err.push(`pause ${i}: keeper "${k}" is not in the cast`);
    if (w.origin && !ids.has(w.origin)) err.push(`pause ${i}: origin "${w.origin}" is not in the cast`);
    for (const p of w.props) if (!props.has(p.id)) err.push(`pause ${i}: prop "${p.id}" is not in the props`);
    if (!["grey", "dark", "none", "frozen"].includes(w.look)) err.push(`pause ${i}: look "${w.look}" (grey, dark, frozen or none)`);
    for (const k of ["hit", "thawHit"]) if (w[k] != null && !(Array.isArray(w[k]) && w[k].length === 3 && w[k].every(Number.isFinite))) err.push(`pause ${i}: ${k} must be [x, y, z] (metres)`);
    if (w.look === "frozen" && ![...ids].some((id) => !w.keep.has(id))) err.push(`pause ${i}: look "frozen" but it keeps the whole cast (nobody to freeze)`);
    // a frozen actor doesn't act inside a pause (its clock is stopped: the action would only start when it ends)
    for (const a of sb.actions || []) if (a.who != null && !w.keep.has(a.who) && a.at > w.from + 1e-6 && a.at < w.to - 1e-6)
      err.push(`pause ${i}: ${a.who} is frozen ${w.from}-${w.to} s but has a "${a.do}" at ${a.at} s`);
  });
  return err;
}
