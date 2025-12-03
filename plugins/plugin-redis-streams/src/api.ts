import type { ApiRequest, ApiResponse, MotiaPluginContext } from '@motiadev/core'
import type { RedisClientType } from 'redis'
import { discoverStreams, getStreamInfo, makeStreamKey } from './streams/redis-streams-stream'
import type { StreamEntry } from './types/stream'

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
        const streamKey = makeStreamKey(name)

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

        const streamKey = makeStreamKey(name)

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

        const streamKey = makeStreamKey(name)

        await client.xTrim(streamKey, 'MAXLEN', maxLength)

        return { status: 200, body: { message: 'Stream trimmed', maxLength } }
      } catch (error) {
        return { status: 500, body: { error: error instanceof Error ? error.message : 'Unknown error' } }
      }
    },
  )
}
