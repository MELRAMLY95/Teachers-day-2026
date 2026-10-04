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
  /** Keeps moving when a memory slows the room, so the stare can blink and turn. */
  live: number;
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

type MoleculeTone = "water" | "copper" | "gel" | "oxide";

function molecule(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number, seed: number, tone: MoleculeTone) {
  const count = tone === "water" ? 3 : 4;
  const spin = time * (tone === "oxide" || tone === "gel" ? 1.35 : 0.42) + seed;
  const points = Array.from({ length: count }, (_, index) => {
    const angle = spin + index * ((Math.PI * 2) / count);
    return { x: x + Math.cos(angle) * scale, y: y + Math.sin(angle) * scale * 0.7 };
  });
  ctx.strokeStyle = tone === "copper" ? "rgba(170, 206, 230, 0.75)" : "rgba(236, 214, 180, 0.65)";
  ctx.lineWidth = 1.15;
  ctx.beginPath();
  points.forEach((point, index) => {
    const next = points[(index + 1) % points.length];
    ctx.moveTo(point.x, point.y);
    ctx.lineTo(next.x, next.y);
  });
  ctx.stroke();
  const center = tone === "oxide" ? "#241c1a" : tone === "copper" || tone === "gel" ? "#2c6eb4" : "#f4efe4";
  const satellite = tone === "gel" ? "#d5eef4" : tone === "oxide" ? "#f3ead8" : tone === "copper" ? "#d7ecf8" : "#e7d3b4";
  ctx.fillStyle = center;
  ctx.beginPath();
  ctx.arc(x, y, tone === "oxide" ? 4.2 : 3.4, 0, Math.PI * 2);
  ctx.fill();
  points.forEach((point) => {
    ctx.fillStyle = satellite;
    ctx.beginPath();
    ctx.arc(point.x, point.y, 2.5, 0, Math.PI * 2);
    ctx.fill();
  });
}

function traceBeaker(ctx: CanvasRenderingContext2D, x: number, top: number, bottom: number, halfTop: number, halfBot: number) {
  ctx.beginPath();
  ctx.moveTo(x - halfTop, top + 4);
  ctx.lineTo(x - halfBot, bottom - 8);
  ctx.quadraticCurveTo(x - halfBot - 1, bottom + 3, x, bottom + 3);
  ctx.quadraticCurveTo(x + halfBot + 1, bottom + 3, x + halfBot, bottom - 8);
  ctx.lineTo(x + halfTop, top + 4);
  ctx.quadraticCurveTo(x + halfTop + 14, top - 8, x + halfTop + 4, top + 8);
  ctx.closePath();
}

function drawReagentBottle(ctx: CanvasRenderingContext2D, x: number, y: number, label: string, liquid: string, time: number) {
  const top = y - 44;
  const neck = y - 18;
  const bot = y + 42;
  const sway = Math.sin(time * 1.6 + x) * 0.6;
  ctx.save();
  ctx.translate(sway, 0);
  ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
  ctx.beginPath();
  ctx.ellipse(x + 3, bot + 3, 16, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x - 5, top + 10);
  ctx.lineTo(x - 5, neck);
  ctx.quadraticCurveTo(x - 7, neck + 4, x - 15, neck + 12);
  ctx.lineTo(x - 14, bot - 8);
  ctx.quadraticCurveTo(x - 15, bot, x, bot);
  ctx.quadraticCurveTo(x + 15, bot, x + 14, bot - 8);
  ctx.lineTo(x + 15, neck + 12);
  ctx.quadraticCurveTo(x + 7, neck + 4, x + 5, neck);
  ctx.lineTo(x + 5, top + 10);
  ctx.quadraticCurveTo(x, top + 4, x - 5, top + 10);
  ctx.closePath();
  const glass = ctx.createLinearGradient(x - 16, top, x + 16, bot);
  glass.addColorStop(0, "rgba(255, 250, 242, 0.16)");
  glass.addColorStop(0.45, "rgba(255, 248, 236, 0.04)");
  glass.addColorStop(1, "rgba(255, 244, 220, 0.1)");
  ctx.fillStyle = glass;
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = liquid;
  ctx.fillRect(x - 16, y - 2, 32, bot - (y - 2));
  ctx.fillStyle = "rgba(255, 255, 255, 0.28)";
  ctx.fillRect(x - 14, y - 4, 28, 2);
  const bubbleY = y + 8 + ((time * 10 + x) % 22);
  ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
  ctx.beginPath();
  ctx.arc(x - 4, bubbleY, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = "rgba(255, 244, 226, 0.82)";
  ctx.lineWidth = 1.35;
  ctx.stroke();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(x - 9, neck + 16);
  ctx.quadraticCurveTo(x - 10, y + 8, x - 8, bot - 12);
  ctx.stroke();

  ctx.fillStyle = "#6a4428";
  roundRect(ctx, x - 6, top - 1, 12, 11, 2);
  ctx.fill();
  ctx.fillStyle = "#8d6848";
  ctx.fillRect(x - 6, top + 6, 12, 2);

  ctx.fillStyle = "rgba(250, 244, 232, 0.92)";
  roundRect(ctx, x - 12, y + 2, 24, 14, 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(90, 70, 48, 0.35)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x - 8, y + 7);
  ctx.lineTo(x + 8, y + 7);
  ctx.moveTo(x - 8, y + 11);
  ctx.lineTo(x + 5, y + 11);
  ctx.stroke();
  ctx.fillStyle = "rgba(244, 228, 206, 0.95)";
  ctx.font = "600 12px Georgia";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText(label, x, top - 2);
  ctx.restore();
}

function drawWashBottle(ctx: CanvasRenderingContext2D, x: number, y: number, time: number) {
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
  ctx.beginPath();
  ctx.ellipse(x + 2, y + 18, 14, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x, y + 2, 15, 18, 0, 0, Math.PI * 2);
  const body = ctx.createLinearGradient(x - 15, y, x + 15, y);
  body.addColorStop(0, "rgba(226, 236, 238, 0.2)");
  body.addColorStop(0.5, "rgba(255, 255, 255, 0.08)");
  body.addColorStop(1, "rgba(210, 224, 228, 0.16)");
  ctx.fillStyle = body;
  ctx.fill();
  ctx.strokeStyle = "rgba(236, 244, 246, 0.7)";
  ctx.lineWidth = 1.3;
  ctx.stroke();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = "rgba(210, 228, 232, 0.45)";
  ctx.fillRect(x - 16, y + 2, 32, 20);
  ctx.restore();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
  ctx.beginPath();
  ctx.moveTo(x - 8, y - 8);
  ctx.quadraticCurveTo(x - 9, y + 6, x - 7, y + 12);
  ctx.stroke();
  ctx.strokeStyle = "rgba(236, 244, 246, 0.8)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 2, y - 16);
  ctx.quadraticCurveTo(x + 8, y - 24, x + 16, y - 20 + Math.sin(time * 2) * 1.2);
  ctx.stroke();
  ctx.fillStyle = "rgba(244, 228, 206, 0.78)";
  ctx.font = "11px Georgia";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("rinse", x, y + 30);
  ctx.restore();
}

function drawBurner(ctx: CanvasRenderingContext2D, x: number, y: number, time: number, heating: boolean) {
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
  ctx.beginPath();
  ctx.ellipse(x + 2, y + 8, 24, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#3a2a20";
  ctx.beginPath();
  ctx.ellipse(x, y + 4, 22, 6.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#5c4632";
  ctx.beginPath();
  ctx.ellipse(x, y + 2, 22, 6.5, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  const barrel = ctx.createLinearGradient(x - 5, y, x + 5, y);
  barrel.addColorStop(0, "#8d6a3e");
  barrel.addColorStop(0.5, "#e6c98a");
  barrel.addColorStop(1, "#7a5a34");
  ctx.fillStyle = barrel;
  roundRect(ctx, x - 4.5, y - 26, 9, 28, 2);
  ctx.fill();
  ctx.fillStyle = "#1a120e";
  ctx.beginPath();
  ctx.ellipse(x + 4.5, y - 10, 2.2, 1.5, 0, 0, Math.PI * 2);
  ctx.fill();

  const flick = Math.sin(time * 16) * 0.1 + Math.sin(time * 27 + 0.6) * 0.07;
  const tongues = heating ? 4 : 1;
  const reach = heating ? 54 : 16;
  for (let index = 0; index < tongues; index += 1) {
    const lean = Math.sin(time * (7 + index) + index * 1.7) * (heating ? 8 : 2);
    const h = reach * (1 - index * 0.16) * (1 + flick);
    const origin = y - 26;
    ctx.beginPath();
    ctx.moveTo(x - 7 + index, origin);
    ctx.quadraticCurveTo(x - 18 + lean, origin - h * 0.55, x + lean * 0.35, origin - h);
    ctx.quadraticCurveTo(x + 16 + lean, origin - h * 0.42, x + 7 - index, origin);
    ctx.closePath();
    const flame = ctx.createLinearGradient(x, origin, x, origin - h);
    if (heating) {
      flame.addColorStop(0, "rgba(255, 248, 220, 0.95)");
      flame.addColorStop(0.22, "rgba(150, 196, 255, 0.92)");
      flame.addColorStop(0.58, "rgba(255, 176, 64, 0.8)");
      flame.addColorStop(1, "rgba(255, 70, 20, 0)");
    } else {
      flame.addColorStop(0, "rgba(186, 214, 255, 0.9)");
      flame.addColorStop(1, "rgba(255, 160, 70, 0)");
    }
    ctx.fillStyle = flame;
    ctx.fill();
  }
  if (heating) {
    ctx.fillStyle = "rgba(255, 186, 90, 0.18)";
    ctx.beginPath();
    ctx.ellipse(x, y - 18, 28, 10, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawWorkingBeaker(
  ctx: CanvasRenderingContext2D,
  x: number,
  top: number,
  bottom: number,
  halfTop: number,
  halfBot: number,
  beaker: Beaker,
  time: number,
  heating: boolean,
) {
  const fill = Math.min(0.84, 0.36 + Math.max(0, beaker.volumeMl - 15) / 68);
  const inner = bottom - top - 18;
  const surface = bottom - 8 - inner * fill + Math.sin(time * 2.2) * 1.4;
  const oxide = beaker.cuo > 0.0003 && beaker.cuo >= beaker.cuoh2;
  const gel = beaker.cuoh2 > 0.0002;
  const copper = beaker.cu2 > 0.0002;
  const hydroxide = beaker.oh > 0.0002;

  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
  ctx.beginPath();
  ctx.ellipse(x + 6, bottom + 8, halfBot + 8, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  traceBeaker(ctx, x, top, bottom, halfTop, halfBot);
  const glass = ctx.createLinearGradient(x - halfTop, top, x + halfTop, bottom);
  glass.addColorStop(0, "rgba(255, 250, 242, 0.05)");
  glass.addColorStop(0.5, "rgba(255, 255, 255, 0.02)");
  glass.addColorStop(1, "rgba(255, 236, 210, 0.05)");
  ctx.fillStyle = glass;
  ctx.fill();

  ctx.save();
  traceBeaker(ctx, x, top, bottom, halfTop, halfBot);
  ctx.clip();
  const liquid = ctx.createLinearGradient(x, surface, x, bottom);
  if (oxide) {
    liquid.addColorStop(0, "rgba(120, 104, 96, 0.28)");
    liquid.addColorStop(0.45, "rgba(54, 40, 36, 0.72)");
    liquid.addColorStop(1, "rgba(14, 11, 10, 0.94)");
  } else if (gel) {
    liquid.addColorStop(0, "rgba(214, 236, 242, 0.42)");
    liquid.addColorStop(0.5, "rgba(126, 186, 206, 0.78)");
    liquid.addColorStop(1, "rgba(64, 124, 154, 0.9)");
  } else if (copper) {
    liquid.addColorStop(0, "rgba(126, 186, 224, 0.5)");
    liquid.addColorStop(1, "rgba(22, 74, 148, 0.9)");
  } else if (hydroxide) {
    liquid.addColorStop(0, "rgba(255, 255, 255, 0.18)");
    liquid.addColorStop(1, "rgba(226, 234, 236, 0.42)");
  } else {
    liquid.addColorStop(0, "rgba(255, 248, 236, 0.08)");
    liquid.addColorStop(1, "rgba(214, 204, 186, 0.26)");
  }
  ctx.fillStyle = liquid;
  ctx.fillRect(x - halfTop - 20, surface, halfTop * 2 + 40, bottom - surface + 12);

  const solid = beaker.cuoh2 + beaker.cuo;
  if (solid > 0.0002) {
    const depth = Math.min(bottom - surface - 6, 10 + solid * 7000);
    const bed = ctx.createLinearGradient(x, bottom - depth, x, bottom);
    if (oxide) {
      bed.addColorStop(0, "rgba(36, 28, 26, 0.2)");
      bed.addColorStop(1, "rgba(8, 7, 6, 0.95)");
    } else {
      bed.addColorStop(0, "rgba(186, 220, 230, 0.15)");
      bed.addColorStop(1, "rgba(150, 196, 214, 0.85)");
    }
    ctx.fillStyle = bed;
    ctx.fillRect(x - halfBot - 4, bottom - depth, halfBot * 2 + 8, depth + 8);
    const specks = Math.min(26, Math.round(solid * 4200));
    for (let index = 0; index < specks; index += 1) {
      const px = x - halfBot + 6 + hash(index + 3) * (halfBot * 2 - 12);
      const drift = Math.sin(time * 1.4 + index) * 1.5;
      const py = bottom - 6 - hash(index + 9) * depth + drift;
      ctx.fillStyle = oxide ? "rgba(20, 16, 14, 0.85)" : "rgba(210, 236, 242, 0.75)";
      ctx.fillRect(px, py, oxide ? 2.4 : 2, oxide ? 2.4 : 2);
    }
  }

  const bubbles = heating ? 9 : copper || gel ? 4 : 2;
  for (let index = 0; index < bubbles; index += 1) {
    const span = Math.max(12, bottom - surface - 8);
    const py = bottom - 8 - ((time * (16 + index * 5) + index * 18) % span);
    const px = x - halfBot * 0.55 + ((index * 17) % Math.max(8, halfBot));
    ctx.strokeStyle = "rgba(255, 248, 236, 0.55)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(px, py, heating ? 2.2 : 1.4, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (gel && !oxide) {
    const pulse = 0.12 + Math.sin(time * 3) * 0.06;
    const glow = ctx.createRadialGradient(x, (surface + bottom) / 2, 4, x, (surface + bottom) / 2, halfTop);
    glow.addColorStop(0, `rgba(190, 230, 240, ${pulse})`);
    glow.addColorStop(1, "rgba(190, 230, 240, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(x - halfTop, surface, halfTop * 2, bottom - surface);
  }

  ctx.beginPath();
  ctx.ellipse(x, surface, halfBot * 0.92, 5.5, 0, 0, Math.PI * 2);
  ctx.fillStyle = oxide ? "rgba(40, 32, 30, 0.85)" : gel ? "rgba(186, 220, 230, 0.55)" : copper ? "rgba(70, 140, 190, 0.45)" : "rgba(255, 255, 255, 0.18)";
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = "rgba(255, 246, 232, 0.88)";
  ctx.lineWidth = 1.6;
  traceBeaker(ctx, x, top, bottom, halfTop, halfBot);
  ctx.stroke();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.48)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x - halfTop + 7, top + 14);
  ctx.quadraticCurveTo(x - halfBot + 6, (top + bottom) / 2, x - halfBot + 5, bottom - 14);
  ctx.stroke();

  ctx.strokeStyle = "rgba(255, 244, 226, 0.45)";
  ctx.lineWidth = 1;
  for (let index = 0; index < 4; index += 1) {
    const mark = top + 22 + index * ((bottom - top - 36) / 4);
    ctx.beginPath();
    ctx.moveTo(x - halfTop + 2, mark);
    ctx.lineTo(x - halfTop + (index % 2 === 0 ? 12 : 8), mark);
    ctx.stroke();
  }

  const heat = Math.min(1, Math.max(0, (beaker.tempC - 18) / 110));
  ctx.strokeStyle = "rgba(236, 228, 214, 0.65)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + halfBot * 0.45, top + 10);
  ctx.lineTo(x + halfBot * 0.45, bottom - 12);
  ctx.stroke();
  ctx.strokeStyle = "#c4382a";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(x + halfBot * 0.45, bottom - 14);
  ctx.lineTo(x + halfBot * 0.45, bottom - 14 - heat * (bottom - top - 36));
  ctx.stroke();
  ctx.fillStyle = "#e8e0d2";
  ctx.beginPath();
  ctx.arc(x + halfBot * 0.45, top + 8, 3.2, 0, Math.PI * 2);
  ctx.fill();

  if (heating) {
    const warm = ctx.createLinearGradient(x, bottom - 20, x, bottom - 70);
    warm.addColorStop(0, "rgba(255, 170, 70, 0.18)");
    warm.addColorStop(1, "rgba(255, 170, 70, 0)");
    ctx.fillStyle = warm;
    ctx.fillRect(x - halfBot, bottom - 70, halfBot * 2, 60);
  }

  ctx.beginPath();
  ctx.ellipse(x, top + 3, halfTop * 0.96, 6.5, 0, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255, 248, 236, 0.9)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(x - 4, top + 3, halfTop * 0.7, 3.2, 0, Math.PI, Math.PI * 2);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
  ctx.stroke();

  const vapour = heating ? 6 : beaker.tempC > 48 ? 3 : 0;
  for (let index = 0; index < vapour; index += 1) {
    const phase = (time * 0.32 + index * 0.17) % 1;
    const vy = top - phase * (heating ? 78 : 40);
    const vx = x + Math.sin(time * 1.8 + index) * 12 + (index - vapour / 2) * 7;
    ctx.globalAlpha = (1 - phase) * (heating ? 0.4 : 0.22);
    ctx.strokeStyle = "rgba(255, 236, 210, 0.9)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(vx, vy, 7 + phase * 12, 3.5 + phase * 5, Math.sin(time + index) * 0.4, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  if (beaker.tempC > 42) {
    for (let index = 0; index < 7; index += 1) {
      const dx = x - halfTop + 8 + hash(index + 4) * (halfTop * 1.5);
      const dy = top + 18 + hash(index + 12) * (surface - top - 24);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
      ctx.beginPath();
      ctx.arc(dx, dy, 1.6, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawChemistry(ctx: CanvasRenderingContext2D, frame: SceneFrame) {
  sky(ctx, frame, "#100c09", "#2c1810", "#160e0b", "#f0b15a");
  const { width, height, life, warmth, time, sim } = frame;
  const hits = chemistryHits(width, height);
  const benchFar = hits.copper.y + 44;
  const benchNear = Math.min(height * 0.84, benchFar + height * 0.16);
  const narrow = width < 760;

  ctx.save();
  for (let index = 0; index < 42; index += 1) {
    ctx.globalAlpha = 0.035 + hash(index) * 0.04;
    ctx.fillStyle = hash(index + 1) > 0.5 ? "#3a2418" : "#120c09";
    ctx.fillRect(hash(index + 2) * width, hash(index + 3) * benchFar, 18 + hash(index + 4) * 40, 10 + hash(index + 5) * 26);
  }
  ctx.globalAlpha = 1;

  const tileTop = benchFar - Math.min(78, height * 0.11);
  const tile = 46;
  for (let y = tileTop; y < benchFar; y += tile / 2.4) {
    for (let x = -tile; x < width + tile; x += tile) {
      const shift = Math.floor((y - tileTop) / (tile / 2.4)) % 2 === 0 ? 0 : tile / 2;
      ctx.fillStyle = `rgba(232, 214, 188, ${0.045 + life * 0.04 + hash(x + y) * 0.03})`;
      ctx.fillRect(x + shift, y, tile - 3, tile / 2.4 - 2);
    }
  }

  const win = {
    x: narrow ? width * 0.04 : width * 0.15,
    y: height * 0.045,
    w: narrow ? width * 0.2 : Math.min(width * 0.24, 320),
    h: Math.min(height * 0.24, 200),
  };
  ctx.fillStyle = "#4a301c";
  roundRect(ctx, win.x - 8, win.y - 8, win.w + 16, win.h + 16, 6);
  ctx.fill();
  ctx.save();
  roundRect(ctx, win.x, win.y, win.w, win.h, 2);
  ctx.clip();
  const outside = ctx.createLinearGradient(win.x, win.y, win.x, win.y + win.h);
  outside.addColorStop(0, mix("#f6d7a4", "#fff1d2", life));
  outside.addColorStop(1, mix("#e0974a", "#f2c078", life * 0.8));
  ctx.fillStyle = outside;
  ctx.fillRect(win.x, win.y, win.w, win.h);
  for (let index = 0; index < 3; index += 1) {
    const drift = ((time * 8 + index * 40) % (win.w + 50)) - 20;
    ctx.fillStyle = `rgba(255, 248, 236, ${0.18 + life * 0.12})`;
    ctx.beginPath();
    ctx.ellipse(win.x + drift, win.y + 28 + index * 18, 26, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  const sunX = win.x + win.w * 0.72;
  const sunY = win.y + win.h * 0.38;
  const corona = ctx.createRadialGradient(sunX, sunY, 4, sunX, sunY, 28 + life * 36);
  corona.addColorStop(0, `rgba(255, 250, 230, ${0.85 + life * 0.15})`);
  corona.addColorStop(0.45, `rgba(255, 196, 110, ${0.45 + warmth * 0.4})`);
  corona.addColorStop(1, "rgba(255, 170, 70, 0)");
  ctx.fillStyle = corona;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 30 + life * 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = `rgba(255, 244, 214, ${0.9 + life * 0.1})`;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 8 + life * 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = "rgba(90, 58, 32, 0.85)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(win.x + win.w / 2, win.y);
  ctx.lineTo(win.x + win.w / 2, win.y + win.h);
  ctx.moveTo(win.x, win.y + win.h / 2);
  ctx.lineTo(win.x + win.w, win.y + win.h / 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(win.x + 10, win.y + win.h);
  ctx.lineTo(win.x + win.w - 10, win.y + win.h);
  ctx.lineTo(hits.beaker.x + width * 0.16, benchNear);
  ctx.lineTo(hits.beaker.x - width * 0.06, benchNear);
  ctx.closePath();
  const shaft = ctx.createLinearGradient(win.x, win.y, hits.beaker.x, benchNear);
  shaft.addColorStop(0, `rgba(255, 214, 160, ${0.22 + life * 0.38})`);
  shaft.addColorStop(1, `rgba(255, 196, 120, ${0.03 + warmth * 0.08})`);
  ctx.fillStyle = shaft;
  ctx.fill();

  if (!narrow) {
    const chartX = 22;
    const chartY = height * 0.08;
    ctx.fillStyle = "rgba(244, 232, 214, 0.08)";
    roundRect(ctx, chartX - 8, chartY - 8, 96, 78, 4);
    ctx.fill();
    ctx.strokeStyle = `rgba(236, 214, 180, ${0.28 + life * 0.35})`;
    ctx.stroke();
    ["H", "O", "Na", "S", "Cu", "Cl"].forEach((symbol, index) => {
      const col = index % 3;
      const row = Math.floor(index / 3);
      const cell = col === 0 ? "rgba(90, 140, 170, 0.35)" : col === 2 ? "rgba(70, 120, 90, 0.28)" : "rgba(180, 120, 60, 0.28)";
      ctx.fillStyle = cell;
      roundRect(ctx, chartX + col * 28, chartY + row * 28, 24, 24, 3);
      ctx.fill();
      ctx.fillStyle = "rgba(255, 244, 226, 0.8)";
      ctx.font = "11px Georgia";
      ctx.textAlign = "center";
      ctx.fillText(symbol, chartX + col * 28 + 12, chartY + row * 28 + 16);
    });
  }

  if (width > 980) {
    const lampX = width * 0.7;
    const lampY = height * 0.2;
    ctx.strokeStyle = "rgba(212, 176, 120, 0.55)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(lampX, 0);
    ctx.lineTo(lampX, lampY);
    ctx.stroke();
    ctx.fillStyle = "#6a4a28";
    ctx.beginPath();
    ctx.moveTo(lampX - 16, lampY + 16);
    ctx.lineTo(lampX + 16, lampY + 16);
    ctx.lineTo(lampX + 8, lampY);
    ctx.lineTo(lampX - 8, lampY);
    ctx.closePath();
    ctx.fill();
    const bulb = ctx.createRadialGradient(lampX, lampY + 18, 2, lampX, lampY + 22, 70 + warmth * 40);
    bulb.addColorStop(0, `rgba(255, 220, 170, ${0.35 + warmth * 0.4})`);
    bulb.addColorStop(1, "rgba(255, 200, 140, 0)");
    ctx.fillStyle = bulb;
    ctx.beginPath();
    ctx.arc(lampX, lampY + 20, 72 + warmth * 30, 0, Math.PI * 2);
    ctx.fill();
  }

  const wood = ctx.createLinearGradient(0, benchFar, 0, benchNear);
  wood.addColorStop(0, mix("#8a5a32", "#c48448", life * 0.35));
  wood.addColorStop(1, mix("#5c3a22", "#8a5430", life * 0.2));
  ctx.fillStyle = wood;
  ctx.beginPath();
  ctx.moveTo(0, benchFar);
  ctx.lineTo(width, benchFar);
  ctx.lineTo(width, benchNear);
  ctx.lineTo(0, benchNear);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 220, 180, 0.13)";
  ctx.lineWidth = 1;
  for (let index = 0; index < 7; index += 1) {
    const y = benchFar + ((index + 1) / 8) * (benchNear - benchFar);
    ctx.beginPath();
    ctx.moveTo(0, y + Math.sin(index) * 1.2);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  const apron = ctx.createLinearGradient(0, benchNear, 0, height);
  apron.addColorStop(0, "#3d2818");
  apron.addColorStop(1, mix("#24160f", "#4a2e1c", life * 0.45));
  ctx.fillStyle = apron;
  ctx.fillRect(0, benchNear, width, height - benchNear);
  const pool = ctx.createRadialGradient(width * 0.5, benchNear + 24, 8, width * 0.5, benchNear + 36, width * 0.3);
  pool.addColorStop(0, `rgba(255, 196, 120, ${0.07 + life * 0.24})`);
  pool.addColorStop(1, "rgba(255, 196, 120, 0)");
  ctx.fillStyle = pool;
  ctx.fillRect(0, benchNear, width, height - benchNear);
  ctx.strokeStyle = "rgba(236, 206, 160, 0.28)";
  ctx.beginPath();
  ctx.moveTo(0, benchFar);
  ctx.lineTo(width, benchFar);
  ctx.stroke();

  ctx.strokeStyle = "rgba(70, 48, 32, 0.7)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(hits.flame.x - 30, hits.flame.y + 6);
  ctx.quadraticCurveTo(hits.rinse.x, benchFar + 8, hits.rinse.x - 10, benchNear - 4);
  ctx.stroke();

  const gap = hits.beaker.x - hits.copper.x;
  if (gap > 120) {
    const flaskX = hits.copper.x + gap * 0.52;
    ctx.strokeStyle = "rgba(236, 224, 206, 0.45)";
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(flaskX, benchFar - 36);
    ctx.lineTo(flaskX, benchFar - 18);
    ctx.bezierCurveTo(flaskX - 16, benchFar - 8, flaskX - 16, benchFar - 4, flaskX, benchFar);
    ctx.bezierCurveTo(flaskX + 16, benchFar - 4, flaskX + 16, benchFar - 8, flaskX, benchFar - 18);
    ctx.stroke();
    ctx.fillStyle = "rgba(196, 122, 70, 0.35)";
    ctx.beginPath();
    ctx.ellipse(flaskX, benchFar - 8, 10, 7, 0, 0, Math.PI);
    ctx.fill();
  }

  if (hits.hydroxide.x + 130 < width * 0.8) {
    const rackX = hits.hydroxide.x + 78;
    ctx.fillStyle = "#6b4428";
    roundRect(ctx, rackX, benchFar - 10, 62, 10, 2);
    ctx.fill();
    for (let index = 0; index < 4; index += 1) {
      const tubeX = rackX + 10 + index * 14;
      const tubeH = 34 + (index % 2) * 12;
      const level = 0.35 + ((Math.sin(time * 1.4 + index) + 1) * 0.5) * 0.4;
      ctx.strokeStyle = "rgba(236, 228, 214, 0.7)";
      ctx.lineWidth = 1.2;
      roundRect(ctx, tubeX, benchFar - 10 - tubeH, 8, tubeH, 3);
      ctx.stroke();
      ctx.fillStyle = index % 2 === 0 ? "rgba(36, 96, 168, 0.55)" : "rgba(210, 150, 80, 0.4)";
      ctx.fillRect(tubeX + 1.5, benchFar - 10 - tubeH * level, 5, tubeH * level - 1);
    }
  }

  const bx = hits.beaker.x;
  const top = Math.max(height * 0.3, hits.beaker.y - Math.min(height * 0.16, 108));
  const bottom = Math.max(top + 80, hits.flame.y - 62);
  const halfTop = Math.min(width * 0.078, 74);
  const halfBot = halfTop * 0.78;

  ctx.strokeStyle = "rgba(90, 64, 40, 0.85)";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(bx - halfTop - 8, bottom + 2);
  ctx.lineTo(bx - halfTop - 24, hits.flame.y + 10);
  ctx.moveTo(bx + halfTop + 4, bottom + 2);
  ctx.lineTo(bx + halfTop + 22, hits.flame.y + 10);
  ctx.moveTo(bx, bottom + 4);
  ctx.lineTo(bx, hits.flame.y + 8);
  ctx.stroke();
  ctx.strokeStyle = "rgba(176, 140, 90, 0.7)";
  ctx.beginPath();
  ctx.ellipse(bx, bottom + 2, halfTop * 0.7, 4, 0, 0, Math.PI * 2);
  ctx.stroke();

  drawBurner(ctx, hits.flame.x, hits.flame.y, time, sim.heating);
  drawWorkingBeaker(ctx, bx, top, bottom, halfTop, halfBot, sim.beaker, time, sim.heating);
  drawReagentBottle(ctx, hits.copper.x, hits.copper.y, "CuSO4", "rgba(28, 86, 168, 0.9)", time);
  drawReagentBottle(ctx, hits.hydroxide.x, hits.hydroxide.y, "NaOH", "rgba(236, 242, 244, 0.55)", time);
  drawWashBottle(ctx, hits.rinse.x, hits.rinse.y, time);

  const tone: MoleculeTone =
    sim.beaker.cuo > 0.0003 && sim.beaker.cuo >= sim.beaker.cuoh2 ? "oxide" : sim.beaker.cuoh2 > 0.0002 ? "gel" : sim.beaker.cu2 > 0.0002 ? "copper" : "water";
  const clusters = 4 + Math.round(life * 3) + (tone === "water" ? 0 : 2);
  const spin = tone === "water" ? 0.35 : sim.heating ? 1.5 : 0.9;
  for (let index = 0; index < clusters; index += 1) {
    const angle = time * spin * (0.7 + index * 0.04) + index * 1.3;
    const orbit = 34 + index * 12;
    const mx = bx + Math.cos(angle) * orbit;
    const my = top - 6 + Math.sin(angle) * orbit * 0.38;
    if (my < height * 0.22) continue;
    molecule(ctx, mx, my, 11 + (index % 3) * 2, time * (sim.heating ? 1.8 : 1), index, tone);
  }

  const motes = 14 + Math.round(life * 22);
  const shaftTop = win.y + win.h;
  for (let index = 0; index < motes; index += 1) {
    const y = shaftTop + ((hash(index + 6) * (benchNear - shaftTop) + time * (8 + hash(index) * 14)) % (benchNear - shaftTop));
    const along = (y - shaftTop) / Math.max(1, benchNear - shaftTop);
    const left = win.x + 10 + (hits.beaker.x - width * 0.06 - win.x) * along;
    const right = win.x + win.w + (hits.beaker.x + width * 0.16 - win.x - win.w) * along;
    const x = left + hash(index + 11) * Math.max(8, right - left);
    ctx.globalAlpha = 0.12 + life * 0.22;
    ctx.fillStyle = "#fff1d4";
    ctx.beginPath();
    ctx.arc(x, y, hash(index + 2) > 0.7 ? 1.7 : 1, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  for (const spot of frame.spots) marker(ctx, spot.x, spot.y, spot.open, "rgba(232, 186, 120, 0.95)", time);
}

function projectCube(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, time: number, alpha: number) {
  ctx.save();
  const yaw = time * 0.35;
  const pitch = 0.45 + Math.sin(time * 0.22) * 0.08;
  const corners = [-1, 1].flatMap((x) => [-1, 1].flatMap((y) => [-1, 1].map((z) => ({ x, y, z }))));
  const projected = corners.map((corner) => {
    const x1 = corner.x * Math.cos(yaw) - corner.z * Math.sin(yaw);
    const z1 = corner.x * Math.sin(yaw) + corner.z * Math.cos(yaw);
    const y2 = corner.y * Math.cos(pitch) - z1 * Math.sin(pitch);
    const z2 = corner.y * Math.sin(pitch) + z1 * Math.cos(pitch);
    return { x: cx + x1 * size, y: cy + y2 * size, z: z2 };
  });
  const faces = [
    [0, 1, 3, 2],
    [4, 6, 7, 5],
    [0, 4, 5, 1],
    [2, 3, 7, 6],
    [0, 2, 6, 4],
    [1, 5, 7, 3],
  ];
  const shades = ["#e6c48a", "#c47a4a", "#8d5a3c", "#f3e2c4", "#6e8c9a", "#a86848"];
  const ordered = faces
    .map((face, index) => ({
      face,
      shade: shades[index] ?? "#e6c48a",
      depth: face.reduce((sum, corner) => sum + (projected[corner]?.z ?? 0), 0) / face.length,
    }))
    .sort((a, b) => a.depth - b.depth);
  ordered.forEach(({ face, shade }) => {
    ctx.beginPath();
    face.forEach((corner, index) => {
      const point = projected[corner];
      if (!point) return;
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.closePath();
    ctx.globalAlpha = alpha * 0.78;
    ctx.fillStyle = shade;
    ctx.fill();
    ctx.globalAlpha = Math.min(1, alpha + 0.15);
    ctx.strokeStyle = "rgba(255, 244, 226, 0.8)";
    ctx.lineWidth = 1.15;
    ctx.stroke();
  });
  ctx.restore();
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

function drawBranch(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, level: number, depth: number, time: number) {
  if (level > depth || radius < 7) return;
  ctx.strokeStyle = `rgba(228, 206, 160, ${0.2 + level * 0.12})`;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(x, y, radius * (1 + Math.sin(time * 0.8 + level) * 0.035), time * 0.15, time * 0.15 + Math.PI * 1.65);
  ctx.stroke();
  drawBranch(ctx, x - radius * 0.58, y - radius * 0.12, radius * 0.52, level + 1, depth, time);
  drawBranch(ctx, x + radius * 0.58, y + radius * 0.1, radius * 0.52, level + 1, depth, time);
}

function drawSpiral(ctx: CanvasRenderingContext2D, x: number, y: number, time: number, life: number) {
  ctx.beginPath();
  const turns = 2.4 + life * 1.6;
  const reach = 26 + life * 20;
  for (let step = 0; step <= 90; step += 1) {
    const t = step / 90;
    const angle = t * turns * Math.PI * 2 + time * 0.22;
    const radius = t * reach;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius * 0.72;
    if (step === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.strokeStyle = `rgba(244, 214, 160, ${0.35 + life * 0.4})`;
  ctx.lineWidth = 1.4;
  ctx.stroke();
}

function drawCompass(ctx: CanvasRenderingContext2D, x: number, y: number, time: number, alpha: number) {
  const open = 0.45 + Math.sin(time * 0.9) * 0.38;
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = `rgba(216, 170, 96, ${alpha})`;
  ctx.lineWidth = 1.7;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(Math.sin(-0.35) * 34, Math.cos(-0.35) * 34);
  ctx.moveTo(0, 0);
  ctx.lineTo(Math.sin(open) * 34, Math.cos(open) * 34);
  ctx.stroke();
  ctx.fillStyle = `rgba(244, 220, 170, ${alpha})`;
  ctx.beginPath();
  ctx.arc(0, 0, 3.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawTwinkle(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  ctx.beginPath();
  ctx.moveTo(x, y - radius);
  ctx.lineTo(x + radius * 0.28, y - radius * 0.28);
  ctx.lineTo(x + radius, y);
  ctx.lineTo(x + radius * 0.28, y + radius * 0.28);
  ctx.lineTo(x, y + radius);
  ctx.lineTo(x - radius * 0.28, y + radius * 0.28);
  ctx.lineTo(x - radius, y);
  ctx.lineTo(x - radius * 0.28, y - radius * 0.28);
  ctx.closePath();
  ctx.fill();
}

/** A cartoon who walks, blinks, waves, and gives a fond wide-eyed look. */
function drawChibi(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  live: number,
  attention: number,
  facing: number,
) {
  const blinkWindow = live % 2.6;
  const blink = blinkWindow > 2.35 ? Math.sin(((blinkWindow - 2.35) / 0.25) * Math.PI) : 0;
  const open = Math.max(0.1, 1 - blink);
  const hop = Math.abs(Math.sin(live * (attention > 0.5 ? 8 : 6)));
  const walk = attention > 0.4 ? 0 : Math.sin(live * 8);
  const pupilX = (1 - attention) * 2.4 + attention * Math.sin(live * 1.6) * 1.8;
  const pupilY = Math.sin(live * 0.9) * 0.8;
  const wave = attention > 0.45 ? Math.sin(live * 8) * 8 : 0;

  ctx.save();
  ctx.translate(x, y + (1 - hop) * 4);
  ctx.rotate(walk * 0.05 + attention * Math.sin(live * 1.5) * 0.06);
  ctx.scale(scale * (facing < 0 ? -1 : 1) * (1 + hop * 0.04), scale * (1 - hop * 0.05));

  ctx.fillStyle = "rgba(10, 12, 28, 0.28)";
  ctx.beginPath();
  ctx.ellipse(0, 64 - hop * 3, 26, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#2c2444";
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-8, 36);
  ctx.lineTo(-8 - walk * 8, 56);
  ctx.moveTo(8, 36);
  ctx.lineTo(8 + walk * 8, 56);
  ctx.stroke();
  ctx.fillStyle = "#f2c14e";
  ctx.strokeStyle = "#2c2444";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(-8 - walk * 8, 58, 8, 3.6, 0, 0, Math.PI * 2);
  ctx.ellipse(8 + walk * 8, 58, 8, 3.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = "#ffd0b0";
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-16, 16);
  ctx.quadraticCurveTo(-26, 28, -22 - walk * 8, 36);
  ctx.moveTo(16, 14);
  ctx.quadraticCurveTo(30, 4 - attention * 18, 26 + wave, -2 - attention * 22);
  ctx.stroke();

  ctx.fillStyle = "#4457a0";
  ctx.strokeStyle = "#241c38";
  ctx.lineWidth = 2.5;
  roundRect(ctx, -18, 6, 36, 34, 14);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#f6efe4";
  ctx.beginPath();
  ctx.moveTo(-7, 8);
  ctx.lineTo(0, 20);
  ctx.lineTo(7, 8);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#f2c14e";
  ctx.beginPath();
  ctx.arc(0, 24, 1.8, 0, Math.PI * 2);
  ctx.arc(0, 30, 1.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#3a2c2a";
  ctx.beginPath();
  ctx.arc(0, -18, 32, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffd8be";
  ctx.strokeStyle = "#2a211c";
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.arc(0, -12, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#3a2c2a";
  ctx.beginPath();
  ctx.ellipse(-22, -8, 6, 14, 0.4, 0, Math.PI * 2);
  ctx.ellipse(22, -8, 6, 14, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, -20, 24, Math.PI * 1.12, Math.PI * 1.88);
  ctx.quadraticCurveTo(0, -16, -22, -22);
  ctx.fill();
  ctx.fillStyle = "#f2c14e";
  ctx.beginPath();
  ctx.arc(16, -30, 3.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255, 122, 138, 0.7)";
  ctx.beginPath();
  ctx.ellipse(-13, -6, 5, 2.8, -0.2, 0, Math.PI * 2);
  ctx.ellipse(13, -6, 5, 2.8, 0.2, 0, Math.PI * 2);
  ctx.fill();

  const eyeWide = open * (1 + attention * 0.42);
  const drawEye = (ex: number) => {
    ctx.save();
    ctx.translate(ex, -18);
    ctx.scale(1, Math.max(0.12, eyeWide));
    ctx.fillStyle = "#fffdf8";
    ctx.strokeStyle = "#2a211c";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 10.5, 12.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = attention > 0.45 ? "#6a4db8" : "#3f6fba";
    ctx.beginPath();
    ctx.arc(pupilX, pupilY + 1.5, 6.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#24182e";
    ctx.beginPath();
    ctx.arc(pupilX, pupilY + 2, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(pupilX - 2.4, pupilY - 1.2, 2.2, 0, Math.PI * 2);
    ctx.arc(pupilX + 1.8, pupilY + 2.4, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };
  drawEye(-10);
  drawEye(10);

  ctx.strokeStyle = "#3a2c2a";
  ctx.lineWidth = 2.2;
  ctx.lineCap = "round";
  const lift = 2 + attention * 6;
  ctx.beginPath();
  ctx.moveTo(-18, -32);
  ctx.quadraticCurveTo(-10, -34 - lift, -4, -31);
  ctx.moveTo(18, -32);
  ctx.quadraticCurveTo(10, -35 - lift * 0.55, 4, -30);
  ctx.stroke();

  ctx.strokeStyle = "#d15b6e";
  ctx.lineWidth = 2.3;
  ctx.beginPath();
  ctx.moveTo(-8, -2);
  ctx.quadraticCurveTo(0, 3 + attention * 5, 9, -2);
  ctx.stroke();

  if (attention > 0.35) {
    ctx.fillStyle = `rgba(255, 228, 150, ${0.45 + attention * 0.45})`;
    for (let index = 0; index < 4; index += 1) {
      const angle = live * 2.2 + index * 1.6;
      drawTwinkle(ctx, Math.cos(angle) * (40 + index * 4), -16 + Math.sin(angle) * 22, 4 + (index % 2));
    }
  }
  ctx.restore();
}

let gazeMix = 0;
let gazeSeen = 0;

function drawMath(ctx: CanvasRenderingContext2D, frame: SceneFrame) {
  sky(ctx, frame, "#10142c", "#1c1844", "#2a1838", "#f0c56e");
  const { width, height, life, warmth, time, live, sim } = frame;
  const step = Math.min(0.05, Math.max(0, live - gazeSeen));
  gazeSeen = live;
  gazeMix += ((frame.freeze ? 1 : 0) - gazeMix) * Math.min(1, step * 2.2);
  const quiet = 1 - gazeMix * 0.62;

  const lamp = ctx.createRadialGradient(width * 0.5, height * 0.36, 10, width * 0.5, height * 0.4, 320 + life * 50);
  lamp.addColorStop(0, `rgba(150, 176, 255, ${0.1 + warmth * 0.16 + life * 0.1})`);
  lamp.addColorStop(0.5, `rgba(242, 193, 78, ${0.05 + life * 0.06})`);
  lamp.addColorStop(1, "rgba(242, 193, 78, 0)");
  ctx.fillStyle = lamp;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.translate(width * 0.5, height * 0.4);
  ctx.rotate(time * 0.04);
  ctx.strokeStyle = `rgba(242, 193, 78, ${0.08 + life * 0.1})`;
  ctx.lineWidth = 1.2;
  for (let index = 0; index < 10; index += 1) {
    ctx.rotate(Math.PI / 5);
    ctx.beginPath();
    ctx.arc(90 + life * 16, 0, 64 + life * 12, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  for (let index = 0; index < 10 + Math.round(life * 8); index += 1) {
    const px = (hash(index + 3) * width + time * (14 + index * 2)) % width;
    const py = hash(index + 8) * height * 0.78;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(time * 0.5 + index);
    ctx.strokeStyle = index % 2 === 0 ? "rgba(242, 193, 78, 0.55)" : "rgba(156, 190, 255, 0.55)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(7, 6);
    ctx.lineTo(-7, 6);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  const boardX = width * 0.14;
  const boardY = height * 0.16;
  const boardW = width * 0.72;
  const boardH = height * 0.6;
  ctx.fillStyle = "rgba(16, 20, 48, 0.78)";
  roundRect(ctx, boardX, boardY, boardW, boardH, 18);
  ctx.fill();
  ctx.strokeStyle = `rgba(242, 193, 78, ${0.35 + life * 0.4})`;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.save();
  roundRect(ctx, boardX, boardY, boardW, boardH, 18);
  ctx.clip();
  ctx.globalAlpha = quiet;
  const gap = 42;
  const drift = (time * 10) % gap;
  ctx.strokeStyle = `rgba(170, 196, 255, ${0.06 + life * 0.06})`;
  ctx.lineWidth = 1;
  for (let x = boardX - gap + drift; x < boardX + boardW; x += gap) {
    ctx.beginPath();
    ctx.moveTo(x, boardY);
    ctx.lineTo(x, boardY + boardH);
    ctx.stroke();
  }
  for (let y = boardY; y < boardY + boardH; y += gap) {
    ctx.beginPath();
    ctx.moveTo(boardX, y);
    ctx.lineTo(boardX + boardW, y);
    ctx.stroke();
  }

  drawSpiral(ctx, width * 0.3, height * 0.3, time, life);
  const depth = 2 + Math.floor((time * 0.15) % 4);
  drawBranch(ctx, width * 0.36, height * 0.26, 28 + life * 10, 0, depth, time);
  projectCube(ctx, width * 0.52, height * 0.36, 46 + life * 14, time, (0.55 + life * 0.35) * quiet);

  ctx.save();
  ctx.translate(width * 0.52, height * 0.36);
  ctx.rotate(time * 0.2);
  ctx.strokeStyle = `rgba(244, 220, 180, ${(0.25 + life * 0.3) * quiet})`;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let index = 0; index <= 5; index += 1) {
    const angle = (index / 5) * Math.PI * 2;
    const radius = 70 + life * 16 + Math.sin(time * 1.3 + index) * 4;
    const px = Math.cos(angle) * radius;
    const py = Math.sin(angle) * radius * 0.62;
    if (index === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.restore();

  for (let index = 0; index < 3 + Math.round(life * 3); index += 1) {
    const angle = time * (0.3 + index * 0.05) + index;
    const radius = 50 + index * 16;
    ctx.fillStyle = `rgba(244, 214, 160, ${0.35 + life * 0.3})`;
    ctx.beginPath();
    ctx.arc(width * 0.52 + Math.cos(angle) * radius, height * 0.36 + Math.sin(angle) * radius * 0.4, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  const band = graphBand(width, height);
  const mid = (band.top + band.bottom) / 2;
  ctx.strokeStyle = `rgba(244, 228, 200, ${0.22 * quiet})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(band.left, mid);
  ctx.lineTo(band.right, mid);
  ctx.moveTo(band.left, band.top);
  ctx.lineTo(band.left, band.bottom);
  ctx.stroke();
  ctx.beginPath();
  ctx.strokeStyle = `rgba(126, 168, 255, ${0.35 * Math.max(quiet, 0.5)})`;
  ctx.lineWidth = 6;
  for (let x = band.left; x <= band.right; x += 3) {
    const local = (x - band.left) / (band.right - band.left);
    const y = mid - Math.sin(local * Math.PI * 2 * sim.freq + time * 0.8) * sim.amp * 36;
    if (x === band.left) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.beginPath();
  ctx.strokeStyle = `rgba(255, 226, 150, ${0.95 * Math.max(quiet, 0.55)})`;
  ctx.lineWidth = 2.2;
  let beadX = band.left;
  let beadY = mid;
  let beadGap = 1;
  const beadAt = (time * 0.12) % 1;
  for (let x = band.left; x <= band.right; x += 3) {
    const local = (x - band.left) / (band.right - band.left);
    const y = mid - Math.sin(local * Math.PI * 2 * sim.freq + time * 0.8) * sim.amp * 36;
    if (x === band.left) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
    const gap = Math.abs(local - beadAt);
    if (gap < beadGap) {
      beadGap = gap;
      beadX = x;
      beadY = y;
    }
  }
  ctx.stroke();
  if (life > 0.2) {
    ctx.beginPath();
    ctx.strokeStyle = `rgba(196, 154, 110, ${0.35 * quiet})`;
    ctx.lineWidth = 1.1;
    for (let x = band.left; x <= band.right; x += 4) {
      const local = (x - band.left) / (band.right - band.left);
      const y = mid - Math.sin(local * Math.PI * 2 * sim.freq * 2 + time) * sim.amp * 14;
      if (x === band.left) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.fillStyle = "#f4e2c4";
  ctx.beginPath();
  ctx.arc(beadX, beadY, 3.4, 0, Math.PI * 2);
  ctx.fill();

  drawCompass(ctx, boardX + 34, boardY + boardH - 40, time, 0.7 * quiet);
  ctx.restore();

  if (gazeMix > 0.04) {
    ctx.fillStyle = `rgba(20, 14, 10, ${gazeMix * 0.16})`;
    ctx.fillRect(0, 0, width, height);
  }
  const peek = Math.max(0, Math.sin(live * 0.33) - 0.86) / 0.14;
  const attention = Math.max(gazeMix, peek * (1 - gazeMix));
  if (!frame.focus || frame.freeze) {
    const cycle = (live * 0.22) % 2;
    const going = cycle < 1;
    const along = going ? cycle : 2 - cycle;
    const idleX = width * (0.34 + along * 0.3);
    const idleY = height * 0.4;
    const gazeX = idleX + (width * 0.5 - idleX) * gazeMix;
    const gazeY = idleY + (height * 0.32 - idleY) * gazeMix;
    const scale = (Math.min(width, height) / 780) * (0.95 + gazeMix * 0.55);
    const facing = gazeMix > 0.25 ? 1 : going ? 1 : -1;
    drawChibi(ctx, gazeX, gazeY, scale, live, attention, facing);
  }
  for (const spot of frame.spots) marker(ctx, spot.x, spot.y, spot.open, "rgba(186, 206, 255, 0.95)", time);
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
