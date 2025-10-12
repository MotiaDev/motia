import { Motia } from '../motia'

export type Runtime = {
  steps: string
  streams: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  runtime: any
}

export type WorkbenchPlugin = {
  packageName: string
  componentName?: string
  label?: string
  labelIcon?: string
  position?: 'bottom' | 'top'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props?: Record<string, any>
}

export type MotiaPlugin = {
  workbench: WorkbenchPlugin[]
}

export type MotiaPluginBuilder = (motia: Motia) => MotiaPlugin

export type StorageConfig = {
  provider: 's3'
}

export type Config = {
  runtimes?: Runtime[]
  plugins?: MotiaPluginBuilder[]
  storage?: StorageConfig
}
