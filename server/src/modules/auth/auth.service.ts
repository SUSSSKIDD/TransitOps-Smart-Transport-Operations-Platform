import bcrypt from 'bcryptjs'
import { prisma } from '../../db'
import { signToken } from '../../utils/jwt'
import { AuthenticationError, NotFoundError } from '../../utils/errors'
import { logger } from '../../utils/logger'
import { LoginInput } from './auth.schema'

export const authService = {
  async login(input: LoginInput, ip?: string) {
    const user = await prisma.user.findUnique({ where: { email: input.email } })
    if (!user) throw new AuthenticationError('Invalid email or password')

    const valid = await bcrypt.compare(input.password, user.passwordHash)
    if (!valid) throw new AuthenticationError('Invalid email or password')

    const token = signToken({ id: user.id, email: user.email, role: user.role })

    logger.info('AUDIT: user_login', {
      event: 'user_login',
      userId: user.id,
      email: user.email,
      role: user.role,
      ip,
    })

    return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } }
  },

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    })
    if (!user) throw new NotFoundError('User')
    return user
  },

  async logout(userId: string) {
    logger.info('AUDIT: user_logout', { event: 'user_logout', userId })
  },
}
