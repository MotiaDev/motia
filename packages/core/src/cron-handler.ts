import * as cron from 'node-cron'
import { callStepFile } from './call-step-file'
import { generateTraceId } from './generate-trace-id'
import { globalLogger } from './logger'
import { Motia } from './motia'
import { Step, CronTrigger } from './types'
import { getTriggersByType } from './guards'

export type CronManager = {
  createCronJob: (step: Step) => void
  removeCronJob: (step: Step) => void
  close: () => void
}

export const setupCronHandlers = (motia: Motia) => {
  const cronJobs = new Map<string, cron.ScheduledTask>()

  const createCronJob = (step: Step) => {
    const { config, filePath } = step
    const { name: stepName, flows } = config

    // Get all cron triggers for this step
    const cronTriggers = getTriggersByType(step, 'cron')

    if (cronTriggers.length === 0) {
      return // No cron triggers, nothing to do
    }

    // Process each cron trigger
    cronTriggers.forEach((cronTrigger: CronTrigger) => {
      const { cron: cronExpression } = cronTrigger

      if (!cron.validate(cronExpression)) {
        globalLogger.error('[cron handler] invalid cron expression', {
          expression: cronExpression,
          step: stepName,
        })
        return
      }

      globalLogger.debug('[cron handler] setting up cron job', {
        filePath,
        step: stepName,
        cron: cronExpression,
      })

      const task = cron.schedule(cronExpression, async () => {
        const traceId = generateTraceId()
        const logger = motia.loggerFactory.create({ traceId, flows, stepName })
        const tracer = await motia.tracerFactory.createTracer(traceId, step, logger)

        try {
          await callStepFile({ contextInFirstArg: true, step, traceId, tracer, logger }, motia)

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
          logger.error('[cron handler] error executing cron job', {
            error: error.message,
            step: step.config.name,
          })
        }
      })

      // Use a unique key for each cron trigger
      const cronJobKey = `${step.filePath}:${cronExpression}`
      cronJobs.set(cronJobKey, task)
    })
  }

  const removeCronJob = (step: Step) => {
    const cronTriggers = getTriggersByType(step, 'cron')

    cronTriggers.forEach((cronTrigger: CronTrigger) => {
      const cronJobKey = `${step.filePath}:${cronTrigger.cron}`
      const task = cronJobs.get(cronJobKey)

      if (task) {
        task.stop()
        cronJobs.delete(cronJobKey)
      }
    })
  }

  const close = () => {
    cronJobs.forEach((task) => task.stop())
    cronJobs.clear()
  }

  // Initialize cron jobs for all steps that have cron triggers
  motia.lockedData.steps().forEach((step) => {
    if (getTriggersByType(step, 'cron').length > 0) {
      createCronJob(step)
    }
  })

  return { createCronJob, removeCronJob, close }
}
