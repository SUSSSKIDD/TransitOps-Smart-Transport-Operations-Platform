import { tripRepo } from './trip.repository'
import { vehicleRepo } from '../vehicles/vehicle.repository'
import { driverRepo } from '../drivers/driver.repository'
import { CreateTripInput, ListTripQuery, CompleteTripInput } from './trips.schema'
import { NotFoundError, BusinessRuleError } from '../../utils/errors'
import { logger } from '../../utils/logger'
import { TripStatus, DriverStatus, VehicleStatus } from '../../types/enums'
import { prisma } from '../../db'
import { FLAT_RATE_PER_KM } from '../../config/constants'

export const tripsService = {
  async list(query: ListTripQuery) {
    return tripRepo.findMany(query)
  },

  async getById(id: string) {
    const trip = await tripRepo.findById(id)
    if (!trip) throw new NotFoundError('Trip')
    return trip
  },

  async create(input: CreateTripInput, actorId: string) {
    // Rule 2, 3, 4, 5 validation inside a transaction to ensure live state
    return prisma.$transaction(async (tx) => {
      const vehicle = await vehicleRepo.findById(input.vehicleId, tx)
      if (!vehicle) throw new NotFoundError('Vehicle')
      if (vehicle.status !== VehicleStatus.AVAILABLE) {
        throw new BusinessRuleError('Vehicle is not AVAILABLE for new trips')
      }
      if (input.cargoWeightKg > vehicle.maxLoadCapacityKg) {
        throw new BusinessRuleError(`Cargo weight (${input.cargoWeightKg}kg) exceeds vehicle capacity (${vehicle.maxLoadCapacityKg}kg)`)
      }

      const driver = await driverRepo.findById(input.driverId, tx)
      if (!driver) throw new NotFoundError('Driver')
      if (driver.status !== DriverStatus.AVAILABLE) {
        throw new BusinessRuleError('Driver is not AVAILABLE for new trips')
      }
      if (driver.licenseExpiryDate < new Date()) {
        throw new BusinessRuleError('Driver license is expired')
      }

      const trip = await tripRepo.create(input, tx)
      return trip
    })
  },

  async dispatch(id: string, actorId: string) {
    // Rule 6: Dispatch → Vehicle + Driver = ON_TRIP atomically
    return prisma.$transaction(async (tx) => {
      const trip = await tripRepo.findById(id, tx)
      if (!trip) throw new NotFoundError('Trip')
      if (trip.status !== TripStatus.DRAFT) {
        throw new BusinessRuleError('Only DRAFT trips can be dispatched')
      }

      const vehicle = await vehicleRepo.findById(trip.vehicleId, tx)
      if (vehicle?.status !== VehicleStatus.AVAILABLE) {
        throw new BusinessRuleError('Vehicle is no longer AVAILABLE')
      }

      const driver = await driverRepo.findById(trip.driverId, tx)
      if (driver?.status !== DriverStatus.AVAILABLE) {
        throw new BusinessRuleError('Driver is no longer AVAILABLE')
      }

      await vehicleRepo.updateStatus(trip.vehicleId, VehicleStatus.ON_TRIP, tx)
      await driverRepo.updateStatus(trip.driverId, DriverStatus.ON_TRIP, tx)
      const updatedTrip = await tripRepo.updateStatus(id, TripStatus.DISPATCHED, { dispatchedAt: new Date() }, tx)

      logger.info('AUDIT: trip_dispatched', {
        event: 'trip_dispatched',
        tripId: id,
        vehicleId: trip.vehicleId,
        driverId: trip.driverId,
        actorId,
        timestamp: new Date().toISOString(),
      })

      return updatedTrip
    })
  },

  async complete(id: string, input: CompleteTripInput, actorId: string) {
    // Rule 7: Complete → both AVAILABLE + odometer += actualDistance atomically
    return prisma.$transaction(async (tx) => {
      const trip = await tripRepo.findById(id, tx)
      if (!trip) throw new NotFoundError('Trip')
      if (trip.status !== TripStatus.DISPATCHED) {
        throw new BusinessRuleError('Only DISPATCHED trips can be completed')
      }

      const vehicle = await vehicleRepo.findById(trip.vehicleId, tx)
      if (!vehicle) throw new NotFoundError('Vehicle')

      // Revenue fallback
      const revenue = input.revenue ?? (trip.plannedDistance * FLAT_RATE_PER_KM)

      // Update vehicle odometer and status
      await vehicleRepo.update(
        trip.vehicleId,
        {
          status: VehicleStatus.AVAILABLE,
          odometer: vehicle.odometer + input.actualDistance,
        },
        tx
      )

      await driverRepo.updateStatus(trip.driverId, DriverStatus.AVAILABLE, tx)

      const updatedTrip = await tripRepo.updateStatus(id, TripStatus.COMPLETED, {
        actualDistance: input.actualDistance,
        fuelConsumed: input.fuelConsumed,
        revenue,
        completedAt: new Date(),
      }, tx)

      logger.info('AUDIT: trip_completed', {
        event: 'trip_completed',
        tripId: id,
        actualDistance: input.actualDistance,
        fuelConsumed: input.fuelConsumed,
        revenue,
        actorId,
        timestamp: new Date().toISOString(),
      })

      return updatedTrip
    })
  },

  async cancel(id: string, actorId: string) {
    // Rule 8: Cancel → both AVAILABLE (only from DISPATCHED, or just cancel if DRAFT)
    return prisma.$transaction(async (tx) => {
      const trip = await tripRepo.findById(id, tx)
      if (!trip) throw new NotFoundError('Trip')
      if (trip.status === TripStatus.COMPLETED || trip.status === TripStatus.CANCELLED) {
        throw new BusinessRuleError('Cannot cancel a completed or already cancelled trip')
      }

      if (trip.status === TripStatus.DISPATCHED) {
        await vehicleRepo.updateStatus(trip.vehicleId, VehicleStatus.AVAILABLE, tx)
        await driverRepo.updateStatus(trip.driverId, DriverStatus.AVAILABLE, tx)
      }

      const updatedTrip = await tripRepo.updateStatus(id, TripStatus.CANCELLED, {}, tx)

      logger.info('AUDIT: trip_cancelled', {
        event: 'trip_cancelled',
        tripId: id,
        actorId,
        timestamp: new Date().toISOString(),
      })

      return updatedTrip
    })
  },
}
