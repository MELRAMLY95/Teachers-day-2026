"use client";

import { tributeSets } from "@/lib/tribute/sets";
import type { Teacher } from "@/lib/types";
import { TributeField } from "../shared/tribute";
import { WorldShell } from "../shared/world";

export function ChemistryWorld(props: {
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
      kicker="The laboratory"
      line="The lamp is already warm."
      tone="chemistry"
      enter="Come in"
      returnLabel="Back to the laboratory"
    >
      {(covered) => (
        <TributeField
          teacher={props.teacher}
          covered={covered}
          reducedMotion={props.reducedMotion}
          onLeave={props.onLeave}
          tone="chemistry"
          memories={tributeSets.irum}
        />
      )}
    </WorldShell>
  );
}
