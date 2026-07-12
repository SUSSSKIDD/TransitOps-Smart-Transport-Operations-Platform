import { Prisma, PrismaClient } from '@prisma/client'
import { prisma } from '../../db'

type Tx = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>

export const analyticsRepo = {
  getVehicleCounts: async (tx?: Tx) => {
    const counts = await (tx ?? prisma).vehicle.groupBy({
      by: ['status'],
      _count: true,
    })
    const result = { AVAILABLE: 0, ON_TRIP: 0, IN_SHOP: 0, RETIRED: 0 }
    counts.forEach(c => { result[c.status] = c._count })
    return result
  },

  getTripCounts: async (tx?: Tx) => {
    const counts = await (tx ?? prisma).trip.groupBy({
      by: ['status'],
      _count: true,
    })
    const result = { DRAFT: 0, DISPATCHED: 0, COMPLETED: 0, CANCELLED: 0 }
    counts.forEach(c => { result[c.status] = c._count })
    return result
  },

  getDriversOnDutyCount: async (tx?: Tx) => {
    return (tx ?? prisma).driver.count({
      where: { status: 'ON_TRIP' },
    })
  },

  getVehicleStatusDistribution: async (tx?: Tx) => {
    return (tx ?? prisma).vehicle.groupBy({
      by: ['type', 'status'],
      _count: true,
    })
  },

  getMonthlyCosts: async (months: number, tx?: Tx) => {
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - months)
    
    // Using raw query for SQLite date truncation since Prisma doesn't support it natively yet
    const fuelCosts = await (tx ?? prisma).$queryRaw`
      SELECT strftime('%Y-%m', datetime(date/1000, 'unixepoch')) as month, SUM(cost) as total
      FROM FuelLog
      WHERE date >= ${startDate.getTime()}
      GROUP BY strftime('%Y-%m', datetime(date/1000, 'unixepoch'))
      ORDER BY month ASC
    ` as any[]

    const maintenanceCosts = await (tx ?? prisma).$queryRaw`
      SELECT strftime('%Y-%m', datetime(openedAt/1000, 'unixepoch')) as month, SUM(cost) as total
      FROM MaintenanceLog
      WHERE openedAt >= ${startDate.getTime()}
      GROUP BY strftime('%Y-%m', datetime(openedAt/1000, 'unixepoch'))
      ORDER BY month ASC
    ` as any[]

    const expenses = await (tx ?? prisma).$queryRaw`
      SELECT strftime('%Y-%m', datetime(date/1000, 'unixepoch')) as month, SUM(amount) as total
      FROM Expense
      WHERE date >= ${startDate.getTime()}
      GROUP BY strftime('%Y-%m', datetime(date/1000, 'unixepoch'))
      ORDER BY month ASC
    ` as any[]

    // Combine into a single map
    const combined = new Map<string, { month: string, fuel: number, maintenance: number, expenses: number }>()
    
    const addToCombined = (data: any[], key: 'fuel' | 'maintenance' | 'expenses') => {
      for (const row of data) {
        const m = row.month
        if (!combined.has(m)) combined.set(m, { month: m, fuel: 0, maintenance: 0, expenses: 0 })
        combined.get(m)![key] = row.total
      }
    }

    addToCombined(fuelCosts, 'fuel')
    addToCombined(maintenanceCosts, 'maintenance')
    addToCombined(expenses, 'expenses')

    return Array.from(combined.values()).sort((a, b) => a.month.localeCompare(b.month))
  },

  getTopCostVehicles: async (limit: number, tx?: Tx) => {
    // Top vehicles by maintenance + fuel + expenses
    const rows = await (tx ?? prisma).$queryRaw`
      SELECT v.id, v.registrationNumber, v.name, v.type,
             (COALESCE(SUM(f.cost), 0) + COALESCE(SUM(m.cost), 0) + COALESCE(SUM(e.amount), 0)) as totalCost
      FROM Vehicle v
      LEFT JOIN FuelLog f ON v.id = f.vehicleId
      LEFT JOIN MaintenanceLog m ON v.id = m.vehicleId
      LEFT JOIN Expense e ON v.id = e.vehicleId
      GROUP BY v.id
      ORDER BY totalCost DESC
      LIMIT ${limit}
    ` as any[]
    
    return rows
  }
}
