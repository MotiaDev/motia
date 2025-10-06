import path from 'path'
import colors from 'colors'
import * as cron from 'node-cron'
import { Validator } from './types'

export const cronExpressionsValidator: Validator = (builder) => {
  const errors = []

  for (const step of Object.values(builder.stepsConfig)) {
    if (step.config.type === 'cron') {
      if (!cron.validate(step.config.cron)) {
        const relativePath = path.relative(builder.projectDir, step.filePath)
        errors.push({
          relativePath,
          message: [
            'Cron step has an invalid cron expression.',
            `  ${colors.red('➜')} ${colors.magenta(step.config.cron)}`,
          ].join('\n'),
          step,
        })
      }
    }
  }

  return { errors, warnings: [] }
}

