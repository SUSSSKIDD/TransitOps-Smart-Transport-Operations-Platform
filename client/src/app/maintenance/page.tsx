"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { MaintenanceForm } from "@/components/forms/MaintenanceForm"
import { api } from "@/lib/axios"
import { format } from "date-fns"
import toast from "react-hot-toast"
import Link from "next/link"

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

  const handleClose = async (id: string) => {
    try {
      await api.patch(`/maintenance/${id}/close`)
      toast.success("Ticket closed")
      fetchLogs()
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to close ticket")
    }
  }

  const activeLogs = logs.filter(l => l.isActive)
  const closedLogs = logs.filter(l => !l.isActive)
  const totalActiveCost = activeLogs.reduce((sum, l) => sum + (l.cost || 0), 0)
  const totalClosedCost = closedLogs.reduce((sum, l) => sum + (l.cost || 0), 0)
  const totalMTDCost = totalActiveCost + totalClosedCost

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-body-md text-on-surface-variant">
          <Link href="/vehicles" className="hover:text-primary transition-colors flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">arrow_back</span> Back to Fleet
          </Link>
          <span>/</span>
          <span className="text-primary font-medium">Maintenance Management</span>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-headline-lg text-primary">Service Bay</h1>
            <p className="text-body-md text-on-surface-variant mt-1">Manage active repairs, scheduled maintenance, and service history.</p>
          </div>
          <MaintenanceForm onSuccess={fetchLogs} />
        </div>

        {/* ─── Main Layout ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Active Maintenance Table (2 cols) */}
          <div className="lg:col-span-2">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden micro-shadow">
              <div className="p-4 border-b border-outline-variant flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-warning">warning</span>
                  <h2 className="text-headline-md text-primary">Active Maintenance</h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-warning"></span>
                  <span className="text-body-md text-on-surface-variant">{activeLogs.length} Vehicles in Bay</span>
                </div>
              </div>

              {loading ? (
                <div className="p-8 text-center text-on-surface-variant text-body-md">Loading...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container-low border-b border-outline-variant">
                        <th className="p-3 text-label-md text-on-surface-variant uppercase tracking-wider pl-4">Vehicle ID</th>
                        <th className="p-3 text-label-md text-on-surface-variant uppercase tracking-wider">Service Type</th>
                        <th className="p-3 text-label-md text-on-surface-variant uppercase tracking-wider">Open Date</th>
                        <th className="p-3 text-label-md text-on-surface-variant uppercase tracking-wider">Est. Cost</th>
                        <th className="p-3 text-label-md text-on-surface-variant uppercase tracking-wider pr-4">Action</th>
                      </tr>
                    </thead>
                    <tbody className="text-body-md divide-y divide-outline-variant">
                      {activeLogs.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-on-surface-variant">No active maintenance tickets.</td>
                        </tr>
                      ) : (
                        activeLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-surface-bright transition-colors">
                            <td className="p-3 pl-4">
                              <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-outline text-[18px]">local_shipping</span>
                                <div>
                                  <div className="text-data-mono text-primary font-medium">{log.vehicle?.registrationNumber || 'N/A'}</div>
                                  <div className="text-[12px] text-on-surface-variant">{log.vehicle?.name}</div>
                                </div>
                              </div>
                            </td>
                            <td className="p-3">
                              <span className="px-2 py-1 bg-secondary-container/20 text-secondary rounded text-[11px] font-semibold">
                                {log.description || "Service"}
                              </span>
                            </td>
                            <td className="p-3 text-on-surface-variant text-[13px]">
                              {format(new Date(log.openedAt), "MMM d, hh:mm a")}
                            </td>
                            <td className="p-3 text-data-mono text-on-surface font-medium">
                              ${log.cost?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-3 pr-4">
                              <button
                                onClick={() => handleClose(log.id)}
                                className="px-3 py-1.5 border border-outline-variant rounded text-label-md text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer"
                              >
                                Close Ticket
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Side Panel (1 col) */}
          <div className="space-y-4">
            {/* MTD Maintenance Spend */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 micro-shadow">
              <span className="text-label-md text-on-surface-variant uppercase">MTD Maintenance Spend</span>
              <div className="text-headline-xl text-primary mt-2">
                ${totalMTDCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <span className="text-label-md text-secondary flex items-center gap-1 mt-1">
                <span className="material-symbols-outlined text-sm">trending_up</span> +12% vs last month
              </span>
              {/* Mini sparkline placeholder */}
              <div className="mt-4 h-12 bg-surface-container-low rounded border border-outline-variant flex items-end px-2 py-1 gap-1">
                {[30, 45, 35, 55, 50, 65, 60, 72, 68, 75].map((h, i) => (
                  <div key={i} className="flex-1 bg-primary/20 rounded-t" style={{ height: `${h}%` }}></div>
                ))}
              </div>
            </div>

            {/* Expense Integration */}
            <div className="bg-surface-container rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-primary text-[20px]">receipt_long</span>
                <h3 className="text-headline-md text-primary">Expense Integration</h3>
              </div>
              <p className="text-body-md text-on-surface-variant">
                Closing a ticket automatically generates a linked Expense Record for accounting review.
              </p>
              <Link href="/expenses" className="mt-3 text-label-md text-secondary hover:underline flex items-center gap-1 inline-flex">
                View Expense Records <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>
          </div>
        </div>

        {/* ─── Recently Completed ─── */}
        {closedLogs.length > 0 && (
          <div className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden micro-shadow">
            <div className="p-4 border-b border-outline-variant">
              <h2 className="text-headline-md text-primary">Recently Completed</h2>
            </div>
            <div className="divide-y divide-outline-variant">
              {closedLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="p-4 flex items-center justify-between hover:bg-surface-bright transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-success text-[20px]">check_circle</span>
                    <div>
                      <div className="text-body-md">
                        <span className="font-semibold text-primary">{log.vehicle?.registrationNumber || 'N/A'}</span>
                        <span className="text-on-surface-variant"> - {log.description || 'Service'}</span>
                      </div>
                      <div className="text-[12px] text-on-surface-variant mt-0.5">
                        Closed on {log.closedAt ? format(new Date(log.closedAt), "MMM d") : "N/A"} • Odometer: {log.vehicle?.odometer?.toLocaleString()} km
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-data-mono text-on-surface font-medium">
                      ${log.cost?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    <button className="text-label-md text-secondary hover:underline cursor-pointer">View Receipt</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
