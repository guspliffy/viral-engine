import * as THREE from "three";
import { clamp, lerp, rng as rngOf } from "./util.js";
import { mat, basic, mesh, canvasTex, smooth } from "./props-trend.js";

// Props for HOW TO CATCH ME (25 Oct), merged into props3d.js KINDS:
//   boxtrap   a cardboard box turned upside down and propped up on a stick, the classic cartoon trap. The prop's
//             origin is the middle of its footprint (spec.w x spec.d, height spec.h; default 1.4 x 1.5 x 1.5). It is
//             hinged on its back bottom edge with the front edge propped up toward the camera at spec.angle (default
//             56°, the edge 1.24 m up), so its open mouth faces the camera: a fighter walks in from the left and stands
//             under the front edge (x -0.25, z +0.1 from the origin) by the bait (x +0.3, z -0.2), and the box slams
//             forward and down over both.
//             `drop` 0 propped .. 1 down (the stick is knocked away as it goes), `ring` wiggles it while down
//             (someone inside), `char` 0..1 blackens it (fire inside), `burn` 0..1 flames lick up it, then it
//             collapses to a pile of ash, `split` cuts it in two (the halves fall to either side), `smash` 0..1 blows
//             the panels apart. spec.stick: false for a box with no stick (one that falls from above, drop 1).
//   crate     a small wooden crate (0.32 m) to hold the bait; its top is at y 0.32
//   coins     a pile of gold coins with a few glints
//   mirror    a standing oval mirror on a wooden stand, 1.15 m tall, its glass toward +z
//   sign      a cardboard sign on a stake, spec.text (default "FREE"); spec.small for a little one (a desk sign)
//   spellbook a fat purple spellbook with a gold star and a price tag, spec.tag (default "50% OFF")
//   drumstick a giant roast drumstick lying on its side
//   fence     a stretch of white picket fence spec.width wide (default 1.6): `smash` 0..1 blows the pickets apart
const W0 = 1.4, H0 = 1.5, D0 = 1.5;   // the front edge lifts to 1.24 m at 56° (a fighter fits under it) and it covers one

function cardboardTex(top) {
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = "#c9955a"; g.fillRect(0, 0, w, h);
    // corrugation and a few scuffs
    for (let x = 0; x < w; x += 6) { g.fillStyle = x % 12 ? "rgba(120,80,40,0.06)" : "rgba(255,230,190,0.06)"; g.fillRect(x, 0, 3, h); }
    const r = rngOf(top ? 4 : 9);
    for (let i = 0; i < 8; i++) { g.fillStyle = `rgba(90,55,25,${0.05 + r() * 0.08})`; g.beginPath(); g.ellipse(r() * w, r() * h, 6 + r() * 20, 3 + r() * 6, r() * 3, 0, 7); g.fill(); }
    if (top) { g.fillStyle = "rgba(220,190,130,0.85)"; g.fillRect(w / 2 - 22, 0, 44, h); g.fillStyle = "rgba(255,255,255,0.18)"; g.fillRect(w / 2 - 22, 0, 8, h); g.strokeStyle = "rgba(90,55,25,0.5)"; g.lineWidth = 3; g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w / 2, h); g.stroke(); }
    else {
      // an upside-down "THIS SIDE UP" arrow (it's a trap, the box is upside down)
      g.strokeStyle = "rgba(60,35,20,0.55)"; g.lineWidth = 9; g.lineCap = "round";
      for (const x of [w * 0.32, w * 0.5]) { g.beginPath(); g.moveTo(x, h * 0.3); g.lineTo(x, h * 0.62); g.moveTo(x - 16, h * 0.5); g.lineTo(x, h * 0.64); g.lineTo(x + 16, h * 0.5); g.stroke(); }
      g.fillStyle = "rgba(60,35,20,0.5)"; g.font = "900 22px sans-serif"; g.textAlign = "center"; g.save(); g.translate(w * 0.41, h * 0.78); g.rotate(Math.PI); g.fillText("THIS SIDE UP", 0, 0); g.restore();
    }
  });
}

export const CATCH_GRIPS = {};

export const CATCH_KINDS = {
  boxtrap(P) {
    const W = P.spec.w ?? W0, H = P.spec.h ?? H0, D = P.spec.d ?? D0, T = 0.025, ang = ((P.spec.angle ?? 56) * Math.PI) / 180;
    const side = mat("#c9955a", { map: cardboardTex(false), roughness: 0.85 }), topM = mat("#c9955a", { map: cardboardTex(true), roughness: 0.85 });
    const mats = [side, topM], base = mats.map((m) => m.color.clone()), black = new THREE.Color("#2a1c14");
    // two halves (x < 0 and x > 0), each with its half of the top, the front and the back, and its own side wall
    for (const [s, h] of P.halves) {
      mesh(new THREE.BoxGeometry(W / 2, T, D), topM, h, (s * W) / 4, H - T / 2, 0);
      for (const z of [-1, 1]) mesh(new THREE.BoxGeometry(W / 2, H, T), side, h, (s * W) / 4, H / 2, (z * (D - T)) / 2);
      mesh(new THREE.BoxGeometry(T, H, D), side, h, (s * (W - T)) / 2, H / 2, 0);
      // the top flaps' seams
      mesh(new THREE.BoxGeometry(W / 2, 0.006, 0.02), mat("#a8763f"), h, (s * W) / 4, H + 0.003, 0).castShadow = false;
    }
    // the stick, standing on the ground under the right corner of the lifted front edge (not part of the box: it stays
    // when the box drops), out of the way of a fighter walking in from the left
    const lift = new THREE.Vector2(-D / 2 + D * Math.cos(ang), D * Math.sin(ang));   // (z, y) of the lifted front edge
    const stick = new THREE.Group(); stick.position.set(W / 2 - 0.07, 0, lift.x - 0.03); P.root.add(stick);
    mesh(new THREE.CylinderGeometry(0.018, 0.022, lift.y, 8), mat("#8a5a32", { roughness: 0.8 }), stick, 0, lift.y / 2, 0);
    stick.visible = P.spec.stick !== false;
    // fire licking up the box (burn) and the ash it leaves
    const fireM = ["#ff5a1f", "#ff8a2a", "#ffc23d"].map((c) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.9, depthWrite: false }));
    const r = rngOf(31), tongues = [];
    const fire = new THREE.Group(); P.root.add(fire);
    for (let i = 0; i < 26; i++) {
      const f = mesh(new THREE.ConeGeometry(0.05 + 0.04 * r(), 1, 7), fireM[i % 3], fire, (r() - 0.5) * W * 0.95, 0, (r() < 0.5 ? 1 : -0.2) * D * 0.5 + 0.02);
      f.castShadow = false; tongues.push({ f, h: 0.35 + r() * 0.6, ph: r() * 6.28, sp: 8 + r() * 7, y0: r() * H * 0.6 });
    }
    const ash = mesh(new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat("#3b3634", { roughness: 1 }), P.root, 0, 0, 0);
    ash.scale.set(W * 0.42, 0.001, D * 0.4);
    const light = new THREE.PointLight("#ff8a3a", 0, 4, 1.6); light.position.set(0, 0.6, D / 2 + 0.3); P.root.add(light);
    return {
      grip: H, splitApart: 0.35, splitTip: 1.1, splitDrop: 0.1,
      apply(ps, t) {
        const dr = clamp(ps.drop ?? 0), rg = clamp(ps.ring ?? 0), ch = clamp(ps.char ?? 0), bu = clamp(ps.burn ?? 0), sm = clamp(ps.smash ?? 0);
        // hinged on the back bottom edge: rotate the whole box about x through (y 0, z -D/2)
        const wig = rg * Math.sin((t ?? 0) * 38) * 0.035;
        const rx = -ang * (1 - dr), c = Math.cos(rx), sn = Math.sin(rx);
        P.whole.rotation.set(rx, 0, wig); P.whole.position.set(0, -(D / 2) * sn + rg * 0.012 * Math.abs(Math.sin((t ?? 0) * 19)), -D / 2 + (D / 2) * c);
        // the stick: knocked over to the right as the box comes down
        const ks = clamp(dr * 4);
        stick.rotation.z = -ks * 1.45; stick.position.x = W / 2 - 0.07 + ks * 0.1; stick.visible = P.spec.stick !== false;   // knocked over, it lies on the grass
        // char and burn darken the cardboard
        const dk = Math.max(ch * 0.85, clamp(bu / 0.45));
        mats.forEach((m, i) => m.color.copy(base[i]).lerp(black, dk));
        // burn: flames grow, then the box sinks into ash (0.45..1)
        const flame = bu <= 0 ? 0 : Math.sin(Math.min(1, bu / 0.85) * Math.PI) ** 0.6;
        fire.visible = flame > 0.01; light.intensity = 3.5 * flame;
        for (const q of tongues) { const hh = q.h * flame * (0.7 + 0.3 * Math.sin((t ?? 0) * q.sp + q.ph)); q.f.scale.set(1, Math.max(hh, 0.001), 1); q.f.position.y = q.y0 * (1 - clamp((bu - 0.45) / 0.55)) + hh / 2; }
        const col = clamp((bu - 0.45) / 0.5);
        if (bu > 0) { for (const [, h] of P.halves) h.scale.set(1, Math.max(1 - col, 0.001), 1); }
        else for (const [, h] of P.halves) h.scale.set(1, 1, 1);
        P.whole.visible = col < 0.999;
        ash.scale.y = 0.001 + 0.12 * smooth(clamp((bu - 0.5) / 0.5));
        ash.visible = bu > 0.5;
        // smash: each half flies out to its side, up and over, and lands flat
        if (sm > 0) {
          const e = smooth(sm);
          for (const [s, h] of P.halves) {
            h.position.x += s * e * 0.9; h.position.y += Math.sin(Math.min(sm * 1.3, 1) * Math.PI) * 0.5 - e * 0.2; h.position.z += e * 0.25;
            h.rotation.z += -s * e * 1.9; h.rotation.x = e * 0.4 * s;
          }
        } else for (const [, h] of P.halves) h.rotation.x = 0;
      },
    };
  },

  crate(P) {
    const S = P.spec.size ?? 0.32, wood = mat("#b07a45", { roughness: 0.8 }), dark = mat("#7a4f2a", { roughness: 0.85 });
    mesh(new THREE.BoxGeometry(S * 0.94, S * 0.94, S * 0.94), dark, P.whole, 0, S / 2, 0);
    for (const y of [0.18, 0.5, 0.82]) for (const z of [-1, 1]) mesh(new THREE.BoxGeometry(S, S * 0.22, 0.02), wood, P.whole, 0, S * y, (z * S) / 2);
    for (const y of [0.18, 0.5, 0.82]) for (const x of [-1, 1]) mesh(new THREE.BoxGeometry(0.02, S * 0.22, S), wood, P.whole, (x * S) / 2, S * y, 0);
    mesh(new THREE.BoxGeometry(S, 0.02, S), wood, P.whole, 0, S, 0);
    return { grip: S };
  },

  coins(P) {
    const gold = mat("#f2c23a", { roughness: 0.3, metalness: 0.75, emissive: new THREE.Color("#7a5200"), emissiveIntensity: 0.25 });
    const r = rngOf(17), coin = new THREE.CylinderGeometry(0.035, 0.035, 0.01, 18);
    for (let i = 0; i < 46; i++) {
      const a = r() * 6.28, rad = Math.sqrt(r()) * 0.12, hgt = (0.12 - rad) * 0.7 + r() * 0.015;
      const c = mesh(coin, gold, P.whole, Math.cos(a) * rad, hgt, Math.sin(a) * rad * 0.8); c.rotation.set((r() - 0.5) * 0.8, r() * 3, (r() - 0.5) * 0.8); c.castShadow = i % 3 === 0;
    }
    // little four-point glints that twinkle
    const gl = basic({ color: "#fff6c8", transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    const star = new THREE.Shape(); for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4, rr = i % 2 ? 0.008 : 0.045; star[i ? "lineTo" : "moveTo"](Math.cos(a) * rr, Math.sin(a) * rr); }
    const glints = [[-0.05, 0.1, 0.06], [0.06, 0.07, 0.08], [0.0, 0.13, 0.02]].map(([x, y, z], i) => { const m = new THREE.Mesh(new THREE.ShapeGeometry(star), gl); m.position.set(x, y, z); m.userData.ph = i * 2.1; P.whole.add(m); return m; });
    return { grip: 0.08, apply(ps, t) { for (const g of glints) { const k = Math.max(0, Math.sin((t ?? 0) * 4 + g.userData.ph)); g.scale.setScalar(0.3 + 1.1 * k); g.rotation.z = (t ?? 0) * 0.8; } } };
  },

  mirror(P) {
    const wood = mat("#8a5530", { roughness: 0.55 }), gold = mat("#d9b25a", { roughness: 0.35, metalness: 0.6 });
    const glassTex = canvasTex(128, 256, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, "#e8f6ff"); gr.addColorStop(0.5, "#a9cfe8"); gr.addColorStop(1, "#7fb0d4"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.fillStyle = "rgba(255,255,255,0.75)"; g.save(); g.translate(w * 0.35, h * 0.3); g.rotate(-0.5); g.fillRect(-40, -6, 80, 9); g.fillRect(-30, 14, 60, 5); g.restore();
    });
    const fr = new THREE.Group(); fr.position.y = 0.72; P.whole.add(fr);
    const ring = mesh(new THREE.TorusGeometry(1, 0.035, 10, 40), gold, fr); ring.scale.set(0.24, 0.36, 1);
    const glass = new THREE.Mesh(new THREE.CircleGeometry(1, 40), basic({ map: glassTex })); glass.scale.set(0.235, 0.355, 1); glass.position.z = 0.004; fr.add(glass);
    mesh(new THREE.CircleGeometry(1, 40), wood, fr, 0, 0, -0.01).scale.set(0.25, 0.37, 1);
    for (const s of [-1, 1]) { const leg = mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.62, 8), wood, P.whole, s * 0.16, 0.31, -0.02); leg.rotation.z = s * 0.12; }
    mesh(new THREE.BoxGeometry(0.42, 0.04, 0.16), wood, P.whole, 0, 0.02, 0);
    mesh(new THREE.SphereGeometry(0.03, 10, 8), gold, fr, 0, 0.39, 0);
    return { grip: 0.72 };
  },

  sign(P) {
    const small = !!P.spec.small, bw = small ? 0.26 : 0.5, bh = small ? 0.15 : 0.3, post = small ? 0.12 : 0.55, text = P.spec.text ?? "FREE";
    const tex = canvasTex(512, Math.round((512 * bh) / bw), (g, w, h) => {
      g.fillStyle = "#f3e7cf"; g.fillRect(0, 0, w, h); g.strokeStyle = "#c9a878"; g.lineWidth = 10; g.strokeRect(5, 5, w - 10, h - 10);
      g.fillStyle = P.spec.color ?? "#d9332b"; g.textAlign = "center"; g.textBaseline = "middle";
      let fs = 200; g.font = `900 ${fs}px sans-serif`; while (g.measureText(text).width > w * 0.84 && fs > 30) { fs -= 8; g.font = `900 ${fs}px sans-serif`; }
      g.fillText(text, w / 2, h / 2 + fs * 0.05);
    });
    mesh(new THREE.BoxGeometry(0.025, post + bh * 0.5, 0.025), mat("#8a5a32", { roughness: 0.8 }), P.whole, 0, (post + bh * 0.5) / 2, -0.02);
    mesh(new THREE.BoxGeometry(bw, bh, 0.012), mat("#e9dcc0", { map: tex, roughness: 0.8 }), P.whole, 0, post + bh / 2, 0);
    return { grip: post + bh / 2 };
  },

  spellbook(P) {
    const cover = mat("#6b3fa0", { roughness: 0.5 }), pages = mat("#f4ead2", { roughness: 0.9 }), gold = mat("#e8c25a", { roughness: 0.3, metalness: 0.7 });
    mesh(new THREE.BoxGeometry(0.34, 0.1, 0.26), cover, P.whole, 0, 0.05, 0);
    mesh(new THREE.BoxGeometry(0.32, 0.08, 0.25), pages, P.whole, 0.012, 0.05, 0.004);
    mesh(new THREE.BoxGeometry(0.035, 0.104, 0.264), cover, P.whole, -0.165, 0.05, 0);
    const star = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? 0.025 : 0.06; star[i ? "lineTo" : "moveTo"](Math.cos(a) * rr, Math.sin(a) * rr); }
    const st = mesh(new THREE.ShapeGeometry(star), gold, P.whole, 0.01, 0.101, 0); st.rotation.x = -Math.PI / 2;
    for (const c of [-1, 1]) for (const d of [-1, 1]) mesh(new THREE.BoxGeometry(0.04, 0.104, 0.04), gold, P.whole, c * 0.15, 0.05, d * 0.11);
    // the price tag on a string, hanging off the front
    const tag = canvasTex(256, 128, (g, w, h) => { g.fillStyle = "#ffd23f"; g.fillRect(0, 0, w, h); g.fillStyle = "#c62828"; g.font = "900 70px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(P.spec.tag ?? "50% OFF", w / 2, h / 2 + 4); });
    const tg = mesh(new THREE.BoxGeometry(0.2, 0.1, 0.006), mat("#ffffff", { map: tag, roughness: 0.7 }), P.whole, 0.06, 0.02, 0.17); tg.rotation.set(0.15, 0, -0.12);
    return { grip: 0.1 };
  },

  drumstick(P) {
    const meat = mat("#b8632a", { roughness: 0.45, emissive: new THREE.Color("#5a2208"), emissiveIntensity: 0.15 }), bone = mat("#f6eedc", { roughness: 0.6 });
    const g = new THREE.Group(); g.rotation.z = Math.PI / 2 - 0.25; g.position.set(0.05, 0.13, 0); P.whole.add(g);
    mesh(new THREE.SphereGeometry(0.13, 22, 16), meat, g, 0, 0.05, 0).scale.set(1, 1.35, 1);
    mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.2, 10), bone, g, 0, -0.22, 0);
    for (const s of [-1, 1]) mesh(new THREE.SphereGeometry(0.035, 10, 8), bone, g, s * 0.025, -0.33, 0);
    // a few highlight streaks
    for (let i = 0; i < 3; i++) { const h = mesh(new THREE.BoxGeometry(0.012, 0.09, 0.004), basic({ color: "#ffd1a0", transparent: true, opacity: 0.7 }), g, -0.05 + i * 0.03, 0.08, 0.128); h.rotation.z = 0.3; }
    return { grip: 0.2 };
  },

  fence(P) {
    const W = P.spec.width ?? 1.6, paint = mat("#f7f4ee", { roughness: 0.6 }), r = rngOf(5), pickets = [];
    const n = Math.round(W / 0.16);
    for (let i = 0; i < n; i++) {
      const g = new THREE.Group(); g.position.set(-W / 2 + (i + 0.5) * (W / n), 0, 0); P.whole.add(g);
      mesh(new THREE.BoxGeometry(0.1, 0.78, 0.025), paint, g, 0, 0.39, 0);
      const tip = mesh(new THREE.CylinderGeometry(0, 0.072, 0.07, 4), paint, g, 0, 0.815, 0); tip.rotation.y = Math.PI / 4; tip.scale.z = 0.35;
      pickets.push({ g, vx: (g.position.x / (W / 2)) * 1.2 + (r() - 0.5) * 0.6, vy: 0.6 + r() * 0.8, vz: -0.4 - r() * 0.8, sp: (r() - 0.5) * 9 });
    }
    const rails = [0.22, 0.6].map((y) => mesh(new THREE.BoxGeometry(W, 0.06, 0.03), paint, P.whole, 0, y, -0.025));
    return {
      grip: 0.78,
      apply(ps) {
        const q = clamp(ps.smash ?? 0), e = smooth(q);
        for (const p of pickets) { p.g.position.y = p.vy * Math.sin(Math.min(q * 1.2, 1) * Math.PI) * 0.6 - e * 0.02; p.g.position.z = p.vz * e; p.g.rotation.set(-e * 1.4, 0, p.sp * e * 0.3); p.g.position.x += 0; p.g.userData.x0 ??= p.g.position.x; p.g.position.x = p.g.userData.x0 + p.vx * e * 0.6; }
        rails.forEach((rl, i) => { rl.position.y = (i ? 0.6 : 0.22) * (1 - e) + 0.02 * e; rl.rotation.z = (i ? 0.4 : -0.3) * e; rl.position.z = -0.025 - e * 0.4; });
      },
    };
  },
};
void lerp;
