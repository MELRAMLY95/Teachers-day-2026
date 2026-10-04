export type TributeMemory = {
  id: string;
  label: string;
  lines: string[];
  /** The deepest memory arrives in its own time. */
  slow?: boolean;
  /** The room holds still while this one is open. */
  freeze?: boolean;
};

export type TributeSet = {
  id: string;
  memories: TributeMemory[];
};

const irum: TributeMemory[] = [
  {
    id: "jokes",
    label: "Your jokes",
    lines: ["You make the sweetest and silliest jokes."],
  },
  {
    id: "lovely",
    label: "Lovely",
    lines: ["You are one of the loveliest, sweetest and most hardworking teachers I have ever had."],
  },
  {
    id: "hour",
    label: "The hour",
    lines: ["You always reply no matter the hour."],
  },
  {
    id: "help",
    label: "Helpful",
    lines: ["You are so helpful."],
  },
  {
    id: "lessons",
    label: "The lesson",
    lines: ["You would offer online lessons without us even asking, just so you could help us."],
  },
  {
    id: "connect",
    label: "With us",
    lines: ["You connect with students on such a sentimental level."],
  },
  {
    id: "sun",
    label: "The sun",
    lines: ["Overall, you are like the sun in my life."],
  },
];

const hadia: TributeMemory[] = [
  {
    id: "joke",
    label: "Joking",
    lines: ["Overall, you're such a sweet teacher and you're genuinely so fun to joke with."],
  },
  {
    id: "hard",
    label: "Hard work",
    lines: ["You are one of the most hardworking teachers I have ever met."],
  },
  {
    id: "all",
    label: "Your all",
    lines: ["You put your all into whatever you do, and that makes me appreciate you even more."],
  },
  {
    id: "try",
    label: "Physics",
    lines: [
      "Even though physics isn't really my subject, you make me want to work harder at it because you always praise us and somehow make us feel like we're the best.",
    ],
  },
];

const noshen: TributeMemory[] = [
  {
    id: "amazing",
    label: "Amazing",
    lines: ["You are one of the most amazing teachers ever."],
  },
  {
    id: "obgyn",
    label: "OB/GYN",
    lines: ["You are the reason I will become an OB/GYN."],
  },
  {
    id: "math",
    label: "Math",
    lines: ["You are also the main reason I love math so much."],
  },
  {
    id: "motive",
    label: "Motivation",
    lines: ["You motivate me to work hard.", "I would never want to motivate you."],
  },
  {
    id: "sweet",
    label: "Sweet",
    lines: ["You are very sweet."],
  },
  {
    id: "stare",
    label: "The stare",
    lines: ["Your stare at students is hilarious."],
    freeze: true,
  },
  {
    id: "talk",
    label: "Talking",
    lines: ["You are very friendly and fun to talk to.", "I enjoy spending time with you a lot."],
  },
  {
    id: "online",
    label: "Online",
    lines: ["You're always online whenever I text.", "I'm still trying to figure out how you're online most of the time."],
  },
];

const naila: TributeMemory[] = [
  {
    id: "notebooks",
    label: "Notebooks",
    lines: [
      "I show you how good my other notebooks look.",
      "You get jealous.",
      "Why doesn't the English one look like that?",
    ],
  },
  {
    id: "english",
    label: "English",
    lines: [
      "English is probably my least favourite subject.",
      "You helped me see the good in English.",
      "I started enjoying English more because of you.",
    ],
  },
  {
    id: "talk",
    label: "Talking",
    lines: ["I really enjoy talking to you.", "Talking to you feels like talking to a friend."],
  },
  {
    id: "listen",
    label: "You listen",
    lines: ["You listen.", "You relate.", "Your ability to listen and relate is one of the qualities I admire most."],
  },
  {
    id: "closer",
    label: "Closer",
    lines: ["You aren't just a teacher to me.", "You're much closer to me than that."],
  },
  {
    id: "anything",
    label: "Anything",
    lines: ["You're someone I can talk to about almost anything without feeling like I'm going to be judged."],
  },
  {
    id: "heard",
    label: "Heard",
    lines: ["You made me feel heard."],
  },
  {
    id: "safe",
    label: "Safe",
    lines: ["You've become a safe place for me."],
  },
];

const maryam: TributeMemory[] = [
  {
    id: "sweet",
    label: "Sweet",
    lines: ["You're also really sweet."],
  },
  {
    id: "hard",
    label: "Hard work",
    lines: ["You are genuinely one of the most hardworking teachers I've ever met."],
  },
  {
    id: "know",
    label: "The lesson",
    lines: ["You make Islamiat lessons fun, and you're so knowledgeable."],
  },
  {
    id: "duties",
    label: "Duties",
    lines: ["Even though you have so many duties, you still manage to take care of our needs."],
  },
  {
    id: "trip",
    label: "The trip",
    slow: true,
    lines: [
      "One thing I can never forget is how much you planned for us to go on that trip.",
      "In the end, you couldn't go because you had a ton of work.",
      "But I still remember how much effort you put into planning it for us.",
    ],
  },
];

export const tributeSets: Record<string, TributeMemory[]> = {
  irum,
  hadia,
  noshen,
  naila,
  maryam,
};

export function letterFor(id: string) {
  const seen = new Set<string>();
  const lines: string[] = [];
  for (const memory of tributeSets[id] ?? []) {
    for (const line of memory.lines) {
      if (seen.has(line)) continue;
      seen.add(line);
      lines.push(line);
    }
  }
  return lines;
}
