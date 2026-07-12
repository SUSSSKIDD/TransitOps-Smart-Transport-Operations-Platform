import { Request, Response, NextFunction } from 'express'
import { AuthenticationError } from '../utils/errors'
import { verifyAccessToken, TokenPayload } from '../utils/jwt'
import { ACCESS_TOKEN_COOKIE_NAME } from '../config/constants'

declare global {
  namespace Express {
    interface Request {
      user: TokenPayload
      requestId: string
    }
  }
}

export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  const token = req.cookies?.[ACCESS_TOKEN_COOKIE_NAME] as string | undefined
  if (!token) {
    return next(new AuthenticationError())
  }
  try {
    req.user = verifyAccessToken(token)
    next()
  } catch {
    next(new AuthenticationError('Invalid or expired token'))
  }
}
