import { z } from 'zod'
import { trimmedString } from '../../utils/sanitize'
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../../config/constants'

export const CreateMaintenanceSchema = {
  body: z.object({
    vehicleId: z.string().min(1),
    description: trimmedString(),
    cost: z.number().min(0),
  }),
}

export const CloseMaintenanceSchema = {
  params: z.object({ id: z.string().min(1) }),
}

export const ListMaintenanceSchema = {
  query: z.object({
    page:      z.coerce.number().int().min(1).default(1),
    limit:     z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
    vehicleId: z.string().optional(),
    isActive:  z.string().optional().transform(v => v === 'true' ? true : v === 'false' ? false : undefined),
    sortBy:    z.enum(['openedAt', 'cost', 'closedAt']).default('openedAt'),
    order:     z.enum(['asc', 'desc']).default('desc'),
  }),
}

export type CreateMaintenanceInput = z.infer<typeof CreateMaintenanceSchema.body>
export type ListMaintenanceQuery   = z.infer<typeof ListMaintenanceSchema.query>
