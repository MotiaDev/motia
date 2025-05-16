import { InternalStateManager, IStateStream, BaseStateStreamData } from './types'

export type StateStreamFactory<TData extends BaseStateStreamData> = (state: InternalStateManager) => StateStream<TData>

export class StateStream<TData extends BaseStateStreamData> implements IStateStream<TData> {
  constructor(
    private readonly state: InternalStateManager,
    private readonly propertyName: string,
  ) {}

  get(id: string): Promise<TData | null> {
    return this.state.get<TData>(id, this.propertyName)
  }

  update(id: string, data: TData): Promise<TData> {
    return this.state.set(id, this.propertyName, data)
  }

  async delete(id: string): Promise<void> {
    await this.state.delete(id, this.propertyName)
  }

  create(id: string, data: TData): Promise<TData> {
    return this.state.set(id, this.propertyName, data)
  }

  getGroupId(data: TData): string | null {
    return null
  }

  async getList(groupId: string): Promise<TData[]> {
    return []
  }
}
