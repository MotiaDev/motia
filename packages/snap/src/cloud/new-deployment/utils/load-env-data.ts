import fs from 'fs'
import type { CliContext } from '../../config-utils'

export const loadEnvData = (envFile: string, context: CliContext): Record<string, string> => {
  if (!envFile) {
    return {}
  }

  context.log('load-env', (message) => message.tag('progress').append('Loading environment variables...'))

  if (envFile && !fs.existsSync(envFile)) {
    context.log('load-env', (message) =>
      message
        .tag('failed')
        .append('Environment file not found:')
        .append(envFile, 'red')
        .box(['Please check the environment file path and try again'], 'red'),
    )
    context.exit(1)
  }

  const data = parseEnvFile(envFile)

  context.log('load-env', (message) => {
    message.tag('success').append('Environment variables loaded from file')

    const boxText = Object.keys(data)
      .map((key) => `${key}=***`)
      .join('\n')

    return message.box([boxText], 'blue')
  })

  return data
}

const parseEnvFile = (filePath: string): Record<string, string> => {
  const envContent = fs.readFileSync(filePath, 'utf-8')
  const envLines = envContent.split('\n')
  const envData: Record<string, string> = {}

  for (const line of envLines) {
    const trimmedLine = line.trim()
    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue
    }

    const [key, ...valueParts] = trimmedLine.split('=')
    const value = valueParts.join('=')

    if (key && value) {
      envData[key.trim()] = value.trim().replace(/^["'](.*)["']$/, '$1')
    }
  }

  return envData
}
