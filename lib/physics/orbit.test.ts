import assert from "node:assert/strict";
import { STAR_GM, circularVelocity, orbitWord, stepOrbit } from "./orbit.ts";

const radius = 180;
const speed = circularVelocity(STAR_GM, radius);
let body = { x: radius, y: 0, vx: 0, vy: speed };
for (let i = 0; i < 400; i += 1) body = stepOrbit(body, STAR_GM, 0.016);
const distance = Math.hypot(body.x, body.y);
assert.ok(Math.abs(distance - radius) < 28, `orbit drifted to ${distance}`);
assert.equal(orbitWord(body, STAR_GM), "It is bound to the star.");

const heavy = { x: radius, y: 0, vx: 0, vy: speed * 0.25 };
let falling = heavy;
let closest = radius;
for (let i = 0; i < 900; i += 1) {
  falling = stepOrbit(falling, STAR_GM * 2.2, 0.016);
  closest = Math.min(closest, Math.hypot(falling.x, falling.y));
  if (closest < 40) break;
}
assert.ok(closest < radius * 0.75, "extra mass should pull the planet inward");

console.log("orbit ok");
