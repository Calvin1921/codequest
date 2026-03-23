'use client'

import { useState, useEffect, useCallback } from 'react'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'

interface SidebarWrapperProps {
  children: React.ReactNode
  sidebarContent: React.ReactNode
  mobileHeader: React.ReactNode
  mobileTabBar: React.ReactNode
}

export function SidebarWrapper({
  children,
  sidebarContent,
  mobileHeader,
  mobileTabBar,
}: SidebarWrapperProps) {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('cq-sidebar-collapsed') === 'true'
    }
    return false
  })

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev
      localStorage.setItem('cq-sidebar-collapsed', String(next))
      return next
    })
  }, [])

  // Cmd+B / Ctrl+B keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault()
        toggle()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [toggle])

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Inject style for collapsed sidebar labels */}
      {collapsed && (
        <style>{`
          .sidebar-label {
            display: none !important;
          }
        `}</style>
      )}

      {/* Desktop sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-zinc-800/80 bg-zinc-950 transition-[width] duration-200 ease-in-out md:flex ${
          collapsed ? 'w-[52px]' : 'w-60'
        }`}
      >
        {/* Collapse toggle button */}
        <button
          type="button"
          onClick={toggle}
          title={collapsed ? 'Expand sidebar (Cmd+B)' : 'Collapse sidebar (Cmd+B)'}
          className="absolute -right-3 top-5 z-50 flex h-6 w-6 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-400 shadow-md transition-colors hover:bg-zinc-800 hover:text-lime-400"
        >
          {collapsed ? (
            <PanelLeftOpen className="h-3.5 w-3.5" />
          ) : (
            <PanelLeftClose className="h-3.5 w-3.5" />
          )}
        </button>

        {/* Sidebar inner content — overflow hidden when collapsed */}
        <div className={`flex h-full flex-col ${collapsed ? 'overflow-hidden' : ''}`}>
          {sidebarContent}
        </div>
      </aside>

      {/* Mobile header */}
      {mobileHeader}

      {/* Main content area */}
      <main
        className={`min-h-screen pb-20 md:pb-0 transition-[padding] duration-200 ease-in-out ${
          collapsed ? 'md:pl-[52px]' : 'md:pl-60'
        }`}
      >
        {children}
      </main>

      {/* Mobile tab bar */}
      {mobileTabBar}
    </div>
  )
}
