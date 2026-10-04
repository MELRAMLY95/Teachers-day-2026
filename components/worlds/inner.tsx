"use client";

import { Onward } from "@/components/onward";
import { RevealLines } from "@/components/reveal-lines";
import { Button } from "@/components/ui/button";
import type { WorldProps } from "@/lib/types";
import { useEffect, useState } from "react";

type Door = {
  id: string;
  title: string;
  scene: string;
  choices: { id: string; label: string; reflection: string }[];
};

const doors: Door[] = [
  {
    id: "intention",
    title: "Intention",
    scene:
      "One student helps tidy the room because someone is watching. Another stays after everyone has gone, with no audience at all.",
    choices: [
      {
        id: "act",
        label: "What they did is enough to see",
        reflection:
          "The visible act still matters. People are helped, or not, by what we actually do. Islamic teaching also asks for the motive underneath: a well-known hadith, recorded by al-Bukhari and Muslim, says that actions are only by intentions, and that each person shall have only what they intended. You taught us to look at the hands and the heart.",
      },
      {
        id: "motive",
        label: "What they meant changes the act",
        reflection:
          "There is a hadith, recorded by al-Bukhari and Muslim, that actions are only by intentions. Psychology stands nearby: motive shapes the person we are becoming. You let those two ideas keep company, without turning either into a trick.",
      },
    ],
  },
  {
    id: "character",
    title: "Character",
    scene:
      "A classmate is unkind on Tuesday and apologises on Wednesday. The apology is clumsy. It is also real.",
    choices: [
      {
        id: "pattern",
        label: "Look at the pattern, not one day",
        reflection:
          "Character is a direction. One unkind hour is not a whole person, and one good hour is not either. You asked us to watch where a life was turning, and to leave room for the turn.",
      },
      {
        id: "apology",
        label: "Let the apology start a new pattern",
        reflection:
          "An apology is not the whole of character. It can be the first step of it. You treated repair as something practiced, not performed.",
      },
    ],
  },
  {
    id: "knowledge",
    title: "Knowledge",
    scene:
      "One student can recite the answer and cannot explain it. Another explains it slowly, with gaps, and keeps checking whether the gaps are honest.",
    choices: [
      {
        id: "certain",
        label: "Hold on to the certain answer",
        reflection:
          "A true answer is worth keeping. You also protected the sentence 'I don't know yet.' Seeking knowledge, in the way you taught it, includes humility about its edges.",
      },
      {
        id: "gaps",
        label: "Stay with the explanation that has gaps",
        reflection:
          "Understanding can include what is still unfinished. You never punished a careful uncertainty. You called it part of learning, not the opposite of it.",
      },
    ],
  },
  {
    id: "patience",
    title: "Patience",
    scene: "A student wants the result before the work. The clock in the room is very loud.",
    choices: [
      {
        id: "with",
        label: "Wait beside them",
        reflection:
          "Patience, as you practiced it, was not absence. It was staying. Sabr can be a quiet kind of work: remaining with someone until the thing can be done properly.",
      },
      {
        id: "process",
        label: "Let the process be the lesson",
        reflection:
          "You let the waiting teach. Not as a delay, and not as a punishment. As the time in which understanding actually arrives.",
      },
    ],
  },
  {
    id: "compassion",
    title: "Compassion",
    scene:
      "Two students are in an argument. One of them is more articulate. The other is right about something they cannot yet phrase.",
    choices: [
      {
        id: "quiet",
        label: "Listen longer to the quieter voice",
        reflection:
          "Compassion, the way you taught it, was attention. Rahma looked like turning toward the person who was hardest to hear.",
      },
      {
        id: "both",
        label: "Ask what each of them needs",
        reflection:
          "You did not treat kindness as choosing a winner. You asked what would let both people remain in the room with their dignity.",
      },
    ],
  },
  {
    id: "choice",
    title: "Choice",
    scene: "A pen has been left behind. The corridor is empty. No one will know what you do next.",
    choices: [
      {
        id: "leave",
        label: "Leave it. It is small.",
        reflection:
          "Small things are still choices. You talked about responsibility as something that happens when the room is empty, not only when it is watching.",
      },
      {
        id: "return",
        label: "Return it. It is small.",
        reflection:
          "The unseen choice is still a choice. You never made goodness depend on an audience. That stayed with us.",
      },
    ],
  },
];

function Geometry() {
  return (
    <svg className="geometry" aria-hidden="true">
      <defs>
        <pattern id="rosette" width="120" height="120" patternUnits="userSpaceOnUse">
          <rect x="36" y="36" width="48" height="48" fill="none" stroke="currentColor" />
          <rect
            x="36"
            y="36"
            width="48"
            height="48"
            fill="none"
            stroke="currentColor"
            transform="rotate(45 60 60)"
          />
          <circle cx="60" cy="60" r="10" fill="none" stroke="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#rosette)" />
    </svg>
  );
}

export function InnerWorld({
  teacher,
  onMemory,
  reducedMotion,
  skipIntro,
  onIntroSeen,
}: WorldProps) {
  const [finishedArrival, setFinishedArrival] = useState(false);
  const settled = finishedArrival || skipIntro || reducedMotion;
  const [openId, setOpenId] = useState<string | null>(null);
  const [reflections, setReflections] = useState<Record<string, string>>({});
  const [quiet, setQuiet] = useState(false);
  const open = doors.find((door) => door.id === openId) ?? null;
  const visited = Object.keys(reflections).length;

  useEffect(() => {
    if (settled) return;
    const timer = window.setTimeout(() => setFinishedArrival(true), 1800);
    return () => window.clearTimeout(timer);
  }, [settled]);

  useEffect(() => {
    if (settled) onIntroSeen();
  }, [onIntroSeen, settled]);

  useEffect(() => {
    if (visited === doors.length) {
      const timer = window.setTimeout(() => setQuiet(true), reducedMotion ? 0 : 700);
      return () => window.clearTimeout(timer);
    }
  }, [reducedMotion, visited]);

  if (!settled) {
    return (
      <main className="study is-arriving">
        <h1 className="display">The noise falls away.</h1>
      </main>
    );
  }

  if (quiet) {
    return (
      <main className="quiet-room">
        <RevealLines
          reducedMotion={reducedMotion}
          lines={[
            "A teacher doesn't only teach what to think.",
            "Sometimes, they change how we see the world.",
            teacher.name,
          ]}
        >
          {(done) =>
            done ? <Onward onClick={onMemory}>A door back to the classroom.</Onward> : null
          }
        </RevealLines>
      </main>
    );
  }

  return (
    <main className="study">
      <Geometry />
      <header className="world-heading">
        <p className="eyebrow">The inner world</p>
        <h1 className="display">{teacher.name}</h1>
        <p>There is nothing to win here. Each door is a way of looking.</p>
      </header>
      {open ? (
        <article className="scenario">
          <p className="eyebrow">{open.title}</p>
          <p>{open.scene}</p>
          {reflections[open.id] ? (
            <>
              <p className="reflection">{reflections[open.id]}</p>
              <Button type="button" variant="ghost" className="bar-button" onClick={() => setOpenId(null)}>
                Step back into the study
              </Button>
            </>
          ) : (
            <div className="choices">
              {open.choices.map((choice) => (
                <Button
                  key={choice.id}
                  type="button"
                  variant="outline"
                  className="choice"
                  onClick={() =>
                    setReflections((current) => ({ ...current, [open.id]: choice.reflection }))
                  }
                >
                  {choice.label}
                </Button>
              ))}
            </div>
          )}
        </article>
      ) : (
        <div className="doors">
          {doors.map((door) => (
            <Button
              key={door.id}
              type="button"
              variant="ghost"
              className={`arch ${reflections[door.id] ? "visited" : ""}`}
              onClick={() => setOpenId(door.id)}
            >
              <span>{door.title}</span>
              {reflections[door.id] ? <small>You have been here</small> : <small>Enter</small>}
            </Button>
          ))}
        </div>
      )}
    </main>
  );
}
