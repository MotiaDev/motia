import { PropsWithChildren } from 'react'
import { BaseNode } from './base-node/base-node'
import { ApiNodeProps } from './node-props'

type Props = PropsWithChildren<ApiNodeProps>

export const ApiNode = ({ data, children }: Props) => {
  return (
    <BaseNode
      data={data}
      variant="api"
      title={data.name}
      language={data.language}
      subtitle={data.description}
      disableSourceHandle={!data.emits?.length && !data.virtualEmits?.length}
      disableTargetHandle={!data.subscribes?.length && !data.virtualSubscribes?.length}
    >
      {data.webhookUrl && (
        <div className="flex gap-1 items-center text-muted-foreground">
          <div className="font-mono">{data.webhookUrl}</div>
        </div>
      )}
      {children}
    </BaseNode>
  )
}
