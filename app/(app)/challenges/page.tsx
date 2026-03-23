import { auth } from "@/lib/auth"
import prisma from "@/server/db"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

const DIFFICULTIES = ["all", "easy", "medium", "hard"] as const
const CATEGORIES = [
  "all",
  "javascript",
  "typescript",
  "algorithms",
  "react",
] as const

const DIFFICULTY_PILL_COLORS: Record<string, string> = {
  all: "border-neutral-700 text-neutral-300 hover:bg-neutral-800",
  easy: "border-green-500/30 text-green-400 hover:bg-green-500/10",
  medium: "border-amber-500/30 text-amber-400 hover:bg-amber-500/10",
  hard: "border-rose-500/30 text-rose-400 hover:bg-rose-500/10",
}

const DIFFICULTY_PILL_ACTIVE: Record<string, string> = {
  all: "bg-neutral-800 border-neutral-600 text-white",
  easy: "bg-green-500/15 border-green-500/40 text-green-400",
  medium: "bg-amber-500/15 border-amber-500/40 text-amber-400",
  hard: "bg-rose-500/15 border-rose-500/40 text-rose-400",
}

const DIFFICULTY_SORT_ORDER: Record<string, number> = {
  easy: 0,
  medium: 1,
  hard: 2,
}

// ---------------------------------------------------------------------------
// Progress Ring SVG
// ---------------------------------------------------------------------------

function ProgressRing({
  completed,
  total,
}: {
  completed: number
  total: number
}) {
  const size = 48
  const strokeWidth = 4
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = total > 0 ? completed / total : 0
  const offset = circumference - progress * circumference

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-neutral-800"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-lime-500 transition-all duration-700 ease-out"
        />
      </svg>
      <span className="absolute text-xs font-bold text-white">
        {completed}/{total}
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Filter Bar
// ---------------------------------------------------------------------------

function FilterBar({
  currentDifficulty,
  currentCategory,
}: {
  currentDifficulty: string
  currentCategory: string
}) {
  function buildHref(overrides: { difficulty?: string; category?: string }) {
    const params = new URLSearchParams()
    const d = overrides.difficulty ?? currentDifficulty
    const c = overrides.category ?? currentCategory
    if (d && d !== "all") params.set("difficulty", d)
    if (c && c !== "all") params.set("category", c)
    const qs = params.toString()
    return `/challenges${qs ? `?${qs}` : ""}`
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-neutral-500">
          Difficulty
        </span>
        {DIFFICULTIES.map((d) => {
          const isActive = currentDifficulty === d
          return (
            <Link
              key={d}
              href={buildHref({ difficulty: d })}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium capitalize transition-colors",
                isActive
                  ? DIFFICULTY_PILL_ACTIVE[d]
                  : DIFFICULTY_PILL_COLORS[d]
              )}
            >
              {d}
            </Link>
          )
        })}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-neutral-500">
          Category
        </span>
        {CATEGORIES.map((c) => {
          const isActive = currentCategory === c
          return (
            <Link
              key={c}
              href={buildHref({ category: c })}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium capitalize transition-colors",
                isActive
                  ? "border-neutral-600 bg-neutral-800 text-white"
                  : "border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
              )}
            >
              {c}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Challenge Card (inline for the list page)
// ---------------------------------------------------------------------------

function ChallengeCard({
  challenge,
}: {
  challenge: {
    id: string
    title: string
    description: string
    difficulty: string
    category: string
    xpReward: number
    timeEstimate: number
    userProgress: { status: string; xpEarned: number } | null
  }
}) {
  const isCompleted = challenge.userProgress?.status === "completed"
  const isInProgress = challenge.userProgress?.status === "in_progress"

  const difficultyGlow: Record<string, string> = {
    easy: "hover:shadow-[0_0_20px_rgba(34,197,94,0.15)]",
    medium: "hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]",
    hard: "hover:shadow-[0_0_20px_rgba(244,63,94,0.15)]",
  }

  return (
    <Link href={`/challenges/${challenge.id}`} className="block">
      <div
        className={cn(
          "group relative flex h-full flex-col rounded-xl border bg-card p-5 transition-all duration-200 cursor-pointer hover:-translate-y-0.5",
          difficultyGlow[challenge.difficulty],
          isCompleted &&
            "border-green-500/30 shadow-[0_0_12px_rgba(34,197,94,0.08)]",
          isInProgress && "border-amber-500/30",
          !isCompleted && !isInProgress && "border-neutral-800"
        )}
      >
        {/* Top row: category + difficulty badge */}
        <div className="mb-3 flex items-center justify-between">
          <span className="rounded-md bg-neutral-800 px-2 py-0.5 text-[11px] font-medium capitalize text-neutral-400">
            {challenge.category}
          </span>
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize",
              challenge.difficulty === "easy" &&
                "border-green-500/20 bg-green-500/10 text-green-400",
              challenge.difficulty === "medium" &&
                "border-amber-500/20 bg-amber-500/10 text-amber-400",
              challenge.difficulty === "hard" &&
                "border-rose-500/20 bg-rose-500/10 text-rose-400"
            )}
          >
            {challenge.difficulty}
          </span>
        </div>

        {/* Title */}
        <h3 className="mb-1.5 text-base font-semibold leading-snug text-white">
          {challenge.title}
        </h3>

        {/* Description */}
        <p className="mb-4 line-clamp-2 flex-1 text-sm leading-relaxed text-neutral-400">
          {challenge.description}
        </p>

        {/* Footer: XP + time + status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-bold tabular-nums text-lime-500">
              {isCompleted
                ? `${challenge.userProgress?.xpEarned ?? 0} XP`
                : `${challenge.xpReward} XP`}
            </span>
            {challenge.timeEstimate > 0 && (
              <span className="text-xs text-neutral-600">
                ~{Math.round(challenge.timeEstimate / 60)} min
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {isCompleted && (
              <div className="flex items-center gap-1 text-green-400">
                <svg
                  className="size-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-xs font-medium">Solved</span>
              </div>
            )}
            {isInProgress && (
              <div className="flex items-center gap-1 text-amber-400">
                <svg
                  className="size-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-xs font-medium">In Progress</span>
              </div>
            )}
            {!isCompleted && !isInProgress && (
              <div className="text-neutral-600">
                <svg
                  className="size-4"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <circle cx="10" cy="10" r="7.25" />
                </svg>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

// ---------------------------------------------------------------------------
// Challenge List (server component)
// ---------------------------------------------------------------------------

async function ChallengeList({
  difficulty,
  category,
}: {
  difficulty: string
  category: string
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const userId = session.user.id

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = { isPublished: true }
  if (difficulty && difficulty !== "all") where.difficulty = difficulty
  if (category && category !== "all") where.category = category

  const challenges = await prisma.challenge.findMany({
    where,
    orderBy: [{ order: "asc" }],
    include: {
      progress: {
        where: { userId },
        take: 1,
      },
    },
  })

  const sorted = challenges.sort((a, b) => {
    const da = DIFFICULTY_SORT_ORDER[a.difficulty] ?? 99
    const db = DIFFICULTY_SORT_ORDER[b.difficulty] ?? 99
    if (da !== db) return da - db
    return a.order - b.order
  })

  const mapped = sorted.map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    difficulty: c.difficulty,
    category: c.category,
    xpReward: c.xpReward,
    timeEstimate: c.timeEstimate,
    userProgress: c.progress[0]
      ? { status: c.progress[0].status, xpEarned: c.progress[0].xpEarned }
      : null,
  }))

  const completedCount = mapped.filter(
    (c) => c.userProgress?.status === "completed"
  ).length

  if (mapped.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-neutral-800 bg-card py-16">
        <div className="mb-4 text-neutral-700">
          <svg
            className="mx-auto size-12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
        </div>
        <h3 className="mb-1 text-lg font-semibold text-white">
          No challenges match your filters
        </h3>
        <p className="mb-4 text-sm text-neutral-500">
          Try adjusting your filters to see more challenges.
        </p>
        <Link
          href="/challenges"
          className="rounded-lg border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-300 transition-colors hover:bg-neutral-800"
        >
          Reset filters
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="mb-6 flex items-center gap-4">
        <ProgressRing completed={completedCount} total={mapped.length} />
        <div>
          <p className="text-sm font-medium text-white">
            {completedCount} of {mapped.length} completed
          </p>
          <p className="text-xs text-neutral-500">
            {mapped.length - completedCount === 0
              ? "All challenges cleared!"
              : `${mapped.length - completedCount} remaining`}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {mapped.map((challenge) => (
          <ChallengeCard key={challenge.id} challenge={challenge} />
        ))}
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function ChallengesPage({
  searchParams,
}: {
  searchParams: Promise<{ difficulty?: string; category?: string }>
}) {
  const params = await searchParams
  const difficulty = params.difficulty ?? "all"
  const category = params.category ?? "all"

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Challenges</h1>
        <p className="mt-1 text-neutral-400">
          Sharpen your skills with coding challenges. Earn XP and build your
          streak.
        </p>
      </div>

      <div className="mb-6">
        <FilterBar currentDifficulty={difficulty} currentCategory={category} />
      </div>

      <Suspense fallback={<ChallengeListSkeleton />}>
        <ChallengeList difficulty={difficulty} category={category} />
      </Suspense>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function ChallengeListSkeleton() {
  return (
    <>
      <div className="mb-6 flex items-center gap-4">
        <div className="size-12 animate-pulse rounded-full bg-neutral-800" />
        <div className="space-y-1">
          <div className="h-4 w-28 animate-pulse rounded bg-neutral-800" />
          <div className="h-3 w-20 animate-pulse rounded bg-neutral-800" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex h-48 flex-col rounded-xl border border-neutral-800 bg-card p-5"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="h-5 w-16 animate-pulse rounded bg-neutral-800" />
              <div className="h-5 w-14 animate-pulse rounded-full bg-neutral-800" />
            </div>
            <div className="mb-2 h-5 w-3/4 animate-pulse rounded bg-neutral-800" />
            <div className="mb-1 h-4 w-full animate-pulse rounded bg-neutral-800" />
            <div className="mb-4 h-4 w-2/3 animate-pulse rounded bg-neutral-800" />
            <div className="mt-auto flex items-center justify-between">
              <div className="h-4 w-16 animate-pulse rounded bg-neutral-800" />
              <div className="h-4 w-12 animate-pulse rounded bg-neutral-800" />
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
