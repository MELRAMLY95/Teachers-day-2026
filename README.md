# The Worlds We Learned In

A Teachers' Day experience made by students. One address. One quiet entrance. The teacher who walks in is the only person the room was built for.

The password is only a surprise, not a lock. The site is a static page, so it can stay public on GitHub Pages without a paid server. Anyone who can open the address can also read the page source. Do not put phone numbers, home addresses, or anything private in the messages.

## Try the sample worlds

The first screen does not mention subjects. These names open the sample class. Replace them in `lib/teachers.ts` before you share the real gift.

| Teacher | Password | World |
| --- | --- | --- |
| Amira Hassan | glassware | Chemistry, the laboratory |
| Julian Okonkwo | starlight | Physics, the observatory and the sky |
| Elena Varga | goldenratio | Mathematics, the impossible room |
| Priya Nair | mitosis | Biology, the living world |
| Samuel Adeyemi | prologue | English, the library |
| Fatima Rahman | sabr | Islamiat and psychology, the inner world |

Honorifics are optional. `Dr. Amira Hassan` and `amira hassan` both work.

## Run it locally

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:43123](http://127.0.0.1:43123).

## Put your own class in

1. Edit the students in `lib/class.ts`.
2. Edit each teacher, password, and message in `lib/teachers.ts`.
3. To add a photograph, put the file in `public/memories/` and set `photo: "/memories/amina.jpg"` on that student. Add a photo only with that person's permission. It will be public.

The notes in `teacher's day preparation/` are a checklist for gathering the real lines.

## Keep it public without paying

GitHub Pages hosts a public static site for free.

1. Create a public GitHub repository and push this project to its `main` branch.
2. In the repository, open Settings → Pages → Build and deployment, and choose GitHub Actions.
3. The workflow in `.github/workflows/pages.yml` builds the site and publishes it.

If the repository is named `your-name.github.io`, the site is served from the domain root. Any other repository name is served from `https://your-name.github.io/repository-name/`. The workflow sets that path for you.

A custom domain is a yearly purchase. The `github.io` address is the part that stays free.

## What is built

Chemistry is the finished world. Sign in as Amira Hassan, password `glassware`.

The laboratory is a working practical, not a row of buttons. Pour copper sulfate, then sodium hydroxide, into the beaker by holding a bottle over its mouth. The pale blue solid is copper hydroxide, and it only darkens to copper oxide if the burner is lit and actually underneath the glass. The lens shows the same mixture as ions, bonds, and the energy of the reaction. Notes are hidden in the lab book, the drawer, the report, and the margin of the board. The classroom door opens after the practical and three of those notes.

The other teachers are in the configuration, under `teachers/`, with their own messages. Their rooms are not open yet. Signing in as one of them will say so, rather than showing a placeholder of cards.

## How to add the next teacher

Each subject lives in `teachers/`. A world is a module registered in `teachers/registry.ts`. Chemistry is the pattern: its discoveries and ending are data, and the laboratory reads that data. Do not reuse the chemistry bench for another subject.

Sign out from the corner when another teacher is ready to enter.
