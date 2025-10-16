import { Printer } from './printer'
import { TracerFactory } from './observability'
import { EventManager, InternalStateManager } from './types'
import { LockedData } from './locked-data'
import { LoggerFactory } from './logger-factory'
import type { Express } from 'express'
import { StateAdapter } from './state/state-adapter'

export type Motia = {
  loggerFactory: LoggerFactory
  eventManager: EventManager
  state: InternalStateManager
  lockedData: LockedData
  printer: Printer
  tracerFactory: TracerFactory

  app: Express
  stateAdapter: StateAdapter
}
