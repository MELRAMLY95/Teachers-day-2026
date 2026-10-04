import assert from "node:assert/strict";
import { letterFor, tributeSets } from "./sets.ts";

const required: Record<string, string[]> = {
  irum: [
    "You always reply, no matter the hour.",
    "You would sometimes offer online lessons without us even asking, just because you wanted to help us.",
    "You make sweet, silly jokes.",
    "You connect with us.",
    "You feel like the sun in my life.",
    "You're extremely hardworking.",
  ],
  hadia: [
    "Physics isn't naturally my subject.",
    "You make me want to work hard at it anyway.",
    "You put your all into whatever you do.",
    "You somehow make us feel like we're the best.",
    "You're fun to joke with.",
  ],
  noshen: [
    "You're one of the reasons I know I want to become an OB/GYN.",
    "You're one of the main reasons I love mathematics.",
    "I would never want to be the reason you need motivation.",
    "I will kill you.",
    "That stare.",
    "I'm still trying to figure out how.",
    "I enjoy spending time with you.",
  ],
  naila: [
    "You get jealous.",
    "English is probably my least favourite subject.",
    "You helped me see the good in English.",
    "You've become a safe place for me.",
    "without feeling like I'm going to be judged.",
    "You listen.",
    "You made me feel heard.",
  ],
  maryam: [
    "You're genuinely one of the hardest-working teachers I've ever met.",
    "You're extremely knowledgeable.",
    "You still take care of our needs.",
    "I still remember how much you planned for us to go on that trip.",
    "you couldn't go because you had so much work to deal with.",
    "That meant a lot.",
  ],
};

for (const [id, lines] of Object.entries(required)) {
  const script = letterFor(id);
  for (const line of lines) {
    assert.ok(script.some((sentence) => sentence.includes(line)), `${id} missing: ${line}`);
  }
  assert.equal(tributeSets[id].length, 8, id);
  const joined = script.join("\n");
  assert.equal(/\bshe\b/i.test(joined), false, `${id} still says she`);
  assert.equal(/\bher\b/i.test(joined), false, `${id} still says her`);
}

assert.equal(tributeSets.noshen.find((memory) => memory.id === "stare")?.freeze, true);
assert.equal(tributeSets.maryam.find((memory) => memory.id === "trip")?.slow, true);
