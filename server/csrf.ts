import { SignJWT, jwtVerify } from 'jose'
import { cookies, headers } from 'next/headers'
import { nanoid } from 'nanoid'

const secret = new TextEncoder().encode(
  process.env.CSRF_SECRET || 'development-secret-change-in-production'
)

export async function generateCSRFToken() {
  const token = nanoid()
  const jwt = await new SignJWT({ token })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1h')
    .sign(secret)
  
  const cookieStore = await cookies()
  cookieStore.set('csrf-token', jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60,
  })
  
  return jwt
}

export async function validateCSRFToken(token: string | null) {
  if (!token) return false
  
  try {
    const cookieStore = await cookies()
    const cookieToken = cookieStore.get('csrf-token')?.value
    
    if (!cookieToken || cookieToken !== token) {
      return false
    }
    
    const { payload } = await jwtVerify(token, secret)
    return true
  } catch {
    return false
  }
}

export async function checkOrigin() {
  const headersList = await headers()
  const origin = headersList.get('origin')
  const referer = headersList.get('referer')
  
  if (!origin && !referer) return false
  
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    'http://localhost:3000',
  ].filter(Boolean)
  
  const requestOrigin = origin || new URL(referer!).origin
  return allowedOrigins.includes(requestOrigin)
}

export function withCSRFProtection<T extends (...args: any[]) => Promise<any>>(
  fn: T
): T {
  return (async (...args: Parameters<T>) => {
    const formData = args[0] as FormData
    const csrfToken = formData?.get('csrf_token') as string | null
    
    const [isValidToken, isValidOrigin] = await Promise.all([
      validateCSRFToken(csrfToken),
      checkOrigin(),
    ])
    
    if (!isValidToken || !isValidOrigin) {
      return {
        error: 'Invalid request. Please refresh and try again.',
      }
    }
    
    return fn(...args)
  }) as T
}