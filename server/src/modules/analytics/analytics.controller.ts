import { Request, Response } from 'express'
import { analyticsService } from './analytics.service'
import { sendSuccess } from '../../utils/response'
import { asyncHandler } from '../../utils/asyncHandler'
import { prisma } from '../../db'
import { HEALTH_CHECK_QUERY } from '../../config/constants'

export const analyticsController = {
  dashboard: asyncHandler(async (req: Request, res: Response) => {
    const dashboard = await analyticsService.getDashboard()
    sendSuccess(res, dashboard, 'Dashboard retrieved')
  }),

  health: asyncHandler(async (req: Request, res: Response) => {
    // Basic ping to DB
    await prisma.$queryRawUnsafe(HEALTH_CHECK_QUERY)
    
    sendSuccess(res, {
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? '1.0.0'
    }, 'OK')
  }),
}
