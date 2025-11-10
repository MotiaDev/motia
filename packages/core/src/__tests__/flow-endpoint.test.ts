import { z } from 'zod'
import zodToJsonSchema from 'zod-to-json-schema'
import { MemoryStreamAdapterManager } from '../adapters/defaults'
import { generateFlow } from '../helper/flows-helper'
import { LockedData } from '../locked-data'
import { NoPrinter } from '../printer'
import type { Step } from '../types'
import { createApiStep, createEventStep } from './fixtures/step-fixtures'

const mockFlowSteps: Step[] = [
  createApiStep({
    name: 'Start Event',
    description: 'Start the Motia Server Example flow',
    path: '/api/motia-server-example',
    method: 'POST',
    emits: ['ws-server-example.start'],
    flows: ['motia-server'],
  }),
  createEventStep({
    name: 'Processor',
    subscribes: ['ws-server-example.start'],
    emits: ['ws-server-example.processed'],
    input: zodToJsonSchema(z.object({})) as never,
    flows: ['motia-server'],
  }),
  createEventStep({
    name: 'Finalizer',
    subscribes: ['ws-server-example.processed'],
    emits: [],
    input: zodToJsonSchema(z.object({})) as never,
    flows: ['motia-server'],
  }),
]

describe('flowEndpoint', () => {
  it('should generate a list of flows with steps', () => {
    const lockedData = new LockedData(process.cwd(), new MemoryStreamAdapterManager(), new NoPrinter())
    mockFlowSteps.forEach((step) => lockedData.createStep(step, { disableTypeCreation: true }))

    const result = generateFlow('motia-server', lockedData.flows['motia-server'].steps)
    expect(result.steps.map((step) => step.name)).toEqual(['Start Event', 'Processor', 'Finalizer'])
  })
})
