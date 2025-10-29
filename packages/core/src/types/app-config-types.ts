import type { CronAdapter } from '../adapters/interfaces/cron-adapter.interface'
import type { EventAdapter } from '../adapters/interfaces/event-adapter.interface'
import type { ObservabilityAdapter } from '../adapters/interfaces/observability-adapter.interface'
import type { StateAdapter } from '../adapters/interfaces/state-adapter.interface'
import type { StreamAdapter } from '../adapters/interfaces/stream-adapter.interface'
import type { MotiaPluginContext } from '../motia'

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

export type StreamAdapterFactory = <TData>(streamName: string) => StreamAdapter<TData>

export type AdapterConfig = {
  state?: StateAdapter
  streams?: StreamAdapterFactory
  events?: EventAdapter
  cron?: CronAdapter
}

export type Config = {
  plugins?: MotiaPluginBuilder[]
  adapters?: AdapterConfig
}
