import { digestPassword, normalisePassword } from "@/lib/engine/auth";
import type { Teacher } from "@/lib/types";

/**
 * A public static site cannot keep a password secret from someone who reads
 * the built files. These are hashes, and each world is loaded only after the
 * hash matches, so one teacher does not walk into another's room.
 * Do not put phone numbers, addresses, or anything private in the lines.
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
        id: "notebook",
        title: "The help",
        weight: "sentimental",
        lines: [
          "You never waited for us to ask.",
          "Sometimes you offered help before we even knew we needed it.",
          "Even when it was late.",
          "Even when you were busy.",
          "You were there.",
        ],
      },
      {
        id: "monitor",
        title: "The screen",
        weight: "ordinary",
        lines: ["How are you always online?"],
      },
      {
        id: "window",
        title: "The other classroom",
        weight: "major",
        lines: [
          "Some teachers wait for students to ask for help.",
          "You sometimes offered another lesson before we even asked.",
          "That says more about you than any lesson ever could.",
        ],
      },
      {
        id: "drawer",
        title: "A silly one",
        weight: "ordinary",
        lines: [
          "You tell the sweetest, silliest jokes in the middle of a serious practical.",
          "I remember the joke more clearly than the equation.",
        ],
      },
      {
        id: "margin",
        title: "In the margin",
        weight: "sentimental",
        lines: ["You do not teach past us. You meet us there."],
      },
    ],
    notes: [
      { id: "hour", label: "After midnight", line: "You answered when the building was already dark." },
      { id: "joke", label: "The joke", line: "It was silly, and then you made sure I had actually understood." },
      { id: "class", label: "The extra class", line: "I still have the moment you offered another lesson." },
      { id: "warm", label: "Sunlight", line: "That is the only word that fits the way school felt around you." },
    ],
    finale: [
      "Some teachers teach chemistry.",
      "You made your classroom feel like somewhere we could always come back to.",
      "You are the sunlight in our school life.",
      "Thank you, Miss Irum.",
    ],
    ending: [
      "It is Teachers' Day.",
      "The light in this room was already yours.",
      "Miss Irum Shahid, thank you for being there.",
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
        id: "praise",
        title: "Capable",
        weight: "sentimental",
        lines: ["Physics is not my favourite subject.", "You praised the work until it felt possible."],
      },
    ],
    notes: [
      { id: "amina", label: "The work", line: "You give everything you have to what you are doing." },
      { id: "leo", label: "The praise", line: "You made me feel capable in a subject I did not love." },
      { id: "hana", label: "The joke", line: "You are sweet, and you let the joke land." },
      { id: "mateo", label: "The push", line: "I worked harder because you were working harder." },
      { id: "noor", label: "The field", line: "A force can move you before you agree to be moved." },
      { id: "jonah", label: "The late night", line: "The effort was visible. So was the care." },
      { id: "safa", label: "Momentum", line: "Once you praised the attempt, the next one was easier." },
      { id: "elias", label: "Looking up", line: "I still look up. That started with you taking the subject seriously." },
    ],
    finale: [
      "Physics was not my favourite subject.",
      "You praised us until the work felt possible.",
      "You give everything you have.",
      "You are the force that kept me moving.",
      "Thank you, Miss Hadia.",
    ],
    ending: [
      "It is Teachers' Day.",
      "The orbit changed because you pushed.",
      "Miss Hadia Johar, thank you for the force.",
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
        id: "bridge",
        title: "Why I love it",
        weight: "sentimental",
        lines: ["You are one of the reasons I love mathematics.", "The working had to be seen, especially when it was wrong."],
      },
      {
        id: "sequence",
        title: "The stare",
        weight: "ordinary",
        lines: ["I will kill you.", "That was the joke. The stare did the rest. Then you helped me find the next number."],
      },
      {
        id: "turn",
        title: "The future",
        weight: "major",
        lines: [
          "Mathematics.",
          "You made me love it, and you made me work.",
          "You are one of the reasons I want to become an OB/GYN.",
        ],
      },
      {
        id: "online",
        title: "Still online",
        weight: "ordinary",
        lines: ["How are you always online?"],
      },
    ],
    notes: [
      { id: "working", label: "The working", line: "You wanted the wrong steps first. I stopped hiding them." },
      { id: "stare", label: "The stare", line: "I will kill you. I can still see your face when you said it." },
      { id: "love", label: "The subject", line: "I love mathematics because you were the one teaching it." },
      { id: "future", label: "The future", line: "The ambition came with the practice. You were in both." },
    ],
    finale: [
      "Miss Noshen.",
      "Mathematics.",
      "The work.",
      "The future I want.",
      "You are one of the reasons I want to become an OB/GYN.",
      "Thank you.",
    ],
    ending: [
      "It is Teachers' Day.",
      "The door was a proof, and the proof was you.",
      "Miss Noshen, thank you for the future.",
    ],
  },
  {
    id: "kalsoom",
    name: "Kalsoom Ashraf",
    honorific: "Miss",
    passwordHash: "3cb968a982080be1d7a5df98dc49673a8c052d2642ef7730b7753cee5b87c3dd",
    subject: "biology",
    worldTitle: "The living world",
    roomLabel: "Quiet, the way that day was quiet.",
    discoveriesNeeded: 4,
    memories: [
      {
        id: "smile",
        title: "The smile",
        weight: "sentimental",
        lines: ["Whenever I do something, I look to see whether you are smiling.", "Your smile warms my heart."],
      },
      {
        id: "ease",
        title: "At ease",
        weight: "ordinary",
        lines: ["I am comfortable around you in a way I cannot quite explain.", "You are kind, and you are extremely intelligent."],
      },
      {
        id: "mind",
        title: "How you think",
        weight: "ordinary",
        lines: ["You notice the living thing in front of you.", "You ask us to see what is actually there."],
      },
      {
        id: "heart",
        title: "The heart",
        weight: "major",
        lines: [
          "I was crying.",
          "You were my class teacher.",
          "I don't remember everything about that day.",
          "I remember the hug.",
          "I still remember it like yesterday.",
          "You hold a very big part of my heart.",
        ],
      },
    ],
    notes: [
      { id: "look", label: "After I speak", line: "I look for your smile before I look for anything else." },
      { id: "grade", label: "Grade 6", line: "There was a day I was crying. You were the class teacher." },
      { id: "stay", label: "Years later", line: "I remember the hug as if it were yesterday." },
      { id: "heart", label: "The heart", line: "You hold a very big part of it." },
    ],
    finale: [
      "I was crying.",
      "You were my class teacher.",
      "I don't remember everything about that day.",
      "I remember the hug.",
      "I still remember it like yesterday.",
      "You hold a very big part of my heart.",
      "Thank you, Miss Kalsoom.",
    ],
    ending: [
      "It is Teachers' Day.",
      "I do not have a better word than heart.",
      "Miss Kalsoom Ashraf, thank you for that day, and for the days after it.",
    ],
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
        id: "notebook",
        title: "The other notebook",
        weight: "ordinary",
        lines: ["I showed you how good the other notebooks looked.", "You got jealous.", "Why doesn't the English one look like that?"],
      },
      {
        id: "safe",
        title: "The quiet room",
        weight: "major",
        lines: [
          "I can talk to you about almost anything.",
          "You listen. You relate. I do not feel judged.",
          "English was not my favourite subject.",
          "You helped me see why it mattered, and I started to enjoy it.",
          "You are a safe place.",
        ],
      },
    ],
    books: [
      {
        id: "notebooks",
        title: "The other notebook",
        pages: [
          "I show you how good my other subject notebooks look.",
          "You get jealous, and you ask why the English notebook does not look like that.",
        ],
      },
      {
        id: "talk",
        title: "Talking",
        pages: [
          "Talking to you feels like talking to a friend.",
          "I can bring you the thing I would not say in a classroom.",
        ],
      },
      {
        id: "subject",
        title: "English",
        pages: [
          "It was not my favourite subject.",
          "You helped me see its value, and then I began to enjoy it.",
        ],
      },
      {
        id: "heard",
        title: "Being heard",
        pages: ["You listen.", "You relate.", "Nothing about the conversation feels like a test."],
      },
      {
        id: "letters",
        title: "A letter",
        pages: ["There are things I tell you that I do not tell the room.", "They are safe with you."],
      },
    ],
    notes: [
      { id: "judge", label: "Without judgement", line: "I can talk to you about almost anything." },
      { id: "friend", label: "A friend", line: "It feels like that, even while you are teaching." },
      { id: "notebook", label: "The notebook", line: "You still want the English one to look as loved as the others." },
      { id: "safe", label: "Safe", line: "That is the word. Not the subject. You." },
    ],
    finale: [
      "You are much more than a teacher to me.",
      "You listen, and I do not feel judged.",
      "You are a safe place.",
      "Thank you, Miss Naila.",
    ],
    ending: [
      "It is Teachers' Day.",
      "This library was a way of saying I am heard.",
      "Miss Naila Naeem, thank you for the quiet room.",
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
        id: "intention",
        title: "Intention",
        weight: "sentimental",
        lines: [
          "A hadith recorded by al-Bukhari and Muslim begins: actions are only by intentions, and every person will have only what they intended.",
          "You make the lesson enjoyable, and you still take the meaning seriously.",
        ],
      },
      {
        id: "patience",
        title: "Sabr",
        weight: "ordinary",
        lines: [
          "You have an enormous amount of work.",
          "You still make time for us.",
          "Patience, the way you teach it, is something a person does.",
        ],
      },
      {
        id: "mercy",
        title: "Rahma",
        weight: "sentimental",
        lines: [
          "Mercy here is attention.",
          "You are hardworking and knowledgeable, and you do not make us smaller while you teach.",
        ],
      },
      {
        id: "trip",
        title: "The journey",
        weight: "major",
        lines: [
          "You planned the journey.",
          "You put so much effort into making it happen.",
          "You could not come with us. The work was too much.",
          "But you were part of the reason we could go.",
        ],
      },
    ],
    notes: [
      { id: "plan", label: "The plan", line: "You planned the trip as carefully as you plan a lesson." },
      { id: "work", label: "The work", line: "You could not come. The work had already taken the day." },
      { id: "reason", label: "Why we went", line: "You were still part of the reason the journey happened." },
      { id: "time", label: "Time", line: "You have many responsibilities. You still make time." },
    ],
    finale: [
      "You planned the journey.",
      "You couldn't come with us.",
      "But you were part of the reason we could go.",
      "Thank you, Miss Maryam.",
    ],
    ending: [
      "It is Teachers' Day.",
      "The journey kept your effort in it.",
      "Miss Maryam Ghazanfar, thank you for planning the way, and for the lessons that made the way matter.",
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
