Set-Location "C:\Users\jonas\Downloads\viral engine\codex-image-trial\out\sol-traffic-r1"
$imgs = Get-ChildItem *.jpg, *.png | Sort-Object Name | ForEach-Object { '-i'; $_.FullName }
$t0 = Get-Date
Get-Content SOL-BRIEF.md -Raw | codex exec --skip-git-repo-check --sandbox workspace-write -m gpt-6.2-sol -c model_reasoning_effort="xhigh" @imgs -o answer.md - *> run.log
$t1 = Get-Date
"start $t0`nend $t1`nseconds $([int]($t1-$t0).TotalSeconds)" | Set-Content run-time.txt -Encoding utf8
