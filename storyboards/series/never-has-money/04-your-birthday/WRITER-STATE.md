# Writer state: NHM 04 "your birthday" (paused by Jonny, 8 Nov)

Generator `storyboards/series/never-has-money/04-your-birthday/make-your-birthday.mjs` runs (JSON regenerated: 9.80 s, 8 beats).
PANELS.md "Departures (writer)" NOT yet appended. Nothing committed.

**Written (brief sections):** all eight: frame-0 handover (Wizard's palms on the far face, horn, stack drawn to Viking's left side,
Reaper sets giftB on the lid, no step-in), "And yours?" eyelines; pocketPat block 1.5–2.8; "wait!" finger, crate sit, pen from
the bandana knot, coupon unfold on the knee, strokes with ink 3.62–3.88; flick + hop to G1, coupon at chest, hit-stop 4.2;
handover (Gunslinger's RIGHT hand to Viking's RIGHT mitten, presents in his LEFT arm), tears, "Best… gift… EVER!", Wizard
snicker, Reaper eye-roll/sigh poof; drop (aimed throw) + hug keyframes (settled by 6.3), hit-stop 6.0; Wizard stare, Reaper
take + dust 7.3–7.9; wink block at 8.6 with Wizard twitch + sweat. Music bounce/120/bell with hush 5.2–6.0. All `see` windows in.

**Last check:** draft stills at the 8 panel times → `/tmp/claude-0/writer/stills2.png`, `/tmp/claude-0/writer/panels.png`.
clear.mjs: only the expected `gsl-crate 3.2-4.07` line. Preflight/--layout NOT yet run on this version (none running).

**Open from stills2:** (1) 4.3 coupon shows blank: check whether ink needs a `c.prop(t,"coupon",{ink:0},0)` seed (COUPON spec has
ink:0; drawing on +z, rot 180 → likely facing away: try rot 0) and lower CHEST to y 0.32 so his grin shows; (2) 3.5 writing
not started yet (coupon reaches the knee 3.5–3.62): pull the sit/pulls ~0.15 earlier or accept; (3) giftP not at GIFT_P in 6.4/7.8
(aimed throw lands elsewhere): read out/*.layout.json after --layout, else use c.throw/drop; (4) 5.6 Wizard/Reaper faces partly
behind Viking's head; (5) frame-0 stack held low (y 0.04).

**allowClip (video clock):** worn moth/hatG/hatV/ros; horn 0–0.5; wallet VC2.25–3.02 + pat block motion/prop-pop/rig-jump;
coupon VC3.38–3.9, pen VC3.35–4.0, scribble/flick checks VC3.7–4.15; gsl/crate VC3.28–3.98; vik/giftP 0–VC6.0; wiz/giftP 0–0.3;
rea/giftB 0–VC1.0; rea/giftP VC0.55–1.0 (lean; drop if no contact); vik/coupon VC4.95–10; gsl/coupon, vik/gsl, gsl/vik VC5.95–10
(hug); vik hand checks VC5.95–6.35; rea/giftB VC7.3–10.

**Next step:** fix (1)(2), run `node qa/preflight.mjs <sb>` in the background, read the layout for giftP/contact, stills again.
