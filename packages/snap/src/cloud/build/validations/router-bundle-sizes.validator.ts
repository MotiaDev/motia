import colors from 'colors'
import { Validator } from './types'
import { BUNDLE_SIZE_LIMITS, BYTES_TO_MB } from './constants'

export const routerBundleSizesValidator: Validator = (builder) => {
  const errors = []
  const maxRouterSize = BUNDLE_SIZE_LIMITS.ROUTER_MAX_MB * BYTES_TO_MB

  for (const [routerType, uncompressedSize] of builder.routerUncompressedSizes.entries()) {
    if (uncompressedSize > maxRouterSize) {
      const uncompressedSizeMB = (uncompressedSize / BYTES_TO_MB).toFixed(2)
      const compressedSize = builder.routerCompressedSizes.get(routerType)
      const compressedSizeMB = compressedSize ? (compressedSize / BYTES_TO_MB).toFixed(2) : 'unknown'

      errors.push({
        relativePath: `${routerType} API router`,
        message: [
          `${routerType.charAt(0).toUpperCase() + routerType.slice(1)} API router bundle size exceeds ${BUNDLE_SIZE_LIMITS.ROUTER_MAX_MB}MB limit (uncompressed).`,
          `  ${colors.red('➜')} Uncompressed size: ${colors.magenta(uncompressedSizeMB + 'MB')}`,
          `  ${colors.red('➜')} Compressed size: ${colors.cyan(compressedSizeMB + 'MB')}`,
          `  ${colors.red('➜')} Maximum allowed: ${colors.blue(BUNDLE_SIZE_LIMITS.ROUTER_MAX_MB + 'MB')}`,
        ].join('\n'),
        step: Object.values(builder.stepsConfig)[0],
      })
    }
  }

  return { errors, warnings: [] }
}

