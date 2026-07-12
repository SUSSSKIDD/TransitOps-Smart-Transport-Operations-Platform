import jwt from 'jsonwebtoken'
import { env } from '../config/env'
import { Role  } from '@prisma/client'
import { Role } from '../../types/enums'

export interface TokenPayload {
  id: string
  email: string
  role: Role
}

export const signToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] })
}

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload
}
