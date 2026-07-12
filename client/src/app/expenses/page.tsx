"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/axios"
import { Plus, Droplet, FileText } from "lucide-react"
import { format } from "date-fns"
import toast from "react-hot-toast"

export default function ExpensesPage() {
  const [fuelLogs, setFuelLogs] = useState<any[]>([])
  const [expenses, setExpenses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      const [fuelRes, expRes] = await Promise.all([
        api.get("/expenses/fuel"),
        api.get("/expenses")
      ])
      setFuelLogs(fuelRes.data.data)
      setExpenses(expRes.data.data)
    } catch (error) {
      toast.error("Failed to load financial data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Financials</h1>
            <p className="text-muted-foreground">Track fuel consumption and operational expenses.</p>
          </div>
          <div className="space-x-3">
            <Button variant="outline" className="bg-white dark:bg-zinc-950 shadow-sm">
              <Droplet className="mr-2 h-4 w-4 text-blue-500" /> Log Fuel
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-md">
              <Plus className="mr-2 h-4 w-4" /> Add Expense
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Fuel Logs */}
          <Card className="border-0 shadow-sm ring-1 ring-black/5 dark:ring-white/10">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Droplet className="mr-2 h-5 w-5 text-blue-500" /> 
                Fuel Logs
              </CardTitle>
              <CardDescription>Recent refueling records across the fleet</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4 text-muted-foreground">Loading...</div>
              ) : (
                <div className="space-y-4">
                  {fuelLogs.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">No fuel logs found</div>
                  ) : (
                    fuelLogs.map(log => (
                      <div key={log.id} className="flex justify-between items-center p-3 rounded-lg border border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50">
                        <div>
                          <p className="font-medium">{log.vehicle.name}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(log.date), "MMM d, yyyy")}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900 dark:text-gray-100">₹{log.cost.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">{log.liters} Liters</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Other Expenses */}
          <Card className="border-0 shadow-sm ring-1 ring-black/5 dark:ring-white/10">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5 text-amber-500" /> 
                Operational Expenses
              </CardTitle>
              <CardDescription>Tolls, permits, fines, and other costs</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4 text-muted-foreground">Loading...</div>
              ) : (
                <div className="space-y-4">
                  {expenses.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">No expenses found</div>
                  ) : (
                    expenses.map(exp => (
                      <div key={exp.id} className="flex justify-between items-center p-3 rounded-lg border border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50">
                        <div>
                          <p className="font-medium">{exp.category}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(exp.date), "MMM d, yyyy")} {exp.vehicle && `• ${exp.vehicle.name}`}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900 dark:text-gray-100">₹{exp.amount.toLocaleString()}</p>
                          {exp.notes && <p className="text-xs text-muted-foreground truncate w-24" title={exp.notes}>{exp.notes}</p>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
