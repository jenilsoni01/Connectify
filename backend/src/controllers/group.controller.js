import { z } from 'zod'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ok } from '../utils/apiResponse.js'
import { createGroup, addMember, removeMember, makeAdmin, updateGroup } from '../services/group.service.js'

const createSchema = z.object({
  name: z.string().min(2),
  members: z.array(z.string()).optional(),
  groupPic: z.string().optional(),
  onlyAdminsCanSend: z.boolean().optional(),
  onlyAdminsCanEdit: z.boolean().optional(),
  onlyAdminsCanAdd: z.boolean().optional()
})

const memberSchema = z.object({
  conversationId: z.string(),
  memberId: z.string()
})

const updateSchema = z.object({
  conversationId: z.string(),
  name: z.string().min(2).optional(),
  groupPic: z.string().optional(),
  onlyAdminsCanSend: z.boolean().optional(),
  onlyAdminsCanEdit: z.boolean().optional(),
  onlyAdminsCanAdd: z.boolean().optional()
})

export const createGroupController = asyncHandler(async (req, res) => {
  const body = createSchema.parse(req.body)
  const result = await createGroup({
    userId: req.user.id,
    name: body.name,
    members: body.members || [],
    groupPic: body.groupPic || '',
    onlyAdminsCanSend: body.onlyAdminsCanSend,
    onlyAdminsCanEdit: body.onlyAdminsCanEdit,
    onlyAdminsCanAdd: body.onlyAdminsCanAdd
  })
  return ok(res, 'Group created', result)
})

export const addMemberController = asyncHandler(async (req, res) => {
  const body = memberSchema.parse(req.body)
  const result = await addMember({
    userId: req.user.id,
    conversationId: body.conversationId,
    memberId: body.memberId
  })
  return ok(res, 'Member added', result)
})

export const removeMemberController = asyncHandler(async (req, res) => {
  const body = memberSchema.parse(req.body)
  const result = await removeMember({
    userId: req.user.id,
    conversationId: body.conversationId,
    memberId: body.memberId
  })
  return ok(res, 'Member removed', result)
})

export const makeAdminController = asyncHandler(async (req, res) => {
  const body = memberSchema.parse(req.body)
  const result = await makeAdmin({
    userId: req.user.id,
    conversationId: body.conversationId,
    memberId: body.memberId
  })
  return ok(res, 'Admin updated', result)
})

export const updateGroupController = asyncHandler(async (req, res) => {
  const body = updateSchema.parse(req.body)
  const result = await updateGroup({
    userId: req.user.id,
    conversationId: body.conversationId,
    name: body.name,
    groupPic: body.groupPic,
    onlyAdminsCanSend: body.onlyAdminsCanSend,
    onlyAdminsCanEdit: body.onlyAdminsCanEdit,
    onlyAdminsCanAdd: body.onlyAdminsCanAdd
  })
  return ok(res, 'Group updated', result)
})
