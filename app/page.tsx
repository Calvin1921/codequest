import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Code2, Bot, Trophy, ChevronRight, Zap, Target, MessageSquare } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#0a0a0b] text-white">
      {/* Navigation */}
      <nav className="relative z-10 border-b border-white/5">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-xl font-bold tracking-tight">
            Code<span className="text-[#84cc16]">Quest</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              asChild
              className="text-zinc-400 hover:bg-white/5 hover:text-white"
            >
              <Link href="/login">Sign In</Link>
            </Button>
            <Button
              asChild
              className="bg-[#84cc16] font-semibold text-black transition-colors hover:bg-[#a3e635]"
            >
              <Link href="/register">Start Free</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-24 md:py-32">
        {/* Animated code background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden font-mono text-sm leading-relaxed opacity-[0.07] select-none">
          <div className="cq-code-float-1 absolute top-[10%] left-[5%] whitespace-pre">
            {`function binarySearch(arr, target) {
  let lo = 0, hi = arr.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >>> 1;
    if (arr[mid] === target) return mid;
    arr[mid] < target ? lo = mid + 1 : hi = mid - 1;
  }
  return -1;
}`}
          </div>
          <div className="cq-code-float-2 absolute top-[30%] right-[3%] whitespace-pre">
            {`class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map();
  }
  get(key) {
    if (!this.cache.has(key)) return -1;
    const val = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, val);
    return val;
  }
}`}
          </div>
          <div className="cq-code-float-3 absolute bottom-[15%] left-[15%] whitespace-pre">
            {`const mergeSort = (arr) => {
  if (arr.length <= 1) return arr;
  const mid = arr.length >> 1;
  const left = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));
  return merge(left, right);
};`}
          </div>
        </div>

        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#84cc16]/20 bg-[#84cc16]/5 px-4 py-1.5 text-sm text-[#84cc16]">
            <Zap className="h-3.5 w-3.5" />
            AI-powered interview prep for senior engineers
          </div>
          <h1 className="mb-6 text-5xl leading-[1.1] font-extrabold tracking-tight md:text-7xl">
            Master Coding <span className="text-[#84cc16]">Interviews</span>
            <br />
            <span className="text-zinc-500">Level Up Your Career</span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-zinc-400 md:text-xl">
            A gamified platform where senior engineers sharpen interview skills with real-world
            challenges, instant AI feedback, and progression tracking that keeps you motivated.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              asChild
              className="h-12 bg-[#84cc16] px-8 text-base font-semibold text-black transition-all hover:scale-[1.02] hover:bg-[#a3e635]"
            >
              <Link href="/register">
                Start Free
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="h-12 border-zinc-700 px-8 text-base text-zinc-300 hover:bg-white/5 hover:text-white"
            >
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="border-y border-white/5 bg-white/[0.02]">
        <div className="mx-auto max-w-4xl px-6 py-6 text-center">
          <p className="text-sm text-zinc-500 md:text-base">
            Join <span className="font-semibold text-zinc-300">10,000+</span> engineers preparing
            for FAANG interviews
          </p>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-4 text-center text-3xl font-bold md:text-4xl">
            Everything you need to <span className="text-[#84cc16]">ace the interview</span>
          </h2>
          <p className="mx-auto mb-14 max-w-xl text-center text-zinc-500">
            Built by engineers, for engineers. Every feature designed to maximize your preparation
            efficiency.
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="group relative rounded-xl border border-white/5 bg-white/[0.02] p-8 transition-all duration-300 hover:border-[#84cc16]/30 hover:bg-[#84cc16]/[0.03] hover:shadow-[0_0_30px_-10px_rgba(132,204,22,0.15)]">
              <div className="mb-4 inline-flex items-center justify-center rounded-lg bg-[#84cc16]/10 p-3">
                <Code2 className="h-6 w-6 text-[#84cc16]" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">Live Coding Challenges</h3>
              <p className="text-sm leading-relaxed text-zinc-400">
                Solve algorithms, data structures, and system design problems in a full-featured
                Monaco editor with syntax highlighting and multi-language support.
              </p>
            </div>

            <div className="group relative rounded-xl border border-white/5 bg-white/[0.02] p-8 transition-all duration-300 hover:border-[#22d3ee]/30 hover:bg-[#22d3ee]/[0.03] hover:shadow-[0_0_30px_-10px_rgba(34,211,238,0.15)]">
              <div className="mb-4 inline-flex items-center justify-center rounded-lg bg-[#22d3ee]/10 p-3">
                <Bot className="h-6 w-6 text-[#22d3ee]" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">AI-Powered Feedback</h3>
              <p className="text-sm leading-relaxed text-zinc-400">
                Get detailed analysis on code quality, time complexity, edge cases, and alternative
                approaches -- like having a senior engineer review every solution.
              </p>
            </div>

            <div className="group relative rounded-xl border border-white/5 bg-white/[0.02] p-8 transition-all duration-300 hover:border-[#84cc16]/30 hover:bg-[#84cc16]/[0.03] hover:shadow-[0_0_30px_-10px_rgba(132,204,22,0.15)]">
              <div className="mb-4 inline-flex items-center justify-center rounded-lg bg-[#84cc16]/10 p-3">
                <Trophy className="h-6 w-6 text-[#84cc16]" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">Gamified Learning</h3>
              <p className="text-sm leading-relaxed text-zinc-400">
                Earn XP for each challenge, maintain daily streaks, unlock achievements, and compete
                on leaderboards to stay motivated throughout your prep.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-white/5 py-20 md:py-28">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="mb-16 text-center text-3xl font-bold md:text-4xl">
            How it <span className="text-[#22d3ee]">works</span>
          </h2>
          <div className="grid gap-8 md:grid-cols-3 md:gap-12">
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-[#84cc16]/20 bg-[#84cc16]/5 text-2xl font-bold text-[#84cc16]">
                1
              </div>
              <div className="mb-3 inline-flex items-center justify-center rounded-lg bg-white/5 p-2">
                <Target className="h-5 w-5 text-zinc-400" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">Pick a Challenge</h3>
              <p className="text-sm leading-relaxed text-zinc-500">
                Choose from 200+ challenges across algorithms, data structures, system design, and
                more.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-[#22d3ee]/20 bg-[#22d3ee]/5 text-2xl font-bold text-[#22d3ee]">
                2
              </div>
              <div className="mb-3 inline-flex items-center justify-center rounded-lg bg-white/5 p-2">
                <Code2 className="h-5 w-5 text-zinc-400" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">Write Your Code</h3>
              <p className="text-sm leading-relaxed text-zinc-500">
                Solve it in our Monaco-powered editor with real-time syntax highlighting and
                autocomplete.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-[#84cc16]/20 bg-[#84cc16]/5 text-2xl font-bold text-[#84cc16]">
                3
              </div>
              <div className="mb-3 inline-flex items-center justify-center rounded-lg bg-white/5 p-2">
                <MessageSquare className="h-5 w-5 text-zinc-400" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">Get AI Feedback</h3>
              <p className="text-sm leading-relaxed text-zinc-500">
                Receive instant, detailed feedback on correctness, complexity, and code quality.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-t border-white/5 bg-white/[0.02] py-20 md:py-24">
        <div className="mx-auto max-w-4xl px-6">
          <div className="grid grid-cols-3 gap-8">
            <div className="text-center">
              <div className="mb-2 text-4xl font-extrabold text-[#84cc16] md:text-5xl">200+</div>
              <div className="text-sm tracking-wider text-zinc-500 uppercase">Challenges</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-4xl font-extrabold text-[#22d3ee] md:text-5xl">5</div>
              <div className="text-sm tracking-wider text-zinc-500 uppercase">Categories</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-4xl font-extrabold text-[#84cc16] md:text-5xl">AI</div>
              <div className="text-sm tracking-wider text-zinc-500 uppercase">Powered Feedback</div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-white/5 py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            Start Your Streak <span className="text-[#84cc16]">Today</span>
          </h2>
          <p className="mx-auto mb-10 max-w-lg text-zinc-500">
            Every day counts. Build consistency, sharpen your skills, and land the role you deserve.
          </p>
          <Button
            size="lg"
            asChild
            className="h-12 bg-gradient-to-r from-[#84cc16] to-[#65a30d] px-10 text-base font-semibold text-black transition-all hover:scale-[1.02] hover:opacity-90"
          >
            <Link href="/register">
              Start Free
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 md:flex-row">
          <div className="text-sm text-zinc-600">
            &copy; 2026 Code<span className="text-zinc-500">Quest</span>. All rights reserved.
          </div>
          <div className="flex gap-6 text-sm text-zinc-600">
            <Link href="/login" className="transition-colors hover:text-zinc-400">
              Sign In
            </Link>
            <Link href="/register" className="transition-colors hover:text-zinc-400">
              Get Started
            </Link>
          </div>
        </div>
      </footer>

      {/* CSS animations for code background */}
      <style>{`
        @keyframes cq-float-1 {
          0%, 100% { opacity: 0.3; transform: translateY(0px); }
          50% { opacity: 1; transform: translateY(-20px); }
        }
        @keyframes cq-float-2 {
          0%, 100% { opacity: 0.5; transform: translateY(0px); }
          50% { opacity: 0.2; transform: translateY(15px); }
        }
        @keyframes cq-float-3 {
          0%, 100% { opacity: 0.2; transform: translateY(0px); }
          50% { opacity: 0.7; transform: translateY(-10px); }
        }
        .cq-code-float-1 { animation: cq-float-1 8s ease-in-out infinite; }
        .cq-code-float-2 { animation: cq-float-2 10s ease-in-out infinite 2s; }
        .cq-code-float-3 { animation: cq-float-3 12s ease-in-out infinite 4s; }
      `}</style>
    </div>
  )
}
