"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { api } from "@/lib/axios"
import { Bus, Truck, Tool, CheckCircle, Activity, BarChart3, AlertCircle } from "lucide-react"
import { format } from "date-fns"

export default function DashboardPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get("/analytics/dashboard")
        setData(res.data.data)
      } catch (error) {
        console.error("Failed to fetch dashboard", error)
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="h-64 flex items-center justify-center">
          <div className="animate-pulse flex items-center text-gray-500">
            <Activity className="animate-spin mr-2" /> Loading dashboard metrics...
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!data) return <DashboardLayout><div>Error loading data</div></DashboardLayout>

  const { kpis, recentTrips } = data

  const statCards = [
    { title: "Vehicles Available", value: kpis.AVAILABLE, icon: Bus, color: "text-blue-500", bg: "bg-blue-100 dark:bg-blue-900/30" },
    { title: "Active Trips", value: kpis.ON_TRIP, icon: Truck, color: "text-green-500", bg: "bg-green-100 dark:bg-green-900/30" },
    { title: "In Maintenance", value: kpis.IN_SHOP, icon: Tool, color: "text-amber-500", bg: "bg-amber-100 dark:bg-amber-900/30" },
    { title: "Fleet Utilization", value: `${Math.round(kpis.fleetUtilization)}%`, icon: BarChart3, color: "text-purple-500", bg: "bg-purple-100 dark:bg-purple-900/30" },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your transit operations.</p>
        </div>

        {/* KPI Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat, i) => (
            <Card key={i} className="border-0 shadow-sm ring-1 ring-black/5 dark:ring-white/10">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          {/* Recent Trips Table */}
          <Card className="lg:col-span-4 border-0 shadow-sm ring-1 ring-black/5 dark:ring-white/10">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Trips</CardTitle>
                <CardDescription>Latest dispatch and completed activity</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTrips.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">No recent trips found.</div>
                ) : (
                  recentTrips.map((trip: any) => (
                    <div key={trip.id} className="flex items-center justify-between p-4 rounded-lg border border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50 transition-colors hover:bg-gray-100 dark:hover:bg-zinc-800">
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-full ${
                          trip.status === 'COMPLETED' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                          trip.status === 'DISPATCHED' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                          'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                        }`}>
                          {trip.status === 'COMPLETED' ? <CheckCircle size={18} /> : 
                           trip.status === 'DISPATCHED' ? <Truck size={18} /> : <AlertCircle size={18} />}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{trip.vehicle.name} • {trip.driver.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {trip.source} → {trip.destination}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={
                          trip.status === 'COMPLETED' ? 'success' : 
                          trip.status === 'DISPATCHED' ? 'default' : 'secondary'
                        }>
                          {trip.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1.5">
                          {format(new Date(trip.createdAt), "MMM d, h:mm a")}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Alert / Summary panel (Placeholder for charts in full app) */}
          <Card className="lg:col-span-3 border-0 shadow-sm ring-1 ring-black/5 dark:ring-white/10 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
            <CardHeader>
              <CardTitle>System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border border-blue-100 dark:border-blue-900/50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Drivers On Duty</span>
                    <span className="text-xl font-bold text-gray-900 dark:text-white">{kpis.driverOnDutyCount}</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-zinc-800 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(kpis.driverOnDutyCount / Math.max(1, (kpis.AVAILABLE + kpis.ON_TRIP))) * 100}%` }}></div>
                  </div>
                </div>

                <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border border-amber-100 dark:border-amber-900/50">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Vehicles in Shop</span>
                    <span className="text-xl font-bold text-amber-600 dark:text-amber-500">{kpis.IN_SHOP}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
