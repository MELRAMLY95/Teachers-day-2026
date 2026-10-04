# The worlds you left with us

A Teachers' Day experience. One address. The teacher enters a name and a password, and the room that opens is theirs alone.

The site is a static page, so it can stay public on GitHub Pages without a paid server. Passwords are stored as hashes. That stops one teacher from walking into another teacher's room. It does not hide the writing from someone who reads the built files. A real secret would need a server. Do not put phone numbers, home addresses, or anything private in the lines.

## The six rooms

| Teacher | Password | World |
| --- | --- | --- |
| Miss Irum Shahid | sunlight | Chemistry. A warm laboratory. Eight memories, then the letter. |
| Miss Hadia Johar | force | Physics. An observatory. Eight memories, then the letter. |
| Miss Noshen | future | Mathematics. The room, the stare, and eight memories. |
| Miss Kalsoom Ashraf | heart | Biology. A living heart, and the memories around it. |
| Miss Naila Naeem | listened | English. A quiet library. Eight memories, then the letter. |
| Miss Maryam Ghazanfar | journey | A quiet courtyard. Eight memories, then the letter. |

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

Every room opens the same way. The memories are already in the world. One click reads one. Close, or Escape, returns you. A quiet count shows how many are open. There is no score. When all eight are read, the letter uses those same sentences, the view pulls back, and the world ends with the teacher's name and Happy Teachers' Day.

Miss Irum, chemistry. A dark laboratory and a flask. The room warms as the memories are read. The sun is the last of them. The hour, the jokes, and the lesson nobody asked for are in the open.

Miss Hadia, physics. A star, orbits, and a wave. Physics is named as a subject that is not a natural favourite, and the want to work at it anyway is the last memory. Praise, effort, and the jokes sit around the star.

Miss Noshen, mathematics. Geometry moves in a quiet room. "I will kill you." is there as the joke it is. The stare holds the room still, then the words. OB/GYN is the last memory. The motivation line stays as it was said.

Miss Kalsoom, biology. A living heart beats in a dark garden. Eight memories sit in the open. The world grows warmer as they are read. Grade 6 / 7 is quiet, with the heart as the light, and the lines arrive with a pause. After all eight, the letter uses those same sentences, the view pulls back, and the world ends with Miss Kalsoom Ashraf and Happy Teachers' Day.

Miss Naila, English. A lamp and shelves. The notebooks are a memory: the other subjects look finished, and the English one is plain. The room is the place that is safe to talk.

Miss Maryam. One arch and a path. The trip is the last memory, and it arrives slowly. The effort of planning it is what the words keep. The hadith of intentions is quoted from al-Bukhari and Muslim. Nothing is scored. No place is named.

Sound can be turned off from the corner. The room goes quiet while a memory is open.

## How to add the next teacher

Each subject lives in `teachers/`. A world is a module registered in `teachers/registry.ts`. Chemistry is the pattern: its discoveries and ending are data, and the laboratory reads that data. Do not reuse the chemistry bench for another subject.

Sign out from the corner when another teacher is ready to enter.
