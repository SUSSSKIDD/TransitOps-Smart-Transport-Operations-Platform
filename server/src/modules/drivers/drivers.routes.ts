import { Router } from 'express'
import { driversController } from './drivers.controller'
import { authenticate } from '../../middleware/authenticate'
import { authorize } from '../../middleware/authorize'
import { validate } from '../../middleware/validate'
import { Role  } from '@prisma/client'
import { Role } from ''
import { CreateDriverSchema, UpdateDriverSchema, ListDriverSchema, GetByIdSchema } from './drivers.schema'

const router = Router()

router.use(authenticate)

router.get('/', validate(ListDriverSchema), driversController.list)
router.get('/dispatchable', driversController.getDispatchable)
router.get('/:id', validate(GetByIdSchema), driversController.getById)

router.post('/', authorize(Role.FLEET_MANAGER.SAFETY_OFFICER), validate(CreateDriverSchema), driversController.create)
router.put('/:id', authorize(Role.FLEET_MANAGER.SAFETY_OFFICER), validate(UpdateDriverSchema), driversController.update)
router.patch('/:id/suspend', authorize(Role.FLEET_MANAGER), validate(GetByIdSchema), driversController.suspend)

export default router
