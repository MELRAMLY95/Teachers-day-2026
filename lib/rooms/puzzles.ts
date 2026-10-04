export const PHI = (1 + Math.sqrt(5)) / 2;

/** 1 when the two lengths are the golden ratio, fading out as they leave it. */
export function bridgeProgress(long: number, short: number) {
  const base = Math.max(1, Math.min(long, short));
  const span = Math.max(long, short);
  const error = Math.abs(span / base - PHI) / PHI;
  if (error > 0.22) return 0;
  return Math.min(1, (0.22 - error) / 0.07);
}

export function isQuarterTurn(angle: number) {
  const targets = [Math.PI / 2, -Math.PI / 2, Math.PI, -Math.PI];
  return targets.some((target) => {
    const delta = Math.atan2(Math.sin(angle - target), Math.cos(angle - target));
    return Math.abs(delta) < 0.22;
  });
}

export function nextFibonacci(values: number[]) {
  if (values.length < 2) return null;
  const last = values[values.length - 1] ?? 0;
  const prev = values[values.length - 2] ?? 0;
  return last + prev;
}
