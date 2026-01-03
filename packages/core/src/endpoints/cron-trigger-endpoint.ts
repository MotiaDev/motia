import type { Express } from 'express'
import { callStepFile } from '../call-step-file'
import { generateTraceId } from '../generate-trace-id'
import { isCronStep } from '../guards'
import { generateStepId } from '../helper/flows-helper'
import type { LockedData } from '../locked-data'
import type { Motia } from '../motia'

export const cronTriggerEndpoint = (app: Express, lockedData: LockedData, motia: Motia) => {
  app.post('/__motia/cron/:stepId/trigger', async (req, res) => {
    const id = req.params.stepId

    const allSteps = [...lockedData.activeSteps, ...lockedData.devSteps]
    const step = allSteps.find((step) => generateStepId(step.filePath) === id)

    if (!step) {
      res.status(404).json({ error: 'Step not found' })
      return
    }

    if (!isCronStep(step)) {
      res.status(400).json({ error: 'Step is not a cron step' })
      return
    }

    try {
      const traceId = generateTraceId()
      const { name: stepName, flows } = step.config
      const logger = motia.loggerFactory.create({ traceId, flows, stepName })
      const tracer = await motia.tracerFactory.createTracer(traceId, step, logger)

      await callStepFile({ contextInFirstArg: true, step, traceId, tracer, logger }, motia)

      res.status(200).json({
        success: true,
        traceId,
        message: `Cron step "${stepName}" executed successfully`,
      })
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to execute cron step',
        message: error.message,
      })
    }
  })
}
