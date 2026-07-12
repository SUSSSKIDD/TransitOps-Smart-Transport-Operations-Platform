import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import csrf from 'csurf'
import { env } from './config/env'
import { logger } from './utils/logger'
import { setupGracefulShutdown } from './shutdown'
import { requestId } from './middleware/requestId'
import { morganMiddleware } from './middleware/morgan'
import { errorMiddleware } from './middleware/error.middleware'
import { prisma } from './db'
import { DriverStatus } from './types/enums'
import { LICENSE_EXPIRY_WARNING_DAYS } from './config/constants'

// Routers
import authRoutes from './modules/auth/auth.routes'
import vehiclesRoutes from './modules/vehicles/vehicles.routes'
import driversRoutes from './modules/drivers/drivers.routes'
import tripsRoutes from './modules/trips/trips.routes'
import maintenanceRoutes from './modules/maintenance/maintenance.routes'
import expensesRoutes from './modules/expenses/expenses.routes'
import analyticsRoutes from './modules/analytics/analytics.routes'

const app = express()

// ── Global Middleware Pipeline ──────────────────────────────────────────
app.use(cookieParser())
app.use(requestId)
app.use(morganMiddleware)
app.use(helmet())
app.use(compression())
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
)
// Limit request body size to prevent DoS
app.use(express.json({ limit: '1mb' }))

// CSRF protection for cookie-based auth (skip for login/refresh)
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
  },
})

app.use((req, res, next) => {
  // Skip CSRF for auth endpoints that use refresh token rotation
  if (req.path.startsWith('/api/v1/auth/login') || req.path.startsWith('/api/v1/auth/refresh')) {
    return next()
  }
  csrfProtection(req, res, next)
})

// Expose CSRF token to client
app.get('/api/v1/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() })
})

// ── Swagger UI (Dev Only) ─────────────────────────────────────────────
if (env.NODE_ENV !== 'production') {
  import('./config/swagger').then(({ swaggerSpec }) => {
    import('swagger-ui-express').then((swaggerUi) => {
      app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
      logger.info('Swagger UI available at /api/v1/docs')
    })
  })
}

// ── Feature Modules ───────────────────────────────────────────────────
const API_PREFIX = '/api/v1'

app.use(`${API_PREFIX}/auth`, authRoutes)
app.use(`${API_PREFIX}/vehicles`, vehiclesRoutes)
app.use(`${API_PREFIX}/drivers`, driversRoutes)
app.use(`${API_PREFIX}/trips`, tripsRoutes)
app.use(`${API_PREFIX}/maintenance`, maintenanceRoutes)
app.use(`${API_PREFIX}/expenses`, expensesRoutes)
app.use(`${API_PREFIX}/analytics`, analyticsRoutes)

// ── Global Error Handler ──────────────────────────────────────────────
app.use(errorMiddleware)

// ── Start Server ──────────────────────────────────────────────────────
const server = app.listen(env.PORT, () => {
  logger.info(`Server running in ${env.NODE_ENV} mode on port ${env.PORT}`)
  
  // Start license expiry warning job in production
  if (env.NODE_ENV === 'production') {
    startLicenseExpiryJob()
  }
})

// License expiry warning job - runs daily at midnight
function startLicenseExpiryJob() {
  const runCheck = async () => {
    try {
      const warningDate = new Date()
      warningDate.setDate(warningDate.getDate() + LICENSE_EXPIRY_WARNING_DAYS)
      
      const expiringDrivers = await prisma.driver.findMany({
        where: {
          licenseExpiryDate: {
            lte: warningDate,
            gte: new Date(), // Not already expired
          },
          status: { not: DriverStatus.SUSPENDED },
        },
        select: { id: true, name: true, licenseNumber: true, licenseExpiryDate: true },
      })
      
      if (expiringDrivers.length > 0) {
        logger.warn('AUDIT: license_expiry_warning', {
          event: 'license_expiry_warning',
          count: expiringDrivers.length,
          drivers: expiringDrivers.map(d => ({
            id: d.id,
            name: d.name,
            licenseNumber: d.licenseNumber,
            expiresAt: d.licenseExpiryDate.toISOString(),
          })),
        })
      }
    } catch (error) {
      logger.error('License expiry check failed', { error: (error as Error).message })
    }
  }
  
  // Run immediately on startup
  runCheck()
  
  // Schedule daily at midnight
  const now = new Date()
  const midnight = new Date(now)
  midnight.setHours(24, 0, 0, 0)
  const msUntilMidnight = midnight.getTime() - now.getTime()
  
  setTimeout(() => {
    runCheck()
    setInterval(runCheck, 24 * 60 * 60 * 1000) // Every 24 hours
  }, msUntilMidnight)
  
  logger.info('License expiry warning job started')
}

setupGracefulShutdown(server)
