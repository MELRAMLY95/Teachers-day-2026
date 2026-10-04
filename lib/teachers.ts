import type { Subject, Teacher } from "@/lib/types";

/**
 * Replace these sample teachers before you share the site.
 *
 * A teacher types their name and password on the first screen.
 * The password only keeps the surprise between colleagues. The site is a
 * public static page, so anyone can read the messages in the source.
 * Do not put phone numbers, addresses, or anything private here.
 */
export const teachers: Teacher[] = [
  {
    id: "amira",
    name: "Amira Hassan",
    honorific: "Dr.",
    password: "glassware",
    subject: "chemistry",
    messages: [
      {
        studentId: "amina",
        line: "You let me run the test a third time without making it a story about failure.",
      },
      {
        studentId: "leo",
        line: "I still check the units twice. That was you, standing at the end of the bench.",
      },
      {
        studentId: "hana",
        line: "You called my wrong colour data, not a mistake.",
      },
      {
        studentId: "mateo",
        line: "Remember when we spent fifteen minutes arguing about this reaction? I was sure the precipitate would be green.",
      },
      {
        studentId: "noor",
        line: "The lab used to feel like a place I could break something. You made it a place I could find something.",
      },
      {
        studentId: "jonah",
        line: "I forgot my goggles. You handed me yours and took the spare from the drawer like it was nothing.",
      },
      {
        studentId: "safa",
        line: "You wrote the equation, then waited. The waiting was the lesson.",
      },
      {
        studentId: "elias",
        line: "I can still hear the pipette against the glass when the room went quiet.",
      },
      {
        studentId: "miriam",
        line: "You said a colour change is a sentence. I started reading them.",
      },
      {
        studentId: "yusuf",
        line: "Thank you for not laughing when I called a flask a beaker for a whole term.",
      },
      {
        studentId: "chloe",
        line: "The practical I dreaded became the one I asked to repeat.",
      },
      {
        studentId: "ibrahim",
        line: "You showed us that a reaction can be slow and still be certain.",
      },
    ],
  },
  {
    id: "julian",
    name: "Julian Okonkwo",
    honorific: "Mr.",
    password: "starlight",
    subject: "physics",
    messages: [
      {
        studentId: "amina",
        line: "Something you taught me that I'll carry: a force can be real before anyone sees it.",
      },
      {
        studentId: "leo",
        line: "The tennis ball on a string. I understood orbits in the corridor, not the textbook.",
      },
      {
        studentId: "hana",
        line: "You drew the wave so many times the chalk dust looked like a tide.",
      },
      {
        studentId: "mateo",
        line: "I was afraid of the formula. You asked me what it was trying to notice.",
      },
      {
        studentId: "noor",
        line: "Light, you said, does not hurry for anyone. I think about that when I rush.",
      },
      {
        studentId: "jonah",
        line: "You let us get the measurement wrong, then asked what the wrong number was protecting.",
      },
      {
        studentId: "safa",
        line: "Magnetism felt like a trick until you made us predict it.",
      },
      {
        studentId: "elias",
        line: "I still look up. That started in your room.",
      },
      {
        studentId: "miriam",
        line: "You said energy is not lost, only moved. I needed that for more than physics.",
      },
      {
        studentId: "yusuf",
        line: "The day the circuit worked, you let us be loud.",
      },
      {
        studentId: "chloe",
        line: "You never rushed the silence after a hard question.",
      },
      {
        studentId: "ibrahim",
        line: "You pushed us forward the way a field does. We did not always see your hand.",
      },
    ],
  },
  {
    id: "elena",
    name: "Elena Varga",
    honorific: "Ms.",
    password: "goldenratio",
    subject: "mathematics",
    messages: [
      {
        studentId: "amina",
        line: "You asked to see the wrong working first. I stopped hiding it.",
      },
      {
        studentId: "leo",
        line: "The proof looked like a locked door. You handed me the hinge.",
      },
      {
        studentId: "hana",
        line: "I still draw the diagram before I touch the numbers.",
      },
      {
        studentId: "mateo",
        line: "You said a wrong turn is a coordinate, not a verdict.",
      },
      {
        studentId: "noor",
        line: "Fractions used to make me small. You made them into pictures.",
      },
      {
        studentId: "jonah",
        line: "You waited while I counted on my fingers and did not look away.",
      },
      {
        studentId: "safa",
        line: "Elegance, you said, is an idea that found its shortest path.",
      },
      {
        studentId: "elias",
        line: "You celebrated the question I was embarrassed to ask.",
      },
      {
        studentId: "miriam",
        line: "Graph paper still feels like a kind of kindness.",
      },
      {
        studentId: "yusuf",
        line: "You told me the answer was the least interesting part. I believe you now.",
      },
      {
        studentId: "chloe",
        line: "I failed the quiz and you said, good — now we know where to stand.",
      },
      {
        studentId: "ibrahim",
        line: "You made infinity feel careful, not frightening.",
      },
    ],
  },
  {
    id: "priya",
    name: "Priya Nair",
    honorific: "Dr.",
    password: "mitosis",
    subject: "biology",
    messages: [
      {
        studentId: "amina",
        line: "The onion cells were a blur until you turned the focus. A city showed up.",
      },
      {
        studentId: "leo",
        line: "You made me draw what I actually saw, not what the poster showed.",
      },
      {
        studentId: "hana",
        line: "I still think of the heart as a patient worker. That was your phrase.",
      },
      {
        studentId: "mateo",
        line: "You let the class go quiet when the seedling leaned toward the window.",
      },
      {
        studentId: "noor",
        line: "DNA looked like code. You called it a letter that keeps being written.",
      },
      {
        studentId: "jonah",
        line: "I was squeamish. You stood with me until I could look.",
      },
      {
        studentId: "safa",
        line: "You said growth is mostly invisible, then suddenly not.",
      },
      {
        studentId: "elias",
        line: "A pin fell off the ecosystem diagram. You left the gap and asked what was missing.",
      },
      {
        studentId: "miriam",
        line: "I started noticing birds on the way home. I blame you, happily.",
      },
      {
        studentId: "yusuf",
        line: "You corrected me gently when I called a cell simple.",
      },
      {
        studentId: "chloe",
        line: "Thank you for letting us stay after the bell to watch the slide.",
      },
      {
        studentId: "ibrahim",
        line: "You taught us that living things keep each other.",
      },
    ],
  },
  {
    id: "samuel",
    name: "Samuel Adeyemi",
    honorific: "Mr.",
    password: "prologue",
    subject: "english",
    messages: [
      {
        studentId: "amina",
        line: "You said, write the sentence you are afraid of first.",
      },
      {
        studentId: "leo",
        line: "I keep a line of yours in the back of my notebook: be specific. Specific is a kind of care.",
      },
      {
        studentId: "hana",
        line: "You read my paragraph aloud and I heard it become a real thing.",
      },
      {
        studentId: "mateo",
        line: "The funniest essay I wrote started because you said the serious topic could survive a joke.",
      },
      {
        studentId: "noor",
        line: "I never told you the book you lent me was the first I finished.",
      },
      {
        studentId: "jonah",
        line: "You marked my work in pencil, like you expected it to keep changing.",
      },
      {
        studentId: "safa",
        line: "You taught me that a story can tell the truth without raising its voice.",
      },
      {
        studentId: "elias",
        line: "I still hear you ask, who is this sentence for?",
      },
      {
        studentId: "miriam",
        line: "There is a letter I was too shy to send. It lives in this library now.",
      },
      {
        studentId: "yusuf",
        line: "You made poetry feel like something said across a table.",
      },
      {
        studentId: "chloe",
        line: "I learned to cut a paragraph I loved. You called that courage.",
      },
      {
        studentId: "ibrahim",
        line: "You said our lives were already full of plots. We just had to notice the turning.",
      },
    ],
  },
  {
    id: "fatima",
    name: "Fatima Rahman",
    honorific: "Mrs.",
    password: "sabr",
    subject: "inner",
    messages: [
      {
        studentId: "amina",
        line: "You never asked me to perform being good. You asked me what I meant.",
      },
      {
        studentId: "leo",
        line: "You gave me a word for wanting to do right and not knowing how: intention.",
      },
      {
        studentId: "hana",
        line: "When I was unkind, you asked what I was protecting. That was the first useful question.",
      },
      {
        studentId: "mateo",
        line: "You let faith and doubt sit in the same conversation without rushing either.",
      },
      {
        studentId: "noor",
        line: "I remember the afternoon you taught us that patience can be active.",
      },
      {
        studentId: "jonah",
        line: "You noticed when I went quiet. You did not fill the quiet for me.",
      },
      {
        studentId: "safa",
        line: "You said character is the direction of a life, not one afternoon.",
      },
      {
        studentId: "elias",
        line: "I still choose more slowly. You made slowness feel like responsibility.",
      },
      {
        studentId: "miriam",
        line: "You taught compassion as attention, not as a speech.",
      },
      {
        studentId: "yusuf",
        line: "Thank you for correcting us without making us smaller.",
      },
      {
        studentId: "chloe",
        line: "The quiet in your room was the first quiet that did not feel like a test.",
      },
      {
        studentId: "ibrahim",
        line: "You changed how I see people. That includes how I see myself.",
      },
    ],
  },
];

export const worldTitles: Record<Subject, string> = {
  chemistry: "The Reaction",
  physics: "The Universe",
  mathematics: "The Impossible Room",
  biology: "The Living World",
  english: "The Library of Stories",
  inner: "The Inner World",
};

function normaliseName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .replace(/\b(dr|mr|mrs|ms|miss|prof|professor)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalisePassword(value: string) {
  return value.toLowerCase().replace(/\s+/g, "").trim();
}

export function authenticate(name: string, password: string) {
  const enteredName = normaliseName(name);
  const enteredPassword = normalisePassword(password);
  if (!enteredName || !enteredPassword) return null;
  return (
    teachers.find(
      (teacher) =>
        normaliseName(teacher.name) === enteredName &&
        normalisePassword(teacher.password) === enteredPassword,
    ) ?? null
  );
}

export function getTeacher(id: string) {
  return teachers.find((teacher) => teacher.id === id) ?? null;
}

export function lineFor(teacher: Teacher, studentId: string) {
  return teacher.messages.find((message) => message.studentId === studentId)?.line ?? "";
}
