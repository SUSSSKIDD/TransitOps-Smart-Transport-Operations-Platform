"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/axios"
import { Plus, Settings, Archive, Edit } from "lucide-react"
import toast from "react-hot-toast"
import { VehicleForm } from "@/components/forms/VehicleForm"

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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

  const handleRetire = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to retire ${name}?`)) {
      try {
        await api.patch(`/vehicles/${id}/retire`)
        toast.success("Vehicle retired")
        fetchVehicles()
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Failed to retire vehicle")
      }
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Vehicles</h1>
            <p className="text-muted-foreground">Manage your fleet inventory and status.</p>
          </div>
          <VehicleForm onSuccess={fetchVehicles} />
        </div>

        <Card className="border-0 shadow-sm ring-1 ring-black/5 dark:ring-white/10">
          <CardHeader>
            <CardTitle>Fleet Directory</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-10 text-muted-foreground">Loading vehicles...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-gray-50 dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800">
                    <tr>
                      <th className="px-4 py-3 font-medium">Vehicle Info</th>
                      <th className="px-4 py-3 font-medium">Type</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Metrics</th>
                      <th className="px-4 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicles.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                          No vehicles found
                        </td>
                      </tr>
                    ) : (
                      vehicles.map((vehicle) => (
                        <tr key={vehicle.id} className="border-b border-gray-50 dark:border-zinc-800/50 hover:bg-gray-50/50 dark:hover:bg-zinc-900/50">
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900 dark:text-gray-100">{vehicle.name}</div>
                            <div className="text-muted-foreground text-xs">{vehicle.registrationNumber}</div>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {vehicle.type}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={
                              vehicle.status === 'AVAILABLE' ? 'success' : 
                              vehicle.status === 'ON_TRIP' ? 'default' : 
                              vehicle.status === 'IN_SHOP' ? 'warning' : 'destructive'
                            }>
                              {vehicle.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            <div>Odometer: {vehicle.odometer} km</div>
                            <div>Capacity: {vehicle.maxLoadCapacityKg} kg</div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <VehicleForm 
                              onSuccess={fetchVehicles} 
                              initialData={vehicle} 
                              isEditing
                            />
                            {vehicle.status !== "RETIRED" && (
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => handleRetire(vehicle.id, vehicle.name)} 
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                              >
                                <Archive className="w-4 h-4 mr-1" /> Retire
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
