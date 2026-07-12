import { Request, Response } from 'express'
import { authService } from './auth.service'
import { sendSuccess } from '../../utils/response'
import { 
  ACCESS_TOKEN_COOKIE_NAME, 
  REFRESH_TOKEN_COOKIE_NAME, 
  ACCESS_TOKEN_MAX_AGE, 
  REFRESH_TOKEN_MAX_AGE 
} from '../../config/constants'
import { env } from '../../config/env'
import { asyncHandler } from '../../utils/asyncHandler'
import { CookieOptions } from 'express'

const COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
  path: '/',
}

export const authController = {
  login: asyncHandler(async (req: Request, res: Response) => {
    const ip = req.ip ?? req.socket.remoteAddress
    const { accessToken, refreshToken, user } = await authService.login(req.body, ip)
    
    res.cookie(ACCESS_TOKEN_COOKIE_NAME, accessToken, { ...COOKIE_OPTIONS, maxAge: ACCESS_TOKEN_MAX_AGE })
    res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, { ...COOKIE_OPTIONS, maxAge: REFRESH_TOKEN_MAX_AGE })
    
    sendSuccess(res, user, 'Login successful', 200)
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME] as string | undefined
    if (!refreshToken) {
      return sendSuccess(res, null, 'No refresh token', 401)
    }

    const { accessToken, refreshToken: newRefreshToken } = await authService.refreshAccessToken(refreshToken)
    
    res.cookie(ACCESS_TOKEN_COOKIE_NAME, accessToken, { ...COOKIE_OPTIONS, maxAge: ACCESS_TOKEN_MAX_AGE })
    res.cookie(REFRESH_TOKEN_COOKIE_NAME, newRefreshToken, { ...COOKIE_OPTIONS, maxAge: REFRESH_TOKEN_MAX_AGE })
    
    sendSuccess(res, null, 'Token refreshed')
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    const user = await authService.getMe(req.user.id)
    sendSuccess(res, user, 'User retrieved')
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    await authService.logout(req.user.id)
    res.clearCookie(ACCESS_TOKEN_COOKIE_NAME, { httpOnly: true, path: '/' })
    res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, { httpOnly: true, path: '/' })
    sendSuccess(res, null, 'Logged out successfully')
  }),
}
