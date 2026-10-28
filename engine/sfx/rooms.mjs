// The room each set sounds like: a reverb per set instead of one small room for every clip. A kitchen is a small
// soft room, the lift a tight metal box, the bathroom bright tiles, the haunted house a big hall, and outdoors is
// nearly dry with only a slap off a wall or the ground.
//
// The reverb is a Freeverb-style network (8 damped combs into 4 all-passes per channel, the right channel's delays
// spread a little for width) with a pre-delay and a few early reflections in front. Each comb's feedback comes from
// the room's decay time (rt, seconds to fall 60 dB) and the tail is scaled so its energy sits `wet` dB under the dry
// sound for a single click (after the room's own filters), so rooms with long and short tails can be compared by that one number. For reference,
// the old single small room was about -31 dB with a 0.6 s tail (barely there).
//
// Claude can't hear this: the presets are set by measurement (decay, level), and whether a room sounds right is
// Jonny's call. sound.room names a preset for a clip, sound.reverb (old knob, 0.12 = default) scales the tail.
import { SR, biquad, run } from "./dsp.mjs";

// rt: decay to -60 dB of the low mids (s; highs die sooner, by damp); size: scales the comb and early delays (1 = Freeverb's own); damp: 0 bright .. 1 dull
// (high frequencies die faster); pre: pre-delay before the tail (s); wet: tail energy under the dry sound (dB);
// er: the early reflections' energy under the dry sound (dB); early: when they come [ms, relative gain]; hp: low cut on what goes into the room (Hz)
export const ROOMS = {
  room:      { rt: 0.45, size: 0.55, damp: 0.45, pre: 0.008, wet: -22, er: -20, early: [[7, 0.16], [11, 0.12], [17, 0.08]], hp: 220, about: "a small furnished room: kitchen, flat, bedroom" },
  livingroom:{ rt: 0.55, size: 0.7, damp: 0.55, pre: 0.01, wet: -21, er: -21, early: [[9, 0.14], [14, 0.1], [22, 0.07]], hp: 220, about: "a bigger soft room: living room, party, restaurant" },
  office:    { rt: 0.4, size: 0.75, damp: 0.75, pre: 0.012, wet: -24, er: -24, early: [[10, 0.1], [18, 0.07]], hp: 250, about: "carpet, ceiling tiles and desks: short and dull" },
  box:       { rt: 0.32, size: 0.22, damp: 0.15, pre: 0.002, wet: -17, er: -12, early: [[3, 0.3], [4.5, 0.24], [6.5, 0.2], [9, 0.14]], hp: 300, about: "a lift: a tight metal box, bright, boxy reflections" },
  tiles:     { rt: 0.9, size: 0.45, damp: 0.12, pre: 0.004, wet: -15, er: -14, early: [[4, 0.25], [7, 0.2], [10, 0.15], [15, 0.1]], hp: 250, about: "a bathroom: hard tiles, bright and ringing" },
  classroom: { rt: 0.7, size: 0.9, damp: 0.4, pre: 0.014, wet: -20, er: -20, early: [[12, 0.12], [21, 0.09]], hp: 220, about: "a classroom: hard walls, some soft things" },
  hall:      { rt: 1.4, size: 1.1, damp: 0.3, pre: 0.022, wet: -16, er: -20, early: [[18, 0.12], [31, 0.09], [44, 0.06]], hp: 200, about: "a gym or a hall: big and hard" },
  manor:     { rt: 1.8, size: 1.2, damp: 0.45, pre: 0.028, wet: -14, er: -20, early: [[21, 0.1], [37, 0.08], [55, 0.06]], hp: 180, about: "the haunted house: big old rooms, a long dark tail" },
  cottage:   { rt: 0.5, size: 0.6, damp: 0.6, pre: 0.008, wet: -22, er: -21, early: [[8, 0.14], [13, 0.1]], hp: 220, about: "a wooden cottage: warm, short" },
  porch:     { rt: 0.25, size: 0.5, damp: 0.6, pre: 0.004, wet: -30, er: -20, early: [[14, 0.16]], hp: 250, about: "outside a front door: one slap off the house" },
  street:    { rt: 0.35, size: 0.9, damp: 0.5, pre: 0.01, wet: -28, er: -20, early: [[38, 0.12], [61, 0.07]], hp: 250, about: "a street or a rooftop: echoes off buildings" },
  forest:    { rt: 0.55, size: 0.9, damp: 0.8, pre: 0.012, wet: -27, er: -28, early: [[23, 0.06], [41, 0.05]], hp: 300, about: "a forest: soft, scattered, dull" },
  open:      { rt: 0.15, size: 0.5, damp: 0.7, pre: 0.006, wet: -36, er: -30, early: [[6, 0.07]], hp: 300, about: "open air (meadow, hills, park, garden): nearly dry" },
};

// the room of each set (engine/page/set-*.js); a set not listed is outdoors: street-like names get "street", the rest "open"
export const SET_ROOMS = {
  kitchen: "room", apartment: "room", bedroom: "room", livingroom: "livingroom", party: "livingroom", restaurant: "livingroom",
  office: "office", elevator: "box", bathroom: "tiles", classroom: "classroom", gym: "hall", haunted: "manor",
  cottage: "cottage", porch: "porch", rooftop: "street", street: "street", forest: "forest",
  meadow: "open", hills: "open", park: "open", garden: "open", backyard: "open",
};

// { name, how, ...preset }: how is "storyboard" (sound.room), "set" (SET_ROOMS) or "guess"
export function roomOf(sb) {
  const type = sb.set?.type || "", pick = sb.sound?.room;
  const name = pick && ROOMS[pick] ? pick : SET_ROOMS[type] ?? (/street|road|city|stop|roof|station/.test(type) ? "street" : "open");
  if (pick && !ROOMS[pick]) console.warn(`sound.room "${pick}" is not a room (${Object.keys(ROOMS).join(" ")}), using "${name}"`);
  return { name, how: pick && ROOMS[pick] ? "storyboard" : SET_ROOMS[type] ? "set" : "guess", ...ROOMS[name] };
}

const COMBS = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617], APS = [556, 441, 341, 225], SPREAD = 23;

// the late tail of one channel (no dry, no early reflections), unscaled
function tail(x, room, spread) {
  const k = room.size, combs = COMBS.map((n) => {
    const len = Math.max(8, Math.round(n * k) + spread);
    return { b: new Float32Array(len), i: 0, s: 0, g: Math.pow(10, (-3 * len) / (room.rt * SR)) };
  });
  const aps = APS.map((n) => ({ b: new Float32Array(Math.max(4, Math.round(n * Math.max(0.5, k)) + spread)), i: 0 }));
  const d = room.damp, out = new Float32Array(x.length);
  for (let j = 0; j < x.length; j++) {
    let y = 0;
    for (const c of combs) { const o = c.b[c.i]; c.s = o * (1 - d) + c.s * d; c.b[c.i] = x[j] + c.s * c.g; c.i = (c.i + 1) % c.b.length; y += o; }
    for (const a of aps) { const o = a.b[a.i]; a.b[a.i] = y + o * 0.5; y = o - y; a.i = (a.i + 1) % a.b.length; }
    out[j] = y;
  }
  return out;
}

// the tail's level for one click, so `wet` means the same in every room (cached per preset)
const SCALE = new Map();
function tailScale(room) {
  const key = JSON.stringify([room.rt, room.size, room.damp, room.hp]);
  if (!SCALE.has(key)) {
    const x = new Float32Array(Math.round(SR * Math.min(4, room.rt * 1.5 + 0.2))), hp = biquad("hp", room.hp ?? 200, 0.7), lp = biquad("lp", 9000, 0.7);
    for (let i = 0; i < x.length; i++) x[i] = run(lp, run(hp, i === 0 ? 1 : 0));
    let e = 0; for (const v of tail(x, room, 0)) e += v * v;
    SCALE.set(key, 1 / Math.sqrt(e || 1));
  }
  return SCALE.get(key);
}

// the room's sound for a stereo signal: returns { L, R } with only the reverb (early reflections + tail), to add to
// the dry mix. send scales it (voices 1, effects less). The input is summed to mono and filtered (low cut), then each
// channel gets its own slightly different network, so the tail is wide even for a sound panned to the middle.
export function roomSound(L, R, room, send = 1) {
  const n = L.length, outL = new Float32Array(n), outR = new Float32Array(n);
  const g = Math.pow(10, room.wet / 20) * send;
  if (g <= 1e-5) return { L: outL, R: outR };
  const hp = biquad("hp", room.hp ?? 200, 0.7), lp = biquad("lp", 9000, 0.7), x = new Float32Array(n);
  let any = false;
  for (let i = 0; i < n; i++) { x[i] = run(lp, run(hp, (L[i] + R[i]) * 0.5)); if (x[i]) any = true; }
  if (!any) return { L: outL, R: outR };
  const pre = Math.round(room.pre * SR), s = tailScale(room) * g, early = room.early || [];
  const eg = Math.pow(10, (room.er ?? -60) / 20) * send / Math.sqrt(early.reduce((a, [, w]) => a + w * w, 0) || 1);
  [[outL, 0, 1], [outR, SPREAD, -1]].forEach(([out, spread, side]) => {
    const t = tail(x, room, spread);
    for (let i = 0; i + pre < n; i++) out[i + pre] += t[i] * s;
    // early reflections alternate sides a little, like walls left and right
    early.forEach(([ms, w0], k) => {
      const d = Math.round((ms / 1000) * SR), w = w0 * eg * (1 + 0.25 * side * (k % 2 ? -1 : 1));
      for (let i = 0; i + d < n; i++) out[i + d] += x[i] * w;
    });
  });
  return { L: outL, R: outR };
}
