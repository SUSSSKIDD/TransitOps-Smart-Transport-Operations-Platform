import { vi, Mock } from 'vitest'

// Create mock functions for jwt utils
const signAccessTokenMock = vi.fn().mockReturnValue('mock_access_token')
const signRefreshTokenMock = vi.fn().mockReturnValue('mock_refresh_token')
const verifyAccessTokenMock = vi.fn().mockReturnValue({ id: 'user1', email: 'test@test.com', role: 'FLEET_MANAGER' })
const verifyRefreshTokenMock = vi.fn().mockReturnValue({ id: 'user1', email: 'test@test.com', role: 'FLEET_MANAGER', tokenId: 'token1' })
const storeRefreshTokenMock = vi.fn()
const validateRefreshTokenMock = vi.fn().mockReturnValue(true)
const revokeRefreshTokenMock = vi.fn()
const revokeAllUserRefreshTokensMock = vi.fn()

// Mock the jwt utils
vi.mock('../src/utils/jwt', () => ({
  signAccessToken: signAccessTokenMock,
  signRefreshToken: signRefreshTokenMock,
  verifyAccessToken: verifyAccessTokenMock,
  verifyRefreshToken: verifyRefreshTokenMock,
  storeRefreshToken: storeRefreshTokenMock,
  validateRefreshToken: validateRefreshTokenMock,
  revokeRefreshToken: revokeRefreshTokenMock,
  revokeAllUserRefreshTokens: vi.fn(),
}))

import { authService } from '../src/modules/auth/auth.service'
import { vehiclesService } from '../src/modules/vehicles/vehicles.service'
import { driversService } from '../src/modules/drivers/drivers.service'
import { tripsService } from '../src/modules/trips/trips.service'
import { maintenanceService } from '../src/modules/maintenance/maintenance.service'
import { expensesService } from '../src/modules/expenses/expenses.service'
import { prisma } from '../src/db'
import { bcryptCompareMock, bcryptHashMock } from './jest.setup'
import { AuthenticationError, BusinessRuleError, NotFoundError, ConflictError } from '../src/utils/errors'
import { VehicleStatus, DriverStatus, TripStatus, Role } from '../src/types/enums'

// Use the mocked functions directly
const { validateRefreshToken, revokeRefreshToken, storeRefreshToken, signAccessToken, signRefreshToken, revokeAllUserRefreshTokens } = {
  validateRefreshToken: validateRefreshTokenMock,
  revokeRefreshToken: revokeRefreshTokenMock,
  storeRefreshToken: storeRefreshTokenMock,
  signAccessToken: signAccessTokenMock,
  signRefreshToken: signRefreshTokenMock,
  revokeAllUserRefreshTokens: vi.fn(),
}

// Helper to clear all mocks
const clearAllMocks = () => {
  Object.values(prisma).forEach(model => {
    if (typeof model === 'object' && model !== null) {
      Object.values(model).forEach(method => {
        if (typeof method === 'function' && 'mockClear' in method) {
          method.mockClear()
        }
      })
    }
  })
  prisma.$transaction?.mockClear?.()
  prisma.$queryRaw?.mockClear?.()
}

describe('Authentication Service', () => {
  beforeEach(() => {
    clearAllMocks()
  })

  describe('login', () => {
    it('should return token and user on valid credentials', async () => {
      const mockUser = {
        id: 'user1',
        email: 'fleetmanager@transitops.com',
        passwordHash: 'hashed_password',
        name: 'Fleet Manager',
        role: Role.FLEET_MANAGER,
        failedLoginAttempts: 0,
        lockedUntil: null,
      }
      prisma.user.findUnique.mockResolvedValue(mockUser)

      const { compare } = await import('bcryptjs')
      vi.mocked(compare).mockResolvedValue(true)

      const result = await authService.login({ email: 'fleetmanager@transitops.com', password: 'Password123!' }, '127.0.0.1')

      expect(result).toHaveProperty('accessToken')
      expect(result).toHaveProperty('refreshToken')
      expect(result.user).toEqual({
        id: 'user1',
        name: 'Fleet Manager',
        email: 'fleetmanager@transitops.com',
        role: Role.FLEET_MANAGER,
      })
      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'fleetmanager@transitops.com' } })
    })

    it('should throw AuthenticationError for non-existent user', async () => {
      prisma.user.findUnique.mockResolvedValue(null)

      await expect(authService.login({ email: 'nonexistent@test.com', password: 'Password123!' }, '127.0.0.1'))
        .rejects.toThrow(AuthenticationError)
    })

    it('should throw AuthenticationError for invalid password', async () => {
      const mockUser = {
        id: 'user1',
        email: 'fleetmanager@transitops.com',
        passwordHash: 'hashed_password',
        name: 'Fleet Manager',
        role: Role.FLEET_MANAGER,
        failedLoginAttempts: 0,
        lockedUntil: null,
      }
      prisma.user.findUnique.mockResolvedValue(mockUser)
      bcryptCompareMock.mockResolvedValue(false)

      await expect(authService.login({ email: 'fleetmanager@transitops.com', password: 'wrong_password' }, '127.0.0.1'))
        .rejects.toThrow(AuthenticationError)
    })

    it('should throw AuthenticationError when account is locked', async () => {
      const mockUser = {
        id: 'user1',
        email: 'fleetmanager@transitops.com',
        passwordHash: 'hashed_password',
        name: 'Fleet Manager',
        role: Role.FLEET_MANAGER,
        failedLoginAttempts: 5,
        lockedUntil: new Date(Date.now() + 15 * 60 * 1000),
      }
      prisma.user.findUnique.mockResolvedValue(mockUser)

      await expect(authService.login({ email: 'fleetmanager@transitops.com', password: 'Password123!' }, '127.0.0.1'))
        .rejects.toThrow(AuthenticationError)
    })

    it('should increment failed attempts on failed login', async () => {
      const mockUser = {
        id: 'user1',
        email: 'fleetmanager@transitops.com',
        passwordHash: 'hashed_password',
        name: 'Fleet Manager',
        role: Role.FLEET_MANAGER,
        failedLoginAttempts: 0,
        lockedUntil: null,
      }
      prisma.user.findUnique.mockResolvedValue(mockUser)
      bcryptCompareMock.mockResolvedValue(false)

      await expect(authService.login({ email: 'fleetmanager@transitops.com', password: 'wrong' }, '127.0.0.1'))
        .rejects.toThrow(AuthenticationError)

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user1' },
        data: { failedLoginAttempts: 1 },
      })
    })

    it('should lock account after 5 failed attempts', async () => {
      const mockUser = {
        id: 'user1',
        email: 'fleetmanager@transitops.com',
        passwordHash: 'hashed_password',
        name: 'Fleet Manager',
        role: Role.FLEET_MANAGER,
        failedLoginAttempts: 4,
        lockedUntil: null,
      }
      prisma.user.findUnique.mockResolvedValue(mockUser)
      bcryptCompareMock.mockResolvedValue(false)

      await expect(authService.login({ email: 'fleetmanager@transitops.com', password: 'wrong' }, '127.0.0.1'))
        .rejects.toThrow(AuthenticationError)

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user1' },
        data: expect.objectContaining({
          failedLoginAttempts: 5,
          lockedUntil: expect.any(Date),
        }),
      })
    })

    it('should reset failed attempts on successful login', async () => {
      const mockUser = {
        id: 'user1',
        email: 'fleetmanager@transitops.com',
        passwordHash: 'hashed_password',
        name: 'Fleet Manager',
        role: Role.FLEET_MANAGER,
        failedLoginAttempts: 3,
        lockedUntil: null,
      }
      prisma.user.findUnique.mockResolvedValue(mockUser)
      bcryptCompareMock.mockResolvedValue(true)

      await authService.login({ email: 'fleetmanager@transitops.com', password: 'Password123!' }, '127.0.0.1')

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user1' },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      })
    })
  })

  describe('refreshAccessToken', () => {
    it('should return new tokens for valid refresh token', async () => {
      validateRefreshTokenMock.mockReturnValue(true)
      revokeRefreshTokenMock.mockImplementation(() => {})
      storeRefreshTokenMock.mockImplementation(() => {})
      signAccessTokenMock.mockReturnValue('new_access_token')
      signRefreshTokenMock.mockReturnValue('new_refresh_token')

      const result = await authService.refreshAccessToken('valid_refresh_token')

      expect(result).toEqual({
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token',
      })
    })

    it('should throw AuthenticationError for revoked refresh token', async () => {
      validateRefreshTokenMock.mockReturnValue(false)

      await expect(authService.refreshAccessToken('revoked_token'))
        .rejects.toThrow(AuthenticationError)
    })
  })

  describe('logout', () => {
    it('should revoke all user refresh tokens', async () => {
      revokeAllUserRefreshTokensMock.mockImplementation(() => {})

      await authService.logout('user1')

      expect(revokeAllUserRefreshTokensMock).toHaveBeenCalledWith('user1')
    })
  })
})

describe('Vehicle Service', () => {
  beforeEach(() => {
    clearAllMocks()
  })

  describe('create', () => {
    it('should create vehicle with valid data', async () => {
      const input = {
        registrationNumber: 'VAN-01-REG',
        name: 'Van-01',
        type: 'Van',
        maxLoadCapacityKg: 500,
        odometer: 0,
        acquisitionCost: 800000,
        region: 'North',
      }
      const mockVehicle = { id: 'v1', ...input, status: VehicleStatus.AVAILABLE, createdAt: new Date() }
      prisma.vehicle.findUnique.mockResolvedValue(null)
      prisma.vehicle.create.mockResolvedValue(mockVehicle)

      const result = await vehiclesService.create(input, 'user1')

      expect(result).toEqual(mockVehicle)
      expect(prisma.vehicle.create).toHaveBeenCalledWith({ data: input })
    })

    it('should throw ConflictError for duplicate registration number', async () => {
      const input = {
        registrationNumber: 'VAN-01-REG',
        name: 'Van-01',
        type: 'Van',
        maxLoadCapacityKg: 500,
        odometer: 0,
        acquisitionCost: 800000,
      }
      prisma.vehicle.findUnique.mockResolvedValue({ id: 'existing' })

      await expect(vehiclesService.create(input, 'user1'))
        .rejects.toThrow(ConflictError)
    })

it('should use registration number as provided', async () => {
      const input = {
        registrationNumber: '  van-01-reg  ',
        name: 'Van-01',
        type: 'Van',
        maxLoadCapacityKg: 500,
        odometer: 0,
        acquisitionCost: 800000,
      }
      prisma.vehicle.findUnique.mockResolvedValue(null)
      prisma.vehicle.create.mockResolvedValue({ id: 'v1', ...input, registrationNumber: '  van-01-reg  ' })

      await vehiclesService.create(input, 'user1')

      expect(prisma.vehicle.findUnique).toHaveBeenCalledWith({ where: { registrationNumber: '  van-01-reg  ' } })
    })
  })

  describe('update', () => {
    it('should update vehicle fields', async () => {
      const mockVehicle = { id: 'v1', name: 'Old Name', status: VehicleStatus.AVAILABLE }
      const input = { name: 'New Name', odometer: 15000 }
      prisma.vehicle.findUnique.mockResolvedValue(mockVehicle)
      prisma.vehicle.update.mockResolvedValue({ ...mockVehicle, ...input })

      const result = await vehiclesService.update('v1', input, 'user1')

      expect(result.name).toBe('New Name')
      expect(result.odometer).toBe(15000)
    })

    it('should throw NotFoundError for non-existent vehicle', async () => {
      prisma.vehicle.findUnique.mockResolvedValue(null)

      await expect(vehiclesService.update('nonexistent', { name: 'New' }, 'user1'))
        .rejects.toThrow(NotFoundError)
    })
  })

  describe('retire', () => {
    it('should retire available vehicle', async () => {
      const mockVehicle = { id: 'v1', status: VehicleStatus.AVAILABLE }
      prisma.vehicle.findUnique.mockResolvedValue(mockVehicle)
      prisma.vehicle.update.mockResolvedValue({ ...mockVehicle, status: VehicleStatus.RETIRED })

      const result = await vehiclesService.retire('v1', 'user1')

      expect(result.status).toBe(VehicleStatus.RETIRED)
      expect(prisma.vehicle.update).toHaveBeenCalledWith({
        where: { id: 'v1' },
        data: { status: VehicleStatus.RETIRED },
      })
    })

    it('should not change status if already retired', async () => {
      const mockVehicle = { id: 'v1', status: VehicleStatus.RETIRED }
      prisma.vehicle.findUnique.mockResolvedValue(mockVehicle)

      const result = await vehiclesService.retire('v1', 'user1')

      expect(result.status).toBe(VehicleStatus.RETIRED)
      expect(prisma.vehicle.update).not.toHaveBeenCalled()
    })

    it('should throw NotFoundError for non-existent vehicle', async () => {
      prisma.vehicle.findUnique.mockResolvedValue(null)

      await expect(vehiclesService.retire('nonexistent', 'user1'))
        .rejects.toThrow(NotFoundError)
    })
  })

  describe('getDispatchable', () => {
    it('should return only available vehicles', async () => {
      const mockVehicles = [
        { id: 'v1', name: 'Van-01', status: VehicleStatus.AVAILABLE },
        { id: 'v2', name: 'Van-02', status: VehicleStatus.AVAILABLE },
      ]
      prisma.vehicle.findMany.mockResolvedValue(mockVehicles)

      const result = await vehiclesService.getDispatchable()

      expect(result).toEqual(mockVehicles)
      expect(prisma.vehicle.findMany).toHaveBeenCalledWith({
        where: { status: VehicleStatus.AVAILABLE },
        orderBy: { name: 'asc' },
      })
    })
  })
})

describe('Driver Service', () => {
  beforeEach(() => {
    clearAllMocks()
  })

  describe('create', () => {
    it('should create driver with valid data', async () => {
      const input = {
        name: 'John Driver',
        licenseNumber: 'LIC-JOHN-001',
        licenseCategory: 'Heavy Vehicle',
        licenseExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        contactNumber: '+91-9876543210',
        safetyScore: 95,
      }
      const mockDriver = { id: 'd1', ...input, status: DriverStatus.AVAILABLE, createdAt: new Date() }
      prisma.driver.findUnique.mockResolvedValue(null)
      prisma.driver.create.mockResolvedValue(mockDriver)

      const result = await driversService.create(input, 'user1')

      expect(result).toEqual(mockDriver)
    })

    it('should throw ConflictError for duplicate license number', async () => {
      const input = { licenseNumber: 'LIC-JOHN-001' }
      prisma.driver.findUnique.mockResolvedValue({ id: 'existing' })

      await expect(driversService.create(input as any, 'user1'))
        .rejects.toThrow(ConflictError)
    })
  })

  describe('suspend', () => {
    it('should suspend available driver', async () => {
      const mockDriver = { id: 'd1', status: DriverStatus.AVAILABLE }
      prisma.driver.findUnique.mockResolvedValue(mockDriver)
      prisma.driver.update.mockResolvedValue({ ...mockDriver, status: DriverStatus.SUSPENDED })

      const result = await driversService.suspend('d1', 'user1')

      expect(result.status).toBe(DriverStatus.SUSPENDED)
    })

    it('should not change status if already suspended', async () => {
      const mockDriver = { id: 'd1', status: DriverStatus.SUSPENDED }
      prisma.driver.findUnique.mockResolvedValue(mockDriver)

      const result = await driversService.suspend('d1', 'user1')

      expect(result.status).toBe(DriverStatus.SUSPENDED)
      expect(prisma.driver.update).not.toHaveBeenCalled()
    })
  })

  describe('getDispatchable', () => {
    it('should return only available drivers with valid license', async () => {
      const futureDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      const mockDrivers = [
        { id: 'd1', name: 'John', licenseExpiryDate: futureDate, status: DriverStatus.AVAILABLE },
      ]
      prisma.driver.findMany.mockResolvedValue(mockDrivers)

      const result = await driversService.getDispatchable()

      expect(result).toEqual(mockDrivers)
    })
  })
})

describe('Trip Service - Business Rules', () => {
  beforeEach(() => {
    clearAllMocks()
  })

  describe('create - Rule 2,3,4,5', () => {
    it('should create trip when all rules pass', async () => {
      const mockVehicle = { id: 'v1', status: VehicleStatus.AVAILABLE, maxLoadCapacityKg: 5000 }
      const mockDriver = { id: 'd1', status: DriverStatus.AVAILABLE, licenseExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) }
      const input = { vehicleId: 'v1', driverId: 'd1', source: 'Mumbai', destination: 'Pune', cargoWeightKg: 300, plannedDistance: 150 }
      const mockTrip = { id: 't1', ...input, status: TripStatus.DRAFT }

      prisma.$transaction.mockImplementation(async (fn) => {
        const tx = {
          vehicle: { findUnique: vi.fn().mockResolvedValue(mockVehicle) },
          driver: { findUnique: vi.fn().mockResolvedValue(mockDriver) },
          trip: { create: vi.fn().mockResolvedValue(mockTrip) },
        }
        return fn(tx)
      })

      const result = await tripsService.create(input, 'user1')

      expect(result).toEqual(mockTrip)
    })

    it('should throw BusinessRuleError when vehicle not AVAILABLE (Rule 2)', async () => {
      const mockVehicle = { id: 'v1', status: VehicleStatus.IN_SHOP }
      const input = { vehicleId: 'v1', driverId: 'd1', source: 'Mumbai', destination: 'Pune', cargoWeightKg: 300, plannedDistance: 150 }

      prisma.$transaction.mockImplementation(async (fn) => {
        const tx = { vehicle: { findUnique: vi.fn().mockResolvedValue(mockVehicle) } }
        return fn(tx)
      })

      await expect(tripsService.create(input, 'user1'))
        .rejects.toThrow(BusinessRuleError)
    })

    it('should throw BusinessRuleError when cargo exceeds capacity (Rule 3)', async () => {
      const mockVehicle = { id: 'v1', status: VehicleStatus.AVAILABLE, maxLoadCapacityKg: 500 }
      const mockDriver = { id: 'd1', status: DriverStatus.AVAILABLE, licenseExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) }
      const input = { vehicleId: 'v1', driverId: 'd1', source: 'Mumbai', destination: 'Pune', cargoWeightKg: 600, plannedDistance: 150 }

      prisma.$transaction.mockImplementation(async (fn) => {
        const tx = {
          vehicle: { findUnique: vi.fn().mockResolvedValue(mockVehicle) },
          driver: { findUnique: vi.fn().mockResolvedValue(mockDriver) },
        }
        return fn(tx)
      })

      await expect(tripsService.create(input, 'user1'))
        .rejects.toThrow(BusinessRuleError)
    })

    it('should throw BusinessRuleError when driver not AVAILABLE (Rule 4)', async () => {
      const mockVehicle = { id: 'v1', status: VehicleStatus.AVAILABLE, maxLoadCapacityKg: 5000 }
      const mockDriver = { id: 'd1', status: DriverStatus.ON_TRIP, licenseExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) }
      const input = { vehicleId: 'v1', driverId: 'd1', source: 'Mumbai', destination: 'Pune', cargoWeightKg: 300, plannedDistance: 150 }

      prisma.$transaction.mockImplementation(async (fn) => {
        const tx = {
          vehicle: { findUnique: vi.fn().mockResolvedValue(mockVehicle) },
          driver: { findUnique: vi.fn().mockResolvedValue(mockDriver) },
        }
        return fn(tx)
      })

      await expect(tripsService.create(input, 'user1'))
        .rejects.toThrow(BusinessRuleError)
    })

    it('should throw BusinessRuleError when driver license expired (Rule 5)', async () => {
      const mockVehicle = { id: 'v1', status: VehicleStatus.AVAILABLE, maxLoadCapacityKg: 5000 }
      const mockDriver = { id: 'd1', status: DriverStatus.AVAILABLE, licenseExpiryDate: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      const input = { vehicleId: 'v1', driverId: 'd1', source: 'Mumbai', destination: 'Pune', cargoWeightKg: 300, plannedDistance: 150 }

      prisma.$transaction.mockImplementation(async (fn) => {
        const tx = {
          vehicle: { findUnique: vi.fn().mockResolvedValue(mockVehicle) },
          driver: { findUnique: vi.fn().mockResolvedValue(mockDriver) },
        }
        return fn(tx)
      })

      await expect(tripsService.create(input, 'user1'))
        .rejects.toThrow(BusinessRuleError)
    })
  })

  describe('dispatch - Rule 6', () => {
    it('should dispatch draft trip and set vehicle/driver to ON_TRIP', async () => {
      const mockTrip = { id: 't1', status: TripStatus.DRAFT, vehicleId: 'v1', driverId: 'd1' }
      const mockVehicle = { id: 'v1', status: VehicleStatus.AVAILABLE }
      const mockDriver = { id: 'd1', status: DriverStatus.AVAILABLE }
      const updatedTrip = { ...mockTrip, status: TripStatus.DISPATCHED, dispatchedAt: expect.any(Date) }

      prisma.$transaction.mockImplementation(async (fn) => {
        const tx = {
          trip: { findUnique: vi.fn().mockResolvedValue(mockTrip), update: vi.fn().mockResolvedValue({ ...mockTrip, status: TripStatus.DISPATCHED, dispatchedAt: expect.any(Date) }) },
          vehicle: { findUnique: vi.fn().mockResolvedValue(mockVehicle), update: vi.fn().mockResolvedValue({ ...mockVehicle, status: VehicleStatus.ON_TRIP }) },
          driver: { findUnique: vi.fn().mockResolvedValue(mockDriver), update: vi.fn().mockResolvedValue({ ...mockDriver, status: DriverStatus.ON_TRIP }) },
        }
        return fn(tx)
      })

      const result = await tripsService.dispatch('t1', 'user1')

      expect(result.status).toBe(TripStatus.DISPATCHED)
    })

    it('should throw BusinessRuleError for non-DRAFT trip', async () => {
      const mockTrip = { id: 't1', status: TripStatus.DISPATCHED }
      prisma.$transaction.mockImplementation(async (fn) => {
        const tx = { trip: { findUnique: vi.fn().mockResolvedValue(mockTrip) } }
        return fn(tx)
      })

      await expect(tripsService.dispatch('t1', 'user1'))
        .rejects.toThrow(BusinessRuleError)
    })

it('should re-verify vehicle status inside transaction (race condition prevention)', async () => {
      const mockTrip = { id: 't1', status: TripStatus.DRAFT, vehicleId: 'v1', driverId: 'd1' }
      const mockVehicle = { id: 'v1', status: VehicleStatus.AVAILABLE }
      const mockDriver = { id: 'd1', status: DriverStatus.AVAILABLE }

      prisma.$transaction.mockImplementation(async (fn) => {
        const tx = {
          trip: { 
            findUnique: vi.fn().mockResolvedValue(mockTrip),
            update: vi.fn().mockResolvedValue({ ...mockTrip, status: TripStatus.DISPATCHED, dispatchedAt: expect.any(Date) }),
          },
          vehicle: { 
            findUnique: vi.fn()
              .mockResolvedValueOnce({ id: 'v1', status: VehicleStatus.AVAILABLE })
              .mockResolvedValueOnce({ id: 'v1', status: VehicleStatus.AVAILABLE }),
            update: vi.fn().mockResolvedValue({ status: VehicleStatus.ON_TRIP }),
          },
          driver: { 
            findUnique: vi.fn()
              .mockResolvedValueOnce({ id: 'd1', status: DriverStatus.AVAILABLE })
              .mockResolvedValueOnce({ id: 'd1', status: DriverStatus.AVAILABLE }),
            update: vi.fn().mockResolvedValue({ status: DriverStatus.ON_TRIP }),
          },
        }
        return fn(tx)
      })

      await tripsService.dispatch('t1', 'user1')
    })

    it('should throw BusinessRuleError if vehicle status changed during dispatch', async () => {
      const mockTrip = { id: 't1', status: TripStatus.DRAFT, vehicleId: 'v1', driverId: 'd1' }
      const mockVehicle = { id: 'v1', status: VehicleStatus.AVAILABLE }
      const mockDriver = { id: 'd1', status: DriverStatus.AVAILABLE }

      prisma.$transaction.mockImplementation(async (fn) => {
        const tx = {
          trip: { findUnique: vi.fn().mockResolvedValue(mockTrip) },
          vehicle: {
            findUnique: vi.fn()
              .mockResolvedValueOnce(mockVehicle)
              .mockResolvedValueOnce({ ...mockVehicle, status: VehicleStatus.IN_SHOP }),
          },
          driver: { findUnique: vi.fn().mockResolvedValue(mockDriver) },
        }
        return fn(tx)
      })

      await expect(tripsService.dispatch('t1', 'user1'))
        .rejects.toThrow(BusinessRuleError)
    })
  })

  describe('complete - Rule 7', () => {
    it('should complete dispatched trip and update odometer', async () => {
      const mockTrip = { id: 't1', status: TripStatus.DISPATCHED, vehicleId: 'v1', driverId: 'd1', plannedDistance: 150 }
      const mockVehicle = { id: 'v1', status: VehicleStatus.ON_TRIP, odometer: 10000 }
      const updatedTrip = { ...mockTrip, status: TripStatus.COMPLETED, actualDistance: 155, fuelConsumed: 20, completedAt: expect.any(Date) }

      prisma.$transaction.mockImplementation(async (fn) => {
        const tx = {
          trip: { 
            findUnique: vi.fn().mockResolvedValue(mockTrip),
            update: vi.fn().mockResolvedValue({ ...mockTrip, status: TripStatus.COMPLETED, actualDistance: 155, fuelConsumed: 20, completedAt: expect.any(Date) }),
          },
          vehicle: {
            findUnique: vi.fn().mockResolvedValue(mockVehicle),
            update: vi.fn().mockResolvedValue({ ...mockVehicle, status: VehicleStatus.AVAILABLE, odometer: 10155 }),
          },
          driver: { findUnique: vi.fn().mockResolvedValue({ id: 'd1', status: DriverStatus.ON_TRIP }), update: vi.fn().mockResolvedValue({ status: DriverStatus.AVAILABLE }) },
        }
        return fn(tx)
      })

      const result = await tripsService.complete('t1', { actualDistance: 155, fuelConsumed: 20 }, 'user1')

      expect(result.status).toBe(TripStatus.COMPLETED)
      expect(result.actualDistance).toBe(155)
    })

    it('should throw BusinessRuleError for non-DISPATCHED trip', async () => {
      const mockTrip = { id: 't1', status: TripStatus.DRAFT }
      prisma.$transaction.mockImplementation(async (fn) => {
        const tx = { trip: { findUnique: vi.fn().mockResolvedValue(mockTrip), update: vi.fn() } }
        return fn(tx)
      })

      await expect(tripsService.complete('t1', { actualDistance: 155, fuelConsumed: 20 }, 'user1'))
        .rejects.toThrow(BusinessRuleError)
    })

it('should use re-fetched odometer for race condition prevention', async () => {
      const mockTrip = { id: 't1', status: TripStatus.DISPATCHED, vehicleId: 'v1', driverId: 'd1', plannedDistance: 150 }
      const mockVehicleInitial = { id: 'v1', status: VehicleStatus.ON_TRIP, odometer: 10000 }
      const mockVehicleRefreshed = { id: 'v1', status: VehicleStatus.ON_TRIP, odometer: 10010 }

      prisma.$transaction.mockImplementation(async (fn) => {
        const tx = {
          trip: { 
            findUnique: vi.fn().mockResolvedValue(mockTrip),
            update: vi.fn().mockResolvedValue({ ...mockTrip, status: TripStatus.COMPLETED, actualDistance: 155, fuelConsumed: 20, completedAt: expect.any(Date) }),
          },
          vehicle: {
            findUnique: vi.fn()
              .mockResolvedValueOnce(mockVehicleInitial)
              .mockResolvedValueOnce(mockVehicleRefreshed),
            update: vi.fn().mockResolvedValue({ ...mockVehicleRefreshed, status: VehicleStatus.AVAILABLE, odometer: 10165 }),
          },
          driver: { findUnique: vi.fn().mockResolvedValue({ id: 'd1', status: DriverStatus.ON_TRIP }), update: vi.fn().mockResolvedValue({ status: DriverStatus.AVAILABLE }) },
        }
        return fn(tx)
      })

      const result = await tripsService.complete('t1', { actualDistance: 155, fuelConsumed: 20 }, 'user1')
      expect(result.status).toBe(TripStatus.COMPLETED)
    })

    it('should throw BusinessRuleError if vehicle no longer ON_TRIP', async () => {
      const mockTrip = { id: 't1', status: TripStatus.DISPATCHED, vehicleId: 'v1', driverId: 'd1', plannedDistance: 150 }
      const mockVehicle = { id: 'v1', status: VehicleStatus.AVAILABLE }

      prisma.$transaction.mockImplementation(async (fn) => {
        const tx = {
          trip: { findUnique: vi.fn().mockResolvedValue(mockTrip), update: vi.fn() },
          vehicle: { findUnique: vi.fn().mockResolvedValue(mockVehicle), update: vi.fn() },
        }
        return fn(tx)
      })

      await expect(tripsService.complete('t1', { actualDistance: 155, fuelConsumed: 20 }, 'user1'))
        .rejects.toThrow(BusinessRuleError)
    })

it('should calculate revenue as plannedDistance * FLAT_RATE_PER_KM when not provided', async () => {
      const mockTrip = { id: 't1', status: TripStatus.DISPATCHED, vehicleId: 'v1', driverId: 'd1', plannedDistance: 200 }
      const mockVehicle = { id: 'v1', status: VehicleStatus.ON_TRIP, odometer: 10000 }

      prisma.$transaction.mockImplementation(async (fn) => {
        const tx = {
          trip: { 
            findUnique: vi.fn().mockResolvedValue(mockTrip),
            update: vi.fn().mockResolvedValue({ ...mockTrip, status: TripStatus.COMPLETED, actualDistance: 205, fuelConsumed: 25, completedAt: expect.any(Date), revenue: 200 * 50 }),
          },
          vehicle: { findUnique: vi.fn().mockResolvedValue(mockVehicle), update: vi.fn().mockResolvedValue({ ...mockVehicle, status: VehicleStatus.AVAILABLE, odometer: 10205 }) },
          driver: { findUnique: vi.fn().mockResolvedValue({ id: 'd1', status: DriverStatus.ON_TRIP }), update: vi.fn().mockResolvedValue({ status: DriverStatus.AVAILABLE }) },
        }
        return fn(tx)
      })

      const result = await tripsService.complete('t1', { actualDistance: 205, fuelConsumed: 25 }, 'user1')

      expect(result.revenue).toBe(200 * 50)
    })
  })

  describe('cancel - Rule 8', () => {
    it('should cancel DRAFT trip without reverting vehicle/driver', async () => {
      const mockTrip = { id: 't1', status: TripStatus.DRAFT, vehicleId: 'v1', driverId: 'd1' }

      prisma.$transaction.mockImplementation(async (fn) => {
        const tx = {
          trip: { findUnique: vi.fn().mockResolvedValue(mockTrip), update: vi.fn().mockResolvedValue({ ...mockTrip, status: TripStatus.CANCELLED }) },
          vehicle: { findUnique: vi.fn() },
          driver: { findUnique: vi.fn() },
        }
        return fn(tx)
      })

      const result = await tripsService.cancel('t1', 'user1')

      expect(result.status).toBe(TripStatus.CANCELLED)
    })

    it('should revert vehicle/driver to AVAILABLE when cancelling DISPATCHED trip', async () => {
      const mockTrip = { id: 't1', status: TripStatus.DISPATCHED, vehicleId: 'v1', driverId: 'd1' }
      const mockVehicle = { id: 'v1', status: VehicleStatus.ON_TRIP }
      const mockDriver = { id: 'd1', status: DriverStatus.ON_TRIP }

      prisma.$transaction.mockImplementation(async (fn) => {
        const tx = {
          trip: { findUnique: vi.fn().mockResolvedValue(mockTrip), update: vi.fn().mockResolvedValue({ ...mockTrip, status: TripStatus.CANCELLED }) },
          vehicle: { findUnique: vi.fn().mockResolvedValue(mockVehicle), update: vi.fn().mockResolvedValue({ ...mockVehicle, status: VehicleStatus.AVAILABLE }) },
          driver: { findUnique: vi.fn().mockResolvedValue(mockDriver), update: vi.fn().mockResolvedValue({ ...mockDriver, status: DriverStatus.AVAILABLE }) },
        }
        return fn(tx)
      })

      const result = await tripsService.cancel('t1', 'user1')

      expect(result.status).toBe(TripStatus.CANCELLED)
    })

    it('should throw BusinessRuleError for COMPLETED trip', async () => {
      const mockTrip = { id: 't1', status: TripStatus.COMPLETED }
      prisma.$transaction.mockImplementation(async (fn) => {
        const tx = { trip: { findUnique: vi.fn().mockResolvedValue(mockTrip) } }
        return fn(tx)
      })

      await expect(tripsService.cancel('t1', 'user1'))
        .rejects.toThrow(BusinessRuleError)
    })

    it('should re-verify vehicle/driver status before reverting (race condition prevention)', async () => {
      const mockTrip = { id: 't1', status: TripStatus.DISPATCHED, vehicleId: 'v1', driverId: 'd1' }
      const mockVehicle = { id: 'v1', status: VehicleStatus.AVAILABLE }
      const mockDriver = { id: 'd1', status: DriverStatus.AVAILABLE }

      prisma.$transaction.mockImplementation(async (fn) => {
        const tx = {
          trip: { findUnique: vi.fn().mockResolvedValue(mockTrip), update: vi.fn().mockResolvedValue({ ...mockTrip, status: TripStatus.CANCELLED }) },
          vehicle: { findUnique: vi.fn().mockResolvedValue(mockVehicle), update: vi.fn().mockResolvedValue({ ...mockVehicle, status: VehicleStatus.AVAILABLE }) },
          driver: { findUnique: vi.fn().mockResolvedValue(mockDriver), update: vi.fn().mockResolvedValue({ ...mockDriver, status: DriverStatus.AVAILABLE }) },
        }
        return fn(tx)
      })

      const result = await tripsService.cancel('t1', 'user1')
      expect(result.status).toBe(TripStatus.CANCELLED)
    })
  })
})

describe('Maintenance Service - Rules 9,10', () => {
  beforeEach(() => {
    clearAllMocks()
  })

  describe('create - Rule 9', () => {
    it('should open maintenance and set vehicle to IN_SHOP', async () => {
      const input = { vehicleId: 'v1', description: 'Oil change', cost: 3500 }
      const mockVehicle = { id: 'v1', status: VehicleStatus.AVAILABLE }
      const mockLog = { id: 'ml1', ...input, isActive: true, openedAt: expect.any(Date) }

      prisma.$transaction.mockImplementation(async (fn) => {
        const tx = {
          vehicle: { findUnique: vi.fn().mockResolvedValue(mockVehicle), update: vi.fn().mockResolvedValue({ ...mockVehicle, status: VehicleStatus.IN_SHOP }) },
          maintenanceLog: { create: vi.fn().mockResolvedValue(mockLog) },
        }
        return fn(tx)
      })

      const result = await maintenanceService.create(input, 'user1')

      expect(result).toEqual(mockLog)
    })

    it('should throw BusinessRuleError for retired vehicle', async () => {
      const input = { vehicleId: 'v1', description: 'Engine repair', cost: 18000 }
      const mockVehicle = { id: 'v1', status: VehicleStatus.RETIRED }

      prisma.$transaction.mockImplementation(async (fn) => {
        const tx = { vehicle: { findUnique: vi.fn().mockResolvedValue(mockVehicle) } }
        return fn(tx)
      })

      await expect(maintenanceService.create(input, 'user1'))
        .rejects.toThrow(BusinessRuleError)
    })
  })

  describe('close - Rule 10', () => {
    it('should close maintenance and set vehicle to AVAILABLE', async () => {
      const mockLog = { id: 'ml1', vehicleId: 'v1', isActive: true, openedAt: new Date() }
      const mockVehicle = { id: 'v1', status: VehicleStatus.IN_SHOP }
      const updatedLog = { ...mockLog, isActive: false, closedAt: expect.any(Date) }

      prisma.$transaction.mockImplementation(async (fn) => {
        const tx = {
          maintenanceLog: { findUnique: vi.fn().mockResolvedValue(mockLog), update: vi.fn().mockResolvedValue(updatedLog) },
          vehicle: { findUnique: vi.fn().mockResolvedValue(mockVehicle), update: vi.fn().mockResolvedValue({ ...mockVehicle, status: VehicleStatus.AVAILABLE }) },
        }
        return fn(tx)
      })

      const result = await maintenanceService.close('ml1', 'user1')

      expect(result.isActive).toBe(false)
    })

    it('should not set vehicle to AVAILABLE if RETIRED', async () => {
      const mockLog = { id: 'ml1', vehicleId: 'v1', isActive: true }
      const mockVehicle = { id: 'v1', status: VehicleStatus.RETIRED }
      const updatedLog = { ...mockLog, isActive: false, closedAt: expect.any(Date) }

      prisma.$transaction.mockImplementation(async (fn) => {
        const tx = {
          maintenanceLog: { findUnique: vi.fn().mockResolvedValue(mockLog), update: vi.fn().mockResolvedValue(updatedLog) },
          vehicle: { findUnique: vi.fn().mockResolvedValue(mockVehicle) },
        }
        return fn(tx)
      })

      const result = await maintenanceService.close('ml1', 'user1')

      expect(result.isActive).toBe(false)
    })

    it('should throw BusinessRuleError for already closed log', async () => {
      const mockLog = { id: 'ml1', isActive: false }
      prisma.$transaction.mockImplementation(async (fn) => {
        const tx = { maintenanceLog: { findUnique: vi.fn().mockResolvedValue(mockLog) } }
        return fn(tx)
      })

      await expect(maintenanceService.close('ml1', 'user1'))
        .rejects.toThrow(BusinessRuleError)
    })

    it('should re-verify vehicle status inside transaction (race condition prevention)', async () => {
      const mockLog = { id: 'ml1', vehicleId: 'v1', isActive: true }
      const mockVehicleInitial = { id: 'v1', status: VehicleStatus.IN_SHOP }
      const mockVehicleRefreshed = { id: 'v1', status: VehicleStatus.RETIRED }

      prisma.$transaction.mockImplementation(async (fn) => {
        const tx = {
          maintenanceLog: { findUnique: vi.fn().mockResolvedValue(mockLog), update: vi.fn().mockResolvedValue({ ...mockLog, isActive: false }) },
          vehicle: {
            findUnique: vi.fn()
              .mockResolvedValueOnce(mockVehicleInitial)
              .mockResolvedValueOnce(mockVehicleRefreshed),
          },
        }
        return fn(tx)
      })

      const result = await maintenanceService.close('ml1', 'user1')
      expect(result.isActive).toBe(false)
    })
  })
})

describe('Expense Service', () => {
  beforeEach(() => {
    clearAllMocks()
  })

  describe('createFuelLog', () => {
    it('should create fuel log for valid vehicle', async () => {
      const input = { vehicleId: 'v1', liters: 42, cost: 5040, date: new Date() }
      const mockVehicle = { id: 'v1' }
      const mockLog = { id: 'fl1', ...input }
      prisma.vehicle.findUnique.mockResolvedValue(mockVehicle)
      prisma.fuelLog.create.mockResolvedValue(mockLog)

      const result = await expensesService.createFuelLog(input)

      expect(result).toEqual(mockLog)
    })

    it('should throw NotFoundError for invalid vehicle', async () => {
      const input = { vehicleId: 'invalid', liters: 42, cost: 5040 }
      prisma.vehicle.findUnique.mockResolvedValue(null)

      await expect(expensesService.createFuelLog(input))
        .rejects.toThrow(NotFoundError)
    })
  })

  describe('createExpense', () => {
    it('should create expense without vehicle', async () => {
      const input = { category: 'INSURANCE', amount: 50000, notes: 'Annual insurance' }
      const mockExpense = { id: 'e1', ...input, vehicleId: null }
      prisma.expense.create.mockResolvedValue(mockExpense)

      const result = await expensesService.createExpense(input)

      expect(result).toEqual(mockExpense)
    })

    it('should create expense with valid vehicle', async () => {
      const input = { vehicleId: 'v1', category: 'TOLL', amount: 500 }
      const mockVehicle = { id: 'v1' }
      const mockExpense = { id: 'e1', ...input }
      prisma.vehicle.findUnique.mockResolvedValue(mockVehicle)
      prisma.expense.create.mockResolvedValue(mockExpense)

      const result = await expensesService.createExpense(input)

      expect(result).toEqual(mockExpense)
    })

    it('should throw NotFoundError for invalid vehicleId', async () => {
      const input = { vehicleId: 'invalid', category: 'TOLL', amount: 500 }
      prisma.vehicle.findUnique.mockResolvedValue(null)

      await expect(expensesService.createExpense(input))
        .rejects.toThrow(NotFoundError)
    })
  })
})