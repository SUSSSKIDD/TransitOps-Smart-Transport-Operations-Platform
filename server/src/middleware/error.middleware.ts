import { Request, Response, NextFunction } from 'express'
import { Prisma } from '@prisma/client'
import { AppError, ConflictError, ValidationError } from '../utils/errors'
import { sendError } from '../utils/response'
import { logger } from '../utils/logger'
import { ZodError } from 'zod'

export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  // Zod errors (shouldn't normally reach here if validate middleware is used, but as safety net)
  if (err instanceof ZodError) {
    const messages = err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ')
    sendError(res, messages, 'VALIDATION_ERROR', 422)
    return
  }

  // Our custom AppError hierarchy
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error('Server error', { message: err.message, stack: err.stack, requestId: req.requestId })
    }
    sendError(res, err.message, err.errorCode, err.statusCode)
    return
  }

  // Prisma unique constraint violation → 409 Conflict
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const field = (err.meta?.target as string[])?.join(', ') ?? 'field'
      sendError(res, `A record with this ${field} already exists`, 'CONFLICT', 409)
      return
    }
    if (err.code === 'P2025') {
      sendError(res, 'Record not found', 'NOT_FOUND', 404)
      return
    }
  }

  // Unhandled errors
  logger.error('Unhandled error', { message: err.message, stack: err.stack, requestId: req.requestId })
  sendError(res, 'An unexpected error occurred', 'INTERNAL_ERROR', 500)
}
