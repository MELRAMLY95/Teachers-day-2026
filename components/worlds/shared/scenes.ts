import type { Beaker } from "@/lib/chemistry/simulation";
import {
  chemistryHits,
  englishWords,
  graphBand,
  manuscript,
  planetPoint,
  springAnchor,
  springPeriod,
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
  pour: number,
) {
  const fill = Math.min(0.84, 0.36 + Math.max(0, beaker.volumeMl - 15) / 68);
  const inner = bottom - top - 18;
  const surface = bottom - 8 - inner * fill + Math.sin(time * 2.2) * (1.4 + pour * 2.4);
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

  const spanX = halfBot * 0.62;
  const column = Math.max(10, bottom - surface - 14);
  const ion = (count: number, color: string, radius: number, seed: number, rise: number) => {
    for (let index = 0; index < count; index += 1) {
      const sway = Math.sin(time * (heating ? 4.4 : 1.5) + index + seed) * (heating ? 5.5 : 2);
      const px = x - spanX + hash(index + seed) * spanX * 2 + sway;
      const travel = (time * rise + hash(index + seed + 5)) % 1;
      const py = bottom - 10 - travel * column;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  };
  if (copper) ion(Math.min(16, 5 + Math.round(beaker.cu2 * 2000)), "rgba(64, 148, 220, 0.92)", 2.15, 21, heating ? 0.55 : 0.22);
  if (hydroxide) ion(Math.min(16, 5 + Math.round(beaker.oh * 1400)), "rgba(244, 250, 252, 0.8)", 1.55, 44, 0.28);
  if (gel && !oxide) {
    const flakes = Math.min(18, 5 + Math.round(beaker.cuoh2 * 2400));
    for (let index = 0; index < flakes; index += 1) {
      const travel = (time * 0.12 + hash(index + 8)) % 1;
      const px = x - spanX + hash(index + 15) * spanX * 2;
      const py = surface + 6 + travel * column;
      ctx.fillStyle = "rgba(198, 230, 238, 0.82)";
      ctx.fillRect(px, py, 3.4, 2.1);
    }
  }
  if (heating) {
    ctx.strokeStyle = "rgba(255, 214, 160, 0.28)";
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.ellipse(x + Math.sin(time * 3) * 5, (surface + bottom) / 2, halfBot * 0.36, 9, time * 1.4, 0, Math.PI * 1.65);
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
  drawWorkingBeaker(ctx, bx, top, bottom, halfTop, halfBot, sim.beaker, time, sim.heating, sim.pour);
  if (sim.pour > 0.04 && sim.pourSide !== 0) {
    const from = sim.pourSide < 0 ? hits.copper : hits.hydroxide;
    const mouthX = from.x;
    const mouthY = from.y - 38;
    const bendX = (mouthX + bx) / 2;
    const bendY = Math.min(mouthY, top) - 16;
    const tipX = bx;
    const tipY = top + 8;
    const curve = (t: number) => {
      const u = 1 - t;
      return {
        x: u * u * mouthX + 2 * u * t * bendX + t * t * tipX,
        y: u * u * mouthY + 2 * u * t * bendY + t * t * tipY,
      };
    };
    ctx.save();
    ctx.globalAlpha = Math.min(1, sim.pour + 0.15);
    ctx.strokeStyle = sim.pourSide < 0 ? "rgba(32, 96, 186, 0.9)" : "rgba(236, 244, 246, 0.82)";
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(mouthX, mouthY);
    ctx.quadraticCurveTo(bendX, bendY, tipX, tipY);
    ctx.stroke();
    for (let index = 0; index < 5; index += 1) {
      const drop = curve((index / 5 + (1 - sim.pour) * 0.8) % 1);
      ctx.fillStyle = sim.pourSide < 0 ? "rgba(48, 120, 200, 0.95)" : "rgba(244, 250, 252, 0.9)";
      ctx.beginPath();
      ctx.arc(drop.x, drop.y, 2.1, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
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

  const haze = sim.heating ? 5 : 3;
  for (let index = 0; index < haze; index += 1) {
    const phase = (time * 0.18 + index * 0.31) % 1;
    const rise = benchFar - 18 - phase * (sim.heating ? 90 : 46);
    const sway = Math.sin(time * 0.9 + index * 1.7) * 16;
    ctx.globalAlpha = (1 - phase) * (sim.heating ? 0.28 : 0.12);
    ctx.strokeStyle = "rgba(255, 236, 214, 0.85)";
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.ellipse(bx + sway + (index - 1) * 22, rise, 10 + phase * 16, 4 + phase * 6, sway * 0.01, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (tone === "gel" || tone === "oxide") {
    const react = ctx.createRadialGradient(bx, (top + bottom) / 2, 8, bx, bottom, halfTop * 2.4);
    react.addColorStop(0, tone === "oxide" ? "rgba(80, 40, 28, 0.16)" : "rgba(170, 214, 226, 0.16)");
    react.addColorStop(1, "rgba(255, 196, 120, 0)");
    ctx.globalAlpha = 0.7 + Math.sin(time * 2.2) * 0.2;
    ctx.fillStyle = react;
    ctx.beginPath();
    ctx.ellipse(bx, bottom - 10, halfTop * 1.6, 28, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  for (const spot of frame.spots) marker(ctx, spot.x, spot.y, spot.open, "rgba(232, 186, 120, 0.95)", time);
}

function projectCube(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, time: number, alpha: number) {
  ctx.save();
  const yaw = time * 0.9;
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
  sky(ctx, frame, "#070814", "#10182e", "#1a140e", "#e0b56a");
  const { width, height, life, warmth, time, sim } = frame;
  ctx.save();

  const milky = ctx.createLinearGradient(0, height * 0.08, width, height * 0.42);
  milky.addColorStop(0, "rgba(120, 140, 190, 0)");
  milky.addColorStop(0.45, `rgba(186, 198, 230, ${0.05 + life * 0.06})`);
  milky.addColorStop(1, "rgba(120, 140, 190, 0)");
  ctx.fillStyle = milky;
  ctx.beginPath();
  ctx.ellipse(width * 0.5, height * 0.22, width * 0.46, height * 0.1, -0.18, 0, Math.PI * 2);
  ctx.fill();

  for (let index = 0; index < 90; index += 1) {
    const twinkle = 0.25 + Math.abs(Math.sin(time * (0.6 + hash(index) * 1.4) + index)) * 0.75;
    const x = hash(index + 1) * width;
    const y = hash(index + 3) * height * 0.7;
    ctx.globalAlpha = (0.2 + hash(index + 5) * 0.7) * twinkle * (0.55 + life * 0.45);
    ctx.fillStyle = hash(index + 7) > 0.82 ? "#f6d7a2" : "#f4f7ff";
    ctx.fillRect(x, y, hash(index) > 0.9 ? 2.1 : 1.2, hash(index) > 0.9 ? 2.1 : 1.2);
  }
  ctx.globalAlpha = 1;

  ctx.strokeStyle = `rgba(214, 196, 170, ${0.16 + life * 0.16})`;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(width * 0.5, height * 1.05, Math.max(width, height) * 0.92, Math.PI * 1.12, Math.PI * 1.88);
  ctx.stroke();
  for (let rib = 0; rib < 5; rib += 1) {
    ctx.globalAlpha = 0.18 + life * 0.1;
    ctx.beginPath();
    ctx.arc(width * (0.2 + rib * 0.15), height * 1.02, height * 0.72, Math.PI * 1.2, Math.PI * 1.8);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  const floor = ctx.createLinearGradient(0, height * 0.74, 0, height);
  floor.addColorStop(0, mix("#141018", "#3a2a1c", life * 0.45));
  floor.addColorStop(1, mix("#0c0a10", "#2a1c14", warmth * 0.4));
  ctx.fillStyle = floor;
  ctx.fillRect(0, height * 0.74, width, height * 0.26);
  ctx.strokeStyle = "rgba(232, 210, 176, 0.28)";
  ctx.beginPath();
  ctx.moveTo(0, height * 0.74);
  ctx.lineTo(width, height * 0.74);
  ctx.stroke();
  const pool = ctx.createRadialGradient(width * 0.5, height * 0.78, 8, width * 0.5, height * 0.86, width * 0.28);
  pool.addColorStop(0, `rgba(255, 196, 120, ${0.05 + life * 0.16})`);
  pool.addColorStop(1, "rgba(255, 196, 120, 0)");
  ctx.fillStyle = pool;
  ctx.fillRect(0, height * 0.74, width, height * 0.26);

  const starX = width * 0.7;
  const starY = height * 0.22;
  const corona = ctx.createRadialGradient(starX, starY, 2, starX, starY, 90 + life * 50);
  corona.addColorStop(0, `rgba(255, 244, 220, ${0.95})`);
  corona.addColorStop(0.18, `rgba(255, 196, 120, ${0.45 + warmth * 0.3})`);
  corona.addColorStop(1, "rgba(255, 180, 90, 0)");
  ctx.fillStyle = corona;
  ctx.beginPath();
  ctx.arc(starX, starY, 96 + life * 40, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.translate(starX, starY);
  ctx.rotate(time * 0.08);
  ctx.strokeStyle = `rgba(255, 232, 196, ${0.28 + life * 0.25})`;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-70, 0);
  ctx.lineTo(70, 0);
  ctx.moveTo(0, -46);
  ctx.lineTo(0, 46);
  ctx.stroke();
  ctx.restore();
  const starBody = ctx.createRadialGradient(starX - 2, starY - 2, 1, starX, starY, 11);
  starBody.addColorStop(0, "#fffaf0");
  starBody.addColorStop(1, "#f0c27a");
  ctx.fillStyle = starBody;
  ctx.beginPath();
  ctx.arc(starX, starY, 8 + life * 2, 0, Math.PI * 2);
  ctx.fill();

  const placed = planetPoint(sim.orbit, width, height);
  const visual = placed.visual;
  ctx.strokeStyle = `rgba(214, 206, 186, ${0.28 + life * 0.25})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(starX, starY, 118 * visual, 52 * visual, -0.35, 0, Math.PI * 2);
  ctx.stroke();
  if (sim.orbitTrail.length > 1) {
    ctx.beginPath();
    sim.orbitTrail.forEach((point, index) => {
      const px = starX + point.x * visual;
      const py = starY + point.y * visual * 0.45;
      if (index === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.strokeStyle = `rgba(186, 214, 255, ${0.35 + life * 0.35})`;
    ctx.lineWidth = 1.35;
    ctx.stroke();
  }
  const planetX = placed.x;
  const planetY = placed.y;
  const planetGlow = ctx.createRadialGradient(planetX, planetY, 1, planetX, planetY, 16);
  planetGlow.addColorStop(0, "rgba(186, 214, 255, 0.9)");
  planetGlow.addColorStop(1, "rgba(186, 214, 255, 0)");
  ctx.fillStyle = planetGlow;
  ctx.beginPath();
  ctx.arc(planetX, planetY, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#d5e4ff";
  ctx.beginPath();
  ctx.arc(planetX, planetY, 4.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.translate(planetX, planetY);
  ctx.rotate(time * 0.7);
  ctx.strokeStyle = `rgba(186, 214, 255, ${0.28 + life * 0.28})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(0, 0, 15, 4.6, 0.4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  const ray = (time * 0.12) % 1;
  ctx.strokeStyle = `rgba(255, 228, 186, ${0.08 + life * 0.1})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(starX, starY);
  ctx.lineTo(starX - 40 - ray * 90, starY - 18 - Math.sin(time * 0.5) * 16);
  ctx.stroke();
  ctx.fillStyle = `rgba(255, 244, 220, ${0.35 + life * 0.3})`;
  ctx.beginPath();
  ctx.arc(starX - 40 - ray * 90, starY - 18 - Math.sin(time * 0.5) * 16, 1.6, 0, Math.PI * 2);
  ctx.fill();

  const pivotX = width * 0.3;
  const pivotY = height * 0.16;
  const length = Math.min(height * 0.22, 150) + life * 8;
  const swing = Math.sin(time * (2 / springPeriod(sim.mass))) * 0.62;
  const bobX = pivotX + Math.sin(swing) * length;
  const bobY = pivotY + Math.cos(swing) * length;
  ctx.strokeStyle = "rgba(90, 70, 48, 0.85)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(pivotX - 36, pivotY);
  ctx.lineTo(pivotX + 28, pivotY);
  ctx.moveTo(pivotX - 28, pivotY);
  ctx.lineTo(pivotX - 28, pivotY + 18);
  ctx.stroke();
  ctx.strokeStyle = `rgba(232, 214, 180, ${0.18 + life * 0.2})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(pivotX, pivotY, length, Math.PI / 2 - 0.7, Math.PI / 2 + 0.7);
  ctx.stroke();
  ctx.strokeStyle = "rgba(236, 224, 200, 0.85)";
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(pivotX, pivotY);
  ctx.lineTo(bobX, bobY);
  ctx.stroke();
  ctx.fillStyle = "#8a6840";
  ctx.beginPath();
  ctx.arc(pivotX, pivotY, 3.5, 0, Math.PI * 2);
  ctx.fill();
  const bob = ctx.createRadialGradient(bobX - 3, bobY - 3, 1, bobX, bobY, 12);
  bob.addColorStop(0, "#f4e2c0");
  bob.addColorStop(1, "#a87848");
  ctx.fillStyle = bob;
  ctx.beginPath();
  ctx.arc(bobX, bobY, 9 + life * 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 236, 210, 0.7)";
  ctx.lineWidth = 1;
  ctx.stroke();

  const anchor = springAnchor(width, height);
  const top = anchor.y - 36;
  const endY = anchor.y + sim.spring;
  ctx.fillStyle = "#6a5038";
  roundRect(ctx, anchor.x - 16, top - 8, 32, 8, 2);
  ctx.fill();
  ctx.strokeStyle = sim.mass > 1.4 ? "rgba(232, 196, 140, 0.95)" : "rgba(214, 206, 190, 0.9)";
  ctx.lineWidth = 1.7;
  ctx.beginPath();
  ctx.moveTo(anchor.x, top);
  const turns = 12;
  const span = Math.max(24, endY - top);
  for (let step = 0; step <= turns * 10; step += 1) {
    const t = step / (turns * 10);
    const y = top + t * span;
    const x = anchor.x + Math.sin(t * turns * Math.PI * 2) * 12;
    ctx.lineTo(x, y);
  }
  ctx.stroke();
  const weight = 14 + sim.mass * 4;
  ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
  ctx.beginPath();
  ctx.ellipse(anchor.x + 4, endY + weight + 4, weight * 0.7, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  const metal = ctx.createLinearGradient(anchor.x - weight, endY, anchor.x + weight, endY);
  metal.addColorStop(0, sim.mass > 1.4 ? "#8a6230" : "#c8b49a");
  metal.addColorStop(0.45, sim.mass > 1.4 ? "#e6c48a" : "#f7f1e6");
  metal.addColorStop(1, sim.mass > 1.4 ? "#6a4828" : "#a89880");
  ctx.fillStyle = metal;
  roundRect(ctx, anchor.x - weight * 0.55, endY, weight * 1.1, weight, 4);
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 244, 226, 0.45)";
  ctx.stroke();

  const switchX = anchor.x + 78;
  const switchY = anchor.y + 10;
  ctx.fillStyle = sim.mass > 1.4 ? "#c4a36a" : "rgba(244, 228, 200, 0.16)";
  ctx.strokeStyle = "rgba(244, 228, 200, 0.7)";
  ctx.lineWidth = 1.3;
  roundRect(ctx, switchX - 16, switchY - 14, 32, 28, 4);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "rgba(244, 228, 200, 0.85)";
  ctx.font = "11px Georgia";
  ctx.textAlign = "center";
  ctx.fillText("mass", switchX, switchY + 32);
  ctx.textAlign = "left";

  const stiffness = 26;
  const potential = 0.5 * stiffness * sim.spring * sim.spring;
  const kinetic = 0.5 * sim.mass * sim.springV * sim.springV;
  const meter = Math.max(potential, kinetic, 1);
  const barBase = endY + weight * 0.15;
  const barX = anchor.x - 58;
  ctx.fillStyle = "rgba(244, 220, 170, 0.9)";
  ctx.fillRect(barX, barBase - (potential / meter) * 42, 5, Math.max(1.5, (potential / meter) * 42));
  ctx.fillStyle = "rgba(150, 186, 230, 0.9)";
  ctx.fillRect(barX + 9, barBase - (kinetic / meter) * 42, 5, Math.max(1.5, (kinetic / meter) * 42));

  const waveY = height * 0.7;
  ctx.beginPath();
  ctx.strokeStyle = `rgba(126, 168, 220, ${0.22 + life * 0.2})`;
  ctx.lineWidth = 5;
  for (let x = width * 0.16; x <= width * 0.84; x += 3) {
    const y = waveY + Math.sin(x * 0.02 + time * 1.7) * (8 + life * 14);
    if (x === width * 0.16) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.beginPath();
  ctx.strokeStyle = `rgba(244, 232, 210, ${0.75 + life * 0.2})`;
  ctx.lineWidth = 1.6;
  let riderX = width * 0.16;
  let riderY = waveY;
  const riderAt = (time * 0.08) % 1;
  for (let x = width * 0.16; x <= width * 0.84; x += 3) {
    const local = (x - width * 0.16) / (width * 0.68);
    const y = waveY + Math.sin(x * 0.02 + time * 1.7) * (8 + life * 14);
    if (x <= width * 0.16 + 3) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
    if (Math.abs(local - riderAt) < 0.02) {
      riderX = x;
      riderY = y;
    }
  }
  ctx.stroke();
  ctx.fillStyle = "#f4ead8";
  ctx.beginPath();
  ctx.arc(riderX, riderY, 3.2, 0, Math.PI * 2);
  ctx.fill();

  const trace = sim.springTrace;
  if (trace.length > 2) {
    ctx.beginPath();
    ctx.strokeStyle = `rgba(255, 214, 150, ${0.8 + life * 0.15})`;
    ctx.lineWidth = 1.7;
    let liveX = width * 0.16;
    let liveY = waveY;
    trace.forEach((sample, index) => {
      const x = width * 0.16 + (index / (trace.length - 1)) * width * 0.68;
      const y = waveY - sample * 0.28;
      liveX = x;
      liveY = y;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.fillStyle = "#fff1d4";
    ctx.beginPath();
    ctx.arc(liveX, liveY, 3.4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
  for (const spot of frame.spots) marker(ctx, spot.x, spot.y, spot.open, "rgba(220, 206, 170, 0.95)", time);
}

function fillLimb(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  width: number,
  color: string,
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const nx = (-dy / len) * width * 0.5;
  const ny = (dx / len) * width * 0.5;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x1 + nx, y1 + ny);
  ctx.lineTo(x2 + nx, y2 + ny);
  ctx.lineTo(x2 - nx, y2 - ny);
  ctx.lineTo(x1 - nx, y1 - ny);
  ctx.closePath();
  ctx.fill();
}

/** A person in the room: ordinary proportions, a walk, and a held look. */
function drawFigure(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  live: number,
  attention: number,
  facing: number,
) {
  const held = attention > 0.35;
  const stride = held ? 0 : Math.sin(live * 2.4);
  const bob = held ? Math.sin(live * 1.4) * 0.6 : Math.abs(stride) * 1.6;
  const sway = held ? attention * 0.04 : stride * 0.045;
  const hairLag = held ? 0 : Math.sin(live * 2.4 - 0.45) * 2.2;
  const blinkWindow = live % (held ? 5.2 : 3.6);
  const blinkStart = held ? 4.85 : 3.25;
  const blink = blinkWindow > blinkStart ? Math.sin(((blinkWindow - blinkStart) / 0.28) * Math.PI) : 0;
  const eyeOpen = Math.max(0.2, (1 - blink) * (1 + attention * 0.45));
  const look = held ? 0 : stride * 0.45;
  const shoulder = -102;
  const hem = -34;
  const headY = -128;

  ctx.save();
  ctx.translate(x, y - bob);
  ctx.rotate(sway);
  ctx.scale(scale * (facing < 0 ? -1 : 1), scale);

  ctx.fillStyle = "rgba(6, 8, 18, 0.38)";
  ctx.beginPath();
  ctx.ellipse(0, 5, 26 - Math.abs(stride) * 4, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  const leg = (side: number) => {
    const step = stride * side;
    const kneeX = side * 7 + step * 6;
    const kneeY = -18 - Math.abs(step) * 4;
    const footX = side * 8 + step * 18;
    const footY = -Math.abs(step) * 4;
    fillLimb(ctx, side * 6, hem + 2, kneeX, kneeY, 8, "#232838");
    fillLimb(ctx, kneeX, kneeY, footX, footY, 6.5, "#1a1f2e");
    ctx.fillStyle = "#c6a56e";
    roundRect(ctx, footX - 5, footY - 2, 12, 5, 2);
    ctx.fill();
  };
  leg(-1);
  leg(1);

  const cloth = ctx.createLinearGradient(-22, shoulder, 18, hem);
  cloth.addColorStop(0, "#3c527c");
  cloth.addColorStop(0.45, "#2a3c64");
  cloth.addColorStop(1, "#1a2744");
  ctx.fillStyle = cloth;
  ctx.beginPath();
  ctx.moveTo(-17, shoulder + 8);
  ctx.quadraticCurveTo(-20, -78, -16, -58);
  ctx.quadraticCurveTo(-18, -46, -15, hem);
  ctx.lineTo(15, hem);
  ctx.quadraticCurveTo(18, -46, 16, -58);
  ctx.quadraticCurveTo(20, -78, 17, shoulder + 8);
  ctx.quadraticCurveTo(0, shoulder - 4, -17, shoulder + 8);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgba(232, 214, 176, 0.35)";
  ctx.fillRect(-8, shoulder + 10, 16, 3);

  const swing = held ? 0 : -stride;
  const drawArm = (side: number, elbowX: number, elbowY: number, handX: number, handY: number) => {
    ctx.fillStyle = "#2a3c64";
    ctx.beginPath();
    ctx.arc(side * 16, shoulder + 10, 6.2, 0, Math.PI * 2);
    ctx.fill();
    fillLimb(ctx, side * 15, shoulder + 10, elbowX, elbowY, 6.2, "#e0bea4");
    fillLimb(ctx, elbowX, elbowY, handX, handY, 5, "#ebcbb2");
    ctx.fillStyle = "#efd0b8";
    ctx.beginPath();
    ctx.ellipse(handX, handY, 3.6, 3.1, 0.4, 0, Math.PI * 2);
    ctx.fill();
  };
  if (held) {
    drawArm(-1, -24, -78, -20, hem + 4);
    drawArm(1, 28, -72, 14, hem + 6);
  } else {
    drawArm(-1, -18 - swing * 7, -70, -16 - swing * 14, hem + 2);
    drawArm(1, 18 + swing * 7, -70, 16 + swing * 14, hem + 2);
  }

  ctx.fillStyle = "#e7c4aa";
  ctx.beginPath();
  ctx.moveTo(-4, shoulder + 6);
  ctx.quadraticCurveTo(-3, headY + 20, -3.2, headY + 16);
  ctx.lineTo(3.2, headY + 16);
  ctx.quadraticCurveTo(3, headY + 20, 4, shoulder + 6);
  ctx.closePath();
  ctx.fill();

  ctx.save();
  ctx.translate(hairLag, 0);
  ctx.fillStyle = "#2a211c";
  ctx.beginPath();
  ctx.moveTo(-12, headY - 4);
  ctx.bezierCurveTo(-18, headY + 16, -16, headY + 36, -11, shoulder + 8);
  ctx.bezierCurveTo(-7, headY + 30, -8, headY + 12, -7, headY);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(12, headY - 4);
  ctx.bezierCurveTo(17, headY + 14, 15, headY + 32, 10, shoulder + 2);
  ctx.bezierCurveTo(6, headY + 26, 8, headY + 10, 7, headY);
  ctx.fill();
  ctx.restore();

  const skin = ctx.createRadialGradient(-4, headY - 6, 4, 0, headY + 2, 18);
  skin.addColorStop(0, "#f0d0b8");
  skin.addColorStop(1, "#e0b494");
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.ellipse(0, headY + 2, 12.2, 14.6, held ? -0.05 : sway * 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e7b89a";
  ctx.beginPath();
  ctx.ellipse(-12.4, headY + 3, 2.4, 3.4, 0.2, 0, Math.PI * 2);
  ctx.ellipse(12.4, headY + 3, 2.4, 3.4, -0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(hairLag * 0.35, 0);
  ctx.fillStyle = "#241c18";
  ctx.beginPath();
  ctx.ellipse(0, headY - 6, 13, 11, 0, Math.PI, 0);
  ctx.quadraticCurveTo(8, headY - 2, 4, headY + 1);
  ctx.quadraticCurveTo(0, headY - 4, -4, headY + 1);
  ctx.quadraticCurveTo(-8, headY - 2, -13, headY - 6);
  ctx.fill();
  ctx.strokeStyle = "rgba(90, 70, 58, 0.45)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(0, headY - 16);
  ctx.quadraticCurveTo(1.5, headY - 6, 0, headY - 1);
  ctx.stroke();
  ctx.restore();

  const eye = (ex: number, brow: number) => {
    ctx.save();
    ctx.translate(ex, headY - 1);
    ctx.beginPath();
    ctx.moveTo(-4.1, 0);
    ctx.quadraticCurveTo(0, -2.5 * eyeOpen, 4.1, 0);
    ctx.quadraticCurveTo(0, 1.7 * eyeOpen, -4.1, 0);
    ctx.closePath();
    ctx.fillStyle = "#f7f2eb";
    ctx.fill();
    ctx.clip();
    ctx.fillStyle = "#3d536c";
    ctx.beginPath();
    ctx.arc(look, 0.3, 1.85, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#16141c";
    ctx.beginPath();
    ctx.arc(look, 0.4, 0.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.beginPath();
    ctx.arc(look - 0.55, -0.35, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = "#3a2e28";
    ctx.lineWidth = 1.2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(ex - 4.2, headY - 6.2 - brow);
    ctx.quadraticCurveTo(ex, headY - 7.6 - brow, ex + 4.4, headY - 5.8 - brow * 0.2);
    ctx.stroke();
  };
  eye(-5, attention * 3.1);
  eye(5, attention * 0.35);

  ctx.strokeStyle = "rgba(176, 120, 100, 0.7)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0.2, headY + 2.4);
  ctx.quadraticCurveTo(1.1, headY + 5.2, 0.2, headY + 6.1);
  ctx.stroke();

  ctx.strokeStyle = held ? "#9a5c52" : "#b47868";
  ctx.lineWidth = 1.25;
  ctx.lineCap = "round";
  ctx.beginPath();
  if (held) {
    ctx.moveTo(-2.8, headY + 9.2);
    ctx.quadraticCurveTo(0.2, headY + 8.7, 2.6, headY + 7.6);
  } else {
    ctx.moveTo(-2.6, headY + 9);
    ctx.quadraticCurveTo(0, headY + 10.4, 2.6, headY + 9);
  }
  ctx.stroke();
  ctx.restore();
}

let gazeMix = 0;
let gazeSeen = 0;

function drawMath(ctx: CanvasRenderingContext2D, frame: SceneFrame) {
  sky(ctx, frame, "#10131f", "#16182c", "#12101c", "#e4c48a");
  const { width, height, life, warmth, time, live, sim } = frame;
  const step = Math.min(0.05, Math.max(0, live - gazeSeen));
  gazeSeen = live;
  gazeMix += ((frame.freeze ? 1 : 0) - gazeMix) * Math.min(1, step * 2.2);
  const quiet = 1 - gazeMix * 0.35;
  const narrow = width < 760;
  const phase = time * (0.35 + sim.freq * 0.42);
  const roseSpin = time * (0.06 + sim.freq * 0.045);

  const lamp = ctx.createRadialGradient(width * 0.5, height * 0.34, 10, width * 0.5, height * 0.42, Math.max(width, height) * 0.48);
  lamp.addColorStop(0, `rgba(150, 170, 230, ${(0.07 + warmth * 0.08 + life * 0.05) * quiet})`);
  lamp.addColorStop(1, "rgba(150, 170, 230, 0)");
  ctx.fillStyle = lamp;
  ctx.fillRect(0, 0, width, height);

  const horizon = height * 0.58;
  const vanishX = width * 0.5;
  const vanishY = height * 0.46;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, horizon - 10, width, height - horizon + 20);
  ctx.clip();
  ctx.strokeStyle = `rgba(176, 196, 230, ${(0.13 + life * 0.08) * quiet})`;
  ctx.lineWidth = 1;
  for (let index = -7; index <= 7; index += 1) {
    ctx.beginPath();
    ctx.moveTo(vanishX + index * 18, vanishY);
    ctx.lineTo(vanishX + index * width * 0.16, height + 20);
    ctx.stroke();
  }
  for (let row = 1; row <= 7; row += 1) {
    const t = row / 7;
    const y = vanishY + (height - vanishY) * t * t;
    const half = (y - vanishY) * 1.8;
    ctx.beginPath();
    ctx.moveTo(vanishX - half, y);
    ctx.lineTo(vanishX + half, y);
    ctx.stroke();
  }
  ctx.restore();

  const circleX = width * (narrow ? 0.22 : 0.18);
  const circleY = height * (narrow ? 0.2 : 0.22);
  const radius = Math.min(narrow ? 46 : 78, Math.min(width, height) * (narrow ? 0.075 : 0.09));
  const angle = phase;
  const pointX = circleX + Math.cos(angle) * radius;
  const pointY = circleY - Math.sin(angle) * radius;
  ctx.save();
  ctx.globalAlpha = quiet;
  ctx.strokeStyle = "rgba(214, 206, 186, 0.35)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(circleX - radius - 16, circleY);
  ctx.lineTo(circleX + radius + 18, circleY);
  ctx.moveTo(circleX, circleY - radius - 14);
  ctx.lineTo(circleX, circleY + radius + 14);
  ctx.stroke();
  ctx.strokeStyle = `rgba(232, 214, 170, ${0.55 + life * 0.25})`;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(circleX, circleY, radius, 0, Math.PI * 2);
  ctx.stroke();
  const petals = Math.max(1, Math.round(sim.freq));
  ctx.strokeStyle = `rgba(150, 176, 230, ${0.28 + life * 0.2})`;
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  for (let index = 0; index <= 180; index += 1) {
    const theta = (index / 180) * Math.PI * 2;
    const rose = Math.cos(petals * theta) * radius * 0.72;
    const px = circleX + Math.cos(theta + roseSpin) * rose;
    const py = circleY + Math.sin(theta + roseSpin) * rose;
    if (index === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.strokeStyle = "rgba(242, 214, 150, 0.9)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(circleX, circleY);
  ctx.lineTo(pointX, pointY);
  ctx.stroke();
  ctx.strokeStyle = "rgba(186, 206, 245, 0.55)";
  ctx.setLineDash([3, 4]);
  ctx.beginPath();
  ctx.moveTo(pointX, pointY);
  ctx.lineTo(circleX, pointY);
  ctx.lineTo(circleX, circleY);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#f4e6c8";
  ctx.beginPath();
  ctx.arc(pointX, pointY, 3.2, 0, Math.PI * 2);
  ctx.fill();
  const roseReach = Math.cos(petals * angle) * radius * 0.72;
  ctx.fillStyle = "rgba(186, 206, 245, 0.95)";
  ctx.beginPath();
  ctx.arc(circleX + Math.cos(angle + roseSpin) * roseReach, circleY + Math.sin(angle + roseSpin) * roseReach, 2.4, 0, Math.PI * 2);
  ctx.fill();
  if (!narrow) {
    const originX = circleX + radius + 28;
    const waveW = Math.min(120, width * 0.1);
    const amp = radius * 0.34 * sim.amp;
    ctx.strokeStyle = "rgba(214, 206, 186, 0.35)";
    ctx.beginPath();
    ctx.moveTo(originX, circleY);
    ctx.lineTo(originX + waveW, circleY);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255, 226, 150, 0.85)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let index = 0; index <= 48; index += 1) {
      const u = index / 48;
      const px = originX + u * waveW;
      const py = circleY - Math.sin(u * Math.PI * 2 + angle) * amp;
      if (index === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    const along = (((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) / (Math.PI * 2);
    ctx.strokeStyle = "rgba(186, 206, 245, 0.4)";
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(pointX, pointY);
    ctx.lineTo(originX + along * waveW, circleY - Math.sin(angle) * amp);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#f4e6c8";
    ctx.beginPath();
    ctx.arc(originX + along * waveW, circleY - Math.sin(angle) * amp, 2.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  const solidX = width * (narrow ? 0.8 : 0.8);
  const solidY = height * (narrow ? 0.2 : 0.24);
  const solid = Math.min(narrow ? 34 : 52, Math.min(width, height) * 0.055) + life * 6;
  projectCube(ctx, solidX, solidY, solid, time * (0.4 + sim.freq * 0.22), (0.72 + life * 0.2) * quiet);

  const band = graphBand(width, height);
  const mid = (band.top + band.bottom) / 2;
  const sample = (x: number, harmonic = 1, amp = sim.amp) => {
    const local = (x - band.left) / (band.right - band.left);
    return mid - Math.sin(local * Math.PI * 2 * sim.freq * harmonic + phase) * amp * 36;
  };
  ctx.save();
  ctx.fillStyle = `rgba(12, 16, 32, ${(0.28 + life * 0.08) * quiet})`;
  roundRect(ctx, band.left - 18, band.top - 16, band.right - band.left + 36, band.bottom - band.top + 32, 12);
  ctx.fill();
  ctx.strokeStyle = `rgba(214, 196, 150, ${0.28 * quiet})`;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.strokeStyle = `rgba(244, 228, 200, ${0.28 * quiet})`;
  ctx.beginPath();
  ctx.moveTo(band.left, mid);
  ctx.lineTo(band.right + 8, mid);
  ctx.moveTo(band.left, band.top);
  ctx.lineTo(band.left, band.bottom);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(band.right + 8, mid);
  ctx.lineTo(band.right + 2, mid - 4);
  ctx.moveTo(band.right + 8, mid);
  ctx.lineTo(band.right + 2, mid + 4);
  ctx.stroke();
  ctx.beginPath();
  ctx.strokeStyle = `rgba(126, 168, 255, ${0.28 * Math.max(quiet, 0.45)})`;
  ctx.lineWidth = 5;
  for (let x = band.left; x <= band.right; x += 3) {
    const y = sample(x);
    if (x === band.left) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.beginPath();
  ctx.strokeStyle = `rgba(255, 226, 150, ${0.95 * Math.max(quiet, 0.55)})`;
  ctx.lineWidth = 1.8;
  let beadX = band.left;
  let beadY = mid;
  let beadGap = 1;
  const beadAt = ((time * 0.07 * sim.freq) % 1 + 1) % 1;
  for (let x = band.left; x <= band.right; x += 3) {
    const local = (x - band.left) / (band.right - band.left);
    const y = sample(x);
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
    ctx.strokeStyle = `rgba(196, 154, 110, ${0.4 * quiet})`;
    ctx.lineWidth = 1.1;
    for (let x = band.left; x <= band.right; x += 4) {
      const y = sample(x, 2, sim.amp * 0.38);
      if (x === band.left) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(244, 226, 196, 0.35)";
  ctx.setLineDash([2, 4]);
  ctx.beginPath();
  ctx.moveTo(beadX, beadY);
  ctx.lineTo(beadX, mid);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#f4e2c4";
  ctx.beginPath();
  ctx.arc(beadX, beadY, 3.3, 0, Math.PI * 2);
  ctx.fill();
  const beadLocal = (beadX - band.left) / Math.max(1, band.right - band.left);
  const slope = (-Math.cos(beadLocal * Math.PI * 2 * sim.freq + phase) * Math.PI * 2 * sim.freq * sim.amp * 36) / Math.max(1, band.right - band.left);
  const span = 16;
  ctx.strokeStyle = "rgba(244, 226, 196, 0.8)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(beadX - span, beadY - slope * span);
  ctx.lineTo(beadX + span, beadY + slope * span);
  ctx.stroke();
  ctx.restore();

  const peek = Math.max(0, Math.sin(live * 0.33) - 0.86) / 0.14;
  const attention = Math.max(gazeMix, peek * (1 - gazeMix));
  if (!frame.focus || frame.freeze) {
    const cycle = (live * 0.16) % 2;
    const going = cycle < 1;
    const along = going ? cycle : 2 - cycle;
    const idleX = width * (narrow ? 0.46 + along * 0.08 : 0.48 + along * 0.08);
    const idleY = height * (narrow ? 0.48 : 0.53);
    const gazeX = idleX + (width * 0.5 - idleX) * gazeMix;
    const gazeY = idleY + (height * (narrow ? 0.38 : 0.36) - idleY) * gazeMix;
    const scale = (Math.min(width, height) / 520) * (narrow ? 0.88 : 1) * (1 + gazeMix * 0.06);
    const facing = gazeMix > 0.25 ? 1 : going ? 1 : -1;
    drawFigure(ctx, gazeX, gazeY, scale, live * (0.7 + sim.amp * 0.45), attention, facing);
  }
  for (const spot of frame.spots) marker(ctx, spot.x, spot.y, spot.open, "rgba(186, 206, 255, 0.95)", time);
}

function libraryWindow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  time: number,
  life: number,
) {
  ctx.save();
  ctx.fillStyle = "#5a3824";
  roundRect(ctx, x - 7, y - 4, w + 14, h + 16, 6);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, y + h * 0.28);
  ctx.quadraticCurveTo(x + w / 2, y - h * 0.22, x + w, y + h * 0.28);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
  ctx.save();
  ctx.clip();
  const dusk = ctx.createLinearGradient(x, y, x, y + h);
  dusk.addColorStop(0, mix("#c46a48", "#ffd2a4", 0.25 + life * 0.45));
  dusk.addColorStop(0.55, mix("#8a5040", "#e8a878", 0.2 + life * 0.35));
  dusk.addColorStop(1, "#4a3028");
  ctx.fillStyle = dusk;
  ctx.fillRect(x - 4, y - h * 0.2, w + 8, h * 1.3);
  const sway = Math.sin(time * 0.55) * 8;
  ctx.fillStyle = "rgba(36, 52, 28, 0.72)";
  ctx.beginPath();
  ctx.ellipse(x + w * 0.62 + sway, y + h * 0.42, w * 0.42, h * 0.34, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(24, 36, 18, 0.8)";
  ctx.beginPath();
  ctx.ellipse(x + w * 0.28 + sway * 0.6, y + h * 0.5, w * 0.3, h * 0.28, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(42, 26, 16, 0.85)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.2, y + h);
  ctx.quadraticCurveTo(x + w * 0.34 + sway * 0.3, y + h * 0.4, x + w * 0.7 + sway, y + h * 0.12);
  ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = "rgba(74, 44, 28, 0.9)";
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y + h * 0.08);
  ctx.lineTo(x + w / 2, y + h);
  ctx.moveTo(x + 2, y + h * 0.55);
  ctx.lineTo(x + w - 2, y + h * 0.55);
  ctx.stroke();
  const drape = Math.sin(time * 0.8) * 3;
  ctx.fillStyle = "rgba(92, 42, 36, 0.55)";
  ctx.beginPath();
  ctx.moveTo(x + 2, y + h * 0.2);
  ctx.quadraticCurveTo(x + 14 + drape, y + h * 0.55, x + 6, y + h);
  ctx.lineTo(x + 2, y + h);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + w - 2, y + h * 0.2);
  ctx.quadraticCurveTo(x + w - 16 - drape, y + h * 0.5, x + w - 6, y + h);
  ctx.lineTo(x + w - 2, y + h);
  ctx.fill();
  ctx.fillStyle = "#6a442c";
  ctx.fillRect(x - 10, y + h, w + 20, 8);
  ctx.fillStyle = "rgba(255, 220, 170, 0.18)";
  ctx.fillRect(x + 3, y + h * 0.3, 3, h * 0.55);
  ctx.restore();
}

function bookcase(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  life: number,
  seed: number,
  time: number,
) {
  ctx.save();
  ctx.fillStyle = "#1a100c";
  ctx.fillRect(x + 4, y + 8, w - 8, h - 8);
  ctx.fillStyle = mix("#3a2418", "#6a4630", 0.35 + life * 0.4);
  ctx.fillRect(x, y, 5, h);
  ctx.fillRect(x + w - 5, y, 5, h);
  ctx.fillRect(x, y, w, 8);
  ctx.fillRect(x - 2, y + h - 6, w + 4, 6);
  const colors = ["#8a3030", "#2f4a34", "#c4a05a", "#243044", "#6a3a58", "#3d5a48", "#a86838", "#4a3828", "#1e3a44", "#7a4a32"];
  const shelves = 4;
  for (let shelf = 0; shelf < shelves; shelf += 1) {
    const shelfY = y + 16 + ((shelf + 1) * (h - 28)) / shelves;
    ctx.fillStyle = "#5c3c24";
    ctx.fillRect(x + 4, shelfY, w - 8, 5);
    ctx.fillStyle = "rgba(255, 214, 160, 0.18)";
    ctx.fillRect(x + 4, shelfY, w - 8, 1);
    let cursor = x + 8;
    let index = 0;
    while (cursor < x + w - 12) {
      const bookW = 5 + hash(seed + shelf * 13 + index) * 4.5;
      const bookH = 14 + hash(seed + index + 4) * (h / shelves - 22);
      const pull = index === 2 && shelf === 1 ? Math.sin(time * 0.7 + seed) * 3 : 0;
      const lean = hash(seed + index) > 0.9 ? (hash(seed + index + 2) - 0.5) * 0.35 : 0;
      const color = colors[Math.floor(hash(seed + shelf * 3 + index) * colors.length) % colors.length] ?? "#6a3028";
      ctx.save();
      ctx.translate(cursor + bookW / 2 + pull, shelfY);
      ctx.rotate(lean);
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.9;
      ctx.fillRect(-bookW / 2, -bookH, bookW, bookH);
      ctx.fillStyle = "rgba(255, 236, 210, 0.35)";
      ctx.fillRect(-bookW / 2, -bookH, 1, bookH);
      if (hash(seed + index + shelf) > 0.72) {
        ctx.fillStyle = "rgba(255, 220, 160, 0.45)";
        ctx.fillRect(-bookW / 2 + 1, -bookH * 0.72, bookW - 2, 1.2);
      }
      ctx.restore();
      cursor += bookW + 1.2;
      index += 1;
    }
  }
  ctx.restore();
}

function shelfPlant(ctx: CanvasRenderingContext2D, x: number, y: number, time: number, life: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#6a4030";
  ctx.beginPath();
  ctx.moveTo(-8, 0);
  ctx.lineTo(8, 0);
  ctx.lineTo(6, 10);
  ctx.lineTo(-6, 10);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = mix("#2a4a28", "#6a9a48", 0.35 + life * 0.5);
  ctx.lineWidth = 1.4;
  for (let leaf = 0; leaf < 5; leaf += 1) {
    const sway = Math.sin(time * 0.9 + leaf) * 2;
    ctx.beginPath();
    ctx.moveTo(0, 2);
    ctx.quadraticCurveTo(-16 + leaf * 7 + sway, -8 - leaf * 3, -6 + leaf * 4 + sway, -16 - (leaf % 2) * 6);
    ctx.stroke();
  }
  ctx.restore();
}

function openNotebook(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  kind: number,
  time: number,
  life: number,
) {
  const curl = Math.sin(time * 1.3) * 4;
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.32)";
  ctx.beginPath();
  ctx.ellipse(x + 8, y + h * 0.46, w * 0.48, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  const paper = kind === 0 ? "#f4efe6" : kind === 2 ? "#f6e2c4" : "#fffaf2";
  ctx.fillStyle = paper;
  roundRect(ctx, x - w / 2, y - h / 2, w * 0.48, h, 4);
  ctx.fill();
  ctx.fillStyle = kind === 2 ? "#fbe8cc" : "#fffdf8";
  roundRect(ctx, x - w * 0.02, y - h / 2 + curl * 0.15, w * 0.5, h - curl * 0.1, 4);
  ctx.fill();
  const sheen = ctx.createLinearGradient(x, y - h / 2, x, y + h / 2);
  sheen.addColorStop(0, `rgba(255, 236, 200, ${0.18 + life * 0.2})`);
  sheen.addColorStop(1, "rgba(255, 236, 200, 0)");
  ctx.fillStyle = sheen;
  ctx.fillRect(x - w / 2, y - h / 2, w, h);
  ctx.fillStyle = "#5c3828";
  ctx.fillRect(x - 3, y - h / 2, 6, h);
  ctx.strokeStyle = "rgba(90, 60, 40, 0.35)";
  ctx.lineWidth = 1;
  for (let stitch = 0; stitch < 5; stitch += 1) {
    const sy = y - h * 0.32 + stitch * h * 0.16;
    ctx.beginPath();
    ctx.moveTo(x - 3, sy);
    ctx.lineTo(x + 3, sy + 2);
    ctx.stroke();
  }
  const lines = kind === 0 ? 3 : 6;
  ctx.strokeStyle = kind === 0 ? "rgba(90, 80, 70, 0.35)" : "rgba(70, 100, 150, 0.4)";
  ctx.lineWidth = kind === 0 ? 1.1 : 1;
  for (let index = 0; index < lines; index += 1) {
    const ly = y - h * 0.28 + index * (h * 0.12);
    const wobble = kind === 0 ? (hash(index + 3) - 0.5) * 10 : 0;
    const reach = kind === 0 ? 0.22 + hash(index + 1) * 0.12 : 0.36;
    ctx.beginPath();
    ctx.moveTo(x - w * 0.42, ly + wobble * 0.2);
    ctx.quadraticCurveTo(x - w * 0.28, ly + wobble, x - w * (0.14 + (kind === 0 ? reach * 0.2 : 0)), ly);
    if (kind !== 0) {
      ctx.moveTo(x + w * 0.1, ly + curl * 0.08);
      ctx.lineTo(x + w * 0.4, ly);
    } else if (index === 1) {
      ctx.moveTo(x + w * 0.12, ly);
      ctx.lineTo(x + w * 0.28, ly + 2);
    }
    ctx.stroke();
  }
  if (kind === 0) {
    ctx.save();
    ctx.translate(x + w * 0.26, y + h * 0.06);
    ctx.rotate(-0.45);
    ctx.fillStyle = "#e6c888";
    ctx.fillRect(-20, -2.2, 32, 4.4);
    ctx.fillStyle = "#f7f1e6";
    ctx.fillRect(-24, -2.2, 5, 4.4);
    ctx.fillStyle = "#2a241c";
    ctx.beginPath();
    ctx.moveTo(12, -2.2);
    ctx.lineTo(18, 0);
    ctx.lineTo(12, 2.2);
    ctx.fill();
    ctx.restore();
  }
  if (kind === 1) {
    ctx.fillStyle = "#8a3030";
    ctx.beginPath();
    ctx.moveTo(x + w * 0.33, y - h / 2);
    ctx.lineTo(x + w * 0.39, y - h / 2);
    ctx.lineTo(x + w * 0.39, y + h * 0.16);
    ctx.lineTo(x + w * 0.36, y + h * 0.3);
    ctx.lineTo(x + w * 0.33, y + h * 0.16);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(180, 60, 60, 0.35)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - w * 0.44, y - h * 0.36);
    ctx.lineTo(x - w * 0.44, y + h * 0.36);
    ctx.stroke();
  }
  if (kind === 2) {
    ctx.save();
    ctx.translate(x - w * 0.3, y - h * 0.22);
    ctx.rotate(-0.5);
    ctx.fillStyle = "rgba(196, 91, 106, 0.85)";
    ctx.fillRect(-16, -4, 32, 8);
    ctx.restore();
    ctx.save();
    ctx.translate(x + w * 0.22, y - h * 0.16);
    ctx.rotate(0.4);
    ctx.fillStyle = "rgba(60, 106, 74, 0.8)";
    ctx.fillRect(-14, -3, 28, 6);
    ctx.restore();
    const stickers = ["#c45b6a", "#3c6a4a", "#e0b050", "#3a4a6a"];
    stickers.forEach((color, index) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x - w * 0.34 + (index % 2) * 14, y - h * 0.02 + Math.floor(index / 2) * 14, 4.5, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = "#d4566a";
    ctx.beginPath();
    ctx.arc(x + w * 0.16, y + h * 0.12, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f4e6c8";
    ctx.beginPath();
    ctx.arc(x + w * 0.16, y + h * 0.12, 2.2, 0, Math.PI * 2);
    ctx.fill();
    for (let petal = 0; petal < 5; petal += 1) {
      const angle = (petal / 5) * Math.PI * 2 + 0.4;
      ctx.fillStyle = "#e07058";
      ctx.beginPath();
      ctx.ellipse(
        x - w * 0.16 + Math.cos(angle) * 7,
        y + h * 0.16 + Math.sin(angle) * 7,
        3.2,
        2,
        angle,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
    ctx.fillStyle = "#e8c060";
    ctx.beginPath();
    ctx.arc(x - w * 0.16, y + h * 0.16, 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#d27a4a";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.4, y - h * 0.28);
    ctx.quadraticCurveTo(x + w * 0.52 + curl * 0.4, y, x + w * 0.38, y + h * 0.22);
    ctx.stroke();
    ctx.fillStyle = "#c45b4a";
    ctx.fillRect(x + w * 0.46, y - h * 0.18, 7, 16);
  }
  const turn = (Math.sin(time * 0.9) + 1) / 2;
  ctx.fillStyle = "rgba(232, 214, 186, 0.95)";
  ctx.beginPath();
  ctx.moveTo(x + w * 0.34, y - h * 0.5);
  ctx.lineTo(x + w * (0.22 + turn * 0.08), y - h * 0.28);
  ctx.lineTo(x + w * 0.42, y - h * (0.34 - turn * 0.06));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function turningLeaf(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  flip: number,
  color: string,
) {
  if (flip <= 0 || flip >= 1) return;
  const fold = Math.cos(flip * Math.PI);
  const reach = w * 0.46 * Math.abs(fold);
  const side = fold >= 0 ? 1 : -1;
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - h * 0.48);
  ctx.quadraticCurveTo(x + side * reach * 0.55, y - h * 0.66, x + side * reach, y - h * 0.02);
  ctx.quadraticCurveTo(x + side * reach * 0.5, y + h * 0.58, x, y + h * 0.48);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(90, 60, 40, 0.3)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = "rgba(255, 248, 236, 0.28)";
  ctx.fillRect(x + (side > 0 ? reach * 0.2 : -reach * 0.28), y - h * 0.18, Math.max(2, reach * 0.07), h * 0.36);
  ctx.restore();
}

const DRIFT = ["listen", "page", "voice", "line", "safe", "word"];

function libraryStill(ctx: CanvasRenderingContext2D, width: number, height: number, time: number, life: number) {
  const deskY = height * 0.8;
  const readerX = width * 0.15;
  const scale = Math.min(width, height) / 820;
  const breathe = Math.sin(time * 1.5) * 1.4;
  ctx.save();
  ctx.translate(readerX, deskY + height * 0.1 + breathe);
  ctx.scale(scale, scale);
  ctx.fillStyle = "#4a3024";
  roundRect(ctx, -34, 4, 68, 16, 4);
  ctx.fill();
  ctx.fillStyle = "#7a4038";
  ctx.beginPath();
  ctx.ellipse(0, -22, 22, 26, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e8c4a6";
  ctx.beginPath();
  ctx.arc(2, -58, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2c1a14";
  ctx.beginPath();
  ctx.arc(1, -64, 16, Math.PI * 1.05, Math.PI * 1.95);
  ctx.fill();
  ctx.fillRect(-14, -62, 9, 30);
  ctx.fillRect(8, -60, 8, 22);
  ctx.fillStyle = "#f7f1e6";
  roundRect(ctx, -16, -16, 30, 16, 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(80, 60, 40, 0.35)";
  ctx.beginPath();
  ctx.moveTo(-12, -12);
  ctx.lineTo(8, -12);
  ctx.moveTo(-12, -7);
  ctx.lineTo(6, -7);
  ctx.stroke();
  const blink = Math.abs(Math.sin(time * 0.55)) > 0.96 ? 0.2 : 1;
  ctx.globalAlpha = blink;
  ctx.fillStyle = "#2a1a14";
  ctx.fillRect(-4, -58, 2.4, 2.6);
  ctx.fillRect(5, -58, 2.4, 2.6);
  ctx.restore();

  ctx.save();
  ctx.translate(width * 0.84, deskY + height * 0.09);
  ctx.scale(scale, scale);
  const tail = Math.sin(time * 2.2);
  ctx.strokeStyle = "#c4a070";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(16, -4);
  ctx.quadraticCurveTo(34, -18 + tail * 8, 28, 6);
  ctx.stroke();
  ctx.fillStyle = "#e6c8a0";
  ctx.beginPath();
  ctx.ellipse(0, -6, 22, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(16, -14, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(10, -20);
  ctx.lineTo(13, -28);
  ctx.lineTo(16, -18);
  ctx.moveTo(18, -20);
  ctx.lineTo(22, -28);
  ctx.lineTo(23, -16);
  ctx.fill();
  ctx.strokeStyle = "#6a4030";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(13, -14);
  ctx.quadraticCurveTo(15, -12, 17, -14);
  ctx.moveTo(19, -14);
  ctx.quadraticCurveTo(21, -12, 23, -14);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.translate(width * 0.3, deskY + 28);
  ctx.fillStyle = "#6a3038";
  ctx.fillRect(0, -18, 36, 8);
  ctx.fillStyle = "#2c4038";
  ctx.fillRect(3, -28, 32, 10);
  ctx.fillStyle = "#c4a05a";
  ctx.fillRect(6, -36, 28, 8);
  ctx.fillStyle = "#243044";
  roundRect(ctx, 46, -22, 16, 18, 2);
  ctx.fill();
  ctx.fillStyle = "rgba(180, 200, 220, 0.35)";
  ctx.beginPath();
  ctx.ellipse(54, -30, 7, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  const dip = Math.sin(time * 1.4);
  ctx.strokeStyle = "#d8c090";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(62, -8);
  ctx.lineTo(78, -26 + dip * 4);
  ctx.stroke();
  ctx.fillStyle = "#2a241c";
  ctx.beginPath();
  ctx.moveTo(76, -28 + dip * 4);
  ctx.lineTo(84, -24 + dip * 4);
  ctx.lineTo(78, -20 + dip * 4);
  ctx.fill();
  ctx.restore();

  const cupX = width * 0.7;
  ctx.fillStyle = "#f3efe6";
  ctx.beginPath();
  ctx.ellipse(cupX, deskY + 34, 16, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f7f3ea";
  roundRect(ctx, cupX - 11, deskY + 14, 22, 20, 3);
  ctx.fill();
  ctx.strokeStyle = "#e4d8c4";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cupX + 14, deskY + 24, 6, -1.2, 1.2);
  ctx.stroke();
  ctx.fillStyle = "#6a4030";
  ctx.beginPath();
  ctx.ellipse(cupX, deskY + 16, 8, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = `rgba(255, 236, 220, ${0.35 + life * 0.35})`;
  ctx.lineWidth = 1.2;
  for (let puff = 0; puff < 3; puff += 1) {
    const rise = ((time * 18 + puff * 14) % 28);
    ctx.globalAlpha = 0.45 * (1 - rise / 28);
    ctx.beginPath();
    ctx.arc(cupX + Math.sin(time + puff) * 3, deskY + 12 - rise, 2 + puff, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  const flame = 0.85 + Math.sin(time * 11) * 0.15;
  const candleX = width * 0.92;
  ctx.fillStyle = "#f4efe4";
  roundRect(ctx, candleX - 4, deskY + 16, 8, 26, 2);
  ctx.fill();
  ctx.fillStyle = `rgba(255, 180, 80, ${0.9 * flame})`;
  ctx.beginPath();
  ctx.ellipse(candleX, deskY + 12, 3, 7 * flame, 0, 0, Math.PI * 2);
  ctx.fill();
  const candleGlow = ctx.createRadialGradient(candleX, deskY + 10, 2, candleX, deskY + 10, 36);
  candleGlow.addColorStop(0, `rgba(255, 190, 110, ${0.28 * flame})`);
  candleGlow.addColorStop(1, "rgba(255, 190, 110, 0)");
  ctx.fillStyle = candleGlow;
  ctx.beginPath();
  ctx.arc(candleX, deskY + 10, 36, 0, Math.PI * 2);
  ctx.fill();
}

function drawEnglish(ctx: CanvasRenderingContext2D, frame: SceneFrame) {
  sky(ctx, frame, "#1c120e", "#2a1a12", "#140e0a", "#e0a15a");
  const { width, height, life, warmth, time, sim } = frame;
  ctx.save();

  const wall = ctx.createLinearGradient(0, 0, 0, height);
  wall.addColorStop(0, `rgba(72, 40, 28, ${0.35 + warmth * 0.15})`);
  wall.addColorStop(0.62, "rgba(42, 26, 18, 0.15)");
  wall.addColorStop(1, "rgba(12, 8, 6, 0.35)");
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, width, height);

  const winW = Math.min(width * 0.16, 168);
  const winH = Math.min(height * 0.28, 210);
  const winY = height * 0.15;
  libraryWindow(ctx, width * 0.26, winY, winW, winH, time, life);
  libraryWindow(ctx, width * 0.74 - winW, winY, winW, winH, time + 1.4, life);

  ctx.save();
  ctx.globalAlpha = 0.07 + life * 0.08 + warmth * 0.05;
  ctx.fillStyle = "#ffd8a8";
  ctx.beginPath();
  ctx.moveTo(width * 0.26, winY + winH);
  ctx.lineTo(width * 0.26 + winW, winY + winH);
  ctx.lineTo(width * 0.48, height * 0.8);
  ctx.lineTo(width * 0.22, height * 0.8);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(width * 0.74 - winW, winY + winH);
  ctx.lineTo(width * 0.74, winY + winH);
  ctx.lineTo(width * 0.78, height * 0.8);
  ctx.lineTo(width * 0.52, height * 0.8);
  ctx.fill();
  ctx.restore();

  const rail = height * 0.64;
  ctx.fillStyle = mix("#3a2418", "#5c3a28", 0.3 + life * 0.3);
  ctx.fillRect(0, rail, width, height * 0.8 - rail);
  ctx.strokeStyle = "rgba(232, 196, 150, 0.2)";
  ctx.beginPath();
  ctx.moveTo(0, rail);
  ctx.lineTo(width, rail);
  ctx.stroke();
  for (let panel = 0; panel < 7; panel += 1) {
    const px = (panel + 0.15) * (width / 7);
    ctx.strokeStyle = "rgba(20, 12, 8, 0.28)";
    ctx.strokeRect(px, rail + 10, width / 7 - 16, height * 0.8 - rail - 22);
  }

  const lampX = width * 0.5;
  const lampY = height * 0.1;
  const flicker = 0.92 + Math.sin(time * 7) * 0.04 + Math.sin(time * 13) * 0.02;
  const glow = ctx.createRadialGradient(lampX, lampY + 30, 6, lampX, height * 0.48, 300 + life * 80);
  glow.addColorStop(0, `rgba(255, 214, 150, ${(0.5 + warmth * 0.35) * flicker})`);
  glow.addColorStop(0.4, `rgba(255, 170, 90, ${(0.14 + life * 0.14) * flicker})`);
  glow.addColorStop(1, "rgba(255, 160, 80, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  const caseW = Math.min(72, width * 0.075);
  const caseH = height * 0.58;
  const caseY = height * 0.16;
  bookcase(ctx, 8, caseY, caseW, caseH, life, 2, time);
  bookcase(ctx, width - caseW - 8, caseY, caseW, caseH, life, 9, time + 2);
  shelfPlant(ctx, 8 + caseW / 2, caseY, time, life);
  shelfPlant(ctx, width - caseW / 2 - 8, caseY + 4, time + 1, life);

  const desk = ctx.createLinearGradient(0, height * 0.8, 0, height);
  desk.addColorStop(0, mix("#4a2e1c", "#7a5434", 0.35 + life * 0.45));
  desk.addColorStop(1, "#1a100c");
  ctx.fillStyle = desk;
  ctx.fillRect(0, height * 0.8, width, height * 0.2);
  ctx.strokeStyle = "rgba(255, 220, 170, 0.35)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(0, height * 0.8);
  ctx.lineTo(width, height * 0.8);
  ctx.stroke();
  ctx.strokeStyle = "rgba(40, 22, 14, 0.35)";
  for (let plank = 1; plank < 5; plank += 1) {
    ctx.beginPath();
    ctx.moveTo(0, height * (0.8 + plank * 0.038));
    ctx.lineTo(width, height * (0.8 + plank * 0.038));
    ctx.stroke();
  }
  const pool = ctx.createRadialGradient(width * 0.5, height * 0.86, 10, width * 0.5, height * 0.9, width * 0.28);
  pool.addColorStop(0, `rgba(255, 196, 120, ${0.08 + life * 0.1})`);
  pool.addColorStop(1, "rgba(255, 196, 120, 0)");
  ctx.fillStyle = pool;
  ctx.fillRect(0, height * 0.8, width, height * 0.2);

  libraryStill(ctx, width, height, time, life);

  ctx.strokeStyle = "rgba(212, 170, 110, 0.85)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(lampX, 0);
  ctx.lineTo(lampX, lampY);
  ctx.stroke();
  ctx.fillStyle = "#c4a060";
  ctx.fillRect(lampX - 3, lampY - 2, 6, 4);
  ctx.fillStyle = "#6a4428";
  ctx.beginPath();
  ctx.moveTo(lampX - 18, lampY + 16);
  ctx.lineTo(lampX + 18, lampY + 16);
  ctx.lineTo(lampX + 8, lampY);
  ctx.lineTo(lampX - 8, lampY);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = `rgba(255, 228, 180, ${0.9 * flicker})`;
  ctx.beginPath();
  ctx.ellipse(lampX, lampY + 16, 8, 3.2, 0, 0, Math.PI * 2);
  ctx.fill();

  const mothA = time * 0.85;
  const mothX = lampX + Math.cos(mothA) * 34;
  const mothY = lampY + 8 + Math.sin(mothA * 2) * 10;
  const wing = 5 + Math.sin(time * 14) * 2;
  ctx.fillStyle = "rgba(255, 236, 210, 0.75)";
  ctx.beginPath();
  ctx.ellipse(mothX - 4, mothY, wing, 2.2, -0.6, 0, Math.PI * 2);
  ctx.ellipse(mothX + 4, mothY, wing, 2.2, 0.6, 0, Math.PI * 2);
  ctx.fill();

  const bookW = Math.min(width * 0.34, 320);
  const bookH = Math.min(height * 0.16, 120);
  openNotebook(ctx, width * 0.5, height * 0.7, bookW, bookH, sim.sentence, time, life);
  const papers = ["#f4efe6", "#fffaf2", "#f6e2c4"];
  turningLeaf(ctx, width * 0.5, height * 0.7, bookW, bookH, sim.flip, papers[sim.flipFrom] ?? "#f4efe6");
  const ink = sim.flip > 0 && sim.flip < 1 ? sim.flip : (time * 0.16) % 1;
  ctx.save();
  ctx.strokeStyle = "rgba(36, 48, 78, 0.28)";
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(width * 0.5 - bookW * 0.34, height * 0.7 - bookH * 0.08);
  ctx.lineTo(width * 0.5 - bookW * 0.34 + bookW * 0.26 * ink, height * 0.7 - bookH * 0.08);
  ctx.stroke();
  ctx.fillStyle = "rgba(28, 40, 68, 0.72)";
  ctx.beginPath();
  ctx.arc(width * 0.5 - bookW * 0.34 + bookW * 0.26 * ink, height * 0.7 - bookH * 0.08, 1.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  for (let index = 0; index < 8 + Math.round(life * 8); index += 1) {
    const fall = (time * (16 + hash(index) * 18) + hash(index + 2) * height) % (height * 0.85);
    const x = width * (0.22 + hash(index + 5) * 0.56) + Math.sin(time * 0.6 + index) * 16;
    const y = height * 0.12 + fall;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(time * 0.8 + index);
    ctx.fillStyle = index % 2 === 0 ? "rgba(196, 96, 48, 0.55)" : "rgba(90, 110, 48, 0.5)";
    ctx.beginPath();
    ctx.ellipse(0, 0, 4.2, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  for (let index = 0; index < 16 + Math.round(life * 12); index += 1) {
    const drift = (time * (8 + hash(index) * 10) + hash(index + 2) * height) % (height * 0.62);
    const x = width * 0.32 + hash(index + 4) * width * 0.36 + Math.sin(time + index) * 8;
    const y = height * 0.12 + drift;
    ctx.globalAlpha = 0.18 + life * 0.4;
    ctx.fillStyle = "#fff1d4";
    ctx.beginPath();
    ctx.arc(x, y, hash(index) > 0.7 ? 1.6 : 1, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = "rgba(244, 228, 206, 0.72)";
  ctx.font = "15px Georgia";
  ctx.textAlign = "center";
  DRIFT.forEach((word, index) => {
    const x = width * (0.36 + (index % 3) * 0.14) + Math.sin(time * 0.35 + index) * 10;
    const y = height * (0.22 + Math.floor(index / 3) * 0.07) + Math.cos(time * 0.28 + index) * 7;
    ctx.globalAlpha = 0.38 + life * 0.28 + Math.sin(time * 0.8 + index) * 0.06;
    ctx.fillText(word, x, y);
  });
  ctx.globalAlpha = 1;

  ctx.fillStyle = "rgba(244, 232, 214, 0.92)";
  ctx.font = width < 760 ? "15px Georgia" : "18px Georgia";
  ctx.fillText("The notebook looks", width * 0.5, height * 0.52);
  englishWords(width, height).forEach((word, index) => {
    ctx.fillStyle = sim.sentence === index ? "rgba(255, 228, 180, 0.98)" : "rgba(244, 220, 180, 0.45)";
    ctx.fillText(word.label, word.x, word.y);
  });
  ctx.restore();
  for (const spot of frame.spots) marker(ctx, spot.x, spot.y, spot.open, "rgba(232, 196, 150, 0.95)", time);
}

function eightStar(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string) {
  ctx.beginPath();
  for (let step = 0; step < 8; step += 1) {
    const angle = (step / 8) * Math.PI * 2 - Math.PI / 2;
    const reach = step % 2 === 0 ? radius : radius * 0.42;
    const px = x + Math.cos(angle) * reach;
    const py = y + Math.sin(angle) * reach;
    if (step === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function tracePointedArch(
  ctx: CanvasRenderingContext2D,
  cx: number,
  apex: number,
  foot: number,
  half: number,
) {
  const spring = apex + (foot - apex) * 0.58;
  const bow = apex + (spring - apex) * 0.42;
  ctx.moveTo(cx - half, foot);
  ctx.lineTo(cx - half, spring);
  ctx.bezierCurveTo(cx - half * 0.96, bow, cx - half * 0.22, apex + (spring - apex) * 0.08, cx, apex);
  ctx.bezierCurveTo(cx + half * 0.22, apex + (spring - apex) * 0.08, cx + half * 0.96, bow, cx + half, spring);
  ctx.lineTo(cx + half, foot);
  ctx.closePath();
}

function pointedArch(
  ctx: CanvasRenderingContext2D,
  cx: number,
  apex: number,
  foot: number,
  half: number,
) {
  ctx.beginPath();
  tracePointedArch(ctx, cx, apex, foot, half);
}

function cypress(ctx: CanvasRenderingContext2D, x: number, y: number, h: number, time: number, life: number) {
  const sway = Math.sin(time * 0.55 + x * 0.01) * 5;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#2a241c";
  ctx.fillRect(-2.2, -h * 0.08, 4.4, h * 0.1);
  for (let clump = 0; clump < 8; clump += 1) {
    const t = clump / 7;
    const yy = -h * (0.08 + t * 0.86);
    const rx = h * (0.13 - t * 0.09);
    const shift = Math.sin(time * 0.7 + clump + x) * 2 + sway * (1 - t) * 0.15;
    ctx.fillStyle = mix("#143026", "#4c7a52", 0.15 + (clump % 3) * 0.16 + life * 0.22);
    ctx.beginPath();
    ctx.ellipse(shift, yy, Math.max(4, rx), Math.max(3, rx * 0.62), 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function courtyardLantern(ctx: CanvasRenderingContext2D, x: number, y: number, time: number, life: number) {
  const flicker = 0.82 + Math.sin(time * 7.5 + x) * 0.1 + Math.sin(time * 13.2) * 0.05;
  ctx.save();
  ctx.strokeStyle = "rgba(196, 161, 90, 0.75)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x, y - 46);
  ctx.lineTo(x, y - 16);
  ctx.stroke();
  ctx.fillStyle = "#5c4018";
  ctx.beginPath();
  ctx.moveTo(x - 7, y - 16);
  ctx.lineTo(x + 7, y - 16);
  ctx.lineTo(x + 10, y - 8);
  ctx.lineTo(x - 10, y - 8);
  ctx.closePath();
  ctx.fill();
  const glass = ctx.createLinearGradient(x - 8, y - 6, x + 8, y + 16);
  glass.addColorStop(0, `rgba(255, 214, 140, ${0.95 * flicker})`);
  glass.addColorStop(1, `rgba(196, 96, 36, ${0.8 * flicker})`);
  ctx.fillStyle = glass;
  ctx.beginPath();
  ctx.moveTo(x - 9, y - 6);
  ctx.lineTo(x + 9, y - 6);
  ctx.lineTo(x + 7, y + 14);
  ctx.lineTo(x - 7, y + 14);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(92, 58, 24, 0.7)";
  ctx.stroke();
  ctx.fillStyle = `rgba(255, 236, 200, ${0.85 * flicker})`;
  ctx.beginPath();
  ctx.ellipse(x, y + 1, 2.2, 5 + Math.sin(time * 11) * 1.4, 0, 0, Math.PI * 2);
  ctx.fill();
  const glow = ctx.createRadialGradient(x, y, 2, x, y, 90 + life * 40);
  glow.addColorStop(0, `rgba(255, 186, 96, ${(0.34 + life * 0.22) * flicker})`);
  glow.addColorStop(0.45, `rgba(255, 160, 70, ${(0.08 + life * 0.06) * flicker})`);
  glow.addColorStop(1, "rgba(255, 160, 70, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, 90 + life * 40, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function fountain(ctx: CanvasRenderingContext2D, x: number, y: number, time: number, life: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = mix("#4a3828", "#a88858", 0.35 + life * 0.2);
  ctx.beginPath();
  ctx.ellipse(0, 6, 40, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = mix("#102c2c", "#2a6a62", 0.45 + life * 0.35);
  ctx.beginPath();
  ctx.ellipse(0, 4, 30, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  const sheen = ctx.createLinearGradient(-20, 0, 20, 8);
  sheen.addColorStop(0, "rgba(210, 240, 230, 0)");
  sheen.addColorStop(0.5, `rgba(220, 245, 236, ${0.2 + life * 0.25})`);
  sheen.addColorStop(1, "rgba(210, 240, 230, 0)");
  ctx.fillStyle = sheen;
  ctx.beginPath();
  ctx.ellipse(0, 3, 22, 6, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = `rgba(226, 244, 236, ${0.35 + life * 0.3})`;
  ctx.lineWidth = 1;
  for (let ring = 0; ring < 3; ring += 1) {
    const wave = (time * 0.55 + ring * 0.33) % 1;
    ctx.globalAlpha = (1 - wave) * (0.45 + life * 0.4);
    ctx.beginPath();
    ctx.ellipse(0, 4, 6 + wave * 22, 2.4 + wave * 8, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  for (let jet = 0; jet < 5; jet += 1) {
    const phase = time * 2.2 + jet * 1.3;
    const rise = 10 + Math.sin(phase) * 7 + life * 6;
    const spread = (jet - 2) * 4.5;
    ctx.strokeStyle = `rgba(214, 240, 232, ${0.35 + life * 0.4})`;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(spread * 0.2, 2);
    ctx.quadraticCurveTo(spread, -rise * 0.7, spread * 1.15, -rise);
    ctx.stroke();
    ctx.fillStyle = `rgba(236, 250, 244, ${0.65 + life * 0.25})`;
    ctx.beginPath();
    ctx.arc(spread * 1.15, -rise, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function archOpening(ctx: CanvasRenderingContext2D, cx: number, apex: number, foot: number, half: number) {
  tracePointedArch(ctx, cx, apex, foot, half);
}

function drawInner(ctx: CanvasRenderingContext2D, frame: SceneFrame) {
  sky(ctx, frame, "#0c1422", "#182430", "#16130f", "#e0b56a");
  const { width, height, life, warmth, time, live, sim } = frame;
  const book = manuscript(width, height);
  const narrow = width < 760;
  const motion = live;
  const cx = width * 0.5;
  const apex = height * (narrow ? 0.22 : 0.24);
  const floorY = height * (narrow ? 0.72 : 0.68);
  const wallTop = height * (narrow ? 0.34 : 0.32);
  const half = Math.min(width * (narrow ? 0.3 : 0.19), 210);

  for (let index = 0; index < 36; index += 1) {
    const sx = hash(index + 2) * width;
    const sy = hash(index + 9) * height * 0.26;
    if (Math.hypot(sx - width * 0.5, sy - height * 0.16) < 78) continue;
    const twinkle = 0.2 + Math.sin(motion * 1.5 + index * 1.7) * 0.18 + life * 0.28;
    ctx.globalAlpha = Math.max(0.04, twinkle);
    ctx.fillStyle = "#f4ead4";
    ctx.beginPath();
    ctx.arc(sx, sy, hash(index) > 0.82 ? 1.6 : 0.75, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  for (let cloud = 0; cloud < 3; cloud += 1) {
    const x = ((hash(cloud + 4) * width + motion * (10 + cloud * 4)) % (width + 240)) - 120;
    const y = height * (0.05 + cloud * 0.035);
    ctx.fillStyle = `rgba(176, 196, 214, ${0.035 + life * 0.03})`;
    ctx.beginPath();
    ctx.ellipse(x, y, 80 + cloud * 16, 14, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 36, y + 4, 48, 10, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.save();
  for (let index = 0; index < 4; index += 1) {
    const ax = width * (0.08 + hash(index + 21) * 0.28);
    const ay = height * (0.04 + hash(index + 33) * 0.1);
    const bx = width * (0.62 + hash(index + 45) * 0.26);
    const by = height * (0.045 + hash(index + 57) * 0.1);
    const pulse = 0.35 + Math.sin(motion * 0.55 + index * 1.3) * 0.25;
    ctx.globalAlpha = pulse * (0.12 + life * 0.16);
    ctx.strokeStyle = "rgba(214, 196, 168, 0.9)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.quadraticCurveTo((ax + bx) / 2, Math.min(ay, by) - 12, bx, by);
    ctx.stroke();
    ctx.fillStyle = "rgba(244, 232, 206, 0.75)";
    ctx.beginPath();
    ctx.arc(ax, ay, 1.3, 0, Math.PI * 2);
    ctx.arc(bx, by, 1.3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  ctx.globalAlpha = 1;

  const moonX = width * 0.84;
  const moonY = height * 0.08;
  const moonGlow = ctx.createRadialGradient(moonX, moonY, 4, moonX, moonY, 70);
  moonGlow.addColorStop(0, `rgba(244, 228, 196, ${0.16 + life * 0.08})`);
  moonGlow.addColorStop(1, "rgba(244, 228, 196, 0)");
  ctx.fillStyle = moonGlow;
  ctx.beginPath();
  ctx.arc(moonX, moonY, 70, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = `rgba(244, 232, 206, ${0.86 + life * 0.1})`;
  ctx.beginPath();
  ctx.arc(moonX, moonY, 15, 0, Math.PI * 2);
  ctx.arc(moonX + 7, moonY - 1, 12, 0, Math.PI * 2, true);
  ctx.fill("evenodd");

  for (let bird = 0; bird < 4; bird += 1) {
    const bx = ((motion * (22 + bird * 9) + hash(bird) * width) % (width + 80)) - 40;
    const by = height * (0.045 + (bird % 3) * 0.018) + Math.sin(motion * 1.3 + bird) * 6;
    if (Math.abs(bx - width * 0.5) < 90) continue;
    const flap = Math.sin(motion * 8 + bird * 2) * 4;
    ctx.strokeStyle = `rgba(244, 232, 214, ${0.28 + life * 0.35})`;
    ctx.lineWidth = 1.15;
    ctx.beginPath();
    ctx.moveTo(bx - 8, by);
    ctx.quadraticCurveTo(bx - 4, by - 5 - flap, bx, by);
    ctx.quadraticCurveTo(bx + 4, by - 5 - flap, bx + 8, by);
    ctx.stroke();
  }

  ctx.save();
  ctx.beginPath();
  pointedArch(ctx, cx, apex, floorY, half);
  ctx.clip();
  const garden = ctx.createLinearGradient(0, apex, 0, floorY);
  garden.addColorStop(0, mix("#243044", "#4a3420", 0.25 + life * 0.3));
  garden.addColorStop(0.55, mix("#16302c", "#245048", 0.35 + life * 0.25));
  garden.addColorStop(1, mix("#102420", "#1c3c34", 0.5));
  ctx.fillStyle = garden;
  ctx.fillRect(cx - half - 4, apex - 4, half * 2 + 8, floorY - apex + 8);
  pointedArch(ctx, cx, apex + (floorY - apex) * 0.22, floorY - 6, half * 0.42);
  ctx.strokeStyle = `rgba(212, 176, 110, ${0.28 + life * 0.28})`;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  cypress(ctx, cx - half * 0.55, floorY - 4, (floorY - apex) * 0.42, motion, life);
  cypress(ctx, cx + half * 0.58, floorY - 4, (floorY - apex) * 0.36, motion + 1, life);
  for (let mote = 0; mote < 10; mote += 1) {
    const my = apex + ((hash(mote + 3) * (floorY - apex) + motion * 12) % (floorY - apex));
    const mx = cx + (hash(mote + 8) - 0.5) * half * 1.2;
    ctx.fillStyle = `rgba(255, 228, 190, ${0.08 + life * 0.12})`;
    ctx.beginPath();
    ctx.arc(mx, my, 1.1, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  ctx.beginPath();
  ctx.rect(0, wallTop, width, floorY - wallTop);
  archOpening(ctx, cx, apex, floorY, half);
  ctx.fillStyle = mix("#322820", "#6a5342", 0.2 + life * 0.28);
  ctx.fill("evenodd");

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, wallTop, Math.max(0, cx - half + 2), floorY - wallTop);
  ctx.rect(cx + half - 2, wallTop, width, floorY - wallTop);
  ctx.clip();
  ctx.strokeStyle = "rgba(24, 16, 10, 0.28)";
  ctx.lineWidth = 1;
  for (let course = wallTop + 12; course < floorY; course += 15) {
    ctx.beginPath();
    ctx.moveTo(0, course);
    ctx.lineTo(width, course);
    ctx.stroke();
  }
  const bays = narrow ? 1 : 3;
  for (const side of [-1, 1]) {
    for (let bay = 0; bay < bays; bay += 1) {
      const x = side < 0 ? width * (0.08 + bay * 0.09) : width * (0.92 - bay * 0.09);
      const nicheFoot = wallTop + (floorY - wallTop) * 0.58;
      pointedArch(ctx, x, wallTop + 16, nicheFoot, narrow ? 18 : 34);
      ctx.fillStyle = `rgba(18, 12, 10, ${0.35 + life * 0.08})`;
      ctx.fill();
      ctx.strokeStyle = `rgba(196, 154, 90, ${0.3 + life * 0.22})`;
      ctx.lineWidth = 1.15;
      ctx.stroke();
    }
  }
  ctx.restore();

  ctx.strokeStyle = `rgba(214, 184, 122, ${0.45 + life * 0.25})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, wallTop);
  ctx.lineTo(Math.max(0, cx - half), wallTop);
  ctx.moveTo(Math.min(width, cx + half), wallTop);
  ctx.lineTo(width, wallTop);
  ctx.stroke();

  pointedArch(ctx, cx, apex, floorY, half);
  ctx.strokeStyle = "rgba(28, 18, 12, 0.85)";
  ctx.lineWidth = 16;
  ctx.stroke();
  ctx.strokeStyle = `rgba(212, 176, 110, ${0.7 + life * 0.25})`;
  ctx.lineWidth = 2.4;
  ctx.stroke();
  pointedArch(ctx, cx, apex + 11, floorY - 6, half - 14);
  ctx.strokeStyle = `rgba(212, 176, 110, ${0.2 + life * 0.18})`;
  ctx.lineWidth = 1;
  ctx.stroke();

  const vanishY = floorY + 2;
  const nearY = height + 24;
  const cols = narrow ? 6 : 10;
  const rowCount = 7;
  for (let row = 0; row < rowCount; row += 1) {
    const y0 = vanishY + (nearY - vanishY) * (row / rowCount);
    const y1 = vanishY + (nearY - vanishY) * ((row + 1) / rowCount);
    const s0 = Math.max(0.05, (y0 - (floorY - height * 0.12)) / (nearY - (floorY - height * 0.12)));
    const s1 = Math.max(0.05, (y1 - (floorY - height * 0.12)) / (nearY - (floorY - height * 0.12)));
    for (let col = 0; col < cols; col += 1) {
      const u0 = (col / cols) * 2 - 1;
      const u1 = ((col + 1) / cols) * 2 - 1;
      const span = width * 0.78;
      ctx.beginPath();
      ctx.moveTo(cx + u0 * span * s0, y0);
      ctx.lineTo(cx + u1 * span * s0, y0);
      ctx.lineTo(cx + u1 * span * s1, y1);
      ctx.lineTo(cx + u0 * span * s1, y1);
      ctx.closePath();
      const warmTile = (row + col) % 2 === 0;
      ctx.fillStyle = warmTile
        ? mix("#241e18", "#5a4636", 0.32 + life * 0.28)
        : mix("#161c1a", "#2c4038", 0.38 + life * 0.22);
      ctx.fill();
      ctx.strokeStyle = "rgba(12, 10, 8, 0.35)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
  ctx.strokeStyle = `rgba(196, 164, 112, ${0.28 + life * 0.2})`;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(0, floorY);
  ctx.lineTo(width, floorY);
  ctx.stroke();

  const pool = ctx.createRadialGradient(cx, floorY + 16, 10, cx, floorY + 36, half * 1.35);
  pool.addColorStop(0, `rgba(224, 168, 96, ${0.08 + warmth * 0.14 + life * 0.06})`);
  pool.addColorStop(1, "rgba(224, 168, 96, 0)");
  ctx.fillStyle = pool;
  ctx.fillRect(0, floorY - 10, width, height * 0.4);

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(width * 0.2, height + 4);
  ctx.quadraticCurveTo(width * 0.25, height * 0.84, width * 0.31, floorY + 6);
  ctx.quadraticCurveTo(width * 0.28, height * 0.84, width * 0.25, height + 4);
  ctx.closePath();
  ctx.fillStyle = `rgba(42, 110, 104, ${0.45 + life * 0.25})`;
  ctx.fill();
  ctx.strokeStyle = `rgba(214, 242, 234, ${0.28 + life * 0.3})`;
  ctx.lineWidth = 1.2;
  ctx.setLineDash([7, 12]);
  const channel = sim.page === 2 ? 78 : sim.page === 1 ? 36 : 18;
  ctx.lineDashOffset = -((motion * channel) % 40);
  ctx.beginPath();
  ctx.moveTo(width * 0.225, height);
  ctx.quadraticCurveTo(width * 0.265, height * 0.84, width * 0.32, floorY + 8);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  cypress(ctx, width * 0.04, floorY + 8, height * 0.34, motion, life);
  cypress(ctx, width * 0.96, floorY + 8, height * 0.3, motion + 0.8, life);
  for (let shrub = 0; shrub < (narrow ? 3 : 6); shrub += 1) {
    const side = shrub % 2 === 0 ? -1 : 1;
    const sx = cx + side * (half + 24 + (shrub % 3) * (narrow ? 18 : 36));
    const sy = floorY + 18 + (shrub % 3) * 8;
    const sway = Math.sin(motion * 0.8 + shrub) * 3;
    ctx.strokeStyle = mix("#1c3428", "#4a7a52", 0.4 + life * 0.4);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(sx, sy + 16);
    ctx.quadraticCurveTo(sx + sway, sy, sx + sway * 1.4, sy - 14 - life * 8);
    ctx.stroke();
    ctx.fillStyle = `rgba(120, 168, 96, ${0.25 + life * 0.4})`;
    ctx.beginPath();
    ctx.ellipse(sx + sway * 1.4, sy - 16 - life * 8, 5 + life * 3, 3, sway * 0.05, 0, Math.PI * 2);
    ctx.fill();
  }

  fountain(ctx, width * (narrow ? 0.2 : 0.18), height * 0.9, motion * (sim.page === 2 ? 1.65 : sim.page === 1 ? 1.15 : 0.85), life);

  const stones = sim.page === 2 ? 8 : 3 + Math.round(life * 3);
  const stoneAt = (index: number) => {
    const t = index / Math.max(1, stones - 1);
    return { x: width * (0.36 + t * 0.1), y: height * (0.95 - t * 0.22), t };
  };
  if (sim.page === 2) {
    ctx.beginPath();
    for (let index = 0; index < stones; index += 1) {
      const at = stoneAt(index);
      if (index === 0) ctx.moveTo(at.x, at.y);
      else ctx.lineTo(at.x, at.y);
    }
    ctx.strokeStyle = `rgba(212, 184, 130, ${0.28 + life * 0.25})`;
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 7]);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  for (let index = 0; index < stones; index += 1) {
    const at = stoneAt(index);
    ctx.fillStyle = `rgba(232, 214, 186, ${(sim.page === 2 ? 0.55 : 0.28) + life * 0.25})`;
    ctx.beginPath();
    ctx.ellipse(at.x, at.y, 11, 4.5, at.t * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255, 236, 210, 0.22)";
    ctx.beginPath();
    ctx.ellipse(at.x - 2, at.y - 1, 5, 1.8, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  if (sim.page === 2) {
    const walk = (motion * 0.14) % 1;
    const along = walk * (stones - 1);
    const from = stoneAt(Math.floor(along));
    const to = stoneAt(Math.min(stones - 1, Math.floor(along) + 1));
    const local = along - Math.floor(along);
    ctx.fillStyle = "rgba(255, 236, 210, 0.95)";
    ctx.beginPath();
    ctx.arc(from.x + (to.x - from.x) * local, from.y + (to.y - from.y) * local - 7, 3.1, 0, Math.PI * 2);
    ctx.fill();
  }

  const left = book.x - book.w / 2;
  const top = book.y - book.h / 2;
  ctx.fillStyle = "#3a2a1c";
  ctx.fillRect(left + 14, top + book.h - 2, 6, Math.max(10, floorY - (top + book.h) + 6));
  ctx.fillRect(left + book.w - 20, top + book.h - 2, 6, Math.max(10, floorY - (top + book.h) + 6));
  ctx.fillStyle = "#5c4030";
  ctx.fillRect(left + 6, top + book.h - 6, book.w - 12, 7);

  courtyardLantern(ctx, book.x - book.w / 2 - 28, book.y - book.h * 0.05, motion, life + warmth);
  courtyardLantern(ctx, book.x + book.w / 2 + 28, book.y - book.h * 0.05, motion + 1.7, life + warmth);

  ctx.fillStyle = "rgba(28, 18, 12, 0.35)";
  ctx.fillRect(left + 7, top + 8, book.w, book.h);
  const paper = ctx.createLinearGradient(left, top, left + book.w, top + book.h);
  paper.addColorStop(0, sim.page === 1 ? "#fbf6ea" : "#f6ead2");
  paper.addColorStop(1, sim.page === 1 ? "#f3e7d2" : "#e7d3ae");
  ctx.fillStyle = paper;
  ctx.fillRect(left, top, book.w, book.h);
  ctx.save();
  ctx.beginPath();
  ctx.rect(left, top, book.w, book.h);
  ctx.clip();
  ctx.strokeStyle = "rgba(120, 78, 40, 0.06)";
  ctx.lineWidth = 1;
  for (let fiber = 1; fiber < 7; fiber += 1) {
    const y = top + (book.h * fiber) / 7;
    ctx.beginPath();
    ctx.moveTo(left + 8, y);
    ctx.quadraticCurveTo(book.x, y + 2, left + book.w - 8, y - 1);
    ctx.stroke();
  }
  ctx.restore();
  ctx.strokeStyle = "#c4a15a";
  ctx.lineWidth = 2;
  ctx.strokeRect(left + 5, top + 5, book.w - 10, book.h - 10);
  ctx.strokeStyle = "rgba(92, 48, 36, 0.4)";
  ctx.lineWidth = 1;
  ctx.strokeRect(left + 9, top + 9, book.w - 18, book.h - 18);
  if (sim.page === 0 && book.h > 90) {
    ctx.save();
    ctx.translate(book.x, top + 18);
    ctx.rotate(motion * 0.35);
    eightStar(ctx, 0, 0, 7, `rgba(168, 112, 48, ${0.5 + Math.sin(motion) * 0.12})`);
    ctx.restore();
  }
  if (sim.page === 2) {
    ctx.strokeStyle = "rgba(92, 64, 40, 0.35)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(left + 16, top + book.h - 18);
    ctx.lineTo(left + book.w - 16, top + book.h - 18);
    ctx.stroke();
    ctx.fillStyle = "rgba(92, 64, 40, 0.6)";
    for (let dot = 0; dot < 5; dot += 1) {
      ctx.beginPath();
      ctx.arc(book.x - 28 + dot * 14, top + book.h - 18, 1.7, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const curl = (Math.sin(motion * 0.9) + 1) / 2;
  ctx.fillStyle = "#e4d2b0";
  ctx.beginPath();
  ctx.moveTo(left + book.w, top);
  ctx.lineTo(left + book.w - 14 - curl * 6, top + 16);
  ctx.lineTo(left + book.w, top + 22 + curl * 4);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#3a2a22";
  ctx.font = `${book.w < 180 ? 12 : 15}px Georgia`;
  ctx.textAlign = "center";
  const pages = [
    ["A page of pattern.", "Turn it."],
    ["Actions are only", "by intentions."],
    ["The days. The route.", "The effort stayed."],
  ];
  const lines = pages[sim.page] ?? pages[0];
  lines.forEach((line, index) => ctx.fillText(line, book.x, book.y - 8 + index * 22));
  ctx.textAlign = "left";
  if (sim.flip > 0 && sim.flip < 1) {
    const edge = left + 8 + (book.w - 16) * sim.flip;
    ctx.fillStyle = "rgba(90, 64, 40, 0.2)";
    ctx.fillRect(edge, top + 6, 4, book.h - 12);
    ctx.fillStyle = "rgba(255, 244, 220, 0.16)";
    ctx.fillRect(edge + 4, top + 6, 8, book.h - 12);
  }

  const lanterns = [book.x - book.w / 2 - 28, book.x + book.w / 2 + 28];
  for (let moth = 0; moth < 4; moth += 1) {
    const anchor = lanterns[moth % 2] ?? cx;
    const angle = motion * (0.9 + moth * 0.15) + moth;
    const mx = anchor + Math.cos(angle) * (16 + moth * 3);
    const my = book.y + Math.sin(angle * 1.3) * 12 - 10;
    const wing = 0.4 + Math.abs(Math.sin(motion * 14 + moth)) * 0.6;
    ctx.fillStyle = `rgba(244, 228, 196, ${0.25 + life * 0.35})`;
    ctx.beginPath();
    ctx.ellipse(mx - 3 * wing, my, 3 * wing, 1.6, -0.4, 0, Math.PI * 2);
    ctx.ellipse(mx + 3 * wing, my, 3 * wing, 1.6, 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let leaf = 0; leaf < 7; leaf += 1) {
    const lx = (hash(leaf + 12) * width + Math.sin(motion * 0.4 + leaf) * 20) % width;
    const ly = ((hash(leaf + 18) * height + motion * (12 + leaf)) % (height * 0.7)) + height * 0.2;
    if (Math.hypot(lx - book.x, ly - book.y) < book.w * 0.45) continue;
    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(Math.sin(motion + leaf) * 0.8);
    ctx.fillStyle = `rgba(90, 120, 72, ${0.2 + life * 0.35})`;
    ctx.beginPath();
    ctx.ellipse(0, 0, 4.5, 1.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
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
