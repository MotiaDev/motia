import type { Express } from 'express'
import type { LockedData } from './locked-data'
import type { LoggerFactory } from './logger-factory'
import type { TracerFactory } from './observability'
import type { Printer } from './printer'
import type { QueueManager } from './queue-manager'
import type { StateAdapter } from './state/state-adapter'
import type { ApiResponse, ApiRouteConfig, ApiRouteHandler, EventManager, InternalStateManager } from './types'

export type Motia = {
  loggerFactory: LoggerFactory
  eventManager: EventManager
  state: InternalStateManager
  lockedData: LockedData
  printer: Printer
  tracerFactory: TracerFactory

  app: Express
  stateAdapter: StateAdapter
}

export type PluginApiConfig = {
  method: ApiRouteConfig['method']
  path: string
}

export type UnregisterMotiaPluginApi = () => void

export type MotiaPluginContext = {
  state: StateAdapter
  lockedData: LockedData
  tracerFactory: TracerFactory
  registerApi: <
    TRequestBody = unknown,
    TResponseBody extends ApiResponse<number, unknown> = ApiResponse<number, unknown>,
    TEmitData = never,
  >(
    config: PluginApiConfig,
    handler: ApiRouteHandler<TRequestBody, TResponseBody, TEmitData>,
  ) => UnregisterMotiaPluginApi
}

export const PLUGIN_FLOW_ID = '_plugin'
