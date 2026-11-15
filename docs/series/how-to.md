# "How to…" series: format, honest take, character pick (8 Nov 2026)

Jonny, 8 Nov 05:54: a "How to xy" series (get rich, get fat in x time, get a girl, jump super high, learn to fly…). Catch people with the "How to" phrase in the first seconds, then make them laugh with an unexpected turn. Asked for an opinion, which character to use (maybe the human anime character), and a couple of storyboards.

**Status: storyboards only. No renders until Jonny says go.** Every episode brief in this folder follows this page; an episode brief wins where they disagree, and Jonny's own panels win over both (run `qa/panels.mjs`).

## Honest take

**It's a good format, with one trap.**

Why it's good:
- "How to get rich in 10 seconds" is exactly the half-answerable question our hook research says we're missing (research/hook-curiosity-2026-11-07). People know roughly what a "how to" looks like, so they stay to see if it's real.
- Step cards ("Step 1: …") tell the story on mute and give every episode the same built-in shape: steps 1 and 2 look like a real tutorial, step 3 breaks it. The turn lands at 40-65 % and the payoff at 80-95 %, which is where our measured hits put them.
- It never runs out: anything can be a "how to". The comment trigger writes itself: "How to ___ next?" (viewers pitch episodes).

The trap: **the obvious shortcut isn't a joke.** "How to get rich: buy a lottery ticket, win" is what people expect, so it gets a nod, not a laugh. The laugh comes when the method backfires, or works in a way nobody saw coming. So in every board below, steps 1 and 2 go as planned and step 3 flips it (in the lottery one he wins, the wind takes the ticket, and it lands in his friend's hand).

One clash with our reach rules: a tutorial is a solo format, but our data says clips need a troublemaker and a victim from frame 0 and a group moment (B1, B3). Fix: there's always a deadpan friend in frame from frame 0. He's the skeptic, then the victim or the secret winner. That also gives the self-ID question: "Which one are you, the one with the plan or the friend who…?"

## Character pick: the human anime character

**Use the human (Teo as the "how to" guy, Ryn as the deadpan friend), not a potato and not Pebble.**

- The goals are human goals (get rich, get a girl, get fat, jump high). A tutorial host is a person; a potato doing "how to get a girl" is a stranger joke.
- Teo and Ryn already exist on rig vrm-v1 with their own clothes and VoxCPM2 voices (firebender duel, PR #170), so there's no new design work.
- The anime look stands apart from the potato feed, so this series can find a different audience.

Honest risk: the human rig is still mocap-bound. It can't squash and stretch, and its faces are less elastic than the potatoes'. So these boards lean on full-body moves we already have takes for (scratch, run, jump, deep squat, walk, sit, pick-up) and let props, physics and Ryn's deadpan carry the comedy. Every move still goes through the human reference loop (feedback-human-reference-loop.md).

- **Potatoes:** better faces, but they're already the "that one friend who…" cast, and a second potato format would blur both series.
- **Pebble:** no. It's the calm account (no potatoes, gentle tone), and slapstick tutorials would break that account's vibe.

**Optional brand tie-in (Jonny's call):** this would post on the PotatoBrawl account, and a human-only series doesn't promote the game. One fix is a running joke where **a potato is always secretly behind it**: the jackpot symbols are potatoes (ep 1), the balloon pilot is a potato (ep 3), the food thief is Dragon potato (ep 4). Viewers start looking for it ("spot the potato"). Every brief has a no-potato fallback.

## What stays the same in every episode

**1. The cast.**
| Who | Type | Always |
|---|---|---|
| **Teo** (characters/human/teo.json) | The "how to" guy | Over-confident, all-in, follows the steps to the letter. Big full-body moves. |
| **Ryn** (characters/human/ryn.json) | The deadpan friend | Hands in hoodie pocket, eating or sipping something, says nothing. Ends up the victim or the secret winner. One slow eyebrow raise per episode. |
Never more than three figures on screen. Ryn never covers Teo's action (staging rule).

**2. The step cards (series signature).** Burned in, between y 470 and 640 (clear of Jonny's in-app title in y 0-384), left-aligned, a hand-drawn white tutorial label with a small number badge: "STEP 1", then the step in 2-4 words. Each card pops in with the same `tick` sound and a tiny overshoot (scale 1.15 to 1.0 in 0.12 s) and stays until the next card. Max 3 cards per episode. **A card never names the payoff** (Topolinski: a title that gives away the payoff hurts). The last card comes after the reveal as the punchline, or not at all.

**3. The shape (11.0 s, hard cut).**
| Time | Beat |
|---|---|
| 0.00-1.50 | **STEP 1, already happening.** Frame 0 = Teo mid-action AND Ryn in frame, medium-wide, real sound at 0.0 (scratch, munch, flap). Step 1 card at 0.10. |
| 1.50-4.50 | **STEP 2.** Still looks like a real tutorial. Ryn's first reaction. One quick insert/cut allowed. |
| 4.50-7.00 | **THE TURN** (40-65 %). Step 3 goes wrong or way too right. Hit-stop on the turn. Its cause is set up on screen earlier (world logic). |
| 7.00-10.40 | **THE PAYOFF.** Physics carries it. Ryn's moment. |
| 10.40-11.00 | Last frame = payoff, loopable to frame 0. No outro. |

**4. Voices.** Teo talks in short gibberish bursts, every line subtitled (y 1100-1360). Ryn speaks once per episode at most, usually not at all. Music runs from 0.0 and changes style every episode (music-variety rule), with a dip before the turn.

**5. Every reach rule** (reach-rules-v2-2026-11-07.md): physics on everything that falls or flies, `"life": "auto"`, whole frame sharp (no DoF), contacts checked at 15 fps, preflight green.

**6. Posting.** In-app title = the "How to…" line, same words as caption line 1. Caption line 2 = a self-ID "Which one are you…" question. Exactly `#funnyanimation #animation` + one situation tag. Comment poll pinned. Playlist "How to…". Each brief has its own post pack.

## The episodes in this folder

| # | Title | Turn | New to build |
|---|---|---|---|
| 01 | How to get rich in 10 seconds | He wins, the wind takes the ticket, it lands in Ryn's hand | kiosk prop, paper-in-wind physics, a stumble/fall take |
| 02 | How to jump super high | His jump is 15 cm, then Ryn drops onto the seesaw | plank-on-log seesaw (hinge), ballistic launch pose |
| 03 | How to learn to fly | He jumps off the cliff… and rises back up, sitting on a hot-air balloon | balloon prop + burner flame (vfx), cardboard wings |
| 04 | How to get fat in 24 hours | He eats everything, gains 0 kg; the pet under the table is now a ball | food props, bathroom scale, round Dragon potato (or cat) |

Order to make them: **02 first** (all-physics, the strongest loop, the fewest new assets), then 01, 04, 03.

## "How to get a girl" (outline, handled tastefully)

Proposed title **"How to talk to the girl you like"**. The joke is on Teo's method, never on her, and she's the one in control.
- Step 1 "Make eye contact": a café; she's reading two tables away, catches his eye. Step 2 "Smile": he does a far-too-intense "cool" smile; she smiles back (!).
- Step 3 "Walk over with confidence": he stands, coffee in hand, catches his foot on a chair leg; the coffee arcs through the air (physics), he does a full-body save and catches the cup… empty. The coffee lands in her empty mug on her table without a drop spilled.
- Payoff: she laughs, slides the chair out for him with her foot. Last card: "Step 4: Be clumsy". Last frame: him sitting down stunned, her laughing.
- **Needs** a second, female VRoid base. Check its licence first (it must be CC0 or allow commercial use, like the male base), then give her her own garments and voice. That's why it's an outline and not a full brief yet.

More titles for later: how to wake up early, how to pass an exam without studying, how to win an argument, how to make friends, how to get abs in 1 day, how to be invisible, how to fix anything (duct tape), how to cook like a chef.
