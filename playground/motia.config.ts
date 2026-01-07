import path from 'node:path'
import { defineConfig, type MotiaPlugin, type MotiaPluginContext, type StreamAuthRequest } from '@motiadev/core'
import bullmqPlugin from '@motiadev/plugin-bullmq/plugin'
import cronPlugin from '@motiadev/plugin-cron/plugin'
import endpointPlugin from '@motiadev/plugin-endpoint/plugin'
import examplePlugin from '@motiadev/plugin-example/plugin'
import logsPlugin from '@motiadev/plugin-logs/plugin'
import observabilityPlugin from '@motiadev/plugin-observability/plugin'
import statesPlugin from '@motiadev/plugin-states/plugin'
import wsPlugin from '@motiadev/plugin-ws/plugin'
import { z } from 'zod'

const __dirname = path.dirname(new URL(import.meta.url).pathname)

function localPluginExample(motia: MotiaPluginContext): MotiaPlugin {
  motia.registerApi(
    {
      method: 'GET',
      path: '/__motia/local-plugin-example',
    },
    async (_req, _ctx) => {
      return {
        status: 200,
        body: {
          message: 'Hello from Motia Plugin!',
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV || 'development',
          status: 'active',
        },
      }
    },
  )

  return {
    dirname: path.join(__dirname, 'plugins'),
    steps: ['**/*.step.ts', '**/*_step.py', '**/*_step.rb'],
    workbench: [
      {
        componentName: 'Example',
        packageName: '~/plugins/components/example',
        label: 'Local Plugin Example',
        position: 'top',
        labelIcon: 'toy-brick',
      },
      {
        componentName: 'StreamRbac',
        packageName: '~/plugins/components/stream-rbac',
        label: 'Stream RBAC',
        position: 'top',
        labelIcon: 'shield-check',
      },
    ],
  }
}

const streamAuthContextSchema = z.object({
  userId: z.string(),
  permissions: z.enum(['nodejs', 'python']).optional(),
})

const demoTokens: Record<string, z.infer<typeof streamAuthContextSchema>> = {
  'token-nodejs': { userId: 'anderson', permissions: 'nodejs' },
  'token-python': { userId: 'sergio', permissions: 'python' },
}

const extractAuthToken = (request: StreamAuthRequest): string | undefined => {
  if (!request) {
    return undefined
  }

  if (!request.url) {
    return undefined
  }

  const protocol = request.headers['sec-websocket-protocol'] as string | undefined
  if (protocol?.includes('Authorization')) {
    const [, token] = protocol.split(',')
    if (token) {
      return token.trim()
    }
  }

  try {
    const url = new URL(request.url)
    return url.searchParams.get('authToken') ?? undefined
  } catch {
    return undefined
  }
}

export default defineConfig({
  plugins: [
    observabilityPlugin,
    statesPlugin,
    endpointPlugin,
    logsPlugin,
    examplePlugin,
    bullmqPlugin,
    wsPlugin,
    cronPlugin,
    localPluginExample,
  ],
  streamAuth: {
    contextSchema: z.toJSONSchema(streamAuthContextSchema),
    authenticate: async (request: StreamAuthRequest) => {
      const token = extractAuthToken(request)

      if (!token) {
        return null
      }

      const tokenData = demoTokens[token]
      if (!tokenData) {
        throw new Error(`Invalid token: ${token}`)
      }

      return tokenData
    },
  },
})
