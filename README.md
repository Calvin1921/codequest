# Next.js 15 + React 19 Production App

A production-ready Next.js application leveraging React 19's latest features including Server Components, Server Actions, and Suspense streaming.

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **React**: React 19 with Server Components
- **Database**: Prisma ORM (SQLite dev, PostgreSQL prod)
- **Authentication**: Auth.js v5 (NextAuth)
- **Styling**: Tailwind CSS + shadcn/ui
- **Testing**: Vitest, Playwright, MSW
- **Monitoring**: Sentry, OpenTelemetry
- **Deployment**: Vercel

## Features

- ✅ Server-first architecture with React Server Components
- ✅ Server Actions for mutations without API routes
- ✅ Suspense streaming for progressive UI loading
- ✅ Authentication with OAuth and credentials
- ✅ Type-safe database queries with Prisma
- ✅ Comprehensive testing setup
- ✅ Performance monitoring and error tracking
- ✅ CI/CD pipeline with GitHub Actions

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Set up the database:
```bash
npm run db:push
npm run db:seed
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Development

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
- `npm run test` - Run tests with Vitest
- `npm run test:e2e` - Run E2E tests with Playwright
- `npm run db:studio` - Open Prisma Studio

### Project Structure

```
├── app/
│   ├── (public)/       # Public routes
│   ├── (app)/          # Authenticated routes
│   ├── (modals)/       # Modal routes
│   └── api/            # API routes (webhooks only)
├── components/
│   └── ui/             # shadcn/ui components
├── server/
│   ├── actions/        # Server Actions
│   ├── db.ts           # Prisma client
│   └── services/       # Business logic
├── lib/
│   └── auth.ts         # Auth.js configuration
└── tests/              # Test files
```

## Testing

- Unit tests: `npm run test:unit`
- E2E tests: `npm run test:e2e`
- Test coverage: `npm run test -- --coverage`

## Performance

The application is optimized for:
- LCP < 2.5s
- FID < 100ms
- CLS < 0.1
- Bundle size < 150KB per route

## Deployment

The application is configured for deployment on Vercel with automatic deployments from the main branch.

## License

MIT