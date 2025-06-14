export interface FlowConfig {
  id: string
  config: {
    [filePath: string]: {
      x: number
      y: number
    }
  }
}
