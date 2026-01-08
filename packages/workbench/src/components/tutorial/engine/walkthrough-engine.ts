import type { WalkthroughConfig } from './walkthrough-types'

type WalkthroughData = {
  config: WalkthroughConfig
  code: string
  language?: string
}

class Walkthrough {
  private data: WalkthroughData | null = null
  private onOpenCallbacks: ((data: WalkthroughData) => void)[] = []
  private onCloseCallbacks: (() => void)[] = []

  register(config: WalkthroughConfig, code: string, language?: string): void {
    this.data = { config, code, language }

    // Auto-start if configured
    if (config.autoStart && localStorage.getItem('motia-walkthrough-closed') !== 'true') {
      this.open()
    }
  }

  open(): void {
    if (this.data) {
      this.onOpenCallbacks.forEach((callback) => callback(this.data!))
    }
  }

  close(): void {
    localStorage.setItem('motia-walkthrough-closed', 'true')
    this.onCloseCallbacks.forEach((callback) => callback())
  }

  onOpen(callback: (data: WalkthroughData) => void): () => void {
    this.onOpenCallbacks.push(callback)
    return (): void => {
      this.onOpenCallbacks = this.onOpenCallbacks.filter((cb) => cb !== callback)
    }
  }

  onClose(callback: () => void): () => void {
    this.onCloseCallbacks.push(callback)
    return (): void => {
      this.onCloseCallbacks = this.onCloseCallbacks.filter((cb) => cb !== callback)
    }
  }

  getData(): WalkthroughData | null {
    return this.data
  }

  reset(): void {
    localStorage.removeItem('motia-walkthrough-closed')
  }
}

export const MotiaWalkthrough: Walkthrough = new Walkthrough()
