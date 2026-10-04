"use client";

import { useSound } from "@/components/sound";
import { letterFor, type TributeMemory } from "@/lib/tribute/sets";
import type { Teacher } from "@/lib/types";
import { useEffect, useRef, useState } from "react";
import { drawScene, type SceneTone } from "./scenes";
import { createSim, pointerDown, pointerMove, pointerUp, stepSim, type WorldSim } from "./sim";
import { useStage } from "./stage";

type Focus = string | null;

const LAYOUT = [
  { x: 0.5, y: 0.17 },
  { x: 0.16, y: 0.32 },
  { x: 0.84, y: 0.3 },
  { x: 0.13, y: 0.52 },
  { x: 0.87, y: 0.52 },
  { x: 0.28, y: 0.74 },
  { x: 0.72, y: 0.74 },
  { x: 0.5, y: 0.88 },
];

type Runtime = {
  time: number;
  live: number;
  opened: Set<string>;
  focus: Focus;
  vista: boolean;
  warmth: number;
  zoom: number;
  panX: number;
  panY: number;
  freeze: boolean;
};

function createRuntime(): Runtime {
  return {
    time: 0,
    live: 0,
    opened: new Set(),
    focus: null,
    vista: false,
    warmth: 0.08,
    zoom: 1,
    panX: 0,
    panY: 0,
    freeze: false,
  };
}

function placeOf(index: number, count: number, width: number, height: number) {
  const climax = LAYOUT[LAYOUT.length - 1] ?? { x: 0.5, y: 0.88 };
  const spot = index === count - 1 ? climax : LAYOUT[index] ?? climax;
  const pull = width < 760 ? 0.08 : 0;
  return {
    x: width * (0.5 + (spot.x - 0.5) * (1 - pull)),
    y: height * spot.y,
  };
}

function screenToWorld(x: number, y: number, width: number, height: number, zoom: number, panX: number, panY: number) {
  return {
    x: (x - width / 2) / zoom + width / 2 + panX,
    y: (y - height / 2) / zoom + height / 2 + panY,
  };
}

export function TributeField({
  teacher,
  covered,
  reducedMotion,
  onLeave,
  tone,
  memories,
}: {
  teacher: Teacher;
  covered: boolean;
  reducedMotion: boolean;
  onLeave: () => void;
  tone: SceneTone;
  memories: TributeMemory[];
}) {
  const sound = useSound();
  const rtRef = useRef<Runtime | null>(null);
  const simRef = useRef<WorldSim | null>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const [note, setNote] = useState("");
  const canvasRef = useStage((ctx, width, height, dt) => {
    const rt = (rtRef.current ??= createRuntime());
    const sim = (simRef.current ??= createSim());
    const motion = reducedMotion || rt.freeze ? dt * 0.04 : dt;
    stepSim(sim, motion, tone);
    rt.time += motion;
    rt.live += reducedMotion ? dt * 0.35 : dt;
    const life = memories.length ? rt.opened.size / memories.length : 0;
    const memoryFocus = rt.focus && rt.focus !== "letter" && rt.focus !== "dedication" ? rt.focus : null;
    const focusIndex = memories.findIndex((item) => item.id === memoryFocus);
    const focusSpot = focusIndex >= 0 ? placeOf(focusIndex, memories.length, width, height) : null;
    const warmFocus = memoryFocus === "sun" || memoryFocus === "praise" || memoryFocus === "safe";
    const warmthTarget = Math.min(1, warmFocus ? 0.95 : 0.08 + life * 0.8);
    rt.warmth += (warmthTarget - rt.warmth) * Math.min(1, dt * 0.7);
    const zoomTarget = rt.vista || rt.focus === "dedication" ? 0.8 : focusSpot ? 1.06 : 1;
    rt.zoom += (zoomTarget - rt.zoom) * Math.min(1, dt * 1.4);
    const panTargetX = focusSpot ? (focusSpot.x - width / 2) * 0.18 : 0;
    const panTargetY = focusSpot ? (focusSpot.y - height / 2) * 0.14 : 0;
    rt.panX += (panTargetX - rt.panX) * Math.min(1, dt * 1.4);
    rt.panY += (panTargetY - rt.panY) * Math.min(1, dt * 1.4);
    if (layerRef.current) {
      layerRef.current.style.transform = `translate(${-rt.zoom * rt.panX}px, ${-rt.zoom * rt.panY}px) scale(${rt.zoom})`;
    }

    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(rt.zoom, rt.zoom);
    ctx.translate(-width / 2 - rt.panX, -height / 2 - rt.panY);
    drawScene(ctx, tone, {
      time: rt.time,
      live: rt.live,
      life,
      warmth: rt.warmth,
      focus: rt.focus,
      freeze: rt.freeze,
      width,
      height,
      spots: memories.map((item, index) => {
        const at = placeOf(index, memories.length, width, height);
        return { id: item.id, x: at.x, y: at.y, open: rt.opened.has(item.id) ? 1 : 0.18 + life * 0.15 };
      }),
      sim,
    });
    ctx.restore();
  });

  const runtime = () => (rtRef.current ??= createRuntime());
  const [opened, setOpened] = useState<string[]>([]);
  const [focus, setFocus] = useState<Focus>(null);
  const [vista, setVista] = useState(false);
  const [slowMark, setSlowMark] = useState(0);
  const [clock, setClock] = useState(0);
  const [size, setSize] = useState({ w: 1280, h: 800 });

  useEffect(() => {
    const rt = runtime();
    rt.opened = new Set(opened);
    rt.focus = focus;
    rt.vista = vista;
    rt.freeze = Boolean(memories.find((item) => item.id === focus)?.freeze);
  }, [opened, focus, vista, memories]);

  useEffect(() => {
    if (focus) sound.duck(0.55);
    else sound.duck(1);
  }, [focus, sound]);

  useEffect(() => {
    return () => {
      sound.duck(1);
    };
  }, [sound]);

  useEffect(() => {
    const memory = memories.find((item) => item.id === focus);
    if (!memory?.slow) return;
    const started = performance.now();
    const frame = window.requestAnimationFrame(() => {
      setSlowMark(started);
      setClock(started);
    });
    const timer = window.setInterval(() => setClock(performance.now()), 280);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearInterval(timer);
    };
  }, [focus, memories]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const measure = () => {
      const rect = canvas.getBoundingClientRect();
      setSize({ w: Math.max(1, rect.width), h: Math.max(1, rect.height) });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [canvasRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const point = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const rt = rtRef.current ?? createRuntime();
      return screenToWorld(event.clientX - rect.left, event.clientY - rect.top, rect.width, rect.height, rt.zoom, rt.panX, rt.panY);
    };
    const down = (event: PointerEvent) => {
      const rt = rtRef.current;
      const sim = simRef.current;
      if (!rt || !sim || rt.focus) return;
      const at = point(event);
      pointerDown(sim, tone, at.x, at.y, canvas.getBoundingClientRect().width, canvas.getBoundingClientRect().height);
      setNote(sim.note);
    };
    const move = (event: PointerEvent) => {
      const rt = rtRef.current;
      const sim = simRef.current;
      if (!rt || !sim || rt.focus || !sim.holding) return;
      const at = point(event);
      const rect = canvas.getBoundingClientRect();
      pointerMove(sim, tone, at.x, at.y, rect.width, rect.height);
      setNote(sim.note);
    };
    const up = () => {
      const sim = simRef.current;
      if (!sim) return;
      pointerUp(sim, tone);
      setNote(sim.note);
    };
    canvas.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      canvas.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [canvasRef, tone]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setFocus(null);
        setVista(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const memory = memories.find((item) => item.id === focus) ?? null;
  const allRead = opened.length >= memories.length;
  const name = `${teacher.honorific} ${teacher.name}`.trim();
  const letter = letterFor(teacher.id);
  const delays = reducedMotion ? [0, 900, 2000] : [0, 4200, 9200];
  const shownLines = memory
    ? memory.slow
      ? memory.lines.filter((_, index) => clock - slowMark >= delays[index])
      : memory.lines
    : [];

  function openMemory(id: string) {
    setVista(false);
    if (memories.find((item) => item.id === id)?.slow) {
      setSlowMark(0);
      setClock(0);
    }
    setFocus(id);
    setOpened((current) => (current.includes(id) ? current : [...current, id]));
  }

  function dismiss() {
    setFocus(null);
    setVista(false);
  }

  const readClass = memory
    ? `garden-read${memory.slow || memory.freeze ? " is-grade" : ""}${memory.lines.length === 1 ? " is-one" : ""}${
        memory.id === "safe" || memory.id === "notebooks" ? " is-heart" : ""
      }`
    : "";

  return (
    <div className={`lab-shell garden-shell tribute-${tone}${covered ? " is-covered" : ""}`}>
      <p className="sr-only">
        {teacher.worldTitle}. The memories are in the open. Choose one to read it. Close returns you. Escape closes a memory.
      </p>
      <canvas ref={canvasRef} aria-hidden="true" />
      {focus || vista || allRead ? null : (
        <>
          <p className="garden-prompt">Explore memories</p>
          <p className="garden-count">
            {opened.length} / {memories.length} memories
          </p>
        </>
      )}
      {note && !focus && !vista ? <p className="world-note">{note}</p> : null}
      <div ref={layerRef} className={`garden-layer${focus || vista ? " is-quiet" : ""}`}>
        {memories.map((item, index) => {
          const at = placeOf(index, memories.length, size.w, size.h);
          return (
            <button
              key={item.id}
              type="button"
              className={`garden-memory${index === memories.length - 1 ? " is-grade" : ""}${opened.includes(item.id) ? " is-read" : ""}`}
              style={{ left: at.x, top: at.y }}
              onClick={() => openMemory(item.id)}
            >
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
      {allRead && !focus && !vista ? (
        <button type="button" className="garden-letter" onClick={() => setFocus("letter")}>
          The letter
        </button>
      ) : null}
      {memory ? (
        <div className={readClass} onClick={() => { if (!memory.slow) dismiss(); }}>
          <div className="garden-words" aria-live="polite" onClick={(event) => event.stopPropagation()}>
            {shownLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
          <button type="button" className="garden-close" onClick={dismiss}>
            Close
          </button>
        </div>
      ) : null}
      {focus === "letter" ? (
        <div className="garden-read is-letter">
          <div className="garden-words" aria-live="polite">
            {letter.map((line, index) => (
              <p key={`${index}-${line}`}>{line}</p>
            ))}
          </div>
          <div className="garden-actions">
            <button
              type="button"
              className="garden-close"
              onClick={() => {
                setVista(true);
                setFocus("dedication");
              }}
            >
              Continue
            </button>
            <button type="button" className="garden-close is-quiet" onClick={dismiss}>
              Close
            </button>
          </div>
        </div>
      ) : null}
      {focus === "dedication" ? (
        <div className="garden-read is-dedication">
          <div className="garden-words">
            <p className="garden-name">{name}</p>
            <p className="garden-day">{"Happy Teachers' Day ❤️"}</p>
          </div>
        </div>
      ) : null}
      <button type="button" className="lab-leave" onClick={onLeave}>
        Leave
      </button>
    </div>
  );
}
