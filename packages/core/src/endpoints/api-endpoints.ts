import { isApiStep } from '../guards'
import { LockedData } from '../locked-data'
import { ApiRouteConfig, ApiRouteMethod, Step } from '../types'
import { JsonSchema } from '../types/schema.types'
import { StreamAdapter } from '../streams/adapters/stream-adapter'

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
  flows?: string[]
}

const mapEndpoint = (step: Step<ApiRouteConfig>): ApiEndpoint => {
  return {
    id: step.filePath,
    method: step.config.method,
    path: step.config.path,
    description: step.config.description,
    queryParams: step.config.queryParams,
    responseSchema: step.config.responseSchema as never as JsonSchema,
    bodySchema: step.config.bodySchema as never as JsonSchema,
    flows: step.config.flows,
  }
}

class ApiEndpointsStream extends StreamAdapter<ApiEndpoint> {
  constructor(private readonly lockedData: LockedData) {
    super()
  }

  async get(_groupId: string, id: string): Promise<ApiEndpoint | null> {
    const endpoint = this.lockedData.apiSteps().find((step) => step.filePath === id)
    return endpoint ? mapEndpoint(endpoint) : null
  }

  async delete(id: string): Promise<ApiEndpoint> {
    return { id } as never
  }

  async set(_: string, __: string, data: ApiEndpoint): Promise<ApiEndpoint> {
    return data
  }

  async getGroup(): Promise<ApiEndpoint[]> {
    return this.lockedData.apiSteps().map(mapEndpoint)
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
    if (isApiStep(step)) {
      stream.set('default', step.filePath, {
        id: step.filePath,
        method: step.config.method,
        path: step.config.path,
        description: step.config.description,
        queryParams: step.config.queryParams,
      })
    }
  }

  const apiStepUpdated = (step: Step) => {
    if (isApiStep(step)) {
      stream.set('default', step.filePath, mapEndpoint(step))
    }
  }

  const apiStepRemoved = (step: Step) => {
    if (isApiStep(step)) {
      stream.delete('default', step.filePath)
    }
  }

  lockedData.onStep('step-created', apiStepCreated)
  lockedData.onStep('step-updated', apiStepUpdated)
  lockedData.onStep('step-removed', apiStepRemoved)
}
