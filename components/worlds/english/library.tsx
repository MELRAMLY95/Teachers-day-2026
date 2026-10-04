"use client";

import { useSound } from "@/components/sound";
import type { Teacher } from "@/lib/types";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { clampLook, createLook, drawSlip, dragPan, startPan, stopPan, type Look } from "../shared/look";
import { readFonts, useStage, type Fonts } from "../shared/stage";
import { Sequence } from "../shared/sequence";

type Book = { id: string; title: string; pages: string[] };
type Mote = { x: number; y: number; vx: number; vy: number; r: number; a: number };

const SPINES = ["#7c2f24", "#3c4a34", "#6a3d28", "#243246", "#5a2c28", "#5c3a2a", "#2e4038", "#6a442e", "#4a3044", "#3a4030"];
const FILL = ["#5c3428", "#31402e", "#4e3828", "#2a3848", "#643428", "#3e2c24", "#2c3834", "#5a4030"];

const NOTEBOOKS = [
  { id: "nb-math", title: "Mathematics", fancy: true },
  { id: "nb-chem", title: "Chemistry", fancy: true },
  { id: "nb-bio", title: "Biology", fancy: true },
  { id: "nb-eng", title: "English", fancy: false },
];

function hash(n: number) {
  const x = Math.sin(n * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

function layoutOf(width: number, height: number, bookCount: number) {
  const worldW = Math.max(width * 2.8, 720 + bookCount * 168);
  return {
    worldW,
    door: { x: worldW - 168, y: height * 0.16, w: 108, h: height * 0.56 },
    notebooks: NOTEBOOKS.map((notebook, index) => ({
      ...notebook,
      x: 48 + index * 92,
      y: height * 0.62,
      w: 78,
      h: 96,
    })),
    books: Array.from({ length: bookCount }, (_, index) => ({
      index,
      x: 520 + index * 156,
      y: height * (index % 2 === 0 ? 0.22 : 0.48) - (index % 2 === 0 ? 120 : 108),
      w: 34,
      h: index % 2 === 0 ? 120 : 108,
      color: SPINES[index % SPINES.length] ?? "#5a2c28",
    })),
    upper: height * 0.22,
    lower: height * 0.48,
  };
}

function roundTop(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
}

function drawVolume(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  title: string,
  hand: string,
  lift: number,
  flutter: number,
  known: boolean,
) {
  const yy = y - lift;
  ctx.fillStyle = `rgba(0, 0, 0, ${0.28 + lift * 0.012})`;
  ctx.beginPath();
  ctx.ellipse(x + w * 0.5, y + h + 3, w * 0.46, 4 + lift * 0.15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#efe4d0";
  ctx.fillRect(x + w - 5, yy + 4, 5, h - 8);
  ctx.fillStyle = "rgba(180, 150, 110, 0.45)";
  for (let line = 6; line < h - 8; line += 3) ctx.fillRect(x + w - 5, yy + line, 5, 1);
  ctx.fillStyle = color;
  ctx.fillRect(x, yy, w - 4, h);
  ctx.fillStyle = "rgba(255,255,255,0.14)";
  ctx.fillRect(x, yy, 3, h);
  ctx.fillStyle = known ? "rgba(232, 196, 120, 0.95)" : "rgba(212, 176, 110, 0.55)";
  ctx.fillRect(x + 2, yy + 8, w - 8, 2);
  ctx.fillRect(x + 2, yy + h - 12, w - 8, 2);
  if (known) {
    const ribbon = 16 + Math.sin(flutter * 3) * 2;
    ctx.fillStyle = "#8d2e2e";
    ctx.fillRect(x + w * 0.35, yy + h - 4, 5, ribbon);
  }
  if (title) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x + 2, yy + 16, w - 10, h - 32);
    ctx.clip();
    ctx.translate(x + (w - 4) * 0.48, yy + 20);
    ctx.rotate(Math.PI / 2);
    ctx.fillStyle = "rgba(246, 236, 214, 0.92)";
    const size = Math.max(9, Math.min(13, (h - 36) / (title.length * 0.56)));
    ctx.font = `${size}px ${hand}`;
    ctx.textAlign = "left";
    ctx.fillText(title, 0, 3);
    ctx.restore();
  }
  if (flutter > 0 && flutter < 1.35) {
    const swing = Math.sin(flutter * 16) * (1.35 - flutter) * 0.55;
    ctx.save();
    ctx.translate(x + w - 2, yy + 10);
    ctx.rotate(swing);
    ctx.fillStyle = "rgba(255, 248, 232, 0.92)";
    ctx.fillRect(0, 0, 14, h * 0.42);
    ctx.restore();
  }
}

function drawNotebook(
  ctx: CanvasRenderingContext2D,
  spot: { x: number; y: number; w: number; h: number; title: string; fancy: boolean },
  hand: string,
  time: number,
  lift: number,
  draft: number,
) {
  const x = spot.x;
  const y = spot.y - lift;
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.beginPath();
  ctx.ellipse(x + spot.w * 0.5, spot.y + spot.h + 4, spot.w * 0.42, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f7f1e4";
  ctx.fillRect(x + 8, y + 6, spot.w - 10, spot.h - 8);
  ctx.strokeStyle = "rgba(150, 120, 80, 0.35)";
  ctx.lineWidth = 1;
  for (let line = 14; line < spot.h - 10; line += 4) {
    ctx.beginPath();
    ctx.moveTo(x + 10, y + line);
    ctx.lineTo(x + spot.w - 6, y + line);
    ctx.stroke();
  }
  ctx.fillStyle = spot.fancy ? "#f3e2bc" : "#d5d0c6";
  roundTop(ctx, x, y, spot.w - 6, spot.h, 4);
  ctx.fill();
  if (spot.fancy) {
    ctx.strokeStyle = "#8a5a28";
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 7, y + 8, spot.w - 20, spot.h - 28);
    ctx.strokeStyle = "#b5483c";
    ctx.beginPath();
    ctx.arc(x + spot.w * 0.5 - 3, y + 28, 8, 0, Math.PI * 2);
    ctx.stroke();
    const shine = ((time * 36 + spot.x) % (spot.w + 24)) - 12;
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.fillRect(x + shine, y + 10, 7, spot.h - 36);
    ctx.fillStyle = "#8d2e2e";
    const tail = 14 + Math.sin(time * 2 + spot.x) * (draft > 0 ? 6 : 2);
    ctx.fillRect(x + spot.w - 16, y + spot.h - 8, 5, tail);
  } else {
    ctx.strokeStyle = "rgba(70, 60, 48, 0.35)";
    ctx.strokeRect(x + 10, y + 12, spot.w - 26, spot.h - 34);
  }
  if (draft > 0 && spot.fancy) {
    const swing = Math.sin(time * 18) * 0.4;
    ctx.save();
    ctx.translate(x + spot.w - 8, y + 12);
    ctx.rotate(swing);
    ctx.fillStyle = "rgba(255,248,232,0.95)";
    ctx.fillRect(0, 0, 18, 28);
    ctx.restore();
  }
  ctx.fillStyle = "#241c14";
  ctx.font = `13px ${hand}`;
  ctx.textAlign = "center";
  ctx.fillText(spot.title, x + spot.w * 0.45, y + spot.h - 12);
}

function drawLamp(ctx: CanvasRenderingContext2D, x: number, time: number, motion: number, phase: number, bright: number) {
  const sway = Math.sin(time * 0.65 + phase) * (0.05 + bright * 0.01) * (motion || 0.15);
  const flick = 0.78 + (motion ? Math.sin(time * 11 + phase) * 0.1 + Math.sin(time * 23 + phase) * 0.05 : 0);
  ctx.save();
  ctx.translate(x, 0);
  ctx.rotate(sway);
  ctx.strokeStyle = "rgba(92, 70, 48, 0.9)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 86);
  ctx.stroke();
  ctx.fillStyle = "#5c4030";
  ctx.beginPath();
  ctx.moveTo(-34, 84);
  ctx.lineTo(34, 84);
  ctx.lineTo(18, 128);
  ctx.lineTo(-18, 128);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = `rgba(255, 214, 150, ${0.35 + flick * 0.4})`;
  ctx.beginPath();
  ctx.moveTo(-26, 90);
  ctx.lineTo(26, 90);
  ctx.lineTo(14, 122);
  ctx.lineTo(-14, 122);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = `rgba(255, 228, 170, ${flick})`;
  ctx.beginPath();
  ctx.ellipse(0, 134, 3.5, 8 * flick, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawArchWindow(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, time: number, motion: number) {
  ctx.save();
  roundTop(ctx, x, y, w, h, w * 0.46);
  ctx.clip();
  const glass = ctx.createLinearGradient(x, y, x, y + h);
  glass.addColorStop(0, "#14283a");
  glass.addColorStop(1, "#0c141c");
  ctx.fillStyle = glass;
  ctx.fillRect(x, y, w, h);
  const moonX = x + w * 0.62 + Math.sin(time * 0.12) * 10 * motion;
  const moonY = y + h * 0.28;
  ctx.fillStyle = "rgba(244, 230, 196, 0.92)";
  ctx.beginPath();
  ctx.arc(moonX, moonY, w * 0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(20, 40, 58, 0.35)";
  ctx.beginPath();
  ctx.arc(moonX + 6, moonY - 3, w * 0.1, 0, Math.PI * 2);
  ctx.fill();
  for (let i = 0; i < 5; i += 1) {
    const tw = 0.35 + Math.sin(time * 2.2 + i + x) * 0.35 * motion;
    ctx.fillStyle = `rgba(246, 236, 214, ${0.25 + tw})`;
    ctx.fillRect(x + 12 + ((i * 37) % (w - 24)), y + 16 + ((i * 19) % (h * 0.45)), 2, 2);
  }
  const curtain = Math.sin(time * 0.8 + x) * 6 * motion;
  ctx.fillStyle = "rgba(72, 36, 28, 0.55)";
  ctx.fillRect(x, y, 14 + curtain, h);
  ctx.fillRect(x + w - 16 + curtain, y, 16, h);
  ctx.restore();
  ctx.strokeStyle = "rgba(120, 86, 52, 0.85)";
  ctx.lineWidth = 6;
  roundTop(ctx, x - 3, y - 3, w + 6, h + 3, w * 0.48);
  ctx.stroke();
  ctx.strokeStyle = "rgba(90, 64, 40, 0.7)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y + 8);
  ctx.lineTo(x + w / 2, y + h);
  ctx.moveTo(x, y + h * 0.48);
  ctx.lineTo(x + w, y + h * 0.48);
  ctx.stroke();
}

function drawDoor(
  ctx: CanvasRenderingContext2D,
  door: { x: number; y: number; w: number; h: number },
  ready: boolean,
  time: number,
  motion: number,
  hand: string,
) {
  const glow = ready ? 0.45 + Math.sin(time * 2) * 0.12 * (motion || 1) : 0.08;
  ctx.fillStyle = `rgba(255, 196, 120, ${glow})`;
  ctx.beginPath();
  ctx.ellipse(door.x + door.w / 2, door.y + door.h * 0.45, door.w * 0.9, door.h * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = ready ? "#c6a56e" : "#1a1410";
  roundTop(ctx, door.x, door.y, door.w, door.h, 46);
  ctx.fill();
  ctx.fillStyle = ready ? "rgba(255, 214, 150, 0.55)" : "#120e0c";
  roundTop(ctx, door.x + 16, door.y + 18, door.w - 32, door.h * 0.42, 28);
  ctx.fill();
  if (ready && motion) {
    ctx.save();
    ctx.translate(door.x + door.w / 2, door.y + door.h * 0.35);
    ctx.rotate(time * 0.15);
    ctx.strokeStyle = "rgba(255, 220, 160, 0.35)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i += 1) {
      ctx.rotate(Math.PI / 3);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, door.h * 0.45);
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.strokeStyle = ready ? "#f0ddb4" : "#4a3424";
  ctx.lineWidth = 3;
  roundTop(ctx, door.x, door.y, door.w, door.h, 46);
  ctx.stroke();
  ctx.fillStyle = ready ? "#241c14" : "rgba(246, 236, 210, 0.6)";
  ctx.font = `15px ${hand}`;
  ctx.textAlign = "center";
  ctx.fillText(ready ? "quiet room" : "closed", door.x + door.w / 2, door.y + door.h - 28);
}

export function Library({
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
  const books = teacher.books ?? [];
  const lookRef = useRef<Look>(createLook());
  const openedRef = useRef<string[]>([]);
  const motesRef = useRef<Mote[] | null>(null);
  const timeRef = useRef(0);
  const hoverRef = useRef<string | null>(null);
  const leanRef = useRef<Map<string, number>>(new Map());
  const flutterRef = useRef<Map<string, number>>(new Map());
  const draftRef = useRef(0);
  const noticeRef = useRef<{ text: string; life: number } | null>(null);
  const keyRef = useRef(0);
  const reducedRef = useRef(reducedMotion);
  const [opened, setOpened] = useState<string[]>([]);
  const [current, setCurrent] = useState<Book | null>(null);
  const [page, setPage] = useState(0);
  const [turning, setTurning] = useState(false);
  const [showFinal, setShowFinal] = useState(false);

  useEffect(() => {
    reducedRef.current = reducedMotion;
  }, [reducedMotion]);

  useEffect(() => {
    function down(event: KeyboardEvent) {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (event.key === "ArrowRight" || event.key === "d" || event.key === "D") keyRef.current = 1;
      if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") keyRef.current = -1;
      if (event.key.startsWith("Arrow")) event.preventDefault();
    }
    function up(event: KeyboardEvent) {
      if (event.key === "ArrowRight" || event.key === "d" || event.key === "D" || event.key === "ArrowLeft" || event.key === "a" || event.key === "A") {
        keyRef.current = 0;
      }
    }
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  const canvasRef = useStage((ctx, width, height, dt) => {
    const fonts: Fonts = readFonts();
    const look = lookRef.current;
    const place = layoutOf(width, height, books.length);
    const motion = reducedRef.current ? 0 : 1;
    const time = (timeRef.current += dt * (motion ? 1 : 0));
    look.viewW = width;
    look.viewH = height;
    look.worldW = place.worldW;
    look.worldH = height;
    if (!look.framed) look.framed = true;
    if (keyRef.current) {
      look.x += keyRef.current * 480 * dt;
      look.looked = true;
    }
    clampLook(look);
    if (draftRef.current > 0) draftRef.current = Math.max(0, draftRef.current - dt);
    if (noticeRef.current) {
      noticeRef.current.life -= dt;
      if (noticeRef.current.life <= 0) noticeRef.current = null;
    }
    for (const [id, age] of flutterRef.current) {
      const next = age + dt;
      if (next > 1.4) flutterRef.current.delete(id);
      else flutterRef.current.set(id, next);
    }

    ctx.fillStyle = "#100c09";
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(-look.x * 0.38, 0);
    const backW = place.worldW * 1.25;
    const wall = ctx.createLinearGradient(0, 0, 0, height);
    wall.addColorStop(0, "#140e0b");
    wall.addColorStop(0.55, "#24160f");
    wall.addColorStop(1, "#1a100c");
    ctx.fillStyle = wall;
    ctx.fillRect(0, 0, backW, height);
    for (let x = 0; x < backW; x += 46) {
      ctx.fillStyle = "rgba(0,0,0,0.13)";
      ctx.fillRect(x, 0, 2, height);
    }
    for (let i = 0; i < 7; i += 1) {
      drawArchWindow(ctx, 80 + i * 460, height * 0.1, 150, height * 0.62, time, motion);
    }
    ctx.restore();

    ctx.save();
    ctx.translate(-look.x, 0);
    const floorY = height * 0.9;
    ctx.fillStyle = "#2a1a12";
    ctx.fillRect(0, floorY, place.worldW, height - floorY);
    for (let x = 0; x < place.worldW; x += 86) {
      ctx.strokeStyle = "rgba(0,0,0,0.28)";
      ctx.beginPath();
      ctx.moveTo(x, floorY);
      ctx.lineTo(x + 18, height);
      ctx.stroke();
    }

    const plank = (y: number) => {
      ctx.fillStyle = "#4a301c";
      ctx.fillRect(20, y, place.worldW - 220, 16);
      ctx.fillStyle = "rgba(255, 220, 170, 0.18)";
      ctx.fillRect(20, y, place.worldW - 220, 3);
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fillRect(20, y + 14, place.worldW - 220, 6);
    };
    plank(place.upper);
    plank(place.lower);
    const low = height * 0.72;
    ctx.fillStyle = "#4a301c";
    ctx.fillRect(500, low, Math.max(0, place.door.x - 524), 14);
    ctx.fillStyle = "rgba(255, 220, 170, 0.16)";
    ctx.fillRect(500, low, Math.max(0, place.door.x - 524), 3);

    const lamps = [240, 780, 1320, 1860, place.worldW - 420];
    const bright = openedRef.current.length;
    for (const x of lamps) {
      const pool = ctx.createRadialGradient(x, 150, 8, x, height * 0.5, 260 + bright * 8);
      pool.addColorStop(0, `rgba(255, 186, 100, ${0.1 + Math.min(0.22, bright * 0.018)})`);
      pool.addColorStop(1, "rgba(255, 186, 100, 0)");
      ctx.fillStyle = pool;
      ctx.fillRect(x - 280, 0, 560, height * 0.78);
    }

    const decorate = (shelfY: number, x0: number, x1: number, seed: number) => {
      let x = x0;
      let n = seed;
      while (x < x1 - 18) {
        const w = 16 + Math.floor(hash(n) * 10);
        const h = 62 + Math.floor(hash(n + 4) * 46);
        const breathe = motion ? Math.sin(time * 1.4 + n) * 1.2 : 0;
        drawVolume(ctx, x, shelfY - h + breathe, w, h, FILL[n % FILL.length] ?? "#4a3428", "", fonts.hand, 0, 0, false);
        x += w + 3;
        n += 1;
      }
    };
    decorate(place.upper, 28, 500, 2);
    decorate(place.lower, 28, 500, 40);
    const lastBook = place.books[place.books.length - 1];
    const after = lastBook ? lastBook.x + 70 : 900;
    decorate(place.upper, after, place.door.x - 24, 80);
    decorate(place.lower, after, place.door.x - 24, 120);
    decorate(low, 510, place.door.x - 24, 200);

    for (const spot of place.books) {
      const neighbor = place.books[spot.index + 1];
      if (!neighbor) continue;
      let x = spot.x + spot.w + 8;
      let n = spot.index * 5 + 3;
      while (x < neighbor.x - 22) {
        const w = 18;
        const upperH = 78;
        const lowerH = 70;
        drawVolume(ctx, x, place.upper - upperH, w, upperH, FILL[n % FILL.length] ?? "#4a3428", "", fonts.hand, 0, 0, false);
        drawVolume(ctx, x + 2, place.lower - lowerH, w, lowerH, FILL[(n + 2) % FILL.length] ?? "#4a3428", "", fonts.hand, 0, 0, false);
        x += w + 6;
        n += 1;
      }
    }

    const deskY = height * 0.62 + 90;
    ctx.fillStyle = "#5a3a22";
    ctx.fillRect(24, deskY, 470, 18);
    ctx.fillStyle = "rgba(255, 214, 160, 0.2)";
    ctx.fillRect(24, deskY, 470, 3);
    ctx.fillStyle = "#3a2416";
    ctx.fillRect(40, deskY + 18, 14, Math.max(12, floorY - deskY - 18));
    ctx.fillRect(450, deskY + 18, 14, Math.max(12, floorY - deskY - 18));
    ctx.fillStyle = "#6a5038";
    ctx.beginPath();
    ctx.ellipse(500, deskY - 6, 16, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1c140e";
    ctx.beginPath();
    ctx.ellipse(500, deskY - 8, 8, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.translate(536, deskY - 2);
    ctx.rotate(-0.7);
    ctx.fillStyle = "#c4a574";
    ctx.fillRect(0, -1.5, 42, 3);
    ctx.fillStyle = "#2a1c14";
    ctx.fillRect(40, -2, 6, 4);
    ctx.restore();
    if (draftRef.current > 0) {
      ctx.save();
      ctx.translate(400, deskY - 20);
      ctx.rotate(Math.sin(time * 14) * 0.35);
      ctx.fillStyle = "rgba(246, 236, 214, 0.92)";
      ctx.fillRect(0, 0, 36, 24);
      ctx.restore();
    }

    for (const notebook of place.notebooks) {
      const target = hoverRef.current === notebook.id ? 10 : 0;
      const lift = approach(leanRef.current, notebook.id, target, dt, motion === 0);
      drawNotebook(ctx, notebook, fonts.hand, time, lift, draftRef.current);
    }

    for (const spot of place.books) {
      const book = books[spot.index];
      if (!book) continue;
      const target = hoverRef.current === book.id ? 14 : 0;
      const lift = approach(leanRef.current, book.id, target, dt, motion === 0);
      const flutter = flutterRef.current.get(book.id) ?? 0;
      drawVolume(
        ctx,
        spot.x,
        spot.y,
        spot.w,
        spot.h,
        spot.color,
        book.title,
        fonts.hand,
        lift,
        flutter,
        openedRef.current.includes(book.id),
      );
    }

    for (const [index, x] of lamps.entries()) drawLamp(ctx, x, time, motion, index + draftRef.current, bright);
    const ready = openedRef.current.filter((id) => !id.startsWith("nb-")).length >= 6 && openedRef.current.includes("nb-eng");
    drawDoor(ctx, place.door, ready, time, motion, fonts.hand);
    ctx.restore();

    if (!motesRef.current) {
      motesRef.current = Array.from({ length: 46 }, (_, index) => ({
        x: (index * 97) % width,
        y: (index * 53) % height,
        vx: ((index % 7) - 3) * 6,
        vy: 10 + (index % 5) * 6,
        r: 0.7 + (index % 4) * 0.4,
        a: 0.12 + (index % 5) * 0.05,
      }));
    }
    for (const mote of motesRef.current) {
      if (motion) {
        mote.x += mote.vx * dt;
        mote.y -= mote.vy * dt;
        mote.x += Math.sin(time + mote.y * 0.01) * 8 * dt;
        if (mote.y < -4) mote.y = height + 4;
        if (mote.x < 0) mote.x = width;
        if (mote.x > width) mote.x = 0;
      }
      ctx.fillStyle = `rgba(255, 220, 170, ${mote.a + Math.min(0.2, bright * 0.015)})`;
      ctx.beginPath();
      ctx.arc(mote.x, mote.y, mote.r, 0, Math.PI * 2);
      ctx.fill();
    }

    const vignette = ctx.createRadialGradient(width * 0.5, height * 0.45, width * 0.2, width * 0.5, height * 0.5, width * 0.72);
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,0,0,0.42)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "rgba(246, 236, 220, 0.84)";
    ctx.font = `16px ${fonts.hand}`;
    ctx.textAlign = "left";
    ctx.fillText(
      look.looked ? "Pull a book. The quiet room is at the far end." : "Drag the shelves. The lamps are already on.",
      56,
      height - 46,
    );
    if (noticeRef.current) drawSlip(ctx, noticeRef.current.text, fonts.hand, width, height);
  });

  function local(event: PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top, width: rect.width, height: rect.height };
  }

  function targetAt(worldX: number, y: number, width: number, height: number) {
    const place = layoutOf(width, height, books.length);
    const notebook = place.notebooks.find(
      (spot) => worldX >= spot.x && worldX <= spot.x + spot.w && y >= spot.y && y <= spot.y + spot.h,
    );
    if (notebook) return notebook.id;
    const hit = place.books.find((spot) => worldX >= spot.x && worldX <= spot.x + spot.w && y >= spot.y && y <= spot.y + spot.h);
    if (hit) return books[hit.index]?.id ?? null;
    const door = place.door;
    if (worldX >= door.x && worldX <= door.x + door.w && y >= door.y && y <= door.y + door.h) return "door";
    return null;
  }

  function onPointerDown(event: PointerEvent<HTMLCanvasElement>) {
    const point = local(event);
    startPan(lookRef.current, point.x, point.y);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent<HTMLCanvasElement>) {
    const point = local(event);
    const look = lookRef.current;
    dragPan(look, point.x, point.y);
    hoverRef.current = targetAt(point.x + look.x, point.y, point.width, point.height);
    event.currentTarget.style.cursor = look.panning ? "grabbing" : hoverRef.current ? "pointer" : "grab";
  }

  function onPointerUp(event: PointerEvent<HTMLCanvasElement>) {
    const point = local(event);
    const look = lookRef.current;
    const panned = stopPan(look, point.x, point.y);
    if (panned) return;
    const place = layoutOf(point.width, point.height, books.length);
    const worldX = point.x + look.x;
    const notebook = place.notebooks.find(
      (spot) => worldX >= spot.x && worldX <= spot.x + spot.w && point.y >= spot.y && point.y <= spot.y + spot.h,
    );
    if (notebook) {
      if (!openedRef.current.includes(notebook.id)) openedRef.current = [...openedRef.current, notebook.id];
      setOpened(openedRef.current);
      flutterRef.current.set(notebook.id, 0.01);
      const seenPretty = ["nb-math", "nb-chem", "nb-bio"].every((id) => openedRef.current.includes(id));
      if (!notebook.fancy && seenPretty) {
        draftRef.current = 2.4;
        const memory = teacher.memories.find((item) => item.id === "jealous");
        setCurrent({ id: "jealous", title: "The English notebook", pages: memory?.lines ?? [] });
      } else if (notebook.fancy) {
        setCurrent({ id: notebook.id, title: notebook.title, pages: ["This one looks really good."] });
      } else {
        setCurrent({ id: notebook.id, title: notebook.title, pages: ["This one is plainer. Open the decorated ones."] });
      }
      setPage(0);
      setTurning(false);
      sound.page();
      return;
    }
    const hit = place.books.find(
      (spot) => worldX >= spot.x && worldX <= spot.x + spot.w && point.y >= spot.y && point.y <= spot.y + spot.h,
    );
    if (hit) {
      const book = books[hit.index];
      if (!book) return;
      setOpened((currentIds) => {
        const next = currentIds.includes(book.id) ? currentIds : [...currentIds, book.id];
        openedRef.current = next;
        return next;
      });
      flutterRef.current.set(book.id, 0.01);
      setCurrent(book);
      setPage(0);
      setTurning(false);
      sound.page();
      return;
    }
    const door = place.door;
    const inDoor = worldX >= door.x && worldX <= door.x + door.w && point.y >= door.y && point.y <= door.y + door.h;
    if (!inDoor) return;
    const ready = openedRef.current.filter((id) => !id.startsWith("nb-")).length >= 6 && openedRef.current.includes("nb-eng");
    if (ready) {
      sound.duck(0.14);
      setShowFinal(true);
      setCurrent(null);
      return;
    }
    noticeRef.current = { text: "The quiet room is still dark.", life: 3.2 };
  }

  function turn() {
    if (!current || turning) return;
    sound.page();
    if (page + 1 >= current.pages.length) {
      setCurrent(null);
      return;
    }
    if (reducedMotion) {
      setPage((value) => value + 1);
      return;
    }
    setTurning(true);
    window.setTimeout(() => {
      setPage((value) => value + 1);
      setTurning(false);
    }, 280);
  }

  return (
    <div className={`lab-shell library-hall${covered ? " is-covered" : ""}`}>
      <p className="sr-only">
        Drag along the shelves, or use the arrow keys. Open a notebook on the desk, then the books. The quiet room is at the far end.
      </p>
      <canvas
        ref={canvasRef}
        role="application"
        aria-label="The library"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      />
      <button type="button" className="lab-leave" onClick={onLeave}>
        Leave
      </button>
      {current ? (
        <div className="lab-veil" onClick={() => setCurrent(null)}>
          <article className={`manuscript${turning ? " is-turning" : ""}`} onClick={(event) => event.stopPropagation()}>
            <div className="manuscript-face">
              <h2>{current.title}</h2>
              <p className="manuscript-kicker">
                {page + 1} / {current.pages.length}
              </p>
            </div>
            <div className="manuscript-leaf">
              <p>{current.pages[page]}</p>
              <button type="button" onClick={turn}>
                {page + 1 < current.pages.length ? "Turn the page" : "Close the book"}
              </button>
            </div>
          </article>
        </div>
      ) : null}
      {showFinal ? <Sequence kind="dark" title="The quiet room" lines={teacher.finale} onDone={onEnterMemory} /> : null}
      <span className="sr-only">{opened.length} books opened</span>
    </div>
  );
}

function approach(map: Map<string, number>, id: string, target: number, dt: number, reduced: boolean) {
  const current = map.get(id) ?? 0;
  const next = reduced ? target : current + (target - current) * Math.min(1, dt * 12);
  map.set(id, next);
  return next;
}
