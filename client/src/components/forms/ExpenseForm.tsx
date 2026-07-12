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

const expenseSchema = z.object({
  vehicleId: z.string().optional(),
  category: z.string().min(1, "Category required"),
  amount: z.number().positive("Must be positive"),
  notes: z.string().optional(),
  date: z.string().min(1, "Date required"),
})

type ExpenseFormData = z.infer<typeof expenseSchema>

interface ExpenseFormProps {
  onSuccess: () => void
  initialData?: Partial<ExpenseFormData> & { id?: string }
  isEditing?: boolean
}

export function ExpenseForm({ onSuccess, initialData: initialDataProp, isEditing = false }: ExpenseFormProps) {
  const initialData = initialDataProp
  const [open, setOpen] = useState(false)
  const [vehicles, setVehicles] = useState<any[]>([])
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      vehicleId: "",
      category: "",
      amount: 0,
      notes: "",
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

  const onSubmit = async (data: ExpenseFormData) => {
    try {
      if (isEditing && initialData?.id) {
        await api.put(`/expenses/${initialData.id}`, data)
        toast.success("Expense updated")
      } else {
        await api.post("/expenses", data)
        toast.success("Expense logged")
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
        {isEditing ? "Edit Expense" : "Add Expense"}
      </Button>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Expense" : "Add New Expense"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Vehicle (optional)</Label>
              <Select onValueChange={(v) => register("vehicleId").onChange({ target: { value: v } } as any)} defaultValue={initialData?.vehicleId || ""}>
                <SelectTrigger><SelectValue placeholder="Select vehicle (optional)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {vehicles.map(v => (
                    <SelectItem key={v.id} value={v.id}>{v.name} ({v.registrationNumber})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select onValueChange={(v) => register("category").onChange({ target: { value: v } } as any)} defaultValue={initialData?.category || ""}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TOLL">Toll</SelectItem>
                    <SelectItem value="PERMIT">Permit</SelectItem>
                    <SelectItem value="FINE">Fine/Penalty</SelectItem>
                    <SelectItem value="INSURANCE">Insurance</SelectItem>
                    <SelectItem value="PARKING">Parking</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.category && <p className="text-sm text-red-500">{errors.category.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₹) *</Label>
                <Input id="amount" type="number" step="0.01" placeholder="500" {...register("amount", { valueAsNumber: true })} />
                {errors.amount && <p className="text-sm text-red-500">{errors.amount.message}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input id="notes" placeholder="Additional details..." {...register("notes")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input id="date" type="date" {...register("date")} />
              {errors.date && <p className="text-sm text-red-500">{errors.date.message}</p>}
            </div>
            <DialogFooter className="space-x-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : isEditing ? "Update" : "Add Expense"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}