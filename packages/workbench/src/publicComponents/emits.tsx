import { Send } from 'lucide-react'
import { EventNodeData } from '../views/flow/nodes/nodes.types'
import React from 'react'

const toTopic = (emit: string | { topic: string; label?: string; conditional?: boolean }) =>
  typeof emit === 'string' ? emit : emit.topic

export const Emits: React.FC<{ emits: EventNodeData['emits'] }> = ({ emits }) => {
  return (
    <>
      {emits.map((emit) => (
        <div
          key={toTopic(emit)}
          className="flex gap-2 items-center text-xs text-muted-foreground"
          data-testid={`emits__${toTopic(emit)}`}
        >
          <Send className="w-4 h-4 text-muted-foreground/60" />
          <div className="font-mono tracking-wider">{toTopic(emit)}</div>
        </div>
      ))}
    </>
  )
}
