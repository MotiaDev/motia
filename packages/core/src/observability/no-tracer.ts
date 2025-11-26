import type { Tracer } from '../observability/index'

export class NoTracer implements Tracer {
  async end() {
    return Promise.resolve()
  }
  async stateOperation() {
    return Promise.resolve()
  }
  async emitOperation() {
    return Promise.resolve()
  }
  async streamOperation() {
    return Promise.resolve()
  }
  clear() {}
  child() {
    return this
  }
}
