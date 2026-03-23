'use server'

import prisma from '@/server/db'
import { auth } from '@/lib/auth'
import { executeCode } from '@/lib/code-executor'
import type { TestCase, ExecutionResult } from '@/lib/types'
import { updateStreak } from './streak'

const DIFFICULTY_MULTIPLIER: Record<string, number> = {
  easy: 1,
  medium: 1.5,
  hard: 2.5,
}

function calculateXp(
  xpReward: number,
  difficulty: string,
  attempts: number
): number {
  const multiplier = DIFFICULTY_MULTIPLIER[difficulty] ?? 1
  const attemptBonus = Math.max(0, 50 - attempts * 10)
  return Math.floor(xpReward * multiplier) + attemptBonus
}

export interface SubmitResult {
  execution: ExecutionResult
  xpAwarded: number
  alreadyCompleted: boolean
}

export async function submitSolution(
  challengeId: string,
  userCode: string
): Promise<SubmitResult> {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('You must be signed in to submit solutions')
  }

  const userId = session.user.id

  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
    select: {
      id: true,
      testCases: true,
      difficulty: true,
      xpReward: true,
    },
  })

  if (!challenge) {
    throw new Error('Challenge not found')
  }

  // Parse test cases
  let testCases: TestCase[]
  try {
    testCases = JSON.parse(challenge.testCases)
  } catch {
    throw new Error('Invalid test cases configuration')
  }

  // Execute user code against test cases
  const execution = executeCode(userCode, testCases)

  // Get or create progress record
  let progress = await prisma.userProgress.findUnique({
    where: {
      userId_challengeId: {
        userId,
        challengeId,
      },
    },
  })

  // If already completed, return without awarding XP again
  if (progress?.status === 'completed') {
    return { execution, xpAwarded: 0, alreadyCompleted: true }
  }

  const currentAttempts = (progress?.attempts ?? 0) + 1

  if (execution.passed) {
    // Calculate XP
    const xpAwarded = calculateXp(
      challenge.xpReward,
      challenge.difficulty,
      currentAttempts
    )

    // Use a transaction to update progress, user XP, and streak atomically
    await prisma.$transaction(async (tx) => {
      await tx.userProgress.upsert({
        where: {
          userId_challengeId: { userId, challengeId },
        },
        update: {
          status: 'completed',
          submittedCode: userCode,
          attempts: currentAttempts,
          xpEarned: xpAwarded,
          completedAt: new Date(),
        },
        create: {
          userId,
          challengeId,
          status: 'completed',
          submittedCode: userCode,
          attempts: currentAttempts,
          xpEarned: xpAwarded,
          completedAt: new Date(),
        },
      })

      await tx.user.update({
        where: { id: userId },
        data: {
          totalXp: { increment: xpAwarded },
        },
      })
    })

    // Update streak (outside transaction since it has its own logic)
    await updateStreak(userId)

    return { execution, xpAwarded, alreadyCompleted: false }
  } else {
    // Tests failed — update progress to track attempt
    await prisma.userProgress.upsert({
      where: {
        userId_challengeId: { userId, challengeId },
      },
      update: {
        status: 'in_progress',
        submittedCode: userCode,
        attempts: currentAttempts,
      },
      create: {
        userId,
        challengeId,
        status: 'in_progress',
        submittedCode: userCode,
        attempts: currentAttempts,
      },
    })

    return { execution, xpAwarded: 0, alreadyCompleted: false }
  }
}

export async function saveDraft(
  challengeId: string,
  userCode: string
): Promise<{ success: boolean }> {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('You must be signed in to save drafts')
  }

  const userId = session.user.id

  await prisma.userProgress.upsert({
    where: {
      userId_challengeId: { userId, challengeId },
    },
    update: {
      submittedCode: userCode,
      status: 'in_progress',
    },
    create: {
      userId,
      challengeId,
      submittedCode: userCode,
      status: 'in_progress',
    },
  })

  return { success: true }
}
