import morgan from 'morgan'
import { logger } from '../utils/logger'
import { Request } from 'express'

morgan.token('requestId', (req: Request) => req.requestId ?? '-')

export const morganMiddleware = morgan(
  ':method :url :status :res[content-length] - :response-time ms [requestId: :requestId]',
  {
    stream: {
      write: (message: string) => {
        logger.http(message.trim())
      },
    },
  }
)
