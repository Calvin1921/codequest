import { DifficultyBadge } from '@/components/difficulty-badge'

interface ChallengeHeaderProps {
  challenge: { title: string; difficulty: string; category: string; xpReward: number }
  isSolved: boolean
  xpEarned?: number
  compact?: boolean
}

export function ChallengeHeader({ challenge, isSolved, xpEarned, compact }: ChallengeHeaderProps) {
  return (
    <div className={compact ? 'space-y-3 mb-4' : 'space-y-3 mb-6'}>
      <div className="flex flex-wrap items-center gap-2">
        <h1 className={`${compact ? 'text-lg' : 'text-xl'} font-bold text-white`}>
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
          <svg className="size-4" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
              clipRule="evenodd"
            />
          </svg>
          Solved — {xpEarned ?? 0} XP earned
        </div>
      )}
    </div>
  )
}
