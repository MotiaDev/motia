import type { Emit } from '../types'

export type FlowListResponse = { id: string; name: string }

export type EdgeData = {
  variant: 'event' | 'virtual'
  topic: string
  label?: string
  labelVariant?: 'default' | 'conditional'
}

export type FlowEdge = {
  id: string
  source: string
  target: string
  data: EdgeData
}

export type FlowStepResponse = {
  id: string
  name: string
  type: 'event' | 'api' | 'noop' | 'cron'
  description?: string
  subscribes?: string[]
  emits: Emit[]
  virtualEmits?: Emit[]
  action?: 'webhook'
  webhookUrl?: string
  bodySchema?: unknown
  language?: string
  nodeComponentPath?: string
  filePath?: string
  cronExpression?: string
}

export type FlowResponse = FlowListResponse & {
  steps: FlowStepResponse[]
  edges: FlowEdge[]
}
