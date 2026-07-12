import { Prisma, PrismaClient } from '@prisma/client'
import { TripStatus } from '../../types/enums'
import { prisma } from '../../db'
import { CreateTripInput, ListTripQuery } from './trips.schema'

type Tx = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>

export const tripRepo = {
  findById: (id: string, tx?: Tx) =>
    (tx ?? prisma).trip.findUnique({
      where: { id },
      include: { vehicle: true, driver: true },
    }),

  findMany: async (query: ListTripQuery, tx?: Tx) => {
    const { page = 1, limit = 20, status, vehicleId, driverId } = query
    const where: Prisma.TripWhereInput = {}
    if (status)    where.status    = status
    if (vehicleId) where.vehicleId = vehicleId
    if (driverId)  where.driverId  = driverId

    const skip = (page - 1) * limit
    const [data, total] = await Promise.all([
      (tx ?? prisma).trip.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { vehicle: true, driver: true },
      }),
      (tx ?? prisma).trip.count({ where }),
    ])
    return { data, total }
  },

  findRecent: (limit: number, tx?: Tx) =>
    (tx ?? prisma).trip.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { vehicle: true, driver: true },
    }),

  create: (data: CreateTripInput, tx?: Tx) =>
    (tx ?? prisma).trip.create({ data }),

  updateStatus: (id: string, status: TripStatus, data?: Partial<Prisma.TripUpdateInput>, tx?: Tx) =>
    (tx ?? prisma).trip.update({ where: { id }, data: { status, ...data } }),
}
