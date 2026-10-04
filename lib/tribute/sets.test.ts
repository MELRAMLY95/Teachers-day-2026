import assert from "node:assert/strict";
import { letterFor, tributeSets } from "./sets.ts";

const required: Record<string, string[]> = {
  irum: [
    "You are one of the loveliest, sweetest and most hardworking teachers I have ever had.",
    "You are so helpful.",
    "You always reply no matter the hour.",
    "You would offer online lessons without us even asking, just so you could help us.",
    "You make the sweetest and silliest jokes.",
    "You connect with students on such a sentimental level.",
    "Overall, you are like the sun in my life.",
  ],
  hadia: [
    "You are one of the most hardworking teachers I have ever met.",
    "You put your all into whatever you do, and that makes me appreciate you even more.",
    "Even though physics isn't really my subject, you make me want to work harder at it because you always praise us and somehow make us feel like we're the best.",
    "Overall, you're such a sweet teacher and you're genuinely so fun to joke with.",
  ],
  noshen: [
    "You're one of the reasons I know I want to become an OB/GYN.",
    "You're one of the main reasons I love mathematics.",
    "I would never want to be the reason you need motivation.",
    "I will kill you.",
    "That stare.",
    "You know EXACTLY the one I'm talking about.",
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
    "You are genuinely one of the most hardworking teachers I've ever met.",
    "You make Islamiat lessons fun, and you're so knowledgeable.",
    "Even though you have so many duties, you still manage to take care of our needs.",
    "You're also really sweet.",
    "One thing I can never forget is how much you planned for us to go on that trip.",
    "you couldn't go because you had a ton of work",
    "how much effort you put into planning it for us.",
  ],
};

for (const [id, lines] of Object.entries(required)) {
  const script = letterFor(id);
  for (const line of lines) {
    assert.ok(script.some((sentence) => sentence.includes(line)), `${id} missing: ${line}`);
  }
  assert.ok(tributeSets[id].length >= 4, id);
  const joined = script.join("\n");
  assert.equal(/\bshe\b/i.test(joined), false, `${id} still says she`);
  assert.equal(/\bher\b/i.test(joined), false, `${id} still says her`);
}

assert.equal(tributeSets.noshen.find((memory) => memory.id === "stare")?.freeze, true);
assert.equal(tributeSets.noshen.find((memory) => memory.id === "stare")?.slow, true);
assert.equal(tributeSets.maryam.find((memory) => memory.id === "trip")?.slow, true);
