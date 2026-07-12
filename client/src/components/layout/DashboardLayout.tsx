"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { useAuthStore } from "@/store/useAuthStore"
import { 
  Bus, 
  LayoutDashboard, 
  Users, 
  Truck, 
  Wrench, 
  DollarSign, 
  LogOut,
  Menu,
  X
} from "lucide-react"

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
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-zinc-950">
        <div className="animate-pulse flex flex-col items-center">
          <Bus className="h-12 w-12 text-blue-500 mb-4 animate-bounce" />
          <p className="text-gray-500 font-medium">Loading TransitOps...</p>
        </div>
      </div>
    )
  }

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Trips", href: "/trips", icon: Truck },
    { name: "Vehicles", href: "/vehicles", icon: Bus },
    { name: "Drivers", href: "/drivers", icon: Users },
    { name: "Maintenance", href: "/maintenance", icon: Wrench },
    { name: "Expenses", href: "/expenses", icon: DollarSign },
  ]

  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-zinc-900 flex">
      {/* Mobile sidebar backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-zinc-950 border-r border-gray-200 dark:border-zinc-800 
        transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:flex-shrink-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex h-16 items-center px-6 border-b border-gray-200 dark:border-zinc-800">
          <Bus className="h-8 w-8 text-blue-600 mr-3" />
          <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">TransitOps</span>
        </div>
        
        <div className="flex flex-col h-[calc(100vh-4rem)]">
          <div className="px-4 py-6 space-y-1 flex-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`
                    group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors
                    ${isActive 
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400" 
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800/50"}
                  `}
                >
                  <item.icon className={`mr-3 h-5 w-5 ${isActive ? "text-blue-700 dark:text-blue-400" : "text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"}`} />
                  {item.name}
                </Link>
              )
            })}
          </div>
          
          <div className="p-4 border-t border-gray-200 dark:border-zinc-800">
            <div className="flex items-center mb-4 px-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold mr-3">
                {user.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">{user.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white dark:bg-zinc-950 border-b border-gray-200 dark:border-zinc-800 h-16 flex items-center px-4 sm:px-6 lg:px-8">
          <button
            className="lg:hidden text-gray-500 hover:text-gray-700 mr-4"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1 flex justify-end">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
              {user.role.replace('_', ' ')}
            </span>
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
