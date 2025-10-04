import { BuildListener, ValidationError } from '../new-deployment/listeners/listener.types'
import { Builder } from './builder'
import colors from 'colors'
import * as cron from 'node-cron'
import path from 'path'
import { validateInfrastructureConfig } from '@motiadev/core/dist/src/step-validator'

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
    const relativePath = path.relative(builder.projectDir, step.filePath)

    // Check individual step bundle size (150MB limit - uncompressed)
    const stepUncompressedSize = builder.stepUncompressedSizes.get(step.filePath)
    if (stepUncompressedSize !== undefined) {
      const maxSize = 250 * 1024 * 1024 // 250MB in bytes
      if (stepUncompressedSize > maxSize) {
        const sizeMB = (stepUncompressedSize / (1024 * 1024)).toFixed(2)
        const compressedSize = builder.stepCompressedSizes.get(step.filePath)
        const compressedSizeMB = compressedSize ? (compressedSize / (1024 * 1024)).toFixed(2) : 'unknown'
        errors.push({
          relativePath,
          message: [
            'Step bundle size exceeds 250MB limit (uncompressed).',
            `  ${colors.red('➜')} Uncompressed size: ${colors.magenta(sizeMB + 'MB')}`,
            `  ${colors.red('➜')} Compressed size: ${colors.cyan(compressedSizeMB + 'MB')}`,
            `  ${colors.red('➜')} Maximum allowed: ${colors.blue('250MB')}`,
          ].join('\n'),
          step,
        })
      }
    }

    if (step.config.type === 'cron') {
      if (!cron.validate(step.config.cron)) {
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

    if (step.config.name.length > 40) {
      errors.push({
        relativePath,
        message: [
          `Step name is too long. Maximum is 40 characters.`,
          `  ${colors.red('➜')} ${colors.magenta(step.config.name)}`,
        ].join('\n'),
        step,
      })
    }

    const config = step.config as any
    if (config.infrastructure) {
      if (step.config.type !== 'event' && config.infrastructure.queue) {
        warnings.push({
          relativePath,
          message: [
            'Queue configuration is only applicable to Event steps and will be ignored',
            `  ${colors.yellow('➜')} Queue config found in ${colors.magenta(step.config.type)} step`,
          ].join('\n'),
          step,
        })
      }

      let inputSchema: any
      if (step.config.type === 'event' && config.input && typeof config.input === 'object' && '_def' in config.input) {
        inputSchema = config.input
      }

      const validationResult = validateInfrastructureConfig(
        config.infrastructure,
        step.config.name,
        inputSchema
      )

      if (!validationResult.success && validationResult.errors) {
        for (const error of validationResult.errors) {
          errors.push({
            relativePath,
            message: [
              `Infrastructure configuration error in step ${colors.magenta(step.config.name)}:`,
              `  ${colors.red('➜')} ${error.path}: ${colors.red(error.message)}`,
            ].join('\n'),
            step,
          })
        }
      }
    }
  }

  // Check API router bundle sizes (150MB limit - uncompressed)
  const maxRouterSize = 150 * 1024 * 1024 // 150MB in bytes
  for (const [routerType, uncompressedSize] of builder.routerUncompressedSizes.entries()) {
    if (uncompressedSize > maxRouterSize) {
      const uncompressedSizeMB = (uncompressedSize / (1024 * 1024)).toFixed(2)
      const compressedSize = builder.routerCompressedSizes.get(routerType)
      const compressedSizeMB = compressedSize ? (compressedSize / (1024 * 1024)).toFixed(2) : 'unknown'
      errors.push({
        relativePath: `${routerType} API router`,
        message: [
          `${routerType.charAt(0).toUpperCase() + routerType.slice(1)} API router bundle size exceeds 150MB limit (uncompressed).`,
          `  ${colors.red('➜')} Uncompressed size: ${colors.magenta(uncompressedSizeMB + 'MB')}`,
          `  ${colors.red('➜')} Compressed size: ${colors.cyan(compressedSizeMB + 'MB')}`,
          `  ${colors.red('➜')} Maximum allowed: ${colors.blue('150MB')}`,
        ].join('\n'),
        step: Object.values(builder.stepsConfig)[0], // Use first step as reference
      })
    }
  }

  return { errors, warnings }
}
