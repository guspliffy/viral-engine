# Retired beat macros (30 Oct 2026)

Six macros were removed from `engine/compile.mjs` in "Dead code 01": no storyboard used them (all 100 compiled to
identical JSON without them, and the 12 golden stills didn't change). They describe character patterns from
`docs/character-bible.md`, so their intent and code are kept here. To bring one back, paste its code into `MACROS`
in `engine/compile.mjs` and its row into `docs/STORYBOARD.md`.

Before reusing one: `precise`, `demonstrate` and `recover` move the arms with named poses (`up`, `hips`, `rest`).
With the seamless gloves, named poses can flip a hand in one frame (render-measure-01 report, change 5), so render a
test and watch the hands before using them in a clip. Current clips act with the grip library and the acting loops
in `storyboards/lib/acting.mjs` instead.

| macro | params | what it does | who |
|---|---|---|---|
| `enter` | `to`, `dur?` (0.7) | Walks to a spot and settles with a small squash | anyone |
| `fail-and-recover` | | Hops, it goes wrong (shocked, squash), looks at camera and turns cocky as if it was on purpose | anyone |
| `precise` | `side?` (L), `pose`, `back?` (rest), `hold?` (0.3), `look?` | One exact action with no wasted motion: the body goes still, one arm snaps to the pose and settles, holds, goes back | Reaper |
| `demonstrate` | `expr?` (cocky) | The big confident start: crouch, spring up with arms open, a flourish (wing flare), land with hands on hips | Phoenix |
| `recover` | `to?` (eye target after), `pose?` (hips; `null` keeps the arms), `expr?` (cocky) | Caught failing: freeze, eyes dart left and right, sag, then snap into a confident pose as if it was the plan | Phoenix |
| `affection` | `other` (eye target), `away?` | Quiet affection: looks at them, a slow blink, the smile comes slowly, then looks away and gives the smallest nod, as if nobody should see it | Reaper |

## Code (as it was on main, commit 859f3b8)

```js
  // walks in to a spot and settles with a small squash
  enter: ({ who, to, dur = 0.7 }) => [{ who, do: "move", to, dur, ease: "out" }, { who, do: "squash", amount: 0.08, dur: 0.2, at: dur - 0.05 }],
  // tries, it goes wrong, pretends it was on purpose
  "fail-and-recover": ({ who }) => [
    { who, do: "hop", height: 0.1, dur: 0.3 }, { who, do: "expr", expr: "shocked", dur: 0.08, at: 0.3 },
    { who, do: "squash", amount: 0.15, dur: 0.2, at: 0.3 }, { who, do: "look", to: [0, 0], dur: 0.15, at: 0.75 },
    { who, do: "expr", expr: "cocky", dur: 0.2, at: 0.8 },
  ],
  // one exact action with no wasted motion (Reaper): the body goes still, the arm snaps to the pose and settles,
  // holds, and goes back
  precise: ({ who, side = "L", pose, back = "rest", hold = 0.3, look }) => [
    { who, do: "still", dur: 0.85 + hold, idle: 0.1 },
    ...(look ? [{ who, do: "look", to: look, dur: 0.12, at: 0.1 }] : []),
    { who, do: "arm", side, pose, dur: 0.22, ease: "settle", at: 0.3 },
    { who, do: "arm", side, pose: back, dur: 0.3, at: 0.55 + hold },
  ],
  // the big confident start (Phoenix): crouch, spring up with arms open, a flourish, land on hands on hips
  demonstrate: ({ who, expr = "cocky" }) => [
    { who, do: "squash", amount: 0.14, dur: 0.25 }, { who, do: "expr", expr, dur: 0.12, at: 0.05 },
    { who, do: "arm", side: "both", pose: "up", dur: 0.25, ease: "settle", at: 0.2 }, { who, do: "hop", height: 0.06, dur: 0.25, at: 0.2 },
    { who, do: "flare", dur: 0.6, at: 0.25 },
    { who, do: "arm", side: "both", pose: "hips", dur: 0.3, ease: "settle", at: 0.8 }, { who, do: "squash", amount: 0.05, dur: 0.2, at: 0.85 },
  ],
  // caught failing: freeze, eyes dart, sag, then snap into a confident pose as if it was the plan
  recover: ({ who, to = [0, 0], pose = "hips", expr = "cocky" }) => [
    { who, do: "still", dur: 0.5, idle: 0, fade: 0.06 }, { who, do: "expr", expr: "shocked", dur: 0.08 },
    { who, do: "look", to: [-0.5, 0], dur: 0.08, at: 0.18 }, { who, do: "look", to: [0.5, 0], dur: 0.08, at: 0.32 },
    { who, do: "droop", to: 0.6, dur: 0.2, at: 0.25 },
    { who, do: "expr", expr, dur: 0.12, at: 0.55 }, { who, do: "droop", to: 0, dur: 0.15, at: 0.55 },
    ...(pose ? [{ who, do: "arm", side: "both", pose, dur: 0.25, ease: "settle", at: 0.55 }] : []), { who, do: "squash", amount: 0.06, dur: 0.2, at: 0.58 },
    { who, do: "look", to, dur: 0.12, at: 0.6 },
  ],
  // quiet affection (Reaper): looks at them, a slow blink, the smile comes slowly, then he looks away and gives the
  // smallest nod, as if nobody should see it
  affection: ({ who, other = [-0.6, 0.05], away }) => [
    { who, do: "still", dur: 1.9, idle: 0.3 }, { who, do: "look", to: other, dur: 0.25 },
    { who, do: "blink", dur: 0.35, at: 0.35 }, { who, do: "expr", expr: "kind", dur: 0.5, at: 0.6 },
    { who, do: "look", to: away || [other[0] * 0.3, -0.35], dur: 0.3, at: 1.2 }, { who, do: "squash", amount: 0.04, dur: 0.3, at: 1.5 },
  ],
```

Also removed in the same commit (no storyboard used them): the film look (`filmLook`, `contactShadows`, `patchSkin`
in `looks.js`), the trail effect (`buildTrail` in `stage.js`) and three dance moves (`groove`, `wave2`, `nod` in
`dance.js`). The game-puppet renderer is archived, see `puppet/README.md`.
