"use client";

import { tributeSets } from "@/lib/tribute/sets";
import type { Teacher } from "@/lib/types";
import { TributeField } from "../shared/tribute";
import { WorldShell } from "../shared/world";

export function EnglishWorld(props: {
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
      kicker="The library"
      line="The lamp is already on."
      tone="english"
      enter="Come in"
      returnLabel="Back to the library"
    >
      {(covered) => (
        <TributeField
          teacher={props.teacher}
          covered={covered}
          reducedMotion={props.reducedMotion}
          onLeave={props.onLeave}
          tone="english"
          memories={tributeSets.naila}
        />
      )}
    </WorldShell>
  );
}
