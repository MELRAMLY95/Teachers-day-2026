"use client";

import type { Teacher } from "@/lib/types";
import { useCallback, useState } from "react";
import { Entrance } from "./entrance";
import { Lab } from "./lab";
import { MemoryRoom } from "./memory-room";

export function ChemistryWorld({
  teacher,
  reducedMotion,
  skipIntro,
  inMemory,
  onIntroSeen,
  onEnterMemory,
  onReturnToLab,
  onLeave,
}: {
  teacher: Teacher;
  reducedMotion: boolean;
  skipIntro: boolean;
  inMemory: boolean;
  onIntroSeen: () => void;
  onEnterMemory: () => void;
  onReturnToLab: () => void;
  onLeave: () => void;
}) {
  const [labOn, setLabOn] = useState(skipIntro || inMemory);
  const name = `${teacher.honorific} ${teacher.name}`.trim();
  const enterLab = useCallback(() => {
    setLabOn(true);
    onIntroSeen();
  }, [onIntroSeen]);

  return (
    <>
      {!labOn ? <Entrance name={name} reducedMotion={reducedMotion} onDone={enterLab} /> : null}
      {labOn ? (
        <Lab
          teacher={teacher}
          reducedMotion={reducedMotion}
          covered={inMemory}
          onEnterMemory={onEnterMemory}
          onLeave={onLeave}
        />
      ) : null}
      {inMemory ? <MemoryRoom teacher={teacher} onReturn={onReturnToLab} onLeave={onLeave} /> : null}
    </>
  );
}
