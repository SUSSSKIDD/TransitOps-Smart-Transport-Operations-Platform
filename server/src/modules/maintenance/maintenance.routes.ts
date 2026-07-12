import { Router } from 'express'
import { maintenanceController } from './maintenance.controller'
import { authenticate } from '../../middleware/authenticate'
import { authorize } from '../../middleware/authorize'
import { validate } from '../../middleware/validate'
import { Role } from '../../types/enums'
import { CreateMaintenanceSchema, CloseMaintenanceSchema, ListMaintenanceSchema } from './maintenance.schema'

const router = Router()

router.use(authenticate)

router.get('/', validate(ListMaintenanceSchema), maintenanceController.list)

router.post('/', authorize(Role.FLEET_MANAGER), validate(CreateMaintenanceSchema), maintenanceController.create)
router.patch('/:id/close', authorize(Role.FLEET_MANAGER), validate(CloseMaintenanceSchema), maintenanceController.close)

export default router
