"use client";

import type { Teacher } from "@/lib/types";
import { useCallback, useState, type ReactNode } from "react";
import { Arrival } from "./arrival";
import { Classroom } from "./classroom";

export function WorldShell({
  teacher,
  reducedMotion,
  skipIntro,
  inMemory,
  onIntroSeen,
  onReturnToLab,
  onLeave,
  kicker,
  line,
  tone,
  enter,
  returnLabel,
  children,
}: {
  teacher: Teacher;
  reducedMotion: boolean;
  skipIntro: boolean;
  inMemory: boolean;
  onIntroSeen: () => void;
  onEnterMemory: () => void;
  onReturnToLab: () => void;
  onLeave: () => void;
  kicker: string;
  line: string;
  tone: string;
  enter: string;
  returnLabel: string;
  children: (covered: boolean) => ReactNode;
}) {
  const [open, setOpen] = useState(skipIntro || inMemory);
  const name = `${teacher.honorific} ${teacher.name}`.trim();
  const enterWorld = useCallback(() => {
    setOpen(true);
    onIntroSeen();
  }, [onIntroSeen]);

  return (
    <>
      {!open ? (
        <Arrival
          kicker={kicker}
          name={name}
          line={line}
          tone={tone}
          enter={enter}
          reducedMotion={reducedMotion}
          onDone={enterWorld}
        />
      ) : null}
      {open ? children(inMemory) : null}
      {inMemory ? (
        <Classroom teacher={teacher} onReturn={onReturnToLab} onLeave={onLeave} returnLabel={returnLabel} />
      ) : null}
    </>
  );
}
