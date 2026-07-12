"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { TripForm } from "@/components/forms/TripForm"
import { api } from "@/lib/axios"
import { format } from "date-fns"
import toast from "react-hot-toast"

type TabKey = "active" | "completed" | "cancelled"

const STATUS_TABS: { key: TabKey; label: string; statuses: string[] }[] = [
  { key: "active", label: "Active Trips", statuses: ["DRAFT", "DISPATCHED"] },
  { key: "completed", label: "Completed", statuses: ["COMPLETED"] },
  { key: "cancelled", label: "Cancelled", statuses: ["CANCELLED"] },
]

export default function TripsPage() {
  const [trips, setTrips] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabKey>("active")

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

  const currentStatuses = STATUS_TABS.find(t => t.key === activeTab)?.statuses || []
  const filteredTrips = trips.filter(t => currentStatuses.includes(t.status))
  const activeCount = trips.filter(t => ["DRAFT", "DISPATCHED"].includes(t.status)).length

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DISPATCHED":
        return "bg-primary-container text-on-primary-container border border-primary/20"
      case "DRAFT":
        return "bg-surface-container-highest text-on-surface border border-outline-variant"
      case "COMPLETED":
        return "bg-success-bg text-success border border-success/20"
      case "CANCELLED":
        return "bg-error-container text-on-error-container border border-error/20"
      default:
        return "bg-surface-container-highest text-on-surface border border-outline-variant"
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-headline-lg text-primary">Trip Management</h1>
            <p className="text-body-md text-on-surface-variant mt-1">Monitor and control fleet deployments.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 bg-surface border border-outline-variant text-on-surface text-label-md px-4 py-2 rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-[18px]">tune</span> Filters
            </button>
            <button className="flex items-center gap-2 bg-surface border border-outline-variant text-on-surface text-label-md px-4 py-2 rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-[18px]">download</span> Export
            </button>
            <TripForm onSuccess={fetchTrips} />
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex items-center gap-6 border-b border-outline-variant">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 text-body-md transition-colors relative cursor-pointer ${
                activeTab === tab.key
                  ? "text-secondary font-semibold"
                  : "text-on-surface-variant hover:text-primary"
              }`}
            >
              {tab.label}
              {tab.key === "active" && (
                <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold bg-secondary/10 text-secondary rounded-full">
                  {activeCount}
                </span>
              )}
              {activeTab === tab.key && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-secondary rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden micro-shadow">
          {loading ? (
            <div className="text-center py-10 text-on-surface-variant text-body-md">Loading trips...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant">
                    <th className="p-3 text-label-md text-on-surface-variant uppercase tracking-wider pl-4">Trip ID</th>
                    <th className="p-3 text-label-md text-on-surface-variant uppercase tracking-wider">Route</th>
                    <th className="p-3 text-label-md text-on-surface-variant uppercase tracking-wider">Vehicle / Driver</th>
                    <th className="p-3 text-label-md text-on-surface-variant uppercase tracking-wider">Cargo</th>
                    <th className="p-3 text-label-md text-on-surface-variant uppercase tracking-wider">Status</th>
                    <th className="p-3 text-label-md text-on-surface-variant uppercase tracking-wider pr-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-body-md divide-y divide-outline-variant">
                  {filteredTrips.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-on-surface-variant">
                        No trips found for this filter.
                      </td>
                    </tr>
                  ) : (
                    filteredTrips.map((trip) => (
                      <tr key={trip.id} className="hover:bg-surface-bright transition-colors group">
                        <td className="p-3 pl-4 text-data-mono text-primary font-medium">
                          {trip.id.substring(0, 8).toUpperCase()}
                        </td>
                        <td className="p-3">
                          <div className="text-on-surface font-medium">
                            {trip.source} <span className="text-on-surface-variant mx-1">→</span> {trip.destination}
                          </div>
                          <div className="text-[12px] text-on-surface-variant mt-0.5">
                            {trip.dispatchedAt
                              ? `Dispatched: ${format(new Date(trip.dispatchedAt), "MMM d, h:mm a")}`
                              : trip.completedAt
                              ? `Arrived: ${format(new Date(trip.completedAt), "MMM d, h:mm a")}`
                              : "Pending Schedule"}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-on-surface">{trip.vehicle?.name || "Unassigned"} <span className="text-on-surface-variant text-[12px]">({trip.vehicle?.type})</span></div>
                          <div className="text-[12px] text-on-surface-variant">{trip.driver?.name || "--"}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-on-surface">{trip.cargoWeightKg?.toLocaleString()} kg</div>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold ${getStatusBadge(trip.status)}`}>
                            {trip.status}
                          </span>
                        </td>
                        <td className="p-3 pr-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {trip.status === "DRAFT" && (
                              <button onClick={() => handleDispatch(trip.id)} className="text-secondary font-semibold text-body-md hover:underline cursor-pointer">
                                Dispatch
                              </button>
                            )}
                            {trip.status === "DISPATCHED" && (
                              <button onClick={() => handleComplete(trip.id, trip)} className="text-on-surface font-medium text-body-md hover:underline cursor-pointer">
                                Complete
                              </button>
                            )}
                            {trip.status === "COMPLETED" && (
                              <span className="text-on-surface-variant text-body-md">View</span>
                            )}
                            <button className="material-symbols-outlined text-outline hover:text-primary text-[18px] cursor-pointer">more_vert</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {filteredTrips.length > 0 && (
            <div className="p-4 border-t border-outline-variant flex justify-between items-center">
              <span className="text-body-md text-on-surface-variant">
                Showing <span className="font-semibold text-on-surface">1</span> to <span className="font-semibold text-on-surface">{filteredTrips.length}</span> of <span className="font-semibold text-on-surface">{trips.length}</span> results
              </span>
              <div className="flex items-center gap-1">
                <button className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant text-on-surface-variant hover:bg-surface-container-low transition-colors cursor-pointer">‹</button>
                <button className="w-8 h-8 flex items-center justify-center rounded bg-primary text-on-primary font-semibold text-sm">1</button>
                <button className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant text-on-surface-variant hover:bg-surface-container-low transition-colors cursor-pointer">2</button>
                <button className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant text-on-surface-variant hover:bg-surface-container-low transition-colors cursor-pointer">›</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
