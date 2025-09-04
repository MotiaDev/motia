import type { JSONSchema7 } from 'json-schema'

export type EventNodeData = {
  type: string
  name: string
  description?: string
  subscribes: string[]
  emits: Array<string | { topic: string; label?: string }>
  virtualEmits?: Array<string | { topic: string; label?: string }>
  virtualSubscribes?: string[]
  language?: string
}

export type NoopNodeData = {
  type: string
  name: string
  description?: string
  virtualEmits: string[]
  subscribes: string[]
}

export type ApiNodeData = {
  type: string
  name: string
  language?: string
  description?: string
  emits: Array<string | { topic: string; label?: string }>
  subscribes?: string[]
  virtualEmits?: Array<string | { topic: string; label?: string }>
  virtualSubscribes?: string[]
  webhookUrl?: string
  bodySchema?: JSONSchema7
}

export type CronNodeData = {
  type: string
  name: string
  description?: string
  emits: Array<string | { topic: string; label?: string }>
  virtualEmits?: Array<string | { topic: string; label?: string }>
  virtualSubscribes?: string[]
  cronExpression: string
  language?: string
}
export type NodeData = (EventNodeData | ApiNodeData | NoopNodeData | CronNodeData) & {
  position?: { x: number; y: number }
  filePath?: string
  nodeConfig?: {
    sourceHandlePosition?: 'bottom' | 'right'
    targetHandlePosition?: 'top' | 'left'
  }
}

// ducplicate of packages/core/src/flows-endpoint.ts
export type EdgeData = {
  variant: 'event' | 'virtual'
  label?: string
  labelVariant?: 'default' | 'conditional'
}

export type Emit = string | { topic: string; label?: string }

export type FlowStep = {
  id: string
  name: string
  type: 'event' | 'api' | 'noop' | 'cron'
  description?: string
  subscribes?: string[]
  emits: Emit[]
  virtualEmits?: Emit[]
  action?: 'webhook'
  webhookUrl?: string
  language?: string
  nodeComponentPath?: string
  filePath?: string
}

export type FlowResponse = {
  id: string
  name: string
  steps: FlowStep[]
  edges: FlowEdge[]
  error?: string
}

export type FlowConfigResponse = {
  id: string
  config: Record<string, NodeConfig>
}

export type FlowEdge = {
  id: string
  source: string
  target: string
  data: EdgeData
}

export type NodeConfig = {
  x: number
  y: number
  sourceHandlePosition?: 'bottom' | 'right'
  targetHandlePosition?: 'top' | 'left'
}
