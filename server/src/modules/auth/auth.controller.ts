import { Request, Response } from 'express'
import { authService } from './auth.service'
import { sendSuccess } from '../../utils/response'
import { JWT_COOKIE_NAME, COOKIE_MAX_AGE } from '../../config/constants'
import { env } from '../../config/env'
import { asyncHandler } from '../../utils/asyncHandler'
import { CookieOptions } from 'express'

const COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
  maxAge: COOKIE_MAX_AGE,
  path: '/',
}

export const authController = {
  login: asyncHandler(async (req: Request, res: Response) => {
    const ip = req.ip ?? req.socket.remoteAddress
    const { token, user } = await authService.login(req.body, ip)
    res.cookie(JWT_COOKIE_NAME, token, COOKIE_OPTIONS)
    sendSuccess(res, user, 'Login successful', 200)
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    const user = await authService.getMe(req.user.id)
    sendSuccess(res, user, 'User retrieved')
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    await authService.logout(req.user.id)
    res.clearCookie(JWT_COOKIE_NAME, { httpOnly: true, path: '/' })
    sendSuccess(res, null, 'Logged out successfully')
  }),
}
