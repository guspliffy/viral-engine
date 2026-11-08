# Characters, contact and grips

Moved out of CLAUDE.md on 8 Nov 2026 (motion studio workflow); the text is unchanged. Read it when the task in CLAUDE.md's table says so.

## Characters

- The cast are PotatoBrawl fighters. **Character bible: `docs/character-bible.md`** (wants, flaws, comic patterns,
  the Phoenix and Reaper relationship, tone limits, outcome log). Phoenix and Reaper carry the series, the Wizard is
  an occasional third. Both leads win, fail and surprise: keep the outcomes varied. Don't invent lasting canon: mark
  new traits as proposals.
- Jonny decides anything that changes a character's look or personality, and any new drawing in the game's style.

## Contact and grips (lessons from the look C session, 25 Oct; paper: https://claude.ai/artifact/R4fEStmWqDtDsVHbyTZL54)

Every glitch Jonny caught after the look was set was a contact problem the file checks couldn't see. So:

1. **Grab from behind**: the palm on the far side of the object, the fingers wrap the camera side, the thumb locks.
2. **A held object is rigid in the hand**: no gap, no drift, no sliding through. A cup stays level until the sip.
3. **The staff stands in front of the arm**: the fist closes round the shaft, the forearm square to it, never along it.
4. **Keep characters a body-width apart** unless the beat needs contact. Raised arms go wider than the hat brim.
5. **Check every costume prop** (pistols, staff, orb, axe) in every pose the clip uses.
6. **When a model, grip or prop changes, re-check every storyboard pose that uses it** before rendering. Old poses
   break on a new grip (the jar zap at 4 s).
7. **Copy Jonny's reference images point by point**, or a real-world hold, rather than a new idea of the grip.
8. **If a move can't be done cleanly, replace it** instead of tuning it, and check reviewer notes against the geometry
   before applying them (a deeper hat pull would have pushed the crown further through the head).
9. **Remaking an old storyboard**: re-check spacing, poses and old "intended" notes against the current models.
10. **No blink on a key line**: set `blink: false` on looks at key lines (the engine auto-blinks on big look changes).
11. **When Jonny reports a glitch, describe it back first**: the times, what moves wrong and why. Then fix it, and
    send a before/after strip of the same moments.
12. **A/B option sheets get a pixel-difference check**, so two "different" options are never the same picture.
13. **Hands and held props stay off other characters' heads and faces**, and a fist holding a prop stays off the top of
    a head on screen: in front or behind, it reads as stuck to the head (the look busy remake).
14. **A hand on a prop touches its surface**, holding or pushing, and never sinks more than about 1 cm in (Charger: a
    glove inside the bowl it slides). Arms, beards and costume parts count as body against every prop in reach,
    including props someone else holds (Package: the parcel through Reaper's forearm).
15. **A thin prop shows on both sides of the fist** (straw, pen, cable): grip it high, the working end clearly below
    the hand, the fingers over it on the camera side, a little in front of the palm, never through the middle of the
    glove (Vampire: a straw held near its end looked like it grew out of the glove).
16. **Keep the real-world hold.** When a check fails, change the path, the prop's size or the camera, not the hold.
    A grip a person wouldn't use is a fail even when every check passes (DUO: "nobody would hold a phone like this").
