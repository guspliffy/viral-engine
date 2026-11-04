// One seamless surface for an arm and its glove hand (def.hands.seamless): the forearm, palm, fingers and thumb are
// round cones joined by a smooth minimum (Inigo Quilez, iquilezles.org/articles/smin), so the wrist and the finger
// roots grow out of each other with soft fillets instead of separate parts meeting at an ink line. The distance field
// is sampled on a grid snapped to fixed world steps and turned into triangles by surface nets (0fps.net), each vertex
// pulled onto the true surface and lit with the field's own gradient, so the ink outline only draws real silhouettes.
import * as THREE from "three";
import { meshArrays } from "./handmesh-core.js";
export { cone, field, meshArrays, shapeKey } from "./handmesh-core.js";

// a BufferGeometry from meshArrays' output (made here or on a worker, mesh-pool.js)
export function geometryOf(m, old = null) {
  const geo = old || new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(m.pos, 3));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(m.nrm, 3));
  geo.setAttribute("ink", new THREE.Float32BufferAttribute(m.ink, 1));
  geo.setIndex(new THREE.BufferAttribute(m.idx, 1)); geo.computeBoundingSphere(); geo.computeBoundingBox();
  return geo;
}

// the skin's geometry: surface nets over the shape's field (handmesh-core.js meshArrays)
export function meshShape(shape, h = 0.003, old = null, inkFade = [-5, 15]) { return geometryOf(meshArrays(shape, h, inkFade), old); }

// the ink line of a seamless skin (and of the arm tube under it): the surface pushed out like three's OutlineEffect does
// (a fixed share of the screen) but only across the screen, not towards the camera, and by the vertex's ink weight, so
// the line thins away in creases. OutlineEffect's push towards the camera made one part's line show through another
// part close in front of it as dark specks. color, thickness: the look's line for the limbs, set each frame by the owner
export function inkMaterial() {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: { thickness: { value: 0 }, color: { value: new THREE.Color(0, 0, 0) }, ...THREE.UniformsLib.fog },
    fog: true,
    vertexShader: [
      "#include <common>", "#include <fog_pars_vertex>", "#include <logdepthbuf_pars_vertex>",
      "attribute float ink; uniform float thickness;",
      "void main() {",
      "  vec3 transformed = position;",
      "  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); vec4 pos = projectionMatrix * mvPosition;",
      "  vec4 pos2 = projectionMatrix * modelViewMatrix * vec4(position - 0.01 * normal, 1.0);",
      "  vec2 d = pos.xy / pos.w - pos2.xy / pos2.w; float l = length(d);",
      "  gl_Position = pos; if (l > 1e-9) gl_Position.xy += d / l * thickness * ink * pos.w;",
      "  #include <logdepthbuf_vertex>", "#include <fog_vertex>",
      "}",
    ].join("\n"),
    fragmentShader: [
      "#include <common>", "#include <fog_pars_fragment>", "#include <logdepthbuf_pars_fragment>",
      "uniform vec3 color;",
      "void main() {", "  #include <logdepthbuf_fragment>", "  gl_FragColor = vec4(color, 1.0);",
      "  #include <tonemapping_fragment>", "#include <colorspace_fragment>", "#include <fog_fragment>", "}",
    ].join("\n"),
  });
}
