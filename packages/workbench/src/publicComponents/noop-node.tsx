import { PropsWithChildren } from 'react'
import { NoopNodeData } from '../views/flow/nodes/nodes.types'
import { BaseNode } from './base-node'

type Props = PropsWithChildren<{
  data: NoopNodeData
}>

export const NoopNode = ({ data, children }: Props) => {
  return (
    <BaseNode
      variant="noop"
      title={data.name}
      disableSourceHandle={!data.virtualEmits.length}
      disableTargetHandle={!data.subscribes?.length}
    >
      {data.description && <div className="text-sm max-w-[300px] text-muted-foreground">{data.description}</div>}
      {children}
    </BaseNode>
  )
}
