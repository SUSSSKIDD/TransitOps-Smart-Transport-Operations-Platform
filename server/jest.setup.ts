import { vi } from 'vitest'

// Create a mock PrismaClient class
class MockPrismaClient {
  user = {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deleteMany: vi.fn(),
  }
  vehicle = {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deleteMany: vi.fn(),
    count: vi.fn(),
    groupBy: vi.fn(),
  }
  driver = {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deleteMany: vi.fn(),
    count: vi.fn(),
    groupBy: vi.fn(),
  }
  trip = {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateStatus: vi.fn(),
    deleteMany: vi.fn(),
    count: vi.fn(),
    groupBy: vi.fn(),
  }
  maintenanceLog = {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deleteMany: vi.fn(),
    count: vi.fn(),
    groupBy: vi.fn(),
  }
  fuelLog = {
    findMany: vi.fn(),
    create: vi.fn(),
    deleteMany: vi.fn(),
    count: vi.fn(),
    groupBy: vi.fn(),
  }
  expense = {
    findMany: vi.fn(),
    create: vi.fn(),
    deleteMany: vi.fn(),
    count: vi.fn(),
    groupBy: vi.fn(),
  }
  $transaction = vi.fn(async (callback: (tx: MockPrismaClient) => Promise<any>) => {
    return callback(mPrismaClient)
  })
  $queryRaw = vi.fn()
  $disconnect = vi.fn()
}

vi.mock('@prisma/client', () => ({
  PrismaClient: MockPrismaClient,
}))

// Mock bcryptjs
export const bcryptCompareMock = vi.fn().mockResolvedValue(true)
export const bcryptHashMock = vi.fn().mockResolvedValue('hashed_password')

vi.mock('bcryptjs', () => ({
  __esModule: true,
  default: {
    hash: bcryptHashMock,
    compare: bcryptCompareMock,
  },
  hash: bcryptHashMock,
  compare: bcryptCompareMock,
}))

// Mock jsonwebtoken
vi.mock('jsonwebtoken', () => ({
  __esModule: true,
  default: {
    sign: vi.fn().mockReturnValue('mock_token'),
    verify: vi.fn().mockReturnValue({ id: 'user1', email: 'test@test.com', role: 'FLEET_MANAGER' }),
  },
  sign: vi.fn().mockReturnValue('mock_token'),
  verify: vi.fn().mockReturnValue({ id: 'user1', email: 'test@test.com', role: 'FLEET_MANAGER' }),
}))

// Mock uuid
vi.mock('uuid', () => ({
  v4: vi.fn().mockReturnValue('mock-uuid-v4'),
}))

// Mock logger
vi.mock('../src/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    http: vi.fn(),
  },
}))

// Mock jwt utils
export const signAccessTokenMock = vi.fn().mockReturnValue('mock_access_token')
export const signRefreshTokenMock = vi.fn().mockReturnValue('mock_refresh_token')
export const verifyAccessTokenMock = vi.fn().mockReturnValue({ id: 'user1', email: 'test@test.com', role: 'FLEET_MANAGER' })
export const verifyRefreshTokenMock = vi.fn().mockReturnValue({ id: 'user1', email: 'test@test.com', role: 'FLEET_MANAGER', tokenId: 'token1' })
export const storeRefreshTokenMock = vi.fn()
export const validateRefreshTokenMock = vi.fn().mockReturnValue(true)
export const revokeRefreshTokenMock = vi.fn()
export const revokeAllUserRefreshTokensMock = vi.fn()

vi.mock('../src/utils/jwt', () => ({
  signAccessToken: signAccessTokenMock,
  signRefreshToken: signRefreshTokenMock,
  verifyAccessToken: verifyAccessTokenMock,
  verifyRefreshToken: verifyRefreshTokenMock,
  storeRefreshToken: storeRefreshTokenMock,
  validateRefreshToken: validateRefreshTokenMock,
  revokeRefreshToken: revokeRefreshTokenMock,
  revokeAllUserRefreshTokens: revokeAllUserRefreshTokensMock,
}))

// Set test environment variables
process.env.JWT_SECRET = 'test-secret-key-min-32-characters-long'
process.env.JWT_EXPIRES_IN = '15m'
process.env.REFRESH_TOKEN_EXPIRES_IN = '7d'
process.env.DATABASE_URL = 'file:./test.db'
process.env.CLIENT_URL = 'http://localhost:3000'
process.env.NODE_ENV = 'test'
process.env.COOKIE_SECURE = 'false'
process.env.PORT = '4000'