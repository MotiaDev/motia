import path from 'node:path'
import { config, type MotiaPlugin, type MotiaPluginContext, type StreamAuthRequest } from '@motiadev/core'
import { z } from 'zod'

const statesPlugin = require('@motiadev/plugin-states/plugin')
const endpointPlugin = require('@motiadev/plugin-endpoint/plugin')
const logsPlugin = require('@motiadev/plugin-logs/plugin')
const observabilityPlugin = require('@motiadev/plugin-observability/plugin')
const examplePlugin = require('@motiadev/plugin-example/plugin')

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

export default config({
  plugins: [observabilityPlugin, statesPlugin, endpointPlugin, logsPlugin, examplePlugin, localPluginExample],
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
