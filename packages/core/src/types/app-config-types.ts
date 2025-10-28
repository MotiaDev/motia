import type { CronAdapter } from '../adapters/cron-adapter'
import type { EventAdapter } from '../adapters/event-adapter'
import type { ObservabilityAdapter } from '../adapters/observability-adapter'
import type { MotiaPluginContext } from '../motia'
import type { StateAdapter } from '../state/state-adapter'
import type { StreamAdapter } from '../streams/adapters/stream-adapter'

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
  streams?: StreamAdapter<any>
  events?: EventAdapter
  cron?: CronAdapter
  observability?: ObservabilityAdapter
}

export type Config = {
  plugins?: MotiaPluginBuilder[]
  adapters?: AdapterConfig
}
