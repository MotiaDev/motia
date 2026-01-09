type QuickstartCallback = () => void

class QuickstartEngine {
  private onStartCallbacks: QuickstartCallback[] = []

  onStart(callback: QuickstartCallback) {
    this.onStartCallbacks.push(callback)
    return (): void => {
      this.onStartCallbacks = this.onStartCallbacks.filter((cb) => cb !== callback)
    }
  }

  start(): void {
    this.onStartCallbacks.forEach((callback) => callback())
  }
}

export const MotiaQuickstart: QuickstartEngine = new QuickstartEngine()
