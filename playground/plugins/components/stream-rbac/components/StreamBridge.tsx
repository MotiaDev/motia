import { memo } from 'react'
import { useStreamConnection } from '../hooks'

type StreamBridgeProps = {
  streamName: string
  groupId: string
}

export const StreamBridge = memo(({ streamName, groupId }: StreamBridgeProps) => {
  useStreamConnection({ streamName, groupId })
  return null
})

StreamBridge.displayName = 'StreamBridge'
