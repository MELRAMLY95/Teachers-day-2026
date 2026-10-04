import assert from "node:assert/strict";
import { kalsoomScript } from "./lines.ts";

const script = kalsoomScript();

const required = [
  "one of my favourite teachers",
  "difficult for me to describe",
  "I feel incredibly comfortable around you",
  "easy to just be myself",
  "looking over to see if you're smiling",
  "how much your smile means to me",
  "It genuinely warms my heart",
  "make everything feel a little lighter",
  "makes complicated things feel understandable",
  "You're incredibly smart",
  "how well you know how to teach",
  "Being smart is one thing",
  "make someone else understand is another",
  "You're really good at both",
  "You're incredibly kind",
  "so comfortable around you",
  "I've ever properly told you this",
  "GRADE 6 / 7",
  "Grade 6. Grade 7.",
  "I had an issue with another teacher",
  "I was crying a lot",
  "You were my class teacher",
  "And you hugged me",
  "a small moment to you",
  "wasn't small to me",
  "like yesterday",
  "how much that moment would stay with me",
  "I've carried that feeling with me ever since",
  "weren't just my biology teacher",
  "when I needed someone, you were there",
  "looking to see whether you're smiling",
  "says more than I know how to explain",
  "taught you something",
  "become part of you",
  "one of those teachers for me",
  "immense love for you",
  "very big part of my heart",
  "heart do a backflip",
  "Happy Teachers' Day, Miss Kalsoom",
  "hundreds of tiny things",
  "All of it stayed",
];

for (const line of required) {
  assert.ok(script.includes(line), `missing: ${line}`);
}
