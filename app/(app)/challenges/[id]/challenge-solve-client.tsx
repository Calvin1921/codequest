'use client'

import { useState, useCallback, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { ExecutionResult } from '@/lib/types'
import { submitSolution, saveDraft } from '@/server/actions/progress'
import type { SubmitResult } from '@/server/actions/progress'
import { ChallengeEditor } from '@/components/challenge-editor'
import { TestResults } from '@/components/test-results'
import { SolveCelebration } from '@/components/solve-celebration'
import { DifficultyBadge } from '@/components/difficulty-badge'
import ReactMarkdown from 'react-markdown'

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
    testCases: string
    hints: string
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

  const [executionResult, setExecutionResult] =
    useState<ExecutionResult | null>(null)
  const [executionError, setExecutionError] = useState<string | null>(null)
  const [showCelebration, setShowCelebration] = useState(false)
  const [celebrationXp, setCelebrationXp] = useState(0)
  const [hintsRevealed, setHintsRevealed] = useState(0)
  const [mobileTab, setMobileTab] = useState<'problem' | 'editor'>('problem')

  const [isSubmitting, startSubmitTransition] = useTransition()

  const isSolved = progress?.status === 'completed'

  const [resultsCollapsed, setResultsCollapsed] = useState(false)

  let hints: string[] = []
  try {
    hints = JSON.parse(challenge.hints) as string[]
  } catch {
    // hints stay empty
  }

  const previewTestCases = useMemo(() => {
    try {
      const allCases = JSON.parse(challenge.testCases) as Array<{
        input: unknown[]
        expected: unknown
        description: string
      }>
      return { preview: allCases.slice(0, 2), total: allCases.length }
    } catch {
      return { preview: [], total: 0 }
    }
  }, [challenge.testCases])

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
      {showCelebration && (
        <SolveCelebration
          xpAwarded={celebrationXp}
          onDismiss={() => setShowCelebration(false)}
          onNextChallenge={() => router.push('/challenges')}
        />
      )}

      {/* Mobile tab switcher */}
      <div className="flex border-b border-neutral-800 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileTab('problem')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            mobileTab === 'problem'
              ? 'border-b-2 border-lime-500 text-lime-400'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Problem
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('editor')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            mobileTab === 'editor'
              ? 'border-b-2 border-lime-500 text-lime-400'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Editor
        </button>
      </div>

      <div className="flex min-h-[calc(100vh-4rem)] flex-col lg:h-[calc(100vh-4rem)] lg:flex-row">
        {/* ===== Problem panel (left) ===== */}
        <section
          className={`flex w-full shrink-0 flex-col overflow-y-auto border-b border-neutral-800 lg:w-[35%] lg:border-b-0 lg:border-r ${
            mobileTab === 'editor' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <div className="flex flex-col gap-6 p-6 lg:p-8">
            {/* Header */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-white lg:text-2xl">
                  {challenge.title}
                </h1>
                <DifficultyBadge
                  difficulty={
                    challenge.difficulty as 'easy' | 'medium' | 'hard'
                  }
                />
              </div>

              <div className="flex items-center gap-3">
                <span className="rounded-md bg-neutral-800 px-2.5 py-1 text-xs font-medium capitalize text-neutral-400">
                  {challenge.category}
                </span>
                <span className="font-mono text-sm font-bold tabular-nums text-lime-500">
                  {challenge.xpReward} XP
                </span>
              </div>

              {isSolved && (
                <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm font-medium text-green-400">
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
                  Solved — {progress?.xpEarned ?? 0} XP earned
                </div>
              )}
            </div>

            {/* Problem statement */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-4">
                Problem
              </h3>
              <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-5">
                <div className="prose prose-invert prose-sm max-w-none text-neutral-300 prose-headings:text-white prose-headings:font-semibold prose-h1:text-lg prose-h2:text-base prose-h2:mt-5 prose-h2:mb-2 prose-code:bg-neutral-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-lime-400 prose-code:before:content-none prose-code:after:content-none prose-pre:bg-neutral-950 prose-pre:border prose-pre:border-neutral-800 prose-li:text-neutral-300 prose-strong:text-white">
                  <ReactMarkdown>{challenge.problemStatement}</ReactMarkdown>
                </div>
              </div>
            </div>

            {/* Test Cases Preview */}
            {previewTestCases.preview.length > 0 && (
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-4">
                  Test Cases{' '}
                  <span className="text-zinc-600 font-normal normal-case">
                    (showing {previewTestCases.preview.length} of{' '}
                    {previewTestCases.total})
                  </span>
                </h3>
                <div className="space-y-3">
                  {previewTestCases.preview.map((tc, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-4"
                    >
                      <p className="mb-1 text-xs font-medium text-neutral-500">
                        {tc.description}
                      </p>
                      <pre className="overflow-x-auto font-mono text-xs leading-5 text-neutral-300">
                        <span className="text-zinc-500">Input:    </span>
                        {JSON.stringify(tc.input)}
                        {'\n'}
                        <span className="text-zinc-500">Expected: </span>
                        <span className="text-lime-400">
                          {JSON.stringify(tc.expected)}
                        </span>
                      </pre>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hints */}
            {hints.length > 0 && (
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">
                    Hints ({hintsRevealed}/{hints.length})
                  </h3>
                  {hintsRevealed < hints.length && (
                    <button
                      type="button"
                      onClick={revealNextHint}
                      className="rounded-md border border-neutral-700 px-2.5 py-1 text-xs font-medium text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-neutral-200"
                    >
                      Reveal hint (no XP penalty)
                    </button>
                  )}
                </div>
                {hintsRevealed > 0 && (
                  <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-5">
                    <ol className="list-decimal space-y-2.5 pl-5 text-[15px] leading-7">
                      {hints.slice(0, hintsRevealed).map((hint, i) => (
                        <li key={i} className="text-neutral-300">
                          {hint}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            )}

            <p className="text-xs text-neutral-600">
              Base reward: {challenge.xpReward} XP — bonus XP for fewer
              attempts
            </p>
          </div>
        </section>

        {/* ===== Editor panel (right) ===== */}
        <section
          className={`flex w-full flex-col lg:min-h-0 lg:w-[65%] ${
            mobileTab === 'problem' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <div className="min-h-[300px] flex-1">
            <ChallengeEditor
              starterCode={challenge.starterCode}
              language="javascript"
              onSubmit={handleSubmit}
              onSave={handleSave}
              isSubmitting={isSubmitting}
              previousCode={progress?.submittedCode ?? undefined}
            />
          </div>

          {/* Console / Test Results area */}
          <div className="shrink-0 border-t border-neutral-800 bg-neutral-950">
            {/* Collapse/expand header */}
            <button
              type="button"
              onClick={() => setResultsCollapsed((v) => !v)}
              className="flex w-full items-center gap-2 px-4 py-2 text-xs font-medium text-neutral-400 transition-colors hover:bg-neutral-900 hover:text-neutral-200"
            >
              <svg
                className={`size-3.5 transition-transform ${
                  resultsCollapsed ? '' : 'rotate-180'
                }`}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                  clipRule="evenodd"
                />
              </svg>
              Console / Test Results
              {executionResult &&
                executionResult.results.length > 0 && (
                  <span
                    className={`ml-auto font-mono text-xs tabular-nums ${
                      executionResult.passed
                        ? 'text-green-400'
                        : 'text-amber-400'
                    }`}
                  >
                    {executionResult.passedTests}/{executionResult.totalTests}{' '}
                    passed
                  </span>
                )}
            </button>

            {!resultsCollapsed && (
              <div className="max-h-[30vh] overflow-y-auto px-5 pb-4">
                {executionError && (
                  <div className="mb-3 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm">
                    <p className="font-semibold text-red-400">Error</p>
                    <pre className="mt-1.5 overflow-x-auto whitespace-pre-wrap rounded bg-red-950/50 p-3 font-mono text-xs leading-5 text-red-300">
                      {executionError}
                    </pre>
                  </div>
                )}

                {executionResult && executionResult.results.length > 0 ? (
                  <TestResults
                    results={executionResult.results}
                    passed={executionResult.passed}
                    totalTests={executionResult.totalTests}
                    passedTests={executionResult.passedTests}
                    xpAwarded={celebrationXp}
                  />
                ) : !executionError ? (
                  <p className="py-6 text-center text-sm text-neutral-600">
                    Run tests to see results here
                  </p>
                ) : null}
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  )
}
