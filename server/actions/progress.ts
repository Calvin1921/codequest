"use server"

import { prisma } from "@/server/db"
import { auth } from "@/lib/auth"
import { executeCode } from "@/lib/code-executor"
import type { Difficulty, TestCase, ExecutionResult } from "@/lib/types"
import { updateStreak } from "./streak"

const DIFFICULTY_MULTIPLIER: Record<Difficulty, number> = {
  easy: 1,
  medium: 1.5,
  hard: 2.5,
}

function calculateXp(xpReward: number, difficulty: Difficulty, attempts: number): number {
  const multiplier = DIFFICULTY_MULTIPLIER[difficulty] ?? 1
  const attemptBonus = Math.max(0, 50 - attempts * 10)
  return Math.floor(xpReward * multiplier) + attemptBonus
}

export interface SubmitResult {
  execution: ExecutionResult
  xpAwarded: number
  alreadyCompleted: boolean
}

export async function submitSolution(challengeId: string, userCode: string): Promise<SubmitResult> {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("You must be signed in to submit solutions")
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
    throw new Error("Challenge not found")
  }

  // Parse test cases
  let testCases: TestCase[]
  try {
    testCases = JSON.parse(challenge.testCases)
  } catch {
    throw new Error("Invalid test cases configuration")
  }

  // Execute user code against test cases
  const execution = executeCode(userCode, testCases)

  if (execution.passed) {
    // Use a transaction to check completion status AND award XP atomically.
    // This prevents a race condition where concurrent submissions could
    // both pass the "already completed" check and award double XP.
    const result = await prisma.$transaction(async (tx) => {
      const existingProgress = await tx.userProgress.findUnique({
        where: { userId_challengeId: { userId, challengeId } },
      })

      // Already completed — skip XP award
      if (existingProgress?.status === "completed") {
        return { xpAwarded: 0, alreadyCompleted: true }
      }

      const currentAttempts = (existingProgress?.attempts ?? 0) + 1

      const xpAwarded = calculateXp(
        challenge.xpReward,
        challenge.difficulty as Difficulty,
        currentAttempts
      )

      await tx.userProgress.upsert({
        where: {
          userId_challengeId: { userId, challengeId },
        },
        update: {
          status: "completed",
          submittedCode: userCode,
          attempts: currentAttempts,
          xpEarned: xpAwarded,
          completedAt: new Date(),
        },
        create: {
          userId,
          challengeId,
          status: "completed",
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

      return { xpAwarded, alreadyCompleted: false }
    })

    if (result.alreadyCompleted) {
      return { execution, xpAwarded: 0, alreadyCompleted: true }
    }

    // Update streak (outside transaction since it has its own logic)
    await updateStreak(userId)

    return { execution, xpAwarded: result.xpAwarded, alreadyCompleted: false }
  } else {
    // Tests failed — update progress to track attempt
    const existingProgress = await prisma.userProgress.findUnique({
      where: { userId_challengeId: { userId, challengeId } },
    })
    const currentAttempts = (existingProgress?.attempts ?? 0) + 1

    await prisma.userProgress.upsert({
      where: {
        userId_challengeId: { userId, challengeId },
      },
      update: {
        status: "in_progress",
        submittedCode: userCode,
        attempts: currentAttempts,
      },
      create: {
        userId,
        challengeId,
        status: "in_progress",
        submittedCode: userCode,
        attempts: currentAttempts,
      },
    })

    return { execution, xpAwarded: 0, alreadyCompleted: false }
  }
}
