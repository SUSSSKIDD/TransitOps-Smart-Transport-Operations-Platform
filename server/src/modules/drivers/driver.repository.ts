import { Prisma, PrismaClient } from '@prisma/client'
import { DriverStatus } from '../../types/enums'
import { prisma } from '../../db'
import { CreateDriverInput, ListDriverQuery, UpdateDriverInput } from './drivers.schema'

type Tx = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>

export const driverRepo = {
  findById: (id: string, tx?: Tx) =>
    (tx ?? prisma).driver.findUnique({ where: { id } }),

  findByLicense: (licenseNumber: string, tx?: Tx) =>
    (tx ?? prisma).driver.findUnique({ where: { licenseNumber } }),

  findDispatchable: (tx?: Tx) =>
    (tx ?? prisma).driver.findMany({
      where: { status: DriverStatus.AVAILABLE },
      orderBy: { name: 'asc' },
    }),

  findMany: async (query: ListDriverQuery, tx?: Tx) => {
    const { page = 1, limit = 20, status, search } = query
    const where: Prisma.DriverWhereInput = {}
    if (status) where.status = status
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { licenseNumber: { contains: search } },
      ]
    }
    const skip = (page - 1) * limit
    const [data, total] = await Promise.all([
      (tx ?? prisma).driver.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      (tx ?? prisma).driver.count({ where }),
    ])
    return { data, total }
  },

  create: (data: CreateDriverInput, tx?: Tx) =>
    (tx ?? prisma).driver.create({ data }),

  update: (id: string, data: UpdateDriverInput | Prisma.DriverUpdateInput, tx?: Tx) =>
    (tx ?? prisma).driver.update({ where: { id }, data }),

  updateStatus: (id: string, status: DriverStatus, tx?: Tx) =>
    (tx ?? prisma).driver.update({ where: { id }, data: { status } }),
}
