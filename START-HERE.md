# Start here: making videos with this engine on your own Claude

This repo is Jonny's video engine for the PotatoBrawl shorts. A creator Jonny has invited can run it from her own
fork with her own Claude and make videos the same way and at the same quality. Everything her Claude needs is in the
repo: this file says how to set it up and how to stay up to date.

**Permission.** The engine, the rules and the PotatoBrawl cast (Spud, Chip, Wedge, Mash, the ten fighters) and its
series are Jonny's. A creator he has invited may use all of them in her own videos. Ask him before selling anything
made with the cast or giving the repo to someone else.

## For her Claude: how to read the rules

- `CLAUDE.md` loads by itself and points to every rule file by task. Read the files it names for the task at hand.
- **"Jonny" means you, the producer.** Every rule that says "Jonny's go", "Jonny's panels", "Jonny judges" means
  the person you work for on this fork. The producer approves the outline, the panel sheet, the rough draft and the
  merge. Nothing is posted by Claude.
- The three files that make the videos ours, beyond the engine: `docs/rules/story.md` (what a video must be),
  `docs/rules/clip-lessons.md` (what cost draft rounds before), `docs/rules/posting.md` (the post pack on every
  delivery). Series formats: `docs/series/README.md`. Panel sheets and references: `docs/rules/images.md`.
- Paths like `/mnt/project-files/...` are Jonny's shared project folder. If you work in a Claude project, its shared
  folder takes their place; otherwise deliver to `out/deliver/<clip>/` (not committed) and tell the producer the path.
- Models: the director (the session itself) runs on Opus 5.5; Fable 5.2 only for new designs; Sonnet builders only
  build (`docs/rules/workflow.md`, Roles).

## One video, start to finish (the order in `docs/rules/workflow.md`)

1. `node tools/ledger.mjs` (the fix on test), read `docs/rules/story.md` and `docs/rules/clip-lessons.md`.
2. Outline: six lines "X, so Y, so Z" with the stake line, opener type A/B, music mood -> producer's OK.
3. Panel sheet drawn (`docs/rules/images.md`) -> producer's OK. New designs from the sheet (Fable 5.2).
4. Generator from `storyboards/templates/clip-template.mjs` (copy the series' last episode when one exists), PANELS.md,
   staging proof, review A.
5. Rough draft (`--draft`) -> producer's OK (no polish before it).
6. Polish, checks on the draft, strips, one full render (render farm), `qa/check.mjs --ears`.
7. Delivery: the gate report + post pack (`docs/rules/posting.md`), a pull request on the fork, merge on "merge it"
   with every check green, then one ledger row (`docs/LEDGER.md`) and one next fix offered.

## Setup (once)

1. **Fork** `guspliffy/viral-engine` on GitHub (it is public). In the fork's **Actions** tab, enable workflows: the
   free render farm (`.github/workflows/render.yml`) and the PR checks run there, with no secrets needed.
2. **Claude Code on the web (cloud sessions)**: pick the fork as the repository. `.claude/hooks/session-start.sh`
   installs the node packages and OpenCV at the start of every session. For voices run once per session:
   `node engine/voice/setup.mjs --vox` (~6.5 GB, free local models). Sign `gh` in to the fork for farm renders.
3. **On your own PC instead**: Node.js 18+, ffmpeg, Python 3.10+, then
   ```bash
   npm install
   npx playwright install chromium        # or point CHROME_PATH at an existing Chromium
   python3 -m pip install opencv-python-headless numpy   # needed by qa/check.mjs
   node engine/voice/setup.mjs --vox      # voices
   ```
   A 4-core PC without a GPU draws a 30 s clip in roughly 25 min; use the farm for full renders.
4. **Panel sheets** need a ChatGPT plan (Codex CLI or the ChatGPT image tool), see `docs/rules/images.md`.
5. **Posting** is on your own accounts; post at your audience's morning and late evening.

## Staying up to date

Jonny's rules and engine fixes keep landing on `guspliffy/viral-engine` main. At the start of every session the hook
prints one line when the fork is behind. Before each new video:

```bash
git fetch https://github.com/guspliffy/viral-engine main && git merge FETCH_HEAD
```

On a conflict in `docs/LEDGER.md` keep both sets of rows. Keep your own changes to the cast, rules and engine small
and send improvements back to Jonny as a pull request to his repo, so both channels get them.
