import type { Tracer } from '.'

export class NoTracer implements Tracer {
  end() {}
  stateOperation() {}
  emitOperation() {}
  streamOperation() {}
  child() {
    return this
  }
}
