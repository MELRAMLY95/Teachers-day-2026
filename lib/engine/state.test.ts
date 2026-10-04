import assert from "node:assert/strict";
import { digestPassword } from "./auth.ts";
import { createWorldState, discover, lightFromDiscoveries, markExperiment } from "./state.ts";

assert.equal(await digestPassword("sunlight"), "921a95e8b614f668981d9eee4d24a3ffdb6821162246bb8036f73f4fd7d20564");
assert.notEqual(await digestPassword("force"), await digestPassword("sunlight"));

let state = createWorldState();
state = discover(state, "notebook", 3);
assert.equal(state.finalUnlocked, false);
state = markExperiment(state, true, 3);
assert.equal(state.finalUnlocked, false);
state = discover(state, "monitor", 3);
state = discover(state, "window", 3);
assert.equal(state.finalUnlocked, true);
assert.equal(lightFromDiscoveries(3, 3), 1);
assert.ok(lightFromDiscoveries(1, 3) < 1);

console.log("world engine ok");
