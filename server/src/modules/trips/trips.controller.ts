import { Request, Response } from 'express'
import { tripsService } from './trips.service'
import { sendSuccess, sendPaginated } from '../../utils/response'
import { asyncHandler } from '../../utils/asyncHandler'

export const tripsController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { data, total } = await tripsService.list(req.query as any)
    const { page, limit } = req.query as any
    sendPaginated(res, data, total, page, limit, 'Trips retrieved')
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const trip = await tripsService.getById(req.params.id)
    sendSuccess(res, trip, 'Trip retrieved')
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const trip = await tripsService.create(req.body, req.user.id)
    sendSuccess(res, trip, 'Trip created', 201)
  }),

  dispatch: asyncHandler(async (req: Request, res: Response) => {
    const trip = await tripsService.dispatch(req.params.id, req.user.id)
    sendSuccess(res, trip, 'Trip dispatched successfully')
  }),

  complete: asyncHandler(async (req: Request, res: Response) => {
    const trip = await tripsService.complete(req.params.id, req.body, req.user.id)
    sendSuccess(res, trip, 'Trip completed successfully')
  }),

  cancel: asyncHandler(async (req: Request, res: Response) => {
    const trip = await tripsService.cancel(req.params.id, req.user.id)
    sendSuccess(res, trip, 'Trip cancelled')
  }),
}
