'use client'

import { useState, useCallback, useTransition } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Types — duplicated here until lib/types.ts is merged from another branch.
// TODO: Replace with `import type { TestResult, ExecutionResult } from '@/lib/types'`
// ---------------------------------------------------------------------------

interface TestResult {
  description: string
  input: unknown[]
  expected: unknown
  actual: unknown
  passed: boolean
  error?: string
  executionTimeMs: number
}

interface ExecutionResult {
  passed: boolean
  results: TestResult[]
  totalTests: number
  passedTests: number
  error?: string
  executionTimeMs: number
}

interface SubmitResult {
  execution: ExecutionResult
  xpAwarded: number
  alreadyCompleted: boolean
}

// ---------------------------------------------------------------------------
// Stub server actions — these mirror the real signatures in
// server/actions/progress.ts which another agent is building concurrently.
// TODO: Replace with `import { submitSolution, saveDraft } from '@/server/actions/progress'`
// ---------------------------------------------------------------------------

async function submitSolution(
  challengeId: string,
  userCode: string,
): Promise<SubmitResult> {
  // Simulated network delay
  await new Promise((r) => setTimeout(r, 800))
  return {
    execution: {
      passed: false,
      results: [
        {
          description: 'Example test (stub)',
          input: [],
          expected: true,
          actual: undefined,
          passed: false,
          executionTimeMs: 0,
        },
      ],
      totalTests: 1,
      passedTests: 0,
      error: 'Server action not yet available — stub response',
      executionTimeMs: 0,
    },
    xpAwarded: 0,
    alreadyCompleted: false,
  }
}

async function saveDraft(
  challengeId: string,
  userCode: string,
): Promise<{ success: boolean }> {
  await new Promise((r) => setTimeout(r, 300))
  return { success: true }
}

// ---------------------------------------------------------------------------
// Stub components for modules that other agents are building concurrently.
// Each stub mirrors the expected public API so this file compiles standalone.
// After merge the real implementations will be swapped in via the imports.
// ---------------------------------------------------------------------------

// TODO: Replace with `import { ChallengeEditor } from '@/components/challenge-editor'`
function ChallengeEditor({
  code,
  onChange,
  language = 'javascript',
}: {
  code: string
  onChange: (value: string) => void
  language?: string
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b bg-muted/40 px-3 py-1.5">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {language}
        </span>
      </div>
      <textarea
        aria-label="Code editor"
        className="flex-1 resize-none bg-background p-4 font-mono text-sm focus:outline-none"
        value={code}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
      />
    </div>
  )
}

// TODO: Replace with `import { TestResults } from '@/components/test-results'`
function TestResultsPanel({ results }: { results: TestResult[] }) {
  const passedCount = results.filter((r) => r.passed).length
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">
        Tests: {passedCount}/{results.length} passed
      </p>
      <ul className="space-y-1.5">
        {results.map((r, i) => (
          <li
            key={i}
            className={cn(
              'rounded-md border px-3 py-2 text-sm',
              r.passed
                ? 'border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400'
                : 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400',
            )}
          >
            <span className="font-medium">{r.passed ? 'PASS' : 'FAIL'}</span>{' '}
            {r.description}
            {!r.passed && r.error && (
              <p className="mt-1 text-xs opacity-80">{r.error}</p>
            )}
            {!r.passed && !r.error && (
              <p className="mt-1 text-xs opacity-80">
                Expected: {JSON.stringify(r.expected)} | Got:{' '}
                {JSON.stringify(r.actual)}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

// TODO: Replace with `import { SolveCelebration } from '@/components/solve-celebration'`
function SolveCelebration({
  xpEarned,
  onDismiss,
  nextChallengeHref,
}: {
  xpEarned: number
  onDismiss: () => void
  nextChallengeHref?: string
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <Card className="mx-4 w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-2xl">Challenge Complete!</CardTitle>
          <p className="text-muted-foreground text-sm">
            You earned{' '}
            <span className="font-bold text-primary">{xpEarned} XP</span>
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {nextChallengeHref && (
            <Button asChild>
              <Link href={nextChallengeHref}>Next Challenge</Link>
            </Button>
          )}
          <Button variant="ghost" onClick={onDismiss}>
            Stay Here
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Difficulty badge
// ---------------------------------------------------------------------------

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30',
  medium:
    'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/30',
  hard: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30',
}

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize',
        DIFFICULTY_COLORS[difficulty] ?? 'bg-muted text-muted-foreground',
      )}
    >
      {difficulty}
    </span>
  )
}

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
  // ---- State ----
  const [code, setCode] = useState(
    progress?.submittedCode ?? challenge.starterCode,
  )
  const [results, setResults] = useState<TestResult[] | null>(null)
  const [executionError, setExecutionError] = useState<string | null>(null)
  const [showCelebration, setShowCelebration] = useState(false)
  const [celebrationXp, setCelebrationXp] = useState(0)
  const [hintsRevealed, setHintsRevealed] = useState(0)
  const [showResults, setShowResults] = useState(true)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  const [isSubmitting, startSubmitTransition] = useTransition()
  const [isSaving, startSaveTransition] = useTransition()

  const isSolved = progress?.status === 'completed'

  // Parse hints safely
  let hints: string[] = []
  try {
    hints = JSON.parse(challenge.hints) as string[]
  } catch {
    // hints stay empty
  }

  // ---- Handlers ----

  const handleSubmit = useCallback(() => {
    setExecutionError(null)
    startSubmitTransition(async () => {
      try {
        const result: SubmitResult = await submitSolution(challenge.id, code)
        setResults(result.execution.results)
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
  }, [challenge.id, code])

  const handleSave = useCallback(() => {
    setSaveMessage(null)
    startSaveTransition(async () => {
      try {
        await saveDraft(challenge.id, code)
        setSaveMessage('Draft saved')
        setTimeout(() => setSaveMessage(null), 2000)
      } catch {
        setSaveMessage('Failed to save')
        setTimeout(() => setSaveMessage(null), 3000)
      }
    })
  }, [challenge.id, code])

  const revealNextHint = useCallback(() => {
    setHintsRevealed((prev) => Math.min(prev + 1, hints.length))
  }, [hints.length])

  // ---- Render ----

  return (
    <>
      {/* Celebration overlay */}
      {showCelebration && (
        <SolveCelebration
          xpEarned={celebrationXp}
          onDismiss={() => setShowCelebration(false)}
          nextChallengeHref="/dashboard"
        />
      )}

      <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
        {/* ===== Problem panel (left / top on mobile) ===== */}
        <section className="w-full shrink-0 space-y-4 lg:w-2/5">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold">{challenge.title}</h1>
              <DifficultyBadge difficulty={challenge.difficulty} />
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
                  <Button variant="outline" size="sm" onClick={revealNextHint}>
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
          {/* Editor */}
          <Card className="flex flex-col overflow-hidden">
            <div className="min-h-[350px] flex-1 lg:min-h-[450px]">
              <ChallengeEditor code={code} onChange={setCode} />
            </div>

            {/* Action bar */}
            <div className="flex items-center gap-2 border-t px-4 py-3">
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Running...' : 'Submit'}
              </Button>
              <Button
                variant="outline"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Draft'}
              </Button>
              {saveMessage && (
                <span className="text-xs text-muted-foreground">
                  {saveMessage}
                </span>
              )}
            </div>
          </Card>

          {/* Execution error banner */}
          {executionError && (
            <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400">
              <p className="font-medium">Error</p>
              <p className="mt-1 font-mono text-xs">{executionError}</p>
            </div>
          )}

          {/* Test results */}
          {results && results.length > 0 && (
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
                  <TestResultsPanel results={results} />
                </CardContent>
              )}
            </Card>
          )}
        </section>
      </div>
    </>
  )
}
