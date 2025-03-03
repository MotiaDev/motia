import { JSONSchema7 } from 'json-schema'

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
}

// ducplicate of packages/core/src/flows-endpoint.ts
export type EdgeData = {
  variant: 'event' | 'virtual'
  label?: string
  labelVariant?: 'default' | 'conditional'
}
