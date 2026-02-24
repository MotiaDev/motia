import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import type { InitOptions, ISdk } from 'iii-sdk'
import { init } from 'iii-sdk'

type OtelConfig = NonNullable<InitOptions['otel']>

const engineWsUrl = process.env.III_URL ?? 'ws://localhost:49134'

function readProjectName(): string | undefined {
  let dir = process.cwd()
  while (true) {
    const pkgPath = join(dir, 'package.json')
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
        if (typeof pkg.name === 'string' && pkg.name) {
          return pkg.name
        }
      } catch {
        // ignore
      }
    }
    const parent = dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return undefined
}

const createIII = (otelConfig?: Partial<OtelConfig>) => {
  return init(engineWsUrl, {
    otel: {
      enabled: true,
      serviceName: 'motia',
      ...otelConfig,
    },
    telemetry: {
      framework: 'motia',
      project_name: readProjectName(),
      amplitude_api_key: process.env.MOTIA_AMPLITUDE_API_KEY,
    },
  })
}

let instance: ISdk | undefined

export const getInstance = (): ISdk => {
  if (!instance) {
    instance = createIII()
  }
  return instance
}

export const initIII = (otelConfig?: Partial<OtelConfig>) => {
  instance = createIII(otelConfig)
  return instance
}
