import { hasApiTrigger, getTriggersByType } from '../guards'
import { LockedData } from '../locked-data'
import { ApiRouteMethod, Step } from '../types'
import { JsonSchema } from '../types/schema.types'
import { StreamAdapter } from './adapters/stream-adapter'

type QueryParam = {
  name: string
  description: string
}

type ApiEndpoint = {
  id: string
  method: ApiRouteMethod
  path: string
  description?: string
  queryParams?: QueryParam[]
  responseSchema?: JsonSchema
  bodySchema?: JsonSchema
}

const mapEndpoint = (step: Step): ApiEndpoint => {
  // Get the first API trigger (there should only be one per step)
  const apiTriggers = getTriggersByType(step, 'api')
  const apiTrigger = apiTriggers[0]

  if (!apiTrigger) {
    throw new Error(`Step ${step.config.name} has no API trigger`)
  }

  return {
    id: step.filePath,
    method: apiTrigger.method,
    path: apiTrigger.path,
    description: step.config.description,
    queryParams: step.config.queryParams,
    responseSchema: step.config.responseSchema as never as JsonSchema,
    bodySchema: step.config.input as never as JsonSchema, // Use 'input' instead of 'bodySchema'
  }
}

class ApiEndpointsStream extends StreamAdapter<ApiEndpoint> {
  constructor(private readonly lockedData: LockedData) {
    super()
  }

  async get(id: string): Promise<ApiEndpoint | null> {
    const endpoint = this.lockedData.stepsWithApiTriggers().find((step) => {
      const apiTriggers = getTriggersByType(step, 'api')
      return apiTriggers.some((trigger) => trigger.path === id)
    })
    return endpoint ? mapEndpoint(endpoint) : null
  }

  async delete(id: string): Promise<ApiEndpoint> {
    return { id } as never
  }

  async set(_: string, __: string, data: ApiEndpoint): Promise<ApiEndpoint> {
    return data
  }

  async getGroup(): Promise<ApiEndpoint[]> {
    return this.lockedData.stepsWithApiTriggers().map(mapEndpoint)
  }
}

export const apiEndpoints = (lockedData: LockedData) => {
  const stream = lockedData.createStream({
    filePath: '__motia.api-endpoints.ts',
    hidden: true,
    config: {
      name: '__motia.api-endpoints',
      baseConfig: { storageType: 'custom', factory: () => new ApiEndpointsStream(lockedData) },
      schema: null as never,
    },
  })()

  const apiStepCreated = (step: Step) => {
    if (hasApiTrigger(step)) {
      stream.set('default', step.filePath, mapEndpoint(step))
    }
  }

  const apiStepUpdated = (step: Step) => {
    if (hasApiTrigger(step)) {
      stream.set('default', step.filePath, mapEndpoint(step))
    }
  }

  const apiStepRemoved = (step: Step) => {
    if (hasApiTrigger(step)) {
      stream.delete('default', step.filePath)
    }
  }

  lockedData.onStep('step-created', apiStepCreated)
  lockedData.onStep('step-updated', apiStepUpdated)
  lockedData.onStep('step-removed', apiStepRemoved)
}
