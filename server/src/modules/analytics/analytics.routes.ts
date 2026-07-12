import { Router } from 'express'
import { analyticsController } from './analytics.controller'
import { authenticate } from '../../middleware/authenticate'

const router = Router()

// Health check endpoint has no authentication
router.get('/health', analyticsController.health)

// Dashboard requires authentication
router.get('/dashboard', authenticate, analyticsController.dashboard)

export default router
