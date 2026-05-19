import { asyncHandler } from '../utils/asyncHandler.js'
import { ok } from '../utils/apiResponse.js'
import { sendRequest, acceptRequest, rejectRequest, listFriends, listRequests } from '../services/friend.service.js'

export const sendRequestController = asyncHandler(async (req, res) => {
  const result = await sendRequest(req.user.id, req.params.id)
  return ok(res, 'Request sent', result)
})

export const acceptRequestController = asyncHandler(async (req, res) => {
  const result = await acceptRequest(req.user.id, req.params.id)
  return ok(res, 'Request accepted', result)
})

export const rejectRequestController = asyncHandler(async (req, res) => {
  const result = await rejectRequest(req.user.id, req.params.id)
  return ok(res, 'Request rejected', result)
})

export const listFriendsController = asyncHandler(async (req, res) => {
  const friends = await listFriends(req.user.id)
  return ok(res, 'Friends', friends)
})

export const listRequestsController = asyncHandler(async (req, res) => {
  const requests = await listRequests(req.user.id)
  return ok(res, 'Requests', requests)
})
