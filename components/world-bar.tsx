"use client";

import { useSound } from "@/components/sound";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function WorldBar({
  onSignOut,
  tone = "night",
}: {
  onSignOut: () => void;
  tone?: "night" | "day";
}) {
  const sound = useSound();
  const [on, setOn] = useState(sound.enabled);

  return (
    <div className={`world-bar ${tone}`}>
      <Button
        type="button"
        variant="ghost"
        className="bar-button"
        onClick={() => {
          const next = !on;
          setOn(next);
          sound.setEnabled(next);
        }}
      >
        {on ? "Sound on" : "Sound off"}
      </Button>
      <Button type="button" variant="ghost" className="bar-button" onClick={onSignOut}>
        Sign out
      </Button>
    </div>
  );
}
