import * as THREE from "three";
// set-spinroom.js: fact what-if 03 "Earth spins faster" (21 Nov 2026): Spud's Quito flat. STUB: the builder fills it
// (DESIGN.md section A, reusing set-gravroom.js's shell). Must export SPINROOM (layout constants) and buildSpinroom(scene, spec).
export const SPINROOM = {};
export function buildSpinroom(scene, S = {}) { return buildGravroomShell(scene, S); }
import { buildGravroom as buildGravroomShell } from "./set-gravroom.js";
