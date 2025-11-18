import { Stream } from '@motiadev/stream-client-browser'
import { useLogsStore } from '../stores/use-logs-store'
import type { Log } from '../types/log'

const streamName = '__motia.logs'
const groupId = 'default'
const type = 'log'

export const initLogListener = () => {
  const stream = new Stream(window.location.origin.replace('http', 'ws'))
  const subscription = stream.subscribeGroup<Log>(streamName, groupId)
  const store = useLogsStore.getState()

  subscription.addChangeListener((logs) => {
    if (logs) {
      store.setLogs(logs)
    }
  })

  subscription.onEvent(type, store.addLog)
}
