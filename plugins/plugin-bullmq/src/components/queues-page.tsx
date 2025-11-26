import { memo, useEffect } from 'react'
import { useQueues } from '../hooks/use-queues'
import { useBullMQStore } from '../stores/use-bullmq-store'
import { DLQPanel } from './dlq-panel'
import { JobDetail } from './job-detail'
import { QueueDetail } from './queue-detail'
import { QueueList } from './queue-list'

export const QueuesPage = memo(() => {
  const selectedQueue = useBullMQStore((state) => state.selectedQueue)
  const updateSelectedQueueStats = useBullMQStore((state) => state.updateSelectedQueueStats)
  const { queues } = useQueues()

  useEffect(() => {
    if (selectedQueue) {
      const updatedQueue = queues.find((q) => q.name === selectedQueue.name)
      if (updatedQueue) {
        updateSelectedQueueStats(updatedQueue)
      }
    }
  }, [queues, selectedQueue, updateSelectedQueueStats])

  return (
    <div className="grid grid-cols-[300px_1fr] h-full overflow-hidden">
      <div className="border-r border-border overflow-hidden">
        <QueueList />
      </div>
      <div className="overflow-hidden">{selectedQueue?.isDLQ ? <DLQPanel /> : <QueueDetail />}</div>
      <JobDetail />
    </div>
  )
})
QueuesPage.displayName = 'QueuesPage'
