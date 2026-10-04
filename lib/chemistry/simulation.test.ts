import assert from "node:assert/strict";
import {
  addReagent,
  doorLine,
  emptyBeaker,
  experimentStage,
  tick,
} from "./simulation.ts";

function settle(beaker: ReturnType<typeof emptyBeaker>, frames = 50) {
  let next = beaker;
  for (let i = 0; i < frames; i += 1) next = tick(next, false, 0.1).beaker;
  return next;
}

function heat(beaker: ReturnType<typeof emptyBeaker>, seconds: number) {
  let next = beaker;
  const frames = Math.round(seconds / 0.1);
  for (let i = 0; i < frames; i += 1) next = tick(next, true, 0.1).beaker;
  return next;
}

const full = settle(addReagent(addReagent(emptyBeaker(), "cuso4", 20), "naoh", 20));
assert.ok(full.cu2 < 1e-4, `expected copper to precipitate, still ${full.cu2}`);
assert.ok(full.oh < 1e-4, `expected hydroxide to be consumed, still ${full.oh}`);
assert.ok(Math.abs(full.cuoh2 - 0.01) < 1e-3, `expected 0.01 mol hydroxide solid, got ${full.cuoh2}`);
assert.ok(full.cuo < 1e-6, "cold mixture must not make copper oxide");
assert.ok(Math.abs(full.so4 - 0.01) < 1e-9);
assert.ok(Math.abs(full.na - 0.02) < 1e-9);
assert.equal(full.volumeMl, 55);

const partial = settle(addReagent(addReagent(emptyBeaker(), "cuso4", 20), "naoh", 10));
assert.ok(Math.abs(partial.cuoh2 - 0.005) < 1e-3);
assert.ok(partial.cu2 > 0.004, "leftover copper should keep the solution blue");
assert.ok(partial.oh < 1e-4);

const burned = heat(full, 40);
assert.ok(burned.tempC > 100, `expected a hot beaker, got ${burned.tempC}`);
assert.ok(burned.cuo > 0.008, `expected copper oxide, got ${burned.cuo}`);
assert.ok(burned.cuoh2 < 0.002, `expected the hydroxide to decompose, still ${burned.cuoh2}`);

const cold = heat(emptyBeaker(), 5);
assert.equal(cold.cuo, 0);

const stage = experimentStage({ beaker: burned, maxTemp: burned.tempC, memoriesFound: 3 });
assert.equal(stage, "ready");
assert.equal(doorLine("empty").length > 0, true);
assert.equal(doorLine("ready"), "");

console.log("chemistry simulation ok");
