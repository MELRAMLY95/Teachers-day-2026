"use client";

import type { Teacher } from "@/lib/types";
import { WorldShell } from "../shared/world";
import { ImpossibleRoom } from "./room";

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
      kicker="The impossible room"
      line="The geometry is listening."
      tone="math"
      enter="Enter the room"
      returnLabel="Back to the room"
    >
      {(covered) => (
        <ImpossibleRoom
          teacher={props.teacher}
          covered={covered}
          onEnterMemory={props.onEnterMemory}
          onLeave={props.onLeave}
        />
      )}
    </WorldShell>
  );
}
