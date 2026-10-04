import assert from "node:assert/strict";
import { garden, kalsoomDedication, kalsoomLetter, kalsoomScript } from "./lines.ts";

const script = kalsoomScript();

const required = [
  "I do not think I can describe her in words.",
  "However, I can start by saying how comfortable I am around her.",
  "Whenever I do something, I look to see if she is smiling or not.",
  "Her smile warms my heart.",
  "She is also so incredibly smart and she knows how to teach pretty well.",
  "She is also really kind.",
  "I still remember in Grade 6 or Grade 7, I had an issue with a teacher and Miss Kalsoom was my class teacher at the time.",
  "I was crying a lot, but then she hugged me.",
  "I still remember that day like yesterday.",
  "I have immense love for Miss Kalsoom.",
  "She holds a very big part of my heart.",
  "I can't talk about her without feeling my heart doing a backflip.",
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
  "one of my favourite teachers",
  "You're incredibly kind",
  "You're really good at both",
  "hundreds of tiny things",
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
