import { Stream } from '@motiadev/stream-client-browser'
import { useLogsStore } from '../stores/use-logs-store'

const streamName = '__motia.logs'
const groupId = 'default'
const type = 'log'

export const initLogListener = () => {
  const stream = new Stream(window.location.origin.replace('http', 'ws'))
  const subscription = stream.subscribeGroup(streamName, groupId)

  subscription.onEvent(type, useLogsStore.getState().addLog)
}
