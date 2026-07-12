import jwt from 'jsonwebtoken'
import { env } from '../config/env'
import { Role } from '../types/enums'

export interface TokenPayload {
  id: string
  email: string
  role: Role
}

export interface RefreshTokenPayload extends TokenPayload {
  tokenId: string
}

const accessTokenOptions: jwt.SignOptions = {
  expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
}

const refreshTokenOptions: jwt.SignOptions = {
  expiresIn: env.REFRESH_TOKEN_EXPIRES_IN as jwt.SignOptions['expiresIn'],
}

// In-memory store for refresh tokens (use Redis in production)
const refreshTokenStore = new Map<string, { userId: string; expiresAt: number; revoked: boolean }>()

export const signAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET, accessTokenOptions)
}

export const signRefreshToken = (payload: TokenPayload, tokenId: string): string => {
  return jwt.sign({ ...payload, tokenId }, env.JWT_SECRET, refreshTokenOptions)
}

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload
}

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  return jwt.verify(token, env.JWT_SECRET) as RefreshTokenPayload
}

export const storeRefreshToken = (tokenId: string, userId: string, expiresInMs: number): void => {
  refreshTokenStore.set(tokenId, {
    userId,
    expiresAt: Date.now() + expiresInMs,
    revoked: false,
  })
}

export const validateRefreshToken = (tokenId: string): boolean => {
  const stored = refreshTokenStore.get(tokenId)
  if (!stored) return false
  if (stored.revoked) return false
  if (Date.now() > stored.expiresAt) {
    refreshTokenStore.delete(tokenId)
    return false
  }
  return true
}

export const revokeRefreshToken = (tokenId: string): void => {
  const stored = refreshTokenStore.get(tokenId)
  if (stored) {
    stored.revoked = true
  }
}

export const revokeAllUserRefreshTokens = (userId: string): void => {
  for (const [tokenId, stored] of refreshTokenStore.entries()) {
    if (stored.userId === userId) {
      stored.revoked = true
    }
  }
}

// Cleanup expired tokens periodically
setInterval(() => {
  const now = Date.now()
  for (const [tokenId, stored] of refreshTokenStore.entries()) {
    if (stored.expiresAt < now) {
      refreshTokenStore.delete(tokenId)
    }
  }
}, 60 * 60 * 1000) // Every hour
