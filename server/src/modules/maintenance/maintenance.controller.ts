import { Request, Response } from 'express'
import { maintenanceService } from './maintenance.service'
import { sendSuccess, sendPaginated } from '../../utils/response'
import { asyncHandler } from '../../utils/asyncHandler'

export const maintenanceController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { data, total } = await maintenanceService.list(req.query as any)
    const { page, limit } = req.query as any
    sendPaginated(res, data, total, page, limit, 'Maintenance logs retrieved')
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const log = await maintenanceService.create(req.body, req.user.id)
    sendSuccess(res, log, 'Maintenance log created', 201)
  }),

  close: asyncHandler(async (req: Request, res: Response) => {
    const log = await maintenanceService.close(req.params.id, req.user.id)
    sendSuccess(res, log, 'Maintenance log closed')
  }),
}
