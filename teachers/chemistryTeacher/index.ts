import type { Discovery } from "@/lib/types";

export const chemistryWorld = {
  subject: "chemistry" as const,
  title: "The Reaction",
  implemented: true,
};

export const chemistryDiscoveries: Discovery[] = [
  {
    id: "notebook",
    title: "Lab book, page 14",
    body: "Mateo was sure the precipitate would be green. We spent fifteen minutes on it. You did not settle the argument for us. You let the glass settle it.",
  },
  {
    id: "drawer",
    title: "Under the spare goggles",
    body: "Jonah forgot his goggles. You handed him yours and took the spare from this drawer, as if looking after someone was just part of the practical.",
  },
  {
    id: "report",
    title: "Hana's observation",
    body: "The colour was wrong. You called it data, not a mistake, and asked her to write down exactly what she saw. She still does.",
  },
  {
    id: "board",
    title: "Left in the margin",
    body: "You wrote the equation, then waited. Safa said the waiting was the lesson. We did not understand that until later.",
  },
];

export const chemistryEnding = [
  "You let us run the test again.",
  "A colour, you said, is a sentence. We started reading them.",
  "Mateo argued for green. The glass answered, and you let it.",
  "Jonah still remembers whose goggles he was wearing.",
  "You wrote the equation, then waited. The waiting was the lesson.",
  "It is Teachers' Day. This is the reaction we kept.",
  "Dr. Amira Hassan, this laboratory was the long way back to your classroom.",
];
