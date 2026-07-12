import { Prisma, PrismaClient, Vehicle } from '@prisma/client'
import { VehicleStatus } from '../../types/enums'
import { prisma } from '../../db'
import { CreateVehicleInput, ListVehicleQuery, UpdateVehicleInput } from './vehicles.schema'

type Tx = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>

export const vehicleRepo = {
  findById: (id: string, tx?: Tx) =>
    (tx ?? prisma).vehicle.findUnique({ where: { id } }),

  findByRegNum: (registrationNumber: string, tx?: Tx) =>
    (tx ?? prisma).vehicle.findUnique({ where: { registrationNumber } }),

  findMany: async (query: ListVehicleQuery) => {
    const { page, limit, search, status, type, region, sortBy, order } = query
    const where: Prisma.VehicleWhereInput = {
      ...(search && {
        OR: [
          { name: { contains: search } },
          { registrationNumber: { contains: search } },
          { type: { contains: search } },
        ],
      }),
      ...(status && { status }),
      ...(type && { type: { contains: type } }),
      ...(region && { region: { contains: region } }),
    }
    const [data, total] = await Promise.all([
      prisma.vehicle.findMany({
        where,
        orderBy: { [sortBy]: order },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.vehicle.count({ where }),
    ])
    return { data, total }
  },

  findDispatchable: (tx?: Tx) =>
    (tx ?? prisma).vehicle.findMany({
      where: { status: VehicleStatus.AVAILABLE },
      orderBy: { name: 'asc' },
    }),

  create: (data: CreateVehicleInput, tx?: Tx) =>
    (tx ?? prisma).vehicle.create({ data }),

  update: (id: string, data: UpdateVehicleInput | Prisma.VehicleUpdateInput, tx?: Tx) =>
    (tx ?? prisma).vehicle.update({ where: { id }, data }),

  updateStatus: (id: string, status: VehicleStatus, tx?: Tx) =>
    (tx ?? prisma).vehicle.update({ where: { id }, data: { status } }),
}
