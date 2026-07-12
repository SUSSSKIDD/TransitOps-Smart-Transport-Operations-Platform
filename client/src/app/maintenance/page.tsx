"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/axios"
import { Plus, CheckCircle } from "lucide-react"
import { format } from "date-fns"
import toast from "react-hot-toast"

export default function MaintenancePage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLogs = async () => {
    try {
      const res = await api.get("/maintenance")
      setLogs(res.data.data)
    } catch (error) {
      toast.error("Failed to load maintenance logs")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  const handleClose = async (id: string, description: string) => {
    if (confirm(`Mark "${description}" as resolved? This will make the vehicle available again.`)) {
      try {
        await api.patch(`/maintenance/${id}/close`)
        toast.success("Maintenance closed, vehicle is now AVAILABLE")
        fetchLogs()
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Failed to close maintenance")
      }
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Maintenance</h1>
            <p className="text-muted-foreground">Track vehicle repairs and shop time.</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-md">
            <Plus className="mr-2 h-4 w-4" /> Log Repair
          </Button>
        </div>

        <Card className="border-0 shadow-sm ring-1 ring-black/5 dark:ring-white/10">
          <CardHeader>
            <CardTitle>Service Logs</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-10 text-muted-foreground">Loading maintenance logs...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-gray-50 dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800">
                    <tr>
                      <th className="px-4 py-3 font-medium">Vehicle</th>
                      <th className="px-4 py-3 font-medium">Description</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Cost / Dates</th>
                      <th className="px-4 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                          No maintenance logs found
                        </td>
                      </tr>
                    ) : (
                      logs.map((log) => (
                        <tr key={log.id} className="border-b border-gray-50 dark:border-zinc-800/50 hover:bg-gray-50/50 dark:hover:bg-zinc-900/50">
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900 dark:text-gray-100">{log.vehicle.name}</div>
                            <div className="text-muted-foreground text-xs">{log.vehicle.registrationNumber}</div>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {log.description}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={log.isActive ? 'warning' : 'success'}>
                              {log.isActive ? 'IN SHOP' : 'RESOLVED'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            <div className="font-medium text-gray-900 dark:text-gray-100 mb-1">₹{log.cost.toLocaleString()}</div>
                            <div>Opened: {format(new Date(log.openedAt), "MMM d, yyyy")}</div>
                            {log.closedAt && <div>Closed: {format(new Date(log.closedAt), "MMM d, yyyy")}</div>}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {log.isActive && (
                              <Button size="sm" onClick={() => handleClose(log.id, log.description)} className="bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400">
                                <CheckCircle className="w-4 h-4 mr-1" /> Resolve
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
