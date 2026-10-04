"use client";

import { useSound } from "@/components/sound";
import { useEffect, useState } from "react";

export function Entrance({
  name,
  reducedMotion,
  onDone,
}: {
  name: string;
  reducedMotion: boolean;
  onDone: () => void;
}) {
  const sound = useSound();
  const [beat, setBeat] = useState(reducedMotion ? 3 : 0);

  useEffect(() => {
    if (reducedMotion) return;
    const timers = [
      window.setTimeout(() => setBeat(1), 600),
      window.setTimeout(() => {
        sound.ignite();
        setBeat(2);
      }, 1600),
      window.setTimeout(() => setBeat(3), 2800),
      window.setTimeout(onDone, 4600),
    ];
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [onDone, reducedMotion, sound]);

  return (
    <main className="chem-enter" onClick={reducedMotion ? undefined : onDone}>
      <div className={`chem-flame${beat >= 1 ? " is-lit" : ""}`} aria-hidden="true" />
      <div className="chem-enter-copy">
        <h1 className={beat >= 2 ? "is-in" : ""}>{name}</h1>
      </div>
      {reducedMotion ? (
        <button type="button" className="text-leave" onClick={onDone}>
          Enter the laboratory
        </button>
      ) : (
        <p className="chem-skip">Click to skip</p>
      )}
    </main>
  );
}
