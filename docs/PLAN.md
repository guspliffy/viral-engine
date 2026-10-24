# Plan

What we are building, what is decided, and what is open. Update this file when a decision changes.

## Goal

A tool that turns characters into short vertical videos built on formats that are currently spreading, with as little
manual work as possible. First for our own channels (PotatoBrawl and later games), then possibly offered to others.

## Decisions (Jonny, 2026-10-24)

- Build the tool ourselves; Jonny gives access where needed.
- Server: Jonny's Hostinger **VPS**. It also runs the trading bot, so heavy rendering there needs a decision first (below).
- Budget: **0 until the concept works**. Then up to roughly 100–200 USD a month, and it has to pay for itself.
- 3D, not 2D: the characters are rendered in Three.js. An anime style (cel shading, ink lines, speed lines, impact frames) is a render option on the same storyboards.
- Test cast: **PotatoBrawl fighters**. Then compare different characters, and design new ones from what the data says performs.
- Repo: `guspliffy/viral-engine`.
- Captions in English (from the earlier game-marketing decision).
- **Main path: the game puppet** (PotatoBrawl's own drawing code, `puppet/`). The 3D engine stays for the 3D and
  anime look; no more fighters are built in 3D for now.
- **Quality harness** shared by both renderers: rules in `CLAUDE.md`, automatic checks in `qa/`, at most 3 fix rounds
  per clip, and an optional creative review on the Fable model from a contact sheet, once per cut.

## Build order

1. **Engine core (now).** Character + storyboard → MP4, rendered in code at no cost per video. You post by hand.
2. **Sound.** Done in v0.2: code-generated voices and effects, lip sync, loudness normalised. Still open: a real spoken hook (TTS or recorded), music slot for trending sounds added in TikTok.
3. **All eight fighters** and more sets, poses and props.
4. **Control panel** on the VPS: characters, trend board, storyboards, render queue, approval queue, manual stats entry.
5. **Trend scout + scripting:** scheduled scans, format templates (hook → beats → payoff → loop), storyboards written from them.
6. **AI render path** for things code can't draw well, once there is budget. Storyboards compile to a structured prompt.
7. **Product version** for other users: accounts, billing, TikTok posting-API audit, legal.

## Studio roadmap (Jonny, 2026-10-24)

Goal: a studio-style engine with many scenes and characters, where clips are rich in detail but stay short.
Fable is the creative director (`CLAUDE.md`, `qa/REVIEW.md`). The algorithm research
(`/mnt/project-files/research/TikTok algorithm for animated shorts.md`, "Engine changes" #1–13) is folded in below.

1. **One engine.** PR #1 contains the dance and props work, PR #2 and the batch-2 storyboards. *Waiting for Jonny's merge.*
2. **QA v2: algorithm rules in code** (research #1, 2, 3, 5, 6, 7, 4, 13). `qa/check.mjs` gains: hook (frame 0 not
   blank or static, motion in the first 0.3 s), loop seam (last frame vs first, audio seam), event cadence (fail
   gaps > 2 s), duration gate (12–20 s default; 20–25 s only with an escalation beat; < 8 s fails), caption reading
   speed, stricter safe zone for faces and text (x 120–960, y 240–1260, clear of the right button column), and a
   cartoon-violence lint. The review frames are fixed: 0.0, 1.5, 3.0 s, the punchline, and the last/first pair,
   with four pass/fail questions logged per clip.
3. **Relative timing and beat macros.** Actions are timed relative to the previous beat. Macros (`enter`, `react`,
   `take`, `fail-and-recover`, ...) expand into actions, so a 20 s clip is 20–30 lines.
4. **Format templates** (research #11). Templates: "each character vs X" (GATE first), literal-genie, rivalry skit,
   "rank the potatoes" tier list, comment reply, and 2–3 part cliffhanger arc. Each declares hook, escalation and
   a loop ending, and builds a full storyboard.
5. **Cast registry** (research #8). One file holds each potato's name, look, trait, voice timbre and catchphrase
   sound. A name tag shows on a character's first appearance, and unregistered characters fail QA.
6. **Auto camera.** Frames the active character inside the safe zone. Cuts, whip pans, push-ins and split screen
   are named options.
7. **Richer worlds.** Props that fall, break or explode (cartoon only), crowds of all 10 fighters, set dressing,
   and a beat at 120+ BPM with a new seed per clip, ducked under voices (research #9).
8. **Anti-template check** (research #10). Fingerprint beat structure, cast, set and punchline. Warn when a clip
   is too close to recent ones.
9. **Faster renders.** Chunked parallel rendering and cached static backgrounds. The render host is still open.

Rule from the research (#12): never mention or show the game in the first 3 s, and never use an outro card that
breaks the loop. The game can be the setting or the punchline.

## Character experiments

Goal: find out which characters (and which traits) perform, then design new ones from that.

- Same format and script, different character, posted in comparable slots. One variable at a time.
- Track per video: character, format, hook, length, views, average watch time, completion, shares, follows.
- Small numbers are noisy: no conclusions from one post per character. Decide the minimum per character before starting.
- Characters are data files, so a new character is mostly a new JSON + costume pieces.

## Findings that shape the design

- **TikTok posting API:** apps that have not passed TikTok's audit can only post privately, for at most 5 users a day,
  and TikTok rejects upload tools for accounts the developer's own team manages. So for our own channels we post by
  hand (also needed for trending sounds). API posting only makes sense in the product version, where each user posts
  to their own account through the required posting screen.
  Source: https://developers.tiktok.com/doc/content-sharing-guidelines
- **AI video APIs are blocked from Claude's workspace** (fal, Replicate, muapi all unreachable). Options for step 6:
  Higgsfield's Claude connector (custom connector `https://mcp.higgsfield.ai/mcp`, paid plan, credits per generation;
  includes Seedance, Kling 3.0 Motion Control, reference characters, voiceover), or calls from the VPS.
  Not verified: whether Higgsfield outputs can be pulled back into the workspace for compositing.
- **Claude Motion** (Anthropic, October 2026): code-written animation, MP4 export, no video model. Beta on Team and
  Enterprise only; not available on this account. Same principle as this engine.
- **Saveo case (budgeting app, from X):** simple recognisable animation style, spoken ominous hook in the first words,
  a serial story people follow to see what happens next. Realism was not the driver. Numbers in the post are unverified.
- **Prompt structure for AI video (from Alex Becker's Seedance prompt):** named reference roles (identity, location,
  face driver, voice), dialogue verbatim with the voice recorded first and locked, no text in the picture (captions are
  added after), an explicit consistency section. Our storyboards should be able to compile to this.
- **Platform rules:** label AI content; no re-uploads of other creators' footage; volume without originality gets
  throttled; running many accounts to spam posts is inauthentic behaviour.

## Render speed (measured 2026-10-24, Claude's workspace, 2 cores, software WebGL)

- Full quality: ~1.8 s per frame (9 s clip ≈ 8 min). Draft: ~0.55 s per frame (≈ 2.5 min).
- Where the time went: unlit drawing of a frame takes ~0.23 s; lighting is the cost. Image-based lighting on the
  whole scene took more than half the frame time, so it is now limited to the characters (3.1 → 1.8 s per frame).
  JPEG encoding of a frame is ~0.09 s.
- A machine with a real GPU (e.g. Jonny's PC) should render far faster. Not measured yet.

## Styles to test

Same storyboard, different look: `standard` (soft 3D, like the portraits) and `anime` (cel shading, ink outlines,
speed lines, impact frames; fits the game's manga KO pages). Worth A/B-testing alongside characters.

## Open questions

- **Where renders run long-term.** Options: (a) Claude's workspace (now; ~8 min per 9 s clip), (b) the VPS with a CPU
  cap and a low priority so the trading bot is never starved, (c) a separate small server for rendering, (d) a machine
  with a GPU. Jonny's call.
- **Character bible:** relationships, running gags, tone limits per fighter. Drafted in the earlier game-marketing chat;
  needs to be brought in and signed off.
- **Voice:** gibberish synthesis in code vs. a TTS service (cost, and whether it is reachable from where we render).
