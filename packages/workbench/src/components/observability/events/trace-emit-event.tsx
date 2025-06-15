import React from 'react'
import { EmitEvent } from '@/types/observability'
import { FunctionCall } from './code/function-call'

export const TraceEmitEvent: React.FC<{ event: EmitEvent }> = ({ event }) => {
  return <FunctionCall functionName="emit" args={[{ topic: event.topic, data: false }]} />
}
