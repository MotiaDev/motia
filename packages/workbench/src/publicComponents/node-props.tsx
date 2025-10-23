import type { ApiNodeData, CronNodeData, EventNodeData, NoopNodeData } from '../types/flow'

export type NodeProps = EventNodeProps | NoopNodeProps | ApiNodeProps | CronNodeProps
export type BaseNodeProps = {
  id: string
  nodeConfig?: {
    sourceHandlePosition?: 'bottom' | 'right'
    targetHandlePosition?: 'top' | 'left'
  }
}

export type EventNodeProps = { data: BaseNodeProps & EventNodeData }
export type NoopNodeProps = { data: BaseNodeProps & NoopNodeData }
export type ApiNodeProps = { data: BaseNodeProps & ApiNodeData }
export type CronNodeProps = { data: BaseNodeProps & CronNodeData }
