import { Router } from 'express'
import {
  createGroupController,
  addMemberController,
  removeMemberController,
  makeAdminController,
  updateGroupController
} from '../controllers/group.controller.js'
import { requireAuth } from '../middlewares/auth.middleware.js'

const router = Router()

router.post('/create', requireAuth, createGroupController)
router.put('/add-member', requireAuth, addMemberController)
router.put('/remove-member', requireAuth, removeMemberController)
router.put('/make-admin', requireAuth, makeAdminController)
router.put('/update', requireAuth, updateGroupController)

export default router
