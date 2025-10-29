import type { LockedData } from '../locked-data'
import type { Logger } from '../logger'
import type { Step } from '../types'
import type { MotiaStream } from '../types-stream'
import type { TracerFactory } from '.'
import { createTrace } from './create-trace'
import { StreamTracer } from './stream-tracer'
import { TraceManager } from './trace-manager'
import { TraceStreamAdapter } from './trace-stream-adapter'
import type { Trace, TraceGroup } from './types'

const MAX_TRACE_GROUPS = process.env.MOTIA_MAX_TRACE_GROUPS //
  ? parseInt(process.env.MOTIA_MAX_TRACE_GROUPS)
  : 50

export class BaseTracerFactory implements TracerFactory {
  constructor(
    private readonly traceStream: MotiaStream<Trace>,
    private readonly traceGroupStream: MotiaStream<TraceGroup>,
  ) {}

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
        .sort((a, b) => a.startTime - b.startTime) // date ascending
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

export const createTracerFactory = (lockedData: LockedData): TracerFactory => {
  const streamAdapter = lockedData.streamAdapter === 'file' ? 'file' : 'memory'
  const traceStreamName = 'motia-trace'
  const traceStreamAdapter = new TraceStreamAdapter<Trace>(lockedData.baseDir, traceStreamName, streamAdapter)
  const traceStream = lockedData.createStream<Trace>({
    filePath: traceStreamName,
    hidden: true,
    config: {
      name: traceStreamName,
      baseConfig: { storageType: 'custom', factory: () => traceStreamAdapter },
      schema: null as never,
    },
  })()

  const traceGroupName = 'motia-trace-group'
  const traceGroupStreamAdapter = new TraceStreamAdapter<TraceGroup>(lockedData.baseDir, traceGroupName, streamAdapter)
  const traceGroupStream = lockedData.createStream<TraceGroup>({
    filePath: traceGroupName,
    hidden: true,
    config: {
      name: traceGroupName,
      baseConfig: { storageType: 'custom', factory: () => traceGroupStreamAdapter },
      schema: null as never,
    },
  })()

  return new BaseTracerFactory(traceStream, traceGroupStream)
}
