import type { StreamChannelRef } from './iii-types'
import type { ApiResponse, HttpRequest, HttpResponse, InternalHttpRequest } from './types'

/**
 * Safely stringify a value, handling circular references, BigInt, and other edge cases.
 * Returns "[unserializable]" if serialization fails for any reason.
 */
export function safeStringify(value: unknown): string {
  const seen = new WeakSet<object>()

  try {
    return JSON.stringify(value, (_key, val) => {
      // Handle BigInt
      if (typeof val === 'bigint') {
        return val.toString()
      }

      // Handle circular references
      if (val !== null && typeof val === 'object') {
        if (seen.has(val)) {
          return '[Circular]'
        }
        seen.add(val)
      }

      return val
    })
  } catch {
    return '[unserializable]'
  }
}

export const http = (
  // biome-ignore lint/suspicious/noConfusingVoidType: void is necessary here
  callback: (req: HttpRequest, res: HttpResponse) => Promise<void | ApiResponse>,
) => {
  return async (req: InternalHttpRequest) => {
    const { response, ...request } = req

    const httpResponse: HttpResponse = {
      status: (status_code: number) =>
        response.sendMessage(JSON.stringify({ type: 'set_status', status_code })),
      headers: (headers: Record<string, string>) =>
        response.sendMessage(JSON.stringify({ type: 'set_headers', headers })),
      stream: response.stream,
      close: () => response.close(),
    }

    return callback(request, httpResponse)
  }
}

export const isChannelRef = (value: unknown): value is StreamChannelRef => {
  if (typeof value !== 'object' || value === null) return false
  const maybe = value as Partial<StreamChannelRef>
  return (
    typeof maybe.channel_id === 'string' &&
    typeof maybe.access_key === 'string' &&
    (maybe.direction === 'read' || maybe.direction === 'write')
  )
}
