import type { Express } from 'express'
import type { EventAdapter } from './adapters/interfaces/event-adapter.interface'
import type { TracerAdapter } from './adapters/interfaces/observability-adapter.interface'
import type { StateAdapter } from './adapters/interfaces/state-adapter.interface'
import type { LockedData } from './locked-data'
import type { LoggerFactory } from './logger-factory'
import type { Printer } from './printer'
import type { ApiResponse, ApiRouteConfig, ApiRouteHandler, InternalStateManager } from './types'

export type Motia = {
  loggerFactory: LoggerFactory
  eventAdapter: EventAdapter
  state: InternalStateManager
  lockedData: LockedData
  printer: Printer
  tracerFactory: TracerAdapter

  app: Express
  stateAdapter: StateAdapter
}

export type PluginApiConfig = {
  method: ApiRouteConfig['method']
  path: string
}

export type UnregisterMotiaPluginApi = () => void

export type MotiaPluginContext = {
  printer: Printer
  state: StateAdapter
  lockedData: LockedData
  tracerFactory: TracerAdapter
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
