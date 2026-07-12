import { driverRepo } from './driver.repository'
import { CreateDriverInput, ListDriverQuery, UpdateDriverInput } from './drivers.schema'
import { NotFoundError, ConflictError } from '../../utils/errors'
import { logger } from '../../utils/logger'
import { DriverStatus  } from '@prisma/client'
import { DriverStatus } from ''

export const driversService = {
  async list(query: ListDriverQuery) {
    return driverRepo.findMany(query)
  },

  async getById(id: string) {
    const driver = await driverRepo.findById(id)
    if (!driver) throw new NotFoundError('Driver')
    return driver
  },

  async getDispatchable() {
    return driverRepo.findDispatchable()
  },

  async create(input: CreateDriverInput, actorId: string) {
    const existing = await driverRepo.findByLicense(input.licenseNumber)
    if (existing) throw new ConflictError('A driver with this license number already exists')
    
    const driver = await driverRepo.create(input)
    return driver
  },

  async update(id: string, input: UpdateDriverInput, actorId: string) {
    await this.getById(id)
    return driverRepo.update(id, input)
  },

  async suspend(id: string, actorId: string) {
    const driver = await this.getById(id)
    if (driver.status === DriverStatus.SUSPENDED) return driver
    
    const updated = await driverRepo.updateStatus(id.SUSPENDED)
    
    logger.info('AUDIT: driver_suspended', {
      event: 'driver_suspended',
      driverId: id,
      actorId,
    })
    
    return updated
  },
}
