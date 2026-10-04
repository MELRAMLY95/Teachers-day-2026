import { addReagent, describeBeaker, emptyBeaker, tick, type Beaker } from "@/lib/chemistry/simulation";
import { circularVelocity, orbitWord, STAR_GM, stepOrbit, type OrbitBody } from "@/lib/physics/orbit";
import type { SceneTone } from "./scenes";

export type WorldSim = {
  beaker: Beaker;
  heating: boolean;
  spring: number;
  springV: number;
  mass: number;
  holding: boolean;
  amp: number;
  freq: number;
  sentence: number;
  page: number;
  orbit: OrbitBody;
  note: string;
};

const SPRING_K = 26;

export function createSim(): WorldSim {
  const radius = 118;
  return {
    beaker: emptyBeaker(),
    heating: false,
    spring: 0,
    springV: 0,
    mass: 1,
    holding: false,
    amp: 0.55,
    freq: 2,
    sentence: 0,
    page: 0,
    orbit: { x: radius, y: 0, vx: 0, vy: circularVelocity(STAR_GM, radius) },
    note: "",
  };
}

export function springPeriod(mass: number) {
  return (2 * Math.PI) / Math.sqrt(SPRING_K / mass);
}

export function stepSim(sim: WorldSim, dt: number, tone: SceneTone) {
  const safe = Math.max(0, Math.min(0.05, dt));
  if (tone === "chemistry") {
    const next = tick(sim.beaker, sim.heating, safe);
    sim.beaker = next.beaker;
  }
  if (tone === "physics") {
    sim.orbit = stepOrbit(sim.orbit, STAR_GM, safe * 18);
    if (!sim.holding) {
      const accel = (-SPRING_K * sim.spring) / sim.mass;
      sim.springV += accel * safe;
      sim.springV *= Math.exp(-0.35 * safe);
      sim.spring += sim.springV * safe * 46;
    }
  }
}

function inside(x: number, y: number, cx: number, cy: number, rx: number, ry: number) {
  const dx = (x - cx) / rx;
  const dy = (y - cy) / ry;
  return dx * dx + dy * dy <= 1;
}

export function pointerDown(sim: WorldSim, tone: SceneTone, x: number, y: number, width: number, height: number) {
  if (tone === "chemistry") {
    const bottles = chemistryHits(width, height);
    if (inside(x, y, bottles.copper.x, bottles.copper.y, 28, 46)) {
      sim.beaker = tick(addReagent(sim.beaker, "cuso4", 12), sim.heating, 0.5).beaker;
      sim.note = describeBeaker(sim.beaker, sim.heating);
      return;
    }
    if (inside(x, y, bottles.hydroxide.x, bottles.hydroxide.y, 28, 46)) {
      sim.beaker = tick(addReagent(sim.beaker, "naoh", 12), sim.heating, 0.5).beaker;
      sim.note = describeBeaker(sim.beaker, sim.heating);
      return;
    }
    if (inside(x, y, bottles.flame.x, bottles.flame.y, 36, 18)) {
      sim.heating = !sim.heating;
      sim.note = describeBeaker(sim.beaker, sim.heating);
      return;
    }
    if (inside(x, y, bottles.rinse.x, bottles.rinse.y, 24, 24)) {
      sim.beaker = emptyBeaker();
      sim.heating = false;
      sim.note = "Rinsed. The beaker is back to a little water.";
    }
    return;
  }
  if (tone === "physics") {
    const spring = springAnchor(width, height);
    const bob = spring.y + sim.spring;
    if (inside(x, y, spring.x, bob, 28, 28)) {
      sim.holding = true;
      sim.springV = 0;
      return;
    }
    if (inside(x, y, spring.x + 78, spring.y + 10, 22, 22)) {
      sim.mass = sim.mass > 1.4 ? 1 : 2.4;
      const period = springPeriod(sim.mass);
      sim.note = `Mass ${sim.mass.toFixed(1)}. The period is about ${period.toFixed(2)} s.`;
    }
    return;
  }
  if (tone === "math") {
    const graph = graphBand(width, height);
    if (y > graph.top && y < graph.bottom && x > graph.left && x < graph.right) {
      sim.holding = true;
      sim.freq = 1 + ((x - graph.left) / (graph.right - graph.left)) * 4;
      sim.amp = 0.25 + (1 - (y - graph.top) / (graph.bottom - graph.top)) * 0.9;
      sim.note = curveNote(sim.freq, sim.amp);
    }
    return;
  }
  if (tone === "english") {
    const words = englishWords(width, height);
    const index = words.findIndex((word) => inside(x, y, word.x, word.y, 54, 22));
    if (index >= 0) {
      sim.sentence = index;
      sim.note = ["You would ask why the English one doesn't look like that.", "That is one of the other notebooks.", "You get jealous about this one."][index] ?? "";
    }
    return;
  }
  const book = manuscript(width, height);
  if (inside(x, y, book.x, book.y, book.w / 2, book.h / 2)) {
    sim.page = (sim.page + 1) % 3;
    sim.note = [
      "The pattern is the page. Turn it.",
      "Actions are only by intentions. A person gets only what they intended.",
      "The days were written down. The route was worked out. The place stayed unnamed.",
    ][sim.page] ?? "";
  }
}

export function pointerMove(sim: WorldSim, tone: SceneTone, x: number, y: number, width: number, height: number) {
  if (tone === "physics" && sim.holding) {
    const spring = springAnchor(width, height);
    sim.spring = Math.max(-70, Math.min(150, y - spring.y));
    sim.springV = 0;
    sim.note = "The stretch is the force. Let go.";
  }
  if (tone === "math") {
    const graph = graphBand(width, height);
    if (y > graph.top && y < graph.bottom && x > graph.left && x < graph.right) {
      sim.freq = 1 + ((x - graph.left) / (graph.right - graph.left)) * 4;
      sim.amp = 0.25 + (1 - (y - graph.top) / (graph.bottom - graph.top)) * 0.9;
      sim.note = curveNote(sim.freq, sim.amp);
    }
  }
}

function curveNote(freq: number, amp: number) {
  return `About ${freq.toFixed(1)} waves across, rising ${amp.toFixed(2)}.`;
}

export function pointerUp(sim: WorldSim, tone: SceneTone) {
  if (!sim.holding) return;
  sim.holding = false;
  if (tone === "physics") {
    const period = springPeriod(sim.mass);
    sim.note = `Released. Period about ${period.toFixed(2)} s for this mass.`;
  }
}

export function chemistryHits(width: number, height: number) {
  return {
    copper: { x: width * 0.36, y: height * 0.58 },
    hydroxide: { x: width * 0.64, y: height * 0.58 },
    flame: { x: width * 0.5, y: height * 0.7 },
    rinse: { x: width * 0.28, y: height * 0.66 },
    beaker: { x: width * 0.5, y: height * 0.5 },
  };
}

export function springAnchor(width: number, height: number) {
  return { x: width * 0.5, y: height * 0.42 };
}

export function graphBand(width: number, height: number) {
  return { left: width * 0.3, right: width * 0.7, top: height * 0.56, bottom: height * 0.7 };
}

export function englishWords(width: number, height: number) {
  return [
    { x: width * 0.38, y: height * 0.6, label: "plain" },
    { x: width * 0.5, y: height * 0.6, label: "finished" },
    { x: width * 0.62, y: height * 0.6, label: "decorated" },
  ];
}

export function manuscript(width: number, height: number) {
  return { x: width * 0.5, y: height * 0.4, w: Math.min(width, height) * 0.24, h: Math.min(width, height) * 0.2 };
}

export function orbitCaption(body: OrbitBody) {
  return orbitWord(body, STAR_GM);
}
