// Kid vs Dad 08 "Dad's jokes come true": the spoken lines, in order. Jonny 27 Nov 2026 21:55 Berlin picked every starred option
// (/mnt/project-files/videos/kid-vs-dad/08-dad-jokes-ranked/OPTIONS.md: ladder C1 fridge door, jokes 1-5, hook H1, ending E1);
// panel sheet v1 OK 22:17 Berlin (sheets/kid-vs-dad-08-panels-v1.png in the project folder).
// Cast: spud = Tato (spud-kid, the only name said), dad = Dad B (never named).
// Rule told by the story: every joke Dad tells comes true. Dad: "Nothing beats them." (what the ending breaks)
// Natural counter: instant photos on the fridge door. Dad slaps each one under the gold magnet (top spot), Tato moves it to the
// bottom; the bottom row fills 1 -> 5, the gold magnet stays empty until Tato's own joke. No rank text anywhere.
// Escalation: Tato's "lower" gets flatter, Dad gets louder; each joke is bigger than the last (corner -> shoes -> beard ->
// Tato himself -> the whole kitchen). Ending E1: "You're toast." Dad becomes toast, Tato's photo takes the gold magnet. CUT.
// Voices: tato + dad at tempo 1.15 in voices.json (25 Nov rule), so the takes are already 15 % faster.
// [who, line, tone, style (VoxCPM2 acting direction), { voice }]
const KID = { voice: "tato" }, DAD = { voice: "dad" };
export const LINES = [
  // 0-5 s HOOK H1: power words "greatest", "nothing", "true"; the question = which joke is the worst
  ["dad", "Tato! Tonight I rank my greatest jokes. Nothing beats them.", "excited", "a proud showman, camera raised like a trophy, booming", DAD],
  ["spud", "Problem. His jokes come true.", "whisper", "a seven-year-old to the camera, dead serious, deadpan", KID],
  // 5-16 s JOKE 1: the corner
  ["spud", "Dad, I'm cold.", "sad", "small, shivering, hugging himself", KID],
  ["dad", "Go stand in the corner. It's ninety degrees.", "happy", "delighted with himself, pointing grandly, a classic dad joke", DAD],
  ["spud", "Hot. Hot. Hot!", "angry", "hopping in a glowing hot corner, steaming, rising panic", KID],
  ["dad", "Top spot!", "excited", "snapping the photo, slapping it on the fridge, triumphant", DAD],
  ["spud", "Bottom.", "calm", "flat, moving the photo down, unimpressed", KID],
  // 16-27 s JOKE 2: the shoes
  ["spud", "Dad, can you put my shoes on?", "question", "polite, holding out his small red sneakers", KID],
  ["dad", "Sure. But they won't fit me.", "happy", "grinning, already squeezing his big foot in", DAD],
  ["dad", "Perfect fit!", "excited", "waddling, wobbling, arms out for balance, very proud", DAD],
  ["spud", "Those are my shoes.", "calm", "flat, standing in his socks", KID],
  ["dad", "Top spot!", "excited", "snapping the photo, the same triumph", DAD],
  ["spud", "Lower.", "calm", "flatter, moving it down without looking", KID],
  // 27-39 s JOKE 3: the beard
  ["dad", "I used to hate facial hair...", "calm", "slow, dramatic, a long build-up, stroking his chin", DAD],
  ["spud", "Dad. Don't.", "sad", "begging quietly, already backing away", KID],
  ["dad", "But then it grew on me!", "excited", "the big reveal, arms wide", DAD],
  ["spud", "I can't feel my legs.", "calm", "deadpan, tangled to his waist in a sea of beard", KID],
  ["dad", "Top spot!", "excited", "snapping the photo through the beard", DAD],
  ["spud", "Lower.", "calm", "flatter still, wading to the fridge", KID],
  // 39-52 s JOKE 4: Tato himself
  ["spud", "I'm hungry. Can you make me a sandwich?", "question", "tired, small, sitting at the table", KID],
  ["dad", "Poof! You're a sandwich.", "happy", "a magician, wiggling his fingers, delighted", DAD],
  ["spud", "I hate this house.", "calm", "between two slices of bread, a lettuce leaf on his head, totally flat", KID],
  ["dad", "Top spot!", "excited", "snapping the photo, louder, insisting", DAD],
  ["spud", "Still lower.", "calm", "shuffling to the fridge in the bread, flat", KID],
  // 52-68 s JOKE 5 (biggest): the moon, everything floats; Dad pins it under the gold magnet floating upside down
  ["dad", "Fine. My best one. A restaurant on the moon.", "calm", "low, serious, a drumroll voice, leaning in", DAD],
  ["spud", "No. No no no.", "sad", "panicking quietly, grabbing the table", KID],
  ["dad", "Great food. No atmosphere!", "excited", "the punchline, arms up", DAD],
  ["spud", "Dad. Where's the gravity?", "question", "floating upside down, calm and done", KID],
  ["dad", "Top spot! Nothing beats the moon!", "excited", "floating, pressing the photo under the gold magnet, ecstatic", DAD],
  // 68-80 s ENDING E1: gravity snaps back, the crash, Tato's joke, POOF toast, Tato's photo takes the gold magnet. CUT.
  ["spud", "Dad...", "calm", "flat on his face on the floor, muffled, slow", KID],
  ["dad", "Yes?", "happy", "smug, hands on hips, the winner", DAD],
  ["spud", "You're toast.", "calm", "deadpan, slowly raising his head", KID],
  ["spud", "Top spot.", "calm", "smug, quiet, slapping the photo under the gold magnet, the last word", KID],
];
