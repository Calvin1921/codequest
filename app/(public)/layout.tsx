import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white">
      {/* Subtle background gradient */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-[#84cc16]/[0.02] blur-[120px]" />
        <div className="absolute right-1/4 bottom-0 h-96 w-96 rounded-full bg-[#22d3ee]/[0.02] blur-[120px]" />
      </div>

      <header className="relative z-10 border-b border-white/5">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-xl font-bold tracking-tight">
            Code<span className="text-[#84cc16]">Quest</span>
          </Link>
          <nav className="flex items-center gap-3">
            <Button
              variant="ghost"
              asChild
              className="text-zinc-400 hover:bg-white/5 hover:text-white"
            >
              <Link href="/login">Login</Link>
            </Button>
            <Button
              asChild
              className="bg-[#84cc16] font-semibold text-black transition-colors hover:bg-[#a3e635]"
            >
              <Link href="/register">Sign Up</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="relative z-10">{children}</main>

      <footer className="relative z-10 mt-auto border-t border-white/5">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-6 text-sm text-zinc-600 sm:flex-row">
          <span>
            &copy; 2026 Code<span className="text-zinc-500">Quest</span>. All rights reserved.
          </span>
          <div className="flex gap-6">
            <Link href="/login" className="transition-colors hover:text-zinc-400">
              Sign In
            </Link>
            <Link href="/register" className="transition-colors hover:text-zinc-400">
              Get Started
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
