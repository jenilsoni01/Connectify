export const handleUpload = (file) => {
  if (!file) {
    const error = new Error('File missing')
    error.statusCode = 400
    throw error
  }
  return { url: `/uploads/${file.filename}` }
}
