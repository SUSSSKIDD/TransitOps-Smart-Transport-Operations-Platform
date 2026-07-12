import { z } from 'zod'
import { trimmedString, normalizedRegNum, optionalTrimmedString } from '../../utils/sanitize'
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../../config/constants'

const VehicleStatusEnum = z.enum(['AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RETIRED'])

export const CreateVehicleSchema = {
  body: z.object({
    registrationNumber: normalizedRegNum(),
    name: trimmedString(),
    type: trimmedString(),
    maxLoadCapacityKg: z.number().positive('Must be positive'),
    odometer: z.number().min(0).default(0),
    acquisitionCost: z.number().positive('Must be positive'),
    region: optionalTrimmedString(),
  }),
}

export const UpdateVehicleSchema = {
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    name: trimmedString().optional(),
    type: trimmedString().optional(),
    maxLoadCapacityKg: z.number().positive().optional(),
    odometer: z.number().min(0).optional(),
    acquisitionCost: z.number().positive().optional(),
    region: optionalTrimmedString(),
    // status is intentionally excluded - use /retire endpoint for status changes
  }),
}

export const ListVehicleSchema = {
  query: z.object({
    page:   z.coerce.number().int().min(1).default(1),
    limit:  z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
    search: z.string().optional(),
    status: VehicleStatusEnum.optional(),
    type:   z.string().optional(),
    region: z.string().optional(),
    sortBy: z.enum(['name', 'registrationNumber', 'type', 'status', 'odometer', 'createdAt']).default('createdAt'),
    order:  z.enum(['asc', 'desc']).default('desc'),
  }),
}

export const GetByIdSchema = {
  params: z.object({ id: z.string().min(1, 'ID required') }),
}

export type CreateVehicleInput = z.infer<typeof CreateVehicleSchema.body>
export type UpdateVehicleInput = z.infer<typeof UpdateVehicleSchema.body>
export type ListVehicleQuery   = z.infer<typeof ListVehicleSchema.query>
