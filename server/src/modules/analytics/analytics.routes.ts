import { Router } from 'express'
import { analyticsController } from './analytics.controller'
import { authenticate } from '../../middleware/authenticate'
import { authorize } from '../../middleware/authorize'
import { Role } from '../../types/enums'

const router = Router()

// Health check endpoint - no authentication required
router.get('/health', analyticsController.health)

// Dashboard requires authentication and authorization
router.get('/dashboard', authenticate, authorize(Role.FLEET_MANAGER, Role.FINANCIAL_ANALYST), analyticsController.dashboard)

export default router
