import { Request, Response, NextFunction } from 'express'
import { AuthenticationError } from '../utils/errors'
import { verifyToken, TokenPayload } from '../utils/jwt'
import { JWT_COOKIE_NAME } from '../config/constants'

declare global {
  namespace Express {
    interface Request {
      user: TokenPayload
    }
  }
}

export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  const token = req.cookies?.[JWT_COOKIE_NAME] as string | undefined
  if (!token) {
    return next(new AuthenticationError())
  }
  try {
    req.user = verifyToken(token)
    next()
  } catch {
    next(new AuthenticationError('Invalid or expired token'))
  }
}
