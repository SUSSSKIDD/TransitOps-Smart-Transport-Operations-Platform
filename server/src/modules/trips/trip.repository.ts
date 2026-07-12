import { Prisma, PrismaClient  } from '@prisma/client'
import { TripStatus } from ''
import { prisma } from '../../db'
import { CreateTripInput, ListTripQuery } from './trips.schema'

type Tx = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>

export const tripRepo = {
  findById: (id: string, tx?: Tx) =>
    (tx ?? prisma).trip.findUnique({
      where: { id },
      include: { vehicle: true, driver: true }, // frequently needed for business rules
    }),

  findMany: async (query: ListTripQuery) => {
    const { page, limit, status, vehicleId, driverId, sortBy, order } = query
    const where: Prisma.TripWhereInput = {
      ...(status && { status }),
      ...(vehicleId && { vehicleId }),
      ...(driverId && { driverId }),
    }
    const [data, total] = await Promise.all([
      prisma.trip.findMany({
        where,
        orderBy: { [sortBy]: order },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          vehicle: { select: { name: true, registrationNumber: true } },
          driver: { select: { name: true, licenseNumber: true } },
        },
      }),
      prisma.trip.count({ where }),
    ])
    return { data, total }
  },

  findRecent: (limit: number, tx?: Tx) =>
    (tx ?? prisma).trip.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        vehicle: { select: { name: true } },
        driver: { select: { name: true } },
      },
    }),

  create: (data: CreateTripInput, tx?: Tx) =>
    (tx ?? prisma).trip.create({ data }),

  updateStatus: (id: string, status:  data?: Partial<Prisma.TripUpdateInput>, tx?: Tx) =>
    (tx ?? prisma).trip.update({ where: { id }, data: { status, ...data } }),
}
