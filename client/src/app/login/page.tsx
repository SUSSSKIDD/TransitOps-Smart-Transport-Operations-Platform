"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/useAuthStore"
import { api } from "@/lib/axios"
import toast from "react-hot-toast"

import { AnimatedGridPattern } from "@/components/ui/animated-grid-pattern"

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuthStore()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.post("/auth/login", { email, password })
      login(data.data)
      toast.success("Welcome back to TransitOPS!")
      router.push("/dashboard")
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background pattern */}
      <AnimatedGridPattern
        numSquares={40}
        maxOpacity={0.1}
        duration={3}
        repeatDelay={1}
        className="[mask-image:radial-gradient(800px_circle_at_center,white,transparent)] inset-0 z-0"
      />

      <div className="w-full max-w-md z-10 bg-surface-container-lowest border border-outline-variant rounded-lg micro-shadow relative overflow-hidden">
        {/* Top accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-secondary" />

        <div className="p-8 pt-10 text-center">
          {/* Logo */}
          <div className="mx-auto bg-primary w-16 h-16 rounded-lg flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-on-primary text-[32px]">local_shipping</span>
          </div>
          <h1 className="text-headline-lg text-primary">TransitOPS</h1>
          <p className="text-body-md text-on-surface-variant mt-2">Sign in to Dispatch Control</p>
        </div>

        <form onSubmit={handleLogin} className="px-8 pb-8 space-y-4">
          <div className="space-y-2">
            <label className="text-label-md text-on-surface-variant uppercase block">Email</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">mail</span>
              <input
                type="email"
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-md text-on-surface focus:outline-none focus:border-primary placeholder:text-outline"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-label-md text-on-surface-variant uppercase block">Password</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">lock</span>
              <input
                type="password"
                placeholder="Password"
                className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-md text-on-surface focus:outline-none focus:border-primary placeholder:text-outline"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-2.5 bg-secondary text-on-secondary text-label-md rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="px-8 pb-6 text-center">
          <p className="text-[12px] text-on-surface-variant flex items-center justify-center gap-1.5">
            <span className="material-symbols-outlined text-[14px]">info</span>
            Contact your administrator for credentials
          </p>
        </div>
      </div>
    </div>
  )
}
