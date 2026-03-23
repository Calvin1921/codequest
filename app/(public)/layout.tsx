import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white">
      {/* Subtle background gradient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#84cc16]/[0.02] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#22d3ee]/[0.02] rounded-full blur-[120px]" />
      </div>

      <header className="relative z-10 border-b border-white/5">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight">
            Code<span className="text-[#84cc16]">Quest</span>
          </Link>
          <nav className="flex items-center gap-3">
            <Button
              variant="ghost"
              asChild
              className="text-zinc-400 hover:text-white hover:bg-white/5"
            >
              <Link href="/login">Login</Link>
            </Button>
            <Button
              asChild
              className="bg-[#84cc16] text-black font-semibold hover:bg-[#a3e635] transition-colors"
            >
              <Link href="/register">Sign Up</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="relative z-10">
        {children}
      </main>

      <footer className="relative z-10 border-t border-white/5 mt-auto">
        <div className="mx-auto max-w-6xl px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-zinc-600">
          <span>&copy; 2026 Code<span className="text-zinc-500">Quest</span>. All rights reserved.</span>
          <div className="flex gap-6">
            <Link href="/login" className="hover:text-zinc-400 transition-colors">
              Sign In
            </Link>
            <Link href="/register" className="hover:text-zinc-400 transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
