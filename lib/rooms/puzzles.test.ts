import assert from "node:assert/strict";
import { PHI, bridgeProgress, isQuarterTurn, nextFibonacci } from "./puzzles.ts";

assert.ok(bridgeProgress(PHI * 100, 100) > 0.95);
assert.equal(bridgeProgress(100, 100), 0);
assert.equal(isQuarterTurn(Math.PI / 2), true);
assert.equal(isQuarterTurn(0.2), false);
assert.equal(nextFibonacci([1, 1, 2, 3, 5]), 8);

console.log("puzzles ok");
