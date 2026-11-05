import * as THREE from "three";

// Light that ties the characters to the painted world (quality plan item 18, wave 3 K; opt-in, Jonny's call).
// Storyboard: "set": { ..., "lighting": 2 } or "lighting": { "v": 2, ...overrides }. Without it nothing here runs and
// every frame is drawn as before.
//
// What it does, all from data, never from edits to the set files (clip threads add set-*.js files every day):
//   1. measures the set's painting (an env's paint.png, a plate's picture) once before the first frame: the colour of
//      its light (the mid tones), of its shadows (the darkest fifth), of its brightest lights, and how bright it is;
//   2. grades the characters and props only (not the painting, not the 3D set): their lit side takes the painting's
//      light colour, their shade its shadow colour, their exposure its brightness, so a moonlit garden lights the cast
//      cool and dim and a lamp-lit bistro warm (the potato skin takes about half as much, so it stays golden);
//   3. an edge light on the side the key light comes from (set.key, an env's env.json light.key), coloured by the
//      painting's brightest lights, stronger at night where the cast would sink into a dark background;
//   4. soft contact occlusion: every body, foot, hand and small prop darkens the floor, furniture and props near it
//      (analytic sphere occlusion, Quilez), so feet stand on the floor, a body sits in a chair and a held cup darkens
//      the table under it. On a painted env (whose ground and cards are unlit pictures) the painting itself takes it,
//      as if each painted pixel were floor facing up;
//   5. the contact shadow ovals (looks.js groundShadows) take the painting's shadow colour.
// Overrides in the lighting block: key (direction, as set.key), light / shadow / rim (colours), exposure (0.6-1.1),
// grade (0..1, how much of the painting's colour the cast takes, 1 default), rimK (edge light strength), ao (contact
// occlusion strength, 0 off), measure: false (no picture: only key, rim and occlusion).
// Deterministic: the measure is a pure function of the picture (rounded to 3 decimals), the occluders of the pose.

export const AO_MAX = 32;

// the lighting block of a set, normalised; null when off
export function lightingSpec(setSpec) {
  const L = setSpec?.lighting;
  if (!L) return null;
  if (L === 2 || L === true) return { v: 2 };
  if (typeof L === "object" && (L.v ?? 2) >= 2) return { v: 2, ...L };
  return null;
}

const lum = (c) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
const r3 = (x) => Math.round(x * 1000) / 1000;
const lin = (v) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
const hex = (c) => { const k = new THREE.Color(c); return [k.r, k.g, k.b]; };   // linear, as the measured colours

// the colour of a light without its brightness: luminance 1 (clamped so a saturated sky never turns a face blue)
function chroma(c, cap = 1.6) {
  const l = Math.max(lum(c), 1e-3);
  return c.map((v) => Math.min(cap, v / l));
}

// the picture a set is painted from (null: a built set with no painting)
export function paintingOf(setSpec) {
  if (setSpec?.type === "env" && setSpec.envData) return `/${String(setSpec.envData.dir || `assets/environments/${setSpec.env}`).replace(/^\/+/, "")}/paint.png`;
  const P = setSpec?.plate;
  if (P && P.src) return `/${String(P.src).replace(/^\/+/, "")}`;
  return null;
}

// measure a painting: drawn at 48 x 72 on a 2D canvas (CPU), pixels sorted by luminance
function measure(url) {
  return new Promise((ok) => {
    const im = new Image();
    im.onload = () => {
      const w = 48, h = 72, c = document.createElement("canvas"); c.width = w; c.height = h;
      const g = c.getContext("2d", { willReadFrequently: true }); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = "high";
      g.drawImage(im, 0, 0, w, h);
      const d = g.getImageData(0, 0, w, h).data, px = [];
      // sorted by the luminance we see (sRGB), averaged as light (linear, the renderer's working space: THREE.Color)
      for (let i = 0; i < d.length; i += 4) { const p = [d[i] / 255, d[i + 1] / 255, d[i + 2] / 255]; px.push([lum(p), p.map(lin)]); }
      px.sort((a, b) => a[0] - b[0]);
      const band = (a, b) => { const s = [0, 0, 0], i0 = Math.floor(a * px.length), i1 = Math.max(i0 + 1, Math.floor(b * px.length)); for (let i = i0; i < i1; i++) for (let k = 0; k < 3; k++) s[k] += px[i][1][k]; return s.map((v) => r3(v / (i1 - i0))); };
      const mean = r3(px.reduce((s, p) => s + p[0], 0) / px.length);
      ok({ light: band(0.4, 0.8), shadow: band(0.03, 0.22), bright: band(0.97, 1), mean });
    };
    im.onerror = () => ok(null);
    im.src = url;
  });
}

// The rig for one storyboard. ctx: { scene, setSpec, actors, props }. Returns null when the set has no lighting block.
export function makeLightRig({ scene, setSpec, actors, props }) {
  const spec = lightingSpec(setSpec);
  if (!spec) return null;
  const night = !!(setSpec.night || ["kitchen", "porch", "cottage", "nighthall"].includes(setSpec.type));
  const keyPos = new THREE.Vector3(...(spec.key || setSpec.key || (setSpec.light === "golden" ? [4.2, 4.0, 2.6] : [-5.0, 4.4, 0.8])));
  const keyDir = keyPos.clone().normalize();
  const R = { spec, keyDir, m: null, applied: false };
  const url = spec.measure === false ? null : paintingOf(setSpec);
  if (url) (globalThis.__loads ||= []).push(measure(url).then((m) => { R.m = m; }));

  // ---- shared uniforms: every patched material reads the same objects
  const U = {
    backDir: { value: new THREE.Vector3(-0.9, 0.55, -0.3) },
    ao: { value: Array.from({ length: AO_MAX }, () => new THREE.Vector4(0, -100, 0, 0)) },
    krim: { value: new THREE.Color(0, 0, 0) }, aoN: { value: 0 }, aoK: { value: spec.ao ?? 0.8 }, aoCol: { value: new THREE.Color(0.42, 0.38, 0.48) },
  };
  R.uniforms = U;

  // the painting's numbers turned into the cast's colours (looks.js passes its ROLE table once, before any material
  // is converted)
  R.roles = (ROLE, grounding) => {
    if (R.applied) return; R.applied = true;
    const m = R.m, g = spec.grade ?? 1;
    // the key's colour: the painting's brightest lights (sky, sun patches, lamps), half desaturated; the shade's: its
    // darkest fifth (the shadows and the sky they take), a third desaturated, so grass bounce never turns a face green
    const mean = m ? m.mean : night ? 0.2 : 0.45;
    const dark = spec.night ?? (night || mean < 0.36);
    // at night the brightest pixels are the lamps, not the light the cast stands in: the key takes the mid tones (the
    // moonlit grass and sky) and the lamps colour the edge light instead
    const keyC = spec.light ? hex(spec.light) : m ? (dark ? m.light : m.bright) : [1, 0.97, 0.92];
    const shadowC = spec.shadow ? hex(spec.shadow) : m ? m.shadow : [0.4, 0.4, 0.5];
    // exposure: a daylight painting leaves the cast as it is; a darker one dims it a little, never under 0.85, so the
    // faces still read at phone size (0.85 at most at night; Jonny 5 Nov 18:18 "a bit stronger" than the first trial)
    const exp = spec.exposure ?? r3(Math.min(dark ? 0.85 : 1, Math.max(0.82, 0.78 + 0.4 * mean)));
    const desat = (c, k) => c.map((v) => 1 + (v - 1) * k);
    // the shade as a painter mixes it: green never leads a shadow on the cast (the night garden's teal shade turned the
    // golden skin olive): green is held to the middle of red and blue, which moves teal toward blue and grass toward grey;
    // the same holds the key (a night key is the moonlit grass)
    const noGreen = (c) => { const g = Math.min(c[1], (c[0] + c[2]) / 2 + 0.04); return [Math.max(c[0], g), g, c[2]]; };   // and red never under green: a cool shade is blue-violet, not cyan
    const lc = desat(chroma(noGreen(chroma(keyC, 1.5)), 1.5), 0.55), sc = desat(chroma(noGreen(chroma(shadowC, 1.8)), 1.8), 0.6);
    const tint = (base, c, k) => base.map((v, i) => r3(v * (1 + (c[i] - 1) * k * g)));
    const scale = (v, k) => v.map((x) => r3(x * k));
    // how much of the painting's colour each role takes (lit, shade): skin less (the potatoes stay golden)
    const K = { skin: [0.4, 0.75], lid: [0.4, 0.75], char: [0.55, 0.85], cloth: [0.55, 0.85], glove: [0.55, 0.85], lining: [0.55, 0.85], hair: [0.5, 0.8], wood: [0.6, 0.85] };
    const rimC = (spec.rim ? hex(spec.rim) : m ? m.bright : keyC).map((v) => Math.min(1, v));
    const rimK = spec.rimK ?? (dark ? 0.75 : 0.5);
    U.krim.value.setRGB(...rimC.map((v) => r3(v * rimK)));
    R.base = {};
    for (const [role, [kl, ks]] of Object.entries(K)) {
      const r = ROLE[role];
      if (!r) continue;
      R.base[role] = r;
      const lit = scale(tint(r.lit, lc, kl), exp), shade = scale(tint(r.shade, sc, ks), exp * (dark ? 0.93 : 0.98));
      // the edge light on everything but the eyelids and the hood's inside (a lid with its own lit edge bulges)
      const edge = role === "lid" || role === "lining" ? {} : { krim: U.krim, keyDirU: U.backDir, krimK: role === "skin" ? 1 : role === "glove" ? 0.35 : 0.45 };
      ROLE[role] = { ...r, lit, shade, ...edge };
    }
    // props take half the grade (a red picnic blanket in teal moonlight went grey at the full grade)
    const mix = (a, b, k) => a.map((v, i) => r3(v + (b[i] - v) * k));
    R.prop = (role) => { const b = R.base[role], r = ROLE[role]; return b ? { ...r, lit: mix(b.lit, r.lit, 0.5), shade: mix(b.shade, r.shade, 0.5), krimK: 0.5 } : r; };
    // the contact occlusion takes the painting's shadow colour
    U.aoCol.value.setRGB(...sc.map((v) => r3(Math.min(1, v * 0.42))));
    // the contact ovals keep their depth (a lighter colour at the same opacity washed the whole floor out on the tent's
    // grass) and take the painting's shadow hue: the luminance of looks.js's dark brown, the hue of the painting's shadows
    if (grounding && grounding.setColor) grounding.setColor(new THREE.Color(...sc.map((v) => r3(Math.min(1, v * 0.022)))));   // #2a2019 is 0.022 in linear light
    R.summary = { key: keyC, shadow: shadowC, rim: rimC, rimK, mean, exposure: exp, night: dark };
    globalThis.__lighting = R.summary;   // for the trial's report
  };

  // ---- contact occlusion: receivers are set and prop materials (looks.js patchToon with o.ao) and, on a painted env,
  // the painting itself (its ground and the cards in front of it are unlit pictures: patchPainted below, as if every
  // painted pixel were floor facing up); occluders are the cast's bodies, feet and hands and small props
  R.envFloor = setSpec.type === "env" && (spec.ao ?? 0.8) > 0;

  const v = new THREE.Vector3(), box = new THREE.Box3(), sz = new THREE.Vector3(), shown = (o) => { for (; o; o = o.parent) if (!o.visible) return false; return true; };
  R.update = (camera) => {
    camera.updateMatrixWorld();
    U.backDir.value.copy(keyDir).transformDirection(camera.matrixWorldInverse);
    const S = U.ao.value; let n = 0;
    const add = (x, y, z, r) => { if (n < AO_MAX && r > 0.005) S[n++].set(r3(x), r3(y), r3(z), r3(r)); };
    for (const a of actors) {
      const rt = a.ch.root;
      if (!shown(rt) || !a.ch.potatoParts?.visible) continue;
      rt.updateMatrixWorld(true);
      const s = rt.scale.x || 1;
      // the body: an egg, taken as one sphere a little under its middle
      // the body mesh hangs from the root at the feet: its middle is its geometry's bounding-sphere centre
      const body = a.ch.body || rt;
      if (body.geometry) { if (!body.geometry.boundingSphere) body.geometry.computeBoundingSphere(); body.localToWorld(v.copy(body.geometry.boundingSphere.center)); } else body.getWorldPosition(v);
      const rb = ((a.ch.rx ?? 0.4) + (a.ch.rz ?? 0.35)) * 0.5 * s;
      add(v.x, v.y - 0.15 * (a.ch.ry ?? 0.4) * s, v.z, rb);   // where the body really is (a sit or a crouch lowers it)
      for (const sd of ["L", "R"]) {
        const f = a.ch.legs?.[sd]?.foot; if (f && shown(f)) { f.getWorldPosition(v); add(v.x, v.y + 0.03 * s, v.z, 0.07 * s); }
        const h = a.ch.arms?.[sd]?.hand; if (h && shown(h)) { h.getWorldPosition(v); add(v.x, v.y, v.z, 0.055 * (h.userData.size ?? 1) * s); }
      }
    }
    // small props (a cup, a phone, a bottle): furniture only receives (its own sphere would darken itself)
    for (const p of props) {
      if (!p.root || !shown(p.root)) continue;
      box.makeEmpty();
      p.root.traverse((o) => { if (o.isMesh && shown(o) && !o.userData.lookOnly && !o.userData.steam) box.expandByObject(o, false); });
      if (box.isEmpty()) continue;
      box.getSize(sz);
      if (Math.max(sz.x, sz.y, sz.z) > 0.5) continue;
      box.getCenter(v); add(v.x, v.y, v.z, Math.max(0.03, 0.42 * Math.cbrt(sz.x * sz.y * sz.z)));
    }
    for (let i = n; i < AO_MAX; i++) S[i].set(0, -100, 0, 0);
    U.aoN.value = n;
  };
  // an unlit painted material (an env's ground and cards): the occlusion multiplies the painting where it is drawn
  R.patchPainted = (m) => {
    if (!R.envFloor || m.userData.lightAO || m.colorWrite === false) return;
    m.userData.lightAO = true;
    const prev = m.onBeforeCompile, key = m.customProgramCacheKey;
    m.onBeforeCompile = (sh, r) => {
      if (prev) prev.call(m, sh, r);
      sh.uniforms.uAO = U.ao; sh.uniforms.uAON = U.aoN; sh.uniforms.uAOK = U.aoK; sh.uniforms.uAOCol = U.aoCol;
      sh.vertexShader = sh.vertexShader.replace("void main() {", "varying vec3 vLightW;\nvoid main() {")
        .replace("#include <project_vertex>", "#include <project_vertex>\n  vLightW = (modelMatrix * vec4(transformed, 1.0)).xyz;");
      sh.fragmentShader = sh.fragmentShader.replace("void main() {", `varying vec3 vLightW; uniform vec4 uAO[${AO_MAX}]; uniform int uAON; uniform float uAOK; uniform vec3 uAOCol;\n${AO_GLSL}\nvoid main() {`)
        .replace("#include <opaque_fragment>", "outgoingLight *= mix(vec3(1.0), uAOCol, sphereAO(vLightW, vec3(0.0, 1.0, 0.0), uAO, uAON) * uAOK);\n#include <opaque_fragment>");
      if (!sh.fragmentShader.includes("sphereAO(vLightW")) throw new Error("light.js: three's basic shader changed, the painted occlusion no longer applies");
    };
    m.customProgramCacheKey = () => `${key ? key.call(m) : ""}-light-ao`;
    m.needsUpdate = true;
  };
  return R;
}

// sphere occlusion summed over the occluders (Quilez): a sphere of radius r at distance l, seen from a surface with
// normal n, hides about (n.d/l)(r/l)^2 of its sky. Points inside a sphere (its own surface) get none. Broadened a
// little (1.3 r) so the falloff reads as a soft painted contact shadow, not a dark ring.
export const AO_GLSL = /* glsl */`
  float sphereAO(vec3 p, vec3 n, vec4 S[${AO_MAX}], int N) {
    float vis = 1.0;
    for (int i = 0; i < ${AO_MAX}; i++) {
      if (i >= N) break;
      vec3 d = S[i].xyz - p; float l = length(d), r = S[i].w * 1.3;
      if (l > r * 5.0) continue;
      float o = clamp(dot(n, d) / l, 0.0, 1.0) * (r * r) / (l * l);
      o *= smoothstep(S[i].w * 0.7, S[i].w * 1.0, l);
      vis *= 1.0 - clamp(o, 0.0, 1.0);
    }
    return 1.0 - vis;
  }`;
