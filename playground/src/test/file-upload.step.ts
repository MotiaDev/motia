import type { ApiRouteConfig, Handlers } from 'motia'

export const config: ApiRouteConfig = {
  name: 'FileUpload',
  type: 'api',
  path: '/upload',
  method: 'POST',
  description: 'Accepts file uploads via multipart/form-data and returns metadata about the uploaded files',
  emits: [],
  flows: ['files'],
}

export const handler: Handlers['FileUpload'] = async (req, { logger }) => {
  const files = req.files || []

  logger.info('Received file upload request', {
    fileCount: files.length,
    files: files.map((f) => ({
      fieldName: f.fieldName,
      originalName: f.originalName,
      mimeType: f.mimeType,
      size: f.size,
    })),
  })

  return {
    status: 200,
    body: {
      message: 'Files uploaded successfully',
      uploaded: files.length,
      files: files.map((f) => ({
        fieldName: f.fieldName,
        originalName: f.originalName,
        mimeType: f.mimeType,
        size: f.size,
      })),
    },
  }
}
