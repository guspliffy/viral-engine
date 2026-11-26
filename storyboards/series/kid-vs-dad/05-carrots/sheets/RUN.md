# Codex run: Kid vs Dad 04, 05, 06 panel sheets (25 Nov 2026, Jonny 12:34 "create storyoutlines and then the panels in codex")
Folder on the PC: C:\Users\jonas\Downloads\viral engine\codex-image-trial\out\kid-vs-dad-04-06
Refs copied in first: ..\kid-vs-dad-02\kid-vs-dad-02-panels-v2.png, ..\kid-vs-dad-01\kid-vs-dad-reporter-v1.png,
..\kid-vs-dad-03-dad\dad-B-v1.png, mash-reference-sheet-2026-11-12.png (search under viral engine).
Prompts: 04-panels-prompt.txt, 05-panels-prompt.txt, 06-panels-prompt.txt (= the panels-prompt.txt in each episode's sheets/ folder).
One image at a time, never in parallel, Sol medium:
codex exec --skip-git-repo-check --sandbox workspace-write -m gpt-6.2-sol -c model_reasoning_effort="medium" "<DRIVER>" -i <refs...>  (prompt BEFORE -i)
04 refs: panels-v2, reporter, dad-B, mash. 05 + 06 refs: panels-v2, reporter, dad-B.
DRIVER: Generate one image with the built-in image tool. The built-in image tool IS the gpt-image-2 tool; call it as it is, with no model field. Set referenced_image_paths to the FULL paths of the attached files in the order given. Read NN-panels-prompt.txt in this folder and pass everything after the line PROMPT START as the image prompt, character for character, without rewriting. Save the result as kid-vs-dad-NN-panels-v1.png in this folder.
Outputs: kid-vs-dad-04-panels-v1.png, kid-vs-dad-05-panels-v1.png, kid-vs-dad-06-panels-v1.png.
