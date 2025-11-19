import { useStreamEventHandler, useStreamGroup } from '@motiadev/stream-client-react'
import { useCallback, useEffect, useRef } from 'react'
import { useStreamRbacStore } from '../store'
import type { MessageStreamItem, StreamError } from '../types'
import { hasItemChanged } from '../utils'

type UseStreamConnectionProps = {
  streamName: string
  groupId: string
}

export const useStreamConnection = ({ streamName, groupId }: UseStreamConnectionProps) => {
  const { setMessages, appendLog, setConnectionState, setError } = useStreamRbacStore()
  const { data, event } = useStreamGroup<MessageStreamItem>({ streamName, groupId })
  const previousSnapshot = useRef<Map<string, MessageStreamItem>>(new Map())
  const isInitialConnection = useRef(true)

  // Handle error events
  const handleError = useCallback(
    (errorData: StreamError) => {
      appendLog(`${errorData.code}: ${errorData.message}`, 'error')
      setError(errorData)
    },
    [appendLog, setError],
  )

  useStreamEventHandler({ event, type: 'error', listener: handleError }, [handleError])

  useEffect(() => {
    previousSnapshot.current.clear()
    isInitialConnection.current = true
  }, [groupId])

  useEffect(() => {
    // Consolidated effect: handle connection and data processing
    if (!event) {
      return
    }

    // Handle connection event
    if (isInitialConnection.current) {
      setConnectionState('connected')
      appendLog(`Joined group ${groupId}`)
      isInitialConnection.current = false
    }

    // Process data changes
    setMessages(data)

    const previous = previousSnapshot.current
    const currentSize = previous.size

    // Efficiently update the existing Map instead of creating a new one
    const currentIds = new Set<string>()

    // Process updates and additions
    for (const item of data) {
      if (item?.id) {
        currentIds.add(item.id)
        const prevItem = previous.get(item.id)

        if (!prevItem) {
          // New item
          if (currentSize > 0) {
            appendLog(`Item create (${item.id})`)
          }
          previous.set(item.id, item)
        } else if (hasItemChanged(prevItem, item)) {
          // Updated item
          appendLog(`Item update (${item.id})`)
          previous.set(item.id, item)
        }
      }
    }

    // Handle initial sync
    if (currentSize === 0 && currentIds.size > 0) {
      appendLog(`Sync received (${currentIds.size} item${currentIds.size === 1 ? '' : 's'})`)
    }

    // Process deletions
    for (const [key] of previous) {
      if (!currentIds.has(key)) {
        appendLog(`Item delete (${key})`)
        previous.delete(key)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, event, groupId, setConnectionState, appendLog, setMessages])
}
