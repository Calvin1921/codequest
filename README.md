# CodeQuest — Gamified Coding Interview Platform

> A Duolingo-inspired platform for senior engineers to practice coding interviews with real-time code execution, AI feedback, and gamification.

![Next.js](https://img.shields.io/badge/Next.js-15.5-black?logo=next.js)
![React](https://img.shields.io/badge/React-19.1-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss)

## Screenshots

### Landing Page
![Landing Page](/public/screenshots/landing.png)

### Dashboard
![Dashboard](/public/screenshots/dashboard.png)

### Challenge List
![Challenge List](/public/screenshots/challenges.png)

### Challenge Solve Page (LeetCode-style IDE)
![Solve Page](/public/screenshots/solve-page.png)

### Registration
![Register](/public/screenshots/register.png)

### Mobile Views
<p float="left">
  <img src="/public/screenshots/mobile-challenges.png" width="250" alt="Mobile Challenges" />
  <img src="/public/screenshots/mobile-solve.png" width="250" alt="Mobile Solve" />
</p>

## Features

- **Interactive Coding Challenges** — Solve problems in a LeetCode-style IDE with Monaco Editor, markdown problem statements, and expandable hints
- **Server-side Code Execution** — Sandboxed Node.js `vm` module with 5-second timeout per test case, deep equality checking, and class-based challenge support
- **Gamification** — XP rewards with difficulty multipliers and attempt bonuses, streak tracking with freeze protection, daily goals, and celebration animations with confetti
- **Authentication** — NextAuth v5 (Auth.js) with credentials login, GitHub OAuth, and Google OAuth
- **Responsive Design** — Full desktop IDE layout with collapsible sidebar (Cmd+B) and resizable panels, plus mobile-optimized layout with bottom tab navigation
- **Dark Theme** — "Neon Arcade" design system with lime/cyan/amber accents on zinc-950 backgrounds
- **Rate Limiting** — Upstash Redis-based sliding window rate limiting for auth, posts, and API endpoints (gracefully skipped when unconfigured)
- **Observability** — Sentry error tracking and OpenTelemetry instrumentation, Vercel Analytics
- **Security Headers** — CSP, HSTS, X-Frame-Options, Referrer-Policy, and Permissions-Policy configured out of the box

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 15.5](https://nextjs.org/) (App Router, Turbopack) |
| UI | [React 19.1](https://react.dev/) (Server Components, Server Actions, Suspense) |
| Language | [TypeScript 5](https://www.typescriptlang.org/) |
| Database | [Prisma 6](https://www.prisma.io/) ORM (SQLite dev, PostgreSQL prod-ready) |
| Auth | [Auth.js v5](https://authjs.dev/) (NextAuth) with Prisma adapter |
| Styling | [Tailwind CSS 4](https://tailwindcss.com/) + [Radix UI](https://www.radix-ui.com/) primitives |
| Code Editor | [Monaco Editor](https://microsoft.github.io/monaco-editor/) via `@monaco-editor/react` |
| Rate Limiting | [Upstash Redis](https://upstash.com/) + `@upstash/ratelimit` |
| Monitoring | [Sentry](https://sentry.io/) + [OpenTelemetry](https://opentelemetry.io/) + [Vercel Analytics](https://vercel.com/analytics) |
| Testing | [Vitest](https://vitest.dev/) + [Playwright](https://playwright.dev/) + [MSW](https://mswjs.io/) + [Testing Library](https://testing-library.com/) |
| Icons | [Lucide React](https://lucide.dev/) |
| Validation | [Zod 4](https://zod.dev/) + [React Hook Form](https://react-hook-form.com/) |
| Bundle Analysis | `@next/bundle-analyzer` |

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Setup

```bash
git clone https://github.com/Calvin1921/codequest.git
cd codequest
npm install
cp .env.example .env
npx prisma db push
npx prisma db seed
npm run dev
```

The app will be running at [http://localhost:3000](http://localhost:3000).

### Environment Variables

```bash
# Database — SQLite for local dev, swap to PostgreSQL for production
DATABASE_URL="file:./dev.db"

# Auth.js — generate with: openssl rand -hex 32
AUTH_SECRET="your-auth-secret-here"
AUTH_URL="http://localhost:3000"

# OAuth Providers (optional — credentials auth works without these)
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Upstash Redis (optional — rate limiting is skipped if not configured)
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""

# Sentry (optional — error tracking disabled if not configured)
SENTRY_DSN=""
SENTRY_AUTH_TOKEN=""
SENTRY_ORG=""
SENTRY_PROJECT=""

# Vercel (set automatically on Vercel deployments)
VERCEL_URL=""
```

## Architecture

### Project Structure

```
src/
├── app/
│   ├── (app)/                    # Authenticated routes (sidebar layout)
│   │   ├── challenges/           # Challenge list + solve pages
│   │   │   └── [id]/             # Full-screen IDE solve page
│   │   ├── dashboard/            # Stats, streaks, recent activity
│   │   ├── posts/                # Community posts (CRUD + modals)
│   │   ├── settings/             # User settings
│   │   ├── layout.tsx            # Sidebar + mobile nav layout
│   │   └── @modal/               # Parallel route for modals
│   ├── (public)/                 # Unauthenticated routes
│   │   ├── login/                # Sign-in page
│   │   └── register/             # Registration page
│   ├── api/auth/                 # Auth.js API route handler
│   ├── layout.tsx                # Root layout (fonts, metadata)
│   └── page.tsx                  # Landing page
├── components/
│   ├── ui/                       # Radix-based primitives (button, card, dialog, etc.)
│   ├── forms/                    # Optimistic form components
│   ├── challenge-editor.tsx      # Monaco Editor wrapper with imperative handle
│   ├── challenge-card.tsx        # Challenge list item with progress indicator
│   ├── solve-celebration.tsx     # XP award modal with confetti animation
│   ├── sidebar-wrapper.tsx       # Collapsible sidebar (localStorage + Cmd+B)
│   ├── streak-display.tsx        # Streak counter with fire icon
│   ├── daily-goal.tsx            # Daily challenge goal tracker
│   └── test-results.tsx          # Per-test-case pass/fail display
├── hooks/
│   └── use-action-state-extended.ts  # Enhanced useActionState wrapper
├── lib/
│   ├── auth.ts                   # NextAuth v5 configuration (credentials + OAuth)
│   ├── code-executor.ts          # Sandboxed vm.runInContext with timeout enforcement
│   ├── types.ts                  # TestCase, TestResult, ExecutionResult types
│   └── utils.ts                  # cn() utility (clsx + tailwind-merge)
├── server/
│   ├── db.ts                     # Prisma client singleton
│   ├── ratelimit.ts              # Upstash rate limiter factory
│   └── actions/                  # Server Actions
│       ├── auth.ts               # Register / login actions
│       ├── challenges.ts         # Challenge CRUD queries
│       ├── posts.ts              # Post CRUD with rate limiting
│       ├── progress.ts           # Solution submission + XP award (transactional)
│       ├── streak.ts             # Streak calculation with freeze logic
│       └── user.ts               # Profile update actions
├── prisma/
│   ├── schema.prisma             # Database schema (User, Challenge, Progress, Streak)
│   └── seed.ts                   # Seed data with demo user + challenges
├── scripts/
│   └── verify.ts                 # CLI verification suite (12 backend tests)
├── tests/                        # Vitest unit tests + MSW mocks
├── e2e/                          # Playwright E2E + accessibility tests
└── sentry.*.config.ts            # Sentry client/server/edge configuration
```

### Key Design Decisions

- **Server-side code execution** via Node.js `vm` module (not client-side eval or Sandpack) for security and anti-cheat — user code runs in an isolated context with no access to host `console`, `process`, or `Function` constructors
- **Server Components by default** — data fetching happens on the server; Client Components are used only where interactivity is needed (editor, sidebar toggle, celebration modal)
- **Resizable IDE panels** — the solve page uses ref-based mouse drag for panel resizing with no React re-renders during the drag operation
- **Full-screen solve page** — hides the sidebar layout via CSS class toggle rather than a separate route group, avoiding layout re-mounts and preserving React state
- **Transactional XP awards** — `prisma.$transaction` prevents race conditions where concurrent submissions could double-award XP
- **Streak freeze system** — users get 1 freeze per streak to protect against missed days, consumed lazily on the next activity

### Data Flow

```
User writes code in Monaco Editor
  -> "Run" button triggers submitSolution() server action
    -> Server parses challenge test cases from JSON
      -> executeCode() creates isolated vm.Context per test case
        -> Each test case runs with 5-second timeout
          -> Results compared via deep equality
            -> All pass? -> Prisma transaction: upsert progress + increment XP
              -> updateStreak() extends or creates streak record
                -> Client receives { execution, xpAwarded, alreadyCompleted }
                  -> SolveCelebration modal with confetti + XP counter animation
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with Turbopack |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript compiler (no emit) |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check formatting without writing |
| `npm run test` | Run Vitest in watch mode |
| `npm run test:unit` | Run Vitest once |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run analyze` | Build with bundle analyzer |
| `npm run db:push` | Push Prisma schema to database |
| `npm run db:migrate` | Create Prisma migration |
| `npm run db:seed` | Seed database with demo data |
| `npm run db:studio` | Open Prisma Studio GUI |
| `npm run verify` | Run CLI verification tool |
| `npm run verify:all` | Run full CLI verification suite (12 tests) |

## Testing

```bash
# CLI verification suite — tests code executor, XP calculation, streak logic, and DB operations
npm run verify:all

# Unit tests with Vitest
npm run test:unit

# E2E tests with Playwright (includes accessibility checks via axe-core)
npm run test:e2e
```

## License

MIT
