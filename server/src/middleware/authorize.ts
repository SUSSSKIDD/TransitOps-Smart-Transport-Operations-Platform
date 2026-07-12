import { Request, Response, NextFunction } from 'express'
import { Role } from '../types/enums'
import { AuthorizationError } from '../utils/errors'

export const authorize = (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role as Role)) {
      return next(new AuthorizationError())
    }
    next()
  }
