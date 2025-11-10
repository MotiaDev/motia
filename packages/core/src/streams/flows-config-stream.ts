import fs from 'fs'
import { StreamAdapter } from '../adapters/interfaces/stream-adapter.interface'
import type { FlowConfig } from '../types/flows-config-types'

export class FlowsConfigStream extends StreamAdapter<FlowConfig> {
  private config: FlowConfig[] = []

  constructor(private readonly configPath: string) {
    super('__motia.flows-config')
  }

  private getConfig(): FlowConfig[] {
    if (this.config.length === 0) {
      if (fs.existsSync(this.configPath)) {
        this.config = JSON.parse(fs.readFileSync(this.configPath, 'utf8') || '[]')
        if (!Array.isArray(this.config)) {
          this.config = []
          this.setConfig(this.config)
        }
      }
    }
    return this.config
  }

  private setConfig(config: FlowConfig[]) {
    this.config = config
    fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2), 'utf8')
  }

  async get(_: string, id: string) {
    const allFlowsConfig = this.getConfig()
    return allFlowsConfig.find((flow) => flow.id === id) || null
  }

  async delete(_: string): Promise<null> {
    return null
  }

  async set(_: string, id: string, data: FlowConfig): Promise<FlowConfig> {
    const existingConfig = this.getConfig()

    const updatedConfig = existingConfig.filter((item) => item.id !== id)
    updatedConfig.push(data)

    this.setConfig(updatedConfig)
    return data
  }

  async getGroup(): Promise<FlowConfig[]> {
    return this.getConfig()
  }
}
