import path from 'path'
import colors from 'colors'
import { Validator } from './types'
import { BUNDLE_SIZE_LIMITS } from './constants'

export const stepNameLengthsValidator: Validator = (builder) => {
  const errors = []

  for (const step of Object.values(builder.stepsConfig)) {
    if (step.config.name.length > BUNDLE_SIZE_LIMITS.STEP_NAME_MAX_LENGTH) {
      const relativePath = path.relative(builder.projectDir, step.filePath)
      errors.push({
        relativePath,
        message: [
          `Step name is too long. Maximum is ${BUNDLE_SIZE_LIMITS.STEP_NAME_MAX_LENGTH} characters.`,
          `  ${colors.red('➜')} ${colors.magenta(step.config.name)}`,
        ].join('\n'),
        step,
      })
    }
  }

  return { errors, warnings: [] }
}

