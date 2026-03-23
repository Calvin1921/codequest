import { auth } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Suspense } from "react"
import prisma from "@/server/db"
import Link from "next/link"

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
// Difficulty badge colors
// ---------------------------------------------------------------------------
function difficultyColor(difficulty: string) {
  switch (difficulty.toLowerCase()) {
    case "easy":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
    case "medium":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
    case "hard":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
    default:
      return "bg-muted text-muted-foreground"
  }
}

// ---------------------------------------------------------------------------
// Challenge-focused dashboard content (server component)
// ---------------------------------------------------------------------------
async function ChallengeDashboard() {
  const session = await auth()
  const userId = session?.user?.id

  // Fallback values in case the challenge tables haven't been migrated yet
  let totalXp = 0
  let solvedCount = 0
  let totalChallenges = 0
  let currentStreak = 0
  let nextChallenge: {
    id: string
    title: string
    difficulty: string
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
    // Fetch user's totalXp from User model (field added by schema migration)
    const user = userId
      ? await prisma.user.findUnique({ where: { id: userId }, select: { totalXp: true } })
      : null
    totalXp = (user as Record<string, unknown>)?.totalXp as number ?? 0

    // Parallel queries for challenge stats
    const [completed, total, streak, next, activity] = await Promise.all([
      // Solved challenges count
      userId
        ? prisma.userProgress.count({
            where: { userId, status: "completed" },
          })
        : Promise.resolve(0),

      // Total published challenges
      prisma.challenge.count({ where: { isPublished: true } }),

      // Streak data
      userId
        ? prisma.streak.findUnique({ where: { userId } })
        : Promise.resolve(null),

      // Next unsolved challenge: first published challenge not yet completed by user
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
          select: { id: true, title: true, difficulty: true, xpReward: true, category: true },
        })
      })(),

      // Recent activity (last 5 progress entries)
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
    currentStreak = (streak as Record<string, unknown>)?.currentStreak as number ?? 0
    nextChallenge = next
    recentActivity = activity as typeof recentActivity
  } catch {
    // Challenge tables likely don't exist yet (migration hasn't run)
    challengeDataAvailable = false
  }

  // ------- Render -------

  if (!challengeDataAvailable) {
    return (
      <Card className="flex flex-col items-center justify-center py-12">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Set up your challenges to get started</CardTitle>
          <CardDescription>
            The challenge system is being configured. Run database migrations to enable challenges.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* ── Stats Cards ─────────────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">XP Earned</CardTitle>
            <span className="text-lg" aria-hidden>&#9889;</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalXp.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total experience points</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Challenges Solved</CardTitle>
            <span className="text-lg" aria-hidden>&#10003;</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {solvedCount}/{totalChallenges}
            </div>
            <p className="text-xs text-muted-foreground">Completed challenges</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <span className="text-lg" aria-hidden>&#128293;</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentStreak} {currentStreak === 1 ? "day" : "days"}</div>
            <p className="text-xs text-muted-foreground">Keep it going!</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Daily Goal ──────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Daily Goal</CardTitle>
          <CardDescription>Complete 1 challenge today</CardDescription>
        </CardHeader>
        <CardContent>
          {(() => {
            // Check if user completed at least one challenge today
            const todayStr = new Date().toISOString().slice(0, 10)
            const completedToday = recentActivity.filter(
              (a) => a.status === "completed" && a.updatedAt.toISOString().slice(0, 10) === todayStr
            ).length
            const progress = Math.min(completedToday, 1)
            return (
              <div className="flex items-center gap-4">
                <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                  {completedToday}/1
                </span>
              </div>
            )
          })()}
        </CardContent>
      </Card>

      {/* ── Continue Learning ───────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Continue Learning</CardTitle>
          <CardDescription>Pick up where you left off</CardDescription>
        </CardHeader>
        <CardContent>
          {nextChallenge ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border rounded-lg bg-muted/30">
              <div className="space-y-1">
                <p className="font-semibold text-base">{nextChallenge.title}</p>
                <div className="flex items-center gap-2 text-sm">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${difficultyColor(
                      nextChallenge.difficulty
                    )}`}
                  >
                    {nextChallenge.difficulty}
                  </span>
                  <span className="text-muted-foreground">{nextChallenge.xpReward} XP</span>
                  <span className="text-muted-foreground capitalize">{nextChallenge.category}</span>
                </div>
              </div>
              <Link
                href={`/challenges/${nextChallenge.id}`}
                className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors whitespace-nowrap"
              >
                Start Challenge &rarr;
              </Link>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              {totalChallenges === 0
                ? "No challenges available yet. Check back soon!"
                : "You've completed all available challenges. Nice work!"}
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── Recent Activity ─────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Recent Activity</CardTitle>
          <CardDescription>Your latest challenge activity</CardDescription>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity yet. Start a challenge to begin!</p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start justify-between gap-2 text-sm"
                >
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5">
                      {entry.status === "completed" ? (
                        <span className="text-green-600 dark:text-green-400">&#10003;</span>
                      ) : (
                        <span className="text-yellow-600 dark:text-yellow-400">&#9679;</span>
                      )}
                    </span>
                    <div>
                      <p>
                        {entry.status === "completed" ? "Solved" : "Attempted"}{" "}
                        <span className="font-medium">&ldquo;{entry.challenge.title}&rdquo;</span>
                        {entry.status === "completed" && (
                          <span className="text-green-600 dark:text-green-400 ml-1">
                            (+{entry.xpEarned} XP)
                          </span>
                        )}
                        {entry.status !== "completed" && entry.attempts > 0 && (
                          <span className="text-muted-foreground ml-1">
                            ({entry.attempts} {entry.attempts === 1 ? "attempt" : "attempts"})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <span className="text-muted-foreground whitespace-nowrap text-xs mt-0.5">
                    {timeAgo(new Date(entry.updatedAt))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Posts (deprioritized) ────────────────────────────────── */}
      <Suspense
        fallback={
          <Card>
            <CardHeader className="h-12 animate-pulse bg-muted" />
            <CardContent className="h-24 animate-pulse bg-muted mt-2" />
          </Card>
        }
      >
        <PostsSummary />
      </Suspense>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Posts section (kept as a small secondary section at the bottom)
// ---------------------------------------------------------------------------
async function PostsSummary() {
  const session = await auth()

  const [postCount, recentPosts] = await Promise.all([
    prisma.post.count({ where: { authorId: session?.user?.id } }),
    prisma.post.findMany({
      where: { authorId: session?.user?.id },
      take: 3,
      orderBy: { createdAt: "desc" },
    }),
  ])

  if (postCount === 0) return null

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Your Posts</CardTitle>
        <CardDescription>{postCount} {postCount === 1 ? "post" : "posts"} total</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {recentPosts.map((post) => (
            <Link key={post.id} href="/posts" className="block">
              <div className="flex items-center justify-between p-2 hover:bg-muted rounded">
                <div>
                  <p className="font-medium text-sm">{post.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {post.published ? "Published" : "Draft"} &middot;{" "}
                    {new Date(post.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
        {postCount > 3 && (
          <Link
            href="/posts"
            className="block text-sm text-primary hover:underline mt-3"
          >
            View all posts &rarr;
          </Link>
        )}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Page (root server component)
// ---------------------------------------------------------------------------
export default async function DashboardPage() {
  const session = await auth()
  const userName = session?.user?.name || session?.user?.email || "there"

  // Try to get streak for header display
  let streakDisplay = 0
  try {
    if (session?.user?.id) {
      const streak = await prisma.streak.findUnique({
        where: { userId: session.user.id },
        select: { currentStreak: true },
      })
      streakDisplay = (streak as Record<string, unknown>)?.currentStreak as number ?? 0
    }
  } catch {
    // Streak table may not exist yet
  }

  return (
    <div>
      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {userName}!</p>
        </div>
        {streakDisplay > 0 && (
          <div className="flex items-center gap-1.5 text-lg font-semibold">
            <span aria-hidden>&#128293;</span>
            <span>{streakDisplay}</span>
          </div>
        )}
      </div>

      {/* ── Main Content ─────────────────────────────────────────── */}
      <Suspense
        fallback={
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader className="h-20 animate-pulse bg-muted rounded-t-lg" />
                  <CardContent className="h-16 animate-pulse bg-muted mt-2 rounded-b-lg" />
                </Card>
              ))}
            </div>
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="mt-4">
                <CardHeader className="h-14 animate-pulse bg-muted rounded-t-lg" />
                <CardContent className="h-20 animate-pulse bg-muted mt-2 rounded-b-lg" />
              </Card>
            ))}
          </div>
        }
      >
        <ChallengeDashboard />
      </Suspense>
    </div>
  )
}
