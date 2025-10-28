import {
  createDefaultObservabilityAdapter,
  DefaultObservabilityAdapter,
} from '../adapters/default-observability-adapter'
import type { LockedData } from '../locked-data'
import type { TracerFactory } from '.'

export { DefaultObservabilityAdapter as BaseTracerFactory }

export const createTracerFactory = (lockedData: LockedData): TracerFactory => {
  return createDefaultObservabilityAdapter(lockedData)
}
