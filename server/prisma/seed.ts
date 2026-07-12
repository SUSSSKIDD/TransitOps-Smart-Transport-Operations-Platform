import { Role, VehicleStatus, DriverStatus, TripStatus } from '../src/types/enums';
import { PrismaClient } from '@prisma/client'




import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export async function seed() {
  console.log('🌱 Seeding database...')

  // ── Users ─────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('Password123!', 10)

  const [fleetManager, driver, safety, finance] = await Promise.all([
    prisma.user.upsert({
      where: { email: 'fleetmanager@transitops.com' },
      update: {},
      create: { name: 'Fleet Manager', email: 'fleetmanager@transitops.com', passwordHash, role: Role.FLEET_MANAGER },
    }),
    prisma.user.upsert({
      where: { email: 'driver@transitops.com' },
      update: {},
      create: { name: 'John Driver', email: 'driver@transitops.com', passwordHash, role: Role.DRIVER },
    }),
    prisma.user.upsert({
      where: { email: 'safety@transitops.com' },
      update: {},
      create: { name: 'Safety Officer', email: 'safety@transitops.com', passwordHash, role: Role.SAFETY_OFFICER },
    }),
    prisma.user.upsert({
      where: { email: 'finance@transitops.com' },
      update: {},
      create: { name: 'Financial Analyst', email: 'finance@transitops.com', passwordHash, role: Role.FINANCIAL_ANALYST },
    }),
  ])
  console.log('✅ Users seeded:', [fleetManager.email, driver.email, safety.email, finance.email])

  // ── Vehicles ──────────────────────────────────────────────────────────
  const [van05, truck01, van02, bus01, van03] = await Promise.all([
    prisma.vehicle.upsert({
      where: { registrationNumber: 'VAN-05-REG' },
      update: {},
      create: {
        registrationNumber: 'VAN-05-REG',
        name: 'Van-05',
        type: 'Van',
        maxLoadCapacityKg: 500,
        odometer: 12400,
        acquisitionCost: 850000,
        status: VehicleStatus.AVAILABLE,
        region: 'North',
      },
    }),
    prisma.vehicle.upsert({
      where: { registrationNumber: 'TRK-01-REG' },
      update: {},
      create: {
        registrationNumber: 'TRK-01-REG',
        name: 'Truck-01',
        type: 'Truck',
        maxLoadCapacityKg: 5000,
        odometer: 48200,
        acquisitionCost: 2500000,
        status: VehicleStatus.AVAILABLE,
        region: 'South',
      },
    }),
    prisma.vehicle.upsert({
      where: { registrationNumber: 'VAN-02-REG' },
      update: {},
      create: {
        registrationNumber: 'VAN-02-REG',
        name: 'Van-02',
        type: 'Van',
        maxLoadCapacityKg: 450,
        odometer: 21000,
        acquisitionCost: 780000,
        status: VehicleStatus.IN_SHOP,
        region: 'East',
      },
    }),
    prisma.vehicle.upsert({
      where: { registrationNumber: 'BUS-01-REG' },
      update: {},
      create: {
        registrationNumber: 'BUS-01-REG',
        name: 'Bus-01',
        type: 'Bus',
        maxLoadCapacityKg: 8000,
        odometer: 92000,
        acquisitionCost: 4200000,
        status: VehicleStatus.AVAILABLE,
        region: 'West',
      },
    }),
    prisma.vehicle.upsert({
      where: { registrationNumber: 'VAN-03-REG' },
      update: {},
      create: {
        registrationNumber: 'VAN-03-REG',
        name: 'Van-03',
        type: 'Van',
        maxLoadCapacityKg: 500,
        odometer: 65000,
        acquisitionCost: 820000,
        status: VehicleStatus.RETIRED,
        region: 'North',
      },
    }),
  ])
  console.log('✅ Vehicles seeded: Van-05, Truck-01, Van-02 (IN_SHOP), Bus-01, Van-03 (RETIRED)')

  // ── Drivers ───────────────────────────────────────────────────────────
  const futureDate = new Date()
  futureDate.setFullYear(futureDate.getFullYear() + 2)

  const pastDate = new Date()
  pastDate.setMonth(pastDate.getMonth() - 3)

  const [alex, mia, raj] = await Promise.all([
    prisma.driver.upsert({
      where: { licenseNumber: 'LIC-ALEX-001' },
      update: {},
      create: {
        name: 'Alex',
        licenseNumber: 'LIC-ALEX-001',
        licenseCategory: 'Heavy Vehicle',
        licenseExpiryDate: futureDate,
        contactNumber: '+91-9876543210',
        safetyScore: 98,
        status: DriverStatus.AVAILABLE,
      },
    }),
    prisma.driver.upsert({
      where: { licenseNumber: 'LIC-MIA-002' },
      update: {},
      create: {
        name: 'Mia Chen',
        licenseNumber: 'LIC-MIA-002',
        licenseCategory: 'Medium Vehicle',
        licenseExpiryDate: futureDate,
        contactNumber: '+91-9123456780',
        safetyScore: 95,
        status: DriverStatus.AVAILABLE,
      },
    }),
    prisma.driver.upsert({
      where: { licenseNumber: 'LIC-RAJ-003' },
      update: {},
      create: {
        name: 'Raj Kumar',
        licenseNumber: 'LIC-RAJ-003',
        licenseCategory: 'Light Vehicle',
        licenseExpiryDate: pastDate, // expired — won't appear in dispatchable
        contactNumber: '+91-9988776655',
        safetyScore: 72,
        status: DriverStatus.OFF_DUTY,
      },
    }),
  ])
  console.log('✅ Drivers seeded: Alex (available), Mia (available), Raj (expired license, off-duty)')

  // ── Historical Trips ──────────────────────────────────────────────────
  const trip1 = await prisma.trip.create({
    data: {
      source: 'Mumbai',
      destination: 'Pune',
      cargoWeightKg: 300,
      plannedDistance: 148,
      actualDistance: 152,
      fuelConsumed: 18.5,
      revenue: 9500,
      status: TripStatus.COMPLETED,
      vehicleId: van05.id,
      driverId: alex.id,
      dispatchedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
    },
  })

  const trip2 = await prisma.trip.create({
    data: {
      source: 'Delhi',
      destination: 'Agra',
      cargoWeightKg: 2000,
      plannedDistance: 210,
      actualDistance: 215,
      fuelConsumed: 45,
      revenue: 18000,
      status: TripStatus.COMPLETED,
      vehicleId: truck01.id,
      driverId: mia.id,
      dispatchedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000),
    },
  })

  const trip3 = await prisma.trip.create({
    data: {
      source: 'Chennai',
      destination: 'Bangalore',
      cargoWeightKg: 400,
      plannedDistance: 350,
      actualDistance: null,
      fuelConsumed: null,
      revenue: null,
      status: TripStatus.CANCELLED,
      vehicleId: van05.id,
      driverId: alex.id,
      dispatchedAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
      completedAt: null,
    },
  })

  await prisma.trip.create({
    data: {
      source: 'Hyderabad',
      destination: 'Vijayawada',
      cargoWeightKg: 1500,
      plannedDistance: 280,
      actualDistance: 285,
      fuelConsumed: 56,
      revenue: 22000,
      status: TripStatus.COMPLETED,
      vehicleId: bus01.id,
      driverId: mia.id,
      dispatchedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000),
    },
  })
  console.log('✅ Historical trips seeded: 3 COMPLETED, 1 CANCELLED')

  // ── Fuel Logs ─────────────────────────────────────────────────────────
  await Promise.all([
    prisma.fuelLog.create({ data: { vehicleId: van05.id, liters: 42, cost: 5040, date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) } }),
    prisma.fuelLog.create({ data: { vehicleId: truck01.id, liters: 80, cost: 9600, date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) } }),
    prisma.fuelLog.create({ data: { vehicleId: bus01.id, liters: 120, cost: 14400, date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) } }),
  ])
  console.log('✅ Fuel logs seeded')

  // ── Maintenance Logs ──────────────────────────────────────────────────
  await Promise.all([
    prisma.maintenanceLog.create({
      data: {
        vehicleId: van05.id,
        description: 'Oil Change + Filter Replacement',
        cost: 3500,
        isActive: false,
        openedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        closedAt: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.maintenanceLog.create({
      data: {
        vehicleId: van02.id,
        description: 'Engine Repair',
        cost: 18000,
        isActive: true, // van02 is currently IN_SHOP
        openedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        closedAt: null,
      },
    }),
  ])
  console.log('✅ Maintenance logs seeded: 1 closed (Van-05), 1 active (Van-02 IN_SHOP)')

  console.log('\n🎉 Seed complete! Demo logins:')
  console.log('  fleetmanager@transitops.com  |  Password123!')
  console.log('  driver@transitops.com        |  Password123!')
  console.log('  safety@transitops.com        |  Password123!')
  console.log('  finance@transitops.com       |  Password123!')
}

seed()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
