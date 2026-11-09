# PANELS: <clip id> (<series, episode>)

Next to the generator. Written at the staging proof (docs/rules/workflow.md), before the first line of the generator:
Jonny's panels are the target, and this file is how the clip is held to them by line and by number, not from memory.
Board: <path> (<C>x<R> grid, 9:16 panels; `qa/panels.mjs --grid <C>x<R>`). Brief: <path>.

## Checklist: what these panels stand on

8-12 numbered lines a reader could check on the panel image. Each line says what must be true, with a number where
"how much" matters (sizes, how many, how far), and "never" where the engine's default goes the wrong way (a white shell,
a back to camera, an empty room). Grade every line against the panel image, not against what you remember building:
yes, partial or no, at the staging proof (draft stills) and again before the full render. Fix the no's, then the
partials; a line that stays partial or no gets its reason under "Departures".

| # | Line | Staging proof | Before full render |
| --- | --- | --- | --- |
| 1 | <e.g. Gunslinger's face fills the upper half in 02-04: eyes 0.33-0.41 of the frame down, hat top in frame> | | |
| 2 | <e.g. the hug (06-07) keeps both faces 3/4 to us and fills the frame; never a wide two-shot> | | |
| 3 | <e.g. bunting across the top of every interior panel, 5+ pennants in frame> | | |

## Numbers: read off each panel before any code

One row per panel, read off Jonny's image (shares of the frame: 0 at the top or the left, 1 at the bottom or the right).
`node qa/panelfit.mjs <storyboard> --panels <this file>` grades each row against the layout, and preflight runs it when
the storyboard says `"panels": { "md": "<path to this file>" }`.

- At: the video second to compare (one per panel). Subject: the cast id the panel is about.
- Top: the subject's silhouette top, hat included. Eyes: its eye line. Bottom: its lowest point in frame (1 when the
  frame cuts it). X: its eyes across the frame. "-" skips a cell (a subject hidden behind others has no Bottom).
- Faces: the faces that must show (in frame and turned to us). Camera: above, level or below the subject's eyes.
- Departure: empty, or the reason the clip leaves this panel (review A agreed). A row with one is reported, not graded.

| Panel | At | Subject | Top | Eyes | Bottom | X | Faces | Camera | Departure |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 01 | 0.5 | <id> | 0.24 | 0.41 | - | 0.39 | <id, id> | level | |

## Story chain

<one line per beat: what happens -> what the viewer must see -> the shot that shows it (workflow.md "The story chain")>

## Departures (and why)

<panel or line: what differs, and the reason tied to what the frame must show>
