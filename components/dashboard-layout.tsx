"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { CurrentUser } from "@/lib/session"
import { canAccessModule } from "@/lib/rbac"
import { authClient } from "@/lib/auth-client"

interface DashboardLayoutProps {
  user?: CurrentUser | null
  children: React.ReactNode
}

const SIDEBAR_ITEMS = [
  { label: "Dashboard", href: "/dashboard", module: "dashboard" },
  { label: "Documents", href: "/documents", module: "documents" },
  { label: "Approvals", href: "/approvals", module: "approvals" },
  { label: "Projects", href: "/projects", module: "projects" },
  { label: "Vendors", href: "/vendors", module: "vendors" },
  { label: "Contracts", href: "/contracts", module: "contracts" },
  { label: "Risks", href: "/risks", module: "risks" },
  { label: "Compliance", href: "/compliance", module: "compliance" },
  { label: "Analytics", href: "/analytics", module: "analytics" },
]

export function DashboardLayout({ user, children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await authClient.signOut()
    router.push("/sign-in")
  }

  const accessibleItems = SIDEBAR_ITEMS.filter((item) =>
    user && user.permissions ? canAccessModule(user.permissions, item.module as any) : true,
  )

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile menu button */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-20 bg-background border-b flex items-center justify-between p-4">
        <div className="font-semibold">Meridian</div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-accent rounded-md"
        >
          {sidebarOpen ? "✕" : "≡"}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`w-64 bg-sidebar text-sidebar-foreground border-r border-border transition-all ${
          sidebarOpen ? "fixed inset-y-0 left-0 z-10 top-16" : "hidden md:block"
        } md:relative md:top-0`}
      >
        <div className="p-6 border-b">
          <div className="text-xl font-bold">🏦 Meridian</div>
          <p className="text-xs text-sidebar-foreground/60 mt-1">Governance Platform</p>
        </div>

        <nav className="p-4 space-y-2">
          {accessibleItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                pathname === item.href
                  ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent"
              }`}
              onClick={() => setSidebarOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <button
            onClick={handleLogout}
            className="w-full px-3 py-2 rounded-md text-sm bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors flex items-center justify-center gap-2"
          >
            🚪 Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <header className="bg-background border-b px-6 py-4 flex items-center justify-between">
          <div />
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.name || "Guest"}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
}
