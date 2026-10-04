"use client";

import { useState } from "react";

const HOURS = ["09:00", "14:00", "20:00", "01:00", "03:47"];

export function Sequence({
  kind,
  title,
  lines,
  onDone,
}: {
  kind: "page" | "glass" | "dark" | "stone" | "sun";
  title?: string;
  lines: string[];
  onDone: () => void;
}) {
  const [count, setCount] = useState(1);
  const finished = count >= lines.length;

  return (
    <div className={`sequence sequence-${kind}`}>
      <article>
        {title ? <h2>{title}</h2> : null}
        {lines.slice(0, count).map((line) => (
          <p key={line}>{line}</p>
        ))}
        <button type="button" onClick={() => (finished ? onDone() : setCount((value) => value + 1))}>
          {finished ? "Leave it here" : "Continue"}
        </button>
      </article>
    </div>
  );
}

export function AlwaysOnline({ punchline, onDone, onClose }: { punchline: string; onDone: () => void; onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const [seen, setSeen] = useState<number[]>([0]);
  const done = seen.length >= HOURS.length;

  return (
    <div className="sequence sequence-screen">
      <article>
        <p className="screen-live">Online</p>
        <button
          type="button"
          className="screen-time"
          onClick={() => {
            const next = (index + 1) % HOURS.length;
            setIndex(next);
            setSeen((current) => (current.includes(next) ? current : [...current, next]));
          }}
        >
          {HOURS[index]}
        </button>
        <p>{done ? punchline : "The hour changes. The status does not."}</p>
        <button type="button" onClick={done ? onDone : onClose}>
          {done ? "Leave the screen" : "Close"}
        </button>
      </article>
    </div>
  );
}
