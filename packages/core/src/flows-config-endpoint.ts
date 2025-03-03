import fs from 'fs'
import path from 'path'
import { Express, Request, Response } from 'express'

interface FlowConfig {
  [flowName: string]: {
    [filePath: string]: string
  }
}

type ParamId = { id: string }

export const flowsConfigEndpoint = (app: Express, baseDir: string) => {
  const configPath = path.join(baseDir, 'motia-workbench.json')

  app.post('/flows/:id/config', (req: Request<ParamId>, res: Response) => {
    const newFlowConfig: FlowConfig = req.body

    try {
      if (!fs.existsSync(configPath)) {
        fs.writeFileSync(configPath, JSON.stringify({}, null, 2))
      }
      const existingConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'))

      const updatedConfig: FlowConfig = {
        ...existingConfig,
      }

      Object.entries(newFlowConfig).forEach(([flowName, filePathPositions]) => {
        updatedConfig[flowName] = {
          ...(updatedConfig[flowName] || {}),
          ...filePathPositions,
        }
      })

      fs.writeFileSync(configPath, JSON.stringify(updatedConfig, null, 2))
      res.status(200).send({ message: 'Flow config saved successfully' })
    } catch (error) {
      console.error('Error saving flow config:', error)
      res.status(500).json({ error: 'Failed to save flow config' })
    }
  })

  app.get('/flows/:id/config', (req: Request<ParamId>, res: Response) => {
    const { id } = req.params

    try {
      const file = fs.readFileSync(configPath, 'utf8')
      const allFlowsConfig = JSON.parse(file)
      const flowConfig = allFlowsConfig[id] || {}

      res.status(200).send(flowConfig)
    } catch (error) {
      console.error('Error reading flow config:', error)
      res.status(400).send({})
    }
  })
}
