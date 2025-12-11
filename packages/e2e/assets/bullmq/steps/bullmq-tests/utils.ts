import type { StateAdapter } from 'motia'

type Result = {
  testCaseId: string
  step: string
  eventTopic: string
  subscriber?: string
  payload?: unknown
  recordedAt: string
  metadata?: Record<string, unknown>
}

const id = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
const resultGroup = (testCaseId: string) => `bullmq-test-results:${testCaseId}`
const attemptGroup = (testCaseId: string) => `bullmq-test-attempts:${testCaseId}`

export const recordResult = async (
  state: StateAdapter,
  testCaseId: string,
  result: Omit<Result, 'testCaseId' | 'recordedAt'> & { recordedAt?: string },
) => {
  await state.set(resultGroup(testCaseId), id(), {
    ...result,
    testCaseId,
    recordedAt: result.recordedAt ?? new Date().toISOString(),
  })
}

export const listResults = async (state: StateAdapter, testCaseId: string) => {
  return state.getGroup<Result>(resultGroup(testCaseId))
}

export const clearResults = async (state: StateAdapter, testCaseId: string) => {
  await state.clear(resultGroup(testCaseId))
}

export const incrementAttempts = async (state: StateAdapter, testCaseId: string) => {
  const group = attemptGroup(testCaseId)
  const current = ((await state.get<number>(group, 'attempts')) ?? 0) + 1
  await state.set(group, 'attempts', current)
  return current
}

export const resetAttempts = async (state: StateAdapter, testCaseId: string) => {
  await state.clear(attemptGroup(testCaseId))
}
