"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { DriverForm } from "@/components/forms/DriverForm"
import { api } from "@/lib/axios"
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

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "AVAILABLE": return { dot: "bg-green-500", label: "Active / Available", color: "text-green-700" }
      case "ON_TRIP": return { dot: "bg-orange-500", label: "Active / On Route", color: "text-orange-700" }
      case "OFF_DUTY": return { dot: "bg-yellow-500", label: "Off Duty", color: "text-yellow-700" }
      case "SUSPENDED": return { dot: "bg-red-500", label: "Suspended", color: "text-red-600" }
      default: return { dot: "bg-gray-400", label: status, color: "text-gray-600" }
    }
  }

  const isExpired = (dateStr: string) => new Date(dateStr) < new Date()
  const isExpiringSoon = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    return date > now && date < thirtyDaysFromNow
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return { bar: "bg-primary", text: "text-primary" }
    if (score >= 70) return { bar: "bg-secondary", text: "text-secondary" }
    return { bar: "bg-error", text: "text-error" }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-headline-lg text-primary">Driver Management</h1>
            <p className="text-body-md text-on-surface-variant mt-1">Monitor driver status, safety scores, and licensing.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">search</span>
              <input
                className="pl-10 pr-4 py-2 bg-surface border border-outline-variant rounded-lg text-body-md text-on-surface focus:outline-none focus:border-primary placeholder:text-outline"
                placeholder="Search drivers..."
                type="text"
              />
            </div>
            <button className="flex items-center gap-2 bg-surface border border-outline-variant text-on-surface text-label-md px-4 py-2 rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-[18px]">tune</span> Filter
            </button>
          </div>
        </div>

        {/* Driver Cards Grid */}
        {loading ? (
          <div className="text-center py-10 text-on-surface-variant text-body-md">Loading drivers...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {drivers.map((driver) => {
              const statusInfo = getStatusInfo(driver.status)
              const scoreColor = getScoreColor(driver.safetyScore)
              const licenseExpired = isExpired(driver.licenseExpiryDate)
              const licenseExpiringSoon = isExpiringSoon(driver.licenseExpiryDate)
              const hasBorderWarning = licenseExpired || driver.status === "SUSPENDED"

              return (
                <div
                  key={driver.id}
                  className={`bg-surface-container-lowest border rounded-lg micro-shadow overflow-hidden ${
                    hasBorderWarning ? "border-warning" : "border-outline-variant"
                  }`}
                >
                  {/* Card Header */}
                  <div className="p-4 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                        driver.status === "SUSPENDED" 
                          ? "bg-surface-container-high text-on-surface-variant" 
                          : "bg-secondary-container text-on-secondary-container"
                      }`}>
                        <span className="material-symbols-outlined text-[24px]">person</span>
                      </div>
                      <div>
                        <h3 className="text-headline-md text-primary">{driver.name}</h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`w-2 h-2 rounded-full ${statusInfo.dot}`}></span>
                          <span className={`text-[12px] font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button className="p-1 text-outline hover:text-primary rounded transition-colors cursor-pointer">
                        <span className="material-symbols-outlined text-[18px]">history</span>
                      </button>
                      {driver.status !== "SUSPENDED" && (
                        <button className="p-1 text-outline hover:text-primary rounded transition-colors cursor-pointer">
                          <span className="material-symbols-outlined text-[18px]">block</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* License & Cert Cards */}
                  <div className="px-4 grid grid-cols-2 gap-2">
                    <div className={`rounded-lg p-3 border ${
                      licenseExpired ? "bg-error-container/50 border-error/30" :
                      licenseExpiringSoon ? "bg-warning-bg border-warning/30" :
                      "bg-surface-container-low border-outline-variant"
                    }`}>
                      {(licenseExpired || licenseExpiringSoon) && (
                        <span className="material-symbols-outlined text-[14px] text-warning mb-0.5 block">warning</span>
                      )}
                      <div className={`text-label-md uppercase ${licenseExpired ? "text-error" : "text-on-surface-variant"}`}>
                        License ({driver.licenseCategory?.split(' ')[0]})
                      </div>
                      <div className={`text-body-md mt-1 font-medium ${licenseExpired ? "text-error" : "text-on-surface"}`}>
                        Exp: {format(new Date(driver.licenseExpiryDate), "MM/yyyy")}
                      </div>
                    </div>
                    <div className="bg-surface-container-low border border-outline-variant rounded-lg p-3">
                      <div className="text-label-md text-on-surface-variant uppercase">Contact</div>
                      <div className="text-body-md mt-1 font-medium text-on-surface truncate">{driver.contactNumber}</div>
                    </div>
                  </div>

                  {/* Safety Score */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-label-md text-on-surface-variant uppercase">Safety Score</span>
                      <span className={`text-headline-md ${scoreColor.text}`}>
                        {driver.safetyScore}<span className="text-body-md text-on-surface-variant">/100</span>
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-container-high rounded overflow-hidden">
                      <div
                        className={`h-full ${scoreColor.bar} rounded transition-all`}
                        style={{ width: `${driver.safetyScore}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
