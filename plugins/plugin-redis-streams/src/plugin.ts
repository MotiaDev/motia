import type { MotiaPlugin, MotiaPluginContext } from '@motiadev/core'
import { createClient, type RedisClientType } from 'redis'
import { api } from './api'
import { RedisStreamsStream } from './streams/redis-streams-stream'

const STREAM_NAME = '__motia.redis-streams'

const isRedisStreamAdapterManager = (adapter: unknown): adapter is { getClient: () => RedisClientType } => {
  return (
    adapter !== null && typeof adapter === 'object' && 'getClient' in adapter && typeof adapter.getClient === 'function'
  )
}

export default function plugin(motia: MotiaPluginContext): MotiaPlugin {
  let client: RedisClientType
  let ownsConnection = false

  if (motia.lockedData.redisClient) {
    client = motia.lockedData.redisClient
  } else if (isRedisStreamAdapterManager(motia.lockedData.streamAdapter)) {
    client = motia.lockedData.streamAdapter.getClient()
  } else {
    const host = process.env.REDIS_HOST || 'localhost'
    const port = parseInt(process.env.REDIS_PORT || '6379', 10)
    const password = process.env.REDIS_PASSWORD || undefined
    const database = parseInt(process.env.REDIS_DB || '0', 10)

    client = createClient({
      socket: {
        host,
        port,
        keepAlive: true,
        noDelay: true,
      },
      password,
      database,
    }) as RedisClientType

    client.on('error', (err: Error) => {
      console.error('[Redis Streams Plugin] Client error:', err)
    })

    client.connect()
    ownsConnection = true
  }

  const redisStreamsStream = new RedisStreamsStream(client)

  const stream = motia.lockedData.createStream({
    filePath: `${STREAM_NAME}.ts`,
    hidden: true,
    config: {
      name: STREAM_NAME,
      baseConfig: { storageType: 'custom', factory: () => redisStreamsStream },
      schema: null as never,
    },
  })()

  redisStreamsStream.setUpdateCallback((streamInfo) => {
    stream.set('default', streamInfo.id, streamInfo)
  })

  redisStreamsStream.discoverAndSetupStreams().then(() => {
    redisStreamsStream.getGroup('default').then((streams) => {
      for (const streamInfo of streams) {
        stream.set('default', streamInfo.id, streamInfo)
      }
    })
  })

  api(motia, client)

  return {
    workbench: [
      {
        packageName: '@motiadev/plugin-redis-streams',
        cssImports: ['@motiadev/plugin-redis-streams/dist/index.css'],
        label: 'Streams',
        position: 'top',
        componentName: 'StreamsPage',
        labelIcon: 'radio',
      },
    ],
    onShutdown: async () => {
      if (ownsConnection) {
        await client.quit()
      }
    },
  }
}
