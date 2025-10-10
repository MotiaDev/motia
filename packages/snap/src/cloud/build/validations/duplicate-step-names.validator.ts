import path from 'path'
import colors from 'colors'
import { Validator } from './types'

export const duplicateStepNamesValidator: Validator = (builder) => {
  const errors = []
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

  return { errors, warnings: [] }
}

