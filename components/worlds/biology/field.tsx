"use client";

import { useSound } from "@/components/sound";
import { GRADE_MARK } from "@/lib/biology/lines";
import type { Teacher } from "@/lib/types";
import { useEffect, useRef, useState, type PointerEvent, type WheelEvent } from "react";
import { clampLook, createLook, dragPan, startPan, stopPan, type Look } from "../shared/look";
import { readFonts, useStage, type Fonts } from "../shared/stage";

type Place = "field" | "cell" | "heart" | "dark";

type Speech = { id: string; lines: string[]; i: number; silent: boolean };

type Drop = { route: "body" | "lung"; t: number };

type Fragile = { open: boolean; bruise: number };

type Hold = { index: number; x: number; y: number; t: number; moved: boolean };

type Runtime = {
  time: number;
  look: Look;
  fonts: Fonts;
  fontsReady: boolean;
  view: Place;
  found: Set<string>;
  speech: Speech | null;
  slip: string;
  caption: string;
  notice: string;
  noticeUntil: number;
  pauseUntil: number;
  warmth: number;
  bloom: number;
  splits: number;
  pairs: string[];
  fragile: Fragile[];
  hold: Hold | null;
  inspected: Set<string>;
  signal: number;
  signaled: boolean;
  membrane: number;
  dark: number;
  leaveDark: boolean;
  comfortSit: boolean;
  focus: string;
  lastThump: number;
  thump: number;
  drops: Drop[];
  dropAt: number;
  chaosUntil: number;
  beeps: number[];
  flipReady: boolean;
  pendingHeart: boolean;
  duck: number;
  letter: boolean;
  still: boolean;
  suppress: boolean;
};

const STRAND = ["A", "T", "G", "C", "A", "C"];
const BASES = ["A", "T", "G", "C"];

const ORGANS: Record<string, string> = {
  nucleus: "The nucleus holds the DNA. The instructions for the cell live here.",
  mitochondrion: "Mitochondria release usable energy from food.",
  ribosome: "Ribosomes build proteins from those instructions.",
  membrane: "The membrane decides what may enter the cell and what must stay out.",
  cytoplasm: "Cytoplasm is the fluid the rest of the cell is suspended in.",
  golgi: "The Golgi apparatus packages proteins and sends them on.",
};

const FRAGMENTS = [
  { id: "smile", word: "the smile" },
  { id: "class", word: "the classroom" },
  { id: "grade", word: "grade 6 / 7" },
  { id: "teach", word: "the teaching" },
  { id: "kind", word: "kindness" },
  { id: "comfort", word: "comfort" },
  { id: "held", word: "the hug" },
];

const BRANCHES: { id: string; word: string; angle: number }[] = [
  { id: "smile", word: "SMILE", angle: -1.15 },
  { id: "comfort", word: "COMFORT", angle: -0.78 },
  { id: "kind", word: "KINDNESS", angle: -0.42 },
  { id: "teach", word: "TEACHING", angle: -0.05 },
  { id: "grade", word: "GRADE 6/7", angle: 0.32 },
  { id: "held", word: "THE HUG", angle: 0.68 },
  { id: "heart", word: "HEART", angle: 1.05 },
];

function hash(index: number) {
  const value = Math.sin(index * 127.1 + 311.7) * 43758.5453;
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

function pairOf(base: string) {
  if (base === "A") return "T";
  if (base === "T") return "A";
  if (base === "G") return "C";
  return "G";
}

function nextBase(base: string) {
  const index = BASES.indexOf(base);
  return BASES[(index + 1) % BASES.length] ?? "A";
}

function strandReady(pairs: string[]) {
  return STRAND.every((base, index) => pairs[index] === pairOf(base));
}

function lifeOf(found: Set<string>) {
  return Math.min(1, found.size / 8);
}

function breathFor(id: string, line: string, still: boolean) {
  if (line === "And you hugged me.") return still ? 1.6 : 3.4;
  if (id === "grade" || id === "held") return still ? 0.7 : 1.25;
  if (id === "comfort" || id === "love" || id === "heart") return still ? 0.6 : 1.05;
  return still ? 0.25 : 0.45;
}

function metrics(width: number, height: number) {
  const worldW = width * 7.2;
  const worldH = height * 1.38;
  const ground = worldH * 0.76;
  return { worldW, worldH, ground };
}

function stations(width: number, height: number) {
  const { worldW, ground } = metrics(width, height);
  const at = (fraction: number, lift = 0) => ({ x: worldW * fraction, y: ground - lift });
  return {
    pond: at(0.045, 108),
    window: at(0.075, 168),
    tree: at(0.135, 0),
    cell: at(0.2, 150),
    dna: at(0.3, 250),
    neuron: at(0.4, 168),
    heart: at(0.49, 150),
    fragile: at(0.575, 108),
    pool: at(0.665, 36),
    flowers: at(0.75, 0),
    room: at(0.83, 0),
    grade: at(0.9, 70),
    love: at(0.945, 28),
    heart2: at(0.978, 150),
    ground,
    worldW,
    worldH: metrics(width, height).worldH,
  };
}

function createRuntime(): Runtime {
  return {
    time: 0,
    look: createLook(),
    fonts: { display: "Georgia", mono: "monospace", hand: "Georgia" },
    fontsReady: false,
    view: "field",
    found: new Set(),
    speech: null,
    slip: "",
    caption: "",
    notice: "",
    noticeUntil: 0,
    pauseUntil: 0,
    warmth: 0.06,
    bloom: 0,
    splits: 0,
    pairs: ["G", "A", "T", "A", "C", "T"],
    fragile: [
      { open: false, bruise: 0 },
      { open: false, bruise: 0 },
      { open: false, bruise: 0 },
    ],
    hold: null,
    inspected: new Set(),
    signal: -1,
    signaled: false,
    membrane: 0,
    dark: 0,
    leaveDark: false,
    comfortSit: false,
    focus: "",
    lastThump: 0,
    thump: 0,
    drops: [],
    dropAt: 0,
    chaosUntil: 0,
    beeps: [],
    flipReady: false,
    pendingHeart: false,
    duck: 1,
    letter: false,
    still: false,
    suppress: false,
  };
}

function wrap(ctx: CanvasRenderingContext2D, text: string, max: number) {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > max && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 5);
}

function drawVoice(
  ctx: CanvasRenderingContext2D,
  text: string,
  font: string,
  width: number,
  height: number,
  centered: boolean,
) {
  if (!text) return;
  const size = width < 680 ? 18 : 22;
  ctx.save();
  ctx.font = `${size}px ${font}`;
  ctx.textAlign = "center";
  const lines = wrap(ctx, text, Math.min(560, width - 48));
  const block = lines.length * (size + 8);
  const y0 = centered ? height * 0.62 : height - 108 - block;
  ctx.shadowColor = "rgba(12, 8, 6, 0.72)";
  ctx.shadowBlur = 10;
  ctx.fillStyle = "#f6efe4";
  lines.forEach((line, index) => {
    ctx.fillText(line, width / 2, y0 + index * (size + 8));
  });
  ctx.restore();
}

function drawCaption(ctx: CanvasRenderingContext2D, text: string, font: string, width: number) {
  if (!text) return;
  ctx.save();
  ctx.font = `14px ${font}`;
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(236, 226, 208, 0.88)";
  const lines = wrap(ctx, text, Math.min(640, width - 36));
  lines.forEach((line, index) => {
    ctx.fillText(line, width / 2, 36 + index * 18);
  });
  ctx.restore();
}

function drawCellBody(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  open: number,
) {
  const body = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.35, 2, x, y, radius);
  body.addColorStop(0, `rgba(236, 228, 206, ${0.42 + open * 0.2})`);
  body.addColorStop(0.72, `rgba(154, 176, 132, ${0.28 + open * 0.12})`);
  body.addColorStop(1, "rgba(48, 72, 52, 0.08)");
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = body;
  ctx.fill();
  ctx.strokeStyle = `rgba(226, 214, 190, ${0.55 + open * 0.35})`;
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x - radius * 0.08, y + radius * 0.04, radius * 0.34, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(92, 52, 72, 0.88)";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x - radius * 0.02, y + radius * 0.08, radius * 0.12, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(48, 28, 40, 0.9)";
  ctx.fill();
}

function drawPlant(
  ctx: CanvasRenderingContext2D,
  x: number,
  ground: number,
  stem: number,
  open: number,
  index: number,
  time: number,
  still: boolean,
) {
  const sway = still ? 0 : Math.sin(time * 0.8 + index) * 4;
  ctx.strokeStyle = "#2d5a3c";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, ground);
  ctx.quadraticCurveTo(x + 8 + sway, ground - stem * 0.5, x + sway, ground - stem);
  ctx.stroke();
  ctx.fillStyle = index % 2 === 0 ? "#3f7a4c" : "#6d8f48";
  ctx.beginPath();
  ctx.ellipse(x + sway - 10, ground - stem * 0.62, 12, 5, -0.5, 0, Math.PI * 2);
  ctx.fill();
  if (open > 0.18) {
    const spread = 4 + open * 7;
    ctx.fillStyle = `rgba(232, 206, 170, ${0.35 + open * 0.6})`;
    ctx.beginPath();
    ctx.ellipse(x + sway, ground - stem - 2, spread, spread * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawTree(
  ctx: CanvasRenderingContext2D,
  x: number,
  ground: number,
  found: Set<string>,
  font: string,
) {
  const grown = BRANCHES.filter((branch) => found.has(branch.id)).length;
  const trunk = 16 + grown * 18;
  ctx.strokeStyle = "#3a2a22";
  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x, ground);
  ctx.bezierCurveTo(x + 10, ground - trunk * 0.35, x - 8, ground - trunk * 0.7, x + 4, ground - trunk);
  ctx.stroke();
  if (grown === 0) {
    ctx.fillStyle = "#6b5134";
    ctx.beginPath();
    ctx.ellipse(x, ground - 3, 9, 5, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#3f6b40";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, ground - 6);
    ctx.quadraticCurveTo(x + 6, ground - 18, x + 1, ground - 26);
    ctx.stroke();
    return;
  }
  for (const branch of BRANCHES) {
    if (!found.has(branch.id)) continue;
    const length = 62 + (branch.angle > 0 ? 18 : 8);
    const y0 = ground - trunk * (0.42 + (branch.angle + 1.2) * 0.18);
    const x1 = x + Math.sin(branch.angle) * length;
    const y1 = y0 - Math.cos(branch.angle) * length * 0.42;
    ctx.strokeStyle = "#4a3428";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + 2, Math.min(ground - 10, y0));
    ctx.quadraticCurveTo(x + Math.sin(branch.angle) * length * 0.45, y0 - 16, x1, y1);
    ctx.stroke();
    ctx.fillStyle = branch.id === "heart" ? "#c46a58" : "#6f9a58";
    ctx.beginPath();
    ctx.ellipse(x1, y1, 16, 7, branch.angle, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(246, 239, 226, 0.86)";
    ctx.font = `11px ${font}`;
    ctx.textAlign = "center";
    ctx.fillText(branch.word, x1, y1 - 14);
  }
  if (found.has("again")) {
    ctx.fillStyle = "#e7c9a2";
    ctx.beginPath();
    ctx.ellipse(x + 18, ground - trunk - 8, 7, 4, -0.4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawWindow(ctx: CanvasRenderingContext2D, x: number, y: number, warmth: number) {
  ctx.fillStyle = "#1c1814";
  ctx.fillRect(x, y, 58, 74);
  ctx.beginPath();
  ctx.moveTo(x - 8, y);
  ctx.lineTo(x + 29, y - 24);
  ctx.lineTo(x + 66, y);
  ctx.fill();
  const glow = 0.12 + warmth * 0.88;
  const light = ctx.createRadialGradient(x + 29, y + 34, 2, x + 29, y + 34, 26 + warmth * 18);
  light.addColorStop(0, `rgba(255, 226, 176, ${glow})`);
  light.addColorStop(1, `rgba(232, 170, 96, ${glow * 0.15})`);
  ctx.fillStyle = light;
  ctx.fillRect(x + 8, y + 8, 42, 58);
  ctx.fillStyle = `rgba(255, 214, 150, ${warmth * 0.28})`;
  ctx.beginPath();
  ctx.arc(x + 29, y + 32, 18 + warmth * 22, 0, Math.PI * 2);
  ctx.fill();
}

function drawDna(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  pairs: string[],
  time: number,
  still: boolean,
  font: string,
) {
  const phase = still ? 0.4 : time * 0.6;
  ctx.strokeStyle = "rgba(214, 196, 168, 0.8)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  for (let step = 0; step <= 6; step += 1) {
    const yy = y + step * 28;
    const wave = Math.sin(phase + step * 0.7) * 8;
    if (step === 0) ctx.moveTo(x - 46 + wave, yy);
    else ctx.lineTo(x - 46 + wave, yy);
  }
  ctx.stroke();
  ctx.beginPath();
  for (let step = 0; step <= 6; step += 1) {
    const yy = y + step * 28;
    const wave = Math.sin(phase + step * 0.7 + Math.PI) * 8;
    if (step === 0) ctx.moveTo(x + 46 + wave, yy);
    else ctx.lineTo(x + 46 + wave, yy);
  }
  ctx.stroke();
  STRAND.forEach((base, index) => {
    const yy = y + 14 + index * 28;
    const right = pairs[index] ?? "A";
    const correct = right === pairOf(base);
    const bonds = correct ? (base === "G" || base === "C" ? 3 : 2) : 1;
    ctx.strokeStyle = correct ? "rgba(196, 154, 112, 0.9)" : "rgba(120, 96, 80, 0.45)";
    ctx.lineWidth = 1.2;
    for (let bond = 0; bond < bonds; bond += 1) {
      const shift = (bond - (bonds - 1) / 2) * 4;
      ctx.beginPath();
      ctx.moveTo(x - 24, yy + shift);
      ctx.lineTo(x + 24, yy + shift);
      ctx.stroke();
    }
    drawBase(ctx, x - 36, yy, base, false, font);
    drawBase(ctx, x + 36, yy, right, true, font);
  });
  ctx.fillStyle = "rgba(236, 226, 208, 0.55)";
  ctx.font = `12px ${font}`;
  ctx.textAlign = "center";
  ctx.fillText("strand", x, y + 6 * 28 + 28);
}

function drawBase(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  letter: string,
  active: boolean,
  font: string,
) {
  ctx.beginPath();
  ctx.arc(x, y, 13, 0, Math.PI * 2);
  ctx.fillStyle = active ? "rgba(232, 214, 186, 0.95)" : "rgba(92, 64, 72, 0.92)";
  ctx.fill();
  ctx.fillStyle = active ? "#2a2118" : "#f3e7d8";
  ctx.font = `13px ${font}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(letter, x, y + 1);
  ctx.textBaseline = "alphabetic";
}

function drawNeuron(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  signal: number,
  signaled: boolean,
  time: number,
  font: string,
) {
  ctx.strokeStyle = "#6d5a4c";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 8, y);
  ctx.quadraticCurveTo(x - 40, y - 28, x - 62, y - 18);
  ctx.moveTo(x - 8, y);
  ctx.quadraticCurveTo(x - 36, y + 8, x - 58, y + 22);
  ctx.moveTo(x - 8, y);
  ctx.quadraticCurveTo(x - 30, y - 4, x - 48, y + 2);
  ctx.stroke();
  const soma = ctx.createRadialGradient(x - 6, y - 6, 2, x, y, 26);
  soma.addColorStop(0, "#d7c2a4");
  soma.addColorStop(1, "#8a6248");
  ctx.beginPath();
  ctx.arc(x, y, 24, 0, Math.PI * 2);
  ctx.fillStyle = soma;
  ctx.fill();
  ctx.strokeStyle = "#cbb89a";
  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  const sheaths = [36, 78, 120, 162];
  for (const sheath of sheaths) {
    ctx.beginPath();
    ctx.moveTo(x + sheath, y);
    ctx.lineTo(x + sheath + 28, y);
    ctx.stroke();
  }
  ctx.strokeStyle = "#5c4638";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + 22, y);
  ctx.lineTo(x + 214, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x + 226, y + 10, 10, 0, Math.PI * 2);
  ctx.fillStyle = "#a87858";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + 258, y + 12, 16, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(120, 86, 70, 0.85)";
  ctx.fill();
  if (signal >= 0) {
    const px = x + 22 + signal * 200;
    ctx.fillStyle = "#f0d7a4";
    ctx.beginPath();
    ctx.arc(px, y, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  if (signaled) {
    const hop = Math.sin(time * 3) * 3;
    ctx.fillStyle = "rgba(232, 206, 160, 0.8)";
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.arc(x + 240 + i * 6, y + 10 - hop, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.fillStyle = "rgba(236, 226, 208, 0.55)";
  ctx.font = `12px ${font}`;
  ctx.textAlign = "center";
  ctx.fillText("signal", x + 70, y + 46);
}

function drawFragileCell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cell: Fragile,
  held: boolean,
  time: number,
) {
  const wilt = cell.bruise > 0 ? 0.75 : 1;
  const radius = (cell.open ? 26 : 20) * wilt;
  ctx.save();
  ctx.translate(x, y + (cell.bruise > 0 ? 6 : 0));
  if (held) ctx.rotate(Math.sin(time * 2) * 0.02);
  drawCellBody(ctx, 0, 0, radius, cell.open ? 1 : 0.2);
  if (cell.bruise > 0) {
    ctx.strokeStyle = "rgba(90, 48, 42, 0.7)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, radius + 3, 0.2, 1.2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawClassroom(ctx: CanvasRenderingContext2D, x: number, ground: number, warmth: number) {
  ctx.fillStyle = "#2a241c";
  ctx.fillRect(x - 78, ground - 132, 168, 132);
  ctx.fillStyle = "#1e2420";
  ctx.fillRect(x - 36, ground - 112, 84, 52);
  ctx.strokeStyle = "rgba(214, 196, 160, 0.35)";
  ctx.strokeRect(x - 36, ground - 112, 84, 52);
  ctx.fillStyle = `rgba(232, 196, 140, ${0.08 + warmth * 0.25})`;
  ctx.fillRect(x + 58, ground - 100, 22, 30);
  for (let desk = 0; desk < 3; desk += 1) {
    const dx = x - 58 + desk * 46;
    ctx.fillStyle = "#6a5038";
    ctx.fillRect(dx, ground - 38, 36, 8);
    ctx.fillRect(dx + 14, ground - 30, 6, 30);
    ctx.strokeStyle = "#3a2c22";
    ctx.strokeRect(dx + 6, ground - 62, 18, 18);
  }
}

function drawGradeDoor(ctx: CanvasRenderingContext2D, x: number, ground: number, ready: boolean) {
  ctx.fillStyle = "#1a2820";
  ctx.beginPath();
  ctx.moveTo(x - 70, ground);
  ctx.quadraticCurveTo(x - 40, ground - 150, x, ground - 20);
  ctx.quadraticCurveTo(x + 40, ground - 150, x + 70, ground);
  ctx.fill();
  ctx.fillStyle = ready ? "rgba(48, 32, 28, 0.92)" : "rgba(12, 14, 12, 0.92)";
  ctx.beginPath();
  ctx.moveTo(x - 26, ground);
  ctx.quadraticCurveTo(x, ground - 108, x + 26, ground);
  ctx.fill();
  if (ready) {
    ctx.fillStyle = "rgba(232, 196, 150, 0.18)";
    ctx.beginPath();
    ctx.ellipse(x, ground - 36, 10, 18, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawStone(ctx: CanvasRenderingContext2D, x: number, y: number, awake: boolean, time: number) {
  const pulse = awake ? 0.35 + Math.sin(time * 1.4) * 0.15 : 0.12;
  ctx.fillStyle = `rgba(232, 196, 150, ${pulse})`;
  ctx.beginPath();
  ctx.ellipse(x, y + 8, 34, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = awake ? "#8a624c" : "#3a342c";
  ctx.beginPath();
  ctx.ellipse(x, y, 26, 16, 0, 0, Math.PI * 2);
  ctx.fill();
}

function cycleOf(time: number, still: boolean) {
  if (still) return { atrial: 0, ventricular: 0.15, phase: 0.3 };
  const phase = (time % 1.35) / 1.35;
  const atrial = phase < 0.18 ? Math.sin((phase / 0.18) * Math.PI) : 0;
  const ventricular = phase > 0.18 && phase < 0.52 ? Math.sin(((phase - 0.18) / 0.34) * Math.PI) : 0;
  return { atrial, ventricular, phase };
}

function heartLayout(cx: number, cy: number, scale: number, atrial: number, ventricular: number) {
  const ay = 1 - atrial * 0.22;
  const vy = 1 - ventricular * 0.2;
  const chambers = [
    {
      id: "ra",
      x: cx - scale * 0.34,
      y: cy - scale * 0.34,
      rx: scale * 0.16,
      ry: scale * 0.12 * ay,
      caption: "Right atrium. Blood from the body arrives here. It is low in oxygen.",
      oxygenated: false,
    },
    {
      id: "rv",
      x: cx - scale * 0.3,
      y: cy + scale * 0.08,
      rx: scale * 0.2,
      ry: scale * 0.22 * vy,
      caption: "Right ventricle. It sends that blood to the lungs.",
      oxygenated: false,
    },
    {
      id: "la",
      x: cx + scale * 0.32,
      y: cy - scale * 0.32,
      rx: scale * 0.15,
      ry: scale * 0.11 * ay,
      caption: "Left atrium. Blood returns from the lungs, carrying oxygen.",
      oxygenated: true,
    },
    {
      id: "lv",
      x: cx + scale * 0.28,
      y: cy + scale * 0.1,
      rx: scale * 0.22,
      ry: scale * 0.26 * vy,
      caption: "Left ventricle. The thickest wall. It sends oxygenated blood out to the body.",
      oxygenated: true,
    },
  ];
  const valves = [
    {
      id: "tricuspid",
      x: cx - scale * 0.32,
      y: cy - scale * 0.12,
      caption: "The tricuspid valve. Blood passes from the right atrium into the right ventricle, and the valve stops it flowing back.",
    },
    {
      id: "mitral",
      x: cx + scale * 0.3,
      y: cy - scale * 0.1,
      caption: "The mitral valve, between the left atrium and the left ventricle.",
    },
    {
      id: "pulmonary",
      x: cx - scale * 0.16,
      y: cy - scale * 0.5,
      caption: "The pulmonary valve. It opens when the right ventricle sends blood toward the lungs.",
    },
    {
      id: "aortic",
      x: cx + scale * 0.14,
      y: cy - scale * 0.52,
      caption: "The aortic valve. It opens when the left ventricle contracts, and blood leaves for the body.",
    },
  ];
  return { chambers, valves };
}

function drawHeartOrgan(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  scale: number,
  time: number,
  warmth: number,
  still: boolean,
  detailed: boolean,
) {
  const { atrial, ventricular } = cycleOf(time, still);
  const layout = heartLayout(cx, cy, scale, atrial, ventricular);
  const muscle = ctx.createRadialGradient(cx, cy, scale * 0.1, cx, cy + scale * 0.1, scale * 0.85);
  muscle.addColorStop(0, mix("#8d4544", "#c47a68", warmth));
  muscle.addColorStop(1, "#4e2428");
  ctx.beginPath();
  ctx.moveTo(cx - scale * 0.02, cy - scale * 0.7);
  ctx.bezierCurveTo(cx - scale * 1.05, cy - scale * 0.86, cx - scale * 1.02, cy + scale * 0.02, cx - scale * 0.42, cy + scale * 0.46);
  ctx.quadraticCurveTo(cx - scale * 0.02, cy + scale * 0.7, cx + scale * 0.36, cy + scale * 0.5);
  ctx.bezierCurveTo(cx + scale * 1.08, cy + scale * 0.12, cx + scale * 0.95, cy - scale * 0.84, cx + scale * 0.08, cy - scale * 0.62);
  ctx.closePath();
  ctx.fillStyle = muscle;
  ctx.fill();
  ctx.strokeStyle = `rgba(90, 36, 38, ${0.4 + warmth * 0.3})`;
  ctx.lineWidth = 2;
  for (let line = 0; line < 5; line += 1) {
    ctx.beginPath();
    ctx.moveTo(cx - scale * 0.2 + line * scale * 0.08, cy - scale * 0.1);
    ctx.quadraticCurveTo(cx + line * 4, cy + scale * 0.2, cx + scale * 0.05 + line * 3, cy + scale * 0.5);
    ctx.stroke();
  }
  ctx.lineCap = "round";
  ctx.strokeStyle = "#7f96b0";
  ctx.lineWidth = Math.max(6, scale * 0.08);
  ctx.beginPath();
  ctx.moveTo(cx - scale * 0.34, cy - scale * 0.34);
  ctx.lineTo(cx - scale * 0.4, cy - scale * 0.78);
  ctx.stroke();
  ctx.strokeStyle = "#b5524e";
  ctx.beginPath();
  ctx.moveTo(cx + scale * 0.28, cy + scale * 0.02);
  ctx.quadraticCurveTo(cx + scale * 0.1, cy - scale * 0.62, cx + scale * 0.52, cy - scale * 0.66);
  ctx.stroke();
  ctx.strokeStyle = "#8ea4bc";
  ctx.beginPath();
  ctx.moveTo(cx - scale * 0.2, cy - scale * 0.08);
  ctx.quadraticCurveTo(cx - scale * 0.08, cy - scale * 0.55, cx + scale * 0.08, cy - scale * 0.78);
  ctx.stroke();
  for (const chamber of layout.chambers) {
    const fill = chamber.oxygenated ? "#a84844" : "#6e8eae";
    ctx.beginPath();
    ctx.ellipse(chamber.x, chamber.y, chamber.rx, chamber.ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 236, 220, 0.28)";
    ctx.lineWidth = 1.4;
    ctx.stroke();
  }
  if (detailed) {
    ctx.fillStyle = "rgba(255, 236, 214, 0.8)";
    ctx.font = "12px Georgia";
    ctx.textAlign = "center";
    ctx.fillText("from the body", layout.chambers[0].x, layout.chambers[0].y - layout.chambers[0].ry - 8);
    ctx.fillText("from the lungs", layout.chambers[2].x, layout.chambers[2].y - layout.chambers[2].ry - 8);
    for (const valve of layout.valves) {
      const open = valve.id === "aortic" || valve.id === "pulmonary" ? ventricular : 1 - ventricular;
      ctx.strokeStyle = `rgba(244, 228, 206, ${0.35 + open * 0.5})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(valve.x - 7, valve.y);
      ctx.lineTo(valve.x, valve.y - 6 * open);
      ctx.lineTo(valve.x + 7, valve.y);
      ctx.stroke();
    }
  }
  return layout;
}

function waypoint(route: "body" | "lung", t: number, cx: number, cy: number, scale: number) {
  const body = [
    { x: cx - scale * 0.4, y: cy - scale * 0.78 },
    { x: cx - scale * 0.34, y: cy - scale * 0.34 },
    { x: cx - scale * 0.3, y: cy + scale * 0.08 },
    { x: cx + scale * 0.08, y: cy - scale * 0.78 },
  ];
  const lung = [
    { x: cx + scale * 0.52, y: cy - scale * 0.6 },
    { x: cx + scale * 0.32, y: cy - scale * 0.32 },
    { x: cx + scale * 0.28, y: cy + scale * 0.1 },
    { x: cx + scale * 0.52, y: cy - scale * 0.66 },
  ];
  const points = route === "body" ? body : lung;
  const scaled = t * (points.length - 1);
  const index = Math.min(points.length - 2, Math.floor(scaled));
  const local = scaled - index;
  const from = points[index];
  const to = points[index + 1];
  if (!from || !to) return { x: cx, y: cy };
  return { x: from.x + (to.x - from.x) * local, y: from.y + (to.y - from.y) * local };
}

function drawEcg(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  chaos: number,
) {
  const y = height - 58;
  const left = 28;
  const right = width - 120;
  ctx.strokeStyle = "rgba(120, 64, 58, 0.35)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(left, y);
  ctx.lineTo(right, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.strokeStyle = chaos > 0.2 ? "#e07a6a" : "#d7a08a";
  ctx.lineWidth = 1.6;
  for (let x = left; x <= right; x += 3) {
    const u = (x - left) / (right - left);
    const local = (u * 4 + time * 0.35) % 1;
    let spike = 0;
    if (local > 0.12 && local < 0.18) spike = -6;
    if (local > 0.34 && local < 0.36) spike = 8;
    if (local > 0.36 && local < 0.4) spike = -22;
    if (local > 0.4 && local < 0.44) spike = 10;
    if (local > 0.58 && local < 0.7) spike = -8;
    if (chaos > 0) spike = Math.sin(u * 90 + time * 28) * (10 + chaos * 16);
    const py = y + spike;
    if (x === left) ctx.moveTo(x, py);
    else ctx.lineTo(x, py);
  }
  ctx.stroke();
}

function inEllipse(x: number, y: number, cx: number, cy: number, rx: number, ry: number) {
  const nx = (x - cx) / rx;
  const ny = (y - cy) / ry;
  return nx * nx + ny * ny <= 1;
}

  function drawCellView(ctx: CanvasRenderingContext2D, width: number, height: number, rt: Runtime) {
    ctx.fillStyle = "#1c1814";
    ctx.fillRect(0, 0, width, height);
    const cx = width / 2;
    const cy = height / 2 + 10;
    const radius = Math.min(width, height) * 0.38;
    const wash = ctx.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius);
    wash.addColorStop(0, "#d9c5a2");
    wash.addColorStop(1, "#b08968");
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = wash;
    ctx.fill();
    for (let grain = 0; grain < 80; grain += 1) {
      const angle = hash(grain) * Math.PI * 2;
      const dist = hash(grain + 4) * radius * 0.9;
      ctx.fillStyle = "rgba(120, 78, 48, 0.12)";
      ctx.beginPath();
      ctx.arc(cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = "rgba(92, 58, 42, 0.85)";
    ctx.lineWidth = 10;
    ctx.stroke();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(244, 230, 206, 0.45)";
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 8, 0, Math.PI * 2);
    ctx.stroke();
    const nucleus = { x: cx - radius * 0.06, y: cy, r: radius * 0.28 };
    ctx.beginPath();
    ctx.arc(nucleus.x, nucleus.y, nucleus.r, 0, Math.PI * 2);
    ctx.fillStyle = rt.inspected.has("nucleus") ? "#6d445c" : "#5c3a4e";
    ctx.fill();
    ctx.strokeStyle = "rgba(244, 220, 206, 0.35)";
    for (let pore = 0; pore < 10; pore += 1) {
      const angle = (pore / 10) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(nucleus.x + Math.cos(angle) * nucleus.r, nucleus.y + Math.sin(angle) * nucleus.r, 2, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(nucleus.x + 6, nucleus.y + 4, nucleus.r * 0.32, 0, Math.PI * 2);
    ctx.fillStyle = "#3a2434";
    ctx.fill();
    const mitos = [
      { x: cx + radius * 0.4, y: cy - radius * 0.28, rot: 0.4 },
      { x: cx - radius * 0.42, y: cy + radius * 0.3, rot: -0.6 },
      { x: cx + radius * 0.08, y: cy + radius * 0.4, rot: 0.2 },
    ];
    for (const mito of mitos) {
      ctx.save();
      ctx.translate(mito.x, mito.y);
      ctx.rotate(mito.rot);
      ctx.fillStyle = rt.inspected.has("mitochondrion") ? "#d4845c" : "#c46a42";
      ctx.beginPath();
      ctx.ellipse(0, 0, radius * 0.16, radius * 0.07, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(92, 40, 28, 0.7)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-radius * 0.1, 0);
      ctx.bezierCurveTo(-radius * 0.02, -8, radius * 0.04, 8, radius * 0.1, 0);
      ctx.stroke();
      ctx.restore();
    }
    ctx.fillStyle = "#6e4a32";
    for (let dot = 0; dot < 14; dot += 1) {
      const angle = hash(dot) * Math.PI * 2;
      const dist = radius * (0.08 + hash(dot + 2) * 0.08);
      ctx.beginPath();
      ctx.arc(cx + radius * 0.42 + Math.cos(angle) * dist, cy + radius * 0.16 + Math.sin(angle) * dist * 0.6, 2.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = "rgba(120, 78, 48, 0.8)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - radius * 0.46, cy - radius * 0.22);
    for (let fold = 0; fold < 4; fold += 1) {
      ctx.quadraticCurveTo(
        cx - radius * 0.4 + fold * 8,
        cy - radius * 0.34 + (fold % 2) * 16,
        cx - radius * 0.32 + fold * 10,
        cy - radius * 0.2,
      );
    }
    ctx.stroke();
    if (!rt.still) {
      for (let speck = 0; speck < 8; speck += 1) {
        const angle = rt.time * 0.15 + speck;
        ctx.fillStyle = "rgba(255, 244, 220, 0.35)";
        ctx.beginPath();
        ctx.arc(cx + Math.cos(angle) * radius * 0.55, cy + Math.sin(angle * 0.8) * radius * 0.4, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function drawHeartView(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    rt: Runtime,
    motion: number,
  ) {
    const wash = ctx.createLinearGradient(0, 0, 0, height);
    wash.addColorStop(0, "#1a1416");
    wash.addColorStop(1, mix("#24181a", "#3a2422", rt.warmth));
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, width, height);
    const cx = width / 2;
    const cy = height * 0.46;
    const scale = Math.min(width, height) * 0.34;
    drawHeartOrgan(ctx, cx, cy, scale, rt.time, rt.warmth, rt.still, true);
    if (rt.view === "heart") {
      if (rt.time > rt.dropAt) {
        rt.dropAt = rt.time + 0.42;
        rt.drops.push({ route: "body", t: 0 }, { route: "lung", t: 0 });
        rt.drops = rt.drops.filter((drop) => drop.t < 1).slice(-24);
      }
      for (const drop of rt.drops) {
        drop.t += motion > 0 ? 0.012 : 0;
        const at = waypoint(drop.route, drop.t, cx, cy, scale);
        ctx.fillStyle = drop.route === "body" ? "rgba(126, 156, 186, 0.9)" : "rgba(196, 92, 86, 0.9)";
        ctx.beginPath();
        ctx.arc(at.x, at.y, 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (rt.found.has("love")) {
      FRAGMENTS.forEach((fragment, index) => {
        if (!rt.found.has(fragment.id)) return;
        const angle = (rt.still ? 0 : rt.time * 0.15) + index * 0.9;
        const orbit = scale * 0.95;
        ctx.fillStyle = "rgba(244, 228, 206, 0.72)";
        ctx.font = `13px ${rt.fonts.hand}`;
        ctx.textAlign = "center";
        ctx.fillText(fragment.word, cx + Math.cos(angle) * orbit, cy + Math.sin(angle) * orbit * 0.62);
      });
    }
    const chaos = rt.chaosUntil > rt.time ? (rt.chaosUntil - rt.time) / 2.3 : 0;
    drawEcg(ctx, width, height, rt.time, chaos);
  }

  function drawDark(ctx: CanvasRenderingContext2D, width: number, height: number, rt: Runtime) {
    const cx = width / 2;
    const cy = height * 0.42;
    const pulse = 78 + rt.thump * 16;
    const glow = ctx.createRadialGradient(cx, cy, 8, cx, cy, pulse);
    glow.addColorStop(0, "rgba(232, 196, 150, 0.55)");
    glow.addColorStop(1, "rgba(232, 196, 150, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, pulse, 0, Math.PI * 2);
    ctx.fill();
    if (rt.membrane > 0) {
      ctx.strokeStyle = `rgba(226, 196, 168, ${0.15 + rt.membrane * 0.55})`;
      ctx.lineWidth = 2 + rt.membrane * 8;
      ctx.beginPath();
      ctx.arc(cx, cy, 70 + rt.membrane * Math.min(width, height) * 0.28, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(236, 220, 196, 0.78)";
    ctx.font = `13px ${rt.fonts.mono}`;
    ctx.textAlign = "center";
    ctx.fillText(GRADE_MARK, cx, cy - 8);
    drawVoice(ctx, rt.slip, rt.fonts.display, width, height, true);
  }


export function LivingField({
  teacher,
  covered,
  reducedMotion,
  onEnterMemory,
  onLeave,
}: {
  teacher: Teacher;
  covered: boolean;
  reducedMotion: boolean;
  onEnterMemory: () => void;
  onLeave: () => void;
}) {
  const sound = useSound();
  const rtRef = useRef<Runtime | null>(null);
  const enterRef = useRef(onEnterMemory);
  const teacherRef = useRef(teacher);
  const [announce, setAnnounce] = useState("");
  const [view, setView] = useState<Place>("field");
  const [calm, setCalm] = useState(false);
  const announced = useRef("");
  const viewRef = useRef<Place>("field");
  const calmRef = useRef(false);
  const advanceRef = useRef<(rt: Runtime) => void>(() => {});

  const runtime = () => {
    rtRef.current ??= createRuntime();
    return rtRef.current;
  };

  useEffect(() => {
    enterRef.current = onEnterMemory;
  }, [onEnterMemory]);

  useEffect(() => {
    teacherRef.current = teacher;
  }, [teacher]);

  useEffect(() => {
    return () => {
      sound.duck(1);
    };
  }, [sound]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const rt = runtime();
      if (rt.view === "field") {
        const step = event.shiftKey ? 140 : 80;
        if (event.key === "ArrowRight") rt.look.x += step;
        if (event.key === "ArrowLeft") rt.look.x -= step;
        if (event.key === "ArrowDown") rt.look.y += 36;
        if (event.key === "ArrowUp") rt.look.y -= 36;
        if (event.key.startsWith("Arrow")) {
          clampLook(rt.look);
          event.preventDefault();
        }
      }
      if (event.key === "Escape" && (rt.view === "cell" || rt.view === "heart")) {
        rt.view = "field";
        rt.pendingHeart = false;
        rt.caption = "";
      }
      if ((event.key === "Enter" || event.key === " ") && (rt.speech || rt.leaveDark || rt.comfortSit)) {
        event.preventDefault();
        advanceRef.current(rt);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function linesOf(id: string) {
    return teacherRef.current.memories.find((memory) => memory.id === id)?.lines ?? [];
  }

  function note(rt: Runtime, text: string) {
    rt.notice = text;
    rt.noticeUntil = rt.time + 2.8;
  }

  function begin(rt: Runtime, id: string) {
    if (rt.speech || rt.found.has(id)) return false;
    const lines = linesOf(id);
    if (!lines.length) return false;
    rt.speech = { id, lines, i: 0, silent: false };
    rt.slip = lines[0] ?? "";
    rt.comfortSit = false;
    rt.pauseUntil = rt.time + breathFor(id, rt.slip, rt.still);
    return true;
  }

  function finish(rt: Runtime, id: string) {
    rt.found.add(id);
    rt.warmth = 1;
    rt.bloom = 1;
    rt.speech = null;
  }

  function advance(rt: Runtime) {
    if (rt.comfortSit) {
      rt.comfortSit = false;
      rt.slip = "";
      return;
    }
    if (rt.leaveDark) {
      rt.leaveDark = false;
      rt.view = "field";
      rt.slip = "";
      rt.focus = "after-dark";
      rt.membrane = 0;
      return;
    }
    const speech = rt.speech;
    if (!speech || rt.time < rt.pauseUntil) return;
    if (speech.silent) {
      speech.silent = false;
      speech.i += 1;
    } else if (speech.id === "grade" && speech.lines[speech.i] === "And you hugged me.") {
      speech.silent = true;
      rt.slip = "";
      rt.pauseUntil = rt.time + (rt.still ? 1.4 : 2.8);
      return;
    } else {
      speech.i += 1;
    }
    if (speech.i >= speech.lines.length) {
      const id = speech.id;
      const last = speech.lines[speech.lines.length - 1] ?? "";
      finish(rt, id);
      if (id === "grade") {
        const held = linesOf("held");
        rt.speech = { id: "held", lines: held, i: 0, silent: false };
        rt.slip = held[0] ?? "";
        rt.membrane = 0.04;
        rt.pauseUntil = rt.time + breathFor("held", rt.slip, rt.still);
        return;
      }
      if (id === "held") {
        rt.slip = last;
        rt.leaveDark = true;
        return;
      }
      if (id === "comfort") {
        rt.slip = last;
        rt.comfortSit = true;
        return;
      }
      if (id === "warm" && rt.pendingHeart) {
        rt.pendingHeart = false;
        begin(rt, "heart");
        return;
      }
      if (id === "backflip" && !rt.letter) {
        rt.letter = true;
        rt.slip = "";
        enterRef.current();
        return;
      }
      rt.slip = "";
      return;
    }
    rt.slip = speech.lines[speech.i] ?? "";
    rt.pauseUntil = rt.time + breathFor(speech.id, rt.slip, rt.still);
  }

  useEffect(() => {
    advanceRef.current = advance;
  });

  const canvasRef = useStage((ctx, width, height, dt) => {
    const rt = runtime();
    rt.still = reducedMotion;
    if (!rt.fontsReady) {
      rt.fonts = readFonts();
      rt.fontsReady = true;
    }
    const motion = reducedMotion ? 0 : dt;
    rt.time += dt;
    const place = stations(width, height);
    const life = lifeOf(rt.found);
    const open = Math.max(life, rt.bloom);
    rt.look.viewW = width;
    rt.look.viewH = height;
    rt.look.worldW = place.worldW;
    rt.look.worldH = place.worldH;
    if (!rt.look.framed) {
      rt.look.x = 0;
      rt.look.y = place.ground - height * 0.78;
      rt.look.framed = true;
    }
    if (rt.focus === "after-dark") {
      rt.look.x = place.grade.x - width * 0.25;
      rt.focus = "";
    }
    clampLook(rt.look);
    const floor = 0.08 + life * 0.62;
    rt.warmth += (floor - rt.warmth) * Math.min(1, dt * 0.4);
    rt.bloom += (life * 0.9 - rt.bloom) * Math.min(1, dt * 0.28);
    if (rt.hold && !rt.hold.moved) {
      rt.hold.t += dt;
      if (rt.hold.t > 0.92) {
        const cell = rt.fragile[rt.hold.index];
        if (cell) cell.open = true;
        rt.hold = null;
        rt.warmth = Math.max(rt.warmth, 0.72);
        rt.bloom = Math.max(rt.bloom, 0.8);
        const opened = rt.fragile.filter((item) => item.open).length;
        if (opened >= 2) begin(rt, "kind");
        else rt.caption = "It stayed whole.";
      }
    }
    for (const cell of rt.fragile) cell.bruise = Math.max(0, cell.bruise - dt);
    if (rt.signal >= 0) {
      rt.signal += reducedMotion ? 0.02 : dt * 0.55;
      if (rt.signal >= 1) {
        rt.signal = -1;
        rt.signaled = true;
        rt.caption = "The impulse travels the axon. At the synapse, chemical signals cross to the next cell.";
        rt.warmth = Math.max(rt.warmth, 0.55);
      }
    }
    if (rt.view === "dark") {
      rt.dark = Math.min(1, rt.dark + dt * 0.5);
      const gap = reducedMotion ? 1.7 : 1.08;
      if (rt.time - rt.lastThump > gap) {
        rt.lastThump = rt.time;
        sound.thump();
        rt.thump = 1;
      }
      if (rt.speech?.id === "held" || rt.found.has("grade")) {
        rt.membrane = Math.min(1, rt.membrane + dt * 0.16);
      }
    } else {
      rt.dark = 0;
    }
    rt.thump = Math.max(0, rt.thump - dt * 1.3);
    if (rt.time > rt.noticeUntil) rt.notice = "";
    while (rt.beeps.length && rt.time >= rt.beeps[0]) {
      rt.beeps.shift();
      sound.beep();
    }
    if (rt.flipReady && rt.time > rt.chaosUntil && !rt.speech && !rt.found.has("backflip")) {
      rt.flipReady = false;
      begin(rt, "backflip");
    }
    const cameraX = rt.look.x + width / 2;
    const inQuiet = rt.view === "field" && Math.abs(cameraX - place.pool.x) < width * 0.34;
    const duck = rt.view === "dark" ? 0.5 : inQuiet || rt.speech?.id === "comfort" ? 0.36 : 1;
    if (duck !== rt.duck) {
      rt.duck = duck;
      sound.duck(duck);
    }
    if (rt.view !== viewRef.current) {
      viewRef.current = rt.view;
      setView(rt.view);
    }
    if (inQuiet !== calmRef.current) {
      calmRef.current = inQuiet;
      setCalm(inQuiet);
    }

    const skyTop = mix("#17211c", "#3a2c24", rt.warmth);
    const skyMid = mix("#1c2b24", "#3a4030", Math.max(life, rt.warmth * 0.7));
    ctx.fillStyle = skyTop;
    ctx.fillRect(0, 0, width, height);
    ctx.save();
    ctx.translate(-rt.look.x, -rt.look.y);
    const sky = ctx.createLinearGradient(0, 0, 0, place.ground);
    sky.addColorStop(0, skyTop);
    sky.addColorStop(0.55, skyMid);
    sky.addColorStop(0.86, mix("#2a3a2c", "#5a4636", rt.warmth));
    sky.addColorStop(1, "#142019");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, place.worldW, place.worldH);

    const moon = ctx.createRadialGradient(width * 0.74, place.ground - height * 0.58, 4, width * 0.74, place.ground - height * 0.58, 70);
    moon.addColorStop(0, `rgba(244, 232, 206, ${0.55 + rt.warmth * 0.35})`);
    moon.addColorStop(1, "rgba(244, 232, 206, 0)");
    ctx.fillStyle = moon;
    ctx.beginPath();
    ctx.arc(width * 0.74, place.ground - height * 0.58, 70, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(248, 240, 220, ${0.75 + rt.warmth * 0.2})`;
    ctx.beginPath();
    ctx.arc(width * 0.74, place.ground - height * 0.58, 16, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = mix("#15241c", "#1e3024", life);
    ctx.beginPath();
    ctx.moveTo(0, place.ground - 80);
    for (let x = 0; x <= place.worldW; x += 48) {
      const rise = 180 + Math.sin(x * 0.0016) * 46 + Math.sin(x * 0.0007) * 28;
      ctx.lineTo(x, place.ground - rise);
    }
    ctx.lineTo(place.worldW, place.ground);
    ctx.lineTo(0, place.ground);
    ctx.fill();

    ctx.fillStyle = mix("#1c3026", "#2a4030", life);
    ctx.beginPath();
    ctx.moveTo(0, place.ground - 20);
    for (let x = 0; x <= place.worldW; x += 28) {
      const rise = 90 + life * 24 + Math.sin(x * 0.004 + 1) * 18 + Math.sin(x * 0.0013) * 26;
      ctx.lineTo(x, place.ground - rise);
    }
    ctx.lineTo(place.worldW, place.ground);
    ctx.lineTo(0, place.ground);
    ctx.fill();

    const trees = 26 + Math.floor(life * 10);
    for (let index = 0; index < trees; index += 1) {
      const x = (index + 0.2) * (place.worldW / trees);
      const h = 90 + hash(index) * 110 + life * 70;
      ctx.fillStyle = `rgba(16, 36, 26, ${0.55 + life * 0.3})`;
      ctx.beginPath();
      ctx.moveTo(x, place.ground - 70);
      ctx.quadraticCurveTo(x + 18, place.ground - 70 - h * 0.7, x + 10, place.ground - 70 - h);
      ctx.quadraticCurveTo(x + 4, place.ground - 70 - h * 0.55, x + 26, place.ground - 70);
      ctx.fill();
    }

    ctx.fillStyle = "#1a2a20";
    ctx.fillRect(0, place.ground - 6, place.worldW, place.worldH - place.ground + 8);
    ctx.fillStyle = "#24362c";
    ctx.fillRect(0, place.ground - 2, place.worldW, 16);
    ctx.strokeStyle = "rgba(92, 130, 86, 0.28)";
    ctx.lineWidth = 1;
    for (let blade = 0; blade < 280; blade += 1) {
      const x = hash(blade + 20) * place.worldW;
      ctx.beginPath();
      ctx.moveTo(x, place.ground);
      ctx.lineTo(x + 3, place.ground - 7 - hash(blade + 21) * 14);
      ctx.stroke();
    }
    for (let blade = 0; blade < 160; blade += 1) {
      const x = hash(blade + 80) * place.worldW;
      const y = place.ground + 16 + hash(blade + 81) * 90;
      ctx.strokeStyle = `rgba(46, 78, 52, ${0.25 + hash(blade + 82) * 0.35})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y + 18);
      ctx.quadraticCurveTo(x + 6, y, x + 2, y - 16);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(214, 206, 180, 0.05)";
    for (let band = 0; band < 4; band += 1) {
      ctx.beginPath();
      ctx.ellipse(place.worldW * (0.15 + band * 0.22), place.ground - 30, 220, 18, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    const pond = ctx.createRadialGradient(place.pond.x, place.ground - 20, 10, place.pond.x, place.ground - 10, 120);
    pond.addColorStop(0, "rgba(48, 78, 70, 0.55)");
    pond.addColorStop(1, "rgba(20, 32, 28, 0)");
    ctx.fillStyle = pond;
    ctx.beginPath();
    ctx.ellipse(place.pond.x, place.ground - 8, 130, 28, 0, 0, Math.PI * 2);
    ctx.fill();
    if (rt.warmth > 0.25) {
      ctx.fillStyle = `rgba(232, 196, 140, ${rt.warmth * 0.28})`;
      ctx.beginPath();
      ctx.ellipse(place.pond.x + 20, place.ground - 6, 36, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    const quiet = ctx.createRadialGradient(place.pool.x, place.pool.y, 10, place.pool.x, place.pool.y, 190);
    quiet.addColorStop(0, "rgba(42, 78, 82, 0.9)");
    quiet.addColorStop(0.7, "rgba(22, 40, 46, 0.75)");
    quiet.addColorStop(1, "rgba(16, 28, 28, 0)");
    ctx.fillStyle = quiet;
    ctx.beginPath();
    ctx.ellipse(place.pool.x, place.pool.y + 8, 190, 58, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(198, 214, 186, 0.35)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(place.pool.x, place.pool.y + 4, 150, 28, 0, 0, Math.PI * 2);
    ctx.stroke();
    for (let pad = 0; pad < 4; pad += 1) {
      ctx.fillStyle = "rgba(70, 110, 72, 0.55)";
      ctx.beginPath();
      ctx.ellipse(place.pool.x - 70 + pad * 46, place.pool.y + 6, 18, 8, 0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    drawWindow(ctx, place.window.x, place.window.y, rt.warmth);
    drawTree(ctx, place.tree.x, place.ground, rt.found, rt.fonts.hand);

    const plantCount = 42;
    for (let index = 0; index < plantCount; index += 1) {
      const x = 80 + ((index + hash(index) * 0.4) / plantCount) * (place.worldW - 160);
      const near =
        Math.abs(x - place.cell.x) < 70 ||
        Math.abs(x - place.dna.x) < 70 ||
        Math.abs(x - place.neuron.x) < 90 ||
        Math.abs(x - place.heart.x) < 60 ||
        Math.abs(x - place.heart2.x) < 70 ||
        Math.abs(x - place.fragile.x) < 90 ||
        Math.abs(x - place.room.x) < 100;
      if (near) continue;
      const stem = 34 + open * 78 * (0.4 + hash(index + 3) * 0.7);
      drawPlant(ctx, x, place.ground, stem, open, index, rt.time, reducedMotion);
    }

    const spores = 6 + Math.floor(life * 28);
    for (let index = 0; index < spores; index += 1) {
      const drift = reducedMotion ? 0 : (rt.time * (8 + hash(index) * 14) + hash(index + 2) * height) % (height * 0.8);
      const x = hash(index + 4) * place.worldW;
      const y = place.ground - 40 - drift;
      ctx.fillStyle = `rgba(214, 206, 150, ${0.08 + life * 0.28})`;
      ctx.beginPath();
      ctx.arc(x, y, hash(index + 6) > 0.8 ? 2.2 : 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    const pondCount = 2 + Math.min(5, rt.splits) + Math.min(4, Math.floor(rt.found.size / 2));
    for (let index = 0; index < pondCount; index += 1) {
      const drift = reducedMotion ? 0 : Math.sin(rt.time * 0.45 + index) * 8;
      const x = place.pond.x - 36 + (index % 4) * 34 + drift;
      const y = place.pond.y - Math.floor(index / 4) * 42 + (reducedMotion ? 0 : Math.cos(rt.time * 0.35 + index) * 5);
      drawCellBody(ctx, x, y, 15 + (index % 3) * 5, open);
    }

    drawCellBody(ctx, place.cell.x, place.cell.y, 48, 0.35 + open * 0.4);
    ctx.fillStyle = "rgba(236, 226, 208, 0.55)";
    ctx.font = `12px ${rt.fonts.hand}`;
    ctx.textAlign = "center";
    ctx.fillText("cell", place.cell.x, place.cell.y + 68);

    drawDna(ctx, place.dna.x, place.dna.y, rt.pairs, rt.time, reducedMotion, rt.fonts.mono);
    drawNeuron(ctx, place.neuron.x, place.neuron.y, rt.signal, rt.signaled, rt.time, rt.fonts.hand);
    drawHeartOrgan(ctx, place.heart.x, place.heart.y, 54, rt.time, rt.warmth, reducedMotion, false);
    ctx.fillStyle = "rgba(236, 226, 208, 0.55)";
    ctx.font = `12px ${rt.fonts.hand}`;
    ctx.fillText("heart", place.heart.x, place.heart.y + 62);

    rt.fragile.forEach((cell, index) => {
      const x = place.fragile.x + (index - 1) * 58;
      drawFragileCell(ctx, x, place.fragile.y, cell, rt.hold?.index === index, rt.time);
    });

    const flowerOpen = rt.found.has("again") ? 1 : open;
    for (let index = 0; index < 5; index += 1) {
      drawPlant(
        ctx,
        place.flowers.x - 48 + index * 24,
        place.ground,
        36 + index * 8,
        flowerOpen,
        index + 20,
        rt.time,
        reducedMotion,
      );
    }

    drawClassroom(ctx, place.room.x, place.ground, rt.found.has("again") ? Math.max(rt.warmth, 0.65) : rt.warmth * 0.4);
    drawGradeDoor(ctx, place.grade.x, place.ground, rt.found.has("class"));
    drawStone(ctx, place.love.x, place.love.y, rt.found.has("held"), rt.time);
    drawHeartOrgan(
      ctx,
      place.heart2.x,
      place.heart2.y,
      62 + life * 10,
      rt.time,
      rt.found.has("love") ? Math.max(rt.warmth, 0.8) : rt.warmth * 0.5,
      reducedMotion,
      false,
    );

    ctx.restore();

    const vignette = ctx.createRadialGradient(width / 2, height / 2, width * 0.3, width / 2, height / 2, width * 0.72);
    vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
    vignette.addColorStop(1, "rgba(8, 10, 8, 0.28)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);

    if (rt.view === "cell") drawCellView(ctx, width, height, rt);
    if (rt.view === "heart") drawHeartView(ctx, width, height, rt, motion);
    if (rt.view === "dark") {
      ctx.fillStyle = `rgba(8, 6, 5, ${0.2 + rt.dark * 0.8})`;
      ctx.fillRect(0, 0, width, height);
      drawDark(ctx, width, height, rt);
    }

    if (rt.view !== "dark") {
      drawCaption(ctx, rt.caption || rt.notice, rt.fonts.hand, width);
      drawVoice(ctx, rt.slip, rt.fonts.display, width, height, false);
    }
    if (rt.view === "field" && !rt.look.looked && !rt.speech && !inQuiet) {
      ctx.fillStyle = "rgba(236, 226, 208, 0.45)";
      ctx.font = `12px ${rt.fonts.mono}`;
      ctx.textAlign = "left";
      ctx.fillText("Drag to look.", 22, 28);
    }

    const status = [rt.slip, rt.caption, rt.notice].filter(Boolean).join(" ");
    if (status !== announced.current) {
      announced.current = status;
      setAnnounce(status);
    }
  });

  function pointOf(event: PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top, width: rect.width, height: rect.height };
  }

  function onPointerDown(event: PointerEvent<HTMLCanvasElement>) {
    const rt = runtime();
    const point = pointOf(event);
    event.currentTarget.setPointerCapture(event.pointerId);
    if (rt.view !== "field") {
      startPan(rt.look, point.x, point.y);
      rt.look.panning = false;
      rt.hold = null;
      return;
    }
    const worldX = point.x + rt.look.x;
    const worldY = point.y + rt.look.y;
    const place = stations(point.width, point.height);
    const index = rt.fragile.findIndex((_, item) => {
      const x = place.fragile.x + (item - 1) * 58;
      return Math.hypot(worldX - x, worldY - place.fragile.y) < 28;
    });
    if (index >= 0) {
      rt.hold = { index, x: point.x, y: point.y, t: 0, moved: false };
      rt.suppress = true;
      rt.look.panning = false;
      return;
    }
    startPan(rt.look, point.x, point.y);
  }

  function onPointerMove(event: PointerEvent<HTMLCanvasElement>) {
    const rt = runtime();
    const point = pointOf(event);
    if (rt.hold) {
      if (Math.hypot(point.x - rt.hold.x, point.y - rt.hold.y) > 14) {
        const cell = rt.fragile[rt.hold.index];
        if (cell && !cell.open) cell.bruise = 2.4;
        rt.hold.moved = true;
        rt.hold = null;
        note(rt, "It gives, if you hold it gently.");
      }
      return;
    }
    if (rt.look.panning && rt.view === "field") dragPan(rt.look, point.x, point.y);
  }

  function onPointerUp(event: PointerEvent<HTMLCanvasElement>) {
    const rt = runtime();
    const point = pointOf(event);
    if (rt.hold || rt.suppress) {
      if (rt.hold && !rt.hold.moved && rt.hold.t < 0.92) note(rt, "Keep still a moment. It doesn't need force.");
      rt.hold = null;
      rt.suppress = false;
      return;
    }
    const moved = rt.look.panning && stopPan(rt.look, point.x, point.y);
    rt.look.panning = false;
    if (moved) return;
    activate(rt, point.x, point.y, point.width, point.height);
  }

  function onWheel(event: WheelEvent<HTMLCanvasElement>) {
    const rt = runtime();
    if (rt.view !== "field") return;
    rt.look.x += event.deltaX + (event.shiftKey ? event.deltaY : 0);
    if (!event.shiftKey) rt.look.y += event.deltaY * 0.15;
    clampLook(rt.look);
  }

  function activate(rt: Runtime, x: number, y: number, width: number, height: number) {
    if (rt.view === "dark") {
      if (!rt.speech && !rt.leaveDark) {
        rt.view = "field";
        rt.slip = "";
        return;
      }
      advance(rt);
      return;
    }
    if (rt.view === "cell") {
      if (x < 140 && y < 64) {
        rt.view = "field";
        rt.caption = "";
        return;
      }
      inspectCell(rt, x, y, width, height);
      return;
    }
    if (rt.view === "heart") {
      if (x < 140 && y < 64) {
        rt.view = "field";
        rt.pendingHeart = false;
        rt.caption = "";
        return;
      }
      inspectHeart(rt, x, y, width, height);
      return;
    }
    const worldX = x + rt.look.x;
    const worldY = y + rt.look.y;
    const place = stations(width, height);
    if (rt.speech && y > height - 160) {
      advance(rt);
      return;
    }
    if (rt.comfortSit && y > height - 160) {
      advance(rt);
      return;
    }

    const pondCount = 2 + Math.min(5, rt.splits) + Math.min(4, Math.floor(rt.found.size / 2));
    for (let index = 0; index < pondCount; index += 1) {
      const drift = rt.still ? 0 : Math.sin(rt.time * 0.45 + index) * 8;
      const cx = place.pond.x - 36 + (index % 4) * 34 + drift;
      const cy = place.pond.y - Math.floor(index / 4) * 42;
      if (Math.hypot(worldX - cx, worldY - cy) < 22) {
        if (rt.speech?.id === "smile") {
          advance(rt);
          return;
        }
        if (rt.splits < 6) rt.splits += 1;
        rt.warmth = Math.max(rt.warmth, 0.85);
        rt.bloom = Math.max(rt.bloom, 0.7);
        if (!rt.found.has("smile")) begin(rt, "smile");
        else rt.caption = "One cell became two.";
        return;
      }
    }

    if (Math.hypot(worldX - place.cell.x, worldY - place.cell.y) < 52) {
      rt.view = "cell";
      rt.caption = "";
      return;
    }

    for (let index = 0; index < STRAND.length; index += 1) {
      const bx = place.dna.x + 36;
      const by = place.dna.y + 14 + index * 28;
      if (Math.hypot(worldX - bx, worldY - by) < 16) {
        if (rt.speech?.id === "teach") {
          advance(rt);
          return;
        }
        if (rt.speech) return;
        const current = rt.pairs[index] ?? "A";
        const flipped = nextBase(current);
        rt.pairs[index] = flipped;
        const base = STRAND[index] ?? "A";
        if (flipped === pairOf(base)) {
          const bonds = base === "G" || base === "C" ? "three" : "two";
          const name = base === "A" || base === "T" ? "Adenine pairs with thymine" : "Guanine pairs with cytosine";
          rt.caption = `${name}. ${bonds === "three" ? "Three" : "Two"} hydrogen bonds.`;
          rt.warmth = Math.max(rt.warmth, 0.4);
        } else {
          rt.caption = "Adenine pairs with thymine. Guanine pairs with cytosine.";
        }
        if (strandReady(rt.pairs)) {
          rt.caption = "The two strands match. A with T. G with C.";
          rt.bloom = Math.max(rt.bloom, 0.85);
          begin(rt, "teach");
        }
        return;
      }
    }

    if (Math.hypot(worldX - place.neuron.x, worldY - place.neuron.y) < 30) {
      if (rt.signal < 0) rt.signal = 0;
      return;
    }

    if (Math.hypot(worldX - place.heart.x, worldY - place.heart.y) < 48) {
      rt.view = "heart";
      rt.pendingHeart = false;
      rt.caption = "";
      return;
    }

    if (Math.hypot(worldX - place.pool.x, worldY - place.pool.y) < 120 && Math.abs(worldY - place.pool.y) < 70) {
      if (rt.speech && rt.speech.id !== "comfort") return;
      if (rt.speech?.id === "comfort" || rt.comfortSit) {
        advance(rt);
        return;
      }
      begin(rt, "comfort");
      return;
    }

    if (Math.hypot(worldX - place.flowers.x, worldY - (place.ground - 40)) < 70) {
      if (rt.speech && rt.speech.id !== "again") return;
      if (!rt.found.has("comfort")) {
        note(rt, "They are still closed.");
        return;
      }
      if (rt.speech?.id === "again") {
        advance(rt);
        return;
      }
      rt.bloom = 1;
      begin(rt, "again");
      return;
    }

    if (worldX > place.room.x - 80 && worldX < place.room.x + 100 && worldY > place.ground - 140 && worldY < place.ground) {
      if (rt.speech && rt.speech.id !== "class") return;
      if (!rt.found.has("again")) {
        note(rt, "The room is quiet.");
        return;
      }
      if (rt.speech?.id === "class") {
        advance(rt);
        return;
      }
      begin(rt, "class");
      return;
    }

    if (Math.abs(worldX - place.grade.x) < 36 && worldY > place.ground - 120 && worldY < place.ground + 10) {
      if (rt.speech) return;
      if (!rt.found.has("class")) {
        note(rt, "This part of the field is still quiet.");
        return;
      }
      if (rt.found.has("held")) return;
      rt.view = "dark";
      rt.dark = 0;
      if (!rt.found.has("grade")) begin(rt, "grade");
      return;
    }

    if (Math.hypot(worldX - place.love.x, worldY - place.love.y) < 36) {
      if (!rt.found.has("held")) {
        note(rt, "Not yet.");
        return;
      }
      if (rt.speech?.id === "love") {
        advance(rt);
        return;
      }
      begin(rt, "love");
      return;
    }

    if (Math.hypot(worldX - place.heart2.x, worldY - place.heart2.y) < 58) {
      if (!rt.found.has("love")) {
        note(rt, "It is beating. There is more of the field before this.");
        return;
      }
      rt.view = "heart";
      rt.caption = "";
      if (!rt.found.has("heart") && !rt.speech) {
        if (!rt.found.has("warm")) {
          rt.pendingHeart = true;
          begin(rt, "warm");
        } else begin(rt, "heart");
      }
    }
  }

  function inspectCell(rt: Runtime, x: number, y: number, width: number, height: number) {
    if (rt.speech?.id === "smart" && y > height - 160) {
      advance(rt);
      return;
    }
    const cx = width / 2;
    const cy = height / 2 + 10;
    const radius = Math.min(width, height) * 0.38;
    const hits: { id: string; x: number; y: number; r: number }[] = [
      { id: "nucleus", x: cx - radius * 0.06, y: cy, r: radius * 0.28 },
      { id: "mitochondrion", x: cx + radius * 0.4, y: cy - radius * 0.28, r: radius * 0.18 },
      { id: "mitochondrion", x: cx - radius * 0.42, y: cy + radius * 0.3, r: radius * 0.18 },
      { id: "mitochondrion", x: cx + radius * 0.08, y: cy + radius * 0.4, r: radius * 0.16 },
      { id: "ribosome", x: cx + radius * 0.42, y: cy + radius * 0.16, r: radius * 0.14 },
      { id: "golgi", x: cx - radius * 0.38, y: cy - radius * 0.26, r: radius * 0.14 },
    ];
    const hit = hits.find((item) => Math.hypot(x - item.x, y - item.y) < item.r + 8);
    const dist = Math.hypot(x - cx, y - cy);
    const id = hit?.id ?? (dist > radius * 0.72 && dist < radius + 20 ? "membrane" : "");
    const chosen = id || (dist < radius ? "cytoplasm" : "");
    if (!chosen) return;
    const fresh = !rt.inspected.has(chosen);
    rt.inspected.add(chosen);
    rt.caption = ORGANS[chosen] ?? "";
    if (fresh) rt.warmth = Math.max(rt.warmth, 0.35);
    const needed = ["nucleus", "mitochondrion", "ribosome", "membrane"];
    if (needed.every((organ) => rt.inspected.has(organ))) {
      rt.bloom = Math.max(rt.bloom, 0.8);
      begin(rt, "smart");
    }
  }

  function inspectHeart(rt: Runtime, x: number, y: number, width: number, height: number) {
    if (y > height - 92 && x < width - 100) {
      if (rt.found.has("backflip") && !rt.letter) {
        rt.letter = true;
        enterRef.current();
        return;
      }
      if (rt.speech?.id === "backflip") {
        advance(rt);
        return;
      }
      if (rt.found.has("heart") && !rt.found.has("backflip") && !rt.speech && rt.time > rt.chaosUntil) {
        const span = rt.still ? 0.7 : 2.3;
        rt.chaosUntil = rt.time + span;
        rt.flipReady = true;
        rt.beeps = (rt.still ? [0.05] : [0.04, 0.26, 0.46, 0.64, 0.84, 1.02]).map((offset) => rt.time + offset);
        return;
      }
    }
    if ((rt.speech || rt.comfortSit) && y > height - 170) {
      advance(rt);
      return;
    }
    const cx = width / 2;
    const cy = height * 0.46;
    const scale = Math.min(width, height) * 0.34;
    const { atrial, ventricular } = cycleOf(rt.time, rt.still);
    const layout = heartLayout(cx, cy, scale, atrial, ventricular);
    const valve = layout.valves.find((item) => Math.hypot(x - item.x, y - item.y) < 18);
    const chamber = layout.chambers.find((item) => inEllipse(x, y, item.x, item.y, item.rx, item.ry));
    const caption = valve?.caption ?? chamber?.caption;
    if (caption) {
      rt.caption = caption;
      if (!rt.found.has("warm") && !rt.speech && !rt.pendingHeart) {
        rt.warmth = 1;
        begin(rt, "warm");
      }
      return;
    }
    if (rt.speech) advance(rt);
  }

  function stepBack() {
    const rt = runtime();
    rt.view = "field";
    rt.pendingHeart = false;
    rt.caption = "";
  }

  return (
    <div className={`lab-shell${covered ? " is-covered" : ""}`}>
      <p className="sr-only">
        Drag the field, or use the arrow keys. Click a cell in the water and it divides. A larger cell can be
        entered. The strand on the right can be paired: adenine with thymine, guanine with cytosine. Click the
        neuron to send a signal. Hold a fragile cell still. Further on, the water is quiet, and there is nothing
        to solve there. Enter continues a line. Escape steps back from the cell or the heart.
      </p>
      <canvas
        ref={canvasRef}
        role="application"
        aria-label="The living world"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onWheel={onWheel}
      />
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
      {view === "cell" || view === "heart" ? (
        <button
          type="button"
          className="lab-leave"
          style={{ left: "0.9rem", right: "auto", top: "0.85rem", bottom: "auto" }}
          onClick={stepBack}
        >
          Step back
        </button>
      ) : null}
      <button
        type="button"
        className="lab-leave"
        style={{ opacity: calm ? 0 : view === "dark" ? 0.4 : 1, pointerEvents: calm ? "none" : "auto" }}
        onClick={onLeave}
      >
        Leave
      </button>
    </div>
  );
}
