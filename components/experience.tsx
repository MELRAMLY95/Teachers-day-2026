"use client";

import { BiologyWorld } from "@/components/worlds/biology";
import { ChemistryWorld } from "@/components/worlds/chemistry";
import { EnglishWorld } from "@/components/worlds/english";
import { InnerWorld } from "@/components/worlds/inner";
import { MathematicsWorld } from "@/components/worlds/mathematics";
import { PhysicsWorld } from "@/components/worlds/physics";
import { UnopenedWorld } from "@/components/worlds/unopened";
import { Gate } from "@/components/gate";
import { SoundProvider, useSound } from "@/components/sound";
import { useReducedMotion } from "@/components/use-reduced-motion";
import type { Bed } from "@/lib/audio";
import { clearSession, readSession, writeSession, type SessionPhase } from "@/lib/session";
import { getTeacher } from "@/lib/teachers";
import type { Teacher } from "@/lib/types";
import { worldModules } from "@/teachers/registry";
import { useCallback, useEffect, useState } from "react";

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
    document.title = phase === "memory" ? teacher.roomLabel : teacher.worldTitle;
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

  if (worldModules[teacher.subject].implemented) {
    const worlds = {
      chemistry: ChemistryWorld,
      physics: PhysicsWorld,
      mathematics: MathematicsWorld,
      biology: BiologyWorld,
      english: EnglishWorld,
      inner: InnerWorld,
    } as const;
    const World = worlds[teacher.subject];
    return (
      <World
        key={teacher.id}
        teacher={teacher}
        reducedMotion={reducedMotion}
        skipIntro={introSeen}
        inMemory={phase === "memory"}
        onIntroSeen={markIntro}
        onEnterMemory={() => {
          writeSession({ id: teacher.id, phase: "memory", introSeen: true });
          setJourney({ teacher, phase: "memory", introSeen: true });
        }}
        onReturnToLab={() => {
          writeSession({ id: teacher.id, phase: "world", introSeen: true });
          setJourney({ teacher, phase: "world", introSeen: true });
        }}
        onLeave={signOut}
      />
    );
  }

  return <UnopenedWorld teacher={teacher} onLeave={signOut} />;
}

export function Experience() {
  return (
    <SoundProvider>
      <div className="grain" aria-hidden="true" />
      <Journey />
    </SoundProvider>
  );
}
