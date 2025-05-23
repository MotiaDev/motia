import { Webhook } from 'lucide-react'
import { PropsWithChildren } from 'react'
import { BaseNode } from './base-node'
import { ApiNodeProps } from './node-props'
import { DetailItem, NodeDetails } from './node-details'

type Props = PropsWithChildren<ApiNodeProps>

export const ApiNode = ({ data, children }: Props) => {
  return (
    <BaseNode
      variant="api"
      title={data.name}
      language={data.language}
      disableSourceHandle={!data.emits?.length && !data.virtualEmits?.length}
      disableTargetHandle={!data.subscribes?.length && !data.virtualSubscribes?.length}
    >
      {data.description && <div className="text-sm text-muted-foreground">{data.description}</div>}
      {children}
      {data.webhookUrl && (
        <div className="flex gap-1 items-center text-xs text-muted-foreground">
          <Webhook className="w-3 h-3 text-muted-foreground/40" />
          <div className="font-mono">{data.webhookUrl}</div>
        </div>
      )}

      <NodeDetails
        type="api"
        name={data.name}
        subscribes={data.subscribes}
        emits={data.emits}
        description={data.description}
        language={data.language}
      >
        <DetailItem label="Webhook URL">
          <div className="flex gap-1 items-center text-xs text-muted-foreground">
            <Webhook className="w-3 h-3 text-muted-foreground/40" />
            <div className="font-mono">{data.webhookUrl}</div>
          </div>
        </DetailItem>
      </NodeDetails>
    </BaseNode>
  )
}
