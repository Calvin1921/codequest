import { existsSync, readdirSync, writeFileSync } from "node:fs"
import { randomBytes } from "node:crypto"
import { spawnSync } from "node:child_process"

const existingEnv = readdirSync(".").some(
  (name) => (name === ".env" || name.startsWith(".env.")) && name !== ".env.example"
)
if (existingEnv || existsSync("prisma/demo.db")) {
  console.error(
    "Demo setup requires a fresh checkout: existing environment or demo database found."
  )
  console.error("See docs/LOCAL_DEMO.md. No existing files were changed.")
  process.exit(1)
}

const databaseUrl = "file:./demo.db"
writeFileSync(
  ".env",
  `DATABASE_URL="${databaseUrl}"\nAUTH_SECRET="${randomBytes(32).toString("hex")}"\nAUTH_URL="http://localhost:3000"\n`,
  { flag: "wx", mode: 0o600 }
)

// Create the empty SQLite file explicitly for Prisma engine compatibility.
writeFileSync("prisma/demo.db", "", { flag: "wx", mode: 0o600 })

for (const args of [
  ["prisma", "generate"],
  ["prisma", "db", "push"],
  ["prisma", "db", "seed"],
]) {
  const result = spawnSync(process.platform === "win32" ? "npx.cmd" : "npx", args, {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: databaseUrl },
  })
  if (result.error || result.status !== 0) {
    console.error("Setup stopped. See docs/LOCAL_DEMO.md for recovery; your .env was preserved.")
    process.exit(1)
  }
}
console.log("Demo ready. Start the app, then register a fictional account. See docs/DEMO.md.")
