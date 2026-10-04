"use client";

import type { Teacher } from "@/lib/types";
import { WorldShell } from "../shared/world";
import { Library } from "./library";

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
      kicker="The library of stories"
      line="The lamps are already on."
      tone="english"
      enter="Enter the library"
      returnLabel="Back to the library"
    >
      {(covered) => (
        <Library
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
