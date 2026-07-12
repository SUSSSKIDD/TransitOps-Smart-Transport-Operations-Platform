"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { ExpenseForm } from "@/components/forms/ExpenseForm"
import { FuelLogForm } from "@/components/forms/FuelLogForm"
import { api } from "@/lib/axios"
import { format } from "date-fns"
import toast from "react-hot-toast"

type TabKey = "fuel" | "expenses"

export default function ExpensesPage() {
  const [fuelLogs, setFuelLogs] = useState<any[]>([])
  const [expenses, setExpenses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabKey>("fuel")

  const fetchData = async () => {
    try {
      const [fRes, eRes] = await Promise.all([
        api.get("/expenses/fuel"),
        api.get("/expenses"),
      ])
      setFuelLogs(fRes.data.data)
      setExpenses(eRes.data.data)
    } catch (error) {
      toast.error("Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const totalFuelCost = fuelLogs.reduce((sum, l) => sum + (l.cost || 0), 0)
  const avgEfficiency = fuelLogs.length > 0
    ? (fuelLogs.reduce((sum, l) => sum + (l.liters || 0), 0) / fuelLogs.length).toFixed(1)
    : "0"
  const totalExpensesCost = expenses.reduce((sum, e) => sum + (e.amount || 0), 0)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-headline-lg text-primary">Expenses & Fuel Ledger</h1>
            <p className="text-body-md text-on-surface-variant mt-1">Manage operational costs and fuel consumption.</p>
          </div>
          <div className="flex items-center gap-3">
            <ExpenseForm onSuccess={fetchData} />
            <FuelLogForm onSuccess={fetchData} />
          </div>
        </div>

        {/* ─── KPI Cards ─── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Fuel Cost */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 micro-shadow">
            <span className="text-label-md text-on-surface-variant uppercase">Total Fuel Cost (MTD)</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-headline-xl text-primary">
                ${totalFuelCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <span className="text-label-md text-secondary flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[14px]">trending_up</span>4.2%
              </span>
            </div>
            <div className="mt-3 h-8 flex items-end gap-[2px]">
              {[20, 35, 25, 40, 30, 45, 38, 50, 42, 55].map((h, i) => (
                <div key={i} className="flex-1 bg-secondary/30 rounded-t" style={{ height: `${h}%` }}></div>
              ))}
            </div>
          </div>

          {/* Avg Efficiency */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 micro-shadow">
            <span className="text-label-md text-on-surface-variant uppercase">Avg Efficiency (Fleet)</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-headline-xl text-primary">{avgEfficiency}</span>
              <span className="text-headline-md text-on-surface-variant">L/100km</span>
              <span className="text-label-md text-success flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[14px]">trending_down</span>1.1%
              </span>
            </div>
            <div className="mt-3 h-8 flex items-end gap-[2px]">
              {[60, 55, 58, 52, 50, 48, 45, 50, 47, 44].map((h, i) => (
                <div key={i} className="flex-1 bg-primary/20 rounded-t" style={{ height: `${h}%` }}></div>
              ))}
            </div>
          </div>

          {/* Total Maintenance Spend */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 micro-shadow">
            <span className="text-label-md text-on-surface-variant uppercase">Total Maintenance Spend</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-headline-xl text-primary">
                ${totalExpensesCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <span className="text-label-md text-error flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[14px]">trending_up</span>12%
              </span>
            </div>
            <div className="mt-3 h-8 flex items-end gap-[2px]">
              {[25, 30, 28, 35, 32, 40, 38, 45, 42, 50].map((h, i) => (
                <div key={i} className="flex-1 bg-primary/20 rounded-t" style={{ height: `${h}%` }}></div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Tab Bar ─── */}
        <div className="flex items-center gap-6 border-b border-outline-variant">
          <button
            onClick={() => setActiveTab("fuel")}
            className={`pb-3 text-body-md transition-colors relative cursor-pointer ${
              activeTab === "fuel" ? "text-primary font-semibold" : "text-on-surface-variant hover:text-primary"
            }`}
          >
            Fuel Logs
            {activeTab === "fuel" && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-full" />}
          </button>
          <button
            onClick={() => setActiveTab("expenses")}
            className={`pb-3 text-body-md transition-colors relative cursor-pointer ${
              activeTab === "expenses" ? "text-primary font-semibold" : "text-on-surface-variant hover:text-primary"
            }`}
          >
            General Expenses
            {activeTab === "expenses" && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-full" />}
          </button>
        </div>

        {/* ─── Tables ─── */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden micro-shadow">
          {loading ? (
            <div className="p-8 text-center text-on-surface-variant text-body-md">Loading...</div>
          ) : activeTab === "fuel" ? (
            /* Fuel Logs Table */
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant">
                    <th className="p-3 text-label-md text-on-surface-variant uppercase tracking-wider pl-4">Vehicle</th>
                    <th className="p-3 text-label-md text-on-surface-variant uppercase tracking-wider">Date</th>
                    <th className="p-3 text-label-md text-on-surface-variant uppercase tracking-wider text-right">Liters</th>
                    <th className="p-3 text-label-md text-on-surface-variant uppercase tracking-wider text-right">Cost ($)</th>
                    <th className="p-3 text-label-md text-on-surface-variant uppercase tracking-wider text-right">Efficiency (L/100km)</th>
                    <th className="p-3 text-label-md text-on-surface-variant uppercase tracking-wider pr-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="text-body-md divide-y divide-outline-variant">
                  {fuelLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-on-surface-variant">No fuel logs found.</td>
                    </tr>
                  ) : (
                    fuelLogs.map((log) => {
                      const efficiency = log.liters ? (log.liters / 100).toFixed(1) : "--"
                      const isHigh = parseFloat(efficiency) > 20
                      return (
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
                            <div className="text-on-surface">{format(new Date(log.date), "MMM d, yyyy")}</div>
                            <div className="text-[12px] text-on-surface-variant">{format(new Date(log.date), "hh:mm a")}</div>
                          </td>
                          <td className="p-3 text-right text-data-mono text-on-surface">{log.liters?.toFixed(1)}</td>
                          <td className="p-3 text-right text-data-mono text-on-surface font-medium">
                            ${log.cost?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className={`p-3 text-right text-data-mono font-medium ${isHigh ? "text-error" : "text-on-surface"}`}>
                            {efficiency}
                            {isHigh && <span className="ml-1 text-error">△</span>}
                          </td>
                          <td className="p-3 pr-4 text-center">
                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                              isHigh ? "bg-error-container text-error" : "bg-success-bg text-success"
                            }`}>
                              {isHigh ? "Flagged" : "Verified"}
                            </span>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            /* General Expenses Table */
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant">
                    <th className="p-3 text-label-md text-on-surface-variant uppercase tracking-wider pl-4">Category</th>
                    <th className="p-3 text-label-md text-on-surface-variant uppercase tracking-wider">Vehicle</th>
                    <th className="p-3 text-label-md text-on-surface-variant uppercase tracking-wider">Date</th>
                    <th className="p-3 text-label-md text-on-surface-variant uppercase tracking-wider text-right">Amount ($)</th>
                    <th className="p-3 text-label-md text-on-surface-variant uppercase tracking-wider pr-4">Notes</th>
                  </tr>
                </thead>
                <tbody className="text-body-md divide-y divide-outline-variant">
                  {expenses.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-on-surface-variant">No expenses found.</td>
                    </tr>
                  ) : (
                    expenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-surface-bright transition-colors">
                        <td className="p-3 pl-4">
                          <span className="px-2 py-1 bg-surface-container-high text-on-surface rounded text-[11px] font-semibold uppercase">
                            {exp.category}
                          </span>
                        </td>
                        <td className="p-3 text-on-surface">{exp.vehicle?.registrationNumber || "General"}</td>
                        <td className="p-3 text-on-surface">{format(new Date(exp.date), "MMM d, yyyy")}</td>
                        <td className="p-3 text-right text-data-mono text-on-surface font-medium">
                          ${exp.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 pr-4 text-on-surface-variant truncate max-w-[200px]">{exp.notes || "--"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className="p-4 border-t border-outline-variant flex justify-between items-center">
            <span className="text-body-md text-on-surface-variant">
              Showing <span className="font-semibold text-on-surface">1</span>-<span className="font-semibold text-on-surface">{activeTab === "fuel" ? fuelLogs.length : expenses.length}</span> of <span className="font-semibold text-on-surface">{activeTab === "fuel" ? fuelLogs.length : expenses.length}</span> records
            </span>
            <div className="flex items-center gap-1">
              <button className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant text-on-surface-variant hover:bg-surface-container-low transition-colors cursor-pointer">‹</button>
              <button className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant text-on-surface-variant hover:bg-surface-container-low transition-colors cursor-pointer">›</button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
