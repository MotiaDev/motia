import type React from 'react'
import type { StreamEvent } from '@/types/observability'
import { FunctionCall } from './code/function-call'

export const TraceStreamEvent: React.FC<{ event: StreamEvent }> = ({ event }) => {
  return (
    <FunctionCall
      topLevelClassName="streams"
      objectName={event.streamName}
      functionName={event.operation}
      args={[event.data.groupId, event.data.id, event.data.data ? false : undefined]}
      callsQuantity={event.calls}
    />
  )
}
