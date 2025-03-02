import fs from 'fs'
import path from 'path'
import { Express } from 'express'

interface FlowConfig {
  [flowName: string]: {
    [filePath: string]: string
  }
}

export const flowsConfigEndpoint = (app: Express, baseDir: string) => {
  const configDir = path.join(baseDir, '.motia', 'flow-config')
  const configPath = path.join(configDir, 'motia-workbench.json')

  // POST endpoint to save flow configuration
  app.post('/flows/config', (req, res) => {
    const newFlowConfig: FlowConfig = req.body

    try {
      fs.mkdirSync(configDir, { recursive: true })
      
      let existingConfig: FlowConfig = {}
      if (fs.existsSync(configPath)) {
        existingConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'))
      }
      
      const updatedConfig: FlowConfig = {
        ...existingConfig
      }

      Object.entries(newFlowConfig).forEach(([flowName, filePathPositions]) => {
        updatedConfig[flowName] = {
          ...(updatedConfig[flowName] || {}),
          ...filePathPositions
        }
      })

      fs.writeFileSync(configPath, JSON.stringify(updatedConfig, null, 2))
      res.status(200).send({ message: 'Flow config saved successfully' })
    } catch (error) {
      console.error('Error saving flow config:', error)
      res.status(500).json({ error: 'Failed to save flow config' })
    }
  })

  app.get('/flows/:id/config', async (req: Request, res) => {
    const { id } = req.params
    
    try {
      if (!fs.existsSync(configPath)) {
        return res.status(200).send({})
      }

      const allFlowsConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'))
      const flowConfig = allFlowsConfig[id] || {}
      
      res.status(200).send(flowConfig)
    } catch (error) {
      console.error('Error reading flow config:', error)
      res.status(400).send({})
    }
  })
}
