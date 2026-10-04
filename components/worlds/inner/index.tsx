"use client";

import { tributeSets } from "@/lib/tribute/sets";
import type { Teacher } from "@/lib/types";
import { TributeField } from "../shared/tribute";
import { WorldShell } from "../shared/world";

export function InnerWorld(props: {
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
      kicker="The courtyard"
      line="The path is already quiet."
      tone="inner"
      enter="Come in"
      returnLabel="Back to the courtyard"
    >
      {(covered) => (
        <TributeField
          teacher={props.teacher}
          covered={covered}
          reducedMotion={props.reducedMotion}
          onLeave={props.onLeave}
          tone="inner"
          memories={tributeSets.maryam}
        />
      )}
    </WorldShell>
  );
}
