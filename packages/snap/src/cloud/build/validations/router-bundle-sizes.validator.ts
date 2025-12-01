import pc from 'picocolors'
import { BUNDLE_SIZE_LIMITS, BYTES_TO_MB } from './constants'
import type { Validator } from './types'

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
          `  ${pc.red('➜')} Uncompressed size: ${pc.magenta(uncompressedSizeMB + 'MB')}`,
          `  ${pc.red('➜')} Compressed size: ${pc.cyan(compressedSizeMB + 'MB')}`,
          `  ${pc.red('➜')} Maximum allowed: ${pc.blue(BUNDLE_SIZE_LIMITS.ROUTER_MAX_MB + 'MB')}`,
        ].join('\n'),
        step: Object.values(builder.stepsConfig)[0],
      })
    }
  }

  return { errors, warnings: [] }
}
