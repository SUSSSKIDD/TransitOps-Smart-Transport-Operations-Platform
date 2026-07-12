import { PrismaClient } from '@prisma/client'
import { logger } from '../src/utils/logger'

const prisma = new PrismaClient()

async function reset() {
  logger.info('Resetting database...')
  
  // Delete in dependency order to respect FK constraints
  await prisma.$transaction([
    prisma.expense.deleteMany(),
    prisma.fuelLog.deleteMany(),
    prisma.maintenanceLog.deleteMany(),
    prisma.trip.deleteMany(),
    prisma.driver.deleteMany(),
    prisma.vehicle.deleteMany(),
    prisma.user.deleteMany(),
  ])
  
  logger.info('All records cleared. Running seed...')
  
  const { seed } = await import('../prisma/seed')
  await seed()
  
  logger.info('Database reset complete.')
  await prisma.$disconnect()
}

reset().catch((e) => {
  console.error(e)
  process.exit(1)
})
