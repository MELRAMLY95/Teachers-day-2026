"use client";

import { useSound } from "@/components/sound";
import type { Teacher } from "@/lib/types";
import { useRef, useState, type PointerEvent } from "react";
import { clampLook, createLook, drawSlip, dragPan, startPan, stopPan, type Look } from "../shared/look";
import { readFonts, useStage } from "../shared/stage";

const STOPS: { id: string; at: number; trip?: boolean }[] = [
  { id: "hard", at: 0.06 },
  { id: "fun", at: 0.12 },
  { id: "know", at: 0.18 },
  { id: "duties", at: 0.24 },
  { id: "care", at: 0.3 },
  { id: "sweet", at: 0.36 },
  { id: "itinerary", at: 0.48, trip: true },
  { id: "route", at: 0.54, trip: true },
  { id: "prep", at: 0.6, trip: true },
  { id: "destination", at: 0.66, trip: true },
  { id: "activities", at: 0.72, trip: true },
  { id: "absent", at: 0.8, trip: true },
  { id: "meant", at: 0.9, trip: true },
];

export function Courtyard({
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
  const lookRef = useRef<Look>(createLook());
  const visitedRef = useRef<string[]>([]);
  const lineRef = useRef<{ id: string; index: number; text: string } | null>(null);
  const reducedRef = useRef(reducedMotion);
  const [slip, setSlip] = useState("");
  const name = `${teacher.honorific} ${teacher.name}`.trim();

  function place(width: number, height: number) {
    const worldW = width * 4.2;
    return {
      worldW,
      arches: STOPS.map((arch) => ({
        ...arch,
        x: worldW * arch.at,
        y: height * 0.34,
        w: Math.min(150, width * 0.28),
        h: height * 0.42,
      })),
    };
  }

  const canvasRef = useStage((ctx, width, height, dt) => {
    reducedRef.current = reducedMotion;
    const fonts = readFonts();
    const look = lookRef.current;
    const room = place(width, height);
    look.viewW = width;
    look.viewH = height;
    look.worldW = room.worldW;
    look.worldH = height;
    if (!look.framed) look.framed = true;
    clampLook(look);

    ctx.fillStyle = "#140e0c";
    ctx.fillRect(0, 0, width, height);
    ctx.save();
    ctx.translate(-look.x, 0);

    const spin = reducedRef.current ? 0 : dt;
    ctx.save();
    ctx.translate(room.worldW * 0.5, height * 0.28);
    ctx.rotate(spin === 0 ? 0 : (performance.now() / 14000) % (Math.PI * 2));
    const step = Math.max(120, Math.min(width, height) * 0.22);
    const reach = Math.ceil(room.worldW / step) + 2;
    for (let row = -2; row <= 2; row += 1) {
      for (let col = -reach; col <= reach; col += 1) {
        star8(ctx, col * step, row * step, step * 0.28, "rgba(196, 164, 112, 0.45)");
      }
    }
    ctx.restore();

    ctx.fillStyle = "#1a120e";
    ctx.fillRect(0, height * 0.72, room.worldW, height * 0.28);
    const lit = visitedRef.current.length;
    ctx.fillStyle = `rgba(232, 196, 140, ${0.15 + lit * 0.12})`;
    ctx.fillRect(40, height * 0.78, (room.worldW - 80) * Math.min(1, (lit + 0.15) / STOPS.length), 8);

    for (const arch of room.arches) {
      const early = STOPS.filter((stop) => !stop.trip).length;
      const open = arch.trip ? visitedRef.current.length >= early : visitedRef.current.includes(arch.id);
      const locked = Boolean(arch.trip) && visitedRef.current.length < early;
      ctx.fillStyle = locked ? "rgba(42, 28, 20, 0.35)" : open ? "rgba(232, 196, 140, 0.55)" : "#2a1c14";
      ctx.beginPath();
      ctx.moveTo(arch.x - arch.w / 2, arch.y + arch.h);
      ctx.lineTo(arch.x - arch.w / 2, arch.y + arch.h * 0.42);
      ctx.quadraticCurveTo(arch.x, arch.y, arch.x + arch.w / 2, arch.y + arch.h * 0.42);
      ctx.lineTo(arch.x + arch.w / 2, arch.y + arch.h);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = open ? "rgba(255, 220, 170, 0.8)" : "rgba(196, 164, 112, 0.4)";
      ctx.stroke();
      if (!locked) {
        ctx.fillStyle = "rgba(246, 236, 216, 0.8)";
        ctx.font = `16px ${fonts.hand}`;
        ctx.textAlign = "center";
        ctx.fillText(arch.id, arch.x, arch.y + arch.h + 28);
      }
    }

    if (visitedRef.current.length >= 6) {
      ctx.fillStyle = "rgba(243, 234, 216, 0.9)";
      ctx.font = `26px ${fonts.display}`;
      ctx.textAlign = "center";
      ctx.fillText(name, room.worldW * 0.74, height * 0.66);
    }
    ctx.restore();

    if (!look.looked) {
      ctx.fillStyle = "rgba(244, 234, 216, 0.82)";
      ctx.font = `18px ${fonts.hand}`;
      ctx.textAlign = "left";
      ctx.fillText("Drag the path. The arches are spaced along it.", 22, 40);
    }
    if (lineRef.current) drawSlip(ctx, lineRef.current.text, fonts.hand, width, height);
    void slip;
  });

  function local(event: PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top, width: rect.width, height: rect.height };
  }

  function onPointerDown(event: PointerEvent<HTMLCanvasElement>) {
    const point = local(event);
    startPan(lookRef.current, point.x, point.y);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent<HTMLCanvasElement>) {
    dragPan(lookRef.current, local(event).x, local(event).y);
  }

  function onPointerUp(event: PointerEvent<HTMLCanvasElement>) {
    const point = local(event);
    const look = lookRef.current;
    if (stopPan(look, point.x, point.y)) return;
    const room = place(point.width, point.height);
    const worldX = point.x + look.x;
    const arch = room.arches.find(
      (item) => Math.abs(worldX - item.x) < item.w / 2 && point.y > item.y && point.y < item.y + item.h + 20,
    );
    if (!arch) return;
    const early = STOPS.filter((stop) => !stop.trip).length;
    if (arch.trip && visitedRef.current.filter((id) => STOPS.some((stop) => stop.id === id && !stop.trip)).length < early) return;
    const memory = teacher.memories.find((item) => item.id === arch.id);
    const lines = memory?.lines ?? [];
    if (!arch.trip && !visitedRef.current.includes(arch.id)) {
      visitedRef.current = [...visitedRef.current, arch.id];
    }
    const current = lineRef.current;
    if (!current || current.id !== arch.id) {
      const text = lines[0] ?? "";
      lineRef.current = { id: arch.id, index: 0, text };
      setSlip(text);
      if (arch.id === "absent" || arch.id === "meant") sound.duck(0.12);
      sound.page();
      return;
    }
    const next = current.index + 1;
    if (next >= lines.length) {
      lineRef.current = null;
      setSlip("");
      if (arch.trip && !visitedRef.current.includes(arch.id)) visitedRef.current = [...visitedRef.current, arch.id];
      if (arch.id === "meant") onEnterMemory();
      return;
    }
    const text = lines[next] ?? "";
    lineRef.current = { id: arch.id, index: next, text };
    setSlip(text);
    sound.page();
  }

  return (
    <div className={`lab-shell courtyard${covered ? " is-covered" : ""}`}>
      <p className="sr-only">
        Drag along the path. Walk through the arches. Nothing here is scored. The journey is at the far end.
      </p>
      <canvas
        ref={canvasRef}
        role="application"
        aria-label="The journey"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      />
      <p className="sr-only" aria-live="polite">
        {slip}
      </p>
      <button type="button" className="lab-leave" onClick={onLeave}>
        Leave
      </button>
    </div>
  );
}

function star8(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.15;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.stroke();
  for (let turn = 0; turn < 2; turn += 1) {
    ctx.save();
    ctx.rotate((turn * Math.PI) / 4);
    ctx.strokeRect(-radius * 0.55, -radius * 0.55, radius * 1.1, radius * 1.1);
    ctx.restore();
  }
  ctx.restore();
}
