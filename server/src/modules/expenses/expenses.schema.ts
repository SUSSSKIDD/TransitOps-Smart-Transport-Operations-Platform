import { z } from 'zod'
import { trimmedString, optionalTrimmedString } from '../../utils/sanitize'
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../../config/constants'

export const CreateFuelLogSchema = {
  body: z.object({
    vehicleId: z.string().min(1),
    liters: z.number().positive(),
    cost: z.number().positive(),
    date: z.coerce.date().optional(),
  }),
}

export const CreateExpenseSchema = {
  body: z.object({
    vehicleId: z.string().optional(),
    category: trimmedString(),
    amount: z.number().positive(),
    notes: optionalTrimmedString(),
    date: z.coerce.date().optional(),
  }),
}

export const ListFuelLogsSchema = {
  query: z.object({
    page:      z.coerce.number().int().min(1).default(1),
    limit:     z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
    vehicleId: z.string().optional(),
    sortBy:    z.enum(['date', 'cost', 'liters']).default('date'),
    order:     z.enum(['asc', 'desc']).default('desc'),
  }),
}

export const ListExpensesSchema = {
  query: z.object({
    page:      z.coerce.number().int().min(1).default(1),
    limit:     z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
    vehicleId: z.string().optional(),
    sortBy:    z.enum(['date', 'amount', 'category']).default('date'),
    order:     z.enum(['asc', 'desc']).default('desc'),
  }),
}

export type CreateFuelLogInput = z.infer<typeof CreateFuelLogSchema.body>
export type CreateExpenseInput = z.infer<typeof CreateExpenseSchema.body>
export type ListFuelLogsQuery  = z.infer<typeof ListFuelLogsSchema.query>
export type ListExpensesQuery  = z.infer<typeof ListExpensesSchema.query>
