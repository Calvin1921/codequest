import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Suspense } from "react"

async function UserNav() {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/login")
  }

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-muted-foreground">
        {session.user.email}
      </span>
      <form action={async () => {
        'use server'
        const { signOut } = await import("@/lib/auth")
        await signOut({ redirectTo: "/" })
      }}>
        <Button variant="ghost" type="submit">
          Sign Out
        </Button>
      </form>
    </div>
  )
}

export default async function AppLayout({
  children,
  modal,
}: {
  children: React.ReactNode
  modal: React.ReactNode
}) {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-2xl font-bold">
              Dashboard
            </Link>
            <nav className="flex gap-4">
              <Button variant="ghost" asChild>
                <Link href="/dashboard">Home</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/challenges">Challenges</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/posts">Posts</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/settings">Settings</Link>
              </Button>
            </nav>
          </div>
          <Suspense fallback={<div>Loading...</div>}>
            <UserNav />
          </Suspense>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        {children}
        {modal}
      </main>
    </div>
  )
}