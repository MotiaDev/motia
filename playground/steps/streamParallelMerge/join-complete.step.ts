import type { Handlers, StepConfig, StreamTriggerInput } from '@iii-dev/motia'
import type { ParallelMergeStreamItem } from './parallel-merge.stream'

export const config = {
  name: 'stream-parallel-merge-join',
  description: 'Completes the stream parallel merge workflow when all steps are finished',
  triggers: [
    {
      type: 'stream',
      streamName: 'parallelMerge',
      groupId: 'merge-groups',
      condition: (input: StreamTriggerInput<ParallelMergeStreamItem>) => {
        return input.event.type === 'update' && input.event.data.completedSteps === input.event.data.totalSteps
      },
    },
  ],
  flows: ['stream-parallel-merge'],
} as const satisfies StepConfig

export const handler: Handlers<typeof config> = async (request, { logger }) => {
  logger.info('[stream-join-complete] Handling Stream Join Complete', { request })

  const endTime = Date.now()
  const result = request.event.data as ParallelMergeStreamItem
  const traceId = request.id

  await new Promise((resolve) => setTimeout(resolve, 500))

  console.log('░█████████     ░███    ░█████████     ░███    ░██         ░██         ░██████████ ░██            ')
  console.log('░██     ░██   ░██░██   ░██     ░██   ░██░██   ░██         ░██         ░██         ░██            ')
  console.log('░██     ░██  ░██  ░██  ░██     ░██  ░██  ░██  ░██         ░██         ░██         ░██            ')
  console.log('░█████████  ░█████████ ░█████████  ░█████████ ░██         ░██         ░█████████  ░██            ')
  console.log('░██         ░██    ░██ ░██   ░██   ░██    ░██ ░██         ░██         ░██         ░██            ')
  console.log('░██         ░██    ░██ ░██    ░██  ░██    ░██ ░██         ░██         ░██         ░██            ')
  console.log('░██         ░██    ░██ ░██     ░██ ░██    ░██ ░██████████ ░██████████ ░██████████ ░██████████    ')
  console.log('                                                                                                 ')
  console.log('                                                                                                 ')
  console.log('                                                                                                 ')
  console.log('                                 ░███     ░███ ░██████████ ░█████████    ░██████  ░██████████    ')
  console.log('                                 ░████   ░████ ░██         ░██     ░██  ░██   ░██ ░██            ')
  console.log('                                 ░██░██ ░██░██ ░██         ░██     ░██ ░██        ░██            ')
  console.log('                                 ░██ ░████ ░██ ░█████████  ░█████████  ░██  █████ ░█████████     ')
  console.log('                                 ░██  ░██  ░██ ░██         ░██   ░██   ░██     ██ ░██            ')
  console.log('                                 ░██       ░██ ░██         ░██    ░██   ░██  ░███ ░██            ')
  console.log('                                 ░██       ░██ ░██████████ ░██     ░██   ░█████░█ ░██████████  ')
  console.log('                                                                                                 ')
  console.log('                                                                                                 ')
  console.log(`Total # of steps: ${result.totalSteps}`)
  console.log(`Total time taken: ${endTime - result.startedAt}ms`)
  console.log(`Trace ID: ${traceId}`)
}
