import { Router } from 'express'
import { tripsController } from './trips.controller'
import { authenticate } from '../../middleware/authenticate'
import { authorize } from '../../middleware/authorize'
import { validate } from '../../middleware/validate'
import { Role } from '../../types/enums'
import { CreateTripSchema, DispatchTripSchema, CompleteTripSchema, ListTripSchema, GetByIdSchema } from './trips.schema'

const router = Router()

router.use(authenticate)

router.get('/', validate(ListTripSchema), tripsController.list)
router.get('/:id', validate(GetByIdSchema), tripsController.getById)

router.post('/', authorize(Role.FLEET_MANAGER, Role.DRIVER), validate(CreateTripSchema), tripsController.create)
router.patch('/:id/dispatch', authorize(Role.FLEET_MANAGER, Role.DRIVER), validate(DispatchTripSchema), tripsController.dispatch)
router.patch('/:id/complete', authorize(Role.FLEET_MANAGER, Role.DRIVER), validate(CompleteTripSchema), tripsController.complete)
router.patch('/:id/cancel', authorize(Role.FLEET_MANAGER, Role.DRIVER), validate(GetByIdSchema), tripsController.cancel)

export default router
