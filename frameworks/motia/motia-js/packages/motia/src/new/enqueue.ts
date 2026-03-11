import type { EnqueueData, Enqueuer } from '../types'
import { getInstance } from './iii'

export const enqueue: Enqueuer<EnqueueData> = async (queue: EnqueueData): Promise<void> => {
  return getInstance().call('enqueue', queue)
}
