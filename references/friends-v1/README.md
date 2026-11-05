# The Little Chaos Club — character reference and Claude handoff

5 November 2026 · proposed designs and working names · built-in image generation

**Rusty** is the red-panda lead. **Pip** is his impulsive woodland-imp friend. **Moss** is the calm capybara who joins when the story benefits from a third personality.

This pack contains reference illustrations and an implementation brief. It does not contain working engine characters, finished 3D assets or rendered clips. No viral-engine source was changed. A reference pack reduces ambiguity; engine renders and validation are still needed to establish a faithful, reliable result.

## Give Claude these files

1. Open [CLAUDE-START.md](CLAUDE-START.md) and paste its prompt into Claude along with this folder or the ZIP.
2. Include all four current images below. Claude must inspect them visually, not just read their filenames.
3. Read [CHARACTER-BIBLE.md](CHARACTER-BIBLE.md), [ENGINE-INTEGRATION.md](ENGINE-INTEGRATION.md), and [CHARACTER-SPEC.json](CHARACTER-SPEC.json).
4. The JSON is **design reference data, not the current engine schema**. Its proposed fields need implementation or explicit mapping.

| Image | Purpose |
|---|---|
| [00-trio-lineup.png](images/00-trio-lineup.png) | Group identity, relative scale, palette and relationships |
| [01-rusty-reference.png](images/01-rusty-reference.png) | Rusty front/side/back, expressions and paw studies |
| [02-pip-reference.png](images/02-pip-reference.png) | Pip front/side/back, expressions, hands and asymmetric details |
| [03-moss-reference.png](images/03-moss-reference.png) | Moss front/side/back, expressions and mug grip study |
| [04-original-exploration.png](images/04-original-exploration.png) | Earlier exploration, historical context only; current sheets/rules take precedence |

The written rules resolve minor illustration inconsistencies, including fingers, tail band count, orthographic accuracy and sleeve-patch placement. See the explicit reconciliation table in the character bible. The title and names are proposals, not an approved replacement for PotatoBrawl.

Integration checked against [viral-engine b6f0e59](https://github.com/guspliffy/viral-engine/tree/b6f0e59a22ab36076e47e2bd4ebd815bca091ca5), newer than the earlier audit's `47bc45f`. Check for later changes before implementation. This pack deliberately preserves the original cast and production defaults.

Exact prompts and generation method: [IMAGE-PROMPTS.md](IMAGE-PROMPTS.md). File hashes and image dimensions: [MANIFEST.json](MANIFEST.json).
