# Builds the painted-plate prompts (DESIGN.md "Plate list") for Codex gpt-image-2 on Jonny's PC.
# python3 -I plates/build-plate-prompts.py  -> plates/prompts/<id>.txt (+ refs line)
import os
D = os.path.dirname(os.path.abspath(__file__))
TAIL = ("Style: exactly the look of the attached storyboard panel: polished cinematic hand-drawn Ghibli-style anime "
        "background painting, very detailed, crisp linework, controlled cel shading, subtle hatching, every mark drawn "
        "once (no repeating textures), everything fully sharp, no depth of field, bokeh or motion blur. The attached "
        "panel is the composition and colour target; repaint it as an EMPTY background plate: NO characters, NO "
        "potatoes, NO animals, NO vehicles, NO people, NO text, letters, numbers or panel badge. Low camera at small-"
        "child eye height (about 0.95 m), level horizon, a clear floor, pavement or path filling the bottom third so "
        "characters can stand on it. Landscape 1536x1024.")
P = {
 "ST":   ("37", "An autumn street along the pavement on a sunny morning: an old stone house front with a green door and one stone step on the left, an empty kerb and a cobbled road on the right, red and gold trees, far right a grassy hill with a winding road climbing it."),
 "HA":   ("03", "An old flat's hallway in morning sun: dark wooden wainscot, a wooden staircase on the left, a tall sunny window with autumn leaves outside, an open front door on the right, a braided rug, a few stacks of cardboard moving boxes far back, an empty floor in front."),
 "BK":   ("06", "A cosy corner bakery seen from the cobbled pavement: a striped red and cream awning, bread and buns in the window, an open counter to the street, a wooden flower tub with yellow flowers, a green iron street lamp on the left, autumn ivy on the stone wall."),
 "BK-R": ("12", "The same corner bakery street as a rainy grey afternoon: heavy rain, grey sky, wet shining cobbles with reflections, the bakery window lit warm, the striped red and cream awning dripping, a wooden flower tub, street lamps lit. Change only the weather and light."),
 "RV":   ("07", "A river path in autumn on a misty morning: a low mossy stone wall along a calm river, an old two-arch stone bridge, a small old town with a church tower beyond, red and gold trees overhanging from the left, a wooden bench on the left, fallen leaves on the paving, soft morning mist on the water. The most beautiful, detailed painting you can make."),
 "RV2":  ("10", "On an old stone bridge looking straight along its cobbled deck: stone parapets on both sides, two iron lamp posts, autumn trees and a small old town at the far end."),
 "SF":   ("13", "A small flat's hall wall in cool morning light: blue-grey plaster, a dark wooden door on the left, coat hooks with a grey scarf, a small shelf with a potted plant on the right, a framed picture; the middle of the wall EMPTY and plain (a mirror is added later)."),
 "RM-N": ("20", "A half-empty old flat's living room at night seen from its doorway: timber-panelled walls, bookshelves and stacks of cardboard boxes on the left, a worn red patterned rug, a dark window with lit town windows on the right. The left two thirds of the room glow warm gold from above; the right third is cool blue-grey; the warm light ends in a soft but clear edge on the floor. No string lights, no people."),
 "RM-D": ("25", "The same half-empty living room from the same camera on a Sunday morning: cold grey-blue light, nearly empty, a few open cardboard boxes, a cast-iron radiator under a tall window with autumn roofs and a church tower outside, scraps of tape on the wooden floor, empty shelves."),
 "RM-D2":("31", "The other wall of the same empty room: an open cream wooden door with peeling paint and a brass knob, a bare blue-grey wall, cold morning light, an empty wooden floor."),
 "BA":   ("23", "A small stone balcony at night: an iron railing, ivy and a red maple on the left, a warm lit doorway on the left edge, below a small old town of lit windows and a church tower under a starry sky, hills beyond."),
 "HR":   ("38", "Looking down a winding country road that climbs toward the viewer up a grassy hill: a dry-stone wall on the left, a wooden fence on the right, autumn trees, a small town and valley below, warm golden late-afternoon light."),
 "HT-W": ("43", "A hilltop at golden hour looking west: grass in front, a lone old tree on the left with its autumn canopy across the top of the picture, a wide valley below: a river shining gold, red and orange autumn woods, a small town with church roofs, a long old stone railway viaduct on the right, the sun about 8 degrees above the hills. NO bench. The most beautiful, detailed painting you can make."),
 "HT-W2":("47", "The same hilltop and valley at sunset, same camera: the sun touching the hills, pink, orange and violet sky, warm lamps lit in the town, the old stone railway viaduct on the right empty. NO bench, NO train. Change only the light."),
 "HT-E": ("46", "The same hilltop looking the other way (east): grass in front, the trunk of a lone old autumn tree on the RIGHT edge, a second wide valley with the small town's railway station and tracks, a dirt path leaving the bottom right, low golden sun lighting the scene from behind the camera. NO bench."),
}
for pid, (panel, text) in P.items():
    refs = f"refs: plates\\ref\\panel-{panel}.png"
    open(os.path.join(D, "prompts", f"{pid}.txt"), "w").write(f"# plate {pid} from panel {panel}\n# {refs}\nPROMPT START\n{text}\n\n{TAIL}\n")
# memory plates: WITH the kids, cast sheets as refs too
MEM = ("Warm soft watercolour illustration on visible cream paper with a rough deckled margin, like a page in a "
       "child's notebook, hand-drawn Ghibli style, very detailed, all sharp. Landscape 1536x1024. No text, letters, "
       "numbers or panel badge.")
open(os.path.join(D, "prompts", "M29.txt"), "w").write("# memory 29\n# refs: plates\\ref\\panel-29.png, spud sheet\nPROMPT START\nA grassy hill in summer, a big tree, a small old town with a church tower below, blue sky with white clouds, wild flowers. Young Spud (a smaller, rounder version of the attached Spud: golden potato, a tiny green leaf on top, a little teal knit sweater, three fingers and a thumb) rides a small red bicycle down the hill, mouth pursed whistling, carefree and happy. Above his head floats one small rounded pale-gold BLANK tag with no digits.\n\n" + MEM + "\n")
open(os.path.join(D, "prompts", "M30.txt"), "w").write("# memory 30\n# refs: plates\\ref\\panel-30.png, mash sheet\nPROMPT START\nThe same summer hill and big tree. Young Mash (a small narrow version of the attached Mash: tall oval golden potato, a tiny drooping leaf, a little charcoal hoodie) stands at the foot of the hill holding an old school notebook against his chest, wearing round honey-brown tortoiseshell glasses that are a little too big for him, a little sad, watching a small potato on a red bicycle far up the hill. No tag anywhere.\n\n" + MEM + "\n")
open(os.path.join(D, "prompts", "DG.txt"), "w").write("# dog cut-out for panel 01\n# refs: none\nPROMPT START\nA small friendly white dog with tan patches, side view facing right, standing on four legs, tail up, hand-drawn Ghibli-style anime, crisp linework, cel shading, alone on a plain pure white background. To its right, the same tail drawn again separately (wagging pose). No text. Landscape 1536x1024.\n")
print(sorted(os.listdir(os.path.join(D, "prompts"))))
