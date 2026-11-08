import * as THREE from "three";
import { rng } from "./util.js";

// "hilltop": the hill under Never Looks Up 07's roller coaster (8 Nov 2026, Jonny's board: a sunny seaside hilltop
// funfair, the fair far below, blue sea, a lighthouse on a cliff island, big white clouds).
//
// A coaster's cameras fly round 70 m of track and look every way, so one layered painting (set "env") can't cover
// them. This set covers every direction instead:
//   - a painted sky all round (a dome, unlit): a deep blue zenith to a pale horizon, big soft summer clouds, and under
//     the horizon the far coast (sea toward -x, green lowland and woods elsewhere), for whatever shows past the hill;
//   - the hilltop: a grass plateau at y 0 that ends in a steep drop on its -x side (spec.edge, the x of the brink,
//     wobbling like a real brink) and far off on its other sides, so the lowland below is never seen as geometry,
//     only as the dome or a far plate (props-coaster.js `farplate`: the painted fair, hung on one shot's rays).
// Trees and bushes come from the set's "models" / "scatter" (assets-gltf.js), placed by the generator off the track.
//
// spec: { type: "hilltop", seed, edge: -13 (x of the brink), center: [x, z] (the dome's middle), r: 230 (dome
//         radius; the cameras' far plane is 300 m), size: [x0, x1, z0, z1] (the plateau's far sides),
//         sky: [zenith, mid, horizon], grass: [light, dark] }
// Everything here is scenery (sets.js); nothing is solid for the contact checks.

function canvasTex(w, h, draw, rx = 1, ry = 1) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (rx !== 1 || ry !== 1) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); }
  return t;
}

// the sky all round, as an equirectangular painting: u 0 looks down -x, 0.25 +z, 0.5 +x, 0.75 -z (three's sphere)
function skyTexture(S, rnd) {
  const [zen, mid, hor] = S.sky || ["#2f74c9", "#5f9fe0", "#cfe4f2"];
  return canvasTex(4096, 2048, (x, W, H) => {
    const hz = H / 2, row = (deg) => hz - (deg / 90) * hz;   // elevation (deg) -> canvas row
    // the sky: deep at the top, paler toward the horizon (the air thickens), a warm-white haze just over it
    const g = x.createLinearGradient(0, 0, 0, hz);
    g.addColorStop(0, zen); g.addColorStop(0.55, mid); g.addColorStop(0.9, hor); g.addColorStop(1, "#e8f1f4");
    x.fillStyle = g; x.fillRect(0, 0, W, hz + 2);
    // big summer cumulus: flat grey-blue bases, white rounded tops lit from the upper left, in a few clumps with gaps
    // (many small, few big), wider the higher they sit (the map stretches rows by 1 / cos(elevation))
    const puff = (cx, cy, r, col) => {
      for (const ox of [-W, 0, W]) {
        const gr = x.createRadialGradient(cx + ox - r * 0.25, cy - r * 0.3, r * 0.1, cx + ox, cy, r);
        gr.addColorStop(0, col[0]); gr.addColorStop(0.7, col[1]); gr.addColorStop(1, col[2]);
        x.fillStyle = gr; x.beginPath(); x.ellipse(cx + ox, cy, r * col[3], r, 0, 0, Math.PI * 2); x.fill();
      }
    };
    const clumps = 9 + Math.floor(rnd() * 3);
    for (let k = 0; k < clumps; k++) {
      const u = (k + rnd() * 0.7) / clumps * W, el = 4 + rnd() ** 1.6 * 30, big = 0.4 + rnd() ** 2 * 1.4;
      const stretch = 1 / Math.cos((el * Math.PI) / 180), base = row(el), n = 10 + Math.floor(big * 16);
      const wide = 120 * big * stretch;
      // the shadowed base first, then the lit tops on it
      for (let i = 0; i < n; i++) {
        const px = u + (rnd() - 0.5) * wide * 2.2, r = (18 + rnd() * 34) * big;
        puff(px, base - r * 0.15, r, ["rgba(190,208,228,0.95)", "rgba(178,198,222,0.75)", "rgba(178,198,222,0)", stretch]);
      }
      for (let i = 0; i < n * 1.4; i++) {
        const t = rnd(), px = u + (rnd() - 0.5) * wide * 2 * (1 - t * 0.45), r = (16 + rnd() * 40) * big * (1 - t * 0.35);
        puff(px, base - r * 0.55 - t * 70 * big, r, ["rgba(255,255,255,1)", "rgba(246,250,255,0.92)", "rgba(240,246,252,0)", stretch]);
      }
    }
    // a few thin high streaks
    x.strokeStyle = "rgba(255,255,255,0.25)"; x.lineCap = "round";
    for (let i = 0; i < 14; i++) { const u = rnd() * W, y = row(40 + rnd() * 25), l = 120 + rnd() * 260; x.lineWidth = 6 + rnd() * 10; x.beginPath(); x.moveTo(u, y); x.lineTo(u + l, y - 8); x.stroke(); }

    // under the horizon: the far coast. The sea fills the -x side (u 0, wrapping), green lowland and woods the rest
    const sea = (u) => { const d = Math.min(Math.abs(u), Math.abs(u - 1)); return Math.max(0, Math.min(1, (0.2 - d) / 0.06)); };
    for (let px = 0; px < W; px += 4) {
      const s = sea(px / W);
      const lg = x.createLinearGradient(0, hz, 0, H);
      const seaTop = "#a9cfe0", seaDeep = "#4f8fbf", landTop = "#a8c6b6", land = "#6f9e5c", landDeep = "#56854a";
      const mix = (a, b, k) => { const A = new THREE.Color(a), B = new THREE.Color(b); return `#${A.lerp(B, k).getHexString()}`; };
      lg.addColorStop(0, mix(landTop, seaTop, s)); lg.addColorStop(0.03, mix(land, "#7fb4d4", s)); lg.addColorStop(0.12, mix(land, seaDeep, s));
      lg.addColorStop(0.35, mix(landDeep, mix(seaDeep, land, 0.6), s)); lg.addColorStop(1, landDeep);
      x.fillStyle = lg; x.fillRect(px, hz, 4, H - hz);
    }
    // woods and fields as soft dabs on the land, glints on the sea
    for (let i = 0; i < 2600; i++) {
      const u = rnd(), d = rnd() ** 1.5, y = hz + 6 + d * (H - hz) * 0.6, s = sea(u);
      if (s > 0.5 && d < 0.25) { x.fillStyle = `rgba(255,255,255,${0.12 + rnd() * 0.18})`; x.fillRect(u * W, y, 6 + rnd() * 18, 1.5); continue; }
      x.fillStyle = rnd() < 0.6 ? `rgba(60,110,60,${0.25 + rnd() * 0.3})` : `rgba(190,215,140,${0.15 + rnd() * 0.2})`;
      x.beginPath(); x.ellipse(u * W, y, 4 + d * 22, 2 + d * 9, 0, 0, Math.PI * 2); x.fill();
    }
    // the haze line where sky meets land
    const hg = x.createLinearGradient(0, hz - 14, 0, hz + 18);
    hg.addColorStop(0, "rgba(232,241,244,0)"); hg.addColorStop(0.45, "rgba(232,241,244,0.85)"); hg.addColorStop(1, "rgba(232,241,244,0)");
    x.fillStyle = hg; x.fillRect(0, hz - 14, W, 32);
  });
}

// the grass: painted strokes in two greens, a few flowers; tiles every 9 m
function grassTexture(S, rnd) {
  const [light, dark] = S.grass || ["#93cf6c", "#6fae52"];
  return canvasTex(1024, 1024, (x, W, H) => {
    x.fillStyle = light; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 70; i++) {   // soft darker patches (clumps of taller grass), in groups
      const cx = rnd() * W, cy = rnd() * H, r = 40 + rnd() ** 2 * 160;
      const g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, `${dark}66`); g.addColorStop(1, `${dark}00`);
      x.fillStyle = g; x.fillRect(cx - r, cy - r, 2 * r, 2 * r);
    }
    for (let i = 0; i < 9000; i++) {   // blade strokes
      const px = rnd() * W, py = rnd() * H, l = 5 + rnd() * 9, a = -Math.PI / 2 + (rnd() - 0.5) * 0.8;
      x.strokeStyle = rnd() < 0.5 ? "rgba(60,120,50,0.35)" : "rgba(210,240,170,0.35)"; x.lineWidth = 1.5;
      x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke();
    }
    for (let i = 0; i < 160; i++) {   // little flowers in loose drifts
      const cx = rnd() * W, cy = rnd() * H, c = ["#ffffff", "#fff3a0", "#ffd1e8"][Math.floor(rnd() * 3)];
      for (let k = 0; k < 4; k++) { x.fillStyle = c; x.beginPath(); x.arc(cx + (rnd() - 0.5) * 30, cy + (rnd() - 0.5) * 30, 2 + rnd() * 2, 0, Math.PI * 2); x.fill(); }
    }
  }, 1, 1);
}

// the ground height: 0 on the plateau, falling steeply past the brink (spec.edge on -x) and past the far sides
export function hilltopY(S, x, z) {
  const edge = (S.edge ?? -13) + 1.2 * Math.sin(z / 7.3) + 0.7 * Math.sin(z / 3.1 + 1.7);
  const [x0, x1, z0, z1] = S.size || [null, 75, -105, 50];
  const out = Math.max(edge - x, x - x1, z0 - z, z - z1, 0);
  return out <= 0 ? 0 : -(out ** 1.7) * 0.9;
}

export function buildHilltop(scene, S = {}) {
  const rnd = rng((S.seed || 7) * 977), g = new THREE.Group(); g.name = "set-hilltop"; scene.add(g);
  const [cx, cz] = S.center || [5, -30], R = S.r ?? 230;
  scene.background = new THREE.Color((S.sky || [])[2] || "#cfe4f2");

  const sky = new THREE.Mesh(new THREE.SphereGeometry(R, 96, 48), new THREE.MeshBasicMaterial({ map: skyTexture(S, rnd), side: THREE.BackSide, depthWrite: false, fog: false, toneMapped: false }));
  sky.position.set(cx, 0, cz); sky.renderOrder = -1000; sky.frustumCulled = false; sky.material.userData.noOutline = true; sky.name = "set-hilltop-sky";
  sky.userData.solid = false;   // the sky: nothing can touch it or hide behind it (keeps it out of the contact and face rays)
  g.add(sky);

  // the ground: a 400 m square around the plateau, 1.5 m cells near the brink so its lip stays round
  const N = 220, SZ = 420, geo = new THREE.PlaneGeometry(SZ, SZ, N, N); geo.rotateX(-Math.PI / 2);
  const p = geo.attributes.position, col = [], tint = new THREE.Color(), lip = new THREE.Color("#c9e39a"), shade = new THREE.Color("#4e7f43");
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) + cx, z = p.getZ(i) + cz, y = hilltopY(S, x, z);
    p.setXYZ(i, x, y, z);
    // the brink catches the light (a paler lip), the fall below it is in shade
    tint.setRGB(1, 1, 1);
    if (y < -0.05) tint.lerp(shade, Math.min(1, -y / 6));
    else { const e = hilltopY(S, x - 1.2, z); if (e < -0.05) tint.lerp(lip, 0.35); }
    col.push(tint.r, tint.g, tint.b);
  }
  geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3)); geo.computeVertexNormals();
  const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, p.getX(i) / 9, p.getZ(i) / 9);
  const tex = grassTexture(S, rnd); tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  const ground = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map: tex, vertexColors: true }));
  ground.receiveShadow = true; ground.material.userData.noOutline = true; ground.name = "set-hilltop-ground"; g.add(ground);
  return g;
}
