import type { LockedData } from './locked-data'
import type { LoggerFactory } from './logger-factory'
import type { TracerFactory } from './observability'
import type { Printer } from './printer'
import type { EventManager, InternalStateManager } from './types'

export type Motia = {
  loggerFactory: LoggerFactory
  eventManager: EventManager
  state: InternalStateManager
  lockedData: LockedData
  printer: Printer
  tracerFactory: TracerFactory
}
