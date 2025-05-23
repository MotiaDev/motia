import { BaseNode } from './base-node'
import { CronNodeProps } from './node-props'
import { Clock } from 'lucide-react'
import { NodeDetails, DetailItem } from './node-details'

export const CronNode = ({ data }: CronNodeProps) => {
  return (
    <BaseNode
      variant="cron"
      title={data.name}
      language={data.language}
      headerChildren={<Clock className="w-4 h-4 text-purple-400" />}
      disableTargetHandle={!data.virtualSubscribes?.length}
      disableSourceHandle={!data.virtualEmits?.length && !data.emits?.length}
    >
      <div className="text-sm text-muted-foreground">{data.description}</div>
      <div className="text-xs text-muted-foreground flex items-center gap-2">
        <Clock className="w-3 h-3" /> {data.cronExpression}
      </div>

      <NodeDetails type="cron" name={data.name} description={data.description} language={data.language}>
        <DetailItem label="Cron Expression">
          <div className="flex gap-1 items-center text-xs text-muted-foreground">
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <Clock className="w-3 h-3" /> {data.cronExpression}
            </div>
          </div>
        </DetailItem>
      </NodeDetails>
    </BaseNode>
  )
}
