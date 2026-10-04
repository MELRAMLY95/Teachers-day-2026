"use client";

import { useEffect, useState } from "react";

export function Arrival({
  kicker,
  name,
  line,
  tone,
  enter,
  reducedMotion,
  onDone,
}: {
  kicker: string;
  name: string;
  line: string;
  tone: string;
  enter: string;
  reducedMotion: boolean;
  onDone: () => void;
}) {
  const [beat, setBeat] = useState(reducedMotion ? 3 : 0);

  useEffect(() => {
    if (reducedMotion) return;
    const timers = [
      window.setTimeout(() => setBeat(1), 500),
      window.setTimeout(() => setBeat(2), 1400),
      window.setTimeout(() => setBeat(3), 2400),
      window.setTimeout(onDone, 4200),
    ];
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [onDone, reducedMotion]);

  return (
    <main className={`chem-enter tone-${tone}`} onClick={reducedMotion ? undefined : onDone}>
      <div className={`chem-flame${beat >= 1 ? " is-lit" : ""}`} aria-hidden="true" />
      <div className="chem-enter-copy">
        <p className={beat >= 1 ? "is-in" : ""}>{kicker}</p>
        <h1 className={beat >= 2 ? "is-in" : ""}>{name}</h1>
        <p className={beat >= 3 ? "is-in" : ""}>{line}</p>
      </div>
      {reducedMotion ? (
        <button type="button" className="text-leave" onClick={onDone}>
          {enter}
        </button>
      ) : (
        <p className="chem-skip">Click to skip</p>
      )}
    </main>
  );
}
