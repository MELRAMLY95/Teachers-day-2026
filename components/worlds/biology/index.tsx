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
      inMemory={false}
      kicker="The living world"
      line="The heart is already beating."
      tone="biology"
      enter="Come in"
      returnLabel="Back to the heart"
    >
      {(covered) => (
        <LivingField
          teacher={props.teacher}
          covered={covered}
          reducedMotion={props.reducedMotion}
          onLeave={props.onLeave}
        />
      )}
    </WorldShell>
  );
}
