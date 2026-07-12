import { Router } from 'express'
import { expensesController } from './expenses.controller'
import { authenticate } from '../../middleware/authenticate'
import { authorize } from '../../middleware/authorize'
import { validate } from '../../middleware/validate'
import { Role } from '../../types/enums'
import { CreateFuelLogSchema, CreateExpenseSchema, ListFuelLogsSchema, ListExpensesSchema } from './expenses.schema'

const router = Router()

router.use(authenticate)

router.get('/fuel', validate(ListFuelLogsSchema), expensesController.listFuelLogs)
router.get('/', validate(ListExpensesSchema), expensesController.listExpenses)

router.post('/fuel', authorize(Role.FLEET_MANAGER, Role.DRIVER), validate(CreateFuelLogSchema), expensesController.createFuelLog)
router.post('/', authorize(Role.FLEET_MANAGER, Role.DRIVER), validate(CreateExpenseSchema), expensesController.createExpense)

export default router
