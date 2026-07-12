import { Request, Response } from 'express'
import { driversService } from './drivers.service'
import { sendSuccess, sendPaginated } from '../../utils/response'
import { asyncHandler } from '../../utils/asyncHandler'

export const driversController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { data, total } = await driversService.list(req.query as any)
    const { page, limit } = req.query as any
    sendPaginated(res, data, total, page, limit, 'Drivers retrieved')
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const driver = await driversService.getById(req.params.id as string)
    sendSuccess(res, driver, 'Driver retrieved')
  }),

  getDispatchable: asyncHandler(async (req: Request, res: Response) => {
    const drivers = await driversService.getDispatchable()
    sendSuccess(res, drivers, 'Dispatchable drivers retrieved')
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const driver = await driversService.create(req.body, req.user.id)
    sendSuccess(res, driver, 'Driver created', 201)
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const driver = await driversService.update(req.params.id as string, req.body, req.user.id)
    sendSuccess(res, driver, 'Driver updated')
  }),

  suspend: asyncHandler(async (req: Request, res: Response) => {
    const driver = await driversService.suspend(req.params.id as string, req.user.id)
    sendSuccess(res, driver, 'Driver suspended')
  }),
}
