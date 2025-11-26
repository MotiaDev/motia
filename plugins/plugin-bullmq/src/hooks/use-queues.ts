import { useCallback, useEffect } from 'react'
import { useBullMQStore } from '../stores/use-bullmq-store'
import type { QueueInfo } from '../types/queue'

export const useQueues = () => {
  const { queues, setQueues, setLoading, setError, isLoading, error } = useBullMQStore()

  const fetchQueues = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/__motia/bullmq/queues')
      if (!response.ok) {
        throw new Error('Failed to fetch queues')
      }
      const data = await response.json()
      setQueues(data.queues)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [setQueues, setLoading, setError])

  const refreshQueue = useCallback(async (name: string): Promise<QueueInfo | null> => {
    try {
      const response = await fetch(`/__motia/bullmq/queues/${encodeURIComponent(name)}`)
      if (!response.ok) {
        throw new Error('Failed to fetch queue')
      }
      return await response.json()
    } catch {
      return null
    }
  }, [])

  const pauseQueue = useCallback(
    async (name: string) => {
      try {
        await fetch(`/__motia/bullmq/queues/${encodeURIComponent(name)}/pause`, { method: 'POST' })
        await fetchQueues()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to pause queue')
      }
    },
    [fetchQueues, setError],
  )

  const resumeQueue = useCallback(
    async (name: string) => {
      try {
        await fetch(`/__motia/bullmq/queues/${encodeURIComponent(name)}/resume`, { method: 'POST' })
        await fetchQueues()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to resume queue')
      }
    },
    [fetchQueues, setError],
  )

  const cleanQueue = useCallback(
    async (name: string, status: string, grace = 0, limit = 1000) => {
      try {
        await fetch(`/__motia/bullmq/queues/${encodeURIComponent(name)}/clean`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status, grace, limit }),
        })
        await fetchQueues()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to clean queue')
      }
    },
    [fetchQueues, setError],
  )

  const drainQueue = useCallback(
    async (name: string) => {
      try {
        await fetch(`/__motia/bullmq/queues/${encodeURIComponent(name)}/drain`, { method: 'POST' })
        await fetchQueues()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to drain queue')
      }
    },
    [fetchQueues, setError],
  )

  useEffect(() => {
    fetchQueues()
    const interval = setInterval(fetchQueues, 5000)
    return () => clearInterval(interval)
  }, [fetchQueues])

  return {
    queues,
    isLoading,
    error,
    fetchQueues,
    refreshQueue,
    pauseQueue,
    resumeQueue,
    cleanQueue,
    drainQueue,
  }
}
