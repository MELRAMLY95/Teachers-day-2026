"use client";

import { useSound } from "@/components/sound";
import { useState } from "react";

export function SoundToggle() {
  const sound = useSound();
  const [on, setOn] = useState(sound.enabled);

  return (
    <button
      type="button"
      className="sound-toggle"
      onClick={() => {
        const next = !on;
        sound.setEnabled(next);
        setOn(next);
        if (next) void sound.unlock();
      }}
    >
      {on ? "Sound on" : "Sound off"}
    </button>
  );
}
