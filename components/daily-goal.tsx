"use client"

import { cn } from "@/lib/utils"

interface DailyGoalProps {
  completed: number
  goal: number
  className?: string
}

export function DailyGoal({ completed, goal, className }: DailyGoalProps) {
  const progress = Math.min((completed / goal) * 100, 100)
  const isComplete = completed >= goal

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-lg border px-4 py-3",
        className
      )}
    >
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">
          {isComplete ? "Daily goal complete!" : "Daily Goal"}
        </span>
        <span className="text-muted-foreground">
          {completed}/{goal}
        </span>
      </div>

      {/* Progress bar */}
      <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            isComplete ? "bg-green-500" : "bg-primary"
          )}
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="text-muted-foreground text-xs">
        {isComplete
          ? "You've maintained your streak today!"
          : `Complete ${goal - completed} more challenge${goal - completed !== 1 ? "s" : ""} to maintain your streak`}
      </p>
    </div>
  )
}
