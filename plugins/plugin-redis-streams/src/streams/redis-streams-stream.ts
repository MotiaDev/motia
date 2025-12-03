import { StreamAdapter } from '@motiadev/core'
import type { RedisClientType } from 'redis'
import type { StreamInfo } from '../types/stream'

type StreamInfoWithId = StreamInfo & { id: string }

const STREAM_KEY_PATTERN = 'motia:stream:*:group:*'

export const makeStreamKey = (name: string, groupId = 'default'): string => {
  return `motia:stream:${name}:group:${groupId}`
}

export const getStreamInfo = async (client: RedisClientType, name: string, key: string): Promise<StreamInfo | null> => {
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

export const discoverStreams = async (client: RedisClientType): Promise<StreamInfo[]> => {
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

export class RedisStreamsStream extends StreamAdapter<StreamInfoWithId> {
  private client: RedisClientType
  private onStreamUpdate?: (streamInfo: StreamInfoWithId) => void

  constructor(client: RedisClientType) {
    super('__motia.redis-streams')
    this.client = client
  }

  setUpdateCallback(callback: (streamInfo: StreamInfoWithId) => void): void {
    this.onStreamUpdate = callback
  }

  async get(_groupId: string, id: string): Promise<StreamInfoWithId | null> {
    const key = makeStreamKey(id)
    const info = await getStreamInfo(this.client, id, key)
    return info ? { ...info, id: info.name } : null
  }

  async set(_groupId: string, _id: string, data: StreamInfoWithId): Promise<StreamInfoWithId> {
    return data
  }

  async delete(_groupId: string, _id: string): Promise<StreamInfoWithId | null> {
    return null
  }

  async getGroup(_groupId: string): Promise<StreamInfoWithId[]> {
    const streams = await discoverStreams(this.client)
    return streams.map((stream) => ({ ...stream, id: stream.name }))
  }

  async discoverAndSetupStreams(): Promise<void> {
    const streams = await discoverStreams(this.client)
    for (const stream of streams) {
      this.onStreamUpdate?.({ ...stream, id: stream.name })
    }
  }
}
