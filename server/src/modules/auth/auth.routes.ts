import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { authController } from './auth.controller'
import { authenticate } from '../../middleware/authenticate'
import { validate } from '../../middleware/validate'
import { LoginSchema } from './auth.schema'
import { LOGIN_RATE_LIMIT_MAX, LOGIN_RATE_LIMIT_WINDOW } from '../../config/constants'

const router = Router()

const loginLimiter = rateLimit({
  windowMs: LOGIN_RATE_LIMIT_WINDOW,
  max: LOGIN_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts, please try again later', errorCode: 'RATE_LIMITED' },
})

router.post('/login', loginLimiter, validate(LoginSchema), authController.login)
router.get('/me', authenticate, authController.me)
router.post('/logout', authenticate, authController.logout)

export default router
