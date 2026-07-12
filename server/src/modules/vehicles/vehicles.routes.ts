import { Router } from 'express'
import { vehiclesController } from './vehicles.controller'
import { authenticate } from '../../middleware/authenticate'
import { authorize } from '../../middleware/authorize'
import { validate } from '../../middleware/validate'
import { Role } from '../../types/enums'
import { CreateVehicleSchema, UpdateVehicleSchema, ListVehicleSchema, GetByIdSchema } from './vehicles.schema'

const router = Router()

router.use(authenticate)

router.get('/', validate(ListVehicleSchema), vehiclesController.list)
router.get('/dispatchable', vehiclesController.getDispatchable)
router.get('/:id', validate(GetByIdSchema), vehiclesController.getById)

router.post('/', authorize(Role.FLEET_MANAGER), validate(CreateVehicleSchema), vehiclesController.create)
router.put('/:id', authorize(Role.FLEET_MANAGER), validate(UpdateVehicleSchema), vehiclesController.update)
router.patch('/:id/retire', authorize(Role.FLEET_MANAGER), validate(GetByIdSchema), vehiclesController.retire)

export default router
