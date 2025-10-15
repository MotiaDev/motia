import type { Express } from 'express'
import type { LockedData } from './locked-data'
import type { LoggerFactory } from './logger-factory'
import type { TracerFactory } from './observability'
import type { Printer } from './printer'
import type { StateAdapter } from './state/state-adapter'
import type { EventManager, InternalStateManager } from './types'

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

export type MotiaPluginContext = {
  app: Express
  state: StateAdapter
  lockedData: LockedData
}
