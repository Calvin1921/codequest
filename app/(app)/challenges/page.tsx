import { auth } from "@/lib/auth"
import prisma from "@/server/db"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const DIFFICULTIES = ["all", "easy", "medium", "hard"] as const
const CATEGORIES = [
  "all",
  "javascript",
  "typescript",
  "algorithms",
  "react",
] as const

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  medium:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  hard: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
}

const DIFFICULTY_SORT_ORDER: Record<string, number> = {
  easy: 0,
  medium: 1,
  hard: 2,
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  completed: {
    label: "Completed",
    className:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
  in_progress: {
    label: "In Progress",
    className:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  },
}

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${DIFFICULTY_COLORS[difficulty] ?? "bg-muted text-muted-foreground"}`}
    >
      {difficulty}
    </span>
  )
}

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
      <div className="flex flex-wrap gap-2">
        <span className="text-sm font-medium text-muted-foreground self-center mr-1">
          Difficulty:
        </span>
        {DIFFICULTIES.map((d) => (
          <Button
            key={d}
            variant={currentDifficulty === d ? "default" : "outline"}
            size="sm"
            asChild
          >
            <Link href={buildHref({ difficulty: d })}>
              <span className="capitalize">{d}</span>
            </Link>
          </Button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <span className="text-sm font-medium text-muted-foreground self-center mr-1">
          Category:
        </span>
        {CATEGORIES.map((c) => (
          <Button
            key={c}
            variant={currentCategory === c ? "default" : "outline"}
            size="sm"
            asChild
          >
            <Link href={buildHref({ category: c })}>
              <span className="capitalize">{c}</span>
            </Link>
          </Button>
        ))}
      </div>
    </div>
  )
}

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
  const statusInfo = challenge.userProgress
    ? STATUS_LABELS[challenge.userProgress.status]
    : null

  return (
    <Link href={`/challenges/${challenge.id}`}>
      <Card className="h-full transition-shadow hover:shadow-md cursor-pointer">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg">{challenge.title}</CardTitle>
            <DifficultyBadge difficulty={challenge.difficulty} />
          </div>
          <CardDescription className="line-clamp-2">
            {challenge.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-3">
              <span className="capitalize text-muted-foreground">
                {challenge.category}
              </span>
              <span className="text-muted-foreground">
                ~{Math.round(challenge.timeEstimate / 60)} min
              </span>
            </div>
            <div className="flex items-center gap-2">
              {statusInfo && (
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusInfo.className}`}
                >
                  {statusInfo.label}
                </span>
              )}
              <span className="font-semibold text-primary">
                {challenge.userProgress?.status === "completed"
                  ? `${challenge.userProgress.xpEarned} XP`
                  : `${challenge.xpReward} XP`}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

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

  // Sort by difficulty (easy first) then order
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
      <Card className="flex flex-col items-center justify-center py-16">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">No challenges found</CardTitle>
          <CardDescription>
            Try adjusting your filters to see more challenges.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <Link href="/challenges">Clear filters</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="mb-6 text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">{completedCount}</span>{" "}
        of{" "}
        <span className="font-semibold text-foreground">{mapped.length}</span>{" "}
        completed
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {mapped.map((challenge) => (
          <ChallengeCard key={challenge.id} challenge={challenge} />
        ))}
      </div>
    </>
  )
}

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
        <h1 className="text-3xl font-bold">Challenges</h1>
        <p className="text-muted-foreground">
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

function ChallengeListSkeleton() {
  return (
    <>
      <div className="mb-6 h-5 w-32 animate-pulse rounded bg-muted" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="h-full">
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div className="h-6 w-3/4 animate-pulse rounded bg-muted" />
                <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
              </div>
              <div className="space-y-2 mt-2">
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                <div className="h-4 w-16 animate-pulse rounded bg-muted" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  )
}
