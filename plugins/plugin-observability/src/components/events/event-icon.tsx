import MessageCircle from 'lucide-react/icons/message-circle'
import Package from 'lucide-react/icons/package'
import Radio from 'lucide-react/icons/radio'
import ScrollText from 'lucide-react/icons/scroll-text'
import type React from 'react'
import type { TraceEvent as TraceEventType } from '../../types/observability'

type Props = {
  event: TraceEventType
}

export const EventIcon: React.FC<Props> = ({ event }) => {
  if (event.type === 'log') {
    return <ScrollText className="w-4 h-4 text-muted-foreground" />
  } else if (event.type === 'emit') {
    return <MessageCircle className="w-4 h-4 text-muted-foreground" />
  } else if (event.type === 'state') {
    return <Package className="w-4 h-4 text-muted-foreground" />
  } else if (event.type === 'stream') {
    return <Radio className="w-4 h-4 text-muted-foreground" />
  }
}
