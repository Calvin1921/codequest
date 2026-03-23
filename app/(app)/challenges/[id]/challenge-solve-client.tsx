'use client'

import {
  useState,
  useCallback,
  useTransition,
  useMemo,
  useRef,
  useEffect,
} from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Play, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ExecutionResult } from '@/lib/types'
import { submitSolution, saveDraft } from '@/server/actions/progress'
import type { SubmitResult } from '@/server/actions/progress'
import { ChallengeEditor, type ChallengeEditorHandle } from '@/components/challenge-editor'
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
  const editorRef = useRef<ChallengeEditorHandle>(null)

  const [executionResult, setExecutionResult] =
    useState<ExecutionResult | null>(null)
  const [executionError, setExecutionError] = useState<string | null>(null)
  const [showCelebration, setShowCelebration] = useState(false)
  const [celebrationXp, setCelebrationXp] = useState(0)
  const [hintsRevealed, setHintsRevealed] = useState(0)

  // Mobile: switch between Problem / Code / Results
  const [mobileView, setMobileView] = useState<'problem' | 'code' | 'results'>('problem')

  // Left panel tabs (desktop)
  const [leftTab, setLeftTab] = useState<'problem' | 'testcases' | 'hints'>('problem')

  // Bottom right panel tabs (desktop)
  const [bottomTab, setBottomTab] = useState<'testcase' | 'result'>('result')

  const [isSubmitting, startSubmitTransition] = useTransition()

  const isSolved = progress?.status === 'completed'

  // ---- Hide sidebar on mount ----
  useEffect(() => {
    document.body.classList.add('solve-page-active')
    return () => document.body.classList.remove('solve-page-active')
  }, [])

  // ---- Resizable horizontal split (left/right) ----
  const containerRef = useRef<HTMLDivElement>(null)
  const [splitPercent, setSplitPercent] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('cq-split')
      if (stored) {
        const val = parseInt(stored, 10)
        if (val >= 25 && val <= 60) return val
      }
    }
    return 40
  })

  const splitPercentRef = useRef(splitPercent)
  useEffect(() => {
    splitPercentRef.current = splitPercent
  }, [splitPercent])

  const handleHorizontalDrag = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const startX = e.clientX
    const startPercent = splitPercentRef.current
    const container = containerRef.current
    if (!container) return

    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const handleDrag = (moveEvent: MouseEvent) => {
      const containerWidth = container.offsetWidth
      const delta = moveEvent.clientX - startX
      const deltaPercent = (delta / containerWidth) * 100
      const newPercent = Math.min(60, Math.max(25, startPercent + deltaPercent))
      setSplitPercent(Math.round(newPercent))
    }

    const handleDragEnd = () => {
      document.removeEventListener('mousemove', handleDrag)
      document.removeEventListener('mouseup', handleDragEnd)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      localStorage.setItem('cq-split', String(splitPercentRef.current))
    }

    document.addEventListener('mousemove', handleDrag)
    document.addEventListener('mouseup', handleDragEnd)
  }, [])

  // ---- Resizable vertical split (editor/results) ----
  const rightPanelRef = useRef<HTMLDivElement>(null)
  const [editorPercent, setEditorPercent] = useState(70)
  const editorPercentRef = useRef(editorPercent)
  useEffect(() => {
    editorPercentRef.current = editorPercent
  }, [editorPercent])

  const handleVerticalDrag = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const startY = e.clientY
    const startPercent = editorPercentRef.current
    const panel = rightPanelRef.current
    if (!panel) return

    document.body.style.cursor = 'row-resize'
    document.body.style.userSelect = 'none'

    const handleDrag = (moveEvent: MouseEvent) => {
      const panelHeight = panel.offsetHeight
      const delta = moveEvent.clientY - startY
      const deltaPercent = (delta / panelHeight) * 100
      const newPercent = Math.min(85, Math.max(40, startPercent + deltaPercent))
      setEditorPercent(Math.round(newPercent))
    }

    const handleDragEnd = () => {
      document.removeEventListener('mousemove', handleDrag)
      document.removeEventListener('mouseup', handleDragEnd)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.addEventListener('mousemove', handleDrag)
    document.addEventListener('mouseup', handleDragEnd)
  }, [])

  // ---- Parse data ----
  let hints: string[] = []
  try {
    hints = JSON.parse(challenge.hints) as string[]
  } catch {
    // hints stay empty
  }

  const allTestCases = useMemo(() => {
    try {
      return JSON.parse(challenge.testCases) as Array<{
        input: unknown[]
        expected: unknown
        description: string
      }>
    } catch {
      return []
    }
  }, [challenge.testCases])

  // ---- Handlers ----

  const handleSubmit = useCallback(
    (code: string) => {
      setExecutionError(null)
      setBottomTab('result')
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

  const handleRunFromToolbar = useCallback(() => {
    const code = editorRef.current?.getCode()
    if (code !== undefined) {
      handleSubmit(code)
    }
  }, [handleSubmit])

  const handleResetFromToolbar = useCallback(() => {
    editorRef.current?.reset()
  }, [])

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

      {/* ===== DESKTOP LAYOUT ===== */}
      <div className="hidden lg:flex h-screen flex-col">
        {/* Top toolbar — 40px, dark, full-width */}
        <div className="flex h-10 shrink-0 items-center justify-between border-b border-neutral-800 bg-neutral-950 px-3">
          {/* Left: navigation */}
          <div className="flex items-center gap-2 min-w-0">
            <Link
              href="/challenges"
              className="flex items-center gap-1.5 text-sm text-neutral-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Problem List</span>
            </Link>
            <span className="text-neutral-700">|</span>
            <span className="text-sm font-medium text-white truncate">
              {challenge.title}
            </span>
            <DifficultyBadge
              difficulty={challenge.difficulty as 'easy' | 'medium' | 'hard'}
            />
            {isSolved && (
              <span className="flex items-center gap-1 rounded-full bg-green-500/10 border border-green-500/20 px-2 py-0.5 text-xs font-medium text-green-400">
                Solved
              </span>
            )}
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500">⌘+Enter</span>
            <button
              type="button"
              onClick={handleRunFromToolbar}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 rounded-md border border-neutral-700 bg-neutral-800 px-3 py-1 text-sm text-neutral-300 hover:bg-neutral-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="size-3.5 animate-spin rounded-full border-2 border-neutral-400 border-t-transparent" />
              ) : (
                <Play className="h-3.5 w-3.5" />
              )}
              {isSubmitting ? 'Running...' : 'Run'}
            </button>
            <button
              type="button"
              onClick={handleRunFromToolbar}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 rounded-md bg-lime-600 px-3 py-1 text-sm font-medium text-black hover:bg-lime-500 transition-colors disabled:opacity-50"
            >
              Submit
            </button>
          </div>
        </div>

        {/* Main area: left panel + divider + right panel */}
        <div ref={containerRef} className="flex flex-1 min-h-0">
          {/* ===== Left panel ===== */}
          <section
            style={{ width: `${splitPercent}%` }}
            className="flex shrink-0 flex-col border-r border-neutral-800"
          >
            {/* Left panel tabs */}
            <div className="flex items-center border-b border-neutral-800 bg-neutral-900/50 shrink-0">
              {(['problem', 'testcases', 'hints'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setLeftTab(tab)}
                  className={cn(
                    'px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2',
                    leftTab === tab
                      ? 'border-lime-500 text-white'
                      : 'border-transparent text-neutral-500 hover:text-neutral-300'
                  )}
                >
                  {tab === 'testcases'
                    ? 'Test Cases'
                    : tab === 'hints'
                      ? `Hints (${hintsRevealed}/${hints.length})`
                      : 'Problem'}
                </button>
              ))}
            </div>

            {/* Tab content — scrollable */}
            <div className="flex-1 overflow-y-auto">
              {leftTab === 'problem' && (
                <div className="p-6">
                  {/* Header */}
                  <div className="space-y-3 mb-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-xl font-bold text-white">
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
                        <svg className="size-4" viewBox="0 0 20 20" fill="currentColor">
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
                  <div className="prose prose-invert prose-sm max-w-none text-neutral-300 prose-headings:text-white prose-headings:font-semibold prose-h1:text-lg prose-h2:text-base prose-h2:mt-5 prose-h2:mb-2 prose-code:bg-neutral-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-lime-400 prose-code:before:content-none prose-code:after:content-none prose-pre:bg-neutral-950 prose-pre:border prose-pre:border-neutral-800 prose-li:text-neutral-300 prose-strong:text-white">
                    <ReactMarkdown>{challenge.problemStatement}</ReactMarkdown>
                  </div>

                  <p className="mt-6 text-xs text-neutral-600">
                    Base reward: {challenge.xpReward} XP — bonus XP for fewer attempts
                  </p>
                </div>
              )}

              {leftTab === 'testcases' && (
                <div className="p-6">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-4">
                    Test Cases ({allTestCases.length})
                  </h3>
                  <div className="space-y-3">
                    {allTestCases.map((tc, i) => (
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
                    {allTestCases.length === 0 && (
                      <p className="text-sm text-neutral-600">No test cases available.</p>
                    )}
                  </div>
                </div>
              )}

              {leftTab === 'hints' && (
                <div className="p-6">
                  <div className="mb-4 flex items-center justify-between">
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

                  {hintsRevealed > 0 ? (
                    <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-5">
                      <ol className="list-decimal space-y-2.5 pl-5 text-[15px] leading-7">
                        {hints.slice(0, hintsRevealed).map((hint, i) => (
                          <li key={i} className="text-neutral-300">
                            {hint}
                          </li>
                        ))}
                      </ol>
                    </div>
                  ) : (
                    <p className="text-sm text-neutral-600">
                      {hints.length > 0
                        ? 'Click "Reveal hint" to see a hint. No XP penalty!'
                        : 'No hints available for this challenge.'}
                    </p>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* ===== Horizontal divider (draggable) ===== */}
          <div
            onMouseDown={handleHorizontalDrag}
            className="flex w-1.5 cursor-col-resize items-center justify-center bg-neutral-800 hover:bg-lime-500/50 transition-colors group shrink-0"
          >
            <div className="w-0.5 h-8 rounded-full bg-neutral-600 group-hover:bg-lime-400 transition-colors" />
          </div>

          {/* ===== Right panel: editor + results ===== */}
          <section ref={rightPanelRef} className="flex min-w-0 flex-1 flex-col">
            {/* Editor header */}
            <div className="flex items-center justify-between border-b border-neutral-800 bg-neutral-900/50 px-4 py-1.5 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-neutral-300">Code</span>
                <span className="text-xs text-neutral-600 font-mono">JavaScript</span>
              </div>
              <button
                type="button"
                onClick={handleResetFromToolbar}
                className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </button>
            </div>

            {/* Editor — fills top portion */}
            <div style={{ height: `${editorPercent}%` }} className="min-h-0 shrink-0">
              <ChallengeEditor
                ref={editorRef}
                starterCode={challenge.starterCode}
                language="javascript"
                onSubmit={handleSubmit}
                onSave={handleSave}
                isSubmitting={isSubmitting}
                previousCode={progress?.submittedCode ?? undefined}
              />
            </div>

            {/* Vertical divider (draggable) */}
            <div
              onMouseDown={handleVerticalDrag}
              className="h-1.5 cursor-row-resize bg-neutral-800 hover:bg-lime-500/50 transition-colors shrink-0"
            />

            {/* Bottom panel: test results */}
            <div className="flex flex-1 min-h-[100px] flex-col">
              {/* Bottom tabs */}
              <div className="flex items-center border-b border-neutral-800 bg-neutral-900/50 shrink-0">
                <button
                  type="button"
                  onClick={() => setBottomTab('testcase')}
                  className={cn(
                    'px-4 py-2 text-sm font-medium transition-colors border-b-2',
                    bottomTab === 'testcase'
                      ? 'border-lime-500 text-white'
                      : 'border-transparent text-neutral-500 hover:text-neutral-300'
                  )}
                >
                  Testcase
                </button>
                <button
                  type="button"
                  onClick={() => setBottomTab('result')}
                  className={cn(
                    'px-4 py-2 text-sm font-medium transition-colors border-b-2',
                    bottomTab === 'result'
                      ? 'border-lime-500 text-white'
                      : 'border-transparent text-neutral-500 hover:text-neutral-300'
                  )}
                >
                  Test Result
                  {executionResult && executionResult.results.length > 0 && (
                    <span
                      className={cn(
                        'ml-2 font-mono text-xs tabular-nums',
                        executionResult.passed ? 'text-green-400' : 'text-amber-400'
                      )}
                    >
                      {executionResult.passedTests}/{executionResult.totalTests}
                    </span>
                  )}
                </button>
              </div>

              {/* Bottom tab content */}
              <div className="flex-1 overflow-y-auto p-4">
                {bottomTab === 'testcase' && (
                  <div className="space-y-3">
                    {allTestCases.slice(0, 3).map((tc, i) => (
                      <div key={i} className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-3">
                        <p className="mb-1 text-xs font-medium text-neutral-500">{tc.description}</p>
                        <pre className="overflow-x-auto font-mono text-xs leading-5 text-neutral-300">
                          <span className="text-zinc-500">Input:    </span>
                          {JSON.stringify(tc.input)}
                          {'\n'}
                          <span className="text-zinc-500">Expected: </span>
                          <span className="text-lime-400">{JSON.stringify(tc.expected)}</span>
                        </pre>
                      </div>
                    ))}
                  </div>
                )}

                {bottomTab === 'result' && (
                  <>
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
                  </>
                )}
              </div>
            </div>

            {/* Status bar */}
            <div className="flex items-center justify-between border-t border-neutral-800 bg-neutral-950 px-4 py-1 text-xs text-neutral-600 shrink-0">
              <span>{isSolved ? 'Solved' : 'Unsaved'}</span>
              <span className="font-mono">JavaScript</span>
            </div>
          </section>
        </div>
      </div>

      {/* ===== MOBILE LAYOUT ===== */}
      <div className="flex lg:hidden h-screen flex-col">
        {/* Mobile toolbar */}
        <div className="flex h-10 shrink-0 items-center justify-between border-b border-neutral-800 bg-neutral-950 px-3">
          <div className="flex items-center gap-2 min-w-0">
            <Link
              href="/challenges"
              className="flex items-center text-neutral-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
            <span className="text-sm font-medium text-white truncate">
              {challenge.title}
            </span>
          </div>
          <button
            type="button"
            onClick={handleRunFromToolbar}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 rounded-md bg-lime-600 px-3 py-1 text-sm font-medium text-black hover:bg-lime-500 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="size-3.5 animate-spin rounded-full border-2 border-black border-t-transparent" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
            {isSubmitting ? 'Running...' : 'Submit'}
          </button>
        </div>

        {/* Mobile content area */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {mobileView === 'problem' && (
            <div className="p-4">
              <div className="space-y-3 mb-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-lg font-bold text-white">
                    {challenge.title}
                  </h1>
                  <DifficultyBadge
                    difficulty={challenge.difficulty as 'easy' | 'medium' | 'hard'}
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
                    Solved — {progress?.xpEarned ?? 0} XP earned
                  </div>
                )}
              </div>

              <div className="prose prose-invert prose-sm max-w-none text-neutral-300 prose-headings:text-white prose-headings:font-semibold prose-h1:text-lg prose-h2:text-base prose-h2:mt-5 prose-h2:mb-2 prose-code:bg-neutral-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-lime-400 prose-code:before:content-none prose-code:after:content-none prose-pre:bg-neutral-950 prose-pre:border prose-pre:border-neutral-800 prose-li:text-neutral-300 prose-strong:text-white">
                <ReactMarkdown>{challenge.problemStatement}</ReactMarkdown>
              </div>

              {/* Hints inline on mobile */}
              {hints.length > 0 && (
                <div className="mt-6">
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
                        Reveal hint
                      </button>
                    )}
                  </div>
                  {hintsRevealed > 0 && (
                    <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-4">
                      <ol className="list-decimal space-y-2 pl-5 text-sm leading-6">
                        {hints.slice(0, hintsRevealed).map((hint, i) => (
                          <li key={i} className="text-neutral-300">{hint}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {mobileView === 'code' && (
            <div className="h-full">
              <ChallengeEditor
                ref={editorRef}
                starterCode={challenge.starterCode}
                language="javascript"
                onSubmit={handleSubmit}
                onSave={handleSave}
                isSubmitting={isSubmitting}
                previousCode={progress?.submittedCode ?? undefined}
              />
            </div>
          )}

          {mobileView === 'results' && (
            <div className="p-4">
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

        {/* Mobile bottom tab bar */}
        <div className="flex shrink-0 border-t border-neutral-800 bg-neutral-950">
          {(['problem', 'code', 'results'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setMobileView(tab)}
              className={cn(
                'flex-1 py-3 text-sm font-medium capitalize transition-colors',
                mobileView === tab
                  ? 'border-t-2 border-lime-500 text-lime-400'
                  : 'text-neutral-500 hover:text-neutral-300'
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
