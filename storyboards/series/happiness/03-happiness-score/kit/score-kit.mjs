// "I could see everyone's happiness score" (Happiness 03, YouTube film ~3:20 + four tall parts): the helpers every block
// builds from, so four blocks get ONE timeline, one Spud score, one colour arc, one HUD, one voice, one look per place.
// Story: ../OUTLINE.md (Jonny OK 16 Nov 2026). Every number of the look: ../DESIGN.md (Fable 5.2) sections 2-7.
// Places: real 3D sets (Jonny 16 Nov: no projected plates), engine/page/set-score-*.js; each exports a constants object
// (stand spots, cameras) read straight from here. Director notes per place: ../briefs/DIRECTOR-NOTES.md.
//
// STORY TIME vs CLIP TIME: every key below is in STORY time (seconds from the film's frame 0). A block writes one storyboard
// per place (a set is one type per storyboard), each starting at story time T0; at(T0, keys) shifts story keys to clip time.
import { STREET } from "../../../../../engine/page/set-score-street.js";
import { HALL } from "../../../../../engine/page/set-score-hall.js";
import { BAKERY } from "../../../../../engine/page/set-score-bakery.js";
import { RIVER } from "../../../../../engine/page/set-score-river.js";
import { ROOM } from "../../../../../engine/page/set-score-room.js";
import { HILL, viaductLine } from "../../../../../engine/page/set-score-hill.js";
import { ROAD } from "../../../../../engine/page/set-score-road.js";
import { BALCONY } from "../../../../../engine/page/set-score-balcony.js";
import { WALL } from "../../../../../engine/page/set-score-wall.js";
export { STREET, HALL, BAKERY, RIVER, ROOM, HILL, ROAD, BALCONY, WALL, viaductLine };

export const r3 = (x) => Math.round(x * 1000) / 1000;

// ---------------------------------------------------------------- frames (wide = the film, the master; tall = the parts)
export const FRAME = {
  wide: { key: "wide", sb: { frame: "wide" }, W: 1920, H: 1080, SUB: 128, subSize: 54, CARD: 180 },
  tall: { key: "tall", sb: {}, W: 1080, H: 1920, SUB: 316, subSize: 62, CARD: 300 },
};

// ---------------------------------------------------------------- the blocks (story time; a block may end a few s off: tell the director)
export const BLOCK = { open: [0, 17.2], a: [17.2, 50], b: [50, 100], c: [100, 150], d: [150, 200] };

// ---------------------------------------------------------------- the places: one set spec each (light from the place's bench)
export const SETS = {
  street: { type: "scorestreet", light: "golden", key: [6.5, 3.4, 3.0], shadowSize: 9, windows: false },
  hall: { type: "scorehall", light: "golden", key: [-3.0, 6.0, -6.2], shadowSize: 6, windows: false },
  bakery: { type: "scorebakery", rain: false, light: "golden", key: [-5.5, 3.6, 4.5], shadowSize: 9, windows: false },
  bakeryRain: { type: "scorebakery", rain: true, light: "dusk-rain", shadowSize: 9, windows: false },
  river: { type: "scoreriver", view: "path", light: "golden", key: [3.5, 5, 4.5], shadowSize: 12, windows: false },
  bridge: { type: "scoreriver", view: "bridge", light: "golden", key: [3.5, 5, 4.5], shadowSize: 12, windows: false },
  wall: { type: "scorewall", windows: false },
  kitchen: { type: "kitchen", morning: true },
  party: { type: "scoreroom", state: "party", light: "golden", key: [-1.5, 2.2, 4.0], shadowSize: 5, windows: false },
  sunday: { type: "scoreroom", state: "sunday", key: [-1.5, 2.2, 4.0], shadowSize: 5, windows: false },
  balcony: { type: "scorebalcony", night: true, key: [-3, 4, 3], shadowSize: 8 },
  road: { type: "scoreroad", light: "golden", key: [5, 3.6, 3], shadowSize: 12, windows: false },
  hillGold: { type: "scorehill", time: "golden", light: "golden", key: [-1.2, 3.3, -4.2], shadowSize: 9, windows: false },
  hillSunset: { type: "scorehill", time: "sunset", light: "golden", key: [-2.2, 1.6, -4.6], shadowSize: 9, windows: false },
};

// ---------------------------------------------------------------- the cast (ids stay the same in every block)
// Spud's copy outfit (08-12) = character happiness/spud-copy. Extras: happiness/mover, driver, baker (worn props: flatcap,
// toque, waiterapron: props-score-small.js). The dog (01) is a painted card. Kid Spud / kid Mash exist only in the memory plates.
export const CAST = {
  spud: "potatobrawl/spud", spudcopy: "happiness/spud-copy", mash: "potatobrawl/mash", chip: "potatobrawl/chip",
  wedge: "potatobrawl/wedge", mover: "happiness/mover", driver: "happiness/driver", baker: "happiness/baker",
};

// ---------------------------------------------------------------- the scores (story time) DESIGN 3
export const SPUD = [[0, 41], [42, 40], [44, 39], [51, 38], [55, 37], [59, 36], [74, 35], [79, 34], [84, 33], [89, 32], [95, 31], [100, 30], [156, 29]];
export const SCORES = { mash: [[0, 88], [86, 86], [88, 84]], mover: 63, dog: 97, baker: 71, chip: 93, wedge: 82, kid: 90 };
export const spudAt = (T) => SPUD.filter(([t]) => t <= T + 1e-6).pop()[1];
// keys [[t, v, dur?]] in story time -> clip time for a storyboard that starts at story time T0 (keys before T0 collapse to 0)
export const at = (T0, keys) => {
  const out = [];
  for (const [t, v, d] of keys) { const u = r3(t - T0); if (u <= 0) { out.length = 0; out.push([0, v]); } else out.push(d != null ? [u, v, d] : [u, v]); }
  return out;
};

// ---------------------------------------------------------------- the HUD (DESIGN 4): "hud": hudFor(T0)
export const TRAIN = [[11.6, "SUN 19:42"], [100, "09:12"], [150, "00:58"], [156, "00:41", 4], [162, "00:22", 4], [172, "00:12", 3], [186, "00:03", 3], [190, "00:00", 3]];
export const OWN_OUT = 172;   // the own chip fades over 0.5 s as the glasses lift (2:52); the train chip fades 3:14-3:15
export const hudFor = (T0, T1) => {
  const own = T0 < OWN_OUT ? { keys: at(T0, SPUD), ...(T1 > OWN_OUT && { out: [r3(OWN_OUT - T0), 0.5] }) } : null;
  const train = T1 > TRAIN[0][0] && T0 < 195 ? { keys: at(T0, TRAIN) } : null;   // slides in at its first key (11.6: Mash at the door, 04)
  return { ...(own && { own }), ...(train && { train }) };
};

// ---------------------------------------------------------------- the colour arc (DESIGN 5): "grade": gradeFor(T0, T1)
export const scoreGrade = (score) => ({ s: r3(1.10 - 0.055 * (41 - score)), w: r3(0.6 - 0.1 * (41 - score)) });
// fixed grades that are not Spud's (balcony, memory, flood, sunset): pass them yourself as keys in story time
export const GRADE_FIXED = { partyWarm: { s: 1.12, w: 0.8 }, balcony: { s: 0.90, w: 0 }, memory: { s: 1.0, w: 0 }, flood: { s: 1.16, w: 0.8 }, sunset: { s: 1.18, w: 0.9 }, last: { s: 1.12, w: 0.8 } };
// Spud's arc keyed on his score changes; a check's step lands inside its glasses-view cut (pass the cut's end as `when`)
export const gradeFor = (T0, extra = []) => at(T0, [...SPUD.map(([t, v]) => [t, scoreGrade(v)]), ...extra].sort((a, b) => a[0] - b[0]));
// the grade of one storyboard with its glasses-view windows (story time): views [[from, to], ...] get { glasses: true }; every
// other key sets s, w, c and lift (a glasses key changes c and lift too, so the key after a view must put them back)
export const LOOK_C = 1.03;
export function gradeOf(T0, views = [], extra = []) {
  const keys = [...SPUD.map(([t, v]) => [t, scoreGrade(v)]), ...extra].sort((a, b) => a[0] - b[0]);
  const base = (t) => keys.filter(([k]) => k <= t + 1e-6).pop()?.[1] ?? scoreGrade(41);
  const inView = (t) => views.some(([a, b]) => t >= a - 1e-6 && t < b - 1e-6);
  const out = keys.filter(([t]) => !inView(t)).map(([t, g, d]) => (d != null ? [t, { c: LOOK_C, lift: 0, ...g }, d] : [t, { c: LOOK_C, lift: 0, ...g }]));
  for (const [a, b] of views) { out.push([a, { glasses: true }]); out.push([b, { c: LOOK_C, lift: 0, ...base(b) }]); }
  return at(T0, out.sort((x, y) => x[0] - y[0]));
}
// the "score" overlay of one storyboard (story time in, clip time out): views [[from, to]], tags [{ who, keys | score, ...rest }]
// (keys in story time; show / minusCard in story time too)
export function scoreOf(T0, views, tags) {
  const sh = (t) => r3(t - T0);
  return {
    view: views.map(([a, b]) => [Math.max(0, sh(a)), sh(b)]),
    tags: tags.map(({ keys, score, show, minusCard, ...o }) => ({ ...o, keys: keys ? at(T0, keys) : [[0, score]],
      ...(show && { show: show.map((t) => Math.max(0, sh(t))) }), ...(minusCard && { minusCard: minusCard.map(sh) }) })),
  };
}

// ---------------------------------------------------------------- voices
// Narrator = voice 1 "deep storyteller" (engine/voice/voices.json "narrator"), speaks to the viewer as "you", never over a
// character line (one voice at a time). Characters speak captioned gibberish (c.say: talk action + subtitle).
export const NARRATOR = "narrator-brisk";   // Jonny 16 Nov: 10% faster than voice 1 (voices.json "narrator-brisk" = "narrator" + tempo 1.1). Voice 1 "deep storyteller" (VoxCPM2 on Reaper's clip, engine/voice/README.md "Narrators"), as in the money redo
export const narrate = (c, F, t, line, dur, o = {}) =>
  c.at(r3(t), { macro: "narrate", line, voice: NARRATOR, take: 1, dur, caption: true, pos: F.SUB, gain: o.gain ?? 4.0, ...o });   // gain 4: the money redo's narrator level (Jonny OK)
export const say = (c, F, t, who, line, dur, tone = "calm", o = {}) => c.say(r3(t), who, line, dur, tone, { voice: false, sub: line, pos: F.SUB, ...o });
// a text card (DESIGN 4): pale gold, CapBlack, never over a face or a tag (take pos from qa/camfit.mjs)
export const card = (c, F, t0, t1, text, size = 150, pos = F.CARD) => c.cap(r3(t0), r3(t1), text, pos, false, { size, kinetic: false, color: "#f3dc8c", stroke: "#24232b" });

// ---------------------------------------------------------------- music (library takes in assets/music/ai; each block's animatic picks
// from its row; the film's score is joined by the director at the end). Realistic sounds only, no chime on a -1.
// THE FILM'S SCORE (Jonny 16 Nov: one piece must not restart at a block seam): every segment plays its slice of
// assets/music/score-film/hs03-score.ogg (built by kit/score.py, the table there is the recipe), T0 = the segment's story start.
export const SCORE = (T0, o = {}) => ({ file: "score-film/hs03-score.ogg", from: 0, skip: r3(T0), seam: true, gain: 0.55, lowCut: 90, dip: false, duck: { voice: -6 }, lock: false, ...o });
// ONE LEVEL for every segment of the film (Jonny 16 Nov, music jumping at seams): each segment levelled on its own lifted
// the music up to 16 dB where no narrator spoke; sound.level fixes the lift (engine/sfx/guard.mjs), the join levels the film
export const LEVEL = -9.7;
export const MUSIC = {
  open: ["sneaky"], a: ["sneaky", "sad"], b: ["sad", "calm-landscape"], c: ["sad", "elegant-reveal"], d: ["drama-swell", "sos-warm", "calm-landscape"],
};
// THE TUNE (Mash 0:03 + 2:36, kid Spud 2:05, Spud first 2:58): the engine's whistled tune, sfx "whistletune" (engine/audio.mjs, dur ~1.8-2.2),
// gain ~0.3 under a narrator line, 0.5 alone. The same 8 notes every time, so it reads as THEIR tune.
export const tune = (c, t, o = {}) => c.sfx(r3(t), "whistletune", { gain: 0.45, dur: 2.0, reason: "THE TUNE: their old tune, whistled", ...o });

// ---------------------------------------------------------------- the four tall parts: own hook in the first 2 s (OUTLINE "Parts")
export const PART_HOOKS = {
  a: { voice: "These glasses show everyone's happiness score. Yours is forty-one.", text: "41" },
  b: { voice: "Every time you check your happiness, it drops.", text: "-1" },
  c: { voice: "His best friend's secret was in a box marked DON'T KEEP.", text: "DON'T KEEP" },
  d: { voice: "One hour left with his best friend, and he's still counting.", text: "00:58" },
};
