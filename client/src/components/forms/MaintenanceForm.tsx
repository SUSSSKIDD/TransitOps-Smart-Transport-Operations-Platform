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

const maintenanceSchema = z.object({
  vehicleId: z.string().min(1, "Vehicle required"),
  description: z.string().min(1, "Description required"),
  cost: z.number().min(0, "Cost must be >= 0"),
})

type MaintenanceFormData = z.infer<typeof maintenanceSchema>

interface MaintenanceFormProps {
  onSuccess: () => void
  initialData?: Partial<MaintenanceFormData> & { id?: string }
  isEditing?: boolean
}

export function MaintenanceForm({ onSuccess, initialData: initialDataProp, isEditing = false }: MaintenanceFormProps) {
  const initialData = initialDataProp
  const [open, setOpen] = useState(false)
  const [vehicles, setVehicles] = useState<any[]>([])
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MaintenanceFormData>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: {
      vehicleId: "",
      description: "",
      cost: 0,
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

  const onSubmit = async (data: MaintenanceFormData) => {
    try {
      if (isEditing && initialData?.id) {
        await api.put(`/maintenance/${initialData.id}`, data)
        toast.success("Maintenance updated")
      } else {
        await api.post("/maintenance", data)
        toast.success("Maintenance logged")
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
        {isEditing ? "Edit Log" : "Log Repair"}
      </Button>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Maintenance Log" : "Log New Repair"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Vehicle *</Label>
              <Select onValueChange={(v) => register("vehicleId").onChange({ target: { value: v } } as any)} defaultValue={initialData?.vehicleId || ""}>
                <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                <SelectContent>
                  {vehicles.map(v => (
                    <SelectItem key={v.id} value={v.id}>{v.name} ({v.registrationNumber}) - {v.status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.vehicleId && <p className="text-sm text-red-500">{errors.vehicleId.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Input id="description" placeholder="Engine repair, oil change, etc." {...register("description")} />
              {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="cost">Cost (₹) *</Label>
              <Input id="cost" type="number" min="0" placeholder="3500" {...register("cost", { valueAsNumber: true })} />
              {errors.cost && <p className="text-sm text-red-500">{errors.cost.message}</p>}
            </div>
            <DialogFooter className="space-x-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : isEditing ? "Update" : "Log Repair"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}