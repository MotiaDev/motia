import type { Express } from 'express'
import type { z } from 'zod'
import type { CronAdapter } from '../adapters/interfaces/cron-adapter.interface'
import type { EventAdapter } from '../adapters/interfaces/event-adapter.interface'
import type { StateAdapter } from '../adapters/interfaces/state-adapter.interface'
import type { StreamAdapterManager } from '../adapters/interfaces/stream-adapter-manager.interface'
import type { MotiaPluginContext } from '../motia'
import type { JsonSchema } from './schema.types'

export type WorkbenchPlugin = {
  packageName: string
  componentName?: string
  label?: string
  labelIcon?: string
  position?: 'bottom' | 'top'
  cssImports?: string[]

  props?: Record<string, any>
}

export type MotiaPlugin = {
  workbench: WorkbenchPlugin[]
  dirname?: string
  steps?: string[]
}

export type MotiaPluginBuilder = (motia: MotiaPluginContext) => MotiaPlugin

export type AdapterConfig = {
  state?: StateAdapter
  streams?: StreamAdapterManager
  events?: EventAdapter
  cron?: CronAdapter
}

export type StreamAuthRequest = {
  headers: Record<string, string | string[] | undefined>
  url?: string
}

export type StreamAuthConfig<TSchema extends z.ZodTypeAny = z.ZodTypeAny> = {
  contextSchema: JsonSchema
  authenticate: (request: StreamAuthRequest) => Promise<z.infer<TSchema> | null> | (z.infer<TSchema> | null)
}

export type Config = {
  app?: (app: Express) => void
  plugins?: MotiaPluginBuilder[]
  adapters?: AdapterConfig
  streamAuth?: StreamAuthConfig
}
