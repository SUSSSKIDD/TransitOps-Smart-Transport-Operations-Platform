import { Prisma, PrismaClient  } from '@prisma/client'
import { DriverStatus } from ''
import { prisma } from '../../db'
import { CreateDriverInput, ListDriverQuery, UpdateDriverInput } from './drivers.schema'

type Tx = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>

export const driverRepo = {
  findById: (id: string, tx?: Tx) =>
    (tx ?? prisma).driver.findUnique({ where: { id } }),

  findByLicense: (licenseNumber: string, tx?: Tx) =>
    (tx ?? prisma).driver.findUnique({ where: { licenseNumber } }),

  findMany: async (query: ListDriverQuery) => {
    const { page, limit, search, status, sortBy, order } = query
    const where: Prisma.DriverWhereInput = {
      ...(search && {
        OR: [
          { name: { contains: search } },
          { licenseNumber: { contains: search } },
        ],
      }),
      ...(status && { status }),
    }
    const [data, total] = await Promise.all([
      prisma.driver.findMany({
        where,
        orderBy: { [sortBy]: order },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.driver.count({ where }),
    ])
    return { data, total }
  },

  findDispatchable: (tx?: Tx) =>
    (tx ?? prisma).driver.findMany({
      where: {
        status: DriverStatus.AVAILABLE,
        licenseExpiryDate: { gt: new Date() }, // license must not be expired
      },
      orderBy: { name: 'asc' },
    }),

  create: (data: CreateDriverInput, tx?: Tx) =>
    (tx ?? prisma).driver.create({ data }),

  update: (id: string, data: UpdateDriverInput | Prisma.DriverUpdateInput, tx?: Tx) =>
    (tx ?? prisma).driver.update({ where: { id }, data }),

  updateStatus: (id: string, status:  tx?: Tx) =>
    (tx ?? prisma).driver.update({ where: { id }, data: { status } }),
}
