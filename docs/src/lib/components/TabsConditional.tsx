'use client'

import { useCallback, useMemo } from 'react'
import { useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'

function normalizeValue(v: string): string {
  return v.toLowerCase().replace(/\s/, '-')
}

function getTabValue(groupId: string, persist: boolean): string | null {
  if (typeof window === 'undefined') return null
  const storage = persist ? localStorage : sessionStorage
  return storage.getItem(groupId)
}

function createSubscribe(groupId: string, persist: boolean) {
  return (callback: () => void) => {
    let last = getTabValue(groupId, persist)
    const id = setInterval(() => {
      const current = getTabValue(groupId, persist)
      if (current !== last) {
        last = current
        callback()
      }
    }, 100)
    return () => clearInterval(id)
  }
}

export function TabsConditional({
  groupId,
  persist = true,
  values,
  children,
}: {
  groupId: string
  persist?: boolean
  values: string[]
  children: ReactNode
}) {
  const subscribe = useMemo(
    () => createSubscribe(groupId, persist),
    [groupId, persist]
  )
  const getSnapshot = useCallback(
    () => getTabValue(groupId, persist),
    [groupId, persist]
  )
  const storageValue = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => null
  )
  const matches =
    storageValue !== null &&
    values.some((v) => normalizeValue(v) === storageValue)
  if (!matches) return null
  return <>{children}</>
}
