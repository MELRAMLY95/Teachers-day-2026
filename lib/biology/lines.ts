import type { DeskNote, Memory } from "../types";

/** The on-screen mark in the grade 6 / 7 darkness. Not a caption under a picture. */
export const GRADE_MARK = "GRADE 6 / 7";

export const kalsoomMemories: Memory[] = [
  {
    id: "smile",
    title: "The look",
    weight: "sentimental",
    lines: [
      "Whenever I do something, I still find myself looking over to see if you're smiling.",
      "I don't know if you realise how much your smile means to me.",
      "It genuinely warms my heart.",
    ],
  },
  {
    id: "warm",
    title: "Lighter",
    weight: "sentimental",
    lines: [
      "Your smile has this strange ability to make everything feel a little lighter.",
      "It genuinely warms my heart.",
    ],
  },
  {
    id: "smart",
    title: "Understandable",
    weight: "ordinary",
    lines: [
      "You're one of those people who somehow makes complicated things feel understandable.",
      "You're incredibly smart, but what I appreciate even more is how well you know how to teach.",
    ],
  },
  {
    id: "teach",
    title: "Both",
    weight: "ordinary",
    lines: [
      "Being smart is one thing.",
      "Knowing how to make someone else understand is another.",
      "You're really good at both.",
    ],
  },
  {
    id: "kind",
    title: "Kind",
    weight: "sentimental",
    lines: [
      "You're incredibly kind.",
      "And I think that's one of the reasons I've always felt so comfortable around you.",
    ],
  },
  {
    id: "comfort",
    title: "Comfortable",
    weight: "sentimental",
    lines: [
      "I don't think I've ever properly told you this...",
      "I feel incredibly comfortable around you.",
      "There's something about being around you that makes it easy to just be myself.",
    ],
  },
  {
    id: "again",
    title: "Even now",
    weight: "sentimental",
    lines: [
      "Even now, whenever I do something, I still find myself looking to see whether you're smiling.",
      "I think that says more than I know how to explain.",
    ],
  },
  {
    id: "class",
    title: "Class teacher",
    weight: "sentimental",
    lines: [
      "You weren't just my biology teacher then.",
      "You were my class teacher.",
      "And when I needed someone, you were there.",
    ],
  },
  {
    id: "grade",
    title: "Grade 6 / 7",
    weight: "major",
    lines: [
      "There was a time when I was really struggling.",
      "I had an issue with another teacher.",
      "I was crying a lot.",
      "You were my class teacher.",
      "And you hugged me.",
      "It might have been a small moment to you.",
      "But it wasn't small to me.",
      "I still remember it like yesterday.",
    ],
  },
  {
    id: "held",
    title: "Since then",
    weight: "major",
    lines: [
      "I don't think you knew how much that moment would stay with me.",
      "But it did.",
      "And I've carried that feeling with me ever since.",
    ],
  },
  {
    id: "love",
    title: "Part of me",
    weight: "major",
    lines: [
      "You're one of my favourite teachers.",
      "There are some teachers you remember because they taught you something.",
      "And then there are teachers who become part of you in ways you don't really know how to explain.",
      "You're one of those teachers for me.",
    ],
  },
  {
    id: "heart",
    title: "The heart",
    weight: "major",
    lines: [
      "I have immense love for you, Miss Kalsoom.",
      "You hold a very big part of my heart.",
    ],
  },
  {
    id: "backflip",
    title: "Backflip",
    weight: "ordinary",
    lines: ["Honestly, talking about you makes my heart do a backflip."],
  },
];

export const kalsoomNotes: DeskNote[] = [
  {
    id: "smile",
    label: "After I speak",
    line: "Whenever I do something, I look over to see if you're smiling.",
  },
  {
    id: "warm",
    label: "The smile",
    line: "Your smile makes things feel lighter. It genuinely warms my heart.",
  },
  {
    id: "teach",
    label: "Both",
    line: "Being smart is one thing. Knowing how to make someone else understand is another. You're really good at both.",
  },
  {
    id: "kind",
    label: "Kind",
    line: "You're incredibly kind. That's one of the reasons I've always felt so comfortable around you.",
  },
  {
    id: "comfort",
    label: "Around you",
    line: "I feel incredibly comfortable around you. It makes it easy to just be myself.",
  },
  {
    id: "grade",
    label: "Grade 6 / 7",
    line: "Grade 6. Grade 7. I had an issue with another teacher. I was crying a lot. You were my class teacher. You hugged me. I still remember it like yesterday.",
  },
  {
    id: "heart",
    label: "The heart",
    line: "I have immense love for you. You hold a very big part of my heart.",
  },
  {
    id: "words",
    label: "Words",
    line: "You are difficult for me to describe. You're one of my favourite teachers.",
  },
];

export const kalsoomFinale: string[] = [
  "You are difficult for me to describe, because your importance to me isn't based on one lesson or one quality.",
  "It's the accumulation of hundreds of tiny things.",
  "Your smile.",
  "Your kindness.",
  "The way I feel comfortable around you.",
  "The way you taught.",
  "The way you were there when I was younger and struggling.",
  "That hug.",
  "All of it stayed.",
  "I don't think I can properly explain how much love and gratitude I have for you.",
  "You hold a very big part of my heart.",
  "Happy Teachers' Day, Miss Kalsoom.",
];

export const kalsoomEnding: string[] = [
  "Miss Kalsoom.",
  "You hold a very big part of my heart.",
  "Happy Teachers' Day.",
];

export function kalsoomScript() {
  const lines = [
    GRADE_MARK,
    ...kalsoomMemories.flatMap((memory) => memory.lines),
    ...kalsoomNotes.map((note) => `${note.label} ${note.line}`),
    ...kalsoomFinale,
    ...kalsoomEnding,
  ];
  return lines.join("\n");
}
