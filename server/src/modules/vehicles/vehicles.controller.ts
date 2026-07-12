import { Request, Response } from 'express'
import { vehiclesService } from './vehicles.service'
import { sendSuccess, sendPaginated } from '../../utils/response'
import { asyncHandler } from '../../utils/asyncHandler'

export const vehiclesController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { data, total } = await vehiclesService.list(req.query as any)
    const { page, limit } = req.query as any
    sendPaginated(res, data, total, page, limit, 'Vehicles retrieved')
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const vehicle = await vehiclesService.getById(req.params.id)
    sendSuccess(res, vehicle, 'Vehicle retrieved')
  }),

  getDispatchable: asyncHandler(async (req: Request, res: Response) => {
    const vehicles = await vehiclesService.getDispatchable()
    sendSuccess(res, vehicles, 'Dispatchable vehicles retrieved')
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const vehicle = await vehiclesService.create(req.body, req.user.id)
    sendSuccess(res, vehicle, 'Vehicle created', 201)
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const vehicle = await vehiclesService.update(req.params.id, req.body, req.user.id)
    sendSuccess(res, vehicle, 'Vehicle updated')
  }),

  retire: asyncHandler(async (req: Request, res: Response) => {
    const vehicle = await vehiclesService.retire(req.params.id, req.user.id)
    sendSuccess(res, vehicle, 'Vehicle retired')
  }),
}
