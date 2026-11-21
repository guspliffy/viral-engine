// Potato Desk 11 "Thermostat war": the extra prop-state keys its new kinds tween (DESIGN.md sections 2-5 in
// storyboards/series/potato-desk/11-thermostat/). Only these kinds get them, so no other prop's state changes.
//   thermostat: temp (12..30 or "blank"), up, down, tape, shake (pop is a shared key)
//   thermobox:  key, rip (on, tug are shared keys)
//   blindwindow: lift (open is a shared key)
const KINDS11 = new Set(["thermostat", "thermobox", "blindwindow"]);
export const desk11PropKeys = (spec) => KINDS11.has(spec.kind)
  ? { temp: spec.temp ?? 19, up: 0, down: 0, tape: spec.tape ?? 0, shake: 0, key: spec.key ?? 0, rip: spec.rip ?? 0, lift: spec.lift ?? 0 }
  : {};
