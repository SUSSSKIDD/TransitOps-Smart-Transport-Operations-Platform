"use client"

import * as React from "react"
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

const vehicleSchema = z.object({
  registrationNumber: z.string().min(1, "Registration number required"),
  name: z.string().min(1, "Name required"),
  type: z.string().min(1, "Type required"),
  maxLoadCapacityKg: z.number().positive("Must be positive"),
  odometer: z.number().min(0),
  acquisitionCost: z.number().positive("Must be positive"),
  region: z.string().optional(),
})

type VehicleFormData = z.infer<typeof vehicleSchema>

interface VehicleFormProps {
  onSuccess: () => void
  initialData?: VehicleFormData & { id: string }
  isEditing?: boolean
}

export function VehicleForm({ onSuccess, initialData: initialDataProp, isEditing = false }: VehicleFormProps) {
  const initialData = initialDataProp
  const [open, setOpen] = React.useState(false)
  const [vehicles, setVehicles] = React.useState<any[]>([])
  const [drivers, setDrivers] = React.useState<any[]>([])
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const form = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      registrationNumber: "",
      name: "",
      type: "",
      maxLoadCapacityKg: 0,
      odometer: 0,
      acquisitionCost: 0,
      region: "",
    },
  })

  const onSubmit = async (data: VehicleFormData) => {
    setIsSubmitting(true)
    try {
      if (isEditing && initialData?.id) {
        await api.put(`/vehicles/${initialData.id}`, data)
        toast.success("Vehicle updated")
      } else {
        await api.post("/vehicles", data)
        toast.success("Vehicle created")
      }
      form.reset()
      setOpen(false)
      onSuccess()
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpen = () => {
    if (initialData) {
      form.reset({
        registrationNumber: initialData.registrationNumber,
        name: initialData.name,
        type: initialData.type,
        maxLoadCapacityKg: initialData.maxLoadCapacityKg,
        odometer: initialData.odometer,
        acquisitionCost: initialData.acquisitionCost,
        region: initialData.region || "",
      })
    } else {
      form.reset()
    }
    setOpen(true)
  }

  return (
    <>
      <Button onClick={handleOpen}>
        {isEditing ? "Edit Vehicle" : "Add Vehicle"}
      </Button>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Vehicle" : "Add New Vehicle"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="registrationNumber">Registration Number *</Label>
                <Input
                  id="registrationNumber"
                  placeholder="VAN-05-REG"
                  {...form.register("registrationNumber", { disabled: isEditing })}
                />
                {form.formState.errors.registrationNumber && (
                  <p className="text-sm text-red-500">{form.formState.errors.registrationNumber.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input id="name" placeholder="Van-05" {...form.register("name")} />
                {form.formState.errors.name && <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <Select value={form.watch("type")} onValueChange={(v) => form.setValue("type", v)}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Van">Van</SelectItem>
                    <SelectItem value="Truck">Truck</SelectItem>
                    <SelectItem value="Bus">Bus</SelectItem>
                    <SelectItem value="Container">Container</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="region">Region</Label>
                <Input id="region" placeholder="North" {...form.register("region")} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="maxLoadCapacityKg">Max Load Capacity (kg) *</Label>
                <Input id="maxLoadCapacityKg" type="number" placeholder="500" {...form.register("maxLoadCapacityKg", { valueAsNumber: true })} />
                {form.formState.errors.maxLoadCapacityKg && <p className="text-sm text-red-500">{form.formState.errors.maxLoadCapacityKg.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="odometer">Odometer (km) *</Label>
                <Input id="odometer" type="number" placeholder="12400" {...form.register("odometer", { valueAsNumber: true })} />
                {form.formState.errors.odometer && <p className="text-sm text-red-500">{form.formState.errors.odometer.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="acquisitionCost">Acquisition Cost (₹) *</Label>
                <Input id="acquisitionCost" type="number" placeholder="850000" {...form.register("acquisitionCost", { valueAsNumber: true })} />
                {form.formState.errors.acquisitionCost && <p className="text-sm text-red-500">{form.formState.errors.acquisitionCost.message}</p>}
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