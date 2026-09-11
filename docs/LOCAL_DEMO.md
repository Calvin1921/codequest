# Local demo setup

## Fresh checkout

Follow the [README quick-start](../README.md#try-locally). `npm run demo:setup`:

1. Refuses existing `.env*` files (except `.env.example`) and `prisma/demo.db`.
2. Creates a private `.env` with a random auth secret, localhost URL, and `file:./demo.db`.
3. Generates Prisma Client, applies the SQLite schema, and seeds five challenges with fictional users.

Use a new registered account named **Demo Learner**, `learner@example.com`, and a disposable password you choose. No email delivery or verification is required by the credentials registration flow. Never reuse a personal password or configure real OAuth accounts for recording.

The app needs network access on first load for the Monaco CDN and development font fetching. Wait until the editor and starter code are visible before recording.

## Existing checkout / manual setup

Keep existing environments and databases intact. Prefer another fresh clone for the demo. If configuring manually, copy `.env.example` to `.env`, generate your own `AUTH_SECRET` with `openssl rand -hex 32`, and point `DATABASE_URL` at a new disposable SQLite file. Then run:

```bash
npx prisma generate
# Create the new SQLite file named by DATABASE_URL before db:push.
# Example for file:./demo.db (fails safely if it already exists):
node -e 'require("node:fs").writeFileSync("prisma/demo.db", "", {flag: "wx"})'
npm run db:push
npm run db:seed
npm run dev -- --hostname 127.0.0.1
```

**`db:seed` deletes users, challenges, progress, sessions, and streaks in the selected database.** Only run it against disposable data. The fresh-setup helper avoids that risk by rejecting an existing demo database. A second demo account gives a fresh progress story without resetting any data.

## Troubleshooting

| Symptom                               | Next step                                                                                                                                |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Setup refuses existing files          | Use a fresh clone; do not overwrite a working environment                                                                                |
| Installation or Prisma download fails | Restore network access; run `npm ci` again                                                                                               |
| Setup stops after writing `.env`      | In this fresh disposable checkout, run `npx prisma generate`, `npm run db:push`, then `npm run db:seed`; heed the deletion warning above |
| Missing auth secret / redirect issues | Check that `.env` has `AUTH_SECRET` and `AUTH_URL=http://localhost:3000`; restart the server                                             |
| Port 3000 is occupied                 | Use `npm run dev -- --hostname 127.0.0.1 --port 3001`, change `AUTH_URL` to `http://localhost:3001`, restart, and browse that URL        |
| Blank or loading editor               | Allow the Monaco CDN to load; do not capture an empty editor as the product screenshot                                                   |
| No challenges                         | Confirm you are using the fresh demo database, then seed it                                                                              |

The Playwright configuration expects port 3000. Free that port before browser tests. OAuth and Upstash are optional; no Redis means **no rate limiting**. This setup does not harden code execution for public access.
