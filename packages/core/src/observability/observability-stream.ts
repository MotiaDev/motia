import { StateStream } from '../state-stream'
import { ObservabilityEvent } from './types'
import { BaseStreamItem } from '../types-stream'

export class ObservabilityStream extends StateStream<ObservabilityEvent> {
  get = async (): Promise<BaseStreamItem<ObservabilityEvent> | null> => null
  delete = async (): Promise<BaseStreamItem<ObservabilityEvent> | null> => null
  getGroup = async (): Promise<BaseStreamItem<ObservabilityEvent>[]> => []

  async set(_: string, id: string, data: ObservabilityEvent): Promise<BaseStreamItem<ObservabilityEvent> | null> {
    const streamItem: BaseStreamItem<ObservabilityEvent> = { ...data, id }
    await this.send({ groupId: 'observability' }, { type: 'observability_event', data: streamItem })
    return streamItem
  }
} 