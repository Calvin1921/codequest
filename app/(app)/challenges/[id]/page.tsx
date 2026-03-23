import { auth } from "@/lib/auth"
import { prisma } from "@/server/db"
import { redirect, notFound } from "next/navigation"
import type { Difficulty } from "@/lib/types"
import ChallengeSolveClient from "./challenge-solve-client"

export default async function ChallengeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const userId = session.user.id

  const challenge = await prisma.challenge.findUnique({
    where: { id },
    include: {
      progress: {
        where: { userId },
        take: 1,
      },
    },
  })

  if (!challenge) {
    notFound()
  }

  const userProgress = challenge.progress[0] ?? null

  return (
    <ChallengeSolveClient
      challenge={{
        id: challenge.id,
        title: challenge.title,
        description: challenge.description,
        problemStatement: challenge.problemStatement,
        difficulty: challenge.difficulty as Difficulty,
        category: challenge.category,
        starterCode: challenge.starterCode,
        testCases: challenge.testCases,
        hints: challenge.hints,
        xpReward: challenge.xpReward,
      }}
      progress={
        userProgress
          ? {
              status: userProgress.status,
              submittedCode: userProgress.submittedCode,
              attempts: userProgress.attempts,
              xpEarned: userProgress.xpEarned,
            }
          : undefined
      }
    />
  )
}
