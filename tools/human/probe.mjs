import fs from "node:fs";
import * as THREE from "three";
import { Performance, prepClip, worldPose, palmWorld } from "../../engine/page/rigs/human-perform.js";
const [name, step = "0.1"] = process.argv.slice(2);
const C = prepClip(JSON.parse(fs.readFileSync(`assets/mocap/${name}.json`, "utf8")));
const P = new Performance([{ at: 0, clip: name, place: [0, 0], heading: 0 }], { [name]: C });
for (let t = 0; t <= C.len + 1e-6; t += Number(step)) {
  const W = worldPose(P.at(t)), f = new THREE.Vector3(0, 0, 1).applyQuaternion(W.thorax.q); f.y = 0; f.normalize();
  const ch = W.thorax.end, L = palmWorld(W, "l"), R = palmWorld(W, "r");
  const ext = (h) => h.clone().sub(ch).dot(f).toFixed(2);
  const fy = Math.min(W.lfoot.end.y, W.rfoot.end.y);
  console.log(t.toFixed(2), "pelvis", W.root.start.toArray().map((v) => v.toFixed(2)).join(","), "L", L.toArray().map((v) => v.toFixed(2)).join(","), "R", R.toArray().map((v) => v.toFixed(2)).join(","), "extL", ext(L), "extR", ext(R), "foot", fy.toFixed(2));
}
