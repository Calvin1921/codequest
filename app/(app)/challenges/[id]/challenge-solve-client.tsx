'use client'

import { useState, useCallback, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { ExecutionResult } from '@/lib/types'
import { submitSolution, saveDraft } from '@/server/actions/progress'
import type { SubmitResult } from '@/server/actions/progress'
import { ChallengeEditor } from '@/components/challenge-editor'
import { TestResults } from '@/components/test-results'
import { SolveCelebration } from '@/components/solve-celebration'
import { DifficultyBadge } from '@/components/difficulty-badge'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ChallengeSolveProps {
  challenge: {
    id: string
    title: string
    description: string
    problemStatement: string
    difficulty: string
    category: string
    starterCode: string
    testCases: string // JSON string
    hints: string // JSON string
    xpReward: number
  }
  progress?: {
    status: string
    submittedCode: string | null
    attempts: number
    xpEarned: number
  }
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function ChallengeSolveClient({
  challenge,
  progress,
}: ChallengeSolveProps) {
  const router = useRouter()

  // ---- State ----
  const [executionResult, setExecutionResult] =
    useState<ExecutionResult | null>(null)
  const [executionError, setExecutionError] = useState<string | null>(null)
  const [showCelebration, setShowCelebration] = useState(false)
  const [celebrationXp, setCelebrationXp] = useState(0)
  const [hintsRevealed, setHintsRevealed] = useState(0)
  const [showResults, setShowResults] = useState(true)

  const [isSubmitting, startSubmitTransition] = useTransition()

  const isSolved = progress?.status === 'completed'

  // Parse hints safely
  let hints: string[] = []
  try {
    hints = JSON.parse(challenge.hints) as string[]
  } catch {
    // hints stay empty
  }

  // ---- Handlers ----

  const handleSubmit = useCallback(
    (code: string) => {
      setExecutionError(null)
      startSubmitTransition(async () => {
        try {
          const result: SubmitResult = await submitSolution(
            challenge.id,
            code,
          )
          setExecutionResult(result.execution)
          setShowResults(true)

          if (result.execution.passed && !result.alreadyCompleted) {
            setCelebrationXp(result.xpAwarded)
            setShowCelebration(true)
          } else if (result.execution.error) {
            setExecutionError(result.execution.error)
          }
        } catch (err) {
          const message =
            err instanceof Error
              ? err.message
              : 'Submission failed. Please try again.'
          setExecutionError(message)
        }
      })
    },
    [challenge.id],
  )

  const handleSave = useCallback(
    (code: string) => {
      saveDraft(challenge.id, code).catch(() => {
        // save failed silently
      })
    },
    [challenge.id],
  )

  const revealNextHint = useCallback(() => {
    setHintsRevealed((prev) => Math.min(prev + 1, hints.length))
  }, [hints.length])

  // ---- Render ----

  return (
    <>
      {/* Celebration overlay */}
      {showCelebration && (
        <SolveCelebration
          xpAwarded={celebrationXp}
          onDismiss={() => setShowCelebration(false)}
          onNextChallenge={() => router.push('/challenges')}
        />
      )}

      <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
        {/* ===== Problem panel (left / top on mobile) ===== */}
        <section className="w-full shrink-0 space-y-4 lg:w-2/5">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold">{challenge.title}</h1>
              <DifficultyBadge
                difficulty={
                  challenge.difficulty as 'easy' | 'medium' | 'hard'
                }
              />
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium capitalize text-muted-foreground">
                {challenge.category}
              </span>
            </div>

            {isSolved && (
              <div className="rounded-md border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm font-medium text-green-700 dark:text-green-400">
                Solved — {progress?.xpEarned ?? 0} XP earned
              </div>
            )}
          </div>

          {/* Problem statement */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Problem</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none whitespace-pre-wrap dark:prose-invert">
                {challenge.problemStatement}
              </div>
            </CardContent>
          </Card>

          {/* Hints */}
          {hints.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">
                  Hints ({hintsRevealed}/{hints.length})
                </CardTitle>
                {hintsRevealed < hints.length && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={revealNextHint}
                  >
                    Reveal hint
                  </Button>
                )}
              </CardHeader>
              {hintsRevealed > 0 && (
                <CardContent>
                  <ol className="list-decimal space-y-2 pl-5 text-sm">
                    {hints.slice(0, hintsRevealed).map((hint, i) => (
                      <li key={i} className="text-muted-foreground">
                        {hint}
                      </li>
                    ))}
                  </ol>
                </CardContent>
              )}
            </Card>
          )}

          {/* XP reward info */}
          <p className="text-xs text-muted-foreground">
            Base reward: {challenge.xpReward} XP — bonus XP for fewer attempts
          </p>
        </section>

        {/* ===== Editor panel (right / bottom on mobile) ===== */}
        <section className="flex w-full flex-col gap-4 lg:w-3/5">
          {/* Editor — ChallengeEditor owns its own code state and action bar */}
          <Card className="overflow-hidden">
            <CardContent className="p-4">
              <ChallengeEditor
                starterCode={challenge.starterCode}
                language="javascript"
                onSubmit={handleSubmit}
                onSave={handleSave}
                isSubmitting={isSubmitting}
                previousCode={progress?.submittedCode ?? undefined}
              />
            </CardContent>
          </Card>

          {/* Execution error banner */}
          {executionError && (
            <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400">
              <p className="font-medium">Error</p>
              <p className="mt-1 font-mono text-xs">{executionError}</p>
            </div>
          )}

          {/* Test results */}
          {executionResult && executionResult.results.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Test Results</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowResults((v) => !v)}
                >
                  {showResults ? 'Hide' : 'Show'}
                </Button>
              </CardHeader>
              {showResults && (
                <CardContent>
                  <TestResults
                    results={executionResult.results}
                    passed={executionResult.passed}
                    totalTests={executionResult.totalTests}
                    passedTests={executionResult.passedTests}
                    xpAwarded={celebrationXp}
                  />
                </CardContent>
              )}
            </Card>
          )}
        </section>
      </div>
    </>
  )
}
