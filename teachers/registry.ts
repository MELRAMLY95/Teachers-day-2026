import type { Subject } from "@/lib/types";
import { biologyWorld } from "@/teachers/biologyTeacher";
import { chemistryWorld } from "@/teachers/chemistryTeacher";
import { englishWorld } from "@/teachers/englishTeacher";
import { innerWorld } from "@/teachers/islamiatPsychologyTeacher";
import { mathematicsWorld } from "@/teachers/mathematicsTeacher";
import { physicsWorld } from "@/teachers/physicsTeacher";

export const worldModules: Record<Subject, { subject: Subject; title: string; implemented: boolean }> = {
  chemistry: chemistryWorld,
  physics: physicsWorld,
  mathematics: mathematicsWorld,
  biology: biologyWorld,
  english: englishWorld,
  inner: innerWorld,
};
