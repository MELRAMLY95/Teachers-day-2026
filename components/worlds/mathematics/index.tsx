"use client";

import { tributeSets } from "@/lib/tribute/sets";
import type { Teacher } from "@/lib/types";
import { TributeField } from "../shared/tribute";
import { WorldShell } from "../shared/world";

export function MathematicsWorld(props: {
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
      kicker="The room"
      line="The shapes are already moving."
      tone="math"
      enter="Come in"
      returnLabel="Back to the room"
    >
      {(covered) => (
        <TributeField
          teacher={props.teacher}
          covered={covered}
          reducedMotion={props.reducedMotion}
          onLeave={props.onLeave}
          tone="math"
          memories={tributeSets.noshen}
        />
      )}
    </WorldShell>
  );
}
