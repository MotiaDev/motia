import type { Tracer } from '../adapters/interfaces'
export class NoTracer implements Tracer {
  end() {}
  stateOperation() {}
  emitOperation() {}
  streamOperation() {}
  clear() {}
  child() {
    return this
  }
}
