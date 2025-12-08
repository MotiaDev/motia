import path from 'path'
import * as z from 'zod'
import type { ApiRouteConfig, CronConfig, EventConfig, NoopConfig, Step } from '../../types'

export const createApiStep = (config: Partial<ApiRouteConfig> = {}, filePath?: string): Step<ApiRouteConfig> => ({
  config: {
    type: 'api',
    name: 'Start Event',
    description: 'Start the Motia Server Example flow',
    path: '/api/motia-server-example',
    method: 'POST',
    emits: ['ws-server-example.start'],
    flows: ['motia-server'],
    ...config,
  },
  version: '1',
  filePath: filePath ?? path.join(process.cwd(), '/playground/steps/motiaServerExample/startServerExample.step.ts'),
})

export const createEventStep = (config: Partial<EventConfig> = {}, filePath?: string): Step<EventConfig> => ({
  config: {
    type: 'event',
    name: 'Processor',
    subscribes: ['ws-server-example.start'],
    emits: ['ws-server-example.processed'],
    input: z.toJSONSchema(z.object({})) as never,
    flows: ['motia-server'],
    ...config,
  },
  version: '1',
  filePath: filePath ?? path.join(process.cwd(), '/playground/steps/motiaServerExample/processor.step.ts'),
})

export const createCronStep = (config: Partial<CronConfig> = {}, filePath?: string): Step<CronConfig> => ({
  config: {
    type: 'cron',
    name: 'Cron Job',
    cron: '* * * * *',
    emits: [],
    flows: ['motia-server'],
    ...config,
  },
  version: '1',
  filePath: filePath ?? path.join(process.cwd(), '/playground/steps/motiaServerExample/cronJob.step.ts'),
})

export const createNoopStep = (config: Partial<NoopConfig> = {}, filePath?: string): Step<NoopConfig> => ({
  config: {
    type: 'noop',
    name: 'Noop',
    virtualEmits: ['noop-event'],
    virtualSubscribes: ['noop-subscription'],
    flows: ['motia-server'],
    ...config,
  },
  version: '1',
  filePath: filePath ?? path.join(process.cwd(), '/playground/steps/motiaServerExample/noop.step.ts'),
})
