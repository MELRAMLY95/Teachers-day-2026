import type { Beaker } from "@/lib/chemistry/simulation";
import {
  chemistryHits,
  englishWords,
  graphBand,
  manuscript,
  springAnchor,
  type WorldSim,
} from "./sim";

export type SceneTone = "chemistry" | "physics" | "math" | "english" | "inner";

export type SceneSpot = { id: string; x: number; y: number; open: number };

export type SceneFrame = {
  time: number;
  life: number;
  warmth: number;
  focus: string | null;
  freeze: boolean;
  width: number;
  height: number;
  spots: SceneSpot[];
  sim: WorldSim;
};

function mix(a: string, b: string, t: number) {
  const parse = (hex: string) => [
    Number.parseInt(hex.slice(1, 3), 16),
    Number.parseInt(hex.slice(3, 5), 16),
    Number.parseInt(hex.slice(5, 7), 16),
  ];
  const from = parse(a);
  const to = parse(b);
  const amount = Math.min(1, Math.max(0, t));
  const channels = from.map((channel, index) => Math.round(channel + (to[index] - channel) * amount));
  return `rgb(${channels[0]}, ${channels[1]}, ${channels[2]})`;
}

function hash(index: number) {
  const value = Math.sin(index * 91.7 + 4.2) * 43758.5453;
  return value - Math.floor(value);
}

function sky(ctx: CanvasRenderingContext2D, frame: SceneFrame, top: string, mid: string, bottom: string, warm: string) {
  const t = Math.max(frame.life, frame.warmth * 0.85);
  const gradient = ctx.createLinearGradient(0, 0, 0, frame.height);
  gradient.addColorStop(0, mix(top, warm, t * 0.45));
  gradient.addColorStop(0.55, mix(mid, warm, t * 0.28));
  gradient.addColorStop(1, mix(bottom, warm, t * 0.55));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, frame.width, frame.height);
}

function vignette(ctx: CanvasRenderingContext2D, frame: SceneFrame) {
  const veil = ctx.createRadialGradient(
    frame.width / 2,
    frame.height / 2,
    frame.width * 0.2,
    frame.width / 2,
    frame.height / 2,
    frame.width * 0.75,
  );
  veil.addColorStop(0, "rgba(0,0,0,0)");
  veil.addColorStop(1, "rgba(0,0,0,0.42)");
  ctx.fillStyle = veil;
  ctx.fillRect(0, 0, frame.width, frame.height);
  if (frame.focus) {
    ctx.fillStyle = "rgba(6, 4, 3, 0.42)";
    ctx.fillRect(0, 0, frame.width, frame.height);
  }
}

function marker(ctx: CanvasRenderingContext2D, x: number, y: number, open: number, color: string, time: number) {
  const breathe = 0.85 + Math.sin(time * 0.8 + x) * 0.12;
  const glow = ctx.createRadialGradient(x, y, 2, x, y, 22 + open * 10);
  glow.addColorStop(0, color);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.globalAlpha = (0.2 + open * 0.45) * breathe;
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, 22 + open * 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 2.2 + open * 1.4, 0, Math.PI * 2);
  ctx.fill();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function liquidOf(beaker: Beaker) {
  if (beaker.cuo > 0.0003 && beaker.cuo >= beaker.cuoh2) return "rgba(36, 28, 26, 0.9)";
  if (beaker.cuoh2 > 0.0002) return "rgba(126, 176, 196, 0.82)";
  if (beaker.cu2 > 0.0002) return "rgba(42, 108, 176, 0.78)";
  if (beaker.oh > 0.0002) return "rgba(226, 232, 234, 0.45)";
  return "rgba(214, 206, 190, 0.16)";
}

function glassTube(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string, level: number) {
  ctx.strokeStyle = "rgba(236, 224, 206, 0.55)";
  ctx.lineWidth = 1.4;
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = fill;
  const liquid = h * level;
  ctx.fillRect(x + 1.5, y + h - liquid, w - 3, liquid);
}

function molecule(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, seed: number) {
  const count = 3;
  const points = Array.from({ length: count }, (_, index) => {
    const angle = time * 0.4 + index * ((Math.PI * 2) / count) + seed;
    return { x: x + Math.cos(angle) * scale, y: y + Math.sin(angle) * scale * 0.72 };
  });
  ctx.strokeStyle = "rgba(236, 214, 180, 0.7)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  points.forEach((point, index) => {
    const next = points[(index + 1) % points.length];
    ctx.moveTo(point.x, point.y);
    ctx.lineTo(next.x, next.y);
  });
  ctx.stroke();
  points.forEach((point, index) => {
    ctx.fillStyle = index === 0 ? "#f2d7b0" : "#c47a3a";
    ctx.beginPath();
    ctx.arc(point.x, point.y, index === 0 ? 4 : 3, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawChemistry(ctx: CanvasRenderingContext2D, frame: SceneFrame) {
  sky(ctx, frame, "#140e0b", "#24160f", "#1a100c", "#e0a15a");
  const { width, height, life, warmth, time, sim } = frame;
  const hits = chemistryHits(width, height);

  ctx.fillStyle = mix("#1a120e", "#3a2418", life * 0.45);
  ctx.fillRect(0, height * 0.72, width, height * 0.28);
  ctx.strokeStyle = "rgba(236, 214, 180, 0.2)";
  ctx.beginPath();
  ctx.moveTo(0, height * 0.72);
  ctx.lineTo(width, height * 0.72);
  ctx.stroke();

  const sun = ctx.createRadialGradient(width * 0.5, height * 0.22, 8, width * 0.5, height * 0.28, 180 + warmth * 140);
  sun.addColorStop(0, `rgba(255, 214, 160, ${0.08 + warmth * 0.4})`);
  sun.addColorStop(1, "rgba(255, 214, 160, 0)");
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, width, height);

  const chartX = width * 0.08;
  const chartY = height * 0.16;
  const symbols = ["H", "O", "Na", "S", "Cu", "Cl"];
  symbols.forEach((symbol, index) => {
    const col = index % 3;
    const row = Math.floor(index / 3);
    ctx.strokeStyle = `rgba(236, 214, 180, ${0.18 + life * 0.25})`;
    ctx.strokeRect(chartX + col * 28, chartY + row * 28, 24, 24);
    ctx.fillStyle = "rgba(244, 228, 206, 0.55)";
    ctx.font = "11px Georgia";
    ctx.fillText(symbol, chartX + col * 28 + 6, chartY + row * 28 + 16);
  });

  for (let index = 0; index < 5; index += 1) {
    const x = width * (0.78 + (index % 3) * 0.05);
    const h = 36 + (index % 3) * 16;
    const level = 0.25 + ((time * 0.08 + index) % 1) * 0.45;
    glassTube(ctx, x, height * 0.72 - h, 12, h, index % 2 ? "rgba(196, 122, 58, 0.45)" : "rgba(70, 120, 150, 0.4)", level);
  }

  const drip = (time * 28) % 70;
  ctx.strokeStyle = "rgba(236, 224, 206, 0.45)";
  ctx.beginPath();
  ctx.moveTo(width * 0.84, height * 0.2);
  ctx.lineTo(width * 0.84, height * 0.42);
  ctx.stroke();
  ctx.fillStyle = "rgba(180, 140, 90, 0.7)";
  ctx.beginPath();
  ctx.arc(width * 0.84, height * 0.42 + drip, 2.2, 0, Math.PI * 2);
  ctx.fill();

  glassTube(ctx, hits.rinse.x - 14, hits.rinse.y - 20, 28, 36, "rgba(220, 230, 235, 0.35)", 0.7);
  ctx.fillStyle = "rgba(244, 228, 206, 0.7)";
  ctx.font = "11px Georgia";
  ctx.fillText("rinse", hits.rinse.x - 16, hits.rinse.y + 28);

  const bottle = (x: number, y: number, label: string, color: string) => {
    roundRect(ctx, x - 16, y - 28, 32, 52, 6);
    ctx.fillStyle = "rgba(244, 232, 214, 0.08)";
    ctx.fill();
    ctx.strokeStyle = "rgba(244, 228, 206, 0.65)";
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.fillRect(x - 12, y - 4, 24, 22);
    ctx.fillStyle = "rgba(244, 228, 206, 0.85)";
    ctx.font = "12px Georgia";
    ctx.textAlign = "center";
    ctx.fillText(label, x, y - 34);
    ctx.textAlign = "left";
  };
  bottle(hits.copper.x, hits.copper.y, "CuSO4", "rgba(42, 108, 176, 0.85)");
  bottle(hits.hydroxide.x, hits.hydroxide.y, "NaOH", "rgba(230, 236, 238, 0.8)");

  const bx = hits.beaker.x;
  const by = hits.beaker.y;
  ctx.strokeStyle = "rgba(244, 232, 214, 0.8)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(bx - 28, by - 20);
  ctx.lineTo(bx - 36, by + 48);
  ctx.lineTo(bx + 36, by + 48);
  ctx.lineTo(bx + 28, by - 20);
  ctx.stroke();
  ctx.fillStyle = liquidOf(sim.beaker);
  ctx.beginPath();
  ctx.moveTo(bx - 33, by + 18);
  ctx.lineTo(bx - 36, by + 48);
  ctx.lineTo(bx + 36, by + 48);
  ctx.lineTo(bx + 33, by + 18);
  ctx.fill();
  if (sim.beaker.cuoh2 > 0.0002 || sim.beaker.cuo > 0.0002) {
    ctx.fillStyle = sim.beaker.cuo > sim.beaker.cuoh2 ? "rgba(20, 16, 14, 0.85)" : "rgba(170, 210, 220, 0.7)";
    ctx.fillRect(bx - 30, by + 34, 60, 10);
  }
  const bubbles = sim.heating ? 8 : 3;
  for (let index = 0; index < bubbles; index += 1) {
    const y = by + 40 - ((time * (18 + index * 4) + index * 12) % 48);
    ctx.fillStyle = "rgba(255, 236, 214, 0.45)";
    ctx.beginPath();
    ctx.arc(bx - 16 + index * 5, y, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }

  if (sim.heating || warmth > 0.2) {
    const flame = ctx.createRadialGradient(bx, height * 0.72, 2, bx, height * 0.72, 30);
    flame.addColorStop(0, `rgba(255, 196, 120, ${sim.heating ? 0.9 : 0.25})`);
    flame.addColorStop(1, "rgba(255, 140, 60, 0)");
    ctx.fillStyle = flame;
    ctx.beginPath();
    ctx.ellipse(bx, height * 0.72, 26, 10, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const clusters = 3 + Math.round(life * 3);
  for (let index = 0; index < clusters; index += 1) {
    const angle = time * (0.25 + index * 0.05) + index;
    const orbit = 90 + index * 18;
    molecule(ctx, bx + Math.cos(angle) * orbit, by - 30 + Math.sin(angle) * orbit * 0.35, 16, time, index);
  }

  for (let index = 0; index < 16; index += 1) {
    const x = (hash(index) * width + time * 8) % width;
    const y = height * 0.3 + ((hash(index + 2) * height * 0.3 - time * 12) % (height * 0.35));
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = "#f0d8b4";
    ctx.fillRect(x, y, 1.4, 1.4);
  }
  ctx.globalAlpha = 1;
  for (const spot of frame.spots) marker(ctx, spot.x, spot.y, spot.open, "rgba(232, 186, 120, 0.95)", time);
}

function projectCube(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, time: number, alpha: number) {
  const yaw = time * 0.35;
  const pitch = 0.5;
  const corners = [-1, 1].flatMap((x) => [-1, 1].flatMap((y) => [-1, 1].map((z) => ({ x, y, z }))));
  const flat = corners.map((corner) => {
    const x1 = corner.x * Math.cos(yaw) - corner.z * Math.sin(yaw);
    const z1 = corner.x * Math.sin(yaw) + corner.z * Math.cos(yaw);
    const y2 = corner.y * Math.cos(pitch) - z1 * Math.sin(pitch);
    return { x: cx + x1 * size, y: cy + y2 * size };
  });
  const edges = [
    [0, 1], [0, 2], [0, 4], [1, 3], [1, 5], [2, 3], [2, 6], [3, 7], [4, 5], [4, 6], [5, 7], [6, 7],
  ];
  ctx.strokeStyle = `rgba(228, 206, 160, ${alpha})`;
  ctx.lineWidth = 1.2;
  edges.forEach(([a, b]) => {
    const from = flat[a];
    const to = flat[b];
    if (!from || !to) return;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  });
}

function drawPhysics(ctx: CanvasRenderingContext2D, frame: SceneFrame) {
  sky(ctx, frame, "#070814", "#12182a", "#1a140e", "#d4b483");
  const { width, height, life, time, sim } = frame;
  for (let index = 0; index < 70; index += 1) {
    ctx.globalAlpha = 0.2 + hash(index) * 0.5;
    ctx.fillStyle = "#f4ead8";
    ctx.fillRect(hash(index + 1) * width, hash(index + 3) * height * 0.62, 1.3, 1.3);
  }
  ctx.globalAlpha = 1;

  const cx = width * 0.72;
  const cy = height * 0.28;
  const glow = ctx.createRadialGradient(cx, cy, 4, cx, cy, 70);
  glow.addColorStop(0, "rgba(255, 236, 210, 0.9)");
  glow.addColorStop(1, "rgba(255, 236, 210, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, 70, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f6edd8";
  ctx.beginPath();
  ctx.arc(cx, cy, 5, 0, Math.PI * 2);
  ctx.fill();
  const body = sim.orbit;
  const scale = 0.55;
  ctx.strokeStyle = "rgba(214, 196, 160, 0.35)";
  ctx.beginPath();
  ctx.ellipse(cx, cy, 90, 48, -0.4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#f4ead8";
  ctx.beginPath();
  ctx.arc(cx + body.x * scale, cy + body.y * scale * 0.45, 3.2, 0, Math.PI * 2);
  ctx.fill();

  const pivotX = width * 0.22;
  const pivotY = height * 0.18;
  const length = 120 + life * 20;
  const angle = Math.sin(time * 1.4) * 0.55;
  const bobX = pivotX + Math.sin(angle) * length;
  const bobY = pivotY + Math.cos(angle) * length;
  ctx.strokeStyle = "rgba(220, 206, 176, 0.7)";
  ctx.beginPath();
  ctx.moveTo(pivotX, pivotY);
  ctx.lineTo(bobX, bobY);
  ctx.stroke();
  ctx.fillStyle = "#e6d3ae";
  ctx.beginPath();
  ctx.arc(bobX, bobY, 8, 0, Math.PI * 2);
  ctx.fill();

  const anchor = springAnchor(width, height);
  const coils = 10;
  const endY = anchor.y + sim.spring;
  ctx.strokeStyle = "rgba(232, 214, 180, 0.85)";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(anchor.x, anchor.y - 30);
  for (let index = 0; index <= coils; index += 1) {
    const t = index / coils;
    const y = anchor.y - 30 + t * (endY - (anchor.y - 30));
    const x = anchor.x + (index % 2 === 0 ? -10 : 10);
    ctx.lineTo(x, y);
  }
  ctx.lineTo(anchor.x, endY);
  ctx.stroke();
  ctx.fillStyle = sim.mass > 1.4 ? "#c4a36a" : "#f4ead8";
  ctx.beginPath();
  ctx.arc(anchor.x, endY, 12 + sim.mass * 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(244, 228, 200, 0.4)";
  ctx.strokeRect(anchor.x + 62, anchor.y - 8, 28, 28);
  ctx.fillStyle = "rgba(244, 228, 200, 0.75)";
  ctx.font = "11px Georgia";
  ctx.fillText("mass", anchor.x + 64, anchor.y + 36);

  ctx.beginPath();
  ctx.strokeStyle = `rgba(220, 200, 160, ${0.25 + life * 0.35})`;
  for (let x = width * 0.12; x < width * 0.88; x += 4) {
    const y = height * 0.8 + Math.sin(x * 0.02 + time * 1.6) * (6 + life * 10);
    if (x === width * 0.12) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  for (const spot of frame.spots) marker(ctx, spot.x, spot.y, spot.open, "rgba(220, 206, 170, 0.95)", time);
}

function drawPortrait(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "rgba(232, 214, 186, 0.9)";
  ctx.beginPath();
  ctx.moveTo(-18, 48);
  ctx.quadraticCurveTo(-36, 10, -20, -18);
  ctx.quadraticCurveTo(-8, -46, 16, -40);
  ctx.quadraticCurveTo(34, -34, 28, -8);
  ctx.quadraticCurveTo(46, -2, 40, 8);
  ctx.quadraticCurveTo(30, 16, 22, 18);
  ctx.quadraticCurveTo(18, 36, 8, 48);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgba(18, 14, 10, 0.85)";
  ctx.beginPath();
  ctx.ellipse(-2, -6, 2.2, 2.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(18, 14, 10, 0.55)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-10, -16);
  ctx.quadraticCurveTo(-2, -20, 8, -14);
  ctx.stroke();
  ctx.restore();
}

function drawMath(ctx: CanvasRenderingContext2D, frame: SceneFrame) {
  sky(ctx, frame, "#12100c", "#1c1712", "#241c14", "#d4b483");
  const { width, height, life, time, sim } = frame;
  ctx.strokeStyle = `rgba(212, 180, 130, ${0.05 + life * 0.05})`;
  const gap = 56;
  for (let x = gap; x < width; x += gap) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = gap; y < height; y += gap) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  const depth = 2 + Math.floor((time * 0.15) % 4);
  const drawBranch = (x: number, y: number, radius: number, level: number) => {
    if (level > depth || radius < 8) return;
    ctx.strokeStyle = `rgba(228, 206, 160, ${0.25 + level * 0.12})`;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
    drawBranch(x - radius * 0.6, y, radius * 0.5, level + 1);
    drawBranch(x + radius * 0.6, y, radius * 0.5, level + 1);
  };
  if (!frame.freeze) {
    drawBranch(width * 0.2, height * 0.28, 36 + life * 10, 0);
    projectCube(ctx, width * 0.5, height * 0.34, 48 + life * 12, time, 0.55 + life * 0.3);
  }

  const band = graphBand(width, height);
  ctx.beginPath();
  ctx.strokeStyle = "rgba(244, 228, 200, 0.8)";
  ctx.lineWidth = 1.6;
  for (let x = band.left; x <= band.right; x += 3) {
    const local = (x - band.left) / (band.right - band.left);
    const y = (band.top + band.bottom) / 2 - Math.sin(local * Math.PI * 2 * sim.freq + time * 0.8) * sim.amp * 36;
    if (x === band.left) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  for (const spot of frame.spots) marker(ctx, spot.x, spot.y, spot.open, "rgba(228, 206, 160, 0.95)", time);
  if (frame.freeze) {
    ctx.fillStyle = "rgba(8, 6, 4, 0.55)";
    ctx.fillRect(0, 0, width, height);
    drawPortrait(ctx, width * 0.62, height * 0.3);
  }
}

function shelf(ctx: CanvasRenderingContext2D, x: number, y: number, life: number, seed: number) {
  for (let index = 0; index < 5; index += 1) {
    const h = 22 + hash(seed + index) * 16;
    ctx.globalAlpha = 0.45 + life * 0.4;
    ctx.fillStyle = ["#6a3028", "#3c4a34", "#5a3a28", "#2c2622", "#7a6238"][(seed + index) % 5] ?? "#5a3a28";
    ctx.fillRect(x + index * 11, y - h, 8, h);
  }
  ctx.globalAlpha = 1;
}

const DRIFT = ["listen", "page", "voice", "line", "safe", "word"];

function drawEnglish(ctx: CanvasRenderingContext2D, frame: SceneFrame) {
  sky(ctx, frame, "#140e0a", "#1c120e", "#2a1a12", "#c47a3a");
  const { width, height, life, warmth, time, sim } = frame;
  const lamp = ctx.createRadialGradient(width * 0.5, height * 0.16, 4, width * 0.5, height * 0.2, 240 + life * 40);
  lamp.addColorStop(0, `rgba(255, 214, 160, ${0.25 + warmth * 0.4})`);
  lamp.addColorStop(1, "rgba(255, 214, 160, 0)");
  ctx.fillStyle = lamp;
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = "rgba(244, 220, 180, 0.75)";
  ctx.beginPath();
  ctx.moveTo(width * 0.5, height * 0.08);
  ctx.lineTo(width * 0.5, height * 0.16);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(width * 0.5, height * 0.16, 6, 0, Math.PI * 2);
  ctx.stroke();

  shelf(ctx, 18, height * 0.36, life, 2);
  shelf(ctx, 18, height * 0.62, life, 4);
  shelf(ctx, width - 74, height * 0.36, life, 6);
  shelf(ctx, width - 74, height * 0.62, life, 8);

  ctx.fillStyle = "rgba(244, 228, 206, 0.55)";
  ctx.font = "15px Georgia";
  DRIFT.forEach((word, index) => {
    const x = width * (0.34 + (index % 3) * 0.12) + Math.sin(time * 0.3 + index) * 8;
    const y = height * (0.24 + Math.floor(index / 3) * 0.08) + Math.cos(time * 0.25 + index) * 6;
    ctx.globalAlpha = 0.28 + life * 0.25;
    ctx.fillText(word, x, y);
  });
  ctx.globalAlpha = 1;

  ctx.fillStyle = "rgba(244, 232, 214, 0.88)";
  ctx.font = "18px Georgia";
  ctx.textAlign = "center";
  ctx.fillText("The notebook looks", width * 0.5, height * 0.52);
  englishWords(width, height).forEach((word, index) => {
    ctx.fillStyle = sim.sentence === index ? "rgba(244, 220, 180, 0.95)" : "rgba(244, 220, 180, 0.35)";
    ctx.fillText(word.label, word.x, word.y);
  });
  ctx.textAlign = "left";
  for (const spot of frame.spots) marker(ctx, spot.x, spot.y, spot.open, "rgba(232, 196, 150, 0.95)", time);
}

function starPattern(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, alpha: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = `rgba(214, 186, 140, ${alpha})`;
  ctx.lineWidth = 1;
  for (let step = 0; step < 8; step += 1) {
    ctx.rotate(Math.PI / 8);
    ctx.beginPath();
    ctx.moveTo(radius * 0.25, 0);
    ctx.lineTo(radius, 0);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.45, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawInner(ctx: CanvasRenderingContext2D, frame: SceneFrame) {
  sky(ctx, frame, "#100e0c", "#181410", "#241c16", "#c4a36a");
  const { width, height, life, time, sim } = frame;
  const book = manuscript(width, height);
  ctx.fillStyle = mix("#16120e", "#2a2218", life * 0.5);
  ctx.fillRect(0, height * 0.78, width, height * 0.22);

  for (let col = 0; col < 6; col += 1) {
    for (let row = 0; row < 3; row += 1) {
      starPattern(ctx, width * (0.12 + col * 0.15), height * (0.16 + row * 0.18), 16, 0.08 + life * 0.08);
    }
  }

  const cx = width * 0.5;
  const base = height * 0.74;
  const light = ctx.createRadialGradient(cx, base - 160, 8, cx, base - 80, 160);
  light.addColorStop(0, `rgba(255, 214, 170, ${0.08 + life * 0.2 + Math.sin(time * 2) * 0.02})`);
  light.addColorStop(1, "rgba(255, 214, 170, 0)");
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = `rgba(214, 186, 140, ${0.35 + life * 0.4})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 90, base);
  ctx.lineTo(cx - 90, base - 150);
  ctx.quadraticCurveTo(cx, base - 250 - life * 12, cx + 90, base - 150);
  ctx.lineTo(cx + 90, base);
  ctx.stroke();

  ctx.fillStyle = "rgba(244, 232, 214, 0.06)";
  ctx.fillRect(book.x - book.w / 2, book.y - book.h / 2, book.w, book.h);
  ctx.strokeStyle = "rgba(226, 206, 170, 0.55)";
  ctx.strokeRect(book.x - book.w / 2, book.y - book.h / 2, book.w, book.h);
  ctx.fillStyle = "rgba(244, 232, 214, 0.82)";
  ctx.font = "15px Georgia";
  ctx.textAlign = "center";
  const pages = [
    ["A page of pattern.", "Turn it."],
    ["Actions are only", "by intentions."],
    ["The days. The route.", "The effort stayed."],
  ];
  const lines = pages[sim.page] ?? pages[0];
  lines.forEach((line, index) => ctx.fillText(line, book.x, book.y - 8 + index * 22));
  ctx.textAlign = "left";

  const stones = sim.page === 2 ? 8 : 3 + Math.round(life * 4);
  for (let index = 0; index < stones; index += 1) {
    ctx.fillStyle = `rgba(214, 190, 150, ${0.2 + life * 0.45})`;
    ctx.beginPath();
    ctx.ellipse(width * (0.18 + index * 0.08), height * 0.86, 11, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const spot of frame.spots) marker(ctx, spot.x, spot.y, spot.open, "rgba(220, 196, 160, 0.95)", time);
}

export function drawScene(ctx: CanvasRenderingContext2D, tone: SceneTone, frame: SceneFrame) {
  if (tone === "chemistry") drawChemistry(ctx, frame);
  else if (tone === "physics") drawPhysics(ctx, frame);
  else if (tone === "math") drawMath(ctx, frame);
  else if (tone === "english") drawEnglish(ctx, frame);
  else drawInner(ctx, frame);
  vignette(ctx, frame);
}
