import type { ApiResponse, ApiRouteConfig, ApiRouteHandler } from '../../types'

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'large-data-step',
  emits: [],
  path: '/large-data',
  method: 'POST',
}

export const handler: ApiRouteHandler<string, ApiResponse<number, unknown>> = async (body) => {
  if (typeof body === 'string')
    return {
      status: 200,
      body: {
        'return data': 'random',
      },
    }
  if (Buffer.isBuffer(body)) return body.byteLength
  if (body && typeof (body as any).length === 'number') return (body as any).length
  return 0
}
