export const STAR_GM = 2_400_000;

export type OrbitBody = {
  x: number;
  y: number;
  vx: number;
  vy: number;
};

export function circularVelocity(gm: number, radius: number) {
  return Math.sqrt(gm / Math.max(radius, 1));
}

/** Semi-implicit Euler around a fixed star at the origin. */
export function stepOrbit(body: OrbitBody, gm: number, dt: number): OrbitBody {
  const radius = Math.hypot(body.x, body.y);
  if (radius < 1) return body;
  const pull = gm / (radius * radius * radius);
  const vx = body.vx - body.x * pull * dt;
  const vy = body.vy - body.y * pull * dt;
  return { x: body.x + vx * dt, y: body.y + vy * dt, vx, vy };
}

export function specificEnergy(body: OrbitBody, gm: number) {
  const radius = Math.hypot(body.x, body.y) || 1;
  const speed2 = body.vx * body.vx + body.vy * body.vy;
  return 0.5 * speed2 - gm / radius;
}

export function orbitWord(body: OrbitBody, gm: number) {
  const radius = Math.hypot(body.x, body.y);
  if (radius < 42) return "It has fallen into the star.";
  if (radius > 640) return "It has left the system.";
  if (specificEnergy(body, gm) < 0) return "It is bound to the star.";
  return "It is escaping.";
}
