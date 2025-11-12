import { create } from 'zustand'

interface MotiaConfig {
  isDev: boolean
  isTutorialDisabled: boolean
}

interface MotiaConfigState {
  config: MotiaConfig | null
  isLoading: boolean
  error: Error | null
  fetchConfig: () => Promise<void>
}

export const useMotiaConfigStore = create<MotiaConfigState>((set, get) => ({
  config: null,
  isLoading: false,
  error: null,
  fetchConfig: async () => {
    const { config, isLoading } = get()
    if (isLoading || config) return

    set({ isLoading: true, error: null })
    try {
      const response = await fetch('/__motia')
      if (!response.ok) {
        throw new Error(`Failed to fetch Motia config: ${response.statusText}`)
      }
      const data = await response.json()
      set({ config: data, isLoading: false })
    } catch (error) {
      console.error('Failed to fetch Motia config:', error)
      set({ error: error as Error, isLoading: false })
    }
  },
}))
