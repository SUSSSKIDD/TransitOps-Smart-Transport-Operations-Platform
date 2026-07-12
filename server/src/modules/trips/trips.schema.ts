import { z } from 'zod'
import { trimmedString } from '../../utils/sanitize'
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../../config/constants'

const TripStatusEnum = z.enum(['DRAFT', 'DISPATCHED', 'COMPLETED', 'CANCELLED'])

export const CreateTripSchema = {
  body: z.object({
    vehicleId: z.string().min(1),
    driverId: z.string().min(1),
    source: trimmedString(),
    destination: trimmedString(),
    cargoWeightKg: z.number().positive(),
    plannedDistance: z.number().positive(),
  }),
}

export const DispatchTripSchema = {
  params: z.object({ id: z.string().min(1) }),
}

export const CompleteTripSchema = {
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    actualDistance: z.number().positive(),
    fuelConsumed: z.number().positive(),
    revenue: z.number().positive().optional(),
  }),
}

export const ListTripSchema = {
  query: z.object({
    page:   z.coerce.number().int().min(1).default(1),
    limit:  z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
    status: TripStatusEnum.optional(),
    vehicleId: z.string().optional(),
    driverId: z.string().optional(),
    sortBy: z.enum(['createdAt', 'dispatchedAt', 'completedAt', 'status']).default('createdAt'),
    order:  z.enum(['asc', 'desc']).default('desc'),
  }),
}

export const GetByIdSchema = {
  params: z.object({ id: z.string().min(1, 'ID required') }),
}

export type CreateTripInput   = z.infer<typeof CreateTripSchema.body>
export type CompleteTripInput = z.infer<typeof CompleteTripSchema.body>
export type ListTripQuery     = z.infer<typeof ListTripSchema.query>
