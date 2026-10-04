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
        id: "drawer",
        title: "The joke",
        weight: "ordinary",
        lines: [
          "You told a joke in the middle of a practical and I actually snorted.",
          "Then you looked at the board like nothing happened and made us finish the equation.",
          "I still remember the joke. The equation took longer.",
        ],
      },
      {
        id: "monitor",
        title: "The screen",
        weight: "ordinary",
        lines: [
          "I checked the time before I sent the message, because it was stupidly late.",
          "You were online.",
          "I still don't understand how you're online at almost every hour.",
        ],
      },
      {
        id: "margin",
        title: "The margin",
        weight: "sentimental",
        lines: ["You wrote the missing step in the margin.", "You didn't just cross it out."],
      },
      {
        id: "notebook",
        title: "Late",
        weight: "sentimental",
        lines: [
          "I got stuck on the same bit and I didn't want to ask again.",
          "You said we could go through it.",
          "It was late. You were still there.",
        ],
      },
      {
        id: "window",
        title: "Before we asked",
        weight: "major",
        lines: [
          "You offered another class online before anyone asked.",
          "I remember thinking you already knew we hadn't got it.",
        ],
      },
    ],
    notes: [
      { id: "joke", label: "The joke", line: "It landed. Then you made me write the equation anyway." },
      { id: "hour", label: "The time", line: "I checked the clock first. You were still online." },
      { id: "margin", label: "The margin", line: "The missing step was written small, next to the wrong one." },
      { id: "class", label: "The extra class", line: "You offered it. We hadn't asked yet." },
    ],
    finale: [
      "Some teachers teach chemistry.",
      "I could walk back into your classroom without having a question ready.",
      "You are the sunlight in our school life.",
      "Thank you, Miss Irum.",
    ],
    ending: [
      "Miss Irum.",
      "I still check the time before I message you.",
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
        id: "praise",
        title: "The try",
        weight: "sentimental",
        lines: [
          "Physics isn't my subject.",
          "You still said good, and you meant the try.",
          "The next answer was less shaky.",
        ],
      },
    ],
    notes: [
      { id: "amina", label: "The marking", line: "You mark like the homework belongs to you as well." },
      { id: "leo", label: "The try", line: "Physics isn't my thing. You still said good, and you meant it." },
      { id: "hana", label: "The joke", line: "You made the joke, then you waited to see if we'd actually got it." },
      { id: "mateo", label: "The board", line: "I did the question again because you were still at the board." },
      { id: "noor", label: "The push", line: "You work so hard it sort of moves the rest of us." },
      { id: "jonah", label: "The empty floor", line: "The floor was empty. You were still working." },
      { id: "safa", label: "After that", line: "One shaky answer. You praised it. The next one came out easier." },
      { id: "elias", label: "Looking up", line: "I look at the board properly now. That started with you taking it seriously." },
    ],
    finale: [
      "Physics was never the subject I liked.",
      "You praised the work until the next bit felt possible.",
      "You give everything you have to it.",
      "You are the force that kept me moving.",
      "Thank you, Miss Hadia.",
    ],
    ending: [
      "Miss Hadia.",
      "I still redo the question when I remember you were still at the board.",
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
        id: "bridge",
        title: "Why I love it",
        weight: "sentimental",
        lines: [
          "You are one of the reasons I actually like maths.",
          "You want the working. Especially the wrong working.",
          "I stopped hiding the messy bit.",
        ],
      },
      {
        id: "sequence",
        title: "The stare",
        weight: "ordinary",
        lines: [
          "I will kill you.",
          "That's what you say. Then you do the stare.",
          "And then you help me find the next number, so.",
        ],
      },
      {
        id: "turn",
        title: "The future",
        weight: "major",
        lines: [
          "I want to be an OB/GYN.",
          "Maths is part of why.",
          "You're part of why I can say that out loud.",
        ],
      },
      {
        id: "online",
        title: "Still online",
        weight: "ordinary",
        lines: ["You as well.", "Always online. I checked."],
      },
    ],
    notes: [
      { id: "working", label: "The working", line: "You wanted the wrong steps first. I stopped covering them." },
      { id: "stare", label: "The stare", line: "I will kill you. I can still see your face." },
      { id: "love", label: "The subject", line: "I like maths because you were the one teaching it." },
      { id: "future", label: "OB/GYN", line: "The wanting-to and the practice showed up together. You were in both." },
    ],
    finale: [
      "Miss Noshen.",
      "I will kill you. I can still hear it.",
      "You made me like the subject, and you made me work.",
      "You are one of the reasons I want to become an OB/GYN.",
      "Thank you.",
    ],
    ending: [
      "Miss Noshen.",
      "The stare still works, by the way.",
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
    roomLabel: "Quiet, the way that day was quiet.",
    discoveriesNeeded: 4,
    memories: [
      {
        id: "smile",
        title: "The smile",
        weight: "sentimental",
        lines: [
          "If I say something, I look at you after.",
          "I want to see if you're smiling.",
          "It does something. I don't have a cleaner way to put that.",
        ],
      },
      {
        id: "ease",
        title: "At ease",
        weight: "ordinary",
        lines: [
          "I'm comfortable around you and I can't really explain it.",
          "You're kind. You're also extremely clever, which is a slightly unfair combination.",
        ],
      },
      {
        id: "mind",
        title: "The actual thing",
        weight: "ordinary",
        lines: ["You make us look at the thing.", "Not the sentence in the book. The thing."],
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
      { id: "look", label: "After I speak", line: "I look for your smile before I look at anyone else." },
      { id: "grade", label: "Grade 6", line: "I was crying. You were the class teacher." },
      { id: "stay", label: "What stayed", line: "I don't remember the rest of that day." },
      { id: "heart", label: "Yesterday", line: "I remember the hug like it was yesterday." },
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
      "Miss Kalsoom.",
      "I still look for your smile.",
      "You hold a very big part of my heart.",
      "Happy Teachers' Day.",
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
        lines: [
          "I showed you my other notebooks because they looked decent.",
          "You got jealous.",
          "Why doesn't the English one look like that?",
        ],
      },
      {
        id: "safe",
        title: "The quiet room",
        weight: "major",
        lines: [
          "I can tell you something and it doesn't turn into a lecture.",
          "You listen. You actually relate. I don't feel judged.",
          "English wasn't my favourite. Then you helped, and I started to like it. I didn't expect that.",
          "You are a safe place.",
        ],
      },
    ],
    books: [
      {
        id: "notebooks",
        title: "The other notebook",
        pages: [
          "I showed you my other notebooks because they looked decent.",
          "You got jealous. Why doesn't the English one look like that?",
        ],
      },
      {
        id: "talk",
        title: "Talking",
        pages: [
          "I can tell you something and it doesn't turn into a lecture.",
          "It feels like telling a friend. You're still my teacher. Both of those are true.",
        ],
      },
      {
        id: "subject",
        title: "English",
        pages: [
          "English wasn't my favourite.",
          "You helped me see why any of it mattered, and then I started to like it.",
        ],
      },
      {
        id: "heard",
        title: "Being heard",
        pages: ["You listen.", "You actually relate.", "I don't feel judged. That's the whole thing."],
      },
      {
        id: "letters",
        title: "Not for the room",
        pages: ["There are things I tell you that I don't say in the room.", "They're fine with you."],
      },
    ],
    notes: [
      { id: "judge", label: "After class", line: "I can tell you something and it stays a conversation." },
      { id: "friend", label: "A friend", line: "It feels like that, even while you're teaching." },
      { id: "notebook", label: "Jealous", line: "You were right. The English notebook still doesn't look as good." },
      { id: "safe", label: "Safe", line: "That's the word I have for you. Not for the subject." },
    ],
    finale: [
      "You are much more than a teacher to me.",
      "I can talk to you.",
      "You listen, and I don't feel judged.",
      "You are a safe place.",
      "Thank you, Miss Naila.",
    ],
    ending: [
      "Miss Naila.",
      "The English notebook still doesn't look as good as the others.",
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
        id: "intention",
        title: "Intention",
        weight: "sentimental",
        lines: [
          "A hadith in Bukhari and Muslim says actions are only by intentions, and a person gets only what they intended.",
          "You teach that like it matters on a Tuesday, not only as a quote.",
          "And the lesson is still enjoyable. I don't know how you do both.",
        ],
      },
      {
        id: "patience",
        title: "Time",
        weight: "ordinary",
        lines: ["You have a ridiculous amount of work.", "You still make time.", "I notice."],
      },
      {
        id: "mercy",
        title: "How you explain",
        weight: "sentimental",
        lines: [
          "You know a lot.",
          "You don't make us feel smaller while you explain it.",
          "That's rarer than it should be.",
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
      { id: "plan", label: "The plan", line: "You planned the trip the way you plan a lesson. Properly." },
      { id: "work", label: "Work", line: "You couldn't come. The work had already taken the day." },
      { id: "reason", label: "Why we went", line: "We still went. You were part of the reason." },
      { id: "time", label: "Time", line: "Too much work. You still make time." },
    ],
    finale: [
      "You planned the journey.",
      "You couldn't come with us.",
      "You were part of the reason we could go.",
      "Thank you, Miss Maryam.",
    ],
    ending: [
      "Miss Maryam.",
      "You planned the journey. You couldn't come with us.",
      "You were still part of the reason we could go.",
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
