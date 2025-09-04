import type React from 'react'
import type { PropsWithChildren } from 'react'
import { BaseNode } from './base-node/base-node'
import type { NoopNodeProps } from './node-props'

export const NoopNode: React.FC<PropsWithChildren<NoopNodeProps>> = ({ data, children }) => {
  return (
    <BaseNode
      data={data}
      variant="noop"
      title={data.name}
      subtitle={data.description}
      disableSourceHandle={!data.virtualEmits.length}
      disableTargetHandle={!data.subscribes?.length}
    >
      {children}
    </BaseNode>
  )
}
