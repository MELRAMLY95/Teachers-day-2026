import type { DeskNote, Memory } from "../types";

/**
 * Spoken to Miss Kalsoom, in the student's voice.
 * The only edits are the turn from "her" to "you".
 */

export type GardenMemory = {
  id: string;
  label: string;
  lines: string[];
  /** Grade 6 / 7 arrives in its own time. The others are read at once. */
  slow: boolean;
  weight: Memory["weight"];
};

export const garden: GardenMemory[] = [
  {
    id: "words",
    label: "In words",
    weight: "sentimental",
    slow: false,
    lines: [
      "You are genuinely one of my favourite teachers, and I don't think I can properly describe you in words.",
      "However, I can start by saying how comfortable I am around you.",
    ],
  },
  {
    id: "smile",
    label: "Your smile",
    weight: "sentimental",
    slow: false,
    lines: [
      "Whenever I do something, I look to see if you're smiling or not.",
      "Your smile genuinely warms my heart.",
    ],
  },
  {
    id: "smart",
    label: "Incredibly smart",
    weight: "ordinary",
    slow: false,
    lines: ["You're also so incredibly smart, and you know how to teach so well."],
  },
  {
    id: "kind",
    label: "Really kind",
    weight: "sentimental",
    slow: false,
    lines: ["You're also really kind."],
  },
  {
    id: "grade",
    label: "Grade 6 / 7",
    weight: "major",
    slow: true,
    lines: [
      "I still remember when I was in Grade 6 or Grade 7 and I had an issue with a teacher. You were my class teacher at the time.",
      "I was crying a lot, but then you hugged me.",
      "I still remember that day like it was yesterday.",
    ],
  },
  {
    id: "love",
    label: "Immense love",
    weight: "major",
    slow: false,
    lines: ["I have immense love for you, Miss Kalsoom."],
  },
  {
    id: "place",
    label: "My heart",
    weight: "major",
    slow: false,
    lines: ["You hold a very big part of my heart."],
  },
  {
    id: "flip",
    label: "A backflip",
    weight: "ordinary",
    slow: false,
    lines: ["I can't talk about you without feeling my heart doing a backflip."],
  },
];

export const kalsoomLetter: string[] = garden.flatMap((memory) => memory.lines);

export const kalsoomDedication = ["Miss Kalsoom Ashraf", "Happy Teachers' Day ❤️"] as const;

export const kalsoomMemories: Memory[] = garden.map((memory) => ({
  id: memory.id,
  title: memory.label,
  weight: memory.weight,
  lines: memory.lines,
}));

export const kalsoomNotes: DeskNote[] = [
  { id: "words", label: "In words", line: "You are genuinely one of my favourite teachers, and I don't think I can properly describe you in words. I can start by saying how comfortable I am around you." },
  { id: "smile", label: "Your smile", line: "Whenever I do something, I look to see if you're smiling or not. Your smile genuinely warms my heart." },
  { id: "smart", label: "Incredibly smart", line: "You're also so incredibly smart, and you know how to teach so well." },
  { id: "kind", label: "Really kind", line: "You're also really kind." },
  {
    id: "grade",
    label: "Grade 6 / 7",
    line: "I still remember when I was in Grade 6 or Grade 7 and I had an issue with a teacher. You were my class teacher at the time. I was crying a lot, but then you hugged me. I still remember that day like it was yesterday.",
  },
  { id: "love", label: "Immense love", line: "I have immense love for you, Miss Kalsoom." },
  { id: "place", label: "My heart", line: "You hold a very big part of my heart." },
  { id: "flip", label: "A backflip", line: "I can't talk about you without feeling my heart doing a backflip." },
];

export const kalsoomFinale: string[] = kalsoomLetter;

export const kalsoomEnding: string[] = [...kalsoomDedication];

export function kalsoomScript() {
  return [...kalsoomLetter, ...kalsoomNotes.map((note) => note.line), ...kalsoomDedication].join("\n");
}
