import { LockedData } from './locked-data'
import { Express } from 'express'
import fs from 'fs/promises'
import { generateStepId } from './helper/flows-helper'

const getFeatures = async (filePath: string) => {
  const stat = await fs.stat(filePath + '-features.json').catch(() => null)

  if (!stat || stat.isDirectory()) {
    return []
  }

  try {
    const content = await fs.readFile(filePath + '-features.json', 'utf8')
    return JSON.parse(content)
  } catch (error) {
    return []
  }
}

export const stepEndpoint = (app: Express, lockedData: LockedData) => {
  app.get('/__motia/step/:stepId', async (req, res) => {
    const id = req.params.stepId

    const allSteps = [...lockedData.activeSteps, ...lockedData.devSteps]
    const step = allSteps.find((step) => generateStepId(step.filePath) === id)

    if (!step) {
      res.status(404).send({ error: 'Step not found' })
      return
    }

    try {
      const content = await fs.readFile(step.filePath, 'utf8')
      const features = await getFeatures(step.filePath)

      res.status(200).send({ id, content, features })
    } catch (error) {
      console.error('Error reading step file:', error)
      res.status(500).send({
        error: 'Failed to read step file',
      })
    }
  })
}
