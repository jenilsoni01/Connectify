import { asyncHandler } from '../utils/asyncHandler.js'
import { ok } from '../utils/apiResponse.js'
import { handleUpload } from '../services/upload.service.js'

export const uploadProfilePicController = asyncHandler(async (req, res) => {
  const result = handleUpload(req.file)
  return ok(res, 'Uploaded', result)
})

export const uploadStoryController = asyncHandler(async (req, res) => {
  const result = handleUpload(req.file)
  return ok(res, 'Uploaded', result)
})

export const uploadChatController = asyncHandler(async (req, res) => {
  const result = handleUpload(req.file)
  return ok(res, 'Uploaded', result)
})
