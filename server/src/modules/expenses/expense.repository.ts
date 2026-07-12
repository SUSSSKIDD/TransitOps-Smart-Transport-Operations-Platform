import { Prisma, PrismaClient } from '@prisma/client'
import { prisma } from '../../db'
import { CreateFuelLogInput, CreateExpenseInput, ListFuelLogsQuery, ListExpensesQuery } from './expenses.schema'

type Tx = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>

export const expenseRepo = {
  findFuelLogs: async (query: ListFuelLogsQuery) => {
    const { page, limit, vehicleId, sortBy, order } = query
    const where: Prisma.FuelLogWhereInput = { ...(vehicleId && { vehicleId }) }
    const [data, total] = await Promise.all([
      prisma.fuelLog.findMany({
        where,
        orderBy: { [sortBy]: order },
        skip: (page - 1) * limit,
        take: limit,
        include: { vehicle: { select: { name: true, registrationNumber: true } } },
      }),
      prisma.fuelLog.count({ where }),
    ])
    return { data, total }
  },

  findExpenses: async (query: ListExpensesQuery) => {
    const { page, limit, vehicleId, sortBy, order } = query
    const where: Prisma.ExpenseWhereInput = { ...(vehicleId && { vehicleId }) }
    const [data, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        orderBy: { [sortBy]: order },
        skip: (page - 1) * limit,
        take: limit,
        include: { vehicle: { select: { name: true, registrationNumber: true } } },
      }),
      prisma.expense.count({ where }),
    ])
    return { data, total }
  },

  createFuelLog: (data: CreateFuelLogInput, tx?: Tx) =>
    (tx ?? prisma).fuelLog.create({ data }),

  createExpense: (data: CreateExpenseInput, tx?: Tx) =>
    (tx ?? prisma).expense.create({ data }),
}
