import type { ApiResponse, ApiRouteConfig, ApiRouteHandler } from '../../types'

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'file-upload-step',
  emits: [],
  path: '/upload',
  method: 'POST',
}

export const handler: ApiRouteHandler<unknown, ApiResponse<200, { uploaded: number; files: unknown[] }>> = async (
  req,
) => {
  const files = req.files || []
  return {
    status: 200,
    body: {
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
