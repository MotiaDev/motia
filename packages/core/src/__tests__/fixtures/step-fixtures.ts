import path from 'path'
import { z } from 'zod'
import zodToJsonSchema from 'zod-to-json-schema'
import { StepConfig, Step } from '../../types'

export const createApiStep = (config: Partial<StepConfig> = {}, filePath?: string): Step => ({
  config: {
    name: 'Start Event',
    description: 'Start the Motia Server Example flow',
    triggers: [
      {
        type: 'api',
        path: '/api/motia-server-example',
        method: 'POST',
      },
    ],
    path: '/api/motia-server-example',
    method: 'POST',
    emits: ['ws-server-example.start'],
    flows: ['motia-server'],
    ...config,
  },
  version: '1',
  filePath: filePath ?? path.join(process.cwd(), '/playground/steps/motiaServerExample/startServerExample.step.ts'),
})

export const createEventStep = (config: Partial<StepConfig> = {}, filePath?: string): Step => ({
  config: {
    name: 'Processor',
    triggers: [
      {
        type: 'event',
        topic: 'ws-server-example.start',
      },
    ],
    emits: ['ws-server-example.processed'],
    input: zodToJsonSchema(z.object({})) as never,
    flows: ['motia-server'],
    ...config,
  },
  version: '1',
  filePath: filePath ?? path.join(process.cwd(), '/playground/steps/motiaServerExample/processor.step.ts'),
})

export const createCronStep = (config: Partial<StepConfig> = {}, filePath?: string): Step => ({
  config: {
    name: 'Cron Job',
    triggers: [
      {
        type: 'cron',
        cron: '* * * * *',
      },
    ],
    cron: '* * * * *',
    emits: [],
    flows: ['motia-server'],
    ...config,
  },
  version: '1',
  filePath: filePath ?? path.join(process.cwd(), '/playground/steps/motiaServerExample/cronJob.step.ts'),
})

export const createNoopStep = (config: Partial<StepConfig> = {}, filePath?: string): Step => ({
  config: {
    name: 'Noop',
    triggers: [], // No triggers for noop steps
    virtualEmits: ['noop-event'],
    virtualSubscribes: ['noop-subscription'],
    flows: ['motia-server'],
    ...config,
  },
  version: '1',
  filePath: filePath ?? path.join(process.cwd(), '/playground/steps/motiaServerExample/noop.step.ts'),
})
