"use client";

import type { Teacher } from "@/lib/types";
import { useState } from "react";

export function Classroom({
  teacher,
  onReturn,
  onLeave,
  returnLabel,
}: {
  teacher: Teacher;
  onReturn: () => void;
  onLeave: () => void;
  returnLabel: string;
}) {
  const [opened, setOpened] = useState<string[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [line, setLine] = useState(0);
  const ending = teacher.ending ?? [];
  const ready = opened.length >= 3;
  const notes = teacher.notes;

  function toggle(id: string) {
    setActive((current) => (current === id ? null : id));
    setOpened((current) => (current.includes(id) ? current : [...current, id]));
  }

  return (
    <main className="memory-room">
      <div className="memory-board">{teacher.roomLabel}</div>
      {notes.map((note, index) => (
        <button
          key={note.id}
          type="button"
          className={`desk-paper paper-${index}${active === note.id ? " is-open" : ""}`}
          onClick={() => toggle(note.id)}
        >
          <span className="paper-name">{note.label}</span>
          {active === note.id ? <span className="paper-line">{note.line}</span> : null}
        </button>
      ))}
      <button
        type="button"
        className="final-letter"
        onClick={() => {
          if (!ready) return;
          setLine((current) => Math.min(ending.length, current + 1));
        }}
      >
        <span className="paper-name">On the front desk</span>
        {!ready ? (
          <span className="paper-line">The page is blank. Read a few of the notes they left on the desks.</span>
        ) : null}
        {ready && line === 0 ? <span className="paper-line">The page is blank. Touch it.</span> : null}
        {ending.slice(0, line).map((text) => (
          <span key={text} className="paper-line ink">
            {text}
          </span>
        ))}
      </button>
      <div className="room-nav">
        <button type="button" onClick={onReturn}>
          {returnLabel}
        </button>
        <button type="button" onClick={onLeave}>
          Leave
        </button>
      </div>
    </main>
  );
}
