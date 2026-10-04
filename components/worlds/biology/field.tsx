"use client";

import { useSound } from "@/components/sound";
import { garden, kalsoomDedication, kalsoomLetter } from "@/lib/biology/lines";
import type { Teacher } from "@/lib/types";
import { useEffect, useRef, useState } from "react";
import { readFonts, useStage, type Fonts } from "../shared/stage";

type Focus = string | null;

type Drop = { route: "vena" | "aorta" | "pulmonary"; t: number };

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
  chaosUntil: number;
  beeps: number[];
  lastThump: number;
  drops: Drop[];
  dropAt: number;
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
    chaosUntil: 0,
    beeps: [],
    lastThump: 0,
    drops: [],
    dropAt: 0,
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

const HEART_TILT = -0.18;

function tiltPoints(points: { x: number; y: number }[], cx: number, cy: number) {
  const c = Math.cos(HEART_TILT);
  const s = Math.sin(HEART_TILT);
  return points.map((point) => ({
    x: cx + (point.x - cx) * c - (point.y - cy) * s,
    y: cy + (point.x - cx) * s + (point.y - cy) * c,
  }));
}

function vessels(cx: number, cy: number, s: number, tilted = true) {
  const raw = {
    vena: [
      { x: cx - s * 0.16, y: cy - s * 0.92 },
      { x: cx - s * 0.18, y: cy - s * 0.42 },
      { x: cx - s * 0.06, y: cy + s * 0.02 },
    ],
    aorta: [
      { x: cx + s * 0.06, y: cy + s * 0.04 },
      { x: cx + s * 0.1, y: cy - s * 0.28 },
      { x: cx + s * 0.28, y: cy - s * 0.56 },
      { x: cx + s * 0.5, y: cy - s * 0.62 },
      { x: cx + s * 0.66, y: cy - s * 0.38 },
    ],
    pulmonary: [
      { x: cx, y: cy + s * 0.02 },
      { x: cx - s * 0.06, y: cy - s * 0.22 },
      { x: cx - s * 0.16, y: cy - s * 0.4 },
    ],
    lungLeft: [
      { x: cx - s * 0.16, y: cy - s * 0.4 },
      { x: cx - s * 0.34, y: cy - s * 0.56 },
    ],
    lungRight: [
      { x: cx - s * 0.16, y: cy - s * 0.4 },
      { x: cx + s * 0.02, y: cy - s * 0.52 },
    ],
  };
  if (!tilted) return raw;
  return {
    vena: tiltPoints(raw.vena, cx, cy),
    aorta: tiltPoints(raw.aorta, cx, cy),
    pulmonary: tiltPoints(raw.pulmonary, cx, cy),
    lungLeft: tiltPoints(raw.lungLeft, cx, cy),
    lungRight: tiltPoints(raw.lungRight, cx, cy),
  };
}

function drawTube(
  ctx: CanvasRenderingContext2D,
  points: { x: number; y: number }[],
  width: number,
  color: string,
  sheen: string,
) {
  if (points.length < 2) return;
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let index = 1; index < points.length; index += 1) ctx.lineTo(points[index].x, points[index].y);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
  ctx.strokeStyle = sheen;
  ctx.lineWidth = Math.max(1.2, width * 0.28);
  ctx.stroke();
  ctx.restore();
}

function heartBody(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number) {
  ctx.beginPath();
  ctx.moveTo(cx + s * 0.16, cy - s * 0.02);
  ctx.bezierCurveTo(cx + s * 0.58, cy + s * 0.02, cx + s * 0.22, cy + s * 0.46, cx - s * 0.2, cy + s * 0.62);
  ctx.bezierCurveTo(cx - s * 0.42, cy + s * 0.7, cx - s * 0.66, cy + s * 0.36, cx - s * 0.7, cy + s * 0.06);
  ctx.bezierCurveTo(cx - s * 0.72, cy - s * 0.2, cx - s * 0.36, cy - s * 0.22, cx - s * 0.04, cy - s * 0.08);
  ctx.bezierCurveTo(cx + s * 0.06, cy - s * 0.02, cx + s * 0.1, cy - s * 0.04, cx + s * 0.16, cy - s * 0.02);
  ctx.closePath();
}

function drawHeart(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number, warmth: number, pulse: number) {
  const muscle = mix("#5a2830", "#7c403c", warmth);
  const deep = "#241014";
  const lit = mix("#7a3838", "#c49888", warmth);
  const pipes = vessels(cx, cy, s, false);

  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.38)";
  ctx.beginPath();
  ctx.ellipse(cx - s * 0.08, cy + s * 0.62, s * 0.72, s * 0.1, HEART_TILT * 0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.translate(cx, cy);
  ctx.rotate(HEART_TILT);
  ctx.translate(-cx, -cy);

  const body = ctx.createRadialGradient(cx - s * 0.08, cy - s * 0.02, s * 0.05, cx + s * 0.05, cy + s * 0.15, s);
  body.addColorStop(0, lit);
  body.addColorStop(0.42, muscle);
  body.addColorStop(1, deep);
  heartBody(ctx, cx, cy, s);
  ctx.fillStyle = body;
  ctx.fill();

  ctx.save();
  heartBody(ctx, cx, cy, s);
  ctx.clip();
  ctx.fillStyle = "rgba(58, 36, 40, 0.55)";
  ctx.beginPath();
  ctx.ellipse(cx - s * 0.28, cy + s * 0.12, s * 0.34, s * 0.38, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  drawTube(ctx, pipes.vena, s * 0.1, "#5c463f", "rgba(214, 190, 170, 0.32)");
  drawTube(ctx, pipes.aorta, s * 0.13, mix("#6a2828", "#a84840", warmth), "rgba(240, 210, 196, 0.42)");
  drawTube(ctx, pipes.pulmonary, s * 0.09, "#5e403c", "rgba(226, 200, 184, 0.36)");
  drawTube(ctx, pipes.lungLeft, s * 0.055, "#5a403c", "rgba(220, 196, 180, 0.3)");
  drawTube(ctx, pipes.lungRight, s * 0.05, "#644440", "rgba(220, 196, 180, 0.3)");

  ctx.save();
  ctx.lineCap = "round";
  ctx.strokeStyle = `rgba(154, 58, 54, ${0.75 + warmth * 0.2})`;
  ctx.lineWidth = Math.max(1.4, s * 0.012);
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.02, cy + s * 0.02);
  ctx.quadraticCurveTo(cx - s * 0.16, cy + s * 0.28, cx - s * 0.28, cy + s * 0.5);
  ctx.moveTo(cx - s * 0.14, cy + s * 0.22);
  ctx.quadraticCurveTo(cx + s * 0.02, cy + s * 0.28, cx + s * 0.14, cy + s * 0.24);
  ctx.stroke();
  ctx.restore();

  const sheen = ctx.createRadialGradient(cx - s * 0.12, cy + s * 0.02, 2, cx, cy + s * 0.08, s * 0.48);
  sheen.addColorStop(0, `rgba(255, 232, 214, ${0.18 + pulse * 0.1})`);
  sheen.addColorStop(1, "rgba(255, 232, 214, 0)");
  ctx.fillStyle = sheen;
  ctx.beginPath();
  ctx.ellipse(cx - s * 0.06, cy + s * 0.08, s * 0.32, s * 0.4, -0.5, 0, Math.PI * 2);
  ctx.fill();
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
  drawBloom(ctx, x, y, open, hue, time, id === "grade" ? 8 : id === "smile" ? 7 : 6);
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
  ctx.strokeStyle = mix("#1a3328", "#3d6a48", open);
  ctx.lineWidth = 1.7;
  ctx.beginPath();
  ctx.moveTo(x, base);
  ctx.quadraticCurveTo(x + 8, base - height * 0.45, x + sway, base - height);
  ctx.stroke();
  for (const t of [0.38, 0.62, 0.82]) {
    const ly = base - height * t;
    const lx = x + sway * t;
    ctx.fillStyle = `rgba(70, 110, 82, ${0.28 + open * 0.45})`;
    ctx.beginPath();
    ctx.ellipse(lx + 14, ly, 11 + open * 14, 3.4 + open * 2.4, 0.55, 0, Math.PI * 2);
    ctx.fill();
  }
  if (open > 0.2) {
    ctx.fillStyle = `rgba(224, 196, 156, ${0.25 + open * 0.65})`;
    ctx.beginPath();
    ctx.ellipse(x + sway, base - height - 2, 3 + open * 6, 2.4 + open * 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawEcg(ctx: CanvasRenderingContext2D, width: number, height: number, time: number, chaos: number) {
  const y = height - 78;
  const left = width * 0.18;
  const right = width * 0.82;
  ctx.save();
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
    if (chaos > 0) spike = Math.sin(u * 64 + time * 26) * (6 + chaos * 20);
    if (x === left) ctx.moveTo(x, y + spike);
    else ctx.lineTo(x, y + spike);
  }
  ctx.stroke();
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
    const motion = reducedMotion ? 0 : dt;
    rt.time += reducedMotion ? dt * 0.15 : dt;
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
    if (layerRef.current) {
      layerRef.current.style.transform = `translate(${-rt.zoom * rt.panX}px, ${-rt.zoom * rt.panY}px) scale(${rt.zoom})`;
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
    ctx.translate(-width / 2 - rt.panX, -height / 2 - rt.panY);

    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, mix("#070b09", "#2a1816", rt.warmth * 0.5));
    sky.addColorStop(0.48, mix("#0d1613", "#2c221c", rt.warmth * 0.35));
    sky.addColorStop(1, mix("#101c18", "#3a2822", Math.max(life, rt.warmth * 0.8) * 0.75));
    ctx.fillStyle = sky;
    ctx.fillRect(-120, -120, width + 240, height + 240);

    const key = ctx.createRadialGradient(width * 0.18, height * 0.08, 10, width * 0.22, height * 0.12, width * 0.55);
    key.addColorStop(0, `rgba(236, 220, 190, ${0.08 + rt.warmth * 0.08})`);
    key.addColorStop(1, "rgba(236, 220, 190, 0)");
    ctx.fillStyle = key;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.globalAlpha = 0.16;
    for (let index = 0; index < 4; index += 1) {
      const radius = 36 + hash(index) * 48;
      const x = width * (0.06 + hash(index + 2) * 0.88);
      const y = height * (0.06 + hash(index + 4) * 0.28);
      drawCell(ctx, x, y, radius, false);
    }
    ctx.restore();

    ctx.fillStyle = mix("#0c1814", "#1c3026", life * 0.8);
    ctx.beginPath();
    ctx.moveTo(-40, height * 0.78);
    for (let x = -40; x <= width + 40; x += 28) {
      ctx.lineTo(x, height * 0.62 - Math.sin(x * 0.0035) * 26 - life * 18);
    }
    ctx.lineTo(width + 40, height + 40);
    ctx.lineTo(-40, height + 40);
    ctx.fill();

    ctx.fillStyle = mix("#0a1411", "#24382c", life);
    ctx.beginPath();
    ctx.moveTo(-40, height * 0.86);
    for (let x = -40; x <= width + 40; x += 24) {
      ctx.lineTo(x, height * 0.78 - Math.sin(x * 0.006 + 1) * 12);
    }
    ctx.lineTo(width + 40, height + 40);
    ctx.lineTo(-40, height + 40);
    ctx.fill();

    drawHelix(ctx, width * 0.08, height * 0.14, height * 0.32, rt.time, 0.18 + life * 0.4);
    drawHelix(ctx, width * 0.9, height * 0.18, height * 0.28, rt.time + 2, 0.16 + life * 0.34);
    drawNeuron(ctx, width * 0.22, height * 0.2, rt.time, life);
    drawNeuron(ctx, width * 0.74, height * 0.18, rt.time + 1.2, life);
    if (life > 0.35) drawNeuron(ctx, width * 0.48, height * 0.14, rt.time + 0.6, life);

    ctx.save();
    ctx.strokeStyle = `rgba(92, 36, 40, ${0.12 + life * 0.28})`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, height * 0.84);
    ctx.bezierCurveTo(width * 0.18, height * 0.62, width * 0.32, height * 0.7, width * 0.5, height * 0.48);
    ctx.moveTo(width, height * 0.8);
    ctx.bezierCurveTo(width * 0.8, height * 0.6, width * 0.68, height * 0.68, width * 0.5, height * 0.48);
    ctx.stroke();
    ctx.restore();

    const hx = width * 0.5;
    const hy = height * 0.44;
    const scale = Math.min(width, height) * (width < 760 ? 0.24 : 0.32);
    const glowReach = scale * (2.5 + life * 0.6);
    const glow = ctx.createRadialGradient(hx, hy, scale * 0.2, hx, hy, glowReach);
    glow.addColorStop(0, `rgba(196, 132, 104, ${0.14 + rt.warmth * 0.42 + (gradeFocus ? 0.2 : 0)})`);
    glow.addColorStop(0.45, `rgba(120, 64, 52, ${0.05 + rt.warmth * 0.12})`);
    glow.addColorStop(1, "rgba(120, 64, 52, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(hx, hy, glowReach, 0, Math.PI * 2);
    ctx.fill();

    const heartScale = scale * (1 + pulse * 0.045);
    drawHeart(ctx, hx, hy, heartScale, rt.warmth, pulse);
    const pipes = vessels(hx, hy, heartScale);

    if (rt.time > rt.dropAt) {
      rt.dropAt = rt.time + 0.55;
      rt.drops.push({ route: "vena", t: 0 }, { route: "aorta", t: 0 }, { route: "pulmonary", t: 0 });
      rt.drops = rt.drops.filter((drop) => drop.t < 1).slice(-24);
    }
    for (const drop of rt.drops) {
      drop.t += motion > 0 ? 0.008 : 0;
      const at = along(pipes[drop.route], drop.t);
      ctx.fillStyle = drop.route === "aorta" ? "rgba(176, 72, 68, 0.9)" : "rgba(120, 86, 74, 0.9)";
      ctx.beginPath();
      ctx.arc(at.x, at.y, 2.6, 0, Math.PI * 2);
      ctx.fill();
    }

    const cells = 7 + Math.round(life * 12);
    for (let index = 0; index < cells; index += 1) {
      const drift = rt.reduced ? 0 : Math.sin(rt.time * 0.22 + index) * 14;
      const x = width * (0.08 + hash(index) * 0.84) + drift;
      const y = height * (0.18 + hash(index + 3) * 0.55) + Math.cos(rt.time * 0.18 + index) * (rt.reduced ? 0 : 8);
      if (Math.hypot(x - hx, y - hy) < heartScale * 1.05) continue;
      drawCell(ctx, x, y, 16 + hash(index + 5) * 20, life > 0.45 && hash(index + 8) > 0.72);
    }

    const plants = 9 + Math.round(life * 8);
    for (let index = 0; index < plants; index += 1) {
      const x = (index + 0.5) * (width / plants);
      const stem = 48 + life * 90 * (0.5 + hash(index) * 0.55);
      const sway = rt.reduced ? 0 : Math.sin(rt.time * 0.55 + index) * 5;
      const open = Math.max(life * 0.85, rt.opened.has("smile") ? 0.72 : 0, rt.warmth * 0.65);
      drawPlant(ctx, x, height * 0.94, stem, open, sway);
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
      {focus || vista ? null : <p className="garden-prompt">Explore memories</p>}
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
