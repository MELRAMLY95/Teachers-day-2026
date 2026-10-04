"use client";

import type { Teacher } from "@/lib/types";
import { useCallback, useState } from "react";
import { readFonts, useStage } from "../shared/stage";
import { Sequence } from "../shared/sequence";

type Book = { id: string; title: string; pages: string[] };

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
  const books = teacher.books ?? [];
  const ending = teacher.finale;
  const [opened, setOpened] = useState<string[]>([]);
  const [current, setCurrent] = useState<Book | null>(null);
  const [page, setPage] = useState(0);
  const [showFinal, setShowFinal] = useState(false);

  const canvasRef = useStage((ctx, width, height) => {
    const fonts = readFonts();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const time = reduce ? 0 : performance.now() / 1000;
    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, "#100c09");
    sky.addColorStop(0.4, "#24160f");
    sky.addColorStop(1, "#3a2416");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "#0c1218";
    ctx.fillRect(width * 0.72, height * 0.08, width * 0.18, height * 0.28);
    ctx.strokeStyle = "#6a4a30";
    ctx.lineWidth = 8;
    ctx.strokeRect(width * 0.72, height * 0.08, width * 0.18, height * 0.28);
    const moon = ctx.createRadialGradient(width * 0.8, height * 0.18, 2, width * 0.8, height * 0.18, 28);
    moon.addColorStop(0, "rgba(255, 236, 200, 0.9)");
    moon.addColorStop(1, "rgba(255, 236, 200, 0)");
    ctx.fillStyle = moon;
    ctx.beginPath();
    ctx.arc(width * 0.81, height * 0.16, 18, 0, Math.PI * 2);
    ctx.fill();

    const lamp = ctx.createRadialGradient(width * 0.42, height * 0.08, 8, width * 0.42, height * 0.42, width * 0.48);
    lamp.addColorStop(0, "rgba(255, 186, 96, 0.28)");
    lamp.addColorStop(1, "rgba(255, 186, 96, 0)");
    ctx.fillStyle = lamp;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = "rgba(92, 58, 34, 0.95)";
    ctx.lineWidth = 14;
    for (let row = 0; row < 4; row += 1) {
      const y = height * (0.18 + row * 0.16);
      ctx.beginPath();
      ctx.moveTo(width * 0.05, y);
      ctx.lineTo(width * 0.68, y);
      ctx.stroke();
      ctx.strokeStyle = "rgba(62, 40, 24, 0.8)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(width * 0.05, y + 8);
      ctx.lineTo(width * 0.68, y + 8);
      ctx.stroke();
      ctx.strokeStyle = "rgba(92, 58, 34, 0.95)";
      ctx.lineWidth = 14;
    }

    ctx.fillStyle = "#4a3020";
    ctx.fillRect(width * 0.28, height * 0.78, width * 0.28, height * 0.04);
    ctx.fillRect(width * 0.38, height * 0.82, 16, height * 0.18);
    ctx.fillRect(width * 0.5, height * 0.82, 16, height * 0.18);

    const words = ["specific", "a sentence", "who for", "the turn", "quietly"];
    ctx.font = `20px ${fonts.hand}`;
    for (let i = 0; i < words.length; i += 1) {
      const word = words[i] ?? "";
      const x = width * 0.7 + ((i * 37) % Math.max(40, width * 0.22));
      const y = height * 0.48 + ((i * 54 + time * 12) % (height * 0.28));
      ctx.fillStyle = "rgba(244, 226, 196, 0.34)";
      ctx.fillText(word, x, y);
    }
  });

  const finalReady = opened.length >= 3;

  const turn = useCallback(() => {
    if (!current) return;
    if (page + 1 < current.pages.length) setPage((value) => value + 1);
    else setCurrent(null);
  }, [current, page]);

  return (
    <div className={`lab-shell library-hall${covered ? " is-covered" : ""}`}>
      <canvas ref={canvasRef} aria-hidden="true" />
      <div className="library-books">
        {books.map((book, index) => (
          <button
            key={book.id}
            type="button"
            className={`library-book book-${index}`}
            onClick={() => {
              setOpened((currentIds) => (currentIds.includes(book.id) ? currentIds : [...currentIds, book.id]));
              setCurrent(book);
              setPage(0);
              setShowFinal(false);
            }}
          >
            <span>{book.title}</span>
          </button>
        ))}
        <button
          type="button"
          className={`library-book book-final${finalReady ? " is-ready" : ""}`}
          onClick={() => {
            if (!finalReady) return;
            setShowFinal(true);
            setCurrent(null);
          }}
        >
          <span>{finalReady ? "The quiet room" : "A closed door"}</span>
        </button>
      </div>
      <p className="library-hint">Pull a book from the shelf. Three of them open the quiet room.</p>
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
      {showFinal ? <Sequence kind="dark" title="The quiet room" lines={ending} onDone={onEnterMemory} /> : null}
    </div>
  );
}
