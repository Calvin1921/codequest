import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? Redis.fromEnv()
    : null

function createRateLimiter(
  limiter: ReturnType<typeof Ratelimit.slidingWindow>,
  prefix: string
) {
  if (!redis) return null
  return new Ratelimit({
    redis,
    limiter,
    analytics: true,
    prefix,
  })
}

export const rateLimiters = {
  auth: createRateLimiter(
    Ratelimit.slidingWindow(5, '15 m'),
    '@upstash/ratelimit:auth'
  ),

  posts: createRateLimiter(
    Ratelimit.slidingWindow(10, '1 h'),
    '@upstash/ratelimit:posts'
  ),

  api: createRateLimiter(
    Ratelimit.slidingWindow(100, '1 h'),
    '@upstash/ratelimit:api'
  ),
}

export async function checkRateLimit(
  identifier: string,
  type: keyof typeof rateLimiters = 'api'
) {
  const limiter = rateLimiters[type]
  if (!limiter) {
    return {
      success: true,
      limit: 0,
      reset: 0,
      remaining: 0,
      headers: {},
    }
  }

  const { success, limit, reset, remaining } = await limiter.limit(identifier)

  return {
    success,
    limit,
    reset,
    remaining,
    headers: {
      'X-RateLimit-Limit': limit.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': new Date(reset).toISOString(),
    },
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- generic HOF requires any for argument/return flexibility
export function withRateLimit<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  type: keyof typeof rateLimiters = 'api'
): T {
  return (async (...args: Parameters<T>) => {
    if (!redis) {
      return fn(...args)
    }

    const identifier = await getIdentifier()
    const { success, headers } = await checkRateLimit(identifier, type)

    if (!success) {
      return {
        message: 'Too many requests. Please try again later.',
        headers,
      }
    }

    return fn(...args)
  }) as T
}

async function getIdentifier() {
  const { auth } = await import('@/lib/auth')
  const session = await auth()

  if (session?.user?.id) {
    return `user:${session.user.id}`
  }

  const { headers } = await import('next/headers')
  const headersList = await headers()
  const realIp = headersList.get('x-real-ip')
  const forwarded = headersList.get('x-forwarded-for')
  const ip = realIp ?? (forwarded ? forwarded.split(',')[0] : 'anonymous')

  return `ip:${ip}`
}
