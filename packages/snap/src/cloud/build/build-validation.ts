import colors from 'colors'
import * as cron from 'cron'
import path from 'path'
import type { BuildListener } from '../new-deployment/listeners/listener.types'
import type { Builder, BuildStepConfig } from './builder'

export const buildValidation = (builder: Builder, listener: BuildListener) => {
  const { errors, warnings } = validateStepsConfig(builder)

  if (warnings.length > 0) {
    warnings.map((warning) => listener.onBuildWarning(warning))
  }

  if (errors.length > 0) {
    listener.onBuildErrors(errors)
    return false
  }

  return true
}

export type ValidationError = {
  relativePath: string
  message: string
  step: BuildStepConfig
}

export const validateStepsConfig = (builder: Builder) => {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []
  const endpoints = new Map<string, string>()
  const stepNames = new Set<string>()

  for (const step of Object.values(builder.stepsConfig)) {
    if (stepNames.has(step.config.name)) {
      errors.push({
        relativePath: path.relative(builder.projectDir, step.filePath),
        message: [`Duplicate step names: ${colors.red(step.config.name)}`].join('\n'),
        step,
      })
    } else {
      stepNames.add(step.config.name)
    }
  }

  for (const step of Object.values(builder.stepsConfig)) {
    // TODO: check bundle size
    const relativePath = path.relative(builder.projectDir, step.filePath)

    if (step.config.type === 'cron') {
      if (!cron.validateCronExpression(step.config.cron)) {
        errors.push({
          relativePath,
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
          relativePath,
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
        relativePath,
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
