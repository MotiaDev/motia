import { Stream } from '@motiadev/stream-client-browser'
import { useLogsStore } from '../stores/use-logs-store'
import type { Log } from '../types/log'

const streamName = '__motia.logs'
const groupId = 'default'

export const initLogListener = () => {
  const stream = new Stream(window.location.origin.replace('http', 'ws'))
  const subscription = stream.subscribeGroup<Log>(streamName, groupId)
  const store = useLogsStore.getState()
  let previousLogs: Log[] = []

  subscription.addChangeListener((logs) => {
    if (!logs) {
      return
    }

    const newLogs = logs.filter((log) => !previousLogs.find((prevLog) => prevLog.id === log.id))

    newLogs.forEach((log) => {
      store.addLog(log)
    })

    previousLogs = logs
  })
}
