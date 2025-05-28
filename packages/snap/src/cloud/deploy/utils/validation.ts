import colors from 'colors'
import * as cron from 'cron'
import { Builder, BuildStepConfig } from '../../build/builder'
import path from 'path'

export const validateStepsConfig = (builder: Builder) => {
  const errors: { message: string; step: BuildStepConfig }[] = []
  const warnings: { message: string; step: BuildStepConfig }[] = []
  const endpoints = new Map<string, string>()
  const stepNames = new Set<string>()

  for (const step of Object.values(builder.stepsConfig)) {
    if (stepNames.has(step.config.name)) {
      errors.push({
        message: [`Duplicate step names: ${colors.red(step.config.name)}`].join('\n'),
        step,
      })
    } else {
      stepNames.add(step.config.name)
    }
  }

  for (const step of Object.values(builder.stepsConfig)) {
    // TODO: check bundle size

    if (step.config.type === 'cron') {
      if (!cron.validateCronExpression(step.config.cron)) {
        errors.push({
          message: [
            'Cron step has an invalid cron expression.',
            `  ${colors.red('➜')} ${colors.magenta(step.config.cron)}`,
          ].join('\n'),
          step,
        })
      }
    } else if (step.config.type === 'api') {
      const entrypoint = path.relative(builder.projectDir, step.filePath)
      const endpoint = `${step.config.method} ${step.config.path}`

      if (endpoints.has(endpoint)) {
        errors.push({
          message: [
            `Endpoint conflict`,
            `  ${colors.red('➜')} ${colors.magenta(endpoint)} is defined in the following files`,
            `    ${colors.red('➜')} ${colors.blue(entrypoint)}`,
            `    ${colors.red('➜')} ${colors.blue(endpoints.get(endpoint)!)}`,
          ].join('\n'),
          step,
        })
      } else {
        endpoints.set(endpoint, entrypoint)
      }
    }

    if (step.config.name.length > 30) {
      errors.push({
        message: [
          `Step name is too long. Maximum is 30 characters.`,
          `  ${colors.red('➜')} ${colors.magenta(step.config.name)}`,
        ].join('\n'),
        step,
      })
    }
  }

  return { errors, warnings }
}
