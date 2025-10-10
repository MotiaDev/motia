import path from 'path'
import colors from 'colors'
import { Validator } from './types'
import { BUNDLE_SIZE_LIMITS, BYTES_TO_MB } from './constants'

export const stepBundleSizesValidator: Validator = (builder) => {
  const errors = []

  for (const step of Object.values(builder.stepsConfig)) {
    const relativePath = path.relative(builder.projectDir, step.filePath)
    const stepUncompressedSize = builder.stepUncompressedSizes.get(step.filePath)

    if (stepUncompressedSize !== undefined) {
      const maxSize = BUNDLE_SIZE_LIMITS.STEP_MAX_MB * BYTES_TO_MB

      if (stepUncompressedSize > maxSize) {
        const sizeMB = (stepUncompressedSize / BYTES_TO_MB).toFixed(2)
        const compressedSize = builder.stepCompressedSizes.get(step.filePath)
        const compressedSizeMB = compressedSize ? (compressedSize / BYTES_TO_MB).toFixed(2) : 'unknown'

        errors.push({
          relativePath,
          message: [
            `Step bundle size exceeds ${BUNDLE_SIZE_LIMITS.STEP_MAX_MB}MB limit (uncompressed).`,
            `  ${colors.red('➜')} Uncompressed size: ${colors.magenta(sizeMB + 'MB')}`,
            `  ${colors.red('➜')} Compressed size: ${colors.cyan(compressedSizeMB + 'MB')}`,
            `  ${colors.red('➜')} Maximum allowed: ${colors.blue(BUNDLE_SIZE_LIMITS.STEP_MAX_MB + 'MB')}`,
          ].join('\n'),
          step,
        })
      }
    }
  }

  return { errors, warnings: [] }
}

