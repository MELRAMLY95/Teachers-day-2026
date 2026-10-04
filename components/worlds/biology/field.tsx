"use client";

import { useSound } from "@/components/sound";
import type { Teacher } from "@/lib/types";
import { useCallback, useRef, useState, type PointerEvent } from "react";
import { clampLook, createLook, drawSlip, dragPan, startPan, stopPan, type Look } from "../shared/look";
import { readFonts, useStage, type Fonts } from "../shared/stage";

type Cell = { x: number; y: number; r: number; vx: number; vy: number };
type Specimen = { id: string; angle: number };

const SPECIMENS: Specimen[] = [
  { id: "smile", angle: -2.2 },
  { id: "ease", angle: -0.4 },
  { id: "mind", angle: 0.9 },
];

type Runtime = {
  cells: Cell[];
  angle: number;
  found: Set<string>;
  held: "helix" | null;
  time: number;
  fonts: Fonts;
  fontsReady: boolean;
  notice: string;
  look: Look;
  slip: string;
  heartAt: number;
};

function hash(index: number) {
  const value = Math.sin(index * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

function drawPlant(
  ctx: CanvasRenderingContext2D,
  x: number,
  ground: number,
  stem: number,
  index: number,
  time: number,
) {
  const sway = Math.sin(time * 1.2 + index) * 6;
  ctx.strokeStyle = "#2c6a42";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, ground);
  ctx.quadraticCurveTo(x + 12 + sway, ground - stem * 0.55, x + sway, ground - stem);
  ctx.stroke();
  ctx.fillStyle = index % 2 === 0 ? "#3f8f58" : "#6aaa48";
  ctx.beginPath();
  ctx.ellipse(x + sway - 12, ground - stem * 0.62, 16, 7, -0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x + sway + 10, ground - stem * 0.78, 14, 6, 0.5, 0, Math.PI * 2);
  ctx.fill();
  if (stem > 70) {
    ctx.fillStyle = "#e7d7a4";
    ctx.beginPath();
    ctx.arc(x + sway, ground - stem - 4, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function worldOf(width: number, height: number) {
  const worldW = width * 2.2;
  const worldH = height * 1.6;
  return {
    worldW,
    worldH,
    cx: worldW * 0.4,
    cy: worldH * 0.5,
    field: Math.min(width, height) * 0.34,
  };
}

function specimenAt(id: string, cx: number, cy: number, width: number, height: number) {
  if (id === "smile") return { x: cx - width * 0.78, y: cy - height * 0.08 };
  if (id === "ease") return { x: cx + width * 0.08, y: cy - height * 0.7 };
  return { x: cx + width * 0.82, y: cy + height * 0.28 };
}

function createRuntime(): Runtime {
  return {
    cells: [{ x: 0, y: 0, r: 28, vx: 0, vy: 0 }],
    angle: 0.4,
    found: new Set(),
    held: null,
    time: 0,
    fonts: { display: "Georgia", mono: "monospace", hand: "Georgia" },
    fontsReady: false,
    notice: "",
    look: createLook(),
    slip: "",
    heartAt: -1,
  };
}

export function LivingField({
  teacher,
  covered,
  onEnterMemory,
  onLeave,
}: {
  teacher: Teacher;
  covered: boolean;
  onEnterMemory: () => void;
  onLeave: () => void;
}) {
  const sound = useSound();
  const rtRef = useRef<Runtime | null>(null);
  const [announce, setAnnounce] = useState("");
  const announced = useRef("");
  const runtime = useCallback(() => {
    rtRef.current ??= createRuntime();
    return rtRef.current;
  }, []);

  const canvasRef = useStage((ctx, width, height, dt) => {
    const rt = runtime();
    if (!rt.fontsReady) {
      rt.fonts = readFonts();
      rt.fontsReady = true;
    }
    rt.time += dt;
    const room = worldOf(width, height);
    const { cx, cy, field, worldW, worldH } = room;
    rt.look.viewW = width;
    rt.look.viewH = height;
    rt.look.worldW = worldW;
    rt.look.worldH = worldH;
    if (!rt.look.framed) {
      rt.look.x = cx - width / 2;
      rt.look.y = cy - height / 2;
      rt.look.framed = true;
    }
    clampLook(rt.look);

    ctx.fillStyle = "#06110c";
    ctx.fillRect(0, 0, width, height);
    ctx.save();
    ctx.translate(-rt.look.x, -rt.look.y);
    const vignette = ctx.createRadialGradient(cx, cy, field * 0.2, cx, cy, field * 1.35);
    vignette.addColorStop(0, "rgba(18, 48, 36, 0.95)");
    vignette.addColorStop(1, "rgba(3, 8, 6, 1)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, worldW, worldH);

    const growth = rt.found.size;
    const soil = ctx.createRadialGradient(cx, cy + field * 0.9, 10, cx, cy + field * 0.8, field * 1.2);
    soil.addColorStop(0, "#143022");
    soil.addColorStop(1, "rgba(6, 16, 12, 0)");
    ctx.fillStyle = soil;
    ctx.beginPath();
    ctx.ellipse(cx, cy + field * 0.82, field * 1.15, field * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < 28; i += 1) {
      const drift = (rt.time * (10 + hash(i) * 16) + hash(i + 2) * height) % height;
      ctx.fillStyle = `rgba(210, 232, 190, ${0.12 + hash(i + 1) * 0.28})`;
      ctx.beginPath();
      ctx.arc(hash(i + 4) * worldW, (drift / height) * worldH, hash(i + 6) > 0.7 ? 2.2 : 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let i = 0; i < growth; i += 1) {
      const x = cx - field * 0.72 + (i * (field * 1.45)) / Math.max(1, growth);
      drawPlant(ctx, x, cy + field * 0.72, 36 + i * 16 + growth * 14, i, rt.time);
    }

    if (growth >= 2) {
      ctx.strokeStyle = "rgba(186, 214, 190, 0.45)";
      ctx.lineWidth = 1;
      for (let i = 0; i < rt.cells.length - 1; i += 1) {
        const a = rt.cells[i];
        const b = rt.cells[i + 1];
        if (!a || !b) continue;
        ctx.beginPath();
        ctx.moveTo(cx + a.x, cy + a.y);
        ctx.lineTo(cx + b.x, cy + b.y);
        ctx.stroke();
      }
    }

    const limit = field * 0.42;
    for (const cell of rt.cells) {
      cell.x += cell.vx * dt;
      cell.y += cell.vy * dt;
      cell.vx *= 0.9;
      cell.vy *= 0.9;
      const distance = Math.hypot(cell.x, cell.y);
      if (distance > limit) {
        cell.x *= limit / distance;
        cell.y *= limit / distance;
      }
      const x = cx + cell.x;
      const y = cy + cell.y;
      const membrane = ctx.createRadialGradient(x - cell.r * 0.3, y - cell.r * 0.3, 2, x, y, cell.r);
      membrane.addColorStop(0, "rgba(230, 244, 214, 0.55)");
      membrane.addColorStop(0.7, "rgba(120, 176, 130, 0.28)");
      membrane.addColorStop(1, "rgba(40, 80, 56, 0.15)");
      ctx.beginPath();
      ctx.arc(x, y, cell.r, 0, Math.PI * 2);
      ctx.fillStyle = membrane;
      ctx.fill();
      ctx.strokeStyle = "rgba(220, 236, 214, 0.85)";
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x - cell.r * 0.12, y + cell.r * 0.05, cell.r * 0.36, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(92, 42, 78, 0.9)";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + cell.r * 0.28, y - cell.r * 0.22, cell.r * 0.12, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(186, 210, 120, 0.7)";
      ctx.fill();
    }

    ctx.save();
    ctx.translate(cx, cy + field * 0.15);
    ctx.rotate(rt.angle * 0.12);
    ctx.lineWidth = 1.7;
    const strand: { x: number; y: number }[][] = [[], []];
    for (const side of [-1, 1]) {
      const path = side === -1 ? strand[0] : strand[1];
      ctx.beginPath();
      for (let i = 0; i <= 42; i += 1) {
        const t = i / 42;
        const x = (t - 0.5) * field * 1.15;
        const y = Math.sin(t * Math.PI * 5 + rt.angle) * 18 * side;
        path?.push({ x, y });
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = side < 0 ? "rgba(232, 220, 190, 0.9)" : "rgba(176, 214, 186, 0.9)";
      ctx.stroke();
    }
    const left = strand[0] ?? [];
    const right = strand[1] ?? [];
    ctx.strokeStyle = "rgba(232, 210, 160, 0.55)";
    ctx.lineWidth = 1;
    for (let i = 0; i < left.length; i += 3) {
      const a = left[i];
      const b = right[i];
      if (!a || !b) continue;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    ctx.restore();
    ctx.fillStyle = "rgba(236, 232, 214, 0.7)";
    ctx.font = `15px ${rt.fonts.hand}`;
    ctx.textAlign = "center";
    ctx.fillText("drag the strands", cx, cy + field * 0.15 + 42);

    for (const specimen of SPECIMENS) {
      const at = specimenAt(specimen.id, cx, cy, width, height);
      const x = at.x;
      const y = at.y;
      const found = rt.found.has(specimen.id);
      if (found) drawPlant(ctx, x, y + 46, 48 + growth * 10, specimen.angle, rt.time);
      const pulse = 0.55 + Math.sin(rt.time * 2 + specimen.angle) * 0.25;
      const glow = ctx.createRadialGradient(x, y, 2, x, y, 26);
      glow.addColorStop(0, found ? "rgba(232, 210, 150, 0.7)" : `rgba(170, 230, 180, ${pulse})`);
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, y, found ? 7 : 5, 0, Math.PI * 2);
      ctx.fillStyle = found ? "#f0ddb0" : "#d7f0dc";
      ctx.fill();
      if (found) {
        const memory = teacher.memories.find((item) => item.id === specimen.id);
        ctx.font = `13px ${rt.fonts.hand}`;
        ctx.fillStyle = "rgba(236, 232, 214, 0.85)";
        ctx.fillText(memory?.title ?? "", x, y - 16);
      }
    }

    const ready = rt.found.has("heart");
    const heart = { x: cx + width * 1.12, y: cy - 10 };
    if (rt.found.size >= 3) {
      const hx = heart.x;
      const hy = heart.y;
      ctx.save();
      ctx.translate(hx, hy);
      ctx.fillStyle = ready ? "rgba(120, 36, 42, 0.2)" : "rgba(176, 64, 72, 0.85)";
      ctx.beginPath();
      ctx.moveTo(0, 18);
      ctx.bezierCurveTo(-28, -8, -18, -28, 0, -12);
      ctx.bezierCurveTo(18, -28, 28, -8, 0, 18);
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = "rgba(236, 232, 214, 0.75)";
      ctx.font = `14px ${rt.fonts.hand}`;
      ctx.textAlign = "center";
      ctx.fillText(ready ? "" : "the heart", hx, hy + 36);
    }
    ctx.fillStyle = "rgba(236, 232, 214, 0.84)";
    ctx.font = `15px ${rt.fonts.hand}`;
    ctx.textAlign = "center";
    ctx.fillText(
      growth === 0 ? "The field is almost empty." : `${rt.cells.length} cells. The field is growing.`,
      cx,
      cy + field + 36,
    );
    const door = { x: worldW - 120, y: cy - 30, w: 78, h: 120 };
    ctx.fillStyle = ready ? "rgba(232, 196, 120, 0.35)" : "#07140e";
    ctx.fillRect(door.x, door.y, door.w, door.h);
    ctx.strokeStyle = ready ? "#e4c48a" : "#3d5a48";
    ctx.strokeRect(door.x, door.y, door.w, door.h);
    ctx.font = `12px ${rt.fonts.mono}`;
    ctx.fillStyle = "rgba(236,232,214,0.8)";
    ctx.fillText(ready ? "open" : "shut", door.x + door.w / 2, door.y + door.h - 14);
    if (rt.heartAt >= 0 && !ready) {
      ctx.fillStyle = "rgba(4, 6, 8, 0.45)";
      ctx.fillRect(rt.look.x, rt.look.y, width, height);
    }
    ctx.restore();
    if (!rt.look.looked) {
      ctx.fillStyle = "rgba(220, 236, 214, 0.75)";
      ctx.font = `16px ${rt.fonts.hand}`;
      ctx.textAlign = "left";
      ctx.fillText("Drag the field. Things are growing out of sight.", 22, 36);
    }
    if (rt.slip) drawSlip(ctx, rt.slip, rt.fonts.hand, width, height);

    const status = rt.notice || (ready ? "The way out is lit." : "The field is waiting for what you find.");
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
    const world = { x: point.x + rt.look.x, y: point.y + rt.look.y };
    const { cx, cy, field } = worldOf(point.width, point.height);
    const helixY = cy + field * 0.15;
    rt.look.panning = false;
    if (Math.abs(world.y - helixY) < 36 && Math.abs(world.x - cx) < field * 0.55) {
      rt.held = "helix";
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }
    startPan(rt.look, point.x, point.y);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent<HTMLCanvasElement>) {
    const rt = runtime();
    const point = pointOf(event);
    if (rt.look.panning) {
      dragPan(rt.look, point.x, point.y);
      return;
    }
    if (rt.held !== "helix") return;
    const world = { x: point.x + rt.look.x, y: point.y + rt.look.y };
    rt.angle = world.x * 0.01;
  }

  function onPointerUp(event: PointerEvent<HTMLCanvasElement>) {
    const rt = runtime();
    const point = pointOf(event);
    const panned = stopPan(rt.look, point.x, point.y);
    const wasHelix = rt.held === "helix";
    rt.held = null;
    if (panned || wasHelix) return;
    const world = { x: point.x + rt.look.x, y: point.y + rt.look.y };
    const { cx, cy, worldW } = worldOf(point.width, point.height);
    const heart = { x: cx + point.width * 1.12, y: cy - 10 };
    if (rt.found.size >= 3 && Math.hypot(world.x - heart.x, world.y - heart.y) < 36) {
      const lines = teacher.memories.find((item) => item.id === "heart")?.lines ?? [];
      const next = rt.heartAt + 1;
      if (next >= lines.length) {
        rt.found.add("heart");
        rt.slip = "";
        rt.heartAt = lines.length;
        rt.notice = "The way out is lit.";
        announced.current = "";
        return;
      }
      if (rt.heartAt < 0) sound.duck(0.1);
      rt.heartAt = next;
      rt.slip = lines[next] ?? "";
      return;
    }
    const specimen = SPECIMENS.find((item) => {
      const at = specimenAt(item.id, cx, cy, point.width, point.height);
      return Math.hypot(world.x - at.x, world.y - at.y) < 22;
    });
    if (specimen) {
      const memory = teacher.memories.find((item) => item.id === specimen.id);
      rt.found.add(specimen.id);
      const lines = memory?.lines ?? [];
      const index = rt.slip && lines.includes(rt.slip) ? lines.indexOf(rt.slip) + 1 : 0;
      rt.slip = lines[index] ?? lines[0] ?? "";
      return;
    }
    const cell = [...rt.cells].reverse().find((item) => Math.hypot(world.x - (cx + item.x), world.y - (cy + item.y)) < item.r + 4);
    if (cell && cell.r > 14 && rt.cells.length < 16) {
      const child = cell.r * 0.72;
      const angle = Math.atan2(world.y - (cy + cell.y), world.x - (cx + cell.x)) || rt.time;
      cell.r = child;
      cell.vx = Math.cos(angle) * -160;
      cell.vy = Math.sin(angle) * -160;
      rt.cells.push({
        x: cell.x + Math.cos(angle) * child,
        y: cell.y + Math.sin(angle) * child,
        r: child,
        vx: Math.cos(angle) * 180,
        vy: Math.sin(angle) * 180,
      });
      rt.notice = "The cell divided.";
      announced.current = "";
      return;
    }
    const door = { x: worldW - 120, y: cy - 30, w: 78, h: 120 };
    const inDoor = world.x >= door.x && world.x <= door.x + door.w && world.y >= door.y && world.y <= door.y + door.h;
    if (!inDoor) return;
    if (rt.found.has("heart")) onEnterMemory();
    else {
      rt.notice = "The way out stays dark until more of the field is alive.";
      announced.current = "";
    }
  }

  return (
    <div className={`lab-shell${covered ? " is-covered" : ""}`}>
      <p className="sr-only">
        Drag the field to look further. Click a cell to divide it. Drag across the strands to turn them.
        The glowing points are further out. The heart appears after the field has started to grow.
      </p>
      <canvas
        ref={canvasRef}
        role="application"
        aria-label="The living field"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      />
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
      <button type="button" className="lab-leave" onClick={onLeave}>
        Leave
      </button>
    </div>
  );
}
