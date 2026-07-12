import bcrypt from 'bcryptjs'
import { prisma } from '../../db'
import { signAccessToken, signRefreshToken, storeRefreshToken, revokeRefreshToken, revokeAllUserRefreshTokens, verifyRefreshToken, validateRefreshToken } from '../../utils/jwt'
import { AuthenticationError, NotFoundError } from '../../utils/errors'
import { logger } from '../../utils/logger'
import { LoginInput } from './auth.schema'
import { Role } from '../../types/enums'
import { v4 as uuidv4 } from 'uuid'

const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes

export const authService = {
  async login(input: LoginInput, ip?: string) {
    const user = await prisma.user.findUnique({ where: { email: input.email } })
    if (!user) {
      // Don't reveal if user exists
      throw new AuthenticationError('Invalid email or password')
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new AuthenticationError('Account temporarily locked. Try again later.')
    }

    const valid = await bcrypt.compare(input.password, user.passwordHash)
    if (!valid) {
      await this.recordFailedAttempt(user.id)
      throw new AuthenticationError('Invalid email or password')
    }

    // Reset failed attempts on successful login
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    })

    const tokenId = uuidv4()
    const payload = { id: user.id, email: user.email, role: user.role as Role }
    const accessToken = signAccessToken(payload)
    const refreshToken = signRefreshToken(payload, tokenId)

    storeRefreshToken(tokenId, user.id, 7 * 24 * 60 * 60 * 1000)

    logger.info('AUDIT: user_login', {
      event: 'user_login',
      userId: user.id,
      email: user.email,
      role: user.role,
      ip,
    })

    return { accessToken, refreshToken, user: { id: user.id, name: user.name, email: user.email, role: user.role } }
  },

  async recordFailedAttempt(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return

    const newAttempts = user.failedLoginAttempts + 1
    const updateData: { failedLoginAttempts: number; lockedUntil?: Date } = {
      failedLoginAttempts: newAttempts,
    }

    if (newAttempts >= MAX_FAILED_ATTEMPTS) {
      updateData.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION)
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    })
  },

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    })
    if (!user) throw new NotFoundError('User')
    return user
  },

  async refreshAccessToken(refreshToken: string) {
    const payload = verifyRefreshToken(refreshToken)
    
    if (!validateRefreshToken(payload.tokenId)) {
      throw new AuthenticationError('Refresh token revoked or expired')
    }

    // Rotate refresh token
    revokeRefreshToken(payload.tokenId)
    const newTokenId = uuidv4()
    const newPayload = { id: payload.id, email: payload.email, role: payload.role }
    const newAccessToken = signAccessToken(newPayload)
    const newRefreshToken = signRefreshToken(newPayload, newTokenId)
    storeRefreshToken(newTokenId, payload.id, 7 * 24 * 60 * 60 * 1000)

    return { accessToken: newAccessToken, refreshToken: newRefreshToken }
  },

  async logout(userId: string) {
    revokeAllUserRefreshTokens(userId)
    logger.info('AUDIT: user_logout', { event: 'user_logout', userId })
  },
}
