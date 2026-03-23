import { auth } from "@/lib/auth"
import prisma from "@/server/db"
import { redirect, notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { HintAccordion } from "./hint-accordion"

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  medium:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  hard: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
}

export default async function ChallengeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const userId = session.user.id

  const challenge = await prisma.challenge.findUnique({
    where: { id },
    include: {
      progress: {
        where: { userId },
        take: 1,
      },
    },
  })

  if (!challenge) {
    notFound()
  }

  const userProgress = challenge.progress[0] ?? null
  const isCompleted = userProgress?.status === "completed"

  let hints: string[] = []
  try {
    hints = JSON.parse(challenge.hints)
  } catch {
    // hints remain empty
  }

  let examples: { input: string; expected: string; description: string }[] = []
  try {
    const testCases = JSON.parse(challenge.testCases)
    // Show first 2 test cases as examples (don't reveal all)
    examples = testCases
      .slice(0, 2)
      .map(
        (tc: {
          input: unknown[]
          expected: unknown
          description: string
        }) => ({
          input: tc.input
            .map((a: unknown) => JSON.stringify(a))
            .join(", "),
          expected: JSON.stringify(tc.expected),
          description: tc.description,
        })
      )
  } catch {
    // examples remain empty
  }

  const displayCode = userProgress?.submittedCode ?? challenge.starterCode

  return (
    <div>
      {/* Success banner for completed challenges */}
      {isCompleted && userProgress && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 dark:border-green-800 dark:bg-green-950/30">
          <div className="flex items-center gap-3">
            <span className="text-2xl">&#10003;</span>
            <div>
              <p className="font-semibold text-green-800 dark:text-green-300">
                Challenge Completed!
              </p>
              <p className="text-sm text-green-700 dark:text-green-400">
                You earned {userProgress.xpEarned} XP
                {userProgress.completedAt && (
                  <>
                    {" "}
                    on{" "}
                    {new Date(
                      userProgress.completedAt
                    ).toLocaleDateString()}
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left panel: Problem description */}
        <div className="space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold">{challenge.title}</h1>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${DIFFICULTY_COLORS[challenge.difficulty] ?? "bg-muted text-muted-foreground"}`}
              >
                {challenge.difficulty}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="capitalize">{challenge.category}</span>
              <span>{challenge.xpReward} XP</span>
              <span>
                ~{Math.round(challenge.timeEstimate / 60)} min
              </span>
              {userProgress && userProgress.attempts > 0 && (
                <span>
                  {userProgress.attempts} attempt
                  {userProgress.attempts !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>

          {/* Problem statement */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Problem</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {challenge.problemStatement
                  .split("\n")
                  .map((line, i) => (
                    <p key={i}>{line || "\u00A0"}</p>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Examples */}
          {examples.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Examples</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {examples.map((ex, i) => (
                    <div key={i} className="rounded-md border p-3">
                      <p className="mb-1 text-sm font-medium text-muted-foreground">
                        {ex.description}
                      </p>
                      <div className="space-y-1 text-sm font-mono">
                        <p>
                          <span className="text-muted-foreground">
                            Input:{" "}
                          </span>
                          {ex.input}
                        </p>
                        <p>
                          <span className="text-muted-foreground">
                            Output:{" "}
                          </span>
                          {ex.expected}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Hints */}
          {hints.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Hints ({hints.length} available)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <HintAccordion
                  challengeId={challenge.id}
                  totalHints={hints.length}
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right panel: Code editor placeholder */}
        <div className="space-y-4">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="text-base">Code Editor</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                id="editor-mount"
                className="min-h-[400px] rounded-md border bg-muted/30"
              >
                <div className="p-4">
                  <p className="mb-3 text-sm text-muted-foreground">
                    Editor loading...
                  </p>
                  <pre className="overflow-x-auto rounded-md bg-zinc-950 p-4 text-sm text-zinc-100 dark:bg-zinc-900">
                    <code>{displayCode}</code>
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
