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

  async create(input: CreateTripInput, actorId: string, requestId?: string) {
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

      logger.info('AUDIT: trip_created', {
        event: 'trip_created',
        tripId: trip.id,
        vehicleId: input.vehicleId,
        driverId: input.driverId,
        actorId,
        requestId,
        timestamp: new Date().toISOString(),
      })

      return trip
    })
  },

  async dispatch(id: string, actorId: string, requestId?: string) {
    // Rule 6: Dispatch → Vehicle + Driver = ON_TRIP atomically
    // Re-verify vehicle/driver status inside transaction to prevent race condition
    return prisma.$transaction(async (tx) => {
      const trip = await tripRepo.findById(id, tx)
      if (!trip) throw new NotFoundError('Trip')
      if (trip.status !== TripStatus.DRAFT) {
        throw new BusinessRuleError('Only DRAFT trips can be dispatched')
      }

      // First fetch and verify
      const vehicle = await vehicleRepo.findById(trip.vehicleId, tx)
      if (vehicle?.status !== VehicleStatus.AVAILABLE) {
        throw new BusinessRuleError('Vehicle is no longer AVAILABLE')
      }

      const driver = await driverRepo.findById(trip.driverId, tx)
      if (driver?.status !== DriverStatus.AVAILABLE) {
        throw new BusinessRuleError('Driver is no longer AVAILABLE')
      }

      // Re-verify vehicle and driver status right before update (prevents race)
      const currentVehicle = await vehicleRepo.findById(trip.vehicleId, tx)
      const currentDriver = await driverRepo.findById(trip.driverId, tx)

      if (currentVehicle?.status !== VehicleStatus.AVAILABLE) {
        throw new BusinessRuleError('Vehicle status changed during dispatch')
      }
      if (currentDriver?.status !== DriverStatus.AVAILABLE) {
        throw new BusinessRuleError('Driver status changed during dispatch')
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
        requestId,
        timestamp: new Date().toISOString(),
      })

      return updatedTrip
    })
  },

  async complete(id: string, input: CompleteTripInput, actorId: string, requestId?: string) {
    // Rule 7: Complete → both AVAILABLE + odometer += actualDistance atomically
    // Re-verify vehicle status to prevent race condition
    return prisma.$transaction(async (tx) => {
      const trip = await tripRepo.findById(id, tx)
      if (!trip) throw new NotFoundError('Trip')
      if (trip.status !== TripStatus.DISPATCHED) {
        throw new BusinessRuleError('Only DISPATCHED trips can be completed')
      }

      // Fetch and verify vehicle
      const vehicle = await vehicleRepo.findById(trip.vehicleId, tx)
      if (!vehicle) throw new NotFoundError('Vehicle')

      // Revenue fallback
      const revenue = input.revenue ?? (trip.plannedDistance * FLAT_RATE_PER_KM)

      // Re-verify vehicle status right before update
      const currentVehicle = await vehicleRepo.findById(trip.vehicleId, tx)
      if (currentVehicle?.status !== VehicleStatus.ON_TRIP) {
        throw new BusinessRuleError('Vehicle is no longer ON_TRIP')
      }

      // Update vehicle odometer and status atomically using re-fetched odometer
      await vehicleRepo.update(
        trip.vehicleId,
        {
          status: VehicleStatus.AVAILABLE,
          odometer: currentVehicle.odometer + input.actualDistance,
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
        requestId,
        timestamp: new Date().toISOString(),
      })

      return updatedTrip
    })
  },

  async cancel(id: string, actorId: string, requestId?: string) {
    // Rule 8: Cancel → both AVAILABLE (only from DISPATCHED, or just cancel if DRAFT)
    return prisma.$transaction(async (tx) => {
      const trip = await tripRepo.findById(id, tx)
      if (!trip) throw new NotFoundError('Trip')
      if (trip.status === TripStatus.COMPLETED || trip.status === TripStatus.CANCELLED) {
        throw new BusinessRuleError('Cannot cancel a completed or already cancelled trip')
      }

      if (trip.status === TripStatus.DISPATCHED) {
        // Re-verify before updating
        const currentVehicle = await vehicleRepo.findById(trip.vehicleId, tx)
        const currentDriver = await driverRepo.findById(trip.driverId, tx)
        
        if (currentVehicle?.status === VehicleStatus.ON_TRIP) {
          await vehicleRepo.updateStatus(trip.vehicleId, VehicleStatus.AVAILABLE, tx)
        }
        if (currentDriver?.status === DriverStatus.ON_TRIP) {
          await driverRepo.updateStatus(trip.driverId, DriverStatus.AVAILABLE, tx)
        }
      }

      const updatedTrip = await tripRepo.updateStatus(id, TripStatus.CANCELLED, {}, tx)

      logger.info('AUDIT: trip_cancelled', {
        event: 'trip_cancelled',
        tripId: id,
        actorId,
        requestId,
        timestamp: new Date().toISOString(),
      })

      return updatedTrip
    })
  },
}
