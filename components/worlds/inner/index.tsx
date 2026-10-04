"use client";

import type { Teacher } from "@/lib/types";
import { WorldShell } from "../shared/world";
import { Courtyard } from "./courtyard";

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
      kicker="The inner world"
      line="There is no score in this room."
      tone="inner"
      enter="Enter"
      returnLabel="Back to the courtyard"
    >
      {(covered) => (
        <Courtyard
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
