import type { TracerAdapter } from '../adapters/interfaces/observability-adapter.interface'
import type { StreamAdapterManager } from '../adapters/interfaces/stream-adapter-manager.interface'
import type { Logger } from '../logger'
import type { Step } from '../types'
import type { MotiaStream } from '../types-stream'
import { createTrace } from './create-trace'
import { StreamTracer } from './stream-tracer'
import { TraceManager } from './trace-manager'
import type { Trace, TraceGroup } from './types'

const MAX_TRACE_GROUPS = process.env.MOTIA_MAX_TRACE_GROUPS //
  ? Number.parseInt(process.env.MOTIA_MAX_TRACE_GROUPS, 10)
  : 50

export class BaseTracerAdapter implements TracerAdapter {
  private readonly traceStream: MotiaStream<Trace>
  private readonly traceGroupStream: MotiaStream<TraceGroup>

  constructor(streamAdapterManager: StreamAdapterManager) {
    const traceAdapter = streamAdapterManager.createStream<Trace>('motia-trace')
    const traceGroupAdapter = streamAdapterManager.createStream<TraceGroup>('motia-trace-group')

    this.traceStream = traceAdapter as MotiaStream<Trace>
    this.traceGroupStream = traceGroupAdapter as MotiaStream<TraceGroup>
  }

  private async getAllGroups() {
    return await this.traceGroupStream.getGroup('default')
  }

  private async deleteGroup(group: TraceGroup) {
    const traces = await this.traceStream.getGroup(group.id)

    for (const trace of traces) {
      await this.traceStream.delete(group.id, trace.id)
    }
    await this.traceGroupStream.delete('default', group.id)
  }

  async clear() {
    const groups = await this.getAllGroups()

    for (const group of groups) {
      await this.deleteGroup(group)
    }
  }

  async createTracer(traceId: string, step: Step, logger: Logger) {
    const traceGroup: TraceGroup = {
      id: traceId,
      name: step.config.name,
      lastActivity: Date.now(),
      metadata: {
        completedSteps: 0,
        activeSteps: 0,
        totalSteps: 0,
      },
      correlationId: undefined,
      status: 'running',
      startTime: Date.now(),
    }

    const groups = await this.getAllGroups()

    if (groups.length >= MAX_TRACE_GROUPS) {
      const groupsToDelete = groups
        .sort((a, b) => a.startTime - b.startTime)
        .slice(0, groups.length - MAX_TRACE_GROUPS + 1)

      for (const group of groupsToDelete) {
        await this.deleteGroup(group)
      }
    }

    const trace = createTrace(traceGroup, step)
    const manager = new TraceManager(this.traceStream, this.traceGroupStream, traceGroup, trace)

    return new StreamTracer(manager, traceGroup, trace, logger)
  }

  async attachToTrace(traceId: string, step: Step, logger: Logger) {
    const existingGroup = await this.traceGroupStream.get('default', traceId)

    if (!existingGroup) {
      return this.createTracer(traceId, step, logger)
    }

    const trace = createTrace(existingGroup, step)
    const manager = new TraceManager(this.traceStream, this.traceGroupStream, existingGroup, trace)

    return new StreamTracer(manager, existingGroup, trace, logger)
  }
}
