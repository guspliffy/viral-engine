// One-time setup for real speech: a Python venv with Kokoro (engine/voice/.venv) and the model files
// (engine/voice/models, ~350 MB, from the kokoro-onnx GitHub release). Works on Linux, macOS and Windows.
//   node engine/voice/setup.mjs
//   node engine/voice/setup.mjs --vc   also the voice conversion venv (engine/voice/.venv-vc: torch + chatterbox-tts, ~3 GB,
//                                      MIT; its model downloads from Hugging Face on first use) for recipes with "convert"
// Licenses: Kokoro-82M weights and voices Apache 2.0, kokoro-onnx MIT (commercial use allowed). espeak-ng (GPL v3,
// bundled by kokoro-onnx) only turns text into phonemes; the GPL covers that program, not the audio we make with it.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MODELS = path.join(HERE, "models");
const RELEASE = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0";
const run = (cmd, args) => { const r = spawnSync(cmd, args, { stdio: "inherit" }); if (r.status !== 0) throw new Error(`${cmd} ${args.join(" ")} failed`); };

const venv = path.join(HERE, ".venv"), py = path.join(venv, process.platform === "win32" ? "Scripts/python.exe" : "bin/python");
if (!fs.existsSync(py)) {
  const sys = process.platform === "win32" ? "py" : "python3";
  console.log(`creating ${path.relative(process.cwd(), venv)} with ${sys}`);
  run(sys, ["-m", "venv", venv]);
}
run(py, ["-m", "pip", "install", "-q", "-r", path.join(HERE, "requirements.txt")]);

fs.mkdirSync(MODELS, { recursive: true });
for (const f of ["kokoro-v1.0.onnx", "voices-v1.0.bin"]) {
  const dst = path.join(MODELS, f);
  if (fs.existsSync(dst)) continue;
  console.log(`downloading ${f}`);
  const res = await fetch(`${RELEASE}/${f}`);
  if (!res.ok) throw new Error(`download ${f}: HTTP ${res.status}`);
  fs.writeFileSync(dst + ".part", Buffer.from(await res.arrayBuffer()));
  fs.renameSync(dst + ".part", dst);
}
// first run patches the model to report phoneme durations (for lip sync) and checks everything works
run(py, ["-c", `import sys; sys.path.insert(0, ${JSON.stringify(HERE)}); import tts; tts.durations_model(); print("voice model ready")`]);

// --vc: voice conversion for recipes with "convert" (Pebble, 6 Nov 2026), a separate venv because torch is large
if (process.argv.includes("--vc")) {
  const vv = path.join(HERE, ".venv-vc"), vpy = path.join(vv, process.platform === "win32" ? "Scripts/python.exe" : "bin/python");
  if (!fs.existsSync(vpy)) run(process.platform === "win32" ? "py" : "python3", ["-m", "venv", vv]);
  run(vpy, ["-m", "pip", "install", "-q", "chatterbox-tts==0.1.7", "praat-parselmouth==0.4.7", "soundfile"]);
  run(vpy, ["-c", "from chatterbox.vc import ChatterboxVC; ChatterboxVC.from_pretrained('cpu'); print('voice conversion ready')"]);
}
