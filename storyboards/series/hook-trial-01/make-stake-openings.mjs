// Hook trial 1 (12 Nov 2026, storytelling study section 7): "stake-and-clock first line".
// Each finished video gets a new opening: ONLY the narrator's first line and the first on-screen text change, inside
// the first ~3 s. Picture, music, every other line and caption stay as posted. The posted storyboards are read, never
// written: each re-cut is <id>-stake.json in this folder.
//   node storyboards/series/hook-trial-01/make-stake-openings.mjs [key ...]
import fs from "node:fs";
import path from "node:path";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const S = path.join(HERE, "..");

// line: the new first narrator line. at: when it starts (s). drop: narrator lines in the opening it replaces.
// text: the new on-screen stake + clock (upper third). from/to: when it shows. dropCaps: opening captions it replaces.
export const CUTS = {
  "faster-than-sound": {
    src: "what-if/02-library/faster-than-sound-vo.json",
    line: "Ten seconds. Then this whole library is gone.", at: 0,
    drop: ["What if your hyper friend was faster than sound... in a library?"],
    text: "GONE IN *10 SECONDS*", from: 0, to: 0.97, pos: 245,
    dropCaps: ["Too hyper for a library?"],
  },
  "share-or-steal-01": {
    src: "share-or-steal/01-gunslinger-viking/gunslinger-viking.json",
    line: "One brother fries in ten seconds.", at: 0.05,
    drop: ["One pile of gold. One fryer."],
    text: "ONE BROTHER *FRIES*", from: 0, to: 2.3, pos: 250, size: 110,
    dropCaps: ["SHARE OR *STEAL*"],
  },
  "fff-01": {
    src: "fight-flight-freeze/01-bank-robbery/fff-01-bank-robbery.json",
    line: "Only one of you escapes.", at: 0,
    drop: ["You just robbed a bank.", "You're hiding."],
    text: "ONLY ONE *ESCAPES*", from: 0, to: 2.866, pos: 520,
    dropCaps: ["You just robbed a bank.", "You're hiding."],
  },
  "pause-time": {
    src: "what-if/01-pause-time/pause-time-vo.json",
    line: "Your late friend stops time. Once too often.", at: 1.07,
    drop: ["What if you could pause time?"],
    text: "ONCE TOO *OFTEN*", from: 0, to: 3.1, pos: 300,
    dropCaps: ["Late for the photo?", "What if you could pause time?"],
  },
  "hot-potato-01": {
    src: "hot-potato/01-hot-potato/hot-potato-01.json",
    line: "Your friend fries in one second.", at: 0.02,
    drop: ["Hold the coal at zero, and you fry."],
    text: "AT ZERO, HE *FRIES*", from: 1.28, to: 2.56, pos: 300,
    dropCaps: ["Hold the coal at zero,\nand *YOU FRY.*"],
  },
  "plane-crash-a": {
    src: "you-wake-up-mid/01-plane-crash/wake-up-mid-plane-crash-a.json",
    line: "You wake up mid plane crash. Ninety seconds to live.", at: 0.05,
    drop: ["You wake up mid plane crash."],
    text: "*90 SECONDS* TO LIVE", from: 1, to: 2.47, pos: 262,
    dropCaps: ["mid plane crash."],
  },
};

export function recut(key) {
  const c = CUTS[key];
  const sb = JSON.parse(fs.readFileSync(path.join(S, c.src), "utf8"));
  let first;
  for (const [bi, b] of sb.beats.entries()) {
    b.do = b.do.filter((d) => {
      if (d.macro !== "narrate" || !c.drop.includes(d.line) || (b.at ?? 0) + (d.at ?? 0) > 3.5) return true;
      first ??= { bi, d };
      return false;
    });
  }
  if (!first) throw new Error(`${key}: opening narrator line not found`);
  const d0 = first.d;
  // the new line goes in beat 0 at the given time, in the video's own narrator voice, style and gain
  const line = { macro: "narrate", line: c.line, voice: d0.voice, ...(d0.style ? { style: d0.style } : {}),
    take: c.take ?? 0, caption: false, ...(d0.gain != null ? { gain: d0.gain } : {}), at: c.at };
  sb.beats[0].do.push(line);
  const old = sb.captions.filter((k) => c.dropCaps.includes(k.text) && k.from < 3.5);
  if (old.length !== c.dropCaps.length) throw new Error(`${key}: opening caption not found`);
  const tmpl = old[0] ?? {};
  sb.captions = sb.captions.filter((k) => !old.includes(k));
  sb.captions.push({ ...Object.fromEntries(Object.entries(tmpl).filter(([k]) => !["text", "from", "to", "pos"].includes(k))),
    from: c.from, to: c.to, text: c.text, pos: c.pos, pop: false, ...(c.size ? { size: c.size } : {}) });
  sb.id = `${sb.id}-stake`;
  sb.notes = [...(Array.isArray(sb.notes) ? sb.notes : sb.notes ? [sb.notes] : []),
    `Hook trial 1 re-cut: first line "${c.line}" + text "${c.text}"; everything after 3 s as posted (${c.src}).`];
  const out = path.join(HERE, `${key}-stake.json`);
  fs.writeFileSync(out, JSON.stringify(sb, null, 1) + "\n");
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  for (const k of process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(CUTS)) console.log(recut(k));
}
