import { Request, Response, NextFunction } from 'express'

type AsyncFn = (req: Request, res: Response, next: NextFunction) => Promise<unknown>

/**
 * Wraps async controller functions so errors are forwarded to error.middleware.ts.
 * Eliminates try/catch boilerplate in every controller.
 */
export const asyncHandler = (fn: AsyncFn) =>
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
