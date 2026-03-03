import { useCallback, useRef, useState } from 'react'

export function formatDuration(ms: number): string {
  if (ms < 0.001) return '0μs'
  if (ms < 1) return `${(ms * 1000).toFixed(0)}μs`
  if (ms < 1000) return `${ms.toFixed(2)}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

export function useCopyToClipboard(timeout = 2000) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const copy = useCallback(
    (key: string, text: string) => {
      navigator.clipboard.writeText(text).catch(() => {})
      setCopiedKey(key)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => setCopiedKey(null), timeout)
    },
    [timeout],
  )

  return { copiedKey, copy }
}

export function getServiceName(span: { service_name?: string; name: string }): string {
  return span.service_name || span.name.split('.')[0]
}

export const STATUS_CONFIG: Record<
  string,
  { color: string; bg: string; border: string; label: string }
> = {
  ok: { color: '#22C55E', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.15)', label: 'OK' },
  error: {
    color: '#EF4444',
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.15)',
    label: 'ERROR',
  },
  unset: {
    color: '#6B7280',
    bg: 'rgba(107,114,128,0.08)',
    border: 'rgba(107,114,128,0.15)',
    label: 'UNSET',
  },
  default: {
    color: '#6B7280',
    bg: 'rgba(107,114,128,0.08)',
    border: 'rgba(107,114,128,0.15)',
    label: 'UNKNOWN',
  },
}
