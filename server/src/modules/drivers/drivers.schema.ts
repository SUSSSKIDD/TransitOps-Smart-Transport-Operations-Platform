import { z } from 'zod'
import { trimmedString, optionalTrimmedString } from '../../utils/sanitize'
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../../config/constants'

const DriverStatusEnum = z.enum(['AVAILABLE', 'ON_TRIP', 'OFF_DUTY', 'SUSPENDED'])

export const CreateDriverSchema = {
  body: z.object({
    name: trimmedString(),
    licenseNumber: trimmedString(),
    licenseCategory: trimmedString(),
    licenseExpiryDate: z.coerce.date(),
    contactNumber: trimmedString(),
    safetyScore: z.number().min(0).max(100).default(100),
  }),
}

export const UpdateDriverSchema = {
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    name: trimmedString().optional(),
    licenseCategory: trimmedString().optional(),
    licenseExpiryDate: z.coerce.date().optional(),
    contactNumber: trimmedString().optional(),
    safetyScore: z.number().min(0).max(100).optional(),
    status: DriverStatusEnum.optional(),
  }),
}

export const ListDriverSchema = {
  query: z.object({
    page:   z.coerce.number().int().min(1).default(1),
    limit:  z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
    search: z.string().optional(),
    status: DriverStatusEnum.optional(),
    sortBy: z.enum(['name', 'licenseNumber', 'status', 'safetyScore', 'createdAt', 'licenseExpiryDate']).default('createdAt'),
    order:  z.enum(['asc', 'desc']).default('desc'),
  }),
}

export const GetByIdSchema = {
  params: z.object({ id: z.string().min(1, 'ID required') }),
}

export type CreateDriverInput = z.infer<typeof CreateDriverSchema.body>
export type UpdateDriverInput = z.infer<typeof UpdateDriverSchema.body>
export type ListDriverQuery   = z.infer<typeof ListDriverSchema.query>
