export const ensureWebSocketUrl = (wsUrl: string, authToken: string): string => {
  const raw = wsUrl.trim()
  if (!raw) {
    throw new Error('Please provide the WebSocket endpoint (e.g. ws://localhost:3000)')
  }

  let normalized: URL
  try {
    normalized = new URL(raw)
  } catch {
    if (typeof window === 'undefined') {
      throw new Error('Invalid WebSocket URL.')
    }
    normalized = new URL(raw, window.location.origin)
  }

  const token = authToken.trim()
  if (token) {
    normalized.searchParams.set('authToken', token)
  }

  return normalized.toString()
}

export const resolvePromptPath = (groupId: string): string => {
  return `/rbac-stream/${encodeURIComponent(groupId)}`
}

export const convertWsToHttp = (wsUrl: string): string => {
  const requestUrl = new URL(wsUrl)
  if (requestUrl.protocol === 'wss:') {
    requestUrl.protocol = 'https:'
  } else if (requestUrl.protocol === 'ws:') {
    requestUrl.protocol = 'http:'
  }
  return requestUrl.toString()
}
