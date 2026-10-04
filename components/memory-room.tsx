"use client";

import { Onward } from "@/components/onward";
import { initials, studentById } from "@/lib/class";
import type { Teacher } from "@/lib/types";
import Image from "next/image";
export function MemoryRoom({
  teacher,
  onReturn,
}: {
  teacher: Teacher;
  onReturn: () => void;
}) {
  const notes = teacher.messages
    .map((message) => {
      const student = studentById(message.studentId);
      if (!student) return null;
      return { ...message, student };
    })
    .filter((note) => note !== null);

  return (
    <main className="classroom">
      <section className="room-hero">
        <div className="window-light" aria-hidden="true" />
        <p className="chalk-kicker">The memory room</p>
        <div className="board">
          <p>Different subjects.</p>
          <p>Different lessons.</p>
          <p>Different memories.</p>
          <p>But the same students.</p>
          <p>And the same teacher who made those memories possible.</p>
        </div>
      </section>

      <section className="wall" aria-label="Messages from the class">
        {notes.map((note) => (
          <article key={note.student.id} className="desk-note">
            <div className="portrait">
              {note.student.photo ? (
                <Image
                  src={note.student.photo}
                  alt={note.student.name}
                  fill
                  sizes="240px"
                  className="portrait-photo"
                />
              ) : (
                <span className="display">{initials(note.student.name)}</span>
              )}
            </div>
            <div>
              <h2>{note.student.name}</h2>
              <p>{note.line}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="dedication">
        <p className="eyebrow">From your students</p>
        <h2 className="display">Happy Teachers&apos; Day, {teacher.name}.</h2>
        <p className="project-name">The Worlds We Learned In</p>
        <div className="dedication-actions">
          <Onward onClick={onReturn}>Return to your world</Onward>
        </div>
      </section>
    </main>
  );
}
