"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { useAuthStore } from "@/store/useAuthStore"

type NavItem = {
  name: string
  href: string
  icon: string
  roles: string[]
}

const MAIN_NAV: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: "dashboard", roles: ["FLEET_MANAGER", "DRIVER", "SAFETY_OFFICER", "FINANCIAL_ANALYST"] },
  { name: "Trips", href: "/trips", icon: "route", roles: ["FLEET_MANAGER", "DRIVER", "SAFETY_OFFICER", "FINANCIAL_ANALYST"] },
  { name: "Fleet", href: "/vehicles", icon: "local_shipping", roles: ["FLEET_MANAGER", "SAFETY_OFFICER", "FINANCIAL_ANALYST"] },
  { name: "Drivers", href: "/drivers", icon: "person", roles: ["FLEET_MANAGER", "SAFETY_OFFICER"] },
  { name: "Expenses", href: "/expenses", icon: "payments", roles: ["FLEET_MANAGER", "DRIVER", "FINANCIAL_ANALYST"] },
]

const BOTTOM_NAV: NavItem[] = [
  { name: "Settings", href: "#", icon: "settings", roles: ["FLEET_MANAGER", "DRIVER", "SAFETY_OFFICER", "FINANCIAL_ANALYST"] },
  { name: "Support", href: "#", icon: "help", roles: ["FLEET_MANAGER", "DRIVER", "SAFETY_OFFICER", "FINANCIAL_ANALYST"] },
]

import { AnimatedGridPattern } from "@/components/ui/animated-grid-pattern"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isLoading, checkAuth, logout } = useAuthStore()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  if (isLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background relative overflow-hidden">
        <AnimatedGridPattern
          numSquares={30}
          maxOpacity={0.1}
          duration={3}
          repeatDelay={1}
          className="[mask-image:radial-gradient(1000px_circle_at_center,white,transparent)] inset-0"
        />
        <div className="animate-pulse flex flex-col items-center z-10">
          <span className="material-symbols-outlined text-5xl text-secondary mb-4 animate-bounce">local_shipping</span>
          <p className="text-on-surface-variant text-body-md">Loading TransitOPS...</p>
        </div>
      </div>
    )
  }

  const navigation = MAIN_NAV.filter(item => item.roles.includes(user.role))

  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row antialiased">
      {/* Mobile sidebar backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ─── Sidebar ─── */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-[260px] bg-primary flex flex-col
        transform transition-transform duration-300 ease-in-out
        md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="py-6 flex flex-col h-full">
          {/* Brand */}
          <div className="px-4 mb-8">
            <div className="text-headline-lg text-on-primary font-bold">TransitOPS</div>
            <div className="text-label-md text-on-primary/70 mt-1">Dispatch Control</div>
          </div>

          {/* ── New Trip button (top position like fleet_registry design) ── */}
          <div className="px-4 mb-4">
            <Link href="/trips">
              <button className="w-full bg-secondary text-on-secondary text-label-md py-2.5 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity cursor-pointer">
                <span className="material-symbols-outlined text-[20px]">add</span>
                New Trip
              </button>
            </Link>
          </div>

          {/* Main Nav */}
          <nav className="flex-1 space-y-0.5">
            {navigation.map((item) => {
              const isActive = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`
                    flex items-center gap-4 px-4 py-2.5 text-label-md transition-colors duration-200
                    ${isActive
                      ? "border-l-4 border-secondary bg-primary-container text-on-primary-container font-semibold"
                      : "text-on-primary/70 hover:text-on-primary hover:bg-primary-container/50 border-l-4 border-transparent"
                    }
                  `}
                >
                  <span className="material-symbols-outlined text-[20px]" style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                    {item.icon}
                  </span>
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* Bottom Nav */}
          <nav className="space-y-0.5 border-t border-on-primary/10 pt-2">
            {BOTTOM_NAV.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="flex items-center gap-4 text-on-primary/70 hover:text-on-primary px-4 py-2.5 hover:bg-primary-container/50 transition-colors duration-200 text-label-md border-l-4 border-transparent"
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                <span>{item.name}</span>
              </a>
            ))}
          </nav>

          {/* User info */}
          <div className="px-4 pt-4 border-t border-on-primary/10 mt-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold text-sm">
                {user.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-on-primary truncate">{user.name}</p>
                <p className="text-[11px] text-on-primary/50 truncate">{user.role.replace(/_/g, ' ')}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 text-on-primary/50 hover:text-error-container rounded transition-colors cursor-pointer"
                title="Sign out"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ─── Main Area ─── */}
      <div className="flex-1 md:ml-[260px] flex flex-col min-h-screen">
        {/* ─── Top Nav Bar ─── */}
        <header className="flex justify-between items-center w-full h-16 px-4 md:px-8 bg-surface border-b border-outline-variant z-40 sticky top-0">
          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 text-on-surface-variant hover:text-primary rounded transition-colors cursor-pointer"
            onClick={() => setIsSidebarOpen(true)}
          >
            <span className="material-symbols-outlined">menu</span>
          </button>

          {/* Desktop left side */}
          <div className="hidden md:flex items-center gap-6 flex-1">
            <div className="relative w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">search</span>
              <input
                className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-md text-on-surface focus:outline-none focus:border-primary placeholder:text-outline"
                placeholder="Search..."
                type="text"
              />
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-surface-container-low rounded-full transition-colors text-on-surface-variant cursor-pointer">
              <span className="material-symbols-outlined text-[20px]">notifications</span>
            </button>
            <button className="p-2 hover:bg-surface-container-low rounded-full transition-colors text-on-surface-variant cursor-pointer">
              <span className="material-symbols-outlined text-[20px]">settings</span>
            </button>
            <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold text-sm border border-outline-variant">
              {user.name.charAt(0)}
            </div>
          </div>
        </header>

        {/* ─── Main Content Canvas ─── */}
        <main className="flex-1 p-4 md:p-8 bg-background overflow-x-hidden relative">
          <AnimatedGridPattern
            numSquares={50}
            maxOpacity={0.08}
            duration={3}
            repeatDelay={1}
            className="[mask-image:radial-gradient(1000px_circle_at_center,white,transparent)] inset-0 z-0"
          />
          <div className="relative z-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
