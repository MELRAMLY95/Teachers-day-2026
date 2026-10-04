"use client";

import { BiologyWorld } from "@/components/worlds/biology";
import { ChemistryWorld } from "@/components/worlds/chemistry";
import { EnglishWorld } from "@/components/worlds/english";
import { InnerWorld } from "@/components/worlds/inner";
import { MathematicsWorld } from "@/components/worlds/mathematics";
import { PhysicsWorld } from "@/components/worlds/physics";
import { Gate } from "@/components/gate";
import { MemoryRoom } from "@/components/memory-room";
import { SoundProvider, useSound } from "@/components/sound";
import { useReducedMotion } from "@/components/use-reduced-motion";
import { WorldBar } from "@/components/world-bar";
import type { Bed } from "@/lib/audio";
import { clearSession, readSession, writeSession, type SessionPhase } from "@/lib/session";
import { getTeacher, worldTitles } from "@/lib/teachers";
import type { Subject, Teacher, WorldProps } from "@/lib/types";
import { useCallback, useEffect, useState } from "react";

const worlds: Record<Subject, (props: WorldProps) => React.JSX.Element> = {
  chemistry: ChemistryWorld,
  physics: PhysicsWorld,
  mathematics: MathematicsWorld,
  biology: BiologyWorld,
  english: EnglishWorld,
  inner: InnerWorld,
};

type JourneyState = {
  teacher: Teacher | null;
  phase: SessionPhase | "gate";
  introSeen: boolean;
};

function initialJourney(): JourneyState {
  const saved = readSession();
  const teacher = saved ? getTeacher(saved.id) : null;
  if (!saved || !teacher) {
    return { teacher: null, phase: "gate", introSeen: false };
  }
  return { teacher, phase: saved.phase, introSeen: saved.introSeen };
}

function Journey() {
  const sound = useSound();
  const reducedMotion = useReducedMotion();
  const [journey, setJourney] = useState(initialJourney);
  const { teacher, phase, introSeen } = journey;

  const markIntro = useCallback(() => {
    setJourney((current) => {
      if (!current.teacher || current.phase === "gate" || current.introSeen) return current;
      const next = { ...current, introSeen: true };
      writeSession({ id: current.teacher.id, phase: current.phase, introSeen: true });
      return next;
    });
  }, []);

  useEffect(() => {
    const bed: Bed = !teacher || phase === "gate" ? "none" : phase === "memory" ? "memory" : teacher.subject;
    void sound.playBed(bed);
  }, [phase, sound, teacher]);

  useEffect(() => {
    if (!teacher || phase === "gate") {
      document.title = "Welcome";
      return;
    }
    document.title =
      phase === "memory" ? `Happy Teachers' Day, ${teacher.name}` : worldTitles[teacher.subject];
  }, [phase, teacher]);

  function signOut() {
    clearSession();
    setJourney({ teacher: null, phase: "gate", introSeen: false });
    void sound.playBed("none");
  }

  if (!teacher || phase === "gate") {
    return (
      <Gate
        onEnter={(next) => {
          void sound.unlock();
          const nextJourney: JourneyState = { teacher: next, phase: "world", introSeen: false };
          writeSession({ id: next.id, phase: "world", introSeen: false });
          setJourney(nextJourney);
        }}
      />
    );
  }

  if (phase === "memory") {
    return (
      <>
        <WorldBar tone="day" onSignOut={signOut} />
        <MemoryRoom
          teacher={teacher}
          onReturn={() => {
            writeSession({ id: teacher.id, phase: "world", introSeen: true });
            setJourney({ teacher, phase: "world", introSeen: true });
          }}
        />
      </>
    );
  }

  const World = worlds[teacher.subject];
  return (
    <>
      <WorldBar onSignOut={signOut} />
      <World
        key={teacher.id}
        teacher={teacher}
        reducedMotion={reducedMotion}
        skipIntro={introSeen}
        onIntroSeen={markIntro}
        onMemory={() => {
          writeSession({ id: teacher.id, phase: "memory", introSeen: true });
          setJourney({ teacher, phase: "memory", introSeen: true });
        }}
      />
    </>
  );
}

export function Experience() {
  return (
    <SoundProvider>
      <div className="grain" aria-hidden="true" />
      <Journey />
    </SoundProvider>
  );
}
