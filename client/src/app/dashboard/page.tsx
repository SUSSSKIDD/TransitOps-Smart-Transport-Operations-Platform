"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { api } from "@/lib/axios"
import { format } from "date-fns"
import Link from "next/link"

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
          <div className="animate-pulse flex items-center text-on-surface-variant text-body-md">
            <span className="material-symbols-outlined animate-spin mr-2">sync</span> Loading dashboard metrics...
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!data) return <DashboardLayout><div className="text-on-surface-variant">Error loading data</div></DashboardLayout>

  const { kpis, recentTrips } = data
  const totalVehicles = (kpis.AVAILABLE || 0) + (kpis.ON_TRIP || 0) + (kpis.IN_SHOP || 0)
  const activeVehicles = (kpis.AVAILABLE || 0) + (kpis.ON_TRIP || 0)

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-headline-lg text-primary">Fleet Manager Dashboard</h1>
          <p className="text-body-md text-on-surface-variant mt-1">Real-time telemetry and operational overview.</p>
        </div>
      </div>

      {/* ─── KPI Grid ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Active Vehicles */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 micro-shadow flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-label-md text-on-surface-variant uppercase">Active Vehicles</span>
            <span className="material-symbols-outlined text-primary">local_shipping</span>
          </div>
          <div className="text-headline-xl text-primary">
            {activeVehicles}<span className="text-headline-md text-on-surface-variant">/{totalVehicles}</span>
          </div>
          <div className="mt-4 h-8 flex items-end">
            <div className="w-full h-1 bg-surface-container-high rounded overflow-hidden">
              <div className="h-full bg-secondary rounded" style={{ width: `${totalVehicles > 0 ? (activeVehicles / totalVehicles) * 100 : 0}%` }}></div>
            </div>
          </div>
        </div>

        {/* Drivers on Duty */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 micro-shadow flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-label-md text-on-surface-variant uppercase">Drivers on Duty</span>
            <span className="material-symbols-outlined text-primary">person</span>
          </div>
          <div className="text-headline-xl text-primary">{kpis.driverOnDutyCount || 0}</div>
          <div className="mt-4 h-8 flex items-end">
            <div className="w-full h-1 bg-surface-container-high rounded overflow-hidden">
              <div className="h-full bg-primary rounded" style={{ width: '66%' }}></div>
            </div>
          </div>
        </div>

        {/* Active Trips */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 micro-shadow flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-label-md text-on-surface-variant uppercase">Active Trips</span>
            <span className="material-symbols-outlined text-primary">route</span>
          </div>
          <div className="text-headline-xl text-primary">{kpis.ON_TRIP || 0}</div>
          <div className="mt-4 h-8 flex items-end">
            <div className="w-full h-1 bg-surface-container-high rounded overflow-hidden">
              <div className="h-full bg-primary rounded" style={{ width: '50%' }}></div>
            </div>
          </div>
        </div>

        {/* Maintenance Alerts */}
        <div className="bg-error-container border border-error/20 rounded-lg p-4 micro-shadow flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <span className="text-label-md text-on-error-container uppercase">Maintenance Alerts</span>
            <span className="material-symbols-outlined text-error">warning</span>
          </div>
          <div className="text-headline-xl text-on-error-container">{kpis.IN_SHOP || 0}</div>
          <div className="mt-4 h-8 flex items-end">
            <span className="text-label-md text-error flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">trending_up</span> +1 from yesterday
            </span>
          </div>
        </div>
      </div>

      {/* ─── Two Column Layout ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Analytics Area (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Fleet Utilization Chart */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 micro-shadow h-[300px] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-headline-md text-primary">Fleet Utilization</h2>
              <button className="material-symbols-outlined text-outline hover:text-primary cursor-pointer">more_vert</button>
            </div>
            <div className="flex-1 bg-surface-container-low rounded border border-outline-variant flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #e6e8ea 25%, transparent 25%, transparent 75%, #e6e8ea 75%, #e6e8ea), repeating-linear-gradient(45deg, #e6e8ea 25%, #f2f4f6 25%, #f2f4f6 75%, #e6e8ea 75%, #e6e8ea)', backgroundPosition: '0 0, 10px 10px', backgroundSize: '20px 20px' }}></div>
              <div className="relative z-10 flex flex-col items-center">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle className="text-surface-container-high" cx="64" cy="64" fill="none" r="56" stroke="currentColor" strokeWidth="12"></circle>
                  <circle className="text-secondary" cx="64" cy="64" fill="none" r="56" stroke="currentColor" strokeDasharray="351" strokeDashoffset={351 - (351 * (kpis.fleetUtilization || 80)) / 100} strokeWidth="12" strokeLinecap="round"></circle>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-headline-lg font-bold text-primary">{Math.round(kpis.fleetUtilization || 80)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity Table */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden micro-shadow">
            <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-bright">
              <h2 className="text-headline-md text-primary">Recent Activity</h2>
              <Link href="/trips" className="text-label-md text-secondary hover:underline">View All</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant">
                    <th className="p-2 text-label-md text-on-surface-variant uppercase tracking-wider pl-4">Vehicle</th>
                    <th className="p-2 text-label-md text-on-surface-variant uppercase tracking-wider">Driver</th>
                    <th className="p-2 text-label-md text-on-surface-variant uppercase tracking-wider">Status</th>
                    <th className="p-2 text-label-md text-on-surface-variant uppercase tracking-wider pr-4 text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="text-body-md divide-y divide-outline-variant">
                  {recentTrips.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-on-surface-variant">No recent activity</td>
                    </tr>
                  ) : (
                    recentTrips.slice(0, 5).map((trip: any) => (
                      <tr key={trip.id} className="hover:border-l-2 hover:border-secondary hover:bg-surface-bright transition-colors group">
                        <td className="p-2 pl-4 text-data-mono text-primary flex items-center gap-2">
                          <span className="material-symbols-outlined text-outline text-sm">local_shipping</span>
                          {trip.vehicle?.name || 'N/A'}
                        </td>
                        <td className="p-2 text-on-surface">{trip.driver?.name || 'N/A'}</td>
                        <td className="p-2">
                          <span className={`px-2 py-1 rounded-full text-label-md text-[10px] uppercase ${
                            trip.status === 'DISPATCHED' ? 'bg-tertiary-fixed text-on-tertiary-fixed' :
                            trip.status === 'COMPLETED' ? 'bg-success-bg text-success border border-success/20' :
                            'bg-surface-container-highest text-on-surface border border-outline-variant'
                          }`}>
                            {trip.status === 'DISPATCHED' ? 'En Route' : trip.status}
                          </span>
                        </td>
                        <td className="p-2 pr-4 text-right text-on-surface-variant">
                          {format(new Date(trip.createdAt), "h:mm a")}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ─── Side Alerts Area (1 col) ─── */}
        <div className="space-y-4 flex flex-col">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-lg micro-shadow flex flex-col h-full">
            <div className="p-4 border-b border-outline-variant bg-error/5 flex items-center gap-2 rounded-t-lg">
              <span className="material-symbols-outlined text-error">error</span>
              <h2 className="text-headline-md text-on-error-container">Action Required</h2>
            </div>
            <div className="p-4 flex-1 overflow-y-auto space-y-4">
              {/* Alert Item 1 */}
              <div className="flex gap-3 items-start border-l-2 border-secondary pl-3">
                <div className="bg-secondary-container text-on-secondary-container p-2 rounded-lg flex-shrink-0">
                  <span className="material-symbols-outlined">build</span>
                </div>
                <div>
                  <h3 className="text-label-md text-primary">Overdue Maintenance</h3>
                  <p className="text-body-md text-on-surface-variant mt-1 text-sm">Vehicle missed scheduled service interval.</p>
                  <Link href="/maintenance" className="mt-2 text-label-md text-secondary hover:underline inline-block">Schedule Now</Link>
                </div>
              </div>
              {/* Alert Item 2 */}
              <div className="flex gap-3 items-start border-l-2 border-outline pl-3">
                <div className="bg-surface-container-high text-on-surface p-2 rounded-lg flex-shrink-0">
                  <span className="material-symbols-outlined">id_card</span>
                </div>
                <div>
                  <h3 className="text-label-md text-primary">Expiring License</h3>
                  <p className="text-body-md text-on-surface-variant mt-1 text-sm">Driver license expiring soon.</p>
                  <Link href="/drivers" className="mt-2 text-label-md text-secondary hover:underline inline-block">Notify Driver</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
