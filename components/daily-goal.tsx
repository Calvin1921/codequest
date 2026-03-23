"use client"

import { cn } from "@/lib/utils"

interface DailyGoalProps {
  completed: number
  goal: number
  className?: string
}

export function DailyGoal({ completed, goal, className }: DailyGoalProps) {
  if (goal === 0) {
    return (
      <div
        className={cn(
          "flex flex-col gap-2 rounded-lg border border-neutral-800 bg-neutral-900/50 px-4 py-3",
          className
        )}
      >
        <span className="text-sm text-neutral-500">No daily goal set</span>
      </div>
    )
  }

  const progress = Math.min((completed / goal) * 100, 100)
  const isComplete = completed >= goal

  function getMotivationalText() {
    if (isComplete) return "You crushed it today! Streak maintained."
    if (completed === 0) return "Start your first challenge to get going!"
    const remaining = goal - completed
    return `${remaining} more challenge${remaining !== 1 ? "s" : ""} to keep the streak alive`
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-lg border px-4 py-3",
        isComplete
          ? "border-lime-500/30 bg-lime-500/5"
          : "border-neutral-800 bg-neutral-900/50",
        className
      )}
    >
      <div className="flex items-center justify-between text-sm">
        <span className={cn("font-semibold", isComplete && "text-lime-400")}>
          {isComplete ? "Daily goal complete!" : "Daily Goal"}
        </span>
        <span className="font-mono text-sm tabular-nums text-lime-500">
          {completed}/{goal}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-800">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700 ease-out",
            isComplete
              ? "bg-lime-500"
              : "bg-gradient-to-r from-lime-500 to-amber-400"
          )}
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="text-xs text-neutral-500">{getMotivationalText()}</p>
    </div>
  )
}
