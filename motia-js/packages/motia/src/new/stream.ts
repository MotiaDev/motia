import type { StreamSetResult, UpdateOp } from 'iii-sdk/stream'
import type { StreamConfig } from '../types-stream'
import { getInstance } from './iii'
import { withSpan, SpanStatusCode } from 'iii-sdk/telemetry'

export class Stream<TData> {
  constructor(readonly config: StreamConfig) {}

  async get(groupId: string, itemId: string): Promise<TData | null> {
    return withSpan('stream::get', {}, async (span) => {
      span.setAttribute('motia.stream.name', this.config.name)
      span.setAttribute('motia.stream.group_id', groupId)
      span.setAttribute('motia.stream.item_id', itemId)
      try {
        return await getInstance().call('stream::get', {
          stream_name: this.config.name,
          group_id: groupId,
          item_id: itemId,
        }) as TData | null
      } catch (err) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: String(err) })
        span.recordException(err as Error)
        throw err
      }
    })
  }

  async set(groupId: string, itemId: string, data: TData): Promise<StreamSetResult<TData> | null> {
    return withSpan('stream::set', {}, async (span) => {
      span.setAttribute('motia.stream.name', this.config.name)
      span.setAttribute('motia.stream.group_id', groupId)
      span.setAttribute('motia.stream.item_id', itemId)
      try {
        return await getInstance().call('stream::set', {
          stream_name: this.config.name,
          group_id: groupId,
          item_id: itemId,
          data,
        }) as StreamSetResult<TData> | null
      } catch (err) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: String(err) })
        span.recordException(err as Error)
        throw err
      }
    })
  }

  async delete(groupId: string, itemId: string): Promise<void> {
    return withSpan('stream::delete', {}, async (span) => {
      span.setAttribute('motia.stream.name', this.config.name)
      span.setAttribute('motia.stream.group_id', groupId)
      span.setAttribute('motia.stream.item_id', itemId)
      try {
        return await getInstance().call('stream::delete', {
          stream_name: this.config.name,
          group_id: groupId,
          item_id: itemId,
        }) as void
      } catch (err) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: String(err) })
        span.recordException(err as Error)
        throw err
      }
    })
  }

  async list(groupId: string): Promise<TData[]> {
    return withSpan('stream::list', {}, async (span) => {
      span.setAttribute('motia.stream.name', this.config.name)
      span.setAttribute('motia.stream.group_id', groupId)
      try {
        return await getInstance().call('stream::list', {
          stream_name: this.config.name,
          group_id: groupId,
        }) as TData[]
      } catch (err) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: String(err) })
        span.recordException(err as Error)
        throw err
      }
    })
  }

  async update(groupId: string, itemId: string, ops: UpdateOp[]): Promise<StreamSetResult<TData> | null> {
    return withSpan('stream::update', {}, async (span) => {
      span.setAttribute('motia.stream.name', this.config.name)
      span.setAttribute('motia.stream.group_id', groupId)
      span.setAttribute('motia.stream.item_id', itemId)
      try {
        return await getInstance().call('stream::update', {
          stream_name: this.config.name,
          group_id: groupId,
          item_id: itemId,
          ops,
        }) as StreamSetResult<TData> | null
      } catch (err) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: String(err) })
        span.recordException(err as Error)
        throw err
      }
    })
  }

  async listGroups(): Promise<string[]> {
    return withSpan('stream::list_groups', {}, async (span) => {
      span.setAttribute('motia.stream.name', this.config.name)
      try {
        return await getInstance().call('stream::list_groups', {
          stream_name: this.config.name,
        }) as string[]
      } catch (err) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: String(err) })
        span.recordException(err as Error)
        throw err
      }
    })
  }
}
