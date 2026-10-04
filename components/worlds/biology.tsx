"use client";

import { Onward } from "@/components/onward";
import { RevealLines } from "@/components/reveal-lines";
import { studentById } from "@/lib/class";
import type { WorldProps } from "@/lib/types";
import { useEffect, useRef, useState } from "react";

const spots = [
  { id: "nucleus", studentId: "amina", x: 22, y: 36, label: "A nucleus" },
  { id: "seed", studentId: "safa", x: 70, y: 28, label: "A seed" },
  { id: "neuron", studentId: "miriam", x: 62, y: 62, label: "A neuron" },
  { id: "split", studentId: "leo", x: 30, y: 68, label: "A dividing cell" },
  { id: "heart", studentId: "hana", x: 48, y: 46, label: "A pulse" },
  { id: "leaf", studentId: "elias", x: 80, y: 48, label: "A vein" },
  { id: "helix", studentId: "noor", x: 14, y: 58, label: "A helix" },
  { id: "creature", studentId: "ibrahim", x: 46, y: 78, label: "A small swimmer" },
];

function LivingCanvas({ life, reducedMotion }: { life: number; reducedMotion: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    let frame = 0;
    let running = true;

    const draw = (time: number) => {
      if (!running) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, rect.width, rect.height);
      const sway = reducedMotion ? 0 : Math.sin(time / 900) * 8;

      if (life >= 1) {
        context.strokeStyle = "rgba(231, 180, 216, 0.85)";
        context.lineWidth = 2;
        context.beginPath();
        context.ellipse(rect.width * 0.28, rect.height * 0.42, 70, 48, 0.2, 0, Math.PI * 2);
        context.stroke();
        context.fillStyle = "rgba(240, 215, 162, 0.9)";
        context.beginPath();
        context.arc(rect.width * 0.28, rect.height * 0.42, 14, 0, Math.PI * 2);
        context.fill();
      }
      if (life >= 2) {
        context.strokeStyle = "rgba(182, 242, 196, 0.9)";
        context.beginPath();
        context.moveTo(rect.width * 0.72, rect.height * 0.78);
        context.quadraticCurveTo(rect.width * 0.7, rect.height * 0.5, rect.width * 0.74 + sway, rect.height * 0.28);
        context.stroke();
        context.beginPath();
        context.ellipse(rect.width * 0.74 + sway, rect.height * 0.26, 18, 8, -0.6, 0, Math.PI * 2);
        context.stroke();
      }
      if (life >= 3) {
        context.strokeStyle = "rgba(186, 214, 255, 0.8)";
        context.beginPath();
        context.moveTo(rect.width * 0.58, rect.height * 0.62);
        context.lineTo(rect.width * 0.5, rect.height * 0.48);
        context.lineTo(rect.width * 0.66, rect.height * 0.4);
        context.moveTo(rect.width * 0.5, rect.height * 0.48);
        context.lineTo(rect.width * 0.42, rect.height * 0.36);
        context.stroke();
      }
      if (life >= 5) {
        context.strokeStyle = "rgba(255, 154, 154, 0.55)";
        context.lineWidth = 6;
        context.beginPath();
        context.moveTo(0, rect.height * 0.7);
        context.bezierCurveTo(
          rect.width * 0.3,
          rect.height * 0.55,
          rect.width * 0.6,
          rect.height * 0.9,
          rect.width,
          rect.height * 0.62,
        );
        context.stroke();
      }
      if (life >= 6) {
        context.strokeStyle = "rgba(214, 196, 255, 0.8)";
        context.lineWidth = 1.5;
        for (let i = 0; i < 7; i += 1) {
          const y = rect.height * 0.18 + i * 10;
          context.beginPath();
          context.ellipse(rect.width * 0.16, y, 16, 7, i % 2 === 0 ? 0.4 : -0.4, 0, Math.PI * 2);
          context.stroke();
        }
      }
      if (life >= 7) {
        context.fillStyle = "rgba(182, 242, 196, 0.85)";
        context.beginPath();
        context.ellipse(rect.width * 0.48, rect.height * 0.8 + sway * 0.2, 22, 8, 0.2, 0, Math.PI * 2);
        context.fill();
      }

      frame = window.requestAnimationFrame(draw);
    };

    frame = window.requestAnimationFrame(draw);
    return () => {
      running = false;
      window.cancelAnimationFrame(frame);
    };
  }, [life, reducedMotion]);

  return <canvas ref={ref} className="living-canvas" aria-hidden="true" />;
}

export function BiologyWorld({
  teacher,
  onMemory,
  reducedMotion,
  skipIntro,
  onIntroSeen,
}: WorldProps) {
  const [opened, setOpened] = useState(false);
  const [found, setFound] = useState<string[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const entered = opened || skipIntro || reducedMotion;

  useEffect(() => {
    if (entered) return;
    const timer = window.setTimeout(() => setOpened(true), 1800);
    return () => window.clearTimeout(timer);
  }, [entered]);

  useEffect(() => {
    if (entered) onIntroSeen();
  }, [entered, onIntroSeen]);

  const activeSpot = spots.find((spot) => spot.id === active);
  const activeStudent = activeSpot ? studentById(activeSpot.studentId) : null;
  const activeLine = activeSpot
    ? teacher.messages.find((message) => message.studentId === activeSpot.studentId)?.line
    : "";
  const alive = found.length >= 6;

  if (!entered) {
    return (
      <main className="bio-intro">
        <h1 className="display">You are very small.</h1>
        <p>The world around you is alive, and almost empty.</p>
      </main>
    );
  }

  return (
    <main className={`living life-${Math.min(found.length, 8)}`}>
      <LivingCanvas life={found.length} reducedMotion={reducedMotion} />
      <header className="world-heading bio-heading">
        <p className="eyebrow">The living world</p>
        <h1 className="display">{teacher.name}</h1>
        <p>The ecosystem starts quiet. Every memory gives it something to grow.</p>
      </header>
      {spots.map((spot) => (
        <button
          key={spot.id}
          type="button"
          className={`organism ${found.includes(spot.id) ? "grown" : ""}`}
          style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
          onClick={() => {
            setActive(spot.id);
            setFound((current) => (current.includes(spot.id) ? current : [...current, spot.id]));
          }}
        >
          {spot.label}
        </button>
      ))}
      <aside className="bio-note">
        {activeStudent ? (
          <>
            <h2>{activeStudent.name}</h2>
            <p>{activeLine}</p>
          </>
        ) : (
          <p>Touch what glows. Leaves, cells, and nerves are waiting to be noticed.</p>
        )}
        {alive ? (
          <RevealLines
            reducedMotion={reducedMotion}
            lines={[
              "Every living thing grows from something.",
              "And some of us grew because you were there.",
            ]}
          >
            {(done) =>
              done ? <Onward onClick={onMemory}>A door grown over with leaves.</Onward> : null
            }
          </RevealLines>
        ) : (
          <p className="hint">{found.length} memories have taken root. The world fills at six.</p>
        )}
      </aside>
    </main>
  );
}
