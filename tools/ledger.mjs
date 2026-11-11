#!/usr/bin/env node
// The ledger of finished videos, docs/LEDGER.md (10 Nov 2026): one row per video, the same columns every time, so
// "The improvement loop" in docs/rules/workflow.md can compare a video with an earlier one and test each fix.
//
//   node tools/ledger.mjs                 the fix on test and the last three rows (step 1 of the loop)
//   node tools/ledger.mjs --all           every row
//   node tools/ledger.mjs --check         exits 1 when a row doesn't have every column
//   node tools/ledger.mjs add --date 2026-11-12 --video <id> --s 21 --new "set, prop" --lookups 12 --layouts 6
//        --fix-rounds 2 --unseen 1 --renders 1 --waits 3 --steps 240 --min 180 --machine 60
//        --director "Fable 5.2 high" --cost 31 --score 7 --notes "..." --test open
//
// Every flag is needed; an unknown value is "?", never a guess. Reads and writes text only, no dependencies.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "docs", "LEDGER.md");
const FLAGS = ["date", "video", "s", "new", "lookups", "layouts", "fix-rounds", "unseen", "renders", "waits", "steps",
  "min", "machine", "director", "cost", "score", "notes", "test"];
const HEAD = ["date", "video", "s", "new", "lookups", "layouts", "fix rounds", "unseen", "renders", "waits", "steps",
  "min", "machine", "director", "$", "score", "notes", "test"];

const cells = (line) => line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
const lines = fs.readFileSync(FILE, "utf8").split("\n");
const headAt = lines.findIndex((l) => l.startsWith("| date |"));
if (headAt < 0 || cells(lines[headAt]).join("|") !== HEAD.join("|")) {
  console.error(`ledger: ${FILE} has no table with the columns ${HEAD.join(", ")}`); process.exit(1);
}
let end = headAt + 2;
while (end < lines.length && lines[end].startsWith("|")) end++;
const rows = lines.slice(headAt + 2, end);

const argv = process.argv.slice(2);
if (argv[0] === "add") {
  const got = {};
  for (let i = 1; i < argv.length; i += 2) got[argv[i].replace(/^--/, "")] = argv[i + 1];
  const missing = FLAGS.filter((f) => got[f] === undefined || got[f] === "");
  const unknown = Object.keys(got).filter((k) => !FLAGS.includes(k));
  const piped = FLAGS.filter((f) => /[|\n]/.test(got[f] ?? ""));
  if (missing.length || unknown.length || piped.length) {
    if (missing.length) console.error(`ledger: missing ${missing.map((f) => "--" + f).join(" ")} (unknown is "?")`);
    if (unknown.length) console.error(`ledger: no such flag ${unknown.map((f) => "--" + f).join(" ")}`);
    if (piped.length) console.error(`ledger: no "|" or line break in ${piped.map((f) => "--" + f).join(" ")}`);
    process.exit(1);
  }
  lines.splice(end, 0, `| ${FLAGS.map((f) => got[f].trim()).join(" | ")} |`);
  fs.writeFileSync(FILE, lines.join("\n"));
  console.log(`ledger: row ${rows.length + 1} added for ${got.video}`);
} else if (argv[0] === "--check") {
  const bad = rows.map((r, i) => [i + 1, cells(r).length]).filter(([, n]) => n !== HEAD.length);
  for (const [i, n] of bad) console.error(`ledger: row ${i} has ${n} cells, not ${HEAD.length}`);
  if (!bad.length) console.log(`ledger: ${rows.length} rows, all complete`);
  process.exit(bad.length ? 1 : 0);
} else {
  const fixAt = lines.findIndex((l) => l.startsWith("## Fix on test"));
  if (fixAt >= 0) {
    let j = fixAt + 1;
    while (j < lines.length && !lines[j].startsWith("## ")) j++;
    console.log(lines.slice(fixAt, j).join("\n").trim() + "\n");
  }
  for (const r of argv[0] === "--all" ? rows : rows.slice(-3)) {
    const c = cells(r);
    console.log(`${c[0]}  ${c[1]}`);
    console.log("  " + HEAD.slice(2).map((h, k) => `${h}: ${c[k + 2]}`).join(" · "));
  }
}
