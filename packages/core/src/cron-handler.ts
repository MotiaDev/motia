import * as cron from 'node-cron'
import { callStepFile } from './call-step-file'
import { LockedData } from './locked-data'
import { globalLogger } from './logger'
import { StateAdapter } from './state/state-adapter'
import { CronConfig, EventManager, Step } from './types'
import { LoggerFactory } from './LoggerFactory'
import { generateTraceId } from './generate-trace-id'
import { MotiaError, createErrorContext, ErrorCategory } from './errors'

export type CronManager = {
  createCronJob: (step: Step<CronConfig>) => void
  removeCronJob: (step: Step<CronConfig>) => void
  close: () => void
}

export const setupCronHandlers = (
  lockedData: LockedData,
  eventManager: EventManager,
  state: StateAdapter,
  loggerFactory: LoggerFactory,
) => {
  const cronJobs = new Map<string, cron.ScheduledTask>()
  const printer = lockedData.printer

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
      const logger = loggerFactory.create({ traceId, flows, stepName })

      try {
        await callStepFile({
          contextInFirstArg: true,
          step,
          eventManager,
          printer,
          state,
          traceId,
          logger,
        })
      } catch (error: unknown) {
        const errorContext = createErrorContext(step, traceId, undefined, error as Error)
        const motiaError = new MotiaError(
          error instanceof Error ? error.message : String(error),
          errorContext.category,
          errorContext,
        )

        logger.error('[cron handler] error executing cron job', {
          error: motiaError.message,
          category: motiaError.category,
          context: errorContext,
          step: step.config.name,
        })

        // For network errors, we could implement retry logic here
        if (errorContext.category === ErrorCategory.NETWORK) {
          logger.info('[cron handler] network error detected, consider implementing retry logic', {
            step: step.config.name,
            traceId,
          })
        }
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

  lockedData.cronSteps().forEach(createCronJob)

  return { createCronJob, removeCronJob, close }
}
