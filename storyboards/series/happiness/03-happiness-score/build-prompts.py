# Builds the four 12-panel sheet prompts for the happiness score film (python3 -I build-prompts.py).
# Story = outline v2 doc https://claude.ai/artifact/NN6YVvLJRoz7SiD8LeeaNJ (Jonny OK 16 Nov 09:04 Berlin).
import os
D = os.path.dirname(os.path.abspath(__file__))

STYLE = """Use case: illustration-story. Create ONE finished full-colour twelve-panel storyboard contact sheet, sheet {n} of 4, for a three-minute WIDESCREEN animated short film with real emotion, about friendship and happiness. Image size 1536x1024 landscape. EXACTLY TWELVE panels in three columns and four rows (row 1 = {a}-{b}, row 2 = {c}-{d}, row 3 = {e}-{f}, row 4 = {g}-{h}). Every cell is a wide landscape frame close to 16:9, thin charcoal gutters, a small panel-number badge in each cell's top corner showing its own number, no title or header. Polished cinematic hand-drawn Ghibli-style anime, very detailed, crisp linework, controlled cel shading, subtle hatching, a small autumn town painted with love for detail, everything fully sharp, no depth of field, bokeh or motion blur. Compose for the wide frame: the subject sits in the middle third, the town, the room or the landscape fills the sides. Every panel shows ONE obvious action a child could name. No comic impact marks, no speed lines, no sweat drops, no sparkles, no magic glow. Hands ALWAYS have exactly three fingers and a thumb, no extra limbs; each character appears at most once per panel. No speech bubbles and no words, letters or numbers anywhere except the panel numbers (labels, notebook pages and signs are blank or show tiny unreadable scribbles). Every character is a potato: no humans. Every character with an attached reference sheet must match it exactly."""

CAST = """SPUD (the lead): exactly as in his reference sheet: golden potato, one green leaf sprout on top that moves with his mood, plain teal knit sweater, brown boots, open friendly face.
MASH (his best friend): exactly as in his reference sheet: tall narrow oval potato with the same golden skin, charcoal hoodie, light-blue headphones resting round his neck (on his ears only where a panel says so), leaf drooping sideways. Calm, relaxed, often whistling with pursed lips. No phone in this film.
CHIP: exactly as in his reference sheet: smallest round potato, sunny yellow hoodie with two white drawstrings, two short leaves in a V, white trainers with a red stripe. Bouncy, always pulling friends along.
WEDGE: exactly as in his reference sheet: biggest potato, broad top and narrow bottom, red bomber jacket with a cream shawl collar, brown sunglasses resting on TOP of his head (never on the eyes), big leaf swept sideways. Confident grin.
SPUD'S COPY OUTFIT (only where a panel says so): Spud in a charcoal hoodie exactly like Mash's, teal sweater collar showing at the neck, light-blue headphones round his neck like Mash's.
THE GLASSES: old round glasses with a thick honey-brown tortoiseshell frame, a small scratch on the left rim, clear lenses. They live in a worn dark-green hard glasses case. In every panel where Spud wears them they sit on his nose.
THE GLASSES VIEW (only panels marked GLASSES VIEW): the whole picture is in soft greyscale, no colour at all, seen through two round lens edges at the far left and right of the frame; above the head of every living being floats one small rounded pale-gold glowing tag, BLANK, no digits (the numbers are added later). The only colour in the frame is those tags.
THE SCORE TAG outside the glasses view: never shown, except in panels that say so.
THE DON'T-KEEP BOX: a used brown cardboard moving box, flaps open, a rough red hand-painted label patch on its side, blank."""

COLOUR = {
 1: "COLOUR: warm autumn town at the start (gold light, red and orange trees); from panel 08 on, each panel a little cooler and greyer around Spud; panel 12 is a rainy grey street.",
 2: "COLOUR: Spud's own flat cool and greyish; the night party warm golden from string lights, EXCEPT the corner where Spud stands, which stays cool and grey, the warmth stopping at a soft but clear edge.",
 3: "COLOUR: Sunday morning, cold grey-blue light in the empty flat; the two memory panels are warm soft watercolour with visible paper texture, like a page in a notebook.",
 4: "COLOUR: late afternoon then sunset; grey only in the GLASSES VIEW panel; from panel 43 on the fullest, richest golden-hour colour of the whole film.",
}

PANELS = {
1: """01 | 0.0 s GLASSES VIEW: a quiet autumn street on moving day: a moving van with its back open, a potato mover carrying an armchair, a small dog on the pavement, a blank glowing tag over each head; in the dark glass of the van's window, the faint reflection of Spud wearing THE GLASSES with a small tag above him.
02 | 2.0 s Warm colour, Mash's half-packed hallway: Spud kneels beside THE DON'T-KEEP BOX, holding THE GLASSES half lowered from his eyes, startled, looking at the world over the frames; the open green glasses case lies in the box.
03 | 3.5 s Wide, same hallway, morning sun through a window, stacked boxes: Mash walks past carrying a big box, lips pursed whistling, relaxed; Spud in the foreground beside the box watches him.
04 | 6.0 s GLASSES VIEW: Mash in the open front doorway holding his box, a large tag over his head clearly brighter than any other; the moving van behind him in the street.
05 | 10.0 s Medium: Spud sits on the front step with a small notebook and a pencil, THE GLASSES on, eyes narrowed like a detective, studying Mash across the street.
06 | 14.0 s Wide: a cosy corner bakery in the morning, bread in the window: Mash at the counter taking a cinnamon bun from a potato baker in a white apron; outside, Spud half hidden behind a lamppost, taking notes.
07 | 18.0 s Beauty wide: a river path along a calm river, autumn trees, an old stone bridge, soft morning mist: Mash walking alone with the headphones ON his ears, eating his bun; far behind him, Spud following.
08 | 22.0 s The same river path, wide: Spud now in SPUD'S COPY OUTFIT with the same cinnamon bun, walking ten steps behind Mash in exactly the same pose, like a small copy of him. Slightly cooler colour than 07.
09 | 28.0 s Medium on the pavement: Wedge passes Spud in his copy outfit, looks him up and down with a confident grin, one thumb up.
10 | 35.0 s GLASSES VIEW: Mash ahead on the stone bridge with his big bright tag; in the foreground Spud's own hand holding the bun.
11 | 42.0 s Close: Spud in his copy outfit and THE GLASSES, looking straight up at the space above his own head, worried; a small dim pale-gold tag floats there.
12 | 47.0 s Wide, quiet: rain on a grey street, Spud alone under the bakery's striped awning with the bun in his hand, shoulders down, THE GLASSES on; the street clearly greyer than in panel 06.""",
2: """13 | 50.0 s Spud's small flat, cool light: Spud taping a sheet of newspaper over his hall mirror, THE GLASSES on.
14 | 54.0 s Spud's kitchen: Spud wincing as he catches his own reflection, glasses and all, in a shiny steel kettle.
15 | 57.0 s A wet street: Spud stepping over a puddle with his head turned away, but his reflection with THE GLASSES shows clearly in the water.
16 | 62.0 s Night, Mash's half-empty flat, boxes stacked as tables, warm string lights, a small speaker on a box: Mash pressing play on the speaker, Chip and Wedge cheering with raised arms.
17 | 66.0 s Wide: Chip, Wedge and Mash dancing between the boxes, laughing, warm golden light.
18 | 70.0 s Medium: Spud standing in the corner by the dark window, THE GLASSES on, looking up above his own head instead of at the dancers.
19 | 72.0 s Medium: Chip tugging Spud's sleeve to pull him to the dance; Spud holding up one finger for "one second", not looking at Chip.
20 | 75.0 s Beauty wide from the doorway: the dancers in warm golden light on the left; Spud's corner on the right cool and grey, the warmth stopping at a clear soft edge just before him.
21 | 84.0 s GLASSES VIEW: Mash in the middle of the room glancing over toward the camera, his tag a little dimmer than in panel 04.
22 | 88.0 s Close: Spud watching Mash with narrowed eyes and writing in his small notebook, not walking over.
23 | 95.0 s Night: Mash alone on a small balcony, hands in his hoodie pocket, looking out over the town lights, quiet.
24 | 97.0 s Wide, quiet: the room after the party, string lights still on, empty cups on the boxes, Spud standing alone among the boxes, grey.""",
3: """25 | 100.0 s Sunday morning, the nearly empty flat in cold light: Spud on his knees opening box after box, searching, strips of tape everywhere.
26 | 106.0 s Close: THE DON'T-KEEP BOX again; Spud's hand lifting out the green glasses case; under it an old school notebook with a scratched, worn cover.
27 | 110.0 s Top-down close: the open notebook: a page of childish handwriting in tiny unreadable scribbles, a little pencil drawing of a potato with a leaf on a bicycle, a long list with tick marks.
28 | 114.0 s Close: Spud reading the notebook, eyes wide, THE GLASSES pushed up on his forehead.
29 | 118.0 s MEMORY, warm watercolour: young Spud (smaller and rounder, a little teal sweater, a tiny leaf) riding a small red bicycle down a grassy hill in summer, whistling, carefree, one small bright pale-gold tag above his head.
30 | 122.0 s MEMORY, warm watercolour: young Mash (small and narrow, a little charcoal hoodie, THE GLASSES on his nose) standing at the foot of the hill holding the notebook, watching young Spud ride by, a little sad.
31 | 126.0 s Present: Mash in the doorway of the empty room with a roll of tape, a soft surprised smile.
32 | 130.0 s Wide: Spud and Mash side by side on two boxes in the empty room, Mash turning THE GLASSES over in his hands, morning light from a bare window.
33 | 136.0 s Close: Mash laughing softly, looking at the glasses fondly.
34 | 142.0 s Medium: Mash back to taping a box and humming; Spud in the background, still.
35 | 145.0 s Close: Spud looking at his own reflection in the bare window, THE GLASSES on, thoughtful; the street and the van below.
36 | 148.0 s Wide from the window: the packed moving van in the street, its potato driver waving up from the cab; Mash at the door pulling on his jacket.""",
4: """37 | 150.0 s Late afternoon at the kerb: the closed van, two old bicycles leaning against it, one blue, one red; Mash nodding toward the hill on the edge of town.
38 | 154.0 s Beauty wide: Mash and Spud riding up a winding country road on a grassy hill in golden late light, Mash ahead and whistling; Spud behind, THE GLASSES on, glancing up above his head.
39 | 160.0 s Wide: the hilltop: an old wooden bench under a lone tree, a wide valley below; Spud stopped beside his bike, out of breath, THE GLASSES on; Mash already sitting on the bench.
40 | 162.0 s GLASSES VIEW: the whole valley and the setting sun in greyscale from the hilltop; Mash on the bench with his bright tag.
41 | 168.0 s Medium: Mash on the bench turning his head toward Spud, gentle, one hand patting the bench beside him.
42 | 172.0 s Close: Spud lifting THE GLASSES off his face with one hand, eyes opening.
43 | 174.0 s Beauty wide, the richest colour of the film: the valley in full golden hour: a river shining gold, red and orange autumn woods, a small town with church roofs, a railway line on an old stone viaduct glowing in the low sun; Spud and Mash small on the bench under the tree.
44 | 178.0 s Medium: Spud and Mash on the bench laughing, both whistling; Chip and Wedge arriving out of breath and dropping onto the grass beside them.
45 | 186.0 s Close: THE GLASSES lying folded on the bench, lenses facing Spud; through one lens, Spud's figure is seen small with one large bright pale-gold tag above him.
46 | 190.0 s Medium: Mash hugging Spud tightly beside the bench, his bag over his shoulder, the train station far below.
47 | 193.0 s Beauty wide: sunset, the sun touching the hills, far below a small train crossing the stone viaduct, one tiny hand waving from a window; Spud seen from behind in the foreground with Chip and Wedge beside him.
48 | 199.0 s Medium: Spud walking away down the path in the last light, smiling; THE GLASSES left behind on the bench.""",
}

ROWS = {1: (1, 12), 2: (13, 24), 3: (25, 36), 4: (37, 48)}
REFS = {
 1: [r"references\spud-reference-sheet-2026-11-11.png", r"out\mash-reference-sheet-2026-11-12.png", r"out\wedge-reference-sheet-2026-11-12.png"],
 2: [r"references\spud-reference-sheet-2026-11-11.png", r"out\mash-reference-sheet-2026-11-12.png", r"out\chip-reference-sheet-2026-11-12.png", r"out\wedge-reference-sheet-2026-11-12.png"],
 3: [r"references\spud-reference-sheet-2026-11-11.png", r"out\mash-reference-sheet-2026-11-12.png"],
 4: [r"references\spud-reference-sheet-2026-11-11.png", r"out\mash-reference-sheet-2026-11-12.png", r"out\chip-reference-sheet-2026-11-12.png", r"out\wedge-reference-sheet-2026-11-12.png"],
}
for n in range(1, 5):
    s, e = ROWS[n]
    nums = [f"{i:02d}" for i in range(s, e + 1)]
    style = STYLE.format(n=n, a=nums[0], b=nums[2], c=nums[3], d=nums[5], e=nums[6], f=nums[8], g=nums[9], h=nums[11])
    head = f"# Happiness score film, sheet {n} of 4 (panels {nums[0]}-{nums[-1]}), 12 panels, 16:9 cells\n# References: " + ", ".join(REFS[n]) + "\n\nPROMPT START\n"
    body = style + "\n\n" + CAST + "\n\n" + COLOUR[n] + "\n\nPANELS (number badges " + nums[0] + " to " + nums[-1] + ", the time is only for order, do not draw it):\n" + PANELS[n] + "\n"
    open(os.path.join(D, f"sheet-{n}-prompt.txt"), "w").write(head + body)
    print(n, len(head + body))
