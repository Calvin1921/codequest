'use client'

import { useActionState, useEffect, useState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { registerUser } from '@/server/actions/auth'

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      className="w-full bg-[#84cc16] text-black font-semibold hover:bg-[#a3e635] h-10 transition-colors"
      disabled={pending}
    >
      {pending ? 'Creating account...' : 'Create Account'}
    </Button>
  )
}

function PasswordStrength({ password }: { password: string }) {
  const getStrength = (pw: string): number => {
    if (!pw) return 0
    let score = 0
    if (pw.length >= 6) score++
    if (pw.length >= 10) score++
    if (/[A-Z]/.test(pw)) score++
    if (/[0-9]/.test(pw)) score++
    if (/[^A-Za-z0-9]/.test(pw)) score++
    return Math.min(score, 4)
  }

  const strength = getStrength(password)
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong']
  const colors = ['', 'bg-red-500', 'bg-yellow-500', 'bg-[#22d3ee]', 'bg-[#84cc16]']

  if (!password) return null

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
              strength >= level ? colors[strength] : 'bg-white/10'
            }`}
          />
        ))}
      </div>
      <p className={`text-xs ${strength >= 3 ? 'text-zinc-400' : 'text-zinc-600'}`}>
        {labels[strength]}
      </p>
    </div>
  )
}

export default function RegisterPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [state, formAction] = useActionState(registerUser, {
    message: '',
    errors: {},
    success: false,
  } satisfies import('@/server/actions/auth').RegisterState)

  useEffect(() => {
    if (state?.success) {
      router.push('/dashboard')
    }
  }, [state?.success, router])

  return (
    <div className="flex min-h-[calc(100vh-8rem)] w-full">
      {/* Left decorative panel - hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[#0a0a0b] via-[#0a1a1a] to-[#0a0a0b] items-center justify-center border-r border-white/5">
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(34,211,238,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.3) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
        <div className="relative z-10 max-w-md px-12 text-center">
          <Link href="/" className="text-4xl font-bold tracking-tight mb-8 block">
            Code<span className="text-[#84cc16]">Quest</span>
          </Link>
          <div className="mb-8 mx-auto h-px w-16 bg-gradient-to-r from-transparent via-[#22d3ee]/50 to-transparent" />
          <p className="text-2xl font-light text-zinc-300 leading-relaxed mb-4">
            &ldquo;Your journey to FAANG starts here.&rdquo;
          </p>
          <p className="text-sm text-zinc-600">
            200+ challenges. AI feedback. Real results.
          </p>
          {/* Decorative progress */}
          <div className="mt-12 rounded-lg border border-white/5 bg-white/[0.02] p-5 text-left">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#84cc16]/10 text-xs font-bold text-[#84cc16]">
                1
              </div>
              <div className="text-sm text-zinc-400">Create your account</div>
              <div className="ml-auto text-[#84cc16] text-xs">Now</div>
            </div>
            <div className="flex items-center gap-3 mb-4 opacity-50">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-xs font-bold text-zinc-600">
                2
              </div>
              <div className="text-sm text-zinc-600">Pick your first challenge</div>
            </div>
            <div className="flex items-center gap-3 opacity-30">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-xs font-bold text-zinc-700">
                3
              </div>
              <div className="text-sm text-zinc-700">Start your streak</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex w-full lg:w-1/2 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="text-2xl font-bold tracking-tight">
              Code<span className="text-[#84cc16]">Quest</span>
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">Create an account</h1>
            <p className="text-sm text-zinc-500">
              Start your interview prep journey today
            </p>
          </div>

          {/* OAuth buttons */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <Button
              variant="outline"
              onClick={() => signIn('github', { callbackUrl: '/dashboard' })}
              className="border-white/10 bg-white/[0.02] text-zinc-300 hover:bg-white/5 hover:text-white h-10"
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              GitHub
            </Button>
            <Button
              variant="outline"
              onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
              className="border-white/10 bg-white/[0.02] text-zinc-300 hover:bg-white/5 hover:text-white h-10"
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </Button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#0a0a0b] px-3 text-zinc-600">
                Or continue with email
              </span>
            </div>
          </div>

          <form action={formAction}>
            <div className="space-y-4">
              {state?.message && (
                <div role="alert" className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
                  {state.message}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm text-zinc-400">
                  Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Jane Doe"
                  required
                  className="border-white/10 bg-white/[0.03] text-white placeholder:text-zinc-600 focus:border-[#84cc16]/50 focus:ring-[#84cc16]/20 h-10"
                />
                {state?.errors?.name && (
                  <p role="alert" className="text-xs text-red-400">{state.errors.name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm text-zinc-400">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  className="border-white/10 bg-white/[0.03] text-white placeholder:text-zinc-600 focus:border-[#84cc16]/50 focus:ring-[#84cc16]/20 h-10"
                />
                {state?.errors?.email && (
                  <p role="alert" className="text-xs text-red-400">{state.errors.email}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm text-zinc-400">
                  Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  onChange={(e) => setPassword(e.target.value)}
                  className="border-white/10 bg-white/[0.03] text-white placeholder:text-zinc-600 focus:border-[#84cc16]/50 focus:ring-[#84cc16]/20 h-10"
                />
                <PasswordStrength password={password} />
                {state?.errors?.password && (
                  <p role="alert" className="text-xs text-red-400">{state.errors.password}</p>
                )}
              </div>
              <SubmitButton />
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-600">
            Already have an account?{' '}
            <Link href="/login" className="text-[#84cc16] hover:text-[#a3e635] transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
