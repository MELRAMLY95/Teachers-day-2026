"use client";

import { Onward } from "@/components/onward";
import { RevealLines } from "@/components/reveal-lines";
import { studentById } from "@/lib/class";
import { Button } from "@/components/ui/button";
import type { Teacher, WorldProps } from "@/lib/types";
import { useEffect, useState } from "react";

type Book = {
  id: string;
  title: string;
  spine: string;
  passages: { by: string; text: string }[];
};

function booksFor(teacher: Teacher): Book[] {
  const take = (id: string) => {
    const student = studentById(id);
    const line = teacher.messages.find((message) => message.studentId === id)?.line ?? "";
    return { by: student?.name ?? "A student", text: line };
  };
  return [
    {
      id: "said",
      title: "Things You Said",
      spine: "#6e2a2a",
      passages: [take("amina"), take("leo"), take("elias")],
    },
    {
      id: "learned",
      title: "Things We Learned",
      spine: "#1f3d34",
      passages: [take("safa"), take("chloe"), take("ibrahim")],
    },
    {
      id: "never",
      title: "Things We Never Told You",
      spine: "#24324a",
      passages: [take("noor"), take("jonah")],
    },
    {
      id: "memories",
      title: "Our Favourite Memories",
      spine: "#6a4a22",
      passages: [take("hana"), take("yusuf")],
    },
    {
      id: "funny",
      title: "The Funniest Moments",
      spine: "#7a3e55",
      passages: [take("mateo")],
    },
    {
      id: "letters",
      title: "Letters",
      spine: "#4d3828",
      passages: [take("miriam")],
    },
    {
      id: "future",
      title: "The Future",
      spine: "#2c2a33",
      passages: [
        {
          by: "The class",
          text: `We do not know every room we will walk into after yours, ${teacher.name}. We know we will enter them with sentences we did not have before.`,
        },
      ],
    },
  ];
}

export function EnglishWorld({
  teacher,
  onMemory,
  reducedMotion,
  skipIntro,
  onIntroSeen,
}: WorldProps) {
  const books = booksFor(teacher);
  const [lit, setLit] = useState(false);
  const lamp = lit || skipIntro || reducedMotion;
  const [openId, setOpenId] = useState<string | null>(null);
  const [read, setRead] = useState<string[]>([]);
  const untitledReady = read.length >= 4;
  const [untitled, setUntitled] = useState(false);

  useEffect(() => {
    if (lamp) return;
    const timer = window.setTimeout(() => setLit(true), 1500);
    return () => window.clearTimeout(timer);
  }, [lamp]);

  useEffect(() => {
    if (lamp) onIntroSeen();
  }, [lamp, onIntroSeen]);

  function openBook(id: string) {
    setOpenId(id);
    setUntitled(false);
    setRead((current) => (current.includes(id) ? current : [...current, id]));
  }

  const openBookData = books.find((book) => book.id === openId) ?? null;

  if (!lamp) {
    return (
      <main className="library is-dark">
        <h1 className="display">A lamp is finding the shelves.</h1>
      </main>
    );
  }

  return (
    <main className="library">
      <div className="lamp" aria-hidden="true" />
      <header className="world-heading">
        <p className="eyebrow">The library of stories</p>
        <h1 className="display">{teacher.name}</h1>
        <p>Every book on these shelves was written by your students.</p>
      </header>
      <div className="shelves">
        {books.map((book) => (
          <Button
            key={book.id}
            type="button"
            variant="ghost"
            className={`book ${read.includes(book.id) ? "read" : ""}`}
            style={{ background: book.spine }}
            onClick={() => openBook(book.id)}
          >
            {book.title}
          </Button>
        ))}
        <Button
          type="button"
          variant="ghost"
          className={`book untitled ${untitledReady ? "ready" : ""}`}
          onClick={() => {
            if (!untitledReady) return;
            setOpenId(null);
            setUntitled(true);
          }}
        >
          {untitledReady ? "A book with no title" : "A pale book, still shut"}
        </Button>
      </div>
      {openBookData ? (
        <article className="spread">
          <p className="eyebrow">{openBookData.title}</p>
          {openBookData.passages.map((passage) => (
            <blockquote key={passage.by}>
              <p>{passage.text}</p>
              <footer>{passage.by}</footer>
            </blockquote>
          ))}
          <Button type="button" variant="ghost" className="bar-button" onClick={() => setOpenId(null)}>
            Close the book
          </Button>
        </article>
      ) : null}
      {untitled ? (
        <article className="spread untitled-spread">
          <RevealLines
            reducedMotion={reducedMotion}
            lines={[
              "You spent years helping us write our stories.",
              "This one is about you.",
              ...teacher.messages.map((message) => {
                const student = studentById(message.studentId);
                return `${student?.name ?? "A student"}: ${message.line}`;
              }),
            ]}
          >
            {(done) =>
              done ? <Onward onClick={onMemory}>A door between two shelves.</Onward> : null
            }
          </RevealLines>
        </article>
      ) : null}
      {!untitled && !openBookData ? (
        <p className="hint library-hint">
          {untitledReady
            ? "The untitled book on the lectern will open now."
            : "Read a few of the shelves. One book is waiting until you do."}
        </p>
      ) : null}
    </main>
  );
}
