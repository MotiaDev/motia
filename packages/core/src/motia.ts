import { Printer } from './printer'
import { TracerFactory } from './observability'
import { EventManager, InternalStateManager } from './types'
import { LockedData } from './locked-data'
import { LoggerFactory } from './logger-factory'

export type Motia = {
  loggerFactory: LoggerFactory
  eventManager: EventManager
  state: InternalStateManager
  lockedData: LockedData
  printer: Printer
  tracerFactory: TracerFactory
}
