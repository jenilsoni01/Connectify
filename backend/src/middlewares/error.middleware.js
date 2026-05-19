export const errorHandler = (err, req, res, next) => {
  let status = err.statusCode || 500
  let message = err.message || 'Server error'
  if (err.name === 'ZodError') {
    status = 400
    message = err.issues?.[0]?.message || 'Invalid request'
  }
  res.status(status).json({ success: false, message, data: null })
}
