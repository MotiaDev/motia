import { useLogsStore } from '@/stores/use-logs-store'
import { useStreamEventHandler, useStreamGroup } from '@motiadev/stream-client-react'

export const useLogListener = () => {
  const addLog = useLogsStore((state) => state.addLog)
  const { event } = useStreamGroup({ streamName: '__motia.logs', groupId: 'default' })

  useStreamEventHandler({ event, type: 'log', listener: addLog }, [addLog])
}
