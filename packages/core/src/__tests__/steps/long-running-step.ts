import { EventConfig } from '../../types'

export const config: EventConfig = {
  type: 'event',
  name: 'LongRunningStep',
  description: 'A step that takes a long time to execute',
  subscribes: ['test'],
  emits: [],
  input: {} as any,
  flows: ['test'],
}

export const handler = async () => {
  await new Promise((resolve) => setTimeout(resolve, 5000))
}
