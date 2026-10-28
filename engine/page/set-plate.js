import * as THREE from "three";

// A painted background plate: a picture of the room (painted once per set, e.g. by the image model in tools/plates)
// hung as a flat backdrop behind the 3D stage, so the characters and the props they touch stay 3D in front of it.
// Use it on a "plain" set (its floor takes the shadows) with depth of field on, so the plate reads as far away.
//   spec.plate: { src: "assets/plates/<name>.png", z: -2.2 (where it hangs), center: [x, y] (its middle),
//                 height: 3.2 (metres; the width follows the picture), tint: "#ffffff" (multiplies it) }
// The picture loads before the first frame: stage.js waits for globalThis.__loads.
export function addPlate(scene, P) {
  const mat = new THREE.MeshBasicMaterial({ color: P.tint || "#ffffff", fog: false, toneMapped: false });
  mat.userData.noOutline = true;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
  const [x, y] = P.center || [0, (P.height ?? 3.2) / 2];
  mesh.position.set(x, y, P.z ?? -2.2); mesh.name = "set-plate"; scene.add(mesh);
  const load = new THREE.TextureLoader().loadAsync(`/${P.src.replace(/^\/+/, "")}`).then((tex) => {
    tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
    const h = P.height ?? 3.2; mesh.scale.set(h * tex.image.width / tex.image.height, h, 1);
    mat.map = tex; mat.needsUpdate = true;
  });
  (globalThis.__loads ||= []).push(load);
  return mesh;
}
