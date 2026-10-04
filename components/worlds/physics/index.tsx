"use client";

import type { Teacher } from "@/lib/types";
import { WorldShell } from "../shared/world";
import { Observatory } from "./observatory";

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
      kicker="The universe"
      line="The dome is open."
      tone="physics"
      enter="Enter the observatory"
      returnLabel="Back to the observatory"
    >
      {(covered) => (
        <Observatory
          teacher={props.teacher}
          covered={covered}
          onEnterMemory={props.onEnterMemory}
          onLeave={props.onLeave}
        />
      )}
    </WorldShell>
  );
}
