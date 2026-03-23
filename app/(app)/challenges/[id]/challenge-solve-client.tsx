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
import { submitSolution } from '@/server/actions/progress'
import type { SubmitResult } from '@/server/actions/progress'
import { ChallengeEditor, type ChallengeEditorHandle } from '@/components/challenge-editor'
import { SolveCelebration } from '@/components/solve-celebration'
import { DifficultyBadge } from '@/components/difficulty-badge'
import { ChallengeHeader } from '@/components/challenge-header'
import { TestCaseList } from '@/components/test-case-card'
import { ResultsPanel } from '@/components/results-panel'
import ReactMarkdown from 'react-markdown'

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
  const [hintsRevealed, setHintsRevealed] = useState(0)

  // Store xpAwarded on a ref — derived from the submit result, no separate state needed
  const xpAwardedRef = useRef(0)

  // Mobile: switch between Problem / Code / Results
  const [mobileView, setMobileView] = useState<'problem' | 'code' | 'results'>('problem')

  // Left panel tabs (desktop)
  const [leftTab, setLeftTab] = useState<'problem' | 'testcases' | 'hints'>('problem')

  // Bottom right panel tabs (desktop)
  const [bottomTab, setBottomTab] = useState<'testcase' | 'result'>('result')

  const [isSubmitting, startSubmitTransition] = useTransition()

  const isSolved = progress?.status === 'completed'

  // Hide sidebar on mount
  useEffect(() => {
    document.body.classList.add('solve-page-active')
    return () => document.body.classList.remove('solve-page-active')
  }, [])

  // Resizable horizontal split (left/right) — ref-based drag for performance
  const containerRef = useRef<HTMLDivElement>(null)
  const leftPanelRef = useRef<HTMLElement>(null)
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

  // Track active drag listeners for cleanup on unmount
  const dragCleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    return () => {
      dragCleanupRef.current?.()
    }
  }, [])

  const handleHorizontalDrag = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const startX = e.clientX
    const startPercent = splitPercentRef.current
    const container = containerRef.current
    const leftPanel = leftPanelRef.current
    if (!container || !leftPanel) return

    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const handleDrag = (moveEvent: MouseEvent) => {
      const containerWidth = container.offsetWidth
      const delta = moveEvent.clientX - startX
      const deltaPercent = (delta / containerWidth) * 100
      const newPercent = Math.min(60, Math.max(25, startPercent + deltaPercent))
      const rounded = Math.round(newPercent)
      splitPercentRef.current = rounded
      // Mutate DOM directly during drag to avoid re-renders
      leftPanel.style.width = `${rounded}%`
    }

    const handleDragEnd = () => {
      document.removeEventListener('mousemove', handleDrag)
      document.removeEventListener('mouseup', handleDragEnd)
      dragCleanupRef.current = null
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      // Sync state on mouseup
      setSplitPercent(splitPercentRef.current)
      localStorage.setItem('cq-split', String(splitPercentRef.current))
      editorRef.current?.layout()
    }

    dragCleanupRef.current = () => {
      document.removeEventListener('mousemove', handleDrag)
      document.removeEventListener('mouseup', handleDragEnd)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.addEventListener('mousemove', handleDrag)
    document.addEventListener('mouseup', handleDragEnd)
  }, [])

  // Resizable vertical split (editor/results) — ref-based drag for performance
  const rightPanelRef = useRef<HTMLDivElement>(null)
  const editorContainerRef = useRef<HTMLDivElement>(null)
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
    const editorContainer = editorContainerRef.current
    if (!panel || !editorContainer) return

    document.body.style.cursor = 'row-resize'
    document.body.style.userSelect = 'none'

    const handleDrag = (moveEvent: MouseEvent) => {
      const panelHeight = panel.offsetHeight
      const delta = moveEvent.clientY - startY
      const deltaPercent = (delta / panelHeight) * 100
      const newPercent = Math.min(85, Math.max(40, startPercent + deltaPercent))
      const rounded = Math.round(newPercent)
      editorPercentRef.current = rounded
      // Mutate DOM directly during drag to avoid re-renders
      editorContainer.style.height = `${rounded}%`
    }

    const handleDragEnd = () => {
      document.removeEventListener('mousemove', handleDrag)
      document.removeEventListener('mouseup', handleDragEnd)
      dragCleanupRef.current = null
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      // Sync state on mouseup
      setEditorPercent(editorPercentRef.current)
      editorRef.current?.layout()
    }

    const cleanup = () => {
      document.removeEventListener('mousemove', handleDrag)
      document.removeEventListener('mouseup', handleDragEnd)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    // Chain cleanup: store the latest cleanup function
    const prevCleanup = dragCleanupRef.current
    dragCleanupRef.current = () => {
      prevCleanup?.()
      cleanup()
    }

    document.addEventListener('mousemove', handleDrag)
    document.addEventListener('mouseup', handleDragEnd)
  }, [])

  // Memoize hints parsing
  const hints = useMemo(() => {
    try { return JSON.parse(challenge.hints) as string[] } catch { return [] }
  }, [challenge.hints])

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
            xpAwardedRef.current = result.xpAwarded
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

  // Running tests IS submitting a solution — they are intentionally the same action.
  const handleRunTests = useCallback(() => {
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

  return (
    <>
      {showCelebration && (
        <SolveCelebration
          xpAwarded={xpAwardedRef.current}
          onDismiss={() => setShowCelebration(false)}
          onNextChallenge={() => router.push('/challenges')}
        />
      )}

      {/* Desktop layout */}
      <div className="hidden lg:flex h-screen flex-col">
        <div className="flex h-10 shrink-0 items-center justify-between border-b border-neutral-800 bg-neutral-950 px-3">
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

          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500">⌘+Enter</span>
            <button
              type="button"
              onClick={handleRunTests}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 rounded-md border border-neutral-700 bg-neutral-800 px-3 py-1 text-sm text-neutral-300 hover:bg-neutral-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="size-3.5 animate-spin rounded-full border-2 border-neutral-400 border-t-transparent" />
              ) : (
                <Play className="h-3.5 w-3.5" />
              )}
              {isSubmitting ? 'Running...' : 'Run Tests'}
            </button>
          </div>
        </div>

        <div ref={containerRef} className="flex flex-1 min-h-0">
          <section
            ref={leftPanelRef}
            style={{ width: `${splitPercent}%` }}
            className="flex shrink-0 flex-col border-r border-neutral-800"
          >
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

            <div className="flex-1 overflow-y-auto">
              {leftTab === 'problem' && (
                <div className="p-6">
                  <ChallengeHeader
                    challenge={challenge}
                    isSolved={isSolved}
                    xpEarned={progress?.xpEarned}
                  />

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
                  <TestCaseList testCases={allTestCases} total={allTestCases.length} />
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

          <div
            onMouseDown={handleHorizontalDrag}
            className="flex w-1.5 cursor-col-resize items-center justify-center bg-neutral-800 hover:bg-lime-500/50 transition-colors group shrink-0"
          >
            <div className="w-0.5 h-8 rounded-full bg-neutral-600 group-hover:bg-lime-400 transition-colors" />
          </div>

          <section ref={rightPanelRef} className="flex min-w-0 flex-1 flex-col">
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

            <div ref={editorContainerRef} style={{ height: `${editorPercent}%` }} className="min-h-0 shrink-0">
              <ChallengeEditor
                ref={editorRef}
                starterCode={challenge.starterCode}
                language="javascript"
                onSubmit={handleSubmit}
                previousCode={progress?.submittedCode ?? undefined}
              />
            </div>

            <div
              onMouseDown={handleVerticalDrag}
              className="h-1.5 cursor-row-resize bg-neutral-800 hover:bg-lime-500/50 transition-colors shrink-0"
            />

            <div className="flex flex-1 min-h-[100px] flex-col">
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

              <div className="flex-1 overflow-y-auto p-4">
                {bottomTab === 'testcase' && (
                  <TestCaseList testCases={allTestCases} limit={3} total={allTestCases.length} />
                )}

                {bottomTab === 'result' && (
                  <ResultsPanel
                    executionResult={executionResult}
                    executionError={executionError}
                    xpAwarded={xpAwardedRef.current}
                  />
                )}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-neutral-800 bg-neutral-950 px-4 py-1 text-xs text-neutral-600 shrink-0">
              <span>{isSolved ? 'Solved' : 'Unsaved'}</span>
              <span className="font-mono">JavaScript</span>
            </div>
          </section>
        </div>
      </div>

      {/* Mobile layout */}
      <div className="flex lg:hidden h-screen flex-col">
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
            onClick={handleRunTests}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 rounded-md bg-lime-600 px-3 py-1 text-sm font-medium text-black hover:bg-lime-500 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="size-3.5 animate-spin rounded-full border-2 border-black border-t-transparent" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
            {isSubmitting ? 'Running...' : 'Run Tests'}
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          {mobileView === 'problem' && (
            <div className="p-4">
              <ChallengeHeader
                challenge={challenge}
                isSolved={isSolved}
                xpEarned={progress?.xpEarned}
                compact
              />

              <div className="prose prose-invert prose-sm max-w-none text-neutral-300 prose-headings:text-white prose-headings:font-semibold prose-h1:text-lg prose-h2:text-base prose-h2:mt-5 prose-h2:mb-2 prose-code:bg-neutral-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-lime-400 prose-code:before:content-none prose-code:after:content-none prose-pre:bg-neutral-950 prose-pre:border prose-pre:border-neutral-800 prose-li:text-neutral-300 prose-strong:text-white">
                <ReactMarkdown>{challenge.problemStatement}</ReactMarkdown>
              </div>

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
                previousCode={progress?.submittedCode ?? undefined}
              />
            </div>
          )}

          {mobileView === 'results' && (
            <div className="p-4">
              <ResultsPanel
                executionResult={executionResult}
                executionError={executionError}
                xpAwarded={xpAwardedRef.current}
              />
            </div>
          )}
        </div>

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
