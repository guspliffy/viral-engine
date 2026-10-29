# Background plates

Painted backdrops for `"set": { "plate": { ... } }` (engine/page/set-plate.js), made with `engine/plates/paint.py`.

`engine/plates/depth.py <plate>.png` (Depth Anything V2 Small, Apache-2.0, a few seconds on the CPU) adds
`<plate>.depth.png` (white = near) and `<plate>.motion.png` (red = leaves that sway, green = sun patches that shimmer).
Both are used by default when they sit next to the picture (engine/load.mjs): the plate becomes a 2.5D relief that
looks exact from the camera at 0 s and shows parallax when the camera moves (`"relief"`, metres, default 0.6), leaves
sway, sun patches shimmer, and golden light adds dust motes (`"dust"`). `"depth": false`, `"motion": false` or
`"dust": 0` turn one off. A sideways camera move needs a plate
about 25 % wider than the frame (`"height"` up), or the edge shows. Example: `storyboards/lookdev/style-couch-depth.json`.

| File | Prompt (seed) |
|---|---|
| `livingroom-golden.png` | 3D animated movie background painting, eye level view straight at the wall of a cozy living room, cream wall, big window on the left with warm golden hour sunlight and soft light beams, bright window light patches on the wall, framed landscape painting on the wall, potted green plant on a wooden sideboard, warm orange glow, Pixar Disney style, highly detailed (seed 11, `--no "sofa, couch, table, chair, furniture in foreground, floor"`) |
| `dining-blue-window.png` | 3D animated movie background painting, eye level view straight at the wall of a bright airy dining room, plain cream wall, one large window with a muted soft blue frame, soft morning daylight, gentle diffuse light, pastel colors, low contrast, clean and minimal, Pixar Disney style, highly detailed (seed 11, `--no` table, chair and the other foreground furniture; Dragon vs. the Candle) |
