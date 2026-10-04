"use client";

import { discover, markExperiment, createWorldState } from "@/lib/engine/state";
import { memoryById } from "@/lib/teachers";
import type { Teacher } from "@/lib/types";
import { useSound } from "@/components/sound";
import { AlwaysOnline, Sequence } from "@/components/worlds/shared/sequence";
import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import {
  createRuntime,
  cursorFor,
  drawLab,
  layoutLab,
  noteFound,
  pointerDown,
  pointerMove,
  pointerUp,
  releasePointer,
  setMove,
  step,
  type Runtime,
} from "./scene";

export function Lab({
  teacher,
  reducedMotion,
  covered,
  onEnterMemory,
  onLeave,
}: {
  teacher: Teacher;
  reducedMotion: boolean;
  covered: boolean;
  onEnterMemory: () => void;
  onLeave: () => void;
}) {
  const sound = useSound();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rtRef = useRef<Runtime | null>(null);
  const [reading, setReading] = useState<string | null>(null);
  const [finale, setFinale] = useState(false);
  const [announce, setAnnounce] = useState("");
  const announced = useRef("");
  const worldRef = useRef(createWorldState());
  const reducedRef = useRef(reducedMotion);

  const runtime = useCallback(() => {
    rtRef.current ??= createRuntime();
    rtRef.current.plaque = `${teacher.honorific} ${teacher.name}`.trim();
    return rtRef.current;
  }, [teacher.honorific, teacher.name]);

  useEffect(() => {
    reducedRef.current = reducedMotion;
  }, [reducedMotion]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let frame = 0;
    let last = performance.now();

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const rect = canvas.getBoundingClientRect();
      const cssW = Math.max(1, rect.width);
      const cssH = Math.max(1, rect.height);
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const bitmapW = Math.floor(cssW * dpr);
      const bitmapH = Math.floor(cssH * dpr);
      if (canvas.width !== bitmapW || canvas.height !== bitmapH) {
        canvas.width = bitmapW;
        canvas.height = bitmapH;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const rt = runtime();
      if (!rt.fontsReady) {
        const styles = getComputedStyle(document.documentElement);
        const display = styles.getPropertyValue("--font-display-face").trim();
        const mono = styles.getPropertyValue("--font-mono-face").trim();
        const sans = styles.getPropertyValue("--font-outfit").trim();
        const hand = styles.getPropertyValue("--font-hand").trim();
        if (display) {
          rt.fonts = {
            display,
            mono: mono || "monospace",
            sans: sans || "sans-serif",
            hand: hand || display,
          };
          rt.fontsReady = true;
        }
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const narrow = cssW < 800;
      const worldW = cssW * (narrow ? 1.7 : 1.95);
      const worldH = cssH * (narrow ? 1.28 : 1.38);
      rt.look.viewW = cssW;
      rt.look.viewH = cssH;
      const layout = rt.view === "lab" ? layoutLab(worldW, worldH) : layoutLab(cssW, cssH);
      rt.reduced = reducedRef.current;
      const flags = step(rt, layout, dt);
      drawLab(ctx, rt, layout);
      if (flags.announce !== announced.current) {
        announced.current = flags.announce;
        setAnnounce(flags.announce);
      }
      if (flags.clink) sound.clink();
      frame = requestAnimationFrame(loop);
    };

    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [runtime, sound]);

  function point(event: PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function withLayout(canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect();
    const cssW = Math.max(1, rect.width);
    const cssH = Math.max(1, rect.height);
    const rt = runtime();
    if (rt.view !== "lab") return layoutLab(cssW, cssH);
    const narrow = cssW < 800;
    return layoutLab(cssW * (narrow ? 1.7 : 1.95), cssH * (narrow ? 1.28 : 1.38));
  }

  useEffect(() => {
    function down(event: KeyboardEvent) {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      const rt = runtime();
      if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") rt.moveX = -1;
      if (event.key === "ArrowRight" || event.key === "d" || event.key === "D") rt.moveX = 1;
      if (event.key === "ArrowUp" || event.key === "w" || event.key === "W") rt.moveY = -1;
      if (event.key === "ArrowDown" || event.key === "s" || event.key === "S") rt.moveY = 1;
      if (event.key.startsWith("Arrow")) event.preventDefault();
    }
    function up(event: KeyboardEvent) {
      const rt = runtime();
      if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") setMove(rt, 0, rt.moveY);
      if (event.key === "ArrowRight" || event.key === "d" || event.key === "D") setMove(rt, 0, rt.moveY);
      if (event.key === "ArrowUp" || event.key === "w" || event.key === "W") setMove(rt, rt.moveX, 0);
      if (event.key === "ArrowDown" || event.key === "s" || event.key === "S") setMove(rt, rt.moveX, 0);
    }
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [runtime]);

  function onPointerDown(event: PointerEvent<HTMLCanvasElement>) {
    if (reading || finale) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const p = point(event);
    pointerDown(runtime(), withLayout(event.currentTarget), p.x, p.y);
  }

  function onPointerMove(event: PointerEvent<HTMLCanvasElement>) {
    const p = point(event);
    const layout = withLayout(event.currentTarget);
    const rt = runtime();
    pointerMove(rt, layout, p.x, p.y);
    event.currentTarget.style.cursor = cursorFor(rt, layout, p.x, p.y);
  }

  function onPointerUp(event: PointerEvent<HTMLCanvasElement>) {
    const p = point(event);
    const rt = runtime();
    const action = pointerUp(rt, withLayout(event.currentTarget), p.x, p.y);
    if (action?.type === "ignite") sound.ignite();
    if (action?.type === "lesson") {
      const lines = memoryById(teacher, "window")?.lines ?? [];
      rt.line = { id: "window", index: action.index, text: lines[action.index] ?? "" };
      sound.page();
      return;
    }
    if (action?.type === "found") {
      finishMemory(action.id);
      rt.line = null;
      return;
    }
    if (action?.type === "memory") {
      const memory = memoryById(teacher, action.id);
      if (!memory) return;
      if (action.id === "monitor" || action.id === "phone") {
        setReading(action.id);
        return;
      }
      if (action.id === "window") {
        rt.lessonLines = memory.lines;
        rt.lessonAt = 0;
        rt.view = "lesson";
        rt.line = { id: "window", index: 0, text: memory.lines[0] ?? "" };
        sound.page();
        return;
      }
      if (!rt.line || rt.line.id !== action.id) {
        rt.line = { id: action.id, index: 0, text: memory.lines[0] ?? "" };
        finishMemory(action.id);
        sound.page();
        return;
      }
      const next = rt.line.index + 1;
      if (next >= memory.lines.length) {
        rt.line = null;
        finishMemory(action.id);
        return;
      }
      rt.line = { id: action.id, index: next, text: memory.lines[next] ?? "" };
      sound.page();
    }
    if (action?.type === "door") {
      const solid = rt.beaker.cuoh2 + rt.beaker.cuo > 0.001 && rt.maxTemp >= 80;
      worldRef.current = markExperiment(worldRef.current, solid, teacher.discoveriesNeeded);
      if (action.line) {
        rt.notice = { text: action.line, life: 6 };
        announced.current = action.line;
        setAnnounce(action.line);
      } else if (worldRef.current.finalUnlocked) {
        sound.duck(0.12);
        setFinale(true);
      }
    }
  }

  function finishMemory(id: string) {
    const rt = runtime();
    noteFound(rt, id);
    worldRef.current = discover(worldRef.current, id, teacher.discoveriesNeeded);
    worldRef.current = markExperiment(
      worldRef.current,
      rt.beaker.cuoh2 + rt.beaker.cuo > 0.001 && rt.maxTemp >= 80,
      teacher.discoveriesNeeded,
    );
    setReading(null);
  }

  return (
    <div className={`lab-shell${covered ? " is-covered" : ""}`}>
      <p className="sr-only">
        Drag the empty bench to look around the laboratory. Drag the copper sulfate bottle and the sodium
        hydroxide bottle over the mouth of the beaker and hold to pour. Drag the burner underneath the
        beaker and click it to light it. Open the lab book, the drawer, the margin, and the screen. The
        window stays dark until two things have been found. The screen stays online at every hour. Use the
        lens, or the beaker, to see the molecules. Arrow keys also move through the room.
      </p>
      <canvas
        ref={canvasRef}
        role="application"
        aria-label="Chemistry laboratory"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => releasePointer(runtime())}
      />
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
      <button type="button" className="lab-leave" onClick={onLeave}>
        Leave
      </button>
      {reading === "monitor" || reading === "phone" ? (
        <AlwaysOnline
          hours={["9:00 PM", "11:30 PM", "1:00 AM", "3:00 AM"]}
          lines={memoryById(teacher, reading)?.lines ?? []}
          onClose={() => setReading(null)}
          onDone={() => finishMemory(reading)}
        />
      ) : null}
      {finale ? (
        <Sequence kind="sun" lines={teacher.finale} onDone={onEnterMemory} />
      ) : null}
    </div>
  );
}
