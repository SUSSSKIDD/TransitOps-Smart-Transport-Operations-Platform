"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/useAuthStore"
import { api } from "@/lib/axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import toast from "react-hot-toast"
import { Bus, Lock, Mail } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuthStore()
  const [email, setEmail] = useState("fleetmanager@transitops.com")
  const [password, setPassword] = useState("Password123!")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.post("/auth/login", { email, password })
      login(data.data)
      toast.success("Welcome back to TransitOps!")
      router.push("/dashboard")
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950 p-4">
      <div className="absolute inset-0 z-0 h-full w-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
      
      <Card className="w-full max-w-md z-10 shadow-2xl border-0 ring-1 ring-black/5 dark:ring-white/10 relative overflow-hidden backdrop-blur-xl bg-white/80 dark:bg-zinc-900/80">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
        <CardHeader className="space-y-3 pb-6 pt-8 text-center">
          <div className="mx-auto bg-blue-100 dark:bg-blue-900/30 p-3 rounded-2xl w-16 h-16 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Bus size={32} />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold tracking-tight">TransitOps</CardTitle>
            <CardDescription className="mt-2 text-base">Sign in to manage your fleet operations</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input 
                  type="email" 
                  placeholder="name@example.com" 
                  className="pl-9 h-11 bg-white dark:bg-zinc-950 border-gray-200 dark:border-zinc-800 focus-visible:ring-blue-500" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input 
                  type="password" 
                  placeholder="Password" 
                  className="pl-9 h-11 bg-white dark:bg-zinc-950 border-gray-200 dark:border-zinc-800 focus-visible:ring-blue-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium text-base transition-colors" 
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center pb-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Demo credentials are pre-filled
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
