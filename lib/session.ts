import type { Teacher } from "@/lib/types";

const KEY = "wwli-session";

export type SessionPhase = "world" | "memory";

export type Session = {
  id: string;
  phase: SessionPhase;
  introSeen: boolean;
};

export function readSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Session;
    if (!parsed?.id || (parsed.phase !== "world" && parsed.phase !== "memory")) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeSession(session: Session) {
  window.sessionStorage.setItem(KEY, JSON.stringify(session));
}

export function clearSession() {
  window.sessionStorage.removeItem(KEY);
}

export function plaque(teacher: Teacher) {
  return `${teacher.honorific.toUpperCase()} ${teacher.name.toUpperCase()}`;
}
