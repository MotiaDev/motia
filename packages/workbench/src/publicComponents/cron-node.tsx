import React, { PropsWithChildren } from 'react'
import { Clock } from 'lucide-react'
import { BaseNode } from './base-node/base-node'
import { CronNodeProps } from './node-props'

export const CronNode: React.FC<PropsWithChildren<CronNodeProps>> = ({ data, children }) => {
  return (
    <BaseNode
      data={data}
      variant="cron"
      title={data.name}
      subtitle={data.description}
      language={data.language}
      disableTargetHandle={!data.virtualSubscribes?.length}
      disableSourceHandle={!data.virtualEmits?.length && !data.emits?.length}
      emits={data.emits}
      subscribes={data.virtualSubscribes}
    >
      <div className="text-xs text-muted-foreground flex items-center gap-2">
        <Clock className="w-3 h-3" /> {data.cronExpression}
      </div>
      {children}
    </BaseNode>
  )
}
