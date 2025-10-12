import { LockedData } from './locked-data'
import { LoggerFactory } from './logger-factory'
import { TracerFactory } from './observability'
import { Printer } from './printer'
import { StorageService } from './services/storage-service'
import { EventManager, InternalStateManager } from './types'

export type Motia = {
  loggerFactory: LoggerFactory
  eventManager: EventManager
  state: InternalStateManager
  lockedData: LockedData
  printer: Printer
  tracerFactory: TracerFactory
  storage?: StorageService
}
