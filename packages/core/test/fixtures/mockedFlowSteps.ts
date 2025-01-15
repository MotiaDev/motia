import { z } from 'zod'
import { Step } from '../../src/types'

export const mockFlowSteps: Step[] = [
  {
    config: {
      type: 'api',
      name: 'Start Event',
      description: 'Start the Wistro Server Example flow',
      path: '/api/wistro-server-example',
      method: 'POST',
      emits: ['ws-server-example.start'],
      flows: ['wistro-server'],
    },
    version: '1',
    filePath: '/playground/steps/wistroServerExample/startServerExample.step.ts',
  },
  {
    config: {
      type: 'event',
      name: 'Processor',
      subscribes: ['ws-server-example.start'],
      emits: ['ws-server-example.processed'],
      input: z.object({}),
      flows: ['wistro-server'],
    },
    version: '1',
    filePath: '/playground/steps/wistroServerExample/processor.step.ts',
  },
  {
    config: {
      type: 'event',
      name: 'Finalizer',
      subscribes: ['ws-server-example.processed'],
      emits: [],
      input: z.object({}),
      flows: ['wistro-server'],
    },
    version: '1',
    filePath: '/playground/steps/wistroServerExample/finalizer.step.ts',
  },
]

export const mockedFlows = {
  'wistro-server': {
    name: 'Wistro Server Example',
    steps: mockFlowSteps,
  },
}
