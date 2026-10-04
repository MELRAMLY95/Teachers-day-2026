"use client";

import { Onward } from "@/components/onward";
import { RevealLines } from "@/components/reveal-lines";
import { studentById } from "@/lib/class";
import { plaque } from "@/lib/session";
import type { WorldProps } from "@/lib/types";
import { useEffect, useRef, useState } from "react";

const layout = [
  { id: "amina", x: 16, y: 28 },
  { id: "leo", x: 28, y: 46 },
  { id: "hana", x: 40, y: 24 },
  { id: "mateo", x: 52, y: 38 },
  { id: "noor", x: 64, y: 22 },
  { id: "jonah", x: 76, y: 36 },
  { id: "safa", x: 84, y: 52 },
  { id: "elias", x: 70, y: 66 },
  { id: "miriam", x: 56, y: 74 },
  { id: "yusuf", x: 40, y: 68 },
  { id: "chloe", x: 26, y: 72 },
  { id: "ibrahim", x: 18, y: 54 },
];

function Sky({ reducedMotion }: { reducedMotion: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    let frame = 0;
    let running = true;

    const stars = Array.from({ length: 140 }, (_, index) => ({
      x: ((index * 97) % 1000) / 1000,
      y: ((index * 57) % 1000) / 1000,
      r: (index % 5) * 0.3 + 0.4,
      p: (index % 12) / 12,
    }));

    const draw = (time: number) => {
      if (!running) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, rect.width, rect.height);
      const glow = context.createRadialGradient(
        rect.width * 0.7,
        rect.height * 0.3,
        20,
        rect.width * 0.6,
        rect.height * 0.4,
        rect.width * 0.7,
      );
      glow.addColorStop(0, "rgba(92, 78, 180, 0.35)");
      glow.addColorStop(0.45, "rgba(18, 70, 82, 0.18)");
      glow.addColorStop(1, "rgba(0,0,0,0)");
      context.fillStyle = glow;
      context.fillRect(0, 0, rect.width, rect.height);
      for (const star of stars) {
        const twinkle = reducedMotion ? 0.8 : 0.55 + Math.sin(time / 700 + star.p * 6) * 0.35;
        context.fillStyle = `rgba(244, 242, 255, ${twinkle})`;
        context.beginPath();
        context.arc(star.x * rect.width, star.y * rect.height, star.r, 0, Math.PI * 2);
        context.fill();
      }
      frame = window.requestAnimationFrame(draw);
    };

    frame = window.requestAnimationFrame(draw);
    return () => {
      running = false;
      window.cancelAnimationFrame(frame);
    };
  }, [reducedMotion]);

  return <canvas ref={ref} className="sky" aria-hidden="true" />;
}

function OrbitBench({
  reducedMotion,
  onStable,
}: {
  reducedMotion: boolean;
  onStable: () => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const stable = useRef(false);
  const onStableRef = useRef(onStable);
  const [note, setNote] = useState("Drag from the planet to give it a sideways push.");

  useEffect(() => {
    onStableRef.current = onStable;
  }, [onStable]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    let frame = 0;
    let running = true;
    let last = performance.now();
    let calm = 0;
    let placed = false;
    let nudged = false;
    const body = { x: 0, y: 0, vx: 0, vy: 0 };
    let dragging = false;
    let origin = { x: 0, y: 0 };

    const point = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };

    const down = (event: PointerEvent) => {
      dragging = true;
      origin = point(event);
      canvas.setPointerCapture(event.pointerId);
    };
    const up = (event: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      const next = point(event);
      body.vx = (next.x - origin.x) * 0.9;
      body.vy = (next.y - origin.y) * 0.9;
      nudged = true;
      calm = 0;
    };

    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);

    const draw = (time: number) => {
      if (!running) return;
      const dt = Math.min(0.033, (time - last) / 1000);
      last = time;
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, rect.width * dpr);
      canvas.height = Math.max(1, rect.height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      const sunX = rect.width / 2;
      const sunY = rect.height / 2;
      if (!placed && rect.width > 40) {
        body.x = sunX - 72;
        body.y = sunY;
        body.vx = 0;
        body.vy = 50;
        placed = true;
      }
      if (!dragging && placed) {
        const dx = sunX - body.x;
        const dy = sunY - body.y;
        const distance = Math.hypot(dx, dy) || 1;
        const pull = 180000 / (distance * distance);
        body.vx += (dx / distance) * pull * dt;
        body.vy += (dy / distance) * pull * dt;
        body.x += body.vx * dt;
        body.y += body.vy * dt;
        if (distance < 18) {
          body.x = sunX - 72;
          body.y = sunY;
          body.vx = 0;
          body.vy = 0;
          calm = 0;
          if (nudged) setNote("It fell into the star. Try a gentler sideways push.");
        } else if (distance > Math.min(rect.width, rect.height) * 0.48) {
          body.x = sunX - 72;
          body.y = sunY;
          body.vx = 0;
          body.vy = 0;
          calm = 0;
          if (nudged) setNote("It drifted away. A smaller push will hold.");
        } else if (distance > 48 && distance < 120) {
          calm += dt;
          if (calm > 2.6 && !stable.current) {
            stable.current = true;
            setNote("The path holds. A push, at the right moment, changes a whole orbit.");
            onStableRef.current();
          }
        } else {
          calm = 0;
        }
      }

      context.clearRect(0, 0, rect.width, rect.height);
      context.strokeStyle = "rgba(214, 206, 255, 0.18)";
      context.beginPath();
      context.arc(sunX, sunY, 90, 0, Math.PI * 2);
      context.stroke();
      context.fillStyle = "#f4e2b0";
      context.beginPath();
      context.arc(sunX, sunY, 10, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = "#9fd0ff";
      context.beginPath();
      context.arc(body.x, body.y, 5, 0, Math.PI * 2);
      context.fill();
      frame = window.requestAnimationFrame(draw);
    };

    frame = window.requestAnimationFrame(draw);
    return () => {
      running = false;
      window.cancelAnimationFrame(frame);
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
    };
  }, [reducedMotion]);

  return (
    <div className="orbit">
      <p className="mono">Gravity</p>
      <canvas ref={ref} aria-label="Give the planet a push so it stays in orbit" />
      <p>{note}</p>
    </div>
  );
}

export function PhysicsWorld({
  teacher,
  onMemory,
  reducedMotion,
  skipIntro,
  onIntroSeen,
}: WorldProps) {
  const [stage, setStage] = useState<"observatory" | "space">(skipIntro ? "space" : "observatory");
  const [opening, setOpening] = useState(false);
  const [visited, setVisited] = useState<string[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [orbitFound, setOrbitFound] = useState(false);
  const stars = layout
    .map((spot) => {
      const message = teacher.messages.find((item) => item.studentId === spot.id);
      const student = studentById(spot.id);
      if (!message || !student) return null;
      return { ...spot, name: student.name, line: message.line };
    })
    .filter((star) => star !== null);

  useEffect(() => {
    if (stage === "space") onIntroSeen();
  }, [onIntroSeen, stage]);

  function openRoof() {
    if (opening || stage === "space") return;
    setOpening(true);
    window.setTimeout(() => setStage("space"), reducedMotion ? 200 : 1800);
  }

  const ready = visited.length >= 6;
  const activeStar = stars.find((star) => star.id === active) ?? null;

  if (stage === "observatory") {
    return (
      <main className={`observatory ${opening ? "is-opening" : ""}`}>
        <div className="dome" aria-hidden="true" />
        <div className="scope">
          <p className="eyebrow">The observatory</p>
          <h1 className="display">The roof is still closed.</h1>
          <p>The telescope is pointed at a sky you have not opened yet.</p>
          <button type="button" className="telescope" onClick={openRoof}>
            {opening ? "The roof is opening" : "Look through the telescope"}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="space">
      <Sky reducedMotion={reducedMotion} />
      <svg className="constellation" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {stars.map((star, index) => {
          const next = stars[index + 1];
          if (!next) return null;
          if (!visited.includes(star.id) || !visited.includes(next.id)) return null;
          return (
            <line
              key={`${star.id}-${next.id}`}
              x1={star.x}
              y1={star.y}
              x2={next.x}
              y2={next.y}
            />
          );
        })}
      </svg>
      {stars.map((star) => (
        <button
          key={star.id}
          type="button"
          className={`student-star ${visited.includes(star.id) ? "seen" : ""}`}
          style={{ left: `${star.x}%`, top: `${star.y}%` }}
          onClick={() => {
            setActive(star.id);
            setVisited((current) => (current.includes(star.id) ? current : [...current, star.id]));
          }}
        >
          <span className="sr-only">{star.name}</span>
        </button>
      ))}
      <section className="space-panel">
        <p className="mono">{plaque(teacher)}</p>
        <h1 className="syne">Space</h1>
        {activeStar ? (
          <blockquote>
            <p>{activeStar.name}</p>
            <p>{activeStar.line}</p>
          </blockquote>
        ) : (
          <p>Each bright star is one of your students. Touch one.</p>
        )}
        {orbitFound ? <p>The orbit held. You taught us how a push becomes a path.</p> : null}
        {ready ? (
          <div className="constellation-name">
            <RevealLines
              reducedMotion={reducedMotion}
              lines={[
                teacher.name,
                "You taught us about forces we couldn't see.",
                "You were one too.",
                "You pushed us forward.",
              ]}
            >
              {(done) =>
                done ? <Onward onClick={onMemory}>A door where a star should be.</Onward> : null
              }
            </RevealLines>
          </div>
        ) : (
          <p className="hint">{visited.length} of the bright stars have spoken. Six will draw your name.</p>
        )}
      </section>
      <OrbitBench
        reducedMotion={reducedMotion}
        onStable={() => setOrbitFound(true)}
      />
    </main>
  );
}
