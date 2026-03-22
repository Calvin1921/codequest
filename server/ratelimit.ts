import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

export const rateLimiters = {
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '15 m'),
    analytics: true,
    prefix: '@upstash/ratelimit:auth',
  }),
  
  posts: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 h'),
    analytics: true,
    prefix: '@upstash/ratelimit:posts',
  }),
  
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 h'),
    analytics: true,
    prefix: '@upstash/ratelimit:api',
  }),
}

export async function checkRateLimit(
  identifier: string,
  type: keyof typeof rateLimiters = 'api'
) {
  const limiter = rateLimiters[type]
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

export function withRateLimit<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  type: keyof typeof rateLimiters = 'api'
): T {
  return (async (...args: Parameters<T>) => {
    const identifier = await getIdentifier()
    const { success, headers } = await checkRateLimit(identifier, type)
    
    if (!success) {
      return {
        error: 'Too many requests. Please try again later.',
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
  const forwarded = headersList.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : 'anonymous'
  
  return `ip:${ip}`
}