export type Subject =
  | "chemistry"
  | "physics"
  | "mathematics"
  | "biology"
  | "english"
  | "inner";

export type MemoryWeight = "ordinary" | "sentimental" | "major";

export type Memory = {
  id: string;
  title: string;
  lines: string[];
  weight: MemoryWeight;
};

export type DeskNote = {
  id: string;
  label: string;
  line: string;
};

export type StoryBook = {
  id: string;
  title: string;
  pages: string[];
};

export type Teacher = {
  id: string;
  name: string;
  honorific: string;
  /** SHA-256 of the normalised password. The word itself is not stored. */
  passwordHash: string;
  subject: Subject;
  worldTitle: string;
  roomLabel: string;
  discoveriesNeeded: number;
  memories: Memory[];
  notes: DeskNote[];
  books?: StoryBook[];
  /** Lines that play inside the world, before the room. */
  finale: string[];
  /** The last page in the memory room, after the world has earned it. */
  ending: string[];
};
