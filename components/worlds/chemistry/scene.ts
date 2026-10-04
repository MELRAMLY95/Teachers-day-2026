import {
  addReagent,
  describeBeaker,
  doorLine,
  emptyBeaker,
  experimentStage,
  moleculeCaption,
  tick,
  type Beaker,
} from "@/lib/chemistry/simulation";

export type Rect = { x: number; y: number; w: number; h: number };

export type LabLayout = {
  w: number;
  h: number;
  benchY: number;
  beaker: Rect;
  cuso4: Rect;
  naoh: Rect;
  bunsen: Rect;
  notebook: Rect;
  drawer: Rect;
  report: Rect;
  board: Rect;
  note: Rect;
  loupe: Rect;
  door: Rect;
  back: Rect;
  thermo: { x: number; y: number; h: number };
  tap: { x: number; y: number };
};

export type Gear = { x: number; y: number; w: number; h: number; moved: boolean };
export type Bottle = Gear & { ml: number };
export type Burner = Gear & { lit: boolean };

type Spark = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  kind: "form" | "smoke" | "heat";
};

type MolKind = "cu" | "oh" | "h2o" | "cuoh2" | "cuo" | "na" | "so4";

type Molecule = {
  kind: MolKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  bond: number;
};

type Flash = { x: number; y: number; life: number; mode: "form" | "break" };

export type Fonts = { display: string; mono: string; sans: string; hand: string };

export type Runtime = {
  beaker: Beaker;
  cuso4: Bottle;
  naoh: Bottle;
  bunsen: Burner;
  held: "cuso4" | "naoh" | "bunsen" | null;
  grabX: number;
  grabY: number;
  pointerX: number;
  pointerY: number;
  pointerDown: boolean;
  downX: number;
  downY: number;
  pouring: "cuso4" | "naoh" | null;
  pourArmed: boolean;
  found: Set<string>;
  view: "lab" | "molecule";
  time: number;
  maxTemp: number;
  sparks: Spark[];
  molecules: Molecule[];
  flashes: Flash[];
  notice: { text: string; life: number } | null;
  doorReady: boolean;
  fonts: Fonts;
  fontsReady: boolean;
  lastW: number;
  lastH: number;
  molSeeded: boolean;
  reduced: boolean;
  heating: boolean;
  forming: boolean;
  breaking: boolean;
};

export type Action =
  | { type: "memory"; id: string }
  | { type: "door"; line: string }
  | { type: "ignite" }
  | null;

export type StepFlags = { announce: string; clink: boolean };

const BOTTLE_ML = 40;

export function createRuntime(): Runtime {
  return {
    beaker: emptyBeaker(),
    cuso4: { x: 0, y: 0, w: 80, h: 140, moved: false, ml: BOTTLE_ML },
    naoh: { x: 0, y: 0, w: 80, h: 140, moved: false, ml: BOTTLE_ML },
    bunsen: { x: 0, y: 0, w: 70, h: 110, moved: false, lit: false },
    held: null,
    grabX: 0,
    grabY: 0,
    pointerX: 0,
    pointerY: 0,
    pointerDown: false,
    downX: 0,
    downY: 0,
    pouring: null,
    pourArmed: true,
    found: new Set(),
    view: "lab",
    time: 0,
    maxTemp: 22,
    sparks: [],
    molecules: [],
    flashes: [],
    notice: null,
    doorReady: false,
    fonts: { display: "Georgia", mono: "monospace", sans: "sans-serif", hand: "Georgia" },
    fontsReady: false,
    lastW: 0,
    lastH: 0,
    molSeeded: false,
    reduced: false,
    heating: false,
    forming: false,
    breaking: false,
  };
}

export function layoutLab(w: number, h: number): LabLayout {
  const narrow = w < 800;
  if (narrow) {
    const benchY = Math.min(h * 0.58, h - 200);
    const beakerW = Math.min(146, w * 0.4);
    const beakerH = Math.min(188, Math.max(140, h * 0.3));
    const beaker = {
      x: (w - beakerW) / 2,
      y: benchY - beakerH + 6,
      w: beakerW,
      h: beakerH,
    };
    const boardH = Math.max(78, Math.min(112, beaker.y - 16));
    return {
      w,
      h,
      benchY,
      beaker,
      cuso4: { x: 8, y: benchY - 118, w: 64, h: 118 },
      naoh: { x: w - 72, y: benchY - 124, w: 64, h: 124 },
      bunsen: { x: 10, y: benchY + 16, w: 52, h: 56 },
      notebook: { x: 70, y: benchY + 14, w: 84, h: 52 },
      drawer: { x: 70, y: Math.min(h - 50, benchY + 74), w: Math.min(150, w * 0.4), h: 42 },
      report: { x: w - 86, y: benchY + 10, w: 72, h: 88 },
      board: { x: 10, y: 8, w: w - 80, h: boardH },
      note: { x: 18, y: 8 + boardH - 28, w: Math.min(190, w * 0.48), h: 24 },
      loupe: { x: w - 64, y: Math.min(h - 60, benchY + 108), w: 52, h: 52 },
      door: { x: w - 64, y: 8, w: 52, h: boardH },
      back: { x: 16, y: h - 58, w: 200, h: 36 },
      thermo: { x: 12, y: boardH + 16, h: 72 },
      tap: { x: 18, y: benchY - 8 },
    };
  }

  const benchY = h * 0.66;
  const beaker = { x: w * 0.4, y: benchY - 236, w: 176, h: 236 };
  return {
    w,
    h,
    benchY,
    beaker,
    cuso4: { x: w * 0.15, y: benchY - 168, w: 88, h: 158 },
    naoh: { x: w * 0.69, y: benchY - 176, w: 82, h: 166 },
    bunsen: { x: w * 0.57, y: benchY - 96, w: 76, h: 96 },
    notebook: { x: w * 0.045, y: benchY - 86, w: 136, h: 80 },
    drawer: { x: w * 0.05, y: benchY + 34, w: 196, h: 52 },
    report: { x: w * 0.86, y: benchY - 128, w: 108, h: 126 },
    board: { x: w * 0.24, y: h * 0.045, w: Math.min(500, w * 0.4), h: 176 },
    note: { x: w * 0.255, y: h * 0.045 + 128, w: 240, h: 34 },
    loupe: { x: w * 0.78, y: benchY - 78, w: 70, h: 70 },
    door: { x: w - 128, y: h * 0.05, w: 92, h: 204 },
    back: { x: w - 250, y: 18, w: 220, h: 36 },
    thermo: { x: 36, y: h * 0.08, h: 150 },
    tap: { x: 46, y: benchY - 36 },
  };
}

function intersects(a: Rect, b: Rect) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function contains(r: Rect, x: number, y: number) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

function overMouth(item: Rect, beaker: Rect) {
  const mouth = { x: beaker.x + 6, y: beaker.y - 16, w: beaker.w - 12, h: 46 };
  return intersects(item, mouth);
}

export function burnerHeats(bunsen: Rect, beaker: Rect, benchY: number, lit: boolean) {
  if (!lit) return false;
  const base = bunsen.y + bunsen.h;
  const onBench = Math.abs(base - benchY) < 42;
  const cx = bunsen.x + bunsen.w / 2;
  const within = cx > beaker.x + beaker.w * 0.08 && cx < beaker.x + beaker.w * 0.92;
  return onBench && within;
}

function restBottle(item: Bottle, home: Rect) {
  item.x = home.x;
  item.y = home.y;
  item.w = home.w;
  item.h = home.h;
  item.moved = false;
}

function restBurner(burner: Burner, layout: LabLayout) {
  const base = burner.y + burner.h;
  if (Math.abs(base - layout.benchY) > 24) {
    burner.y = layout.benchY - burner.h + 6;
  }
  burner.x = Math.max(8, Math.min(layout.w - burner.w - 8, burner.x));
  burner.moved = true;
}

function place(item: Gear, home: Rect) {
  item.w = home.w;
  item.h = home.h;
  if (!item.moved) {
    item.x = home.x;
    item.y = home.y;
  }
}

function settle(rt: Runtime, layout: LabLayout) {
  if (rt.lastW > 0 && (rt.lastW !== layout.w || rt.lastH !== layout.h)) {
    const sx = layout.w / rt.lastW;
    const sy = layout.h / rt.lastH;
    for (const item of [rt.cuso4, rt.naoh, rt.bunsen]) {
      if (item.moved) {
        item.x *= sx;
        item.y *= sy;
      }
    }
  }
  rt.lastW = layout.w;
  rt.lastH = layout.h;
  place(rt.cuso4, layout.cuso4);
  place(rt.naoh, layout.naoh);
  place(rt.bunsen, layout.bunsen);
}

type HitId =
  | "cuso4"
  | "naoh"
  | "bunsen"
  | "notebook"
  | "drawer"
  | "report"
  | "note"
  | "loupe"
  | "door"
  | "beaker"
  | "back";

function topHit(rt: Runtime, layout: LabLayout, x: number, y: number): HitId | null {
  if (rt.view === "molecule") return contains(layout.back, x, y) ? "back" : null;
  const order: { id: HitId; rect: Rect }[] = [
    { id: "loupe", rect: layout.loupe },
    { id: "door", rect: layout.door },
    { id: "cuso4", rect: rt.cuso4 },
    { id: "naoh", rect: rt.naoh },
    { id: "notebook", rect: layout.notebook },
    { id: "drawer", rect: layout.drawer },
    { id: "report", rect: layout.report },
    { id: "note", rect: layout.note },
  ];
  for (const item of order) {
    if (contains(item.rect, x, y)) return item.id;
  }
  if (contains(rt.bunsen, x, y)) return "bunsen";
  if (contains(layout.beaker, x, y)) return "beaker";
  return null;
}

export function cursorFor(rt: Runtime, layout: LabLayout, x: number, y: number) {
  if (rt.held) return "grabbing";
  const id = topHit(rt, layout, x, y);
  if (id === "cuso4" || id === "naoh" || id === "bunsen") return "grab";
  if (id) return "pointer";
  return "default";
}

export function pointerDown(rt: Runtime, layout: LabLayout, x: number, y: number) {
  settle(rt, layout);
  rt.pointerDown = true;
  rt.pointerX = x;
  rt.pointerY = y;
  rt.downX = x;
  rt.downY = y;
  rt.held = null;
  if (rt.view === "molecule") return;
  const id = topHit(rt, layout, x, y);
  if (id === "cuso4" || id === "naoh" || id === "bunsen") {
    rt.held = id;
    const item = rt[id];
    rt.grabX = x - item.x;
    rt.grabY = y - item.y;
  }
}

export function pointerMove(rt: Runtime, layout: LabLayout, x: number, y: number) {
  rt.pointerX = x;
  rt.pointerY = y;
  if (!rt.held) return;
  const item = rt[rt.held];
  item.x = x - rt.grabX;
  item.y = y - rt.grabY;
  item.moved = true;
  item.x = Math.max(-item.w * 0.2, Math.min(layout.w - item.w * 0.6, item.x));
  item.y = Math.max(0, Math.min(layout.h - item.h * 0.45, item.y));
}

export function pointerUp(rt: Runtime, layout: LabLayout, x: number, y: number): Action {
  settle(rt, layout);
  rt.pointerDown = false;
  rt.pointerX = x;
  rt.pointerY = y;
  const moved = Math.hypot(x - rt.downX, y - rt.downY) > 8;
  const held = rt.held;
  rt.held = null;
  if (held === "cuso4") restBottle(rt.cuso4, layout.cuso4);
  if (held === "naoh") restBottle(rt.naoh, layout.naoh);
  if (held === "bunsen") restBurner(rt.bunsen, layout);
  if (moved) return null;
  const id = topHit(rt, layout, x, y);
  if (rt.view === "molecule") {
    if (id === "back") rt.view = "lab";
    return null;
  }
  if (id === "bunsen" || held === "bunsen") {
    rt.bunsen.lit = !rt.bunsen.lit;
    return rt.bunsen.lit ? { type: "ignite" } : null;
  }
  if (id === "loupe" || id === "beaker") {
    rt.view = "molecule";
    rt.molSeeded = false;
    return null;
  }
  if (id === "notebook" || id === "drawer" || id === "report" || id === "note") {
    return { type: "memory", id: id === "note" ? "board" : id };
  }
  if (id === "door") {
    const stage = experimentStage({
      beaker: rt.beaker,
      maxTemp: rt.maxTemp,
      memoriesFound: rt.found.size,
    });
    return { type: "door", line: doorLine(stage) };
  }
  return null;
}

export function releasePointer(rt: Runtime) {
  rt.pointerDown = false;
  rt.held = null;
  rt.pouring = null;
}

function spawnSpark(rt: Runtime, x: number, y: number, kind: Spark["kind"]) {
  if (rt.sparks.length > 70) rt.sparks.shift();
  rt.sparks.push({
    x,
    y,
    vx: (Math.random() - 0.5) * 36,
    vy: kind === "heat" ? -10 - Math.random() * 24 : -16 - Math.random() * 28,
    life: 0.7 + Math.random() * 0.4,
    kind,
  });
}

function moleculeBounds(layout: LabLayout) {
  return { left: 56, top: 86, right: layout.w - 56, bottom: layout.h - 130 };
}

function spawnMolecule(kind: MolKind, layout: LabLayout, bond: number): Molecule {
  const box = moleculeBounds(layout);
  return {
    kind,
    x: box.left + Math.random() * Math.max(20, box.right - box.left),
    y: box.top + Math.random() * Math.max(20, box.bottom - box.top),
    vx: (Math.random() - 0.5) * 28,
    vy: (Math.random() - 0.5) * 28,
    angle: Math.random() * Math.PI * 2,
    bond,
  };
}

function targetCounts(beaker: Beaker) {
  const scale = 700;
  const clamp = (n: number, max: number) => Math.max(0, Math.min(max, Math.round(n)));
  return {
    h2o: 8,
    cu: clamp(beaker.cu2 * scale, 8),
    oh: clamp(beaker.oh * scale, 10),
    cuoh2: clamp(beaker.cuoh2 * scale, 8),
    cuo: clamp(beaker.cuo * scale, 8),
    na: clamp(beaker.na * scale * 0.5, 8),
    so4: clamp(beaker.so4 * scale * 0.5, 6),
  };
}

function syncMolecules(rt: Runtime, layout: LabLayout, precipitated: number, decomposed: number) {
  const want = targetCounts(rt.beaker);
  const kinds = Object.keys(want) as MolKind[];
  for (const kind of kinds) {
    const indexes: number[] = [];
    rt.molecules.forEach((molecule, index) => {
      if (molecule.kind === kind) indexes.push(index);
    });
    const extra = indexes.length - want[kind];
    if (extra > 0) {
      const remove = new Set(indexes.slice(0, extra));
      const next: Molecule[] = [];
      rt.molecules.forEach((molecule, index) => {
        if (!remove.has(index)) {
          next.push(molecule);
          return;
        }
        if (kind === "cuoh2" && decomposed > 0) {
          rt.flashes.push({ x: molecule.x, y: molecule.y, life: 1, mode: "break" });
        }
      });
      rt.molecules = next;
    }
    const have = rt.molecules.filter((molecule) => molecule.kind === kind).length;
    for (let i = have; i < want[kind]; i += 1) {
      const bond = kind === "cuoh2" && precipitated > 0 ? 54 : 18;
      const born = spawnMolecule(kind, layout, bond);
      if (kind === "cuoh2" && precipitated > 0) {
        rt.flashes.push({ x: born.x, y: born.y, life: 1, mode: "form" });
      }
      rt.molecules.push(born);
    }
  }
}

function stepMolecules(rt: Runtime, layout: LabLayout, dt: number) {
  const box = moleculeBounds(layout);
  for (const molecule of rt.molecules) {
    molecule.angle += dt * (rt.reduced ? 0 : 0.35);
    molecule.vx += (Math.random() - 0.5) * 30 * dt;
    molecule.vy += (Math.random() - 0.5) * 30 * dt;
    molecule.vx *= 1 - Math.min(0.5, dt * 1.4);
    molecule.vy *= 1 - Math.min(0.5, dt * 1.4);
    molecule.x += molecule.vx * dt;
    molecule.y += molecule.vy * dt;
    if (molecule.x < box.left) {
      molecule.x = box.left;
      molecule.vx *= -1;
    }
    if (molecule.x > box.right) {
      molecule.x = box.right;
      molecule.vx *= -1;
    }
    if (molecule.y < box.top) {
      molecule.y = box.top;
      molecule.vy *= -1;
    }
    if (molecule.y > box.bottom) {
      molecule.y = box.bottom;
      molecule.vy *= -1;
    }
    if (molecule.kind === "cuoh2") {
      molecule.bond = rt.reduced ? 18 : molecule.bond + (18 - molecule.bond) * Math.min(1, dt * 2.4);
    }
  }
  const mols = rt.molecules;
  for (let i = 0; i < mols.length; i += 1) {
    for (let j = i + 1; j < mols.length; j += 1) {
      const a = mols[i];
      const b = mols[j];
      if (!a || !b) continue;
      let dx = b.x - a.x;
      let dy = b.y - a.y;
      const dist2 = dx * dx + dy * dy;
      if (dist2 < 1 || dist2 > 36 * 36) continue;
      const dist = Math.sqrt(dist2);
      const push = (36 - dist) * 16 * dt;
      dx /= dist;
      dy /= dist;
      a.x -= dx * push;
      a.y -= dy * push;
      b.x += dx * push;
      b.y += dy * push;
    }
  }
  for (const flash of rt.flashes) flash.life -= dt * 0.7;
  rt.flashes = rt.flashes.filter((flash) => flash.life > 0);
}

export function step(rt: Runtime, layout: LabLayout, dt: number): StepFlags {
  settle(rt, layout);
  const safeDt = Math.max(0, Math.min(0.05, dt));
  rt.time += safeDt;
  let clink = false;
  rt.pouring = null;

  if (rt.pointerDown && (rt.held === "cuso4" || rt.held === "naoh")) {
    const bottle = rt[rt.held];
    if (bottle.ml > 0 && overMouth(bottle, layout.beaker)) {
      const ml = Math.min(bottle.ml, 12 * safeDt);
      if (ml > 0) {
        rt.beaker = addReagent(rt.beaker, rt.held, ml);
        bottle.ml -= ml;
        rt.pouring = rt.held;
        if (rt.pourArmed) {
          clink = true;
          rt.pourArmed = false;
        }
      }
    }
  }
  if (!rt.pouring) rt.pourArmed = true;

  rt.heating = burnerHeats(rt.bunsen, layout.beaker, layout.benchY, rt.bunsen.lit);
  const result = tick(rt.beaker, rt.heating, safeDt);
  rt.beaker = result.beaker;
  rt.maxTemp = Math.max(rt.maxTemp, rt.beaker.tempC);
  rt.forming = result.precipitatedMol > 0.000002;
  rt.breaking = result.decomposedMol > 0.000002;

  if (!rt.reduced && rt.forming) {
    spawnSpark(rt, layout.beaker.x + layout.beaker.w * 0.5, layout.beaker.y + layout.beaker.h * 0.45, "form");
  }
  if (!rt.reduced && rt.breaking) {
    spawnSpark(rt, layout.beaker.x + layout.beaker.w * 0.5, layout.beaker.y + layout.beaker.h * 0.7, "smoke");
  }
  if (!rt.reduced && rt.heating && Math.random() < 0.4) {
    spawnSpark(rt, rt.bunsen.x + rt.bunsen.w * 0.5, rt.bunsen.y + 8, "heat");
  }
  for (const spark of rt.sparks) {
    spark.life -= safeDt;
    spark.x += spark.vx * safeDt;
    spark.y += spark.vy * safeDt;
    spark.vy -= 10 * safeDt;
  }
  rt.sparks = rt.sparks.filter((spark) => spark.life > 0);

  if (rt.view === "molecule") {
    if (!rt.molSeeded) {
      rt.molecules = [];
      rt.flashes = [];
      rt.molSeeded = true;
    }
    syncMolecules(rt, layout, result.precipitatedMol, result.decomposedMol);
    stepMolecules(rt, layout, safeDt);
  } else {
    rt.molSeeded = false;
  }

  if (rt.notice) {
    rt.notice.life -= safeDt;
    if (rt.notice.life <= 0) rt.notice = null;
  }

  const stage = experimentStage({
    beaker: rt.beaker,
    maxTemp: rt.maxTemp,
    memoriesFound: rt.found.size,
  });
  const ready = stage === "ready";
  if (ready && !rt.doorReady) {
    rt.notice = { text: "A light is on in the doorway. The classroom is through there.", life: 7 };
  }
  rt.doorReady = ready;

  const announce = rt.notice ? rt.notice.text : describeBeaker(rt.beaker, rt.heating);
  return { announce, clink };
}

export function noteFound(rt: Runtime, id: string) {
  rt.found.add(id);
  rt.pointerDown = false;
  rt.held = null;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function beakerOutline(ctx: CanvasRenderingContext2D, r: Rect) {
  const lip = Math.min(14, r.w * 0.08);
  ctx.beginPath();
  ctx.moveTo(r.x + lip, r.y);
  ctx.lineTo(r.x + 6, r.y + r.h - 18);
  ctx.quadraticCurveTo(r.x + r.w / 2, r.y + r.h + 12, r.x + r.w - 6, r.y + r.h - 18);
  ctx.lineTo(r.x + r.w - lip, r.y);
  ctx.closePath();
}

function solutionPaint(beaker: Beaker) {
  const liters = Math.max(0.001, beaker.volumeMl / 1000);
  const blue = Math.min(1, beaker.cu2 / liters / 0.45);
  return {
    r: Math.round(214 - blue * 176),
    g: Math.round(226 - blue * 120),
    b: Math.round(230 - blue * 48),
    a: 0.16 + blue * 0.55,
  };
}

function sedimentPaint(beaker: Beaker) {
  const solid = beaker.cuoh2 + beaker.cuo;
  if (solid <= 0) return null;
  const dark = beaker.cuo / solid;
  return {
    r: Math.round(150 - dark * 128),
    g: Math.round(188 - dark * 168),
    b: Math.round(204 - dark * 188),
    a: 0.78 + dark * 0.18,
    height: Math.min(120, 36 + solid * 7000),
  };
}

function drawRoom(ctx: CanvasRenderingContext2D, layout: LabLayout) {
  const sky = ctx.createLinearGradient(0, 0, 0, layout.h);
  sky.addColorStop(0, "#07080c");
  sky.addColorStop(0.42, "#151922");
  sky.addColorStop(1, "#0b0c10");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, layout.w, layout.h);

  ctx.strokeStyle = "rgba(255,255,255,0.035)";
  ctx.lineWidth = 1;
  for (let y = 18; y < layout.benchY - 20; y += 28) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(layout.w, y);
    ctx.stroke();
  }

  const pool = ctx.createRadialGradient(
    layout.beaker.x + layout.beaker.w / 2,
    layout.benchY,
    20,
    layout.beaker.x + layout.beaker.w / 2,
    layout.benchY,
    layout.w * 0.48,
  );
  pool.addColorStop(0, "rgba(255, 176, 96, 0.16)");
  pool.addColorStop(1, "rgba(255, 176, 96, 0)");
  ctx.fillStyle = pool;
  ctx.fillRect(0, 0, layout.w, layout.h);

  ctx.fillStyle = "#241c16";
  ctx.fillRect(0, layout.benchY, layout.w, layout.h - layout.benchY);
  const lip = ctx.createLinearGradient(0, layout.benchY, 0, layout.benchY + 18);
  lip.addColorStop(0, "#8a6b4d");
  lip.addColorStop(1, "#3a2b20");
  ctx.fillStyle = lip;
  ctx.fillRect(0, layout.benchY, layout.w, 16);
  ctx.strokeStyle = "rgba(0,0,0,0.25)";
  for (let x = 0; x < layout.w; x += 90) {
    ctx.beginPath();
    ctx.moveTo(x, layout.benchY + 16);
    ctx.lineTo(x + 30, layout.h);
    ctx.stroke();
  }
}

function drawBoard(ctx: CanvasRenderingContext2D, layout: LabLayout, fonts: Fonts, found: boolean) {
  const board = layout.board;
  ctx.fillStyle = "#5c4634";
  roundRect(ctx, board.x - 8, board.y - 8, board.w + 16, board.h + 16, 6);
  ctx.fill();
  ctx.fillStyle = "#1d3a34";
  roundRect(ctx, board.x, board.y, board.w, board.h, 3);
  ctx.fill();
  const narrow = layout.w < 800;
  const lines = narrow
    ? ["Pour the blue bottle,", "then the clear one.", "Hold them over the mouth.", "Heat from underneath."]
    : [
        "Pour the copper sulfate.",
        "Then the sodium hydroxide.",
        "Hold a bottle over the mouth of the beaker.",
        "Drag the burner underneath and click it.",
        "Look into the glass.",
      ];
  ctx.fillStyle = "rgba(226, 232, 220, 0.9)";
  ctx.textAlign = "left";
  ctx.font = `${narrow ? 15 : 20}px ${fonts.hand}`;
  lines.forEach((line, index) => {
    ctx.fillText(line, board.x + 16, board.y + (narrow ? 22 : 28) + index * (narrow ? 16 : 22));
  });
  ctx.fillStyle = found ? "rgba(226, 232, 220, 0.35)" : "rgba(226, 232, 220, 0.75)";
  ctx.font = `${narrow ? 13 : 16}px ${fonts.hand}`;
  ctx.fillText(found ? "the margin has been read" : "a note in the margin", layout.note.x, layout.note.y + layout.note.h - 6);
}

function drawDoor(ctx: CanvasRenderingContext2D, layout: LabLayout, ready: boolean, time: number, fonts: Fonts) {
  const door = layout.door;
  ctx.fillStyle = "#120f0c";
  roundRect(ctx, door.x, door.y, door.w, door.h, 3);
  ctx.fill();
  ctx.strokeStyle = "#6d5844";
  ctx.lineWidth = 3;
  ctx.stroke();
  const glow = ready ? 0.45 + Math.sin(time * 2) * 0.12 : 0.18;
  ctx.fillStyle = ready ? `rgba(255, 186, 110, ${glow})` : "rgba(90, 104, 120, 0.28)";
  ctx.fillRect(door.x + door.w * 0.22, door.y + 16, door.w * 0.56, Math.min(48, door.h * 0.28));
  ctx.fillStyle = "rgba(244, 240, 230, 0.78)";
  ctx.font = `12px ${fonts.mono}`;
  ctx.textAlign = "center";
  ctx.fillText(ready ? "open" : "shut", door.x + door.w / 2, door.y + door.h - 14);
}

function drawThermo(ctx: CanvasRenderingContext2D, layout: LabLayout, temp: number, fonts: Fonts) {
  const { x, y, h } = layout.thermo;
  ctx.strokeStyle = "rgba(214, 228, 232, 0.7)";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, 14, h);
  const t = Math.min(1, Math.max(0, (temp - 18) / 112));
  const fill = (h - 6) * t;
  ctx.fillStyle = temp > 75 ? "#e15b3a" : "#c44b4b";
  ctx.fillRect(x + 3, y + h - 3 - fill, 8, fill);
  ctx.fillStyle = "#f4f0e6";
  ctx.textAlign = "left";
  ctx.font = `13px ${fonts.mono}`;
  ctx.fillText(`${Math.round(temp)}°C`, x + 20, y + 14);
}

function drawNotebook(ctx: CanvasRenderingContext2D, rect: Rect, found: boolean, fonts: Fonts) {
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.beginPath();
  ctx.ellipse(rect.x + rect.w / 2, rect.y + rect.h - 2, rect.w * 0.42, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = found ? "#8d3b2d" : "#9a4030";
  roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 3);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.beginPath();
  ctx.moveTo(rect.x + 16, rect.y);
  ctx.lineTo(rect.x + 16, rect.y + rect.h);
  ctx.stroke();
  ctx.fillStyle = "#f6efe2";
  ctx.font = `15px ${fonts.hand}`;
  ctx.textAlign = "left";
  ctx.fillText("lab book", rect.x + 24, rect.y + rect.h * 0.58);
}

function drawDrawer(ctx: CanvasRenderingContext2D, rect: Rect, found: boolean, fonts: Fonts) {
  ctx.fillStyle = "#3a2c22";
  roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 4);
  ctx.fill();
  ctx.fillStyle = found ? "#c9a27a" : "#d7c4a4";
  ctx.fillRect(rect.x + rect.w / 2 - 16, rect.y + rect.h / 2 - 4, 32, 8);
  ctx.fillStyle = "rgba(244,240,230,0.8)";
  ctx.font = `13px ${fonts.mono}`;
  ctx.textAlign = "left";
  ctx.fillText("drawer", rect.x + 10, rect.y + 16);
}

function drawReport(ctx: CanvasRenderingContext2D, rect: Rect, found: boolean, fonts: Fonts) {
  ctx.fillStyle = "#6e6256";
  roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 3);
  ctx.fill();
  ctx.fillStyle = found ? "#efe6d4" : "#f7f1e4";
  ctx.fillRect(rect.x + 8, rect.y + 10, rect.w - 16, rect.h - 20);
  ctx.strokeStyle = "rgba(40,32,24,0.35)";
  ctx.beginPath();
  for (let i = 0; i < 4; i += 1) {
    const y = rect.y + 28 + i * 16;
    ctx.moveTo(rect.x + 16, y);
    ctx.lineTo(rect.x + rect.w - 16, y);
  }
  ctx.stroke();
  ctx.fillStyle = "#2a2118";
  ctx.font = `14px ${fonts.hand}`;
  ctx.textAlign = "center";
  ctx.fillText("report", rect.x + rect.w / 2, rect.y + rect.h - 28);
}

function drawLoupe(ctx: CanvasRenderingContext2D, rect: Rect, fonts: Fonts) {
  const cx = rect.x + rect.w * 0.4;
  const cy = rect.y + rect.h * 0.4;
  const radius = rect.w * 0.32;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(190, 220, 230, 0.18)";
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#d7dde2";
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + radius * 0.7, cy + radius * 0.7);
  ctx.lineTo(rect.x + rect.w - 4, rect.y + rect.h - 4);
  ctx.stroke();
  ctx.fillStyle = "rgba(244,240,230,0.8)";
  ctx.font = `12px ${fonts.mono}`;
  ctx.textAlign = "center";
  ctx.fillText("lens", cx, cy + radius + 16);
}

function drawBottle(
  ctx: CanvasRenderingContext2D,
  bottle: Bottle,
  label: string,
  liquid: string,
  fonts: Fonts,
) {
  const { x, y, w, h } = bottle;
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h, w * 0.32, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(214, 230, 236, 0.16)";
  roundRect(ctx, x + w * 0.34, y, w * 0.32, h * 0.22, 3);
  ctx.fill();
  ctx.strokeStyle = "rgba(214, 230, 236, 0.7)";
  ctx.lineWidth = 2;
  ctx.stroke();
  roundRect(ctx, x + 4, y + h * 0.18, w - 8, h * 0.78, 8);
  ctx.fillStyle = "rgba(214, 230, 236, 0.08)";
  ctx.fill();
  ctx.stroke();
  const fill = Math.max(0, Math.min(1, bottle.ml / BOTTLE_ML));
  const bodyTop = y + h * 0.22;
  const bodyH = h * 0.7;
  const liquidH = bodyH * fill;
  ctx.save();
  roundRect(ctx, x + 6, y + h * 0.2, w - 12, h * 0.74, 7);
  ctx.clip();
  ctx.fillStyle = liquid;
  ctx.fillRect(x + 6, bodyTop + bodyH - liquidH, w - 12, liquidH + 8);
  ctx.restore();
  ctx.fillStyle = "#f4efe4";
  ctx.fillRect(x + 12, y + h * 0.46, w - 24, h * 0.24);
  ctx.fillStyle = "#1c1915";
  ctx.textAlign = "center";
  ctx.font = `12px ${fonts.mono}`;
  ctx.fillText(label, x + w / 2, y + h * 0.56);
  ctx.font = `11px ${fonts.mono}`;
  ctx.fillText(`${Math.ceil(bottle.ml)} mL`, x + w / 2, y + h * 0.66);
}

function drawBunsen(ctx: CanvasRenderingContext2D, burner: Burner) {
  const { x, y, w, h } = burner;
  ctx.fillStyle = "#14161a";
  roundRect(ctx, x + w * 0.42, y + 22, w * 0.16, h - 30, 2);
  ctx.fill();
  ctx.fillStyle = "#8a6232";
  roundRect(ctx, x + w * 0.3, y + 16, w * 0.4, 12, 2);
  ctx.fill();
  ctx.fillStyle = "#2c3138";
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h - 6, w * 0.46, 9, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawFlame(ctx: CanvasRenderingContext2D, burner: Burner, time: number, heating: boolean) {
  const { x, y, w, h } = burner;
  const origin = y + h - 18;
  const height = (heating ? 72 : 42) + Math.sin(time * 14) * 5;
  const gradient = ctx.createLinearGradient(x, origin, x, origin - height);
  gradient.addColorStop(0, "rgba(90, 170, 255, 0.1)");
  gradient.addColorStop(0.35, "rgba(255, 186, 70, 0.85)");
  gradient.addColorStop(1, "rgba(255, 244, 210, 0.95)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.34, origin);
  ctx.quadraticCurveTo(
    x + w * 0.5 + Math.sin(time * 11) * 6,
    origin - height * 0.65,
    x + w * 0.5,
    origin - height,
  );
  ctx.quadraticCurveTo(x + w * 0.5 - Math.sin(time * 9) * 5, origin - height * 0.5, x + w * 0.66, origin);
  ctx.fill();
}

function drawBeaker(ctx: CanvasRenderingContext2D, layout: LabLayout, rt: Runtime) {
  const r = layout.beaker;
  const paint = solutionPaint(rt.beaker);
  const sediment = sedimentPaint(rt.beaker);
  const fullness = Math.min(1, rt.beaker.volumeMl / 110);
  const bottom = r.y + r.h - 16;
  const surface = bottom - (r.h - 48) * fullness;

  ctx.save();
  beakerOutline(ctx, r);
  ctx.clip();
  ctx.fillStyle = "rgba(198, 220, 228, 0.07)";
  ctx.fillRect(r.x, r.y, r.w, r.h + 8);
  const liquid = ctx.createLinearGradient(r.x, surface, r.x + r.w, bottom);
  liquid.addColorStop(0, `rgba(${paint.r}, ${paint.g}, ${paint.b}, ${Math.min(0.92, paint.a + 0.08)})`);
  liquid.addColorStop(1, `rgba(${Math.round(paint.r * 0.72)}, ${Math.round(paint.g * 0.78)}, ${paint.b}, ${Math.min(0.95, paint.a + 0.28)})`);
  ctx.fillStyle = liquid;
  ctx.fillRect(r.x, surface, r.w, bottom - surface + 20);
  if (sediment) {
    const band = ctx.createLinearGradient(r.x, bottom - sediment.height, r.x, bottom);
    band.addColorStop(0, `rgba(${sediment.r}, ${sediment.g}, ${sediment.b}, 0.15)`);
    band.addColorStop(1, `rgba(${sediment.r}, ${sediment.g}, ${sediment.b}, ${sediment.a})`);
    ctx.fillStyle = band;
    ctx.fillRect(r.x, bottom - sediment.height, r.w, sediment.height + 24);
  }
  const solid = rt.beaker.cuoh2 + rt.beaker.cuo;
  if (sediment && solid > 0.0003) {
    const dark = rt.beaker.cuo / solid;
    for (let i = 0; i < 9; i += 1) {
      const px = r.x + 18 + ((i * 19) % Math.max(12, r.w - 36));
      const py = bottom - 10 - ((i * 11) % Math.max(12, sediment.height - 8));
      ctx.fillStyle = dark > 0.45 ? "rgba(12, 10, 8, 0.9)" : "rgba(244, 248, 250, 0.95)";
      ctx.beginPath();
      ctx.arc(px, py, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  for (const spark of rt.sparks) {
    if (spark.kind === "heat") continue;
    ctx.fillStyle =
      spark.kind === "smoke" ? `rgba(40, 36, 32, ${spark.life})` : `rgba(255, 214, 150, ${spark.life})`;
    ctx.fillRect(spark.x, spark.y, 3, 3);
  }
  ctx.restore();

  ctx.strokeStyle = "rgba(226, 238, 242, 0.88)";
  ctx.lineWidth = 2.5;
  beakerOutline(ctx, r);
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,0.28)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(r.x + 18, r.y + 14);
  ctx.lineTo(r.x + 12, r.y + r.h - 30);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(r.x + r.w / 2, r.y, r.w / 2 - 8, 7, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(r.x + r.w / 2, surface, r.w / 2 - 16, 6, 0, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(${paint.r}, ${paint.g}, ${paint.b}, ${Math.min(0.9, paint.a + 0.2)})`;
  ctx.fill();

  if (rt.beaker.tempC > 85) {
    ctx.strokeStyle = "rgba(220, 226, 230, 0.28)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i += 1) {
      const sway = Math.sin(rt.time * 2 + i) * 8;
      ctx.beginPath();
      ctx.moveTo(r.x + r.w * 0.35 + i * 18, r.y - 4);
      ctx.quadraticCurveTo(r.x + r.w * 0.4 + sway, r.y - 28 - i * 8, r.x + r.w * 0.5 + sway, r.y - 48 - i * 10);
      ctx.stroke();
    }
  }
}

function drawPour(ctx: CanvasRenderingContext2D, rt: Runtime, layout: LabLayout) {
  if (!rt.pouring) return;
  const bottle = rt[rt.pouring];
  const fromX = bottle.x + bottle.w / 2;
  const fromY = bottle.y + bottle.h * 0.2;
  const toX = layout.beaker.x + layout.beaker.w / 2;
  const toY = layout.beaker.y + 8;
  ctx.strokeStyle = rt.pouring === "cuso4" ? "rgba(48, 104, 176, 0.8)" : "rgba(220, 230, 236, 0.7)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.quadraticCurveTo(fromX, toY, toX, toY);
  ctx.stroke();
}

function drawTube(ctx: CanvasRenderingContext2D, layout: LabLayout, burner: Burner) {
  ctx.strokeStyle = "#1a1c20";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(layout.tap.x, layout.tap.y);
  ctx.quadraticCurveTo(layout.tap.x, burner.y + burner.h, burner.x + burner.w / 2, burner.y + burner.h - 6);
  ctx.stroke();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(" ");
  let line = "";
  let yy = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, yy);
      line = word;
      yy += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, yy);
}

function drawAtom(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
  label: string,
  fonts: Fonts,
) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.fillStyle = "#0e1218";
  ctx.font = `${Math.max(9, radius * 0.7)}px ${fonts.mono}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x, y + 1);
  ctx.textBaseline = "alphabetic";
}

function drawMolecules(ctx: CanvasRenderingContext2D, rt: Runtime, layout: LabLayout) {
  const wash = ctx.createLinearGradient(0, 0, 0, layout.h);
  wash.addColorStop(0, "#071018");
  wash.addColorStop(1, "#102033");
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, layout.w, layout.h);
  const paint = solutionPaint(rt.beaker);
  ctx.fillStyle = `rgba(${paint.r}, ${paint.g}, ${paint.b}, 0.18)`;
  ctx.fillRect(0, 0, layout.w, layout.h);

  ctx.fillStyle = "#f4f0e6";
  ctx.textAlign = "left";
  ctx.font = `13px ${rt.fonts.mono}`;
  const lines = [
    `Cu2+  ${rt.beaker.cu2.toFixed(4)} mol`,
    `OH-   ${rt.beaker.oh.toFixed(4)} mol`,
    `Cu(OH)2  ${rt.beaker.cuoh2.toFixed(4)} mol`,
    `CuO  ${rt.beaker.cuo.toFixed(4)} mol`,
    `${Math.round(rt.beaker.tempC)} C`,
  ];
  lines.forEach((line, index) => ctx.fillText(line, 24, 28 + index * 16));

  for (const flash of rt.flashes) {
    const radius = (1 - flash.life) * 80 + 8;
    ctx.beginPath();
    ctx.arc(flash.x, flash.y, radius, 0, Math.PI * 2);
    ctx.strokeStyle =
      flash.mode === "form"
        ? `rgba(255, 196, 120, ${Math.max(0, flash.life)})`
        : `rgba(150, 196, 255, ${Math.max(0, flash.life)})`;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  for (const molecule of rt.molecules) {
    if (molecule.kind === "cuoh2") {
      const p1 = {
        x: molecule.x + Math.cos(molecule.angle) * molecule.bond,
        y: molecule.y + Math.sin(molecule.angle) * molecule.bond,
      };
      const p2 = {
        x: molecule.x + Math.cos(molecule.angle + 2.2) * molecule.bond,
        y: molecule.y + Math.sin(molecule.angle + 2.2) * molecule.bond,
      };
      ctx.strokeStyle = "rgba(244, 236, 214, 0.85)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(molecule.x, molecule.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.moveTo(molecule.x, molecule.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
      drawAtom(ctx, molecule.x, molecule.y, 15, "#2f6fbe", "Cu", rt.fonts);
      drawAtom(ctx, p1.x, p1.y, 11, "#d5f0e4", "OH", rt.fonts);
      drawAtom(ctx, p2.x, p2.y, 11, "#d5f0e4", "OH", rt.fonts);
    } else if (molecule.kind === "cuo") {
      const ox = molecule.x + Math.cos(molecule.angle) * 16;
      const oy = molecule.y + Math.sin(molecule.angle) * 16;
      ctx.strokeStyle = "rgba(244, 220, 200, 0.8)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(molecule.x, molecule.y);
      ctx.lineTo(ox, oy);
      ctx.stroke();
      drawAtom(ctx, molecule.x, molecule.y, 15, "#2f6fbe", "Cu", rt.fonts);
      drawAtom(ctx, ox, oy, 12, "#d0654e", "O", rt.fonts);
    } else if (molecule.kind === "cu") {
      drawAtom(ctx, molecule.x, molecule.y, 15, "#3c82d6", "Cu", rt.fonts);
    } else if (molecule.kind === "oh") {
      drawAtom(ctx, molecule.x, molecule.y, 12, "#d5f0e4", "OH", rt.fonts);
    } else if (molecule.kind === "na") {
      drawAtom(ctx, molecule.x, molecule.y, 11, "#f0d48a", "Na", rt.fonts);
    } else if (molecule.kind === "so4") {
      drawAtom(ctx, molecule.x, molecule.y, 13, "#e4e2d6", "SO4", rt.fonts);
    } else {
      drawAtom(ctx, molecule.x, molecule.y, 10, "rgba(210, 226, 234, 0.85)", "H2O", rt.fonts);
    }
  }

  const caption = moleculeCaption(rt.beaker, rt.forming, rt.breaking);
  ctx.fillStyle = "#f4f0e6";
  ctx.textAlign = "left";
  ctx.font = `${layout.w < 800 ? 18 : 22}px ${rt.fonts.display}`;
  const captionTop = layout.w < 800 ? layout.back.y - 78 : layout.h - 108;
  wrapText(ctx, caption, 24, captionTop, layout.w - 48, layout.w < 800 ? 22 : 26);

  roundRect(ctx, layout.back.x, layout.back.y, layout.back.w, layout.back.h, 0);
  ctx.strokeStyle = "rgba(244,240,230,0.7)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.font = `13px ${rt.fonts.mono}`;
  ctx.textAlign = "center";
  ctx.fillText("back to the bench", layout.back.x + layout.back.w / 2, layout.back.y + 26);
}

export function drawLab(ctx: CanvasRenderingContext2D, rt: Runtime, layout: LabLayout) {
  if (rt.view === "molecule") {
    drawMolecules(ctx, rt, layout);
    return;
  }
  drawRoom(ctx, layout);
  drawBoard(ctx, layout, rt.fonts, rt.found.has("board"));
  drawDoor(ctx, layout, rt.doorReady, rt.time, rt.fonts);
  drawThermo(ctx, layout, rt.beaker.tempC, rt.fonts);
  drawTube(ctx, layout, rt.bunsen);
  drawBunsen(ctx, rt.bunsen);
  drawNotebook(ctx, layout.notebook, rt.found.has("notebook"), rt.fonts);
  drawDrawer(ctx, layout.drawer, rt.found.has("drawer"), rt.fonts);
  drawReport(ctx, layout.report, rt.found.has("report"), rt.fonts);
  drawLoupe(ctx, layout.loupe, rt.fonts);
  drawBeaker(ctx, layout, rt);
  if (rt.bunsen.lit) drawFlame(ctx, rt.bunsen, rt.time, rt.heating);
  const gear: { item: Gear; draw: () => void }[] = [
    { item: rt.cuso4, draw: () => drawBottle(ctx, rt.cuso4, "CuSO4", "rgba(32, 92, 168, 0.9)", rt.fonts) },
    { item: rt.naoh, draw: () => drawBottle(ctx, rt.naoh, "NaOH", "rgba(226, 234, 238, 0.55)", rt.fonts) },
  ];
  gear.sort((a, b) => a.item.y - b.item.y);
  for (const piece of gear) piece.draw();
  drawPour(ctx, rt, layout);
  for (const spark of rt.sparks) {
    if (spark.kind !== "heat") continue;
    ctx.fillStyle = `rgba(255, 170, 70, ${spark.life})`;
    ctx.fillRect(spark.x, spark.y, 3, 3);
  }

  ctx.fillStyle = "rgba(244, 240, 230, 0.72)";
  ctx.font = `13px ${rt.fonts.mono}`;
  ctx.textAlign = "left";
  const status =
    rt.beaker.cuo > 0.0008
      ? "copper oxide"
      : rt.beaker.cuoh2 > 0.0004
        ? "copper hydroxide"
        : rt.beaker.cu2 > 0.0004
          ? "copper sulfate"
          : rt.beaker.oh > 0.0004
            ? "sodium hydroxide"
            : "water";
  ctx.fillText(status, layout.thermo.x, layout.thermo.y + layout.thermo.h + 22);
}
