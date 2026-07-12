import { Request, Response } from 'express'
import { expensesService } from './expenses.service'
import { sendSuccess, sendPaginated } from '../../utils/response'
import { asyncHandler } from '../../utils/asyncHandler'

export const expensesController = {
  listFuelLogs: asyncHandler(async (req: Request, res: Response) => {
    const { data, total } = await expensesService.listFuelLogs(req.query as any)
    const { page, limit } = req.query as any
    sendPaginated(res, data, total, page, limit, 'Fuel logs retrieved')
  }),

  listExpenses: asyncHandler(async (req: Request, res: Response) => {
    const { data, total } = await expensesService.listExpenses(req.query as any)
    const { page, limit } = req.query as any
    sendPaginated(res, data, total, page, limit, 'Expenses retrieved')
  }),

  createFuelLog: asyncHandler(async (req: Request, res: Response) => {
    const log = await expensesService.createFuelLog(req.body)
    sendSuccess(res, log, 'Fuel log created', 201)
  }),

  createExpense: asyncHandler(async (req: Request, res: Response) => {
    const expense = await expensesService.createExpense(req.body)
    sendSuccess(res, expense, 'Expense created', 201)
  }),
}
