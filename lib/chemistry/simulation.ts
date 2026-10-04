/** Copper sulfate and sodium hydroxide, then heat. Amounts are in moles and millilitres. */

export const CUSO4_MOLARITY = 0.5;
export const NAOH_MOLARITY = 1;

export type Beaker = {
  volumeMl: number;
  /** Dissolved copper(II), moles. */
  cu2: number;
  /** Free hydroxide, moles. */
  oh: number;
  /** Cu(OH)2 solid, moles. */
  cuoh2: number;
  /** CuO solid, moles. */
  cuo: number;
  /** Spectator sulfate, moles. */
  so4: number;
  /** Spectator sodium, moles. */
  na: number;
  tempC: number;
};

export type TickResult = {
  beaker: Beaker;
  precipitatedMol: number;
  decomposedMol: number;
};

export type ExperimentStage = "empty" | "need-heat" | "need-notes" | "ready";

export function emptyBeaker(): Beaker {
  return {
    volumeMl: 15,
    cu2: 0,
    oh: 0,
    cuoh2: 0,
    cuo: 0,
    so4: 0,
    na: 0,
    tempC: 22,
  };
}

function clamp0(value: number) {
  return value < 1e-8 ? 0 : value;
}

export function addReagent(beaker: Beaker, kind: "cuso4" | "naoh", ml: number): Beaker {
  const safe = Math.max(0, ml);
  const next: Beaker = { ...beaker, volumeMl: beaker.volumeMl + safe };
  if (kind === "cuso4") {
    const moles = (safe / 1000) * CUSO4_MOLARITY;
    next.cu2 += moles;
    next.so4 += moles;
  } else {
    const moles = (safe / 1000) * NAOH_MOLARITY;
    next.oh += moles;
    next.na += moles;
  }
  return next;
}

/**
 * Precipitation is fast. Copper hydroxide only becomes copper oxide once the
 * beaker is actually hot. Heating and cooling are continuous, not a switch.
 */
export function tick(beaker: Beaker, heating: boolean, dt: number): TickResult {
  const next = { ...beaker };
  const safeDt = Math.max(0, dt);
  const reactable = Math.min(next.cu2, next.oh / 2);
  const precipitated = reactable * (1 - Math.exp(-12 * safeDt));
  next.cu2 = clamp0(next.cu2 - precipitated);
  next.oh = clamp0(next.oh - precipitated * 2);
  next.cuoh2 += precipitated;

  let decomposed = 0;
  if (next.tempC > 75 && next.cuoh2 > 0) {
    const heat = Math.min(1, (next.tempC - 75) / 45);
    decomposed = next.cuoh2 * heat * (1 - Math.exp(-0.7 * safeDt));
    next.cuoh2 = clamp0(next.cuoh2 - decomposed);
    next.cuo += decomposed;
  }

  const target = heating ? 128 : 22;
  const rate = heating ? 0.18 : 0.07;
  next.tempC += (target - next.tempC) * (1 - Math.exp(-rate * safeDt));
  next.tempC = Math.min(130, Math.max(18, next.tempC));

  return { beaker: next, precipitatedMol: precipitated, decomposedMol: decomposed };
}

export function experimentStage(input: {
  beaker: Beaker;
  maxTemp: number;
  memoriesFound: number;
}): ExperimentStage {
  const solid = input.beaker.cuoh2 + input.beaker.cuo;
  if (solid < 0.001) return "empty";
  if (input.maxTemp < 80) return "need-heat";
  if (input.memoriesFound < 3) return "need-notes";
  return "ready";
}

export function doorLine(stage: ExperimentStage) {
  if (stage === "empty") {
    return "The door stays shut. The beaker has not shown you the reaction yet.";
  }
  if (stage === "need-heat") {
    return "The solid is there. It still needs the burner.";
  }
  if (stage === "need-notes") {
    return "The practical is finished. There are still notes hidden in the laboratory.";
  }
  return "";
}

export function describeBeaker(beaker: Beaker, heating: boolean) {
  const temp = Math.round(beaker.tempC / 5) * 5;
  const bits = [`The thermometer reads about ${temp} degrees.`];
  if (beaker.cu2 > 0.0002) bits.push("Copper sulfate is dissolved.");
  if (beaker.oh > 0.0002) bits.push("Hydroxide is still free in the solution.");
  if (beaker.cuoh2 > 0.0002) bits.push("Pale blue copper hydroxide is forming.");
  if (beaker.cuo > 0.0002) bits.push("Black copper oxide is appearing.");
  if (heating) bits.push("The burner is heating the beaker.");
  if (bits.length === 1) bits.push("The beaker holds a little water.");
  return bits.join(" ");
}

export function moleculeCaption(beaker: Beaker, forming: boolean, breaking: boolean) {
  if (breaking) {
    return "Heat is breaking the hydroxide apart. Energy is being absorbed. Water leaves, and copper oxide remains.";
  }
  if (forming) {
    return "Hydroxide is binding to copper. New bonds are forming, and energy is leaving the mixture.";
  }
  if (beaker.cuo > 0.0002 && beaker.cuoh2 < 0.0002) {
    return "The hydroxide is gone. Copper oxide and water are what the heat left behind.";
  }
  if (beaker.cuoh2 > 0.0002) {
    return "Copper hydroxide is in the beaker. Heat will take this further.";
  }
  if (beaker.cu2 > 0.0002 && beaker.oh <= 0.0002) {
    return "Copper ions are dissolved. They are waiting for hydroxide.";
  }
  if (beaker.oh > 0.0002 && beaker.cu2 <= 0.0002) {
    return "Hydroxide is in the water. There is no copper here for it to meet.";
  }
  return "This is mostly water. Pour something in, then look again.";
}
