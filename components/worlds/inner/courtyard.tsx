"use client";

import type { Teacher } from "@/lib/types";
import { useCallback, useRef, useState } from "react";
import { readFonts, useStage } from "../shared/stage";
import { Sequence } from "../shared/sequence";

type Choice = "intention" | "patience" | "mercy";

const LIGHT: Record<Choice, string> = {
  intention: "rgba(255, 214, 150, 0.28)",
  patience: "rgba(150, 176, 186, 0.2)",
  mercy: "rgba(255, 150, 110, 0.26)",
};

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
  const choiceRef = useRef<Choice | null>(null);
  const visitedRef = useRef(0);
  const nameRef = useRef(`${teacher.honorific} ${teacher.name}`.trim());
  const reducedRef = useRef(reducedMotion);
  const [choice, setChoice] = useState<Choice | null>(null);
  const [visited, setVisited] = useState<Choice[]>([]);
  const [journey, setJourney] = useState(false);
  const fontsReady = useRef(false);

  const choose = useCallback((next: Choice) => {
    choiceRef.current = next;
    setChoice(next);
    setVisited((current) => {
      const nextVisited = current.includes(next) ? current : [...current, next];
      visitedRef.current = nextVisited.length;
      return nextVisited;
    });
  }, []);

  const canvasRef = useStage((ctx, width, height, dt) => {
    if (!fontsReady.current) {
      readFonts();
      fontsReady.current = true;
    }
    reducedRef.current = reducedMotion;
    const spin = reducedRef.current ? 0 : dt;
    ctx.fillStyle = "#140e0c";
    ctx.fillRect(0, 0, width, height);
    const picked = choiceRef.current;
    if (picked) {
      const glow = ctx.createRadialGradient(width * 0.5, height * 0.42, 20, width * 0.5, height * 0.42, width * 0.42);
      glow.addColorStop(0, LIGHT[picked]);
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);
    }
    const fonts = readFonts();
    ctx.save();
    ctx.translate(width / 2, height * 0.38);
    ctx.rotate(spin === 0 ? 0 : (performance.now() / 14000) % (Math.PI * 2));
    const step = Math.max(128, Math.min(width, height) * 0.24);
    for (let row = -3; row <= 3; row += 1) {
      for (let col = -4; col <= 4; col += 1) {
        star8(
          ctx,
          col * step,
          row * step,
          step * 0.34,
          picked ? "rgba(232, 206, 150, 0.82)" : "rgba(176, 146, 104, 0.42)",
        );
      }
    }
    ctx.restore();

    ctx.fillStyle = "#1a120e";
    ctx.fillRect(0, height * 0.72, width, height * 0.28);
    ctx.strokeStyle = "rgba(196, 164, 112, 0.28)";
    for (let i = 0; i < 8; i += 1) {
      ctx.beginPath();
      ctx.moveTo((i / 8) * width, height * 0.72);
      ctx.lineTo((i / 8) * width + 40, height);
      ctx.stroke();
    }

    if (visitedRef.current >= 3) {
      ctx.fillStyle = "rgba(243, 234, 216, 0.88)";
      ctx.font = `22px ${fonts.hand}`;
      ctx.textAlign = "center";
      ctx.fillText(nameRef.current, width / 2, height * 0.64);
    }
  });

  const ready = visited.length >= 3;
  const reflection = choice ? teacher.memories.find((memory) => memory.id === choice) : null;

  return (
    <div className={`lab-shell courtyard${covered ? " is-covered" : ""}`}>
      <canvas ref={canvasRef} aria-hidden="true" />
      <div className="arches">
        {(["intention", "patience", "mercy"] as const).map((id) => (
          <button
            key={id}
            type="button"
            className={`arch${choice === id ? " is-on" : ""}`}
            onClick={() => choose(id)}
          >
            {id}
          </button>
        ))}
      </div>
      {reflection ? (
        <article className="stone-panel">
          <h2>{reflection.title}</h2>
          {reflection.lines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </article>
      ) : (
        <p className="courtyard-invite">Three arches. Nothing here is scored. Walk through them.</p>
      )}
      {ready ? (
        <button type="button" className="courtyard-door" onClick={() => setJourney(true)}>
          The journey
        </button>
      ) : null}
      {journey ? (
        <Sequence
          kind="stone"
          lines={teacher.memories.find((memory) => memory.id === "trip")?.lines ?? teacher.finale}
          onDone={onEnterMemory}
        />
      ) : null}
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
  ctx.beginPath();
  for (let i = 0; i < 16; i += 1) {
    const angle = (i / 16) * Math.PI * 2 - Math.PI / 2;
    const arm = i % 2 === 0 ? radius * 0.88 : radius * 0.36;
    const px = Math.cos(angle) * arm;
    const py = Math.sin(angle) * arm;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}
