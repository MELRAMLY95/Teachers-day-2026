"use client";

import { tributeSets } from "@/lib/tribute/sets";
import type { Teacher } from "@/lib/types";
import { TributeField } from "../shared/tribute";
import { WorldShell } from "../shared/world";

export function PhysicsWorld(props: {
  teacher: Teacher;
  reducedMotion: boolean;
  skipIntro: boolean;
  inMemory: boolean;
  onIntroSeen: () => void;
  onEnterMemory: () => void;
  onReturnToLab: () => void;
  onLeave: () => void;
}) {
  return (
    <WorldShell
      {...props}
      inMemory={false}
      kicker="The observatory"
      line="The star is already lit."
      tone="physics"
      enter="Come in"
      returnLabel="Back to the observatory"
    >
      {(covered) => (
        <TributeField
          teacher={props.teacher}
          covered={covered}
          reducedMotion={props.reducedMotion}
          onLeave={props.onLeave}
          tone="physics"
          memories={tributeSets.hadia}
        />
      )}
    </WorldShell>
  );
}
