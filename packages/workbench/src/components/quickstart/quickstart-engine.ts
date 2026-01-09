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

// Use a global singleton to ensure dynamically loaded UI steps share the same instance
const GLOBAL_KEY = '__MOTIA_QUICKSTART__'

declare global {
  interface Window {
    [GLOBAL_KEY]?: QuickstartEngine
  }
}

function getOrCreateQuickstartEngine(): QuickstartEngine {
  if (typeof window !== 'undefined') {
    if (!window[GLOBAL_KEY]) {
      window[GLOBAL_KEY] = new QuickstartEngine()
    }
    return window[GLOBAL_KEY]
  }
  return new QuickstartEngine()
}

export const MotiaQuickstart: QuickstartEngine = getOrCreateQuickstartEngine()
