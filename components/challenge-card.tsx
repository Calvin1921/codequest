import Link from "next/link"
import { DifficultyBadge } from "@/components/difficulty-badge"
import { cn } from "@/lib/utils"
import type { Difficulty } from "@/lib/types"

type ChallengeStatus = "completed" | "in-progress" | "locked" | "available"

interface ChallengeCardProps {
  id: string
  title: string
  description: string
  difficulty: Difficulty
  category: string
  xp: number
  timeEstimate?: number
  status: ChallengeStatus
}

const difficultyGlow: Record<Difficulty, string> = {
  easy: "hover:shadow-[0_0_20px_rgba(34,197,94,0.15)]",
  medium: "hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]",
  hard: "hover:shadow-[0_0_20px_rgba(244,63,94,0.15)]",
}

export function ChallengeCard({
  id,
  title,
  description,
  difficulty,
  category,
  xp,
  timeEstimate,
  status,
}: ChallengeCardProps) {
  const isLocked = status === "locked"
  const isCompleted = status === "completed"
  const isInProgress = status === "in-progress"

  const card = (
    <div
      className={cn(
        "group relative flex h-full flex-col rounded-xl border bg-card p-5 transition-all duration-200",
        isLocked && "cursor-not-allowed opacity-50",
        !isLocked && "cursor-pointer hover:-translate-y-0.5",
        !isLocked && difficultyGlow[difficulty],
        isCompleted && "border-green-500/30 shadow-[0_0_12px_rgba(34,197,94,0.08)]",
        isInProgress && "border-amber-500/30",
        !isCompleted && !isInProgress && "border-neutral-800"
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="rounded-md bg-neutral-800 px-2 py-0.5 text-[11px] font-medium capitalize text-neutral-400">
          {category}
        </span>
        <DifficultyBadge difficulty={difficulty} />
      </div>

      <h3 className="mb-1.5 text-base font-semibold leading-snug text-white">
        {title}
      </h3>

      <p className="mb-4 line-clamp-2 flex-1 text-sm leading-relaxed text-neutral-400">
        {description}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm font-bold tabular-nums text-lime-500">
            {xp} XP
          </span>
          {timeEstimate != null && timeEstimate > 0 && (
            <span className="text-xs text-neutral-600">
              ~{Math.round(timeEstimate / 60)} min
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {isCompleted && (
            <div className="flex items-center gap-1 text-green-400">
              <svg className="size-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
              <span className="text-xs font-medium">Solved</span>
            </div>
          )}
          {isInProgress && (
            <div className="flex items-center gap-1 text-amber-400">
              <svg className="size-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
              </svg>
              <span className="text-xs font-medium">In Progress</span>
            </div>
          )}
          {status === "available" && (
            <div className="text-neutral-600">
              <svg className="size-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <circle cx="10" cy="10" r="7.25" />
              </svg>
            </div>
          )}
          {isLocked && (
            <div className="flex items-center gap-1 text-neutral-600">
              <svg className="size-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
              </svg>
              <span className="text-xs font-medium">Locked</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  if (isLocked) {
    return card
  }

  return (
    <Link href={`/challenges/${id}`} className="block">
      {card}
    </Link>
  )
}
