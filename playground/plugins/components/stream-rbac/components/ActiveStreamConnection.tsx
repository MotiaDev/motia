import { MotiaStreamProvider } from '@motiadev/stream-client-react'
import { memo, useMemo } from 'react'
import { useStreamRbacStore } from '../store'
import { StreamBridge } from './StreamBridge'

export const ActiveStreamConnection = memo(() => {
  const { activeConnection, streamName, authToken } = useStreamRbacStore()

  const protocols = useMemo(() => {
    return authToken ? ['Authorization', authToken] : undefined
  }, [authToken])

  if (!activeConnection) {
    return null
  }

  return (
    <MotiaStreamProvider address={activeConnection.address} protocols={protocols}>
      <StreamBridge streamName={streamName} groupId={activeConnection.groupId} />
    </MotiaStreamProvider>
  )
})

ActiveStreamConnection.displayName = 'ActiveStreamConnection'
