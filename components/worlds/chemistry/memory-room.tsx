"use client";

import type { Teacher } from "@/lib/types";
import { Classroom } from "../shared/classroom";

export function MemoryRoom({
  teacher,
  onReturn,
  onLeave,
}: {
  teacher: Teacher;
  onReturn: () => void;
  onLeave: () => void;
}) {
  return <Classroom teacher={teacher} onReturn={onReturn} onLeave={onLeave} returnLabel="Back to the laboratory" />;
}
