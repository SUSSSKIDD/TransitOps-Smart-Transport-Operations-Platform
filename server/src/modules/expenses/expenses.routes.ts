import { Router } from 'express'
import { expensesController } from './expenses.controller'
import { authenticate } from '../../middleware/authenticate'
import { authorize } from '../../middleware/authorize'
import { validate } from '../../middleware/validate'
import { Role  } from '@prisma/client'
import { Role } from ''
import { CreateFuelLogSchema, CreateExpenseSchema, ListFuelLogsSchema, ListExpensesSchema } from './expenses.schema'

const router = Router()

router.use(authenticate)

router.get('/fuel', validate(ListFuelLogsSchema), expensesController.listFuelLogs)
router.get('/', validate(ListExpensesSchema), expensesController.listExpenses)

router.post('/fuel', authorize(Role.FLEET_MANAGER.DRIVER), validate(CreateFuelLogSchema), expensesController.createFuelLog)
router.post('/', authorize(Role.FLEET_MANAGER.DRIVER), validate(CreateExpenseSchema), expensesController.createExpense)

export default router
