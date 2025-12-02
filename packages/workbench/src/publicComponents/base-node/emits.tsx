import type React from 'react'
import type { EventNodeData } from '../../types/flow'

const toTopic = (emit: string | { topic: string; label?: string; conditional?: boolean }) =>
  typeof emit === 'string' ? emit : emit.topic

export const Emits: React.FC<{ emits: EventNodeData['emits'] }> = ({ emits }) => {
  return (
    <div className="flex flex-col gap-2">
      {emits.map((emit) => (
        <div key={toTopic(emit)} data-testid={`emits__${toTopic(emit)}`}>
          {toTopic(emit)}
        </div>
      ))}
    </div>
  )
}
