"use client";

import type { Teacher } from "@/lib/types";
import { WorldShell } from "../shared/world";
import { LivingField } from "./field";

export function BiologyWorld(props: {
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
      kicker="The living world"
      line="It begins quiet. What you find is what makes it grow."
      tone="biology"
      enter="Enter the field"
      returnLabel="Back to the field"
    >
      {(covered) => (
        <LivingField
          teacher={props.teacher}
          covered={covered}
          reducedMotion={props.reducedMotion}
          onEnterMemory={props.onEnterMemory}
          onLeave={props.onLeave}
        />
      )}
    </WorldShell>
  );
}
