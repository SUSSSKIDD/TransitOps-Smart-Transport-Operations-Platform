"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/axios"
import { Plus, UserX } from "lucide-react"
import { format } from "date-fns"
import toast from "react-hot-toast"

export default function DriversPage() {
  const [drivers, setDrivers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDrivers = async () => {
    try {
      const res = await api.get("/drivers")
      setDrivers(res.data.data)
    } catch (error) {
      toast.error("Failed to load drivers")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDrivers()
  }, [])

  const handleSuspend = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to suspend driver ${name}?`)) {
      try {
        await api.patch(`/drivers/${id}/suspend`)
        toast.success("Driver suspended")
        fetchDrivers()
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Failed to suspend driver")
      }
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Drivers</h1>
            <p className="text-muted-foreground">Manage driver profiles and status.</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-md">
            <Plus className="mr-2 h-4 w-4" /> Add Driver
          </Button>
        </div>

        <Card className="border-0 shadow-sm ring-1 ring-black/5 dark:ring-white/10">
          <CardHeader>
            <CardTitle>Driver Roster</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-10 text-muted-foreground">Loading drivers...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-gray-50 dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800">
                    <tr>
                      <th className="px-4 py-3 font-medium">Driver Info</th>
                      <th className="px-4 py-3 font-medium">License</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Safety Score</th>
                      <th className="px-4 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drivers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                          No drivers found
                        </td>
                      </tr>
                    ) : (
                      drivers.map((driver) => (
                        <tr key={driver.id} className="border-b border-gray-50 dark:border-zinc-800/50 hover:bg-gray-50/50 dark:hover:bg-zinc-900/50">
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900 dark:text-gray-100">{driver.name}</div>
                            <div className="text-muted-foreground text-xs">{driver.contactNumber}</div>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            <div>{driver.licenseNumber}</div>
                            <div>Exp: {format(new Date(driver.licenseExpiryDate), "MMM d, yyyy")}</div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={
                              driver.status === 'AVAILABLE' ? 'success' : 
                              driver.status === 'ON_TRIP' ? 'default' : 
                              driver.status === 'OFF_DUTY' ? 'secondary' : 'destructive'
                            }>
                              {driver.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center">
                              <span className={`font-medium ${driver.safetyScore >= 90 ? 'text-green-600' : driver.safetyScore >= 75 ? 'text-yellow-600' : 'text-red-600'}`}>
                                {driver.safetyScore}/100
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {driver.status !== "SUSPENDED" && (
                              <Button size="sm" variant="ghost" onClick={() => handleSuspend(driver.id, driver.name)} className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30">
                                <UserX className="w-4 h-4 mr-1" /> Suspend
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
