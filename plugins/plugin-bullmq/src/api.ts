import type { ApiRequest, ApiResponse, MotiaPluginContext } from '@motiadev/core'
import { JobService } from './services/job-service'
import { QueueService } from './services/queue-service'
import type { CleanOptions, JobStatus } from './types/queue'

let queueService: QueueService | null = null
let jobService: JobService | null = null

const getConfig = () => {
  const host = process.env.BULLMQ_REDIS_HOST || process.env.REDIS_HOST || 'localhost'
  const port = parseInt(process.env.BULLMQ_REDIS_PORT || process.env.REDIS_PORT || '6379', 10)
  const password = process.env.BULLMQ_REDIS_PASSWORD || process.env.REDIS_PASSWORD || undefined
  const prefix = process.env.BULLMQ_PREFIX || 'motia:events'
  const dlqSuffix = process.env.BULLMQ_DLQ_SUFFIX || '.dlq'

  return { host, port, password, prefix, dlqSuffix }
}

const getQueueService = (): QueueService => {
  if (!queueService) {
    const config = getConfig()
    queueService = new QueueService(
      { host: config.host, port: config.port, password: config.password, maxRetriesPerRequest: null },
      config.prefix,
      config.dlqSuffix,
    )
  }
  return queueService
}

const getJobService = (): JobService => {
  if (!jobService) {
    const config = getConfig()
    jobService = new JobService(
      { host: config.host, port: config.port, password: config.password, maxRetriesPerRequest: null },
      config.prefix,
      config.dlqSuffix,
    )
  }
  return jobService
}

export const api = ({ registerApi }: MotiaPluginContext): void => {
  registerApi({ method: 'GET', path: '/__motia/bullmq/queues' }, async (): Promise<ApiResponse> => {
    try {
      const queues = await getQueueService().getAllQueues()
      return { status: 200, body: { queues } }
    } catch (error) {
      return { status: 500, body: { error: error instanceof Error ? error.message : 'Unknown error' } }
    }
  })

  registerApi(
    { method: 'GET', path: '/__motia/bullmq/queues/:name' },
    async (req: ApiRequest): Promise<ApiResponse> => {
      try {
        const name = req.pathParams.name as string
        const queue = await getQueueService().getQueueInfo(name)
        return { status: 200, body: queue }
      } catch (error) {
        return { status: 500, body: { error: error instanceof Error ? error.message : 'Unknown error' } }
      }
    },
  )

  registerApi(
    { method: 'POST', path: '/__motia/bullmq/queues/:name/pause' },
    async (req: ApiRequest): Promise<ApiResponse> => {
      try {
        const name = req.pathParams.name as string
        await getQueueService().pauseQueue(name)
        return { status: 200, body: { message: 'Queue paused' } }
      } catch (error) {
        return { status: 500, body: { error: error instanceof Error ? error.message : 'Unknown error' } }
      }
    },
  )

  registerApi(
    { method: 'POST', path: '/__motia/bullmq/queues/:name/resume' },
    async (req: ApiRequest): Promise<ApiResponse> => {
      try {
        const name = req.pathParams.name as string
        await getQueueService().resumeQueue(name)
        return { status: 200, body: { message: 'Queue resumed' } }
      } catch (error) {
        return { status: 500, body: { error: error instanceof Error ? error.message : 'Unknown error' } }
      }
    },
  )

  registerApi(
    { method: 'POST', path: '/__motia/bullmq/queues/:name/clean' },
    async (req: ApiRequest): Promise<ApiResponse> => {
      try {
        const name = req.pathParams.name as string
        const body = req.body as Partial<CleanOptions>
        const options: CleanOptions = {
          grace: body.grace ?? 0,
          limit: body.limit ?? 1000,
          status: body.status ?? 'completed',
        }
        const deletedIds = await getQueueService().cleanQueue(name, options)
        return { status: 200, body: { deleted: deletedIds.length, ids: deletedIds } }
      } catch (error) {
        return { status: 500, body: { error: error instanceof Error ? error.message : 'Unknown error' } }
      }
    },
  )

  registerApi(
    { method: 'POST', path: '/__motia/bullmq/queues/:name/drain' },
    async (req: ApiRequest): Promise<ApiResponse> => {
      try {
        const name = req.pathParams.name as string
        await getQueueService().drainQueue(name)
        return { status: 200, body: { message: 'Queue drained' } }
      } catch (error) {
        return { status: 500, body: { error: error instanceof Error ? error.message : 'Unknown error' } }
      }
    },
  )

  registerApi(
    { method: 'GET', path: '/__motia/bullmq/queues/:name/jobs' },
    async (req: ApiRequest): Promise<ApiResponse> => {
      try {
        const name = req.pathParams.name as string
        const status = (req.queryParams.status as JobStatus) || 'waiting'
        const start = parseInt(req.queryParams.start as string, 10) || 0
        const end = parseInt(req.queryParams.end as string, 10) || 100
        const jobs = await getJobService().getJobs(name, status, start, end)
        return { status: 200, body: { jobs } }
      } catch (error) {
        return { status: 500, body: { error: error instanceof Error ? error.message : 'Unknown error' } }
      }
    },
  )

  registerApi(
    { method: 'GET', path: '/__motia/bullmq/queues/:queueName/jobs/:jobId' },
    async (req: ApiRequest): Promise<ApiResponse> => {
      try {
        const queueName = req.pathParams.queueName as string
        const jobId = req.pathParams.jobId as string
        const job = await getJobService().getJob(queueName, jobId)
        if (!job) {
          return { status: 404, body: { error: 'Job not found' } }
        }
        return { status: 200, body: job }
      } catch (error) {
        return { status: 500, body: { error: error instanceof Error ? error.message : 'Unknown error' } }
      }
    },
  )

  registerApi(
    { method: 'POST', path: '/__motia/bullmq/queues/:queueName/jobs/:jobId/retry' },
    async (req: ApiRequest): Promise<ApiResponse> => {
      try {
        const queueName = req.pathParams.queueName as string
        const jobId = req.pathParams.jobId as string
        await getJobService().retryJob(queueName, jobId)
        return { status: 200, body: { message: 'Job retried' } }
      } catch (error) {
        return { status: 500, body: { error: error instanceof Error ? error.message : 'Unknown error' } }
      }
    },
  )

  registerApi(
    { method: 'POST', path: '/__motia/bullmq/queues/:queueName/jobs/:jobId/remove' },
    async (req: ApiRequest): Promise<ApiResponse> => {
      try {
        const queueName = req.pathParams.queueName as string
        const jobId = req.pathParams.jobId as string
        await getJobService().removeJob(queueName, jobId)
        return { status: 200, body: { message: 'Job removed' } }
      } catch (error) {
        return { status: 500, body: { error: error instanceof Error ? error.message : 'Unknown error' } }
      }
    },
  )

  registerApi(
    { method: 'POST', path: '/__motia/bullmq/queues/:queueName/jobs/:jobId/promote' },
    async (req: ApiRequest): Promise<ApiResponse> => {
      try {
        const queueName = req.pathParams.queueName as string
        const jobId = req.pathParams.jobId as string
        await getJobService().promoteJob(queueName, jobId)
        return { status: 200, body: { message: 'Job promoted' } }
      } catch (error) {
        return { status: 500, body: { error: error instanceof Error ? error.message : 'Unknown error' } }
      }
    },
  )

  registerApi(
    { method: 'GET', path: '/__motia/bullmq/dlq/:name/jobs' },
    async (req: ApiRequest): Promise<ApiResponse> => {
      try {
        const name = req.pathParams.name as string
        const start = parseInt(req.queryParams.start as string, 10) || 0
        const end = parseInt(req.queryParams.end as string, 10) || 100
        const jobs = await getJobService().getDLQJobs(name, start, end)
        return { status: 200, body: { jobs } }
      } catch (error) {
        return { status: 500, body: { error: error instanceof Error ? error.message : 'Unknown error' } }
      }
    },
  )

  registerApi(
    { method: 'POST', path: '/__motia/bullmq/dlq/:name/retry/:jobId' },
    async (req: ApiRequest): Promise<ApiResponse> => {
      try {
        const name = req.pathParams.name as string
        const jobId = req.pathParams.jobId as string
        await getJobService().retryFromDLQ(name, jobId)
        return { status: 200, body: { message: 'Job retried from DLQ' } }
      } catch (error) {
        return { status: 500, body: { error: error instanceof Error ? error.message : 'Unknown error' } }
      }
    },
  )

  registerApi(
    { method: 'POST', path: '/__motia/bullmq/dlq/:name/retry-all' },
    async (req: ApiRequest): Promise<ApiResponse> => {
      try {
        const name = req.pathParams.name as string
        const count = await getJobService().retryAllFromDLQ(name)
        return { status: 200, body: { message: `Retried ${count} jobs from DLQ`, count } }
      } catch (error) {
        return { status: 500, body: { error: error instanceof Error ? error.message : 'Unknown error' } }
      }
    },
  )

  registerApi(
    { method: 'POST', path: '/__motia/bullmq/dlq/:name/clear' },
    async (req: ApiRequest): Promise<ApiResponse> => {
      try {
        const name = req.pathParams.name as string
        await getJobService().clearDLQ(name)
        return { status: 200, body: { message: 'DLQ cleared' } }
      } catch (error) {
        return { status: 500, body: { error: error instanceof Error ? error.message : 'Unknown error' } }
      }
    },
  )
}
