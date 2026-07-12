"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { VehicleForm } from "@/components/forms/VehicleForm"
import { api } from "@/lib/axios"
import toast from "react-hot-toast"

const TYPE_FILTERS = ["All", "Van", "Truck", "Bus"]
const STATUS_FILTERS = [
  { label: "Available", value: "AVAILABLE", dot: "bg-success" },
  { label: "In Shop", value: "IN_SHOP", dot: "bg-warning" },
  { label: "On Trip", value: "ON_TRIP", dot: "bg-primary" },
]

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState("All")
  const [statusFilters, setStatusFilters] = useState<string[]>([])

  const fetchVehicles = async () => {
    try {
      const res = await api.get("/vehicles")
      setVehicles(res.data.data)
    } catch (error) {
      toast.error("Failed to load vehicles")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVehicles()
  }, [])

  const handleRetire = async (id: string) => {
    if (!confirm("Are you sure you want to retire this vehicle?")) return
    try {
      await api.patch(`/vehicles/${id}/retire`)
      toast.success("Vehicle retired")
      fetchVehicles()
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to retire vehicle")
    }
  }

  const toggleStatusFilter = (status: string) => {
    setStatusFilters(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    )
  }

  const filteredVehicles = vehicles.filter(v => {
    if (typeFilter !== "All" && v.type !== typeFilter) return false
    if (statusFilters.length > 0 && !statusFilters.includes(v.status)) return false
    return true
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "AVAILABLE": return { dot: "bg-green-500", text: "text-green-700", bg: "bg-green-50 border-green-200", label: "Available" }
      case "ON_TRIP": return { dot: "bg-blue-500", text: "text-blue-700", bg: "bg-blue-50 border-blue-200", label: "On Trip" }
      case "IN_SHOP": return { dot: "bg-orange-500", text: "text-orange-700", bg: "bg-orange-50 border-orange-200", label: "In Shop" }
      case "RETIRED": return { dot: "bg-gray-400", text: "text-gray-600", bg: "bg-gray-50 border-gray-200", label: "Retired" }
      default: return { dot: "bg-gray-400", text: "text-gray-600", bg: "bg-gray-50 border-gray-200", label: status }
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-headline-lg text-primary">Vehicle Registry</h1>
            <p className="text-body-md text-on-surface-variant mt-1">Manage fleet assets, monitor status, and log maintenance.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 bg-surface border border-outline-variant text-on-surface text-label-md px-4 py-2 rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-[18px]">tune</span> Filter
            </button>
            <VehicleForm onSuccess={fetchVehicles} />
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-label-md text-on-surface-variant uppercase">Type:</span>
          {TYPE_FILTERS.map(type => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-3 py-1.5 rounded-full text-body-md border transition-colors cursor-pointer ${
                typeFilter === type
                  ? "bg-secondary text-on-secondary border-secondary"
                  : "bg-surface border-outline-variant text-on-surface hover:bg-surface-container-low"
              }`}
            >
              {type}
            </button>
          ))}
          <span className="text-label-md text-on-surface-variant uppercase ml-4">Status:</span>
          {STATUS_FILTERS.map(sf => (
            <button
              key={sf.value}
              onClick={() => toggleStatusFilter(sf.value)}
              className={`px-3 py-1.5 rounded-full text-body-md border transition-colors flex items-center gap-1.5 cursor-pointer ${
                statusFilters.includes(sf.value)
                  ? "bg-primary text-on-primary border-primary"
                  : "bg-surface border-outline-variant text-on-surface hover:bg-surface-container-low"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${statusFilters.includes(sf.value) ? "bg-on-primary" : sf.dot}`}></span>
              {sf.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden micro-shadow">
          {loading ? (
            <div className="text-center py-10 text-on-surface-variant text-body-md">Loading vehicles...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant">
                    <th className="p-3 text-label-md text-on-surface-variant uppercase tracking-wider pl-4">Reg Number</th>
                    <th className="p-3 text-label-md text-on-surface-variant uppercase tracking-wider">Name / Model</th>
                    <th className="p-3 text-label-md text-on-surface-variant uppercase tracking-wider">Type</th>
                    <th className="p-3 text-label-md text-on-surface-variant uppercase tracking-wider">Capacity</th>
                    <th className="p-3 text-label-md text-on-surface-variant uppercase tracking-wider">Status</th>
                    <th className="p-3 text-label-md text-on-surface-variant uppercase tracking-wider text-right">Odometer</th>
                    <th className="p-3 text-label-md text-on-surface-variant uppercase tracking-wider pr-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-body-md divide-y divide-outline-variant">
                  {filteredVehicles.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-on-surface-variant">No vehicles match filters.</td>
                    </tr>
                  ) : (
                    filteredVehicles.map((v) => {
                      const badge = getStatusBadge(v.status)
                      return (
                        <tr key={v.id} className="hover:bg-surface-bright transition-colors">
                          <td className="p-3 pl-4 text-data-mono text-primary font-medium">{v.registrationNumber}</td>
                          <td className="p-3">
                            <div className="font-medium text-on-surface">{v.name}</div>
                          </td>
                          <td className="p-3 text-on-surface">{v.type}</td>
                          <td className="p-3 text-on-surface">{v.maxLoadCapacityKg?.toLocaleString()} kg</td>
                          <td className="p-3">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${badge.bg} ${badge.text}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                              {badge.label}
                            </span>
                          </td>
                          <td className="p-3 text-right text-data-mono text-on-surface">{v.odometer?.toLocaleString()} km</td>
                          <td className="p-3 pr-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${v.status === 'IN_SHOP' ? 'bg-secondary-container text-on-secondary-container' : 'text-outline hover:text-primary hover:bg-surface-container-low'}`}
                                title="Maintenance"
                              >
                                <span className="material-symbols-outlined text-[18px]">build</span>
                              </button>
                              <button className="p-1.5 text-outline hover:text-primary hover:bg-surface-container-low rounded-lg transition-colors cursor-pointer">
                                <span className="material-symbols-outlined text-[18px]">more_vert</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {filteredVehicles.length > 0 && (
            <div className="p-4 border-t border-outline-variant flex justify-between items-center">
              <span className="text-body-md text-on-surface-variant">
                Showing <span className="font-semibold text-on-surface">1</span> to <span className="font-semibold text-on-surface">{filteredVehicles.length}</span> of <span className="font-semibold text-on-surface">{vehicles.length}</span> entries
              </span>
              <div className="flex items-center gap-1">
                <button className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant text-on-surface-variant hover:bg-surface-container-low transition-colors cursor-pointer">‹</button>
                <button className="w-8 h-8 flex items-center justify-center rounded bg-primary text-on-primary font-semibold text-sm">1</button>
                <button className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant text-on-surface-variant hover:bg-surface-container-low transition-colors cursor-pointer">›</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
