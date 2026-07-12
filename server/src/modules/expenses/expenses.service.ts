import { expenseRepo } from './expense.repository'
import { vehicleRepo } from '../vehicles/vehicle.repository'
import { CreateFuelLogInput, CreateExpenseInput, ListFuelLogsQuery, ListExpensesQuery } from './expenses.schema'
import { NotFoundError } from '../../utils/errors'

export const expensesService = {
  async listFuelLogs(query: ListFuelLogsQuery) {
    return expenseRepo.findFuelLogs(query)
  },

  async listExpenses(query: ListExpensesQuery) {
    return expenseRepo.findExpenses(query)
  },

  async createFuelLog(input: CreateFuelLogInput) {
    const vehicle = await vehicleRepo.findById(input.vehicleId)
    if (!vehicle) throw new NotFoundError('Vehicle')
    return expenseRepo.createFuelLog(input)
  },

  async createExpense(input: CreateExpenseInput) {
    if (input.vehicleId) {
      const vehicle = await vehicleRepo.findById(input.vehicleId)
      if (!vehicle) throw new NotFoundError('Vehicle')
    }
    return expenseRepo.createExpense(input)
  },
}
