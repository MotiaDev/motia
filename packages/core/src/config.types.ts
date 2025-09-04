import type { StepConfig } from './types'

export type StateConfig = {
  adapter: string
  host: string
  port: number
  password?: string
}

export type Config = {
  port: number
  state: StateConfig
}

export type Step<TConfig extends StepConfig = StepConfig> = {
  config: TConfig
  file: string
  filePath: string
}
