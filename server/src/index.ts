import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import { env } from './config/env'
import { logger } from './utils/logger'
import { setupGracefulShutdown } from './shutdown'
import { requestId } from './middleware/requestId'
import { morganMiddleware } from './middleware/morgan'
import { errorMiddleware } from './middleware/error.middleware'

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
app.use(express.json())

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
})

setupGracefulShutdown(server)
