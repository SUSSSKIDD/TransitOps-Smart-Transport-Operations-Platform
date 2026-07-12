import { Prisma, PrismaClient } from '@prisma/client'
import { prisma } from '../../db'
import { CreateMaintenanceInput, ListMaintenanceQuery } from './maintenance.schema'

type Tx = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>

export const maintenanceRepo = {
  findById: (id: string, tx?: Tx) =>
    (tx ?? prisma).maintenanceLog.findUnique({ where: { id } }),

  findMany: async (query: ListMaintenanceQuery) => {
    const { page, limit, vehicleId, isActive, sortBy, order } = query
    const where: Prisma.MaintenanceLogWhereInput = {
      ...(vehicleId && { vehicleId }),
      ...(isActive !== undefined && { isActive }),
    }
    const [data, total] = await Promise.all([
      prisma.maintenanceLog.findMany({
        where,
        orderBy: { [sortBy]: order },
        skip: (page - 1) * limit,
        take: limit,
        include: { vehicle: { select: { name: true, registrationNumber: true } } },
      }),
      prisma.maintenanceLog.count({ where }),
    ])
    return { data, total }
  },

  create: (data: CreateMaintenanceInput, tx?: Tx) =>
    (tx ?? prisma).maintenanceLog.create({ data }),

  updateStatus: (id: string, isActive: boolean, tx?: Tx) =>
    (tx ?? prisma).maintenanceLog.update({
      where: { id },
      data: { isActive, closedAt: isActive ? null : new Date() },
    }),
}
