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
    id: "kill",
    label: "The line",
    lines: [
      "And of course, I could never forget your iconic 'I will kill you.'",
      "I hear it and I feel looked after, not told off.",
    ],
  },
  {
    id: "stare",
    label: "The stare",
    lines: [
      "That stare.",
      "You know EXACTLY the one I'm talking about.",
      "It lands on me, and I am smiling before I even know why.",
    ],
    freeze: true,
    slow: true,
  },
  {
    id: "online",
    label: "Online",
    lines: [
      "You're somehow always online whenever I text you, and I'm still trying to figure out how.",
      "On the heavy days, that small reply feels like company.",
    ],
  },
  {
    id: "sweet",
    label: "Sweet",
    lines: [
      "You're extremely sweet, in the way that stays with me after I leave.",
      "You're friendly. You're fun to talk to. I keep the warmth of it.",
    ],
  },
  {
    id: "time",
    label: "Time",
    lines: ["I enjoy spending time with you.", "Not only when there's a question. The ordinary minutes matter to me too."],
  },
  {
    id: "maths",
    label: "Maths",
    lines: [
      "You're one of the main reasons I love mathematics.",
      "When I open a problem, you are already in it with me.",
    ],
  },
  {
    id: "motive",
    label: "Motivation",
    lines: [
      "You motivate me to work hard. You give me that.",
      "I would never want to be the reason you need motivation.",
    ],
  },
  {
    id: "obgyn",
    label: "OB/GYN",
    lines: [
      "You're one of the reasons I know I want to become an OB/GYN.",
      "You made that future feel gentle enough to want.",
    ],
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
