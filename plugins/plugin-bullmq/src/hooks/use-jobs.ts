import { useCallback, useEffect, useRef } from 'react'
import { useBullMQStore } from '../stores/use-bullmq-store'
import type { DLQJobInfo, JobInfo, JobStatus } from '../types/queue'

export const useJobs = () => {
  const { jobs, selectedQueue, selectedStatus, setJobs, setLoading, setError, isLoading, error } = useBullMQStore()
  const lastStatsRef = useRef<string | null>(null)
  const lastQueueRef = useRef<string | null>(null)
  const lastStatusRef = useRef<JobStatus | null>(null)

  const fetchJobs = useCallback(
    async (queueName: string, status: JobStatus, start = 0, end = 100) => {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({ status, start: String(start), end: String(end) })
        const response = await fetch(`/__motia/bullmq/queues/${encodeURIComponent(queueName)}/jobs?${params}`)
        if (!response.ok) {
          throw new Error('Failed to fetch jobs')
        }
        const data = await response.json()
        setJobs(data.jobs)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    },
    [setJobs, setLoading, setError],
  )

  useEffect(() => {
    if (!selectedQueue) {
      lastStatsRef.current = null
      lastQueueRef.current = null
      lastStatusRef.current = null
      return
    }

    const statsKey = JSON.stringify(selectedQueue.stats)
    const queueChanged = lastQueueRef.current !== selectedQueue.name
    const statusChanged = lastStatusRef.current !== selectedStatus
    const statsChanged = lastStatsRef.current !== null && lastStatsRef.current !== statsKey

    if (queueChanged || statusChanged || statsChanged) {
      fetchJobs(selectedQueue.name, selectedStatus)
    }

    lastStatsRef.current = statsKey
    lastQueueRef.current = selectedQueue.name
    lastStatusRef.current = selectedStatus
  }, [selectedQueue, selectedStatus, fetchJobs])

  const getJob = useCallback(async (queueName: string, jobId: string): Promise<JobInfo | null> => {
    try {
      const response = await fetch(
        `/__motia/bullmq/queues/${encodeURIComponent(queueName)}/jobs/${encodeURIComponent(jobId)}`,
      )
      if (!response.ok) {
        return null
      }
      return await response.json()
    } catch {
      return null
    }
  }, [])

  const retryJob = useCallback(
    async (queueName: string, jobId: string) => {
      try {
        await fetch(`/__motia/bullmq/queues/${encodeURIComponent(queueName)}/jobs/${encodeURIComponent(jobId)}/retry`, {
          method: 'POST',
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to retry job')
      }
    },
    [setError],
  )

  const removeJob = useCallback(
    async (queueName: string, jobId: string) => {
      try {
        await fetch(
          `/__motia/bullmq/queues/${encodeURIComponent(queueName)}/jobs/${encodeURIComponent(jobId)}/remove`,
          {
            method: 'POST',
          },
        )
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to remove job')
      }
    },
    [setError],
  )

  const promoteJob = useCallback(
    async (queueName: string, jobId: string) => {
      try {
        await fetch(
          `/__motia/bullmq/queues/${encodeURIComponent(queueName)}/jobs/${encodeURIComponent(jobId)}/promote`,
          {
            method: 'POST',
          },
        )
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to promote job')
      }
    },
    [setError],
  )

  const getDLQJobs = useCallback(async (queueName: string, start = 0, end = 100): Promise<DLQJobInfo[]> => {
    try {
      const params = new URLSearchParams({ start: String(start), end: String(end) })
      const response = await fetch(`/__motia/bullmq/dlq/${encodeURIComponent(queueName)}/jobs?${params}`)
      if (!response.ok) {
        return []
      }
      const data = await response.json()
      return data.jobs
    } catch {
      return []
    }
  }, [])

  const retryFromDLQ = useCallback(
    async (queueName: string, jobId: string) => {
      try {
        await fetch(`/__motia/bullmq/dlq/${encodeURIComponent(queueName)}/retry/${encodeURIComponent(jobId)}`, {
          method: 'POST',
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to retry from DLQ')
      }
    },
    [setError],
  )

  const retryAllFromDLQ = useCallback(
    async (queueName: string) => {
      try {
        await fetch(`/__motia/bullmq/dlq/${encodeURIComponent(queueName)}/retry-all`, {
          method: 'POST',
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to retry all from DLQ')
      }
    },
    [setError],
  )

  const clearDLQ = useCallback(
    async (queueName: string) => {
      try {
        await fetch(`/__motia/bullmq/dlq/${encodeURIComponent(queueName)}/clear`, {
          method: 'POST',
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to clear DLQ')
      }
    },
    [setError],
  )

  return {
    jobs,
    isLoading,
    error,
    fetchJobs,
    getJob,
    retryJob,
    removeJob,
    promoteJob,
    getDLQJobs,
    retryFromDLQ,
    retryAllFromDLQ,
    clearDLQ,
  }
}
