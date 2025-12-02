import type { ApiHelpers } from './page-objects/ApiHelpers'

export type BullMQEmitOptions = {
  topic: 'bullmq.tests.standard' | 'bullmq.tests.retry' | 'bullmq.tests.delayed' | 'bullmq.tests.fifo'
  testCaseId: string
  payload?: Record<string, unknown>
  messageGroupId?: string
}

export type BullMQTestResult = {
  step?: string
  subscriber?: string
  eventTopic?: string
  payload?: Record<string, unknown>
  metadata?: {
    attempt?: number
    sequence?: number
    receivedTimestamp?: number
    [key: string]: unknown
  }
}

export const createBullMQTestCaseId = () =>
  `bullmq-${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 8)}`

export const resetBullMQTestCase = async (api: ApiHelpers, testCaseId: string) => {
  const response = await api.post('/bullmq-tests/reset', { testCaseId })
  if (!response.ok) {
    throw new Error(`Failed to reset BullMQ test case ${testCaseId}`)
  }
}

export const emitBullMQEvent = async (api: ApiHelpers, options: BullMQEmitOptions) => {
  const response = await api.post('/bullmq-tests/emit', options)
  if (!response.ok) {
    const errorText = await api.getResponseText(response)
    throw new Error(`Failed to emit BullMQ event: ${errorText}`)
  }
  return response
}

export const fetchBullMQResults = async (api: ApiHelpers, testCaseId: string) => {
  const response = await api.get(`/bullmq-tests/results/${testCaseId}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch BullMQ results for ${testCaseId}`)
  }

  const json = (await api.getResponseJson(response)) as { results?: unknown[] }
  return (json?.results ?? []) as BullMQTestResult[]
}

type WaitOptions = {
  timeoutMs?: number
  intervalMs?: number
}

export const waitForBullMQResults = async (
  api: ApiHelpers,
  testCaseId: string,
  predicate: (results: BullMQTestResult[]) => boolean,
  options: WaitOptions = {},
) => {
  const timeoutMs = options.timeoutMs ?? 20000
  const intervalMs = options.intervalMs ?? 500
  const start = Date.now()

  while (Date.now() - start < timeoutMs) {
    const results = await fetchBullMQResults(api, testCaseId)
    if (predicate(results)) {
      return results
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs))
  }

  throw new Error(`Timed out waiting for BullMQ results for ${testCaseId}`)
}
