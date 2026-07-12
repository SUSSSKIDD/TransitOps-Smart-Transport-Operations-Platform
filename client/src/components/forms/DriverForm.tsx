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

const driverSchema = z.object({
  name: z.string().min(1, "Name required"),
  licenseNumber: z.string().min(1, "License number required"),
  licenseCategory: z.string().min(1, "Category required"),
  licenseExpiryDate: z.string().min(1, "Expiry date required"),
  contactNumber: z.string().min(1, "Contact required"),
  safetyScore: z.number().min(0).max(100),
})

type DriverFormData = z.infer<typeof driverSchema>

interface DriverFormProps {
  onSuccess: () => void
  initialData?: DriverFormData & { id: string }
  isEditing?: boolean
}

export function DriverForm({ onSuccess, initialData: initialDataProp, isEditing = false }: DriverFormProps) {
  const initialData = initialDataProp
  const [open, setOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const form = useForm<DriverFormData>({
    resolver: zodResolver(driverSchema),
    defaultValues: {
      name: "",
      licenseNumber: "",
      licenseCategory: "",
      licenseExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      contactNumber: "",
      safetyScore: 100,
    },
  })

  const onSubmit = async (data: DriverFormData) => {
    setIsSubmitting(true)
    try {
      if (isEditing && initialData?.id) {
        await api.put(`/drivers/${initialData.id}`, data)
        toast.success("Driver updated")
      } else {
        await api.post("/drivers", data)
        toast.success("Driver created")
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
        name: initialData.name,
        licenseNumber: initialData.licenseNumber,
        licenseCategory: initialData.licenseCategory,
        licenseExpiryDate: initialData.licenseExpiryDate.split("T")[0],
        contactNumber: initialData.contactNumber,
        safetyScore: initialData.safetyScore,
      })
    } else {
      form.reset()
    }
    setOpen(true)
  }

  return (
    <>
      <Button onClick={handleOpen}>
        {isEditing ? "Edit Driver" : "Add Driver"}
      </Button>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Driver" : "Add New Driver"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input id="name" placeholder="John Driver" {...form.register("name")} />
                {form.formState.errors.name && <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="licenseNumber">License Number *</Label>
                <Input id="licenseNumber" placeholder="LIC-ALEX-001" {...form.register("licenseNumber")} />
                {form.formState.errors.licenseNumber && <p className="text-sm text-red-500">{form.formState.errors.licenseNumber.message}</p>}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="licenseCategory">License Category *</Label>
                <Select value={form.watch("licenseCategory")} onValueChange={(v) => form.setValue("licenseCategory", v)}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Light Vehicle">Light Vehicle</SelectItem>
                    <SelectItem value="Medium Vehicle">Medium Vehicle</SelectItem>
                    <SelectItem value="Heavy Vehicle">Heavy Vehicle</SelectItem>
                    <SelectItem value="Trailer">Trailer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="licenseExpiryDate">License Expiry Date *</Label>
                <Input id="licenseExpiryDate" type="date" {...form.register("licenseExpiryDate")} />
                {form.formState.errors.licenseExpiryDate && <p className="text-sm text-red-500">{form.formState.errors.licenseExpiryDate.message}</p>}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contactNumber">Contact Number *</Label>
                <Input id="contactNumber" placeholder="+91-9876543210" {...form.register("contactNumber")} />
                {form.formState.errors.contactNumber && <p className="text-sm text-red-500">{form.formState.errors.contactNumber.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="safetyScore">Safety Score (0-100)</Label>
                <Input id="safetyScore" type="number" min="0" max="100" placeholder="100" {...form.register("safetyScore", { valueAsNumber: true })} />
                {form.formState.errors.safetyScore && <p className="text-sm text-red-500">{form.formState.errors.safetyScore.message}</p>}
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