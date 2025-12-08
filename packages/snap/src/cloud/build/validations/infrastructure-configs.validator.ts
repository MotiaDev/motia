import { type EventConfig, validateInfrastructureConfig } from '@motiadev/core'
import path from 'path'
import pc from 'picocolors'
import type { Validator } from './types'

export const infrastructureConfigsValidator: Validator = (builder) => {
  const errors = []

  const eventSteps = Object.values(builder.stepsConfig).filter(
    (step) => step.config.type === 'event' && step.config.infrastructure,
  )

  for (const step of eventSteps) {
    const config = step.config as EventConfig

    const relativePath = path.relative(builder.projectDir, step.filePath)

    const validationResult = validateInfrastructureConfig(config.infrastructure)

    if (!validationResult.success && validationResult.errors) {
      for (const error of validationResult.errors) {
        errors.push({
          relativePath,
          message: [
            `Infrastructure configuration error in step ${pc.magenta(step.config.name)}:`,
            `  ${pc.red('➜')} ${error.path}: ${pc.red(error.message)}`,
          ].join('\n'),
          step,
        })
      }
    }
  }

  return { errors, warnings: [] }
}
