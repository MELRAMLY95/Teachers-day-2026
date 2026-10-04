"use client";

import { Soundscape } from "@/lib/audio";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const SoundContext = createContext<Soundscape | null>(null);

export function SoundProvider({ children }: { children: ReactNode }) {
  const [sound] = useState(() => new Soundscape());

  useEffect(() => {
    return () => sound.dispose();
  }, [sound]);

  return <SoundContext.Provider value={sound}>{children}</SoundContext.Provider>;
}

export function useSound() {
  const sound = useContext(SoundContext);
  if (!sound) {
    throw new Error("Sound is only available inside the experience.");
  }
  return sound;
}
