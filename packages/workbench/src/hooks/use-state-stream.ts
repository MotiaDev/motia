import { useStreamGroup } from '@motiadev/stream-client-react'
import { StateItem } from '../components/states/hooks/states-hooks'

export interface StateStreamItem {
  id: string
  groupId: string
  key: string
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null'
  value: string | number | boolean | object | unknown[] | null
  timestamp: number
  operation: 'set' | 'delete' | 'clear'
  traceId?: string
}

export const useStateStream = () => {
  const { data: stateStreamItems, event } = useStreamGroup<StateStreamItem>({ 
    streamName: '__motia.state-stream', 
    groupId: 'default' 
  })

  // Convert stream items to StateItem format for compatibility
  const stateItems: StateItem[] = (stateStreamItems || []).map(item => ({
    groupId: item.groupId,
    key: item.key,
    type: item.type,
    value: item.value,
  }))

  return {
    stateItems,
    event,
    stateStreamItems,
  }
}
