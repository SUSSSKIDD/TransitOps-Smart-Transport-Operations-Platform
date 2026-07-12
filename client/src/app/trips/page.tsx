"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TripForm } from "@/components/forms/TripForm"
import { api } from "@/lib/axios"
import { format } from "date-fns"
import toast from "react-hot-toast"

export default function TripsPage() {
  const [trips, setTrips] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTrips = async () => {
    try {
      const res = await api.get("/trips")
      setTrips(res.data.data)
    } catch (error) {
      toast.error("Failed to load trips")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTrips()
  }, [])

  const handleDispatch = async (id: string) => {
    try {
      await api.patch(`/trips/${id}/dispatch`)
      toast.success("Trip dispatched successfully!")
      fetchTrips()
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to dispatch trip")
    }
  }

  const handleComplete = async (id: string, trip: any) => {
    try {
      const actualDistance = parseFloat(prompt("Enter actual distance (km):", trip.plannedDistance) || "0")
      const fuelConsumed = parseFloat(prompt("Enter fuel consumed (liters):", "0") || "0")
      
      if (!actualDistance || !fuelConsumed) return toast.error("Distance and fuel required")

      await api.patch(`/trips/${id}/complete`, { actualDistance, fuelConsumed })
      toast.success("Trip completed successfully!")
      fetchTrips()
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to complete trip")
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Trips</h1>
            <p className="text-muted-foreground">Manage and track all fleet dispatches.</p>
          </div>
          <TripForm onSuccess={fetchTrips} />
        </div>

        <Card className="border-0 shadow-sm ring-1 ring-black/5 dark:ring-white/10">
          <CardHeader>
            <CardTitle>All Trips</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-10 text-muted-foreground">Loading trips...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-gray-50 dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800">
                    <tr>
                      <th className="px-4 py-3 font-medium">Route</th>
                      <th className="px-4 py-3 font-medium">Vehicle / Driver</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Timeline</th>
                      <th className="px-4 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trips.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                          No trips found
                        </td>
                      </tr>
                    ) : (
                      trips.map((trip) => (
                        <tr key={trip.id} className="border-b border-gray-50 dark:border-zinc-800/50 hover:bg-gray-50/50 dark:hover:bg-zinc-900/50">
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900 dark:text-gray-100">{trip.source}</div>
                            <div className="text-muted-foreground">to {trip.destination}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium">{trip.vehicle.name}</div>
                            <div className="text-muted-foreground text-xs">{trip.driver.name}</div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={
                              trip.status === 'COMPLETED' ? 'success' : 
                              trip.status === 'DISPATCHED' ? 'default' : 
                              trip.status === 'CANCELLED' ? 'destructive' : 'secondary'
                            }>
                              {trip.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            <div>Created: {format(new Date(trip.createdAt), "MMM d, h:mm a")}</div>
                            {trip.dispatchedAt && <div>Dispatched: {format(new Date(trip.dispatchedAt), "MMM d, h:mm a")}</div>}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {trip.status === "DRAFT" && (
                              <Button size="sm" onClick={() => handleDispatch(trip.id)} className="bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400">
                                Dispatch
                              </Button>
                            )}
                            {trip.status === "DISPATCHED" && (
                              <Button size="sm" onClick={() => handleComplete(trip.id, trip)} className="bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400">
                                Complete
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
