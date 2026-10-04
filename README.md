# The worlds you left with us

A Teachers' Day experience. One address. The teacher enters a name and a password, and the room that opens is theirs alone.

The site is a static page, so it can stay public on GitHub Pages without a paid server. Passwords are stored as hashes. That stops one teacher from walking into another teacher's room. It does not hide the writing from someone who reads the built files. A real secret would need a server. Do not put phone numbers, home addresses, or anything private in the lines.

## The six rooms

| Teacher | Password | World |
| --- | --- | --- |
| Miss Irum Shahid | sunlight | Chemistry. A warm laboratory. The screen stays online. |
| Miss Hadia Johar | force | Physics. An observatory. Force changes the orbit. |
| Miss Noshen | future | Mathematics. The room, the stare, and the future. |
| Miss Kalsoom Ashraf | heart | Biology. The field grows, then the heart. |
| Miss Naila Naeem | listened | English. A library, then a quiet room. |
| Miss Maryam Ghazanfar | journey | Islamiat and psychology. Three arches, then the journey. |

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

The notes in `teacher's day preparation/` are a checklist for gathering the real lines.

## Keep it public without paying

GitHub Pages hosts a public static site for free.

1. Create a public GitHub repository and push this project to its `main` branch.
2. In the repository, open Settings → Pages → Build and deployment, and choose GitHub Actions.
3. The workflow in `.github/workflows/pages.yml` builds the site and publishes it.

If the repository is named `your-name.github.io`, the site is served from the domain root. Any other repository name is served from `https://your-name.github.io/repository-name/`. The workflow sets that path for you.

A custom domain is a yearly purchase. The `github.io` address is the part that stays free.

## What is built

Miss Irum, chemistry. The laboratory starts dark. Pour copper sulfate, then sodium hydroxide, into the beaker. The pale blue solid is copper hydroxide. It becomes copper oxide only if the burner is lit underneath the glass. The lens shows the same mixture as particles, bonds, and energy. The screen stays online at 09:00, 14:00, 20:00, 01:00, and 03:47. The window, the notebook, and the drawer hold her memories. Each one adds light. The sunlight lines play only after the practical and three discoveries.

Miss Hadia, physics. Drag the gold point to apply a force. The orbit is calculated from mass and velocity. The notes in the sky join when enough of them are found and the path has actually changed.

Miss Noshen, mathematics. The lengths, the next Fibonacci number, and a quarter turn change the room. A wrong number brings the stare. The clock stays online. The door then leads through mathematics to the future.

Miss Kalsoom, biology. Click a cell and it divides. The glowing points grow the field. The heart appears after those memories, and the lines about that day are spoken one at a time.

Miss Naila, English. The books are hers. Three of them open the quiet room.

Miss Maryam, Islamiat and psychology. Three arches, no score. The hadith of intentions is quoted from al-Bukhari and Muslim. The journey is the trip she planned.

## How to add the next teacher

Each subject lives in `teachers/`. A world is a module registered in `teachers/registry.ts`. Chemistry is the pattern: its discoveries and ending are data, and the laboratory reads that data. Do not reuse the chemistry bench for another subject.

Sign out from the corner when another teacher is ready to enter.
