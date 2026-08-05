import { cn } from "@/lib/utils"
import type { Difficulty } from "@/lib/types"

const difficultyConfig: Record<Difficulty, { label: string; className: string }> = {
  easy: {
    label: "Easy",
    className: "bg-green-500/10 text-green-400 border-green-500/20",
  },
  medium: {
    label: "Medium",
    className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  hard: {
    label: "Hard",
    className: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  },
}

interface DifficultyBadgeProps {
  difficulty: Difficulty
  className?: string
}

export function DifficultyBadge({ difficulty, className }: DifficultyBadgeProps) {
  const config = difficultyConfig[difficulty]

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}
