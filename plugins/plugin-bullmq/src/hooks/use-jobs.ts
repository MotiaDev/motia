import { useCallback, useEffect } from 'react'
import { useBullMQStore } from '../stores/use-bullmq-store'
import type { DLQJobInfo, JobInfo, JobStatus } from '../types/queue'

export const useJobs = () => {
  const { jobs, selectedQueue, selectedStatus, setJobs, setLoading, setError, isLoading, error } = useBullMQStore()

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
        if (selectedQueue) {
          await fetchJobs(selectedQueue.name, selectedStatus)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to retry job')
      }
    },
    [selectedQueue, selectedStatus, fetchJobs, setError],
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
        if (selectedQueue) {
          await fetchJobs(selectedQueue.name, selectedStatus)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to remove job')
      }
    },
    [selectedQueue, selectedStatus, fetchJobs, setError],
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
        if (selectedQueue) {
          await fetchJobs(selectedQueue.name, selectedStatus)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to promote job')
      }
    },
    [selectedQueue, selectedStatus, fetchJobs, setError],
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

  useEffect(() => {
    if (selectedQueue) {
      fetchJobs(selectedQueue.name, selectedStatus)
    }
  }, [selectedQueue, selectedStatus, fetchJobs])

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
