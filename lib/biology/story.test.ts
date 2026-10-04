import assert from "node:assert/strict";
import { garden, kalsoomDedication, kalsoomLetter, kalsoomScript } from "./lines.ts";

const script = kalsoomScript();

const required = [
  "You are genuinely one of my favourite teachers, and I don't think I can properly describe you in words.",
  "However, I can start by saying how comfortable I am around you.",
  "Whenever I do something, I look to see if you're smiling or not.",
  "Your smile genuinely warms my heart.",
  "You're also so incredibly smart, and you know how to teach so well.",
  "You're also really kind.",
  "I still remember when I was in Grade 6 or Grade 7 and I had an issue with a teacher. You were my class teacher at the time.",
  "I was crying a lot, but then you hugged me.",
  "I still remember that day like it was yesterday.",
  "I have immense love for you, Miss Kalsoom.",
  "You hold a very big part of my heart.",
  "I can't talk about you without feeling my heart doing a backflip.",
  "Miss Kalsoom Ashraf",
  "Happy Teachers' Day ❤️",
];

for (const line of required) {
  assert.ok(script.includes(line), `missing: ${line}`);
}

const absent = [
  "amazing teacher",
  "guardian angel",
  "you saved me",
  "I am very grateful",
  "You're incredibly kind",
  "You're really good at both",
  "hundreds of tiny things",
  "describe her",
  "around her",
  "if she is smiling",
  "Her smile",
  "She is also",
  "she hugged",
  "She holds",
  "about her",
];

for (const line of absent) {
  assert.equal(script.includes(line), false, `rewritten line leaked: ${line}`);
}

assert.equal(garden.length, 8);
assert.equal(garden.find((memory) => memory.id === "kind")?.lines.length, 1);
assert.equal(garden.find((memory) => memory.id === "smart")?.lines.length, 1);
assert.deepEqual(garden.find((memory) => memory.id === "grade")?.lines.length, 3);
assert.equal(garden.find((memory) => memory.id === "grade")?.slow, true);
assert.deepEqual(kalsoomLetter, garden.flatMap((memory) => memory.lines));
assert.deepEqual([...kalsoomDedication], ["Miss Kalsoom Ashraf", "Happy Teachers' Day ❤️"]);
