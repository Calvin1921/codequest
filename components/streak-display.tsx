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
        "flex items-center gap-2 rounded-lg border px-3 py-2",
        isActiveToday
          ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
          : "border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800/50",
        className
      )}
    >
      <span className="text-lg" role="img" aria-label="fire">
        🔥
      </span>
      <span
        className={cn(
          "text-sm font-semibold",
          isActiveToday
            ? "text-green-700 dark:text-green-400"
            : "text-neutral-500 dark:text-neutral-400"
        )}
      >
        {streak} day{streak !== 1 ? "s" : ""}
      </span>

      {freezeCount > 0 && (
        <span
          className="text-muted-foreground ml-1 flex items-center gap-1 text-xs"
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
