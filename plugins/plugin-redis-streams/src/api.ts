import type { ApiRequest, ApiResponse, MotiaPluginContext } from '@motiadev/core'
import type { RedisClientType } from 'redis'
import type { StreamEntry, StreamInfo } from './types/stream'

const STREAM_KEY_PATTERN = 'motia:stream:*:group:*'

const discoverStreams = async (client: RedisClientType): Promise<StreamInfo[]> => {
  const keys = await client.keys(STREAM_KEY_PATTERN)
  const streamInfos: StreamInfo[] = []
  const seenStreams = new Set<string>()

  for (const key of keys) {
    const streamName = key.replace(/^motia:stream:/, '').replace(/:group:.*$/, '')

    if (seenStreams.has(streamName)) {
      continue
    }
    seenStreams.add(streamName)

    const streamKey = key.split(':group:')[0]
    const info = await getStreamInfo(client, streamName, streamKey)
    if (info) {
      streamInfos.push(info)
    }
  }

  return streamInfos
}

const getStreamInfo = async (client: RedisClientType, name: string, key: string): Promise<StreamInfo | null> => {
  try {
    const info = await client.xInfoStream(key)
    const groups = await client.xInfoGroups(key).catch(() => [])

    return {
      name,
      displayName: name,
      length: info.length,
      firstEntryId: info['first-entry']?.id ?? null,
      lastEntryId: info['last-entry']?.id ?? null,
      groups: groups.length,
      radixTreeKeys: info['radix-tree-keys'],
      radixTreeNodes: info['radix-tree-nodes'],
    }
  } catch {
    return null
  }
}

export const api = ({ registerApi }: MotiaPluginContext, client: RedisClientType): void => {
  registerApi({ method: 'GET', path: '/__motia/redis-streams/streams' }, async (): Promise<ApiResponse> => {
    try {
      const streams = await discoverStreams(client)
      return { status: 200, body: { streams } }
    } catch (error) {
      return { status: 500, body: { error: error instanceof Error ? error.message : 'Unknown error' } }
    }
  })

  registerApi(
    { method: 'GET', path: '/__motia/redis-streams/streams/:name' },
    async (req: ApiRequest): Promise<ApiResponse> => {
      try {
        const name = req.pathParams.name as string
        const streamKey = `motia:stream:${name}:group:default`

        const info = await getStreamInfo(client, name, streamKey)
        if (!info) {
          return { status: 404, body: { error: 'Stream not found' } }
        }

        return { status: 200, body: info }
      } catch (error) {
        return { status: 500, body: { error: error instanceof Error ? error.message : 'Unknown error' } }
      }
    },
  )

  registerApi(
    { method: 'GET', path: '/__motia/redis-streams/streams/:name/entries' },
    async (req: ApiRequest): Promise<ApiResponse> => {
      try {
        const name = req.pathParams.name as string
        const start = (req.queryParams.start as string) || '-'
        const end = (req.queryParams.end as string) || '+'
        const count = parseInt((req.queryParams.count as string) || '50', 10)
        const reverse = req.queryParams.reverse === 'true'

        const streamKey = `motia:stream:${name}:group:default`

        let rawEntries: Array<{ id: string; message: Record<string, string> }>

        if (reverse) {
          rawEntries = await client.xRevRange(streamKey, end, start, { COUNT: count })
        } else {
          rawEntries = await client.xRange(streamKey, start, end, { COUNT: count })
        }

        const entries: StreamEntry[] = rawEntries.map((entry) => {
          const [timestampMs] = entry.id.split('-')
          return {
            id: entry.id,
            timestamp: parseInt(timestampMs, 10),
            fields: entry.message,
          }
        })

        return { status: 200, body: { entries } }
      } catch (error) {
        return { status: 500, body: { error: error instanceof Error ? error.message : 'Unknown error' } }
      }
    },
  )

  registerApi(
    { method: 'POST', path: '/__motia/redis-streams/streams/:name/trim' },
    async (req: ApiRequest): Promise<ApiResponse> => {
      try {
        const name = req.pathParams.name as string
        const body = req.body as { maxLength: number }
        const maxLength = body.maxLength || 1000

        const streamKey = `motia:stream:${name}:group:default`

        await client.xTrim(streamKey, 'MAXLEN', maxLength)

        return { status: 200, body: { message: 'Stream trimmed', maxLength } }
      } catch (error) {
        return { status: 500, body: { error: error instanceof Error ? error.message : 'Unknown error' } }
      }
    },
  )
}
