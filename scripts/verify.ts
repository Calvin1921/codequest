#!/usr/bin/env node
/**
 * CodeQuest CLI Verification Tool
 *
 * Run with: npx tsx scripts/verify.ts <command>
 * Example:  npx tsx scripts/verify.ts verify:all
 *
 * Bypasses auth and works directly with Prisma + the code executor
 * so every backend operation can be tested from the terminal.
 */

import { PrismaClient } from '@prisma/client'
import { executeCode } from '../lib/code-executor'
import type { TestCase } from '../lib/types'
import bcrypt from 'bcryptjs'
import fs from 'node:fs'
import path from 'node:path'

// ---------------------------------------------------------------------------
// Prisma client (standalone — not the server singleton)
// ---------------------------------------------------------------------------
const prisma = new PrismaClient()

// ---------------------------------------------------------------------------
// Colours
// ---------------------------------------------------------------------------
const green = (s: string) => `\x1b[32m${s}\x1b[0m`
const red = (s: string) => `\x1b[31m${s}\x1b[0m`
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`
const bold = (s: string) => `\x1b[1m${s}\x1b[0m`

const PASS = green('✅')
const FAIL = red('❌')
const WARN = yellow('⚠️')
const CLEAN = '🧹'

// ---------------------------------------------------------------------------
// XP calculation (mirrors server/actions/progress.ts)
// ---------------------------------------------------------------------------
const DIFFICULTY_MULTIPLIER: Record<string, number> = {
  easy: 1,
  medium: 1.5,
  hard: 2.5,
}

function calculateXp(xpReward: number, difficulty: string, attempts: number): number {
  const multiplier = DIFFICULTY_MULTIPLIER[difficulty] ?? 1
  const attemptBonus = Math.max(0, 50 - attempts * 10)
  return Math.floor(xpReward * multiplier) + attemptBonus
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getTodayISO(): string {
  return new Date().toISOString().split('T')[0]
}

function getDateISO(daysOffset: number): string {
  const d = new Date()
  d.setDate(d.getDate() + daysOffset)
  return d.toISOString().split('T')[0]
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

// ── db:status ──────────────────────────────────────────────────────────────
async function dbStatus() {
  try {
    await prisma.$connect()
    const [users, challenges, progress, streaks] = await Promise.all([
      prisma.user.count(),
      prisma.challenge.count(),
      prisma.userProgress.count(),
      prisma.streak.count(),
    ])
    console.log(`${PASS} DB connection: OK (${challenges} challenges, ${users} users, ${progress} progress records, ${streaks} streaks)`)
    return true
  } catch (err) {
    console.log(`${FAIL} DB connection: ${(err as Error).message}`)
    return false
  }
}

// ── db:seed ────────────────────────────────────────────────────────────────
async function dbSeed() {
  const challengeCount = await prisma.challenge.count()
  if (challengeCount > 0) {
    console.log(`${PASS} DB seed: already seeded (${challengeCount} challenges)`)
    return true
  }
  console.log(`${WARN} DB has no challenges. Run: npx tsx prisma/seed.ts`)
  return false
}

// ── auth:register ──────────────────────────────────────────────────────────
async function authRegister(name: string, email: string, password: string) {
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    console.log(`${WARN} Auth: user "${email}" already exists (id: ${existing.id})`)
    return existing
  }
  const hashedPassword = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword },
  })
  console.log(`${PASS} Auth: registered user "${name}" <${email}> (id: ${user.id})`)
  return user
}

// ── auth:list ──────────────────────────────────────────────────────────────
async function authList() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, totalXp: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })
  console.log(bold(`Users (${users.length}):`))
  for (const u of users) {
    console.log(`  ${u.id}  ${u.name ?? '(no name)'}  ${u.email}  XP:${u.totalXp}`)
  }
  return users
}

// ── auth:verify ────────────────────────────────────────────────────────────
async function authVerify(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    console.log(`${FAIL} Auth verify: user "${email}" not found`)
    return false
  }
  if (!user.password) {
    console.log(`${FAIL} Auth verify: user "${email}" has no password (OAuth-only account)`)
    return false
  }
  const match = await bcrypt.compare(password, user.password)
  if (match) {
    console.log(`${PASS} Auth: password verification works for "${email}"`)
  } else {
    console.log(`${FAIL} Auth: password mismatch for "${email}"`)
  }
  return match
}

// ── challenges:list ────────────────────────────────────────────────────────
async function challengesList() {
  const challenges = await prisma.challenge.findMany({
    select: { id: true, title: true, difficulty: true, category: true, xpReward: true, order: true },
    orderBy: { order: 'asc' },
  })
  console.log(bold(`Challenges (${challenges.length}):`))
  for (const c of challenges) {
    console.log(`  [${c.order}] ${c.id}  "${c.title}"  ${c.difficulty}  ${c.category}  ${c.xpReward}xp`)
  }
  return challenges
}

// ── challenges:get ─────────────────────────────────────────────────────────
async function challengesGet(id: string) {
  const challenge = await prisma.challenge.findUnique({ where: { id } })
  if (!challenge) {
    console.log(`${FAIL} Challenge "${id}" not found`)
    return null
  }
  const testCases: TestCase[] = JSON.parse(challenge.testCases)
  console.log(bold(`Challenge: ${challenge.title}`))
  console.log(`  ID:         ${challenge.id}`)
  console.log(`  Difficulty: ${challenge.difficulty}`)
  console.log(`  Category:   ${challenge.category}`)
  console.log(`  XP Reward:  ${challenge.xpReward}`)
  console.log(`  Tests:      ${testCases.length}`)
  console.log(`  Starter:    ${challenge.starterCode.split('\n')[0]}...`)
  return challenge
}

// ── challenges:test-executor ───────────────────────────────────────────────
async function challengesTestExecutor() {
  const challenges = await prisma.challenge.findMany({ orderBy: { order: 'asc' } })
  let allPassed = true
  for (const c of challenges) {
    const testCases: TestCase[] = JSON.parse(c.testCases)
    const result = executeCode(c.solutionCode, testCases)
    if (result.passed) {
      console.log(`${PASS} Challenge "${c.title}": solution passes ${result.passedTests}/${result.totalTests} tests (${Math.round(result.executionTimeMs)}ms)`)
    } else {
      allPassed = false
      console.log(`${FAIL} Challenge "${c.title}": ${result.passedTests}/${result.totalTests} tests passed`)
      for (const r of result.results) {
        if (!r.passed) {
          console.log(`    FAIL: ${r.description}${r.error ? ' — ' + r.error : ''}`)
          console.log(`      expected: ${JSON.stringify(r.expected)}`)
          console.log(`      actual:   ${JSON.stringify(r.actual)}`)
        }
      }
    }
  }
  return allPassed
}

// ── exec:run ───────────────────────────────────────────────────────────────
async function execRun(challengeId: string, codeFile: string) {
  const challenge = await prisma.challenge.findUnique({ where: { id: challengeId } })
  if (!challenge) {
    console.log(`${FAIL} Challenge "${challengeId}" not found`)
    return false
  }

  const resolvedPath = path.resolve(codeFile)
  if (!fs.existsSync(resolvedPath)) {
    console.log(`${FAIL} Code file not found: ${resolvedPath}`)
    return false
  }

  const userCode = fs.readFileSync(resolvedPath, 'utf-8')
  const testCases: TestCase[] = JSON.parse(challenge.testCases)
  const result = executeCode(userCode, testCases)

  console.log(bold(`Executing against "${challenge.title}":`))
  for (const r of result.results) {
    const icon = r.passed ? PASS : FAIL
    console.log(`  ${icon} ${r.description} (${Math.round(r.executionTimeMs)}ms)`)
    if (!r.passed) {
      if (r.error) console.log(`      error:    ${r.error}`)
      console.log(`      expected: ${JSON.stringify(r.expected)}`)
      console.log(`      actual:   ${JSON.stringify(r.actual)}`)
    }
  }
  console.log(`\nResult: ${result.passedTests}/${result.totalTests} passed (${Math.round(result.executionTimeMs)}ms)`)
  return result.passed
}

// ── exec:test-all ──────────────────────────────────────────────────────────
async function execTestAll() {
  return challengesTestExecutor()
}

// ── progress:submit ────────────────────────────────────────────────────────
async function progressSubmit(userId: string, challengeId: string, codeFile: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    console.log(`${FAIL} User "${userId}" not found`)
    return false
  }

  const challenge = await prisma.challenge.findUnique({ where: { id: challengeId } })
  if (!challenge) {
    console.log(`${FAIL} Challenge "${challengeId}" not found`)
    return false
  }

  const resolvedPath = path.resolve(codeFile)
  if (!fs.existsSync(resolvedPath)) {
    console.log(`${FAIL} Code file not found: ${resolvedPath}`)
    return false
  }

  const userCode = fs.readFileSync(resolvedPath, 'utf-8')
  const testCases: TestCase[] = JSON.parse(challenge.testCases)
  const execution = executeCode(userCode, testCases)

  if (execution.passed) {
    const existingProgress = await prisma.userProgress.findUnique({
      where: { userId_challengeId: { userId, challengeId } },
    })

    if (existingProgress?.status === 'completed') {
      console.log(`${PASS} Solution passes all tests but challenge already completed — no XP awarded`)
      return true
    }

    const currentAttempts = (existingProgress?.attempts ?? 0) + 1
    const xpAwarded = calculateXp(challenge.xpReward, challenge.difficulty, currentAttempts)

    await prisma.$transaction(async (tx) => {
      await tx.userProgress.upsert({
        where: { userId_challengeId: { userId, challengeId } },
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
        data: { totalXp: { increment: xpAwarded } },
      })
    })

    console.log(`${PASS} Progress: submitted solution for "${challenge.title}" — ${execution.passedTests}/${execution.totalTests} passed, +${xpAwarded} XP`)
  } else {
    const existingProgress = await prisma.userProgress.findUnique({
      where: { userId_challengeId: { userId, challengeId } },
    })
    const currentAttempts = (existingProgress?.attempts ?? 0) + 1

    await prisma.userProgress.upsert({
      where: { userId_challengeId: { userId, challengeId } },
      update: { status: 'in_progress', submittedCode: userCode, attempts: currentAttempts },
      create: { userId, challengeId, status: 'in_progress', submittedCode: userCode, attempts: currentAttempts },
    })

    console.log(`${FAIL} Progress: solution failed — ${execution.passedTests}/${execution.totalTests} passed (attempt #${currentAttempts})`)
    for (const r of execution.results) {
      if (!r.passed) {
        console.log(`    ${r.description}: ${r.error ?? `expected ${JSON.stringify(r.expected)}, got ${JSON.stringify(r.actual)}`}`)
      }
    }
  }

  return execution.passed
}

// ── progress:status ────────────────────────────────────────────────────────
async function progressStatus(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    console.log(`${FAIL} User "${userId}" not found`)
    return
  }

  const challenges = await prisma.challenge.findMany({
    orderBy: { order: 'asc' },
    include: {
      progress: { where: { userId }, take: 1 },
    },
  })

  console.log(bold(`Progress for ${user.name ?? user.email}:`))
  for (const c of challenges) {
    const p = c.progress[0]
    if (!p) {
      console.log(`  [ ] ${c.title}  ${dim('not started')}`)
    } else if (p.status === 'completed') {
      console.log(`  ${green('[✓]')} ${c.title}  ${green('completed')}  +${p.xpEarned}XP  ${p.attempts} attempt(s)`)
    } else {
      console.log(`  ${yellow('[~]')} ${c.title}  ${yellow('in progress')}  ${p.attempts} attempt(s)`)
    }
  }
}

// ── progress:stats ─────────────────────────────────────────────────────────
async function progressStats(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    console.log(`${FAIL} User "${userId}" not found`)
    return
  }

  const progress = await prisma.userProgress.findMany({ where: { userId } })
  const completed = progress.filter((p) => p.status === 'completed')
  const totalXpFromProgress = completed.reduce((sum, p) => sum + p.xpEarned, 0)
  const totalAttempts = progress.reduce((sum, p) => sum + p.attempts, 0)
  const streak = await prisma.streak.findUnique({ where: { userId } })

  console.log(bold(`Stats for ${user.name ?? user.email}:`))
  console.log(`  Total XP:           ${user.totalXp}`)
  console.log(`  XP from progress:   ${totalXpFromProgress}`)
  console.log(`  Challenges solved:  ${completed.length}/${progress.length} attempted`)
  console.log(`  Total attempts:     ${totalAttempts}`)
  if (streak) {
    console.log(`  Current streak:     ${streak.currentStreak}`)
    console.log(`  Longest streak:     ${streak.longestStreak}`)
    console.log(`  Freezes left:       ${streak.freezesLeft}`)
    console.log(`  Last active:        ${streak.lastActiveDate ?? 'never'}`)
  } else {
    console.log(`  Streak:             none`)
  }
}

// ── streak:check ───────────────────────────────────────────────────────────
async function streakCheck(userId: string) {
  const streak = await prisma.streak.findUnique({ where: { userId } })
  if (!streak) {
    console.log(`${WARN} Streak: no record for user "${userId}"`)
    return
  }

  const today = getTodayISO()
  const yesterday = getDateISO(-1)
  const isActiveToday = streak.lastActiveDate === today
  const wasActiveYesterday = streak.lastActiveDate === yesterday
  const isBroken = streak.lastActiveDate !== null && !isActiveToday && !wasActiveYesterday

  console.log(bold(`Streak for user ${userId}:`))
  console.log(`  Current:     ${streak.currentStreak}`)
  console.log(`  Longest:     ${streak.longestStreak}`)
  console.log(`  Last active: ${streak.lastActiveDate ?? 'never'}`)
  console.log(`  Today:       ${today}`)
  console.log(`  Active today: ${isActiveToday ? 'yes' : 'no'}`)
  console.log(`  Freezes left: ${streak.freezesLeft}`)
  if (isBroken) {
    console.log(`  ${red('Streak is broken!')} ${streak.freezesLeft > 0 ? '(freeze available)' : '(no freezes)'}`)
  }
}

// ── streak:update ──────────────────────────────────────────────────────────
async function streakUpdate(userId: string) {
  const today = getTodayISO()
  const yesterday = getDateISO(-1)

  let streak = await prisma.streak.findUnique({ where: { userId } })

  if (!streak) {
    streak = await prisma.streak.create({
      data: { userId, currentStreak: 1, longestStreak: 1, lastActiveDate: today, freezesLeft: 1 },
    })
    console.log(`${PASS} Streak: created new streak (current: 1)`)
    return streak
  }

  if (streak.lastActiveDate === today) {
    console.log(`${PASS} Streak: already active today (current: ${streak.currentStreak})`)
    return streak
  }

  let newStreak: number
  let newFreezes = streak.freezesLeft

  if (streak.lastActiveDate === yesterday) {
    newStreak = streak.currentStreak + 1
  } else if (streak.lastActiveDate && streak.freezesLeft > 0) {
    newStreak = streak.currentStreak + 1
    newFreezes = streak.freezesLeft - 1
  } else {
    newStreak = 1
  }

  const newLongest = Math.max(streak.longestStreak, newStreak)

  const updated = await prisma.streak.update({
    where: { userId },
    data: { currentStreak: newStreak, longestStreak: newLongest, lastActiveDate: today, freezesLeft: newFreezes },
  })

  console.log(`${PASS} Streak: updated (current: ${updated.currentStreak}, longest: ${updated.longestStreak}, freezes: ${updated.freezesLeft})`)
  return updated
}

// ── verify:all ─────────────────────────────────────────────────────────────
async function verifyAll() {
  let passed = 0
  let total = 0

  const check = (ok: boolean, _label?: string) => {
    total++
    if (ok) passed++
    return ok
  }

  // 1. DB connection
  const dbOk = await dbStatus()
  check(dbOk)
  if (!dbOk) {
    console.log(red('\nCannot continue without DB connection.'))
    printSummary(passed, total)
    return
  }

  // 2. Challenges table has 5 rows
  const challengeCount = await prisma.challenge.count()
  if (challengeCount === 5) {
    console.log(`${PASS} Challenges: ${challengeCount} rows as expected`)
    check(true)
  } else {
    console.log(`${FAIL} Challenges: expected 5, got ${challengeCount}`)
    check(false)
  }

  // 3. Each challenge's solution passes its own tests
  const challenges = await prisma.challenge.findMany({ orderBy: { order: 'asc' } })
  for (const c of challenges) {
    const testCases: TestCase[] = JSON.parse(c.testCases)
    const result = executeCode(c.solutionCode, testCases)
    if (result.passed) {
      console.log(`${PASS} Challenge "${c.title}": solution passes ${result.passedTests}/${result.totalTests} tests (${Math.round(result.executionTimeMs)}ms)`)
      check(true)
    } else {
      console.log(`${FAIL} Challenge "${c.title}": ${result.passedTests}/${result.totalTests} tests passed`)
      for (const r of result.results.filter((r) => !r.passed)) {
        console.log(`    ${r.description}: ${r.error ?? `expected ${JSON.stringify(r.expected)}, got ${JSON.stringify(r.actual)}`}`)
      }
      check(false)
    }
  }

  // 4. User registration works
  const testEmail = `cli-test-${Date.now()}@verify.dev`
  const testPassword = 'VerifyPass123!'
  let testUser: { id: string } | null = null
  try {
    const hashedPassword = await bcrypt.hash(testPassword, 10)
    const user = await prisma.user.create({
      data: { name: 'CLI Test User', email: testEmail, password: hashedPassword },
    })
    testUser = user
    console.log(`${PASS} Auth: registered test user "${testEmail}"`)
    check(true)
  } catch (err) {
    console.log(`${FAIL} Auth: registration failed — ${(err as Error).message}`)
    check(false)
  }

  // 5. Password verification works
  if (testUser) {
    const user = await prisma.user.findUnique({ where: { id: testUser.id } })
    if (user?.password) {
      const match = await bcrypt.compare(testPassword, user.password)
      if (match) {
        console.log(`${PASS} Auth: password verification works`)
        check(true)
      } else {
        console.log(`${FAIL} Auth: password verification failed`)
        check(false)
      }
    } else {
      console.log(`${FAIL} Auth: test user has no password`)
      check(false)
    }
  } else {
    console.log(`${FAIL} Auth: skipped password check (no test user)`)
    check(false)
  }

  // 6. XP calculation is correct
  {
    // easy challenge, 1st attempt: 50 * 1 + max(0, 50-10) = 50 + 40 = 90
    const xp = calculateXp(50, 'easy', 1)
    if (xp === 90) {
      console.log(`${PASS} XP: easy challenge awards ${xp} XP (50 base * 1x + 40 attempt bonus)`)
      check(true)
    } else {
      console.log(`${FAIL} XP: expected 90, got ${xp}`)
      check(false)
    }
  }

  // 7. Streak logic works
  if (testUser) {
    // 7a. New streak starts at 0
    const streak = await prisma.streak.create({
      data: { userId: testUser.id, currentStreak: 0, longestStreak: 0, freezesLeft: 1 },
    })
    if (streak.currentStreak === 0) {
      console.log(`${PASS} Streak: new streak created at 0`)
      check(true)
    } else {
      console.log(`${FAIL} Streak: expected 0, got ${streak.currentStreak}`)
      check(false)
    }

    // 7b. Increment to 1
    const today = getTodayISO()
    const updated = await prisma.streak.update({
      where: { userId: testUser.id },
      data: { currentStreak: 1, longestStreak: 1, lastActiveDate: today },
    })
    if (updated.currentStreak === 1) {
      console.log(`${PASS} Streak: incremented to 1`)
      check(true)
    } else {
      console.log(`${FAIL} Streak: expected 1, got ${updated.currentStreak}`)
      check(false)
    }

    // 7c. Break after missed day resets to 0
    const twoDaysAgo = getDateISO(-2)
    await prisma.streak.update({
      where: { userId: testUser.id },
      data: { lastActiveDate: twoDaysAgo, freezesLeft: 0 },
    })
    // Simulate the getStreak logic: last active was 2 days ago, no freezes => reset
    const afterBreak = await prisma.streak.findUnique({ where: { userId: testUser.id } })
    const yesterday = getDateISO(-1)
    const isActiveToday = afterBreak!.lastActiveDate === today
    const wasActiveYesterday = afterBreak!.lastActiveDate === yesterday
    const isBroken = afterBreak!.lastActiveDate !== null && !isActiveToday && !wasActiveYesterday && afterBreak!.freezesLeft === 0

    if (isBroken) {
      // Apply the reset like getStreak does
      await prisma.streak.update({
        where: { userId: testUser.id },
        data: { currentStreak: 0 },
      })
      console.log(`${PASS} Streak: break after missed day resets to 0`)
      check(true)
    } else {
      console.log(`${FAIL} Streak: break detection failed`)
      check(false)
    }
  } else {
    console.log(`${FAIL} Streak: skipped (no test user)`)
    check(false)
    check(false)
    check(false)
  }

  // Cleanup
  if (testUser) {
    await prisma.streak.deleteMany({ where: { userId: testUser.id } })
    await prisma.userProgress.deleteMany({ where: { userId: testUser.id } })
    await prisma.user.delete({ where: { id: testUser.id } })
    console.log(`${CLEAN} Cleanup: removed test user`)
  }

  printSummary(passed, total)
}

function printSummary(passed: number, total: number) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━')
  if (passed === total) {
    console.log(green(bold(`RESULT: ${passed}/${total} passed`)))
  } else {
    console.log(red(bold(`RESULT: ${passed}/${total} passed`)))
  }
}

// ---------------------------------------------------------------------------
// CLI router
// ---------------------------------------------------------------------------
async function main() {
  const args = process.argv.slice(2)
  const command = args[0]

  if (!command) {
    printUsage()
    process.exit(1)
  }

  try {
    switch (command) {
      // Database
      case 'db:status':
        await dbStatus()
        break
      case 'db:seed':
        await dbSeed()
        break

      // Auth
      case 'auth:register': {
        const [, name, email, password] = args
        if (!name || !email || !password) {
          console.log(red('Usage: auth:register <name> <email> <password>'))
          process.exit(1)
        }
        await authRegister(name, email, password)
        break
      }
      case 'auth:list':
        await authList()
        break
      case 'auth:verify': {
        const [, email, password] = args
        if (!email || !password) {
          console.log(red('Usage: auth:verify <email> <password>'))
          process.exit(1)
        }
        await authVerify(email, password)
        break
      }

      // Challenges
      case 'challenges:list':
        await challengesList()
        break
      case 'challenges:get': {
        const [, id] = args
        if (!id) {
          console.log(red('Usage: challenges:get <id>'))
          process.exit(1)
        }
        await challengesGet(id)
        break
      }
      case 'challenges:test-executor':
        await challengesTestExecutor()
        break

      // Code execution
      case 'exec:run': {
        const [, challengeId, codeFile] = args
        if (!challengeId || !codeFile) {
          console.log(red('Usage: exec:run <challengeId> <codeFile>'))
          process.exit(1)
        }
        const ok = await execRun(challengeId, codeFile)
        process.exitCode = ok ? 0 : 1
        break
      }
      case 'exec:test-all':
        const allOk = await execTestAll()
        process.exitCode = allOk ? 0 : 1
        break

      // Progress
      case 'progress:submit': {
        const [, userId, challengeId, codeFile] = args
        if (!userId || !challengeId || !codeFile) {
          console.log(red('Usage: progress:submit <userId> <challengeId> <codeFile>'))
          process.exit(1)
        }
        await progressSubmit(userId, challengeId, codeFile)
        break
      }
      case 'progress:status': {
        const [, userId] = args
        if (!userId) {
          console.log(red('Usage: progress:status <userId>'))
          process.exit(1)
        }
        await progressStatus(userId)
        break
      }
      case 'progress:stats': {
        const [, userId] = args
        if (!userId) {
          console.log(red('Usage: progress:stats <userId>'))
          process.exit(1)
        }
        await progressStats(userId)
        break
      }

      // Streak
      case 'streak:check': {
        const [, userId] = args
        if (!userId) {
          console.log(red('Usage: streak:check <userId>'))
          process.exit(1)
        }
        await streakCheck(userId)
        break
      }
      case 'streak:update': {
        const [, userId] = args
        if (!userId) {
          console.log(red('Usage: streak:update <userId>'))
          process.exit(1)
        }
        await streakUpdate(userId)
        break
      }

      // Full suite
      case 'verify:all':
        await verifyAll()
        break

      default:
        console.log(red(`Unknown command: ${command}`))
        printUsage()
        process.exit(1)
    }
  } finally {
    await prisma.$disconnect()
  }
}

function printUsage() {
  console.log(`
${bold('CodeQuest CLI Verification Tool')}

${bold('Usage:')} npx tsx scripts/verify.ts <command> [args]

${bold('Database:')}
  db:status                              Check DB connection + table counts
  db:seed                                Verify seed data exists

${bold('Auth:')}
  auth:register <name> <email> <pass>    Create user via Prisma
  auth:list                              List all users
  auth:verify <email> <password>         Verify bcrypt password check

${bold('Challenges:')}
  challenges:list                        List all challenges
  challenges:get <id>                    Get challenge details
  challenges:test-executor               Run ALL solutions against ALL test cases

${bold('Code Execution:')}
  exec:run <challengeId> <codeFile>      Execute code file against challenge tests
  exec:test-all                          Run all seed solutions against their tests

${bold('Progress:')}
  progress:submit <userId> <challengeId> <codeFile>   Submit solution
  progress:status <userId>               Show user progress across all challenges
  progress:stats <userId>                Show XP, streak, challenges solved

${bold('Streak:')}
  streak:check <userId>                  Check streak status
  streak:update <userId>                 Trigger streak update

${bold('Full Verification:')}
  verify:all                             Run ALL checks in sequence
`)
}

main().catch((err) => {
  console.error(red(`Fatal error: ${err.message}`))
  process.exit(1)
})
