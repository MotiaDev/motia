import type React from 'react'
import type { PropsWithChildren } from 'react'
import { BaseNode } from './base-node/base-node'
import type { EventNodeProps } from './node-props'

export const EventNode: React.FC<PropsWithChildren<EventNodeProps>> = ({ data, children }) => {
  return (
    <BaseNode
      data={data}
      variant="event"
      title={data.name}
      subtitle={data.description}
      language={data.language}
      disableSourceHandle={!data.emits?.length && !data.virtualEmits?.length}
      disableTargetHandle={!data.subscribes?.length && !data.virtualSubscribes?.length}
    >
      {children}
    </BaseNode>
  )
}
