# Background plates

Painted backdrops for `"set": { "plate": { ... } }` (engine/page/set-plate.js), made with `engine/plates/paint.py`.

`engine/plates/depth.py <plate>.png` (Depth Anything V2 Small, Apache-2.0, a few seconds on the CPU) adds
`<plate>.depth.png` (white = near) and `<plate>.motion.png` (red = leaves that sway, green = sun patches that shimmer).
With `"depth"`, `"relief"` (metres) and `"eye"` (the first camera position) the plate becomes a 2.5D relief that shows
parallax when the camera moves; `"motion"` and `"dust": 40` add the ambient motion. A sideways camera move needs a plate
about 25 % wider than the frame (`"height"` up), or the edge shows. Example: `storyboards/lookdev/style-couch-depth.json`.

| File | Prompt (seed) |
|---|---|
| `livingroom-golden.png` | 3D animated movie background painting, eye level view straight at the wall of a cozy living room, cream wall, big window on the left with warm golden hour sunlight and soft light beams, bright window light patches on the wall, framed landscape painting on the wall, potted green plant on a wooden sideboard, warm orange glow, Pixar Disney style, highly detailed (seed 11, `--no "sofa, couch, table, chair, furniture in foreground, floor"`) |
