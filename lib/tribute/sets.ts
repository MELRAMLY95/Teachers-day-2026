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
    lines: [
      "You make sweet, silly jokes.",
      "In the middle of something serious.",
      "I remember the joke longer than the practical.",
    ],
  },
  {
    id: "sweet",
    label: "Sweet",
    lines: ["You're incredibly sweet.", "I notice it in small things. Not in speeches."],
  },
  {
    id: "hour",
    label: "The hour",
    lines: [
      "You always reply, no matter the hour.",
      "9 at night. Half past 11. 1. 3.",
      "I still don't know how you're online then.",
    ],
  },
  {
    id: "help",
    label: "Help",
    lines: ["You're exceptionally helpful.", "I've needed the same thing again.", "You still help."],
  },
  {
    id: "work",
    label: "The work",
    lines: ["You're extremely hardworking.", "The work is just there. A lot of it.", "I see that."],
  },
  {
    id: "lessons",
    label: "The lesson",
    lines: ["You would sometimes offer online lessons without us even asking, just because you wanted to help us."],
  },
  {
    id: "connect",
    label: "With us",
    lines: ["You connect with us.", "Not only the chemistry.", "On a personal level. I feel that."],
  },
  {
    id: "sun",
    label: "The sun",
    lines: ["You feel like the sun in my life."],
  },
];

const hadia: TributeMemory[] = [
  {
    id: "joke",
    label: "Joking",
    lines: ["You're fun to joke with.", "Class doesn't feel heavy the whole time. You let it be funny."],
  },
  {
    id: "sweet",
    label: "Sweet",
    lines: ["You're very sweet.", "The praise feels real."],
  },
  {
    id: "all",
    label: "Your all",
    lines: ["You put your all into whatever you do."],
  },
  {
    id: "praise",
    label: "Praise",
    lines: ["You constantly praise us.", "You somehow make us feel like we're the best."],
  },
  {
    id: "hard",
    label: "Hard work",
    lines: ["You're one of the hardest-working teachers I've met.", "I appreciate you even more because of how hard you work."],
  },
  {
    id: "capable",
    label: "Capable",
    lines: ["You make me feel capable. In physics. That's the surprising part.", "You make the hard work feel worth it."],
  },
  {
    id: "remember",
    label: "Remember",
    lines: ["That's something I will remember."],
  },
  {
    id: "try",
    label: "Physics",
    lines: ["Physics isn't naturally my subject.", "You make me want to work hard at it anyway."],
  },
];

const noshen: TributeMemory[] = [
  {
    id: "kill",
    label: "The line",
    lines: ["And of course, I could never forget your iconic 'I will kill you.'"],
  },
  {
    id: "stare",
    label: "The stare",
    lines: ["Yep.", "That stare."],
    freeze: true,
  },
  {
    id: "online",
    label: "Online",
    lines: ["You're somehow always online whenever I text you, and I'm still trying to figure out how."],
  },
  {
    id: "sweet",
    label: "Sweet",
    lines: ["You're extremely sweet.", "You're friendly. You're fun to talk to."],
  },
  {
    id: "time",
    label: "Time",
    lines: ["I enjoy spending time with you.", "Not only when there's a question."],
  },
  {
    id: "maths",
    label: "Maths",
    lines: ["You're one of the main reasons I love mathematics.", "The subject and you are tied together for me."],
  },
  {
    id: "motive",
    label: "Motivation",
    lines: ["You motivate me to work hard.", "I would never want to be the reason you need motivation."],
  },
  {
    id: "obgyn",
    label: "OB/GYN",
    lines: ["You're one of the reasons I know I want to become an OB/GYN."],
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
    id: "hard",
    label: "Hard work",
    lines: ["You're genuinely one of the hardest-working teachers I've ever met."],
  },
  {
    id: "fun",
    label: "The lesson",
    lines: ["You make Islamiat lessons fun.", "I look forward to them. That's not automatic."],
  },
  {
    id: "know",
    label: "Knowledge",
    lines: [
      "You're extremely knowledgeable.",
      "A hadith in Bukhari and Muslim says actions are only by intentions, and a person gets only what they intended.",
      "You teach that properly, and the lesson is still enjoyable.",
    ],
  },
  {
    id: "duties",
    label: "Duties",
    lines: ["You have so many duties.", "So many responsibilities. I can see the load.", "You still take care of our needs."],
  },
  {
    id: "sweet",
    label: "Sweet",
    lines: ["You're very sweet.", "On top of the work. Not instead of it."],
  },
  {
    id: "plan",
    label: "The plan",
    lines: ["I still remember how much you planned for us to go on that trip.", "You wrote the order of it. The days. The lot."],
  },
  {
    id: "route",
    label: "The route",
    lines: ["You worked out the route.", "You thought about what we would actually do there."],
  },
  {
    id: "trip",
    label: "The trip",
    slow: true,
    lines: [
      "I still remember how much you planned for us to go on that trip.",
      "In the end, you couldn't go because you had so much work to deal with.",
      "You still put so much effort into making the trip happen. That meant a lot.",
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
