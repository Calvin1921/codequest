'use server'

import { prisma } from '@/server/db'

// NOTE: All streak dates use UTC (via toISOString). This means a user's "day"
// boundary depends on their relationship to UTC, not their local timezone.
// For example, a user at UTC-8 completing a challenge at 11pm local time
// would have it recorded as the next UTC day.
// TODO: Add timezone support — accept the user's timezone and compute
// "today"/"yesterday" relative to their local time.

function getTodayISO(): string {
  return new Date().toISOString().split('T')[0]
}

function getYesterdayISO(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().split('T')[0]
}

export interface StreakInfo {
  currentStreak: number
  longestStreak: number
  lastActiveDate: string | null
  freezesLeft: number
  isActiveToday: boolean
  /** True when the streak would be broken without a freeze.
   *  The freeze is not consumed until `updateStreak` is called.
   *  The UI can use this to show "Freeze will be used today". */
  freezeNeeded: boolean
}

export async function getStreak(userId: string): Promise<StreakInfo> {
  const today = getTodayISO()
  const yesterday = getYesterdayISO()

  let streak = await prisma.streak.findUnique({
    where: { userId },
  })

  if (!streak) {
    // Create a fresh streak record
    streak = await prisma.streak.create({
      data: {
        userId,
        currentStreak: 0,
        longestStreak: 0,
        freezesLeft: 1,
      },
    })

    return {
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null,
      freezesLeft: 1,
      isActiveToday: false,
      freezeNeeded: false,
    }
  }

  const isActiveToday = streak.lastActiveDate === today
  const wasActiveYesterday = streak.lastActiveDate === yesterday

  // If the streak is broken (last active wasn't today or yesterday)
  if (streak.lastActiveDate && !isActiveToday && !wasActiveYesterday) {
    if (streak.freezesLeft > 0) {
      // Use a freeze to preserve the streak (but don't decrement until updateStreak)
      return {
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
        lastActiveDate: streak.lastActiveDate,
        freezesLeft: streak.freezesLeft,
        isActiveToday: false,
        freezeNeeded: true,
      }
    } else {
      // Streak is broken — reset
      const updated = await prisma.streak.update({
        where: { userId },
        data: { currentStreak: 0 },
      })

      return {
        currentStreak: 0,
        longestStreak: updated.longestStreak,
        lastActiveDate: updated.lastActiveDate,
        freezesLeft: 0,
        isActiveToday: false,
        freezeNeeded: false,
      }
    }
  }

  return {
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    lastActiveDate: streak.lastActiveDate,
    freezesLeft: streak.freezesLeft,
    isActiveToday,
    freezeNeeded: false,
  }
}

export async function updateStreak(userId: string): Promise<StreakInfo> {
  const today = getTodayISO()
  const yesterday = getYesterdayISO()

  let streak = await prisma.streak.findUnique({
    where: { userId },
  })

  if (!streak) {
    streak = await prisma.streak.create({
      data: {
        userId,
        currentStreak: 1,
        longestStreak: 1,
        lastActiveDate: today,
        freezesLeft: 1,
      },
    })

    return {
      currentStreak: 1,
      longestStreak: 1,
      lastActiveDate: today,
      freezesLeft: 1,
      isActiveToday: true,
      freezeNeeded: false,
    }
  }

  // Already active today — no change needed
  if (streak.lastActiveDate === today) {
    return {
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      lastActiveDate: today,
      freezesLeft: streak.freezesLeft,
      isActiveToday: true,
      freezeNeeded: false,
    }
  }

  let newStreak: number
  let newFreezes = streak.freezesLeft

  if (streak.lastActiveDate === yesterday) {
    // Consecutive day — increment streak
    newStreak = streak.currentStreak + 1
  } else if (streak.lastActiveDate && streak.freezesLeft > 0) {
    // Missed a day but have a freeze — use it and continue streak
    newStreak = streak.currentStreak + 1
    newFreezes = streak.freezesLeft - 1
  } else {
    // Streak broken — reset to 1 (today counts)
    newStreak = 1
  }

  const newLongest = Math.max(streak.longestStreak, newStreak)

  const updated = await prisma.streak.update({
    where: { userId },
    data: {
      currentStreak: newStreak,
      longestStreak: newLongest,
      lastActiveDate: today,
      freezesLeft: newFreezes,
    },
  })

  return {
    currentStreak: updated.currentStreak,
    longestStreak: updated.longestStreak,
    lastActiveDate: today,
    freezesLeft: updated.freezesLeft,
    isActiveToday: true,
    freezeNeeded: false,
  }
}
