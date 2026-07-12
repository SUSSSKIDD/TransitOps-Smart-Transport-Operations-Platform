import { vehicleRepo } from './vehicle.repository'
import { CreateVehicleInput, ListVehicleQuery, UpdateVehicleInput } from './vehicles.schema'
import { NotFoundError, ConflictError } from '../../utils/errors'
import { logger } from '../../utils/logger'
import { VehicleStatus } from '../../types/enums'

export const vehiclesService = {
  async list(query: ListVehicleQuery) {
    return vehicleRepo.findMany(query)
  },

  async getById(id: string) {
    const vehicle = await vehicleRepo.findById(id)
    if (!vehicle) throw new NotFoundError('Vehicle')
    return vehicle
  },

  async getDispatchable() {
    return vehicleRepo.findDispatchable()
  },

  async create(input: CreateVehicleInput, actorId: string) {
    const existing = await vehicleRepo.findByRegNum(input.registrationNumber)
    if (existing) throw new ConflictError('A vehicle with this registration number already exists')
    
    return vehicleRepo.create(input)
  },

  async update(id: string, input: UpdateVehicleInput, actorId: string) {
    await this.getById(id)
    return vehicleRepo.update(id, input)
  },

  async retire(id: string, actorId: string) {
    const vehicle = await this.getById(id)
    if (vehicle.status === VehicleStatus.RETIRED) return vehicle
    
    const updated = await vehicleRepo.updateStatus(id, VehicleStatus.RETIRED)
    
    logger.info('AUDIT: vehicle_retired', {
      event: 'vehicle_retired',
      vehicleId: id,
      actorId,
    })
    
    return updated
  },
}
