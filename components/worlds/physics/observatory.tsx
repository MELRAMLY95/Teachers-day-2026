"use client";

import { useSound } from "@/components/sound";
import { clampLook, createLook, drawSlip, dragPan, startPan, stopPan, type Look } from "@/components/worlds/shared/look";
import { STAR_GM, circularVelocity, orbitWord, stepOrbit } from "@/lib/physics/orbit";
import type { Teacher } from "@/lib/types";
import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import { readFonts, useStage, type Fonts } from "../shared/stage";
import { Sequence } from "../shared/sequence";

type StarNote = { id: string; name: string; line: string; angle: number };

type Runtime = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  mass: number;
  trail: { x: number; y: number }[];
  found: Set<string>;
  held: "planet" | "vel" | "sun" | null;
  disturbed: boolean;
  pushed: boolean;
  time: number;
  stars: StarNote[];
  fonts: Fonts;
  fontsReady: boolean;
  notice: string;
  lastWord: string;
  grabX: number;
  grabY: number;
  look: Look;
  slip: string;
};

const RADIUS = 180;
const STAR_ANGLES = [-2.6, -1.15, 0.15, 1.15, 2.15, 2.9, -3.5, 0.7];

function createRuntime(teacher: Teacher): Runtime {
  const speed = circularVelocity(STAR_GM, RADIUS);
  const stars = teacher.notes.slice(0, 8).map((note, index) => ({
    id: note.id,
    name: note.label,
    line: note.line,
    angle: STAR_ANGLES[index] ?? index,
  }));
  return {
    x: RADIUS,
    y: 0,
    vx: 0,
    vy: speed,
    mass: 1,
    trail: [],
    found: new Set(),
    held: null,
    disturbed: false,
    pushed: false,
    time: 0,
    stars,
    fonts: { display: "Georgia", mono: "monospace", hand: "Georgia" },
    fontsReady: false,
    notice: "",
    lastWord: "",
    grabX: 0,
    grabY: 0,
    look: createLook(),
    slip: "",
  };
}

function space(width: number, height: number) {
  const worldW = width * 2.2;
  const worldH = height * 1.62;
  return {
    worldW,
    worldH,
    cx: worldW * 0.5,
    cy: worldH * 0.48,
    span: Math.min(width, height),
  };
}

function starAt(index: number, angle: number, cx: number, cy: number, span: number) {
  const far = index >= 3;
  const radius = far ? span * 0.98 : span * 0.26;
  return {
    x: cx + Math.cos(angle) * radius,
    y: cy + Math.sin(angle) * radius * (far ? 0.7 : 0.82),
  };
}

function drawDome(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(width * 0.5, height * 0.02, width * 0.72, height * 0.16, 0, 0, Math.PI);
  ctx.strokeStyle = "rgba(214, 198, 170, 0.22)";
  ctx.lineWidth = 10;
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(width * 0.5, height * 0.02, width * 0.58, height * 0.11, 0, 0, Math.PI);
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  const floor = ctx.createLinearGradient(0, height * 0.74, 0, height);
  floor.addColorStop(0, "rgba(8, 10, 16, 0)");
  floor.addColorStop(0.28, "#0c1018");
  floor.addColorStop(1, "#07080c");
  ctx.fillStyle = floor;
  ctx.fillRect(0, height * 0.7, width, height * 0.3);
  ctx.strokeStyle = "rgba(186, 160, 120, 0.28)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(width * 0.06, height * 0.84);
  ctx.lineTo(width * 0.94, height * 0.84);
  ctx.stroke();
}

function hash(index: number) {
  const value = Math.sin(index * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

function sky(ctx: CanvasRenderingContext2D, width: number, height: number, time: number) {
  const night = ctx.createLinearGradient(0, 0, 0, height);
  night.addColorStop(0, "#070814");
  night.addColorStop(0.55, "#10182a");
  night.addColorStop(1, "#07060c");
  ctx.fillStyle = night;
  ctx.fillRect(0, 0, width, height);

  const clouds = [
    { x: width * 0.2, y: height * 0.3, color: "rgba(92, 48, 120, 0.28)" },
    { x: width * 0.78, y: height * 0.38, color: "rgba(28, 92, 110, 0.24)" },
    { x: width * 0.5, y: height * 0.72, color: "rgba(120, 64, 32, 0.12)" },
  ];
  for (const cloud of clouds) {
    const glow = ctx.createRadialGradient(cloud.x, cloud.y, 10, cloud.x, cloud.y, width * 0.28);
    glow.addColorStop(0, cloud.color);
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
  }

  for (let i = 0; i < 180; i += 1) {
    const x = hash(i) * width;
    const y = hash(i + 40) * height;
    const twinkle = 0.35 + Math.sin(time * 1.4 + i) * 0.25;
    ctx.fillStyle = `rgba(244, 240, 230, ${twinkle})`;
    ctx.fillRect(x, y, hash(i + 9) > 0.92 ? 2 : 1, hash(i + 9) > 0.92 ? 2 : 1);
  }
}

export function Observatory({
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
  const [showFinale, setShowFinale] = useState(false);
  const [announce, setAnnounce] = useState("");
  const announced = useRef("");
  const runtime = useCallback(() => {
    rtRef.current ??= createRuntime(teacher);
    return rtRef.current;
  }, [teacher]);

  const canvasRef = useStage((ctx, width, height, dt) => {
    const rt = runtime();
    if (!rt.fontsReady) {
      rt.fonts = readFonts();
      rt.fontsReady = true;
    }
    rt.time += dt;
    const room = space(width, height);
    const { cx, cy, worldW, worldH, span } = room;
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
    const gm = STAR_GM * rt.mass;
    if (rt.held !== "planet") {
      const next = stepOrbit({ x: rt.x, y: rt.y, vx: rt.vx, vy: rt.vy }, gm, dt);
      rt.x = next.x;
      rt.y = next.y;
      rt.vx = next.vx;
      rt.vy = next.vy;
      const distance = Math.hypot(rt.x, rt.y);
      if (distance < 36) {
        rt.x = (rt.x / distance) * 36;
        rt.y = (rt.y / distance) * 36;
        rt.vx *= -0.2;
        rt.vy *= -0.2;
      }
    }
    rt.trail.push({ x: rt.x, y: rt.y });
    if (rt.trail.length > 90) rt.trail.shift();

    ctx.save();
    ctx.translate(-rt.look.x, -rt.look.y);
    sky(ctx, worldW, worldH, rt.time);
    drawDome(ctx, worldW, worldH);

    rt.stars.forEach((_, index) => {
      if (index >= rt.found.size) return;
      ctx.beginPath();
      ctx.arc(cx, cy, 54 + index * 22, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 206, 130, ${0.12 + index * 0.06})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    });

    const ordered = rt.stars.map((star, index) => ({ star, index, at: starAt(index, star.angle, cx, cy, span) }));
    ctx.beginPath();
    ctx.strokeStyle = "rgba(244, 220, 170, 0.85)";
    ctx.lineWidth = 1.6;
    let drawing = false;
    for (const item of [...ordered].sort((a, b) => a.star.angle - b.star.angle)) {
      if (!rt.found.has(item.star.id)) {
        drawing = false;
        continue;
      }
      if (!drawing) {
        ctx.moveTo(item.at.x, item.at.y);
        drawing = true;
      } else ctx.lineTo(item.at.x, item.at.y);
    }
    ctx.stroke();

    for (const item of ordered) {
      const sx = item.at.x;
      const sy = item.at.y;
      const found = rt.found.has(item.star.id);
      if (found) {
        const halo = ctx.createRadialGradient(sx, sy, 1, sx, sy, 22);
        halo.addColorStop(0, "rgba(255, 226, 170, 0.55)");
        halo.addColorStop(1, "rgba(255, 226, 170, 0)");
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(sx, sy, 22, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(sx, sy, found ? 5 : 3.2, 0, Math.PI * 2);
      ctx.fillStyle = found ? "#f6e2b0" : "rgba(220, 226, 240, 0.8)";
      ctx.fill();
      if (found) {
        ctx.fillStyle = "rgba(244, 240, 230, 0.8)";
        ctx.font = `14px ${rt.fonts.hand}`;
        ctx.textAlign = "center";
        ctx.fillText(item.star.name.split(" ")[0] ?? item.star.name, sx, sy - 12);
      }
    }

    if (rt.trail.length > 1) {
      ctx.beginPath();
      rt.trail.forEach((point, index) => {
        const px = cx + point.x;
        const py = cy + point.y;
        if (index === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.strokeStyle = "rgba(186, 214, 255, 0.45)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    const sunR = 26 + rt.mass * 16;
    const sun = ctx.createRadialGradient(cx, cy, 4, cx, cy, sunR * 3.2);
    sun.addColorStop(0, "rgba(255, 236, 196, 0.95)");
    sun.addColorStop(0.35, "rgba(255, 170, 70, 0.55)");
    sun.addColorStop(1, "rgba(255, 120, 40, 0)");
    ctx.fillStyle = sun;
    ctx.beginPath();
    ctx.arc(cx, cy, sunR * 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffe1a8";
    ctx.beginPath();
    ctx.arc(cx, cy, sunR, 0, Math.PI * 2);
    ctx.fill();

    const px = cx + rt.x;
    const py = cy + rt.y;
    const body = ctx.createRadialGradient(px - 6, py - 8, 2, px, py, 22);
    body.addColorStop(0, "#f4efe4");
    body.addColorStop(0.45, "#c9845a");
    body.addColorStop(1, "#6a3a28");
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(px, py, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(186, 214, 255, 0.45)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(px, py, 21, 0, Math.PI * 2);
    ctx.stroke();

    const hx = px + rt.vx * 0.28;
    const hy = py + rt.vy * 0.28;
    ctx.strokeStyle = "rgba(255, 214, 140, 0.9)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(hx, hy);
    ctx.stroke();
    ctx.fillStyle = "#f6d7a2";
    ctx.beginPath();
    ctx.arc(hx, hy, 6, 0, Math.PI * 2);
    ctx.fill();

    const ready = rt.pushed && rt.found.size >= 4;
    const word = orbitWord({ x: rt.x, y: rt.y, vx: rt.vx, vy: rt.vy }, gm);
    if (rt.found.size >= 5) {
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(246, 226, 176, 0.7)";
      ctx.font = `15px ${rt.fonts.hand}`;
      ctx.fillText("still in orbit", cx, cy - sunR - 42);
      ctx.fillStyle = "rgba(246, 226, 176, 0.95)";
      ctx.font = `28px ${rt.fonts.display}`;
      ctx.fillText(teacher.name, cx, cy - sunR - 14);
    }
    const door = { x: worldW - 160, y: cy - 40, w: 86, h: 150 };
    ctx.fillStyle = "#100e14";
    ctx.fillRect(door.x, door.y, door.w, door.h);
    ctx.strokeStyle = ready ? "rgba(255, 196, 120, 0.9)" : "#5c5348";
    ctx.strokeRect(door.x, door.y, door.w, door.h);
    if (ready) {
      ctx.fillStyle = "rgba(255, 186, 110, 0.45)";
      ctx.fillRect(door.x + 18, door.y + 16, door.w - 36, 42);
    }
    ctx.fillStyle = "rgba(244,240,230,0.8)";
    ctx.font = `12px ${rt.fonts.mono}`;
    ctx.textAlign = "center";
    ctx.fillText(ready ? "open" : "shut", door.x + door.w / 2, door.y + door.h - 16);
    ctx.restore();

    ctx.fillStyle = "rgba(244, 240, 230, 0.72)";
    ctx.font = `14px ${rt.fonts.mono}`;
    ctx.textAlign = "left";
    ctx.fillText(word, 24, height - 28);
    ctx.fillText(`star mass ${rt.mass.toFixed(2)}`, 24, height - 48);
    ctx.fillStyle = "rgba(244, 240, 230, 0.62)";
    ctx.font = `15px ${rt.fonts.hand}`;
    ctx.fillText(rt.look.looked ? "Drag the gold point. Force changes the path." : "Drag the empty sky. Some of the notes are further out.", 24, 32);
    if (rt.pushed) {
      ctx.fillStyle = "rgba(255, 214, 160, 0.85)";
      ctx.fillText("A force has changed the path.", 24, 54);
    }
    if (rt.slip) drawSlip(ctx, rt.slip, rt.fonts.hand, width, height);

    const nextAnnounce = rt.notice || `${word}. ${rt.found.size} notes found in the sky.`;
    if (nextAnnounce !== announced.current) {
      announced.current = nextAnnounce;
      rt.lastWord = nextAnnounce;
      setAnnounce(nextAnnounce);
    }
  });

  useEffect(() => {
    runtime();
  }, [runtime]);

  function local(event: PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function geometry(width: number, height: number, rt: Runtime) {
    const room = space(width, height);
    const px = room.cx + rt.x;
    const py = room.cy + rt.y;
    return {
      ...room,
      sun: 26 + rt.mass * 16,
      planet: { x: px, y: py },
      handle: { x: px + rt.vx * 0.28, y: py + rt.vy * 0.28 },
      stars: rt.stars.map((star, index) => ({
        star,
        ...starAt(index, star.angle, room.cx, room.cy, room.span),
      })),
      door: { x: room.worldW - 160, y: room.cy - 40, w: 86, h: 150 },
    };
  }

  function onPointerDown(event: PointerEvent<HTMLCanvasElement>) {
    const rt = runtime();
    const point = local(event);
    const world = { x: point.x + rt.look.x, y: point.y + rt.look.y };
    const rect = event.currentTarget.getBoundingClientRect();
    const geo = geometry(rect.width, rect.height, rt);
    const near = (x: number, y: number, r: number) => Math.hypot(world.x - x, world.y - y) < r;
    rt.held = null;
    rt.look.panning = false;
    if (near(geo.handle.x, geo.handle.y, 16)) rt.held = "vel";
    else if (near(geo.planet.x, geo.planet.y, 20)) rt.held = "planet";
    else if (near(geo.cx, geo.cy, geo.sun + 8)) rt.held = "sun";
    if (rt.held) {
      event.currentTarget.setPointerCapture(event.pointerId);
      rt.grabX = world.x;
      rt.grabY = world.y;
      return;
    }
    startPan(rt.look, point.x, point.y);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent<HTMLCanvasElement>) {
    const rt = runtime();
    const point = local(event);
    if (rt.look.panning) {
      dragPan(rt.look, point.x, point.y);
      return;
    }
    if (!rt.held) return;
    const world = { x: point.x + rt.look.x, y: point.y + rt.look.y };
    const rect = event.currentTarget.getBoundingClientRect();
    const room = space(rect.width, rect.height);
    rt.disturbed = true;
    if (rt.held === "planet") {
      rt.x = world.x - room.cx;
      rt.y = world.y - room.cy;
    } else if (rt.held === "vel") {
      rt.vx = (world.x - (room.cx + rt.x)) / 0.28;
      rt.vy = (world.y - (room.cy + rt.y)) / 0.28;
      rt.pushed = true;
    } else if (rt.held === "sun") {
      rt.mass = Math.min(2.4, Math.max(0.35, rt.mass + (rt.grabY - world.y) * 0.008));
      rt.grabY = world.y;
    }
  }

  function onPointerUp(event: PointerEvent<HTMLCanvasElement>) {
    const rt = runtime();
    const point = local(event);
    const panned = stopPan(rt.look, point.x, point.y);
    const world = { x: point.x + rt.look.x, y: point.y + rt.look.y };
    const moved = Math.hypot(world.x - rt.grabX, world.y - rt.grabY);
    const held = rt.held;
    rt.held = null;
    if (panned || (held && moved > 8)) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const geo = geometry(rect.width, rect.height, rt);
    const star = geo.stars.find((item) => Math.hypot(world.x - item.x, world.y - item.y) < 18);
    if (star) {
      rt.found.add(star.star.id);
      rt.slip = star.star.line;
      return;
    }
    const door = geo.door;
    const inDoor =
      world.x >= door.x && world.x <= door.x + door.w && world.y >= door.y && world.y <= door.y + door.h;
    if (!inDoor) return;
    if (rt.pushed && rt.found.size >= 4) {
      sound.duck(0.14);
      setShowFinale(true);
      return;
    }
    rt.notice = rt.pushed
      ? "The floor stays shut. There are still stars with names."
      : "The floor stays shut. Drag the gold point. A force has to change the path.";
    announced.current = "";
  }

  return (
    <div className={`lab-shell${covered ? " is-covered" : ""}`}>
      <p className="sr-only">
        Drag the empty sky to look around the observatory. Drag the planet to move it. Drag the gold
        handle to change its speed. Drag up or down on the star to change its mass. Click the notes
        hidden further out in the sky.
      </p>
      <canvas
        ref={canvasRef}
        role="application"
        aria-label="Observatory"
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
      {showFinale ? <Sequence kind="dark" lines={teacher.finale} onDone={onEnterMemory} /> : null}
    </div>
  );
}
