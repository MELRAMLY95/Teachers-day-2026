"use client";

import { Onward } from "@/components/onward";
import { RevealLines } from "@/components/reveal-lines";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { WorldProps } from "@/lib/types";
import { FormEvent, useEffect, useState } from "react";

const puzzles = [
  {
    id: "linear",
    prompt: "The far wall reads: 2(x + 3) = 20",
    label: "What is x?",
    answers: ["7"],
    shift: "The wall folds. A corridor of triangles opens where the plaster was.",
  },
  {
    id: "sequence",
    prompt: "Numbers drift past you: 1, 1, 2, 3, 5, 8",
    label: "What comes next?",
    answers: ["13"],
    shift: "A spiral tightens, then becomes a staircase.",
  },
  {
    id: "slope",
    prompt: "A vertical line is drawn through the middle of the room.",
    label: "What is its slope?",
    answers: ["undefined", "no slope", "none", "infinity"],
    shift: "The floor remembers it was only a grid.",
  },
] as const;

export function MathematicsWorld({
  teacher,
  onMemory,
  reducedMotion,
  skipIntro,
  onIntroSeen,
}: WorldProps) {
  const [revealed, setRevealed] = useState(false);
  const arrived = revealed || skipIntro || reducedMotion;
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState("");
  const [wrong, setWrong] = useState(false);
  const [note, setNote] = useState("");
  const [finale, setFinale] = useState(false);
  const puzzle = puzzles[index];

  useEffect(() => {
    if (arrived) return;
    const timer = window.setTimeout(() => setRevealed(true), 1600);
    return () => window.clearTimeout(timer);
  }, [arrived]);

  useEffect(() => {
    if (arrived) onIntroSeen();
  }, [arrived, onIntroSeen]);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!puzzle) return;
    const guess = value.toLowerCase().replace(/\s+/g, " ").trim();
    const correct = puzzle.answers.some((answer) => answer === guess);
    if (!correct) {
      setWrong(true);
      setNote("The room does not punish that. It simply waits.");
      window.setTimeout(() => setWrong(false), 700);
      return;
    }
    setValue("");
    setWrong(false);
    setNote(puzzle.shift);
    if (index === puzzles.length - 1) {
      setFinale(true);
      return;
    }
    setIndex((current) => current + 1);
  }

  return (
    <main className={`math-room depth-${finale ? 3 : index} ${wrong ? "is-wrong" : ""}`}>
      <div className="math-grid" aria-hidden="true" />
      <div className="floating-numbers" aria-hidden="true">
        <span>π</span>
        <span>√2</span>
        <span>∞</span>
        <span>φ</span>
        <span>e</span>
      </div>
      {!arrived ? (
        <section className="math-arrive">
          <h1 className="display">The room was not built to be understood all at once.</h1>
        </section>
      ) : finale ? (
        <section className="finale math-finale">
          <RevealLines
            reducedMotion={reducedMotion}
            lines={[
              "THE ANSWER WAS NEVER THE POINT.",
              "You taught us that getting something wrong isn't failure.",
              "It's another step toward finding the answer.",
              "Teacher + Students = Memories",
              teacher.name,
            ]}
          >
            {(done) =>
              done ? <Onward onClick={onMemory}>A door with no equation on it.</Onward> : null
            }
          </RevealLines>
        </section>
      ) : (
        <section className="math-desk">
          <p className="eyebrow">The impossible room</p>
          <h1 className="display">{teacher.name}</h1>
          <p className="equation">{puzzle.prompt}</p>
          <form onSubmit={submit}>
            <Label htmlFor="math-answer">{puzzle.label}</Label>
            <Input
              id="math-answer"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              autoComplete="off"
              required
            />
            <Button type="submit">Offer it to the room</Button>
          </form>
          {note ? <p className="hint">{note}</p> : null}
          <p className="hint">
            Door {index + 1} of {puzzles.length}
          </p>
        </section>
      )}
    </main>
  );
}
