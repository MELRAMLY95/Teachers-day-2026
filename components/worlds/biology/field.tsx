"use client";

import { useSound } from "@/components/sound";
import { garden, kalsoomDedication, kalsoomLetter } from "@/lib/biology/lines";
import type { Teacher } from "@/lib/types";
import { useEffect, useRef, useState } from "react";
import { readFonts, useStage, type Fonts } from "../shared/stage";

type Focus = string | null;

type Drop = { route: "vena" | "aorta" | "pulmonary" | "veins"; t: number };

type Runtime = {
  time: number;
  opened: Set<string>;
  focus: Focus;
  vista: boolean;
  reduced: boolean;
  warmth: number;
  zoom: number;
  panX: number;
  panY: number;
  driftX: number;
  driftY: number;
  chaosUntil: number;
  beeps: number[];
  lastThump: number;
  drops: Drop[];
  dropAt: number;
  flow: number;
  fonts: Fonts;
  fontsReady: boolean;
};

const SPOTS: Record<string, { x: number; y: number }> = {
  flip: { x: 0.8, y: 0.16 },
  words: { x: 0.15, y: 0.28 },
  smile: { x: 0.85, y: 0.34 },
  smart: { x: 0.13, y: 0.52 },
  kind: { x: 0.87, y: 0.56 },
  love: { x: 0.27, y: 0.76 },
  place: { x: 0.73, y: 0.76 },
  grade: { x: 0.5, y: 0.88 },
};

function hash(index: number) {
  const value = Math.sin(index * 127.1 + 19.19) * 43758.5453;
  return value - Math.floor(value);
}

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

function createRuntime(): Runtime {
  return {
    time: 0,
    opened: new Set(),
    focus: null,
    vista: false,
    reduced: false,
    warmth: 0.08,
    zoom: 1,
    panX: 0,
    panY: 0,
    driftX: 0,
    driftY: 0,
    chaosUntil: 0,
    beeps: [],
    lastThump: 0,
    drops: [],
    dropAt: 0,
    flow: 2,
    fonts: { display: "Georgia", mono: "monospace", hand: "Georgia" },
    fontsReady: false,
  };
}

function placeOf(id: string, width: number, height: number) {
  const spot = SPOTS[id] ?? { x: 0.5, y: 0.5 };
  const pull = width < 760 ? 0.08 : 0;
  return {
    x: width * (0.5 + (spot.x - 0.5) * (1 - pull)),
    y: height * spot.y,
  };
}

function beatOf(time: number, fast: boolean) {
  const period = fast ? 0.32 : 1.16;
  const phase = (time % period) / period;
  const lub = Math.exp(-(((phase - 0.12) * 16) ** 2));
  const dub = Math.exp(-(((phase - 0.32) * 20) ** 2)) * 0.55;
  return lub + dub;
}

function along(points: { x: number; y: number }[], t: number) {
  const scaled = Math.min(0.999, Math.max(0, t)) * (points.length - 1);
  const index = Math.min(points.length - 2, Math.floor(scaled));
  const from = points[index];
  const to = points[index + 1];
  if (!from || !to) return { x: 0, y: 0 };
  const local = scaled - index;
  return { x: from.x + (to.x - from.x) * local, y: from.y + (to.y - from.y) * local };
}

function sampleCubic(
  a: { x: number; y: number },
  b: { x: number; y: number },
  c: { x: number; y: number },
  d: { x: number; y: number },
  steps: number,
) {
  const points: { x: number; y: number }[] = [];
  for (let index = 0; index <= steps; index += 1) {
    const t = index / steps;
    const u = 1 - t;
    points.push({
      x: u * u * u * a.x + 3 * u * u * t * b.x + 3 * u * t * t * c.x + t * t * t * d.x,
      y: u * u * u * a.y + 3 * u * u * t * b.y + 3 * u * t * t * c.y + t * t * t * d.y,
    });
  }
  return points;
}

function vessels(cx: number, cy: number, s: number) {
  const at = (x: number, y: number) => ({ x: cx + s * x, y: cy + s * y });
  return {
    vena: sampleCubic(at(-0.16, -0.68), at(-0.16, -0.46), at(-0.12, -0.24), at(-0.08, -0.04), 8),
    pulmonary: sampleCubic(at(0.0, 0.04), at(0.0, -0.1), at(0.01, -0.2), at(0.02, -0.28), 6),
    veins: sampleCubic(at(0.4, 0.1), at(0.28, 0.04), at(0.18, 0.06), at(0.1, 0.1), 6),
    aorta: sampleCubic(at(0.06, 0.02), at(0.1, -0.26), at(0.22, -0.5), at(0.4, -0.32), 12),
    lungLeft: sampleCubic(at(0.02, -0.28), at(-0.08, -0.3), at(-0.16, -0.22), at(-0.2, -0.1), 5),
    lungRight: sampleCubic(at(0.02, -0.28), at(0.12, -0.3), at(0.2, -0.2), at(0.24, -0.08), 5),
    branch: sampleCubic(at(0.2, -0.4), at(0.26, -0.48), at(0.3, -0.46), at(0.32, -0.38), 4),
  };
}

function drawVessel(
  ctx: CanvasRenderingContext2D,
  points: { x: number; y: number }[],
  width: number,
  lit: string,
  mid: string,
  dark: string,
  ridges: number,
) {
  if (points.length < 2 || width <= 0) return;
  const steps = 32;
  for (let index = 0; index <= steps; index += 1) {
    const t = index / steps;
    const at = along(points, t);
    const prev = along(points, Math.max(0, t - 0.03));
    const next = along(points, Math.min(0.999, t + 0.03));
    const angle = Math.atan2(next.y - prev.y, next.x - prev.x);
    const rx = width * 0.52;
    const ry = width * 0.42;
    const shade = ctx.createRadialGradient(
      at.x - Math.cos(angle + 2.2) * rx * 0.32,
      at.y - Math.sin(angle + 2.2) * ry * 0.32,
      0.4,
      at.x,
      at.y,
      rx,
    );
    shade.addColorStop(0, lit);
    shade.addColorStop(0.45, mid);
    shade.addColorStop(1, dark);
    ctx.fillStyle = shade;
    ctx.beginPath();
    ctx.ellipse(at.x, at.y, rx, ry, angle, 0, Math.PI * 2);
    ctx.fill();
  }
  if (ridges > 0 && width > 11) {
    ctx.lineWidth = Math.max(0.6, width * 0.035);
    ctx.strokeStyle = "rgba(48, 10, 14, 0.28)";
    for (let index = 1; index < ridges; index += 1) {
      const t = index / ridges;
      const at = along(points, t);
      const prev = along(points, Math.max(0, t - 0.03));
      const next = along(points, Math.min(0.999, t + 0.03));
      const angle = Math.atan2(next.y - prev.y, next.x - prev.x);
      const nx = -Math.sin(angle);
      const ny = Math.cos(angle);
      const span = width * 0.26;
      ctx.beginPath();
      ctx.moveTo(at.x - nx * span, at.y - ny * span);
      ctx.lineTo(at.x + nx * span, at.y + ny * span);
      ctx.stroke();
    }
  }
}

function heartBody(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number) {
  ctx.beginPath();
  ctx.moveTo(cx + s * 0.1, cy + s * 0.72);
  ctx.bezierCurveTo(cx - s * 0.06, cy + s * 0.7, cx - s * 0.28, cy + s * 0.48, cx - s * 0.4, cy + s * 0.22);
  ctx.bezierCurveTo(cx - s * 0.48, cy + s * 0.04, cx - s * 0.42, cy - s * 0.12, cx - s * 0.24, cy - s * 0.14);
  ctx.bezierCurveTo(cx - s * 0.1, cy - s * 0.08, cx + s * 0.06, cy - s * 0.1, cx + s * 0.16, cy - s * 0.08);
  ctx.bezierCurveTo(cx + s * 0.34, cy - s * 0.04, cx + s * 0.5, cy + s * 0.16, cx + s * 0.46, cy + s * 0.38);
  ctx.bezierCurveTo(cx + s * 0.4, cy + s * 0.56, cx + s * 0.26, cy + s * 0.72, cx + s * 0.1, cy + s * 0.72);
  ctx.closePath();
}

function drawLungs(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  s: number,
  time: number,
  warmth: number,
) {
  const breath = 1 + Math.sin(time * 0.85) * 0.03;
  ctx.save();
  for (const side of [-1, 1]) {
    const lx = cx + side * s * 0.5;
    const ly = cy + s * 0.08;
    ctx.save();
    ctx.translate(lx, ly);
    ctx.scale(breath * 1.08, breath * 1.28);
    ctx.beginPath();
    ctx.moveTo(side * s * 0.02, -s * 0.4);
    ctx.bezierCurveTo(side * s * 0.18, -s * 0.44, side * s * 0.34, -s * 0.26, side * s * 0.3, -s * 0.12);
    ctx.bezierCurveTo(side * s * 0.4, -s * 0.06, side * s * 0.36, s * 0.1, side * s * 0.28, s * 0.22);
    ctx.bezierCurveTo(side * s * 0.18, s * 0.36, side * s * 0.04, s * 0.4, -side * s * 0.02, s * 0.26);
    ctx.bezierCurveTo(-side * s * 0.12, s * 0.12, -side * s * 0.18, -s * 0.02, -side * s * 0.12, -s * 0.16);
    ctx.bezierCurveTo(-side * s * 0.06, -s * 0.3, side * s * 0.0, -s * 0.36, side * s * 0.02, -s * 0.4);
    ctx.closePath();
    const lung = ctx.createRadialGradient(-side * s * 0.04, -s * 0.12, 4, side * s * 0.04, s * 0.04, s * 0.48);
    lung.addColorStop(0, `rgba(214, 164, 154, ${0.62 + warmth * 0.16})`);
    lung.addColorStop(0.55, `rgba(150, 96, 100, ${0.4 + warmth * 0.12})`);
    lung.addColorStop(1, "rgba(70, 36, 40, 0.05)");
    ctx.fillStyle = lung;
    ctx.fill();
    ctx.save();
    ctx.clip();
    for (let dot = 0; dot < 56; dot += 1) {
      const px = (hash(dot + side * 5) - 0.45) * s * 0.5;
      const py = (hash(dot + 9) - 0.4) * s * 0.7;
      ctx.fillStyle = hash(dot + 2) > 0.45 ? "rgba(110, 42, 46, 0.22)" : "rgba(240, 206, 196, 0.16)";
      ctx.beginPath();
      ctx.arc(px, py, 0.9 + hash(dot + 4) * 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = `rgba(86, 40, 44, ${0.4 + warmth * 0.15})`;
    ctx.lineWidth = 1.15;
    ctx.beginPath();
    ctx.moveTo(side * s * 0.02, -s * 0.22);
    ctx.bezierCurveTo(side * s * 0.08, -s * 0.06, side * s * 0.04, s * 0.08, side * s * 0.0, s * 0.22);
    ctx.moveTo(side * s * 0.04, -s * 0.1);
    ctx.quadraticCurveTo(side * s * 0.16, -s * 0.02, side * s * 0.2, s * 0.08);
    ctx.moveTo(side * s * 0.02, s * 0.02);
    ctx.quadraticCurveTo(side * s * 0.12, s * 0.1, side * s * 0.14, s * 0.2);
    ctx.stroke();
    ctx.strokeStyle = "rgba(120, 64, 60, 0.45)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-side * s * 0.06, -s * 0.02);
    ctx.quadraticCurveTo(side * s * 0.1, s * 0.04, side * s * 0.24, s * 0.02);
    ctx.stroke();
    ctx.restore();
    ctx.restore();
  }
  ctx.restore();
}

function rel(cx: number, cy: number, s: number, pairs: number[]) {
  const points: { x: number; y: number }[] = [];
  for (let index = 0; index < pairs.length; index += 2) {
    points.push({ x: cx + s * (pairs[index] ?? 0), y: cy + s * (pairs[index + 1] ?? 0) });
  }
  return points;
}

function drawHeart(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number, warmth: number, pulse: number, time: number) {
  const pipes = vessels(cx, cy, s);
  const squeeze = pulse * 0.055;
  const muscle = mix("#7c1a22", "#9c242c", warmth * 0.4);
  const deep = mix("#2c080c", "#3c1014", warmth * 0.25);
  const lit = mix("#c43c34", "#e06858", warmth * 0.5);
  const arterialLit = mix("#e07064", "#f09080", warmth * 0.45);
  const arterialMid = mix("#9a242c", "#c43c38", warmth * 0.5);
  const arterialDark = mix("#4a1016", "#6a1820", warmth * 0.3);

  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
  ctx.beginPath();
  ctx.ellipse(cx + s * 0.1, cy + s * 0.84, s * 0.34, s * 0.045, 0.06, 0, Math.PI * 2);
  ctx.fill();

  ctx.translate(cx, cy + s * 0.16);
  ctx.scale(1 + squeeze * 0.22, 1 - squeeze);
  ctx.translate(-cx, -(cy + s * 0.16));

  drawVessel(ctx, pipes.veins, s * 0.05, arterialLit, arterialMid, arterialDark, 0);
  drawVessel(ctx, pipes.aorta, s * 0.13, arterialLit, arterialMid, arterialDark, 8);
  drawVessel(ctx, pipes.branch, s * 0.05, arterialLit, arterialMid, arterialDark, 3);
  drawVessel(ctx, pipes.vena, s * 0.074, mix("#a05058", "#c47870", warmth * 0.35), mix("#6a2830", "#8a3840", warmth * 0.3), "#3a1418", 4);

  const body = ctx.createRadialGradient(cx - s * 0.12, cy - s * 0.16, s * 0.04, cx + s * 0.08, cy + s * 0.16, s * 0.78);
  body.addColorStop(0, lit);
  body.addColorStop(0.22, muscle);
  body.addColorStop(0.62, "#641418");
  body.addColorStop(1, deep);
  heartBody(ctx, cx, cy, s);
  ctx.fillStyle = body;
  ctx.fill();
  const rim = ctx.createLinearGradient(cx - s * 0.4, cy - s * 0.3, cx + s * 0.45, cy + s * 0.5);
  rim.addColorStop(0, "rgba(255, 214, 202, 0.42)");
  rim.addColorStop(0.35, "rgba(196, 64, 56, 0.08)");
  rim.addColorStop(1, "rgba(24, 4, 6, 0.55)");
  ctx.strokeStyle = rim;
  ctx.lineWidth = Math.max(1.4, s * 0.018);
  ctx.stroke();

  ctx.save();
  heartBody(ctx, cx, cy, s);
  ctx.clip();

  ctx.fillStyle = "rgba(58, 10, 14, 0.38)";
  ctx.beginPath();
  ctx.ellipse(cx + s * 0.16, cy + s * 0.22, s * 0.22, s * 0.26, 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(176, 48, 42, 0.16)";
  ctx.beginPath();
  ctx.ellipse(cx - s * 0.08, cy - s * 0.02, s * 0.2, s * 0.16, -0.4, 0, Math.PI * 2);
  ctx.fill();

  for (let index = 0; index < 54; index += 1) {
    const px = cx + (hash(index + 2) - 0.48) * s * 0.72;
    const py = cy + (hash(index + 6) - 0.32) * s * 0.7;
    const angle = Math.atan2(py - (cy + s * 0.05), px - cx) + 1.2 + Math.sin(time * 1.3 + index) * 0.05;
    ctx.strokeStyle = hash(index) > 0.5 ? "rgba(92, 18, 22, 0.28)" : "rgba(196, 78, 68, 0.2)";
    ctx.lineWidth = Math.max(0.6, s * 0.004);
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + Math.cos(angle) * s * 0.055, py + Math.sin(angle) * s * 0.028);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(42, 8, 12, 0.28)";
  ctx.lineWidth = Math.max(1.2, s * 0.012);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.22, cy + s * 0.04);
  ctx.quadraticCurveTo(cx + s * 0.02, cy + s * 0.02, cx + s * 0.24, cy + s * 0.08);
  ctx.moveTo(cx + s * 0.02, cy + s * 0.06);
  ctx.quadraticCurveTo(cx + s * 0.04, cy + s * 0.24, cx + s * 0.12, cy + s * 0.4);
  ctx.stroke();

  ctx.fillStyle = "rgba(226, 198, 146, 0.55)";
  const fat: [number, number, number, number][] = [
    [-0.16, 0.05, 0.034, 0.016],
    [-0.06, 0.03, 0.028, 0.014],
    [0.04, 0.04, 0.03, 0.013],
    [0.14, 0.07, 0.026, 0.012],
    [0.02, 0.14, 0.016, 0.01],
    [0.06, 0.24, 0.014, 0.008],
  ];
  fat.forEach(([fx, fy, rx, ry], index) => {
    ctx.beginPath();
    ctx.ellipse(cx + s * fx, cy + s * fy, s * rx, s * ry, hash(index) * 2 - 0.4, 0, Math.PI * 2);
    ctx.fill();
  });

  const coronaryLit = mix("#d06054", "#e88878", warmth * 0.4);
  const coronaryMid = "#7a1c24";
  const coronaryDark = "#3a0c10";
  drawVessel(ctx, rel(cx, cy, s, [0.02, 0.04, 0.0, 0.22, 0.06, 0.42, 0.1, 0.64]), s * 0.016, coronaryLit, coronaryMid, coronaryDark, 0);
  drawVessel(ctx, rel(cx, cy, s, [0.0, 0.1, 0.12, 0.12, 0.26, 0.18]), s * 0.012, coronaryLit, coronaryMid, coronaryDark, 0);
  drawVessel(ctx, rel(cx, cy, s, [0.02, 0.22, 0.12, 0.26, 0.22, 0.32]), s * 0.01, coronaryLit, coronaryMid, coronaryDark, 0);
  drawVessel(ctx, rel(cx, cy, s, [-0.02, 0.04, -0.16, 0.08, -0.28, 0.18]), s * 0.013, coronaryLit, coronaryMid, coronaryDark, 0);
  drawVessel(ctx, rel(cx, cy, s, [0.04, 0.02, 0.16, 0.06, 0.3, 0.14]), s * 0.012, coronaryLit, coronaryMid, coronaryDark, 0);

  const wet = ctx.createRadialGradient(cx - s * 0.1, cy - s * 0.1, 2, cx - s * 0.02, cy + s * 0.02, s * 0.26);
  wet.addColorStop(0, `rgba(255, 226, 214, ${0.2 + pulse * 0.08})`);
  wet.addColorStop(0.45, "rgba(255, 190, 176, 0.05)");
  wet.addColorStop(1, "rgba(255, 190, 176, 0)");
  ctx.fillStyle = wet;
  ctx.fillRect(cx - s, cy - s, s * 2, s * 2);
  const glints: [number, number, number, number, number][] = [
    [-0.14, -0.04, 0.055, 0.016, -0.7],
    [0.08, 0.06, 0.04, 0.012, 0.4],
    [-0.02, 0.18, 0.03, 0.01, 0.2],
    [0.16, 0.22, 0.028, 0.009, 0.8],
    [-0.2, 0.1, 0.026, 0.008, -0.4],
  ];
  glints.forEach(([gx, gy, rx, ry, rot], index) => {
    ctx.fillStyle = `rgba(255, 236, 228, ${0.18 + pulse * 0.1 - index * 0.02})`;
    ctx.beginPath();
    ctx.ellipse(cx + s * gx, cy + s * gy, s * rx, s * ry, rot, 0, Math.PI * 2);
    ctx.fill();
  });
  for (let index = 0; index < 10; index += 1) {
    ctx.fillStyle = `rgba(255, 232, 224, ${0.15 + hash(index + 4) * 0.2})`;
    ctx.beginPath();
    ctx.arc(cx + (hash(index + 21) - 0.5) * s * 0.5, cy + (hash(index + 33) - 0.35) * s * 0.55, 0.7 + hash(index) * 0.8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.24, cy + s * 0.0);
  ctx.bezierCurveTo(cx - s * 0.46, cy - s * 0.06, cx - s * 0.5, cy + s * 0.08, cx - s * 0.34, cy + s * 0.12);
  ctx.bezierCurveTo(cx - s * 0.24, cy + s * 0.12, cx - s * 0.2, cy + s * 0.04, cx - s * 0.22, cy + s * 0.0);
  ctx.closePath();
  const ear = ctx.createLinearGradient(cx - s * 0.48, cy - s * 0.02, cx - s * 0.22, cy + s * 0.1);
  ear.addColorStop(0, lit);
  ear.addColorStop(1, muscle);
  ctx.fillStyle = ear;
  ctx.fill();
  ctx.clip();
  ctx.strokeStyle = "rgba(70, 16, 18, 0.4)";
  ctx.lineWidth = 0.7;
  for (let line = 0; line < 3; line += 1) {
    ctx.beginPath();
    ctx.moveTo(cx - s * (0.26 + line * 0.04), cy + s * 0.0);
    ctx.quadraticCurveTo(cx - s * (0.34 + line * 0.02), cy + s * 0.05, cx - s * (0.3 + line * 0.02), cy + s * 0.1);
    ctx.stroke();
  }
  ctx.restore();

  drawVessel(ctx, pipes.pulmonary, s * 0.088, arterialLit, arterialMid, arterialDark, 4);
  drawVessel(ctx, pipes.lungLeft, s * 0.042, arterialLit, arterialMid, arterialDark, 0);
  drawVessel(ctx, pipes.lungRight, s * 0.042, arterialLit, arterialMid, arterialDark, 0);

  ctx.restore();
}

function drawHelix(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  height: number,
  time: number,
  alpha: number,
) {
  ctx.save();
  ctx.lineWidth = 1.4;
  const left: { x: number; y: number }[] = [];
  const right: { x: number; y: number }[] = [];
  for (const side of [0, Math.PI]) {
    const store = side === 0 ? left : right;
    ctx.beginPath();
    ctx.strokeStyle = `rgba(214, 196, 168, ${alpha})`;
    for (let step = 0; step <= 26; step += 1) {
      const t = step / 26;
      const yy = y + t * height;
      const xx = x + Math.sin(t * 8 + time * 0.22 + side) * 16;
      store.push({ x: xx, y: yy });
      if (step === 0) ctx.moveTo(xx, yy);
      else ctx.lineTo(xx, yy);
    }
    ctx.stroke();
  }
  ctx.strokeStyle = `rgba(196, 168, 140, ${alpha * 0.7})`;
  for (let step = 2; step < left.length; step += 3) {
    const a = left[step];
    const b = right[step];
    if (!a || !b) continue;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawCell(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, dividing: boolean) {
  ctx.save();
  const glow = ctx.createRadialGradient(x, y, radius * 0.2, x, y, radius * 1.35);
  glow.addColorStop(0, "rgba(214, 206, 186, 0.08)");
  glow.addColorStop(1, "rgba(214, 206, 186, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, radius * 1.35, 0, Math.PI * 2);
  ctx.fill();

  const body = ctx.createRadialGradient(x - radius * 0.28, y - radius * 0.3, 2, x, y, radius);
  body.addColorStop(0, "rgba(244, 236, 220, 0.42)");
  body.addColorStop(0.62, "rgba(110, 146, 122, 0.22)");
  body.addColorStop(1, "rgba(16, 32, 26, 0.04)");
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = body;
  ctx.fill();
  ctx.strokeStyle = "rgba(236, 226, 206, 0.62)";
  ctx.lineWidth = 1.15;
  ctx.stroke();

  const nucleusX = x - radius * 0.08 + (dividing ? radius * 0.22 : 0);
  ctx.beginPath();
  ctx.arc(nucleusX, y + radius * 0.04, radius * 0.28, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(110, 52, 64, 0.78)";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(nucleusX - radius * 0.06, y, radius * 0.08, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(244, 220, 200, 0.7)";
  ctx.fill();
  if (dividing) {
    ctx.beginPath();
    ctx.arc(x - radius * 0.28, y + radius * 0.02, radius * 0.22, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(110, 52, 64, 0.7)";
    ctx.fill();
    ctx.strokeStyle = "rgba(232, 220, 196, 0.35)";
    ctx.beginPath();
    ctx.moveTo(x, y - radius * 0.7);
    ctx.quadraticCurveTo(x + radius * 0.08, y, x, y + radius * 0.7);
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(168, 96, 88, 0.55)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(x + radius * 0.32, y - radius * 0.18, radius * 0.16, radius * 0.07, 0.8, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawBloom(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  open: number,
  hue: string,
  time: number,
  petals: number,
) {
  const spread = 14 + open * (18 + petals);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.sin(time * 0.18 + x * 0.01) * 0.05);
  const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, spread * 2.4);
  glow.addColorStop(0, hue);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.globalAlpha = 0.2 + open * 0.4;
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, spread * 2.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.45 + open * 0.5;
  for (let petal = 0; petal < petals; petal += 1) {
    ctx.rotate((Math.PI * 2) / petals);
    ctx.fillStyle = hue;
    ctx.beginPath();
    ctx.ellipse(spread * 0.58, 0, spread * 0.7, spread * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#f4ead8";
  ctx.beginPath();
  ctx.arc(0, 0, 2.4 + open * 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCapsule(ctx: CanvasRenderingContext2D, x: number, y: number, open: number, time: number) {
  ctx.save();
  ctx.translate(x, y + Math.sin(time * 0.4) * 3);
  const rx = 22 + open * 12;
  const ry = 30 + open * 14;
  const glass = ctx.createLinearGradient(-rx, -ry, rx, ry);
  glass.addColorStop(0, "rgba(236, 226, 206, 0.2)");
  glass.addColorStop(0.5, "rgba(120, 96, 88, 0.12)");
  glass.addColorStop(1, "rgba(236, 226, 206, 0.05)");
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = glass;
  ctx.fill();
  ctx.strokeStyle = `rgba(236, 226, 206, ${0.35 + open * 0.4})`;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(-2, 2, 5 + open * 3, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(122, 58, 66, 0.75)";
  ctx.fill();
  ctx.restore();
}

function drawLeaf(ctx: CanvasRenderingContext2D, x: number, y: number, open: number, time: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.5 + Math.sin(time * 0.3) * 0.05);
  ctx.fillStyle = `rgba(224, 206, 168, ${0.62 + open * 0.35})`;
  ctx.beginPath();
  ctx.ellipse(16, 0, 28 + open * 12, 10 + open * 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(90, 48, 44, 0.45)";
  ctx.beginPath();
  ctx.moveTo(-6, 0);
  ctx.lineTo(26, 0);
  ctx.stroke();
  ctx.restore();
}

function drawMemory(
  ctx: CanvasRenderingContext2D,
  id: string,
  x: number,
  y: number,
  open: number,
  time: number,
) {
  if (id === "words") {
    drawCapsule(ctx, x, y, open, time);
    return;
  }
  if (id === "smart") {
    drawHelix(ctx, x, y - 42, 84, time, 0.35 + open * 0.55);
    return;
  }
  if (id === "kind") {
    drawLeaf(ctx, x, y, open, time);
    return;
  }
  const hue =
    id === "grade"
      ? `rgba(212, 168, 120, ${0.5 + open * 0.45})`
      : id === "love" || id === "place"
        ? `rgba(176, 92, 96, ${0.45 + open * 0.5})`
        : id === "smile"
          ? `rgba(224, 196, 140, ${0.45 + open * 0.5})`
          : `rgba(214, 196, 168, ${0.4 + open * 0.45})`;
  drawBloom(ctx, x, id === "grade" ? y - 18 : y, open, hue, time, id === "grade" ? 8 : id === "smile" ? 7 : 6);
}

function drawNeuron(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  time: number,
  life: number,
) {
  ctx.save();
  ctx.strokeStyle = `rgba(196, 206, 176, ${0.2 + life * 0.4})`;
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.stroke();
  const tips = [
    [x - 46, y - 18],
    [x - 20, y - 36],
    [x + 38, y - 10],
    [x + 70, y + 16],
  ];
  for (const [tx, ty] of tips) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo((x + tx) / 2, y - 12, tx, ty);
    ctx.stroke();
  }
  if (life > 0.25) {
    const spark = (Math.sin(time * 1.3 + x) + 1) / 2;
    ctx.fillStyle = `rgba(232, 214, 176, ${spark * life * 0.85})`;
    ctx.beginPath();
    ctx.arc(x + spark * 60, y + 6, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawPlant(
  ctx: CanvasRenderingContext2D,
  x: number,
  base: number,
  height: number,
  open: number,
  sway: number,
) {
  ctx.save();
  ctx.strokeStyle = mix("#14281e", "#3d6a48", Math.max(open, 0.35));
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(x, base);
  ctx.quadraticCurveTo(x + 10, base - height * 0.48, x + sway, base - height);
  ctx.stroke();
  for (const t of [0.28, 0.48, 0.68, 0.84]) {
    const ly = base - height * t;
    const lx = x + sway * t;
    const side = t > 0.5 ? 1 : -1;
    const leaf = 11 + open * 13;
    ctx.fillStyle = `rgba(36, 78, 56, ${0.4 + open * 0.45})`;
    ctx.beginPath();
    ctx.ellipse(lx + side * leaf * 0.7, ly, leaf, 3.4 + open * 1.6, side * 0.65, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(92, 140, 96, ${0.25 + open * 0.35})`;
    ctx.beginPath();
    ctx.ellipse(lx + side * leaf * 0.55, ly - 0.6, leaf * 0.45, 1.4, side * 0.65, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(214, 206, 170, 0.28)";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.lineTo(lx + side * leaf, ly);
    ctx.stroke();
  }
  ctx.fillStyle = `rgba(232, 206, 160, ${0.35 + open * 0.6})`;
  ctx.beginPath();
  ctx.ellipse(x + sway, base - height - 3, 2.2 + open * 5, 3 + open * 4, 0, 0, Math.PI * 2);
  ctx.fill();
  if (open > 0.35) {
    ctx.globalAlpha = open;
    for (let petal = 0; petal < 5; petal += 1) {
      const angle = (petal / 5) * Math.PI * 2 + sway * 0.02;
      ctx.fillStyle = "rgba(196, 92, 96, 0.75)";
      ctx.beginPath();
      ctx.ellipse(
        x + sway + Math.cos(angle) * (5 + open * 4),
        base - height - 3 + Math.sin(angle) * (4 + open * 3),
        2.4 + open * 2,
        1.5,
        angle,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawButterfly(ctx: CanvasRenderingContext2D, x: number, y: number, time: number, life: number) {
  const wing = 0.35 + Math.abs(Math.sin(time * 9)) * 0.65;
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = 0.4 + life * 0.55;
  ctx.fillStyle = "rgba(232, 196, 140, 0.9)";
  ctx.beginPath();
  ctx.ellipse(-12 * wing, -2, 14 * wing, 8, -0.5, 0, Math.PI * 2);
  ctx.ellipse(12 * wing, -2, 14 * wing, 8, 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(176, 96, 88, 0.8)";
  ctx.beginPath();
  ctx.ellipse(-9 * wing, 5, 9 * wing, 5, -0.3, 0, Math.PI * 2);
  ctx.ellipse(9 * wing, 5, 9 * wing, 5, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2c1c18";
  ctx.fillRect(-0.7, -7, 1.4, 14);
  ctx.restore();
}

function drawEcg(ctx: CanvasRenderingContext2D, width: number, height: number, time: number, chaos: number) {
  const y = height - 78;
  const left = width * 0.18;
  const right = width * 0.82;
  ctx.save();
  ctx.strokeStyle = "rgba(196, 148, 132, 0.14)";
  ctx.lineWidth = 1;
  for (let gx = left; gx <= right; gx += 18) {
    ctx.beginPath();
    ctx.moveTo(gx, y - 28);
    ctx.lineTo(gx, y + 22);
    ctx.stroke();
  }
  for (let gy = -24; gy <= 18; gy += 14) {
    ctx.beginPath();
    ctx.moveTo(left, y + gy);
    ctx.lineTo(right, y + gy);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.strokeStyle = chaos > 0.15 ? "#e0a090" : "rgba(196, 148, 132, 0.85)";
  ctx.lineWidth = 1.6;
  for (let x = left; x <= right; x += 3) {
    const u = (x - left) / (right - left);
    const local = (u * 2.6 + time * (chaos > 0 ? 1.6 : 0.22)) % 1;
    let spike = 0;
    if (local > 0.12 && local < 0.18) spike = -4;
    if (local > 0.34 && local < 0.37) spike = 6;
    if (local > 0.37 && local < 0.41) spike = -16;
    if (local > 0.41 && local < 0.45) spike = 7;
    if (local > 0.58 && local < 0.7) spike = -5;
    if (chaos > 0) spike += Math.sin(u * 48 + time * 22) * chaos * 14;
    if (x === left) ctx.moveTo(x, y + spike);
    else ctx.lineTo(x, y + spike);
  }
  ctx.stroke();
  const speed = chaos > 0 ? 1.6 : 0.22;
  const head = (time * speed) % 1;
  const headX = left + head * (right - left);
  const localHead = (head * 2.6 + time * speed) % 1;
  let spike = 0;
  if (localHead > 0.12 && localHead < 0.18) spike = -4;
  if (localHead > 0.34 && localHead < 0.37) spike = 6;
  if (localHead > 0.37 && localHead < 0.41) spike = -16;
  if (localHead > 0.41 && localHead < 0.45) spike = 7;
  if (localHead > 0.58 && localHead < 0.7) spike = -5;
  if (chaos > 0) spike += Math.sin(head * 48 + time * 22) * chaos * 14;
  ctx.fillStyle = "#f4d2c4";
  ctx.beginPath();
  ctx.arc(headX, y + spike, 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawMembrane(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, time: number) {
  ctx.save();
  ctx.beginPath();
  const steps = 90;
  for (let index = 0; index <= steps; index += 1) {
    const angle = (index / steps) * Math.PI * 2;
    const wobble = 1 + Math.sin(angle * 3 + time * 0.35) * 0.03 + Math.sin(angle * 6 - time * 0.2) * 0.012;
    const x = cx + Math.cos(angle) * rx * wobble;
    const y = cy + Math.sin(angle) * ry * wobble;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.strokeStyle = "rgba(226, 196, 160, 0.28)";
  ctx.lineWidth = 18;
  ctx.stroke();
  ctx.strokeStyle = "rgba(255, 236, 214, 0.45)";
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.fillStyle = "rgba(255, 228, 200, 0.55)";
  for (let index = 0; index <= steps; index += 4) {
    const angle = (index / steps) * Math.PI * 2;
    const wobble = 1 + Math.sin(angle * 3 + time * 0.35) * 0.03;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(angle) * rx * wobble, cy + Math.sin(angle) * ry * wobble, 2.1, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function LivingField({
  teacher,
  covered,
  reducedMotion,
  onLeave,
}: {
  teacher: Teacher;
  covered: boolean;
  reducedMotion: boolean;
  onLeave: () => void;
}) {
  const sound = useSound();
  const rtRef = useRef<Runtime | null>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useStage((ctx, width, height, dt) => {
    const rt = (rtRef.current ??= createRuntime());
    if (!rt.fontsReady) {
      rt.fonts = readFonts();
      rt.fontsReady = true;
    }
    const quiet = Boolean(rt.focus);
    const motion = reducedMotion ? 0 : quiet ? dt * 0.42 : dt;
    rt.time += reducedMotion ? dt * 0.15 : quiet ? dt * 0.42 : dt;
    rt.reduced = reducedMotion;
    const life = rt.opened.size / garden.length;
    const memoryFocus = rt.focus && rt.focus !== "letter" && rt.focus !== "dedication" ? rt.focus : null;
    const focusSpot = memoryFocus ? placeOf(memoryFocus, width, height) : null;
    const heartFocus = memoryFocus === "place" || memoryFocus === "love";
    const gradeFocus = memoryFocus === "grade";
    const warmthTarget = Math.min(
      1,
      (memoryFocus === "smile" || heartFocus ? 0.96 : 0.08 + life * 0.78) + (rt.opened.has("smile") ? 0.14 : 0),
    );
    rt.warmth += (warmthTarget - rt.warmth) * Math.min(1, dt * 0.7);
    const zoomTarget = rt.vista || rt.focus === "dedication" ? 0.78 : heartFocus ? 1.18 : gradeFocus ? 1.02 : focusSpot ? 1.06 : 1;
    rt.zoom += (zoomTarget - rt.zoom) * Math.min(1, dt * 1.4);
    const panTargetX = heartFocus || gradeFocus || !focusSpot ? 0 : (focusSpot.x - width / 2) * 0.2;
    const panTargetY = heartFocus ? height * 0.04 : gradeFocus || !focusSpot ? 0 : (focusSpot.y - height / 2) * 0.16;
    rt.panX += (panTargetX - rt.panX) * Math.min(1, dt * 1.4);
    rt.panY += (panTargetY - rt.panY) * Math.min(1, dt * 1.4);
    const idle = focusSpot || rt.focus ? 0 : 1;
    const driftX = Math.sin(rt.time * 0.15) * 6 * idle;
    const driftY = Math.cos(rt.time * 0.12) * 4 * idle;
    rt.driftX = driftX;
    rt.driftY = driftY;
    if (layerRef.current) {
      layerRef.current.style.transform = `translate(${-rt.zoom * rt.panX + driftX}px, ${-rt.zoom * rt.panY + driftY}px) scale(${rt.zoom})`;
    }

    const fast = rt.time < rt.chaosUntil;
    const pulse = rt.reduced ? 0.18 : beatOf(rt.time, fast);
    if (rt.focus === "grade" && rt.time - rt.lastThump > (rt.reduced ? 1.6 : 1.12)) {
      rt.lastThump = rt.time;
      sound.thump();
    }
    while (rt.beeps.length && rt.beeps[0] !== undefined && rt.time >= rt.beeps[0]) {
      rt.beeps.shift();
      sound.beep();
    }

    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(rt.zoom, rt.zoom);
    ctx.translate(-width / 2 - rt.panX + driftX / rt.zoom, -height / 2 - rt.panY + driftY / rt.zoom);

    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, mix("#020203", "#120c0e", rt.warmth * 0.45));
    sky.addColorStop(0.46, mix("#070908", "#1a1210", rt.warmth * 0.32));
    sky.addColorStop(1, mix("#0a100e", "#1c2820", Math.max(life, rt.warmth) * 0.85));
    ctx.fillStyle = sky;
    ctx.fillRect(-120, -120, width + 240, height + 240);

    ctx.save();
    for (const side of [-1, 1]) {
      const wall = ctx.createRadialGradient(width * (0.5 + side * 0.46), height * 0.46, 20, width * (0.5 + side * 0.46), height * 0.48, width * 0.28);
      wall.addColorStop(0, `rgba(42, 22, 24, ${0.28 + life * 0.12})`);
      wall.addColorStop(1, "rgba(42, 22, 24, 0)");
      ctx.fillStyle = wall;
      ctx.fillRect(0, 0, width, height);
    }
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.22;
    drawCell(ctx, width * 0.07, height * 0.12, 28, false);
    drawCell(ctx, width * 0.93, height * 0.11, 32, life > 0.4);
    ctx.globalAlpha = 1;
    ctx.restore();

    const hx = width * 0.5;
    const hy = height * 0.44;
    const scale = Math.min(width, height) * (width < 760 ? 0.24 : 0.32);

    ctx.fillStyle = mix("#081410", "#163026", life * 0.9);
    ctx.beginPath();
    ctx.moveTo(-40, height * 0.84);
    for (let x = -40; x <= width + 40; x += 22) {
      ctx.lineTo(x, height * 0.74 - Math.sin(x * 0.004) * 10 - life * 8);
    }
    ctx.lineTo(width + 40, height + 40);
    ctx.lineTo(-40, height + 40);
    ctx.fill();
    ctx.fillStyle = mix("#07110e", "#1d3328", life);
    ctx.beginPath();
    ctx.moveTo(-40, height * 0.92);
    for (let x = -40; x <= width + 40; x += 18) {
      ctx.lineTo(x, height * 0.84 - Math.sin(x * 0.007 + 0.6) * 7);
    }
    ctx.lineTo(width + 40, height + 40);
    ctx.lineTo(-40, height + 40);
    ctx.fill();
    ctx.save();
    ctx.strokeStyle = `rgba(120, 48, 46, ${0.08 + life * 0.12})`;
    ctx.lineWidth = 1;
    for (let vein = 0; vein < 9; vein += 1) {
      const x = width * (0.06 + vein * 0.1);
      if (Math.abs(x - width * 0.5) < Math.min(width, height) * 0.12) continue;
      ctx.beginPath();
      ctx.moveTo(x, height);
      ctx.quadraticCurveTo(x + Math.sin(vein) * 18, height * 0.9, x + (vein % 2 ? 16 : -16), height * 0.78);
      ctx.stroke();
    }
    ctx.restore();
    const reflected = ctx.createRadialGradient(hx, hy + scale * 0.7, 8, hx, height * 0.8, scale * 1.3);
    reflected.addColorStop(0, `rgba(150, 42, 36, ${0.08 + rt.warmth * 0.1})`);
    reflected.addColorStop(1, "rgba(150, 42, 36, 0)");
    ctx.fillStyle = reflected;
    ctx.fillRect(0, height * 0.62, width, height * 0.4);

    drawHelix(ctx, width * 0.08, height * 0.16, height * 0.28, rt.time, 0.16 + life * 0.35);
    drawHelix(ctx, width * 0.92, height * 0.2, height * 0.24, rt.time + 2, 0.14 + life * 0.3);
    drawNeuron(ctx, width * 0.2, height * 0.18, rt.time, life);
    drawNeuron(ctx, width * 0.78, height * 0.16, rt.time + 1.2, life);

    ctx.save();
    ctx.lineCap = "round";
    ctx.strokeStyle = `rgba(92, 32, 36, ${0.12 + life * 0.16})`;
    for (const side of [-1, 1]) {
      const rootX = side < 0 ? 0 : width;
      const rootY = height * 0.36;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(rootX, rootY);
      ctx.quadraticCurveTo(width * (0.5 + side * 0.22), rootY + 10, width * (0.5 + side * 0.16), height * 0.42);
      ctx.stroke();
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(width * (0.5 + side * 0.28), rootY - height * 0.04);
      ctx.quadraticCurveTo(width * (0.5 + side * 0.2), rootY + 8, width * (0.5 + side * 0.18), height * 0.4);
      ctx.moveTo(width * (0.5 + side * 0.24), height * 0.3);
      ctx.quadraticCurveTo(width * (0.5 + side * 0.16), height * 0.34, width * (0.5 + side * 0.14), height * 0.4);
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.lineCap = "round";
    const ribStop = width < 760 ? 0.18 : 0.24;
    for (let rib = 0; rib < 4; rib += 1) {
      const y = hy - scale * 0.05 + rib * scale * 0.2;
      ctx.strokeStyle = `rgba(196, 176, 154, ${0.22 + life * 0.1})`;
      ctx.lineWidth = width < 760 ? 4 : 8;
      ctx.beginPath();
      ctx.moveTo(0, y + scale * 0.16);
      ctx.quadraticCurveTo(width * ribStop * 0.45, y - scale * 0.1, width * ribStop, y + scale * 0.04);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(width, y + scale * 0.14);
      ctx.quadraticCurveTo(width * (1 - ribStop * 0.45), y - scale * 0.08, width * (1 - ribStop), y + scale * 0.03);
      ctx.stroke();
    }
    ctx.restore();

    const glowReach = scale * (2.1 + life * 0.35);
    const glow = ctx.createRadialGradient(hx, hy - scale * 0.05, scale * 0.15, hx, hy, glowReach);
    glow.addColorStop(0, `rgba(186, 64, 52, ${0.16 + rt.warmth * 0.28 + (gradeFocus ? 0.12 : 0)})`);
    glow.addColorStop(0.4, `rgba(90, 28, 26, ${0.05 + rt.warmth * 0.06})`);
    glow.addColorStop(1, "rgba(90, 28, 26, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(hx, hy, glowReach, 0, Math.PI * 2);
    ctx.fill();

    const heartScale = scale;
    drawLungs(ctx, hx, hy, heartScale, rt.time, rt.warmth);
    drawHeart(ctx, hx, hy, heartScale, rt.warmth, pulse, rt.time);
    const pipes = vessels(hx, hy, heartScale);
    const showRight = rt.flow !== 1;
    const showLeft = rt.flow !== 0;

    if (rt.time > rt.dropAt) {
      rt.dropAt = rt.time + 0.55;
      if (showRight) rt.drops.push({ route: "vena", t: 0 }, { route: "pulmonary", t: 0 });
      if (showLeft) rt.drops.push({ route: "veins", t: 0 }, { route: "aorta", t: 0 });
      rt.drops = rt.drops.filter((drop) => drop.t < 1).slice(-28);
    }
    for (const drop of rt.drops) {
      drop.t += motion > 0 ? 0.008 : 0;
      const path = pipes[drop.route];
      const at = along(path, drop.t);
      const oxygenated = drop.route === "aorta" || drop.route === "veins";
      ctx.save();
      ctx.translate(at.x, at.y);
      ctx.rotate(drop.t * 6);
      ctx.fillStyle = oxygenated ? "rgba(186, 52, 46, 0.95)" : "rgba(78, 58, 74, 0.95)";
      ctx.beginPath();
      ctx.ellipse(0, 0, 3.6, 2.1, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = oxygenated ? "rgba(90, 22, 24, 0.45)" : "rgba(36, 28, 36, 0.45)";
      ctx.beginPath();
      ctx.ellipse(0, 0, 1.15, 0.65, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    const cells = 7 + Math.round(life * 12);
    for (let index = 0; index < cells; index += 1) {
      const drift = rt.reduced ? 0 : Math.sin(rt.time * 0.22 + index) * 14;
      const x = width * (0.08 + hash(index) * 0.84) + drift;
      const y = height * (0.18 + hash(index + 3) * 0.55) + Math.cos(rt.time * 0.18 + index) * (rt.reduced ? 0 : 8);
      if (Math.hypot(x - hx, y - hy) < heartScale * 1.05) continue;
      const crowded = garden.some((memory) => {
        const at = placeOf(memory.id, width, height);
        return Math.hypot(x - at.x, y - at.y) < 54;
      });
      if (crowded) continue;
      drawCell(ctx, x, y, 16 + hash(index + 5) * 20, life > 0.45 && hash(index + 8) > 0.72);
    }

    const plants = 9 + Math.round(life * 8);
    for (let index = 0; index < plants; index += 1) {
      const x = (index + 0.5) * (width / plants);
      if (Math.abs(x - width * 0.5) < Math.min(width, height) * 0.18) continue;
      const stem = 78 + life * 120 * (0.45 + hash(index) * 0.55);
      const sway = rt.reduced ? 0 : Math.sin(rt.time * 0.55 + index) * 6;
      const open = Math.max(0.22, life * 0.9, rt.opened.has("smile") ? 0.85 : 0, rt.warmth * 0.7);
      drawPlant(ctx, x, height * 0.96, stem, open, sway);
    }
    const wingX = width * (0.5 + Math.sin(rt.time * 0.33) * 0.1);
    const wingY = height * (0.71 + Math.cos(rt.time * 0.47) * 0.035);
    drawButterfly(ctx, wingX, wingY, rt.time, life);
    for (let index = 0; index < 7; index += 1) {
      const blink = (Math.sin(rt.time * 2.2 + index * 1.7) + 1) / 2;
      const fx = width * (0.12 + hash(index + 30) * 0.76);
      const fy = height * (0.68 + Math.sin(rt.time * 0.7 + index) * 0.04);
      ctx.fillStyle = `rgba(214, 230, 150, ${(0.12 + blink * 0.55) * (0.45 + life)})`;
      ctx.beginPath();
      ctx.arc(fx, fy, 1.5 + blink, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const memory of garden) {
      const at = placeOf(memory.id, width, height);
      const open = rt.opened.has(memory.id) ? 1 : memory.id === "grade" ? 0.4 : 0.14 + life * 0.12;
      drawMemory(ctx, memory.id, at.x, at.y, open, rt.reduced ? 0 : rt.time);
    }

    const motes = 8 + Math.round(life * 14);
    for (let index = 0; index < motes; index += 1) {
      const speed = 5 + hash(index + 1) * 9;
      const y = ((hash(index) * height - rt.time * speed) % height + height) % height;
      const x = hash(index + 4) * width;
      const radius = hash(index + 6) > 0.8 ? 2.4 : 1.15;
      const alpha = 0.05 + life * 0.2;
      const mote = ctx.createRadialGradient(x, y, 0, x, y, radius * 5);
      mote.addColorStop(0, `rgba(230, 214, 180, ${alpha})`);
      mote.addColorStop(1, "rgba(230, 214, 180, 0)");
      ctx.fillStyle = mote;
      ctx.beginPath();
      ctx.arc(x, y, radius * 5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    if (rt.focus === "grade") {
      const veil = ctx.createRadialGradient(width / 2, height * 0.44, scale * 0.7, width / 2, height / 2, width * 0.72);
      veil.addColorStop(0, "rgba(6, 5, 4, 0)");
      veil.addColorStop(0.42, "rgba(6, 5, 4, 0.28)");
      veil.addColorStop(1, "rgba(4, 6, 5, 0.78)");
      ctx.fillStyle = veil;
      ctx.fillRect(0, 0, width, height);
      drawMembrane(ctx, width / 2, height * 0.46, Math.min(width, height) * 0.34, Math.min(width, height) * 0.3, rt.time);
    }

    if (rt.focus === "smart") {
      const ring = Math.min(width, height) * 0.3;
      for (let index = 0; index < 8; index += 1) {
        const angle = (index / 8) * Math.PI * 2 + rt.time * 0.04;
        drawCell(
          ctx,
          width / 2 + Math.cos(angle) * ring,
          height / 2 + Math.sin(angle) * ring * 0.58,
          14 + (index % 3) * 5,
          index % 4 === 0,
        );
      }
    }

    if (rt.focus === "smile") {
      const warm = ctx.createRadialGradient(width / 2, height * 0.4, 20, width / 2, height * 0.45, width * 0.6);
      warm.addColorStop(0, "rgba(212, 168, 120, 0.08)");
      warm.addColorStop(1, "rgba(212, 168, 120, 0)");
      ctx.fillStyle = warm;
      ctx.fillRect(0, 0, width, height);
    }

    const vignette = ctx.createRadialGradient(width / 2, height / 2, width * 0.2, width / 2, height / 2, width * 0.72);
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(4, 8, 6, 0.5)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);

    if (rt.focus === "flip") {
      const chaos = rt.chaosUntil > rt.time ? (rt.chaosUntil - rt.time) / 2.4 : 0;
      drawEcg(ctx, width, height, rt.time, chaos);
    }
  });

  const runtime = () => (rtRef.current ??= createRuntime());
  const [opened, setOpened] = useState<string[]>([]);
  const [focus, setFocus] = useState<Focus>(null);
  const [vista, setVista] = useState(false);
  const [gradeMark, setGradeMark] = useState(0);
  const [clock, setClock] = useState(0);
  const [size, setSize] = useState({ w: 1280, h: 800 });
  const [flowNote, setFlowNote] = useState("");

  useEffect(() => {
    const rt = runtime();
    rt.opened = new Set(opened);
    rt.focus = focus;
    rt.vista = vista;
    rt.reduced = reducedMotion;
  }, [opened, focus, vista, reducedMotion]);

  useEffect(() => {
    const rt = runtime();
    if (focus !== "flip") return;
    const span = reducedMotion ? 0.8 : 2.4;
    rt.chaosUntil = rt.time + span;
    rt.beeps = (reducedMotion ? [0.05] : [0.04, 0.22, 0.4, 0.58, 0.78, 0.98]).map((offset) => rt.time + offset);
  }, [focus, reducedMotion]);

  useEffect(() => {
    if (focus === "grade") sound.duck(0.4);
    else if (focus) sound.duck(0.58);
    else sound.duck(1);
  }, [focus, sound]);

  useEffect(() => {
    return () => {
      sound.duck(1);
    };
  }, [sound]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const notes = [
      "Deoxygenated blood enters the right side and leaves for the lungs.",
      "Oxygenated blood returns to the left side and leaves through the aorta.",
      "The right side sends blood to the lungs. The left side sends it through the body.",
    ];
    const onPointer = (event: PointerEvent) => {
      const rt = rtRef.current;
      if (!rt || rt.focus) return;
      const rect = canvas.getBoundingClientRect();
      const sx = event.clientX - rect.left;
      const sy = event.clientY - rect.top;
      const x = (sx - rect.width / 2 - rt.driftX) / rt.zoom + rect.width / 2 + rt.panX;
      const y = (sy - rect.height / 2 - rt.driftY) / rt.zoom + rect.height / 2 + rt.panY;
      const near = Math.hypot(x - rect.width * 0.5, y - rect.height * 0.44) < Math.min(rect.width, rect.height) * 0.2;
      if (!near) return;
      rt.flow = (rt.flow + 1) % 3;
      setFlowNote(notes[rt.flow] ?? "");
    };
    canvas.addEventListener("pointerdown", onPointer);
    return () => canvas.removeEventListener("pointerdown", onPointer);
  }, [canvasRef]);

  useEffect(() => {
    if (focus !== "grade") return;
    runtime().lastThump = runtime().time - 10;
    const started = performance.now();
    const frame = window.requestAnimationFrame(() => {
      setGradeMark(started);
      setClock(started);
    });
    const timer = window.setInterval(() => setClock(performance.now()), 280);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearInterval(timer);
    };
  }, [focus]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const measure = () => {
      const rect = canvas.getBoundingClientRect();
      setSize({ w: Math.max(1, rect.width), h: Math.max(1, rect.height) });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [canvasRef]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setFocus(null);
        setVista(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const memory = garden.find((item) => item.id === focus) ?? null;
  const allRead = opened.length >= garden.length;
  const name = `${teacher.honorific} ${teacher.name}`.trim();

  function openMemory(id: string) {
    setVista(false);
    if (id === "grade") {
      setGradeMark(0);
      setClock(0);
    }
    setFocus(id);
    setOpened((current) => (current.includes(id) ? current : [...current, id]));
  }

  function dismiss() {
    setFocus(null);
    setVista(false);
  }

  const gradeDelays = reducedMotion ? [0, 900, 2000] : [0, 4200, 9200];
  const shownLines = memory
    ? memory.id === "grade"
      ? memory.lines.filter((_, index) => clock - gradeMark >= gradeDelays[index])
      : memory.lines
    : [];
  const readClass = memory
    ? `garden-read${memory.slow ? " is-grade" : ""}${memory.lines.length === 1 ? " is-one" : ""}${
        memory.id === "place" || memory.id === "love" ? " is-heart" : ""
      }${memory.id === "flip" ? " is-flip" : ""}`
    : "";

  return (
    <div className={`lab-shell garden-shell${covered ? " is-covered" : ""}`}>
      <p className="sr-only">
        A living heart, and the memories around it. Choose one to read it. Close returns you to the heart.
        Escape closes a memory.
      </p>
      <canvas ref={canvasRef} aria-hidden="true" />
      {focus || vista || allRead ? null : (
        <>
          <p className="garden-prompt">Explore memories</p>
          <p className="garden-count">
            {opened.length} / {garden.length} memories
          </p>
        </>
      )}
      {flowNote && !focus && !vista ? (
        <p className="world-note" key={flowNote}>
          {flowNote}
        </p>
      ) : null}
      <div ref={layerRef} className={`garden-layer${focus || vista ? " is-quiet" : ""}`}>
        {garden.map((item) => {
          const at = placeOf(item.id, size.w, size.h);
          return (
            <button
              key={item.id}
              type="button"
              className={`garden-memory${item.id === "grade" ? " is-grade" : ""}${opened.includes(item.id) ? " is-read" : ""}`}
              style={{ left: at.x, top: at.y }}
              onClick={() => openMemory(item.id)}
            >
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
      {allRead && !focus && !vista ? (
        <button type="button" className="garden-letter" onClick={() => setFocus("letter")}>
          The letter
        </button>
      ) : null}
      {memory ? (
        <div
          className={readClass}
          onClick={() => {
            if (!memory.slow) dismiss();
          }}
        >
          <div
            className="garden-words"
            aria-live="polite"
            onClick={(event) => event.stopPropagation()}
          >
            {shownLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
          <button type="button" className="garden-close" onClick={dismiss}>
            Close
          </button>
        </div>
      ) : null}
      {focus === "letter" ? (
        <div className="garden-read is-letter">
          <div className="garden-words" aria-live="polite">
            {kalsoomLetter.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
          <div className="garden-actions">
            <button
              type="button"
              className="garden-close"
              onClick={() => {
                setVista(true);
                setFocus("dedication");
              }}
            >
              Continue
            </button>
            <button type="button" className="garden-close is-quiet" onClick={dismiss}>
              Close
            </button>
          </div>
        </div>
      ) : null}
      {focus === "dedication" ? (
        <div className="garden-read is-dedication">
          <div className="garden-words">
            <p className="garden-name">{name || kalsoomDedication[0]}</p>
            <p className="garden-day">{kalsoomDedication[1]}</p>
          </div>
        </div>
      ) : null}
      <button type="button" className="lab-leave" onClick={onLeave}>
        Leave
      </button>
    </div>
  );
}
