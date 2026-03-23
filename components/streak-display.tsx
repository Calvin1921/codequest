"use client"

import { cn } from "@/lib/utils"

interface StreakDisplayProps {
  streak: number
  isActiveToday: boolean
  freezeCount?: number
  className?: string
}

export function StreakDisplay({
  streak,
  isActiveToday,
  freezeCount = 0,
  className,
}: StreakDisplayProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border px-3 py-2",
        isActiveToday
          ? "border-amber-500/30 bg-amber-500/10"
          : "border-neutral-700 bg-neutral-800/50 opacity-60",
        className
      )}
    >
      <span
        className={cn("text-lg", isActiveToday && "animate-pulse")}
        role="img"
        aria-label="fire"
      >
        🔥
      </span>
      <span
        className={cn(
          "text-sm font-bold tabular-nums",
          isActiveToday ? "text-amber-400" : "text-neutral-500"
        )}
      >
        {streak} day{streak !== 1 ? "s" : ""}
      </span>

      {freezeCount > 0 && (
        <span
          className="ml-1 flex items-center gap-1 text-xs text-neutral-400"
          title={`${freezeCount} streak freeze${freezeCount !== 1 ? "s" : ""} available`}
        >
          <span role="img" aria-label="ice">
            🧊
          </span>
          {freezeCount}
        </span>
      )}
    </div>
  )
}
