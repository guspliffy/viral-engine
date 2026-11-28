$dir = "C:\Users\jonas\Downloads\viral engine\codex-image-trial\out\thumb-traffic"
Set-Location $dir
$refs = @("$dir\ref-1.20.jpg", "$dir\ref-19.50.jpg", "$dir\ref-25.30.jpg", "$dir\ref-33.00.jpg", "$dir\ref-58.50.jpg")
foreach ($v in @("a", "b")) {
  $msg = "Generate one image with the built-in image tool, calling it exactly once. The built-in image tool IS the gpt-image-2 tool; call it as it is, with no model field. Set referenced_image_paths to the FULL paths of the attached files: $($refs -join ', '). Read thumb-$v-prompt.txt in this folder and pass everything after the line PROMPT START to the end as the image prompt, character for character, without rewriting. Ask for a portrait (tall) image. The generated file lands in a per-thread subfolder of C:\Users\jonas\.codex\generated_images\ - copy it from there and save it as thumb-$v.png in this folder. Do not edit the image afterwards."
  $t0 = Get-Date
  codex exec --skip-git-repo-check --sandbox workspace-write -m gpt-6-luna -c model_reasoning_effort="low" $msg -i @refs *> "thumb-$v.log"
  $t1 = Get-Date
  "thumb-$v start $t0 end $t1 seconds $([int]($t1-$t0).TotalSeconds)" | Add-Content run-time.txt -Encoding utf8
}
