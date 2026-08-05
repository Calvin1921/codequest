"use server"

import { prisma } from "@/server/db"

export async function getHint(challengeId: string, hintIndex: number) {
  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
    select: { hints: true },
  })

  if (!challenge) {
    return { error: "Challenge not found" }
  }

  try {
    const hints = JSON.parse(challenge.hints) as string[]
    if (hintIndex < 0 || hintIndex >= hints.length) {
      return { error: "Hint index out of range" }
    }
    return { hint: hints[hintIndex], totalHints: hints.length }
  } catch {
    return { error: "Failed to parse hints" }
  }
}
