// Loudness the way the platforms and ears measure it (ITU-R BS.1770-4 / EBU R 128), in plain JS, deterministic.
//
//   kWeight(x, sr)                -> a copy of x through the K filter (a +4 dB shelf over ~1.7 kHz, a high-pass at 38 Hz)
//   kPower(chs, sr, hop)          -> K-weighted power per block of `hop` s, summed over the channels (BS.1770: L + R)
//   momentary(pw, k = 4)          -> loudness (LUFS) of each run of k blocks (4 x 100 ms = the 400 ms "momentary" window)
//   integrated(chs, sr)           -> gated integrated loudness (LUFS) of a whole clip (absolute gate -70, relative -10 LU)
//   truePeak(chs)                 -> per-sample true peak (4x oversampled, linear) of the loudest channel
//   lufs(p) / power(l)            -> power <-> LUFS
//
// The filter coefficients are the standard's, recomputed for any sample rate (the formulas libebur128 uses), so 44.1
// kHz matches ffmpeg's ebur128 to a few hundredths of a LU (checked on the ten clips of 4-5 Nov 2026).

export const lufs = (p) => -0.691 + 10 * Math.log10(p + 1e-20);
export const power = (l) => Math.pow(10, (l + 0.691) / 10);

function biquad(x, b, a) {
  const y = new Float32Array(x.length);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) {
    const v = x[i], o = b[0] * v + b[1] * x1 + b[2] * x2 - a[1] * y1 - a[2] * y2;
    x2 = x1; x1 = v; y2 = y1; y1 = o; y[i] = o;
  }
  return y;
}
const coef = new Map();
function kCoef(sr) {
  if (coef.has(sr)) return coef.get(sr);
  // stage 1: the head's high shelf
  let f0 = 1681.974450955533, G = 3.999843853973347, Q = 0.7071752369554196;
  let K = Math.tan((Math.PI * f0) / sr);
  const Vh = Math.pow(10, G / 20), Vb = Math.pow(Vh, 0.4996667741545416), a0 = 1 + K / Q + K * K;
  const s = { b: [(Vh + (Vb * K) / Q + K * K) / a0, (2 * (K * K - Vh)) / a0, (Vh - (Vb * K) / Q + K * K) / a0], a: [1, (2 * (K * K - 1)) / a0, (1 - K / Q + K * K) / a0] };
  // stage 2: the RLB high-pass
  f0 = 38.13547087602444; Q = 0.5003270373238773; K = Math.tan((Math.PI * f0) / sr);
  const d = 1 + K / Q + K * K, h = { b: [1, -2, 1], a: [1, (2 * (K * K - 1)) / d, (1 - K / Q + K * K) / d] };
  const c = { s, h }; coef.set(sr, c); return c;
}
export function kWeight(x, sr) { const { s, h } = kCoef(sr); return biquad(biquad(x, s.b, s.a), h.b, h.a); }

// K-weighted mean power per block, channels summed (a mono signal counts once: an equal-power pan keeps L² + R² = x²)
export function kPower(chs, sr, hop = 0.1) {
  const H = Math.round(hop * sr), n = Math.floor(chs[0].length / H), pw = new Float64Array(n);
  for (const ch of chs) {
    const y = kWeight(ch, sr);
    for (let b = 0; b < n; b++) { let s = 0; for (let i = b * H; i < (b + 1) * H; i++) s += y[i] * y[i]; pw[b] += s / H; }
  }
  return pw;
}
// loudness of each window of k blocks starting at block i (LUFS)
export function momentary(pw, k = 4) {
  const out = new Float64Array(Math.max(0, pw.length - k + 1)); let s = 0;
  for (let i = 0; i < pw.length; i++) { s += pw[i]; if (i >= k) s -= pw[i - k]; if (i >= k - 1) out[i - k + 1] = lufs(Math.max(0, s / k)); }
  return out;
}
export function integrated(chs, sr) {
  const m = momentary(kPower(chs, sr, 0.1), 4), abs = [...m].filter((l) => l > -70);
  if (!abs.length) return -Infinity;
  const rel = lufs(abs.reduce((s, l) => s + power(l), 0) / abs.length) - 10, g = abs.filter((l) => l > rel);
  return lufs(g.reduce((s, l) => s + power(l), 0) / g.length);
}

// 4x oversampling: three in-between points per sample from a 32-tap Hann-windowed sinc (BS.1770 annex 2 asks for 4x
// at 48 kHz; at 44.1 kHz 4x is still over 176 kHz)
const TAPS = 16, PH = [0.25, 0.5, 0.75].map((f) => {
  const w = [];
  for (let k = -TAPS + 1; k <= TAPS; k++) { const t = k - f, s = Math.abs(t) < 1e-9 ? 1 : Math.sin(Math.PI * t) / (Math.PI * t), win = 0.5 + 0.5 * Math.cos((Math.PI * t) / (TAPS + 0.5)); w.push(s * win); }
  const sum = w.reduce((a, b) => a + b, 0); return w.map((v) => v / sum);
});
// the true peak (linear) of the loudest channel at each sample: the sample itself and the three points before it
export function truePeak(chs) {
  const n = chs[0].length, tp = new Float32Array(n);
  for (const x of chs) {
    for (let i = 0; i < n; i++) {
      let m = Math.abs(x[i]);
      for (const w of PH) {
        // the point f of a sample after x[i - 1]: taps on x[i - TAPS .. i + TAPS - 1]
        let v = 0; for (let k = 0; k < w.length; k++) { const j = i - TAPS + k; if (j >= 0 && j < n) v += w[k] * x[j]; }
        m = Math.max(m, Math.abs(v));
      }
      if (m > tp[i]) tp[i] = m;
    }
  }
  return tp;
}
