# The worlds you left with us

A Teachers' Day experience. One address. The teacher enters a name and a password, and the room that opens is theirs alone.

The site is a static page, so it can stay public on GitHub Pages without a paid server. Passwords are stored as hashes. That stops one teacher from walking into another teacher's room. It does not hide the writing from someone who reads the built files. A real secret would need a server. Do not put phone numbers, home addresses, or anything private in the lines.

## The six rooms

| Teacher | Password | World |
| --- | --- | --- |
| Miss Irum Shahid | sunlight | Chemistry. The bench, the beaker, and the memories. |
| Miss Hadia Johar | force | Physics. The spring, the orbit, and the memories. |
| Miss Noshen | future | Mathematics. The curve, the stare, and the memories. |
| Miss Kalsoom Ashraf | heart | Biology. The heart, the garden, and the memories. |
| Miss Naila Naeem | listened | English. The page, the words, and the memories. |
| Miss Maryam Ghazanfar | journey | A courtyard, a manuscript, and the memories. |

Honorifics are optional. `Miss Irum Shahid` and `irum shahid` both work.

## Run it locally

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:43123](http://127.0.0.1:43123).

## Change a teacher's room

Edit that teacher in `lib/teachers.ts`. The world reads memories, notes, books, and the finale from there. To change a password, replace `passwordHash` with the SHA-256 of the new word in lowercase, with spaces removed.

To add a photograph, put the file in `public/memories/` and add it only with that person's permission. It will be public.

`CONTENT.md` lists every memory: the detail, the object you touch, where it sits, and the tone. The notes in `teacher's day preparation/` are a checklist for gathering the real lines.

## Keep it public without paying

GitHub Pages hosts a public static site for free.

1. Create a public GitHub repository and push this project to its `main` branch.
2. In the repository, open Settings → Pages → Build and deployment, and choose GitHub Actions.
3. The workflow in `.github/workflows/pages.yml` builds the site and publishes it.

If the repository is named `your-name.github.io`, the site is served from the domain root. Any other repository name is served from `https://your-name.github.io/repository-name/`. The workflow sets that path for you.

A custom domain is a yearly purchase. The `github.io` address is the part that stays free.

## What is built

Every room opens the same way. The subject is already moving. The memories sit in that world. One click reads one. Close, or Escape, returns you. A quiet count shows how many are open. There is no score. The apparatus in the middle is the subject: it can be used without opening a memory. When the memories are all read, the letter uses those same sentences, the view pulls back, and the world ends with the teacher's name and Happy Teachers' Day.

Miss Irum, chemistry. A bench, reagent bottles, and a beaker. Copper sulfate and sodium hydroxide make pale blue copper hydroxide. Heat turns that toward copper oxide. The room warms as the memories are read. The sun is the last of them.

Miss Hadia, physics. A pendulum, a star with a real orbit, and a spring. Pull the mass and let go. A heavier mass swings more slowly. The memory still says physics isn't really the subject, and that the praise is why the work happens anyway.

Miss Noshen, mathematics. A cube turns, a spiral draws itself, and a curve follows your hand. A cartoon of her walks the room. The stare quiets the shapes, then the line about that look. The messages stay in her own words.

Miss Kalsoom, biology. An anatomical heart in a living garden. Click the heart and the trace follows one side, then the other: deoxygenated blood toward the lungs, oxygenated blood out through the aorta. The world grows warmer as the memories are read. Grade 6 / 7 is quiet, and the lines arrive with a pause. After all eight, the letter uses those same sentences, the view pulls back, and the world ends with Miss Kalsoom Ashraf and Happy Teachers' Day.

Miss Naila, English. A lamp between two windows, shelves, a desk, and words that drift. The sentence on the page changes when you choose plain, finished, or decorated. The notebooks are still the joke. The room is the place that is safe to talk.

Miss Maryam. One arch, a geometric floor, and a manuscript you can turn. The trip is the last memory, and it arrives slowly. The effort of planning it is what the words keep. The hadith of intentions is on the page, from al-Bukhari and Muslim. Nothing is scored. No place is named.

Sound can be turned off from the corner. The room goes quiet while a memory is open.

## How to add the next teacher

Each subject lives in `teachers/`. A world is a module registered in `teachers/registry.ts`. Chemistry is the pattern: its discoveries and ending are data, and the laboratory reads that data. Do not reuse the chemistry bench for another subject.

Sign out from the corner when another teacher is ready to enter.
