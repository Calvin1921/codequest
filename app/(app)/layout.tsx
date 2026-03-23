import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Suspense } from "react"
import {
  LayoutDashboard,
  Code2,
  FileText,
  Settings,
  LogOut,
  Flame,
  Zap,
} from "lucide-react"
import { prisma } from "@/server/db"
import { SidebarWrapper } from "@/components/sidebar-wrapper"

// ---------------------------------------------------------------------------
// Nav items config
// ---------------------------------------------------------------------------
const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/challenges", label: "Challenges", icon: Code2 },
  { href: "/posts", label: "Posts", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
] as const

// ---------------------------------------------------------------------------
// Sidebar streak display (server component)
// ---------------------------------------------------------------------------
async function SidebarStreak({ userId }: { userId: string }) {
  let currentStreak = 0
  try {
    const streak = await prisma.streak.findUnique({
      where: { userId },
      select: { currentStreak: true },
    })
    currentStreak = streak?.currentStreak ?? 0
  } catch {
    // Streak table may not exist yet
  }

  return (
    <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2">
      <Flame className="h-4 w-4 text-amber-500 shrink-0" />
      <span className="text-sm font-bold font-mono text-amber-500 sidebar-label">
        {currentStreak}
      </span>
      <span className="text-xs text-amber-500/70 sidebar-label">
        {currentStreak === 1 ? "day" : "days"}
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// User section at bottom of sidebar (server component)
// ---------------------------------------------------------------------------
async function SidebarUser() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const email = session.user.email ?? ""
  const name = session.user.name ?? email
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  // Fetch XP
  let totalXp = 0
  try {
    if (session.user.id) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { totalXp: true },
      })
      totalXp = user?.totalXp ?? 0
    }
  } catch {
    // totalXp field may not exist yet
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-lime-500/15 border border-lime-500/30 text-sm font-bold text-lime-400">
          {initials || "?"}
        </div>
        <div className="min-w-0 flex-1 sidebar-label">
          <p className="truncate text-sm font-medium text-zinc-200">
            {name}
          </p>
          {name !== email && (
            <p className="truncate text-xs text-zinc-500">{email}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1.5 rounded-md bg-lime-500/10 border border-lime-500/20 px-2.5 py-1.5 sidebar-label">
        <Zap className="h-3.5 w-3.5 text-lime-400 shrink-0" />
        <span className="text-xs font-bold font-mono text-lime-400">
          {totalXp.toLocaleString()} XP
        </span>
      </div>
      <form
        action={async () => {
          "use server"
          const { signOut } = await import("@/lib/auth")
          await signOut({ redirectTo: "/" })
        }}
      >
        <Button
          variant="ghost"
          type="submit"
          className="w-full justify-start gap-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60 h-8 px-2 text-xs"
        >
          <LogOut className="h-3.5 w-3.5 shrink-0" />
          <span className="sidebar-label">Sign Out</span>
        </Button>
      </form>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Navigation link component
// ---------------------------------------------------------------------------
function NavLink({
  href,
  label,
  icon: Icon,
}: {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <Link
      href={href}
      className="group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:text-lime-400 hover:bg-lime-500/5"
    >
      <Icon className="h-[18px] w-[18px] shrink-0" />
      <span className="sidebar-label">{label}</span>
    </Link>
  )
}

// ---------------------------------------------------------------------------
// Mobile bottom tab bar
// ---------------------------------------------------------------------------
function MobileTabBar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-sm md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center gap-1 px-3 py-1.5 text-zinc-500 hover:text-lime-400 transition-colors"
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}

// ---------------------------------------------------------------------------
// Sidebar inner content (extracted so SidebarWrapper handles the <aside>)
// ---------------------------------------------------------------------------
function SidebarContent({ userId }: { userId: string | undefined }) {
  return (
    <>
      <div className="flex h-16 items-center gap-2 border-b border-zinc-800/80 px-5 shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-lime-500/15 border border-lime-500/30 shrink-0">
          <Code2 className="h-[18px] w-[18px] text-lime-400" />
        </div>
        <span className="text-lg font-bold tracking-tight whitespace-nowrap sidebar-label">
          <span className="text-lime-400">Code</span>
          <span className="text-zinc-300">Quest</span>
        </span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
          />
        ))}
      </nav>

      <div className="px-4 pb-3">
        <Suspense
          fallback={
            <div className="h-10 rounded-lg bg-zinc-800/50 animate-pulse" />
          }
        >
          {userId && <SidebarStreak userId={userId} />}
        </Suspense>
      </div>

      <div className="border-t border-zinc-800/80 px-4 py-4">
        <Suspense
          fallback={
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-zinc-800 animate-pulse" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3.5 w-24 rounded bg-zinc-800 animate-pulse" />
                  <div className="h-3 w-32 rounded bg-zinc-800 animate-pulse" />
                </div>
              </div>
            </div>
          }
        >
          <SidebarUser />
        </Suspense>
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// Mobile header
// ---------------------------------------------------------------------------
function MobileHeader({ userId }: { userId: string | undefined }) {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-zinc-800/80 bg-zinc-950/95 backdrop-blur-sm px-4 md:hidden">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-lime-500/15 border border-lime-500/30">
          <Code2 className="h-4 w-4 text-lime-400" />
        </div>
        <span className="text-base font-bold tracking-tight">
          <span className="text-lime-400">Code</span>
          <span className="text-zinc-300">Quest</span>
        </span>
      </div>
      <Suspense fallback={null}>
        {userId && <SidebarStreak userId={userId} />}
      </Suspense>
    </header>
  )
}

// ---------------------------------------------------------------------------
// Main Layout
// ---------------------------------------------------------------------------
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

  const userId = session.user?.id

  return (
    <SidebarWrapper
      sidebarContent={<SidebarContent userId={userId} />}
      mobileHeader={<MobileHeader userId={userId} />}
      mobileTabBar={<MobileTabBar />}
    >
      <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {children}
        {modal}
      </div>
    </SidebarWrapper>
  )
}
