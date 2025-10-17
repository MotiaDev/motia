import * as cron from 'node-cron'
import { callStepFile } from './call-step-file'
import { generateTraceId } from './generate-trace-id'
import { globalLogger } from './logger'
import type { Motia } from './motia'
import type { CronConfig, Step } from './types'

export type CronManager = {
  createCronJob: (step: Step<CronConfig>) => void
  removeCronJob: (step: Step<CronConfig>) => void
  close: () => void
}

export const setupCronHandlers = (motia: Motia) => {
  const cronJobs = new Map<string, cron.ScheduledTask>()

  const createCronJob = (step: Step<CronConfig>) => {
    const { config, filePath } = step
    const { cron: cronExpression, name: stepName, flows } = config

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
      } catch (error: any) {
        logger.error('[cron handler] error executing cron job', {
          error: error.message,
          step: step.config.name,
        })
      }
    })

    cronJobs.set(step.filePath, task)
  }

  const removeCronJob = (step: Step<CronConfig>) => {
    const task = cronJobs.get(step.filePath)

    if (task) {
      task.stop()
      cronJobs.delete(step.filePath)
    }
  }

  const close = () => {
    cronJobs.forEach((task) => task.stop())
    cronJobs.clear()
  }

  motia.lockedData.cronSteps().forEach(createCronJob)

  return { createCronJob, removeCronJob, close }
}
