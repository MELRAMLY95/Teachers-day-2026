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

Miss Irum, chemistry. The laboratory is wider than the screen. Drag the empty bench, or use the arrow keys, to look around. Pour copper sulfate, then sodium hydroxide, into the beaker. The pale blue solid is copper hydroxide. It becomes copper oxide only if the burner is lit underneath the glass. The lens shows the same mixture as particles, bonds, and energy. The screen stays online at 09:00, 14:00, 20:00, 01:00, and 03:47. The window stays dark until two things have been found. Each discovery lets more sunlight in. The letter plays only after the practical and three discoveries.

Miss Hadia, physics. Drag the empty sky. Some notes are further out, and each one adds a ring of force around the star. Drag the gold point to apply a force. The orbit is calculated from mass and velocity. The door opens only after the path has actually changed and four notes are found.

Miss Noshen, mathematics. Drag the floor. The lengths are in the first part of the room, the sequence further along, the quarter turn after that. A wrong number brings the stare and shears the walls. The clock stays online. The door opens when the room has been solved.

Miss Kalsoom, biology. Drag the field. Click a cell and it divides. The glowing points are off to the sides, and each one grows the field. The heart appears further along, and those lines are read in the field, one click at a time.

Miss Naila, English. Drag the shelves. The books are spaced along them. Opening three of them lights the quiet room at the far end.

Miss Maryam, Islamiat and psychology. Drag the path. The arches are spaced along it. Nothing is scored. The hadith of intentions is quoted from al-Bukhari and Muslim. The journey is the trip she planned, at the end of the path.

Sound can be turned off from the corner. The room goes quiet for the letter.

## How to add the next teacher

Each subject lives in `teachers/`. A world is a module registered in `teachers/registry.ts`. Chemistry is the pattern: its discoveries and ending are data, and the laboratory reads that data. Do not reuse the chemistry bench for another subject.

Sign out from the corner when another teacher is ready to enter.
