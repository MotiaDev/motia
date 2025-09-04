import type React from 'react'
import type { StateEvent } from '@/types/observability'
import { FunctionCall } from './code/function-call'

export const TraceStateEvent: React.FC<{ event: StateEvent }> = ({ event }) => {
  return (
    <FunctionCall
      objectName="state"
      functionName={event.operation}
      args={[event.data.traceId, event.data.key, event.data.value ? false : undefined]}
    />
  )
}
