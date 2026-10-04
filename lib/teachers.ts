import { kalsoomEnding, kalsoomFinale, kalsoomMemories, kalsoomNotes } from "@/lib/biology/lines";
import { digestPassword, normalisePassword } from "@/lib/engine/auth";
import type { Teacher } from "@/lib/types";

/**
 * A public static site cannot keep a password secret from someone who reads
 * the built files. These are hashes, and each world is loaded only after the
 * hash matches, so one teacher does not walk into another's room.
 * Do not put phone numbers, addresses, or anything private in the lines.
 * The lines are the student's. They are not invented incidents.
 */
export const teachers: Teacher[] = [
  {
    id: "irum",
    name: "Irum Shahid",
    honorific: "Miss",
    passwordHash: "921a95e8b614f668981d9eee4d24a3ffdb6821162246bb8036f73f4fd7d20564",
    subject: "chemistry",
    worldTitle: "The laboratory",
    roomLabel: "The light stayed on.",
    discoveriesNeeded: 3,
    memories: [
      {
        id: "mug",
        title: "Sweet",
        weight: "ordinary",
        lines: ["You're incredibly sweet.", "I notice it in small things. Not in speeches."],
      },
      {
        id: "drawer",
        title: "The joke",
        weight: "ordinary",
        lines: [
          "You make sweet, silly jokes.",
          "In the middle of something serious.",
          "I remember the joke longer than the practical.",
        ],
      },
      {
        id: "goggles",
        title: "Again",
        weight: "ordinary",
        lines: ["Another one.", "You tell it like it's nothing, and then the whole bench is laughing.", "I like that you do that."],
      },
      {
        id: "margin",
        title: "Help",
        weight: "sentimental",
        lines: ["You're exceptionally helpful.", "I've needed the same thing again.", "You still help."],
      },
      {
        id: "notebook",
        title: "Before I ask",
        weight: "sentimental",
        lines: ["Sometimes you offer the help before I've asked.", "Before I've even decided I'm stuck."],
      },
      {
        id: "papers",
        title: "The pile",
        weight: "ordinary",
        lines: ["You're extremely hardworking.", "The work is just there. A lot of it.", "I see that."],
      },
      {
        id: "report",
        title: "Both",
        weight: "ordinary",
        lines: ["The practical and the marking.", "You put time into both.", "That's the hardworking bit I actually watch."],
      },
      {
        id: "monitor",
        title: "The screen",
        weight: "ordinary",
        lines: [
          "You always reply, no matter the hour.",
          "9 at night. Half past 11. 1. 3.",
          "I still don't know how you're online then.",
        ],
      },
      {
        id: "phone",
        title: "The phone",
        weight: "ordinary",
        lines: ["Different night. I checked my phone.", "Same hours.", "Still online."],
      },
      {
        id: "window",
        title: "The other lesson",
        weight: "major",
        lines: [
          "You would sometimes offer online lessons without us even asking, just because you wanted to help us.",
        ],
      },
      {
        id: "coat",
        title: "Lovely",
        weight: "sentimental",
        lines: ["You're one of the loveliest teachers I've ever had.", "I don't have a clever way to say that."],
      },
      {
        id: "folder",
        title: "Us",
        weight: "sentimental",
        lines: ["You connect with us.", "Not only the chemistry.", "On a personal level. I feel that."],
      },
      {
        id: "flower",
        title: "Sunlight",
        weight: "major",
        lines: ["You feel like the sun in my life.", "The room gets brighter the more I remember. That's on purpose."],
      },
      {
        id: "apron",
        title: "Sweet, again",
        weight: "ordinary",
        lines: ["You're sweet about things that aren't even the lesson.", "I notice."],
      },
    ],
    notes: [
      { id: "sweet", label: "Sweet", line: "Incredibly sweet. Small things, not speeches." },
      { id: "joke", label: "The joke", line: "Silly, in the middle of a practical. I kept the joke." },
      { id: "help", label: "Help", line: "Exceptionally helpful. Even when I ask again." },
      { id: "work", label: "The pile", line: "Extremely hardworking. I can see the work." },
      { id: "hour", label: "The hour", line: "9. Half 11. 1. 3. Still online." },
      { id: "class", label: "The offer", line: "You would sometimes offer online lessons without us even asking, just because you wanted to help us." },
      { id: "lovely", label: "Lovely", line: "One of the loveliest teachers I've ever had." },
      { id: "sun", label: "Sun", line: "You feel like the sun in my life." },
    ],
    finale: [
      "Some teachers teach chemistry.",
      "You're sweet, and you work incredibly hard, and you help before we ask.",
      "You always reply, no matter the hour.",
      "You feel like the sun in my life.",
      "Thank you, Miss Irum.",
    ],
    ending: [
      "Miss Irum.",
      "You are one of the loveliest teachers I have ever had.",
      "You feel like the sun in my life.",
      "Happy Teachers' Day.",
    ],
  },
  {
    id: "hadia",
    name: "Hadia Johar",
    honorific: "Miss",
    passwordHash: "32500d7500ce0755c1a0f96ef86b10c3100f70f9ca6d8f4d3673d2925afc2151",
    subject: "physics",
    worldTitle: "The observatory",
    roomLabel: "You are still in motion.",
    discoveriesNeeded: 4,
    memories: [
      {
        id: "try",
        title: "The try",
        weight: "sentimental",
        lines: ["Physics isn't naturally my subject.", "You make me want to work hard at it anyway."],
      },
    ],
    notes: [
      { id: "subject", label: "Not my subject", line: "Physics isn't naturally my subject. I'm saying that first." },
      { id: "want", label: "I try", line: "You make me motivated to work hard in it. That's the part that surprises me." },
      { id: "praise", label: "Praise", line: "You constantly praise us." },
      { id: "best", label: "The best", line: "You somehow make us feel like we're the best." },
      { id: "sweet", label: "Sweet", line: "You're very sweet. The praise feels real." },
      { id: "joke", label: "The joke", line: "You're fun to joke with." },
      { id: "joke2", label: "Lighter", line: "Class doesn't feel heavy the whole time. You let it be funny." },
      { id: "hard", label: "Hardworking", line: "You're one of the hardest-working teachers I've met." },
      { id: "all", label: "All of it", line: "You put your all into whatever you do." },
      { id: "see", label: "I see it", line: "I appreciate you even more because of how hard you work." },
      { id: "worth", label: "Worth it", line: "You make the hard work feel worth it." },
      { id: "capable", label: "Capable", line: "You make me feel capable. In physics. That's the surprising part." },
      { id: "remember", label: "Remember", line: "That's something I will remember." },
      { id: "again", label: "Again", line: "I still don't naturally love physics. I try because of you." },
    ],
    finale: [
      "Physics isn't naturally my subject.",
      "You make me want to try.",
      "You put your all into it, and you praise us until we feel capable.",
      "You make the hard work feel worth it.",
      "That's something I will remember.",
      "Thank you, Miss Hadia.",
    ],
    ending: [
      "Miss Hadia.",
      "I don't naturally love physics.",
      "You make me want to work hard at it anyway.",
      "Happy Teachers' Day.",
    ],
  },
  {
    id: "noshen",
    name: "Noshen",
    honorific: "Miss",
    passwordHash: "ebb3de8a3d9a40366132eb5deb5af44e4c96c11696f8fc34ea2c1d8bd8399171",
    subject: "mathematics",
    worldTitle: "The impossible room",
    roomLabel: "The proof was the future.",
    discoveriesNeeded: 4,
    memories: [
      {
        id: "sweet",
        title: "Sweet",
        weight: "ordinary",
        lines: ["You're extremely sweet.", "That's just true. I'm not building up to a speech."],
      },
      {
        id: "talk",
        title: "Talking",
        weight: "ordinary",
        lines: ["You're friendly.", "You're fun to talk to.", "I enjoy that."],
      },
      {
        id: "company",
        title: "Time",
        weight: "ordinary",
        lines: ["I enjoy spending time with you.", "Not only when there's a question."],
      },
      {
        id: "love",
        title: "Why I love it",
        weight: "sentimental",
        lines: ["You're one of the main reasons I love mathematics.", "The subject and you are tied together for me."],
      },
      {
        id: "work",
        title: "Work",
        weight: "sentimental",
        lines: ["You motivate me to work hard.", "I actually do the work because of that."],
      },
      {
        id: "amazing",
        title: "Amazing",
        weight: "sentimental",
        lines: ["You're one of the most amazing teachers I've ever had."],
      },
      {
        id: "kill",
        title: "The line",
        weight: "ordinary",
        lines: ["And of course, I could never forget your iconic 'I will kill you.'"],
      },
      {
        id: "stare",
        title: "The stare",
        weight: "ordinary",
        lines: ["Yep.", "That stare."],
      },
      {
        id: "online",
        title: "Online",
        weight: "ordinary",
        lines: ["You're somehow always online whenever I text you, and I'm still trying to figure out how."],
      },
      {
        id: "bridge",
        title: "Mathematics",
        weight: "ordinary",
        lines: ["Mathematics.", "You want the working. I stopped hiding the messy bit."],
      },
      {
        id: "sequence",
        title: "You",
        weight: "sentimental",
        lines: ["Miss Noshen.", "The motivation started with you teaching it."],
      },
      {
        id: "turn",
        title: "Ambition",
        weight: "major",
        lines: ["Then the ambition.", "Then the future I actually say out loud."],
      },
      {
        id: "maths",
        title: "The subject",
        weight: "ordinary",
        lines: ["It starts with mathematics.", "That's the first link."],
      },
      {
        id: "you",
        title: "You",
        weight: "sentimental",
        lines: ["Then it's you.", "Not a general 'teachers'. You."],
      },
      {
        id: "motive",
        title: "Motivation",
        weight: "sentimental",
        lines: ["You motivate me.", "The working gets done because of that."],
      },
      {
        id: "ambition",
        title: "Ambition",
        weight: "major",
        lines: ["The ambition came with it.", "I want more than the next exercise."],
      },
      {
        id: "future",
        title: "Future",
        weight: "major",
        lines: ["So there's a future in it.", "I can see the shape of it now."],
      },
      {
        id: "obgyn",
        title: "OB/GYN",
        weight: "major",
        lines: [
          "Mathematics, then you, then the motivation, then that ambition.",
          "You're one of the reasons I know I want to become an OB/GYN.",
        ],
      },
    ],
    notes: [
      { id: "kill", label: "The line", line: "And of course, I could never forget your iconic 'I will kill you.'" },
      { id: "stare", label: "The stare", line: "Yep. That stare." },
      { id: "online", label: "Online", line: "You're somehow always online whenever I text you, and I'm still trying to figure out how." },
      { id: "love", label: "Maths", line: "You're one of the main reasons I love mathematics." },
      { id: "future", label: "OB/GYN", line: "You're one of the reasons I know I want to become an OB/GYN." },
      { id: "never", label: "For you", line: "I would never want to be the reason you need motivation." },
      { id: "sweet", label: "Sweet", line: "Extremely sweet. And fun to talk to." },
      { id: "time", label: "Time", line: "I enjoy spending time with you." },
    ],
    finale: [
      "Miss Noshen.",
      "Mathematics. Then you. Then the work. Then the future.",
      "You're one of the reasons I know I want to become an OB/GYN.",
      "I would never want to be the reason you need motivation.",
      "Thank you.",
    ],
    ending: [
      "Miss Noshen.",
      "And of course, I could never forget your iconic 'I will kill you.' And then the stare.",
      "I would never want to be the reason you need motivation.",
      "Happy Teachers' Day.",
    ],
  },
  {
    id: "kalsoom",
    name: "Kalsoom Ashraf",
    honorific: "Miss",
    passwordHash: "3cb968a982080be1d7a5df98dc49673a8c052d2642ef7730b7753cee5b87c3dd",
    subject: "biology",
    worldTitle: "The living world",
    roomLabel: "The living world",
    discoveriesNeeded: 4,
    memories: kalsoomMemories,
    notes: kalsoomNotes,
    finale: kalsoomFinale,
    ending: kalsoomEnding,
  },
  {
    id: "naila",
    name: "Naila Naeem",
    honorific: "Miss",
    passwordHash: "32713804516cb755aacfdb806dcfad2e606469c22783e7c584973a753b0d5499",
    subject: "english",
    worldTitle: "The library",
    roomLabel: "You can say it here.",
    discoveriesNeeded: 3,
    memories: [
      {
        id: "jealous",
        title: "The English notebook",
        weight: "ordinary",
        lines: [
          "I show you how good my other notebooks look.",
          "You get jealous.",
          "Why doesn't the English one look like that?",
        ],
      },
      {
        id: "least",
        title: "Least favourite",
        weight: "ordinary",
        lines: ["English is probably my least favourite subject.", "I'm not pretending otherwise."],
      },
      {
        id: "good",
        title: "The good in it",
        weight: "sentimental",
        lines: ["You helped me see the good in English."],
      },
      {
        id: "enjoy",
        title: "Then I liked it",
        weight: "sentimental",
        lines: ["I started enjoying English more because of you.", "I didn't expect that."],
      },
      {
        id: "closer",
        title: "Closer",
        weight: "sentimental",
        lines: ["You aren't just a teacher to me.", "You're much closer to me than that."],
      },
      {
        id: "anything",
        title: "Almost anything",
        weight: "major",
        lines: ["You're someone I can talk to about almost anything without feeling like I'm going to be judged."],
      },
      {
        id: "judge",
        title: "No judgement",
        weight: "major",
        lines: ["I know you won't judge me."],
      },
      {
        id: "safe",
        title: "Safe",
        weight: "major",
        lines: ["You've become a safe place for me."],
      },
      {
        id: "friend",
        title: "A friend",
        weight: "ordinary",
        lines: ["I really enjoy talking to you.", "Talking to you feels like talking to a friend."],
      },
      {
        id: "listen",
        title: "You listen",
        weight: "sentimental",
        lines: ["You listen."],
      },
      {
        id: "relate",
        title: "You relate",
        weight: "sentimental",
        lines: ["You relate.", "That's the part I can't fake from anyone else."],
      },
      {
        id: "admire",
        title: "What I admire",
        weight: "sentimental",
        lines: ["Your ability to listen and relate is one of the qualities I admire most."],
      },
      {
        id: "heard",
        title: "Heard",
        weight: "major",
        lines: ["You made me feel heard."],
      },
    ],
    books: [
      {
        id: "least",
        title: "Least favourite",
        pages: ["English is probably my least favourite subject.", "I'm not pretending otherwise."],
      },
      {
        id: "good",
        title: "The good in it",
        pages: ["You helped me see the good in English."],
      },
      {
        id: "enjoy",
        title: "Enjoying it",
        pages: ["I started enjoying English more because of you."],
      },
      {
        id: "closer",
        title: "Closer",
        pages: ["You aren't just a teacher to me.", "You're much closer to me than that."],
      },
      {
        id: "anything",
        title: "Almost anything",
        pages: ["You're someone I can talk to about almost anything without feeling like I'm going to be judged."],
      },
      {
        id: "safe",
        title: "A safe place",
        pages: ["You've become a safe place for me."],
      },
      {
        id: "friend",
        title: "Like a friend",
        pages: ["I really enjoy talking to you.", "It feels like talking to a friend."],
      },
      {
        id: "listen",
        title: "Listening",
        pages: ["You listen.", "You relate."],
      },
      {
        id: "admire",
        title: "What I admire",
        pages: ["Listening and relating. That's one of the qualities I admire most."],
      },
      {
        id: "heard",
        title: "Heard",
        pages: ["You made me feel heard."],
      },
    ],
    notes: [
      { id: "notebook", label: "Jealous", line: "Why doesn't the English notebook look like the others?" },
      { id: "least", label: "English", line: "It was probably my least favourite. You helped me see the good in it." },
      { id: "friend", label: "A friend", line: "Talking to you feels like talking to a friend." },
      { id: "judge", label: "Judgement", line: "You're someone I can talk to about almost anything without feeling like I'm going to be judged." },
      { id: "listen", label: "Listen", line: "You listen. You relate. I admire that most." },
      { id: "safe", label: "Safe", line: "You've become a safe place for me." },
      { id: "closer", label: "Closer", line: "You aren't just a teacher to me." },
      { id: "heard", label: "Heard", line: "You made me feel heard." },
    ],
    finale: [
      "You aren't just a teacher to me.",
      "You're someone I can talk to about almost anything without feeling like I'm going to be judged.",
      "You listen. You relate.",
      "You made me feel heard.",
      "Thank you, Miss Naila.",
    ],
    ending: [
      "Miss Naila.",
      "The English notebook still doesn't look as good. You were right to mind.",
      "You made me feel heard.",
      "Happy Teachers' Day.",
    ],
  },
  {
    id: "maryam",
    name: "Maryam Ghazanfar",
    honorific: "Miss",
    passwordHash: "cde56892bbebbf6c5fe56cf3317f558aec67aeb0ba19504ca3c9e6801cb45b28",
    subject: "inner",
    worldTitle: "The journey",
    roomLabel: "The journey kept your work in it.",
    discoveriesNeeded: 3,
    memories: [
      {
        id: "hard",
        title: "Hardworking",
        weight: "ordinary",
        lines: ["You're genuinely one of the hardest-working teachers I've ever met."],
      },
      {
        id: "fun",
        title: "The lesson",
        weight: "ordinary",
        lines: ["You make Islamiat lessons fun.", "I look forward to them. That's not automatic."],
      },
      {
        id: "know",
        title: "Knowledge",
        weight: "sentimental",
        lines: [
          "You're extremely knowledgeable.",
          "A hadith in Bukhari and Muslim says actions are only by intentions, and a person gets only what they intended.",
          "You teach that properly, and the lesson is still enjoyable.",
        ],
      },
      {
        id: "duties",
        title: "The duties",
        weight: "ordinary",
        lines: ["You have so many duties.", "So many responsibilities. I can see the load."],
      },
      {
        id: "care",
        title: "Still",
        weight: "sentimental",
        lines: ["Despite all of that, you still take care of our needs."],
      },
      {
        id: "sweet",
        title: "Sweet",
        weight: "ordinary",
        lines: ["You're very sweet.", "On top of the work. Not instead of it."],
      },
      {
        id: "itinerary",
        title: "The itinerary",
        weight: "sentimental",
        lines: ["I still remember how much you planned for us to go on that trip.", "You wrote the order of it. The days. The lot."],
      },
      {
        id: "route",
        title: "The route",
        weight: "ordinary",
        lines: ["You worked out the route.", "How we would actually get there."],
      },
      {
        id: "prep",
        title: "Preparations",
        weight: "ordinary",
        lines: ["You handled the preparations.", "A lot of them. You wanted us to have the experience."],
      },
      {
        id: "destination",
        title: "The destination",
        weight: "sentimental",
        lines: ["There was a destination because you planned one.", "You wanted that for us."],
      },
      {
        id: "activities",
        title: "What we'd do",
        weight: "ordinary",
        lines: ["You thought about what we would actually do there.", "Not only that we would go."],
      },
      {
        id: "absent",
        title: "You couldn't come",
        weight: "major",
        lines: [
          "In the end, you couldn't go because you had so much work to deal with.",
          "You still put so much effort into making the trip happen. That meant a lot.",
        ],
      },
      {
        id: "meant",
        title: "What it meant",
        weight: "major",
        lines: [
          "I still remember how much you planned for us to go on that trip.",
          "In the end, you couldn't go because you had so much work to deal with.",
          "You still put so much effort into making the trip happen. That meant a lot.",
        ],
      },
    ],
    notes: [
      { id: "hard", label: "Work", line: "One of the hardest-working teachers I've met." },
      { id: "fun", label: "Islamiat", line: "You make the lessons fun, and you know the material." },
      { id: "duties", label: "Duties", line: "So many responsibilities. You still take care of us." },
      { id: "plan", label: "The plan", line: "You planned the itinerary, the route, the preparations." },
      { id: "gone", label: "The day", line: "In the end, you couldn't go because you had so much work to deal with." },
      { id: "meant", label: "Meant", line: "You still put so much effort into making the trip happen. That meant a lot." },
      { id: "sweet", label: "Sweet", line: "Very sweet, on top of all that work." },
      { id: "want", label: "For us", line: "You wanted us to have the experience." },
    ],
    finale: [
      "I still remember how much you planned for us to go on that trip.",
      "In the end, you couldn't go because you had so much work to deal with.",
      "You still put so much effort into making the trip happen. That meant a lot.",
      "Thank you, Miss Maryam.",
    ],
    ending: [
      "Miss Maryam.",
      "You make Islamiat fun, and you carry a huge amount of work, and you still take care of us.",
      "You planned the journey. The effort meant a lot.",
      "Happy Teachers' Day.",
    ],
  },
];

function normaliseName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .replace(/\b(dr|mr|mrs|ms|miss|prof|professor)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function authenticate(name: string, password: string) {
  const enteredName = normaliseName(name);
  const enteredPassword = normalisePassword(password);
  if (!enteredName || !enteredPassword) return null;
  const hash = await digestPassword(enteredPassword);
  return teachers.find((teacher) => normaliseName(teacher.name) === enteredName && teacher.passwordHash === hash) ?? null;
}

export function getTeacher(id: string) {
  return teachers.find((teacher) => teacher.id === id) ?? null;
}

export function memoryById(teacher: Teacher, id: string) {
  return teacher.memories.find((memory) => memory.id === id) ?? null;
}
