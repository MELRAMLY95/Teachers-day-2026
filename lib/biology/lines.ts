import type { DeskNote, Memory } from "../types";

/**
 * Miss Kalsoom's words, kept as she was described.
 * Spacing and a comma are the only edits.
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
      "I do not think I can describe her in words.",
      "However, I can start by saying how comfortable I am around her.",
    ],
  },
  {
    id: "smile",
    label: "Her smile",
    weight: "sentimental",
    slow: false,
    lines: [
      "Whenever I do something, I look to see if she is smiling or not.",
      "Her smile warms my heart.",
    ],
  },
  {
    id: "smart",
    label: "Incredibly smart",
    weight: "ordinary",
    slow: false,
    lines: ["She is also so incredibly smart and she knows how to teach pretty well."],
  },
  {
    id: "kind",
    label: "Really kind",
    weight: "sentimental",
    slow: false,
    lines: ["She is also really kind."],
  },
  {
    id: "grade",
    label: "Grade 6 / 7",
    weight: "major",
    slow: true,
    lines: [
      "I still remember in Grade 6 or Grade 7, I had an issue with a teacher and Miss Kalsoom was my class teacher at the time.",
      "I was crying a lot, but then she hugged me.",
      "I still remember that day like yesterday.",
    ],
  },
  {
    id: "love",
    label: "Immense love",
    weight: "major",
    slow: false,
    lines: ["I have immense love for Miss Kalsoom."],
  },
  {
    id: "place",
    label: "My heart",
    weight: "major",
    slow: false,
    lines: ["She holds a very big part of my heart."],
  },
  {
    id: "flip",
    label: "A backflip",
    weight: "ordinary",
    slow: false,
    lines: ["I can't talk about her without feeling my heart doing a backflip."],
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
  { id: "words", label: "In words", line: "I do not think I can describe her in words. I can start by saying how comfortable I am around her." },
  { id: "smile", label: "Her smile", line: "Whenever I do something, I look to see if she is smiling or not. Her smile warms my heart." },
  { id: "smart", label: "Incredibly smart", line: "She is also so incredibly smart and she knows how to teach pretty well." },
  { id: "kind", label: "Really kind", line: "She is also really kind." },
  {
    id: "grade",
    label: "Grade 6 / 7",
    line: "I still remember in Grade 6 or Grade 7, I had an issue with a teacher and Miss Kalsoom was my class teacher at the time. I was crying a lot, but then she hugged me. I still remember that day like yesterday.",
  },
  { id: "love", label: "Immense love", line: "I have immense love for Miss Kalsoom." },
  { id: "place", label: "My heart", line: "She holds a very big part of my heart." },
  { id: "flip", label: "A backflip", line: "I can't talk about her without feeling my heart doing a backflip." },
];

export const kalsoomFinale: string[] = kalsoomLetter;

export const kalsoomEnding: string[] = [...kalsoomDedication];

export function kalsoomScript() {
  return [...kalsoomLetter, ...kalsoomNotes.map((note) => note.line), ...kalsoomDedication].join("\n");
}
