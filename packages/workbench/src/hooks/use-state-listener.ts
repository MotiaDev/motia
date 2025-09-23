import { useStatesStore } from '@/stores/use-states-store'
import { useStreamEventHandler, useStreamGroup } from '@motiadev/stream-client-react'

export const useStateListener = () => {
  const addStateItem = useStatesStore((state) => state.addStateItem)
  const { event } = useStreamGroup({ streamName: '__motia.state-stream', groupId: 'default' })

  useStreamEventHandler({ event, type: 'state-change', listener: addStateItem }, [addStateItem])
}
