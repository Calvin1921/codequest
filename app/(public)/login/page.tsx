"use client"

import { useActionState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"

type LoginState = { error?: string; success?: boolean }

async function loginAction(prevState: LoginState | null, formData: FormData): Promise<LoginState> {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  try {
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      return { error: "Invalid email or password" }
    }

    return { success: true }
  } catch {
    return { error: "An error occurred during login" }
  }
}

export default function LoginPage() {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(loginAction, null)

  useEffect(() => {
    if (state?.success) {
      router.push("/dashboard")
    }
  }, [state?.success, router])

  return (
    <div className="flex min-h-[calc(100vh-8rem)] w-full">
      {/* Left decorative panel - hidden on mobile */}
      <div className="relative hidden items-center justify-center overflow-hidden border-r border-white/5 bg-gradient-to-br from-[#0a0a0b] via-[#0f1a0a] to-[#0a0a0b] lg:flex lg:w-1/2">
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(132,204,22,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(132,204,22,0.3) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="relative z-10 max-w-md px-12 text-center">
          <Link href="/" className="mb-8 block text-4xl font-bold tracking-tight">
            Code<span className="text-[#84cc16]">Quest</span>
          </Link>
          <div className="mx-auto mb-8 h-px w-16 bg-gradient-to-r from-transparent via-[#84cc16]/50 to-transparent" />
          <p className="mb-4 text-2xl leading-relaxed font-light text-zinc-300">
            &ldquo;Every expert was once a beginner.&rdquo;
          </p>
          <p className="text-sm text-zinc-600">Welcome back. Your streak is waiting.</p>
          {/* Decorative code snippet */}
          <div className="mt-12 rounded-lg border border-white/5 bg-white/[0.02] p-4 text-left font-mono text-xs leading-relaxed text-zinc-600">
            <div>
              <span className="text-[#84cc16]/60">const</span> engineer = {"{"}
            </div>
            <div className="pl-4">
              <span className="text-[#22d3ee]/60">skills</span>: [
              <span className="text-[#84cc16]/60">&quot;solving&quot;</span>,{" "}
              <span className="text-[#84cc16]/60">&quot;growing&quot;</span>],
            </div>
            <div className="pl-4">
              <span className="text-[#22d3ee]/60">streak</span>:{" "}
              <span className="text-[#84cc16]/60">active</span>,
            </div>
            <div>{"}"}</div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="mb-8 text-center lg:hidden">
            <Link href="/" className="text-2xl font-bold tracking-tight">
              Code<span className="text-[#84cc16]">Quest</span>
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="mb-2 text-2xl font-bold text-white">Welcome back</h1>
            <p className="text-sm text-zinc-500">Sign in to your account to continue</p>
          </div>

          {/* OAuth buttons */}
          <div className="mb-6 grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
              disabled={isPending}
              className="h-10 border-white/10 bg-white/[0.02] text-zinc-300 hover:bg-white/5 hover:text-white"
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              GitHub
            </Button>
            <Button
              variant="outline"
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
              disabled={isPending}
              className="h-10 border-white/10 bg-white/[0.02] text-zinc-300 hover:bg-white/5 hover:text-white"
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Google
            </Button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#0a0a0b] px-3 text-zinc-600">Or continue with email</span>
            </div>
          </div>

          <form action={formAction}>
            <div className="space-y-4">
              {state?.error && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400"
                >
                  {state.error}
                </div>
              )}
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
                  disabled={isPending}
                  className="h-10 border-white/10 bg-white/[0.03] text-white placeholder:text-zinc-600 focus:border-[#84cc16]/50 focus:ring-[#84cc16]/20"
                />
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
                  disabled={isPending}
                  className="h-10 border-white/10 bg-white/[0.03] text-white placeholder:text-zinc-600 focus:border-[#84cc16]/50 focus:ring-[#84cc16]/20"
                />
              </div>
              <Button
                type="submit"
                className="h-10 w-full bg-[#84cc16] font-semibold text-black transition-colors hover:bg-[#a3e635]"
                disabled={isPending}
              >
                {isPending ? "Signing in..." : "Sign In"}
              </Button>
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-600">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="text-[#84cc16] transition-colors hover:text-[#a3e635]"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
