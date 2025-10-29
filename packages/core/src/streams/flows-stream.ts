import { StreamAdapter } from '../adapters/interfaces/stream-adapter.interface'
import { generateFlow } from '../helper/flows-helper'
import type { LockedData } from '../locked-data'
import { PLUGIN_FLOW_ID } from '../motia'
import type { FlowResponse } from '../types/flows-types'

export class FlowsStream extends StreamAdapter<FlowResponse> {
  constructor(private readonly lockedData: LockedData) {
    super('__motia.flows')
  }

  async get(_: string, id: string): Promise<FlowResponse | null> {
    const flow = this.lockedData.flows[id]

    if (!flow) {
      return null
    }

    return generateFlow(id, flow.steps)
  }

  async delete(_: string): Promise<FlowResponse | null> {
    return null
  }

  async set(_: string, __: string, data: FlowResponse): Promise<FlowResponse> {
    return data
  }

  async getGroup(): Promise<FlowResponse[]> {
    /**
     * Get list should receive a groupId argument but that's irrelevant for this stream
     * since we only have one group of flows.
     */
    return Object.entries(this.lockedData.flows)
      .map(([id, flow]) => generateFlow(id, flow.steps))
      .filter((flow) => flow.id !== PLUGIN_FLOW_ID)
  }
}
