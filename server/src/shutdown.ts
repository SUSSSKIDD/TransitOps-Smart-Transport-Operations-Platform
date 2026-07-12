import http from 'http'
import { prisma } from './db'
import { logger } from './utils/logger'
import { GRACEFUL_SHUTDOWN_TIMEOUT } from './config/constants'

export const setupGracefulShutdown = (server: http.Server): void => {
  const shutdown = (signal: string) => {
    logger.info(`${signal} received — initiating graceful shutdown`)
    server.close(async () => {
      try {
        await prisma.$disconnect()
        logger.info('Database disconnected. Exiting.')
        process.exit(0)
      } catch (err) {
        logger.error('Error during shutdown', { err })
        process.exit(1)
      }
    })

    // Force exit if connections don't drain in time
    setTimeout(() => {
      logger.error('Graceful shutdown timeout — forcing exit')
      process.exit(1)
    }, GRACEFUL_SHUTDOWN_TIMEOUT)
  }

  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception', { err })
    shutdown('uncaughtException')
  })
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection', { reason })
  })
}
