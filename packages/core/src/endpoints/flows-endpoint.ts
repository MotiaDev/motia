import { z } from 'zod'
import { generateFlow } from '../helper/flows-helper'
import type { LockedData } from '../locked-data'
import { FlowsStream } from '../streams/flows-stream'

export const flowsEndpoint = (lockedData: LockedData) => {
  const flowsStream = lockedData.createStream(
    {
      filePath: '__motia.flows',
      hidden: true,
      config: {
        name: '__motia.flows',
        schema: z.object({ id: z.string(), name: z.string(), steps: z.any(), edges: z.any() }),
        baseConfig: { storageType: 'custom', factory: () => new FlowsStream(lockedData) },
      },
    },
    { disableTypeCreation: true },
  )()

  lockedData.on('flow-created', (flowId) => {
    const flow = lockedData.flows[flowId]
    const response = generateFlow(flowId, flow.steps)
    flowsStream.set('default', flowId, response)
  })

  lockedData.on('flow-updated', (flowId) => {
    const flow = lockedData.flows[flowId]
    const response = generateFlow(flowId, flow.steps)
    flowsStream.set('default', flowId, response)
  })

  lockedData.on('flow-removed', (flowId) => flowsStream.delete('default', flowId))
}
