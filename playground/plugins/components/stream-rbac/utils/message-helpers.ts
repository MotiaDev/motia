import type { MessageStreamItem } from '../types'

export const hasItemChanged = (prev: MessageStreamItem, next: MessageStreamItem): boolean => {
  // Fast path: check updatedAt first (most common case)
  if (prev.updatedAt !== next.updatedAt) {
    return true
  }

  // Fast path: reference equality
  if (prev === next) {
    return false
  }

  // Check specific fields that we care about
  if (prev.from !== next.from || prev.status !== next.status || prev.message !== next.message) {
    return true
  }

  // Only do full comparison if needed (rare case)
  const prevKeys = Object.keys(prev)
  const nextKeys = Object.keys(next)

  if (prevKeys.length !== nextKeys.length) {
    return true
  }

  for (const key of prevKeys) {
    if (prev[key as keyof MessageStreamItem] !== next[key as keyof MessageStreamItem]) {
      return true
    }
  }

  return false
}

export const sortMessagesByUpdatedAt = (messages: MessageStreamItem[]): MessageStreamItem[] => {
  if (messages.length === 0) return messages
  return messages.slice().reverse()
}

export const getAuthorBadgeVariant = (from?: string) => {
  if (from === 'user') return 'warning'
  if (from === 'assistant') return 'info'
  return 'default'
}

export const getStatusBadgeVariant = (status?: string) => {
  if (status === 'completed') return 'success'
  if (status === 'error') return 'error'
  if (status === 'pending') return 'warning'
  return 'default'
}
