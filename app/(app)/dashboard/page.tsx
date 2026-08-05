import { auth } from "@/lib/auth"
import { Suspense } from "react"
import { prisma } from "@/server/db"
import type { Difficulty } from "@/lib/types"
import Link from "next/link"
import {
  Zap,
  CheckCircle2,
  Flame,
  Target,
  Rocket,
  ArrowRight,
  Clock,
  RotateCcw,
} from "lucide-react"

// ---------------------------------------------------------------------------
// Helper: human-readable relative time
// ---------------------------------------------------------------------------
function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return "1d ago"
  return `${days}d ago`
}

// ---------------------------------------------------------------------------
// Difficulty badge colors (neon arcade style)
// ---------------------------------------------------------------------------
function difficultyColor(difficulty: Difficulty) {
  switch (difficulty) {
    case "easy":
      return "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
    case "medium":
      return "bg-amber-500/15 text-amber-400 border border-amber-500/30"
    case "hard":
      return "bg-red-500/15 text-red-400 border border-red-500/30"
    default:
      return "bg-zinc-800 text-zinc-400 border border-zinc-700"
  }
}

// ---------------------------------------------------------------------------
// Stat card component
// ---------------------------------------------------------------------------
function StatCard({
  icon: Icon,
  label,
  value,
  sublabel,
  accentColor,
  glowColor,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  sublabel: string
  accentColor: string
  glowColor: string
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-5 transition-all hover:border-zinc-700/80">
      <div
        className={`absolute -top-12 -right-12 h-24 w-24 rounded-full opacity-20 blur-2xl ${glowColor}`}
      />
      <div className="relative">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-medium tracking-wider text-zinc-500 uppercase">
            {label}
          </span>
          <Icon className={`h-[18px] w-[18px] ${accentColor}`} />
        </div>
        <div className={`font-mono text-3xl font-bold tracking-tight ${accentColor}`}>{value}</div>
        <p className="mt-1 text-xs text-zinc-500">{sublabel}</p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Skeleton loaders
// ---------------------------------------------------------------------------
function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="h-3 w-12 animate-pulse rounded bg-zinc-800" />
            <div className="h-4 w-4 animate-pulse rounded bg-zinc-800" />
          </div>
          <div className="h-8 w-20 animate-pulse rounded bg-zinc-800" />
          <div className="mt-2 h-3 w-24 animate-pulse rounded bg-zinc-800" />
        </div>
      ))}
    </div>
  )
}

function ContinueSkeleton() {
  return (
    <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-6">
      <div className="mb-4 flex items-center gap-2">
        <div className="h-5 w-5 animate-pulse rounded bg-zinc-800" />
        <div className="h-5 w-40 animate-pulse rounded bg-zinc-800" />
      </div>
      <div className="rounded-lg border border-zinc-800/50 bg-zinc-900/40 p-5">
        <div className="mb-3 h-5 w-48 animate-pulse rounded bg-zinc-800" />
        <div className="mb-4 flex gap-2">
          <div className="h-5 w-16 animate-pulse rounded bg-zinc-800" />
          <div className="h-5 w-16 animate-pulse rounded bg-zinc-800" />
        </div>
        <div className="h-10 w-36 animate-pulse rounded-lg bg-zinc-800" />
      </div>
    </div>
  )
}

function ActivitySkeleton() {
  return (
    <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-6">
      <div className="mb-4 h-5 w-36 animate-pulse rounded bg-zinc-800" />
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-8 w-8 animate-pulse rounded-full bg-zinc-800" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-48 animate-pulse rounded bg-zinc-800" />
              <div className="h-3 w-24 animate-pulse rounded bg-zinc-800" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Challenge-focused dashboard content (server component)
// ---------------------------------------------------------------------------
async function ChallengeDashboard() {
  const session = await auth()
  const userId = session?.user?.id

  let totalXp = 0
  let solvedCount = 0
  let totalChallenges = 0
  let currentStreak = 0
  let nextChallenge: {
    id: string
    title: string
    difficulty: Difficulty
    xpReward: number
    category: string
  } | null = null
  let recentActivity: {
    id: string
    status: string
    xpEarned: number
    updatedAt: Date
    attempts: number
    challenge: { title: string; xpReward: number }
  }[] = []
  let challengeDataAvailable = true

  try {
    const user = userId
      ? await prisma.user.findUnique({
          where: { id: userId },
          select: { totalXp: true },
        })
      : null
    totalXp = user?.totalXp ?? 0

    const [completed, total, streak, next, activity] = await Promise.all([
      userId
        ? prisma.userProgress.count({
            where: { userId, status: "completed" },
          })
        : Promise.resolve(0),

      prisma.challenge.count({ where: { isPublished: true } }),

      userId ? prisma.streak.findUnique({ where: { userId } }) : Promise.resolve(null),

      (async () => {
        if (!userId) return null
        const completedIds = (
          await prisma.userProgress.findMany({
            where: { userId, status: "completed" },
            select: { challengeId: true },
          })
        ).map((p) => p.challengeId)

        return prisma.challenge.findFirst({
          where: {
            isPublished: true,
            ...(completedIds.length > 0 ? { id: { notIn: completedIds } } : {}),
          },
          orderBy: [{ order: "asc" }],
          select: {
            id: true,
            title: true,
            difficulty: true,
            xpReward: true,
            category: true,
          },
        })
      })(),

      userId
        ? prisma.userProgress.findMany({
            where: { userId },
            take: 5,
            orderBy: { updatedAt: "desc" },
            include: {
              challenge: { select: { title: true, xpReward: true } },
            },
          })
        : Promise.resolve([]),
    ])

    solvedCount = completed
    totalChallenges = total
    currentStreak = streak?.currentStreak ?? 0
    nextChallenge = next ? { ...next, difficulty: next.difficulty as Difficulty } : null
    recentActivity = activity
  } catch {
    challengeDataAvailable = false
  }

  const todayStr = new Date().toISOString().slice(0, 10)
  const completedToday = recentActivity.filter(
    (a) => a.status === "completed" && a.updatedAt.toISOString().slice(0, 10) === todayStr
  ).length
  const dailyGoalProgress = Math.min(completedToday, 1)
  const dailyGoalPercent = dailyGoalProgress * 100

  if (!challengeDataAvailable) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-lime-500/20 bg-lime-500/10">
          <Rocket className="h-8 w-8 text-lime-400" />
        </div>
        <h2 className="mb-2 text-xl font-bold text-zinc-200">
          Set up your challenges to get started
        </h2>
        <p className="max-w-md text-sm text-zinc-500">
          The challenge system is being configured. Run database migrations to enable challenges.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={Zap}
          label="XP Earned"
          value={totalXp.toLocaleString()}
          sublabel="Total experience"
          accentColor="text-lime-400"
          glowColor="bg-lime-500"
        />
        <StatCard
          icon={CheckCircle2}
          label="Solved"
          value={`${solvedCount}/${totalChallenges}`}
          sublabel="Challenges completed"
          accentColor="text-cyan-400"
          glowColor="bg-cyan-500"
        />
        <StatCard
          icon={Flame}
          label="Streak"
          value={`${currentStreak}`}
          sublabel={currentStreak === 1 ? "day" : "days"}
          accentColor="text-amber-400"
          glowColor="bg-amber-500"
        />
        <StatCard
          icon={Target}
          label="Daily Goal"
          value={`${completedToday}/1`}
          sublabel={dailyGoalProgress >= 1 ? "Goal reached!" : "Complete 1 today"}
          accentColor={dailyGoalProgress >= 1 ? "text-lime-400" : "text-zinc-400"}
          glowColor={dailyGoalProgress >= 1 ? "bg-lime-500" : "bg-zinc-600"}
        />
      </div>

      {/* Daily Goal Progress Bar */}
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-amber-400" />
            <span className="text-sm font-medium text-zinc-300">Daily Progress</span>
          </div>
          <span className="font-mono text-xs text-zinc-500">{dailyGoalPercent}%</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${dailyGoalPercent}%`,
              background:
                dailyGoalProgress >= 1
                  ? "linear-gradient(90deg, #f59e0b, #84cc16)"
                  : "linear-gradient(90deg, #f59e0b, #fbbf24)",
            }}
          />
        </div>
      </div>

      {/* Continue Learning */}
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-6">
        <div className="mb-4 flex items-center gap-2">
          <Rocket className="h-5 w-5 text-cyan-400" />
          <h2 className="text-base font-bold tracking-wide text-zinc-300 uppercase">
            Continue Learning
          </h2>
        </div>

        {nextChallenge ? (
          <div className="rounded-lg border border-zinc-800/50 bg-zinc-950/60 p-5">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-zinc-100">{nextChallenge.title}</h3>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium capitalize ${difficultyColor(
                      nextChallenge.difficulty
                    )}`}
                  >
                    {nextChallenge.difficulty}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md border border-lime-500/20 bg-lime-500/10 px-2 py-0.5 font-mono text-xs font-medium text-lime-400">
                    <Zap className="h-3 w-3" />
                    {nextChallenge.xpReward} XP
                  </span>
                  <span className="inline-flex items-center rounded-md border border-zinc-700/50 bg-zinc-800/60 px-2 py-0.5 text-xs text-zinc-400 capitalize">
                    {nextChallenge.category}
                  </span>
                </div>
              </div>
              <Link
                href={`/challenges/${nextChallenge.id}`}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-lime-500 px-6 py-3 text-sm font-bold whitespace-nowrap text-zinc-950 shadow-lg shadow-lime-500/20 transition-all hover:bg-lime-400 hover:shadow-lime-500/30"
              >
                Start Challenge
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="mb-3 h-10 w-10 text-lime-400" />
            <p className="text-sm text-zinc-400">
              {totalChallenges === 0
                ? "No challenges available yet. Check back soon!"
                : "You have completed all available challenges. Nice work!"}
            </p>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-6">
        <div className="mb-4 flex items-center gap-2">
          <Clock className="h-[18px] w-[18px] text-zinc-500" />
          <h2 className="text-base font-bold tracking-wide text-zinc-300 uppercase">
            Recent Activity
          </h2>
        </div>

        {recentActivity.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800/60">
              <Rocket className="h-6 w-6 text-zinc-600" />
            </div>
            <p className="mb-3 text-sm text-zinc-500">
              No activity yet. Start your first challenge!
            </p>
            <Link
              href="/challenges"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-lime-400 transition-colors hover:text-lime-300"
            >
              Browse Challenges
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-1">
            {recentActivity.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-zinc-800/30"
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    entry.status === "completed"
                      ? "border border-emerald-500/30 bg-emerald-500/15"
                      : "border border-amber-500/30 bg-amber-500/15"
                  }`}
                >
                  {entry.status === "completed" ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <RotateCcw className="h-4 w-4 text-amber-400" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm text-zinc-300">
                    {entry.status === "completed" ? "Solved" : "Attempted"}{" "}
                    <span className="font-semibold text-zinc-100">
                      &ldquo;{entry.challenge.title}&rdquo;
                    </span>
                    {entry.status === "completed" && (
                      <span className="ml-1.5 font-mono text-xs font-medium text-lime-400">
                        +{entry.xpEarned} XP
                      </span>
                    )}
                    {entry.status !== "completed" && entry.attempts > 0 && (
                      <span className="ml-1.5 text-xs text-zinc-500">
                        ({entry.attempts} {entry.attempts === 1 ? "attempt" : "attempts"})
                      </span>
                    )}
                  </p>
                </div>

                <span className="shrink-0 font-mono text-xs text-zinc-600">
                  {timeAgo(new Date(entry.updatedAt))}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page (root server component)
// ---------------------------------------------------------------------------
export default async function DashboardPage() {
  const session = await auth()
  const userName = session?.user?.name || session?.user?.email?.split("@")[0] || "there"

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-100 sm:text-3xl">
          Welcome back, <span className="text-lime-400">{userName}</span>!
        </h1>
        <p className="mt-1 text-sm text-zinc-500">Here&apos;s your coding journey at a glance.</p>
      </div>

      <Suspense
        fallback={
          <div className="space-y-6">
            <StatsSkeleton />
            <ContinueSkeleton />
            <ActivitySkeleton />
          </div>
        }
      >
        <ChallengeDashboard />
      </Suspense>
    </div>
  )
}
