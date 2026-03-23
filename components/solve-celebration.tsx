"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

interface SolveCelebrationProps {
  xpAwarded: number
  streak?: number
  onNextChallenge: () => void
  onDismiss: () => void
}

const CONFETTI_COLORS = [
  "#84cc16",
  "#22d3ee",
  "#f59e0b",
  "#a855f7",
  "#f43f5e",
  "#3b82f6",
]

export function SolveCelebration({
  xpAwarded,
  streak,
  onNextChallenge,
  onDismiss,
}: SolveCelebrationProps) {
  const [displayXp, setDisplayXp] = useState(0)
  const [visible, setVisible] = useState(true)
  const [countdown, setCountdown] = useState(5)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const confettiPieces = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => ({
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        left: Math.random() * 100,
        delay: Math.random() * 2,
        duration: 2 + Math.random() * 2,
        size: 6 + Math.random() * 8,
        isRound: Math.random() > 0.5,
      })),
    []
  )

  useEffect(() => {
    if (xpAwarded <= 0) {
      setDisplayXp(xpAwarded)
      return
    }
    const duration = 1000
    const steps = 30
    const increment = xpAwarded / steps
    const interval = duration / steps
    let step = 0
    const id = setInterval(() => {
      step++
      const current = Math.min(Math.round(increment * step), xpAwarded)
      setDisplayXp(current)
      if (step >= steps) clearInterval(id)
    }, interval)
    return () => clearInterval(id)
  }, [xpAwarded])

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setVisible(false)
      onDismiss()
    }, 5000)
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => Math.max(prev - 1, 0))
    }, 1000)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [onDismiss])

  const handleDismiss = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (countdownRef.current) clearInterval(countdownRef.current)
    setVisible(false)
    onDismiss()
  }, [onDismiss])

  const handleNext = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (countdownRef.current) clearInterval(countdownRef.current)
    setVisible(false)
    onNextChallenge()
  }, [onNextChallenge])

  if (!visible) return null

  return (
    <>
      {confettiPieces.map((piece, i) => (
        <div
          key={i}
          className="confetti-piece"
          style={{
            left: `${piece.left}%`,
            width: `${piece.size}px`,
            height: `${piece.size}px`,
            backgroundColor: piece.color,
            borderRadius: piece.isRound ? "50%" : "2px",
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
          }}
        />
      ))}

      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
        onClick={handleDismiss}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Escape" || e.key === "Enter") handleDismiss()
        }}
      >
        <div
          className="mx-4 flex max-w-sm flex-col items-center gap-6 rounded-2xl border border-neutral-800 bg-neutral-900 p-8 text-center shadow-2xl"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-label="Challenge solved celebration"
        >
          <div className="flex size-20 items-center justify-center rounded-full bg-lime-500/10">
            <svg className="size-10 text-lime-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0116.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.985 6.985 0 01-2.77.853 6.985 6.985 0 01-2.77-.853" />
            </svg>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white">Challenge Solved!</h2>
            <p className="mt-1 text-sm text-neutral-400">Great work! Keep the momentum going.</p>
          </div>

          <div className="font-mono text-5xl font-bold tabular-nums text-lime-500">
            +{displayXp} XP
          </div>

          {streak !== undefined && streak > 0 && (
            <div className="flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-1.5 text-sm">
              <span role="img" aria-label="fire">🔥</span>
              <span className="font-bold text-amber-400">{streak} day streak!</span>
            </div>
          )}

          <div className="flex w-full flex-col gap-2">
            <button
              type="button"
              onClick={handleNext}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-lime-500 px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-lime-400"
            >
              Next Challenge
              <svg className="size-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
              </svg>
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="w-full rounded-lg border border-neutral-700 px-4 py-2.5 text-sm font-medium text-neutral-300 transition-colors hover:bg-neutral-800"
            >
              Stay Here
              <span className="ml-2 text-xs text-neutral-600">({countdown}s)</span>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
