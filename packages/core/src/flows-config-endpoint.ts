import type { Express, Request, Response } from 'express'
import path from 'path'
import { z } from 'zod'
import type { LockedData } from './locked-data'
import { FlowsConfigStream } from './streams/flows-config-stream'
import type { FlowConfig } from './types/flows-config-types'

interface ParamId {
  id: string
}

export const flowsConfigEndpoint = (app: Express, baseDir: string, lockedData: LockedData) => {
  const configPath = path.join(baseDir, 'motia-workbench.json')
  const stream = new FlowsConfigStream(configPath)

  lockedData.createStream(
    {
      filePath: '__motia.flowsConfig',
      hidden: true,
      config: {
        name: '__motia.flowsConfig',
        schema: z.object({ name: z.string(), steps: z.any(), edges: z.any() }),
        baseConfig: { storageType: 'custom', factory: () => stream },
      },
    },
    { disableTypeCreation: true },
  )()

  app.post('/flows/:id/config', async (req: Request<ParamId>, res: Response) => {
    const newFlowConfig: FlowConfig = req.body
    try {
      await stream.set('default', newFlowConfig.id, newFlowConfig)
      res.status(200).send({ message: 'Flow config saved successfully' })
    } catch (error) {
      console.error('Error saving flow config:', (error as Error).message)
      res.status(500).json({ error: 'Failed to save flow config' })
    }
  })
}
