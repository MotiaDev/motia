import { generateFlow } from '../helper/flows-helper'
import type { LockedData } from '../locked-data'
import type { FlowResponse } from '../types/flows-types'
import { StreamAdapter } from './adapters/stream-adapter'

export class FlowsStream extends StreamAdapter<FlowResponse> {
  constructor(private readonly lockedData: LockedData) {
    super()
  }

  async get(_: string, id: string): Promise<FlowResponse | null> {
    const flow = this.lockedData.flows[id]

    if (!flow) {
      return null
    }

    return generateFlow(id, flow.steps)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    return Object.entries(this.lockedData.flows).map(([id, flow]) => generateFlow(id, flow.steps))
  }
}
