"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api } from "@/lib/axios"
import toast from "react-hot-toast"

const tripSchema = z.object({
  vehicleId: z.string().min(1, "Vehicle required"),
  driverId: z.string().min(1, "Driver required"),
  source: z.string().min(1, "Source required"),
  destination: z.string().min(1, "Destination required"),
  cargoWeightKg: z.number().positive("Must be positive"),
  plannedDistance: z.number().positive("Must be positive"),
})

type TripFormData = z.infer<typeof tripSchema>

interface TripFormProps {
  onSuccess: () => void
  initialData?: Partial<TripFormData> & { id?: string }
  isEditing?: boolean
}

export function TripForm({ onSuccess, initialData: initialDataProp, isEditing = false }: TripFormProps) {
  const initialData = initialDataProp
  const [open, setOpen] = useState(false)
  const [vehicles, setVehicles] = useState<any[]>([])
  const [drivers, setDrivers] = useState<any[]>([])
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TripFormData>({
    resolver: zodResolver(tripSchema),
    defaultValues: {
      vehicleId: "",
      driverId: "",
      source: "",
      destination: "",
      cargoWeightKg: 0,
      plannedDistance: 0,
      ...initialData,
    },
  })

  useEffect(() => {
    const fetch = async () => {
      try {
        const [vRes, dRes] = await Promise.all([
          api.get("/vehicles/dispatchable"),
          api.get("/drivers/dispatchable"),
        ])
        setVehicles(vRes.data.data)
        setDrivers(dRes.data.data)
      } catch {
        toast.error("Failed to load vehicles/drivers")
      }
    }
    fetch()
  }, [])

  const onSubmit = async (data: TripFormData) => {
    try {
      if (isEditing && initialData?.id) {
        await api.put(`/trips/${initialData.id}`, data)
        toast.success("Trip updated")
      } else {
        await api.post("/trips", data)
        toast.success("Trip created")
      }
      reset()
      setOpen(false)
      onSuccess()
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save")
    }
  }

  return (
    <>
      <Button onClick={() => { reset(initialData); setOpen(true) }}>
        {isEditing ? "Edit Trip" : "New Trip"}
      </Button>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Trip" : "Create New Trip"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Vehicle *</Label>
                <Select onValueChange={(v) => register("vehicleId").onChange({ target: { value: v } } as any)} defaultValue={initialData?.vehicleId || ""}>
                  <SelectTrigger><SelectValue placeholder="Select available vehicle" /></SelectTrigger>
                  <SelectContent>
                    {vehicles.map(v => (
                      <SelectItem key={v.id} value={v.id}>{v.name} ({v.registrationNumber}) - {v.maxLoadCapacityKg}kg</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.vehicleId && <p className="text-sm text-red-500">{errors.vehicleId.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Driver *</Label>
                <Select onValueChange={(v) => register("driverId").onChange({ target: { value: v } } as any)} defaultValue={initialData?.driverId || ""}>
                  <SelectTrigger><SelectValue placeholder="Select available driver" /></SelectTrigger>
                  <SelectContent>
                    {drivers.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.name} ({d.licenseNumber}) - Score: {d.safetyScore}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.driverId && <p className="text-sm text-red-500">{errors.driverId.message}</p>}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="source">Source *</Label>
                <Input id="source" placeholder="Mumbai" {...register("source")} />
                {errors.source && <p className="text-sm text-red-500">{errors.source.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="destination">Destination *</Label>
                <Input id="destination" placeholder="Pune" {...register("destination")} />
                {errors.destination && <p className="text-sm text-red-500">{errors.destination.message}</p>}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cargoWeightKg">Cargo Weight (kg) *</Label>
                <Input id="cargoWeightKg" type="number" placeholder="300" {...register("cargoWeightKg", { valueAsNumber: true })} />
                {errors.cargoWeightKg && <p className="text-sm text-red-500">{errors.cargoWeightKg.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="plannedDistance">Planned Distance (km) *</Label>
                <Input id="plannedDistance" type="number" placeholder="148" {...register("plannedDistance", { valueAsNumber: true })} />
                {errors.plannedDistance && <p className="text-sm text-red-500">{errors.plannedDistance.message}</p>}
              </div>
            </div>
            <DialogFooter className="space-x-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : isEditing ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}