// The 1€ filter (Casiez, Roussel and Vogel, CHI 2012, https://gery.casiez.net/1euro/): a low-pass whose cut-off
// rises with speed, so slow parts lose their jitter and fast parts keep their timing. Run forward over a whole track
// sampled at `rate` Hz (deterministic: same input, same output).
//   oneEuro(values, 120, { min: 1.5, beta: 0.3, dcut: 1 })
const alpha = (rate, cut) => { const tau = 1 / (2 * Math.PI * cut), te = 1 / rate; return 1 / (1 + tau / te); };
export function oneEuro(xs, rate, { min = 1.5, beta = 0.3, dcut = 1 } = {}) {
  const out = new Array(xs.length);
  let x = xs[0], dx = 0;
  out[0] = x;
  for (let i = 1; i < xs.length; i++) {
    const d = (xs[i] - x) * rate;
    dx += alpha(rate, dcut) * (d - dx);
    const cut = min + beta * Math.abs(dx);
    x += alpha(rate, cut) * (xs[i] - x);
    out[i] = x;
  }
  return out;
}
// both ways (forward, then backward over the result): no lag, as for an offline take
export const oneEuro2 = (xs, rate, o) => oneEuro(oneEuro(xs, rate, o).reverse(), rate, o).reverse();
