import { vi } from "vitest"
import "@testing-library/jest-dom"

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}))

// Mock next-auth
vi.mock("next-auth/react", () => ({
  useSession: () => ({
    data: null,
    status: "loading",
  }),
  signIn: vi.fn(),
  signOut: vi.fn(),
}))

// Set up environment variables for tests
process.env.DATABASE_URL = "file:./test.db"
process.env.AUTH_SECRET = "test-secret"
process.env.AUTH_URL = "http://localhost:3000"
