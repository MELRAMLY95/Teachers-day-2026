"use client";

import { plaque } from "@/lib/session";
import type { Teacher } from "@/lib/types";

export function UnopenedWorld({ teacher, onLeave }: { teacher: Teacher; onLeave: () => void }) {
  return (
    <main className="unopened">
      <p className="eyebrow">{plaque(teacher)}</p>
      <h1 className="display">{teacher.worldTitle}</h1>
      <p>This room is not open yet.</p>
      <button type="button" className="text-leave" onClick={onLeave}>
        Leave
      </button>
    </main>
  );
}
