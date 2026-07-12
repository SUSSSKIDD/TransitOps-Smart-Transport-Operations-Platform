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

const fuelSchema = z.object({
  vehicleId: z.string().min(1, "Vehicle required"),
  liters: z.number().positive("Must be positive"),
  cost: z.number().positive("Must be positive"),
  date: z.string().min(1, "Date required"),
})

type FuelFormData = z.infer<typeof fuelSchema>

interface FuelLogFormProps {
  onSuccess: () => void
  initialData?: Partial<FuelFormData> & { id?: string }
  isEditing?: boolean
}

export function FuelLogForm({ onSuccess, initialData: initialDataProp, isEditing = false }: FuelLogFormProps) {
  const initialData = initialDataProp
  const [open, setOpen] = useState(false)
  const [vehicles, setVehicles] = useState<any[]>([])
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FuelFormData>({
    resolver: zodResolver(fuelSchema),
    defaultValues: {
      vehicleId: "",
      liters: 0,
      cost: 0,
      date: new Date().toISOString().split("T")[0],
      ...initialData,
    },
  })

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get("/vehicles")
        setVehicles(res.data.data)
      } catch {
        toast.error("Failed to load vehicles")
      }
    }
    fetch()
  }, [])

  const onSubmit = async (data: FuelFormData) => {
    try {
      if (isEditing && initialData?.id) {
        await api.put(`/expenses/fuel/${initialData.id}`, data)
        toast.success("Fuel log updated")
      } else {
        await api.post("/expenses/fuel", data)
        toast.success("Fuel logged")
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
        {isEditing ? "Edit Fuel" : "Log Fuel"}
      </Button>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Fuel Log" : "Log New Fuel Entry"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Vehicle *</Label>
              <Select onValueChange={(v) => register("vehicleId").onChange({ target: { value: v } } as any)} defaultValue={initialData?.vehicleId || ""}>
                <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                <SelectContent>
                  {vehicles.map(v => (
                    <SelectItem key={v.id} value={v.id}>{v.name} ({v.registrationNumber})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.vehicleId && <p className="text-sm text-red-500">{errors.vehicleId.message}</p>}
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="liters">Liters *</Label>
                <Input id="liters" type="number" step="0.1" placeholder="42" {...register("liters", { valueAsNumber: true })} />
                {errors.liters && <p className="text-sm text-red-500">{errors.liters.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost">Cost (₹) *</Label>
                <Input id="cost" type="number" step="0.01" placeholder="5040" {...register("cost", { valueAsNumber: true })} />
                {errors.cost && <p className="text-sm text-red-500">{errors.cost.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input id="date" type="date" {...register("date")} />
                {errors.date && <p className="text-sm text-red-500">{errors.date.message}</p>}
              </div>
            </div>
            <DialogFooter className="space-x-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : isEditing ? "Update" : "Log Fuel"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}