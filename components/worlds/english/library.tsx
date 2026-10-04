"use client";

import { useSound } from "@/components/sound";
import type { Teacher } from "@/lib/types";
import { useRef, useState, type PointerEvent } from "react";
import { clampLook, createLook, dragPan, startPan, stopPan, type Look } from "../shared/look";
import { readFonts, useStage } from "../shared/stage";
import { Sequence } from "../shared/sequence";

type Book = { id: string; title: string; pages: string[] };

const SPINES = ["#7c2f24", "#3c4a34", "#6a3d28", "#243246", "#5a2c28"];

export function Library({
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
  const books = teacher.books ?? [];
  const lookRef = useRef<Look>(createLook());
  const openedRef = useRef<string[]>([]);
  const [opened, setOpened] = useState<string[]>([]);
  const [current, setCurrent] = useState<Book | null>(null);
  const [page, setPage] = useState(0);
  const [showFinal, setShowFinal] = useState(false);

  function spots(width: number, height: number) {
    const worldW = Math.max(width * 2.1, 220 + books.length * 150);
    return {
      worldW,
      door: { x: worldW - 150, y: height * 0.22, w: 86, h: height * 0.46 },
      books: books.map((book, index) => ({
        book,
        x: 70 + index * 148,
        y: height * (index % 2 === 0 ? 0.22 : 0.48) - (index % 2 === 0 ? 120 : 108),
        w: 34,
        h: index % 2 === 0 ? 120 : 108,
        color: SPINES[index % SPINES.length] ?? "#5a2c28",
      })),
    };
  }

  const canvasRef = useStage((ctx, width, height) => {
    const fonts = readFonts();
    const look = lookRef.current;
    const place = spots(width, height);
    look.viewW = width;
    look.viewH = height;
    look.worldW = place.worldW;
    look.worldH = height;
    if (!look.framed) look.framed = true;
    clampLook(look);
    ctx.fillStyle = "#100c09";
    ctx.fillRect(0, 0, width, height);
    ctx.save();
    ctx.translate(-look.x, 0);

    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, "#100c09");
    sky.addColorStop(0.45, "#24160f");
    sky.addColorStop(1, "#3a2416");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, place.worldW, height);

    const lampX = width * 0.42 + look.x * 0.15;
    const lamp = ctx.createRadialGradient(lampX, height * 0.08, 8, lampX, height * 0.42, width * 0.55);
    lamp.addColorStop(0, `rgba(255, 186, 96, ${0.16 + openedRef.current.length * 0.05})`);
    lamp.addColorStop(1, "rgba(255, 186, 96, 0)");
    ctx.fillStyle = lamp;
    ctx.fillRect(0, 0, place.worldW, height);

    ctx.strokeStyle = "rgba(92, 58, 34, 0.95)";
    ctx.lineWidth = 16;
    for (const y of [height * 0.22, height * 0.48]) {
      ctx.beginPath();
      ctx.moveTo(24, y);
      ctx.lineTo(place.worldW - 220, y);
      ctx.stroke();
    }

    for (const spot of place.books) {
      const known = openedRef.current.includes(spot.book.id);
      ctx.fillStyle = spot.color;
      ctx.fillRect(spot.x, spot.y, spot.w, spot.h);
      ctx.fillStyle = "rgba(255,255,255,0.14)";
      ctx.fillRect(spot.x, spot.y, 4, spot.h);
      if (known) {
        ctx.fillStyle = "rgba(246, 236, 210, 0.9)";
        ctx.font = `13px ${fonts.hand}`;
        ctx.save();
        ctx.translate(spot.x + 22, spot.y + 16);
        ctx.rotate(Math.PI / 2);
        ctx.textAlign = "left";
        ctx.fillText(spot.book.title, 0, 0);
        ctx.restore();
      }
    }

    const ready = openedRef.current.length >= 3;
    ctx.fillStyle = ready ? "#c6a56e" : "#1a1410";
    ctx.fillRect(place.door.x, place.door.y, place.door.w, place.door.h);
    ctx.strokeStyle = ready ? "#f0ddb4" : "#4a3424";
    ctx.lineWidth = 3;
    ctx.strokeRect(place.door.x, place.door.y, place.door.w, place.door.h);
    ctx.fillStyle = ready ? "#241c14" : "rgba(246, 236, 210, 0.55)";
    ctx.font = `15px ${fonts.hand}`;
    ctx.textAlign = "center";
    const doorLabel = ready ? "quiet room" : "closed";
    ctx.fillText(doorLabel, place.door.x + place.door.w / 2, place.door.y + place.door.h / 2);

    ctx.fillStyle = "#4a3020";
    ctx.fillRect(place.worldW * 0.35, height * 0.78, width * 0.28, height * 0.04);

    ctx.restore();
    ctx.fillStyle = "rgba(246, 236, 220, 0.78)";
    ctx.font = `16px ${fonts.hand}`;
    ctx.textAlign = "left";
    ctx.fillText(
      look.looked ? "Pull a book. The quiet room is at the far end." : "Drag the shelves. The books are not all in front of you.",
      22,
      height - 28,
    );
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
    const panned = stopPan(look, point.x, point.y);
    if (panned) return;
    const place = spots(point.width, point.height);
    const worldX = point.x + look.x;
    const hit = place.books.find(
      (spot) => worldX >= spot.x && worldX <= spot.x + spot.w && point.y >= spot.y && point.y <= spot.y + spot.h,
    );
    if (hit) {
      setOpened((currentIds) => {
        const next = currentIds.includes(hit.book.id) ? currentIds : [...currentIds, hit.book.id];
        openedRef.current = next;
        return next;
      });
      setCurrent(hit.book);
      setPage(0);
      sound.page();
      return;
    }
    const door = place.door;
    const inDoor = worldX >= door.x && worldX <= door.x + door.w && point.y >= door.y && point.y <= door.y + door.h;
    if (!inDoor) return;
    if (openedRef.current.length >= 3) {
      sound.duck(0.14);
      setShowFinal(true);
      setCurrent(null);
    }
  }

  function turn() {
    if (!current) return;
    sound.page();
    if (page + 1 < current.pages.length) setPage((value) => value + 1);
    else setCurrent(null);
  }

  return (
    <div className={`lab-shell library-hall${covered ? " is-covered" : ""}`}>
      <p className="sr-only">Drag along the shelves to find the books. Open one and turn its pages. The quiet room is at the far end.</p>
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
          <article className="manuscript" onClick={(event) => event.stopPropagation()}>
            <h2>{current.title}</h2>
            <p>{current.pages[page]}</p>
            <button type="button" onClick={turn}>
              {page + 1 < current.pages.length ? "Turn the page" : "Close the book"}
            </button>
          </article>
        </div>
      ) : null}
      {showFinal ? <Sequence kind="dark" title="The quiet room" lines={teacher.finale} onDone={onEnterMemory} /> : null}
      <span className="sr-only">{opened.length} books opened</span>
    </div>
  );
}
