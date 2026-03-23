'use server'

import prisma from '@/server/db'
import { auth } from '@/lib/auth'

export interface ChallengeFilters {
  difficulty?: 'easy' | 'medium' | 'hard'
  category?: 'javascript' | 'typescript' | 'algorithms' | 'react'
  status?: 'completed' | 'in_progress' | 'not_started'
}

export async function getChallenges(filters?: ChallengeFilters) {
  const session = await auth()
  const userId = session?.user?.id

  const where: Record<string, unknown> = {
    isPublished: true,
  }

  if (filters?.difficulty) {
    where.difficulty = filters.difficulty
  }

  if (filters?.category) {
    where.category = filters.category
  }

  const challenges = await prisma.challenge.findMany({
    where,
    orderBy: [
      { difficulty: 'asc' },
      { order: 'asc' },
    ],
    include: userId
      ? {
          progress: {
            where: { userId },
            take: 1,
          },
        }
      : undefined,
  })

  // Apply status filter client-side since it depends on joined data
  let result = challenges.map((challenge) => {
    const progress = 'progress' in challenge && Array.isArray(challenge.progress)
      ? challenge.progress[0]
      : undefined
    return {
      ...challenge,
      userProgress: progress
        ? {
            status: progress.status,
            attempts: progress.attempts,
            xpEarned: progress.xpEarned,
            completedAt: progress.completedAt,
            submittedCode: progress.submittedCode,
          }
        : null,
    }
  })

  if (filters?.status) {
    result = result.filter((c) => {
      if (filters.status === 'not_started') return !c.userProgress
      return c.userProgress?.status === filters.status
    })
  }

  return result
}

export async function getChallenge(id: string) {
  const session = await auth()
  const userId = session?.user?.id

  const challenge = await prisma.challenge.findUnique({
    where: { id },
    include: userId
      ? {
          progress: {
            where: { userId },
            take: 1,
          },
        }
      : undefined,
  })

  if (!challenge) {
    return { error: 'Challenge not found' }
  }

  const progress = 'progress' in challenge && Array.isArray(challenge.progress)
    ? challenge.progress[0]
    : undefined

  return {
    ...challenge,
    userProgress: progress
      ? {
          status: progress.status,
          attempts: progress.attempts,
          xpEarned: progress.xpEarned,
          completedAt: progress.completedAt,
          submittedCode: progress.submittedCode,
        }
      : null,
  }
}

export async function getHint(challengeId: string, hintIndex: number) {
  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
    select: { hints: true },
  })

  if (!challenge) {
    return { error: 'Challenge not found' }
  }

  try {
    const hints = JSON.parse(challenge.hints) as string[]
    if (hintIndex < 0 || hintIndex >= hints.length) {
      return { error: 'Hint index out of range' }
    }
    return { hint: hints[hintIndex], totalHints: hints.length }
  } catch {
    return { error: 'Failed to parse hints' }
  }
}
