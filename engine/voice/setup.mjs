// One-time setup for real speech: a Python venv with Kokoro (engine/voice/.venv) and the model files
// (engine/voice/models, ~350 MB, from the kokoro-onnx GitHub release). Works on Linux, macOS and Windows.
//   node engine/voice/setup.mjs
//   node engine/voice/setup.mjs --vc   also the voice conversion venv (engine/voice/.venv-vc: torch + chatterbox-tts, ~3 GB,
//                                      MIT; its model downloads from Hugging Face on first use) for recipes with "convert"
//   node engine/voice/setup.mjs --vox  also the VoxCPM2 venv (engine/voice/.venv-vox: CPU torch + voxcpm, ~1.5 GB, Apache
//                                      2.0) and its model (~5 GB from Hugging Face) for recipes with "vox" (vox.py).
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

// A venv made for another Python (CI restores it from a cache; a new runner image brings a new Python, 10 Nov 2026)
// still has bin/python but no pip for it: make it again.
function makeVenv(dir) {
  const p = path.join(dir, process.platform === "win32" ? "Scripts/python.exe" : "bin/python");
  if (fs.existsSync(p) && spawnSync(p, ["-m", "pip", "--version"], { stdio: "ignore" }).status !== 0) {
    console.log(`${path.relative(process.cwd(), dir)} belongs to another Python: making it again`);
    fs.rmSync(dir, { recursive: true, force: true });
  }
  if (!fs.existsSync(p)) {
    const sys = process.platform === "win32" ? "py" : "python3";
    console.log(`creating ${path.relative(process.cwd(), dir)} with ${sys}`);
    run(sys, ["-m", "venv", dir]);
  }
  return p;
}
const py = makeVenv(path.join(HERE, ".venv"));
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
  const vpy = makeVenv(path.join(HERE, ".venv-vc"));
  run(vpy, ["-m", "pip", "install", "-q", "chatterbox-tts==0.1.7", "praat-parselmouth==0.4.7", "soundfile"]);
  run(vpy, ["-c", "from chatterbox.vc import ChatterboxVC; ChatterboxVC.from_pretrained('cpu'); print('voice conversion ready')"]);
}

// --vox: VoxCPM2 for recipes with "vox" (7 Nov 2026). CPU-only torch wheels (the default ones carry ~3 GB of CUDA)
if (process.argv.includes("--vox")) {
  const vpy = makeVenv(path.join(HERE, ".venv-vox"));
  run(vpy, ["-m", "pip", "install", "-q", "torch==2.15.0", "torchaudio", "--index-url", "https://download.pytorch.org/whl/cpu"]);
  run(vpy, ["-m", "pip", "install", "-q", "voxcpm==2.0.3", "soundfile", "faster-whisper==1.2.1"]);   // whisper: timing + misread check
  run(vpy, ["-c", "from voxcpm import VoxCPM; VoxCPM.from_pretrained('openbmb/VoxCPM2', load_denoiser=False, optimize=False, device='cpu'); from faster_whisper import WhisperModel; WhisperModel('small', device='cpu', compute_type='int8'); print('VoxCPM2 ready')"]);
}
