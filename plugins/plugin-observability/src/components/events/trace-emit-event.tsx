import type React from 'react'
import type { EmitEvent } from '../../types/observability'
import { FunctionCall } from './code/function-call'

export const TraceEmitEvent: React.FC<{ event: EmitEvent }> = ({ event }) => {
  return <FunctionCall functionName="emit" args={[{ topic: event.topic, data: event.data }]} />
}
