"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Trophy, ArrowRight } from "lucide-react"

interface SolveCelebrationProps {
  xpAwarded: number
  streak?: number
  onNextChallenge: () => void
  onDismiss: () => void
}

const CONFETTI_COLORS = [
  "#f43f5e",
  "#3b82f6",
  "#22c55e",
  "#eab308",
  "#a855f7",
  "#f97316",
]

export function SolveCelebration({
  xpAwarded,
  streak,
  onNextChallenge,
  onDismiss,
}: SolveCelebrationProps) {
  const [displayXp, setDisplayXp] = useState(0)
  const [visible, setVisible] = useState(true)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Generate confetti positions once on mount to avoid hydration mismatches
  // from calling Math.random() during render
  const confettiPieces = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => ({
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        left: Math.random() * 100,
        delay: Math.random() * 2,
        duration: 2 + Math.random() * 2,
        size: 6 + Math.random() * 8,
        isRound: Math.random() > 0.5,
      })),
    []
  )

  // XP count-up animation
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
      if (step >= steps) {
        clearInterval(id)
      }
    }, interval)

    return () => clearInterval(id)
  }, [xpAwarded])

  // Auto-dismiss after 5s
  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setVisible(false)
      onDismiss()
    }, 5000)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [onDismiss])

  const handleDismiss = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setVisible(false)
    onDismiss()
  }, [onDismiss])

  const handleNext = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setVisible(false)
    onNextChallenge()
  }, [onNextChallenge])

  if (!visible) return null

  return (
    <>
      {/* Confetti pieces */}
      {confettiPieces.map((piece, i) => (
        <div
          key={i}
          className="confetti-piece"
          style={{
            left: `${piece.left}%`,
            width: `${piece.size}px`,
            height: `${piece.size}px`,
            backgroundColor: piece.color,
            borderRadius: piece.isRound ? "50%" : "0",
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
          }}
        />
      ))}

      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        onClick={handleDismiss}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Escape" || e.key === "Enter") handleDismiss()
        }}
      >
        <div
          className="mx-4 flex max-w-sm flex-col items-center gap-6 rounded-2xl bg-white p-8 text-center shadow-2xl dark:bg-neutral-900"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-label="Challenge solved celebration"
        >
          <Trophy className="size-16 text-amber-500" />

          <div>
            <h2 className="text-2xl font-bold">Challenge Solved!</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Great work! Keep it up!
            </p>
          </div>

          <div className="text-4xl font-bold text-green-600 dark:text-green-400">
            +{displayXp} XP
          </div>

          {streak !== undefined && streak > 0 && (
            <div className="text-sm">
              <span className="text-lg" role="img" aria-label="fire">
                🔥
              </span>{" "}
              <span className="font-semibold">{streak} day streak!</span>
            </div>
          )}

          <div className="flex w-full flex-col gap-2">
            <Button onClick={handleNext} className="w-full">
              Next Challenge <ArrowRight />
            </Button>
            <Button variant="ghost" onClick={handleDismiss} className="w-full">
              Dismiss
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
