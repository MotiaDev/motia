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

export type Config = {
  plugins?: MotiaPluginBuilder[]
}
