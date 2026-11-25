# Codex run: Heaven/hell 4C "Heaven's terms and conditions" panel sheet (25 Nov 2026, Jonny picked H1 + E1)
Folder on the PC: C:\Users\jonas\Downloads\viral engine\codex-image-trial\out\heaven-terms
Refs copied in first (search under viral engine): heaven-steps\heaven-steps-panels-v1.png, references\spud-reference-sheet-2026-11-11.png, heaven-steps\heaven-steps-set-v1.png
One image, Sol medium:
codex exec --skip-git-repo-check --sandbox workspace-write -m gpt-6.2-sol -c model_reasoning_effort="medium" "<DRIVER>" -i heaven-steps-panels-v1.png spud-reference-sheet-2026-11-11.png heaven-steps-set-v1.png   (prompt BEFORE -i)
DRIVER: Generate one image with the built-in image tool. The built-in image tool IS the gpt-image-2 tool; call it as it is, with no model field. Set referenced_image_paths to the FULL paths of the attached files in the order given. Read panels-prompt.txt in this folder and pass everything after the line PROMPT START as the image prompt, character for character, without rewriting. Save the result as heaven-terms-panels-v1.png in this folder.
Output: heaven-terms-panels-v1.png -> copy to the project folder videos/potato-desk/heaven-hell-4/c-terms/sheets/.
