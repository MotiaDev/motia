import type { Express } from 'express'
import { LockedData } from './locked-data'
import { LoggerFactory } from './logger-factory'
import { TracerFactory } from './observability'
import { Printer } from './printer'
import { StateAdapter } from './state/state-adapter'
import { EventManager, InternalStateManager } from './types'

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
