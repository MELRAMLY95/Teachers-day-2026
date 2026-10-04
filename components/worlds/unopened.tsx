"use client";

import { plaque } from "@/lib/session";
import { worldTitles } from "@/lib/teachers";
import type { Teacher } from "@/lib/types";

export function UnopenedWorld({ teacher, onLeave }: { teacher: Teacher; onLeave: () => void }) {
  return (
    <main className="unopened">
      <p className="eyebrow">{plaque(teacher)}</p>
      <h1 className="display">{worldTitles[teacher.subject]}</h1>
      <p>Your students are still building this room.</p>
      <button type="button" className="text-leave" onClick={onLeave}>
        Leave
      </button>
    </main>
  );
}
