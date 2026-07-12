import { maintenanceRepo } from './maintenance.repository'
import { vehicleRepo } from '../vehicles/vehicle.repository'
import { CreateMaintenanceInput, ListMaintenanceQuery } from './maintenance.schema'
import { NotFoundError, BusinessRuleError } from '../../utils/errors'
import { logger } from '../../utils/logger'
import { VehicleStatus } from '../../types/enums'
import { prisma } from '../../db'

export const maintenanceService = {
  async list(query: ListMaintenanceQuery) {
    return maintenanceRepo.findMany(query)
  },

  async create(input: CreateMaintenanceInput, actorId: string) {
    // Rule 9: Open maintenance → Vehicle = IN_SHOP atomically
    return prisma.$transaction(async (tx) => {
      const vehicle = await vehicleRepo.findById(input.vehicleId, tx)
      if (!vehicle) throw new NotFoundError('Vehicle')
      if (vehicle.status === VehicleStatus.RETIRED) {
        throw new BusinessRuleError('Cannot open maintenance for a retired vehicle')
      }

      const log = await maintenanceRepo.create(input, tx)
      await vehicleRepo.updateStatus(input.vehicleId, VehicleStatus.IN_SHOP, tx)

      logger.info('AUDIT: maintenance_opened', {
        event: 'maintenance_opened',
        vehicleId: input.vehicleId,
        logId: log.id,
        cost: input.cost,
        actorId,
        timestamp: new Date().toISOString(),
      })

      return log
    })
  },

  async close(id: string, actorId: string) {
    // Rule 10: Close maintenance → Vehicle = AVAILABLE (unless RETIRED)
    return prisma.$transaction(async (tx) => {
      const log = await maintenanceRepo.findById(id, tx)
      if (!log) throw new NotFoundError('Maintenance log')
      if (!log.isActive) throw new BusinessRuleError('Maintenance log is already closed')

      const vehicle = await vehicleRepo.findById(log.vehicleId, tx)
      if (!vehicle) throw new NotFoundError('Vehicle')

      const updatedLog = await maintenanceRepo.updateStatus(id, false, tx)

      if (vehicle.status !== VehicleStatus.RETIRED) {
        await vehicleRepo.updateStatus(log.vehicleId, VehicleStatus.AVAILABLE, tx)
      }

      logger.info('AUDIT: maintenance_closed', {
        event: 'maintenance_closed',
        vehicleId: log.vehicleId,
        logId: id,
        actorId,
        timestamp: new Date().toISOString(),
      })

      return updatedLog
    })
  },
}
