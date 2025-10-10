import path from 'path'
import colors from 'colors'
import { Validator } from './types'

export const apiEndpointsValidator: Validator = (builder) => {
  const errors = []
  const endpoints = new Map<string, string>()

  for (const step of Object.values(builder.stepsConfig)) {
    if (step.config.type === 'api') {
      const relativePath = path.relative(builder.projectDir, step.filePath)
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
  }

  return { errors, warnings: [] }
}

