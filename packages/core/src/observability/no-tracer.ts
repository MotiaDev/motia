import type { Tracer } from '../observability/index'

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
